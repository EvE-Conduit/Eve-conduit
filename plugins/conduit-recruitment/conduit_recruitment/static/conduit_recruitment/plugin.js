import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, Dialog as c, EmptyState as l, Field as u, Input as d, PageHeader as f, SearchInput as p, Segmented as m, Select as h, Skeleton as g, Spinner as _, StatCard as v, Switch as y, THead as b, Table as x, Td as S, Textarea as C, Th as w, Tr as T, api as E, cn as D, date as O, definePlugin as ee, isk as te, num as k, timeAgo as A, toast as j, useCurrentUser as ne, useHasPerm as M } from "@conduit/sdk";
import { useMutation as N, useQuery as P, useQueryClient as F } from "@tanstack/react-query";
import { Link as I, useNavigate as re, useParams as ie } from "react-router";
import { useEffect as ae, useState as L } from "react";
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
		/* @__PURE__ */ z("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
		/* @__PURE__ */ z("circle", {
			cx: "9",
			cy: "7",
			r: "4"
		}),
		/* @__PURE__ */ z("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
		/* @__PURE__ */ z("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
	]
}), U = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "M20 6 9 17l-5-5" })
}), W = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M18 6 6 18" }), /* @__PURE__ */ z("path", { d: "m6 6 12 12" })]
}), G = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("rect", {
		width: "18",
		height: "11",
		x: "3",
		y: "11",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ z("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })]
}), K = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" }), /* @__PURE__ */ z("path", { d: "m21.854 2.147-10.94 10.939" })]
}), oe = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M18 11V6a2 2 0 0 0-4 0v5" }),
		/* @__PURE__ */ z("path", { d: "M14 10V4a2 2 0 0 0-4 0v6" }),
		/* @__PURE__ */ z("path", { d: "M10 10.5V6a2 2 0 0 0-4 0v8" }),
		/* @__PURE__ */ z("path", { d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" })
	]
}), q = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ z("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ z("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), J = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M5 12h14" }), /* @__PURE__ */ z("path", { d: "M12 5v14" })]
}), se = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M3 6h18" }),
		/* @__PURE__ */ z("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ z("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), ce = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "m18 15-6-6-6 6" })
}), le = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "m6 9 6 6 6-6" })
}), Y = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }),
		/* @__PURE__ */ z("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }),
		/* @__PURE__ */ z("path", { d: "M10 9H8" }),
		/* @__PURE__ */ z("path", { d: "M16 13H8" }),
		/* @__PURE__ */ z("path", { d: "M16 17H8" })
	]
}), X = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ z("path", { d: "M19 12H5" })]
}), ue = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" }), /* @__PURE__ */ z("circle", {
		cx: "12",
		cy: "8",
		r: "6"
	})]
}), de = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ z("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), Z = {
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
}, Q = "/api/p/recruit";
//#endregion
//#region src/shared.tsx
function $({ status: e }) {
	return /* @__PURE__ */ z(n, {
		tone: Z[e].tone,
		children: Z[e].label
	});
}
function fe({ app: e }) {
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
			label: t ? Z[e.status].label : "Decision",
			detail: e.decided_at ? A(e.decided_at) : "",
			done: t
		}
	];
	return /* @__PURE__ */ z("ol", {
		className: "grid grid-cols-3 gap-2",
		children: n.map((t, n) => /* @__PURE__ */ B("li", {
			className: D("border px-3 py-2.5", t.done ? n === 2 && e.status === "rejected" ? "border-danger/35 bg-danger-soft" : "border-success/35 bg-success-soft" : "border-border"),
			children: [/* @__PURE__ */ z("div", {
				className: D("text-sm font-medium", !t.done && "text-subtle"),
				children: t.label
			}), /* @__PURE__ */ z("div", {
				className: "truncate text-xs text-muted",
				children: t.detail
			})]
		}, n))
	});
}
function pe({ q: e, value: t, onChange: n }) {
	let r = /* @__PURE__ */ B("span", {
		className: "block text-[13px] font-medium text-text",
		children: [e.label, e.required && /* @__PURE__ */ z("span", {
			className: "ml-0.5 text-danger-fg",
			children: "*"
		})]
	}), i;
	return i = e.kind === "long" ? /* @__PURE__ */ z(C, {
		rows: 4,
		value: t ?? "",
		onChange: (e) => n(e.target.value)
	}) : e.kind === "yesno" ? /* @__PURE__ */ z(m, {
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
	}) : e.kind === "choice" ? /* @__PURE__ */ B(h, {
		value: t ?? "",
		onChange: (e) => n(e.target.value),
		className: "max-w-xs",
		children: [/* @__PURE__ */ z("option", {
			value: "",
			children: "Choose…"
		}), e.choices.map((e) => /* @__PURE__ */ z("option", {
			value: e,
			children: e
		}, e))]
	}) : /* @__PURE__ */ z(d, {
		value: t ?? "",
		onChange: (e) => n(e.target.value)
	}), /* @__PURE__ */ B("div", {
		className: "space-y-1.5",
		children: [
			r,
			e.help && /* @__PURE__ */ z("p", {
				className: "text-xs text-muted",
				children: e.help
			}),
			/* @__PURE__ */ z("div", { children: i })
		]
	});
}
function me({ value: e }) {
	return e === !0 ? /* @__PURE__ */ z("span", { children: "Yes" }) : e === !1 ? /* @__PURE__ */ z("span", { children: "No" }) : e == null || e === "" ? /* @__PURE__ */ z("span", {
		className: "text-subtle",
		children: "No answer"
	}) : /* @__PURE__ */ z("span", {
		className: "whitespace-pre-line",
		children: e
	});
}
var he = {
	claimed: "took this application",
	accepted: "accepted the application",
	rejected: "rejected the application",
	withdrawn: "withdrew the application"
};
function ge({ comments: e, recruiter: i, onSend: a, disabled: o }) {
	let [s, c] = L(""), [l, u] = L(i), [d, f] = L(!1), p = async () => {
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
	return /* @__PURE__ */ B("div", {
		className: "space-y-4",
		children: [e.length === 0 ? /* @__PURE__ */ z("p", {
			className: "text-sm text-muted",
			children: i ? "No notes or messages yet." : "No messages yet. Recruiters may write to you here."
		}) : /* @__PURE__ */ z("ol", {
			className: "space-y-3",
			children: e.map((e) => e.event && he[e.event] ? /* @__PURE__ */ B("li", {
				className: "flex items-center gap-2 text-xs text-muted",
				children: [
					/* @__PURE__ */ z("span", { className: "h-px flex-1 bg-border" }),
					/* @__PURE__ */ B("span", { children: [
						/* @__PURE__ */ z("span", {
							className: "font-medium text-text",
							children: e.author
						}),
						" ",
						he[e.event],
						" · ",
						A(e.created_at),
						e.text && ![
							"Took this application",
							"Withdrew the application",
							"Accepted",
							"Rejected"
						].includes(e.text) && /* @__PURE__ */ B("span", {
							className: "block text-center italic",
							children: [
								"“",
								e.text,
								"”"
							]
						})
					] }),
					/* @__PURE__ */ z("span", { className: "h-px flex-1 bg-border" })
				]
			}, e.id) : /* @__PURE__ */ B("li", {
				className: D("flex gap-3 border p-3", e.internal ? "border-warning/30 bg-warning-soft/60" : "border-border bg-surface-2/60"),
				children: [/* @__PURE__ */ z(t, {
					src: e.portrait,
					name: e.author,
					size: "sm"
				}), /* @__PURE__ */ B("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ B("div", {
						className: "flex flex-wrap items-center gap-2 text-xs",
						children: [
							/* @__PURE__ */ z("span", {
								className: "font-medium text-text",
								children: e.author
							}),
							/* @__PURE__ */ z("span", {
								className: "text-subtle",
								children: A(e.created_at)
							}),
							e.internal && /* @__PURE__ */ B(n, {
								tone: "warning",
								children: [/* @__PURE__ */ z(G, { className: "size-3" }), " internal note"]
							})
						]
					}), /* @__PURE__ */ z("p", {
						className: "mt-1 whitespace-pre-line text-sm",
						children: e.text
					})]
				})]
			}, e.id))
		}), !o && /* @__PURE__ */ B("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ z(C, {
				rows: 3,
				value: s,
				onChange: (e) => c(e.target.value),
				placeholder: i ? l ? "A note for the other recruiters…" : "A message to the applicant…" : "Write to the recruiters…",
				onKeyDown: (e) => {
					e.key === "Enter" && (e.ctrlKey || e.metaKey) && p();
				}
			}), /* @__PURE__ */ B("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [i ? /* @__PURE__ */ B("label", {
					className: "inline-flex items-center gap-2 text-sm text-muted",
					children: [/* @__PURE__ */ z(y, {
						checked: l,
						onCheckedChange: u
					}), l ? "Internal note: only recruiters see it" : "Message: the applicant sees it"]
				}) : /* @__PURE__ */ z("span", {
					className: "text-xs text-subtle",
					children: "Ctrl+Enter sends"
				}), /* @__PURE__ */ B(r, {
					variant: l ? "secondary" : "primary",
					loading: d,
					disabled: !s.trim(),
					onClick: p,
					children: [
						!d && z(l ? G : K, {}),
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
function _e({ value: e, onChange: n }) {
	let [r, i] = L(""), [a, o] = L(""), [s, c] = L(!1), [l, u] = L(0);
	ae(() => {
		let e = setTimeout(() => o(r.trim()), 250);
		return () => clearTimeout(e);
	}, [r]);
	let { data: f, isLoading: p } = P({
		queryKey: [
			"recruit",
			"referrers",
			a
		],
		queryFn: () => E.get(`${Q}/referrers?q=${encodeURIComponent(a)}`),
		enabled: a.length >= 3
	}), m = f ?? [], h = (e) => {
		n(e), i(""), c(!1);
	};
	return /* @__PURE__ */ B("div", {
		className: "space-y-1.5",
		children: [
			/* @__PURE__ */ z("span", {
				className: "block text-[13px] font-medium text-text",
				children: "Who referred you?"
			}),
			/* @__PURE__ */ z("p", {
				className: "text-xs text-muted",
				children: "Optional. Type at least three letters of the name of the member who brought you here."
			}),
			e ? /* @__PURE__ */ B("div", {
				className: "inline-flex items-center gap-2 border border-border bg-surface-2/60 py-1 pl-1 pr-1.5 text-sm",
				children: [
					/* @__PURE__ */ z(t, {
						src: e.portrait,
						name: e.name,
						size: "sm"
					}),
					/* @__PURE__ */ z("span", {
						className: "font-medium",
						children: e.name
					}),
					/* @__PURE__ */ z("button", {
						type: "button",
						onClick: () => n(null),
						className: "p-0.5 text-subtle hover:text-text",
						"aria-label": `Remove ${e.name}`,
						children: /* @__PURE__ */ z(W, { className: "size-3.5" })
					})
				]
			}) : /* @__PURE__ */ B("div", {
				className: "relative max-w-sm",
				children: [/* @__PURE__ */ z(d, {
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
				}), s && a.length >= 3 && /* @__PURE__ */ z("div", {
					className: "absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto border border-border-strong bg-surface-raised p-1 shadow-e3",
					role: "listbox",
					children: p ? /* @__PURE__ */ z(_, { className: "px-2 py-1.5" }) : m.length === 0 ? /* @__PURE__ */ z("div", {
						className: "px-2 py-1.5 text-xs text-subtle",
						children: "No member by that name."
					}) : m.map((e, n) => /* @__PURE__ */ B("button", {
						type: "button",
						role: "option",
						"aria-selected": n === l,
						onMouseDown: (t) => {
							t.preventDefault(), h(e);
						},
						onMouseEnter: () => u(n),
						className: D("flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm", n === l && "bg-hover"),
						children: [/* @__PURE__ */ z(t, {
							src: e.portrait,
							name: e.name,
							size: "xs"
						}), /* @__PURE__ */ z("span", {
							className: "flex-1 truncate",
							children: e.name
						})]
					}, e.id))
				})]
			})
		]
	});
}
function ve() {
	let { data: e, isLoading: n } = P({
		queryKey: ["recruit", "referrals"],
		queryFn: () => E.get(`${Q}/referrals`)
	});
	return /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(f, {
		eyebrow: "Recruitment",
		title: "Your referrals",
		icon: /* @__PURE__ */ z(ue, {}),
		description: "People who named you as their referrer when they applied."
	}), n || !e ? /* @__PURE__ */ z(g, { className: "h-64" }) : /* @__PURE__ */ B("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ B("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ z(v, {
					label: "Recruited",
					value: e.recruited,
					icon: /* @__PURE__ */ z(U, {}),
					tone: "success",
					hint: e.recruited === 1 ? "pilot accepted" : "pilots accepted"
				}),
				/* @__PURE__ */ z(v, {
					label: "Referred",
					value: e.referred,
					icon: /* @__PURE__ */ z(H, {}),
					hint: e.referred === 1 ? "pilot named you" : "pilots named you"
				}),
				/* @__PURE__ */ z(v, {
					label: "In progress",
					value: e.in_progress,
					hint: "waiting for a decision"
				}),
				/* @__PURE__ */ z(v, {
					label: "Not accepted",
					value: e.not_accepted,
					hint: "rejected or withdrawn"
				})
			]
		}), /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, { title: "Referrals" }), e.referrals.length === 0 ? /* @__PURE__ */ z(l, {
			icon: /* @__PURE__ */ z(ue, {}),
			title: "No referrals yet",
			description: "When someone you bring in applies, they can name you as their referrer and they'll show up here."
		}) : /* @__PURE__ */ B(x, { children: [/* @__PURE__ */ z(b, { children: /* @__PURE__ */ B("tr", { children: [
			/* @__PURE__ */ z(w, { children: "Pilot" }),
			/* @__PURE__ */ z(w, { children: "Form" }),
			/* @__PURE__ */ z(w, { children: "Status" }),
			/* @__PURE__ */ z(w, {
				align: "right",
				children: "Applied"
			})
		] }) }), /* @__PURE__ */ z("tbody", { children: e.referrals.map((e) => /* @__PURE__ */ B(T, { children: [
			/* @__PURE__ */ z(S, { children: /* @__PURE__ */ B("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ z(t, {
					src: e.user.portrait,
					name: e.user.name,
					size: "sm"
				}), /* @__PURE__ */ z("span", {
					className: "font-medium",
					children: e.user.name
				})]
			}) }),
			/* @__PURE__ */ z(S, {
				className: "text-muted",
				children: e.form
			}),
			/* @__PURE__ */ z(S, { children: /* @__PURE__ */ z($, { status: e.status }) }),
			/* @__PURE__ */ z(S, {
				align: "right",
				className: "text-xs text-muted",
				children: O(e.created_at)
			})
		] }, e.id)) })] })] })]
	})] });
}
//#endregion
//#region src/apply.tsx
var ye = ["recruit", "me"];
function be() {
	let e = F(), t = ne(), { data: n, isLoading: c, isFetching: u, refetch: d } = P({
		queryKey: ye,
		queryFn: () => E.get(`${Q}/me`)
	}), [p, m] = L(null), [h, _] = L({}), [v, y] = L(null), [b, x] = L(!1), S = () => e.invalidateQueries({ queryKey: ye }), C = N({
		mutationFn: () => E.post(`${Q}/applications`, {
			form_id: p.id,
			answers: h,
			referrer_id: v?.id ?? null
		}),
		onSuccess: () => {
			j.success("Application sent. The recruiters have been told."), m(null), _({}), y(null), S();
		},
		onError: (e) => j.error(e.message)
	});
	if (c || !n) return /* @__PURE__ */ z(g, { className: "h-64" });
	let w = n.current, T = !!p && !!n.discord && !n.discord.ok;
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ z(f, {
			eyebrow: "Recruitment",
			title: w ? "Your application" : p ? p.name : "Join us",
			icon: /* @__PURE__ */ z(H, {}),
			description: w ? "Follow your application here. Recruiters can see your characters while it's open, and may write to you." : p ? p.description || "Answer the questions below. Recruiters will see your characters once you apply." : `Welcome${t?.main ? `, ${t.main.name}` : ""}. Pick what you'd like to apply for.`,
			actions: n.is_recruiter ? /* @__PURE__ */ z(I, {
				to: "/p/recruit",
				children: /* @__PURE__ */ B(r, {
					variant: "ghost",
					children: [/* @__PURE__ */ z(H, {}), " Applications"]
				})
			}) : void 0
		}),
		!w && !p && /* @__PURE__ */ z(Se, { app: n.past[0] }),
		w ? /* @__PURE__ */ B("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_380px]",
			children: [
				/* @__PURE__ */ B("div", {
					className: "space-y-6",
					children: [/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, {
						title: w.form.name,
						description: `Sent ${O(w.created_at)}`,
						actions: /* @__PURE__ */ z($, { status: w.status })
					}), /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(fe, { app: w }) })] }), /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, {
						title: "Messages",
						description: "Between you and the recruiters."
					}), /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(ge, {
						comments: w.comments ?? [],
						recruiter: !1,
						onSend: (e) => E.post(`${Q}/applications/${w.id}/comments`, { text: e }).then(S)
					}) })] })]
				}),
				/* @__PURE__ */ B("div", {
					className: "space-y-6",
					children: [/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, { title: "Your answers" }), /* @__PURE__ */ B(a, {
						className: "space-y-4 text-sm",
						children: [(w.questions ?? []).map((e) => /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("div", {
							className: "text-xs text-muted",
							children: e.label
						}), /* @__PURE__ */ z(me, { value: e.answer })] }, e.id)), w.referrer && /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("div", {
							className: "text-xs text-muted",
							children: "Referred by"
						}), /* @__PURE__ */ z("span", { children: w.referrer.name })] })]
					})] }), /* @__PURE__ */ B(r, {
						variant: "ghost",
						className: "w-full text-danger-fg",
						onClick: () => x(!0),
						children: [/* @__PURE__ */ z(W, {}), " Withdraw application"]
					})]
				}),
				/* @__PURE__ */ z(s, {
					open: b,
					onOpenChange: x,
					title: "Withdraw your application?",
					description: "The recruiters are told and it's closed. You can apply again later.",
					danger: !0,
					confirmLabel: "Withdraw",
					onConfirm: () => E.post(`${Q}/applications/${w.id}/withdraw`).then(S)
				})
			]
		}) : p ? /* @__PURE__ */ z(i, {
			className: "max-w-3xl",
			children: /* @__PURE__ */ B(a, {
				className: "space-y-6",
				children: [
					T && /* @__PURE__ */ z(xe, {
						status: n.discord,
						checking: u,
						onCheck: () => d()
					}),
					p.questions.length === 0 && /* @__PURE__ */ z("p", {
						className: "text-sm text-muted",
						children: "No questions: just send it."
					}),
					p.questions.map((e) => /* @__PURE__ */ z(pe, {
						q: e,
						value: h[e.id],
						onChange: (t) => _((n) => ({
							...n,
							[e.id]: t
						}))
					}, e.id)),
					/* @__PURE__ */ z(_e, {
						value: v,
						onChange: y
					}),
					/* @__PURE__ */ B("div", {
						className: "flex items-center justify-between gap-3 border-t border-border pt-5",
						children: [/* @__PURE__ */ B(r, {
							variant: "ghost",
							onClick: () => m(null),
							children: [/* @__PURE__ */ z(X, {}), " Back"]
						}), /* @__PURE__ */ B(r, {
							variant: "primary",
							loading: C.isPending,
							disabled: T,
							onClick: () => C.mutate(),
							children: [!C.isPending && /* @__PURE__ */ z(K, {}), " Send application"]
						})]
					})
				]
			})
		}) : n.forms.length === 0 ? /* @__PURE__ */ z(i, { children: /* @__PURE__ */ z(l, {
			icon: /* @__PURE__ */ z(H, {}),
			title: "Not recruiting right now",
			description: "Check back later, or ask someone in the corporation."
		}) }) : /* @__PURE__ */ z("div", {
			className: "grid gap-4 md:grid-cols-2",
			children: n.forms.map((e) => /* @__PURE__ */ z(i, {
				interactive: !0,
				children: /* @__PURE__ */ z("button", {
					type: "button",
					className: "block w-full p-card text-left",
					onClick: () => {
						m(e), _({});
					},
					children: /* @__PURE__ */ B("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ z("div", {
							className: "grid size-10 shrink-0 place-items-center border border-border-strong text-accent-ink",
							children: /* @__PURE__ */ z(Y, { className: "size-5" })
						}), /* @__PURE__ */ B("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ z("div", {
									className: "font-medium",
									children: e.name
								}),
								e.description && /* @__PURE__ */ z("p", {
									className: "mt-1 line-clamp-3 text-sm text-muted",
									children: e.description
								}),
								/* @__PURE__ */ B("div", {
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
		n.past.length > 0 && /* @__PURE__ */ B(i, {
			className: "mt-6",
			children: [/* @__PURE__ */ z(o, { title: "Earlier applications" }), /* @__PURE__ */ z("ul", {
				className: "divide-y divide-border",
				children: n.past.map((e) => /* @__PURE__ */ B("li", {
					className: "flex items-center justify-between gap-3 px-card py-3 text-sm",
					children: [/* @__PURE__ */ z("span", { children: e.form.name }), /* @__PURE__ */ B("span", {
						className: "flex items-center gap-3 text-xs text-muted",
						children: [
							O(e.created_at),
							" ",
							/* @__PURE__ */ z($, { status: e.status })
						]
					})]
				}, e.id))
			})]
		})
	] });
}
function xe({ status: t, checking: n, onCheck: i }) {
	let a = t.error ? "We couldn't check your Discord" : t.linked ? "Join our Discord server first" : "Link your Discord account first", o = t.error ? t.error : t.linked ? `Your Discord account ${t.username ?? ""} is linked but isn't on our server. Join it from the Discord page, then come back.` : "This application needs your Discord account linked and you on our server. Link it on the Discord page, then come back.";
	return /* @__PURE__ */ B(e, {
		tone: "warning",
		title: a,
		children: [/* @__PURE__ */ z("p", { children: o }), /* @__PURE__ */ B("div", {
			className: "mt-3 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ z(I, {
				to: "/p/discord",
				children: /* @__PURE__ */ B(r, {
					size: "sm",
					variant: "outline",
					children: [/* @__PURE__ */ z(q, {}), " Go to Discord"]
				})
			}), /* @__PURE__ */ z(r, {
				size: "sm",
				variant: "ghost",
				loading: n,
				onClick: i,
				children: "Check again"
			})]
		})]
	});
}
function Se({ app: t }) {
	return !t?.decided_at || Date.now() - Date.parse(t.decided_at) > 2592e6 ? null : t.status === "accepted" ? /* @__PURE__ */ z(e, {
		tone: "success",
		className: "mb-6",
		title: `Welcome aboard! Your application to ${t.form.name} was accepted`,
		children: /* @__PURE__ */ z("span", {
			className: "whitespace-pre-line",
			children: t.decision_message || `Accepted ${O(t.decided_at)}.`
		})
	}) : t.status === "rejected" ? /* @__PURE__ */ z(e, {
		tone: "info",
		className: "mb-6",
		title: `Your application to ${t.form.name} wasn't accepted this time`,
		children: /* @__PURE__ */ z("span", {
			className: "whitespace-pre-line",
			children: t.decision_message || "You're welcome to apply again later."
		})
	}) : null;
}
//#endregion
//#region src/forms.tsx
var Ce = [
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
], we = {
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
function Te() {
	let e = F(), { data: t, isLoading: o } = P({
		queryKey: ["recruit", "forms"],
		queryFn: () => E.get(`${Q}/forms`)
	}), [c, u] = L(null), [d, p] = L(null), m = () => e.invalidateQueries({ queryKey: ["recruit"] }), h = N({
		mutationFn: (e) => {
			let t = {
				...e,
				questions: e.questions.map(({ choicesText: e, ...t }) => ({
					...t,
					choices: t.kind === "choice" ? (e ?? t.choices.join("\n")).split("\n") : []
				}))
			};
			return e.id ? E.put(`${Q}/forms/${e.id}`, t) : E.post(`${Q}/forms`, t);
		},
		onSuccess: () => {
			j.success("Form saved"), u(null), m();
		},
		onError: (e) => j.error(e.message)
	}), _ = N({
		mutationFn: (e) => E.put(`${Q}/forms/${e.id}`, {
			...e,
			open: !e.open,
			accept_groups: (e.accept_groups ?? []).map((e) => e.id)
		}),
		onSuccess: m,
		onError: (e) => j.error(e.message)
	}), v = (e) => u({
		id: e.id,
		name: e.name,
		description: e.description,
		open: e.open,
		order: e.order ?? 0,
		accept_groups: (e.accept_groups ?? []).map((e) => e.id),
		questions: e.questions.map((e) => ({ ...e }))
	});
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ B(I, {
			to: "/p/recruit",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ z(X, {}), " Applications"]
		}),
		/* @__PURE__ */ z(f, {
			eyebrow: "Recruitment",
			title: "Forms",
			icon: /* @__PURE__ */ z(Y, {}),
			description: "What applicants fill in. Each form can add accepted applicants to groups, e.g. one form per corporation.",
			actions: /* @__PURE__ */ B(r, {
				variant: "primary",
				onClick: () => u({
					...we,
					questions: we.questions.map((e) => ({ ...e }))
				}),
				children: [/* @__PURE__ */ z(J, {}), " New form"]
			})
		}),
		o || !t ? /* @__PURE__ */ z(g, { className: "h-40" }) : t.forms.length === 0 ? /* @__PURE__ */ z(i, { children: /* @__PURE__ */ z(l, {
			icon: /* @__PURE__ */ z(Y, {}),
			title: "No forms yet",
			description: "Make one so people can apply. It starts with a few example questions you can change."
		}) }) : /* @__PURE__ */ z("div", {
			className: "grid gap-4 md:grid-cols-2",
			children: t.forms.map((e) => /* @__PURE__ */ z(i, { children: /* @__PURE__ */ B(a, {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ B("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ B("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ z("div", {
								className: "font-medium",
								children: e.name
							}), e.description && /* @__PURE__ */ z("p", {
								className: "mt-1 line-clamp-2 text-sm text-muted",
								children: e.description
							})]
						}), /* @__PURE__ */ B("label", {
							className: "inline-flex shrink-0 items-center gap-2 text-xs text-muted",
							children: [e.open ? "Open" : "Closed", /* @__PURE__ */ z(y, {
								checked: e.open,
								onCheckedChange: () => _.mutate(e),
								"aria-label": `${e.name} is open`
							})]
						})]
					}),
					/* @__PURE__ */ B("div", {
						className: "flex flex-wrap gap-1.5",
						children: [
							/* @__PURE__ */ B(n, { children: [
								e.questions.length,
								" question",
								e.questions.length === 1 ? "" : "s"
							] }),
							/* @__PURE__ */ B(n, { children: [
								e.applications ?? 0,
								" application",
								e.applications === 1 ? "" : "s"
							] }),
							(e.accept_groups ?? []).map((e) => /* @__PURE__ */ B(n, {
								tone: "accent",
								children: ["+ ", e.name]
							}, e.id))
						]
					}),
					/* @__PURE__ */ B("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ z(r, {
							size: "sm",
							onClick: () => v(e),
							children: "Edit"
						}), !e.applications && /* @__PURE__ */ B(r, {
							size: "sm",
							variant: "ghost",
							className: "text-danger-fg",
							onClick: () => p(e),
							children: [/* @__PURE__ */ z(se, {}), " Delete"]
						})]
					})
				]
			}) }, e.id))
		}),
		c && t && /* @__PURE__ */ z(Ee, {
			draft: c,
			setDraft: u,
			groups: t.groups,
			saving: h.isPending,
			onSave: () => h.mutate(c)
		}),
		/* @__PURE__ */ z(s, {
			open: !!d,
			onOpenChange: (e) => !e && p(null),
			title: `Delete ${d?.name}?`,
			danger: !0,
			confirmLabel: "Delete",
			onConfirm: () => E.delete(`${Q}/forms/${d.id}`).then(m)
		})
	] });
}
function Ee({ draft: e, setDraft: t, groups: n, saving: i, onSave: a }) {
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
	return /* @__PURE__ */ z(c, {
		open: !0,
		onOpenChange: (e) => !e && t(null),
		size: "xl",
		title: e.id ? `Edit ${e.name}` : "New form",
		footer: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(r, {
			variant: "ghost",
			onClick: () => t(null),
			children: "Cancel"
		}), /* @__PURE__ */ z(r, {
			variant: "primary",
			loading: i,
			onClick: a,
			children: "Save form"
		})] }),
		children: /* @__PURE__ */ B("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ B("div", {
					className: "grid gap-4 md:grid-cols-[1fr_auto]",
					children: [/* @__PURE__ */ z(u, {
						label: "Name",
						required: !0,
						children: /* @__PURE__ */ z(d, {
							value: e.name,
							onChange: (e) => o({ name: e.target.value }),
							placeholder: "Join Conduit Industries"
						})
					}), /* @__PURE__ */ B("label", {
						className: "inline-flex items-center gap-2 self-end pb-2 text-sm",
						children: [/* @__PURE__ */ z(y, {
							checked: e.open,
							onCheckedChange: (e) => o({ open: e })
						}), " Taking applications"]
					})]
				}),
				/* @__PURE__ */ z(u, {
					label: "Introduction",
					hint: "Shown above the questions: who you are, what you expect, what happens next.",
					children: /* @__PURE__ */ z(C, {
						rows: 3,
						value: e.description,
						onChange: (e) => o({ description: e.target.value })
					})
				}),
				/* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("div", {
					className: "mb-1 text-[13px] font-medium",
					children: "When accepted, add them to"
				}), /* @__PURE__ */ B("div", {
					className: "flex flex-wrap gap-2",
					children: [n.length === 0 && /* @__PURE__ */ z("span", {
						className: "text-sm text-subtle",
						children: "No groups yet. Make them under Administration → Access."
					}), n.map((t) => {
						let n = e.accept_groups.includes(t.id);
						return /* @__PURE__ */ z("button", {
							type: "button",
							onClick: () => o({ accept_groups: n ? e.accept_groups.filter((e) => e !== t.id) : [...e.accept_groups, t.id] }),
							className: `border px-3 py-1.5 text-sm transition-colors ${n ? "border-accent bg-accent-soft text-text" : "border-border text-muted hover:border-accent/60"}`,
							"aria-pressed": n,
							children: t.name
						}, t.id);
					})]
				})] }),
				/* @__PURE__ */ B("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ z("div", {
							className: "text-[13px] font-medium",
							children: "Questions"
						}),
						e.questions.map((t, n) => /* @__PURE__ */ B("div", {
							className: "space-y-3 border border-border bg-surface-2/40 p-3",
							children: [
								/* @__PURE__ */ B("div", {
									className: "flex gap-2",
									children: [
										/* @__PURE__ */ z(d, {
											value: t.label,
											onChange: (e) => s(n, { label: e.target.value }),
											placeholder: "Question",
											className: "flex-1",
											"aria-label": `Question ${n + 1}`
										}),
										/* @__PURE__ */ z(h, {
											value: t.kind,
											onChange: (e) => s(n, { kind: e.target.value }),
											options: Ce,
											className: "w-40",
											"aria-label": "Answer type"
										}),
										/* @__PURE__ */ z(r, {
											size: "icon-sm",
											variant: "ghost",
											disabled: n === 0,
											onClick: () => l(n, -1),
											"aria-label": "Move up",
											children: /* @__PURE__ */ z(ce, {})
										}),
										/* @__PURE__ */ z(r, {
											size: "icon-sm",
											variant: "ghost",
											disabled: n === e.questions.length - 1,
											onClick: () => l(n, 1),
											"aria-label": "Move down",
											children: /* @__PURE__ */ z(le, {})
										}),
										/* @__PURE__ */ z(r, {
											size: "icon-sm",
											variant: "ghost",
											className: "text-danger-fg",
											onClick: () => o({ questions: e.questions.filter((e, t) => t !== n) }),
											"aria-label": "Remove question",
											children: /* @__PURE__ */ z(se, {})
										})
									]
								}),
								/* @__PURE__ */ B("div", {
									className: "grid gap-3 md:grid-cols-[1fr_auto]",
									children: [/* @__PURE__ */ z(d, {
										value: t.help,
										onChange: (e) => s(n, { help: e.target.value }),
										placeholder: "Hint (optional)",
										className: "text-xs"
									}), /* @__PURE__ */ B("label", {
										className: "inline-flex items-center gap-2 text-xs text-muted",
										children: [/* @__PURE__ */ z(y, {
											checked: t.required,
											onCheckedChange: (e) => s(n, { required: e })
										}), " Required"]
									})]
								}),
								t.kind === "choice" && /* @__PURE__ */ z(C, {
									rows: 3,
									value: t.choicesText ?? t.choices.join("\n"),
									onChange: (e) => s(n, { choicesText: e.target.value }),
									placeholder: "One choice per line",
									className: "font-mono text-xs"
								})
							]
						}, n)),
						/* @__PURE__ */ B(r, {
							onClick: () => o({ questions: [...e.questions, {
								id: "",
								label: "",
								help: "",
								kind: "text",
								choices: [],
								required: !1
							}] }),
							children: [/* @__PURE__ */ z(J, {}), " Add question"]
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region src/review.tsx
var De = [
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
function Oe() {
	let e = re(), n = M("recruit.manage_forms"), [a, o] = L("open"), [s, c] = L(""), [u, d] = L("");
	ae(() => {
		let e = setTimeout(() => d(s.trim()), 300);
		return () => clearTimeout(e);
	}, [s]);
	let { data: m, isLoading: h } = P({
		queryKey: [
			"recruit",
			"queue",
			a,
			u
		],
		queryFn: () => E.get(`${Q}/applications?status=${a}&q=${encodeURIComponent(u)}`),
		refetchInterval: 6e4
	});
	return /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(f, {
		eyebrow: "Recruitment",
		title: "Applications",
		icon: /* @__PURE__ */ z(H, {}),
		description: "People who want to join. Open one to see their answers and characters, talk to them, and accept or reject.",
		actions: n ? /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(I, {
			to: "/p/recruit/settings",
			children: /* @__PURE__ */ B(r, {
				variant: "ghost",
				children: [/* @__PURE__ */ z(de, {}), " Settings"]
			})
		}), /* @__PURE__ */ z(I, {
			to: "/p/recruit/forms",
			children: /* @__PURE__ */ B(r, { children: [/* @__PURE__ */ z(Y, {}), " Forms"] })
		})] }) : void 0
	}), /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ B("div", {
		className: "flex flex-wrap items-center gap-3 border-b border-border px-card py-3",
		children: [/* @__PURE__ */ z("div", {
			className: "flex flex-wrap gap-1",
			children: De.map((e) => /* @__PURE__ */ B("button", {
				type: "button",
				onClick: () => o(e.value),
				className: `inline-flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${a === e.value ? "bg-accent-soft text-text" : "text-muted hover:bg-hover hover:text-text"}`,
				children: [e.label, m && /* @__PURE__ */ z("span", {
					className: "font-mono text-[11px] text-subtle",
					children: m.counts[e.count]
				})]
			}, e.value))
		}), /* @__PURE__ */ z(p, {
			value: s,
			onChange: (e) => c(e.target.value),
			placeholder: "Find a pilot or form",
			className: "ml-auto w-64",
			"aria-label": "Search applications"
		})]
	}), h || !m ? /* @__PURE__ */ z("div", {
		className: "p-card",
		children: /* @__PURE__ */ z(g, { className: "h-40" })
	}) : m.items.length === 0 ? /* @__PURE__ */ z(l, {
		icon: /* @__PURE__ */ z(H, {}),
		title: a === "open" ? "No open applications" : "Nothing here",
		description: a === "open" ? "New applications show up here, and recruiters get a notification." : void 0
	}) : /* @__PURE__ */ B(x, { children: [/* @__PURE__ */ z(b, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(w, { children: "Applicant" }),
		/* @__PURE__ */ z(w, { children: "Form" }),
		/* @__PURE__ */ z(w, { children: "Status" }),
		/* @__PURE__ */ z(w, { children: "Recruiter" }),
		/* @__PURE__ */ z(w, {
			align: "right",
			children: "Applied"
		})
	] }) }), /* @__PURE__ */ z("tbody", { children: m.items.map((n) => /* @__PURE__ */ B(T, {
		interactive: !0,
		onClick: () => e(`/p/recruit/applications/${n.id}`),
		children: [
			/* @__PURE__ */ z(S, { children: /* @__PURE__ */ B("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ z(t, {
					src: n.user.portrait,
					name: n.user.name,
					size: "sm"
				}), /* @__PURE__ */ z("span", {
					className: "font-medium",
					children: n.user.name
				})]
			}) }),
			/* @__PURE__ */ z(S, {
				className: "text-muted",
				children: n.form.name
			}),
			/* @__PURE__ */ z(S, { children: /* @__PURE__ */ z($, { status: n.status }) }),
			/* @__PURE__ */ z(S, {
				className: "text-muted",
				children: n.reviewer ?? "—"
			}),
			/* @__PURE__ */ z(S, {
				align: "right",
				className: "text-xs text-muted",
				children: A(n.created_at)
			})
		]
	}, n.id)) })] })] })] });
}
function ke(e) {
	if (!e) return "—";
	let t = (Date.now() - Date.parse(e)) / 315576e5;
	return t >= 1 ? `${t.toFixed(1)} years` : `${Math.round(t * 12)} months`;
}
function Ae({ c: e }) {
	return /* @__PURE__ */ B("li", {
		className: "space-y-2 px-card py-3",
		children: [/* @__PURE__ */ B("div", {
			className: "flex items-center gap-3",
			children: [
				/* @__PURE__ */ z(t, {
					src: e.portrait,
					name: e.name,
					size: "md"
				}),
				/* @__PURE__ */ B("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ B("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ z("span", {
								className: "font-medium",
								children: e.name
							}),
							e.main && /* @__PURE__ */ z(n, {
								tone: "accent",
								children: "main"
							}),
							!e.login_ok && /* @__PURE__ */ z(n, {
								tone: "warning",
								children: "login expired"
							})
						]
					}), /* @__PURE__ */ z("div", {
						className: "truncate text-xs text-muted",
						children: [e.corporation, e.alliance].filter(Boolean).join(" · ") || "No corporation"
					})]
				}),
				/* @__PURE__ */ z(I, {
					to: `/characters/${e.id}`,
					target: "_blank",
					className: "text-subtle hover:text-text",
					"aria-label": `Open ${e.name}'s character sheet`,
					children: /* @__PURE__ */ z(q, {})
				})
			]
		}), /* @__PURE__ */ B("dl", {
			className: "grid grid-cols-3 gap-x-3 gap-y-1 text-xs",
			children: [
				/* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("dt", {
					className: "text-subtle",
					children: "Skill points"
				}), /* @__PURE__ */ z("dd", {
					className: "font-mono",
					children: e.total_sp == null ? "—" : `${(e.total_sp / 1e6).toFixed(1)}M`
				})] }),
				/* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("dt", {
					className: "text-subtle",
					children: "Wallet"
				}), /* @__PURE__ */ z("dd", {
					className: "font-mono",
					children: e.wallet == null ? "—" : te(e.wallet)
				})] }),
				/* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("dt", {
					className: "text-subtle",
					children: "Age"
				}), /* @__PURE__ */ z("dd", {
					className: "font-mono",
					children: ke(e.birthday)
				})] }),
				/* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("dt", {
					className: "text-subtle",
					children: "Security"
				}), /* @__PURE__ */ z("dd", {
					className: "font-mono",
					children: e.security_status == null ? "—" : e.security_status.toFixed(1)
				})] }),
				/* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("dt", {
					className: "text-subtle",
					children: "Kills / losses"
				}), /* @__PURE__ */ B("dd", {
					className: "font-mono",
					children: [
						k(e.kills),
						" / ",
						k(e.losses)
					]
				})] })
			]
		})]
	});
}
function je() {
	let { id: e } = ie(), t = F(), s = ne(), d = [
		"recruit",
		"application",
		e
	], { data: p, isLoading: m, error: h } = P({
		queryKey: d,
		queryFn: () => E.get(`${Q}/applications/${e}`)
	}), [_, v] = L(null), [y, b] = L(""), x = (e) => {
		t.setQueryData(d, e), t.invalidateQueries({ queryKey: ["recruit", "queue"] });
	}, S = N({
		mutationFn: () => E.post(`${Q}/applications/${e}/claim`),
		onSuccess: x,
		onError: (e) => j.error(e.message)
	}), w = N({
		mutationFn: (t) => E.post(`${Q}/applications/${e}/decide`, {
			accept: t,
			message: y
		}),
		onSuccess: (e) => {
			x(e), v(null), b(""), j.success(e.status === "accepted" ? `${e.user.name} accepted` : `${e.user.name} rejected`);
		},
		onError: (e) => j.error(e.message)
	});
	if (h) return /* @__PURE__ */ z(l, {
		icon: /* @__PURE__ */ z(H, {}),
		title: "Application not found",
		action: /* @__PURE__ */ z(I, {
			to: "/p/recruit",
			children: /* @__PURE__ */ z(r, { children: "Back to applications" })
		})
	});
	if (m || !p) return /* @__PURE__ */ z(g, { className: "h-96" });
	let T = p.status === "new" || p.status === "review";
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ B(I, {
			to: "/p/recruit",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ z(X, {}), " Applications"]
		}),
		/* @__PURE__ */ z(f, {
			eyebrow: p.form.name,
			title: p.user.name,
			description: `Applied ${O(p.created_at)}${p.referrer ? ` · referred by ${p.referrer.name}` : ""}${p.reviewer ? ` · recruiter: ${p.reviewer}` : ""}`,
			icon: p.user.portrait ? /* @__PURE__ */ z("img", {
				src: p.user.portrait,
				alt: "",
				className: "size-full object-cover"
			}) : /* @__PURE__ */ z(H, {}),
			actions: T ? /* @__PURE__ */ B("div", {
				className: "flex flex-wrap gap-2",
				children: [
					p.reviewer_id !== s?.id && /* @__PURE__ */ B(r, {
						onClick: () => S.mutate(),
						loading: S.isPending,
						children: [
							!S.isPending && /* @__PURE__ */ z(oe, {}),
							" ",
							p.reviewer ? "Take over" : "Take it"
						]
					}),
					/* @__PURE__ */ B(r, {
						variant: "danger",
						onClick: () => v("reject"),
						children: [/* @__PURE__ */ z(W, {}), " Reject"]
					}),
					/* @__PURE__ */ B(r, {
						variant: "primary",
						onClick: () => v("accept"),
						children: [/* @__PURE__ */ z(U, {}), " Accept"]
					})
				]
			}) : /* @__PURE__ */ z($, { status: p.status })
		}),
		/* @__PURE__ */ B("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_420px]",
			children: [/* @__PURE__ */ B("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ z(i, { children: /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(fe, { app: p }) }) }),
					/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, { title: "Answers" }), /* @__PURE__ */ B(a, {
						className: "space-y-5 text-sm",
						children: [(p.questions ?? []).length === 0 && /* @__PURE__ */ z("p", {
							className: "text-muted",
							children: "This form has no questions."
						}), (p.questions ?? []).map((e) => /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("div", {
							className: "text-xs font-medium uppercase tracking-wider text-subtle",
							children: e.label
						}), /* @__PURE__ */ z("div", {
							className: "mt-1",
							children: /* @__PURE__ */ z(me, { value: e.answer })
						})] }, e.id))]
					})] }),
					/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, {
						title: "Notes and messages",
						description: "Internal notes are only for recruiters; messages go to the applicant."
					}), /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(ge, {
						comments: p.comments ?? [],
						recruiter: !0,
						onSend: (t, n) => E.post(`${Q}/applications/${e}/comments`, {
							text: t,
							internal: n
						}).then(x)
					}) })] })
				]
			}), /* @__PURE__ */ B("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, {
						title: T ? `Characters · ${p.characters?.length ?? 0}` : "Characters",
						description: T ? "Their full character sheets are open to recruiters while the application is open." : void 0
					}), T ? /* @__PURE__ */ z("ul", {
						className: "divide-y divide-border",
						children: (p.characters ?? []).map((e) => /* @__PURE__ */ z(Ae, { c: e }, e.id))
					}) : /* @__PURE__ */ z(a, {
						className: "text-sm text-muted",
						children: "Shown only while the application is open, like their character sheets."
					})] }),
					(p.accept_groups ?? []).length > 0 && /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, { title: "Accepting adds them to" }), /* @__PURE__ */ z(a, {
						className: "flex flex-wrap gap-1.5",
						children: p.accept_groups.map((e) => /* @__PURE__ */ z(n, { children: e }, e))
					})] }),
					(p.history ?? []).length > 0 && /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, { title: "Earlier applications" }), /* @__PURE__ */ z("ul", {
						className: "divide-y divide-border",
						children: p.history.map((e) => /* @__PURE__ */ z("li", { children: /* @__PURE__ */ B(I, {
							to: `/p/recruit/applications/${e.id}`,
							className: "flex items-center justify-between gap-3 px-card py-3 text-sm hover:bg-hover",
							children: [/* @__PURE__ */ z("span", { children: e.form }), /* @__PURE__ */ B("span", {
								className: "flex items-center gap-3 text-xs text-muted",
								children: [
									O(e.created_at),
									" ",
									/* @__PURE__ */ z($, { status: e.status })
								]
							})]
						}) }, e.id))
					})] })
				]
			})]
		}),
		/* @__PURE__ */ z(c, {
			open: _ !== null,
			onOpenChange: (e) => !e && v(null),
			title: _ === "accept" ? `Accept ${p.user.name}?` : `Reject ${p.user.name}?`,
			description: _ === "accept" ? (p.accept_groups ?? []).length > 0 ? `They're added to ${p.accept_groups.join(", ")} and told straight away.` : "They're told straight away. This form adds them to no groups." : "They're told straight away. They can apply again later.",
			footer: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(r, {
				variant: "ghost",
				onClick: () => v(null),
				children: "Cancel"
			}), /* @__PURE__ */ z(r, {
				variant: _ === "accept" ? "primary" : "solidDanger",
				loading: w.isPending,
				onClick: () => w.mutate(_ === "accept"),
				children: _ === "accept" ? /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(U, {}), " Accept"] }) : /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(W, {}), " Reject"] })
			})] }),
			children: /* @__PURE__ */ z(u, {
				label: "Message to them (optional)",
				hint: "Sent with the notification and shown on their application.",
				children: /* @__PURE__ */ z(C, {
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
//#region src/settings.tsx
var Me = ["recruit", "settings"];
function Ne() {
	let { data: e, isLoading: t } = P({
		queryKey: Me,
		queryFn: () => E.get(`${Q}/settings`)
	});
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ B(I, {
			to: "/p/recruit",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ z(X, {}), " Applications"]
		}),
		/* @__PURE__ */ z(f, {
			eyebrow: "Recruitment",
			title: "Settings",
			icon: /* @__PURE__ */ z(de, {}),
			description: "Rules for everyone who applies, whichever form they use."
		}),
		/* @__PURE__ */ z("div", {
			className: "max-w-3xl",
			children: t || !e ? /* @__PURE__ */ z(g, { className: "h-32" }) : /* @__PURE__ */ z(Pe, { settings: e })
		})
	] });
}
function Pe({ settings: t }) {
	let n = F(), r = N({
		mutationFn: (e) => E.put(`${Q}/settings`, { require_discord: e }),
		onSuccess: (e) => {
			n.setQueryData(Me, e), j.success(e.require_discord ? "Applicants now need Discord" : "Discord is no longer needed to apply");
		},
		onError: (e) => j.error(e.message)
	}), { installed: o, enabled: s, configured: c } = t.discord_plugin, l = o ? s ? c ? "" : "The Discord plugin isn't set up yet, so this isn't checked. Finish its setup on the Discord page." : "The Discord plugin is installed but switched off, so this isn't checked. Switch it on under Administration → Plugins." : "The Discord plugin isn't installed. Install it under Administration → Plugins to use this.";
	return /* @__PURE__ */ z(i, { children: /* @__PURE__ */ B(a, {
		className: "space-y-3",
		children: [/* @__PURE__ */ B("label", {
			className: "flex items-start gap-3 text-sm",
			children: [/* @__PURE__ */ z(y, {
				checked: t.require_discord,
				disabled: r.isPending || !o && !t.require_discord,
				onCheckedChange: (e) => r.mutate(e),
				"aria-label": "Require Discord"
			}), /* @__PURE__ */ B("span", { children: [
				/* @__PURE__ */ z("span", {
					className: "font-medium",
					children: "Require Discord"
				}),
				/* @__PURE__ */ z("span", {
					className: "block text-muted",
					children: "Applicants must link their Discord account and be on your Discord server before they can send an application."
				}),
				/* @__PURE__ */ z("span", {
					className: "mt-1 block text-xs text-subtle",
					children: "Needs the Discord plugin installed, switched on and set up. Applicants also need the \"Can link a Discord account\" permission, which every state has unless you took it away."
				})
			] })]
		}), l && /* @__PURE__ */ z(e, {
			tone: "warning",
			title: t.require_discord ? "Not being checked" : "Discord plugin needed",
			children: l
		})]
	}) });
}
//#endregion
//#region src/index.tsx
function Fe() {
	return M("recruit.review_applications") ? /* @__PURE__ */ z(Oe, {}) : /* @__PURE__ */ z(be, {});
}
function Ie() {
	let { data: e, isLoading: t } = P({
		queryKey: [
			"recruit",
			"queue",
			"open",
			""
		],
		queryFn: () => E.get(`${Q}/applications?status=open`),
		refetchInterval: 12e4
	});
	if (t || !e) return /* @__PURE__ */ z(g, { className: "h-16" });
	let { open: r, new: i, mine: a } = e.counts;
	return /* @__PURE__ */ z(I, {
		to: "/p/recruit",
		className: "block",
		children: /* @__PURE__ */ B("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ B("div", { children: [
				/* @__PURE__ */ z("div", {
					className: "text-xs text-muted",
					children: "Open applications"
				}),
				/* @__PURE__ */ z("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: r
				}),
				/* @__PURE__ */ B("div", {
					className: "text-xs text-subtle",
					children: [a, " with you"]
				})
			] }), i > 0 ? /* @__PURE__ */ B(n, {
				tone: "info",
				children: [i, " new"]
			}) : /* @__PURE__ */ z(n, {
				tone: "success",
				children: "All picked up"
			})]
		})
	});
}
var Le = ee({
	routes: [
		{
			path: "",
			Component: Fe
		},
		{
			path: "apply",
			Component: be
		},
		{
			path: "applications/:id",
			Component: je
		},
		{
			path: "forms",
			Component: Te
		},
		{
			path: "referrals",
			Component: ve
		},
		{
			path: "settings",
			Component: Ne
		}
	],
	widgets: [{
		id: "queue",
		title: "Recruitment",
		Component: Ie,
		size: "sm",
		order: 30,
		permission: "recruit.review_applications"
	}]
});
//#endregion
export { Le as default };

export const classes = ["!configured","!data","!enabled","!form","!installed","!o","@conduit/sdk","@tanstack/react-query","a","aboard!","about","above","absolute","accent","accept","accept_groups","accepted","account","action","actions","active","add","added","adds","after","again","align","alliance","also","alt","an","and","answer","answers","app","applicant","applicants","application","applications","apply","are","aria-expanded","aria-label","aria-pressed","aria-selected","as","ask","async","at","author","author_id","autoComplete","await","back","be","been","before","being","bg-accent-soft","bg-border","bg-danger-soft","bg-hover","bg-success-soft","bg-surface-2/40","bg-surface-2/60","bg-surface-raised","bg-warning-soft/60","birthday","block","blur","body","boolean","border","border-accent","border-b","border-border","border-border-strong","border-danger/35","border-success/35","border-t","border-warning/30","both","bring","brought","but","button","by","c","came","can","canManage","catch","character","characters","check","checked","checking","children","choice","choices","choicesText","claim","claimed","className","click","close","combobox","come","comments","configured","confirmLabel","const","control","conversation","corporation","couldn","count","counts","created_at","ctrlKey","current","currentColor","cx","cy","d","danger","data","decide","decided","decided_at","deciding","decision","decision_message","default","description","detail","did","disabled","discord","discordBlocked","discord_plugin","divide-border","divide-y","do","doing","done","down","dq","draft","each","edit","else","enabled","enjoy","error","event","every","everyone","example","experienced","expired","export","eyebrow","false","few","field","fill","finally","first","flex","flex-1","flex-wrap","follow","font-medium","font-mono","font-semibold","footer","for","form","form_id","forms","found","from","full","function","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-6","gap-x-3","gap-y-1","get","ghost","go","grid","grid-cols-3","groups","h-16","h-32","h-40","h-64","h-96","h-px","happens","has","have","hear","height","help","here","hi","hint","history","hits","hover:bg-hover","hover:border-accent/60","hover:text-text","how","i","icon","icon-sm","icons","id","if","import","in","in_progress","info","inline","inline-flex","input","inset-x-0","installed","instanceof","interactive","interface","internal","is","isLoading","isPending","is_recruiter","isn","it","italic","items","items-center","items-end","items-start","its","just","justify-between","key","keyof","kills","kind","label","land","latest","least","length","let","letters","like","line","line-clamp-2","line-clamp-3","link","linked","list","listbox","ll","loading","login","login_ok","long","longer","looking","losses","m12","m15.477","m18","m21.854","m6","main","manage_forms","many","max-h-56","max-w-3xl","max-w-sm","max-w-xs","may","mb-1","mb-4","mb-6","md","md:grid-cols-2","md:grid-cols-[1fr_auto]","me","member","members","message","messages","min-w-0","mine","missing","ml-0.5","ml-auto","months","more","mostly","move","mt-1","mt-2","mt-3","mt-6","must","mutationFn","n","name","named","names","navigate","need","needed","needs","neutral","never","new","no","none","not","not_accepted","note","notes","notification","now","null","number","object-cover","of","off","ok","on","onBlur","onChange","onCheck","onCheckedChange","onClick","onConfirm","onError","onFocus","onKeyDown","onMouseDown","onMouseEnter","onOpenChange","onSave","onSend","onSuccess","on_server","once","one","only","open","option","options","or","order","other","our","outline","over","overflow-y-auto","own","p-0.5","p-1","p-3","p-card","part","past","patch","path","pb-2","people","per","permission","pick","picked","pilot","pilots","pl-1","place-items-center","placeholder","play","plugin","points","pops","portrait","post","pr-1.5","primary","problem","progress","pt-5","put","px-2","px-3","px-card","py-1","py-1.5","py-2.5","py-3","q","qc","qs","queryFn","queryKey","question","questions","queue","re","react","react-router","recruit","recruited","recruiter","recruiters","recruiting","referrals","referred","referrer","referrer_id","referrers","refetch","refetchInterval","refresh","reject","rejected","relative","require_discord","required","requires","rest","return","review","review_applications","reviewer","reviewer_id","right","role","round","routes","row","rows","rx","ry","s","save","saved","saving","say","search","secondary","security_status","see","sees","self-end","send","sends","server","set","setActive","setAnswers","setBusy","setDeciding","setDeleting","setDq","setDraft","setForm","setInternal","setMessage","setOpen","setQ","setReferrer","setSearch","setStatus","setText","setWithdrawing","settings","setup","shadow-e3","sheet","sheets","show","shown","shrink-0","side","site","size","size-10","size-3","size-3.5","size-4","size-5","size-full","sm","sm:grid-cols-2","so","solidDanger","someone","space-y-1.5","space-y-2","space-y-3","space-y-4","space-y-5","space-y-6","src","starts","state","status","steps","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","submit","success","switched","t","tabular-nums","talk","target","text","text-3xl","text-[11px]","text-[13px]","text-accent-ink","text-center","text-danger-fg","text-left","text-muted","text-sm","text-subtle","text-text","text-xs","that","the","their","them","then","they","this","three","time","title","to","toast","toggle","told","tone","took","top-full","total_sp","tracking-wider","transition-colors","true","truncate","try","type","undefined","under","unless","up","updated_at","uppercase","us","use","useHasPerm","useParams","useQuery","useQueryClient","useState","used","user","username","v","value","variant","viewBox","voice","void","w-40","w-64","w-full","waiting","wallet","want","warning","was","wasn","weeks","welcome","what","when","which","whichever","while","whitespace-pre-line","who","widgets","width","will","with","withdrawn","withdrew","would","write","x","xl","xl:grid-cols-4","xl:grid-cols-[1fr_380px]","xl:grid-cols-[1fr_420px]","xs","years","yes","yesno","yet","you","your","z-10","zone"];
