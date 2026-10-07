from django.contrib import admin

from .models import PluginState


@admin.register(PluginState)
class PluginStateAdmin(admin.ModelAdmin):
    list_display = ("plugin_id", "enabled", "installed_version", "updated_at")
