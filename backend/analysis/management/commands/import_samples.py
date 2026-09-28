import csv
from datetime import date
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from analysis.models import WaterSample, HeavyMetalReading
from analysis.services import calculate_and_store

class Command(BaseCommand):
    help = "Import samples from the HMPI CSV format."

    def add_arguments(self, parser):
        parser.add_argument("csv_file")

    def handle(self, *args, **options):
        created = 0
        with open(options["csv_file"], newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            required = {"sample_id","location_name","latitude","longitude","collection_date"}
            if not required.issubset(set(reader.fieldnames or [])):
                raise CommandError("CSV is missing required columns.")

            for row in reader:
                if WaterSample.objects.filter(sample_id=row["sample_id"]).exists():
                    continue
                with transaction.atomic():
                    sample = WaterSample.objects.create(
                        sample_id=row["sample_id"],
                        location_name=row["location_name"],
                        latitude=row["latitude"],
                        longitude=row["longitude"],
                        collection_date=date.fromisoformat(row["collection_date"]),
                        sample_type=row.get("sample_type") or "groundwater",
                        ph_level=row.get("ph_level") or None,
                        temperature=row.get("temperature") or None,
                        notes=row.get("notes") or "",
                    )
                    mapping = {"As":"arsenic","Cd":"cadmium","Cr":"chromium","Cu":"copper","Fe":"iron","Pb":"lead","Mn":"manganese","Ni":"nickel","Zn":"zinc","Hg":"mercury"}
                    for symbol, column in mapping.items():
                        if row.get(column) not in (None, ""):
                            HeavyMetalReading.objects.create(
                                water_sample=sample,
                                metal_type=symbol,
                                concentration=row[column],
                                unit=row.get(f"{column}_unit") or "mg/L",
                            )
                    if sample.readings.exists():
                        calculate_and_store(sample)
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Imported {created} samples."))
