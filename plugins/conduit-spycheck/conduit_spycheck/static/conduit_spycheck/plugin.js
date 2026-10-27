import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, Dialog as c, EmptyState as l, Field as u, Input as d, PageHeader as f, SearchInput as p, Segmented as m, Select as h, Skeleton as g, SwitchRow as _, THead as v, TabPanel as y, Table as b, Tabs as ee, Td as x, Textarea as S, Th as C, Tr as w, api as T, date as E, dateTime as D, definePlugin as te, isk as O, num as k, timeAgo as A, toast as j } from "@conduit/sdk";
import { useMutation as M, useQuery as N, useQueryClient as P } from "@tanstack/react-query";
import { Link as F, useParams as ne, useSearchParams as re } from "react-router";
import { useEffect as I, useState as L } from "react";
import { Fragment as R, jsx as z, jsxs as B } from "react/jsx-runtime";
//#region src/icons.tsx
function V({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ z("svg", {
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
var H = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M19.07 4.93A10 10 0 0 0 6.99 3.34" }),
		/* @__PURE__ */ z("path", { d: "M4 6h.01" }),
		/* @__PURE__ */ z("path", { d: "M2.29 9.62A10 10 0 1 0 21.31 8.35" }),
		/* @__PURE__ */ z("path", { d: "M16.24 7.76A6 6 0 1 0 8.23 16.67" }),
		/* @__PURE__ */ z("path", { d: "M12 18h.01" }),
		/* @__PURE__ */ z("path", { d: "M17.99 11.66A6 6 0 0 1 15.77 16.67" }),
		/* @__PURE__ */ z("circle", {
			cx: "12",
			cy: "12",
			r: "2"
		}),
		/* @__PURE__ */ z("path", { d: "m13.41 10.59 5.66-5.66" })
	]
}), U = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "M20 6 9 17l-5-5" })
}), W = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M5 12h14" }), /* @__PURE__ */ z("path", { d: "M12 5v14" })]
}), G = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M3 6h18" }),
		/* @__PURE__ */ z("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ z("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), ie = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ z("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ z("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ z("path", { d: "M8 16H3v5" })
	]
}), ae = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" }), /* @__PURE__ */ z("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), oe = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" })
}), se = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ z("path", { d: "M19 12H5" })]
}), ce = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ z("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ z("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), K = {
	journal: "Wallet journal",
	market: "Market",
	contract: "Contracts",
	mail: "Mail",
	contact: "Contact",
	corp_history: "Corporation history"
}, q = {
	new: {
		label: "New",
		tone: "warning"
	},
	acknowledged: {
		label: "Acknowledged",
		tone: "info"
	},
	dismissed: {
		label: "Dismissed",
		tone: "neutral"
	}
}, J = {
	character: "Character",
	corporation: "Corporation",
	alliance: "Alliance"
}, Y = "/api/p/spycheck";
//#endregion
//#region src/shared.tsx
function X({ src: e, round: t }) {
	return e ? /* @__PURE__ */ z("img", {
		src: e,
		alt: "",
		className: `size-6 shrink-0 ${t ? "rounded-full" : "rounded"}`
	}) : /* @__PURE__ */ z("span", { className: "size-6 shrink-0" });
}
function Z({ e }) {
	return e ? /* @__PURE__ */ B("span", {
		className: "inline-flex items-center gap-1.5",
		children: [/* @__PURE__ */ z(X, {
			src: e.image,
			round: e.kind === "character"
		}), e.name]
	}) : /* @__PURE__ */ z("span", {
		className: "text-subtle",
		children: "—"
	});
}
function le({ f: e }) {
	return /* @__PURE__ */ B("span", {
		className: "inline-flex flex-wrap gap-1",
		children: [
			/* @__PURE__ */ z(n, {
				tone: q[e.state].tone,
				children: q[e.state].label
			}),
			e.reopened && /* @__PURE__ */ z(n, {
				tone: "danger",
				children: "Reopened: newer evidence"
			}),
			e.new_evidence && /* @__PURE__ */ z(n, {
				tone: "warning",
				children: "Newer evidence"
			}),
			!e.present && /* @__PURE__ */ z(n, {
				tone: "neutral",
				children: "No longer found"
			})
		]
	});
}
function ue(e) {
	if (e.kind === "contact") return `Standing ${e.amount > 0 ? "+" : ""}${e.amount}`;
	if (e.kind === "corp_history") return e.count === 1 ? "1 stint" : `${e.count} stints`;
	let t = `${k(e.count)} ${e.kind === "mail" ? "mail" : e.kind === "contract" ? "contract" : e.kind === "market" ? "trade" : "line"}${e.count === 1 ? "" : "s"}`;
	return e.amount ? `${t} · ${O(e.amount)}` : t;
}
function de(e) {
	return e.last_seen ? e.first_seen && e.first_seen.slice(0, 10) !== e.last_seen.slice(0, 10) ? `${E(e.first_seen)} – ${E(e.last_seen)}` : E(e.last_seen) : e.kind === "contact" ? "In their contacts now" : "Now";
}
function fe({ items: e, onOpen: n, showMember: i = !0 }) {
	return /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		i && /* @__PURE__ */ z(C, { children: "Member" }),
		/* @__PURE__ */ z(C, { children: "Character" }),
		/* @__PURE__ */ z(C, { children: "Dealt with" }),
		/* @__PURE__ */ z(C, { children: "How" }),
		/* @__PURE__ */ z(C, { children: "Evidence" }),
		/* @__PURE__ */ z(C, { children: "Seen" }),
		/* @__PURE__ */ z(C, { children: "Status" }),
		/* @__PURE__ */ z(C, {})
	] }) }), /* @__PURE__ */ z("tbody", { children: e.map((e) => /* @__PURE__ */ B(w, { children: [
		i && /* @__PURE__ */ z(x, { children: /* @__PURE__ */ B(F, {
			to: `/p/spycheck/members/${e.user.id}`,
			className: "flex items-center gap-2 hover:text-accent-ink",
			children: [/* @__PURE__ */ z(t, {
				src: e.user.portrait,
				name: e.user.name,
				size: "sm"
			}), /* @__PURE__ */ B("span", { children: [/* @__PURE__ */ z("span", {
				className: "block font-medium",
				children: e.user.name
			}), /* @__PURE__ */ z("span", {
				className: "block text-xs text-muted",
				children: e.user.corporation ?? "No corporation"
			})] })]
		}) }),
		/* @__PURE__ */ z(x, { children: e.character.name }),
		/* @__PURE__ */ B(x, { children: [/* @__PURE__ */ z(Z, { e: e.entity }), e.source === "blacklist" && /* @__PURE__ */ z("span", {
			className: "ml-1.5 text-xs text-muted",
			children: "Blacklist"
		})] }),
		/* @__PURE__ */ z(x, { children: K[e.kind] }),
		/* @__PURE__ */ z(x, {
			className: "text-muted",
			children: ue(e)
		}),
		/* @__PURE__ */ z(x, {
			className: "text-muted",
			children: de(e)
		}),
		/* @__PURE__ */ z(x, { children: /* @__PURE__ */ z(le, { f: e }) }),
		/* @__PURE__ */ z(x, {
			className: "text-right",
			children: /* @__PURE__ */ z(r, {
				size: "sm",
				variant: "outline",
				onClick: () => n(e),
				children: "Evidence"
			})
		})
	] }, e.id)) })] });
}
function pe({ state: e }) {
	return /* @__PURE__ */ z(l, {
		icon: z(e === "new" ? U : H, {}),
		title: e === "new" ? "Nothing new" : "Nothing here",
		description: e === "new" ? "No member dealt with anyone watched since the last review." : void 0
	});
}
function me({ finding: e, onClose: n }) {
	let i = P(), [a, o] = L("acknowledged"), [s, l] = L(""), { data: d, isLoading: f } = N({
		queryKey: [
			"spycheck",
			"evidence",
			e?.id
		],
		queryFn: () => T.get(`${Y}/findings/${e.id}`),
		enabled: !!e
	});
	I(() => {
		d && (o(d.state === "new" ? "acknowledged" : d.state), l(d.note));
	}, [d]);
	let p = M({
		mutationFn: () => T.post(`${Y}/findings/${e.id}/state`, {
			state: a,
			note: s
		}),
		onSuccess: (e) => {
			j.success(`Marked ${q[e.state].label.toLowerCase()}`), i.invalidateQueries({ queryKey: ["spycheck"] }), n();
		},
		onError: (e) => j.error(e.message)
	});
	return /* @__PURE__ */ z(c, {
		open: !!e,
		onOpenChange: (e) => !e && n(),
		size: "xl",
		title: e ? `${e.character.name} · ${K[e.kind]} with ${e.entity.name}` : "",
		description: "Opening this is noted in the snooper log, like opening that tab of their character sheet.",
		footer: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(r, {
			variant: "ghost",
			onClick: n,
			children: "Close"
		}), /* @__PURE__ */ z(r, {
			variant: a === "dismissed" ? "danger" : "primary",
			loading: p.isPending,
			disabled: !d,
			onClick: () => p.mutate(),
			children: "Save review"
		})] }),
		children: f || !d ? /* @__PURE__ */ z(g, { className: "h-48" }) : /* @__PURE__ */ B("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ B("div", {
					className: "flex flex-wrap items-center gap-x-4 gap-y-2 text-sm",
					children: [
						/* @__PURE__ */ B("span", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ z(t, {
									src: d.user.portrait,
									name: d.user.name,
									size: "sm"
								}),
								" ",
								d.user.name
							]
						}),
						/* @__PURE__ */ B("span", {
							className: "text-muted",
							children: [
								ue(d),
								" · ",
								de(d)
							]
						}),
						/* @__PURE__ */ z(le, { f: d }),
						/* @__PURE__ */ B(F, {
							to: d.sheet_link,
							className: "ml-auto inline-flex items-center gap-1 text-accent-ink",
							children: [/* @__PURE__ */ z(ce, {}), " Character sheet"]
						})
					]
				}),
				d.decided_by && /* @__PURE__ */ B("p", {
					className: "text-sm text-muted",
					children: [
						q[d.state === "new" ? "dismissed" : d.state].label,
						" by ",
						d.decided_by,
						" ",
						d.decided_at ? A(d.decided_at) : "",
						d.note ? `: “${d.note}”` : ""
					]
				}),
				/* @__PURE__ */ z("div", {
					className: "max-h-[45vh] overflow-auto rounded-lg border border-border",
					children: d.character_registered ? d.rows.length === 0 ? /* @__PURE__ */ z("p", {
						className: "p-4 text-sm text-muted",
						children: "The records aren't in the synced data any more."
					}) : /* @__PURE__ */ z(he, {
						kind: d.kind,
						rows: d.rows
					}) : /* @__PURE__ */ z("p", {
						className: "p-4 text-sm text-muted",
						children: "The character isn't registered here any more, so its data is gone."
					})
				}),
				d.rows_limited && /* @__PURE__ */ B("p", {
					className: "text-xs text-subtle",
					children: [
						"The latest ",
						d.rows.length,
						" are shown; the rest are on the character sheet."
					]
				}),
				/* @__PURE__ */ B("div", {
					className: "space-y-3 border-t border-border pt-4",
					children: [/* @__PURE__ */ z(m, {
						value: a,
						onChange: o,
						options: [
							{
								value: "new",
								label: "New"
							},
							{
								value: "acknowledged",
								label: "Acknowledged"
							},
							{
								value: "dismissed",
								label: "Dismissed"
							}
						]
					}), /* @__PURE__ */ z(u, {
						label: a === "dismissed" ? "Why it's fine (needed)" : "Note (optional)",
						hint: a === "dismissed" ? "It stays dismissed until there's newer evidence than what's here now." : void 0,
						children: /* @__PURE__ */ z(S, {
							rows: 2,
							value: s,
							onChange: (e) => l(e.target.value)
						})
					})]
				})
			]
		})
	});
}
function he({ kind: e, rows: t }) {
	return e === "journal" ? /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(C, { children: "Date" }),
		/* @__PURE__ */ z(C, { children: "Type" }),
		/* @__PURE__ */ z(C, { children: "From" }),
		/* @__PURE__ */ z(C, { children: "To" }),
		/* @__PURE__ */ z(C, {
			className: "text-right",
			children: "Amount"
		}),
		/* @__PURE__ */ z(C, { children: "Reason" })
	] }) }), /* @__PURE__ */ z("tbody", { children: t.map((e, t) => /* @__PURE__ */ B(w, { children: [
		/* @__PURE__ */ z(x, {
			className: "whitespace-nowrap text-muted",
			children: D(e.date)
		}),
		/* @__PURE__ */ z(x, { children: e.ref_type?.replaceAll("_", " ") }),
		/* @__PURE__ */ z(x, { children: /* @__PURE__ */ z(Z, { e: e.first_party }) }),
		/* @__PURE__ */ z(x, { children: /* @__PURE__ */ z(Z, { e: e.second_party }) }),
		/* @__PURE__ */ z(x, {
			className: `text-right font-mono tabular-nums ${(e.amount ?? 0) < 0 ? "text-danger-fg" : "text-success-fg"}`,
			children: O(e.amount, { full: !0 })
		}),
		/* @__PURE__ */ z(x, {
			className: "text-muted",
			children: e.reason || e.description
		})
	] }, t)) })] }) : e === "market" ? /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(C, { children: "Date" }),
		/* @__PURE__ */ z(C, { children: "Item" }),
		/* @__PURE__ */ z(C, { children: "They" }),
		/* @__PURE__ */ z(C, {
			className: "text-right",
			children: "Quantity"
		}),
		/* @__PURE__ */ z(C, {
			className: "text-right",
			children: "Total"
		})
	] }) }), /* @__PURE__ */ z("tbody", { children: t.map((e, t) => /* @__PURE__ */ B(w, { children: [
		/* @__PURE__ */ z(x, {
			className: "whitespace-nowrap text-muted",
			children: D(e.date)
		}),
		/* @__PURE__ */ z(x, { children: typeof e.type == "object" ? e.type.name : e.type }),
		/* @__PURE__ */ z(x, { children: e.is_buy ? "Sold to the member" : "Bought from the member" }),
		/* @__PURE__ */ z(x, {
			className: "text-right tabular-nums",
			children: k(e.quantity)
		}),
		/* @__PURE__ */ z(x, {
			className: "text-right font-mono tabular-nums",
			children: O(e.total, { full: !0 })
		})
	] }, t)) })] }) : e === "contract" ? /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(C, { children: "Issued" }),
		/* @__PURE__ */ z(C, { children: "Type" }),
		/* @__PURE__ */ z(C, { children: "Title" }),
		/* @__PURE__ */ z(C, { children: "Issuer" }),
		/* @__PURE__ */ z(C, { children: "Assignee" }),
		/* @__PURE__ */ z(C, { children: "Acceptor" }),
		/* @__PURE__ */ z(C, { children: "Status" }),
		/* @__PURE__ */ z(C, {
			className: "text-right",
			children: "Price"
		})
	] }) }), /* @__PURE__ */ z("tbody", { children: t.map((e) => /* @__PURE__ */ B(w, { children: [
		/* @__PURE__ */ z(x, {
			className: "whitespace-nowrap text-muted",
			children: D(e.date)
		}),
		/* @__PURE__ */ z(x, { children: typeof e.type == "string" ? e.type.replaceAll("_", " ") : "" }),
		/* @__PURE__ */ z(x, { children: e.title || /* @__PURE__ */ z("span", {
			className: "text-subtle",
			children: "—"
		}) }),
		/* @__PURE__ */ z(x, { children: /* @__PURE__ */ z(Z, { e: e.issuer }) }),
		/* @__PURE__ */ z(x, { children: /* @__PURE__ */ z(Z, { e: e.assignee }) }),
		/* @__PURE__ */ z(x, { children: /* @__PURE__ */ z(Z, { e: e.acceptor }) }),
		/* @__PURE__ */ z(x, { children: e.status?.replaceAll("_", " ") }),
		/* @__PURE__ */ z(x, {
			className: "text-right font-mono tabular-nums",
			children: O((e.price ?? 0) + (e.reward ?? 0))
		})
	] }, e.contract_id)) })] }) : e === "mail" ? /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(C, { children: "Date" }),
		/* @__PURE__ */ z(C, { children: "From" }),
		/* @__PURE__ */ z(C, { children: "To" }),
		/* @__PURE__ */ z(C, { children: "Subject" })
	] }) }), /* @__PURE__ */ z("tbody", { children: t.map((e) => /* @__PURE__ */ B(w, { children: [
		/* @__PURE__ */ z(x, {
			className: "whitespace-nowrap text-muted",
			children: D(e.date)
		}),
		/* @__PURE__ */ z(x, { children: /* @__PURE__ */ z(Z, { e: e.sender }) }),
		/* @__PURE__ */ z(x, {
			className: "text-muted",
			children: (e.recipients ?? []).map((e) => e?.name).filter(Boolean).join(", ")
		}),
		/* @__PURE__ */ z(x, { children: e.subject || /* @__PURE__ */ z("span", {
			className: "text-subtle",
			children: "(no subject)"
		}) })
	] }, e.mail_id)) })] }) : e === "contact" ? /* @__PURE__ */ z("div", {
		className: "space-y-1 p-4 text-sm",
		children: t.map((e, t) => /* @__PURE__ */ B("p", { children: [
			"Standing ",
			/* @__PURE__ */ B("span", {
				className: "font-mono",
				children: [(e.standing ?? 0) > 0 ? "+" : "", e.standing]
			}),
			e.is_watched ? " · on their watch list" : "",
			e.is_blocked ? " · blocked" : "",
			e.labels && e.labels.length > 0 ? ` · labels: ${e.labels.join(", ")}` : ""
		] }, t))
	}) : /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(C, { children: "Corporation" }),
		/* @__PURE__ */ z(C, { children: "From" }),
		/* @__PURE__ */ z(C, { children: "Until" })
	] }) }), /* @__PURE__ */ z("tbody", { children: t.map((e, t) => /* @__PURE__ */ B(w, { children: [
		/* @__PURE__ */ z(x, { children: /* @__PURE__ */ z(Z, { e: e.corporation }) }),
		/* @__PURE__ */ z(x, {
			className: "text-muted",
			children: e.start ? E(e.start) : "—"
		}),
		/* @__PURE__ */ z(x, {
			className: "text-muted",
			children: e.current ? "Now" : E(e.end)
		})
	] }, t)) })] });
}
//#endregion
//#region src/manage.tsx
function ge() {
	let [e, t] = L(!1), [n, c] = L(null), u = P(), { data: d, isLoading: f } = N({
		queryKey: ["spycheck", "watch"],
		queryFn: () => T.get(`${Y}/watch`)
	});
	return f || !d ? /* @__PURE__ */ z(g, { className: "h-48" }) : /* @__PURE__ */ B("div", {
		className: "grid gap-6 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, {
				title: "Watch list",
				description: "Characters, corporations and alliances to look for, besides the blacklist.",
				actions: d.can_manage && /* @__PURE__ */ B(r, {
					size: "sm",
					variant: "primary",
					onClick: () => t(!0),
					children: [/* @__PURE__ */ z(W, {}), " Watch"]
				})
			}), d.items.length === 0 ? /* @__PURE__ */ z(l, {
				icon: /* @__PURE__ */ z(ae, {}),
				title: "Nobody watched yet",
				description: d.can_manage ? "Add whoever you want members' dealings with looked for." : void 0
			}) : /* @__PURE__ */ z(_e, {
				items: d.items,
				onRemove: d.can_manage ? c : void 0
			})] }),
			/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, {
				title: "From the blacklist",
				description: "Active blacklist entries are watched too."
			}), d.blacklist_available ? d.use_blacklist ? d.blacklist.length === 0 ? /* @__PURE__ */ z(l, {
				icon: /* @__PURE__ */ z(oe, {}),
				title: "The blacklist is empty"
			}) : /* @__PURE__ */ z(_e, { items: d.blacklist }) : /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z("p", {
				className: "text-sm text-muted",
				children: "Switched off in the settings."
			}) }) : /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z("p", {
				className: "text-sm text-muted",
				children: "The Blacklist plugin isn't installed or switched on. Spy Check works from its own watch list."
			}) })] }),
			e && /* @__PURE__ */ z(ve, { onClose: () => t(!1) }),
			/* @__PURE__ */ z(s, {
				open: !!n,
				onOpenChange: (e) => !e && c(null),
				title: `Stop watching ${n?.name ?? ""}?`,
				description: "Its findings stay; the next scan just stops looking for it.",
				danger: !0,
				confirmLabel: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(G, {}), " Remove"] }),
				onConfirm: () => T.delete(`${Y}/watch/${n.id}`).then(() => {
					u.invalidateQueries({ queryKey: ["spycheck"] }), j.success(`${n.name} removed`), c(null);
				})
			})
		]
	});
}
function _e({ items: e, onRemove: t }) {
	return /* @__PURE__ */ z("ul", {
		className: "divide-y divide-border",
		children: e.map((e) => /* @__PURE__ */ B("li", {
			className: "flex items-start gap-3 px-card py-3",
			children: [
				/* @__PURE__ */ z(X, {
					src: e.image,
					round: e.kind === "character"
				}),
				/* @__PURE__ */ B("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ B("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ z("span", {
									className: "font-medium",
									children: e.name
								}),
								/* @__PURE__ */ z("span", {
									className: "text-xs text-muted",
									children: J[e.kind]
								}),
								e.severity && /* @__PURE__ */ z(n, {
									tone: e.severity === "banned" ? "danger" : "warning",
									children: e.severity === "banned" ? "Banned" : "Watch"
								}),
								e.open > 0 && /* @__PURE__ */ B(n, {
									tone: "warning",
									children: [e.open, " new"]
								})
							]
						}),
						e.reason && /* @__PURE__ */ z("p", {
							className: "mt-1 whitespace-pre-line text-sm text-muted",
							children: e.reason
						}),
						e.created_at && /* @__PURE__ */ B("div", {
							className: "mt-1 text-xs text-subtle",
							children: [
								"Added ",
								E(e.created_at),
								e.added_by ? ` by ${e.added_by}` : ""
							]
						})
					]
				}),
				t && /* @__PURE__ */ z(r, {
					size: "sm",
					variant: "ghost",
					onClick: () => t(e),
					"aria-label": `Remove ${e.name}`,
					children: /* @__PURE__ */ z(G, {})
				})
			]
		}, e.eve_id))
	});
}
function ve({ onClose: e }) {
	let t = P(), [n, i] = L(""), [a, o] = L(""), [s, l] = L(null), [d, f] = L("");
	I(() => {
		let e = setTimeout(() => o(n.trim()), 350);
		return () => clearTimeout(e);
	}, [n]);
	let { data: m, isFetching: h } = N({
		queryKey: [
			"spycheck",
			"entities",
			a
		],
		queryFn: () => T.get(`${Y}/entities?q=${encodeURIComponent(a)}`),
		enabled: a.length >= 3
	}), g = M({
		mutationFn: () => T.post(`${Y}/watch`, {
			eve_id: s.id,
			reason: d
		}),
		onSuccess: (n) => {
			t.invalidateQueries({ queryKey: ["spycheck"] }), j.success(`Watching ${n.name}. The next scan looks for them.`), e();
		},
		onError: (e) => j.error(e.message)
	});
	return /* @__PURE__ */ z(c, {
		open: !0,
		onOpenChange: (t) => !t && e(),
		title: "Watch someone",
		description: "Members' dealings with them are looked for from the next scan on.",
		size: "lg",
		footer: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(r, {
			variant: "ghost",
			onClick: e,
			children: "Cancel"
		}), /* @__PURE__ */ B(r, {
			variant: "primary",
			disabled: !s,
			loading: g.isPending,
			onClick: () => g.mutate(),
			children: [/* @__PURE__ */ z(W, {}), " Watch"]
		})] }),
		children: /* @__PURE__ */ B("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ z(u, {
					label: "Who",
					hint: "A character, corporation or alliance. Ones the synced data hasn't mentioned are found by their exact name.",
					children: /* @__PURE__ */ z(p, {
						value: n,
						onChange: (e) => i(e.target.value),
						placeholder: "Name",
						"aria-label": "Name"
					})
				}),
				a.length >= 3 && !h && m && m.length === 0 && /* @__PURE__ */ z("p", {
					className: "text-sm text-muted",
					children: "Nobody by that name."
				}),
				(m ?? []).length > 0 && /* @__PURE__ */ z("div", {
					className: "divide-y divide-border rounded-lg border border-border",
					children: m.map((e) => /* @__PURE__ */ B("label", {
						className: `flex items-center gap-3 px-3 py-2.5 text-sm ${e.watched ? "opacity-60" : "cursor-pointer"}`,
						children: [
							/* @__PURE__ */ z("input", {
								type: "radio",
								name: "who",
								disabled: e.watched,
								checked: s?.id === e.id,
								onChange: () => l(e)
							}),
							/* @__PURE__ */ z(X, {
								src: e.image,
								round: e.kind === "character"
							}),
							/* @__PURE__ */ B("span", {
								className: "flex-1",
								children: [
									e.name,
									" ",
									/* @__PURE__ */ z("span", {
										className: "text-xs text-muted",
										children: J[e.kind]
									})
								]
							}),
							e.watched && /* @__PURE__ */ z("span", {
								className: "text-xs text-muted",
								children: "Already watched"
							})
						]
					}, e.id))
				}),
				/* @__PURE__ */ z(u, {
					label: "Why (optional)",
					children: /* @__PURE__ */ z(S, {
						rows: 3,
						value: d,
						onChange: (e) => f(e.target.value)
					})
				})
			]
		})
	});
}
function ye() {
	let t = P(), { data: n, isLoading: s } = N({
		queryKey: ["spycheck", "settings"],
		queryFn: () => T.get(`${Y}/settings`)
	}), [c, l] = L(null);
	I(() => {
		n && l(n);
	}, [n]);
	let f = M({
		mutationFn: (e) => T.put(`${Y}/settings`, e),
		onSuccess: (e) => {
			t.setQueryData(["spycheck", "settings"], e), t.invalidateQueries({ queryKey: ["spycheck"] }), j.success("Saved. The next scan uses them.");
		},
		onError: (e) => j.error(e.message)
	});
	if (s || !c) return /* @__PURE__ */ z(g, { className: "h-64" });
	let p = (e) => l({
		...c,
		...e
	}), m = (e, t) => p({ skip_kinds: t ? c.skip_kinds.filter((t) => t !== e) : [...c.skip_kinds, e] });
	return /* @__PURE__ */ B("div", {
		className: "grid max-w-5xl gap-6 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, {
				title: "Who is told",
				description: "One notification per scan with what's new, never one per finding."
			}), /* @__PURE__ */ B(a, {
				className: "space-y-3",
				children: [/* @__PURE__ */ z(u, {
					label: "Group",
					hint: "Only its members who may see Spy Check get it. None: everyone who may.",
					children: /* @__PURE__ */ z(h, {
						value: c.notify_group == null ? "" : String(c.notify_group),
						onChange: (e) => p({ notify_group: e.target.value ? Number(e.target.value) : null }),
						options: [{
							value: "",
							label: "Everyone who may see Spy Check"
						}, ...c.group_options.map((e) => ({
							value: String(e.id),
							label: e.name
						}))]
					})
				}), n && c.notify_group === n.notify_group && (n.recipients === 0 ? /* @__PURE__ */ z(e, {
					tone: "warning",
					children: "Nobody gets the notification: give the group the “see Spy Check findings” permission."
				}) : /* @__PURE__ */ B("p", {
					className: "text-sm text-muted",
					children: [
						n.recipients,
						" ",
						n.recipients === 1 ? "person gets" : "people get",
						" it."
					]
				}))]
			})] }),
			/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, { title: "The blacklist" }), /* @__PURE__ */ B(a, {
				className: "space-y-2",
				children: [!c.blacklist_available && /* @__PURE__ */ z(e, {
					tone: "info",
					children: "The Blacklist plugin isn't installed or switched on, so only the watch list is used."
				}), /* @__PURE__ */ B("div", {
					className: "divide-y divide-border",
					children: [/* @__PURE__ */ z(_, {
						label: "Look for blacklisted entities",
						description: "Every active entry, besides the watch list.",
						checked: c.use_blacklist,
						onCheckedChange: (e) => p({ use_blacklist: e })
					}), /* @__PURE__ */ z(_, {
						label: "Include “watch” entries",
						description: "Off: only entries marked banned.",
						checked: c.blacklist_watch_entries,
						onCheckedChange: (e) => p({ blacklist_watch_entries: e })
					})]
				})]
			})] }),
			/* @__PURE__ */ B(i, {
				className: "lg:col-span-2",
				children: [/* @__PURE__ */ z(o, {
					title: "What is looked at",
					description: "Each kind is read from the character data Conduit already syncs."
				}), /* @__PURE__ */ B(a, {
					className: "grid gap-x-8 sm:grid-cols-2",
					children: [/* @__PURE__ */ z("div", {
						className: "divide-y divide-border",
						children: c.kind_options.map((e) => /* @__PURE__ */ z(_, {
							label: e.label,
							checked: !c.skip_kinds.includes(e.value),
							onCheckedChange: (t) => m(e.value, t)
						}, e.value))
					}), /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z(u, {
						label: "Contacts count above standing",
						hint: "0 means any good standing. Contacts at or below it aren't findings.",
						children: /* @__PURE__ */ z(d, {
							type: "number",
							min: -10,
							max: 10,
							step: .5,
							value: c.min_standing,
							onChange: (e) => p({ min_standing: Number(e.target.value) }),
							className: "w-32"
						})
					}), /* @__PURE__ */ B("p", {
						className: "mt-4 text-sm text-muted",
						children: [
							"Corporation history counts stints in a watched corporation, and in corporations that are in a watched alliance today (alliance history isn't synced). See ",
							/* @__PURE__ */ z(F, {
								to: "/p/spycheck?tab=watch",
								className: "text-accent-ink",
								children: "the watch list"
							}),
							"."
						]
					})] })]
				})]
			}),
			/* @__PURE__ */ z("div", {
				className: "lg:col-span-2",
				children: /* @__PURE__ */ z(r, {
					variant: "primary",
					loading: f.isPending,
					onClick: () => f.mutate(c),
					children: "Save settings"
				})
			})
		]
	});
}
//#endregion
//#region src/findings.tsx
var Q = 50;
function be() {
	let [e, t] = re(), n = e.get("tab") ?? "findings", { data: r } = N({
		queryKey: ["spycheck", "summary"],
		queryFn: () => T.get(`${Y}/summary`)
	}), i = r?.can_manage ?? !1;
	return /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(f, {
		eyebrow: "HR",
		title: "Spy Check",
		icon: /* @__PURE__ */ z(H, {}),
		description: "Members' wallets, market trades, contracts, mail, contacts and corporation history, checked every day against the watch list and the blacklist.",
		actions: /* @__PURE__ */ z(xe, { summary: r })
	}), /* @__PURE__ */ B(ee, {
		value: n,
		onValueChange: (e) => t(e === "findings" ? {} : { tab: e }, { replace: !0 }),
		variant: "pills",
		className: "space-y-4",
		items: [
			{
				value: "findings",
				label: "Findings",
				count: r?.new
			},
			{
				value: "members",
				label: "Members",
				count: r?.members
			},
			{
				value: "watch",
				label: "Watch list",
				count: r?.watched
			},
			...i ? [{
				value: "settings",
				label: "Settings"
			}] : []
		],
		children: [
			/* @__PURE__ */ z(y, {
				value: "findings",
				children: /* @__PURE__ */ z(Se, {})
			}),
			/* @__PURE__ */ z(y, {
				value: "members",
				children: /* @__PURE__ */ z(Ce, {})
			}),
			/* @__PURE__ */ z(y, {
				value: "watch",
				children: /* @__PURE__ */ z(ge, {})
			}),
			i && /* @__PURE__ */ z(y, {
				value: "settings",
				children: /* @__PURE__ */ z(ye, {})
			})
		]
	})] });
}
function xe({ summary: e }) {
	let t = P(), n = M({
		mutationFn: () => T.post(`${Y}/scan`),
		onSuccess: (e) => {
			t.invalidateQueries({ queryKey: ["spycheck"] }), j.success(e.flagged ? `${e.flagged} new finding${e.flagged === 1 ? "" : "s"}` : "Scanned: nothing new");
		},
		onError: (e) => j.error(e.message)
	});
	return e ? /* @__PURE__ */ B("div", {
		className: "flex items-center gap-3",
		children: [/* @__PURE__ */ z("span", {
			className: "text-xs text-subtle",
			children: e.last_scan_at ? `Scanned ${A(e.last_scan_at)} · ${e.last_scan_characters} characters` : "Not scanned yet"
		}), e.can_manage && /* @__PURE__ */ B(r, {
			size: "sm",
			variant: "outline",
			loading: n.isPending,
			onClick: () => n.mutate(),
			children: [!n.isPending && /* @__PURE__ */ z(ie, {}), " Scan now"]
		})]
	}) : null;
}
function $(e) {
	let [t, n] = L(e);
	return I(() => {
		let t = setTimeout(() => n(e.trim()), 250);
		return () => clearTimeout(t);
	}, [e]), t;
}
function Se() {
	let [e, t] = L("new"), [n, o] = L(""), [s, c] = L(""), l = $(s), [u, d] = L(0), [f, _] = L(null);
	I(() => d(0), [
		e,
		n,
		l
	]);
	let { data: v, isLoading: y } = N({
		queryKey: [
			"spycheck",
			"findings",
			e,
			n,
			l,
			u
		],
		queryFn: () => T.get(`${Y}/findings?state=${e}&kind=${n}&q=${encodeURIComponent(l)}&limit=${Q}&offset=${u}`)
	});
	return /* @__PURE__ */ B(i, { children: [
		/* @__PURE__ */ B("div", {
			className: "flex flex-wrap items-center gap-2 border-b border-border p-3",
			children: [
				/* @__PURE__ */ z(m, {
					value: e,
					onChange: t,
					options: [
						{
							value: "new",
							label: "New"
						},
						{
							value: "acknowledged",
							label: "Acknowledged"
						},
						{
							value: "dismissed",
							label: "Dismissed"
						},
						{
							value: "all",
							label: "All"
						}
					]
				}),
				/* @__PURE__ */ z(h, {
					value: n,
					onChange: (e) => o(e.target.value),
					className: "w-48",
					"aria-label": "Kind",
					options: [{
						value: "",
						label: "Every kind"
					}, ...Object.entries(K).map(([e, t]) => ({
						value: e,
						label: t
					}))]
				}),
				/* @__PURE__ */ z(p, {
					value: s,
					onChange: (e) => c(e.target.value),
					placeholder: "Member, character or who they dealt with",
					className: "w-72",
					"aria-label": "Search findings"
				})
			]
		}),
		y || !v ? /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(g, { className: "h-40" }) }) : v.items.length === 0 ? /* @__PURE__ */ z(pe, { state: e }) : /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(fe, {
			items: v.items,
			onOpen: _
		}), v.count > Q && /* @__PURE__ */ B("div", {
			className: "flex items-center justify-between border-t border-border p-3 text-sm text-muted",
			children: [/* @__PURE__ */ B("span", { children: [
				u + 1,
				"–",
				Math.min(u + Q, v.count),
				" of ",
				v.count
			] }), /* @__PURE__ */ B("span", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ z(r, {
					size: "sm",
					variant: "ghost",
					disabled: u === 0,
					onClick: () => d(Math.max(0, u - Q)),
					children: "Previous"
				}), /* @__PURE__ */ z(r, {
					size: "sm",
					variant: "ghost",
					disabled: u + Q >= v.count,
					onClick: () => d(u + Q),
					children: "Next"
				})]
			})]
		})] }),
		/* @__PURE__ */ z(me, {
			finding: f,
			onClose: () => _(null)
		})
	] });
}
function Ce() {
	let [e, r] = L(""), o = $(e), { data: s, isLoading: c } = N({
		queryKey: [
			"spycheck",
			"members",
			o
		],
		queryFn: () => T.get(`${Y}/members?q=${encodeURIComponent(o)}`)
	});
	return /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z("div", {
		className: "border-b border-border p-3",
		children: /* @__PURE__ */ z(p, {
			value: e,
			onChange: (e) => r(e.target.value),
			placeholder: "Find a character",
			className: "w-56",
			"aria-label": "Search members"
		})
	}), c || !s ? /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(g, { className: "h-40" }) }) : s.items.length === 0 ? /* @__PURE__ */ z(l, {
		icon: /* @__PURE__ */ z(H, {}),
		title: o ? "Nobody matches" : "No member has a finding"
	}) : /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(C, { children: "Member" }),
		/* @__PURE__ */ z(C, { children: "Findings" }),
		/* @__PURE__ */ z(C, { children: "Entities" }),
		/* @__PURE__ */ z(C, { children: "Latest evidence" }),
		/* @__PURE__ */ z(C, { children: "Last flagged" })
	] }) }), /* @__PURE__ */ z("tbody", { children: s.items.map((e) => /* @__PURE__ */ B(w, { children: [
		/* @__PURE__ */ z(x, { children: /* @__PURE__ */ B(F, {
			to: `/p/spycheck/members/${e.id}`,
			className: "flex items-center gap-3 hover:text-accent-ink",
			children: [/* @__PURE__ */ z(t, {
				src: e.portrait,
				name: e.name,
				size: "sm"
			}), /* @__PURE__ */ B("span", { children: [/* @__PURE__ */ z("span", {
				className: "block font-medium",
				children: e.name
			}), /* @__PURE__ */ z("span", {
				className: "block text-xs text-muted",
				children: e.corporation ?? "No corporation"
			})] })]
		}) }),
		/* @__PURE__ */ z(x, { children: /* @__PURE__ */ B("span", {
			className: "inline-flex flex-wrap gap-1",
			children: [
				e.new > 0 && /* @__PURE__ */ B(n, {
					tone: "warning",
					children: [e.new, " new"]
				}),
				e.acknowledged > 0 && /* @__PURE__ */ B(n, {
					tone: "info",
					children: [e.acknowledged, " acknowledged"]
				}),
				e.dismissed > 0 && /* @__PURE__ */ B(n, {
					tone: "neutral",
					children: [e.dismissed, " dismissed"]
				})
			]
		}) }),
		/* @__PURE__ */ z(x, {
			className: "tabular-nums",
			children: e.entities
		}),
		/* @__PURE__ */ z(x, {
			className: "text-muted",
			children: E(e.last_seen)
		}),
		/* @__PURE__ */ z(x, {
			className: "text-muted",
			children: e.flagged_at ? A(e.flagged_at) : "—"
		})
	] }, e.id)) })] })] });
}
//#endregion
//#region src/member.tsx
function we() {
	let { id: e } = ne(), [r, a] = L(null), { data: s, isLoading: c } = N({
		queryKey: [
			"spycheck",
			"member",
			e
		],
		queryFn: () => T.get(`${Y}/members/${e}`)
	});
	if (c || !s) return /* @__PURE__ */ z(g, { className: "h-64" });
	let u = s.findings.filter((e) => e.state === "new").length;
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ B(F, {
			to: "/p/spycheck?tab=members",
			className: "mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ z(se, {}), " Members"]
		}),
		/* @__PURE__ */ z(f, {
			eyebrow: "Spy Check",
			title: s.user.name,
			icon: /* @__PURE__ */ z(t, {
				src: s.user.portrait,
				name: s.user.name,
				size: "md"
			}),
			description: `${s.user.corporation ?? "No corporation"} · ${s.characters.length} character${s.characters.length === 1 ? "" : "s"} · ${u} new finding${u === 1 ? "" : "s"}`
		}),
		/* @__PURE__ */ B("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, { title: "Characters" }), /* @__PURE__ */ z("ul", {
				className: "flex flex-wrap gap-2 px-card pb-4",
				children: s.characters.map((e) => /* @__PURE__ */ z("li", { children: /* @__PURE__ */ B(F, {
					to: `/characters/${e.id}`,
					className: "flex items-center gap-2 border border-border px-2 py-1 text-sm hover:bg-hover",
					children: [
						/* @__PURE__ */ z(t, {
							src: e.portrait,
							name: e.name,
							size: "sm"
						}),
						e.name,
						e.findings > 0 ? /* @__PURE__ */ z(n, {
							tone: "warning",
							children: e.findings
						}) : /* @__PURE__ */ z(n, {
							tone: "success",
							children: "Clean"
						})
					]
				}) }, e.id))
			})] }), /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, {
				title: "Findings",
				description: "Every kind of dealing with a watched entity, on any of their characters."
			}), s.findings.length === 0 ? /* @__PURE__ */ z(l, {
				icon: /* @__PURE__ */ z(U, {}),
				title: "No findings"
			}) : /* @__PURE__ */ z(fe, {
				items: s.findings,
				onOpen: a,
				showMember: !1
			})] })]
		}),
		/* @__PURE__ */ z(me, {
			finding: r,
			onClose: () => a(null)
		})
	] });
}
//#endregion
//#region src/index.tsx
function Te() {
	let { data: e, isLoading: t } = N({
		queryKey: ["spycheck", "summary"],
		queryFn: () => T.get(`${Y}/summary`),
		refetchInterval: 6e5
	});
	return t || !e ? /* @__PURE__ */ z(g, { className: "h-16" }) : /* @__PURE__ */ z(F, {
		to: "/p/spycheck",
		className: "block",
		children: /* @__PURE__ */ B("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ B("div", { children: [
				/* @__PURE__ */ z("div", {
					className: "text-xs text-muted",
					children: "New Spy Check findings"
				}),
				/* @__PURE__ */ z("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: e.new
				}),
				/* @__PURE__ */ B("div", {
					className: "text-xs text-subtle",
					children: [
						e.members,
						" member",
						e.members === 1 ? "" : "s",
						" · ",
						e.watched,
						" watched"
					]
				})
			] }), e.new > 0 ? /* @__PURE__ */ z(n, {
				tone: "warning",
				children: "To review"
			}) : /* @__PURE__ */ z(n, {
				tone: "success",
				children: "All reviewed"
			})]
		})
	});
}
var Ee = te({
	routes: [{
		path: "",
		Component: be
	}, {
		path: "members/:id",
		Component: we
	}],
	widgets: [{
		id: "summary",
		title: "Spy Check",
		Component: Te,
		size: "sm",
		order: 45,
		permission: "spycheck.view_findings"
	}]
});
//#endregion
export { Ee as default };

export const classes = ["!data","!isFetching","!o","@conduit/sdk","@tanstack/react-query","a","above","acknowledged","across","actions","active","added_by","adds","against","all","alliance","alliances","already","alt","amount","and","any","anyone","are","aren","aria-label","as","at","audit","banned","behind","below","besides","blacklist","blacklist_available","blacklist_watch_entries","blacklisted","block","blocked","boolean","border","border-b","border-border","border-t","but","by","by_kind","canManage","can_manage","character","character_registered","characters","checked","children","className","confirmLabel","const","contact","contacts","contract","corp_history","corporation","corporations","count","counts","created_at","current","currentColor","cursor-pointer","cx","cy","danger","data","day","dealing","dealings","dealt","decide","decided_at","decided_by","default","depends","description","dialog","disabled","dismissed","divide-border","divide-y","dq","e","each","empty","enabled","entities","entity","entries","eve_id","every","everyone","evidence","exact","export","extends","eyebrow","f","few","fields","fill","finding","findings","fine","first_seen","flagged","flagged_at","flex","flex-1","flex-wrap","font-medium","font-mono","font-semibold","footer","for","found","found_at","from","full","function","gap-1","gap-1.5","gap-2","gap-3","gap-6","gap-x-4","gap-x-8","gap-y-2","get","gets","ghost","give","good","grid","group","group_options","h-16","h-40","h-48","h-64","has","hasn","here","hint","history","hits","hover:bg-hover","hover:text-accent-ink","hover:text-text","icon","icons","id","if","image","import","in","info","inline","inline-flex","installed","interface","is","isFetching","isLoading","isPending","is_blocked","is_buy","is_watched","isn","it","items","items-center","items-end","items-start","its","journal","just","justify-between","key","kind","kind_label","kind_options","label","labels","last","last_scan_at","last_scan_characters","last_scan_new","last_seen","latest","length","lg","lg:col-span-2","lg:grid-cols-2","like","line","list","loading","log","longer","look","looked","looking","looks","m12","m13.41","m6","mail","main","marked","market","matches","max","max-h-[45vh]","max-w-5xl","may","mb-3","md","means","member","members","mentioned","min","min-w-0","min_standing","ml-1.5","ml-auto","mt-1","mt-4","mutationFn","n","name","neutral","never","new","new_evidence","newer","next","none","not","note","noted","nothing","notification","notify_group","now","null","number","object","of","off","offset","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpen","onOpenChange","onRemove","onSuccess","onValueChange","one","only","opacity-60","open","open_","opening","options","or","order","outline","overflow-auto","own","p-3","p-4","page","patch","path","pb-4","people","per","permission","person","pills","placeholder","plugin","portrait","post","present","price","primary","pt-4","put","px-2","px-3","px-card","py-1","py-2.5","py-3","qc","queryFn","queryKey","radio","react","react-router","read","reason","recipients","record","recorded","records","refetchInterval","registered","removed","reopened","replace","rest","return","review","reviewed","reward","round","rounded","rounded-full","rounded-lg","routes","rows","rows_limited","s","save","scan","scanned","see","set","setAdding","setDq","setForm","setKind","setNote","setOffset","setOpen","setOut","setParams","setPicked","setQ","setReason","setRemoving","setState","settings","severity","sheet","sheet_link","showMember","shrink-0","since","site","size","size-4","size-6","skip_kinds","sm","sm:grid-cols-2","snooper","so","someone","source","space-y-1","space-y-2","space-y-3","space-y-4","space-y-5","space-y-6","spycheck","src","standing","start","state","stays","step","stint","stints","stops","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","subject","success","summary","switched","synced","t","tab","tabular-nums","text-3xl","text-accent-ink","text-danger-fg","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-xs","than","that","the","their","them","there","they","this","title","to","today","toggleKind","told","tone","trade","true","type","undefined","until","up","useParams","useQuery","useQueryClient","useSearchParams","useState","use_blacklist","used","user","uses","v","value","variant","viewBox","view_findings","void","w-32","w-48","w-56","w-72","want","warning","watch","watched","watching","what","when","which","whitespace-nowrap","whitespace-pre-line","who","whoever","widgets","with","works","x","xl","yet","you"];
