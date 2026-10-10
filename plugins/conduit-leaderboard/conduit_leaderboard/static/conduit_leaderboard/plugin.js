import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, Dialog as c, EmptyState as l, Field as u, Input as d, PageHeader as f, Select as p, Skeleton as m, StatCard as h, Switch as g, SwitchRow as _, THead as v, TabPanel as y, Table as b, Tabs as x, Td as S, Th as C, Tooltip as w, Tr as T, api as E, cn as D, definePlugin as ee, isk as te, num as ne, sp as re, toast as O, useCurrentUser as k, useHasPerm as A } from "@conduit/sdk";
import { useMutation as j, useQuery as M, useQueryClient as N } from "@tanstack/react-query";
import { Fragment as ie, useState as P } from "react";
import { Link as F, useParams as ae, useSearchParams as oe } from "react-router";
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
		/* @__PURE__ */ L("path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }),
		/* @__PURE__ */ L("path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }),
		/* @__PURE__ */ L("path", { d: "M4 22h16" }),
		/* @__PURE__ */ L("path", { d: "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" }),
		/* @__PURE__ */ L("path", { d: "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" }),
		/* @__PURE__ */ L("path", { d: "M18 2H6v7a6 6 0 0 0 12 0V2Z" })
	]
}), V = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" }),
		/* @__PURE__ */ L("path", { d: "M11 12 5.12 2.2" }),
		/* @__PURE__ */ L("path", { d: "m13 12 5.88-9.8" }),
		/* @__PURE__ */ L("path", { d: "M8 7h8" }),
		/* @__PURE__ */ L("circle", {
			cx: "12",
			cy: "17",
			r: "5"
		}),
		/* @__PURE__ */ L("path", { d: "M12 18v-2h-.5" })
	]
}), se = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M20 7h-9" }),
		/* @__PURE__ */ L("path", { d: "M14 17H5" }),
		/* @__PURE__ */ L("circle", {
			cx: "17",
			cy: "17",
			r: "3"
		}),
		/* @__PURE__ */ L("circle", {
			cx: "7",
			cy: "7",
			r: "3"
		})
	]
}), H = ({ open: e, className: t = "size-4" }) => /* @__PURE__ */ L(z, {
	className: `${t} transition-transform ${e ? "rotate-90" : ""}`,
	children: /* @__PURE__ */ L("path", { d: "m9 18 6-6-6-6" })
}), U = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ L("path", { d: "M19 12H5" })]
}), ce = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }), /* @__PURE__ */ L("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), le = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" }),
		/* @__PURE__ */ L("path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242" }),
		/* @__PURE__ */ L("path", { d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" }),
		/* @__PURE__ */ L("path", { d: "m2 2 20 20" })
	]
}), ue = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}),
		/* @__PURE__ */ L("path", { d: "M22 12h-4" }),
		/* @__PURE__ */ L("path", { d: "M6 12H2" }),
		/* @__PURE__ */ L("path", { d: "M12 6V2" }),
		/* @__PURE__ */ L("path", { d: "M12 22v-4" })
	]
}), de = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" })
}), fe = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" }),
		/* @__PURE__ */ L("path", { d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" }),
		/* @__PURE__ */ L("path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" }),
		/* @__PURE__ */ L("path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" })
	]
}), pe = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M14.531 12.469 6.619 20.38a1 1 0 1 1-3-3l7.912-7.912" }),
		/* @__PURE__ */ L("path", { d: "M15.686 4.314A12.5 12.5 0 0 0 5.461 2.958 1 1 0 0 0 5.58 4.71a22 22 0 0 1 6.318 3.393" }),
		/* @__PURE__ */ L("path", { d: "M17.7 3.7a1 1 0 0 0-1.4 0l-4.6 4.6a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4z" }),
		/* @__PURE__ */ L("path", { d: "M19.686 8.314a12.5 12.5 0 0 1 1.356 10.225 1 1 0 0 1-1.751-.119 22 22 0 0 0-3.393-6.319" })
	]
}), me = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("circle", {
			cx: "8",
			cy: "8",
			r: "6"
		}),
		/* @__PURE__ */ L("path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18" }),
		/* @__PURE__ */ L("path", { d: "M7 6h1v4" }),
		/* @__PURE__ */ L("path", { d: "m16.71 13.88.7.71-2.82 2.82" })
	]
}), he = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" }),
		/* @__PURE__ */ L("path", { d: "M17 18h1" }),
		/* @__PURE__ */ L("path", { d: "M12 18h1" }),
		/* @__PURE__ */ L("path", { d: "M7 18h1" })
	]
}), ge = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" }),
		/* @__PURE__ */ L("path", { d: "M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" }),
		/* @__PURE__ */ L("path", { d: "M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" }),
		/* @__PURE__ */ L("path", { d: "M12 5v13" })
	]
}), _e = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "m12.5 17-.5-1-.5 1h1z" }),
		/* @__PURE__ */ L("path", { d: "M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z" }),
		/* @__PURE__ */ L("circle", {
			cx: "15",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ L("circle", {
			cx: "9",
			cy: "12",
			r: "1"
		})
	]
}), ve = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
		/* @__PURE__ */ L("path", { d: "M16 3.128a4 4 0 0 1 0 7.744" }),
		/* @__PURE__ */ L("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
		/* @__PURE__ */ L("circle", {
			cx: "9",
			cy: "7",
			r: "4"
		})
	]
});
function W({ category: e, className: t }) {
	let n = {
		kills: ue,
		isk_destroyed: de,
		fats: fe,
		mining: pe,
		bounties: me,
		industry: he,
		skillpoints: ge,
		losses: _e
	}[e] ?? B;
	return /* @__PURE__ */ L(n, { className: t });
}
//#endregion
//#region src/index.tsx
var G = "/api/p/leaderboard";
function K(e, t, n = !1) {
	return t === "isk" ? te(e, { full: n }) : t === "sp" ? re(e) : ne(e);
}
function ye(e, t) {
	return e.extra_label ? `${K(t, e.extra_unit)} ${e.extra_label}` : "";
}
function q(e) {
	let t = [
		"th",
		"st",
		"nd",
		"rd"
	], n = e % 100;
	return `${e}${t[(n - 20) % 10] || t[n] || t[0]}`;
}
var J = {
	1: "#d9a21b",
	2: "#a3a9b4",
	3: "#b87333"
}, be = {
	1: "Gold",
	2: "Silver",
	3: "Bronze"
};
function Y({ rank: e, className: t }) {
	return e <= 3 ? /* @__PURE__ */ L("span", {
		className: D("inline-grid size-7 place-items-center", t),
		style: { color: J[e] },
		title: `${be[e]} · ${q(e)}`,
		children: /* @__PURE__ */ L(V, { className: "size-5" })
	}) : /* @__PURE__ */ L("span", {
		className: D("inline-grid size-7 place-items-center font-mono text-sm tabular-nums text-muted", t),
		children: e
	});
}
function X({ counts: e, size: t = "md" }) {
	let n = [
		[1, e.gold],
		[2, e.silver],
		[3, e.bronze]
	];
	return /* @__PURE__ */ L("span", {
		className: D("inline-flex items-center gap-2.5 font-mono tabular-nums", t === "sm" ? "text-xs" : "text-sm"),
		children: n.map(([e, n]) => /* @__PURE__ */ R("span", {
			className: D("inline-flex items-center gap-1", n === 0 && "text-subtle"),
			title: `${n} ${be[e].toLowerCase()}`,
			children: [/* @__PURE__ */ L("span", {
				style: { color: n ? J[e] : void 0 },
				children: /* @__PURE__ */ L(V, { className: t === "sm" ? "size-3.5" : "size-4" })
			}), n]
		}, e))
	});
}
function Z() {
	return M({
		queryKey: ["leaderboard", "periods"],
		queryFn: () => E.get(`${G}/periods`),
		staleTime: 6e4
	});
}
function Q() {
	let [e, t] = oe(), { data: n } = Z(), r = e.get("period") || n?.current || "", i = e.get("corporation") || "";
	return {
		period: r,
		corporation: i,
		set: (n) => {
			let r = new URLSearchParams(e);
			for (let [e, t] of Object.entries(n)) t ? r.set(e, t) : r.delete(e);
			t(r, { replace: !0 });
		},
		query: `period=${encodeURIComponent(r)}${i ? `&corporation=${i}` : ""}`,
		ready: !!r
	};
}
function xe() {
	let { data: e } = Z(), { period: t, corporation: n, set: r } = Q();
	return /* @__PURE__ */ R("div", {
		className: "flex flex-wrap items-center gap-2",
		children: [/* @__PURE__ */ L(p, {
			value: t,
			onChange: (e) => r({ period: e.target.value }),
			"aria-label": "Period",
			className: "w-44",
			options: (e?.periods ?? [{
				key: t,
				label: t
			}]).map((t) => ({
				value: t.key,
				label: t.key === e?.current ? `${t.label} · so far` : t.label
			}))
		}), (e?.corporations.length ?? 0) > 1 && /* @__PURE__ */ L(p, {
			value: n,
			onChange: (e) => r({ corporation: e.target.value }),
			"aria-label": "Corporation",
			className: "w-52",
			options: [{
				value: "",
				label: "Every corporation"
			}, ...(e?.corporations ?? []).map((e) => ({
				value: String(e.id),
				label: `${e.name} [${e.ticker}]`
			}))]
		})]
	});
}
function Se() {
	let e = N();
	return j({
		mutationFn: (e) => E.put(`${G}/me/hidden`, { hidden: e }),
		onSuccess: (t) => {
			e.invalidateQueries({ queryKey: ["leaderboard"] }), O.success(t.hidden ? "You're off the boards. Only you can see your own figures now." : "You're back on the boards");
		},
		onError: (e) => O.error(e.message)
	});
}
function $({ hidden: t }) {
	let n = Se();
	return t ? /* @__PURE__ */ L(e, {
		tone: "info",
		icon: /* @__PURE__ */ L(le, {}),
		title: "You're hidden from the leaderboard",
		action: /* @__PURE__ */ R(r, {
			size: "sm",
			variant: "ghost",
			loading: n.isPending,
			onClick: () => n.mutate(!1),
			children: [/* @__PURE__ */ L(ce, {}), " Show me"]
		}),
		children: "Other members don't see you on any board. Your own figures still show here, just for you."
	}) : null;
}
function Ce({ entries: e, category: n }) {
	if (e.length === 0) return /* @__PURE__ */ L("p", {
		className: "py-6 text-center text-sm text-muted",
		children: "Nobody on the board yet."
	});
	let [r, ...i] = e;
	return /* @__PURE__ */ R("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ R("div", {
			className: "flex items-center gap-3 rounded-lg border border-border bg-bg/40 p-3",
			children: [
				/* @__PURE__ */ R("div", {
					className: "relative shrink-0",
					children: [/* @__PURE__ */ L(t, {
						src: r.portrait,
						name: r.name,
						size: "lg"
					}), /* @__PURE__ */ L("span", {
						className: "absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-surface shadow-e1",
						style: { color: J[1] },
						children: /* @__PURE__ */ L(V, { className: "size-4" })
					})]
				}),
				/* @__PURE__ */ R("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ L("div", {
						className: "truncate font-medium",
						children: r.name
					}), /* @__PURE__ */ R("div", {
						className: "truncate text-xs text-subtle",
						children: [
							r.corporation ? `[${r.corporation.ticker}]` : "",
							" ",
							ye(n, r.extra)
						]
					})]
				}),
				/* @__PURE__ */ L("div", {
					className: "shrink-0 text-right font-mono text-lg font-semibold tabular-nums",
					children: K(r.score, n.unit)
				})
			]
		}), i.map((e) => /* @__PURE__ */ R("div", {
			className: "flex items-center gap-3 px-1",
			children: [
				/* @__PURE__ */ L(Y, { rank: e.rank }),
				/* @__PURE__ */ L(t, {
					src: e.portrait,
					name: e.name,
					size: "sm"
				}),
				/* @__PURE__ */ L("div", {
					className: "min-w-0 flex-1 truncate text-sm",
					children: e.name
				}),
				/* @__PURE__ */ L("div", {
					className: "shrink-0 font-mono text-sm tabular-nums text-muted",
					children: K(e.score, n.unit)
				})
			]
		}, e.user_id))]
	});
}
function we() {
	let e = A("leaderboard.manage_leaderboard"), { query: t, ready: n } = Q(), [s, c] = P(!1), u = Se(), { data: d, isLoading: p } = M({
		queryKey: [
			"leaderboard",
			"overview",
			t
		],
		queryFn: () => E.get(`${G}/overview?${t}`),
		enabled: n
	}), { data: h } = M({
		queryKey: ["leaderboard", "me"],
		queryFn: () => E.get(`${G}/me`)
	});
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(f, {
			eyebrow: "Leaderboard",
			title: "Who's on top",
			icon: /* @__PURE__ */ L(B, {}),
			description: "Members ranked by what their characters did. Alts count for their main.",
			actions: /* @__PURE__ */ R("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ L(xe, {}),
					/* @__PURE__ */ L(F, {
						to: "/p/leaderboard/medals",
						children: /* @__PURE__ */ R(r, {
							variant: "ghost",
							children: [/* @__PURE__ */ L(V, {}), " Medals"]
						})
					}),
					d && !d.hidden && /* @__PURE__ */ L(w, {
						content: "Take yourself off every board. You can come back any time.",
						children: /* @__PURE__ */ L(r, {
							variant: "ghost",
							loading: u.isPending,
							onClick: () => u.mutate(!0),
							"aria-label": "Hide me from the leaderboard",
							children: /* @__PURE__ */ L(le, {})
						})
					}),
					e && /* @__PURE__ */ R(r, {
						onClick: () => c(!0),
						children: [/* @__PURE__ */ L(se, {}), " Settings"]
					})
				]
			})
		}),
		p || !d ? /* @__PURE__ */ L("div", {
			className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
			children: [
				0,
				1,
				2,
				3,
				4,
				5
			].map((e) => /* @__PURE__ */ L(m, { className: "h-64" }, e))
		}) : /* @__PURE__ */ R("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ L($, { hidden: d.hidden }),
				h && h.medals.gold + h.medals.silver + h.medals.bronze > 0 && /* @__PURE__ */ R("div", {
					className: "flex items-center gap-3 text-sm text-muted",
					children: [/* @__PURE__ */ L("span", { children: "Your medals" }), /* @__PURE__ */ L(X, { counts: h.medals })]
				}),
				d.boards.length === 0 ? /* @__PURE__ */ L(i, { children: /* @__PURE__ */ L(l, {
					icon: /* @__PURE__ */ L(B, {}),
					title: "No boards are switched on",
					description: e ? "Pick some categories in the settings." : "Ask an administrator to pick some categories."
				}) }) : /* @__PURE__ */ L("div", {
					className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
					children: d.boards.map((e) => /* @__PURE__ */ R(i, {
						className: "flex flex-col",
						children: [
							/* @__PURE__ */ L(o, {
								title: /* @__PURE__ */ R("span", {
									className: "inline-flex items-center gap-2",
									children: [/* @__PURE__ */ L(W, {
										category: e.category.key,
										className: "size-4 text-accent-ink"
									}), e.category.label]
								}),
								description: e.category.all_time ? `${e.category.description} Always all time.` : e.category.description
							}),
							/* @__PURE__ */ L(a, {
								className: "flex-1",
								children: /* @__PURE__ */ L(Ce, {
									entries: e.podium,
									category: e.category
								})
							}),
							/* @__PURE__ */ R(F, {
								to: `/p/leaderboard/${e.category.key}?${t}`,
								className: "flex items-center justify-between gap-3 border-t border-border px-card py-3 text-sm transition-colors hover:bg-hover",
								children: [/* @__PURE__ */ L("span", {
									className: e.me ? "text-text" : "text-muted",
									children: e.me ? /* @__PURE__ */ R(I, { children: [
										"You're ",
										/* @__PURE__ */ L("span", {
											className: "font-semibold",
											children: q(e.me.rank)
										}),
										" of ",
										e.participants,
										" · ",
										/* @__PURE__ */ L("span", {
											className: "font-mono tabular-nums",
											children: K(e.me.score, e.category.unit)
										})
									] }) : `${e.participants} member${e.participants === 1 ? "" : "s"} on the board`
								}), /* @__PURE__ */ R("span", {
									className: "inline-flex items-center gap-1 text-accent-ink",
									children: ["Full board ", /* @__PURE__ */ L(H, {
										open: !1,
										className: "size-3.5"
									})]
								})]
							})
						]
					}, e.category.key))
				})
			]
		}),
		s && /* @__PURE__ */ L(De, { onClose: () => c(!1) })
	] });
}
function Te() {
	let { category: e = "" } = ae(), a = k(), { query: o, ready: s } = Q(), [c, u] = P(/* @__PURE__ */ new Set()), d = (e) => u((t) => {
		let n = new Set(t);
		return n.has(e) ? n.delete(e) : n.add(e), n;
	}), { data: p, isLoading: g, error: _ } = M({
		queryKey: [
			"leaderboard",
			"board",
			e,
			o
		],
		queryFn: () => E.get(`${G}/board/${e}?${o}`),
		enabled: s && !!e
	});
	if (_) return /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(f, {
		eyebrow: "Leaderboard",
		title: "Board",
		icon: /* @__PURE__ */ L(B, {}),
		actions: /* @__PURE__ */ L(F, {
			to: "/p/leaderboard",
			children: /* @__PURE__ */ R(r, {
				variant: "ghost",
				children: [/* @__PURE__ */ L(U, {}), " Leaderboard"]
			})
		})
	}), /* @__PURE__ */ L(i, { children: /* @__PURE__ */ L(l, {
		icon: /* @__PURE__ */ L(B, {}),
		title: "No such board",
		description: "It may have been switched off."
	}) })] });
	let y = p?.category, x = p && p.me && p.me.rank > p.entries.length ? p.me : null, w = (e, r) => /* @__PURE__ */ R(ie, { children: [/* @__PURE__ */ R(T, {
		interactive: e.characters.length > 0,
		onClick: e.characters.length > 0 ? () => d(e.user_id) : void 0,
		className: r ? "bg-accent-soft/40" : void 0,
		children: [
			/* @__PURE__ */ L(S, { children: /* @__PURE__ */ L(Y, { rank: e.rank }) }),
			/* @__PURE__ */ L(S, { children: /* @__PURE__ */ R("div", {
				className: "flex items-center gap-3",
				children: [
					e.characters.length > 0 ? /* @__PURE__ */ L(H, {
						open: c.has(e.user_id),
						className: "size-4 text-subtle"
					}) : /* @__PURE__ */ L("span", { className: "size-4" }),
					/* @__PURE__ */ L(t, {
						src: e.portrait,
						name: e.name,
						size: "sm"
					}),
					/* @__PURE__ */ R("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ R("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ L("span", {
								className: "truncate font-medium",
								children: e.name
							}), r && /* @__PURE__ */ L(n, {
								tone: "accent",
								children: "You"
							})]
						}), e.corporation && /* @__PURE__ */ R("div", {
							className: "text-xs text-subtle",
							children: [
								e.corporation.name,
								" [",
								e.corporation.ticker,
								"]"
							]
						})]
					})
				]
			}) }),
			/* @__PURE__ */ L(S, {
				numeric: !0,
				className: "font-semibold",
				children: K(e.score, y.unit, !0)
			}),
			/* @__PURE__ */ L(S, {
				numeric: !0,
				className: "text-muted",
				children: y.extra_label ? K(e.extra, y.extra_unit, !0) : ""
			})
		]
	}), c.has(e.user_id) && e.characters.map((t) => /* @__PURE__ */ R(T, {
		className: "bg-bg/40",
		children: [
			/* @__PURE__ */ L(S, {}),
			/* @__PURE__ */ L(S, {
				className: "pl-16 text-muted",
				children: t.name
			}),
			/* @__PURE__ */ L(S, {
				numeric: !0,
				className: "text-muted",
				children: K(t.score, y.unit, !0)
			}),
			/* @__PURE__ */ L(S, {})
		]
	}, `${e.user_id}-${t.id}`))] }, e.user_id);
	return /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(f, {
		eyebrow: "Leaderboard",
		title: y ? y.label : "Board",
		icon: y ? /* @__PURE__ */ L(W, { category: y.key }) : /* @__PURE__ */ L(B, {}),
		description: y ? y.all_time ? `${y.description} This board is always all time.` : y.description : void 0,
		actions: /* @__PURE__ */ R("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [/* @__PURE__ */ L(xe, {}), /* @__PURE__ */ L(F, {
				to: `/p/leaderboard?${o}`,
				children: /* @__PURE__ */ R(r, {
					variant: "ghost",
					children: [/* @__PURE__ */ L(U, {}), " All boards"]
				})
			})]
		})
	}), g || !p || !y ? /* @__PURE__ */ L(m, { className: "h-96" }) : /* @__PURE__ */ R("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ L($, { hidden: p.hidden }),
			/* @__PURE__ */ R("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ L(h, {
						label: "On the board",
						value: p.participants,
						icon: /* @__PURE__ */ L(ve, {}),
						hint: p.period.label
					}),
					/* @__PURE__ */ L(h, {
						label: `Total ${y.label.toLowerCase()}`,
						value: K(p.total, y.unit),
						mono: !0,
						icon: /* @__PURE__ */ L(W, { category: y.key }),
						hint: "everyone together"
					}),
					/* @__PURE__ */ L(h, {
						label: "Your place",
						value: p.me ? q(p.me.rank) : "—",
						mono: !0,
						icon: /* @__PURE__ */ L(B, {}),
						tone: p.me && p.me.rank <= 3 ? "success" : void 0,
						hint: p.me ? K(p.me.score, y.unit, !0) : p.hidden ? "you're hidden" : "nothing counted yet"
					})
				]
			}),
			/* @__PURE__ */ L(i, { children: p.entries.length === 0 ? /* @__PURE__ */ L(l, {
				icon: /* @__PURE__ */ L(W, { category: y.key }),
				title: `Nobody has ${y.label.toLowerCase()} for ${p.period.label} yet`,
				description: "Figures come from the character sheet's syncs; give it an hour after new activity."
			}) : /* @__PURE__ */ R(b, { children: [/* @__PURE__ */ L(v, { children: /* @__PURE__ */ R("tr", { children: [
				/* @__PURE__ */ L(C, {
					className: "w-12",
					children: "#"
				}),
				/* @__PURE__ */ L(C, { children: "Member" }),
				/* @__PURE__ */ L(C, {
					align: "right",
					children: y.label
				}),
				/* @__PURE__ */ L(C, {
					align: "right",
					children: y.extra_label
				})
			] }) }), /* @__PURE__ */ R("tbody", { children: [p.entries.map((e) => w(e, e.user_id === a?.id)), x && /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L("tr", { children: /* @__PURE__ */ L("td", {
				colSpan: 4,
				className: "py-1 text-center text-xs text-subtle",
				children: "· · ·"
			}) }), w(x, !0)] })] })] }) }),
			p.participants > p.entries.length && /* @__PURE__ */ R("p", {
				className: "text-xs text-subtle",
				children: [
					"Showing the top ",
					p.entries.length,
					" of ",
					p.participants,
					"."
				]
			})
		]
	})] });
}
function Ee() {
	let e = N(), n = A("leaderboard.manage_leaderboard"), c = k(), { data: u } = Z(), [d, p] = P(!1), { data: h, isLoading: g } = M({
		queryKey: ["leaderboard", "medals"],
		queryFn: () => E.get(`${G}/medals`)
	}), _ = u?.periods[1], y = !!h && !!_ && h.awards.some((e) => e.month === _.key), x = j({
		mutationFn: () => E.post(`${G}/medals/${_.key}/award`),
		onSuccess: (t) => {
			e.invalidateQueries({ queryKey: ["leaderboard"] }), O.success(t.awarded ? `${t.awarded} medal${t.awarded === 1 ? "" : "s"} handed out for ${_.label}` : `Nobody scored in ${_.label}`);
		},
		onError: (e) => O.error(e.message)
	}), w = /* @__PURE__ */ new Map();
	for (let e of h?.awards ?? []) w.set(e.month, [...w.get(e.month) ?? [], e]);
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(f, {
			eyebrow: "Leaderboard",
			title: "Medals",
			icon: /* @__PURE__ */ L(V, {}),
			description: "The top three of every board get a medal when the month ends.",
			actions: /* @__PURE__ */ R("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ L(F, {
					to: "/p/leaderboard",
					children: /* @__PURE__ */ R(r, {
						variant: "ghost",
						children: [/* @__PURE__ */ L(U, {}), " Leaderboard"]
					})
				}), n && _ && !y && /* @__PURE__ */ R(r, {
					onClick: () => p(!0),
					children: [
						/* @__PURE__ */ L(V, {}),
						" Award ",
						_.label,
						" now"
					]
				})]
			})
		}),
		g || !h ? /* @__PURE__ */ L(m, { className: "h-80" }) : /* @__PURE__ */ R("div", {
			className: "grid gap-6 xl:grid-cols-[380px_1fr]",
			children: [/* @__PURE__ */ R(i, {
				className: "h-fit",
				children: [/* @__PURE__ */ L(o, {
					title: "Hall of fame",
					description: "Most medals, gold first."
				}), h.hall_of_fame.length === 0 ? /* @__PURE__ */ L(a, {
					className: "text-sm text-muted",
					children: "No medals yet. They're handed out the day after a month ends."
				}) : /* @__PURE__ */ L("ul", {
					className: "divide-y divide-border",
					children: h.hall_of_fame.map((e, n) => /* @__PURE__ */ R("li", {
						className: D("flex items-center gap-3 px-card py-2.5 text-sm", e.user_id === c?.id && "bg-accent-soft/40"),
						children: [
							/* @__PURE__ */ L("span", {
								className: "w-5 font-mono text-xs tabular-nums text-subtle",
								children: n + 1
							}),
							/* @__PURE__ */ L(t, {
								src: e.portrait,
								name: e.name,
								size: "sm"
							}),
							/* @__PURE__ */ L("span", {
								className: "min-w-0 flex-1 truncate font-medium",
								children: e.name
							}),
							/* @__PURE__ */ L(X, {
								counts: e,
								size: "sm"
							})
						]
					}, e.user_id))
				})]
			}), /* @__PURE__ */ L("div", {
				className: "space-y-4",
				children: w.size === 0 ? /* @__PURE__ */ L(i, { children: /* @__PURE__ */ L(l, {
					icon: /* @__PURE__ */ L(V, {}),
					title: "Nothing awarded yet",
					description: n && _ ? `You can hand out ${_.label}'s medals now, or wait for the daily job.` : void 0
				}) }) : [...w.entries()].map(([e, n]) => /* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(o, { title: n[0].label }), /* @__PURE__ */ R(b, { children: [/* @__PURE__ */ L(v, { children: /* @__PURE__ */ R("tr", { children: [
					/* @__PURE__ */ L(C, { children: "Board" }),
					/* @__PURE__ */ L(C, { className: "w-12" }),
					/* @__PURE__ */ L(C, { children: "Member" }),
					/* @__PURE__ */ L(C, {
						align: "right",
						children: "Score"
					})
				] }) }), /* @__PURE__ */ L("tbody", { children: n.map((e) => /* @__PURE__ */ R(T, {
					className: e.user_id === c?.id ? "bg-accent-soft/40" : void 0,
					children: [
						/* @__PURE__ */ L(S, { children: /* @__PURE__ */ R("span", {
							className: "inline-flex items-center gap-2",
							children: [/* @__PURE__ */ L(W, {
								category: e.category.key,
								className: "size-4 text-subtle"
							}), e.category.label]
						}) }),
						/* @__PURE__ */ L(S, { children: /* @__PURE__ */ L(Y, { rank: e.rank }) }),
						/* @__PURE__ */ L(S, { children: /* @__PURE__ */ R("span", {
							className: "inline-flex items-center gap-2",
							children: [/* @__PURE__ */ L(t, {
								src: e.portrait,
								name: e.name,
								size: "sm"
							}), /* @__PURE__ */ L("span", {
								className: "font-medium",
								children: e.name
							})]
						}) }),
						/* @__PURE__ */ L(S, {
							numeric: !0,
							children: K(e.score, e.category.unit, !0)
						})
					]
				}, e.id)) })] })] }, e))
			})]
		}),
		/* @__PURE__ */ L(s, {
			open: d,
			onOpenChange: p,
			title: `Award the medals for ${_?.label ?? "last month"}?`,
			description: "The top three of every board get their medal and a notification. This can't be undone, and the daily job would do the same tomorrow morning.",
			confirmLabel: /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(V, {}), " Award"] }),
			onConfirm: () => x.mutateAsync()
		})
	] });
}
function De({ onClose: e }) {
	let t = N(), { data: n } = M({
		queryKey: ["leaderboard", "settings"],
		queryFn: () => E.get(`${G}/settings`)
	}), [i, a] = P(null), o = i ?? n ?? null, s = j({
		mutationFn: (e) => E.put(`${G}/settings`, e),
		onSuccess: (n) => {
			t.setQueryData(["leaderboard", "settings"], n), t.invalidateQueries({ queryKey: ["leaderboard"] }), O.success("Saved"), e();
		},
		onError: (e) => O.error(e.message)
	}), l = (e) => o && a({
		...o,
		...e
	}), f = !!o && o.categories.length === 0, p = (e) => !!o && (f || o.categories.includes(e)), h = (e, t) => {
		if (!o) return;
		let n = f ? o.available_categories.map((e) => e.key) : o.categories;
		l({ categories: t ? [...n, e] : n.filter((t) => t !== e) });
	};
	return /* @__PURE__ */ L(c, {
		open: !0,
		onOpenChange: (t) => !t && e(),
		title: "Leaderboard settings",
		size: "lg",
		footer: /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(r, {
			variant: "ghost",
			onClick: e,
			children: "Cancel"
		}), /* @__PURE__ */ L(r, {
			variant: "primary",
			disabled: !o,
			loading: s.isPending,
			onClick: () => o && s.mutate(o),
			children: "Save"
		})] }),
		children: o ? /* @__PURE__ */ R(x, {
			variant: "pills",
			className: "space-y-4",
			items: [
				{
					value: "boards",
					label: "Boards"
				},
				{
					value: "who",
					label: "Who competes"
				},
				{
					value: "display",
					label: "Display"
				}
			],
			children: [
				/* @__PURE__ */ R(y, {
					value: "boards",
					children: [/* @__PURE__ */ L("p", {
						className: "mb-3 text-xs text-muted",
						children: "Which boards members see. Untick everything to show them all."
					}), /* @__PURE__ */ L("div", {
						className: "divide-y divide-border rounded-lg border border-border",
						children: o.available_categories.map((e) => /* @__PURE__ */ R("label", {
							className: D("flex items-center justify-between gap-3 px-3 py-2.5 text-sm", e.available ? "cursor-pointer" : "opacity-60"),
							children: [/* @__PURE__ */ R("span", {
								className: "flex min-w-0 items-center gap-3",
								children: [/* @__PURE__ */ L(W, {
									category: e.key,
									className: "size-4 shrink-0 text-subtle"
								}), /* @__PURE__ */ R("span", {
									className: "min-w-0",
									children: [/* @__PURE__ */ L("span", {
										className: "font-medium",
										children: e.label
									}), /* @__PURE__ */ L("span", {
										className: "block truncate text-xs text-muted",
										children: e.available ? e.description : "Needs the Fleets plugin switched on."
									})]
								})]
							}), /* @__PURE__ */ L(g, {
								checked: p(e.key) && e.available,
								disabled: !e.available,
								onCheckedChange: (t) => h(e.key, t)
							})]
						}, e.key))
					})]
				}),
				/* @__PURE__ */ R(y, {
					value: "who",
					children: [/* @__PURE__ */ L("p", {
						className: "mb-3 text-xs text-muted",
						children: "Members whose main character is in these corporations compete. None ticked means every member."
					}), o.available_corporations.length === 0 ? /* @__PURE__ */ L("p", {
						className: "text-sm text-subtle",
						children: "No member has a main character in a corporation yet."
					}) : /* @__PURE__ */ L("div", {
						className: "divide-y divide-border rounded-lg border border-border",
						children: o.available_corporations.map((e) => /* @__PURE__ */ R("label", {
							className: "flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm",
							children: [/* @__PURE__ */ R("span", { children: [
								e.name,
								" ",
								/* @__PURE__ */ R("span", {
									className: "text-subtle",
									children: [
										"[",
										e.ticker,
										"]"
									]
								})
							] }), /* @__PURE__ */ L(g, {
								checked: o.corporations.includes(e.id),
								onCheckedChange: (t) => l({ corporations: t ? [...o.corporations, e.id] : o.corporations.filter((t) => t !== e.id) })
							})]
						}, e.id))
					})]
				}),
				/* @__PURE__ */ L(y, {
					value: "display",
					children: /* @__PURE__ */ R("div", {
						className: "space-y-5",
						children: [
							/* @__PURE__ */ L(u, {
								label: "Places on a board",
								hint: "Members further down still see their own place.",
								children: /* @__PURE__ */ L("div", { children: /* @__PURE__ */ L(d, {
									type: "number",
									min: 3,
									max: 200,
									value: o.places,
									onChange: (e) => l({ places: Number(e.target.value) }),
									className: "w-28 font-mono"
								}) })
							}),
							/* @__PURE__ */ L(_, {
								label: "Show characters",
								description: "Members can open a row to see which of someone's characters earned the score. Off shows only totals.",
								checked: o.show_characters,
								onCheckedChange: (e) => l({ show_characters: e })
							}),
							/* @__PURE__ */ L(_, {
								label: "Monthly medals",
								description: "The top three of every board get a medal and a notification the day after the month ends.",
								checked: o.medals,
								onCheckedChange: (e) => l({ medals: e })
							})
						]
					})
				})
			]
		}) : /* @__PURE__ */ L(m, { className: "h-64" })
	});
}
function Oe() {
	let { data: e, isLoading: t } = M({
		queryKey: ["leaderboard", "me"],
		queryFn: () => E.get(`${G}/me`)
	});
	if (t) return /* @__PURE__ */ L(m, { className: "h-24" });
	if (!e) return null;
	let n = e.ranks.filter((e) => e.rank !== null);
	return /* @__PURE__ */ R(F, {
		to: "/p/leaderboard",
		className: "block",
		children: [/* @__PURE__ */ R("div", {
			className: "flex items-start justify-between gap-4",
			children: [/* @__PURE__ */ L("div", {
				className: "text-xs text-muted",
				children: e.period.label
			}), /* @__PURE__ */ L(X, {
				counts: e.medals,
				size: "sm"
			})]
		}), e.hidden ? /* @__PURE__ */ L("p", {
			className: "mt-2 text-sm text-muted",
			children: "You're hidden from the boards."
		}) : n.length === 0 ? /* @__PURE__ */ L("p", {
			className: "mt-2 text-sm text-muted",
			children: "Nothing counted for you yet this month."
		}) : /* @__PURE__ */ L("ul", {
			className: "mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm",
			children: n.slice(0, 6).map((e) => /* @__PURE__ */ R("li", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ R("span", {
					className: "inline-flex min-w-0 items-center gap-1.5 text-muted",
					children: [/* @__PURE__ */ L(W, {
						category: e.category.key,
						className: "size-3.5 shrink-0"
					}), /* @__PURE__ */ L("span", {
						className: "truncate",
						children: e.category.label
					})]
				}), /* @__PURE__ */ L("span", {
					className: D("font-mono tabular-nums", e.rank <= 3 ? "font-semibold text-success-fg" : ""),
					children: q(e.rank)
				})]
			}, e.category.key))
		})]
	});
}
var ke = ee({
	routes: [
		{
			path: "",
			Component: we
		},
		{
			path: "medals",
			Component: Ee
		},
		{
			path: ":category",
			Component: Te
		}
	],
	widgets: [{
		id: "my-ranks",
		title: "Leaderboard",
		Component: Oe,
		size: "sm",
		order: 45
	}]
});
//#endregion
export { ke as default };

export const classes = ["!c","!data","!lastMonthDone","!o","---","------------------------------------------------","-------------------------------------------------------------------------","-------------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------------","----------------------------------------------------------------------------------------------------","---------------------------------------------------------------------------------------------------------","-bottom-1","-right-1","@conduit/sdk","@tanstack/react-query","a","absolute","accent","action","actions","administrator","after","align","all","allOn","all_time","always","an","and","any","are","aria-label","as","available","available_categories","available_corporations","award","awarded","awards","back","be","been","beyond","bg-accent-soft/40","bg-bg/40","bg-surface","block","board","boards","boolean","border","border-border","border-t","bounties","bronze","but","by","byMonth","c","can","canManage","categories","category","character","characters","checked","children","className","colSpan","color","colours","come","competes","confirmLabel","const","content","corporation","corporations","count","counted","counts","current","currentColor","cursor-pointer","cx","cy","daily","dashboard","data","day","default","description","disabled","display","divide-border","divide-y","do","don","down","earned","else","enabled","entries","error","every","everyone","everything","export","extra","extra_label","extra_unit","eyebrow","fame","far","fats","few","figures","fill","flex","flex-1","flex-col","flex-wrap","font-medium","font-mono","font-semibold","footer","for","form","from","full","function","further","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-6","gap-x-4","gap-y-1.5","get","ghost","give","gold","grid","grid-cols-2","h-24","h-64","h-80","h-96","h-fit","hall_of_fame","hand","handed","has","have","helpers","here","hidden","hide","hiding","hint","hour","hover:bg-hover","icon","icons","id","if","import","in","industry","info","inline","inline-flex","inline-grid","interactive","interface","is","isLoading","isOn","isk","isk_destroyed","it","items","items-center","items-start","job","just","justify-between","k","keep","kept","key","kills","label","last","lastMonth","lastMonthDone","leaderboard","length","lg","links","loading","losses","m12","m12.5","m13","m16.71","m2","m9","main","manage_leaderboard","max","may","mb-3","md","md:grid-cols-2","me","means","medal","medals","member","members","min","min-w-0","mine","mining","mono","month","mt-2","mutationFn","my-ranks","n","name","nd","new","next","none","not","nothing","notification","now","number","numeric","of","off","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpenChange","onSuccess","one","only","opacity-60","open","options","or","order","out","overview","own","p-3","participants","patch","path","period","periods","pick","pills","pl-16","place","place-items-center","placed","places","plugin","podium","portrait","post","primary","put","px-1","px-3","px-card","py-1","py-2.5","py-3","py-6","qc","query","queryFn","queryKey","rank","rank!","ranked","ranks","rd","re","react","react-router","ready","relative","replace","rest","return","right","rotate-90","round","rounded-full","rounded-lg","routes","row","s","same","save","score","scored","see","set","setConfirm","setForm","setOpen","setParams","setSettingsOpen","settings","shadow-e1","sheet","show","show_characters","shows","shrink-0","silver","site","size","size-3.5","size-4","size-5","size-6","size-7","skillpoints","sm","sm:grid-cols-3","so","some","someone","sp","space-y-3","space-y-4","space-y-5","space-y-6","src","st","staleTime","still","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","such","switched","t","tabular-nums","text","text-accent-ink","text-center","text-lg","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-text","text-xs","th","the","their","them","theme","these","they","this","three","ticked","ticker","title","to","together","toggle","toggleCategory","tomorrow","tone","top","total","transition-colors","transition-transform","true","truncate","type","undefined","unit","useQueryClient","useSearchParams","useState","used","user","user_id","uses","v","value","variant","viewBox","void","w-12","w-28","w-44","w-5","w-52","wait","what","when","which","who","whose","widget","widgets","would","x","xl:grid-cols-3","xl:grid-cols-[380px_1fr]","yet","you","your","yourself"];
