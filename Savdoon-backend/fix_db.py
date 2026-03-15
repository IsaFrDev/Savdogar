from accounts.models import User
from stores.models import Store
import sys

def inspect_and_fix():
    print("--- User Inspection ---")
    users = User.objects.all()
    admin_exists = False
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, Email: {u.email}, Role: {u.role}, SuperUser: {u.is_superuser}")
        if u.username == 'admin':
            admin_exists = True
            if u.email != 'mansurovislombek130@gmail.com':
                print(f"Updating admin email from {u.email} to mansurovislombek130@gmail.com")
                u.email = 'mansurovislombek130@gmail.com'
                u.set_password('admin123') # Ensure password is also correct
                u.save()
                print("Admin updated.")
    
    if not admin_exists:
        print("Admin user not found. Creating...")
        User.objects.create_superuser('admin', 'mansurovislombek130@gmail.com', 'admin123', role='superadmin')
        print("Admin created.")

    print("\n--- Store Inspection ---")
    stores = Store.objects.all()
    if not stores:
        print("No stores found in database.")
    for s in stores:
        print(f"ID: {s.id}, Name: {s.name}, Slug: {s.slug}, Status: {s.status}, Owner: {s.owner.username}")

if __name__ == "__main__":
    inspect_and_fix()
