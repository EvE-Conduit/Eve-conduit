import { Badge as e, Button as t, Callout as n, Card as r, CardBody as i, ConfirmDialog as a, DataTable as o, Dialog as s, EmptyState as c, Field as l, Input as u, PageHeader as d, Segmented as f, Select as p, Skeleton as m, StatCard as h, SwitchRow as g, Textarea as _, Tooltip as v, api as y, cn as b, dateTime as x, definePlugin as S, isk as C, num as w, toast as T } from "@conduit/sdk";
import { useMutation as E, useQuery as D, useQueryClient as O } from "@tanstack/react-query";
import { useEffect as ee, useState as k } from "react";
import { Link as A, useNavigate as te, useParams as j } from "react-router";
import { Fragment as M, jsx as N, jsxs as P } from "react/jsx-runtime";
//#region src/icons.tsx
function F({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ N("svg", {
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
var I = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [
		/* @__PURE__ */ N("path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }),
		/* @__PURE__ */ N("path", { d: "M15 18H9" }),
		/* @__PURE__ */ N("path", { d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" }),
		/* @__PURE__ */ N("circle", {
			cx: "17",
			cy: "18",
			r: "2"
		}),
		/* @__PURE__ */ N("circle", {
			cx: "7",
			cy: "18",
			r: "2"
		})
	]
}), ne = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ N("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), L = (e) => /* @__PURE__ */ N(F, {
	...e,
	children: /* @__PURE__ */ N("path", { d: "M20 6 9 17l-5-5" })
}), R = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [
		/* @__PURE__ */ N("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }),
		/* @__PURE__ */ N("path", { d: "M12 9v4" }),
		/* @__PURE__ */ N("path", { d: "M12 17h.01" })
	]
}), z = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "M5 12h14" }), /* @__PURE__ */ N("path", { d: "M12 5v14" })]
}), B = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [
		/* @__PURE__ */ N("path", { d: "M3 6h18" }),
		/* @__PURE__ */ N("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ N("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), re = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" }), /* @__PURE__ */ N("path", { d: "m15 5 4 4" })]
}), ie = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [
		/* @__PURE__ */ N("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ N("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ N("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ N("path", { d: "M8 16H3v5" })
	]
}), ae = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ N("path", { d: "M19 12H5" })]
}), oe = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "M5 12h14" }), /* @__PURE__ */ N("path", { d: "m12 5 7 7-7 7" })]
}), se = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [
		/* @__PURE__ */ N("path", { d: "m16 3 4 4-4 4" }),
		/* @__PURE__ */ N("path", { d: "M20 7H4" }),
		/* @__PURE__ */ N("path", { d: "m8 21-4-4 4-4" }),
		/* @__PURE__ */ N("path", { d: "M4 17h16" })
	]
}), ce = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ N("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
});
//#endregion
//#region src/shared.tsx
function V({ value: e, label: n = "Copy" }) {
	let [r, i] = k(!1);
	return /* @__PURE__ */ P(t, {
		size: "xs",
		variant: "ghost",
		"aria-label": `${n}: ${e}`,
		onClick: () => {
			navigator.clipboard.writeText(e).then(() => {
				i(!0), setTimeout(() => i(!1), 1500);
			}, () => T.error("Couldn't copy; select it and copy by hand"));
		},
		children: [
			N(r ? L : ne, {}),
			" ",
			r ? "Copied" : n
		]
	});
}
function H({ to: e, children: t }) {
	return /* @__PURE__ */ P(A, {
		to: e,
		className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
		children: [
			/* @__PURE__ */ N(ae, {}),
			" ",
			t
		]
	});
}
function U({ system: e }) {
	if (!e) return null;
	let t = e.security >= .5 ? "text-success-fg" : e.security > 0 ? "text-warning-fg" : "text-danger-fg";
	return /* @__PURE__ */ P("span", {
		className: "text-muted",
		children: [
			e.name,
			" ",
			/* @__PURE__ */ N("span", {
				className: b("font-mono text-xs", t),
				children: e.security.toFixed(1)
			}),
			e.region && /* @__PURE__ */ P("span", {
				className: "text-subtle",
				children: [" · ", e.region]
			})
		]
	});
}
function W({ route: e, compact: t }) {
	return /* @__PURE__ */ P("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ P("div", {
			className: "flex flex-wrap items-center gap-1.5 font-medium",
			children: [
				/* @__PURE__ */ N("span", { children: e.start.name }),
				e.both_ways ? /* @__PURE__ */ N(se, { className: "size-3.5 text-subtle" }) : /* @__PURE__ */ N(oe, { className: "size-3.5 text-subtle" }),
				/* @__PURE__ */ N("span", { children: e.end.name })
			]
		}), !t && /* @__PURE__ */ P("div", {
			className: "text-xs",
			children: [
				/* @__PURE__ */ N(U, { system: e.start.system }),
				" ",
				/* @__PURE__ */ N("span", {
					className: "text-subtle",
					children: "to"
				}),
				" ",
				/* @__PURE__ */ N(U, { system: e.end.system }),
				e.jumps !== null && /* @__PURE__ */ P("span", {
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
function G({ route: e }) {
	let t = [
		e.base_price > 0 ? /* @__PURE__ */ P(M, { children: [C(e.base_price), " base"] }) : null,
		e.price_per_m3 > 0 ? /* @__PURE__ */ P(M, { children: [C(e.price_per_m3, { full: !0 }), "/m³"] }) : null,
		e.price_per_jump > 0 ? /* @__PURE__ */ P(M, { children: [C(e.price_per_jump), "/jump"] }) : null,
		e.collateral_percent > 0 ? /* @__PURE__ */ P(M, { children: [le(e.collateral_percent), " of collateral"] }) : null,
		e.min_reward > 0 ? /* @__PURE__ */ P(M, { children: ["at least ", C(e.min_reward)] }) : null,
		e.max_volume > 0 ? /* @__PURE__ */ P(M, { children: [
			"up to ",
			w(e.max_volume),
			" m³"
		] }) : null,
		e.max_collateral > 0 ? /* @__PURE__ */ P(M, { children: [
			"up to ",
			C(e.max_collateral),
			" collateral"
		] }) : null
	].filter(Boolean);
	return t.length ? /* @__PURE__ */ N("ul", {
		className: "flex flex-wrap gap-1.5",
		children: t.map((e, t) => /* @__PURE__ */ N("li", {
			className: "border border-border bg-surface-2 px-2 py-1 text-xs text-muted",
			children: e
		}, t))
	}) : /* @__PURE__ */ N("span", {
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
	return /* @__PURE__ */ N(e, {
		tone: ue[t] ?? "neutral",
		children: n
	});
}
function fe({ problems: t, compact: n }) {
	if (!t.length) return n ? /* @__PURE__ */ N(e, {
		tone: "success",
		children: "Matches its route"
	}) : null;
	if (n) {
		let n = t.filter((e) => e.severe).length;
		return /* @__PURE__ */ N(v, {
			content: t.map((e) => e.text).join(" "),
			children: /* @__PURE__ */ N("span", { children: /* @__PURE__ */ N(e, {
				tone: n ? "danger" : "warning",
				children: n ? `${n} problem${n === 1 ? "" : "s"}` : `${t.length} note${t.length === 1 ? "" : "s"}`
			}) })
		});
	}
	return /* @__PURE__ */ N("ul", {
		className: "space-y-2",
		children: t.map((e) => /* @__PURE__ */ P("li", {
			className: b("flex items-start gap-2.5 border px-3 py-2 text-sm", e.severe ? "border-danger/40 bg-danger-soft text-danger-fg" : "border-warning/40 bg-warning-soft text-warning-fg"),
			children: [/* @__PURE__ */ N(R, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ N("span", { children: e.text })]
		}, e.code))
	});
}
function K({ n: e, title: t, children: n }) {
	return /* @__PURE__ */ P("li", {
		className: "grid grid-cols-[28px_1fr] gap-3",
		children: [/* @__PURE__ */ N("span", {
			className: "grid size-7 place-items-center border border-border-strong font-mono text-xs text-accent-ink",
			children: e
		}), /* @__PURE__ */ P("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ N("div", {
				className: "hud-label text-subtle",
				children: t
			}), /* @__PURE__ */ N("div", {
				className: "mt-1",
				children: n
			})]
		})]
	});
}
function pe({ value: e }) {
	let t = String(Math.round(e));
	return /* @__PURE__ */ P("div", {
		className: "flex flex-wrap items-center gap-2",
		children: [/* @__PURE__ */ P("span", {
			className: "font-mono font-medium tabular-nums",
			children: [Number(t).toLocaleString("en"), " ISK"]
		}), /* @__PURE__ */ N(V, { value: t })]
	});
}
function me({ quote: e }) {
	let t = e.terms, r = e.route;
	return /* @__PURE__ */ P("div", {
		className: "panel border-accent/40 p-5",
		children: [
			/* @__PURE__ */ N("div", {
				className: "hud-label text-subtle",
				children: "Reward"
			}),
			/* @__PURE__ */ N("div", {
				className: "mt-1 font-mono text-[34px] font-semibold leading-none tabular-nums text-accent-ink",
				children: C(e.reward, { full: !0 })
			}),
			/* @__PURE__ */ P("div", {
				className: "mt-1.5 text-xs text-muted",
				children: [
					w(e.volume),
					" m³ · ",
					C(e.collateral),
					" collateral",
					r.jumps !== null && /* @__PURE__ */ P(M, { children: [
						" · ",
						r.jumps,
						" jumps"
					] })
				]
			}),
			e.problems.length > 0 && /* @__PURE__ */ P(n, {
				tone: "danger",
				className: "mt-4",
				children: [e.problems.join(" "), " Split the cargo, or ask the haulers first."]
			}),
			/* @__PURE__ */ P("ol", {
				className: "mt-6 space-y-4",
				children: [
					/* @__PURE__ */ N(K, {
						n: 1,
						title: "Courier contract, private, to",
						children: /* @__PURE__ */ P("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ N("span", {
									className: "font-medium",
									children: t.assignee.name || "—"
								}),
								/* @__PURE__ */ P("span", {
									className: "text-xs text-subtle",
									children: [
										"(",
										t.assignee.kind,
										")"
									]
								}),
								t.assignee.name && /* @__PURE__ */ N(V, { value: t.assignee.name })
							]
						})
					}),
					/* @__PURE__ */ N(K, {
						n: 2,
						title: "Pick up at",
						children: /* @__PURE__ */ P("div", {
							className: "text-sm",
							children: [
								/* @__PURE__ */ N("span", {
									className: "font-medium",
									children: r.start.name
								}),
								" ",
								/* @__PURE__ */ N(U, { system: r.start.system })
							]
						})
					}),
					/* @__PURE__ */ N(K, {
						n: 3,
						title: "Ship to",
						children: /* @__PURE__ */ P("div", {
							className: "flex flex-wrap items-center gap-2 text-sm",
							children: [
								/* @__PURE__ */ N("span", {
									className: "font-medium",
									children: r.end.name
								}),
								" ",
								/* @__PURE__ */ N(U, { system: r.end.system }),
								/* @__PURE__ */ N(V, { value: r.end.name })
							]
						})
					}),
					/* @__PURE__ */ N(K, {
						n: 4,
						title: "Reward",
						children: /* @__PURE__ */ N(pe, { value: e.reward })
					}),
					/* @__PURE__ */ N(K, {
						n: 5,
						title: "Collateral",
						children: /* @__PURE__ */ N(pe, { value: e.collateral })
					}),
					/* @__PURE__ */ N(K, {
						n: 6,
						title: "Expiration · Days to complete",
						children: /* @__PURE__ */ P("span", {
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
function q({ service: e, base: a }) {
	let [o, s] = k(String(e.routes[0]?.id ?? "")), [c, d] = k(""), [f, m] = k(""), h = E({
		mutationFn: () => y.post(`${a}/services/${e.id}/quote`, {
			route_id: Number(o),
			volume: J(c),
			collateral: J(f)
		}),
		onError: (e) => T.error(e.message)
	}), g = e.routes.find((e) => String(e.id) === o);
	return e.routes.length ? /* @__PURE__ */ P("div", {
		className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]",
		children: [/* @__PURE__ */ N(r, { children: /* @__PURE__ */ N(i, { children: /* @__PURE__ */ P("form", {
			className: "space-y-4",
			onSubmit: (e) => {
				e.preventDefault(), h.mutate();
			},
			children: [
				/* @__PURE__ */ N(l, {
					label: "Route",
					required: !0,
					children: /* @__PURE__ */ N(p, {
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
				g && /* @__PURE__ */ N(G, { route: g }),
				/* @__PURE__ */ P("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ N(l, {
						label: "Volume (m³)",
						required: !0,
						children: /* @__PURE__ */ N(u, {
							inputMode: "decimal",
							value: c,
							onChange: (e) => d(e.target.value),
							placeholder: "e.g. 12,500"
						})
					}), /* @__PURE__ */ N(l, {
						label: "Collateral (ISK)",
						hint: "What the cargo is worth: the hauler pays it if they lose it.",
						children: /* @__PURE__ */ N(u, {
							inputMode: "decimal",
							value: f,
							onChange: (e) => m(e.target.value),
							placeholder: "e.g. 1,500,000,000"
						})
					})]
				}),
				/* @__PURE__ */ N(t, {
					type: "submit",
					variant: "primary",
					loading: h.isPending,
					disabled: !o || !J(c),
					children: "Get a price"
				})
			]
		}) }) }), /* @__PURE__ */ N("div", { children: h.data ? /* @__PURE__ */ N(me, { quote: h.data }) : /* @__PURE__ */ N(n, {
			tone: "info",
			children: "Enter the volume and collateral for the reward and the exact contract to make."
		}) })]
	}) : /* @__PURE__ */ N(n, {
		tone: "info",
		children: "This service has no routes yet."
	});
}
function J(e) {
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
var Y = "/api/p/freight", X = "/api/public/p/freight", Z = "/p/freight/manage";
function he() {
	let { data: n, isLoading: i } = D({
		queryKey: ["freight", "manage"],
		queryFn: () => y.get(`${Y}/manage`)
	}), a = te();
	return /* @__PURE__ */ P("div", { children: [
		/* @__PURE__ */ N(H, {
			to: "/p/freight",
			children: "Freight"
		}),
		/* @__PURE__ */ N(d, {
			icon: /* @__PURE__ */ N(ce, {}),
			eyebrow: "Freight",
			title: "Services",
			description: "Who hauls, the routes they run and what they charge.",
			actions: /* @__PURE__ */ N(A, {
				to: `${Z}/new`,
				children: /* @__PURE__ */ P(t, {
					variant: "primary",
					size: "sm",
					children: [/* @__PURE__ */ N(z, {}), " New service"]
				})
			})
		}),
		/* @__PURE__ */ N(r, { children: /* @__PURE__ */ N(o, {
			rows: n?.services ?? [],
			loading: i,
			rowKey: (e) => e.id,
			onRowClick: (e) => a(`${Z}/${e.id}`),
			empty: {
				icon: /* @__PURE__ */ N(I, {}),
				title: "No services yet",
				description: "Create one to give members a calculator and check their contracts."
			},
			columns: [
				{
					header: "Service",
					cell: (t) => /* @__PURE__ */ P("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ N("span", {
								className: "font-medium",
								children: t.name
							}),
							!t.active && /* @__PURE__ */ N(e, { children: "Closed" }),
							t.public && /* @__PURE__ */ N(e, {
								tone: "info",
								children: "Public"
							})
						]
					})
				},
				{
					header: "Contracts go to",
					cell: (e) => e.owner ? /* @__PURE__ */ P("span", {
						className: e.owner.login_ok ? "" : "text-danger-fg",
						children: [e.owner.name, !e.owner.login_ok && " (login can't read contracts)"]
					}) : /* @__PURE__ */ N("span", {
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
					cell: (t) => /* @__PURE__ */ P(M, { children: [t.open, t.problems > 0 && /* @__PURE__ */ N(e, {
						tone: "danger",
						className: "ml-2",
						children: t.problems
					})] })
				},
				{
					header: "Open rewards",
					align: "right",
					cell: (e) => /* @__PURE__ */ N("span", {
						className: "font-mono tabular-nums",
						children: C(e.open_reward)
					})
				},
				{
					header: "Delivered",
					align: "right",
					cell: (e) => /* @__PURE__ */ P("span", {
						className: "font-mono tabular-nums",
						children: [
							e.delivered,
							" · ",
							C(e.delivered_reward)
						]
					})
				}
			]
		}) })
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
function Q() {
	let { id: n } = j(), o = !n, s = te(), f = O(), h = D({
		queryKey: ["freight", "options"],
		queryFn: () => y.get(`${Y}/manage/options`)
	}), v = D({
		queryKey: [
			"freight",
			"managed",
			n
		],
		queryFn: () => y.get(`${Y}/manage/services/${n}`),
		enabled: !o
	}), [b, x] = k(ge), [S, C] = k(null), [w, A] = k(!1);
	ee(() => {
		let e = v.data;
		e && x({
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
	}, [v.data]);
	let M = E({
		mutationFn: () => o ? y.post(`${Y}/manage/services`, b) : y.put(`${Y}/manage/services/${n}`, b),
		onSuccess: (e) => {
			T.success("Saved"), f.invalidateQueries({ queryKey: ["freight"] }), o && s(`${Z}/${e.id}`);
		},
		onError: (e) => T.error(e.message)
	}), F = E({
		mutationFn: () => y.post(`${Y}/manage/services/${n}/sync`, {}),
		onSuccess: () => T.success("Reading the contracts now; the queue updates in a minute"),
		onError: (e) => T.error(e.message)
	}), ne = E({
		mutationFn: (e) => y.delete(`${Y}/manage/routes/${e}`),
		onSuccess: () => f.invalidateQueries({ queryKey: ["freight"] }),
		onError: (e) => T.error(e.message)
	});
	if (!o && v.isLoading) return /* @__PURE__ */ N(m, { className: "h-96" });
	if (!o && !v.data) return /* @__PURE__ */ N(c, {
		icon: /* @__PURE__ */ N(I, {}),
		title: "No such service"
	});
	let L = (e, t) => x((n) => ({
		...n,
		[e]: t
	})), R = h.data;
	return /* @__PURE__ */ P("div", { children: [
		/* @__PURE__ */ N(H, {
			to: Z,
			children: "Services"
		}),
		/* @__PURE__ */ N(d, {
			icon: /* @__PURE__ */ N(I, {}),
			eyebrow: "Freight",
			title: o ? "New service" : b.name || "Service",
			actions: !o && /* @__PURE__ */ P("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ P(t, {
					size: "sm",
					onClick: () => F.mutate(),
					loading: F.isPending,
					children: [/* @__PURE__ */ N(ie, {}), " Read contracts now"]
				}), /* @__PURE__ */ P(t, {
					size: "sm",
					variant: "danger",
					onClick: () => A(!0),
					children: [/* @__PURE__ */ N(B, {}), " Delete"]
				})]
			})
		}),
		/* @__PURE__ */ P("div", {
			className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
			children: [/* @__PURE__ */ N(r, { children: /* @__PURE__ */ N(i, { children: /* @__PURE__ */ P("form", {
				className: "space-y-4",
				onSubmit: (e) => {
					e.preventDefault(), M.mutate();
				},
				children: [
					/* @__PURE__ */ N(l, {
						label: "Name",
						required: !0,
						children: /* @__PURE__ */ N(u, {
							value: b.name,
							maxLength: 100,
							onChange: (e) => L("name", e.target.value)
						})
					}),
					/* @__PURE__ */ N(l, {
						label: "Description",
						hint: "Shown to customers above the calculator.",
						children: /* @__PURE__ */ N(_, {
							value: b.description,
							maxLength: 4e3,
							onChange: (e) => L("description", e.target.value)
						})
					}),
					/* @__PURE__ */ P("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ N(l, {
								label: "Contracts go to",
								required: !0,
								hint: "One of your characters. Its login reads the contracts.",
								children: /* @__PURE__ */ N(p, {
									value: b.owner_id ? String(b.owner_id) : "",
									onChange: (e) => L("owner_id", e.target.value ? Number(e.target.value) : null),
									options: [
										{
											value: "",
											label: "Pick a character"
										},
										...v.data?.owner && !R?.characters.some((e) => e.id === v.data?.owner?.id) ? [{
											value: String(v.data.owner.id),
											label: v.data.owner.name
										}] : [],
										...(R?.characters ?? []).map((e) => ({
											value: String(e.id),
											label: `${e.name}${e.corporation ? ` (${e.corporation})` : ""}`
										}))
									]
								})
							}),
							/* @__PURE__ */ N(l, {
								label: "Made out to",
								children: /* @__PURE__ */ N(p, {
									value: b.is_corporation ? "corporation" : "character",
									onChange: (e) => L("is_corporation", e.target.value === "corporation"),
									options: [{
										value: "corporation",
										label: "The character's corporation"
									}, {
										value: "character",
										label: "The character"
									}]
								})
							}),
							/* @__PURE__ */ N(l, {
								label: "Days to complete",
								children: /* @__PURE__ */ N(u, {
									type: "number",
									min: 1,
									max: 30,
									value: b.days_to_complete,
									onChange: (e) => L("days_to_complete", Number(e.target.value))
								})
							}),
							/* @__PURE__ */ N(l, {
								label: "Expiration (days)",
								children: /* @__PURE__ */ N(u, {
									type: "number",
									min: 1,
									max: 30,
									value: b.expiration_days,
									onChange: (e) => L("expiration_days", Number(e.target.value))
								})
							})
						]
					}),
					R && (R.states.length > 0 || R.groups.length > 0) && /* @__PURE__ */ N(l, {
						label: "Who may use it",
						hint: "Nothing ticked: every member.",
						children: /* @__PURE__ */ P("div", {
							className: "flex flex-wrap gap-1.5",
							children: [R.states.map((e) => /* @__PURE__ */ N(t, {
								type: "button",
								size: "xs",
								variant: b.state_ids.includes(e.id) ? "primary" : "secondary",
								onClick: () => L("state_ids", _e(b.state_ids, e.id)),
								children: e.name
							}, `s${e.id}`)), R.groups.map((e) => /* @__PURE__ */ N(t, {
								type: "button",
								size: "xs",
								variant: b.group_ids.includes(e.id) ? "primary" : "secondary",
								onClick: () => L("group_ids", _e(b.group_ids, e.id)),
								children: e.name
							}, `g${e.id}`))]
						})
					}),
					/* @__PURE__ */ N(g, {
						label: "Open",
						description: "Closed services keep their contracts but give no new prices.",
						checked: b.active,
						onCheckedChange: (e) => L("active", e)
					}),
					/* @__PURE__ */ N(g, {
						label: "Public",
						description: "Anyone can use the calculator, without an account.",
						checked: b.public,
						onCheckedChange: (e) => L("public", e)
					}),
					/* @__PURE__ */ N(g, {
						label: "Tell the haulers",
						description: "Haulers and freight managers get a notification for each new contract.",
						checked: b.notify,
						onCheckedChange: (e) => L("notify", e)
					}),
					/* @__PURE__ */ N(t, {
						type: "submit",
						variant: "primary",
						loading: M.isPending,
						children: o ? "Create service" : "Save"
					})
				]
			}) }) }), !o && v.data && /* @__PURE__ */ N(r, { children: /* @__PURE__ */ P(i, { children: [/* @__PURE__ */ P("div", {
				className: "mb-3 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ N("div", {
					className: "hud-label text-subtle",
					children: "Routes"
				}), /* @__PURE__ */ P(t, {
					size: "xs",
					variant: "primary",
					onClick: () => C("new"),
					children: [/* @__PURE__ */ N(z, {}), " Add a route"]
				})]
			}), v.data.routes.length ? /* @__PURE__ */ N("ul", {
				className: "divide-y divide-border",
				children: v.data.routes.map((n) => /* @__PURE__ */ P("li", {
					className: "flex items-start justify-between gap-3 py-3",
					children: [/* @__PURE__ */ P("div", {
						className: "min-w-0 space-y-2",
						children: [/* @__PURE__ */ P("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ N(W, { route: n }), !n.active && /* @__PURE__ */ N(e, { children: "Off" })]
						}), /* @__PURE__ */ N(G, { route: n })]
					}), /* @__PURE__ */ P("div", {
						className: "flex shrink-0 gap-1",
						children: [/* @__PURE__ */ N(t, {
							size: "icon-xs",
							variant: "ghost",
							"aria-label": "Change",
							onClick: () => C(n),
							children: /* @__PURE__ */ N(re, {})
						}), /* @__PURE__ */ N(t, {
							size: "icon-xs",
							variant: "ghost",
							"aria-label": "Remove",
							onClick: () => ne.mutate(n.id),
							children: /* @__PURE__ */ N(B, {})
						})]
					})]
				}, n.id))
			}) : /* @__PURE__ */ N(c, {
				icon: /* @__PURE__ */ N(I, {}),
				title: "No routes yet",
				description: "Every contract is flagged until it matches a route."
			})] }) })]
		}),
		S && v.data && /* @__PURE__ */ N(be, {
			serviceId: v.data.id,
			route: S === "new" ? null : S,
			onClose: () => C(null)
		}),
		/* @__PURE__ */ N(a, {
			open: w,
			onOpenChange: A,
			title: "Delete this service?",
			description: "Its routes and the contracts it tracked go too. Contracts in game aren't touched.",
			confirmLabel: "Delete",
			danger: !0,
			onConfirm: async () => {
				await y.delete(`${Y}/manage/services/${n}`), f.invalidateQueries({ queryKey: ["freight"] }), s(Z);
			}
		})
	] });
}
function ve({ label: e, value: t, onChange: n }) {
	let [r, i] = k(""), { data: a } = D({
		queryKey: [
			"freight",
			"search",
			r
		],
		queryFn: async () => {
			let [e, t] = await Promise.all([y.get(`${Y}/manage/search/systems?q=${encodeURIComponent(r)}`), r.length >= 3 ? y.get(`${Y}/manage/search/places?q=${encodeURIComponent(r)}`) : Promise.resolve([])]);
			return [...t, ...e];
		},
		enabled: r.length >= 2
	});
	return /* @__PURE__ */ N(l, {
		label: e,
		required: !0,
		hint: t.system_id ? t.location_id ? `Station or structure in ${t.system_name}` : `Anywhere in ${t.system_name}` : "Search a system, station or structure",
		children: /* @__PURE__ */ P("div", {
			className: "space-y-2",
			children: [
				/* @__PURE__ */ N(u, {
					placeholder: "Jita, Amarr VIII, 1DQ1-A - ...",
					value: r,
					onChange: (e) => i(e.target.value)
				}),
				r.length >= 2 && (a?.length ?? 0) > 0 && /* @__PURE__ */ N("ul", {
					className: "max-h-48 overflow-auto border border-border",
					children: a.map((e) => /* @__PURE__ */ N("li", { children: /* @__PURE__ */ P("button", {
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
							/* @__PURE__ */ N("span", {
								className: "font-medium",
								children: e.name
							}),
							" ",
							/* @__PURE__ */ N("span", {
								className: "text-xs text-subtle",
								children: e.subtitle
							})
						]
					}) }, `${e.solar_system_id ? "p" : "s"}${e.id}`))
				}),
				/* @__PURE__ */ N(u, {
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
function ye(e, t) {
	let n = e?.[t];
	return {
		name: n?.name ?? "",
		system_id: n?.system?.id ?? null,
		system_name: n?.system?.name ?? "",
		location_id: n?.location_id ?? null
	};
}
function be({ serviceId: e, route: n, onClose: r }) {
	let i = O(), [a, o] = k(ye(n, "start")), [c, d] = k(ye(n, "end")), [f, p] = k(n?.jumps == null ? "" : String(n.jumps)), [m, h] = k({
		base_price: n?.base_price ?? 0,
		price_per_m3: n?.price_per_m3 ?? 0,
		price_per_jump: n?.price_per_jump ?? 0,
		collateral_percent: n?.collateral_percent ?? 0,
		min_reward: n?.min_reward ?? 0,
		max_volume: n?.max_volume ?? 0,
		max_collateral: n?.max_collateral ?? 0
	}), [_, v] = k(n?.both_ways ?? !0), [b, x] = k(n?.active ?? !0), S = !n || a.system_id !== n.start.system?.id || c.system_id !== n.end.system?.id, C = E({
		mutationFn: () => {
			let t = {
				start_name: a.name,
				start_system_id: a.system_id,
				start_location_id: a.location_id,
				end_name: c.name,
				end_system_id: c.system_id,
				end_location_id: c.location_id,
				jumps: f === "" || S && n?.jumps != null && f === String(n.jumps) ? null : Number(f),
				both_ways: _,
				active: b,
				...m
			};
			return n ? y.put(`${Y}/manage/routes/${n.id}`, t) : y.post(`${Y}/manage/services/${e}/routes`, t);
		},
		onSuccess: (e) => {
			i.invalidateQueries({ queryKey: ["freight"] }), e.jumps === null && m.price_per_jump > 0 && T.warning("ESI couldn't count the jumps; type them in or the per-jump price isn't charged"), r();
		},
		onError: (e) => T.error(e.message)
	}), w = (e, t, n) => /* @__PURE__ */ N(l, {
		label: t,
		hint: n,
		children: /* @__PURE__ */ N(u, {
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
	return /* @__PURE__ */ N(s, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		size: "lg",
		title: n ? "Change route" : "Add a route",
		footer: /* @__PURE__ */ P(M, { children: [/* @__PURE__ */ N(t, {
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ N(t, {
			variant: "primary",
			loading: C.isPending,
			disabled: !a.system_id || !c.system_id,
			onClick: () => C.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ P("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ P("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ N(ve, {
						label: "Pick up",
						value: a,
						onChange: o
					}), /* @__PURE__ */ N(ve, {
						label: "Deliver to",
						value: c,
						onChange: d
					})]
				}),
				/* @__PURE__ */ P("div", {
					className: "grid gap-4 sm:grid-cols-3",
					children: [
						w("base_price", "Base price (ISK)"),
						w("price_per_m3", "ISK per m³"),
						w("collateral_percent", "% of collateral"),
						w("price_per_jump", "ISK per jump"),
						/* @__PURE__ */ N(l, {
							label: "Jumps",
							hint: "Empty: counted by ESI.",
							children: /* @__PURE__ */ N(u, {
								type: "number",
								min: 0,
								value: f,
								onChange: (e) => p(e.target.value)
							})
						}),
						w("min_reward", "Minimum reward (ISK)"),
						w("max_volume", "Max volume (m³)", "0: no limit"),
						w("max_collateral", "Max collateral (ISK)", "0: no limit")
					]
				}),
				/* @__PURE__ */ N(g, {
					label: "Both ways",
					description: "The same rates from the delivery end back to the pick-up.",
					checked: _,
					onCheckedChange: v
				}),
				/* @__PURE__ */ N(g, {
					label: "On",
					description: "Routes that are off aren't offered and don't match contracts.",
					checked: b,
					onCheckedChange: x
				})
			]
		})
	});
}
//#endregion
//#region src/member.tsx
var $ = "/p/freight";
function xe({ service: e, to: t }) {
	return /* @__PURE__ */ N(r, {
		interactive: !0,
		children: /* @__PURE__ */ N(A, {
			to: t,
			className: "block",
			children: /* @__PURE__ */ P(i, {
				className: "space-y-3",
				children: [/* @__PURE__ */ P("div", { children: [/* @__PURE__ */ N("div", {
					className: "text-base font-semibold",
					children: e.name
				}), e.description && /* @__PURE__ */ N("p", {
					className: "mt-1 line-clamp-2 text-sm text-muted",
					children: e.description
				})] }), /* @__PURE__ */ P("ul", {
					className: "space-y-2",
					children: [e.routes.slice(0, 4).map((e) => /* @__PURE__ */ N("li", { children: /* @__PURE__ */ N(W, {
						route: e,
						compact: !0
					}) }, e.id)), e.routes.length > 4 && /* @__PURE__ */ P("li", {
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
function Se() {
	let { data: e, isLoading: n } = D({
		queryKey: ["freight", "services"],
		queryFn: () => y.get(`${Y}/services`)
	});
	return /* @__PURE__ */ P("div", { children: [/* @__PURE__ */ N(d, {
		icon: /* @__PURE__ */ N(I, {}),
		eyebrow: "Freight",
		title: "Ship it with us",
		description: "Pick a route for the reward and the exact courier contract to make.",
		actions: /* @__PURE__ */ P("div", {
			className: "flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ N(A, {
					to: `${$}/me`,
					children: /* @__PURE__ */ N(t, {
						size: "sm",
						children: "My contracts"
					})
				}),
				e?.sees_queue && /* @__PURE__ */ N(A, {
					to: `${$}/queue`,
					children: /* @__PURE__ */ N(t, {
						size: "sm",
						children: "Hauling queue"
					})
				}),
				e?.can_manage && /* @__PURE__ */ N(A, {
					to: `${$}/manage`,
					children: /* @__PURE__ */ P(t, {
						size: "sm",
						children: [/* @__PURE__ */ N(ce, {}), " Services"]
					})
				})
			]
		})
	}), n ? /* @__PURE__ */ N(m, { className: "h-56" }) : e?.services.length ? e.services.length === 1 ? /* @__PURE__ */ N(q, {
		service: e.services[0],
		base: Y
	}) : /* @__PURE__ */ N("div", {
		className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
		children: e.services.map((e) => /* @__PURE__ */ N(xe, {
			service: e,
			to: `${$}/services/${e.id}`
		}, e.id))
	}) : /* @__PURE__ */ N(r, { children: /* @__PURE__ */ N(c, {
		icon: /* @__PURE__ */ N(I, {}),
		title: "No freight services yet",
		description: e?.can_manage ? "Create one under Services." : void 0
	}) })] });
}
function Ce() {
	let { id: e } = j(), { data: t, isLoading: n } = D({
		queryKey: [
			"freight",
			"service",
			e
		],
		queryFn: () => y.get(`${Y}/services/${e}`)
	});
	return n ? /* @__PURE__ */ N(m, { className: "h-96" }) : t ? /* @__PURE__ */ P("div", { children: [
		/* @__PURE__ */ N(H, {
			to: $,
			children: "All services"
		}),
		/* @__PURE__ */ N(d, {
			icon: /* @__PURE__ */ N(I, {}),
			eyebrow: "Freight",
			title: t.name,
			description: t.description || void 0
		}),
		/* @__PURE__ */ N(q, {
			service: t,
			base: Y
		}),
		/* @__PURE__ */ N(we, { service: t })
	] }) : /* @__PURE__ */ N(c, {
		icon: /* @__PURE__ */ N(I, {}),
		title: "No such service"
	});
}
function we({ service: e }) {
	return e.routes.length < 2 ? null : /* @__PURE__ */ N(r, {
		className: "mt-6",
		children: /* @__PURE__ */ P(i, { children: [/* @__PURE__ */ N("div", {
			className: "hud-label mb-3 text-subtle",
			children: "Routes and rates"
		}), /* @__PURE__ */ N("ul", {
			className: "divide-y divide-border",
			children: e.routes.map((e) => /* @__PURE__ */ P("li", {
				className: "grid gap-2 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
				children: [/* @__PURE__ */ N(W, { route: e }), /* @__PURE__ */ N(G, { route: e })]
			}, e.id))
		})] })
	});
}
function Te(e) {
	return [
		{
			header: "Route",
			cell: (e) => /* @__PURE__ */ P("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ N("div", {
					className: "truncate font-medium",
					children: e.route ?? `${e.start ?? "?"} → ${e.end ?? "?"}`
				}), /* @__PURE__ */ P("div", {
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
			cell: (e) => /* @__PURE__ */ N("span", { children: e.issuer.name }),
			sortValue: (e) => e.issuer.name
		}] : [],
		{
			header: "Volume",
			align: "right",
			cell: (e) => /* @__PURE__ */ P("span", {
				className: "font-mono tabular-nums",
				children: [w(e.volume), " m³"]
			}),
			sortValue: (e) => e.volume
		},
		{
			header: "Collateral",
			align: "right",
			cell: (e) => /* @__PURE__ */ N("span", {
				className: "font-mono tabular-nums",
				children: C(e.collateral)
			}),
			sortValue: (e) => e.collateral
		},
		{
			header: "Reward",
			align: "right",
			cell: (e) => /* @__PURE__ */ P("div", {
				className: "font-mono tabular-nums",
				children: [C(e.reward), e.expected_reward !== null && Math.abs(e.expected_reward - e.reward) > 1 && /* @__PURE__ */ P("div", {
					className: "text-xs text-subtle",
					children: ["asks ", C(e.expected_reward)]
				})]
			}),
			sortValue: (e) => e.reward
		},
		{
			header: "Status",
			cell: (e) => /* @__PURE__ */ P("div", {
				className: "flex flex-wrap items-center gap-1.5",
				children: [/* @__PURE__ */ N(de, {
					status: e.status,
					label: e.status_label
				}), e.acceptor && /* @__PURE__ */ N("span", {
					className: "text-xs text-subtle",
					children: e.acceptor.name
				})]
			})
		},
		{
			header: "Checks",
			cell: (e) => e.open ? /* @__PURE__ */ N(fe, {
				problems: e.problems,
				compact: !0
			}) : null
		}
	];
}
function Ee() {
	let { data: e, isLoading: t } = D({
		queryKey: ["freight", "me"],
		queryFn: () => y.get(`${Y}/me`)
	});
	return /* @__PURE__ */ P("div", { children: [
		/* @__PURE__ */ N(H, {
			to: $,
			children: "Freight"
		}),
		/* @__PURE__ */ N(d, {
			icon: /* @__PURE__ */ N(I, {}),
			eyebrow: "Freight",
			title: "My contracts",
			description: "Courier contracts your characters made to the freight services."
		}),
		/* @__PURE__ */ N(r, { children: /* @__PURE__ */ N(o, {
			rows: e?.contracts ?? [],
			loading: t,
			rowKey: (e) => e.contract_id,
			columns: Te(!1),
			empty: {
				icon: /* @__PURE__ */ N(I, {}),
				title: "No courier contracts yet"
			}
		}) })
	] });
}
//#endregion
//#region src/public.tsx
var De = "/public/p/freight";
function Oe() {
	let { data: e, isLoading: t } = D({
		queryKey: [
			"freight",
			"public",
			"services"
		],
		queryFn: () => y.get(`${X}/services`)
	});
	return /* @__PURE__ */ P("div", { children: [/* @__PURE__ */ N(d, {
		icon: /* @__PURE__ */ N(I, {}),
		eyebrow: "Freight",
		title: "Ship it with us",
		description: "Pick a route for the reward and the exact courier contract to make."
	}), t ? /* @__PURE__ */ N(m, { className: "h-56" }) : e?.services.length ? /* @__PURE__ */ N("div", {
		className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
		children: e.services.map((e) => /* @__PURE__ */ N(xe, {
			service: e,
			to: `${De}/${e.id}`
		}, e.id))
	}) : /* @__PURE__ */ N(r, { children: /* @__PURE__ */ N(c, {
		icon: /* @__PURE__ */ N(I, {}),
		title: "No public freight services"
	}) })] });
}
function ke() {
	let { id: e } = j(), { data: t, isLoading: n } = D({
		queryKey: [
			"freight",
			"public",
			"service",
			e
		],
		queryFn: () => y.get(`${X}/services/${e}`)
	});
	return n ? /* @__PURE__ */ N(m, { className: "h-96" }) : t ? /* @__PURE__ */ P("div", { children: [
		/* @__PURE__ */ N(H, {
			to: De,
			children: "All services"
		}),
		/* @__PURE__ */ N(d, {
			icon: /* @__PURE__ */ N(I, {}),
			eyebrow: "Freight",
			title: t.name,
			description: t.description || void 0
		}),
		/* @__PURE__ */ N(q, {
			service: t,
			base: X
		}),
		/* @__PURE__ */ N(we, { service: t })
	] }) : /* @__PURE__ */ N(c, {
		icon: /* @__PURE__ */ N(I, {}),
		title: "No such service",
		description: "It may be closed, or no longer public."
	});
}
//#endregion
//#region src/queue.tsx
function Ae() {
	let [e, t] = k("waiting"), [n, i] = k(""), { data: a, isLoading: s } = D({
		queryKey: [
			"freight",
			"queue",
			e,
			n
		],
		queryFn: () => y.get(`${Y}/queue?show=${e}${n ? `&service=${n}` : ""}`),
		refetchInterval: 6e4
	}), c = a?.counts;
	return /* @__PURE__ */ P("div", { children: [
		/* @__PURE__ */ N(H, {
			to: "/p/freight",
			children: "Freight"
		}),
		/* @__PURE__ */ N(d, {
			icon: /* @__PURE__ */ N(I, {}),
			eyebrow: "Freight",
			title: "Hauling queue",
			description: "Courier contracts to the freight services, checked against their routes every 15 minutes."
		}),
		/* @__PURE__ */ P("div", {
			className: "mb-6 grid gap-4 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ N(h, {
					label: "Open rewards",
					value: C(a?.totals.open_reward ?? 0)
				}),
				/* @__PURE__ */ N(h, {
					label: "Open collateral",
					value: C(a?.totals.open_collateral ?? 0)
				}),
				/* @__PURE__ */ N(h, {
					label: "Open volume",
					value: `${w(a?.totals.open_volume ?? 0)} m³`
				})
			]
		}),
		/* @__PURE__ */ P("div", {
			className: "mb-4 flex flex-wrap items-center justify-between gap-3",
			children: [/* @__PURE__ */ N(f, {
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
			}), (a?.services.length ?? 0) > 1 && /* @__PURE__ */ N(p, {
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
		/* @__PURE__ */ N(r, { children: /* @__PURE__ */ N(o, {
			rows: a?.contracts ?? [],
			loading: s,
			rowKey: (e) => e.contract_id,
			columns: Te(!0),
			empty: {
				icon: /* @__PURE__ */ N(I, {}),
				title: "Nothing here",
				description: e === "problems" ? "Every open contract matches its route." : void 0
			}
		}) })
	] });
}
//#endregion
//#region src/index.tsx
var je = S({
	routes: [
		{
			path: "",
			Component: Se
		},
		{
			path: "services/:id",
			Component: Ce
		},
		{
			path: "me",
			Component: Ee
		},
		{
			path: "queue",
			Component: Ae
		},
		{
			path: "manage",
			Component: he
		},
		{
			path: "manage/new",
			Component: Q
		},
		{
			path: "manage/:id",
			Component: Q
		}
	],
	publicRoutes: [{
		path: "",
		Component: Oe
	}, {
		path: ":id",
		Component: ke
	}]
});
//#endregion
export { je as default };

export const classes = ["!isNew","!o","!route","@conduit/sdk","@tanstack/react-query","a","above","accent","acceptor","actions","active","after","against","align","an","and","any","are","aren","aria-label","as","ask","asks","assignee","async","at","await","back","base","base_price","be","bg-danger-soft","bg-surface-2","bg-warning-soft","block","body","boolean","border","border-accent/40","border-border","border-border-strong","border-danger/40","border-warning/40","both_ways","breakdown","but","button","by","calculator","can","can_manage","cargo","cell","character","characters","charged","check","checked","children","className","code","collateral","collateral_percent","color","columns","compact","complete","confirmLabel","const","content","contract","contractColumns","contract_id","contracts","copy","corporation","couldn","count","counted","counts","courier","currentColor","customers","cx","cy","danger","data","date_accepted","date_completed","date_expired","date_issued","day","days_to_complete","decimal","default","definePlugin","deleted","delivered","delivered_reward","delivery","description","disabled","divide-border","divide-y","don","done","e","each","empty","en","enabled","end","end_location_id","end_name","end_system_id","every","exact","expected_reward","expiration_days","expired","export","extends","eyebrow","facts","failed","few","fill","finished","finished_contractor","finished_issuer","flagged","flex","flex-wrap","font-medium","font-mono","font-semibold","footer","for","freight","from","full","function","game","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-6","get","ghost","give","go","grid","grid-cols-[28px_1fr]","group_ids","groups","h-56","h-96","hand","has","hauler","haulers","header","height","here","hint","hover:bg-hover","hover:text-text","hud-label","i","icon","icon-xs","icons","id","ids","if","import","in","in_progress","in_transit","info","inline","inline-flex","inputMode","interface","is","isLoading","isNew","is_corporation","isn","issuer","issuer_corporation","it","items-center","items-start","its","jump","jumps","justify-between","keep","key","keyof","kind","knows","label","leading-none","least","length","lg","limit","line-clamp-2","lives","loading","location_id","login","login_ok","longer","looked","lose","m","m12","m15","m16","m21.73","m8","made","manage","manage/new","managed","managers","match","matches","max","max-h-48","maxLength","max_collateral","max_volume","may","mb-3","mb-4","mb-6","md:grid-cols-2","md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]","me","members","min","min-w-0","min_reward","minimum","minute","ml-2","more","moved","moving","mt-0.5","mt-1","mt-1.5","mt-4","mt-6","mutationFn","n","name","navigate","neutral","new","no","none","not","notification","notify","now","null","number","of","off","offered","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpenChange","onRowClick","onSubmit","onSuccess","one","open","open_collateral","open_reward","open_volume","options","opts","or","out","outstanding","overflow-auto","owner","owner_id","p","p-5","page","pages","panel","path","pays","pct","per","per-jump","place-items-center","placeholder","places","post","price","price_per_jump","price_per_m3","primary","problems","public","publicRoutes","put","px-2","px-3","py-1","py-1.5","py-2","py-3","qc","queryFn","queryKey","queue","quote","r","rate","rates","react","react-router","read","reads","refetchInterval","region","rejected","removeRoute","required","rest","return","reversed","reward","rewards","right","round","route","routeId","route_id","routes","rowKey","rows","run","rx","ry","s","same","save","search","secondary","security","see","sees_queue","select","service","serviceId","services","set","setActive","setBothWays","setCollateral","setDeleting","setDone","setEditing","setEnd","setForm","setJumps","setQ","setRates","setRouteId","setService","setShow","setStart","setVolume","sets","severe","show","shrink-0","signed","site","size","size-3.5","size-4","size-7","sm","sm:grid-cols-2","sm:grid-cols-3","so","solar_system_id","solar_system_name","sortValue","space-y-2","space-y-3","space-y-4","start","start_location_id","start_name","start_system_id","state_ids","states","station","status","status_label","step","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structure","style","submit","subtitle","success","such","sync","system","system_id","system_name","systems","t","tabular-nums","terms","text","text-[34px]","text-accent-ink","text-base","text-danger-fg","text-left","text-muted","text-sm","text-subtle","text-success-fg","text-warning-fg","text-xs","that","the","their","them","they","this","ticked","title","to","toast","tone","totals","tracked","true","truncate","type","typeof","undefined","under","until","up","updates","us","use","useMutation","useParams","useQuery","useQueryClient","useState","used","v","value","variant","viewBox","void","volume","w-56","w-full","waiting","warning","ways","what","which","width","with","withIssuer","without","words","worth","wrong","xl:grid-cols-3","xl:grid-cols-[minmax(0,1fr)_420px]","xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]","xs","yet","your"];
