"""
Create superadmin user
Run: python create_superadmin.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'savdoon.settings')
django.setup()

from accounts.models import User

# Check if admin already exists
if User.objects.filter(username='admin').exists():
    print("⚠️  Superadmin 'admin' already exists!")
    admin = User.objects.get(username='admin')
    print(f"   Email: {admin.email}")
    print(f"   Role: {admin.role}")
    print(f"   Active: {admin.is_active}")
else:
    # Create superadmin
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@savdoon.uz',
        password='admin123',
        role='superadmin',
        first_name='Super',
        last_name='Admin'
    )
    print("✅ Superadmin created successfully!")
    print(f"   Username: admin")
    print(f"   Password: admin123")
    print(f"   Email: admin@savdoon.uz")
    print(f"   Role: {admin.role}")
