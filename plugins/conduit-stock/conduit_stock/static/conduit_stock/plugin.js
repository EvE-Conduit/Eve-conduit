import { Avatar as e, Badge as t, Button as n, Card as r, CardBody as i, CardHeader as a, ConfirmDialog as o, Dialog as s, DiscordPings as c, EmptyState as l, Field as u, Input as d, PageHeader as f, Progress as p, SearchInput as m, Segmented as h, Skeleton as g, Tooltip as _, api as v, cn as y, date as b, definePlugin as x, isk as S, num as C, toast as w } from "@conduit/sdk";
import { useMutation as T, useQuery as E, useQueryClient as D } from "@tanstack/react-query";
import { useState as O } from "react";
import { Link as k } from "react-router";
import { Fragment as A, jsx as j, jsxs as M } from "react/jsx-runtime";
//#region src/icons.tsx
function N({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ j("svg", {
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
var P = (e) => /* @__PURE__ */ M(N, {
	...e,
	children: [
		/* @__PURE__ */ j("path", { d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" }),
		/* @__PURE__ */ j("path", { d: "m7 16.5-4.74-2.85" }),
		/* @__PURE__ */ j("path", { d: "m7 16.5 5-3" }),
		/* @__PURE__ */ j("path", { d: "M7 16.5v5.17" }),
		/* @__PURE__ */ j("path", { d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" }),
		/* @__PURE__ */ j("path", { d: "m17 16.5-5-3" }),
		/* @__PURE__ */ j("path", { d: "m17 16.5 4.74-2.85" }),
		/* @__PURE__ */ j("path", { d: "M17 16.5v5.17" }),
		/* @__PURE__ */ j("path", { d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" }),
		/* @__PURE__ */ j("path", { d: "M12 8 7.26 5.15" }),
		/* @__PURE__ */ j("path", { d: "m12 8 4.74-2.85" }),
		/* @__PURE__ */ j("path", { d: "M12 13.5V8" })
	]
}), F = (e) => /* @__PURE__ */ M(N, {
	...e,
	children: [/* @__PURE__ */ j("path", { d: "M5 12h14" }), /* @__PURE__ */ j("path", { d: "M12 5v14" })]
}), I = (e) => /* @__PURE__ */ M(N, {
	...e,
	children: [
		/* @__PURE__ */ j("path", { d: "M3 6h18" }),
		/* @__PURE__ */ j("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ j("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), L = (e) => /* @__PURE__ */ M(N, {
	...e,
	children: [/* @__PURE__ */ j("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" }), /* @__PURE__ */ j("path", { d: "m15 5 4 4" })]
}), R = (e) => /* @__PURE__ */ M(N, {
	...e,
	children: [
		/* @__PURE__ */ j("path", { d: "M18 11V6a2 2 0 0 0-4 0v5" }),
		/* @__PURE__ */ j("path", { d: "M14 10V4a2 2 0 0 0-4 0v6" }),
		/* @__PURE__ */ j("path", { d: "M10 10.5V6a2 2 0 0 0-4 0v8" }),
		/* @__PURE__ */ j("path", { d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" })
	]
}), z = (e) => /* @__PURE__ */ M(N, {
	...e,
	children: [/* @__PURE__ */ j("path", { d: "M18 6 6 18" }), /* @__PURE__ */ j("path", { d: "m6 6 12 12" })]
}), B = (e) => /* @__PURE__ */ j(N, {
	...e,
	children: /* @__PURE__ */ j("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })
}), V = (e) => /* @__PURE__ */ M(N, {
	...e,
	children: [
		/* @__PURE__ */ j("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ j("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ j("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), H = (e) => /* @__PURE__ */ M(N, {
	...e,
	children: [/* @__PURE__ */ j("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ j("path", { d: "M19 12H5" })]
}), U = {
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
}, W = "/api/p/stock", G = ["stock", "board"];
function K() {
	let { data: e, isLoading: i } = E({
		queryKey: G,
		queryFn: () => v.get(`${W}/board`),
		refetchInterval: 3e5
	}), [o, s] = O(null);
	return /* @__PURE__ */ M(A, { children: [
		/* @__PURE__ */ j(f, {
			eyebrow: "Logistics",
			title: "Doctrine Stock",
			icon: /* @__PURE__ */ j(P, {}),
			description: "What should be for sale at each staging location, what is, and who's seeding what. Counted from members' and the corporations' sell orders and contracts.",
			actions: e?.can_manage ? /* @__PURE__ */ j(k, {
				to: "/p/stock/manage",
				children: /* @__PURE__ */ M(n, {
					variant: "ghost",
					children: [/* @__PURE__ */ j(B, {}), " Manage"]
				})
			}) : void 0
		}),
		i || !e ? /* @__PURE__ */ j(g, { className: "h-64" }) : e.places.length === 0 ? /* @__PURE__ */ j(r, { children: /* @__PURE__ */ j(l, {
			icon: /* @__PURE__ */ j(P, {}),
			title: "No staging locations yet",
			description: e.can_manage ? "Add one under Manage, with what should be for sale there." : "The logistics team hasn't set any up yet."
		}) }) : /* @__PURE__ */ j("div", {
			className: "space-y-6",
			children: e.places.map((e) => {
				let n = e.targets.filter((e) => e.status !== "ok").length;
				return /* @__PURE__ */ M(r, { children: [/* @__PURE__ */ j(a, {
					title: e.label || e.name,
					description: [e.label ? e.name : null, e.system].filter(Boolean).join(" · "),
					actions: e.targets.length === 0 ? void 0 : n ? /* @__PURE__ */ M(t, {
						tone: "warning",
						children: [n, " short"]
					}) : /* @__PURE__ */ j(t, {
						tone: "success",
						children: "All stocked"
					})
				}), e.targets.length === 0 ? /* @__PURE__ */ j("p", {
					className: "px-card pb-card text-sm text-muted",
					children: "Nothing to stock here yet."
				}) : /* @__PURE__ */ j("ul", {
					className: "divide-y divide-border",
					children: e.targets.map((e) => /* @__PURE__ */ j(q, {
						t: e,
						onClaim: () => s(e)
					}, e.id))
				})] }, e.id);
			})
		}),
		o && /* @__PURE__ */ j(Y, {
			target: o,
			days: e?.claim_days ?? 7,
			onClose: () => s(null)
		})
	] });
}
function q({ t: r, onClaim: i }) {
	let a = D(), o = T({
		mutationFn: () => v.delete(`${W}/targets/${r.id}/claim`),
		onSuccess: () => a.invalidateQueries({ queryKey: ["stock"] }),
		onError: (e) => w.error(e.message)
	}), s = r.quantity ? Math.min(100, r.have / r.quantity * 100) : 100;
	return /* @__PURE__ */ M("li", {
		className: "grid gap-3 px-card py-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center",
		children: [
			/* @__PURE__ */ M("div", {
				className: "flex min-w-0 items-center gap-3",
				children: [/* @__PURE__ */ j("img", {
					src: r.icon,
					alt: "",
					className: "size-10 shrink-0"
				}), /* @__PURE__ */ M("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ M("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ j("span", {
							className: "truncate font-medium",
							children: r.fit ? r.fit.name : r.name
						}), /* @__PURE__ */ j(t, {
							tone: U[r.status].tone,
							children: U[r.status].label
						})]
					}), /* @__PURE__ */ M("div", {
						className: "truncate text-xs text-muted",
						children: [
							r.fit && /* @__PURE__ */ M(k, {
								to: `/p/doctrines/fit/${r.fit.id}`,
								className: "inline-flex items-center gap-1 hover:text-text",
								children: [
									r.name,
									" ",
									/* @__PURE__ */ j(V, { className: "size-3" })
								]
							}),
							r.fit && " · ",
							J(r),
							r.note && ` · ${r.note}`
						]
					})]
				})]
			}),
			/* @__PURE__ */ M("div", { children: [/* @__PURE__ */ M("div", {
				className: "mb-1 flex items-baseline justify-between text-xs",
				children: [/* @__PURE__ */ j(_, {
					content: `${C(r.on_market)} on the market, ${C(r.on_contract)} on contract. Low below ${C(r.low)}.`,
					children: /* @__PURE__ */ M("span", {
						className: "font-mono tabular-nums text-text",
						children: [
							C(r.have),
							" / ",
							C(r.quantity)
						]
					})
				}), /* @__PURE__ */ j("span", {
					className: "text-muted",
					children: r.short > 0 ? `short ${C(r.short)}${r.claimed ? `, ${C(r.claimed)} claimed` : ""}` : "stocked"
				})]
			}), /* @__PURE__ */ j(p, {
				value: s,
				tone: r.status === "ok" ? "success" : r.status === "low" ? "danger" : "warning",
				size: "sm"
			})] }),
			/* @__PURE__ */ M("div", {
				className: "flex items-center justify-end gap-2",
				children: [r.claims.length > 0 && /* @__PURE__ */ j("div", {
					className: "flex -space-x-1.5",
					children: r.claims.slice(0, 4).map((t) => /* @__PURE__ */ j(_, {
						content: `${t.user} is seeding ${C(t.quantity)} (until ${b(t.expires_at)})`,
						children: /* @__PURE__ */ j("span", { children: /* @__PURE__ */ j(e, {
							src: t.portrait,
							name: t.user,
							size: "xs",
							rounded: "full",
							className: "ring-2 ring-surface"
						}) })
					}, t.user_id))
				}), r.my_claim == null ? r.still_short > 0 && /* @__PURE__ */ M(n, {
					size: "sm",
					variant: "outline",
					onClick: i,
					children: [/* @__PURE__ */ j(R, {}), " I'll seed"]
				}) : /* @__PURE__ */ M(A, { children: [/* @__PURE__ */ M(n, {
					size: "sm",
					variant: "secondary",
					onClick: i,
					children: ["Seeding ", C(r.my_claim)]
				}), /* @__PURE__ */ j(n, {
					size: "icon-sm",
					variant: "ghost",
					loading: o.isPending,
					onClick: () => o.mutate(),
					"aria-label": "Stop seeding",
					children: !o.isPending && /* @__PURE__ */ j(z, {})
				})] })]
			})
		]
	});
}
function J(e) {
	let t = [];
	return e.cheapest_order != null && t.push(`market from ${S(e.cheapest_order)}`), e.cheapest_contract != null && t.push(`${e.fit ? "fitted" : "contract"} from ${S(e.cheapest_contract)}`), t.length ? t.join(" · ") : "none for sale";
}
function Y({ target: e, days: t, onClose: r }) {
	let i = D(), [a, o] = O(String(e.my_claim ?? Math.max(e.still_short, 1))), c = T({
		mutationFn: () => v.post(`${W}/targets/${e.id}/claim`, { quantity: Number(a) }),
		onSuccess: () => {
			w.success("Thanks! Your claim is on the board."), i.invalidateQueries({ queryKey: ["stock"] }), r();
		},
		onError: (e) => w.error(e.message)
	});
	return /* @__PURE__ */ j(s, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: `Seed ${e.fit ? e.fit.name : e.name}`,
		description: `Say how many you'll put up for sale, so others don't double up. Your claim lasts ${t} day${t === 1 ? "" : "s"}, and ends by itself once the target is met.`,
		size: "sm",
		footer: /* @__PURE__ */ M(A, { children: [/* @__PURE__ */ j(n, {
			variant: "ghost",
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ j(n, {
			variant: "primary",
			loading: c.isPending,
			disabled: !(Number(a) >= 1),
			onClick: () => c.mutate(),
			children: "Claim"
		})] }),
		children: /* @__PURE__ */ j(u, {
			label: "How many",
			hint: `${C(e.still_short)} still unclaimed of ${C(e.short)} short`,
			children: /* @__PURE__ */ j(d, {
				type: "number",
				min: 1,
				value: a,
				onChange: (e) => o(e.target.value),
				className: y("max-w-32 font-mono"),
				autoFocus: !0
			})
		})
	});
}
function X() {
	let { data: e, isLoading: n } = E({
		queryKey: ["stock", "summary"],
		queryFn: () => v.get(`${W}/summary`),
		refetchInterval: 3e5
	});
	return n || !e ? /* @__PURE__ */ j(g, { className: "h-16" }) : e.targets === 0 ? /* @__PURE__ */ j("p", {
		className: "text-sm text-muted",
		children: "No stock targets set up yet."
	}) : /* @__PURE__ */ M(k, {
		to: "/p/stock",
		className: "block space-y-3",
		children: [/* @__PURE__ */ M("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ M("div", { children: [
				/* @__PURE__ */ j("div", {
					className: "text-xs text-muted",
					children: "Targets short"
				}),
				/* @__PURE__ */ j("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: e.short
				}),
				/* @__PURE__ */ M("div", {
					className: "text-xs text-subtle",
					children: ["of ", e.targets]
				})
			] }), e.low > 0 ? /* @__PURE__ */ M(t, {
				tone: "danger",
				children: [e.low, " low"]
			}) : e.short ? /* @__PURE__ */ j(t, {
				tone: "warning",
				children: "Needs seeding"
			}) : /* @__PURE__ */ j(t, {
				tone: "success",
				children: "All stocked"
			})]
		}), e.worst.length > 0 && /* @__PURE__ */ j("ul", {
			className: "space-y-1.5",
			children: e.worst.map((e) => /* @__PURE__ */ M("li", {
				className: "flex items-center gap-2 text-sm",
				children: [
					/* @__PURE__ */ j("img", {
						src: e.icon,
						alt: "",
						className: "size-5"
					}),
					/* @__PURE__ */ M("span", {
						className: "min-w-0 flex-1 truncate",
						children: [
							e.name,
							" ",
							/* @__PURE__ */ M("span", {
								className: "text-subtle",
								children: ["· ", e.place]
							})
						]
					}),
					/* @__PURE__ */ M("span", {
						className: y("font-mono text-xs tabular-nums", e.status === "low" ? "text-danger-fg" : "text-warning-fg"),
						children: [
							C(e.have),
							"/",
							C(e.quantity)
						]
					})
				]
			}, e.id))
		})]
	});
}
//#endregion
//#region src/manage.tsx
var Z = ["stock", "manage"];
function ee() {
	let { data: e, isLoading: i } = E({
		queryKey: Z,
		queryFn: () => v.get(`${W}/manage`)
	}), [s, u] = O(!1), [d, p] = O(null), [m, h] = O(null), [_, y] = O(null), b = D(), x = () => b.invalidateQueries({ queryKey: ["stock"] });
	return /* @__PURE__ */ M(A, { children: [
		/* @__PURE__ */ M(k, {
			to: "/p/stock",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ j(H, {}), " Doctrine Stock"]
		}),
		/* @__PURE__ */ j(f, {
			eyebrow: "Doctrine Stock",
			title: "Manage",
			icon: /* @__PURE__ */ j(P, {}),
			description: "Staging locations and how many of each ship or item should be for sale there. Managers are told when something drops below its low mark.",
			actions: /* @__PURE__ */ M(n, {
				variant: "primary",
				onClick: () => u(!0),
				children: [/* @__PURE__ */ j(F, {}), " Add location"]
			})
		}),
		i || !e ? /* @__PURE__ */ j(g, { className: "h-64" }) : /* @__PURE__ */ M("div", {
			className: "space-y-6",
			children: [
				e.places.length === 0 && /* @__PURE__ */ j(r, { children: /* @__PURE__ */ j(l, {
					icon: /* @__PURE__ */ j(P, {}),
					title: "No staging locations yet",
					description: "Add the station or structure where things should be for sale."
				}) }),
				e.places.map((e) => /* @__PURE__ */ M(r, { children: [/* @__PURE__ */ j(a, {
					title: e.label || e.name,
					description: [e.label ? e.name : null, e.system].filter(Boolean).join(" · "),
					actions: /* @__PURE__ */ M("div", {
						className: "flex gap-1",
						children: [
							/* @__PURE__ */ M(n, {
								size: "sm",
								variant: "outline",
								onClick: () => h({
									place: e,
									target: null
								}),
								children: [/* @__PURE__ */ j(F, {}), " Target"]
							}),
							/* @__PURE__ */ j(n, {
								size: "icon-sm",
								variant: "ghost",
								onClick: () => p(e),
								"aria-label": `Edit ${e.name}`,
								children: /* @__PURE__ */ j(L, {})
							}),
							/* @__PURE__ */ j(n, {
								size: "icon-sm",
								variant: "ghost",
								onClick: () => y({
									kind: "place",
									id: e.id,
									name: e.label || e.name
								}),
								"aria-label": `Remove ${e.name}`,
								children: /* @__PURE__ */ j(I, {})
							})
						]
					})
				}), e.targets.length === 0 ? /* @__PURE__ */ j("p", {
					className: "px-card pb-card text-sm text-muted",
					children: "No targets yet."
				}) : /* @__PURE__ */ j("ul", {
					className: "divide-y divide-border",
					children: e.targets.map((r) => /* @__PURE__ */ M("li", {
						className: "flex items-center gap-3 px-card py-2.5 text-sm",
						children: [
							/* @__PURE__ */ j("img", {
								src: r.icon,
								alt: "",
								className: "size-8"
							}),
							/* @__PURE__ */ M("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ j("div", {
									className: "truncate font-medium",
									children: r.fit ? `${r.fit.name} (${r.name})` : r.name
								}), /* @__PURE__ */ M("div", {
									className: "truncate text-xs text-muted",
									children: [
										"want ",
										C(r.quantity),
										" · low below ",
										C(r.low),
										r.note && ` · ${r.note}`
									]
								})]
							}),
							/* @__PURE__ */ M("span", {
								className: "font-mono text-xs tabular-nums",
								children: [
									C(r.have),
									"/",
									C(r.quantity)
								]
							}),
							/* @__PURE__ */ j(t, {
								tone: U[r.status].tone,
								children: U[r.status].label
							}),
							/* @__PURE__ */ j(n, {
								size: "icon-sm",
								variant: "ghost",
								onClick: () => h({
									place: e,
									target: r
								}),
								"aria-label": `Edit ${r.name}`,
								children: /* @__PURE__ */ j(L, {})
							}),
							/* @__PURE__ */ j(n, {
								size: "icon-sm",
								variant: "ghost",
								onClick: () => y({
									kind: "target",
									id: r.id,
									name: r.fit?.name ?? r.name
								}),
								"aria-label": `Remove ${r.name}`,
								children: /* @__PURE__ */ j(I, {})
							})
						]
					}, r.id))
				})] }, e.id)),
				/* @__PURE__ */ j(te, { days: e.settings.claim_days }),
				/* @__PURE__ */ j(c, { plugin: "stock" })
			]
		}),
		s && /* @__PURE__ */ j($, { onClose: () => u(!1) }),
		d && /* @__PURE__ */ j($, {
			place: d,
			onClose: () => p(null)
		}),
		m && e && /* @__PURE__ */ j(ne, {
			place: m.place,
			target: m.target,
			doctrines: e.doctrines,
			onClose: () => h(null)
		}),
		/* @__PURE__ */ j(o, {
			open: !!_,
			onOpenChange: (e) => !e && y(null),
			title: `Remove ${_?.name}?`,
			description: _?.kind === "place" ? "Its targets and claims go with it." : "Its claims go with it.",
			danger: !0,
			confirmLabel: "Remove",
			onConfirm: () => v.delete(_.kind === "place" ? `${W}/places/${_.id}` : `${W}/targets/${_.id}`).then(x)
		})
	] });
}
function te({ days: e }) {
	let t = D(), [o, s] = O(String(e)), c = T({
		mutationFn: () => v.put(`${W}/settings`, { claim_days: Number(o) }),
		onSuccess: () => {
			w.success("Saved"), t.invalidateQueries({ queryKey: ["stock"] });
		},
		onError: (e) => w.error(e.message)
	});
	return /* @__PURE__ */ M(r, { children: [/* @__PURE__ */ j(a, {
		title: "Claims",
		description: "When a member says they'll seed something, their claim lasts this long. It also ends once the target is met."
	}), /* @__PURE__ */ M(i, {
		className: "flex items-end gap-3",
		children: [/* @__PURE__ */ j(u, {
			label: "Days a claim lasts",
			children: /* @__PURE__ */ j(d, {
				type: "number",
				min: 1,
				max: 90,
				value: o,
				onChange: (e) => s(e.target.value),
				className: "max-w-28 font-mono"
			})
		}), /* @__PURE__ */ j(n, {
			loading: c.isPending,
			disabled: Number(o) === e,
			onClick: () => c.mutate(),
			children: "Save"
		})]
	})] });
}
function Q({ kind: e, placeholder: t, onPick: n }) {
	let [r, i] = O(""), a = e === "places" ? 3 : 2, { data: o } = E({
		queryKey: [
			"stock",
			"search",
			e,
			r
		],
		queryFn: () => v.get(`${W}/search/${e}?q=${encodeURIComponent(r)}`),
		enabled: r.trim().length >= a
	});
	return /* @__PURE__ */ M("div", {
		className: "relative",
		children: [/* @__PURE__ */ j(m, {
			value: r,
			onChange: (e) => i(e.target.value),
			placeholder: t,
			autoFocus: !0
		}), r.trim().length >= a && o && /* @__PURE__ */ M("ul", {
			className: "absolute z-20 mt-1 max-h-72 w-full overflow-y-auto border border-border-strong bg-surface-raised shadow-e3",
			children: [o.length === 0 && /* @__PURE__ */ j("li", {
				className: "px-3 py-2 text-sm text-subtle",
				children: "Nothing found"
			}), o.map((e) => /* @__PURE__ */ j("li", { children: /* @__PURE__ */ M("button", {
				type: "button",
				className: "flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-hover",
				onClick: () => {
					n(e), i("");
				},
				children: [e.icon && /* @__PURE__ */ j("img", {
					src: e.icon,
					alt: "",
					className: "size-6"
				}), /* @__PURE__ */ M("span", {
					className: "min-w-0",
					children: [/* @__PURE__ */ j("span", {
						className: "block truncate text-sm font-medium",
						children: e.name
					}), /* @__PURE__ */ j("span", {
						className: "block truncate text-xs text-subtle",
						children: e.subtitle
					})]
				})]
			}) }, e.id))]
		})]
	});
}
function $({ place: e, onClose: t }) {
	let r = D(), [i, a] = O(null), [o, c] = O(e?.label ?? ""), [l, f] = O(String(e?.order ?? 0)), p = T({
		mutationFn: () => e ? v.put(`${W}/places/${e.id}`, {
			label: o,
			order: Number(l) || 0
		}) : v.post(`${W}/places`, {
			location_id: i?.id,
			label: o,
			order: Number(l) || 0
		}),
		onSuccess: () => {
			r.invalidateQueries({ queryKey: ["stock"] }), t();
		},
		onError: (e) => w.error(e.message)
	});
	return /* @__PURE__ */ j(s, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: e ? `Edit ${e.label || e.name}` : "Add a staging location",
		description: e ? e.name : "Stations and structures the site already knows: someone has assets, orders or contracts there.",
		footer: /* @__PURE__ */ M(A, { children: [/* @__PURE__ */ j(n, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), /* @__PURE__ */ j(n, {
			variant: "primary",
			loading: p.isPending,
			disabled: !e && !i,
			onClick: () => p.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ M("div", {
			className: "space-y-4",
			children: [
				!e && /* @__PURE__ */ j(u, {
					label: "Station or structure",
					children: i ? /* @__PURE__ */ M("div", {
						className: "flex items-center justify-between gap-2 border border-border px-3 py-2 text-sm",
						children: [/* @__PURE__ */ M("span", { children: [
							/* @__PURE__ */ j("span", {
								className: "font-medium",
								children: i.name
							}),
							" ",
							/* @__PURE__ */ j("span", {
								className: "text-xs text-subtle",
								children: i.subtitle
							})
						] }), /* @__PURE__ */ j(n, {
							size: "xs",
							variant: "ghost",
							onClick: () => a(null),
							children: "Change"
						})]
					}) : /* @__PURE__ */ j(Q, {
						kind: "places",
						placeholder: "Type at least 3 letters",
						onPick: a
					})
				}),
				/* @__PURE__ */ j(u, {
					label: "Label",
					hint: "Optional, e.g. Main staging",
					children: /* @__PURE__ */ j(d, {
						value: o,
						onChange: (e) => c(e.target.value),
						maxLength: 100
					})
				}),
				/* @__PURE__ */ j(u, {
					label: "Order",
					hint: "Lower comes first",
					children: /* @__PURE__ */ j(d, {
						type: "number",
						value: l,
						onChange: (e) => f(e.target.value),
						className: "max-w-28 font-mono"
					})
				})
			]
		})
	});
}
function ne({ place: e, target: t, doctrines: r, onClose: i }) {
	let a = D(), [o, c] = O(t?.fit ? "fit" : "type"), [l, f] = O(t ? t.fit ? {
		id: t.fit.id,
		name: t.fit.name,
		subtitle: t.name,
		icon: t.icon
	} : {
		id: t.type_id,
		name: t.name,
		subtitle: "",
		icon: t.icon
	} : null), [p, m] = O(String(t?.quantity ?? 10)), [g, _] = O(t && t.low !== t.quantity ? String(t.low) : ""), [y, b] = O(t?.note ?? ""), x = T({
		mutationFn: () => {
			let n = {
				type_id: o === "type" ? l?.id : null,
				fit_id: o === "fit" ? l?.id : null,
				quantity: Number(p),
				low: g === "" ? null : Number(g),
				note: y,
				order: t?.order ?? 0
			};
			return t ? v.put(`${W}/targets/${t.id}`, n) : v.post(`${W}/places/${e.id}/targets`, n);
		},
		onSuccess: () => {
			a.invalidateQueries({ queryKey: ["stock"] }), i();
		},
		onError: (e) => w.error(e.message)
	});
	return /* @__PURE__ */ j(s, {
		open: !0,
		onOpenChange: (e) => !e && i(),
		title: t ? "Edit target" : `New target at ${e.label || e.name}`,
		footer: /* @__PURE__ */ M(A, { children: [/* @__PURE__ */ j(n, {
			variant: "ghost",
			onClick: i,
			children: "Cancel"
		}), /* @__PURE__ */ j(n, {
			variant: "primary",
			loading: x.isPending,
			disabled: !l || !(Number(p) >= 1),
			onClick: () => x.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ M("div", {
			className: "space-y-4",
			children: [
				r && /* @__PURE__ */ j(h, {
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
				/* @__PURE__ */ j(u, {
					label: o === "fit" ? "Doctrine fit" : "Ship or item",
					hint: o === "fit" ? "Counts the fit's hull: on the market, or on contract (usually fitted)." : void 0,
					children: l ? /* @__PURE__ */ M("div", {
						className: "flex items-center justify-between gap-2 border border-border px-3 py-2 text-sm",
						children: [/* @__PURE__ */ M("span", {
							className: "flex min-w-0 items-center gap-2",
							children: [
								l.icon && /* @__PURE__ */ j("img", {
									src: l.icon,
									alt: "",
									className: "size-6"
								}),
								/* @__PURE__ */ j("span", {
									className: "truncate font-medium",
									children: l.name
								}),
								l.subtitle && /* @__PURE__ */ j("span", {
									className: "truncate text-xs text-subtle",
									children: l.subtitle
								})
							]
						}), /* @__PURE__ */ j(n, {
							size: "xs",
							variant: "ghost",
							onClick: () => f(null),
							children: "Change"
						})]
					}) : /* @__PURE__ */ j(Q, {
						kind: o === "fit" ? "fits" : "types",
						placeholder: o === "fit" ? "Fit name" : "Type a name",
						onPick: f
					})
				}),
				/* @__PURE__ */ M("div", {
					className: "grid grid-cols-2 gap-4",
					children: [/* @__PURE__ */ j(u, {
						label: "Should be for sale",
						children: /* @__PURE__ */ j(d, {
							type: "number",
							min: 1,
							value: p,
							onChange: (e) => m(e.target.value),
							className: "font-mono"
						})
					}), /* @__PURE__ */ j(u, {
						label: "Low below",
						hint: "Alert below this many; empty means the target",
						children: /* @__PURE__ */ j(d, {
							type: "number",
							min: 0,
							value: g,
							onChange: (e) => _(e.target.value),
							className: "font-mono",
							placeholder: p
						})
					})]
				}),
				/* @__PURE__ */ j(u, {
					label: "Note",
					hint: "Optional, shown to members",
					children: /* @__PURE__ */ j(d, {
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
var re = x({
	routes: [{
		path: "",
		Component: K
	}, {
		path: "manage",
		Component: ee
	}],
	widgets: [{
		id: "stock",
		title: "Doctrine Stock",
		Component: X,
		size: "sm",
		order: 49
	}]
});
//#endregion
export { re as default };

export const classes = ["!data","!o","-space-x-1.5","@conduit/sdk","@tanstack/react-query","a","absolute","actions","already","also","alt","and","any","are","aria-label","as","at","autoFocus","be","below","bg-surface-raised","block","board","body","border","border-border","border-border-strong","but","button","by","can_manage","cheapest_contract","cheapest_order","children","claim","claim_days","claimed","claiming","claims","className","comes","confirmLabel","const","content","contract","contracts","corporations","currentColor","danger","data","days","default","definePlugin","description","disabled","divide-border","divide-y","doctrines","don","double","drops","each","empty","enabled","ends","expires_at","export","eyebrow","few","fill","first","fit","fit_id","fits","fitted","flex","flex-1","flex-wrap","font-medium","font-mono","font-semibold","footer","for","found","from","full","function","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-6","get","ghost","go","grid","grid-cols-2","h-16","h-64","has","hasn","have","here","hint","hit","hover:bg-hover","hover:text-text","how","hull","icon","icon-sm","icons","id","if","import","inline","inline-flex","interface","is","isLoading","isPending","item","items-baseline","items-center","items-end","its","itself","justify-between","justify-end","key","kind","knows","label","last","lasts","least","length","letters","ll","loading","location","location_id","locations","logistics","long","low","m12","m15","m17","m6","m7","manage","many","market","max","max-h-72","max-w-28","max-w-32","maxLength","mb-1","mb-4","md:grid-cols-[minmax(0,1fr)_220px_auto]","md:items-center","means","member","members","min","min-w-0","mode","mt-1","mutationFn","my_claim","name","none","not","note","null","number","of","ok","on","onChange","onClaim","onClick","onClose","onConfirm","onError","onOpenChange","onPick","onSuccess","on_contract","on_market","once","one","open","options","or","order","orders","others","outline","overflow-y-auto","parts","path","pb-card","pct","place","placeholder","places","plugin","portrait","primary","put","px-3","px-card","py-2","py-2.5","py-3","qc","quantity","queryFn","queryKey","react","react-router","refetchInterval","refresh","relative","release","rest","return","ring-2","ring-surface","round","rounded","routes","s","sale","save","says","search","secondary","seed","seeding","sell","set","setAddingPlace","setClaiming","setEditingPlace","setLabel","setLow","setMode","setNote","setOrder","setPicked","setQ","setQty","setQuantity","setRemoving","setTarget","setValue","settings","shadow-e3","ship","short","should","shown","shrink-0","side","site","size","size-10","size-3","size-4","size-5","size-6","size-8","sm","so","someone","something","space-y-1.5","space-y-3","space-y-4","space-y-6","src","staging","station","status","still","still_short","stock","stocked","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structure","structures","style","subtitle","success","summary","system","t","tabular-nums","target","targets","team","text-3xl","text-danger-fg","text-left","text-muted","text-sm","text-subtle","text-text","text-warning-fg","text-xs","the","their","they","things","this","title","to","told","tone","truncate","type","type_id","types","unclaimed","undefined","under","up","useQueryClient","useState","used","user","user_id","value","variant","viewBox","void","w-full","want","warning","what","when","where","who","widgets","with","worst","xs","yet","you","z-20"];
