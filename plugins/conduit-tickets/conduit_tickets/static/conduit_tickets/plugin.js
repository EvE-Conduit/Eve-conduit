import { Avatar as e, Badge as t, Button as n, Callout as r, Card as i, CardBody as a, ConfirmDialog as o, Dialog as s, EmptyState as c, Field as l, Input as u, PageHeader as d, SearchInput as f, Segmented as p, Select as m, Skeleton as h, THead as g, Table as _, Td as v, Textarea as y, Th as b, Tr as x, api as S, dateTime as C, definePlugin as w, toast as T } from "@conduit/sdk";
import { useInfiniteQuery as E, useMutation as D, useQuery as O, useQueryClient as k } from "@tanstack/react-query";
import { useEffect as A, useState as j } from "react";
import { Fragment as M, jsx as N, jsxs as P } from "react/jsx-runtime";
import { Link as F, useParams as I } from "react-router";
//#region src/icons.tsx
function L({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ N("svg", {
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
var R = (e) => /* @__PURE__ */ P(L, {
	...e,
	children: [
		/* @__PURE__ */ N("path", { d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" }),
		/* @__PURE__ */ N("path", { d: "M13 5v2" }),
		/* @__PURE__ */ N("path", { d: "M13 17v2" }),
		/* @__PURE__ */ N("path", { d: "M13 11v2" })
	]
}), z = (e) => /* @__PURE__ */ P(L, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ N("path", { d: "M19 12H5" })]
}), B = (e) => /* @__PURE__ */ P(L, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "M5 12h14" }), /* @__PURE__ */ N("path", { d: "M12 5v14" })]
}), V = (e) => /* @__PURE__ */ P(L, {
	...e,
	children: [
		/* @__PURE__ */ N("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ N("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ N("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), H = "/api/p/tickets", U = {
	discord: "Discord",
	mail: "EVE mail",
	both: "Discord + EVE mail"
};
//#endregion
//#region src/settings.tsx
function W() {
	let e = k(), { data: t } = O({
		queryKey: ["tickets", "settings"],
		queryFn: () => S.get(`${H}/settings`)
	}), [o, s] = j(""), [c, f] = j("");
	A(() => {
		t && (s(t.category_id), f(t.staff_role_id));
	}, [t]);
	let p = D({
		mutationFn: () => S.put(`${H}/settings`, {
			category_id: o,
			staff_role_id: c
		}),
		onSuccess: (t) => {
			e.setQueryData(["tickets", "settings"], t), T.success("Saved");
		},
		onError: (e) => T.error(e.message)
	});
	return /* @__PURE__ */ P(M, { children: [/* @__PURE__ */ N(d, {
		eyebrow: "Discord",
		title: "Ticket settings",
		icon: /* @__PURE__ */ N(R, {}),
		description: "Tickets use the bot and server set up on the Discord plugin."
	}), t ? /* @__PURE__ */ P("div", {
		className: "space-y-4",
		children: [
			t.problems.length > 0 && /* @__PURE__ */ N(r, {
				tone: "warning",
				children: /* @__PURE__ */ N("ul", {
					className: "list-disc space-y-1 pl-4",
					children: t.problems.map((e) => /* @__PURE__ */ N("li", { children: e }, e))
				})
			}),
			/* @__PURE__ */ N(i, { children: /* @__PURE__ */ P(a, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ N(l, {
						label: "Category id",
						hint: "Optional. With Developer Mode on, right-click a Discord category and Copy Channel ID. Empty puts channels at the top of the server.",
						children: /* @__PURE__ */ N(u, {
							value: o,
							onChange: (e) => s(e.target.value)
						})
					}),
					/* @__PURE__ */ N(l, {
						label: "Staff role",
						hint: "Optional. This Discord role sees and can answer every ticket.",
						children: /* @__PURE__ */ P(m, {
							value: c,
							onChange: (e) => f(e.target.value),
							children: [/* @__PURE__ */ N("option", {
								value: "",
								children: "Nobody else"
							}), t.roles.map((e) => /* @__PURE__ */ N("option", {
								value: e.id,
								children: e.name
							}, e.id))]
						})
					}),
					/* @__PURE__ */ N(n, {
						variant: "primary",
						loading: p.isPending,
						onClick: () => p.mutate(),
						children: "Save"
					})
				]
			}) }),
			t.invite_url && /* @__PURE__ */ N(i, { children: /* @__PURE__ */ P(a, {
				className: "space-y-2",
				children: [/* @__PURE__ */ N("p", {
					className: "text-sm text-muted",
					children: "The bot needs more permissions for tickets than for syncing roles. Invite it again to add them; nothing else about it changes."
				}), /* @__PURE__ */ N("a", {
					href: t.invite_url,
					target: "_blank",
					rel: "noreferrer",
					className: "text-sm font-medium text-accent-ink hover:underline",
					children: "Invite the bot with ticket permissions"
				})]
			}) })
		]
	}) : /* @__PURE__ */ N(h, { className: "h-48" })] });
}
//#endregion
//#region src/tickets.tsx
function G() {
	let r = k(), [i, a] = j("open"), [s, l] = j(!1), [u, f] = j(null), { data: m, isLoading: y } = O({
		queryKey: [
			"tickets",
			"list",
			i
		],
		queryFn: () => S.get(`${H}/tickets?state=${i}&limit=200`),
		refetchInterval: 6e4
	}), w = D({
		mutationFn: (e) => S.post(`${H}/tickets/${e.id}/close`, {}),
		onSuccess: () => {
			r.invalidateQueries({ queryKey: ["tickets"] }), T.success("Ticket closed"), f(null);
		},
		onError: (e) => T.error(e.message)
	});
	return /* @__PURE__ */ P(M, { children: [
		/* @__PURE__ */ N(d, {
			eyebrow: "Discord",
			title: "Discord Tickets",
			icon: /* @__PURE__ */ N(R, {}),
			description: "Reach a member you pick through a private Discord channel, an EVE mail or both. Only the two of you and the staff role can see the channel.",
			actions: /* @__PURE__ */ P(n, {
				variant: "primary",
				onClick: () => l(!0),
				children: [/* @__PURE__ */ N(B, {}), " Open a ticket"]
			})
		}),
		/* @__PURE__ */ N("div", {
			className: "mb-4",
			children: /* @__PURE__ */ N(p, {
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
		y || !m ? /* @__PURE__ */ N(h, { className: "h-48" }) : m.items.length === 0 ? /* @__PURE__ */ N(c, {
			icon: /* @__PURE__ */ N(R, {}),
			title: i === "closed" ? "No closed tickets" : "No tickets",
			description: "Pick a member by their main, an alt or their Discord name. A Discord channel needs both of you to have linked Discord.",
			action: /* @__PURE__ */ P(n, {
				variant: "primary",
				onClick: () => l(!0),
				children: [/* @__PURE__ */ N(B, {}), " Open a ticket"]
			})
		}) : /* @__PURE__ */ P(_, { children: [/* @__PURE__ */ N(g, { children: /* @__PURE__ */ P("tr", { children: [
			/* @__PURE__ */ N(b, { children: "Subject" }),
			/* @__PURE__ */ N(b, { children: "Member" }),
			/* @__PURE__ */ N(b, { children: "Opened" }),
			/* @__PURE__ */ N(b, { children: "Status" }),
			/* @__PURE__ */ N(b, {})
		] }) }), /* @__PURE__ */ N("tbody", { children: m.items.map((r) => /* @__PURE__ */ P(x, { children: [
			/* @__PURE__ */ P(v, {
				className: "max-w-xs font-medium",
				children: [
					/* @__PURE__ */ N(F, {
						to: `/p/tickets/${r.id}`,
						className: "block truncate hover:text-accent-ink",
						title: r.subject,
						children: r.subject
					}),
					/* @__PURE__ */ N("span", {
						className: "block text-xs font-normal text-muted",
						children: U[r.via]
					}),
					r.mail_error && /* @__PURE__ */ P("span", {
						className: "block text-xs font-normal text-danger-fg",
						children: ["Mail not sent: ", r.mail_error]
					})
				]
			}),
			/* @__PURE__ */ N(v, { children: /* @__PURE__ */ P("span", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ N(e, {
					src: r.target?.portrait ?? null,
					name: r.target_name,
					size: "sm"
				}), /* @__PURE__ */ P("span", { children: [/* @__PURE__ */ N("span", {
					className: "block font-medium",
					children: r.target_name
				}), /* @__PURE__ */ N("span", {
					className: "block text-xs text-muted",
					children: r.target?.corporation ?? "No corporation"
				})] })]
			}) }),
			/* @__PURE__ */ P(v, {
				className: "whitespace-nowrap text-muted",
				children: [/* @__PURE__ */ N("span", {
					className: "block",
					children: C(r.opened_at)
				}), /* @__PURE__ */ P("span", {
					className: "block text-xs",
					children: ["by ", r.opened_by]
				})]
			}),
			/* @__PURE__ */ N(v, { children: r.closed_at ? /* @__PURE__ */ P(t, {
				tone: "neutral",
				children: ["Closed", r.closed_by ? ` by ${r.closed_by}` : ""]
			}) : /* @__PURE__ */ N(t, {
				tone: "accent",
				children: "Open"
			}) }),
			/* @__PURE__ */ N(v, { children: /* @__PURE__ */ P("span", {
				className: "flex items-center justify-end gap-2",
				children: [
					r.closed_at && /* @__PURE__ */ N(F, {
						to: `/p/tickets/${r.id}`,
						className: "text-sm hover:text-accent-ink",
						children: "Transcript"
					}),
					r.url && /* @__PURE__ */ P("a", {
						href: r.url,
						target: "_blank",
						rel: "noreferrer",
						className: "inline-flex items-center gap-1 text-sm hover:text-accent-ink",
						children: ["Open in Discord ", /* @__PURE__ */ N(V, { className: "size-3.5" })]
					}),
					!r.closed_at && /* @__PURE__ */ N(n, {
						size: "sm",
						variant: "outline",
						onClick: () => f(r),
						children: "Close"
					})
				]
			}) })
		] }, r.id)) })] }),
		s && /* @__PURE__ */ N(q, { onClose: () => l(!1) }),
		/* @__PURE__ */ N(o, {
			open: u !== null,
			onOpenChange: (e) => !e && f(null),
			title: `Close the ticket with ${u?.target_name}?`,
			description: u?.via === "mail" ? "This only marks the ticket closed. The mail they already have stays." : "They lose the channel now. Its messages and files are saved here, then the channel is removed from Discord for good.",
			confirmLabel: "Close ticket",
			onConfirm: () => u ? w.mutateAsync(u) : void 0
		})
	] });
}
function K(e) {
	let [t, n] = j(e);
	return A(() => {
		let t = setTimeout(() => n(e.trim()), 250);
		return () => clearTimeout(t);
	}, [e]), t;
}
function q({ onClose: i }) {
	let a = k(), [o, c] = j(""), [d, m] = j(null), [h, g] = j(""), [_, v] = j(""), [b, x] = j("discord"), C = K(o), { data: w } = O({
		queryKey: ["tickets", "sender"],
		queryFn: () => S.get(`${H}/sender`)
	}), { data: E, isFetching: A } = O({
		queryKey: [
			"tickets",
			"members",
			C
		],
		queryFn: () => S.get(`${H}/members?q=${encodeURIComponent(C)}`),
		enabled: C.length >= 2 && !d
	}), F = b !== "mail", I = b !== "discord", L = F && d && !d.discord, R = I && w && !w.can_mail, z = d && !d.open_ticket && !L && !R && h.trim().length > 0 && (b !== "mail" || _.trim().length > 0), B = D({
		mutationFn: () => S.post(`${H}/tickets`, {
			user_id: d.id,
			subject: h,
			message: _,
			via: b
		}),
		onSuccess: (e) => {
			a.invalidateQueries({ queryKey: ["tickets"] }), e.mail_error ? T.warning(`Channel made, but the mail didn't go: ${e.mail_error}`) : T.success(`Ticket opened with ${e.target_name}`), i();
		},
		onError: (e) => T.error(e.message)
	});
	return /* @__PURE__ */ N(s, {
		open: !0,
		onOpenChange: (e) => !e && i(),
		title: "Open a ticket",
		description: "A Discord ticket makes a private channel and pings the member. An EVE mail can't be taken back once it's sent.",
		footer: /* @__PURE__ */ P(M, { children: [/* @__PURE__ */ N(n, {
			variant: "ghost",
			onClick: i,
			children: "Cancel"
		}), /* @__PURE__ */ N(n, {
			variant: "primary",
			disabled: !z,
			loading: B.isPending,
			onClick: () => B.mutate(),
			children: "Open ticket"
		})] }),
		children: /* @__PURE__ */ P("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ N(l, {
					label: "Member",
					hint: "Search by their main, an alt you can see, or their Discord name.",
					children: d ? /* @__PURE__ */ P("div", {
						className: "flex items-center justify-between gap-2 border border-border px-3 py-2",
						children: [/* @__PURE__ */ P("span", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ N(e, {
								src: d.portrait,
								name: d.name,
								size: "sm"
							}), /* @__PURE__ */ P("span", { children: [/* @__PURE__ */ N("span", {
								className: "block font-medium",
								children: d.name
							}), /* @__PURE__ */ N("span", {
								className: "block text-xs text-muted",
								children: d.discord ? `@${d.discord}` : "No Discord linked"
							})] })]
						}), /* @__PURE__ */ N(n, {
							size: "sm",
							variant: "ghost",
							onClick: () => m(null),
							children: "Change"
						})]
					}) : /* @__PURE__ */ P("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ N(f, {
							value: o,
							onChange: (e) => c(e.target.value),
							placeholder: "Character or Discord name",
							"aria-label": "Character or Discord name",
							autoFocus: !0
						}), C.length >= 2 && /* @__PURE__ */ N("ul", {
							className: "max-h-60 divide-y divide-border overflow-y-auto border border-border",
							children: A && !E ? /* @__PURE__ */ N("li", {
								className: "px-3 py-2 text-sm text-muted",
								children: "Searching…"
							}) : E?.items.length === 0 ? /* @__PURE__ */ N("li", {
								className: "px-3 py-2 text-sm text-muted",
								children: "No member matches that."
							}) : E?.items.map((n) => /* @__PURE__ */ N("li", { children: /* @__PURE__ */ P("button", {
								type: "button",
								onClick: () => m(n),
								className: "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-hover",
								children: [
									/* @__PURE__ */ N(e, {
										src: n.portrait,
										name: n.name,
										size: "sm"
									}),
									/* @__PURE__ */ P("span", {
										className: "flex-1",
										children: [/* @__PURE__ */ N("span", {
											className: "block font-medium",
											children: n.name
										}), /* @__PURE__ */ P("span", {
											className: "block text-xs text-muted",
											children: [n.matched ? `Alt: ${n.matched} · ` : "", n.discord ? `@${n.discord}` : "No Discord linked"]
										})]
									}),
									n.open_ticket && /* @__PURE__ */ N(t, {
										tone: "accent",
										children: "Open ticket"
									}),
									n.discord && !n.on_server && /* @__PURE__ */ N(t, {
										tone: "neutral",
										children: "Not on server"
									})
								]
							}) }, n.id))
						})]
					})
				}),
				d?.open_ticket && /* @__PURE__ */ P(r, {
					tone: "warning",
					children: [
						"You already have an open ticket with ",
						d.name,
						". Close it to open another."
					]
				}),
				/* @__PURE__ */ N(l, {
					label: "Send by",
					hint: I && w?.name ? `The mail goes from ${w.name} to their main character.` : void 0,
					children: /* @__PURE__ */ N(p, {
						size: "sm",
						value: b,
						onChange: x,
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
				L && /* @__PURE__ */ P(r, {
					tone: "warning",
					children: [d.name, " hasn't linked Discord. Send an EVE mail instead."]
				}),
				R && /* @__PURE__ */ N(r, {
					tone: "warning",
					children: w.problem
				}),
				/* @__PURE__ */ N(l, {
					label: "Subject",
					children: /* @__PURE__ */ N(u, {
						maxLength: 100,
						value: h,
						onChange: (e) => g(e.target.value)
					})
				}),
				/* @__PURE__ */ N(l, {
					label: b === "mail" ? "Message" : "First message",
					hint: b === "mail" ? void 0 : b === "both" ? "Optional. It goes in the channel and the mail, which also links to the channel." : "Optional. The bot posts it in the channel.",
					children: /* @__PURE__ */ N(y, {
						rows: 3,
						maxLength: 1500,
						value: _,
						onChange: (e) => v(e.target.value)
					})
				})
			]
		})
	});
}
//#endregion
//#region src/transcript.tsx
var J = 200;
function Y() {
	let { id: e } = I(), { data: o, isError: s } = O({
		queryKey: [
			"tickets",
			"ticket",
			e
		],
		queryFn: () => S.get(`${H}/tickets/${e}`),
		refetchInterval: (e) => e.state.data?.archive_state === "pending" && 15e3
	}), l = E({
		queryKey: [
			"tickets",
			"messages",
			e,
			o?.archive_state
		],
		queryFn: ({ pageParam: t }) => S.get(`${H}/tickets/${e}/messages?limit=${J}&offset=${t}`),
		initialPageParam: 0,
		getNextPageParam: (e, t) => {
			let n = t.reduce((e, t) => e + t.items.length, 0);
			return n < e.count ? n : void 0;
		},
		enabled: !!o
	});
	if (s) return /* @__PURE__ */ N(c, {
		icon: /* @__PURE__ */ N(R, {}),
		title: "No such ticket"
	});
	if (!o) return /* @__PURE__ */ N(h, { className: "h-48" });
	let u = l.data?.pages.flatMap((e) => e.items) ?? [];
	return /* @__PURE__ */ P(M, { children: [/* @__PURE__ */ N(d, {
		eyebrow: /* @__PURE__ */ P(F, {
			to: "/p/tickets",
			className: "inline-flex items-center gap-1 hover:text-accent-ink",
			children: [/* @__PURE__ */ N(z, { className: "size-3.5" }), " Discord Tickets"]
		}),
		title: o.subject,
		icon: /* @__PURE__ */ N(R, {}),
		description: `With ${o.target_name}, opened by ${o.opened_by} on ${C(o.opened_at)}`,
		actions: o.closed_at ? /* @__PURE__ */ P(t, {
			tone: "neutral",
			children: ["Closed", o.closed_by ? ` by ${o.closed_by}` : ""]
		}) : /* @__PURE__ */ N(t, {
			tone: "accent",
			children: "Open"
		})
	}), /* @__PURE__ */ P("div", {
		className: "space-y-4",
		children: [
			o.message && o.via !== "discord" && /* @__PURE__ */ N(i, { children: /* @__PURE__ */ P(a, {
				className: "space-y-1",
				children: [/* @__PURE__ */ P("p", {
					className: "text-xs text-muted",
					children: [
						U.mail,
						" from ",
						o.opened_by,
						o.mail_sent ? "" : " (not sent)"
					]
				}), /* @__PURE__ */ N("p", {
					className: "whitespace-pre-wrap break-words text-sm",
					children: o.message
				})]
			}) }),
			o.via === "mail" && /* @__PURE__ */ N("p", {
				className: "text-sm text-muted",
				children: "Replies in the game aren't saved here."
			}),
			o.via !== "mail" && !o.closed_at && /* @__PURE__ */ N(r, {
				tone: "info",
				children: "The transcript is saved when the ticket closes. Until then the conversation is on Discord."
			}),
			o.archive_state === "pending" && /* @__PURE__ */ N(r, {
				tone: o.archive_error ? "warning" : "info",
				children: o.archive_error || "Saving the transcript, then removing the channel from Discord…"
			}),
			o.archive_state === "lost" && /* @__PURE__ */ N(r, {
				tone: "warning",
				children: "The channel was deleted on Discord before the ticket closed, so there's no transcript."
			}),
			u.length > 0 && /* @__PURE__ */ N(i, { children: /* @__PURE__ */ N(a, {
				className: "divide-y divide-border p-0",
				children: u.map((e) => /* @__PURE__ */ N(Z, { m: e }, e.id))
			}) }),
			l.hasNextPage && /* @__PURE__ */ N(n, {
				variant: "outline",
				loading: l.isFetchingNextPage,
				onClick: () => l.fetchNextPage(),
				children: "Show more"
			})
		]
	})] });
}
function X({ a: e }) {
	if (e.state !== "saved") return /* @__PURE__ */ P("p", {
		className: "mt-1 text-xs text-muted",
		children: [
			e.name,
			": not kept (",
			e.state === "too_big" ? "too large" : "no longer on Discord",
			")"
		]
	});
	let t = `${H}/attachments/${e.id}`;
	return e.image ? /* @__PURE__ */ N("a", {
		href: t,
		target: "_blank",
		rel: "noreferrer",
		className: "mt-2 block w-fit",
		children: /* @__PURE__ */ N("img", {
			src: t,
			alt: e.name,
			loading: "lazy",
			className: "max-h-80 max-w-full border border-border"
		})
	}) : /* @__PURE__ */ P("a", {
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
function Z({ m: n }) {
	return /* @__PURE__ */ P("div", {
		className: "flex gap-3 px-4 py-3",
		children: [/* @__PURE__ */ N(e, {
			src: null,
			name: n.author,
			size: "sm"
		}), /* @__PURE__ */ P("div", {
			className: "min-w-0 flex-1 text-sm",
			children: [
				/* @__PURE__ */ P("p", { children: [
					/* @__PURE__ */ N("span", {
						className: "font-medium",
						children: n.author
					}),
					n.is_bot && /* @__PURE__ */ N(t, {
						tone: "neutral",
						className: "ml-2",
						children: "Bot"
					}),
					/* @__PURE__ */ P("span", {
						className: "ml-2 text-xs text-muted",
						children: [C(n.sent_at), n.edited_at ? " (edited)" : ""]
					})
				] }),
				n.content && /* @__PURE__ */ N("p", {
					className: "whitespace-pre-wrap break-words",
					children: n.content
				}),
				n.embeds.map((e, t) => /* @__PURE__ */ P("div", {
					className: "mt-1 border-l-2 border-border pl-2",
					children: [e.title && /* @__PURE__ */ N("p", {
						className: "font-medium",
						children: e.title
					}), e.description && /* @__PURE__ */ N("p", {
						className: "whitespace-pre-wrap break-words text-muted",
						children: e.description
					})]
				}, t)),
				n.attachments.map((e) => /* @__PURE__ */ N(X, { a: e }, e.id))
			]
		})]
	});
}
//#endregion
//#region src/index.tsx
var Q = w({ routes: [
	{
		path: "",
		Component: G
	},
	{
		path: "settings",
		Component: W
	},
	{
		path: ":id",
		Component: Y
	}
] });
//#endregion
export { Q as default };

export const classes = ["!data","!noDiscord","!noMail","!o","@conduit/sdk","@tanstack/react-query","a","about","accent","act","action","actions","add","again","already","also","alt","an","and","answer","anything","archive_error","archive_state","are","aren","aria-label","as","at","attachments","author","autoFocus","back","be","been","before","block","border","border-border","border-l-2","bot","both","break-words","but","button","by","can","can_mail","category","category_id","channel","channels","children","className","closed","closed_at","closed_by","confirmLabel","const","content","conversation","corporation","count","currentColor","data","default","definePlugin","deleted","description","didn","disabled","discord","divide-border","divide-y","done","download","edited_at","else","embeds","enabled","every","export","extends","eyebrow","few","files","fill","filter","flex","flex-1","font-medium","font-normal","footer","for","from","function","game","gap-1","gap-2","gap-3","get","getNextPageParam","ghost","go","goes","h-48","hasNextPage","hasn","have","here","hint","hover:bg-hover","hover:text-accent-ink","hover:underline","href","icon","icons","id","if","image","import","in","info","initialPageParam","inline","inline-flex","interface","invite_url","is","isError","isFetching","isLoading","is_bot","it","items","items-center","its","justify-between","justify-end","kept","key","label","large","lazy","length","linked","links","list","list-disc","load","loaded","loading","longer","lose","lost","m","m12","mail","mail_error","mail_sent","mailed","main","makes","marks","matched","matches","max-h-60","max-h-80","max-w-full","max-w-xs","maxLength","mb-4","member","members","message","messages","min-w-0","ml-2","more","mt-1","mt-2","mutationFn","n","name","needs","neutral","new","no","noDiscord","noMail","none","noreferrer","not","nothing","number","of","on","onChange","onClick","onClose","onConfirm","onError","onOpenChange","onSuccess","on_server","once","only","open","open_ticket","opened","opened_at","opened_by","opening","options","or","outline","overflow-y-auto","p-0","page","pageParam","path","pending","permissions","pick","picked","pings","pl-2","pl-4","placeholder","portrait","post","posts","primary","private","problem","problems","put","puts","px-3","px-4","py-2","py-3","qc","queryFn","queryKey","react","react-router","refetchInterval","rel","removed","removing","rest","return","right-click","role","roles","round","routes","rows","s","save","saved","search","see","sees","sender","sent","sent_at","server","set","setCategory","setConfirm","setFilter","setMessage","setOpening","setOut","setPicked","setQ","setRole","setSubject","setVia","settings","site","size","size-3.5","size-4","sm","so","space-y-1","space-y-2","space-y-4","src","staff","staff_role_id","state","stopping","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","subject","such","syncing","t","taken","target","target_name","text-accent-ink","text-danger-fg","text-left","text-muted","text-sm","text-xs","than","the","their","then","there","they","through","ticket","tickets","title","to","toast","tone","too","too_big","top","transcript","truncate","two","type","unavailable","undefined","up","url","use","useParams","useQuery","useQueryClient","useState","used","user_id","usesDiscord","usesMail","valid","value","variant","ve","via","viewBox","void","w-fit","w-full","warning","was","what","when","where","which","whitespace-nowrap","whitespace-pre-wrap","with","you"];
