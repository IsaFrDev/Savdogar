"""
Management command to seed fruit products with images from URLs.
Usage: python manage.py seed_products
"""
import os
import urllib.request
from io import BytesIO
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from products.models import Product, ProductImage, Category
from stores.models import Store


FRUIT_DATA = [
    {
        'name': 'Olma',
        'name_uz': 'Olma',
        'slug': 'olma',
        'description': "Yangi, shirin olma. Vitaminlarga boy.",
        'price': 15000,
        'stock': 100,
        'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/800px-Red_Apple.jpg',
    },
    {
        'name': 'Banan',
        'name_uz': 'Banan',
        'slug': 'banan',
        'description': "Import qilingan toza bananlar. Kaliy manbayi.",
        'price': 25000,
        'stock': 80,
        'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/800px-Banana-Single.jpg',
    },
    {
        'name': 'Apelsin',
        'name_uz': 'Apelsin',
        'slug': 'apelsin',
        'description': "Yangi siqilgan apelsin sharbati uchun ideal.",
        'price': 20000,
        'stock': 120,
        'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Oranges_-_whole-halved-segment.jpg/800px-Oranges_-_whole-halved-segment.jpg',
    },
    {
        'name': 'Uzum',
        'name_uz': 'Uzum',
        'slug': 'uzum',
        'description': "Mahalliy qora uzum. Shirin va suvli.",
        'price': 30000,
        'stock': 60,
        'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Table_grapes_on_white.jpg/800px-Table_grapes_on_white.jpg',
    },
    {
        'name': 'Anor',
        'name_uz': 'Anor',
        'slug': 'anor',
        'description': "O'zbekiston anori. Antioksidantlarga boy.",
        'price': 35000,
        'stock': 50,
        'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Pomegranate_fruit_-_whole_and_piece_with_arils.jpg/800px-Pomegranate_fruit_-_whole_and_piece_with_arils.jpg',
    },
    {
        'name': 'Nok',
        'name_uz': 'Nok',
        'slug': 'nok',
        'description': "Shirin va suvli nok. Kuzgi hosil.",
        'price': 18000,
        'stock': 70,
        'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Pears.jpg/800px-Pears.jpg',
    },
    {
        'name': 'Gilos',
        'name_uz': 'Gilos',
        'slug': 'gilos',
        'description': "Yangi qizil gilos. Yozgi mevalar.",
        'price': 45000,
        'stock': 40,
        'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Cherry_Stella444.jpg/800px-Cherry_Stella444.jpg',
    },
    {
        'name': 'Limon',
        'name_uz': 'Limon',
        'slug': 'limon',
        'description': "Yangi limon. Choy va ovqatlarga ideal.",
        'price': 22000,
        'stock': 90,
        'image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Lemon.jpg/800px-Lemon.jpg',
    },
]


class Command(BaseCommand):
    help = 'Seeds the database with fruit products and their images'

    def add_arguments(self, parser):
        parser.add_argument(
            '--store-id', type=int, default=None,
            help='Store ID to assign products to. If not provided, uses the first store.'
        )

    def handle(self, *args, **options):
        store_id = options.get('store_id')

        if store_id:
            try:
                store = Store.objects.get(id=store_id)
            except Store.DoesNotExist:
                self.stderr.write(f"Store with id={store_id} not found.")
                return
        else:
            store = Store.objects.first()
            if not store:
                self.stderr.write("No stores found. Create a store first.")
                return

        self.stdout.write(f"Using store: {store.name} (id={store.id})")

        # Create or get a "Mevalar" (Fruits) category
        category, created = Category.objects.get_or_create(
            name='Mevalar',
            defaults={'name_uz': 'Mevalar', 'store': store, 'slug': 'mevalar'}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created category: {category.name}"))

        for fruit in FRUIT_DATA:
            # Check if product already exists
            product, p_created = Product.objects.get_or_create(
                slug=fruit['slug'],
                store=store,
                defaults={
                    'name': fruit['name'],
                    'name_uz': fruit.get('name_uz', fruit['name']),
                    'description': fruit['description'],
                    'price': fruit['price'],
                    'stock': fruit['stock'],
                    'category': category,
                    'active': True,
                }
            )

            if p_created:
                self.stdout.write(self.style.SUCCESS(f"  Created product: {product.name}"))
            else:
                self.stdout.write(f"  Product already exists: {product.name}")

            # Download and attach image if product has no images
            if not ProductImage.objects.filter(product=product).exists():
                try:
                    self.stdout.write(f"    Downloading image for {product.name}...")
                    req = urllib.request.Request(
                        fruit['image_url'],
                        headers={'User-Agent': 'Mozilla/5.0'}
                    )
                    response = urllib.request.urlopen(req, timeout=15)
                    image_data = response.read()

                    ext = fruit['image_url'].split('.')[-1].split('?')[0][:4]
                    filename = f"{fruit['slug']}.{ext}"

                    img = ProductImage(product=product, is_primary=True)
                    img.image.save(filename, ContentFile(image_data), save=True)

                    self.stdout.write(self.style.SUCCESS(f"    Image saved: {filename}"))
                except Exception as e:
                    self.stderr.write(f"    Failed to download image: {e}")
            else:
                self.stdout.write(f"    Image already exists for {product.name}")

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! {len(FRUIT_DATA)} fruit products seeded for store '{store.name}'."
        ))
