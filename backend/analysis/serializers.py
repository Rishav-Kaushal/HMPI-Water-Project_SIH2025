from django.db import transaction
from rest_framework import serializers
from .models import HeavyMetalReading, HMPICalculation, PollutionStandard, WaterSample
from .services import calculate_and_store


class HeavyMetalReadingSerializer(serializers.ModelSerializer):
    concentration_mg_l = serializers.SerializerMethodField()
    metal_name = serializers.CharField(source="get_metal_type_display", read_only=True)

    class Meta:
        model = HeavyMetalReading
        fields = [
            "id", "metal_type", "metal_name", "concentration", "unit",
            "concentration_mg_l", "detection_limit", "created_at"
        ]
        read_only_fields = ["id", "created_at", "concentration_mg_l"]

    def get_concentration_mg_l(self, obj):
        return float(obj.concentration_mg_l())


class HMPICalculationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HMPICalculation
        fields = "__all__"


class WaterSampleSerializer(serializers.ModelSerializer):
    readings = HeavyMetalReadingSerializer(many=True, required=False)
    hmpi_calculation = HMPICalculationSerializer(read_only=True)
    hmpi_value = serializers.SerializerMethodField()
    pollution_level = serializers.SerializerMethodField()

    class Meta:
        model = WaterSample
        fields = [
            "id", "sample_id", "location_name", "latitude", "longitude",
            "sample_type", "collection_date", "ph_level", "temperature",
            "notes", "created_by", "created_at", "updated_at",
            "readings", "hmpi_calculation", "hmpi_value", "pollution_level"
        ]
        read_only_fields = [
            "id", "created_by", "created_at", "updated_at",
            "hmpi_calculation", "hmpi_value", "pollution_level"
        ]

    @transaction.atomic
    def create(self, validated_data):
        readings = validated_data.pop("readings", [])
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        sample = WaterSample.objects.create(**validated_data)
        for reading in readings:
            HeavyMetalReading.objects.create(water_sample=sample, **reading)
        if readings:
            calculate_and_store(sample)
        return sample

    @transaction.atomic
    def update(self, instance, validated_data):
        readings = validated_data.pop("readings", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if readings is not None:
            instance.readings.all().delete()
            for reading in readings:
                HeavyMetalReading.objects.create(water_sample=instance, **reading)
            if readings:
                calculate_and_store(instance)
            else:
                HMPICalculation.objects.filter(water_sample=instance).delete()
        return instance

    def get_hmpi_value(self, obj):
        calc = getattr(obj, "hmpi_calculation", None)
        return float(calc.hmpi_value) if calc else None

    def get_pollution_level(self, obj):
        calc = getattr(obj, "hmpi_calculation", None)
        return calc.get_quality_category_display() if calc else None


class PollutionStandardSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollutionStandard
        fields = "__all__"
