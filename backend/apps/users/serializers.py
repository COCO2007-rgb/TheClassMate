from rest_framework import serializers
from users.models import User, CoachingCenter

class CoachingCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoachingCenter
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'mobile', 'coaching_center', 'student_id', 'must_change_password']
