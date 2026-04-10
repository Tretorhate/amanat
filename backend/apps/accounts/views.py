from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import permission_required
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login
import json
import csv
from io import StringIO
from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
from apps.citizens.models import Citizen, Constituency
from apps.deputies.models import Deputy
import os
import hmac
import hashlib
import time
import random
import logging
from urllib.parse import parse_qs
from django.conf import settings as django_settings
from django.core.cache import cache





class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Return success response
            user_serializer = UserSerializer(user)
            return Response({
                'user': user_serializer.data,
                'message': 'Registration successful'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.permissions import AllowAny

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            login(request, user)
            
            # Generate JWT tokens
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            user_serializer = UserSerializer(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': user_serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    user_serializer = UserSerializer(request.user)
    return Response(user_serializer.data)


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_serializer = UserSerializer(request.user)
        return Response(user_serializer.data)


logger = logging.getLogger(__name__)


class TelegramAuthView(APIView):
    """Authenticate user via Telegram WebApp initData."""
    permission_classes = [AllowAny]

    def post(self, request):
        init_data = request.data.get('init_data', '')
        if not init_data:
            return Response(
                {'error': 'init_data is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        bot_token = getattr(django_settings, 'TELEGRAM_BOT_TOKEN', '')
        if not bot_token:
            return Response(
                {'error': 'Telegram bot not configured'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Parse and validate initData
        parsed = parse_qs(init_data, keep_blank_values=True)
        received_hash = parsed.pop('hash', [None])[0]
        if not received_hash:
            return Response(
                {'error': 'Invalid init_data: missing hash'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build data-check-string (sorted key=value pairs joined by \n)
        data_check_pairs = []
        for key in sorted(parsed.keys()):
            data_check_pairs.append(f"{key}={parsed[key][0]}")
        data_check_string = '\n'.join(data_check_pairs)

        # HMAC-SHA256 validation
        secret_key = hmac.new(b'WebAppData', bot_token.encode(), hashlib.sha256).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if computed_hash != received_hash:
            return Response(
                {'error': 'Invalid init_data: hash mismatch'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check auth_date freshness (5 minutes)
        auth_date = parsed.get('auth_date', [None])[0]
        if auth_date:
            try:
                if int(time.time()) - int(auth_date) > 300:
                    return Response(
                        {'error': 'init_data expired'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except ValueError:
                pass

        # Extract telegram user id
        user_json = parsed.get('user', [None])[0]
        if not user_json:
            return Response(
                {'error': 'Invalid init_data: missing user'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            tg_user = json.loads(user_json)
            telegram_user_id = tg_user.get('id')
        except (json.JSONDecodeError, AttributeError):
            return Response(
                {'error': 'Invalid init_data: bad user JSON'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not telegram_user_id:
            return Response(
                {'error': 'Invalid init_data: missing user id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find user by telegram_user_id (deputies have it on User model)
        user = None
        try:
            user = User.objects.get(telegram_user_id=telegram_user_id)
        except User.DoesNotExist:
            pass

        # If not found on User, check Citizen model (citizens linked via phone)
        if not user:
            try:
                from apps.citizens.models import Citizen
                citizen = Citizen.objects.get(telegram_user_id=telegram_user_id)
                if citizen.user:
                    user = citizen.user
                    # Sync telegram_user_id to User model for future lookups
                    if not user.telegram_user_id:
                        user.telegram_user_id = telegram_user_id
                        user.save(update_fields=['telegram_user_id'])
                else:
                    return Response(
                        {'error': 'Вы не зарегистрированы в системе. Обратитесь к администратору.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Exception:
                pass

        if not user:
            return Response(
                {'error': 'Вы не зарегистрированы в системе. Обратитесь к администратору.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generate JWT tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        user_serializer = UserSerializer(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user_serializer.data
        })


class GenerateTelegramLinkCodeView(APIView):
    """Generate a one-time code for deputies to link their Telegram account."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.user_type != 'deputy':
            return Response(
                {'error': 'Only deputies can generate link codes'},
                status=status.HTTP_403_FORBIDDEN
            )

        code = str(random.randint(100000, 999999))
        cache.set(f'telegram_link:{code}', str(request.user.id), timeout=300)

        return Response({'code': code})


class VerifyTelegramLinkCodeView(APIView):
    """Verify a link code and bind Telegram account to deputy."""
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code', '')
        telegram_user_id = request.data.get('telegram_user_id')
        telegram_chat_id = request.data.get('telegram_chat_id')

        if not all([code, telegram_user_id, telegram_chat_id]):
            return Response(
                {'error': 'code, telegram_user_id, and telegram_chat_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_id = cache.get(f'telegram_link:{code}')
        if not user_id:
            return Response(
                {'error': 'Invalid or expired code'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update user Telegram fields
        user.telegram_user_id = telegram_user_id
        user.telegram_chat_id = telegram_chat_id
        user.save()

        # Update deputy telegram_chat_id
        try:
            deputy = user.deputy_profile
            deputy.telegram_chat_id = telegram_chat_id
            deputy.save()
        except Exception as e:
            logger.warning(f"Could not update deputy profile: {e}")

        # Delete the used code
        cache.delete(f'telegram_link:{code}')

        return Response({'status': 'success', 'message': 'Telegram account linked successfully'})