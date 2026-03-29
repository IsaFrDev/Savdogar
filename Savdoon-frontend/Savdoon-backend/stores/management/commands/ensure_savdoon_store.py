from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from stores.models import Store

User = get_user_model()


class Command(BaseCommand):
    help = "Create approved store slug=savdoon if missing (owner = first superadmin/superuser)."

    def handle(self, *args, **options):
        if Store.objects.filter(slug="savdoon").exists():
            self.stdout.write("Store savdoon already exists.")
            return

        owner = (
            User.objects.filter(role="superadmin").first()
            or User.objects.filter(is_superuser=True).first()
        )
        if not owner:
            self.stdout.write(
                self.style.WARNING(
                    "No superuser yet — cannot create savdoon store. "
                    "Use SAVDOON_BOOTSTRAP=1 once or Django admin, then redeploy."
                )
            )
            return

        Store.objects.create(
            owner=owner,
            name="Savdoon Main Store",
            slug="savdoon",
            status="approved",
            business_type="electronics",
            description="Official Savdoon store",
        )
        self.stdout.write(self.style.SUCCESS("Created default store slug=savdoon"))
