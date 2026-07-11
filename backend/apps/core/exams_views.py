from django.db.models import Prefetch
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from core.models import Exam, ExamMark
from core.serializers import ExamSerializer
from users.views import log_activity_db
from services import get_user_student

@api_view(["GET", "POST", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def exams_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            queryset = Exam.objects.filter(batch__in=s_doc.batches.all()).prefetch_related(
                Prefetch("marks", queryset=ExamMark.objects.filter(student=s_doc).select_related("student"))
            ).order_by("-exam_date")
            serializer = ExamSerializer(queryset, many=True)
            data = serializer.data
            for ex in data:
                # Filter marks list to only return the current student's score
                ex["marks"] = [m for m in ex.get("marks", []) if m.get("student") == str(s_doc.id)]
            return Response(data)
        else:
            queryset = Exam.objects.all().prefetch_related(
                Prefetch("marks", queryset=ExamMark.objects.all().select_related("student"))
            ).order_by("-exam_date")
            if request.user.role != "developer":
                queryset = queryset.filter(coaching_center=request.user.coaching_center)
            serializer = ExamSerializer(queryset, many=True)
            return Response(serializer.data)

    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data.copy()
        if "coaching_center" not in data or not data["coaching_center"]:
            data["coaching_center"] = request.user.coaching_center.id if request.user.coaching_center else None
            
        serializer = ExamSerializer(data=data)
        if serializer.is_valid():
            with transaction.atomic():
                ex = serializer.save()
                log_activity_db(request.user.email, "Exam Scheduled", f"Created exam event: {ex.test_name}")
                return Response(ExamSerializer(ex).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "PUT":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
        ex_id = request.data.get("id")
        if not ex_id:
            return Response({"error": "Exam ID required"}, status=status.HTTP_400_BAD_REQUEST)
            
        exam = Exam.objects.filter(id=ex_id).first()
        if not exam:
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = ExamSerializer(exam, data=request.data, partial=True)
        if serializer.is_valid():
            with transaction.atomic():
                ex = serializer.save()
                
                # Update marks array if passed in nested data
                incoming_marks = request.data.get("marks", [])
                for mark_data in incoming_marks:
                    student_id = mark_data.get("student_id")
                    if student_id:
                        obtained = float(mark_data.get("obtained_marks") or mark_data.get("marks_obtained") or 0.0)
                        attendance = bool(mark_data.get("attendance", True))
                        mark_record, created = ExamMark.objects.get_or_create(
                            exam=ex,
                            student_id=student_id
                        )
                        mark_record.obtained_marks = obtained
                        mark_record.attendance = attendance
                        mark_record.save()
                
                log_activity_db(request.user.email, "Exam Updated", f"Modified details/marks for exam {ex_id}")
                return Response({"message": "Exam updated"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
        ex_id = request.query_params.get("id") or request.data.get("id")
        if not ex_id:
            return Response({"error": "Exam ID required"}, status=status.HTTP_400_BAD_REQUEST)
            
        exam = Exam.objects.filter(id=ex_id).first()
        if not exam:
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)
            
        with transaction.atomic():
            exam.delete()
            log_activity_db(request.user.email, "Exam Deleted", f"Deleted exam {ex_id}")
            return Response({"message": "Exam deleted successfully"})
