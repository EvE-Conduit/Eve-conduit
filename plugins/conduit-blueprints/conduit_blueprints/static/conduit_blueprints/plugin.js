import { Avatar as e, Badge as t, Button as n, Card as r, CardHeader as i, Dialog as a, DiscordPings as o, EmptyState as s, Field as c, Input as l, PageHeader as u, SearchInput as d, Segmented as f, Select as p, Skeleton as m, StatCard as h, Switch as g, THead as _, Table as v, TableToolbar as ee, Td as y, Textarea as te, Th as b, Tr as x, api as S, date as C, definePlugin as ne, duration as w, num as T, timeAgo as E, toast as D } from "@conduit/sdk";
import { useMutation as O, useQuery as k, useQueryClient as A } from "@tanstack/react-query";
import { useEffect as re, useState as j } from "react";
import { Link as M } from "react-router";
import { Fragment as N, jsx as P, jsxs as F } from "react/jsx-runtime";
//#region src/icons.tsx
function I({ children: e, className: t = "size-4" }) {
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
var L = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [
		/* @__PURE__ */ P("path", { d: "M15 12h-5" }),
		/* @__PURE__ */ P("path", { d: "M15 8h-5" }),
		/* @__PURE__ */ P("path", { d: "M19 17V5a2 2 0 0 0-2-2H4" }),
		/* @__PURE__ */ P("path", { d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" })
	]
}), R = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [
		/* @__PURE__ */ P("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }),
		/* @__PURE__ */ P("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }),
		/* @__PURE__ */ P("path", { d: "M10 9H8" }),
		/* @__PURE__ */ P("path", { d: "M16 13H8" }),
		/* @__PURE__ */ P("path", { d: "M16 17H8" })
	]
}), z = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" }), /* @__PURE__ */ P("rect", {
		width: "20",
		height: "14",
		x: "2",
		y: "6",
		rx: "2"
	})]
}), B = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [
		/* @__PURE__ */ P("path", { d: "M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" }),
		/* @__PURE__ */ P("path", { d: "M8.5 2h7" }),
		/* @__PURE__ */ P("path", { d: "M7 16h10" })
	]
}), V = (e) => /* @__PURE__ */ P(I, {
	...e,
	children: /* @__PURE__ */ P("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })
}), H = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ P("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), U = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [
		/* @__PURE__ */ P("path", { d: "m11 17 2 2a1 1 0 1 0 3-3" }),
		/* @__PURE__ */ P("path", { d: "m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" }),
		/* @__PURE__ */ P("path", { d: "m21 3 1 11h-2" }),
		/* @__PURE__ */ P("path", { d: "M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" }),
		/* @__PURE__ */ P("path", { d: "M3 4h8" })
	]
}), W = (e) => /* @__PURE__ */ P(I, {
	...e,
	children: /* @__PURE__ */ P("path", { d: "M20 6 9 17l-5-5" })
}), ie = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [
		/* @__PURE__ */ P("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ P("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ P("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ P("path", { d: "M8 16H3v5" })
	]
}), ae = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ P("path", { d: "M19 12H5" })]
});
//#endregion
//#region src/shared.tsx
function G() {
	let e = A();
	return () => e.invalidateQueries({ queryKey: ["blueprints"] });
}
function K(e) {
	D.error(e.message);
}
function q({ to: e, children: t }) {
	return /* @__PURE__ */ F(M, {
		to: e,
		className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
		children: [
			/* @__PURE__ */ P(ae, {}),
			" ",
			t
		]
	});
}
var J = {
	open: {
		label: "Waiting",
		tone: "accent"
	},
	accepted: {
		label: "Accepted",
		tone: "info"
	},
	in_progress: {
		label: "In progress",
		tone: "info"
	},
	delivered: {
		label: "Delivered",
		tone: "success"
	},
	returned: {
		label: "Returned",
		tone: "neutral"
	},
	declined: {
		label: "Declined",
		tone: "danger"
	},
	cancelled: {
		label: "Cancelled",
		tone: "neutral"
	}
};
function Y({ r: e }) {
	return e.kind === "loan" && e.status === "delivered" ? /* @__PURE__ */ P(t, {
		tone: e.overdue ? "danger" : "warning",
		children: e.overdue ? "Overdue" : "On loan"
	}) : /* @__PURE__ */ P(t, {
		tone: J[e.status].tone,
		children: J[e.status].label
	});
}
function X({ me: e, te: t }) {
	return e === null && t === null ? /* @__PURE__ */ P("span", {
		className: "text-subtle",
		children: "—"
	}) : /* @__PURE__ */ F("span", {
		className: "font-mono tabular-nums",
		children: [
			/* @__PURE__ */ F("span", {
				className: e === 10 ? "text-success-fg" : void 0,
				children: ["ME ", e ?? "—"]
			}),
			/* @__PURE__ */ P("span", {
				className: "text-subtle",
				children: " / "
			}),
			/* @__PURE__ */ F("span", {
				className: t === 20 ? "text-success-fg" : void 0,
				children: ["TE ", t ?? "—"]
			})
		]
	});
}
function oe({ r: e }) {
	if (e.kind === "loan") return /* @__PURE__ */ F("span", { children: ["Borrow the original", e.loan_days ? ` for ${e.loan_days} day${e.loan_days === 1 ? "" : "s"}` : ""] });
	let t = [e.min_me === null ? null : `ME ${e.min_me}+`, e.min_te === null ? null : `TE ${e.min_te}+`].filter(Boolean).join(", ");
	return /* @__PURE__ */ F("span", { children: [
		/* @__PURE__ */ P("span", {
			className: "font-mono",
			children: T(e.copies)
		}),
		" × ",
		/* @__PURE__ */ P("span", {
			className: "font-mono",
			children: T(e.runs)
		}),
		" run",
		e.runs === 1 ? "" : "s",
		t && /* @__PURE__ */ F("span", {
			className: "text-muted",
			children: [" · ", t]
		})
	] });
}
function se({ job: e }) {
	if (!e) return null;
	let t = e.status === "active" && e.end_date ? `, ready in ${w(e.end_date)}` : "";
	return /* @__PURE__ */ F("span", {
		className: "text-xs text-info-fg",
		children: [
			"Copy job ",
			e.job_id,
			": ",
			e.status,
			t
		]
	});
}
function Z({ src: e, name: t }) {
	return /* @__PURE__ */ P("img", {
		src: e,
		alt: "",
		title: t,
		className: "size-8 shrink-0 bg-surface-2",
		loading: "lazy"
	});
}
function Q({ title: e, description: t, placeholder: r, confirmLabel: i, onSubmit: o, onClose: s, children: u, withNote: d = !0 }) {
	let f = G(), [p, m] = j(""), h = O({
		mutationFn: () => o(p),
		onSuccess: () => {
			f(), s();
		},
		onError: K
	});
	return /* @__PURE__ */ P(a, {
		open: !0,
		onOpenChange: (e) => !e && s(),
		title: e,
		description: t,
		footer: /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ P(n, {
			variant: "ghost",
			onClick: s,
			children: "Cancel"
		}), /* @__PURE__ */ P(n, {
			variant: "primary",
			loading: h.isPending,
			onClick: () => h.mutate(),
			children: i
		})] }),
		children: /* @__PURE__ */ F("div", {
			className: "space-y-4",
			children: [u, d && /* @__PURE__ */ P(c, {
				label: "Note for the member",
				hint: "Optional. They see it in the notification.",
				children: /* @__PURE__ */ P(l, {
					value: p,
					maxLength: 500,
					onChange: (e) => m(e.target.value),
					placeholder: r,
					autoFocus: !0
				})
			})]
		})
	});
}
//#endregion
//#region src/types.ts
var $ = "/api/p/blueprints";
//#endregion
//#region src/library.tsx
function ce() {
	let [e, i] = j(""), [a, o] = j(""), [c, h] = j(""), [g, te] = j(""), [C, ne] = j(""), [w, A] = j(""), [I, R] = j(""), [z, B] = j(null);
	re(() => {
		let t = setTimeout(() => o(e.trim()), 250);
		return () => clearTimeout(t);
	}, [e]);
	let V = new URLSearchParams();
	a && V.set("q", a), c && V.set("kind", c), g && V.set("category", g), C && V.set("source", C), w !== "" && V.set("me_min", w), I && V.set("corporation", I);
	let { data: H, isLoading: U } = k({
		queryKey: [
			"blueprints",
			"library",
			V.toString()
		],
		queryFn: () => S.get(`${$}/library?${V}`),
		placeholderData: (e) => e
	}), W = O({
		mutationFn: () => S.post(`${$}/sync`),
		onSuccess: (e) => D.success(`Reading ${e.queued} corporation${e.queued === 1 ? "" : "s"} again; refresh in a minute.`),
		onError: K
	});
	return /* @__PURE__ */ F(N, { children: [
		/* @__PURE__ */ P(u, {
			eyebrow: "Industry",
			title: "Blueprint Library",
			icon: /* @__PURE__ */ P(L, {}),
			description: "Every blueprint the corporations own, and originals members share. Open one to ask for copies or to borrow it.",
			actions: /* @__PURE__ */ F("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ P(M, {
					to: "/p/blueprints/requests",
					children: /* @__PURE__ */ P(n, {
						variant: "ghost",
						children: "My requests"
					})
				}), H?.can_manage && /* @__PURE__ */ F(n, {
					variant: "ghost",
					loading: W.isPending,
					onClick: () => W.mutate(),
					children: [/* @__PURE__ */ P(ie, {}), " Read again"]
				})]
			})
		}),
		/* @__PURE__ */ F(r, { children: [/* @__PURE__ */ F(ee, { children: [
			/* @__PURE__ */ P(d, {
				className: "w-full sm:w-64",
				value: e,
				onChange: (e) => i(e.target.value),
				placeholder: "Blueprint or what it makes",
				"aria-label": "Search"
			}),
			/* @__PURE__ */ P(f, {
				size: "sm",
				value: c,
				onChange: h,
				"aria-label": "Originals or copies",
				options: [
					{
						value: "",
						label: "All"
					},
					{
						value: "original",
						label: "BPO"
					},
					{
						value: "copy",
						label: "BPC"
					}
				]
			}),
			/* @__PURE__ */ P(p, {
				className: "h-9 w-auto",
				value: g,
				onChange: (e) => te(e.target.value),
				"aria-label": "Category",
				options: [{
					value: "",
					label: "Every category"
				}, ...(H?.categories ?? []).map((e) => ({
					value: e.name,
					label: `${e.name} (${e.count})`
				}))]
			}),
			/* @__PURE__ */ P(p, {
				className: "h-9 w-auto",
				value: C,
				onChange: (e) => ne(e.target.value),
				"aria-label": "Whose",
				options: [
					{
						value: "",
						label: "Corporations and members"
					},
					{
						value: "corporation",
						label: "Corporations"
					},
					{
						value: "personal",
						label: "Members' shared"
					}
				]
			}),
			(H?.corporations.length ?? 0) > 1 && /* @__PURE__ */ P(p, {
				className: "h-9 w-auto",
				value: I,
				onChange: (e) => R(e.target.value),
				"aria-label": "Corporation",
				options: [{
					value: "",
					label: "Every corporation"
				}, ...H.corporations.map((e) => ({
					value: String(e.id),
					label: e.ticker || e.name
				}))]
			}),
			/* @__PURE__ */ P(l, {
				className: "w-24",
				type: "number",
				min: 0,
				max: 10,
				value: w,
				onChange: (e) => A(e.target.value),
				placeholder: "ME ≥",
				"aria-label": "Lowest ME"
			})
		] }), U || !H ? /* @__PURE__ */ P("div", {
			className: "p-card",
			children: /* @__PURE__ */ P(m, { className: "h-64" })
		}) : H.groups.length === 0 ? /* @__PURE__ */ P(s, {
			icon: /* @__PURE__ */ P(L, {}),
			title: "No blueprints here",
			description: H.corporations.length === 0 ? "The library fills once a Director's login can read the corporation's blueprints." : "Nothing matches these filters."
		}) : /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ F(v, { children: [/* @__PURE__ */ P(_, { children: /* @__PURE__ */ F("tr", { children: [
			/* @__PURE__ */ P(b, { children: "Blueprint" }),
			/* @__PURE__ */ P(b, { children: "Makes" }),
			/* @__PURE__ */ P(b, {
				align: "right",
				children: "BPO"
			}),
			/* @__PURE__ */ P(b, {
				align: "right",
				children: "BPC"
			}),
			/* @__PURE__ */ P(b, { children: "Best original" }),
			/* @__PURE__ */ P(b, { children: "Owner" })
		] }) }), /* @__PURE__ */ P("tbody", { children: H.groups.map((e) => /* @__PURE__ */ F(x, {
			interactive: !0,
			onClick: () => B(e),
			children: [
				/* @__PURE__ */ P(y, { children: /* @__PURE__ */ F("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ P(Z, {
						src: e.icon,
						name: e.name
					}), /* @__PURE__ */ P("span", {
						className: "font-medium",
						children: e.name
					})]
				}) }),
				/* @__PURE__ */ P(y, { children: e.product ? /* @__PURE__ */ F("div", {
					className: "text-sm",
					children: [e.product.name, /* @__PURE__ */ P("div", {
						className: "text-xs text-muted",
						children: e.product.group
					})]
				}) : /* @__PURE__ */ P("span", {
					className: "text-subtle",
					children: "—"
				}) }),
				/* @__PURE__ */ P(y, {
					numeric: !0,
					children: e.originals ? T(e.originals) : "—"
				}),
				/* @__PURE__ */ P(y, {
					numeric: !0,
					children: e.copies ? /* @__PURE__ */ P("span", {
						title: `${T(e.copy_runs)} runs in all`,
						children: T(e.copies)
					}) : "—"
				}),
				/* @__PURE__ */ P(y, { children: /* @__PURE__ */ P(X, {
					me: e.best_me,
					te: e.best_te
				}) }),
				/* @__PURE__ */ P(y, { children: /* @__PURE__ */ F("div", {
					className: "flex flex-wrap gap-1",
					children: [e.owners.map((e) => /* @__PURE__ */ P(t, {
						tone: "neutral",
						children: e
					}, e)), e.personal > 0 && /* @__PURE__ */ F(t, {
						tone: "info",
						children: [e.personal, " personal"]
					})]
				}) })
			]
		}, e.type_id)) })] }), /* @__PURE__ */ F("div", {
			className: "flex flex-wrap justify-between gap-2 px-card py-3 text-xs text-muted",
			children: [/* @__PURE__ */ P("span", { children: H.truncated ? `First ${T(H.groups.length)} of ${T(H.total)}; narrow the search to see the rest.` : `${T(H.total)} blueprint${H.total === 1 ? "" : "s"}` }), /* @__PURE__ */ P("span", { children: H.corporations.map((e) => `${e.ticker || e.name} read ${e.synced_at ? E(e.synced_at) : "never"}`).join(" · ") })]
		})] })] }),
		z && /* @__PURE__ */ P(le, {
			group: z,
			onClose: () => B(null)
		})
	] });
}
function le({ group: e, onClose: r }) {
	let [i, o] = j(null), { data: s } = k({
		queryKey: [
			"blueprints",
			"type",
			e.type_id
		],
		queryFn: () => S.get(`${$}/library/${e.type_id}`)
	});
	return i && s ? /* @__PURE__ */ P(ue, {
		detail: s,
		kind: i,
		onClose: r
	}) : /* @__PURE__ */ P(a, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: e.name,
		description: e.product ? `Makes ${e.product.name} (${e.product.group})` : void 0,
		size: "xl",
		footer: /* @__PURE__ */ F(N, { children: [
			/* @__PURE__ */ P(n, {
				variant: "ghost",
				onClick: r,
				children: "Close"
			}),
			/* @__PURE__ */ F(n, {
				variant: "secondary",
				disabled: !s?.has_original,
				onClick: () => o("loan"),
				children: [/* @__PURE__ */ P(U, {}), " Borrow the original"]
			}),
			/* @__PURE__ */ F(n, {
				variant: "primary",
				disabled: !s,
				onClick: () => o("copy"),
				children: [/* @__PURE__ */ P(H, {}), " Ask for copies"]
			})
		] }),
		children: s ? /* @__PURE__ */ F("div", {
			className: "space-y-3",
			children: [s.open_requests > 0 && /* @__PURE__ */ F("p", {
				className: "text-xs text-muted",
				children: [
					s.open_requests,
					" request",
					s.open_requests === 1 ? "" : "s",
					" for this blueprint waiting already."
				]
			}), /* @__PURE__ */ F(v, { children: [/* @__PURE__ */ P(_, { children: /* @__PURE__ */ F("tr", { children: [
				/* @__PURE__ */ P(b, { children: "Kind" }),
				/* @__PURE__ */ P(b, { children: "Research" }),
				/* @__PURE__ */ P(b, {
					align: "right",
					children: "Runs"
				}),
				/* @__PURE__ */ P(b, { children: "Owner" }),
				/* @__PURE__ */ P(b, { children: "Where" })
			] }) }), /* @__PURE__ */ P("tbody", { children: s.entries.map((e) => /* @__PURE__ */ F(x, { children: [
				/* @__PURE__ */ P(y, { children: /* @__PURE__ */ F("div", {
					className: "flex items-center gap-1.5",
					children: [/* @__PURE__ */ P(t, {
						tone: e.copy ? "neutral" : "accent",
						children: e.copy ? "Copy" : "Original"
					}), e.quantity > 1 && /* @__PURE__ */ F("span", {
						className: "font-mono text-xs",
						children: ["× ", T(e.quantity)]
					})]
				}) }),
				/* @__PURE__ */ P(y, { children: /* @__PURE__ */ P(X, {
					me: e.me,
					te: e.te
				}) }),
				/* @__PURE__ */ P(y, {
					numeric: !0,
					children: e.runs < 0 ? "∞" : T(e.runs)
				}),
				/* @__PURE__ */ P(y, { children: e.source === "personal" ? /* @__PURE__ */ F("div", {
					className: "flex items-center gap-1.5",
					children: [/* @__PURE__ */ P(t, {
						tone: "info",
						children: "Personal"
					}), /* @__PURE__ */ P("span", { children: e.owner.name })]
				}) : /* @__PURE__ */ F("span", { children: [e.owner.ticker ? `[${e.owner.ticker}] ` : "", e.owner.name] }) }),
				/* @__PURE__ */ F(y, { children: [/* @__PURE__ */ P("div", {
					className: "text-sm",
					children: e.location?.name ?? "Unknown location"
				}), (e.location?.system || e.division) && /* @__PURE__ */ P("div", {
					className: "text-xs text-muted",
					children: [e.location?.system, e.division].filter(Boolean).join(" · ")
				})] })
			] }, e.id)) })] })]
		}) : /* @__PURE__ */ P(m, { className: "h-40" })
	});
}
function ue({ detail: e, kind: t, onClose: r }) {
	let i = G(), { data: o } = k({
		queryKey: ["blueprints", "options"],
		queryFn: () => S.get(`${$}/options`),
		staleTime: 3e5
	}), [s, u] = j({
		runs: "1",
		copies: "1",
		min_me: "",
		min_te: "",
		loan_days: "7",
		note: "",
		project_id: ""
	}), d = (e) => u((t) => ({
		...t,
		...e
	})), f = O({
		mutationFn: () => {
			let n = (e) => e === "" ? null : Number(e);
			return S.post(`${$}/requests`, {
				kind: t,
				type_id: e.type_id,
				runs: Number(s.runs) || 1,
				copies: Number(s.copies) || 1,
				min_me: n(s.min_me),
				min_te: n(s.min_te),
				loan_days: t === "loan" ? Number(s.loan_days) || 7 : null,
				note: s.note,
				project_id: n(s.project_id)
			});
		},
		onSuccess: () => {
			D.success("Asked. The library managers are told, and you hear back here and under the bell."), i(), r();
		},
		onError: K
	});
	return /* @__PURE__ */ P(a, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: t === "copy" ? `Copies of ${e.name}` : `Borrow ${e.name}`,
		description: t === "copy" ? `Best original: ME ${e.best_me ?? "—"} / TE ${e.best_te ?? "—"}.` : "You get the original for the days you ask; the due date is set when it's handed over.",
		footer: /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ P(n, {
			variant: "ghost",
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ P(n, {
			variant: "primary",
			loading: f.isPending,
			onClick: () => f.mutate(),
			children: "Send request"
		})] }),
		children: /* @__PURE__ */ F("div", {
			className: "space-y-4",
			children: [
				t === "copy" ? /* @__PURE__ */ F("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ P(c, {
							label: "Runs per copy",
							children: /* @__PURE__ */ P(l, {
								type: "number",
								min: 1,
								max: 5e3,
								value: s.runs,
								onChange: (e) => d({ runs: e.target.value })
							})
						}),
						/* @__PURE__ */ P(c, {
							label: "Copies",
							children: /* @__PURE__ */ P(l, {
								type: "number",
								min: 1,
								max: 100,
								value: s.copies,
								onChange: (e) => d({ copies: e.target.value })
							})
						}),
						/* @__PURE__ */ P(c, {
							label: "ME at least",
							hint: "Empty: whatever the library has.",
							children: /* @__PURE__ */ P(l, {
								type: "number",
								min: 0,
								max: 10,
								value: s.min_me,
								onChange: (e) => d({ min_me: e.target.value })
							})
						}),
						/* @__PURE__ */ P(c, {
							label: "TE at least",
							children: /* @__PURE__ */ P(l, {
								type: "number",
								min: 0,
								max: 20,
								step: 2,
								value: s.min_te,
								onChange: (e) => d({ min_te: e.target.value })
							})
						})
					]
				}) : /* @__PURE__ */ P(c, {
					label: "For how many days",
					children: /* @__PURE__ */ P(l, {
						type: "number",
						min: 1,
						max: 90,
						value: s.loan_days,
						onChange: (e) => d({ loan_days: e.target.value })
					})
				}),
				o && o.projects.length > 0 && /* @__PURE__ */ P(c, {
					label: "For an industry project",
					hint: "Optional.",
					children: /* @__PURE__ */ P(p, {
						value: s.project_id,
						onChange: (e) => d({ project_id: e.target.value }),
						options: [{
							value: "",
							label: "None"
						}, ...o.projects.map((e) => ({
							value: String(e.id),
							label: e.name
						}))]
					})
				}),
				/* @__PURE__ */ P(c, {
					label: "Note",
					children: /* @__PURE__ */ P(te, {
						rows: 2,
						maxLength: 500,
						value: s.note,
						onChange: (e) => d({ note: e.target.value }),
						placeholder: "Where to drop them, when you need them…"
					})
				})
			]
		})
	});
}
//#endregion
//#region src/queue.tsx
function de() {
	let [t, n] = j("active"), [i, a] = j(null), { data: c, isLoading: l } = k({
		queryKey: [
			"blueprints",
			"queue",
			t
		],
		queryFn: () => S.get(`${$}/queue?show=${t}`),
		refetchInterval: 6e4
	}), d = (e, t) => a({
		r: e,
		action: t
	});
	return /* @__PURE__ */ F(N, { children: [
		/* @__PURE__ */ P(q, {
			to: "/p/blueprints",
			children: "Library"
		}),
		/* @__PURE__ */ P(u, {
			eyebrow: "Industry",
			title: "Request queue",
			icon: /* @__PURE__ */ P(V, {}),
			description: "Accept a request, mark it in progress with the copy job, then deliver it. The member is told at each step."
		}),
		/* @__PURE__ */ P(f, {
			className: "mb-4",
			value: t,
			onChange: n,
			"aria-label": "Which requests",
			options: [
				{
					value: "active",
					label: `Waiting${c?.counts.active ? ` (${c.counts.active})` : ""}`
				},
				{
					value: "loans",
					label: `On loan${c?.counts.loans ? ` (${c.counts.loans}${c.counts.overdue ? `, ${c.counts.overdue} overdue` : ""})` : ""}`
				},
				{
					value: "done",
					label: "Finished"
				}
			]
		}),
		/* @__PURE__ */ P(r, { children: l || !c ? /* @__PURE__ */ P("div", {
			className: "p-card",
			children: /* @__PURE__ */ P(m, { className: "h-40" })
		}) : c.requests.length === 0 ? /* @__PURE__ */ P(s, {
			icon: /* @__PURE__ */ P(V, {}),
			title: t === "loans" ? "Nothing out on loan" : t === "active" ? "Nothing waiting" : "Nothing finished yet"
		}) : /* @__PURE__ */ F(v, { children: [/* @__PURE__ */ P(_, { children: /* @__PURE__ */ F("tr", { children: [
			/* @__PURE__ */ P(b, { children: "Member" }),
			/* @__PURE__ */ P(b, { children: "Blueprint" }),
			/* @__PURE__ */ P(b, { children: "Asked for" }),
			/* @__PURE__ */ P(b, { children: "Status" }),
			/* @__PURE__ */ P(b, {
				align: "right",
				children: t === "loans" ? "Due" : "Asked"
			}),
			/* @__PURE__ */ P(b, { align: "right" })
		] }) }), /* @__PURE__ */ P("tbody", { children: c.requests.map((n) => /* @__PURE__ */ F(x, { children: [
			/* @__PURE__ */ P(y, { children: /* @__PURE__ */ F("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ P(e, {
					src: n.user.portrait,
					name: n.user.name,
					size: "sm"
				}), /* @__PURE__ */ P("span", {
					className: "font-medium",
					children: n.user.name
				})]
			}) }),
			/* @__PURE__ */ P(y, { children: /* @__PURE__ */ F("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ P(Z, {
					src: n.icon,
					name: n.name
				}), /* @__PURE__ */ F("div", { children: [/* @__PURE__ */ P("div", { children: n.name }), n.project && /* @__PURE__ */ F("div", {
					className: "text-xs text-muted",
					children: ["For ", n.project.name]
				})] })]
			}) }),
			/* @__PURE__ */ F(y, { children: [/* @__PURE__ */ P(oe, { r: n }), n.note && /* @__PURE__ */ F("div", {
				className: "text-xs italic text-muted",
				children: [
					"“",
					n.note,
					"”"
				]
			})] }),
			/* @__PURE__ */ F(y, { children: [
				/* @__PURE__ */ P(Y, { r: n }),
				n.handled_by && /* @__PURE__ */ P("div", {
					className: "text-xs text-muted",
					children: n.handled_by.name
				}),
				/* @__PURE__ */ P(se, { job: n.job })
			] }),
			/* @__PURE__ */ P(y, {
				align: "right",
				className: "text-xs text-muted",
				children: t === "loans" && n.due_at ? /* @__PURE__ */ P("span", {
					className: n.overdue ? "text-danger-fg" : void 0,
					children: C(n.due_at)
				}) : E(n.created_at)
			}),
			/* @__PURE__ */ P(y, {
				align: "right",
				children: /* @__PURE__ */ P(fe, {
					r: n,
					act: d
				})
			})
		] }, n.id)) })] }) }),
		/* @__PURE__ */ P(o, {
			plugin: "blueprints",
			className: "panel mt-6 p-card"
		}),
		i && /* @__PURE__ */ P(me, {
			r: i.r,
			action: i.action,
			onClose: () => a(null)
		})
	] });
}
function fe({ r: e, act: t }) {
	return e.kind === "loan" && e.status === "delivered" ? /* @__PURE__ */ F("div", {
		className: "flex justify-end gap-1.5",
		children: [/* @__PURE__ */ P(n, {
			size: "xs",
			variant: "ghost",
			onClick: () => t(e, "due"),
			children: "Due date"
		}), /* @__PURE__ */ P(pe, { r: e })]
	}) : [
		"open",
		"accepted",
		"in_progress"
	].includes(e.status) ? /* @__PURE__ */ F("div", {
		className: "flex justify-end gap-1.5",
		children: [
			e.status === "open" && /* @__PURE__ */ P(n, {
				size: "xs",
				variant: "secondary",
				onClick: () => t(e, "accept"),
				children: "Accept"
			}),
			e.kind === "copy" && /* @__PURE__ */ P(n, {
				size: "xs",
				variant: "secondary",
				onClick: () => t(e, "start"),
				children: e.status === "in_progress" ? "Copy job" : "In progress"
			}),
			/* @__PURE__ */ F(n, {
				size: "xs",
				variant: "success",
				onClick: () => t(e, "deliver"),
				children: [/* @__PURE__ */ P(W, {}), " Deliver"]
			}),
			/* @__PURE__ */ P(n, {
				size: "xs",
				variant: "ghost",
				onClick: () => t(e, "decline"),
				children: "Decline"
			})
		]
	}) : null;
}
function pe({ r: e }) {
	let [t, r] = j(!1);
	return /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ F(n, {
		size: "xs",
		variant: "success",
		onClick: () => r(!0),
		children: [/* @__PURE__ */ P(W, {}), " Returned"]
	}), t && /* @__PURE__ */ P(Q, {
		title: `Has ${e.user.name} brought back ${e.name}?`,
		placeholder: "",
		withNote: !1,
		confirmLabel: "It's back",
		onSubmit: () => S.post(`/api/p/blueprints/requests/${e.id}/returned`),
		onClose: () => r(!1)
	})] });
}
function me({ r: e, action: n, onClose: r }) {
	let [i, a] = j(e.job ? String(e.job.job_id) : ""), [o, s] = j(() => (e.due_at ? new Date(e.due_at) : new Date(Date.now() + (e.loan_days ?? 7) * 864e5)).toISOString().slice(0, 10)), u = k({
		queryKey: [
			"blueprints",
			"jobs",
			e.id
		],
		queryFn: () => S.get(`${$}/requests/${e.id}/jobs`),
		enabled: n === "start"
	}), d = `${$}/requests/${e.id}/${n}`, f = `${o}T11:00:00Z`, m = {
		onClose: r,
		placeholder: ""
	};
	switch (n) {
		case "accept": return /* @__PURE__ */ P(Q, {
			...m,
			title: `Accept ${e.user.name}'s request?`,
			placeholder: "Copying tonight",
			confirmLabel: "Accept",
			onSubmit: (e) => S.post(d, { note: e })
		});
		case "decline": return /* @__PURE__ */ P(Q, {
			...m,
			title: `Decline ${e.user.name}'s request?`,
			placeholder: "We don't lend capital blueprints",
			confirmLabel: "Decline",
			onSubmit: (e) => S.post(d, { note: e })
		});
		case "start": return /* @__PURE__ */ P(Q, {
			...m,
			title: "Copies in progress",
			description: "Link the corporation copying job making them, if it's synced already.",
			placeholder: "",
			confirmLabel: "Save",
			onSubmit: (e) => S.post(d, {
				note: e,
				job_id: i ? Number(i) : 0
			}),
			children: /* @__PURE__ */ P(c, {
				label: "Copy job",
				hint: u.data && u.data.length === 0 ? "No corporation copying job of this blueprint since the request (jobs sync every 30 minutes)." : void 0,
				children: /* @__PURE__ */ P(p, {
					value: i,
					onChange: (e) => a(e.target.value),
					options: [{
						value: "",
						label: "No job"
					}, ...(u.data ?? []).map((e) => ({
						value: String(e.job_id),
						label: `${e.corporation} · ${e.installer || "?"} · ${e.runs} run${e.runs === 1 ? "" : "s"} · ${e.status} · ends ${C(e.end_date)}`
					}))]
				})
			})
		});
		case "deliver": return /* @__PURE__ */ P(Q, {
			...m,
			title: e.kind === "loan" ? `Hand ${e.name} to ${e.user.name}` : `Deliver to ${e.user.name}`,
			placeholder: "In your hangar at staging",
			confirmLabel: "Delivered",
			onSubmit: (t) => S.post(d, {
				note: t,
				due_at: e.kind === "loan" ? f : null
			}),
			children: e.kind === "loan" && /* @__PURE__ */ P(c, {
				label: "Due back",
				children: /* @__PURE__ */ P(l, {
					type: "date",
					value: o,
					onChange: (e) => s(e.target.value)
				})
			})
		});
		case "due": return /* @__PURE__ */ F(Q, {
			...m,
			title: `New due date for ${e.name}`,
			placeholder: "",
			confirmLabel: "Save",
			withNote: !1,
			onSubmit: () => S.post(d, { due_at: f }),
			children: [/* @__PURE__ */ P(c, {
				label: "Due back",
				children: /* @__PURE__ */ P(l, {
					type: "date",
					value: o,
					onChange: (e) => s(e.target.value)
				})
			}), e.overdue && /* @__PURE__ */ P(t, {
				tone: "danger",
				children: "Overdue now"
			})]
		});
	}
}
//#endregion
//#region src/requests.tsx
var he = [
	"open",
	"accepted",
	"in_progress"
];
function ge() {
	let e = G(), { data: t, isLoading: i } = k({
		queryKey: ["blueprints", "mine"],
		queryFn: () => S.get(`${$}/requests`)
	}), a = O({
		mutationFn: (e) => S.post(`${$}/requests/${e.id}/cancel`),
		onSuccess: () => {
			D.success("Cancelled"), e();
		},
		onError: K
	});
	return /* @__PURE__ */ F(N, { children: [
		/* @__PURE__ */ P(q, {
			to: "/p/blueprints",
			children: "Library"
		}),
		/* @__PURE__ */ P(u, {
			eyebrow: "Industry",
			title: "My requests",
			icon: /* @__PURE__ */ P(R, {}),
			description: "Copies and loans you asked for. You're told each time a manager moves one on."
		}),
		/* @__PURE__ */ P(r, { children: i || !t ? /* @__PURE__ */ P("div", {
			className: "p-card",
			children: /* @__PURE__ */ P(m, { className: "h-40" })
		}) : t.length === 0 ? /* @__PURE__ */ P(s, {
			icon: /* @__PURE__ */ P(R, {}),
			title: "No requests yet",
			description: /* @__PURE__ */ F(N, { children: [
				"Open a blueprint in the ",
				/* @__PURE__ */ P(M, {
					to: "/p/blueprints",
					className: "text-accent-ink hover:underline",
					children: "library"
				}),
				" to ask for copies."
			] })
		}) : /* @__PURE__ */ F(v, { children: [/* @__PURE__ */ P(_, { children: /* @__PURE__ */ F("tr", { children: [
			/* @__PURE__ */ P(b, { children: "Blueprint" }),
			/* @__PURE__ */ P(b, { children: "Asked for" }),
			/* @__PURE__ */ P(b, { children: "Status" }),
			/* @__PURE__ */ P(b, { children: "From the library" }),
			/* @__PURE__ */ P(b, {
				align: "right",
				children: "Asked"
			}),
			/* @__PURE__ */ P(b, { align: "right" })
		] }) }), /* @__PURE__ */ P("tbody", { children: t.map((e) => /* @__PURE__ */ F(x, { children: [
			/* @__PURE__ */ P(y, { children: /* @__PURE__ */ F("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ P(Z, {
					src: e.icon,
					name: e.name
				}), /* @__PURE__ */ F("div", { children: [/* @__PURE__ */ P("div", {
					className: "font-medium",
					children: e.name
				}), e.project && /* @__PURE__ */ F("div", {
					className: "text-xs text-muted",
					children: ["For ", /* @__PURE__ */ P(M, {
						to: `/p/projects/${e.project.id}`,
						className: "hover:text-accent-ink",
						children: e.project.name
					})]
				})] })]
			}) }),
			/* @__PURE__ */ F(y, { children: [/* @__PURE__ */ P(oe, { r: e }), e.note && /* @__PURE__ */ F("div", {
				className: "text-xs italic text-muted",
				children: [
					"“",
					e.note,
					"”"
				]
			})] }),
			/* @__PURE__ */ F(y, { children: [/* @__PURE__ */ P(Y, { r: e }), e.due_at && e.status === "delivered" && /* @__PURE__ */ F("div", {
				className: "text-xs text-muted",
				children: ["due back ", C(e.due_at)]
			})] }),
			/* @__PURE__ */ F(y, { children: [
				e.handled_by && /* @__PURE__ */ P("div", {
					className: "text-sm",
					children: e.handled_by.name
				}),
				e.response && /* @__PURE__ */ F("div", {
					className: "text-xs italic text-muted",
					children: [
						"“",
						e.response,
						"”"
					]
				}),
				/* @__PURE__ */ P(se, { job: e.job })
			] }),
			/* @__PURE__ */ P(y, {
				align: "right",
				className: "text-xs text-muted",
				children: E(e.created_at)
			}),
			/* @__PURE__ */ P(y, {
				align: "right",
				children: he.includes(e.status) && /* @__PURE__ */ P(n, {
					size: "xs",
					variant: "ghost",
					loading: a.isPending && a.variables?.id === e.id,
					onClick: () => a.mutate(e),
					children: "Cancel"
				})
			})
		] }, e.id)) })] }) })
	] });
}
//#endregion
//#region src/research.tsx
function _e() {
	let { data: e, isLoading: n } = k({
		queryKey: ["blueprints", "research"],
		queryFn: () => S.get(`${$}/research`),
		refetchInterval: 3e5
	});
	return /* @__PURE__ */ F(N, { children: [
		/* @__PURE__ */ P(q, {
			to: "/p/blueprints",
			children: "Library"
		}),
		/* @__PURE__ */ P(u, {
			eyebrow: "Industry",
			title: "Research",
			icon: /* @__PURE__ */ P(B, {}),
			description: "Corporation originals that aren't fully researched, and the research and copy jobs running in the corporations."
		}),
		n || !e ? /* @__PURE__ */ P(m, { className: "h-64" }) : /* @__PURE__ */ F("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ F("div", {
					className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
					children: [
						/* @__PURE__ */ P(h, {
							label: "Originals",
							value: e.summary.originals
						}),
						/* @__PURE__ */ P(h, {
							label: "Fully researched",
							value: e.summary.researched,
							tone: "success",
							hint: "ME 10 and TE 20"
						}),
						/* @__PURE__ */ P(h, {
							label: "ME below 10",
							value: e.summary.me_short,
							tone: e.summary.me_short ? "warning" : void 0
						}),
						/* @__PURE__ */ P(h, {
							label: "TE below 20",
							value: e.summary.te_short,
							tone: e.summary.te_short ? "warning" : void 0
						})
					]
				}),
				/* @__PURE__ */ F(r, { children: [/* @__PURE__ */ P(i, {
					title: "Running jobs",
					description: "ME and TE research, copying and invention in the corporations' industry jobs."
				}), e.jobs.length === 0 ? /* @__PURE__ */ P("p", {
					className: "px-card pb-card text-sm text-muted",
					children: "Nothing running."
				}) : /* @__PURE__ */ F(v, { children: [/* @__PURE__ */ P(_, { children: /* @__PURE__ */ F("tr", { children: [
					/* @__PURE__ */ P(b, { children: "Blueprint" }),
					/* @__PURE__ */ P(b, { children: "Job" }),
					/* @__PURE__ */ P(b, { children: "Installed by" }),
					/* @__PURE__ */ P(b, { children: "Where" }),
					/* @__PURE__ */ P(b, {
						align: "right",
						children: "Ends"
					})
				] }) }), /* @__PURE__ */ P("tbody", { children: e.jobs.map((e) => /* @__PURE__ */ F(x, { children: [
					/* @__PURE__ */ P(y, { children: /* @__PURE__ */ F("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ P(Z, {
							src: e.icon,
							name: e.name
						}), /* @__PURE__ */ P("span", { children: e.name })]
					}) }),
					/* @__PURE__ */ F(y, { children: [/* @__PURE__ */ F("div", { children: [
						e.activity,
						" · ",
						/* @__PURE__ */ P("span", {
							className: "font-mono",
							children: e.runs
						}),
						" run",
						e.runs === 1 ? "" : "s"
					] }), e.status !== "active" && /* @__PURE__ */ P(t, {
						tone: e.status === "ready" ? "success" : "neutral",
						children: e.status
					})] }),
					/* @__PURE__ */ F(y, { children: [e.installer || "—", /* @__PURE__ */ P("div", {
						className: "text-xs text-muted",
						children: e.corporation
					})] }),
					/* @__PURE__ */ P(y, {
						className: "text-sm",
						children: e.location?.name ?? "—"
					}),
					/* @__PURE__ */ P(y, {
						align: "right",
						className: "text-xs text-muted",
						title: C(e.end_date),
						children: e.status === "active" ? w(e.end_date) : "—"
					})
				] }, e.job_id)) })] })] }),
				/* @__PURE__ */ F(r, { children: [/* @__PURE__ */ P(i, { title: "Not fully researched" }), e.unresearched.length === 0 ? /* @__PURE__ */ P(s, {
					icon: /* @__PURE__ */ P(B, {}),
					title: "Everything is researched",
					description: e.summary.originals ? "Every corporation original is ME 10 / TE 20." : "No corporation originals yet."
				}) : /* @__PURE__ */ F(v, { children: [/* @__PURE__ */ P(_, { children: /* @__PURE__ */ F("tr", { children: [
					/* @__PURE__ */ P(b, { children: "Blueprint" }),
					/* @__PURE__ */ P(b, { children: "Research" }),
					/* @__PURE__ */ P(b, { children: "Owner" }),
					/* @__PURE__ */ P(b, { children: "Where" })
				] }) }), /* @__PURE__ */ P("tbody", { children: e.unresearched.map((e) => /* @__PURE__ */ F(x, { children: [
					/* @__PURE__ */ P(y, { children: /* @__PURE__ */ F("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ P(Z, {
								src: e.icon,
								name: e.name
							}),
							/* @__PURE__ */ P("span", { children: e.name }),
							e.quantity > 1 && /* @__PURE__ */ F("span", {
								className: "font-mono text-xs",
								children: ["× ", e.quantity]
							})
						]
					}) }),
					/* @__PURE__ */ P(y, { children: /* @__PURE__ */ P(X, {
						me: e.me,
						te: e.te
					}) }),
					/* @__PURE__ */ P(y, { children: e.corporation }),
					/* @__PURE__ */ F(y, { children: [/* @__PURE__ */ P("div", {
						className: "text-sm",
						children: e.location?.name ?? "Unknown location"
					}), e.division && /* @__PURE__ */ P("div", {
						className: "text-xs text-muted",
						children: e.division
					})] })
				] }, e.id)) })] })] })
			]
		})
	] });
}
//#endregion
//#region src/sharing.tsx
function ve() {
	let t = A(), n = ["blueprints", "sharing"], { data: a, isLoading: o } = k({
		queryKey: n,
		queryFn: () => S.get(`${$}/sharing`)
	}), c = O({
		mutationFn: ({ id: e, shared: t }) => S.put(`${$}/sharing/${e}`, { shared: t }),
		onSuccess: (e, r) => {
			t.setQueryData(n, e), t.invalidateQueries({ queryKey: ["blueprints", "library"] }), D.success(r.shared ? "Its originals are in the library now" : "Taken out of the library");
		},
		onError: K
	});
	return /* @__PURE__ */ F(N, { children: [
		/* @__PURE__ */ P(q, {
			to: "/p/blueprints",
			children: "Library"
		}),
		/* @__PURE__ */ P(u, {
			eyebrow: "Industry",
			title: "Share my blueprints",
			icon: /* @__PURE__ */ P(z, {}),
			description: "Put a character's blueprint originals in the library, labelled as yours, so members can ask for copies. Copies stay private. Nothing leaves your hangar unless you hand it over."
		}),
		/* @__PURE__ */ F(r, { children: [/* @__PURE__ */ P(i, {
			title: "Your characters",
			description: "Blueprints come from each character's sheet, read every hour."
		}), o || !a ? /* @__PURE__ */ P("div", {
			className: "p-card",
			children: /* @__PURE__ */ P(m, { className: "h-32" })
		}) : a.length === 0 ? /* @__PURE__ */ P(s, {
			icon: /* @__PURE__ */ P(z, {}),
			title: "No characters"
		}) : /* @__PURE__ */ P("ul", {
			className: "divide-y divide-border",
			children: a.map((t) => /* @__PURE__ */ F("li", {
				className: "flex items-center gap-3 px-card py-3",
				children: [
					/* @__PURE__ */ P(e, {
						src: t.portrait,
						name: t.name,
						size: "sm"
					}),
					/* @__PURE__ */ F("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ P("div", {
							className: "font-medium",
							children: t.name
						}), /* @__PURE__ */ F("div", {
							className: "text-xs text-muted",
							children: [
								t.originals,
								" original",
								t.originals === 1 ? "" : "s",
								" · ",
								t.copies,
								" cop",
								t.copies === 1 ? "y" : "ies"
							]
						})]
					}),
					/* @__PURE__ */ P(g, {
						checked: t.shared,
						disabled: c.isPending,
						onCheckedChange: (e) => c.mutate({
							id: t.id,
							shared: e
						}),
						"aria-label": `Share ${t.name}'s originals`
					})
				]
			}, t.id))
		})] })
	] });
}
//#endregion
//#region src/index.tsx
var ye = ne({ routes: [
	{
		path: "",
		Component: ce
	},
	{
		path: "requests",
		Component: ge
	},
	{
		path: "sharing",
		Component: ve
	},
	{
		path: "research",
		Component: _e
	},
	{
		path: "queue",
		Component: de
	}
] });
//#endregion
export { ye as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","accent","accept","accepted","act","action","actions","active","activity","added","again","align","all","alt","always","an","and","are","aren","aria-label","as","ask","asked","asks","at","autoFocus","back","base","below","best_me","best_te","bg-surface-2","blueprint","blueprints","boolean","borrow","brought","but","by","can","can_manage","cancel","cancelled","cancelling","capital","case","categories","category","character","characters","checked","children","choose","className","come","common","confirmLabel","const","cop","copies","copy","copy_runs","copying","corporation","corporations","count","counts","created_at","currentColor","danger","dash","data","date","days","decline","declined","default","definePlugin","deliver","delivered","delivered_at","description","detail","disabled","divide-border","divide-y","division","don","done","drop","due","dueAt","due_at","each","enabled","end_date","ends","entries","errorToast","every","everything","export","eyebrow","few","fill","fills","finished","flex","flex-1","flex-wrap","font-medium","font-mono","footer","for","from","fully","function","gap-1","gap-1.5","gap-2","gap-3","gap-4","get","ghost","grid","group","grouped","groups","h-32","h-40","h-64","h-9","hand","handed","handled_by","hangar","has","has_original","hear","height","here","hint","hover:text-accent-ink","hover:text-text","hover:underline","how","icon","icons","id","ies","if","import","in","in_progress","industry","info","inline","inline-flex","installer","interactive","interface","invalidate","invention","is","isLoading","isPending","isn","it","italic","items-center","job","jobId","job_id","jobs","justify-between","justify-end","key","kind","label","labelled","lazy","least","leaves","lend","length","library","loading","loan","loan_days","loans","location","login","m11","m12","m14","m21","makes","making","manager","managers","many","mark","matches","max","maxLength","may","mb-4","me","me_min","me_short","member","members","min","min-w-0","min_me","min_te","mine","moves","mt-6","mutationFn","my","name","narrow","need","needs","neutral","never","new","no","nobody","none","not","note","now","null","number","of","on","onChange","onCheckedChange","onClick","onClose","onError","onOpenChange","onSubmit","onSuccess","once","one","open","open_requests","optional","options","or","original","originals","out","overdue","own","owner","owners","p-card","panel","params","patch","path","pb-card","per","personal","placeholder","placeholderData","plugin","portrait","post","primary","product","progress","project","project_id","projects","put","px-card","py-3","q","qc","quantity","queryFn","queryKey","queue","queued","r","re","react","react-router","read","ready","refetchInterval","refresh","request","requests","research","researched","response","rest","return","returned","returned_at","right","round","routes","rows","run","running","runs","rx","ry","s","save","search","secondary","see","send","set","setActing","setAsking","setCategory","setCorporation","setDq","setDue","setForm","setJobId","setKind","setMeMin","setNote","setOpen","setQ","setShow","setSource","several","shared","sharing","short","show","shows","shrink-0","since","site","size","size-4","size-8","sm","sm:grid-cols-2","sm:w-64","so","source","space-y-3","space-y-4","space-y-6","src","stack","staging","staleTime","start","start_date","stat","status","stay","step","still","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","summary","switch","sync","synced","synced_at","system","t","tabular-nums","takes","te","te_short","text-accent-ink","text-danger-fg","text-info-fg","text-muted","text-sm","text-subtle","text-success-fg","text-xs","that","the","their","then","these","this","ticker","time","title","to","toast","told","tone","tonight","total","true","truncated","type","type_id","under","unless","unresearched","updated_at","url","useInvalidate","useQuery","useQueryClient","useState","used","user","value","variant","viewBox","void","w-24","w-auto","w-full","waiting","wants","warning","was","what","whatever","when","where","which","width","with","withNote","xl","xl:grid-cols-4","xs","y","yet","you","your"];
