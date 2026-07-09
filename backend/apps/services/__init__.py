def get_user_student(request_user):
    if hasattr(request_user, "role") and request_user.role == "parent":
        if request_user.student_id:
            from students.models import Student
            try:
                # Find student by id (primary key)
                return Student.objects.filter(id=request_user.student_id).first()
            except Exception:
                pass
    return None
