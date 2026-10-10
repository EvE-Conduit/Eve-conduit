import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, Dialog as c, EmptyState as l, Field as u, Input as d, PageHeader as f, SearchInput as p, Segmented as m, Select as h, Skeleton as g, Spinner as _, StatCard as v, SwitchRow as y, THead as b, TabPanel as x, Table as S, TableToolbar as C, Tabs as w, Td as T, Textarea as E, Th as D, Tr as O, api as k, dateTime as ee, definePlugin as A, duration as te, timeAgo as j, toast as M, useHasPerm as ne } from "@conduit/sdk";
import { useMutation as N, useQuery as P, useQueryClient as F } from "@tanstack/react-query";
import { Link as I, useNavigate as L, useParams as R } from "react-router";
import { useEffect as z, useState as B } from "react";
import { Fragment as V, jsx as H, jsxs as U } from "react/jsx-runtime";
//#region src/icons.tsx
function W({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ H("svg", {
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
var G = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" }),
		/* @__PURE__ */ H("path", { d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" }),
		/* @__PURE__ */ H("path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" }),
		/* @__PURE__ */ H("path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" })
	]
}), K = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M19.07 4.93A10 10 0 0 0 6.99 3.34" }),
		/* @__PURE__ */ H("path", { d: "M4 6h.01" }),
		/* @__PURE__ */ H("path", { d: "M2.29 9.62A10 10 0 1 0 21.31 8.35" }),
		/* @__PURE__ */ H("path", { d: "M16.24 7.76A6 6 0 1 0 8.23 16.67" }),
		/* @__PURE__ */ H("path", { d: "M12 18h.01" }),
		/* @__PURE__ */ H("path", { d: "M17.99 11.66A6 6 0 0 1 15.77 16.67" }),
		/* @__PURE__ */ H("circle", {
			cx: "12",
			cy: "12",
			r: "2"
		}),
		/* @__PURE__ */ H("path", { d: "m13.41 10.59 5.66-5.66" })
	]
}), re = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ H("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })]
}), ie = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ H("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), q = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M5 12h14" }), /* @__PURE__ */ H("path", { d: "M12 5v14" })]
}), J = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M3 6h18" }),
		/* @__PURE__ */ H("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ H("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), ae = (e) => /* @__PURE__ */ H(W, {
	...e,
	children: /* @__PURE__ */ H("rect", {
		width: "14",
		height: "14",
		x: "5",
		y: "5",
		rx: "1"
	})
}), oe = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ H("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ H("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ H("path", { d: "M8 16H3v5" })
	]
}), Y = (e) => /* @__PURE__ */ H(W, {
	...e,
	children: /* @__PURE__ */ H("path", { d: "M20 6 9 17l-5-5" })
}), X = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }),
		/* @__PURE__ */ H("path", { d: "M18 17V9" }),
		/* @__PURE__ */ H("path", { d: "M13 17V5" }),
		/* @__PURE__ */ H("path", { d: "M8 17v-3" })
	]
}), se = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ H("path", { d: "M19 12H5" })]
}), ce = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M12 15V3" }),
		/* @__PURE__ */ H("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ H("path", { d: "m7 10 5 5 5-5" })
	]
}), Z = "/api/p/fleets", le = {
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
function ue({ chars: e, on: t }) {
	let n = e.filter((e) => !e.can_motd);
	return !t || !n.length ? null : /* @__PURE__ */ U("p", {
		className: "text-xs text-warning-fg",
		children: [
			n.map((e) => e.name).join(", "),
			" can't edit the MOTD yet: log in with ",
			n.length === 1 ? "it" : "them",
			" again under Characters. FATs are still tracked."
		]
	});
}
function Q({ type: e }) {
	return e ? /* @__PURE__ */ H(n, {
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
		queryFn: () => k.get(`${Z}?q=${encodeURIComponent(e)}${t ? `&type=${t}` : ""}`),
		placeholderData: (e) => e
	});
}
function de() {
	let e = L(), [t, a] = B(""), [o, s] = B(""), [c, u] = B(!1), { data: d, isLoading: m } = $(t.trim(), o);
	return /* @__PURE__ */ U(V, { children: [
		/* @__PURE__ */ H(f, {
			eyebrow: "Operations",
			title: "Fleets",
			icon: /* @__PURE__ */ H(G, {}),
			description: "Who flew in each fleet (FATs). FCs track their in-game fleet or hand out a FAT link; attendance counts towards group rules.",
			actions: /* @__PURE__ */ U("div", {
				className: "flex flex-wrap gap-2",
				children: [d?.can_manage && /* @__PURE__ */ H(I, {
					to: "/p/fleets/attendance",
					children: /* @__PURE__ */ U(r, {
						variant: "ghost",
						children: [/* @__PURE__ */ H(X, {}), " Attendance"]
					})
				}), d?.can_run && /* @__PURE__ */ U(r, {
					variant: "primary",
					onClick: () => u(!0),
					children: [/* @__PURE__ */ H(q, {}), " New fleet"]
				})]
			})
		}),
		m || !d ? /* @__PURE__ */ H("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ H(g, { className: "h-28" }, e))
		}) : /* @__PURE__ */ U("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ U("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ H(v, {
						label: "My FATs · 30 days",
						value: d.me.counts.days_30,
						tone: d.me.counts.days_30 ? "accent" : void 0,
						hint: d.me.by_type_30.map((e) => `${e.count} ${e.type}`).join(" · ") || "none yet"
					}),
					/* @__PURE__ */ H(v, {
						label: "My FATs · 90 days",
						value: d.me.counts.days_90
					}),
					/* @__PURE__ */ H(v, {
						label: "My FATs · all time",
						value: d.me.counts.all
					})
				]
			}), /* @__PURE__ */ U(w, {
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
				children: [/* @__PURE__ */ H(x, {
					value: "fleets",
					children: /* @__PURE__ */ U(i, { children: [/* @__PURE__ */ U(C, { children: [/* @__PURE__ */ H(p, {
						value: t,
						onChange: (e) => a(e.target.value),
						placeholder: "Fleet or FC",
						className: "w-64"
					}), /* @__PURE__ */ U(h, {
						value: o,
						onChange: (e) => s(e.target.value),
						className: "w-44",
						"aria-label": "Fleet type",
						children: [/* @__PURE__ */ H("option", {
							value: "",
							children: "All types"
						}), d.types.map((e) => /* @__PURE__ */ H("option", {
							value: e.id,
							children: e.name
						}, e.id))]
					})] }), d.fleets.length === 0 ? /* @__PURE__ */ H(l, {
						icon: /* @__PURE__ */ H(G, {}),
						title: t || o ? "No fleet matches" : "No fleets yet",
						description: d.can_run && !t && !o ? "Start one with New fleet." : void 0
					}) : /* @__PURE__ */ U(S, { children: [/* @__PURE__ */ H(b, { children: /* @__PURE__ */ U("tr", { children: [
						/* @__PURE__ */ H(D, { children: "Fleet" }),
						/* @__PURE__ */ H(D, { children: "FC" }),
						/* @__PURE__ */ H(D, { children: "When" }),
						/* @__PURE__ */ H(D, {
							align: "right",
							children: "Pilots"
						}),
						/* @__PURE__ */ H(D, { align: "right" })
					] }) }), /* @__PURE__ */ H("tbody", { children: d.fleets.map((t) => /* @__PURE__ */ U(O, {
						interactive: !0,
						onClick: () => e(`/p/fleets/${t.id}`),
						children: [
							/* @__PURE__ */ H(T, { children: /* @__PURE__ */ U("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ H("span", {
										className: "font-medium",
										children: t.name
									}),
									/* @__PURE__ */ H(Q, { type: t.type }),
									!t.ended_at && /* @__PURE__ */ H(n, {
										tone: "success",
										size: "xs",
										children: t.tracking ? /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(K, { className: "size-3" }), " Live"] }) : "Open"
									})
								]
							}) }),
							/* @__PURE__ */ H(T, {
								className: "text-sm text-muted",
								children: t.fc?.name ?? "—"
							}),
							/* @__PURE__ */ H(T, {
								className: "whitespace-nowrap text-sm text-muted",
								title: ee(t.started_at),
								children: j(t.started_at)
							}),
							/* @__PURE__ */ H(T, {
								numeric: !0,
								children: t.pilots
							}),
							/* @__PURE__ */ H(T, {
								align: "right",
								children: t.attended && /* @__PURE__ */ U(n, {
									tone: "accent",
									size: "xs",
									children: [/* @__PURE__ */ H(Y, { className: "size-3" }), " You flew"]
								})
							})
						]
					}, t.id)) })] })] })
				}), /* @__PURE__ */ H(x, {
					value: "mine",
					children: /* @__PURE__ */ H(i, { children: d.me.fleets.length === 0 ? /* @__PURE__ */ H(l, {
						icon: /* @__PURE__ */ H(G, {}),
						title: "No FATs yet",
						description: "Fleets you fly in show up here once the FC tracks the fleet or you use its FAT link."
					}) : /* @__PURE__ */ H("ul", {
						className: "divide-y divide-border",
						children: d.me.fleets.map((e) => /* @__PURE__ */ H("li", { children: /* @__PURE__ */ U(I, {
							to: `/p/fleets/${e.id}`,
							className: "flex items-center gap-3 px-card py-3 hover:bg-hover",
							children: [
								/* @__PURE__ */ U("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ U("div", {
										className: "flex items-center gap-2 font-medium",
										children: [
											e.name,
											" ",
											/* @__PURE__ */ H(Q, { type: e.type })
										]
									}), /* @__PURE__ */ U("div", {
										className: "truncate text-xs text-subtle",
										children: [
											e.characters.join(", "),
											" · FC ",
											e.fc?.name ?? "unknown"
										]
									})]
								}),
								e.fats > 1 && /* @__PURE__ */ U(n, {
									tone: "accent",
									size: "xs",
									children: [e.fats, " FATs"]
								}),
								/* @__PURE__ */ H("span", {
									className: "whitespace-nowrap text-xs text-muted",
									children: j(e.started_at)
								})
							]
						}) }, e.id))
					}) })
				})]
			})]
		}),
		c && d && /* @__PURE__ */ H(pe, {
			types: d.types,
			onClose: () => u(!1)
		})
	] });
}
var fe = [
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
function pe({ types: e, onClose: t }) {
	let n = F(), i = L(), { data: a } = P({
		queryKey: ["fleets", "fc-characters"],
		queryFn: () => k.get(`${Z}/fc/characters`)
	}), [o, s] = B({
		name: "",
		fleet_type: "",
		notes: "",
		link_minutes: "",
		track_character: "",
		motd: !0
	}), l = (e) => s((t) => ({
		...t,
		...e
	})), f = N({
		mutationFn: () => k.post(Z, {
			name: o.name,
			notes: o.notes,
			fleet_type: o.fleet_type ? Number(o.fleet_type) : null,
			link_minutes: o.link_minutes ? Number(o.link_minutes) : null,
			track_character: o.track_character ? Number(o.track_character) : null,
			motd: o.motd
		}),
		onSuccess: (e) => {
			n.invalidateQueries({ queryKey: ["fleets"] }), e.warning ? M.warning(e.warning) : M.success(e.tracking ? `Tracking ${e.name}: ${e.pilots} pilots so far` : `${e.name} started`), i(`/p/fleets/${e.id}`);
		},
		onError: (e) => M.error(e.message)
	}), p = (a ?? []).filter((e) => e.can_track);
	return /* @__PURE__ */ H(c, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: "New fleet",
		description: "Pilots get a FAT from your in-game fleet, the FAT link, or both.",
		size: "lg",
		footer: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(r, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), /* @__PURE__ */ U(r, {
			variant: "primary",
			disabled: !o.name.trim(),
			loading: f.isPending,
			onClick: () => f.mutate(),
			children: [/* @__PURE__ */ H(G, {}), " Start fleet"]
		})] }),
		children: /* @__PURE__ */ U("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ U("div", {
					className: "grid gap-4 sm:grid-cols-[1fr_200px]",
					children: [/* @__PURE__ */ H(u, {
						label: "Name",
						required: !0,
						children: /* @__PURE__ */ H(d, {
							value: o.name,
							onChange: (e) => l({ name: e.target.value }),
							placeholder: "Sunday CTA: Keepstar defense",
							autoFocus: !0
						})
					}), /* @__PURE__ */ H(u, {
						label: "Type",
						children: /* @__PURE__ */ U(h, {
							value: o.fleet_type,
							onChange: (e) => l({ fleet_type: e.target.value }),
							children: [/* @__PURE__ */ H("option", {
								value: "",
								children: "None"
							}), e.map((e) => /* @__PURE__ */ H("option", {
								value: e.id,
								children: e.name
							}, e.id))]
						})
					})]
				}),
				/* @__PURE__ */ H(u, {
					label: "Track the in-game fleet with",
					hint: "That character must be fleet boss. Everyone in the fleet gets a FAT, checked every minute.",
					children: /* @__PURE__ */ U(h, {
						value: o.track_character,
						onChange: (e) => l({ track_character: e.target.value }),
						children: [/* @__PURE__ */ H("option", {
							value: "",
							children: "Don't track; use the FAT link"
						}), p.map((e) => /* @__PURE__ */ H("option", {
							value: e.id,
							children: e.name
						}, e.id))]
					})
				}),
				o.track_character && /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(y, {
					label: "FATs in the fleet MOTD",
					description: "Who has a FAT and the FAT link, added below your own MOTD text and updated as pilots get one.",
					checked: o.motd,
					onCheckedChange: (e) => l({ motd: e })
				}), /* @__PURE__ */ H(ue, {
					chars: p.filter((e) => String(e.id) === o.track_character),
					on: o.motd
				})] }),
				a && a.length > p.length && /* @__PURE__ */ U("p", {
					className: "-mt-2 text-xs text-subtle",
					children: [a.filter((e) => !e.can_track).map((e) => e.name).join(", "), " can't track: log in with them again to grant fleet access."]
				}),
				/* @__PURE__ */ H(u, {
					label: "FAT link stays open",
					children: /* @__PURE__ */ H(h, {
						value: o.link_minutes,
						onChange: (e) => l({ link_minutes: e.target.value }),
						options: fe,
						className: "max-w-xs"
					})
				}),
				/* @__PURE__ */ H(u, {
					label: "Notes",
					hint: "Doctrine, comms, staging. Pilots see this on the FAT link page.",
					children: /* @__PURE__ */ H(E, {
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
function me() {
	let [e, a] = B("30"), [o, s] = B(""), { data: c } = $(), { data: u, isLoading: d } = P({
		queryKey: [
			"fleets",
			"stats",
			e,
			o
		],
		queryFn: () => k.get(`${Z}/stats/members?days=${e}${o ? `&type=${o}` : ""}`),
		placeholderData: (e) => e
	}), p = Math.max(1, ...(u?.members ?? []).map((e) => e.fats));
	return /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(f, {
		eyebrow: /* @__PURE__ */ U(I, {
			to: "/p/fleets",
			className: "inline-flex items-center gap-1 hover:text-text",
			children: [/* @__PURE__ */ H(se, { className: "size-3" }), " Fleets"]
		}),
		title: "Attendance",
		icon: /* @__PURE__ */ H(X, {}),
		description: "FATs per member with any of their characters: one per fleet, or per FAT round when the FC started more than one. Use the Fleet attendance rule on a group to require it.",
		actions: /* @__PURE__ */ H("a", {
			href: `${Z}/stats/members.csv?days=${e}${o ? `&type=${o}` : ""}`,
			download: !0,
			children: /* @__PURE__ */ U(r, {
				variant: "ghost",
				children: [/* @__PURE__ */ H(ce, {}), " CSV"]
			})
		})
	}), /* @__PURE__ */ U("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_320px]",
		children: [/* @__PURE__ */ U(i, { children: [/* @__PURE__ */ U(C, { children: [/* @__PURE__ */ H(m, {
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
		}), /* @__PURE__ */ U(h, {
			value: o,
			onChange: (e) => s(e.target.value),
			className: "w-44",
			"aria-label": "Fleet type",
			children: [/* @__PURE__ */ H("option", {
				value: "",
				children: "All types"
			}), (c?.types ?? []).map((e) => /* @__PURE__ */ H("option", {
				value: e.id,
				children: e.name
			}, e.id))]
		})] }), d || !u ? /* @__PURE__ */ H(g, { className: "m-card h-40" }) : u.members.length === 0 ? /* @__PURE__ */ H(l, {
			icon: /* @__PURE__ */ H(X, {}),
			title: "No FATs in this period"
		}) : /* @__PURE__ */ U(S, { children: [/* @__PURE__ */ H(b, { children: /* @__PURE__ */ U("tr", { children: [
			/* @__PURE__ */ H(D, { children: "Member" }),
			/* @__PURE__ */ H(D, { children: "FATs" }),
			/* @__PURE__ */ H(D, { children: "Last fleet" })
		] }) }), /* @__PURE__ */ H("tbody", { children: u.members.map((e) => /* @__PURE__ */ U(O, { children: [
			/* @__PURE__ */ H(T, { children: /* @__PURE__ */ U("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ H(t, {
					src: e.portrait,
					name: e.name,
					size: "sm"
				}), /* @__PURE__ */ U("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ U("div", {
						className: "flex items-center gap-2 font-medium",
						children: [e.name, !e.registered && /* @__PURE__ */ H(n, {
							tone: "warning",
							size: "xs",
							children: "not registered"
						})]
					}), /* @__PURE__ */ H("div", {
						className: "truncate text-xs text-subtle",
						children: e.characters.join(", ")
					})]
				})]
			}) }),
			/* @__PURE__ */ H(T, {
				className: "w-1/3",
				children: /* @__PURE__ */ U("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ H("div", {
						className: "h-1.5 flex-1 bg-hover",
						children: /* @__PURE__ */ H("div", {
							className: "h-full bg-accent",
							style: { width: `${e.fats / p * 100}%` }
						})
					}), /* @__PURE__ */ H("span", {
						className: "w-8 text-right font-mono tabular-nums",
						title: `${e.fleets} fleet${e.fleets === 1 ? "" : "s"}`,
						children: e.fats
					})]
				})
			}),
			/* @__PURE__ */ H(T, {
				className: "whitespace-nowrap text-sm text-muted",
				children: j(e.last)
			})
		] }, e.key)) })] })] }), /* @__PURE__ */ H(he, {})]
	})] });
}
function he() {
	let e = F(), { data: t } = $(), [n, a] = B(""), [s, c] = B("#38bdf8"), l = () => e.invalidateQueries({ queryKey: ["fleets"] }), u = N({
		mutationFn: () => k.post(`${Z}/types`, {
			name: n,
			color: s
		}),
		onSuccess: () => {
			a(""), l(), M.success("Fleet type added");
		},
		onError: (e) => M.error(e.message)
	}), f = N({
		mutationFn: (e) => k.delete(`${Z}/types/${e}`),
		onSuccess: l,
		onError: (e) => M.error(e.message)
	});
	return /* @__PURE__ */ U(i, {
		className: "h-fit",
		children: [
			/* @__PURE__ */ H(o, {
				title: "Fleet types",
				description: "FCs pick one per fleet; the FAT rule can count only some."
			}),
			/* @__PURE__ */ H("ul", {
				className: "divide-y divide-border",
				children: (t?.types ?? []).map((e) => /* @__PURE__ */ U("li", {
					className: "flex items-center gap-2.5 px-card py-2 text-sm",
					children: [
						/* @__PURE__ */ H("span", {
							className: "size-2.5 rotate-45",
							style: { background: e.color }
						}),
						/* @__PURE__ */ H("span", {
							className: "flex-1",
							children: e.name
						}),
						/* @__PURE__ */ H(r, {
							variant: "ghost",
							size: "icon-xs",
							"aria-label": `Remove ${e.name}`,
							onClick: () => f.mutate(e.id),
							children: /* @__PURE__ */ H(J, {})
						})
					]
				}, e.id))
			}),
			/* @__PURE__ */ U("div", {
				className: "flex gap-2 border-t border-border p-card",
				children: [
					/* @__PURE__ */ H("input", {
						type: "color",
						value: s,
						onChange: (e) => c(e.target.value),
						className: "h-9 w-10 cursor-pointer border border-border bg-transparent",
						"aria-label": "Colour"
					}),
					/* @__PURE__ */ H(d, {
						value: n,
						onChange: (e) => a(e.target.value),
						placeholder: "New type, e.g. Capital op"
					}),
					/* @__PURE__ */ H(r, {
						size: "icon",
						disabled: !n.trim(),
						loading: u.isPending,
						onClick: () => u.mutate(),
						"aria-label": "Add fleet type",
						children: /* @__PURE__ */ H(q, {})
					})
				]
			})
		]
	});
}
//#endregion
//#region src/fat.tsx
function ge() {
	let { code: n } = R(), o = F(), { data: s, isLoading: c, error: u } = P({
		queryKey: [
			"fleets",
			"link",
			n
		],
		queryFn: () => k.get(`${Z}/fat/${n}`),
		retry: !1
	}), [d, p] = B(null), m = N({
		mutationFn: (e) => k.post(`${Z}/fat/${n}`, { characters: e }),
		onSuccess: (e) => {
			o.invalidateQueries({ queryKey: ["fleets"] }), M.success(e.added ? `FAT registered for ${e.added} character${e.added === 1 ? "" : "s"}. o7` : "Already registered"), p(/* @__PURE__ */ new Set());
		},
		onError: (e) => M.error(e.message)
	});
	if (u) return /* @__PURE__ */ H(l, {
		icon: /* @__PURE__ */ H(G, {}),
		title: "This FAT link doesn't exist",
		description: "Check the link with your FC."
	});
	if (c || !s) return /* @__PURE__ */ H(g, { className: "mx-auto h-80 max-w-xl" });
	let h = s.characters.filter((e) => !e.registered && e.allowed), _ = d ?? new Set(h.slice(0, 1).map((e) => e.id)), v = (e) => {
		let t = new Set(_);
		t.has(e) ? t.delete(e) : t.add(e), p(t);
	};
	return /* @__PURE__ */ U("div", {
		className: "mx-auto max-w-xl",
		children: [/* @__PURE__ */ H(f, {
			eyebrow: "FAT link",
			title: /* @__PURE__ */ U("span", {
				className: "flex flex-wrap items-center gap-3",
				children: [
					s.name,
					" ",
					/* @__PURE__ */ H(Q, { type: s.type })
				]
			}),
			icon: /* @__PURE__ */ H(G, {}),
			description: `FC ${s.fc?.name ?? "unknown"} · started ${j(s.started_at)}`
		}), /* @__PURE__ */ H(i, { children: /* @__PURE__ */ U(a, {
			className: "space-y-4",
			children: [
				s.notes && /* @__PURE__ */ H("p", {
					className: "whitespace-pre-line border-l-2 border-accent/50 pl-3 text-sm text-muted",
					children: s.notes
				}),
				s.open ? /* @__PURE__ */ U(V, { children: [
					s.tracked && /* @__PURE__ */ H(e, {
						tone: "info",
						title: "This fleet is tracked",
						children: "Everyone in the in-game fleet gets a FAT by itself within a minute. Characters that weren't in it can't be registered here."
					}),
					/* @__PURE__ */ U("div", {
						className: "text-sm font-medium",
						children: [
							"Which characters flew in this fleet",
							s.round > 1 ? ` (FAT round ${s.round})` : "",
							"?"
						]
					}),
					/* @__PURE__ */ H("ul", {
						className: "divide-y divide-border border border-border",
						children: s.characters.map((e) => /* @__PURE__ */ H("li", { children: /* @__PURE__ */ U("label", {
							className: `flex items-center gap-3 px-3 py-2.5 ${e.registered || !e.allowed ? "opacity-60" : "cursor-pointer hover:bg-hover"}`,
							children: [
								/* @__PURE__ */ H("input", {
									type: "checkbox",
									className: "size-4 accent-accent",
									disabled: e.registered || !e.allowed,
									checked: e.registered || _.has(e.id),
									onChange: () => v(e.id)
								}),
								/* @__PURE__ */ H(t, {
									src: e.portrait,
									name: e.name,
									size: "sm"
								}),
								/* @__PURE__ */ H("span", {
									className: "flex-1 text-sm",
									children: e.name
								}),
								e.registered ? /* @__PURE__ */ U("span", {
									className: "flex items-center gap-1 text-xs text-success-fg",
									children: [/* @__PURE__ */ H(Y, { className: "size-3.5" }), " FAT"]
								}) : !e.allowed && /* @__PURE__ */ H("span", {
									className: "text-xs text-subtle",
									children: "not in the fleet"
								})
							]
						}) }, e.id))
					}),
					/* @__PURE__ */ U(r, {
						variant: "primary",
						className: "w-full",
						disabled: _.size === 0 || !h.length,
						loading: m.isPending,
						onClick: () => m.mutate([..._]),
						children: [
							/* @__PURE__ */ H(Y, {}),
							" Register ",
							_.size || "",
							" FAT",
							_.size === 1 ? "" : "s"
						]
					})
				] }) : /* @__PURE__ */ H(e, {
					tone: "warning",
					title: "This link has closed",
					children: "Ask the FC to add you if you flew in this fleet."
				}),
				/* @__PURE__ */ H(I, {
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
function _e() {
	let { id: c } = R(), u = F(), d = L(), p = ne("fleets.manage_fleets"), m = [
		"fleets",
		"fleet",
		c
	], { data: h, isLoading: _, error: v } = P({
		queryKey: m,
		queryFn: () => k.get(`${Z}/${c}`),
		refetchInterval: (e) => e.state.data?.tracking ? 3e4 : !1,
		retry: !1
	}), [y, x] = B(null), C = (e, t) => {
		u.setQueryData(m, e), u.invalidateQueries({ queryKey: ["fleets", "overview"] }), t && M.success(t);
	}, w = N({
		mutationFn: ({ path: e, method: t = "post", body: n }) => t === "post" ? k.post(`${Z}/${c}${e}`, n ?? {}) : k.delete(`${Z}/${c}${e}`),
		onSuccess: (e, t) => C(e, t.msg ?? (e.added ? `${e.added} new pilot${e.added === 1 ? "" : "s"}` : void 0)),
		onError: (e) => M.error(e.message)
	}), E = N({
		mutationFn: () => k.delete(`${Z}/${c}`),
		onSuccess: () => {
			u.invalidateQueries({ queryKey: ["fleets"] }), M.success("Fleet deleted"), d("/p/fleets");
		},
		onError: (e) => M.error(e.message)
	});
	if (v) return /* @__PURE__ */ H(l, {
		icon: /* @__PURE__ */ H(G, {}),
		title: "This fleet doesn't exist",
		action: /* @__PURE__ */ H(I, {
			to: "/p/fleets",
			children: /* @__PURE__ */ H(r, { children: "Back to fleets" })
		})
	});
	if (_ || !h) return /* @__PURE__ */ H(g, { className: "h-96" });
	let A = !h.ended_at;
	return /* @__PURE__ */ U(V, { children: [
		/* @__PURE__ */ H(f, {
			eyebrow: /* @__PURE__ */ U(I, {
				to: "/p/fleets",
				className: "inline-flex items-center gap-1 hover:text-text",
				children: [/* @__PURE__ */ H(se, { className: "size-3" }), " Fleets"]
			}),
			title: /* @__PURE__ */ U("span", {
				className: "flex flex-wrap items-center gap-3",
				children: [
					h.name,
					" ",
					/* @__PURE__ */ H(Q, { type: h.type }),
					A ? /* @__PURE__ */ H(n, {
						tone: "success",
						children: h.tracking ? "Live" : "Open"
					}) : /* @__PURE__ */ H(n, { children: "Ended" })
				]
			}),
			description: /* @__PURE__ */ U(V, { children: [
				"FC ",
				h.fc?.name ?? "unknown",
				" · started ",
				ee(h.started_at),
				h.ended_at && /* @__PURE__ */ U(V, { children: [" · lasted ", te(h.ended_at, new Date(h.started_at).getTime())] })
			] }),
			actions: h.can_edit ? /* @__PURE__ */ U("div", {
				className: "flex flex-wrap gap-2",
				children: [A && /* @__PURE__ */ U(r, {
					variant: "primary",
					onClick: () => x("end"),
					children: [/* @__PURE__ */ H(ae, {}), " End fleet"]
				}), p && /* @__PURE__ */ H(r, {
					variant: "danger",
					size: "icon",
					"aria-label": "Delete fleet",
					onClick: () => x("delete"),
					children: /* @__PURE__ */ H(J, {})
				})]
			}) : void 0
		}),
		/* @__PURE__ */ U("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_360px]",
			children: [/* @__PURE__ */ U("div", {
				className: "min-w-0 space-y-6",
				children: [
					h.attended && /* @__PURE__ */ H(e, {
						tone: "success",
						title: "You have a FAT for this fleet"
					}),
					h.notes && /* @__PURE__ */ H(i, { children: /* @__PURE__ */ H(a, {
						className: "whitespace-pre-line text-sm text-muted",
						children: h.notes
					}) }),
					/* @__PURE__ */ U(i, { children: [
						/* @__PURE__ */ H(o, {
							title: `Pilots · ${h.pilots}`,
							description: `${h.members} member${h.members === 1 ? "" : "s"} on this site${h.round > 1 ? ` · ${h.fat_count} FATs over ${h.round} rounds` : ""}`
						}),
						h.can_edit && A && /* @__PURE__ */ H(xe, {
							fleetId: h.id,
							onAdded: (e) => C(e, "Added")
						}),
						h.fats.length === 0 ? /* @__PURE__ */ H(l, {
							icon: /* @__PURE__ */ H(G, {}),
							title: "Nobody yet",
							description: h.can_edit ? "Track your in-game fleet or share the FAT link." : void 0
						}) : /* @__PURE__ */ U(S, { children: [/* @__PURE__ */ H(b, { children: /* @__PURE__ */ U("tr", { children: [
							/* @__PURE__ */ H(D, { children: "Pilot" }),
							h.round > 1 && /* @__PURE__ */ H(D, { children: "Round" }),
							/* @__PURE__ */ H(D, { children: "Ship" }),
							/* @__PURE__ */ H(D, { children: "System" }),
							/* @__PURE__ */ H(D, { children: "How" }),
							h.can_edit && /* @__PURE__ */ H(D, {})
						] }) }), /* @__PURE__ */ H("tbody", { children: h.fats.map((e) => /* @__PURE__ */ U(O, { children: [
							/* @__PURE__ */ H(T, { children: /* @__PURE__ */ U("div", {
								className: "flex items-center gap-2.5",
								children: [/* @__PURE__ */ H(t, {
									src: e.character.portrait,
									name: e.character.name,
									size: "xs"
								}), /* @__PURE__ */ U("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ H("div", {
										className: "truncate text-sm font-medium",
										children: e.character.name
									}), /* @__PURE__ */ H("div", {
										className: "truncate text-xs text-subtle",
										children: e.member ? e.member.name === e.character.name ? "" : e.member.name : "not registered"
									})]
								})]
							}) }),
							h.round > 1 && /* @__PURE__ */ H(T, {
								className: "font-mono text-sm tabular-nums text-muted",
								children: e.round
							}),
							/* @__PURE__ */ H(T, { children: e.ship?.name ? /* @__PURE__ */ U("span", {
								className: "flex items-center gap-2 text-sm",
								children: [/* @__PURE__ */ H("img", {
									src: e.ship.icon,
									alt: "",
									className: "size-5"
								}), e.ship.name]
							}) : /* @__PURE__ */ H("span", {
								className: "text-subtle",
								children: "—"
							}) }),
							/* @__PURE__ */ H(T, {
								className: "text-sm text-muted",
								children: e.system ?? "—"
							}),
							/* @__PURE__ */ H(T, { children: /* @__PURE__ */ H(n, {
								tone: le[e.via].tone,
								size: "xs",
								children: le[e.via].label
							}) }),
							h.can_edit && /* @__PURE__ */ H(T, {
								align: "right",
								children: /* @__PURE__ */ H(r, {
									variant: "ghost",
									size: "icon-xs",
									"aria-label": `Remove ${e.character.name}`,
									onClick: () => w.mutate({
										path: `/fats/${e.id}`,
										method: "delete",
										msg: `Removed ${e.character.name}`
									}),
									children: /* @__PURE__ */ H(J, {})
								})
							})
						] }, e.id)) })] })
					] })
				]
			}), /* @__PURE__ */ U("div", {
				className: "space-y-6",
				children: [
					h.can_edit && /* @__PURE__ */ H(ye, {
						data: h,
						live: A,
						onNew: () => x("round")
					}),
					h.can_edit && h.tracking_info && /* @__PURE__ */ H(ve, {
						data: h,
						live: A,
						busy: w.isPending,
						onAct: (e) => w.mutate(e)
					}),
					h.can_edit && h.link && /* @__PURE__ */ H(be, {
						data: h,
						live: A,
						onAct: (e) => w.mutate(e)
					}),
					h.ships.length > 0 && /* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, { title: "Ships" }), /* @__PURE__ */ H("ul", {
						className: "divide-y divide-border",
						children: h.ships.map((e) => /* @__PURE__ */ U("li", {
							className: "flex items-center justify-between px-card py-2 text-sm",
							children: [/* @__PURE__ */ H("span", { children: e.name }), /* @__PURE__ */ H("span", {
								className: "font-mono tabular-nums text-muted",
								children: e.count
							})]
						}, e.name))
					})] })
				]
			})]
		}),
		/* @__PURE__ */ H(s, {
			open: y === "end",
			onOpenChange: (e) => !e && x(null),
			title: `End ${h.name}?`,
			description: "Tracking stops and the FAT link closes. You can still add or remove pilots afterwards from here.",
			confirmLabel: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(ae, {}), " End fleet"] }),
			onConfirm: () => w.mutateAsync({
				path: "/end",
				msg: "Fleet ended"
			})
		}),
		/* @__PURE__ */ H(s, {
			open: y === "round",
			onOpenChange: (e) => !e && x(null),
			title: `Start FAT round ${h.round + 1}?`,
			description: h.tracking ? "Everyone in the in-game fleet gets another FAT now, and so does anyone who joins during this round." : "Pilots can get another FAT from the FAT link, or you add them.",
			confirmLabel: /* @__PURE__ */ U(V, { children: [
				/* @__PURE__ */ H(q, {}),
				" Start round ",
				h.round + 1
			] }),
			onConfirm: () => w.mutateAsync({
				path: "/rounds",
				msg: `FAT round ${h.round + 1} started`
			})
		}),
		/* @__PURE__ */ H(s, {
			open: y === "delete",
			onOpenChange: (e) => !e && x(null),
			danger: !0,
			title: `Delete ${h.name}?`,
			description: `Its ${h.fat_count} FATs are deleted too, which lowers everyone's attendance.`,
			confirmLabel: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(J, {}), " Delete"] }),
			onConfirm: () => E.mutateAsync()
		})
	] });
}
function ve({ data: t, live: n, busy: s, onAct: c }) {
	let l = t.tracking_info, { data: u } = P({
		queryKey: ["fleets", "fc-characters"],
		queryFn: () => k.get(`${Z}/fc/characters`),
		enabled: n && !t.tracking
	}), [d, f] = B(""), [p, m] = B(!0), g = (u ?? []).filter((e) => e.can_track);
	return z(() => {
		!d && g[0] && f(String(g[0].id));
	}, [d, g]), /* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, {
		title: "In-game fleet",
		icon: /* @__PURE__ */ H(K, {}),
		description: "Everyone in it gets a FAT, checked every minute."
	}), /* @__PURE__ */ H(a, {
		className: "space-y-3 text-sm",
		children: t.tracking ? /* @__PURE__ */ U(V, { children: [
			/* @__PURE__ */ U("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ H("span", { className: "size-2 animate-pulse rounded-full bg-success" }),
					"Tracking with ",
					/* @__PURE__ */ H("span", {
						className: "font-medium",
						children: l.character?.name
					})
				]
			}),
			/* @__PURE__ */ U("div", {
				className: "text-xs text-muted",
				children: ["Last read ", j(l.last_at)]
			}),
			l.error && /* @__PURE__ */ H("p", {
				className: "text-xs text-warning-fg",
				children: l.error
			}),
			/* @__PURE__ */ H(y, {
				label: "FATs in the fleet MOTD",
				description: "Who has a FAT and the FAT link, added below your own MOTD text and updated as pilots get one.",
				checked: l.motd,
				disabled: s,
				onCheckedChange: (e) => c({
					path: "/motd",
					body: { on: e },
					msg: e ? "FATs added to the MOTD" : "FATs taken out of the MOTD"
				})
			}),
			l.motd && l.motd_error && /* @__PURE__ */ H("p", {
				className: "text-xs text-warning-fg",
				children: l.motd_error
			}),
			/* @__PURE__ */ U("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ U(r, {
					size: "sm",
					loading: s,
					onClick: () => c({ path: "/refresh" }),
					children: [/* @__PURE__ */ H(oe, {}), " Read now"]
				}), /* @__PURE__ */ H(r, {
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
		] }) : /* @__PURE__ */ U(V, { children: [l.error && /* @__PURE__ */ H(e, {
			tone: "warning",
			title: "Tracking stopped",
			children: l.error
		}), n ? g.length ? /* @__PURE__ */ U(V, { children: [
			/* @__PURE__ */ U("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ H(h, {
					value: d,
					onChange: (e) => f(e.target.value),
					className: "min-w-40 flex-1",
					"aria-label": "Fleet boss",
					children: g.map((e) => /* @__PURE__ */ H("option", {
						value: e.id,
						children: e.name
					}, e.id))
				}), /* @__PURE__ */ U(r, {
					size: "sm",
					variant: "primary",
					loading: s,
					disabled: !d,
					onClick: () => c({
						path: "/track",
						body: {
							character: Number(d),
							motd: p
						},
						msg: "Tracking started"
					}),
					children: [/* @__PURE__ */ H(K, {}), " Track"]
				})]
			}),
			/* @__PURE__ */ H(y, {
				label: "FATs in the fleet MOTD",
				description: "Added below your own MOTD text and updated as pilots get one.",
				checked: p,
				onCheckedChange: m
			}),
			/* @__PURE__ */ H(ue, {
				chars: g.filter((e) => String(e.id) === d),
				on: p
			})
		] }) : /* @__PURE__ */ H("p", {
			className: "text-xs text-muted",
			children: "None of your characters has granted fleet access. Log in with your FC character again under Characters."
		}) : /* @__PURE__ */ H("p", {
			className: "text-xs text-muted",
			children: "The fleet has ended."
		})] })
	})] });
}
function ye({ data: e, live: t, onNew: s }) {
	return /* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, {
		title: "FAT rounds",
		icon: /* @__PURE__ */ H(q, {}),
		description: "Each round is one more FAT, e.g. every hour of a long op. Rounds are at least 15 minutes apart."
	}), /* @__PURE__ */ U(a, {
		className: "space-y-3 text-sm",
		children: [/* @__PURE__ */ H("ul", {
			className: "divide-y divide-border border border-border",
			children: e.rounds.map((r) => /* @__PURE__ */ U("li", {
				className: "flex items-center justify-between px-3 py-2",
				children: [/* @__PURE__ */ U("span", { children: [
					"Round ",
					r.round,
					r.round === e.round && t && /* @__PURE__ */ H(n, {
						tone: "success",
						size: "xs",
						className: "ml-2",
						children: "now"
					}),
					r.round === e.round && e.round_started_at && /* @__PURE__ */ U("span", {
						className: "ml-2 text-xs text-subtle",
						children: ["since ", j(e.round_started_at)]
					})
				] }), /* @__PURE__ */ U("span", {
					className: "font-mono tabular-nums text-muted",
					children: [
						r.pilots,
						" pilot",
						r.pilots === 1 ? "" : "s"
					]
				})]
			}, r.round))
		}), t && /* @__PURE__ */ U(r, {
			size: "sm",
			onClick: s,
			children: [/* @__PURE__ */ H(q, {}), " New FAT round"]
		})]
	})] });
}
function be({ data: e, live: t, onAct: s }) {
	let c = e.link, l = `${window.location.origin}/p/fleets/fat/${c.code}`;
	return /* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, {
		title: "FAT link",
		icon: /* @__PURE__ */ H(re, {}),
		description: "Pilots open it and pick the characters they flew with."
	}), /* @__PURE__ */ U(a, {
		className: "space-y-3 text-sm",
		children: [
			c.tracked_only && /* @__PURE__ */ H("p", {
				className: "text-xs text-muted",
				children: "This fleet is tracked, so the link can't add anyone: it only takes characters seen in the in-game fleet this round, who already have their FAT."
			}),
			/* @__PURE__ */ U("div", {
				className: "flex",
				children: [/* @__PURE__ */ H(d, {
					readOnly: !0,
					value: l,
					onFocus: (e) => e.target.select(),
					className: "font-mono text-xs"
				}), /* @__PURE__ */ H(r, {
					size: "icon",
					"aria-label": "Copy the FAT link",
					onClick: () => navigator.clipboard.writeText(l).then(() => M.success("Link copied; paste it in fleet chat"), () => M.error("Couldn't copy; select the link instead")),
					children: /* @__PURE__ */ H(ie, {})
				})]
			}),
			c.active ? /* @__PURE__ */ U("div", {
				className: "flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ U(n, {
					tone: "success",
					children: ["Open", c.expires_at ? ` until ${new Date(c.expires_at).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit"
					})}` : ""]
				}), /* @__PURE__ */ H(r, {
					size: "sm",
					variant: "ghost",
					onClick: () => s({
						path: "/link",
						body: { open: !1 },
						msg: "Link closed"
					}),
					children: "Close link"
				})]
			}) : t ? /* @__PURE__ */ U("div", {
				className: "flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ H(n, { children: "Closed" }), /* @__PURE__ */ U("div", {
					className: "flex gap-1",
					children: [/* @__PURE__ */ H(r, {
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
					}), /* @__PURE__ */ H(r, {
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
			}) : /* @__PURE__ */ H(n, { children: "Closed with the fleet" })
		]
	})] });
}
function xe({ fleetId: e, onAdded: n }) {
	let [i, a] = B(""), [o, s] = B("");
	z(() => {
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
		queryFn: () => k.get(`${Z}/${e}/candidates?q=${encodeURIComponent(o)}`),
		enabled: o.length >= 2
	}), u = N({
		mutationFn: (t) => k.post(`${Z}/${e}/fats`, { characters: [t] }),
		onSuccess: (e) => {
			a(""), n(e);
		},
		onError: (e) => M.error(e.message)
	});
	return /* @__PURE__ */ U("div", {
		className: "border-b border-border px-card py-3",
		children: [/* @__PURE__ */ H(d, {
			value: i,
			onChange: (e) => a(e.target.value),
			placeholder: "Add a pilot by character name",
			"aria-label": "Add a pilot",
			className: "max-w-sm"
		}), o.length >= 2 && /* @__PURE__ */ H("div", {
			className: "mt-2 max-w-sm",
			children: l ? /* @__PURE__ */ H(_, { className: "px-2 py-1" }) : c?.length ? /* @__PURE__ */ H("ul", {
				className: "space-y-1",
				children: c.map((e) => /* @__PURE__ */ U("li", {
					className: "flex items-center gap-2.5 px-2 py-1 hover:bg-hover",
					children: [
						/* @__PURE__ */ H(t, {
							src: e.portrait,
							name: e.name,
							size: "xs"
						}),
						/* @__PURE__ */ U("span", {
							className: "min-w-0 flex-1 truncate text-sm",
							children: [e.name, /* @__PURE__ */ U("span", {
								className: "text-xs text-subtle",
								children: [" · ", e.member]
							})]
						}),
						/* @__PURE__ */ U(r, {
							size: "xs",
							variant: "subtle",
							loading: u.isPending && u.variables === e.id,
							onClick: () => u.mutate(e.id),
							children: [/* @__PURE__ */ H(q, {}), " Add"]
						})
					]
				}, e.id))
			}) : /* @__PURE__ */ H("p", {
				className: "px-2 py-1 text-xs text-subtle",
				children: "No registered character by that name who isn't in this fleet."
			})
		})]
	});
}
//#endregion
//#region src/index.tsx
function Se() {
	let { data: e, isLoading: t } = P({
		queryKey: ["fleets", "me"],
		queryFn: () => k.get(`${Z}/me`)
	});
	if (t) return /* @__PURE__ */ H(g, { className: "h-16" });
	if (!e) return null;
	let r = e.fleets[0];
	return /* @__PURE__ */ H(I, {
		to: "/p/fleets",
		className: "block",
		children: /* @__PURE__ */ U("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ U("div", { children: [
				/* @__PURE__ */ H("div", {
					className: "text-xs text-muted",
					children: "Fleets in the last 30 days"
				}),
				/* @__PURE__ */ H("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: e.counts.days_30
				}),
				/* @__PURE__ */ H("div", {
					className: "truncate text-xs text-subtle",
					children: r ? `Last: ${r.name}, ${j(r.started_at)}` : "No FATs yet"
				})
			] }), /* @__PURE__ */ U(n, {
				tone: "accent",
				children: [e.counts.all, " all time"]
			})]
		})
	});
}
var Ce = A({
	routes: [
		{
			path: "",
			Component: de
		},
		{
			path: "attendance",
			Component: me
		},
		{
			path: "fat/:code",
			Component: ge
		},
		{
			path: ":id",
			Component: _e
		}
	],
	widgets: [{
		id: "my-fats",
		title: "Fleets",
		Component: Se,
		size: "sm",
		order: 35
	}]
});
//#endregion
export { Ce as default };

export const classes = ["!data","!o","!q","!type","-mt-2","@conduit/sdk","@tanstack/react-query","a","about","accent","accent-accent","act","action","actions","active","add","added","adding","afterwards","again","align","all","allowed","already","alt","and","animate-pulse","another","any","anyone","are","aria-label","as","at","attendance","attended","autoFocus","background","be","below","bg-accent","bg-hover","bg-success","bg-transparent","block","body","boolean","border","border-accent/50","border-b","border-border","border-l-2","border-t","boss","busy","but","by","by_type_30","can","canManage","can_edit","can_manage","can_motd","can_run","can_track","candidates","character","characters","chars","chat","checkbox","checked","children","chosen","cid","className","closed","code","color","confirmLabel","const","count","counts","create","current","currentColor","cursor-pointer","cx","cy","danger","data","days","days_30","days_90","default","defaultValue","defense","del","delete","deleted","description","disabled","divide-border","divide-y","does","doesn","dot","dq","during","each","edit","else","enabled","end","ended","ended_at","ends","error","esi","every","everyone","exist","expires_at","export","extends","eyebrow","false","far","fat_count","fats","fc","fc-characters","few","fill","fleet","fleetId","fleet_type","fleets","flew","flex","flex-1","flex-wrap","fly","font-medium","font-mono","font-semibold","footer","for","from","function","gap-1","gap-2","gap-2.5","gap-3","gap-4","gap-6","get","gets","ghost","got","grant","granted","grid","group","h-1.5","h-16","h-28","h-40","h-80","h-9","h-96","h-fit","h-full","hand","has","have","haven","height","here","hint","hour","hours","hover:bg-hover","hover:text-text","href","icon","icon-xs","icons","id","ids","if","import","in","in-game","info","inline","inline-flex","instead","interactive","interface","is","isLoading","isPending","isn","it","items","items-center","items-end","its","itself","joins","justify-between","key","label","last","last_at","lasted","least","length","lg","link","link_minutes","live","loading","log","long","lowers","m-card","m12","m13.41","m7","main","manage_fleets","manual","matches","max","max-w-sm","max-w-xl","max-w-xs","me","member","members","method","min","min-w-0","min-w-40","mine","minute","minutes","missing","ml-2","more","motd","motd_error","msg","mt-1","mt-2","must","mutationFn","mx-auto","my","my-fats","n","name","navigate","neutral","new","none","not","notes","now","null","number","o7","of","often","on","onAct","onAdded","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onFocus","onNew","onOpenChange","onSuccess","once","one","only","op","opacity-60","open","options","or","order","out","over","overview","own","p-card","page","paste","patch","path","per","period","pick","picked","picks","pills","pilot","pilots","pl-3","placeholder","placeholderData","portrait","post","primary","px-2","px-3","px-card","py-1","py-2","py-2.5","py-3","qc","queryFn","queryKey","react","react-router","read","readOnly","reads","recent","refetchInterval","refresh","register","registered","remove","removing","require","rest","retry","return","right","rotate-45","round","round_started_at","rounded-full","rounds","routes","rows","rule","rx","ry","s","see","seen","select","server","set","setChar","setColor","setConfirm","setCreating","setDays","setDq","setForm","setMotd","setName","setPicked","setQ","setType","share","ship","ships","show","since","site","size","size-2","size-2.5","size-3","size-3.5","size-4","size-5","sm","sm:grid-cols-3","sm:grid-cols-[1fr_200px]","so","space-y-1","space-y-3","space-y-4","space-y-6","src","start","started","started_at","starting","stats","stays","still","stopped","stops","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","subtle","success","system","t","tabular-nums","taken","takes","text","text-3xl","text-center","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-warning-fg","text-xs","than","that","the","their","them","they","this","ticked","time","timeAgo","title","to","toast","toggle","tone","towards","track","track_character","trackable","tracked","tracked_only","tracking","tracking_info","tracks","true","truncate","type","types","undefined","under","unknown","until","up","update","updated","url","use","useNavigate","useOverview","useParams","useQuery","useQueryClient","useState","used","user_id","value","variables","variant","via","viewBox","void","w-1/3","w-10","w-44","w-64","w-8","w-full","warning","weren","when","which","whitespace-nowrap","whitespace-pre-line","who","widgets","width","with","within","xl:grid-cols-[1fr_320px]","xl:grid-cols-[1fr_360px]","xs","year","yet","you","your"];
