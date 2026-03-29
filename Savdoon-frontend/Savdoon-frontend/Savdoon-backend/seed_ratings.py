import os
import django
import random

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'savdoon.settings')
django.setup()

from stores.models import Store

def seed_ratings():
    stores = Store.objects.filter(status='approved')
    if not stores.exists():
        print("No approved stores found to seed ratings.")
        return

    for store in stores:
        store.rating = round(random.uniform(4.0, 5.0), 2)
        store.rating_count = random.randint(10, 250)
        store.save()
        print(f"Seeded {store.name}: Rating {store.rating} ({store.rating_count} reviews)")

if __name__ == "__main__":
    seed_ratings()
