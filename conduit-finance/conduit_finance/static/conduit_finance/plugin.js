import { AreaChart as e, Badge as t, Button as n, Callout as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, Dialog as c, EmptyState as l, Field as u, Input as d, KpiTile as f, PageHeader as p, SearchInput as m, Segmented as h, Select as g, Skeleton as _, StatCard as v, Switch as y, THead as b, Table as x, TableToolbar as S, Td as C, Th as w, Tr as T, api as E, cn as D, date as O, dateTime as k, definePlugin as A, isk as j, num as M, toast as N } from "@conduit/sdk";
import { useMutation as P, useQuery as F, useQueryClient as I } from "@tanstack/react-query";
import { Fragment as L, jsx as R, jsxs as z } from "react/jsx-runtime";
import { useEffect as ee, useRef as te, useState as B } from "react";
import { Link as V, useNavigate as ne, useSearchParams as re } from "react-router";
//#region src/icons.tsx
function H({ children: e, className: t = "size-4" }) {
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
var ie = (e) => /* @__PURE__ */ z(H, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" }), /* @__PURE__ */ R("path", { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" })]
}), U = (e) => /* @__PURE__ */ z(H, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }),
		/* @__PURE__ */ R("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }),
		/* @__PURE__ */ R("path", { d: "M10 9H8" }),
		/* @__PURE__ */ R("path", { d: "M16 13H8" }),
		/* @__PURE__ */ R("path", { d: "M16 17H8" })
	]
}), ae = (e) => /* @__PURE__ */ R(H, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" })
}), oe = (e) => /* @__PURE__ */ z(H, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M15 12h-5" }),
		/* @__PURE__ */ R("path", { d: "M15 8h-5" }),
		/* @__PURE__ */ R("path", { d: "M19 17V5a2 2 0 0 0-2-2H4" }),
		/* @__PURE__ */ R("path", { d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" })
	]
}), W = (e) => /* @__PURE__ */ z(H, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ R("path", { d: "m7 10 5 5 5-5" }),
		/* @__PURE__ */ R("path", { d: "M12 15V3" })
	]
}), se = (e) => /* @__PURE__ */ z(H, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }),
		/* @__PURE__ */ R("path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" }),
		/* @__PURE__ */ R("rect", {
			x: "6",
			y: "14",
			width: "12",
			height: "8",
			rx: "1"
		})
	]
}), G = (e) => /* @__PURE__ */ R(H, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })
}), ce = (e) => /* @__PURE__ */ z(H, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M5 12h14" }), /* @__PURE__ */ R("path", { d: "M12 5v14" })]
}), le = (e) => /* @__PURE__ */ z(H, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M3 6h18" }),
		/* @__PURE__ */ R("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ R("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), ue = (e) => /* @__PURE__ */ z(H, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" }), /* @__PURE__ */ R("path", { d: "m15 5 4 4" })]
}), K = (e) => /* @__PURE__ */ z(H, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "m16 3 4 4-4 4" }),
		/* @__PURE__ */ R("path", { d: "M20 7H4" }),
		/* @__PURE__ */ R("path", { d: "m8 21-4-4 4-4" }),
		/* @__PURE__ */ R("path", { d: "M4 17h16" })
	]
}), de = (e) => /* @__PURE__ */ z(H, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M18 6 6 18" }), /* @__PURE__ */ R("path", { d: "m6 6 12 12" })]
}), q = "/api/p/finance";
//#endregion
//#region src/shared.tsx
function J() {
	return F({
		queryKey: ["finance", "months"],
		queryFn: () => E.get(`${q}/months`)
	});
}
function Y(e) {
	let [t, n] = re();
	return [t.get(e) ?? "", (t) => n((n) => {
		let r = new URLSearchParams(n);
		return t ? r.set(e, t) : r.delete(e), r;
	}, { replace: !0 })];
}
function fe({ value: e, onChange: t, closedOnly: n = !1 }) {
	let { data: r } = J(), i = (r?.months ?? []).filter((t) => !n || !t.current || t.month === e), a = (i.length ? i : [{
		month: e,
		label: e,
		current: !1,
		reported: !1
	}]).map((e) => ({
		value: e.month,
		label: `${e.label}${e.current ? " · so far" : ""}`
	}));
	return /* @__PURE__ */ R(g, {
		value: e,
		onChange: (e) => t(e.target.value),
		options: a,
		"aria-label": "Month",
		className: "w-52"
	});
}
function X({ corps: e, value: t, onChange: n, allowAll: r = !0 }) {
	let i = [...r ? [{
		value: "",
		label: e.length > 1 ? `All ${e.length} corporations` : "All corporations"
	}] : [], ...e.map((e) => ({
		value: String(e.id),
		label: `${e.name} [${e.ticker}]`
	}))];
	return /* @__PURE__ */ R(g, {
		value: t,
		onChange: (e) => n(e.target.value),
		options: i,
		"aria-label": "Corporation",
		className: "w-64"
	});
}
function Z(e) {
	let t = new URLSearchParams();
	for (let [n, r] of Object.entries(e)) r !== "" && r != null && t.set(n, String(r));
	let n = t.toString();
	return n ? `?${n}` : "";
}
function pe({ amount: e, percent: t, invert: n = !1, className: r }) {
	return e ? /* @__PURE__ */ z("span", {
		className: D("font-mono tabular-nums", e > 0 === n ? "text-danger-fg" : "text-success-fg", r),
		children: [j(e, { sign: !0 }), t != null && ` (${t > 0 ? "+" : ""}${t.toLocaleString("en", { maximumFractionDigits: 1 })} %)`]
	}) : /* @__PURE__ */ R("span", {
		className: D("text-muted", r),
		children: "no change"
	});
}
function me(e) {
	if (e <= 0) return 1;
	let t = 10 ** Math.floor(Math.log10(e));
	return [
		1,
		2,
		2.5,
		5,
		10
	].map((e) => e * t).find((t) => t >= e) ?? e;
}
var he = (e, t = !1) => (/* @__PURE__ */ new Date(`${e}-01T00:00:00Z`)).toLocaleDateString("en-GB", {
	month: t ? "long" : "short",
	year: t ? "numeric" : "2-digit",
	timeZone: "UTC"
});
function ge() {
	return /* @__PURE__ */ z("div", {
		className: "flex items-center gap-4 text-xs text-muted",
		children: [
			/* @__PURE__ */ z("span", {
				className: "inline-flex items-center gap-1.5",
				children: [/* @__PURE__ */ R("span", {
					className: "size-2.5 rounded-sm",
					style: { background: "var(--success)" }
				}), " Income"]
			}),
			/* @__PURE__ */ z("span", {
				className: "inline-flex items-center gap-1.5",
				children: [/* @__PURE__ */ R("span", {
					className: "size-2.5 rounded-sm",
					style: { background: "var(--danger)" }
				}), " Spending"]
			}),
			/* @__PURE__ */ z("span", {
				className: "inline-flex items-center gap-1.5",
				children: [/* @__PURE__ */ R("span", { className: "size-2 rotate-45 bg-text" }), " Net"]
			})
		]
	});
}
function _e({ data: e, height: t = 240, onPick: n }) {
	let r = te(null), [i, a] = B(640), [o, s] = B(null);
	ee(() => {
		let e = r.current;
		if (!e) return;
		let t = new ResizeObserver(([e]) => a(Math.max(160, Math.round(e.contentRect.width))));
		return t.observe(e), () => t.disconnect();
	}, []);
	let c = {
		t: 12,
		r: 8,
		b: 26,
		l: 64
	}, l = me(Math.max(...e.map((e) => e.income), 0)), u = me(Math.max(...e.map((e) => e.spending), 0)), d = l + u, f = t - c.t - c.b, p = (e) => c.t + (l - e) / d * f, m = p(0), h = (i - c.l - c.r) / Math.max(1, e.length), g = Math.min(28, Math.max(3, h - 6)), _ = [
		l,
		0,
		-u
	], v = (e, t, n) => {
		let r = Math.abs(n - t);
		if (r < .5) return "";
		let i = Math.min(4, r, g / 2);
		return n < t ? `M${e},${t}V${n + i}Q${e},${n} ${e + i},${n}H${e + g - i}Q${e + g},${n} ${e + g},${n + i}V${t}Z` : `M${e},${t}V${n - i}Q${e},${n} ${e + i},${n}H${e + g - i}Q${e + g},${n} ${e + g},${n - i}V${t}Z`;
	}, y = o === null ? void 0 : e[o];
	return /* @__PURE__ */ z("div", {
		ref: r,
		className: "relative",
		children: [/* @__PURE__ */ z("svg", {
			width: i,
			height: t,
			className: "block select-none",
			role: "img",
			"aria-label": "Income and spending per month",
			onPointerLeave: () => s(null),
			children: [
				_.map((e) => /* @__PURE__ */ z("g", { children: [/* @__PURE__ */ R("line", {
					x1: c.l,
					x2: i - c.r,
					y1: p(e),
					y2: p(e),
					stroke: e === 0 ? "var(--border-strong)" : "var(--border)",
					strokeWidth: "1"
				}), /* @__PURE__ */ R("text", {
					x: c.l - 10,
					y: p(e),
					dy: "0.32em",
					textAnchor: "end",
					className: "fill-muted font-mono text-[11px] tabular-nums",
					children: j(e).replace(" ISK", "")
				})] }, e)),
				e.map((e, t) => {
					let r = c.l + t * h + (h - g) / 2, i = o !== null && o !== t ? .4 : .9;
					return /* @__PURE__ */ z("g", {
						onPointerEnter: () => s(t),
						onClick: () => n?.(e.month),
						className: n ? "cursor-pointer" : void 0,
						children: [
							/* @__PURE__ */ R("rect", {
								x: c.l + t * h,
								y: c.t,
								width: h,
								height: f,
								fill: "transparent"
							}),
							/* @__PURE__ */ R("path", {
								d: v(r, m - 1, p(e.income)),
								fill: "var(--success)",
								opacity: i
							}),
							/* @__PURE__ */ R("path", {
								d: v(r, m + 1, p(-e.spending)),
								fill: "var(--danger)",
								opacity: i
							}),
							(e.income || e.spending) > 0 && /* @__PURE__ */ R("rect", {
								x: r + g / 2 - 4,
								y: p(e.net) - 4,
								width: 8,
								height: 8,
								transform: `rotate(45 ${r + g / 2} ${p(e.net)})`,
								fill: "var(--text)",
								stroke: "var(--surface)",
								strokeWidth: "2"
							})
						]
					}, e.month);
				}),
				[
					0,
					Math.floor((e.length - 1) / 2),
					e.length - 1
				].filter((e, t, n) => n.indexOf(e) === t).map((n) => e[n] ? /* @__PURE__ */ R("text", {
					x: c.l + n * h + h / 2,
					y: t - 6,
					textAnchor: e.length === 1 ? "middle" : n === 0 ? "start" : n === e.length - 1 ? "end" : "middle",
					className: "fill-muted text-[11px]",
					children: he(e[n].month)
				}, n) : null)
			]
		}), y && o !== null && /* @__PURE__ */ z("div", {
			className: "pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border-strong bg-surface-raised px-2.5 py-1.5 text-xs shadow-e3",
			style: { left: `clamp(80px, ${(c.l + o * h + h / 2) / i * 100}%, calc(100% - 80px))` },
			children: [/* @__PURE__ */ R("div", {
				className: "mb-1 text-muted",
				children: he(y.month, !0)
			}), /* @__PURE__ */ z("div", {
				className: "grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 font-mono tabular-nums text-text",
				children: [
					/* @__PURE__ */ R("span", {
						className: "font-sans text-muted",
						children: "Income"
					}),
					/* @__PURE__ */ R("span", {
						className: "text-right",
						children: j(y.income)
					}),
					/* @__PURE__ */ R("span", {
						className: "font-sans text-muted",
						children: "Spending"
					}),
					/* @__PURE__ */ R("span", {
						className: "text-right",
						children: j(y.spending)
					}),
					/* @__PURE__ */ R("span", {
						className: "font-sans text-muted",
						children: "Net"
					}),
					/* @__PURE__ */ R("span", {
						className: "text-right font-semibold",
						children: j(y.net, { sign: !0 })
					}),
					(y.internal_in > 0 || y.internal_out > 0) && /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R("span", {
						className: "font-sans text-subtle",
						children: "Internal"
					}), /* @__PURE__ */ z("span", {
						className: "text-right text-subtle",
						children: [
							j(y.internal_in),
							" in · ",
							j(y.internal_out),
							" out"
						]
					})] })
				]
			})]
		})]
	});
}
//#endregion
//#region src/balances.tsx
var ve = [
	{
		value: "30",
		label: "30 d"
	},
	{
		value: "90",
		label: "90 d"
	},
	{
		value: "180",
		label: "6 mo"
	},
	{
		value: "365",
		label: "1 y"
	},
	{
		value: "0",
		label: "All"
	}
];
function ye() {
	let { data: t } = J(), [n, r] = Y("corporation"), [s, c] = Y("days"), u = ve.some((e) => e.value === s) ? s : "180", { data: d, isLoading: f, error: m } = F({
		queryKey: [
			"finance",
			"balances",
			n,
			u
		],
		queryFn: () => E.get(`${q}/balances${Z({
			corporation: n,
			days: u
		})}`)
	}), g = t?.corporations ?? [], y = d && d.series.length > 0 ? d.series[d.series.length - 1].value - d.series[0].value : 0;
	return /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(p, {
		eyebrow: "Corp finance",
		title: "Balances",
		icon: /* @__PURE__ */ R(ae, {}),
		description: "Each wallet division's balance at the end of every day, from the balance the journal records after each entry. Today's comes from the last wallet sync.",
		actions: /* @__PURE__ */ z("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [g.length > 1 && /* @__PURE__ */ R(X, {
				corps: g,
				value: n || String(d?.corporation ?? ""),
				onChange: r,
				allowAll: !1
			}), /* @__PURE__ */ R(h, {
				value: u,
				onChange: (e) => c(e === "180" ? "" : e),
				options: ve,
				"aria-label": "Range",
				size: "sm"
			})]
		})
	}), m ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(l, {
		icon: /* @__PURE__ */ R(ae, {}),
		title: "No corporation wallets to show",
		description: m.message
	}) }) : f || !d ? /* @__PURE__ */ R(_, { className: "h-72" }) : /* @__PURE__ */ z("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ z("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ R(v, {
						label: "All divisions",
						value: j(d.balance),
						mono: !0,
						hint: "now"
					}),
					/* @__PURE__ */ R(v, {
						label: "Change",
						value: j(y, { sign: !0 }),
						mono: !0,
						tone: y < 0 ? "danger" : "success",
						hint: `since ${O(d.since)}`
					}),
					/* @__PURE__ */ R(v, {
						label: "History from",
						value: O(d.coverage),
						hint: "the oldest journal entry kept"
					})
				]
			}),
			/* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, {
				title: "All divisions",
				description: "Added up, internal transfers included (they cancel out)"
			}), /* @__PURE__ */ R(a, { children: /* @__PURE__ */ R(e, {
				data: d.series,
				format: (e) => j(e),
				label: "Balance"
			}) })] }),
			/* @__PURE__ */ R("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: d.divisions.map((t) => /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, {
					title: t.name,
					description: `Division ${t.division}`,
					actions: /* @__PURE__ */ z("div", {
						className: "text-right",
						children: [/* @__PURE__ */ R("div", {
							className: "font-mono text-sm font-semibold tabular-nums",
							children: j(t.balance)
						}), /* @__PURE__ */ R("div", {
							className: D("font-mono text-xs tabular-nums", t.change < 0 ? "text-danger-fg" : t.change > 0 ? "text-success-fg" : "text-muted"),
							children: j(t.change, { sign: !0 })
						})]
					})
				}), /* @__PURE__ */ R(a, { children: /* @__PURE__ */ R(e, {
					data: t.series,
					format: (e) => j(e),
					label: t.name,
					height: 160
				}) })] }, t.division))
			})
		]
	})] });
}
//#endregion
//#region src/journal.tsx
var be = [
	{
		value: "",
		label: "Everything"
	},
	{
		value: "no",
		label: "Without internal transfers"
	},
	{
		value: "yes",
		label: "Only internal transfers"
	}
];
function xe() {
	let { data: e } = J(), [r, a] = Y("month"), [o, s] = Y("corporation"), [c, u] = Y("category"), [d, f] = Y("internal"), [h, v] = B(""), y = r || e?.current || "", O = {
		month: y,
		corporation: o,
		category: c,
		internal: d,
		q: h.trim()
	}, { data: A, isLoading: M } = F({
		queryKey: [
			"finance",
			"journal",
			O
		],
		queryFn: () => E.get(`${q}/journal${Z(O)}`),
		enabled: !!y
	}), N = [.../* @__PURE__ */ new Set([...c ? [c] : [], ...A?.categories ?? []])];
	return /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(p, {
		eyebrow: "Corp finance",
		title: "Journal",
		icon: /* @__PURE__ */ R(oe, {}),
		description: "Every wallet journal entry of the month with the category it counts under. Categories and tags are set under Settings.",
		actions: /* @__PURE__ */ z("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [
				/* @__PURE__ */ R(fe, {
					value: y,
					onChange: a
				}),
				e && e.corporations.length > 1 && /* @__PURE__ */ R(X, {
					corps: e.corporations,
					value: o,
					onChange: s
				}),
				/* @__PURE__ */ R("a", {
					href: `${q}/journal.csv${Z(O)}`,
					download: !0,
					children: /* @__PURE__ */ z(n, {
						variant: "ghost",
						children: [/* @__PURE__ */ R(W, {}), " CSV"]
					})
				})
			]
		})
	}), /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ z(S, { children: [
		/* @__PURE__ */ R(m, {
			value: h,
			onChange: (e) => v(e.target.value),
			placeholder: "Search reason, description or ref type",
			className: "w-72"
		}),
		/* @__PURE__ */ R(g, {
			value: c,
			onChange: (e) => u(e.target.value),
			options: [{
				value: "",
				label: "Every category"
			}, ...N.map((e) => ({
				value: e,
				label: e
			}))],
			"aria-label": "Category",
			className: "w-56"
		}),
		/* @__PURE__ */ R(g, {
			value: d,
			onChange: (e) => f(e.target.value),
			options: be,
			"aria-label": "Internal transfers",
			className: "w-64"
		}),
		A?.truncated && /* @__PURE__ */ z("span", {
			className: "text-xs text-subtle",
			children: [
				"Showing the newest ",
				A.limit,
				"; the CSV has them all."
			]
		})
	] }), M || !A ? /* @__PURE__ */ R(_, { className: "m-card h-48" }) : A.rows.length === 0 ? /* @__PURE__ */ R(l, {
		icon: /* @__PURE__ */ R(oe, {}),
		title: "No entries",
		description: `Nothing in ${A.label} with these filters.`
	}) : /* @__PURE__ */ z(x, {
		stickyHeader: !0,
		children: [/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("tr", { children: [
			/* @__PURE__ */ R(w, { children: "Date (EVE)" }),
			/* @__PURE__ */ R(w, { children: "Category" }),
			/* @__PURE__ */ R(w, { children: "Counterparty" }),
			/* @__PURE__ */ R(w, { children: "Wallet" }),
			/* @__PURE__ */ R(w, {
				align: "right",
				children: "Amount"
			}),
			/* @__PURE__ */ R(w, {
				align: "right",
				children: "Balance"
			})
		] }) }), /* @__PURE__ */ R("tbody", { children: A.rows.map((e) => /* @__PURE__ */ z(T, { children: [
			/* @__PURE__ */ R(C, {
				className: "whitespace-nowrap text-muted",
				children: k(e.date)
			}),
			/* @__PURE__ */ z(C, { children: [/* @__PURE__ */ R("div", {
				className: "flex items-center gap-2",
				children: e.internal ? /* @__PURE__ */ R(t, {
					tone: "info",
					children: e.category
				}) : /* @__PURE__ */ R("span", {
					className: "font-medium",
					children: e.category
				})
			}), /* @__PURE__ */ R("div", {
				className: "text-xs text-subtle",
				children: e.ref_type_label
			})] }),
			/* @__PURE__ */ z(C, {
				className: "max-w-72",
				children: [/* @__PURE__ */ R("div", {
					className: "truncate",
					children: e.counterparty || "—"
				}), (e.reason || e.description) && /* @__PURE__ */ R("div", {
					className: "truncate text-xs text-subtle",
					title: e.description,
					children: e.reason || e.description
				})]
			}),
			/* @__PURE__ */ z(C, {
				className: "whitespace-nowrap",
				children: [/* @__PURE__ */ R("div", { children: e.ticker ? `[${e.ticker}]` : e.corporation }), /* @__PURE__ */ R("div", {
					className: "text-xs text-subtle",
					children: e.division
				})]
			}),
			/* @__PURE__ */ R(C, {
				numeric: !0,
				className: D(e.internal ? "text-muted" : e.amount < 0 ? "text-danger-fg" : "text-success-fg"),
				children: j(e.amount, {
					sign: !0,
					full: !0
				})
			}),
			/* @__PURE__ */ R(C, {
				numeric: !0,
				className: "text-muted",
				children: e.balance == null ? "—" : j(e.balance)
			})
		] }, e.id)) })]
	})] })] });
}
//#endregion
//#region src/overview.tsx
var Se = [
	"6",
	"12",
	"24"
];
function Ce() {
	let e = ne(), [t, s] = Y("corporation"), [c, u] = Y("months"), d = Se.includes(c) ? c : "12", { data: f } = J(), { data: m, isLoading: g } = F({
		queryKey: [
			"finance",
			"overview",
			t,
			d
		],
		queryFn: () => E.get(`${q}/overview${Z({
			corporation: t,
			months: d
		})}`)
	}), y = m?.months[m.months.length - 1], S = m?.months[m.months.length - 2], O = m?.months.reduce((e, t) => e + t.internal_in + t.internal_out, 0) ?? 0;
	return /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(p, {
		eyebrow: "Finance",
		title: "Corp finance",
		icon: /* @__PURE__ */ R(ie, {}),
		description: "What your corporations earned and spent each month, by category, from their wallet journals. Money moved between their own divisions, or between the alliance's corporations, is kept apart.",
		actions: /* @__PURE__ */ z("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [
				m && m.corporations.length > 1 && /* @__PURE__ */ R(X, {
					corps: m.corporations,
					value: t,
					onChange: s
				}),
				/* @__PURE__ */ R(h, {
					value: d,
					onChange: (e) => u(e === "12" ? "" : e),
					options: Se.map((e) => ({
						value: e,
						label: `${e} mo`
					})),
					"aria-label": "Months",
					size: "sm"
				}),
				/* @__PURE__ */ R(V, {
					to: `/p/finance/report${Z({ corporation: t })}`,
					children: /* @__PURE__ */ z(n, {
						variant: "ghost",
						children: [/* @__PURE__ */ R(U, {}), " Monthly report"]
					})
				}),
				f?.can_manage && /* @__PURE__ */ R(V, {
					to: "/p/finance/settings",
					children: /* @__PURE__ */ z(n, {
						variant: "ghost",
						children: [/* @__PURE__ */ R(G, {}), " Settings"]
					})
				})
			]
		})
	}), g || !m ? /* @__PURE__ */ R("div", {
		className: "grid gap-4 sm:grid-cols-4",
		children: [
			0,
			1,
			2,
			3
		].map((e) => /* @__PURE__ */ R(_, { className: "h-28" }, e))
	}) : m.corporations.length === 0 ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(l, {
		icon: /* @__PURE__ */ R(ie, {}),
		title: "No corporation wallets to show",
		description: "Corp finance reads the wallets the corporation sheet syncs. You need to be allowed to see a corporation's finances there, and its wallets need to have synced (with an Accountant's or Director's login)."
	}) }) : /* @__PURE__ */ z("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ z("div", {
				className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ R(v, {
						label: `Income · ${y?.label ?? ""}`,
						value: j(y?.income ?? 0),
						mono: !0,
						hint: S ? `${j(S.income)} in ${S.label}` : void 0
					}),
					/* @__PURE__ */ R(v, {
						label: "Spending",
						value: j(y?.spending ?? 0),
						mono: !0,
						hint: S ? `${j(S.spending)} in ${S.label}` : void 0
					}),
					/* @__PURE__ */ R(v, {
						label: "Net",
						value: j(y?.net ?? 0, { sign: !0 }),
						mono: !0,
						tone: (y?.net ?? 0) < 0 ? "danger" : "success",
						hint: "this month so far"
					}),
					/* @__PURE__ */ R(v, {
						label: "Internal transfers",
						value: j((y?.internal_in ?? 0) + (y?.internal_out ?? 0)),
						mono: !0,
						icon: /* @__PURE__ */ R(K, {}),
						hint: "moved around, not counted"
					})
				]
			}),
			/* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, {
				title: "Income and spending",
				description: "Per month, without internal transfers. Click a month for its report.",
				actions: /* @__PURE__ */ R(ge, {})
			}), /* @__PURE__ */ R(a, { children: /* @__PURE__ */ R(_e, {
				data: m.months,
				onPick: (n) => e(`/p/finance/report${Z({
					month: n,
					corporation: t
				})}`)
			}) })] }),
			/* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, {
				title: "By category",
				description: `Over the last ${d} months. Click one to see its entries.`
			}), m.categories.length === 0 ? /* @__PURE__ */ R("p", {
				className: "px-card pb-card text-sm text-muted",
				children: "No wallet entries in these months."
			}) : /* @__PURE__ */ z(x, { children: [/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("tr", { children: [
				/* @__PURE__ */ R(w, { children: "Category" }),
				/* @__PURE__ */ R(w, {
					align: "right",
					children: "This month"
				}),
				/* @__PURE__ */ R(w, {
					align: "right",
					children: "Income"
				}),
				/* @__PURE__ */ R(w, {
					align: "right",
					children: "Spending"
				}),
				/* @__PURE__ */ R(w, {
					align: "right",
					children: "Net"
				})
			] }) }), /* @__PURE__ */ R("tbody", { children: m.categories.map((n) => {
				let r = n.income.length - 1, i = (n.income[r] ?? 0) - (n.spending[r] ?? 0), a = n.total_income - n.total_spending;
				return /* @__PURE__ */ z(T, {
					interactive: !0,
					onClick: () => e(`/p/finance/journal${Z({
						category: n.category,
						corporation: t
					})}`),
					children: [
						/* @__PURE__ */ R(C, {
							className: "font-medium",
							children: n.category
						}),
						/* @__PURE__ */ R(C, {
							numeric: !0,
							className: D(i < 0 && "text-danger-fg"),
							children: i ? j(i, { sign: !0 }) : "—"
						}),
						/* @__PURE__ */ R(C, {
							numeric: !0,
							children: n.total_income ? j(n.total_income) : "—"
						}),
						/* @__PURE__ */ R(C, {
							numeric: !0,
							children: n.total_spending ? j(n.total_spending) : "—"
						}),
						/* @__PURE__ */ R(C, {
							numeric: !0,
							className: D("font-semibold", a < 0 ? "text-danger-fg" : "text-success-fg"),
							children: j(a, { sign: !0 })
						})
					]
				}, n.category);
			}) })] })] }),
			O > 0 && /* @__PURE__ */ z(r, {
				tone: "info",
				title: "Internal transfers",
				children: [
					j(O),
					" moved between divisions or between your corporations in these months. It's left out of the figures above; see it in the ",
					/* @__PURE__ */ R(V, {
						className: "underline",
						to: `/p/finance/journal${Z({
							internal: "yes",
							corporation: t
						})}`,
						children: "journal"
					}),
					"."
				]
			}),
			!t && m.this_month.length > 1 && /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, { title: `${y?.label ?? "This month"} per corporation` }), /* @__PURE__ */ z(x, { children: [/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("tr", { children: [
				/* @__PURE__ */ R(w, { children: "Corporation" }),
				/* @__PURE__ */ R(w, {
					align: "right",
					children: "Income"
				}),
				/* @__PURE__ */ R(w, {
					align: "right",
					children: "Spending"
				}),
				/* @__PURE__ */ R(w, {
					align: "right",
					children: "Net"
				})
			] }) }), /* @__PURE__ */ R("tbody", { children: m.this_month.map((e) => /* @__PURE__ */ z(T, {
				interactive: !0,
				onClick: () => s(String(e.id)),
				children: [
					/* @__PURE__ */ z(C, { children: [
						e.name,
						" ",
						/* @__PURE__ */ z("span", {
							className: "text-subtle",
							children: [
								"[",
								e.ticker,
								"]"
							]
						})
					] }),
					/* @__PURE__ */ R(C, {
						numeric: !0,
						children: j(e.income)
					}),
					/* @__PURE__ */ R(C, {
						numeric: !0,
						children: j(e.spending)
					}),
					/* @__PURE__ */ R(C, {
						numeric: !0,
						className: D("font-semibold", e.net < 0 ? "text-danger-fg" : "text-success-fg"),
						children: j(e.net, { sign: !0 })
					})
				]
			}, e.id)) })] })] })
		]
	})] });
}
function we() {
	let { data: e, isLoading: t } = F({
		queryKey: ["finance", "summary"],
		queryFn: () => E.get(`${q}/summary`),
		refetchInterval: 6e5
	});
	return t || !e ? /* @__PURE__ */ R(_, { className: "h-16" }) : e.corporations.length === 0 ? /* @__PURE__ */ R("p", {
		className: "text-sm text-muted",
		children: "No corporation wallets you may see."
	}) : /* @__PURE__ */ z(V, {
		to: "/p/finance",
		className: "block space-y-3",
		children: [/* @__PURE__ */ z("div", { children: [
			/* @__PURE__ */ z("div", {
				className: "text-xs text-muted",
				children: ["Net in ", e.label]
			}),
			/* @__PURE__ */ R("div", {
				className: D("mt-1 font-mono text-3xl font-semibold tabular-nums", e.net < 0 ? "text-danger-fg" : "text-text"),
				children: j(e.net, { sign: !0 })
			}),
			/* @__PURE__ */ R("div", {
				className: "text-xs text-subtle",
				children: "without internal transfers"
			})
		] }), e.corporations.length > 1 && /* @__PURE__ */ R("ul", {
			className: "space-y-1.5",
			children: e.corporations.slice(0, 6).map((e) => /* @__PURE__ */ z("li", {
				className: "flex items-center gap-2 text-sm",
				children: [/* @__PURE__ */ z("span", {
					className: "min-w-0 flex-1 truncate",
					children: [
						e.name,
						" ",
						/* @__PURE__ */ z("span", {
							className: "text-subtle",
							children: [
								"[",
								e.ticker,
								"]"
							]
						})
					]
				}), /* @__PURE__ */ R("span", {
					className: D("font-mono text-xs tabular-nums", e.net < 0 ? "text-danger-fg" : "text-success-fg"),
					children: j(e.net, { sign: !0 })
				})]
			}, e.id))
		})]
	});
}
//#endregion
//#region src/report.tsx
var Te = "\n@media print {\n  @page { margin: 14mm; }\n  body * { visibility: hidden !important; }\n  #finance-report, #finance-report * { visibility: visible !important; }\n  #finance-report { position: absolute; inset: 0 auto auto 0; width: 100%; }\n  #finance-report, #finance-report * { color: #000 !important; background: transparent !important; box-shadow: none !important; border-color: #ccc !important; }\n  #finance-report .finance-no-print { display: none !important; }\n  #finance-report .finance-card { break-inside: avoid; }\n}";
function Q(e) {
	return j(e, { sign: !0 });
}
function Ee() {
	let { data: e } = J(), [r, a] = Y("month"), [s, c] = Y("corporation"), u = r || e?.months.find((e) => !e.current)?.month || e?.current || "", { data: d, isLoading: m } = F({
		queryKey: [
			"finance",
			"report",
			u,
			s
		],
		queryFn: () => E.get(`${q}/report${Z({
			month: u,
			corporation: s
		})}`),
		enabled: !!u
	});
	return /* @__PURE__ */ z("div", {
		id: "finance-report",
		children: [
			/* @__PURE__ */ R("style", { children: Te }),
			/* @__PURE__ */ R(p, {
				eyebrow: "Corp finance",
				title: d ? `Report · ${d.label}` : "Monthly report",
				icon: /* @__PURE__ */ R(U, {}),
				description: d ? `${d.corporations.map((e) => e.name).join(", ") || "No corporations"}. Internal transfers are left out of income and spending.` : "One month's income, spending and where the money came from and went.",
				actions: /* @__PURE__ */ z("div", {
					className: "finance-no-print flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ R(fe, {
							value: u,
							onChange: a
						}),
						e && e.corporations.length > 1 && /* @__PURE__ */ R(X, {
							corps: e.corporations,
							value: s,
							onChange: c
						}),
						/* @__PURE__ */ R("a", {
							href: `${q}/journal.csv${Z({
								month: u,
								corporation: s
							})}`,
							download: !0,
							children: /* @__PURE__ */ z(n, {
								variant: "ghost",
								children: [/* @__PURE__ */ R(W, {}), " CSV"]
							})
						}),
						/* @__PURE__ */ z(n, {
							onClick: () => window.print(),
							children: [/* @__PURE__ */ R(se, {}), " Print"]
						})
					]
				})
			}),
			m || !d ? /* @__PURE__ */ R("div", {
				className: "grid gap-4 sm:grid-cols-4",
				children: [
					0,
					1,
					2,
					3
				].map((e) => /* @__PURE__ */ R(_, { className: "h-28" }, e))
			}) : d.corporations.length === 0 ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(l, {
				icon: /* @__PURE__ */ R(U, {}),
				title: "No corporation wallets to report on"
			}) }) : /* @__PURE__ */ z("div", {
				className: "space-y-6",
				children: [
					!d.complete && /* @__PURE__ */ z(t, {
						tone: "warning",
						children: [d.label, " isn't over yet: these are the figures so far"]
					}),
					/* @__PURE__ */ z("div", {
						className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
						children: [
							/* @__PURE__ */ R(f, {
								label: "Income",
								value: j(d.totals.income),
								delta: d.change.income.amount,
								deltaFormat: Q,
								deltaLabel: `vs ${d.previous_label}`
							}),
							/* @__PURE__ */ R(f, {
								label: "Spending",
								value: j(d.totals.spending),
								delta: d.change.spending.amount,
								deltaFormat: Q,
								deltaLabel: `vs ${d.previous_label}`,
								invert: !0
							}),
							/* @__PURE__ */ R(f, {
								label: "Net",
								value: j(d.totals.net, { sign: !0 }),
								delta: d.change.net.amount,
								deltaFormat: Q,
								deltaLabel: `vs ${d.previous_label}`
							}),
							/* @__PURE__ */ R(v, {
								label: "Internal transfers",
								value: j(d.totals.internal_in + d.totals.internal_out),
								mono: !0,
								icon: /* @__PURE__ */ R(K, {}),
								hint: `${j(d.totals.internal_in)} in · ${j(d.totals.internal_out)} out, not counted`
							})
						]
					}),
					/* @__PURE__ */ z(i, {
						className: "finance-card",
						children: [/* @__PURE__ */ R(o, {
							title: "Categories",
							description: `Biggest first, against ${d.previous_label}`
						}), d.categories.length === 0 ? /* @__PURE__ */ R("p", {
							className: "px-card pb-card text-sm text-muted",
							children: "No wallet entries this month."
						}) : /* @__PURE__ */ z(x, { children: [
							/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("tr", { children: [
								/* @__PURE__ */ R(w, { children: "Category" }),
								/* @__PURE__ */ R(w, {
									align: "right",
									children: "Income"
								}),
								/* @__PURE__ */ R(w, {
									align: "right",
									children: "Spending"
								}),
								/* @__PURE__ */ R(w, {
									align: "right",
									children: "Net"
								}),
								/* @__PURE__ */ R(w, {
									align: "right",
									children: d.previous_label
								}),
								/* @__PURE__ */ R(w, {
									align: "right",
									children: "Change"
								})
							] }) }),
							/* @__PURE__ */ R("tbody", { children: d.categories.map((e) => /* @__PURE__ */ z(T, { children: [
								/* @__PURE__ */ z(C, { children: [/* @__PURE__ */ R(V, {
									className: "font-medium hover:underline",
									to: `/p/finance/journal${Z({
										month: d.month,
										category: e.category,
										corporation: s
									})}`,
									children: e.category
								}), e.entries > 0 && /* @__PURE__ */ z("span", {
									className: "ml-2 text-xs text-subtle",
									children: [M(e.entries), " entries"]
								})] }),
								/* @__PURE__ */ R(C, {
									numeric: !0,
									children: e.income ? j(e.income) : "—"
								}),
								/* @__PURE__ */ R(C, {
									numeric: !0,
									children: e.spending ? j(e.spending) : "—"
								}),
								/* @__PURE__ */ R(C, {
									numeric: !0,
									className: D("font-semibold", e.net < 0 && "text-danger-fg"),
									children: j(e.net, { sign: !0 })
								}),
								/* @__PURE__ */ R(C, {
									numeric: !0,
									className: "text-muted",
									children: j(e.previous_net, { sign: !0 })
								}),
								/* @__PURE__ */ R(C, {
									numeric: !0,
									children: /* @__PURE__ */ R(pe, {
										amount: e.net - e.previous_net,
										percent: null
									})
								})
							] }, e.category)) }),
							/* @__PURE__ */ R("tfoot", { children: /* @__PURE__ */ z("tr", {
								className: "font-semibold",
								children: [
									/* @__PURE__ */ R(C, { children: "Total" }),
									/* @__PURE__ */ R(C, {
										numeric: !0,
										children: j(d.totals.income)
									}),
									/* @__PURE__ */ R(C, {
										numeric: !0,
										children: j(d.totals.spending)
									}),
									/* @__PURE__ */ R(C, {
										numeric: !0,
										children: j(d.totals.net, { sign: !0 })
									}),
									/* @__PURE__ */ R(C, {
										numeric: !0,
										className: "text-muted",
										children: j(d.previous.net, { sign: !0 })
									}),
									/* @__PURE__ */ R(C, {
										numeric: !0,
										children: /* @__PURE__ */ R(pe, {
											amount: d.change.net.amount,
											percent: d.change.net.percent
										})
									})
								]
							}) })
						] })]
					}),
					/* @__PURE__ */ z("div", {
						className: "grid gap-6 lg:grid-cols-2",
						children: [/* @__PURE__ */ R(De, {
							title: "Top income from",
							rows: d.top_income,
							total: d.totals.income
						}), /* @__PURE__ */ R(De, {
							title: "Top spending to",
							rows: d.top_spending,
							total: d.totals.spending
						})]
					}),
					/* @__PURE__ */ z(i, {
						className: "finance-card",
						children: [/* @__PURE__ */ R(o, {
							title: "Corporations",
							description: "Wallet balances from the journal's running balances, at the start and end of the month"
						}), /* @__PURE__ */ z(x, { children: [/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("tr", { children: [
							/* @__PURE__ */ R(w, { children: "Corporation" }),
							/* @__PURE__ */ R(w, {
								align: "right",
								children: "Opening"
							}),
							/* @__PURE__ */ R(w, {
								align: "right",
								children: "Income"
							}),
							/* @__PURE__ */ R(w, {
								align: "right",
								children: "Spending"
							}),
							/* @__PURE__ */ R(w, {
								align: "right",
								children: "Net"
							}),
							/* @__PURE__ */ R(w, {
								align: "right",
								children: "Internal in / out"
							}),
							/* @__PURE__ */ R(w, {
								align: "right",
								children: "Closing"
							})
						] }) }), /* @__PURE__ */ R("tbody", { children: d.corporations.map((e) => /* @__PURE__ */ z(T, { children: [
							/* @__PURE__ */ z(C, { children: [
								e.name,
								" ",
								/* @__PURE__ */ z("span", {
									className: "text-subtle",
									children: [
										"[",
										e.ticker,
										"]"
									]
								})
							] }),
							/* @__PURE__ */ R(C, {
								numeric: !0,
								className: "text-muted",
								children: j(e.opening)
							}),
							/* @__PURE__ */ R(C, {
								numeric: !0,
								children: j(e.income)
							}),
							/* @__PURE__ */ R(C, {
								numeric: !0,
								children: j(e.spending)
							}),
							/* @__PURE__ */ R(C, {
								numeric: !0,
								className: D("font-semibold", e.net < 0 ? "text-danger-fg" : "text-success-fg"),
								children: j(e.net, { sign: !0 })
							}),
							/* @__PURE__ */ z(C, {
								numeric: !0,
								className: "text-subtle",
								children: [
									j(e.internal_in),
									" / ",
									j(e.internal_out)
								]
							}),
							/* @__PURE__ */ R(C, {
								numeric: !0,
								children: j(e.closing)
							})
						] }, e.id)) })] })]
					}),
					/* @__PURE__ */ z("p", {
						className: "text-xs text-subtle",
						children: [
							"Made ",
							k(d.generated_at),
							" from ",
							M(d.totals.entries),
							" wallet journal entries (EVE time months)."
						]
					})
				]
			})
		]
	});
}
function De({ title: e, rows: t, total: n }) {
	return /* @__PURE__ */ z(i, {
		className: "finance-card",
		children: [/* @__PURE__ */ R(o, {
			title: e,
			description: "Internal transfers left out"
		}), t.length === 0 ? /* @__PURE__ */ R("p", {
			className: "px-card pb-card text-sm text-muted",
			children: "Nobody this month."
		}) : /* @__PURE__ */ R(x, { children: /* @__PURE__ */ R("tbody", { children: t.map((e) => /* @__PURE__ */ z(T, { children: [/* @__PURE__ */ z(C, { children: [/* @__PURE__ */ R("div", {
			className: "font-medium",
			children: e.name
		}), /* @__PURE__ */ z("div", {
			className: "text-xs text-subtle",
			children: [
				e.categories.join(", "),
				" · ",
				M(e.entries),
				" entries"
			]
		})] }), /* @__PURE__ */ z(C, {
			numeric: !0,
			children: [j(e.amount), /* @__PURE__ */ R("div", {
				className: "text-xs text-subtle",
				children: n ? `${Math.round(e.amount / n * 100)} %` : ""
			})]
		})] }, e.id)) }) })]
	});
}
//#endregion
//#region src/settings.tsx
var Oe = ["finance", "settings"], ke = [
	{
		value: "out",
		label: "Paid to them"
	},
	{
		value: "in",
		label: "From them"
	},
	{
		value: "both",
		label: "Both ways"
	}
];
function $() {
	let e = I();
	return () => e.invalidateQueries({ queryKey: ["finance"] });
}
function Ae() {
	let { data: e, isLoading: t } = F({
		queryKey: Oe,
		queryFn: () => E.get(`${q}/settings`)
	});
	return /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(p, {
		eyebrow: "Corp finance",
		title: "Settings",
		icon: /* @__PURE__ */ R(G, {}),
		description: "Changes here apply to every corporation's figures, so they need access to all of their wallets; a tag for one corporation needs only that one."
	}), t || !e ? /* @__PURE__ */ R(_, { className: "h-64" }) : /* @__PURE__ */ z("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ R(je, { data: e }),
			/* @__PURE__ */ R(Me, { data: e }),
			/* @__PURE__ */ R(Pe, { data: e })
		]
	})] });
}
function je({ data: e }) {
	let t = I(), r = $(), [s, c] = B(e.corporations), [l, d] = B(e.report_group ? String(e.report_group) : ""), f = P({
		mutationFn: () => E.put(`${q}/settings`, {
			corporations: s,
			report_group: l ? Number(l) : null
		}),
		onSuccess: (e) => {
			t.setQueryData(Oe, e), r(), N.success("Saved");
		},
		onError: (e) => N.error(e.message)
	});
	return /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, { title: "Corporations and the monthly report" }), /* @__PURE__ */ z(a, {
		className: "grid gap-6 lg:grid-cols-2",
		children: [/* @__PURE__ */ R(u, {
			label: "Corporations that count",
			hint: "None picked means every corporation with synced wallets. Their transfers with each other are internal.",
			children: e.available_corporations.length === 0 ? /* @__PURE__ */ R("p", {
				className: "text-sm text-subtle",
				children: "No corporation has synced its wallets yet."
			}) : /* @__PURE__ */ R("div", {
				className: "divide-y divide-border rounded-lg border border-border",
				children: e.available_corporations.map((e) => /* @__PURE__ */ z("label", {
					className: "flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm",
					children: [/* @__PURE__ */ z("span", { children: [
						e.name,
						" ",
						/* @__PURE__ */ z("span", {
							className: "text-subtle",
							children: [
								"[",
								e.ticker,
								"]"
							]
						})
					] }), /* @__PURE__ */ R(y, {
						checked: s.includes(e.id),
						onCheckedChange: (t) => c(t ? [...s, e.id] : s.filter((t) => t !== e.id))
					})]
				}, e.id))
			})
		}), /* @__PURE__ */ z("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ R(u, {
				label: "Tell this group when a month's report is ready",
				hint: "Once a month ends and the wallets have synced past it. Only members with finance.view_finance are told, about the corporations they may see. The finance.month_closed webhook event goes out either way.",
				children: /* @__PURE__ */ R(g, {
					value: l,
					onChange: (e) => d(e.target.value),
					options: [{
						value: "",
						label: "Nobody"
					}, ...e.group_options.map((e) => ({
						value: String(e.id),
						label: e.name
					}))]
				})
			}), /* @__PURE__ */ R(n, {
				variant: "primary",
				loading: f.isPending,
				onClick: () => f.mutate(),
				children: "Save"
			})]
		})]
	})] });
}
function Me({ data: e }) {
	let r = $(), [a, c] = B(null), [u, d] = B(null), f = (t) => t ? e.available_corporations.find((e) => e.id === t)?.name ?? `#${t}` : "Every corporation";
	return /* @__PURE__ */ z(i, { children: [
		/* @__PURE__ */ R(o, {
			title: "Counterparty tags",
			description: "Money to or from someone goes in a category, whatever its ref type: \"paid to SRP Holder = SRP payouts\", \"from Buyback Corp = Buyback\".",
			actions: /* @__PURE__ */ z(n, {
				size: "sm",
				onClick: () => c("new"),
				children: [/* @__PURE__ */ R(ce, {}), " Add tag"]
			})
		}),
		e.rules.length === 0 ? /* @__PURE__ */ R(l, {
			icon: /* @__PURE__ */ R(G, {}),
			title: "No tags yet"
		}) : /* @__PURE__ */ z(x, { children: [/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("tr", { children: [
			/* @__PURE__ */ R(w, { children: "Who" }),
			/* @__PURE__ */ R(w, { children: "Money" }),
			/* @__PURE__ */ R(w, { children: "Category" }),
			/* @__PURE__ */ R(w, { children: "In" }),
			/* @__PURE__ */ R(w, {})
		] }) }), /* @__PURE__ */ R("tbody", { children: e.rules.map((e) => /* @__PURE__ */ z(T, { children: [
			/* @__PURE__ */ z(C, { children: [/* @__PURE__ */ R("div", {
				className: "font-medium",
				children: e.party_name
			}), e.note && /* @__PURE__ */ R("div", {
				className: "text-xs text-subtle",
				children: e.note
			})] }),
			/* @__PURE__ */ R(C, { children: ke.find((t) => t.value === e.direction)?.label }),
			/* @__PURE__ */ R(C, { children: /* @__PURE__ */ R(t, {
				tone: "accent",
				children: e.category
			}) }),
			/* @__PURE__ */ R(C, {
				className: "text-muted",
				children: f(e.corporation_id)
			}),
			/* @__PURE__ */ R(C, {
				align: "right",
				children: /* @__PURE__ */ z("div", {
					className: "flex justify-end gap-1",
					children: [/* @__PURE__ */ R(n, {
						size: "icon-sm",
						variant: "ghost",
						onClick: () => c(e),
						"aria-label": "Edit",
						children: /* @__PURE__ */ R(ue, {})
					}), /* @__PURE__ */ R(n, {
						size: "icon-sm",
						variant: "ghost",
						onClick: () => d(e),
						"aria-label": "Remove",
						children: /* @__PURE__ */ R(le, {})
					})]
				})
			})
		] }, e.id)) })] }),
		a && /* @__PURE__ */ R(Ne, {
			rule: a === "new" ? null : a,
			data: e,
			onClose: () => c(null)
		}),
		/* @__PURE__ */ R(s, {
			open: !!u,
			onOpenChange: (e) => !e && d(null),
			title: `Remove the tag for ${u?.party_name ?? ""}?`,
			description: "Their entries go back to the category of their ref type.",
			danger: !0,
			confirmLabel: "Remove",
			onConfirm: async () => {
				try {
					await E.delete(`${q}/rules/${u.id}`), r();
				} catch (e) {
					N.error(e.message);
				}
			}
		})
	] });
}
function Ne({ rule: e, data: t, onClose: r }) {
	let i = $(), [a, o] = B(e ? {
		id: e.party_id,
		name: e.party_name
	} : null), [s, l] = B(""), [f, p] = B(e?.direction ?? "out"), [_, v] = B(e?.category ?? ""), [y, b] = B(e?.corporation_id ? String(e.corporation_id) : ""), [x, S] = B(e?.note ?? ""), C = s.trim(), { data: w } = F({
		queryKey: [
			"finance",
			"parties",
			C
		],
		queryFn: () => E.get(`${q}/parties?q=${encodeURIComponent(C)}`),
		enabled: C.length >= 3 || /^\d+$/.test(C)
	}), T = P({
		mutationFn: () => {
			let t = {
				party_id: a?.id,
				party_name: a?.name,
				direction: f,
				category: _,
				corporation_id: y ? Number(y) : null,
				note: x
			};
			return e ? E.put(`${q}/rules/${e.id}`, t) : E.post(`${q}/rules`, t);
		},
		onSuccess: () => {
			i(), r();
		},
		onError: (e) => N.error(e.message)
	});
	return /* @__PURE__ */ R(c, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: e ? "Edit tag" : "Tag a counterparty",
		size: "md",
		footer: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(n, {
			variant: "ghost",
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ R(n, {
			variant: "primary",
			loading: T.isPending,
			disabled: !a || !_.trim(),
			onClick: () => T.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ z("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ R(u, {
					label: "Who",
					hint: "A character, corporation or alliance from the wallet journals, by name or id.",
					children: a ? /* @__PURE__ */ z("div", {
						className: "flex items-center justify-between rounded-control border border-border px-3 py-2 text-sm",
						children: [/* @__PURE__ */ R("span", {
							className: "font-medium",
							children: a.name
						}), /* @__PURE__ */ R(n, {
							size: "icon-sm",
							variant: "ghost",
							onClick: () => o(null),
							"aria-label": "Pick someone else",
							children: /* @__PURE__ */ R(de, {})
						})]
					}) : /* @__PURE__ */ z("div", {
						className: "relative",
						children: [/* @__PURE__ */ R(m, {
							value: s,
							onChange: (e) => l(e.target.value),
							placeholder: "Name or id",
							autoFocus: !0
						}), w && C && /* @__PURE__ */ z("ul", {
							className: "absolute z-20 mt-1 max-h-64 w-full overflow-y-auto border border-border-strong bg-surface-raised shadow-e3",
							children: [w.length === 0 && /* @__PURE__ */ R("li", {
								className: "px-3 py-2 text-sm text-subtle",
								children: "Nobody found"
							}), w.map((e) => /* @__PURE__ */ R("li", { children: /* @__PURE__ */ z("button", {
								type: "button",
								className: "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-hover",
								onClick: () => {
									o(e), l("");
								},
								children: [/* @__PURE__ */ R("span", {
									className: "truncate font-medium",
									children: e.name
								}), /* @__PURE__ */ R("span", {
									className: "text-xs text-subtle",
									children: e.category
								})]
							}) }, e.id))]
						})]
					})
				}),
				/* @__PURE__ */ R(u, {
					label: "Money",
					children: /* @__PURE__ */ R(h, {
						value: f,
						onChange: p,
						options: ke,
						"aria-label": "Direction",
						size: "sm"
					})
				}),
				/* @__PURE__ */ z(u, {
					label: "Category",
					hint: "Pick one or type a new one, like SRP payouts.",
					children: [/* @__PURE__ */ R(d, {
						value: _,
						onChange: (e) => v(e.target.value),
						list: "finance-categories",
						maxLength: 60
					}), /* @__PURE__ */ R("datalist", {
						id: "finance-categories",
						children: t.categories.map((e) => /* @__PURE__ */ R("option", { value: e }, e))
					})]
				}),
				/* @__PURE__ */ R(u, {
					label: "In the wallets of",
					children: /* @__PURE__ */ R(g, {
						value: y,
						onChange: (e) => b(e.target.value),
						options: [{
							value: "",
							label: "Every corporation"
						}, ...t.available_corporations.map((e) => ({
							value: String(e.id),
							label: e.name
						}))]
					})
				}),
				/* @__PURE__ */ R(u, {
					label: "Note",
					children: /* @__PURE__ */ R(d, {
						value: x,
						onChange: (e) => S(e.target.value),
						maxLength: 200
					})
				})
			]
		})
	});
}
function Pe({ data: e }) {
	let [t, n] = B(!1), [r, a] = B(""), s = e.ref_types.filter((e) => (t || e.seen || e.override) && (!r || e.ref_type.includes(r.toLowerCase().replace(/ /g, "_"))));
	return /* @__PURE__ */ z(i, { children: [
		/* @__PURE__ */ R(o, {
			title: "Ref type categories",
			description: `Which category each kind of journal entry counts under. ${e.internal_label} are found by themselves: moves between a corporation's divisions, and donations and withdrawals between your corporations.`,
			actions: /* @__PURE__ */ z("label", {
				className: "flex items-center gap-2 text-sm text-muted",
				children: [/* @__PURE__ */ R(y, {
					checked: t,
					onCheckedChange: n
				}), " Show ones not in your journals"]
			})
		}),
		/* @__PURE__ */ R("div", {
			className: "px-card pb-3",
			children: /* @__PURE__ */ R(m, {
				value: r,
				onChange: (e) => a(e.target.value),
				placeholder: "Find a ref type",
				className: "max-w-xs"
			})
		}),
		/* @__PURE__ */ z(x, { children: [/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("tr", { children: [
			/* @__PURE__ */ R(w, { children: "Ref type" }),
			/* @__PURE__ */ R(w, { children: "Built in" }),
			/* @__PURE__ */ R(w, { children: "Counts as" })
		] }) }), /* @__PURE__ */ R("tbody", { children: s.map((e) => /* @__PURE__ */ R(Fe, { row: e }, e.ref_type)) })] }),
		/* @__PURE__ */ R("datalist", {
			id: "finance-categories-all",
			children: e.categories.map((e) => /* @__PURE__ */ R("option", { value: e }, e))
		})
	] });
}
function Fe({ row: e }) {
	let t = $(), r = e.override ?? e.default, [i, a] = B(r), o = P({
		mutationFn: (t) => E.put(`${q}/categories/${encodeURIComponent(e.ref_type)}`, { category: t }),
		onSuccess: () => t(),
		onError: (e) => {
			N.error(e.message), a(r);
		}
	}), s = i.trim() !== r;
	return /* @__PURE__ */ z(T, { children: [
		/* @__PURE__ */ z(C, { children: [/* @__PURE__ */ R("div", {
			className: "font-medium",
			children: e.label
		}), /* @__PURE__ */ R("div", {
			className: "font-mono text-xs text-subtle",
			children: e.ref_type
		})] }),
		/* @__PURE__ */ R(C, {
			className: "text-muted",
			children: e.default
		}),
		/* @__PURE__ */ R(C, { children: /* @__PURE__ */ z("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ R(d, {
					value: i,
					onChange: (e) => a(e.target.value),
					list: "finance-categories-all",
					className: "w-56",
					maxLength: 60,
					onKeyDown: (e) => e.key === "Enter" && s && o.mutate(i.trim())
				}),
				s && /* @__PURE__ */ R(n, {
					size: "sm",
					loading: o.isPending,
					onClick: () => o.mutate(i.trim()),
					children: "Save"
				}),
				e.override && !s && /* @__PURE__ */ R(n, {
					size: "sm",
					variant: "ghost",
					loading: o.isPending,
					onClick: () => {
						a(e.default), o.mutate("");
					},
					children: "Reset"
				})
			]
		}) })
	] });
}
//#endregion
//#region src/index.tsx
var Ie = A({
	routes: [
		{
			path: "",
			Component: Ce
		},
		{
			path: "report",
			Component: Ee
		},
		{
			path: "balances",
			Component: ye
		},
		{
			path: "journal",
			Component: xe
		},
		{
			path: "settings",
			Component: Ae
		}
	],
	widgets: [{
		id: "net",
		title: "Corp finance",
		Component: we,
		size: "sm",
		order: 46,
		permission: "finance.view_finance"
	}]
});
//#endregion
export { Ie as default };

export const classes = ["!closedOnly","!data","!dirty","!o","--border","--border-strong","--danger","--success","--surface","--text","-bottom","-translate-x-1/2","@conduit/sdk","@media","@page","@tanstack/react-query","a","about","above","absolute","accent","access","actions","address","after","against","align","all","alliance","allowAll","allowed","amount","an","and","apply","are","aria-label","as","asked","at","auto","autoFocus","available_corporations","await","away","back","background","balance","balances","bar","barW","base","be","below","between","bg-surface-raised","bg-text","biggest","black","block","body","boolean","border","border-border","border-border-strong","border-color","both","bottom","box","box-shadow","break-inside","but","button","by","c","came","can","can_manage","cancel","catch","categories","category","change","checked","children","className","closedOnly","closing","color","coloured","column","comes","complete","confirmLabel","const","corp","corpName","corporation","corporation_id","corporations","corps","count","counted","counterparty","counterparty_id","counts","coverage","current","currentColor","cursor-pointer","d","danger","data","date","days","default","definePlugin","delta","deltaFormat","deltaLabel","description","dim","direction","dirty","disabled","display","divide-border","divide-y","division","divisions","does","donations","dy","each","earned","either","el","else","en","en-GB","enabled","end","ends","entries","entry","error","event","every","everything","export","extends","eyebrow","false","far","few","figures","fill","fill-muted","filtered","finance","finance-card","finance-categories","finance-categories-all","finance-no-print","finance-report","finances","finished","flex","flex-1","flex-wrap","font-medium","font-mono","font-sans","font-semibold","footer","for","format","found","frame","from","full","function","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-6","gap-x-4","gap-y-0.5","generated_at","get","gets","ghost","go","goes","good","grid","grid-cols-[auto_auto]","group","group_options","h","h-16","h-28","h-48","h-64","h-72","has","have","height","here","hidden","hide","hint","hits","hover","hover:bg-hover","hover:underline","href","i","icon","icon-sm","icons","id","if","img","import","in","included","income","income-against-spending","info","inline","inline-flex","inset","interactive","interface","internal","internal_in","internal_label","internal_out","invalidate","invert","is","isLoading","isn","it","items-center","its","journal","journals","justify-between","justify-end","kept","key","kind","l","label","last","leave","left","length","lg:grid-cols-2","like","limit","line","link","linked","list","loading","long","m","m-card","m15","m16","m6","m7","m8","mag","main","manage_finance","margin","max","max-h-64","max-w-72","max-w-xs","maxLength","maximumFractionDigits","may","mb-1","md","means","members","meta","middle","min-w-0","ml-2","mo","money","mono","month","monthLabel","monthParam","month_closed","monthly","months","moved","moves","mt-1","mutationFn","name","navigate","need","needs","net","new","newest","next","no","none","not","note","notification","now","null","number","numeric","observer","of","oldest","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onKeyDown","onOpenChange","onPick","onPointerEnter","onPointerLeave","onSuccess","one","ones","only","opacity","open","opening","options","or","order","other","out","over","overflow-y-auto","override","overview","own","pad","page","pages","paid","params","parties","party_id","party_name","past","path","payees","payers","payouts","pb-3","pb-card","per","percent","permission","picked","pickers","placeholder","plain","plotH","plotW","pointer-events-none","position","positive","previous","previous_income","previous_label","previous_net","previous_spending","primary","print","put","px-2.5","px-3","px-card","py-1.5","py-2","py-2.5","q","qc","queryFn","queryKey","r","range","react","react-router","readonly","reads","ready","reason","rebuilt","records","ref","ref_type","ref_type_label","ref_types","refetchInterval","relative","replace","report","report_group","reported","rest","return","right","role","rotate-45","round","rounded-control","rounded-lg","rounded-sm","routes","row","rows","rule","rules","running","rx","s","save","search","see","seen","select-none","series","set","setAll","setCategory","setCorp","setCorporation","setCorps","setDeleting","setDirection","setEditing","setGroup","setHover","setInternal","setMonth","setNote","setParams","setParty","setQ","setRange","setValue","setWidth","settings","several","shadow-e3","sheet","short","show","sign","since","site","size","size-2","size-2.5","size-4","slot","sm","sm:grid-cols-2","sm:grid-cols-3","sm:grid-cols-4","so","someone","space-y-1.5","space-y-3","space-y-4","space-y-6","span","spending","spent","start","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","styles","success","summary","synced","t","tabular-nums","tag","tags","text-3xl","text-[11px]","text-danger-fg","text-left","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-text","text-xs","textAnchor","that","the","their","them","themselves","these","they","this","thisMonth","this_month","ticker","ticks","time","timeZone","title","to","tone","top","top-0","top_income","top_spending","total","total_income","total_spending","totals","transfers","transform","transparent","true","truncate","truncated","try","type","under","underline","unless","useNavigate","useParam","useQuery","useQueryClient","useRef","useSearchParams","useState","used","v","value","variant","view","viewBox","view_finance","visibility","visible","void","vs","w-52","w-56","w-64","w-72","w-full","wallet","wallets","warning","was","ways","webhook","whatever","when","where","whether","which","whitespace-nowrap","who","widgets","width","with","withdrawals","without","x","x1","x2","xl:grid-cols-4","y","y1","y2","year","yes","yet","you","your","z-10","z-20"];
