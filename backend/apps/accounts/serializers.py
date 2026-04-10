from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from apps.citizens.models import Constituency


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    constituency_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'role', 'first_name', 'last_name', 
                  'phone', 'user_type', 'telegram_user_id', 'telegram_chat_id', 'is_staff', 'is_superuser', 'is_active', 'constituency_name')
        read_only_fields = ('id', 'is_staff', 'is_superuser')

    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username

    def get_role(self, obj):
        if obj.is_superuser or obj.is_staff:
            return 'admin'
        return obj.user_type

    def get_constituency_name(self, obj):
        """Return constituency name for citizen and deputy users, None for admin users"""
        if obj.is_superuser or obj.is_staff:
            return None
        
        try:
            if obj.user_type == 'citizen' and hasattr(obj, 'citizen_profile'):
                if obj.citizen_profile.constituency:
                    return obj.citizen_profile.constituency.name
            elif obj.user_type == 'deputy' and hasattr(obj, 'deputy_profile'):
                if obj.deputy_profile.constituency:
                    return obj.deputy_profile.constituency.name
        except Exception:
            pass
        
        return None


class AdminUserSerializer(UserSerializer):
    password = serializers.CharField(write_only=True, required=False)
    deputy_profile_id = serializers.SerializerMethodField()
    constituency_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ('password', 'deputy_profile_id', 'constituency_id')

    def get_deputy_profile_id(self, obj):
        """Return the deputy profile ID if user is a deputy"""
        try:
            if hasattr(obj, 'deputy_profile'):
                return str(obj.deputy_profile.id)
        except Exception:
            pass
        return None

    def to_representation(self, instance):
        """Add constituency_id to the serialized output"""
        data = super().to_representation(instance)
        
        # Add constituency_id based on user type
        if instance.user_type == 'citizen':
            try:
                if hasattr(instance, 'citizen_profile') and instance.citizen_profile.constituency:
                    data['constituency_id'] = str(instance.citizen_profile.constituency.id)
            except Exception:
                pass
        elif instance.user_type == 'deputy':
            try:
                if hasattr(instance, 'deputy_profile') and instance.deputy_profile.constituency:
                    data['constituency_id'] = str(instance.deputy_profile.constituency.id)
            except Exception:
                pass
                
        return data

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        constituency_id = validated_data.pop('constituency_id', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        
        # Create profiles
        from apps.citizens.models import Citizen
        from apps.deputies.models import Deputy
        
        if user.user_type == 'citizen':
            citizen_defaults = {'full_name': user.get_full_name(), 'phone': user.phone or ''}
            if constituency_id:
                try:
                    constituency = Constituency.objects.get(id=constituency_id)
                    citizen_defaults['constituency'] = constituency
                    # Assign deputy from the same constituency
                    deputy = Deputy.objects.filter(constituency=constituency, is_active=True).first()
                    if deputy:
                        citizen_defaults['assigned_deputy'] = deputy
                    else:
                        citizen_defaults['assigned_deputy'] = Deputy.objects.filter(is_active=True).order_by('?').first()
                except Constituency.DoesNotExist:
                    citizen_defaults['assigned_deputy'] = Deputy.objects.filter(is_active=True).order_by('?').first()
            else:
                citizen_defaults['assigned_deputy'] = Deputy.objects.filter(is_active=True).order_by('?').first()
            
            Citizen.objects.get_or_create(user=user, defaults=citizen_defaults)
            
        elif user.user_type == 'deputy':
            deputy_defaults = {'full_name': user.get_full_name()}
            if constituency_id:
                try:
                    deputy_defaults['constituency'] = Constituency.objects.get(id=constituency_id)
                except Constituency.DoesNotExist:
                    pass
            Deputy.objects.get_or_create(user=user, defaults=deputy_defaults)
            
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        constituency_id = validated_data.pop('constituency_id', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
            
        # Ensure profile exists for user_type and update constituency
        from apps.citizens.models import Citizen
        from apps.deputies.models import Deputy
        
        if user.user_type == 'citizen':
            citizen, created = Citizen.objects.get_or_create(
                user=user,
                defaults={
                    'full_name': user.get_full_name(),
                    'phone': user.phone or '',
                    'assigned_deputy': Deputy.objects.filter(is_active=True).order_by('?').first()
                }
            )

            # Always sync phone and name from User to Citizen profile
            sync_changed = False
            if user.phone and citizen.phone != user.phone:
                citizen.phone = user.phone
                sync_changed = True
            full_name = user.get_full_name()
            if full_name and full_name != user.username and citizen.full_name != full_name:
                citizen.full_name = full_name
                sync_changed = True
            if sync_changed:
                citizen.save()

            # Update constituency if provided
            if constituency_id is not None:
                if constituency_id:
                    try:
                        constituency = Constituency.objects.get(id=constituency_id)
                        citizen.constituency = constituency
                        # Update assigned deputy based on constituency
                        deputy = Deputy.objects.filter(constituency=constituency, is_active=True).first()
                        if deputy:
                            citizen.assigned_deputy = deputy
                        citizen.save()
                    except Constituency.DoesNotExist:
                        pass
                else:
                    # Remove constituency
                    citizen.constituency = None
                    citizen.save()
                    
        elif user.user_type == 'deputy':
            deputy, created = Deputy.objects.get_or_create(user=user, defaults={'full_name': user.get_full_name()})
            
            # Update constituency if provided
            if constituency_id is not None:
                if constituency_id:
                    try:
                        deputy.constituency = Constituency.objects.get(id=constituency_id)
                        deputy.save()
                    except Constituency.DoesNotExist:
                        pass
                else:
                    # Remove constituency
                    deputy.constituency = None
                    deputy.save()
            
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            
            if user:
                if not user.is_active:
                    raise serializers.ValidationError('Учетная запись пользователя отключена.')
                attrs['user'] = user
            else:
                raise serializers.ValidationError('Неверное имя пользователя или пароль.')
        else:
            raise serializers.ValidationError('Имя пользователя и пароль обязательны.')
        
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'user_type')
        extra_kwargs = {'password': {'write_only': True}}
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Ensure user_type is citizen for self-registration
        validated_data['user_type'] = 'citizen'
        
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create citizen profile for new user
        from apps.citizens.models import Citizen
        from apps.deputies.models import Deputy
        Citizen.objects.get_or_create(
            user=user,
            defaults={
                'full_name': user.get_full_name(),
                'assigned_deputy': Deputy.objects.filter(is_active=True).order_by('?').first()
            }
        )
        
        return user