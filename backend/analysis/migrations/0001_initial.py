from decimal import Decimal
from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PollutionStandard",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("symbol", models.CharField(max_length=5, unique=True)),
                ("metal_name", models.CharField(max_length=50)),
                ("reference_limit", models.DecimalField(decimal_places=6, max_digits=12)),
                ("unit", models.CharField(default="mg/L", max_length=10)),
                ("ideal_value", models.DecimalField(decimal_places=6, default=Decimal("0"), max_digits=12)),
                ("source", models.CharField(default="Project reference dataset", max_length=250)),
                ("source_version", models.CharField(default="v1", max_length=100)),
                ("active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["metal_name"]},
        ),
        migrations.CreateModel(
            name="WaterSample",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sample_id", models.CharField(max_length=100, unique=True)),
                ("location_name", models.CharField(max_length=200)),
                ("latitude", models.DecimalField(decimal_places=6, max_digits=9, validators=[django.core.validators.MinValueValidator(Decimal("-90")), django.core.validators.MaxValueValidator(Decimal("90"))])),
                ("longitude", models.DecimalField(decimal_places=6, max_digits=9, validators=[django.core.validators.MinValueValidator(Decimal("-180")), django.core.validators.MaxValueValidator(Decimal("180"))])),
                ("sample_type", models.CharField(choices=[("groundwater","Groundwater"),("surface","Surface Water"),("treated","Treated Water")], default="groundwater", max_length=20)),
                ("collection_date", models.DateField()),
                ("ph_level", models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(Decimal("0")), django.core.validators.MaxValueValidator(Decimal("14"))])),
                ("temperature", models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="water_samples", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-collection_date","-created_at"]},
        ),
        migrations.CreateModel(
            name="HeavyMetalReading",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("metal_type", models.CharField(choices=[("As","Arsenic"),("Cd","Cadmium"),("Cr","Chromium"),("Cu","Copper"),("Fe","Iron"),("Pb","Lead"),("Mn","Manganese"),("Ni","Nickel"),("Zn","Zinc"),("Hg","Mercury")], max_length=2)),
                ("concentration", models.DecimalField(decimal_places=8, max_digits=14, validators=[django.core.validators.MinValueValidator(Decimal("0"))])),
                ("unit", models.CharField(choices=[("mg/L","mg/L"),("µg/L","µg/L"),("ppm","ppm"),("ppb","ppb")], default="mg/L", max_length=10)),
                ("detection_limit", models.DecimalField(blank=True, decimal_places=8, max_digits=14, null=True, validators=[django.core.validators.MinValueValidator(Decimal("0"))])),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("water_sample", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="readings", to="analysis.watersample")),
            ],
            options={"ordering":["metal_type"]},
        ),
        migrations.CreateModel(
            name="HMPICalculation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("hmpi_value", models.DecimalField(decimal_places=4, max_digits=14)),
                ("quality_category", models.CharField(choices=[("excellent","Excellent"),("good","Good"),("poor","Poor"),("very_poor","Very Poor"),("unsuitable","Unsuitable")], max_length=20)),
                ("individual_metal_scores", models.JSONField(default=dict)),
                ("method_version", models.CharField(default="HMPI-v1", max_length=50)),
                ("reference_profile", models.CharField(default="Project Reference v1", max_length=100)),
                ("calculated_at", models.DateTimeField(auto_now=True)),
                ("water_sample", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="hmpi_calculation", to="analysis.watersample")),
            ],
            options={"ordering":["-calculated_at"]},
        ),
        migrations.AddConstraint(
            model_name="heavymetalreading",
            constraint=models.UniqueConstraint(fields=("water_sample","metal_type"), name="unique_metal_per_sample"),
        ),
    ]
