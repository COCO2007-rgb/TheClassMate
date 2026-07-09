from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from datetime import datetime, timezone

from core.models import Homework, HomeworkSubmission, Batch
from core.serializers import HomeworkSerializer, HomeworkSubmissionSerializer
from users.views import log_activity_db
from services import get_user_student

@api_view(["GET", "POST", "PUT"])
@permission_classes([IsAuthenticated])
def homework_view(request):
    if request.method == "GET":
        s_doc = get_user_student(request.user)
        if s_doc:
            queryset = Homework.objects.filter(batch__in=s_doc.batches.all()).order_by("due")
            # We want to serialize homework, but only serialize submissions that belong to this student
            serializer = HomeworkSerializer(queryset, many=True)
            data = serializer.data
            for hw in data:
                hw["submissions"] = [sub for sub in hw.get("submissions", []) if sub.get("student") == str(s_doc.id)]
            return Response(data)
        else:
            queryset = Homework.objects.all().order_by("due")
            if request.user.role != "developer":
                queryset = queryset.filter(coaching_center=request.user.coaching_center)
            serializer = HomeworkSerializer(queryset, many=True)
            return Response(serializer.data)

    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data.copy()
        if "coaching_center" not in data or not data["coaching_center"]:
            data["coaching_center"] = request.user.coaching_center.id if request.user.coaching_center else None
            
        serializer = HomeworkSerializer(data=data)
        if serializer.is_valid():
            with transaction.atomic():
                hw = serializer.save()
                log_activity_db(request.user.email, "Homework Added", f"Assigned new homework assignment: {hw.title}")
                return Response(HomeworkSerializer(hw).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "PUT":
        hw_id = request.data.get("id")
        if not hw_id:
            return Response({"error": "Homework ID required"}, status=status.HTTP_400_BAD_REQUEST)
            
        s_doc = get_user_student(request.user)
        
        # Student / Parent submitting homework flow
        if request.user.role != "teacher":
            if not s_doc:
                return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
                
            homework = Homework.objects.filter(id=hw_id).first()
            if not homework:
                return Response({"error": "Homework assignment not found"}, status=status.HTTP_404_NOT_FOUND)
                
            if homework.batch not in s_doc.batches.all():
                return Response({"error": "Access denied for this batch's homework"}, status=status.HTTP_403_FORBIDDEN)
                
            with transaction.atomic():
                submission, created = HomeworkSubmission.objects.get_or_create(
                    homework=homework,
                    student=s_doc
                )
                
                # Fetch details from incoming request data
                incoming_subs = request.data.get("submissions", [])
                my_sub_data = next((sub for sub in incoming_subs if sub.get("student_id") == str(s_doc.id)), {})
                
                submission.file_name = my_sub_data.get("file_name") or request.data.get("file_name") or "sol.pdf"
                submission.file_size = my_sub_data.get("file_size") or request.data.get("file_size") or "1.0 MB"
                submission.submitted_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                submission.marks = "Pending"
                submission.save()
                
                log_activity_db(request.user.email, "Homework Submitted", f"Submitted homework worksheet for {hw_id}")
                return Response({"message": "Homework submitted successfully"})

        # Teacher grading / updating homework flow
        else:
            homework = Homework.objects.filter(id=hw_id).first()
            if not homework:
                return Response({"error": "Homework not found"}, status=status.HTTP_404_NOT_FOUND)
                
            serializer = HomeworkSerializer(homework, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    hw = serializer.save()
                    
                    # Update submissions marks/feedbacks if passed in nested data
                    incoming_submissions = request.data.get("submissions", [])
                    for sub_data in incoming_submissions:
                        student_id = sub_data.get("student_id")
                        if student_id:
                            submission = HomeworkSubmission.objects.filter(homework=hw, student_id=student_id).first()
                            if submission:
                                submission.marks = sub_data.get("marks", submission.marks)
                                submission.feedback = sub_data.get("feedback", submission.feedback)
                                submission.save()
                    
                    log_activity_db(request.user.email, "Homework Updated", f"Modified details/submissions for homework {hw_id}")
                    return Response({"message": "Homework updated"})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
