from django.contrib import admin

from .models import ItemType, SdeVersion, SolarSystem


@admin.register(SdeVersion)
class SdeVersionAdmin(admin.ModelAdmin):
    list_display = ("build_number", "release_date", "imported_at")


@admin.register(ItemType)
class ItemTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "id", "group", "published")
    search_fields = ("name", "id")
    list_filter = ("published",)
    list_select_related = ("group",)


@admin.register(SolarSystem)
class SolarSystemAdmin(admin.ModelAdmin):
    list_display = ("name", "id", "region", "security_status")
    search_fields = ("name",)
    list_select_related = ("region",)
