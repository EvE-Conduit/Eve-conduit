import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, Dialog as c, EmptyState as l, Field as u, Input as d, PageHeader as f, SearchInput as p, Segmented as m, Skeleton as h, SwitchRow as g, THead as _, TabPanel as v, Table as y, Tabs as b, Td as x, Textarea as S, Th as C, Tr as w, api as T, definePlugin as E, timeAgo as D, toast as O } from "@conduit/sdk";
import { useMutation as k, useQuery as A, useQueryClient as j } from "@tanstack/react-query";
import { Link as M, useSearchParams as N } from "react-router";
import { useEffect as P, useState as F } from "react";
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
var B = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" })
}), V = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M8 2v4" }),
		/* @__PURE__ */ L("path", { d: "M16 2v4" }),
		/* @__PURE__ */ L("rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "4",
			rx: "2"
		}),
		/* @__PURE__ */ L("path", { d: "M3 10h18" })
	]
}), H = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "M20 6 9 17l-5-5" })
}), U = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M18 6 6 18" }), /* @__PURE__ */ L("path", { d: "m6 6 12 12" })]
}), W = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M5 12h14" }), /* @__PURE__ */ L("path", { d: "M12 5v14" })]
}), G = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ L("path", { d: "m7 10 5 5 5-5" }),
		/* @__PURE__ */ L("path", { d: "M12 15V3" })
	]
}), ee = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ L("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ L("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ L("path", { d: "M8 16H3v5" })
	]
}), te = (e) => /* @__PURE__ */ R(z, {
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
}), K = {
	pending: {
		label: "Waiting for approval",
		tone: "info"
	},
	approved: {
		label: "Approved",
		tone: "success"
	},
	rejected: {
		label: "Not approved",
		tone: "danger"
	},
	cancelled: {
		label: "Cancelled",
		tone: "neutral"
	}
}, q = "/api/p/inactivity", ne = ["inactivity", "me"];
function J(e) {
	let [t, n, r] = e.split("-").map(Number);
	return new Date(t, n - 1, r).toLocaleDateString(void 0, {
		day: "numeric",
		month: "short",
		year: "numeric"
	});
}
function Y(e) {
	return e.start === e.end ? J(e.start) : `${J(e.start)} – ${J(e.end)}`;
}
function X(e = 0) {
	let t = /* @__PURE__ */ new Date();
	return t.setDate(t.getDate() + e), `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}
function Z({ lv: e }) {
	return e.running ? /* @__PURE__ */ L(n, {
		tone: "success",
		children: "On leave now"
	}) : e.status === "approved" && e.over ? /* @__PURE__ */ L(n, {
		tone: "neutral",
		children: "Over"
	}) : /* @__PURE__ */ L(n, {
		tone: K[e.status].tone,
		children: K[e.status].label
	});
}
function re() {
	let t = j(), { data: n, isLoading: c } = A({
		queryKey: ne,
		queryFn: () => T.get(`${q}/me`)
	}), [p, m] = F(X()), [g, _] = F(X(14)), [v, y] = F(""), [b, x] = F(null), C = () => t.invalidateQueries({ queryKey: ["inactivity"] }), w = k({
		mutationFn: () => T.post(`${q}/leave`, {
			start: p,
			end: g,
			reason: v
		}),
		onSuccess: (e) => {
			O.success(e.status === "pending" ? "Sent. HR will look at it." : "Your leave is posted. Enjoy the break."), y(""), C();
		},
		onError: (e) => O.error(e.message)
	});
	if (c || !n) return /* @__PURE__ */ L(h, { className: "h-64" });
	let E = n.leaves.filter((e) => !e.over && (e.status === "pending" || e.status === "approved")), N = n.leaves.filter((e) => !E.includes(e));
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(f, {
			eyebrow: "Inactivity",
			title: "Leave of absence",
			icon: /* @__PURE__ */ L(V, {}),
			description: `Going away for a while? Post it here so nobody chases you. Members with no activity for ${n.days} days are otherwise flagged to HR.`,
			actions: n.can_see_list ? /* @__PURE__ */ L(M, {
				to: "/p/inactivity/members",
				children: /* @__PURE__ */ R(r, {
					variant: "ghost",
					children: [/* @__PURE__ */ L(te, {}), " Inactive members"]
				})
			}) : void 0
		}),
		/* @__PURE__ */ R("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_420px]",
			children: [/* @__PURE__ */ R("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(o, { title: "Your leave" }), E.length === 0 ? /* @__PURE__ */ L(l, {
					icon: /* @__PURE__ */ L(V, {}),
					title: "No leave posted",
					description: "Your next leave shows up here."
				}) : /* @__PURE__ */ L("ul", {
					className: "divide-y divide-border",
					children: E.map((e) => /* @__PURE__ */ R("li", {
						className: "flex flex-wrap items-start justify-between gap-3 px-card py-3",
						children: [/* @__PURE__ */ R("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ R("div", {
									className: "flex flex-wrap items-center gap-2 font-medium",
									children: [
										Y(e),
										" ",
										/* @__PURE__ */ L(Z, { lv: e })
									]
								}),
								e.reason && /* @__PURE__ */ L("p", {
									className: "mt-1 whitespace-pre-line text-sm text-muted",
									children: e.reason
								}),
								e.note && /* @__PURE__ */ R("p", {
									className: "mt-1 text-sm italic text-muted",
									children: [
										"“",
										e.note,
										"”",
										e.decided_by ? ` — ${e.decided_by}` : ""
									]
								})
							]
						}), /* @__PURE__ */ R(r, {
							size: "sm",
							variant: "ghost",
							className: "text-danger-fg",
							onClick: () => x(e),
							children: [/* @__PURE__ */ L(U, {}), " Cancel"]
						})]
					}, e.id))
				})] }), N.length > 0 && /* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(o, { title: "Earlier" }), /* @__PURE__ */ L("ul", {
					className: "divide-y divide-border",
					children: N.map((e) => /* @__PURE__ */ R("li", {
						className: "flex flex-wrap items-center justify-between gap-3 px-card py-3 text-sm",
						children: [/* @__PURE__ */ R("span", { children: [Y(e), e.note && /* @__PURE__ */ R("span", {
							className: "ml-2 italic text-muted",
							children: [
								"“",
								e.note,
								"”"
							]
						})] }), /* @__PURE__ */ L(Z, { lv: e })]
					}, e.id))
				})] })]
			}), /* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(o, {
				title: "Post a leave",
				description: n.needs_approval ? "HR approves it; you'll get a notification." : "It counts as soon as you post it."
			}), /* @__PURE__ */ R(a, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ R("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ L(u, {
							label: "From",
							children: /* @__PURE__ */ L(d, {
								type: "date",
								value: p,
								onChange: (e) => m(e.target.value)
							})
						}), /* @__PURE__ */ L(u, {
							label: "Until",
							children: /* @__PURE__ */ L(d, {
								type: "date",
								value: g,
								min: p,
								onChange: (e) => _(e.target.value)
							})
						})]
					}),
					/* @__PURE__ */ L(u, {
						label: "Reason (optional)",
						hint: "HR sees this.",
						children: /* @__PURE__ */ L(S, {
							rows: 3,
							value: v,
							onChange: (e) => y(e.target.value),
							placeholder: "Moving house, back in two weeks"
						})
					}),
					/* @__PURE__ */ R("p", {
						className: "text-xs text-subtle",
						children: [
							"Up to ",
							n.max_leave_days,
							" days at a time."
						]
					}),
					/* @__PURE__ */ R(r, {
						variant: "primary",
						loading: w.isPending,
						disabled: !p || !g,
						onClick: () => w.mutate(),
						children: [!w.isPending && /* @__PURE__ */ L(W, {}), " Post leave"]
					}),
					n.last_active && /* @__PURE__ */ R(e, {
						tone: "info",
						children: [
							"Your last activity on record: ",
							D(n.last_active),
							"."
						]
					})
				]
			})] })]
		}),
		/* @__PURE__ */ L(s, {
			open: !!b,
			onOpenChange: (e) => !e && x(null),
			title: "Cancel this leave?",
			description: b ? Y(b) : void 0,
			danger: !0,
			confirmLabel: "Cancel leave",
			cancelLabel: "Keep it",
			onConfirm: () => T.post(`${q}/leave/${b.id}/cancel`).then(C)
		})
	] });
}
//#endregion
//#region src/members.tsx
function ie() {
	let [e, t] = N(), n = e.get("tab") ?? "members", { data: r } = A({
		queryKey: ["inactivity", "summary"],
		queryFn: () => T.get(`${q}/summary`)
	}), { data: i } = A({
		queryKey: [
			"inactivity",
			"members",
			"inactive",
			""
		],
		queryFn: () => T.get(`${q}/members?filter=inactive`)
	}), a = i?.can_manage ?? !1;
	return /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(f, {
		eyebrow: "Inactivity",
		title: "Inactive members",
		icon: /* @__PURE__ */ L(B, {}),
		description: `Members with no activity for ${r?.days ?? 30} days, unless they're on leave. Checked once a day; HR is told who went quiet.`
	}), /* @__PURE__ */ R(b, {
		value: n,
		onValueChange: (e) => t(e === "members" ? {} : { tab: e }, { replace: !0 }),
		variant: "pills",
		className: "space-y-4",
		items: [
			{
				value: "members",
				label: "Members",
				count: r?.inactive
			},
			{
				value: "leave",
				label: "Leave of absence",
				count: r?.pending
			},
			...a ? [{
				value: "settings",
				label: "Settings"
			}] : []
		],
		children: [
			/* @__PURE__ */ L(v, {
				value: "members",
				children: /* @__PURE__ */ L(ae, {})
			}),
			/* @__PURE__ */ L(v, {
				value: "leave",
				children: /* @__PURE__ */ L(oe, { canManage: a })
			}),
			a && /* @__PURE__ */ L(v, {
				value: "settings",
				children: /* @__PURE__ */ L(se, {})
			})
		]
	})] });
}
function Q({ at: e }) {
	return e ? /* @__PURE__ */ L("span", {
		title: new Date(e).toLocaleString(),
		children: D(e)
	}) : /* @__PURE__ */ L("span", {
		className: "text-subtle",
		children: "—"
	});
}
function ae() {
	let e = j(), [o, s] = F("inactive"), [c, u] = F(""), [d, f] = F("");
	P(() => {
		let e = setTimeout(() => f(c.trim()), 250);
		return () => clearTimeout(e);
	}, [c]);
	let { data: g, isLoading: v } = A({
		queryKey: [
			"inactivity",
			"members",
			o,
			d
		],
		queryFn: () => T.get(`${q}/members?filter=${o}&q=${encodeURIComponent(d)}`)
	}), b = k({
		mutationFn: () => T.post(`${q}/scan`),
		onSuccess: () => {
			e.invalidateQueries({ queryKey: ["inactivity"] }), O.success("Everyone checked again");
		},
		onError: (e) => O.error(e.message)
	});
	return /* @__PURE__ */ R(i, { children: [/* @__PURE__ */ R("div", {
		className: "flex flex-wrap items-center gap-2 border-b border-border p-3",
		children: [
			/* @__PURE__ */ L(m, {
				value: o,
				onChange: s,
				options: [
					{
						value: "inactive",
						label: `Inactive${g ? ` (${g.counts.inactive})` : ""}`
					},
					{
						value: "leave",
						label: `On leave${g ? ` (${g.counts.leave})` : ""}`
					},
					{
						value: "all",
						label: `Everyone${g ? ` (${g.counts.all})` : ""}`
					}
				]
			}),
			/* @__PURE__ */ L(p, {
				value: c,
				onChange: (e) => u(e.target.value),
				placeholder: "Find a character",
				className: "w-56",
				"aria-label": "Search members"
			}),
			/* @__PURE__ */ R("div", {
				className: "ml-auto flex items-center gap-2",
				children: [
					g?.checked_at && /* @__PURE__ */ R("span", {
						className: "text-xs text-subtle",
						children: ["Checked ", D(g.checked_at)]
					}),
					g?.can_manage && /* @__PURE__ */ R(r, {
						size: "sm",
						variant: "ghost",
						loading: b.isPending,
						onClick: () => b.mutate(),
						children: [!b.isPending && /* @__PURE__ */ L(ee, {}), " Check now"]
					}),
					/* @__PURE__ */ L("a", {
						href: `${q}/members.csv?filter=${o}&q=${encodeURIComponent(d)}`,
						download: !0,
						children: /* @__PURE__ */ R(r, {
							size: "sm",
							variant: "outline",
							children: [/* @__PURE__ */ L(G, {}), " CSV"]
						})
					})
				]
			})
		]
	}), v || !g ? /* @__PURE__ */ L(a, { children: /* @__PURE__ */ L(h, { className: "h-40" }) }) : g.items.length === 0 ? /* @__PURE__ */ L(l, {
		icon: L(o === "inactive" ? H : B, {}),
		title: d ? "Nobody matches" : o === "inactive" ? "Nobody has gone quiet" : o === "leave" ? "Nobody is on leave" : "Nobody checked yet",
		description: g.checked_at ? void 0 : "The first check runs tonight, or press Check now."
	}) : /* @__PURE__ */ R(y, { children: [/* @__PURE__ */ L(_, { children: /* @__PURE__ */ R("tr", { children: [
		/* @__PURE__ */ L(C, { children: "Member" }),
		/* @__PURE__ */ L(C, { children: "Status" }),
		/* @__PURE__ */ L(C, { children: "Last active" }),
		/* @__PURE__ */ L(C, { children: "Signed in to the site" }),
		/* @__PURE__ */ L(C, { children: "Played" }),
		/* @__PURE__ */ L(C, { children: "Last fleet" })
	] }) }), /* @__PURE__ */ L("tbody", { children: g.items.map((e) => /* @__PURE__ */ R(w, { children: [
		/* @__PURE__ */ L(x, { children: /* @__PURE__ */ R("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ L(t, {
				src: e.portrait,
				name: e.name,
				size: "sm"
			}), /* @__PURE__ */ R("span", { children: [/* @__PURE__ */ L("span", {
				className: "block font-medium",
				children: e.name
			}), /* @__PURE__ */ L("span", {
				className: "block text-xs text-muted",
				children: e.corporation ?? "No corporation"
			})] })]
		}) }),
		/* @__PURE__ */ L(x, { children: e.on_leave_until ? /* @__PURE__ */ R(n, {
			tone: "info",
			children: ["On leave until ", (/* @__PURE__ */ new Date(e.on_leave_until + "T00:00")).toLocaleDateString()]
		}) : e.inactive ? /* @__PURE__ */ R(n, {
			tone: "warning",
			children: ["Inactive", e.days_inactive == null ? "" : ` ${e.days_inactive} days`]
		}) : /* @__PURE__ */ L(n, {
			tone: "success",
			children: "Active"
		}) }),
		/* @__PURE__ */ L(x, {
			className: "text-muted",
			children: /* @__PURE__ */ L(Q, { at: e.last_active })
		}),
		/* @__PURE__ */ L(x, {
			className: "text-muted",
			children: /* @__PURE__ */ L(Q, { at: e.last_site })
		}),
		/* @__PURE__ */ L(x, {
			className: "text-muted",
			children: /* @__PURE__ */ L(Q, { at: e.last_game })
		}),
		/* @__PURE__ */ L(x, {
			className: "text-muted",
			children: /* @__PURE__ */ L(Q, { at: e.last_fleet })
		})
	] }, e.id)) })] })] });
}
function oe({ canManage: e }) {
	let n = j(), [o, s] = F("pending"), [d, f] = F(null), [p, g] = F(""), { data: _, isLoading: v } = A({
		queryKey: [
			"inactivity",
			"leaves",
			o
		],
		queryFn: () => T.get(`${q}/leaves?status=${o}`)
	}), y = k({
		mutationFn: () => T.post(`${q}/leaves/${d.leave.id}/decide`, {
			approve: d.approve,
			note: p
		}),
		onSuccess: (e) => {
			O.success(e.status === "approved" ? "Approved" : "Not approved"), f(null), g(""), n.invalidateQueries({ queryKey: ["inactivity"] });
		},
		onError: (e) => O.error(e.message)
	});
	return /* @__PURE__ */ R(i, { children: [
		/* @__PURE__ */ L("div", {
			className: "border-b border-border p-3",
			children: /* @__PURE__ */ L(m, {
				value: o,
				onChange: s,
				options: [
					{
						value: "pending",
						label: "Waiting"
					},
					{
						value: "current",
						label: "Away now"
					},
					{
						value: "upcoming",
						label: "Coming up"
					},
					{
						value: "past",
						label: "Past"
					}
				]
			})
		}),
		v || !_ ? /* @__PURE__ */ L(a, { children: /* @__PURE__ */ L(h, { className: "h-32" }) }) : _.items.length === 0 ? /* @__PURE__ */ L(l, {
			icon: /* @__PURE__ */ L(V, {}),
			title: o === "pending" ? "Nothing waiting" : "Nothing here"
		}) : /* @__PURE__ */ L("ul", {
			className: "divide-y divide-border",
			children: _.items.map((n) => /* @__PURE__ */ R("li", {
				className: "flex flex-wrap items-start gap-3 px-card py-3",
				children: [
					/* @__PURE__ */ L(t, {
						src: n.user.portrait,
						name: n.user.name,
						size: "sm"
					}),
					/* @__PURE__ */ R("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ R("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ L("span", {
										className: "font-medium",
										children: n.user.name
									}),
									/* @__PURE__ */ L("span", {
										className: "text-sm text-muted",
										children: Y(n)
									}),
									/* @__PURE__ */ L(Z, { lv: n })
								]
							}),
							n.reason && /* @__PURE__ */ L("p", {
								className: "mt-1 whitespace-pre-line text-sm text-muted",
								children: n.reason
							}),
							n.note && /* @__PURE__ */ R("p", {
								className: "mt-1 text-sm italic text-muted",
								children: [
									"“",
									n.note,
									"”",
									n.decided_by ? ` — ${n.decided_by}` : ""
								]
							}),
							/* @__PURE__ */ R("div", {
								className: "mt-1 text-xs text-subtle",
								children: ["Posted ", D(n.created_at)]
							})
						]
					}),
					e && n.status === "pending" && /* @__PURE__ */ R("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ R(r, {
							size: "sm",
							variant: "primary",
							onClick: () => f({
								leave: n,
								approve: !0
							}),
							children: [/* @__PURE__ */ L(H, {}), " Approve"]
						}), /* @__PURE__ */ R(r, {
							size: "sm",
							variant: "ghost",
							onClick: () => f({
								leave: n,
								approve: !1
							}),
							children: [/* @__PURE__ */ L(U, {}), " Reject"]
						})]
					})
				]
			}, n.id))
		}),
		/* @__PURE__ */ L(c, {
			open: !!d,
			onOpenChange: (e) => !e && f(null),
			title: d?.approve ? "Approve this leave?" : "Reject this leave?",
			description: d ? `${d.leave.user.name}, ${Y(d.leave)}` : void 0,
			footer: /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(r, {
				variant: "ghost",
				onClick: () => f(null),
				children: "Back"
			}), /* @__PURE__ */ L(r, {
				variant: d?.approve ? "primary" : "danger",
				loading: y.isPending,
				onClick: () => y.mutate(),
				children: d?.approve ? "Approve" : "Reject"
			})] }),
			children: /* @__PURE__ */ L(u, {
				label: "Note for them (optional)",
				children: /* @__PURE__ */ L(S, {
					rows: 3,
					value: p,
					onChange: (e) => g(e.target.value)
				})
			})
		})
	] });
}
function se() {
	let e = j(), { data: t, isLoading: n } = A({
		queryKey: ["inactivity", "settings"],
		queryFn: () => T.get(`${q}/settings`)
	}), [s, c] = F(null);
	P(() => {
		t && c(t);
	}, [t]);
	let l = k({
		mutationFn: (e) => T.put(`${q}/settings`, e),
		onSuccess: (t) => {
			e.setQueryData(["inactivity", "settings"], t), e.invalidateQueries({ queryKey: ["inactivity"] }), O.success("Saved, and everyone checked again");
		},
		onError: (e) => O.error(e.message)
	});
	if (n || !s) return /* @__PURE__ */ L(h, { className: "h-64" });
	let f = (e) => c({
		...s,
		...e
	}), p = (e, t) => f({ [e]: s[e].includes(t) ? s[e].filter((e) => e !== t) : [...s[e], t] });
	return /* @__PURE__ */ R("div", {
		className: "grid max-w-5xl gap-6 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(o, {
				title: "What counts as active",
				description: "A member is active when any switched-on kind of activity is recent enough."
			}), /* @__PURE__ */ R(a, {
				className: "space-y-2",
				children: [/* @__PURE__ */ L(u, {
					label: "Inactive after (days)",
					children: /* @__PURE__ */ L(d, {
						type: "number",
						min: 1,
						max: 3650,
						value: s.days,
						onChange: (e) => f({ days: Number(e.target.value) }),
						className: "w-32"
					})
				}), /* @__PURE__ */ R("div", {
					className: "divide-y divide-border",
					children: [
						/* @__PURE__ */ L(g, {
							label: "Signed in to the site",
							description: "When they last signed in to EvE Conduit.",
							checked: s.use_site,
							onCheckedChange: (e) => f({ use_site: e })
						}),
						/* @__PURE__ */ L(g, {
							label: "Played EVE",
							description: "Their characters' last login or logout, from character sheets and corporation member tracking.",
							checked: s.use_game,
							onCheckedChange: (e) => f({ use_game: e })
						}),
						/* @__PURE__ */ L(g, {
							label: "Flew in a fleet",
							description: s.fleets_available ? "Their last FAT from Fleets & FATs." : "Needs the Fleets & FATs plugin installed and switched on.",
							checked: s.use_fleets,
							onCheckedChange: (e) => f({ use_fleets: e })
						})
					]
				})]
			})] }),
			/* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(o, { title: "Leave of absence" }), /* @__PURE__ */ R(a, {
				className: "space-y-2",
				children: [/* @__PURE__ */ R("div", {
					className: "divide-y divide-border",
					children: [/* @__PURE__ */ L(g, {
						label: "Leave needs approval",
						description: "Off: leave counts as soon as a member posts it.",
						checked: s.leave_needs_approval,
						onCheckedChange: (e) => f({ leave_needs_approval: e })
					}), /* @__PURE__ */ L(g, {
						label: "Tell members when they're flagged",
						description: "A “we haven't seen you” notification pointing to this page.",
						checked: s.notify_member,
						onCheckedChange: (e) => f({ notify_member: e })
					})]
				}), /* @__PURE__ */ L(u, {
					label: "Longest leave (days)",
					children: /* @__PURE__ */ L(d, {
						type: "number",
						min: 1,
						max: 3650,
						value: s.max_leave_days,
						onChange: (e) => f({ max_leave_days: Number(e.target.value) }),
						className: "w-32"
					})
				})]
			})] }),
			/* @__PURE__ */ R(i, {
				className: "lg:col-span-2",
				children: [/* @__PURE__ */ L(o, {
					title: "Who is checked",
					description: "Members in any ticked state and any ticked group. Nothing ticked means everyone. Guests are never checked."
				}), /* @__PURE__ */ R(a, {
					className: "grid gap-6 sm:grid-cols-2",
					children: [/* @__PURE__ */ L($, {
						label: "States",
						options: s.state_options,
						chosen: s.states,
						onToggle: (e) => p("states", e)
					}), /* @__PURE__ */ L($, {
						label: "Groups",
						options: s.group_options,
						chosen: s.groups,
						onToggle: (e) => p("groups", e)
					})]
				})]
			}),
			/* @__PURE__ */ L("div", {
				className: "lg:col-span-2",
				children: /* @__PURE__ */ L(r, {
					variant: "primary",
					loading: l.isPending,
					onClick: () => l.mutate(s),
					children: "Save settings"
				})
			})
		]
	});
}
function $({ label: e, options: t, chosen: n, onToggle: r }) {
	return /* @__PURE__ */ R("div", { children: [/* @__PURE__ */ L("div", {
		className: "mb-2 text-[13px] font-medium",
		children: e
	}), t.length === 0 ? /* @__PURE__ */ L("p", {
		className: "text-sm text-muted",
		children: "None yet."
	}) : /* @__PURE__ */ L("div", {
		className: "flex flex-wrap gap-1.5",
		children: t.map((e) => /* @__PURE__ */ L("button", {
			type: "button",
			onClick: () => r(e.id),
			className: `border px-2 py-1 text-sm ${n.includes(e.id) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:text-text"}`,
			"aria-pressed": n.includes(e.id),
			children: e.name
		}, e.id))
	})] });
}
//#endregion
//#region src/index.tsx
function ce() {
	let { data: e, isLoading: t } = A({
		queryKey: ["inactivity", "summary"],
		queryFn: () => T.get(`${q}/summary`),
		refetchInterval: 6e5
	});
	return t || !e ? /* @__PURE__ */ L(h, { className: "h-16" }) : /* @__PURE__ */ L(M, {
		to: "/p/inactivity/members",
		className: "block",
		children: /* @__PURE__ */ R("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ R("div", { children: [
				/* @__PURE__ */ L("div", {
					className: "text-xs text-muted",
					children: "Inactive members"
				}),
				/* @__PURE__ */ L("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: e.inactive
				}),
				/* @__PURE__ */ R("div", {
					className: "text-xs text-subtle",
					children: [
						e.on_leave,
						" on leave · no activity for ",
						e.days,
						" days"
					]
				})
			] }), e.pending > 0 ? /* @__PURE__ */ R(n, {
				tone: "info",
				children: [e.pending, " leave to approve"]
			}) : /* @__PURE__ */ L(n, {
				tone: "success",
				children: "No leave waiting"
			})]
		})
	});
}
var le = E({
	routes: [{
		path: "",
		Component: re
	}, {
		path: "members",
		Component: ie
	}],
	widgets: [{
		id: "summary",
		title: "Inactivity",
		Component: ce,
		size: "sm",
		order: 40,
		permission: "inactivity.view_inactivity"
	}]
});
//#endregion
export { le as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","absence","actions","active","activity","after","again","all","and","any","approval","approve","approved","approves","are","aria-label","aria-pressed","as","at","away","back","bg-accent-soft","block","boolean","border","border-accent","border-b","border-border","but","button","canManage","can_manage","can_see_list","cancel","cancelLabel","cancelled","character","characters","chases","check","checked","checked_at","children","chosen","className","confirmLabel","const","corporation","count","counts","created_at","current","currentColor","cx","cy","d","danger","data","date","day","days","days_inactive","decide","decided_at","decided_by","default","description","disabled","divide-border","divide-y","dq","end","everyone","export","extends","eyebrow","false","few","fill","filter","first","flagged","fleet","fleets_available","flex","flex-1","flex-wrap","font-medium","font-mono","font-semibold","footer","for","from","function","gap-1.5","gap-2","gap-3","gap-6","get","ghost","gone","grid","grid-cols-2","group_options","groups","h-16","h-32","h-40","h-64","has","haven","height","here","hint","hover:text-text","href","icon","icons","id","if","import","in","inactive","inactive_since","inactivity","info","inline","installed","interface","is","isLoading","isPending","iso","it","italic","items","items-center","items-end","items-start","justify-between","key","kind","label","last","last_active","last_fleet","last_game","last_site","leave","leave_needs_approval","leaves","length","lg:col-span-2","lg:grid-cols-2","ll","loading","local","login","look","lv","m6","m7","matches","max","max-w-5xl","max_leave_days","mb-2","me","means","member","members","min","min-w-0","ml-2","ml-auto","month","mt-1","mutationFn","name","needs","needs_approval","neutral","never","new","next","no","nobody","none","not","note","notification","notify_member","now","null","number","numeric","of","on","onChange","onCheckedChange","onClick","onConfirm","onError","onOpenChange","onSuccess","onToggle","onValueChange","on_leave","on_leave_until","once","open","options","or","order","otherwise","outline","over","own","p-3","past","patch","path","pending","permission","pills","placeholder","plugin","pointing","portrait","post","posted","posts","press","primary","put","px-2","px-card","py-1","py-3","qc","queryFn","queryKey","quiet","re","react","react-router","reason","recent","record","refetchInterval","refresh","rejected","replace","rest","return","round","routes","rows","running","runs","rx","s","save","scan","see","seen","sees","set","setCancelling","setDeciding","setDq","setEnd","setFilter","setForm","setNote","setParams","setQ","setReason","setStart","setStatus","settings","sheets","shifts","short","shows","side","signed","site","size","size-4","sm","sm:grid-cols-2","so","soon","space-y-2","space-y-4","space-y-6","span","src","start","state","state_options","states","status","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","summary","switched","switched-on","t","tab","tabular-nums","text-3xl","text-[13px]","text-accent-ink","text-danger-fg","text-muted","text-sm","text-subtle","text-xs","the","them","they","this","ticked","time","title","to","toggle","told","tone","true","two","type","unless","until","up","upcoming","useQuery","useQueryClient","useSearchParams","useState","use_fleets","use_game","use_site","used","v","value","variant","viewBox","view_inactivity","void","w-32","w-56","waiting","warning","weeks","went","what","when","whitespace-pre-line","who","widgets","width","will","with","x","xl:grid-cols-[1fr_420px]","year","yet","you"];
