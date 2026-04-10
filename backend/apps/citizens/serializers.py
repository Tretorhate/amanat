from rest_framework import serializers
from .models import Citizen, CitizenDocument, Constituency
from apps.accounts.serializers import UserSerializer


class CitizenSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Citizen
        fields = '__all__'
        read_only_fields = ('citizen_id', 'user', 'created_at', 'updated_at')


class CitizenDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CitizenDocument
        fields = '__all__'
        read_only_fields = ('created_at',)
    
    def validate_expiry_date(self, value):
        if value and value < self.instance.citizen.date_of_birth if self.instance else None:
            raise serializers.ValidationError("Expiry date cannot be before the citizen's date of birth.")
        return value


class ConstituencySerializer(serializers.ModelSerializer):
    """Serializer for constituency information"""
    
    class Meta:
        model = Constituency
        fields = ['id', 'name', 'region', 'district', 'description', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class CitizenRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for citizen registration that creates both User and Citizen records.
    """
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username')
    password = serializers.CharField(source='user.password', write_only=True)
    
    class Meta:
        model = Citizen
        fields = ('email', 'username', 'password', 'national_id', 'date_of_birth', 'gender', 'address', 'district', 'region')
    
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        password = user_data.pop('password')
        
        # Create the user
        user = User.objects.create_user(**user_data)
        user.set_password(password)
        user.user_type = 'citizen'
        user.save()
        
        # Create the citizen profile
        citizen = Citizen.objects.create(user=user, **validated_data)
        
        return citizen