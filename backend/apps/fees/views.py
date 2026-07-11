from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from fees.models import Payment
from students.models import Student
from users.views import log_activity_db
from fees.serializers import PaymentSerializer
from services import get_user_student

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def payments_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            queryset = Payment.objects.filter(student=s_doc).select_related("student").order_by("-date")
        else:
            queryset = Payment.objects.all().select_related("student").order_by("-date")
            if request.user.role != "developer":
                queryset = queryset.filter(coaching_center=request.user.coaching_center)
                
        serializer = PaymentSerializer(queryset, many=True)
        return Response(serializer.data)
        
    elif request.method == "POST":
        s_doc = get_user_student(request.user)
        if request.user.role != "teacher" and not s_doc:
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data.copy()
        
        if s_doc:
            data["student"] = s_doc.id
            data["coaching_center"] = s_doc.coaching_center.id
        else:
            student_id = data.get("student_id") or data.get("student")
            if student_id:
                student = Student.objects.filter(id=student_id).first()
                if not student:
                    return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
                if request.user.role != "developer" and student.coaching_center != request.user.coaching_center:
                    return Response({"error": "Access denied. Student belongs to another coaching center."}, status=status.HTTP_403_FORBIDDEN)
                data["student"] = student.id
                data["coaching_center"] = student.coaching_center.id
            else:
                return Response({"error": "Student ID is required"}, status=status.HTTP_400_BAD_REQUEST)
                
        # Generate receipt ID
        total_payments_count = Payment.objects.count()
        receipt_id = f"REC-{2000 + total_payments_count + 1}"
        data["receipt_id"] = receipt_id
        
        serializer = PaymentSerializer(data=data)
        if serializer.is_valid():
            with transaction.atomic():
                payment = serializer.save()
                log_activity_db(request.user.email, "Fee Paid", f"Collected fee payment: Receipt {payment.receipt_id}")
                return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
