from django.core.management.base import BaseCommand
from analysis.services import ensure_default_standards

class Command(BaseCommand):
    help = "Create the default HMPI reference standards if none exist."

    def handle(self, *args, **options):
        ensure_default_standards()
        self.stdout.write(self.style.SUCCESS("Reference standards are ready."))
