from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class PollutionStandard(models.Model):
    symbol = models.CharField(max_length=5, unique=True)
    metal_name = models.CharField(max_length=50)
    reference_limit = models.DecimalField(max_digits=12, decimal_places=6)
    unit = models.CharField(max_length=10, default="mg/L")
    ideal_value = models.DecimalField(max_digits=12, decimal_places=6, default=Decimal("0"))
    source = models.CharField(max_length=250, default="Project reference dataset")
    source_version = models.CharField(max_length=100, default="v1")
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["metal_name"]

    def __str__(self):
        return f"{self.metal_name} ({self.symbol})"


class WaterSample(models.Model):
    SAMPLE_TYPES = [
        ("groundwater", "Groundwater"),
        ("surface", "Surface Water"),
        ("treated", "Treated Water"),
    ]

    sample_id = models.CharField(max_length=100, unique=True)
    location_name = models.CharField(max_length=200)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        validators=[MinValueValidator(Decimal("-90")), MaxValueValidator(Decimal("90"))]
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        validators=[MinValueValidator(Decimal("-180")), MaxValueValidator(Decimal("180"))]
    )
    sample_type = models.CharField(max_length=20, choices=SAMPLE_TYPES, default="groundwater")
    collection_date = models.DateField()
    ph_level = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("14"))]
    )
    temperature = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="water_samples"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-collection_date", "-created_at"]

    def __str__(self):
        return f"{self.sample_id} - {self.location_name}"


class HeavyMetalReading(models.Model):
    METALS = [
        ("As", "Arsenic"),
        ("Cd", "Cadmium"),
        ("Cr", "Chromium"),
        ("Cu", "Copper"),
        ("Fe", "Iron"),
        ("Pb", "Lead"),
        ("Mn", "Manganese"),
        ("Ni", "Nickel"),
        ("Zn", "Zinc"),
        ("Hg", "Mercury"),
    ]
    UNITS = [("mg/L", "mg/L"), ("µg/L", "µg/L"), ("ppm", "ppm"), ("ppb", "ppb")]

    water_sample = models.ForeignKey(
        WaterSample, related_name="readings", on_delete=models.CASCADE
    )
    metal_type = models.CharField(max_length=2, choices=METALS)
    concentration = models.DecimalField(
        max_digits=14, decimal_places=8,
        validators=[MinValueValidator(Decimal("0"))]
    )
    unit = models.CharField(max_length=10, choices=UNITS, default="mg/L")
    detection_limit = models.DecimalField(
        max_digits=14, decimal_places=8, null=True, blank=True,
        validators=[MinValueValidator(Decimal("0"))]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["water_sample", "metal_type"],
                name="unique_metal_per_sample",
            )
        ]
        ordering = ["metal_type"]

    def concentration_mg_l(self) -> Decimal:
        factors = {
            "mg/L": Decimal("1"),
            "µg/L": Decimal("0.001"),
            "ppm": Decimal("1"),
            "ppb": Decimal("0.000001"),
        }
        return self.concentration * factors[self.unit]

    def __str__(self):
        return f"{self.water_sample.sample_id} - {self.metal_type}: {self.concentration} {self.unit}"


class HMPICalculation(models.Model):
    QUALITY = [
        ("excellent", "Excellent"),
        ("good", "Good"),
        ("poor", "Poor"),
        ("very_poor", "Very Poor"),
        ("unsuitable", "Unsuitable"),
    ]

    water_sample = models.OneToOneField(
        WaterSample, related_name="hmpi_calculation", on_delete=models.CASCADE
    )
    hmpi_value = models.DecimalField(max_digits=14, decimal_places=4)
    quality_category = models.CharField(max_length=20, choices=QUALITY)
    individual_metal_scores = models.JSONField(default=dict)
    method_version = models.CharField(max_length=50, default="HMPI-v1")
    reference_profile = models.CharField(max_length=100, default="Project Reference v1")
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-calculated_at"]

    def __str__(self):
        return f"{self.water_sample.sample_id} - HMPI: {self.hmpi_value}"
