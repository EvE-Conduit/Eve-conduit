from django.contrib import admin

from .models import ModuleState


@admin.register(ModuleState)
class ModuleStateAdmin(admin.ModelAdmin):
    list_display = ("module_id", "enabled", "installed_version", "updated_at")
