from rest_framework import serializers
from fees.models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_code = serializers.CharField(source='student.student_id', read_only=True)
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
