from django.contrib import admin

from .models import SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("name", "setup_completed")
    exclude = ("setup_token", "esi_secret_key")  # the form would show the secret decrypted
