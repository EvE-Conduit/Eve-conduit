from django.contrib import admin

from .models import GroupProfile, State


@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = ("name", "priority", "public")
    filter_horizontal = ("member_corporations", "member_alliances", "permissions")
    raw_id_fields = ("member_characters",)


@admin.register(GroupProfile)
class GroupProfileAdmin(admin.ModelAdmin):
    list_display = ("group", "join_mode", "auto", "hidden")
    filter_horizontal = ("allowed_states", "leader_groups")
    raw_id_fields = ("leaders",)
