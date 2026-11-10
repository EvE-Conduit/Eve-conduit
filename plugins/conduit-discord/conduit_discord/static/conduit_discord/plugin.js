import { Alert as e, ApiError as t, Avatar as n, Badge as r, Button as i, Card as a, CardBody as o, CardFooter as s, CardHeader as c, ConfirmDialog as l, Dialog as u, DropdownContent as d, DropdownItem as f, DropdownMenu as p, DropdownSeparator as m, DropdownTrigger as h, EmptyState as g, Field as _, Input as v, PageHeader as y, SearchInput as b, Select as x, Skeleton as S, Spinner as C, StatCard as w, SwitchRow as T, THead as ee, TabPanel as E, Table as D, TableToolbar as te, Tabs as ne, Td as O, Th as k, Tr as re, api as A, cn as j, definePlugin as ie, timeAgo as M, toast as N, useHasPerm as ae } from "@conduit/sdk";
import { Link as P, useNavigate as oe, useParams as se, useSearchParams as ce } from "react-router";
import { useMutation as F, useQuery as I, useQueryClient as L } from "@tanstack/react-query";
import { useEffect as le, useRef as ue, useState as R } from "react";
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
var U = ({ className: e = "size-4" }) => /* @__PURE__ */ B("svg", {
	viewBox: "0 0 24 24",
	fill: "currentColor",
	className: e,
	"aria-hidden": !0,
	children: /* @__PURE__ */ B("path", { d: "M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14 14 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13 13 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03M8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418m7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418" })
}), de = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M20 7h-9" }),
		/* @__PURE__ */ B("path", { d: "M14 17H5" }),
		/* @__PURE__ */ B("circle", {
			cx: "17",
			cy: "17",
			r: "3"
		}),
		/* @__PURE__ */ B("circle", {
			cx: "7",
			cy: "7",
			r: "3"
		})
	]
}), W = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ B("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ B("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ B("path", { d: "M8 16H3v5" })
	]
}), G = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" }),
		/* @__PURE__ */ B("path", { d: "m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" }),
		/* @__PURE__ */ B("path", { d: "M8 2v3" }),
		/* @__PURE__ */ B("path", { d: "M2 8h3" }),
		/* @__PURE__ */ B("path", { d: "M16 22v-3" }),
		/* @__PURE__ */ B("path", { d: "M22 16h-3" })
	]
}), K = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ B("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ B("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), q = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ B("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), J = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M5 12h14" }), /* @__PURE__ */ B("path", { d: "M12 5v14" })]
}), fe = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M3 6h18" }),
		/* @__PURE__ */ B("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ B("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), pe = (e) => /* @__PURE__ */ B(H, {
	...e,
	children: /* @__PURE__ */ B("path", { d: "M20 6 9 17l-5-5" })
}), me = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ B("path", { d: "M19 12H5" })]
}), Y = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ B("polyline", { points: "12 6 12 12 16 14" })]
}), he = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ B("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })]
}), X = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ B("path", { d: "m4.9 4.9 14.2 14.2" })]
}), ge = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
		/* @__PURE__ */ B("circle", {
			cx: "9",
			cy: "7",
			r: "4"
		}),
		/* @__PURE__ */ B("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
		/* @__PURE__ */ B("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
	]
}), Z = "/api/p/discord", _e = "/api/public/p/discord", Q = ["discord", "guests"], ve = [
	1,
	2,
	4,
	8,
	12,
	24,
	48,
	72,
	168,
	336,
	720
];
function ye(e) {
	let t = new Date(e).getTime() - Date.now();
	if (t <= 0) return "ended";
	let n = Math.round(t / 6e4);
	if (n < 60) return `${n} min left`;
	let r = Math.floor(n / 60);
	return r < 48 ? `${r} h ${n % 60 ? `${n % 60} min ` : ""}left` : `${Math.round(r / 24)} days left`;
}
var be = (e) => e.kind === "voice" || e.kind === "stage" ? `🔊 ${e.name}` : `#${e.name}`;
function xe(e, t) {
	navigator.clipboard.writeText(e).then(() => N.success(t), () => N.error("Couldn't copy; select the text instead"));
}
var Se = {
	active: {
		label: "active",
		tone: "success"
	},
	used_up: {
		label: "all used",
		tone: "neutral"
	},
	expired: {
		label: "ended",
		tone: "neutral"
	},
	revoked: {
		label: "withdrawn",
		tone: "danger"
	},
	creator_lost: {
		label: "maker lost access",
		tone: "warning"
	}
}, Ce = (e) => e.status === "active" || e.status === "used_up";
function we() {
	let t = L(), { data: n, isLoading: r } = I({
		queryKey: Q,
		queryFn: () => A.get(`${Z}/guests`)
	}), [o, s] = R(!1), [c, u] = R(null), [d, f] = R(null), [p, m] = R(!1), h = F({
		mutationFn: (e) => A.delete(`${Z}/guests/${e}`),
		onSuccess: (e) => {
			e.waiting ? N.warning(`Link withdrawn. ${e.waiting} guest${e.waiting === 1 ? "" : "s"} couldn't be removed yet; that is tried again every couple of minutes.`) : N.success("Link withdrawn and its guests removed from the server"), t.invalidateQueries({ queryKey: Q });
		},
		onError: (e) => N.error(e.message)
	}), _ = n?.links ?? [], b = _.filter(Ce), x = _.filter((e) => !Ce(e)), C = (e) => e.guests.filter((e) => !e.ended_at).length;
	return /* @__PURE__ */ V(z, { children: [
		/* @__PURE__ */ B(y, {
			eyebrow: /* @__PURE__ */ V(P, {
				to: "/p/discord",
				className: "inline-flex items-center gap-1 hover:text-text",
				children: [/* @__PURE__ */ B(me, { className: "size-3" }), " Discord"]
			}),
			title: "Temporary access",
			icon: /* @__PURE__ */ B(Y, {}),
			description: "Hand a link to people without an account here: diplomats, guests on a fleet, a recruit. They sign in with Discord, join the server with the guest role, and are removed again when the link runs out.",
			actions: n?.enabled ? /* @__PURE__ */ V(i, {
				variant: "primary",
				onClick: () => s(!0),
				children: [/* @__PURE__ */ B(J, {}), " New link"]
			}) : void 0
		}),
		r || !n ? /* @__PURE__ */ B(S, { className: "h-64" }) : n.enabled ? /* @__PURE__ */ V("div", {
			className: "space-y-6",
			children: [
				c && /* @__PURE__ */ B(e, {
					tone: "success",
					title: "Link made. Send it to your guests.",
					action: /* @__PURE__ */ B(i, {
						size: "sm",
						variant: "ghost",
						onClick: () => u(null),
						children: "Done"
					}),
					children: /* @__PURE__ */ V("div", {
						className: "mt-2 flex items-stretch",
						children: [/* @__PURE__ */ B(v, {
							readOnly: !0,
							value: c.url,
							className: "font-mono text-xs",
							onFocus: (e) => e.target.select()
						}), /* @__PURE__ */ B(i, {
							variant: "secondary",
							size: "icon",
							"aria-label": "Copy link",
							onClick: () => xe(c.url, "Link copied"),
							children: /* @__PURE__ */ B(q, {})
						})]
					})
				}),
				b.length === 0 ? /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(g, {
					icon: /* @__PURE__ */ B(he, {}),
					title: "No active links",
					description: `Make one and send it to whoever needs to be on ${n.server || "the server"} for a while.`,
					action: /* @__PURE__ */ V(i, {
						variant: "primary",
						onClick: () => s(!0),
						children: [/* @__PURE__ */ B(J, {}), " New link"]
					})
				}) }) : /* @__PURE__ */ B("div", {
					className: "grid gap-4 lg:grid-cols-2",
					children: b.map((e) => /* @__PURE__ */ B(Te, {
						link: e,
						showOwner: n.can_manage,
						onRevoke: () => f(e)
					}, e.id))
				}),
				x.length > 0 && /* @__PURE__ */ V("div", { children: [/* @__PURE__ */ V("button", {
					type: "button",
					className: "text-sm text-muted hover:text-text",
					onClick: () => m((e) => !e),
					children: [
						p ? "Hide" : "Show",
						" ",
						x.length,
						" past link",
						x.length === 1 ? "" : "s"
					]
				}), p && /* @__PURE__ */ B("div", {
					className: "mt-3 grid gap-4 lg:grid-cols-2",
					children: x.map((e) => /* @__PURE__ */ B(Te, {
						link: e,
						showOwner: n.can_manage
					}, e.id))
				})] })
			]
		}) : /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(g, {
			icon: /* @__PURE__ */ B(Y, {}),
			title: "Temporary access is switched off",
			description: "A Discord manager can switch it on and choose the guest role under Server setup."
		}) }),
		n && /* @__PURE__ */ B(Oe, {
			open: o,
			onOpenChange: s,
			overview: n,
			onMade: (e) => {
				u(e), s(!1), t.invalidateQueries({ queryKey: Q });
			}
		}),
		/* @__PURE__ */ B(l, {
			open: !!d,
			onOpenChange: (e) => !e && f(null),
			title: `Withdraw "${d?.label}"?`,
			description: d && C(d) ? `The link stops working and the ${C(d)} guest${C(d) === 1 ? "" : "s"} it let in ${C(d) === 1 ? "is" : "are"} removed from the server now.` : "The link stops working. Nobody is on the server through it.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(X, {}), " Withdraw"] }),
			onConfirm: () => d && h.mutateAsync(d.id)
		})
	] });
}
function Te({ link: e, showOwner: t, onRevoke: n }) {
	let s = L(), [l, u] = R(!1), d = F({
		mutationFn: (e) => A.delete(`${Z}/guests/users/${e}`),
		onSuccess: () => {
			N.success("Guest removed from the server"), s.invalidateQueries({ queryKey: Q });
		},
		onError: (e) => N.error(e.message)
	}), f = Ce(e), p = Se[e.status];
	return /* @__PURE__ */ V(a, {
		className: j(!f && "opacity-75"),
		children: [/* @__PURE__ */ B(c, {
			title: /* @__PURE__ */ V("span", {
				className: "flex items-center gap-2",
				children: [
					e.label,
					" ",
					/* @__PURE__ */ B(r, {
						tone: p.tone,
						children: p.label
					})
				]
			}),
			description: /* @__PURE__ */ V(z, { children: [
				f ? ye(e.expires_at) : `ended ${M(e.ended_at)}`,
				" · ",
				e.uses,
				e.max_uses ? ` of ${e.max_uses}` : "",
				" used",
				t && e.created_by ? ` · by ${e.created_by.name}` : ""
			] }),
			actions: /* @__PURE__ */ V("div", {
				className: "flex gap-1",
				children: [e.status === "active" && /* @__PURE__ */ V(i, {
					variant: "ghost",
					size: "sm",
					onClick: () => xe(e.url, "Link copied"),
					children: [/* @__PURE__ */ B(q, {}), " Copy link"]
				}), f && n && /* @__PURE__ */ V(i, {
					variant: "ghost",
					size: "sm",
					onClick: n,
					children: [/* @__PURE__ */ B(X, {}), " Withdraw"]
				})]
			})
		}), /* @__PURE__ */ V(o, {
			className: "space-y-3",
			children: [/* @__PURE__ */ V("div", {
				className: "flex flex-wrap items-center gap-1.5 text-xs text-muted",
				children: [
					"Guests get ",
					/* @__PURE__ */ V(r, {
						tone: "accent",
						children: ["@", e.role]
					}),
					e.channels.length > 0 && /* @__PURE__ */ V(z, { children: ["and see only ", e.channels.map((e) => /* @__PURE__ */ B(r, {
						tone: "neutral",
						children: be(e)
					}, e.id))] })
				]
			}), e.guests.length === 0 ? /* @__PURE__ */ B("p", {
				className: "text-sm text-subtle",
				children: "Nobody has used it yet."
			}) : /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ V("button", {
				type: "button",
				className: "inline-flex items-center gap-1.5 text-sm text-accent-ink hover:underline",
				onClick: () => u((e) => !e),
				children: [
					/* @__PURE__ */ B(ge, { className: "size-3.5" }),
					" ",
					e.guests.length,
					" guest",
					e.guests.length === 1 ? "" : "s"
				]
			}), l && /* @__PURE__ */ B("ul", {
				className: "divide-y divide-border border border-border text-sm",
				children: e.guests.map((e) => /* @__PURE__ */ B(De, {
					guest: e,
					onRemove: e.ended_at ? void 0 : () => d.mutate(e.id)
				}, e.id))
			})] })]
		})]
	});
}
var Ee = {
	expired: "left when the link ran out",
	revoked: "removed with the link",
	removed: "removed",
	creator_lost: "removed: the link's maker lost access",
	member: "a member here now"
};
function De({ guest: e, onRemove: t }) {
	return /* @__PURE__ */ V("li", {
		className: "flex items-center gap-3 px-3 py-2",
		children: [
			/* @__PURE__ */ B(n, {
				src: e.avatar,
				name: e.username,
				size: "sm"
			}),
			/* @__PURE__ */ V("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ B("div", {
					className: "truncate font-medium",
					children: e.username
				}), /* @__PURE__ */ V("div", {
					className: "truncate text-xs text-subtle",
					children: [
						"joined ",
						M(e.joined_at),
						e.ended_at ? ` · ${Ee[e.ended_reason] ?? "left"}` : "",
						e.error ? ` · couldn't be removed yet: ${e.error}` : ""
					]
				})]
			}),
			e.ended_at ? /* @__PURE__ */ B(r, {
				tone: e.ended_reason === "member" ? "success" : "neutral",
				children: e.ended_reason === "member" ? "member" : "gone"
			}) : t ? /* @__PURE__ */ V(i, {
				variant: "ghost",
				size: "xs",
				onClick: t,
				children: [/* @__PURE__ */ B(X, {}), " Remove"]
			}) : null
		]
	});
}
function Oe({ open: e, onOpenChange: t, overview: n, onMade: r }) {
	let [a, o] = R(""), [s, c] = R(String(Math.min(4, n.max_hours))), [l, d] = R(""), [f, p] = R(null), m = f ?? n.channels.map((e) => e.id), h = (e) => p(m.includes(e) ? m.filter((t) => t !== e) : [...m, e]), g = F({
		mutationFn: () => A.post(`${Z}/guests`, {
			label: a.trim(),
			hours: Number(s),
			max_uses: Number(l) || 0,
			channels: n.channels.length ? m : void 0
		}),
		onSuccess: (e) => {
			r(e), o(""), d(""), p(null);
		},
		onError: (e) => N.error(e.message)
	}), y = n.channels.length > 0 && m.length === 0, b = ve.filter((e) => e <= n.max_hours);
	return b.includes(n.max_hours) || b.push(n.max_hours), /* @__PURE__ */ B(u, {
		open: e,
		onOpenChange: t,
		title: "New temporary link",
		description: `Whoever opens it can join ${n.server || "the Discord server"} with the @${n.role} role for as long as the link lasts.`,
		footer: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(i, {
			variant: "ghost",
			onClick: () => t(!1),
			children: "Cancel"
		}), /* @__PURE__ */ V(i, {
			variant: "primary",
			loading: g.isPending,
			disabled: !a.trim() || y,
			onClick: () => g.mutate(),
			children: [/* @__PURE__ */ B(he, {}), " Make link"]
		})] }),
		children: /* @__PURE__ */ V("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ B(_, {
					label: "What it's for",
					hint: "Shown to the guests, and to you in the list.",
					children: /* @__PURE__ */ B(v, {
						autoFocus: !0,
						value: a,
						onChange: (e) => o(e.target.value),
						maxLength: 100,
						placeholder: "Diplo meeting Saturday"
					})
				}),
				/* @__PURE__ */ V("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ B(_, {
						label: "Lasts",
						hint: `At most ${n.max_hours} hours. Guests are removed when it ends.`,
						children: /* @__PURE__ */ B(x, {
							value: s,
							onChange: (e) => c(e.target.value),
							children: b.map((e) => /* @__PURE__ */ B("option", {
								value: e,
								children: e < 24 ? `${e} hour${e === 1 ? "" : "s"}` : `${e / 24} day${e === 24 ? "" : "s"}`
							}, e))
						})
					}), /* @__PURE__ */ B(_, {
						label: "Uses",
						hint: "How many people may use it; empty for no limit.",
						children: /* @__PURE__ */ B(v, {
							type: "number",
							min: 0,
							value: l,
							onChange: (e) => d(e.target.value),
							placeholder: "no limit"
						})
					})]
				}),
				n.channels.length > 0 && /* @__PURE__ */ B(_, {
					label: "Channels these guests see",
					hint: y ? "Choose at least one." : "They see these and nothing else on the server.",
					children: /* @__PURE__ */ B("div", {
						className: "flex flex-wrap gap-1.5",
						children: n.channels.map((e) => /* @__PURE__ */ B("button", {
							type: "button",
							"aria-pressed": m.includes(e.id),
							onClick: () => h(e.id),
							className: j("border px-2.5 py-1 text-xs", m.includes(e.id) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:border-border-strong"),
							children: be(e)
						}, e.id))
					})
				})
			]
		})
	});
}
//#endregion
//#region src/admin.tsx
var $ = ["discord", "admin"];
function ke() {
	let { data: e, isLoading: t } = I({
		queryKey: $,
		queryFn: () => A.get(`${Z}/admin`)
	}), [n, r] = R(null), i = n ?? (e?.settings.configured ? "roles" : "setup");
	return /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(y, {
		eyebrow: /* @__PURE__ */ V(P, {
			to: "/p/discord",
			className: "inline-flex items-center gap-1 hover:text-text",
			children: [/* @__PURE__ */ B(me, { className: "size-3" }), " Discord"]
		}),
		title: "Server setup",
		icon: /* @__PURE__ */ B(U, {}),
		description: "Connect your Discord server, choose which groups and states get which roles, and keep an eye on linked members.",
		actions: e?.settings.configured ? /* @__PURE__ */ B(Ae, {}) : void 0
	}), t || !e ? /* @__PURE__ */ B(S, { className: "h-96" }) : /* @__PURE__ */ V("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ V("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ B(w, {
					label: "Server",
					value: e.settings.guild_name || (e.settings.configured ? "Not checked yet" : "Not connected"),
					tone: e.settings.configured ? "success" : "warning"
				}),
				/* @__PURE__ */ B(w, {
					label: "Linked members",
					value: e.stats.linked,
					hint: e.settings.last_full_sync ? `full sync ${M(e.settings.last_full_sync)}` : "every 6 hours, and on every change"
				}),
				/* @__PURE__ */ B(w, {
					label: "Sync problems",
					value: e.stats.errors,
					tone: e.stats.errors ? "warning" : void 0,
					hint: "see Members"
				})
			]
		}), /* @__PURE__ */ V(ne, {
			variant: "pills",
			value: i,
			onValueChange: r,
			className: "space-y-4",
			items: [
				{
					value: "setup",
					label: "Setup"
				},
				{
					value: "roles",
					label: "Roles",
					count: e.mappings.length,
					disabled: !e.settings.configured
				},
				{
					value: "members",
					label: "Members",
					count: e.stats.linked,
					disabled: !e.settings.configured
				},
				{
					value: "guests",
					label: "Temporary access",
					disabled: !e.settings.configured
				}
			],
			children: [
				/* @__PURE__ */ B(E, {
					value: "setup",
					children: /* @__PURE__ */ B(Ne, { data: e })
				}),
				/* @__PURE__ */ B(E, {
					value: "roles",
					children: /* @__PURE__ */ B(Pe, { data: e })
				}),
				/* @__PURE__ */ B(E, {
					value: "members",
					children: /* @__PURE__ */ B(Ie, {})
				}),
				/* @__PURE__ */ B(E, {
					value: "guests",
					children: /* @__PURE__ */ B(Fe, { data: e })
				})
			]
		})]
	})] });
}
function Ae() {
	let e = L(), t = F({
		mutationFn: () => A.post(`${Z}/admin/sync`),
		onSuccess: () => {
			N.success("Syncing everyone's roles; this takes a moment with many members"), setTimeout(() => e.invalidateQueries({ queryKey: ["discord"] }), 4e3);
		},
		onError: (e) => N.error(e.message)
	});
	return /* @__PURE__ */ V(i, {
		loading: t.isPending,
		onClick: () => t.mutate(),
		children: [/* @__PURE__ */ B(W, {}), " Sync everyone"]
	});
}
function je({ value: e }) {
	return /* @__PURE__ */ V("div", {
		className: "flex items-stretch",
		children: [/* @__PURE__ */ B(v, {
			readOnly: !0,
			value: e,
			className: "font-mono text-xs",
			onFocus: (e) => e.target.select()
		}), /* @__PURE__ */ B(i, {
			variant: "secondary",
			size: "icon",
			"aria-label": "Copy",
			onClick: () => navigator.clipboard.writeText(e).then(() => N.success("Copied"), () => N.error("Couldn't copy; select the text instead")),
			children: /* @__PURE__ */ B(q, {})
		})]
	});
}
function Me({ n: e, title: t, done: n, children: r }) {
	return /* @__PURE__ */ V("li", {
		className: "grid grid-cols-[32px_1fr] gap-4",
		children: [/* @__PURE__ */ B("span", {
			className: j("grid size-8 place-items-center border font-mono text-sm", n ? "border-success/40 bg-success-soft text-success-fg" : "border-border-strong text-muted"),
			children: n ? /* @__PURE__ */ B(pe, {}) : e
		}), /* @__PURE__ */ V("div", {
			className: "min-w-0 space-y-3 pb-2",
			children: [/* @__PURE__ */ B("div", {
				className: "pt-1 font-medium",
				children: t
			}), r]
		})]
	});
}
function Ne({ data: t }) {
	let n = L(), r = t.settings, [l, u] = R({
		client_id: r.client_id,
		guild_id: r.guild_id,
		nickname_format: r.nickname_format,
		kick_without_access: r.kick_without_access,
		require_for_compliance: r.require_for_compliance
	}), [d, f] = R(""), [p, m] = R(""), [h, g] = R(null), y = F({
		mutationFn: () => A.put(`${Z}/admin/settings`, {
			...l,
			client_secret: d || null,
			bot_token: p || null
		}),
		onSuccess: (e) => {
			n.setQueryData($, e), n.invalidateQueries({ queryKey: ["discord", "me"] }), f(""), m(""), N.success("Saved");
		},
		onError: (e) => N.error(e.message)
	}), b = F({
		mutationFn: () => A.post(`${Z}/admin/check`),
		onSuccess: (e) => {
			g(e), n.setQueryData(["discord", "check"], e), n.invalidateQueries({ queryKey: $ });
		},
		onError: (e) => {
			g(null), N.error(e.message);
		}
	}), x = (e) => u((t) => ({
		...t,
		...e
	}));
	return /* @__PURE__ */ V("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_380px]",
		children: [/* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(o, { children: /* @__PURE__ */ V("ol", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ V(Me, {
					n: 1,
					title: "Create a Discord application",
					done: !!r.client_id && r.client_secret_set,
					children: [
						/* @__PURE__ */ V("p", {
							className: "text-sm text-muted",
							children: [
								"Open the",
								" ",
								/* @__PURE__ */ B("a", {
									href: "https://discord.com/developers/applications",
									target: "_blank",
									rel: "noreferrer",
									className: "text-accent-ink underline-offset-4 hover:underline",
									children: "Discord developer portal"
								}),
								" ",
								"and press ",
								/* @__PURE__ */ B("b", { children: "New Application" }),
								". On its ",
								/* @__PURE__ */ B("b", { children: "OAuth2" }),
								" page, add this redirect and copy the client id and secret here."
							]
						}),
						/* @__PURE__ */ B(_, {
							label: "Redirect",
							children: /* @__PURE__ */ B(je, { value: t.redirect_uri })
						}),
						/* @__PURE__ */ V("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ B(_, {
								label: "Client id",
								children: /* @__PURE__ */ B(v, {
									value: l.client_id,
									onChange: (e) => x({ client_id: e.target.value }),
									placeholder: "1234567890123456789",
									className: "font-mono"
								})
							}), /* @__PURE__ */ B(_, {
								label: "Client secret",
								hint: r.client_secret_set ? "Saved. Type a new one to replace it." : void 0,
								children: /* @__PURE__ */ B(v, {
									type: "password",
									autoComplete: "off",
									value: d,
									onChange: (e) => f(e.target.value),
									placeholder: r.client_secret_set ? "••••••••••••" : "",
									className: "font-mono"
								})
							})]
						})
					]
				}),
				/* @__PURE__ */ V(Me, {
					n: 2,
					title: "Add the bot to your server",
					done: r.bot_token_set && !!r.guild_id,
					children: [
						/* @__PURE__ */ V("p", {
							className: "text-sm text-muted",
							children: [
								"On the application's ",
								/* @__PURE__ */ B("b", { children: "Bot" }),
								" page press ",
								/* @__PURE__ */ B("b", { children: "Reset Token" }),
								" and paste it here. For the server id, turn on Developer Mode in Discord (Settings → Advanced), then right-click the server → ",
								/* @__PURE__ */ B("b", { children: "Copy Server ID" }),
								"."
							]
						}),
						/* @__PURE__ */ V("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ B(_, {
								label: "Bot token",
								hint: r.bot_token_set ? "Saved. Paste a new one to replace it." : void 0,
								children: /* @__PURE__ */ B(v, {
									type: "password",
									autoComplete: "off",
									value: p,
									onChange: (e) => m(e.target.value),
									placeholder: r.bot_token_set ? "••••••••••••" : "",
									className: "font-mono"
								})
							}), /* @__PURE__ */ B(_, {
								label: "Server id",
								children: /* @__PURE__ */ B(v, {
									value: l.guild_id,
									onChange: (e) => x({ guild_id: e.target.value }),
									placeholder: "1234567890123456789",
									className: "font-mono"
								})
							})]
						}),
						t.invite_url ? /* @__PURE__ */ B("a", {
							href: t.invite_url,
							target: "_blank",
							rel: "noreferrer",
							children: /* @__PURE__ */ V(i, {
								variant: "outline",
								children: [/* @__PURE__ */ B(U, {}), " Invite the bot to the server"]
							})
						}) : /* @__PURE__ */ B("p", {
							className: "text-xs text-subtle",
							children: "Save the client id to get the link that invites the bot."
						}),
						/* @__PURE__ */ B("p", {
							className: "text-xs text-subtle",
							children: "It asks for Manage Roles, Manage Nicknames, Create Invite and Kick Members. Afterwards drag the bot's role above every role it should give (Server Settings → Roles)."
						})
					]
				}),
				/* @__PURE__ */ V(Me, {
					n: 3,
					title: "Choose how members appear",
					done: r.configured,
					children: [/* @__PURE__ */ B(_, {
						label: "Nickname",
						hint: /* @__PURE__ */ V(z, { children: [
							"Placeholders: ",
							"{character}",
							" ",
							"{corp_ticker}",
							" ",
							"{corp}",
							" ",
							"{alliance_ticker}",
							" ",
							"{alliance}",
							". Leave empty to let people pick their own."
						] }),
						children: /* @__PURE__ */ B(v, {
							value: l.nickname_format,
							onChange: (e) => x({ nickname_format: e.target.value }),
							placeholder: "[{corp_ticker}] {character}",
							className: "max-w-sm font-mono"
						})
					}), /* @__PURE__ */ V("div", {
						className: "border border-border px-3",
						children: [/* @__PURE__ */ B(T, {
							label: "Remove people who lose access from the server",
							description: "Off: they only lose the roles this site gave them. On: they're kicked and have to link again once they have access.",
							checked: l.kick_without_access,
							onCheckedChange: (e) => x({ kick_without_access: e })
						}), /* @__PURE__ */ B(T, {
							label: "Must be on the Discord server to be compliant",
							description: "Members who may link Discord count as not compliant until they've linked it and while they're not on the server (Administration → Compliance, and the Compliant group rule). Leaving is noticed at the next sync, at most 6 hours later.",
							checked: l.require_for_compliance,
							onCheckedChange: (e) => x({ require_for_compliance: e })
						})]
					})]
				})
			]
		}) }), /* @__PURE__ */ B(s, { children: /* @__PURE__ */ B(i, {
			variant: "primary",
			loading: y.isPending,
			onClick: () => y.mutate(),
			children: "Save"
		}) })] }), /* @__PURE__ */ V(a, {
			className: "h-fit",
			children: [/* @__PURE__ */ B(c, {
				title: "Connection",
				description: "Asks Discord whether everything is in place."
			}), /* @__PURE__ */ V(o, {
				className: "space-y-4",
				children: [h ? /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ V("div", {
					className: "flex items-center gap-3",
					children: [h.guild.icon ? /* @__PURE__ */ B("img", {
						src: h.guild.icon,
						alt: "",
						className: "size-12"
					}) : /* @__PURE__ */ B("span", {
						className: "grid size-12 place-items-center bg-accent-soft text-accent-ink",
						children: /* @__PURE__ */ B(U, { className: "size-6" })
					}), /* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("div", {
						className: "font-medium",
						children: h.guild.name
					}), /* @__PURE__ */ V("div", {
						className: "text-xs text-subtle",
						children: [
							"bot: ",
							h.bot.name,
							" ",
							h.bot.on_server ? "· on the server" : "· not on the server"
						]
					})] })]
				}), h.problems.length === 0 ? /* @__PURE__ */ B(e, {
					tone: "success",
					title: "All good",
					children: "The bot can add members, give the mapped roles and set nicknames."
				}) : /* @__PURE__ */ B(e, {
					tone: "warning",
					title: `${h.problems.length} thing${h.problems.length === 1 ? "" : "s"} to fix`,
					children: /* @__PURE__ */ B("ul", {
						className: "list-disc space-y-1 pl-4",
						children: h.problems.map((e) => /* @__PURE__ */ B("li", { children: e }, e))
					})
				})] }) : /* @__PURE__ */ B("p", {
					className: "text-sm text-muted",
					children: r.bot_token_set && r.guild_id ? "Not checked yet." : "Save the bot token and server id first."
				}), /* @__PURE__ */ V(i, {
					className: "w-full",
					disabled: !r.bot_token_set || !r.guild_id,
					loading: b.isPending,
					onClick: () => b.mutate(),
					children: [/* @__PURE__ */ B(W, {}), " Check connection"]
				})]
			})]
		})]
	});
}
function Pe({ data: t }) {
	let n = L(), { data: l, isLoading: u, error: d } = I({
		queryKey: ["discord", "check"],
		queryFn: () => A.post(`${Z}/admin/check`),
		staleTime: 6e4,
		retry: !1
	}), [f, p] = R(null), m = f ?? t.mappings, [h, v] = R(""), [y, b] = R(""), S = F({
		mutationFn: (e) => A.put(`${Z}/admin/mappings`, { mappings: e }),
		onSuccess: (e) => {
			n.setQueryData($, e), p(null), N.success("Saved; everyone's roles are being updated");
		},
		onError: (e) => N.error(e.message)
	}), C = l?.roles ?? [], w = Object.fromEntries(C.map((e) => [e.id, e]));
	return /* @__PURE__ */ V("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_340px]",
		children: [/* @__PURE__ */ V(a, { children: [
			/* @__PURE__ */ B(c, {
				title: "Who gets which role",
				description: "Members of a group, or everyone in a state, get the role. A person can match several rows."
			}),
			d ? /* @__PURE__ */ B(o, { children: /* @__PURE__ */ B(e, {
				tone: "warning",
				title: "Couldn't load the server's roles",
				children: d.message
			}) }) : /* @__PURE__ */ B(o, {
				className: "border-b border-border",
				children: /* @__PURE__ */ V("div", {
					className: "flex flex-wrap items-end gap-3",
					children: [
						/* @__PURE__ */ B(_, {
							label: "Group or state",
							className: "min-w-56 flex-1",
							children: /* @__PURE__ */ V(x, {
								value: h,
								onChange: (e) => v(e.target.value),
								children: [
									/* @__PURE__ */ B("option", {
										value: "",
										children: "Choose…"
									}),
									/* @__PURE__ */ B("optgroup", {
										label: "States",
										children: t.states.map((e) => /* @__PURE__ */ B("option", {
											value: `state:${e.id}`,
											children: e.name
										}, `s${e.id}`))
									}),
									/* @__PURE__ */ B("optgroup", {
										label: "Groups",
										children: t.groups.map((e) => /* @__PURE__ */ B("option", {
											value: `group:${e.id}`,
											children: e.name
										}, `g${e.id}`))
									})
								]
							})
						}),
						/* @__PURE__ */ B(_, {
							label: "Discord role",
							className: "min-w-56 flex-1",
							children: /* @__PURE__ */ V(x, {
								value: y,
								onChange: (e) => b(e.target.value),
								disabled: u,
								children: [/* @__PURE__ */ B("option", {
									value: "",
									children: u ? "Loading roles…" : "Choose…"
								}), C.map((e) => /* @__PURE__ */ V("option", {
									value: e.id,
									disabled: !e.assignable,
									children: [
										"@",
										e.name,
										e.assignable ? "" : " (above the bot)"
									]
								}, e.id))]
							})
						}),
						/* @__PURE__ */ V(i, {
							disabled: !h || !y,
							onClick: () => {
								let [e, n] = h.split(":"), r = w[y];
								if (!e || !r) return;
								let i = e === "group" ? t.groups.find((e) => e.id === Number(n))?.name : t.states.find((e) => e.id === Number(n))?.name;
								p([...m, {
									kind: e,
									target_id: Number(n),
									target: i,
									role_id: r.id,
									role_name: r.name
								}]), b("");
							},
							children: [/* @__PURE__ */ B(J, {}), " Add"]
						})
					]
				})
			}),
			m.length === 0 ? /* @__PURE__ */ B(g, {
				icon: /* @__PURE__ */ B(U, {}),
				title: "No roles mapped yet",
				description: "Linked members join the server without any roles until you add some."
			}) : /* @__PURE__ */ B("ul", {
				className: "divide-y divide-border",
				children: m.map((e, t) => {
					let n = w[e.role_id];
					return /* @__PURE__ */ V("li", {
						className: "flex items-center gap-3 px-card py-3 text-sm",
						children: [
							/* @__PURE__ */ B(r, {
								tone: e.kind === "state" ? "info" : "neutral",
								children: e.kind
							}),
							/* @__PURE__ */ B("span", {
								className: "min-w-0 flex-1 truncate font-medium",
								children: e.target
							}),
							/* @__PURE__ */ B("span", {
								className: "text-subtle",
								children: "→"
							}),
							/* @__PURE__ */ V("span", {
								className: "flex min-w-0 flex-1 items-center gap-2",
								children: [
									/* @__PURE__ */ B("span", {
										className: "size-2.5 shrink-0 rounded-full border border-border",
										style: { background: n?.color ?? "transparent" }
									}),
									/* @__PURE__ */ V("span", {
										className: "truncate",
										children: ["@", n?.name ?? e.role_name ?? e.role_id]
									}),
									l && !n && /* @__PURE__ */ B(r, {
										tone: "danger",
										children: "deleted"
									}),
									n && !n.assignable && /* @__PURE__ */ B(r, {
										tone: "warning",
										children: "above the bot"
									})
								]
							}),
							/* @__PURE__ */ B(i, {
								variant: "ghost",
								size: "icon-xs",
								"aria-label": "Remove",
								onClick: () => p(m.filter((e, n) => n !== t)),
								children: /* @__PURE__ */ B(fe, {})
							})
						]
					}, `${e.kind}-${e.target_id}-${e.role_id}`);
				})
			}),
			f && /* @__PURE__ */ V(s, {
				className: "justify-between",
				children: [/* @__PURE__ */ B("span", {
					className: "text-xs text-muted",
					children: "Unsaved changes"
				}), /* @__PURE__ */ V("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ B(i, {
						variant: "ghost",
						onClick: () => p(null),
						children: "Discard"
					}), /* @__PURE__ */ B(i, {
						variant: "primary",
						loading: S.isPending,
						onClick: () => S.mutate(m),
						children: "Save and sync"
					})]
				})]
			})
		] }), /* @__PURE__ */ V(a, {
			className: "h-fit",
			children: [/* @__PURE__ */ B(c, { title: "How roles are kept" }), /* @__PURE__ */ V(o, {
				className: "space-y-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ B("p", { children: "Roles change as soon as someone joins or leaves a group, their state changes or they pick another main, and everyone is checked again every 6 hours." }),
					/* @__PURE__ */ B("p", { children: "Only mapped roles are touched. Roles you give by hand on Discord stay." }),
					/* @__PURE__ */ B("p", { children: "The bot can only give roles below its own; drag its role up in Server Settings → Roles if a role shows \"above the bot\"." })
				]
			})]
		})]
	});
}
function Fe({ data: t }) {
	let n = L(), r = t.settings, { data: l, isLoading: u, error: d } = I({
		queryKey: ["discord", "check"],
		queryFn: () => A.post(`${Z}/admin/check`),
		staleTime: 6e4,
		retry: !1
	}), [f, p] = R({
		enabled: r.guest_enabled,
		role_id: r.guest_role_id,
		max_hours: String(r.guest_max_hours)
	}), [m, h] = R(r.guest_channels.map((e) => e.id)), [g, y] = R([]), b = I({
		queryKey: ["discord", "channels"],
		queryFn: () => A.get(`${Z}/admin/channels`),
		staleTime: 6e4,
		retry: !1
	}), C = l?.roles ?? [], w = F({
		mutationFn: () => A.put(`${Z}/admin/guests`, {
			enabled: f.enabled,
			role_id: f.role_id,
			max_hours: Number(f.max_hours) || 0,
			role_name: C.find((e) => e.id === f.role_id)?.name ?? r.guest_role_name,
			channels: m
		}),
		onSuccess: (e) => {
			n.setQueryData($, e), n.invalidateQueries({ queryKey: ["discord"] }), y(e.guest_channels_seen ?? []), e.guest_channels_seen?.length ? N.warning("Saved, but guests can still see some channels; see below") : e.guest_channels_hiding ? N.success("Saved; the other channels are being hidden from guests, which takes a minute on a large server") : N.success(f.enabled ? "Saved" : "Saved; guests still on the server are being removed");
		},
		onError: (e) => N.error(e.message)
	}), ee = (e) => h((t) => t.includes(e) ? t.filter((t) => t !== e) : [...t, e]), E = [];
	for (let e of b.data ?? []) {
		let t = E[E.length - 1];
		t && t.category === (e.category ?? "") ? t.channels.push(e) : E.push({
			category: e.category ?? "",
			channels: [e]
		});
	}
	let D = (e) => p((t) => ({
		...t,
		...e
	}));
	return /* @__PURE__ */ V("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_340px]",
		children: [/* @__PURE__ */ V(a, { children: [
			/* @__PURE__ */ B(c, {
				title: "Temporary access links",
				description: "People with the permission hand out links. Whoever opens one signs in with Discord, joins the server with the guest role and is removed again when the link runs out."
			}),
			/* @__PURE__ */ V(o, {
				className: "space-y-5",
				children: [
					/* @__PURE__ */ B("div", {
						className: "border border-border px-3",
						children: /* @__PURE__ */ B(T, {
							label: "Temporary access links",
							description: "Off: nobody can make links, existing ones stop working and guests still on the server are removed.",
							checked: f.enabled,
							onCheckedChange: (e) => D({ enabled: e })
						})
					}),
					/* @__PURE__ */ B(_, {
						label: "Add this second redirect to the Discord application",
						hint: "Developer portal → your application → OAuth2 → Redirects. Without it Discord refuses guests with “Invalid OAuth2 redirect_uri”.",
						children: /* @__PURE__ */ B(je, { value: t.guest_redirect_uri })
					}),
					d && /* @__PURE__ */ B(e, {
						tone: "warning",
						title: "Couldn't load the server's roles",
						children: d.message
					}),
					/* @__PURE__ */ V("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ B(_, {
							label: "Role guests get",
							hint: "Make a role for guests on Discord and let it see only the channels guests should. It must be below the bot's role.",
							children: /* @__PURE__ */ V(x, {
								value: f.role_id,
								onChange: (e) => D({ role_id: e.target.value }),
								disabled: u,
								children: [
									/* @__PURE__ */ B("option", {
										value: "",
										children: u ? "Loading roles…" : "Choose…"
									}),
									f.role_id && !C.some((e) => e.id === f.role_id) && /* @__PURE__ */ V("option", {
										value: f.role_id,
										children: ["@", r.guest_role_name || f.role_id]
									}),
									C.map((e) => /* @__PURE__ */ V("option", {
										value: e.id,
										disabled: !e.assignable,
										children: [
											"@",
											e.name,
											e.assignable ? "" : " (above the bot)"
										]
									}, e.id))
								]
							})
						}), /* @__PURE__ */ B(_, {
							label: "Longest a link may last (hours)",
							hint: `Up to ${t.guest_hours_ceiling} hours (${t.guest_hours_ceiling / 24} days).`,
							children: /* @__PURE__ */ B(v, {
								type: "number",
								min: 1,
								max: t.guest_hours_ceiling,
								value: f.max_hours,
								onChange: (e) => D({ max_hours: e.target.value }),
								className: "max-w-32"
							})
						})]
					}),
					/* @__PURE__ */ B(_, {
						label: "Channels guests may be let into",
						hint: m.length ? "The bot hides every other channel from the guest role, also ones made later. Whoever makes a link picks which of these it opens." : "None chosen: guests see whatever the guest role sees on Discord. Choose some and guests see only the channels their link opens.",
						children: b.error ? /* @__PURE__ */ B(e, {
							tone: "warning",
							title: "Couldn't load the server's channels",
							children: b.error.message
						}) : b.isLoading ? /* @__PURE__ */ B(S, { className: "h-24" }) : /* @__PURE__ */ B("div", {
							className: "max-h-72 space-y-3 overflow-y-auto border border-border p-3",
							children: E.map((e, t) => /* @__PURE__ */ V("div", { children: [e.category && /* @__PURE__ */ B("div", {
								className: "mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
								children: e.category
							}), /* @__PURE__ */ B("div", {
								className: "flex flex-wrap gap-1.5",
								children: e.channels.map((e) => /* @__PURE__ */ B("button", {
									type: "button",
									"aria-pressed": m.includes(e.id),
									onClick: () => ee(e.id),
									className: j("border px-2.5 py-1 text-xs", m.includes(e.id) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:border-border-strong"),
									children: be(e)
								}, e.id))
							})] }, `${e.category}-${t}`))
						})
					}),
					g.length > 0 && /* @__PURE__ */ V(e, {
						tone: "warning",
						title: "Guests can still see channels they shouldn't",
						children: [
							"The bot wasn't allowed to hide ",
							g.slice(0, 8).join(", "),
							g.length > 8 ? "…" : "",
							". Give its role ",
							/* @__PURE__ */ B("b", { children: "Manage Permissions" }),
							" in those channels (or hide them from the guest role by hand) and save again. Nobody is let in through a link until this is sorted."
						]
					})
				]
			}),
			/* @__PURE__ */ V(s, {
				className: "justify-between",
				children: [/* @__PURE__ */ B(P, {
					to: "/p/discord/guests",
					className: "text-sm text-accent-ink underline-offset-4 hover:underline",
					children: "See the links and their guests"
				}), /* @__PURE__ */ B(i, {
					variant: "primary",
					loading: w.isPending,
					onClick: () => w.mutate(),
					children: "Save"
				})]
			})
		] }), /* @__PURE__ */ V(a, {
			className: "h-fit",
			children: [/* @__PURE__ */ B(c, { title: "How guests are handled" }), /* @__PURE__ */ V(o, {
				className: "space-y-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ V("p", { children: [
						"Give ",
						/* @__PURE__ */ B("b", { children: "Can hand out temporary access to the Discord server" }),
						" to the people who may make links (Administration → Access), for example fleet commanders, diplomats and recruiters."
					] }),
					/* @__PURE__ */ B("p", { children: "Guests are removed within a couple of minutes of their link running out or being withdrawn, and when its maker loses that permission." }),
					/* @__PURE__ */ B("p", { children: "With channels chosen, a guest sees only the ones their link opens. Members and other roles aren't affected." }),
					/* @__PURE__ */ B("p", { children: "Someone who was already on the server can't come in as a guest, so nobody is ever removed who was there before." }),
					/* @__PURE__ */ B("p", { children: "A guest who links their Discord account as a member here keeps their place and only loses the guest role." })
				]
			})]
		})]
	});
}
function Ie() {
	let e = L(), { data: o, isLoading: s } = I({
		queryKey: ["discord", "members"],
		queryFn: () => A.get(`${Z}/admin/members`)
	}), [c, u] = R(""), [_, v] = R(null), y = () => e.invalidateQueries({ queryKey: ["discord"] }), x = F({
		mutationFn: (e) => A.post(`${Z}/admin/members/${e}/sync`),
		onSuccess: (e) => {
			e.removed ? N.success("They no longer have access and were removed from the server") : e.error ? N.error(e.error) : N.success("Roles updated"), y();
		},
		onError: (e) => N.error(e.message)
	}), C = F({
		mutationFn: ({ id: e, kick: t, force: n = !1 }) => A.delete(`${Z}/admin/members/${e}?kick=${t}${n ? "&force=true" : ""}`),
		onSuccess: () => {
			N.success("Unlinked"), y();
		},
		onError: (e, n) => {
			e instanceof t && e.status === 502 && !n.force ? N.error(e.message, {
				action: {
					label: "Forget anyway",
					onClick: () => C.mutate({
						...n,
						force: !0
					})
				},
				description: "Forgetting it leaves their roles on Discord; take them off there by hand."
			}) : N.error(e.message);
		}
	});
	if (s || !o) return /* @__PURE__ */ B(S, { className: "h-64" });
	let w = c.trim().toLowerCase(), T = w ? o.filter((e) => [
		e.user.name,
		e.username,
		e.nickname ?? "",
		...(e.characters ?? []).map((e) => e.name)
	].some((e) => e.toLowerCase().includes(w))) : o;
	return /* @__PURE__ */ V(a, { children: [
		/* @__PURE__ */ B(te, { children: /* @__PURE__ */ B(b, {
			value: c,
			onChange: (e) => u(e.target.value),
			placeholder: "Member, character or Discord name",
			className: "w-80"
		}) }),
		T.length === 0 ? /* @__PURE__ */ B(g, {
			icon: /* @__PURE__ */ B(U, {}),
			title: o.length ? "Nobody matches" : "Nobody has linked Discord yet"
		}) : /* @__PURE__ */ V(D, { children: [/* @__PURE__ */ B(ee, { children: /* @__PURE__ */ V("tr", { children: [
			/* @__PURE__ */ B(k, { children: "Member" }),
			/* @__PURE__ */ B(k, { children: "Discord" }),
			/* @__PURE__ */ B(k, { children: "Roles" }),
			/* @__PURE__ */ B(k, { children: "Checked" }),
			/* @__PURE__ */ B(k, {})
		] }) }), /* @__PURE__ */ B("tbody", { children: T.map((e) => /* @__PURE__ */ V(re, { children: [
			/* @__PURE__ */ B(O, { children: /* @__PURE__ */ V("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ B(n, {
					src: e.user.portrait,
					name: e.user.name,
					size: "sm"
				}), /* @__PURE__ */ V("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ B("div", {
							className: "truncate font-medium",
							children: e.user.name
						}),
						!e.has_access && /* @__PURE__ */ B(r, {
							tone: "warning",
							children: "no access"
						}),
						!e.on_server && /* @__PURE__ */ B(r, {
							tone: "danger",
							children: "not on the server"
						}),
						/* @__PURE__ */ B(Le, {
							list: e.characters ?? [],
							needle: w
						})
					]
				})]
			}) }),
			/* @__PURE__ */ B(O, { children: /* @__PURE__ */ V("div", {
				className: "flex items-center gap-2.5",
				children: [/* @__PURE__ */ B(n, {
					src: e.avatar,
					name: e.username,
					size: "xs",
					rounded: "full"
				}), /* @__PURE__ */ V("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ B("div", {
						className: "truncate text-sm",
						children: e.username
					}), e.nickname && /* @__PURE__ */ B("div", {
						className: "truncate text-xs text-subtle",
						children: e.nickname
					})]
				})]
			}) }),
			/* @__PURE__ */ B(O, { children: /* @__PURE__ */ B("div", {
				className: "flex max-w-72 flex-wrap gap-1",
				children: e.role_names.length ? e.role_names.map((e) => /* @__PURE__ */ V(r, {
					tone: "accent",
					children: ["@", e]
				}, e)) : /* @__PURE__ */ B("span", {
					className: "text-xs text-subtle",
					children: "none"
				})
			}) }),
			/* @__PURE__ */ B(O, {
				className: "text-sm",
				children: e.error ? /* @__PURE__ */ B("span", {
					className: "text-warning-fg",
					title: e.error,
					children: e.error.length > 60 ? `${e.error.slice(0, 60)}…` : e.error
				}) : /* @__PURE__ */ B("span", {
					className: "text-muted",
					children: M(e.synced_at)
				})
			}),
			/* @__PURE__ */ B(O, {
				align: "right",
				children: /* @__PURE__ */ V(p, { children: [/* @__PURE__ */ B(h, {
					asChild: !0,
					children: /* @__PURE__ */ B(i, {
						variant: "ghost",
						size: "sm",
						children: "Actions"
					})
				}), /* @__PURE__ */ V(d, {
					align: "end",
					children: [
						/* @__PURE__ */ V(f, {
							onSelect: () => x.mutate(e.user.id),
							children: [/* @__PURE__ */ B(W, {}), " Sync now"]
						}),
						/* @__PURE__ */ V(f, {
							onSelect: () => window.open(`https://discord.com/users/${e.discord_id}`, "_blank", "noreferrer"),
							children: [/* @__PURE__ */ B(K, {}), " Discord profile"]
						}),
						/* @__PURE__ */ B(m, {}),
						/* @__PURE__ */ V(f, {
							onSelect: () => v({
								m: e,
								kick: !1
							}),
							children: [/* @__PURE__ */ B(G, {}), " Unlink"]
						}),
						/* @__PURE__ */ V(f, {
							danger: !0,
							onSelect: () => v({
								m: e,
								kick: !0
							}),
							children: [/* @__PURE__ */ B(fe, {}), " Unlink and kick"]
						})
					]
				})] })
			})
		] }, e.user.id)) })] }),
		/* @__PURE__ */ B(l, {
			open: !!_,
			onOpenChange: (e) => !e && v(null),
			title: _?.kick ? `Kick ${_?.m.user.name} from the server?` : `Unlink ${_?.m.user.name}'s Discord?`,
			description: _?.kick ? "They're removed from the server and the link is forgotten. They can link again while they have access." : "The roles this site gave them are taken away and the link is forgotten. They stay on the server.",
			danger: !0,
			confirmLabel: _?.kick ? "Kick" : "Unlink",
			onConfirm: () => _ && C.mutateAsync({
				id: _.m.user.id,
				kick: _.kick
			})
		})
	] });
}
function Le({ list: e, needle: t }) {
	let [n, i] = R(!1), a = e.filter((e) => !e.main);
	if (!e.length) return null;
	let o = n ? e : e.filter((e, n) => n < 3 || t && e.name.toLowerCase().includes(t)), s = (e) => /* @__PURE__ */ V("span", {
		className: j("truncate", e.main ? "text-text" : "text-muted"),
		children: [e.name, e.corporation && /* @__PURE__ */ V("span", {
			className: "ml-1 text-subtle",
			children: [
				"[",
				e.corporation,
				"]"
			]
		})]
	});
	return /* @__PURE__ */ V("div", {
		className: "mt-1.5 space-y-1",
		children: [
			o.map((e) => /* @__PURE__ */ V("div", {
				className: "flex items-center gap-1.5 text-xs",
				children: [
					/* @__PURE__ */ B("img", {
						src: e.portrait,
						alt: "",
						className: "size-4 shrink-0"
					}),
					e.viewable ? /* @__PURE__ */ B(P, {
						to: `/characters/${e.id}`,
						className: "flex min-w-0 hover:text-accent-ink hover:underline",
						children: s(e)
					}) : s(e),
					e.main && /* @__PURE__ */ B(r, {
						size: "xs",
						children: "main"
					})
				]
			}, e.id)),
			e.length > o.length && /* @__PURE__ */ V("button", {
				type: "button",
				onClick: () => i(!0),
				className: "text-xs text-accent-ink hover:underline",
				children: [
					e.length - o.length,
					" more character",
					e.length - o.length === 1 ? "" : "s"
				]
			}),
			n && e.length > 3 && /* @__PURE__ */ B("button", {
				type: "button",
				onClick: () => i(!1),
				className: "text-xs text-subtle hover:underline",
				children: "Show fewer"
			}),
			a.length === 0 && /* @__PURE__ */ B("div", {
				className: "text-[11px] text-subtle",
				children: "No alts you can see"
			})
		]
	});
}
//#endregion
//#region src/member.tsx
function Re() {
	return I({
		queryKey: ["discord", "me"],
		queryFn: () => A.get(`${Z}/me`)
	});
}
function ze() {
	return F({
		mutationFn: () => A.post(`${Z}/link`),
		onSuccess: ({ url: e }) => window.location.assign(e),
		onError: (e) => N.error(e.message)
	});
}
function Be() {
	let t = L(), s = ae("discord.manage_discord"), { data: u, isLoading: d } = Re(), f = ze(), [p, m] = R(!1), h = F({
		mutationFn: () => A.post(`${Z}/sync`),
		onSuccess: (e) => {
			t.setQueryData(["discord", "me"], e), N.success("Your roles are up to date");
		},
		onError: (e) => {
			t.invalidateQueries({ queryKey: ["discord", "me"] }), N.error(e.message);
		}
	}), _ = F({
		mutationFn: () => A.post(`${Z}/unlink`),
		onSuccess: (e) => {
			t.setQueryData(["discord", "me"], e), N.success("Discord account unlinked");
		},
		onError: (e) => N.error(e.message)
	});
	return /* @__PURE__ */ V(z, { children: [
		/* @__PURE__ */ B(y, {
			eyebrow: "Communication",
			title: "Discord",
			icon: /* @__PURE__ */ B(U, {}),
			description: "Link your Discord account to join the server. Your roles and nickname follow your groups and main character.",
			actions: s || u?.can_invite_guests ? /* @__PURE__ */ V("div", {
				className: "flex gap-2",
				children: [u?.can_invite_guests && /* @__PURE__ */ B(P, {
					to: "/p/discord/guests",
					children: /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(Y, {}), " Temporary access"] })
				}), s && /* @__PURE__ */ B(P, {
					to: "/p/discord/admin",
					children: /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(de, {}), " Server setup"] })
				})]
			}) : void 0
		}),
		d || !u ? /* @__PURE__ */ B(S, { className: "h-56" }) : u.configured ? u.account ? /* @__PURE__ */ V("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_360px]",
			children: [/* @__PURE__ */ V("div", {
				className: "space-y-6",
				children: [u.account.error ? /* @__PURE__ */ B(e, {
					tone: "warning",
					title: "Your Discord roles couldn't be updated",
					action: u.account.error.startsWith("Not on the server") ? /* @__PURE__ */ B(i, {
						size: "sm",
						variant: "primary",
						loading: f.isPending,
						onClick: () => f.mutate(),
						children: "Join the server"
					}) : void 0,
					children: u.account.error
				}) : null, /* @__PURE__ */ B(a, { children: /* @__PURE__ */ V("div", {
					className: "flex flex-col gap-5 p-card sm:flex-row sm:items-center",
					children: [
						/* @__PURE__ */ B(n, {
							src: u.account.avatar,
							name: u.account.username,
							size: "lg",
							rounded: "full"
						}),
						/* @__PURE__ */ V("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ V("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ B("span", {
										className: "text-lg font-semibold",
										children: u.account.username
									}), /* @__PURE__ */ V(r, {
										tone: "success",
										children: [/* @__PURE__ */ B(pe, { className: "size-3" }), " Linked"]
									})]
								}),
								/* @__PURE__ */ V("div", {
									className: "text-sm text-muted",
									children: [
										"on ",
										u.server || "the server",
										u.account.nickname ? /* @__PURE__ */ V(z, { children: [" as ", /* @__PURE__ */ B("span", {
											className: "text-text",
											children: u.account.nickname
										})] }) : null
									]
								}),
								/* @__PURE__ */ V("div", {
									className: "mt-1 text-xs text-subtle",
									children: [
										"Linked ",
										M(u.account.linked_at),
										" · roles checked ",
										M(u.account.synced_at)
									]
								})
							]
						}),
						/* @__PURE__ */ V("div", {
							className: "flex flex-wrap gap-2",
							children: [
								u.server_url && /* @__PURE__ */ B("a", {
									href: u.server_url,
									target: "_blank",
									rel: "noreferrer",
									children: /* @__PURE__ */ V(i, {
										variant: "primary",
										children: [/* @__PURE__ */ B(K, {}), " Open Discord"]
									})
								}),
								/* @__PURE__ */ V(i, {
									variant: "ghost",
									loading: h.isPending,
									onClick: () => h.mutate(),
									children: [/* @__PURE__ */ B(W, {}), " Fix my roles"]
								}),
								/* @__PURE__ */ V(i, {
									variant: "danger",
									onClick: () => m(!0),
									children: [/* @__PURE__ */ B(G, {}), " Unlink"]
								})
							]
						})
					]
				}) })]
			}), /* @__PURE__ */ V(a, {
				className: "h-fit",
				children: [/* @__PURE__ */ B(c, {
					title: "Your roles",
					description: "Given by this site. Roles given by hand on Discord aren't touched."
				}), /* @__PURE__ */ B(o, { children: /* @__PURE__ */ B(Ve, {
					roles: u.roles,
					empty: "None of your groups come with a Discord role."
				}) })]
			})]
		}) : /* @__PURE__ */ B(a, { children: /* @__PURE__ */ V("div", {
			className: "grid gap-8 p-card sm:p-8 lg:grid-cols-[1fr_320px] lg:items-center",
			children: [/* @__PURE__ */ V("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ V("div", {
					className: "flex items-center gap-3 text-accent-ink",
					children: [/* @__PURE__ */ B(U, { className: "size-8" }), /* @__PURE__ */ B("span", {
						className: "text-xl font-semibold text-text",
						children: u.server || "Our Discord server"
					})]
				}), u.can_link ? /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B("p", {
					className: "max-w-prose text-sm text-muted",
					children: "Sign in with Discord and you're put on the server straight away, with the roles that go with your groups. Nobody here sees your Discord password or messages; the site only learns your Discord name."
				}), /* @__PURE__ */ B("div", {
					className: "flex flex-wrap gap-2",
					children: /* @__PURE__ */ V(i, {
						variant: "primary",
						size: "lg",
						loading: f.isPending,
						onClick: () => f.mutate(),
						children: [/* @__PURE__ */ B(U, {}), " Link Discord and join"]
					})
				})] }) : /* @__PURE__ */ B(e, {
					tone: "warning",
					title: "You don't have access to the Discord server",
					children: "Access comes with your membership. Ask your corporation's leadership if you think you should have it."
				})]
			}), u.can_link && /* @__PURE__ */ V("div", {
				className: "border border-border bg-bg/40 p-4 text-sm",
				children: [
					/* @__PURE__ */ B("div", {
						className: "mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
						children: "You'll get"
					}),
					/* @__PURE__ */ B("div", {
						className: "mb-3 font-medium",
						children: u.nickname ?? "Your Discord name"
					}),
					/* @__PURE__ */ B(Ve, {
						roles: u.roles_due,
						empty: "No roles yet; they come with your groups."
					})
				]
			})]
		}) }) : /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(g, {
			icon: /* @__PURE__ */ B(U, {}),
			title: "Discord isn't set up yet",
			description: s ? "Connect a Discord application and server under Server setup." : "Your leadership hasn't connected a Discord server to this site yet.",
			action: s ? /* @__PURE__ */ B(P, {
				to: "/p/discord/admin",
				children: /* @__PURE__ */ V(i, {
					variant: "primary",
					children: [/* @__PURE__ */ B(de, {}), " Server setup"]
				})
			}) : void 0
		}) }),
		/* @__PURE__ */ B(l, {
			open: p,
			onOpenChange: m,
			title: "Unlink your Discord account?",
			description: "The roles this site gave you are taken away (you may be removed from the server). You can link again at any time.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(G, {}), " Unlink"] }),
			onConfirm: () => _.mutateAsync()
		})
	] });
}
function Ve({ roles: e, empty: t }) {
	return e.length === 0 ? /* @__PURE__ */ B("p", {
		className: "text-sm text-subtle",
		children: t
	}) : /* @__PURE__ */ B("div", {
		className: "flex flex-wrap gap-1.5",
		children: e.map((e) => /* @__PURE__ */ V(r, {
			tone: "accent",
			children: ["@", e]
		}, e))
	});
}
function He() {
	let [e] = ce(), t = oe(), n = L(), r = ue(!1), [o, s] = R(e.get("error") ? "You cancelled the sign-in with Discord." : null), c = ze();
	return le(() => {
		let i = e.get("code"), a = e.get("state");
		if (!(r.current || o)) {
			if (!i || !a) {
				s("Discord didn't send a sign-in code back.");
				return;
			}
			r.current = !0, A.post(`${Z}/link/finish`, {
				code: i,
				state: a
			}).then((e) => {
				n.setQueryData(["discord", "me"], e), N.success(`Welcome to ${e.server || "the server"}, ${e.account?.username ?? ""}`), t("/p/discord", { replace: !0 });
			}).catch((e) => s(e.message));
		}
	}, [
		e,
		o,
		t,
		n
	]), o ? /* @__PURE__ */ B(a, {
		className: "mx-auto max-w-xl",
		children: /* @__PURE__ */ B(g, {
			icon: /* @__PURE__ */ B(U, {}),
			title: "Discord wasn't linked",
			description: o,
			action: /* @__PURE__ */ V("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ B(P, {
					to: "/p/discord",
					children: /* @__PURE__ */ B(i, {
						variant: "ghost",
						children: "Back"
					})
				}), /* @__PURE__ */ B(i, {
					variant: "primary",
					loading: c.isPending,
					onClick: () => c.mutate(),
					children: "Try again"
				})]
			})
		})
	}) : /* @__PURE__ */ B("div", {
		className: "grid min-h-[50vh] place-items-center",
		children: /* @__PURE__ */ V("div", {
			className: "flex flex-col items-center gap-3 text-sm text-muted",
			children: [/* @__PURE__ */ B(C, {}), "Linking your Discord account and adding you to the server…"]
		})
	});
}
//#endregion
//#region src/public.tsx
var Ue = {
	expired: "This link has expired. Ask whoever gave it to you for a new one.",
	revoked: "This link was withdrawn.",
	used_up: "This link has been used by as many people as it allows.",
	creator_lost: "Whoever gave you this link can't hand out access any more. Ask someone else for a new one."
};
function We() {
	let { token: e } = se(), { data: t, isLoading: n, error: r } = I({
		queryKey: [
			"discord",
			"public",
			e
		],
		queryFn: () => A.get(`${_e}/guest/${e}`),
		retry: !1
	}), s = F({
		mutationFn: () => A.post(`${_e}/guest/${e}/start`),
		onSuccess: (e) => window.location.assign(e.url),
		onError: (e) => N.error(e.message)
	});
	return n ? /* @__PURE__ */ B(S, { className: "h-64" }) : r || !t ? /* @__PURE__ */ B(a, {
		className: "mx-auto max-w-xl",
		children: /* @__PURE__ */ B(g, {
			icon: /* @__PURE__ */ B(U, {}),
			title: "This link doesn't work",
			description: "It may have been withdrawn, or it was copied wrongly. Ask whoever gave it to you for a new one."
		})
	}) : /* @__PURE__ */ V("div", {
		className: "mx-auto max-w-2xl",
		children: [/* @__PURE__ */ B(y, {
			icon: /* @__PURE__ */ B(U, {}),
			eyebrow: "Temporary Discord access",
			title: t.server || "Discord server",
			description: /* @__PURE__ */ V(z, { children: [
				t.invited_by ? /* @__PURE__ */ V(z, { children: [t.invited_by, " invited you"] }) : "You're invited",
				" for ",
				/* @__PURE__ */ B("b", { children: t.label }),
				"."
			] })
		}), t.status === "active" ? /* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(c, {
			title: "Join with your Discord account",
			description: "Discord asks you to confirm, then you're added to the server as a guest."
		}), /* @__PURE__ */ V(o, {
			className: "space-y-4",
			children: [/* @__PURE__ */ V(i, {
				variant: "primary",
				size: "lg",
				loading: s.isPending || s.isSuccess,
				onClick: () => s.mutate(),
				children: [/* @__PURE__ */ B(U, {}), " Join with Discord"]
			}), /* @__PURE__ */ V("p", {
				className: "text-xs text-subtle",
				children: [
					/* @__PURE__ */ B(Y, { className: "mr-1 inline size-3 align-[-2px]" }),
					"Your access ends ",
					new Date(t.expires_at).toLocaleString(),
					" (",
					ye(t.expires_at),
					"); you are removed from the server then. This site learns your Discord name and nothing else."
				]
			})]
		})] }) : /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(g, {
			icon: /* @__PURE__ */ B(Y, {}),
			title: "This link is closed",
			description: Ue[t.status]
		}) })]
	});
}
function Ge() {
	let [t] = ce(), r = ue(!1), [s, c] = R(null), [l, u] = R(t.get("error") ? "You cancelled the sign-in with Discord. Open your link again to retry." : null);
	return le(() => {
		let e = t.get("code"), n = t.get("state");
		if (!(r.current || l)) {
			if (!e || !n) {
				u("Discord didn't send a sign-in code back. Open your link again.");
				return;
			}
			r.current = !0, A.post(`${_e}/guest-finish`, {
				code: e,
				state: n
			}).then(c).catch((e) => u(e.message));
		}
	}, [t, l]), l ? /* @__PURE__ */ B(a, {
		className: "mx-auto max-w-xl",
		children: /* @__PURE__ */ B(g, {
			icon: /* @__PURE__ */ B(U, {}),
			title: "You weren't added to the server",
			description: l
		})
	}) : s ? /* @__PURE__ */ V("div", {
		className: "mx-auto max-w-2xl",
		children: [/* @__PURE__ */ B(y, {
			icon: /* @__PURE__ */ B(U, {}),
			eyebrow: "Temporary Discord access",
			title: s.server || "Discord server",
			description: /* @__PURE__ */ V(z, { children: [
				"You're in for ",
				/* @__PURE__ */ B("b", { children: s.label }),
				"."
			] })
		}), /* @__PURE__ */ B(a, { children: /* @__PURE__ */ V(o, {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ V("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ B(n, {
						src: s.avatar,
						name: s.username,
						size: "lg"
					}), /* @__PURE__ */ V("div", { children: [/* @__PURE__ */ V("div", {
						className: "font-medium",
						children: ["Welcome, ", s.username]
					}), /* @__PURE__ */ B("div", {
						className: "text-xs text-subtle",
						children: "The server is in your Discord server list now."
					})] })]
				}),
				/* @__PURE__ */ B("a", {
					href: s.server_url,
					target: "_blank",
					rel: "noreferrer",
					children: /* @__PURE__ */ V(i, {
						variant: "primary",
						children: [/* @__PURE__ */ B(K, {}), " Open Discord"]
					})
				}),
				/* @__PURE__ */ V(e, {
					tone: "info",
					title: `Access ends ${new Date(s.expires_at).toLocaleString()}`,
					icon: /* @__PURE__ */ B(Y, {}),
					children: [ye(s.expires_at), ". You are removed from the server then."]
				})
			]
		}) })]
	}) : /* @__PURE__ */ B("div", {
		className: "grid min-h-[50vh] place-items-center",
		children: /* @__PURE__ */ V("div", {
			className: "flex flex-col items-center gap-3 text-sm text-muted",
			children: [/* @__PURE__ */ B(C, {}), "Adding you to the server…"]
		})
	});
}
//#endregion
//#region src/index.tsx
function Ke() {
	let { data: e, isLoading: t } = Re(), n = ze();
	return t ? /* @__PURE__ */ B(S, { className: "h-16" }) : !e?.configured || !e.account && !e.can_link ? null : e.account ? /* @__PURE__ */ V(P, {
		to: "/p/discord",
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ V("div", {
			className: "flex min-w-0 items-center gap-3",
			children: [/* @__PURE__ */ B(U, { className: "size-7 shrink-0 text-accent-ink" }), /* @__PURE__ */ V("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ B("div", {
					className: "truncate font-medium",
					children: e.account.username
				}), /* @__PURE__ */ B("div", {
					className: "truncate text-xs text-muted",
					children: e.roles.length ? e.roles.map((e) => `@${e}`).join(" ") : "no roles"
				})]
			})]
		}), e.account.error ? /* @__PURE__ */ B(r, {
			tone: "warning",
			children: "Needs attention"
		}) : /* @__PURE__ */ B(r, {
			tone: "success",
			children: "Linked"
		})]
	}) : /* @__PURE__ */ V("div", {
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ V("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ B(U, { className: "size-7 text-accent-ink" }), /* @__PURE__ */ V("div", { children: [/* @__PURE__ */ V("div", {
				className: "font-medium",
				children: ["Join ", e.server || "our Discord"]
			}), /* @__PURE__ */ B("div", {
				className: "text-xs text-muted",
				children: "Link your account to get on the server with your roles."
			})] })]
		}), /* @__PURE__ */ B(i, {
			variant: "primary",
			size: "sm",
			loading: n.isPending,
			onClick: () => n.mutate(),
			children: "Link"
		})]
	});
}
var qe = ie({
	routes: [
		{
			path: "",
			Component: Be
		},
		{
			path: "callback",
			Component: He
		},
		{
			path: "guests",
			Component: we
		},
		{
			path: "admin",
			Component: ke
		}
	],
	publicRoutes: [{
		path: "guest/:token",
		Component: We
	}, {
		path: "guest",
		Component: Ge
	}],
	widgets: [{
		id: "link",
		title: "Discord",
		Component: Ke,
		size: "sm",
		order: 20
	}]
});
//#endregion
export { qe as default };

export const classes = ["!data","!o","!r","---","----------------------------------------------------------------------------------------------------","-----------------------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------------------","@conduit/sdk","@tanstack/react-query","a","about","above","accent","access","account","action","actions","active","add","added","adding","admin","after","again","align","align-[-2px]","all","allowed","already","also","alt","although","alts","always","an","and","announcement","another","any","anyway","api","appear","application","are","aren","aria-label","aria-pressed","as","asks","assignable","at","attention","autoComplete","autoFocus","avatar","away","back","background","be","been","before","behind","being","below","bg-accent-soft","bg-bg/40","bg-success-soft","boolean","border","border-accent","border-b","border-border","border-border-strong","border-success/40","bot","bot_token","bot_token_set","brand","but","button","by","c","callback","came","can","canManage","can_invite_guests","can_link","can_manage","cancelled","category","change","changes","channel","channelLabel","channels","character","characters","check","checked","children","choose","chosen","className","client","client_id","client_secret","client_secret_set","closed","code","color","come","comes","compliant","configured","confirmLabel","connected","connection","const","copied","copy","corporation","couldn","count","couple","create","created_at","created_by","creator_lost","current","currentColor","cx","cy","danger","dashboard","data","date","days","default","delete","deleted","description","developer","didn","diplomats","disabled","discord","discord_id","divide-border","divide-y","doesn","don","done","drag","effects","else","empty","enabled","end","ended","ended_at","ended_reason","ends","error","errors","ever","every","everyone","everything","example","existing","expired","expires_at","export","extends","eye","eyebrow","false","few","fewer","fill","fix","fleet","flex","flex-1","flex-col","flex-wrap","follow","font-medium","font-mono","font-semibold","footer","for","force","forum","from","full","function","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-5","gap-6","gap-8","gave","get","gets","ghost","give","given","go","gone","good","grid","grid-cols-[32px_1fr]","group","groups","guest","guest_channels","guest_channels_seen","guest_enabled","guest_hours_ceiling","guest_max_hours","guest_redirect_uri","guest_role_id","guest_role_name","guests","guild","guild_id","guild_name","h","h-16","h-24","h-56","h-64","h-96","h-fit","hand","handled","has","has_access","hasn","have","height","here","hidden","hide","hides","hiding","hint","hours","hover:border-border-strong","hover:text-accent-ink","hover:text-text","hover:underline","how","href","i","icon","icon-xs","icons","id","if","import","in","info","inline","inline-flex","instanceof","instead","interface","into","invite_url","invited","invited_by","invites","is","isLoading","isPending","isn","iso","it","items","items-center","items-end","items-stretch","its","j","join","joined","joined_at","joins","justify-between","keep","keeps","kept","key","kick","kick_without_access","kicked","kind","label","large","last","last_full_sync","leadership","learns","least","leaves","left","length","let","lg","lg:grid-cols-2","lg:grid-cols-[1fr_320px]","lg:items-center","limit","link","linked","linked_at","links","list","list-disc","lists","live","ll","load","loading","long","longer","lose","loses","lost","m","m12","m18.84","m4.9","m5.17","made","main","make","maker","makes","manage_discord","manager","many","mapped","mappings","match","matches","matching","max","max-h-72","max-w-2xl","max-w-32","max-w-72","max-w-prose","max-w-sm","max-w-xl","maxLength","max_hours","max_uses","may","mb-1.5","mb-2","mb-3","me","meeting","member","members","min","min-h-[50vh]","min-w-0","min-w-56","minute","minutes","ml-1","moment","more","most","mr-1","ms","mt-1","mt-1.5","mt-2","mt-3","must","mutationFn","mx-auto","my","name","navigate","needle","needs","neutral","new","next","nickname","nickname_format","no","noChannel","nobody","none","noreferrer","not","nothing","noticed","now","nudge","null","number","of","off","offered","on","onChange","onCheckedChange","onClick","onConfirm","onError","onFocus","onMade","onOpenChange","onRemove","onRevoke","onSelect","onSuccess","onValueChange","on_server","once","one","ones","only","opacity-75","open","opens","or","order","other","our","out","outline","overflow-y-auto","overview","own","p-3","p-4","p-card","page","password","past","paste","patch","path","pb-2","people","permission","person","pick","picked","picks","pills","pl-4","place","place-items-center","placeholder","plain","points","portal","portrait","position","post","presets","press","primary","problems","profile","pt-1","public","publicRoutes","put","px-2.5","px-3","px-card","py-1","py-2","py-3","qc","queryFn","queryKey","r","ran","re","react","react-router","readOnly","redirect","redirect_uri","refresh","refuses","rel","remove","removed","replace","require_for_compliance","rest","retry","return","revoke","revoked","revoking","right","right-click","role","roleById","role_id","role_name","role_names","roles","roles_due","round","rounded","rounded-full","routes","rows","run","runCheck","running","runs","rx","ry","s","save","saving","search","second","secondary","secret","see","sees","select","send","sends","sent","server","server_url","set","setChannels","setCheck","setConfirmUnlink","setCreating","setError","setForm","setHours","setJoined","setLabel","setMade","setMaxUses","setOpen","setPicked","setQ","setRemove","setRevoking","setRole","setRows","setSecret","setSeen","setShowPast","setTab","setTarget","setToken","settings","setup","several","should","shouldn","showOwner","shown","shows","shrink-0","sign","sign-in","signing","signs","site","size","size-12","size-2.5","size-3","size-3.5","size-4","size-6","size-7","size-8","sm","sm:flex-row","sm:grid-cols-2","sm:grid-cols-3","sm:items-center","sm:p-8","so","some","someone","soon","space-y-1","space-y-3","space-y-4","space-y-5","space-y-6","src","st","stage","staleTime","stand","start","state","states","stats","status","stay","still","stop","stopped","stops","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","switch","switched","sync","synced_at","t","tab","take","taken","takes","target","target_id","temporary","text","text-[11px]","text-accent-ink","text-lg","text-muted","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xl","text-xs","that","the","their","them","then","there","these","they","think","this","those","through","title","to","toast","toggle","token","tone","tracking-[0.12em]","transparent","tried","true","truncate","turn","type","undefined","under","underline-offset-4","unlink","unlinked","until","untilText","up","updated","uppercase","url","use","useQuery","useQueryClient","useSearchParams","useStartLink","useState","used","used_up","user","username","uses","v","value","variant","ve","viewBox","viewable","voice","void","w-80","w-full","waiting","warning","was","wasn","were","weren","whatever","when","where","whether","which","while","who","whoever","whose","widgets","width","will","with","withdraw","withdrawn","within","without","work","working","works","x","xl:grid-cols-[1fr_340px]","xl:grid-cols-[1fr_360px]","xl:grid-cols-[1fr_380px]","xs","yet","you","your"];
