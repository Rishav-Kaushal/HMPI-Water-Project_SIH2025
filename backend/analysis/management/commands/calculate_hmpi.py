from django.core.management.base import BaseCommand
from analysis.models import WaterSample
from analysis.services import calculate_and_store

class Command(BaseCommand):
    help = "Calculate/recalculate HMPI for all samples that have metal readings."

    def handle(self, *args, **options):
        done = 0
        for sample in WaterSample.objects.prefetch_related("readings"):
            if sample.readings.exists():
                calculate_and_store(sample)
                done += 1
        self.stdout.write(self.style.SUCCESS(f"Calculated HMPI for {done} samples."))
