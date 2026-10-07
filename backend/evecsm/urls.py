from django.conf import settings
from django.contrib import admin
from django.urls import path

from evecsm.api import api
from evecsm.external.api import external_api
from evecsm.sso import views as sso

admin.site.site_header = "EVECSM administration"

urlpatterns = [
    path("api/v1/", external_api.urls),  # before api/ so the web UI's API never shadows it
    path("api/", api.urls),
    path("sso/login", sso.login, name="sso-login"),
    path("sso/add-character", sso.add_character, name="sso-add-character"),
    path("sso/callback", sso.callback, name="sso-callback"),
]

if settings.EVECSM_DJANGO_ADMIN:
    urlpatterns.insert(0, path("django-admin/", admin.site.urls))
