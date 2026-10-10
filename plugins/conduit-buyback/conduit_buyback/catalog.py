"""The in-game market tree (Materials > Minerals > Tritanium) and which of a program's rules applies to what in it."""

from __future__ import annotations

from dataclasses import dataclass

from django.core.cache import cache
from django.db.models import Count

from conduit.sde.models import ItemGroup, ItemType, MarketGroup, type_icon_url

from .models import GroupRule, ItemRule, Program, WatchRule

TREE_KEY = "buyback:market-tree"
MAX_TYPES = 500
MAX_HITS = 40


@dataclass
class Tree:
    #: ``{id: (parent_id, name)}``
    groups: dict[int, tuple[int | None, str]]
    children: dict[int | None, list[int]]
    #: Published items under each group, the groups under it included.
    counts: dict[int, int]

    def chain(self, group_id: int | None) -> list[int]:
        """The group and every group above it, closest first."""
        out = []
        while group_id is not None and group_id in self.groups and group_id not in out:
            out.append(group_id)
            group_id = self.groups[group_id][0]
        return out

    def path(self, group_id: int | None) -> list[dict]:
        """From the top of the market down to the group."""
        return [{"id": g, "name": self.groups[g][1], "count": self.counts.get(g, 0)} for g in reversed(self.chain(group_id))]

    def name(self, group_id: int) -> str:
        return self.groups[group_id][1] if group_id in self.groups else f"Market group {group_id}"


def tree() -> Tree:
    """The whole market tree; a couple of thousand groups, kept in the cache (the static data rarely changes)."""
    t = cache.get(TREE_KEY)
    if t is None:
        groups = {pk: (parent, name) for pk, parent, name in MarketGroup.objects.values_list("pk", "parent_id", "name")}
        children: dict[int | None, list[int]] = {}
        for pk, (parent, name) in sorted(groups.items(), key=lambda kv: kv[1][1].lower()):
            children.setdefault(parent if parent in groups else None, []).append(pk)
        direct = dict(
            ItemType.objects.filter(published=True, market_group__isnull=False)
            .values("market_group_id").annotate(n=Count("pk")).values_list("market_group_id", "n")
        )
        t = Tree(groups, children, {})
        for gid, n in direct.items():
            for g in t.chain(gid):
                t.counts[g] = t.counts.get(g, 0) + n
        cache.set(TREE_KEY, t, 6 * 3600)
    return t


def rule_out(rule: ItemRule | GroupRule | None) -> dict | None:
    if rule is None:
        return None
    return {"tax": float(rule.tax), "disallowed": rule.disallowed,
            "static_price": float(rule.static_price) if rule.static_price is not None else None}


class Rules:
    """A program's item rules, market group rules and manual review list, resolved for any item or group."""

    def __init__(self, program: Program, type_ids=None):
        qs = program.item_rules.all() if type_ids is None else program.item_rules.filter(type_id__in=type_ids)
        self.items = {r.type_id: r for r in qs}
        self.groups = {r.market_group_id: r for r in program.group_rules.all()}
        watch = list(program.watch_rules.all())
        self.watch_types = {w.type_id for w in watch if w.type_id}
        self.watch_item_groups = {w.group_id for w in watch if w.group_id}
        self.watch_markets = {w.market_group_id for w in watch if w.market_group_id}
        self._tree = None

    @property
    def tree(self) -> Tree:
        if self._tree is None:
            self._tree = tree()
        return self._tree

    def group_rule(self, market_group_id: int | None) -> tuple[GroupRule, int] | None:
        """The rule on the group or the closest group above it, and that group."""
        if not self.groups or market_group_id is None:
            return None
        for g in self.tree.chain(market_group_id):
            if g in self.groups:
                return self.groups[g], g
        return None

    def for_type(self, t: ItemType) -> ItemRule | GroupRule | None:
        """What prices the item: its own rule, else the closest market group's."""
        if t.pk in self.items:
            return self.items[t.pk]
        found = self.group_rule(t.market_group_id)
        return found[0] if found else None

    def watched(self, t: ItemType) -> bool:
        if t.pk in self.watch_types or t.group_id in self.watch_item_groups:
            return True
        return bool(self.watch_markets) and any(g in self.watch_markets for g in self.tree.chain(t.market_group_id))

    def group_watched(self, market_group_id: int) -> bool:
        return bool(self.watch_markets) and any(g in self.watch_markets for g in self.tree.chain(market_group_id))

    # --- what the browser shows ---

    def effective(self, type_id: int | None, market_group_id: int | None) -> dict | None:
        """The rule that applies and where it comes from; None: the program's own terms."""
        if type_id is not None and type_id in self.items:
            return {**rule_out(self.items[type_id]), "from": {"kind": "type", "id": type_id}}
        found = self.group_rule(market_group_id)
        if found:
            rule, g = found
            return {**rule_out(rule), "from": {"kind": "group", "id": g, "name": self.tree.name(g)}}
        return None

    def group_node(self, g: int) -> dict:
        t = self.tree
        return {"kind": "group", "id": g, "name": t.name(g), "count": t.counts.get(g, 0), "has_children": bool(t.children.get(g)),
                "rule": rule_out(self.groups.get(g)), "effective": self.effective(None, g),
                "watch": g in self.watch_markets, "watched": self.group_watched(g)}

    def type_node(self, t: ItemType) -> dict:
        return {"kind": "type", "id": t.pk, "name": t.name, "icon": type_icon_url(t.pk, 32), "market_group_id": t.market_group_id,
                "rule": rule_out(self.items.get(t.pk)), "effective": self.effective(t.pk, t.market_group_id),
                "watch": t.pk in self.watch_types, "watched": self.watched(t)}


def browse(program: Program, group_id: int | None) -> dict:
    """One level of the market: the groups under ``group_id`` (the top of the market when None) and its items."""
    rules = Rules(program)
    t = rules.tree
    if group_id is not None and group_id not in t.groups:
        group_id = None
    groups = [rules.group_node(g) for g in t.children.get(group_id, []) if t.counts.get(g)]
    types = []
    if group_id is not None:
        qs = ItemType.objects.filter(market_group_id=group_id, published=True).only("pk", "name", "group_id", "market_group_id").order_by("name")
        types = [rules.type_node(it) for it in qs[:MAX_TYPES]]
    return {"group": rules.group_node(group_id) if group_id is not None else None, "path": t.path(group_id), "groups": groups, "types": types}


def search(program: Program, q: str) -> dict:
    """Items and market groups by name, each with where it sits in the market."""
    q = q.strip()
    if len(q) < 2:
        return {"groups": [], "types": []}
    rules = Rules(program)
    t = rules.tree
    ql = q.lower()
    hits = [g for g, (_, name) in t.groups.items() if ql in name.lower() and t.counts.get(g)]
    hits.sort(key=lambda g: (not t.name(g).lower().startswith(ql), t.name(g).lower()))
    qs = (ItemType.objects.filter(published=True, market_group__isnull=False, name__icontains=q)
          .only("pk", "name", "group_id", "market_group_id").order_by("name")[:200])
    found = sorted(qs, key=lambda it: (it.name.lower() != ql, not it.name.lower().startswith(ql), it.name.lower()))[:MAX_HITS]
    return {
        "groups": [{**rules.group_node(g), "path": t.path(t.groups[g][0])} for g in hits[:15]],
        "types": [{**rules.type_node(it), "path": t.path(it.market_group_id)} for it in found],
    }


def rules_out(program: Program) -> dict:
    """Every rule a manager set, with where it sits in the market."""
    t = tree()
    item_rules = list(program.item_rules.all())
    types = {it.pk: it for it in ItemType.objects.filter(pk__in=[r.type_id for r in item_rules]).only("pk", "name", "market_group_id")}
    watch = list(program.watch_rules.all())
    watch_types = {it.pk: it for it in ItemType.objects.filter(pk__in=[w.type_id for w in watch if w.type_id]).only("pk", "name", "market_group_id")}
    item_groups = dict(ItemGroup.objects.filter(pk__in=[w.group_id for w in watch if w.group_id]).values_list("pk", "name"))
    out_watch = []
    for w in watch:
        if w.type_id:
            it = watch_types.get(w.type_id)
            out_watch.append({"id": w.pk, "kind": "type", "target_id": w.type_id, "name": it.name if it else f"Type {w.type_id}",
                              "icon": type_icon_url(w.type_id, 32), "path": t.path(it.market_group_id if it else None)})
        elif w.market_group_id:
            out_watch.append({"id": w.pk, "kind": "market", "target_id": w.market_group_id, "name": t.name(w.market_group_id), "icon": None,
                              "path": t.path(t.groups.get(w.market_group_id, (None,))[0]), "count": t.counts.get(w.market_group_id, 0)})
        else:
            out_watch.append({"id": w.pk, "kind": "group", "target_id": w.group_id, "name": item_groups.get(w.group_id, f"Group {w.group_id}"),
                              "icon": None, "path": []})
    return {
        "group_rules": sorted(
            [{**rule_out(r), "market_group_id": r.market_group_id, "name": t.name(r.market_group_id), "count": t.counts.get(r.market_group_id, 0),
              "path": t.path(t.groups.get(r.market_group_id, (None,))[0])} for r in program.group_rules.all()],
            key=lambda r: [p["name"] for p in r["path"]] + [r["name"]],
        ),
        "item_rules": sorted(
            [{**rule_out(r), "type_id": r.type_id, "name": types[r.type_id].name if r.type_id in types else f"Type {r.type_id}",
              "icon": type_icon_url(r.type_id, 32), "path": t.path(types[r.type_id].market_group_id if r.type_id in types else None)}
             for r in item_rules],
            key=lambda r: r["name"],
        ),
        "watch_rules": sorted(out_watch, key=lambda w: w["name"]),
    }
