import csv
from django.core.management.base import BaseCommand
from analysis.models import WaterSample

class Command(BaseCommand):
    help = "Export water samples to CSV."

    def add_arguments(self, parser):
        parser.add_argument("--output", default="hmpi_export.csv")

    def handle(self, *args, **options):
        output = options["output"]
        with open(output, "w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(["sample_id","location_name","latitude","longitude","collection_date","hmpi_value","pollution_level"])
            for sample in WaterSample.objects.select_related("hmpi_calculation"):
                calc = getattr(sample, "hmpi_calculation", None)
                writer.writerow([
                    sample.sample_id, sample.location_name, sample.latitude,
                    sample.longitude, sample.collection_date,
                    calc.hmpi_value if calc else "",
                    calc.get_quality_category_display() if calc else "",
                ])
        self.stdout.write(self.style.SUCCESS(f"Exported {output}"))
