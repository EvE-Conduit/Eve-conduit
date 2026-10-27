import { Avatar as e, Badge as t, Button as n, Callout as r, Card as i, CardBody as a, CardHeader as o, Dialog as s, DiscordPings as c, EmptyState as l, Field as u, Input as d, PageHeader as f, Progress as p, SearchInput as m, Segmented as h, Select as g, Skeleton as _, StatCard as v, SwitchRow as y, THead as b, Table as x, TableToolbar as S, Td as C, Th as w, Tooltip as T, Tr as E, api as D, cn as O, dateTime as k, definePlugin as A, duration as j, humanize as M, isk as N, num as P, toast as F } from "@conduit/sdk";
import { useMutation as I, useQuery as L, useQueryClient as R } from "@tanstack/react-query";
import { useEffect as z, useMemo as ee, useState as B } from "react";
import { Link as V } from "react-router";
import { Fragment as H, jsx as U, jsxs as W } from "react/jsx-runtime";
//#region src/icons.tsx
function G({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ U("svg", {
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
var K = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [
		/* @__PURE__ */ U("rect", {
			width: "16",
			height: "20",
			x: "4",
			y: "2",
			rx: "2",
			ry: "2"
		}),
		/* @__PURE__ */ U("path", { d: "M9 22v-4h6v4" }),
		/* @__PURE__ */ U("path", { d: "M8 6h.01" }),
		/* @__PURE__ */ U("path", { d: "M16 6h.01" }),
		/* @__PURE__ */ U("path", { d: "M12 6h.01" }),
		/* @__PURE__ */ U("path", { d: "M12 10h.01" }),
		/* @__PURE__ */ U("path", { d: "M12 14h.01" }),
		/* @__PURE__ */ U("path", { d: "M16 10h.01" }),
		/* @__PURE__ */ U("path", { d: "M16 14h.01" }),
		/* @__PURE__ */ U("path", { d: "M8 10h.01" }),
		/* @__PURE__ */ U("path", { d: "M8 14h.01" })
	]
}), q = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [
		/* @__PURE__ */ U("line", {
			x1: "3",
			x2: "15",
			y1: "22",
			y2: "22"
		}),
		/* @__PURE__ */ U("line", {
			x1: "4",
			x2: "14",
			y1: "9",
			y2: "9"
		}),
		/* @__PURE__ */ U("path", { d: "M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" }),
		/* @__PURE__ */ U("path", { d: "M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" })
	]
}), J = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [
		/* @__PURE__ */ U("path", { d: "M18 11V6a2 2 0 0 0-4 0v5" }),
		/* @__PURE__ */ U("path", { d: "M14 10V4a2 2 0 0 0-4 0v6" }),
		/* @__PURE__ */ U("path", { d: "M10 10.5V6a2 2 0 0 0-4 0v8" }),
		/* @__PURE__ */ U("path", { d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" })
	]
}), te = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [/* @__PURE__ */ U("path", { d: "M18 6 6 18" }), /* @__PURE__ */ U("path", { d: "m6 6 12 12" })]
}), ne = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [/* @__PURE__ */ U("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" }), /* @__PURE__ */ U("path", { d: "m15 5 4 4" })]
}), re = (e) => /* @__PURE__ */ U(G, {
	...e,
	children: /* @__PURE__ */ U("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })
}), Y = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [
		/* @__PURE__ */ U("path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }),
		/* @__PURE__ */ U("path", { d: "M15 18H9" }),
		/* @__PURE__ */ U("path", { d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" }),
		/* @__PURE__ */ U("circle", {
			cx: "17",
			cy: "18",
			r: "2"
		}),
		/* @__PURE__ */ U("circle", {
			cx: "7",
			cy: "18",
			r: "2"
		})
	]
}), ie = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [/* @__PURE__ */ U("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ U("path", { d: "M19 12H5" })]
}), ae = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [
		/* @__PURE__ */ U("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }),
		/* @__PURE__ */ U("path", { d: "M12 9v4" }),
		/* @__PURE__ */ U("path", { d: "M12 17h.01" })
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
}, oe = {
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
function se(e) {
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
var Q = "/api/p/structures", ce = ["structures", "board"];
function $(e = 3e4) {
	let [t, n] = B(() => Date.now());
	return z(() => {
		let t = window.setInterval(() => n(Date.now()), e);
		return () => window.clearInterval(t);
	}, [e]), t;
}
var le = [
	"warning",
	"danger",
	"empty"
], ue = 720;
function de() {
	let { data: e, isLoading: t } = L({
		queryKey: ce,
		queryFn: () => D.get(`${Q}/board`),
		refetchInterval: 3e5
	}), [r, a] = B("all"), [o, s] = B(""), [c, u] = B(""), [d, p] = B("fuel"), [y, C] = B(null), [T, E] = B(null), O = $(), k = ee(() => {
		let t = e?.structures ?? [];
		r === "low" && (t = t.filter((e) => le.includes(e.level))), r === "empty" && (t = t.filter((e) => e.level === "empty")), o && (t = t.filter((e) => String(e.corporation.id) === o));
		let n = c.trim().toLowerCase();
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
		return [...t].sort(i[d]);
	}, [
		e,
		r,
		o,
		c,
		d
	]), A = e?.structures ?? [], j = A.filter((e) => e.level === "warning" || e.level === "danger").length, M = A.filter((e) => e.level === "empty").length, N = A.reduce((e, t) => e + t.burn, 0);
	return /* @__PURE__ */ W(H, { children: [
		/* @__PURE__ */ U(f, {
			eyebrow: "Operations",
			title: "Structures & Fuel",
			icon: /* @__PURE__ */ U(K, {}),
			description: "Every structure your corporations own that you may see on the corporation sheets, with fuel left, what it burns and who's refuelling it.",
			actions: /* @__PURE__ */ W("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ U(V, {
					to: "/p/structures/plan",
					children: /* @__PURE__ */ W(n, {
						variant: "ghost",
						children: [/* @__PURE__ */ U(Y, {}), " Fuel plan"]
					})
				}), e?.can_manage && /* @__PURE__ */ U(V, {
					to: "/p/structures/settings",
					children: /* @__PURE__ */ W(n, {
						variant: "ghost",
						children: [/* @__PURE__ */ U(re, {}), " Settings"]
					})
				})]
			})
		}),
		t || !e ? /* @__PURE__ */ U(_, { className: "h-64" }) : A.length === 0 ? /* @__PURE__ */ U(i, { children: /* @__PURE__ */ U(l, {
			icon: /* @__PURE__ */ U(K, {}),
			title: e.can_view ? "No structures yet" : "No corporations to show",
			description: e.can_view ? "Structures show up once a Station Manager or Director's login syncs the corporation's Structures section." : "Structures follow the corporation sheet: you need permission to view a corporation to see its structures."
		}) }) : /* @__PURE__ */ W("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ W("div", {
				className: "grid grid-cols-2 gap-4 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ U(v, {
						label: "Structures",
						value: A.length,
						icon: /* @__PURE__ */ U(K, {}),
						hint: `${e.corporations.length} corporation${e.corporations.length === 1 ? "" : "s"}`
					}),
					/* @__PURE__ */ U(v, {
						label: "Below a threshold",
						value: j,
						icon: /* @__PURE__ */ U(q, {}),
						tone: j ? "warning" : "success",
						hint: `warnings at ${e.thresholds.map(Z).join(", ") || "none"}`
					}),
					/* @__PURE__ */ U(v, {
						label: "Out of fuel",
						value: M,
						icon: /* @__PURE__ */ U(ae, {}),
						tone: M ? "danger" : "success"
					}),
					/* @__PURE__ */ U(v, {
						label: "Burning",
						value: `${P(Math.ceil(N * 24))}`,
						icon: /* @__PURE__ */ U(q, {}),
						hint: "fuel blocks a day"
					})
				]
			}), /* @__PURE__ */ W(i, { children: [/* @__PURE__ */ W(S, { children: [
				/* @__PURE__ */ U(h, {
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
				e.corporations.length > 1 && /* @__PURE__ */ U(g, {
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
				/* @__PURE__ */ U(g, {
					value: d,
					onChange: (e) => p(e.target.value),
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
				/* @__PURE__ */ U(m, {
					value: c,
					onChange: (e) => u(e.target.value),
					placeholder: "Name, type, system, region",
					className: "ml-auto w-64"
				})
			] }), k.length === 0 ? /* @__PURE__ */ U("p", {
				className: "px-card py-6 text-sm text-muted",
				children: "Nothing matches."
			}) : /* @__PURE__ */ W(x, { children: [/* @__PURE__ */ U(b, { children: /* @__PURE__ */ W("tr", { children: [
				/* @__PURE__ */ U(w, { children: "Structure" }),
				/* @__PURE__ */ U(w, { children: "Location" }),
				/* @__PURE__ */ U(w, { children: "Fuel left" }),
				/* @__PURE__ */ U(w, {
					align: "right",
					children: "Burn"
				}),
				/* @__PURE__ */ U(w, { children: "Services" }),
				/* @__PURE__ */ U(w, { children: "State" }),
				/* @__PURE__ */ U(w, {
					align: "right",
					children: "Refuel"
				})
			] }) }), /* @__PURE__ */ U("tbody", { children: k.map((t) => /* @__PURE__ */ U(pe, {
				s: t,
				now: O,
				canManage: e.can_manage,
				onClaim: () => C(t),
				onEdit: () => E(t)
			}, t.id)) })] })] })]
		}),
		y && e && /* @__PURE__ */ U(me, {
			s: y,
			hours: e.claim_hours,
			onClose: () => C(null)
		}),
		T && e && /* @__PURE__ */ U(he, {
			s: T,
			defaults: e.thresholds,
			onClose: () => E(null)
		})
	] });
}
function fe(e) {
	return e === "danger" || e === "empty" ? "danger" : e === "warning" ? "warning" : e === "ok" ? "success" : "info";
}
function pe({ s: r, now: i, canManage: a, onClaim: o, onEdit: s }) {
	let c = R(), l = I({
		mutationFn: () => D.delete(`${Q}/structures/${r.id}/claim`),
		onSuccess: () => c.invalidateQueries({ queryKey: ["structures"] }),
		onError: (e) => F.error(e.message)
	}), u = fe(r.level), d = r.fuel_expires ? Math.max(0, (new Date(r.fuel_expires).getTime() - i) / 36e5) : null, f = r.state_timer_end && new Date(r.state_timer_end).getTime() > i;
	return /* @__PURE__ */ W(E, { children: [
		/* @__PURE__ */ U(C, { children: /* @__PURE__ */ W("div", {
			className: "flex min-w-0 items-center gap-3",
			children: [/* @__PURE__ */ U("img", {
				src: r.type.icon,
				alt: "",
				className: "size-9 shrink-0 rounded-lg"
			}), /* @__PURE__ */ W("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ W("div", {
					className: "flex items-center gap-1.5",
					children: [/* @__PURE__ */ U("span", {
						className: "truncate font-medium",
						children: r.name
					}), a && /* @__PURE__ */ U(n, {
						size: "icon-sm",
						variant: "ghost",
						onClick: s,
						"aria-label": `Fuel settings for ${r.name}`,
						children: /* @__PURE__ */ U(ne, { className: "size-3.5" })
					})]
				}), /* @__PURE__ */ W("div", {
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
		/* @__PURE__ */ W(C, { children: [/* @__PURE__ */ W("div", {
			className: "text-sm",
			children: [r.system.name, r.system.security != null && /* @__PURE__ */ U("span", {
				className: "ml-1.5 font-mono text-xs text-subtle",
				children: r.system.security.toFixed(1)
			})]
		}), /* @__PURE__ */ U("div", {
			className: "text-xs text-muted",
			children: r.system.region
		})] }),
		/* @__PURE__ */ W(C, {
			className: "min-w-48",
			children: [/* @__PURE__ */ W("div", {
				className: "mb-1 flex items-baseline justify-between gap-3 text-xs",
				children: [/* @__PURE__ */ U(T, {
					content: r.fuel_expires ? `Runs out ${k(r.fuel_expires)}${r.burn ? `, about ${P(r.blocks_left)} blocks in the bay` : ""}` : "No fuel reported",
					children: /* @__PURE__ */ U("span", {
						className: O("font-mono tabular-nums", {
							danger: "text-danger-fg",
							warning: "text-warning-fg",
							success: "text-text",
							info: "text-muted"
						}[u]),
						children: r.fuel_expires ? j(r.fuel_expires, i) : "—"
					})
				}), /* @__PURE__ */ U(t, {
					tone: X[r.level].tone,
					size: "xs",
					children: X[r.level].label
				})]
			}), /* @__PURE__ */ U(p, {
				value: d == null ? 0 : d / ue,
				tone: u,
				size: "sm",
				label: "Fuel remaining"
			})]
		}),
		/* @__PURE__ */ U(C, {
			numeric: !0,
			children: /* @__PURE__ */ U(T, {
				content: `${r.burn_all === r.burn ? "" : `${P(r.burn_all)}/h with every service online. `}${r.need ? `${P(r.need)} blocks to top up` : "Topped up"}`,
				children: /* @__PURE__ */ U("span", { children: r.burn ? `${P(r.burn)}/h` : "—" })
			})
		}),
		/* @__PURE__ */ U(C, { children: /* @__PURE__ */ W("div", {
			className: "flex max-w-72 flex-wrap gap-1",
			children: [r.services.length === 0 && /* @__PURE__ */ U("span", {
				className: "text-xs text-subtle",
				children: "none"
			}), r.services.map((e) => /* @__PURE__ */ W(t, {
				tone: e.state === "online" ? "success" : "neutral",
				size: "xs",
				children: [e.name, e.module == null && " (?)"]
			}, e.name))]
		}) }),
		/* @__PURE__ */ W(C, { children: [/* @__PURE__ */ U(t, {
			tone: oe[r.state] ?? "neutral",
			size: "xs",
			children: M(r.state)
		}), /* @__PURE__ */ W("div", {
			className: "mt-1 text-xs text-subtle",
			children: [f ? /* @__PURE__ */ W("span", {
				className: "text-danger-fg",
				children: ["timer ", j(r.state_timer_end, i)]
			}) : r.reinforce_hour != null && /* @__PURE__ */ W(H, { children: [
				"RF ",
				String(r.reinforce_hour).padStart(2, "0"),
				":00 ET"
			] }), r.unanchors_at && /* @__PURE__ */ U("span", {
				className: "ml-2 text-warning-fg",
				children: "unanchoring"
			})]
		})] }),
		/* @__PURE__ */ U(C, {
			align: "right",
			children: /* @__PURE__ */ W("div", {
				className: "flex items-center justify-end gap-2",
				children: [r.claims.length > 0 && /* @__PURE__ */ U("div", {
					className: "flex -space-x-1.5",
					children: r.claims.slice(0, 3).map((t) => /* @__PURE__ */ U(T, {
						content: `${t.user} is refuelling it${t.note ? `: ${t.note}` : ""}`,
						children: /* @__PURE__ */ U("span", { children: /* @__PURE__ */ U(e, {
							src: t.portrait,
							name: t.user,
							size: "xs",
							rounded: "full",
							className: "ring-2 ring-surface"
						}) })
					}, t.user_id))
				}), r.my_claim ? /* @__PURE__ */ U(n, {
					size: "icon-sm",
					variant: "ghost",
					loading: l.isPending,
					onClick: () => l.mutate(),
					"aria-label": "I'm not refuelling it after all",
					children: !l.isPending && /* @__PURE__ */ U(te, {})
				}) : r.level !== "ok" && r.level !== "none" || r.need > 0 ? /* @__PURE__ */ W(n, {
					size: "sm",
					variant: r.claims.length ? "ghost" : "outline",
					onClick: o,
					children: [/* @__PURE__ */ U(J, {}), " I'm on it"]
				}) : null]
			})
		})
	] });
}
function me({ s: e, hours: t, onClose: r }) {
	let i = R(), [a, o] = B(""), c = I({
		mutationFn: () => D.post(`${Q}/structures/${e.id}/claim`, { note: a }),
		onSuccess: () => {
			F.success("Thanks! Others can see you're on it."), i.invalidateQueries({ queryKey: ["structures"] }), r();
		},
		onError: (e) => F.error(e.message)
	});
	return /* @__PURE__ */ W(s, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: `Refuel ${e.name}`,
		description: `Say you're refuelling it so nobody else hauls the same blocks. Your claim ends by itself once its fuel goes up, or after ${t} hours.`,
		size: "sm",
		footer: /* @__PURE__ */ W(H, { children: [/* @__PURE__ */ U(n, {
			variant: "ghost",
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ U(n, {
			variant: "primary",
			loading: c.isPending,
			onClick: () => c.mutate(),
			children: "I'm refuelling it"
		})] }),
		children: [/* @__PURE__ */ U("div", {
			className: "mb-4 rounded-lg bg-surface-2 px-3 py-2 text-sm",
			children: e.need > 0 ? /* @__PURE__ */ W(H, { children: [
				"About ",
				/* @__PURE__ */ U("span", {
					className: "font-mono font-semibold",
					children: P(e.need)
				}),
				" fuel blocks (",
				P(e.need * 5),
				" m³) to top it up."
			] }) : "It's already topped up for the plan."
		}), /* @__PURE__ */ U(u, {
			label: "Note (optional)",
			hint: "e.g. which blocks, or when you'll be there",
			children: /* @__PURE__ */ U(d, {
				value: a,
				maxLength: 200,
				onChange: (e) => o(e.target.value),
				autoFocus: !0
			})
		})]
	});
}
function he({ s: e, defaults: t, onClose: r }) {
	let i = R(), [a, o] = B(e.threshold_override ? e.thresholds.length ? "custom" : "never" : "default"), [c, l] = B((e.threshold_override ? e.thresholds : t).map(Z).join(", ")), [f, p] = B(e.staging), m = se(c), g = I({
		mutationFn: () => D.put(`${Q}/structures/${e.id}`, {
			thresholds: a === "default" ? null : a === "never" ? [] : m,
			staging: f
		}),
		onSuccess: () => {
			F.success("Saved"), i.invalidateQueries({ queryKey: ["structures"] }), r();
		},
		onError: (e) => F.error(e.message)
	});
	return /* @__PURE__ */ U(s, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: e.name,
		description: "When to warn about this structure's fuel, and where it goes on the fuel plan.",
		size: "sm",
		footer: /* @__PURE__ */ W(H, { children: [/* @__PURE__ */ U(n, {
			variant: "ghost",
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ U(n, {
			variant: "primary",
			loading: g.isPending,
			disabled: a === "custom" && !m?.length,
			onClick: () => g.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ W("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ U(h, {
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
				a === "default" && /* @__PURE__ */ W("p", {
					className: "text-sm text-muted",
					children: [
						"Warns at ",
						t.map(Z).join(", ") || "nothing",
						", like every structure."
					]
				}),
				a === "custom" && /* @__PURE__ */ U(u, {
					label: "Warn below",
					hint: "Days or hours, e.g. 14d, 5d, 12h",
					error: m ? void 0 : "Use days (7d) or hours (12h)",
					children: /* @__PURE__ */ U(d, {
						value: c,
						onChange: (e) => l(e.target.value),
						className: "font-mono"
					})
				}),
				/* @__PURE__ */ U(u, {
					label: "Staging (optional)",
					hint: "Structures with the same staging are grouped on the fuel plan; otherwise by system.",
					children: /* @__PURE__ */ U(d, {
						value: f,
						maxLength: 100,
						onChange: (e) => p(e.target.value)
					})
				})
			]
		})
	});
}
function ge() {
	let { data: e, isLoading: n } = L({
		queryKey: ["structures", "summary"],
		queryFn: () => D.get(`${Q}/summary`),
		refetchInterval: 3e5
	}), r = $(6e4);
	return n || !e ? /* @__PURE__ */ U(_, { className: "h-16" }) : e.structures ? /* @__PURE__ */ W(V, {
		to: "/p/structures",
		className: "block space-y-3",
		children: [/* @__PURE__ */ W("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ W("div", { children: [
				/* @__PURE__ */ U("div", {
					className: "text-xs text-muted",
					children: "Running low"
				}),
				/* @__PURE__ */ U("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: e.low
				}),
				/* @__PURE__ */ W("div", {
					className: "text-xs text-subtle",
					children: [
						"of ",
						e.structures,
						" structures"
					]
				})
			] }), e.danger > 0 ? /* @__PURE__ */ W(t, {
				tone: "danger",
				children: [e.danger, " critical"]
			}) : e.low ? /* @__PURE__ */ U(t, {
				tone: "warning",
				children: "Needs fuel"
			}) : /* @__PURE__ */ U(t, {
				tone: "success",
				children: "All fuelled"
			})]
		}), e.worst.length > 0 && /* @__PURE__ */ U("ul", {
			className: "space-y-1.5",
			children: e.worst.map((e) => /* @__PURE__ */ W("li", {
				className: "flex items-center gap-2 text-sm",
				children: [
					/* @__PURE__ */ U("img", {
						src: e.icon,
						alt: "",
						className: "size-5"
					}),
					/* @__PURE__ */ W("span", {
						className: "min-w-0 flex-1 truncate",
						children: [
							e.name,
							" ",
							/* @__PURE__ */ W("span", {
								className: "text-subtle",
								children: ["· ", e.system]
							})
						]
					}),
					e.claimed && /* @__PURE__ */ U(T, {
						content: "Someone is refuelling it",
						children: /* @__PURE__ */ U("span", { children: /* @__PURE__ */ U(J, { className: "size-3.5 text-success-fg" }) })
					}),
					/* @__PURE__ */ U("span", {
						className: O("font-mono text-xs tabular-nums", e.level === "warning" ? "text-warning-fg" : "text-danger-fg"),
						children: e.fuel_expires ? j(e.fuel_expires, r) : "empty"
					})
				]
			}, e.id))
		})]
	}) : /* @__PURE__ */ U("p", {
		className: "text-sm text-muted",
		children: e.can_view ? "No structures synced yet." : "No corporations' structures to show you."
	});
}
//#endregion
//#region src/plan.tsx
function _e() {
	let { data: e } = L({
		queryKey: ["structures", "board"],
		queryFn: () => D.get(`${Q}/board`)
	}), [n, r] = B(""), [a, s] = B(0);
	z(() => {
		e && !n && r(String(e.plan_days));
	}, [e, n]), z(() => {
		let e = Number(n), t = window.setTimeout(() => e >= 1 && e <= 365 && s(e), 400);
		return () => window.clearTimeout(t);
	}, [n]);
	let { data: c, isLoading: p } = L({
		queryKey: [
			"structures",
			"plan",
			a
		],
		queryFn: () => D.get(`${Q}/plan?days=${a}`),
		enabled: a > 0
	}), m = $();
	return /* @__PURE__ */ W(H, { children: [
		/* @__PURE__ */ W(V, {
			to: "/p/structures",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ U(ie, {}), " Structures & Fuel"]
		}),
		/* @__PURE__ */ U(f, {
			eyebrow: "Structures & Fuel",
			title: "Fuel plan",
			icon: /* @__PURE__ */ U(Y, {}),
			description: "Fuel blocks to top every structure up, from what its online services burn. Any race's blocks work in any Upwell structure.",
			actions: /* @__PURE__ */ U(u, {
				label: "Top up to (days)",
				children: /* @__PURE__ */ U(d, {
					type: "number",
					min: 1,
					max: 365,
					value: n,
					onChange: (e) => r(e.target.value),
					className: "w-28 font-mono"
				})
			})
		}),
		p || !c ? /* @__PURE__ */ U(_, { className: "h-64" }) : c.groups.length === 0 ? /* @__PURE__ */ U(i, { children: /* @__PURE__ */ U(l, {
			icon: /* @__PURE__ */ U(q, {}),
			title: "Nothing burns fuel",
			description: "None of the structures you can see have services online."
		}) }) : /* @__PURE__ */ W("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ W("div", {
					className: "grid grid-cols-2 gap-4 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ U(v, {
							label: "Blocks to buy",
							value: P(c.blocks),
							icon: /* @__PURE__ */ U(q, {}),
							hint: `for ${c.days} days`
						}),
						/* @__PURE__ */ U(v, {
							label: "Volume",
							value: `${P(c.volume)} m³`,
							icon: /* @__PURE__ */ U(Y, {}),
							mono: !0
						}),
						/* @__PURE__ */ U(v, {
							label: "Burn",
							value: P(c.per_day),
							hint: "blocks a day, all structures"
						}),
						/* @__PURE__ */ U(v, {
							label: "Cost",
							value: c.cost == null ? "—" : N(c.cost),
							hint: c.block_price == null ? "no fuel block prices yet" : `at ${N(c.block_price)} a block (cheapest average price)`,
							mono: !0
						})
					]
				}),
				c.groups.map((e) => /* @__PURE__ */ W(i, { children: [/* @__PURE__ */ U(o, {
					title: e.label,
					description: [
						e.kind === "staging" ? e.systems.join(", ") : null,
						e.region,
						`${P(e.per_day)} blocks a day`
					].filter(Boolean).join(" · "),
					actions: e.blocks > 0 ? /* @__PURE__ */ W("div", {
						className: "text-right",
						children: [/* @__PURE__ */ W("div", {
							className: "font-mono text-lg font-semibold tabular-nums",
							children: [P(e.blocks), " blocks"]
						}), /* @__PURE__ */ W("div", {
							className: "text-xs text-muted",
							children: [P(e.volume), " m³"]
						})]
					}) : /* @__PURE__ */ U(t, {
						tone: "success",
						children: "Topped up"
					})
				}), /* @__PURE__ */ W(x, { children: [/* @__PURE__ */ U(b, { children: /* @__PURE__ */ W("tr", { children: [
					/* @__PURE__ */ U(w, { children: "Structure" }),
					/* @__PURE__ */ U(w, { children: "Fuel left" }),
					/* @__PURE__ */ U(w, {
						align: "right",
						children: "Burn"
					}),
					/* @__PURE__ */ U(w, {
						align: "right",
						children: "Needs"
					})
				] }) }), /* @__PURE__ */ U("tbody", { children: e.structures.map((t) => /* @__PURE__ */ W(E, { children: [
					/* @__PURE__ */ U(C, { children: /* @__PURE__ */ W("div", {
						className: "flex items-center gap-2.5",
						children: [
							/* @__PURE__ */ U("img", {
								src: t.type.icon,
								alt: "",
								className: "size-7 rounded-md"
							}),
							/* @__PURE__ */ W("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ U("div", {
									className: "truncate font-medium",
									children: t.name
								}), /* @__PURE__ */ W("div", {
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
							t.claims.length > 0 && /* @__PURE__ */ U(T, {
								content: `${t.claims.map((e) => e.user).join(", ")} ${t.claims.length === 1 ? "is" : "are"} refuelling it`,
								children: /* @__PURE__ */ U("span", { children: /* @__PURE__ */ U(J, { className: "size-3.5 text-success-fg" }) })
							})
						]
					}) }),
					/* @__PURE__ */ U(C, { children: /* @__PURE__ */ U("span", {
						className: O("font-mono text-xs tabular-nums", t.level === "ok" ? "text-text" : X[t.level].tone === "danger" ? "text-danger-fg" : "text-warning-fg"),
						children: t.fuel_expires ? j(t.fuel_expires, m) : X[t.level].label
					}) }),
					/* @__PURE__ */ W(C, {
						numeric: !0,
						children: [P(t.fuel_expires ? t.burn : t.burn_all), "/h"]
					}),
					/* @__PURE__ */ U(C, {
						numeric: !0,
						className: O(t.need === 0 && "text-subtle"),
						children: P(t.need)
					})
				] }, t.id)) })] })] }, e.key)),
				/* @__PURE__ */ U("p", {
					className: "text-xs text-subtle",
					children: "Structures out of fuel are planned at what all their fitted services would burn. Fuel blocks are 5 m³ each."
				})
			]
		})
	] });
}
//#endregion
//#region src/settings.tsx
function ve() {
	let e = R(), { data: t, isLoading: s } = L({
		queryKey: ["structures", "settings"],
		queryFn: () => D.get(`${Q}/settings`)
	}), [l, p] = B(null), [m, h] = B("");
	z(() => {
		t && (p(t), h(t.thresholds.map(Z).join(", ")));
	}, [t]);
	let g = se(m), v = I({
		mutationFn: (e) => D.put(`${Q}/settings`, {
			...e,
			thresholds: g ?? []
		}),
		onSuccess: (t) => {
			e.setQueryData(["structures", "settings"], t), e.invalidateQueries({ queryKey: ["structures"] }), F.success("Saved");
		},
		onError: (e) => F.error(e.message)
	});
	if (s || !l) return /* @__PURE__ */ U(_, { className: "h-64" });
	let b = (e) => p({
		...l,
		...e
	}), x = (e) => b({ groups: l.groups.includes(e) ? l.groups.filter((t) => t !== e) : [...l.groups, e] }), S = Z(l.core_warning_hours);
	return /* @__PURE__ */ W(H, { children: [
		/* @__PURE__ */ W(V, {
			to: "/p/structures",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ U(ie, {}), " Structures & Fuel"]
		}),
		/* @__PURE__ */ U(f, {
			eyebrow: "Structures & Fuel",
			title: "Settings",
			icon: /* @__PURE__ */ U(re, {}),
			description: "When fuel warnings go out and to whom. Each structure can have its own thresholds from its pencil on the board."
		}),
		/* @__PURE__ */ W("div", {
			className: "grid max-w-5xl gap-6 lg:grid-cols-2",
			children: [
				/* @__PURE__ */ W(i, { children: [/* @__PURE__ */ U(o, {
					title: "Warnings",
					description: "Each threshold warns once when a structure's fuel falls below it, and again only after it was refuelled above it."
				}), /* @__PURE__ */ W(a, {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ U(u, {
							label: "Warn below",
							hint: "Days or hours, e.g. 7d, 3d, 1d or 12h. Empty: no warnings.",
							error: g ? void 0 : "Use days (7d) or hours (12h)",
							children: /* @__PURE__ */ U(d, {
								value: m,
								onChange: (e) => h(e.target.value),
								className: "font-mono"
							})
						}),
						/* @__PURE__ */ W(r, {
							tone: "info",
							children: [
								"EvE Conduit itself tells everyone who can see a corporation when one of its structures drops under ",
								S,
								". At exactly ",
								S,
								" this plugin sends no notification of its own (they were just told), but its event still goes out."
							]
						}),
						/* @__PURE__ */ U("div", {
							className: "divide-y divide-border",
							children: /* @__PURE__ */ U(y, {
								label: "Send notifications",
								description: "Off: only the structures.fuel_low event goes out, for webhooks (Administration → Integrations).",
								checked: l.notify,
								onCheckedChange: (e) => b({ notify: e })
							})
						})
					]
				})] }),
				/* @__PURE__ */ W(i, { children: [/* @__PURE__ */ U(o, { title: "Fuel plan and claims" }), /* @__PURE__ */ W(a, {
					className: "space-y-4",
					children: [/* @__PURE__ */ U(u, {
						label: "Top up to (days)",
						hint: "What the plan and each structure's “needs” count towards.",
						children: /* @__PURE__ */ U(d, {
							type: "number",
							min: 1,
							max: 365,
							value: l.plan_days,
							onChange: (e) => b({ plan_days: Number(e.target.value) }),
							className: "w-32 font-mono"
						})
					}), /* @__PURE__ */ U(u, {
						label: "A refuel claim lasts (hours)",
						hint: "It also ends by itself once the structure's fuel goes up.",
						children: /* @__PURE__ */ U(d, {
							type: "number",
							min: 1,
							max: 336,
							value: l.claim_hours,
							onChange: (e) => b({ claim_hours: Number(e.target.value) }),
							className: "w-32 font-mono"
						})
					})]
				})] }),
				/* @__PURE__ */ W(i, {
					className: "lg:col-span-2",
					children: [/* @__PURE__ */ U(o, {
						title: "Who is warned",
						description: "Members of any ticked group, but only about corporations whose structures they may see on the corporation sheet. Nothing ticked: everyone who may see them."
					}), /* @__PURE__ */ U(a, { children: l.group_options.length === 0 ? /* @__PURE__ */ U("p", {
						className: "text-sm text-muted",
						children: "No groups yet."
					}) : /* @__PURE__ */ U("div", {
						className: "flex flex-wrap gap-1.5",
						children: l.group_options.map((e) => /* @__PURE__ */ U("button", {
							type: "button",
							onClick: () => x(e.id),
							className: `border px-2 py-1 text-sm ${l.groups.includes(e.id) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:text-text"}`,
							"aria-pressed": l.groups.includes(e.id),
							children: e.name
						}, e.id))
					}) })]
				}),
				/* @__PURE__ */ U("div", {
					className: "lg:col-span-2",
					children: /* @__PURE__ */ U(n, {
						variant: "primary",
						loading: v.isPending,
						disabled: !g,
						onClick: () => v.mutate(l),
						children: "Save settings"
					})
				}),
				/* @__PURE__ */ U(c, {
					plugin: "structures",
					className: "lg:col-span-2"
				})
			]
		})
	] });
}
//#endregion
//#region src/index.tsx
var ye = A({
	routes: [
		{
			path: "",
			Component: de
		},
		{
			path: "plan",
			Component: _e
		},
		{
			path: "settings",
			Component: ve
		}
	],
	widgets: [{
		id: "low",
		title: "Structures running low",
		Component: ge,
		size: "sm",
		order: 45
	}]
});
//#endregion
export { ye as default };

export const classes = ["!data","!o","-space-x-1.5","@conduit/sdk","@tanstack/react-query","a","abandoned","about","above","actions","after","again","align","all","already","also","alt","anchoring","and","any","are","aria-label","aria-pressed","armor_reinforce","armor_vulnerable","as","asked","at","autoFocus","average","b","bare","bay","be","below","between","bg-accent-soft","bg-surface-2","block","block_price","blocks","blocks_left","board","boolean","border","border-accent","border-border","burn","burn_all","burns","but","button","buy","by","can","canManage","can_manage","can_view","category","checked","children","claim","claim_hours","claimed","claims","className","const","content","core","core_warning_hours","corporation","corporations","cost","count","countdowns","counting","created_at","critical","currentColor","custom","cx","cy","d","danger","data","day","days","default","defaults","definePlugin","description","disabled","divide-border","divide-y","drops","each","else","empty","enabled","ends","error","event","every","everyone","exactly","expires_at","export","eyebrow","falls","few","fill","first","fitted","flex","flex-1","flex-wrap","follow","font-medium","font-mono","font-semibold","footer","for","from","fuel","fuel_expires","fuel_low","fuelled","full","function","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-6","get","ghost","go","goes","grid","grid-cols-2","group","group_options","grouped","groups","h","h-16","h-64","has","hauls","have","height","here","hint","hours","hours_left","hover:text-text","how","hull_reinforce","hull_vulnerable","icon","icon-sm","icons","id","if","import","in","info","inline","inline-flex","interface","is","isLoading","isPending","it","items-baseline","items-center","items-end","its","itself","just","justify-between","justify-end","key","kind","label","last","lasts","least","left","length","let","level","lg:col-span-2","lg:grid-cols-2","lg:grid-cols-4","like","list","ll","loading","login","long","low","low_power","m","m12","m15","m21.73","m6","max","max-w-5xl","max-w-72","maxLength","may","mb-1","mb-4","min","min-w-0","min-w-48","ml-1.5","ml-2","ml-auto","mode","module","modules","mono","move","ms","mt-1","mutationFn","my_claim","n","name","need","needle","neutral","never","new","no","nobody","none","not","note","nothing","notification","notifications","notify","now","null","number","numeric","of","ok","on","onChange","onCheckedChange","onClaim","onClick","onClose","onEdit","onError","onOpenChange","onSuccess","once","one","online","online_modules","onlining_vulnerable","only","open","options","or","order","otherwise","out","outline","own","p","parsed","parts","patch","path","pencil","per","per_day","permission","placeholder","plan","plan_days","planned","plugin","points","portrait","prices","primary","put","px-2","px-3","px-card","py-1","py-2","py-6","qc","queryFn","queryKey","race","rate","re","react","react-router","refetchInterval","refuel","refuelled","refuelling","region","reinforce_hour","release","remaining","reported","rest","return","right","ring-2","ring-surface","round","rounded","rounded-lg","rounded-md","routes","rows","running","rx","ry","s","same","save","security","see","sends","server","service","services","set","setAsked","setClaiming","setCorp","setDays","setEditing","setForm","setMode","setNote","setNow","setQ","setShow","setSort","setStaging","setText","settings","sheet","shield_vulnerable","shopping","show","shrink-0","site","size","size-3.5","size-4","size-5","size-7","size-9","sm","so","something","sort","space-y-1.5","space-y-3","space-y-4","space-y-6","src","staging","state","state_timer_end","still","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structure","structures","style","success","summary","synced","syncs","system","systems","t","tabular-nums","tells","text","text-3xl","text-accent-ink","text-danger-fg","text-lg","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xs","that","the","their","then","there","they","this","threshold","threshold_override","thresholds","ticked","ticker","timer","title","to","toast","toggle","tone","top","topped","truncate","type","unanchored","unanchoring","unanchors_at","undefined","under","unknown_services","up","use","useNow","useQuery","useQueryClient","useState","used","user","user_id","v","value","variant","view","viewBox","viewer","void","volume","w-28","w-32","w-44","w-48","w-64","warn","warned","warning","warnings","warns","was","webhooks","were","what","when","where","which","who","whose","widgets","width","with","work","worst","would","x","x1","x2","xs","y1","y2","yet","you","your"];
