import { Avatar as e, Badge as t, Button as n, Callout as r, Card as i, CardBody as a, ConfirmDialog as o, Dialog as s, EmptyState as c, Field as l, Input as u, PageHeader as d, SearchInput as f, Segmented as p, Select as m, Skeleton as h, THead as g, Table as _, Td as v, Textarea as y, Th as b, Tr as x, api as S, dateTime as C, definePlugin as w, toast as T } from "@conduit/sdk";
import { useMutation as E, useQuery as D, useQueryClient as O } from "@tanstack/react-query";
import { useEffect as k, useState as A } from "react";
import { Fragment as j, jsx as M, jsxs as N } from "react/jsx-runtime";
//#region src/icons.tsx
function P({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ M("svg", {
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
var F = (e) => /* @__PURE__ */ N(P, {
	...e,
	children: [
		/* @__PURE__ */ M("path", { d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" }),
		/* @__PURE__ */ M("path", { d: "M13 5v2" }),
		/* @__PURE__ */ M("path", { d: "M13 17v2" }),
		/* @__PURE__ */ M("path", { d: "M13 11v2" })
	]
}), I = (e) => /* @__PURE__ */ N(P, {
	...e,
	children: [/* @__PURE__ */ M("path", { d: "M5 12h14" }), /* @__PURE__ */ M("path", { d: "M12 5v14" })]
}), L = (e) => /* @__PURE__ */ N(P, {
	...e,
	children: [
		/* @__PURE__ */ M("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ M("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ M("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), R = "/api/p/tickets";
//#endregion
//#region src/settings.tsx
function z() {
	let e = O(), { data: t } = D({
		queryKey: ["tickets", "settings"],
		queryFn: () => S.get(`${R}/settings`)
	}), [o, s] = A(""), [c, f] = A("");
	k(() => {
		t && (s(t.category_id), f(t.staff_role_id));
	}, [t]);
	let p = E({
		mutationFn: () => S.put(`${R}/settings`, {
			category_id: o,
			staff_role_id: c
		}),
		onSuccess: (t) => {
			e.setQueryData(["tickets", "settings"], t), T.success("Saved");
		},
		onError: (e) => T.error(e.message)
	});
	return /* @__PURE__ */ N(j, { children: [/* @__PURE__ */ M(d, {
		eyebrow: "Discord",
		title: "Ticket settings",
		icon: /* @__PURE__ */ M(F, {}),
		description: "Tickets use the bot and server set up on the Discord plugin."
	}), t ? /* @__PURE__ */ N("div", {
		className: "space-y-4",
		children: [
			t.problems.length > 0 && /* @__PURE__ */ M(r, {
				tone: "warning",
				children: /* @__PURE__ */ M("ul", {
					className: "list-disc space-y-1 pl-4",
					children: t.problems.map((e) => /* @__PURE__ */ M("li", { children: e }, e))
				})
			}),
			/* @__PURE__ */ M(i, { children: /* @__PURE__ */ N(a, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ M(l, {
						label: "Category id",
						hint: "Optional. With Developer Mode on, right-click a Discord category and Copy Channel ID. Empty puts channels at the top of the server.",
						children: /* @__PURE__ */ M(u, {
							value: o,
							onChange: (e) => s(e.target.value)
						})
					}),
					/* @__PURE__ */ M(l, {
						label: "Staff role",
						hint: "Optional. This Discord role sees and can answer every ticket.",
						children: /* @__PURE__ */ N(m, {
							value: c,
							onChange: (e) => f(e.target.value),
							children: [/* @__PURE__ */ M("option", {
								value: "",
								children: "Nobody else"
							}), t.roles.map((e) => /* @__PURE__ */ M("option", {
								value: e.id,
								children: e.name
							}, e.id))]
						})
					}),
					/* @__PURE__ */ M(n, {
						variant: "primary",
						loading: p.isPending,
						onClick: () => p.mutate(),
						children: "Save"
					})
				]
			}) }),
			t.invite_url && /* @__PURE__ */ M(i, { children: /* @__PURE__ */ N(a, {
				className: "space-y-2",
				children: [/* @__PURE__ */ M("p", {
					className: "text-sm text-muted",
					children: "The bot needs more permissions for tickets than for syncing roles. Invite it again to add them; nothing else about it changes."
				}), /* @__PURE__ */ M("a", {
					href: t.invite_url,
					target: "_blank",
					rel: "noreferrer",
					className: "text-sm font-medium text-accent-ink hover:underline",
					children: "Invite the bot with ticket permissions"
				})]
			}) })
		]
	}) : /* @__PURE__ */ M(h, { className: "h-48" })] });
}
//#endregion
//#region src/tickets.tsx
function B() {
	let r = O(), [i, a] = A("open"), [s, l] = A(!1), [u, f] = A(null), { data: m, isLoading: y } = D({
		queryKey: [
			"tickets",
			"list",
			i
		],
		queryFn: () => S.get(`${R}/tickets?state=${i}&limit=200`)
	}), w = E({
		mutationFn: ({ ticket: e, action: t }) => t === "close" ? S.post(`${R}/tickets/${e.id}/close`, {}) : S.delete(`${R}/tickets/${e.id}/channel`),
		onSuccess: (e, { action: t }) => {
			r.invalidateQueries({ queryKey: ["tickets"] }), T.success(t === "close" ? "Ticket closed" : "Channel deleted"), f(null);
		},
		onError: (e) => T.error(e.message)
	});
	return /* @__PURE__ */ N(j, { children: [
		/* @__PURE__ */ M(d, {
			eyebrow: "Discord",
			title: "Discord Tickets",
			icon: /* @__PURE__ */ M(F, {}),
			description: "Open a private Discord channel with a member you pick. Only the two of you and the staff role can see it.",
			actions: /* @__PURE__ */ N(n, {
				variant: "primary",
				onClick: () => l(!0),
				children: [/* @__PURE__ */ M(I, {}), " Open a ticket"]
			})
		}),
		/* @__PURE__ */ M("div", {
			className: "mb-4",
			children: /* @__PURE__ */ M(p, {
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
		y || !m ? /* @__PURE__ */ M(h, { className: "h-48" }) : m.items.length === 0 ? /* @__PURE__ */ M(c, {
			icon: /* @__PURE__ */ M(F, {}),
			title: i === "closed" ? "No closed tickets" : "No tickets",
			description: "Pick a member by their main, an alt or their Discord name. They need a linked Discord account.",
			action: /* @__PURE__ */ N(n, {
				variant: "primary",
				onClick: () => l(!0),
				children: [/* @__PURE__ */ M(I, {}), " Open a ticket"]
			})
		}) : /* @__PURE__ */ N(_, { children: [/* @__PURE__ */ M(g, { children: /* @__PURE__ */ N("tr", { children: [
			/* @__PURE__ */ M(b, { children: "Subject" }),
			/* @__PURE__ */ M(b, { children: "Member" }),
			/* @__PURE__ */ M(b, { children: "Opened" }),
			/* @__PURE__ */ M(b, { children: "Status" }),
			/* @__PURE__ */ M(b, {})
		] }) }), /* @__PURE__ */ M("tbody", { children: m.items.map((r) => /* @__PURE__ */ N(x, { children: [
			/* @__PURE__ */ M(v, {
				className: "max-w-xs truncate font-medium",
				title: r.subject,
				children: r.subject
			}),
			/* @__PURE__ */ M(v, { children: /* @__PURE__ */ N("span", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ M(e, {
					src: r.target?.portrait ?? null,
					name: r.target_name,
					size: "sm"
				}), /* @__PURE__ */ N("span", { children: [/* @__PURE__ */ M("span", {
					className: "block font-medium",
					children: r.target_name
				}), /* @__PURE__ */ M("span", {
					className: "block text-xs text-muted",
					children: r.target?.corporation ?? "No corporation"
				})] })]
			}) }),
			/* @__PURE__ */ N(v, {
				className: "whitespace-nowrap text-muted",
				children: [/* @__PURE__ */ M("span", {
					className: "block",
					children: C(r.opened_at)
				}), /* @__PURE__ */ N("span", {
					className: "block text-xs",
					children: ["by ", r.opened_by]
				})]
			}),
			/* @__PURE__ */ M(v, { children: r.closed_at ? /* @__PURE__ */ N(t, {
				tone: "neutral",
				children: ["Closed", r.closed_by ? ` by ${r.closed_by}` : ""]
			}) : /* @__PURE__ */ M(t, {
				tone: "accent",
				children: "Open"
			}) }),
			/* @__PURE__ */ M(v, { children: /* @__PURE__ */ N("span", {
				className: "flex items-center justify-end gap-2",
				children: [
					r.url && /* @__PURE__ */ N("a", {
						href: r.url,
						target: "_blank",
						rel: "noreferrer",
						className: "inline-flex items-center gap-1 text-sm hover:text-accent-ink",
						children: ["Open in Discord ", /* @__PURE__ */ M(L, { className: "size-3.5" })]
					}),
					!r.closed_at && /* @__PURE__ */ M(n, {
						size: "sm",
						variant: "outline",
						onClick: () => f({
							ticket: r,
							action: "close"
						}),
						children: "Close"
					}),
					r.can_delete_channel && /* @__PURE__ */ M(n, {
						size: "sm",
						variant: "ghost",
						onClick: () => f({
							ticket: r,
							action: "delete"
						}),
						children: "Delete channel"
					})
				]
			}) })
		] }, r.id)) })] }),
		s && /* @__PURE__ */ M(H, { onClose: () => l(!1) }),
		/* @__PURE__ */ M(o, {
			open: u !== null,
			onOpenChange: (e) => !e && f(null),
			danger: u?.action === "delete",
			title: u?.action === "delete" ? "Delete this channel?" : `Close the ticket with ${u?.ticket.target_name}?`,
			description: u?.action === "delete" ? "The channel and everything said in it are deleted from Discord for good. The ticket stays in this list." : "They can no longer see the channel. You and the staff role still can.",
			confirmLabel: u?.action === "delete" ? "Delete channel" : "Close ticket",
			onConfirm: () => u ? w.mutateAsync(u) : void 0
		})
	] });
}
function V(e) {
	let [t, n] = A(e);
	return k(() => {
		let t = setTimeout(() => n(e.trim()), 250);
		return () => clearTimeout(t);
	}, [e]), t;
}
function H({ onClose: i }) {
	let a = O(), [o, c] = A(""), [d, p] = A(null), [m, h] = A(""), [g, _] = A(""), v = V(o), { data: b, isFetching: x } = D({
		queryKey: [
			"tickets",
			"members",
			v
		],
		queryFn: () => S.get(`${R}/members?q=${encodeURIComponent(v)}`),
		enabled: v.length >= 2 && !d
	}), C = d && !d.open_ticket && m.trim().length > 0, w = E({
		mutationFn: () => S.post(`${R}/tickets`, {
			user_id: d.id,
			subject: m,
			message: g
		}),
		onSuccess: (e) => {
			a.invalidateQueries({ queryKey: ["tickets"] }), T.success(`Ticket opened with ${e.target_name}`), i();
		},
		onError: (e) => T.error(e.message)
	});
	return /* @__PURE__ */ M(s, {
		open: !0,
		onOpenChange: (e) => !e && i(),
		title: "Open a ticket",
		description: "This makes a private channel on the Discord server and pings the member.",
		footer: /* @__PURE__ */ N(j, { children: [/* @__PURE__ */ M(n, {
			variant: "ghost",
			onClick: i,
			children: "Cancel"
		}), /* @__PURE__ */ M(n, {
			variant: "primary",
			disabled: !C,
			loading: w.isPending,
			onClick: () => w.mutate(),
			children: "Open ticket"
		})] }),
		children: /* @__PURE__ */ N("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ M(l, {
					label: "Member",
					hint: "Search by their main, an alt you can see, or their Discord name.",
					children: d ? /* @__PURE__ */ N("div", {
						className: "flex items-center justify-between gap-2 border border-border px-3 py-2",
						children: [/* @__PURE__ */ N("span", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ M(e, {
								src: d.portrait,
								name: d.name,
								size: "sm"
							}), /* @__PURE__ */ N("span", { children: [/* @__PURE__ */ M("span", {
								className: "block font-medium",
								children: d.name
							}), /* @__PURE__ */ N("span", {
								className: "block text-xs text-muted",
								children: ["@", d.discord]
							})] })]
						}), /* @__PURE__ */ M(n, {
							size: "sm",
							variant: "ghost",
							onClick: () => p(null),
							children: "Change"
						})]
					}) : /* @__PURE__ */ N("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ M(f, {
							value: o,
							onChange: (e) => c(e.target.value),
							placeholder: "Character or Discord name",
							"aria-label": "Character or Discord name",
							autoFocus: !0
						}), v.length >= 2 && /* @__PURE__ */ M("ul", {
							className: "max-h-60 divide-y divide-border overflow-y-auto border border-border",
							children: x && !b ? /* @__PURE__ */ M("li", {
								className: "px-3 py-2 text-sm text-muted",
								children: "Searching…"
							}) : b?.items.length === 0 ? /* @__PURE__ */ M("li", {
								className: "px-3 py-2 text-sm text-muted",
								children: "Nobody with a linked Discord account matches that."
							}) : b?.items.map((n) => /* @__PURE__ */ M("li", { children: /* @__PURE__ */ N("button", {
								type: "button",
								onClick: () => p(n),
								className: "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-hover",
								children: [
									/* @__PURE__ */ M(e, {
										src: n.portrait,
										name: n.name,
										size: "sm"
									}),
									/* @__PURE__ */ N("span", {
										className: "flex-1",
										children: [/* @__PURE__ */ M("span", {
											className: "block font-medium",
											children: n.name
										}), /* @__PURE__ */ N("span", {
											className: "block text-xs text-muted",
											children: [
												n.matched ? `Alt: ${n.matched} · ` : "",
												"@",
												n.discord
											]
										})]
									}),
									n.open_ticket && /* @__PURE__ */ M(t, {
										tone: "accent",
										children: "Open ticket"
									}),
									!n.on_server && /* @__PURE__ */ M(t, {
										tone: "neutral",
										children: "Not on server"
									})
								]
							}) }, n.id))
						})]
					})
				}),
				d?.open_ticket && /* @__PURE__ */ N(r, {
					tone: "warning",
					children: [
						"You already have an open ticket with ",
						d.name,
						". Close it to open another."
					]
				}),
				/* @__PURE__ */ M(l, {
					label: "Subject",
					hint: "Everyone in the channel sees it.",
					children: /* @__PURE__ */ M(u, {
						maxLength: 100,
						value: m,
						onChange: (e) => h(e.target.value)
					})
				}),
				/* @__PURE__ */ M(l, {
					label: "First message",
					hint: "Optional. The bot posts it in the channel.",
					children: /* @__PURE__ */ M(y, {
						rows: 3,
						maxLength: 1500,
						value: g,
						onChange: (e) => _(e.target.value)
					})
				})
			]
		})
	});
}
//#endregion
//#region src/index.tsx
var U = w({ routes: [{
	path: "",
	Component: B
}, {
	path: "settings",
	Component: z
}] });
//#endregion
export { U as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","about","accent","account","act","action","actions","add","again","already","alt","an","and","answer","anything","are","aria-label","as","at","autoFocus","block","border","border-border","bot","but","button","by","can","can_delete_channel","category","category_id","channel","channels","children","className","close","closed","closed_at","closed_by","confirmLabel","const","corporation","count","currentColor","danger","data","default","definePlugin","delete","deleted","deleting","description","disabled","discord","divide-border","divide-y","else","enabled","every","everything","export","extends","eyebrow","few","fill","filter","flex","flex-1","font-medium","footer","for","from","function","gap-1","gap-2","get","ghost","h-48","have","here","hint","hover:bg-hover","hover:text-accent-ink","hover:underline","href","icon","icons","id","if","import","in","inline","inline-flex","interface","invite_url","isFetching","isLoading","it","items","items-center","justify-between","justify-end","key","label","length","linked","list","list-disc","loading","longer","main","makes","matched","matches","max-h-60","max-w-xs","maxLength","mb-4","member","members","message","more","mutationFn","name","need","needs","neutral","new","no","none","noreferrer","not","nothing","number","of","on","onChange","onClick","onClose","onConfirm","onError","onOpenChange","onSuccess","on_server","open","open_ticket","opened","opened_at","opened_by","opening","options","or","outline","overflow-y-auto","page","path","permissions","picked","pings","pl-4","placeholder","portrait","post","posts","primary","private","problems","put","puts","px-3","py-2","qc","queryFn","queryKey","react","rel","rest","return","right-click","role","roles","round","routes","rows","s","said","save","search","see","sees","server","set","setCategory","setConfirm","setFilter","setMessage","setOpening","setOut","setPicked","setQ","setRole","setSubject","settings","site","size","size-3.5","size-4","sm","so","space-y-1","space-y-2","space-y-4","src","staff","staff_role_id","stays","still","stopping","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","subject","syncing","t","target","target_name","text-accent-ink","text-left","text-muted","text-sm","text-xs","than","the","their","this","ticket","tickets","title","to","toast","tone","top","truncate","two","type","up","url","use","useQueryClient","useState","used","user_id","valid","value","variant","viewBox","void","w-full","warning","where","which","whitespace-nowrap","with","you"];
