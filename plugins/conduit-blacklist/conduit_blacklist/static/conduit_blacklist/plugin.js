import { Badge as e, Button as t, Card as n, CardBody as r, CardHeader as i, ConfirmDialog as a, Dialog as o, DiscordPings as s, EmptyState as c, Field as l, Input as u, PageHeader as d, SearchInput as f, Segmented as p, Select as m, Skeleton as h, THead as g, TabPanel as _, Table as v, Tabs as y, Td as b, Textarea as x, Th as S, Tr as C, api as w, date as T, dateTime as ee, definePlugin as E, timeAgo as D, toast as O, useHasPerm as te } from "@conduit/sdk";
import { useMutation as k, useQuery as A, useQueryClient as j } from "@tanstack/react-query";
import { useState as M } from "react";
import { Link as N, useNavigate as P, useParams as ne } from "react-router";
import { Fragment as F, jsx as I, jsxs as L } from "react/jsx-runtime";
//#region src/icons.tsx
function R({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ I("svg", {
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
var z = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [
		/* @__PURE__ */ I("path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }),
		/* @__PURE__ */ I("path", { d: "m14.5 9.5-5 5" }),
		/* @__PURE__ */ I("path", { d: "m9.5 9.5 5 5" })
	]
}), B = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [/* @__PURE__ */ I("path", { d: "M5 12h14" }), /* @__PURE__ */ I("path", { d: "M12 5v14" })]
}), re = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [/* @__PURE__ */ I("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ I("path", { d: "M19 12H5" })]
}), V = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [
		/* @__PURE__ */ I("path", { d: "M3 6h18" }),
		/* @__PURE__ */ I("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ I("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), H = (e) => /* @__PURE__ */ I(R, {
	...e,
	children: /* @__PURE__ */ I("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" })
}), U = (e) => /* @__PURE__ */ I(R, {
	...e,
	children: /* @__PURE__ */ I("path", { d: "M20 6 9 17l-5-5" })
}), W = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [/* @__PURE__ */ I("circle", {
		cx: "11",
		cy: "11",
		r: "8"
	}), /* @__PURE__ */ I("path", { d: "m21 21-4.3-4.3" })]
}), ie = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [
		/* @__PURE__ */ I("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }),
		/* @__PURE__ */ I("path", { d: "M12 9v4" }),
		/* @__PURE__ */ I("path", { d: "M12 17h.01" })
	]
}), G = "/api/p/blacklist", K = {
	character: "Character",
	corporation: "Corporation",
	alliance: "Alliance"
}, ae = {
	linked: "Linked",
	applied: "Applied",
	check: "Regular check"
};
function q({ severity: t }) {
	return t === "banned" ? /* @__PURE__ */ I(e, {
		tone: "danger",
		children: "Banned"
	}) : /* @__PURE__ */ I(e, {
		tone: "warning",
		children: "Watch"
	});
}
function J({ src: e, round: t }) {
	return /* @__PURE__ */ I("img", {
		src: e,
		alt: "",
		className: `size-8 shrink-0 ${t ? "rounded-full" : "rounded"}`,
		loading: "lazy"
	});
}
function oe() {
	let [e, n] = M("entries"), [r, i] = M(!1), { data: a } = A({
		queryKey: [
			"blacklist",
			"entries",
			"active",
			"",
			""
		],
		queryFn: () => w.get(`${G}/entries`)
	}), { data: o } = A({
		queryKey: [
			"blacklist",
			"matches",
			"open"
		],
		queryFn: () => w.get(`${G}/matches?status=open`)
	});
	return /* @__PURE__ */ L(F, { children: [
		/* @__PURE__ */ I(d, {
			title: "Blacklist",
			icon: /* @__PURE__ */ I(z, {}),
			description: "Characters, corporations and alliances you don't want. Whoever can see this list is warned when one of them links a character or applies.",
			actions: a?.can_manage && /* @__PURE__ */ L(t, {
				variant: "primary",
				onClick: () => i(!0),
				children: [/* @__PURE__ */ I(B, {}), " Add"]
			})
		}),
		/* @__PURE__ */ L(y, {
			value: e,
			onValueChange: n,
			variant: "pills",
			className: "space-y-4",
			items: [
				{
					value: "entries",
					label: "Entries"
				},
				{
					value: "warnings",
					label: "Warnings",
					count: o?.counts.open
				},
				{
					value: "check",
					label: "Check a name"
				}
			],
			children: [
				/* @__PURE__ */ I(_, {
					value: "entries",
					children: /* @__PURE__ */ I(se, {})
				}),
				/* @__PURE__ */ I(_, {
					value: "warnings",
					children: /* @__PURE__ */ I(Z, {})
				}),
				/* @__PURE__ */ I(_, {
					value: "check",
					children: /* @__PURE__ */ I(ce, {})
				})
			]
		}),
		r && /* @__PURE__ */ I(ue, { onClose: () => i(!1) })
	] });
}
function se() {
	let [t, i] = M(""), [a, o] = M(""), [s, l] = M("active"), { data: u, isLoading: d } = A({
		queryKey: [
			"blacklist",
			"entries",
			s,
			a,
			t
		],
		queryFn: () => w.get(`${G}/entries?status=${s}&kind=${a}&q=${encodeURIComponent(t)}`)
	});
	return /* @__PURE__ */ L(n, { children: [/* @__PURE__ */ L("div", {
		className: "flex flex-wrap items-center gap-2 border-b border-border p-3",
		children: [
			/* @__PURE__ */ I(f, {
				value: t,
				onChange: (e) => i(e.target.value),
				placeholder: "Search names and reasons",
				className: "w-64"
			}),
			/* @__PURE__ */ I(m, {
				value: a,
				onChange: (e) => o(e.target.value),
				className: "w-44",
				"aria-label": "Kind",
				options: [{
					value: "",
					label: "Everything"
				}, ...Object.entries(K).map(([e, t]) => ({
					value: e,
					label: t
				}))]
			}),
			/* @__PURE__ */ I(p, {
				value: s,
				onChange: l,
				options: [
					{
						value: "active",
						label: "Active"
					},
					{
						value: "expired",
						label: "Expired"
					},
					{
						value: "all",
						label: "All"
					}
				]
			})
		]
	}), d || !u ? /* @__PURE__ */ I(r, { children: /* @__PURE__ */ I(h, { className: "h-40" }) }) : u.items.length === 0 ? /* @__PURE__ */ I(c, {
		icon: /* @__PURE__ */ I(z, {}),
		title: t || a || s !== "active" ? "Nothing matches" : "The blacklist is empty"
	}) : /* @__PURE__ */ L(v, { children: [/* @__PURE__ */ I(g, { children: /* @__PURE__ */ L("tr", { children: [
		/* @__PURE__ */ I(S, { children: "Name" }),
		/* @__PURE__ */ I(S, { children: "Severity" }),
		/* @__PURE__ */ I(S, { children: "Reason" }),
		/* @__PURE__ */ I(S, { children: "Added" }),
		/* @__PURE__ */ I(S, { children: "Expires" }),
		/* @__PURE__ */ I(S, {
			align: "right",
			children: "Warnings"
		})
	] }) }), /* @__PURE__ */ I("tbody", { children: u.items.map((t) => /* @__PURE__ */ L(C, { children: [
		/* @__PURE__ */ I(b, { children: /* @__PURE__ */ L(N, {
			to: `/p/blacklist/entries/${t.id}`,
			className: "flex items-center gap-3 hover:text-accent-ink",
			children: [/* @__PURE__ */ I(J, {
				src: t.image,
				round: t.kind === "character"
			}), /* @__PURE__ */ L("span", { children: [/* @__PURE__ */ I("span", {
				className: "block font-medium",
				children: t.name
			}), /* @__PURE__ */ I("span", {
				className: "block text-xs text-muted",
				children: K[t.kind]
			})] })]
		}) }),
		/* @__PURE__ */ I(b, { children: /* @__PURE__ */ I(q, { severity: t.severity }) }),
		/* @__PURE__ */ I(b, {
			className: "max-w-md truncate text-muted",
			title: t.reason,
			children: t.reason || "—"
		}),
		/* @__PURE__ */ L(b, {
			className: "text-muted",
			children: [T(t.created_at), t.added_by ? ` · ${t.added_by}` : ""]
		}),
		/* @__PURE__ */ I(b, {
			className: "text-muted",
			children: t.expires_at ? t.expired ? `Expired ${T(t.expires_at)}` : T(t.expires_at) : "Never"
		}),
		/* @__PURE__ */ I(b, {
			numeric: !0,
			children: t.open_matches > 0 ? /* @__PURE__ */ I(e, {
				tone: "danger",
				children: t.open_matches
			}) : /* @__PURE__ */ I("span", {
				className: "text-subtle",
				children: "0"
			})
		})
	] }, t.id)) })] })] });
}
function Y({ items: e, onResolve: n }) {
	return /* @__PURE__ */ L(v, { children: [/* @__PURE__ */ I(g, { children: /* @__PURE__ */ L("tr", { children: [
		/* @__PURE__ */ I(S, { children: "Character" }),
		/* @__PURE__ */ I(S, { children: "Account" }),
		/* @__PURE__ */ I(S, { children: "Blacklisted as" }),
		/* @__PURE__ */ I(S, { children: "Found" }),
		/* @__PURE__ */ I(S, { align: "right" })
	] }) }), /* @__PURE__ */ I("tbody", { children: e.map((e) => /* @__PURE__ */ L(C, { children: [
		/* @__PURE__ */ I(b, { children: /* @__PURE__ */ L("span", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ I(J, {
				src: e.portrait,
				round: !0
			}), /* @__PURE__ */ I("span", {
				className: "font-medium",
				children: e.character_name
			})]
		}) }),
		/* @__PURE__ */ I(b, { children: e.user }),
		/* @__PURE__ */ I(b, { children: /* @__PURE__ */ L(N, {
			to: `/p/blacklist/entries/${e.entry.id}`,
			className: "inline-flex items-center gap-2 hover:text-accent-ink",
			children: [
				e.entry.name,
				" ",
				/* @__PURE__ */ I("span", {
					className: "text-xs text-muted",
					children: K[e.entry.kind]
				}),
				" ",
				/* @__PURE__ */ I(q, { severity: e.entry.severity })
			]
		}) }),
		/* @__PURE__ */ L(b, {
			className: "text-muted",
			children: [
				D(e.found_at),
				" · ",
				ae[e.source]
			]
		}),
		/* @__PURE__ */ I(b, {
			align: "right",
			children: e.resolved_at ? /* @__PURE__ */ L("span", {
				className: "inline-flex items-center gap-2 text-xs text-muted",
				children: [
					"Dealt with",
					e.resolved_by ? ` by ${e.resolved_by}` : "",
					/* @__PURE__ */ I(t, {
						size: "xs",
						variant: "ghost",
						onClick: () => n(e, !1),
						children: "Reopen"
					})
				]
			}) : /* @__PURE__ */ L(t, {
				size: "sm",
				onClick: () => n(e, !0),
				children: [/* @__PURE__ */ I(U, {}), " Dealt with"]
			})
		})
	] }, e.id)) })] });
}
function X() {
	let e = j();
	return k({
		mutationFn: ({ m: e, resolved: t }) => w.post(`${G}/matches/${e.id}`, { resolved: t }),
		onSuccess: () => e.invalidateQueries({ queryKey: ["blacklist"] }),
		onError: (e) => O.error(e.message)
	});
}
function Z() {
	let [e, t] = M("open"), i = X(), a = te("blacklist.manage_blacklist"), { data: o, isLoading: l } = A({
		queryKey: [
			"blacklist",
			"matches",
			e
		],
		queryFn: () => w.get(`${G}/matches?status=${e}`)
	});
	return /* @__PURE__ */ L("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ L(n, { children: [/* @__PURE__ */ L("div", {
			className: "flex items-center justify-between gap-3 border-b border-border p-3",
			children: [/* @__PURE__ */ I("p", {
				className: "text-sm text-muted",
				children: "Members' and applicants' characters that are blacklisted, or in a blacklisted corporation or alliance."
			}), /* @__PURE__ */ I(p, {
				value: e,
				onChange: t,
				options: [{
					value: "open",
					label: "Open"
				}, {
					value: "resolved",
					label: "Dealt with"
				}]
			})]
		}), l || !o ? /* @__PURE__ */ I(r, { children: /* @__PURE__ */ I(h, { className: "h-32" }) }) : o.items.length === 0 ? /* @__PURE__ */ I(c, {
			icon: /* @__PURE__ */ I(U, {}),
			title: e === "open" ? "No open warnings" : "Nothing dealt with yet",
			description: e === "open" ? "Characters are checked when they're linked, when someone applies and every hour." : void 0
		}) : /* @__PURE__ */ I(Y, {
			items: o.items,
			onResolve: (e, t) => i.mutate({
				m: e,
				resolved: t
			})
		})] }), a && /* @__PURE__ */ I(s, {
			plugin: "blacklist",
			className: "panel p-card"
		})]
	});
}
function ce() {
	let [e, a] = M(""), o = k({
		mutationFn: (e) => w.get(`${G}/check?q=${encodeURIComponent(e)}`),
		onError: (e) => O.error(e.message)
	});
	return /* @__PURE__ */ L(n, { children: [/* @__PURE__ */ I(i, {
		title: "Check a name",
		description: "Someone who hasn't registered yet? Type their exact character, corporation or alliance name. Characters are checked with their current corporation and alliance."
	}), /* @__PURE__ */ L(r, {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ L("form", {
				className: "flex gap-2",
				onSubmit: (t) => {
					t.preventDefault(), e.trim().length >= 3 && o.mutate(e.trim());
				},
				children: [/* @__PURE__ */ I(u, {
					value: e,
					onChange: (e) => a(e.target.value),
					placeholder: "Exact name",
					className: "max-w-sm"
				}), /* @__PURE__ */ L(t, {
					type: "submit",
					loading: o.isPending,
					children: [/* @__PURE__ */ I(W, {}), " Check"]
				})]
			}),
			o.data && o.data.length === 0 && /* @__PURE__ */ I("p", {
				className: "text-sm text-muted",
				children: "EVE knows nobody by that exact name."
			}),
			o.data?.map((e) => /* @__PURE__ */ L("div", {
				className: "flex items-start gap-3 rounded-lg border border-border p-3",
				children: [/* @__PURE__ */ I(J, {
					src: e.image,
					round: e.kind === "character"
				}), /* @__PURE__ */ L("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ L("div", {
						className: "font-medium",
						children: [
							e.name,
							" ",
							/* @__PURE__ */ I("span", {
								className: "text-xs font-normal text-muted",
								children: K[e.kind]
							})
						]
					}), (e.entries ?? []).length === 0 ? /* @__PURE__ */ I("div", {
						className: "mt-1 text-sm text-success-fg",
						children: "Not blacklisted"
					}) : /* @__PURE__ */ I("ul", {
						className: "mt-1 space-y-1 text-sm",
						children: e.entries.map((t) => /* @__PURE__ */ L("li", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ I(q, { severity: t.severity }),
								/* @__PURE__ */ I(N, {
									to: `/p/blacklist/entries/${t.id}`,
									className: "hover:text-accent-ink",
									children: t.name
								}),
								/* @__PURE__ */ L("span", {
									className: "text-muted",
									children: [
										t.kind === e.kind && t.eve_id === e.eve_id ? "" : `(their ${t.kind})`,
										" ",
										t.reason
									]
								})
							]
						}, t.id))
					})]
				})]
			}, `${e.kind}:${e.eve_id}`))
		]
	})] });
}
var le = (e) => e ? (/* @__PURE__ */ new Date(new Date(e).getTime() - (/* @__PURE__ */ new Date()).getTimezoneOffset() * 6e4)).toISOString().slice(0, 16) : "", Q = (e) => e ? new Date(e).toISOString() : null;
function $({ severity: e, reason: t, expires: n, set: r }) {
	return /* @__PURE__ */ L(F, { children: [
		/* @__PURE__ */ I(l, {
			label: "Severity",
			hint: "Banned: they must not join. Watch: keep an eye on them.",
			children: /* @__PURE__ */ I("div", { children: /* @__PURE__ */ I(p, {
				value: e,
				onChange: (e) => r({ severity: e }),
				options: [{
					value: "banned",
					label: "Banned"
				}, {
					value: "watch",
					label: "Watch"
				}]
			}) })
		}),
		/* @__PURE__ */ I(l, {
			label: "Reason",
			hint: "Only people who can see the blacklist read this.",
			children: /* @__PURE__ */ I(x, {
				rows: 3,
				value: t,
				onChange: (e) => r({ reason: e.target.value }),
				placeholder: "Awoxed a fleet in Delve, March 2026"
			})
		}),
		/* @__PURE__ */ I(l, {
			label: "Expires (optional)",
			hint: "Left empty, it never runs out.",
			children: /* @__PURE__ */ I(u, {
				type: "datetime-local",
				value: n,
				onChange: (e) => r({ expires: e.target.value }),
				className: "w-60"
			})
		})
	] });
}
function ue({ onClose: e }) {
	let n = j(), r = P(), [i, a] = M(""), [s, c] = M(null), [d, f] = M({
		severity: "banned",
		reason: "",
		expires: ""
	}), p = k({
		mutationFn: (e) => w.get(`${G}/lookup?q=${encodeURIComponent(e)}`),
		onError: (e) => O.error(e.message)
	}), m = k({
		mutationFn: () => w.post(`${G}/entries`, {
			kind: s.kind,
			eve_id: s.eve_id,
			severity: d.severity,
			reason: d.reason,
			expires_at: Q(d.expires)
		}),
		onSuccess: (e) => {
			n.invalidateQueries({ queryKey: ["blacklist"] }), O.success(`${e.name} is on the blacklist`), r(`/p/blacklist/entries/${e.id}`);
		},
		onError: (e) => O.error(e.message)
	});
	return /* @__PURE__ */ I(o, {
		open: !0,
		onOpenChange: (t) => !t && e(),
		title: "Add to the blacklist",
		description: "Registered members it covers are looked for straight away.",
		size: "lg",
		footer: /* @__PURE__ */ L(F, { children: [/* @__PURE__ */ I(t, {
			variant: "ghost",
			onClick: e,
			children: "Cancel"
		}), /* @__PURE__ */ L(t, {
			variant: "primary",
			disabled: !s,
			loading: m.isPending,
			onClick: () => m.mutate(),
			children: [/* @__PURE__ */ I(B, {}), " Add"]
		})] }),
		children: /* @__PURE__ */ L("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ I(l, {
					label: "Who",
					hint: "The exact character, corporation or alliance name.",
					children: /* @__PURE__ */ L("form", {
						className: "flex gap-2",
						onSubmit: (e) => {
							e.preventDefault(), i.trim().length >= 3 && p.mutate(i.trim());
						},
						children: [/* @__PURE__ */ I(u, {
							value: i,
							onChange: (e) => a(e.target.value),
							placeholder: "Exact name"
						}), /* @__PURE__ */ L(t, {
							type: "submit",
							loading: p.isPending,
							children: [/* @__PURE__ */ I(W, {}), " Find"]
						})]
					})
				}),
				p.data && p.data.length === 0 && /* @__PURE__ */ I("p", {
					className: "text-sm text-muted",
					children: "EVE knows nobody by that exact name."
				}),
				(p.data ?? []).length > 0 && /* @__PURE__ */ I("div", {
					className: "divide-y divide-border rounded-lg border border-border",
					children: p.data.map((e) => /* @__PURE__ */ L("label", {
						className: `flex items-center gap-3 px-3 py-2.5 text-sm ${e.entry_id ? "opacity-60" : "cursor-pointer"}`,
						children: [
							/* @__PURE__ */ I("input", {
								type: "radio",
								name: "who",
								disabled: !!e.entry_id,
								checked: s?.eve_id === e.eve_id && s.kind === e.kind,
								onChange: () => c(e)
							}),
							/* @__PURE__ */ I(J, {
								src: e.image,
								round: e.kind === "character"
							}),
							/* @__PURE__ */ L("span", {
								className: "flex-1",
								children: [
									e.name,
									" ",
									/* @__PURE__ */ I("span", {
										className: "text-xs text-muted",
										children: K[e.kind]
									})
								]
							}),
							e.entry_id && /* @__PURE__ */ I(N, {
								to: `/p/blacklist/entries/${e.entry_id}`,
								className: "text-xs text-accent-ink",
								children: "Already on it"
							})
						]
					}, `${e.kind}:${e.eve_id}`))
				}),
				/* @__PURE__ */ I($, {
					...d,
					set: (e) => f({
						...d,
						...e
					})
				})
			]
		})
	});
}
function de({ entry: e, onClose: n }) {
	let r = j(), [i, a] = M({
		severity: e.severity,
		reason: e.reason,
		expires: le(e.expires_at)
	}), s = k({
		mutationFn: () => w.put(`${G}/entries/${e.id}`, {
			severity: i.severity,
			reason: i.reason,
			expires_at: Q(i.expires)
		}),
		onSuccess: () => {
			r.invalidateQueries({ queryKey: ["blacklist"] }), n();
		},
		onError: (e) => O.error(e.message)
	});
	return /* @__PURE__ */ I(o, {
		open: !0,
		onOpenChange: (e) => !e && n(),
		title: `Change ${e.name}`,
		size: "lg",
		footer: /* @__PURE__ */ L(F, { children: [/* @__PURE__ */ I(t, {
			variant: "ghost",
			onClick: n,
			children: "Cancel"
		}), /* @__PURE__ */ I(t, {
			variant: "primary",
			loading: s.isPending,
			onClick: () => s.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ I("div", {
			className: "space-y-5",
			children: /* @__PURE__ */ I($, {
				...i,
				set: (e) => a({
					...i,
					...e
				})
			})
		})
	});
}
function fe() {
	let { id: o } = ne(), s = j(), l = P(), u = X(), f = [
		"blacklist",
		"entry",
		o
	], { data: p, isLoading: m, error: g } = A({
		queryKey: f,
		queryFn: () => w.get(`${G}/entries/${o}`)
	}), [_, v] = M(!1), [y, b] = M(!1), [S, C] = M(""), E = k({
		mutationFn: () => w.post(`${G}/entries/${o}/notes`, { text: S }),
		onSuccess: (e) => {
			s.setQueryData(f, {
				...e,
				can_manage: p?.can_manage
			}), C("");
		},
		onError: (e) => O.error(e.message)
	});
	return g ? /* @__PURE__ */ I(c, {
		icon: /* @__PURE__ */ I(z, {}),
		title: "Not on the blacklist",
		action: /* @__PURE__ */ I(N, {
			to: "/p/blacklist",
			children: /* @__PURE__ */ I(t, { children: "Back to the blacklist" })
		})
	}) : m || !p ? /* @__PURE__ */ I(h, { className: "h-96" }) : /* @__PURE__ */ L(F, { children: [
		/* @__PURE__ */ L(N, {
			to: "/p/blacklist",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ I(re, {}), " Blacklist"]
		}),
		/* @__PURE__ */ I(d, {
			eyebrow: K[p.kind],
			title: p.name,
			icon: /* @__PURE__ */ I("img", {
				src: p.image,
				alt: "",
				className: "size-full object-cover"
			}),
			description: `Added ${T(p.created_at)}${p.added_by ? ` by ${p.added_by}` : ""}${p.expires_at ? ` · ${p.expired ? "expired" : "expires"} ${ee(p.expires_at)}` : ""}`,
			actions: /* @__PURE__ */ L("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ I(q, { severity: p.severity }),
					p.expired && /* @__PURE__ */ I(e, { children: "Expired" }),
					p.can_manage && /* @__PURE__ */ L(F, { children: [/* @__PURE__ */ L(t, {
						onClick: () => v(!0),
						children: [/* @__PURE__ */ I(H, {}), " Change"]
					}), /* @__PURE__ */ L(t, {
						variant: "danger",
						onClick: () => b(!0),
						children: [/* @__PURE__ */ I(V, {}), " Remove"]
					})] })
				]
			})
		}),
		/* @__PURE__ */ L("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_420px]",
			children: [/* @__PURE__ */ L("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ L(n, { children: [/* @__PURE__ */ I(i, { title: "Reason" }), /* @__PURE__ */ I(r, {
					className: "whitespace-pre-wrap text-sm",
					children: p.reason || /* @__PURE__ */ I("span", {
						className: "text-muted",
						children: "No reason given."
					})
				})] }), /* @__PURE__ */ L(n, { children: [/* @__PURE__ */ I(i, {
					title: "Warnings",
					description: "Registered characters this entry covers."
				}), (p.matches ?? []).length === 0 ? /* @__PURE__ */ I(r, {
					className: "text-sm text-muted",
					children: "None of your members' or applicants' characters, so far."
				}) : /* @__PURE__ */ I(Y, {
					items: p.matches,
					onResolve: (e, t) => u.mutate({
						m: e,
						resolved: t
					})
				})] })]
			}), /* @__PURE__ */ L(n, { children: [/* @__PURE__ */ I(i, {
				title: "Notes",
				description: "Shared with everyone who can see the blacklist."
			}), /* @__PURE__ */ L(r, {
				className: "space-y-4",
				children: [
					(p.notes ?? []).length === 0 && /* @__PURE__ */ I("p", {
						className: "text-sm text-muted",
						children: "No notes yet."
					}),
					p.notes?.map((e) => /* @__PURE__ */ L("div", {
						className: "text-sm",
						children: [/* @__PURE__ */ L("div", {
							className: "text-xs text-subtle",
							children: [
								e.author,
								" · ",
								D(e.created_at)
							]
						}), /* @__PURE__ */ I("div", {
							className: "mt-0.5 whitespace-pre-wrap",
							children: e.text
						})]
					}, e.id)),
					/* @__PURE__ */ L("div", {
						className: "space-y-2 border-t border-border pt-4",
						children: [/* @__PURE__ */ I(x, {
							rows: 3,
							value: S,
							onChange: (e) => C(e.target.value),
							placeholder: "Add a note"
						}), /* @__PURE__ */ I(t, {
							size: "sm",
							variant: "primary",
							disabled: !S.trim(),
							loading: E.isPending,
							onClick: () => E.mutate(),
							children: "Add note"
						})]
					})
				]
			})] })]
		}),
		_ && /* @__PURE__ */ I(de, {
			entry: p,
			onClose: () => v(!1)
		}),
		/* @__PURE__ */ I(a, {
			open: y,
			onOpenChange: b,
			title: `Remove ${p.name} from the blacklist?`,
			description: "Its notes and warnings are deleted with it. The removal is kept in the audit log.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ L(F, { children: [/* @__PURE__ */ I(V, {}), " Remove"] }),
			onConfirm: () => w.delete(`${G}/entries/${p.id}`).then(() => {
				s.invalidateQueries({ queryKey: ["blacklist"] }), O.success(`${p.name} removed`), l("/p/blacklist");
			})
		})
	] });
}
function pe() {
	let { data: t, isLoading: n } = A({
		queryKey: ["blacklist", "summary"],
		queryFn: () => w.get(`${G}/summary`),
		refetchInterval: 3e5
	});
	return n || !t ? /* @__PURE__ */ I(h, { className: "h-16" }) : /* @__PURE__ */ L(N, {
		to: "/p/blacklist",
		className: "block",
		children: [/* @__PURE__ */ L("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ L("div", { children: [
				/* @__PURE__ */ I("div", {
					className: "text-xs text-muted",
					children: "Open warnings"
				}),
				/* @__PURE__ */ I("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: t.open_matches
				}),
				/* @__PURE__ */ L("div", {
					className: "text-xs text-subtle",
					children: [t.entries, " on the blacklist"]
				})
			] }), t.open_matches > 0 ? /* @__PURE__ */ L(e, {
				tone: "danger",
				children: [/* @__PURE__ */ I(ie, { className: "size-3.5" }), " Look at them"]
			}) : /* @__PURE__ */ I(e, {
				tone: "success",
				children: "All clear"
			})]
		}), t.latest.length > 0 && /* @__PURE__ */ I("ul", {
			className: "mt-3 space-y-1 text-sm",
			children: t.latest.map((e) => /* @__PURE__ */ L("li", {
				className: "truncate",
				children: [
					/* @__PURE__ */ I("span", {
						className: "font-medium",
						children: e.character_name
					}),
					" ",
					/* @__PURE__ */ L("span", {
						className: "text-muted",
						children: [
							"· ",
							e.user,
							" · ",
							e.entry.name
						]
					})
				]
			}, e.id))
		})]
	});
}
var me = E({
	routes: [{
		path: "",
		Component: oe
	}, {
		path: "entries/:id",
		Component: fe
	}],
	widgets: [{
		id: "warnings",
		title: "Blacklist",
		Component: pe,
		size: "sm",
		order: 35,
		permission: "blacklist.view_blacklist"
	}]
});
//#endregion
export { me as default };

export const classes = ["!data","!o","---","--------------------------------------------------------------------------------------","----------------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------","---------------------------------------------------------------------------------------------------","@conduit/sdk","@tanstack/react-query","a","action","actions","active","addNote","added_by","adding","align","all","alliance","alliances","alt","an","and","applicants","applied","applies","are","aria-label","as","at","audit","author","banned","blacklist","blacklisted","block","boolean","border","border-b","border-border","border-t","but","by","can","canManage","can_manage","changing","character","character_id","character_name","characters","check","checked","children","className","clear","confirmLabel","const","corporation","corporations","count","counts","covers","created_at","current","currentColor","cursor-pointer","cx","cy","danger","dashboard","data","datetime-local","dealt","default","deleted","description","disabled","divide-border","divide-y","don","empty","entries","entry","entry_id","error","eve_id","every","everyone","exact","expired","expires","expires_at","export","eye","eyebrow","few","fill","fleet","flex","flex-1","flex-wrap","font-medium","font-mono","font-normal","font-semibold","footer","for","found_at","from","fromLocal","function","gap-1.5","gap-2","gap-3","gap-6","get","ghost","grid","h-16","h-32","h-40","h-96","hasn","here","hint","hover:text-accent-ink","hover:text-text","icon","icons","id","if","image","import","in","inline","inline-flex","interface","is","isLoading","iso","it","items","items-center","items-end","items-start","justify-between","keep","kept","key","kind","knows","label","latest","lazy","length","lg","linked","links","list","loading","looked","lookup","m12","m14.5","m21","m21.73","m9.5","manage_blacklist","matches","max-w-md","max-w-sm","mb-4","members","min-w-0","mt-0.5","mt-1","mt-3","must","mutationFn","name","names","navigate","never","new","nobody","none","not","note","notes","number","object-cover","of","on","onChange","onClick","onClose","onConfirm","onError","onOpenChange","onResolve","onSubmit","onSuccess","onValueChange","one","opacity-60","open","open_matches","options","or","order","p-3","p-card","panel","patch","path","people","permission","pills","placeholder","plugin","portrait","post","primary","pt-4","put","px-3","py-2.5","qc","queryFn","queryKey","radio","re","react","react-router","read","reason","reasons","refetchInterval","registered","removal","removed","resolve","resolved","resolved_at","resolved_by","rest","return","right","round","rounded","rounded-full","rounded-lg","routes","rows","runs","save","see","set","setAdding","setEditing","setForm","setKind","setNote","setPicked","setQ","setRemoving","setStatus","setTab","severity","shrink-0","site","size","size-3.5","size-4","size-8","size-full","sm","so","someone","source","space-y-1","space-y-2","space-y-4","space-y-5","space-y-6","src","status","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","submit","success","summary","t","tabular-nums","text","text-3xl","text-accent-ink","text-muted","text-sm","text-subtle","text-success-fg","text-xs","that","the","their","them","they","this","title","to","toLocal","tone","truncate","type","updated_at","useParams","useQueryClient","useState","used","user","user_id","v","value","variant","viewBox","view_blacklist","void","w-44","w-60","w-64","warned","warning","warnings","watch","when","whitespace-pre-wrap","who","widgets","with","xl:grid-cols-[1fr_420px]","xs","yet","you","your"];
