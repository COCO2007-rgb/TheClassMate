from rest_framework import serializers
from fees.models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_code = serializers.CharField(source='student.student_id', read_only=True)
    id = serializers.CharField(read_only=True)
    method = serializers.CharField(source='payment_method', required=False)

    class Meta:
        model = Payment
        fields = ['id', 'student', 'student_name', 'student_code', 'coaching_center', 'amount', 'date', 'due_date', 'paid_date', 'status', 'payment_method', 'method', 'month', 'receipt_id', 'remarks']
