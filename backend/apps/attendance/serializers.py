from rest_framework import serializers
from attendance.models import AttendanceSheet, StudentAttendance

class StudentAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_code = serializers.CharField(source='student.student_id', read_only=True)
    id = serializers.CharField(read_only=True)

    class Meta:
        model = StudentAttendance
        fields = '__all__'

class AttendanceSheetSerializer(serializers.ModelSerializer):
    records = StudentAttendanceSerializer(many=True, read_only=True)
    id = serializers.CharField(read_only=True)

    class Meta:
        model = AttendanceSheet
        fields = '__all__'
