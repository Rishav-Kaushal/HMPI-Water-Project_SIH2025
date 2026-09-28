from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.conf.urls.static import static
from analysis.views import home_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("analysis.urls")),
]

# React production build fallback for every non-API/non-admin browser route.
urlpatterns.append(re_path(r"^(?!api/|admin/|static/|media/).*$", home_view))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
