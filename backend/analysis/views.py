from django.shortcuts import render
import csv
from datetime import date
from decimal import Decimal
from io import TextIOWrapper

from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Avg, Max, Count, Q
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import HeavyMetalReading, HMPICalculation, PollutionStandard, WaterSample
from .permissions import ReadPublicWriteAuthenticated, ReadPublicAdminWrite
from .serializers import (
    HMPICalculationSerializer,
    HeavyMetalReadingSerializer,
    PollutionStandardSerializer,
    WaterSampleSerializer,
)
from .services import calculate_and_store, calculate_hmpi, ensure_default_standards, get_standards


def home_view(request):
    return render(request, 'index.html')


class WaterSampleViewSet(viewsets.ModelViewSet):
    serializer_class = WaterSampleSerializer
    permission_classes = [ReadPublicWriteAuthenticated]

    def get_queryset(self):
        qs = WaterSample.objects.prefetch_related("readings").select_related("hmpi_calculation")
        q = self.request.query_params.get("q", "").strip()
        quality = self.request.query_params.get("quality", "").strip()
        sample_type = self.request.query_params.get("sample_type", "").strip()
        if q:
            qs = qs.filter(Q(sample_id__icontains=q) | Q(location_name__icontains=q))
        if quality:
            qs = qs.filter(hmpi_calculation__quality_category=quality)
        if sample_type:
            qs = qs.filter(sample_type=sample_type)
        return qs

    @action(detail=True, methods=["post"])
    def recalculate(self, request, pk=None):
        sample = self.get_object()
        if not sample.readings.exists():
            return Response({"error": "No metal readings available."}, status=400)
        calc, result = calculate_and_store(sample)
        return Response({
            "success": True,
            "data": {
                "hmpi_value": result["hmpi_value"],
                "pollution_level": result["pollution_level"],
                "quality_category": result["quality_category"],
                "individual_metal_scores": result["individual_metal_scores"],
                "calculation_id": calc.id,
            }
        })


class PollutionStandardViewSet(viewsets.ModelViewSet):
    queryset = PollutionStandard.objects.all()
    serializer_class = PollutionStandardSerializer
    permission_classes = [ReadPublicAdminWrite]


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    ensure_default_standards()
    return Response({"status": "ok", "service": "HMPI Water API"})


@api_view(["POST"])
@permission_classes([AllowAny])
def calculate(request):
    payload = request.data.get("metal_concentrations", request.data)
    if not isinstance(payload, dict):
        return Response({"error": "metal_concentrations must be an object."}, status=400)

    symbol_aliases = {
        "arsenic": "As", "cadmium": "Cd", "chromium": "Cr", "copper": "Cu",
        "iron": "Fe", "lead": "Pb", "manganese": "Mn", "nickel": "Ni",
        "zinc": "Zn", "mercury": "Hg",
        "As": "As", "Cd": "Cd", "Cr": "Cr", "Cu": "Cu", "Fe": "Fe",
        "Pb": "Pb", "Mn": "Mn", "Ni": "Ni", "Zn": "Zn", "Hg": "Hg",
    }

    concentrations = {}
    try:
        for key, value in payload.items():
            if value in (None, ""):
                continue
            symbol = symbol_aliases.get(key)
            if symbol:
                concentrations[symbol] = value
        result = calculate_hmpi({k: __import__("decimal").Decimal(str(v)) for k, v in concentrations.items()})
    except (ValueError, TypeError, ArithmeticError) as exc:
        return Response({"error": str(exc)}, status=400)

    return Response({"success": True, "data": result})


@api_view(["GET"])
@permission_classes([AllowAny])
def dashboard(request):
    qs = WaterSample.objects.all()
    calculations = HMPICalculation.objects.all()

    quality_counts = {
        row["quality_category"]: row["count"]
        for row in calculations.values("quality_category").annotate(count=Count("id"))
    }

    # Build a portable monthly trend without database-specific date functions.
    trend = {}
    for calc in calculations.select_related("water_sample").only("hmpi_value", "calculated_at", "water_sample__collection_date"):
        month_key = calc.water_sample.collection_date.strftime("%Y-%m")
        trend.setdefault(month_key, []).append(float(calc.hmpi_value))
    trend = [
        {"month": k, "average_hmpi": round(sum(v) / len(v), 2), "samples": len(v)}
        for k, v in sorted(trend.items())
    ]

    metal_exceedance = []
    standards = get_standards()
    for symbol, standard in standards.items():
        count = 0
        total = 0
        for reading in HeavyMetalReading.objects.filter(metal_type=symbol):
            total += 1
            if reading.concentration_mg_l() > Decimal(str(standard["limit"])):
                count += 1
        if total:
            metal_exceedance.append({
                "symbol": symbol,
                "name": standard["name"],
                "samples": total,
                "exceedances": count,
                "exceedance_rate": round((count / total) * 100, 1),
            })

    top = calculations.select_related("water_sample").order_by("-hmpi_value")[:5]
    return Response({
        "total_samples": qs.count(),
        "analyzed_samples": calculations.count(),
        "average_hmpi": round(float(calculations.aggregate(v=Avg("hmpi_value"))["v"] or 0), 2),
        "max_hmpi": round(float(calculations.aggregate(v=Max("hmpi_value"))["v"] or 0), 2),
        "quality_counts": quality_counts,
        "monthly_trend": trend[-12:],
        "metal_exceedance": metal_exceedance,
        "top_samples": [
            {
                "id": c.water_sample.id,
                "sample_id": c.water_sample.sample_id,
                "location_name": c.water_sample.location_name,
                "hmpi_value": float(c.hmpi_value),
                "quality_category": c.quality_category,
                "collection_date": c.water_sample.collection_date,
            }
            for c in top
        ],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_csv(request):
    uploaded = request.FILES.get("file")
    if not uploaded:
        return Response({"error": "CSV file is required."}, status=400)
    if not uploaded.name.lower().endswith(".csv"):
        return Response({"error": "Only .csv files are accepted."}, status=400)
    if uploaded.size > 10 * 1024 * 1024:
        return Response({"error": "Maximum file size is 10 MB."}, status=400)

    required = {"sample_id", "location_name", "latitude", "longitude", "collection_date"}
    created, skipped, errors = 0, 0, []

    try:
        decoded = TextIOWrapper(uploaded.file, encoding="utf-8-sig")
        reader = csv.DictReader(decoded)
        headers = set(reader.fieldnames or [])
        missing = required - headers
        if missing:
            return Response({"error": f"Missing columns: {', '.join(sorted(missing))}"}, status=400)

        for row_number, row in enumerate(reader, start=2):
            try:
                with transaction.atomic():
                    sample, was_created = WaterSample.objects.get_or_create(
                        sample_id=row["sample_id"].strip(),
                        defaults={
                            "location_name": row["location_name"].strip(),
                            "latitude": row["latitude"],
                            "longitude": row["longitude"],
                            "sample_type": row.get("sample_type", "groundwater") or "groundwater",
                            "collection_date": date.fromisoformat(row["collection_date"].strip()),
                            "ph_level": row.get("ph_level") or None,
                            "temperature": row.get("temperature") or None,
                            "notes": row.get("notes", ""),
                            "created_by": request.user,
                        },
                    )
                    if not was_created:
                        skipped += 1
                        continue

                    aliases = {
                        "As": "arsenic", "Cd": "cadmium", "Cr": "chromium", "Cu": "copper",
                        "Fe": "iron", "Pb": "lead", "Mn": "manganese", "Ni": "nickel",
                        "Zn": "zinc", "Hg": "mercury",
                    }
                    for symbol, col in aliases.items():
                        raw = row.get(col)
                        if raw not in (None, ""):
                            HeavyMetalReading.objects.create(
                                water_sample=sample,
                                metal_type=symbol,
                                concentration=raw,
                                unit=row.get(f"{col}_unit", "mg/L") or "mg/L",
                            )
                    if sample.readings.exists():
                        calculate_and_store(sample)
                    created += 1
            except Exception as exc:
                errors.append({"row": row_number, "error": str(exc)})
    except UnicodeDecodeError:
        return Response({"error": "CSV must be UTF-8 encoded."}, status=400)

    return Response({
        "success": True,
        "created": created,
        "skipped_duplicates": skipped,
        "errors": errors,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def export_csv(request):
    qs = WaterSample.objects.prefetch_related("readings").select_related("hmpi_calculation")
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="hmpi_samples.csv"'

    writer = csv.writer(response)
    headers = [
        "sample_id", "location_name", "latitude", "longitude", "sample_type",
        "collection_date", "ph_level", "temperature",
        "arsenic", "cadmium", "chromium", "copper", "iron", "lead",
        "manganese", "nickel", "zinc", "mercury", "hmpi_value", "pollution_level"
    ]
    writer.writerow(headers)

    for sample in qs:
        readings = {r.metal_type: r.concentration_mg_l() for r in sample.readings.all()}
        calc = getattr(sample, "hmpi_calculation", None)
        writer.writerow([
            sample.sample_id, sample.location_name, sample.latitude, sample.longitude,
            sample.sample_type, sample.collection_date, sample.ph_level, sample.temperature,
            *[readings.get(symbol, "") for symbol in ["As","Cd","Cr","Cu","Fe","Pb","Mn","Ni","Zn","Hg"]],
            calc.hmpi_value if calc else "",
            calc.get_quality_category_display() if calc else "",
        ])
    return response


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({"error": "Invalid username or password."}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        "token": token.key,
        "user": {"id": user.id, "username": user.username, "is_staff": user.is_staff},
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "is_staff": request.user.is_staff,
    })
