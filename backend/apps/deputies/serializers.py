from rest_framework import serializers
from .models import Deputy, DeputyConstituency, DeputySpecialization
from apps.accounts.serializers import UserSerializer


class DeputySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Deputy
        fields = '__all__'
        read_only_fields = ('deputy_id', 'user', 'created_at', 'updated_at')


class DeputyConstituencySerializer(serializers.ModelSerializer):
    class Meta:
        model = DeputyConstituency
        fields = '__all__'
        read_only_fields = ('id', 'created_at')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make deputy read-only for non-admin users
        request = self.context.get('request')
        if request and not request.user.is_staff:
            self.fields['deputy'].read_only = True


class DeputySpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeputySpecialization
        fields = '__all__'
        read_only_fields = ('id', 'deputy')


class DeputyRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for deputy registration that creates both User and Deputy records.
    """
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username')
    password = serializers.CharField(source='user.password', write_only=True)
    
    class Meta:
        model = Deputy
        fields = ('email', 'username', 'password', 'position', 'department', 'constituency', 'start_date', 'end_date')
    
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        password = user_data.pop('password')
        
        # Create the user
        user = User.objects.create_user(**user_data)
        user.set_password(password)
        user.user_type = 'deputy'
        user.save()
        
        # Create the deputy profile
        deputy = Deputy.objects.create(user=user, **validated_data)
        
        return deputy