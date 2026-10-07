from django.contrib import admin

from .models import AuditEvent, ServiceLog


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("at", "action", "summary", "ip")
    list_filter = ("action", "actor_type")
    search_fields = ("summary", "actor_name", "target_name")

    def has_change_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return False


@admin.register(ServiceLog)
class ServiceLogAdmin(admin.ModelAdmin):
    list_display = ("at", "level", "logger", "message")
    list_filter = ("level",)
    search_fields = ("message", "logger")

    def has_change_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return False
