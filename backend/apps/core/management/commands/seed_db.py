import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import CoachingCenter
from core.models import Batch, Settings, Homework, HomeworkSubmission, Exam, ExamMark
from students.models import Student
from attendance.models import AttendanceSheet, StudentAttendance
from fees.models import Payment
from notifications.models import Notification, AuditLog

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds the SQL database with rich, production-quality testing data."

    def handle(self, *args, **options):
        self.stdout.write("Purging existing SQL database records...")
        
        # Core Purging (reverse order of dependencies)
        AuditLog.objects.all().delete()
        Notification.objects.all().delete()
        Payment.objects.all().delete()
        StudentAttendance.objects.all().delete()
        AttendanceSheet.objects.all().delete()
        ExamMark.objects.all().delete()
        Exam.objects.all().delete()
        HomeworkSubmission.objects.all().delete()
        Homework.objects.all().delete()
        Student.objects.all().delete()
        Batch.objects.all().delete()
        Settings.objects.all().delete()
        
        # Purge users but keep developer/superuser if we want, or clean everything
        User.objects.all().delete()
        CoachingCenter.objects.all().delete()

        self.stdout.write("Seeding data...")

        # 1. Create Coaching Center (Tuition)
        center = CoachingCenter.objects.create(
            name="Apex Coaching Academy",
            roll_number_prefix="AC",
            status="active"
        )

        # 2. Create Global Developer/Superuser
        User.objects.create_superuser(
            email="dev@apextuition.com",
            password="developer123"
        )

        # 3. Create Admin/Teacher users
        teacher1 = User.objects.create_user(
            email="teacher@apextuition.com",
            password="teacher123",
            first_name="Rajesh",
            last_name="Kumar",
            role="teacher",
            coaching_center=center
        )

        # 4. Create Settings
        Settings.objects.create(
            coaching_center=center,
            name="Apex Coaching Academy",
            address="404 Academic Towers, Science City Road, Ahmedabad",
            phone="98765 43210",
            email="info@apexcoaching.com"
        )

        # 5. Create Batches
        batch_math = Batch.objects.create(
            name="Class 10 - Mathematics",
            multiple_subjects="Mathematics",
            fees=1500.0,
            code="B-MATH10",
            coaching_center=center
        )

        batch_sci = Batch.objects.create(
            name="Class 10 - Science",
            multiple_subjects="Science",
            fees=1600.0,
            code="B-SCI10",
            coaching_center=center
        )

        batch_phy = Batch.objects.create(
            name="Class 12 - Physics",
            multiple_subjects="Physics, Chemistry",
            fees=2000.0,
            code="B-PHY12",
            coaching_center=center
        )

        # 6. Create Students
        students_data = [
            {"id": "AC0001", "name": "Aryan Patel", "mob": "9876543201", "dob": "2010-05-12", "gender": "Male"},
            {"id": "AC0002", "name": "Diya Sharma", "mob": "9876543202", "dob": "2010-09-24", "gender": "Female"},
            {"id": "AC0003", "name": "Kabir Mehta", "mob": "9876543203", "dob": "2009-02-15", "gender": "Male"},
            {"id": "AC0004", "name": "Ananya Roy", "mob": "9876543204", "dob": "2008-11-05", "gender": "Female"}
        ]

        students = []
        for s in students_data:
            assigned_batch = batch_math if s["id"] != "AC0004" else batch_phy
            student = Student.objects.create(
                student_id=s["id"],
                first_name=s["name"].split(' ')[0],
                surname=s["name"].split(' ')[1],
                student_contact=s["mob"],
                parent_contact="9876543211",
                dob=s["dob"],
                gender=s["gender"],
                coaching_center=center,
                batch=assigned_batch
            )
            students.append(student)

        # 7. Create Parent Accounts linking to Students
        parent_user = User.objects.create_user(
            email="parent@apextuition.com",
            password="parent123",
            first_name="Ramesh",
            last_name="Patel",
            role="parent",
            coaching_center=center,
            student_id=str(students[0].id)  # Links to Aryan Patel
        )

        # 8. Create Attendance
        today = datetime.utcnow()
        for i in range(10):
            date_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            # Math batch attendance
            sheet = AttendanceSheet.objects.create(batch=batch_math, date=date_str, coaching_center=center)
            for student in students:
                if student.batch == batch_math:
                    StudentAttendance.objects.create(
                        sheet=sheet,
                        student=student,
                        status=random.choices(["Present", "Absent", "Late"], weights=[80, 10, 10])[0]
                    )

        # 9. Create Homework
        hw1 = Homework.objects.create(
            batch=batch_math,
            title="Polynomials Exercises",
            description="Complete exercises 2.1 to 2.4 from textbook.",
            due=(today + timedelta(days=2)).strftime("%Y-%m-%d"),
            coaching_center=center
        )
        # Add submission for AC0001
        HomeworkSubmission.objects.create(
            homework=hw1,
            student=students[0],
            file_name="polynomials_sol.pdf",
            file_size="1.2 MB",
            submitted_at=today.strftime("%Y-%m-%d")
        )

        # 10. Create Exams
        exam1 = Exam.objects.create(
            batch=batch_math,
            test_name="Algebra Midterm",
            standard="Class 10",
            subject="Mathematics",
            total_marks=100,
            passing_marks=33,
            exam_date=(today - timedelta(days=5)).strftime("%Y-%m-%d"),
            coaching_center=center
        )
        ExamMark.objects.create(exam=exam1, student=students[0], obtained_marks=85.0, attendance=True)
        ExamMark.objects.create(exam=exam1, student=students[1], obtained_marks=92.0, attendance=True)

        # 11. Create Payments
        # Completed payments
        Payment.objects.create(
            student=students[0],
            coaching_center=center,
            amount=1500.0,
            date=(today - timedelta(days=25)).strftime("%Y-%m-%d"),
            due_date=(today - timedelta(days=25)).strftime("%Y-%m-%d"),
            paid_date=(today - timedelta(days=25)).strftime("%Y-%m-%d"),
            status="paid",
            payment_method="UPI",
            receipt_id="REC-2001",
            remarks="June tuition fees paid"
        )
        Payment.objects.create(
            student=students[1],
            coaching_center=center,
            amount=1500.0,
            date=(today - timedelta(days=24)).strftime("%Y-%m-%d"),
            due_date=(today - timedelta(days=24)).strftime("%Y-%m-%d"),
            paid_date=(today - timedelta(days=24)).strftime("%Y-%m-%d"),
            status="paid",
            payment_method="Cash",
            receipt_id="REC-2002",
            remarks="June tuition fees paid"
        )
        
        # Pending payment
        Payment.objects.create(
            student=students[0],
            coaching_center=center,
            amount=1500.0,
            date=today.strftime("%Y-%m-%d"),
            due_date=(today + timedelta(days=5)).strftime("%Y-%m-%d"),
            status="pending",
            payment_method="UPI",
            receipt_id="REC-2003",
            remarks="July tuition fees invoice"
        )

        # 12. Create Notifications & Audit Logs
        Notification.objects.create(
            title="Welcome to TheClassMate",
            desc="The portal has been successfully deployed and initialized.",
            is_global=True,
            timestamp=today.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        AuditLog.objects.create(
            timestamp=today.strftime("%Y-%m-%d %H:%M:%S"),
            user="dev@apextuition.com",
            action="System Initialized",
            details="Completed database schema seeding and normalized records."
        )

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
