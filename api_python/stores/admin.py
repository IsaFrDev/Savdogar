from django.contrib import admin
from .models import Store, Contract
from .employee_models import Employee, EmployeePermission, Attendance, EmployeeShift, PerformanceReview

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'owner', 'status', 'created_at']
    list_filter = ['status', 'business_type']
    search_fields = ['name', 'slug']

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['store', 'language', 'signed', 'signed_at']
    list_filter = ['signed', 'language']

# Employee Management
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['user', 'store', 'position', 'status', 'hire_date']
    list_filter = ['position', 'status']
    search_fields = ['user__username']

@admin.register(EmployeePermission)
class EmployeePermissionAdmin(admin.ModelAdmin):
    list_display = ['employee']

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'status', 'clock_in', 'clock_out']
    list_filter = ['status']

@admin.register(EmployeeShift)
class EmployeeShiftAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'start_time', 'end_time']

@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ['employee', 'review_date', 'overall_rating']
    list_filter = ['overall_rating']
