from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"samples", views.WaterSampleViewSet, basename="sample")
router.register(r"standards", views.PollutionStandardViewSet, basename="standard")

urlpatterns = [
    path("health/", views.health, name="health"),
    path("calculate/", views.calculate, name="calculate"),
    path("calculate-hmpi/", views.calculate, name="calculate-hmpi-legacy"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("upload-csv/", views.upload_csv, name="upload-csv"),
    path("export-csv/", views.export_csv, name="export-csv"),
    path("auth/login/", views.login, name="login"),
    path("auth/me/", views.me, name="me"),
    path("", include(router.urls)),
]
