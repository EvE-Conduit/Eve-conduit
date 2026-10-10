import { Badge as e, BarChart as t, Button as n, Callout as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, DataTable as c, Dialog as l, EmptyState as u, Field as d, Input as f, PageHeader as p, SearchInput as m, SectionTitle as h, Segmented as ee, Select as g, Skeleton as _, Spinner as v, StatCard as y, Switch as b, SwitchRow as x, THead as S, TabPanel as C, Table as te, Tabs as ne, Td as w, Textarea as re, Th as T, Tooltip as E, Tr as ie, api as D, buttonVariants as O, cn as k, dateTime as A, definePlugin as ae, isk as j, num as M, timeAgo as oe, toast as N, useHasPerm as se } from "@conduit/sdk";
import { useMutation as P, useQuery as F, useQueryClient as ce } from "@tanstack/react-query";
import { useState as I } from "react";
import { Link as L, useNavigate as le, useParams as R } from "react-router";
import { Fragment as z, jsx as B, jsxs as V } from "react/jsx-runtime";
//#region src/icons.tsx
function H({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ B("svg", {
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
var U = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("circle", {
			cx: "8",
			cy: "21",
			r: "1"
		}),
		/* @__PURE__ */ B("circle", {
			cx: "19",
			cy: "21",
			r: "1"
		}),
		/* @__PURE__ */ B("path", { d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" })
	]
}), ue = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ B("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), de = (e) => /* @__PURE__ */ B(H, {
	...e,
	children: /* @__PURE__ */ B("path", { d: "M20 6 9 17l-5-5" })
}), fe = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }),
		/* @__PURE__ */ B("path", { d: "M12 9v4" }),
		/* @__PURE__ */ B("path", { d: "M12 17h.01" })
	]
}), W = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" }), /* @__PURE__ */ B("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), pe = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M5 12h14" }), /* @__PURE__ */ B("path", { d: "M12 5v14" })]
}), me = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M3 6h18" }),
		/* @__PURE__ */ B("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ B("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), he = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ B("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), ge = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ B("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ B("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ B("path", { d: "M8 16H3v5" })
	]
}), _e = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0" }), /* @__PURE__ */ B("circle", {
		cx: "12",
		cy: "10",
		r: "3"
	})]
}), ve = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ B("path", { d: "M19 12H5" })]
}), ye = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" }), /* @__PURE__ */ B("path", { d: "m15 5 4 4" })]
}), be = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("circle", {
			cx: "8",
			cy: "8",
			r: "6"
		}),
		/* @__PURE__ */ B("path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18" }),
		/* @__PURE__ */ B("path", { d: "M7 6h1v4" }),
		/* @__PURE__ */ B("path", { d: "m16.71 13.88.7.71-2.82 2.82" })
	]
}), xe = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z" }), /* @__PURE__ */ B("circle", {
		cx: "7.5",
		cy: "7.5",
		r: ".5",
		fill: "currentColor"
	})]
}), Se = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}),
		/* @__PURE__ */ B("path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }),
		/* @__PURE__ */ B("path", { d: "M2 12h20" })
	]
}), G = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" }),
		/* @__PURE__ */ B("path", { d: "M12 22V12" }),
		/* @__PURE__ */ B("path", { d: "m3.3 7 8.7 5 8.7-5" })
	]
}), Ce = (e) => /* @__PURE__ */ B(H, {
	...e,
	children: /* @__PURE__ */ B("path", { d: "m9 18 6-6-6-6" })
}), K = (e) => /* @__PURE__ */ B(H, {
	...e,
	children: /* @__PURE__ */ B("path", { d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" })
}), we = (e) => /* @__PURE__ */ B(H, {
	...e,
	children: /* @__PURE__ */ B("path", { d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" })
}), q = "/api/p/buyback", Te = "/api/public/p/buyback", Ee = {
	market: "Market",
	raw: "Raw ore",
	compressed: "Compressed",
	refined: "Refined",
	t1_refined: "Reprocessed",
	npc: "NPC buy",
	fixed: "Fixed price"
};
//#endregion
//#region src/shared.tsx
function De({ value: e, label: t = "Copy" }) {
	let [r, i] = I(!1);
	return /* @__PURE__ */ V(n, {
		size: "xs",
		variant: "ghost",
		"aria-label": `${t}: ${e}`,
		onClick: () => {
			navigator.clipboard.writeText(e).then(() => {
				i(!0), setTimeout(() => i(!1), 1500);
			}, () => N.error("Couldn't copy; select it and copy by hand"));
		},
		children: [
			B(r ? de : ue, {}),
			" ",
			r ? "Copied" : t
		]
	});
}
function Oe({ system: e }) {
	if (!e) return null;
	let t = e.security >= .5 ? "text-success-fg" : e.security > 0 ? "text-warning-fg" : "text-danger-fg";
	return /* @__PURE__ */ V("span", {
		className: "text-muted",
		children: [
			e.name,
			" ",
			/* @__PURE__ */ B("span", {
				className: k("font-mono text-xs", t),
				children: e.security.toFixed(1)
			}),
			/* @__PURE__ */ V("span", {
				className: "text-subtle",
				children: [" · ", e.region]
			})
		]
	});
}
function J({ icon: e, name: t, sub: n }) {
	return /* @__PURE__ */ V("div", {
		className: "flex min-w-0 items-center gap-2.5",
		children: [e ? /* @__PURE__ */ B("img", {
			src: e,
			alt: "",
			className: "size-8 shrink-0 border border-border bg-bg",
			loading: "lazy"
		}) : /* @__PURE__ */ B("div", { className: "size-8 shrink-0 border border-border bg-bg" }), /* @__PURE__ */ V("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ B("div", {
				className: "truncate font-medium",
				children: t
			}), n && /* @__PURE__ */ B("div", {
				className: "truncate text-xs text-subtle",
				children: n
			})]
		})]
	});
}
var ke = {
	quoted: "neutral",
	outstanding: "accent",
	in_progress: "accent",
	finished: "success",
	finished_issuer: "success",
	finished_contractor: "success",
	rejected: "danger",
	deleted: "neutral",
	expired: "warning",
	failed: "danger",
	reversed: "warning"
};
function Ae({ status: t, label: n }) {
	return /* @__PURE__ */ B(e, {
		tone: ke[t] ?? "neutral",
		children: n ?? (t === "quoted" ? "No contract yet" : t)
	});
}
function je({ problems: t, compact: n }) {
	if (!t.length) return n ? /* @__PURE__ */ B(e, {
		tone: "success",
		children: "Matches its quote"
	}) : null;
	if (n) {
		let n = t.filter((e) => e.severe).length;
		return /* @__PURE__ */ B(E, {
			content: t.map((e) => e.text).join(" "),
			children: /* @__PURE__ */ B("span", { children: /* @__PURE__ */ B(e, {
				tone: n ? "danger" : "warning",
				children: n ? `${n} problem${n === 1 ? "" : "s"}` : `${t.length} note${t.length === 1 ? "" : "s"}`
			}) })
		});
	}
	return /* @__PURE__ */ B("ul", {
		className: "space-y-2",
		children: t.map((e) => /* @__PURE__ */ V("li", {
			className: k("flex items-start gap-2.5 border px-3 py-2 text-sm", e.severe ? "border-danger/40 bg-danger-soft text-danger-fg" : "border-warning/40 bg-warning-soft text-warning-fg"),
			children: [/* @__PURE__ */ B(fe, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ B("span", { children: e.text })]
		}, e.code))
	});
}
var Y = (e) => `${Number.isInteger(e) ? e : e.toFixed(2)}%`;
function Me({ program: e }) {
	let t = [
		e.use_raw && "raw",
		e.use_compressed && "compressed",
		e.use_refined && `refined at ${Y(e.refining_rate)}`
	].filter(Boolean), n = [
		/* @__PURE__ */ V(z, { children: [
			e.prices.hub,
			" ",
			e.price_type === "split" ? "split" : e.price_type === "sell" ? "sell" : "buy",
			" price, less ",
			Y(e.tax)
		] }),
		e.allow_all_items ? "Buys any item" : "Only listed items",
		t.length ? /* @__PURE__ */ V(z, { children: ["Ore & ice: best of ", t.join(", ")] }) : null,
		e.hauling_fuel_cost > 0 ? /* @__PURE__ */ V(z, { children: [
			"Hauling ",
			j(e.hauling_fuel_cost, { full: !0 }),
			"/m³",
			e.compressed_volume ? " (compressed volume)" : ""
		] }) : null,
		e.price_density_threshold > 0 ? /* @__PURE__ */ V(z, { children: [
			"+",
			Y(e.price_density_tax),
			" under ",
			j(e.price_density_threshold),
			"/m³"
		] }) : null,
		e.t1_refined ? /* @__PURE__ */ V(z, { children: [
			"Tech I modules at ",
			Y(e.t1_refining_rate),
			" reprocessed"
		] }) : null,
		e.blue_loot_npc || e.red_loot_npc ? /* @__PURE__ */ V(z, { children: [[e.blue_loot_npc && "Sleeper", e.red_loot_npc && "Triglavian"].filter(Boolean).join(" and "), " loot at NPC price"] }) : null,
		e.allow_unpacked ? "Takes assembled items" : "Packaged items only"
	].filter(Boolean);
	return /* @__PURE__ */ B("ul", {
		className: "flex flex-wrap gap-1.5",
		children: n.map((e, t) => /* @__PURE__ */ B("li", {
			className: "border border-border bg-surface-2 px-2 py-1 text-xs text-muted",
			children: e
		}, t))
	});
}
function Ne({ terms: e }) {
	return /* @__PURE__ */ B("ul", {
		className: "space-y-1",
		children: e.locations.map((e) => /* @__PURE__ */ V("li", {
			className: "flex items-start gap-2 text-sm",
			children: [/* @__PURE__ */ B(_e, { className: "mt-0.5 size-3.5 shrink-0 text-subtle" }), /* @__PURE__ */ V("span", { children: [
				/* @__PURE__ */ B("span", {
					className: "font-medium",
					children: e.name
				}),
				" ",
				/* @__PURE__ */ B(Oe, { system: e.system })
			] })]
		}, e.id))
	});
}
function Pe({ guard: t }) {
	if (!t || t.used === "current") return null;
	if (t.used === "materials") return /* @__PURE__ */ B(E, {
		content: `${t.materials} of the minerals it refines into were priced far above their recent average, so their average was used.`,
		children: /* @__PURE__ */ B("span", { children: /* @__PURE__ */ B(e, {
			tone: "info",
			className: "ml-1.5",
			children: "averaged"
		}) })
	});
	let n = t.deviation == null ? "" : `${t.deviation > 0 ? "+" : ""}${t.deviation}%`, r = t.used === "average" ? `The market says ${j(t.current, { full: !0 })}, ${n} off what it traded for lately (${j(t.average, { full: !0 })}). It trades often enough to trust that average, so it's used instead.` : `The market says ${j(t.current, { full: !0 })}, ${n} off what it traded for lately (${j(t.average, { full: !0 })}), and it rarely trades (${t.days_traded} day${t.days_traded === 1 ? "" : "s"} lately). The lower price is used and a manager checks it by hand.`;
	return /* @__PURE__ */ B(E, {
		content: r,
		children: /* @__PURE__ */ B("span", { children: /* @__PURE__ */ B(e, {
			tone: t.used === "average" ? "info" : "warning",
			className: "ml-1.5",
			children: t.used === "average" ? "recent average" : "unusual price"
		}) })
	});
}
function Fe({ line: e }) {
	let t = [`${Ee[e.method ?? "market"]} ${j(e.market_unit, { full: !0 })}`, `less ${Y(e.tax)}${e.density_tax ? " (incl. low value per m³)" : ""}`];
	e.hauling_unit > 0 && t.push(`less ${j(e.hauling_unit, { full: !0 })} hauling`);
	let n = Object.entries(e.options).filter(([t]) => t !== e.method);
	return n.length && t.push(`(${n.map(([e, t]) => `${Ee[e]} ${j(t, { full: !0 })}`).join(", ")})`), /* @__PURE__ */ B(z, { children: t.join(", ") });
}
function Ie({ lines: t }) {
	return /* @__PURE__ */ B("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ V(te, { children: [/* @__PURE__ */ B(S, { children: /* @__PURE__ */ V("tr", { children: [
			/* @__PURE__ */ B(T, { children: "Item" }),
			/* @__PURE__ */ B(T, {
				align: "right",
				children: "Quantity"
			}),
			/* @__PURE__ */ B(T, { children: "Valued as" }),
			/* @__PURE__ */ B(T, {
				align: "right",
				children: "Per unit"
			}),
			/* @__PURE__ */ B(T, {
				align: "right",
				children: "Value"
			})
		] }) }), /* @__PURE__ */ B("tbody", { children: t.map((t) => /* @__PURE__ */ V(ie, {
			className: k(!t.accepted && "opacity-60"),
			children: [
				/* @__PURE__ */ B(w, { children: /* @__PURE__ */ B(J, {
					icon: t.icon,
					name: t.name,
					sub: t.watch ? /* @__PURE__ */ V("span", {
						className: "inline-flex items-center gap-1 text-info-fg",
						children: [/* @__PURE__ */ B(W, { className: "size-3" }), " Checked by hand before it's accepted"]
					}) : t.group
				}) }),
				/* @__PURE__ */ B(w, {
					numeric: !0,
					children: M(t.quantity)
				}),
				/* @__PURE__ */ B(w, { children: t.accepted ? /* @__PURE__ */ V("span", {
					className: "text-sm",
					children: [
						Ee[t.method ?? "market"],
						t.method !== "fixed" && /* @__PURE__ */ V("span", {
							className: "text-subtle",
							children: [" · −", Y(t.tax)]
						}),
						t.density_tax && /* @__PURE__ */ B(e, {
							tone: "warning",
							className: "ml-1.5",
							children: "low ISK/m³"
						}),
						/* @__PURE__ */ B(Pe, { guard: t.guard })
					]
				}) : /* @__PURE__ */ B(e, {
					tone: "danger",
					children: t.reason
				}) }),
				/* @__PURE__ */ B(w, {
					numeric: !0,
					children: t.accepted ? /* @__PURE__ */ B(E, {
						content: /* @__PURE__ */ B(Fe, { line: t }),
						children: /* @__PURE__ */ B("span", {
							className: "cursor-help underline decoration-dotted decoration-border-strong underline-offset-4",
							children: j(t.unit_price, { full: !0 })
						})
					}) : "—"
				}),
				/* @__PURE__ */ B(w, {
					numeric: !0,
					className: "font-medium",
					children: t.accepted ? j(t.value, { full: !0 }) : "—"
				})
			]
		}, t.type_id)) })] })
	});
}
function Le({ n: e, title: t, children: n }) {
	return /* @__PURE__ */ V("li", {
		className: "grid grid-cols-[28px_1fr] gap-3",
		children: [/* @__PURE__ */ B("span", {
			className: "grid size-7 place-items-center border border-border-strong font-mono text-xs text-accent-ink",
			children: e
		}), /* @__PURE__ */ V("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ B("div", {
				className: "hud-label text-subtle",
				children: t
			}), /* @__PURE__ */ B("div", {
				className: "mt-1",
				children: n
			})]
		})]
	});
}
function Re({ quote: t }) {
	let n = t.terms, r = String(Math.floor(t.value));
	return /* @__PURE__ */ V("div", {
		className: "panel border-accent/40 p-5",
		children: [/* @__PURE__ */ V("div", {
			className: "flex flex-wrap items-end justify-between gap-4",
			children: [/* @__PURE__ */ V("div", { children: [
				/* @__PURE__ */ B("div", {
					className: "hud-label text-subtle",
					children: "You get"
				}),
				/* @__PURE__ */ B("div", {
					className: "mt-1 font-mono text-[34px] font-semibold leading-none tabular-nums text-accent-ink",
					children: j(t.value, { full: !0 })
				}),
				/* @__PURE__ */ V("div", {
					className: "mt-1.5 text-xs text-muted",
					children: [
						t.items,
						" item",
						t.items === 1 ? "" : "s",
						" · ",
						M(t.volume),
						" m³",
						t.hub && /* @__PURE__ */ V(z, { children: [" · priced at ", t.hub] })
					]
				})
			] }), t.flagged && /* @__PURE__ */ V(e, {
				tone: "info",
				children: [/* @__PURE__ */ B(W, { className: "size-3" }), " Some items are checked by hand"]
			})]
		}), /* @__PURE__ */ V("ol", {
			className: "mt-6 space-y-4",
			children: [
				/* @__PURE__ */ B(Le, {
					n: 1,
					title: "Item exchange contract, private, to",
					children: /* @__PURE__ */ V("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ B("span", {
								className: "font-medium",
								children: n.assignee.name || "—"
							}),
							/* @__PURE__ */ V("span", {
								className: "text-xs text-subtle",
								children: [
									"(",
									n.assignee.kind,
									")"
								]
							}),
							n.assignee.name && /* @__PURE__ */ B(De, { value: n.assignee.name })
						]
					})
				}),
				/* @__PURE__ */ B(Le, {
					n: 2,
					title: n.locations.length === 1 ? "Made at" : "Made at one of",
					children: /* @__PURE__ */ B(Ne, { terms: n })
				}),
				/* @__PURE__ */ B(Le, {
					n: 3,
					title: "I will receive",
					children: /* @__PURE__ */ V("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ V("span", {
							className: "font-mono font-medium tabular-nums",
							children: [Number(r).toLocaleString("en"), " ISK"]
						}), /* @__PURE__ */ B(De, { value: r })]
					})
				}),
				/* @__PURE__ */ B(Le, {
					n: 4,
					title: "Description (exactly this, nothing else)",
					children: /* @__PURE__ */ V("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ B("code", {
							className: "border border-border bg-bg px-2 py-1 font-mono text-sm text-text",
							children: t.tracking_number
						}), /* @__PURE__ */ B(De, { value: t.tracking_number })]
					})
				}),
				/* @__PURE__ */ B(Le, {
					n: 5,
					title: "Expiration",
					children: /* @__PURE__ */ V("span", {
						className: "text-sm",
						children: [
							n.expiration_days,
							" day",
							n.expiration_days === 1 ? "" : "s"
						]
					})
				})
			]
		})]
	});
}
function ze({ program: e, base: t, quoteLink: i }) {
	let [a, o] = I(""), s = P({
		mutationFn: () => D.post(`${t}/programs/${e.id}/quote`, { text: a }),
		onError: (e) => N.error(e.message)
	}), c = s.data;
	return /* @__PURE__ */ V("div", {
		className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]",
		children: [/* @__PURE__ */ V("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ V("div", {
				className: "panel p-4",
				children: [
					/* @__PURE__ */ B("label", {
						htmlFor: "bb-paste",
						className: "hud-label text-subtle",
						children: "Items to sell"
					}),
					/* @__PURE__ */ B(re, {
						id: "bb-paste",
						rows: c ? 5 : 12,
						value: a,
						onChange: (e) => o(e.target.value),
						placeholder: "Select items in your inventory, Ctrl+C, and paste here.\nOr type them: Tritanium x 1000",
						className: "mt-2 font-mono text-xs"
					}),
					/* @__PURE__ */ V("div", {
						className: "mt-3 flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ B("p", {
							className: "text-xs text-subtle",
							children: "The list view of your inventory, contracts, the mining ledger and typed lines all work."
						}), /* @__PURE__ */ B(n, {
							variant: "primary",
							loading: s.isPending,
							disabled: !a.trim(),
							onClick: () => s.mutate(),
							children: "Get a quote"
						})]
					})
				]
			}), c && /* @__PURE__ */ V("div", {
				className: "panel",
				children: [c.unknown.length > 0 && /* @__PURE__ */ V(r, {
					tone: "warning",
					className: "m-4",
					title: `Not recognised (${c.unknown.length})`,
					children: [c.unknown.slice(0, 20).join(", "), c.unknown.length > 20 && "…"]
				}), c.lines.length > 0 ? /* @__PURE__ */ B(Ie, { lines: c.lines }) : /* @__PURE__ */ B("p", {
					className: "p-6 text-center text-sm text-muted",
					children: "No items recognised."
				})]
			})]
		}), /* @__PURE__ */ B("div", {
			className: "space-y-4",
			children: c?.quote ? /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(Re, { quote: c.quote }), /* @__PURE__ */ V("p", {
				className: "text-xs text-subtle",
				children: [
					"The contract is checked against this quote when it arrives.",
					" ",
					/* @__PURE__ */ B(L, {
						to: i(c.quote.tracking_number),
						className: "text-accent-ink hover:underline",
						children: "Follow it here"
					}),
					c.rejected_count > 0 && /* @__PURE__ */ V(z, { children: [
						" · ",
						c.rejected_count,
						" item",
						c.rejected_count === 1 ? " isn't" : "s aren't",
						" bought; leave them out of the contract."
					] })
				]
			})] }) : c ? /* @__PURE__ */ B(r, {
				tone: "danger",
				title: "Nothing to contract",
				children: c.blocked ?? "This program doesn't buy any of these items."
			}) : /* @__PURE__ */ V("div", {
				className: "panel space-y-4 p-5",
				children: [
					/* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("div", {
						className: "hud-label text-subtle",
						children: "How it's priced"
					}), /* @__PURE__ */ B("div", {
						className: "mt-2",
						children: /* @__PURE__ */ B(Me, { program: e })
					})] }),
					/* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("div", {
						className: "hud-label text-subtle",
						children: "Contracts go to"
					}), /* @__PURE__ */ B("div", {
						className: "mt-1 text-sm font-medium",
						children: e.terms.assignee.name || "—"
					})] }),
					/* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("div", {
						className: "hud-label text-subtle",
						children: "At"
					}), /* @__PURE__ */ B("div", {
						className: "mt-1",
						children: /* @__PURE__ */ B(Ne, { terms: e.terms })
					})] }),
					e.item_rules.length + e.group_rules.length > 0 && /* @__PURE__ */ B(Ve, { program: e })
				]
			})
		})]
	});
}
function Be({ terms: t, inherited: n }) {
	let r = n ? "opacity-60" : "";
	return t.disallowed ? /* @__PURE__ */ B(e, {
		tone: "danger",
		className: r,
		children: "not bought"
	}) : t.static_price == null ? t.tax ? /* @__PURE__ */ V("span", {
		className: `font-mono text-xs text-muted ${r}`,
		children: [
			t.tax > 0 ? "+" : "",
			Y(t.tax),
			" tax"
		]
	}) : /* @__PURE__ */ B("span", {
		className: `text-xs text-muted ${r}`,
		children: "standard"
	}) : /* @__PURE__ */ B("span", {
		className: `font-mono text-xs ${r}`,
		children: j(t.static_price, { full: !0 })
	});
}
function Ve({ program: e }) {
	let [t, n] = I(!1), r = [...e.group_rules.map((e) => ({
		key: `g${e.market_group_id}`,
		terms: e,
		cell: /* @__PURE__ */ B(J, {
			icon: null,
			name: e.name,
			sub: `Category · ${e.count} items`
		})
	})), ...e.item_rules.map((e) => ({
		key: `t${e.type_id}`,
		terms: e,
		cell: /* @__PURE__ */ B(J, {
			icon: e.icon,
			name: e.name
		})
	}))], i = t ? r : r.slice(0, 6);
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B("div", {
			className: "hud-label text-subtle",
			children: e.allow_all_items ? "Items with their own terms" : "Items it buys"
		}),
		/* @__PURE__ */ B("ul", {
			className: "mt-2 divide-y divide-border border border-border",
			children: i.map((e) => /* @__PURE__ */ V("li", {
				className: "flex items-center justify-between gap-3 px-2.5 py-1.5 text-sm",
				children: [e.cell, /* @__PURE__ */ B("span", {
					className: "shrink-0",
					children: /* @__PURE__ */ B(Be, { terms: e.terms })
				})]
			}, e.key))
		}),
		r.length > 6 && /* @__PURE__ */ B("button", {
			className: "mt-2 text-xs text-accent-ink hover:underline",
			onClick: () => n(!t),
			children: t ? "Show fewer" : `Show all ${r.length}`
		})
	] });
}
function He({ lines: t, items: n }) {
	let r = /* @__PURE__ */ new Map();
	for (let e of t) e.accepted && r.set(e.type_id, e);
	let i = /* @__PURE__ */ new Map(), a = [];
	for (let e of n ?? []) e.included ? i.set(e.type_id, {
		item: e,
		quantity: (i.get(e.type_id)?.quantity ?? 0) + e.quantity
	}) : a.push(e);
	let o = [.../* @__PURE__ */ new Set([...r.keys(), ...i.keys()])];
	return n == null ? /* @__PURE__ */ B("p", {
		className: "p-4 text-sm text-muted",
		children: "The contract's items haven't been read yet."
	}) : /* @__PURE__ */ B("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ V(te, { children: [/* @__PURE__ */ B(S, { children: /* @__PURE__ */ V("tr", { children: [
			/* @__PURE__ */ B(T, { children: "Item" }),
			/* @__PURE__ */ B(T, {
				align: "right",
				children: "Quoted"
			}),
			/* @__PURE__ */ B(T, {
				align: "right",
				children: "In contract"
			}),
			/* @__PURE__ */ B(T, {})
		] }) }), /* @__PURE__ */ V("tbody", { children: [o.map((t) => {
			let n = r.get(t), a = i.get(t), o = n?.quantity ?? 0, s = a?.quantity ?? 0;
			return /* @__PURE__ */ V(ie, { children: [
				/* @__PURE__ */ B(w, { children: /* @__PURE__ */ B(J, {
					icon: n?.icon ?? a?.item.icon ?? null,
					name: n?.name ?? a?.item.name ?? `Type ${t}`
				}) }),
				/* @__PURE__ */ B(w, {
					numeric: !0,
					children: o ? M(o) : "—"
				}),
				/* @__PURE__ */ B(w, {
					numeric: !0,
					children: s ? M(s) : "—"
				}),
				/* @__PURE__ */ B(w, { children: s === o ? /* @__PURE__ */ B(e, {
					tone: "success",
					children: "matches"
				}) : s < o ? /* @__PURE__ */ V(e, {
					tone: "danger",
					children: ["short ", M(o - s)]
				}) : /* @__PURE__ */ V(e, {
					tone: "warning",
					children: ["extra ", M(s - o)]
				}) })
			] }, t);
		}), a.map((t) => /* @__PURE__ */ V(ie, { children: [
			/* @__PURE__ */ B(w, { children: /* @__PURE__ */ B(J, {
				icon: t.icon,
				name: t.name,
				sub: "Asked for in return"
			}) }),
			/* @__PURE__ */ B(w, {
				numeric: !0,
				children: "—"
			}),
			/* @__PURE__ */ B(w, {
				numeric: !0,
				children: M(t.quantity)
			}),
			/* @__PURE__ */ B(w, { children: /* @__PURE__ */ B(e, {
				tone: "danger",
				children: "asks for it"
			}) })
		] }, `asked-${t.type_id}`))] })] })
	});
}
//#endregion
//#region src/member.tsx
var X = "/p/buyback";
function Ue() {
	return F({
		queryKey: ["buyback", "programs"],
		queryFn: () => D.get(`${q}/programs`)
	});
}
function We() {
	return F({
		queryKey: ["buyback", "me"],
		queryFn: () => D.get(`${q}/me`)
	});
}
function Ge({ program: t, to: n }) {
	return /* @__PURE__ */ B(L, {
		to: n,
		className: "block",
		children: /* @__PURE__ */ B(i, {
			interactive: !0,
			className: "h-full",
			children: /* @__PURE__ */ V(a, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ V("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ V("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ B("h2", {
								className: "hud-label truncate text-[15px] text-text",
								children: t.name
							}), t.description && /* @__PURE__ */ B("p", {
								className: "mt-1 line-clamp-2 text-sm text-muted",
								children: t.description
							})]
						}), /* @__PURE__ */ V("div", {
							className: "shrink-0 text-right",
							children: [/* @__PURE__ */ V("div", {
								className: "font-mono text-2xl font-semibold tabular-nums text-accent-ink",
								children: [t.tax, "%"]
							}), /* @__PURE__ */ B("div", {
								className: "text-[11px] uppercase tracking-wider text-subtle",
								children: "tax"
							})]
						})]
					}),
					/* @__PURE__ */ B(Ne, { terms: t.terms }),
					/* @__PURE__ */ B(Me, { program: t }),
					/* @__PURE__ */ V("div", {
						className: "flex flex-wrap gap-1.5",
						children: [!t.active && /* @__PURE__ */ B(e, {
							tone: "warning",
							children: "Closed"
						}), t.public && /* @__PURE__ */ V(e, {
							tone: "info",
							children: [/* @__PURE__ */ B(Se, { className: "size-3" }), " Public"]
						})]
					})
				]
			})
		})
	});
}
function Ke() {
	let { data: e, isLoading: t } = Ue(), n = We(), r = n.data?.quotes.filter((e) => e.contract?.open) ?? [];
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(U, {}),
			eyebrow: "Buyback",
			title: "Sell your loot and ore",
			description: e ? `Paste your items for an instant quote, then contract them. Prices: ${e.prices.source}${e.prices.instant ? " (best order)" : " (top 5% of orders)"} at each program's market${e.prices.guard ? `, checked against the last ${e.prices.guard_days} days of trading` : ""}.` : "Paste your items for an instant quote, then contract them.",
			actions: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ V(L, {
				to: `${X}/me`,
				className: O({ variant: "secondary" }),
				children: [/* @__PURE__ */ B(G, {}), " My quotes"]
			}), (e?.manages || e?.can_create) && /* @__PURE__ */ V(L, {
				to: "/p/buyback/manage",
				className: O({ variant: "secondary" }),
				children: [/* @__PURE__ */ B(he, {}), " Run programs"]
			})] })
		}),
		n.data && (n.data.totals.open > 0 || n.data.totals.sold_value > 0) && /* @__PURE__ */ V("div", {
			className: "mb-6 grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ B(y, {
					label: "Waiting to be accepted",
					value: n.data.totals.open,
					hint: j(n.data.totals.open_value)
				}),
				/* @__PURE__ */ B(y, {
					label: "Sold so far",
					value: j(n.data.totals.sold_value),
					mono: !0,
					tone: "success"
				}),
				/* @__PURE__ */ B(y, {
					label: "Quotes",
					value: n.data.quotes.length,
					hint: r.length ? `${r.length} contract${r.length === 1 ? "" : "s"} open` : "none open"
				})
			]
		}),
		t ? /* @__PURE__ */ V("div", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
			children: [/* @__PURE__ */ B(_, { className: "h-56" }), /* @__PURE__ */ B(_, { className: "h-56" })]
		}) : e?.programs.length ? /* @__PURE__ */ B("div", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
			children: e.programs.map((e) => /* @__PURE__ */ B(Ge, {
				program: e,
				to: `${X}/programs/${e.id}`
			}, e.id))
		}) : /* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(u, {
			icon: /* @__PURE__ */ B(U, {}),
			title: "No buyback programs for you yet",
			description: e?.can_create ? "Set one up: who buys, where, and at what tax." : "Leadership hasn't opened a buyback you can use.",
			action: e?.can_create ? /* @__PURE__ */ B(L, {
				to: `${X}/manage/new`,
				className: O({ variant: "primary" }),
				children: "Create a program"
			}) : void 0
		}) })
	] });
}
function Z({ to: e, children: t }) {
	return /* @__PURE__ */ V(L, {
		to: e,
		className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
		children: [
			/* @__PURE__ */ B(ve, {}),
			" ",
			t
		]
	});
}
function qe() {
	let { id: e } = R(), { data: t, isLoading: n, error: r } = F({
		queryKey: [
			"buyback",
			"program",
			e
		],
		queryFn: () => D.get(`${q}/programs/${e}`)
	});
	return n ? /* @__PURE__ */ B(_, { className: "h-96" }) : t ? /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(Z, {
			to: X,
			children: "All programs"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(U, {}),
			eyebrow: `Buyback · ${t.tax}% tax · priced at ${t.prices.hub}`,
			title: t.name,
			description: t.description || void 0,
			actions: t.can_manage && /* @__PURE__ */ V(L, {
				to: `/p/buyback/manage/${t.id}`,
				className: O({ variant: "secondary" }),
				children: [/* @__PURE__ */ B(he, {}), " Manage"]
			})
		}),
		!t.active && /* @__PURE__ */ B("p", {
			className: "mb-4 text-sm text-warning-fg",
			children: "This program is closed; only its managers see it."
		}),
		/* @__PURE__ */ B(ze, {
			program: t,
			base: q,
			quoteLink: (e) => `${X}/quotes/${e}`
		})
	] }) : /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(U, {}),
		title: "No such program",
		description: r?.message
	});
}
function Je() {
	let { data: e, isLoading: t } = We();
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(Z, {
			to: X,
			children: "Buyback"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(G, {}),
			title: "My quotes",
			description: "Every quote you made and what happened to its contract. Quotes without a contract are removed after a while."
		}),
		t ? /* @__PURE__ */ B(_, { className: "h-64" }) : e?.quotes.length ? /* @__PURE__ */ B(i, { children: /* @__PURE__ */ B("ul", {
			className: "divide-y divide-border",
			children: e.quotes.map((e) => /* @__PURE__ */ B("li", { children: /* @__PURE__ */ V(L, {
				to: `${X}/quotes/${e.tracking_number}`,
				className: "flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-hover",
				children: [/* @__PURE__ */ V("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ B("div", {
						className: "font-mono text-sm",
						children: e.tracking_number
					}), /* @__PURE__ */ V("div", {
						className: "text-xs text-subtle",
						children: [
							e.program.name,
							" · ",
							e.items,
							" item",
							e.items === 1 ? "" : "s",
							" · ",
							oe(e.created_at)
						]
					})]
				}), /* @__PURE__ */ V("div", {
					className: "flex items-center gap-3",
					children: [
						e.contract && e.contract.problems.length > 0 && /* @__PURE__ */ B(je, {
							problems: e.contract.problems,
							compact: !0
						}),
						/* @__PURE__ */ B(Ae, {
							status: e.state,
							label: e.contract?.status_label
						}),
						/* @__PURE__ */ B("span", {
							className: "w-36 text-right font-mono text-sm tabular-nums",
							children: j(e.value, { full: !0 })
						})
					]
				})]
			}) }, e.tracking_number))
		}) }) : /* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(u, {
			icon: /* @__PURE__ */ B(G, {}),
			title: "No quotes yet",
			action: /* @__PURE__ */ B(L, {
				to: X,
				className: O({ variant: "primary" }),
				children: "Get a quote"
			})
		}) })
	] });
}
function Ye({ c: e, lines: t }) {
	return /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ V(a, {
		className: "space-y-4",
		children: [/* @__PURE__ */ V("div", {
			className: "flex flex-wrap items-start justify-between gap-3",
			children: [/* @__PURE__ */ V("div", { children: [
				/* @__PURE__ */ B("div", {
					className: "hud-label text-subtle",
					children: "Contract"
				}),
				/* @__PURE__ */ V("div", {
					className: "mt-1 text-sm",
					children: [
						"From ",
						/* @__PURE__ */ B("span", {
							className: "font-medium",
							children: e.issuer.name
						}),
						e.issuer_corporation && /* @__PURE__ */ V("span", {
							className: "text-subtle",
							children: [" · ", e.issuer_corporation]
						})
					]
				}),
				/* @__PURE__ */ V("div", {
					className: "text-xs text-subtle",
					children: [
						"Made ",
						A(e.date_issued),
						e.location && /* @__PURE__ */ V(z, { children: [" at ", e.location] }),
						e.date_completed && /* @__PURE__ */ V(z, { children: [" · settled ", A(e.date_completed)] })
					]
				})
			] }), /* @__PURE__ */ V("div", {
				className: "text-right",
				children: [
					/* @__PURE__ */ B(Ae, {
						status: e.status,
						label: e.status_label
					}),
					/* @__PURE__ */ B("div", {
						className: "mt-1 font-mono text-lg tabular-nums",
						children: j(e.price, { full: !0 })
					}),
					e.quoted != null && e.quoted !== e.price && /* @__PURE__ */ V("div", {
						className: "text-xs text-subtle",
						children: ["quoted ", j(e.quoted, { full: !0 })]
					})
				]
			})]
		}), /* @__PURE__ */ B(je, { problems: e.problems })]
	}), t && /* @__PURE__ */ B(He, {
		lines: t,
		items: e.items
	})] });
}
function Xe() {
	let { tracking: e } = R(), { data: t, isLoading: n } = F({
		queryKey: [
			"buyback",
			"quote",
			e
		],
		queryFn: () => D.get(`${q}/quotes/${e}`)
	});
	return n ? /* @__PURE__ */ B(_, { className: "h-96" }) : t ? /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(Z, {
			to: t.mine ? `${X}/me` : t.can_manage ? `${X}/manage/${t.program.id}` : X,
			children: t.mine ? "My quotes" : "Back"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(G, {}),
			eyebrow: t.program.name,
			title: /* @__PURE__ */ V("span", {
				className: "inline-flex flex-wrap items-center gap-3 font-mono",
				children: [
					t.tracking_number,
					" ",
					/* @__PURE__ */ B(De, { value: t.tracking_number })
				]
			}),
			description: `Quoted ${A(t.created_at)}${t.hub ? ` at ${t.hub} prices` : ""}${t.seller && !t.mine ? ` for ${t.seller}` : ""}${t.public ? " (public calculator)" : ""}.`
		}),
		/* @__PURE__ */ V("div", {
			className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]",
			children: [/* @__PURE__ */ V("div", {
				className: "space-y-4",
				children: [t.contracts.map((e) => /* @__PURE__ */ B(Ye, {
					c: e,
					lines: t.lines
				}, e.contract_id)), /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B("div", {
					className: "border-b border-border px-4 py-3",
					children: /* @__PURE__ */ B("div", {
						className: "hud-label text-subtle",
						children: "Quote"
					})
				}), /* @__PURE__ */ B(Ie, { lines: t.lines })] })]
			}), /* @__PURE__ */ B("div", { children: t.contracts.length === 0 ? /* @__PURE__ */ B(Re, { quote: t }) : /* @__PURE__ */ B(i, { children: /* @__PURE__ */ V(a, { children: [
				/* @__PURE__ */ B("div", {
					className: "hud-label text-subtle",
					children: "Quoted"
				}),
				/* @__PURE__ */ B("div", {
					className: "mt-1 font-mono text-2xl tabular-nums",
					children: j(t.value, { full: !0 })
				}),
				/* @__PURE__ */ V("div", {
					className: "text-xs text-subtle",
					children: [M(t.volume), " m³"]
				})
			] }) }) })]
		})
	] }) : /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(G, {}),
		title: "No such quote",
		description: "It may have been removed because no contract was made for it."
	});
}
function Ze() {
	let { id: e } = R(), { data: t, isLoading: n } = F({
		queryKey: [
			"buyback",
			"contract",
			e
		],
		queryFn: () => D.get(`${q}/contracts/${e}`)
	});
	return n ? /* @__PURE__ */ B(_, { className: "h-96" }) : t ? /* @__PURE__ */ V("div", { children: [
		t.program && /* @__PURE__ */ B(Z, {
			to: `/p/buyback/manage/${t.program.id}`,
			children: t.program.name
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(G, {}),
			eyebrow: t.program?.name ?? "Buyback",
			title: t.title || `Contract ${t.contract_id}`,
			actions: t.tracking_number && /* @__PURE__ */ B(L, {
				to: `/p/buyback/quotes/${t.tracking_number}`,
				className: O({ variant: "secondary" }),
				children: "Open the quote"
			})
		}),
		/* @__PURE__ */ B(Ye, {
			c: t,
			lines: t.quote?.lines ?? []
		}),
		!t.quote && /* @__PURE__ */ B("p", {
			className: "mt-4 text-sm text-muted",
			children: "No quote has this contract's tracking number, so there's nothing to compare it with. Check every item by hand, or reject it."
		})
	] }) : /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(G, {}),
		title: "No such contract"
	});
}
function Qe() {
	let { data: e, isLoading: t } = We();
	return t ? /* @__PURE__ */ B(_, { className: "h-16" }) : e ? /* @__PURE__ */ B(L, {
		to: X,
		className: "block",
		children: /* @__PURE__ */ V("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ V("div", { children: [
				/* @__PURE__ */ B("div", {
					className: "text-xs text-muted",
					children: "Buyback contracts waiting"
				}),
				/* @__PURE__ */ B("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: e.totals.open
				}),
				/* @__PURE__ */ V("div", {
					className: "text-xs text-subtle",
					children: [j(e.totals.open_value), " to come"]
				})
			] }), /* @__PURE__ */ B(n, {
				variant: "secondary",
				size: "sm",
				tabIndex: -1,
				children: "Get a quote"
			})]
		})
	}) : null;
}
//#endregion
//#region src/manage.tsx
var Q = `${X}/manage`;
function $e() {
	let e = ce();
	return () => e.invalidateQueries({ queryKey: ["buyback"] });
}
function et() {
	let { data: t, isLoading: n, error: r } = F({
		queryKey: ["buyback", "manage"],
		queryFn: () => D.get(`${q}/manage`)
	}), o = se("buyback.manage_all_programs");
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(Z, {
			to: X,
			children: "Buyback"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(he, {}),
			eyebrow: "Buyback",
			title: "Run programs",
			description: "Contracts are read from each owner's login every 15 minutes and checked against their quotes.",
			actions: /* @__PURE__ */ V(z, { children: [
				t?.can_create && /* @__PURE__ */ V(L, {
					to: `${Q}/locations`,
					className: O({ variant: "secondary" }),
					children: [/* @__PURE__ */ B(_e, {}), " Locations"]
				}),
				o && /* @__PURE__ */ V(L, {
					to: "/p/buyback/settings",
					className: O({ variant: "secondary" }),
					children: [/* @__PURE__ */ B(he, {}), " Prices"]
				}),
				t?.can_create && /* @__PURE__ */ V(L, {
					to: `${Q}/new`,
					className: O({ variant: "primary" }),
					children: [/* @__PURE__ */ B(pe, {}), " New program"]
				})
			] })
		}),
		n ? /* @__PURE__ */ B(_, { className: "h-48" }) : t ? t.programs.length === 0 ? /* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(u, {
			icon: /* @__PURE__ */ B(U, {}),
			title: "No programs yet",
			description: "Add the location contracts are made at, then create a program.",
			action: t.can_create && /* @__PURE__ */ B(L, {
				to: `${Q}/new`,
				className: O({ variant: "primary" }),
				children: "New program"
			})
		}) }) : /* @__PURE__ */ B("div", {
			className: "grid gap-4 lg:grid-cols-2",
			children: t.programs.map((t) => /* @__PURE__ */ B(L, {
				to: `${Q}/${t.id}`,
				className: "block",
				children: /* @__PURE__ */ B(i, {
					interactive: !0,
					className: "h-full",
					children: /* @__PURE__ */ V(a, {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ V("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ V("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ B("h2", {
										className: "hud-label truncate text-[15px] text-text",
										children: t.name
									}), /* @__PURE__ */ B("div", {
										className: "mt-1 text-xs text-subtle",
										children: t.owner ? /* @__PURE__ */ V(z, { children: [
											"Contracts to ",
											t.owner.name,
											t.owner.corporation ? ` / ${t.owner.corporation}` : ""
										] }) : "No owner"
									})]
								}), /* @__PURE__ */ V("div", {
									className: "flex shrink-0 gap-1.5",
									children: [
										!t.active && /* @__PURE__ */ B(e, {
											tone: "warning",
											children: "Closed"
										}),
										t.public && /* @__PURE__ */ B(e, {
											tone: "info",
											children: "Public"
										}),
										t.owner && !t.owner.login_ok && /* @__PURE__ */ B(e, {
											tone: "danger",
											children: "Owner login"
										})
									]
								})]
							}),
							/* @__PURE__ */ V("div", {
								className: "grid grid-cols-3 gap-3",
								children: [
									/* @__PURE__ */ B(tt, {
										label: "Open",
										value: M(t.open),
										hint: j(t.open_value)
									}),
									/* @__PURE__ */ B(tt, {
										label: "Problems",
										value: M(t.problems),
										tone: t.problems ? "danger" : void 0
									}),
									/* @__PURE__ */ B(tt, {
										label: "30 days",
										value: j(t.month_value),
										hint: `${t.month_count} accepted`
									})
								]
							}),
							t.wallet && /* @__PURE__ */ V("div", {
								className: "text-xs text-muted",
								children: [
									"Wallet division ",
									t.wallet.division,
									": ",
									/* @__PURE__ */ B("span", {
										className: "font-mono",
										children: j(t.wallet.balance)
									})
								]
							})
						]
					})
				})
			}, t.id))
		}) : /* @__PURE__ */ B(u, {
			icon: /* @__PURE__ */ B(U, {}),
			title: "Not for you",
			description: r?.message
		})
	] });
}
function tt({ label: e, value: t, hint: n, tone: r }) {
	return /* @__PURE__ */ V("div", {
		className: "border border-border bg-surface-2 px-3 py-2",
		children: [
			/* @__PURE__ */ B("div", {
				className: "text-[11px] uppercase tracking-wider text-subtle",
				children: e
			}),
			/* @__PURE__ */ B("div", {
				className: `mt-0.5 truncate font-mono text-lg tabular-nums ${r === "danger" ? "text-danger-fg" : ""}`,
				children: t
			}),
			n && /* @__PURE__ */ B("div", {
				className: "truncate text-xs text-subtle",
				children: n
			})
		]
	});
}
function nt() {
	let { id: e } = R(), r = le(), s = $e(), [l, d] = I("open"), [f, h] = I(""), g = F({
		queryKey: [
			"buyback",
			"stats",
			e
		],
		queryFn: () => D.get(`${q}/manage/programs/${e}/stats`)
	}), v = F({
		queryKey: [
			"buyback",
			"contracts",
			e,
			l,
			f
		],
		queryFn: () => D.get(`${q}/manage/programs/${e}/contracts?status=${l}&q=${encodeURIComponent(f)}`)
	}), b = P({
		mutationFn: () => D.post(`${q}/manage/programs/${e}/sync`),
		onSuccess: () => {
			N.success("Checking contracts now; refresh in a minute"), setTimeout(s, 15e3);
		},
		onError: (e) => N.error(e.message)
	}), x = g.data;
	return g.isLoading ? /* @__PURE__ */ B(_, { className: "h-96" }) : x ? /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(Z, {
			to: Q,
			children: "Programs"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(U, {}),
			eyebrow: "Buyback program",
			title: x.program.name,
			description: x.owner ? `Contracts to ${x.owner.name}${x.owner.corporation ? ` / ${x.owner.corporation}` : ""}.` : "This program has no owner, so no contracts are read.",
			actions: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ V(L, {
				to: `${X}/programs/${x.program.id}`,
				className: O({ variant: "secondary" }),
				children: [/* @__PURE__ */ B(U, {}), " Calculator"]
			}), x.program.can_manage && /* @__PURE__ */ V(z, { children: [
				/* @__PURE__ */ V(n, {
					onClick: () => b.mutate(),
					loading: b.isPending,
					children: [/* @__PURE__ */ B(ge, {}), " Check now"]
				}),
				/* @__PURE__ */ V(L, {
					to: `${Q}/${x.program.id}/items`,
					className: O({ variant: "secondary" }),
					children: [/* @__PURE__ */ B(xe, {}), " Items"]
				}),
				/* @__PURE__ */ V(L, {
					to: `${Q}/${x.program.id}/edit`,
					className: O({ variant: "primary" }),
					children: [/* @__PURE__ */ B(ye, {}), " Edit"]
				})
			] })] })
		}),
		x.owner && !x.owner.login_ok && /* @__PURE__ */ V("p", {
			className: "mb-4 border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger-fg",
			children: [x.owner.name, "'s login can't read contracts. They need to log in again (Characters → re-add), or pick another owner."]
		}),
		/* @__PURE__ */ V("div", {
			className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ B(y, {
					label: "Open contracts",
					value: x.open,
					hint: j(x.open_value),
					icon: /* @__PURE__ */ B(U, {})
				}),
				/* @__PURE__ */ B(y, {
					label: "Need a look",
					value: x.problems,
					tone: x.problems ? "danger" : "success",
					hint: x.problems ? "open contracts with problems" : "all match their quotes",
					icon: /* @__PURE__ */ B(fe, {})
				}),
				/* @__PURE__ */ B(y, {
					label: "Bought, 30 days",
					value: j(x.month_value),
					mono: !0,
					hint: `${x.month_count} contracts`,
					icon: /* @__PURE__ */ B(be, {})
				}),
				/* @__PURE__ */ B(y, {
					label: x.wallet ? `Wallet division ${x.wallet.division}` : "Bought, all time",
					value: x.wallet ? j(x.wallet.balance) : j(x.total_value),
					mono: !0,
					hint: x.wallet ? x.wallet.updated_at ? `updated ${oe(x.wallet.updated_at)}` : "not synced yet" : `${x.total_count} contracts`
				})
			]
		}),
		/* @__PURE__ */ V("div", {
			className: "mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]",
			children: [/* @__PURE__ */ V(i, { children: [
				/* @__PURE__ */ B(o, { title: "Contracts" }),
				/* @__PURE__ */ V("div", {
					className: "flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3",
					children: [/* @__PURE__ */ B(ee, {
						size: "sm",
						value: l,
						onChange: d,
						options: [
							{
								value: "open",
								label: "Open"
							},
							{
								value: "problems",
								label: "Problems"
							},
							{
								value: "finished",
								label: "Accepted"
							},
							{
								value: "closed",
								label: "Other"
							},
							{
								value: "all",
								label: "All"
							}
						]
					}), /* @__PURE__ */ B(m, {
						value: f,
						onChange: (e) => h(e.target.value),
						placeholder: "Seller or title",
						className: "w-56"
					})]
				}),
				/* @__PURE__ */ B(c, {
					rows: v.data ?? [],
					loading: v.isLoading,
					rowKey: (e) => e.contract_id,
					onRowClick: (e) => r(`${X}/contracts/${e.contract_id}`),
					empty: {
						icon: /* @__PURE__ */ B(U, {}),
						title: l === "problems" ? "Nothing needs a look" : "No contracts here"
					},
					columns: [
						{
							header: "Seller",
							cell: (e) => /* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("div", {
								className: "font-medium",
								children: e.issuer.name
							}), /* @__PURE__ */ B("div", {
								className: "font-mono text-xs text-subtle",
								children: e.tracking_number ?? e.title
							})] })
						},
						{
							header: "Made",
							cell: (e) => /* @__PURE__ */ B("span", {
								className: "text-sm text-muted",
								children: oe(e.date_issued)
							}),
							sortValue: (e) => e.date_issued
						},
						{
							header: "Price",
							align: "right",
							cell: (e) => /* @__PURE__ */ B("span", {
								className: "font-mono tabular-nums",
								children: j(e.price, { full: !0 })
							}),
							sortValue: (e) => e.price
						},
						{
							header: "Checks",
							cell: (e) => /* @__PURE__ */ B(je, {
								problems: e.problems,
								compact: !0
							})
						},
						{
							header: "State",
							cell: (e) => /* @__PURE__ */ B(Ae, {
								status: e.status,
								label: e.status_label
							})
						}
					]
				})
			] }), /* @__PURE__ */ V("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, { title: "Bought per month" }), /* @__PURE__ */ B(a, { children: x.months.length ? /* @__PURE__ */ B(t, {
						data: x.months.map((e) => ({
							date: `${e.month}-01`,
							value: e.value
						})),
						format: (e) => j(e),
						label: "Bought",
						height: 160
					}) : /* @__PURE__ */ B("p", {
						className: "text-sm text-muted",
						children: "Nothing accepted yet."
					}) })] }),
					/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, { title: "Top sellers, 90 days" }), x.leaderboard.length ? /* @__PURE__ */ B("ol", {
						className: "divide-y divide-border",
						children: x.leaderboard.slice(0, 10).map((e, t) => /* @__PURE__ */ V("li", {
							className: "flex items-center justify-between gap-3 px-4 py-2 text-sm",
							children: [/* @__PURE__ */ V("span", {
								className: "truncate",
								children: [/* @__PURE__ */ B("span", {
									className: "mr-2 font-mono text-xs text-subtle",
									children: t + 1
								}), e.name]
							}), /* @__PURE__ */ B("span", {
								className: "font-mono tabular-nums",
								children: j(e.value)
							})]
						}, e.id))
					}) : /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B("p", {
						className: "text-sm text-muted",
						children: "No sales yet."
					}) })] }),
					/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, { title: "Most bought, 90 days" }), x.top_items.length ? /* @__PURE__ */ B("ul", {
						className: "divide-y divide-border",
						children: x.top_items.map((e) => /* @__PURE__ */ V("li", {
							className: "flex items-center justify-between gap-3 px-4 py-2 text-sm",
							children: [/* @__PURE__ */ B(J, {
								icon: e.icon,
								name: e.name,
								sub: `${M(e.quantity)} units`
							}), /* @__PURE__ */ B("span", {
								className: "shrink-0 font-mono tabular-nums",
								children: j(e.value)
							})]
						}, e.type_id))
					}) : /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B("p", {
						className: "text-sm text-muted",
						children: "Nothing yet."
					}) })] })
				]
			})]
		})
	] }) : /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(U, {}),
		title: "No such program"
	});
}
var rt = {
	name: "",
	description: "",
	owner_id: null,
	is_corporation: !0,
	location_ids: [],
	manager_ids: [],
	expiration_days: 14,
	price_type: "buy",
	tax: 10,
	hauling_fuel_cost: 0,
	price_density_threshold: 0,
	price_density_tax: 0,
	compressed_volume: !1,
	allow_all_items: !0,
	use_raw: !0,
	use_compressed: !0,
	use_refined: !0,
	refining_rate: 80,
	allow_unpacked: !1,
	blue_loot_npc: !1,
	red_loot_npc: !1,
	t1_refined: !1,
	t1_refining_rate: 55,
	state_ids: [],
	group_ids: [],
	public: !1,
	notify_managers: !0,
	wallet_division: null,
	tracking_prefix: "",
	active: !0,
	hub_id: null,
	hub_name: ""
};
function $({ label: e, hint: t, value: n, onChange: r, step: i = 1, suffix: a }) {
	return /* @__PURE__ */ B(d, {
		label: e,
		hint: t,
		children: /* @__PURE__ */ V("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ B(f, {
				type: "number",
				step: i,
				value: n,
				onChange: (e) => r(Number(e.target.value)),
				className: "w-36 font-mono"
			}), a && /* @__PURE__ */ B("span", {
				className: "text-sm text-subtle",
				children: a
			})]
		})
	});
}
function it({ items: e, selected: t, onChange: n, empty: r }) {
	return e.length ? /* @__PURE__ */ B("div", {
		className: "divide-y divide-border border border-border",
		children: e.map((e) => /* @__PURE__ */ V("label", {
			className: "flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm",
			children: [/* @__PURE__ */ B("span", { children: e.name }), /* @__PURE__ */ B(b, {
				checked: t.includes(e.id),
				onCheckedChange: (r) => n(r ? [...t, e.id] : t.filter((t) => t !== e.id))
			})]
		}, e.id))
	}) : /* @__PURE__ */ B("p", {
		className: "text-sm text-subtle",
		children: r
	});
}
function at() {
	let { id: e } = R(), t = !e, r = le(), c = $e(), l = F({
		queryKey: ["buyback", "options"],
		queryFn: () => D.get(`${q}/manage/options`)
	}), u = F({
		queryKey: [
			"buyback",
			"managed",
			e
		],
		queryFn: () => D.get(`${q}/manage/programs/${e}`),
		enabled: !t
	}), [m, v] = I(null), [y, b] = I(!1), [S, te] = I(!1), w = t ? rt : u.data ? {
		...rt,
		...ot(u.data)
	} : null, T = m ?? w, E = (e) => T && v({
		...T,
		...e
	}), ie = P({
		mutationFn: (n) => t ? D.post(`${q}/manage/programs`, n) : D.put(`${q}/manage/programs/${e}`, n),
		onSuccess: (e) => {
			c(), N.success(t ? "Program created" : "Saved"), r(`${Q}/${e.id}`);
		},
		onError: (e) => N.error(e.message)
	}), O = P({
		mutationFn: () => D.delete(`${q}/manage/programs/${e}`),
		onSuccess: () => {
			c(), r(Q);
		}
	});
	if (!T || !l.data) return /* @__PURE__ */ B(_, { className: "h-96" });
	let k = l.data, A = [...k.characters];
	u.data?.owner && !A.some((e) => e.id === u.data.owner.id) && A.unshift({
		id: u.data.owner.id,
		name: u.data.owner.name,
		corporation: u.data.owner.corporation,
		login_ok: u.data.owner.login_ok
	});
	let ae = [...k.managers, ...(u.data?.managers ?? []).filter((e) => !k.managers.some((t) => t.id === e.id))];
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(Z, {
			to: t ? Q : `${Q}/${e}`,
			children: t ? "Programs" : T.name
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(ye, {}),
			title: t ? "New buyback program" : `Edit ${u.data?.name}`,
			actions: /* @__PURE__ */ V(z, { children: [!t && /* @__PURE__ */ V(n, {
				variant: "ghost",
				onClick: () => b(!0),
				children: [/* @__PURE__ */ B(me, {}), " Delete"]
			}), /* @__PURE__ */ B(n, {
				variant: "primary",
				loading: ie.isPending,
				onClick: () => ie.mutate(T),
				children: t ? "Create program" : "Save"
			})] })
		}),
		/* @__PURE__ */ V(ne, {
			className: "space-y-6",
			items: [
				{
					value: "basics",
					label: "Basics"
				},
				{
					value: "pricing",
					label: "Pricing"
				},
				{
					value: "ore",
					label: "Ore & special items"
				},
				{
					value: "access",
					label: "Who can use it"
				}
			],
			children: [
				/* @__PURE__ */ B(C, {
					value: "basics",
					children: /* @__PURE__ */ V("div", {
						className: "grid gap-6 lg:grid-cols-2",
						children: [/* @__PURE__ */ B(i, { children: /* @__PURE__ */ V(a, {
							className: "space-y-5",
							children: [
								/* @__PURE__ */ B(d, {
									label: "Name",
									required: !0,
									children: /* @__PURE__ */ B(f, {
										value: T.name,
										onChange: (e) => E({ name: e.target.value }),
										placeholder: "Jita ore buyback"
									})
								}),
								/* @__PURE__ */ B(d, {
									label: "Description",
									hint: "Shown to sellers: what you buy, how fast you accept, who to ask.",
									children: /* @__PURE__ */ B(re, {
										rows: 3,
										value: T.description,
										onChange: (e) => E({ description: e.target.value })
									})
								}),
								/* @__PURE__ */ B(d, {
									label: "Contracts go to",
									required: !0,
									hint: "One of your characters. Its login reads the contracts, so it must stay logged in here.",
									children: /* @__PURE__ */ V(g, {
										value: T.owner_id ?? "",
										onChange: (e) => E({ owner_id: Number(e.target.value) || null }),
										children: [/* @__PURE__ */ B("option", {
											value: "",
											children: "Pick a character…"
										}), A.map((e) => /* @__PURE__ */ V("option", {
											value: e.id,
											children: [
												e.name,
												e.corporation ? ` (${e.corporation})` : "",
												e.login_ok ? "" : " - login needed"
											]
										}, e.id))]
									})
								}),
								/* @__PURE__ */ V("div", {
									className: "divide-y divide-border border border-border px-3",
									children: [
										/* @__PURE__ */ B(x, {
											label: "To the character's corporation",
											description: "Sellers make contracts out to the corporation rather than the character.",
											checked: T.is_corporation,
											onCheckedChange: (e) => E({ is_corporation: e })
										}),
										/* @__PURE__ */ B(x, {
											label: "Open",
											description: "Closed programs give no quotes; only managers see them.",
											checked: T.active,
											onCheckedChange: (e) => E({ active: e })
										}),
										/* @__PURE__ */ B(x, {
											label: "Tell managers about new contracts",
											checked: T.notify_managers,
											onCheckedChange: (e) => E({ notify_managers: e })
										})
									]
								}),
								/* @__PURE__ */ V("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [/* @__PURE__ */ B($, {
										label: "Contracts expire after",
										value: T.expiration_days,
										onChange: (e) => E({ expiration_days: e }),
										suffix: "days"
									}), /* @__PURE__ */ B(d, {
										label: "Wallet division",
										hint: "Its balance shows on the program's page.",
										children: /* @__PURE__ */ V(g, {
											value: T.wallet_division ?? "",
											onChange: (e) => E({ wallet_division: Number(e.target.value) || null }),
											children: [/* @__PURE__ */ B("option", {
												value: "",
												children: "None"
											}), [
												1,
												2,
												3,
												4,
												5,
												6,
												7
											].map((e) => /* @__PURE__ */ V("option", {
												value: e,
												children: ["Division ", e]
											}, e))]
										})
									})]
								}),
								/* @__PURE__ */ B(d, {
									label: "Tracking prefix",
									hint: `Starts this program's tracking numbers. Empty: the site's (${k.default_prefix}).`,
									children: /* @__PURE__ */ B(f, {
										value: T.tracking_prefix,
										onChange: (e) => E({ tracking_prefix: e.target.value }),
										placeholder: k.default_prefix,
										className: "w-40 font-mono"
									})
								})
							]
						}) }), /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, {
							title: "Locations",
							description: "Where sellers make contracts. With a structure id, contracts made anywhere else are flagged."
						}), /* @__PURE__ */ V(a, {
							className: "space-y-3",
							children: [/* @__PURE__ */ B(it, {
								items: k.locations,
								selected: T.location_ids,
								onChange: (e) => E({ location_ids: e }),
								empty: "No locations yet."
							}), /* @__PURE__ */ V("button", {
								type: "button",
								onClick: () => te(!0),
								className: "inline-flex items-center gap-1.5 text-sm text-accent-ink hover:underline",
								children: [/* @__PURE__ */ B(pe, {}), " Add a location"]
							})]
						})] })]
					})
				}),
				/* @__PURE__ */ B(C, {
					value: "pricing",
					children: /* @__PURE__ */ B(i, { children: /* @__PURE__ */ V(a, {
						className: "grid gap-6 lg:grid-cols-2",
						children: [
							/* @__PURE__ */ B("div", {
								className: "lg:col-span-2",
								children: /* @__PURE__ */ B(pt, {
									value: T,
									market: k.market,
									onChange: (e, t) => E({
										hub_id: e,
										hub_name: t
									})
								})
							}),
							/* @__PURE__ */ V("div", {
								className: "space-y-5",
								children: [
									/* @__PURE__ */ B(d, {
										label: "Price",
										hint: "Which hub price items are valued at, before tax.",
										children: /* @__PURE__ */ B(ee, {
											value: T.price_type,
											onChange: (e) => E({ price_type: e }),
											options: [
												{
													value: "buy",
													label: "Buy"
												},
												{
													value: "split",
													label: "Split"
												},
												{
													value: "sell",
													label: "Sell"
												}
											]
										})
									}),
									/* @__PURE__ */ B($, {
										label: "Tax",
										hint: "Taken off every item. Items can add to it (or take away) in the item rules.",
										value: T.tax,
										onChange: (e) => E({ tax: e }),
										step: .5,
										suffix: "%"
									}),
									/* @__PURE__ */ B($, {
										label: "Hauling cost",
										hint: "Taken off per m³; for programs that haul to market. Use it or price density, not both.",
										value: T.hauling_fuel_cost,
										onChange: (e) => E({ hauling_fuel_cost: e }),
										step: 50,
										suffix: "ISK / m³"
									})
								]
							}),
							/* @__PURE__ */ V("div", {
								className: "space-y-5",
								children: [
									/* @__PURE__ */ B($, {
										label: "Price density threshold",
										hint: "Items worth less than this per m³ (T1 ships, bulky junk) pay the extra tax. 0: off.",
										value: T.price_density_threshold,
										onChange: (e) => E({ price_density_threshold: e }),
										step: 100,
										suffix: "ISK / m³"
									}),
									/* @__PURE__ */ B($, {
										label: "Price density tax",
										value: T.price_density_tax,
										onChange: (e) => E({ price_density_tax: e }),
										step: .5,
										suffix: "%"
									}),
									/* @__PURE__ */ V("div", {
										className: "divide-y divide-border border border-border px-3",
										children: [
											/* @__PURE__ */ B(x, {
												label: "Use compressed volume",
												description: "Ore and ice count with their compressed volume for hauling and price density.",
												checked: T.compressed_volume,
												onCheckedChange: (e) => E({ compressed_volume: e })
											}),
											/* @__PURE__ */ B(x, {
												label: "Buy every item",
												description: "Off: only items you add in the item rules are bought.",
												checked: T.allow_all_items,
												onCheckedChange: (e) => E({ allow_all_items: e })
											}),
											/* @__PURE__ */ B(x, {
												label: "Take assembled items",
												description: "Off: ships and modules must be repackaged (so broken crystals and the like aren't sold to you).",
												checked: T.allow_unpacked,
												onCheckedChange: (e) => E({ allow_unpacked: e })
											})
										]
									})
								]
							})
						]
					}) })
				}),
				/* @__PURE__ */ B(C, {
					value: "ore",
					children: /* @__PURE__ */ B(i, { children: /* @__PURE__ */ V(a, {
						className: "grid gap-6 lg:grid-cols-2",
						children: [/* @__PURE__ */ V("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ B(h, { children: "Ore, moon ore and ice" }),
								/* @__PURE__ */ B("p", {
									className: "text-sm text-muted",
									children: "Valued the best of the ways ticked here."
								}),
								/* @__PURE__ */ V("div", {
									className: "divide-y divide-border border border-border px-3",
									children: [
										/* @__PURE__ */ B(x, {
											label: "Raw price",
											description: "Some ores (Kernite, moon ores) sell for less than their minerals.",
											checked: T.use_raw,
											onCheckedChange: (e) => E({ use_raw: e })
										}),
										/* @__PURE__ */ B(x, {
											label: "Compressed price",
											description: "One unit of ore compresses into one unit of compressed ore.",
											checked: T.use_compressed,
											onCheckedChange: (e) => E({ use_compressed: e })
										}),
										/* @__PURE__ */ B(x, {
											label: "Refined value",
											description: "What reprocessing gives, at the refining rate below.",
											checked: T.use_refined,
											onCheckedChange: (e) => E({ use_refined: e })
										})
									]
								}),
								/* @__PURE__ */ B($, {
									label: "Refining rate",
									value: T.refining_rate,
									onChange: (e) => E({ refining_rate: e }),
									step: .1,
									suffix: "%"
								})
							]
						}), /* @__PURE__ */ V("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ B(h, { children: "Special items" }),
								/* @__PURE__ */ V("div", {
									className: "divide-y divide-border border border-border px-3",
									children: [
										/* @__PURE__ */ B(x, {
											label: "Tech I modules at reprocessed value",
											description: "Named and Tech I modules are worth what they reprocess into.",
											checked: T.t1_refined,
											onCheckedChange: (e) => E({ t1_refined: e })
										}),
										/* @__PURE__ */ B(x, {
											label: "Sleeper loot at NPC price",
											description: "Blue loot at the NPC buy order price, even if the market pays more.",
											checked: T.blue_loot_npc,
											onCheckedChange: (e) => E({ blue_loot_npc: e })
										}),
										/* @__PURE__ */ B(x, {
											label: "Triglavian loot at NPC price",
											description: "Red loot at the NPC buy order price.",
											checked: T.red_loot_npc,
											onCheckedChange: (e) => E({ red_loot_npc: e })
										})
									]
								}),
								/* @__PURE__ */ B($, {
									label: "Tech I reprocessing rate",
									value: T.t1_refining_rate,
									onChange: (e) => E({ t1_refining_rate: e }),
									step: .1,
									suffix: "%"
								})
							]
						})]
					}) })
				}),
				/* @__PURE__ */ B(C, {
					value: "access",
					children: /* @__PURE__ */ V("div", {
						className: "grid gap-6 lg:grid-cols-3",
						children: [
							/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, {
								title: "States",
								description: "None ticked here or under groups: every member."
							}), /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(it, {
								items: k.states,
								selected: T.state_ids,
								onChange: (e) => E({ state_ids: e }),
								empty: "No states."
							}) })] }),
							/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, { title: "Groups" }), /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(it, {
								items: k.groups,
								selected: T.group_ids,
								onChange: (e) => E({ group_ids: e }),
								empty: "No groups."
							}) })] }),
							/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, {
								title: "Managers",
								description: "Run this program, see its contracts and get told about new ones. You're always one."
							}), /* @__PURE__ */ V(a, {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ B(it, {
										items: ae,
										selected: T.manager_ids,
										onChange: (e) => E({ manager_ids: e }),
										empty: "Nobody else may run programs."
									}),
									/* @__PURE__ */ B("div", {
										className: "border border-border px-3",
										children: /* @__PURE__ */ B(x, {
											label: "Public",
											description: "Anyone with the link can get a quote, without an account. States and groups don't apply to it.",
											checked: T.public,
											onCheckedChange: (e) => E({ public: e })
										})
									}),
									T.public && !t && /* @__PURE__ */ V("p", {
										className: "text-xs text-muted",
										children: ["Public link: ", /* @__PURE__ */ B("span", {
											className: "font-mono",
											children: `${location.origin}/public/p/buyback/${e}`
										})]
									})
								]
							})] })
						]
					})
				})
			]
		}),
		/* @__PURE__ */ B(s, {
			open: y,
			onOpenChange: b,
			title: `Delete ${u.data?.name}?`,
			description: "Its quotes, item rules and contract history go with it. Contracts in the game aren't touched.",
			confirmLabel: "Delete",
			danger: !0,
			onConfirm: () => O.mutateAsync()
		}),
		S && /* @__PURE__ */ B(lt, {
			location: null,
			onClose: () => te(!1),
			onSaved: (e) => E({ location_ids: [...T.location_ids, e.id] })
		})
	] });
}
function ot(e) {
	let t = {};
	for (let n of Object.keys(rt)) t[n] = e[n];
	return t;
}
function st({ kind: e, placeholder: t, onPick: n }) {
	let [r, i] = I(""), { data: a } = F({
		queryKey: [
			"buyback",
			"search",
			e,
			r
		],
		queryFn: () => D.get(`${q}/manage/search/${e}?q=${encodeURIComponent(r)}`),
		enabled: r.trim().length >= 2
	});
	return /* @__PURE__ */ V("div", {
		className: "relative",
		children: [/* @__PURE__ */ B(m, {
			value: r,
			onChange: (e) => i(e.target.value),
			placeholder: t
		}), r.trim().length >= 2 && a && /* @__PURE__ */ V("ul", {
			className: "absolute z-20 mt-1 max-h-72 w-full overflow-y-auto border border-border-strong bg-surface-raised shadow-e3",
			children: [a.length === 0 && /* @__PURE__ */ B("li", {
				className: "px-3 py-2 text-sm text-subtle",
				children: "Nothing found"
			}), a.map((e) => /* @__PURE__ */ B("li", { children: /* @__PURE__ */ B("button", {
				className: "w-full px-3 py-2 text-left hover:bg-hover",
				onClick: () => {
					n(e), i("");
				},
				children: e.icon ? /* @__PURE__ */ B(J, {
					icon: e.icon,
					name: e.name,
					sub: e.subtitle
				}) : /* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("div", {
					className: "text-sm font-medium",
					children: e.name
				}), /* @__PURE__ */ B("div", {
					className: "text-xs text-subtle",
					children: e.subtitle
				})] })
			}) }, e.id))]
		})]
	});
}
function ct() {
	let t = $e(), r = F({
		queryKey: ["buyback", "options"],
		queryFn: () => D.get(`${q}/manage/options`)
	}), [a, o] = I(null), s = P({
		mutationFn: (e) => D.delete(`${q}/manage/locations/${e}`),
		onSuccess: t,
		onError: (e) => N.error(e.message)
	});
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(Z, {
			to: Q,
			children: "Programs"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(_e, {}),
			title: "Locations",
			description: "Where sellers make their contracts. Programs pick one or more.",
			actions: /* @__PURE__ */ V(n, {
				variant: "primary",
				onClick: () => o("new"),
				children: [/* @__PURE__ */ B(pe, {}), " Add location"]
			})
		}),
		/* @__PURE__ */ B(i, { children: r.data ? r.data.locations.length === 0 ? /* @__PURE__ */ B(u, {
			icon: /* @__PURE__ */ B(_e, {}),
			title: "No locations yet",
			action: /* @__PURE__ */ B(n, {
				variant: "primary",
				onClick: () => o("new"),
				children: "Add location"
			})
		}) : /* @__PURE__ */ B("ul", {
			className: "divide-y divide-border",
			children: r.data.locations.map((t) => /* @__PURE__ */ V("li", {
				className: "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
				children: [/* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("div", {
					className: "font-medium",
					children: t.name
				}), /* @__PURE__ */ V("div", {
					className: "text-sm",
					children: [/* @__PURE__ */ B(Oe, { system: t.system }), t.structure_id ? /* @__PURE__ */ V("span", {
						className: "ml-2 font-mono text-xs text-subtle",
						children: ["#", t.structure_id]
					}) : /* @__PURE__ */ B(e, {
						tone: "neutral",
						className: "ml-2",
						children: "location not checked"
					})]
				})] }), /* @__PURE__ */ V("div", {
					className: "flex gap-1",
					children: [/* @__PURE__ */ V(n, {
						size: "sm",
						variant: "ghost",
						onClick: () => o(t),
						children: [/* @__PURE__ */ B(ye, {}), " Edit"]
					}), /* @__PURE__ */ V(n, {
						size: "sm",
						variant: "ghost",
						onClick: () => s.mutate(t.id),
						children: [/* @__PURE__ */ B(me, {}), " Remove"]
					})]
				})]
			}, t.id))
		}) : /* @__PURE__ */ B(_, { className: "h-32" }) }),
		a && /* @__PURE__ */ B(lt, {
			location: a === "new" ? null : a,
			onClose: () => o(null)
		})
	] });
}
function lt({ location: e, onClose: t, onSaved: r }) {
	let i = $e(), [a, o] = I(e?.name ?? ""), [s, c] = I(e?.system ? {
		id: e.system.id,
		name: e.system.name
	} : null), [u, p] = I(e?.structure_id ? String(e.structure_id) : ""), m = P({
		mutationFn: () => {
			let t = {
				name: a,
				solar_system_id: s?.id,
				structure_id: u ? Number(u) : null
			};
			return e ? D.put(`${q}/manage/locations/${e.id}`, t) : D.post(`${q}/manage/locations`, t);
		},
		onSuccess: (e) => {
			i(), r?.(e), t();
		},
		onError: (e) => N.error(e.message)
	});
	return /* @__PURE__ */ B(l, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: e ? `Edit ${e.name}` : "Add a location",
		footer: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(n, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), /* @__PURE__ */ B(n, {
			variant: "primary",
			loading: m.isPending,
			disabled: !a.trim() || !s,
			onClick: () => m.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ V("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ B(d, {
					label: "Find a known station or structure",
					hint: "Fills in everything below. Only places the site has seen (in assets, contracts or corporations) are found.",
					children: /* @__PURE__ */ B(st, {
						kind: "places",
						placeholder: "Station or structure name…",
						onPick: (e) => {
							o(e.name), p(String(e.id)), e.solar_system_id && c({
								id: e.solar_system_id,
								name: e.solar_system_name ?? `System ${e.solar_system_id}`
							});
						}
					})
				}),
				/* @__PURE__ */ B(d, {
					label: "Name",
					required: !0,
					hint: "Ideally the in-game name, so sellers find it.",
					children: /* @__PURE__ */ B(f, {
						value: a,
						onChange: (e) => o(e.target.value)
					})
				}),
				/* @__PURE__ */ B(d, {
					label: "Solar system",
					required: !0,
					children: s ? /* @__PURE__ */ V("div", {
						className: "flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ B("span", {
							className: "font-medium",
							children: s.name
						}), /* @__PURE__ */ B(n, {
							size: "xs",
							variant: "ghost",
							onClick: () => c(null),
							children: "Change"
						})]
					}) : /* @__PURE__ */ B(st, {
						kind: "systems",
						placeholder: "System…",
						onPick: (e) => c({
							id: e.id,
							name: e.name
						})
					})
				}),
				/* @__PURE__ */ B(d, {
					label: "Station or structure id",
					hint: "Contracts made elsewhere are flagged. In game, link the structure in chat, right-click the link and copy it: the number after the slash, e.g. showinfo:35826//1037962518481.",
					children: /* @__PURE__ */ B(f, {
						value: u,
						onChange: (e) => p(e.target.value.replace(/\D/g, "")),
						className: "font-mono",
						placeholder: "1037962518481"
					})
				})
			]
		})
	});
}
var ut = {
	region: "a whole region",
	system: "a solar system",
	station: "a station",
	structure: "a player structure"
};
function dt(e) {
	return e >= 1e7 && e < 2e7 ? "region" : e >= 3e7 && e < 4e7 ? "system" : e >= 6e7 && e < 7e7 ? "station" : "structure";
}
function ft({ hubs: e, hubId: t, hubName: n, esi: r, onChange: i, note: a, label: o = "Trade hub" }) {
	let s = e.find((e) => e.id === t), [c, l] = I(!s), u = dt(t);
	return /* @__PURE__ */ V("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ B("div", {
				className: "text-[13px] font-medium text-text",
				children: o
			}),
			/* @__PURE__ */ V("div", {
				className: "grid gap-2 sm:grid-cols-3",
				children: [e.map((e) => {
					let n = e.id === t && !c;
					return /* @__PURE__ */ V("button", {
						type: "button",
						onClick: () => {
							l(!1), i(e.id, e.name);
						},
						className: `border px-3 py-2 text-left transition ${n ? "border-accent bg-accent-soft" : "border-border hover:bg-hover"}`,
						"aria-pressed": n,
						children: [/* @__PURE__ */ B("div", {
							className: `text-sm font-medium ${n ? "text-accent-ink" : ""}`,
							children: e.name
						}), /* @__PURE__ */ B("div", {
							className: "truncate text-xs text-subtle",
							children: e.region
						})]
					}, e.id);
				}), /* @__PURE__ */ V("button", {
					type: "button",
					onClick: () => l(!0),
					className: `border px-3 py-2 text-left transition ${c ? "border-accent bg-accent-soft" : "border-border hover:bg-hover"}`,
					"aria-pressed": c,
					children: [/* @__PURE__ */ B("div", {
						className: `text-sm font-medium ${c ? "text-accent-ink" : ""}`,
						children: "Other…"
					}), /* @__PURE__ */ V("div", {
						className: "text-xs text-subtle",
						children: ["Region, system, station", r ? ", structure" : ""]
					})]
				})]
			}),
			c && /* @__PURE__ */ V("div", {
				className: "space-y-3 border border-border bg-surface-2 p-3",
				children: [
					/* @__PURE__ */ B(st, {
						kind: "hubs",
						placeholder: "Find a region, system, station or structure…",
						onPick: (e) => i(e.id, e.name)
					}),
					/* @__PURE__ */ V("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ B(d, {
							label: "Market id",
							hint: `Now ${ut[u]}. Or paste an id: a structure's is in its chat link (showinfo:35826//1037962518481).`,
							children: /* @__PURE__ */ B(f, {
								type: "number",
								value: t,
								onChange: (e) => i(Number(e.target.value), n),
								className: "font-mono"
							})
						}), /* @__PURE__ */ B(d, {
							label: "Shown as",
							children: /* @__PURE__ */ B(f, {
								value: n,
								onChange: (e) => i(t, e.target.value)
							})
						})]
					}),
					!r && /* @__PURE__ */ B("p", {
						className: "text-xs text-subtle",
						children: "Fuzzwork covers the main hubs and regions; smaller stations may have no prices there. ESI reads any market."
					})
				]
			}),
			/* @__PURE__ */ B("p", {
				className: "text-xs text-subtle",
				children: a
			})
		]
	});
}
function pt({ value: e, market: t, onChange: n }) {
	if (t.source === "janice") return /* @__PURE__ */ B(d, {
		label: "Market",
		children: /* @__PURE__ */ B("p", {
			className: "text-sm text-muted",
			children: "Jita 4-4: the Janice price source prices nowhere else. Switch the source in the buyback settings to pick another market."
		})
	});
	let r = e.hub_id != null;
	return /* @__PURE__ */ V("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ B("div", {
			className: "border border-border px-3",
			children: /* @__PURE__ */ B(x, {
				label: `Price at the site's market (${t.hub_name})`,
				description: "Off: pick a market for this program. Sellers see which one on the program and on every quote.",
				checked: !r,
				onCheckedChange: (e) => e ? n(null, "") : n(t.hub_id, t.hub_name)
			})
		}), r && /* @__PURE__ */ B(ft, {
			label: "This program's market",
			hubs: t.hubs,
			hubId: e.hub_id,
			hubName: e.hub_name,
			esi: t.source === "esi",
			onChange: n,
			note: dt(e.hub_id) === "structure" ? "A player structure's market is read with the login of the character contracts go to, so it must be able to dock there and use the market." : `Prices come from ${t.source_name}, like the site's.`
		})]
	});
}
function mt() {
	let e = ce(), t = ["buyback", "settings"], { data: r } = F({
		queryKey: t,
		queryFn: () => D.get(`${q}/settings`)
	}), [s, c] = I(null), l = s ?? (r ? {
		...r,
		janice_api_key: "",
		esi_character_id: r.esi_character?.id ?? null
	} : null), u = (e) => l && c({
		...l,
		...e
	}), m = P({
		mutationFn: (e) => D.put(`${q}/settings`, e),
		onSuccess: (n) => {
			e.setQueryData(t, n), c(null), e.invalidateQueries({ queryKey: ["buyback"] }), N.success("Saved");
		},
		onError: (e) => N.error(e.message)
	}), h = P({
		mutationFn: () => D.post(`${q}/settings/refresh-prices`),
		onSuccess: (e) => N.success(e.queued ? "Reading the market now; it takes a minute or two" : `${e.refreshed} prices refreshed`),
		onError: (e) => N.error(e.message)
	});
	if (!l) return /* @__PURE__ */ B(_, { className: "h-96" });
	let v = dt(l.hub_id), y = l.price_source === "esi";
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(Z, {
			to: Q,
			children: "Programs"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(he, {}),
			title: "Buyback settings",
			description: "Prices and tracking for every program.",
			actions: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ V(n, {
				onClick: () => h.mutate(),
				loading: h.isPending,
				disabled: !!s,
				children: [
					/* @__PURE__ */ B(ge, {}),
					" ",
					y ? "Read the market now" : `Refresh ${M(l.prices_stored)} prices`
				]
			}), /* @__PURE__ */ B(n, {
				variant: "primary",
				disabled: !s,
				loading: m.isPending,
				onClick: () => s && m.mutate(s),
				children: "Save"
			})] })
		}),
		/* @__PURE__ */ V("div", {
			className: "grid gap-6 lg:grid-cols-2",
			children: [/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, {
				title: "Prices",
				description: "Where items are priced before each program's tax."
			}), /* @__PURE__ */ V(a, {
				className: "space-y-5",
				children: [
					/* @__PURE__ */ B(d, {
						label: "Source",
						children: /* @__PURE__ */ B(ee, {
							value: l.price_source,
							onChange: (e) => u({ price_source: e }),
							options: [
								{
									value: "esi",
									label: "ESI"
								},
								{
									value: "fuzzwork",
									label: "Fuzzwork"
								},
								{
									value: "janice",
									label: "Janice"
								}
							]
						})
					}),
					/* @__PURE__ */ V("p", {
						className: "text-xs text-muted",
						children: [
							y && "Straight from CCP (recommended): the whole market is read every 30 minutes (a few hundred pages for Jita) and quotes use what was read. Also reads player structure markets.",
							l.price_source === "fuzzwork" && "A free third-party site that reads EVE's markets. Prices are fetched when a quote needs them, up to 200 items a request.",
							l.price_source === "janice" && "Janice prices Jita 4-4 and needs an API key (ask its author)."
						]
					}),
					l.price_source === "janice" ? /* @__PURE__ */ B(d, {
						label: "Janice API key",
						hint: l.janice_key_set ? "A key is stored. Type a new one to replace it, or - to remove it." : void 0,
						children: /* @__PURE__ */ B(f, {
							type: "password",
							value: l.janice_api_key,
							onChange: (e) => u({ janice_api_key: e.target.value }),
							placeholder: l.janice_key_set ? "••••••••" : "",
							autoComplete: "off"
						})
					}) : /* @__PURE__ */ B(ft, {
						hubs: l.hubs,
						hubId: l.hub_id,
						hubName: l.hub_name,
						esi: y,
						onChange: (e, t) => u({
							hub_id: e,
							hub_name: t
						}),
						note: "Programs use it unless they pick their own market. Changing it drops its stored prices; they're read again from the new hub."
					}),
					l.price_source === "fuzzwork" && v === "structure" && /* @__PURE__ */ B("p", {
						className: "text-sm text-danger-fg",
						children: "Only ESI can read player structures."
					}),
					y && v === "structure" && /* @__PURE__ */ B(d, {
						label: "Read with",
						hint: "One of your characters that can dock there and use its market. It must stay logged in here.",
						children: /* @__PURE__ */ V(g, {
							value: l.esi_character_id ?? "",
							onChange: (e) => u({ esi_character_id: Number(e.target.value) || null }),
							children: [
								/* @__PURE__ */ B("option", {
									value: "",
									children: "Pick a character…"
								}),
								l.esi_character && !l.characters.some((e) => e.id === l.esi_character.id) && /* @__PURE__ */ B("option", {
									value: l.esi_character.id,
									children: l.esi_character.name
								}),
								l.characters.map((e) => /* @__PURE__ */ V("option", {
									value: e.id,
									children: [e.name, e.can_read ? "" : " - login needed"]
								}, e.id))
							]
						})
					}),
					y && r?.price_source === "esi" && /* @__PURE__ */ B("p", {
						className: "text-xs text-muted",
						children: r.market_pulled_at ? /* @__PURE__ */ V(z, { children: [
							"Last read ",
							oe(r.market_pulled_at),
							": ",
							r.market_note
						] }) : r.market_note || "Not read yet; the first read starts within a minute."
					}),
					r && r.markets.length > 1 && /* @__PURE__ */ V("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ B("div", {
							className: "text-[13px] font-medium text-text",
							children: "Programs' own markets"
						}), /* @__PURE__ */ B("ul", {
							className: "divide-y divide-border border border-border text-sm",
							children: r.markets.slice(1).map((e) => /* @__PURE__ */ V("li", {
								className: "px-3 py-2",
								children: [/* @__PURE__ */ V("div", {
									className: "flex flex-wrap justify-between gap-2",
									children: [/* @__PURE__ */ B("span", {
										className: "font-medium",
										children: e.name
									}), /* @__PURE__ */ B("span", {
										className: "text-xs text-subtle",
										children: e.programs.join(", ")
									})]
								}), /* @__PURE__ */ V("div", {
									className: "text-xs text-muted",
									children: [
										M(e.prices),
										" prices",
										r.price_source === "esi" && /* @__PURE__ */ V(z, { children: [" · ", e.pulled_at ? /* @__PURE__ */ V(z, { children: [
											"read ",
											oe(e.pulled_at),
											e.note && `: ${e.note}`
										] }) : e.note || "not read yet"] })
									]
								})]
							}, e.id))
						})]
					}),
					/* @__PURE__ */ B("div", {
						className: "border border-border px-3",
						children: /* @__PURE__ */ B(x, {
							label: "Best order instead of the top 5% average",
							description: "Instant prices move faster and are easier to manipulate.",
							checked: l.instant_prices,
							onCheckedChange: (e) => u({ instant_prices: e })
						})
					}),
					!y && /* @__PURE__ */ B(d, {
						label: "Maximum price age",
						children: /* @__PURE__ */ V("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ B(f, {
								type: "number",
								value: l.price_max_age_hours,
								onChange: (e) => u({ price_max_age_hours: Number(e.target.value) }),
								className: "w-28 font-mono"
							}), /* @__PURE__ */ B("span", {
								className: "text-sm text-subtle",
								children: "hours"
							})]
						})
					}),
					/* @__PURE__ */ B("p", {
						className: "text-xs text-subtle",
						children: "Changing the source, market or price kind clears the stored prices; they're read again as needed."
					})
				]
			})] }), /* @__PURE__ */ V("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, {
					title: "Manipulation guard",
					description: `Every market price is checked against what the item actually traded for lately${r?.history_region ? ` in ${r.history_region}` : ""}, so a propped-up order can't make you overpay.`
				}), /* @__PURE__ */ V(a, {
					className: "space-y-5",
					children: [/* @__PURE__ */ B("div", {
						className: "border border-border px-3",
						children: /* @__PURE__ */ B(x, {
							label: "Check prices against recent trading",
							checked: l.guard_enabled,
							onCheckedChange: (e) => u({ guard_enabled: e })
						})
					}), l.guard_enabled && /* @__PURE__ */ V(z, { children: [
						/* @__PURE__ */ V("div", {
							className: "grid gap-4 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ B($, {
									label: "Suspect above",
									value: l.guard_threshold,
									onChange: (e) => u({ guard_threshold: e }),
									step: 5,
									suffix: "% off"
								}),
								/* @__PURE__ */ B($, {
									label: "Average over",
									value: l.guard_days,
									onChange: (e) => u({ guard_days: e }),
									suffix: "days"
								}),
								/* @__PURE__ */ B($, {
									label: "Trusted if it traded on",
									value: l.guard_min_days,
									onChange: (e) => u({ guard_min_days: e }),
									suffix: "days"
								})
							]
						}),
						/* @__PURE__ */ V("ul", {
							className: "space-y-1.5 text-sm text-muted",
							children: [
								/* @__PURE__ */ V("li", { children: [
									"A price more than ",
									/* @__PURE__ */ V("span", {
										className: "font-mono text-text",
										children: [l.guard_threshold, "%"]
									}),
									" above the ",
									l.guard_days,
									"-day average is suspect."
								] }),
								/* @__PURE__ */ V("li", { children: [
									"If the item traded on ",
									l.guard_min_days,
									" or more of those days, the average is used instead."
								] }),
								/* @__PURE__ */ B("li", { children: "If it rarely trades, the lower of the two is used and the item is checked by hand, like the manual review list." })
							]
						}),
						/* @__PURE__ */ B("div", {
							className: "border border-border px-3",
							children: /* @__PURE__ */ B(x, {
								label: "Also prices far below the average",
								description: "Off by default: buy prices normally sit below the average, and a low price only costs the seller. On, sellers get the average when the market dips.",
								checked: l.guard_both_ways,
								onCheckedChange: (e) => u({ guard_both_ways: e })
							})
						}),
						r && !r.history_region && /* @__PURE__ */ B("p", {
							className: "text-sm text-warning-fg",
							children: "The market's region isn't known yet, so prices aren't checked."
						})
					] })]
				})] }), /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, { title: "Quotes and tracking" }), /* @__PURE__ */ V(a, {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ B(d, {
							label: "Tracking prefix",
							hint: "Starts every tracking number (programs can have their own).",
							children: /* @__PURE__ */ B(f, {
								value: l.tracking_prefix,
								onChange: (e) => u({ tracking_prefix: e.target.value }),
								className: "w-40 font-mono"
							})
						}),
						/* @__PURE__ */ B(d, {
							label: "Remove quotes nobody contracted after",
							hint: "0 keeps them.",
							children: /* @__PURE__ */ V("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ B(f, {
									type: "number",
									value: l.unlinked_purge_hours,
									onChange: (e) => u({ unlinked_purge_hours: Number(e.target.value) }),
									className: "w-28 font-mono"
								}), /* @__PURE__ */ B("span", {
									className: "text-sm text-subtle",
									children: "hours"
								})]
							})
						}),
						/* @__PURE__ */ V("div", {
							className: "divide-y divide-border border border-border px-3",
							children: [/* @__PURE__ */ B(x, {
								label: "All or nothing",
								description: "A paste with any item a program doesn't buy gets no quote at all.",
								checked: l.reject_disallowed,
								onCheckedChange: (e) => u({ reject_disallowed: e })
							}), /* @__PURE__ */ B(x, {
								label: "Private quotes",
								description: "Only the seller and the program's managers can open a quote. Off: any member with the tracking number.",
								checked: l.restrict_quotes,
								onCheckedChange: (e) => u({ restrict_quotes: e })
							})]
						})
					]
				})] })]
			})]
		})
	] });
}
function ht() {
	let { data: t, isLoading: n } = F({
		queryKey: ["buyback", "manage"],
		queryFn: () => D.get(`${q}/manage`),
		refetchInterval: 3e5
	});
	if (n || !t) return /* @__PURE__ */ B(_, { className: "h-16" });
	let r = t.programs.reduce((e, t) => e + t.open, 0), i = t.programs.reduce((e, t) => e + t.problems, 0), a = t.programs.reduce((e, t) => e + t.open_value, 0);
	return /* @__PURE__ */ B(L, {
		to: Q,
		className: "block",
		children: /* @__PURE__ */ V("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ V("div", { children: [
				/* @__PURE__ */ B("div", {
					className: "text-xs text-muted",
					children: "Buyback contracts to accept"
				}),
				/* @__PURE__ */ B("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: r
				}),
				/* @__PURE__ */ B("div", {
					className: "text-xs text-subtle",
					children: j(a)
				})
			] }), i > 0 ? /* @__PURE__ */ V(e, {
				tone: "danger",
				children: [i, " need a look"]
			}) : /* @__PURE__ */ B(e, {
				tone: "success",
				children: "All match"
			})]
		})
	});
}
//#endregion
//#region src/market.tsx
var gt = `${X}/manage`;
function _t(e) {
	return F({
		queryKey: [
			"buyback",
			"managed",
			e
		],
		queryFn: () => D.get(`${q}/manage/programs/${e}`)
	});
}
function vt(e) {
	let t = ce();
	return (n) => {
		t.setQueryData([
			"buyback",
			"managed",
			e
		], (e) => e && {
			...e,
			...n
		}), t.invalidateQueries({ queryKey: [
			"buyback",
			"market",
			e
		] });
	};
}
function yt() {
	let { id: e } = R(), { data: t } = _t(e), [n, r] = I(null);
	return t ? /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(Z, {
			to: `${gt}/${e}`,
			children: t.name
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(xe, {}),
			title: "Items",
			description: t.allow_all_items ? `Everything is bought at the program's terms (${t.tax}% tax). Click an item or a category to give it its own: extra tax (or less), a fixed price, or not bought.` : "Only the items and categories you add here are bought. Click one to add it.",
			actions: /* @__PURE__ */ V(L, {
				to: `${gt}/${e}/edit`,
				className: O({ variant: "secondary" }),
				children: [/* @__PURE__ */ B(ye, {}), " Program terms"]
			})
		}),
		/* @__PURE__ */ V("div", {
			className: "grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]",
			children: [/* @__PURE__ */ B(xt, {
				programId: e,
				onOpen: r
			}), /* @__PURE__ */ B(kt, {
				program: t,
				onOpen: r
			})]
		}),
		n && /* @__PURE__ */ B(Nt, {
			program: t,
			subject: n,
			onClose: () => r(null)
		}, bt(n))
	] }) : /* @__PURE__ */ B(_, { className: "h-96" });
}
var bt = (e) => e.kind === "type" ? `t${e.id}` : `g${e.path.at(-1)?.id}`;
function xt({ programId: e, onOpen: t }) {
	let [r, a] = I(""), [o, s] = I(/* @__PURE__ */ new Set()), c = r.trim().length >= 2;
	return /* @__PURE__ */ V(i, {
		className: "flex h-[calc(100vh-14rem)] min-h-[480px] flex-col overflow-hidden",
		children: [
			/* @__PURE__ */ V("div", {
				className: "flex items-center gap-3 border-b border-border bg-surface-2 px-3 py-2",
				children: [
					/* @__PURE__ */ B("span", {
						className: "hud-label shrink-0 text-subtle",
						children: "Market"
					}),
					/* @__PURE__ */ B(m, {
						value: r,
						onChange: (e) => a(e.target.value),
						placeholder: "Search the market…",
						className: "w-full"
					}),
					!c && o.size > 0 && /* @__PURE__ */ B(n, {
						size: "xs",
						variant: "ghost",
						onClick: () => s(/* @__PURE__ */ new Set()),
						children: "Collapse"
					})
				]
			}),
			/* @__PURE__ */ B("div", {
				className: "min-h-0 flex-1 overflow-y-auto py-1 text-[13px]",
				role: "tree",
				children: c ? /* @__PURE__ */ B(Ot, {
					programId: e,
					q: r.trim(),
					onOpen: t
				}) : /* @__PURE__ */ B(Ct, {
					programId: e,
					group: null,
					path: [],
					depth: 0,
					open: o,
					toggle: (e) => s((t) => {
						let n = new Set(t);
						return n.has(e) ? n.delete(e) : n.add(e), n;
					}),
					onOpen: t
				})
			}),
			/* @__PURE__ */ B(St, {})
		]
	});
}
function St() {
	return /* @__PURE__ */ V("div", {
		className: "flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-surface-2 px-3 py-1.5 text-[11px] text-subtle",
		children: [
			/* @__PURE__ */ V("span", {
				className: "flex items-center gap-1.5",
				children: [/* @__PURE__ */ B(e, {
					tone: "accent",
					children: "own"
				}), " its own terms"]
			}),
			/* @__PURE__ */ V("span", {
				className: "flex items-center gap-1.5",
				children: [/* @__PURE__ */ B("span", {
					className: "opacity-60",
					children: "+5% tax"
				}), " from a category above"]
			}),
			/* @__PURE__ */ V("span", {
				className: "flex items-center gap-1.5",
				children: [/* @__PURE__ */ B(W, { className: "size-3.5 text-warning-fg" }), " checked by hand"]
			})
		]
	});
}
function Ct({ programId: e, group: t, path: n, depth: r, open: i, toggle: a, onOpen: o }) {
	let { data: s, isLoading: c } = F({
		queryKey: [
			"buyback",
			"market",
			e,
			t ?? "top"
		],
		queryFn: () => D.get(`${q}/manage/programs/${e}/market${t == null ? "" : `?group=${t}`}`),
		staleTime: 6e4
	});
	return c || !s ? /* @__PURE__ */ V("div", {
		className: "flex items-center gap-2 py-1 text-subtle",
		style: { paddingLeft: wt(r) },
		children: [/* @__PURE__ */ B(v, { className: "size-3.5" }), " Loading…"]
	}) : /* @__PURE__ */ V(z, { children: [s.groups.map((t) => {
		let s = [...n, {
			id: t.id,
			name: t.name,
			count: t.count
		}], c = i.has(t.id);
		return /* @__PURE__ */ V("div", {
			role: "treeitem",
			"aria-expanded": c,
			children: [/* @__PURE__ */ B(Et, {
				node: t,
				depth: r,
				expanded: c,
				onToggle: () => a(t.id),
				onOpen: () => o({
					kind: "group",
					path: s
				})
			}), c && /* @__PURE__ */ B(Ct, {
				programId: e,
				group: t.id,
				path: s,
				depth: r + 1,
				open: i,
				toggle: a,
				onOpen: o
			})]
		}, t.id);
	}), s.types.map((e) => /* @__PURE__ */ B(Dt, {
		node: e,
		depth: r,
		onOpen: () => o({
			kind: "type",
			id: e.id,
			name: e.name,
			icon: e.icon,
			path: n
		})
	}, e.id))] });
}
var wt = (e) => 8 + e * 16;
function Tt({ node: t }) {
	return /* @__PURE__ */ V("span", {
		className: "flex shrink-0 items-center gap-1.5",
		children: [(t.watch || t.watched) && /* @__PURE__ */ B(W, { className: k("size-3.5 text-warning-fg", !t.watch && "opacity-50") }), t.rule ? /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(e, {
			tone: "accent",
			size: "sm",
			children: "own"
		}), /* @__PURE__ */ B(Be, { terms: t.rule })] }) : t.effective && /* @__PURE__ */ B(Be, {
			terms: t.effective,
			inherited: !0
		})]
	});
}
function Et({ node: e, depth: t, expanded: n, onToggle: r, onOpen: i }) {
	return /* @__PURE__ */ V("div", {
		className: "group/row flex h-7 items-center gap-1 pr-2 hover:bg-hover",
		style: { paddingLeft: wt(t) },
		children: [
			/* @__PURE__ */ V("button", {
				type: "button",
				onClick: r,
				className: "flex min-w-0 flex-1 items-center gap-1.5 text-left",
				"aria-label": `${n ? "Close" : "Open"} ${e.name}`,
				children: [
					/* @__PURE__ */ B(Ce, { className: k("size-3.5 shrink-0 text-subtle transition-transform", n && "rotate-90") }),
					n ? /* @__PURE__ */ B(we, { className: "size-4 shrink-0 text-accent-ink" }) : /* @__PURE__ */ B(K, { className: "size-4 shrink-0 text-muted" }),
					/* @__PURE__ */ B("span", {
						className: "truncate",
						children: e.name
					}),
					/* @__PURE__ */ B("span", {
						className: "shrink-0 text-[11px] text-subtle",
						children: e.count
					})
				]
			}),
			/* @__PURE__ */ B(Tt, { node: e }),
			/* @__PURE__ */ B("button", {
				type: "button",
				onClick: i,
				className: "ml-1 shrink-0 px-1.5 py-0.5 text-[11px] text-accent-ink opacity-0 hover:underline focus:opacity-100 group-hover/row:opacity-100",
				children: "Set terms"
			})
		]
	});
}
function Dt({ node: e, depth: t, sub: n, onOpen: r }) {
	return /* @__PURE__ */ V("button", {
		type: "button",
		role: "treeitem",
		onClick: r,
		className: "flex min-h-7 w-full items-center gap-2 py-0.5 pr-2 text-left hover:bg-hover",
		style: { paddingLeft: wt(t) + 18 },
		children: [
			/* @__PURE__ */ B("img", {
				src: e.icon,
				alt: "",
				loading: "lazy",
				className: "size-6 shrink-0 border border-border bg-bg"
			}),
			/* @__PURE__ */ V("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ B("span", {
					className: "block truncate",
					children: e.name
				}), n && /* @__PURE__ */ B("span", {
					className: "block truncate text-[11px] text-subtle",
					children: n
				})]
			}),
			/* @__PURE__ */ B(Tt, { node: e })
		]
	});
}
function Ot({ programId: e, q: t, onOpen: n }) {
	let { data: r, isLoading: i } = F({
		queryKey: [
			"buyback",
			"market",
			e,
			"search",
			t
		],
		queryFn: () => D.get(`${q}/manage/programs/${e}/market/search?q=${encodeURIComponent(t)}`),
		placeholderData: (e) => e
	});
	if (i || !r) return /* @__PURE__ */ V("div", {
		className: "flex items-center gap-2 px-3 py-2 text-subtle",
		children: [/* @__PURE__ */ B(v, { className: "size-3.5" }), " Searching…"]
	});
	if (!r.groups.length && !r.types.length) return /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(G, {}),
		title: "Nothing found",
		description: "Only items sold on the market are listed."
	});
	let a = (e) => (e ?? []).map((e) => e.name).join(" › ");
	return /* @__PURE__ */ V(z, { children: [r.groups.length > 0 && /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B("div", {
		className: "hud-label px-3 pb-1 pt-2 text-[11px] text-subtle",
		children: "Categories"
	}), r.groups.map((e) => /* @__PURE__ */ V("button", {
		type: "button",
		onClick: () => n({
			kind: "group",
			path: [...e.path ?? [], {
				id: e.id,
				name: e.name,
				count: e.count
			}]
		}),
		className: "flex min-h-7 w-full items-center gap-2 py-0.5 pl-2 pr-2 text-left hover:bg-hover",
		children: [
			/* @__PURE__ */ B(K, { className: "size-4 shrink-0 text-muted" }),
			/* @__PURE__ */ V("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ V("span", {
					className: "block truncate",
					children: [
						e.name,
						" ",
						/* @__PURE__ */ B("span", {
							className: "text-[11px] text-subtle",
							children: e.count
						})
					]
				}), e.path?.length ? /* @__PURE__ */ B("span", {
					className: "block truncate text-[11px] text-subtle",
					children: a(e.path)
				}) : null]
			}),
			/* @__PURE__ */ B(Tt, { node: e })
		]
	}, e.id))] }), r.types.length > 0 && /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B("div", {
		className: "hud-label px-3 pb-1 pt-2 text-[11px] text-subtle",
		children: "Items"
	}), r.types.map((e) => /* @__PURE__ */ B(Dt, {
		node: e,
		depth: -1,
		sub: a(e.path),
		onOpen: () => n({
			kind: "type",
			id: e.id,
			name: e.name,
			icon: e.icon,
			path: e.path ?? []
		})
	}, e.id))] })] });
}
function kt({ program: e, onOpen: t }) {
	let r = String(e.id), a = vt(r), [o, c] = I(e.group_rules.length || !e.item_rules.length ? "groups" : "items"), [l, u] = I(""), [d, f] = I(!1), p = P({
		mutationFn: (e) => D.post(`${q}/manage/programs/${r}/rules`, {
			...e,
			rule: null
		}),
		onSuccess: a,
		onError: (e) => N.error(e.message)
	}), h = P({
		mutationFn: (e) => D.delete(`${q}/manage/programs/${r}/watchlist/${e}`),
		onSuccess: (t) => a({
			item_rules: e.item_rules,
			group_rules: e.group_rules,
			watch_rules: t
		})
	}), g = P({
		mutationFn: () => D.delete(`${q}/manage/programs/${r}/items`),
		onSuccess: a
	}), _ = l.toLowerCase(), v = (e) => e.toLowerCase().includes(_), y = (e) => e.map((e) => e.name).join(" › ") || "Market", b = e.group_rules.filter((e) => v(e.name)), x = e.item_rules.filter((e) => v(e.name)), S = e.watch_rules.filter((e) => v(e.name)), C = e.group_rules.length + e.item_rules.length;
	return /* @__PURE__ */ V(i, {
		className: "flex h-[calc(100vh-14rem)] min-h-[480px] flex-col overflow-hidden",
		children: [
			/* @__PURE__ */ V("div", {
				className: "space-y-2 border-b border-border px-4 py-3",
				children: [
					/* @__PURE__ */ V("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ B("div", {
							className: "hud-label text-subtle",
							children: "This program"
						}), C > 0 && /* @__PURE__ */ V(n, {
							size: "xs",
							variant: "ghost",
							onClick: () => f(!0),
							children: [/* @__PURE__ */ B(me, {}), " Remove all terms"]
						})]
					}),
					/* @__PURE__ */ B("p", {
						className: "text-xs text-muted",
						children: e.allow_all_items ? /* @__PURE__ */ V(z, { children: [
							"Anything not listed here is bought at ",
							/* @__PURE__ */ V("span", {
								className: "font-mono text-text",
								children: [e.tax, "%"]
							}),
							" tax."
						] }) : /* @__PURE__ */ V(z, { children: [
							"Nothing else is bought: ",
							/* @__PURE__ */ B("span", {
								className: "text-text",
								children: "Buy every item"
							}),
							" is off in the program's pricing."
						] })
					}),
					/* @__PURE__ */ B(ee, {
						size: "sm",
						value: o,
						onChange: c,
						options: [
							{
								value: "groups",
								label: `Categories ${e.group_rules.length}`
							},
							{
								value: "items",
								label: `Items ${e.item_rules.length}`
							},
							{
								value: "watch",
								label: `Manual review ${e.watch_rules.length}`
							}
						]
					}),
					/* @__PURE__ */ B(m, {
						value: l,
						onChange: (e) => u(e.target.value),
						placeholder: "Filter"
					})
				]
			}),
			/* @__PURE__ */ V("ul", {
				className: "min-h-0 flex-1 divide-y divide-border overflow-y-auto",
				children: [
					o === "groups" && (b.length === 0 ? /* @__PURE__ */ B(At, { text: e.group_rules.length ? "No match" : "No categories yet. In the market, hover a category and Set terms, or click an item and pick its category." }) : b.map((e) => /* @__PURE__ */ B(jt, {
						icon: /* @__PURE__ */ B(K, { className: "size-4 text-muted" }),
						name: /* @__PURE__ */ V(z, { children: [
							e.name,
							" ",
							/* @__PURE__ */ V("span", {
								className: "text-[11px] text-subtle",
								children: [e.count, " items"]
							})
						] }),
						sub: y(e.path),
						terms: /* @__PURE__ */ B(Be, { terms: e }),
						onEdit: () => t({
							kind: "group",
							path: [...e.path, {
								id: e.market_group_id,
								name: e.name,
								count: e.count
							}]
						}),
						onRemove: () => p.mutate({ market_group_id: e.market_group_id })
					}, e.market_group_id))),
					o === "items" && (x.length === 0 ? /* @__PURE__ */ B(At, { text: e.item_rules.length ? "No match" : "No items with their own terms. Click an item in the market." }) : x.map((e) => /* @__PURE__ */ B(jt, {
						icon: /* @__PURE__ */ B("img", {
							src: e.icon,
							alt: "",
							className: "size-6 border border-border bg-bg",
							loading: "lazy"
						}),
						name: e.name,
						sub: y(e.path),
						terms: /* @__PURE__ */ B(Be, { terms: e }),
						onEdit: () => t({
							kind: "type",
							id: e.type_id,
							name: e.name,
							icon: e.icon,
							path: e.path
						}),
						onRemove: () => p.mutate({ type_id: e.type_id })
					}, e.type_id))),
					o === "watch" && (S.length === 0 ? /* @__PURE__ */ B(At, { text: e.watch_rules.length ? "No match" : "Nothing is checked by hand. Officer modules, rare loot, anything easy to manipulate: tick Check by hand when setting its terms." }) : S.map((e) => /* @__PURE__ */ B(jt, {
						icon: e.icon ? /* @__PURE__ */ B("img", {
							src: e.icon,
							alt: "",
							className: "size-6 border border-border bg-bg",
							loading: "lazy"
						}) : /* @__PURE__ */ B(K, { className: "size-4 text-muted" }),
						name: /* @__PURE__ */ V(z, { children: [
							e.name,
							" ",
							e.kind === "market" && /* @__PURE__ */ V("span", {
								className: "text-[11px] text-subtle",
								children: [e.count, " items"]
							})
						] }),
						sub: e.kind === "group" ? "Item group" : y(e.path),
						terms: /* @__PURE__ */ B(W, { className: "size-3.5 text-warning-fg" }),
						onEdit: e.kind === "group" ? void 0 : () => t(e.kind === "type" ? {
							kind: "type",
							id: e.target_id,
							name: e.name,
							icon: e.icon ?? "",
							path: e.path
						} : {
							kind: "group",
							path: [...e.path, {
								id: e.target_id,
								name: e.name,
								count: e.count ?? 0
							}]
						}),
						onRemove: () => h.mutate(e.id)
					}, e.id)))
				]
			}),
			/* @__PURE__ */ V("p", {
				className: "flex items-center gap-1.5 border-t border-border bg-surface-2 px-4 py-2 text-[11px] text-subtle",
				children: [/* @__PURE__ */ B(W, { className: "size-3.5" }), " Sellers see which of their items will be checked by hand."]
			}),
			/* @__PURE__ */ B(s, {
				open: d,
				onOpenChange: f,
				title: "Remove every item and category's terms?",
				description: e.allow_all_items ? "Everything goes back to the program's terms. The manual review list stays." : "The program won't buy anything until you add items again.",
				confirmLabel: "Remove all",
				danger: !0,
				onConfirm: () => g.mutateAsync()
			})
		]
	});
}
function At({ text: e }) {
	return /* @__PURE__ */ B("li", {
		className: "px-4 py-6 text-center text-sm text-subtle",
		children: e
	});
}
function jt({ icon: e, name: t, sub: r, terms: i, onEdit: a, onRemove: o }) {
	return /* @__PURE__ */ V("li", {
		className: "flex items-center gap-2.5 px-4 py-2",
		children: [
			/* @__PURE__ */ B("span", {
				className: "flex size-6 shrink-0 items-center justify-center",
				children: e
			}),
			/* @__PURE__ */ V("button", {
				type: "button",
				className: "min-w-0 flex-1 text-left disabled:cursor-default",
				onClick: a,
				disabled: !a,
				children: [/* @__PURE__ */ B("span", {
					className: "block truncate text-sm",
					children: t
				}), /* @__PURE__ */ B("span", {
					className: "block truncate text-[11px] text-subtle",
					children: r
				})]
			}),
			/* @__PURE__ */ B("span", {
				className: "shrink-0",
				children: i
			}),
			/* @__PURE__ */ B(n, {
				size: "icon-xs",
				variant: "ghost",
				"aria-label": "Remove",
				onClick: o,
				children: /* @__PURE__ */ B(me, {})
			})
		]
	});
}
function Mt(e) {
	let t = e.path.map((t, n) => ({
		kind: "group",
		id: t.id,
		name: t.name,
		count: t.count,
		above: e.path.slice(0, n)
	})).reverse();
	return e.kind === "type" ? [{
		kind: "type",
		id: e.id,
		name: e.name,
		icon: e.icon
	}, ...t] : t;
}
function Nt({ program: e, subject: t, onClose: r }) {
	let i = String(e.id), a = vt(i), o = Mt(t), [s, c] = I(0), u = o[s], p = Pt(e, u), m = e.watch_rules.some((e) => (u.kind === "type" ? e.kind === "type" : e.kind === "market") && e.target_id === u.id), [h, g] = I(() => It(p, m)), _ = (t) => {
		c(t);
		let n = o[t];
		g(It(Pt(e, n), e.watch_rules.some((e) => (n.kind === "type" ? e.kind === "type" : e.kind === "market") && e.target_id === n.id)));
	}, v = Ft(e, o.slice(s + 1)), y = u.kind === "type" ? { type_id: u.id } : { market_group_id: u.id }, b = P({
		mutationFn: (e) => D.post(`${q}/manage/programs/${i}/rules`, {
			...y,
			rule: e,
			watch: h.watch
		}),
		onSuccess: (e, t) => {
			a(e), N.success(t ? `${u.name}: ${Lt(t)}${u.kind === "group" ? `, ${u.count} items` : ""}` : `${u.name}: back to ${v ? v.label : "the program's terms"}`), r();
		},
		onError: (e) => N.error(e.message)
	}), S = {
		tax: h.mode === "buy" && Number(h.tax) || 0,
		disallowed: h.mode === "none",
		static_price: h.mode === "fixed" ? Number(h.price) || 0 : null
	}, C = o[0];
	return /* @__PURE__ */ B(l, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		size: "lg",
		title: /* @__PURE__ */ V("span", {
			className: "flex items-center gap-3",
			children: [C.kind === "type" ? /* @__PURE__ */ B("img", {
				src: C.icon,
				alt: "",
				className: "size-10 border border-border bg-bg"
			}) : /* @__PURE__ */ B("span", {
				className: "flex size-10 items-center justify-center border border-border bg-surface-2",
				children: /* @__PURE__ */ B(K, { className: "size-5 text-muted" })
			}), /* @__PURE__ */ V("span", {
				className: "min-w-0",
				children: [/* @__PURE__ */ B("span", {
					className: "block truncate",
					children: C.name
				}), /* @__PURE__ */ B("span", {
					className: "block truncate text-xs font-normal text-subtle",
					children: t.path.map((e) => e.name).join(" › ") || "Market"
				})]
			})]
		}),
		footer: /* @__PURE__ */ V(z, { children: [
			p && /* @__PURE__ */ V(n, {
				variant: "ghost",
				className: "mr-auto",
				loading: b.isPending && b.variables === null,
				onClick: () => b.mutate(null),
				children: [/* @__PURE__ */ B(me, {}), " Remove its terms"]
			}),
			/* @__PURE__ */ B(n, {
				variant: "ghost",
				onClick: r,
				children: "Cancel"
			}),
			/* @__PURE__ */ B(n, {
				variant: "primary",
				loading: b.isPending && b.variables !== null,
				onClick: () => b.mutate(S),
				children: p ? "Save" : C.kind === "type" && s === 0 ? "Add item" : "Add category"
			})
		] }),
		children: /* @__PURE__ */ V("div", {
			className: "space-y-5",
			children: [
				o.length > 1 && /* @__PURE__ */ B(d, {
					label: C.kind === "type" ? "Add just this item, or its entire category?" : "This category, or a wider one?",
					children: /* @__PURE__ */ B("div", {
						className: "space-y-1.5",
						role: "radiogroup",
						children: o.map((t, n) => {
							let r = n === s, i = Pt(e, t);
							return /* @__PURE__ */ V("button", {
								type: "button",
								role: "radio",
								"aria-checked": r,
								onClick: () => _(n),
								className: k("flex w-full items-center gap-3 border px-3 py-2 text-left transition", r ? "border-accent bg-accent-soft" : "border-border hover:bg-hover"),
								children: [
									/* @__PURE__ */ B("span", {
										className: k("flex size-4 shrink-0 items-center justify-center rounded-full border", r ? "border-accent" : "border-border-strong"),
										children: r && /* @__PURE__ */ B("span", { className: "size-2 rounded-full bg-accent" })
									}),
									t.kind === "type" ? /* @__PURE__ */ B("img", {
										src: t.icon,
										alt: "",
										className: "size-6 border border-border bg-bg"
									}) : /* @__PURE__ */ B(K, { className: "size-5 shrink-0 text-muted" }),
									/* @__PURE__ */ V("span", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ B("span", {
											className: k("block truncate text-sm font-medium", r && "text-accent-ink"),
											children: t.kind === "type" ? `Just ${t.name}` : `Entire ${t.name} category`
										}), /* @__PURE__ */ B("span", {
											className: "block truncate text-xs text-subtle",
											children: t.kind === "type" ? "This item only" : `${t.count} item${t.count === 1 ? "" : "s"}${t.above.length ? ` · in ${t.above.map((e) => e.name).join(" › ")}` : ""}`
										})]
									}),
									i && /* @__PURE__ */ B(Be, { terms: i })
								]
							}, `${t.kind}${t.id}`);
						})
					})
				}),
				/* @__PURE__ */ V("div", {
					className: "border border-border bg-surface-2 px-3 py-2 text-xs text-muted",
					children: [p ? /* @__PURE__ */ V(z, { children: [
						"Now: ",
						/* @__PURE__ */ B("span", {
							className: "text-text",
							children: Lt(p)
						}),
						", its own terms."
					] }) : v ? /* @__PURE__ */ V(z, { children: [
						"Now: ",
						/* @__PURE__ */ B("span", {
							className: "text-text",
							children: Lt(v.terms)
						}),
						", from ",
						v.label,
						"."
					] }) : /* @__PURE__ */ V(z, { children: [
						"Now: ",
						e.allow_all_items ? /* @__PURE__ */ V(z, { children: [
							"the program's terms (",
							/* @__PURE__ */ V("span", {
								className: "font-mono",
								children: [e.tax, "%"]
							}),
							" tax)"
						] }) : /* @__PURE__ */ B("span", {
							className: "text-text",
							children: "not bought"
						}),
						"."
					] }), u.kind === "group" && " Items and categories inside it with terms of their own keep them."]
				}),
				/* @__PURE__ */ B(d, {
					label: "Terms",
					children: /* @__PURE__ */ B(ee, {
						value: h.mode,
						onChange: (e) => g({
							...h,
							mode: e
						}),
						options: [
							{
								value: "buy",
								label: "Buy"
							},
							...u.kind === "type" ? [{
								value: "fixed",
								label: "Fixed price"
							}] : [],
							{
								value: "none",
								label: "Don't buy"
							}
						]
					})
				}),
				h.mode === "buy" && /* @__PURE__ */ B(d, {
					label: "Extra tax",
					hint: `On top of the program's ${e.tax}%. Negative for less; 0 buys it at the program's terms${e.allow_all_items ? "" : " (and adds it to the list)"}.`,
					children: /* @__PURE__ */ V("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ B(f, {
							type: "number",
							step: .5,
							value: h.tax,
							onChange: (e) => g({
								...h,
								tax: e.target.value
							}),
							className: "w-32 font-mono",
							autoFocus: !0
						}), /* @__PURE__ */ V("span", {
							className: "text-sm text-subtle",
							children: [
								"% → ",
								Math.min(100, Math.max(-100, e.tax + (Number(h.tax) || 0))),
								"% in all"
							]
						})]
					})
				}),
				h.mode === "fixed" && /* @__PURE__ */ B(d, {
					label: "Price",
					hint: "ISK per unit, with no tax or hauling taken off.",
					children: /* @__PURE__ */ V("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ B(f, {
							type: "number",
							min: 0,
							value: h.price,
							onChange: (e) => g({
								...h,
								price: e.target.value
							}),
							className: "w-44 font-mono",
							autoFocus: !0
						}), /* @__PURE__ */ V("span", {
							className: "text-sm text-subtle",
							children: ["ISK each", Number(h.price) > 0 && /* @__PURE__ */ V(z, { children: [" · ", j(Number(h.price), { full: !0 })] })]
						})]
					})
				}),
				h.mode === "none" && /* @__PURE__ */ B("p", {
					className: "text-sm text-muted",
					children: "Sellers see it as not bought on their quote."
				}),
				/* @__PURE__ */ B("div", {
					className: "border border-border px-3",
					children: /* @__PURE__ */ B(x, {
						label: "Check by hand",
						description: "Quotes and contracts with it are flagged for manual review (officer modules, rare loot, anything easy to manipulate).",
						checked: h.watch,
						onCheckedChange: (e) => g({
							...h,
							watch: e
						})
					})
				})
			]
		})
	});
}
function Pt(e, t) {
	return t.kind === "type" ? e.item_rules.find((e) => e.type_id === t.id) ?? null : e.group_rules.find((e) => e.market_group_id === t.id) ?? null;
}
function Ft(e, t) {
	for (let n of t) {
		let t = Pt(e, n);
		if (t) return {
			terms: t,
			label: `the ${n.name} category`
		};
	}
	return null;
}
function It(e, t) {
	return {
		mode: e?.disallowed ? "none" : e?.static_price == null ? "buy" : "fixed",
		tax: String(e && !e.disallowed ? e.tax : 0),
		price: e?.static_price == null ? "" : String(e.static_price),
		watch: t
	};
}
function Lt(e) {
	return e.disallowed ? "not bought" : e.static_price == null ? e.tax ? `${e.tax > 0 ? "+" : ""}${e.tax}% tax` : "bought at the program's terms" : `${j(e.static_price, { full: !0 })} each`;
}
//#endregion
//#region src/public.tsx
var Rt = "/public/p/buyback";
function zt() {
	let { data: e, isLoading: t } = F({
		queryKey: [
			"buyback",
			"public",
			"programs"
		],
		queryFn: () => D.get(`${Te}/programs`)
	});
	return /* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B(p, {
		icon: /* @__PURE__ */ B(U, {}),
		eyebrow: "Buyback",
		title: "Sell to us",
		description: "Paste your items for an instant quote, then contract them in game."
	}), t ? /* @__PURE__ */ B(_, { className: "h-56" }) : e?.programs.length ? /* @__PURE__ */ B("div", {
		className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
		children: e.programs.map((e) => /* @__PURE__ */ B(Ge, {
			program: e,
			to: `${Rt}/${e.id}`
		}, e.id))
	}) : /* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(U, {}),
		title: "No public buyback programs"
	}) })] });
}
function Bt() {
	let { id: e } = R(), { data: t, isLoading: n } = F({
		queryKey: [
			"buyback",
			"public",
			"program",
			e
		],
		queryFn: () => D.get(`${Te}/programs/${e}`)
	});
	return n ? /* @__PURE__ */ B(_, { className: "h-96" }) : t ? /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(Z, {
			to: Rt,
			children: "All programs"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(U, {}),
			eyebrow: `Buyback · ${t.tax}% tax · priced at ${t.prices.hub}`,
			title: t.name,
			description: t.description || void 0
		}),
		/* @__PURE__ */ B(ze, {
			program: t,
			base: Te,
			quoteLink: (e) => `${Rt}/quotes/${e}`
		})
	] }) : /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(U, {}),
		title: "No such program",
		description: "It may be closed, or no longer public."
	});
}
function Vt() {
	let { tracking: e } = R(), { data: t, isLoading: n } = F({
		queryKey: [
			"buyback",
			"public",
			"quote",
			e
		],
		queryFn: () => D.get(`${Te}/quotes/${e}`)
	});
	return n ? /* @__PURE__ */ B(_, { className: "h-96" }) : t ? /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(Z, {
			to: `${Rt}/${t.program.id}`,
			children: t.program.name
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(G, {}),
			eyebrow: t.program.name,
			title: /* @__PURE__ */ V("span", {
				className: "inline-flex flex-wrap items-center gap-3 font-mono",
				children: [
					t.tracking_number,
					" ",
					/* @__PURE__ */ B(De, { value: t.tracking_number })
				]
			}),
			description: "Keep this page's address to follow the contract."
		}),
		/* @__PURE__ */ V("div", {
			className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]",
			children: [/* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(Ie, { lines: t.lines ?? [] }) }), /* @__PURE__ */ B("div", {
				className: "space-y-4",
				children: t.contract ? /* @__PURE__ */ B(i, { children: /* @__PURE__ */ V(a, {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ B("div", {
							className: "hud-label text-subtle",
							children: "Contract"
						}),
						/* @__PURE__ */ B(Ae, {
							status: t.contract.status,
							label: t.contract.status_label
						}),
						/* @__PURE__ */ B("div", {
							className: "font-mono text-2xl tabular-nums",
							children: j(t.value, { full: !0 })
						}),
						/* @__PURE__ */ V("div", {
							className: "text-xs text-subtle",
							children: [M(t.volume), " m³"]
						})
					]
				}) }) : /* @__PURE__ */ B(Re, { quote: t })
			})]
		})
	] }) : /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(G, {}),
		title: "No such quote",
		description: "It may have been removed because no contract was made for it."
	});
}
//#endregion
//#region src/index.tsx
var Ht = ae({
	routes: [
		{
			path: "",
			Component: Ke
		},
		{
			path: "programs/:id",
			Component: qe
		},
		{
			path: "me",
			Component: Je
		},
		{
			path: "quotes/:tracking",
			Component: Xe
		},
		{
			path: "contracts/:id",
			Component: Ze
		},
		{
			path: "manage",
			Component: et
		},
		{
			path: "manage/new",
			Component: at
		},
		{
			path: "manage/locations",
			Component: ct
		},
		{
			path: "manage/:id",
			Component: nt
		},
		{
			path: "manage/:id/edit",
			Component: at
		},
		{
			path: "manage/:id/items",
			Component: yt
		},
		{
			path: "settings",
			Component: mt
		}
	],
	publicRoutes: [
		{
			path: "",
			Component: zt
		},
		{
			path: ":id",
			Component: Bt
		},
		{
			path: "quotes/:tracking",
			Component: Vt
		}
	],
	widgets: [{
		id: "seller",
		title: "Buyback",
		Component: Qe,
		size: "sm",
		order: 47
	}, {
		id: "manager",
		title: "Buyback desk",
		Component: ht,
		size: "sm",
		order: 48,
		permission: "buyback.manage_programs"
	}]
});
//#endregion
export { Ht as default };

export const classes = ["!data","!isNew","!o","---","--------------------------------------------------------------------","-------------------------------------------------------------------------------------","-----------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------","--------------------------------------------------------------------------------------------------","----------------------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------------------","---------------------------------------------------------------------------------------------------------","-day","@conduit/sdk","@tanstack/react-query","a","able","about","above","absolute","accent","accept","accepted","accepted_count","access","action","actions","active","actually","add","address","adds","after","again","against","age","align","all","allow_all_items","allow_unpacked","alt","always","an","and","another","any","anything","anywhere","apply","are","aren","aria-checked","aria-expanded","aria-label","aria-pressed","as","asked","asks","assembled","assignee","at","autoComplete","autoFocus","average","averaged","back","balance","base","basics","bb-paste","be","because","been","before","below","best","bg-accent","bg-accent-soft","bg-bg","bg-danger-soft","bg-surface-2","bg-surface-raised","bg-warning-soft","block","blocked","blue_loot_npc","body","boolean","border","border-accent","border-accent/40","border-b","border-border","border-border-strong","border-danger/40","border-t","border-warning/40","bought","box","broken","browse","bulky","but","button","buy","buyback","buys","by","calculator","can","can_create","can_manage","can_read","can_see_leaderboards","categories","category","cell","changed","changes","character","characters","chat","checked","checks","children","className","clear","clears","click","closed","closest","code","color","columns","come","compact","compare","compressed","compressed_volume","compresses","confirmLabel","const","content","contract","contract_id","contracted","contracts","copy","corporation","cost","costs","count","covers","create","created","created_at","crystals","current","currentColor","cursor-help","cursor-pointer","cx","cy","danger","dashboard","data","date","date_completed","date_expired","date_issued","day","days","days_traded","decoration-border-strong","decoration-dotted","default","default_prefix","definePlugin","delete","deleted","density","density_tax","depth","description","desk","deviation","dialog","disabled","disabled:cursor-default","disallowed","divide-border","divide-y","division","dock","doesn","don","drops","each","easier","easy","effective","else","elsewhere","empty","en","enabled","enough","entire","error","esi","esi_character","esi_character_id","even","every","everything","exchange","existing","expanded","expiration_days","expire","expired","export","extends","extra","eyebrow","f","facts","failed","faint","far","fast","faster","fetched","few","fewer","fill","filter","find","finished","finished_contractor","finished_issuer","first","fixed","flagged","flex","flex-1","flex-col","flex-wrap","focus:opacity-100","follow","font-medium","font-mono","font-normal","font-semibold","footer","for","form","format","found","free","from","full","full_name","function","fuzzwork","g","game","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-6","gap-x-4","gap-y-1","get","gets","ghost","give","given","go","goes","grid","grid-cols-3","grid-cols-[28px_1fr]","group","group-hover/row:opacity-100","group/row","group_ids","group_rules","groups","guard","guard_both_ways","guard_days","guard_enabled","guard_min_days","guard_threshold","h-16","h-32","h-48","h-56","h-64","h-7","h-96","h-[calc(100vh-14rem)]","h-full","hand","happened","has","has_children","hasn","haul","hauling","hauling_fuel_cost","hauling_unit","have","haven","head","header","height","here","hint","history","history_region","hit","hours","hover","hover:bg-hover","hover:text-text","hover:underline","how","htmlFor","hub","hubId","hubName","hub_id","hub_kind","hub_name","hubs","hud-label","hundred","i","ice","icon","icon-xs","icons","id","ids","if","import","in","in-game","in_progress","included","indent","index","info","inherited","inline","inline-flex","inside","instant","instant_prices","instead","interactive","interface","into","invalidate","inventory","is","isLoading","isNew","isPending","is_corporation","isn","issuer","issuer_corporation","it","item","item_rules","items","items-center","items-end","items-start","its","janice","janice_api_key","janice_key_set","just","justify-between","justify-center","k","keep","keeps","key","keyof","kind","known","l","label","laid","last","lately","lazy","leaderboard","leading-none","leave","ledger","length","less","level","lg","lg:col-span-2","lg:grid-cols-2","lg:grid-cols-3","like","line","line-clamp-2","lines","link","list","listed","lists","lives","loading","location","location_ids","locations","log","logged","login","login_ok","longer","look","loot","low","lower","m","m-4","m12","m15","m16.71","m21.73","m3.3","m6","m9","made","main","make","manage","manage/locations","manage/new","manage_all_programs","manage_programs","managed","manager","managerChoices","manager_ids","managers","manages","manages_all","manipulate","manipulation","manual","market","market_group_id","market_note","market_pulled_at","market_unit","markets","match","matches","materials","max-h-72","may","mb-4","mb-6","md:grid-cols-2","me","member","members","method","min","min-h-0","min-h-7","min-h-[480px]","min-w-0","mine","minerals","mining","minute","minutes","ml-1","ml-1.5","ml-2","mode","modules","mono","month","month_count","month_value","months","moon","more","move","mr-2","mr-auto","mt-0.5","mt-1","mt-1.5","mt-2","mt-3","mt-4","mt-6","must","mutationFn","n","name","navigate","need","needed","needs","neutral","new","no","nobody","node","none","normally","not","note","nothing","notify_managers","now","nowhere","npc","null","number","numeric","o","of","off","often","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onEdit","onError","onOpen","onOpenChange","onPick","onRemove","onRowClick","onSaved","onSuccess","onToggle","one","only","opacity-0","opacity-50","opacity-60","open","open_value","opened","options","or","order","ore","ores","others","out","outstanding","over","overflow-hidden","overflow-x-auto","overflow-y-auto","overview","own","owner","ownerChoices","owner_id","p-3","p-4","p-5","p-6","paddingLeft","page","pages","panel","parts","password","paste","patch","path","pay","pays","pb-1","pct","per","permission","pick","pickTarget","pl-2","place","place-items-center","placeholder","placeholderData","places","player","post","pr-2","prefix","preset","price","price_density_tax","price_density_threshold","price_max_age_hours","price_source","price_type","priced","prices","prices_stored","pricing","primary","problems","program","programId","programs","propped-up","pt-2","public","publicRoutes","pulled_at","put","px-1.5","px-2","px-2.5","px-3","px-4","py-0.5","py-1","py-1.5","py-2","py-3","py-6","q","qc","quantity","queryFn","queryKey","queued","quote","quoteLink","quoted","quotes","r","radio","radiogroup","rare","rarely","rate","rather","raw","re","react","react-router","read","reads","reason","receive","recent","recognised","red_loot_npc","refetchInterval","refined","refines","refining","refining_rate","refresh","refreshed","region","reject","reject_disallowed","rejected","rejected_count","relative","reliable","remove","removeAll","removed","repackaged","replace","reprocess","reprocessed","reprocessing","required","rest","restrict_quotes","result","return","reversed","review","right","right-click","role","rotate-90","round","rounded-full","routes","row","rowKey","rows","rule","ruleId","rules","run","rx","ry","s","sales","save","saved","says","search","searches","searching","secondary","security","see","seen","select","selected","sell","seller","sellers","set","setAddingLocation","setClearAll","setConfirmDelete","setDone","setEditing","setFilter","setForm","setIndex","setName","setOpen","setOther","setQ","setQueryData","setStructureId","setSubject","setSystem","setTab","setText","setting","settings","settled","severe","shadow-e3","ships","short","shows","shrink-0","signed","sit","site","size","size-10","size-2","size-3","size-3.5","size-4","size-5","size-6","size-7","size-8","sm","sm:grid-cols-2","sm:grid-cols-3","smaller","so","solar","solar_system_id","solar_system_name","sold","sold_value","sortValue","source","source_name","space-y-1","space-y-1.5","space-y-2","space-y-3","space-y-4","space-y-5","space-y-6","special","split","src","staleTime","standard","starts","state","state_ids","states","static_price","station","stations","statistics","stats","status","status_label","stay","step","stored","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structure","structureId","structure_id","style","sub","subject","subjectKey","subtitle","success","such","suffix","sync","synced","system","systems","t","t1_refined","t1_refining_rate","tabIndex","tabular-nums","take","taken","takes","target","target_id","targets","tax","terms","text","text-2xl","text-3xl","text-[11px]","text-[13px]","text-[15px]","text-[34px]","text-accent-ink","text-center","text-danger-fg","text-info-fg","text-left","text-lg","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xs","than","that","the","their","them","then","there","these","they","third-party","this","those","threshold","through","tick","ticked","time","timeAgo","title","to","toggle","told","tone","top","top_items","total","total_count","total_value","totals","tracking","tracking-wider","tracking_number","tracking_prefix","trade","traded","trades","trading","transition","transition-transform","tree","treeitem","true","truncate","trust","two","type","type_id","typed","typeof","types","undefined","under","underline","underline-offset-4","unit","unit_price","units","unknown","unless","unlinked_purge_hours","until","unusual","unwatch","up","updated","updated_at","uppercase","us","use","useMutation","useParams","useQuery","useQueryClient","useState","use_compressed","use_raw","use_refined","used","v","value","valued","variables","variant","view","viewBox","void","volume","w-28","w-32","w-36","w-40","w-44","w-56","w-full","waiting","wallet","wallet_division","want","warning","was","watch","watch_rules","watched","way","ways","were","what","when","where","whether","which","who","whole","wider","widgets","width","will","window","with","within","without","won","words","worth","x","xl:grid-cols-3","xl:grid-cols-4","xl:grid-cols-[minmax(0,1fr)_360px]","xl:grid-cols-[minmax(0,1fr)_400px]","xl:grid-cols-[minmax(0,1fr)_420px]","xs","yet","you","your","z-20"];
