import { Avatar as e, Badge as t, Button as n, Callout as r, Card as i, CardHeader as a, ConfirmDialog as o, Dialog as s, EmptyState as c, Field as l, Input as u, Meter as d, PageHeader as f, SearchInput as p, Segmented as m, Select as h, Skeleton as g, SwitchRow as _, THead as v, Table as y, Td as b, Textarea as x, Th as S, Tooltip as C, Tr as w, api as T, cn as E, definePlugin as D, isk as O, num as k, toast as A, useBootstrap as ee } from "@conduit/sdk";
import { useMutation as j, useQuery as M, useQueryClient as te } from "@tanstack/react-query";
import { Link as N, useNavigate as P, useParams as F, useSearchParams as ne } from "react-router";
import { Fragment as re, useEffect as ie, useId as ae, useState as I } from "react";
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
	children: [
		/* @__PURE__ */ R("polyline", { points: "14.5 17.5 3 6 3 3 6 3 17.5 14.5" }),
		/* @__PURE__ */ R("line", {
			x1: "13",
			x2: "19",
			y1: "19",
			y2: "13"
		}),
		/* @__PURE__ */ R("line", {
			x1: "16",
			x2: "20",
			y1: "16",
			y2: "20"
		}),
		/* @__PURE__ */ R("line", {
			x1: "19",
			x2: "21",
			y1: "21",
			y2: "19"
		}),
		/* @__PURE__ */ R("polyline", { points: "14.5 6.5 18 3 21 3 21 6 17.5 9.5" }),
		/* @__PURE__ */ R("line", {
			x1: "5",
			x2: "9",
			y1: "14",
			y2: "18"
		}),
		/* @__PURE__ */ R("line", {
			x1: "7",
			x2: "4",
			y1: "17",
			y2: "20"
		}),
		/* @__PURE__ */ R("line", {
			x1: "3",
			x2: "5",
			y1: "19",
			y2: "21"
		})
	]
}), H = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ R("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), oe = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ R("polyline", { points: "17 8 12 3 7 8" }),
		/* @__PURE__ */ R("line", {
			x1: "12",
			x2: "12",
			y1: "3",
			y2: "15"
		})
	]
}), U = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M5 12h14" }), /* @__PURE__ */ R("path", { d: "M12 5v14" })]
}), se = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" })
}), W = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M3 6h18" }),
		/* @__PURE__ */ R("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ R("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), G = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
		/* @__PURE__ */ R("circle", {
			cx: "9",
			cy: "7",
			r: "4"
		}),
		/* @__PURE__ */ R("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
		/* @__PURE__ */ R("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
	]
}), ce = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "M20 6 9 17l-5-5" })
}), le = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ R("polyline", { points: "12 6 12 12 16 14" })]
}), ue = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("circle", {
		cx: "12",
		cy: "12",
		r: "9"
	}), /* @__PURE__ */ R("circle", {
		cx: "12",
		cy: "12",
		r: "4"
	})]
}), de = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("line", {
			x1: "8",
			x2: "21",
			y1: "6",
			y2: "6"
		}),
		/* @__PURE__ */ R("line", {
			x1: "8",
			x2: "21",
			y1: "12",
			y2: "12"
		}),
		/* @__PURE__ */ R("line", {
			x1: "8",
			x2: "21",
			y1: "18",
			y2: "18"
		}),
		/* @__PURE__ */ R("line", {
			x1: "3",
			x2: "3.01",
			y1: "6",
			y2: "6"
		}),
		/* @__PURE__ */ R("line", {
			x1: "3",
			x2: "3.01",
			y1: "12",
			y2: "12"
		}),
		/* @__PURE__ */ R("line", {
			x1: "3",
			x2: "3.01",
			y1: "18",
			y2: "18"
		})
	]
}), fe = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "m18 15-6-6-6 6" })
}), pe = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "m6 9 6 6 6-6" })
}), me = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" }),
		/* @__PURE__ */ R("path", { d: "M12 7v6" }),
		/* @__PURE__ */ R("path", { d: "M9 10h6" })
	]
}), K = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ R("polyline", { points: "7 10 12 15 17 10" }),
		/* @__PURE__ */ R("line", {
			x1: "12",
			x2: "12",
			y1: "15",
			y2: "3"
		})
	]
}), q = "/api/p/doctrines";
//#endregion
//#region src/home.tsx
function J() {
	return M({
		queryKey: ["doctrines", "overview"],
		queryFn: () => T.get(q)
	});
}
function he() {
	let { data: e, isLoading: r } = J(), [a, o] = I(!1);
	return /* @__PURE__ */ z(L, { children: [
		/* @__PURE__ */ R(f, {
			eyebrow: "Operations",
			title: "Doctrines",
			icon: /* @__PURE__ */ R(V, {}),
			description: "The ships and fits we fly. Open a fit to see it like the in-game fitting window, copy it into the game, and see which of your characters can fly it.",
			actions: e?.can_manage && /* @__PURE__ */ z("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ R(N, {
					to: "/p/doctrines/fits",
					children: /* @__PURE__ */ z(n, {
						variant: "ghost",
						children: [/* @__PURE__ */ R(de, {}), " All fits"]
					})
				}), /* @__PURE__ */ z(n, {
					variant: "primary",
					onClick: () => o(!0),
					children: [/* @__PURE__ */ R(U, {}), " New doctrine"]
				})]
			})
		}),
		r || !e ? /* @__PURE__ */ R("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ R(g, { className: "h-56" }, e))
		}) : e.doctrines.length === 0 ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(c, {
			icon: /* @__PURE__ */ R(V, {}),
			title: "No doctrines yet",
			description: e.can_manage ? "Create one with New doctrine, then add fits by pasting them from the game." : "Your FCs haven't added any doctrines yet."
		}) }) : /* @__PURE__ */ R("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
			children: e.doctrines.map((e) => /* @__PURE__ */ R(N, {
				to: `/p/doctrines/${e.id}`,
				className: "block",
				children: /* @__PURE__ */ z(i, {
					interactive: !0,
					className: e.active ? "h-full overflow-hidden" : "h-full overflow-hidden opacity-60",
					children: [/* @__PURE__ */ z("div", {
						className: "relative h-36 overflow-hidden bg-surface-2",
						children: [
							e.render && /* @__PURE__ */ R("img", {
								src: e.render,
								alt: "",
								className: "absolute inset-0 size-full object-cover opacity-90",
								loading: "lazy"
							}),
							/* @__PURE__ */ R("div", { className: "absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" }),
							/* @__PURE__ */ z("div", {
								className: "absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2",
								children: [/* @__PURE__ */ R("div", {
									className: "text-lg font-semibold",
									children: e.name
								}), !e.active && /* @__PURE__ */ R(t, {
									size: "xs",
									children: "Retired"
								})]
							})
						]
					}), /* @__PURE__ */ z("div", {
						className: "space-y-3 p-card",
						children: [e.description && /* @__PURE__ */ R("p", {
							className: "line-clamp-2 text-sm text-muted",
							children: e.description
						}), /* @__PURE__ */ z("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ R("div", {
								className: "flex -space-x-1.5",
								children: e.ships.map((e) => /* @__PURE__ */ R("img", {
									src: e.icon,
									alt: e.name,
									title: e.name,
									className: "size-8 rounded-full bg-surface-3 ring-2 ring-surface",
									loading: "lazy"
								}, e.id))
							}), /* @__PURE__ */ z(t, {
								tone: e.fits && e.flyable === e.fits ? "success" : e.flyable ? "accent" : "neutral",
								size: "xs",
								children: [
									"You fly ",
									e.flyable,
									" of ",
									e.fits
								]
							})]
						})]
					})]
				})
			}, e.id))
		}),
		a && e && /* @__PURE__ */ R(Be, { onClose: () => o(!1) })
	] });
}
//#endregion
//#region src/ring.tsx
var ge = 440, Y = ge / 2, _e = 176, ve = 19, ye = 118, be = {
	hi: [-62, 52],
	med: [64, 150],
	low: [160, 250],
	rig: [262, 298],
	sub: [308, 344],
	service: [308, 344]
}, xe = {
	hi: "High",
	med: "Mid",
	low: "Low",
	rig: "Rigs",
	sub: "Subsystems",
	service: "Services"
}, Se = [
	"hi",
	"med",
	"low",
	"rig",
	"sub",
	"service"
];
function X(e, t) {
	let n = e * Math.PI / 180;
	return {
		x: Y + t * Math.sin(n),
		y: Y - t * Math.cos(n)
	};
}
function Ce(e, t) {
	let [n, r] = be[e], i = t > 1 ? Math.min(16, (r - n) / (t - 1)) : 0, a = (n + r) / 2;
	return Array.from({ length: t }, (e, n) => a + (n - (t - 1) / 2) * i);
}
function we(e, t, n) {
	let r = X(e, n), i = X(t, n);
	return `M ${r.x} ${r.y} A ${n} ${n} 0 ${+(t - e > 180)} 1 ${i.x} ${i.y}`;
}
function Te(e) {
	return `${e.type.name}${e.charge ? ` · ${e.charge.name}` : ""}${e.offline ? " (offline)" : ""}`;
}
function Ee({ view: e }) {
	let t = ae().replace(/:/g, ""), [n, r] = I(null), i = /* @__PURE__ */ new Map();
	for (let t of e.items) {
		if (!Se.includes(t.slot)) continue;
		let e = i.get(t.slot) ?? [];
		e.push(t), i.set(t.slot, e);
	}
	let a = Se.map((t) => {
		let n = (i.get(t) ?? []).sort((e, t) => e.position - t.position);
		return {
			slot: t,
			count: Math.max(e.slots[t] ?? 0, n.length, ...n.map((e) => e.position + 1)),
			items: n
		};
	}).filter((e) => e.count > 0);
	return /* @__PURE__ */ z("div", {
		className: "mx-auto w-full max-w-[460px]",
		children: [
			/* @__PURE__ */ z("div", {
				className: "mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.12em] text-muted",
				children: [/* @__PURE__ */ R(De, {
					label: "Turrets",
					used: e.hardpoints_used.turrets,
					total: e.slots.turrets
				}), /* @__PURE__ */ R(De, {
					label: "Launchers",
					used: e.hardpoints_used.launchers,
					total: e.slots.launchers,
					right: !0
				})]
			}),
			/* @__PURE__ */ z("svg", {
				viewBox: `0 0 ${ge} ${ge}`,
				className: "h-auto w-full select-none",
				role: "img",
				"aria-label": `${e.ship.name} fitting`,
				children: [
					/* @__PURE__ */ z("defs", { children: [
						/* @__PURE__ */ R("clipPath", {
							id: `${t}-ship`,
							children: /* @__PURE__ */ R("circle", {
								cx: Y,
								cy: Y,
								r: ye
							})
						}),
						/* @__PURE__ */ R("clipPath", {
							id: `${t}-icon`,
							clipPathUnits: "objectBoundingBox",
							children: /* @__PURE__ */ R("circle", {
								cx: .5,
								cy: .5,
								r: .5
							})
						}),
						/* @__PURE__ */ z("radialGradient", {
							id: `${t}-glow`,
							children: [/* @__PURE__ */ R("stop", {
								offset: "55%",
								stopColor: "var(--color-accent)",
								stopOpacity: 0
							}), /* @__PURE__ */ R("stop", {
								offset: "100%",
								stopColor: "var(--color-accent)",
								stopOpacity: .18
							})]
						})
					] }),
					/* @__PURE__ */ R("circle", {
						cx: Y,
						cy: Y,
						r: 132,
						className: "fill-none stroke-border",
						strokeDasharray: "2 5"
					}),
					/* @__PURE__ */ R("circle", {
						cx: Y,
						cy: Y,
						r: ye,
						className: "fill-surface-2"
					}),
					/* @__PURE__ */ R("image", {
						href: e.ship.render,
						x: 102,
						y: 102,
						width: 236,
						height: 236,
						clipPath: `url(#${t}-ship)`,
						preserveAspectRatio: "xMidYMid slice"
					}),
					/* @__PURE__ */ R("circle", {
						cx: Y,
						cy: Y,
						r: ye,
						fill: `url(#${t}-glow)`,
						className: "stroke-accent/50",
						strokeWidth: 1.5
					}),
					a.map(({ slot: e, count: t }) => {
						let n = Ce(e, t), r = n[0] - 9, i = n[n.length - 1] + 9, a = X(r - 4, 206);
						return /* @__PURE__ */ z("g", { children: [/* @__PURE__ */ R("path", {
							d: we(r, i, _e),
							className: "fill-none stroke-border-strong",
							strokeWidth: 46,
							strokeLinecap: "round",
							opacity: .35
						}), /* @__PURE__ */ R("text", {
							x: a.x,
							y: a.y,
							textAnchor: "middle",
							dominantBaseline: "middle",
							className: "fill-subtle",
							fontSize: 9,
							letterSpacing: 1.5,
							children: xe[e].toUpperCase()
						})] }, `arc-${e}`);
					}),
					a.map(({ slot: e, count: i, items: a }) => Ce(e, i).map((i, o) => {
						let s = a.find((e) => e.position === o), c = X(i, _e), l = X(i, 192.15), u = !!s && n === s;
						return /* @__PURE__ */ z("g", {
							transform: `translate(${c.x} ${c.y})`,
							tabIndex: s ? 0 : void 0,
							onMouseEnter: () => s && r(s),
							onMouseLeave: () => r(null),
							onFocus: () => s && r(s),
							onBlur: () => r(null),
							className: E(s && "cursor-default outline-none"),
							children: [
								s && /* @__PURE__ */ R("title", { children: Te(s) }),
								/* @__PURE__ */ R("circle", {
									r: ve,
									className: E(s ? "fill-surface-3" : "fill-surface", u ? "stroke-accent" : s ? "stroke-border-strong" : "stroke-border"),
									strokeWidth: u ? 2 : 1,
									strokeDasharray: s?.offline ? "3 3" : s ? void 0 : "2 3"
								}),
								s ? /* @__PURE__ */ R("image", {
									href: s.type.icon,
									x: -16,
									y: -16,
									width: 32,
									height: 32,
									clipPath: `url(#${t}-icon)`,
									opacity: s.offline ? .35 : 1
								}) : /* @__PURE__ */ R("circle", {
									r: 2.5,
									className: "fill-border-strong"
								}),
								s?.charge && /* @__PURE__ */ z("g", {
									transform: `translate(${l.x - c.x} ${l.y - c.y})`,
									children: [/* @__PURE__ */ R("circle", {
										r: 8.5,
										className: "fill-surface stroke-accent/70"
									}), /* @__PURE__ */ R("image", {
										href: s.charge.icon,
										x: -7,
										y: -7,
										width: 14,
										height: 14,
										clipPath: `url(#${t}-icon)`
									})]
								}),
								s && (s.turret || s.launcher) && /* @__PURE__ */ R("rect", {
									x: -3,
									y: -25,
									width: 6,
									height: 6,
									transform: "rotate(45 0 -22)",
									className: s.turret ? "fill-accent" : "fill-info"
								})
							]
						}, `${e}-${o}`);
					}))
				]
			}),
			/* @__PURE__ */ R("div", {
				className: "mt-1 min-h-10 text-center",
				children: n ? /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R("div", {
					className: "text-sm font-medium",
					children: n.type.name
				}), /* @__PURE__ */ z("div", {
					className: "text-xs text-muted",
					children: [n.charge ? `Loaded: ${n.charge.name}` : n.type.group, n.offline && " · offline"]
				})] }) : /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R("div", {
					className: "text-sm font-medium",
					children: e.ship.name
				}), /* @__PURE__ */ z("div", {
					className: "text-xs text-muted",
					children: [e.ship.group, " · point at a module to see it"]
				})] })
			})
		]
	});
}
function De({ label: e, used: t, total: n, right: r }) {
	return !n && !t ? /* @__PURE__ */ R("span", {}) : /* @__PURE__ */ z("span", {
		className: E("flex items-center gap-2", r && "flex-row-reverse"),
		children: [/* @__PURE__ */ R("span", { children: e }), /* @__PURE__ */ R("span", {
			className: "flex gap-1",
			children: Array.from({ length: Math.max(n, t) }, (r, i) => /* @__PURE__ */ R("span", { className: E("size-2 rotate-45", i < t ? e === "Turrets" ? "bg-accent" : "bg-info" : "ring-1 ring-inset ring-border-strong", i >= n && "bg-danger") }, i))
		})]
	});
}
function Oe({ view: e }) {
	let t = [
		{
			key: "drone",
			label: "Drone bay"
		},
		{
			key: "fighter",
			label: "Fighter bay"
		},
		{
			key: "cargo",
			label: "Cargo"
		}
	].map((t) => ({
		...t,
		items: e.items.filter((e) => e.slot === t.key)
	})).filter((e) => e.items.length);
	return t.length ? /* @__PURE__ */ R("div", {
		className: "space-y-4",
		children: t.map((e) => /* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R("div", {
			className: "mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle",
			children: e.label
		}), /* @__PURE__ */ R("ul", {
			className: "space-y-1",
			children: e.items.map((e) => /* @__PURE__ */ z("li", {
				className: "flex items-center gap-2 text-sm",
				children: [
					/* @__PURE__ */ R("img", {
						src: e.type.icon,
						alt: "",
						className: "size-7 rounded-full bg-surface-3",
						loading: "lazy"
					}),
					/* @__PURE__ */ R("span", {
						className: "min-w-0 flex-1 truncate",
						children: e.type.name
					}),
					/* @__PURE__ */ z("span", {
						className: "font-mono text-xs tabular-nums text-muted",
						children: ["×", k(e.quantity)]
					})
				]
			}, `${e.slot}-${e.type_id}`))
		})] }, e.key))
	}) : /* @__PURE__ */ R("p", {
		className: "text-sm text-subtle",
		children: "No drones or cargo."
	});
}
function ke({ view: e }) {
	return /* @__PURE__ */ z("div", {
		className: "space-y-3",
		children: [e.resources.filter((e) => e.total > 0 || e.used > 0).map((e) => {
			let t = e.total ? e.used / e.total : 1;
			return /* @__PURE__ */ R(d, {
				label: e.label,
				value: Math.min(1, t),
				tone: t > 1 ? "danger" : t > .9 ? "warning" : "accent",
				valueText: `${k(Math.round(e.used * 10) / 10)} / ${k(e.total)}${e.unit ? ` ${e.unit}` : ""}`
			}, e.key);
		}), /* @__PURE__ */ R("p", {
			className: "text-xs text-subtle",
			children: "Base values: fitting skills and modules that add CPU or powergrid aren't counted."
		})]
	});
}
function Ae({ view: e }) {
	let t = Se.flatMap((t) => {
		let n = e.items.filter((e) => e.slot === t).sort((e, t) => e.position - t.position), r = Math.max(0, (e.slots[t] ?? 0) - n.length);
		return !n.length && !r ? [] : [{
			slot: t,
			items: n,
			empty: r
		}];
	});
	return /* @__PURE__ */ z(y, { children: [/* @__PURE__ */ R(v, { children: /* @__PURE__ */ z("tr", { children: [
		/* @__PURE__ */ R(S, { children: "Slot" }),
		/* @__PURE__ */ R(S, { children: "Module" }),
		/* @__PURE__ */ R(S, { children: "Charge" })
	] }) }), /* @__PURE__ */ R("tbody", { children: t.map(({ slot: e, items: t, empty: n }) => /* @__PURE__ */ z(re, { children: [t.map((t) => /* @__PURE__ */ z(w, { children: [
		/* @__PURE__ */ R(b, {
			className: "text-xs uppercase tracking-[0.1em] text-subtle",
			children: xe[e]
		}),
		/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("span", {
			className: E("flex items-center gap-2", t.offline && "opacity-50"),
			children: [
				/* @__PURE__ */ R("img", {
					src: t.type.icon,
					alt: "",
					className: "size-6",
					loading: "lazy"
				}),
				t.type.name,
				t.offline && /* @__PURE__ */ R("span", {
					className: "text-xs text-warning-fg",
					children: "offline"
				})
			]
		}) }),
		/* @__PURE__ */ R(b, {
			className: "text-sm text-muted",
			children: t.charge?.name ?? ""
		})
	] }, `${e}-${t.position}`)), n > 0 && /* @__PURE__ */ z(w, { children: [/* @__PURE__ */ R(b, {
		className: "text-xs uppercase tracking-[0.1em] text-subtle",
		children: xe[e]
	}), /* @__PURE__ */ z(b, {
		className: "text-sm text-subtle",
		colSpan: 2,
		children: [n, " empty"]
	})] }, `${e}-empty`)] }, e)) })] });
}
function je({ view: e }) {
	let [t, n] = I("ring");
	return /* @__PURE__ */ z("div", {
		className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]",
		children: [/* @__PURE__ */ z(i, {
			className: "p-card",
			children: [
				/* @__PURE__ */ z("div", {
					className: "mb-3 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ R(m, {
						size: "sm",
						value: t,
						onChange: n,
						"aria-label": "Show the fit as",
						options: [{
							value: "ring",
							label: "Fitting",
							icon: /* @__PURE__ */ R(ue, { className: "size-3.5" })
						}, {
							value: "list",
							label: "List",
							icon: /* @__PURE__ */ R(de, { className: "size-3.5" })
						}]
					}), /* @__PURE__ */ R("span", {
						className: "font-mono text-sm tabular-nums text-muted",
						children: O(e.value)
					})]
				}),
				!e.known && /* @__PURE__ */ R("p", {
					className: "mb-3 text-sm text-warning-fg",
					children: "This site's EVE static data has no fitting data for this ship yet (Administration → Health → Import again). Modules are shown as saved."
				}),
				R(t === "ring" ? Ee : Ae, { view: e })
			]
		}), /* @__PURE__ */ z("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ z(i, {
				className: "p-card",
				children: [/* @__PURE__ */ R("div", {
					className: "mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle",
					children: "Resources"
				}), /* @__PURE__ */ R(ke, { view: e })]
			}), /* @__PURE__ */ R(i, {
				className: "p-card",
				children: /* @__PURE__ */ R(Oe, { view: e })
			})]
		})]
	});
}
//#endregion
//#region src/shared.tsx
function Z(e) {
	if (!e) return "0m";
	let t = Math.floor(e / 86400), n = Math.floor(e % 86400 / 3600), r = Math.ceil(e % 3600 / 60);
	return t ? `${t}d ${n}h` : n ? `${n}h ${r}m` : `${r}m`;
}
function Q({ status: e, size: n = "xs" }) {
	if (!e) return /* @__PURE__ */ R(t, {
		size: n,
		children: "No characters"
	});
	switch (e.status) {
		case "ready": return /* @__PURE__ */ z(t, {
			tone: "success",
			size: n,
			children: [/* @__PURE__ */ R(ce, { className: "size-3" }), " Ready"]
		});
		case "can_fly": return /* @__PURE__ */ R(C, {
			content: e.seconds ? `Has the required skills; the recommended ones take ${Z(e.seconds)} more` : "Has the required skills",
			children: /* @__PURE__ */ R("span", { children: /* @__PURE__ */ R(t, {
				tone: "accent",
				size: n,
				children: "Can fly"
			}) })
		});
		case "missing": return /* @__PURE__ */ z(t, {
			tone: "warning",
			size: n,
			children: [
				/* @__PURE__ */ R(le, { className: "size-3" }),
				" ",
				e.missing,
				" skill",
				e.missing === 1 ? "" : "s",
				" · ",
				Z(e.seconds)
			]
		});
		default: return /* @__PURE__ */ R(t, {
			size: n,
			children: "Skills not synced"
		});
	}
}
async function Me(e, t) {
	try {
		await navigator.clipboard.writeText(e), A.success(t);
	} catch {
		A.error("Your browser didn't allow copying; select the text and copy it yourself");
	}
}
function Ne() {
	return ee().plugins.some((e) => e.id === "skillplans");
}
var Pe = {
	DPS: "danger",
	Logistics: "success",
	Tackle: "warning",
	Ewar: "info",
	Support: "accent",
	Booster: "accent",
	Command: "accent",
	Scout: "neutral"
};
function $({ role: e }) {
	return e ? /* @__PURE__ */ R(t, {
		tone: Pe[e] ?? "neutral",
		size: "xs",
		children: e
	}) : null;
}
//#endregion
//#region src/edit.tsx
function Fe(e, t = 500) {
	let [n, r] = I(e);
	return ie(() => {
		let n = setTimeout(() => r(e), t);
		return () => clearTimeout(n);
	}, [e, t]), n;
}
var Ie = "[Rifter, Fleet Rifter]\nGyrostabilizer II\nSmall Armor Repairer II\n\n1MN Afterburner II\nWarp Scrambler II\n\n125mm Gatling AutoCannon II, Republic Fleet EMP S\n...";
function Le() {
	let { id: e } = F(), [t] = ne(), n = M({
		queryKey: [
			"doctrines",
			"fit",
			e
		],
		queryFn: () => T.get(`${q}/fits/${e}`),
		enabled: !!e
	});
	return e && !n.data ? n.error ? /* @__PURE__ */ R(c, {
		icon: /* @__PURE__ */ R(V, {}),
		title: "No such fit"
	}) : /* @__PURE__ */ R(g, { className: "h-96" }) : /* @__PURE__ */ R(Re, {
		fit: n.data,
		doctrine: t.get("doctrine")
	}, e ?? "new");
}
function Re({ fit: e, doctrine: t }) {
	let a = P(), o = te(), s = J(), [d, p] = I(e?.eft ?? ""), [m, g] = I(e?.name ?? ""), [_, v] = I(e?.role ?? ""), [y, b] = I(e?.notes ?? ""), [S, C] = I(e ? e.doctrines.map((e) => e.id) : t ? [Number(t)] : []), [w, E] = I(e?.recommended ?? []), D = Fe(d.trim()), O = M({
		queryKey: [
			"doctrines",
			"parse",
			D
		],
		queryFn: () => T.post(`${q}/parse`, { eft: D }),
		enabled: !!D,
		retry: !1
	}), k = M({
		queryKey: ["doctrines", "my-fittings"],
		queryFn: () => T.get(`${q}/my-fittings`)
	}), ee = j({
		mutationFn: () => {
			let t = {
				eft: d,
				name: m,
				role: _,
				notes: y,
				doctrines: S,
				recommended: w.map((e) => [e.skill_id, e.level])
			};
			return e ? T.put(`${q}/fits/${e.id}`, t) : T.post(`${q}/fits`, t);
		},
		onSuccess: (e) => {
			o.invalidateQueries({ queryKey: ["doctrines"] }), e.unknown?.length ? A.warning(`Saved without ${e.unknown.length} line${e.unknown.length === 1 ? "" : "s"} nobody recognised`) : A.success(`${e.name} saved`), a(`/p/doctrines/fit/${e.id}`);
		},
		onError: (e) => A.error(e.message)
	}), F = O.data, ne = !F || F.problems.length > 0;
	return /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(f, {
		eyebrow: /* @__PURE__ */ R(N, {
			to: "/p/doctrines",
			className: "hover:text-text",
			children: "Doctrines"
		}),
		title: e ? `Edit ${e.name}` : "New fit",
		icon: /* @__PURE__ */ R(V, {}),
		description: "Paste the fit from the game (Fitting window → Copy to clipboard) or Pyfa. Modules go in the right slots whatever order they're in.",
		actions: /* @__PURE__ */ z("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ R(n, {
				variant: "ghost",
				onClick: () => a(-1),
				children: "Cancel"
			}), /* @__PURE__ */ R(n, {
				variant: "primary",
				disabled: ne,
				loading: ee.isPending,
				onClick: () => ee.mutate(),
				children: "Save fit"
			})]
		})
	}), /* @__PURE__ */ z("div", {
		className: "grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]",
		children: [/* @__PURE__ */ z("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ z(i, {
				className: "space-y-4 p-card",
				children: [
					k.data && k.data.length > 0 && /* @__PURE__ */ R(l, {
						label: "Start from one of your in-game fittings",
						hint: "Your characters' saved fittings, as last synced.",
						children: /* @__PURE__ */ z(h, {
							value: "",
							onChange: (e) => {
								let t = k.data.find((t) => t.id === e.target.value);
								t && (p(t.eft), m || g(t.name));
							},
							children: [/* @__PURE__ */ R("option", {
								value: "",
								children: "Pick a fitting…"
							}), k.data.map((e) => /* @__PURE__ */ z("option", {
								value: e.id,
								children: [
									e.ship,
									": ",
									e.name,
									" (",
									e.character,
									")"
								]
							}, e.id))]
						})
					}),
					/* @__PURE__ */ R(l, {
						label: "Fit",
						required: !0,
						children: /* @__PURE__ */ R(x, {
							rows: 14,
							value: d,
							onChange: (e) => p(e.target.value),
							placeholder: Ie,
							className: "font-mono text-xs",
							spellCheck: !1
						})
					}),
					O.error && /* @__PURE__ */ R(r, {
						tone: "danger",
						children: O.error.message
					}),
					F && F.problems.length > 0 && /* @__PURE__ */ R(r, {
						tone: "danger",
						title: "This fit can't be fitted",
						children: /* @__PURE__ */ R("ul", {
							className: "list-disc pl-4",
							children: F.problems.map((e) => /* @__PURE__ */ R("li", { children: e }, e))
						})
					}),
					F && F.unknown.length > 0 && /* @__PURE__ */ R(r, {
						tone: "warning",
						title: "Lines nobody recognised (they'll be left out)",
						children: /* @__PURE__ */ R("ul", {
							className: "list-disc pl-4 font-mono text-xs",
							children: F.unknown.map((e) => /* @__PURE__ */ R("li", { children: e }, e))
						})
					})
				]
			}), /* @__PURE__ */ z(i, {
				className: "space-y-4 p-card",
				children: [
					/* @__PURE__ */ z("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ R(l, {
							label: "Name",
							hint: F && !m ? `From the paste: ${F.name}` : void 0,
							children: /* @__PURE__ */ R(u, {
								value: m,
								onChange: (e) => g(e.target.value),
								placeholder: F?.name ?? "Fleet Rifter",
								maxLength: 100
							})
						}), /* @__PURE__ */ z(l, {
							label: "Role",
							children: [/* @__PURE__ */ R(u, {
								value: _,
								onChange: (e) => v(e.target.value),
								list: "doctrine-roles",
								placeholder: "DPS, Logistics…",
								maxLength: 40
							}), /* @__PURE__ */ R("datalist", {
								id: "doctrine-roles",
								children: s.data?.roles.map((e) => /* @__PURE__ */ R("option", { value: e }, e))
							})]
						})]
					}),
					/* @__PURE__ */ R(l, {
						label: "Doctrines",
						children: /* @__PURE__ */ z("div", {
							className: "flex flex-wrap gap-2",
							children: [s.data?.doctrines.map((e) => {
								let t = S.includes(e.id);
								return /* @__PURE__ */ R("button", {
									type: "button",
									onClick: () => C(t ? S.filter((t) => t !== e.id) : [...S, e.id]),
									className: `border px-2.5 py-1 text-sm ${t ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:bg-hover"}`,
									children: e.name
								}, e.id);
							}), s.data?.doctrines.length === 0 && /* @__PURE__ */ R("span", {
								className: "text-sm text-subtle",
								children: "No doctrines yet; you can add the fit to one later."
							})]
						})
					}),
					/* @__PURE__ */ R(l, {
						label: "Notes",
						hint: "Shown on the fit: how to fly it, what to bring.",
						children: /* @__PURE__ */ R(x, {
							rows: 3,
							value: y,
							onChange: (e) => b(e.target.value)
						})
					}),
					/* @__PURE__ */ R(ze, {
						value: w,
						onChange: E
					})
				]
			})]
		}), /* @__PURE__ */ R("div", { children: F ? /* @__PURE__ */ R(je, { view: F.view }) : /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(c, {
			icon: /* @__PURE__ */ R(oe, {}),
			title: "Paste a fit to see it",
			description: "It's shown here like the in-game fitting window as you type."
		}) }) })]
	})] });
}
function ze({ value: e, onChange: t }) {
	let [r, i] = I(""), a = Fe(r.trim(), 300), { data: o } = M({
		queryKey: [
			"doctrines",
			"skills",
			a
		],
		queryFn: () => T.get(`${q}/skills?q=${encodeURIComponent(a)}`),
		enabled: a.length >= 2
	});
	return /* @__PURE__ */ R(l, {
		label: "Recommended skills",
		hint: "On top of what the fit needs; pilots with them too show as Ready.",
		children: /* @__PURE__ */ z("div", {
			className: "space-y-2",
			children: [
				e.map((r) => /* @__PURE__ */ z("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ R("span", {
							className: "flex-1 text-sm",
							children: r.name
						}),
						/* @__PURE__ */ R(h, {
							value: String(r.level),
							className: "w-20",
							"aria-label": `${r.name} level`,
							onChange: (n) => t(e.map((e) => e.skill_id === r.skill_id ? {
								...e,
								level: Number(n.target.value)
							} : e)),
							children: [
								1,
								2,
								3,
								4,
								5
							].map((e) => /* @__PURE__ */ R("option", {
								value: e,
								children: e
							}, e))
						}),
						/* @__PURE__ */ R(n, {
							size: "icon-sm",
							variant: "ghost",
							"aria-label": `Remove ${r.name}`,
							onClick: () => t(e.filter((e) => e.skill_id !== r.skill_id)),
							children: /* @__PURE__ */ R(W, {})
						})
					]
				}, r.skill_id)),
				/* @__PURE__ */ R(p, {
					value: r,
					onChange: (e) => i(e.target.value),
					placeholder: "Add a skill…"
				}),
				o && a.length >= 2 && /* @__PURE__ */ z("ul", {
					className: "max-h-48 overflow-auto border border-border",
					children: [o.filter((t) => !e.some((e) => e.skill_id === t.id)).map((n) => /* @__PURE__ */ R("li", { children: /* @__PURE__ */ z("button", {
						type: "button",
						className: "flex w-full justify-between px-3 py-1.5 text-left text-sm hover:bg-hover",
						onClick: () => {
							t([...e, {
								skill_id: n.id,
								name: n.name,
								level: 4
							}]), i("");
						},
						children: [
							n.name,
							" ",
							/* @__PURE__ */ R("span", {
								className: "text-xs text-subtle",
								children: n.group
							})
						]
					}) }, n.id)), o.length === 0 && /* @__PURE__ */ R("li", {
						className: "px-3 py-1.5 text-sm text-subtle",
						children: "No skill matches"
					})]
				})
			]
		})
	});
}
function Be({ doctrine: e, onClose: t }) {
	let r = te(), i = P(), a = M({
		queryKey: ["doctrines", "all-fits"],
		queryFn: () => T.get(`${q}/fits`)
	}), [c, d] = I({
		name: e?.name ?? "",
		description: e?.description ?? "",
		order: e?.order ?? 0,
		active: e?.active ?? !0,
		icon_type_id: e?.icon_type_id ?? null
	}), [f, p] = I(e?.fits.map((e) => e.id) ?? []), [m, g] = I(!1), v = new Map((a.data ?? []).map((e) => [e.id, e])), y = [...new Map(f.map((e) => v.get(e)).filter(Boolean).map((e) => [e.ship.id, e.ship])).values()], b = j({
		mutationFn: () => {
			let t = {
				...c,
				fits: f
			};
			return e ? T.put(`${q}/doctrines/${e.id}`, t) : T.post(`${q}/doctrines`, t);
		},
		onSuccess: (e) => {
			r.invalidateQueries({ queryKey: ["doctrines"] }), A.success(`${e.name} saved`), t(), i(`/p/doctrines/${e.id}`);
		},
		onError: (e) => A.error(e.message)
	}), S = (e, t) => {
		let n = [...f], [r] = n.splice(e, 1);
		n.splice(e + t, 0, r), p(n);
	};
	return /* @__PURE__ */ z(s, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: e ? `Edit ${e.name}` : "New doctrine",
		size: "lg",
		footer: /* @__PURE__ */ z(L, { children: [
			e && /* @__PURE__ */ z(n, {
				variant: "danger",
				className: "mr-auto",
				onClick: () => g(!0),
				children: [/* @__PURE__ */ R(W, {}), " Delete"]
			}),
			/* @__PURE__ */ R(n, {
				variant: "ghost",
				onClick: t,
				children: "Cancel"
			}),
			/* @__PURE__ */ R(n, {
				variant: "primary",
				disabled: !c.name.trim(),
				loading: b.isPending,
				onClick: () => b.mutate(),
				children: "Save"
			})
		] }),
		children: [/* @__PURE__ */ z("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ z("div", {
					className: "grid gap-4 sm:grid-cols-[1fr_120px]",
					children: [/* @__PURE__ */ R(l, {
						label: "Name",
						required: !0,
						children: /* @__PURE__ */ R(u, {
							value: c.name,
							onChange: (e) => d({
								...c,
								name: e.target.value
							}),
							placeholder: "Rifter Gang",
							autoFocus: !0,
							maxLength: 100
						})
					}), /* @__PURE__ */ R(l, {
						label: "Order",
						hint: "Lower first",
						children: /* @__PURE__ */ R(u, {
							type: "number",
							value: c.order,
							onChange: (e) => d({
								...c,
								order: Number(e.target.value) || 0
							})
						})
					})]
				}),
				/* @__PURE__ */ R(l, {
					label: "Description",
					children: /* @__PURE__ */ R(x, {
						rows: 3,
						value: c.description,
						onChange: (e) => d({
							...c,
							description: e.target.value
						}),
						placeholder: "When we fly it, comms, staging…"
					})
				}),
				y.length > 0 && /* @__PURE__ */ R(l, {
					label: "Picture",
					children: /* @__PURE__ */ z(h, {
						value: String(c.icon_type_id ?? ""),
						onChange: (e) => d({
							...c,
							icon_type_id: e.target.value ? Number(e.target.value) : null
						}),
						children: [/* @__PURE__ */ R("option", {
							value: "",
							children: "The first fit's ship"
						}), y.map((e) => /* @__PURE__ */ R("option", {
							value: e.id,
							children: e.name
						}, e.id))]
					})
				}),
				/* @__PURE__ */ R(_, {
					label: "Active",
					description: "Retired doctrines stay for reference, listed last.",
					checked: c.active,
					onCheckedChange: (e) => d({
						...c,
						active: e
					})
				}),
				/* @__PURE__ */ R(l, {
					label: "Fits",
					hint: "In the order they're shown. New fits are added from the fit editor too.",
					children: /* @__PURE__ */ z("div", {
						className: "space-y-1",
						children: [f.map((e, t) => {
							let r = v.get(e);
							return /* @__PURE__ */ z("div", {
								className: "flex items-center gap-2 border border-border px-2 py-1.5",
								children: [
									r && /* @__PURE__ */ R("img", {
										src: r.ship.icon,
										alt: "",
										className: "size-6"
									}),
									/* @__PURE__ */ R("span", {
										className: "min-w-0 flex-1 truncate text-sm",
										children: r ? `${r.name} (${r.ship.name})` : `Fit ${e}`
									}),
									r && /* @__PURE__ */ R($, { role: r.role }),
									/* @__PURE__ */ R(n, {
										size: "icon-sm",
										variant: "ghost",
										disabled: t === 0,
										onClick: () => S(t, -1),
										"aria-label": "Move up",
										children: /* @__PURE__ */ R(fe, {})
									}),
									/* @__PURE__ */ R(n, {
										size: "icon-sm",
										variant: "ghost",
										disabled: t === f.length - 1,
										onClick: () => S(t, 1),
										"aria-label": "Move down",
										children: /* @__PURE__ */ R(pe, {})
									}),
									/* @__PURE__ */ R(n, {
										size: "icon-sm",
										variant: "ghost",
										onClick: () => p(f.filter((t) => t !== e)),
										"aria-label": "Remove",
										children: /* @__PURE__ */ R(W, {})
									})
								]
							}, e);
						}), /* @__PURE__ */ z(h, {
							value: "",
							onChange: (e) => e.target.value && p([...f, Number(e.target.value)]),
							children: [/* @__PURE__ */ R("option", {
								value: "",
								children: "Add an existing fit…"
							}), (a.data ?? []).filter((e) => !f.includes(e.id)).map((e) => /* @__PURE__ */ z("option", {
								value: e.id,
								children: [
									e.ship.name,
									": ",
									e.name
								]
							}, e.id))]
						})]
					})
				})
			]
		}), e && /* @__PURE__ */ R(o, {
			open: m,
			onOpenChange: g,
			title: `Delete ${e.name}?`,
			description: "Its fits stay, so you can put them in another doctrine.",
			confirmLabel: "Delete doctrine",
			danger: !0,
			onConfirm: async () => {
				try {
					await T.delete(`/api/p/doctrines/doctrines/${e.id}`);
				} catch (e) {
					throw A.error(e.message), e;
				}
				r.invalidateQueries({ queryKey: ["doctrines"] }), t(), i("/p/doctrines");
			}
		})]
	});
}
function Ve() {
	let e = P(), [r, a] = I(""), { data: o, isLoading: s } = M({
		queryKey: ["doctrines", "all-fits"],
		queryFn: () => T.get(`${q}/fits`)
	}), l = (o ?? []).filter((e) => `${e.name} ${e.ship.name} ${e.role}`.toLowerCase().includes(r.trim().toLowerCase()));
	return /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(f, {
		eyebrow: /* @__PURE__ */ R(N, {
			to: "/p/doctrines",
			className: "hover:text-text",
			children: "Doctrines"
		}),
		title: "All fits",
		icon: /* @__PURE__ */ R(V, {}),
		actions: /* @__PURE__ */ R(N, {
			to: "/p/doctrines/fit/new",
			children: /* @__PURE__ */ z(n, {
				variant: "primary",
				children: [/* @__PURE__ */ R(U, {}), " New fit"]
			})
		})
	}), /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R("div", {
		className: "p-card pb-0",
		children: /* @__PURE__ */ R(p, {
			value: r,
			onChange: (e) => a(e.target.value),
			placeholder: "Fit, ship or role",
			className: "w-64"
		})
	}), s ? /* @__PURE__ */ R(g, { className: "m-card h-40" }) : l.length === 0 ? /* @__PURE__ */ R(c, {
		icon: /* @__PURE__ */ R(V, {}),
		title: r ? "No fit matches" : "No fits yet"
	}) : /* @__PURE__ */ z(y, { children: [/* @__PURE__ */ R(v, { children: /* @__PURE__ */ z("tr", { children: [
		/* @__PURE__ */ R(S, { children: "Fit" }),
		/* @__PURE__ */ R(S, { children: "Ship" }),
		/* @__PURE__ */ R(S, { children: "Doctrines" })
	] }) }), /* @__PURE__ */ R("tbody", { children: l.map((n) => /* @__PURE__ */ z(w, {
		interactive: !0,
		onClick: () => e(`/p/doctrines/fit/${n.id}`),
		children: [
			/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("span", {
				className: "flex items-center gap-2 font-medium",
				children: [
					n.name,
					" ",
					/* @__PURE__ */ R($, { role: n.role })
				]
			}) }),
			/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("span", {
				className: "flex items-center gap-2 text-sm",
				children: [/* @__PURE__ */ R("img", {
					src: n.ship.icon,
					alt: "",
					className: "size-6"
				}), n.ship.name]
			}) }),
			/* @__PURE__ */ R(b, { children: n.doctrines.length ? /* @__PURE__ */ R("span", {
				className: "flex flex-wrap gap-1",
				children: n.doctrines.map((e) => /* @__PURE__ */ R(t, {
					size: "xs",
					children: e
				}, e))
			}) : /* @__PURE__ */ R("span", {
				className: "text-sm text-subtle",
				children: "None"
			}) })
		]
	}, n.id)) })] })] })] });
}
//#endregion
//#region src/doctrine.tsx
function He() {
	let { id: e } = F(), { data: t, isLoading: r, error: a } = M({
		queryKey: [
			"doctrines",
			"doctrine",
			e
		],
		queryFn: () => T.get(`${q}/doctrines/${e}`)
	}), o = J(), [s, l] = I(!1);
	if (a) return /* @__PURE__ */ R(c, {
		icon: /* @__PURE__ */ R(V, {}),
		title: "No such doctrine",
		action: /* @__PURE__ */ R(N, {
			to: "/p/doctrines",
			children: /* @__PURE__ */ R(n, {
				variant: "secondary",
				children: "All doctrines"
			})
		})
	});
	if (r || !t) return /* @__PURE__ */ R(g, { className: "h-64" });
	let u = /* @__PURE__ */ new Map();
	for (let e of t.fits) {
		let t = e.role || "Fits";
		u.set(t, [...u.get(t) ?? [], e]);
	}
	return /* @__PURE__ */ z(L, { children: [
		/* @__PURE__ */ R(f, {
			eyebrow: /* @__PURE__ */ R(N, {
				to: "/p/doctrines",
				className: "hover:text-text",
				children: "Doctrines"
			}),
			title: t.name,
			icon: /* @__PURE__ */ R(V, {}),
			description: t.description || void 0,
			actions: /* @__PURE__ */ z("div", {
				className: "flex flex-wrap gap-2",
				children: [o.data?.can_see_readiness && /* @__PURE__ */ R(N, {
					to: `/p/doctrines/${t.id}/readiness`,
					children: /* @__PURE__ */ z(n, {
						variant: "ghost",
						children: [/* @__PURE__ */ R(G, {}), " Who can fly it"]
					})
				}), t.can_manage && /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(N, {
					to: `/p/doctrines/fit/new?doctrine=${t.id}`,
					children: /* @__PURE__ */ z(n, {
						variant: "secondary",
						children: [/* @__PURE__ */ R(U, {}), " Add fit"]
					})
				}), /* @__PURE__ */ z(n, {
					variant: "ghost",
					onClick: () => l(!0),
					children: [/* @__PURE__ */ R(se, {}), " Edit"]
				})] })]
			})
		}),
		t.render && /* @__PURE__ */ z("div", {
			className: "relative mb-6 h-40 overflow-hidden border border-border bg-surface-2 sm:h-56",
			children: [
				/* @__PURE__ */ R("img", {
					src: t.render,
					alt: "",
					className: "absolute inset-0 size-full object-cover"
				}),
				/* @__PURE__ */ R("div", { className: "absolute inset-0 bg-gradient-to-r from-surface/90 via-surface/20 to-transparent" }),
				/* @__PURE__ */ z("div", {
					className: "absolute bottom-4 left-5 text-sm text-muted",
					children: [
						t.fits.length,
						" fit",
						t.fits.length === 1 ? "" : "s"
					]
				})
			]
		}),
		t.fits.length === 0 ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(c, {
			icon: /* @__PURE__ */ R(V, {}),
			title: "No fits in this doctrine yet",
			description: t.can_manage ? "Add one by pasting it from the game." : void 0
		}) }) : /* @__PURE__ */ R("div", {
			className: "space-y-6",
			children: [...u.entries()].map(([e, t]) => /* @__PURE__ */ z("section", { children: [/* @__PURE__ */ R("h2", {
				className: "mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle",
				children: e
			}), /* @__PURE__ */ R("div", {
				className: "grid gap-3 md:grid-cols-2",
				children: t.map((e) => /* @__PURE__ */ R(Ue, { fit: e }, e.id))
			})] }, e))
		}),
		s && /* @__PURE__ */ R(Be, {
			doctrine: t,
			onClose: () => l(!1)
		})
	] });
}
function Ue({ fit: t }) {
	return /* @__PURE__ */ R(N, {
		to: `/p/doctrines/fit/${t.id}`,
		className: "block",
		children: /* @__PURE__ */ z(i, {
			interactive: !0,
			className: "flex h-full items-center gap-4 p-card",
			children: [/* @__PURE__ */ R("img", {
				src: t.ship.render,
				alt: "",
				className: "size-20 shrink-0 rounded-full bg-surface-2 object-cover ring-1 ring-border",
				loading: "lazy"
			}), /* @__PURE__ */ z("div", {
				className: "min-w-0 flex-1 space-y-1.5",
				children: [
					/* @__PURE__ */ z("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ R("span", {
							className: "truncate font-medium",
							children: t.name
						}), /* @__PURE__ */ R($, { role: t.role })]
					}),
					/* @__PURE__ */ z("div", {
						className: "text-xs text-muted",
						children: [
							t.ship.name,
							" · ",
							t.ship.group,
							" · ",
							O(t.value)
						]
					}),
					/* @__PURE__ */ z("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ R(Q, { status: t.best }), /* @__PURE__ */ R("span", {
							className: "flex -space-x-1",
							children: t.characters.map((t) => /* @__PURE__ */ R(C, {
								content: `${t.character.name}: ${{
									ready: "ready",
									can_fly: "can fly",
									missing: `${t.missing} skills missing`,
									unknown: "skills not synced"
								}[t.status]}`,
								children: /* @__PURE__ */ R("span", {
									className: t.status === "ready" || t.status === "can_fly" ? "" : "opacity-40 grayscale",
									children: /* @__PURE__ */ R(e, {
										src: t.character.portrait,
										name: t.character.name,
										size: "xs"
									})
								})
							}, t.character.id))
						})]
					})
				]
			})]
		})
	});
}
//#endregion
//#region src/fit.tsx
function We() {
	let { id: e } = F(), { data: t, isLoading: i, error: a } = M({
		queryKey: [
			"doctrines",
			"fit",
			e
		],
		queryFn: () => T.get(`${q}/fits/${e}`)
	}), [l, u] = I(!1), [d, p] = I(!1), [m, h] = I(!1), _ = P(), v = te();
	if (a) return /* @__PURE__ */ R(c, {
		icon: /* @__PURE__ */ R(V, {}),
		title: "No such fit",
		action: /* @__PURE__ */ R(N, {
			to: "/p/doctrines",
			children: /* @__PURE__ */ R(n, {
				variant: "secondary",
				children: "All doctrines"
			})
		})
	});
	if (i || !t) return /* @__PURE__ */ R(g, { className: "h-96" });
	let y = t.doctrines[0];
	return /* @__PURE__ */ z(L, { children: [
		/* @__PURE__ */ R(f, {
			eyebrow: /* @__PURE__ */ z("span", {
				className: "flex flex-wrap gap-1",
				children: [/* @__PURE__ */ R(N, {
					to: "/p/doctrines",
					className: "hover:text-text",
					children: "Doctrines"
				}), y && /* @__PURE__ */ z(L, { children: ["/ ", /* @__PURE__ */ R(N, {
					to: `/p/doctrines/${y.id}`,
					className: "hover:text-text",
					children: y.name
				})] })]
			}),
			title: /* @__PURE__ */ z("span", {
				className: "flex flex-wrap items-center gap-3",
				children: [
					t.name,
					" ",
					/* @__PURE__ */ R($, { role: t.role })
				]
			}),
			icon: /* @__PURE__ */ R("img", {
				src: t.ship.icon,
				alt: "",
				className: "size-8"
			}),
			description: `${t.ship.name} · ${t.ship.group}`,
			actions: /* @__PURE__ */ z("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ z(n, {
						variant: "primary",
						onClick: () => Me(t.eft, "Copied. In the game: Fitting window → Import from clipboard"),
						children: [/* @__PURE__ */ R(H, {}), " Copy to paste in game"]
					}),
					/* @__PURE__ */ z(n, {
						variant: "secondary",
						onClick: () => p(!0),
						children: [/* @__PURE__ */ R(K, {}), " Save to my fittings in EVE"]
					}),
					/* @__PURE__ */ R(n, {
						variant: "ghost",
						onClick: () => u(!0),
						children: "Show as text"
					}),
					t.can_manage && /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(N, {
						to: `/p/doctrines/fit/${t.id}/edit`,
						children: /* @__PURE__ */ z(n, {
							variant: "ghost",
							children: [/* @__PURE__ */ R(se, {}), " Edit"]
						})
					}), /* @__PURE__ */ R(n, {
						variant: "ghost",
						onClick: () => h(!0),
						"aria-label": "Delete fit",
						children: /* @__PURE__ */ R(W, {})
					})] })
				]
			})
		}),
		/* @__PURE__ */ z("div", {
			className: "space-y-6",
			children: [
				t.notes && /* @__PURE__ */ R(r, {
					tone: "info",
					title: "Notes from the FCs",
					children: /* @__PURE__ */ R("p", {
						className: "whitespace-pre-wrap",
						children: t.notes
					})
				}),
				/* @__PURE__ */ R(je, { view: t.view }),
				/* @__PURE__ */ R(Ke, { fit: t })
			]
		}),
		l && /* @__PURE__ */ R(s, {
			open: !0,
			onOpenChange: (e) => !e && u(!1),
			title: "The fit as text",
			size: "lg",
			description: "The same text the game copies. In the game, open the Fitting window and press Import from clipboard.",
			footer: /* @__PURE__ */ z(n, {
				variant: "primary",
				onClick: () => Me(t.eft, "Copied"),
				children: [/* @__PURE__ */ R(H, {}), " Copy"]
			}),
			children: /* @__PURE__ */ R(x, {
				readOnly: !0,
				rows: 18,
				value: t.eft,
				className: "font-mono text-xs",
				onFocus: (e) => e.currentTarget.select()
			})
		}),
		d && /* @__PURE__ */ R(Ge, {
			fit: t,
			onClose: () => p(!1)
		}),
		/* @__PURE__ */ R(o, {
			open: m,
			onOpenChange: h,
			title: `Delete ${t.name}?`,
			description: "It's removed from every doctrine it's in. Group rules that use it stop matching anyone.",
			confirmLabel: "Delete fit",
			danger: !0,
			onConfirm: async () => {
				try {
					await T.delete(`${q}/fits/${t.id}`);
				} catch (e) {
					throw A.error(e.message), e;
				}
				v.invalidateQueries({ queryKey: ["doctrines"] }), A.success(`${t.name} deleted`), _(y ? `/p/doctrines/${y.id}` : "/p/doctrines");
			}
		})
	] });
}
function Ge({ fit: e, onClose: t }) {
	let r = e.characters.filter((e) => e.can_save), [i, a] = I(String(r[0]?.id ?? "")), o = j({
		mutationFn: () => T.post(`${q}/fits/${e.id}/save-to-eve`, { character: Number(i) }),
		onSuccess: () => {
			A.success(`Saved to ${r.find((e) => String(e.id) === i)?.name}'s fittings in the game`), t();
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ z(s, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: "Save to my fittings in EVE",
		size: "md",
		description: "Adds the fit to a character's saved fittings in the game, ready to fit from the Fitting window. Loaded ammunition goes in the cargo.",
		footer: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(n, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), /* @__PURE__ */ z(n, {
			variant: "primary",
			disabled: !i,
			loading: o.isPending,
			onClick: () => o.mutate(),
			children: [/* @__PURE__ */ R(K, {}), " Save"]
		})] }),
		children: [r.length ? /* @__PURE__ */ R(l, {
			label: "Character",
			children: /* @__PURE__ */ R(h, {
				value: i,
				onChange: (e) => a(e.target.value),
				children: r.map((e) => /* @__PURE__ */ R("option", {
					value: e.id,
					children: e.name
				}, e.id))
			})
		}) : /* @__PURE__ */ R("p", {
			className: "text-sm text-muted",
			children: "None of your characters allow saving fittings. Log in with them again under Characters → Add character."
		}), r.length > 0 && r.length < e.characters.length && /* @__PURE__ */ z("p", {
			className: "mt-2 text-xs text-subtle",
			children: [e.characters.filter((e) => !e.can_save).map((e) => e.name).join(", "), " can't: log in with them again to allow saving fittings."]
		})]
	});
}
function Ke({ fit: r }) {
	let [o, s] = I(null), l = Ne(), u = P(), d = r.characters, f = d.find((e) => e.id === o) ?? d[0], p = j({
		mutationFn: (e) => T.post("/api/p/skillplans/plans", {
			name: `${r.name} (${r.ship.name})`,
			description: `Skills for the doctrine fit ${r.name}${f ? `, missing on ${f.name}` : ""}.`,
			skills: e
		}),
		onSuccess: (e) => u(`/p/skillplans/${e.id}`),
		onError: (e) => A.error(e.message)
	}), m = f?.missing_steps ?? [], h = (e) => e.map((e) => `${e.name} ${e.level}`).join("\n");
	return /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(a, {
		title: "Skills",
		description: "What the ship, modules, ammunition and drones need, with prerequisites, plus what the FCs recommend."
	}), /* @__PURE__ */ z("div", {
		className: "grid gap-0 border-t border-border lg:grid-cols-[280px_minmax(0,1fr)]",
		children: [/* @__PURE__ */ z("div", {
			className: "border-border p-card lg:border-r",
			children: [
				/* @__PURE__ */ R("div", {
					className: "mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle",
					children: "Your characters"
				}),
				d.length === 0 ? /* @__PURE__ */ R("p", {
					className: "text-sm text-muted",
					children: "You have no characters."
				}) : /* @__PURE__ */ R("ul", {
					className: "space-y-1",
					children: d.map((t) => /* @__PURE__ */ R("li", { children: /* @__PURE__ */ z("button", {
						type: "button",
						onClick: () => s(t.id),
						className: `flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-hover ${f?.id === t.id ? "bg-hover-strong" : ""}`,
						children: [/* @__PURE__ */ R(e, {
							src: t.portrait,
							name: t.name,
							size: "sm"
						}), /* @__PURE__ */ z("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ R("span", {
								className: "block truncate text-sm font-medium",
								children: t.name
							}), /* @__PURE__ */ R(Q, { status: t })]
						})]
					}) }, t.id))
				}),
				/* @__PURE__ */ z("div", {
					className: "mt-5 space-y-2",
					children: [
						/* @__PURE__ */ R("div", {
							className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle",
							children: "Required"
						}),
						/* @__PURE__ */ R("div", {
							className: "flex flex-wrap gap-1",
							children: r.required.map((e) => /* @__PURE__ */ z(t, {
								size: "xs",
								children: [
									e.name,
									" ",
									e.level
								]
							}, e.skill_id))
						}),
						r.recommended.length > 0 && /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R("div", {
							className: "pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle",
							children: "Recommended"
						}), /* @__PURE__ */ R("div", {
							className: "flex flex-wrap gap-1",
							children: r.recommended.map((e) => /* @__PURE__ */ z(t, {
								tone: "accent",
								size: "xs",
								children: [
									e.name,
									" ",
									e.level
								]
							}, e.skill_id))
						})] })
					]
				})
			]
		}), /* @__PURE__ */ R("div", {
			className: "min-w-0",
			children: f ? m.length === 0 ? /* @__PURE__ */ R(c, {
				icon: /* @__PURE__ */ R(V, {}),
				title: f.status === "unknown" ? "Skills not synced yet" : `${f.name} has every skill`,
				description: f.status === "unknown" ? "Once the character sheet syncs this character's skills, this shows what's missing." : "Required and recommended."
			}) : /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ z("div", {
				className: "flex flex-wrap items-center justify-between gap-2 p-card",
				children: [/* @__PURE__ */ z("div", {
					className: "text-sm text-muted",
					children: [
						f.name,
						" needs ",
						/* @__PURE__ */ R("span", {
							className: "text-text",
							children: m.length
						}),
						" more skill level",
						m.length === 1 ? "" : "s",
						":",
						" ",
						/* @__PURE__ */ R("span", {
							className: "font-mono text-text",
							children: Z(m.reduce((e, t) => e + t.seconds, 0))
						}),
						" with their attributes."
					]
				}), /* @__PURE__ */ z("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ z(n, {
						size: "sm",
						variant: "secondary",
						onClick: () => Me(h(m), "Copied. In the game: Skills → Skill plans → Import from clipboard, or paste into the skill queue"),
						children: [/* @__PURE__ */ R(H, {}), " Copy skill plan for EVE"]
					}), l && /* @__PURE__ */ z(n, {
						size: "sm",
						variant: "ghost",
						loading: p.isPending,
						onClick: () => p.mutate(m.map((e) => [e.skill_id, e.level])),
						children: [/* @__PURE__ */ R(me, {}), " Save as skill plan"]
					})]
				})]
			}), /* @__PURE__ */ z(y, { children: [/* @__PURE__ */ R(v, { children: /* @__PURE__ */ z("tr", { children: [
				/* @__PURE__ */ R(S, { children: "Skill" }),
				/* @__PURE__ */ R(S, {
					align: "right",
					children: "Time"
				}),
				/* @__PURE__ */ R(S, { align: "right" })
			] }) }), /* @__PURE__ */ R("tbody", { children: m.map((e) => /* @__PURE__ */ z(w, { children: [
				/* @__PURE__ */ z(b, { children: [
					e.name,
					" ",
					/* @__PURE__ */ R("span", {
						className: "font-mono text-muted",
						children: e.level
					})
				] }),
				/* @__PURE__ */ R(b, {
					numeric: !0,
					children: Z(e.seconds)
				}),
				/* @__PURE__ */ R(b, {
					align: "right",
					children: /* @__PURE__ */ z("span", {
						className: "flex justify-end gap-1",
						children: [e.status === "queued" && /* @__PURE__ */ R(t, {
							tone: "info",
							size: "xs",
							children: "In queue"
						}), e.required ? /* @__PURE__ */ R(t, {
							tone: "warning",
							size: "xs",
							children: "Required"
						}) : /* @__PURE__ */ R(t, {
							size: "xs",
							children: "Recommended"
						})]
					})
				})
			] }, `${e.skill_id}-${e.level}`)) })] })] }) : null
		})]
	})] });
}
//#endregion
//#region src/readiness.tsx
function qe() {
	let { id: t } = F(), [r, a] = I(""), [o, s] = I(!1), { data: l, isLoading: u, error: d } = M({
		queryKey: [
			"doctrines",
			"readiness",
			t
		],
		queryFn: () => T.get(`${q}/doctrines/${t}/readiness`)
	});
	if (d) return /* @__PURE__ */ R(c, {
		icon: /* @__PURE__ */ R(G, {}),
		title: d.message
	});
	if (u || !l) return /* @__PURE__ */ R(g, { className: "h-96" });
	let m = l.members.filter((e) => e.name.toLowerCase().includes(r.trim().toLowerCase()) && (!o || e.flyable === 0));
	return /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(f, {
		eyebrow: /* @__PURE__ */ R(N, {
			to: `/p/doctrines/${l.doctrine.id}`,
			className: "hover:text-text",
			children: l.doctrine.name
		}),
		title: "Who can fly it",
		icon: /* @__PURE__ */ R(G, {}),
		description: "Each member's best character for each fit, from their synced skills.",
		actions: /* @__PURE__ */ R("a", {
			href: `${q}/doctrines/${l.doctrine.id}/readiness.csv`,
			children: /* @__PURE__ */ z(n, {
				variant: "ghost",
				children: [/* @__PURE__ */ R(K, {}), " CSV"]
			})
		})
	}), /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ z("div", {
		className: "flex flex-wrap items-center gap-3 p-card pb-0",
		children: [/* @__PURE__ */ R(p, {
			value: r,
			onChange: (e) => a(e.target.value),
			placeholder: "Member",
			className: "w-56"
		}), /* @__PURE__ */ z("label", {
			className: "flex items-center gap-2 text-sm text-muted",
			children: [/* @__PURE__ */ R("input", {
				type: "checkbox",
				checked: o,
				onChange: (e) => s(e.target.checked)
			}), " Only members who can't fly any"]
		})]
	}), l.fits.length === 0 ? /* @__PURE__ */ R(c, {
		icon: /* @__PURE__ */ R(G, {}),
		title: "This doctrine has no fits yet"
	}) : /* @__PURE__ */ R("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ z(y, { children: [/* @__PURE__ */ R(v, { children: /* @__PURE__ */ z("tr", { children: [/* @__PURE__ */ R(S, { children: "Member" }), l.fits.map((e) => /* @__PURE__ */ z(S, { children: [/* @__PURE__ */ z(N, {
			to: `/p/doctrines/fit/${e.id}`,
			className: "flex items-center gap-2 hover:text-text",
			children: [/* @__PURE__ */ R("img", {
				src: e.ship.icon,
				alt: "",
				className: "size-6"
			}), /* @__PURE__ */ R("span", {
				className: "normal-case tracking-normal",
				children: e.name
			})]
		}), /* @__PURE__ */ z("div", {
			className: "mt-0.5 text-[10px] normal-case tracking-normal text-subtle",
			children: [l.totals[String(e.id)], " can fly"]
		})] }, e.id))] }) }), /* @__PURE__ */ R("tbody", { children: m.map((t) => /* @__PURE__ */ z(w, { children: [/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("span", {
			className: "flex items-center gap-2 whitespace-nowrap",
			children: [
				/* @__PURE__ */ R(e, {
					src: t.portrait,
					name: t.name,
					size: "xs"
				}),
				" ",
				t.name
			]
		}) }), l.fits.map((e) => {
			let n = t.cells[String(e.id)];
			return /* @__PURE__ */ R(b, { children: /* @__PURE__ */ R(C, {
				content: n ? n.character : "No characters",
				disabled: !n,
				children: /* @__PURE__ */ R("span", { children: /* @__PURE__ */ R(Q, { status: n }) })
			}) }, e.id);
		})] }, t.id)) })] })
	})] })] });
}
//#endregion
//#region src/index.tsx
function Je() {
	let { data: e, isLoading: t } = M({
		queryKey: ["doctrines", "me"],
		queryFn: () => T.get(`${q}/me`)
	});
	return t ? /* @__PURE__ */ R(g, { className: "h-16" }) : e ? /* @__PURE__ */ R(N, {
		to: "/p/doctrines",
		className: "block",
		children: /* @__PURE__ */ z("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R("div", {
				className: "text-xs text-muted",
				children: "Doctrine fits you can fly"
			}), /* @__PURE__ */ z("div", {
				className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
				children: [e.flyable, /* @__PURE__ */ z("span", {
					className: "text-lg text-subtle",
					children: [" / ", e.total]
				})]
			})] }), /* @__PURE__ */ R("div", {
				className: "flex -space-x-1.5",
				children: e.ships.map((e) => /* @__PURE__ */ R("img", {
					src: e.icon,
					alt: e.name,
					title: e.name,
					className: "size-8 rounded-full bg-surface-3 ring-2 ring-surface"
				}, e.id))
			})]
		})
	}) : null;
}
function Ye({ characterId: e }) {
	let { data: n, isLoading: r } = M({
		queryKey: [
			"doctrines",
			"character",
			e
		],
		queryFn: () => T.get(`${q}/characters/${e}`)
	});
	return r ? /* @__PURE__ */ R(g, { className: "h-40" }) : n?.length ? /* @__PURE__ */ z("div", {
		className: "space-y-6",
		children: [n.map((e) => /* @__PURE__ */ z("section", { children: [/* @__PURE__ */ R(N, {
			to: `/p/doctrines/${e.id}`,
			className: "mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle hover:text-text",
			children: e.name
		}), /* @__PURE__ */ R("ul", {
			className: "divide-y divide-border border border-border",
			children: e.fits.map((e) => /* @__PURE__ */ R("li", { children: /* @__PURE__ */ z(N, {
				to: `/p/doctrines/fit/${e.id}`,
				className: "flex items-center gap-3 px-3 py-2 hover:bg-hover",
				children: [
					/* @__PURE__ */ R("img", {
						src: e.ship.icon,
						alt: "",
						className: "size-8"
					}),
					/* @__PURE__ */ z("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ z("span", {
							className: "flex items-center gap-2 text-sm font-medium",
							children: [
								e.name,
								" ",
								/* @__PURE__ */ R($, { role: e.role })
							]
						}), /* @__PURE__ */ R("span", {
							className: "text-xs text-muted",
							children: e.ship.name
						})]
					}),
					/* @__PURE__ */ R(Q, { status: e })
				]
			}) }, e.id))
		})] }, e.id)), /* @__PURE__ */ z("p", {
			className: "text-xs text-subtle",
			children: [
				/* @__PURE__ */ R(t, {
					size: "xs",
					children: "Ready"
				}),
				" has the recommended skills too; ",
				/* @__PURE__ */ R(t, {
					size: "xs",
					children: "Can fly"
				}),
				" has what the fit needs."
			]
		})]
	}) : /* @__PURE__ */ R(c, {
		icon: /* @__PURE__ */ R(V, {}),
		title: "No doctrines yet"
	});
}
var Xe = D({
	routes: [
		{
			path: "",
			Component: he
		},
		{
			path: "fits",
			Component: Ve
		},
		{
			path: "fit/new",
			Component: Le
		},
		{
			path: "fit/:id",
			Component: We
		},
		{
			path: "fit/:id/edit",
			Component: Le
		},
		{
			path: ":id",
			Component: He
		},
		{
			path: ":id/readiness",
			Component: qe
		}
	],
	widgets: [{
		id: "flyable",
		title: "Doctrines",
		Component: Je,
		size: "sm",
		order: 36
	}],
	characterTabs: [{
		id: "doctrines",
		label: "Doctrines",
		Component: Ye,
		order: 300
	}]
});
//#endregion
export { Xe as default };

export const classes = ["!data","!name","!o","!parsed","--color-accent","-empty","-glow","-icon","-ship","-space-x-1","-space-x-1.5","@conduit/sdk","@tanstack/react-query","a","able","absolute","accent","across","action","actions","active","add","added","again","against","align","all-fits","allFits","all_steps","allow","along","alt","ammunition","an","and","angle","another","any","arcs","are","aren","aria-label","around","as","async","at","autoFocus","await","bay","bays","be","beside","best","bg-accent","bg-accent-soft","bg-danger","bg-gradient-to-r","bg-gradient-to-t","bg-hover-strong","bg-info","bg-surface-2","bg-surface-3","block","blocked","body","boolean","border","border-accent","border-border","border-t","bottom-3","bottom-4","browser","but","button","by","byId","byRole","bySlot","can","can_fly","can_manage","can_save","can_see_readiness","card","cargo","case","catch","category","cell","cells","character","characterId","characterTabs","characters","charge","charge_id","chars","checkbox","checked","children","className","clipPath","clipPathUnits","clipboard","clockwise","colSpan","come","confirmLabel","const","content","copy","copying","count","csv","current","currentColor","cursor-default","cx","cy","d","danger","data","default","degrees","deleted","description","dialog","didn","disabled","divide-border","divide-y","doctrine","doctrine-roles","doctrines","dominantBaseline","done","down","dq","drawn","drone","drones","e","each","editor","eft","else","empty","enabled","error","every","existing","export","extends","eyebrow","f","few","fighter","fighters","fill","fill-accent","fill-border-strong","fill-info","fill-none","fill-subtle","fill-surface","fill-surface-2","fill-surface-3","first","fit","fit/new","fits","fitted","fitting","fitting_id","fittings","flex","flex-1","flex-row-reverse","flex-wrap","fly","flyable","font-medium","font-mono","font-semibold","fontSize","footer","for","from","from-surface","from-surface/90","function","game","gap-0","gap-1","gap-2","gap-3","gap-4","gap-6","get","ghost","go","goes","grayscale","grid","group","grouped","groups","h","h-16","h-36","h-40","h-56","h-64","h-96","h-auto","h-full","hardpoints_used","has","have","haven","height","here","hi","hint","hits","hover:bg-hover","hover:text-text","how","href","i","icon","icon-sm","icon_type_id","icons","id","if","img","import","in","in-game","info","ingame","inline","inset-0","interactive","interface","into","is","isActive","isLoading","it","item","items","items-center","items-end","its","justify-between","justify-end","key","kind","known","label","labels","last","launcher","launchers","layout","lazy","left","left-4","left-5","length","letterSpacing","level","levels","lg","lg:border-r","lg:grid-cols-[280px_minmax(0,1fr)]","lg:grid-cols-[minmax(0,1fr)_280px]","like","line-clamp-2","list","list-disc","listed","ll","loading","log","low","lower","m","m-card","m18","m6","many","matches","matching","max-h-48","max-w-[460px]","maxLength","mb-1.5","mb-2","mb-3","mb-6","md","md:grid-cols-2","me","med","member","members","mid","middle","min-h-10","min-w-0","missing","missing_steps","module","modules","more","move","mr-auto","ms","mt-0.5","mt-1","mt-2","mt-5","mutationFn","mx-auto","my","my-fittings","n","name","navigate","needs","neutral","new","next","no","nobody","none","normal-case","not","notes","null","number","object-cover","objectBoundingBox","of","offline","offset","on","onBlur","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onFocus","onMouseEnter","onMouseLeave","onOpenChange","onSuccess","one","ones","opacity","opacity-40","opacity-50","opacity-60","opacity-90","open","options","or","order","out","outline-none","overflow-auto","overflow-hidden","overflow-x-auto","overview","p","p-card","parse","parsed","paste","pasting","path","pb-0","per","pilots","pl-4","placeholder","plain","plan","planText","plans","plugin","plus","point","points","portrait","position","post","powergrid","preserveAspectRatio","press","preview","primary","problems","pt-2","put","px-2","px-2.5","px-3","py-1","py-1.5","py-2","qc","quantity","queryFn","queryKey","queue","queued","r","re","react","react-router","readOnly","readiness","ready","recognised","recommended","relative","removed","render","required","required_steps","resources","rest","retry","return","rig","right","right-4","rigs","ring","ring-1","ring-2","ring-border","ring-border-strong","ring-inset","ring-surface","role","roles","rotate-45","round","rounded-full","routes","rows","rules","rx","ry","s","same","save","savePlan","saved","saving","secondary","seconds","sections","see","select","select-none","service","setActive","setCharacter","setCreating","setDeleting","setDoctrines","setEditing","setEft","setFits","setForm","setMode","setName","setNotes","setOnlyMissing","setQ","setRecommended","setRole","setSaving","setSelected","setShowEft","setV","share","sheet","ship","ship_type_id","ships","show","shown","shows","shrink-0","site","size","size-2","size-20","size-3","size-3.5","size-4","size-6","size-7","size-8","size-full","skill","skillPlans","skill_id","skillplans","skills","slice","slot","slots","sm","sm:grid-cols-2","sm:grid-cols-[1fr_120px]","sm:h-56","so","sp","space-y-1","space-y-1.5","space-y-2","space-y-3","space-y-4","space-y-6","spellCheck","src","start","static","status","stay","step","steps","still","stop","stopColor","stopOpacity","string","stroke","stroke-accent","stroke-accent/50","stroke-accent/70","stroke-border","stroke-border-strong","strokeDasharray","strokeLinecap","strokeLinejoin","strokeWidth","style","sub","subsystem","subsystems","success","such","switch","switched","synced","syncs","t","tab","tabIndex","tabular-nums","take","text","text-3xl","text-[10px]","text-[11px]","text-accent-ink","text-center","text-left","text-lg","text-muted","text-sm","text-subtle","text-text","text-warning-fg","text-xs","textAnchor","that","the","their","them","theme","then","they","this","throw","time","title","to","to-transparent","tone","too","top","total","totals","tracking-[0.12em]","tracking-[0.14em]","tracking-[0.1em]","tracking-normal","train","transform","truncate","try","turret","turrets","type","type_id","undefined","under","unit","unknown","until","up","updated_at","upper","uppercase","usable","use","useBootstrap","useDebounced","useOverview","useParams","useQuery","useQueryClient","useSearchParams","useSkillPlans","useState","used","v","value","valueText","values","variant","via-surface/20","via-surface/30","view","viewBox","void","w-20","w-56","w-64","w-full","warning","we","what","whatever","when","whether","which","whitespace-nowrap","whitespace-pre-wrap","who","widgets","width","window","with","without","works","x","x1","x2","xMidYMid","xl:grid-cols-3","xl:grid-cols-[420px_minmax(0,1fr)]","xs","y","y1","y2","yet","you","your","yourself"];
