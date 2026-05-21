"""
Employee Management System
Staff roles, permissions, attendance, performance tracking
"""
from django.db import models
from django.contrib.auth.models import AbstractUser


class Employee(models.Model):
    """Store employees/staff members"""
    
    POSITION_CHOICES = [
        ('manager', 'Store Manager'),
        ('sales', 'Sales Associate'),
        ('cashier', 'Cashier'),
        ('warehouse', 'Warehouse Staff'),
        ('delivery', 'Delivery Person'),
        ('marketing', 'Marketing Specialist'),
        ('support', 'Customer Support'),
        ('accountant', 'Accountant'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('on_leave', 'On Leave'),
        ('terminated', 'Terminated'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='employees')
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='employee_profile')
    
    position = models.CharField(max_length=20, choices=POSITION_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    employee_id = models.CharField(max_length=50, unique=True, help_text='Internal employee ID')
    hire_date = models.DateField()
    termination_date = models.DateField(null=True, blank=True)
    
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    phone = models.CharField(max_length=20)
    emergency_contact = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    
    # Performance metrics
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    orders_processed = models.IntegerField(default=0)
    customer_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, help_text='Average rating')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_position_display()}"


class EmployeePermission(models.Model):
    """Granular permissions for employees"""
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='permissions')
    
    # POS permissions
    can_process_sales = models.BooleanField(default=False)
    can_process_refunds = models.BooleanField(default=False)
    can_void_transactions = models.BooleanField(default=False)
    can_open_register = models.BooleanField(default=False)
    can_close_register = models.BooleanField(default=False)
    
    # Inventory permissions
    can_view_inventory = models.BooleanField(default=True)
    can_edit_inventory = models.BooleanField(default=False)
    can_delete_products = models.BooleanField(default=False)
    can_adjust_stock = models.BooleanField(default=False)
    
    # Order permissions
    can_view_orders = models.BooleanField(default=True)
    can_edit_orders = models.BooleanField(default=False)
    can_cancel_orders = models.BooleanField(default=False)
    
    # Customer permissions
    can_view_customers = models.BooleanField(default=True)
    can_edit_customers = models.BooleanField(default=False)
    can_export_customers = models.BooleanField(default=False)
    
    # Report permissions
    can_view_reports = models.BooleanField(default=False)
    can_export_reports = models.BooleanField(default=False)
    can_view_financial = models.BooleanField(default=False)
    
    # Settings permissions
    can_edit_store_settings = models.BooleanField(default=False)
    can_manage_employees = models.BooleanField(default=False)
    can_manage_marketing = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['employee']
    
    def __str__(self):
        return f"Permissions for {self.employee.user.username}"


class Attendance(models.Model):
    """Employee attendance tracking"""
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    
    date = models.DateField()
    clock_in = models.TimeField(null=True, blank=True)
    clock_out = models.TimeField(null=True, blank=True)
    
    # Location tracking
    clock_in_location = models.CharField(max_length=300, blank=True)
    clock_out_location = models.CharField(max_length=300, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=[
        ('present', 'Present'),
        ('late', 'Late'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('on_leave', 'On Leave'),
    ], default='present')
    
    notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_attendance')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.employee.user.username} - {self.date}"
    
    @property
    def hours_worked(self):
        if self.clock_in and self.clock_out:
            dt_in = models.datetime.combine(self.date, self.clock_in)
            dt_out = models.datetime.combine(self.date, self.clock_out)
            delta = dt_out - dt_in
            return delta.total_seconds() / 3600
        return 0


class EmployeeShift(models.Model):
    """Employee shift scheduling"""
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='shifts')
    
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    is_completed = models.BooleanField(default=False)
    actual_start = models.TimeField(null=True, blank=True)
    actual_end = models.TimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['date', 'start_time']
    
    def __str__(self):
        return f"{self.employee.user.username} - {self.date} ({self.start_time}-{self.end_time})"


class PerformanceReview(models.Model):
    """Employee performance reviews"""
    
    RATING_CHOICES = [(i, f"{i} Stars") for i in range(1, 6)]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_reviews')
    reviewer = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='reviews_conducted')
    
    review_date = models.DateField()
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Ratings
    overall_rating = models.IntegerField(choices=RATING_CHOICES)
    quality_rating = models.IntegerField(choices=RATING_CHOICES)
    punctuality_rating = models.IntegerField(choices=RATING_CHOICES)
    teamwork_rating = models.IntegerField(choices=RATING_CHOICES)
    customer_service_rating = models.IntegerField(choices=RATING_CHOICES)
    
    # Metrics
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    orders_completed = models.IntegerField(default=0)
    customer_complaints = models.IntegerField(default=0)
    
    comments = models.TextField()
    goals_achieved = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Review: {self.employee.user.username} - {self.review_date}"
