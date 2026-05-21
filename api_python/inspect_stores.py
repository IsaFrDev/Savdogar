import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'savdoon.settings')
django.setup()

from stores.models import Store
from products.models import Product, Category

def inspect():
    print("--- Store Inspection ---")
    stores = Store.objects.all()
    print(f"Total stores: {stores.count()}")
    for s in stores:
        print(f"ID: {s.id}, Name: {s.name}, Slug: {s.slug}, Status: {s.status}")

    print("\n--- Searching for 'savdoon' slug ---")
    try:
        s = Store.objects.get(slug='savdoon')
        print(f"Found: ID: {s.id}, Status: {s.status}")
    except Store.DoesNotExist:
        print("Store with slug 'savdoon' NOT FOUND.")

    print("\n--- Checking Store ID: 1 ---")
    try:
        s1 = Store.objects.get(id=1)
        print(f"Store 1 exists: {s1.name}")
        
        products = Product.objects.filter(store=s1)
        print(f"Product count for Store 1: {products.count()}")
        
        categories = Category.objects.filter(store=s1)
        print(f"Category count for Store 1: {categories.count()}")
        
        # Test serialization/access (common pitfalls)
        if products.exists():
            p = products.first()
            print(f"First product: {p.name}, Price: {p.price}, Category: {p.category}")
            
    except Store.DoesNotExist:
        print("Store with ID 1 NOT FOUND.")
    except Exception as e:
        print(f"Error testing Store 1: {e}")

if __name__ == "__main__":
    inspect()
