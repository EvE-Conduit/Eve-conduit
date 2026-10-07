import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, Dialog as c, EmptyState as l, Field as u, Input as d, PageHeader as f, SearchInput as p, Segmented as m, Select as h, Skeleton as g, Switch as _, THead as v, Table as y, Td as b, Textarea as x, Th as S, Tr as C, api as w, cn as T, date as E, definePlugin as D, isk as ee, num as O, timeAgo as k, toast as A, useCurrentUser as j, useHasPerm as te } from "@conduit/sdk";
import { useMutation as M, useQuery as N, useQueryClient as P } from "@tanstack/react-query";
import { Link as F, useNavigate as ne, useParams as re } from "react-router";
import { useEffect as ie, useState as I } from "react";
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
		/* @__PURE__ */ R("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
		/* @__PURE__ */ R("circle", {
			cx: "9",
			cy: "7",
			r: "4"
		}),
		/* @__PURE__ */ R("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
		/* @__PURE__ */ R("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
	]
}), H = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "M20 6 9 17l-5-5" })
}), U = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M18 6 6 18" }), /* @__PURE__ */ R("path", { d: "m6 6 12 12" })]
}), W = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("rect", {
		width: "18",
		height: "11",
		x: "3",
		y: "11",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ R("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })]
}), G = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" }), /* @__PURE__ */ R("path", { d: "m21.854 2.147-10.94 10.939" })]
}), ae = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M18 11V6a2 2 0 0 0-4 0v5" }),
		/* @__PURE__ */ R("path", { d: "M14 10V4a2 2 0 0 0-4 0v6" }),
		/* @__PURE__ */ R("path", { d: "M10 10.5V6a2 2 0 0 0-4 0v8" }),
		/* @__PURE__ */ R("path", { d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" })
	]
}), oe = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ R("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ R("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), K = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M5 12h14" }), /* @__PURE__ */ R("path", { d: "M12 5v14" })]
}), q = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M3 6h18" }),
		/* @__PURE__ */ R("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ R("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), se = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "m18 15-6-6-6 6" })
}), ce = (e) => /* @__PURE__ */ R(B, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "m6 9 6 6 6-6" })
}), J = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }),
		/* @__PURE__ */ R("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }),
		/* @__PURE__ */ R("path", { d: "M10 9H8" }),
		/* @__PURE__ */ R("path", { d: "M16 13H8" }),
		/* @__PURE__ */ R("path", { d: "M16 17H8" })
	]
}), Y = (e) => /* @__PURE__ */ z(B, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ R("path", { d: "M19 12H5" })]
}), X = {
	new: {
		label: "New",
		tone: "info"
	},
	review: {
		label: "In review",
		tone: "accent"
	},
	accepted: {
		label: "Accepted",
		tone: "success"
	},
	rejected: {
		label: "Rejected",
		tone: "danger"
	},
	withdrawn: {
		label: "Withdrawn",
		tone: "neutral"
	}
}, Z = "/api/p/recruit";
//#endregion
//#region src/shared.tsx
function Q({ status: e }) {
	return /* @__PURE__ */ R(n, {
		tone: X[e].tone,
		children: X[e].label
	});
}
function le({ app: e }) {
	let t = e.status === "accepted" || e.status === "rejected" || e.status === "withdrawn", n = [
		{
			label: "Submitted",
			detail: k(e.created_at),
			done: !0
		},
		{
			label: "In review",
			detail: e.reviewer ? `with ${e.reviewer}` : "waiting for a recruiter",
			done: e.status !== "new"
		},
		{
			label: t ? X[e.status].label : "Decision",
			detail: e.decided_at ? k(e.decided_at) : "",
			done: t
		}
	];
	return /* @__PURE__ */ R("ol", {
		className: "grid grid-cols-3 gap-2",
		children: n.map((t, n) => /* @__PURE__ */ z("li", {
			className: T("border px-3 py-2.5", t.done ? n === 2 && e.status === "rejected" ? "border-danger/35 bg-danger-soft" : "border-success/35 bg-success-soft" : "border-border"),
			children: [/* @__PURE__ */ R("div", {
				className: T("text-sm font-medium", !t.done && "text-subtle"),
				children: t.label
			}), /* @__PURE__ */ R("div", {
				className: "truncate text-xs text-muted",
				children: t.detail
			})]
		}, n))
	});
}
function ue({ q: e, value: t, onChange: n }) {
	let r = /* @__PURE__ */ z("span", {
		className: "block text-[13px] font-medium text-text",
		children: [e.label, e.required && /* @__PURE__ */ R("span", {
			className: "ml-0.5 text-danger-fg",
			children: "*"
		})]
	}), i;
	return i = e.kind === "long" ? /* @__PURE__ */ R(x, {
		rows: 4,
		value: t ?? "",
		onChange: (e) => n(e.target.value)
	}) : e.kind === "yesno" ? /* @__PURE__ */ R(m, {
		value: t === !0 ? "yes" : t === !1 ? "no" : "",
		onChange: (e) => n(e === "yes" || e !== "no" && null),
		options: [{
			value: "yes",
			label: "Yes"
		}, {
			value: "no",
			label: "No"
		}],
		"aria-label": e.label
	}) : e.kind === "choice" ? /* @__PURE__ */ z(h, {
		value: t ?? "",
		onChange: (e) => n(e.target.value),
		className: "max-w-xs",
		children: [/* @__PURE__ */ R("option", {
			value: "",
			children: "Choose…"
		}), e.choices.map((e) => /* @__PURE__ */ R("option", {
			value: e,
			children: e
		}, e))]
	}) : /* @__PURE__ */ R(d, {
		value: t ?? "",
		onChange: (e) => n(e.target.value)
	}), /* @__PURE__ */ z("div", {
		className: "space-y-1.5",
		children: [
			r,
			e.help && /* @__PURE__ */ R("p", {
				className: "text-xs text-muted",
				children: e.help
			}),
			/* @__PURE__ */ R("div", { children: i })
		]
	});
}
function de({ value: e }) {
	return e === !0 ? /* @__PURE__ */ R("span", { children: "Yes" }) : e === !1 ? /* @__PURE__ */ R("span", { children: "No" }) : e == null || e === "" ? /* @__PURE__ */ R("span", {
		className: "text-subtle",
		children: "No answer"
	}) : /* @__PURE__ */ R("span", {
		className: "whitespace-pre-line",
		children: e
	});
}
var fe = {
	claimed: "took this application",
	accepted: "accepted the application",
	rejected: "rejected the application",
	withdrawn: "withdrew the application"
};
function pe({ comments: e, recruiter: i, onSend: a, disabled: o }) {
	let [s, c] = I(""), [l, u] = I(i), [d, f] = I(!1), p = async () => {
		if (s.trim()) {
			f(!0);
			try {
				await a(s, l), c("");
			} catch (e) {
				A.error(e instanceof Error ? e.message : "Couldn't send");
			} finally {
				f(!1);
			}
		}
	};
	return /* @__PURE__ */ z("div", {
		className: "space-y-4",
		children: [e.length === 0 ? /* @__PURE__ */ R("p", {
			className: "text-sm text-muted",
			children: i ? "No notes or messages yet." : "No messages yet. Recruiters may write to you here."
		}) : /* @__PURE__ */ R("ol", {
			className: "space-y-3",
			children: e.map((e) => e.event && fe[e.event] ? /* @__PURE__ */ z("li", {
				className: "flex items-center gap-2 text-xs text-muted",
				children: [
					/* @__PURE__ */ R("span", { className: "h-px flex-1 bg-border" }),
					/* @__PURE__ */ z("span", { children: [
						/* @__PURE__ */ R("span", {
							className: "font-medium text-text",
							children: e.author
						}),
						" ",
						fe[e.event],
						" · ",
						k(e.created_at),
						e.text && ![
							"Took this application",
							"Withdrew the application",
							"Accepted",
							"Rejected"
						].includes(e.text) && /* @__PURE__ */ z("span", {
							className: "block text-center italic",
							children: [
								"“",
								e.text,
								"”"
							]
						})
					] }),
					/* @__PURE__ */ R("span", { className: "h-px flex-1 bg-border" })
				]
			}, e.id) : /* @__PURE__ */ z("li", {
				className: T("flex gap-3 border p-3", e.internal ? "border-warning/30 bg-warning-soft/60" : "border-border bg-surface-2/60"),
				children: [/* @__PURE__ */ R(t, {
					src: e.portrait,
					name: e.author,
					size: "sm"
				}), /* @__PURE__ */ z("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ z("div", {
						className: "flex flex-wrap items-center gap-2 text-xs",
						children: [
							/* @__PURE__ */ R("span", {
								className: "font-medium text-text",
								children: e.author
							}),
							/* @__PURE__ */ R("span", {
								className: "text-subtle",
								children: k(e.created_at)
							}),
							e.internal && /* @__PURE__ */ z(n, {
								tone: "warning",
								children: [/* @__PURE__ */ R(W, { className: "size-3" }), " internal note"]
							})
						]
					}), /* @__PURE__ */ R("p", {
						className: "mt-1 whitespace-pre-line text-sm",
						children: e.text
					})]
				})]
			}, e.id))
		}), !o && /* @__PURE__ */ z("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ R(x, {
				rows: 3,
				value: s,
				onChange: (e) => c(e.target.value),
				placeholder: i ? l ? "A note for the other recruiters…" : "A message to the applicant…" : "Write to the recruiters…",
				onKeyDown: (e) => {
					e.key === "Enter" && (e.ctrlKey || e.metaKey) && p();
				}
			}), /* @__PURE__ */ z("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [i ? /* @__PURE__ */ z("label", {
					className: "inline-flex items-center gap-2 text-sm text-muted",
					children: [/* @__PURE__ */ R(_, {
						checked: l,
						onCheckedChange: u
					}), l ? "Internal note: only recruiters see it" : "Message: the applicant sees it"]
				}) : /* @__PURE__ */ R("span", {
					className: "text-xs text-subtle",
					children: "Ctrl+Enter sends"
				}), /* @__PURE__ */ z(r, {
					variant: l ? "secondary" : "primary",
					loading: d,
					disabled: !s.trim(),
					onClick: p,
					children: [
						!d && R(l ? W : G, {}),
						" ",
						l ? "Add note" : "Send"
					]
				})]
			})]
		})]
	});
}
//#endregion
//#region src/apply.tsx
var me = ["recruit", "me"];
function he() {
	let e = P(), t = j(), { data: n, isLoading: c } = N({
		queryKey: me,
		queryFn: () => w.get(`${Z}/me`)
	}), [u, d] = I(null), [p, m] = I({}), [h, _] = I(!1), v = () => e.invalidateQueries({ queryKey: me }), y = M({
		mutationFn: () => w.post(`${Z}/applications`, {
			form_id: u.id,
			answers: p
		}),
		onSuccess: () => {
			A.success("Application sent. The recruiters have been told."), d(null), m({}), v();
		},
		onError: (e) => A.error(e.message)
	});
	if (c || !n) return /* @__PURE__ */ R(g, { className: "h-64" });
	let b = n.current;
	return /* @__PURE__ */ z(L, { children: [
		/* @__PURE__ */ R(f, {
			eyebrow: "Recruitment",
			title: b ? "Your application" : u ? u.name : "Join us",
			icon: /* @__PURE__ */ R(V, {}),
			description: b ? "Follow your application here. Recruiters can see your characters while it's open, and may write to you." : u ? u.description || "Answer the questions below. Recruiters will see your characters once you apply." : `Welcome${t?.main ? `, ${t.main.name}` : ""}. Pick what you'd like to apply for.`,
			actions: n.is_recruiter ? /* @__PURE__ */ R(F, {
				to: "/p/recruit",
				children: /* @__PURE__ */ z(r, {
					variant: "ghost",
					children: [/* @__PURE__ */ R(V, {}), " Applications"]
				})
			}) : void 0
		}),
		!b && !u && /* @__PURE__ */ R(ge, { app: n.past[0] }),
		b ? /* @__PURE__ */ z("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_380px]",
			children: [
				/* @__PURE__ */ z("div", {
					className: "space-y-6",
					children: [/* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, {
						title: b.form.name,
						description: `Sent ${E(b.created_at)}`,
						actions: /* @__PURE__ */ R(Q, { status: b.status })
					}), /* @__PURE__ */ R(a, { children: /* @__PURE__ */ R(le, { app: b }) })] }), /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, {
						title: "Messages",
						description: "Between you and the recruiters."
					}), /* @__PURE__ */ R(a, { children: /* @__PURE__ */ R(pe, {
						comments: b.comments ?? [],
						recruiter: !1,
						onSend: (e) => w.post(`${Z}/applications/${b.id}/comments`, { text: e }).then(v)
					}) })] })]
				}),
				/* @__PURE__ */ z("div", {
					className: "space-y-6",
					children: [/* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, { title: "Your answers" }), /* @__PURE__ */ R(a, {
						className: "space-y-4 text-sm",
						children: (b.questions ?? []).map((e) => /* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R("div", {
							className: "text-xs text-muted",
							children: e.label
						}), /* @__PURE__ */ R(de, { value: e.answer })] }, e.id))
					})] }), /* @__PURE__ */ z(r, {
						variant: "ghost",
						className: "w-full text-danger-fg",
						onClick: () => _(!0),
						children: [/* @__PURE__ */ R(U, {}), " Withdraw application"]
					})]
				}),
				/* @__PURE__ */ R(s, {
					open: h,
					onOpenChange: _,
					title: "Withdraw your application?",
					description: "The recruiters are told and it's closed. You can apply again later.",
					danger: !0,
					confirmLabel: "Withdraw",
					onConfirm: () => w.post(`${Z}/applications/${b.id}/withdraw`).then(v)
				})
			]
		}) : u ? /* @__PURE__ */ R(i, {
			className: "max-w-3xl",
			children: /* @__PURE__ */ z(a, {
				className: "space-y-6",
				children: [
					u.questions.length === 0 && /* @__PURE__ */ R("p", {
						className: "text-sm text-muted",
						children: "No questions: just send it."
					}),
					u.questions.map((e) => /* @__PURE__ */ R(ue, {
						q: e,
						value: p[e.id],
						onChange: (t) => m((n) => ({
							...n,
							[e.id]: t
						}))
					}, e.id)),
					/* @__PURE__ */ z("div", {
						className: "flex items-center justify-between gap-3 border-t border-border pt-5",
						children: [/* @__PURE__ */ z(r, {
							variant: "ghost",
							onClick: () => d(null),
							children: [/* @__PURE__ */ R(Y, {}), " Back"]
						}), /* @__PURE__ */ z(r, {
							variant: "primary",
							loading: y.isPending,
							onClick: () => y.mutate(),
							children: [!y.isPending && /* @__PURE__ */ R(G, {}), " Send application"]
						})]
					})
				]
			})
		}) : n.forms.length === 0 ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(l, {
			icon: /* @__PURE__ */ R(V, {}),
			title: "Not recruiting right now",
			description: "Check back later, or ask someone in the corporation."
		}) }) : /* @__PURE__ */ R("div", {
			className: "grid gap-4 md:grid-cols-2",
			children: n.forms.map((e) => /* @__PURE__ */ R(i, {
				interactive: !0,
				children: /* @__PURE__ */ R("button", {
					type: "button",
					className: "block w-full p-card text-left",
					onClick: () => {
						d(e), m({});
					},
					children: /* @__PURE__ */ z("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ R("div", {
							className: "grid size-10 shrink-0 place-items-center border border-border-strong text-accent-ink",
							children: /* @__PURE__ */ R(J, { className: "size-5" })
						}), /* @__PURE__ */ z("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ R("div", {
									className: "font-medium",
									children: e.name
								}),
								e.description && /* @__PURE__ */ R("p", {
									className: "mt-1 line-clamp-3 text-sm text-muted",
									children: e.description
								}),
								/* @__PURE__ */ z("div", {
									className: "mt-2 text-xs text-subtle",
									children: [
										e.questions.length,
										" question",
										e.questions.length === 1 ? "" : "s"
									]
								})
							]
						})]
					})
				})
			}, e.id))
		}),
		n.past.length > 0 && /* @__PURE__ */ z(i, {
			className: "mt-6",
			children: [/* @__PURE__ */ R(o, { title: "Earlier applications" }), /* @__PURE__ */ R("ul", {
				className: "divide-y divide-border",
				children: n.past.map((e) => /* @__PURE__ */ z("li", {
					className: "flex items-center justify-between gap-3 px-card py-3 text-sm",
					children: [/* @__PURE__ */ R("span", { children: e.form.name }), /* @__PURE__ */ z("span", {
						className: "flex items-center gap-3 text-xs text-muted",
						children: [
							E(e.created_at),
							" ",
							/* @__PURE__ */ R(Q, { status: e.status })
						]
					})]
				}, e.id))
			})]
		})
	] });
}
function ge({ app: t }) {
	return !t?.decided_at || Date.now() - Date.parse(t.decided_at) > 2592e6 ? null : t.status === "accepted" ? /* @__PURE__ */ R(e, {
		tone: "success",
		className: "mb-6",
		title: `Welcome aboard! Your application to ${t.form.name} was accepted`,
		children: /* @__PURE__ */ R("span", {
			className: "whitespace-pre-line",
			children: t.decision_message || `Accepted ${E(t.decided_at)}.`
		})
	}) : t.status === "rejected" ? /* @__PURE__ */ R(e, {
		tone: "info",
		className: "mb-6",
		title: `Your application to ${t.form.name} wasn't accepted this time`,
		children: /* @__PURE__ */ R("span", {
			className: "whitespace-pre-line",
			children: t.decision_message || "You're welcome to apply again later."
		})
	}) : null;
}
//#endregion
//#region src/forms.tsx
var _e = [
	{
		value: "text",
		label: "Short answer"
	},
	{
		value: "long",
		label: "Long answer"
	},
	{
		value: "yesno",
		label: "Yes / no"
	},
	{
		value: "choice",
		label: "Pick one"
	}
], $ = {
	name: "",
	description: "",
	open: !0,
	order: 0,
	accept_groups: [],
	questions: [
		{
			id: "",
			label: "How did you hear about us?",
			help: "",
			kind: "text",
			choices: [],
			required: !1
		},
		{
			id: "",
			label: "What do you enjoy doing in EVE?",
			help: "PvP, industry, exploration, wormholes…",
			kind: "long",
			choices: [],
			required: !0
		},
		{
			id: "",
			label: "Which time zone do you mostly play in?",
			help: "",
			kind: "choice",
			choices: [
				"EU",
				"US",
				"AU / Asia"
			],
			required: !0
		},
		{
			id: "",
			label: "Can you use voice comms?",
			help: "",
			kind: "yesno",
			choices: [],
			required: !1
		}
	]
};
function ve() {
	let e = P(), { data: t, isLoading: o } = N({
		queryKey: ["recruit", "forms"],
		queryFn: () => w.get(`${Z}/forms`)
	}), [c, u] = I(null), [d, p] = I(null), m = () => e.invalidateQueries({ queryKey: ["recruit"] }), h = M({
		mutationFn: (e) => {
			let t = {
				...e,
				questions: e.questions.map(({ choicesText: e, ...t }) => ({
					...t,
					choices: t.kind === "choice" ? (e ?? t.choices.join("\n")).split("\n") : []
				}))
			};
			return e.id ? w.put(`${Z}/forms/${e.id}`, t) : w.post(`${Z}/forms`, t);
		},
		onSuccess: () => {
			A.success("Form saved"), u(null), m();
		},
		onError: (e) => A.error(e.message)
	}), v = M({
		mutationFn: (e) => w.put(`${Z}/forms/${e.id}`, {
			...e,
			open: !e.open,
			accept_groups: (e.accept_groups ?? []).map((e) => e.id)
		}),
		onSuccess: m,
		onError: (e) => A.error(e.message)
	}), y = (e) => u({
		id: e.id,
		name: e.name,
		description: e.description,
		open: e.open,
		order: e.order ?? 0,
		accept_groups: (e.accept_groups ?? []).map((e) => e.id),
		questions: e.questions.map((e) => ({ ...e }))
	});
	return /* @__PURE__ */ z(L, { children: [
		/* @__PURE__ */ z(F, {
			to: "/p/recruit",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ R(Y, {}), " Applications"]
		}),
		/* @__PURE__ */ R(f, {
			eyebrow: "Recruitment",
			title: "Forms",
			icon: /* @__PURE__ */ R(J, {}),
			description: "What applicants fill in. Each form can add accepted applicants to groups, e.g. one form per corporation.",
			actions: /* @__PURE__ */ z(r, {
				variant: "primary",
				onClick: () => u({
					...$,
					questions: $.questions.map((e) => ({ ...e }))
				}),
				children: [/* @__PURE__ */ R(K, {}), " New form"]
			})
		}),
		o || !t ? /* @__PURE__ */ R(g, { className: "h-40" }) : t.forms.length === 0 ? /* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(l, {
			icon: /* @__PURE__ */ R(J, {}),
			title: "No forms yet",
			description: "Make one so people can apply. It starts with a few example questions you can change."
		}) }) : /* @__PURE__ */ R("div", {
			className: "grid gap-4 md:grid-cols-2",
			children: t.forms.map((e) => /* @__PURE__ */ R(i, { children: /* @__PURE__ */ z(a, {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ z("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ z("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ R("div", {
								className: "font-medium",
								children: e.name
							}), e.description && /* @__PURE__ */ R("p", {
								className: "mt-1 line-clamp-2 text-sm text-muted",
								children: e.description
							})]
						}), /* @__PURE__ */ z("label", {
							className: "inline-flex shrink-0 items-center gap-2 text-xs text-muted",
							children: [e.open ? "Open" : "Closed", /* @__PURE__ */ R(_, {
								checked: e.open,
								onCheckedChange: () => v.mutate(e),
								"aria-label": `${e.name} is open`
							})]
						})]
					}),
					/* @__PURE__ */ z("div", {
						className: "flex flex-wrap gap-1.5",
						children: [
							/* @__PURE__ */ z(n, { children: [
								e.questions.length,
								" question",
								e.questions.length === 1 ? "" : "s"
							] }),
							/* @__PURE__ */ z(n, { children: [
								e.applications ?? 0,
								" application",
								e.applications === 1 ? "" : "s"
							] }),
							(e.accept_groups ?? []).map((e) => /* @__PURE__ */ z(n, {
								tone: "accent",
								children: ["+ ", e.name]
							}, e.id))
						]
					}),
					/* @__PURE__ */ z("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ R(r, {
							size: "sm",
							onClick: () => y(e),
							children: "Edit"
						}), !e.applications && /* @__PURE__ */ z(r, {
							size: "sm",
							variant: "ghost",
							className: "text-danger-fg",
							onClick: () => p(e),
							children: [/* @__PURE__ */ R(q, {}), " Delete"]
						})]
					})
				]
			}) }, e.id))
		}),
		c && t && /* @__PURE__ */ R(ye, {
			draft: c,
			setDraft: u,
			groups: t.groups,
			saving: h.isPending,
			onSave: () => h.mutate(c)
		}),
		/* @__PURE__ */ R(s, {
			open: !!d,
			onOpenChange: (e) => !e && p(null),
			title: `Delete ${d?.name}?`,
			danger: !0,
			confirmLabel: "Delete",
			onConfirm: () => w.delete(`${Z}/forms/${d.id}`).then(m)
		})
	] });
}
function ye({ draft: e, setDraft: t, groups: n, saving: i, onSave: a }) {
	let o = (n) => t({
		...e,
		...n
	}), s = (t, n) => o({ questions: e.questions.map((e, r) => r === t ? {
		...e,
		...n
	} : e) }), l = (t, n) => {
		let r = [...e.questions], [i] = r.splice(t, 1);
		r.splice(t + n, 0, i), o({ questions: r });
	};
	return /* @__PURE__ */ R(c, {
		open: !0,
		onOpenChange: (e) => !e && t(null),
		size: "xl",
		title: e.id ? `Edit ${e.name}` : "New form",
		footer: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(r, {
			variant: "ghost",
			onClick: () => t(null),
			children: "Cancel"
		}), /* @__PURE__ */ R(r, {
			variant: "primary",
			loading: i,
			onClick: a,
			children: "Save form"
		})] }),
		children: /* @__PURE__ */ z("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ z("div", {
					className: "grid gap-4 md:grid-cols-[1fr_auto]",
					children: [/* @__PURE__ */ R(u, {
						label: "Name",
						required: !0,
						children: /* @__PURE__ */ R(d, {
							value: e.name,
							onChange: (e) => o({ name: e.target.value }),
							placeholder: "Join Conduit Industries"
						})
					}), /* @__PURE__ */ z("label", {
						className: "inline-flex items-center gap-2 self-end pb-2 text-sm",
						children: [/* @__PURE__ */ R(_, {
							checked: e.open,
							onCheckedChange: (e) => o({ open: e })
						}), " Taking applications"]
					})]
				}),
				/* @__PURE__ */ R(u, {
					label: "Introduction",
					hint: "Shown above the questions: who you are, what you expect, what happens next.",
					children: /* @__PURE__ */ R(x, {
						rows: 3,
						value: e.description,
						onChange: (e) => o({ description: e.target.value })
					})
				}),
				/* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R("div", {
					className: "mb-1 text-[13px] font-medium",
					children: "When accepted, add them to"
				}), /* @__PURE__ */ z("div", {
					className: "flex flex-wrap gap-2",
					children: [n.length === 0 && /* @__PURE__ */ R("span", {
						className: "text-sm text-subtle",
						children: "No groups yet. Make them under Administration → Access."
					}), n.map((t) => {
						let n = e.accept_groups.includes(t.id);
						return /* @__PURE__ */ R("button", {
							type: "button",
							onClick: () => o({ accept_groups: n ? e.accept_groups.filter((e) => e !== t.id) : [...e.accept_groups, t.id] }),
							className: `border px-3 py-1.5 text-sm transition-colors ${n ? "border-accent bg-accent-soft text-text" : "border-border text-muted hover:border-accent/60"}`,
							"aria-pressed": n,
							children: t.name
						}, t.id);
					})]
				})] }),
				/* @__PURE__ */ z("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ R("div", {
							className: "text-[13px] font-medium",
							children: "Questions"
						}),
						e.questions.map((t, n) => /* @__PURE__ */ z("div", {
							className: "space-y-3 border border-border bg-surface-2/40 p-3",
							children: [
								/* @__PURE__ */ z("div", {
									className: "flex gap-2",
									children: [
										/* @__PURE__ */ R(d, {
											value: t.label,
											onChange: (e) => s(n, { label: e.target.value }),
											placeholder: "Question",
											className: "flex-1",
											"aria-label": `Question ${n + 1}`
										}),
										/* @__PURE__ */ R(h, {
											value: t.kind,
											onChange: (e) => s(n, { kind: e.target.value }),
											options: _e,
											className: "w-40",
											"aria-label": "Answer type"
										}),
										/* @__PURE__ */ R(r, {
											size: "icon-sm",
											variant: "ghost",
											disabled: n === 0,
											onClick: () => l(n, -1),
											"aria-label": "Move up",
											children: /* @__PURE__ */ R(se, {})
										}),
										/* @__PURE__ */ R(r, {
											size: "icon-sm",
											variant: "ghost",
											disabled: n === e.questions.length - 1,
											onClick: () => l(n, 1),
											"aria-label": "Move down",
											children: /* @__PURE__ */ R(ce, {})
										}),
										/* @__PURE__ */ R(r, {
											size: "icon-sm",
											variant: "ghost",
											className: "text-danger-fg",
											onClick: () => o({ questions: e.questions.filter((e, t) => t !== n) }),
											"aria-label": "Remove question",
											children: /* @__PURE__ */ R(q, {})
										})
									]
								}),
								/* @__PURE__ */ z("div", {
									className: "grid gap-3 md:grid-cols-[1fr_auto]",
									children: [/* @__PURE__ */ R(d, {
										value: t.help,
										onChange: (e) => s(n, { help: e.target.value }),
										placeholder: "Hint (optional)",
										className: "text-xs"
									}), /* @__PURE__ */ z("label", {
										className: "inline-flex items-center gap-2 text-xs text-muted",
										children: [/* @__PURE__ */ R(_, {
											checked: t.required,
											onCheckedChange: (e) => s(n, { required: e })
										}), " Required"]
									})]
								}),
								t.kind === "choice" && /* @__PURE__ */ R(x, {
									rows: 3,
									value: t.choicesText ?? t.choices.join("\n"),
									onChange: (e) => s(n, { choicesText: e.target.value }),
									placeholder: "One choice per line",
									className: "font-mono text-xs"
								})
							]
						}, n)),
						/* @__PURE__ */ z(r, {
							onClick: () => o({ questions: [...e.questions, {
								id: "",
								label: "",
								help: "",
								kind: "text",
								choices: [],
								required: !1
							}] }),
							children: [/* @__PURE__ */ R(K, {}), " Add question"]
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region src/review.tsx
var be = [
	{
		value: "open",
		label: "Open",
		count: "open"
	},
	{
		value: "mine",
		label: "Mine",
		count: "mine"
	},
	{
		value: "accepted",
		label: "Accepted",
		count: "accepted"
	},
	{
		value: "rejected",
		label: "Rejected",
		count: "rejected"
	},
	{
		value: "withdrawn",
		label: "Withdrawn",
		count: "withdrawn"
	}
];
function xe() {
	let e = ne(), n = te("recruit.manage_forms"), [a, o] = I("open"), [s, c] = I(""), [u, d] = I("");
	ie(() => {
		let e = setTimeout(() => d(s.trim()), 300);
		return () => clearTimeout(e);
	}, [s]);
	let { data: m, isLoading: h } = N({
		queryKey: [
			"recruit",
			"queue",
			a,
			u
		],
		queryFn: () => w.get(`${Z}/applications?status=${a}&q=${encodeURIComponent(u)}`),
		refetchInterval: 6e4
	});
	return /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(f, {
		eyebrow: "Recruitment",
		title: "Applications",
		icon: /* @__PURE__ */ R(V, {}),
		description: "People who want to join. Open one to see their answers and characters, talk to them, and accept or reject.",
		actions: n ? /* @__PURE__ */ R(F, {
			to: "/p/recruit/forms",
			children: /* @__PURE__ */ z(r, { children: [/* @__PURE__ */ R(J, {}), " Forms"] })
		}) : void 0
	}), /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ z("div", {
		className: "flex flex-wrap items-center gap-3 border-b border-border px-card py-3",
		children: [/* @__PURE__ */ R("div", {
			className: "flex flex-wrap gap-1",
			children: be.map((e) => /* @__PURE__ */ z("button", {
				type: "button",
				onClick: () => o(e.value),
				className: `inline-flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${a === e.value ? "bg-accent-soft text-text" : "text-muted hover:bg-hover hover:text-text"}`,
				children: [e.label, m && /* @__PURE__ */ R("span", {
					className: "font-mono text-[11px] text-subtle",
					children: m.counts[e.count]
				})]
			}, e.value))
		}), /* @__PURE__ */ R(p, {
			value: s,
			onChange: (e) => c(e.target.value),
			placeholder: "Find a pilot or form",
			className: "ml-auto w-64",
			"aria-label": "Search applications"
		})]
	}), h || !m ? /* @__PURE__ */ R("div", {
		className: "p-card",
		children: /* @__PURE__ */ R(g, { className: "h-40" })
	}) : m.items.length === 0 ? /* @__PURE__ */ R(l, {
		icon: /* @__PURE__ */ R(V, {}),
		title: a === "open" ? "No open applications" : "Nothing here",
		description: a === "open" ? "New applications show up here, and recruiters get a notification." : void 0
	}) : /* @__PURE__ */ z(y, { children: [/* @__PURE__ */ R(v, { children: /* @__PURE__ */ z("tr", { children: [
		/* @__PURE__ */ R(S, { children: "Applicant" }),
		/* @__PURE__ */ R(S, { children: "Form" }),
		/* @__PURE__ */ R(S, { children: "Status" }),
		/* @__PURE__ */ R(S, { children: "Recruiter" }),
		/* @__PURE__ */ R(S, {
			align: "right",
			children: "Applied"
		})
	] }) }), /* @__PURE__ */ R("tbody", { children: m.items.map((n) => /* @__PURE__ */ z(C, {
		interactive: !0,
		onClick: () => e(`/p/recruit/applications/${n.id}`),
		children: [
			/* @__PURE__ */ R(b, { children: /* @__PURE__ */ z("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ R(t, {
					src: n.user.portrait,
					name: n.user.name,
					size: "sm"
				}), /* @__PURE__ */ R("span", {
					className: "font-medium",
					children: n.user.name
				})]
			}) }),
			/* @__PURE__ */ R(b, {
				className: "text-muted",
				children: n.form.name
			}),
			/* @__PURE__ */ R(b, { children: /* @__PURE__ */ R(Q, { status: n.status }) }),
			/* @__PURE__ */ R(b, {
				className: "text-muted",
				children: n.reviewer ?? "—"
			}),
			/* @__PURE__ */ R(b, {
				align: "right",
				className: "text-xs text-muted",
				children: k(n.created_at)
			})
		]
	}, n.id)) })] })] })] });
}
function Se(e) {
	if (!e) return "—";
	let t = (Date.now() - Date.parse(e)) / 315576e5;
	return t >= 1 ? `${t.toFixed(1)} years` : `${Math.round(t * 12)} months`;
}
function Ce({ c: e }) {
	return /* @__PURE__ */ z("li", {
		className: "space-y-2 px-card py-3",
		children: [/* @__PURE__ */ z("div", {
			className: "flex items-center gap-3",
			children: [
				/* @__PURE__ */ R(t, {
					src: e.portrait,
					name: e.name,
					size: "md"
				}),
				/* @__PURE__ */ z("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ z("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ R("span", {
								className: "font-medium",
								children: e.name
							}),
							e.main && /* @__PURE__ */ R(n, {
								tone: "accent",
								children: "main"
							}),
							!e.login_ok && /* @__PURE__ */ R(n, {
								tone: "warning",
								children: "login expired"
							})
						]
					}), /* @__PURE__ */ R("div", {
						className: "truncate text-xs text-muted",
						children: [e.corporation, e.alliance].filter(Boolean).join(" · ") || "No corporation"
					})]
				}),
				/* @__PURE__ */ R(F, {
					to: `/characters/${e.id}`,
					target: "_blank",
					className: "text-subtle hover:text-text",
					"aria-label": `Open ${e.name}'s character sheet`,
					children: /* @__PURE__ */ R(oe, {})
				})
			]
		}), /* @__PURE__ */ z("dl", {
			className: "grid grid-cols-3 gap-x-3 gap-y-1 text-xs",
			children: [
				/* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R("dt", {
					className: "text-subtle",
					children: "Skill points"
				}), /* @__PURE__ */ R("dd", {
					className: "font-mono",
					children: e.total_sp == null ? "—" : `${(e.total_sp / 1e6).toFixed(1)}M`
				})] }),
				/* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R("dt", {
					className: "text-subtle",
					children: "Wallet"
				}), /* @__PURE__ */ R("dd", {
					className: "font-mono",
					children: e.wallet == null ? "—" : ee(e.wallet)
				})] }),
				/* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R("dt", {
					className: "text-subtle",
					children: "Age"
				}), /* @__PURE__ */ R("dd", {
					className: "font-mono",
					children: Se(e.birthday)
				})] }),
				/* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R("dt", {
					className: "text-subtle",
					children: "Security"
				}), /* @__PURE__ */ R("dd", {
					className: "font-mono",
					children: e.security_status == null ? "—" : e.security_status.toFixed(1)
				})] }),
				/* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R("dt", {
					className: "text-subtle",
					children: "Kills / losses"
				}), /* @__PURE__ */ z("dd", {
					className: "font-mono",
					children: [
						O(e.kills),
						" / ",
						O(e.losses)
					]
				})] })
			]
		})]
	});
}
function we() {
	let { id: e } = re(), t = P(), s = j(), d = [
		"recruit",
		"application",
		e
	], { data: p, isLoading: m, error: h } = N({
		queryKey: d,
		queryFn: () => w.get(`${Z}/applications/${e}`)
	}), [_, v] = I(null), [y, b] = I(""), S = (e) => {
		t.setQueryData(d, e), t.invalidateQueries({ queryKey: ["recruit", "queue"] });
	}, C = M({
		mutationFn: () => w.post(`${Z}/applications/${e}/claim`),
		onSuccess: S,
		onError: (e) => A.error(e.message)
	}), T = M({
		mutationFn: (t) => w.post(`${Z}/applications/${e}/decide`, {
			accept: t,
			message: y
		}),
		onSuccess: (e) => {
			S(e), v(null), b(""), A.success(e.status === "accepted" ? `${e.user.name} accepted` : `${e.user.name} rejected`);
		},
		onError: (e) => A.error(e.message)
	});
	if (h) return /* @__PURE__ */ R(l, {
		icon: /* @__PURE__ */ R(V, {}),
		title: "Application not found",
		action: /* @__PURE__ */ R(F, {
			to: "/p/recruit",
			children: /* @__PURE__ */ R(r, { children: "Back to applications" })
		})
	});
	if (m || !p) return /* @__PURE__ */ R(g, { className: "h-96" });
	let D = p.status === "new" || p.status === "review";
	return /* @__PURE__ */ z(L, { children: [
		/* @__PURE__ */ z(F, {
			to: "/p/recruit",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ R(Y, {}), " Applications"]
		}),
		/* @__PURE__ */ R(f, {
			eyebrow: p.form.name,
			title: p.user.name,
			description: `Applied ${E(p.created_at)}${p.reviewer ? ` · recruiter: ${p.reviewer}` : ""}`,
			icon: p.user.portrait ? /* @__PURE__ */ R("img", {
				src: p.user.portrait,
				alt: "",
				className: "size-full object-cover"
			}) : /* @__PURE__ */ R(V, {}),
			actions: D ? /* @__PURE__ */ z("div", {
				className: "flex flex-wrap gap-2",
				children: [
					p.reviewer_id !== s?.id && /* @__PURE__ */ z(r, {
						onClick: () => C.mutate(),
						loading: C.isPending,
						children: [
							!C.isPending && /* @__PURE__ */ R(ae, {}),
							" ",
							p.reviewer ? "Take over" : "Take it"
						]
					}),
					/* @__PURE__ */ z(r, {
						variant: "danger",
						onClick: () => v("reject"),
						children: [/* @__PURE__ */ R(U, {}), " Reject"]
					}),
					/* @__PURE__ */ z(r, {
						variant: "primary",
						onClick: () => v("accept"),
						children: [/* @__PURE__ */ R(H, {}), " Accept"]
					})
				]
			}) : /* @__PURE__ */ R(Q, { status: p.status })
		}),
		/* @__PURE__ */ z("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_420px]",
			children: [/* @__PURE__ */ z("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ R(i, { children: /* @__PURE__ */ R(a, { children: /* @__PURE__ */ R(le, { app: p }) }) }),
					/* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, { title: "Answers" }), /* @__PURE__ */ z(a, {
						className: "space-y-5 text-sm",
						children: [(p.questions ?? []).length === 0 && /* @__PURE__ */ R("p", {
							className: "text-muted",
							children: "This form has no questions."
						}), (p.questions ?? []).map((e) => /* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R("div", {
							className: "text-xs font-medium uppercase tracking-wider text-subtle",
							children: e.label
						}), /* @__PURE__ */ R("div", {
							className: "mt-1",
							children: /* @__PURE__ */ R(de, { value: e.answer })
						})] }, e.id))]
					})] }),
					/* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, {
						title: "Notes and messages",
						description: "Internal notes are only for recruiters; messages go to the applicant."
					}), /* @__PURE__ */ R(a, { children: /* @__PURE__ */ R(pe, {
						comments: p.comments ?? [],
						recruiter: !0,
						onSend: (t, n) => w.post(`${Z}/applications/${e}/comments`, {
							text: t,
							internal: n
						}).then(S)
					}) })] })
				]
			}), /* @__PURE__ */ z("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, {
						title: `Characters · ${p.characters?.length ?? 0}`,
						description: D ? "Their full character sheets are open to recruiters while the application is open." : "Character sheets closed with the application."
					}), /* @__PURE__ */ R("ul", {
						className: "divide-y divide-border",
						children: (p.characters ?? []).map((e) => /* @__PURE__ */ R(Ce, { c: e }, e.id))
					})] }),
					(p.accept_groups ?? []).length > 0 && /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, { title: "Accepting adds them to" }), /* @__PURE__ */ R(a, {
						className: "flex flex-wrap gap-1.5",
						children: p.accept_groups.map((e) => /* @__PURE__ */ R(n, { children: e }, e))
					})] }),
					(p.history ?? []).length > 0 && /* @__PURE__ */ z(i, { children: [/* @__PURE__ */ R(o, { title: "Earlier applications" }), /* @__PURE__ */ R("ul", {
						className: "divide-y divide-border",
						children: p.history.map((e) => /* @__PURE__ */ R("li", { children: /* @__PURE__ */ z(F, {
							to: `/p/recruit/applications/${e.id}`,
							className: "flex items-center justify-between gap-3 px-card py-3 text-sm hover:bg-hover",
							children: [/* @__PURE__ */ R("span", { children: e.form }), /* @__PURE__ */ z("span", {
								className: "flex items-center gap-3 text-xs text-muted",
								children: [
									E(e.created_at),
									" ",
									/* @__PURE__ */ R(Q, { status: e.status })
								]
							})]
						}) }, e.id))
					})] })
				]
			})]
		}),
		/* @__PURE__ */ R(c, {
			open: _ !== null,
			onOpenChange: (e) => !e && v(null),
			title: _ === "accept" ? `Accept ${p.user.name}?` : `Reject ${p.user.name}?`,
			description: _ === "accept" ? (p.accept_groups ?? []).length > 0 ? `They're added to ${p.accept_groups.join(", ")} and told straight away.` : "They're told straight away. This form adds them to no groups." : "They're told straight away. They can apply again later.",
			footer: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(r, {
				variant: "ghost",
				onClick: () => v(null),
				children: "Cancel"
			}), /* @__PURE__ */ R(r, {
				variant: _ === "accept" ? "primary" : "solidDanger",
				loading: T.isPending,
				onClick: () => T.mutate(_ === "accept"),
				children: _ === "accept" ? /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(H, {}), " Accept"] }) : /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(U, {}), " Reject"] })
			})] }),
			children: /* @__PURE__ */ R(u, {
				label: "Message to them (optional)",
				hint: "Sent with the notification and shown on their application.",
				children: /* @__PURE__ */ R(x, {
					rows: 3,
					value: y,
					onChange: (e) => b(e.target.value),
					placeholder: _ === "accept" ? "Welcome! Join the Discord and say hi in #new-members." : "Thanks for applying. We're looking for more experienced pilots right now."
				})
			})
		})
	] });
}
//#endregion
//#region src/index.tsx
function Te() {
	return te("recruit.review_applications") ? /* @__PURE__ */ R(xe, {}) : /* @__PURE__ */ R(he, {});
}
function Ee() {
	let { data: e, isLoading: t } = N({
		queryKey: [
			"recruit",
			"queue",
			"open",
			""
		],
		queryFn: () => w.get(`${Z}/applications?status=open`),
		refetchInterval: 12e4
	});
	if (t || !e) return /* @__PURE__ */ R(g, { className: "h-16" });
	let { open: r, new: i, mine: a } = e.counts;
	return /* @__PURE__ */ R(F, {
		to: "/p/recruit",
		className: "block",
		children: /* @__PURE__ */ z("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ z("div", { children: [
				/* @__PURE__ */ R("div", {
					className: "text-xs text-muted",
					children: "Open applications"
				}),
				/* @__PURE__ */ R("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: r
				}),
				/* @__PURE__ */ z("div", {
					className: "text-xs text-subtle",
					children: [a, " with you"]
				})
			] }), i > 0 ? /* @__PURE__ */ z(n, {
				tone: "info",
				children: [i, " new"]
			}) : /* @__PURE__ */ R(n, {
				tone: "success",
				children: "All picked up"
			})]
		})
	});
}
var De = D({
	routes: [
		{
			path: "",
			Component: Te
		},
		{
			path: "apply",
			Component: he
		},
		{
			path: "applications/:id",
			Component: we
		},
		{
			path: "forms",
			Component: ve
		}
	],
	widgets: [{
		id: "queue",
		title: "Recruitment",
		Component: Ee,
		size: "sm",
		order: 30,
		permission: "recruit.review_applications"
	}]
});
//#endregion
export { De as default };

export const classes = ["!data","!form","!o","@conduit/sdk","@tanstack/react-query","a","aboard!","about","above","accent","accept","accept_groups","accepted","action","actions","add","added","adds","after","again","align","alliance","also","alt","an","and","answer","answers","app","applicant","applicants","application","applications","apply","are","aria-label","aria-pressed","as","ask","async","author","author_id","await","back","been","bg-accent-soft","bg-border","bg-danger-soft","bg-success-soft","bg-surface-2/40","bg-surface-2/60","bg-warning-soft/60","birthday","block","body","boolean","border","border-accent","border-b","border-border","border-border-strong","border-danger/35","border-success/35","border-t","border-warning/30","both","but","button","by","c","can","canManage","catch","character","characters","checked","children","choice","choices","choicesText","claim","claimed","className","closed","comments","confirmLabel","const","control","conversation","corporation","count","counts","created_at","ctrlKey","current","currentColor","cx","cy","d","danger","data","decide","decided","decided_at","deciding","decision_message","default","description","detail","did","disabled","divide-border","divide-y","do","doing","done","down","draft","edit","else","enjoy","error","event","everyone","example","experienced","expired","export","eyebrow","false","few","field","fill","finally","flex","flex-1","flex-wrap","follow","font-medium","font-mono","font-semibold","footer","for","form","form_id","forms","found","from","full","function","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-6","gap-x-3","gap-y-1","get","ghost","go","grid","grid-cols-3","groups","h-16","h-40","h-64","h-96","h-px","happens","has","have","hear","height","help","here","hi","hint","history","hover:bg-hover","hover:border-accent/60","hover:text-text","i","icon","icon-sm","icons","id","if","import","in","info","inline","inline-flex","instanceof","interactive","interface","internal","is","isLoading","isPending","is_recruiter","it","italic","items","items-center","items-end","items-start","just","justify-between","key","keyof","kills","kind","label","land","latest","length","let","like","line","line-clamp-2","line-clamp-3","loading","login","login_ok","long","looking","losses","m12","m18","m21.854","m6","main","manage_forms","max-w-3xl","max-w-xs","may","mb-1","mb-4","mb-6","md","md:grid-cols-2","md:grid-cols-[1fr_auto]","me","message","messages","min-w-0","mine","ml-0.5","ml-auto","months","more","mostly","move","mt-1","mt-2","mt-6","mutationFn","n","name","navigate","neutral","never","new","no","none","not","note","notes","notification","now","null","number","object-cover","of","on","onChange","onCheckedChange","onClick","onConfirm","onError","onKeyDown","onOpenChange","onSave","onSend","onSuccess","once","one","only","open","options","or","order","other","over","p-3","p-card","past","patch","path","pb-2","people","per","permission","pick","picked","pilot","pilots","place-items-center","placeholder","play","points","portrait","post","primary","pt-5","px-3","px-card","py-1.5","py-2.5","py-3","q","qc","qs","queryFn","queryKey","question","questions","queue","re","react","react-router","recruit","recruiter","recruiters","recruiting","refetchInterval","refresh","reject","rejected","required","rest","return","review","review_applications","reviewer","reviewer_id","right","round","routes","row","rows","rx","ry","s","save","saved","saving","say","search","secondary","security_status","see","sees","self-end","send","sends","set","setAnswers","setBusy","setDeciding","setDeleting","setDraft","setForm","setInternal","setMessage","setQ","setSearch","setStatus","setText","setWithdrawing","sheet","sheets","show","shown","shrink-0","side","site","size","size-10","size-3","size-4","size-5","size-full","sm","so","solidDanger","someone","space-y-1.5","space-y-2","space-y-3","space-y-4","space-y-5","space-y-6","src","starts","status","steps","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","submit","success","t","tabular-nums","talk","target","text","text-3xl","text-[11px]","text-[13px]","text-accent-ink","text-center","text-danger-fg","text-left","text-muted","text-sm","text-subtle","text-text","text-xs","the","their","them","this","time","title","to","toast","toggle","told","tone","took","total_sp","tracking-wider","transition-colors","true","truncate","try","type","undefined","under","up","updated_at","uppercase","us","use","useHasPerm","useParams","useQuery","useQueryClient","useState","used","user","v","value","variant","viewBox","voice","void","w-40","w-64","w-full","waiting","wallet","want","warning","was","wasn","weeks","welcome","what","while","whitespace-pre-line","who","widgets","width","will","with","withdrawn","withdrew","write","x","xl","xl:grid-cols-[1fr_380px]","xl:grid-cols-[1fr_420px]","years","yes","yesno","yet","you","your","zone"];
