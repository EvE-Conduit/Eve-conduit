import { Avatar as e, Badge as t, Button as n, Callout as r, Card as i, CardBody as a, ConfirmDialog as o, Dialog as s, EmptyState as c, Field as l, Input as u, PageHeader as d, RoleChips as f, SearchInput as p, Segmented as m, Select as h, Skeleton as g, THead as _, Table as v, Td as y, Textarea as b, Th as x, Tr as S, api as C, dateTime as w, definePlugin as T, toast as E } from "@conduit/sdk";
import { useInfiniteQuery as D, useMutation as O, useQuery as k, useQueryClient as A } from "@tanstack/react-query";
import { Link as j, useParams as M } from "react-router";
import { Fragment as N, jsx as P, jsxs as F } from "react/jsx-runtime";
import { useEffect as I, useState as L } from "react";
//#region src/icons.tsx
function R({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ P("svg", {
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
var z = (e) => /* @__PURE__ */ F(R, {
	...e,
	children: [
		/* @__PURE__ */ P("path", { d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" }),
		/* @__PURE__ */ P("path", { d: "M13 5v2" }),
		/* @__PURE__ */ P("path", { d: "M13 17v2" }),
		/* @__PURE__ */ P("path", { d: "M13 11v2" })
	]
}), B = (e) => /* @__PURE__ */ F(R, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ P("path", { d: "M19 12H5" })]
}), V = (e) => /* @__PURE__ */ F(R, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "M5 12h14" }), /* @__PURE__ */ P("path", { d: "M12 5v14" })]
}), H = (e) => /* @__PURE__ */ F(R, {
	...e,
	children: [
		/* @__PURE__ */ P("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ P("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ P("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), U = "/api/p/tickets", W = {
	discord: "Discord",
	mail: "EVE mail",
	both: "Discord + EVE mail"
};
//#endregion
//#region src/mine.tsx
function G() {
	let { data: e } = k({
		queryKey: ["tickets", "mine"],
		queryFn: () => C.get(`${U}/mine?limit=200`)
	});
	return /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ P(d, {
		eyebrow: "Discord",
		title: "My tickets",
		icon: /* @__PURE__ */ P(z, {}),
		description: "Tickets you opened from a panel on Discord. You can read each one here once it's closed."
	}), e ? e.items.length === 0 ? /* @__PURE__ */ P(c, {
		icon: /* @__PURE__ */ P(z, {}),
		title: "No tickets",
		description: "Use a ticket panel on the Discord server to open one."
	}) : /* @__PURE__ */ F(v, { children: [/* @__PURE__ */ P(_, { children: /* @__PURE__ */ F("tr", { children: [
		/* @__PURE__ */ P(x, { children: "Subject" }),
		/* @__PURE__ */ P(x, { children: "Opened" }),
		/* @__PURE__ */ P(x, { children: "Closed" }),
		/* @__PURE__ */ P(x, {})
	] }) }), /* @__PURE__ */ P("tbody", { children: e.items.map((e) => /* @__PURE__ */ F(S, { children: [
		/* @__PURE__ */ F(y, {
			className: "max-w-xs font-medium",
			children: [/* @__PURE__ */ P(j, {
				to: `/p/tickets/${e.id}`,
				className: "block truncate hover:text-accent-ink",
				title: e.subject,
				children: e.subject
			}), /* @__PURE__ */ P("span", {
				className: "block text-xs font-normal text-muted",
				children: e.panel
			})]
		}),
		/* @__PURE__ */ P(y, {
			className: "whitespace-nowrap text-muted",
			children: w(e.opened_at)
		}),
		/* @__PURE__ */ P(y, {
			className: "whitespace-nowrap text-muted",
			children: e.closed_at ? w(e.closed_at) : /* @__PURE__ */ P(t, {
				tone: "accent",
				children: "Open"
			})
		}),
		/* @__PURE__ */ P(y, { children: e.url && !e.closed_at && /* @__PURE__ */ F("a", {
			href: e.url,
			target: "_blank",
			rel: "noreferrer",
			className: "inline-flex items-center gap-1 text-sm hover:text-accent-ink",
			children: ["Open in Discord ", /* @__PURE__ */ P(H, { className: "size-3.5" })]
		}) })
	] }, e.id)) })] }) : /* @__PURE__ */ P(g, { className: "h-48" })] });
}
//#endregion
//#region src/panels.tsx
var K = 5;
function q() {
	let [e, t] = L(null), [s, l] = L(null), u = A(), { data: f } = k({
		queryKey: ["tickets", "panels"],
		queryFn: () => C.get(`${U}/panels`)
	}), p = O({
		mutationFn: (e) => C.delete(`${U}/panels/${e.id}`),
		onSuccess: () => {
			u.invalidateQueries({ queryKey: ["tickets", "panels"] }), E.success("Panel deleted"), l(null);
		},
		onError: (e) => E.error(e.message)
	}), m = (e) => f?.channels.find((t) => t.id === e)?.name ?? e, h = /* @__PURE__ */ F(n, {
		variant: "primary",
		onClick: () => t("new"),
		children: [/* @__PURE__ */ P(V, {}), " New panel"]
	});
	return /* @__PURE__ */ F(N, { children: [
		/* @__PURE__ */ P(d, {
			eyebrow: "Discord",
			title: "Ticket panels",
			icon: /* @__PURE__ */ P(z, {}),
			description: "Post a message with buttons in a Discord channel. Anyone who can see the channel and has linked Discord can open a ticket with them.",
			actions: h
		}),
		f ? /* @__PURE__ */ F("div", {
			className: "space-y-4",
			children: [
				f.problems.length > 0 && /* @__PURE__ */ P(r, {
					tone: "warning",
					children: /* @__PURE__ */ P("ul", {
						className: "list-disc space-y-1 pl-4",
						children: f.problems.map((e) => /* @__PURE__ */ P("li", { children: e }, e))
					})
				}),
				/* @__PURE__ */ P(i, { children: /* @__PURE__ */ F(a, {
					className: "space-y-2",
					children: [/* @__PURE__ */ F("p", {
						className: "text-sm text-muted",
						children: [
							"On the ",
							/* @__PURE__ */ P("strong", { children: "General Information" }),
							" page of your Discord application, set ",
							/* @__PURE__ */ P("strong", { children: "Interactions Endpoint URL" }),
							" to this address, so clicks reach the site:"
						]
					}), /* @__PURE__ */ P("code", {
						className: "block break-all text-sm",
						children: f.endpoint_url
					})]
				}) }),
				f.panels.length === 0 ? /* @__PURE__ */ P(c, {
					icon: /* @__PURE__ */ P(z, {}),
					title: "No panels",
					description: "Each button has its own Discord roles and category.",
					action: h
				}) : f.panels.map((e) => /* @__PURE__ */ P(i, { children: /* @__PURE__ */ F(a, {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ F("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ P("span", {
							className: "block font-medium",
							children: e.title
						}), /* @__PURE__ */ F("span", {
							className: "block text-sm text-muted",
							children: [
								"#",
								m(e.channel_id),
								" · ",
								e.buttons.map((e) => e.label).join(", ")
							]
						})]
					}), /* @__PURE__ */ F("span", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ P(n, {
							size: "sm",
							variant: "outline",
							onClick: () => t(e),
							children: "Edit"
						}), /* @__PURE__ */ P(n, {
							size: "sm",
							variant: "ghost",
							onClick: () => l(e),
							children: "Delete"
						})]
					})]
				}) }, e.id))
			]
		}) : /* @__PURE__ */ P(g, { className: "h-48" }),
		e && f && /* @__PURE__ */ P(J, {
			panel: e === "new" ? null : e,
			choices: f,
			onClose: () => t(null)
		}, e === "new" ? "new" : e.id),
		/* @__PURE__ */ P(o, {
			open: s !== null,
			onOpenChange: (e) => !e && l(null),
			title: `Delete ${s?.title}?`,
			description: "Its message goes from Discord. Tickets already opened from it stay open.",
			confirmLabel: "Delete panel",
			onConfirm: () => s ? p.mutateAsync(s) : void 0
		})
	] });
}
function J({ panel: e, choices: t, onClose: r }) {
	let i = A(), [a, o] = L(e?.channel_id ?? ""), [c, d] = L(e?.title ?? ""), [p, m] = L(e?.text ?? ""), [g, _] = L(e?.buttons ?? [{
		label: "",
		role_ids: [],
		category_id: ""
	}]), v = (e, t) => _(g.map((n, r) => r === e ? {
		...n,
		...t
	} : n)), y = a && c.trim() && g.every((e) => e.label.trim() && e.role_ids.length > 0), x = O({
		mutationFn: () => {
			let t = {
				channel_id: a,
				title: c,
				text: p,
				buttons: g
			};
			return e ? C.put(`${U}/panels/${e.id}`, t) : C.post(`${U}/panels`, t);
		},
		onSuccess: () => {
			i.invalidateQueries({ queryKey: ["tickets", "panels"] }), E.success(e ? "Panel updated on Discord" : "Panel posted on Discord"), r();
		},
		onError: (e) => E.error(e.message)
	});
	return /* @__PURE__ */ P(s, {
		open: !0,
		size: "lg",
		onOpenChange: (e) => !e && r(),
		title: e ? "Edit panel" : "New panel",
		footer: /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ P(n, {
			variant: "ghost",
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ P(n, {
			variant: "primary",
			disabled: !y,
			loading: x.isPending,
			onClick: () => x.mutate(),
			children: e ? "Save" : "Post panel"
		})] }),
		children: /* @__PURE__ */ F("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ P(l, {
					label: "Channel",
					hint: "Where the panel is posted. Who can see this channel on Discord decides who can use it.",
					children: /* @__PURE__ */ F(h, {
						value: a,
						onChange: (e) => o(e.target.value),
						children: [/* @__PURE__ */ P("option", {
							value: "",
							children: "Pick a channel"
						}), t.channels.map((e) => /* @__PURE__ */ F("option", {
							value: e.id,
							children: ["#", e.name]
						}, e.id))]
					})
				}),
				/* @__PURE__ */ P(l, {
					label: "Title",
					children: /* @__PURE__ */ P(u, {
						maxLength: 100,
						value: c,
						onChange: (e) => d(e.target.value)
					})
				}),
				/* @__PURE__ */ P(l, {
					label: "Text",
					hint: "Optional.",
					children: /* @__PURE__ */ P(b, {
						rows: 3,
						maxLength: 2e3,
						value: p,
						onChange: (e) => m(e.target.value)
					})
				}),
				g.map((e, r) => /* @__PURE__ */ F("div", {
					className: "space-y-3 border border-border p-3",
					children: [
						/* @__PURE__ */ P(l, {
							label: `Button ${r + 1}`,
							children: /* @__PURE__ */ P(u, {
								maxLength: 80,
								value: e.label,
								placeholder: "Recruitment",
								onChange: (e) => v(r, { label: e.target.value })
							})
						}),
						/* @__PURE__ */ P(l, {
							label: "Discord roles that see its tickets",
							hint: "They're pinged when a ticket opens. A role must allow mentions, or the bot need Mention Everyone, for the ping to notify anyone.",
							children: /* @__PURE__ */ P(f, {
								roles: t.roles,
								value: e.role_ids,
								onChange: (e) => v(r, { role_ids: e })
							})
						}),
						/* @__PURE__ */ P(l, {
							label: "Category",
							hint: "Where its ticket channels go.",
							children: /* @__PURE__ */ F(h, {
								value: e.category_id,
								onChange: (e) => v(r, { category_id: e.target.value }),
								children: [/* @__PURE__ */ P("option", {
									value: "",
									children: "The one from Settings"
								}), t.categories.map((e) => /* @__PURE__ */ P("option", {
									value: e.id,
									children: e.name
								}, e.id))]
							})
						}),
						g.length > 1 && /* @__PURE__ */ P(n, {
							size: "sm",
							variant: "ghost",
							onClick: () => _(g.filter((e, t) => t !== r)),
							children: "Remove button"
						})
					]
				}, e.id ?? `new-${r}`)),
				g.length < K && /* @__PURE__ */ F(n, {
					size: "sm",
					variant: "outline",
					onClick: () => _([...g, {
						label: "",
						role_ids: [],
						category_id: ""
					}]),
					children: [/* @__PURE__ */ P(V, {}), " Add button"]
				})
			]
		})
	});
}
//#endregion
//#region src/settings.tsx
function Y() {
	let e = A(), { data: t } = k({
		queryKey: ["tickets", "settings"],
		queryFn: () => C.get(`${U}/settings`)
	}), [o, s] = L(""), [c, p] = L([]);
	I(() => {
		t && (s(t.category_id), p(t.default_role_ids));
	}, [t]);
	let m = O({
		mutationFn: () => C.put(`${U}/settings`, {
			category_id: o,
			default_role_ids: c
		}),
		onSuccess: (t) => {
			e.setQueryData(["tickets", "settings"], t), E.success("Saved");
		},
		onError: (e) => E.error(e.message)
	});
	return /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ P(d, {
		eyebrow: "Discord",
		title: "Ticket settings",
		icon: /* @__PURE__ */ P(z, {}),
		description: "Tickets use the bot and server set up on the Discord plugin."
	}), t ? /* @__PURE__ */ F("div", {
		className: "space-y-4",
		children: [
			t.problems.length > 0 && /* @__PURE__ */ P(r, {
				tone: "warning",
				children: /* @__PURE__ */ P("ul", {
					className: "list-disc space-y-1 pl-4",
					children: t.problems.map((e) => /* @__PURE__ */ P("li", { children: e }, e))
				})
			}),
			/* @__PURE__ */ P(i, { children: /* @__PURE__ */ F(a, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ P(l, {
						label: "Category id",
						hint: "Optional. With Developer Mode on, right-click a Discord category and Copy Channel ID. Empty puts channels at the top of the server.",
						children: /* @__PURE__ */ P(u, {
							value: o,
							onChange: (e) => s(e.target.value)
						})
					}),
					/* @__PURE__ */ P(l, {
						label: "Default Discord roles",
						hint: "Optional. Ticked when someone opens a ticket; they can change it for that ticket.",
						children: /* @__PURE__ */ P(f, {
							roles: t.roles,
							value: c,
							onChange: p
						})
					}),
					/* @__PURE__ */ P(n, {
						variant: "primary",
						loading: m.isPending,
						onClick: () => m.mutate(),
						children: "Save"
					})
				]
			}) }),
			t.invite_url && /* @__PURE__ */ P(i, { children: /* @__PURE__ */ F(a, {
				className: "space-y-2",
				children: [/* @__PURE__ */ P("p", {
					className: "text-sm text-muted",
					children: "The bot needs more permissions for tickets than for syncing roles. Invite it again to add them; nothing else about it changes."
				}), /* @__PURE__ */ P("a", {
					href: t.invite_url,
					target: "_blank",
					rel: "noreferrer",
					className: "text-sm font-medium text-accent-ink hover:underline",
					children: "Invite the bot with ticket permissions"
				})]
			}) })
		]
	}) : /* @__PURE__ */ P(g, { className: "h-48" })] });
}
//#endregion
//#region src/tickets.tsx
function X() {
	let r = A(), [i, a] = L("open"), [s, l] = L(!1), [u, f] = L(null), { data: p, isLoading: h } = k({
		queryKey: [
			"tickets",
			"list",
			i
		],
		queryFn: () => C.get(`${U}/tickets?state=${i}&limit=200`),
		refetchInterval: 6e4
	}), b = O({
		mutationFn: (e) => C.post(`${U}/tickets/${e.id}/close`, {}),
		onSuccess: () => {
			r.invalidateQueries({ queryKey: ["tickets"] }), E.success("Ticket closed"), f(null);
		},
		onError: (e) => E.error(e.message)
	});
	return /* @__PURE__ */ F(N, { children: [
		/* @__PURE__ */ P(d, {
			eyebrow: "Discord",
			title: "Discord Tickets",
			icon: /* @__PURE__ */ P(z, {}),
			description: "Reach a member you pick through a private Discord channel, an EVE mail or both. Only the two of you and the Discord roles you choose can see the channel.",
			actions: /* @__PURE__ */ F(n, {
				variant: "primary",
				onClick: () => l(!0),
				children: [/* @__PURE__ */ P(V, {}), " Open a ticket"]
			})
		}),
		/* @__PURE__ */ P("div", {
			className: "mb-4",
			children: /* @__PURE__ */ P(m, {
				size: "sm",
				value: i,
				onChange: a,
				"aria-label": "Show",
				options: [
					{
						value: "open",
						label: "Open"
					},
					{
						value: "closed",
						label: "Closed"
					},
					{
						value: "",
						label: "All"
					}
				]
			})
		}),
		h || !p ? /* @__PURE__ */ P(g, { className: "h-48" }) : p.items.length === 0 ? /* @__PURE__ */ P(c, {
			icon: /* @__PURE__ */ P(z, {}),
			title: i === "closed" ? "No closed tickets" : "No tickets",
			description: "Pick a member by their main, an alt or their Discord name. A Discord channel needs both of you to have linked Discord.",
			action: /* @__PURE__ */ F(n, {
				variant: "primary",
				onClick: () => l(!0),
				children: [/* @__PURE__ */ P(V, {}), " Open a ticket"]
			})
		}) : /* @__PURE__ */ F(v, { children: [/* @__PURE__ */ P(_, { children: /* @__PURE__ */ F("tr", { children: [
			/* @__PURE__ */ P(x, { children: "Subject" }),
			/* @__PURE__ */ P(x, { children: "Member" }),
			/* @__PURE__ */ P(x, { children: "Opened" }),
			/* @__PURE__ */ P(x, { children: "Closed" }),
			/* @__PURE__ */ P(x, { children: "Status" }),
			/* @__PURE__ */ P(x, {})
		] }) }), /* @__PURE__ */ P("tbody", { children: p.items.map((r) => /* @__PURE__ */ F(S, { children: [
			/* @__PURE__ */ F(y, {
				className: "max-w-xs font-medium",
				children: [
					/* @__PURE__ */ P(j, {
						to: `/p/tickets/${r.id}`,
						className: "block truncate hover:text-accent-ink",
						title: r.subject,
						children: r.subject
					}),
					/* @__PURE__ */ F("span", {
						className: "block text-xs font-normal text-muted",
						children: [r.panel ? `Panel: ${r.panel}` : W[r.via], r.roles.length > 0 && ` · ${r.roles.map((e) => `@${e.name}`).join(", ")}`]
					}),
					r.mail_error && /* @__PURE__ */ F("span", {
						className: "block text-xs font-normal text-danger-fg",
						children: ["Mail not sent: ", r.mail_error]
					})
				]
			}),
			/* @__PURE__ */ P(y, { children: /* @__PURE__ */ F("span", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ P(e, {
					src: r.target?.portrait ?? null,
					name: r.target_name,
					size: "sm"
				}), /* @__PURE__ */ F("span", { children: [/* @__PURE__ */ P("span", {
					className: "block font-medium",
					children: r.target_name
				}), /* @__PURE__ */ P("span", {
					className: "block text-xs text-muted",
					children: r.target?.corporation ?? "No corporation"
				})] })]
			}) }),
			/* @__PURE__ */ F(y, {
				className: "whitespace-nowrap text-muted",
				children: [/* @__PURE__ */ P("span", {
					className: "block",
					children: w(r.opened_at)
				}), /* @__PURE__ */ F("span", {
					className: "block text-xs",
					children: ["by ", r.opened_by]
				})]
			}),
			/* @__PURE__ */ P(y, {
				className: "whitespace-nowrap text-muted",
				children: r.closed_at ? /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ P("span", {
					className: "block",
					children: w(r.closed_at)
				}), r.closed_by && /* @__PURE__ */ F("span", {
					className: "block text-xs",
					children: ["by ", r.closed_by]
				})] }) : "—"
			}),
			/* @__PURE__ */ P(y, { children: r.closed_at ? /* @__PURE__ */ P(t, {
				tone: "neutral",
				children: "Closed"
			}) : /* @__PURE__ */ P(t, {
				tone: "accent",
				children: "Open"
			}) }),
			/* @__PURE__ */ P(y, { children: /* @__PURE__ */ F("span", {
				className: "flex items-center justify-end gap-2",
				children: [
					r.closed_at && /* @__PURE__ */ P(j, {
						to: `/p/tickets/${r.id}`,
						className: "text-sm hover:text-accent-ink",
						children: "Transcript"
					}),
					r.url && /* @__PURE__ */ F("a", {
						href: r.url,
						target: "_blank",
						rel: "noreferrer",
						className: "inline-flex items-center gap-1 text-sm hover:text-accent-ink",
						children: ["Open in Discord ", /* @__PURE__ */ P(H, { className: "size-3.5" })]
					}),
					!r.closed_at && /* @__PURE__ */ P(n, {
						size: "sm",
						variant: "outline",
						onClick: () => f(r),
						children: "Close"
					})
				]
			}) })
		] }, r.id)) })] }),
		s && /* @__PURE__ */ P(Q, { onClose: () => l(!1) }),
		/* @__PURE__ */ P(o, {
			open: u !== null,
			onOpenChange: (e) => !e && f(null),
			title: `Close the ticket with ${u?.target_name}?`,
			description: u?.via === "mail" ? "This only marks the ticket closed. The mail they already have stays." : "They lose the channel now. Its messages and files are saved here, then the channel is removed from Discord for good.",
			confirmLabel: "Close ticket",
			onConfirm: () => u ? b.mutateAsync(u) : void 0
		})
	] });
}
function Z(e) {
	let [t, n] = L(e);
	return I(() => {
		let t = setTimeout(() => n(e.trim()), 250);
		return () => clearTimeout(t);
	}, [e]), t;
}
function Q({ onClose: i }) {
	let a = A(), [o, c] = L(""), [d, h] = L(null), [g, _] = L(""), [v, y] = L(""), [x, S] = L("discord"), w = Z(o), { data: T } = k({
		queryKey: ["tickets", "sender"],
		queryFn: () => C.get(`${U}/sender`)
	}), { data: D, isFetching: j } = k({
		queryKey: [
			"tickets",
			"members",
			w
		],
		queryFn: () => C.get(`${U}/members?q=${encodeURIComponent(w)}`),
		enabled: w.length >= 2 && !d
	}), M = x !== "mail", { data: I } = k({
		queryKey: ["tickets", "roles"],
		queryFn: () => C.get(`${U}/roles`),
		enabled: M
	}), [R, z] = L(null), B = R ?? I?.defaults ?? [], V = x !== "discord", H = M && d && !d.discord, W = V && T && !T.can_mail, G = d && !d.open_ticket && !H && !W && g.trim().length > 0 && (x !== "mail" || v.trim().length > 0), K = O({
		mutationFn: () => C.post(`${U}/tickets`, {
			user_id: d.id,
			subject: g,
			message: v,
			via: x,
			...M ? { role_ids: B } : {}
		}),
		onSuccess: (e) => {
			a.invalidateQueries({ queryKey: ["tickets"] }), e.mail_error ? E.warning(`Channel made, but the mail didn't go: ${e.mail_error}`) : E.success(`Ticket opened with ${e.target_name}`), i();
		},
		onError: (e) => E.error(e.message)
	});
	return /* @__PURE__ */ P(s, {
		open: !0,
		onOpenChange: (e) => !e && i(),
		title: "Open a ticket",
		description: "A Discord ticket makes a private channel and pings the member. An EVE mail can't be taken back once it's sent.",
		footer: /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ P(n, {
			variant: "ghost",
			onClick: i,
			children: "Cancel"
		}), /* @__PURE__ */ P(n, {
			variant: "primary",
			disabled: !G,
			loading: K.isPending,
			onClick: () => K.mutate(),
			children: "Open ticket"
		})] }),
		children: /* @__PURE__ */ F("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ P(l, {
					label: "Member",
					hint: "Search by their main, an alt you can see, or their Discord name.",
					children: d ? /* @__PURE__ */ F("div", {
						className: "flex items-center justify-between gap-2 border border-border px-3 py-2",
						children: [/* @__PURE__ */ F("span", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ P(e, {
								src: d.portrait,
								name: d.name,
								size: "sm"
							}), /* @__PURE__ */ F("span", { children: [/* @__PURE__ */ P("span", {
								className: "block font-medium",
								children: d.name
							}), /* @__PURE__ */ P("span", {
								className: "block text-xs text-muted",
								children: d.discord ? `@${d.discord}` : "No Discord linked"
							})] })]
						}), /* @__PURE__ */ P(n, {
							size: "sm",
							variant: "ghost",
							onClick: () => h(null),
							children: "Change"
						})]
					}) : /* @__PURE__ */ F("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ P(p, {
							value: o,
							onChange: (e) => c(e.target.value),
							placeholder: "Character or Discord name",
							"aria-label": "Character or Discord name",
							autoFocus: !0
						}), w.length >= 2 && /* @__PURE__ */ P("ul", {
							className: "max-h-60 divide-y divide-border overflow-y-auto border border-border",
							children: j && !D ? /* @__PURE__ */ P("li", {
								className: "px-3 py-2 text-sm text-muted",
								children: "Searching…"
							}) : D?.items.length === 0 ? /* @__PURE__ */ P("li", {
								className: "px-3 py-2 text-sm text-muted",
								children: "No member matches that."
							}) : D?.items.map((n) => /* @__PURE__ */ P("li", { children: /* @__PURE__ */ F("button", {
								type: "button",
								onClick: () => h(n),
								className: "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-hover",
								children: [
									/* @__PURE__ */ P(e, {
										src: n.portrait,
										name: n.name,
										size: "sm"
									}),
									/* @__PURE__ */ F("span", {
										className: "flex-1",
										children: [/* @__PURE__ */ P("span", {
											className: "block font-medium",
											children: n.name
										}), /* @__PURE__ */ F("span", {
											className: "block text-xs text-muted",
											children: [n.matched ? `Alt: ${n.matched} · ` : "", n.discord ? `@${n.discord}` : "No Discord linked"]
										})]
									}),
									n.open_ticket && /* @__PURE__ */ P(t, {
										tone: "accent",
										children: "Open ticket"
									}),
									n.discord && !n.on_server && /* @__PURE__ */ P(t, {
										tone: "neutral",
										children: "Not on server"
									})
								]
							}) }, n.id))
						})]
					})
				}),
				d?.open_ticket && /* @__PURE__ */ F(r, {
					tone: "warning",
					children: [
						"You already have an open ticket with ",
						d.name,
						". Close it to open another."
					]
				}),
				/* @__PURE__ */ P(l, {
					label: "Send by",
					hint: V && T?.name ? `The mail goes from ${T.name} to their main character.` : void 0,
					children: /* @__PURE__ */ P(m, {
						size: "sm",
						value: x,
						onChange: S,
						"aria-label": "Send by",
						options: [
							{
								value: "discord",
								label: "Discord ticket"
							},
							{
								value: "mail",
								label: "EVE mail"
							},
							{
								value: "both",
								label: "Both"
							}
						]
					})
				}),
				H && /* @__PURE__ */ F(r, {
					tone: "warning",
					children: [d.name, " hasn't linked Discord. Send an EVE mail instead."]
				}),
				W && /* @__PURE__ */ P(r, {
					tone: "warning",
					children: T.problem
				}),
				M && /* @__PURE__ */ P(l, {
					label: "Discord roles that can see it",
					hint: "Besides the two of you. Everyone with these roles can read and answer in the channel.",
					children: I?.error ? /* @__PURE__ */ P(r, {
						tone: "warning",
						children: I.error
					}) : /* @__PURE__ */ P(f, {
						roles: I?.roles ?? [],
						value: B,
						onChange: z
					})
				}),
				/* @__PURE__ */ P(l, {
					label: "Subject",
					children: /* @__PURE__ */ P(u, {
						maxLength: 100,
						value: g,
						onChange: (e) => _(e.target.value)
					})
				}),
				/* @__PURE__ */ P(l, {
					label: x === "mail" ? "Message" : "First message",
					hint: x === "mail" ? void 0 : x === "both" ? "Optional. It goes in the channel and the mail, which also links to the channel." : "Optional. The bot posts it in the channel.",
					children: /* @__PURE__ */ P(b, {
						rows: 3,
						maxLength: 1500,
						value: v,
						onChange: (e) => y(e.target.value)
					})
				})
			]
		})
	});
}
//#endregion
//#region src/transcript.tsx
var $ = 200;
function ee() {
	let { id: e } = M(), { data: o, isError: s } = k({
		queryKey: [
			"tickets",
			"ticket",
			e
		],
		queryFn: () => C.get(`${U}/tickets/${e}`),
		refetchInterval: (e) => e.state.data?.archive_state === "pending" && 15e3
	}), l = D({
		queryKey: [
			"tickets",
			"messages",
			e,
			o?.archive_state
		],
		queryFn: ({ pageParam: t }) => C.get(`${U}/tickets/${e}/messages?limit=${$}&offset=${t}`),
		initialPageParam: 0,
		getNextPageParam: (e, t) => {
			let n = t.reduce((e, t) => e + t.items.length, 0);
			return n < e.count ? n : void 0;
		},
		enabled: !!o
	});
	if (s) return /* @__PURE__ */ P(c, {
		icon: /* @__PURE__ */ P(z, {}),
		title: "No such ticket"
	});
	if (!o) return /* @__PURE__ */ P(g, { className: "h-48" });
	let u = l.data?.pages.flatMap((e) => e.items) ?? [];
	return /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ P(d, {
		eyebrow: /* @__PURE__ */ F(j, {
			to: o.mine ? "/p/tickets/mine" : "/p/tickets",
			className: "inline-flex items-center gap-1 hover:text-accent-ink",
			children: [
				/* @__PURE__ */ P(B, { className: "size-3.5" }),
				" ",
				o.mine ? "My tickets" : "Discord Tickets"
			]
		}),
		title: o.subject,
		icon: /* @__PURE__ */ P(z, {}),
		description: [
			o.panel ? `Opened by ${o.opened_by} from the ${o.panel} button on ${w(o.opened_at)}.` : `With ${o.target_name}. Opened by ${o.opened_by} on ${w(o.opened_at)}.`,
			o.closed_at ? `Closed${o.closed_by ? ` by ${o.closed_by}` : ""} on ${w(o.closed_at)}.` : "",
			o.roles.length > 0 ? `Visible to ${o.roles.map((e) => `@${e.name}`).join(", ")}.` : ""
		].filter(Boolean).join(" "),
		actions: o.closed_at ? /* @__PURE__ */ F(t, {
			tone: "neutral",
			children: ["Closed", o.closed_by ? ` by ${o.closed_by}` : ""]
		}) : /* @__PURE__ */ P(t, {
			tone: "accent",
			children: "Open"
		})
	}), /* @__PURE__ */ F("div", {
		className: "space-y-4",
		children: [
			o.message && o.via !== "discord" && /* @__PURE__ */ P(i, { children: /* @__PURE__ */ F(a, {
				className: "space-y-1",
				children: [/* @__PURE__ */ F("p", {
					className: "text-xs text-muted",
					children: [
						W.mail,
						" from ",
						o.opened_by,
						o.mail_sent ? "" : " (not sent)"
					]
				}), /* @__PURE__ */ P("p", {
					className: "whitespace-pre-wrap break-words text-sm",
					children: o.message
				})]
			}) }),
			o.via === "mail" && /* @__PURE__ */ P("p", {
				className: "text-sm text-muted",
				children: "Replies in the game aren't saved here."
			}),
			o.via !== "mail" && !o.closed_at && /* @__PURE__ */ P(r, {
				tone: "info",
				children: "The transcript is saved when the ticket closes. Until then the conversation is on Discord."
			}),
			o.archive_state === "pending" && /* @__PURE__ */ P(r, {
				tone: o.archive_error ? "warning" : "info",
				children: o.archive_error || "Saving the transcript, then removing the channel from Discord…"
			}),
			o.archive_state === "lost" && /* @__PURE__ */ P(r, {
				tone: "warning",
				children: "The channel was deleted on Discord before the ticket closed, so there's no transcript."
			}),
			u.length > 0 && /* @__PURE__ */ P(i, { children: /* @__PURE__ */ P(a, {
				className: "divide-y divide-border p-0",
				children: u.map((e) => /* @__PURE__ */ P(ne, { m: e }, e.id))
			}) }),
			l.hasNextPage && /* @__PURE__ */ P(n, {
				variant: "outline",
				loading: l.isFetchingNextPage,
				onClick: () => l.fetchNextPage(),
				children: "Show more"
			})
		]
	})] });
}
function te({ a: e }) {
	if (e.state !== "saved") return /* @__PURE__ */ F("p", {
		className: "mt-1 text-xs text-muted",
		children: [
			e.name,
			": not kept (",
			e.state === "too_big" ? "too large" : "no longer on Discord",
			")"
		]
	});
	let t = `${U}/attachments/${e.id}`;
	return e.image ? /* @__PURE__ */ P("a", {
		href: t,
		target: "_blank",
		rel: "noreferrer",
		className: "mt-2 block w-fit",
		children: /* @__PURE__ */ P("img", {
			src: t,
			alt: e.name,
			loading: "lazy",
			className: "max-h-80 max-w-full border border-border"
		})
	}) : /* @__PURE__ */ F("a", {
		href: t,
		download: e.name,
		className: "mt-1 block w-fit text-xs text-accent-ink hover:underline",
		children: [
			e.name,
			" (",
			(e.size / 1024 / 1024).toFixed(1),
			" MB)"
		]
	});
}
function ne({ m: n }) {
	return /* @__PURE__ */ F("div", {
		className: "flex gap-3 px-4 py-3",
		children: [/* @__PURE__ */ P(e, {
			src: null,
			name: n.author,
			size: "sm"
		}), /* @__PURE__ */ F("div", {
			className: "min-w-0 flex-1 text-sm",
			children: [
				/* @__PURE__ */ F("p", { children: [
					/* @__PURE__ */ P("span", {
						className: "font-medium",
						children: n.author
					}),
					n.is_bot && /* @__PURE__ */ P(t, {
						tone: "neutral",
						className: "ml-2",
						children: "Bot"
					}),
					/* @__PURE__ */ F("span", {
						className: "ml-2 text-xs text-muted",
						children: [w(n.sent_at), n.edited_at ? " (edited)" : ""]
					})
				] }),
				n.content && /* @__PURE__ */ P("p", {
					className: "whitespace-pre-wrap break-words",
					children: n.content
				}),
				n.embeds.map((e, t) => /* @__PURE__ */ F("div", {
					className: "mt-1 border-l-2 border-border pl-2",
					children: [e.title && /* @__PURE__ */ P("p", {
						className: "font-medium",
						children: e.title
					}), e.description && /* @__PURE__ */ P("p", {
						className: "whitespace-pre-wrap break-words text-muted",
						children: e.description
					})]
				}, t)),
				n.attachments.map((e) => /* @__PURE__ */ P(te, { a: e }, e.id))
			]
		})]
	});
}
//#endregion
//#region src/index.tsx
var re = T({ routes: [
	{
		path: "",
		Component: X
	},
	{
		path: "mine",
		Component: G
	},
	{
		path: "panels",
		Component: q
	},
	{
		path: "settings",
		Component: Y
	},
	{
		path: ":id",
		Component: ee
	}
] });
//#endregion
export { re as default };

export const classes = ["!data","!noDiscord","!noMail","!o","@conduit/sdk","@tanstack/react-query","a","about","accent","act","action","actions","add","again","allow","already","also","alt","an","and","answer","anything","archive_error","archive_state","are","aren","aria-label","as","at","attachments","author","autoFocus","back","be","been","before","block","body","border","border-border","border-l-2","bot","both","break-all","break-words","but","button","buttons","by","can","can_mail","categories","category","category_id","change","changes","channel","channelName","channel_id","channels","children","choices","choose","chosenRoles","className","clicks","closed","closed_at","closed_by","confirmLabel","const","content","conversation","corporation","count","currentColor","data","decides","default","default_role_ids","defaults","definePlugin","deleted","description","didn","disabled","discord","divide-border","divide-y","done","download","each","edited_at","else","embeds","empty","enabled","endpoint_url","error","every","export","extends","eyebrow","few","files","fill","filter","flex","flex-1","flex-wrap","font-medium","font-normal","footer","for","from","function","game","gap-1","gap-2","gap-3","get","getNextPageParam","ghost","go","goes","h-48","has","hasNextPage","hasn","have","here","hint","hover:bg-hover","hover:text-accent-ink","hover:underline","href","i","icon","icons","id","if","image","import","in","info","initialPageParam","inline","inline-flex","interface","invite_url","is","isError","isFetching","isLoading","is_bot","it","items","items-center","its","justify-between","justify-end","kept","key","label","large","lazy","length","let","lg","linked","links","list","list-disc","load","loaded","loading","longer","lose","lost","m","m12","mail","mail_error","mail_sent","mailed","main","makes","marks","matched","matches","max-h-60","max-h-80","max-w-full","max-w-xs","maxLength","mb-4","member","members","message","messages","min-w-0","mine","ml-2","more","mt-1","mt-2","must","mutationFn","n","name","need","needs","neutral","new","no","noDiscord","noMail","none","noreferrer","not","nothing","notify","null","number","of","on","onChange","onClick","onClose","onConfirm","onError","onOpenChange","onSuccess","on_server","once","one","only","open","open_ticket","opened","opened_at","opened_by","opening","opens","options","or","outline","overflow-y-auto","own","p-0","p-3","page","pageParam","panel","panels","part","path","pending","people","permissions","pick","picked","ping","pinged","pings","pl-2","pl-4","placeholder","portrait","post","posted","posts","primary","private","problem","problems","put","puts","px-3","px-4","py-2","py-3","qc","queryFn","queryKey","re","reach","react","react-router","read","refetchInterval","rel","remove","removed","removing","rest","return","right-click","role","role_ids","roles","round","routes","rows","s","save","saved","search","see","sender","sent","sent_at","server","set","setButtons","setCategory","setChannel","setConfirm","setDeleting","setEditing","setFilter","setMessage","setOpening","setOut","setPicked","setQ","setRoles","setSubject","setText","setTitle","setVia","settings","site","size","size-3.5","size-4","sm","so","someone","space-y-1","space-y-2","space-y-3","space-y-4","src","staff","state","stay","stopping","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","subject","such","syncing","t","taken","target","target_name","text","text-accent-ink","text-danger-fg","text-left","text-muted","text-sm","text-xs","than","that","the","their","themselves","then","there","these","they","this","through","ticked","ticket","tickets","title","to","toast","tone","too","too_big","top","transcript","truncate","two","type","unavailable","undefined","until","up","updated","url","use","useParams","useQuery","useQueryClient","useState","used","user_id","usesDiscord","usesMail","valid","value","variant","ve","via","viewBox","viewer","void","w-fit","w-full","warning","was","what","when","where","which","whitespace-nowrap","whitespace-pre-wrap","who","whose","with","you","your"];
