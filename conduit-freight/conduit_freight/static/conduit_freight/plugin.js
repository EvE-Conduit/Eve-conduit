import { Badge as e, Button as t, Callout as n, Card as r, CardBody as i, ConfirmDialog as a, DataTable as o, Dialog as s, DiscordPings as c, EmptyState as l, Field as u, Input as d, PageHeader as f, Segmented as p, Select as m, Skeleton as h, StatCard as g, SwitchRow as _, Textarea as ee, Tooltip as v, api as y, cn as b, dateTime as x, definePlugin as S, isk as C, num as w, toast as T } from "@conduit/sdk";
import { useMutation as E, useQuery as D, useQueryClient as O } from "@tanstack/react-query";
import { useEffect as te, useState as k } from "react";
import { Link as A, useNavigate as j, useParams as M } from "react-router";
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
		/* @__PURE__ */ P("path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }),
		/* @__PURE__ */ P("path", { d: "M15 18H9" }),
		/* @__PURE__ */ P("path", { d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" }),
		/* @__PURE__ */ P("circle", {
			cx: "17",
			cy: "18",
			r: "2"
		}),
		/* @__PURE__ */ P("circle", {
			cx: "7",
			cy: "18",
			r: "2"
		})
	]
}), R = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ P("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), z = (e) => /* @__PURE__ */ P(I, {
	...e,
	children: /* @__PURE__ */ P("path", { d: "M20 6 9 17l-5-5" })
}), ne = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [
		/* @__PURE__ */ P("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }),
		/* @__PURE__ */ P("path", { d: "M12 9v4" }),
		/* @__PURE__ */ P("path", { d: "M12 17h.01" })
	]
}), B = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "M5 12h14" }), /* @__PURE__ */ P("path", { d: "M12 5v14" })]
}), V = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [
		/* @__PURE__ */ P("path", { d: "M3 6h18" }),
		/* @__PURE__ */ P("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ P("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), re = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" }), /* @__PURE__ */ P("path", { d: "m15 5 4 4" })]
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
}), oe = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "M5 12h14" }), /* @__PURE__ */ P("path", { d: "m12 5 7 7-7 7" })]
}), se = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [
		/* @__PURE__ */ P("path", { d: "m16 3 4 4-4 4" }),
		/* @__PURE__ */ P("path", { d: "M20 7H4" }),
		/* @__PURE__ */ P("path", { d: "m8 21-4-4 4-4" }),
		/* @__PURE__ */ P("path", { d: "M4 17h16" })
	]
}), ce = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ P("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
});
//#endregion
//#region src/shared.tsx
function H({ value: e, label: n = "Copy" }) {
	let [r, i] = k(!1);
	return /* @__PURE__ */ F(t, {
		size: "xs",
		variant: "ghost",
		"aria-label": `${n}: ${e}`,
		onClick: () => {
			navigator.clipboard.writeText(e).then(() => {
				i(!0), setTimeout(() => i(!1), 1500);
			}, () => T.error("Couldn't copy; select it and copy by hand"));
		},
		children: [
			P(r ? z : R, {}),
			" ",
			r ? "Copied" : n
		]
	});
}
function U({ to: e, children: t }) {
	return /* @__PURE__ */ F(A, {
		to: e,
		className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
		children: [
			/* @__PURE__ */ P(ae, {}),
			" ",
			t
		]
	});
}
function W({ system: e }) {
	if (!e) return null;
	let t = e.security >= .5 ? "text-success-fg" : e.security > 0 ? "text-warning-fg" : "text-danger-fg";
	return /* @__PURE__ */ F("span", {
		className: "text-muted",
		children: [
			e.name,
			" ",
			/* @__PURE__ */ P("span", {
				className: b("font-mono text-xs", t),
				children: e.security.toFixed(1)
			}),
			e.region && /* @__PURE__ */ F("span", {
				className: "text-subtle",
				children: [" · ", e.region]
			})
		]
	});
}
function G({ route: e, compact: t }) {
	return /* @__PURE__ */ F("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ F("div", {
			className: "flex flex-wrap items-center gap-1.5 font-medium",
			children: [
				/* @__PURE__ */ P("span", { children: e.start.name }),
				e.both_ways ? /* @__PURE__ */ P(se, { className: "size-3.5 text-subtle" }) : /* @__PURE__ */ P(oe, { className: "size-3.5 text-subtle" }),
				/* @__PURE__ */ P("span", { children: e.end.name })
			]
		}), !t && /* @__PURE__ */ F("div", {
			className: "text-xs",
			children: [
				/* @__PURE__ */ P(W, { system: e.start.system }),
				" ",
				/* @__PURE__ */ P("span", {
					className: "text-subtle",
					children: "to"
				}),
				" ",
				/* @__PURE__ */ P(W, { system: e.end.system }),
				e.jumps !== null && /* @__PURE__ */ F("span", {
					className: "text-subtle",
					children: [
						" · ",
						e.jumps,
						" jumps"
					]
				})
			]
		})]
	});
}
var le = (e) => `${Number.isInteger(e) ? e : e.toFixed(2)}%`;
function K({ route: e }) {
	let t = [
		e.base_price > 0 ? /* @__PURE__ */ F(N, { children: [C(e.base_price), " base"] }) : null,
		e.price_per_m3 > 0 ? /* @__PURE__ */ F(N, { children: [C(e.price_per_m3, { full: !0 }), "/m³"] }) : null,
		e.price_per_jump > 0 ? /* @__PURE__ */ F(N, { children: [C(e.price_per_jump), "/jump"] }) : null,
		e.collateral_percent > 0 ? /* @__PURE__ */ F(N, { children: [le(e.collateral_percent), " of collateral"] }) : null,
		e.min_reward > 0 ? /* @__PURE__ */ F(N, { children: ["at least ", C(e.min_reward)] }) : null,
		e.max_volume > 0 ? /* @__PURE__ */ F(N, { children: [
			"up to ",
			w(e.max_volume),
			" m³"
		] }) : null,
		e.max_collateral > 0 ? /* @__PURE__ */ F(N, { children: [
			"up to ",
			C(e.max_collateral),
			" collateral"
		] }) : null
	].filter(Boolean);
	return t.length ? /* @__PURE__ */ P("ul", {
		className: "flex flex-wrap gap-1.5",
		children: t.map((e, t) => /* @__PURE__ */ P("li", {
			className: "border border-border bg-surface-2 px-2 py-1 text-xs text-muted",
			children: e
		}, t))
	}) : /* @__PURE__ */ P("span", {
		className: "text-xs text-subtle",
		children: "Free"
	});
}
var ue = {
	outstanding: "accent",
	in_progress: "info",
	finished: "success",
	finished_issuer: "success",
	finished_contractor: "success",
	rejected: "danger",
	deleted: "neutral",
	expired: "warning",
	failed: "danger",
	reversed: "warning"
};
function de({ status: t, label: n }) {
	return /* @__PURE__ */ P(e, {
		tone: ue[t] ?? "neutral",
		children: n
	});
}
function fe({ problems: t, compact: n }) {
	if (!t.length) return n ? /* @__PURE__ */ P(e, {
		tone: "success",
		children: "Matches its route"
	}) : null;
	if (n) {
		let n = t.filter((e) => e.severe).length;
		return /* @__PURE__ */ P(v, {
			content: t.map((e) => e.text).join(" "),
			children: /* @__PURE__ */ P("span", { children: /* @__PURE__ */ P(e, {
				tone: n ? "danger" : "warning",
				children: n ? `${n} problem${n === 1 ? "" : "s"}` : `${t.length} note${t.length === 1 ? "" : "s"}`
			}) })
		});
	}
	return /* @__PURE__ */ P("ul", {
		className: "space-y-2",
		children: t.map((e) => /* @__PURE__ */ F("li", {
			className: b("flex items-start gap-2.5 border px-3 py-2 text-sm", e.severe ? "border-danger/40 bg-danger-soft text-danger-fg" : "border-warning/40 bg-warning-soft text-warning-fg"),
			children: [/* @__PURE__ */ P(ne, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ P("span", { children: e.text })]
		}, e.code))
	});
}
function q({ n: e, title: t, children: n }) {
	return /* @__PURE__ */ F("li", {
		className: "grid grid-cols-[28px_1fr] gap-3",
		children: [/* @__PURE__ */ P("span", {
			className: "grid size-7 place-items-center border border-border-strong font-mono text-xs text-accent-ink",
			children: e
		}), /* @__PURE__ */ F("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ P("div", {
				className: "hud-label text-subtle",
				children: t
			}), /* @__PURE__ */ P("div", {
				className: "mt-1",
				children: n
			})]
		})]
	});
}
function pe({ value: e }) {
	let t = String(Math.round(e));
	return /* @__PURE__ */ F("div", {
		className: "flex flex-wrap items-center gap-2",
		children: [/* @__PURE__ */ F("span", {
			className: "font-mono font-medium tabular-nums",
			children: [Number(t).toLocaleString("en"), " ISK"]
		}), /* @__PURE__ */ P(H, { value: t })]
	});
}
function me({ quote: e }) {
	let t = e.terms, r = e.route;
	return /* @__PURE__ */ F("div", {
		className: "panel border-accent/40 p-5",
		children: [
			/* @__PURE__ */ P("div", {
				className: "hud-label text-subtle",
				children: "Reward"
			}),
			/* @__PURE__ */ P("div", {
				className: "mt-1 font-mono text-[34px] font-semibold leading-none tabular-nums text-accent-ink",
				children: C(e.reward, { full: !0 })
			}),
			/* @__PURE__ */ F("div", {
				className: "mt-1.5 text-xs text-muted",
				children: [
					w(e.volume),
					" m³ · ",
					C(e.collateral),
					" collateral",
					r.jumps !== null && /* @__PURE__ */ F(N, { children: [
						" · ",
						r.jumps,
						" jumps"
					] })
				]
			}),
			e.problems.length > 0 && /* @__PURE__ */ F(n, {
				tone: "danger",
				className: "mt-4",
				children: [e.problems.join(" "), " Split the cargo, or ask the haulers first."]
			}),
			/* @__PURE__ */ F("ol", {
				className: "mt-6 space-y-4",
				children: [
					/* @__PURE__ */ P(q, {
						n: 1,
						title: "Courier contract, private, to",
						children: /* @__PURE__ */ F("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ P("span", {
									className: "font-medium",
									children: t.assignee.name || "—"
								}),
								/* @__PURE__ */ F("span", {
									className: "text-xs text-subtle",
									children: [
										"(",
										t.assignee.kind,
										")"
									]
								}),
								t.assignee.name && /* @__PURE__ */ P(H, { value: t.assignee.name })
							]
						})
					}),
					/* @__PURE__ */ P(q, {
						n: 2,
						title: "Pick up at",
						children: /* @__PURE__ */ F("div", {
							className: "text-sm",
							children: [
								/* @__PURE__ */ P("span", {
									className: "font-medium",
									children: r.start.name
								}),
								" ",
								/* @__PURE__ */ P(W, { system: r.start.system })
							]
						})
					}),
					/* @__PURE__ */ P(q, {
						n: 3,
						title: "Ship to",
						children: /* @__PURE__ */ F("div", {
							className: "flex flex-wrap items-center gap-2 text-sm",
							children: [
								/* @__PURE__ */ P("span", {
									className: "font-medium",
									children: r.end.name
								}),
								" ",
								/* @__PURE__ */ P(W, { system: r.end.system }),
								/* @__PURE__ */ P(H, { value: r.end.name })
							]
						})
					}),
					/* @__PURE__ */ P(q, {
						n: 4,
						title: "Reward",
						children: /* @__PURE__ */ P(pe, { value: e.reward })
					}),
					/* @__PURE__ */ P(q, {
						n: 5,
						title: "Collateral",
						children: /* @__PURE__ */ P(pe, { value: e.collateral })
					}),
					/* @__PURE__ */ P(q, {
						n: 6,
						title: "Expiration · Days to complete",
						children: /* @__PURE__ */ F("span", {
							className: "text-sm",
							children: [
								t.expiration_days,
								" day",
								t.expiration_days === 1 ? "" : "s",
								" · ",
								t.days_to_complete,
								" day",
								t.days_to_complete === 1 ? "" : "s"
							]
						})
					})
				]
			})
		]
	});
}
function J({ service: e, base: a }) {
	let [o, s] = k(String(e.routes[0]?.id ?? "")), [c, l] = k(""), [f, p] = k(""), h = E({
		mutationFn: () => y.post(`${a}/services/${e.id}/quote`, {
			route_id: Number(o),
			volume: Y(c),
			collateral: Y(f)
		}),
		onError: (e) => T.error(e.message)
	}), g = e.routes.find((e) => String(e.id) === o);
	return e.routes.length ? /* @__PURE__ */ F("div", {
		className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]",
		children: [/* @__PURE__ */ P(r, { children: /* @__PURE__ */ P(i, { children: /* @__PURE__ */ F("form", {
			className: "space-y-4",
			onSubmit: (e) => {
				e.preventDefault(), h.mutate();
			},
			children: [
				/* @__PURE__ */ P(u, {
					label: "Route",
					required: !0,
					children: /* @__PURE__ */ P(m, {
						value: o,
						onChange: (e) => {
							s(e.target.value), h.reset();
						},
						options: e.routes.map((e) => ({
							value: String(e.id),
							label: `${e.start.name} ${e.both_ways ? "⇄" : "→"} ${e.end.name}`
						}))
					})
				}),
				g && /* @__PURE__ */ P(K, { route: g }),
				/* @__PURE__ */ F("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ P(u, {
						label: "Volume (m³)",
						required: !0,
						children: /* @__PURE__ */ P(d, {
							inputMode: "decimal",
							value: c,
							onChange: (e) => l(e.target.value),
							placeholder: "e.g. 12,500"
						})
					}), /* @__PURE__ */ P(u, {
						label: "Collateral (ISK)",
						hint: "What the cargo is worth: the hauler pays it if they lose it.",
						children: /* @__PURE__ */ P(d, {
							inputMode: "decimal",
							value: f,
							onChange: (e) => p(e.target.value),
							placeholder: "e.g. 1,500,000,000"
						})
					})]
				}),
				/* @__PURE__ */ P(t, {
					type: "submit",
					variant: "primary",
					loading: h.isPending,
					disabled: !o || !Y(c),
					children: "Get a price"
				})
			]
		}) }) }), /* @__PURE__ */ P("div", { children: h.data ? /* @__PURE__ */ P(me, { quote: h.data }) : /* @__PURE__ */ P(n, {
			tone: "info",
			children: "Enter the volume and collateral for the reward and the exact contract to make."
		}) })]
	}) : /* @__PURE__ */ P(n, {
		tone: "info",
		children: "This service has no routes yet."
	});
}
function Y(e) {
	let t = e.trim().toLowerCase().replace(/[,\s_]/g, "").match(/^(\d*\.?\d+)([kmb]?)$/);
	return t ? Number(t[1]) * {
		"": 1,
		k: 1e3,
		m: 1e6,
		b: 1e9
	}[t[2]] : 0;
}
//#endregion
//#region src/types.ts
var X = "/api/p/freight", Z = "/api/public/p/freight", Q = "/p/freight/manage";
function he() {
	let { data: n, isLoading: i } = D({
		queryKey: ["freight", "manage"],
		queryFn: () => y.get(`${X}/manage`)
	}), a = j();
	return /* @__PURE__ */ F("div", { children: [
		/* @__PURE__ */ P(U, {
			to: "/p/freight",
			children: "Freight"
		}),
		/* @__PURE__ */ P(f, {
			icon: /* @__PURE__ */ P(ce, {}),
			eyebrow: "Freight",
			title: "Services",
			description: "Who hauls, the routes they run and what they charge.",
			actions: /* @__PURE__ */ P(A, {
				to: `${Q}/new`,
				children: /* @__PURE__ */ F(t, {
					variant: "primary",
					size: "sm",
					children: [/* @__PURE__ */ P(B, {}), " New service"]
				})
			})
		}),
		/* @__PURE__ */ P(r, { children: /* @__PURE__ */ P(o, {
			rows: n?.services ?? [],
			loading: i,
			rowKey: (e) => e.id,
			onRowClick: (e) => a(`${Q}/${e.id}`),
			empty: {
				icon: /* @__PURE__ */ P(L, {}),
				title: "No services yet",
				description: "Create one to give members a calculator and check their contracts."
			},
			columns: [
				{
					header: "Service",
					cell: (t) => /* @__PURE__ */ F("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ P("span", {
								className: "font-medium",
								children: t.name
							}),
							!t.active && /* @__PURE__ */ P(e, { children: "Closed" }),
							t.public && /* @__PURE__ */ P(e, {
								tone: "info",
								children: "Public"
							})
						]
					})
				},
				{
					header: "Contracts go to",
					cell: (e) => e.owner ? /* @__PURE__ */ F("span", {
						className: e.owner.login_ok ? "" : "text-danger-fg",
						children: [e.owner.name, !e.owner.login_ok && " (login can't read contracts)"]
					}) : /* @__PURE__ */ P("span", {
						className: "text-danger-fg",
						children: "Nobody"
					})
				},
				{
					header: "Routes",
					align: "right",
					cell: (e) => e.routes
				},
				{
					header: "Open",
					align: "right",
					cell: (t) => /* @__PURE__ */ F(N, { children: [t.open, t.problems > 0 && /* @__PURE__ */ P(e, {
						tone: "danger",
						className: "ml-2",
						children: t.problems
					})] })
				},
				{
					header: "Open rewards",
					align: "right",
					cell: (e) => /* @__PURE__ */ P("span", {
						className: "font-mono tabular-nums",
						children: C(e.open_reward)
					})
				},
				{
					header: "Delivered",
					align: "right",
					cell: (e) => /* @__PURE__ */ F("span", {
						className: "font-mono tabular-nums",
						children: [
							e.delivered,
							" · ",
							C(e.delivered_reward)
						]
					})
				}
			]
		}) }),
		/* @__PURE__ */ P(c, {
			plugin: "freight",
			className: "panel mt-6 p-card"
		})
	] });
}
var ge = {
	name: "",
	description: "",
	owner_id: null,
	is_corporation: !0,
	days_to_complete: 3,
	expiration_days: 7,
	state_ids: [],
	group_ids: [],
	public: !1,
	notify: !0,
	active: !0
};
function _e(e, t) {
	return e.includes(t) ? e.filter((e) => e !== t) : [...e, t];
}
function ve() {
	let { id: n } = M(), o = !n, s = j(), c = O(), p = D({
		queryKey: ["freight", "options"],
		queryFn: () => y.get(`${X}/manage/options`)
	}), g = D({
		queryKey: [
			"freight",
			"managed",
			n
		],
		queryFn: () => y.get(`${X}/manage/services/${n}`),
		enabled: !o
	}), [v, b] = k(ge), [x, S] = k(null), [C, w] = k(!1);
	te(() => {
		let e = g.data;
		e && b({
			name: e.name,
			description: e.description,
			owner_id: e.owner_id,
			is_corporation: e.is_corporation,
			days_to_complete: e.days_to_complete,
			expiration_days: e.expiration_days,
			state_ids: e.state_ids,
			group_ids: e.group_ids,
			public: e.public,
			notify: e.notify,
			active: e.active
		});
	}, [g.data]);
	let A = E({
		mutationFn: () => o ? y.post(`${X}/manage/services`, v) : y.put(`${X}/manage/services/${n}`, v),
		onSuccess: (e) => {
			T.success("Saved"), c.invalidateQueries({ queryKey: ["freight"] }), o && s(`${Q}/${e.id}`);
		},
		onError: (e) => T.error(e.message)
	}), N = E({
		mutationFn: () => y.post(`${X}/manage/services/${n}/sync`, {}),
		onSuccess: () => T.success("Reading the contracts now; the queue updates in a minute"),
		onError: (e) => T.error(e.message)
	}), I = E({
		mutationFn: (e) => y.delete(`${X}/manage/routes/${e}`),
		onSuccess: () => c.invalidateQueries({ queryKey: ["freight"] }),
		onError: (e) => T.error(e.message)
	});
	if (!o && g.isLoading) return /* @__PURE__ */ P(h, { className: "h-96" });
	if (!o && !g.data) return /* @__PURE__ */ P(l, {
		icon: /* @__PURE__ */ P(L, {}),
		title: "No such service"
	});
	let R = (e, t) => b((n) => ({
		...n,
		[e]: t
	})), z = p.data;
	return /* @__PURE__ */ F("div", { children: [
		/* @__PURE__ */ P(U, {
			to: Q,
			children: "Services"
		}),
		/* @__PURE__ */ P(f, {
			icon: /* @__PURE__ */ P(L, {}),
			eyebrow: "Freight",
			title: o ? "New service" : v.name || "Service",
			actions: !o && /* @__PURE__ */ F("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ F(t, {
					size: "sm",
					onClick: () => N.mutate(),
					loading: N.isPending,
					children: [/* @__PURE__ */ P(ie, {}), " Read contracts now"]
				}), /* @__PURE__ */ F(t, {
					size: "sm",
					variant: "danger",
					onClick: () => w(!0),
					children: [/* @__PURE__ */ P(V, {}), " Delete"]
				})]
			})
		}),
		/* @__PURE__ */ F("div", {
			className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
			children: [/* @__PURE__ */ P(r, { children: /* @__PURE__ */ P(i, { children: /* @__PURE__ */ F("form", {
				className: "space-y-4",
				onSubmit: (e) => {
					e.preventDefault(), A.mutate();
				},
				children: [
					/* @__PURE__ */ P(u, {
						label: "Name",
						required: !0,
						children: /* @__PURE__ */ P(d, {
							value: v.name,
							maxLength: 100,
							onChange: (e) => R("name", e.target.value)
						})
					}),
					/* @__PURE__ */ P(u, {
						label: "Description",
						hint: "Shown to customers above the calculator.",
						children: /* @__PURE__ */ P(ee, {
							value: v.description,
							maxLength: 4e3,
							onChange: (e) => R("description", e.target.value)
						})
					}),
					/* @__PURE__ */ F("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ P(u, {
								label: "Contracts go to",
								required: !0,
								hint: "One of your characters. Its login reads the contracts.",
								children: /* @__PURE__ */ P(m, {
									value: v.owner_id ? String(v.owner_id) : "",
									onChange: (e) => R("owner_id", e.target.value ? Number(e.target.value) : null),
									options: [
										{
											value: "",
											label: "Pick a character"
										},
										...g.data?.owner && !z?.characters.some((e) => e.id === g.data?.owner?.id) ? [{
											value: String(g.data.owner.id),
											label: g.data.owner.name
										}] : [],
										...(z?.characters ?? []).map((e) => ({
											value: String(e.id),
											label: `${e.name}${e.corporation ? ` (${e.corporation})` : ""}`
										}))
									]
								})
							}),
							/* @__PURE__ */ P(u, {
								label: "Made out to",
								children: /* @__PURE__ */ P(m, {
									value: v.is_corporation ? "corporation" : "character",
									onChange: (e) => R("is_corporation", e.target.value === "corporation"),
									options: [{
										value: "corporation",
										label: "The character's corporation"
									}, {
										value: "character",
										label: "The character"
									}]
								})
							}),
							/* @__PURE__ */ P(u, {
								label: "Days to complete",
								children: /* @__PURE__ */ P(d, {
									type: "number",
									min: 1,
									max: 30,
									value: v.days_to_complete,
									onChange: (e) => R("days_to_complete", Number(e.target.value))
								})
							}),
							/* @__PURE__ */ P(u, {
								label: "Expiration (days)",
								children: /* @__PURE__ */ P(d, {
									type: "number",
									min: 1,
									max: 30,
									value: v.expiration_days,
									onChange: (e) => R("expiration_days", Number(e.target.value))
								})
							})
						]
					}),
					z && (z.states.length > 0 || z.groups.length > 0) && /* @__PURE__ */ P(u, {
						label: "Who may use it",
						hint: "Nothing ticked: every member.",
						children: /* @__PURE__ */ F("div", {
							className: "flex flex-wrap gap-1.5",
							children: [z.states.map((e) => /* @__PURE__ */ P(t, {
								type: "button",
								size: "xs",
								variant: v.state_ids.includes(e.id) ? "primary" : "secondary",
								onClick: () => R("state_ids", _e(v.state_ids, e.id)),
								children: e.name
							}, `s${e.id}`)), z.groups.map((e) => /* @__PURE__ */ P(t, {
								type: "button",
								size: "xs",
								variant: v.group_ids.includes(e.id) ? "primary" : "secondary",
								onClick: () => R("group_ids", _e(v.group_ids, e.id)),
								children: e.name
							}, `g${e.id}`))]
						})
					}),
					/* @__PURE__ */ P(_, {
						label: "Open",
						description: "Closed services keep their contracts but give no new prices.",
						checked: v.active,
						onCheckedChange: (e) => R("active", e)
					}),
					/* @__PURE__ */ P(_, {
						label: "Public",
						description: "Anyone can use the calculator, without an account.",
						checked: v.public,
						onCheckedChange: (e) => R("public", e)
					}),
					/* @__PURE__ */ P(_, {
						label: "Tell the haulers",
						description: "Haulers and freight managers get a notification for each new contract.",
						checked: v.notify,
						onCheckedChange: (e) => R("notify", e)
					}),
					/* @__PURE__ */ P(t, {
						type: "submit",
						variant: "primary",
						loading: A.isPending,
						children: o ? "Create service" : "Save"
					})
				]
			}) }) }), !o && g.data && /* @__PURE__ */ P(r, { children: /* @__PURE__ */ F(i, { children: [/* @__PURE__ */ F("div", {
				className: "mb-3 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ P("div", {
					className: "hud-label text-subtle",
					children: "Routes"
				}), /* @__PURE__ */ F(t, {
					size: "xs",
					variant: "primary",
					onClick: () => S("new"),
					children: [/* @__PURE__ */ P(B, {}), " Add a route"]
				})]
			}), g.data.routes.length ? /* @__PURE__ */ P("ul", {
				className: "divide-y divide-border",
				children: g.data.routes.map((n) => /* @__PURE__ */ F("li", {
					className: "flex items-start justify-between gap-3 py-3",
					children: [/* @__PURE__ */ F("div", {
						className: "min-w-0 space-y-2",
						children: [/* @__PURE__ */ F("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ P(G, { route: n }), !n.active && /* @__PURE__ */ P(e, { children: "Off" })]
						}), /* @__PURE__ */ P(K, { route: n })]
					}), /* @__PURE__ */ F("div", {
						className: "flex shrink-0 gap-1",
						children: [/* @__PURE__ */ P(t, {
							size: "icon-xs",
							variant: "ghost",
							"aria-label": "Change",
							onClick: () => S(n),
							children: /* @__PURE__ */ P(re, {})
						}), /* @__PURE__ */ P(t, {
							size: "icon-xs",
							variant: "ghost",
							"aria-label": "Remove",
							onClick: () => I.mutate(n.id),
							children: /* @__PURE__ */ P(V, {})
						})]
					})]
				}, n.id))
			}) : /* @__PURE__ */ P(l, {
				icon: /* @__PURE__ */ P(L, {}),
				title: "No routes yet",
				description: "Every contract is flagged until it matches a route."
			})] }) })]
		}),
		x && g.data && /* @__PURE__ */ P(xe, {
			serviceId: g.data.id,
			route: x === "new" ? null : x,
			onClose: () => S(null)
		}),
		/* @__PURE__ */ P(a, {
			open: C,
			onOpenChange: w,
			title: "Delete this service?",
			description: "Its routes and the contracts it tracked go too. Contracts in game aren't touched.",
			confirmLabel: "Delete",
			danger: !0,
			onConfirm: async () => {
				await y.delete(`${X}/manage/services/${n}`), c.invalidateQueries({ queryKey: ["freight"] }), s(Q);
			}
		})
	] });
}
function ye({ label: e, value: t, onChange: n }) {
	let [r, i] = k(""), { data: a } = D({
		queryKey: [
			"freight",
			"search",
			r
		],
		queryFn: async () => {
			let [e, t] = await Promise.all([y.get(`${X}/manage/search/systems?q=${encodeURIComponent(r)}`), r.length >= 3 ? y.get(`${X}/manage/search/places?q=${encodeURIComponent(r)}`) : Promise.resolve([])]);
			return [...t, ...e];
		},
		enabled: r.length >= 2
	});
	return /* @__PURE__ */ P(u, {
		label: e,
		required: !0,
		hint: t.system_id ? t.location_id ? `Station or structure in ${t.system_name}` : `Anywhere in ${t.system_name}` : "Search a system, station or structure",
		children: /* @__PURE__ */ F("div", {
			className: "space-y-2",
			children: [
				/* @__PURE__ */ P(d, {
					placeholder: "Jita, Amarr VIII, 1DQ1-A - ...",
					value: r,
					onChange: (e) => i(e.target.value)
				}),
				r.length >= 2 && (a?.length ?? 0) > 0 && /* @__PURE__ */ P("ul", {
					className: "max-h-48 overflow-auto border border-border",
					children: a.map((e) => /* @__PURE__ */ P("li", { children: /* @__PURE__ */ F("button", {
						type: "button",
						className: "block w-full px-3 py-1.5 text-left text-sm hover:bg-hover",
						onClick: () => {
							n(e.solar_system_id ? {
								name: e.name,
								system_id: e.solar_system_id,
								system_name: e.solar_system_name ?? "",
								location_id: e.id
							} : {
								name: e.name,
								system_id: e.id,
								system_name: e.name,
								location_id: null
							}), i("");
						},
						children: [
							/* @__PURE__ */ P("span", {
								className: "font-medium",
								children: e.name
							}),
							" ",
							/* @__PURE__ */ P("span", {
								className: "text-xs text-subtle",
								children: e.subtitle
							})
						]
					}) }, `${e.solar_system_id ? "p" : "s"}${e.id}`))
				}),
				/* @__PURE__ */ P(d, {
					value: t.name,
					onChange: (e) => n({
						...t,
						name: e.target.value
					}),
					placeholder: "Name customers see",
					disabled: !t.system_id
				})
			]
		})
	});
}
function be(e, t) {
	let n = e?.[t];
	return {
		name: n?.name ?? "",
		system_id: n?.system?.id ?? null,
		system_name: n?.system?.name ?? "",
		location_id: n?.location_id ?? null
	};
}
function xe({ serviceId: e, route: n, onClose: r }) {
	let i = O(), [a, o] = k(be(n, "start")), [c, l] = k(be(n, "end")), [f, p] = k(n?.jumps == null ? "" : String(n.jumps)), [m, h] = k({
		base_price: n?.base_price ?? 0,
		price_per_m3: n?.price_per_m3 ?? 0,
		price_per_jump: n?.price_per_jump ?? 0,
		collateral_percent: n?.collateral_percent ?? 0,
		min_reward: n?.min_reward ?? 0,
		max_volume: n?.max_volume ?? 0,
		max_collateral: n?.max_collateral ?? 0
	}), [g, ee] = k(n?.both_ways ?? !0), [v, b] = k(n?.active ?? !0), x = !n || a.system_id !== n.start.system?.id || c.system_id !== n.end.system?.id, S = E({
		mutationFn: () => {
			let t = {
				start_name: a.name,
				start_system_id: a.system_id,
				start_location_id: a.location_id,
				end_name: c.name,
				end_system_id: c.system_id,
				end_location_id: c.location_id,
				jumps: f === "" || x && n?.jumps != null && f === String(n.jumps) ? null : Number(f),
				both_ways: g,
				active: v,
				...m
			};
			return n ? y.put(`${X}/manage/routes/${n.id}`, t) : y.post(`${X}/manage/services/${e}/routes`, t);
		},
		onSuccess: (e) => {
			i.invalidateQueries({ queryKey: ["freight"] }), e.jumps === null && m.price_per_jump > 0 && T.warning("ESI couldn't count the jumps; type them in or the per-jump price isn't charged"), r();
		},
		onError: (e) => T.error(e.message)
	}), C = (e, t, n) => /* @__PURE__ */ P(u, {
		label: t,
		hint: n,
		children: /* @__PURE__ */ P(d, {
			type: "number",
			min: 0,
			step: "any",
			value: m[e],
			onChange: (t) => h((n) => ({
				...n,
				[e]: Number(t.target.value)
			}))
		})
	});
	return /* @__PURE__ */ P(s, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		size: "lg",
		title: n ? "Change route" : "Add a route",
		footer: /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ P(t, {
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ P(t, {
			variant: "primary",
			loading: S.isPending,
			disabled: !a.system_id || !c.system_id,
			onClick: () => S.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ F("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ F("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ P(ye, {
						label: "Pick up",
						value: a,
						onChange: o
					}), /* @__PURE__ */ P(ye, {
						label: "Deliver to",
						value: c,
						onChange: l
					})]
				}),
				/* @__PURE__ */ F("div", {
					className: "grid gap-4 sm:grid-cols-3",
					children: [
						C("base_price", "Base price (ISK)"),
						C("price_per_m3", "ISK per m³"),
						C("collateral_percent", "% of collateral"),
						C("price_per_jump", "ISK per jump"),
						/* @__PURE__ */ P(u, {
							label: "Jumps",
							hint: "Empty: counted by ESI.",
							children: /* @__PURE__ */ P(d, {
								type: "number",
								min: 0,
								value: f,
								onChange: (e) => p(e.target.value)
							})
						}),
						C("min_reward", "Minimum reward (ISK)"),
						C("max_volume", "Max volume (m³)", "0: no limit"),
						C("max_collateral", "Max collateral (ISK)", "0: no limit")
					]
				}),
				/* @__PURE__ */ P(_, {
					label: "Both ways",
					description: "The same rates from the delivery end back to the pick-up.",
					checked: g,
					onCheckedChange: ee
				}),
				/* @__PURE__ */ P(_, {
					label: "On",
					description: "Routes that are off aren't offered and don't match contracts.",
					checked: v,
					onCheckedChange: b
				})
			]
		})
	});
}
//#endregion
//#region src/member.tsx
var $ = "/p/freight";
function Se({ service: e, to: t }) {
	return /* @__PURE__ */ P(r, {
		interactive: !0,
		children: /* @__PURE__ */ P(A, {
			to: t,
			className: "block",
			children: /* @__PURE__ */ F(i, {
				className: "space-y-3",
				children: [/* @__PURE__ */ F("div", { children: [/* @__PURE__ */ P("div", {
					className: "text-base font-semibold",
					children: e.name
				}), e.description && /* @__PURE__ */ P("p", {
					className: "mt-1 line-clamp-2 text-sm text-muted",
					children: e.description
				})] }), /* @__PURE__ */ F("ul", {
					className: "space-y-2",
					children: [e.routes.slice(0, 4).map((e) => /* @__PURE__ */ P("li", { children: /* @__PURE__ */ P(G, {
						route: e,
						compact: !0
					}) }, e.id)), e.routes.length > 4 && /* @__PURE__ */ F("li", {
						className: "text-xs text-subtle",
						children: [
							"and ",
							e.routes.length - 4,
							" more"
						]
					})]
				})]
			})
		})
	});
}
function Ce() {
	let { data: e, isLoading: n } = D({
		queryKey: ["freight", "services"],
		queryFn: () => y.get(`${X}/services`)
	});
	return /* @__PURE__ */ F("div", { children: [/* @__PURE__ */ P(f, {
		icon: /* @__PURE__ */ P(L, {}),
		eyebrow: "Freight",
		title: "Ship it with us",
		description: "Pick a route for the reward and the exact courier contract to make.",
		actions: /* @__PURE__ */ F("div", {
			className: "flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ P(A, {
					to: `${$}/me`,
					children: /* @__PURE__ */ P(t, {
						size: "sm",
						children: "My contracts"
					})
				}),
				e?.sees_queue && /* @__PURE__ */ P(A, {
					to: `${$}/queue`,
					children: /* @__PURE__ */ P(t, {
						size: "sm",
						children: "Hauling queue"
					})
				}),
				e?.can_manage && /* @__PURE__ */ P(A, {
					to: `${$}/manage`,
					children: /* @__PURE__ */ F(t, {
						size: "sm",
						children: [/* @__PURE__ */ P(ce, {}), " Services"]
					})
				})
			]
		})
	}), n ? /* @__PURE__ */ P(h, { className: "h-56" }) : e?.services.length ? e.services.length === 1 ? /* @__PURE__ */ P(J, {
		service: e.services[0],
		base: X
	}) : /* @__PURE__ */ P("div", {
		className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
		children: e.services.map((e) => /* @__PURE__ */ P(Se, {
			service: e,
			to: `${$}/services/${e.id}`
		}, e.id))
	}) : /* @__PURE__ */ P(r, { children: /* @__PURE__ */ P(l, {
		icon: /* @__PURE__ */ P(L, {}),
		title: "No freight services yet",
		description: e?.can_manage ? "Create one under Services." : void 0
	}) })] });
}
function we() {
	let { id: e } = M(), { data: t, isLoading: n } = D({
		queryKey: [
			"freight",
			"service",
			e
		],
		queryFn: () => y.get(`${X}/services/${e}`)
	});
	return n ? /* @__PURE__ */ P(h, { className: "h-96" }) : t ? /* @__PURE__ */ F("div", { children: [
		/* @__PURE__ */ P(U, {
			to: $,
			children: "All services"
		}),
		/* @__PURE__ */ P(f, {
			icon: /* @__PURE__ */ P(L, {}),
			eyebrow: "Freight",
			title: t.name,
			description: t.description || void 0
		}),
		/* @__PURE__ */ P(J, {
			service: t,
			base: X
		}),
		/* @__PURE__ */ P(Te, { service: t })
	] }) : /* @__PURE__ */ P(l, {
		icon: /* @__PURE__ */ P(L, {}),
		title: "No such service"
	});
}
function Te({ service: e }) {
	return e.routes.length < 2 ? null : /* @__PURE__ */ P(r, {
		className: "mt-6",
		children: /* @__PURE__ */ F(i, { children: [/* @__PURE__ */ P("div", {
			className: "hud-label mb-3 text-subtle",
			children: "Routes and rates"
		}), /* @__PURE__ */ P("ul", {
			className: "divide-y divide-border",
			children: e.routes.map((e) => /* @__PURE__ */ F("li", {
				className: "grid gap-2 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
				children: [/* @__PURE__ */ P(G, { route: e }), /* @__PURE__ */ P(K, { route: e })]
			}, e.id))
		})] })
	});
}
function Ee(e) {
	return [
		{
			header: "Route",
			cell: (e) => /* @__PURE__ */ F("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ P("div", {
					className: "truncate font-medium",
					children: e.route ?? `${e.start ?? "?"} → ${e.end ?? "?"}`
				}), /* @__PURE__ */ F("div", {
					className: "truncate text-xs text-subtle",
					children: [
						e.service?.name ?? "No service",
						" · ",
						x(e.date_issued)
					]
				})]
			})
		},
		...e ? [{
			header: "From",
			cell: (e) => /* @__PURE__ */ P("span", { children: e.issuer.name }),
			sortValue: (e) => e.issuer.name
		}] : [],
		{
			header: "Volume",
			align: "right",
			cell: (e) => /* @__PURE__ */ F("span", {
				className: "font-mono tabular-nums",
				children: [w(e.volume), " m³"]
			}),
			sortValue: (e) => e.volume
		},
		{
			header: "Collateral",
			align: "right",
			cell: (e) => /* @__PURE__ */ P("span", {
				className: "font-mono tabular-nums",
				children: C(e.collateral)
			}),
			sortValue: (e) => e.collateral
		},
		{
			header: "Reward",
			align: "right",
			cell: (e) => /* @__PURE__ */ F("div", {
				className: "font-mono tabular-nums",
				children: [C(e.reward), e.expected_reward !== null && Math.abs(e.expected_reward - e.reward) > 1 && /* @__PURE__ */ F("div", {
					className: "text-xs text-subtle",
					children: ["asks ", C(e.expected_reward)]
				})]
			}),
			sortValue: (e) => e.reward
		},
		{
			header: "Status",
			cell: (e) => /* @__PURE__ */ F("div", {
				className: "flex flex-wrap items-center gap-1.5",
				children: [/* @__PURE__ */ P(de, {
					status: e.status,
					label: e.status_label
				}), e.acceptor && /* @__PURE__ */ P("span", {
					className: "text-xs text-subtle",
					children: e.acceptor.name
				})]
			})
		},
		{
			header: "Checks",
			cell: (e) => e.open ? /* @__PURE__ */ P(fe, {
				problems: e.problems,
				compact: !0
			}) : null
		}
	];
}
function De() {
	let { data: e, isLoading: t } = D({
		queryKey: ["freight", "me"],
		queryFn: () => y.get(`${X}/me`)
	});
	return /* @__PURE__ */ F("div", { children: [
		/* @__PURE__ */ P(U, {
			to: $,
			children: "Freight"
		}),
		/* @__PURE__ */ P(f, {
			icon: /* @__PURE__ */ P(L, {}),
			eyebrow: "Freight",
			title: "My contracts",
			description: "Courier contracts your characters made to the freight services."
		}),
		/* @__PURE__ */ P(r, { children: /* @__PURE__ */ P(o, {
			rows: e?.contracts ?? [],
			loading: t,
			rowKey: (e) => e.contract_id,
			columns: Ee(!1),
			empty: {
				icon: /* @__PURE__ */ P(L, {}),
				title: "No courier contracts yet"
			}
		}) })
	] });
}
//#endregion
//#region src/public.tsx
var Oe = "/public/p/freight";
function ke() {
	let { data: e, isLoading: t } = D({
		queryKey: [
			"freight",
			"public",
			"services"
		],
		queryFn: () => y.get(`${Z}/services`)
	});
	return /* @__PURE__ */ F("div", { children: [/* @__PURE__ */ P(f, {
		icon: /* @__PURE__ */ P(L, {}),
		eyebrow: "Freight",
		title: "Ship it with us",
		description: "Pick a route for the reward and the exact courier contract to make."
	}), t ? /* @__PURE__ */ P(h, { className: "h-56" }) : e?.services.length ? /* @__PURE__ */ P("div", {
		className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
		children: e.services.map((e) => /* @__PURE__ */ P(Se, {
			service: e,
			to: `${Oe}/${e.id}`
		}, e.id))
	}) : /* @__PURE__ */ P(r, { children: /* @__PURE__ */ P(l, {
		icon: /* @__PURE__ */ P(L, {}),
		title: "No public freight services"
	}) })] });
}
function Ae() {
	let { id: e } = M(), { data: t, isLoading: n } = D({
		queryKey: [
			"freight",
			"public",
			"service",
			e
		],
		queryFn: () => y.get(`${Z}/services/${e}`)
	});
	return n ? /* @__PURE__ */ P(h, { className: "h-96" }) : t ? /* @__PURE__ */ F("div", { children: [
		/* @__PURE__ */ P(U, {
			to: Oe,
			children: "All services"
		}),
		/* @__PURE__ */ P(f, {
			icon: /* @__PURE__ */ P(L, {}),
			eyebrow: "Freight",
			title: t.name,
			description: t.description || void 0
		}),
		/* @__PURE__ */ P(J, {
			service: t,
			base: Z
		}),
		/* @__PURE__ */ P(Te, { service: t })
	] }) : /* @__PURE__ */ P(l, {
		icon: /* @__PURE__ */ P(L, {}),
		title: "No such service",
		description: "It may be closed, or no longer public."
	});
}
//#endregion
//#region src/queue.tsx
function je() {
	let [e, t] = k("waiting"), [n, i] = k(""), { data: a, isLoading: s } = D({
		queryKey: [
			"freight",
			"queue",
			e,
			n
		],
		queryFn: () => y.get(`${X}/queue?show=${e}${n ? `&service=${n}` : ""}`),
		refetchInterval: 6e4
	}), c = a?.counts;
	return /* @__PURE__ */ F("div", { children: [
		/* @__PURE__ */ P(U, {
			to: "/p/freight",
			children: "Freight"
		}),
		/* @__PURE__ */ P(f, {
			icon: /* @__PURE__ */ P(L, {}),
			eyebrow: "Freight",
			title: "Hauling queue",
			description: "Courier contracts to the freight services, checked against their routes every 15 minutes."
		}),
		/* @__PURE__ */ F("div", {
			className: "mb-6 grid gap-4 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ P(g, {
					label: "Open rewards",
					value: C(a?.totals.open_reward ?? 0)
				}),
				/* @__PURE__ */ P(g, {
					label: "Open collateral",
					value: C(a?.totals.open_collateral ?? 0)
				}),
				/* @__PURE__ */ P(g, {
					label: "Open volume",
					value: `${w(a?.totals.open_volume ?? 0)} m³`
				})
			]
		}),
		/* @__PURE__ */ F("div", {
			className: "mb-4 flex flex-wrap items-center justify-between gap-3",
			children: [/* @__PURE__ */ P(p, {
				value: e,
				onChange: t,
				"aria-label": "Which contracts",
				options: [
					{
						value: "waiting",
						label: `Waiting${c ? ` (${c.waiting})` : ""}`
					},
					{
						value: "in_transit",
						label: `In transit${c ? ` (${c.in_transit})` : ""}`
					},
					{
						value: "problems",
						label: `Problems${c ? ` (${c.problems})` : ""}`
					},
					{
						value: "done",
						label: "Finished"
					}
				]
			}), (a?.services.length ?? 0) > 1 && /* @__PURE__ */ P(m, {
				className: "w-56",
				value: n,
				onChange: (e) => i(e.target.value),
				"aria-label": "Service",
				options: [{
					value: "",
					label: "Every service"
				}, ...(a?.services ?? []).map((e) => ({
					value: String(e.id),
					label: e.name
				}))]
			})]
		}),
		/* @__PURE__ */ P(r, { children: /* @__PURE__ */ P(o, {
			rows: a?.contracts ?? [],
			loading: s,
			rowKey: (e) => e.contract_id,
			columns: Ee(!0),
			empty: {
				icon: /* @__PURE__ */ P(L, {}),
				title: "Nothing here",
				description: e === "problems" ? "Every open contract matches its route." : void 0
			}
		}) })
	] });
}
//#endregion
//#region src/index.tsx
var Me = S({
	routes: [
		{
			path: "",
			Component: Ce
		},
		{
			path: "services/:id",
			Component: we
		},
		{
			path: "me",
			Component: De
		},
		{
			path: "queue",
			Component: je
		},
		{
			path: "manage",
			Component: he
		},
		{
			path: "manage/new",
			Component: ve
		},
		{
			path: "manage/:id",
			Component: ve
		}
	],
	publicRoutes: [{
		path: "",
		Component: ke
	}, {
		path: ":id",
		Component: Ae
	}]
});
//#endregion
export { Me as default };

export const classes = ["!isNew","!o","!route","@conduit/sdk","@tanstack/react-query","a","above","accent","acceptor","actions","active","after","against","align","an","and","any","are","aren","aria-label","as","ask","asks","assignee","async","at","await","back","base","base_price","be","bg-danger-soft","bg-surface-2","bg-warning-soft","block","body","boolean","border","border-accent/40","border-border","border-border-strong","border-danger/40","border-warning/40","both_ways","breakdown","but","button","by","calculator","can","can_manage","cargo","cell","character","characters","charged","check","checked","children","className","code","collateral","collateral_percent","color","columns","compact","complete","confirmLabel","const","content","contract","contractColumns","contract_id","contracts","copy","corporation","couldn","count","counted","counts","courier","currentColor","customers","cx","cy","danger","data","date_accepted","date_completed","date_expired","date_issued","day","days_to_complete","decimal","default","definePlugin","deleted","delivered","delivered_reward","delivery","description","disabled","divide-border","divide-y","don","done","e","each","empty","en","enabled","end","end_location_id","end_name","end_system_id","every","exact","expected_reward","expiration_days","expired","export","extends","eyebrow","facts","failed","few","fill","finished","finished_contractor","finished_issuer","flagged","flex","flex-wrap","font-medium","font-mono","font-semibold","footer","for","freight","from","full","function","game","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-6","get","ghost","give","go","grid","grid-cols-[28px_1fr]","group_ids","groups","h-56","h-96","hand","has","hauler","haulers","header","height","here","hint","hover:bg-hover","hover:text-text","hud-label","i","icon","icon-xs","icons","id","ids","if","import","in","in_progress","in_transit","info","inline","inline-flex","inputMode","interface","is","isLoading","isNew","is_corporation","isn","issuer","issuer_corporation","it","items-center","items-start","its","jump","jumps","justify-between","keep","key","keyof","kind","knows","label","leading-none","least","length","lg","limit","line-clamp-2","lives","loading","location_id","login","login_ok","longer","looked","lose","m","m12","m15","m16","m21.73","m8","made","manage","manage/new","managed","managers","match","matches","max","max-h-48","maxLength","max_collateral","max_volume","may","mb-3","mb-4","mb-6","md:grid-cols-2","md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]","me","members","min","min-w-0","min_reward","minimum","minute","ml-2","more","moved","moving","mt-0.5","mt-1","mt-1.5","mt-4","mt-6","mutationFn","n","name","navigate","neutral","new","no","none","not","notification","notify","now","null","number","of","off","offered","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpenChange","onRowClick","onSubmit","onSuccess","one","open","open_collateral","open_reward","open_volume","options","opts","or","out","outstanding","overflow-auto","owner","owner_id","p","p-5","p-card","page","pages","panel","path","pays","pct","per","per-jump","place-items-center","placeholder","places","plugin","post","price","price_per_jump","price_per_m3","primary","problems","public","publicRoutes","put","px-2","px-3","py-1","py-1.5","py-2","py-3","qc","queryFn","queryKey","queue","quote","r","rate","rates","react","react-router","read","reads","refetchInterval","region","rejected","removeRoute","required","rest","return","reversed","reward","rewards","right","round","route","routeId","route_id","routes","rowKey","rows","run","rx","ry","s","same","save","search","secondary","security","see","sees_queue","select","service","serviceId","services","set","setActive","setBothWays","setCollateral","setDeleting","setDone","setEditing","setEnd","setForm","setJumps","setQ","setRates","setRouteId","setService","setShow","setStart","setVolume","sets","severe","show","shrink-0","signed","site","size","size-3.5","size-4","size-7","sm","sm:grid-cols-2","sm:grid-cols-3","so","solar_system_id","solar_system_name","sortValue","space-y-2","space-y-3","space-y-4","start","start_location_id","start_name","start_system_id","state_ids","states","station","status","status_label","step","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structure","style","submit","subtitle","success","such","sync","system","system_id","system_name","systems","t","tabular-nums","terms","text","text-[34px]","text-accent-ink","text-base","text-danger-fg","text-left","text-muted","text-sm","text-subtle","text-success-fg","text-warning-fg","text-xs","that","the","their","them","they","this","ticked","title","to","toast","tone","totals","tracked","true","truncate","type","typeof","undefined","under","until","up","updates","us","use","useMutation","useParams","useQuery","useQueryClient","useState","used","v","value","variant","viewBox","void","volume","w-56","w-full","waiting","warning","ways","what","which","width","with","withIssuer","without","words","worth","wrong","xl:grid-cols-3","xl:grid-cols-[minmax(0,1fr)_420px]","xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]","xs","yet","your"];
