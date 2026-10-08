"""The landing page: what members see first after signing in (``/home``).

Admins edit it under Administration > Settings > Landing page. Nothing stored means the default below.
Texts may use {name} (the viewer's main character), {corporation}, {alliance} and {site}; section bodies
are Markdown. Links are pages on this site ("/groups") or https:// addresses.
"""

from typing import Literal

from ninja import Schema
from pydantic import Field, field_validator

ICONS = (
    "activity anchor award bar-chart bell book-open box boxes briefcase building calendar clock coins compass "
    "crosshair factory file-text flag flask-conical gauge gem globe graduation-cap hammer heart landmark "
    "layout-dashboard life-buoy map message-square mic moon package pickaxe puzzle radar rocket satellite scroll "
    "shield shield-check shopping-cart sparkles star swords target timer trophy truck users wallet wrench zap"
).split()

DEFAULT_LANDING = {
    "hero": {
        "eyebrow": "Welcome home, capsuleer",
        "title": "o7, {name}",
        "subtitle": "Everything {site} runs on, in one place: your characters, your groups and the tools "
        "leadership has switched on. Pick a heading below or open your dashboard.",
        "image_url": "https://images.evetech.net/types/23913/render?size=1024",
        "show_profile": True,
    },
    "buttons": [
        {"label": "Open dashboard", "link": "/", "style": "primary"},
        {"label": "Add a character", "link": "/characters", "style": "secondary"},
    ],
    "show_status": True,
    "cards_title": "Where to next",
    "cards": [
        {"icon": "users", "title": "Characters", "text": "Link every alt once and see skills, wallets and assets side by side.", "link": "/characters"},
        {"icon": "shield-check", "title": "Groups", "text": "Join the groups you fly with to unlock their services and channels.", "link": "/groups"},
        {"icon": "wallet", "title": "Wallet", "text": "Balances and journal across all your characters.", "link": "/wallet"},
        {"icon": "package", "title": "Assets", "text": "Find any ship or item, wherever in New Eden it's parked.", "link": "/assets"},
    ],
    "sections": [
        {
            "title": "Getting started",
            "body": "1. **Add all your characters**, alts included. Leadership checks the whole account, not just your main.\n"
            "2. **Join your groups** so the right services and channels open up for you.\n"
            "3. **Keep your tokens valid.** If a character shows a warning, sign in with it again.",
        },
        {
            "title": "Good to know",
            "body": "- Your data is only visible to you and to the people your leadership has trusted with it.\n"
            "- Notifications arrive under the bell in the top bar.\n"
            "- Lost? Ask in your corporation channel, someone will help. Fly safe o7",
        },
    ],
}


def _link(v: str) -> str:
    v = v.strip()
    if not v:
        return v
    if (v.startswith("/") and not v.startswith("//") and "\\" not in v) or v.startswith("https://"):
        return v
    raise ValueError("links must be a page on this site (like /groups) or an https:// address")


class HeroIn(Schema):
    eyebrow: str = Field("", max_length=80)
    title: str = Field("", max_length=120)
    subtitle: str = Field("", max_length=600)
    image_url: str = Field("", max_length=500)
    show_profile: bool = True

    @field_validator("image_url")
    @classmethod
    def _image(cls, v):
        v = v.strip()
        if v and not v.startswith("https://"):
            raise ValueError("the hero image must be an https:// URL")
        return v


class ButtonIn(Schema):
    label: str = Field(..., min_length=1, max_length=40)
    link: str = Field(..., min_length=1, max_length=500)
    style: Literal["primary", "secondary"] = "secondary"

    @field_validator("link")
    @classmethod
    def _check_link(cls, v):
        return _link(v)


class CardIn(Schema):
    icon: str = "box"
    title: str = Field(..., min_length=1, max_length=60)
    text: str = Field("", max_length=300)
    link: str = Field("", max_length=500)

    @field_validator("link")
    @classmethod
    def _check_link(cls, v):
        return _link(v)

    @field_validator("icon")
    @classmethod
    def _icon(cls, v):
        return v if v in ICONS else "box"


class SectionIn(Schema):
    title: str = Field("", max_length=80)
    body: str = Field("", max_length=8000)


class LandingIn(Schema):
    hero: HeroIn
    buttons: list[ButtonIn] = Field(default_factory=list, max_length=4)
    show_status: bool = True
    cards_title: str = Field("", max_length=60)
    cards: list[CardIn] = Field(default_factory=list, max_length=12)
    sections: list[SectionIn] = Field(default_factory=list, max_length=10)
    #: Plugin sections ("<plugin id>:<section id>") switched off; plugins' new sections show until then.
    hidden_plugin_sections: list[str] = Field(default_factory=list, max_length=100)

    @field_validator("hidden_plugin_sections")
    @classmethod
    def _keys(cls, v):
        return [k[:100] for k in dict.fromkeys(v) if k]


def landing_content(site) -> dict:
    """The stored landing page, or the default when nothing has been saved."""
    return site.landing or DEFAULT_LANDING
