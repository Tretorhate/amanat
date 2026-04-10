from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Deputy, DeputyConstituency, DeputySpecialization
from .serializers import DeputySerializer, DeputyConstituencySerializer, DeputySpecializationSerializer, DeputyRegistrationSerializer


class DeputyDetailView(generics.RetrieveUpdateAPIView):
    queryset = Deputy.objects.all()
    serializer_class = DeputySerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Return the deputy profile of the authenticated user
        try:
            return self.request.user.deputy_profile
        except Deputy.DoesNotExist:
            return Response(
                {'error': 'Deputy profile does not exist'},
                status=status.HTTP_404_NOT_FOUND
            )


class DeputyConstituencyListView(generics.ListCreateAPIView):
    serializer_class = DeputyConstituencySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Admins see all constituencies, deputies see only their own
        if self.request.user.is_staff:
            return DeputyConstituency.objects.all()

        try:
            deputy = self.request.user.deputy_profile
            return DeputyConstituency.objects.filter(deputy=deputy)
        except Deputy.DoesNotExist:
            return DeputyConstituency.objects.none()

    def perform_create(self, serializer):
        # If deputy not provided (non-admin), auto-set to current user's deputy profile
        if 'deputy' not in serializer.validated_data:
            try:
                deputy = self.request.user.deputy_profile
                serializer.save(deputy=deputy)
            except Deputy.DoesNotExist:
                return Response(
                    {'error': 'Deputy profile does not exist'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Admin provided deputy explicitly
            serializer.save()


class DeputyConstituencyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DeputyConstituencySerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        # Admins see all constituencies, deputies see only their own
        if self.request.user.is_staff:
            return DeputyConstituency.objects.all()

        try:
            deputy = self.request.user.deputy_profile
            return DeputyConstituency.objects.filter(deputy=deputy)
        except Deputy.DoesNotExist:
            return DeputyConstituency.objects.none()


class DeputySpecializationListView(generics.ListCreateAPIView):
    serializer_class = DeputySpecializationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Admins see all specializations, deputies see only their own
        if self.request.user.is_staff:
            return DeputySpecialization.objects.all()

        try:
            deputy = self.request.user.deputy_profile
            return DeputySpecialization.objects.filter(deputy=deputy)
        except Deputy.DoesNotExist:
            return DeputySpecialization.objects.none()

    def perform_create(self, serializer):
        # Auto-set the deputy to the current user's deputy profile
        try:
            deputy = self.request.user.deputy_profile
            serializer.save(deputy=deputy)
        except Deputy.DoesNotExist:
            return Response(
                {'error': 'Deputy profile does not exist'},
                status=status.HTTP_404_NOT_FOUND
            )


class DeputySpecializationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DeputySpecializationSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        # Admins see all specializations, deputies see only their own
        if self.request.user.is_staff:
            return DeputySpecialization.objects.all()

        try:
            deputy = self.request.user.deputy_profile
            return DeputySpecialization.objects.filter(deputy=deputy)
        except Deputy.DoesNotExist:
            return DeputySpecialization.objects.none()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_deputy(request):
    """
    API endpoint to register a new deputy.
    """
    serializer = DeputyRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        deputy = serializer.save()
        return Response(
            DeputySerializer(deputy).data, 
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)