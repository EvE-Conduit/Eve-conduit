import { Avatar as e, Badge as t, BarChart as n, Button as r, Callout as i, Card as a, CardHeader as o, ConfirmDialog as s, Dialog as c, EmptyState as l, Field as u, Input as d, Meter as f, PageHeader as p, SearchInput as m, Segmented as h, Skeleton as g, StatCard as _, THead as v, TabPanel as y, Table as b, Tabs as x, Td as S, Textarea as C, Th as w, Tr as T, api as E, date as D, dateTime as O, definePlugin as ee, humanize as te, isk as k, num as A, timeAgo as j, toast as M } from "@conduit/sdk";
import { useMutation as N, useQuery as P, useQueryClient as F } from "@tanstack/react-query";
import { useEffect as ne, useState as I } from "react";
import { Link as L, useNavigate as R, useParams as re } from "react-router";
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
		/* @__PURE__ */ B("path", { d: "M19.07 4.93A10 10 0 0 0 6.99 3.34" }),
		/* @__PURE__ */ B("path", { d: "M4 6h.01" }),
		/* @__PURE__ */ B("path", { d: "M2.29 9.62A10 10 0 1 0 21.31 8.35" }),
		/* @__PURE__ */ B("path", { d: "M16.24 7.76A6 6 0 1 0 8.23 16.67" }),
		/* @__PURE__ */ B("path", { d: "M12 18h.01" }),
		/* @__PURE__ */ B("path", { d: "M17.99 11.66A6 6 0 0 1 15.77 16.67" }),
		/* @__PURE__ */ B("circle", {
			cx: "12",
			cy: "12",
			r: "2"
		}),
		/* @__PURE__ */ B("path", { d: "m13.41 10.59 5.66-5.66" })
	]
}), W = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M5 12h14" }), /* @__PURE__ */ B("path", { d: "M12 5v14" })]
}), ie = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M3 6h18" }),
		/* @__PURE__ */ B("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ B("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), ae = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ B("path", { d: "M19 12H5" })]
}), oe = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ B("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ B("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), se = (e) => /* @__PURE__ */ B(H, {
	...e,
	children: /* @__PURE__ */ B("rect", {
		x: "5",
		y: "5",
		width: "14",
		height: "14",
		rx: "1"
	})
}), G = "/api/p/tracking", K = [
	1,
	7,
	14,
	30,
	60
];
function q(e) {
	if (e < 60) return e > 0 ? "under a minute" : "0m";
	let t = Math.round(e / 60), n = Math.floor(t / 60);
	return n ? `${n}h ${t % 60}m` : `${t}m`;
}
//#endregion
//#region src/newmembers.tsx
function ce(e) {
	return {
		id: e.id,
		name: e.name,
		portrait: e.portrait,
		corporation: e.corporation,
		matched: null,
		characters: e.characters.length,
		tracked: e.tracked
	};
}
function le({ onTrack: n }) {
	let [i, s] = I("7"), [c, l] = I(/* @__PURE__ */ new Set()), [u, d] = I(!1), { data: f, isLoading: p } = P({
		queryKey: [
			"tracking",
			"new-members",
			i
		],
		queryFn: () => E.get(`${G}/new-members?days=${i}`)
	}), m = f?.members.filter((e) => !e.tracked) ?? [], _ = m.filter((e) => c.has(e.id)), y = (e) => l((t) => {
		let n = new Set(t);
		return n.has(e) ? n.delete(e) : n.add(e), n;
	}), x = m.length > 0 && _.length === m.length;
	return /* @__PURE__ */ V(a, {
		className: "mb-6",
		children: [
			/* @__PURE__ */ B(o, {
				title: "New members",
				description: "Members with a character that joined its corporation recently, from the corporation's member tracking or the character's corporation history.",
				actions: /* @__PURE__ */ V("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ B(h, {
						size: "sm",
						value: i,
						onChange: (e) => {
							s(e), l(/* @__PURE__ */ new Set());
						},
						"aria-label": "Joined within",
						options: [
							{
								value: "3",
								label: "3 days"
							},
							{
								value: "7",
								label: "7 days"
							},
							{
								value: "14",
								label: "14 days"
							},
							{
								value: "30",
								label: "30 days"
							}
						]
					}), /* @__PURE__ */ V(r, {
						size: "sm",
						variant: "primary",
						disabled: !_.length,
						onClick: () => d(!0),
						children: [
							/* @__PURE__ */ B(W, {}),
							" Track ",
							_.length ? _.length : "",
							" selected"
						]
					})]
				})
			}),
			p || !f ? /* @__PURE__ */ B(g, { className: "mx-card mb-4 h-24" }) : f.members.length === 0 && f.unregistered.length === 0 ? /* @__PURE__ */ V("p", {
				className: "px-card pb-4 text-sm text-muted",
				children: [
					"Nobody joined in the last ",
					f.days,
					" days."
				]
			}) : /* @__PURE__ */ V(z, { children: [f.members.length > 0 && /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [
				/* @__PURE__ */ B(w, {
					className: "w-8",
					children: /* @__PURE__ */ B("input", {
						type: "checkbox",
						"aria-label": "Select everyone not tracked yet",
						checked: x,
						disabled: !m.length,
						onChange: () => l(x ? /* @__PURE__ */ new Set() : new Set(m.map((e) => e.id)))
					})
				}),
				/* @__PURE__ */ B(w, { children: "Member" }),
				/* @__PURE__ */ B(w, { children: "Joined" }),
				/* @__PURE__ */ B(w, { children: "Characters that joined" }),
				/* @__PURE__ */ B(w, {})
			] }) }), /* @__PURE__ */ B("tbody", { children: f.members.map((i) => /* @__PURE__ */ V(T, { children: [
				/* @__PURE__ */ B(S, { children: /* @__PURE__ */ B("input", {
					type: "checkbox",
					"aria-label": `Select ${i.name}`,
					disabled: i.tracked,
					checked: c.has(i.id),
					onChange: () => y(i.id)
				}) }),
				/* @__PURE__ */ B(S, { children: /* @__PURE__ */ V("span", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ B(e, {
						src: i.portrait,
						name: i.name,
						size: "sm"
					}), /* @__PURE__ */ V("span", { children: [/* @__PURE__ */ B("span", {
						className: "block font-medium",
						children: i.name
					}), /* @__PURE__ */ B("span", {
						className: "block text-xs text-muted",
						children: i.corporation ?? "No corporation"
					})] })]
				}) }),
				/* @__PURE__ */ B(S, {
					className: "whitespace-nowrap text-muted",
					title: D(i.joined_at),
					children: j(i.joined_at)
				}),
				/* @__PURE__ */ B(S, {
					className: "text-sm",
					children: i.characters.map((e) => /* @__PURE__ */ V("span", {
						className: "mr-3 inline-block",
						children: [
							e.name,
							e.main && /* @__PURE__ */ B("span", {
								className: "text-muted",
								children: " (main)"
							}),
							/* @__PURE__ */ V("span", {
								className: "text-muted",
								children: [
									" → ",
									e.corporation ?? "?",
									", ",
									D(e.joined_at)
								]
							})
						]
					}, e.id))
				}),
				/* @__PURE__ */ B(S, {
					className: "text-right",
					children: i.tracked ? /* @__PURE__ */ B(L, {
						to: `/p/tracking/${i.session_id}`,
						children: /* @__PURE__ */ B(t, {
							tone: "accent",
							children: "Being tracked"
						})
					}) : /* @__PURE__ */ B(r, {
						size: "sm",
						variant: "outline",
						onClick: () => n(ce(i)),
						children: "Track"
					})
				})
			] }, i.id)) })] }), f.unregistered.length > 0 && /* @__PURE__ */ V("div", {
				className: "px-card pb-4 pt-3 text-sm",
				children: [
					/* @__PURE__ */ B("div", {
						className: "mb-1 font-medium",
						children: "Not on the site yet"
					}),
					/* @__PURE__ */ B("p", {
						className: "mb-2 text-xs text-muted",
						children: "These joined but nobody has added them to the site, so they can't be tracked until they log in with them."
					}),
					/* @__PURE__ */ B("div", {
						className: "flex flex-wrap gap-2",
						children: f.unregistered.map((t) => /* @__PURE__ */ V("span", {
							className: "inline-flex items-center gap-1.5 border border-border px-2 py-1",
							title: `Joined ${t.corporation} ${D(t.joined_at)}`,
							children: [
								/* @__PURE__ */ B(e, {
									src: t.portrait,
									name: t.name,
									size: "sm"
								}),
								t.name,
								/* @__PURE__ */ B("span", {
									className: "text-xs text-muted",
									children: j(t.joined_at)
								})
							]
						}, t.id))
					})
				]
			})] }),
			u && /* @__PURE__ */ B(ue, {
				members: _,
				onClose: (e) => {
					d(!1), e && l(/* @__PURE__ */ new Set());
				}
			})
		]
	});
}
function ue({ members: e, onClose: t }) {
	let n = F(), [i, a] = I("7"), [o, s] = I("New member"), l = Number(i), f = Number.isInteger(l) && l >= 1 && l <= 60, p = N({
		mutationFn: () => E.post(`${G}/sessions/many`, {
			user_ids: e.map((e) => e.id),
			days: l,
			reason: o
		}),
		onSuccess: (r) => {
			n.invalidateQueries({ queryKey: ["tracking"] }), r.started.length && M.success(`Tracking ${r.started.length} member${r.started.length === 1 ? "" : "s"} for ${l} day${l === 1 ? "" : "s"}`);
			for (let t of r.failed) M.error(`${e.find((e) => e.id === t.user_id)?.name ?? "A member"}: ${t.error}`);
			t(!0);
		},
		onError: (e) => M.error(e.message)
	});
	return /* @__PURE__ */ B(c, {
		open: !0,
		onOpenChange: (e) => !e && t(!1),
		title: `Track ${e.length} new member${e.length === 1 ? "" : "s"}`,
		description: e.map((e) => e.name).join(", "),
		footer: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(r, {
			variant: "ghost",
			onClick: () => t(!1),
			children: "Cancel"
		}), /* @__PURE__ */ B(r, {
			variant: "primary",
			disabled: !f,
			loading: p.isPending,
			onClick: () => p.mutate(),
			children: "Start tracking"
		})] }),
		children: /* @__PURE__ */ V("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ B(u, {
				label: "For how many days",
				hint: "1 to 60 days. Each member is followed with all their characters; they aren't told.",
				children: /* @__PURE__ */ V("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ B(d, {
						className: "w-24",
						type: "number",
						min: 1,
						max: 60,
						value: i,
						onChange: (e) => a(e.target.value)
					}), K.map((e) => /* @__PURE__ */ V(r, {
						size: "sm",
						variant: String(e) === i ? "primary" : "outline",
						onClick: () => a(String(e)),
						children: [e, "d"]
					}, e))]
				})
			}), /* @__PURE__ */ B(u, {
				label: "Reason",
				hint: "Optional. Only other trackers and the audit log see it.",
				children: /* @__PURE__ */ B(C, {
					rows: 2,
					maxLength: 1e3,
					value: o,
					onChange: (e) => s(e.target.value)
				})
			})]
		})
	});
}
//#endregion
//#region src/sessions.tsx
function de() {
	let [t, n] = I(""), [i, a] = I(!1), { data: o, isLoading: s } = P({
		queryKey: [
			"tracking",
			"sessions",
			t
		],
		queryFn: () => E.get(`${G}/sessions?state=${t}&limit=200`),
		refetchInterval: 6e4
	});
	return /* @__PURE__ */ V(z, { children: [
		/* @__PURE__ */ B(p, {
			eyebrow: "HR",
			title: "Activity Tracking",
			icon: /* @__PURE__ */ B(U, {}),
			description: "Follow a member and all their alts for 1 to 60 days: the systems they're in, the ships they fly, what they earn and when they play. The member is not told.",
			actions: /* @__PURE__ */ V(r, {
				variant: "primary",
				onClick: () => a(!0),
				children: [/* @__PURE__ */ B(W, {}), " Track a member"]
			})
		}),
		/* @__PURE__ */ B(le, { onTrack: a }),
		/* @__PURE__ */ B("div", {
			className: "mb-4",
			children: /* @__PURE__ */ B(h, {
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
		s || !o ? /* @__PURE__ */ B(g, { className: "h-48" }) : o.items.length === 0 ? /* @__PURE__ */ B(l, {
			icon: /* @__PURE__ */ B(U, {}),
			title: t === "finished" ? "No finished tracking" : "Nobody is being tracked",
			description: "Pick a member by their main or any alt; every character on their account is followed.",
			action: /* @__PURE__ */ V(r, {
				variant: "primary",
				onClick: () => a(!0),
				children: [/* @__PURE__ */ B(W, {}), " Track a member"]
			})
		}) : /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [
			/* @__PURE__ */ B(w, { children: "Member" }),
			/* @__PURE__ */ B(w, { children: "Period" }),
			/* @__PURE__ */ B(w, { children: "Status" }),
			/* @__PURE__ */ B(w, { children: "Started by" }),
			/* @__PURE__ */ B(w, { children: "Reason" })
		] }) }), /* @__PURE__ */ B("tbody", { children: o.items.map((t) => /* @__PURE__ */ V(T, { children: [
			/* @__PURE__ */ B(S, { children: /* @__PURE__ */ V(L, {
				to: `/p/tracking/${t.id}`,
				className: "flex items-center gap-2 hover:text-accent-ink",
				children: [/* @__PURE__ */ B(e, {
					src: t.target.portrait,
					name: t.target.name,
					size: "sm"
				}), /* @__PURE__ */ V("span", { children: [/* @__PURE__ */ B("span", {
					className: "block font-medium",
					children: t.target.name
				}), /* @__PURE__ */ B("span", {
					className: "block text-xs text-muted",
					children: t.target.corporation ?? "No corporation"
				})] })]
			}) }),
			/* @__PURE__ */ V(S, {
				className: "whitespace-nowrap text-muted",
				children: [
					D(t.started_at),
					" – ",
					D(t.ended_at ?? t.ends_at),
					" · ",
					t.days,
					" day",
					t.days === 1 ? "" : "s"
				]
			}),
			/* @__PURE__ */ B(S, { children: /* @__PURE__ */ B(J, { s: t }) }),
			/* @__PURE__ */ B(S, {
				className: "text-muted",
				children: t.started_by ?? "—"
			}),
			/* @__PURE__ */ B(S, {
				className: "max-w-xs truncate text-muted",
				title: t.reason,
				children: t.reason || "—"
			})
		] }, t.id)) })] }),
		i && /* @__PURE__ */ B(pe, {
			initial: i === !0 ? null : i,
			onClose: () => a(!1)
		})
	] });
}
function J({ s: e }) {
	return e.running ? /* @__PURE__ */ V(t, {
		tone: "accent",
		children: ["Running · ends ", j(e.ends_at)]
	}) : e.stopped_by ? /* @__PURE__ */ V(t, {
		tone: "neutral",
		children: ["Stopped by ", e.stopped_by]
	}) : /* @__PURE__ */ B(t, {
		tone: "success",
		children: "Finished"
	});
}
function fe(e) {
	let [t, n] = I(e);
	return ne(() => {
		let t = setTimeout(() => n(e.trim()), 250);
		return () => clearTimeout(t);
	}, [e]), t;
}
function pe({ initial: n, onClose: a }) {
	let o = F(), s = R(), [l, f] = I(""), [p, h] = I(n), [g, _] = I("7"), [v, y] = I(""), b = fe(l), { data: x, isFetching: S } = P({
		queryKey: [
			"tracking",
			"members",
			b
		],
		queryFn: () => E.get(`${G}/members?q=${encodeURIComponent(b)}`),
		enabled: b.length >= 2 && !p
	}), w = Number(g), T = p && !p.tracked && Number.isInteger(w) && w >= 1 && w <= 60, D = N({
		mutationFn: () => E.post(`${G}/sessions`, {
			user_id: p.id,
			days: w,
			reason: v
		}),
		onSuccess: (e) => {
			o.invalidateQueries({ queryKey: ["tracking"] }), M.success(`Tracking ${e.target.name} for ${e.days} day${e.days === 1 ? "" : "s"}`), s(`/p/tracking/${e.id}`);
		},
		onError: (e) => M.error(e.message)
	});
	return /* @__PURE__ */ B(c, {
		open: !0,
		onOpenChange: (e) => !e && a(),
		title: "Track a member",
		description: "Every character on their account is followed, including alts they link while it runs. They aren't told.",
		footer: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(r, {
			variant: "ghost",
			onClick: a,
			children: "Cancel"
		}), /* @__PURE__ */ B(r, {
			variant: "primary",
			disabled: !T,
			loading: D.isPending,
			onClick: () => D.mutate(),
			children: "Start tracking"
		})] }),
		children: /* @__PURE__ */ V("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ B(u, {
					label: "Member",
					hint: "Search by their main or any alt.",
					children: p ? /* @__PURE__ */ V("div", {
						className: "flex items-center justify-between gap-2 border border-border px-3 py-2",
						children: [/* @__PURE__ */ V("span", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ B(e, {
								src: p.portrait,
								name: p.name,
								size: "sm"
							}), /* @__PURE__ */ V("span", { children: [/* @__PURE__ */ B("span", {
								className: "block font-medium",
								children: p.name
							}), /* @__PURE__ */ V("span", {
								className: "block text-xs text-muted",
								children: [
									p.corporation ?? "No corporation",
									" · ",
									p.characters,
									" character",
									p.characters === 1 ? "" : "s"
								]
							})] })]
						}), /* @__PURE__ */ B(r, {
							size: "sm",
							variant: "ghost",
							onClick: () => h(null),
							children: "Change"
						})]
					}) : /* @__PURE__ */ V("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ B(m, {
							value: l,
							onChange: (e) => f(e.target.value),
							placeholder: "Character name",
							"aria-label": "Character name",
							autoFocus: !0
						}), b.length >= 2 && /* @__PURE__ */ B("ul", {
							className: "max-h-60 divide-y divide-border overflow-y-auto border border-border",
							children: S && !x ? /* @__PURE__ */ B("li", {
								className: "px-3 py-2 text-sm text-muted",
								children: "Searching…"
							}) : x?.items.length === 0 ? /* @__PURE__ */ B("li", {
								className: "px-3 py-2 text-sm text-muted",
								children: x?.reason === "own" ? "That's one of your own characters. Nobody can track themselves." : x?.reason === "no_reach" ? "You can't see anyone else's characters. Tracking also needs a character sheet permission (all, alliance or corporation characters) under Administration → Groups." : "No member you can see has a character called that."
							}) : x?.items.map((n) => /* @__PURE__ */ B("li", { children: /* @__PURE__ */ V("button", {
								type: "button",
								onClick: () => h(n),
								className: "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-hover",
								children: [
									/* @__PURE__ */ B(e, {
										src: n.portrait,
										name: n.name,
										size: "sm"
									}),
									/* @__PURE__ */ V("span", {
										className: "flex-1",
										children: [/* @__PURE__ */ B("span", {
											className: "block font-medium",
											children: n.name
										}), /* @__PURE__ */ V("span", {
											className: "block text-xs text-muted",
											children: [n.matched ? `Alt: ${n.matched} · ` : "", n.corporation ?? "No corporation"]
										})]
									}),
									n.tracked && /* @__PURE__ */ B(t, {
										tone: "accent",
										children: "Being tracked"
									})
								]
							}) }, n.id))
						})]
					})
				}),
				p?.tracked && /* @__PURE__ */ V(i, {
					tone: "warning",
					children: [p.name, " is already being tracked. Stop that first to start again."]
				}),
				/* @__PURE__ */ B(u, {
					label: "For how many days",
					hint: "1 to 60 days.",
					children: /* @__PURE__ */ V("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ B(d, {
							className: "w-24",
							type: "number",
							min: 1,
							max: 60,
							value: g,
							onChange: (e) => _(e.target.value)
						}), K.map((e) => /* @__PURE__ */ V(r, {
							size: "sm",
							variant: String(e) === g ? "primary" : "outline",
							onClick: () => _(String(e)),
							children: [e, "d"]
						}, e))]
					})
				}),
				/* @__PURE__ */ B(u, {
					label: "Reason",
					hint: "Optional. Only other trackers and the audit log see it.",
					children: /* @__PURE__ */ B(C, {
						rows: 2,
						maxLength: 1e3,
						value: v,
						onChange: (e) => y(e.target.value)
					})
				})
			]
		})
	});
}
//#endregion
//#region src/report.tsx
function me() {
	let { id: t } = re(), [n, r] = I("overview"), { data: i, isLoading: a, error: o } = P({
		queryKey: [
			"tracking",
			"report",
			t
		],
		queryFn: () => E.get(`${G}/sessions/${t}`),
		refetchInterval: (e) => e.state.data?.session.running ? 6e4 : !1
	});
	if (o) return /* @__PURE__ */ B(l, {
		icon: /* @__PURE__ */ B(U, {}),
		title: "Not found",
		description: "This tracking was deleted, or it's on a member you can't see."
	});
	if (a || !i) return /* @__PURE__ */ B(g, { className: "h-96" });
	let s = i.session, c = i.totals;
	return /* @__PURE__ */ V(z, { children: [
		/* @__PURE__ */ V(L, {
			to: "/p/tracking",
			className: "mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ B(ae, {}), " Activity Tracking"]
		}),
		/* @__PURE__ */ B(p, {
			eyebrow: "Activity report",
			title: s.target.name,
			icon: /* @__PURE__ */ B(e, {
				src: s.target.portrait,
				name: s.target.name,
				size: "md"
			}),
			description: /* @__PURE__ */ V("span", {
				className: "inline-flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ B(J, { s }), /* @__PURE__ */ V("span", { children: [
					O(i.period.start),
					" – ",
					O(i.period.end),
					" · started by ",
					s.started_by ?? "someone",
					s.reason ? ` · ${s.reason}` : ""
				] })]
			}),
			actions: /* @__PURE__ */ B(he, { report: i })
		}),
		/* @__PURE__ */ B(ge, { characters: i.characters }),
		/* @__PURE__ */ V("div", {
			className: "mb-6 grid grid-cols-2 gap-3 md:grid-cols-4",
			children: [
				/* @__PURE__ */ B(_, {
					label: "Time online",
					value: q(c.online_seconds),
					hint: `${q(c.docked_seconds)} docked`
				}),
				/* @__PURE__ */ B(_, {
					label: "Systems",
					value: A(c.systems),
					hint: `${c.regions} region${c.regions === 1 ? "" : "s"} · ${c.ships} ship type${c.ships === 1 ? "" : "s"}`
				}),
				/* @__PURE__ */ B(_, {
					label: "ISK earned",
					value: k(c.earned),
					hint: `${k(c.spent)} spent`,
					tone: "success"
				}),
				/* @__PURE__ */ B(_, {
					label: "Kills / losses",
					value: `${c.kills} / ${c.losses}`,
					hint: `${k(c.isk_destroyed)} destroyed · ${k(c.isk_lost)} lost`
				})
			]
		}),
		/* @__PURE__ */ V(x, {
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
				/* @__PURE__ */ B(y, {
					value: "overview",
					children: /* @__PURE__ */ B(ve, { r: i })
				}),
				/* @__PURE__ */ B(y, {
					value: "where",
					children: /* @__PURE__ */ B(ye, { r: i })
				}),
				/* @__PURE__ */ B(y, {
					value: "isk",
					children: /* @__PURE__ */ B(be, { r: i })
				}),
				/* @__PURE__ */ B(y, {
					value: "kills",
					children: /* @__PURE__ */ B(xe, { r: i })
				}),
				/* @__PURE__ */ B(y, {
					value: "timeline",
					children: /* @__PURE__ */ B(Se, { r: i })
				})
			]
		})
	] });
}
function he({ report: e }) {
	let t = e.session, n = F(), i = R(), [a, o] = I(null), c = N({
		mutationFn: () => E.post(`${G}/sessions/${t.id}/stop`),
		onSuccess: () => {
			n.invalidateQueries({ queryKey: ["tracking"] }), M.success("Tracking stopped; the report is kept");
		},
		onError: (e) => M.error(e.message)
	}), l = N({
		mutationFn: () => E.delete(`${G}/sessions/${t.id}`),
		onSuccess: () => {
			n.invalidateQueries({ queryKey: ["tracking"] }), M.success("Tracking deleted"), i("/p/tracking");
		},
		onError: (e) => M.error(e.message)
	});
	return /* @__PURE__ */ V("div", {
		className: "flex gap-2",
		children: [
			t.running && /* @__PURE__ */ V(r, {
				variant: "outline",
				onClick: () => o("stop"),
				children: [/* @__PURE__ */ B(se, {}), " Stop"]
			}),
			/* @__PURE__ */ V(r, {
				variant: "outline",
				onClick: () => o("delete"),
				children: [/* @__PURE__ */ B(ie, {}), " Delete"]
			}),
			/* @__PURE__ */ B(s, {
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
function ge({ characters: e }) {
	let t = e.filter((e) => e.status !== "ok" && e.status !== "pending" && e.status !== "gone");
	return t.length ? /* @__PURE__ */ V(i, {
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
function _e({ value: e }) {
	return e == null ? null : /* @__PURE__ */ B("span", {
		className: `font-mono text-xs tabular-nums ${e >= .45 ? "text-success-fg" : e > 0 ? "text-warning-fg" : "text-danger-fg"}`,
		children: e.toFixed(1)
	});
}
function Y({ s: e }) {
	return /* @__PURE__ */ V("span", {
		className: "inline-flex items-baseline gap-1.5",
		children: [
			/* @__PURE__ */ B(_e, { value: e.security }),
			/* @__PURE__ */ B("span", { children: e.name }),
			e.region && /* @__PURE__ */ B("span", {
				className: "text-xs text-muted",
				children: e.region
			})
		]
	});
}
function X({ t: e, sub: t }) {
	return /* @__PURE__ */ V("span", {
		className: "inline-flex items-center gap-2",
		children: [/* @__PURE__ */ B("img", {
			src: e.icon,
			alt: "",
			className: "size-6 shrink-0 rounded"
		}), /* @__PURE__ */ V("span", { children: [/* @__PURE__ */ B("span", {
			className: "block",
			children: e.name
		}), t && /* @__PURE__ */ B("span", {
			className: "block text-xs text-muted",
			children: t
		})] })]
	});
}
function ve({ r }) {
	let i = Math.max(1, ...r.by_hour);
	return /* @__PURE__ */ V("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(o, {
				title: "Characters",
				description: "Every character on their account. Time is time online that we saw."
			}), /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [
				/* @__PURE__ */ B(w, { children: "Character" }),
				/* @__PURE__ */ B(w, { children: "Now" }),
				/* @__PURE__ */ B(w, {
					className: "text-right",
					children: "Online"
				}),
				/* @__PURE__ */ B(w, { children: "Mostly in" }),
				/* @__PURE__ */ B(w, { children: "Mostly flying" }),
				/* @__PURE__ */ B(w, {
					className: "text-right",
					children: "Earned"
				})
			] }) }), /* @__PURE__ */ B("tbody", { children: r.characters.map((n) => /* @__PURE__ */ V(T, { children: [
				/* @__PURE__ */ B(S, { children: /* @__PURE__ */ V(L, {
					to: `/characters/${n.id}`,
					className: "flex items-center gap-2 hover:text-accent-ink",
					children: [/* @__PURE__ */ B(e, {
						src: n.portrait,
						name: n.name,
						size: "sm"
					}), /* @__PURE__ */ V("span", { children: [/* @__PURE__ */ B("span", {
						className: "block font-medium",
						children: n.name
					}), n.status !== "ok" && /* @__PURE__ */ B("span", {
						className: "block text-xs text-muted",
						children: n.status_label
					})] })]
				}) }),
				/* @__PURE__ */ B(S, { children: n.now ? /* @__PURE__ */ V("span", {
					className: "text-sm",
					children: [
						/* @__PURE__ */ B(t, {
							tone: "success",
							children: "Online"
						}),
						" ",
						/* @__PURE__ */ B(Y, { s: n.now.system }),
						n.now.ship && /* @__PURE__ */ V("span", {
							className: "text-muted",
							children: [
								" · ",
								n.now.ship.name,
								n.now.docked ? " (docked)" : ""
							]
						})
					]
				}) : n.online === !1 ? /* @__PURE__ */ B("span", {
					className: "text-muted",
					children: "Offline"
				}) : /* @__PURE__ */ B("span", {
					className: "text-subtle",
					children: "—"
				}) }),
				/* @__PURE__ */ B(S, {
					className: "text-right font-mono tabular-nums",
					children: q(n.seconds)
				}),
				/* @__PURE__ */ B(S, { children: n.top_system ? /* @__PURE__ */ B(Y, { s: n.top_system }) : /* @__PURE__ */ B("span", {
					className: "text-subtle",
					children: "—"
				}) }),
				/* @__PURE__ */ B(S, { children: n.top_ship ? n.top_ship.name : /* @__PURE__ */ B("span", {
					className: "text-subtle",
					children: "—"
				}) }),
				/* @__PURE__ */ B(S, {
					className: "text-right font-mono tabular-nums",
					children: n.earned ? k(n.earned) : "—"
				})
			] }, n.id)) })] })] }),
			/* @__PURE__ */ V("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(o, {
					title: "Time online per day",
					description: "All their characters together, EVE time."
				}), /* @__PURE__ */ B("div", {
					className: "px-card pb-4",
					children: r.by_day.length ? /* @__PURE__ */ B(n, {
						data: r.by_day.map((e) => ({
							date: e.day,
							value: e.seconds
						})),
						format: q,
						label: "Time online per day"
					}) : /* @__PURE__ */ B("p", {
						className: "text-sm text-muted",
						children: "Nothing seen online yet."
					})
				})] }), /* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(o, {
					title: "When they play",
					description: "Time online by hour of day, EVE time."
				}), /* @__PURE__ */ V("div", {
					className: "px-card pb-4",
					children: [/* @__PURE__ */ B("div", {
						className: "flex h-40 items-end gap-0.5",
						role: "img",
						"aria-label": "Time online by hour of day",
						children: r.by_hour.map((e, t) => /* @__PURE__ */ B("div", {
							className: "flex h-full flex-1 flex-col justify-end",
							title: `${String(t).padStart(2, "0")}:00 · ${q(e)}`,
							children: /* @__PURE__ */ B("div", {
								className: "w-full rounded-t-sm bg-accent",
								style: {
									height: `${e / i * 100}%`,
									minHeight: e ? 2 : 0
								}
							})
						}, t))
					}), /* @__PURE__ */ V("div", {
						className: "mt-1 flex justify-between font-mono text-xs text-muted",
						children: [
							/* @__PURE__ */ B("span", { children: "00" }),
							/* @__PURE__ */ B("span", { children: "06" }),
							/* @__PURE__ */ B("span", { children: "12" }),
							/* @__PURE__ */ B("span", { children: "18" }),
							/* @__PURE__ */ B("span", { children: "23" })
						]
					})]
				})] })]
			}),
			/* @__PURE__ */ V("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ B(Z, {
					title: "Top systems",
					items: r.systems.slice(0, 8),
					total: r.totals.online_seconds,
					name: (e) => /* @__PURE__ */ B(Y, { s: e })
				}), /* @__PURE__ */ B(Z, {
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
	return /* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(o, { title: e }), /* @__PURE__ */ B("div", {
		className: "space-y-3 px-card pb-4",
		children: t.length === 0 ? /* @__PURE__ */ B("p", {
			className: "text-sm text-muted",
			children: "Nothing seen yet."
		}) : t.map((e, t) => /* @__PURE__ */ B(f, {
			label: r(e),
			valueText: `${q(e.seconds)} · ${n ? Math.round(e.seconds / n * 100) : 0}%`,
			value: n ? e.seconds / n * 100 : 0
		}, t))
	})] });
}
function Q({ title: e, description: t, items: n, total: r, head: i, cell: s }) {
	return /* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(o, {
		title: e,
		description: t
	}), n.length === 0 ? /* @__PURE__ */ B("p", {
		className: "px-card pb-4 text-sm text-muted",
		children: "Nothing seen yet."
	}) : /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [
		/* @__PURE__ */ B(w, { children: i }),
		/* @__PURE__ */ B(w, {
			className: "text-right",
			children: "Time"
		}),
		/* @__PURE__ */ B(w, {
			className: "text-right",
			children: "Share"
		}),
		/* @__PURE__ */ B(w, { children: "Characters" })
	] }) }), /* @__PURE__ */ B("tbody", { children: n.map((e, t) => /* @__PURE__ */ V(T, { children: [
		/* @__PURE__ */ B(S, { children: s(e) }),
		/* @__PURE__ */ B(S, {
			className: "text-right font-mono tabular-nums",
			children: q(e.seconds)
		}),
		/* @__PURE__ */ V(S, {
			className: "text-right font-mono tabular-nums text-muted",
			children: [r ? Math.round(e.seconds / r * 100) : 0, "%"]
		}),
		/* @__PURE__ */ B(S, {
			className: "text-muted",
			children: e.characters.join(", ")
		})
	] }, t)) })] })] });
}
function ye({ r: e }) {
	let t = e.totals.online_seconds;
	return /* @__PURE__ */ V("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ B(i, {
				tone: "info",
				children: "Checked once a minute while a character is online, so time per system and ship is close, but a system flown straight through or a quick ship swap can be missed."
			}),
			/* @__PURE__ */ B(Q, {
				title: "Systems",
				items: e.systems,
				total: t,
				head: "System",
				cell: (e) => /* @__PURE__ */ B(Y, { s: e })
			}),
			/* @__PURE__ */ B(Q, {
				title: "Ships",
				items: e.ships,
				total: t,
				head: "Ship",
				cell: (e) => /* @__PURE__ */ B(X, {
					t: e,
					sub: e.group
				})
			}),
			/* @__PURE__ */ V("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ B(Q, {
					title: "Regions",
					items: e.regions,
					total: t,
					head: "Region",
					cell: (e) => e.name
				}), /* @__PURE__ */ B(Q, {
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
function be({ r: e }) {
	return /* @__PURE__ */ V("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ B(i, {
				tone: "info",
				children: "From their characters' wallet journals, which sync about once an hour. ISK moved between their own characters isn't counted."
			}),
			/* @__PURE__ */ V("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ B($, {
					title: "Income",
					rows: e.income,
					total: e.totals.earned
				}), /* @__PURE__ */ B($, {
					title: "Spending",
					rows: e.spending,
					total: e.totals.spent
				})]
			}),
			/* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(o, {
				title: "Where they made ISK",
				description: "Bounties and other payouts that say which system they were earned in."
			}), e.isk_systems.length === 0 ? /* @__PURE__ */ B("p", {
				className: "px-card pb-4 text-sm text-muted",
				children: "No payouts tied to a system."
			}) : /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [/* @__PURE__ */ B(w, { children: "System" }), /* @__PURE__ */ B(w, {
				className: "text-right",
				children: "ISK"
			})] }) }), /* @__PURE__ */ B("tbody", { children: e.isk_systems.map((e) => /* @__PURE__ */ V(T, { children: [/* @__PURE__ */ B(S, { children: /* @__PURE__ */ B(Y, { s: e }) }), /* @__PURE__ */ B(S, {
				className: "text-right font-mono tabular-nums",
				children: k(e.amount)
			})] }, e.id)) })] })] })
		]
	});
}
function $({ title: e, rows: t, total: n }) {
	return /* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(o, {
		title: e,
		description: k(n)
	}), t.length === 0 ? /* @__PURE__ */ B("p", {
		className: "px-card pb-4 text-sm text-muted",
		children: "None."
	}) : /* @__PURE__ */ B("div", {
		className: "space-y-3 px-card pb-4",
		children: t.map((e) => /* @__PURE__ */ B(f, {
			label: te(e.ref_type),
			valueText: k(e.amount),
			value: n ? e.amount / n * 100 : 0
		}, e.ref_type))
	})] });
}
function xe({ r: e }) {
	return /* @__PURE__ */ V("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ V("div", {
			className: "grid gap-6 lg:grid-cols-2",
			children: [/* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(o, {
				title: "Ships on killmails",
				description: "What they flew on kills, and what they lost."
			}), e.killmail_ships.length === 0 ? /* @__PURE__ */ B("p", {
				className: "px-card pb-4 text-sm text-muted",
				children: "No killmails in this period."
			}) : /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [/* @__PURE__ */ B(w, { children: "Ship" }), /* @__PURE__ */ B(w, {
				className: "text-right",
				children: "Killmails"
			})] }) }), /* @__PURE__ */ B("tbody", { children: e.killmail_ships.map((e) => /* @__PURE__ */ V(T, { children: [/* @__PURE__ */ B(S, { children: /* @__PURE__ */ B(X, { t: e }) }), /* @__PURE__ */ B(S, {
				className: "text-right font-mono tabular-nums",
				children: e.count
			})] }, e.id)) })] })] }), /* @__PURE__ */ V(a, { children: [
				/* @__PURE__ */ B(o, {
					title: "Mining",
					description: `About ${k(e.totals.mined_value)} at average prices.`
				}),
				e.mining.length === 0 ? /* @__PURE__ */ B("p", {
					className: "px-card pb-4 text-sm text-muted",
					children: "No mining in this period."
				}) : /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [
					/* @__PURE__ */ B(w, { children: "Ore" }),
					/* @__PURE__ */ B(w, {
						className: "text-right",
						children: "Units"
					}),
					/* @__PURE__ */ B(w, {
						className: "text-right",
						children: "Value"
					})
				] }) }), /* @__PURE__ */ B("tbody", { children: e.mining.map((e) => /* @__PURE__ */ V(T, { children: [
					/* @__PURE__ */ B(S, { children: /* @__PURE__ */ B(X, { t: e }) }),
					/* @__PURE__ */ B(S, {
						className: "text-right font-mono tabular-nums",
						children: A(e.quantity)
					}),
					/* @__PURE__ */ B(S, {
						className: "text-right font-mono tabular-nums",
						children: k(e.value)
					})
				] }, e.id)) })] }),
				e.mining_systems.length > 0 && /* @__PURE__ */ V("p", {
					className: "px-card pb-4 pt-2 text-xs text-muted",
					children: [
						"Mined in ",
						e.mining_systems.map((e) => e.name).join(", "),
						"."
					]
				})
			] })]
		}), /* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(o, {
			title: "Killmails",
			description: "Newest first, up to 100."
		}), e.killmails.length === 0 ? /* @__PURE__ */ B("p", {
			className: "px-card pb-4 text-sm text-muted",
			children: "No killmails in this period."
		}) : /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [
			/* @__PURE__ */ B(w, { children: "When" }),
			/* @__PURE__ */ B(w, {}),
			/* @__PURE__ */ B(w, { children: "Character" }),
			/* @__PURE__ */ B(w, { children: "Victim ship" }),
			/* @__PURE__ */ B(w, { children: "System" }),
			/* @__PURE__ */ B(w, {
				className: "text-right",
				children: "Value"
			}),
			/* @__PURE__ */ B(w, {})
		] }) }), /* @__PURE__ */ B("tbody", { children: e.killmails.map((e) => /* @__PURE__ */ V(T, { children: [
			/* @__PURE__ */ B(S, {
				className: "whitespace-nowrap text-muted",
				children: O(e.time)
			}),
			/* @__PURE__ */ B(S, { children: e.is_loss ? /* @__PURE__ */ B(t, {
				tone: "danger",
				children: "Loss"
			}) : /* @__PURE__ */ B(t, {
				tone: "success",
				children: "Kill"
			}) }),
			/* @__PURE__ */ B(S, { children: e.character }),
			/* @__PURE__ */ B(S, { children: /* @__PURE__ */ B(X, { t: e.victim_ship }) }),
			/* @__PURE__ */ B(S, { children: /* @__PURE__ */ B(Y, { s: e.system }) }),
			/* @__PURE__ */ B(S, {
				className: "text-right font-mono tabular-nums",
				children: k(e.value)
			}),
			/* @__PURE__ */ B(S, {
				className: "text-right",
				children: /* @__PURE__ */ B("a", {
					href: `https://zkillboard.com/kill/${e.id}/`,
					target: "_blank",
					rel: "noreferrer",
					className: "text-muted hover:text-text",
					"aria-label": "Open on zKillboard",
					children: /* @__PURE__ */ B(oe, {})
				})
			})
		] }, e.id)) })] })] })]
	});
}
function Se({ r: e }) {
	return e.timeline.length ? /* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(o, {
		title: "Timeline",
		description: e.timeline_total > e.timeline.length ? `The latest ${e.timeline.length} of ${A(e.timeline_total)} stints.` : "Every stint, newest first."
	}), /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [
		/* @__PURE__ */ B(w, { children: "From" }),
		/* @__PURE__ */ B(w, { children: "For" }),
		/* @__PURE__ */ B(w, { children: "Character" }),
		/* @__PURE__ */ B(w, { children: "System" }),
		/* @__PURE__ */ B(w, { children: "Ship" }),
		/* @__PURE__ */ B(w, { children: "Docked at" })
	] }) }), /* @__PURE__ */ B("tbody", { children: e.timeline.map((e, t) => /* @__PURE__ */ V(T, { children: [
		/* @__PURE__ */ B(S, {
			className: "whitespace-nowrap text-muted",
			title: `until ${O(e.ended_at)}`,
			children: O(e.started_at)
		}),
		/* @__PURE__ */ B(S, {
			className: "whitespace-nowrap font-mono tabular-nums",
			children: q(e.seconds)
		}),
		/* @__PURE__ */ B(S, { children: e.character }),
		/* @__PURE__ */ B(S, { children: /* @__PURE__ */ B(Y, { s: e.system }) }),
		/* @__PURE__ */ B(S, { children: e.ship ? /* @__PURE__ */ B(X, {
			t: e.ship,
			sub: e.ship_name || void 0
		}) : /* @__PURE__ */ B("span", {
			className: "text-subtle",
			children: "—"
		}) }),
		/* @__PURE__ */ B(S, {
			className: "text-muted",
			children: e.docked ?? "In space"
		})
	] }, t)) })] })] }) : /* @__PURE__ */ B(l, {
		icon: /* @__PURE__ */ B(U, {}),
		title: "Nothing yet",
		description: "Stints show up here once one of their characters is seen online."
	});
}
//#endregion
//#region src/index.tsx
var Ce = ee({ routes: [{
	path: "",
	Component: de
}, {
	path: ":id",
	Component: me
}] });
//#endregion
export { Ce as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","about","accent","according","account","action","actions","added","all","allPicked","alliance","already","also","alt","alts","amount","an","and","any","anyone","are","aren","aria-label","as","at","audit","autoFocus","average","bad","be","being","between","bg-accent","block","boolean","border","border-border","but","button","by","by_day","by_hour","called","can","candidate","cell","character","characters","checkbox","checked","children","className","confirmLabel","const","corporation","couldn","count","currentColor","cx","cy","danger","data","date","day","days","default","definePlugin","delete","deleted","description","destroyed","didn","disabled","divide-border","divide-y","docked","docked_seconds","doesn","done","each","earn","earned","else","enabled","end","ended_at","ends","ends_at","error","every","everyone","export","extends","eyebrow","f","failed","false","far","few","fill","filter","finished","first","flew","flex","flex-1","flex-col","flex-wrap","flown","fly","flying","followed","font-medium","font-mono","footer","for","format","found","from","function","gap-0.5","gap-1","gap-1.5","gap-2","gap-3","gap-6","get","ghost","goes","gone","grid","grid-cols-2","group","h","h-24","h-40","h-48","h-96","h-full","has","hash","head","height","here","hint","hour","hover:bg-hover","hover:text-accent-ink","hover:text-text","how","href","icon","icons","id","if","img","import","in","including","income","info","initial","inline","inline-block","inline-flex","interface","is","isFetching","isLoading","is_loss","isk","isk_destroyed","isk_lost","isk_systems","isn","it","items","items-baseline","items-center","items-end","its","joined","joined_at","justify-between","justify-end","kept","key","killmail_ships","killmails","kills","label","last","last_polled_at","latest","length","lg:grid-cols-2","link","list","loading","log","losses","lost","m","m12","m13.41","made","main","many","matched","max","max-h-60","max-w-xs","maxHour","maxLength","mb-1","mb-2","mb-3","mb-4","mb-6","md","md:grid-cols-4","member","members","min","minHeight","mined_value","mining","mining_systems","minute","missing_scopes","moved","mr-3","mt-1","mutationFn","mx-card","n","name","navigate","needs","neutral","new","new-members","newest","next","no","no_reach","nobody","none","noreferrer","not","now","null","number","of","ok","on","onChange","onClick","onClose","onConfirm","onError","onOpenChange","onSuccess","onTrack","onValueChange","once","one","online","online_seconds","open","options","or","other","outline","overflow-y-auto","overview","own","page","path","payouts","pb-4","pending","per","period","permission","pick","picked","pills","placeholder","play","portrait","post","primary","pt-2","pt-3","px-2","px-3","px-card","py-1","py-2","qc","quantity","queryFn","queryKey","quick","r","re","react","react-router","reads","reason","recorded","ref_type","refetchInterval","region","regions","rel","remove","report","rest","return","role","round","rounded","rounded-t-sm","routes","rows","running","rx","s","sat","say","search","seconds","security","see","seen","selected","session","session_id","sessions","setBulk","setConfirm","setDays","setFilter","setOut","setPicked","setQ","setReason","setSelected","setStarting","setTab","setWithin","sheet","ship","ship_name","ships","show","shrink-0","site","size","size-4","size-6","sm","snooper","so","someone","space","space-y-2","space-y-3","space-y-4","space-y-6","spending","spent","src","start","started","started_at","started_by","starting","status","status_detail","status_label","stay","still","stop","stopped_by","stops","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structures","style","sub","success","swap","sync","system","systems","t","tabular-nums","target","target_name","text-danger-fg","text-left","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-warning-fg","text-xs","that","the","their","them","they","this","through","tied","time","timeline","timeline_total","title","to","toggle","token_invalid","tone","top","top_ship","top_system","total","totals","track","tracked","trackers","tracking","true","truncate","type","under","unregistered","until","untracked","up","useNavigate","useParams","useQueryClient","useState","used","user_id","user_ids","v","valid","value","valueText","variant","victim_ship","viewBox","void","w-24","w-8","w-full","wallet","warning","was","wasn","we","were","what","when","where","which","while","whitespace-nowrap","who","whose","width","with","within","yet","you","your","zKillboard"];
