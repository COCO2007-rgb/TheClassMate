from django.db.models import Prefetch
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from attendance.models import AttendanceSheet, StudentAttendance
from core.models import Batch
from students.models import Student
from users.views import log_activity_db
from attendance.serializers import AttendanceSheetSerializer
from services import get_user_student

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def attendance_view(request):
    if request.method == "GET":
        batch_id = request.query_params.get("batch_id")
        date = request.query_params.get("date")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        
        if not batch_id:
            return Response({"error": "batch_id parameter required"}, status=status.HTTP_400_BAD_REQUEST)
            
        batch = Batch.objects.filter(id=batch_id, is_archived=False).first()
        if not batch:
            return Response({"error": "Batch not found"}, status=status.HTTP_404_NOT_FOUND)
            
        s_doc = get_user_student(request.user)
        if s_doc:
            if batch not in s_doc.batches.all():
                return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role != "developer" and batch.coaching_center != request.user.coaching_center:
            return Response({"error": "Access denied to batch"}, status=status.HTTP_403_FORBIDDEN)
            
        if date:
            sheet = AttendanceSheet.objects.filter(batch_id=batch_id, date=date).prefetch_related(
                Prefetch("records", queryset=StudentAttendance.objects.all().select_related("student"))
            ).first()
            if not sheet:
                return Response({"records": []})
                
            serializer = AttendanceSheetSerializer(sheet)
            data = serializer.data
            if s_doc:
                data["records"] = [r for r in data.get("records", []) if r.get("student") == str(s_doc.id)]
            return Response(data)
            
        elif start_date and end_date:
            sheets = AttendanceSheet.objects.filter(batch_id=batch_id, date__range=[start_date, end_date]).prefetch_related(
                Prefetch("records", queryset=StudentAttendance.objects.all().select_related("student"))
            )
            serializer = AttendanceSheetSerializer(sheets, many=True)
            data_list = []
            for sheet_data in serializer.data:
                if s_doc:
                    sheet_data["records"] = [r for r in sheet_data.get("records", []) if r.get("student") == str(s_doc.id)]
                data_list.append(sheet_data)
            return Response(data_list)
            
        else:
            return Response({"error": "Either date or start_date/end_date required"}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
        batch_id = request.data.get("batch_id")
        date = request.data.get("date")
        records = request.data.get("records", [])
        
        if not batch_id or not date:
            return Response({"error": "batch_id and date required"}, status=status.HTTP_400_BAD_REQUEST)
            
        batch = Batch.objects.filter(id=batch_id, is_archived=False).first()
        if not batch:
            return Response({"error": "Batch not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.role != "developer" and batch.coaching_center != request.user.coaching_center:
            return Response({"error": "Access denied to batch"}, status=status.HTTP_403_FORBIDDEN)
            
        with transaction.atomic():
            sheet, created = AttendanceSheet.objects.get_or_create(
                batch=batch,
                date=date,
                defaults={"coaching_center": batch.coaching_center}
            )
            
            # Upsert student attendance records
            for r in records:
                student_id = r.get("student_id")
                status_val = r.get("status", "Present")
                if student_id:
                    student = Student.objects.filter(id=student_id).first()
                    if student:
                        sa_record, sa_created = StudentAttendance.objects.get_or_create(
                            sheet=sheet,
                            student=student
                        )
                        sa_record.status = status_val
                        sa_record.save()
                        
            log_activity_db(request.user.email, "Attendance Updated", f"Attendance logged for {batch.name} on {date}")
            return Response({"message": "Attendance recorded"})
