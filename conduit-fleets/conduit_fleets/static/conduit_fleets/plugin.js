import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, Dialog as c, EmptyState as l, Field as u, Input as d, PageHeader as f, SearchInput as p, Segmented as m, Select as h, Skeleton as g, Spinner as _, StatCard as v, THead as y, TabPanel as b, Table as x, TableToolbar as S, Tabs as C, Td as w, Textarea as T, Th as E, Tr as D, api as O, dateTime as k, definePlugin as A, duration as ee, timeAgo as j, toast as M, useHasPerm as te } from "@conduit/sdk";
import { useMutation as N, useQuery as P, useQueryClient as F } from "@tanstack/react-query";
import { Link as I, useNavigate as L, useParams as ne } from "react-router";
import { useEffect as R, useState as z } from "react";
import { Fragment as B, jsx as V, jsxs as H } from "react/jsx-runtime";
//#region src/icons.tsx
function U({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ V("svg", {
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
var W = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" }),
		/* @__PURE__ */ V("path", { d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" }),
		/* @__PURE__ */ V("path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" }),
		/* @__PURE__ */ V("path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" })
	]
}), G = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M19.07 4.93A10 10 0 0 0 6.99 3.34" }),
		/* @__PURE__ */ V("path", { d: "M4 6h.01" }),
		/* @__PURE__ */ V("path", { d: "M2.29 9.62A10 10 0 1 0 21.31 8.35" }),
		/* @__PURE__ */ V("path", { d: "M16.24 7.76A6 6 0 1 0 8.23 16.67" }),
		/* @__PURE__ */ V("path", { d: "M12 18h.01" }),
		/* @__PURE__ */ V("path", { d: "M17.99 11.66A6 6 0 0 1 15.77 16.67" }),
		/* @__PURE__ */ V("circle", {
			cx: "12",
			cy: "12",
			r: "2"
		}),
		/* @__PURE__ */ V("path", { d: "m13.41 10.59 5.66-5.66" })
	]
}), re = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [/* @__PURE__ */ V("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ V("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })]
}), ie = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [/* @__PURE__ */ V("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ V("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), K = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [/* @__PURE__ */ V("path", { d: "M5 12h14" }), /* @__PURE__ */ V("path", { d: "M12 5v14" })]
}), q = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M3 6h18" }),
		/* @__PURE__ */ V("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ V("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), J = (e) => /* @__PURE__ */ V(U, {
	...e,
	children: /* @__PURE__ */ V("rect", {
		width: "14",
		height: "14",
		x: "5",
		y: "5",
		rx: "1"
	})
}), ae = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ V("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ V("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ V("path", { d: "M8 16H3v5" })
	]
}), Y = (e) => /* @__PURE__ */ V(U, {
	...e,
	children: /* @__PURE__ */ V("path", { d: "M20 6 9 17l-5-5" })
}), X = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }),
		/* @__PURE__ */ V("path", { d: "M18 17V9" }),
		/* @__PURE__ */ V("path", { d: "M13 17V5" }),
		/* @__PURE__ */ V("path", { d: "M8 17v-3" })
	]
}), oe = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [/* @__PURE__ */ V("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ V("path", { d: "M19 12H5" })]
}), se = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M12 15V3" }),
		/* @__PURE__ */ V("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ V("path", { d: "m7 10 5 5 5-5" })
	]
}), Z = "/api/p/fleets", ce = {
	esi: {
		label: "In-game fleet",
		tone: "accent"
	},
	link: {
		label: "FAT link",
		tone: "info"
	},
	manual: {
		label: "Added by FC",
		tone: "neutral"
	}
};
//#endregion
//#region src/home.tsx
function Q({ type: e }) {
	return e ? /* @__PURE__ */ V(n, {
		color: e.color,
		variant: "dot",
		size: "xs",
		children: e.name
	}) : null;
}
function $(e = "", t = "") {
	return P({
		queryKey: [
			"fleets",
			"overview",
			e,
			t
		],
		queryFn: () => O.get(`${Z}?q=${encodeURIComponent(e)}${t ? `&type=${t}` : ""}`),
		placeholderData: (e) => e
	});
}
function le() {
	let e = L(), [t, a] = z(""), [o, s] = z(""), [c, u] = z(!1), { data: d, isLoading: m } = $(t.trim(), o);
	return /* @__PURE__ */ H(B, { children: [
		/* @__PURE__ */ V(f, {
			eyebrow: "Operations",
			title: "Fleets",
			icon: /* @__PURE__ */ V(W, {}),
			description: "Who flew in each fleet (FATs). FCs track their in-game fleet or hand out a FAT link; attendance counts towards group rules.",
			actions: /* @__PURE__ */ H("div", {
				className: "flex flex-wrap gap-2",
				children: [d?.can_manage && /* @__PURE__ */ V(I, {
					to: "/p/fleets/attendance",
					children: /* @__PURE__ */ H(r, {
						variant: "ghost",
						children: [/* @__PURE__ */ V(X, {}), " Attendance"]
					})
				}), d?.can_run && /* @__PURE__ */ H(r, {
					variant: "primary",
					onClick: () => u(!0),
					children: [/* @__PURE__ */ V(K, {}), " New fleet"]
				})]
			})
		}),
		m || !d ? /* @__PURE__ */ V("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ V(g, { className: "h-28" }, e))
		}) : /* @__PURE__ */ H("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ H("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ V(v, {
						label: "My fleets · 30 days",
						value: d.me.counts.days_30,
						tone: d.me.counts.days_30 ? "accent" : void 0,
						hint: d.me.by_type_30.map((e) => `${e.count} ${e.type}`).join(" · ") || "none yet"
					}),
					/* @__PURE__ */ V(v, {
						label: "My fleets · 90 days",
						value: d.me.counts.days_90
					}),
					/* @__PURE__ */ V(v, {
						label: "My fleets · all time",
						value: d.me.counts.all
					})
				]
			}), /* @__PURE__ */ H(C, {
				variant: "pills",
				defaultValue: "fleets",
				className: "space-y-4",
				items: [{
					value: "fleets",
					label: "Recent fleets",
					count: d.fleets.length
				}, {
					value: "mine",
					label: "Fleets I flew in",
					count: d.me.fleets.length
				}],
				children: [/* @__PURE__ */ V(b, {
					value: "fleets",
					children: /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ H(S, { children: [/* @__PURE__ */ V(p, {
						value: t,
						onChange: (e) => a(e.target.value),
						placeholder: "Fleet or FC",
						className: "w-64"
					}), /* @__PURE__ */ H(h, {
						value: o,
						onChange: (e) => s(e.target.value),
						className: "w-44",
						"aria-label": "Fleet type",
						children: [/* @__PURE__ */ V("option", {
							value: "",
							children: "All types"
						}), d.types.map((e) => /* @__PURE__ */ V("option", {
							value: e.id,
							children: e.name
						}, e.id))]
					})] }), d.fleets.length === 0 ? /* @__PURE__ */ V(l, {
						icon: /* @__PURE__ */ V(W, {}),
						title: t || o ? "No fleet matches" : "No fleets yet",
						description: d.can_run && !t && !o ? "Start one with New fleet." : void 0
					}) : /* @__PURE__ */ H(x, { children: [/* @__PURE__ */ V(y, { children: /* @__PURE__ */ H("tr", { children: [
						/* @__PURE__ */ V(E, { children: "Fleet" }),
						/* @__PURE__ */ V(E, { children: "FC" }),
						/* @__PURE__ */ V(E, { children: "When" }),
						/* @__PURE__ */ V(E, {
							align: "right",
							children: "Pilots"
						}),
						/* @__PURE__ */ V(E, { align: "right" })
					] }) }), /* @__PURE__ */ V("tbody", { children: d.fleets.map((t) => /* @__PURE__ */ H(D, {
						interactive: !0,
						onClick: () => e(`/p/fleets/${t.id}`),
						children: [
							/* @__PURE__ */ V(w, { children: /* @__PURE__ */ H("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ V("span", {
										className: "font-medium",
										children: t.name
									}),
									/* @__PURE__ */ V(Q, { type: t.type }),
									!t.ended_at && /* @__PURE__ */ V(n, {
										tone: "success",
										size: "xs",
										children: t.tracking ? /* @__PURE__ */ H(B, { children: [/* @__PURE__ */ V(G, { className: "size-3" }), " Live"] }) : "Open"
									})
								]
							}) }),
							/* @__PURE__ */ V(w, {
								className: "text-sm text-muted",
								children: t.fc?.name ?? "—"
							}),
							/* @__PURE__ */ V(w, {
								className: "whitespace-nowrap text-sm text-muted",
								title: k(t.started_at),
								children: j(t.started_at)
							}),
							/* @__PURE__ */ V(w, {
								numeric: !0,
								children: t.pilots
							}),
							/* @__PURE__ */ V(w, {
								align: "right",
								children: t.attended && /* @__PURE__ */ H(n, {
									tone: "accent",
									size: "xs",
									children: [/* @__PURE__ */ V(Y, { className: "size-3" }), " You flew"]
								})
							})
						]
					}, t.id)) })] })] })
				}), /* @__PURE__ */ V(b, {
					value: "mine",
					children: /* @__PURE__ */ V(i, { children: d.me.fleets.length === 0 ? /* @__PURE__ */ V(l, {
						icon: /* @__PURE__ */ V(W, {}),
						title: "No FATs yet",
						description: "Fleets you fly in show up here once the FC tracks the fleet or you use its FAT link."
					}) : /* @__PURE__ */ V("ul", {
						className: "divide-y divide-border",
						children: d.me.fleets.map((e) => /* @__PURE__ */ V("li", { children: /* @__PURE__ */ H(I, {
							to: `/p/fleets/${e.id}`,
							className: "flex items-center gap-3 px-card py-3 hover:bg-hover",
							children: [/* @__PURE__ */ H("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ H("div", {
									className: "flex items-center gap-2 font-medium",
									children: [
										e.name,
										" ",
										/* @__PURE__ */ V(Q, { type: e.type })
									]
								}), /* @__PURE__ */ H("div", {
									className: "truncate text-xs text-subtle",
									children: [
										e.characters.join(", "),
										" · FC ",
										e.fc?.name ?? "unknown"
									]
								})]
							}), /* @__PURE__ */ V("span", {
								className: "whitespace-nowrap text-xs text-muted",
								children: j(e.started_at)
							})]
						}) }, e.id))
					}) })
				})]
			})]
		}),
		c && d && /* @__PURE__ */ V(de, {
			types: d.types,
			onClose: () => u(!1)
		})
	] });
}
var ue = [
	{
		value: "",
		label: "Until the fleet ends"
	},
	{
		value: "15",
		label: "15 minutes"
	},
	{
		value: "30",
		label: "30 minutes"
	},
	{
		value: "60",
		label: "1 hour"
	},
	{
		value: "120",
		label: "2 hours"
	}
];
function de({ types: e, onClose: t }) {
	let n = F(), i = L(), { data: a } = P({
		queryKey: ["fleets", "fc-characters"],
		queryFn: () => O.get(`${Z}/fc/characters`)
	}), [o, s] = z({
		name: "",
		fleet_type: "",
		notes: "",
		link_minutes: "",
		track_character: ""
	}), l = (e) => s((t) => ({
		...t,
		...e
	})), f = N({
		mutationFn: () => O.post(Z, {
			name: o.name,
			notes: o.notes,
			fleet_type: o.fleet_type ? Number(o.fleet_type) : null,
			link_minutes: o.link_minutes ? Number(o.link_minutes) : null,
			track_character: o.track_character ? Number(o.track_character) : null
		}),
		onSuccess: (e) => {
			n.invalidateQueries({ queryKey: ["fleets"] }), e.warning ? M.warning(e.warning) : M.success(e.tracking ? `Tracking ${e.name}: ${e.pilots} pilots so far` : `${e.name} started`), i(`/p/fleets/${e.id}`);
		},
		onError: (e) => M.error(e.message)
	}), p = (a ?? []).filter((e) => e.can_track);
	return /* @__PURE__ */ V(c, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: "New fleet",
		description: "Pilots get a FAT from your in-game fleet, the FAT link, or both.",
		size: "lg",
		footer: /* @__PURE__ */ H(B, { children: [/* @__PURE__ */ V(r, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), /* @__PURE__ */ H(r, {
			variant: "primary",
			disabled: !o.name.trim(),
			loading: f.isPending,
			onClick: () => f.mutate(),
			children: [/* @__PURE__ */ V(W, {}), " Start fleet"]
		})] }),
		children: /* @__PURE__ */ H("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ H("div", {
					className: "grid gap-4 sm:grid-cols-[1fr_200px]",
					children: [/* @__PURE__ */ V(u, {
						label: "Name",
						required: !0,
						children: /* @__PURE__ */ V(d, {
							value: o.name,
							onChange: (e) => l({ name: e.target.value }),
							placeholder: "Sunday CTA: Keepstar defense",
							autoFocus: !0
						})
					}), /* @__PURE__ */ V(u, {
						label: "Type",
						children: /* @__PURE__ */ H(h, {
							value: o.fleet_type,
							onChange: (e) => l({ fleet_type: e.target.value }),
							children: [/* @__PURE__ */ V("option", {
								value: "",
								children: "None"
							}), e.map((e) => /* @__PURE__ */ V("option", {
								value: e.id,
								children: e.name
							}, e.id))]
						})
					})]
				}),
				/* @__PURE__ */ V(u, {
					label: "Track the in-game fleet with",
					hint: "That character must be fleet boss. Everyone in the fleet gets a FAT, checked every minute.",
					children: /* @__PURE__ */ H(h, {
						value: o.track_character,
						onChange: (e) => l({ track_character: e.target.value }),
						children: [/* @__PURE__ */ V("option", {
							value: "",
							children: "Don't track; use the FAT link"
						}), p.map((e) => /* @__PURE__ */ V("option", {
							value: e.id,
							children: e.name
						}, e.id))]
					})
				}),
				a && a.length > p.length && /* @__PURE__ */ H("p", {
					className: "-mt-2 text-xs text-subtle",
					children: [a.filter((e) => !e.can_track).map((e) => e.name).join(", "), " can't track: log in with them again to grant fleet access."]
				}),
				/* @__PURE__ */ V(u, {
					label: "FAT link stays open",
					children: /* @__PURE__ */ V(h, {
						value: o.link_minutes,
						onChange: (e) => l({ link_minutes: e.target.value }),
						options: ue,
						className: "max-w-xs"
					})
				}),
				/* @__PURE__ */ V(u, {
					label: "Notes",
					hint: "Doctrine, comms, staging. Pilots see this on the FAT link page.",
					children: /* @__PURE__ */ V(T, {
						rows: 3,
						value: o.notes,
						onChange: (e) => l({ notes: e.target.value })
					})
				})
			]
		})
	});
}
//#endregion
//#region src/attendance.tsx
function fe() {
	let [e, a] = z("30"), [o, s] = z(""), { data: c } = $(), { data: u, isLoading: d } = P({
		queryKey: [
			"fleets",
			"stats",
			e,
			o
		],
		queryFn: () => O.get(`${Z}/stats/members?days=${e}${o ? `&type=${o}` : ""}`),
		placeholderData: (e) => e
	}), p = Math.max(1, ...(u?.members ?? []).map((e) => e.fleets));
	return /* @__PURE__ */ H(B, { children: [/* @__PURE__ */ V(f, {
		eyebrow: /* @__PURE__ */ H(I, {
			to: "/p/fleets",
			className: "inline-flex items-center gap-1 hover:text-text",
			children: [/* @__PURE__ */ V(oe, { className: "size-3" }), " Fleets"]
		}),
		title: "Attendance",
		icon: /* @__PURE__ */ V(X, {}),
		description: "Fleets each member flew in, with any of their characters. Use the Fleet attendance rule on a group to require it.",
		actions: /* @__PURE__ */ V("a", {
			href: `${Z}/stats/members.csv?days=${e}${o ? `&type=${o}` : ""}`,
			download: !0,
			children: /* @__PURE__ */ H(r, {
				variant: "ghost",
				children: [/* @__PURE__ */ V(se, {}), " CSV"]
			})
		})
	}), /* @__PURE__ */ H("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_320px]",
		children: [/* @__PURE__ */ H(i, { children: [/* @__PURE__ */ H(S, { children: [/* @__PURE__ */ V(m, {
			value: e,
			onChange: a,
			size: "sm",
			options: [
				{
					value: "30",
					label: "30 days"
				},
				{
					value: "90",
					label: "90 days"
				},
				{
					value: "365",
					label: "1 year"
				}
			]
		}), /* @__PURE__ */ H(h, {
			value: o,
			onChange: (e) => s(e.target.value),
			className: "w-44",
			"aria-label": "Fleet type",
			children: [/* @__PURE__ */ V("option", {
				value: "",
				children: "All types"
			}), (c?.types ?? []).map((e) => /* @__PURE__ */ V("option", {
				value: e.id,
				children: e.name
			}, e.id))]
		})] }), d || !u ? /* @__PURE__ */ V(g, { className: "m-card h-40" }) : u.members.length === 0 ? /* @__PURE__ */ V(l, {
			icon: /* @__PURE__ */ V(X, {}),
			title: "No FATs in this period"
		}) : /* @__PURE__ */ H(x, { children: [/* @__PURE__ */ V(y, { children: /* @__PURE__ */ H("tr", { children: [
			/* @__PURE__ */ V(E, { children: "Member" }),
			/* @__PURE__ */ V(E, { children: "Fleets" }),
			/* @__PURE__ */ V(E, { children: "Last fleet" })
		] }) }), /* @__PURE__ */ V("tbody", { children: u.members.map((e) => /* @__PURE__ */ H(D, { children: [
			/* @__PURE__ */ V(w, { children: /* @__PURE__ */ H("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ V(t, {
					src: e.portrait,
					name: e.name,
					size: "sm"
				}), /* @__PURE__ */ H("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ H("div", {
						className: "flex items-center gap-2 font-medium",
						children: [e.name, !e.registered && /* @__PURE__ */ V(n, {
							tone: "warning",
							size: "xs",
							children: "not registered"
						})]
					}), /* @__PURE__ */ V("div", {
						className: "truncate text-xs text-subtle",
						children: e.characters.join(", ")
					})]
				})]
			}) }),
			/* @__PURE__ */ V(w, {
				className: "w-1/3",
				children: /* @__PURE__ */ H("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ V("div", {
						className: "h-1.5 flex-1 bg-hover",
						children: /* @__PURE__ */ V("div", {
							className: "h-full bg-accent",
							style: { width: `${e.fleets / p * 100}%` }
						})
					}), /* @__PURE__ */ V("span", {
						className: "w-8 text-right font-mono tabular-nums",
						children: e.fleets
					})]
				})
			}),
			/* @__PURE__ */ V(w, {
				className: "whitespace-nowrap text-sm text-muted",
				children: j(e.last)
			})
		] }, e.key)) })] })] }), /* @__PURE__ */ V(pe, {})]
	})] });
}
function pe() {
	let e = F(), { data: t } = $(), [n, a] = z(""), [s, c] = z("#38bdf8"), l = () => e.invalidateQueries({ queryKey: ["fleets"] }), u = N({
		mutationFn: () => O.post(`${Z}/types`, {
			name: n,
			color: s
		}),
		onSuccess: () => {
			a(""), l(), M.success("Fleet type added");
		},
		onError: (e) => M.error(e.message)
	}), f = N({
		mutationFn: (e) => O.delete(`${Z}/types/${e}`),
		onSuccess: l,
		onError: (e) => M.error(e.message)
	});
	return /* @__PURE__ */ H(i, {
		className: "h-fit",
		children: [
			/* @__PURE__ */ V(o, {
				title: "Fleet types",
				description: "FCs pick one per fleet; the FAT rule can count only some."
			}),
			/* @__PURE__ */ V("ul", {
				className: "divide-y divide-border",
				children: (t?.types ?? []).map((e) => /* @__PURE__ */ H("li", {
					className: "flex items-center gap-2.5 px-card py-2 text-sm",
					children: [
						/* @__PURE__ */ V("span", {
							className: "size-2.5 rotate-45",
							style: { background: e.color }
						}),
						/* @__PURE__ */ V("span", {
							className: "flex-1",
							children: e.name
						}),
						/* @__PURE__ */ V(r, {
							variant: "ghost",
							size: "icon-xs",
							"aria-label": `Remove ${e.name}`,
							onClick: () => f.mutate(e.id),
							children: /* @__PURE__ */ V(q, {})
						})
					]
				}, e.id))
			}),
			/* @__PURE__ */ H("div", {
				className: "flex gap-2 border-t border-border p-card",
				children: [
					/* @__PURE__ */ V("input", {
						type: "color",
						value: s,
						onChange: (e) => c(e.target.value),
						className: "h-9 w-10 cursor-pointer border border-border bg-transparent",
						"aria-label": "Colour"
					}),
					/* @__PURE__ */ V(d, {
						value: n,
						onChange: (e) => a(e.target.value),
						placeholder: "New type, e.g. Capital op"
					}),
					/* @__PURE__ */ V(r, {
						size: "icon",
						disabled: !n.trim(),
						loading: u.isPending,
						onClick: () => u.mutate(),
						"aria-label": "Add fleet type",
						children: /* @__PURE__ */ V(K, {})
					})
				]
			})
		]
	});
}
//#endregion
//#region src/fat.tsx
function me() {
	let { code: n } = ne(), o = F(), { data: s, isLoading: c, error: u } = P({
		queryKey: [
			"fleets",
			"link",
			n
		],
		queryFn: () => O.get(`${Z}/fat/${n}`),
		retry: !1
	}), [d, p] = z(null), m = N({
		mutationFn: (e) => O.post(`${Z}/fat/${n}`, { characters: e }),
		onSuccess: (e) => {
			o.invalidateQueries({ queryKey: ["fleets"] }), M.success(e.added ? `FAT registered for ${e.added} character${e.added === 1 ? "" : "s"}. o7` : "Already registered"), p(/* @__PURE__ */ new Set());
		},
		onError: (e) => M.error(e.message)
	});
	if (u) return /* @__PURE__ */ V(l, {
		icon: /* @__PURE__ */ V(W, {}),
		title: "This FAT link doesn't exist",
		description: "Check the link with your FC."
	});
	if (c || !s) return /* @__PURE__ */ V(g, { className: "mx-auto h-80 max-w-xl" });
	let h = s.characters.filter((e) => !e.registered), _ = d ?? new Set(h.slice(0, 1).map((e) => e.id)), v = (e) => {
		let t = new Set(_);
		t.has(e) ? t.delete(e) : t.add(e), p(t);
	};
	return /* @__PURE__ */ H("div", {
		className: "mx-auto max-w-xl",
		children: [/* @__PURE__ */ V(f, {
			eyebrow: "FAT link",
			title: /* @__PURE__ */ H("span", {
				className: "flex flex-wrap items-center gap-3",
				children: [
					s.name,
					" ",
					/* @__PURE__ */ V(Q, { type: s.type })
				]
			}),
			icon: /* @__PURE__ */ V(W, {}),
			description: `FC ${s.fc?.name ?? "unknown"} · started ${j(s.started_at)}`
		}), /* @__PURE__ */ V(i, { children: /* @__PURE__ */ H(a, {
			className: "space-y-4",
			children: [
				s.notes && /* @__PURE__ */ V("p", {
					className: "whitespace-pre-line border-l-2 border-accent/50 pl-3 text-sm text-muted",
					children: s.notes
				}),
				s.open ? /* @__PURE__ */ H(B, { children: [
					/* @__PURE__ */ V("div", {
						className: "text-sm font-medium",
						children: "Which characters flew in this fleet?"
					}),
					/* @__PURE__ */ V("ul", {
						className: "divide-y divide-border border border-border",
						children: s.characters.map((e) => /* @__PURE__ */ V("li", { children: /* @__PURE__ */ H("label", {
							className: `flex items-center gap-3 px-3 py-2.5 ${e.registered ? "opacity-60" : "cursor-pointer hover:bg-hover"}`,
							children: [
								/* @__PURE__ */ V("input", {
									type: "checkbox",
									className: "size-4 accent-accent",
									disabled: e.registered,
									checked: e.registered || _.has(e.id),
									onChange: () => v(e.id)
								}),
								/* @__PURE__ */ V(t, {
									src: e.portrait,
									name: e.name,
									size: "sm"
								}),
								/* @__PURE__ */ V("span", {
									className: "flex-1 text-sm",
									children: e.name
								}),
								e.registered && /* @__PURE__ */ H("span", {
									className: "flex items-center gap-1 text-xs text-success-fg",
									children: [/* @__PURE__ */ V(Y, { className: "size-3.5" }), " FAT"]
								})
							]
						}) }, e.id))
					}),
					/* @__PURE__ */ H(r, {
						variant: "primary",
						className: "w-full",
						disabled: _.size === 0,
						loading: m.isPending,
						onClick: () => m.mutate([..._]),
						children: [
							/* @__PURE__ */ V(Y, {}),
							" Register ",
							_.size || "",
							" FAT",
							_.size === 1 ? "" : "s"
						]
					})
				] }) : /* @__PURE__ */ V(e, {
					tone: "warning",
					title: "This link has closed",
					children: "Ask the FC to add you if you flew in this fleet."
				}),
				/* @__PURE__ */ V(I, {
					to: "/p/fleets",
					className: "block text-center text-xs text-muted hover:text-text",
					children: "My fleets"
				})
			]
		}) })]
	});
}
//#endregion
//#region src/fleet.tsx
function he() {
	let { id: c } = ne(), u = F(), d = L(), p = te("fleets.manage_fleets"), m = [
		"fleets",
		"fleet",
		c
	], { data: h, isLoading: _, error: v } = P({
		queryKey: m,
		queryFn: () => O.get(`${Z}/${c}`),
		refetchInterval: (e) => e.state.data?.tracking ? 3e4 : !1,
		retry: !1
	}), [b, S] = z(null), C = (e, t) => {
		u.setQueryData(m, e), u.invalidateQueries({ queryKey: ["fleets", "overview"] }), t && M.success(t);
	}, T = N({
		mutationFn: ({ path: e, method: t = "post", body: n }) => t === "post" ? O.post(`${Z}/${c}${e}`, n ?? {}) : O.delete(`${Z}/${c}${e}`),
		onSuccess: (e, t) => C(e, t.msg ?? (e.added ? `${e.added} new pilot${e.added === 1 ? "" : "s"}` : void 0)),
		onError: (e) => M.error(e.message)
	}), A = N({
		mutationFn: () => O.delete(`${Z}/${c}`),
		onSuccess: () => {
			u.invalidateQueries({ queryKey: ["fleets"] }), M.success("Fleet deleted"), d("/p/fleets");
		},
		onError: (e) => M.error(e.message)
	});
	if (v) return /* @__PURE__ */ V(l, {
		icon: /* @__PURE__ */ V(W, {}),
		title: "This fleet doesn't exist",
		action: /* @__PURE__ */ V(I, {
			to: "/p/fleets",
			children: /* @__PURE__ */ V(r, { children: "Back to fleets" })
		})
	});
	if (_ || !h) return /* @__PURE__ */ V(g, { className: "h-96" });
	let j = !h.ended_at;
	return /* @__PURE__ */ H(B, { children: [
		/* @__PURE__ */ V(f, {
			eyebrow: /* @__PURE__ */ H(I, {
				to: "/p/fleets",
				className: "inline-flex items-center gap-1 hover:text-text",
				children: [/* @__PURE__ */ V(oe, { className: "size-3" }), " Fleets"]
			}),
			title: /* @__PURE__ */ H("span", {
				className: "flex flex-wrap items-center gap-3",
				children: [
					h.name,
					" ",
					/* @__PURE__ */ V(Q, { type: h.type }),
					j ? /* @__PURE__ */ V(n, {
						tone: "success",
						children: h.tracking ? "Live" : "Open"
					}) : /* @__PURE__ */ V(n, { children: "Ended" })
				]
			}),
			description: /* @__PURE__ */ H(B, { children: [
				"FC ",
				h.fc?.name ?? "unknown",
				" · started ",
				k(h.started_at),
				h.ended_at && /* @__PURE__ */ H(B, { children: [" · lasted ", ee(h.ended_at, new Date(h.started_at).getTime())] })
			] }),
			actions: h.can_edit ? /* @__PURE__ */ H("div", {
				className: "flex flex-wrap gap-2",
				children: [j && /* @__PURE__ */ H(r, {
					variant: "primary",
					onClick: () => S("end"),
					children: [/* @__PURE__ */ V(J, {}), " End fleet"]
				}), p && /* @__PURE__ */ V(r, {
					variant: "danger",
					size: "icon",
					"aria-label": "Delete fleet",
					onClick: () => S("delete"),
					children: /* @__PURE__ */ V(q, {})
				})]
			}) : void 0
		}),
		/* @__PURE__ */ H("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_360px]",
			children: [/* @__PURE__ */ H("div", {
				className: "min-w-0 space-y-6",
				children: [
					h.attended && /* @__PURE__ */ V(e, {
						tone: "success",
						title: "You have a FAT for this fleet"
					}),
					h.notes && /* @__PURE__ */ V(i, { children: /* @__PURE__ */ V(a, {
						className: "whitespace-pre-line text-sm text-muted",
						children: h.notes
					}) }),
					/* @__PURE__ */ H(i, { children: [
						/* @__PURE__ */ V(o, {
							title: `Pilots · ${h.pilots}`,
							description: `${h.members} member${h.members === 1 ? "" : "s"} on this site`
						}),
						h.can_edit && j && /* @__PURE__ */ V(ve, {
							fleetId: h.id,
							onAdded: (e) => C(e, "Added")
						}),
						h.fats.length === 0 ? /* @__PURE__ */ V(l, {
							icon: /* @__PURE__ */ V(W, {}),
							title: "Nobody yet",
							description: h.can_edit ? "Track your in-game fleet or share the FAT link." : void 0
						}) : /* @__PURE__ */ H(x, { children: [/* @__PURE__ */ V(y, { children: /* @__PURE__ */ H("tr", { children: [
							/* @__PURE__ */ V(E, { children: "Pilot" }),
							/* @__PURE__ */ V(E, { children: "Ship" }),
							/* @__PURE__ */ V(E, { children: "System" }),
							/* @__PURE__ */ V(E, { children: "How" }),
							h.can_edit && /* @__PURE__ */ V(E, {})
						] }) }), /* @__PURE__ */ V("tbody", { children: h.fats.map((e) => /* @__PURE__ */ H(D, { children: [
							/* @__PURE__ */ V(w, { children: /* @__PURE__ */ H("div", {
								className: "flex items-center gap-2.5",
								children: [/* @__PURE__ */ V(t, {
									src: e.character.portrait,
									name: e.character.name,
									size: "xs"
								}), /* @__PURE__ */ H("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ V("div", {
										className: "truncate text-sm font-medium",
										children: e.character.name
									}), /* @__PURE__ */ V("div", {
										className: "truncate text-xs text-subtle",
										children: e.member ? e.member.name === e.character.name ? "" : e.member.name : "not registered"
									})]
								})]
							}) }),
							/* @__PURE__ */ V(w, { children: e.ship?.name ? /* @__PURE__ */ H("span", {
								className: "flex items-center gap-2 text-sm",
								children: [/* @__PURE__ */ V("img", {
									src: e.ship.icon,
									alt: "",
									className: "size-5"
								}), e.ship.name]
							}) : /* @__PURE__ */ V("span", {
								className: "text-subtle",
								children: "—"
							}) }),
							/* @__PURE__ */ V(w, {
								className: "text-sm text-muted",
								children: e.system ?? "—"
							}),
							/* @__PURE__ */ V(w, { children: /* @__PURE__ */ V(n, {
								tone: ce[e.via].tone,
								size: "xs",
								children: ce[e.via].label
							}) }),
							h.can_edit && /* @__PURE__ */ V(w, {
								align: "right",
								children: /* @__PURE__ */ V(r, {
									variant: "ghost",
									size: "icon-xs",
									"aria-label": `Remove ${e.character.name}`,
									onClick: () => T.mutate({
										path: `/fats/${e.id}`,
										method: "delete",
										msg: `Removed ${e.character.name}`
									}),
									children: /* @__PURE__ */ V(q, {})
								})
							})
						] }, e.id)) })] })
					] })
				]
			}), /* @__PURE__ */ H("div", {
				className: "space-y-6",
				children: [
					h.can_edit && h.tracking_info && /* @__PURE__ */ V(ge, {
						data: h,
						live: j,
						busy: T.isPending,
						onAct: (e) => T.mutate(e)
					}),
					h.can_edit && h.link && /* @__PURE__ */ V(_e, {
						data: h,
						live: j,
						onAct: (e) => T.mutate(e)
					}),
					h.ships.length > 0 && /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, { title: "Ships" }), /* @__PURE__ */ V("ul", {
						className: "divide-y divide-border",
						children: h.ships.map((e) => /* @__PURE__ */ H("li", {
							className: "flex items-center justify-between px-card py-2 text-sm",
							children: [/* @__PURE__ */ V("span", { children: e.name }), /* @__PURE__ */ V("span", {
								className: "font-mono tabular-nums text-muted",
								children: e.count
							})]
						}, e.name))
					})] })
				]
			})]
		}),
		/* @__PURE__ */ V(s, {
			open: b === "end",
			onOpenChange: (e) => !e && S(null),
			title: `End ${h.name}?`,
			description: "Tracking stops and the FAT link closes. You can still add or remove pilots afterwards from here.",
			confirmLabel: /* @__PURE__ */ H(B, { children: [/* @__PURE__ */ V(J, {}), " End fleet"] }),
			onConfirm: () => T.mutateAsync({
				path: "/end",
				msg: "Fleet ended"
			})
		}),
		/* @__PURE__ */ V(s, {
			open: b === "delete",
			onOpenChange: (e) => !e && S(null),
			danger: !0,
			title: `Delete ${h.name}?`,
			description: `Its ${h.pilots} FATs are deleted too, which lowers everyone's attendance.`,
			confirmLabel: /* @__PURE__ */ H(B, { children: [/* @__PURE__ */ V(q, {}), " Delete"] }),
			onConfirm: () => A.mutateAsync()
		})
	] });
}
function ge({ data: t, live: n, busy: s, onAct: c }) {
	let l = t.tracking_info, { data: u } = P({
		queryKey: ["fleets", "fc-characters"],
		queryFn: () => O.get(`${Z}/fc/characters`),
		enabled: n && !t.tracking
	}), [d, f] = z(""), p = (u ?? []).filter((e) => e.can_track);
	return R(() => {
		!d && p[0] && f(String(p[0].id));
	}, [d, p]), /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, {
		title: "In-game fleet",
		icon: /* @__PURE__ */ V(G, {}),
		description: "Everyone in it gets a FAT, checked every minute."
	}), /* @__PURE__ */ V(a, {
		className: "space-y-3 text-sm",
		children: t.tracking ? /* @__PURE__ */ H(B, { children: [
			/* @__PURE__ */ H("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ V("span", { className: "size-2 animate-pulse rounded-full bg-success" }),
					"Tracking with ",
					/* @__PURE__ */ V("span", {
						className: "font-medium",
						children: l.character?.name
					})
				]
			}),
			/* @__PURE__ */ H("div", {
				className: "text-xs text-muted",
				children: ["Last read ", j(l.last_at)]
			}),
			l.error && /* @__PURE__ */ V("p", {
				className: "text-xs text-warning-fg",
				children: l.error
			}),
			/* @__PURE__ */ H("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ H(r, {
					size: "sm",
					loading: s,
					onClick: () => c({ path: "/refresh" }),
					children: [/* @__PURE__ */ V(ae, {}), " Read now"]
				}), /* @__PURE__ */ V(r, {
					size: "sm",
					variant: "ghost",
					onClick: () => c({
						path: "/track",
						method: "delete",
						msg: "Tracking stopped"
					}),
					children: "Stop"
				})]
			})
		] }) : /* @__PURE__ */ H(B, { children: [l.error && /* @__PURE__ */ V(e, {
			tone: "warning",
			title: "Tracking stopped",
			children: l.error
		}), n ? p.length ? /* @__PURE__ */ H("div", {
			className: "flex flex-wrap gap-2",
			children: [/* @__PURE__ */ V(h, {
				value: d,
				onChange: (e) => f(e.target.value),
				className: "min-w-40 flex-1",
				"aria-label": "Fleet boss",
				children: p.map((e) => /* @__PURE__ */ V("option", {
					value: e.id,
					children: e.name
				}, e.id))
			}), /* @__PURE__ */ H(r, {
				size: "sm",
				variant: "primary",
				loading: s,
				disabled: !d,
				onClick: () => c({
					path: "/track",
					body: { character: Number(d) },
					msg: "Tracking started"
				}),
				children: [/* @__PURE__ */ V(G, {}), " Track"]
			})]
		}) : /* @__PURE__ */ V("p", {
			className: "text-xs text-muted",
			children: "None of your characters has granted fleet access. Log in with your FC character again under Characters."
		}) : /* @__PURE__ */ V("p", {
			className: "text-xs text-muted",
			children: "The fleet has ended."
		})] })
	})] });
}
function _e({ data: e, live: t, onAct: s }) {
	let c = e.link, l = `${window.location.origin}/p/fleets/fat/${c.code}`;
	return /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, {
		title: "FAT link",
		icon: /* @__PURE__ */ V(re, {}),
		description: "Pilots open it and pick the characters they flew with."
	}), /* @__PURE__ */ H(a, {
		className: "space-y-3 text-sm",
		children: [/* @__PURE__ */ H("div", {
			className: "flex",
			children: [/* @__PURE__ */ V(d, {
				readOnly: !0,
				value: l,
				onFocus: (e) => e.target.select(),
				className: "font-mono text-xs"
			}), /* @__PURE__ */ V(r, {
				size: "icon",
				"aria-label": "Copy the FAT link",
				onClick: () => navigator.clipboard.writeText(l).then(() => M.success("Link copied; paste it in fleet chat"), () => M.error("Couldn't copy; select the link instead")),
				children: /* @__PURE__ */ V(ie, {})
			})]
		}), c.active ? /* @__PURE__ */ H("div", {
			className: "flex flex-wrap items-center justify-between gap-2",
			children: [/* @__PURE__ */ H(n, {
				tone: "success",
				children: ["Open", c.expires_at ? ` until ${new Date(c.expires_at).toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit"
				})}` : ""]
			}), /* @__PURE__ */ V(r, {
				size: "sm",
				variant: "ghost",
				onClick: () => s({
					path: "/link",
					body: { open: !1 },
					msg: "Link closed"
				}),
				children: "Close link"
			})]
		}) : t ? /* @__PURE__ */ H("div", {
			className: "flex flex-wrap items-center justify-between gap-2",
			children: [/* @__PURE__ */ V(n, { children: "Closed" }), /* @__PURE__ */ H("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ V(r, {
					size: "sm",
					onClick: () => s({
						path: "/link",
						body: {
							open: !0,
							minutes: 30
						},
						msg: "Link open for 30 minutes"
					}),
					children: "Open 30 min"
				}), /* @__PURE__ */ V(r, {
					size: "sm",
					variant: "ghost",
					onClick: () => s({
						path: "/link",
						body: { open: !0 },
						msg: "Link open"
					}),
					children: "Open"
				})]
			})]
		}) : /* @__PURE__ */ V(n, { children: "Closed with the fleet" })]
	})] });
}
function ve({ fleetId: e, onAdded: n }) {
	let [i, a] = z(""), [o, s] = z("");
	R(() => {
		let e = setTimeout(() => s(i.trim()), 250);
		return () => clearTimeout(e);
	}, [i]);
	let { data: c, isLoading: l } = P({
		queryKey: [
			"fleets",
			"candidates",
			e,
			o
		],
		queryFn: () => O.get(`${Z}/${e}/candidates?q=${encodeURIComponent(o)}`),
		enabled: o.length >= 2
	}), u = N({
		mutationFn: (t) => O.post(`${Z}/${e}/fats`, { characters: [t] }),
		onSuccess: (e) => {
			a(""), n(e);
		},
		onError: (e) => M.error(e.message)
	});
	return /* @__PURE__ */ H("div", {
		className: "border-b border-border px-card py-3",
		children: [/* @__PURE__ */ V(d, {
			value: i,
			onChange: (e) => a(e.target.value),
			placeholder: "Add a pilot by character name",
			"aria-label": "Add a pilot",
			className: "max-w-sm"
		}), o.length >= 2 && /* @__PURE__ */ V("div", {
			className: "mt-2 max-w-sm",
			children: l ? /* @__PURE__ */ V(_, { className: "px-2 py-1" }) : c?.length ? /* @__PURE__ */ V("ul", {
				className: "space-y-1",
				children: c.map((e) => /* @__PURE__ */ H("li", {
					className: "flex items-center gap-2.5 px-2 py-1 hover:bg-hover",
					children: [
						/* @__PURE__ */ V(t, {
							src: e.portrait,
							name: e.name,
							size: "xs"
						}),
						/* @__PURE__ */ H("span", {
							className: "min-w-0 flex-1 truncate text-sm",
							children: [e.name, /* @__PURE__ */ H("span", {
								className: "text-xs text-subtle",
								children: [" · ", e.member]
							})]
						}),
						/* @__PURE__ */ H(r, {
							size: "xs",
							variant: "subtle",
							loading: u.isPending && u.variables === e.id,
							onClick: () => u.mutate(e.id),
							children: [/* @__PURE__ */ V(K, {}), " Add"]
						})
					]
				}, e.id))
			}) : /* @__PURE__ */ V("p", {
				className: "px-2 py-1 text-xs text-subtle",
				children: "No registered character by that name who isn't in this fleet."
			})
		})]
	});
}
//#endregion
//#region src/index.tsx
function ye() {
	let { data: e, isLoading: t } = P({
		queryKey: ["fleets", "me"],
		queryFn: () => O.get(`${Z}/me`)
	});
	if (t) return /* @__PURE__ */ V(g, { className: "h-16" });
	if (!e) return null;
	let r = e.fleets[0];
	return /* @__PURE__ */ V(I, {
		to: "/p/fleets",
		className: "block",
		children: /* @__PURE__ */ H("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ H("div", { children: [
				/* @__PURE__ */ V("div", {
					className: "text-xs text-muted",
					children: "Fleets in the last 30 days"
				}),
				/* @__PURE__ */ V("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: e.counts.days_30
				}),
				/* @__PURE__ */ V("div", {
					className: "truncate text-xs text-subtle",
					children: r ? `Last: ${r.name}, ${j(r.started_at)}` : "No FATs yet"
				})
			] }), /* @__PURE__ */ H(n, {
				tone: "accent",
				children: [e.counts.all, " all time"]
			})]
		})
	});
}
var be = A({
	routes: [
		{
			path: "",
			Component: le
		},
		{
			path: "attendance",
			Component: fe
		},
		{
			path: "fat/:code",
			Component: me
		},
		{
			path: ":id",
			Component: he
		}
	],
	widgets: [{
		id: "my-fats",
		title: "Fleets",
		Component: ye,
		size: "sm",
		order: 35
	}]
});
//#endregion
export { be as default };

export const classes = ["!data","!o","!q","!type","-mt-2","@conduit/sdk","@tanstack/react-query","a","about","accent","accent-accent","act","action","actions","active","add","added","adding","afterwards","again","align","all","alt","and","animate-pulse","any","are","aria-label","as","at","attendance","attended","autoFocus","background","be","bg-accent","bg-hover","bg-success","bg-transparent","block","body","boolean","border","border-accent/50","border-b","border-border","border-l-2","border-t","boss","busy","but","by","by_type_30","can","canManage","can_edit","can_manage","can_run","can_track","candidates","character","characters","chars","chat","checkbox","checked","children","chosen","cid","className","closed","code","color","confirmLabel","const","count","counts","create","currentColor","cursor-pointer","cx","cy","danger","data","days","days_30","days_90","default","defaultValue","defense","del","delete","deleted","description","disabled","divide-border","divide-y","doesn","dot","dq","each","else","enabled","end","ended","ended_at","ends","error","esi","every","everyone","exist","expires_at","export","extends","eyebrow","false","far","fats","fc","fc-characters","few","fill","fleet","fleetId","fleet_type","fleets","flew","flex","flex-1","flex-wrap","fly","font-medium","font-mono","font-semibold","footer","for","from","function","gap-1","gap-2","gap-2.5","gap-3","gap-4","gap-6","get","gets","ghost","got","grant","granted","grid","group","h-1.5","h-16","h-28","h-40","h-80","h-9","h-96","h-fit","h-full","hand","has","have","height","here","hint","hour","hours","hover:bg-hover","hover:text-text","href","icon","icon-xs","icons","id","ids","if","import","in","in-game","info","inline","inline-flex","instead","interactive","interface","is","isLoading","isPending","isn","it","items","items-center","items-end","its","justify-between","key","label","last","last_at","lasted","length","lg","link","link_minutes","live","loading","log","lowers","m-card","m12","m13.41","m7","main","manage_fleets","manual","matches","max","max-w-sm","max-w-xl","max-w-xs","me","member","members","method","min","min-w-0","min-w-40","mine","minute","minutes","msg","mt-1","mt-2","must","mutationFn","mx-auto","my","my-fats","n","name","navigate","neutral","new","none","not","notes","now","null","number","o7","of","often","on","onAct","onAdded","onChange","onClick","onClose","onConfirm","onError","onFocus","onOpenChange","onSuccess","once","one","only","op","opacity-60","open","options","or","order","out","overview","p-card","page","paste","patch","path","per","period","pick","picked","picks","pills","pilot","pilots","pl-3","placeholder","placeholderData","portrait","post","primary","px-2","px-3","px-card","py-1","py-2","py-2.5","py-3","qc","queryFn","queryKey","react","react-router","read","readOnly","reads","recent","refetchInterval","refresh","register","registered","remove","removing","require","rest","retry","return","right","rotate-45","round","rounded-full","routes","rows","rule","rx","ry","s","see","select","server","set","setChar","setColor","setConfirm","setCreating","setDays","setDq","setForm","setName","setPicked","setQ","setType","share","ship","ships","show","site","size","size-2","size-2.5","size-3","size-3.5","size-4","size-5","sm","sm:grid-cols-3","sm:grid-cols-[1fr_200px]","so","space-y-1","space-y-3","space-y-4","space-y-6","src","start","started","started_at","starting","stats","stays","still","stopped","stops","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","subtle","success","system","t","tabular-nums","text-3xl","text-center","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-warning-fg","text-xs","that","the","their","them","they","this","ticked","time","timeAgo","title","to","toast","toggle","tone","towards","track","track_character","trackable","tracking","tracking_info","tracks","true","truncate","type","types","undefined","under","unknown","until","up","update","url","use","useNavigate","useOverview","useParams","useQuery","useQueryClient","useState","used","user_id","value","variables","variant","via","viewBox","void","w-1/3","w-10","w-44","w-64","w-8","w-full","warning","which","whitespace-nowrap","whitespace-pre-line","who","widgets","width","with","xl:grid-cols-[1fr_320px]","xl:grid-cols-[1fr_360px]","xs","year","yet","you","your"];
