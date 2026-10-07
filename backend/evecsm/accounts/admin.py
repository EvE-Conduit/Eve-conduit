from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Character, Token, User


class CharacterInline(admin.TabularInline):
    model = Character
    fields = ("id", "name", "corporation", "alliance")
    readonly_fields = fields
    extra = 0
    can_delete = False


@admin.register(User)
class EveUserAdmin(UserAdmin):
    list_display = ("username", "main_character", "state", "is_superuser", "last_login")
    list_filter = ("state", "is_superuser", "groups")
    search_fields = ("username", "characters__name")
    fieldsets = UserAdmin.fieldsets + (("EVE", {"fields": ("main_character", "state")}),)
    inlines = [CharacterInline]


@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    list_display = ("name", "id", "user", "corporation", "alliance", "affiliation_updated_at")
    search_fields = ("name", "id")
    list_select_related = ("user", "corporation", "alliance")
    raw_id_fields = ("user",)


@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = ("character", "valid", "expires_at", "updated_at")
    list_filter = ("valid",)
    exclude = ("access_token", "refresh_token")
    readonly_fields = ("character", "scopes", "expires_at")
