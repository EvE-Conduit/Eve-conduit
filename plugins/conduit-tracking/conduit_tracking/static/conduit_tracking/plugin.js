import { Avatar as e, Badge as t, BarChart as n, Button as r, Callout as i, Card as a, CardHeader as o, ConfirmDialog as s, Dialog as c, EmptyState as l, Field as u, Input as ee, Meter as d, PageHeader as f, SearchInput as te, Segmented as p, Skeleton as m, StatCard as h, THead as g, TabPanel as _, Table as v, Tabs as y, Td as b, Textarea as x, Th as S, Tr as C, api as w, date as T, dateTime as E, definePlugin as ne, humanize as re, isk as D, num as O, timeAgo as k, toast as A } from "@conduit/sdk";
import { useMutation as j, useQuery as M, useQueryClient as N } from "@tanstack/react-query";
import { useEffect as ie, useState as P } from "react";
import { Link as F, useNavigate as I, useParams as ae } from "react-router";
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
		/* @__PURE__ */ R("path", { d: "M19.07 4.93A10 10 0 0 0 6.99 3.34" }),
		/* @__PURE__ */ R("path", { d: "M4 6h.01" }),
		/* @__PURE__ */ R("path", { d: "M2.29 9.62A10 10 0 1 0 21.31 8.35" }),
		/* @__PURE__ */ R("path", { d: "M16.24 7.76A6 6 0 1 0 8.23 16.67" }),
		/* @__PURE__ */ R("path", { d: "M12 18h.01" }),
		/* @__PURE__ */ R("path", { d: "M17.99 11.66A6 6 0 0 1 15.77 16.67" }),
		/* @__PURE__ */ R("circle", {
			cx: "12",
			cy: "12",
			r: "2"
		}),
		/* @__PURE__ */ R("path", { d: "m13.41 10.59 5.66-5.66" })
	]
}), H = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M5 12h14" }), /* @__PURE__ */ R("path", { d: "M12 5v14" })]
}), oe = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M3 6h18" }),
		/* @__PURE__ */ R("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ R("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), U = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ R("path", { d: "M19 12H5" })]
}), W = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ R("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ R("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), G = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("rect", {
		x: "5",
		y: "5",
		width: "14",
		height: "14",
		rx: "1"
	})
}), K = "/api/p/tracking";
function q(e) {
	if (e < 60) return e > 0 ? "under a minute" : "0m";
	let t = Math.round(e / 60), n = Math.floor(t / 60);
	return n ? `${n}h ${t % 60}m` : `${t}m`;
}
//#endregion
//#region src/sessions.tsx
function se() {
	let [t, n] = P(""), [i, a] = P(!1), { data: o, isLoading: s } = M({
		queryKey: [
			"tracking",
			"sessions",
			t
		],
		queryFn: () => w.get(`${K}/sessions?state=${t}&limit=200`),
		refetchInterval: 6e4
	});
	return /* @__PURE__ */ z(L, { children: [
		/* @__PURE__ */ R(f, {
			eyebrow: "HR",
			title: "Activity Tracking",
			icon: /* @__PURE__ */ R(V, {}),
			description: "Follow a member and all their alts for 1 to 60 days: the systems they're in, the ships they fly, what they earn and when they play. The member is not told.",
			actions: /* @__PURE__ */ z(r, {
				variant: "primary",
				onClick: () => a(!0),
				children: [/* @__PURE__ */ R(H, {}), " Track a member"]
			})
		}),
		/* @__PURE__ */ R("div", {
			className: "mb-4",
			children: /* @__PURE__ */ R(p, {
				size: "sm",
				value: t,
				onChange: n,
				"aria-label": "Show",
				options: [
					{
						value: "",
						label: "All"
					},
					{
						value: "running",
						label: "Running"
					},
					{
						value: "finished",
						label: "Finished"
					}
				]
			})
		}),
		s || !o ? /* @__PURE__ */ R(m, { className: "h-48" }) : o.items.length === 0 ? /* @__PURE__ */ R(l, {
			icon: /* @__PURE__ */ R(V, {}),
			title: t === "finished" ? "No finished tracking" : "Nobody is being tracked",
			description: "Pick a member by their main or any alt; every character on their account is followed.",
			action: /* @__PURE__ */ z(r, {
				variant: "primary",
				onClick: () => a(!0),
				children: [/* @__PURE__ */ R(H, {}), " Track a member"]
			})
		}) : /* @__PURE__ */ z(v, { children: [/* @__PURE__ */ R(g, { children: /* @__PURE__ */ z("tr", { children: [
			/* @__PURE__ */ R(S, { children: "Member" }),
			/* @__PURE__ */ R(S, { children: "Period" }),
			/* @__PURE__ */ R(S, { children: "Status" }),
			/* @__PURE__ */ R(S, { children: "Started by" }),
			/* @__PURE__ */ R(S, { children: "Reason" })
		] }) }), /* @__PURE__ */ R("tbody", { children: o.items.map((t) => /* @__PURE__ */ z(C, { children: [
			/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z(F, {
				to: `/p/tracking/${t.id}`,
				className: "flex items-center gap-2 hover:text-accent-ink",
				children: [/* @__PURE__ */ R(e, {
					src: t.target.portrait,
					name: t.target.name,
					size: "sm"
				}), /* @__PURE__ */ z("span", { children: [/* @__PURE__ */ R("span", {
					className: "block font-medium",
					children: t.target.name
				}), /* @__PURE__ */ R("span", {
					className: "block text-xs text-muted",
					children: t.target.corporation ?? "No corporation"
				})] })]
			}) }),
			/* @__PURE__ */ z(b, {
				className: "whitespace-nowrap text-muted",
				children: [
					T(t.started_at),
					" – ",
					T(t.ended_at ?? t.ends_at),
					" · ",
					t.days,
					" day",
					t.days === 1 ? "" : "s"
				]
			}),
			/* @__PURE__ */ R(b, { children: /* @__PURE__ */ R(J, { s: t }) }),
			/* @__PURE__ */ R(b, {
				className: "text-muted",
				children: t.started_by ?? "—"
			}),
			/* @__PURE__ */ R(b, {
				className: "max-w-xs truncate text-muted",
				title: t.reason,
				children: t.reason || "—"
			})
		] }, t.id)) })] }),
		i && /* @__PURE__ */ R(ue, { onClose: () => a(!1) })
	] });
}
function J({ s: e }) {
	return e.running ? /* @__PURE__ */ z(t, {
		tone: "accent",
		children: ["Running · ends ", k(e.ends_at)]
	}) : e.stopped_by ? /* @__PURE__ */ z(t, {
		tone: "neutral",
		children: ["Stopped by ", e.stopped_by]
	}) : /* @__PURE__ */ R(t, {
		tone: "success",
		children: "Finished"
	});
}
function ce(e) {
	let [t, n] = P(e);
	return ie(() => {
		let t = setTimeout(() => n(e.trim()), 250);
		return () => clearTimeout(t);
	}, [e]), t;
}
var le = [
	1,
	7,
	14,
	30,
	60
];
function ue({ onClose: n }) {
	let a = N(), o = I(), [s, l] = P(""), [d, f] = P(null), [p, m] = P("7"), [h, g] = P(""), _ = ce(s), { data: v, isFetching: y } = M({
		queryKey: [
			"tracking",
			"members",
			_
		],
		queryFn: () => w.get(`${K}/members?q=${encodeURIComponent(_)}`),
		enabled: _.length >= 2 && !d
	}), b = Number(p), S = d && !d.tracked && Number.isInteger(b) && b >= 1 && b <= 60, C = j({
		mutationFn: () => w.post(`${K}/sessions`, {
			user_id: d.id,
			days: b,
			reason: h
		}),
		onSuccess: (e) => {
			a.invalidateQueries({ queryKey: ["tracking"] }), A.success(`Tracking ${e.target.name} for ${e.days} day${e.days === 1 ? "" : "s"}`), o(`/p/tracking/${e.id}`);
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ R(c, {
		open: !0,
		onOpenChange: (e) => !e && n(),
		title: "Track a member",
		description: "Every character on their account is followed, including alts they link while it runs. They aren't told.",
		footer: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(r, {
			variant: "ghost",
			onClick: n,
			children: "Cancel"
		}), /* @__PURE__ */ R(r, {
			variant: "primary",
			disabled: !S,
			loading: C.isPending,
			onClick: () => C.mutate(),
			children: "Start tracking"
		})] }),
		children: /* @__PURE__ */ z("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ R(u, {
					label: "Member",
					hint: "Search by their main or any alt.",
					children: d ? /* @__PURE__ */ z("div", {
						className: "flex items-center justify-between gap-2 border border-border px-3 py-2",
						children: [/* @__PURE__ */ z("span", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ R(e, {
								src: d.portrait,
								name: d.name,
								size: "sm"
							}), /* @__PURE__ */ z("span", { children: [/* @__PURE__ */ R("span", {
								className: "block font-medium",
								children: d.name
							}), /* @__PURE__ */ z("span", {
								className: "block text-xs text-muted",
								children: [
									d.corporation ?? "No corporation",
									" · ",
									d.characters,
									" character",
									d.characters === 1 ? "" : "s"
								]
							})] })]
						}), /* @__PURE__ */ R(r, {
							size: "sm",
							variant: "ghost",
							onClick: () => f(null),
							children: "Change"
						})]
					}) : /* @__PURE__ */ z("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ R(te, {
							value: s,
							onChange: (e) => l(e.target.value),
							placeholder: "Character name",
							"aria-label": "Character name",
							autoFocus: !0
						}), _.length >= 2 && /* @__PURE__ */ R("ul", {
							className: "max-h-60 divide-y divide-border overflow-y-auto border border-border",
							children: y && !v ? /* @__PURE__ */ R("li", {
								className: "px-3 py-2 text-sm text-muted",
								children: "Searching…"
							}) : v?.items.length === 0 ? /* @__PURE__ */ R("li", {
								className: "px-3 py-2 text-sm text-muted",
								children: "No member you can see has a character called that."
							}) : v?.items.map((n) => /* @__PURE__ */ R("li", { children: /* @__PURE__ */ z("button", {
								type: "button",
								onClick: () => f(n),
								className: "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-hover",
								children: [
									/* @__PURE__ */ R(e, {
										src: n.portrait,
										name: n.name,
										size: "sm"
									}),
									/* @__PURE__ */ z("span", {
										className: "flex-1",
										children: [/* @__PURE__ */ R("span", {
											className: "block font-medium",
											children: n.name
										}), /* @__PURE__ */ z("span", {
											className: "block text-xs text-muted",
											children: [n.matched ? `Alt: ${n.matched} · ` : "", n.corporation ?? "No corporation"]
										})]
									}),
									n.tracked && /* @__PURE__ */ R(t, {
										tone: "accent",
										children: "Being tracked"
									})
								]
							}) }, n.id))
						})]
					})
				}),
				d?.tracked && /* @__PURE__ */ z(i, {
					tone: "warning",
					children: [d.name, " is already being tracked. Stop that first to start again."]
				}),
				/* @__PURE__ */ R(u, {
					label: "For how many days",
					hint: "1 to 60 days.",
					children: /* @__PURE__ */ z("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ R(ee, {
							className: "w-24",
							type: "number",
							min: 1,
							max: 60,
							value: p,
							onChange: (e) => m(e.target.value)
						}), le.map((e) => /* @__PURE__ */ z(r, {
							size: "sm",
							variant: String(e) === p ? "primary" : "outline",
							onClick: () => m(String(e)),
							children: [e, "d"]
						}, e))]
					})
				}),
				/* @__PURE__ */ R(u, {
					label: "Reason",
					hint: "Optional. Only other trackers and the audit log see it.",
					children: /* @__PURE__ */ R(x, {
						rows: 2,
						maxLength: 1e3,
						value: h,
						onChange: (e) => g(e.target.value)
					})
				})
			]
		})
	});
}
//#endregion
//#region src/report.tsx
function de() {
	let { id: t } = ae(), [n, r] = P("overview"), { data: i, isLoading: a, error: o } = M({
		queryKey: [
			"tracking",
			"report",
			t
		],
		queryFn: () => w.get(`${K}/sessions/${t}`),
		refetchInterval: (e) => e.state.data?.session.running ? 6e4 : !1
	});
	if (o) return /* @__PURE__ */ R(l, {
		icon: /* @__PURE__ */ R(V, {}),
		title: "Not found",
		description: "This tracking was deleted, or it's on a member you can't see."
	});
	if (a || !i) return /* @__PURE__ */ R(m, { className: "h-96" });
	let s = i.session, c = i.totals;
	return /* @__PURE__ */ z(L, { children: [
		/* @__PURE__ */ z(F, {
			to: "/p/tracking",
			className: "mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ R(U, {}), " Activity Tracking"]
		}),
		/* @__PURE__ */ R(f, {
			eyebrow: "Activity report",
			title: s.target.name,
			icon: /* @__PURE__ */ R(e, {
				src: s.target.portrait,
				name: s.target.name,
				size: "md"
			}),
			description: /* @__PURE__ */ z("span", {
				className: "inline-flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ R(J, { s }), /* @__PURE__ */ z("span", { children: [
					E(i.period.start),
					" – ",
					E(i.period.end),
					" · started by ",
					s.started_by ?? "someone",
					s.reason ? ` · ${s.reason}` : ""
				] })]
			}),
			actions: /* @__PURE__ */ R(fe, { report: i })
		}),
		/* @__PURE__ */ R(pe, { characters: i.characters }),
		/* @__PURE__ */ z("div", {
			className: "mb-6 grid grid-cols-2 gap-3 md:grid-cols-4",
			children: [
				/* @__PURE__ */ R(h, {
					label: "Time online",
					value: q(c.online_seconds),
					hint: `${q(c.docked_seconds)} docked`
				}),
				/* @__PURE__ */ R(h, {
					label: "Systems",
					value: O(c.systems),
					hint: `${c.regions} region${c.regions === 1 ? "" : "s"} · ${c.ships} ship type${c.ships === 1 ? "" : "s"}`
				}),
				/* @__PURE__ */ R(h, {
					label: "ISK earned",
					value: D(c.earned),
					hint: `${D(c.spent)} spent`,
					tone: "success"
				}),
				/* @__PURE__ */ R(h, {
					label: "Kills / losses",
					value: `${c.kills} / ${c.losses}`,
					hint: `${D(c.isk_destroyed)} destroyed · ${D(c.isk_lost)} lost`
				})
			]
		}),
		/* @__PURE__ */ z(y, {
			value: n,
			onValueChange: r,
			variant: "pills",
			className: "space-y-4",
			items: [
				{
					value: "overview",
					label: "Overview"
				},
				{
					value: "where",
					label: "Systems & ships"
				},
				{
					value: "isk",
					label: "ISK"
				},
				{
					value: "kills",
					label: "Kills & mining"
				},
				{
					value: "timeline",
					label: "Timeline",
					count: i.timeline_total
				}
			],
			children: [
				/* @__PURE__ */ R(_, {
					value: "overview",
					children: /* @__PURE__ */ R(he, { r: i })
				}),
				/* @__PURE__ */ R(_, {
					value: "where",
					children: /* @__PURE__ */ R(ge, { r: i })
				}),
				/* @__PURE__ */ R(_, {
					value: "isk",
					children: /* @__PURE__ */ R(_e, { r: i })
				}),
				/* @__PURE__ */ R(_, {
					value: "kills",
					children: /* @__PURE__ */ R(ve, { r: i })
				}),
				/* @__PURE__ */ R(_, {
					value: "timeline",
					children: /* @__PURE__ */ R(ye, { r: i })
				})
			]
		})
	] });
}
function fe({ report: e }) {
	let t = e.session, n = N(), i = I(), [a, o] = P(null), c = j({
		mutationFn: () => w.post(`${K}/sessions/${t.id}/stop`),
		onSuccess: () => {
			n.invalidateQueries({ queryKey: ["tracking"] }), A.success("Tracking stopped; the report is kept");
		},
		onError: (e) => A.error(e.message)
	}), l = j({
		mutationFn: () => w.delete(`${K}/sessions/${t.id}`),
		onSuccess: () => {
			n.invalidateQueries({ queryKey: ["tracking"] }), A.success("Tracking deleted"), i("/p/tracking");
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ z("div", {
		className: "flex gap-2",
		children: [
			t.running && /* @__PURE__ */ z(r, {
				variant: "outline",
				onClick: () => o("stop"),
				children: [/* @__PURE__ */ R(G, {}), " Stop"]
			}),
			/* @__PURE__ */ z(r, {
				variant: "outline",
				onClick: () => o("delete"),
				children: [/* @__PURE__ */ R(oe, {}), " Delete"]
			}),
			/* @__PURE__ */ R(s, {
				open: a !== null,
				onOpenChange: (e) => !e && o(null),
				danger: a === "delete",
				title: a === "stop" ? `Stop tracking ${t.target.name}?` : `Delete this report on ${t.target.name}?`,
				description: a === "stop" ? "Polling stops now. The report so far is kept." : "Everything this tracking recorded is deleted for good. Their wallet, mining and killmails stay on their character sheets.",
				confirmLabel: a === "stop" ? "Stop tracking" : "Delete",
				onConfirm: () => a === "stop" ? c.mutateAsync() : l.mutateAsync()
			})
		]
	});
}
function pe({ characters: e }) {
	let t = e.filter((e) => e.status !== "ok" && e.status !== "pending" && e.status !== "gone");
	return t.length ? /* @__PURE__ */ z(i, {
		tone: "warning",
		title: `${t.length} character${t.length === 1 ? "" : "s"} can't be followed`,
		className: "mb-4",
		children: [
			t.map((e) => `${e.name}: ${e.status_label}${e.status_detail ? ` (${e.status_detail})` : ""}`).join(" · "),
			".",
			" ",
			"Their wallet, mining and kills still count once their character sheet syncs; where they are and what they fly doesn't."
		]
	}) : null;
}
function me({ value: e }) {
	return e == null ? null : /* @__PURE__ */ R("span", {
		className: `font-mono text-xs tabular-nums ${e >= .45 ? "text-success-fg" : e > 0 ? "text-warning-fg" : "text-danger-fg"}`,
		children: e.toFixed(1)
	});
}
function Y({ s: e }) {
	return /* @__PURE__ */ z("span", {
		className: "inline-flex items-baseline gap-1.5",
		children: [
			/* @__PURE__ */ R(me, { value: e.security }),
			/* @__PURE__ */ R("span", { children: e.name }),
			e.region && /* @__PURE__ */ R("span", {
				className: "text-xs text-muted",
				children: e.region
			})
		]
	});
}
function X({ t: e, sub: t }) {
	return /* @__PURE__ */ z("span", {
		className: "inline-flex items-center gap-2",
		children: [/* @__PURE__ */ R("img", {
			src: e.icon,
			alt: "",
			className: "size-6 shrink-0 rounded"
		}), /* @__PURE__ */ z("span", { children: [/* @__PURE__ */ R("span", {
			className: "block",
			children: e.name
		}), t && /* @__PURE__ */ R("span", {
			className: "block text-xs text-muted",
			children: t
		})] })]
	});
}
function he({ r }) {
	let i = Math.max(1, ...r.by_hour);
	return /* @__PURE__ */ z("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ z(a, { children: [/* @__PURE__ */ R(o, {
				title: "Characters",
				description: "Every character on their account. Time is time online that we saw."
			}), /* @__PURE__ */ z(v, { children: [/* @__PURE__ */ R(g, { children: /* @__PURE__ */ z("tr", { children: [
				/* @__PURE__ */ R(S, { children: "Character" }),
				/* @__PURE__ */ R(S, { children: "Now" }),
				/* @__PURE__ */ R(S, {
					className: "text-right",
					children: "Online"
				}),
				/* @__PURE__ */ R(S, { children: "Mostly in" }),
				/* @__PURE__ */ R(S, { children: "Mostly flying" }),
				/* @__PURE__ */ R(S, {
					className: "text-right",
					children: "Earned"
				})
			] }) }), /* @__PURE__ */ R("tbody", { children: r.characters.map((n) => /* @__PURE__ */ z(C, { children: [
				/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z(F, {
					to: `/characters/${n.id}`,
					className: "flex items-center gap-2 hover:text-accent-ink",
					children: [/* @__PURE__ */ R(e, {
						src: n.portrait,
						name: n.name,
						size: "sm"
					}), /* @__PURE__ */ z("span", { children: [/* @__PURE__ */ R("span", {
						className: "block font-medium",
						children: n.name
					}), n.status !== "ok" && /* @__PURE__ */ R("span", {
						className: "block text-xs text-muted",
						children: n.status_label
					})] })]
				}) }),
				/* @__PURE__ */ R(b, { children: n.now ? /* @__PURE__ */ z("span", {
					className: "text-sm",
					children: [
						/* @__PURE__ */ R(t, {
							tone: "success",
							children: "Online"
						}),
						" ",
						/* @__PURE__ */ R(Y, { s: n.now.system }),
						n.now.ship && /* @__PURE__ */ z("span", {
							className: "text-muted",
							children: [
								" · ",
								n.now.ship.name,
								n.now.docked ? " (docked)" : ""
							]
						})
					]
				}) : n.online === !1 ? /* @__PURE__ */ R("span", {
					className: "text-muted",
					children: "Offline"
				}) : /* @__PURE__ */ R("span", {
					className: "text-subtle",
					children: "—"
				}) }),
				/* @__PURE__ */ R(b, {
					className: "text-right font-mono tabular-nums",
					children: q(n.seconds)
				}),
				/* @__PURE__ */ R(b, { children: n.top_system ? /* @__PURE__ */ R(Y, { s: n.top_system }) : /* @__PURE__ */ R("span", {
					className: "text-subtle",
					children: "—"
				}) }),
				/* @__PURE__ */ R(b, { children: n.top_ship ? n.top_ship.name : /* @__PURE__ */ R("span", {
					className: "text-subtle",
					children: "—"
				}) }),
				/* @__PURE__ */ R(b, {
					className: "text-right font-mono tabular-nums",
					children: n.earned ? D(n.earned) : "—"
				})
			] }, n.id)) })] })] }),
			/* @__PURE__ */ z("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ z(a, { children: [/* @__PURE__ */ R(o, {
					title: "Time online per day",
					description: "All their characters together, EVE time."
				}), /* @__PURE__ */ R("div", {
					className: "px-card pb-4",
					children: r.by_day.length ? /* @__PURE__ */ R(n, {
						data: r.by_day.map((e) => ({
							date: e.day,
							value: e.seconds
						})),
						format: q,
						label: "Time online per day"
					}) : /* @__PURE__ */ R("p", {
						className: "text-sm text-muted",
						children: "Nothing seen online yet."
					})
				})] }), /* @__PURE__ */ z(a, { children: [/* @__PURE__ */ R(o, {
					title: "When they play",
					description: "Time online by hour of day, EVE time."
				}), /* @__PURE__ */ z("div", {
					className: "px-card pb-4",
					children: [/* @__PURE__ */ R("div", {
						className: "flex h-40 items-end gap-0.5",
						role: "img",
						"aria-label": "Time online by hour of day",
						children: r.by_hour.map((e, t) => /* @__PURE__ */ R("div", {
							className: "flex h-full flex-1 flex-col justify-end",
							title: `${String(t).padStart(2, "0")}:00 · ${q(e)}`,
							children: /* @__PURE__ */ R("div", {
								className: "w-full rounded-t-sm bg-accent",
								style: {
									height: `${e / i * 100}%`,
									minHeight: e ? 2 : 0
								}
							})
						}, t))
					}), /* @__PURE__ */ z("div", {
						className: "mt-1 flex justify-between font-mono text-xs text-muted",
						children: [
							/* @__PURE__ */ R("span", { children: "00" }),
							/* @__PURE__ */ R("span", { children: "06" }),
							/* @__PURE__ */ R("span", { children: "12" }),
							/* @__PURE__ */ R("span", { children: "18" }),
							/* @__PURE__ */ R("span", { children: "23" })
						]
					})]
				})] })]
			}),
			/* @__PURE__ */ z("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ R(Z, {
					title: "Top systems",
					items: r.systems.slice(0, 8),
					total: r.totals.online_seconds,
					name: (e) => /* @__PURE__ */ R(Y, { s: e })
				}), /* @__PURE__ */ R(Z, {
					title: "Top ships",
					items: r.ships.slice(0, 8),
					total: r.totals.online_seconds,
					name: (e) => e.name
				})]
			})
		]
	});
}
function Z({ title: e, items: t, total: n, name: r }) {
	return /* @__PURE__ */ z(a, { children: [/* @__PURE__ */ R(o, { title: e }), /* @__PURE__ */ R("div", {
		className: "space-y-3 px-card pb-4",
		children: t.length === 0 ? /* @__PURE__ */ R("p", {
			className: "text-sm text-muted",
			children: "Nothing seen yet."
		}) : t.map((e, t) => /* @__PURE__ */ R(d, {
			label: r(e),
			valueText: `${q(e.seconds)} · ${n ? Math.round(e.seconds / n * 100) : 0}%`,
			value: n ? e.seconds / n * 100 : 0
		}, t))
	})] });
}
function Q({ title: e, description: t, items: n, total: r, head: i, cell: s }) {
	return /* @__PURE__ */ z(a, { children: [/* @__PURE__ */ R(o, {
		title: e,
		description: t
	}), n.length === 0 ? /* @__PURE__ */ R("p", {
		className: "px-card pb-4 text-sm text-muted",
		children: "Nothing seen yet."
	}) : /* @__PURE__ */ z(v, { children: [/* @__PURE__ */ R(g, { children: /* @__PURE__ */ z("tr", { children: [
		/* @__PURE__ */ R(S, { children: i }),
		/* @__PURE__ */ R(S, {
			className: "text-right",
			children: "Time"
		}),
		/* @__PURE__ */ R(S, {
			className: "text-right",
			children: "Share"
		}),
		/* @__PURE__ */ R(S, { children: "Characters" })
	] }) }), /* @__PURE__ */ R("tbody", { children: n.map((e, t) => /* @__PURE__ */ z(C, { children: [
		/* @__PURE__ */ R(b, { children: s(e) }),
		/* @__PURE__ */ R(b, {
			className: "text-right font-mono tabular-nums",
			children: q(e.seconds)
		}),
		/* @__PURE__ */ z(b, {
			className: "text-right font-mono tabular-nums text-muted",
			children: [r ? Math.round(e.seconds / r * 100) : 0, "%"]
		}),
		/* @__PURE__ */ R(b, {
			className: "text-muted",
			children: e.characters.join(", ")
		})
	] }, t)) })] })] });
}
function ge({ r: e }) {
	let t = e.totals.online_seconds;
	return /* @__PURE__ */ z("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ R(i, {
				tone: "info",
				children: "Checked once a minute while a character is online, so time per system and ship is close, but a system flown straight through or a quick ship swap can be missed."
			}),
			/* @__PURE__ */ R(Q, {
				title: "Systems",
				items: e.systems,
				total: t,
				head: "System",
				cell: (e) => /* @__PURE__ */ R(Y, { s: e })
			}),
			/* @__PURE__ */ R(Q, {
				title: "Ships",
				items: e.ships,
				total: t,
				head: "Ship",
				cell: (e) => /* @__PURE__ */ R(X, {
					t: e,
					sub: e.group
				})
			}),
			/* @__PURE__ */ z("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ R(Q, {
					title: "Regions",
					items: e.regions,
					total: t,
					head: "Region",
					cell: (e) => e.name
				}), /* @__PURE__ */ R(Q, {
					title: "Docked at",
					description: "Stations and structures they sat in.",
					items: e.docked,
					total: t,
					head: "Where",
					cell: (e) => e.name
				})]
			})
		]
	});
}
function _e({ r: e }) {
	return /* @__PURE__ */ z("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ R(i, {
				tone: "info",
				children: "From their characters' wallet journals, which sync about once an hour. ISK moved between their own characters isn't counted."
			}),
			/* @__PURE__ */ z("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ R($, {
					title: "Income",
					rows: e.income,
					total: e.totals.earned
				}), /* @__PURE__ */ R($, {
					title: "Spending",
					rows: e.spending,
					total: e.totals.spent
				})]
			}),
			/* @__PURE__ */ z(a, { children: [/* @__PURE__ */ R(o, {
				title: "Where they made ISK",
				description: "Bounties and other payouts that say which system they were earned in."
			}), e.isk_systems.length === 0 ? /* @__PURE__ */ R("p", {
				className: "px-card pb-4 text-sm text-muted",
				children: "No payouts tied to a system."
			}) : /* @__PURE__ */ z(v, { children: [/* @__PURE__ */ R(g, { children: /* @__PURE__ */ z("tr", { children: [/* @__PURE__ */ R(S, { children: "System" }), /* @__PURE__ */ R(S, {
				className: "text-right",
				children: "ISK"
			})] }) }), /* @__PURE__ */ R("tbody", { children: e.isk_systems.map((e) => /* @__PURE__ */ z(C, { children: [/* @__PURE__ */ R(b, { children: /* @__PURE__ */ R(Y, { s: e }) }), /* @__PURE__ */ R(b, {
				className: "text-right font-mono tabular-nums",
				children: D(e.amount)
			})] }, e.id)) })] })] })
		]
	});
}
function $({ title: e, rows: t, total: n }) {
	return /* @__PURE__ */ z(a, { children: [/* @__PURE__ */ R(o, {
		title: e,
		description: D(n)
	}), t.length === 0 ? /* @__PURE__ */ R("p", {
		className: "px-card pb-4 text-sm text-muted",
		children: "None."
	}) : /* @__PURE__ */ R("div", {
		className: "space-y-3 px-card pb-4",
		children: t.map((e) => /* @__PURE__ */ R(d, {
			label: re(e.ref_type),
			valueText: D(e.amount),
			value: n ? e.amount / n * 100 : 0
		}, e.ref_type))
	})] });
}
function ve({ r: e }) {
	return /* @__PURE__ */ z("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ z("div", {
			className: "grid gap-6 lg:grid-cols-2",
			children: [/* @__PURE__ */ z(a, { children: [/* @__PURE__ */ R(o, {
				title: "Ships on killmails",
				description: "What they flew on kills, and what they lost."
			}), e.killmail_ships.length === 0 ? /* @__PURE__ */ R("p", {
				className: "px-card pb-4 text-sm text-muted",
				children: "No killmails in this period."
			}) : /* @__PURE__ */ z(v, { children: [/* @__PURE__ */ R(g, { children: /* @__PURE__ */ z("tr", { children: [/* @__PURE__ */ R(S, { children: "Ship" }), /* @__PURE__ */ R(S, {
				className: "text-right",
				children: "Killmails"
			})] }) }), /* @__PURE__ */ R("tbody", { children: e.killmail_ships.map((e) => /* @__PURE__ */ z(C, { children: [/* @__PURE__ */ R(b, { children: /* @__PURE__ */ R(X, { t: e }) }), /* @__PURE__ */ R(b, {
				className: "text-right font-mono tabular-nums",
				children: e.count
			})] }, e.id)) })] })] }), /* @__PURE__ */ z(a, { children: [
				/* @__PURE__ */ R(o, {
					title: "Mining",
					description: `About ${D(e.totals.mined_value)} at average prices.`
				}),
				e.mining.length === 0 ? /* @__PURE__ */ R("p", {
					className: "px-card pb-4 text-sm text-muted",
					children: "No mining in this period."
				}) : /* @__PURE__ */ z(v, { children: [/* @__PURE__ */ R(g, { children: /* @__PURE__ */ z("tr", { children: [
					/* @__PURE__ */ R(S, { children: "Ore" }),
					/* @__PURE__ */ R(S, {
						className: "text-right",
						children: "Units"
					}),
					/* @__PURE__ */ R(S, {
						className: "text-right",
						children: "Value"
					})
				] }) }), /* @__PURE__ */ R("tbody", { children: e.mining.map((e) => /* @__PURE__ */ z(C, { children: [
					/* @__PURE__ */ R(b, { children: /* @__PURE__ */ R(X, { t: e }) }),
					/* @__PURE__ */ R(b, {
						className: "text-right font-mono tabular-nums",
						children: O(e.quantity)
					}),
					/* @__PURE__ */ R(b, {
						className: "text-right font-mono tabular-nums",
						children: D(e.value)
					})
				] }, e.id)) })] }),
				e.mining_systems.length > 0 && /* @__PURE__ */ z("p", {
					className: "px-card pb-4 pt-2 text-xs text-muted",
					children: [
						"Mined in ",
						e.mining_systems.map((e) => e.name).join(", "),
						"."
					]
				})
			] })]
		}), /* @__PURE__ */ z(a, { children: [/* @__PURE__ */ R(o, {
			title: "Killmails",
			description: "Newest first, up to 100."
		}), e.killmails.length === 0 ? /* @__PURE__ */ R("p", {
			className: "px-card pb-4 text-sm text-muted",
			children: "No killmails in this period."
		}) : /* @__PURE__ */ z(v, { children: [/* @__PURE__ */ R(g, { children: /* @__PURE__ */ z("tr", { children: [
			/* @__PURE__ */ R(S, { children: "When" }),
			/* @__PURE__ */ R(S, {}),
			/* @__PURE__ */ R(S, { children: "Character" }),
			/* @__PURE__ */ R(S, { children: "Victim ship" }),
			/* @__PURE__ */ R(S, { children: "System" }),
			/* @__PURE__ */ R(S, {
				className: "text-right",
				children: "Value"
			}),
			/* @__PURE__ */ R(S, {})
		] }) }), /* @__PURE__ */ R("tbody", { children: e.killmails.map((e) => /* @__PURE__ */ z(C, { children: [
			/* @__PURE__ */ R(b, {
				className: "whitespace-nowrap text-muted",
				children: E(e.time)
			}),
			/* @__PURE__ */ R(b, { children: e.is_loss ? /* @__PURE__ */ R(t, {
				tone: "danger",
				children: "Loss"
			}) : /* @__PURE__ */ R(t, {
				tone: "success",
				children: "Kill"
			}) }),
			/* @__PURE__ */ R(b, { children: e.character }),
			/* @__PURE__ */ R(b, { children: /* @__PURE__ */ R(X, { t: e.victim_ship }) }),
			/* @__PURE__ */ R(b, { children: /* @__PURE__ */ R(Y, { s: e.system }) }),
			/* @__PURE__ */ R(b, {
				className: "text-right font-mono tabular-nums",
				children: D(e.value)
			}),
			/* @__PURE__ */ R(b, {
				className: "text-right",
				children: /* @__PURE__ */ R("a", {
					href: `https://zkillboard.com/kill/${e.id}/`,
					target: "_blank",
					rel: "noreferrer",
					className: "text-muted hover:text-text",
					"aria-label": "Open on zKillboard",
					children: /* @__PURE__ */ R(W, {})
				})
			})
		] }, e.id)) })] })] })]
	});
}
function ye({ r: e }) {
	return e.timeline.length ? /* @__PURE__ */ z(a, { children: [/* @__PURE__ */ R(o, {
		title: "Timeline",
		description: e.timeline_total > e.timeline.length ? `The latest ${e.timeline.length} of ${O(e.timeline_total)} stints.` : "Every stint, newest first."
	}), /* @__PURE__ */ z(v, { children: [/* @__PURE__ */ R(g, { children: /* @__PURE__ */ z("tr", { children: [
		/* @__PURE__ */ R(S, { children: "From" }),
		/* @__PURE__ */ R(S, { children: "For" }),
		/* @__PURE__ */ R(S, { children: "Character" }),
		/* @__PURE__ */ R(S, { children: "System" }),
		/* @__PURE__ */ R(S, { children: "Ship" }),
		/* @__PURE__ */ R(S, { children: "Docked at" })
	] }) }), /* @__PURE__ */ R("tbody", { children: e.timeline.map((e, t) => /* @__PURE__ */ z(C, { children: [
		/* @__PURE__ */ R(b, {
			className: "whitespace-nowrap text-muted",
			title: `until ${E(e.ended_at)}`,
			children: E(e.started_at)
		}),
		/* @__PURE__ */ R(b, {
			className: "whitespace-nowrap font-mono tabular-nums",
			children: q(e.seconds)
		}),
		/* @__PURE__ */ R(b, { children: e.character }),
		/* @__PURE__ */ R(b, { children: /* @__PURE__ */ R(Y, { s: e.system }) }),
		/* @__PURE__ */ R(b, { children: e.ship ? /* @__PURE__ */ R(X, {
			t: e.ship,
			sub: e.ship_name || void 0
		}) : /* @__PURE__ */ R("span", {
			className: "text-subtle",
			children: "—"
		}) }),
		/* @__PURE__ */ R(b, {
			className: "text-muted",
			children: e.docked ?? "In space"
		})
	] }, t)) })] })] }) : /* @__PURE__ */ R(l, {
		icon: /* @__PURE__ */ R(V, {}),
		title: "Nothing yet",
		description: "Stints show up here once one of their characters is seen online."
	});
}
//#endregion
//#region src/index.tsx
var be = ne({ routes: [{
	path: "",
	Component: se
}, {
	path: ":id",
	Component: de
}] });
//#endregion
export { be as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","about","accent","account","action","actions","all","already","alt","alts","amount","an","and","any","are","aren","aria-label","as","at","audit","autoFocus","average","bad","be","being","between","bg-accent","block","boolean","border","border-border","but","button","by","by_day","by_hour","called","can","cell","character","characters","children","className","confirmLabel","const","corporation","couldn","count","currentColor","cx","cy","danger","data","date","day","days","default","definePlugin","delete","deleted","description","destroyed","didn","disabled","divide-border","divide-y","docked","docked_seconds","doesn","each","earn","earned","enabled","end","ended_at","ends","ends_at","error","every","export","extends","eyebrow","false","far","few","fill","filter","finished","first","flew","flex","flex-1","flex-col","flex-wrap","flown","fly","flying","followed","font-medium","font-mono","footer","for","format","found","from","function","gap-0.5","gap-1","gap-1.5","gap-2","gap-3","gap-6","get","ghost","goes","gone","grid","grid-cols-2","group","h","h-40","h-48","h-96","h-full","has","hash","head","height","here","hint","hour","hover:bg-hover","hover:text-accent-ink","hover:text-text","how","href","icon","icons","id","if","img","import","in","including","income","info","inline","inline-flex","interface","is","isFetching","isLoading","is_loss","isk","isk_destroyed","isk_lost","isk_systems","isn","it","items","items-baseline","items-center","items-end","justify-between","justify-end","kept","key","killmail_ships","killmails","kills","label","last_polled_at","latest","length","lg:grid-cols-2","link","loading","log","losses","lost","m","m12","m13.41","made","main","many","matched","max","max-h-60","max-w-xs","maxHour","maxLength","mb-3","mb-4","mb-6","md","md:grid-cols-4","member","members","min","minHeight","mined_value","mining","mining_systems","minute","missing_scopes","moved","mt-1","mutationFn","n","name","navigate","neutral","new","newest","no","nobody","none","noreferrer","not","now","null","number","of","ok","on","onChange","onClick","onClose","onConfirm","onError","onOpenChange","onSuccess","onValueChange","once","one","online","online_seconds","open","options","or","other","outline","overflow-y-auto","overview","own","page","path","payouts","pb-4","pending","per","period","picked","pills","placeholder","play","portrait","post","primary","pt-2","px-3","px-card","py-2","qc","quantity","queryFn","queryKey","quick","r","re","react","react-router","reads","reason","recorded","ref_type","refetchInterval","region","regions","rel","remove","report","rest","return","role","round","rounded","rounded-t-sm","routes","rows","running","rx","s","sat","say","search","seconds","security","see","seen","session","sessions","setConfirm","setDays","setFilter","setOut","setPicked","setQ","setReason","setStarting","setTab","sheet","ship","ship_name","ships","show","shrink-0","site","size","size-4","size-6","sm","snooper","so","someone","space","space-y-2","space-y-3","space-y-4","space-y-6","spending","spent","src","start","started","started_at","started_by","starting","status","status_detail","status_label","stay","still","stop","stopped_by","stops","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structures","style","sub","success","swap","sync","system","systems","t","tabular-nums","target","target_name","text-danger-fg","text-left","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-warning-fg","text-xs","that","the","their","they","this","through","tied","time","timeline","timeline_total","title","to","token_invalid","tone","top_ship","top_system","total","totals","tracked","trackers","tracking","truncate","type","under","until","up","useNavigate","useParams","useQueryClient","useState","used","user_id","v","valid","value","valueText","variant","victim_ship","viewBox","void","w-24","w-full","wallet","warning","was","wasn","we","were","what","when","where","which","while","whitespace-nowrap","who","whose","width","yet","you","zKillboard"];
