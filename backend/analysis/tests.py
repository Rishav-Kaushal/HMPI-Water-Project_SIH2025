from decimal import Decimal
from datetime import date
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

from .models import HeavyMetalReading, WaterSample
from .services import calculate_hmpi


class HMPICalculationTests(TestCase):
    def test_single_metal(self):
        result = calculate_hmpi({"As": Decimal("0.005")})
        self.assertAlmostEqual(result["hmpi_value"], 50.0, places=3)
        self.assertEqual(result["quality_category"], "good")

    def test_zero_or_missing(self):
        with self.assertRaises(ValueError):
            calculate_hmpi({})

    def test_multiple_metals_returns_breakdown(self):
        result = calculate_hmpi({
            "As": Decimal("0.005"),
            "Pb": Decimal("0.010"),
        })
        self.assertEqual(set(result["individual_metal_scores"].keys()), {"As", "Pb"})
        self.assertGreater(result["hmpi_value"], 0)


class APITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user("tester", password="StrongPass123!")
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_health(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)

    def test_create_sample_and_calculate(self):
        payload = {
            "sample_id": "TEST-001",
            "location_name": "NIT Hamirpur",
            "latitude": 31.7081,
            "longitude": 76.5260,
            "sample_type": "groundwater",
            "collection_date": date.today().isoformat(),
            "readings": [
                {"metal_type": "As", "concentration": 0.005, "unit": "mg/L"},
                {"metal_type": "Pb", "concentration": 0.008, "unit": "mg/L"},
            ],
        }
        response = self.client.post("/api/samples/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["sample_id"], "TEST-001")
        self.assertIsNotNone(response.data["hmpi_value"])

    def test_public_calculation(self):
        self.client.credentials()
        response = self.client.post(
            "/api/calculate/",
            {"metal_concentrations": {"As": 0.005, "Pb": 0.008}},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
