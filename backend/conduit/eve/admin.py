from django.contrib import admin

from .models import EveAlliance, EveCorporation


@admin.register(EveAlliance)
class EveAllianceAdmin(admin.ModelAdmin):
    list_display = ("name", "ticker", "id")
    search_fields = ("name", "ticker")


@admin.register(EveCorporation)
class EveCorporationAdmin(admin.ModelAdmin):
    list_display = ("name", "ticker", "alliance", "member_count", "id")
    search_fields = ("name", "ticker")
