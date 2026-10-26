import { Avatar as e, Badge as t, Button as n, Card as r, CardBody as i, CardHeader as a, ConfirmDialog as o, Dialog as s, EmptyState as c, Field as l, Input as u, PageHeader as d, Progress as f, SearchInput as p, Segmented as m, Skeleton as h, Tooltip as g, api as _, cn as v, date as y, definePlugin as b, isk as x, num as S, toast as C } from "@conduit/sdk";
import { useMutation as w, useQuery as T, useQueryClient as E } from "@tanstack/react-query";
import { useState as D } from "react";
import { Link as O } from "react-router";
import { Fragment as k, jsx as A, jsxs as j } from "react/jsx-runtime";
//#region src/icons.tsx
function M({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ A("svg", {
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
var N = (e) => /* @__PURE__ */ j(M, {
	...e,
	children: [
		/* @__PURE__ */ A("path", { d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" }),
		/* @__PURE__ */ A("path", { d: "m7 16.5-4.74-2.85" }),
		/* @__PURE__ */ A("path", { d: "m7 16.5 5-3" }),
		/* @__PURE__ */ A("path", { d: "M7 16.5v5.17" }),
		/* @__PURE__ */ A("path", { d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" }),
		/* @__PURE__ */ A("path", { d: "m17 16.5-5-3" }),
		/* @__PURE__ */ A("path", { d: "m17 16.5 4.74-2.85" }),
		/* @__PURE__ */ A("path", { d: "M17 16.5v5.17" }),
		/* @__PURE__ */ A("path", { d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" }),
		/* @__PURE__ */ A("path", { d: "M12 8 7.26 5.15" }),
		/* @__PURE__ */ A("path", { d: "m12 8 4.74-2.85" }),
		/* @__PURE__ */ A("path", { d: "M12 13.5V8" })
	]
}), P = (e) => /* @__PURE__ */ j(M, {
	...e,
	children: [/* @__PURE__ */ A("path", { d: "M5 12h14" }), /* @__PURE__ */ A("path", { d: "M12 5v14" })]
}), F = (e) => /* @__PURE__ */ j(M, {
	...e,
	children: [
		/* @__PURE__ */ A("path", { d: "M3 6h18" }),
		/* @__PURE__ */ A("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ A("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), I = (e) => /* @__PURE__ */ j(M, {
	...e,
	children: [/* @__PURE__ */ A("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" }), /* @__PURE__ */ A("path", { d: "m15 5 4 4" })]
}), L = (e) => /* @__PURE__ */ j(M, {
	...e,
	children: [
		/* @__PURE__ */ A("path", { d: "M18 11V6a2 2 0 0 0-4 0v5" }),
		/* @__PURE__ */ A("path", { d: "M14 10V4a2 2 0 0 0-4 0v6" }),
		/* @__PURE__ */ A("path", { d: "M10 10.5V6a2 2 0 0 0-4 0v8" }),
		/* @__PURE__ */ A("path", { d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" })
	]
}), R = (e) => /* @__PURE__ */ j(M, {
	...e,
	children: [/* @__PURE__ */ A("path", { d: "M18 6 6 18" }), /* @__PURE__ */ A("path", { d: "m6 6 12 12" })]
}), z = (e) => /* @__PURE__ */ A(M, {
	...e,
	children: /* @__PURE__ */ A("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })
}), B = (e) => /* @__PURE__ */ j(M, {
	...e,
	children: [
		/* @__PURE__ */ A("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ A("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ A("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), V = (e) => /* @__PURE__ */ j(M, {
	...e,
	children: [/* @__PURE__ */ A("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ A("path", { d: "M19 12H5" })]
}), H = {
	ok: {
		label: "Stocked",
		tone: "success"
	},
	short: {
		label: "Short",
		tone: "warning"
	},
	low: {
		label: "Low",
		tone: "danger"
	}
}, U = "/api/p/stock", W = ["stock", "board"];
function G() {
	let { data: e, isLoading: i } = T({
		queryKey: W,
		queryFn: () => _.get(`${U}/board`),
		refetchInterval: 3e5
	}), [o, s] = D(null);
	return /* @__PURE__ */ j(k, { children: [
		/* @__PURE__ */ A(d, {
			eyebrow: "Logistics",
			title: "Doctrine Stock",
			icon: /* @__PURE__ */ A(N, {}),
			description: "What should be for sale at each staging location, what is, and who's seeding what. Counted from members' and the corporations' sell orders and contracts.",
			actions: e?.can_manage ? /* @__PURE__ */ A(O, {
				to: "/p/stock/manage",
				children: /* @__PURE__ */ j(n, {
					variant: "ghost",
					children: [/* @__PURE__ */ A(z, {}), " Manage"]
				})
			}) : void 0
		}),
		i || !e ? /* @__PURE__ */ A(h, { className: "h-64" }) : e.places.length === 0 ? /* @__PURE__ */ A(r, { children: /* @__PURE__ */ A(c, {
			icon: /* @__PURE__ */ A(N, {}),
			title: "No staging locations yet",
			description: e.can_manage ? "Add one under Manage, with what should be for sale there." : "The logistics team hasn't set any up yet."
		}) }) : /* @__PURE__ */ A("div", {
			className: "space-y-6",
			children: e.places.map((e) => {
				let n = e.targets.filter((e) => e.status !== "ok").length;
				return /* @__PURE__ */ j(r, { children: [/* @__PURE__ */ A(a, {
					title: e.label || e.name,
					description: [e.label ? e.name : null, e.system].filter(Boolean).join(" · "),
					actions: e.targets.length === 0 ? void 0 : n ? /* @__PURE__ */ j(t, {
						tone: "warning",
						children: [n, " short"]
					}) : /* @__PURE__ */ A(t, {
						tone: "success",
						children: "All stocked"
					})
				}), e.targets.length === 0 ? /* @__PURE__ */ A("p", {
					className: "px-card pb-card text-sm text-muted",
					children: "Nothing to stock here yet."
				}) : /* @__PURE__ */ A("ul", {
					className: "divide-y divide-border",
					children: e.targets.map((e) => /* @__PURE__ */ A(K, {
						t: e,
						onClaim: () => s(e)
					}, e.id))
				})] }, e.id);
			})
		}),
		o && /* @__PURE__ */ A(J, {
			target: o,
			days: e?.claim_days ?? 7,
			onClose: () => s(null)
		})
	] });
}
function K({ t: r, onClaim: i }) {
	let a = E(), o = w({
		mutationFn: () => _.delete(`${U}/targets/${r.id}/claim`),
		onSuccess: () => a.invalidateQueries({ queryKey: ["stock"] }),
		onError: (e) => C.error(e.message)
	}), s = r.quantity ? Math.min(100, r.have / r.quantity * 100) : 100;
	return /* @__PURE__ */ j("li", {
		className: "grid gap-3 px-card py-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center",
		children: [
			/* @__PURE__ */ j("div", {
				className: "flex min-w-0 items-center gap-3",
				children: [/* @__PURE__ */ A("img", {
					src: r.icon,
					alt: "",
					className: "size-10 shrink-0"
				}), /* @__PURE__ */ j("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ j("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ A("span", {
							className: "truncate font-medium",
							children: r.fit ? r.fit.name : r.name
						}), /* @__PURE__ */ A(t, {
							tone: H[r.status].tone,
							children: H[r.status].label
						})]
					}), /* @__PURE__ */ j("div", {
						className: "truncate text-xs text-muted",
						children: [
							r.fit && /* @__PURE__ */ j(O, {
								to: `/p/doctrines/fit/${r.fit.id}`,
								className: "inline-flex items-center gap-1 hover:text-text",
								children: [
									r.name,
									" ",
									/* @__PURE__ */ A(B, { className: "size-3" })
								]
							}),
							r.fit && " · ",
							q(r),
							r.note && ` · ${r.note}`
						]
					})]
				})]
			}),
			/* @__PURE__ */ j("div", { children: [/* @__PURE__ */ j("div", {
				className: "mb-1 flex items-baseline justify-between text-xs",
				children: [/* @__PURE__ */ A(g, {
					content: `${S(r.on_market)} on the market, ${S(r.on_contract)} on contract. Low below ${S(r.low)}.`,
					children: /* @__PURE__ */ j("span", {
						className: "font-mono tabular-nums text-text",
						children: [
							S(r.have),
							" / ",
							S(r.quantity)
						]
					})
				}), /* @__PURE__ */ A("span", {
					className: "text-muted",
					children: r.short > 0 ? `short ${S(r.short)}${r.claimed ? `, ${S(r.claimed)} claimed` : ""}` : "stocked"
				})]
			}), /* @__PURE__ */ A(f, {
				value: s,
				tone: r.status === "ok" ? "success" : r.status === "low" ? "danger" : "warning",
				size: "sm"
			})] }),
			/* @__PURE__ */ j("div", {
				className: "flex items-center justify-end gap-2",
				children: [r.claims.length > 0 && /* @__PURE__ */ A("div", {
					className: "flex -space-x-1.5",
					children: r.claims.slice(0, 4).map((t) => /* @__PURE__ */ A(g, {
						content: `${t.user} is seeding ${S(t.quantity)} (until ${y(t.expires_at)})`,
						children: /* @__PURE__ */ A("span", { children: /* @__PURE__ */ A(e, {
							src: t.portrait,
							name: t.user,
							size: "xs",
							rounded: "full",
							className: "ring-2 ring-surface"
						}) })
					}, t.user_id))
				}), r.my_claim == null ? r.still_short > 0 && /* @__PURE__ */ j(n, {
					size: "sm",
					variant: "outline",
					onClick: i,
					children: [/* @__PURE__ */ A(L, {}), " I'll seed"]
				}) : /* @__PURE__ */ j(k, { children: [/* @__PURE__ */ j(n, {
					size: "sm",
					variant: "secondary",
					onClick: i,
					children: ["Seeding ", S(r.my_claim)]
				}), /* @__PURE__ */ A(n, {
					size: "icon-sm",
					variant: "ghost",
					loading: o.isPending,
					onClick: () => o.mutate(),
					"aria-label": "Stop seeding",
					children: !o.isPending && /* @__PURE__ */ A(R, {})
				})] })]
			})
		]
	});
}
function q(e) {
	let t = [];
	return e.cheapest_order != null && t.push(`market from ${x(e.cheapest_order)}`), e.cheapest_contract != null && t.push(`${e.fit ? "fitted" : "contract"} from ${x(e.cheapest_contract)}`), t.length ? t.join(" · ") : "none for sale";
}
function J({ target: e, days: t, onClose: r }) {
	let i = E(), [a, o] = D(String(e.my_claim ?? Math.max(e.still_short, 1))), c = w({
		mutationFn: () => _.post(`${U}/targets/${e.id}/claim`, { quantity: Number(a) }),
		onSuccess: () => {
			C.success("Thanks! Your claim is on the board."), i.invalidateQueries({ queryKey: ["stock"] }), r();
		},
		onError: (e) => C.error(e.message)
	});
	return /* @__PURE__ */ A(s, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: `Seed ${e.fit ? e.fit.name : e.name}`,
		description: `Say how many you'll put up for sale, so others don't double up. Your claim lasts ${t} day${t === 1 ? "" : "s"}, and ends by itself once the target is met.`,
		size: "sm",
		footer: /* @__PURE__ */ j(k, { children: [/* @__PURE__ */ A(n, {
			variant: "ghost",
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ A(n, {
			variant: "primary",
			loading: c.isPending,
			disabled: !(Number(a) >= 1),
			onClick: () => c.mutate(),
			children: "Claim"
		})] }),
		children: /* @__PURE__ */ A(l, {
			label: "How many",
			hint: `${S(e.still_short)} still unclaimed of ${S(e.short)} short`,
			children: /* @__PURE__ */ A(u, {
				type: "number",
				min: 1,
				value: a,
				onChange: (e) => o(e.target.value),
				className: v("max-w-32 font-mono"),
				autoFocus: !0
			})
		})
	});
}
function Y() {
	let { data: e, isLoading: n } = T({
		queryKey: ["stock", "summary"],
		queryFn: () => _.get(`${U}/summary`),
		refetchInterval: 3e5
	});
	return n || !e ? /* @__PURE__ */ A(h, { className: "h-16" }) : e.targets === 0 ? /* @__PURE__ */ A("p", {
		className: "text-sm text-muted",
		children: "No stock targets set up yet."
	}) : /* @__PURE__ */ j(O, {
		to: "/p/stock",
		className: "block space-y-3",
		children: [/* @__PURE__ */ j("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ j("div", { children: [
				/* @__PURE__ */ A("div", {
					className: "text-xs text-muted",
					children: "Targets short"
				}),
				/* @__PURE__ */ A("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: e.short
				}),
				/* @__PURE__ */ j("div", {
					className: "text-xs text-subtle",
					children: ["of ", e.targets]
				})
			] }), e.low > 0 ? /* @__PURE__ */ j(t, {
				tone: "danger",
				children: [e.low, " low"]
			}) : e.short ? /* @__PURE__ */ A(t, {
				tone: "warning",
				children: "Needs seeding"
			}) : /* @__PURE__ */ A(t, {
				tone: "success",
				children: "All stocked"
			})]
		}), e.worst.length > 0 && /* @__PURE__ */ A("ul", {
			className: "space-y-1.5",
			children: e.worst.map((e) => /* @__PURE__ */ j("li", {
				className: "flex items-center gap-2 text-sm",
				children: [
					/* @__PURE__ */ A("img", {
						src: e.icon,
						alt: "",
						className: "size-5"
					}),
					/* @__PURE__ */ j("span", {
						className: "min-w-0 flex-1 truncate",
						children: [
							e.name,
							" ",
							/* @__PURE__ */ j("span", {
								className: "text-subtle",
								children: ["· ", e.place]
							})
						]
					}),
					/* @__PURE__ */ j("span", {
						className: v("font-mono text-xs tabular-nums", e.status === "low" ? "text-danger-fg" : "text-warning-fg"),
						children: [
							S(e.have),
							"/",
							S(e.quantity)
						]
					})
				]
			}, e.id))
		})]
	});
}
//#endregion
//#region src/manage.tsx
var X = ["stock", "manage"];
function Z() {
	let { data: e, isLoading: i } = T({
		queryKey: X,
		queryFn: () => _.get(`${U}/manage`)
	}), [s, l] = D(!1), [u, f] = D(null), [p, m] = D(null), [g, v] = D(null), y = E(), b = () => y.invalidateQueries({ queryKey: ["stock"] });
	return /* @__PURE__ */ j(k, { children: [
		/* @__PURE__ */ j(O, {
			to: "/p/stock",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ A(V, {}), " Doctrine Stock"]
		}),
		/* @__PURE__ */ A(d, {
			eyebrow: "Doctrine Stock",
			title: "Manage",
			icon: /* @__PURE__ */ A(N, {}),
			description: "Staging locations and how many of each ship or item should be for sale there. Managers are told when something drops below its low mark.",
			actions: /* @__PURE__ */ j(n, {
				variant: "primary",
				onClick: () => l(!0),
				children: [/* @__PURE__ */ A(P, {}), " Add location"]
			})
		}),
		i || !e ? /* @__PURE__ */ A(h, { className: "h-64" }) : /* @__PURE__ */ j("div", {
			className: "space-y-6",
			children: [
				e.places.length === 0 && /* @__PURE__ */ A(r, { children: /* @__PURE__ */ A(c, {
					icon: /* @__PURE__ */ A(N, {}),
					title: "No staging locations yet",
					description: "Add the station or structure where things should be for sale."
				}) }),
				e.places.map((e) => /* @__PURE__ */ j(r, { children: [/* @__PURE__ */ A(a, {
					title: e.label || e.name,
					description: [e.label ? e.name : null, e.system].filter(Boolean).join(" · "),
					actions: /* @__PURE__ */ j("div", {
						className: "flex gap-1",
						children: [
							/* @__PURE__ */ j(n, {
								size: "sm",
								variant: "outline",
								onClick: () => m({
									place: e,
									target: null
								}),
								children: [/* @__PURE__ */ A(P, {}), " Target"]
							}),
							/* @__PURE__ */ A(n, {
								size: "icon-sm",
								variant: "ghost",
								onClick: () => f(e),
								"aria-label": `Edit ${e.name}`,
								children: /* @__PURE__ */ A(I, {})
							}),
							/* @__PURE__ */ A(n, {
								size: "icon-sm",
								variant: "ghost",
								onClick: () => v({
									kind: "place",
									id: e.id,
									name: e.label || e.name
								}),
								"aria-label": `Remove ${e.name}`,
								children: /* @__PURE__ */ A(F, {})
							})
						]
					})
				}), e.targets.length === 0 ? /* @__PURE__ */ A("p", {
					className: "px-card pb-card text-sm text-muted",
					children: "No targets yet."
				}) : /* @__PURE__ */ A("ul", {
					className: "divide-y divide-border",
					children: e.targets.map((r) => /* @__PURE__ */ j("li", {
						className: "flex items-center gap-3 px-card py-2.5 text-sm",
						children: [
							/* @__PURE__ */ A("img", {
								src: r.icon,
								alt: "",
								className: "size-8"
							}),
							/* @__PURE__ */ j("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ A("div", {
									className: "truncate font-medium",
									children: r.fit ? `${r.fit.name} (${r.name})` : r.name
								}), /* @__PURE__ */ j("div", {
									className: "truncate text-xs text-muted",
									children: [
										"want ",
										S(r.quantity),
										" · low below ",
										S(r.low),
										r.note && ` · ${r.note}`
									]
								})]
							}),
							/* @__PURE__ */ j("span", {
								className: "font-mono text-xs tabular-nums",
								children: [
									S(r.have),
									"/",
									S(r.quantity)
								]
							}),
							/* @__PURE__ */ A(t, {
								tone: H[r.status].tone,
								children: H[r.status].label
							}),
							/* @__PURE__ */ A(n, {
								size: "icon-sm",
								variant: "ghost",
								onClick: () => m({
									place: e,
									target: r
								}),
								"aria-label": `Edit ${r.name}`,
								children: /* @__PURE__ */ A(I, {})
							}),
							/* @__PURE__ */ A(n, {
								size: "icon-sm",
								variant: "ghost",
								onClick: () => v({
									kind: "target",
									id: r.id,
									name: r.fit?.name ?? r.name
								}),
								"aria-label": `Remove ${r.name}`,
								children: /* @__PURE__ */ A(F, {})
							})
						]
					}, r.id))
				})] }, e.id)),
				/* @__PURE__ */ A(ee, { days: e.settings.claim_days })
			]
		}),
		s && /* @__PURE__ */ A($, { onClose: () => l(!1) }),
		u && /* @__PURE__ */ A($, {
			place: u,
			onClose: () => f(null)
		}),
		p && e && /* @__PURE__ */ A(te, {
			place: p.place,
			target: p.target,
			doctrines: e.doctrines,
			onClose: () => m(null)
		}),
		/* @__PURE__ */ A(o, {
			open: !!g,
			onOpenChange: (e) => !e && v(null),
			title: `Remove ${g?.name}?`,
			description: g?.kind === "place" ? "Its targets and claims go with it." : "Its claims go with it.",
			danger: !0,
			confirmLabel: "Remove",
			onConfirm: () => _.delete(g.kind === "place" ? `${U}/places/${g.id}` : `${U}/targets/${g.id}`).then(b)
		})
	] });
}
function ee({ days: e }) {
	let t = E(), [o, s] = D(String(e)), c = w({
		mutationFn: () => _.put(`${U}/settings`, { claim_days: Number(o) }),
		onSuccess: () => {
			C.success("Saved"), t.invalidateQueries({ queryKey: ["stock"] });
		},
		onError: (e) => C.error(e.message)
	});
	return /* @__PURE__ */ j(r, { children: [/* @__PURE__ */ A(a, {
		title: "Claims",
		description: "When a member says they'll seed something, their claim lasts this long. It also ends once the target is met."
	}), /* @__PURE__ */ j(i, {
		className: "flex items-end gap-3",
		children: [/* @__PURE__ */ A(l, {
			label: "Days a claim lasts",
			children: /* @__PURE__ */ A(u, {
				type: "number",
				min: 1,
				max: 90,
				value: o,
				onChange: (e) => s(e.target.value),
				className: "max-w-28 font-mono"
			})
		}), /* @__PURE__ */ A(n, {
			loading: c.isPending,
			disabled: Number(o) === e,
			onClick: () => c.mutate(),
			children: "Save"
		})]
	})] });
}
function Q({ kind: e, placeholder: t, onPick: n }) {
	let [r, i] = D(""), a = e === "places" ? 3 : 2, { data: o } = T({
		queryKey: [
			"stock",
			"search",
			e,
			r
		],
		queryFn: () => _.get(`${U}/search/${e}?q=${encodeURIComponent(r)}`),
		enabled: r.trim().length >= a
	});
	return /* @__PURE__ */ j("div", {
		className: "relative",
		children: [/* @__PURE__ */ A(p, {
			value: r,
			onChange: (e) => i(e.target.value),
			placeholder: t,
			autoFocus: !0
		}), r.trim().length >= a && o && /* @__PURE__ */ j("ul", {
			className: "absolute z-20 mt-1 max-h-72 w-full overflow-y-auto border border-border-strong bg-surface-raised shadow-e3",
			children: [o.length === 0 && /* @__PURE__ */ A("li", {
				className: "px-3 py-2 text-sm text-subtle",
				children: "Nothing found"
			}), o.map((e) => /* @__PURE__ */ A("li", { children: /* @__PURE__ */ j("button", {
				type: "button",
				className: "flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-hover",
				onClick: () => {
					n(e), i("");
				},
				children: [e.icon && /* @__PURE__ */ A("img", {
					src: e.icon,
					alt: "",
					className: "size-6"
				}), /* @__PURE__ */ j("span", {
					className: "min-w-0",
					children: [/* @__PURE__ */ A("span", {
						className: "block truncate text-sm font-medium",
						children: e.name
					}), /* @__PURE__ */ A("span", {
						className: "block truncate text-xs text-subtle",
						children: e.subtitle
					})]
				})]
			}) }, e.id))]
		})]
	});
}
function $({ place: e, onClose: t }) {
	let r = E(), [i, a] = D(null), [o, c] = D(e?.label ?? ""), [d, f] = D(String(e?.order ?? 0)), p = w({
		mutationFn: () => e ? _.put(`${U}/places/${e.id}`, {
			label: o,
			order: Number(d) || 0
		}) : _.post(`${U}/places`, {
			location_id: i?.id,
			label: o,
			order: Number(d) || 0
		}),
		onSuccess: () => {
			r.invalidateQueries({ queryKey: ["stock"] }), t();
		},
		onError: (e) => C.error(e.message)
	});
	return /* @__PURE__ */ A(s, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: e ? `Edit ${e.label || e.name}` : "Add a staging location",
		description: e ? e.name : "Stations and structures the site already knows: someone has assets, orders or contracts there.",
		footer: /* @__PURE__ */ j(k, { children: [/* @__PURE__ */ A(n, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), /* @__PURE__ */ A(n, {
			variant: "primary",
			loading: p.isPending,
			disabled: !e && !i,
			onClick: () => p.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ j("div", {
			className: "space-y-4",
			children: [
				!e && /* @__PURE__ */ A(l, {
					label: "Station or structure",
					children: i ? /* @__PURE__ */ j("div", {
						className: "flex items-center justify-between gap-2 border border-border px-3 py-2 text-sm",
						children: [/* @__PURE__ */ j("span", { children: [
							/* @__PURE__ */ A("span", {
								className: "font-medium",
								children: i.name
							}),
							" ",
							/* @__PURE__ */ A("span", {
								className: "text-xs text-subtle",
								children: i.subtitle
							})
						] }), /* @__PURE__ */ A(n, {
							size: "xs",
							variant: "ghost",
							onClick: () => a(null),
							children: "Change"
						})]
					}) : /* @__PURE__ */ A(Q, {
						kind: "places",
						placeholder: "Type at least 3 letters",
						onPick: a
					})
				}),
				/* @__PURE__ */ A(l, {
					label: "Label",
					hint: "Optional, e.g. Main staging",
					children: /* @__PURE__ */ A(u, {
						value: o,
						onChange: (e) => c(e.target.value),
						maxLength: 100
					})
				}),
				/* @__PURE__ */ A(l, {
					label: "Order",
					hint: "Lower comes first",
					children: /* @__PURE__ */ A(u, {
						type: "number",
						value: d,
						onChange: (e) => f(e.target.value),
						className: "max-w-28 font-mono"
					})
				})
			]
		})
	});
}
function te({ place: e, target: t, doctrines: r, onClose: i }) {
	let a = E(), [o, c] = D(t?.fit ? "fit" : "type"), [d, f] = D(t ? t.fit ? {
		id: t.fit.id,
		name: t.fit.name,
		subtitle: t.name,
		icon: t.icon
	} : {
		id: t.type_id,
		name: t.name,
		subtitle: "",
		icon: t.icon
	} : null), [p, h] = D(String(t?.quantity ?? 10)), [g, v] = D(t && t.low !== t.quantity ? String(t.low) : ""), [y, b] = D(t?.note ?? ""), x = w({
		mutationFn: () => {
			let n = {
				type_id: o === "type" ? d?.id : null,
				fit_id: o === "fit" ? d?.id : null,
				quantity: Number(p),
				low: g === "" ? null : Number(g),
				note: y,
				order: t?.order ?? 0
			};
			return t ? _.put(`${U}/targets/${t.id}`, n) : _.post(`${U}/places/${e.id}/targets`, n);
		},
		onSuccess: () => {
			a.invalidateQueries({ queryKey: ["stock"] }), i();
		},
		onError: (e) => C.error(e.message)
	});
	return /* @__PURE__ */ A(s, {
		open: !0,
		onOpenChange: (e) => !e && i(),
		title: t ? "Edit target" : `New target at ${e.label || e.name}`,
		footer: /* @__PURE__ */ j(k, { children: [/* @__PURE__ */ A(n, {
			variant: "ghost",
			onClick: i,
			children: "Cancel"
		}), /* @__PURE__ */ A(n, {
			variant: "primary",
			loading: x.isPending,
			disabled: !d || !(Number(p) >= 1),
			onClick: () => x.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ j("div", {
			className: "space-y-4",
			children: [
				r && /* @__PURE__ */ A(m, {
					value: o,
					onChange: (e) => {
						c(e), f(null);
					},
					options: [{
						value: "type",
						label: "Ship or item"
					}, {
						value: "fit",
						label: "Doctrine fit"
					}],
					"aria-label": "What to stock"
				}),
				/* @__PURE__ */ A(l, {
					label: o === "fit" ? "Doctrine fit" : "Ship or item",
					hint: o === "fit" ? "Counts the fit's hull: on the market, or on contract (usually fitted)." : void 0,
					children: d ? /* @__PURE__ */ j("div", {
						className: "flex items-center justify-between gap-2 border border-border px-3 py-2 text-sm",
						children: [/* @__PURE__ */ j("span", {
							className: "flex min-w-0 items-center gap-2",
							children: [
								d.icon && /* @__PURE__ */ A("img", {
									src: d.icon,
									alt: "",
									className: "size-6"
								}),
								/* @__PURE__ */ A("span", {
									className: "truncate font-medium",
									children: d.name
								}),
								d.subtitle && /* @__PURE__ */ A("span", {
									className: "truncate text-xs text-subtle",
									children: d.subtitle
								})
							]
						}), /* @__PURE__ */ A(n, {
							size: "xs",
							variant: "ghost",
							onClick: () => f(null),
							children: "Change"
						})]
					}) : /* @__PURE__ */ A(Q, {
						kind: o === "fit" ? "fits" : "types",
						placeholder: o === "fit" ? "Fit name" : "Type a name",
						onPick: f
					})
				}),
				/* @__PURE__ */ j("div", {
					className: "grid grid-cols-2 gap-4",
					children: [/* @__PURE__ */ A(l, {
						label: "Should be for sale",
						children: /* @__PURE__ */ A(u, {
							type: "number",
							min: 1,
							value: p,
							onChange: (e) => h(e.target.value),
							className: "font-mono"
						})
					}), /* @__PURE__ */ A(l, {
						label: "Low below",
						hint: "Alert below this many; empty means the target",
						children: /* @__PURE__ */ A(u, {
							type: "number",
							min: 0,
							value: g,
							onChange: (e) => v(e.target.value),
							className: "font-mono",
							placeholder: p
						})
					})]
				}),
				/* @__PURE__ */ A(l, {
					label: "Note",
					hint: "Optional, shown to members",
					children: /* @__PURE__ */ A(u, {
						value: y,
						onChange: (e) => b(e.target.value),
						maxLength: 200
					})
				})
			]
		})
	});
}
//#endregion
//#region src/index.tsx
var ne = b({
	routes: [{
		path: "",
		Component: G
	}, {
		path: "manage",
		Component: Z
	}],
	widgets: [{
		id: "stock",
		title: "Doctrine Stock",
		Component: Y,
		size: "sm",
		order: 49
	}]
});
//#endregion
export { ne as default };

export const classes = ["!data","!o","-space-x-1.5","@conduit/sdk","@tanstack/react-query","a","absolute","actions","already","also","alt","and","any","are","aria-label","as","at","autoFocus","be","below","bg-surface-raised","block","board","body","border","border-border","border-border-strong","but","button","by","can_manage","cheapest_contract","cheapest_order","children","claim","claim_days","claimed","claiming","claims","className","comes","confirmLabel","const","content","contract","contracts","corporations","currentColor","danger","data","days","default","definePlugin","description","disabled","divide-border","divide-y","doctrines","don","double","drops","each","empty","enabled","ends","expires_at","export","eyebrow","few","fill","first","fit","fit_id","fits","fitted","flex","flex-1","flex-wrap","font-medium","font-mono","font-semibold","footer","for","found","from","full","function","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-6","get","ghost","go","grid","grid-cols-2","h-16","h-64","has","hasn","have","here","hint","hit","hover:bg-hover","hover:text-text","how","hull","icon","icon-sm","icons","id","if","import","inline","inline-flex","interface","is","isLoading","isPending","item","items-baseline","items-center","items-end","its","itself","justify-between","justify-end","key","kind","knows","label","last","lasts","least","length","letters","ll","loading","location","location_id","locations","logistics","long","low","m12","m15","m17","m6","m7","manage","many","market","max","max-h-72","max-w-28","max-w-32","maxLength","mb-1","mb-4","md:grid-cols-[minmax(0,1fr)_220px_auto]","md:items-center","means","member","members","min","min-w-0","mode","mt-1","mutationFn","my_claim","name","none","not","note","null","number","of","ok","on","onChange","onClaim","onClick","onClose","onConfirm","onError","onOpenChange","onPick","onSuccess","on_contract","on_market","once","one","open","options","or","order","orders","others","outline","overflow-y-auto","parts","path","pb-card","pct","place","placeholder","places","portrait","primary","put","px-3","px-card","py-2","py-2.5","py-3","qc","quantity","queryFn","queryKey","react","react-router","refetchInterval","refresh","relative","release","rest","return","ring-2","ring-surface","round","rounded","routes","s","sale","save","says","search","secondary","seed","seeding","sell","set","setAddingPlace","setClaiming","setEditingPlace","setLabel","setLow","setMode","setNote","setOrder","setPicked","setQ","setQty","setQuantity","setRemoving","setTarget","setValue","settings","shadow-e3","ship","short","should","shown","shrink-0","side","site","size","size-10","size-3","size-4","size-5","size-6","size-8","sm","so","someone","something","space-y-1.5","space-y-3","space-y-4","space-y-6","src","staging","station","status","still","still_short","stock","stocked","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structure","structures","style","subtitle","success","summary","system","t","tabular-nums","target","targets","team","text-3xl","text-danger-fg","text-left","text-muted","text-sm","text-subtle","text-text","text-warning-fg","text-xs","the","their","they","things","this","title","to","told","tone","truncate","type","type_id","types","unclaimed","undefined","under","up","useQueryClient","useState","used","user","user_id","value","variant","viewBox","void","w-full","want","warning","what","when","where","who","widgets","with","worst","xs","yet","you","z-20"];
