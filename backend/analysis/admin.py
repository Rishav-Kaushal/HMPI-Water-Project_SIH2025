from django.contrib import admin
from .models import HeavyMetalReading, HMPICalculation, PollutionStandard, WaterSample

@admin.register(PollutionStandard)
class PollutionStandardAdmin(admin.ModelAdmin):
    list_display = ["symbol", "metal_name", "reference_limit", "unit", "source_version", "active"]
    list_filter = ["active", "source_version"]
    search_fields = ["metal_name", "symbol", "source"]

@admin.register(HeavyMetalReading)
class HeavyMetalReadingAdmin(admin.ModelAdmin):
    list_display = ["water_sample", "metal_type", "concentration", "unit", "created_at"]
    list_filter = ["metal_type", "unit"]
    search_fields = ["water_sample__sample_id", "water_sample__location_name"]

@admin.register(HMPICalculation)
class HMPICalculationAdmin(admin.ModelAdmin):
    list_display = ["water_sample", "hmpi_value", "quality_category", "method_version", "calculated_at"]
    list_filter = ["quality_category", "method_version"]
    search_fields = ["water_sample__sample_id"]

@admin.register(WaterSample)
class WaterSampleAdmin(admin.ModelAdmin):
    list_display = ["sample_id", "location_name", "sample_type", "collection_date", "hmpi", "created_at"]
    list_filter = ["sample_type", "collection_date"]
    search_fields = ["sample_id", "location_name"]
    date_hierarchy = "collection_date"

    @admin.display(description="HMPI")
    def hmpi(self, obj):
        return getattr(obj, "hmpi_calculation", None).hmpi_value if hasattr(obj, "hmpi_calculation") else "-"
