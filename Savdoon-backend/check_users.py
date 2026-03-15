import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'savdoon.settings')
django.setup()

from accounts.models import User

print("--- USER INVESTIGATION ---")
users = User.objects.filter(email='mansurovislombek130@gmail.com')
print(f"Total users with email 'mansurovislombek130@gmail.com': {users.count()}")

for user in users:
    print(f"ID: {user.id}, Username: {user.username}, Role: {user.role}, Is Superuser: {user.is_superuser}")

# Check the 'admin' user specifically
try:
    admin_user = User.objects.get(username='admin')
    print(f"Admin User - ID: {admin_user.id}, Email: {admin_user.email}, Role: {admin_user.role}")
except User.DoesNotExist:
    print("Admin user NOT FOUND by username 'admin'")

# List all roles present in DB
from django.db.models import Count
role_stats = User.objects.values('role').annotate(count=Count('id'))
print("Role stats:", list(role_stats))
