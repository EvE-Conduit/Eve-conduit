import { Alert as e, ApiError as t, Avatar as n, Badge as r, Button as i, Card as a, CardBody as o, CardFooter as s, CardHeader as c, ConfirmDialog as l, Dialog as u, DropdownContent as d, DropdownItem as f, DropdownMenu as p, DropdownSeparator as m, DropdownTrigger as h, EmptyState as g, Field as _, Input as v, PageHeader as y, PagedTable as b, SearchInput as x, Select as S, Skeleton as C, Spinner as w, StatCard as T, SwitchRow as E, THead as D, TabPanel as O, Table as k, TableToolbar as A, Tabs as ee, Td as j, Th as M, Tr as te, api as N, cn as P, definePlugin as ne, timeAgo as F, toast as I, useHasPerm as re } from "@conduit/sdk";
import { Link as L, useNavigate as ie, useParams as ae, useSearchParams as oe } from "react-router";
import { useMutation as R, useQuery as z, useQueryClient as B } from "@tanstack/react-query";
import { useEffect as se, useRef as ce, useState as V } from "react";
import { Fragment as H, jsx as U, jsxs as W } from "react/jsx-runtime";
//#region src/icons.tsx
function G({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ U("svg", {
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
var K = ({ className: e = "size-4" }) => /* @__PURE__ */ U("svg", {
	viewBox: "0 0 24 24",
	fill: "currentColor",
	className: e,
	"aria-hidden": !0,
	children: /* @__PURE__ */ U("path", { d: "M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14 14 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13 13 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03M8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418m7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418" })
}), le = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [
		/* @__PURE__ */ U("path", { d: "M20 7h-9" }),
		/* @__PURE__ */ U("path", { d: "M14 17H5" }),
		/* @__PURE__ */ U("circle", {
			cx: "17",
			cy: "17",
			r: "3"
		}),
		/* @__PURE__ */ U("circle", {
			cx: "7",
			cy: "7",
			r: "3"
		})
	]
}), q = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [
		/* @__PURE__ */ U("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ U("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ U("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ U("path", { d: "M8 16H3v5" })
	]
}), ue = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [
		/* @__PURE__ */ U("path", { d: "m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" }),
		/* @__PURE__ */ U("path", { d: "m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" }),
		/* @__PURE__ */ U("path", { d: "M8 2v3" }),
		/* @__PURE__ */ U("path", { d: "M2 8h3" }),
		/* @__PURE__ */ U("path", { d: "M16 22v-3" }),
		/* @__PURE__ */ U("path", { d: "M22 16h-3" })
	]
}), de = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [
		/* @__PURE__ */ U("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ U("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ U("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), fe = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [/* @__PURE__ */ U("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ U("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), pe = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [/* @__PURE__ */ U("path", { d: "M5 12h14" }), /* @__PURE__ */ U("path", { d: "M12 5v14" })]
}), me = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [
		/* @__PURE__ */ U("path", { d: "M3 6h18" }),
		/* @__PURE__ */ U("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ U("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), he = (e) => /* @__PURE__ */ U(G, {
	...e,
	children: /* @__PURE__ */ U("path", { d: "M20 6 9 17l-5-5" })
}), ge = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [/* @__PURE__ */ U("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ U("path", { d: "M19 12H5" })]
}), J = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [/* @__PURE__ */ U("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ U("polyline", { points: "12 6 12 12 16 14" })]
}), _e = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [/* @__PURE__ */ U("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ U("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })]
}), ve = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [/* @__PURE__ */ U("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ U("path", { d: "m4.9 4.9 14.2 14.2" })]
}), ye = (e) => /* @__PURE__ */ W(G, {
	...e,
	children: [
		/* @__PURE__ */ U("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
		/* @__PURE__ */ U("circle", {
			cx: "9",
			cy: "7",
			r: "4"
		}),
		/* @__PURE__ */ U("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
		/* @__PURE__ */ U("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
	]
}), Y = "/api/p/discord", be = "/api/public/p/discord", X = ["discord", "guests"], xe = [
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
function Z(e) {
	let t = new Date(e).getTime() - Date.now();
	if (t <= 0) return "ended";
	let n = Math.round(t / 6e4);
	if (n < 60) return `${n} min left`;
	let r = Math.floor(n / 60);
	return r < 48 ? `${r} h ${n % 60 ? `${n % 60} min ` : ""}left` : `${Math.round(r / 24)} days left`;
}
var Q = (e) => e.kind === "voice" || e.kind === "stage" ? `🔊 ${e.name}` : `#${e.name}`;
function Se(e, t) {
	navigator.clipboard.writeText(e).then(() => I.success(t), () => I.error("Couldn't copy; select the text instead"));
}
var Ce = {
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
}, we = (e) => e.status === "active" || e.status === "used_up";
function Te() {
	let t = B(), { data: n, isLoading: r } = z({
		queryKey: X,
		queryFn: () => N.get(`${Y}/guests`)
	}), [o, s] = V(!1), [c, u] = V(null), [d, f] = V(null), [p, m] = V(null), [h, _] = V(!1), [b, x] = V("links"), S = R({
		mutationFn: (e) => N.delete(`${Y}/guests/${e}`),
		onSuccess: (e) => {
			e.waiting ? I.warning(`Link withdrawn. For ${e.waiting} guest${e.waiting === 1 ? "" : "s"} Discord couldn't be reached yet; that is tried again every couple of minutes.`) : I.success(n?.end_action === "kick" ? "Link withdrawn and its guests removed from the server" : "Link withdrawn; its guests lost their access"), t.invalidateQueries({ queryKey: X });
		},
		onError: (e) => I.error(e.message)
	}), w = n?.links ?? [], T = w.filter(we), E = w.filter((e) => !we(e)), D = (e) => e.guests.filter((e) => !e.ended_at).length;
	return /* @__PURE__ */ W(H, { children: [
		/* @__PURE__ */ U(y, {
			eyebrow: /* @__PURE__ */ W(L, {
				to: "/p/discord",
				className: "inline-flex items-center gap-1 hover:text-text",
				children: [/* @__PURE__ */ U(ge, { className: "size-3" }), " Discord"]
			}),
			title: "Temporary access",
			icon: /* @__PURE__ */ U(J, {}),
			description: "Hand a link to people without an account here: diplomats, guests on a fleet, a recruit. They sign in with Discord and get access to the server until the link runs out.",
			actions: n?.enabled ? /* @__PURE__ */ W(i, {
				variant: "primary",
				onClick: () => s(!0),
				children: [/* @__PURE__ */ U(pe, {}), " New link"]
			}) : void 0
		}),
		r || !n ? /* @__PURE__ */ U(C, { className: "h-64" }) : n.enabled ? /* @__PURE__ */ W(ee, {
			variant: "pills",
			value: b,
			onValueChange: x,
			className: "space-y-4",
			items: [{
				value: "links",
				label: "Links",
				count: T.length
			}, {
				value: "history",
				label: "History"
			}],
			children: [/* @__PURE__ */ U(O, {
				value: "history",
				children: /* @__PURE__ */ U(Me, { showOwner: n.can_manage })
			}), /* @__PURE__ */ U(O, {
				value: "links",
				children: /* @__PURE__ */ W("div", {
					className: "space-y-6",
					children: [
						/* @__PURE__ */ U("p", {
							className: "text-sm text-muted",
							children: n.end_action === "kick" ? "When a link ends, the people who joined through it are removed from the server. Anyone who was on the server before only loses their access." : n.kept_role ? `When a link ends, its guests lose @${n.role} and their channels. They stay on the server with @${n.kept_role}.` : "When a link ends, its guests lose the guest role and stay on the server."
						}),
						c && /* @__PURE__ */ U(e, {
							tone: "success",
							title: "Link made. Send it to your guests.",
							action: /* @__PURE__ */ U(i, {
								size: "sm",
								variant: "ghost",
								onClick: () => u(null),
								children: "Done"
							}),
							children: /* @__PURE__ */ W("div", {
								className: "mt-2 flex items-stretch",
								children: [/* @__PURE__ */ U(v, {
									readOnly: !0,
									value: c.url,
									className: "font-mono text-xs",
									onFocus: (e) => e.target.select()
								}), /* @__PURE__ */ U(i, {
									variant: "secondary",
									size: "icon",
									"aria-label": "Copy link",
									onClick: () => Se(c.url, "Link copied"),
									children: /* @__PURE__ */ U(fe, {})
								})]
							})
						}),
						T.length === 0 ? /* @__PURE__ */ U(a, { children: /* @__PURE__ */ U(g, {
							icon: /* @__PURE__ */ U(_e, {}),
							title: "No active links",
							description: `Make one and send it to whoever needs to be on ${n.server || "the server"} for a while.`,
							action: /* @__PURE__ */ W(i, {
								variant: "primary",
								onClick: () => s(!0),
								children: [/* @__PURE__ */ U(pe, {}), " New link"]
							})
						}) }) : /* @__PURE__ */ U("div", {
							className: "grid gap-4 lg:grid-cols-2",
							children: T.map((e) => /* @__PURE__ */ U(Ee, {
								link: e,
								showOwner: n.can_manage,
								onRevoke: () => f(e),
								onExtend: () => m(e)
							}, e.id))
						}),
						E.length > 0 && /* @__PURE__ */ W("div", { children: [/* @__PURE__ */ W("button", {
							type: "button",
							className: "text-sm text-muted hover:text-text",
							onClick: () => _((e) => !e),
							children: [
								h ? "Hide" : "Show",
								" ",
								E.length,
								" past link",
								E.length === 1 ? "" : "s"
							]
						}), h && /* @__PURE__ */ U("div", {
							className: "mt-3 grid gap-4 lg:grid-cols-2",
							children: E.map((e) => /* @__PURE__ */ U(Ee, {
								link: e,
								showOwner: n.can_manage
							}, e.id))
						})] })
					]
				})
			})]
		}) : /* @__PURE__ */ U(a, { children: /* @__PURE__ */ U(g, {
			icon: /* @__PURE__ */ U(J, {}),
			title: "Temporary access is switched off",
			description: "A Discord manager can switch it on and choose the roles for guests under Server setup."
		}) }),
		n && p && /* @__PURE__ */ U(je, {
			link: p,
			maxHours: n.max_hours,
			onClose: () => m(null),
			onDone: () => {
				m(null), t.invalidateQueries({ queryKey: X });
			}
		}),
		n && /* @__PURE__ */ U(ke, {
			open: o,
			onOpenChange: s,
			overview: n,
			onMade: (e) => {
				u(e), s(!1), t.invalidateQueries({ queryKey: X });
			}
		}),
		/* @__PURE__ */ U(l, {
			open: !!d,
			onOpenChange: (e) => !e && f(null),
			title: `Withdraw "${d?.label}"?`,
			description: d && D(d) ? `The link stops working and the ${D(d)} guest${D(d) === 1 ? "" : "s"} it let in ${n?.end_action === "kick" ? D(d) === 1 ? "is removed from the server" : "are removed from the server" : D(d) === 1 ? "loses access" : "lose access"} now.` : "The link stops working. Nobody has guest access through it.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ W(H, { children: [/* @__PURE__ */ U(ve, {}), " Withdraw"] }),
			onConfirm: () => d && S.mutateAsync(d.id)
		})
	] });
}
function Ee({ link: e, showOwner: t, onRevoke: n, onExtend: s }) {
	let l = B(), [u, d] = V(!1), f = R({
		mutationFn: (e) => N.delete(`${Y}/guests/users/${e}`),
		onSuccess: () => {
			I.success("Their guest access has ended"), l.invalidateQueries({ queryKey: X });
		},
		onError: (e) => I.error(e.message)
	}), p = we(e), m = Ce[e.status];
	return /* @__PURE__ */ W(a, {
		className: P(!p && "opacity-75"),
		children: [/* @__PURE__ */ U(c, {
			title: /* @__PURE__ */ W("span", {
				className: "flex items-center gap-2",
				children: [
					e.label,
					" ",
					/* @__PURE__ */ U(r, {
						tone: m.tone,
						children: m.label
					})
				]
			}),
			description: /* @__PURE__ */ W(H, { children: [
				p ? Z(e.expires_at) : `ended ${F(e.ended_at)}`,
				" · ",
				e.uses,
				e.max_uses ? ` of ${e.max_uses}` : "",
				" used",
				t && e.created_by ? ` · by ${e.created_by.name}` : ""
			] }),
			actions: /* @__PURE__ */ W("div", {
				className: "flex gap-1",
				children: [
					e.status === "active" && /* @__PURE__ */ W(i, {
						variant: "ghost",
						size: "sm",
						onClick: () => Se(e.url, "Link copied"),
						children: [/* @__PURE__ */ U(fe, {}), " Copy link"]
					}),
					p && s && /* @__PURE__ */ W(i, {
						variant: "ghost",
						size: "sm",
						onClick: s,
						children: [/* @__PURE__ */ U(J, {}), " Extend"]
					}),
					p && n && /* @__PURE__ */ W(i, {
						variant: "ghost",
						size: "sm",
						onClick: n,
						children: [/* @__PURE__ */ U(ve, {}), " Withdraw"]
					})
				]
			})
		}), /* @__PURE__ */ W(o, {
			className: "space-y-3",
			children: [/* @__PURE__ */ W("div", {
				className: "flex flex-wrap items-center gap-1.5 text-xs text-muted",
				children: [
					"Guests get ",
					/* @__PURE__ */ W(r, {
						tone: "accent",
						children: ["@", e.role]
					}),
					e.channels.length > 0 && /* @__PURE__ */ W(H, { children: ["and see only ", e.channels.map((e) => /* @__PURE__ */ U(r, {
						tone: "neutral",
						children: Q(e)
					}, e.id))] })
				]
			}), e.guests.length === 0 ? /* @__PURE__ */ U("p", {
				className: "text-sm text-subtle",
				children: "Nobody has used it yet."
			}) : /* @__PURE__ */ W(H, { children: [/* @__PURE__ */ W("button", {
				type: "button",
				className: "inline-flex items-center gap-1.5 text-sm text-accent-ink hover:underline",
				onClick: () => d((e) => !e),
				children: [
					/* @__PURE__ */ U(ye, { className: "size-3.5" }),
					" ",
					e.guests.length,
					" guest",
					e.guests.length === 1 ? "" : "s"
				]
			}), u && /* @__PURE__ */ U("ul", {
				className: "divide-y divide-border border border-border text-sm",
				children: e.guests.map((e) => /* @__PURE__ */ U(Oe, {
					guest: e,
					onRemove: e.ended_at ? void 0 : () => f.mutate(e.id)
				}, e.id))
			})] })]
		})]
	});
}
var De = {
	expired: "ended when the link ran out",
	revoked: "ended with the link",
	removed: "ended by hand",
	creator_lost: "ended: the link's maker lost access",
	member: "a member here now"
};
function Oe({ guest: e, onRemove: t }) {
	return /* @__PURE__ */ W("li", {
		className: "flex items-center gap-3 px-3 py-2",
		children: [
			/* @__PURE__ */ U(n, {
				src: e.avatar,
				name: e.username,
				size: "sm"
			}),
			/* @__PURE__ */ W("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ U("div", {
					className: "truncate font-medium",
					children: e.username
				}), /* @__PURE__ */ W("div", {
					className: "truncate text-xs text-subtle",
					children: [
						"joined ",
						F(e.joined_at),
						e.ended_at ? ` · ${De[e.ended_reason] ?? "left"}` : "",
						e.error ? ` · couldn't be ended yet: ${e.error}` : ""
					]
				})]
			}),
			e.ended_at ? /* @__PURE__ */ U(r, {
				tone: e.ended_reason === "member" ? "success" : "neutral",
				children: e.ended_reason === "member" ? "member" : "ended"
			}) : t ? /* @__PURE__ */ W(i, {
				variant: "ghost",
				size: "xs",
				onClick: t,
				children: [/* @__PURE__ */ U(ve, {}), " End access"]
			}) : null
		]
	});
}
function ke({ open: e, onOpenChange: t, overview: n, onMade: r }) {
	let [a, o] = V(""), [s, c] = V(String(Math.min(4, n.max_hours))), [l, d] = V(""), [f, p] = V(null), m = f ?? n.channels.map((e) => e.id), h = (e) => p(m.includes(e) ? m.filter((t) => t !== e) : [...m, e]), g = R({
		mutationFn: () => N.post(`${Y}/guests`, {
			label: a.trim(),
			hours: Number(s),
			max_uses: Number(l) || 0,
			channels: n.channels.length ? m : void 0
		}),
		onSuccess: (e) => {
			r(e), o(""), d(""), p(null);
		},
		onError: (e) => I.error(e.message)
	}), y = n.channels.length > 0 && m.length === 0, b = xe.filter((e) => e <= n.max_hours);
	return b.includes(n.max_hours) || b.push(n.max_hours), /* @__PURE__ */ U(u, {
		open: e,
		onOpenChange: t,
		title: "New temporary link",
		description: `Whoever opens it can join ${n.server || "the Discord server"} with the @${n.role} role for as long as the link lasts.`,
		footer: /* @__PURE__ */ W(H, { children: [/* @__PURE__ */ U(i, {
			variant: "ghost",
			onClick: () => t(!1),
			children: "Cancel"
		}), /* @__PURE__ */ W(i, {
			variant: "primary",
			loading: g.isPending,
			disabled: !a.trim() || y,
			onClick: () => g.mutate(),
			children: [/* @__PURE__ */ U(_e, {}), " Make link"]
		})] }),
		children: /* @__PURE__ */ W("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ U(_, {
					label: "What it's for",
					hint: "Shown to the guests, and to you in the list.",
					children: /* @__PURE__ */ U(v, {
						autoFocus: !0,
						value: a,
						onChange: (e) => o(e.target.value),
						maxLength: 100,
						placeholder: "Diplo meeting Saturday"
					})
				}),
				/* @__PURE__ */ W("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ U(_, {
						label: "Lasts",
						hint: `At most ${n.max_hours} hours. You can extend it while it runs.`,
						children: /* @__PURE__ */ U(S, {
							value: s,
							onChange: (e) => c(e.target.value),
							children: b.map((e) => /* @__PURE__ */ U("option", {
								value: e,
								children: Ae(e)
							}, e))
						})
					}), /* @__PURE__ */ U(_, {
						label: "Uses",
						hint: "How many people may use it; empty for no limit.",
						children: /* @__PURE__ */ U(v, {
							type: "number",
							min: 0,
							value: l,
							onChange: (e) => d(e.target.value),
							placeholder: "no limit"
						})
					})]
				}),
				n.channels.length > 0 && /* @__PURE__ */ U(_, {
					label: "Channels these guests see",
					hint: y ? "Choose at least one." : "They see these and nothing else on the server.",
					children: /* @__PURE__ */ U("div", {
						className: "flex flex-wrap gap-1.5",
						children: n.channels.map((e) => /* @__PURE__ */ U("button", {
							type: "button",
							"aria-pressed": m.includes(e.id),
							onClick: () => h(e.id),
							className: P("border px-2.5 py-1 text-xs", m.includes(e.id) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:border-border-strong"),
							children: Q(e)
						}, e.id))
					})
				})
			]
		})
	});
}
var Ae = (e) => e < 24 ? `${e} hour${e === 1 ? "" : "s"}` : `${e / 24} day${e === 24 ? "" : "s"}`;
function je({ link: t, maxHours: n, onClose: r, onDone: a }) {
	let o = Math.max(0, (new Date(t.expires_at).getTime() - Date.now()) / 36e5), s = Math.floor(n - o), c = xe.filter((e) => e <= s), [l, d] = V(String(c[0] ?? "")), f = R({
		mutationFn: () => N.post(`${Y}/guests/${t.id}/extend`, { hours: Number(l) }),
		onSuccess: (e) => {
			I.success(`"${e.label}" now runs until ${new Date(e.expires_at).toLocaleString()}`), a();
		},
		onError: (e) => I.error(e.message)
	});
	return /* @__PURE__ */ U(u, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: `Extend "${t.label}"`,
		description: `It has ${Z(t.expires_at)}. Its guests keep their access for the extra time.`,
		footer: /* @__PURE__ */ W(H, { children: [/* @__PURE__ */ U(i, {
			variant: "ghost",
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ W(i, {
			variant: "primary",
			loading: f.isPending,
			disabled: !c.length,
			onClick: () => f.mutate(),
			children: [/* @__PURE__ */ U(J, {}), " Extend"]
		})] }),
		children: c.length ? /* @__PURE__ */ U(_, {
			label: "Add",
			hint: `A link may run at most ${n} hours from now.`,
			children: /* @__PURE__ */ U(S, {
				value: l,
				onChange: (e) => d(e.target.value),
				children: c.map((e) => /* @__PURE__ */ U("option", {
					value: e,
					children: Ae(e)
				}, e))
			})
		}) : /* @__PURE__ */ W(e, {
			tone: "info",
			title: "It already runs as long as a link may",
			children: [
				"Links may run at most ",
				n,
				" hours from now. Try again later, or make a new link when this one ends."
			]
		})
	});
}
function Me({ showOwner: e }) {
	let [t, i] = V(""), o = [
		{
			header: "Guest",
			cell: (e) => /* @__PURE__ */ W("div", {
				className: "flex min-w-0 items-center gap-2",
				children: [/* @__PURE__ */ U(n, {
					src: e.avatar,
					name: e.username,
					size: "sm"
				}), /* @__PURE__ */ W("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ U("div", {
						className: "truncate font-medium",
						children: e.username
					}), /* @__PURE__ */ U("div", {
						className: "truncate font-mono text-xs text-subtle",
						children: e.discord_id
					})]
				})]
			})
		},
		{
			header: "Link",
			cell: (e) => /* @__PURE__ */ W("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ U("div", {
					className: "truncate",
					children: e.link.label
				}), /* @__PURE__ */ W("div", {
					className: "truncate text-xs text-subtle",
					children: [
						"@",
						e.link.role,
						e.link.channels.length ? ` · ${e.link.channels.map(Q).join(" ")}` : ""
					]
				})]
			})
		},
		...e ? [{
			header: "Invited by",
			cell: (e) => e.invited_by ?? /* @__PURE__ */ U("span", {
				className: "text-subtle",
				children: "deleted account"
			})
		}] : [],
		{
			header: "Joined",
			cell: (e) => /* @__PURE__ */ U("span", {
				title: new Date(e.joined_at).toLocaleString(),
				children: F(e.joined_at)
			})
		},
		{
			header: "Access",
			cell: (e) => e.ended_at ? /* @__PURE__ */ W("span", {
				className: "text-muted",
				title: new Date(e.ended_at).toLocaleString(),
				children: [
					De[e.ended_reason] ?? "ended",
					" ",
					F(e.ended_at)
				]
			}) : /* @__PURE__ */ U(r, {
				tone: "success",
				children: Z(e.link.expires_at)
			})
		}
	];
	return /* @__PURE__ */ W(a, { children: [/* @__PURE__ */ U(c, {
		title: "Who came through a link",
		description: e ? "Every guest of every link, newest first." : "The guests of your links, newest first.",
		actions: /* @__PURE__ */ U(x, {
			value: t,
			onChange: (e) => i(e.target.value),
			placeholder: "Discord name or id, link, who invited",
			className: "w-72"
		})
	}), /* @__PURE__ */ U(b, {
		url: `${Y}/guests/history`,
		params: t.trim() ? `q=${encodeURIComponent(t.trim())}` : "",
		columns: o,
		rowKey: (e) => e.id,
		empty: {
			icon: /* @__PURE__ */ U(K, {}),
			title: t.trim() ? "Nobody matches" : "Nobody has come through a link yet",
			description: t.trim() ? "Try another name or link." : void 0
		}
	})] });
}
//#endregion
//#region src/admin.tsx
var $ = ["discord", "admin"];
function Ne() {
	let { data: e, isLoading: t } = z({
		queryKey: $,
		queryFn: () => N.get(`${Y}/admin`)
	}), [n, r] = V(null), i = n ?? (e?.settings.configured ? "roles" : "setup");
	return /* @__PURE__ */ W(H, { children: [/* @__PURE__ */ U(y, {
		eyebrow: /* @__PURE__ */ W(L, {
			to: "/p/discord",
			className: "inline-flex items-center gap-1 hover:text-text",
			children: [/* @__PURE__ */ U(ge, { className: "size-3" }), " Discord"]
		}),
		title: "Server setup",
		icon: /* @__PURE__ */ U(K, {}),
		description: "Connect your Discord server, choose which groups and states get which roles, and keep an eye on linked members.",
		actions: e?.settings.configured ? /* @__PURE__ */ U(Pe, {}) : void 0
	}), t || !e ? /* @__PURE__ */ U(C, { className: "h-96" }) : /* @__PURE__ */ W("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ W("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ U(T, {
					label: "Server",
					value: e.settings.guild_name || (e.settings.configured ? "Not checked yet" : "Not connected"),
					tone: e.settings.configured ? "success" : "warning"
				}),
				/* @__PURE__ */ U(T, {
					label: "Linked members",
					value: e.stats.linked,
					hint: e.settings.last_full_sync ? `full sync ${F(e.settings.last_full_sync)}` : "every 6 hours, and on every change"
				}),
				/* @__PURE__ */ U(T, {
					label: "Sync problems",
					value: e.stats.errors,
					tone: e.stats.errors ? "warning" : void 0,
					hint: "see Members"
				})
			]
		}), /* @__PURE__ */ W(ee, {
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
				/* @__PURE__ */ U(O, {
					value: "setup",
					children: /* @__PURE__ */ U(Le, { data: e })
				}),
				/* @__PURE__ */ U(O, {
					value: "roles",
					children: /* @__PURE__ */ U(Re, { data: e })
				}),
				/* @__PURE__ */ U(O, {
					value: "members",
					children: /* @__PURE__ */ U(Be, {})
				}),
				/* @__PURE__ */ U(O, {
					value: "guests",
					children: /* @__PURE__ */ U(ze, { data: e })
				})
			]
		})]
	})] });
}
function Pe() {
	let e = B(), t = R({
		mutationFn: () => N.post(`${Y}/admin/sync`),
		onSuccess: () => {
			I.success("Syncing everyone's roles; this takes a moment with many members"), setTimeout(() => e.invalidateQueries({ queryKey: ["discord"] }), 4e3);
		},
		onError: (e) => I.error(e.message)
	});
	return /* @__PURE__ */ W(i, {
		loading: t.isPending,
		onClick: () => t.mutate(),
		children: [/* @__PURE__ */ U(q, {}), " Sync everyone"]
	});
}
function Fe({ value: e }) {
	return /* @__PURE__ */ W("div", {
		className: "flex items-stretch",
		children: [/* @__PURE__ */ U(v, {
			readOnly: !0,
			value: e,
			className: "font-mono text-xs",
			onFocus: (e) => e.target.select()
		}), /* @__PURE__ */ U(i, {
			variant: "secondary",
			size: "icon",
			"aria-label": "Copy",
			onClick: () => navigator.clipboard.writeText(e).then(() => I.success("Copied"), () => I.error("Couldn't copy; select the text instead")),
			children: /* @__PURE__ */ U(fe, {})
		})]
	});
}
function Ie({ n: e, title: t, done: n, children: r }) {
	return /* @__PURE__ */ W("li", {
		className: "grid grid-cols-[32px_1fr] gap-4",
		children: [/* @__PURE__ */ U("span", {
			className: P("grid size-8 place-items-center border font-mono text-sm", n ? "border-success/40 bg-success-soft text-success-fg" : "border-border-strong text-muted"),
			children: n ? /* @__PURE__ */ U(he, {}) : e
		}), /* @__PURE__ */ W("div", {
			className: "min-w-0 space-y-3 pb-2",
			children: [/* @__PURE__ */ U("div", {
				className: "pt-1 font-medium",
				children: t
			}), r]
		})]
	});
}
function Le({ data: t }) {
	let n = B(), r = t.settings, [l, u] = V({
		client_id: r.client_id,
		guild_id: r.guild_id,
		nickname_format: r.nickname_format,
		kick_without_access: r.kick_without_access,
		require_for_compliance: r.require_for_compliance
	}), [d, f] = V(""), [p, m] = V(""), [h, g] = V(null), y = R({
		mutationFn: () => N.put(`${Y}/admin/settings`, {
			...l,
			client_secret: d || null,
			bot_token: p || null
		}),
		onSuccess: (e) => {
			n.setQueryData($, e), n.invalidateQueries({ queryKey: ["discord", "me"] }), f(""), m(""), I.success("Saved");
		},
		onError: (e) => I.error(e.message)
	}), b = R({
		mutationFn: () => N.post(`${Y}/admin/check`),
		onSuccess: (e) => {
			g(e), n.setQueryData(["discord", "check"], e), n.invalidateQueries({ queryKey: $ });
		},
		onError: (e) => {
			g(null), I.error(e.message);
		}
	}), x = (e) => u((t) => ({
		...t,
		...e
	}));
	return /* @__PURE__ */ W("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_380px]",
		children: [/* @__PURE__ */ W(a, { children: [/* @__PURE__ */ U(o, { children: /* @__PURE__ */ W("ol", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ W(Ie, {
					n: 1,
					title: "Create a Discord application",
					done: !!r.client_id && r.client_secret_set,
					children: [
						/* @__PURE__ */ W("p", {
							className: "text-sm text-muted",
							children: [
								"Open the",
								" ",
								/* @__PURE__ */ U("a", {
									href: "https://discord.com/developers/applications",
									target: "_blank",
									rel: "noreferrer",
									className: "text-accent-ink underline-offset-4 hover:underline",
									children: "Discord developer portal"
								}),
								" ",
								"and press ",
								/* @__PURE__ */ U("b", { children: "New Application" }),
								". On its ",
								/* @__PURE__ */ U("b", { children: "OAuth2" }),
								" page, add this redirect and copy the client id and secret here."
							]
						}),
						/* @__PURE__ */ U(_, {
							label: "Redirect",
							children: /* @__PURE__ */ U(Fe, { value: t.redirect_uri })
						}),
						/* @__PURE__ */ W("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ U(_, {
								label: "Client id",
								children: /* @__PURE__ */ U(v, {
									value: l.client_id,
									onChange: (e) => x({ client_id: e.target.value }),
									placeholder: "1234567890123456789",
									className: "font-mono"
								})
							}), /* @__PURE__ */ U(_, {
								label: "Client secret",
								hint: r.client_secret_set ? "Saved. Type a new one to replace it." : void 0,
								children: /* @__PURE__ */ U(v, {
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
				/* @__PURE__ */ W(Ie, {
					n: 2,
					title: "Add the bot to your server",
					done: r.bot_token_set && !!r.guild_id,
					children: [
						/* @__PURE__ */ W("p", {
							className: "text-sm text-muted",
							children: [
								"On the application's ",
								/* @__PURE__ */ U("b", { children: "Bot" }),
								" page press ",
								/* @__PURE__ */ U("b", { children: "Reset Token" }),
								" and paste it here. For the server id, turn on Developer Mode in Discord (Settings → Advanced), then right-click the server → ",
								/* @__PURE__ */ U("b", { children: "Copy Server ID" }),
								"."
							]
						}),
						/* @__PURE__ */ W("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ U(_, {
								label: "Bot token",
								hint: r.bot_token_set ? "Saved. Paste a new one to replace it." : void 0,
								children: /* @__PURE__ */ U(v, {
									type: "password",
									autoComplete: "off",
									value: p,
									onChange: (e) => m(e.target.value),
									placeholder: r.bot_token_set ? "••••••••••••" : "",
									className: "font-mono"
								})
							}), /* @__PURE__ */ U(_, {
								label: "Server id",
								children: /* @__PURE__ */ U(v, {
									value: l.guild_id,
									onChange: (e) => x({ guild_id: e.target.value }),
									placeholder: "1234567890123456789",
									className: "font-mono"
								})
							})]
						}),
						t.invite_url ? /* @__PURE__ */ U("a", {
							href: t.invite_url,
							target: "_blank",
							rel: "noreferrer",
							children: /* @__PURE__ */ W(i, {
								variant: "outline",
								children: [/* @__PURE__ */ U(K, {}), " Invite the bot to the server"]
							})
						}) : /* @__PURE__ */ U("p", {
							className: "text-xs text-subtle",
							children: "Save the client id to get the link that invites the bot."
						}),
						/* @__PURE__ */ U("p", {
							className: "text-xs text-subtle",
							children: "It asks for Manage Roles, Manage Nicknames, Create Invite and Kick Members. Afterwards drag the bot's role above every role it should give (Server Settings → Roles)."
						})
					]
				}),
				/* @__PURE__ */ W(Ie, {
					n: 3,
					title: "Choose how members appear",
					done: r.configured,
					children: [/* @__PURE__ */ U(_, {
						label: "Nickname",
						hint: /* @__PURE__ */ W(H, { children: [
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
						children: /* @__PURE__ */ U(v, {
							value: l.nickname_format,
							onChange: (e) => x({ nickname_format: e.target.value }),
							placeholder: "[{corp_ticker}] {character}",
							className: "max-w-sm font-mono"
						})
					}), /* @__PURE__ */ W("div", {
						className: "border border-border px-3",
						children: [/* @__PURE__ */ U(E, {
							label: "Remove people who lose access from the server",
							description: "Off: they only lose the roles this site gave them. On: they're kicked and have to link again once they have access.",
							checked: l.kick_without_access,
							onCheckedChange: (e) => x({ kick_without_access: e })
						}), /* @__PURE__ */ U(E, {
							label: "Must be on the Discord server to be compliant",
							description: "Members who may link Discord count as not compliant until they've linked it and while they're not on the server (Administration → Compliance, and the Compliant group rule). Leaving is noticed at the next sync, at most 6 hours later.",
							checked: l.require_for_compliance,
							onCheckedChange: (e) => x({ require_for_compliance: e })
						})]
					})]
				})
			]
		}) }), /* @__PURE__ */ U(s, { children: /* @__PURE__ */ U(i, {
			variant: "primary",
			loading: y.isPending,
			onClick: () => y.mutate(),
			children: "Save"
		}) })] }), /* @__PURE__ */ W(a, {
			className: "h-fit",
			children: [/* @__PURE__ */ U(c, {
				title: "Connection",
				description: "Asks Discord whether everything is in place."
			}), /* @__PURE__ */ W(o, {
				className: "space-y-4",
				children: [h ? /* @__PURE__ */ W(H, { children: [/* @__PURE__ */ W("div", {
					className: "flex items-center gap-3",
					children: [h.guild.icon ? /* @__PURE__ */ U("img", {
						src: h.guild.icon,
						alt: "",
						className: "size-12"
					}) : /* @__PURE__ */ U("span", {
						className: "grid size-12 place-items-center bg-accent-soft text-accent-ink",
						children: /* @__PURE__ */ U(K, { className: "size-6" })
					}), /* @__PURE__ */ W("div", { children: [/* @__PURE__ */ U("div", {
						className: "font-medium",
						children: h.guild.name
					}), /* @__PURE__ */ W("div", {
						className: "text-xs text-subtle",
						children: [
							"bot: ",
							h.bot.name,
							" ",
							h.bot.on_server ? "· on the server" : "· not on the server"
						]
					})] })]
				}), h.problems.length === 0 ? /* @__PURE__ */ U(e, {
					tone: "success",
					title: "All good",
					children: "The bot can add members, give the mapped roles and set nicknames."
				}) : /* @__PURE__ */ U(e, {
					tone: "warning",
					title: `${h.problems.length} thing${h.problems.length === 1 ? "" : "s"} to fix`,
					children: /* @__PURE__ */ U("ul", {
						className: "list-disc space-y-1 pl-4",
						children: h.problems.map((e) => /* @__PURE__ */ U("li", { children: e }, e))
					})
				})] }) : /* @__PURE__ */ U("p", {
					className: "text-sm text-muted",
					children: r.bot_token_set && r.guild_id ? "Not checked yet." : "Save the bot token and server id first."
				}), /* @__PURE__ */ W(i, {
					className: "w-full",
					disabled: !r.bot_token_set || !r.guild_id,
					loading: b.isPending,
					onClick: () => b.mutate(),
					children: [/* @__PURE__ */ U(q, {}), " Check connection"]
				})]
			})]
		})]
	});
}
function Re({ data: t }) {
	let n = B(), { data: l, isLoading: u, error: d } = z({
		queryKey: ["discord", "check"],
		queryFn: () => N.post(`${Y}/admin/check`),
		staleTime: 6e4,
		retry: !1
	}), [f, p] = V(null), m = f ?? t.mappings, [h, v] = V(""), [y, b] = V(""), x = R({
		mutationFn: (e) => N.put(`${Y}/admin/mappings`, { mappings: e }),
		onSuccess: (e) => {
			n.setQueryData($, e), p(null), I.success("Saved; everyone's roles are being updated");
		},
		onError: (e) => I.error(e.message)
	}), C = l?.roles ?? [], w = Object.fromEntries(C.map((e) => [e.id, e]));
	return /* @__PURE__ */ W("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_340px]",
		children: [/* @__PURE__ */ W(a, { children: [
			/* @__PURE__ */ U(c, {
				title: "Who gets which role",
				description: "Members of a group, or everyone in a state, get the role. A person can match several rows."
			}),
			d ? /* @__PURE__ */ U(o, { children: /* @__PURE__ */ U(e, {
				tone: "warning",
				title: "Couldn't load the server's roles",
				children: d.message
			}) }) : /* @__PURE__ */ U(o, {
				className: "border-b border-border",
				children: /* @__PURE__ */ W("div", {
					className: "flex flex-wrap items-end gap-3",
					children: [
						/* @__PURE__ */ U(_, {
							label: "Group or state",
							className: "min-w-56 flex-1",
							children: /* @__PURE__ */ W(S, {
								value: h,
								onChange: (e) => v(e.target.value),
								children: [
									/* @__PURE__ */ U("option", {
										value: "",
										children: "Choose…"
									}),
									/* @__PURE__ */ U("optgroup", {
										label: "States",
										children: t.states.map((e) => /* @__PURE__ */ U("option", {
											value: `state:${e.id}`,
											children: e.name
										}, `s${e.id}`))
									}),
									/* @__PURE__ */ U("optgroup", {
										label: "Groups",
										children: t.groups.map((e) => /* @__PURE__ */ U("option", {
											value: `group:${e.id}`,
											children: e.name
										}, `g${e.id}`))
									})
								]
							})
						}),
						/* @__PURE__ */ U(_, {
							label: "Discord role",
							className: "min-w-56 flex-1",
							children: /* @__PURE__ */ W(S, {
								value: y,
								onChange: (e) => b(e.target.value),
								disabled: u,
								children: [/* @__PURE__ */ U("option", {
									value: "",
									children: u ? "Loading roles…" : "Choose…"
								}), C.map((e) => /* @__PURE__ */ W("option", {
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
						/* @__PURE__ */ W(i, {
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
							children: [/* @__PURE__ */ U(pe, {}), " Add"]
						})
					]
				})
			}),
			m.length === 0 ? /* @__PURE__ */ U(g, {
				icon: /* @__PURE__ */ U(K, {}),
				title: "No roles mapped yet",
				description: "Linked members join the server without any roles until you add some."
			}) : /* @__PURE__ */ U("ul", {
				className: "divide-y divide-border",
				children: m.map((e, t) => {
					let n = w[e.role_id];
					return /* @__PURE__ */ W("li", {
						className: "flex items-center gap-3 px-card py-3 text-sm",
						children: [
							/* @__PURE__ */ U(r, {
								tone: e.kind === "state" ? "info" : "neutral",
								children: e.kind
							}),
							/* @__PURE__ */ U("span", {
								className: "min-w-0 flex-1 truncate font-medium",
								children: e.target
							}),
							/* @__PURE__ */ U("span", {
								className: "text-subtle",
								children: "→"
							}),
							/* @__PURE__ */ W("span", {
								className: "flex min-w-0 flex-1 items-center gap-2",
								children: [
									/* @__PURE__ */ U("span", {
										className: "size-2.5 shrink-0 rounded-full border border-border",
										style: { background: n?.color ?? "transparent" }
									}),
									/* @__PURE__ */ W("span", {
										className: "truncate",
										children: ["@", n?.name ?? e.role_name ?? e.role_id]
									}),
									l && !n && /* @__PURE__ */ U(r, {
										tone: "danger",
										children: "deleted"
									}),
									n && !n.assignable && /* @__PURE__ */ U(r, {
										tone: "warning",
										children: "above the bot"
									})
								]
							}),
							/* @__PURE__ */ U(i, {
								variant: "ghost",
								size: "icon-xs",
								"aria-label": "Remove",
								onClick: () => p(m.filter((e, n) => n !== t)),
								children: /* @__PURE__ */ U(me, {})
							})
						]
					}, `${e.kind}-${e.target_id}-${e.role_id}`);
				})
			}),
			f && /* @__PURE__ */ W(s, {
				className: "justify-between",
				children: [/* @__PURE__ */ U("span", {
					className: "text-xs text-muted",
					children: "Unsaved changes"
				}), /* @__PURE__ */ W("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ U(i, {
						variant: "ghost",
						onClick: () => p(null),
						children: "Discard"
					}), /* @__PURE__ */ U(i, {
						variant: "primary",
						loading: x.isPending,
						onClick: () => x.mutate(m),
						children: "Save and sync"
					})]
				})]
			})
		] }), /* @__PURE__ */ W(a, {
			className: "h-fit",
			children: [/* @__PURE__ */ U(c, { title: "How roles are kept" }), /* @__PURE__ */ W(o, {
				className: "space-y-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ U("p", { children: "Roles change as soon as someone joins or leaves a group, their state changes or they pick another main, and everyone is checked again every 6 hours." }),
					/* @__PURE__ */ U("p", { children: "Only mapped roles are touched. Roles you give by hand on Discord stay." }),
					/* @__PURE__ */ U("p", { children: "The bot can only give roles below its own; drag its role up in Server Settings → Roles if a role shows \"above the bot\"." })
				]
			})]
		})]
	});
}
function ze({ data: t }) {
	let n = B(), r = t.settings, { data: l, isLoading: u, error: d } = z({
		queryKey: ["discord", "check"],
		queryFn: () => N.post(`${Y}/admin/check`),
		staleTime: 6e4,
		retry: !1
	}), [f, p] = V({
		enabled: r.guest_enabled,
		role_id: r.guest_role_id,
		temp_role_id: r.guest_temp_role_id,
		max_hours: String(r.guest_max_hours),
		end_action: r.guest_end_action,
		nickname_format: r.guest_nickname_format
	}), [m, h] = V([]), [g, y] = V(r.guest_channels.map((e) => e.id)), [b, x] = V([]), w = z({
		queryKey: ["discord", "channels"],
		queryFn: () => N.get(`${Y}/admin/channels`),
		staleTime: 6e4,
		retry: !1
	}), T = l?.roles ?? [], D = R({
		mutationFn: () => N.put(`${Y}/admin/guests`, {
			enabled: f.enabled,
			role_id: f.role_id,
			max_hours: Number(f.max_hours) || 0,
			role_name: T.find((e) => e.id === f.role_id)?.name ?? r.guest_role_name,
			temp_role_id: f.temp_role_id,
			temp_role_name: T.find((e) => e.id === f.temp_role_id)?.name ?? r.guest_temp_role_name,
			channels: g,
			end_action: f.end_action,
			nickname_format: f.nickname_format
		}),
		onSuccess: (e) => {
			n.setQueryData($, e), n.invalidateQueries({ queryKey: ["discord"] }), x(e.guest_channels_seen ?? []), h(e.guest_after_end_sees ?? []), e.guest_channels_seen?.length ? I.warning("Saved, but guests can still see some channels; see below") : e.guest_channels_hiding ? I.success("Saved; the other channels are being hidden from guests, which takes a minute on a large server") : I.success(f.enabled ? "Saved" : "Saved; the guest access still running is being ended");
		},
		onError: (e) => I.error(e.message)
	}), O = (e) => y((t) => t.includes(e) ? t.filter((t) => t !== e) : [...t, e]), k = [];
	for (let e of w.data ?? []) {
		let t = k[k.length - 1];
		t && t.category === (e.category ?? "") ? t.channels.push(e) : k.push({
			category: e.category ?? "",
			channels: [e]
		});
	}
	let A = (e) => p((t) => ({
		...t,
		...e
	}));
	return /* @__PURE__ */ W("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_340px]",
		children: [/* @__PURE__ */ W(a, { children: [
			/* @__PURE__ */ U(c, {
				title: "Temporary access links",
				description: "People with the permission hand out links. Whoever opens one signs in with Discord and gets two roles: the guest role, which they keep, and the temporary role, which they have until the link runs out."
			}),
			/* @__PURE__ */ W(o, {
				className: "space-y-5",
				children: [
					/* @__PURE__ */ U("div", {
						className: "border border-border px-3",
						children: /* @__PURE__ */ U(E, {
							label: "Temporary access links",
							description: "Off: nobody can make links, existing ones stop working and the guest access still running ends.",
							checked: f.enabled,
							onCheckedChange: (e) => A({ enabled: e })
						})
					}),
					/* @__PURE__ */ U(_, {
						label: "Add this second redirect to the Discord application",
						hint: "Developer portal → your application → OAuth2 → Redirects. Without it Discord refuses guests with “Invalid OAuth2 redirect_uri”.",
						children: /* @__PURE__ */ U(Fe, { value: t.guest_redirect_uri })
					}),
					d && /* @__PURE__ */ U(e, {
						tone: "warning",
						title: "Couldn't load the server's roles",
						children: d.message
					}),
					/* @__PURE__ */ W("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ U(_, {
							label: "Temporary role",
							hint: "Guests have it while their link lasts and lose it when it ends, for example a role called tempaccess. It must be below the bot's role.",
							children: /* @__PURE__ */ W(S, {
								value: f.temp_role_id,
								onChange: (e) => A({ temp_role_id: e.target.value }),
								disabled: u,
								children: [
									/* @__PURE__ */ U("option", {
										value: "",
										children: u ? "Loading roles…" : "None (the guest role is taken away instead)"
									}),
									f.temp_role_id && !T.some((e) => e.id === f.temp_role_id) && /* @__PURE__ */ W("option", {
										value: f.temp_role_id,
										children: ["@", r.guest_temp_role_name || f.temp_role_id]
									}),
									T.map((e) => /* @__PURE__ */ W("option", {
										value: e.id,
										disabled: !e.assignable || e.id === f.role_id,
										children: [
											"@",
											e.name,
											e.assignable ? "" : " (above the bot)"
										]
									}, e.id))
								]
							})
						}), /* @__PURE__ */ U(_, {
							label: "Guest role",
							hint: "Guests get it too and keep it after their link ends, so you can see who has been a guest. It must be below the bot's role.",
							children: /* @__PURE__ */ W(S, {
								value: f.role_id,
								onChange: (e) => A({ role_id: e.target.value }),
								disabled: u,
								children: [
									/* @__PURE__ */ U("option", {
										value: "",
										children: u ? "Loading roles…" : "Choose…"
									}),
									f.role_id && !T.some((e) => e.id === f.role_id) && /* @__PURE__ */ W("option", {
										value: f.role_id,
										children: ["@", r.guest_role_name || f.role_id]
									}),
									T.map((e) => /* @__PURE__ */ W("option", {
										value: e.id,
										disabled: !e.assignable || e.id === f.temp_role_id,
										children: [
											"@",
											e.name,
											e.assignable ? "" : " (above the bot)"
										]
									}, e.id))
								]
							})
						})]
					}),
					/* @__PURE__ */ U("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: /* @__PURE__ */ U(_, {
							label: "Longest a link may last (hours)",
							hint: `Up to ${t.guest_hours_ceiling} hours (${t.guest_hours_ceiling / 24} days).`,
							children: /* @__PURE__ */ U(v, {
								type: "number",
								min: 1,
								max: t.guest_hours_ceiling,
								value: f.max_hours,
								onChange: (e) => A({ max_hours: e.target.value }),
								className: "max-w-32"
							})
						})
					}),
					/* @__PURE__ */ W("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ U(_, {
							label: "When a link ends",
							hint: "Someone who was on the server before using a link is never removed, whichever you choose.",
							children: /* @__PURE__ */ W(S, {
								value: f.end_action,
								onChange: (e) => A({ end_action: e.target.value }),
								children: [/* @__PURE__ */ U("option", {
									value: "role",
									children: f.temp_role_id ? "Take the temporary role away; they stay, with the guest role" : "Take the guest role away; they stay on the server"
								}), /* @__PURE__ */ U("option", {
									value: "kick",
									children: "Remove them from the server"
								})]
							})
						}), /* @__PURE__ */ U(_, {
							label: "Guests appear as",
							hint: /* @__PURE__ */ W(H, { children: ["{name}", " is their Discord name. Empty leaves their name alone. It is put back when their access ends."] }),
							children: /* @__PURE__ */ U(v, {
								value: f.nickname_format,
								onChange: (e) => A({ nickname_format: e.target.value }),
								placeholder: "[GUEST] {name}",
								maxLength: 60,
								className: "font-mono"
							})
						})]
					}),
					/* @__PURE__ */ U(_, {
						label: "Channels guests may be let into",
						hint: g.length ? "The bot hides every channel from the guest role, also ones made later, so a former guest sees nothing. Whoever makes a link picks which of these it opens." : "None chosen: guests see whatever their roles see on Discord, and afterwards what the guest role sees. Choose some and guests see only the channels their link opens.",
						children: w.error ? /* @__PURE__ */ U(e, {
							tone: "warning",
							title: "Couldn't load the server's channels",
							children: w.error.message
						}) : w.isLoading ? /* @__PURE__ */ U(C, { className: "h-24" }) : /* @__PURE__ */ U("div", {
							className: "max-h-72 space-y-3 overflow-y-auto border border-border p-3",
							children: k.map((e, t) => /* @__PURE__ */ W("div", { children: [e.category && /* @__PURE__ */ U("div", {
								className: "mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
								children: e.category
							}), /* @__PURE__ */ U("div", {
								className: "flex flex-wrap gap-1.5",
								children: e.channels.map((e) => /* @__PURE__ */ U("button", {
									type: "button",
									"aria-pressed": g.includes(e.id),
									onClick: () => O(e.id),
									className: P("border px-2.5 py-1 text-xs", g.includes(e.id) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:border-border-strong"),
									children: Q(e)
								}, e.id))
							})] }, `${e.category}-${t}`))
						})
					}),
					m.length > 0 && /* @__PURE__ */ W(e, {
						tone: "warning",
						title: "Former guests will see more than guests do",
						children: [
							"When a link ends, guests stay on the server without the guest role, and then see what anyone without a role sees:",
							" ",
							m.slice(0, 8).join(", "),
							m.length > 8 ? "…" : "",
							". Choose a temporary role above, so they keep the guest role and see nothing; or hide those channels from @everyone on Discord."
						]
					}),
					b.length > 0 && /* @__PURE__ */ W(e, {
						tone: "warning",
						title: "Guests can still see channels they shouldn't",
						children: [
							"The bot wasn't allowed to hide ",
							b.slice(0, 8).join(", "),
							b.length > 8 ? "…" : "",
							". Give its role ",
							/* @__PURE__ */ U("b", { children: "Manage Permissions" }),
							" in those channels (or hide them from the guest and temporary roles by hand) and save again. Nobody is let in through a link until this is sorted."
						]
					})
				]
			}),
			/* @__PURE__ */ W(s, {
				className: "justify-between",
				children: [/* @__PURE__ */ U(L, {
					to: "/p/discord/guests",
					className: "text-sm text-accent-ink underline-offset-4 hover:underline",
					children: "See the links and their guests"
				}), /* @__PURE__ */ U(i, {
					variant: "primary",
					loading: D.isPending,
					onClick: () => D.mutate(),
					children: "Save"
				})]
			})
		] }), /* @__PURE__ */ W(a, {
			className: "h-fit",
			children: [/* @__PURE__ */ U(c, { title: "How guests are handled" }), /* @__PURE__ */ W(o, {
				className: "space-y-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ W("p", { children: [
						"Give ",
						/* @__PURE__ */ U("b", { children: "Can hand out temporary access to the Discord server" }),
						" to the people who may make links (Administration → Access), for example fleet commanders, diplomats and recruiters."
					] }),
					/* @__PURE__ */ U("p", { children: "Guest access ends within a couple of minutes of a link running out, straight away when it is withdrawn, and when its maker loses that permission." }),
					/* @__PURE__ */ U("p", { children: "With channels chosen, a guest sees only the ones their link opens. Members and other roles aren't affected." }),
					/* @__PURE__ */ U("p", { children: "When a link ends, a guest keeps the guest role and loses the temporary one. A former guest can use a new link later." }),
					/* @__PURE__ */ U("p", { children: "Someone already on the server can use a link too: they get the roles for the time, and are never removed from the server." }),
					/* @__PURE__ */ U("p", { children: "A Discord account linked to a member here can't use a link; a guest who becomes a member keeps their place and loses the guest role." })
				]
			})]
		})]
	});
}
function Be() {
	let e = B(), { data: o, isLoading: s } = z({
		queryKey: ["discord", "members"],
		queryFn: () => N.get(`${Y}/admin/members`)
	}), [c, u] = V(""), [_, v] = V(null), y = () => e.invalidateQueries({ queryKey: ["discord"] }), b = R({
		mutationFn: (e) => N.post(`${Y}/admin/members/${e}/sync`),
		onSuccess: (e) => {
			e.removed ? I.success("They no longer have access and were removed from the server") : e.error ? I.error(e.error) : I.success("Roles updated"), y();
		},
		onError: (e) => I.error(e.message)
	}), S = R({
		mutationFn: ({ id: e, kick: t, force: n = !1 }) => N.delete(`${Y}/admin/members/${e}?kick=${t}${n ? "&force=true" : ""}`),
		onSuccess: () => {
			I.success("Unlinked"), y();
		},
		onError: (e, n) => {
			e instanceof t && e.status === 502 && !n.force ? I.error(e.message, {
				action: {
					label: "Forget anyway",
					onClick: () => S.mutate({
						...n,
						force: !0
					})
				},
				description: "Forgetting it leaves their roles on Discord; take them off there by hand."
			}) : I.error(e.message);
		}
	});
	if (s || !o) return /* @__PURE__ */ U(C, { className: "h-64" });
	let w = c.trim().toLowerCase(), T = w ? o.filter((e) => [
		e.user.name,
		e.username,
		e.nickname ?? "",
		...(e.characters ?? []).map((e) => e.name)
	].some((e) => e.toLowerCase().includes(w))) : o;
	return /* @__PURE__ */ W(a, { children: [
		/* @__PURE__ */ U(A, { children: /* @__PURE__ */ U(x, {
			value: c,
			onChange: (e) => u(e.target.value),
			placeholder: "Member, character or Discord name",
			className: "w-80"
		}) }),
		T.length === 0 ? /* @__PURE__ */ U(g, {
			icon: /* @__PURE__ */ U(K, {}),
			title: o.length ? "Nobody matches" : "Nobody has linked Discord yet"
		}) : /* @__PURE__ */ W(k, { children: [/* @__PURE__ */ U(D, { children: /* @__PURE__ */ W("tr", { children: [
			/* @__PURE__ */ U(M, { children: "Member" }),
			/* @__PURE__ */ U(M, { children: "Discord" }),
			/* @__PURE__ */ U(M, { children: "Roles" }),
			/* @__PURE__ */ U(M, { children: "Checked" }),
			/* @__PURE__ */ U(M, {})
		] }) }), /* @__PURE__ */ U("tbody", { children: T.map((e) => /* @__PURE__ */ W(te, { children: [
			/* @__PURE__ */ U(j, { children: /* @__PURE__ */ W("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ U(n, {
					src: e.user.portrait,
					name: e.user.name,
					size: "sm"
				}), /* @__PURE__ */ W("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ U("div", {
							className: "truncate font-medium",
							children: e.user.name
						}),
						!e.has_access && /* @__PURE__ */ U(r, {
							tone: "warning",
							children: "no access"
						}),
						!e.on_server && /* @__PURE__ */ U(r, {
							tone: "danger",
							children: "not on the server"
						}),
						/* @__PURE__ */ U(Ve, {
							list: e.characters ?? [],
							needle: w
						})
					]
				})]
			}) }),
			/* @__PURE__ */ U(j, { children: /* @__PURE__ */ W("div", {
				className: "flex items-center gap-2.5",
				children: [/* @__PURE__ */ U(n, {
					src: e.avatar,
					name: e.username,
					size: "xs",
					rounded: "full"
				}), /* @__PURE__ */ W("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ U("div", {
						className: "truncate text-sm",
						children: e.username
					}), e.nickname && /* @__PURE__ */ U("div", {
						className: "truncate text-xs text-subtle",
						children: e.nickname
					})]
				})]
			}) }),
			/* @__PURE__ */ U(j, { children: /* @__PURE__ */ U("div", {
				className: "flex max-w-72 flex-wrap gap-1",
				children: e.role_names.length ? e.role_names.map((e) => /* @__PURE__ */ W(r, {
					tone: "accent",
					children: ["@", e]
				}, e)) : /* @__PURE__ */ U("span", {
					className: "text-xs text-subtle",
					children: "none"
				})
			}) }),
			/* @__PURE__ */ U(j, {
				className: "text-sm",
				children: e.error ? /* @__PURE__ */ U("span", {
					className: "text-warning-fg",
					title: e.error,
					children: e.error.length > 60 ? `${e.error.slice(0, 60)}…` : e.error
				}) : /* @__PURE__ */ U("span", {
					className: "text-muted",
					children: F(e.synced_at)
				})
			}),
			/* @__PURE__ */ U(j, {
				align: "right",
				children: /* @__PURE__ */ W(p, { children: [/* @__PURE__ */ U(h, {
					asChild: !0,
					children: /* @__PURE__ */ U(i, {
						variant: "ghost",
						size: "sm",
						children: "Actions"
					})
				}), /* @__PURE__ */ W(d, {
					align: "end",
					children: [
						/* @__PURE__ */ W(f, {
							onSelect: () => b.mutate(e.user.id),
							children: [/* @__PURE__ */ U(q, {}), " Sync now"]
						}),
						/* @__PURE__ */ W(f, {
							onSelect: () => window.open(`https://discord.com/users/${e.discord_id}`, "_blank", "noreferrer"),
							children: [/* @__PURE__ */ U(de, {}), " Discord profile"]
						}),
						/* @__PURE__ */ U(m, {}),
						/* @__PURE__ */ W(f, {
							onSelect: () => v({
								m: e,
								kick: !1
							}),
							children: [/* @__PURE__ */ U(ue, {}), " Unlink"]
						}),
						/* @__PURE__ */ W(f, {
							danger: !0,
							onSelect: () => v({
								m: e,
								kick: !0
							}),
							children: [/* @__PURE__ */ U(me, {}), " Unlink and kick"]
						})
					]
				})] })
			})
		] }, e.user.id)) })] }),
		/* @__PURE__ */ U(l, {
			open: !!_,
			onOpenChange: (e) => !e && v(null),
			title: _?.kick ? `Kick ${_?.m.user.name} from the server?` : `Unlink ${_?.m.user.name}'s Discord?`,
			description: _?.kick ? "They're removed from the server and the link is forgotten. They can link again while they have access." : "The roles this site gave them are taken away and the link is forgotten. They stay on the server.",
			danger: !0,
			confirmLabel: _?.kick ? "Kick" : "Unlink",
			onConfirm: () => _ && S.mutateAsync({
				id: _.m.user.id,
				kick: _.kick
			})
		})
	] });
}
function Ve({ list: e, needle: t }) {
	let [n, i] = V(!1), a = e.filter((e) => !e.main);
	if (!e.length) return null;
	let o = n ? e : e.filter((e, n) => n < 3 || t && e.name.toLowerCase().includes(t)), s = (e) => /* @__PURE__ */ W("span", {
		className: P("truncate", e.main ? "text-text" : "text-muted"),
		children: [e.name, e.corporation && /* @__PURE__ */ W("span", {
			className: "ml-1 text-subtle",
			children: [
				"[",
				e.corporation,
				"]"
			]
		})]
	});
	return /* @__PURE__ */ W("div", {
		className: "mt-1.5 space-y-1",
		children: [
			o.map((e) => /* @__PURE__ */ W("div", {
				className: "flex items-center gap-1.5 text-xs",
				children: [
					/* @__PURE__ */ U("img", {
						src: e.portrait,
						alt: "",
						className: "size-4 shrink-0"
					}),
					e.viewable ? /* @__PURE__ */ U(L, {
						to: `/characters/${e.id}`,
						className: "flex min-w-0 hover:text-accent-ink hover:underline",
						children: s(e)
					}) : s(e),
					e.main && /* @__PURE__ */ U(r, {
						size: "xs",
						children: "main"
					})
				]
			}, e.id)),
			e.length > o.length && /* @__PURE__ */ W("button", {
				type: "button",
				onClick: () => i(!0),
				className: "text-xs text-accent-ink hover:underline",
				children: [
					e.length - o.length,
					" more character",
					e.length - o.length === 1 ? "" : "s"
				]
			}),
			n && e.length > 3 && /* @__PURE__ */ U("button", {
				type: "button",
				onClick: () => i(!1),
				className: "text-xs text-subtle hover:underline",
				children: "Show fewer"
			}),
			a.length === 0 && /* @__PURE__ */ U("div", {
				className: "text-[11px] text-subtle",
				children: "No alts you can see"
			})
		]
	});
}
//#endregion
//#region src/member.tsx
function He() {
	return z({
		queryKey: ["discord", "me"],
		queryFn: () => N.get(`${Y}/me`)
	});
}
function Ue() {
	return R({
		mutationFn: () => N.post(`${Y}/link`),
		onSuccess: ({ url: e }) => window.location.assign(e),
		onError: (e) => I.error(e.message)
	});
}
function We() {
	let t = B(), s = re("discord.manage_discord"), { data: u, isLoading: d } = He(), f = Ue(), [p, m] = V(!1), h = R({
		mutationFn: () => N.post(`${Y}/sync`),
		onSuccess: (e) => {
			t.setQueryData(["discord", "me"], e), I.success("Your roles are up to date");
		},
		onError: (e) => {
			t.invalidateQueries({ queryKey: ["discord", "me"] }), I.error(e.message);
		}
	}), _ = R({
		mutationFn: () => N.post(`${Y}/unlink`),
		onSuccess: (e) => {
			t.setQueryData(["discord", "me"], e), I.success("Discord account unlinked");
		},
		onError: (e) => I.error(e.message)
	});
	return /* @__PURE__ */ W(H, { children: [
		/* @__PURE__ */ U(y, {
			eyebrow: "Communication",
			title: "Discord",
			icon: /* @__PURE__ */ U(K, {}),
			description: "Link your Discord account to join the server. Your roles and nickname follow your groups and main character.",
			actions: s || u?.can_invite_guests ? /* @__PURE__ */ W("div", {
				className: "flex gap-2",
				children: [u?.can_invite_guests && /* @__PURE__ */ U(L, {
					to: "/p/discord/guests",
					children: /* @__PURE__ */ W(i, { children: [/* @__PURE__ */ U(J, {}), " Temporary access"] })
				}), s && /* @__PURE__ */ U(L, {
					to: "/p/discord/admin",
					children: /* @__PURE__ */ W(i, { children: [/* @__PURE__ */ U(le, {}), " Server setup"] })
				})]
			}) : void 0
		}),
		d || !u ? /* @__PURE__ */ U(C, { className: "h-56" }) : u.configured ? u.account ? /* @__PURE__ */ W("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_360px]",
			children: [/* @__PURE__ */ W("div", {
				className: "space-y-6",
				children: [u.account.error ? /* @__PURE__ */ U(e, {
					tone: "warning",
					title: "Your Discord roles couldn't be updated",
					action: u.account.error.startsWith("Not on the server") ? /* @__PURE__ */ U(i, {
						size: "sm",
						variant: "primary",
						loading: f.isPending,
						onClick: () => f.mutate(),
						children: "Join the server"
					}) : void 0,
					children: u.account.error
				}) : null, /* @__PURE__ */ U(a, { children: /* @__PURE__ */ W("div", {
					className: "flex flex-col gap-5 p-card sm:flex-row sm:items-center",
					children: [
						/* @__PURE__ */ U(n, {
							src: u.account.avatar,
							name: u.account.username,
							size: "lg",
							rounded: "full"
						}),
						/* @__PURE__ */ W("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ W("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ U("span", {
										className: "text-lg font-semibold",
										children: u.account.username
									}), /* @__PURE__ */ W(r, {
										tone: "success",
										children: [/* @__PURE__ */ U(he, { className: "size-3" }), " Linked"]
									})]
								}),
								/* @__PURE__ */ W("div", {
									className: "text-sm text-muted",
									children: [
										"on ",
										u.server || "the server",
										u.account.nickname ? /* @__PURE__ */ W(H, { children: [" as ", /* @__PURE__ */ U("span", {
											className: "text-text",
											children: u.account.nickname
										})] }) : null
									]
								}),
								/* @__PURE__ */ W("div", {
									className: "mt-1 text-xs text-subtle",
									children: [
										"Linked ",
										F(u.account.linked_at),
										" · roles checked ",
										F(u.account.synced_at)
									]
								})
							]
						}),
						/* @__PURE__ */ W("div", {
							className: "flex flex-wrap gap-2",
							children: [
								u.server_url && /* @__PURE__ */ U("a", {
									href: u.server_url,
									target: "_blank",
									rel: "noreferrer",
									children: /* @__PURE__ */ W(i, {
										variant: "primary",
										children: [/* @__PURE__ */ U(de, {}), " Open Discord"]
									})
								}),
								/* @__PURE__ */ W(i, {
									variant: "ghost",
									loading: h.isPending,
									onClick: () => h.mutate(),
									children: [/* @__PURE__ */ U(q, {}), " Fix my roles"]
								}),
								/* @__PURE__ */ W(i, {
									variant: "danger",
									onClick: () => m(!0),
									children: [/* @__PURE__ */ U(ue, {}), " Unlink"]
								})
							]
						})
					]
				}) })]
			}), /* @__PURE__ */ W(a, {
				className: "h-fit",
				children: [/* @__PURE__ */ U(c, {
					title: "Your roles",
					description: "Given by this site. Roles given by hand on Discord aren't touched."
				}), /* @__PURE__ */ U(o, { children: /* @__PURE__ */ U(Ge, {
					roles: u.roles,
					empty: "None of your groups come with a Discord role."
				}) })]
			})]
		}) : /* @__PURE__ */ U(a, { children: /* @__PURE__ */ W("div", {
			className: "grid gap-8 p-card sm:p-8 lg:grid-cols-[1fr_320px] lg:items-center",
			children: [/* @__PURE__ */ W("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ W("div", {
					className: "flex items-center gap-3 text-accent-ink",
					children: [/* @__PURE__ */ U(K, { className: "size-8" }), /* @__PURE__ */ U("span", {
						className: "text-xl font-semibold text-text",
						children: u.server || "Our Discord server"
					})]
				}), u.can_link ? /* @__PURE__ */ W(H, { children: [/* @__PURE__ */ U("p", {
					className: "max-w-prose text-sm text-muted",
					children: "Sign in with Discord and you're put on the server straight away, with the roles that go with your groups. Nobody here sees your Discord password or messages; the site only learns your Discord name."
				}), /* @__PURE__ */ U("div", {
					className: "flex flex-wrap gap-2",
					children: /* @__PURE__ */ W(i, {
						variant: "primary",
						size: "lg",
						loading: f.isPending,
						onClick: () => f.mutate(),
						children: [/* @__PURE__ */ U(K, {}), " Link Discord and join"]
					})
				})] }) : /* @__PURE__ */ U(e, {
					tone: "warning",
					title: "You don't have access to the Discord server",
					children: "Access comes with your membership. Ask your corporation's leadership if you think you should have it."
				})]
			}), u.can_link && /* @__PURE__ */ W("div", {
				className: "border border-border bg-bg/40 p-4 text-sm",
				children: [
					/* @__PURE__ */ U("div", {
						className: "mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
						children: "You'll get"
					}),
					/* @__PURE__ */ U("div", {
						className: "mb-3 font-medium",
						children: u.nickname ?? "Your Discord name"
					}),
					/* @__PURE__ */ U(Ge, {
						roles: u.roles_due,
						empty: "No roles yet; they come with your groups."
					})
				]
			})]
		}) }) : /* @__PURE__ */ U(a, { children: /* @__PURE__ */ U(g, {
			icon: /* @__PURE__ */ U(K, {}),
			title: "Discord isn't set up yet",
			description: s ? "Connect a Discord application and server under Server setup." : "Your leadership hasn't connected a Discord server to this site yet.",
			action: s ? /* @__PURE__ */ U(L, {
				to: "/p/discord/admin",
				children: /* @__PURE__ */ W(i, {
					variant: "primary",
					children: [/* @__PURE__ */ U(le, {}), " Server setup"]
				})
			}) : void 0
		}) }),
		/* @__PURE__ */ U(l, {
			open: p,
			onOpenChange: m,
			title: "Unlink your Discord account?",
			description: "The roles this site gave you are taken away (you may be removed from the server). You can link again at any time.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ W(H, { children: [/* @__PURE__ */ U(ue, {}), " Unlink"] }),
			onConfirm: () => _.mutateAsync()
		})
	] });
}
function Ge({ roles: e, empty: t }) {
	return e.length === 0 ? /* @__PURE__ */ U("p", {
		className: "text-sm text-subtle",
		children: t
	}) : /* @__PURE__ */ U("div", {
		className: "flex flex-wrap gap-1.5",
		children: e.map((e) => /* @__PURE__ */ W(r, {
			tone: "accent",
			children: ["@", e]
		}, e))
	});
}
function Ke() {
	let [e] = oe(), t = ie(), n = B(), r = ce(!1), [o, s] = V(e.get("error") ? "You cancelled the sign-in with Discord." : null), c = Ue();
	return se(() => {
		let i = e.get("code"), a = e.get("state");
		if (!(r.current || o)) {
			if (!i || !a) {
				s("Discord didn't send a sign-in code back.");
				return;
			}
			r.current = !0, N.post(`${Y}/link/finish`, {
				code: i,
				state: a
			}).then((e) => {
				n.setQueryData(["discord", "me"], e), I.success(`Welcome to ${e.server || "the server"}, ${e.account?.username ?? ""}`), t("/p/discord", { replace: !0 });
			}).catch((e) => s(e.message));
		}
	}, [
		e,
		o,
		t,
		n
	]), o ? /* @__PURE__ */ U(a, {
		className: "mx-auto max-w-xl",
		children: /* @__PURE__ */ U(g, {
			icon: /* @__PURE__ */ U(K, {}),
			title: "Discord wasn't linked",
			description: o,
			action: /* @__PURE__ */ W("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ U(L, {
					to: "/p/discord",
					children: /* @__PURE__ */ U(i, {
						variant: "ghost",
						children: "Back"
					})
				}), /* @__PURE__ */ U(i, {
					variant: "primary",
					loading: c.isPending,
					onClick: () => c.mutate(),
					children: "Try again"
				})]
			})
		})
	}) : /* @__PURE__ */ U("div", {
		className: "grid min-h-[50vh] place-items-center",
		children: /* @__PURE__ */ W("div", {
			className: "flex flex-col items-center gap-3 text-sm text-muted",
			children: [/* @__PURE__ */ U(w, {}), "Linking your Discord account and adding you to the server…"]
		})
	});
}
//#endregion
//#region src/public.tsx
var qe = {
	expired: "This link has expired. Ask whoever gave it to you for a new one.",
	revoked: "This link was withdrawn.",
	used_up: "This link has been used by as many people as it allows.",
	creator_lost: "Whoever gave you this link can't hand out access any more. Ask someone else for a new one."
};
function Je() {
	let { token: e } = ae(), { data: t, isLoading: n, error: r } = z({
		queryKey: [
			"discord",
			"public",
			e
		],
		queryFn: () => N.get(`${be}/guest/${e}`),
		retry: !1
	}), s = R({
		mutationFn: () => N.post(`${be}/guest/${e}/start`),
		onSuccess: (e) => window.location.assign(e.url),
		onError: (e) => I.error(e.message)
	});
	return n ? /* @__PURE__ */ U(C, { className: "h-64" }) : r || !t ? /* @__PURE__ */ U(a, {
		className: "mx-auto max-w-xl",
		children: /* @__PURE__ */ U(g, {
			icon: /* @__PURE__ */ U(K, {}),
			title: "This link doesn't work",
			description: "It may have been withdrawn, or it was copied wrongly. Ask whoever gave it to you for a new one."
		})
	}) : /* @__PURE__ */ W("div", {
		className: "mx-auto max-w-2xl",
		children: [/* @__PURE__ */ U(y, {
			icon: /* @__PURE__ */ U(K, {}),
			eyebrow: "Temporary Discord access",
			title: t.server || "Discord server",
			description: /* @__PURE__ */ W(H, { children: [
				t.invited_by ? /* @__PURE__ */ W(H, { children: [t.invited_by, " invited you"] }) : "You're invited",
				" for ",
				/* @__PURE__ */ U("b", { children: t.label }),
				"."
			] })
		}), t.status === "active" ? /* @__PURE__ */ W(a, { children: [/* @__PURE__ */ U(c, {
			title: "Join with your Discord account",
			description: "Discord asks you to confirm, then you're added to the server as a guest."
		}), /* @__PURE__ */ W(o, {
			className: "space-y-4",
			children: [/* @__PURE__ */ W(i, {
				variant: "primary",
				size: "lg",
				loading: s.isPending || s.isSuccess,
				onClick: () => s.mutate(),
				children: [/* @__PURE__ */ U(K, {}), " Join with Discord"]
			}), /* @__PURE__ */ W("p", {
				className: "text-xs text-subtle",
				children: [
					/* @__PURE__ */ U(J, { className: "mr-1 inline size-3 align-[-2px]" }),
					"Your guest access ends ",
					new Date(t.expires_at).toLocaleString(),
					" (",
					Z(t.expires_at),
					")",
					t.leaves ? "; you are removed from the server then" : "",
					". This site learns your Discord name and nothing else."
				]
			})]
		})] }) : /* @__PURE__ */ U(a, { children: /* @__PURE__ */ U(g, {
			icon: /* @__PURE__ */ U(J, {}),
			title: "This link is closed",
			description: qe[t.status]
		}) })]
	});
}
function Ye() {
	let [t] = oe(), r = ce(!1), [s, c] = V(null), [l, u] = V(t.get("error") ? "You cancelled the sign-in with Discord. Open your link again to retry." : null);
	return se(() => {
		let e = t.get("code"), n = t.get("state");
		if (!(r.current || l)) {
			if (!e || !n) {
				u("Discord didn't send a sign-in code back. Open your link again.");
				return;
			}
			r.current = !0, N.post(`${be}/guest-finish`, {
				code: e,
				state: n
			}).then(c).catch((e) => u(e.message));
		}
	}, [t, l]), l ? /* @__PURE__ */ U(a, {
		className: "mx-auto max-w-xl",
		children: /* @__PURE__ */ U(g, {
			icon: /* @__PURE__ */ U(K, {}),
			title: "You weren't added to the server",
			description: l
		})
	}) : s ? /* @__PURE__ */ W("div", {
		className: "mx-auto max-w-2xl",
		children: [/* @__PURE__ */ U(y, {
			icon: /* @__PURE__ */ U(K, {}),
			eyebrow: "Temporary Discord access",
			title: s.server || "Discord server",
			description: /* @__PURE__ */ W(H, { children: [
				"You're in for ",
				/* @__PURE__ */ U("b", { children: s.label }),
				"."
			] })
		}), /* @__PURE__ */ U(a, { children: /* @__PURE__ */ W(o, {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ W("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ U(n, {
						src: s.avatar,
						name: s.username,
						size: "lg"
					}), /* @__PURE__ */ W("div", { children: [/* @__PURE__ */ W("div", {
						className: "font-medium",
						children: ["Welcome, ", s.username]
					}), /* @__PURE__ */ U("div", {
						className: "text-xs text-subtle",
						children: "The server is in your Discord server list now."
					})] })]
				}),
				/* @__PURE__ */ U("a", {
					href: s.server_url,
					target: "_blank",
					rel: "noreferrer",
					children: /* @__PURE__ */ W(i, {
						variant: "primary",
						children: [/* @__PURE__ */ U(de, {}), " Open Discord"]
					})
				}),
				/* @__PURE__ */ W(e, {
					tone: "info",
					title: `Access ends ${new Date(s.expires_at).toLocaleString()}`,
					icon: /* @__PURE__ */ U(J, {}),
					children: [
						Z(s.expires_at),
						". ",
						s.leaves ? "You are removed from the server then." : "Your access to the channels ends then."
					]
				})
			]
		}) })]
	}) : /* @__PURE__ */ U("div", {
		className: "grid min-h-[50vh] place-items-center",
		children: /* @__PURE__ */ W("div", {
			className: "flex flex-col items-center gap-3 text-sm text-muted",
			children: [/* @__PURE__ */ U(w, {}), "Adding you to the server…"]
		})
	});
}
//#endregion
//#region src/index.tsx
function Xe() {
	let { data: e, isLoading: t } = He(), n = Ue();
	return t ? /* @__PURE__ */ U(C, { className: "h-16" }) : !e?.configured || !e.account && !e.can_link ? null : e.account ? /* @__PURE__ */ W(L, {
		to: "/p/discord",
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ W("div", {
			className: "flex min-w-0 items-center gap-3",
			children: [/* @__PURE__ */ U(K, { className: "size-7 shrink-0 text-accent-ink" }), /* @__PURE__ */ W("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ U("div", {
					className: "truncate font-medium",
					children: e.account.username
				}), /* @__PURE__ */ U("div", {
					className: "truncate text-xs text-muted",
					children: e.roles.length ? e.roles.map((e) => `@${e}`).join(" ") : "no roles"
				})]
			})]
		}), e.account.error ? /* @__PURE__ */ U(r, {
			tone: "warning",
			children: "Needs attention"
		}) : /* @__PURE__ */ U(r, {
			tone: "success",
			children: "Linked"
		})]
	}) : /* @__PURE__ */ W("div", {
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ W("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ U(K, { className: "size-7 text-accent-ink" }), /* @__PURE__ */ W("div", { children: [/* @__PURE__ */ W("div", {
				className: "font-medium",
				children: ["Join ", e.server || "our Discord"]
			}), /* @__PURE__ */ U("div", {
				className: "text-xs text-muted",
				children: "Link your account to get on the server with your roles."
			})] })]
		}), /* @__PURE__ */ U(i, {
			variant: "primary",
			size: "sm",
			loading: n.isPending,
			onClick: () => n.mutate(),
			children: "Link"
		})]
	});
}
var Ze = ne({
	routes: [
		{
			path: "",
			Component: We
		},
		{
			path: "callback",
			Component: Ke
		},
		{
			path: "guests",
			Component: Te
		},
		{
			path: "admin",
			Component: Ne
		}
	],
	publicRoutes: [{
		path: "guest/:token",
		Component: Je
	}, {
		path: "guest",
		Component: Ye
	}],
	widgets: [{
		id: "link",
		title: "Discord",
		Component: Xe,
		size: "sm",
		order: 20
	}]
});
//#endregion
export { Ze as default };

export const classes = ["!data","!o","!r","---","----------------------------------------------------------------------------------------------------","-----------------------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------------------","@conduit/sdk","@everyone","@tanstack/react-query","a","about","above","accent","access","account","action","actions","active","add","added","adding","admin","after","afterwards","again","align","align-[-2px]","all","allowed","already","also","alt","although","alts","always","an","and","announcement","another","any","anyone","anyway","api","appear","application","are","aren","aria-label","aria-pressed","as","asks","assignable","at","attention","autoComplete","autoFocus","avatar","away","back","background","be","becomes","been","before","behind","being","below","bg-accent-soft","bg-bg/40","bg-success-soft","boolean","border","border-accent","border-b","border-border","border-border-strong","border-success/40","bot","bot_token","bot_token_set","brand","but","button","by","c","callback","called","came","can","canManage","can_invite_guests","can_link","can_manage","cancelled","category","cell","change","changes","channel","channelLabel","channels","character","characters","check","checked","children","choose","chosen","className","client","client_id","client_secret","client_secret_set","closed","code","color","columns","come","comes","compliant","configured","confirmLabel","connected","connection","const","copied","copy","corporation","couldn","count","couple","create","created_at","created_by","creator_lost","current","currentColor","cx","cy","danger","dashboard","data","date","days","default","delete","deleted","description","developer","didn","diplomats","disabled","discord","discord_id","divide-border","divide-y","do","doesn","don","done","drag","effects","else","empty","enabled","end","end_action","ended","ended_at","ended_reason","ends","error","errors","every","everyone","everything","example","existing","expired","expires_at","export","extend","extending","extends","extra","eye","eyebrow","false","few","fewer","fill","fix","fleet","flex","flex-1","flex-col","flex-wrap","follow","font-medium","font-mono","font-semibold","footer","for","force","former","forum","from","full","function","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-5","gap-6","gap-8","gave","get","gets","ghost","give","given","go","good","grid","grid-cols-[32px_1fr]","group","groups","guest","guest_after_end_sees","guest_channels","guest_channels_seen","guest_enabled","guest_end_action","guest_hours_ceiling","guest_max_hours","guest_nickname_format","guest_redirect_uri","guest_role_id","guest_role_name","guest_temp_role_id","guest_temp_role_name","guests","guild","guild_id","guild_name","h","h-16","h-24","h-56","h-64","h-96","h-fit","hand","handled","has","has_access","hasn","have","header","height","here","hidden","hide","hides","hiding","hint","history","hours","hoursLabel","hover:border-border-strong","hover:text-accent-ink","hover:text-text","hover:underline","how","href","i","icon","icon-xs","icons","id","if","import","in","info","inline","inline-flex","instanceof","instead","interface","into","invite_url","invited","invited_by","invites","is","isLoading","isPending","isn","iso","it","items","items-center","items-end","items-stretch","its","j","join","joined","joined_at","joins","justify-between","keep","keeps","kept","kept_role","key","kick","kick_without_access","kicked","kind","label","large","last","last_full_sync","lasts","leadership","learns","least","leaves","left","length","let","lg","lg:grid-cols-2","lg:grid-cols-[1fr_320px]","lg:items-center","limit","link","linked","linked_at","links","list","list-disc","lists","live","ll","load","loading","long","longer","lose","loses","lost","m","m12","m18.84","m4.9","m5.17","made","main","make","maker","makes","manage_discord","manager","many","mapped","mappings","match","matches","matching","max","max-h-72","max-w-2xl","max-w-32","max-w-72","max-w-prose","max-w-sm","max-w-xl","maxHours","maxLength","max_hours","max_uses","may","mb-1.5","mb-2","mb-3","me","meeting","member","members","min","min-h-[50vh]","min-w-0","min-w-56","minute","minutes","ml-1","moment","more","most","mr-1","ms","mt-1","mt-1.5","mt-2","mt-3","must","mutationFn","mx-auto","my","name","navigate","needle","needs","neutral","never","new","newest","next","nickname","nickname_format","no","noChannel","nobody","none","noreferrer","not","nothing","noticed","now","nudge","null","number","of","off","offered","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onDone","onError","onExtend","onFocus","onMade","onOpenChange","onRemove","onRevoke","onSelect","onSuccess","onValueChange","on_server","once","one","ones","only","opacity-75","open","opens","or","order","other","otherwise","our","out","outline","overflow-y-auto","overview","own","p-3","p-4","p-card","page","params","password","past","paste","patch","path","pb-2","people","permission","person","pick","picked","picks","pills","pl-4","place","place-items-center","placeholder","plain","points","portal","portrait","position","post","presets","press","primary","problems","profile","pt-1","public","publicRoutes","put","px-2.5","px-3","px-card","py-1","py-2","py-3","qc","queryFn","queryKey","r","ran","re","reached","react","react-router","readOnly","redirect","redirect_uri","refresh","refuses","rel","remove","removed","replace","require_for_compliance","rest","retry","return","revoke","revoked","revoking","right","right-click","role","roleById","role_id","role_name","role_names","roles","roles_due","room","round","rounded","rounded-full","routes","row","rowKey","rows","run","runCheck","running","runs","rx","ry","s","save","saving","search","second","secondary","secret","see","sees","select","send","sends","sent","server","server_url","set","setAfter","setChannels","setCheck","setConfirmUnlink","setCreating","setError","setExtending","setForm","setHours","setJoined","setLabel","setMade","setMaxUses","setOpen","setPicked","setQ","setRemove","setRevoking","setRole","setRows","setSecret","setSeen","setShowPast","setTab","setTarget","setToken","settings","setup","several","should","shouldn","showOwner","shown","shows","shrink-0","shrinks","sign","sign-in","signing","signs","site","size","size-12","size-2.5","size-3","size-3.5","size-4","size-6","size-7","size-8","sm","sm:flex-row","sm:grid-cols-2","sm:grid-cols-3","sm:items-center","sm:p-8","so","some","someone","soon","space-y-1","space-y-3","space-y-4","space-y-5","space-y-6","src","st","stage","staleTime","stand","start","state","states","stats","status","stay","still","stop","stopped","stops","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","switch","switched","sync","synced_at","t","tab","take","taken","takes","target","target_id","temp_role_id","temp_role_name","temporary","text","text-[11px]","text-accent-ink","text-lg","text-muted","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xl","text-xs","than","that","the","their","them","then","there","these","they","think","this","those","through","title","to","toast","toggle","token","tone","too","tracking-[0.12em]","transparent","tried","true","truncate","turn","two","type","undefined","under","underline-offset-4","unlink","unlinked","until","untilText","up","updated","uppercase","url","use","useQuery","useQueryClient","useSearchParams","useStartLink","useState","used","used_up","user","username","uses","using","v","value","variant","ve","viewBox","viewable","voice","void","w-72","w-80","w-full","waiting","warning","was","was_on_server","wasn","were","weren","what","whatever","when","where","whether","which","whichever","while","who","whoever","whose","widgets","width","will","with","withdraw","withdrawn","within","without","work","working","works","x","xl:grid-cols-[1fr_340px]","xl:grid-cols-[1fr_360px]","xl:grid-cols-[1fr_380px]","xs","yet","you","your"];
