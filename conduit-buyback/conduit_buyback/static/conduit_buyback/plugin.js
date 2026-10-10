import { Badge as e, BarChart as t, Button as n, Callout as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, DataTable as c, Dialog as l, EmptyState as u, Field as d, Input as f, PageHeader as p, SearchInput as m, SectionTitle as h, Segmented as ee, Select as g, Skeleton as _, StatCard as v, Switch as y, SwitchRow as b, THead as x, TabPanel as S, Table as te, Tabs as ne, Td as C, Textarea as re, Th as w, Tooltip as T, Tr as E, api as D, buttonVariants as O, cn as ie, dateTime as k, definePlugin as ae, isk as A, num as j, timeAgo as M, toast as N, useHasPerm as oe } from "@conduit/sdk";
import { useMutation as P, useQuery as F, useQueryClient as se } from "@tanstack/react-query";
import { useState as I } from "react";
import { Link as L, useNavigate as ce, useParams as R } from "react-router";
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
}), le = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ B("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), ue = (e) => /* @__PURE__ */ B(H, {
	...e,
	children: /* @__PURE__ */ B("path", { d: "M20 6 9 17l-5-5" })
}), de = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }),
		/* @__PURE__ */ B("path", { d: "M12 9v4" }),
		/* @__PURE__ */ B("path", { d: "M12 17h.01" })
	]
}), fe = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" }), /* @__PURE__ */ B("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), pe = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M5 12h14" }), /* @__PURE__ */ B("path", { d: "M12 5v14" })]
}), W = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M3 6h18" }),
		/* @__PURE__ */ B("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ B("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), me = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ B("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), he = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ B("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ B("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ B("path", { d: "M8 16H3v5" })
	]
}), ge = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0" }), /* @__PURE__ */ B("circle", {
		cx: "12",
		cy: "10",
		r: "3"
	})]
}), _e = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ B("path", { d: "M19 12H5" })]
}), ve = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" }), /* @__PURE__ */ B("path", { d: "m15 5 4 4" })]
}), ye = (e) => /* @__PURE__ */ V(H, {
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
}), be = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z" }), /* @__PURE__ */ B("circle", {
		cx: "7.5",
		cy: "7.5",
		r: ".5",
		fill: "currentColor"
	})]
}), xe = (e) => /* @__PURE__ */ V(H, {
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
}), K = "/api/p/buyback", Se = "/api/public/p/buyback", Ce = {
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
function we({ value: e, label: t = "Copy" }) {
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
			B(r ? ue : le, {}),
			" ",
			r ? "Copied" : t
		]
	});
}
function Te({ system: e }) {
	if (!e) return null;
	let t = e.security >= .5 ? "text-success-fg" : e.security > 0 ? "text-warning-fg" : "text-danger-fg";
	return /* @__PURE__ */ V("span", {
		className: "text-muted",
		children: [
			e.name,
			" ",
			/* @__PURE__ */ B("span", {
				className: ie("font-mono text-xs", t),
				children: e.security.toFixed(1)
			}),
			/* @__PURE__ */ V("span", {
				className: "text-subtle",
				children: [" · ", e.region]
			})
		]
	});
}
function q({ icon: e, name: t, sub: n }) {
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
var Ee = {
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
function De({ status: t, label: n }) {
	return /* @__PURE__ */ B(e, {
		tone: Ee[t] ?? "neutral",
		children: n ?? (t === "quoted" ? "No contract yet" : t)
	});
}
function Oe({ problems: t, compact: n }) {
	if (!t.length) return n ? /* @__PURE__ */ B(e, {
		tone: "success",
		children: "Matches its quote"
	}) : null;
	if (n) {
		let n = t.filter((e) => e.severe).length;
		return /* @__PURE__ */ B(T, {
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
			className: ie("flex items-start gap-2.5 border px-3 py-2 text-sm", e.severe ? "border-danger/40 bg-danger-soft text-danger-fg" : "border-warning/40 bg-warning-soft text-warning-fg"),
			children: [/* @__PURE__ */ B(de, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ B("span", { children: e.text })]
		}, e.code))
	});
}
var J = (e) => `${Number.isInteger(e) ? e : e.toFixed(2)}%`;
function ke({ program: e }) {
	let t = [
		e.use_raw && "raw",
		e.use_compressed && "compressed",
		e.use_refined && `refined at ${J(e.refining_rate)}`
	].filter(Boolean), n = [
		/* @__PURE__ */ V(z, { children: [
			e.prices.hub,
			" ",
			e.price_type === "split" ? "split" : e.price_type === "sell" ? "sell" : "buy",
			" price, less ",
			J(e.tax)
		] }),
		e.allow_all_items ? "Buys any item" : "Only listed items",
		t.length ? /* @__PURE__ */ V(z, { children: ["Ore & ice: best of ", t.join(", ")] }) : null,
		e.hauling_fuel_cost > 0 ? /* @__PURE__ */ V(z, { children: [
			"Hauling ",
			A(e.hauling_fuel_cost, { full: !0 }),
			"/m³",
			e.compressed_volume ? " (compressed volume)" : ""
		] }) : null,
		e.price_density_threshold > 0 ? /* @__PURE__ */ V(z, { children: [
			"+",
			J(e.price_density_tax),
			" under ",
			A(e.price_density_threshold),
			"/m³"
		] }) : null,
		e.t1_refined ? /* @__PURE__ */ V(z, { children: [
			"Tech I modules at ",
			J(e.t1_refining_rate),
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
function Ae({ terms: e }) {
	return /* @__PURE__ */ B("ul", {
		className: "space-y-1",
		children: e.locations.map((e) => /* @__PURE__ */ V("li", {
			className: "flex items-start gap-2 text-sm",
			children: [/* @__PURE__ */ B(ge, { className: "mt-0.5 size-3.5 shrink-0 text-subtle" }), /* @__PURE__ */ V("span", { children: [
				/* @__PURE__ */ B("span", {
					className: "font-medium",
					children: e.name
				}),
				" ",
				/* @__PURE__ */ B(Te, { system: e.system })
			] })]
		}, e.id))
	});
}
function je({ guard: t }) {
	if (!t || t.used === "current") return null;
	if (t.used === "materials") return /* @__PURE__ */ B(T, {
		content: `${t.materials} of the minerals it refines into were priced far above their recent average, so their average was used.`,
		children: /* @__PURE__ */ B("span", { children: /* @__PURE__ */ B(e, {
			tone: "info",
			className: "ml-1.5",
			children: "averaged"
		}) })
	});
	let n = t.deviation == null ? "" : `${t.deviation > 0 ? "+" : ""}${t.deviation}%`, r = t.used === "average" ? `The market says ${A(t.current, { full: !0 })}, ${n} off what it traded for lately (${A(t.average, { full: !0 })}). It trades often enough to trust that average, so it's used instead.` : `The market says ${A(t.current, { full: !0 })}, ${n} off what it traded for lately (${A(t.average, { full: !0 })}), and it rarely trades (${t.days_traded} day${t.days_traded === 1 ? "" : "s"} lately). The lower price is used and a manager checks it by hand.`;
	return /* @__PURE__ */ B(T, {
		content: r,
		children: /* @__PURE__ */ B("span", { children: /* @__PURE__ */ B(e, {
			tone: t.used === "average" ? "info" : "warning",
			className: "ml-1.5",
			children: t.used === "average" ? "recent average" : "unusual price"
		}) })
	});
}
function Me({ line: e }) {
	let t = [`${Ce[e.method ?? "market"]} ${A(e.market_unit, { full: !0 })}`, `less ${J(e.tax)}${e.density_tax ? " (incl. low value per m³)" : ""}`];
	e.hauling_unit > 0 && t.push(`less ${A(e.hauling_unit, { full: !0 })} hauling`);
	let n = Object.entries(e.options).filter(([t]) => t !== e.method);
	return n.length && t.push(`(${n.map(([e, t]) => `${Ce[e]} ${A(t, { full: !0 })}`).join(", ")})`), /* @__PURE__ */ B(z, { children: t.join(", ") });
}
function Ne({ lines: t }) {
	return /* @__PURE__ */ B("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ V(te, { children: [/* @__PURE__ */ B(x, { children: /* @__PURE__ */ V("tr", { children: [
			/* @__PURE__ */ B(w, { children: "Item" }),
			/* @__PURE__ */ B(w, {
				align: "right",
				children: "Quantity"
			}),
			/* @__PURE__ */ B(w, { children: "Valued as" }),
			/* @__PURE__ */ B(w, {
				align: "right",
				children: "Per unit"
			}),
			/* @__PURE__ */ B(w, {
				align: "right",
				children: "Value"
			})
		] }) }), /* @__PURE__ */ B("tbody", { children: t.map((t) => /* @__PURE__ */ V(E, {
			className: ie(!t.accepted && "opacity-60"),
			children: [
				/* @__PURE__ */ B(C, { children: /* @__PURE__ */ B(q, {
					icon: t.icon,
					name: t.name,
					sub: t.watch ? /* @__PURE__ */ V("span", {
						className: "inline-flex items-center gap-1 text-info-fg",
						children: [/* @__PURE__ */ B(fe, { className: "size-3" }), " Checked by hand before it's accepted"]
					}) : t.group
				}) }),
				/* @__PURE__ */ B(C, {
					numeric: !0,
					children: j(t.quantity)
				}),
				/* @__PURE__ */ B(C, { children: t.accepted ? /* @__PURE__ */ V("span", {
					className: "text-sm",
					children: [
						Ce[t.method ?? "market"],
						t.method !== "fixed" && /* @__PURE__ */ V("span", {
							className: "text-subtle",
							children: [" · −", J(t.tax)]
						}),
						t.density_tax && /* @__PURE__ */ B(e, {
							tone: "warning",
							className: "ml-1.5",
							children: "low ISK/m³"
						}),
						/* @__PURE__ */ B(je, { guard: t.guard })
					]
				}) : /* @__PURE__ */ B(e, {
					tone: "danger",
					children: t.reason
				}) }),
				/* @__PURE__ */ B(C, {
					numeric: !0,
					children: t.accepted ? /* @__PURE__ */ B(T, {
						content: /* @__PURE__ */ B(Me, { line: t }),
						children: /* @__PURE__ */ B("span", {
							className: "cursor-help underline decoration-dotted decoration-border-strong underline-offset-4",
							children: A(t.unit_price, { full: !0 })
						})
					}) : "—"
				}),
				/* @__PURE__ */ B(C, {
					numeric: !0,
					className: "font-medium",
					children: t.accepted ? A(t.value, { full: !0 }) : "—"
				})
			]
		}, t.type_id)) })] })
	});
}
function Pe({ n: e, title: t, children: n }) {
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
function Fe({ quote: t }) {
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
					children: A(t.value, { full: !0 })
				}),
				/* @__PURE__ */ V("div", {
					className: "mt-1.5 text-xs text-muted",
					children: [
						t.items,
						" item",
						t.items === 1 ? "" : "s",
						" · ",
						j(t.volume),
						" m³",
						t.hub && /* @__PURE__ */ V(z, { children: [" · priced at ", t.hub] })
					]
				})
			] }), t.flagged && /* @__PURE__ */ V(e, {
				tone: "info",
				children: [/* @__PURE__ */ B(fe, { className: "size-3" }), " Some items are checked by hand"]
			})]
		}), /* @__PURE__ */ V("ol", {
			className: "mt-6 space-y-4",
			children: [
				/* @__PURE__ */ B(Pe, {
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
							n.assignee.name && /* @__PURE__ */ B(we, { value: n.assignee.name })
						]
					})
				}),
				/* @__PURE__ */ B(Pe, {
					n: 2,
					title: n.locations.length === 1 ? "Made at" : "Made at one of",
					children: /* @__PURE__ */ B(Ae, { terms: n })
				}),
				/* @__PURE__ */ B(Pe, {
					n: 3,
					title: "I will receive",
					children: /* @__PURE__ */ V("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ V("span", {
							className: "font-mono font-medium tabular-nums",
							children: [Number(r).toLocaleString("en"), " ISK"]
						}), /* @__PURE__ */ B(we, { value: r })]
					})
				}),
				/* @__PURE__ */ B(Pe, {
					n: 4,
					title: "Description (exactly this, nothing else)",
					children: /* @__PURE__ */ V("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ B("code", {
							className: "border border-border bg-bg px-2 py-1 font-mono text-sm text-text",
							children: t.tracking_number
						}), /* @__PURE__ */ B(we, { value: t.tracking_number })]
					})
				}),
				/* @__PURE__ */ B(Pe, {
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
function Ie({ program: e, base: t, quoteLink: i }) {
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
				}), c.lines.length > 0 ? /* @__PURE__ */ B(Ne, { lines: c.lines }) : /* @__PURE__ */ B("p", {
					className: "p-6 text-center text-sm text-muted",
					children: "No items recognised."
				})]
			})]
		}), /* @__PURE__ */ B("div", {
			className: "space-y-4",
			children: c?.quote ? /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(Fe, { quote: c.quote }), /* @__PURE__ */ V("p", {
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
						children: /* @__PURE__ */ B(ke, { program: e })
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
						children: /* @__PURE__ */ B(Ae, { terms: e.terms })
					})] }),
					e.item_rules.length > 0 && /* @__PURE__ */ B(Le, { program: e })
				]
			})
		})]
	});
}
function Le({ program: t }) {
	let [n, r] = I(!1), i = n ? t.item_rules : t.item_rules.slice(0, 6);
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B("div", {
			className: "hud-label text-subtle",
			children: t.allow_all_items ? "Items with their own terms" : "Items it buys"
		}),
		/* @__PURE__ */ B("ul", {
			className: "mt-2 divide-y divide-border border border-border",
			children: i.map((t) => /* @__PURE__ */ V("li", {
				className: "flex items-center justify-between gap-3 px-2.5 py-1.5 text-sm",
				children: [/* @__PURE__ */ B(q, {
					icon: t.icon,
					name: t.name
				}), /* @__PURE__ */ B("span", {
					className: "shrink-0 text-xs",
					children: t.disallowed ? /* @__PURE__ */ B(e, {
						tone: "danger",
						children: "not bought"
					}) : t.static_price == null ? t.tax ? /* @__PURE__ */ V("span", {
						className: "font-mono text-muted",
						children: [
							t.tax > 0 ? "+" : "",
							J(t.tax),
							" tax"
						]
					}) : /* @__PURE__ */ B("span", {
						className: "text-muted",
						children: "standard"
					}) : /* @__PURE__ */ B("span", {
						className: "font-mono",
						children: A(t.static_price, { full: !0 })
					})
				})]
			}, t.type_id))
		}),
		t.item_rules.length > 6 && /* @__PURE__ */ B("button", {
			className: "mt-2 text-xs text-accent-ink hover:underline",
			onClick: () => r(!n),
			children: n ? "Show fewer" : `Show all ${t.item_rules.length}`
		})
	] });
}
function Re({ lines: t, items: n }) {
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
		children: /* @__PURE__ */ V(te, { children: [/* @__PURE__ */ B(x, { children: /* @__PURE__ */ V("tr", { children: [
			/* @__PURE__ */ B(w, { children: "Item" }),
			/* @__PURE__ */ B(w, {
				align: "right",
				children: "Quoted"
			}),
			/* @__PURE__ */ B(w, {
				align: "right",
				children: "In contract"
			}),
			/* @__PURE__ */ B(w, {})
		] }) }), /* @__PURE__ */ V("tbody", { children: [o.map((t) => {
			let n = r.get(t), a = i.get(t), o = n?.quantity ?? 0, s = a?.quantity ?? 0;
			return /* @__PURE__ */ V(E, { children: [
				/* @__PURE__ */ B(C, { children: /* @__PURE__ */ B(q, {
					icon: n?.icon ?? a?.item.icon ?? null,
					name: n?.name ?? a?.item.name ?? `Type ${t}`
				}) }),
				/* @__PURE__ */ B(C, {
					numeric: !0,
					children: o ? j(o) : "—"
				}),
				/* @__PURE__ */ B(C, {
					numeric: !0,
					children: s ? j(s) : "—"
				}),
				/* @__PURE__ */ B(C, { children: s === o ? /* @__PURE__ */ B(e, {
					tone: "success",
					children: "matches"
				}) : s < o ? /* @__PURE__ */ V(e, {
					tone: "danger",
					children: ["short ", j(o - s)]
				}) : /* @__PURE__ */ V(e, {
					tone: "warning",
					children: ["extra ", j(s - o)]
				}) })
			] }, t);
		}), a.map((t) => /* @__PURE__ */ V(E, { children: [
			/* @__PURE__ */ B(C, { children: /* @__PURE__ */ B(q, {
				icon: t.icon,
				name: t.name,
				sub: "Asked for in return"
			}) }),
			/* @__PURE__ */ B(C, {
				numeric: !0,
				children: "—"
			}),
			/* @__PURE__ */ B(C, {
				numeric: !0,
				children: j(t.quantity)
			}),
			/* @__PURE__ */ B(C, { children: /* @__PURE__ */ B(e, {
				tone: "danger",
				children: "asks for it"
			}) })
		] }, `asked-${t.type_id}`))] })] })
	});
}
//#endregion
//#region src/member.tsx
var Y = "/p/buyback";
function ze() {
	return F({
		queryKey: ["buyback", "programs"],
		queryFn: () => D.get(`${K}/programs`)
	});
}
function Be() {
	return F({
		queryKey: ["buyback", "me"],
		queryFn: () => D.get(`${K}/me`)
	});
}
function Ve({ program: t, to: n }) {
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
					/* @__PURE__ */ B(Ae, { terms: t.terms }),
					/* @__PURE__ */ B(ke, { program: t }),
					/* @__PURE__ */ V("div", {
						className: "flex flex-wrap gap-1.5",
						children: [!t.active && /* @__PURE__ */ B(e, {
							tone: "warning",
							children: "Closed"
						}), t.public && /* @__PURE__ */ V(e, {
							tone: "info",
							children: [/* @__PURE__ */ B(xe, { className: "size-3" }), " Public"]
						})]
					})
				]
			})
		})
	});
}
function He() {
	let { data: e, isLoading: t } = ze(), n = Be(), r = n.data?.quotes.filter((e) => e.contract?.open) ?? [];
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(U, {}),
			eyebrow: "Buyback",
			title: "Sell your loot and ore",
			description: e ? `Paste your items for an instant quote, then contract them. Prices: ${e.prices.source}${e.prices.instant ? " (best order)" : " (top 5% of orders)"} at each program's market${e.prices.guard ? `, checked against the last ${e.prices.guard_days} days of trading` : ""}.` : "Paste your items for an instant quote, then contract them.",
			actions: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ V(L, {
				to: `${Y}/me`,
				className: O({ variant: "secondary" }),
				children: [/* @__PURE__ */ B(G, {}), " My quotes"]
			}), (e?.manages || e?.can_create) && /* @__PURE__ */ V(L, {
				to: "/p/buyback/manage",
				className: O({ variant: "secondary" }),
				children: [/* @__PURE__ */ B(me, {}), " Run programs"]
			})] })
		}),
		n.data && (n.data.totals.open > 0 || n.data.totals.sold_value > 0) && /* @__PURE__ */ V("div", {
			className: "mb-6 grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ B(v, {
					label: "Waiting to be accepted",
					value: n.data.totals.open,
					hint: A(n.data.totals.open_value)
				}),
				/* @__PURE__ */ B(v, {
					label: "Sold so far",
					value: A(n.data.totals.sold_value),
					mono: !0,
					tone: "success"
				}),
				/* @__PURE__ */ B(v, {
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
			children: e.programs.map((e) => /* @__PURE__ */ B(Ve, {
				program: e,
				to: `${Y}/programs/${e.id}`
			}, e.id))
		}) : /* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(u, {
			icon: /* @__PURE__ */ B(U, {}),
			title: "No buyback programs for you yet",
			description: e?.can_create ? "Set one up: who buys, where, and at what tax." : "Leadership hasn't opened a buyback you can use.",
			action: e?.can_create ? /* @__PURE__ */ B(L, {
				to: `${Y}/manage/new`,
				className: O({ variant: "primary" }),
				children: "Create a program"
			}) : void 0
		}) })
	] });
}
function X({ to: e, children: t }) {
	return /* @__PURE__ */ V(L, {
		to: e,
		className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
		children: [
			/* @__PURE__ */ B(_e, {}),
			" ",
			t
		]
	});
}
function Ue() {
	let { id: e } = R(), { data: t, isLoading: n, error: r } = F({
		queryKey: [
			"buyback",
			"program",
			e
		],
		queryFn: () => D.get(`${K}/programs/${e}`)
	});
	return n ? /* @__PURE__ */ B(_, { className: "h-96" }) : t ? /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(X, {
			to: Y,
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
				children: [/* @__PURE__ */ B(me, {}), " Manage"]
			})
		}),
		!t.active && /* @__PURE__ */ B("p", {
			className: "mb-4 text-sm text-warning-fg",
			children: "This program is closed; only its managers see it."
		}),
		/* @__PURE__ */ B(Ie, {
			program: t,
			base: K,
			quoteLink: (e) => `${Y}/quotes/${e}`
		})
	] }) : /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(U, {}),
		title: "No such program",
		description: r?.message
	});
}
function We() {
	let { data: e, isLoading: t } = Be();
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(X, {
			to: Y,
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
				to: `${Y}/quotes/${e.tracking_number}`,
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
							M(e.created_at)
						]
					})]
				}), /* @__PURE__ */ V("div", {
					className: "flex items-center gap-3",
					children: [
						e.contract && e.contract.problems.length > 0 && /* @__PURE__ */ B(Oe, {
							problems: e.contract.problems,
							compact: !0
						}),
						/* @__PURE__ */ B(De, {
							status: e.state,
							label: e.contract?.status_label
						}),
						/* @__PURE__ */ B("span", {
							className: "w-36 text-right font-mono text-sm tabular-nums",
							children: A(e.value, { full: !0 })
						})
					]
				})]
			}) }, e.tracking_number))
		}) }) : /* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(u, {
			icon: /* @__PURE__ */ B(G, {}),
			title: "No quotes yet",
			action: /* @__PURE__ */ B(L, {
				to: Y,
				className: O({ variant: "primary" }),
				children: "Get a quote"
			})
		}) })
	] });
}
function Ge({ c: e, lines: t }) {
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
						k(e.date_issued),
						e.location && /* @__PURE__ */ V(z, { children: [" at ", e.location] }),
						e.date_completed && /* @__PURE__ */ V(z, { children: [" · settled ", k(e.date_completed)] })
					]
				})
			] }), /* @__PURE__ */ V("div", {
				className: "text-right",
				children: [
					/* @__PURE__ */ B(De, {
						status: e.status,
						label: e.status_label
					}),
					/* @__PURE__ */ B("div", {
						className: "mt-1 font-mono text-lg tabular-nums",
						children: A(e.price, { full: !0 })
					}),
					e.quoted != null && e.quoted !== e.price && /* @__PURE__ */ V("div", {
						className: "text-xs text-subtle",
						children: ["quoted ", A(e.quoted, { full: !0 })]
					})
				]
			})]
		}), /* @__PURE__ */ B(Oe, { problems: e.problems })]
	}), t && /* @__PURE__ */ B(Re, {
		lines: t,
		items: e.items
	})] });
}
function Ke() {
	let { tracking: e } = R(), { data: t, isLoading: n } = F({
		queryKey: [
			"buyback",
			"quote",
			e
		],
		queryFn: () => D.get(`${K}/quotes/${e}`)
	});
	return n ? /* @__PURE__ */ B(_, { className: "h-96" }) : t ? /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(X, {
			to: t.mine ? `${Y}/me` : t.can_manage ? `${Y}/manage/${t.program.id}` : Y,
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
					/* @__PURE__ */ B(we, { value: t.tracking_number })
				]
			}),
			description: `Quoted ${k(t.created_at)}${t.hub ? ` at ${t.hub} prices` : ""}${t.seller && !t.mine ? ` for ${t.seller}` : ""}${t.public ? " (public calculator)" : ""}.`
		}),
		/* @__PURE__ */ V("div", {
			className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]",
			children: [/* @__PURE__ */ V("div", {
				className: "space-y-4",
				children: [t.contracts.map((e) => /* @__PURE__ */ B(Ge, {
					c: e,
					lines: t.lines
				}, e.contract_id)), /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B("div", {
					className: "border-b border-border px-4 py-3",
					children: /* @__PURE__ */ B("div", {
						className: "hud-label text-subtle",
						children: "Quote"
					})
				}), /* @__PURE__ */ B(Ne, { lines: t.lines })] })]
			}), /* @__PURE__ */ B("div", { children: t.contracts.length === 0 ? /* @__PURE__ */ B(Fe, { quote: t }) : /* @__PURE__ */ B(i, { children: /* @__PURE__ */ V(a, { children: [
				/* @__PURE__ */ B("div", {
					className: "hud-label text-subtle",
					children: "Quoted"
				}),
				/* @__PURE__ */ B("div", {
					className: "mt-1 font-mono text-2xl tabular-nums",
					children: A(t.value, { full: !0 })
				}),
				/* @__PURE__ */ V("div", {
					className: "text-xs text-subtle",
					children: [j(t.volume), " m³"]
				})
			] }) }) })]
		})
	] }) : /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(G, {}),
		title: "No such quote",
		description: "It may have been removed because no contract was made for it."
	});
}
function qe() {
	let { id: e } = R(), { data: t, isLoading: n } = F({
		queryKey: [
			"buyback",
			"contract",
			e
		],
		queryFn: () => D.get(`${K}/contracts/${e}`)
	});
	return n ? /* @__PURE__ */ B(_, { className: "h-96" }) : t ? /* @__PURE__ */ V("div", { children: [
		t.program && /* @__PURE__ */ B(X, {
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
		/* @__PURE__ */ B(Ge, {
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
function Je() {
	let { data: e, isLoading: t } = Be();
	return t ? /* @__PURE__ */ B(_, { className: "h-16" }) : e ? /* @__PURE__ */ B(L, {
		to: Y,
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
					children: [A(e.totals.open_value), " to come"]
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
var Z = `${Y}/manage`;
function Ye() {
	let e = se();
	return () => e.invalidateQueries({ queryKey: ["buyback"] });
}
function Xe() {
	let { data: t, isLoading: n, error: r } = F({
		queryKey: ["buyback", "manage"],
		queryFn: () => D.get(`${K}/manage`)
	}), o = oe("buyback.manage_all_programs");
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(X, {
			to: Y,
			children: "Buyback"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(me, {}),
			eyebrow: "Buyback",
			title: "Run programs",
			description: "Contracts are read from each owner's login every 15 minutes and checked against their quotes.",
			actions: /* @__PURE__ */ V(z, { children: [
				t?.can_create && /* @__PURE__ */ V(L, {
					to: `${Z}/locations`,
					className: O({ variant: "secondary" }),
					children: [/* @__PURE__ */ B(ge, {}), " Locations"]
				}),
				o && /* @__PURE__ */ V(L, {
					to: "/p/buyback/settings",
					className: O({ variant: "secondary" }),
					children: [/* @__PURE__ */ B(me, {}), " Prices"]
				}),
				t?.can_create && /* @__PURE__ */ V(L, {
					to: `${Z}/new`,
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
				to: `${Z}/new`,
				className: O({ variant: "primary" }),
				children: "New program"
			})
		}) }) : /* @__PURE__ */ B("div", {
			className: "grid gap-4 lg:grid-cols-2",
			children: t.programs.map((t) => /* @__PURE__ */ B(L, {
				to: `${Z}/${t.id}`,
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
									/* @__PURE__ */ B(Ze, {
										label: "Open",
										value: j(t.open),
										hint: A(t.open_value)
									}),
									/* @__PURE__ */ B(Ze, {
										label: "Problems",
										value: j(t.problems),
										tone: t.problems ? "danger" : void 0
									}),
									/* @__PURE__ */ B(Ze, {
										label: "30 days",
										value: A(t.month_value),
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
										children: A(t.wallet.balance)
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
function Ze({ label: e, value: t, hint: n, tone: r }) {
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
function Qe() {
	let { id: e } = R(), r = ce(), s = Ye(), [l, d] = I("open"), [f, h] = I(""), g = F({
		queryKey: [
			"buyback",
			"stats",
			e
		],
		queryFn: () => D.get(`${K}/manage/programs/${e}/stats`)
	}), y = F({
		queryKey: [
			"buyback",
			"contracts",
			e,
			l,
			f
		],
		queryFn: () => D.get(`${K}/manage/programs/${e}/contracts?status=${l}&q=${encodeURIComponent(f)}`)
	}), b = P({
		mutationFn: () => D.post(`${K}/manage/programs/${e}/sync`),
		onSuccess: () => {
			N.success("Checking contracts now; refresh in a minute"), setTimeout(s, 15e3);
		},
		onError: (e) => N.error(e.message)
	}), x = g.data;
	return g.isLoading ? /* @__PURE__ */ B(_, { className: "h-96" }) : x ? /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(X, {
			to: Z,
			children: "Programs"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(U, {}),
			eyebrow: "Buyback program",
			title: x.program.name,
			description: x.owner ? `Contracts to ${x.owner.name}${x.owner.corporation ? ` / ${x.owner.corporation}` : ""}.` : "This program has no owner, so no contracts are read.",
			actions: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ V(L, {
				to: `${Y}/programs/${x.program.id}`,
				className: O({ variant: "secondary" }),
				children: [/* @__PURE__ */ B(U, {}), " Calculator"]
			}), x.program.can_manage && /* @__PURE__ */ V(z, { children: [
				/* @__PURE__ */ V(n, {
					onClick: () => b.mutate(),
					loading: b.isPending,
					children: [/* @__PURE__ */ B(he, {}), " Check now"]
				}),
				/* @__PURE__ */ V(L, {
					to: `${Z}/${x.program.id}/items`,
					className: O({ variant: "secondary" }),
					children: [/* @__PURE__ */ B(be, {}), " Items"]
				}),
				/* @__PURE__ */ V(L, {
					to: `${Z}/${x.program.id}/edit`,
					className: O({ variant: "primary" }),
					children: [/* @__PURE__ */ B(ve, {}), " Edit"]
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
				/* @__PURE__ */ B(v, {
					label: "Open contracts",
					value: x.open,
					hint: A(x.open_value),
					icon: /* @__PURE__ */ B(U, {})
				}),
				/* @__PURE__ */ B(v, {
					label: "Need a look",
					value: x.problems,
					tone: x.problems ? "danger" : "success",
					hint: x.problems ? "open contracts with problems" : "all match their quotes",
					icon: /* @__PURE__ */ B(de, {})
				}),
				/* @__PURE__ */ B(v, {
					label: "Bought, 30 days",
					value: A(x.month_value),
					mono: !0,
					hint: `${x.month_count} contracts`,
					icon: /* @__PURE__ */ B(ye, {})
				}),
				/* @__PURE__ */ B(v, {
					label: x.wallet ? `Wallet division ${x.wallet.division}` : "Bought, all time",
					value: x.wallet ? A(x.wallet.balance) : A(x.total_value),
					mono: !0,
					hint: x.wallet ? x.wallet.updated_at ? `updated ${M(x.wallet.updated_at)}` : "not synced yet" : `${x.total_count} contracts`
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
					rows: y.data ?? [],
					loading: y.isLoading,
					rowKey: (e) => e.contract_id,
					onRowClick: (e) => r(`${Y}/contracts/${e.contract_id}`),
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
								children: M(e.date_issued)
							}),
							sortValue: (e) => e.date_issued
						},
						{
							header: "Price",
							align: "right",
							cell: (e) => /* @__PURE__ */ B("span", {
								className: "font-mono tabular-nums",
								children: A(e.price, { full: !0 })
							}),
							sortValue: (e) => e.price
						},
						{
							header: "Checks",
							cell: (e) => /* @__PURE__ */ B(Oe, {
								problems: e.problems,
								compact: !0
							})
						},
						{
							header: "State",
							cell: (e) => /* @__PURE__ */ B(De, {
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
						format: (e) => A(e),
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
								children: A(e.value)
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
							children: [/* @__PURE__ */ B(q, {
								icon: e.icon,
								name: e.name,
								sub: `${j(e.quantity)} units`
							}), /* @__PURE__ */ B("span", {
								className: "shrink-0 font-mono tabular-nums",
								children: A(e.value)
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
var $e = {
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
function Q({ label: e, hint: t, value: n, onChange: r, step: i = 1, suffix: a }) {
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
function et({ items: e, selected: t, onChange: n, empty: r }) {
	return e.length ? /* @__PURE__ */ B("div", {
		className: "divide-y divide-border border border-border",
		children: e.map((e) => /* @__PURE__ */ V("label", {
			className: "flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm",
			children: [/* @__PURE__ */ B("span", { children: e.name }), /* @__PURE__ */ B(y, {
				checked: t.includes(e.id),
				onCheckedChange: (r) => n(r ? [...t, e.id] : t.filter((t) => t !== e.id))
			})]
		}, e.id))
	}) : /* @__PURE__ */ B("p", {
		className: "text-sm text-subtle",
		children: r
	});
}
function tt() {
	let { id: e } = R(), t = !e, r = ce(), c = Ye(), l = F({
		queryKey: ["buyback", "options"],
		queryFn: () => D.get(`${K}/manage/options`)
	}), u = F({
		queryKey: [
			"buyback",
			"managed",
			e
		],
		queryFn: () => D.get(`${K}/manage/programs/${e}`),
		enabled: !t
	}), [m, v] = I(null), [y, x] = I(!1), [te, C] = I(!1), w = t ? $e : u.data ? {
		...$e,
		...nt(u.data)
	} : null, T = m ?? w, E = (e) => T && v({
		...T,
		...e
	}), O = P({
		mutationFn: (n) => t ? D.post(`${K}/manage/programs`, n) : D.put(`${K}/manage/programs/${e}`, n),
		onSuccess: (e) => {
			c(), N.success(t ? "Program created" : "Saved"), r(`${Z}/${e.id}`);
		},
		onError: (e) => N.error(e.message)
	}), ie = P({
		mutationFn: () => D.delete(`${K}/manage/programs/${e}`),
		onSuccess: () => {
			c(), r(Z);
		}
	});
	if (!T || !l.data) return /* @__PURE__ */ B(_, { className: "h-96" });
	let k = l.data, ae = [...k.characters];
	u.data?.owner && !ae.some((e) => e.id === u.data.owner.id) && ae.unshift({
		id: u.data.owner.id,
		name: u.data.owner.name,
		corporation: u.data.owner.corporation,
		login_ok: u.data.owner.login_ok
	});
	let A = [...k.managers, ...(u.data?.managers ?? []).filter((e) => !k.managers.some((t) => t.id === e.id))];
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(X, {
			to: t ? Z : `${Z}/${e}`,
			children: t ? "Programs" : T.name
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(ve, {}),
			title: t ? "New buyback program" : `Edit ${u.data?.name}`,
			actions: /* @__PURE__ */ V(z, { children: [!t && /* @__PURE__ */ V(n, {
				variant: "ghost",
				onClick: () => x(!0),
				children: [/* @__PURE__ */ B(W, {}), " Delete"]
			}), /* @__PURE__ */ B(n, {
				variant: "primary",
				loading: O.isPending,
				onClick: () => O.mutate(T),
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
				/* @__PURE__ */ B(S, {
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
										}), ae.map((e) => /* @__PURE__ */ V("option", {
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
										/* @__PURE__ */ B(b, {
											label: "To the character's corporation",
											description: "Sellers make contracts out to the corporation rather than the character.",
											checked: T.is_corporation,
											onCheckedChange: (e) => E({ is_corporation: e })
										}),
										/* @__PURE__ */ B(b, {
											label: "Open",
											description: "Closed programs give no quotes; only managers see them.",
											checked: T.active,
											onCheckedChange: (e) => E({ active: e })
										}),
										/* @__PURE__ */ B(b, {
											label: "Tell managers about new contracts",
											checked: T.notify_managers,
											onCheckedChange: (e) => E({ notify_managers: e })
										})
									]
								}),
								/* @__PURE__ */ V("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [/* @__PURE__ */ B(Q, {
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
							children: [/* @__PURE__ */ B(et, {
								items: k.locations,
								selected: T.location_ids,
								onChange: (e) => E({ location_ids: e }),
								empty: "No locations yet."
							}), /* @__PURE__ */ V("button", {
								type: "button",
								onClick: () => C(!0),
								className: "inline-flex items-center gap-1.5 text-sm text-accent-ink hover:underline",
								children: [/* @__PURE__ */ B(pe, {}), " Add a location"]
							})]
						})] })]
					})
				}),
				/* @__PURE__ */ B(S, {
					value: "pricing",
					children: /* @__PURE__ */ B(i, { children: /* @__PURE__ */ V(a, {
						className: "grid gap-6 lg:grid-cols-2",
						children: [
							/* @__PURE__ */ B("div", {
								className: "lg:col-span-2",
								children: /* @__PURE__ */ B(lt, {
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
									/* @__PURE__ */ B(Q, {
										label: "Tax",
										hint: "Taken off every item. Items can add to it (or take away) in the item rules.",
										value: T.tax,
										onChange: (e) => E({ tax: e }),
										step: .5,
										suffix: "%"
									}),
									/* @__PURE__ */ B(Q, {
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
									/* @__PURE__ */ B(Q, {
										label: "Price density threshold",
										hint: "Items worth less than this per m³ (T1 ships, bulky junk) pay the extra tax. 0: off.",
										value: T.price_density_threshold,
										onChange: (e) => E({ price_density_threshold: e }),
										step: 100,
										suffix: "ISK / m³"
									}),
									/* @__PURE__ */ B(Q, {
										label: "Price density tax",
										value: T.price_density_tax,
										onChange: (e) => E({ price_density_tax: e }),
										step: .5,
										suffix: "%"
									}),
									/* @__PURE__ */ V("div", {
										className: "divide-y divide-border border border-border px-3",
										children: [
											/* @__PURE__ */ B(b, {
												label: "Use compressed volume",
												description: "Ore and ice count with their compressed volume for hauling and price density.",
												checked: T.compressed_volume,
												onCheckedChange: (e) => E({ compressed_volume: e })
											}),
											/* @__PURE__ */ B(b, {
												label: "Buy every item",
												description: "Off: only items you add in the item rules are bought.",
												checked: T.allow_all_items,
												onCheckedChange: (e) => E({ allow_all_items: e })
											}),
											/* @__PURE__ */ B(b, {
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
				/* @__PURE__ */ B(S, {
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
										/* @__PURE__ */ B(b, {
											label: "Raw price",
											description: "Some ores (Kernite, moon ores) sell for less than their minerals.",
											checked: T.use_raw,
											onCheckedChange: (e) => E({ use_raw: e })
										}),
										/* @__PURE__ */ B(b, {
											label: "Compressed price",
											description: "One unit of ore compresses into one unit of compressed ore.",
											checked: T.use_compressed,
											onCheckedChange: (e) => E({ use_compressed: e })
										}),
										/* @__PURE__ */ B(b, {
											label: "Refined value",
											description: "What reprocessing gives, at the refining rate below.",
											checked: T.use_refined,
											onCheckedChange: (e) => E({ use_refined: e })
										})
									]
								}),
								/* @__PURE__ */ B(Q, {
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
										/* @__PURE__ */ B(b, {
											label: "Tech I modules at reprocessed value",
											description: "Named and Tech I modules are worth what they reprocess into.",
											checked: T.t1_refined,
											onCheckedChange: (e) => E({ t1_refined: e })
										}),
										/* @__PURE__ */ B(b, {
											label: "Sleeper loot at NPC price",
											description: "Blue loot at the NPC buy order price, even if the market pays more.",
											checked: T.blue_loot_npc,
											onCheckedChange: (e) => E({ blue_loot_npc: e })
										}),
										/* @__PURE__ */ B(b, {
											label: "Triglavian loot at NPC price",
											description: "Red loot at the NPC buy order price.",
											checked: T.red_loot_npc,
											onCheckedChange: (e) => E({ red_loot_npc: e })
										})
									]
								}),
								/* @__PURE__ */ B(Q, {
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
				/* @__PURE__ */ B(S, {
					value: "access",
					children: /* @__PURE__ */ V("div", {
						className: "grid gap-6 lg:grid-cols-3",
						children: [
							/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, {
								title: "States",
								description: "None ticked here or under groups: every member."
							}), /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(et, {
								items: k.states,
								selected: T.state_ids,
								onChange: (e) => E({ state_ids: e }),
								empty: "No states."
							}) })] }),
							/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, { title: "Groups" }), /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(et, {
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
									/* @__PURE__ */ B(et, {
										items: A,
										selected: T.manager_ids,
										onChange: (e) => E({ manager_ids: e }),
										empty: "Nobody else may run programs."
									}),
									/* @__PURE__ */ B("div", {
										className: "border border-border px-3",
										children: /* @__PURE__ */ B(b, {
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
			onOpenChange: x,
			title: `Delete ${u.data?.name}?`,
			description: "Its quotes, item rules and contract history go with it. Contracts in the game aren't touched.",
			confirmLabel: "Delete",
			danger: !0,
			onConfirm: () => ie.mutateAsync()
		}),
		te && /* @__PURE__ */ B(at, {
			location: null,
			onClose: () => C(!1),
			onSaved: (e) => E({ location_ids: [...T.location_ids, e.id] })
		})
	] });
}
function nt(e) {
	let t = {};
	for (let n of Object.keys($e)) t[n] = e[n];
	return t;
}
function $({ kind: e, placeholder: t, onPick: n }) {
	let [r, i] = I(""), { data: a } = F({
		queryKey: [
			"buyback",
			"search",
			e,
			r
		],
		queryFn: () => D.get(`${K}/manage/search/${e}?q=${encodeURIComponent(r)}`),
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
				children: e.icon ? /* @__PURE__ */ B(q, {
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
function rt() {
	let { id: t } = R(), r = se(), c = [
		"buyback",
		"managed",
		t
	], { data: l } = F({
		queryKey: c,
		queryFn: () => D.get(`${K}/manage/programs/${t}`)
	}), [d, h] = I(null), [g, v] = I("tax"), [y, b] = I("0"), [x, S] = I(""), [te, ne] = I(!1), C = (e) => r.setQueryData(c, (t) => t && {
		...t,
		item_rules: e
	}), re = (e) => r.setQueryData(c, (t) => t && {
		...t,
		watch_rules: e
	}), w = P({
		mutationFn: () => D.post(`${K}/manage/programs/${t}/items`, {
			type_ids: d?.kind === "type" ? [d.hit.id] : [],
			market_group_id: d?.kind === "market" ? d.hit.id : null,
			tax: g === "tax" ? Number(y) : 0,
			disallowed: g === "banned",
			static_price: g === "fixed" ? Number(y) : null
		}),
		onSuccess: (e) => {
			C(e.item_rules), N.success(`${e.added} item${e.added === 1 ? "" : "s"} set`), h(null);
		},
		onError: (e) => N.error(e.message)
	}), T = P({
		mutationFn: (e) => D.delete(`${K}/manage/programs/${t}/items/${e}`),
		onSuccess: (e) => C(e.item_rules)
	}), E = P({
		mutationFn: () => D.delete(`${K}/manage/programs/${t}/items`),
		onSuccess: (e) => C(e.item_rules)
	}), O = P({
		mutationFn: (e) => D.post(`${K}/manage/programs/${t}/watchlist`, e),
		onSuccess: re,
		onError: (e) => N.error(e.message)
	}), ie = P({
		mutationFn: (e) => D.delete(`${K}/manage/programs/${t}/watchlist/${e}`),
		onSuccess: re
	});
	if (!l) return /* @__PURE__ */ B(_, { className: "h-96" });
	let k = l.item_rules.filter((e) => e.name.toLowerCase().includes(x.toLowerCase()));
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(X, {
			to: `${Z}/${t}`,
			children: l.name
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(be, {}),
			title: "Item rules",
			description: l.allow_all_items ? "Everything is bought at the program's terms; these items have their own: extra tax (or less), a fixed price, or not bought." : "Only these items are bought."
		}),
		/* @__PURE__ */ V("div", {
			className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]",
			children: [/* @__PURE__ */ V("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, {
					title: "Add items",
					description: "One item, or every item in a market group and the groups under it (Minerals, Standard Ores, Salvaged Materials…)."
				}), /* @__PURE__ */ V(a, {
					className: "space-y-4",
					children: [/* @__PURE__ */ V("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ B($, {
							kind: "types",
							placeholder: "Find an item…",
							onPick: (e) => h({
								kind: "type",
								hit: e
							})
						}), /* @__PURE__ */ B($, {
							kind: "market-groups",
							placeholder: "Find a market group…",
							onPick: (e) => h({
								kind: "market",
								hit: e
							})
						})]
					}), d && /* @__PURE__ */ V("div", {
						className: "space-y-4 border border-border bg-surface-2 p-4",
						children: [
							/* @__PURE__ */ V("div", {
								className: "text-sm",
								children: [
									d.kind === "market" ? "Every item in " : "",
									/* @__PURE__ */ B("span", {
										className: "font-medium",
										children: d.hit.name
									}),
									/* @__PURE__ */ V("span", {
										className: "text-subtle",
										children: [" · ", d.hit.subtitle]
									})
								]
							}),
							/* @__PURE__ */ V("div", {
								className: "flex flex-wrap items-end gap-3",
								children: [/* @__PURE__ */ B(ee, {
									value: g,
									onChange: v,
									options: [
										{
											value: "tax",
											label: "Tax"
										},
										{
											value: "fixed",
											label: "Fixed price"
										},
										{
											value: "banned",
											label: "Not bought"
										}
									]
								}), g !== "banned" && /* @__PURE__ */ V("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ B(f, {
										type: "number",
										value: y,
										onChange: (e) => b(e.target.value),
										className: "w-36 font-mono"
									}), /* @__PURE__ */ B("span", {
										className: "text-sm text-subtle",
										children: g === "tax" ? "% on top of the program's (negative for less)" : "ISK per unit, no tax"
									})]
								})]
							}),
							/* @__PURE__ */ V("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ B(n, {
									variant: "primary",
									loading: w.isPending,
									onClick: () => w.mutate(),
									children: "Set"
								}), /* @__PURE__ */ B(n, {
									variant: "ghost",
									onClick: () => h(null),
									children: "Cancel"
								})]
							})
						]
					})]
				})] }), /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ V("div", {
					className: "flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3",
					children: [/* @__PURE__ */ V("div", {
						className: "hud-label text-subtle",
						children: [
							l.item_rules.length,
							" item",
							l.item_rules.length === 1 ? "" : "s"
						]
					}), /* @__PURE__ */ V("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ B(m, {
							value: x,
							onChange: (e) => S(e.target.value),
							placeholder: "Filter",
							className: "w-48"
						}), l.item_rules.length > 0 && /* @__PURE__ */ V(n, {
							size: "sm",
							variant: "ghost",
							onClick: () => ne(!0),
							children: [/* @__PURE__ */ B(W, {}), " Remove all"]
						})]
					})]
				}), k.length === 0 ? /* @__PURE__ */ B(u, {
					icon: /* @__PURE__ */ B(be, {}),
					title: l.item_rules.length ? "No match" : "No item rules"
				}) : /* @__PURE__ */ B("ul", {
					className: "max-h-[600px] divide-y divide-border overflow-y-auto",
					children: k.map((t) => /* @__PURE__ */ V("li", {
						className: "flex items-center justify-between gap-3 px-4 py-2",
						children: [/* @__PURE__ */ B(q, {
							icon: t.icon,
							name: t.name
						}), /* @__PURE__ */ V("div", {
							className: "flex shrink-0 items-center gap-3",
							children: [t.disallowed ? /* @__PURE__ */ B(e, {
								tone: "danger",
								children: "not bought"
							}) : t.static_price == null ? /* @__PURE__ */ V("span", {
								className: "font-mono text-sm text-muted",
								children: [
									t.tax > 0 ? "+" : "",
									t.tax,
									"% tax"
								]
							}) : /* @__PURE__ */ B("span", {
								className: "font-mono text-sm",
								children: A(t.static_price, { full: !0 })
							}), /* @__PURE__ */ B(n, {
								size: "icon-xs",
								variant: "ghost",
								"aria-label": `Remove ${t.name}`,
								onClick: () => T.mutate(t.type_id),
								children: /* @__PURE__ */ B(W, {})
							})]
						})]
					}, t.type_id))
				})] })]
			}), /* @__PURE__ */ V(i, {
				className: "h-fit",
				children: [/* @__PURE__ */ B(o, {
					title: "Manual review",
					description: "Quotes with these items are flagged, and so are their contracts: officer modules, rare loot, anything easy to manipulate."
				}), /* @__PURE__ */ V(a, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ B($, {
							kind: "types",
							placeholder: "Add an item…",
							onPick: (e) => O.mutate({ type_id: e.id })
						}),
						/* @__PURE__ */ B($, {
							kind: "groups",
							placeholder: "Add an item group…",
							onPick: (e) => O.mutate({ group_id: e.id })
						}),
						l.watch_rules.length === 0 ? /* @__PURE__ */ B("p", {
							className: "text-sm text-subtle",
							children: "Nothing on the list."
						}) : /* @__PURE__ */ B("ul", {
							className: "divide-y divide-border border border-border",
							children: l.watch_rules.map((e) => /* @__PURE__ */ V("li", {
								className: "flex items-center justify-between gap-3 px-3 py-2",
								children: [/* @__PURE__ */ B(q, {
									icon: e.icon,
									name: e.name,
									sub: e.kind === "group" ? "Item group" : void 0
								}), /* @__PURE__ */ B(n, {
									size: "icon-xs",
									variant: "ghost",
									"aria-label": `Remove ${e.name}`,
									onClick: () => ie.mutate(e.id),
									children: /* @__PURE__ */ B(W, {})
								})]
							}, e.id))
						}),
						/* @__PURE__ */ V("p", {
							className: "flex items-center gap-1.5 text-xs text-subtle",
							children: [/* @__PURE__ */ B(fe, { className: "size-3.5" }), " Sellers see which of their items will be checked."]
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ B(s, {
			open: te,
			onOpenChange: ne,
			title: "Remove every item rule?",
			description: l.allow_all_items ? "All items go back to the program's terms." : "The program won't buy anything until you add items again.",
			confirmLabel: "Remove all",
			danger: !0,
			onConfirm: () => E.mutateAsync()
		})
	] });
}
function it() {
	let t = Ye(), r = F({
		queryKey: ["buyback", "options"],
		queryFn: () => D.get(`${K}/manage/options`)
	}), [a, o] = I(null), s = P({
		mutationFn: (e) => D.delete(`${K}/manage/locations/${e}`),
		onSuccess: t,
		onError: (e) => N.error(e.message)
	});
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(X, {
			to: Z,
			children: "Programs"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(ge, {}),
			title: "Locations",
			description: "Where sellers make their contracts. Programs pick one or more.",
			actions: /* @__PURE__ */ V(n, {
				variant: "primary",
				onClick: () => o("new"),
				children: [/* @__PURE__ */ B(pe, {}), " Add location"]
			})
		}),
		/* @__PURE__ */ B(i, { children: r.data ? r.data.locations.length === 0 ? /* @__PURE__ */ B(u, {
			icon: /* @__PURE__ */ B(ge, {}),
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
					children: [/* @__PURE__ */ B(Te, { system: t.system }), t.structure_id ? /* @__PURE__ */ V("span", {
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
						children: [/* @__PURE__ */ B(ve, {}), " Edit"]
					}), /* @__PURE__ */ V(n, {
						size: "sm",
						variant: "ghost",
						onClick: () => s.mutate(t.id),
						children: [/* @__PURE__ */ B(W, {}), " Remove"]
					})]
				})]
			}, t.id))
		}) : /* @__PURE__ */ B(_, { className: "h-32" }) }),
		a && /* @__PURE__ */ B(at, {
			location: a === "new" ? null : a,
			onClose: () => o(null)
		})
	] });
}
function at({ location: e, onClose: t, onSaved: r }) {
	let i = Ye(), [a, o] = I(e?.name ?? ""), [s, c] = I(e?.system ? {
		id: e.system.id,
		name: e.system.name
	} : null), [u, p] = I(e?.structure_id ? String(e.structure_id) : ""), m = P({
		mutationFn: () => {
			let t = {
				name: a,
				solar_system_id: s?.id,
				structure_id: u ? Number(u) : null
			};
			return e ? D.put(`${K}/manage/locations/${e.id}`, t) : D.post(`${K}/manage/locations`, t);
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
					children: /* @__PURE__ */ B($, {
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
					}) : /* @__PURE__ */ B($, {
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
var ot = {
	region: "a whole region",
	system: "a solar system",
	station: "a station",
	structure: "a player structure"
};
function st(e) {
	return e >= 1e7 && e < 2e7 ? "region" : e >= 3e7 && e < 4e7 ? "system" : e >= 6e7 && e < 7e7 ? "station" : "structure";
}
function ct({ hubs: e, hubId: t, hubName: n, esi: r, onChange: i, note: a, label: o = "Trade hub" }) {
	let s = e.find((e) => e.id === t), [c, l] = I(!s), u = st(t);
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
					/* @__PURE__ */ B($, {
						kind: "hubs",
						placeholder: "Find a region, system, station or structure…",
						onPick: (e) => i(e.id, e.name)
					}),
					/* @__PURE__ */ V("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ B(d, {
							label: "Market id",
							hint: `Now ${ot[u]}. Or paste an id: a structure's is in its chat link (showinfo:35826//1037962518481).`,
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
function lt({ value: e, market: t, onChange: n }) {
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
			children: /* @__PURE__ */ B(b, {
				label: `Price at the site's market (${t.hub_name})`,
				description: "Off: pick a market for this program. Sellers see which one on the program and on every quote.",
				checked: !r,
				onCheckedChange: (e) => e ? n(null, "") : n(t.hub_id, t.hub_name)
			})
		}), r && /* @__PURE__ */ B(ct, {
			label: "This program's market",
			hubs: t.hubs,
			hubId: e.hub_id,
			hubName: e.hub_name,
			esi: t.source === "esi",
			onChange: n,
			note: st(e.hub_id) === "structure" ? "A player structure's market is read with the login of the character contracts go to, so it must be able to dock there and use the market." : `Prices come from ${t.source_name}, like the site's.`
		})]
	});
}
function ut() {
	let e = se(), t = ["buyback", "settings"], { data: r } = F({
		queryKey: t,
		queryFn: () => D.get(`${K}/settings`)
	}), [s, c] = I(null), l = s ?? (r ? {
		...r,
		janice_api_key: "",
		esi_character_id: r.esi_character?.id ?? null
	} : null), u = (e) => l && c({
		...l,
		...e
	}), m = P({
		mutationFn: (e) => D.put(`${K}/settings`, e),
		onSuccess: (n) => {
			e.setQueryData(t, n), c(null), e.invalidateQueries({ queryKey: ["buyback"] }), N.success("Saved");
		},
		onError: (e) => N.error(e.message)
	}), h = P({
		mutationFn: () => D.post(`${K}/settings/refresh-prices`),
		onSuccess: (e) => N.success(e.queued ? "Reading the market now; it takes a minute or two" : `${e.refreshed} prices refreshed`),
		onError: (e) => N.error(e.message)
	});
	if (!l) return /* @__PURE__ */ B(_, { className: "h-96" });
	let v = st(l.hub_id), y = l.price_source === "esi";
	return /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(X, {
			to: Z,
			children: "Programs"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(me, {}),
			title: "Buyback settings",
			description: "Prices and tracking for every program.",
			actions: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ V(n, {
				onClick: () => h.mutate(),
				loading: h.isPending,
				disabled: !!s,
				children: [
					/* @__PURE__ */ B(he, {}),
					" ",
					y ? "Read the market now" : `Refresh ${j(l.prices_stored)} prices`
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
					}) : /* @__PURE__ */ B(ct, {
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
							M(r.market_pulled_at),
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
										j(e.prices),
										" prices",
										r.price_source === "esi" && /* @__PURE__ */ V(z, { children: [" · ", e.pulled_at ? /* @__PURE__ */ V(z, { children: [
											"read ",
											M(e.pulled_at),
											e.note && `: ${e.note}`
										] }) : e.note || "not read yet"] })
									]
								})]
							}, e.id))
						})]
					}),
					/* @__PURE__ */ B("div", {
						className: "border border-border px-3",
						children: /* @__PURE__ */ B(b, {
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
						children: /* @__PURE__ */ B(b, {
							label: "Check prices against recent trading",
							checked: l.guard_enabled,
							onCheckedChange: (e) => u({ guard_enabled: e })
						})
					}), l.guard_enabled && /* @__PURE__ */ V(z, { children: [
						/* @__PURE__ */ V("div", {
							className: "grid gap-4 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ B(Q, {
									label: "Suspect above",
									value: l.guard_threshold,
									onChange: (e) => u({ guard_threshold: e }),
									step: 5,
									suffix: "% off"
								}),
								/* @__PURE__ */ B(Q, {
									label: "Average over",
									value: l.guard_days,
									onChange: (e) => u({ guard_days: e }),
									suffix: "days"
								}),
								/* @__PURE__ */ B(Q, {
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
							children: /* @__PURE__ */ B(b, {
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
							children: [/* @__PURE__ */ B(b, {
								label: "All or nothing",
								description: "A paste with any item a program doesn't buy gets no quote at all.",
								checked: l.reject_disallowed,
								onCheckedChange: (e) => u({ reject_disallowed: e })
							}), /* @__PURE__ */ B(b, {
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
function dt() {
	let { data: t, isLoading: n } = F({
		queryKey: ["buyback", "manage"],
		queryFn: () => D.get(`${K}/manage`),
		refetchInterval: 3e5
	});
	if (n || !t) return /* @__PURE__ */ B(_, { className: "h-16" });
	let r = t.programs.reduce((e, t) => e + t.open, 0), i = t.programs.reduce((e, t) => e + t.problems, 0), a = t.programs.reduce((e, t) => e + t.open_value, 0);
	return /* @__PURE__ */ B(L, {
		to: Z,
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
					children: A(a)
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
//#region src/public.tsx
var ft = "/public/p/buyback";
function pt() {
	let { data: e, isLoading: t } = F({
		queryKey: [
			"buyback",
			"public",
			"programs"
		],
		queryFn: () => D.get(`${Se}/programs`)
	});
	return /* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B(p, {
		icon: /* @__PURE__ */ B(U, {}),
		eyebrow: "Buyback",
		title: "Sell to us",
		description: "Paste your items for an instant quote, then contract them in game."
	}), t ? /* @__PURE__ */ B(_, { className: "h-56" }) : e?.programs.length ? /* @__PURE__ */ B("div", {
		className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
		children: e.programs.map((e) => /* @__PURE__ */ B(Ve, {
			program: e,
			to: `${ft}/${e.id}`
		}, e.id))
	}) : /* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(U, {}),
		title: "No public buyback programs"
	}) })] });
}
function mt() {
	let { id: e } = R(), { data: t, isLoading: n } = F({
		queryKey: [
			"buyback",
			"public",
			"program",
			e
		],
		queryFn: () => D.get(`${Se}/programs/${e}`)
	});
	return n ? /* @__PURE__ */ B(_, { className: "h-96" }) : t ? /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(X, {
			to: ft,
			children: "All programs"
		}),
		/* @__PURE__ */ B(p, {
			icon: /* @__PURE__ */ B(U, {}),
			eyebrow: `Buyback · ${t.tax}% tax · priced at ${t.prices.hub}`,
			title: t.name,
			description: t.description || void 0
		}),
		/* @__PURE__ */ B(Ie, {
			program: t,
			base: Se,
			quoteLink: (e) => `${ft}/quotes/${e}`
		})
	] }) : /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(U, {}),
		title: "No such program",
		description: "It may be closed, or no longer public."
	});
}
function ht() {
	let { tracking: e } = R(), { data: t, isLoading: n } = F({
		queryKey: [
			"buyback",
			"public",
			"quote",
			e
		],
		queryFn: () => D.get(`${Se}/quotes/${e}`)
	});
	return n ? /* @__PURE__ */ B(_, { className: "h-96" }) : t ? /* @__PURE__ */ V("div", { children: [
		/* @__PURE__ */ B(X, {
			to: `${ft}/${t.program.id}`,
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
					/* @__PURE__ */ B(we, { value: t.tracking_number })
				]
			}),
			description: "Keep this page's address to follow the contract."
		}),
		/* @__PURE__ */ V("div", {
			className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]",
			children: [/* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(Ne, { lines: t.lines ?? [] }) }), /* @__PURE__ */ B("div", {
				className: "space-y-4",
				children: t.contract ? /* @__PURE__ */ B(i, { children: /* @__PURE__ */ V(a, {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ B("div", {
							className: "hud-label text-subtle",
							children: "Contract"
						}),
						/* @__PURE__ */ B(De, {
							status: t.contract.status,
							label: t.contract.status_label
						}),
						/* @__PURE__ */ B("div", {
							className: "font-mono text-2xl tabular-nums",
							children: A(t.value, { full: !0 })
						}),
						/* @__PURE__ */ V("div", {
							className: "text-xs text-subtle",
							children: [j(t.volume), " m³"]
						})
					]
				}) }) : /* @__PURE__ */ B(Fe, { quote: t })
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
var gt = ae({
	routes: [
		{
			path: "",
			Component: He
		},
		{
			path: "programs/:id",
			Component: Ue
		},
		{
			path: "me",
			Component: We
		},
		{
			path: "quotes/:tracking",
			Component: Ke
		},
		{
			path: "contracts/:id",
			Component: qe
		},
		{
			path: "manage",
			Component: Xe
		},
		{
			path: "manage/new",
			Component: tt
		},
		{
			path: "manage/locations",
			Component: it
		},
		{
			path: "manage/:id",
			Component: Qe
		},
		{
			path: "manage/:id/edit",
			Component: tt
		},
		{
			path: "manage/:id/items",
			Component: rt
		},
		{
			path: "settings",
			Component: ut
		}
	],
	publicRoutes: [
		{
			path: "",
			Component: pt
		},
		{
			path: ":id",
			Component: mt
		},
		{
			path: "quotes/:tracking",
			Component: ht
		}
	],
	widgets: [{
		id: "seller",
		title: "Buyback",
		Component: Je,
		size: "sm",
		order: 47
	}, {
		id: "manager",
		title: "Buyback desk",
		Component: dt,
		size: "sm",
		order: 48,
		permission: "buyback.manage_programs"
	}]
});
//#endregion
export { gt as default };

export const classes = ["!data","!isNew","!o","---","--------------------------------------------------------------------","-------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------","----------------------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------------------","---------------------------------------------------------------------------------------------------------","-day","@conduit/sdk","@tanstack/react-query","a","able","about","above","absolute","accent","accept","accepted","accepted_count","access","action","actions","active","actually","add","added","address","after","again","against","age","align","all","allow_all_items","allow_unpacked","alt","always","an","and","another","any","anything","anywhere","apply","are","aren","aria-label","aria-pressed","as","asked","asks","assembled","assignee","at","autoComplete","average","averaged","back","balance","banned","base","basics","bb-paste","be","because","been","before","below","best","bg-accent-soft","bg-bg","bg-danger-soft","bg-surface-2","bg-surface-raised","bg-warning-soft","block","blocked","blue_loot_npc","body","boolean","border","border-accent","border-accent/40","border-b","border-border","border-border-strong","border-danger/40","border-warning/40","bought","box","broken","bulky","but","button","buy","buyback","buys","by","calculator","can","can_create","can_manage","can_read","can_see_leaderboards","cell","changed","character","characters","chat","checked","checks","children","className","clears","closed","code","color","columns","come","compact","compare","compressed","compressed_volume","compresses","confirmLabel","const","content","contract","contract_id","contracted","contracts","copy","corporation","cost","costs","count","covers","create","created","created_at","crystals","current","currentColor","cursor-help","cursor-pointer","cx","cy","danger","dashboard","data","date","date_completed","date_expired","date_issued","day","days","days_traded","decoration-border-strong","decoration-dotted","default","default_prefix","definePlugin","delete","deleted","density","density_tax","description","desk","deviation","disabled","disallowed","divide-border","divide-y","division","dock","doesn","don","drops","each","easier","easy","else","elsewhere","empty","en","enabled","enough","error","esi","esi_character","esi_character_id","even","every","everything","exchange","existing","expiration_days","expire","expired","export","extends","extra","eyebrow","facts","failed","far","fast","faster","fetched","few","fewer","fill","filter","find","finished","finished_contractor","finished_issuer","first","fixed","flagged","flex","flex-wrap","follow","font-medium","font-mono","font-semibold","footer","for","form","format","found","free","from","full","full_name","function","fuzzwork","g","game","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-6","get","gets","ghost","give","given","go","grid","grid-cols-3","grid-cols-[28px_1fr]","group","group_id","group_ids","groups","guard","guard_both_ways","guard_days","guard_enabled","guard_min_days","guard_threshold","h-16","h-32","h-48","h-56","h-64","h-96","h-fit","h-full","hand","happened","has","hasn","haul","hauling","hauling_fuel_cost","hauling_unit","have","haven","header","height","here","hint","history","history_region","hit","hours","hover:bg-hover","hover:text-text","hover:underline","how","htmlFor","hub","hubId","hubName","hub_id","hub_kind","hub_name","hubs","hud-label","hundred","ice","icon","icon-xs","icons","id","ids","if","import","in","in-game","in_progress","included","info","inline","inline-flex","instant","instant_prices","instead","interactive","interface","into","invalidate","is","isLoading","isNew","is_corporation","isn","issuer","issuer_corporation","it","item","item_rules","items","items-center","items-end","items-start","its","janice","janice_api_key","janice_key_set","justify-between","k","keeps","key","keyof","kind","known","l","label","last","lately","lazy","leaderboard","leading-none","leave","ledger","length","less","lg:col-span-2","lg:grid-cols-2","lg:grid-cols-3","like","line","line-clamp-2","lines","link","list","listed","lives","loading","location","location_ids","locations","log","logged","login","login_ok","longer","look","loot","low","lower","m","m-4","m12","m15","m16.71","m21.73","m3.3","made","main","make","manage","manage/locations","manage/new","manage_all_programs","manage_programs","managed","manager","managerChoices","manager_ids","managers","manages","manages_all","manipulation","manual","market","market-groups","market_group_id","market_note","market_pulled_at","market_unit","markets","match","matches","materials","max-h-72","max-h-[600px]","may","mb-4","mb-6","md:grid-cols-2","me","member","members","method","min-w-0","mine","minerals","mining","minute","minutes","ml-1.5","ml-2","mode","modules","mono","month","month_count","month_value","months","moon","more","move","mr-2","mt-0.5","mt-1","mt-1.5","mt-2","mt-3","mt-4","mt-6","must","mutationFn","n","name","navigate","need","needed","needs","neutral","new","no","nobody","none","normally","not","note","nothing","notify_managers","now","nowhere","npc","null","number","numeric","o","of","off","officer","often","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpenChange","onPick","onRowClick","onSaved","onSuccess","one","only","opacity-60","open","open_value","opened","options","or","order","ore","ores","others","out","outstanding","over","overflow-x-auto","overflow-y-auto","overview","own","owner","ownerChoices","owner_id","p-3","p-4","p-5","p-6","page","pages","panel","parts","password","paste","patch","path","pay","pays","pct","per","permission","pick","place","place-items-center","placeholder","places","player","post","prefix","preset","price","price_density_tax","price_density_threshold","price_max_age_hours","price_source","price_type","priced","prices","prices_stored","pricing","primary","problems","program","programs","propped-up","public","publicRoutes","pulled_at","put","px-2","px-2.5","px-3","px-4","py-1","py-1.5","py-2","py-3","q","qc","quantity","queryFn","queryKey","queued","quote","quoteLink","quoted","quotes","rare","rarely","rate","rather","raw","re","react","react-router","read","reads","reason","receive","recent","recognised","red_loot_npc","refetchInterval","refined","refines","refining","refining_rate","refresh","refreshed","region","reject","reject_disallowed","rejected","rejected_count","relative","reliable","remove","removeAll","removed","repackaged","replace","reprocess","reprocessed","reprocessing","required","rest","restrict_quotes","result","return","reversed","review","right","right-click","round","routes","rowKey","rows","ruleId","rules","run","rx","ry","s","sales","save","says","search","secondary","security","see","seen","select","selected","sell","seller","sellers","set","setAddingLocation","setAmount","setClearAll","setConfirmDelete","setDone","setEditing","setFilter","setForm","setMode","setName","setOpen","setOther","setQ","setQueryData","setRules","setStructureId","setSystem","setTarget","setText","setWatch","settings","settled","severe","shadow-e3","ships","short","shows","shrink-0","signed","sit","site","size","size-3","size-3.5","size-4","size-7","size-8","sm","sm:grid-cols-2","sm:grid-cols-3","smaller","so","solar","solar_system_id","solar_system_name","sold","sold_value","sortValue","source","source_name","space-y-1","space-y-1.5","space-y-2","space-y-3","space-y-4","space-y-5","space-y-6","special","split","src","standard","starts","state","state_ids","states","static_price","station","stations","statistics","stats","status","status_label","stay","step","stored","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structure","structureId","structure_id","style","sub","subtitle","success","such","suffix","sync","synced","system","systems","t","t1_refined","t1_refining_rate","tabIndex","tabular-nums","take","takes","target_id","tax","terms","text","text-2xl","text-3xl","text-[11px]","text-[13px]","text-[15px]","text-[34px]","text-accent-ink","text-center","text-danger-fg","text-info-fg","text-left","text-lg","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xs","than","that","the","their","them","then","there","these","they","third-party","this","those","threshold","ticked","time","timeAgo","title","to","told","tone","top","top_items","total","total_count","total_value","totals","tracking","tracking-wider","tracking_number","tracking_prefix","trade","traded","trades","trading","transition","true","truncate","trust","two","type","typeId","type_id","type_ids","typed","typeof","types","undefined","under","underline","underline-offset-4","unit","unit_price","units","unknown","unless","unlinked_purge_hours","until","unusual","unwatch","up","updated","updated_at","uppercase","us","use","useMutation","useParams","useQuery","useQueryClient","useState","use_compressed","use_raw","use_refined","used","v","value","valued","variant","view","viewBox","void","volume","w-28","w-36","w-40","w-48","w-56","w-full","waiting","wallet","wallet_division","want","warning","was","watch","watch_rules","watchlist","ways","were","what","when","which","who","whole","widgets","width","will","with","within","without","won","words","worth","x","xl:grid-cols-3","xl:grid-cols-4","xl:grid-cols-[minmax(0,1fr)_360px]","xl:grid-cols-[minmax(0,1fr)_380px]","xl:grid-cols-[minmax(0,1fr)_400px]","xs","yet","you","your","z-20"];
