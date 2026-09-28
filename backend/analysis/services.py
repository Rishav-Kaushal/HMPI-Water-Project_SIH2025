from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Iterable, Mapping

from .models import PollutionStandard, HeavyMetalReading, HMPICalculation


DEFAULT_STANDARDS = {
    "As": {"name": "Arsenic", "limit": Decimal("0.010000")},
    "Cd": {"name": "Cadmium", "limit": Decimal("0.003000")},
    "Cr": {"name": "Chromium", "limit": Decimal("0.050000")},
    "Cu": {"name": "Copper", "limit": Decimal("2.000000")},
    "Fe": {"name": "Iron", "limit": Decimal("0.300000")},
    "Pb": {"name": "Lead", "limit": Decimal("0.010000")},
    "Mn": {"name": "Manganese", "limit": Decimal("0.100000")},
    "Ni": {"name": "Nickel", "limit": Decimal("0.070000")},
    "Zn": {"name": "Zinc", "limit": Decimal("3.000000")},
    "Hg": {"name": "Mercury", "limit": Decimal("0.006000")},
}

QUALITY_RANGES = (
    (Decimal("25"), "excellent", "Excellent"),
    (Decimal("50"), "good", "Good"),
    (Decimal("75"), "poor", "Poor"),
    (Decimal("100"), "very_poor", "Very Poor"),
)


def ensure_default_standards() -> None:
    if PollutionStandard.objects.exists():
        return
    PollutionStandard.objects.bulk_create([
        PollutionStandard(
            symbol=symbol,
            metal_name=item["name"],
            reference_limit=item["limit"],
            ideal_value=Decimal("0"),
            source="Project reference dataset",
            source_version="v1",
        )
        for symbol, item in DEFAULT_STANDARDS.items()
    ])


def get_standards() -> Dict[str, dict]:
    ensure_default_standards()
    return {
        s.symbol: {
            "name": s.metal_name,
            "limit": Decimal(s.reference_limit),
            "ideal": Decimal(s.ideal_value),
            "unit": s.unit,
        }
        for s in PollutionStandard.objects.filter(active=True)
    }


def classify_hmpi(value: Decimal) -> dict:
    for threshold, slug, label in QUALITY_RANGES:
        if value <= threshold:
            return {"slug": slug, "label": label}
    return {"slug": "unsuitable", "label": "Unsuitable"}


def calculate_hmpi(concentrations_mg_l: Mapping[str, Decimal], standards=None) -> dict:
    standards = standards or get_standards()
    weighted_index_sum = Decimal("0")
    weight_sum = Decimal("0")
    detail = {}

    for symbol, raw_value in concentrations_mg_l.items():
        if symbol not in standards:
            continue
        value = Decimal(str(raw_value))
        if value < 0:
            raise ValueError(f"Negative concentration for {symbol} is not allowed.")

        standard = standards[symbol]
        limit = Decimal(standard["limit"])
        ideal = Decimal(standard["ideal"])

        if limit <= ideal:
            continue

        weight = Decimal("1") / (limit - ideal)
        sub_index = ((value - ideal) / (limit - ideal)) * Decimal("100")

        weighted_index_sum += weight * sub_index
        weight_sum += weight

        detail[symbol] = {
            "name": standard["name"],
            "concentration_mg_l": float(value),
            "reference_limit_mg_l": float(limit),
            "ideal_value_mg_l": float(ideal),
            "weight": float(weight),
            "sub_index": float(sub_index),
            "percent_of_limit": float((value / limit) * Decimal("100")) if limit else None,
        }

    if weight_sum == 0:
        raise ValueError("At least one valid metal concentration is required.")

    hmpi = (weighted_index_sum / weight_sum).quantize(
        Decimal("0.0001"), rounding=ROUND_HALF_UP
    )
    quality = classify_hmpi(hmpi)

    return {
        "hmpi_value": float(hmpi),
        "pollution_level": quality["label"],
        "quality_category": quality["slug"],
        "individual_metal_scores": detail,
        "method_version": "HMPI-v1",
        "reference_profile": "Project Reference v1",
    }


def calculate_and_store(sample):
    concentrations = {}
    for reading in sample.readings.all():
        concentrations[reading.metal_type] = reading.concentration_mg_l()

    result = calculate_hmpi(concentrations)
    calc, _ = HMPICalculation.objects.update_or_create(
        water_sample=sample,
        defaults={
            "hmpi_value": result["hmpi_value"],
            "quality_category": result["quality_category"],
            "individual_metal_scores": result["individual_metal_scores"],
            "method_version": result["method_version"],
            "reference_profile": result["reference_profile"],
        },
    )
    return calc, result
