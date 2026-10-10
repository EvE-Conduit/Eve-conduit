from django.conf import settings
from django.db import models


class Page(models.Model):
    """A wiki page. Pages form a tree through ``parent``; ``slug`` is the address (/p/wiki/<slug>)."""

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=120, unique=True)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children")
    #: Position among its siblings.
    order = models.PositiveIntegerField(default=0)
    #: Markdown: headings, lists, tables, code blocks, quotes, images (https) and [[Page Title]] links to other pages.
    body = models.TextField(blank=True)
    #: Who sees it: users in any of these states or groups. Both empty means every member.
    states = models.ManyToManyField("access.State", blank=True, related_name="+")
    groups = models.ManyToManyField("auth.Group", blank=True, related_name="+")
    #: Readable by anyone, signed in or not, at /public/p/wiki/<slug>.
    public = models.BooleanField(default=False)
    #: Only people with wiki.manage_wiki may edit it.
    locked = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "title"]
        permissions = [
            ("edit_pages", "Can write and edit wiki pages"),
            ("manage_wiki", "Can delete, move and lock wiki pages, choose who sees them and make them public"),
        ]

    def __str__(self):
        return self.title


class Revision(models.Model):
    """What a page looked like after each save. Restoring an old one makes a new revision."""

    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="revisions")
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    #: The editor's short note on what changed.
    note = models.CharField(max_length=200, blank=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-number"]
        unique_together = [("page", "number")]

    def __str__(self):
        return f"{self.page.title} r{self.number}"
