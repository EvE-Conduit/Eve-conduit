import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, Dialog as c, DiscordPings as l, EmptyState as u, Field as d, Input as f, PageHeader as p, SearchInput as m, Segmented as h, Select as g, Skeleton as _, Spinner as v, StatCard as y, Switch as b, THead as x, Table as S, Td as C, Textarea as w, Th as T, Tr as E, api as D, cn as O, date as k, definePlugin as ee, isk as te, num as ne, timeAgo as A, toast as j, useCurrentUser as M, useHasPerm as N } from "@conduit/sdk";
import { useMutation as P, useQuery as F, useQueryClient as I } from "@tanstack/react-query";
import { Link as L, useNavigate as re, useParams as ie } from "react-router";
import { useEffect as ae, useState as R } from "react";
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
var U = (e) => /* @__PURE__ */ V(H, {
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
}), W = (e) => /* @__PURE__ */ B(H, {
	...e,
	children: /* @__PURE__ */ B("path", { d: "M20 6 9 17l-5-5" })
}), G = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M18 6 6 18" }), /* @__PURE__ */ B("path", { d: "m6 6 12 12" })]
}), oe = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("rect", {
		width: "18",
		height: "11",
		x: "3",
		y: "11",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ B("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })]
}), se = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" }), /* @__PURE__ */ B("path", { d: "m21.854 2.147-10.94 10.939" })]
}), ce = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M18 11V6a2 2 0 0 0-4 0v5" }),
		/* @__PURE__ */ B("path", { d: "M14 10V4a2 2 0 0 0-4 0v6" }),
		/* @__PURE__ */ B("path", { d: "M10 10.5V6a2 2 0 0 0-4 0v8" }),
		/* @__PURE__ */ B("path", { d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" })
	]
}), le = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ B("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ B("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), K = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M5 12h14" }), /* @__PURE__ */ B("path", { d: "M12 5v14" })]
}), q = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M3 6h18" }),
		/* @__PURE__ */ B("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ B("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), ue = (e) => /* @__PURE__ */ B(H, {
	...e,
	children: /* @__PURE__ */ B("path", { d: "m18 15-6-6-6 6" })
}), de = (e) => /* @__PURE__ */ B(H, {
	...e,
	children: /* @__PURE__ */ B("path", { d: "m6 9 6 6 6-6" })
}), J = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }),
		/* @__PURE__ */ B("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }),
		/* @__PURE__ */ B("path", { d: "M10 9H8" }),
		/* @__PURE__ */ B("path", { d: "M16 13H8" }),
		/* @__PURE__ */ B("path", { d: "M16 17H8" })
	]
}), Y = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ B("path", { d: "M19 12H5" })]
}), fe = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" }), /* @__PURE__ */ B("circle", {
		cx: "12",
		cy: "8",
		r: "6"
	})]
}), pe = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ B("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
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
	return /* @__PURE__ */ B(n, {
		tone: X[e].tone,
		children: X[e].label
	});
}
function $({ app: e }) {
	let t = e.status === "accepted" || e.status === "rejected" || e.status === "withdrawn", n = [
		{
			label: "Submitted",
			detail: A(e.created_at),
			done: !0
		},
		{
			label: "In review",
			detail: e.reviewer ? `with ${e.reviewer}` : "waiting for a recruiter",
			done: e.status !== "new"
		},
		{
			label: t ? X[e.status].label : "Decision",
			detail: e.decided_at ? A(e.decided_at) : "",
			done: t
		}
	];
	return /* @__PURE__ */ B("ol", {
		className: "grid grid-cols-3 gap-2",
		children: n.map((t, n) => /* @__PURE__ */ V("li", {
			className: O("border px-3 py-2.5", t.done ? n === 2 && e.status === "rejected" ? "border-danger/35 bg-danger-soft" : "border-success/35 bg-success-soft" : "border-border"),
			children: [/* @__PURE__ */ B("div", {
				className: O("text-sm font-medium", !t.done && "text-subtle"),
				children: t.label
			}), /* @__PURE__ */ B("div", {
				className: "truncate text-xs text-muted",
				children: t.detail
			})]
		}, n))
	});
}
function me({ q: e, value: t, onChange: n }) {
	let r = /* @__PURE__ */ V("span", {
		className: "block text-[13px] font-medium text-text",
		children: [e.label, e.required && /* @__PURE__ */ B("span", {
			className: "ml-0.5 text-danger-fg",
			children: "*"
		})]
	}), i;
	return i = e.kind === "long" ? /* @__PURE__ */ B(w, {
		rows: 4,
		value: t ?? "",
		onChange: (e) => n(e.target.value)
	}) : e.kind === "yesno" ? /* @__PURE__ */ B(h, {
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
	}) : e.kind === "choice" ? /* @__PURE__ */ V(g, {
		value: t ?? "",
		onChange: (e) => n(e.target.value),
		className: "max-w-xs",
		children: [/* @__PURE__ */ B("option", {
			value: "",
			children: "Choose…"
		}), e.choices.map((e) => /* @__PURE__ */ B("option", {
			value: e,
			children: e
		}, e))]
	}) : /* @__PURE__ */ B(f, {
		value: t ?? "",
		onChange: (e) => n(e.target.value)
	}), /* @__PURE__ */ V("div", {
		className: "space-y-1.5",
		children: [
			r,
			e.help && /* @__PURE__ */ B("p", {
				className: "text-xs text-muted",
				children: e.help
			}),
			/* @__PURE__ */ B("div", { children: i })
		]
	});
}
function he({ value: e }) {
	return e === !0 ? /* @__PURE__ */ B("span", { children: "Yes" }) : e === !1 ? /* @__PURE__ */ B("span", { children: "No" }) : e == null || e === "" ? /* @__PURE__ */ B("span", {
		className: "text-subtle",
		children: "No answer"
	}) : /* @__PURE__ */ B("span", {
		className: "whitespace-pre-line",
		children: e
	});
}
var ge = {
	claimed: "took this application",
	accepted: "accepted the application",
	rejected: "rejected the application",
	withdrawn: "withdrew the application"
};
function _e({ comments: e, recruiter: i, onSend: a, disabled: o }) {
	let [s, c] = R(""), [l, u] = R(i), [d, f] = R(!1), p = async () => {
		if (s.trim()) {
			f(!0);
			try {
				await a(s, l), c("");
			} catch (e) {
				j.error(e instanceof Error ? e.message : "Couldn't send");
			} finally {
				f(!1);
			}
		}
	};
	return /* @__PURE__ */ V("div", {
		className: "space-y-4",
		children: [e.length === 0 ? /* @__PURE__ */ B("p", {
			className: "text-sm text-muted",
			children: i ? "No notes or messages yet." : "No messages yet. Recruiters may write to you here."
		}) : /* @__PURE__ */ B("ol", {
			className: "space-y-3",
			children: e.map((e) => e.event && ge[e.event] ? /* @__PURE__ */ V("li", {
				className: "flex items-center gap-2 text-xs text-muted",
				children: [
					/* @__PURE__ */ B("span", { className: "h-px flex-1 bg-border" }),
					/* @__PURE__ */ V("span", { children: [
						/* @__PURE__ */ B("span", {
							className: "font-medium text-text",
							children: e.author
						}),
						" ",
						ge[e.event],
						" · ",
						A(e.created_at),
						e.text && ![
							"Took this application",
							"Withdrew the application",
							"Accepted",
							"Rejected"
						].includes(e.text) && /* @__PURE__ */ V("span", {
							className: "block text-center italic",
							children: [
								"“",
								e.text,
								"”"
							]
						})
					] }),
					/* @__PURE__ */ B("span", { className: "h-px flex-1 bg-border" })
				]
			}, e.id) : /* @__PURE__ */ V("li", {
				className: O("flex gap-3 border p-3", e.internal ? "border-warning/30 bg-warning-soft/60" : "border-border bg-surface-2/60"),
				children: [/* @__PURE__ */ B(t, {
					src: e.portrait,
					name: e.author,
					size: "sm"
				}), /* @__PURE__ */ V("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ V("div", {
						className: "flex flex-wrap items-center gap-2 text-xs",
						children: [
							/* @__PURE__ */ B("span", {
								className: "font-medium text-text",
								children: e.author
							}),
							/* @__PURE__ */ B("span", {
								className: "text-subtle",
								children: A(e.created_at)
							}),
							e.internal && /* @__PURE__ */ V(n, {
								tone: "warning",
								children: [/* @__PURE__ */ B(oe, { className: "size-3" }), " internal note"]
							})
						]
					}), /* @__PURE__ */ B("p", {
						className: "mt-1 whitespace-pre-line text-sm",
						children: e.text
					})]
				})]
			}, e.id))
		}), !o && /* @__PURE__ */ V("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ B(w, {
				rows: 3,
				value: s,
				onChange: (e) => c(e.target.value),
				placeholder: i ? l ? "A note for the other recruiters…" : "A message to the applicant…" : "Write to the recruiters…",
				onKeyDown: (e) => {
					e.key === "Enter" && (e.ctrlKey || e.metaKey) && p();
				}
			}), /* @__PURE__ */ V("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [i ? /* @__PURE__ */ V("label", {
					className: "inline-flex items-center gap-2 text-sm text-muted",
					children: [/* @__PURE__ */ B(b, {
						checked: l,
						onCheckedChange: u
					}), l ? "Internal note: only recruiters see it" : "Message: the applicant sees it"]
				}) : /* @__PURE__ */ B("span", {
					className: "text-xs text-subtle",
					children: "Ctrl+Enter sends"
				}), /* @__PURE__ */ V(r, {
					variant: l ? "secondary" : "primary",
					loading: d,
					disabled: !s.trim(),
					onClick: p,
					children: [
						!d && B(l ? oe : se, {}),
						" ",
						l ? "Add note" : "Send"
					]
				})]
			})]
		})]
	});
}
//#endregion
//#region src/referrals.tsx
function ve({ value: e, onChange: n }) {
	let [r, i] = R(""), [a, o] = R(""), [s, c] = R(!1), [l, u] = R(0);
	ae(() => {
		let e = setTimeout(() => o(r.trim()), 250);
		return () => clearTimeout(e);
	}, [r]);
	let { data: d, isLoading: p } = F({
		queryKey: [
			"recruit",
			"referrers",
			a
		],
		queryFn: () => D.get(`${Z}/referrers?q=${encodeURIComponent(a)}`),
		enabled: a.length >= 3
	}), m = d ?? [], h = (e) => {
		n(e), i(""), c(!1);
	};
	return /* @__PURE__ */ V("div", {
		className: "space-y-1.5",
		children: [
			/* @__PURE__ */ B("span", {
				className: "block text-[13px] font-medium text-text",
				children: "Who referred you?"
			}),
			/* @__PURE__ */ B("p", {
				className: "text-xs text-muted",
				children: "Optional. Type at least three letters of the name of the member who brought you here."
			}),
			e ? /* @__PURE__ */ V("div", {
				className: "inline-flex items-center gap-2 border border-border bg-surface-2/60 py-1 pl-1 pr-1.5 text-sm",
				children: [
					/* @__PURE__ */ B(t, {
						src: e.portrait,
						name: e.name,
						size: "sm"
					}),
					/* @__PURE__ */ B("span", {
						className: "font-medium",
						children: e.name
					}),
					/* @__PURE__ */ B("button", {
						type: "button",
						onClick: () => n(null),
						className: "p-0.5 text-subtle hover:text-text",
						"aria-label": `Remove ${e.name}`,
						children: /* @__PURE__ */ B(G, { className: "size-3.5" })
					})
				]
			}) : /* @__PURE__ */ V("div", {
				className: "relative max-w-sm",
				children: [/* @__PURE__ */ B(f, {
					value: r,
					onChange: (e) => {
						i(e.target.value), c(!0), u(0);
					},
					onFocus: () => c(!0),
					onBlur: () => c(!1),
					onKeyDown: (e) => {
						if (m.length) {
							if (e.key === "ArrowDown") u((e) => (e + 1) % m.length);
							else if (e.key === "ArrowUp") u((e) => (e - 1 + m.length) % m.length);
							else if (e.key === "Enter") h(m[Math.min(l, m.length - 1)]);
							else return;
							e.preventDefault();
						}
					},
					placeholder: "Character name",
					autoComplete: "off",
					role: "combobox",
					"aria-expanded": s && a.length >= 3
				}), s && a.length >= 3 && /* @__PURE__ */ B("div", {
					className: "absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto border border-border-strong bg-surface-raised p-1 shadow-e3",
					role: "listbox",
					children: p ? /* @__PURE__ */ B(v, { className: "px-2 py-1.5" }) : m.length === 0 ? /* @__PURE__ */ B("div", {
						className: "px-2 py-1.5 text-xs text-subtle",
						children: "No member by that name."
					}) : m.map((e, n) => /* @__PURE__ */ V("button", {
						type: "button",
						role: "option",
						"aria-selected": n === l,
						onMouseDown: (t) => {
							t.preventDefault(), h(e);
						},
						onMouseEnter: () => u(n),
						className: O("flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm", n === l && "bg-hover"),
						children: [/* @__PURE__ */ B(t, {
							src: e.portrait,
							name: e.name,
							size: "xs"
						}), /* @__PURE__ */ B("span", {
							className: "flex-1 truncate",
							children: e.name
						})]
					}, e.id))
				})]
			})
		]
	});
}
function ye() {
	let { data: e, isLoading: n } = F({
		queryKey: ["recruit", "referrals"],
		queryFn: () => D.get(`${Z}/referrals`)
	});
	return /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(p, {
		eyebrow: "Recruitment",
		title: "Your referrals",
		icon: /* @__PURE__ */ B(fe, {}),
		description: "People who named you as their referrer when they applied."
	}), n || !e ? /* @__PURE__ */ B(_, { className: "h-64" }) : /* @__PURE__ */ V("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ V("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ B(y, {
					label: "Recruited",
					value: e.recruited,
					icon: /* @__PURE__ */ B(W, {}),
					tone: "success",
					hint: e.recruited === 1 ? "pilot accepted" : "pilots accepted"
				}),
				/* @__PURE__ */ B(y, {
					label: "Referred",
					value: e.referred,
					icon: /* @__PURE__ */ B(U, {}),
					hint: e.referred === 1 ? "pilot named you" : "pilots named you"
				}),
				/* @__PURE__ */ B(y, {
					label: "In progress",
					value: e.in_progress,
					hint: "waiting for a decision"
				}),
				/* @__PURE__ */ B(y, {
					label: "Not accepted",
					value: e.not_accepted,
					hint: "rejected or withdrawn"
				})
			]
		}), /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, { title: "Referrals" }), e.referrals.length === 0 ? /* @__PURE__ */ B(u, {
			icon: /* @__PURE__ */ B(fe, {}),
			title: "No referrals yet",
			description: "When someone you bring in applies, they can name you as their referrer and they'll show up here."
		}) : /* @__PURE__ */ V(S, { children: [/* @__PURE__ */ B(x, { children: /* @__PURE__ */ V("tr", { children: [
			/* @__PURE__ */ B(T, { children: "Pilot" }),
			/* @__PURE__ */ B(T, { children: "Form" }),
			/* @__PURE__ */ B(T, { children: "Status" }),
			/* @__PURE__ */ B(T, {
				align: "right",
				children: "Applied"
			})
		] }) }), /* @__PURE__ */ B("tbody", { children: e.referrals.map((e) => /* @__PURE__ */ V(E, { children: [
			/* @__PURE__ */ B(C, { children: /* @__PURE__ */ V("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ B(t, {
					src: e.user.portrait,
					name: e.user.name,
					size: "sm"
				}), /* @__PURE__ */ B("span", {
					className: "font-medium",
					children: e.user.name
				})]
			}) }),
			/* @__PURE__ */ B(C, {
				className: "text-muted",
				children: e.form
			}),
			/* @__PURE__ */ B(C, { children: /* @__PURE__ */ B(Q, { status: e.status }) }),
			/* @__PURE__ */ B(C, {
				align: "right",
				className: "text-xs text-muted",
				children: k(e.created_at)
			})
		] }, e.id)) })] })] })]
	})] });
}
//#endregion
//#region src/apply.tsx
var be = ["recruit", "me"];
function xe() {
	let e = I(), t = M(), { data: n, isLoading: c, isFetching: l, refetch: d } = F({
		queryKey: be,
		queryFn: () => D.get(`${Z}/me`)
	}), [f, m] = R(null), [h, g] = R({}), [v, y] = R(null), [b, x] = R(!1), S = () => e.invalidateQueries({ queryKey: be }), C = P({
		mutationFn: () => D.post(`${Z}/applications`, {
			form_id: f.id,
			answers: h,
			referrer_id: v?.id ?? null
		}),
		onSuccess: () => {
			j.success("Application sent. The recruiters have been told."), m(null), g({}), y(null), S();
		},
		onError: (e) => j.error(e.message)
	});
	if (c || !n) return /* @__PURE__ */ B(_, { className: "h-64" });
	let w = n.current, T = !!f && !!n.discord && !n.discord.ok;
	return /* @__PURE__ */ V(z, { children: [
		/* @__PURE__ */ B(p, {
			eyebrow: "Recruitment",
			title: w ? "Your application" : f ? f.name : "Join us",
			icon: /* @__PURE__ */ B(U, {}),
			description: w ? "Follow your application here. Recruiters can see your characters while it's open, and may write to you." : f ? f.description || "Answer the questions below. Recruiters will see your characters once you apply." : `Welcome${t?.main ? `, ${t.main.name}` : ""}. Pick what you'd like to apply for.`,
			actions: n.is_recruiter ? /* @__PURE__ */ B(L, {
				to: "/p/recruit",
				children: /* @__PURE__ */ V(r, {
					variant: "ghost",
					children: [/* @__PURE__ */ B(U, {}), " Applications"]
				})
			}) : void 0
		}),
		!w && !f && /* @__PURE__ */ B(Ce, { app: n.past[0] }),
		w ? /* @__PURE__ */ V("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_380px]",
			children: [
				/* @__PURE__ */ V("div", {
					className: "space-y-6",
					children: [/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, {
						title: w.form.name,
						description: `Sent ${k(w.created_at)}`,
						actions: /* @__PURE__ */ B(Q, { status: w.status })
					}), /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B($, { app: w }) })] }), /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, {
						title: "Messages",
						description: "Between you and the recruiters."
					}), /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(_e, {
						comments: w.comments ?? [],
						recruiter: !1,
						onSend: (e) => D.post(`${Z}/applications/${w.id}/comments`, { text: e }).then(S)
					}) })] })]
				}),
				/* @__PURE__ */ V("div", {
					className: "space-y-6",
					children: [/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, { title: "Your answers" }), /* @__PURE__ */ V(a, {
						className: "space-y-4 text-sm",
						children: [(w.questions ?? []).map((e) => /* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("div", {
							className: "text-xs text-muted",
							children: e.label
						}), /* @__PURE__ */ B(he, { value: e.answer })] }, e.id)), w.referrer && /* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("div", {
							className: "text-xs text-muted",
							children: "Referred by"
						}), /* @__PURE__ */ B("span", { children: w.referrer.name })] })]
					})] }), /* @__PURE__ */ V(r, {
						variant: "ghost",
						className: "w-full text-danger-fg",
						onClick: () => x(!0),
						children: [/* @__PURE__ */ B(G, {}), " Withdraw application"]
					})]
				}),
				/* @__PURE__ */ B(s, {
					open: b,
					onOpenChange: x,
					title: "Withdraw your application?",
					description: "The recruiters are told and it's closed. You can apply again later.",
					danger: !0,
					confirmLabel: "Withdraw",
					onConfirm: () => D.post(`${Z}/applications/${w.id}/withdraw`).then(S)
				})
			]
		}) : f ? /* @__PURE__ */ B(i, {
			className: "max-w-3xl",
			children: /* @__PURE__ */ V(a, {
				className: "space-y-6",
				children: [
					T && /* @__PURE__ */ B(Se, {
						status: n.discord,
						checking: l,
						onCheck: () => d()
					}),
					f.questions.length === 0 && /* @__PURE__ */ B("p", {
						className: "text-sm text-muted",
						children: "No questions: just send it."
					}),
					f.questions.map((e) => /* @__PURE__ */ B(me, {
						q: e,
						value: h[e.id],
						onChange: (t) => g((n) => ({
							...n,
							[e.id]: t
						}))
					}, e.id)),
					/* @__PURE__ */ B(ve, {
						value: v,
						onChange: y
					}),
					/* @__PURE__ */ V("div", {
						className: "flex items-center justify-between gap-3 border-t border-border pt-5",
						children: [/* @__PURE__ */ V(r, {
							variant: "ghost",
							onClick: () => m(null),
							children: [/* @__PURE__ */ B(Y, {}), " Back"]
						}), /* @__PURE__ */ V(r, {
							variant: "primary",
							loading: C.isPending,
							disabled: T,
							onClick: () => C.mutate(),
							children: [!C.isPending && /* @__PURE__ */ B(se, {}), " Send application"]
						})]
					})
				]
			})
		}) : n.forms.length === 0 ? /* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(u, {
			icon: /* @__PURE__ */ B(U, {}),
			title: "Not recruiting right now",
			description: "Check back later, or ask someone in the corporation."
		}) }) : /* @__PURE__ */ B("div", {
			className: "grid gap-4 md:grid-cols-2",
			children: n.forms.map((e) => /* @__PURE__ */ B(i, {
				interactive: !0,
				children: /* @__PURE__ */ B("button", {
					type: "button",
					className: "block w-full p-card text-left",
					onClick: () => {
						m(e), g({});
					},
					children: /* @__PURE__ */ V("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ B("div", {
							className: "grid size-10 shrink-0 place-items-center border border-border-strong text-accent-ink",
							children: /* @__PURE__ */ B(J, { className: "size-5" })
						}), /* @__PURE__ */ V("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ B("div", {
									className: "font-medium",
									children: e.name
								}),
								e.description && /* @__PURE__ */ B("p", {
									className: "mt-1 line-clamp-3 text-sm text-muted",
									children: e.description
								}),
								/* @__PURE__ */ V("div", {
									className: "mt-2 text-xs text-subtle",
									children: [
										e.questions.length,
										" question",
										e.questions.length === 1 ? "" : "s",
										n.discord && " · needs Discord"
									]
								})
							]
						})]
					})
				})
			}, e.id))
		}),
		n.past.length > 0 && /* @__PURE__ */ V(i, {
			className: "mt-6",
			children: [/* @__PURE__ */ B(o, { title: "Earlier applications" }), /* @__PURE__ */ B("ul", {
				className: "divide-y divide-border",
				children: n.past.map((e) => /* @__PURE__ */ V("li", {
					className: "flex items-center justify-between gap-3 px-card py-3 text-sm",
					children: [/* @__PURE__ */ B("span", { children: e.form.name }), /* @__PURE__ */ V("span", {
						className: "flex items-center gap-3 text-xs text-muted",
						children: [
							k(e.created_at),
							" ",
							/* @__PURE__ */ B(Q, { status: e.status })
						]
					})]
				}, e.id))
			})]
		})
	] });
}
function Se({ status: t, checking: n, onCheck: i }) {
	let a = t.error ? "We couldn't check your Discord" : t.linked ? "Join our Discord server first" : "Link your Discord account first", o = t.error ? t.error : t.linked ? `Your Discord account ${t.username ?? ""} is linked but isn't on our server. Join it from the Discord page, then come back.` : "This application needs your Discord account linked and you on our server. Link it on the Discord page, then come back.";
	return /* @__PURE__ */ V(e, {
		tone: "warning",
		title: a,
		children: [/* @__PURE__ */ B("p", { children: o }), /* @__PURE__ */ V("div", {
			className: "mt-3 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ B(L, {
				to: "/p/discord",
				children: /* @__PURE__ */ V(r, {
					size: "sm",
					variant: "outline",
					children: [/* @__PURE__ */ B(le, {}), " Go to Discord"]
				})
			}), /* @__PURE__ */ B(r, {
				size: "sm",
				variant: "ghost",
				loading: n,
				onClick: i,
				children: "Check again"
			})]
		})]
	});
}
function Ce({ app: t }) {
	return !t?.decided_at || Date.now() - Date.parse(t.decided_at) > 2592e6 ? null : t.status === "accepted" ? /* @__PURE__ */ B(e, {
		tone: "success",
		className: "mb-6",
		title: `Welcome aboard! Your application to ${t.form.name} was accepted`,
		children: /* @__PURE__ */ B("span", {
			className: "whitespace-pre-line",
			children: t.decision_message || `Accepted ${k(t.decided_at)}.`
		})
	}) : t.status === "rejected" ? /* @__PURE__ */ B(e, {
		tone: "info",
		className: "mb-6",
		title: `Your application to ${t.form.name} wasn't accepted this time`,
		children: /* @__PURE__ */ B("span", {
			className: "whitespace-pre-line",
			children: t.decision_message || "You're welcome to apply again later."
		})
	}) : null;
}
//#endregion
//#region src/forms.tsx
var we = [
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
], Te = {
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
function Ee() {
	let e = I(), { data: t, isLoading: o } = F({
		queryKey: ["recruit", "forms"],
		queryFn: () => D.get(`${Z}/forms`)
	}), [c, l] = R(null), [d, f] = R(null), m = () => e.invalidateQueries({ queryKey: ["recruit"] }), h = P({
		mutationFn: (e) => {
			let t = {
				...e,
				questions: e.questions.map(({ choicesText: e, ...t }) => ({
					...t,
					choices: t.kind === "choice" ? (e ?? t.choices.join("\n")).split("\n") : []
				}))
			};
			return e.id ? D.put(`${Z}/forms/${e.id}`, t) : D.post(`${Z}/forms`, t);
		},
		onSuccess: () => {
			j.success("Form saved"), l(null), m();
		},
		onError: (e) => j.error(e.message)
	}), g = P({
		mutationFn: (e) => D.put(`${Z}/forms/${e.id}`, {
			...e,
			open: !e.open,
			accept_groups: (e.accept_groups ?? []).map((e) => e.id)
		}),
		onSuccess: m,
		onError: (e) => j.error(e.message)
	}), v = (e) => l({
		id: e.id,
		name: e.name,
		description: e.description,
		open: e.open,
		order: e.order ?? 0,
		accept_groups: (e.accept_groups ?? []).map((e) => e.id),
		questions: e.questions.map((e) => ({ ...e }))
	});
	return /* @__PURE__ */ V(z, { children: [
		/* @__PURE__ */ V(L, {
			to: "/p/recruit",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ B(Y, {}), " Applications"]
		}),
		/* @__PURE__ */ B(p, {
			eyebrow: "Recruitment",
			title: "Forms",
			icon: /* @__PURE__ */ B(J, {}),
			description: "What applicants fill in. Each form can add accepted applicants to groups, e.g. one form per corporation.",
			actions: /* @__PURE__ */ V(r, {
				variant: "primary",
				onClick: () => l({
					...Te,
					questions: Te.questions.map((e) => ({ ...e }))
				}),
				children: [/* @__PURE__ */ B(K, {}), " New form"]
			})
		}),
		o || !t ? /* @__PURE__ */ B(_, { className: "h-40" }) : t.forms.length === 0 ? /* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(u, {
			icon: /* @__PURE__ */ B(J, {}),
			title: "No forms yet",
			description: "Make one so people can apply. It starts with a few example questions you can change."
		}) }) : /* @__PURE__ */ B("div", {
			className: "grid gap-4 md:grid-cols-2",
			children: t.forms.map((e) => /* @__PURE__ */ B(i, { children: /* @__PURE__ */ V(a, {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ V("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ V("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ B("div", {
								className: "font-medium",
								children: e.name
							}), e.description && /* @__PURE__ */ B("p", {
								className: "mt-1 line-clamp-2 text-sm text-muted",
								children: e.description
							})]
						}), /* @__PURE__ */ V("label", {
							className: "inline-flex shrink-0 items-center gap-2 text-xs text-muted",
							children: [e.open ? "Open" : "Closed", /* @__PURE__ */ B(b, {
								checked: e.open,
								onCheckedChange: () => g.mutate(e),
								"aria-label": `${e.name} is open`
							})]
						})]
					}),
					/* @__PURE__ */ V("div", {
						className: "flex flex-wrap gap-1.5",
						children: [
							/* @__PURE__ */ V(n, { children: [
								e.questions.length,
								" question",
								e.questions.length === 1 ? "" : "s"
							] }),
							/* @__PURE__ */ V(n, { children: [
								e.applications ?? 0,
								" application",
								e.applications === 1 ? "" : "s"
							] }),
							(e.accept_groups ?? []).map((e) => /* @__PURE__ */ V(n, {
								tone: "accent",
								children: ["+ ", e.name]
							}, e.id))
						]
					}),
					/* @__PURE__ */ V("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ B(r, {
							size: "sm",
							onClick: () => v(e),
							children: "Edit"
						}), !e.applications && /* @__PURE__ */ V(r, {
							size: "sm",
							variant: "ghost",
							className: "text-danger-fg",
							onClick: () => f(e),
							children: [/* @__PURE__ */ B(q, {}), " Delete"]
						})]
					})
				]
			}) }, e.id))
		}),
		c && t && /* @__PURE__ */ B(De, {
			draft: c,
			setDraft: l,
			groups: t.groups,
			saving: h.isPending,
			onSave: () => h.mutate(c)
		}),
		/* @__PURE__ */ B(s, {
			open: !!d,
			onOpenChange: (e) => !e && f(null),
			title: `Delete ${d?.name}?`,
			danger: !0,
			confirmLabel: "Delete",
			onConfirm: () => D.delete(`${Z}/forms/${d.id}`).then(m)
		})
	] });
}
function De({ draft: e, setDraft: t, groups: n, saving: i, onSave: a }) {
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
	return /* @__PURE__ */ B(c, {
		open: !0,
		onOpenChange: (e) => !e && t(null),
		size: "xl",
		title: e.id ? `Edit ${e.name}` : "New form",
		footer: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(r, {
			variant: "ghost",
			onClick: () => t(null),
			children: "Cancel"
		}), /* @__PURE__ */ B(r, {
			variant: "primary",
			loading: i,
			onClick: a,
			children: "Save form"
		})] }),
		children: /* @__PURE__ */ V("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ V("div", {
					className: "grid gap-4 md:grid-cols-[1fr_auto]",
					children: [/* @__PURE__ */ B(d, {
						label: "Name",
						required: !0,
						children: /* @__PURE__ */ B(f, {
							value: e.name,
							onChange: (e) => o({ name: e.target.value }),
							placeholder: "Join Conduit Industries"
						})
					}), /* @__PURE__ */ V("label", {
						className: "inline-flex items-center gap-2 self-end pb-2 text-sm",
						children: [/* @__PURE__ */ B(b, {
							checked: e.open,
							onCheckedChange: (e) => o({ open: e })
						}), " Taking applications"]
					})]
				}),
				/* @__PURE__ */ B(d, {
					label: "Introduction",
					hint: "Shown above the questions: who you are, what you expect, what happens next.",
					children: /* @__PURE__ */ B(w, {
						rows: 3,
						value: e.description,
						onChange: (e) => o({ description: e.target.value })
					})
				}),
				/* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("div", {
					className: "mb-1 text-[13px] font-medium",
					children: "When accepted, add them to"
				}), /* @__PURE__ */ V("div", {
					className: "flex flex-wrap gap-2",
					children: [n.length === 0 && /* @__PURE__ */ B("span", {
						className: "text-sm text-subtle",
						children: "No groups yet. Make them under Administration → Access."
					}), n.map((t) => {
						let n = e.accept_groups.includes(t.id);
						return /* @__PURE__ */ B("button", {
							type: "button",
							onClick: () => o({ accept_groups: n ? e.accept_groups.filter((e) => e !== t.id) : [...e.accept_groups, t.id] }),
							className: `border px-3 py-1.5 text-sm transition-colors ${n ? "border-accent bg-accent-soft text-text" : "border-border text-muted hover:border-accent/60"}`,
							"aria-pressed": n,
							children: t.name
						}, t.id);
					})]
				})] }),
				/* @__PURE__ */ V("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ B("div", {
							className: "text-[13px] font-medium",
							children: "Questions"
						}),
						e.questions.map((t, n) => /* @__PURE__ */ V("div", {
							className: "space-y-3 border border-border bg-surface-2/40 p-3",
							children: [
								/* @__PURE__ */ V("div", {
									className: "flex gap-2",
									children: [
										/* @__PURE__ */ B(f, {
											value: t.label,
											onChange: (e) => s(n, { label: e.target.value }),
											placeholder: "Question",
											className: "flex-1",
											"aria-label": `Question ${n + 1}`
										}),
										/* @__PURE__ */ B(g, {
											value: t.kind,
											onChange: (e) => s(n, { kind: e.target.value }),
											options: we,
											className: "w-40",
											"aria-label": "Answer type"
										}),
										/* @__PURE__ */ B(r, {
											size: "icon-sm",
											variant: "ghost",
											disabled: n === 0,
											onClick: () => l(n, -1),
											"aria-label": "Move up",
											children: /* @__PURE__ */ B(ue, {})
										}),
										/* @__PURE__ */ B(r, {
											size: "icon-sm",
											variant: "ghost",
											disabled: n === e.questions.length - 1,
											onClick: () => l(n, 1),
											"aria-label": "Move down",
											children: /* @__PURE__ */ B(de, {})
										}),
										/* @__PURE__ */ B(r, {
											size: "icon-sm",
											variant: "ghost",
											className: "text-danger-fg",
											onClick: () => o({ questions: e.questions.filter((e, t) => t !== n) }),
											"aria-label": "Remove question",
											children: /* @__PURE__ */ B(q, {})
										})
									]
								}),
								/* @__PURE__ */ V("div", {
									className: "grid gap-3 md:grid-cols-[1fr_auto]",
									children: [/* @__PURE__ */ B(f, {
										value: t.help,
										onChange: (e) => s(n, { help: e.target.value }),
										placeholder: "Hint (optional)",
										className: "text-xs"
									}), /* @__PURE__ */ V("label", {
										className: "inline-flex items-center gap-2 text-xs text-muted",
										children: [/* @__PURE__ */ B(b, {
											checked: t.required,
											onCheckedChange: (e) => s(n, { required: e })
										}), " Required"]
									})]
								}),
								t.kind === "choice" && /* @__PURE__ */ B(w, {
									rows: 3,
									value: t.choicesText ?? t.choices.join("\n"),
									onChange: (e) => s(n, { choicesText: e.target.value }),
									placeholder: "One choice per line",
									className: "font-mono text-xs"
								})
							]
						}, n)),
						/* @__PURE__ */ V(r, {
							onClick: () => o({ questions: [...e.questions, {
								id: "",
								label: "",
								help: "",
								kind: "text",
								choices: [],
								required: !1
							}] }),
							children: [/* @__PURE__ */ B(K, {}), " Add question"]
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region src/review.tsx
var Oe = [
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
function ke() {
	let e = re(), n = N("recruit.manage_forms"), [a, o] = R("open"), [s, c] = R(""), [l, d] = R("");
	ae(() => {
		let e = setTimeout(() => d(s.trim()), 300);
		return () => clearTimeout(e);
	}, [s]);
	let { data: f, isLoading: h } = F({
		queryKey: [
			"recruit",
			"queue",
			a,
			l
		],
		queryFn: () => D.get(`${Z}/applications?status=${a}&q=${encodeURIComponent(l)}`),
		refetchInterval: 6e4
	});
	return /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(p, {
		eyebrow: "Recruitment",
		title: "Applications",
		icon: /* @__PURE__ */ B(U, {}),
		description: "People who want to join. Open one to see their answers and characters, talk to them, and accept or reject.",
		actions: n ? /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(L, {
			to: "/p/recruit/settings",
			children: /* @__PURE__ */ V(r, {
				variant: "ghost",
				children: [/* @__PURE__ */ B(pe, {}), " Settings"]
			})
		}), /* @__PURE__ */ B(L, {
			to: "/p/recruit/forms",
			children: /* @__PURE__ */ V(r, { children: [/* @__PURE__ */ B(J, {}), " Forms"] })
		})] }) : void 0
	}), /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ V("div", {
		className: "flex flex-wrap items-center gap-3 border-b border-border px-card py-3",
		children: [/* @__PURE__ */ B("div", {
			className: "flex flex-wrap gap-1",
			children: Oe.map((e) => /* @__PURE__ */ V("button", {
				type: "button",
				onClick: () => o(e.value),
				className: `inline-flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${a === e.value ? "bg-accent-soft text-text" : "text-muted hover:bg-hover hover:text-text"}`,
				children: [e.label, f && /* @__PURE__ */ B("span", {
					className: "font-mono text-[11px] text-subtle",
					children: f.counts[e.count]
				})]
			}, e.value))
		}), /* @__PURE__ */ B(m, {
			value: s,
			onChange: (e) => c(e.target.value),
			placeholder: "Find a pilot or form",
			className: "ml-auto w-64",
			"aria-label": "Search applications"
		})]
	}), h || !f ? /* @__PURE__ */ B("div", {
		className: "p-card",
		children: /* @__PURE__ */ B(_, { className: "h-40" })
	}) : f.items.length === 0 ? /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(U, {}),
		title: a === "open" ? "No open applications" : "Nothing here",
		description: a === "open" ? "New applications show up here, and recruiters get a notification." : void 0
	}) : /* @__PURE__ */ V(S, { children: [/* @__PURE__ */ B(x, { children: /* @__PURE__ */ V("tr", { children: [
		/* @__PURE__ */ B(T, { children: "Applicant" }),
		/* @__PURE__ */ B(T, { children: "Form" }),
		/* @__PURE__ */ B(T, { children: "Status" }),
		/* @__PURE__ */ B(T, { children: "Recruiter" }),
		/* @__PURE__ */ B(T, {
			align: "right",
			children: "Applied"
		})
	] }) }), /* @__PURE__ */ B("tbody", { children: f.items.map((n) => /* @__PURE__ */ V(E, {
		interactive: !0,
		onClick: () => e(`/p/recruit/applications/${n.id}`),
		children: [
			/* @__PURE__ */ B(C, { children: /* @__PURE__ */ V("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ B(t, {
					src: n.user.portrait,
					name: n.user.name,
					size: "sm"
				}), /* @__PURE__ */ B("span", {
					className: "font-medium",
					children: n.user.name
				})]
			}) }),
			/* @__PURE__ */ B(C, {
				className: "text-muted",
				children: n.form.name
			}),
			/* @__PURE__ */ B(C, { children: /* @__PURE__ */ B(Q, { status: n.status }) }),
			/* @__PURE__ */ B(C, {
				className: "text-muted",
				children: n.reviewer ?? "—"
			}),
			/* @__PURE__ */ B(C, {
				align: "right",
				className: "text-xs text-muted",
				children: A(n.created_at)
			})
		]
	}, n.id)) })] })] })] });
}
function Ae(e) {
	if (!e) return "—";
	let t = (Date.now() - Date.parse(e)) / 315576e5;
	return t >= 1 ? `${t.toFixed(1)} years` : `${Math.round(t * 12)} months`;
}
function je({ c: e }) {
	return /* @__PURE__ */ V("li", {
		className: "space-y-2 px-card py-3",
		children: [/* @__PURE__ */ V("div", {
			className: "flex items-center gap-3",
			children: [
				/* @__PURE__ */ B(t, {
					src: e.portrait,
					name: e.name,
					size: "md"
				}),
				/* @__PURE__ */ V("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ V("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ B("span", {
								className: "font-medium",
								children: e.name
							}),
							e.main && /* @__PURE__ */ B(n, {
								tone: "accent",
								children: "main"
							}),
							!e.login_ok && /* @__PURE__ */ B(n, {
								tone: "warning",
								children: "login expired"
							})
						]
					}), /* @__PURE__ */ B("div", {
						className: "truncate text-xs text-muted",
						children: [e.corporation, e.alliance].filter(Boolean).join(" · ") || "No corporation"
					})]
				}),
				/* @__PURE__ */ B(L, {
					to: `/characters/${e.id}`,
					target: "_blank",
					className: "text-subtle hover:text-text",
					"aria-label": `Open ${e.name}'s character sheet`,
					children: /* @__PURE__ */ B(le, {})
				})
			]
		}), /* @__PURE__ */ V("dl", {
			className: "grid grid-cols-3 gap-x-3 gap-y-1 text-xs",
			children: [
				/* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("dt", {
					className: "text-subtle",
					children: "Skill points"
				}), /* @__PURE__ */ B("dd", {
					className: "font-mono",
					children: e.total_sp == null ? "—" : `${(e.total_sp / 1e6).toFixed(1)}M`
				})] }),
				/* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("dt", {
					className: "text-subtle",
					children: "Wallet"
				}), /* @__PURE__ */ B("dd", {
					className: "font-mono",
					children: e.wallet == null ? "—" : te(e.wallet)
				})] }),
				/* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("dt", {
					className: "text-subtle",
					children: "Age"
				}), /* @__PURE__ */ B("dd", {
					className: "font-mono",
					children: Ae(e.birthday)
				})] }),
				/* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("dt", {
					className: "text-subtle",
					children: "Security"
				}), /* @__PURE__ */ B("dd", {
					className: "font-mono",
					children: e.security_status == null ? "—" : e.security_status.toFixed(1)
				})] }),
				/* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("dt", {
					className: "text-subtle",
					children: "Kills / losses"
				}), /* @__PURE__ */ V("dd", {
					className: "font-mono",
					children: [
						ne(e.kills),
						" / ",
						ne(e.losses)
					]
				})] })
			]
		})]
	});
}
function Me() {
	let { id: e } = ie(), t = I(), s = M(), l = [
		"recruit",
		"application",
		e
	], { data: f, isLoading: m, error: h } = F({
		queryKey: l,
		queryFn: () => D.get(`${Z}/applications/${e}`)
	}), [g, v] = R(null), [y, b] = R(""), x = (e) => {
		t.setQueryData(l, e), t.invalidateQueries({ queryKey: ["recruit", "queue"] });
	}, S = P({
		mutationFn: () => D.post(`${Z}/applications/${e}/claim`),
		onSuccess: x,
		onError: (e) => j.error(e.message)
	}), C = P({
		mutationFn: (t) => D.post(`${Z}/applications/${e}/decide`, {
			accept: t,
			message: y
		}),
		onSuccess: (e) => {
			x(e), v(null), b(""), j.success(e.status === "accepted" ? `${e.user.name} accepted` : `${e.user.name} rejected`);
		},
		onError: (e) => j.error(e.message)
	});
	if (h) return /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(U, {}),
		title: "Application not found",
		action: /* @__PURE__ */ B(L, {
			to: "/p/recruit",
			children: /* @__PURE__ */ B(r, { children: "Back to applications" })
		})
	});
	if (m || !f) return /* @__PURE__ */ B(_, { className: "h-96" });
	let T = f.status === "new" || f.status === "review";
	return /* @__PURE__ */ V(z, { children: [
		/* @__PURE__ */ V(L, {
			to: "/p/recruit",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ B(Y, {}), " Applications"]
		}),
		/* @__PURE__ */ B(p, {
			eyebrow: f.form.name,
			title: f.user.name,
			description: `Applied ${k(f.created_at)}${f.referrer ? ` · referred by ${f.referrer.name}` : ""}${f.reviewer ? ` · recruiter: ${f.reviewer}` : ""}`,
			icon: f.user.portrait ? /* @__PURE__ */ B("img", {
				src: f.user.portrait,
				alt: "",
				className: "size-full object-cover"
			}) : /* @__PURE__ */ B(U, {}),
			actions: T ? /* @__PURE__ */ V("div", {
				className: "flex flex-wrap gap-2",
				children: [
					f.reviewer_id !== s?.id && /* @__PURE__ */ V(r, {
						onClick: () => S.mutate(),
						loading: S.isPending,
						children: [
							!S.isPending && /* @__PURE__ */ B(ce, {}),
							" ",
							f.reviewer ? "Take over" : "Take it"
						]
					}),
					/* @__PURE__ */ V(r, {
						variant: "danger",
						onClick: () => v("reject"),
						children: [/* @__PURE__ */ B(G, {}), " Reject"]
					}),
					/* @__PURE__ */ V(r, {
						variant: "primary",
						onClick: () => v("accept"),
						children: [/* @__PURE__ */ B(W, {}), " Accept"]
					})
				]
			}) : /* @__PURE__ */ B(Q, { status: f.status })
		}),
		/* @__PURE__ */ V("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_420px]",
			children: [/* @__PURE__ */ V("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ B(i, { children: /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B($, { app: f }) }) }),
					/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, { title: "Answers" }), /* @__PURE__ */ V(a, {
						className: "space-y-5 text-sm",
						children: [(f.questions ?? []).length === 0 && /* @__PURE__ */ B("p", {
							className: "text-muted",
							children: "This form has no questions."
						}), (f.questions ?? []).map((e) => /* @__PURE__ */ V("div", { children: [/* @__PURE__ */ B("div", {
							className: "text-xs font-medium uppercase tracking-wider text-subtle",
							children: e.label
						}), /* @__PURE__ */ B("div", {
							className: "mt-1",
							children: /* @__PURE__ */ B(he, { value: e.answer })
						})] }, e.id))]
					})] }),
					/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, {
						title: "Notes and messages",
						description: "Internal notes are only for recruiters; messages go to the applicant."
					}), /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(_e, {
						comments: f.comments ?? [],
						recruiter: !0,
						onSend: (t, n) => D.post(`${Z}/applications/${e}/comments`, {
							text: t,
							internal: n
						}).then(x)
					}) })] })
				]
			}), /* @__PURE__ */ V("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, {
						title: T ? `Characters · ${f.characters?.length ?? 0}` : "Characters",
						description: T ? "Their full character sheets are open to recruiters while the application is open." : void 0
					}), T ? /* @__PURE__ */ B("ul", {
						className: "divide-y divide-border",
						children: (f.characters ?? []).map((e) => /* @__PURE__ */ B(je, { c: e }, e.id))
					}) : /* @__PURE__ */ B(a, {
						className: "text-sm text-muted",
						children: "Shown only while the application is open, like their character sheets."
					})] }),
					(f.accept_groups ?? []).length > 0 && /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, { title: "Accepting adds them to" }), /* @__PURE__ */ B(a, {
						className: "flex flex-wrap gap-1.5",
						children: f.accept_groups.map((e) => /* @__PURE__ */ B(n, { children: e }, e))
					})] }),
					(f.history ?? []).length > 0 && /* @__PURE__ */ V(i, { children: [/* @__PURE__ */ B(o, { title: "Earlier applications" }), /* @__PURE__ */ B("ul", {
						className: "divide-y divide-border",
						children: f.history.map((e) => /* @__PURE__ */ B("li", { children: /* @__PURE__ */ V(L, {
							to: `/p/recruit/applications/${e.id}`,
							className: "flex items-center justify-between gap-3 px-card py-3 text-sm hover:bg-hover",
							children: [/* @__PURE__ */ B("span", { children: e.form }), /* @__PURE__ */ V("span", {
								className: "flex items-center gap-3 text-xs text-muted",
								children: [
									k(e.created_at),
									" ",
									/* @__PURE__ */ B(Q, { status: e.status })
								]
							})]
						}) }, e.id))
					})] })
				]
			})]
		}),
		/* @__PURE__ */ B(c, {
			open: g !== null,
			onOpenChange: (e) => !e && v(null),
			title: g === "accept" ? `Accept ${f.user.name}?` : `Reject ${f.user.name}?`,
			description: g === "accept" ? (f.accept_groups ?? []).length > 0 ? `They're added to ${f.accept_groups.join(", ")} and told straight away.` : "They're told straight away. This form adds them to no groups." : "They're told straight away. They can apply again later.",
			footer: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(r, {
				variant: "ghost",
				onClick: () => v(null),
				children: "Cancel"
			}), /* @__PURE__ */ B(r, {
				variant: g === "accept" ? "primary" : "solidDanger",
				loading: C.isPending,
				onClick: () => C.mutate(g === "accept"),
				children: g === "accept" ? /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(W, {}), " Accept"] }) : /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(G, {}), " Reject"] })
			})] }),
			children: /* @__PURE__ */ B(d, {
				label: "Message to them (optional)",
				hint: "Sent with the notification and shown on their application.",
				children: /* @__PURE__ */ B(w, {
					rows: 3,
					value: y,
					onChange: (e) => b(e.target.value),
					placeholder: g === "accept" ? "Welcome! Join the Discord and say hi in #new-members." : "Thanks for applying. We're looking for more experienced pilots right now."
				})
			})
		})
	] });
}
//#endregion
//#region src/settings.tsx
var Ne = ["recruit", "settings"];
function Pe() {
	let { data: e, isLoading: t } = F({
		queryKey: Ne,
		queryFn: () => D.get(`${Z}/settings`)
	});
	return /* @__PURE__ */ V(z, { children: [
		/* @__PURE__ */ V(L, {
			to: "/p/recruit",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ B(Y, {}), " Applications"]
		}),
		/* @__PURE__ */ B(p, {
			eyebrow: "Recruitment",
			title: "Settings",
			icon: /* @__PURE__ */ B(pe, {}),
			description: "Rules for everyone who applies, whichever form they use."
		}),
		/* @__PURE__ */ V("div", {
			className: "max-w-3xl space-y-6",
			children: [t || !e ? /* @__PURE__ */ B(_, { className: "h-32" }) : /* @__PURE__ */ B(Fe, { settings: e }), /* @__PURE__ */ B(l, { plugin: "recruit" })]
		})
	] });
}
function Fe({ settings: t }) {
	let n = I(), r = P({
		mutationFn: (e) => D.put(`${Z}/settings`, { require_discord: e }),
		onSuccess: (e) => {
			n.setQueryData(Ne, e), j.success(e.require_discord ? "Applicants now need Discord" : "Discord is no longer needed to apply");
		},
		onError: (e) => j.error(e.message)
	}), { installed: o, enabled: s, configured: c } = t.discord_plugin, l = o ? s ? c ? "" : "The Discord plugin isn't set up yet, so this isn't checked. Finish its setup on the Discord page." : "The Discord plugin is installed but switched off, so this isn't checked. Switch it on under Administration → Plugins." : "The Discord plugin isn't installed. Install it under Administration → Plugins to use this.";
	return /* @__PURE__ */ B(i, { children: /* @__PURE__ */ V(a, {
		className: "space-y-3",
		children: [/* @__PURE__ */ V("label", {
			className: "flex items-start gap-3 text-sm",
			children: [/* @__PURE__ */ B(b, {
				checked: t.require_discord,
				disabled: r.isPending || !o && !t.require_discord,
				onCheckedChange: (e) => r.mutate(e),
				"aria-label": "Require Discord"
			}), /* @__PURE__ */ V("span", { children: [
				/* @__PURE__ */ B("span", {
					className: "font-medium",
					children: "Require Discord"
				}),
				/* @__PURE__ */ B("span", {
					className: "block text-muted",
					children: "Applicants must link their Discord account and be on your Discord server before they can send an application."
				}),
				/* @__PURE__ */ B("span", {
					className: "mt-1 block text-xs text-subtle",
					children: "Needs the Discord plugin installed, switched on and set up. Applicants also need the \"Can link a Discord account\" permission, which every state has unless you took it away."
				})
			] })]
		}), l && /* @__PURE__ */ B(e, {
			tone: "warning",
			title: t.require_discord ? "Not being checked" : "Discord plugin needed",
			children: l
		})]
	}) });
}
//#endregion
//#region src/index.tsx
function Ie() {
	return N("recruit.review_applications") ? /* @__PURE__ */ B(ke, {}) : /* @__PURE__ */ B(xe, {});
}
function Le() {
	let { data: e, isLoading: t } = F({
		queryKey: [
			"recruit",
			"queue",
			"open",
			""
		],
		queryFn: () => D.get(`${Z}/applications?status=open`),
		refetchInterval: 12e4
	});
	if (t || !e) return /* @__PURE__ */ B(_, { className: "h-16" });
	let { open: r, new: i, mine: a } = e.counts;
	return /* @__PURE__ */ B(L, {
		to: "/p/recruit",
		className: "block",
		children: /* @__PURE__ */ V("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ V("div", { children: [
				/* @__PURE__ */ B("div", {
					className: "text-xs text-muted",
					children: "Open applications"
				}),
				/* @__PURE__ */ B("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: r
				}),
				/* @__PURE__ */ V("div", {
					className: "text-xs text-subtle",
					children: [a, " with you"]
				})
			] }), i > 0 ? /* @__PURE__ */ V(n, {
				tone: "info",
				children: [i, " new"]
			}) : /* @__PURE__ */ B(n, {
				tone: "success",
				children: "All picked up"
			})]
		})
	});
}
var Re = ee({
	routes: [
		{
			path: "",
			Component: Ie
		},
		{
			path: "apply",
			Component: xe
		},
		{
			path: "applications/:id",
			Component: Me
		},
		{
			path: "forms",
			Component: Ee
		},
		{
			path: "referrals",
			Component: ye
		},
		{
			path: "settings",
			Component: Pe
		}
	],
	widgets: [{
		id: "queue",
		title: "Recruitment",
		Component: Le,
		size: "sm",
		order: 30,
		permission: "recruit.review_applications"
	}]
});
//#endregion
export { Re as default };

export const classes = ["!configured","!data","!enabled","!form","!installed","!o","@conduit/sdk","@tanstack/react-query","a","aboard!","about","above","absolute","accent","accept","accept_groups","accepted","account","action","actions","active","add","added","adds","after","again","align","alliance","also","alt","an","and","answer","answers","app","applicant","applicants","application","applications","apply","are","aria-expanded","aria-label","aria-pressed","aria-selected","as","ask","async","at","author","author_id","autoComplete","await","back","be","been","before","being","bg-accent-soft","bg-border","bg-danger-soft","bg-hover","bg-success-soft","bg-surface-2/40","bg-surface-2/60","bg-surface-raised","bg-warning-soft/60","birthday","block","blur","body","boolean","border","border-accent","border-b","border-border","border-border-strong","border-danger/35","border-success/35","border-t","border-warning/30","both","bring","brought","but","button","by","c","came","can","canManage","catch","character","characters","check","checked","checking","children","choice","choices","choicesText","claim","claimed","className","click","close","combobox","come","comments","configured","confirmLabel","const","control","conversation","corporation","couldn","count","counts","created_at","ctrlKey","current","currentColor","cx","cy","d","danger","data","decide","decided","decided_at","deciding","decision","decision_message","default","description","detail","did","disabled","discord","discordBlocked","discord_plugin","divide-border","divide-y","do","doing","done","down","dq","draft","each","edit","else","enabled","enjoy","error","event","every","everyone","example","experienced","expired","export","eyebrow","false","few","field","fill","finally","first","flex","flex-1","flex-wrap","follow","font-medium","font-mono","font-semibold","footer","for","form","form_id","forms","found","from","full","function","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-6","gap-x-3","gap-y-1","get","ghost","go","grid","grid-cols-3","groups","h-16","h-32","h-40","h-64","h-96","h-px","happens","has","have","hear","height","help","here","hi","hint","history","hits","hover:bg-hover","hover:border-accent/60","hover:text-text","how","i","icon","icon-sm","icons","id","if","import","in","in_progress","info","inline","inline-flex","input","inset-x-0","installed","instanceof","interactive","interface","internal","is","isLoading","isPending","is_recruiter","isn","it","italic","items","items-center","items-end","items-start","its","just","justify-between","key","keyof","kills","kind","label","land","latest","least","length","let","letters","like","line","line-clamp-2","line-clamp-3","link","linked","list","listbox","ll","loading","login","login_ok","long","longer","looking","losses","m12","m15.477","m18","m21.854","m6","main","manage_forms","many","max-h-56","max-w-3xl","max-w-sm","max-w-xs","may","mb-1","mb-4","mb-6","md","md:grid-cols-2","md:grid-cols-[1fr_auto]","me","member","members","message","messages","min-w-0","mine","missing","ml-0.5","ml-auto","months","more","mostly","move","mt-1","mt-2","mt-3","mt-6","must","mutationFn","n","name","named","names","navigate","need","needed","needs","neutral","never","new","no","none","not","not_accepted","note","notes","notification","now","null","number","object-cover","of","off","ok","on","onBlur","onChange","onCheck","onCheckedChange","onClick","onConfirm","onError","onFocus","onKeyDown","onMouseDown","onMouseEnter","onOpenChange","onSave","onSend","onSuccess","on_server","once","one","only","open","option","options","or","order","other","our","outline","over","overflow-y-auto","own","p-0.5","p-1","p-3","p-card","part","past","patch","path","pb-2","people","per","permission","pick","picked","pilot","pilots","pl-1","place-items-center","placeholder","play","plugin","points","pops","portrait","post","pr-1.5","primary","problem","progress","pt-5","put","px-2","px-3","px-card","py-1","py-1.5","py-2.5","py-3","q","qc","qs","queryFn","queryKey","question","questions","queue","re","react","react-router","recruit","recruited","recruiter","recruiters","recruiting","referrals","referred","referrer","referrer_id","referrers","refetch","refetchInterval","refresh","reject","rejected","relative","require_discord","required","requires","rest","return","review","review_applications","reviewer","reviewer_id","right","role","round","routes","row","rows","rx","ry","s","save","saved","saving","say","search","secondary","security_status","see","sees","self-end","send","sends","server","set","setActive","setAnswers","setBusy","setDeciding","setDeleting","setDq","setDraft","setForm","setInternal","setMessage","setOpen","setQ","setReferrer","setSearch","setStatus","setText","setWithdrawing","settings","setup","shadow-e3","sheet","sheets","show","shown","shrink-0","side","site","size","size-10","size-3","size-3.5","size-4","size-5","size-full","sm","sm:grid-cols-2","so","solidDanger","someone","space-y-1.5","space-y-2","space-y-3","space-y-4","space-y-5","space-y-6","src","starts","state","status","steps","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","submit","success","switched","t","tabular-nums","talk","target","text","text-3xl","text-[11px]","text-[13px]","text-accent-ink","text-center","text-danger-fg","text-left","text-muted","text-sm","text-subtle","text-text","text-xs","that","the","their","them","then","they","this","three","time","title","to","toast","toggle","told","tone","took","top-full","total_sp","tracking-wider","transition-colors","true","truncate","try","type","undefined","under","unless","up","updated_at","uppercase","us","use","useHasPerm","useParams","useQuery","useQueryClient","useState","used","user","username","v","value","variant","viewBox","voice","void","w-40","w-64","w-full","waiting","wallet","want","warning","was","wasn","weeks","welcome","what","when","which","whichever","while","whitespace-pre-line","who","widgets","width","will","with","withdrawn","withdrew","would","write","x","xl","xl:grid-cols-4","xl:grid-cols-[1fr_380px]","xl:grid-cols-[1fr_420px]","xs","years","yes","yesno","yet","you","your","z-10","zone"];
