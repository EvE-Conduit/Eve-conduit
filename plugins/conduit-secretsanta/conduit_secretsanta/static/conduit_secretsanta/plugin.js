import { Avatar as e, Badge as t, Button as n, Callout as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, DescriptionList as c, Dialog as l, EmptyState as u, Field as d, Input as f, PageHeader as p, Select as m, Skeleton as h, SwitchRow as g, THead as _, Table as v, Td as y, Textarea as b, Th as x, Tr as S, api as C, cn as w, dateTime as T, definePlugin as E, isk as D, toast as O } from "@conduit/sdk";
import { useMutation as k, useQuery as A, useQueryClient as j } from "@tanstack/react-query";
import { Link as M, useNavigate as N, useParams as P } from "react-router";
import { useState as F } from "react";
import { Fragment as I, jsx as L, jsxs as R } from "react/jsx-runtime";
//#region src/types.ts
var z = "/api/p/secretsanta", B = {
	signup: {
		label: "Sign-up open",
		tone: "accent"
	},
	closed: {
		label: "Waiting for the draw",
		tone: "warning"
	},
	drawn: {
		label: "Drawn, not sent",
		tone: "warning"
	},
	running: {
		label: "Gifts under way",
		tone: "success"
	},
	ended: {
		label: "Ended",
		tone: "neutral"
	}
};
//#endregion
//#region src/editor.tsx
function V(e) {
	if (!e) return "";
	let t = new Date(e), n = (e) => String(e).padStart(2, "0");
	return `${t.getFullYear()}-${n(t.getMonth() + 1)}-${n(t.getDate())}T${n(t.getHours())}:${n(t.getMinutes())}`;
}
function H({ event: e, onClose: t }) {
	let r = j(), i = N(), { data: a } = A({
		queryKey: ["secretsanta", "audience"],
		queryFn: () => C.get(`${z}/audience`)
	}), [o, s] = F({
		name: e?.name ?? "",
		description: e?.description ?? "",
		notes: e?.organiser?.notes ?? "",
		signup_closes_at: V(e?.signup_closes_at),
		gift_deadline: V(e?.gift_deadline),
		budget: e?.budget_isk == null ? "" : String(e.budget_isk / 1e6),
		states: e?.organiser?.states.map((e) => e.id) ?? [],
		groups: e?.organiser?.groups.map((e) => e.id) ?? [],
		announce: !0
	}), c = (e) => s((t) => ({
		...t,
		...e
	})), u = (e, t) => c({ [e]: o[e].includes(t) ? o[e].filter((e) => e !== t) : [...o[e], t] }), p = k({
		mutationFn: () => {
			let t = {
				name: o.name,
				description: o.description,
				notes: o.notes,
				signup_closes_at: new Date(o.signup_closes_at).toISOString(),
				gift_deadline: new Date(o.gift_deadline).toISOString(),
				budget_isk: o.budget.trim() ? Math.round(Number(o.budget) * 1e6) : null,
				states: o.states,
				groups: o.groups,
				announce: o.announce
			};
			return e ? C.put(`${z}/events/${e.id}`, t) : C.post(`${z}/events`, t);
		},
		onSuccess: (n) => {
			r.invalidateQueries({ queryKey: ["secretsanta"] }), O.success(e ? "Event saved" : "Event created"), t(), e || i(`/p/secretsanta/${n.id}`);
		},
		onError: (e) => O.error(e.message)
	}), m = !o.budget.trim() || Number.isFinite(Number(o.budget)) && Number(o.budget) >= 0, h = o.name.trim() && o.signup_closes_at && o.gift_deadline && m, _ = o.states.length === 0 && o.groups.length === 0;
	return /* @__PURE__ */ L(l, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: e ? "Edit event" : "New Secret Santa",
		size: "lg",
		footer: /* @__PURE__ */ R(I, { children: [
			/* @__PURE__ */ R("span", {
				className: "mr-auto self-center text-xs text-muted",
				children: [_ ? "Every member" : "Only the chosen states and groups", " can join."]
			}),
			/* @__PURE__ */ L(n, {
				variant: "ghost",
				onClick: t,
				children: "Cancel"
			}),
			/* @__PURE__ */ L(n, {
				variant: "primary",
				disabled: !h,
				loading: p.isPending,
				onClick: () => p.mutate(),
				children: e ? "Save" : "Create"
			})
		] }),
		children: /* @__PURE__ */ R("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ L(d, {
					label: "Name",
					required: !0,
					children: /* @__PURE__ */ L(f, {
						value: o.name,
						maxLength: 100,
						onChange: (e) => c({ name: e.target.value }),
						placeholder: "Winter gifts",
						autoFocus: !0
					})
				}),
				/* @__PURE__ */ L(d, {
					label: "Description",
					hint: "Everyone who can join sees it.",
					children: /* @__PURE__ */ L(b, {
						rows: 3,
						value: o.description,
						onChange: (e) => c({ description: e.target.value }),
						placeholder: "One gift each, sent by contract or ISK."
					})
				}),
				/* @__PURE__ */ R("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ L(d, {
						label: "Sign-up closes",
						required: !0,
						hint: "The draw can be done after this.",
						children: /* @__PURE__ */ L(f, {
							type: "datetime-local",
							value: o.signup_closes_at,
							onChange: (e) => c({ signup_closes_at: e.target.value })
						})
					}), /* @__PURE__ */ L(d, {
						label: "Gift deadline",
						required: !0,
						hint: "A reminder goes out two days before.",
						children: /* @__PURE__ */ L(f, {
							type: "datetime-local",
							value: o.gift_deadline,
							onChange: (e) => c({ gift_deadline: e.target.value })
						})
					})]
				}),
				/* @__PURE__ */ L(d, {
					label: "Suggested budget (million ISK)",
					hint: "Optional.",
					error: m ? void 0 : "A number of million ISK",
					children: /* @__PURE__ */ L(f, {
						inputMode: "decimal",
						value: o.budget,
						onChange: (e) => c({ budget: e.target.value }),
						placeholder: "100"
					})
				}),
				/* @__PURE__ */ R("div", { children: [
					/* @__PURE__ */ L("div", {
						className: "mb-1.5 text-[13px] font-medium",
						children: "Who may join"
					}),
					/* @__PURE__ */ L("p", {
						className: "mb-2 text-xs text-muted",
						children: "Nothing picked means every member."
					}),
					/* @__PURE__ */ L("div", {
						className: "flex flex-wrap gap-1.5",
						children: (a?.states ?? []).map((e) => /* @__PURE__ */ L(U, {
							on: o.states.includes(e.id),
							onClick: () => u("states", e.id),
							color: e.color,
							children: e.name
						}, `s${e.id}`))
					}),
					(a?.groups.length ?? 0) > 0 && /* @__PURE__ */ L("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: a.groups.map((e) => /* @__PURE__ */ L(U, {
							on: o.groups.includes(e.id),
							onClick: () => u("groups", e.id),
							children: e.name
						}, `g${e.id}`))
					})
				] }),
				/* @__PURE__ */ L(d, {
					label: "Notes for organisers",
					hint: "Optional. Only organisers see them.",
					children: /* @__PURE__ */ L(b, {
						rows: 2,
						value: o.notes,
						onChange: (e) => c({ notes: e.target.value })
					})
				}),
				!e && /* @__PURE__ */ L("div", {
					className: "border border-border px-3",
					children: /* @__PURE__ */ L(g, {
						label: "Tell people",
						description: "A notification to everyone who may join.",
						checked: o.announce,
						onCheckedChange: (e) => c({ announce: e })
					})
				})
			]
		})
	});
}
function U({ on: e, onClick: t, color: n, children: r }) {
	return /* @__PURE__ */ R("button", {
		type: "button",
		"aria-pressed": e,
		onClick: t,
		className: w("inline-flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors", e ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text"),
		children: [n && /* @__PURE__ */ L("span", {
			className: "size-1.5 rotate-45",
			style: { background: n }
		}), r]
	});
}
//#endregion
//#region src/icons.tsx
function W({ children: e, className: t = "size-4" }) {
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
var G = (e) => /* @__PURE__ */ R(W, {
	...e,
	children: [
		/* @__PURE__ */ L("rect", {
			x: "3",
			y: "8",
			width: "18",
			height: "4",
			rx: "1"
		}),
		/* @__PURE__ */ L("path", { d: "M12 8v13" }),
		/* @__PURE__ */ L("path", { d: "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" }),
		/* @__PURE__ */ L("path", { d: "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" })
	]
}), K = (e) => /* @__PURE__ */ R(W, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M5 12h14" }), /* @__PURE__ */ L("path", { d: "M12 5v14" })]
}), q = (e) => /* @__PURE__ */ R(W, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "m18 14 4 4-4 4" }),
		/* @__PURE__ */ L("path", { d: "m18 2 4 4-4 4" }),
		/* @__PURE__ */ L("path", { d: "M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-7.6a4 4 0 0 1 3.3-1.7H22" }),
		/* @__PURE__ */ L("path", { d: "M2 6h1.972a4 4 0 0 1 3.6 2.2" }),
		/* @__PURE__ */ L("path", { d: "M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" })
	]
}), J = (e) => /* @__PURE__ */ R(W, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" }), /* @__PURE__ */ L("path", { d: "m21.854 2.147-10.94 10.939" })]
}), Y = (e) => /* @__PURE__ */ R(W, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }), /* @__PURE__ */ L("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), X = (e) => /* @__PURE__ */ L(W, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" })
}), Z = (e) => /* @__PURE__ */ R(W, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M3 6h18" }),
		/* @__PURE__ */ L("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ L("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), ee = (e) => /* @__PURE__ */ L(W, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "M20 6 9 17l-5-5" })
}), te = (e) => /* @__PURE__ */ R(W, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ L("path", { d: "M19 12H5" })]
});
//#endregion
//#region src/event.tsx
function Q(e) {
	let t = j();
	return k({
		mutationFn: ({ method: t, path: n, body: r }) => {
			let i = `${z}/events/${e}${n}`;
			return t === "delete" ? C.delete(i) : C[t](i, r ?? {});
		},
		onSuccess: (n, { done: r }) => {
			t.setQueryData([
				"secretsanta",
				"event",
				e
			], n), t.invalidateQueries({ queryKey: ["secretsanta", "events"] }), t.invalidateQueries({ queryKey: ["secretsanta", "widget"] }), r && O.success(r);
		},
		onError: (e) => O.error(e.message)
	});
}
function ne() {
	let e = Number(P().id), [o, s] = F(!1), { data: l, isLoading: u, error: d } = A({
		queryKey: [
			"secretsanta",
			"event",
			e
		],
		queryFn: () => C.get(`${z}/events/${e}`)
	});
	if (u) return /* @__PURE__ */ L(h, { className: "h-64" });
	if (d || !l) return /* @__PURE__ */ L(r, {
		tone: "warning",
		children: "This event doesn't exist, or isn't open to you."
	});
	let f = B[l.phase];
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ R(M, {
			to: "/p/secretsanta",
			className: "mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ L(te, {}), " Secret Santa"]
		}),
		/* @__PURE__ */ L(p, {
			eyebrow: /* @__PURE__ */ L(t, {
				tone: f.tone,
				children: f.label
			}),
			title: l.name,
			icon: /* @__PURE__ */ L(G, {}),
			description: l.description || void 0,
			actions: l.organiser && l.phase !== "ended" && /* @__PURE__ */ R(n, {
				onClick: () => s(!0),
				children: [/* @__PURE__ */ L(X, {}), " Edit"]
			})
		}),
		/* @__PURE__ */ R("div", {
			className: "grid gap-6 lg:grid-cols-[1fr_320px]",
			children: [/* @__PURE__ */ R("div", {
				className: "min-w-0 space-y-6",
				children: [
					l.me?.giving_to && /* @__PURE__ */ L(ie, { e: l }),
					l.me && l.phase !== "signup" && l.phase !== "closed" && l.phase !== "drawn" && /* @__PURE__ */ L(ae, { e: l }),
					(l.may_join || l.me) && /* @__PURE__ */ L(re, { e: l }),
					!l.me && !l.may_join && !l.organiser && /* @__PURE__ */ L(r, {
						tone: "info",
						children: l.phase === "signup" ? "This event isn't open to you." : "Sign-up has closed."
					}),
					l.pairs && /* @__PURE__ */ L(oe, { pairs: l.pairs }),
					l.organiser && /* @__PURE__ */ L(se, {
						e: l,
						o: l.organiser
					})
				]
			}), /* @__PURE__ */ L(i, {
				className: "h-fit",
				children: /* @__PURE__ */ L(a, { children: /* @__PURE__ */ L(c, { items: [
					{
						label: "Sign-up closes",
						value: T(l.signup_closes_at)
					},
					{
						label: "Gift deadline",
						value: T(l.gift_deadline)
					},
					{
						label: "Budget",
						value: l.budget_isk == null ? "Up to you" : `About ${D(l.budget_isk)}`
					},
					{
						label: "Signed up",
						value: l.participants
					}
				] }) })
			})]
		}),
		o && /* @__PURE__ */ L(H, {
			event: l,
			onClose: () => s(!1)
		})
	] });
}
function re({ e }) {
	let t = Q(e.id), r = e.me, [c, l] = F(String(r?.character?.id ?? e.characters[0]?.id ?? "")), [u, f] = F(r?.wishlist ?? ""), [p, h] = F(!1), g = e.phase === "ended";
	return /* @__PURE__ */ R(i, { children: [
		/* @__PURE__ */ L(o, {
			title: r ? "Your sign-up" : "Sign up",
			description: r ? "Your Secret Santa sees this character and wish list." : "One sign-up per person, whichever character you use. Pick the one that should get the gift."
		}),
		/* @__PURE__ */ R(a, {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ L(d, {
					label: "Send my gift to",
					children: /* @__PURE__ */ L(m, {
						value: c,
						disabled: g,
						onChange: (e) => l(e.target.value),
						options: e.characters.map((e) => ({
							value: String(e.id),
							label: e.name
						}))
					})
				}),
				/* @__PURE__ */ L(d, {
					label: "Wish list or a hint",
					hint: "Optional. Ships, skins, PLEX, or what you fly.",
					children: /* @__PURE__ */ L(b, {
						rows: 3,
						maxLength: 2e3,
						disabled: g,
						value: u,
						onChange: (e) => f(e.target.value)
					})
				}),
				!g && /* @__PURE__ */ R("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ L(n, {
							variant: "primary",
							loading: t.isPending,
							onClick: () => t.mutate({
								method: "put",
								path: "/me",
								body: {
									character_id: Number(c) || null,
									wishlist: u
								},
								done: r ? "Saved" : "You're in"
							}),
							children: r ? "Save" : "Join"
						}),
						r?.can_withdraw && /* @__PURE__ */ L(n, {
							variant: "ghost",
							onClick: () => h(!0),
							children: "Withdraw"
						}),
						r && !r.can_withdraw && /* @__PURE__ */ L("span", {
							className: "text-xs text-muted",
							children: "The draw has been done. To leave now, ask an organiser."
						})
					]
				})
			]
		}),
		/* @__PURE__ */ L(s, {
			open: p,
			onOpenChange: h,
			title: "Withdraw from this Secret Santa?",
			description: "You can sign up again while sign-up is open.",
			confirmLabel: "Withdraw",
			onConfirm: () => t.mutateAsync({
				method: "delete",
				path: "/me",
				done: "You've withdrawn"
			}).then(() => h(!1))
		})
	] });
}
function ie({ e: t }) {
	let s = Q(t.id), c = t.me.giving_to, [l, u] = F(c.sent_note);
	return /* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(o, {
		title: "You're giving to",
		description: `Send it by ${T(t.gift_deadline)}.`
	}), /* @__PURE__ */ R(a, {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ R("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ L(e, {
					src: c.character?.portrait ?? null,
					name: c.character?.name ?? c.name,
					size: "lg"
				}), /* @__PURE__ */ R("div", { children: [/* @__PURE__ */ L("div", {
					className: "text-lg font-semibold",
					children: c.character?.name ?? c.name
				}), c.character && c.character.name !== c.name && /* @__PURE__ */ R("div", {
					className: "text-xs text-muted",
					children: ["Main: ", c.name]
				})] })]
			}),
			/* @__PURE__ */ R("div", { children: [/* @__PURE__ */ L("div", {
				className: "mb-1 text-[13px] font-medium",
				children: "Their wish list"
			}), c.wishlist ? /* @__PURE__ */ L("p", {
				className: "whitespace-pre-wrap text-sm",
				children: c.wishlist
			}) : /* @__PURE__ */ L("p", {
				className: "text-sm text-subtle",
				children: "Nothing written. Surprise them."
			})] }),
			c.sent_at ? /* @__PURE__ */ R("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ L(r, {
						tone: "success",
						title: `Sent ${T(c.sent_at)}`,
						children: c.sent_note || "No note."
					}),
					c.received_at && /* @__PURE__ */ L(r, {
						tone: "success",
						title: "They got it",
						children: c.thanks ? `"${c.thanks}"` : "No thank-you note yet."
					}),
					!c.received_at && /* @__PURE__ */ L(n, {
						size: "sm",
						variant: "ghost",
						loading: s.isPending,
						onClick: () => s.mutate({
							method: "delete",
							path: "/sent",
							done: "Marked not sent"
						}),
						children: "Not sent after all"
					})
				]
			}) : /* @__PURE__ */ R("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ L(d, {
					label: "Note for them",
					hint: "Optional: what to look for, a contract or ISK. They don't see who you are, but a contract shows its issuer.",
					children: /* @__PURE__ */ L(f, {
						maxLength: 500,
						value: l,
						onChange: (e) => u(e.target.value),
						placeholder: "Item exchange contract in Jita"
					})
				}), /* @__PURE__ */ R(n, {
					variant: "primary",
					loading: s.isPending,
					onClick: () => s.mutate({
						method: "post",
						path: "/sent",
						body: { note: l },
						done: "Marked sent"
					}),
					children: [/* @__PURE__ */ L(J, {}), " I've sent it"]
				})]
			})
		]
	})] });
}
function ae({ e }) {
	let t = Q(e.id), s = e.me.my_gift, [c, l] = F(s?.thanks ?? "");
	return /* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(o, {
		title: "Your gift",
		description: "Your Secret Santa stays secret. A thank-you reaches them without saying who they are."
	}), /* @__PURE__ */ R(a, {
		className: "space-y-3",
		children: [!s || !s.sent_at ? /* @__PURE__ */ L("p", {
			className: "text-sm text-muted",
			children: "Not sent yet. You get a notification when it is."
		}) : /* @__PURE__ */ L(r, {
			tone: "success",
			title: `On its way since ${T(s.sent_at)}`,
			children: s.sent_note || "No note."
		}), s && /* @__PURE__ */ R(I, { children: [
			/* @__PURE__ */ L(d, {
				label: "Thank-you note",
				hint: "Optional. Sent to your Secret Santa.",
				children: /* @__PURE__ */ L(b, {
					rows: 2,
					maxLength: 1e3,
					value: c,
					onChange: (e) => l(e.target.value)
				})
			}),
			/* @__PURE__ */ R(n, {
				variant: s.received_at ? "secondary" : "primary",
				loading: t.isPending,
				disabled: !!s.received_at && c.trim() === s.thanks,
				onClick: () => t.mutate({
					method: "post",
					path: "/received",
					body: { thanks: c },
					done: s.received_at ? "Thank-you sent" : "Marked received"
				}),
				children: [
					/* @__PURE__ */ L(ee, {}),
					" ",
					s.received_at ? "Send thank-you" : "I got it"
				]
			}),
			s.received_at && /* @__PURE__ */ R("p", {
				className: "text-xs text-muted",
				children: [
					"Received ",
					T(s.received_at),
					"."
				]
			})
		] })]
	})] });
}
function oe({ pairs: e }) {
	return /* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(o, { title: "Who gave to whom" }), /* @__PURE__ */ L($, { pairs: e })] });
}
function $({ pairs: e }) {
	return /* @__PURE__ */ R(v, { children: [/* @__PURE__ */ L(_, { children: /* @__PURE__ */ R("tr", { children: [
		/* @__PURE__ */ L(x, { children: "From" }),
		/* @__PURE__ */ L(x, { children: "To" }),
		/* @__PURE__ */ L(x, { children: "Gift" })
	] }) }), /* @__PURE__ */ L("tbody", { children: e.map((e) => /* @__PURE__ */ R(S, { children: [
		/* @__PURE__ */ L(y, { children: e.giver.name }),
		/* @__PURE__ */ L(y, { children: e.giftee.character?.name ?? e.giftee.name }),
		/* @__PURE__ */ L(y, { children: e.received_at ? /* @__PURE__ */ L(t, {
			tone: "success",
			children: "Received"
		}) : e.sent_at ? /* @__PURE__ */ L(t, {
			tone: "info",
			children: "Sent"
		}) : /* @__PURE__ */ L(t, {
			tone: "neutral",
			children: "Not sent"
		}) })
	] }, e.giver.id)) })] });
}
function se({ e: c, o: l }) {
	let u = Q(c.id), d = j(), f = N(), [p, h] = F(null), [b, w] = F(null), [E, D] = F(!1), [A, M] = F(""), [P, I] = F(""), B = new Map(l.participants.map((e) => [e.id, e.name])), V = k({
		mutationFn: () => C.post(`${z}/events/${c.id}/reveal`, {}),
		onSuccess: (e) => {
			w(e.pairs), D(!1);
		},
		onError: (e) => O.error(e.message)
	}), H = k({
		mutationFn: () => C.delete(`${z}/events/${c.id}`),
		onSuccess: () => {
			d.invalidateQueries({ queryKey: ["secretsanta"] }), O.success("Event deleted"), f("/p/secretsanta");
		},
		onError: (e) => O.error(e.message)
	}), U = typeof p == "object" && p ? l.participants.find((e) => e.id === p.remove) : void 0, W = !l.published_at && !l.ended_at;
	return /* @__PURE__ */ R(i, { children: [
		/* @__PURE__ */ L(o, {
			title: "Organising",
			description: "You see who's in and how the gifts are going, not who gives to whom."
		}),
		/* @__PURE__ */ R(a, {
			className: "space-y-5",
			children: [
				l.notes && /* @__PURE__ */ L(r, {
					tone: "info",
					title: "Notes",
					children: l.notes
				}),
				/* @__PURE__ */ R("div", {
					className: "flex flex-wrap gap-2",
					children: [
						(c.phase === "closed" || c.phase === "drawn") && /* @__PURE__ */ R(n, {
							variant: c.phase === "closed" ? "primary" : "secondary",
							loading: u.isPending,
							onClick: () => u.mutate({
								method: "post",
								path: "/draw",
								done: c.phase === "drawn" ? "Drawn again" : "Drawn"
							}),
							children: [
								/* @__PURE__ */ L(q, {}),
								" ",
								c.phase === "drawn" ? "Draw again" : "Draw"
							]
						}),
						c.phase === "drawn" && /* @__PURE__ */ R(n, {
							variant: "primary",
							onClick: () => h("publish"),
							children: [/* @__PURE__ */ L(J, {}), " Send the results"]
						}),
						c.phase === "running" && /* @__PURE__ */ L(n, {
							onClick: () => h("end"),
							children: "End the event"
						}),
						l.drawn_at && !b && /* @__PURE__ */ R(n, {
							variant: "ghost",
							onClick: () => D(!0),
							children: [/* @__PURE__ */ L(Y, {}), " Show who gives to whom"]
						}),
						/* @__PURE__ */ R(n, {
							variant: "ghost",
							onClick: () => h("delete"),
							children: [/* @__PURE__ */ L(Z, {}), " Delete"]
						})
					]
				}),
				c.phase === "signup" && /* @__PURE__ */ L("p", {
					className: "text-sm text-muted",
					children: "The draw can be done once sign-up closes. To close it early, edit the event and move the closing time."
				}),
				c.phase === "drawn" && /* @__PURE__ */ L("p", {
					className: "text-sm text-muted",
					children: "Nobody knows the draw yet. You can draw again until you send the results."
				}),
				l.ended_at && /* @__PURE__ */ L("div", {
					className: "border border-border px-3",
					children: /* @__PURE__ */ L(g, {
						label: "Show every pair to the participants",
						description: "Who gave to whom, on this page, for everyone who took part.",
						checked: c.reveal_all,
						onCheckedChange: (e) => u.mutate({
							method: "put",
							path: "/reveal-all",
							body: { on: e },
							done: e ? "Pairs shown" : "Pairs hidden"
						})
					})
				}),
				b && /* @__PURE__ */ R("div", { children: [/* @__PURE__ */ R("div", {
					className: "mb-2 flex items-center justify-between",
					children: [/* @__PURE__ */ L("span", {
						className: "text-[13px] font-medium",
						children: "Who gives to whom"
					}), /* @__PURE__ */ L(n, {
						size: "sm",
						variant: "ghost",
						onClick: () => w(null),
						children: "Hide"
					})]
				}), /* @__PURE__ */ L($, { pairs: b })] }),
				/* @__PURE__ */ R("div", { children: [/* @__PURE__ */ R("div", {
					className: "mb-2 text-[13px] font-medium",
					children: [
						l.participants.length,
						" signed up",
						l.published_at ? ` · ${l.sent} sent · ${l.received} received` : ""
					]
				}), l.participants.length === 0 ? /* @__PURE__ */ L("p", {
					className: "text-sm text-subtle",
					children: "Nobody yet."
				}) : /* @__PURE__ */ R(v, { children: [/* @__PURE__ */ L(_, { children: /* @__PURE__ */ R("tr", { children: [
					/* @__PURE__ */ L(x, { children: "Person" }),
					/* @__PURE__ */ L(x, { children: "Gets it on" }),
					/* @__PURE__ */ L(x, { children: "Sent theirs" }),
					/* @__PURE__ */ L(x, { children: "Got one" }),
					/* @__PURE__ */ L(x, {})
				] }) }), /* @__PURE__ */ L("tbody", { children: l.participants.map((r) => /* @__PURE__ */ R(S, { children: [
					/* @__PURE__ */ L(y, { children: /* @__PURE__ */ R("span", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ L(e, {
							src: r.portrait,
							name: r.name,
							size: "sm"
						}), /* @__PURE__ */ R("span", { children: [/* @__PURE__ */ L("span", {
							className: "block font-medium",
							children: r.name
						}), /* @__PURE__ */ L("span", {
							className: "block text-xs text-muted",
							children: r.has_wishlist ? "Wrote a wish list" : "No wish list"
						})] })]
					}) }),
					/* @__PURE__ */ L(y, {
						className: "text-muted",
						children: r.character?.name ?? "—"
					}),
					/* @__PURE__ */ L(y, { children: r.sent_at ? /* @__PURE__ */ L(t, {
						tone: "success",
						children: T(r.sent_at)
					}) : /* @__PURE__ */ L("span", {
						className: "text-subtle",
						children: "—"
					}) }),
					/* @__PURE__ */ L(y, { children: r.received_at ? /* @__PURE__ */ L(t, {
						tone: "success",
						children: T(r.received_at)
					}) : /* @__PURE__ */ L("span", {
						className: "text-subtle",
						children: "—"
					}) }),
					/* @__PURE__ */ L(y, {
						className: "text-right",
						children: !l.ended_at && /* @__PURE__ */ L(n, {
							size: "sm",
							variant: "ghost",
							onClick: () => h({ remove: r.id }),
							children: "Take out"
						})
					})
				] }, r.id)) })] })] }),
				/* @__PURE__ */ R("div", { children: [
					/* @__PURE__ */ L("div", {
						className: "mb-1 text-[13px] font-medium",
						children: "Kept apart"
					}),
					/* @__PURE__ */ L("p", {
						className: "mb-2 text-xs text-muted",
						children: "Two people who must not draw each other, such as a couple. Adding one throws away a draw that hasn't been sent."
					}),
					l.exclusions.length > 0 && /* @__PURE__ */ L("ul", {
						className: "mb-3 divide-y divide-border border border-border",
						children: l.exclusions.map((e) => /* @__PURE__ */ R("li", {
							className: "flex items-center justify-between gap-2 px-3 py-2 text-sm",
							children: [/* @__PURE__ */ R("span", { children: [
								B.get(e.first),
								" and ",
								B.get(e.second)
							] }), /* @__PURE__ */ L(n, {
								size: "xs",
								variant: "ghost",
								onClick: () => u.mutate({
									method: "delete",
									path: `/exclusions/${e.id}`,
									done: "Exclusion removed"
								}),
								children: "Remove"
							})]
						}, e.id))
					}),
					W && l.participants.length >= 2 && /* @__PURE__ */ R("div", {
						className: "flex flex-wrap items-end gap-2",
						children: [
							/* @__PURE__ */ L(m, {
								className: "min-w-40",
								value: A,
								onChange: (e) => M(e.target.value),
								"aria-label": "First person",
								options: [{
									value: "",
									label: "Pick someone"
								}, ...l.participants.map((e) => ({
									value: String(e.id),
									label: e.name
								}))]
							}),
							/* @__PURE__ */ L(m, {
								className: "min-w-40",
								value: P,
								onChange: (e) => I(e.target.value),
								"aria-label": "Second person",
								options: [{
									value: "",
									label: "and someone else"
								}, ...l.participants.filter((e) => String(e.id) !== A).map((e) => ({
									value: String(e.id),
									label: e.name
								}))]
							}),
							/* @__PURE__ */ L(n, {
								disabled: !A || !P || A === P,
								loading: u.isPending,
								onClick: () => u.mutate({
									method: "post",
									path: "/exclusions",
									body: {
										first: Number(A),
										second: Number(P)
									},
									done: "Kept apart"
								}, { onSuccess: () => {
									M(""), I("");
								} }),
								children: "Keep apart"
							})
						]
					})
				] })
			]
		}),
		/* @__PURE__ */ L(s, {
			open: E,
			onOpenChange: D,
			title: "Show who gives to whom?",
			description: `This is recorded in the audit log.${c.me ? " You'll also see who your own Secret Santa is." : ""}`,
			confirmLabel: "Show",
			onConfirm: () => V.mutateAsync()
		}),
		/* @__PURE__ */ L(s, {
			open: p !== null,
			onOpenChange: (e) => !e && h(null),
			danger: p === "delete" || typeof p == "object",
			title: p === "publish" ? "Send the results?" : p === "end" ? "End this event?" : p === "delete" ? "Delete this event?" : `Take ${U?.name ?? "them"} out?`,
			description: p === "publish" ? "Everyone gets a notification saying who they give to. The draw can't be done again after this." : p === "end" ? "Gifts can still be marked, but no more reminders go out. You can then show every pair to the participants." : p === "delete" ? "The event, its draw and every sign-up are deleted for good." : l.drawn_at ? "Whoever was giving to them gets their giftee instead, and is told if the results are out." : "They're told they were taken out.",
			confirmLabel: p === "publish" ? "Send" : p === "end" ? "End" : p === "delete" ? "Delete" : "Take out",
			onConfirm: () => {
				if (p === "delete") return H.mutateAsync();
				let e = p === "publish" ? {
					method: "post",
					path: "/publish",
					done: "Results sent"
				} : p === "end" ? {
					method: "post",
					path: "/end",
					done: "Event ended"
				} : {
					method: "delete",
					path: `/participants/${p.remove}`,
					done: "Taken out"
				};
				return u.mutateAsync(e).then(() => h(null));
			}
		})
	] });
}
//#endregion
//#region src/events.tsx
function ce() {
	let [e, r] = F(!1), { data: o, isLoading: s } = A({
		queryKey: ["secretsanta", "events"],
		queryFn: () => C.get(`${z}/events`)
	}), c = o?.can_organise && /* @__PURE__ */ R(n, {
		variant: "primary",
		onClick: () => r(!0),
		children: [/* @__PURE__ */ L(K, {}), " New event"]
	});
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(p, {
			eyebrow: "Community",
			title: "Secret Santa",
			icon: /* @__PURE__ */ L(G, {}),
			description: "Sign up, get someone to give to, and send them a gift. Nobody knows who their Secret Santa is.",
			actions: c
		}),
		s || !o ? /* @__PURE__ */ L(h, { className: "h-40" }) : o.events.length === 0 ? /* @__PURE__ */ L(u, {
			icon: /* @__PURE__ */ L(G, {}),
			title: "No Secret Santa right now",
			description: o.can_organise ? "Create an event and people can sign up." : "When organisers start one, it shows here.",
			action: c || void 0
		}) : /* @__PURE__ */ L("div", {
			className: "grid gap-4 md:grid-cols-2",
			children: o.events.map((e) => /* @__PURE__ */ L(M, {
				to: `/p/secretsanta/${e.id}`,
				className: "block",
				children: /* @__PURE__ */ L(i, {
					className: "h-full transition-colors hover:border-border-strong",
					children: /* @__PURE__ */ R(a, {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ R("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ L("span", {
									className: "font-semibold",
									children: e.name
								}), /* @__PURE__ */ R("span", {
									className: "flex shrink-0 gap-1.5",
									children: [e.joined && /* @__PURE__ */ L(t, {
										tone: "info",
										children: "You're in"
									}), /* @__PURE__ */ L(t, {
										tone: B[e.phase].tone,
										children: B[e.phase].label
									})]
								})]
							}),
							e.description && /* @__PURE__ */ L("p", {
								className: "line-clamp-2 text-sm text-muted",
								children: e.description
							}),
							/* @__PURE__ */ R("div", {
								className: "flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle",
								children: [
									/* @__PURE__ */ R("span", { children: ["Sign-up closes ", T(e.signup_closes_at)] }),
									/* @__PURE__ */ R("span", { children: ["Gifts by ", T(e.gift_deadline)] }),
									e.budget_isk != null && /* @__PURE__ */ R("span", { children: ["About ", D(e.budget_isk)] }),
									/* @__PURE__ */ R("span", { children: [e.participants, " signed up"] })
								]
							})
						]
					})
				})
			}, e.id))
		}),
		e && /* @__PURE__ */ L(H, {
			event: null,
			onClose: () => r(!1)
		})
	] });
}
//#endregion
//#region src/index.tsx
function le() {
	let { data: n, isLoading: r } = A({
		queryKey: ["secretsanta", "widget"],
		queryFn: () => C.get(`${z}/widget`),
		refetchInterval: 3e5
	});
	if (r) return /* @__PURE__ */ L(h, { className: "h-16" });
	if (!n?.event) return /* @__PURE__ */ L("p", {
		className: "text-sm text-subtle",
		children: "No Secret Santa right now."
	});
	let i = n.event, a = n.giving_to;
	return /* @__PURE__ */ R(M, {
		to: `/p/secretsanta/${i.id}`,
		className: "block space-y-2 hover:text-text",
		children: [/* @__PURE__ */ R("div", {
			className: "flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ L("span", {
				className: "truncate text-sm font-medium",
				children: i.name
			}), /* @__PURE__ */ L(t, {
				tone: B[i.phase].tone,
				children: B[i.phase].label
			})]
		}), a ? /* @__PURE__ */ R("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ L(e, {
				src: a.character?.portrait ?? null,
				name: a.character?.name ?? a.name,
				size: "md"
			}), /* @__PURE__ */ R("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ L("div", {
						className: "text-xs text-muted",
						children: "You're giving to"
					}),
					/* @__PURE__ */ L("div", {
						className: "truncate font-medium",
						children: a.character?.name ?? a.name
					}),
					/* @__PURE__ */ L("div", {
						className: "text-xs text-subtle",
						children: a.sent_at ? "Sent" : `Send by ${T(i.gift_deadline)}`
					})
				]
			})]
		}) : i.joined ? /* @__PURE__ */ L("p", {
			className: "text-xs text-muted",
			children: "You're in. You'll find out who you give to after the draw."
		}) : /* @__PURE__ */ R("p", {
			className: "text-xs text-muted",
			children: [
				"Sign up by ",
				T(i.signup_closes_at),
				"."
			]
		})]
	});
}
var ue = E({
	routes: [{
		path: "",
		Component: ce
	}, {
		path: ":id",
		Component: ne
	}],
	widgets: [{
		id: "current",
		title: "Secret Santa",
		Component: le,
		size: "sm",
		order: 30
	}]
});
//#endregion
export { ue as default };

export const classes = ["!data","!o","!open","!pairs","!second","@conduit/sdk","@tanstack/react-query","a","accent","act","action","actions","after","again","all","also","an","and","announce","apart","are","aria-label","aria-pressed","as","ask","audience","audit","autoFocus","away","background","be","been","bg-accent-soft","block","body","border","border-accent/60","border-border","browser","budget","budgetOk","budget_isk","but","button","by","call","can","canExclude","can_organise","can_withdraw","character","character_id","characters","checked","children","chosen","className","close","closed","closes","closing","color","confirm","confirmLabel","const","contract","create","created","current","currentColor","cx","cy","d","danger","data","datetime-local","days","deadline","decimal","default","del","delete","deleted","description","disabled","divide-border","divide-y","doesn","don","done","draw","drawn","drawn_at","e","each","edit","editing","else","end","ended","ended_at","err","error","event","events","every","everyone","exchange","exclusions","export","extends","eyebrow","few","fill","find","first","flex","flex-wrap","font-medium","font-semibold","footer","for","from","function","g","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-6","gap-x-4","gap-y-1","gave","get","gets","ghost","gift","gift_deadline","giftee","gifts","give","giver","gives","giving","giving_to","go","goes","got","grid","groups","h-16","h-40","h-64","h-fit","h-full","has","has_wishlist","hasn","height","here","hidden","hint","hover:border-border-strong","hover:text-text","how","icon","icons","id","if","import","in","info","inline","inline-flex","input","inputMode","interface","is","isLoading","isn","iso","it","items","items-center","items-end","items-start","its","join","joined","joined_at","justify-between","key","knows","label","leave","length","lg","lg:grid-cols-[1fr_320px]","line-clamp-2","list","ll","loading","locked","look","m12","m18","m21.854","maxLength","may","may_join","mb-1","mb-1.5","mb-2","mb-3","md","md:grid-cols-2","me","means","member","method","million","min-w-0","min-w-40","more","move","mr-auto","mt-2","must","mutationFn","my","my_gift","name","names","navigate","neutral","new","no","none","not","note","notes","notification","now","null","number","o","object","of","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpenChange","onSuccess","once","one","ones","open","options","or","order","organise_events","organiser","organisers","out","own","p","pad","pair","pairs","participants","patch","path","people","per","person","phase","picked","placeholder","portrait","post","primary","publish","published_at","put","px-2","px-3","py-1","py-2","qc","queryFn","queryKey","re","reaches","react","react-router","received","received_at","recorded","refetchInterval","reminder","reminders","remove","removed","removing","required","rest","results","return","reveal","reveal_all","right","rotate-45","round","routes","rows","running","rx","s","save","saved","saying","second","secondary","secretsanta","see","sees","self-center","send","sent","sent_at","sent_note","set","setCharacter","setConfirm","setCreating","setEditing","setFirst","setForm","setNote","setPairs","setRevealing","setSecond","setThanks","setWishlist","setWithdrawing","should","show","shown","shows","shrink-0","sign","sign-up","signed","signing","signup","signup_closes_at","since","site","size","size-1.5","size-4","sm","sm:grid-cols-2","so","someone","space-y-2","space-y-3","space-y-4","space-y-5","space-y-6","src","start","states","stays","still","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","such","t","taken","text-[13px]","text-lg","text-muted","text-right","text-sm","text-subtle","text-text","text-xs","thank-you","thanks","that","the","their","theirs","them","then","they","this","throws","time","title","to","toast","toggle","told","tone","took","transition-colors","truncate","two","type","typeof","undefined","under","until","up","url","useNavigate","useParams","useQuery","useQueryClient","useState","used","valid","value","variant","ve","viewBox","void","warning","was","way","were","what","when","whichever","while","whitespace-pre-wrap","who","whom","widget","widgets","width","wish","wishlist","withdrawn","without","x","xs","you","your"];
