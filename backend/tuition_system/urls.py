from django.urls import path
from users.views import (
    login_view, register_admin_view, profile_view, parent_send_otp_view, parent_verify_otp_view,
    change_password_view, forgot_password_send_otp_view, forgot_password_verify_otp_view, forgot_password_reset_view,
    list_teachers_view
)
from core.views import (
    index_view, settings_view, batches_view, batch_detail_view,
    clone_batch_view
)
from core.homework_views import homework_view
from core.exams_views import exams_view
from core.recycle_views import recycle_bin_view, recycle_restore_view, recycle_purge_view
from students.views import students_view, student_detail_view, promote_student_view
from attendance.views import attendance_view
from fees.views import payments_view
from reports.views import csv_export_students
from parent.views import (
    public_batch_detail, public_register_student, parent_otp_register_view,
    parent_otp_verify_view, parent_remarks_view, parent_attendance_list_view,
    parent_report_card_view
)
from developer.views import (
    backup_view, audit_logs_view, developer_stats_view, developer_db_clear_view,
    developer_db_seed_view, developer_login_view, developer_centers_view,
    developer_center_toggle_view, developer_center_detail_view,
    developer_platform_stats_view
)
from notifications.views import notifications_view
from analytics.views import dashboard_stats_view

urlpatterns = [
    path('', index_view, name='api-index'),
    # Auth Endpoints
    path("api/auth/login/", login_view, name="api-login"),
    path("api/auth/register-admin/", register_admin_view, name="api-register-admin"),
    path("api/auth/profile/", profile_view, name="api-profile"),
    path("api/auth/parent/send-otp/", parent_send_otp_view, name="api-parent-send-otp"),
    path("api/auth/parent/verify-otp/", parent_verify_otp_view, name="api-parent-verify-otp"),
    path("api/auth/change-password/", change_password_view, name="api-change-password"),
    path("api/auth/forgot-password/send-otp/", forgot_password_send_otp_view, name="api-forgot-password-send-otp"),
    path("api/auth/forgot-password/verify-otp/", forgot_password_verify_otp_view, name="api-forgot-password-verify-otp"),
    path("api/auth/forgot-password/reset/", forgot_password_reset_view, name="api-forgot-password-reset"),
    path("api/teachers/", list_teachers_view, name="api-teachers"),

    # Public Registration Endpoints
    path("api/public/batch/<str:code>/", public_batch_detail, name="api-public-batch"),
    path("api/public/register-student/", public_register_student, name="api-public-register-student"),
    path("api/public/parent/register/", parent_otp_register_view, name="api-public-parent-register"),
    path("api/public/parent/verify/", parent_otp_verify_view, name="api-public-parent-verify"),

    # Dashboard Metrics
    path("api/dashboard/stats/", dashboard_stats_view, name="api-dashboard-stats"),

    # Settings API
    path("api/settings/", settings_view, name="api-settings"),

    # Batches API
    path("api/batches/", batches_view, name="api-batches"),
    path("api/batches/<str:pk>/", batch_detail_view, name="api-batch-detail"),
    path("api/batches/<str:pk>/clone/", clone_batch_view, name="api-batch-clone"),

    # Students API
    path("api/students/", students_view, name="api-students"),
    path("api/students/<str:pk>/", student_detail_view, name="api-student-detail"),
    path("api/students/<str:pk>/promote/", promote_student_view, name="api-student-promote"),

    # Attendance Grid
    path("api/attendance/", attendance_view, name="api-attendance"),

    # Fees & Ledger
    path("api/fees/payments/", payments_view, name="api-payments"),

    # Homeworks & Exams
    path("api/homework/", homework_view, name="api-homework"),
    path("api/exams/", exams_view, name="api-exams"),

    # Timetable Schedules (Removed)

    # Recycle Bin Operations
    path("api/recycle/bin/", recycle_bin_view, name="api-recycle-bin"),
    path("api/recycle/restore/", recycle_restore_view, name="api-recycle-restore"),
    path("api/recycle/purge/", recycle_purge_view, name="api-recycle-purge"),

    # Backups & Admin operations
    path("api/backup/", backup_view, name="api-backup"),
    path("api/audit-logs/", audit_logs_view, name="api-audit-logs"),
    
    # Notifications API
    path("api/notifications/", notifications_view, name="api-notifications"),

    # Super Admin/Developer Portal endpoints
    path("api/auth/developer/login/", developer_login_view, name="api-developer-login"),
    path("api/developer/centers/", developer_centers_view, name="api-developer-centers"),
    path("api/developer/centers/<str:pk>/toggle/", developer_center_toggle_view, name="api-developer-center-toggle"),
    path("api/developer/centers/<str:pk>/detail/", developer_center_detail_view, name="api-developer-center-detail"),
    path("api/developer/platform-stats/", developer_platform_stats_view, name="api-developer-platform-stats"),
    path("api/developer/stats/", developer_stats_view, name="api-developer-stats"),
    path("api/developer/db/clear/", developer_db_clear_view, name="api-developer-db-clear"),
    path("api/developer/db/seed/", developer_db_seed_view, name="api-developer-db-seed"),

    # Data CSV export
    path("api/export/students/", csv_export_students, name="api-csv-export-students"),

    # Parent Mobile Dashboard APIs
    path("api/remarks/", parent_remarks_view, name="api-remarks"),
    path("api/parent/attendance/", parent_attendance_list_view, name="api-parent-attendance"),
    path("api/parent/report-card/", parent_report_card_view, name="api-parent-report-card"),
]
