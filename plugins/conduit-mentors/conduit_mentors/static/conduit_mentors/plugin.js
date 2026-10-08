import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, Dialog as c, EmptyState as l, Field as u, Input as d, PageHeader as f, Progress as p, RuleSetEditor as m, Segmented as h, Select as g, Skeleton as _, StatCard as v, Switch as y, THead as b, TabPanel as x, Table as S, Tabs as C, Td as w, Textarea as T, Th as E, Tr as D, api as O, cn as k, date as A, definePlugin as ee, timeAgo as j, toast as M } from "@conduit/sdk";
import { useMutation as N, useQuery as P, useQueryClient as F } from "@tanstack/react-query";
import { Link as I, useNavigate as L, useParams as te } from "react-router";
import { useEffect as R, useState as z } from "react";
import { Fragment as B, jsx as V, jsxs as H } from "react/jsx-runtime";
//#region src/icons.tsx
function U({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ V("svg", {
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
var W = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" }),
		/* @__PURE__ */ V("path", { d: "M22 10v6" }),
		/* @__PURE__ */ V("path", { d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5" })
	]
}), ne = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
		/* @__PURE__ */ V("circle", {
			cx: "9",
			cy: "7",
			r: "4"
		}),
		/* @__PURE__ */ V("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
		/* @__PURE__ */ V("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
	]
}), G = (e) => /* @__PURE__ */ V(U, {
	...e,
	children: /* @__PURE__ */ V("path", { d: "M20 6 9 17l-5-5" })
}), K = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [/* @__PURE__ */ V("path", { d: "M18 6 6 18" }), /* @__PURE__ */ V("path", { d: "m6 6 12 12" })]
}), re = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [/* @__PURE__ */ V("rect", {
		width: "18",
		height: "11",
		x: "3",
		y: "11",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ V("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })]
}), ie = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [/* @__PURE__ */ V("path", { d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" }), /* @__PURE__ */ V("path", { d: "m21.854 2.147-10.94 10.939" })]
}), ae = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M18 11V6a2 2 0 0 0-4 0v5" }),
		/* @__PURE__ */ V("path", { d: "M14 10V4a2 2 0 0 0-4 0v6" }),
		/* @__PURE__ */ V("path", { d: "M10 10.5V6a2 2 0 0 0-4 0v8" }),
		/* @__PURE__ */ V("path", { d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" })
	]
}), oe = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ V("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ V("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), se = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [/* @__PURE__ */ V("path", { d: "M5 12h14" }), /* @__PURE__ */ V("path", { d: "M12 5v14" })]
}), ce = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M3 6h18" }),
		/* @__PURE__ */ V("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ V("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), le = (e) => /* @__PURE__ */ V(U, {
	...e,
	children: /* @__PURE__ */ V("path", { d: "m18 15-6-6-6 6" })
}), ue = (e) => /* @__PURE__ */ V(U, {
	...e,
	children: /* @__PURE__ */ V("path", { d: "m6 9 6 6 6-6" })
}), de = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [/* @__PURE__ */ V("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), /* @__PURE__ */ V("path", { d: "M3 3v5h5" })]
}), fe = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [/* @__PURE__ */ V("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ V("path", { d: "M19 12H5" })]
}), pe = (e) => /* @__PURE__ */ V(U, {
	...e,
	children: /* @__PURE__ */ V("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" })
}), me = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [
		/* @__PURE__ */ V("path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }),
		/* @__PURE__ */ V("path", { d: "M20 3v4" }),
		/* @__PURE__ */ V("path", { d: "M22 5h-4" })
	]
}), q = (e) => /* @__PURE__ */ H(U, {
	...e,
	children: [/* @__PURE__ */ V("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ V("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), J = "/api/p/mentors", Y = {
	waiting: {
		label: "Waiting for a mentor",
		tone: "info"
	},
	active: {
		label: "Being mentored",
		tone: "accent"
	},
	graduated: {
		label: "Graduated",
		tone: "success"
	},
	ended: {
		label: "Ended",
		tone: "neutral"
	}
};
//#endregion
//#region src/shared.tsx
function X({ status: e }) {
	return /* @__PURE__ */ V(n, {
		tone: Y[e].tone,
		children: Y[e].label
	});
}
function Z({ areas: e, value: t, onChange: r }) {
	return r ? /* @__PURE__ */ V("div", {
		className: "flex flex-wrap gap-1.5",
		children: e.map((e) => {
			let n = t.includes(e);
			return /* @__PURE__ */ V("button", {
				type: "button",
				"aria-pressed": n,
				onClick: () => r(n ? t.filter((t) => t !== e) : [...t, e]),
				className: k("border px-2.5 py-1 text-xs transition-colors", n ? "border-accent bg-accent-soft text-text" : "border-border text-muted hover:bg-hover hover:text-text"),
				children: e
			}, e);
		})
	}) : t.length === 0 ? /* @__PURE__ */ V("span", {
		className: "text-xs text-subtle",
		children: "No focus given"
	}) : /* @__PURE__ */ V("div", {
		className: "flex flex-wrap gap-1.5",
		children: t.map((e) => /* @__PURE__ */ V(n, { children: e }, e))
	});
}
function Q({ done: e, total: t }) {
	return /* @__PURE__ */ H("div", {
		className: "space-y-1",
		children: [/* @__PURE__ */ H("div", {
			className: "flex justify-between text-xs text-muted",
			children: [/* @__PURE__ */ V("span", { children: "Goals" }), /* @__PURE__ */ H("span", {
				className: "font-mono tabular-nums",
				children: [
					e,
					" / ",
					t
				]
			})]
		}), /* @__PURE__ */ V(p, {
			value: t ? e / t : 0,
			tone: e === t && t > 0 ? "success" : "accent",
			size: "sm"
		})]
	});
}
function he({ goals: e, canTick: t, onTick: r }) {
	return e.length === 0 ? /* @__PURE__ */ V("p", {
		className: "text-sm text-muted",
		children: "The program has no goals yet."
	}) : /* @__PURE__ */ V("ol", {
		className: "divide-y divide-border",
		children: e.map((e) => {
			let i = t(e) && !e.by_rules;
			return /* @__PURE__ */ H("li", {
				className: "flex gap-3 py-3",
				children: [/* @__PURE__ */ V("button", {
					type: "button",
					disabled: !i,
					onClick: () => r(e, !e.done),
					"aria-label": e.done ? `Untick ${e.title}` : `Tick ${e.title}`,
					className: k("mt-0.5 flex size-5 shrink-0 items-center justify-center border transition-colors", e.done ? "border-success bg-success text-white" : "border-border-strong", i ? "cursor-pointer hover:border-accent" : "cursor-default"),
					children: e.done && /* @__PURE__ */ V(G, { className: "size-3.5" })
				}), /* @__PURE__ */ H("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ H("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ V("span", {
									className: k("text-sm font-medium", e.done && "text-muted"),
									children: e.title
								}),
								e.auto && /* @__PURE__ */ V(n, {
									tone: "info",
									children: "ticks itself"
								}),
								!e.auto && e.mentee_can_tick && /* @__PURE__ */ V(n, { children: "you can tick it" })
							]
						}),
						e.description && /* @__PURE__ */ V("p", {
							className: "mt-0.5 text-xs text-muted",
							children: e.description
						}),
						e.auto && /* @__PURE__ */ V("ul", {
							className: "mt-1.5 space-y-0.5",
							children: e.checks.map((e, t) => /* @__PURE__ */ H("li", {
								className: k("flex items-center gap-1.5 text-xs", e.ok ? "text-success-fg" : "text-subtle"),
								children: [/* @__PURE__ */ V("span", { className: k("size-1.5 shrink-0", e.ok ? "bg-success" : "bg-border-strong") }), e.text]
							}, t))
						}),
						e.done && e.done_by && !e.by_rules && /* @__PURE__ */ H("div", {
							className: "mt-1 text-[11px] text-subtle",
							children: [
								"Ticked by ",
								e.done_by,
								e.done_at && `, ${j(e.done_at)}`
							]
						})
					]
				})]
			}, e.id);
		})
	});
}
var $ = {
	requested: "asked for a mentor",
	assigned: "",
	withdrawn: "withdrew the request",
	graduated: "graduated them",
	ended: "ended the mentorship",
	reopened: "reopened the mentorship"
};
function ge({ messages: e, staff: i, onSend: a, disabled: o }) {
	let [s, c] = z(""), [l, u] = z(!1), [d, f] = z(!1), p = async () => {
		if (s.trim()) {
			f(!0);
			try {
				await a(s, l), c("");
			} catch (e) {
				M.error(e instanceof Error ? e.message : "Couldn't send");
			} finally {
				f(!1);
			}
		}
	};
	return /* @__PURE__ */ H("div", {
		className: "space-y-4",
		children: [e.length === 0 ? /* @__PURE__ */ V("p", {
			className: "text-sm text-muted",
			children: "No messages yet."
		}) : /* @__PURE__ */ V("ol", {
			className: "space-y-3",
			children: e.map((e) => e.event && e.event in $ ? /* @__PURE__ */ H("li", {
				className: "flex items-center gap-2 text-xs text-muted",
				children: [
					/* @__PURE__ */ V("span", { className: "h-px flex-1 bg-border" }),
					/* @__PURE__ */ H("span", {
						className: "text-center",
						children: [
							$[e.event] ? /* @__PURE__ */ H(B, { children: [
								/* @__PURE__ */ V("span", {
									className: "font-medium text-text",
									children: e.author
								}),
								" ",
								$[e.event]
							] }) : /* @__PURE__ */ V("span", {
								className: "font-medium text-text",
								children: e.text
							}),
							" ",
							"· ",
							j(e.created_at),
							(e.event === "graduated" || e.event === "ended") && e.text && e.text !== "Graduated" && /* @__PURE__ */ H("span", {
								className: "block italic",
								children: [
									"“",
									e.text,
									"”"
								]
							})
						]
					}),
					/* @__PURE__ */ V("span", { className: "h-px flex-1 bg-border" })
				]
			}, e.id) : /* @__PURE__ */ H("li", {
				className: k("flex gap-3 border p-3", e.private ? "border-warning/30 bg-warning-soft/60" : "border-border bg-surface-2/60"),
				children: [/* @__PURE__ */ V(t, {
					src: e.portrait,
					name: e.author,
					size: "sm"
				}), /* @__PURE__ */ H("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ H("div", {
						className: "flex flex-wrap items-center gap-2 text-xs",
						children: [
							/* @__PURE__ */ V("span", {
								className: "font-medium text-text",
								children: e.author
							}),
							/* @__PURE__ */ V("span", {
								className: "text-subtle",
								children: j(e.created_at)
							}),
							e.private && /* @__PURE__ */ H(n, {
								tone: "warning",
								children: [/* @__PURE__ */ V(re, { className: "size-3" }), " private note"]
							})
						]
					}), /* @__PURE__ */ V("p", {
						className: "mt-1 whitespace-pre-line text-sm",
						children: e.text
					})]
				})]
			}, e.id))
		}), !o && /* @__PURE__ */ H("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ V(T, {
				rows: 3,
				value: s,
				onChange: (e) => c(e.target.value),
				placeholder: l ? "A note for mentors and program managers…" : "Write a message…",
				onKeyDown: (e) => {
					e.key === "Enter" && (e.ctrlKey || e.metaKey) && p();
				}
			}), /* @__PURE__ */ H("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [i ? /* @__PURE__ */ H("label", {
					className: "inline-flex items-center gap-2 text-sm text-muted",
					children: [/* @__PURE__ */ V(y, {
						checked: l,
						onCheckedChange: u
					}), l ? "Private note: the mentee doesn't see it" : "Message: everyone in the mentorship sees it"]
				}) : /* @__PURE__ */ V("span", {
					className: "text-xs text-subtle",
					children: "Ctrl+Enter sends"
				}), /* @__PURE__ */ H(r, {
					variant: l ? "secondary" : "primary",
					loading: d,
					disabled: !s.trim(),
					onClick: p,
					children: [
						!d && V(l ? re : ie, {}),
						" ",
						l ? "Add note" : "Send"
					]
				})]
			})]
		})]
	});
}
function _e({ mentorship: e, onClose: t, onDone: n }) {
	return /* @__PURE__ */ V(s, {
		open: e !== null,
		onOpenChange: (e) => !e && t(),
		title: `Reopen ${e?.mentee.name}'s mentorship?`,
		description: e?.mentor ? `It goes back to ${e.mentor.name}, if they still mentor (otherwise back on the waiting list), with the goals ticked so far and the thread. Both are told.` : "It goes back on the waiting list, with the goals ticked so far and the thread. They're told.",
		confirmLabel: "Reopen",
		onConfirm: () => O.post(`${J}/m/${e.id}/reopen`).then((e) => {
			M.success(`${e.mentee.name}'s mentorship is open again`), n(e);
		}, (e) => {
			throw M.error(e.message), e;
		})
	});
}
//#endregion
//#region src/home.tsx
var ve = ["mentors", "overview"];
function ye() {
	let { data: e, isLoading: t } = P({
		queryKey: ve,
		queryFn: () => O.get(J)
	});
	return t || !e ? /* @__PURE__ */ V(_, { className: "h-96" }) : /* @__PURE__ */ H(B, { children: [/* @__PURE__ */ V(f, {
		eyebrow: "Community",
		title: "Mentoring",
		icon: /* @__PURE__ */ V(W, {}),
		description: "New members get a mentor to show them the ropes, with goals to work through together.",
		actions: e.can_manage ? /* @__PURE__ */ V(I, {
			to: "/p/mentors/program",
			children: /* @__PURE__ */ H(r, { children: [/* @__PURE__ */ V(q, {}), " Program"] })
		}) : void 0
	}), /* @__PURE__ */ H("div", {
		className: "space-y-6",
		children: [
			e.mine ? /* @__PURE__ */ V(be, { m: e.mine }) : /* @__PURE__ */ V(xe, { data: e }),
			e.is_mentor && e.profile && /* @__PURE__ */ V(Ce, {
				data: e,
				profile: e.profile
			}),
			!e.is_mentor && e.can_manage && e.waiting && e.waiting.length > 0 && /* @__PURE__ */ V(Te, {
				rows: e.waiting,
				focus: []
			}),
			e.past.length > 0 && /* @__PURE__ */ V(De, { rows: e.past })
		]
	})] });
}
function be({ m: e }) {
	return /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, {
		title: "Your mentorship",
		actions: /* @__PURE__ */ V(X, { status: e.status })
	}), /* @__PURE__ */ H(a, {
		className: "flex flex-wrap items-center gap-6",
		children: [
			e.mentor ? /* @__PURE__ */ H("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ V(t, {
					src: e.mentor.portrait,
					name: e.mentor.name,
					size: "lg"
				}), /* @__PURE__ */ H("div", { children: [
					/* @__PURE__ */ V("div", {
						className: "text-xs text-muted",
						children: "Your mentor"
					}),
					/* @__PURE__ */ V("div", {
						className: "font-medium",
						children: e.mentor.name
					}),
					e.mentor_profile?.play_time && /* @__PURE__ */ H("div", {
						className: "text-xs text-subtle",
						children: ["Plays ", e.mentor_profile.play_time]
					})
				] })]
			}) : /* @__PURE__ */ H("p", {
				className: "text-sm text-muted",
				children: [
					e.requested_mentor ? `You asked for ${e.requested_mentor.name}.` : "You asked for any mentor.",
					" Mentors have been told; you'll get a notification when one takes you on. You asked ",
					j(e.created_at),
					"."
				]
			}),
			e.status === "active" && /* @__PURE__ */ V("div", {
				className: "min-w-48 flex-1",
				children: /* @__PURE__ */ V(Q, { ...e.progress })
			}),
			/* @__PURE__ */ V(I, {
				to: `/p/mentors/m/${e.id}`,
				className: "ml-auto",
				children: /* @__PURE__ */ V(r, {
					variant: "primary",
					children: "Open"
				})
			})
		]
	})] });
}
function xe({ data: t }) {
	let n = F(), s = L(), [c, l] = z([]), [f, p] = z(""), [m, h] = z(""), [g, _] = z(null), v = N({
		mutationFn: () => O.post(`${J}/request`, {
			focus: c,
			note: f,
			play_time: m,
			mentor_id: g
		}),
		onSuccess: (e) => {
			n.invalidateQueries({ queryKey: ["mentors"] }), M.success("Mentors have been told"), s(`/p/mentors/m/${e.id}`);
		},
		onError: (e) => M.error(e.message)
	});
	return /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, {
		title: "Get a mentor",
		icon: t.suggested ? /* @__PURE__ */ V(me, {}) : void 0,
		description: "A mentor is an experienced member who helps you find your feet: fitting ships, fleets, making ISK and who's who."
	}), /* @__PURE__ */ H(a, {
		className: "space-y-5",
		children: [
			t.suggested && /* @__PURE__ */ V(e, {
				tone: "accent",
				title: "You're new here",
				children: "We'd like to pair you with a mentor. Tell us a little about what you want to do."
			}),
			/* @__PURE__ */ V(u, {
				label: "What would you like help with?",
				children: /* @__PURE__ */ V(Z, {
					areas: t.focus_areas,
					value: c,
					onChange: l
				})
			}),
			/* @__PURE__ */ V(u, {
				label: "When do you usually play?",
				hint: "Your time zone or hours, e.g. EU evenings.",
				children: /* @__PURE__ */ V(d, {
					value: m,
					onChange: (e) => h(e.target.value),
					maxLength: 100,
					className: "max-w-sm"
				})
			}),
			/* @__PURE__ */ V(u, {
				label: "Anything else? (optional)",
				children: /* @__PURE__ */ V(T, {
					rows: 3,
					value: f,
					onChange: (e) => p(e.target.value),
					placeholder: "I've played for a month, mostly missions. I'd like to try small-gang PvP."
				})
			}),
			/* @__PURE__ */ V(u, {
				label: "Mentor",
				hint: t.mentors.length ? "Pick someone, or leave it to whoever is free." : "Nobody has free places right now; ask anyway and a mentor will pick you up.",
				children: /* @__PURE__ */ H("div", {
					className: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
					children: [/* @__PURE__ */ V(Se, {
						selected: g === null,
						onSelect: () => _(null),
						title: "Anyone",
						subtitle: "The first mentor free takes you on"
					}), t.mentors.map((e) => /* @__PURE__ */ V(Se, {
						selected: g === e.id,
						onSelect: () => _(e.id),
						mentor: e
					}, e.id))]
				})
			}),
			/* @__PURE__ */ V("div", {
				className: "flex justify-end",
				children: /* @__PURE__ */ H(r, {
					variant: "primary",
					loading: v.isPending,
					onClick: () => v.mutate(),
					children: [!v.isPending && /* @__PURE__ */ V(ae, {}), " Ask for a mentor"]
				})
			})
		]
	})] });
}
function Se({ selected: e, onSelect: n, mentor: r, title: i, subtitle: a }) {
	return /* @__PURE__ */ H("button", {
		type: "button",
		onClick: n,
		"aria-pressed": e,
		className: `flex gap-3 border p-3 text-left transition-colors ${e ? "border-accent bg-accent-soft" : "border-border hover:bg-hover"}`,
		children: [r ? /* @__PURE__ */ V(t, {
			src: r.portrait,
			name: r.name,
			size: "md"
		}) : /* @__PURE__ */ V("span", {
			className: "flex size-10 items-center justify-center bg-surface-3 text-muted",
			children: /* @__PURE__ */ V(ne, {})
		}), /* @__PURE__ */ H("span", {
			className: "min-w-0 flex-1 space-y-1",
			children: [/* @__PURE__ */ V("span", {
				className: "block font-medium",
				children: r?.name ?? i
			}), r ? /* @__PURE__ */ H(B, { children: [
				r.play_time && /* @__PURE__ */ H("span", {
					className: "block text-xs text-muted",
					children: ["Plays ", r.play_time]
				}),
				r.bio && /* @__PURE__ */ V("span", {
					className: "line-clamp-2 block text-xs text-subtle",
					children: r.bio
				}),
				/* @__PURE__ */ V(Z, {
					areas: [],
					value: r.focus
				})
			] }) : /* @__PURE__ */ V("span", {
				className: "block text-xs text-muted",
				children: a
			})]
		})]
	});
}
function Ce({ data: e, profile: t }) {
	return /* @__PURE__ */ H(B, { children: [
		/* @__PURE__ */ V(we, {
			areas: e.focus_areas,
			profile: t
		}),
		/* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, { title: `Your mentees · ${e.mentees?.length ?? 0} of ${t.capacity}` }), (e.mentees ?? []).length === 0 ? /* @__PURE__ */ V(l, {
			icon: /* @__PURE__ */ V(W, {}),
			title: "No mentees yet",
			description: "Claim someone from the waiting list below."
		}) : /* @__PURE__ */ V(Ee, { rows: e.mentees ?? [] })] }),
		/* @__PURE__ */ V(Te, {
			rows: e.waiting ?? [],
			focus: t.focus
		})
	] });
}
function we({ areas: e, profile: t }) {
	let n = F(), [s, c] = z(t);
	R(() => c(t), [t]);
	let l = N({
		mutationFn: (e) => O.put(`${J}/profile`, e),
		onSuccess: () => {
			n.invalidateQueries({ queryKey: ["mentors"] }), M.success("Profile saved");
		},
		onError: (e) => M.error(e.message)
	}), f = (e) => c((t) => ({
		...t,
		...e
	}));
	return /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, {
		title: "Your mentor profile",
		description: "New members see this when they pick a mentor.",
		actions: /* @__PURE__ */ H("label", {
			className: "inline-flex items-center gap-2 text-sm text-muted",
			children: [/* @__PURE__ */ V(y, {
				checked: s.active,
				onCheckedChange: (e) => l.mutate({
					...s,
					active: e
				}),
				"aria-label": "Taking new mentees"
			}), s.active ? "Taking new mentees" : "Paused"]
		})
	}), /* @__PURE__ */ H(a, {
		className: "grid gap-5 lg:grid-cols-2",
		children: [/* @__PURE__ */ H("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ V(u, {
				label: "About you",
				hint: "What you fly and what you can teach.",
				children: /* @__PURE__ */ V(T, {
					rows: 4,
					value: s.bio,
					onChange: (e) => f({ bio: e.target.value })
				})
			}), /* @__PURE__ */ H("div", {
				className: "grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ V(u, {
					label: "When you play",
					children: /* @__PURE__ */ V(d, {
						value: s.play_time,
						onChange: (e) => f({ play_time: e.target.value }),
						placeholder: "EU evenings",
						maxLength: 100
					})
				}), /* @__PURE__ */ V(u, {
					label: "Mentees at most",
					children: /* @__PURE__ */ V(d, {
						type: "number",
						min: 1,
						max: 50,
						value: s.capacity,
						onChange: (e) => f({ capacity: Number(e.target.value) })
					})
				})]
			})]
		}), /* @__PURE__ */ H("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ V(u, {
				label: "You can help with",
				children: /* @__PURE__ */ V(Z, {
					areas: e,
					value: s.focus,
					onChange: (e) => f({ focus: e })
				})
			}), /* @__PURE__ */ V("div", {
				className: "flex justify-end",
				children: /* @__PURE__ */ V(r, {
					variant: "primary",
					loading: l.isPending,
					onClick: () => l.mutate(s),
					children: "Save profile"
				})
			})]
		})]
	})] });
}
function Te({ rows: e, focus: r }) {
	let a = L(), [s, c] = z(!1), u = s ? e.filter((e) => e.for_me || e.matches > 0) : e;
	return /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, {
		title: `Waiting for a mentor · ${e.length}`,
		description: "Open one to read what they asked for and take them on.",
		actions: r.length > 0 ? /* @__PURE__ */ H("label", {
			className: "inline-flex items-center gap-2 text-sm text-muted",
			children: [/* @__PURE__ */ V(y, {
				checked: s,
				onCheckedChange: c
			}), " Matching my focus"]
		}) : void 0
	}), u.length === 0 ? /* @__PURE__ */ V(l, {
		icon: /* @__PURE__ */ V(ne, {}),
		title: "Nobody is waiting",
		description: "Mentors get a notification when someone asks."
	}) : /* @__PURE__ */ H(S, { children: [/* @__PURE__ */ V(b, { children: /* @__PURE__ */ H("tr", { children: [
		/* @__PURE__ */ V(E, { children: "New member" }),
		/* @__PURE__ */ V(E, { children: "Wants help with" }),
		/* @__PURE__ */ V(E, { children: "Plays" }),
		/* @__PURE__ */ V(E, {
			align: "right",
			children: "Asked"
		})
	] }) }), /* @__PURE__ */ V("tbody", { children: u.map((e) => /* @__PURE__ */ H(D, {
		interactive: !0,
		onClick: () => a(`/p/mentors/m/${e.id}`),
		children: [
			/* @__PURE__ */ V(w, { children: /* @__PURE__ */ H("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ V(t, {
						src: e.mentee.portrait,
						name: e.mentee.name,
						size: "sm"
					}),
					/* @__PURE__ */ V("span", {
						className: "font-medium",
						children: e.mentee.name
					}),
					e.for_me && /* @__PURE__ */ V(n, {
						tone: "accent",
						children: "asked for you"
					}),
					!e.for_me && e.requested_mentor && /* @__PURE__ */ H(n, { children: ["asked for ", e.requested_mentor.name] })
				]
			}) }),
			/* @__PURE__ */ V(w, { children: /* @__PURE__ */ V(Z, {
				areas: [],
				value: e.focus
			}) }),
			/* @__PURE__ */ V(w, {
				className: "text-muted",
				children: e.play_time || "—"
			}),
			/* @__PURE__ */ V(w, {
				align: "right",
				className: "text-xs text-muted",
				children: j(e.created_at)
			})
		]
	}, e.id)) })] })] });
}
function Ee({ rows: e, showMentor: n }) {
	let r = L();
	return /* @__PURE__ */ H(S, { children: [/* @__PURE__ */ V(b, { children: /* @__PURE__ */ H("tr", { children: [
		/* @__PURE__ */ V(E, { children: "Mentee" }),
		n && /* @__PURE__ */ V(E, { children: "Mentor" }),
		/* @__PURE__ */ V(E, { children: "Status" }),
		/* @__PURE__ */ V(E, { children: "Goals" }),
		/* @__PURE__ */ V(E, {
			align: "right",
			children: "Since"
		})
	] }) }), /* @__PURE__ */ V("tbody", { children: e.map((e) => /* @__PURE__ */ H(D, {
		interactive: !0,
		onClick: () => r(`/p/mentors/m/${e.id}`),
		children: [
			/* @__PURE__ */ V(w, { children: /* @__PURE__ */ H("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ V(t, {
					src: e.mentee.portrait,
					name: e.mentee.name,
					size: "sm"
				}), /* @__PURE__ */ V("span", {
					className: "font-medium",
					children: e.mentee.name
				})]
			}) }),
			n && /* @__PURE__ */ V(w, {
				className: "text-muted",
				children: e.mentor?.name ?? (e.requested_mentor ? `asked for ${e.requested_mentor.name}` : "—")
			}),
			/* @__PURE__ */ V(w, { children: /* @__PURE__ */ V(X, { status: e.status }) }),
			/* @__PURE__ */ V(w, {
				className: "w-48",
				children: e.progress ? /* @__PURE__ */ V(Q, { ...e.progress }) : /* @__PURE__ */ V("span", {
					className: "text-subtle",
					children: "—"
				})
			}),
			/* @__PURE__ */ V(w, {
				align: "right",
				className: "text-xs text-muted",
				children: j(e.ended_at ?? e.assigned_at ?? e.created_at)
			})
		]
	}, e.id)) })] });
}
function De({ rows: e }) {
	return /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, { title: "Your earlier mentorships" }), /* @__PURE__ */ V("ul", {
		className: "divide-y divide-border",
		children: e.map((e) => /* @__PURE__ */ V("li", { children: /* @__PURE__ */ H(I, {
			to: `/p/mentors/m/${e.id}`,
			className: "flex items-center justify-between gap-3 px-card py-3 text-sm hover:bg-hover",
			children: [/* @__PURE__ */ V("span", { children: e.mentor ? `With ${e.mentor.name}` : "No mentor" }), /* @__PURE__ */ H("span", {
				className: "flex items-center gap-3 text-xs text-muted",
				children: [
					e.ended_at && j(e.ended_at),
					" ",
					/* @__PURE__ */ V(X, { status: e.status })
				]
			})]
		}) }, e.id))
	})] });
}
//#endregion
//#region src/mentorship.tsx
function Oe() {
	let { id: s } = te(), d = F(), p = [
		"mentors",
		"mentorship",
		s
	], { data: m, isLoading: h, error: g } = P({
		queryKey: p,
		queryFn: () => O.get(`${J}/m/${s}`)
	}), [v, y] = z(null), [b, x] = z(!1), [S, C] = z(""), w = (e) => {
		d.setQueryData(p, e), d.invalidateQueries({ queryKey: ["mentors", "overview"] }), d.invalidateQueries({ queryKey: ["mentors", "program"] }), d.invalidateQueries({ queryKey: ["mentors", "widget"] });
	}, E = (e) => M.error(e.message), D = N({
		mutationFn: () => O.post(`${J}/m/${s}/claim`),
		onSuccess: (e) => {
			w(e), M.success(`You're now mentoring ${e.mentee.name}`);
		},
		onError: E
	}), k = N({
		mutationFn: () => O.post(`${J}/m/${s}/withdraw`),
		onSuccess: w,
		onError: E
	}), ee = N({
		mutationFn: ({ g: e, done: t }) => O.post(`${J}/m/${s}/goals/${e.id}`, { done: t }),
		onSuccess: w,
		onError: E
	}), j = N({
		mutationFn: () => O.post(`${J}/m/${s}/${v}`, { text: S }),
		onSuccess: (e) => {
			w(e), y(null), C(""), M.success(e.status === "graduated" ? `${e.mentee.name} graduated` : "Mentorship ended");
		},
		onError: E
	});
	if (g) return /* @__PURE__ */ V(l, {
		icon: /* @__PURE__ */ V(W, {}),
		title: "Mentorship not found",
		action: /* @__PURE__ */ V(I, {
			to: "/p/mentors",
			children: /* @__PURE__ */ V(r, { children: "Back to mentoring" })
		})
	});
	if (h || !m) return /* @__PURE__ */ V(_, { className: "h-96" });
	let L = m.role === "mentor" || m.role === "manager", R = m.goals.length > 0 && m.goals.every((e) => e.done), U = [
		`Asked ${A(m.created_at)}`,
		m.assigned_at && `mentored since ${A(m.assigned_at)}`,
		m.ended_at && `${m.status === "graduated" ? "graduated" : "ended"} ${A(m.ended_at)}`
	].filter(Boolean).join(" · ");
	return /* @__PURE__ */ H(B, { children: [
		/* @__PURE__ */ H(I, {
			to: "/p/mentors",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ V(fe, {}), " Mentoring"]
		}),
		/* @__PURE__ */ V(f, {
			eyebrow: "Mentorship",
			title: m.role === "mentee" ? "Your mentorship" : m.mentee.name,
			description: U,
			icon: m.mentee.portrait ? /* @__PURE__ */ V("img", {
				src: m.mentee.portrait,
				alt: "",
				className: "size-full object-cover"
			}) : /* @__PURE__ */ V(W, {}),
			actions: /* @__PURE__ */ H("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ V(X, { status: m.status }),
					m.can.withdraw && /* @__PURE__ */ H(r, {
						variant: "ghost",
						loading: k.isPending,
						onClick: () => k.mutate(),
						children: [/* @__PURE__ */ V(K, {}), " Withdraw"]
					}),
					m.can.claim && /* @__PURE__ */ H(r, {
						variant: "primary",
						loading: D.isPending,
						onClick: () => D.mutate(),
						children: [!D.isPending && /* @__PURE__ */ V(ae, {}), " Take them on"]
					}),
					m.can.end && /* @__PURE__ */ H(r, {
						variant: "danger",
						onClick: () => y("end"),
						children: [/* @__PURE__ */ V(K, {}), " End"]
					}),
					m.can.graduate && /* @__PURE__ */ H(r, {
						variant: "primary",
						onClick: () => y("graduate"),
						children: [/* @__PURE__ */ V(W, {}), " Graduate"]
					}),
					m.can.reopen && /* @__PURE__ */ H(r, {
						onClick: () => x(!0),
						children: [/* @__PURE__ */ V(de, {}), " Reopen"]
					})
				]
			})
		}),
		/* @__PURE__ */ H("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_400px]",
			children: [/* @__PURE__ */ H("div", {
				className: "space-y-6",
				children: [
					m.can.graduate && R && /* @__PURE__ */ H(e, {
						tone: "success",
						title: "Every goal is done",
						action: /* @__PURE__ */ H(r, {
							variant: "success",
							onClick: () => y("graduate"),
							children: [/* @__PURE__ */ V(W, {}), " Graduate"]
						}),
						children: [m.mentee.name, " has done everything the program asks. Time to graduate them?"]
					}),
					m.status !== "waiting" && /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, {
						title: "Goals",
						description: m.role === "mentee" ? "Goals that tick themselves update as you go; your mentor ticks the rest." : "Goals with rules tick themselves; tick the others when they're done."
					}), /* @__PURE__ */ H(a, {
						className: "space-y-3",
						children: [/* @__PURE__ */ V(Q, { ...m.progress }), /* @__PURE__ */ V(he, {
							goals: m.goals,
							canTick: (e) => m.status === "active" && (m.can.tick || m.role === "mentee" && e.mentee_can_tick && !e.auto),
							onTick: (e, t) => ee.mutate({
								g: e,
								done: t
							})
						})]
					})] }),
					m.role !== "candidate" && /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, {
						title: L ? "Messages and notes" : "Messages",
						description: L ? "Private notes are only for mentors and program managers." : void 0
					}), /* @__PURE__ */ V(a, { children: /* @__PURE__ */ V(ge, {
						messages: m.messages,
						staff: m.can.private_notes,
						disabled: !m.can.message,
						onSend: (e, t) => O.post(`/api/p/mentors/m/${s}/messages`, {
							text: e,
							private: t
						}).then(w)
					}) })] })
				]
			}), /* @__PURE__ */ H("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, { title: "Mentor" }), /* @__PURE__ */ H(a, { children: [m.mentor ? /* @__PURE__ */ H("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ H("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ V(t, {
									src: m.mentor.portrait,
									name: m.mentor.name,
									size: "md"
								}), /* @__PURE__ */ H("div", { children: [/* @__PURE__ */ V("div", {
									className: "font-medium",
									children: m.mentor.name
								}), m.mentor_profile?.play_time && /* @__PURE__ */ H("div", {
									className: "text-xs text-muted",
									children: ["Plays ", m.mentor_profile.play_time]
								})] })]
							}),
							m.mentor_profile?.bio && /* @__PURE__ */ V("p", {
								className: "whitespace-pre-line text-sm text-muted",
								children: m.mentor_profile.bio
							}),
							m.mentor_profile && m.mentor_profile.focus.length > 0 && /* @__PURE__ */ V(Z, {
								areas: [],
								value: m.mentor_profile.focus
							})
						]
					}) : /* @__PURE__ */ V("p", {
						className: "text-sm text-muted",
						children: m.requested_mentor ? `Asked for ${m.requested_mentor.name}.` : "Waiting for any mentor."
					}), m.can.assign && /* @__PURE__ */ V(ke, {
						id: m.id,
						current: m.mentor?.id ?? null,
						onDone: w
					})] })] }),
					/* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, { title: "What they asked for" }), /* @__PURE__ */ H(a, {
						className: "space-y-3 text-sm",
						children: [
							/* @__PURE__ */ V(Z, {
								areas: [],
								value: m.focus
							}),
							m.play_time && /* @__PURE__ */ H("div", { children: [
								/* @__PURE__ */ V("span", {
									className: "text-subtle",
									children: "Plays:"
								}),
								" ",
								m.play_time
							] }),
							m.note ? /* @__PURE__ */ V("p", {
								className: "whitespace-pre-line",
								children: m.note
							}) : /* @__PURE__ */ V("p", {
								className: "text-subtle",
								children: "No note."
							}),
							m.end_reason && m.status === "ended" && /* @__PURE__ */ V(e, {
								tone: "info",
								title: "Ended",
								children: m.end_reason
							})
						]
					})] }),
					m.characters && /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, {
						title: `Characters · ${m.characters.length}`,
						description: m.sheet_access ? "As their mentor you can open their character sheets while the mentorship is active." : void 0
					}), /* @__PURE__ */ V("ul", {
						className: "divide-y divide-border",
						children: m.characters.map((e) => /* @__PURE__ */ H("li", {
							className: "flex items-center gap-3 px-card py-3",
							children: [
								/* @__PURE__ */ V(t, {
									src: e.portrait,
									name: e.name,
									size: "sm"
								}),
								/* @__PURE__ */ H("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ H("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ V("span", {
											className: "truncate font-medium",
											children: e.name
										}), e.main && /* @__PURE__ */ V(n, {
											tone: "accent",
											children: "main"
										})]
									}), /* @__PURE__ */ V("div", {
										className: "truncate text-xs text-muted",
										children: [e.corporation, e.total_sp == null ? null : `${(e.total_sp / 1e6).toFixed(1)}M SP`].filter(Boolean).join(" · ") || "—"
									})]
								}),
								m.sheet_access && /* @__PURE__ */ V(I, {
									to: `/characters/${e.id}`,
									target: "_blank",
									className: "text-subtle hover:text-text",
									"aria-label": `Open ${e.name}'s character sheet`,
									children: /* @__PURE__ */ V(oe, {})
								})
							]
						}, e.id))
					})] })
				]
			})]
		}),
		/* @__PURE__ */ V(c, {
			open: v !== null,
			onOpenChange: (e) => !e && y(null),
			title: v === "graduate" ? `Graduate ${m.mentee.name}?` : "End this mentorship?",
			description: v === "graduate" ? "They're congratulated straight away. The thread stays for reference." : "They're told straight away. They can ask for a mentor again later.",
			footer: /* @__PURE__ */ H(B, { children: [/* @__PURE__ */ V(r, {
				variant: "ghost",
				onClick: () => y(null),
				children: "Cancel"
			}), /* @__PURE__ */ V(r, {
				variant: v === "graduate" ? "primary" : "solidDanger",
				loading: j.isPending,
				disabled: v === "end" && !S.trim(),
				onClick: () => j.mutate(),
				children: v === "graduate" ? /* @__PURE__ */ H(B, { children: [/* @__PURE__ */ V(G, {}), " Graduate"] }) : /* @__PURE__ */ H(B, { children: [/* @__PURE__ */ V(K, {}), " End"] })
			})] }),
			children: /* @__PURE__ */ V(u, {
				label: v === "graduate" ? "A message to them (optional)" : "Why does it end?",
				children: /* @__PURE__ */ V(T, {
					rows: 3,
					value: S,
					onChange: (e) => C(e.target.value),
					placeholder: v === "graduate" ? "Well done! You're ready for the big fleets now." : "They left the corporation."
				})
			})
		}),
		/* @__PURE__ */ V(_e, {
			mentorship: b ? m : null,
			onClose: () => x(!1),
			onDone: w
		})
	] });
}
function ke({ id: e, current: t, onDone: n }) {
	let { data: i } = P({
		queryKey: [
			"mentors",
			"program",
			"open"
		],
		queryFn: () => O.get(`${J}/program?status=open`)
	}), [a, o] = z(""), s = N({
		mutationFn: () => O.post(`${J}/m/${e}/assign`, { mentor_id: Number(a) }),
		onSuccess: (e) => {
			n(e), o(""), M.success(`${e.mentor?.name} is the mentor now`);
		},
		onError: (e) => M.error(e.message)
	}), c = (i?.mentors ?? []).filter((e) => e.id !== t);
	return /* @__PURE__ */ H("div", {
		className: "mt-4 flex items-end gap-2 border-t border-border pt-4",
		children: [/* @__PURE__ */ V(u, {
			label: t ? "Hand to another mentor" : "Assign a mentor",
			className: "flex-1",
			children: /* @__PURE__ */ H(g, {
				value: a,
				onChange: (e) => o(e.target.value),
				children: [/* @__PURE__ */ V("option", {
					value: "",
					children: "Choose…"
				}), c.map((e) => /* @__PURE__ */ H("option", {
					value: e.id,
					children: [
						e.name,
						" (",
						e.mentees,
						"/",
						e.capacity,
						e.active ? "" : ", paused",
						")"
					]
				}, e.id))]
			})
		}), /* @__PURE__ */ V(r, {
			disabled: !a,
			loading: s.isPending,
			onClick: () => s.mutate(),
			children: "Assign"
		})]
	});
}
//#endregion
//#region src/program.tsx
var Ae = [
	{
		value: "open",
		label: "Open"
	},
	{
		value: "waiting",
		label: "Waiting"
	},
	{
		value: "active",
		label: "Active"
	},
	{
		value: "graduated",
		label: "Graduated"
	},
	{
		value: "ended",
		label: "Ended"
	}
];
function je() {
	let [e, t] = z("open"), { data: n, isLoading: r } = P({
		queryKey: [
			"mentors",
			"program",
			e
		],
		queryFn: () => O.get(`${J}/program?status=${e}`)
	});
	return /* @__PURE__ */ H(B, { children: [
		/* @__PURE__ */ H(I, {
			to: "/p/mentors",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ V(fe, {}), " Mentoring"]
		}),
		/* @__PURE__ */ V(f, {
			eyebrow: "Mentoring",
			title: "Program",
			icon: /* @__PURE__ */ V(q, {}),
			description: "Every mentorship, who graduated, how busy the mentors are, the goals mentees work through, and settings."
		}),
		r || !n ? /* @__PURE__ */ V(_, { className: "h-96" }) : /* @__PURE__ */ H("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ H("div", {
				className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ V(v, {
						label: "Waiting for a mentor",
						value: n.stats.waiting,
						tone: n.stats.waiting ? "warning" : void 0,
						hint: n.stats.avg_days_waiting == null ? void 0 : `${n.stats.avg_days_waiting} days' wait on average`
					}),
					/* @__PURE__ */ V(v, {
						label: "Being mentored",
						value: n.stats.active,
						tone: "accent"
					}),
					/* @__PURE__ */ V(v, {
						label: "Graduated",
						value: n.stats.graduated,
						tone: "success",
						hint: n.stats.avg_days_to_graduate == null ? void 0 : `in ${n.stats.avg_days_to_graduate} days on average`
					}),
					/* @__PURE__ */ V(v, {
						label: "Ended early",
						value: n.stats.ended
					})
				]
			}), /* @__PURE__ */ H(C, {
				defaultValue: "mentorships",
				items: [
					{
						value: "mentorships",
						label: "Mentorships"
					},
					{
						value: "graduates",
						label: "Graduates",
						count: n.stats.graduated
					},
					{
						value: "mentors",
						label: "Mentors",
						count: n.mentors.length
					},
					{
						value: "goals",
						label: "Goals",
						count: n.goals.length
					},
					{
						value: "settings",
						label: "Settings"
					}
				],
				children: [
					/* @__PURE__ */ V(x, {
						value: "mentorships",
						className: "pt-4",
						children: /* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V("div", {
							className: "border-b border-border px-card py-3",
							children: /* @__PURE__ */ V(h, {
								value: e,
								onChange: t,
								options: Ae,
								size: "sm",
								"aria-label": "Status"
							})
						}), n.mentorships.length === 0 ? /* @__PURE__ */ V(l, {
							icon: /* @__PURE__ */ V(q, {}),
							title: "Nothing here"
						}) : /* @__PURE__ */ V(Ee, {
							rows: n.mentorships,
							showMentor: !0
						})] })
					}),
					/* @__PURE__ */ V(x, {
						value: "graduates",
						className: "pt-4",
						children: /* @__PURE__ */ V(Ne, {})
					}),
					/* @__PURE__ */ V(x, {
						value: "mentors",
						className: "pt-4",
						children: /* @__PURE__ */ V(Pe, { data: n })
					}),
					/* @__PURE__ */ V(x, {
						value: "goals",
						className: "pt-4",
						children: /* @__PURE__ */ V(Ie, {
							goals: n.goals,
							focusAreas: n.settings.focus_areas,
							canEditRules: n.can_edit_rules
						})
					}),
					/* @__PURE__ */ V(x, {
						value: "settings",
						className: "pt-4",
						children: /* @__PURE__ */ V(Re, {
							settings: n.settings,
							canEditRules: n.can_edit_rules
						})
					})
				]
			})]
		})
	] });
}
function Me(e, t) {
	if (!e || !t) return null;
	let n = Math.max(0, Math.round((Date.parse(t) - Date.parse(e)) / 864e5));
	return `${n} day${n === 1 ? "" : "s"}`;
}
function Ne() {
	let e = F(), n = L(), [a, o] = z(null), { data: s, isLoading: c } = P({
		queryKey: [
			"mentors",
			"program",
			"graduated"
		],
		queryFn: () => O.get(`${J}/program?status=graduated`)
	});
	if (c || !s) return /* @__PURE__ */ V(_, { className: "h-64" });
	let u = [...s.mentorships].sort((e, t) => (t.ended_at ?? "").localeCompare(e.ended_at ?? ""));
	return /* @__PURE__ */ H(i, { children: [u.length === 0 ? /* @__PURE__ */ V(l, {
		icon: /* @__PURE__ */ V(W, {}),
		title: "Nobody has graduated yet"
	}) : /* @__PURE__ */ H(S, { children: [/* @__PURE__ */ V(b, { children: /* @__PURE__ */ H("tr", { children: [
		/* @__PURE__ */ V(E, { children: "Mentee" }),
		/* @__PURE__ */ V(E, { children: "Mentor" }),
		/* @__PURE__ */ V(E, { children: "Graduated" }),
		/* @__PURE__ */ V(E, { children: "Mentored for" }),
		/* @__PURE__ */ V(E, {
			align: "right",
			children: /* @__PURE__ */ V("span", {
				className: "sr-only",
				children: "Actions"
			})
		})
	] }) }), /* @__PURE__ */ V("tbody", { children: u.map((e) => /* @__PURE__ */ H(D, {
		interactive: !0,
		onClick: () => n(`/p/mentors/m/${e.id}`),
		children: [
			/* @__PURE__ */ V(w, { children: /* @__PURE__ */ H("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ V(t, {
					src: e.mentee.portrait,
					name: e.mentee.name,
					size: "sm"
				}), /* @__PURE__ */ V("span", {
					className: "font-medium",
					children: e.mentee.name
				})]
			}) }),
			/* @__PURE__ */ V(w, {
				className: "text-muted",
				children: e.mentor?.name ?? "—"
			}),
			/* @__PURE__ */ V(w, {
				className: "text-muted",
				children: A(e.ended_at)
			}),
			/* @__PURE__ */ V(w, {
				className: "text-muted",
				children: Me(e.assigned_at, e.ended_at) ?? "—"
			}),
			/* @__PURE__ */ V(w, {
				align: "right",
				children: /* @__PURE__ */ H(r, {
					size: "sm",
					variant: "ghost",
					onClick: (t) => {
						t.stopPropagation(), o(e);
					},
					children: [/* @__PURE__ */ V(de, {}), " Reopen"]
				})
			})
		]
	}, e.id)) })] }), /* @__PURE__ */ V(_e, {
		mentorship: a,
		onClose: () => o(null),
		onDone: () => e.invalidateQueries({ queryKey: ["mentors"] })
	})] });
}
function Pe({ data: e }) {
	return e.mentors.length === 0 ? /* @__PURE__ */ V(i, { children: /* @__PURE__ */ V(l, {
		icon: /* @__PURE__ */ V(q, {}),
		title: "No mentors yet",
		description: "Give \"Can mentor new members\" to a group or state under Administration → Access."
	}) }) : /* @__PURE__ */ V(i, { children: /* @__PURE__ */ H(S, { children: [/* @__PURE__ */ V(b, { children: /* @__PURE__ */ H("tr", { children: [
		/* @__PURE__ */ V(E, { children: "Mentor" }),
		/* @__PURE__ */ V(E, { children: "Focus" }),
		/* @__PURE__ */ V(E, { children: "Plays" }),
		/* @__PURE__ */ V(E, {
			align: "right",
			children: "Mentees"
		}),
		/* @__PURE__ */ V(E, {
			align: "right",
			children: "Graduated"
		})
	] }) }), /* @__PURE__ */ V("tbody", { children: e.mentors.map((e) => /* @__PURE__ */ H(D, { children: [
		/* @__PURE__ */ V(w, { children: /* @__PURE__ */ H("div", {
			className: "flex items-center gap-3",
			children: [
				/* @__PURE__ */ V(t, {
					src: e.portrait,
					name: e.name,
					size: "sm"
				}),
				/* @__PURE__ */ V("span", {
					className: "font-medium",
					children: e.name
				}),
				!e.active && /* @__PURE__ */ V(n, {
					tone: "warning",
					children: "paused"
				})
			]
		}) }),
		/* @__PURE__ */ V(w, {
			className: "text-xs text-muted",
			children: e.focus.join(", ") || "—"
		}),
		/* @__PURE__ */ V(w, {
			className: "text-muted",
			children: e.play_time || "—"
		}),
		/* @__PURE__ */ V(w, {
			align: "right",
			className: "font-mono tabular-nums",
			children: /* @__PURE__ */ H("span", {
				className: e.mentees >= e.capacity ? "text-warning-fg" : "",
				children: [
					e.mentees,
					" / ",
					e.capacity
				]
			})
		}),
		/* @__PURE__ */ V(w, {
			align: "right",
			className: "font-mono tabular-nums",
			children: e.graduated
		})
	] }, e.id)) })] }) });
}
var Fe = {
	title: "",
	description: "",
	rules: {},
	mentee_can_tick: !1,
	focus: []
};
function Ie({ goals: e, focusAreas: t, canEditRules: a }) {
	let c = F(), [u, d] = z(null), [f, p] = z(null), m = () => c.invalidateQueries({ queryKey: ["mentors"] }), h = N({
		mutationFn: (e) => O.post(`${J}/program/goals/order`, { ids: e }),
		onSuccess: m,
		onError: (e) => M.error(e.message)
	}), g = (t, n) => {
		let r = e.map((e) => e.id);
		[r[t], r[t + n]] = [r[t + n], r[t]], h.mutate(r);
	};
	return /* @__PURE__ */ H(i, { children: [
		/* @__PURE__ */ V(o, {
			title: "Goals",
			description: "What mentees work through, in this order. Goals with rules tick themselves; goals with focus areas are only for mentees who asked for one of them.",
			actions: /* @__PURE__ */ H(r, {
				variant: "primary",
				onClick: () => d("new"),
				children: [/* @__PURE__ */ V(se, {}), " Add goal"]
			})
		}),
		e.length === 0 ? /* @__PURE__ */ V(l, {
			icon: /* @__PURE__ */ V(q, {}),
			title: "No goals",
			description: "Add what new members should do before they graduate."
		}) : /* @__PURE__ */ V("ol", {
			className: "divide-y divide-border",
			children: e.map((t, i) => /* @__PURE__ */ H("li", {
				className: "flex items-start gap-3 px-card py-3",
				children: [
					/* @__PURE__ */ H("div", {
						className: "flex flex-col",
						children: [/* @__PURE__ */ V(r, {
							variant: "ghost",
							size: "icon-xs",
							disabled: i === 0,
							onClick: () => g(i, -1),
							"aria-label": "Move up",
							children: /* @__PURE__ */ V(le, {})
						}), /* @__PURE__ */ V(r, {
							variant: "ghost",
							size: "icon-xs",
							disabled: i === e.length - 1,
							onClick: () => g(i, 1),
							"aria-label": "Move down",
							children: /* @__PURE__ */ V(ue, {})
						})]
					}),
					/* @__PURE__ */ H("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ H("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ V("span", {
										className: "font-medium",
										children: t.title
									}),
									t.rules_text ? /* @__PURE__ */ V(n, {
										tone: "info",
										children: "ticks itself"
									}) : t.mentee_can_tick ? /* @__PURE__ */ V(n, { children: "mentee ticks" }) : /* @__PURE__ */ V(n, { children: "mentor ticks" }),
									t.focus.length > 0 ? t.focus.map((e) => /* @__PURE__ */ V(n, {
										tone: "accent",
										children: e
									}, e)) : /* @__PURE__ */ V(n, { children: "every mentee" })
								]
							}),
							t.description && /* @__PURE__ */ V("p", {
								className: "text-xs text-muted",
								children: t.description
							}),
							t.rules_text && /* @__PURE__ */ V("p", {
								className: "mt-1 text-xs text-subtle",
								children: t.rules_text
							})
						]
					}),
					/* @__PURE__ */ V(r, {
						variant: "ghost",
						size: "icon-sm",
						onClick: () => d(t),
						"aria-label": `Edit ${t.title}`,
						children: /* @__PURE__ */ V(pe, {})
					}),
					/* @__PURE__ */ V(r, {
						variant: "ghost",
						size: "icon-sm",
						onClick: () => p(t),
						"aria-label": `Delete ${t.title}`,
						children: /* @__PURE__ */ V(ce, {})
					})
				]
			}, t.id))
		}),
		u && /* @__PURE__ */ V(Le, {
			goal: u === "new" ? null : u,
			focusAreas: t,
			canEditRules: a,
			onClose: () => d(null)
		}),
		/* @__PURE__ */ V(s, {
			open: f !== null,
			onOpenChange: (e) => !e && p(null),
			title: `Delete “${f?.title}”?`,
			description: "It goes from every mentorship, with whatever was ticked.",
			confirmLabel: "Delete",
			danger: !0,
			onConfirm: () => O.delete(`${J}/program/goals/${f.id}`).then(m, (e) => {
				throw M.error(e.message), e;
			})
		})
	] });
}
function Le({ goal: t, focusAreas: n, canEditRules: i, onClose: a }) {
	let o = F(), [s, l] = z(t ?? {
		...Fe,
		rules_text: ""
	}), f = (s.rules.rules ?? []).length > 0, p = N({
		mutationFn: () => {
			let e = {
				title: s.title,
				description: s.description,
				rules: s.rules,
				mentee_can_tick: s.mentee_can_tick && !f,
				focus: s.focus
			};
			return t ? O.put(`${J}/program/goals/${t.id}`, e) : O.post(`${J}/program/goals`, e);
		},
		onSuccess: () => {
			o.invalidateQueries({ queryKey: ["mentors"] }), M.success("Goal saved"), a();
		},
		onError: (e) => M.error(e.message)
	});
	return /* @__PURE__ */ V(c, {
		open: !0,
		size: "lg",
		onOpenChange: (e) => !e && a(),
		title: t ? "Edit goal" : "New goal",
		footer: /* @__PURE__ */ H(B, { children: [/* @__PURE__ */ V(r, {
			variant: "ghost",
			onClick: a,
			children: "Cancel"
		}), /* @__PURE__ */ V(r, {
			variant: "primary",
			loading: p.isPending,
			disabled: !s.title.trim(),
			onClick: () => p.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ H("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ V(u, {
					label: "Title",
					required: !0,
					children: /* @__PURE__ */ V(d, {
						value: s.title,
						onChange: (e) => l({
							...s,
							title: e.target.value
						}),
						maxLength: 150,
						placeholder: "Fly in your first fleet"
					})
				}),
				/* @__PURE__ */ V(u, {
					label: "Description",
					children: /* @__PURE__ */ V(T, {
						rows: 2,
						value: s.description,
						onChange: (e) => l({
							...s,
							description: e.target.value
						})
					})
				}),
				/* @__PURE__ */ V(u, {
					label: "For mentees focusing on",
					hint: "Pick none for a goal every mentee works through, or the focus areas it's for: a mentee gets it if they asked for help with any of them.",
					children: /* @__PURE__ */ V(Z, {
						areas: [...n, ...s.focus.filter((e) => !n.includes(e))],
						value: s.focus,
						onChange: (e) => l({
							...s,
							focus: e
						})
					})
				}),
				/* @__PURE__ */ V(u, {
					label: "Ticks itself when",
					hint: "Any group rule: skill points, fleets flown, a skill plan done, a doctrine they can fly, Discord linked… Leave it empty to tick it by hand.",
					children: i ? /* @__PURE__ */ V(m, {
						value: s.rules,
						onChange: (e) => l({
							...s,
							rules: e
						}),
						emptyText: "No rules: the mentor ticks it by hand."
					}) : /* @__PURE__ */ H(e, {
						tone: "info",
						children: [t?.rules_text || "No rules: the mentor ticks it by hand.", /* @__PURE__ */ V("span", {
							className: "mt-1 block text-xs",
							children: "Rules can be changed by people who manage access (groups and rules)."
						})]
					})
				}),
				!f && /* @__PURE__ */ H("label", {
					className: "flex items-center gap-3 text-sm",
					children: [/* @__PURE__ */ V(y, {
						checked: s.mentee_can_tick,
						onCheckedChange: (e) => l({
							...s,
							mentee_can_tick: e
						})
					}), "The mentee may tick it themselves"]
				})
			]
		})
	});
}
function Re({ settings: t, canEditRules: n }) {
	let s = F(), [c, l] = z(t.focus_areas), [u, f] = z(""), [p, h] = z(t.suggest_rules);
	R(() => {
		l(t.focus_areas), h(t.suggest_rules);
	}, [t]);
	let g = N({
		mutationFn: (e) => O.put(`${J}/program/settings`, e),
		onSuccess: () => {
			s.invalidateQueries({ queryKey: ["mentors"] }), M.success("Settings saved");
		},
		onError: (e) => M.error(e.message)
	}), _ = () => {
		let e = u.trim();
		e && !c.some((t) => t.toLowerCase() === e.toLowerCase()) && l([...c, e]), f("");
	};
	return /* @__PURE__ */ H("div", {
		className: "grid gap-6 xl:grid-cols-2",
		children: [
			/* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, {
				title: "Focus areas",
				description: "What mentors can help with and new members can ask about."
			}), /* @__PURE__ */ H(a, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ V("div", {
						className: "flex flex-wrap gap-1.5",
						children: c.map((e) => /* @__PURE__ */ H("span", {
							className: "inline-flex items-center gap-1 border border-border px-2 py-1 text-xs",
							children: [e, /* @__PURE__ */ V("button", {
								type: "button",
								onClick: () => l(c.filter((t) => t !== e)),
								"aria-label": `Remove ${e}`,
								className: "text-subtle hover:text-danger-fg",
								children: /* @__PURE__ */ V(K, { className: "size-3" })
							})]
						}, e))
					}),
					/* @__PURE__ */ H("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ V(d, {
							value: u,
							onChange: (e) => f(e.target.value),
							onKeyDown: (e) => e.key === "Enter" && _(),
							placeholder: "Faction warfare",
							maxLength: 40
						}), /* @__PURE__ */ H(r, {
							onClick: _,
							disabled: !u.trim(),
							children: [/* @__PURE__ */ V(se, {}), " Add"]
						})]
					}),
					/* @__PURE__ */ V("div", {
						className: "flex justify-end",
						children: /* @__PURE__ */ V(r, {
							variant: "primary",
							loading: g.isPending,
							onClick: () => g.mutate({ focus_areas: c }),
							children: "Save focus areas"
						})
					})
				]
			})] }),
			/* @__PURE__ */ H(i, { children: [/* @__PURE__ */ V(o, { title: "Character sheets" }), /* @__PURE__ */ V(a, { children: /* @__PURE__ */ H("label", {
				className: "flex items-start gap-3 text-sm",
				children: [/* @__PURE__ */ V(y, {
					checked: t.sheet_access,
					onCheckedChange: (e) => g.mutate({ sheet_access: e }),
					"aria-label": "Mentors may open character sheets"
				}), /* @__PURE__ */ H("span", { children: [/* @__PURE__ */ V("span", {
					className: "font-medium",
					children: "Mentors may open their mentees' character sheets"
				}), /* @__PURE__ */ V("span", {
					className: "block text-muted",
					children: "Only while the mentorship is active, and only their own mentees. Each look is in the snooper log."
				})] })]
			}) })] }),
			/* @__PURE__ */ H(i, {
				className: "xl:col-span-2",
				children: [/* @__PURE__ */ V(o, {
					title: "Who counts as new",
					description: "Members who match these rules and never had a mentor are invited to ask for one, on the dashboard and here. Anyone can still ask."
				}), /* @__PURE__ */ V(a, {
					className: "space-y-4",
					children: n ? /* @__PURE__ */ H(B, { children: [/* @__PURE__ */ V(m, {
						value: p,
						onChange: h,
						emptyText: "No rules: nobody is invited.",
						preview: !0
					}), /* @__PURE__ */ V("div", {
						className: "flex justify-end",
						children: /* @__PURE__ */ V(r, {
							variant: "primary",
							loading: g.isPending,
							onClick: () => g.mutate({ suggest_rules: p }),
							children: "Save rules"
						})
					})] }) : /* @__PURE__ */ H(e, {
						tone: "info",
						children: [t.suggest_text || "No rules: nobody is invited.", /* @__PURE__ */ V("span", {
							className: "mt-1 block text-xs",
							children: "Rules can be changed by people who manage access (groups and rules)."
						})]
					})
				})]
			})
		]
	});
}
//#endregion
//#region src/index.tsx
function ze() {
	let { data: e, isLoading: t } = P({
		queryKey: ["mentors", "widget"],
		queryFn: () => O.get(`${J}/widget`),
		refetchInterval: 12e4
	});
	if (t) return /* @__PURE__ */ V(_, { className: "h-16" });
	if (!e) return null;
	if (e.mine) {
		let t = e.mine;
		return /* @__PURE__ */ H(I, {
			to: `/p/mentors/m/${t.id}`,
			className: "block space-y-3",
			children: [/* @__PURE__ */ H("div", {
				className: "flex items-start justify-between gap-4",
				children: [/* @__PURE__ */ H("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ V("div", {
						className: "text-xs text-muted",
						children: t.mentor ? "Your mentor" : "Mentoring"
					}), /* @__PURE__ */ V("div", {
						className: "truncate text-lg font-semibold",
						children: t.mentor?.name ?? "Waiting for a mentor"
					})]
				}), /* @__PURE__ */ V(n, {
					tone: Y[t.status].tone,
					children: Y[t.status].label
				})]
			}), t.progress && /* @__PURE__ */ V(Q, { ...t.progress })]
		});
	}
	return e.is_mentor ? /* @__PURE__ */ V(I, {
		to: "/p/mentors",
		className: "block",
		children: /* @__PURE__ */ H("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ H("div", { children: [/* @__PURE__ */ V("div", {
				className: "text-xs text-muted",
				children: "Your mentees"
			}), /* @__PURE__ */ H("div", {
				className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
				children: [e.mentees, /* @__PURE__ */ H("span", {
					className: "text-base text-subtle",
					children: [" / ", e.capacity]
				})]
			})] }), e.waiting ? /* @__PURE__ */ H(n, {
				tone: "info",
				children: [e.waiting, " waiting"]
			}) : /* @__PURE__ */ V(n, {
				tone: "success",
				children: "Nobody waiting"
			})]
		})
	}) : e.suggested ? /* @__PURE__ */ H("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ H("div", { children: [/* @__PURE__ */ V("div", {
			className: "font-medium",
			children: "New here? Get a mentor"
		}), /* @__PURE__ */ V("p", {
			className: "text-sm text-muted",
			children: "An experienced member helps you find your feet: ships, fleets, ISK and who's who."
		})] }), /* @__PURE__ */ V(I, {
			to: "/p/mentors",
			children: /* @__PURE__ */ V(r, {
				variant: "primary",
				size: "sm",
				children: "Ask for a mentor"
			})
		})]
	}) : /* @__PURE__ */ V(I, {
		to: "/p/mentors",
		className: "block text-sm text-muted hover:text-text",
		children: "Mentors help new members find their feet. Open Mentoring to ask for one."
	});
}
var Be = ee({
	routes: [
		{
			path: "",
			Component: ye
		},
		{
			path: "program",
			Component: je
		},
		{
			path: "m/:id",
			Component: Oe
		}
	],
	widgets: [{
		id: "mentoring",
		title: "Mentoring",
		Component: ze,
		size: "sm",
		order: 40
	}]
});
//#endregion
export { Be as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","about","accent","access","action","actions","active","add","again","align","allDone","also","alt","an","and","another","any","anyway","are","areas","aria-label","aria-pressed","as","ask","asked","asking","assign","assigned","assigned_at","async","at","author","author_id","auto","average","avg_days_to_graduate","avg_days_waiting","await","back","badges","be","been","before","between","bg-accent-soft","bg-border","bg-border-strong","bg-success","bg-surface-2/60","bg-surface-3","bg-warning-soft/60","big","bio","block","body","boolean","border","border-accent","border-b","border-border","border-border-strong","border-success","border-t","border-warning/30","busy","but","button","by","by_rules","can","canEditRules","canTick","can_edit_rules","can_manage","candidate","capacity","catch","changed","character","characters","checked","checks","children","chips","claim","className","close","confirmLabel","congratulated","const","corporation","count","counts","created_at","ctrlKey","current","currentColor","cursor-default","cursor-pointer","cx","cy","d","danger","dashboard","data","days","default","defaultValue","description","disabled","divide-border","divide-y","do","doctrine","does","doesn","done","done!","done_at","done_by","down","each","earlier","early","empty","emptyText","end","end_reason","ended","ended_at","error","evenings","event","every","everyone","everything","experienced","export","extends","eyebrow","far","feet","few","fill","finally","find","first","fitting","fleet","fleets","flex","flex-1","flex-col","flex-wrap","fly","focus","focusAreas","focus_areas","focusing","following","font-medium","font-mono","font-semibold","footer","for","for_me","found","free","from","function","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-5","gap-6","get","gets","ghost","given","goal","goals","goes","graduate","graduated","graduates","grid","grid-cols-2","group","h-16","h-64","h-96","h-px","had","hand","has","hasRules","have","height","help","helps","here","hint","home","hover:bg-hover","hover:border-accent","hover:text-danger-fg","hover:text-text","how","icon","icon-sm","icon-xs","icons","id","ids","if","import","in","info","inline","inline-flex","instanceof","interactive","interface","invited","is","isLoading","isPending","is_mentor","it","italic","items","items-center","items-end","items-start","itself","justify-between","justify-center","justify-end","key","label","leave","left","length","lg","lg:grid-cols-2","like","line-clamp-2","list","little","ll","loading","look","m","m12","m18","m21.854","m6","main","making","manage","manager","managers","match","matches","matching","max","max-w-sm","maxLength","may","mb-4","md","member","members","mentee","mentee_can_tick","mentees","mentor","mentor_id","mentor_profile","mentored","mentoring","mentors","mentorship","mentorships","message","messages","min","min-w-0","min-w-48","mine","ml-auto","most","mostly","move","mt-0.5","mt-1","mt-1.5","mt-4","mutationFn","my","n","name","navigate","needs","neutral","never","new","newest","no","nobody","none","not","note","notes","notification","now","null","number","object-cover","of","ok","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onDone","onError","onKeyDown","onOpenChange","onSelect","onSend","onSuccess","onTick","one","only","open","options","or","order","others","over","overview","own","p-3","pages","pair","passes","past","patch","path","paused","people","pick","placeholder","places","plain","plan","play","play_time","played","plugin","portrait","post","preview","primary","priv","private","private_notes","profile","program","progress","pt-4","put","px-2","px-2.5","px-card","py-1","py-3","qc","queryFn","queryKey","re","react","react-router","read","ready","refetchInterval","refresh","reopen","reopened","reopening","request","requested","requested_mentor","rest","return","right","role","round","routes","rows","rule","rules","rules_text","rx","ry","s","save","saved","secondary","see","sees","selected","send","sends","set","setArea","setAreas","setBusy","setClosing","setDeleting","setEditing","setFocus","setForm","setMatching","setMentor","setNote","setPlayTime","setPriv","setReopening","setStatus","setSuggest","setText","settings","several","sheet","sheet_access","sheets","should","show","showMentor","shown","shrink-0","since","site","size","size-1.5","size-10","size-3","size-3.5","size-4","size-5","size-full","skill","sm","sm:grid-cols-2","small-gang","snooper","so","solidDanger","someone","space-y-0.5","space-y-1","space-y-2","space-y-3","space-y-4","space-y-5","space-y-6","sr-only","src","staff","state","stats","status","stays","still","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","subtitle","success","suggest","suggest_rules","suggest_text","suggested","t","tabular-nums","take","takes","target","text","text-3xl","text-[11px]","text-base","text-center","text-left","text-lg","text-muted","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-white","text-xs","that","the","their","them","themselves","these","they","this","thread","through","throw","tick","tickable","ticked","ticks","time","title","to","toast","toggle","told","tone","total","total_sp","transition-colors","truncate","try","type","undefined","under","up","update","us","useNavigate","useParams","useQuery","useQueryClient","useState","used","usually","value","variant","ve","viewBox","void","w-48","wait","waiting","want","warfare","warning","was","what","whatever","when","whether","while","whitespace-pre-line","who","whoever","widget","widgets","width","will","with","withdraw","withdrawn","withdrew","work","works","would","write","x","xl:col-span-2","xl:grid-cols-2","xl:grid-cols-3","xl:grid-cols-4","xl:grid-cols-[1fr_400px]","yet","you","your","zone"];
