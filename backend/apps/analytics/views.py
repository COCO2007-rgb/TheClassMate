from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum

from students.models import Student
from core.models import Batch
from attendance.models import AttendanceSheet, StudentAttendance
from fees.models import Payment
from services import get_user_student
from datetime import datetime, timezone

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request):
    s_doc = get_user_student(request.user)
    if s_doc:
        total_stus = 1
        total_bats = s_doc.batches.filter(is_archived=False).count()
        
        # Calculate fees collected for this student
        fees_sum = Payment.objects.filter(student=s_doc).aggregate(total=Sum("amount"))["total"]
        collected = fees_sum if fees_sum is not None else 0.0
        
        # Calculate attendance rate in a single database roundtrip
        student_batches = s_doc.batches.filter(is_archived=False)
        attendance_records = list(StudentAttendance.objects.filter(
            sheet__batch__in=student_batches,
            student=s_doc
        ).values_list("status", flat=True))
        
        working = len(attendance_records)
        present = sum(1 for status in attendance_records if status in ["Present", "Late", "Half Day"])
        
        att_rate = f"{round((present / working) * 100)}%" if working > 0 else "100%"
        
        return Response({
            "total_students": total_stus,
            "total_batches": total_bats,
            "today_attendance": att_rate,
            "fees_collected": collected
        })

    # Teacher / Developer dashboard metrics
    queryset_students = Student.objects.filter(is_archived=False)
    queryset_batches = Batch.objects.filter(is_archived=False)
    
    if request.user.role != "developer":
        queryset_students = queryset_students.filter(coaching_center=request.user.coaching_center)
        queryset_batches = queryset_batches.filter(coaching_center=request.user.coaching_center)
        
    total_stus = queryset_students.count()
    total_bats = queryset_batches.count()
    
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    att_sheets = AttendanceSheet.objects.filter(date=today_str)
    if request.user.role != "developer":
        att_sheets = att_sheets.filter(coaching_center=request.user.coaching_center)
        
    att_sheet = att_sheets.first()
    att_rate = "94%"  # Default placeholder from original view
    
    if att_sheet:
        total_records = att_sheet.records.count()
        if total_records > 0:
            p_count = att_sheet.records.filter(status="Present").count()
            att_rate = f"{round((p_count / total_records) * 100)}%"
            
    # Calculate monthly revenue
    this_month = datetime.now(timezone.utc).strftime("%Y-%m")
    payments_queryset = Payment.objects.filter(date__startswith=this_month)
    if request.user.role != "developer":
        payments_queryset = payments_queryset.filter(coaching_center=request.user.coaching_center)
        
    revenue_sum = payments_queryset.aggregate(total=Sum("amount"))["total"]
    collected = revenue_sum if revenue_sum is not None else 0.0
        
    return Response({
        "total_students": total_stus,
        "total_batches": total_bats,
        "today_attendance": att_rate,
        "fees_collected": collected
    })
