import { Avatar as e, Badge as t, Button as n, Callout as r, Card as i, CardBody as a, CardHeader as o, Dialog as s, EmptyState as c, Field as l, Input as u, PageHeader as d, Progress as f, SearchInput as p, Segmented as m, Select as h, Skeleton as g, StatCard as _, SwitchRow as v, THead as y, Table as b, TableToolbar as x, Td as S, Th as C, Tooltip as w, Tr as T, api as E, cn as D, dateTime as O, definePlugin as k, duration as A, humanize as j, isk as M, num as N, toast as P } from "@conduit/sdk";
import { useMutation as F, useQuery as I, useQueryClient as L } from "@tanstack/react-query";
import { useEffect as R, useMemo as ee, useState as z } from "react";
import { Link as B } from "react-router";
import { Fragment as V, jsx as H, jsxs as U } from "react/jsx-runtime";
//#region src/icons.tsx
function W({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ H("svg", {
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
var G = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("rect", {
			width: "16",
			height: "20",
			x: "4",
			y: "2",
			rx: "2",
			ry: "2"
		}),
		/* @__PURE__ */ H("path", { d: "M9 22v-4h6v4" }),
		/* @__PURE__ */ H("path", { d: "M8 6h.01" }),
		/* @__PURE__ */ H("path", { d: "M16 6h.01" }),
		/* @__PURE__ */ H("path", { d: "M12 6h.01" }),
		/* @__PURE__ */ H("path", { d: "M12 10h.01" }),
		/* @__PURE__ */ H("path", { d: "M12 14h.01" }),
		/* @__PURE__ */ H("path", { d: "M16 10h.01" }),
		/* @__PURE__ */ H("path", { d: "M16 14h.01" }),
		/* @__PURE__ */ H("path", { d: "M8 10h.01" }),
		/* @__PURE__ */ H("path", { d: "M8 14h.01" })
	]
}), K = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("line", {
			x1: "3",
			x2: "15",
			y1: "22",
			y2: "22"
		}),
		/* @__PURE__ */ H("line", {
			x1: "4",
			x2: "14",
			y1: "9",
			y2: "9"
		}),
		/* @__PURE__ */ H("path", { d: "M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" }),
		/* @__PURE__ */ H("path", { d: "M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" })
	]
}), q = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M18 11V6a2 2 0 0 0-4 0v5" }),
		/* @__PURE__ */ H("path", { d: "M14 10V4a2 2 0 0 0-4 0v6" }),
		/* @__PURE__ */ H("path", { d: "M10 10.5V6a2 2 0 0 0-4 0v8" }),
		/* @__PURE__ */ H("path", { d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" })
	]
}), te = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M18 6 6 18" }), /* @__PURE__ */ H("path", { d: "m6 6 12 12" })]
}), ne = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" }), /* @__PURE__ */ H("path", { d: "m15 5 4 4" })]
}), re = (e) => /* @__PURE__ */ H(W, {
	...e,
	children: /* @__PURE__ */ H("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })
}), J = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }),
		/* @__PURE__ */ H("path", { d: "M15 18H9" }),
		/* @__PURE__ */ H("path", { d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" }),
		/* @__PURE__ */ H("circle", {
			cx: "17",
			cy: "18",
			r: "2"
		}),
		/* @__PURE__ */ H("circle", {
			cx: "7",
			cy: "18",
			r: "2"
		})
	]
}), Y = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ H("path", { d: "M19 12H5" })]
}), ie = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }),
		/* @__PURE__ */ H("path", { d: "M12 9v4" }),
		/* @__PURE__ */ H("path", { d: "M12 17h.01" })
	]
}), X = {
	ok: {
		label: "Fuelled",
		tone: "success"
	},
	warning: {
		label: "Low",
		tone: "warning"
	},
	danger: {
		label: "Critical",
		tone: "danger"
	},
	empty: {
		label: "Out of fuel",
		tone: "danger"
	},
	none: {
		label: "No fuel use",
		tone: "neutral"
	}
}, ae = {
	shield_vulnerable: "success",
	armor_vulnerable: "warning",
	hull_vulnerable: "danger",
	armor_reinforce: "danger",
	hull_reinforce: "danger",
	anchoring: "info",
	onlining_vulnerable: "info",
	unanchored: "neutral",
	low_power: "warning",
	abandoned: "danger"
};
function Z(e) {
	return e % 24 == 0 ? `${e / 24}d` : `${e}h`;
}
function oe(e) {
	let t = e.split(/[\s,]+/).filter(Boolean), n = [];
	for (let e of t) {
		let t = /^(\d+(?:\.\d+)?)\s*([dh]?)$/i.exec(e);
		if (!t) return null;
		let r = Number(t[1]) * (t[2].toLowerCase() === "h" ? 1 : 24);
		if (!(r >= 1)) return null;
		n.push(Math.round(r));
	}
	return [...new Set(n)].sort((e, t) => t - e);
}
var Q = "/api/p/structures", se = ["structures", "board"];
function $(e = 3e4) {
	let [t, n] = z(() => Date.now());
	return R(() => {
		let t = window.setInterval(() => n(Date.now()), e);
		return () => window.clearInterval(t);
	}, [e]), t;
}
var ce = [
	"warning",
	"danger",
	"empty"
], le = 720;
function ue() {
	let { data: e, isLoading: t } = I({
		queryKey: se,
		queryFn: () => E.get(`${Q}/board`),
		refetchInterval: 3e5
	}), [r, a] = z("all"), [o, s] = z(""), [l, u] = z(""), [f, v] = z("fuel"), [S, w] = z(null), [T, D] = z(null), O = $(), k = ee(() => {
		let t = e?.structures ?? [];
		r === "low" && (t = t.filter((e) => ce.includes(e.level))), r === "empty" && (t = t.filter((e) => e.level === "empty")), o && (t = t.filter((e) => String(e.corporation.id) === o));
		let n = l.trim().toLowerCase();
		n && (t = t.filter((e) => [
			e.name,
			e.type.name,
			e.system.name,
			e.system.region,
			e.corporation.ticker
		].some((e) => e.toLowerCase().includes(n))));
		let i = {
			fuel: () => 0,
			name: (e, t) => e.name.localeCompare(t.name),
			system: (e, t) => e.system.name.localeCompare(t.system.name) || e.name.localeCompare(t.name),
			burn: (e, t) => t.burn - e.burn
		};
		return [...t].sort(i[f]);
	}, [
		e,
		r,
		o,
		l,
		f
	]), A = e?.structures ?? [], j = A.filter((e) => e.level === "warning" || e.level === "danger").length, M = A.filter((e) => e.level === "empty").length, P = A.reduce((e, t) => e + t.burn, 0);
	return /* @__PURE__ */ U(V, { children: [
		/* @__PURE__ */ H(d, {
			eyebrow: "Operations",
			title: "Structures & Fuel",
			icon: /* @__PURE__ */ H(G, {}),
			description: "Every structure your corporations own that you may see on the corporation sheets, with fuel left, what it burns and who's refuelling it.",
			actions: /* @__PURE__ */ U("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ H(B, {
					to: "/p/structures/plan",
					children: /* @__PURE__ */ U(n, {
						variant: "ghost",
						children: [/* @__PURE__ */ H(J, {}), " Fuel plan"]
					})
				}), e?.can_manage && /* @__PURE__ */ H(B, {
					to: "/p/structures/settings",
					children: /* @__PURE__ */ U(n, {
						variant: "ghost",
						children: [/* @__PURE__ */ H(re, {}), " Settings"]
					})
				})]
			})
		}),
		t || !e ? /* @__PURE__ */ H(g, { className: "h-64" }) : A.length === 0 ? /* @__PURE__ */ H(i, { children: /* @__PURE__ */ H(c, {
			icon: /* @__PURE__ */ H(G, {}),
			title: e.can_view ? "No structures yet" : "No corporations to show",
			description: e.can_view ? "Structures show up once a Station Manager or Director's login syncs the corporation's Structures section." : "Structures follow the corporation sheet: you need permission to view a corporation to see its structures."
		}) }) : /* @__PURE__ */ U("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ U("div", {
				className: "grid grid-cols-2 gap-4 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ H(_, {
						label: "Structures",
						value: A.length,
						icon: /* @__PURE__ */ H(G, {}),
						hint: `${e.corporations.length} corporation${e.corporations.length === 1 ? "" : "s"}`
					}),
					/* @__PURE__ */ H(_, {
						label: "Below a threshold",
						value: j,
						icon: /* @__PURE__ */ H(K, {}),
						tone: j ? "warning" : "success",
						hint: `warnings at ${e.thresholds.map(Z).join(", ") || "none"}`
					}),
					/* @__PURE__ */ H(_, {
						label: "Out of fuel",
						value: M,
						icon: /* @__PURE__ */ H(ie, {}),
						tone: M ? "danger" : "success"
					}),
					/* @__PURE__ */ H(_, {
						label: "Burning",
						value: `${N(Math.ceil(P * 24))}`,
						icon: /* @__PURE__ */ H(K, {}),
						hint: "fuel blocks a day"
					})
				]
			}), /* @__PURE__ */ U(i, { children: [/* @__PURE__ */ U(x, { children: [
				/* @__PURE__ */ H(m, {
					value: r,
					onChange: a,
					size: "sm",
					options: [
						{
							value: "all",
							label: "All"
						},
						{
							value: "low",
							label: "Low"
						},
						{
							value: "empty",
							label: "Out of fuel"
						}
					],
					"aria-label": "Show"
				}),
				e.corporations.length > 1 && /* @__PURE__ */ H(h, {
					value: o,
					onChange: (e) => s(e.target.value),
					className: "w-48",
					options: [{
						value: "",
						label: "Every corporation"
					}, ...e.corporations.map((e) => ({
						value: String(e.id),
						label: `[${e.ticker}] ${e.name}`
					}))]
				}),
				/* @__PURE__ */ H(h, {
					value: f,
					onChange: (e) => v(e.target.value),
					className: "w-44",
					options: [
						{
							value: "fuel",
							label: "Least fuel first"
						},
						{
							value: "burn",
							label: "Highest burn"
						},
						{
							value: "system",
							label: "System"
						},
						{
							value: "name",
							label: "Name"
						}
					]
				}),
				/* @__PURE__ */ H(p, {
					value: l,
					onChange: (e) => u(e.target.value),
					placeholder: "Name, type, system, region",
					className: "ml-auto w-64"
				})
			] }), k.length === 0 ? /* @__PURE__ */ H("p", {
				className: "px-card py-6 text-sm text-muted",
				children: "Nothing matches."
			}) : /* @__PURE__ */ U(b, { children: [/* @__PURE__ */ H(y, { children: /* @__PURE__ */ U("tr", { children: [
				/* @__PURE__ */ H(C, { children: "Structure" }),
				/* @__PURE__ */ H(C, { children: "Location" }),
				/* @__PURE__ */ H(C, { children: "Fuel left" }),
				/* @__PURE__ */ H(C, {
					align: "right",
					children: "Burn"
				}),
				/* @__PURE__ */ H(C, { children: "Services" }),
				/* @__PURE__ */ H(C, { children: "State" }),
				/* @__PURE__ */ H(C, {
					align: "right",
					children: "Refuel"
				})
			] }) }), /* @__PURE__ */ H("tbody", { children: k.map((t) => /* @__PURE__ */ H(fe, {
				s: t,
				now: O,
				canManage: e.can_manage,
				onClaim: () => w(t),
				onEdit: () => D(t)
			}, t.id)) })] })] })]
		}),
		S && e && /* @__PURE__ */ H(pe, {
			s: S,
			hours: e.claim_hours,
			onClose: () => w(null)
		}),
		T && e && /* @__PURE__ */ H(me, {
			s: T,
			defaults: e.thresholds,
			onClose: () => D(null)
		})
	] });
}
function de(e) {
	return e === "danger" || e === "empty" ? "danger" : e === "warning" ? "warning" : e === "ok" ? "success" : "info";
}
function fe({ s: r, now: i, canManage: a, onClaim: o, onEdit: s }) {
	let c = L(), l = F({
		mutationFn: () => E.delete(`${Q}/structures/${r.id}/claim`),
		onSuccess: () => c.invalidateQueries({ queryKey: ["structures"] }),
		onError: (e) => P.error(e.message)
	}), u = de(r.level), d = r.fuel_expires ? Math.max(0, (new Date(r.fuel_expires).getTime() - i) / 36e5) : null, p = r.state_timer_end && new Date(r.state_timer_end).getTime() > i;
	return /* @__PURE__ */ U(T, { children: [
		/* @__PURE__ */ H(S, { children: /* @__PURE__ */ U("div", {
			className: "flex min-w-0 items-center gap-3",
			children: [/* @__PURE__ */ H("img", {
				src: r.type.icon,
				alt: "",
				className: "size-9 shrink-0 rounded-lg"
			}), /* @__PURE__ */ U("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ U("div", {
					className: "flex items-center gap-1.5",
					children: [/* @__PURE__ */ H("span", {
						className: "truncate font-medium",
						children: r.name
					}), a && /* @__PURE__ */ H(n, {
						size: "icon-sm",
						variant: "ghost",
						onClick: s,
						"aria-label": `Fuel settings for ${r.name}`,
						children: /* @__PURE__ */ H(ne, { className: "size-3.5" })
					})]
				}), /* @__PURE__ */ U("div", {
					className: "truncate text-xs text-muted",
					children: [
						r.type.name,
						" · [",
						r.corporation.ticker,
						"]",
						r.staging && ` · ${r.staging}`,
						r.threshold_override && ` · warns at ${r.thresholds.map(Z).join(", ") || "never"}`
					]
				})]
			})]
		}) }),
		/* @__PURE__ */ U(S, { children: [/* @__PURE__ */ U("div", {
			className: "text-sm",
			children: [r.system.name, r.system.security != null && /* @__PURE__ */ H("span", {
				className: "ml-1.5 font-mono text-xs text-subtle",
				children: r.system.security.toFixed(1)
			})]
		}), /* @__PURE__ */ H("div", {
			className: "text-xs text-muted",
			children: r.system.region
		})] }),
		/* @__PURE__ */ U(S, {
			className: "min-w-48",
			children: [/* @__PURE__ */ U("div", {
				className: "mb-1 flex items-baseline justify-between gap-3 text-xs",
				children: [/* @__PURE__ */ H(w, {
					content: r.fuel_expires ? `Runs out ${O(r.fuel_expires)}${r.burn ? `, about ${N(r.blocks_left)} blocks in the bay` : ""}` : "No fuel reported",
					children: /* @__PURE__ */ H("span", {
						className: D("font-mono tabular-nums", {
							danger: "text-danger-fg",
							warning: "text-warning-fg",
							success: "text-text",
							info: "text-muted"
						}[u]),
						children: r.fuel_expires ? A(r.fuel_expires, i) : "—"
					})
				}), /* @__PURE__ */ H(t, {
					tone: X[r.level].tone,
					size: "xs",
					children: X[r.level].label
				})]
			}), /* @__PURE__ */ H(f, {
				value: d == null ? 0 : d / le,
				tone: u,
				size: "sm",
				label: "Fuel remaining"
			})]
		}),
		/* @__PURE__ */ H(S, {
			numeric: !0,
			children: /* @__PURE__ */ H(w, {
				content: `${r.burn_all === r.burn ? "" : `${N(r.burn_all)}/h with every service online. `}${r.need ? `${N(r.need)} blocks to top up` : "Topped up"}`,
				children: /* @__PURE__ */ H("span", { children: r.burn ? `${N(r.burn)}/h` : "—" })
			})
		}),
		/* @__PURE__ */ H(S, { children: /* @__PURE__ */ U("div", {
			className: "flex max-w-72 flex-wrap gap-1",
			children: [r.services.length === 0 && /* @__PURE__ */ H("span", {
				className: "text-xs text-subtle",
				children: "none"
			}), r.services.map((e) => /* @__PURE__ */ U(t, {
				tone: e.state === "online" ? "success" : "neutral",
				size: "xs",
				children: [e.name, e.module == null && " (?)"]
			}, e.name))]
		}) }),
		/* @__PURE__ */ U(S, { children: [/* @__PURE__ */ H(t, {
			tone: ae[r.state] ?? "neutral",
			size: "xs",
			children: j(r.state)
		}), /* @__PURE__ */ U("div", {
			className: "mt-1 text-xs text-subtle",
			children: [p ? /* @__PURE__ */ U("span", {
				className: "text-danger-fg",
				children: ["timer ", A(r.state_timer_end, i)]
			}) : r.reinforce_hour != null && /* @__PURE__ */ U(V, { children: [
				"RF ",
				String(r.reinforce_hour).padStart(2, "0"),
				":00 ET"
			] }), r.unanchors_at && /* @__PURE__ */ H("span", {
				className: "ml-2 text-warning-fg",
				children: "unanchoring"
			})]
		})] }),
		/* @__PURE__ */ H(S, {
			align: "right",
			children: /* @__PURE__ */ U("div", {
				className: "flex items-center justify-end gap-2",
				children: [r.claims.length > 0 && /* @__PURE__ */ H("div", {
					className: "flex -space-x-1.5",
					children: r.claims.slice(0, 3).map((t) => /* @__PURE__ */ H(w, {
						content: `${t.user} is refuelling it${t.note ? `: ${t.note}` : ""}`,
						children: /* @__PURE__ */ H("span", { children: /* @__PURE__ */ H(e, {
							src: t.portrait,
							name: t.user,
							size: "xs",
							rounded: "full",
							className: "ring-2 ring-surface"
						}) })
					}, t.user_id))
				}), r.my_claim ? /* @__PURE__ */ H(n, {
					size: "icon-sm",
					variant: "ghost",
					loading: l.isPending,
					onClick: () => l.mutate(),
					"aria-label": "I'm not refuelling it after all",
					children: !l.isPending && /* @__PURE__ */ H(te, {})
				}) : r.level !== "ok" && r.level !== "none" || r.need > 0 ? /* @__PURE__ */ U(n, {
					size: "sm",
					variant: r.claims.length ? "ghost" : "outline",
					onClick: o,
					children: [/* @__PURE__ */ H(q, {}), " I'm on it"]
				}) : null]
			})
		})
	] });
}
function pe({ s: e, hours: t, onClose: r }) {
	let i = L(), [a, o] = z(""), c = F({
		mutationFn: () => E.post(`${Q}/structures/${e.id}/claim`, { note: a }),
		onSuccess: () => {
			P.success("Thanks! Others can see you're on it."), i.invalidateQueries({ queryKey: ["structures"] }), r();
		},
		onError: (e) => P.error(e.message)
	});
	return /* @__PURE__ */ U(s, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: `Refuel ${e.name}`,
		description: `Say you're refuelling it so nobody else hauls the same blocks. Your claim ends by itself once its fuel goes up, or after ${t} hours.`,
		size: "sm",
		footer: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(n, {
			variant: "ghost",
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ H(n, {
			variant: "primary",
			loading: c.isPending,
			onClick: () => c.mutate(),
			children: "I'm refuelling it"
		})] }),
		children: [/* @__PURE__ */ H("div", {
			className: "mb-4 rounded-lg bg-surface-2 px-3 py-2 text-sm",
			children: e.need > 0 ? /* @__PURE__ */ U(V, { children: [
				"About ",
				/* @__PURE__ */ H("span", {
					className: "font-mono font-semibold",
					children: N(e.need)
				}),
				" fuel blocks (",
				N(e.need * 5),
				" m³) to top it up."
			] }) : "It's already topped up for the plan."
		}), /* @__PURE__ */ H(l, {
			label: "Note (optional)",
			hint: "e.g. which blocks, or when you'll be there",
			children: /* @__PURE__ */ H(u, {
				value: a,
				maxLength: 200,
				onChange: (e) => o(e.target.value),
				autoFocus: !0
			})
		})]
	});
}
function me({ s: e, defaults: t, onClose: r }) {
	let i = L(), [a, o] = z(e.threshold_override ? e.thresholds.length ? "custom" : "never" : "default"), [c, d] = z((e.threshold_override ? e.thresholds : t).map(Z).join(", ")), [f, p] = z(e.staging), h = oe(c), g = F({
		mutationFn: () => E.put(`${Q}/structures/${e.id}`, {
			thresholds: a === "default" ? null : a === "never" ? [] : h,
			staging: f
		}),
		onSuccess: () => {
			P.success("Saved"), i.invalidateQueries({ queryKey: ["structures"] }), r();
		},
		onError: (e) => P.error(e.message)
	});
	return /* @__PURE__ */ H(s, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: e.name,
		description: "When to warn about this structure's fuel, and where it goes on the fuel plan.",
		size: "sm",
		footer: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(n, {
			variant: "ghost",
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ H(n, {
			variant: "primary",
			loading: g.isPending,
			disabled: a === "custom" && !h?.length,
			onClick: () => g.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ U("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ H(m, {
					value: a,
					onChange: o,
					size: "sm",
					options: [
						{
							value: "default",
							label: "Default"
						},
						{
							value: "custom",
							label: "Its own"
						},
						{
							value: "never",
							label: "Never warn"
						}
					],
					"aria-label": "Warnings"
				}),
				a === "default" && /* @__PURE__ */ U("p", {
					className: "text-sm text-muted",
					children: [
						"Warns at ",
						t.map(Z).join(", ") || "nothing",
						", like every structure."
					]
				}),
				a === "custom" && /* @__PURE__ */ H(l, {
					label: "Warn below",
					hint: "Days or hours, e.g. 14d, 5d, 12h",
					error: h ? void 0 : "Use days (7d) or hours (12h)",
					children: /* @__PURE__ */ H(u, {
						value: c,
						onChange: (e) => d(e.target.value),
						className: "font-mono"
					})
				}),
				/* @__PURE__ */ H(l, {
					label: "Staging (optional)",
					hint: "Structures with the same staging are grouped on the fuel plan; otherwise by system.",
					children: /* @__PURE__ */ H(u, {
						value: f,
						maxLength: 100,
						onChange: (e) => p(e.target.value)
					})
				})
			]
		})
	});
}
function he() {
	let { data: e, isLoading: n } = I({
		queryKey: ["structures", "summary"],
		queryFn: () => E.get(`${Q}/summary`),
		refetchInterval: 3e5
	}), r = $(6e4);
	return n || !e ? /* @__PURE__ */ H(g, { className: "h-16" }) : e.structures ? /* @__PURE__ */ U(B, {
		to: "/p/structures",
		className: "block space-y-3",
		children: [/* @__PURE__ */ U("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ U("div", { children: [
				/* @__PURE__ */ H("div", {
					className: "text-xs text-muted",
					children: "Running low"
				}),
				/* @__PURE__ */ H("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: e.low
				}),
				/* @__PURE__ */ U("div", {
					className: "text-xs text-subtle",
					children: [
						"of ",
						e.structures,
						" structures"
					]
				})
			] }), e.danger > 0 ? /* @__PURE__ */ U(t, {
				tone: "danger",
				children: [e.danger, " critical"]
			}) : e.low ? /* @__PURE__ */ H(t, {
				tone: "warning",
				children: "Needs fuel"
			}) : /* @__PURE__ */ H(t, {
				tone: "success",
				children: "All fuelled"
			})]
		}), e.worst.length > 0 && /* @__PURE__ */ H("ul", {
			className: "space-y-1.5",
			children: e.worst.map((e) => /* @__PURE__ */ U("li", {
				className: "flex items-center gap-2 text-sm",
				children: [
					/* @__PURE__ */ H("img", {
						src: e.icon,
						alt: "",
						className: "size-5"
					}),
					/* @__PURE__ */ U("span", {
						className: "min-w-0 flex-1 truncate",
						children: [
							e.name,
							" ",
							/* @__PURE__ */ U("span", {
								className: "text-subtle",
								children: ["· ", e.system]
							})
						]
					}),
					e.claimed && /* @__PURE__ */ H(w, {
						content: "Someone is refuelling it",
						children: /* @__PURE__ */ H("span", { children: /* @__PURE__ */ H(q, { className: "size-3.5 text-success-fg" }) })
					}),
					/* @__PURE__ */ H("span", {
						className: D("font-mono text-xs tabular-nums", e.level === "warning" ? "text-warning-fg" : "text-danger-fg"),
						children: e.fuel_expires ? A(e.fuel_expires, r) : "empty"
					})
				]
			}, e.id))
		})]
	}) : /* @__PURE__ */ H("p", {
		className: "text-sm text-muted",
		children: e.can_view ? "No structures synced yet." : "No corporations' structures to show you."
	});
}
//#endregion
//#region src/plan.tsx
function ge() {
	let { data: e } = I({
		queryKey: ["structures", "board"],
		queryFn: () => E.get(`${Q}/board`)
	}), [n, r] = z(""), [a, s] = z(0);
	R(() => {
		e && !n && r(String(e.plan_days));
	}, [e, n]), R(() => {
		let e = Number(n), t = window.setTimeout(() => e >= 1 && e <= 365 && s(e), 400);
		return () => window.clearTimeout(t);
	}, [n]);
	let { data: f, isLoading: p } = I({
		queryKey: [
			"structures",
			"plan",
			a
		],
		queryFn: () => E.get(`${Q}/plan?days=${a}`),
		enabled: a > 0
	}), m = $();
	return /* @__PURE__ */ U(V, { children: [
		/* @__PURE__ */ U(B, {
			to: "/p/structures",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ H(Y, {}), " Structures & Fuel"]
		}),
		/* @__PURE__ */ H(d, {
			eyebrow: "Structures & Fuel",
			title: "Fuel plan",
			icon: /* @__PURE__ */ H(J, {}),
			description: "Fuel blocks to top every structure up, from what its online services burn. Any race's blocks work in any Upwell structure.",
			actions: /* @__PURE__ */ H(l, {
				label: "Top up to (days)",
				children: /* @__PURE__ */ H(u, {
					type: "number",
					min: 1,
					max: 365,
					value: n,
					onChange: (e) => r(e.target.value),
					className: "w-28 font-mono"
				})
			})
		}),
		p || !f ? /* @__PURE__ */ H(g, { className: "h-64" }) : f.groups.length === 0 ? /* @__PURE__ */ H(i, { children: /* @__PURE__ */ H(c, {
			icon: /* @__PURE__ */ H(K, {}),
			title: "Nothing burns fuel",
			description: "None of the structures you can see have services online."
		}) }) : /* @__PURE__ */ U("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ U("div", {
					className: "grid grid-cols-2 gap-4 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ H(_, {
							label: "Blocks to buy",
							value: N(f.blocks),
							icon: /* @__PURE__ */ H(K, {}),
							hint: `for ${f.days} days`
						}),
						/* @__PURE__ */ H(_, {
							label: "Volume",
							value: `${N(f.volume)} m³`,
							icon: /* @__PURE__ */ H(J, {}),
							mono: !0
						}),
						/* @__PURE__ */ H(_, {
							label: "Burn",
							value: N(f.per_day),
							hint: "blocks a day, all structures"
						}),
						/* @__PURE__ */ H(_, {
							label: "Cost",
							value: f.cost == null ? "—" : M(f.cost),
							hint: f.block_price == null ? "no fuel block prices yet" : `at ${M(f.block_price)} a block (cheapest average price)`,
							mono: !0
						})
					]
				}),
				f.groups.map((e) => /* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, {
					title: e.label,
					description: [
						e.kind === "staging" ? e.systems.join(", ") : null,
						e.region,
						`${N(e.per_day)} blocks a day`
					].filter(Boolean).join(" · "),
					actions: e.blocks > 0 ? /* @__PURE__ */ U("div", {
						className: "text-right",
						children: [/* @__PURE__ */ U("div", {
							className: "font-mono text-lg font-semibold tabular-nums",
							children: [N(e.blocks), " blocks"]
						}), /* @__PURE__ */ U("div", {
							className: "text-xs text-muted",
							children: [N(e.volume), " m³"]
						})]
					}) : /* @__PURE__ */ H(t, {
						tone: "success",
						children: "Topped up"
					})
				}), /* @__PURE__ */ U(b, { children: [/* @__PURE__ */ H(y, { children: /* @__PURE__ */ U("tr", { children: [
					/* @__PURE__ */ H(C, { children: "Structure" }),
					/* @__PURE__ */ H(C, { children: "Fuel left" }),
					/* @__PURE__ */ H(C, {
						align: "right",
						children: "Burn"
					}),
					/* @__PURE__ */ H(C, {
						align: "right",
						children: "Needs"
					})
				] }) }), /* @__PURE__ */ H("tbody", { children: e.structures.map((t) => /* @__PURE__ */ U(T, { children: [
					/* @__PURE__ */ H(S, { children: /* @__PURE__ */ U("div", {
						className: "flex items-center gap-2.5",
						children: [
							/* @__PURE__ */ H("img", {
								src: t.type.icon,
								alt: "",
								className: "size-7 rounded-md"
							}),
							/* @__PURE__ */ U("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ H("div", {
									className: "truncate font-medium",
									children: t.name
								}), /* @__PURE__ */ U("div", {
									className: "truncate text-xs text-muted",
									children: [
										t.type.name,
										" · [",
										t.corporation.ticker,
										"]",
										e.kind === "staging" && ` · ${t.system.name}`
									]
								})]
							}),
							t.claims.length > 0 && /* @__PURE__ */ H(w, {
								content: `${t.claims.map((e) => e.user).join(", ")} ${t.claims.length === 1 ? "is" : "are"} refuelling it`,
								children: /* @__PURE__ */ H("span", { children: /* @__PURE__ */ H(q, { className: "size-3.5 text-success-fg" }) })
							})
						]
					}) }),
					/* @__PURE__ */ H(S, { children: /* @__PURE__ */ H("span", {
						className: D("font-mono text-xs tabular-nums", t.level === "ok" ? "text-text" : X[t.level].tone === "danger" ? "text-danger-fg" : "text-warning-fg"),
						children: t.fuel_expires ? A(t.fuel_expires, m) : X[t.level].label
					}) }),
					/* @__PURE__ */ U(S, {
						numeric: !0,
						children: [N(t.fuel_expires ? t.burn : t.burn_all), "/h"]
					}),
					/* @__PURE__ */ H(S, {
						numeric: !0,
						className: D(t.need === 0 && "text-subtle"),
						children: N(t.need)
					})
				] }, t.id)) })] })] }, e.key)),
				/* @__PURE__ */ H("p", {
					className: "text-xs text-subtle",
					children: "Structures out of fuel are planned at what all their fitted services would burn. Fuel blocks are 5 m³ each."
				})
			]
		})
	] });
}
//#endregion
//#region src/settings.tsx
function _e() {
	let e = L(), { data: t, isLoading: s } = I({
		queryKey: ["structures", "settings"],
		queryFn: () => E.get(`${Q}/settings`)
	}), [c, f] = z(null), [p, m] = z("");
	R(() => {
		t && (f(t), m(t.thresholds.map(Z).join(", ")));
	}, [t]);
	let h = oe(p), _ = F({
		mutationFn: (e) => E.put(`${Q}/settings`, {
			...e,
			thresholds: h ?? []
		}),
		onSuccess: (t) => {
			e.setQueryData(["structures", "settings"], t), e.invalidateQueries({ queryKey: ["structures"] }), P.success("Saved");
		},
		onError: (e) => P.error(e.message)
	});
	if (s || !c) return /* @__PURE__ */ H(g, { className: "h-64" });
	let y = (e) => f({
		...c,
		...e
	}), b = (e) => y({ groups: c.groups.includes(e) ? c.groups.filter((t) => t !== e) : [...c.groups, e] }), x = Z(c.core_warning_hours);
	return /* @__PURE__ */ U(V, { children: [
		/* @__PURE__ */ U(B, {
			to: "/p/structures",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ H(Y, {}), " Structures & Fuel"]
		}),
		/* @__PURE__ */ H(d, {
			eyebrow: "Structures & Fuel",
			title: "Settings",
			icon: /* @__PURE__ */ H(re, {}),
			description: "When fuel warnings go out and to whom. Each structure can have its own thresholds from its pencil on the board."
		}),
		/* @__PURE__ */ U("div", {
			className: "grid max-w-5xl gap-6 lg:grid-cols-2",
			children: [
				/* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, {
					title: "Warnings",
					description: "Each threshold warns once when a structure's fuel falls below it, and again only after it was refuelled above it."
				}), /* @__PURE__ */ U(a, {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ H(l, {
							label: "Warn below",
							hint: "Days or hours, e.g. 7d, 3d, 1d or 12h. Empty: no warnings.",
							error: h ? void 0 : "Use days (7d) or hours (12h)",
							children: /* @__PURE__ */ H(u, {
								value: p,
								onChange: (e) => m(e.target.value),
								className: "font-mono"
							})
						}),
						/* @__PURE__ */ U(r, {
							tone: "info",
							children: [
								"EvE Conduit itself tells everyone who can see a corporation when one of its structures drops under ",
								x,
								". At exactly ",
								x,
								" this plugin sends no notification of its own (they were just told), but its event still goes out."
							]
						}),
						/* @__PURE__ */ H("div", {
							className: "divide-y divide-border",
							children: /* @__PURE__ */ H(v, {
								label: "Send notifications",
								description: "Off: only the structures.fuel_low event goes out, for webhooks (Administration → Integrations).",
								checked: c.notify,
								onCheckedChange: (e) => y({ notify: e })
							})
						})
					]
				})] }),
				/* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, { title: "Fuel plan and claims" }), /* @__PURE__ */ U(a, {
					className: "space-y-4",
					children: [/* @__PURE__ */ H(l, {
						label: "Top up to (days)",
						hint: "What the plan and each structure's “needs” count towards.",
						children: /* @__PURE__ */ H(u, {
							type: "number",
							min: 1,
							max: 365,
							value: c.plan_days,
							onChange: (e) => y({ plan_days: Number(e.target.value) }),
							className: "w-32 font-mono"
						})
					}), /* @__PURE__ */ H(l, {
						label: "A refuel claim lasts (hours)",
						hint: "It also ends by itself once the structure's fuel goes up.",
						children: /* @__PURE__ */ H(u, {
							type: "number",
							min: 1,
							max: 336,
							value: c.claim_hours,
							onChange: (e) => y({ claim_hours: Number(e.target.value) }),
							className: "w-32 font-mono"
						})
					})]
				})] }),
				/* @__PURE__ */ U(i, {
					className: "lg:col-span-2",
					children: [/* @__PURE__ */ H(o, {
						title: "Who is warned",
						description: "Members of any ticked group, but only about corporations whose structures they may see on the corporation sheet. Nothing ticked: everyone who may see them."
					}), /* @__PURE__ */ H(a, { children: c.group_options.length === 0 ? /* @__PURE__ */ H("p", {
						className: "text-sm text-muted",
						children: "No groups yet."
					}) : /* @__PURE__ */ H("div", {
						className: "flex flex-wrap gap-1.5",
						children: c.group_options.map((e) => /* @__PURE__ */ H("button", {
							type: "button",
							onClick: () => b(e.id),
							className: `border px-2 py-1 text-sm ${c.groups.includes(e.id) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:text-text"}`,
							"aria-pressed": c.groups.includes(e.id),
							children: e.name
						}, e.id))
					}) })]
				}),
				/* @__PURE__ */ H("div", {
					className: "lg:col-span-2",
					children: /* @__PURE__ */ H(n, {
						variant: "primary",
						loading: _.isPending,
						disabled: !h,
						onClick: () => _.mutate(c),
						children: "Save settings"
					})
				})
			]
		})
	] });
}
//#endregion
//#region src/index.tsx
var ve = k({
	routes: [
		{
			path: "",
			Component: ue
		},
		{
			path: "plan",
			Component: ge
		},
		{
			path: "settings",
			Component: _e
		}
	],
	widgets: [{
		id: "low",
		title: "Structures running low",
		Component: he,
		size: "sm",
		order: 45
	}]
});
//#endregion
export { ve as default };

export const classes = ["!data","!o","-space-x-1.5","@conduit/sdk","@tanstack/react-query","a","abandoned","about","above","actions","after","again","align","all","already","also","alt","anchoring","and","any","are","aria-label","aria-pressed","armor_reinforce","armor_vulnerable","as","asked","at","autoFocus","average","b","bare","bay","be","below","between","bg-accent-soft","bg-surface-2","block","block_price","blocks","blocks_left","board","boolean","border","border-accent","border-border","burn","burn_all","burns","but","button","buy","by","can","canManage","can_manage","can_view","category","checked","children","claim","claim_hours","claimed","claims","className","const","content","core","core_warning_hours","corporation","corporations","cost","count","countdowns","counting","created_at","critical","currentColor","custom","cx","cy","d","danger","data","day","days","default","defaults","definePlugin","description","disabled","divide-border","divide-y","drops","each","else","empty","enabled","ends","error","event","every","everyone","exactly","expires_at","export","eyebrow","falls","few","fill","first","fitted","flex","flex-1","flex-wrap","follow","font-medium","font-mono","font-semibold","footer","for","from","fuel","fuel_expires","fuel_low","fuelled","full","function","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-6","get","ghost","go","goes","grid","grid-cols-2","group","group_options","grouped","groups","h","h-16","h-64","has","hauls","have","height","here","hint","hours","hours_left","hover:text-text","how","hull_reinforce","hull_vulnerable","icon","icon-sm","icons","id","if","import","in","info","inline","inline-flex","interface","is","isLoading","isPending","it","items-baseline","items-center","items-end","its","itself","just","justify-between","justify-end","key","kind","label","last","lasts","least","left","length","let","level","lg:col-span-2","lg:grid-cols-2","lg:grid-cols-4","like","list","ll","loading","login","long","low","low_power","m","m12","m15","m21.73","m6","max","max-w-5xl","max-w-72","maxLength","may","mb-1","mb-4","min","min-w-0","min-w-48","ml-1.5","ml-2","ml-auto","mode","module","modules","mono","move","ms","mt-1","mutationFn","my_claim","n","name","need","needle","neutral","never","new","no","nobody","none","not","note","nothing","notification","notifications","notify","now","null","number","numeric","of","ok","on","onChange","onCheckedChange","onClaim","onClick","onClose","onEdit","onError","onOpenChange","onSuccess","once","one","online","online_modules","onlining_vulnerable","only","open","options","or","order","otherwise","out","outline","own","p","parsed","parts","patch","path","pencil","per","per_day","permission","placeholder","plan","plan_days","planned","plugin","points","portrait","prices","primary","put","px-2","px-3","px-card","py-1","py-2","py-6","qc","queryFn","queryKey","race","rate","re","react","react-router","refetchInterval","refuel","refuelled","refuelling","region","reinforce_hour","release","remaining","reported","rest","return","right","ring-2","ring-surface","round","rounded","rounded-lg","rounded-md","routes","rows","running","rx","ry","s","same","save","security","see","sends","server","service","services","set","setAsked","setClaiming","setCorp","setDays","setEditing","setForm","setMode","setNote","setNow","setQ","setShow","setSort","setStaging","setText","settings","sheet","shield_vulnerable","shopping","show","shrink-0","site","size","size-3.5","size-4","size-5","size-7","size-9","sm","so","something","sort","space-y-1.5","space-y-3","space-y-4","space-y-6","src","staging","state","state_timer_end","still","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structure","structures","style","success","summary","synced","syncs","system","systems","t","tabular-nums","tells","text","text-3xl","text-accent-ink","text-danger-fg","text-lg","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xs","that","the","their","then","there","they","this","threshold","threshold_override","thresholds","ticked","ticker","timer","title","to","toast","toggle","tone","top","topped","truncate","type","unanchored","unanchoring","unanchors_at","undefined","under","unknown_services","up","use","useNow","useQuery","useQueryClient","useState","used","user","user_id","v","value","variant","view","viewBox","viewer","void","volume","w-28","w-32","w-44","w-48","w-64","warn","warned","warning","warnings","warns","was","webhooks","were","what","when","where","which","who","whose","widgets","width","with","work","worst","would","x","x1","x2","xs","y1","y2","yet","you","your"];
