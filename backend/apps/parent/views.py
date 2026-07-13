from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q

import jwt
from django.conf import settings
from datetime import datetime, timezone

from core.models import Batch, Exam, ExamMark
from students.models import Student, Remark
from attendance.models import AttendanceSheet, StudentAttendance
from users.views import log_activity_db, generate_jwt_token
from students.serializers import RemarkSerializer
from services import get_user_student

# ReportLab imports
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

User = get_user_model()
otp_store = {}

@api_view(["GET"])
@permission_classes([AllowAny])
def public_batch_detail(request, code):
    batch = Batch.objects.filter(code__iexact=code.strip(), is_archived=False).first()
    if not batch:
        return Response({"error": "Invalid batch code"}, status=status.HTTP_404_NOT_FOUND)
    
    # Return formatted batch info
    return Response({
        "id": str(batch.id),
        "name": batch.name,
        "subject": batch.subject,
        "schedule": batch.schedule,
        "fees": batch.fees,
        "code": batch.code,
        "coaching_center_name": batch.coaching_center.name if batch.coaching_center else "Apex Coaching Academy"
    })

@api_view(["POST"])
@permission_classes([AllowAny])
def public_register_student(request):
    data = request.data
    code = data.get("batch_code")
    if not code:
        return Response({"error": "Batch code required"}, status=status.HTTP_400_BAD_REQUEST)
        
    batch = Batch.objects.filter(code__iexact=code.strip(), is_archived=False).first()
    if not batch:
        return Response({"error": "Invalid batch code"}, status=status.HTTP_400_BAD_REQUEST)
        
    student_contact = data.get("student_contact") or data.get("mobile")
    parent_contact = data.get("parent_contact")
    
    if not student_contact and not parent_contact:
        return Response({"error": "Student or Parent contact number is required"}, status=status.HTTP_400_BAD_REQUEST)
        
    # Search for a pre-added student matching either contact number at this center
    q_filter = Q(is_archived=False, coaching_center=batch.coaching_center)
    if student_contact and parent_contact:
        q_filter &= Q(student_contact=student_contact.strip()) | Q(parent_contact=parent_contact.strip())
    elif student_contact:
        q_filter &= Q(student_contact=student_contact.strip())
    else:
        q_filter &= Q(parent_contact=parent_contact.strip())
        
    student = Student.objects.filter(q_filter).first()
    if not student:
        return Response({"error": "No registered student found with this contact number. Please contact your academy administrator to be pre-registered."}, status=status.HTTP_400_BAD_REQUEST)
        
    # Check if this student is already registered with a portal account
    if User.objects.filter(student_id=str(student.id)).exists():
        return Response({"error": "An online portal account has already been registered for this student."}, status=status.HTTP_400_BAD_REQUEST)
        
    email = data.get("email")
    if email and User.objects.filter(email__iexact=email.strip()).exists():
        return Response({"error": "An account with this email address already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
    with transaction.atomic():
        # Update name, surname, and parent details if provided during registration
        if data.get("name"):
            student.first_name = data.get("name").strip()
        if data.get("surname"):
            student.surname = data.get("surname").strip()
        if data.get("father_name"):
            student.father_name = data.get("father_name").strip()
        if data.get("mother_name"):
            student.mother_name = data.get("mother_name").strip()
        student.batch = batch
        student.save()
        
        parent_email = email.strip() if email else f"{student.student_id.lower()}@apextuition.com"
        password = data.get("password") or student_contact or "parent123"
        
        user = User.objects.create_user(
            email=parent_email,
            password=password,
            first_name=data.get("parent_name") or student.first_name,
            last_name=data.get("surname") or student.surname or "(Parent)",
            role="parent",
            student_id=str(student.id),
            coaching_center=batch.coaching_center
        )
        
    token = generate_jwt_token(user)
    log_activity_db(parent_email, "Self Registration", f"Student {student.name} registered in batch {batch.name}")
    
    return Response({
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": str(user.id),
            "email": parent_email,
            "first_name": student.name,
            "last_name": "(Parent/Student)",
            "role": "parent",
            "student_id": str(student.id),
            "student_code": student.student_id
        }
    })

@api_view(["POST"])
@permission_classes([AllowAny])
def parent_otp_register_view(request):
    batch_code = request.data.get("batch_code")
    student_id = request.data.get("student_id")
    mobile = request.data.get("mobile")
    
    if not batch_code or not student_id or not mobile:
        return Response({"error": "Batch Code, Student ID, and Mobile are required"}, status=status.HTTP_400_BAD_REQUEST)
        
    batch = Batch.objects.filter(code__iexact=batch_code.strip(), is_archived=False).first()
    if not batch:
        return Response({"error": "Invalid Batch Code"}, status=status.HTTP_400_BAD_REQUEST)
        
    student = Student.objects.filter(
        student_id__iexact=student_id.strip(),
        batches=batch,
        mobile=mobile,
        is_archived=False
    ).first()
    if not student:
        return Response({"error": "Student not found in batch with matching mobile"}, status=status.HTTP_400_BAD_REQUEST)
        
    otp_code = "123456"
    otp_store[student_id.upper()] = {
        "otp": otp_code,
        "student_id_ref": str(student.id),
        "name": student.name
    }
    
    return Response({
        "message": "OTP sent to registered mobile",
        "otp_hint": "Use static simulation OTP: 123456"
    })

@api_view(["POST"])
@permission_classes([AllowAny])
def parent_otp_verify_view(request):
    student_id = request.data.get("student_id")
    otp_code = request.data.get("otp_code")
    email = request.data.get("email")
    password = request.data.get("password")
    
    if not student_id or not otp_code or not email or not password:
        return Response({"error": "All fields (student_id, otp_code, email, password) are required"}, status=status.HTTP_400_BAD_REQUEST)
        
    record = otp_store.get(student_id.upper())
    if not record or record["otp"] != otp_code:
        return Response({"error": "Invalid OTP or student ID"}, status=status.HTTP_400_BAD_REQUEST)
        
    if User.objects.filter(email__iexact=email.strip()).exists():
        return Response({"error": "Parent portal email is already registered"}, status=status.HTTP_400_BAD_REQUEST)
        
    student = Student.objects.filter(id=record["student_id_ref"]).first()
    if not student:
        return Response({"error": "Associated student not found"}, status=status.HTTP_400_BAD_REQUEST)
        
    with transaction.atomic():
        User.objects.create_user(
            email=email.strip(),
            password=password,
            first_name=record["name"],
            last_name="(Parent)",
            role="parent",
            student_id=record["student_id_ref"],
            coaching_center=student.coaching_center
        )
        
    if student_id.upper() in otp_store:
        del otp_store[student_id.upper()]
    
    return Response({"message": "Verification and parent registration complete."})

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def parent_remarks_view(request):
    s_doc = get_user_student(request.user)
    
    if request.method == "GET":
        if s_doc:
            queryset = Remark.objects.filter(student=s_doc).order_by("-date")
        else:
            queryset = Remark.objects.all().order_by("-date")
            if request.user.role != "developer":
                queryset = queryset.filter(coaching_center=request.user.coaching_center)
        
        # Serialize list
        return Response([{
            "id": str(r.id),
            "student_id": str(r.student.id),
            "student_name": r.student.name,
            "teacher_name": r.teacher_name,
            "text": r.text,
            "date": r.date
        } for r in queryset])
        
    elif request.method == "POST":
        if request.user.role != "teacher":
            return Response({"error": "Access denied. Only teachers can post remarks."}, status=status.HTTP_403_FORBIDDEN)
            
        student_id = request.data.get("student_id")
        text = request.data.get("text")
        
        if not student_id or not text:
            return Response({"error": "student_id and text are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        student = Student.objects.filter(id=student_id, is_archived=False).first()
        if not student:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
            
        with transaction.atomic():
            remark = Remark.objects.create(
                student=student,
                teacher_name=request.user.first_name or request.user.email,
                text=text,
                date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                coaching_center=request.user.coaching_center
            )
            log_activity_db(request.user.email, "Remark Posted", f"Remarks logged for student {student_id}")
            return Response({
                "id": str(remark.id),
                "student_id": str(remark.student.id),
                "teacher_name": remark.teacher_name,
                "text": remark.text,
                "date": remark.date
            }, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def parent_attendance_list_view(request):
    s_doc = get_user_student(request.user)
    if not s_doc:
        return Response({"error": "Access denied. Only parent/student accounts can view personal attendance summaries."}, status=status.HTTP_403_FORBIDDEN)
        
    # Fetch student attendance records
    records = StudentAttendance.objects.filter(
        student=s_doc,
        sheet__batch__in=s_doc.batches.all()
    ).order_by("-sheet__date")
    
    results = []
    for r in records:
        results.append({
            "date": r.sheet.date,
            "status": r.status
        })
                
    return Response(results)

def generate_report_card_pdf(student, attendance_rate, exam_results, remarks):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="report_card_{student.student_id}.pdf"'
    
    doc = SimpleDocTemplate(response, pagesize=letter,
                            rightMargin=40, leftMargin=40,
                            topMargin=40, bottomMargin=40)
    story = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        alignment=1,
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0284c7"),
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )
    
    bold_body_style = ParagraphStyle(
        'BoldBodyStyle',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    story.append(Paragraph("APEX COACHING CENTER", title_style))
    story.append(Paragraph("Monthly Progress Report Card", ParagraphStyle('Sub', parent=title_style, fontSize=12, spaceAfter=20)))
    story.append(Spacer(1, 10))
    
    info_data = [
        [Paragraph("Student Name:", bold_body_style), Paragraph(student.name, body_style),
         Paragraph("Student ID:", bold_body_style), Paragraph(student.student_id, body_style)],
        [Paragraph("Email Address:", bold_body_style), Paragraph(student.email or "N/A", body_style),
         Paragraph("Mobile Number:", bold_body_style), Paragraph(student.mobile, bold_body_style)]
    ]
    info_table = Table(info_data, colWidths=[90, 170, 90, 170])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("Attendance Log Summary", section_style))
    att_data = [
        [Paragraph("Total Classes Logged", bold_body_style), Paragraph("Present Days", bold_body_style), Paragraph("Absent Days", bold_body_style), Paragraph("Attendance Percentage", bold_body_style)],
        [Paragraph(str(attendance_rate["total"]), body_style), Paragraph(str(attendance_rate["present"]), body_style), Paragraph(str(attendance_rate["absent"]), body_style), Paragraph(f"{attendance_rate['percentage']:.1f}%", body_style)]
    ]
    att_table = Table(att_data, colWidths=[130, 130, 130, 130])
    att_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(att_table)
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("Academic Performance (Recent Exams)", section_style))
    exam_data = [[Paragraph("Exam Title", bold_body_style), Paragraph("Date", bold_body_style), Paragraph("Marks Obtained", bold_body_style), Paragraph("Max Marks", bold_body_style), Paragraph("Percentage", bold_body_style)]]
    
    for ex in exam_results:
        pct = (ex["obtained"] / ex["max"]) * 100 if ex["max"] > 0 else 0
        exam_data.append([
            Paragraph(ex["name"], body_style),
            Paragraph(ex["date"], body_style),
            Paragraph(str(ex["obtained"]), body_style),
            Paragraph(str(ex["max"]), body_style),
            Paragraph(f"{pct:.1f}%", body_style)
        ])
        
    if len(exam_results) == 0:
        exam_data.append([Paragraph("No recent exams logged for this period.", body_style), "", "", "", ""])
        
    exam_table = Table(exam_data, colWidths=[180, 80, 80, 80, 100])
    exam_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(exam_table)
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("Teacher Observations & Remarks", section_style))
    remark_paras = []
    for r in remarks:
        remark_paras.append(Paragraph(f"<b>[{r.get('date', 'N/A')}] {r.get('teacher_name', 'Teacher')}:</b> {r.get('text', '')}", body_style))
        remark_paras.append(Spacer(1, 4))
        
    if len(remarks) == 0:
        remark_paras.append(Paragraph("No remarks recorded for this period.", body_style))
        
    remarks_table = Table([[remark_paras]], colWidths=[520])
    remarks_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (0,0), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (0,0), 8),
    ]))
    story.append(remarks_table)
    
    doc.build(story)
    return response

@api_view(["GET"])
@permission_classes([AllowAny])
def parent_report_card_view(request):
    user = request.user
    if not user or not user.is_authenticated:
        token_str = request.query_params.get("token")
        if token_str:
            try:
                payload = jwt.decode(token_str, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
                db_user = User.objects.filter(id=payload["user_id"]).first()
                if db_user:
                    user = db_user
                else:
                    return Response({"error": "User record not found"}, status=401)
            except Exception as e:
                return Response({"error": f"Invalid token query parameter: {str(e)}"}, status=401)
        else:
            return Response({"error": "Authentication credentials were not provided."}, status=401)
            
    s_doc = get_user_student(user)
    if not s_doc:
        return Response({"error": "Access denied. Only parent/student accounts can access report cards."}, status=403)
        
    # 1. Fetch attendance rates
    records = StudentAttendance.objects.filter(student=s_doc, sheet__batch__in=s_doc.batches.all())
    total_classes = records.count()
    present_days = records.filter(status__in=["Present", "Late", "Half Day"]).count()
    absent_days = total_classes - present_days
    
    attendance_rate = {
        "total": total_classes,
        "present": present_days,
        "absent": absent_days,
        "percentage": (present_days / total_classes * 100) if total_classes > 0 else 100.0
    }
    
    # 2. Fetch exam results
    exam_marks = ExamMark.objects.filter(student=s_doc, exam__batch__in=s_doc.batches.all()).order_by("-exam__date")
    exam_results = []
    
    for em in exam_marks:
        exam_results.append({
            "name": em.exam.title,
            "date": em.exam.date,
            "obtained": em.marks_obtained,
            "max": em.exam.max_marks
        })
                
    # 3. Fetch remarks
    remarks_queryset = Remark.objects.filter(student=s_doc).order_by("-date")
    remarks = [{
        "date": r.date,
        "teacher_name": r.teacher_name,
        "text": r.text
    } for r in remarks_queryset]
    
    return generate_report_card_pdf(s_doc, attendance_rate, exam_results, remarks)

@api_view(["GET"])
@permission_classes([AllowAny])
def public_settings_view(request):
    center = CoachingCenter.objects.first()
    name = center.name if center else "Apex Coaching Academy"
    return Response({"name": name, "powered_by": "TheClassMate"})
