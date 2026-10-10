import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardFooter as o, CardHeader as s, ConfirmDialog as c, Dialog as l, DropdownContent as u, DropdownItem as d, DropdownMenu as f, DropdownSeparator as p, DropdownTrigger as m, EmptyState as h, Field as g, Input as _, PageHeader as v, SearchInput as y, Select as b, Skeleton as x, StatCard as S, SwitchRow as C, THead as ee, TabPanel as w, Table as te, TableToolbar as ne, Tabs as re, Td as T, Th as E, Tr as ie, api as D, cn as O, definePlugin as k, timeAgo as A, toast as j, useHasPerm as ae } from "@conduit/sdk";
import { Link as M, useParams as oe } from "react-router";
import { useMutation as N, useQuery as P, useQueryClient as F } from "@tanstack/react-query";
import { useState as I } from "react";
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
		/* @__PURE__ */ R("path", { d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" }),
		/* @__PURE__ */ R("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }),
		/* @__PURE__ */ R("line", {
			x1: "12",
			x2: "12",
			y1: "19",
			y2: "22"
		})
	]
}), se = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M20 7h-9" }),
		/* @__PURE__ */ R("path", { d: "M14 17H5" }),
		/* @__PURE__ */ R("circle", {
			cx: "17",
			cy: "17",
			r: "3"
		}),
		/* @__PURE__ */ R("circle", {
			cx: "7",
			cy: "7",
			r: "3"
		})
	]
}), H = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" }),
		/* @__PURE__ */ R("path", { d: "m21 2-9.6 9.6" }),
		/* @__PURE__ */ R("circle", {
			cx: "7.5",
			cy: "15.5",
			r: "5.5"
		})
	]
}), U = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ R("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), ce = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "M20 6 9 17l-5-5" })
}), le = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M5 12h14" }), /* @__PURE__ */ R("path", { d: "M12 5v14" })]
}), W = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M3 6h18" }),
		/* @__PURE__ */ R("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ R("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), G = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ R("polyline", { points: "12 6 12 12 16 14" })]
}), ue = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ R("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })]
}), de = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ R("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ R("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), fe = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ R("path", { d: "M19 12H5" })]
}), pe = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" })
}), me = (e) => /* @__PURE__ */ z(B, {
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
}), he = (e) => /* @__PURE__ */ z(B, {
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
}), K = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ R("path", { d: "m4.9 4.9 14.2 14.2" })]
});
//#endregion
//#region src/shared.tsx
function q(e, t = "Copied") {
	navigator.clipboard.writeText(e).then(() => j.success(t), () => j.error("Couldn't copy; select the text instead"));
}
function J({ value: e, label: t, mono: n = !0 }) {
	return /* @__PURE__ */ z("div", {
		className: "flex items-stretch",
		children: [/* @__PURE__ */ R(_, {
			readOnly: !0,
			value: e,
			"aria-label": t,
			className: O("text-xs", n && "font-mono"),
			onFocus: (e) => e.target.select()
		}), /* @__PURE__ */ R(r, {
			variant: "secondary",
			size: "icon",
			"aria-label": `Copy ${t ?? ""}`.trim(),
			onClick: () => q(e),
			children: /* @__PURE__ */ R(U, {})
		})]
	});
}
function ge({ groups: e, empty: t }) {
	return e.length === 0 ? /* @__PURE__ */ R("p", {
		className: "text-sm text-subtle",
		children: t
	}) : /* @__PURE__ */ R("div", {
		className: "flex flex-wrap gap-1.5",
		children: e.map((e) => /* @__PURE__ */ R(n, {
			tone: "accent",
			children: e
		}, e))
	});
}
function Y({ server: e, username: t, password: n, url: i, children: a }) {
	return /* @__PURE__ */ z("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ z("dl", {
			className: "grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center",
			children: [
				/* @__PURE__ */ R("dt", {
					className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
					children: "Server"
				}),
				/* @__PURE__ */ R("dd", { children: /* @__PURE__ */ R(J, {
					value: e.host,
					label: "server address"
				}) }),
				/* @__PURE__ */ R("dt", {
					className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
					children: "Port"
				}),
				/* @__PURE__ */ R("dd", { children: /* @__PURE__ */ R(J, {
					value: String(e.port),
					label: "port"
				}) }),
				/* @__PURE__ */ R("dt", {
					className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
					children: "Username"
				}),
				/* @__PURE__ */ R("dd", { children: /* @__PURE__ */ R(J, {
					value: t,
					label: "username"
				}) }),
				n !== void 0 && /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R("dt", {
					className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
					children: "Password"
				}), /* @__PURE__ */ R("dd", { children: /* @__PURE__ */ R(J, {
					value: n,
					label: "password"
				}) })] })
			]
		}), /* @__PURE__ */ z("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [i && /* @__PURE__ */ R("a", {
				href: i,
				children: /* @__PURE__ */ z(r, {
					variant: "primary",
					children: [/* @__PURE__ */ R(de, {}), " Open in Mumble"]
				})
			}), a]
		})]
	});
}
function _e({ status: e }) {
	let { tone: t, label: r } = {
		active: {
			tone: "success",
			label: "Active"
		},
		expired: {
			tone: "neutral",
			label: "Expired"
		},
		used_up: {
			tone: "warning",
			label: "Used up"
		},
		revoked: {
			tone: "danger",
			label: "Withdrawn"
		}
	}[e];
	return /* @__PURE__ */ R(n, {
		tone: t,
		children: r
	});
}
function X(e) {
	let t = new Date(e).getTime() - Date.now();
	if (t <= 0) return "ended";
	let n = Math.round(t / 6e4);
	if (n < 60) return `${n} min left`;
	let r = Math.floor(n / 60);
	return r < 48 ? `${r} h ${n % 60 ? `${n % 60} min ` : ""}left` : `${Math.round(r / 24)} days left`;
}
//#endregion
//#region src/types.ts
var Z = "/api/p/mumble", ve = "/api/public/p/mumble", ye = ["mumble", "temp"], be = [
	1,
	2,
	4,
	8,
	12,
	24,
	48,
	72,
	168
];
function xe() {
	let t = F(), { data: n, isLoading: a } = P({
		queryKey: ye,
		queryFn: () => D.get(`${Z}/temp`)
	}), [o, s] = I(!1), [l, u] = I(null), [d, f] = I(null), [p, m] = I(!1), g = N({
		mutationFn: (e) => D.delete(`${Z}/temp/${e}`),
		onSuccess: () => {
			j.success("Link withdrawn; its guests can't connect any more"), t.invalidateQueries({ queryKey: ye });
		},
		onError: (e) => j.error(e.message)
	}), y = n?.links ?? [], b = y.filter((e) => e.status === "active"), S = y.filter((e) => e.status !== "active");
	return /* @__PURE__ */ z(L, { children: [
		/* @__PURE__ */ R(v, {
			eyebrow: /* @__PURE__ */ z(M, {
				to: "/p/mumble",
				className: "inline-flex items-center gap-1 hover:text-text",
				children: [/* @__PURE__ */ R(fe, { className: "size-3" }), " Mumble"]
			}),
			title: "Temporary access",
			icon: /* @__PURE__ */ R(G, {}),
			description: "Hand a link to people without an account here: diplomats, guests on a fleet, a recruit. They choose a name and get a login that stops working when the link runs out.",
			actions: n?.enabled ? /* @__PURE__ */ z(r, {
				variant: "primary",
				onClick: () => s(!0),
				children: [/* @__PURE__ */ R(le, {}), " New link"]
			}) : void 0
		}),
		a || !n ? /* @__PURE__ */ R(x, { className: "h-64" }) : n.enabled ? /* @__PURE__ */ z("div", {
			className: "space-y-6",
			children: [
				l && /* @__PURE__ */ R(e, {
					tone: "success",
					title: "Link made. Send it to your guests.",
					action: /* @__PURE__ */ R(r, {
						size: "sm",
						variant: "ghost",
						onClick: () => u(null),
						children: "Done"
					}),
					children: /* @__PURE__ */ z("div", {
						className: "mt-2 flex items-stretch",
						children: [/* @__PURE__ */ R(_, {
							readOnly: !0,
							value: l.url,
							className: "font-mono text-xs",
							onFocus: (e) => e.target.select()
						}), /* @__PURE__ */ R(r, {
							variant: "secondary",
							size: "icon",
							"aria-label": "Copy link",
							onClick: () => q(l.url, "Link copied"),
							children: /* @__PURE__ */ R(U, {})
						})]
					})
				}),
				b.length === 0 ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(h, {
					icon: /* @__PURE__ */ R(ue, {}),
					title: "No active links",
					description: "Make one and send it to whoever needs to get on comms for a while.",
					action: /* @__PURE__ */ z(r, {
						variant: "primary",
						onClick: () => s(!0),
						children: [/* @__PURE__ */ R(le, {}), " New link"]
					})
				}) }) : /* @__PURE__ */ R("div", {
					className: "grid gap-4 lg:grid-cols-2",
					children: b.map((e) => /* @__PURE__ */ R(Se, {
						link: e,
						showOwner: n.can_manage,
						onRevoke: () => f(e)
					}, e.id))
				}),
				S.length > 0 && /* @__PURE__ */ z("div", { children: [/* @__PURE__ */ z("button", {
					type: "button",
					className: "text-sm text-muted hover:text-text",
					onClick: () => m((e) => !e),
					children: [
						p ? "Hide" : "Show",
						" ",
						S.length,
						" past link",
						S.length === 1 ? "" : "s"
					]
				}), p && /* @__PURE__ */ R("div", {
					className: "mt-3 grid gap-4 lg:grid-cols-2",
					children: S.map((e) => /* @__PURE__ */ R(Se, {
						link: e,
						showOwner: n.can_manage
					}, e.id))
				})] })
			]
		}) : /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(h, {
			icon: /* @__PURE__ */ R(G, {}),
			title: "Temporary access is switched off",
			description: "A Mumble manager can switch it on under Server setup."
		}) }),
		n && /* @__PURE__ */ R(we, {
			open: o,
			onOpenChange: s,
			overview: n,
			onMade: (e) => {
				u(e), s(!1), t.invalidateQueries({ queryKey: ye });
			}
		}),
		/* @__PURE__ */ R(c, {
			open: !!d,
			onOpenChange: (e) => !e && f(null),
			title: `Withdraw "${d?.label}"?`,
			description: `The link stops working and the ${d?.uses ?? 0} login${d?.uses === 1 ? "" : "s"} it handed out are cut off at their next connect.`,
			danger: !0,
			confirmLabel: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(K, {}), " Withdraw"] }),
			onConfirm: () => d && g.mutateAsync(d.id)
		})
	] });
}
function Se({ link: e, showOwner: t, onRevoke: o }) {
	let c = F(), [l, u] = I(!1), d = N({
		mutationFn: (e) => D.delete(`${Z}/temp/users/${e}`),
		onSuccess: () => {
			j.success("Guest cut off"), c.invalidateQueries({ queryKey: ["mumble"] });
		},
		onError: (e) => j.error(e.message)
	}), f = e.status === "active", p = e.users ?? [];
	return /* @__PURE__ */ z(i, {
		className: O(!f && "opacity-75"),
		children: [/* @__PURE__ */ R(s, {
			title: /* @__PURE__ */ z("span", {
				className: "flex items-center gap-2",
				children: [
					e.label,
					" ",
					/* @__PURE__ */ R(_e, { status: e.status })
				]
			}),
			description: /* @__PURE__ */ z(L, { children: [
				f ? X(e.expires_at) : `ended ${A(e.expires_at)}`,
				" · ",
				e.uses,
				e.max_uses ? ` of ${e.max_uses}` : "",
				" used",
				t && e.created_by ? ` · by ${e.created_by.name}` : ""
			] }),
			actions: /* @__PURE__ */ z("div", {
				className: "flex gap-1",
				children: [f && /* @__PURE__ */ z(r, {
					variant: "ghost",
					size: "sm",
					onClick: () => q(e.url, "Link copied"),
					children: [/* @__PURE__ */ R(U, {}), " Copy link"]
				}), f && o && /* @__PURE__ */ z(r, {
					variant: "ghost",
					size: "sm",
					onClick: o,
					children: [/* @__PURE__ */ R(K, {}), " Withdraw"]
				})]
			})
		}), /* @__PURE__ */ z(a, {
			className: "space-y-3",
			children: [/* @__PURE__ */ z("div", {
				className: "flex flex-wrap items-center gap-1.5 text-xs text-muted",
				children: ["Guests get ", /* @__PURE__ */ R("span", {
					className: "flex gap-1",
					children: e.groups.length ? e.groups.map((e) => /* @__PURE__ */ R(n, {
						tone: "accent",
						children: e
					}, e)) : /* @__PURE__ */ R("span", { children: "no group" })
				})]
			}), p.length === 0 ? /* @__PURE__ */ R("p", {
				className: "text-sm text-subtle",
				children: "Nobody has used it yet."
			}) : /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ z("button", {
				type: "button",
				className: "inline-flex items-center gap-1.5 text-sm text-accent-ink hover:underline",
				onClick: () => u((e) => !e),
				children: [
					/* @__PURE__ */ R(me, { className: "size-3.5" }),
					" ",
					p.length,
					" guest",
					p.length === 1 ? "" : "s"
				]
			}), l && /* @__PURE__ */ R("ul", {
				className: "divide-y divide-border border border-border text-sm",
				children: p.map((e) => /* @__PURE__ */ R(Ce, {
					guest: e,
					onCut: f && e.active ? () => d.mutate(e.id) : void 0
				}, e.id))
			})] })]
		})]
	});
}
function Ce({ guest: e, onCut: t }) {
	return /* @__PURE__ */ z("li", {
		className: "flex items-center gap-3 px-3 py-2",
		children: [/* @__PURE__ */ z("div", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ R("div", {
				className: "truncate font-medium",
				children: e.display_name
			}), /* @__PURE__ */ z("div", {
				className: "truncate text-xs text-subtle",
				children: [
					/* @__PURE__ */ R("span", {
						className: "font-mono",
						children: e.username
					}),
					" · joined ",
					A(e.created_at),
					e.last_login_at ? ` · connected ${A(e.last_login_at)}` : " · not connected yet"
				]
			})]
		}), e.revoked ? /* @__PURE__ */ R(n, {
			tone: "danger",
			children: "cut off"
		}) : e.active ? t ? /* @__PURE__ */ z(r, {
			variant: "ghost",
			size: "xs",
			onClick: t,
			children: [/* @__PURE__ */ R(K, {}), " Cut off"]
		}) : null : /* @__PURE__ */ R(n, {
			tone: "neutral",
			children: "ended"
		})]
	});
}
function we({ open: e, onOpenChange: t, overview: n, onMade: i }) {
	let [a, o] = I(""), [s, c] = I(String(Math.min(4, n.max_hours))), [u, d] = I(""), [f, p] = I([n.default_group].filter(Boolean)), m = N({
		mutationFn: () => D.post(`${Z}/temp`, {
			label: a.trim(),
			hours: Number(s),
			max_uses: Number(u) || 0,
			groups: n.can_manage ? f : void 0
		}),
		onSuccess: (e) => {
			i(e), o(""), d("");
		},
		onError: (e) => j.error(e.message)
	}), h = be.filter((e) => e <= n.max_hours);
	h.includes(n.max_hours) || h.push(n.max_hours);
	let v = (e) => p((t) => t.includes(e) ? t.filter((t) => t !== e) : [...t, e]);
	return /* @__PURE__ */ R(l, {
		open: e,
		onOpenChange: t,
		title: "New temporary link",
		description: "Whoever opens it gets a Mumble login that lasts as long as the link.",
		footer: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(r, {
			variant: "ghost",
			onClick: () => t(!1),
			children: "Cancel"
		}), /* @__PURE__ */ z(r, {
			variant: "primary",
			loading: m.isPending,
			disabled: !a.trim(),
			onClick: () => m.mutate(),
			children: [/* @__PURE__ */ R(ue, {}), " Make link"]
		})] }),
		children: /* @__PURE__ */ z("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ R(g, {
					label: "What it's for",
					hint: "Shown to the guests, and to you in the list.",
					children: /* @__PURE__ */ R(_, {
						autoFocus: !0,
						value: a,
						onChange: (e) => o(e.target.value),
						maxLength: 100,
						placeholder: "Diplo meeting Saturday"
					})
				}),
				/* @__PURE__ */ z("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ R(g, {
						label: "Lasts",
						hint: `At most ${n.max_hours} hours.`,
						children: /* @__PURE__ */ R(b, {
							value: s,
							onChange: (e) => c(e.target.value),
							children: h.map((e) => /* @__PURE__ */ R("option", {
								value: e,
								children: e < 24 ? `${e} hour${e === 1 ? "" : "s"}` : `${e / 24} day${e === 24 ? "" : "s"}`
							}, e))
						})
					}), /* @__PURE__ */ R(g, {
						label: "Uses",
						hint: "How many people may use it; empty for no limit.",
						children: /* @__PURE__ */ R(_, {
							type: "number",
							min: 0,
							value: u,
							onChange: (e) => d(e.target.value),
							placeholder: "no limit"
						})
					})]
				}),
				n.can_manage && n.known_groups.length > 0 && /* @__PURE__ */ R(g, {
					label: "Mumble groups for the guests",
					hint: "Only Mumble managers can give guests more than the guest group.",
					children: /* @__PURE__ */ R("div", {
						className: "flex flex-wrap gap-1.5",
						children: n.known_groups.map((e) => /* @__PURE__ */ R("button", {
							type: "button",
							onClick: () => v(e),
							className: O("border px-2.5 py-1 text-xs", f.includes(e) ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-muted hover:border-border-strong"),
							children: e
						}, e))
					})
				})
			]
		})
	});
}
//#endregion
//#region src/admin.tsx
var Q = ["mumble", "admin"];
function Te() {
	let { data: e, isLoading: t } = P({
		queryKey: Q,
		queryFn: () => D.get(`${Z}/admin`)
	}), [n, r] = I(null), i = n ?? (e?.settings.configured ? "groups" : "setup"), a = e?.settings.authenticator_seen_at ? Date.now() - new Date(e.settings.authenticator_seen_at).getTime() : null, o = a !== null && a < 6e5;
	return /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(v, {
		eyebrow: /* @__PURE__ */ z(M, {
			to: "/p/mumble",
			className: "inline-flex items-center gap-1 hover:text-text",
			children: [/* @__PURE__ */ R(fe, { className: "size-3" }), " Mumble"]
		}),
		title: "Server setup",
		icon: /* @__PURE__ */ R(V, {}),
		description: "Connect your Mumble server through its authenticator, decide which groups and states get which Mumble groups, and look after accounts and guest links."
	}), t || !e ? /* @__PURE__ */ R(x, { className: "h-96" }) : /* @__PURE__ */ z("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ z("div", {
			className: "grid gap-4 sm:grid-cols-4",
			children: [
				/* @__PURE__ */ R(S, {
					label: "Server",
					value: e.settings.server_name || e.settings.host || "Not set",
					tone: e.settings.configured ? "success" : "warning"
				}),
				/* @__PURE__ */ R(S, {
					label: "Authenticator",
					value: a === null ? "Never seen" : o ? "Running" : "Silent",
					tone: a === null ? "warning" : o ? "success" : "danger",
					hint: e.settings.authenticator_seen_at ? `last call ${A(e.settings.authenticator_seen_at)}${e.settings.authenticator_version ? ` · v${e.settings.authenticator_version}` : ""}` : "set it up under Setup"
				}),
				/* @__PURE__ */ R(S, {
					label: "Accounts",
					value: e.stats.accounts
				}),
				/* @__PURE__ */ R(S, {
					label: "Guests on comms",
					value: e.stats.temp_active,
					hint: `${e.stats.temp_links} open link${e.stats.temp_links === 1 ? "" : "s"}`
				})
			]
		}), /* @__PURE__ */ z(re, {
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
					value: "groups",
					label: "Groups",
					count: e.mappings.length,
					disabled: !e.settings.configured
				},
				{
					value: "members",
					label: "Accounts",
					count: e.stats.accounts,
					disabled: !e.settings.configured
				},
				{
					value: "temp",
					label: "Guest links",
					count: e.stats.temp_links,
					disabled: !e.settings.configured
				}
			],
			children: [
				/* @__PURE__ */ R(w, {
					value: "setup",
					children: /* @__PURE__ */ R(De, { data: e })
				}),
				/* @__PURE__ */ R(w, {
					value: "groups",
					children: /* @__PURE__ */ R(Oe, { data: e })
				}),
				/* @__PURE__ */ R(w, {
					value: "members",
					children: /* @__PURE__ */ R(ke, {})
				}),
				/* @__PURE__ */ R(w, {
					value: "temp",
					children: /* @__PURE__ */ R(je, {})
				})
			]
		})]
	})] });
}
function Ee({ n: e, title: t, done: n, children: r }) {
	return /* @__PURE__ */ z("li", {
		className: "grid grid-cols-[32px_1fr] gap-4",
		children: [/* @__PURE__ */ R("span", {
			className: O("grid size-8 place-items-center border font-mono text-sm", n ? "border-success/40 bg-success-soft text-success-fg" : "border-border-strong text-muted"),
			children: n ? /* @__PURE__ */ R(ce, {}) : e
		}), /* @__PURE__ */ z("div", {
			className: "min-w-0 space-y-3 pb-2",
			children: [/* @__PURE__ */ R("div", {
				className: "pt-1 font-medium",
				children: t
			}), r]
		})]
	});
}
function De({ data: t }) {
	let n = F(), c = t.settings, [l, u] = I({
		host: c.host,
		port: String(c.port),
		server_name: c.server_name,
		username_format: c.username_format,
		display_format: c.display_format,
		allow_cert_auth: c.allow_cert_auth,
		temp_enabled: c.temp_enabled,
		temp_group: c.temp_group,
		temp_display_format: c.temp_display_format,
		temp_max_hours: String(c.temp_max_hours)
	}), d = N({
		mutationFn: () => D.put(`${Z}/admin/settings`, {
			...l,
			port: Number(l.port),
			temp_max_hours: Number(l.temp_max_hours)
		}),
		onSuccess: (e) => {
			n.setQueryData(Q, e), n.invalidateQueries({ queryKey: ["mumble", "me"] }), n.invalidateQueries({ queryKey: ["mumble", "temp"] }), j.success("Saved");
		},
		onError: (e) => j.error(e.message)
	}), f = (e) => u((t) => ({
		...t,
		...e
	})), p = !!c.authenticator_seen_at, m = (e) => `${Z}/admin/authenticator/${e}`;
	return /* @__PURE__ */ z("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_400px]",
		children: [/* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(a, { children: /* @__PURE__ */ z("ol", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ z(Ee, {
					n: 1,
					title: "Where members connect",
					done: !!c.host,
					children: [/* @__PURE__ */ z("div", {
						className: "grid gap-4 sm:grid-cols-[1fr_120px]",
						children: [/* @__PURE__ */ R(g, {
							label: "Server address",
							hint: "The host name members type into Mumble.",
							children: /* @__PURE__ */ R(_, {
								value: l.host,
								onChange: (e) => f({ host: e.target.value }),
								placeholder: "voice.example.com",
								className: "font-mono"
							})
						}), /* @__PURE__ */ R(g, {
							label: "Port",
							children: /* @__PURE__ */ R(_, {
								type: "number",
								value: l.port,
								onChange: (e) => f({ port: e.target.value }),
								className: "font-mono"
							})
						})]
					}), /* @__PURE__ */ R(g, {
						label: "Shown as",
						hint: "A friendly name, e.g. Alliance comms. Empty shows the address.",
						children: /* @__PURE__ */ R(_, {
							value: l.server_name,
							onChange: (e) => f({ server_name: e.target.value }),
							className: "max-w-sm"
						})
					})]
				}),
				/* @__PURE__ */ z(Ee, {
					n: 2,
					title: "How members appear",
					done: !!c.host,
					children: [
						/* @__PURE__ */ z("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ R(g, {
								label: "Login name",
								hint: "Fixed when the account is made. Spaces become underscores.",
								children: /* @__PURE__ */ R(_, {
									value: l.username_format,
									onChange: (e) => f({ username_format: e.target.value }),
									className: "font-mono"
								})
							}), /* @__PURE__ */ R(g, {
								label: "Name in Mumble",
								hint: "Follows the main character at every login.",
								children: /* @__PURE__ */ R(_, {
									value: l.display_format,
									onChange: (e) => f({ display_format: e.target.value }),
									className: "font-mono"
								})
							})]
						}),
						/* @__PURE__ */ z("p", {
							className: "text-xs text-subtle",
							children: [
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
								"."
							]
						}),
						/* @__PURE__ */ R("div", {
							className: "border border-border px-3",
							children: /* @__PURE__ */ R(C, {
								label: "Remember client certificates",
								description: "After a member's first login with the password, their Mumble certificate alone gets them in (how Mumble normally works). Off: the password every time.",
								checked: l.allow_cert_auth,
								onCheckedChange: (e) => f({ allow_cert_auth: e })
							})
						})
					]
				}),
				/* @__PURE__ */ z(Ee, {
					n: 3,
					title: "Temporary access for guests",
					done: !!c.host,
					children: [/* @__PURE__ */ R("div", {
						className: "border border-border px-3",
						children: /* @__PURE__ */ R(C, {
							label: "Temporary access links",
							description: "People with the permission can make links that give guests a login for a while.",
							checked: l.temp_enabled,
							onCheckedChange: (e) => f({ temp_enabled: e })
						})
					}), l.temp_enabled && /* @__PURE__ */ z("div", {
						className: "grid gap-4 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ R(g, {
								label: "Guests' Mumble group",
								hint: "Give it rights on the guest channels in the server's ACLs.",
								children: /* @__PURE__ */ R(_, {
									value: l.temp_group,
									onChange: (e) => f({ temp_group: e.target.value }),
									className: "font-mono"
								})
							}),
							/* @__PURE__ */ R(g, {
								label: "Guests appear as",
								hint: "Placeholder: {name}.",
								children: /* @__PURE__ */ R(_, {
									value: l.temp_display_format,
									onChange: (e) => f({ temp_display_format: e.target.value }),
									className: "font-mono"
								})
							}),
							/* @__PURE__ */ R(g, {
								label: "Longest link (hours)",
								children: /* @__PURE__ */ R(_, {
									type: "number",
									min: 1,
									max: 720,
									value: l.temp_max_hours,
									onChange: (e) => f({ temp_max_hours: e.target.value }),
									className: "font-mono"
								})
							})
						]
					})]
				})
			]
		}) }), /* @__PURE__ */ R(o, { children: /* @__PURE__ */ R(r, {
			variant: "primary",
			loading: d.isPending,
			onClick: () => d.mutate(),
			children: "Save"
		}) })] }), /* @__PURE__ */ z(i, {
			className: "h-fit",
			children: [/* @__PURE__ */ R(s, {
				title: "The authenticator",
				description: "A small program next to the Mumble server that asks this site about every login."
			}), /* @__PURE__ */ z(a, {
				className: "space-y-4 text-sm",
				children: [p ? /* @__PURE__ */ z(e, {
					tone: "success",
					title: "It has called this site",
					children: [
						"Last call ",
						A(c.authenticator_seen_at),
						c.authenticator_version ? `, version ${c.authenticator_version}` : "",
						"."
					]
				}) : /* @__PURE__ */ R(e, {
					tone: "warning",
					title: "Not running yet",
					children: "Until it runs, nobody can sign in to Mumble with their account here."
				}), /* @__PURE__ */ z("ol", {
					className: "list-decimal space-y-3 pl-4 text-muted",
					children: [
						/* @__PURE__ */ z("li", { children: [
							"Under ",
							/* @__PURE__ */ R(M, {
								to: "/admin/api",
								className: "text-accent-ink hover:underline",
								children: "Administration → API"
							}),
							" switch on the ",
							/* @__PURE__ */ R("b", { children: "Mumble" }),
							" API and make a key with the scope below. Copy the key: it's shown once.",
							/* @__PURE__ */ R("div", {
								className: "mt-2",
								children: /* @__PURE__ */ R(J, {
									value: t.scope,
									label: "scope"
								})
							})
						] }),
						/* @__PURE__ */ z("li", { children: [
							"On the Mumble server, turn on Ice in ",
							/* @__PURE__ */ R("span", {
								className: "font-mono",
								children: "murmur.ini"
							}),
							" (",
							/* @__PURE__ */ R("span", {
								className: "font-mono",
								children: "ice=\"tcp -h 127.0.0.1 -p 6502\""
							}),
							" and an",
							/* @__PURE__ */ R("span", {
								className: "font-mono",
								children: " icesecretwrite"
							}),
							"), restart it, and install ",
							/* @__PURE__ */ R("span", {
								className: "font-mono",
								children: "zeroc-ice"
							}),
							" for Python 3."
						] }),
						/* @__PURE__ */ z("li", { children: ["Download these, put them in one folder, fill in the key and the Ice secret in the config, and start the authenticator (the unit file runs it as a service).", /* @__PURE__ */ z("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ R("a", {
									href: m("conduit_mumble_authenticator.py"),
									download: !0,
									children: /* @__PURE__ */ z(r, {
										variant: "secondary",
										size: "sm",
										children: [/* @__PURE__ */ R(he, {}), " Authenticator"]
									})
								}),
								/* @__PURE__ */ R("a", {
									href: m("authenticator.ini"),
									download: !0,
									children: /* @__PURE__ */ z(r, {
										variant: "secondary",
										size: "sm",
										children: [/* @__PURE__ */ R(he, {}), " Config"]
									})
								}),
								/* @__PURE__ */ R("a", {
									href: m("conduit-mumble-authenticator.service"),
									download: !0,
									children: /* @__PURE__ */ z(r, {
										variant: "secondary",
										size: "sm",
										children: [/* @__PURE__ */ R(he, {}), " systemd unit"]
									})
								})
							]
						})] }),
						/* @__PURE__ */ R("li", { children: "In Mumble, give the groups from the next tab (and the guests' group) their rights on the channels under Edit → ACL. The authenticator puts each person into their groups when they connect." })
					]
				})]
			})]
		})]
	});
}
function Oe({ data: e }) {
	let t = F(), [c, l] = I(null), u = c ?? e.mappings, [d, f] = I(""), [p, m] = I(""), v = N({
		mutationFn: (e) => D.put(`${Z}/admin/mappings`, { mappings: e }),
		onSuccess: (e) => {
			t.setQueryData(Q, e), l(null), j.success("Saved; it applies at everyone's next connect");
		},
		onError: (e) => j.error(e.message)
	}), y = () => {
		let [t, n] = d.split(":"), r = p.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "");
		if (!t || !r) return;
		let i = t === "group" ? e.groups.find((e) => e.id === Number(n))?.name : e.states.find((e) => e.id === Number(n))?.name;
		l([...u, {
			kind: t,
			target_id: Number(n),
			target: i,
			mumble_group: r
		}]), m("");
	};
	return /* @__PURE__ */ z("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_340px]",
		children: [/* @__PURE__ */ z(i, { children: [
			/* @__PURE__ */ R(s, {
				title: "Who is in which Mumble group",
				description: "Members of a group, or everyone in a state, are in the Mumble group. A person can match several rows."
			}),
			/* @__PURE__ */ R(a, {
				className: "border-b border-border",
				children: /* @__PURE__ */ z("div", {
					className: "flex flex-wrap items-end gap-3",
					children: [
						/* @__PURE__ */ R(g, {
							label: "Group or state",
							className: "min-w-56 flex-1",
							children: /* @__PURE__ */ z(b, {
								value: d,
								onChange: (e) => f(e.target.value),
								children: [
									/* @__PURE__ */ R("option", {
										value: "",
										children: "Choose…"
									}),
									/* @__PURE__ */ R("optgroup", {
										label: "States",
										children: e.states.map((e) => /* @__PURE__ */ R("option", {
											value: `state:${e.id}`,
											children: e.name
										}, `s${e.id}`))
									}),
									/* @__PURE__ */ R("optgroup", {
										label: "Groups",
										children: e.groups.map((e) => /* @__PURE__ */ R("option", {
											value: `group:${e.id}`,
											children: e.name
										}, `g${e.id}`))
									})
								]
							})
						}),
						/* @__PURE__ */ z(g, {
							label: "Mumble group",
							className: "min-w-56 flex-1",
							hint: "Lower-case letters, digits, - and _; as named in the server's ACLs.",
							children: [/* @__PURE__ */ R(_, {
								list: "mumble-known-groups",
								value: p,
								onChange: (e) => m(e.target.value),
								placeholder: "capitals",
								className: "font-mono",
								onKeyDown: (e) => e.key === "Enter" && y()
							}), /* @__PURE__ */ R("datalist", {
								id: "mumble-known-groups",
								children: e.known_groups.map((e) => /* @__PURE__ */ R("option", { value: e }, e))
							})]
						}),
						/* @__PURE__ */ z(r, {
							disabled: !d || !p.trim(),
							onClick: y,
							children: [/* @__PURE__ */ R(le, {}), " Add"]
						})
					]
				})
			}),
			u.length === 0 ? /* @__PURE__ */ R(h, {
				icon: /* @__PURE__ */ R(V, {}),
				title: "No groups mapped yet",
				description: "Members connect without any Mumble group until you add some."
			}) : /* @__PURE__ */ R("ul", {
				className: "divide-y divide-border",
				children: u.map((e, t) => /* @__PURE__ */ z("li", {
					className: "flex items-center gap-3 px-card py-3 text-sm",
					children: [
						/* @__PURE__ */ R(n, {
							tone: e.kind === "state" ? "info" : "neutral",
							children: e.kind
						}),
						/* @__PURE__ */ R("span", {
							className: "min-w-0 flex-1 truncate font-medium",
							children: e.target
						}),
						/* @__PURE__ */ R("span", {
							className: "text-subtle",
							children: "→"
						}),
						/* @__PURE__ */ R("span", {
							className: "min-w-0 flex-1 truncate font-mono",
							children: e.mumble_group
						}),
						/* @__PURE__ */ R(r, {
							variant: "ghost",
							size: "icon-xs",
							"aria-label": "Remove",
							onClick: () => l(u.filter((e, n) => n !== t)),
							children: /* @__PURE__ */ R(W, {})
						})
					]
				}, `${e.kind}-${e.target_id}-${e.mumble_group}`))
			}),
			c && /* @__PURE__ */ z(o, {
				className: "justify-between",
				children: [/* @__PURE__ */ R("span", {
					className: "text-xs text-muted",
					children: "Unsaved changes"
				}), /* @__PURE__ */ z("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ R(r, {
						variant: "ghost",
						onClick: () => l(null),
						children: "Discard"
					}), /* @__PURE__ */ R(r, {
						variant: "primary",
						loading: v.isPending,
						onClick: () => v.mutate(u),
						children: "Save"
					})]
				})]
			})
		] }), /* @__PURE__ */ z(i, {
			className: "h-fit",
			children: [/* @__PURE__ */ R(s, { title: "How groups work" }), /* @__PURE__ */ z(a, {
				className: "space-y-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ R("p", { children: "Mumble groups are just names. Create the same names on the server's root channel ACL (Edit → ACL → Groups) and give them rights on channels." }),
					/* @__PURE__ */ R("p", { children: "Every time someone connects, the authenticator puts them into the groups their site groups and state map to. Changes apply when they next connect." }),
					/* @__PURE__ */ R("p", { children: "Guests from temporary links get the guests' group from Setup (and more if a manager chose so on the link)." })
				]
			})]
		})]
	});
}
function ke() {
	let e = F(), { data: a, isLoading: o } = P({
		queryKey: ["mumble", "members"],
		queryFn: () => D.get(`${Z}/admin/members`)
	}), [s, g] = I(""), [_, v] = I(null), [b, S] = I(null), C = () => e.invalidateQueries({ queryKey: ["mumble"] }), w = N({
		mutationFn: (e) => D.post(`${Z}/admin/members/${e}/password`),
		onSuccess: (e) => {
			S((t) => t && {
				...t,
				password: e.password
			}), C();
		},
		onError: (e) => j.error(e.message)
	}), re = N({
		mutationFn: (e) => D.delete(`${Z}/admin/members/${e}`),
		onSuccess: () => {
			j.success("Account deleted"), C();
		},
		onError: (e) => j.error(e.message)
	}), { data: O } = P({
		queryKey: Q,
		queryFn: () => D.get(`${Z}/admin`)
	});
	if (o || !a) return /* @__PURE__ */ R(x, { className: "h-64" });
	let k = s.trim().toLowerCase(), ae = k ? a.filter((e) => [
		e.user.name,
		e.username,
		e.display_name,
		...(e.characters ?? []).map((e) => e.name)
	].some((e) => e.toLowerCase().includes(k))) : a;
	return /* @__PURE__ */ z(i, { children: [
		/* @__PURE__ */ R(ne, { children: /* @__PURE__ */ R(y, {
			value: s,
			onChange: (e) => g(e.target.value),
			placeholder: "Member, character or Mumble name",
			className: "w-80"
		}) }),
		ae.length === 0 ? /* @__PURE__ */ R(h, {
			icon: /* @__PURE__ */ R(V, {}),
			title: a.length ? "Nobody matches" : "Nobody has a Mumble account yet"
		}) : /* @__PURE__ */ z(te, { children: [/* @__PURE__ */ R(ee, { children: /* @__PURE__ */ z("tr", { children: [
			/* @__PURE__ */ R(E, { children: "Member" }),
			/* @__PURE__ */ R(E, { children: "Mumble" }),
			/* @__PURE__ */ R(E, { children: "Groups" }),
			/* @__PURE__ */ R(E, { children: "Last connected" }),
			/* @__PURE__ */ R(E, {})
		] }) }), /* @__PURE__ */ R("tbody", { children: ae.map((e) => /* @__PURE__ */ z(ie, { children: [
			/* @__PURE__ */ R(T, { children: /* @__PURE__ */ z("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ R(t, {
					src: e.user.portrait,
					name: e.user.name,
					size: "sm"
				}), /* @__PURE__ */ z("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ R("div", {
							className: "truncate font-medium",
							children: e.user.name
						}),
						!e.has_access && /* @__PURE__ */ R(n, {
							tone: "warning",
							children: "no access"
						}),
						/* @__PURE__ */ R(Ae, {
							list: e.characters ?? [],
							needle: k
						})
					]
				})]
			}) }),
			/* @__PURE__ */ z(T, { children: [/* @__PURE__ */ R("div", {
				className: "text-sm",
				children: e.display_name
			}), /* @__PURE__ */ z("div", {
				className: "font-mono text-xs text-subtle",
				children: [e.username, e.certificate_remembered ? " · cert" : ""]
			})] }),
			/* @__PURE__ */ R(T, { children: /* @__PURE__ */ R("div", {
				className: "flex max-w-72 flex-wrap gap-1",
				children: e.groups_due.length ? e.groups_due.map((e) => /* @__PURE__ */ R(n, {
					tone: "accent",
					children: e
				}, e)) : /* @__PURE__ */ R("span", {
					className: "text-xs text-subtle",
					children: "none"
				})
			}) }),
			/* @__PURE__ */ R(T, {
				className: "text-sm text-muted",
				children: e.last_login_at ? A(e.last_login_at) : "never"
			}),
			/* @__PURE__ */ R(T, {
				align: "right",
				children: /* @__PURE__ */ z(f, { children: [/* @__PURE__ */ R(m, {
					asChild: !0,
					children: /* @__PURE__ */ R(r, {
						variant: "ghost",
						size: "sm",
						children: "Actions"
					})
				}), /* @__PURE__ */ z(u, {
					align: "end",
					children: [
						/* @__PURE__ */ z(d, {
							onSelect: () => S({ m: e }),
							children: [/* @__PURE__ */ R(H, {}), " New password"]
						}),
						/* @__PURE__ */ R(p, {}),
						/* @__PURE__ */ z(d, {
							danger: !0,
							onSelect: () => v(e),
							children: [/* @__PURE__ */ R(W, {}), " Delete account"]
						})
					]
				})] })
			})
		] }, e.user.id)) })] }),
		/* @__PURE__ */ R(c, {
			open: !!_,
			onOpenChange: (e) => !e && v(null),
			title: `Delete ${_?.user.name}'s Mumble account?`,
			description: "They can't connect until they make a new one; they're told why.",
			danger: !0,
			confirmLabel: "Delete",
			onConfirm: () => _ && re.mutateAsync(_.user.id)
		}),
		/* @__PURE__ */ R(l, {
			open: !!b,
			onOpenChange: (e) => !e && S(null),
			title: `New password for ${b?.m.user.name}`,
			description: b?.password ? "Pass it on to them; it isn't shown again. They've been told you reset it." : "Their old password stops working straight away.",
			footer: b?.password ? /* @__PURE__ */ R(r, {
				variant: "primary",
				onClick: () => S(null),
				children: "Done"
			}) : /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(r, {
				variant: "ghost",
				onClick: () => S(null),
				children: "Cancel"
			}), /* @__PURE__ */ z(r, {
				variant: "primary",
				loading: w.isPending,
				onClick: () => b && w.mutate(b.m.user.id),
				children: [/* @__PURE__ */ R(H, {}), " Reset password"]
			})] }),
			children: b?.password && O && /* @__PURE__ */ R(Y, {
				server: {
					name: O.settings.server_name || O.settings.host,
					host: O.settings.host,
					port: O.settings.port
				},
				username: b.m.username,
				password: b.password
			})
		})
	] });
}
function Ae({ list: e, needle: t }) {
	let [r, i] = I(!1);
	if (!e.length) return null;
	let a = r ? e : e.filter((e, n) => n < 3 || t && e.name.toLowerCase().includes(t)), o = (e) => /* @__PURE__ */ z("span", {
		className: O("truncate", e.main ? "text-text" : "text-muted"),
		children: [e.name, e.corporation && /* @__PURE__ */ z("span", {
			className: "ml-1 text-subtle",
			children: [
				"[",
				e.corporation,
				"]"
			]
		})]
	});
	return /* @__PURE__ */ z("div", {
		className: "mt-1.5 space-y-1",
		children: [a.map((e) => /* @__PURE__ */ z("div", {
			className: "flex items-center gap-1.5 text-xs",
			children: [
				/* @__PURE__ */ R("img", {
					src: e.portrait,
					alt: "",
					className: "size-4 shrink-0"
				}),
				e.viewable ? /* @__PURE__ */ R(M, {
					to: `/characters/${e.id}`,
					className: "flex min-w-0 hover:text-accent-ink hover:underline",
					children: o(e)
				}) : o(e),
				e.main && /* @__PURE__ */ R(n, {
					size: "xs",
					children: "main"
				})
			]
		}, e.id)), e.length > a.length && /* @__PURE__ */ z("button", {
			type: "button",
			onClick: () => i(!0),
			className: "text-xs text-accent-ink hover:underline",
			children: [
				e.length - a.length,
				" more character",
				e.length - a.length === 1 ? "" : "s"
			]
		})]
	});
}
function je() {
	let e = F(), { data: t, isLoading: n } = P({
		queryKey: [
			"mumble",
			"admin",
			"temp"
		],
		queryFn: () => D.get(`${Z}/admin/temp`)
	}), [r, a] = I(null), o = N({
		mutationFn: (e) => D.delete(`${Z}/temp/${e}`),
		onSuccess: () => {
			j.success("Link withdrawn"), e.invalidateQueries({ queryKey: ["mumble"] });
		},
		onError: (e) => j.error(e.message)
	});
	return n || !t ? /* @__PURE__ */ R(x, { className: "h-64" }) : t.length === 0 ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(h, {
		icon: /* @__PURE__ */ R(V, {}),
		title: "No temporary links yet",
		description: "People with the permission make them under Mumble → Temporary access."
	}) }) : /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R("div", {
		className: "grid gap-4 lg:grid-cols-2",
		children: t.map((e) => /* @__PURE__ */ R(Se, {
			link: e,
			showOwner: !0,
			onRevoke: () => a(e)
		}, e.id))
	}), /* @__PURE__ */ R(c, {
		open: !!r,
		onOpenChange: (e) => !e && a(null),
		title: `Withdraw "${r?.label}"?`,
		description: "The link stops working and its guests are cut off at their next connect.",
		danger: !0,
		confirmLabel: "Withdraw",
		onConfirm: () => r && o.mutateAsync(r.id)
	})] });
}
//#endregion
//#region src/member.tsx
var $ = ["mumble", "me"];
function Me() {
	return P({
		queryKey: $,
		queryFn: () => D.get(`${Z}/me`)
	});
}
function Ne({ open: e, onOpenChange: t, title: n, description: i, submitLabel: a, onSubmit: o, pending: s }) {
	let [c, u] = I(!1), [d, f] = I(""), p = c && d.trim().length < 8;
	return /* @__PURE__ */ R(l, {
		open: e,
		onOpenChange: (e) => {
			t(e), e || (u(!1), f(""));
		},
		title: n,
		description: i,
		footer: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(r, {
			variant: "ghost",
			onClick: () => t(!1),
			children: "Cancel"
		}), /* @__PURE__ */ R(r, {
			variant: "primary",
			loading: s,
			disabled: p,
			onClick: () => o(c ? d.trim() : ""),
			children: a
		})] }),
		children: /* @__PURE__ */ z("div", {
			className: "space-y-3",
			children: [/* @__PURE__ */ z("label", {
				className: "flex cursor-pointer items-start gap-3 border border-border p-3 text-sm has-[:checked]:border-accent",
				children: [/* @__PURE__ */ R("input", {
					type: "radio",
					name: "pw",
					className: "mt-0.5",
					checked: !c,
					onChange: () => u(!1)
				}), /* @__PURE__ */ z("span", { children: [/* @__PURE__ */ R("span", {
					className: "font-medium",
					children: "Make one up for me"
				}), /* @__PURE__ */ R("span", {
					className: "block text-xs text-muted",
					children: "A random password, shown once. Mumble remembers it for you."
				})] })]
			}), /* @__PURE__ */ z("label", {
				className: "flex cursor-pointer items-start gap-3 border border-border p-3 text-sm has-[:checked]:border-accent",
				children: [/* @__PURE__ */ R("input", {
					type: "radio",
					name: "pw",
					className: "mt-0.5",
					checked: c,
					onChange: () => u(!0)
				}), /* @__PURE__ */ z("span", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ R("span", {
							className: "font-medium",
							children: "I'll choose one"
						}),
						/* @__PURE__ */ R("span", {
							className: "block text-xs text-muted",
							children: "At least 8 characters. Don't reuse your EVE or email password."
						}),
						c && /* @__PURE__ */ R(_, {
							type: "password",
							autoComplete: "new-password",
							autoFocus: !0,
							value: d,
							onChange: (e) => f(e.target.value),
							className: "mt-2",
							placeholder: "Mumble password"
						})
					]
				})]
			})]
		})
	});
}
function Pe() {
	let t = F(), o = ae("mumble.manage_mumble"), { data: l, isLoading: u } = Me(), [d, f] = I(!1), [p, m] = I(!1), [g, _] = I(!1), [y, b] = I(null), S = (e, n) => {
		t.setQueryData($, e), b({
			password: e.password,
			url: e.connect_url
		}), f(!1), m(!1), j.success(n);
	}, C = N({
		mutationFn: (e) => D.post(`${Z}/account`, { password: e }),
		onSuccess: (e) => S(e, "Your Mumble account is ready"),
		onError: (e) => j.error(e.message)
	}), ee = N({
		mutationFn: (e) => D.post(`${Z}/account/password`, { password: e }),
		onSuccess: (e) => S(e, "New password set"),
		onError: (e) => j.error(e.message)
	}), w = N({
		mutationFn: () => D.delete(`${Z}/account/certificate`),
		onSuccess: (e) => {
			t.setQueryData($, e), j.success("Certificate forgotten; next time Mumble asks for your password");
		},
		onError: (e) => j.error(e.message)
	}), te = N({
		mutationFn: () => D.delete(`${Z}/account`),
		onSuccess: (e) => {
			t.setQueryData($, e), b(null), j.success("Mumble account deleted");
		},
		onError: (e) => j.error(e.message)
	});
	return /* @__PURE__ */ z(L, { children: [
		/* @__PURE__ */ R(v, {
			eyebrow: "Communication",
			title: "Mumble",
			icon: /* @__PURE__ */ R(V, {}),
			description: "Voice comms. Your Mumble account follows your groups and main character; you only need a password.",
			actions: /* @__PURE__ */ z("div", {
				className: "flex gap-2",
				children: [l?.can_temp && /* @__PURE__ */ R(M, {
					to: "/p/mumble/temp",
					children: /* @__PURE__ */ z(r, { children: [/* @__PURE__ */ R(G, {}), " Temporary access"] })
				}), o && /* @__PURE__ */ R(M, {
					to: "/p/mumble/admin",
					children: /* @__PURE__ */ z(r, { children: [/* @__PURE__ */ R(se, {}), " Server setup"] })
				})]
			})
		}),
		u || !l ? /* @__PURE__ */ R(x, { className: "h-56" }) : l.configured ? l.account ? /* @__PURE__ */ z("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_360px]",
			children: [/* @__PURE__ */ z("div", {
				className: "space-y-6",
				children: [
					y && /* @__PURE__ */ R(e, {
						tone: "success",
						title: "Your password. Keep it: it isn't shown again.",
						action: /* @__PURE__ */ R(r, {
							size: "sm",
							variant: "ghost",
							onClick: () => b(null),
							children: "Done"
						}),
						children: /* @__PURE__ */ R("div", {
							className: "mt-2",
							children: /* @__PURE__ */ R(Y, {
								server: l.server,
								username: l.account.username,
								password: y.password,
								url: y.url
							})
						})
					}),
					/* @__PURE__ */ z(i, { children: [/* @__PURE__ */ z("div", {
						className: "flex flex-col gap-5 p-card sm:flex-row sm:items-start",
						children: [/* @__PURE__ */ R("span", {
							className: "grid size-14 shrink-0 place-items-center bg-accent-soft text-accent-ink",
							children: /* @__PURE__ */ R(V, { className: "size-7" })
						}), /* @__PURE__ */ z("div", {
							className: "min-w-0 flex-1 space-y-4",
							children: [/* @__PURE__ */ z("div", { children: [
								/* @__PURE__ */ z("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ R("span", {
										className: "text-lg font-semibold",
										children: l.account.display_name
									}), /* @__PURE__ */ z(n, {
										tone: "success",
										children: [/* @__PURE__ */ R(ce, { className: "size-3" }), " Account ready"]
									})]
								}),
								/* @__PURE__ */ z("div", {
									className: "text-sm text-muted",
									children: ["on ", l.server.name]
								}),
								/* @__PURE__ */ z("div", {
									className: "mt-1 text-xs text-subtle",
									children: [
										"Created ",
										A(l.account.created_at),
										" · ",
										l.account.last_login_at ? `last connected ${A(l.account.last_login_at)}` : "never connected yet"
									]
								})
							] }), !y && /* @__PURE__ */ R(Y, {
								server: l.server,
								username: l.account.username,
								url: l.account.url
							})]
						})]
					}), /* @__PURE__ */ z("div", {
						className: "flex flex-wrap gap-2 border-t border-border px-card py-3",
						children: [
							/* @__PURE__ */ z(r, {
								variant: "secondary",
								onClick: () => m(!0),
								children: [/* @__PURE__ */ R(H, {}), " New password"]
							}),
							l.account.certificate_remembered && /* @__PURE__ */ z(r, {
								variant: "ghost",
								loading: w.isPending,
								onClick: () => w.mutate(),
								children: [/* @__PURE__ */ R(pe, {}), " Forget my certificate"]
							}),
							/* @__PURE__ */ z(r, {
								variant: "danger",
								onClick: () => _(!0),
								children: [/* @__PURE__ */ R(W, {}), " Delete account"]
							})
						]
					})] }),
					l.cert_auth && /* @__PURE__ */ R("p", {
						className: "text-xs text-subtle",
						children: l.account.certificate_remembered ? "Your Mumble certificate is remembered: that computer gets in without the password. Forget it if you've switched machines or want to be asked again." : "After your first login with the password, the server remembers your Mumble certificate and lets that computer in without it."
					})
				]
			}), /* @__PURE__ */ z(i, {
				className: "h-fit",
				children: [/* @__PURE__ */ R(s, {
					title: "Your Mumble groups",
					description: "For the server's channel permissions. They're worked out fresh every time you connect."
				}), /* @__PURE__ */ z(a, { children: [/* @__PURE__ */ R(ge, {
					groups: l.groups_due,
					empty: "None of your groups come with a Mumble group."
				}), l.account.groups.join() !== l.groups_due.join() && l.account.last_login_at && /* @__PURE__ */ R("p", {
					className: "mt-3 text-xs text-subtle",
					children: "Changed since you last connected; reconnect to pick them up."
				})] })]
			})]
		}) : /* @__PURE__ */ R(i, { children: /* @__PURE__ */ z("div", {
			className: "grid gap-8 p-card sm:p-8 lg:grid-cols-[1fr_320px] lg:items-center",
			children: [/* @__PURE__ */ z("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ z("div", {
					className: "flex items-center gap-3 text-accent-ink",
					children: [/* @__PURE__ */ R(V, { className: "size-8" }), /* @__PURE__ */ R("span", {
						className: "text-xl font-semibold text-text",
						children: l.server.name
					})]
				}), l.can_link ? /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R("p", {
					className: "max-w-prose text-sm text-muted",
					children: "Make your Mumble account here, then connect with the Mumble client. Your name and groups in Mumble come from this site, so there's nothing to register on the server itself."
				}), /* @__PURE__ */ z(r, {
					variant: "primary",
					size: "lg",
					onClick: () => f(!0),
					children: [/* @__PURE__ */ R(H, {}), " Create my Mumble account"]
				})] }) : /* @__PURE__ */ R(e, {
					tone: "warning",
					title: "You don't have access to Mumble",
					children: "Access comes with your membership. Ask your corporation's leadership if you think you should have it."
				})]
			}), l.can_link && /* @__PURE__ */ z("div", {
				className: "border border-border bg-bg/40 p-4 text-sm",
				children: [
					/* @__PURE__ */ R("div", {
						className: "mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
						children: "You'll be"
					}),
					/* @__PURE__ */ R("div", {
						className: "font-medium",
						children: l.display_preview
					}),
					/* @__PURE__ */ z("div", {
						className: "mb-3 font-mono text-xs text-muted",
						children: ["login: ", l.username_preview]
					}),
					/* @__PURE__ */ R(ge, {
						groups: l.groups_due,
						empty: "No Mumble groups yet; they come with your groups."
					})
				]
			})]
		}) }) : /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(h, {
			icon: /* @__PURE__ */ R(V, {}),
			title: "Mumble isn't set up yet",
			description: o ? "Enter the server's address under Server setup." : "Your leadership hasn't connected a Mumble server to this site yet.",
			action: o ? /* @__PURE__ */ R(M, {
				to: "/p/mumble/admin",
				children: /* @__PURE__ */ z(r, {
					variant: "primary",
					children: [/* @__PURE__ */ R(se, {}), " Server setup"]
				})
			}) : void 0
		}) }),
		/* @__PURE__ */ R(Ne, {
			open: d,
			onOpenChange: f,
			title: "Create your Mumble account",
			description: `You'll sign in as ${l?.username_preview ?? "…"}.`,
			submitLabel: "Create account",
			pending: C.isPending,
			onSubmit: (e) => C.mutate(e)
		}),
		/* @__PURE__ */ R(Ne, {
			open: p,
			onOpenChange: m,
			title: "New Mumble password",
			description: "The old one stops working straight away. Update it in your Mumble client's server list.",
			submitLabel: "Set password",
			pending: ee.isPending,
			onSubmit: (e) => ee.mutate(e)
		}),
		/* @__PURE__ */ R(c, {
			open: g,
			onOpenChange: _,
			title: "Delete your Mumble account?",
			description: "You can't connect to Mumble until you make a new one. Your username may be taken by then.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(W, {}), " Delete"] }),
			onConfirm: () => te.mutateAsync()
		})
	] });
}
//#endregion
//#region src/public.tsx
function Fe() {
	let { token: t } = oe(), { data: n, isLoading: o, error: c } = P({
		queryKey: [
			"mumble",
			"public",
			t
		],
		queryFn: () => D.get(`${ve}/temp/${t}`),
		retry: !1
	}), [l, u] = I(""), [d, f] = I(null), p = N({
		mutationFn: () => D.post(`${ve}/temp/${t}`, { name: l.trim() }),
		onSuccess: f,
		onError: (e) => j.error(e.message)
	});
	return o ? /* @__PURE__ */ R(x, { className: "h-64" }) : c || !n ? /* @__PURE__ */ R(i, {
		className: "mx-auto max-w-xl",
		children: /* @__PURE__ */ R(h, {
			icon: /* @__PURE__ */ R(V, {}),
			title: "This link doesn't work",
			description: "It may have been withdrawn, or it was copied wrongly. Ask whoever gave it to you for a new one."
		})
	}) : /* @__PURE__ */ z("div", {
		className: "mx-auto max-w-2xl",
		children: [/* @__PURE__ */ R(v, {
			icon: /* @__PURE__ */ R(V, {}),
			eyebrow: "Temporary voice access",
			title: n.server,
			description: /* @__PURE__ */ z(L, { children: [
				n.invited_by ? /* @__PURE__ */ z(L, { children: [n.invited_by, " invited you"] }) : "You're invited",
				" for ",
				/* @__PURE__ */ R("b", { children: n.label }),
				"."
			] })
		}), d ? /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(s, {
			title: `Welcome, ${d.display_name}`,
			description: "Keep this page open or copy the details: the password isn't shown again."
		}), /* @__PURE__ */ z(a, {
			className: "space-y-4",
			children: [/* @__PURE__ */ R(Y, {
				server: {
					name: d.server,
					host: d.host,
					port: d.port
				},
				username: d.username,
				password: d.password,
				url: d.url
			}), /* @__PURE__ */ z(e, {
				tone: "info",
				title: `Access ends ${new Date(d.expires_at).toLocaleString()}`,
				icon: /* @__PURE__ */ R(G, {}),
				children: [X(d.expires_at), ". In the Mumble client: Server → Connect → Add New, paste the address, port and username, then connect and enter the password when asked."]
			})]
		})] }) : n.status === "active" ? /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(s, {
			title: "Choose a name",
			description: "That's how you'll appear in Mumble. Letters and digits work best."
		}), /* @__PURE__ */ z(a, {
			className: "space-y-4",
			children: [/* @__PURE__ */ z("form", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-end",
				onSubmit: (e) => {
					e.preventDefault(), l.trim().length >= 2 && p.mutate();
				},
				children: [/* @__PURE__ */ R(g, {
					label: "Your name",
					className: "flex-1",
					children: /* @__PURE__ */ R(_, {
						autoFocus: !0,
						value: l,
						onChange: (e) => u(e.target.value),
						maxLength: 60,
						placeholder: "e.g. Jane from Blue Corp"
					})
				}), /* @__PURE__ */ z(r, {
					type: "submit",
					variant: "primary",
					size: "lg",
					loading: p.isPending,
					disabled: l.trim().length < 2,
					children: [/* @__PURE__ */ R(V, {}), " Get my login"]
				})]
			}), /* @__PURE__ */ z("p", {
				className: "text-xs text-subtle",
				children: [
					/* @__PURE__ */ R(G, { className: "mr-1 inline size-3 align-[-2px]" }),
					"Valid until ",
					new Date(n.expires_at).toLocaleString(),
					" (",
					X(n.expires_at),
					"). You'll need the free Mumble client from mumble.info."
				]
			})]
		})] }) : /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(h, {
			icon: /* @__PURE__ */ R(G, {}),
			title: "This link is closed",
			description: {
				expired: "This link has expired. Ask whoever gave it to you for a new one.",
				revoked: "This link was withdrawn.",
				used_up: "This link has been used by as many people as it allows."
			}[n.status]
		}) })]
	});
}
//#endregion
//#region src/index.tsx
function Ie() {
	let { data: e, isLoading: t } = Me();
	return t ? /* @__PURE__ */ R(x, { className: "h-16" }) : !e?.configured || !e.account && !e.can_link ? null : e.account ? /* @__PURE__ */ z(M, {
		to: "/p/mumble",
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ z("div", {
			className: "flex min-w-0 items-center gap-3",
			children: [/* @__PURE__ */ R(V, { className: "size-7 shrink-0 text-accent-ink" }), /* @__PURE__ */ z("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ R("div", {
					className: "truncate font-medium",
					children: e.account.display_name
				}), /* @__PURE__ */ R("div", {
					className: "truncate text-xs text-muted",
					children: e.groups_due.length ? e.groups_due.join(" · ") : "no groups"
				})]
			})]
		}), /* @__PURE__ */ R(n, {
			tone: "success",
			children: "Ready"
		})]
	}) : /* @__PURE__ */ z("div", {
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ z("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ R(V, { className: "size-7 text-accent-ink" }), /* @__PURE__ */ z("div", { children: [/* @__PURE__ */ z("div", {
				className: "font-medium",
				children: ["Get on ", e.server.name]
			}), /* @__PURE__ */ R("div", {
				className: "text-xs text-muted",
				children: "Make your Mumble account to join voice comms."
			})] })]
		}), /* @__PURE__ */ R(M, {
			to: "/p/mumble",
			children: /* @__PURE__ */ R(r, {
				variant: "primary",
				size: "sm",
				children: "Set up"
			})
		})]
	});
}
var Le = k({
	routes: [
		{
			path: "",
			Component: Pe
		},
		{
			path: "temp",
			Component: xe
		},
		{
			path: "admin",
			Component: Te
		}
	],
	publicRoutes: [{
		path: "temp/:token",
		Component: Fe
	}],
	widgets: [{
		id: "account",
		title: "Mumble",
		Component: Ie,
		size: "sm",
		order: 21
	}]
});
//#endregion
export { Le as default };

export const classes = ["!data","!o","---","-----------------------------------------------------------------------------------------------","-----------------------------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------------------","-h","-p","@conduit/sdk","@tanstack/react-query","a","about","accent","access","account","accounts","action","actions","active","add","address","admin","after","align","align-[-2px]","alive","all","allow_cert_auth","alone","alt","alts","always","an","and","any","appear","applies","apply","are","aria-label","as","asked","asks","at","authenticator","authenticator_seen_at","authenticator_version","autoComplete","autoFocus","be","become","been","bg-accent-soft","bg-bg/40","bg-success-soft","block","boolean","border","border-accent","border-b","border-border","border-border-strong","border-success/40","border-t","but","button","by","call","called","can","canManage","can_link","can_manage","can_temp","capitals","cert","cert_auth","certificate","certificate_remembered","certificates","change","changes","channel","channels","character","characters","checked","children","choose","chose","className","client","closed","color","com","come","comes","comms","computer","configured","confirmLabel","connect","connect_url","connected","const","copied","copy","corporation","count","create","created_at","created_by","creating","current","currentColor","cursor-pointer","cut","cx","cy","danger","dashboard","data","days","decide","default","default_group","del","delete","deleted","description","details","digits","disabled","display_format","display_name","display_preview","divide-border","divide-y","doesn","don","done","each","else","email","empty","enabled","end","ended","ends","enter","error","every","everyone","expired","expires_at","export","extends","eyebrow","few","file","fill","fills","first","flex","flex-1","flex-col","flex-wrap","follows","font-medium","font-mono","font-semibold","footer","for","forget","free","fresh","friendly","from","function","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-5","gap-6","gap-8","gave","get","gets","ghost","give","grid","grid-cols-[32px_1fr]","group","groups","groups_due","guest","guests","h","h-16","h-56","h-64","h-96","h-fit","handed","has","has-[:checked]:border-accent","has_access","hasn","have","height","here","hint","host","hours","hover:border-border-strong","hover:text-accent-ink","hover:text-text","hover:underline","how","href","i","ice","icesecretwrite","icon","icon-xs","icons","id","if","import","in","info","ini","inline","inline-flex","install","instead","interface","into","invited","invited_by","is","isLoading","isn","iso","it","items","items-center","items-end","items-start","items-stretch","its","j","join","joined","just","justify-between","key","kind","known_groups","label","last","last_login_at","lasts","leadership","least","left","length","let","lets","lg","lg:grid-cols-2","lg:grid-cols-[1fr_320px]","lg:items-center","limit","link","links","list","list-decimal","lists","live","ll","loading","login","long","look","m","m12","m15.5","m21","m4.9","machines","main","make","manage_mumble","manager","managers","many","map","mapped","mappings","match","matches","matching","max","max-w-2xl","max-w-72","max-w-prose","max-w-sm","max-w-xl","maxLength","max_hours","max_uses","may","mb-2","mb-3","me","meeting","member","members","message","min","min-w-0","min-w-56","ml-1","mono","more","most","mr-1","ms","mt-0.5","mt-1","mt-1.5","mt-2","mt-3","mumble","mumble-known-groups","mumble_group","mutationFn","mx-auto","my","name","named","names","need","needle","needs","neutral","never","new","new-password","next","no","nobody","none","normally","not","nothing","nowhere","nudge","null","number","of","off","old","on","onChange","onCheckedChange","onClick","onConfirm","onCut","onError","onFocus","onKeyDown","onMade","onOpenChange","onRevoke","onSelect","onSubmit","onSuccess","onValueChange","once","one","only","opacity-75","open","opens","or","order","out","overview","own","p-3","p-4","p-card","page","password","password_changed_at","past","paste","patch","path","pb-2","pending","people","permission","person","pick","pills","pl-4","place-items-center","placeholder","plus","points","port","portrait","post","presets","primary","program","pt-1","public","publicRoutes","put","puts","pw","px-2.5","px-3","px-card","py","py-1","py-2","py-3","qc","queryFn","queryKey","radio","random","re","react","react-router","readOnly","ready","reconnect","redeem","refresh","register","remembered","remembers","remove","reset","resetPw","rest","restart","retry","return","reuse","revoke","revoked","revoking","right","rights","root","round","routes","rows","running","runs","rx","ry","s","same","save","scope","search","secondary","secret","see","seen","select","send","server","server_name","service","set","setChanging","setConfirmDelete","setCreating","setForm","setFresh","setGroups","setHours","setLabel","setLogin","setMade","setMaxUses","setName","setOpen","setOwn","setPassword","setQ","setRemove","setReset","setRevoking","setRows","setShowPast","setTab","setTarget","settings","setup","several","shared","should","showOwner","shown","shows","shrink-0","sign","since","site","site_url","size","size-14","size-3","size-3.5","size-4","size-7","size-8","sm","sm:flex-row","sm:grid-cols-2","sm:grid-cols-3","sm:grid-cols-4","sm:grid-cols-[1fr_120px]","sm:grid-cols-[auto_1fr]","sm:items-center","sm:items-end","sm:items-start","sm:p-8","small","so","someone","space-y-1","space-y-3","space-y-4","space-y-6","src","stand","start","state","states","stats","status","stops","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","submit","submitLabel","success","switch","switched","systemd","t","tab","taken","target","target_id","tcp","temp","temp_active","temp_display_format","temp_enabled","temp_group","temp_links","temp_max_hours","temporary","text","text-[11px]","text-accent-ink","text-lg","text-muted","text-sm","text-subtle","text-success-fg","text-text","text-xl","text-xs","than","that","the","their","them","then","there","they","things","think","this","through","time","title","to","toast","toggle","token","told","tone","tooShort","tracking-[0.12em]","true","truncate","turn","type","undefined","under","unit","until","untilText","up","uppercase","url","use","useMe","useParams","useQuery","useQueryClient","useState","used","used_up","user","username","username_format","username_preview","users","uses","v","value","variant","ve","version","viewBox","viewable","voice","void","w-80","want","warning","was","what","when","where","which","who","whoever","widgets","width","with","withdraw","withdrawn","without","work","worked","working","x","x1","x2","xl:grid-cols-[1fr_340px]","xl:grid-cols-[1fr_360px]","xl:grid-cols-[1fr_400px]","xs","y1","y2","yet","you","your","zeroc-ice"];
