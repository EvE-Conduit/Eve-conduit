import { Avatar as e, Badge as t, Button as n, Callout as r, Card as i, CardHeader as a, ConfirmDialog as o, Dialog as s, EmptyState as c, Field as l, Input as u, Meter as d, PageHeader as f, SearchInput as p, Segmented as m, Select as h, Skeleton as g, SwitchRow as ee, THead as _, Table as v, Td as y, Textarea as b, Th as x, Tooltip as S, Tr as C, api as w, cn as T, definePlugin as E, isk as D, num as O, toast as k, useBootstrap as te } from "@conduit/sdk";
import { useMutation as A, useQuery as j, useQueryClient as ne } from "@tanstack/react-query";
import { Link as M, useNavigate as N, useParams as P, useSearchParams as re } from "react-router";
import { Fragment as ie, useEffect as ae, useId as oe, useState as F } from "react";
import { Fragment as I, jsx as L, jsxs as R } from "react/jsx-runtime";
//#region src/icons.tsx
function z({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ L("svg", {
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
var B = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("polyline", { points: "14.5 17.5 3 6 3 3 6 3 17.5 14.5" }),
		/* @__PURE__ */ L("line", {
			x1: "13",
			x2: "19",
			y1: "19",
			y2: "13"
		}),
		/* @__PURE__ */ L("line", {
			x1: "16",
			x2: "20",
			y1: "16",
			y2: "20"
		}),
		/* @__PURE__ */ L("line", {
			x1: "19",
			x2: "21",
			y1: "21",
			y2: "19"
		}),
		/* @__PURE__ */ L("polyline", { points: "14.5 6.5 18 3 21 3 21 6 17.5 9.5" }),
		/* @__PURE__ */ L("line", {
			x1: "5",
			x2: "9",
			y1: "14",
			y2: "18"
		}),
		/* @__PURE__ */ L("line", {
			x1: "7",
			x2: "4",
			y1: "17",
			y2: "20"
		}),
		/* @__PURE__ */ L("line", {
			x1: "3",
			x2: "5",
			y1: "19",
			y2: "21"
		})
	]
}), se = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ L("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), ce = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ L("polyline", { points: "17 8 12 3 7 8" }),
		/* @__PURE__ */ L("line", {
			x1: "12",
			x2: "12",
			y1: "3",
			y2: "15"
		})
	]
}), V = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M5 12h14" }), /* @__PURE__ */ L("path", { d: "M12 5v14" })]
}), le = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" })
}), H = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M3 6h18" }),
		/* @__PURE__ */ L("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ L("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), U = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
		/* @__PURE__ */ L("circle", {
			cx: "9",
			cy: "7",
			r: "4"
		}),
		/* @__PURE__ */ L("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
		/* @__PURE__ */ L("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
	]
}), ue = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "M20 6 9 17l-5-5" })
}), de = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ L("polyline", { points: "12 6 12 12 16 14" })]
}), fe = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("circle", {
		cx: "12",
		cy: "12",
		r: "9"
	}), /* @__PURE__ */ L("circle", {
		cx: "12",
		cy: "12",
		r: "4"
	})]
}), pe = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("line", {
			x1: "8",
			x2: "21",
			y1: "6",
			y2: "6"
		}),
		/* @__PURE__ */ L("line", {
			x1: "8",
			x2: "21",
			y1: "12",
			y2: "12"
		}),
		/* @__PURE__ */ L("line", {
			x1: "8",
			x2: "21",
			y1: "18",
			y2: "18"
		}),
		/* @__PURE__ */ L("line", {
			x1: "3",
			x2: "3.01",
			y1: "6",
			y2: "6"
		}),
		/* @__PURE__ */ L("line", {
			x1: "3",
			x2: "3.01",
			y1: "12",
			y2: "12"
		}),
		/* @__PURE__ */ L("line", {
			x1: "3",
			x2: "3.01",
			y1: "18",
			y2: "18"
		})
	]
}), me = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "m18 15-6-6-6 6" })
}), he = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "m6 9 6 6 6-6" })
}), ge = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" }),
		/* @__PURE__ */ L("path", { d: "M12 7v6" }),
		/* @__PURE__ */ L("path", { d: "M9 10h6" })
	]
}), _e = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ L("polyline", { points: "7 10 12 15 17 10" }),
		/* @__PURE__ */ L("line", {
			x1: "12",
			x2: "12",
			y1: "15",
			y2: "3"
		})
	]
});
//#endregion
//#region src/shared.tsx
function W(e) {
	if (!e) return "0m";
	let t = Math.floor(e / 86400), n = Math.floor(e % 86400 / 3600), r = Math.ceil(e % 3600 / 60);
	return t ? `${t}d ${n}h` : n ? `${n}h ${r}m` : `${r}m`;
}
function G({ status: e, size: n = "xs" }) {
	if (!e) return /* @__PURE__ */ L(t, {
		size: n,
		children: "No characters"
	});
	switch (e.status) {
		case "ready": return /* @__PURE__ */ R(t, {
			tone: "success",
			size: n,
			children: [/* @__PURE__ */ L(ue, { className: "size-3" }), " Ready"]
		});
		case "can_fly": return /* @__PURE__ */ L(S, {
			content: e.seconds ? `Has the required skills; the recommended ones take ${W(e.seconds)} more` : "Has the required skills",
			children: /* @__PURE__ */ L("span", { children: /* @__PURE__ */ L(t, {
				tone: "accent",
				size: n,
				children: "Can fly"
			}) })
		});
		case "missing": return /* @__PURE__ */ R(t, {
			tone: "warning",
			size: n,
			children: [
				/* @__PURE__ */ L(de, { className: "size-3" }),
				" ",
				e.missing,
				" skill",
				e.missing === 1 ? "" : "s",
				" · ",
				W(e.seconds)
			]
		});
		default: return /* @__PURE__ */ L(t, {
			size: n,
			children: "Skills not synced"
		});
	}
}
async function ve(e, t) {
	try {
		await navigator.clipboard.writeText(e), k.success(t);
	} catch {
		k.error("Your browser didn't allow copying; select the text and copy it yourself");
	}
}
function ye() {
	return te().plugins.some((e) => e.id === "skillplans");
}
var be = {
	DPS: "danger",
	Logistics: "success",
	Tackle: "warning",
	Ewar: "info",
	Support: "accent",
	Booster: "accent",
	Command: "accent",
	Scout: "neutral"
};
function K({ role: e }) {
	return e ? /* @__PURE__ */ L(t, {
		tone: be[e] ?? "neutral",
		size: "xs",
		children: e
	}) : null;
}
//#endregion
//#region src/types.ts
var q = "/api/p/doctrines";
//#endregion
//#region src/home.tsx
function xe() {
	return j({
		queryKey: ["doctrines", "overview"],
		queryFn: () => w.get(q)
	});
}
function Se() {
	let { data: e, isLoading: r } = xe(), [a, o] = F(!1);
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(f, {
			eyebrow: "Operations",
			title: "Doctrines",
			icon: /* @__PURE__ */ L(B, {}),
			description: "The ships and fits we fly. Open a fit to see it like the in-game fitting window, copy it into the game, and see which of your characters can fly it.",
			actions: e?.can_manage && /* @__PURE__ */ R("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ L(M, {
						to: "/p/doctrines/fits",
						children: /* @__PURE__ */ R(n, {
							variant: "ghost",
							children: [/* @__PURE__ */ L(pe, {}), " All fits"]
						})
					}),
					/* @__PURE__ */ L(M, {
						to: "/p/doctrines/fit/new",
						children: /* @__PURE__ */ R(n, {
							variant: "secondary",
							children: [/* @__PURE__ */ L(V, {}), " New fit"]
						})
					}),
					/* @__PURE__ */ R(n, {
						variant: "primary",
						onClick: () => o(!0),
						children: [/* @__PURE__ */ L(V, {}), " New doctrine"]
					})
				]
			})
		}),
		r || !e ? /* @__PURE__ */ L("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ L(g, { className: "h-56" }, e))
		}) : e.doctrines.length === 0 && e.fits.length === 0 ? /* @__PURE__ */ L(i, { children: /* @__PURE__ */ L(c, {
			icon: /* @__PURE__ */ L(B, {}),
			title: "No doctrines yet",
			description: e.can_manage ? "Add a fit by pasting it from the game with New fit, and group fits with New doctrine." : "Your FCs haven't added any doctrines yet."
		}) }) : e.doctrines.length === 0 ? null : /* @__PURE__ */ L("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
			children: e.doctrines.map((e) => /* @__PURE__ */ L(M, {
				to: `/p/doctrines/${e.id}`,
				className: "block",
				children: /* @__PURE__ */ R(i, {
					interactive: !0,
					className: e.active ? "h-full overflow-hidden" : "h-full overflow-hidden opacity-60",
					children: [/* @__PURE__ */ R("div", {
						className: "relative h-36 overflow-hidden bg-surface-2",
						children: [
							e.render && /* @__PURE__ */ L("img", {
								src: e.render,
								alt: "",
								className: "absolute inset-0 size-full object-cover opacity-90",
								loading: "lazy"
							}),
							/* @__PURE__ */ L("div", { className: "absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" }),
							/* @__PURE__ */ R("div", {
								className: "absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2",
								children: [/* @__PURE__ */ L("div", {
									className: "text-lg font-semibold",
									children: e.name
								}), !e.active && /* @__PURE__ */ L(t, {
									size: "xs",
									children: "Retired"
								})]
							})
						]
					}), /* @__PURE__ */ R("div", {
						className: "space-y-3 p-card",
						children: [e.description && /* @__PURE__ */ L("p", {
							className: "line-clamp-2 text-sm text-muted",
							children: e.description
						}), /* @__PURE__ */ R("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ L("div", {
								className: "flex -space-x-1.5",
								children: e.ships.map((e) => /* @__PURE__ */ L("img", {
									src: e.icon,
									alt: e.name,
									title: e.name,
									className: "size-8 rounded-full bg-surface-3 ring-2 ring-surface",
									loading: "lazy"
								}, e.id))
							}), /* @__PURE__ */ R(t, {
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
		e && e.fits.length > 0 && /* @__PURE__ */ R("section", {
			className: e.doctrines.length ? "mt-8" : "",
			children: [/* @__PURE__ */ L("h2", {
				className: "mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle",
				children: "Other fits"
			}), /* @__PURE__ */ L("div", {
				className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3",
				children: e.fits.map((e) => /* @__PURE__ */ L(Ce, { fit: e }, e.id))
			})]
		}),
		a && e && /* @__PURE__ */ L(Ye, { onClose: () => o(!1) })
	] });
}
function Ce({ fit: e }) {
	return /* @__PURE__ */ L(M, {
		to: `/p/doctrines/fit/${e.id}`,
		className: "block",
		children: /* @__PURE__ */ R(i, {
			interactive: !0,
			className: "flex h-full items-center gap-4 p-card",
			children: [/* @__PURE__ */ L("img", {
				src: e.ship.render,
				alt: "",
				className: "size-16 shrink-0 rounded-full bg-surface-2 object-cover ring-1 ring-border",
				loading: "lazy"
			}), /* @__PURE__ */ R("div", {
				className: "min-w-0 flex-1 space-y-1.5",
				children: [
					/* @__PURE__ */ R("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ L("span", {
							className: "truncate font-medium",
							children: e.name
						}), /* @__PURE__ */ L(K, { role: e.role })]
					}),
					/* @__PURE__ */ R("div", {
						className: "text-xs text-muted",
						children: [
							e.ship.name,
							" · ",
							e.ship.group,
							" · ",
							D(e.value)
						]
					}),
					/* @__PURE__ */ L(G, { status: e.best })
				]
			})]
		})
	});
}
//#endregion
//#region src/ring.tsx
var we = 520, J = we / 2, Y = 206, Te = 30, Ee = 42, De = 140, Oe = 170, ke = 233, X = [
	["hi", 8],
	["med", 8],
	["low", 8],
	["rig", 3],
	["sub", 4]
], Z = 9.2, Ae = (360 - X.reduce((e, [, t]) => e + t, 0) * Z) / X.length, Q = {};
{
	let e = -73.6 / 2;
	for (let [t, n] of X) Q[t] = [e, e + n * Z], e += n * Z + Ae;
	Q.service = Q.sub;
}
var je = {
	hi: "High",
	med: "Mid",
	low: "Low",
	rig: "Rigs",
	sub: "Subsystems",
	service: "Services"
}, Me = [
	"hi",
	"med",
	"low",
	"rig",
	"sub",
	"service"
];
function $(e, t) {
	let n = e * Math.PI / 180;
	return {
		x: J + t * Math.sin(n),
		y: J - t * Math.cos(n)
	};
}
function Ne(e, t) {
	let [n, r] = Q[e], i = Math.min(Z, (r - n) / t), a = (n + r) / 2;
	return Array.from({ length: t }, (e, n) => a + (n - (t - 1) / 2) * i);
}
function Pe(e, t, n, r = !1) {
	let [i, a] = r ? [$(t, n), $(e, n)] : [$(e, n), $(t, n)];
	return `M ${i.x} ${i.y} A ${n} ${n} 0 ${+(Math.abs(t - e) > 180)} ${+!r} ${a.x} ${a.y}`;
}
function Fe(e) {
	return `${e.type.name}${e.charge ? ` · ${e.charge.name}` : ""}${e.offline ? " (offline)" : ""}`;
}
var Ie = {
	cpu: {
		from: 104,
		to: 166,
		reverse: !0
	},
	power: {
		from: 194,
		to: 256,
		reverse: !0
	},
	calibration: {
		from: 266,
		to: 314,
		reverse: !1
	}
};
function Le({ id: e, resource: t }) {
	let n = Ie[t.key];
	if (!n || !t.total && !t.used) return null;
	let r = t.total ? t.used / t.total : 1, i = r > 1 ? "stroke-danger" : r > .9 ? "stroke-warning" : "stroke-accent", a = n.from + (n.to - n.from) * Math.min(1, r), o = `${e}-gauge-${t.key}`;
	return /* @__PURE__ */ R("g", { children: [
		/* @__PURE__ */ L("title", { children: `${t.label}: ${O(t.used)} / ${O(t.total)} ${t.unit} with fitting skills at V` }),
		/* @__PURE__ */ L("path", {
			d: Pe(n.from, n.to, Oe),
			className: "fill-none stroke-border-strong",
			strokeWidth: 5,
			opacity: .45
		}),
		r > 0 && /* @__PURE__ */ L("path", {
			d: Pe(n.from, a, Oe),
			className: T("fill-none", i),
			strokeWidth: 5
		}),
		/* @__PURE__ */ L("path", {
			id: o,
			d: Pe(n.from, n.to, n.reverse ? 161 : 158, n.reverse),
			fill: "none"
		}),
		/* @__PURE__ */ L("text", {
			fontSize: 9.5,
			letterSpacing: .6,
			className: r > 1 ? "fill-danger" : "fill-muted",
			dominantBaseline: "middle",
			children: /* @__PURE__ */ L("textPath", {
				href: `#${o}`,
				startOffset: "50%",
				textAnchor: "middle",
				children: `${t.label.toUpperCase()}  ${O(Math.round(t.used * 10) / 10)} / ${O(t.total)}`
			})
		})
	] });
}
function Re({ used: e, total: t, side: n, kind: r }) {
	let i = Math.max(t, e);
	return i ? /* @__PURE__ */ R("g", { children: [/* @__PURE__ */ L("title", { children: `${r === "turret" ? "Turret" : "Launcher"} hardpoints: ${e} of ${t} used` }), Array.from({ length: i }, (i, a) => {
		let o = $(n * (5 + a * 4.6), Oe);
		return /* @__PURE__ */ L("rect", {
			x: o.x - 3,
			y: o.y - 3,
			width: 6,
			height: 6,
			transform: `rotate(45 ${o.x} ${o.y})`,
			strokeWidth: 1,
			className: a >= t ? "fill-danger stroke-danger" : a < e ? r === "turret" ? "fill-accent stroke-accent" : "fill-info stroke-info" : "fill-none stroke-border-strong"
		}, a);
	})] }) : null;
}
function ze({ view: e }) {
	let t = oe().replace(/:/g, ""), [n, r] = F(null), i = /* @__PURE__ */ new Map();
	for (let t of e.items) {
		if (!Me.includes(t.slot)) continue;
		let e = i.get(t.slot) ?? [];
		e.push(t), i.set(t.slot, e);
	}
	let a = Me.map((t) => {
		let n = (i.get(t) ?? []).sort((e, t) => e.position - t.position);
		return {
			slot: t,
			count: Math.max(e.slots[t] ?? 0, n.length, ...n.map((e) => e.position + 1)),
			items: n
		};
	}).filter((e) => e.count > 0);
	return /* @__PURE__ */ R("div", {
		className: "mx-auto w-full max-w-[520px]",
		children: [/* @__PURE__ */ R("svg", {
			viewBox: `0 0 ${we} ${we}`,
			className: "h-auto w-full select-none",
			role: "img",
			"aria-label": `${e.ship.name} fitting`,
			children: [
				/* @__PURE__ */ R("defs", { children: [/* @__PURE__ */ L("clipPath", {
					id: `${t}-ship`,
					children: /* @__PURE__ */ L("circle", {
						cx: J,
						cy: J,
						r: De
					})
				}), /* @__PURE__ */ R("radialGradient", {
					id: `${t}-glow`,
					children: [/* @__PURE__ */ L("stop", {
						offset: "60%",
						stopColor: "var(--color-accent)",
						stopOpacity: 0
					}), /* @__PURE__ */ L("stop", {
						offset: "100%",
						stopColor: "var(--color-accent)",
						stopOpacity: .16
					})]
				})] }),
				/* @__PURE__ */ L("circle", {
					cx: J,
					cy: J,
					r: Y,
					className: "fill-none stroke-surface-2",
					strokeWidth: Ee
				}),
				/* @__PURE__ */ L("circle", {
					cx: J,
					cy: J,
					r: 227,
					className: "fill-none stroke-border"
				}),
				/* @__PURE__ */ L("circle", {
					cx: J,
					cy: J,
					r: Y - Ee / 2,
					className: "fill-none stroke-border"
				}),
				X.map(([e]) => {
					let [t, n] = Q[e];
					return /* @__PURE__ */ L("path", {
						d: Pe(t + 1, n - 1, Y),
						className: "fill-none stroke-border-strong",
						strokeWidth: 36,
						opacity: .22
					}, `rack-${e}`);
				}),
				/* @__PURE__ */ L("circle", {
					cx: J,
					cy: J,
					r: De,
					className: "fill-surface-2"
				}),
				/* @__PURE__ */ L("image", {
					href: e.ship.render,
					x: 120,
					y: 120,
					width: 280,
					height: 280,
					clipPath: `url(#${t}-ship)`,
					preserveAspectRatio: "xMidYMid slice"
				}),
				/* @__PURE__ */ L("circle", {
					cx: J,
					cy: J,
					r: De,
					fill: `url(#${t}-glow)`,
					className: "stroke-border"
				}),
				/* @__PURE__ */ L(Re, {
					used: e.hardpoints_used.turrets,
					total: e.slots.turrets,
					side: -1,
					kind: "turret"
				}),
				/* @__PURE__ */ L(Re, {
					used: e.hardpoints_used.launchers,
					total: e.slots.launchers,
					side: 1,
					kind: "launcher"
				}),
				e.resources.map((e) => /* @__PURE__ */ L(Le, {
					id: t,
					resource: e
				}, e.key)),
				a.map(({ slot: e, count: t, items: i }) => Ne(e, t).map((t, a) => {
					let o = i.find((e) => e.position === a), s = $(t, Y), c = $(t, ke), l = !!o && n === o, u = Te / 2;
					return /* @__PURE__ */ R("g", {
						tabIndex: o ? 0 : void 0,
						onMouseEnter: () => o && r(o),
						onMouseLeave: () => r(null),
						onFocus: () => o && r(o),
						onBlur: () => r(null),
						className: T(o && "cursor-default outline-none"),
						children: [
							/* @__PURE__ */ L("title", { children: o ? Fe(o) : `Empty ${je[e].toLowerCase()} slot` }),
							/* @__PURE__ */ L("rect", {
								x: s.x - u,
								y: s.y - u,
								width: Te,
								height: Te,
								rx: 3,
								className: T(o ? "fill-surface-3" : "fill-surface", l ? "stroke-accent" : o ? "stroke-border-strong" : "stroke-border"),
								strokeWidth: l ? 2 : 1,
								strokeDasharray: o?.offline ? "3 2" : o ? void 0 : "2 2"
							}),
							o ? /* @__PURE__ */ L("image", {
								href: o.type.icon,
								x: s.x - u + 1.5,
								y: s.y - u + 1.5,
								width: 27,
								height: 27,
								opacity: o.offline ? .3 : 1
							}) : /* @__PURE__ */ L("circle", {
								cx: s.x,
								cy: s.y,
								r: 2,
								className: "fill-border-strong"
							}),
							o?.charge && /* @__PURE__ */ R("g", { children: [/* @__PURE__ */ L("rect", {
								x: c.x - 9,
								y: c.y - 9,
								width: 18,
								height: 18,
								rx: 2,
								className: "fill-surface stroke-border-strong"
							}), /* @__PURE__ */ L("image", {
								href: o.charge.icon,
								x: c.x - 8,
								y: c.y - 8,
								width: 16,
								height: 16
							})] })
						]
					}, `${e}-${a}`);
				}))
			]
		}), /* @__PURE__ */ L("div", {
			className: "mt-1 min-h-10 text-center",
			children: n ? /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L("div", {
				className: "text-sm font-medium",
				children: n.type.name
			}), /* @__PURE__ */ R("div", {
				className: "text-xs text-muted",
				children: [n.charge ? `Loaded: ${n.charge.name}` : n.type.group, n.offline && " · offline"]
			})] }) : /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L("div", {
				className: "text-sm font-medium",
				children: e.ship.name
			}), /* @__PURE__ */ R("div", {
				className: "text-xs text-muted",
				children: [e.ship.group, " · point at a module to see it"]
			})] })
		})]
	});
}
function Be({ view: e }) {
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
	return t.length ? /* @__PURE__ */ L("div", {
		className: "space-y-4",
		children: t.map((e) => /* @__PURE__ */ R("div", { children: [/* @__PURE__ */ L("div", {
			className: "mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle",
			children: e.label
		}), /* @__PURE__ */ L("ul", {
			className: "space-y-1",
			children: e.items.map((e) => /* @__PURE__ */ R("li", {
				className: "flex items-center gap-2 text-sm",
				children: [
					/* @__PURE__ */ L("img", {
						src: e.type.icon,
						alt: "",
						className: "size-7 rounded-full bg-surface-3",
						loading: "lazy"
					}),
					/* @__PURE__ */ L("span", {
						className: "min-w-0 flex-1 truncate",
						children: e.type.name
					}),
					/* @__PURE__ */ R("span", {
						className: "font-mono text-xs tabular-nums text-muted",
						children: ["×", O(e.quantity)]
					})
				]
			}, `${e.slot}-${e.type_id}`))
		})] }, e.key))
	}) : /* @__PURE__ */ L("p", {
		className: "text-sm text-subtle",
		children: "No drones or cargo."
	});
}
function Ve({ view: e }) {
	let [t, n] = F("v");
	return /* @__PURE__ */ R("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ L(m, {
				size: "sm",
				value: t,
				onChange: n,
				"aria-label": "Fitting skills",
				options: [{
					value: "v",
					label: "Skills at V"
				}, {
					value: "none",
					label: "No skills"
				}]
			}),
			e.resources.filter((e) => e.total > 0 || e.used > 0).map((e) => {
				let [n, r] = t === "v" ? [e.used, e.total] : [e.base_used, e.base_total], i = r ? n / r : 1;
				return /* @__PURE__ */ L(d, {
					label: e.label,
					value: Math.min(1, i),
					tone: i > 1 ? "danger" : i > .9 ? "warning" : "accent",
					valueText: `${O(Math.round(n * 10) / 10)} / ${O(r)}${e.unit ? ` ${e.unit}` : ""}`
				}, e.key);
			}),
			/* @__PURE__ */ L("p", {
				className: "text-xs text-subtle",
				children: t === "v" ? "CPU Management, Power Grid Management, Weapon Upgrades and Advanced Weapon Upgrades at V. Other modules' own fitting skills and modules that add CPU or powergrid aren't counted." : "The ship's and modules' base values, without any skills."
			})
		]
	});
}
function He({ view: e }) {
	let t = Me.flatMap((t) => {
		let n = e.items.filter((e) => e.slot === t).sort((e, t) => e.position - t.position), r = Math.max(0, (e.slots[t] ?? 0) - n.length);
		return !n.length && !r ? [] : [{
			slot: t,
			items: n,
			empty: r
		}];
	});
	return /* @__PURE__ */ R(v, { children: [/* @__PURE__ */ L(_, { children: /* @__PURE__ */ R("tr", { children: [
		/* @__PURE__ */ L(x, { children: "Slot" }),
		/* @__PURE__ */ L(x, { children: "Module" }),
		/* @__PURE__ */ L(x, { children: "Charge" })
	] }) }), /* @__PURE__ */ L("tbody", { children: t.map(({ slot: e, items: t, empty: n }) => /* @__PURE__ */ R(ie, { children: [t.map((t) => /* @__PURE__ */ R(C, { children: [
		/* @__PURE__ */ L(y, {
			className: "text-xs uppercase tracking-[0.1em] text-subtle",
			children: je[e]
		}),
		/* @__PURE__ */ L(y, { children: /* @__PURE__ */ R("span", {
			className: T("flex items-center gap-2", t.offline && "opacity-50"),
			children: [
				/* @__PURE__ */ L("img", {
					src: t.type.icon,
					alt: "",
					className: "size-6",
					loading: "lazy"
				}),
				t.type.name,
				t.offline && /* @__PURE__ */ L("span", {
					className: "text-xs text-warning-fg",
					children: "offline"
				})
			]
		}) }),
		/* @__PURE__ */ L(y, {
			className: "text-sm text-muted",
			children: t.charge?.name ?? ""
		})
	] }, `${e}-${t.position}`)), n > 0 && /* @__PURE__ */ R(C, { children: [/* @__PURE__ */ L(y, {
		className: "text-xs uppercase tracking-[0.1em] text-subtle",
		children: je[e]
	}), /* @__PURE__ */ R(y, {
		className: "text-sm text-subtle",
		colSpan: 2,
		children: [n, " empty"]
	})] }, `${e}-empty`)] }, e)) })] });
}
function Ue({ view: e }) {
	let [t, n] = F("ring");
	return /* @__PURE__ */ R("div", {
		className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]",
		children: [/* @__PURE__ */ R(i, {
			className: "p-card",
			children: [
				/* @__PURE__ */ R("div", {
					className: "mb-3 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ L(m, {
						size: "sm",
						value: t,
						onChange: n,
						"aria-label": "Show the fit as",
						options: [{
							value: "ring",
							label: "Fitting",
							icon: /* @__PURE__ */ L(fe, { className: "size-3.5" })
						}, {
							value: "list",
							label: "List",
							icon: /* @__PURE__ */ L(pe, { className: "size-3.5" })
						}]
					}), /* @__PURE__ */ L("span", {
						className: "font-mono text-sm tabular-nums text-muted",
						children: D(e.value)
					})]
				}),
				!e.known && /* @__PURE__ */ L("p", {
					className: "mb-3 text-sm text-warning-fg",
					children: "This site's EVE static data has no fitting data for this ship yet (Administration → Health → Import again). Modules are shown as saved."
				}),
				L(t === "ring" ? ze : He, { view: e })
			]
		}), /* @__PURE__ */ R("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ R(i, {
				className: "p-card",
				children: [/* @__PURE__ */ L("div", {
					className: "mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle",
					children: "Resources"
				}), /* @__PURE__ */ L(Ve, { view: e })]
			}), /* @__PURE__ */ L(i, {
				className: "p-card",
				children: /* @__PURE__ */ L(Be, { view: e })
			})]
		})]
	});
}
//#endregion
//#region src/edit.tsx
function We(e, t = 500) {
	let [n, r] = F(e);
	return ae(() => {
		let n = setTimeout(() => r(e), t);
		return () => clearTimeout(n);
	}, [e, t]), n;
}
var Ge = "[Rifter, Fleet Rifter]\nGyrostabilizer II\nSmall Armor Repairer II\n\n1MN Afterburner II\nWarp Scrambler II\n\n125mm Gatling AutoCannon II, Republic Fleet EMP S\n...";
function Ke() {
	let { id: e } = P(), [t] = re(), n = j({
		queryKey: [
			"doctrines",
			"fit",
			e
		],
		queryFn: () => w.get(`${q}/fits/${e}`),
		enabled: !!e
	});
	return e && !n.data ? n.error ? /* @__PURE__ */ L(c, {
		icon: /* @__PURE__ */ L(B, {}),
		title: "No such fit"
	}) : /* @__PURE__ */ L(g, { className: "h-96" }) : /* @__PURE__ */ L(qe, {
		fit: n.data,
		doctrine: t.get("doctrine")
	}, e ?? "new");
}
function qe({ fit: e, doctrine: t }) {
	let a = N(), o = ne(), s = xe(), [d, p] = F(e?.eft ?? ""), [m, g] = F(e?.name ?? ""), [ee, _] = F(e?.role ?? ""), [v, y] = F(e?.notes ?? ""), [x, S] = F(e ? e.doctrines.map((e) => e.id) : t ? [Number(t)] : []), [C, T] = F(e?.recommended ?? []), E = We(d.trim()), D = j({
		queryKey: [
			"doctrines",
			"parse",
			E
		],
		queryFn: () => w.post(`${q}/parse`, { eft: E }),
		enabled: !!E,
		retry: !1
	}), O = j({
		queryKey: ["doctrines", "my-fittings"],
		queryFn: () => w.get(`${q}/my-fittings`)
	}), te = A({
		mutationFn: () => {
			let t = {
				eft: d,
				name: m,
				role: ee,
				notes: v,
				doctrines: x,
				recommended: C.map((e) => [e.skill_id, e.level])
			};
			return e ? w.put(`${q}/fits/${e.id}`, t) : w.post(`${q}/fits`, t);
		},
		onSuccess: (e) => {
			o.invalidateQueries({ queryKey: ["doctrines"] }), e.unknown?.length ? k.warning(`Saved without ${e.unknown.length} line${e.unknown.length === 1 ? "" : "s"} nobody recognised`) : k.success(`${e.name} saved`), a(`/p/doctrines/fit/${e.id}`);
		},
		onError: (e) => k.error(e.message)
	}), P = D.data, re = !P || P.problems.length > 0;
	return /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(f, {
		eyebrow: /* @__PURE__ */ L(M, {
			to: "/p/doctrines",
			className: "hover:text-text",
			children: "Doctrines"
		}),
		title: e ? `Edit ${e.name}` : "New fit",
		icon: /* @__PURE__ */ L(B, {}),
		description: "Paste the fit from the game (Fitting window → Copy to clipboard) or Pyfa. Modules go in the right slots whatever order they're in.",
		actions: /* @__PURE__ */ R("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ L(n, {
				variant: "ghost",
				onClick: () => a(-1),
				children: "Cancel"
			}), /* @__PURE__ */ L(n, {
				variant: "primary",
				disabled: re,
				loading: te.isPending,
				onClick: () => te.mutate(),
				children: "Save fit"
			})]
		})
	}), /* @__PURE__ */ R("div", {
		className: "grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]",
		children: [/* @__PURE__ */ R("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ R(i, {
				className: "space-y-4 p-card",
				children: [
					O.data && O.data.length > 0 && /* @__PURE__ */ L(l, {
						label: "Start from one of your in-game fittings",
						hint: "Your characters' saved fittings, as last synced.",
						children: /* @__PURE__ */ R(h, {
							value: "",
							onChange: (e) => {
								let t = O.data.find((t) => t.id === e.target.value);
								t && (p(t.eft), m || g(t.name));
							},
							children: [/* @__PURE__ */ L("option", {
								value: "",
								children: "Pick a fitting…"
							}), O.data.map((e) => /* @__PURE__ */ R("option", {
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
					/* @__PURE__ */ L(l, {
						label: "Fit",
						required: !0,
						children: /* @__PURE__ */ L(b, {
							rows: 14,
							value: d,
							onChange: (e) => p(e.target.value),
							placeholder: Ge,
							className: "font-mono text-xs",
							spellCheck: !1
						})
					}),
					D.error && /* @__PURE__ */ L(r, {
						tone: "danger",
						children: D.error.message
					}),
					P && P.problems.length > 0 && /* @__PURE__ */ L(r, {
						tone: "danger",
						title: "This fit can't be fitted",
						children: /* @__PURE__ */ L("ul", {
							className: "list-disc pl-4",
							children: P.problems.map((e) => /* @__PURE__ */ L("li", { children: e }, e))
						})
					}),
					P && P.unknown.length > 0 && /* @__PURE__ */ L(r, {
						tone: "warning",
						title: "Lines nobody recognised (they'll be left out)",
						children: /* @__PURE__ */ L("ul", {
							className: "list-disc pl-4 font-mono text-xs",
							children: P.unknown.map((e) => /* @__PURE__ */ L("li", { children: e }, e))
						})
					})
				]
			}), /* @__PURE__ */ R(i, {
				className: "space-y-4 p-card",
				children: [
					/* @__PURE__ */ R("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ L(l, {
							label: "Name",
							hint: P && !m ? `From the paste: ${P.name}` : void 0,
							children: /* @__PURE__ */ L(u, {
								value: m,
								onChange: (e) => g(e.target.value),
								placeholder: P?.name ?? "Fleet Rifter",
								maxLength: 100
							})
						}), /* @__PURE__ */ R(l, {
							label: "Role",
							children: [/* @__PURE__ */ L(u, {
								value: ee,
								onChange: (e) => _(e.target.value),
								list: "doctrine-roles",
								placeholder: "DPS, Logistics…",
								maxLength: 40
							}), /* @__PURE__ */ L("datalist", {
								id: "doctrine-roles",
								children: s.data?.roles.map((e) => /* @__PURE__ */ L("option", { value: e }, e))
							})]
						})]
					}),
					/* @__PURE__ */ L(l, {
						label: "Doctrines",
						hint: "Optional: fits that aren't in a doctrine are listed under Other fits.",
						children: /* @__PURE__ */ R("div", {
							className: "flex flex-wrap gap-2",
							children: [s.data?.doctrines.map((e) => {
								let t = x.includes(e.id);
								return /* @__PURE__ */ L("button", {
									type: "button",
									onClick: () => S(t ? x.filter((t) => t !== e.id) : [...x, e.id]),
									className: `border px-2.5 py-1 text-sm ${t ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:bg-hover"}`,
									children: e.name
								}, e.id);
							}), s.data?.doctrines.length === 0 && /* @__PURE__ */ L("span", {
								className: "text-sm text-subtle",
								children: "No doctrines yet; you can add the fit to one later."
							})]
						})
					}),
					/* @__PURE__ */ L(l, {
						label: "Notes",
						hint: "Shown on the fit: how to fly it, what to bring.",
						children: /* @__PURE__ */ L(b, {
							rows: 3,
							value: v,
							onChange: (e) => y(e.target.value)
						})
					}),
					/* @__PURE__ */ L(Je, {
						value: C,
						onChange: T
					})
				]
			})]
		}), /* @__PURE__ */ L("div", { children: P ? /* @__PURE__ */ L(Ue, { view: P.view }) : /* @__PURE__ */ L(i, { children: /* @__PURE__ */ L(c, {
			icon: /* @__PURE__ */ L(ce, {}),
			title: "Paste a fit to see it",
			description: "It's shown here like the in-game fitting window as you type."
		}) }) })]
	})] });
}
function Je({ value: e, onChange: t }) {
	let [r, i] = F(""), a = We(r.trim(), 300), { data: o } = j({
		queryKey: [
			"doctrines",
			"skills",
			a
		],
		queryFn: () => w.get(`${q}/skills?q=${encodeURIComponent(a)}`),
		enabled: a.length >= 2
	});
	return /* @__PURE__ */ L(l, {
		label: "Recommended skills",
		hint: "On top of what the fit needs; pilots with them too show as Ready.",
		children: /* @__PURE__ */ R("div", {
			className: "space-y-2",
			children: [
				e.map((r) => /* @__PURE__ */ R("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ L("span", {
							className: "flex-1 text-sm",
							children: r.name
						}),
						/* @__PURE__ */ L(h, {
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
							].map((e) => /* @__PURE__ */ L("option", {
								value: e,
								children: e
							}, e))
						}),
						/* @__PURE__ */ L(n, {
							size: "icon-sm",
							variant: "ghost",
							"aria-label": `Remove ${r.name}`,
							onClick: () => t(e.filter((e) => e.skill_id !== r.skill_id)),
							children: /* @__PURE__ */ L(H, {})
						})
					]
				}, r.skill_id)),
				/* @__PURE__ */ L(p, {
					value: r,
					onChange: (e) => i(e.target.value),
					placeholder: "Add a skill…"
				}),
				o && a.length >= 2 && /* @__PURE__ */ R("ul", {
					className: "max-h-48 overflow-auto border border-border",
					children: [o.filter((t) => !e.some((e) => e.skill_id === t.id)).map((n) => /* @__PURE__ */ L("li", { children: /* @__PURE__ */ R("button", {
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
							/* @__PURE__ */ L("span", {
								className: "text-xs text-subtle",
								children: n.group
							})
						]
					}) }, n.id)), o.length === 0 && /* @__PURE__ */ L("li", {
						className: "px-3 py-1.5 text-sm text-subtle",
						children: "No skill matches"
					})]
				})
			]
		})
	});
}
function Ye({ doctrine: e, onClose: t }) {
	let r = ne(), i = N(), a = j({
		queryKey: ["doctrines", "all-fits"],
		queryFn: () => w.get(`${q}/fits`)
	}), [c, d] = F({
		name: e?.name ?? "",
		description: e?.description ?? "",
		order: e?.order ?? 0,
		active: e?.active ?? !0,
		icon_type_id: e?.icon_type_id ?? null
	}), [f, p] = F(e?.fits.map((e) => e.id) ?? []), [m, g] = F(!1), _ = new Map((a.data ?? []).map((e) => [e.id, e])), v = [...new Map(f.map((e) => _.get(e)).filter(Boolean).map((e) => [e.ship.id, e.ship])).values()], y = A({
		mutationFn: () => {
			let t = {
				...c,
				fits: f
			};
			return e ? w.put(`${q}/doctrines/${e.id}`, t) : w.post(`${q}/doctrines`, t);
		},
		onSuccess: (e) => {
			r.invalidateQueries({ queryKey: ["doctrines"] }), k.success(`${e.name} saved`), t(), i(`/p/doctrines/${e.id}`);
		},
		onError: (e) => k.error(e.message)
	}), x = (e, t) => {
		let n = [...f], [r] = n.splice(e, 1);
		n.splice(e + t, 0, r), p(n);
	};
	return /* @__PURE__ */ R(s, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: e ? `Edit ${e.name}` : "New doctrine",
		size: "lg",
		footer: /* @__PURE__ */ R(I, { children: [
			e && /* @__PURE__ */ R(n, {
				variant: "danger",
				className: "mr-auto",
				onClick: () => g(!0),
				children: [/* @__PURE__ */ L(H, {}), " Delete"]
			}),
			/* @__PURE__ */ L(n, {
				variant: "ghost",
				onClick: t,
				children: "Cancel"
			}),
			/* @__PURE__ */ L(n, {
				variant: "primary",
				disabled: !c.name.trim(),
				loading: y.isPending,
				onClick: () => y.mutate(),
				children: "Save"
			})
		] }),
		children: [/* @__PURE__ */ R("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ R("div", {
					className: "grid gap-4 sm:grid-cols-[1fr_120px]",
					children: [/* @__PURE__ */ L(l, {
						label: "Name",
						required: !0,
						children: /* @__PURE__ */ L(u, {
							value: c.name,
							onChange: (e) => d({
								...c,
								name: e.target.value
							}),
							placeholder: "Rifter Gang",
							autoFocus: !0,
							maxLength: 100
						})
					}), /* @__PURE__ */ L(l, {
						label: "Order",
						hint: "Lower first",
						children: /* @__PURE__ */ L(u, {
							type: "number",
							value: c.order,
							onChange: (e) => d({
								...c,
								order: Number(e.target.value) || 0
							})
						})
					})]
				}),
				/* @__PURE__ */ L(l, {
					label: "Description",
					children: /* @__PURE__ */ L(b, {
						rows: 3,
						value: c.description,
						onChange: (e) => d({
							...c,
							description: e.target.value
						}),
						placeholder: "When we fly it, comms, staging…"
					})
				}),
				v.length > 0 && /* @__PURE__ */ L(l, {
					label: "Picture",
					children: /* @__PURE__ */ R(h, {
						value: String(c.icon_type_id ?? ""),
						onChange: (e) => d({
							...c,
							icon_type_id: e.target.value ? Number(e.target.value) : null
						}),
						children: [/* @__PURE__ */ L("option", {
							value: "",
							children: "The first fit's ship"
						}), v.map((e) => /* @__PURE__ */ L("option", {
							value: e.id,
							children: e.name
						}, e.id))]
					})
				}),
				/* @__PURE__ */ L(ee, {
					label: "Active",
					description: "Retired doctrines stay for reference, listed last.",
					checked: c.active,
					onCheckedChange: (e) => d({
						...c,
						active: e
					})
				}),
				/* @__PURE__ */ L(l, {
					label: "Fits",
					hint: "In the order they're shown. New fits are added from the fit editor too.",
					children: /* @__PURE__ */ R("div", {
						className: "space-y-1",
						children: [f.map((e, t) => {
							let r = _.get(e);
							return /* @__PURE__ */ R("div", {
								className: "flex items-center gap-2 border border-border px-2 py-1.5",
								children: [
									r && /* @__PURE__ */ L("img", {
										src: r.ship.icon,
										alt: "",
										className: "size-6"
									}),
									/* @__PURE__ */ L("span", {
										className: "min-w-0 flex-1 truncate text-sm",
										children: r ? `${r.name} (${r.ship.name})` : `Fit ${e}`
									}),
									r && /* @__PURE__ */ L(K, { role: r.role }),
									/* @__PURE__ */ L(n, {
										size: "icon-sm",
										variant: "ghost",
										disabled: t === 0,
										onClick: () => x(t, -1),
										"aria-label": "Move up",
										children: /* @__PURE__ */ L(me, {})
									}),
									/* @__PURE__ */ L(n, {
										size: "icon-sm",
										variant: "ghost",
										disabled: t === f.length - 1,
										onClick: () => x(t, 1),
										"aria-label": "Move down",
										children: /* @__PURE__ */ L(he, {})
									}),
									/* @__PURE__ */ L(n, {
										size: "icon-sm",
										variant: "ghost",
										onClick: () => p(f.filter((t) => t !== e)),
										"aria-label": "Remove",
										children: /* @__PURE__ */ L(H, {})
									})
								]
							}, e);
						}), /* @__PURE__ */ R(h, {
							value: "",
							onChange: (e) => e.target.value && p([...f, Number(e.target.value)]),
							children: [/* @__PURE__ */ L("option", {
								value: "",
								children: "Add an existing fit…"
							}), (a.data ?? []).filter((e) => !f.includes(e.id)).map((e) => /* @__PURE__ */ R("option", {
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
		}), e && /* @__PURE__ */ L(o, {
			open: m,
			onOpenChange: g,
			title: `Delete ${e.name}?`,
			description: "Its fits stay, so you can put them in another doctrine.",
			confirmLabel: "Delete doctrine",
			danger: !0,
			onConfirm: async () => {
				try {
					await w.delete(`/api/p/doctrines/doctrines/${e.id}`);
				} catch (e) {
					throw k.error(e.message), e;
				}
				r.invalidateQueries({ queryKey: ["doctrines"] }), t(), i("/p/doctrines");
			}
		})]
	});
}
function Xe() {
	let e = N(), [r, a] = F(""), { data: o, isLoading: s } = j({
		queryKey: ["doctrines", "all-fits"],
		queryFn: () => w.get(`${q}/fits`)
	}), l = (o ?? []).filter((e) => `${e.name} ${e.ship.name} ${e.role}`.toLowerCase().includes(r.trim().toLowerCase()));
	return /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(f, {
		eyebrow: /* @__PURE__ */ L(M, {
			to: "/p/doctrines",
			className: "hover:text-text",
			children: "Doctrines"
		}),
		title: "All fits",
		icon: /* @__PURE__ */ L(B, {}),
		actions: /* @__PURE__ */ L(M, {
			to: "/p/doctrines/fit/new",
			children: /* @__PURE__ */ R(n, {
				variant: "primary",
				children: [/* @__PURE__ */ L(V, {}), " New fit"]
			})
		})
	}), /* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L("div", {
		className: "p-card pb-0",
		children: /* @__PURE__ */ L(p, {
			value: r,
			onChange: (e) => a(e.target.value),
			placeholder: "Fit, ship or role",
			className: "w-64"
		})
	}), s ? /* @__PURE__ */ L(g, { className: "m-card h-40" }) : l.length === 0 ? /* @__PURE__ */ L(c, {
		icon: /* @__PURE__ */ L(B, {}),
		title: r ? "No fit matches" : "No fits yet"
	}) : /* @__PURE__ */ R(v, { children: [/* @__PURE__ */ L(_, { children: /* @__PURE__ */ R("tr", { children: [
		/* @__PURE__ */ L(x, { children: "Fit" }),
		/* @__PURE__ */ L(x, { children: "Ship" }),
		/* @__PURE__ */ L(x, { children: "Doctrines" })
	] }) }), /* @__PURE__ */ L("tbody", { children: l.map((n) => /* @__PURE__ */ R(C, {
		interactive: !0,
		onClick: () => e(`/p/doctrines/fit/${n.id}`),
		children: [
			/* @__PURE__ */ L(y, { children: /* @__PURE__ */ R("span", {
				className: "flex items-center gap-2 font-medium",
				children: [
					n.name,
					" ",
					/* @__PURE__ */ L(K, { role: n.role })
				]
			}) }),
			/* @__PURE__ */ L(y, { children: /* @__PURE__ */ R("span", {
				className: "flex items-center gap-2 text-sm",
				children: [/* @__PURE__ */ L("img", {
					src: n.ship.icon,
					alt: "",
					className: "size-6"
				}), n.ship.name]
			}) }),
			/* @__PURE__ */ L(y, { children: n.doctrines.length ? /* @__PURE__ */ L("span", {
				className: "flex flex-wrap gap-1",
				children: n.doctrines.map((e) => /* @__PURE__ */ L(t, {
					size: "xs",
					children: e
				}, e))
			}) : /* @__PURE__ */ L("span", {
				className: "text-sm text-subtle",
				children: "None"
			}) })
		]
	}, n.id)) })] })] })] });
}
//#endregion
//#region src/doctrine.tsx
function Ze() {
	let { id: e } = P(), { data: t, isLoading: r, error: a } = j({
		queryKey: [
			"doctrines",
			"doctrine",
			e
		],
		queryFn: () => w.get(`${q}/doctrines/${e}`)
	}), o = xe(), [s, l] = F(!1);
	if (a) return /* @__PURE__ */ L(c, {
		icon: /* @__PURE__ */ L(B, {}),
		title: "No such doctrine",
		action: /* @__PURE__ */ L(M, {
			to: "/p/doctrines",
			children: /* @__PURE__ */ L(n, {
				variant: "secondary",
				children: "All doctrines"
			})
		})
	});
	if (r || !t) return /* @__PURE__ */ L(g, { className: "h-64" });
	let u = /* @__PURE__ */ new Map();
	for (let e of t.fits) {
		let t = e.role || "Fits";
		u.set(t, [...u.get(t) ?? [], e]);
	}
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(f, {
			eyebrow: /* @__PURE__ */ L(M, {
				to: "/p/doctrines",
				className: "hover:text-text",
				children: "Doctrines"
			}),
			title: t.name,
			icon: /* @__PURE__ */ L(B, {}),
			description: t.description || void 0,
			actions: /* @__PURE__ */ R("div", {
				className: "flex flex-wrap gap-2",
				children: [o.data?.can_see_readiness && /* @__PURE__ */ L(M, {
					to: `/p/doctrines/${t.id}/readiness`,
					children: /* @__PURE__ */ R(n, {
						variant: "ghost",
						children: [/* @__PURE__ */ L(U, {}), " Who can fly it"]
					})
				}), t.can_manage && /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(M, {
					to: `/p/doctrines/fit/new?doctrine=${t.id}`,
					children: /* @__PURE__ */ R(n, {
						variant: "secondary",
						children: [/* @__PURE__ */ L(V, {}), " Add fit"]
					})
				}), /* @__PURE__ */ R(n, {
					variant: "ghost",
					onClick: () => l(!0),
					children: [/* @__PURE__ */ L(le, {}), " Edit"]
				})] })]
			})
		}),
		t.render && /* @__PURE__ */ R("div", {
			className: "relative mb-6 h-40 overflow-hidden border border-border bg-surface-2 sm:h-56",
			children: [
				/* @__PURE__ */ L("img", {
					src: t.render,
					alt: "",
					className: "absolute inset-0 size-full object-cover"
				}),
				/* @__PURE__ */ L("div", { className: "absolute inset-0 bg-gradient-to-r from-surface/90 via-surface/20 to-transparent" }),
				/* @__PURE__ */ R("div", {
					className: "absolute bottom-4 left-5 text-sm text-muted",
					children: [
						t.fits.length,
						" fit",
						t.fits.length === 1 ? "" : "s"
					]
				})
			]
		}),
		t.fits.length === 0 ? /* @__PURE__ */ L(i, { children: /* @__PURE__ */ L(c, {
			icon: /* @__PURE__ */ L(B, {}),
			title: "No fits in this doctrine yet",
			description: t.can_manage ? "Add one by pasting it from the game." : void 0
		}) }) : /* @__PURE__ */ L("div", {
			className: "space-y-6",
			children: [...u.entries()].map(([e, t]) => /* @__PURE__ */ R("section", { children: [/* @__PURE__ */ L("h2", {
				className: "mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle",
				children: e
			}), /* @__PURE__ */ L("div", {
				className: "grid gap-3 md:grid-cols-2",
				children: t.map((e) => /* @__PURE__ */ L(Qe, { fit: e }, e.id))
			})] }, e))
		}),
		s && /* @__PURE__ */ L(Ye, {
			doctrine: t,
			onClose: () => l(!1)
		})
	] });
}
function Qe({ fit: t }) {
	return /* @__PURE__ */ L(M, {
		to: `/p/doctrines/fit/${t.id}`,
		className: "block",
		children: /* @__PURE__ */ R(i, {
			interactive: !0,
			className: "flex h-full items-center gap-4 p-card",
			children: [/* @__PURE__ */ L("img", {
				src: t.ship.render,
				alt: "",
				className: "size-20 shrink-0 rounded-full bg-surface-2 object-cover ring-1 ring-border",
				loading: "lazy"
			}), /* @__PURE__ */ R("div", {
				className: "min-w-0 flex-1 space-y-1.5",
				children: [
					/* @__PURE__ */ R("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ L("span", {
							className: "truncate font-medium",
							children: t.name
						}), /* @__PURE__ */ L(K, { role: t.role })]
					}),
					/* @__PURE__ */ R("div", {
						className: "text-xs text-muted",
						children: [
							t.ship.name,
							" · ",
							t.ship.group,
							" · ",
							D(t.value)
						]
					}),
					/* @__PURE__ */ R("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ L(G, { status: t.best }), /* @__PURE__ */ L("span", {
							className: "flex -space-x-1",
							children: t.characters.map((t) => /* @__PURE__ */ L(S, {
								content: `${t.character.name}: ${{
									ready: "ready",
									can_fly: "can fly",
									missing: `${t.missing} skills missing`,
									unknown: "skills not synced"
								}[t.status]}`,
								children: /* @__PURE__ */ L("span", {
									className: t.status === "ready" || t.status === "can_fly" ? "" : "opacity-40 grayscale",
									children: /* @__PURE__ */ L(e, {
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
function $e() {
	let { id: e } = P(), { data: t, isLoading: i, error: a } = j({
		queryKey: [
			"doctrines",
			"fit",
			e
		],
		queryFn: () => w.get(`${q}/fits/${e}`)
	}), [l, u] = F(!1), [d, p] = F(!1), [m, h] = F(!1), ee = N(), _ = ne();
	if (a) return /* @__PURE__ */ L(c, {
		icon: /* @__PURE__ */ L(B, {}),
		title: "No such fit",
		action: /* @__PURE__ */ L(M, {
			to: "/p/doctrines",
			children: /* @__PURE__ */ L(n, {
				variant: "secondary",
				children: "All doctrines"
			})
		})
	});
	if (i || !t) return /* @__PURE__ */ L(g, { className: "h-96" });
	let v = t.doctrines[0];
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(f, {
			eyebrow: /* @__PURE__ */ R("span", {
				className: "flex flex-wrap gap-1",
				children: [/* @__PURE__ */ L(M, {
					to: "/p/doctrines",
					className: "hover:text-text",
					children: "Doctrines"
				}), v && /* @__PURE__ */ R(I, { children: ["/ ", /* @__PURE__ */ L(M, {
					to: `/p/doctrines/${v.id}`,
					className: "hover:text-text",
					children: v.name
				})] })]
			}),
			title: /* @__PURE__ */ R("span", {
				className: "flex flex-wrap items-center gap-3",
				children: [
					t.name,
					" ",
					/* @__PURE__ */ L(K, { role: t.role })
				]
			}),
			icon: /* @__PURE__ */ L("img", {
				src: t.ship.icon,
				alt: "",
				className: "size-8"
			}),
			description: `${t.ship.name} · ${t.ship.group}`,
			actions: /* @__PURE__ */ R("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ R(n, {
						variant: "primary",
						onClick: () => ve(t.eft, "Copied. In the game: Fitting window → Import from clipboard"),
						children: [/* @__PURE__ */ L(se, {}), " Copy to paste in game"]
					}),
					/* @__PURE__ */ R(n, {
						variant: "secondary",
						onClick: () => p(!0),
						children: [/* @__PURE__ */ L(_e, {}), " Save to my fittings in EVE"]
					}),
					/* @__PURE__ */ L(n, {
						variant: "ghost",
						onClick: () => u(!0),
						children: "Show as text"
					}),
					t.can_manage && /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(M, {
						to: `/p/doctrines/fit/${t.id}/edit`,
						children: /* @__PURE__ */ R(n, {
							variant: "ghost",
							children: [/* @__PURE__ */ L(le, {}), " Edit"]
						})
					}), /* @__PURE__ */ L(n, {
						variant: "ghost",
						onClick: () => h(!0),
						"aria-label": "Delete fit",
						children: /* @__PURE__ */ L(H, {})
					})] })
				]
			})
		}),
		/* @__PURE__ */ R("div", {
			className: "space-y-6",
			children: [
				t.notes && /* @__PURE__ */ L(r, {
					tone: "info",
					title: "Notes from the FCs",
					children: /* @__PURE__ */ L("p", {
						className: "whitespace-pre-wrap",
						children: t.notes
					})
				}),
				/* @__PURE__ */ L(Ue, { view: t.view }),
				/* @__PURE__ */ L(tt, { fit: t })
			]
		}),
		l && /* @__PURE__ */ L(s, {
			open: !0,
			onOpenChange: (e) => !e && u(!1),
			title: "The fit as text",
			size: "lg",
			description: "The same text the game copies. In the game, open the Fitting window and press Import from clipboard.",
			footer: /* @__PURE__ */ R(n, {
				variant: "primary",
				onClick: () => ve(t.eft, "Copied"),
				children: [/* @__PURE__ */ L(se, {}), " Copy"]
			}),
			children: /* @__PURE__ */ L(b, {
				readOnly: !0,
				rows: 18,
				value: t.eft,
				className: "font-mono text-xs",
				onFocus: (e) => e.currentTarget.select()
			})
		}),
		d && /* @__PURE__ */ L(et, {
			fit: t,
			onClose: () => p(!1)
		}),
		/* @__PURE__ */ L(o, {
			open: m,
			onOpenChange: h,
			title: `Delete ${t.name}?`,
			description: "It's removed from every doctrine it's in. Group rules that use it stop matching anyone.",
			confirmLabel: "Delete fit",
			danger: !0,
			onConfirm: async () => {
				try {
					await w.delete(`${q}/fits/${t.id}`);
				} catch (e) {
					throw k.error(e.message), e;
				}
				_.invalidateQueries({ queryKey: ["doctrines"] }), k.success(`${t.name} deleted`), ee(v ? `/p/doctrines/${v.id}` : "/p/doctrines");
			}
		})
	] });
}
function et({ fit: e, onClose: t }) {
	let r = e.characters.filter((e) => e.can_save), [i, a] = F(String(r[0]?.id ?? "")), o = A({
		mutationFn: () => w.post(`${q}/fits/${e.id}/save-to-eve`, { character: Number(i) }),
		onSuccess: () => {
			k.success(`Saved to ${r.find((e) => String(e.id) === i)?.name}'s fittings in the game`), t();
		},
		onError: (e) => k.error(e.message)
	});
	return /* @__PURE__ */ R(s, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: "Save to my fittings in EVE",
		size: "md",
		description: "Adds the fit to a character's saved fittings in the game, ready to fit from the Fitting window. Loaded ammunition goes in the cargo.",
		footer: /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(n, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), /* @__PURE__ */ R(n, {
			variant: "primary",
			disabled: !i,
			loading: o.isPending,
			onClick: () => o.mutate(),
			children: [/* @__PURE__ */ L(_e, {}), " Save"]
		})] }),
		children: [r.length ? /* @__PURE__ */ L(l, {
			label: "Character",
			children: /* @__PURE__ */ L(h, {
				value: i,
				onChange: (e) => a(e.target.value),
				children: r.map((e) => /* @__PURE__ */ L("option", {
					value: e.id,
					children: e.name
				}, e.id))
			})
		}) : /* @__PURE__ */ L("p", {
			className: "text-sm text-muted",
			children: "None of your characters allow saving fittings. Log in with them again under Characters → Add character."
		}), r.length > 0 && r.length < e.characters.length && /* @__PURE__ */ R("p", {
			className: "mt-2 text-xs text-subtle",
			children: [e.characters.filter((e) => !e.can_save).map((e) => e.name).join(", "), " can't: log in with them again to allow saving fittings."]
		})]
	});
}
function tt({ fit: r }) {
	let [o, s] = F(null), l = ye(), u = N(), d = r.characters, f = d.find((e) => e.id === o) ?? d[0], p = A({
		mutationFn: (e) => w.post("/api/p/skillplans/plans", {
			name: `${r.name} (${r.ship.name})`,
			description: `Skills for the doctrine fit ${r.name}${f ? `, missing on ${f.name}` : ""}.`,
			skills: e
		}),
		onSuccess: (e) => u(`/p/skillplans/${e.id}`),
		onError: (e) => k.error(e.message)
	}), m = f?.missing_steps ?? [], h = (e) => e.map((e) => `${e.name} ${e.level}`).join("\n");
	return /* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(a, {
		title: "Skills",
		description: "What the ship, modules, ammunition and drones need, with prerequisites, plus what the FCs recommend."
	}), /* @__PURE__ */ R("div", {
		className: "grid gap-0 border-t border-border lg:grid-cols-[280px_minmax(0,1fr)]",
		children: [/* @__PURE__ */ R("div", {
			className: "border-border p-card lg:border-r",
			children: [
				/* @__PURE__ */ L("div", {
					className: "mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle",
					children: "Your characters"
				}),
				d.length === 0 ? /* @__PURE__ */ L("p", {
					className: "text-sm text-muted",
					children: "You have no characters."
				}) : /* @__PURE__ */ L("ul", {
					className: "space-y-1",
					children: d.map((t) => /* @__PURE__ */ L("li", { children: /* @__PURE__ */ R("button", {
						type: "button",
						onClick: () => s(t.id),
						className: `flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-hover ${f?.id === t.id ? "bg-hover-strong" : ""}`,
						children: [/* @__PURE__ */ L(e, {
							src: t.portrait,
							name: t.name,
							size: "sm"
						}), /* @__PURE__ */ R("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ L("span", {
								className: "block truncate text-sm font-medium",
								children: t.name
							}), /* @__PURE__ */ L(G, { status: t })]
						})]
					}) }, t.id))
				}),
				/* @__PURE__ */ R("div", {
					className: "mt-5 space-y-2",
					children: [
						/* @__PURE__ */ L("div", {
							className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle",
							children: "Required"
						}),
						/* @__PURE__ */ L("div", {
							className: "flex flex-wrap gap-1",
							children: r.required.map((e) => /* @__PURE__ */ R(t, {
								size: "xs",
								children: [
									e.name,
									" ",
									e.level
								]
							}, e.skill_id))
						}),
						r.recommended.length > 0 && /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L("div", {
							className: "pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle",
							children: "Recommended"
						}), /* @__PURE__ */ L("div", {
							className: "flex flex-wrap gap-1",
							children: r.recommended.map((e) => /* @__PURE__ */ R(t, {
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
		}), /* @__PURE__ */ L("div", {
			className: "min-w-0",
			children: f ? m.length === 0 ? /* @__PURE__ */ L(c, {
				icon: /* @__PURE__ */ L(B, {}),
				title: f.status === "unknown" ? "Skills not synced yet" : `${f.name} has every skill`,
				description: f.status === "unknown" ? "Once the character sheet syncs this character's skills, this shows what's missing." : "Required and recommended."
			}) : /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ R("div", {
				className: "flex flex-wrap items-center justify-between gap-2 p-card",
				children: [/* @__PURE__ */ R("div", {
					className: "text-sm text-muted",
					children: [
						f.name,
						" needs ",
						/* @__PURE__ */ L("span", {
							className: "text-text",
							children: m.length
						}),
						" more skill level",
						m.length === 1 ? "" : "s",
						":",
						" ",
						/* @__PURE__ */ L("span", {
							className: "font-mono text-text",
							children: W(m.reduce((e, t) => e + t.seconds, 0))
						}),
						" with their attributes."
					]
				}), /* @__PURE__ */ R("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ R(n, {
						size: "sm",
						variant: "secondary",
						onClick: () => ve(h(m), "Copied. In the game: Skills → Skill plans → Import from clipboard, or paste into the skill queue"),
						children: [/* @__PURE__ */ L(se, {}), " Copy skill plan for EVE"]
					}), l && /* @__PURE__ */ R(n, {
						size: "sm",
						variant: "ghost",
						loading: p.isPending,
						onClick: () => p.mutate(m.map((e) => [e.skill_id, e.level])),
						children: [/* @__PURE__ */ L(ge, {}), " Save as skill plan"]
					})]
				})]
			}), /* @__PURE__ */ R(v, { children: [/* @__PURE__ */ L(_, { children: /* @__PURE__ */ R("tr", { children: [
				/* @__PURE__ */ L(x, { children: "Skill" }),
				/* @__PURE__ */ L(x, {
					align: "right",
					children: "Time"
				}),
				/* @__PURE__ */ L(x, { align: "right" })
			] }) }), /* @__PURE__ */ L("tbody", { children: m.map((e) => /* @__PURE__ */ R(C, { children: [
				/* @__PURE__ */ R(y, { children: [
					e.name,
					" ",
					/* @__PURE__ */ L("span", {
						className: "font-mono text-muted",
						children: e.level
					})
				] }),
				/* @__PURE__ */ L(y, {
					numeric: !0,
					children: W(e.seconds)
				}),
				/* @__PURE__ */ L(y, {
					align: "right",
					children: /* @__PURE__ */ R("span", {
						className: "flex justify-end gap-1",
						children: [e.status === "queued" && /* @__PURE__ */ L(t, {
							tone: "info",
							size: "xs",
							children: "In queue"
						}), e.required ? /* @__PURE__ */ L(t, {
							tone: "warning",
							size: "xs",
							children: "Required"
						}) : /* @__PURE__ */ L(t, {
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
function nt() {
	let { id: t } = P(), [r, a] = F(""), [o, s] = F(!1), { data: l, isLoading: u, error: d } = j({
		queryKey: [
			"doctrines",
			"readiness",
			t
		],
		queryFn: () => w.get(`${q}/doctrines/${t}/readiness`)
	});
	if (d) return /* @__PURE__ */ L(c, {
		icon: /* @__PURE__ */ L(U, {}),
		title: d.message
	});
	if (u || !l) return /* @__PURE__ */ L(g, { className: "h-96" });
	let m = l.members.filter((e) => e.name.toLowerCase().includes(r.trim().toLowerCase()) && (!o || e.flyable === 0));
	return /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(f, {
		eyebrow: /* @__PURE__ */ L(M, {
			to: `/p/doctrines/${l.doctrine.id}`,
			className: "hover:text-text",
			children: l.doctrine.name
		}),
		title: "Who can fly it",
		icon: /* @__PURE__ */ L(U, {}),
		description: "Each member's best character for each fit, from their synced skills.",
		actions: /* @__PURE__ */ L("a", {
			href: `${q}/doctrines/${l.doctrine.id}/readiness.csv`,
			children: /* @__PURE__ */ R(n, {
				variant: "ghost",
				children: [/* @__PURE__ */ L(_e, {}), " CSV"]
			})
		})
	}), /* @__PURE__ */ R(i, { children: [/* @__PURE__ */ R("div", {
		className: "flex flex-wrap items-center gap-3 p-card pb-0",
		children: [/* @__PURE__ */ L(p, {
			value: r,
			onChange: (e) => a(e.target.value),
			placeholder: "Member",
			className: "w-56"
		}), /* @__PURE__ */ R("label", {
			className: "flex items-center gap-2 text-sm text-muted",
			children: [/* @__PURE__ */ L("input", {
				type: "checkbox",
				checked: o,
				onChange: (e) => s(e.target.checked)
			}), " Only members who can't fly any"]
		})]
	}), l.fits.length === 0 ? /* @__PURE__ */ L(c, {
		icon: /* @__PURE__ */ L(U, {}),
		title: "This doctrine has no fits yet"
	}) : /* @__PURE__ */ L("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ R(v, { children: [/* @__PURE__ */ L(_, { children: /* @__PURE__ */ R("tr", { children: [/* @__PURE__ */ L(x, { children: "Member" }), l.fits.map((e) => /* @__PURE__ */ R(x, { children: [/* @__PURE__ */ R(M, {
			to: `/p/doctrines/fit/${e.id}`,
			className: "flex items-center gap-2 hover:text-text",
			children: [/* @__PURE__ */ L("img", {
				src: e.ship.icon,
				alt: "",
				className: "size-6"
			}), /* @__PURE__ */ L("span", {
				className: "normal-case tracking-normal",
				children: e.name
			})]
		}), /* @__PURE__ */ R("div", {
			className: "mt-0.5 text-[10px] normal-case tracking-normal text-subtle",
			children: [l.totals[String(e.id)], " can fly"]
		})] }, e.id))] }) }), /* @__PURE__ */ L("tbody", { children: m.map((t) => /* @__PURE__ */ R(C, { children: [/* @__PURE__ */ L(y, { children: /* @__PURE__ */ R("span", {
			className: "flex items-center gap-2 whitespace-nowrap",
			children: [
				/* @__PURE__ */ L(e, {
					src: t.portrait,
					name: t.name,
					size: "xs"
				}),
				" ",
				t.name
			]
		}) }), l.fits.map((e) => {
			let n = t.cells[String(e.id)];
			return /* @__PURE__ */ L(y, { children: /* @__PURE__ */ L(S, {
				content: n ? n.character ?? "Their best character (you can't open their character sheets)" : "No characters",
				disabled: !n,
				children: /* @__PURE__ */ L("span", { children: /* @__PURE__ */ L(G, { status: n }) })
			}) }, e.id);
		})] }, t.id)) })] })
	})] })] });
}
//#endregion
//#region src/index.tsx
function rt() {
	let { data: e, isLoading: t } = j({
		queryKey: ["doctrines", "me"],
		queryFn: () => w.get(`${q}/me`)
	});
	return t ? /* @__PURE__ */ L(g, { className: "h-16" }) : e ? /* @__PURE__ */ L(M, {
		to: "/p/doctrines",
		className: "block",
		children: /* @__PURE__ */ R("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ R("div", { children: [/* @__PURE__ */ L("div", {
				className: "text-xs text-muted",
				children: "Doctrine fits you can fly"
			}), /* @__PURE__ */ R("div", {
				className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
				children: [e.flyable, /* @__PURE__ */ R("span", {
					className: "text-lg text-subtle",
					children: [" / ", e.total]
				})]
			})] }), /* @__PURE__ */ L("div", {
				className: "flex -space-x-1.5",
				children: e.ships.map((e) => /* @__PURE__ */ L("img", {
					src: e.icon,
					alt: e.name,
					title: e.name,
					className: "size-8 rounded-full bg-surface-3 ring-2 ring-surface"
				}, e.id))
			})]
		})
	}) : null;
}
function it({ characterId: e }) {
	let { data: n, isLoading: r } = j({
		queryKey: [
			"doctrines",
			"character",
			e
		],
		queryFn: () => w.get(`${q}/characters/${e}`)
	});
	return r ? /* @__PURE__ */ L(g, { className: "h-40" }) : n?.length ? /* @__PURE__ */ R("div", {
		className: "space-y-6",
		children: [n.map((e) => /* @__PURE__ */ R("section", { children: [e.id === null ? /* @__PURE__ */ L("div", {
			className: "mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle",
			children: e.name
		}) : /* @__PURE__ */ L(M, {
			to: `/p/doctrines/${e.id}`,
			className: "mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle hover:text-text",
			children: e.name
		}), /* @__PURE__ */ L("ul", {
			className: "divide-y divide-border border border-border",
			children: e.fits.map((e) => /* @__PURE__ */ L("li", { children: /* @__PURE__ */ R(M, {
				to: `/p/doctrines/fit/${e.id}`,
				className: "flex items-center gap-3 px-3 py-2 hover:bg-hover",
				children: [
					/* @__PURE__ */ L("img", {
						src: e.ship.icon,
						alt: "",
						className: "size-8"
					}),
					/* @__PURE__ */ R("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ R("span", {
							className: "flex items-center gap-2 text-sm font-medium",
							children: [
								e.name,
								" ",
								/* @__PURE__ */ L(K, { role: e.role })
							]
						}), /* @__PURE__ */ L("span", {
							className: "text-xs text-muted",
							children: e.ship.name
						})]
					}),
					/* @__PURE__ */ L(G, { status: e })
				]
			}) }, e.id))
		})] }, e.id ?? "other")), /* @__PURE__ */ R("p", {
			className: "text-xs text-subtle",
			children: [
				/* @__PURE__ */ L(t, {
					size: "xs",
					children: "Ready"
				}),
				" has the recommended skills too; ",
				/* @__PURE__ */ L(t, {
					size: "xs",
					children: "Can fly"
				}),
				" has what the fit needs."
			]
		})]
	}) : /* @__PURE__ */ L(c, {
		icon: /* @__PURE__ */ L(B, {}),
		title: "No doctrines or fits yet"
	});
}
var at = E({
	routes: [
		{
			path: "",
			Component: Se
		},
		{
			path: "fits",
			Component: Xe
		},
		{
			path: "fit/new",
			Component: Ke
		},
		{
			path: "fit/:id",
			Component: $e
		},
		{
			path: "fit/:id/edit",
			Component: Ke
		},
		{
			path: ":id",
			Component: Ze
		},
		{
			path: ":id/readiness",
			Component: nt
		}
	],
	widgets: [{
		id: "flyable",
		title: "Doctrines",
		Component: rt,
		size: "sm",
		order: 36
	}],
	characterTabs: [{
		id: "doctrines",
		label: "Doctrines",
		Component: it,
		order: 300
	}]
});
//#endregion
export { at as default };

export const classes = ["!data","!name","!o","!parsed","--color-accent","-empty","-glow","-ship","-space-x-1","-space-x-1.5","@conduit/sdk","@tanstack/react-query","a","able","absolute","accent","across","action","actions","active","add","added","again","against","align","all","all-fits","allFits","all_steps","allow","along","alt","ammunition","an","and","angle","another","any","arc","are","aren","aria-label","as","async","at","autoFocus","await","b","band","base","base_total","base_used","bay","bays","be","best","bg-accent-soft","bg-gradient-to-r","bg-gradient-to-t","bg-hover-strong","bg-surface-2","bg-surface-3","block","blocked","body","boolean","border","border-accent","border-border","border-t","bottom","bottom-3","bottom-4","brighter","browser","but","button","by","byId","byRole","bySlot","calibration","can","can_fly","can_manage","can_save","can_see_readiness","card","cargo","case","catch","category","cell","cells","centred","character","characterId","characterTabs","characters","charge","charge_id","charges","chars","checkbox","checked","children","className","clipPath","clipboard","clockwise","colSpan","come","confirmLabel","const","content","copy","copying","count","cpu","csv","current","currentColor","cursor-default","cx","cy","d","danger","data","default","deleted","description","dialog","didn","disabled","divide-border","divide-y","doctrine","doctrine-roles","doctrines","dominantBaseline","done","down","dq","drawn","drone","drones","each","editor","eft","else","empty","enabled","end","error","every","existing","export","extends","eyebrow","f","false","few","fighter","fighters","fill","fill-accent","fill-border-strong","fill-danger","fill-info","fill-muted","fill-none","fill-surface","fill-surface-2","fill-surface-3","first","fit","fit/new","fits","fitted","fitting","fitting_id","fittings","fixed","flex","flex-1","flex-wrap","fly","flyable","font-medium","font-mono","font-semibold","fontSize","footer","for","from","from-surface","from-surface/90","function","g","game","gap-0","gap-1","gap-2","gap-3","gap-4","gap-6","gauges","get","ghost","go","goes","grayscale","grid","group","grouped","groups","h","h-16","h-36","h-40","h-56","h-64","h-96","h-auto","h-full","half","hardpoints","hardpoints_used","has","have","haven","height","here","hi","high","hint","hits","hover:bg-hover","hover:text-text","how","href","i","icon","icon-sm","icon_type_id","icons","id","if","img","import","in","in-game","info","ingame","inline","inset-0","inside","interactive","interface","into","is","isActive","isLoading","isn","it","item","items","items-center","items-end","its","just","justify-between","justify-end","keep","key","kind","known","label","last","launcher","launchers","layout","lazy","left","left-4","left-5","length","let","letterSpacing","level","levels","lg","lg:border-r","lg:grid-cols-[280px_minmax(0,1fr)]","lg:grid-cols-[minmax(0,1fr)_300px]","like","line-clamp-2","list","list-disc","listed","little","ll","loaded","loading","log","low","lower","m","m-card","m18","m6","many","matches","matching","max-h-48","max-w-[520px]","maxLength","mb-1.5","mb-2","mb-3","mb-6","md","md:grid-cols-2","me","med","member","members","mid","middle","min-h-10","min-w-0","missing","missing_steps","module","modules","more","move","mr-auto","ms","mt-0.5","mt-1","mt-2","mt-5","mt-8","mutationFn","mx-auto","my","my-fittings","n","name","navigate","needs","neutral","never","new","next","no","nobody","none","normal-case","not","notes","null","number","object-cover","of","offline","offset","on","onBlur","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onFocus","onMouseEnter","onMouseLeave","onOpenChange","onSuccess","one","ones","opacity","opacity-40","opacity-50","opacity-60","opacity-90","open","options","or","order","other","outline-none","outside","overflow-auto","overflow-hidden","overflow-x-auto","overview","own","p","p-card","parse","parsed","paste","pasting","path","pathId","pb-0","per","pilots","pl-4","place","placeholder","plain","plan","planText","plans","plugin","plus","point","points","portrait","position","post","power","powergrid","preserveAspectRatio","press","preview","primary","problems","pt-2","put","px-2","px-2.5","px-3","py-1","py-1.5","py-2","q","qc","quantity","queryFn","queryKey","queue","queued","r","rack","racks","re","react","react-router","readOnly","readiness","reads","ready","recognised","recommended","relative","removed","render","required","required_steps","resource","resources","rest","retry","return","reverse","rig","right","right-4","rigs","ring","ring-1","ring-2","ring-border","ring-surface","role","roles","room","round","rounded-full","routes","rows","rules","run","rx","ry","s","same","save","savePlan","saved","saving","secondary","seconds","sections","see","select","select-none","service","services","setActive","setCharacter","setCreating","setDeleting","setDoctrines","setEditing","setEft","setFits","setForm","setMode","setName","setNotes","setOnlyMissing","setQ","setRecommended","setRole","setSaving","setSelected","setShowEft","setSkills","setV","share","sheet","ship","ship_type_id","ships","show","shown","shows","shrink-0","side","sit","site","size","size-16","size-20","size-3","size-3.5","size-4","size-6","size-7","size-8","size-full","skill","skillPlans","skill_id","skillplans","skills","slice","slot","slots","sm","sm:grid-cols-2","sm:grid-cols-[1fr_120px]","sm:h-56","so","sp","space-y-1","space-y-1.5","space-y-2","space-y-3","space-y-4","space-y-6","spellCheck","squeezed","src","start","startOffset","static","status","stay","step","steps","still","stop","stopColor","stopOpacity","string","stroke","stroke-accent","stroke-border","stroke-border-strong","stroke-danger","stroke-info","stroke-surface-2","stroke-warning","strokeDasharray","strokeLinecap","strokeLinejoin","strokeWidth","structures","style","sub","subsystems","success","such","switch","switched","synced","syncs","t","tab","tabIndex","tabular-nums","take","text","text-3xl","text-[10px]","text-[11px]","text-accent-ink","text-center","text-left","text-lg","text-muted","text-sm","text-subtle","text-text","text-warning-fg","text-xs","textAnchor","than","that","the","their","them","theme","they","this","throw","time","title","to","to-transparent","tone","too","top","total","totals","tracking-[0.12em]","tracking-[0.14em]","tracking-[0.1em]","tracking-normal","train","transform","true","truncate","try","turret","turrets","type","type_id","undefined","under","unit","unknown","until","up","updated_at","upper","uppercase","usable","use","useBootstrap","useDebounced","useOverview","useParams","useQuery","useQueryClient","useSearchParams","useSkillPlans","useState","used","v","value","valueText","variant","via-surface/20","via-surface/30","view","viewBox","void","w-20","w-56","w-64","w-full","warning","way","we","what","whatever","when","where","whether","which","whitespace-nowrap","whitespace-pre-wrap","who","widgets","width","window","with","without","works","x","x1","x2","xMidYMid","xl:grid-cols-3","xl:grid-cols-[420px_minmax(0,1fr)]","xs","y","y1","y2","yet","you","your","yourself"];
