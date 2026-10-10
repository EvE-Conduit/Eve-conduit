import { ApiError as e, Avatar as t, Badge as n, Button as r, Card as i, ConfirmDialog as a, DropdownContent as o, DropdownItem as s, DropdownMenu as c, DropdownSeparator as l, DropdownTrigger as u, EmptyState as d, Field as f, Input as p, PageHeader as m, SearchInput as h, Segmented as g, Select as _, Skeleton as v, SwitchRow as y, Textarea as b, api as x, buttonVariants as S, cn as C, dateTime as w, definePlugin as T, timeAgo as E, toast as D } from "@conduit/sdk";
import { Link as O, useLocation as k, useNavigate as ee, useParams as A, useSearchParams as te } from "react-router";
import { useMutation as ne, useQuery as j, useQueryClient as M } from "@tanstack/react-query";
import { Fragment as N, useEffect as P, useMemo as F, useRef as re, useState as I } from "react";
import { Fragment as L, jsx as R, jsxs as z } from "react/jsx-runtime";
//#region src/icons.tsx
function B({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ R("svg", {
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: t,
		"aria-hidden": !0,
		children: e
	});
}
var V = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M12 7v14" }), /* @__PURE__ */ R("path", { d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" })]
}), ie = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" })
}), ae = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }), /* @__PURE__ */ R("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), H = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M5 12h14" }), /* @__PURE__ */ R("path", { d: "M12 5v14" })]
}), oe = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M3 6h18" }),
		/* @__PURE__ */ R("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ R("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), U = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ R("path", { d: "M12 6v6l4 2" })]
}), W = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "m9 18 6-6-6-6" })
}), se = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "m6 9 6 6 6-6" })
}), ce = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ R("path", { d: "M19 12H5" })]
}), le = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("rect", {
		width: "18",
		height: "11",
		x: "3",
		y: "11",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ R("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })]
}), ue = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}),
		/* @__PURE__ */ R("path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }),
		/* @__PURE__ */ R("path", { d: "M2 12h20" })
	]
}), de = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }),
		/* @__PURE__ */ R("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }),
		/* @__PURE__ */ R("path", { d: "M10 9H8" }),
		/* @__PURE__ */ R("path", { d: "M16 13H8" }),
		/* @__PURE__ */ R("path", { d: "M16 17H8" })
	]
}), fe = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), /* @__PURE__ */ R("path", { d: "M3 3v5h5" })]
}), pe = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M3 12h.01" }),
		/* @__PURE__ */ R("path", { d: "M3 18h.01" }),
		/* @__PURE__ */ R("path", { d: "M3 6h.01" }),
		/* @__PURE__ */ R("path", { d: "M8 12h13" }),
		/* @__PURE__ */ R("path", { d: "M8 18h13" }),
		/* @__PURE__ */ R("path", { d: "M8 6h13" })
	]
}), me = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("circle", {
			cx: "12",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ R("circle", {
			cx: "19",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ R("circle", {
			cx: "5",
			cy: "12",
			r: "1"
		})
	]
}), he = /(!\[[^\]\n]{0,200}\]\([^)\s]{1,2000}\)|\[\[[^\]\n]{1,300}\]\]|\*\*[^*\n]{1,500}\*\*|\*[^*\s][^*\n]{0,500}\*|_[^_\s][^_\n]{0,500}_|~~[^~\n]{1,500}~~|`[^`\n]{1,500}`|\[[^\]\n]{1,200}\]\([^)\s]{1,2000}\))/g;
function G(e) {
	return e.normalize("NFKD").replace(/[^\x00-\x7f]/g, "").toLowerCase().replace(/[^\w\s-]/g, "").replace(/[-\s]+/g, "-").replace(/^[-_]+|[-_]+$/g, "");
}
function ge(e) {
	return e.startsWith("https://") || e.startsWith("/") && !e.startsWith("//") && !e.includes("\\") || e.startsWith("#") ? e : null;
}
function _e(e) {
	let t = [], n = /* @__PURE__ */ new Map(), r = !1;
	for (let i of e.replace(/\r\n/g, "\n").split("\n")) {
		if (/^\s*```/.test(i)) {
			r = !r;
			continue;
		}
		if (r) continue;
		let e = i.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
		if (!e) continue;
		let a = ve(e[2]), o = G(a) || "section", s = n.get(o) ?? 0;
		n.set(o, s + 1), s && (o = `${o}-${s + 1}`), t.push({
			level: e[1].length,
			text: a,
			id: o
		});
	}
	return t;
}
function ve(e) {
	return e.replace(/!\[([^\]\n]{0,200})\]\([^)\s]{1,2000}\)/g, "$1").replace(/\[\[([^\]|\n]{1,200})(?:\|([^\]\n]{1,200}))?\]\]/g, (e, t, n) => n ?? t).replace(/\[([^\]\n]{1,200})\]\([^)\s]{1,2000}\)/g, "$1").replace(/[*_`~]+/g, "").trim();
}
function K(e, t, n) {
	let r = [], i = 0, a = 0;
	for (let o of e.matchAll(he)) {
		let s = o[0], c = o.index ?? 0;
		c > i && r.push(e.slice(i, c));
		let l = `${t}-${a++}`;
		if (s.startsWith("![")) {
			let [, e, t] = s.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/) ?? [], n = t && t.startsWith("https://") ? t : null;
			r.push(n ? /* @__PURE__ */ R("img", {
				src: n,
				alt: e ?? "",
				loading: "lazy",
				className: "my-2 max-h-[480px] max-w-full border border-border"
			}, l) : e);
		} else if (s.startsWith("[[")) {
			let [, e, t] = s.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/) ?? [], i = e ? G(e.trim()) : "";
			r.push(i ? /* @__PURE__ */ R(O, {
				to: `${n.linkBase}/${i}`,
				className: "text-accent-ink underline underline-offset-4 decoration-accent/40 hover:no-underline",
				children: (t ?? e ?? "").trim()
			}, l) : s);
		} else if (s.startsWith("**")) r.push(/* @__PURE__ */ R("strong", {
			className: "font-semibold text-text",
			children: K(s.slice(2, -2), l, n)
		}, l));
		else if (s.startsWith("~~")) r.push(/* @__PURE__ */ R("s", {
			className: "text-subtle",
			children: K(s.slice(2, -2), l, n)
		}, l));
		else if (s.startsWith("`")) r.push(/* @__PURE__ */ R("code", {
			className: "bg-hover px-1 py-0.5 font-mono text-[0.9em] text-text",
			children: s.slice(1, -1)
		}, l));
		else if (s.startsWith("[")) {
			let [, e, t] = s.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/) ?? [], n = t ? ge(t) : null;
			r.push(n ? /* @__PURE__ */ R("a", {
				href: n,
				className: "text-accent-ink underline underline-offset-4 hover:no-underline",
				...n.startsWith("https://") ? {
					target: "_blank",
					rel: "noreferrer"
				} : {},
				children: e
			}, l) : e);
		} else r.push(/* @__PURE__ */ R("em", { children: K(s.slice(1, -1), l, n) }, l));
		i = c + s.length;
	}
	return i < e.length && r.push(e.slice(i)), r;
}
function ye(e, t, n) {
	return e.split("\n").map((e, r) => /* @__PURE__ */ z(N, { children: [r > 0 && /* @__PURE__ */ R("br", {}), K(e, `${t}-l${r}`, n)] }, `${t}-l${r}`));
}
var q = /^(\s*)([-*]|\d+[.)])\s+(.*)$/, be = /^\[([ xX])\]\s+(.*)$/;
function xe(e) {
	let t = {
		text: "",
		ordered: !1,
		children: []
	}, n = [{
		indent: -1,
		item: t
	}];
	for (let t of e) {
		let e = t.match(q);
		if (!e) {
			let e = n[n.length - 1].item;
			e.text += `\n${t.trim()}`;
			continue;
		}
		let r = e[1].replace(/\t/g, "  ").length, i = {
			text: e[3],
			ordered: /\d/.test(e[2]),
			children: []
		};
		for (; n.length > 1 && n[n.length - 1].indent >= r;) n.pop();
		n[n.length - 1].item.children.push(i), n.push({
			indent: r,
			item: i
		});
	}
	return t.children;
}
function Se(e, t, n) {
	let r = e[0]?.ordered;
	return /* @__PURE__ */ R(r ? "ol" : "ul", {
		className: `${r ? "list-decimal" : "list-disc"} space-y-1 pl-5`,
		children: e.map((e, r) => {
			let i = e.text.match(be);
			return /* @__PURE__ */ z("li", {
				className: i ? "list-none -ml-5 flex items-start gap-2" : void 0,
				children: [i ? /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R("input", {
					type: "checkbox",
					checked: i[1] !== " ",
					readOnly: !0,
					tabIndex: -1,
					className: "mt-1 size-3.5 shrink-0 accent-[var(--site-accent)]",
					"aria-label": i[1] === " " ? "Not done" : "Done"
				}), /* @__PURE__ */ R("span", { children: ye(i[2], `${t}-${r}`, n) })] }) : ye(e.text, `${t}-${r}`, n), e.children.length > 0 && /* @__PURE__ */ R("div", {
					className: "mt-1",
					children: Se(e.children, `${t}-${r}-c`, n)
				})]
			}, r);
		})
	}, t);
}
function Ce(e) {
	return e.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((e) => e.trim());
}
function we(e, t, n) {
	let [r, , ...i] = e, a = Ce(e[1]).map((e) => e.startsWith(":") && e.endsWith(":") ? "center" : e.endsWith(":") ? "right" : "left"), o = (e) => a[e] === "center" ? "text-center" : a[e] === "right" ? "text-right" : "text-left";
	return /* @__PURE__ */ R("div", {
		className: "overflow-x-auto border border-border",
		children: /* @__PURE__ */ z("table", {
			className: "w-full text-sm",
			children: [/* @__PURE__ */ R("thead", {
				className: "bg-surface-2",
				children: /* @__PURE__ */ R("tr", { children: Ce(r).map((e, r) => /* @__PURE__ */ R("th", {
					className: `px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted ${o(r)}`,
					children: K(e, `${t}-h${r}`, n)
				}, r)) })
			}), /* @__PURE__ */ R("tbody", {
				className: "divide-y divide-border",
				children: i.map((e, r) => /* @__PURE__ */ R("tr", { children: Ce(e).map((e, i) => /* @__PURE__ */ R("td", {
					className: `px-3 py-2 align-top ${o(i)}`,
					children: K(e, `${t}-r${r}c${i}`, n)
				}, i)) }, r))
			})]
		})
	}, t);
}
var Te = {
	1: "text-2xl font-semibold",
	2: "text-xl font-semibold mt-8 first:mt-0",
	3: "text-base font-semibold mt-6 first:mt-0",
	4: "text-sm font-semibold uppercase tracking-[0.12em] mt-4 first:mt-0"
};
function Ee({ text: e, ctx: t }) {
	let n = e.replace(/\r\n/g, "\n").split("\n"), r = [], i = 0, a = 0, o = () => `b${a++}`;
	for (; i < n.length;) {
		let e = n[i];
		if (!e.trim()) {
			i++;
			continue;
		}
		let a = e.match(/^\s*```\s*(\w*)\s*$/);
		if (a) {
			let e = [];
			for (i++; i < n.length && !/^\s*```\s*$/.test(n[i]);) e.push(n[i++]);
			i++, r.push(/* @__PURE__ */ R("pre", {
				className: "overflow-x-auto border border-border bg-surface-2 p-3 font-mono text-[13px] leading-relaxed text-text",
				"data-lang": a[1] || void 0,
				children: /* @__PURE__ */ R("code", { children: e.join("\n") })
			}, o()));
			continue;
		}
		let s = e.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
		if (s) {
			let e = s[1].length, n = G(ve(s[2])) || "section", a = t.ids.get(n) ?? 0;
			t.ids.set(n, a + 1), a && (n = `${n}-${a + 1}`);
			let c = `h${Math.min(e + 1, 6)}`;
			r.push(/* @__PURE__ */ R(c, {
				id: n,
				className: `group scroll-mt-24 text-text ${Te[e]}`,
				children: /* @__PURE__ */ R("a", {
					href: `#${n}`,
					className: "no-underline",
					children: K(s[2], `h${n}`, t)
				})
			}, o())), i++;
			continue;
		}
		if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(e)) {
			r.push(/* @__PURE__ */ R("hr", { className: "border-border" }, o())), i++;
			continue;
		}
		if (e.trim().startsWith("|") && i + 1 < n.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(n[i + 1])) {
			let a = [e, n[i + 1]];
			for (i += 2; i < n.length && n[i].trim().startsWith("|");) a.push(n[i++]);
			r.push(we(a, o(), t));
			continue;
		}
		if (e.startsWith(">")) {
			let e = [];
			for (; i < n.length && n[i].startsWith(">");) e.push(n[i++].replace(/^>\s?/, ""));
			r.push(/* @__PURE__ */ R("blockquote", {
				className: "border-l-2 border-accent/50 pl-4 text-muted",
				children: /* @__PURE__ */ R(Ee, {
					text: e.join("\n"),
					ctx: t
				})
			}, o()));
			continue;
		}
		if (q.test(e)) {
			let e = [];
			for (; i < n.length && n[i].trim() && (q.test(n[i]) || /^\s{2,}/.test(n[i]));) e.push(n[i++]);
			r.push(Se(xe(e), o(), t));
			continue;
		}
		let c = [];
		for (; i < n.length && n[i].trim() && !/^(#{1,4}\s|\s*```|>|\s*\|)/.test(n[i]) && !q.test(n[i]);) c.push(n[i++]);
		c.length === 0 && (c.push(e), i++), r.push(/* @__PURE__ */ R("p", { children: ye(c.join("\n"), o(), t) }, o()));
	}
	return /* @__PURE__ */ R(L, { children: r });
}
function De({ text: e, linkBase: t, className: n = "" }) {
	let r = {
		linkBase: t,
		ids: /* @__PURE__ */ new Map()
	};
	return /* @__PURE__ */ R("div", {
		className: `space-y-4 text-[15px] leading-relaxed text-muted [&_p]:text-muted ${n}`,
		children: /* @__PURE__ */ R(Ee, {
			text: e,
			ctx: r
		})
	});
}
//#endregion
//#region src/types.ts
var J = "/api/p/wiki", Oe = "/api/public/p/wiki", Y = "/p/wiki", X = "/public/p/wiki";
//#endregion
//#region src/shell.tsx
function Z() {
	return j({
		queryKey: ["wiki", "overview"],
		queryFn: () => x.get(J),
		staleTime: 3e4
	});
}
function ke(e, t = 0, n = []) {
	for (let r of e) n.push({
		node: r,
		depth: t
	}), r.children?.length && ke(r.children, t + 1, n);
	return n;
}
function Ae(e, t, n = []) {
	for (let r of e) {
		let e = [...n, r.id];
		if (r.slug === t) return e;
		let i = r.children?.length ? Ae(r.children, t, e) : null;
		if (i) return i;
	}
	return null;
}
function je(e, t) {
	return e.title.toLowerCase().includes(t) || (e.children ?? []).some((e) => je(e, t));
}
function Me({ node: e, depth: t, current: n, open: r, toggle: i, filter: a, linkBase: o }) {
	let s = (e.children ?? []).filter((e) => !a || je(e, a)), c = !!a || r.has(e.id), l = e.slug === n;
	return /* @__PURE__ */ z("li", { children: [/* @__PURE__ */ z("div", {
		className: C("group flex items-center gap-1", l && "bg-accent-soft"),
		style: { paddingLeft: t * 12 },
		children: [s.length > 0 ? /* @__PURE__ */ R("button", {
			type: "button",
			onClick: () => i(e.id),
			className: "flex size-6 shrink-0 items-center justify-center text-subtle hover:text-text",
			"aria-label": c ? "Collapse" : "Expand",
			"aria-expanded": c,
			children: R(c ? se : W, { className: "size-3.5" })
		}) : /* @__PURE__ */ R("span", {
			className: "size-6 shrink-0",
			"aria-hidden": !0
		}), /* @__PURE__ */ z(O, {
			to: e.slug === "home" ? o : `${o}/${e.slug}`,
			className: C("flex min-w-0 flex-1 items-center gap-1.5 py-1 pr-2 text-sm", l ? "font-medium text-text" : "text-muted hover:text-text"),
			"aria-current": l ? "page" : void 0,
			children: [
				/* @__PURE__ */ R("span", {
					className: "truncate",
					children: e.title
				}),
				e.locked && /* @__PURE__ */ R(le, { className: "size-3 shrink-0 text-subtle" }),
				e.public && /* @__PURE__ */ R(ue, { className: "size-3 shrink-0 text-subtle" })
			]
		})]
	}), s.length > 0 && c && /* @__PURE__ */ R("ul", { children: s.map((e) => /* @__PURE__ */ R(Me, {
		node: e,
		depth: t + 1,
		current: n,
		open: r,
		toggle: i,
		filter: a,
		linkBase: o
	}, e.id)) })] });
}
function Ne({ nodes: e, current: t, linkBase: n, canEdit: r }) {
	let [i, a] = I(""), [o, s] = I(() => /* @__PURE__ */ new Set());
	P(() => {
		if (!t) return;
		let n = Ae(e, t);
		n && s((e) => /* @__PURE__ */ new Set([...e, ...n]));
	}, [e, t]);
	let c = (e) => s((t) => {
		let n = new Set(t);
		return n.has(e) ? n.delete(e) : n.add(e), n;
	}), l = i.trim().toLowerCase(), u = l ? e.filter((e) => je(e, l)) : e;
	return /* @__PURE__ */ z("nav", {
		"aria-label": "Wiki pages",
		className: "space-y-2",
		children: [
			e.length > 6 && /* @__PURE__ */ R(h, {
				value: i,
				onChange: (e) => a(e.target.value),
				placeholder: "Find a page",
				"aria-label": "Find a page"
			}),
			u.length === 0 ? /* @__PURE__ */ R("p", {
				className: "px-2 py-1 text-xs text-subtle",
				children: l ? "No page with that name." : "No pages yet."
			}) : /* @__PURE__ */ R("ul", { children: u.map((e) => /* @__PURE__ */ R(Me, {
				node: e,
				depth: 0,
				current: t,
				open: o,
				toggle: c,
				filter: l,
				linkBase: n
			}, e.id)) }),
			r && /* @__PURE__ */ z(O, {
				to: "/p/wiki/new",
				className: C(S({
					variant: "ghost",
					size: "xs"
				}), "w-full justify-start"),
				children: [/* @__PURE__ */ R(H, {}), " New page"]
			})
		]
	});
}
function Q({ current: e, tree: t, loading: n, canEdit: r, linkBase: i = Y, aside: a, children: o }) {
	let s = k(), [c, l] = I(!1);
	return P(() => l(!1), [s.pathname]), /* @__PURE__ */ z("div", {
		className: "grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_200px]",
		children: [
			/* @__PURE__ */ z("aside", {
				className: "lg:sticky lg:top-20 lg:self-start",
				children: [/* @__PURE__ */ z("button", {
					type: "button",
					onClick: () => l((e) => !e),
					className: "flex w-full items-center gap-2 border border-border px-3 py-2 text-sm text-muted lg:hidden",
					"aria-expanded": c,
					children: [
						/* @__PURE__ */ R(pe, {}),
						" Pages ",
						R(c ? se : W, { className: "ml-auto" })
					]
				}), /* @__PURE__ */ z("div", {
					className: C("mt-2 lg:mt-0", c ? "block" : "hidden lg:block"),
					children: [/* @__PURE__ */ z("div", {
						className: "mb-2 hidden items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-subtle lg:flex",
						children: [/* @__PURE__ */ R(V, { className: "size-3.5" }), " Pages"]
					}), n || !t ? /* @__PURE__ */ R("div", {
						className: "space-y-2",
						children: [
							0,
							1,
							2,
							3
						].map((e) => /* @__PURE__ */ R(v, { className: "h-6" }, e))
					}) : /* @__PURE__ */ R(Ne, {
						nodes: t,
						current: e,
						linkBase: i,
						canEdit: r
					})]
				})]
			}),
			/* @__PURE__ */ R("div", {
				className: "min-w-0",
				children: o
			}),
			/* @__PURE__ */ R("div", {
				className: "hidden xl:block",
				children: a
			})
		]
	});
}
function Pe({ body: e }) {
	let t = F(() => _e(e).filter((e) => e.level <= 3), [e]), [n, r] = I(null);
	return P(() => {
		if (t.length === 0) return;
		let e = t.map((e) => document.getElementById(e.id)).filter((e) => !!e), n = new IntersectionObserver((e) => {
			let t = e.filter((e) => e.isIntersecting).sort((e, t) => e.boundingClientRect.top - t.boundingClientRect.top);
			t[0] && r(t[0].target.id);
		}, { rootMargin: "-80px 0px -70% 0px" });
		return e.forEach((e) => n.observe(e)), () => n.disconnect();
	}, [t]), t.length < 2 ? null : /* @__PURE__ */ R(Fe, {
		items: t,
		active: n
	});
}
function Fe({ items: e, active: t }) {
	let n = Math.min(...e.map((e) => e.level));
	return /* @__PURE__ */ z("nav", {
		"aria-label": "On this page",
		className: "sticky top-20 text-sm",
		children: [/* @__PURE__ */ R("div", {
			className: "mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-subtle",
			children: "On this page"
		}), /* @__PURE__ */ R("ul", {
			className: "space-y-1 border-l border-border",
			children: e.map((e) => /* @__PURE__ */ R("li", {
				style: { paddingLeft: 12 + (e.level - n) * 12 },
				children: /* @__PURE__ */ R("a", {
					href: `#${e.id}`,
					className: C("-ml-px block truncate border-l py-0.5 pl-2", t === e.id ? "border-accent text-text" : "border-transparent text-muted hover:text-text"),
					children: e.text
				})
			}, e.id))
		})]
	});
}
function Ie({ node: e, className: t }) {
	return e.children?.length ? /* @__PURE__ */ R(V, { className: t }) : /* @__PURE__ */ R(de, { className: t });
}
//#endregion
//#region src/pages.tsx
function Le(t) {
	return j({
		queryKey: [
			"wiki",
			"page",
			t
		],
		queryFn: () => x.get(`${J}/pages/${encodeURIComponent(t)}`),
		enabled: !!t,
		retry: (t, n) => !(n instanceof e && n.status === 404) && t < 2
	});
}
function Re() {
	let { data: e, isLoading: t } = Z();
	return /* @__PURE__ */ R(Q, {
		current: "home",
		tree: e?.tree,
		loading: t,
		canEdit: e?.can_edit,
		aside: e?.home ? /* @__PURE__ */ R(Pe, { body: e.home.body }) : null,
		children: t || !e ? /* @__PURE__ */ R(v, { className: "h-64" }) : e.home ? /* @__PURE__ */ R($, {
			page: e.home,
			canManage: e.can_manage
		}) : /* @__PURE__ */ R(ze, {
			recent: e.recent,
			count: e.count,
			canEdit: e.can_edit
		})
	});
}
function ze({ recent: e, count: t, canEdit: n }) {
	return /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(m, {
		eyebrow: "Wiki",
		title: "Wiki",
		icon: /* @__PURE__ */ R(V, {}),
		description: "Guides, rules and reference pages written by your corporation.",
		actions: n ? /* @__PURE__ */ z(O, {
			to: `${Y}/new?slug=home&title=Home`,
			className: S({ variant: "primary" }),
			children: [/* @__PURE__ */ R(H, {}), " Write the home page"]
		}) : void 0
	}), t === 0 ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(d, {
		icon: /* @__PURE__ */ R(V, {}),
		title: "Nothing written yet",
		description: n ? "Start with a home page: what the wiki is for and where to find things. Pages can be nested under each other and linked with [[Page Title]]." : "Nobody has written a page yet. Check back later.",
		action: n ? /* @__PURE__ */ z(O, {
			to: `${Y}/new?slug=home&title=Home`,
			className: S({ variant: "primary" }),
			children: [/* @__PURE__ */ R(H, {}), " Write the home page"]
		}) : void 0
	}) }) : /* @__PURE__ */ z(i, {
		className: "p-card",
		children: [
			/* @__PURE__ */ R("h2", {
				className: "mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle",
				children: "Recently updated"
			}),
			/* @__PURE__ */ R(Be, { pages: e }),
			n && /* @__PURE__ */ z("p", {
				className: "mt-4 text-xs text-subtle",
				children: [
					"Tip: a page saved at the address ",
					/* @__PURE__ */ R("code", {
						className: "bg-hover px-1",
						children: "home"
					}),
					" is shown here instead of this list."
				]
			})
		]
	})] });
}
function Be({ pages: e, linkBase: t = Y }) {
	return e.length === 0 ? /* @__PURE__ */ R("p", {
		className: "text-sm text-subtle",
		children: "No pages yet."
	}) : /* @__PURE__ */ R("ul", {
		className: "divide-y divide-border",
		children: e.map((e) => /* @__PURE__ */ R("li", { children: /* @__PURE__ */ z(O, {
			to: e.slug === "home" ? t : `${t}/${e.slug}`,
			className: "flex items-center gap-3 py-2 text-sm hover:text-text",
			children: [
				/* @__PURE__ */ R(Ie, {
					node: e,
					className: "size-4 shrink-0 text-subtle"
				}),
				/* @__PURE__ */ R("span", {
					className: "min-w-0 flex-1 truncate font-medium",
					children: e.title
				}),
				/* @__PURE__ */ R("span", {
					className: "shrink-0 text-xs text-subtle",
					children: E(e.updated_at)
				})
			]
		}) }, e.id))
	});
}
function Ve() {
	let { slug: t } = A(), n = Z(), { data: r, isLoading: a, error: o } = Le(t), s = o instanceof e && o.status === 404;
	return /* @__PURE__ */ R(Q, {
		current: t ?? null,
		tree: n.data?.tree,
		loading: n.isLoading,
		canEdit: n.data?.can_edit,
		aside: r ? /* @__PURE__ */ R(Pe, { body: r.body }) : null,
		children: a ? /* @__PURE__ */ R(v, { className: "h-64" }) : s || !r ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(d, {
			icon: /* @__PURE__ */ R(V, {}),
			title: "No such page",
			description: n.data?.can_edit ? "There's no page at this address yet. You can write it." : "There's no page at this address, or it isn't meant for you.",
			action: /* @__PURE__ */ z("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ R(O, {
					to: Y,
					className: S({ variant: "secondary" }),
					children: "Back to the wiki"
				}), n.data?.can_edit && t && /* @__PURE__ */ z(O, {
					to: `/p/wiki/new?slug=${encodeURIComponent(t)}&title=${encodeURIComponent(t.replace(/[-_]+/g, " ").replace(/\b\w/g, (e) => e.toUpperCase()))}`,
					className: S({ variant: "primary" }),
					children: [/* @__PURE__ */ R(H, {}), " Write this page"]
				})]
			})
		}) }) : /* @__PURE__ */ R($, {
			page: r,
			canManage: !!n.data?.can_manage
		})
	});
}
function $({ page: e, canManage: i, linkBase: d = Y, readOnly: f }) {
	let p = M(), m = ee(), [h, g] = I(!1), _ = ne({
		mutationFn: () => x.delete(`${J}/pages/${encodeURIComponent(e.slug)}`),
		onSuccess: () => {
			p.invalidateQueries({ queryKey: ["wiki"] }), D.success("Page deleted"), m(e.breadcrumbs.length ? `${Y}/${e.breadcrumbs[e.breadcrumbs.length - 1].slug}` : Y);
		},
		onError: (e) => D.error(e.message)
	});
	P(() => {
		window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({ block: "start" });
	}, [e.slug]);
	let v = [...(e.states ?? []).map((e) => e.name), ...(e.groups ?? []).map((e) => e.name)], y = !f && !!e.can_edit, b = (e) => e === "home" ? d : `${d}/${e}`;
	return /* @__PURE__ */ z("article", {
		className: "mx-auto max-w-3xl",
		children: [
			(e.breadcrumbs.length > 0 || e.slug !== "home") && /* @__PURE__ */ z("nav", {
				"aria-label": "Breadcrumb",
				className: "mb-3 flex flex-wrap items-center gap-1 text-xs text-subtle",
				children: [/* @__PURE__ */ R(O, {
					to: d,
					className: "hover:text-text",
					children: "Wiki"
				}), e.breadcrumbs.map((e) => /* @__PURE__ */ z("span", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ R(W, { className: "size-3" }), /* @__PURE__ */ R(O, {
						to: b(e.slug),
						className: "hover:text-text",
						children: e.title
					})]
				}, e.slug))]
			}),
			/* @__PURE__ */ z("header", {
				className: "mb-6 flex items-start gap-3 border-b border-border pb-5",
				children: [/* @__PURE__ */ z("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ z("div", {
							className: "mb-1.5 flex flex-wrap items-center gap-1.5 empty:hidden",
							children: [
								e.public && /* @__PURE__ */ z(n, {
									tone: "info",
									children: [/* @__PURE__ */ R(ue, { className: "size-3" }), " Public"]
								}),
								e.locked && /* @__PURE__ */ z(n, { children: [/* @__PURE__ */ R(le, { className: "size-3" }), " Locked"] }),
								i && v.length > 0 && /* @__PURE__ */ z(n, {
									tone: "accent",
									children: ["For ", v.join(", ")]
								})
							]
						}),
						/* @__PURE__ */ R("h1", {
							className: "text-2xl font-semibold leading-tight text-text sm:text-3xl",
							children: e.title
						}),
						!f && /* @__PURE__ */ z("div", {
							className: "mt-2 flex flex-wrap items-center gap-2 text-xs text-subtle",
							children: [
								e.updated_by && /* @__PURE__ */ R(t, {
									src: e.updated_by.portrait ?? void 0,
									name: e.updated_by.name,
									size: "xs"
								}),
								/* @__PURE__ */ R("span", {
									className: "text-muted",
									children: e.updated_by?.name ?? e.created_by?.name ?? "Unknown"
								}),
								/* @__PURE__ */ R("span", { children: "·" }),
								/* @__PURE__ */ R("time", {
									dateTime: e.updated_at,
									title: w(e.updated_at),
									children: E(e.updated_at)
								}),
								/* @__PURE__ */ R("span", { children: "·" }),
								/* @__PURE__ */ z(O, {
									to: `/p/wiki/${e.slug}/history`,
									className: "inline-flex items-center gap-1 hover:text-text",
									children: [
										/* @__PURE__ */ R(U, { className: "size-3" }),
										" ",
										e.revisions,
										" ",
										e.revisions === 1 ? "revision" : "revisions"
									]
								})
							]
						})
					]
				}), !f && (y || i) && /* @__PURE__ */ z("div", {
					className: "flex shrink-0 items-center gap-2",
					children: [y && /* @__PURE__ */ z(O, {
						to: `/p/wiki/${e.slug}/edit`,
						className: S({
							variant: "secondary",
							size: "sm"
						}),
						children: [/* @__PURE__ */ R(ie, {}), " Edit"]
					}), /* @__PURE__ */ z(c, { children: [/* @__PURE__ */ R(u, {
						asChild: !0,
						children: /* @__PURE__ */ R(r, {
							variant: "ghost",
							size: "icon-sm",
							"aria-label": "More",
							children: /* @__PURE__ */ R(me, {})
						})
					}), /* @__PURE__ */ z(o, {
						align: "end",
						children: [
							y && /* @__PURE__ */ z(s, {
								onSelect: () => m(`/p/wiki/new?parent=${e.id}`),
								children: [/* @__PURE__ */ R(H, {}), " New page under this one"]
							}),
							/* @__PURE__ */ z(s, {
								onSelect: () => m(`/p/wiki/${e.slug}/history`),
								children: [/* @__PURE__ */ R(U, {}), " History"]
							}),
							i && /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(l, {}), /* @__PURE__ */ z(s, {
								danger: !0,
								onSelect: () => g(!0),
								children: [/* @__PURE__ */ R(oe, {}), " Delete"]
							})] })
						]
					})] })]
				})]
			}),
			e.body.trim() ? /* @__PURE__ */ R(De, {
				text: e.body,
				linkBase: d
			}) : /* @__PURE__ */ z("p", {
				className: "text-sm text-subtle",
				children: ["This page is empty", y ? ": edit it to write something." : "."]
			}),
			e.children.length > 0 && /* @__PURE__ */ z("section", {
				className: "mt-10 border-t border-border pt-5",
				children: [/* @__PURE__ */ R("h2", {
					className: "mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle",
					children: "In this section"
				}), /* @__PURE__ */ R("ul", {
					className: "grid gap-2 sm:grid-cols-2",
					children: e.children.map((e) => /* @__PURE__ */ R("li", { children: /* @__PURE__ */ z(O, {
						to: b(e.slug),
						className: C("flex items-center gap-3 border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent hover:bg-hover"),
						children: [
							/* @__PURE__ */ R(Ie, {
								node: e,
								className: "size-4 shrink-0 text-subtle"
							}),
							/* @__PURE__ */ R("span", {
								className: "min-w-0 flex-1 truncate font-medium text-text",
								children: e.title
							}),
							/* @__PURE__ */ R(W, { className: "size-3.5 shrink-0 text-subtle" })
						]
					}) }, e.id))
				})]
			}),
			/* @__PURE__ */ R(a, {
				open: h,
				onOpenChange: g,
				danger: !0,
				title: `Delete "${e.title}"?`,
				description: e.children.length ? `Its ${e.children.length} sub-page${e.children.length === 1 ? "" : "s"} move up a level. The page and its history are gone for good.` : "The page and its history are gone for good.",
				confirmLabel: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(oe, {}), " Delete"] }),
				onConfirm: () => _.mutateAsync()
			})
		]
	});
}
//#endregion
//#region src/editor.tsx
var He = "**bold**, *italic*, `code`, [link](https://…), [[Page Title]] links to another page, # headings, - lists (indent to nest), 1. lists, - [ ] tasks, > quotes, | tables |, ``` code blocks, ![image](https://…).";
function Ue() {
	let { slug: e } = A(), [t] = te(), n = Z(), { data: r, isLoading: i } = Le(e);
	return e && (i || !r) || n.isLoading || !n.data ? /* @__PURE__ */ R(v, { className: "h-96" }) : !n.data.can_edit || r && !r.can_edit ? /* @__PURE__ */ z("div", {
		className: "mx-auto max-w-xl py-12 text-center",
		children: [/* @__PURE__ */ R("p", {
			className: "text-sm text-muted",
			children: r?.locked ? "This page is locked; only people who manage the wiki can edit it." : "You can't edit wiki pages."
		}), /* @__PURE__ */ R(O, {
			to: r ? `${Y}/${r.slug}` : Y,
			className: "mt-3 inline-block text-sm text-accent-ink underline underline-offset-4",
			children: "Back"
		})]
	}) : /* @__PURE__ */ R(We, {
		page: r ?? null,
		canManage: n.data.can_manage,
		initial: {
			title: t.get("title") ?? "",
			slug: t.get("slug") ?? "",
			parent: t.get("parent")
		}
	}, r?.id ?? "new");
}
function We({ page: e, canManage: t, initial: n }) {
	let i = M(), a = ee(), o = Z(), { data: s } = j({
		queryKey: ["wiki", "audience"],
		queryFn: () => x.get(`${J}/audience`),
		enabled: t
	}), [c, l] = I({
		title: e?.title ?? n.title,
		slug: e?.slug ?? n.slug,
		body: e?.body ?? "",
		parent: e ? e.parent : n.parent ? Number(n.parent) : null,
		note: "",
		states: e?.states?.map((e) => e.id) ?? [],
		groups: e?.groups?.map((e) => e.id) ?? [],
		public: e?.public ?? !1,
		locked: e?.locked ?? !1
	}), [u, d] = I(!!e || !!n.slug), [h, v] = I("write"), S = (e) => l((t) => ({
		...t,
		...e
	})), C = (e, t) => S({ [e]: c[e].includes(t) ? c[e].filter((e) => e !== t) : [...c[e], t] }), w = re(!1);
	P(() => {
		w.current = e ? c.title !== e.title || c.body !== e.body : !!(c.title || c.body);
	}, [c, e]), P(() => {
		let e = (e) => {
			w.current && e.preventDefault();
		};
		return window.addEventListener("beforeunload", e), () => window.removeEventListener("beforeunload", e);
	}, []);
	let T = F(() => {
		let t = ke(o.data?.tree ?? []);
		if (!e) return t;
		let n = /* @__PURE__ */ new Set(), r = (e) => {
			n.add(e), t.filter((t) => t.node.parent === e).forEach((e) => r(e.node.id));
		};
		return r(e.id), t.filter((e) => !n.has(e.node.id));
	}, [o.data, e]), E = ne({
		mutationFn: () => {
			let n = {
				title: c.title,
				body: c.body,
				slug: c.slug.trim() || null,
				parent: c.parent,
				note: c.note,
				...t ? {
					states: c.states,
					groups: c.groups,
					public: c.public,
					locked: c.locked
				} : {}
			};
			return e ? x.put(`${J}/pages/${encodeURIComponent(e.slug)}`, n) : x.post(`${J}/pages`, n);
		},
		onSuccess: (t) => {
			w.current = !1, i.invalidateQueries({ queryKey: ["wiki"] }), D.success(e ? "Page saved" : "Page created"), a(t.slug === "home" ? Y : `${Y}/${t.slug}`);
		},
		onError: (e) => D.error(e.message)
	}), k = e ? e.slug === "home" ? Y : `${Y}/${e.slug}` : Y, A = c.states.length === 0 && c.groups.length === 0;
	return /* @__PURE__ */ z("div", {
		className: "mx-auto max-w-6xl",
		children: [
			/* @__PURE__ */ z(O, {
				to: k,
				className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
				children: [
					/* @__PURE__ */ R(ce, {}),
					" ",
					e ? e.title : "Wiki"
				]
			}),
			/* @__PURE__ */ R(m, {
				eyebrow: "Wiki",
				title: e ? "Edit page" : "New page",
				actions: /* @__PURE__ */ z("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ R(O, {
						to: k,
						className: "text-sm text-muted hover:text-text",
						children: "Cancel"
					}), /* @__PURE__ */ R(r, {
						variant: "primary",
						disabled: !c.title.trim(),
						loading: E.isPending,
						onClick: () => E.mutate(),
						children: e ? "Save" : "Create"
					})]
				})
			}),
			/* @__PURE__ */ z("div", {
				className: "grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]",
				children: [/* @__PURE__ */ z("div", {
					className: "min-w-0 space-y-4",
					children: [
						/* @__PURE__ */ R(f, {
							label: "Title",
							required: !0,
							children: /* @__PURE__ */ R(p, {
								value: c.title,
								maxLength: 200,
								onChange: (e) => S({
									title: e.target.value,
									...u ? {} : { slug: G(e.target.value) }
								}),
								placeholder: "Fleet rules",
								autoFocus: !e,
								className: "text-lg font-medium"
							})
						}),
						/* @__PURE__ */ z("div", { children: [/* @__PURE__ */ z("div", {
							className: "mb-1.5 flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ R("span", {
								className: "text-[13px] font-medium",
								children: "Text"
							}), /* @__PURE__ */ R(g, {
								value: h,
								onChange: v,
								size: "sm",
								options: [{
									value: "write",
									label: "Write",
									icon: /* @__PURE__ */ R(ie, {})
								}, {
									value: "preview",
									label: "Preview",
									icon: /* @__PURE__ */ R(ae, {})
								}]
							})]
						}), h === "write" ? /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(b, {
							rows: 24,
							value: c.body,
							onChange: (e) => S({ body: e.target.value }),
							onKeyDown: (e) => {
								if (e.key === "Tab") {
									e.preventDefault();
									let t = e.currentTarget, { selectionStart: n, selectionEnd: r, value: i } = t, a = `${i.slice(0, n)}  ${i.slice(r)}`;
									S({ body: a }), requestAnimationFrame(() => t.setSelectionRange(n + 2, n + 2));
								}
							},
							placeholder: "## Comms\n\nBe on Mumble before the fleet forms.\n\n- Doctrine: [[Ferox fleet]]\n- Broadcast for reps **early**\n\n| Role | Ship |\n|---|---|\n| Logi | Osprey |",
							className: "min-h-[480px] font-mono text-[13px]"
						}), /* @__PURE__ */ R("p", {
							className: "mt-1.5 text-xs text-subtle",
							children: He
						})] }) : /* @__PURE__ */ R("div", {
							className: "min-h-[480px] border border-border bg-bg/40 p-5",
							children: c.body.trim() ? /* @__PURE__ */ R(De, {
								text: c.body,
								linkBase: Y
							}) : /* @__PURE__ */ R("p", {
								className: "text-sm text-subtle",
								children: "Nothing to preview yet."
							})
						})] }),
						/* @__PURE__ */ R(f, {
							label: "What changed",
							hint: "A few words for the page's history. Optional.",
							children: /* @__PURE__ */ R(p, {
								value: c.note,
								maxLength: 200,
								onChange: (e) => S({ note: e.target.value }),
								placeholder: e ? "Updated the doctrine list" : ""
							})
						})
					]
				}), /* @__PURE__ */ z("div", {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ R(f, {
							label: "Address",
							hint: /* @__PURE__ */ z(L, { children: [
								"Shown as /p/wiki/",
								/* @__PURE__ */ R("b", { children: c.slug || G(c.title) || "…" }),
								". ",
								e && c.slug !== e.slug ? "Changing it breaks links to the old address." : "Letters, numbers and dashes."
							] }),
							children: /* @__PURE__ */ R(p, {
								value: c.slug,
								maxLength: 120,
								onChange: (e) => {
									d(!0), S({ slug: e.target.value });
								},
								placeholder: G(c.title) || "fleet-rules",
								className: "font-mono text-[13px]"
							})
						}),
						/* @__PURE__ */ R(f, {
							label: "Under",
							hint: "The page this one is nested in.",
							children: /* @__PURE__ */ z(_, {
								value: c.parent ?? "",
								onChange: (e) => S({ parent: e.target.value ? Number(e.target.value) : null }),
								children: [/* @__PURE__ */ R("option", {
									value: "",
									children: "Top level"
								}), T.map(({ node: e, depth: t }) => /* @__PURE__ */ R("option", {
									value: e.id,
									children: `${"\xA0\xA0\xA0".repeat(t)}${e.title}`
								}, e.id))]
							})
						}),
						t && /* @__PURE__ */ z(L, { children: [
							/* @__PURE__ */ z("div", { children: [
								/* @__PURE__ */ R("div", {
									className: "mb-1.5 text-[13px] font-medium",
									children: "Who sees it"
								}),
								/* @__PURE__ */ R("p", {
									className: "mb-2 text-xs text-muted",
									children: "Nothing picked means every member."
								}),
								/* @__PURE__ */ R("div", {
									className: "flex flex-wrap gap-1.5",
									children: (s?.states ?? []).map((e) => /* @__PURE__ */ R(Ge, {
										on: c.states.includes(e.id),
										onClick: () => C("states", e.id),
										color: e.color,
										children: e.name
									}, `s${e.id}`))
								}),
								(s?.groups.length ?? 0) > 0 && /* @__PURE__ */ R("div", {
									className: "mt-2 flex flex-wrap gap-1.5",
									children: s.groups.map((e) => /* @__PURE__ */ R(Ge, {
										on: c.groups.includes(e.id),
										onClick: () => C("groups", e.id),
										children: e.name
									}, `g${e.id}`))
								})
							] }),
							/* @__PURE__ */ z("div", {
								className: "divide-y divide-border border border-border px-3",
								children: [/* @__PURE__ */ R(y, {
									label: "Public",
									description: `Anyone can read it, signed in or not, at /public/p/wiki/${c.slug || G(c.title) || "…"}.`,
									checked: c.public,
									onCheckedChange: (e) => S({ public: e })
								}), /* @__PURE__ */ R(y, {
									label: "Locked",
									description: "Only people who manage the wiki can edit it.",
									checked: c.locked,
									onCheckedChange: (e) => S({ locked: e })
								})]
							}),
							/* @__PURE__ */ z("p", {
								className: "text-xs text-subtle",
								children: [
									A ? "Every member" : "Only the chosen states and groups",
									c.public ? " and anyone with the public link" : "",
									" will see it."
								]
							})
						] })
					]
				})]
			})
		]
	});
}
function Ge({ on: e, onClick: t, color: n, children: r }) {
	return /* @__PURE__ */ z("button", {
		type: "button",
		"aria-pressed": e,
		onClick: t,
		className: C("inline-flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors", e ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text"),
		children: [n && /* @__PURE__ */ R("span", {
			className: "size-1.5 rotate-45",
			style: { background: n }
		}), r]
	});
}
//#endregion
//#region src/history.tsx
function Ke(e, t) {
	let n = e.split("\n"), r = t.split("\n");
	if (n.length * r.length > 4e6) return null;
	let i = n.length, a = r.length, o = new Uint32Array((i + 1) * (a + 1));
	for (let e = i - 1; e >= 0; e--) for (let t = a - 1; t >= 0; t--) o[e * (a + 1) + t] = n[e] === r[t] ? o[(e + 1) * (a + 1) + t + 1] + 1 : Math.max(o[(e + 1) * (a + 1) + t], o[e * (a + 1) + t + 1]);
	let s = [], c = 0, l = 0;
	for (; c < i && l < a;) n[c] === r[l] ? (s.push({
		kind: "same",
		text: n[c]
	}), c++, l++) : o[(c + 1) * (a + 1) + l] >= o[c * (a + 1) + l + 1] ? s.push({
		kind: "del",
		text: n[c++]
	}) : s.push({
		kind: "add",
		text: r[l++]
	});
	for (; c < i;) s.push({
		kind: "del",
		text: n[c++]
	});
	for (; l < a;) s.push({
		kind: "add",
		text: r[l++]
	});
	return s;
}
function qe({ older: e, newer: t }) {
	let n = F(() => Ke(e, t), [e, t]);
	if (!n) return /* @__PURE__ */ R("p", {
		className: "text-sm text-subtle",
		children: "These revisions are too long to compare here."
	});
	if (n.every((e) => e.kind === "same")) return /* @__PURE__ */ R("p", {
		className: "text-sm text-subtle",
		children: "The text is the same."
	});
	let r = [];
	for (let e = 0; e < n.length; e++) {
		let t = n[e];
		if (t.kind !== "same") {
			r.push(t);
			continue;
		}
		let i = e;
		for (; i < n.length && n[i].kind === "same";) i++;
		let a = i - e, o = e === 0, s = i === n.length, c = o ? 0 : 3, l = s ? 0 : 3;
		if (a <= c + l + 1) for (let t = e; t < i; t++) r.push(n[t]);
		else {
			for (let t = e; t < e + c; t++) r.push(n[t]);
			r.push({
				kind: "skip",
				count: a - c - l
			});
			for (let e = i - l; e < i; e++) r.push(n[e]);
		}
		e = i - 1;
	}
	return /* @__PURE__ */ R("pre", {
		className: "overflow-x-auto border border-border font-mono text-[13px] leading-relaxed",
		children: r.map((e, t) => e.kind === "skip" ? /* @__PURE__ */ z("div", {
			className: "bg-surface-2 px-3 py-0.5 text-subtle",
			children: [
				"··· ",
				e.count,
				" unchanged ",
				e.count === 1 ? "line" : "lines"
			]
		}, t) : /* @__PURE__ */ z("div", {
			className: C("px-3", e.kind === "add" && "bg-success-soft text-success-fg", e.kind === "del" && "bg-danger-soft text-danger-fg line-through decoration-danger/40"),
			children: [/* @__PURE__ */ R("span", {
				className: "mr-2 inline-block w-3 select-none text-subtle",
				children: e.kind === "add" ? "+" : e.kind === "del" ? "−" : " "
			}), e.text || "\xA0"]
		}, t))
	});
}
function Je() {
	let { slug: e } = A(), n = M(), o = ee(), { data: s, isLoading: c } = j({
		queryKey: [
			"wiki",
			"history",
			e
		],
		queryFn: () => x.get(`${J}/pages/${encodeURIComponent(e)}/history`),
		enabled: !!e
	}), [l, u] = I(null), [f, p] = I("changes"), [h, _] = I(!1);
	P(() => {
		s && l === null && s.revisions[0] && u(s.revisions[0].number);
	}, [s, l]);
	let y = s?.revisions[0]?.number ?? null, b = j({
		queryKey: [
			"wiki",
			"revision",
			e,
			l
		],
		queryFn: () => x.get(`${J}/pages/${encodeURIComponent(e)}/history/${l}`),
		enabled: !!e && l !== null
	}), S = s && l !== null ? s.revisions.find((e) => e.number < l)?.number ?? null : null, T = j({
		queryKey: [
			"wiki",
			"revision",
			e,
			S
		],
		queryFn: () => x.get(`${J}/pages/${encodeURIComponent(e)}/history/${S}`),
		enabled: !!e && S !== null
	}), k = ne({
		mutationFn: (t) => x.post(`${J}/pages/${encodeURIComponent(e)}/restore/${t}`),
		onSuccess: () => {
			n.invalidateQueries({ queryKey: ["wiki"] }), D.success(`Revision ${l} restored`), o(e === "home" ? Y : `${Y}/${e}`);
		},
		onError: (e) => D.error(e.message)
	}), te = e === "home" ? Y : `${Y}/${e}`, N = s?.revisions.find((e) => e.number === l) ?? null;
	return /* @__PURE__ */ z("div", {
		className: "mx-auto max-w-6xl",
		children: [
			/* @__PURE__ */ z(O, {
				to: te,
				className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
				children: [
					/* @__PURE__ */ R(ce, {}),
					" ",
					s?.page.title ?? "Page"
				]
			}),
			/* @__PURE__ */ R(m, {
				eyebrow: "Wiki",
				title: "History",
				icon: /* @__PURE__ */ R(U, {}),
				description: s ? `${s.revisions.length} ${s.revisions.length === 1 ? "revision" : "revisions"} of "${s.page.title}".` : void 0
			}),
			c || !s ? /* @__PURE__ */ R(v, { className: "h-64" }) : s.revisions.length === 0 ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(d, {
				icon: /* @__PURE__ */ R(U, {}),
				title: "No history yet"
			}) }) : /* @__PURE__ */ z("div", {
				className: "grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]",
				children: [/* @__PURE__ */ R(i, {
					className: "self-start overflow-hidden",
					children: /* @__PURE__ */ R("ol", {
						className: "divide-y divide-border",
						children: s.revisions.map((e) => /* @__PURE__ */ R("li", { children: /* @__PURE__ */ z("button", {
							type: "button",
							onClick: () => u(e.number),
							"aria-current": e.number === l ? "true" : void 0,
							className: C("flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-hover", e.number === l && "bg-accent-soft"),
							children: [/* @__PURE__ */ z("span", {
								className: "mt-0.5 w-8 shrink-0 font-mono text-xs text-subtle",
								children: ["r", e.number]
							}), /* @__PURE__ */ z("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ R("span", {
									className: "block truncate text-sm font-medium text-text",
									children: e.note || (e.number === 1 ? "Written" : "Edited")
								}), /* @__PURE__ */ z("span", {
									className: "mt-0.5 flex items-center gap-1.5 text-xs text-subtle",
									children: [
										e.author && /* @__PURE__ */ R(t, {
											src: e.author.portrait ?? void 0,
											name: e.author.name,
											size: "xs"
										}),
										/* @__PURE__ */ R("span", {
											className: "truncate",
											children: e.author?.name ?? "Unknown"
										}),
										/* @__PURE__ */ R("span", { children: "·" }),
										/* @__PURE__ */ R("time", {
											dateTime: e.created_at,
											title: w(e.created_at),
											children: E(e.created_at)
										})
									]
								})]
							})]
						}) }, e.number))
					})
				}), /* @__PURE__ */ z("div", {
					className: "min-w-0 space-y-3",
					children: [N && /* @__PURE__ */ z("div", {
						className: "flex flex-wrap items-center gap-3",
						children: [
							/* @__PURE__ */ z("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ z("div", {
									className: "text-sm font-medium text-text",
									children: [
										"Revision ",
										N.number,
										N.number === y ? " (current)" : "",
										" · ",
										N.title
									]
								}), /* @__PURE__ */ z("div", {
									className: "text-xs text-subtle",
									children: [w(N.created_at), N.note ? ` · ${N.note}` : ""]
								})]
							}),
							/* @__PURE__ */ R(g, {
								value: f,
								onChange: p,
								size: "sm",
								options: [{
									value: "changes",
									label: S === null ? "Changes" : `Changes since r${S}`
								}, {
									value: "text",
									label: "As it looked"
								}]
							}),
							s.can_edit && N.number !== y && /* @__PURE__ */ z(r, {
								variant: "secondary",
								size: "sm",
								onClick: () => _(!0),
								children: [/* @__PURE__ */ R(fe, {}), " Restore"]
							})
						]
					}), /* @__PURE__ */ R(i, {
						className: "p-card",
						children: b.isLoading || !b.data || S !== null && T.isLoading ? /* @__PURE__ */ R(v, { className: "h-48" }) : f === "text" ? (b.data.body ?? "").trim() ? /* @__PURE__ */ R(De, {
							text: b.data.body ?? "",
							linkBase: Y
						}) : /* @__PURE__ */ R("p", {
							className: "text-sm text-subtle",
							children: "The page was empty."
						}) : /* @__PURE__ */ R(qe, {
							older: S === null ? "" : T.data?.body ?? "",
							newer: b.data.body ?? ""
						})
					})]
				})]
			}),
			/* @__PURE__ */ R(a, {
				open: h,
				onOpenChange: _,
				title: `Restore revision ${l}?`,
				description: "The page's title and text go back to how they were then. Nothing is lost: this becomes a new revision.",
				confirmLabel: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(fe, {}), " Restore"] }),
				onConfirm: () => l !== null && k.mutateAsync(l)
			})
		]
	});
}
//#endregion
//#region src/public.tsx
function Ye() {
	return j({
		queryKey: [
			"wiki",
			"public",
			"tree"
		],
		queryFn: () => x.get(`${Oe}/pages`),
		staleTime: 6e4
	});
}
function Xe(t) {
	return j({
		queryKey: [
			"wiki",
			"public",
			"page",
			t
		],
		queryFn: () => x.get(`${Oe}/pages/${encodeURIComponent(t)}`),
		enabled: !!t,
		retry: (t, n) => !(n instanceof e && n.status === 404) && t < 2
	});
}
function Ze() {
	let { data: e, isLoading: t } = Ye(), n = Xe(e?.tree.some((e) => e.slug === "home") ? "home" : void 0);
	return /* @__PURE__ */ R(Q, {
		current: "home",
		tree: e?.tree,
		loading: t,
		linkBase: X,
		children: t || !e ? /* @__PURE__ */ R(v, { className: "h-64" }) : n.data ? /* @__PURE__ */ R($, {
			page: n.data,
			linkBase: X,
			readOnly: !0
		}) : /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(m, {
			eyebrow: "Wiki",
			title: "Wiki",
			icon: /* @__PURE__ */ R(V, {}),
			description: "Pages shared with everyone."
		}), e.count === 0 && /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(d, {
			icon: /* @__PURE__ */ R(V, {}),
			title: "Nothing public yet"
		}) })] })
	});
}
function Qe() {
	let { slug: t } = A(), n = Ye(), { data: r, isLoading: a, error: o } = Xe(t), s = o instanceof e && o.status === 404;
	return /* @__PURE__ */ R(Q, {
		current: t ?? null,
		tree: n.data?.tree,
		loading: n.isLoading,
		linkBase: X,
		children: a ? /* @__PURE__ */ R(v, { className: "h-64" }) : s || !r ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(d, {
			icon: /* @__PURE__ */ R(V, {}),
			title: "No such page",
			description: "There's no public page at this address. Members may find it after signing in."
		}) }) : /* @__PURE__ */ R($, {
			page: r,
			linkBase: X,
			readOnly: !0
		})
	});
}
//#endregion
//#region src/index.tsx
function $e() {
	let { data: e, isLoading: t } = Z();
	return t ? /* @__PURE__ */ R(v, { className: "h-24" }) : e ? /* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R(Be, { pages: e.recent.slice(0, 5) }), /* @__PURE__ */ R(O, {
		to: Y,
		className: "mt-2 inline-block text-xs text-muted hover:text-text",
		children: "Open the wiki →"
	})] }) : null;
}
var et = T({
	routes: [
		{
			path: "",
			Component: Re
		},
		{
			path: "new",
			Component: Ue
		},
		{
			path: ":slug",
			Component: Ve
		},
		{
			path: ":slug/edit",
			Component: Ue
		},
		{
			path: ":slug/history",
			Component: Je
		}
	],
	publicRoutes: [{
		path: "",
		Component: Ze
	}, {
		path: ":slug",
		Component: Qe
	}],
	widgets: [{
		id: "recent",
		title: "Wiki",
		Component: $e,
		size: "sm",
		order: 40
	}]
});
//#endregion
export { et as default };

export const classes = ["!data","!filter","!readOnly","!tree","---","--site-accent","-c","-ml-5","-ml-px","@conduit/sdk","@tanstack/react-query","[&_p]:text-muted","a","accent","accent-[var(--site-accent)]","action","actions","active","add","address","adds","after","align","align-top","aligns","alt","an","anchors","and","another","anyone","are","aria-current","aria-expanded","aria-hidden","aria-label","aria-pressed","around","as","aside","at","atEnd","atStart","audience","author","autoFocus","b","back","background","banned","be","becomes","before","beforeunload","belong","bg-accent-soft","bg-bg/40","bg-danger-soft","bg-hover","bg-success-soft","bg-surface-2","big","blank","block","body","boolean","border","border-accent","border-accent/50","border-accent/60","border-b","border-border","border-l","border-l-2","border-t","border-transparent","bounded","breadcrumbs","breaks","browser","builds","but","button","by","can","canEdit","canManage","can_edit","can_manage","center","changed","changes","checkbox","checked","children","chosen","className","code","color","common","compare","compared","confirmLabel","const","content","context","continuation","count","crafted","created","created_at","ctx","current","currentColor","cx","cy","danger","data","data-lang","dateTime","decoration-accent/40","decoration-danger/40","deeper","default","del","deleted","depth","description","diff","dirty","disabled","divide-border","divide-y","doctrine","done","down","e","each","edit","el","elements","els","else","empty","empty:hidden","enabled","end","error","every","everyone","everything","export","extends","eyebrow","fence","few","fill","filter","find","finds","first:mt-0","fleet","fleet-rules","flex","flex-1","flex-wrap","folded","font-medium","font-mono","font-semibold","for","frame","from","function","gap-1","gap-1.5","gap-2","gap-3","gap-6","get","ghost","go","gone","grid","group","groups","h-24","h-48","h-6","h-64","h-96","h2","h3","h4","h5","has","header","heading","headings","height","here","hidden","highlighting","hint","history","home","hover:bg-hover","hover:border-accent","hover:border-border-strong","hover:no-underline","hover:text-text","how","href","i","icon","icon-sm","icons","id","ids","if","import","in","inCode","indent","indented","indents","index","info","initial","injects","inline","inline-block","inline-flex","instanceof","instead","interface","into","io","is","isLoading","isOpen","isn","it","item","items","items-center","items-start","its","j","joins","justify-between","justify-center","justify-start","k","keepAfter","keepBefore","key","kids","kind","l","label","last","latest","lazy","leading-relaxed","leading-tight","leaving","left","len","length","let","level","lg:block","lg:flex","lg:grid-cols-[240px_minmax(0,1fr)]","lg:grid-cols-[300px_minmax(0,1fr)]","lg:grid-cols-[minmax(0,1fr)_300px]","lg:hidden","lg:mt-0","lg:self-start","lg:sticky","lg:top-20","line","line-through","lines","link","linkBase","linked","links","list","list-decimal","list-disc","list-none","lists","little","loading","location","locked","long","looked","lost","m","m12","m15","m19","m21","m5","m6","m9","make","manage","mark","marked","match","matching","max-h-[480px]","max-w-3xl","max-w-6xl","max-w-full","max-w-xl","maxLength","may","mb-1.5","mb-2","mb-3","mb-4","mb-6","md","means","meant","member","members","min","min-h-[480px]","min-w-0","missing","ml-auto","mobileOpen","move","mr-2","mt-0.5","mt-1","mt-1.5","mt-10","mt-2","mt-3","mt-4","mt-6","mt-8","mutationFn","mx-auto","my-2","n","name","navigate","nested","never","new","newer","next","no","no-underline","nobody","node","nodes","none","noreferrer","not","note","null","number","numbers","of","ol","old","older","on","onChange","onCheckedChange","onClick","onConfirm","onError","onKeyDown","onOpenChange","onSelect","onSuccess","once","one","only","op","open","opens","ops","options","or","order","ordered","other","out","outside","overflow-hidden","overflow-x-auto","overview","own","p-3","p-5","p-card","paddingLeft","page","pages","para","parent","parents","part","patch","path","pathname","pb-5","people","per","picked","pl-2","pl-4","pl-5","placeholder","portrait","post","pr-2","prevNumber","preview","previous","primary","pt-5","public","publicRoutes","put","putting","px-1","px-2","px-3","py-0.5","py-1","py-12","py-2","py-2.5","q","qc","queryFn","queryKey","quote","react","react-router","read","readOnly","reader","readers","recent","reference","rel","removes","rendered","renderer","reps","rest","restore","restored","retry","return","revision","revisions","right","root","rootMargin","rotate-45","round","routes","row","rows","rule","rules","run","rx","ry","s","safe","same","save","saved","scroll","scroll-mt-24","secondary","section","see","seen","sees","sel","select-none","selected","selectionEnd","selectionStart","self-start","set","setActive","setDeleting","setFilter","setForm","setMobileOpen","setOpen","setRestoring","setSelected","setSlugTouched","setTab","setView","shared","shown","shrink-0","signed","signing","since","single","site","sites","sits","size","size-1.5","size-3","size-3.5","size-4","size-6","skip","slow","slug","slugify","sm","sm:grid-cols-2","sm:text-3xl","so","something","space-y-1","space-y-2","space-y-3","space-y-4","space-y-5","src","stack","staleTime","start","starts","states","status","stays","sticky","stretches","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","such","t","tabIndex","table","tables","target","task","text","text-2xl","text-[0.9em]","text-[13px]","text-[15px]","text-accent-ink","text-base","text-center","text-danger-fg","text-left","text-lg","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-text","text-xl","text-xs","that","the","them","then","there","they","this","title","to","toast","toggle","token","tone","too","top","top-20","tracking-[0.12em]","tracking-[0.1em]","trail","transition-colors","tree","true","truncate","type","ul","unchanged","under","underline","underline-offset-4","until","up","updated","updated_at","updated_by","uppercase","useLocation","useOverview","usePage","useParams","useQuery","useQueryClient","useSearchParams","useState","used","v","value","variant","view","viewBox","visible","w-3","w-8","w-full","warn","was","welcome","were","what","whatever","when","where","while","who","widgets","width","wiki","will","with","without","words","write","written","wrote","x","xX","xl:block","xl:grid-cols-[240px_minmax(0,1fr)_200px]","xs","yet","your"];
