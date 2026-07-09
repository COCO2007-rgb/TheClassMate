from rest_framework import serializers
from core.models import Batch, Settings, Homework, HomeworkSubmission, Exam, ExamMark

class BatchSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    id = serializers.CharField(read_only=True)
    subject = serializers.CharField(source='multiple_subjects', required=False, allow_blank=True)

    class Meta:
        model = Batch
        fields = ['id', 'name', 'multiple_subjects', 'subject', 'fees', 'code', 'is_archived', 'coaching_center', 'total_students', 'student_count']
        
    def get_student_count(self, obj):
        return obj.students.count()

class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = '__all__'

class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_code = serializers.CharField(source='student.student_id', read_only=True)
    id = serializers.CharField(read_only=True)

    class Meta:
        model = HomeworkSubmission
        fields = '__all__'

class HomeworkSerializer(serializers.ModelSerializer):
    submissions = HomeworkSubmissionSerializer(many=True, read_only=True)
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Homework
        fields = '__all__'

class ExamMarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_code = serializers.CharField(source='student.student_id', read_only=True)
    id = serializers.CharField(read_only=True)

    class Meta:
        model = ExamMark
        fields = '__all__'

class ExamSerializer(serializers.ModelSerializer):
    marks = ExamMarkSerializer(many=True, read_only=True)
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Exam
        fields = '__all__'
