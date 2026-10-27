import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, Dialog as c, DiscordPings as l, EmptyState as u, Field as d, Input as f, PageHeader as p, Segmented as m, Skeleton as h, Spinner as g, StatCard as _, Switch as v, THead as y, Table as b, Tabs as x, Td as S, Textarea as C, Th as w, Tr as T, api as E, cn as D, date as ee, definePlugin as te, timeAgo as O, toast as k } from "@conduit/sdk";
import { useMutation as A, useQuery as j, useQueryClient as M } from "@tanstack/react-query";
import { Link as N } from "react-router";
import { useEffect as ne, useState as P } from "react";
import { Fragment as F, jsx as I, jsxs as L } from "react/jsx-runtime";
//#region src/icons.tsx
function R({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ I("svg", {
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
var z = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [
		/* @__PURE__ */ I("circle", {
			cx: "8",
			cy: "8",
			r: "6"
		}),
		/* @__PURE__ */ I("path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18" }),
		/* @__PURE__ */ I("path", { d: "M7 6h1v4" }),
		/* @__PURE__ */ I("path", { d: "m16.71 13.88.7.71-2.82 2.82" })
	]
}), B = (e) => /* @__PURE__ */ I(R, {
	...e,
	children: /* @__PURE__ */ I("path", { d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" })
}), V = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [
		/* @__PURE__ */ I("path", { d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" }),
		/* @__PURE__ */ I("path", { d: "M12 22V12" }),
		/* @__PURE__ */ I("path", { d: "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" }),
		/* @__PURE__ */ I("path", { d: "m7.5 4.27 9 5.15" })
	]
}), re = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [
		/* @__PURE__ */ I("path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }),
		/* @__PURE__ */ I("path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }),
		/* @__PURE__ */ I("path", { d: "M4 22h16" }),
		/* @__PURE__ */ I("path", { d: "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" }),
		/* @__PURE__ */ I("path", { d: "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" }),
		/* @__PURE__ */ I("path", { d: "M18 2H6v7a6 6 0 0 0 12 0V2Z" })
	]
}), H = (e) => /* @__PURE__ */ I(R, {
	...e,
	children: /* @__PURE__ */ I("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })
}), ie = (e) => /* @__PURE__ */ I(R, {
	...e,
	children: /* @__PURE__ */ I("path", { d: "M20 6 9 17l-5-5" })
}), U = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [/* @__PURE__ */ I("path", { d: "M18 6 6 18" }), /* @__PURE__ */ I("path", { d: "m6 6 12 12" })]
}), ae = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [/* @__PURE__ */ I("path", { d: "M5 12h14" }), /* @__PURE__ */ I("path", { d: "M12 5v14" })]
}), oe = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [
		/* @__PURE__ */ I("path", { d: "M3 6h18" }),
		/* @__PURE__ */ I("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ I("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), se = (e) => /* @__PURE__ */ I(R, {
	...e,
	children: /* @__PURE__ */ I("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" })
}), W = (e) => /* @__PURE__ */ L(R, {
	...e,
	children: [/* @__PURE__ */ I("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ I("path", { d: "M19 12H5" })]
}), G = {
	pending: {
		label: "Waiting",
		tone: "info"
	},
	fulfilled: {
		label: "Handed over",
		tone: "success"
	},
	cancelled: {
		label: "Cancelled",
		tone: "neutral"
	}
}, ce = {
	referral: "Referral",
	fleet: "Fleet",
	mentor: "Mentoring",
	projects: "Industry project",
	manual: "Awarded by hand",
	order: "Order",
	refund: "Refund"
}, K = "/api/p/store", q = (e) => e.toLocaleString("en");
function J({ value: e, className: t }) {
	return /* @__PURE__ */ L("span", {
		className: D("inline-flex items-center gap-1 font-mono tabular-nums", t),
		children: [/* @__PURE__ */ I(z, { className: "size-3.5 text-accent-ink" }), q(e)]
	});
}
function Y({ status: e }) {
	return /* @__PURE__ */ I(n, {
		tone: G[e].tone,
		children: G[e].label
	});
}
function X({ icon: e, name: t, className: n = "size-10" }) {
	return e ? /* @__PURE__ */ I("img", {
		src: e,
		alt: "",
		title: t,
		className: D("shrink-0 border border-border bg-surface-2", n),
		loading: "lazy"
	}) : /* @__PURE__ */ I("div", {
		className: D("grid shrink-0 place-items-center border border-border-strong text-accent-ink", n),
		children: /* @__PURE__ */ I(V, { className: "size-1/2" })
	});
}
function Z({ url: e, value: n, onChange: r, placeholder: i, empty: a, render: o }) {
	let [s, c] = P(""), [l, u] = P(""), [d, p] = P(!1), [m, h] = P(0);
	ne(() => {
		let e = setTimeout(() => u(s.trim()), 250);
		return () => clearTimeout(e);
	}, [s]);
	let { data: _, isLoading: v } = j({
		queryKey: [
			"store",
			"pick",
			e,
			l
		],
		queryFn: () => E.get(`${e}?q=${encodeURIComponent(l)}`),
		enabled: l.length >= 2
	}), y = _ ?? [], b = (e) => {
		r(e), c(""), p(!1);
	}, x = (e, n) => e.portrait === void 0 ? /* @__PURE__ */ I(X, {
		icon: e.icon ?? null,
		name: e.name,
		className: n === "xs" ? "size-6" : "size-8"
	}) : /* @__PURE__ */ I(t, {
		src: e.portrait,
		name: e.name,
		size: n
	});
	return n ? /* @__PURE__ */ L("div", {
		className: "inline-flex max-w-full items-center gap-2 border border-border bg-surface-2/60 py-1 pl-1 pr-1.5 text-sm",
		children: [
			x(n, "sm"),
			/* @__PURE__ */ I("span", {
				className: "truncate font-medium",
				children: o ? o(n) : n.name
			}),
			/* @__PURE__ */ I("button", {
				type: "button",
				onClick: () => r(null),
				className: "p-0.5 text-subtle hover:text-text",
				"aria-label": `Remove ${n.name}`,
				children: /* @__PURE__ */ I(U, { className: "size-3.5" })
			})
		]
	}) : /* @__PURE__ */ L("div", {
		className: "relative",
		children: [/* @__PURE__ */ I(f, {
			value: s,
			onChange: (e) => {
				c(e.target.value), p(!0), h(0);
			},
			onFocus: () => p(!0),
			onBlur: () => p(!1),
			onKeyDown: (e) => {
				if (y.length) {
					if (e.key === "ArrowDown") h((e) => (e + 1) % y.length);
					else if (e.key === "ArrowUp") h((e) => (e - 1 + y.length) % y.length);
					else if (e.key === "Enter") b(y[Math.min(m, y.length - 1)]);
					else return;
					e.preventDefault();
				}
			},
			placeholder: i,
			autoComplete: "off",
			role: "combobox",
			"aria-expanded": d && l.length >= 2
		}), d && l.length >= 2 && /* @__PURE__ */ I("div", {
			className: "absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto border border-border-strong bg-surface-raised p-1 shadow-e3",
			role: "listbox",
			children: v ? /* @__PURE__ */ I(g, { className: "px-2 py-1.5" }) : y.length === 0 ? /* @__PURE__ */ I("div", {
				className: "px-2 py-1.5 text-xs text-subtle",
				children: a
			}) : y.map((e, t) => /* @__PURE__ */ L("button", {
				type: "button",
				role: "option",
				"aria-selected": t === m,
				onMouseDown: (t) => {
					t.preventDefault(), b(e);
				},
				onMouseEnter: () => h(t),
				className: D("flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm", t === m && "bg-hover"),
				children: [
					x(e, "xs"),
					/* @__PURE__ */ I("span", {
						className: "flex-1 truncate",
						children: e.name
					}),
					e.subtitle && /* @__PURE__ */ I("span", {
						className: "truncate text-xs text-subtle",
						children: e.subtitle
					})
				]
			}, e.id))
		})]
	});
}
//#endregion
//#region src/manage.tsx
var Q = ["store", "manage"];
function le() {
	let { data: e, isLoading: t } = j({
		queryKey: Q,
		queryFn: () => E.get(`${K}/manage`)
	});
	return /* @__PURE__ */ L(F, { children: [
		/* @__PURE__ */ L(N, {
			to: "/p/store",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ I(W, {}), " Store"]
		}),
		/* @__PURE__ */ I(p, {
			eyebrow: "Corp Store",
			title: "Manage the store",
			icon: /* @__PURE__ */ I(H, {}),
			description: "What's for sale, how members earn points, and points given by hand."
		}),
		t || !e ? /* @__PURE__ */ I(h, { className: "h-64" }) : /* @__PURE__ */ L("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_420px]",
			children: [/* @__PURE__ */ I(de, { items: e.items }), /* @__PURE__ */ L("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ I(he, { settings: e.settings }),
					/* @__PURE__ */ I(ge, { awards: e.awards }),
					/* @__PURE__ */ I(l, { plugin: "store" })
				]
			})]
		})
	] });
}
var ue = {
	name: "",
	description: "",
	type_id: null,
	type_name: null,
	icon: null,
	price: 100,
	stock: null,
	per_member_limit: null,
	active: !0,
	order: 0
};
function de({ items: e }) {
	let t = M(), [a, c] = P(null), [l, d] = P(null);
	return /* @__PURE__ */ L(i, {
		className: "self-start",
		children: [
			/* @__PURE__ */ I(o, {
				title: "Items",
				description: "Hidden items stay on past orders but can't be bought.",
				actions: /* @__PURE__ */ L(r, {
					variant: "primary",
					size: "sm",
					onClick: () => c({ ...ue }),
					children: [/* @__PURE__ */ I(ae, {}), " Add item"]
				})
			}),
			e.length === 0 ? /* @__PURE__ */ I(u, {
				icon: /* @__PURE__ */ I(V, {}),
				title: "No items yet",
				description: "Add ships, modules, PLEX, ISK or anything else you'll hand over."
			}) : /* @__PURE__ */ I("ul", {
				className: "divide-y divide-border",
				children: e.map((e) => /* @__PURE__ */ L("li", {
					className: "flex items-center gap-3 px-card py-3 text-sm",
					children: [
						/* @__PURE__ */ I(X, {
							icon: e.icon,
							name: e.name,
							className: "size-9"
						}),
						/* @__PURE__ */ L("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ L("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ I("span", {
									className: "font-medium",
									children: e.name
								}), !e.active && /* @__PURE__ */ I(n, {
									tone: "neutral",
									children: "hidden"
								})]
							}), /* @__PURE__ */ I("div", {
								className: "text-xs text-muted",
								children: [e.stock == null ? "unlimited" : `${e.stock} in stock`, e.per_member_limit != null && `${e.per_member_limit} per member`].filter(Boolean).join(" · ")
							})]
						}),
						/* @__PURE__ */ I(J, {
							value: e.price,
							className: "text-xs"
						}),
						/* @__PURE__ */ I(r, {
							size: "sm",
							variant: "ghost",
							onClick: () => c({ ...e }),
							"aria-label": `Edit ${e.name}`,
							children: /* @__PURE__ */ I(se, {})
						}),
						/* @__PURE__ */ I(r, {
							size: "sm",
							variant: "ghost",
							onClick: () => d(e),
							"aria-label": `Delete ${e.name}`,
							children: /* @__PURE__ */ I(oe, {})
						})
					]
				}, e.id))
			}),
			a && /* @__PURE__ */ I(fe, {
				draft: a,
				onClose: () => c(null)
			}),
			/* @__PURE__ */ I(s, {
				open: !!l,
				onOpenChange: (e) => !e && d(null),
				title: `Delete ${l?.name}?`,
				description: "Only items nobody has ordered can be deleted; hide the others.",
				danger: !0,
				confirmLabel: "Delete",
				onConfirm: () => E.delete(`${K}/items/${l.id}`).then(() => t.invalidateQueries({ queryKey: ["store"] }), (e) => k.error(e.message))
			})
		]
	});
}
var $ = (e) => e.trim() === "" ? null : Math.max(0, Math.floor(Number(e)) || 0);
function fe({ draft: e, onClose: t }) {
	let n = M(), [i, a] = P(e), o = (e) => a((t) => ({
		...t,
		...e
	})), s = i.type_id ? {
		id: i.type_id,
		name: i.type_name ?? `Type ${i.type_id}`,
		icon: i.icon
	} : null, l = A({
		mutationFn: () => i.id ? E.put(`${K}/items/${i.id}`, i) : E.post(`${K}/items`, i),
		onSuccess: () => {
			k.success("Saved"), n.invalidateQueries({ queryKey: ["store"] }), t();
		},
		onError: (e) => k.error(e.message)
	});
	return /* @__PURE__ */ I(c, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: i.id ? `Edit ${e.name}` : "Add an item",
		size: "lg",
		footer: /* @__PURE__ */ L(F, { children: [/* @__PURE__ */ I(r, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), /* @__PURE__ */ I(r, {
			variant: "primary",
			loading: l.isPending,
			disabled: !i.name.trim() || i.price < 1,
			onClick: () => l.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ L("div", {
			className: "grid gap-4 sm:grid-cols-2",
			children: [
				/* @__PURE__ */ L("div", {
					className: "space-y-1.5 sm:col-span-2",
					children: [/* @__PURE__ */ L("span", {
						className: "block text-[13px] font-medium",
						children: ["EVE item ", /* @__PURE__ */ I("span", {
							className: "font-normal text-subtle",
							children: "(optional, for its picture)"
						})]
					}), /* @__PURE__ */ I(Z, {
						url: `${K}/types`,
						value: s,
						onChange: (e) => o(e ? {
							type_id: e.id,
							type_name: e.name,
							icon: e.icon,
							name: i.name.trim() ? i.name : e.name
						} : {
							type_id: null,
							type_name: null,
							icon: null
						}),
						placeholder: "Ferox, PLEX, Large Shield Extender II…",
						empty: "No item by that name."
					})]
				}),
				/* @__PURE__ */ I(d, {
					label: "Name",
					required: !0,
					className: "sm:col-span-2",
					children: /* @__PURE__ */ I(f, {
						value: i.name,
						onChange: (e) => o({ name: e.target.value }),
						maxLength: 100
					})
				}),
				/* @__PURE__ */ I(d, {
					label: "Description",
					className: "sm:col-span-2",
					hint: "E.g. fitted to doctrine, delivered in staging.",
					children: /* @__PURE__ */ I(C, {
						rows: 3,
						value: i.description,
						onChange: (e) => o({ description: e.target.value })
					})
				}),
				/* @__PURE__ */ I(d, {
					label: "Price in points",
					required: !0,
					children: /* @__PURE__ */ I(f, {
						type: "number",
						min: 1,
						value: i.price,
						onChange: (e) => o({ price: Math.max(0, Math.floor(Number(e.target.value)) || 0) })
					})
				}),
				/* @__PURE__ */ I(d, {
					label: "Sort order",
					hint: "Lower comes first.",
					children: /* @__PURE__ */ I(f, {
						type: "number",
						value: i.order,
						onChange: (e) => o({ order: Math.floor(Number(e.target.value)) || 0 })
					})
				}),
				/* @__PURE__ */ I(d, {
					label: "In stock",
					hint: "Empty: unlimited.",
					children: /* @__PURE__ */ I(f, {
						type: "number",
						min: 0,
						value: i.stock ?? "",
						onChange: (e) => o({ stock: $(e.target.value) })
					})
				}),
				/* @__PURE__ */ I(d, {
					label: "Limit per member",
					hint: "Empty: no limit.",
					children: /* @__PURE__ */ I(f, {
						type: "number",
						min: 1,
						value: i.per_member_limit ?? "",
						onChange: (e) => o({ per_member_limit: $(e.target.value) })
					})
				}),
				/* @__PURE__ */ L("label", {
					className: "inline-flex items-center gap-2 text-sm sm:col-span-2",
					children: [/* @__PURE__ */ I(v, {
						checked: i.active,
						onCheckedChange: (e) => o({ active: e })
					}), i.active ? "For sale" : "Hidden"]
				})
			]
		})
	});
}
var pe = [
	{
		key: "referral_points",
		plugin: "recruit",
		name: "Recruitment",
		label: "Referral",
		hint: "To the member a recruit named as their referrer, when the recruit is accepted."
	},
	{
		key: "fleet_points",
		plugin: "fleets",
		name: "Fleets",
		label: "Fleet",
		hint: "To each member with a FAT, once per fleet however many characters they brought, when the fleet ends."
	},
	{
		key: "mentor_points",
		plugin: "mentors",
		name: "Mentoring",
		label: "Mentee graduated",
		hint: "To the mentor, when their mentee graduates."
	}
];
function me({ state: e, name: t }) {
	return e.enabled ? null : /* @__PURE__ */ I(n, {
		tone: "warning",
		children: e.installed ? `${t} is switched off` : `needs ${t}`
	});
}
function he({ settings: e }) {
	let t = M(), [n, s] = P(e), c = A({
		mutationFn: () => E.put(`${K}/settings`, n),
		onSuccess: (e) => {
			t.setQueryData(Q, (t) => t && {
				...t,
				settings: e
			}), k.success("Saved");
		},
		onError: (e) => k.error(e.message)
	});
	return /* @__PURE__ */ L(i, { children: [/* @__PURE__ */ I(o, {
		title: "Earning points",
		description: "Points members get automatically. 0 switches one off."
	}), /* @__PURE__ */ L(a, {
		className: "space-y-4",
		children: [
			pe.map((t) => /* @__PURE__ */ L("div", {
				className: "grid grid-cols-[1fr_96px] items-start gap-3",
				children: [/* @__PURE__ */ L("div", { children: [/* @__PURE__ */ L("div", {
					className: "flex flex-wrap items-center gap-2 text-sm font-medium",
					children: [
						t.label,
						" ",
						/* @__PURE__ */ I(me, {
							state: e.sources[t.plugin],
							name: t.name
						})
					]
				}), /* @__PURE__ */ I("p", {
					className: "text-xs text-muted",
					children: t.hint
				})] }), /* @__PURE__ */ I(f, {
					type: "number",
					min: 0,
					"aria-label": `Points: ${t.label}`,
					value: n[t.key],
					onChange: (e) => s({
						...n,
						[t.key]: Math.max(0, Math.floor(Number(e.target.value)) || 0)
					})
				})]
			}, t.key)),
			/* @__PURE__ */ L("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ L("div", { children: [/* @__PURE__ */ L("div", {
					className: "flex flex-wrap items-center gap-2 text-sm font-medium",
					children: ["Industry projects ", /* @__PURE__ */ I(me, {
						state: e.sources.projects,
						name: "Industry Projects"
					})]
				}), /* @__PURE__ */ I("p", {
					className: "text-xs text-muted",
					children: "Each project sets its own points per delivery."
				})] }), /* @__PURE__ */ I(v, {
					checked: n.projects_enabled,
					onCheckedChange: (e) => s({
						...n,
						projects_enabled: e
					}),
					"aria-label": "Points from industry projects"
				})]
			}),
			/* @__PURE__ */ I("div", {
				className: "flex justify-end border-t border-border pt-4",
				children: /* @__PURE__ */ I(r, {
					variant: "primary",
					loading: c.isPending,
					onClick: () => c.mutate(),
					children: "Save"
				})
			})
		]
	})] });
}
function ge({ awards: n }) {
	let s = M(), [c, l] = P(null), [u, p] = P(""), [m, h] = P(""), g = Math.trunc(Number(u)) || 0, _ = A({
		mutationFn: () => E.post(`${K}/awards`, {
			user_id: c.id,
			points: g,
			reason: m
		}),
		onSuccess: ({ awards: e }) => {
			k.success(g > 0 ? `Gave ${c.name} ${g.toLocaleString("en")} points` : `Took ${(-g).toLocaleString("en")} points from ${c.name}`), s.setQueryData(Q, (t) => t && {
				...t,
				awards: e
			}), s.invalidateQueries({ queryKey: ["store", "me"] }), l(null), p(""), h("");
		},
		onError: (e) => k.error(e.message)
	});
	return /* @__PURE__ */ L(i, { children: [
		/* @__PURE__ */ I(o, {
			title: "Give or take points",
			description: "For anything the automatic sources don't cover. The member is told why; it's in the audit log."
		}),
		/* @__PURE__ */ L(a, {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ L("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ I("span", {
						className: "block text-[13px] font-medium",
						children: "Member"
					}), /* @__PURE__ */ I(Z, {
						url: `${K}/members`,
						value: c,
						onChange: l,
						placeholder: "Main character name",
						empty: "No member by that name."
					})]
				}),
				/* @__PURE__ */ I(d, {
					label: "Points",
					hint: "Negative takes points away.",
					children: /* @__PURE__ */ I(f, {
						type: "number",
						value: u,
						onChange: (e) => p(e.target.value),
						className: "w-32"
					})
				}),
				/* @__PURE__ */ I(d, {
					label: "What for",
					required: !0,
					children: /* @__PURE__ */ I(f, {
						value: m,
						onChange: (e) => h(e.target.value),
						maxLength: 300,
						placeholder: "Scouted the whole Sunday op"
					})
				}),
				g < 0 && /* @__PURE__ */ I(e, {
					tone: "warning",
					children: "This takes points away; their balance can go below zero."
				}),
				/* @__PURE__ */ I("div", {
					className: "flex justify-end",
					children: /* @__PURE__ */ L(r, {
						variant: "primary",
						loading: _.isPending,
						disabled: !c || !g || !m.trim(),
						onClick: () => _.mutate(),
						children: [
							/* @__PURE__ */ I(z, {}),
							" ",
							g < 0 ? "Take points" : "Give points"
						]
					})
				})
			]
		}),
		n.length > 0 && /* @__PURE__ */ I("ul", {
			className: "divide-y divide-border border-t border-border",
			children: n.slice(0, 10).map((e) => /* @__PURE__ */ L("li", {
				className: "flex items-center gap-3 px-card py-2.5 text-sm",
				children: [
					/* @__PURE__ */ I(t, {
						src: e.user.portrait,
						name: e.user.name,
						size: "xs"
					}),
					/* @__PURE__ */ L("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ L("div", {
							className: "truncate",
							children: [
								/* @__PURE__ */ I("span", {
									className: "font-medium",
									children: e.user.name
								}),
								" ",
								/* @__PURE__ */ L("span", {
									className: "text-muted",
									children: ["· ", e.reason]
								})
							]
						}), /* @__PURE__ */ L("div", {
							className: "text-xs text-subtle",
							children: [
								e.by,
								" · ",
								O(e.created_at)
							]
						})]
					}),
					/* @__PURE__ */ L("span", {
						className: e.points > 0 ? "font-mono text-xs text-success-fg" : "font-mono text-xs text-danger-fg",
						children: [e.points > 0 ? "+" : "", e.points.toLocaleString("en")]
					})
				]
			}, e.id))
		})
	] });
}
//#endregion
//#region src/mine.tsx
function _e() {
	let e = M(), { data: t, isLoading: a } = j({
		queryKey: ["store", "history"],
		queryFn: () => E.get(`${K}/me/history`)
	}), [c, l] = P(null);
	return /* @__PURE__ */ L(F, { children: [
		/* @__PURE__ */ L(N, {
			to: "/p/store",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ I(W, {}), " Store"]
		}),
		/* @__PURE__ */ I(p, {
			eyebrow: "Corp Store",
			title: "My points",
			icon: /* @__PURE__ */ I(B, {}),
			description: "What you earned, what you spent, and your orders.",
			actions: t ? /* @__PURE__ */ I("span", {
				className: "text-2xl font-semibold",
				children: /* @__PURE__ */ I(J, { value: t.balance })
			}) : void 0
		}),
		a || !t ? /* @__PURE__ */ I(h, { className: "h-64" }) : /* @__PURE__ */ L("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ L(i, { children: [/* @__PURE__ */ I(o, { title: "Orders" }), t.orders.length === 0 ? /* @__PURE__ */ I(u, {
				icon: /* @__PURE__ */ I(V, {}),
				title: "No orders yet",
				description: /* @__PURE__ */ L(F, { children: [
					"Spend your points in the ",
					/* @__PURE__ */ I(N, {
						to: "/p/store",
						className: "underline",
						children: "store"
					}),
					"."
				] })
			}) : /* @__PURE__ */ I("ul", {
				className: "divide-y divide-border",
				children: t.orders.map((e) => /* @__PURE__ */ L("li", {
					className: "flex flex-wrap items-center gap-3 px-card py-3 text-sm",
					children: [
						/* @__PURE__ */ I(X, {
							icon: e.item.icon,
							name: e.item.name,
							className: "size-8"
						}),
						/* @__PURE__ */ L("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ L("div", {
									className: "font-medium",
									children: [
										e.quantity,
										" × ",
										e.item.name
									]
								}),
								/* @__PURE__ */ L("div", {
									className: "text-xs text-muted",
									children: [
										"Ordered ",
										ee(e.created_at),
										e.handled_by && e.handled_at && ` · ${e.status === "fulfilled" ? "handed over" : "cancelled"} by ${e.handled_by} ${O(e.handled_at)}`
									]
								}),
								e.note && /* @__PURE__ */ L("p", {
									className: "mt-1 whitespace-pre-line text-xs italic text-muted",
									children: [
										"“",
										e.note,
										"”"
									]
								})
							]
						}),
						/* @__PURE__ */ I(J, {
							value: e.points,
							className: "text-xs"
						}),
						/* @__PURE__ */ I(Y, { status: e.status }),
						e.status === "pending" && /* @__PURE__ */ I(r, {
							size: "sm",
							variant: "ghost",
							className: "text-danger-fg",
							onClick: () => l(e),
							children: "Cancel"
						})
					]
				}, e.id))
			})] }), /* @__PURE__ */ L(i, { children: [/* @__PURE__ */ I(o, {
				title: "Points",
				description: "Newest first."
			}), t.entries.length === 0 ? /* @__PURE__ */ I(u, {
				icon: /* @__PURE__ */ I(B, {}),
				title: "No points yet",
				description: "Refer a recruit, fly in fleets, mentor a new member or deliver to an industry project."
			}) : /* @__PURE__ */ L(b, { children: [/* @__PURE__ */ I(y, { children: /* @__PURE__ */ L("tr", { children: [
				/* @__PURE__ */ I(w, { children: "What for" }),
				/* @__PURE__ */ I(w, { children: "From" }),
				/* @__PURE__ */ I(w, {
					align: "right",
					children: "Points"
				}),
				/* @__PURE__ */ I(w, {
					align: "right",
					children: "When"
				})
			] }) }), /* @__PURE__ */ I("tbody", { children: t.entries.map((e) => /* @__PURE__ */ L(T, { children: [
				/* @__PURE__ */ L(S, { children: [e.reason, e.by && e.source === "manual" && /* @__PURE__ */ L("span", {
					className: "text-xs text-subtle",
					children: [" · ", e.by]
				})] }),
				/* @__PURE__ */ I(S, { children: /* @__PURE__ */ I(n, {
					tone: "neutral",
					children: ce[e.source]
				}) }),
				/* @__PURE__ */ L(S, {
					align: "right",
					className: e.points > 0 ? "font-mono text-success-fg" : "font-mono text-muted",
					children: [e.points > 0 ? "+" : "", e.points.toLocaleString("en")]
				}),
				/* @__PURE__ */ I(S, {
					align: "right",
					className: "text-xs text-muted",
					children: O(e.created_at)
				})
			] }, e.id)) })] })] })]
		}),
		/* @__PURE__ */ I(s, {
			open: !!c,
			onOpenChange: (e) => !e && l(null),
			title: "Cancel this order?",
			description: c ? `You get your ${c.points.toLocaleString("en")} points back.` : void 0,
			danger: !0,
			confirmLabel: "Cancel order",
			cancelLabel: "Keep it",
			onConfirm: () => E.post(`${K}/orders/${c.id}/cancel`, {}).then(() => {
				k.success("Cancelled. Your points are back."), e.invalidateQueries({ queryKey: ["store"] });
			}, (e) => k.error(e.message))
		})
	] });
}
//#endregion
//#region src/orders.tsx
function ve() {
	let [e, n] = P("pending"), [a, o] = P(null), { data: s, isLoading: c } = j({
		queryKey: [
			"store",
			"orders",
			e
		],
		queryFn: () => E.get(`${K}/orders?status=${e}`),
		refetchInterval: 6e4
	});
	return /* @__PURE__ */ L(F, { children: [
		/* @__PURE__ */ L(N, {
			to: "/p/store",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
			children: [/* @__PURE__ */ I(W, {}), " Store"]
		}),
		/* @__PURE__ */ I(p, {
			eyebrow: "Corp Store",
			title: "Orders",
			icon: /* @__PURE__ */ I(V, {}),
			description: "Hand each order over in game (contract or hangar), then mark it done. The member gets a notification."
		}),
		/* @__PURE__ */ L(i, { children: [/* @__PURE__ */ I(x, {
			value: e,
			onValueChange: (e) => n(e),
			listClassName: "px-card",
			items: [
				{
					value: "pending",
					label: "Waiting",
					count: s?.counts.pending
				},
				{
					value: "fulfilled",
					label: "Handed over",
					count: s?.counts.fulfilled
				},
				{
					value: "cancelled",
					label: "Cancelled",
					count: s?.counts.cancelled
				}
			]
		}), c || !s ? /* @__PURE__ */ I("div", {
			className: "p-card",
			children: /* @__PURE__ */ I(h, { className: "h-40" })
		}) : s.items.length === 0 ? /* @__PURE__ */ I(u, {
			icon: /* @__PURE__ */ I(V, {}),
			title: e === "pending" ? "Nothing waiting" : "Nothing here",
			description: e === "pending" ? "New orders show up here, and you get a notification." : void 0
		}) : /* @__PURE__ */ L(b, { children: [/* @__PURE__ */ I(y, { children: /* @__PURE__ */ L("tr", { children: [
			/* @__PURE__ */ I(w, { children: "Member" }),
			/* @__PURE__ */ I(w, { children: "Order" }),
			/* @__PURE__ */ I(w, {
				align: "right",
				children: "Points"
			}),
			/* @__PURE__ */ I(w, { children: e === "pending" ? "Ordered" : "Status" }),
			e === "pending" && /* @__PURE__ */ I(w, {
				align: "right",
				children: " "
			})
		] }) }), /* @__PURE__ */ I("tbody", { children: s.items.map((n) => /* @__PURE__ */ L(T, { children: [
			/* @__PURE__ */ I(S, { children: /* @__PURE__ */ L("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ I(t, {
					src: n.user.portrait,
					name: n.user.name,
					size: "sm"
				}), /* @__PURE__ */ I("span", {
					className: "font-medium",
					children: n.user.name
				})]
			}) }),
			/* @__PURE__ */ L(S, { children: [/* @__PURE__ */ L("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ I(X, {
					icon: n.item.icon,
					name: n.item.name,
					className: "size-7"
				}), /* @__PURE__ */ L("span", { children: [
					n.quantity,
					" × ",
					n.item.name
				] })]
			}), n.note && /* @__PURE__ */ L("div", {
				className: "mt-1 text-xs italic text-muted",
				children: [
					"“",
					n.note,
					"”"
				]
			})] }),
			/* @__PURE__ */ I(S, {
				align: "right",
				children: /* @__PURE__ */ I(J, {
					value: n.points,
					className: "text-xs"
				})
			}),
			/* @__PURE__ */ I(S, {
				className: "text-xs text-muted",
				children: e === "pending" ? O(n.created_at) : /* @__PURE__ */ L("span", {
					className: "inline-flex items-center gap-2",
					children: [
						/* @__PURE__ */ I(Y, { status: n.status }),
						" ",
						n.handled_by,
						" ",
						n.handled_at && O(n.handled_at)
					]
				})
			}),
			e === "pending" && /* @__PURE__ */ I(S, {
				align: "right",
				children: /* @__PURE__ */ L("div", {
					className: "flex justify-end gap-1.5",
					children: [/* @__PURE__ */ L(r, {
						size: "sm",
						variant: "success",
						onClick: () => o({
							order: n,
							cancel: !1
						}),
						children: [/* @__PURE__ */ I(ie, {}), " Handed over"]
					}), /* @__PURE__ */ I(r, {
						size: "sm",
						variant: "ghost",
						onClick: () => o({
							order: n,
							cancel: !0
						}),
						"aria-label": "Cancel order",
						children: /* @__PURE__ */ I(U, {})
					})]
				})
			})
		] }, n.id)) })] })] }),
		a && /* @__PURE__ */ I(ye, {
			order: a.order,
			cancel: a.cancel,
			onClose: () => o(null)
		})
	] });
}
function ye({ order: e, cancel: t, onClose: n }) {
	let i = M(), [a, o] = P(""), s = A({
		mutationFn: () => E.post(`${K}/orders/${e.id}/${t ? "cancel" : "fulfil"}`, { note: a }),
		onSuccess: () => {
			k.success(t ? "Cancelled; the points went back" : "Marked as handed over"), i.invalidateQueries({ queryKey: ["store"] }), n();
		},
		onError: (e) => k.error(e.message)
	});
	return /* @__PURE__ */ I(c, {
		open: !0,
		onOpenChange: (e) => !e && n(),
		title: t ? "Cancel this order?" : "Handed over?",
		description: `${e.user.name}: ${e.quantity} × ${e.item.name}. ${t ? `They get ${e.points.toLocaleString("en")} points back.` : ""}`,
		footer: /* @__PURE__ */ L(F, { children: [/* @__PURE__ */ I(r, {
			variant: "ghost",
			onClick: n,
			children: "Back"
		}), /* @__PURE__ */ I(r, {
			variant: t ? "solidDanger" : "primary",
			loading: s.isPending,
			disabled: t && !a.trim(),
			onClick: () => s.mutate(),
			children: t ? "Cancel order" : "Mark handed over"
		})] }),
		children: /* @__PURE__ */ I(d, {
			label: t ? "Why (the member sees it)" : "Note to the member (optional)",
			required: t,
			children: /* @__PURE__ */ I(C, {
				rows: 3,
				value: a,
				onChange: (e) => o(e.target.value),
				placeholder: t ? "Out of stock until next week…" : "Contracted to you in Jita 4-4"
			})
		})
	});
}
//#endregion
//#region src/store.tsx
var be = ["store", "me"];
function xe() {
	let { data: e, isLoading: t } = j({
		queryKey: be,
		queryFn: () => E.get(`${K}/me`)
	}), [a, o] = P(null);
	return t || !e ? /* @__PURE__ */ I(h, { className: "h-64" }) : /* @__PURE__ */ L(F, { children: [
		/* @__PURE__ */ I(p, {
			eyebrow: "Corp Store",
			title: "Corp Store",
			icon: /* @__PURE__ */ I(z, {}),
			description: "Earn points by recruiting, flying in fleets, mentoring and building for the corp, then spend them here. An officer hands over what you buy.",
			actions: /* @__PURE__ */ L("div", {
				className: "flex flex-wrap gap-2",
				children: [e.can_fulfil && /* @__PURE__ */ I(N, {
					to: "/p/store/orders",
					children: /* @__PURE__ */ L(r, {
						variant: "ghost",
						children: [
							/* @__PURE__ */ I(V, {}),
							" Orders ",
							e.pending ? /* @__PURE__ */ I(n, {
								tone: "info",
								children: e.pending
							}) : null
						]
					})
				}), e.can_manage && /* @__PURE__ */ I(N, {
					to: "/p/store/manage",
					children: /* @__PURE__ */ L(r, {
						variant: "ghost",
						children: [/* @__PURE__ */ I(H, {}), " Manage"]
					})
				})]
			})
		}),
		/* @__PURE__ */ L("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_340px]",
			children: [/* @__PURE__ */ L("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ L("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ I(_, {
						label: "Your points",
						value: q(e.balance),
						mono: !0,
						icon: /* @__PURE__ */ I(z, {}),
						hint: /* @__PURE__ */ I(N, {
							to: "/p/store/me",
							className: "hover:underline",
							children: "History and orders"
						})
					}), /* @__PURE__ */ I(_, {
						label: "For sale",
						value: e.items.length,
						icon: /* @__PURE__ */ I(V, {}),
						hint: e.items.length === 1 ? "item" : "items"
					})]
				}), e.items.length === 0 ? /* @__PURE__ */ I(i, { children: /* @__PURE__ */ I(u, {
					icon: /* @__PURE__ */ I(V, {}),
					title: "Nothing for sale yet",
					description: "Officers add items here. Keep earning points in the meantime."
				}) }) : /* @__PURE__ */ I("div", {
					className: "grid gap-4 md:grid-cols-2",
					children: e.items.map((t) => /* @__PURE__ */ I(Ce, {
						item: t,
						balance: e.balance,
						onBuy: () => o(t)
					}, t.id))
				})]
			}), /* @__PURE__ */ I(Te, { board: e.leaderboard })]
		}),
		a && /* @__PURE__ */ I(we, {
			item: a,
			balance: e.balance,
			onClose: () => o(null)
		})
	] });
}
function Se(e) {
	let t = e.per_member_limit == null ? null : e.per_member_limit - (e.bought ?? 0);
	return e.stock == null ? t : t == null ? e.stock : Math.min(e.stock, t);
}
function Ce({ item: e, balance: t, onBuy: n }) {
	let o = Se(e), s = e.stock === 0, c = !s && o === 0;
	return /* @__PURE__ */ I(i, {
		className: "flex flex-col",
		children: /* @__PURE__ */ L(a, {
			className: "flex flex-1 flex-col gap-3",
			children: [
				/* @__PURE__ */ L("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ I(X, {
						icon: e.icon,
						name: e.name,
						className: "size-12"
					}), /* @__PURE__ */ L("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ I("div", {
							className: "font-medium",
							children: e.name
						}), /* @__PURE__ */ I(J, {
							value: e.price,
							className: "text-sm"
						})]
					})]
				}),
				e.description && /* @__PURE__ */ I("p", {
					className: "whitespace-pre-line text-sm text-muted",
					children: e.description
				}),
				/* @__PURE__ */ L("div", {
					className: "mt-auto flex items-center justify-between gap-3 pt-1",
					children: [/* @__PURE__ */ I("span", {
						className: "text-xs text-subtle",
						children: [e.stock != null && (s ? "Sold out" : `${e.stock} left`), e.per_member_limit != null && `${e.bought ?? 0} of ${e.per_member_limit} per member`].filter(Boolean).join(" · ")
					}), /* @__PURE__ */ I(r, {
						size: "sm",
						variant: "primary",
						disabled: s || c || t < e.price,
						onClick: n,
						children: s ? "Sold out" : c ? "Limit reached" : t < e.price ? `Need ${q(e.price - t)} more` : "Buy"
					})]
				})
			]
		})
	});
}
function we({ item: e, balance: t, onClose: n }) {
	let i = M(), [a, o] = P(1), s = Math.max(1, Math.min(Se(e) ?? 1e3, Math.floor(t / e.price) || 1)), l = e.price * a, u = A({
		mutationFn: () => E.post(`${K}/orders`, {
			item_id: e.id,
			quantity: a
		}),
		onSuccess: () => {
			k.success("Ordered. An officer will hand it over and you'll get a notification."), i.invalidateQueries({ queryKey: ["store"] }), n();
		},
		onError: (e) => k.error(e.message)
	});
	return /* @__PURE__ */ I(c, {
		open: !0,
		onOpenChange: (e) => !e && n(),
		title: `Buy ${e.name}`,
		description: "The points are taken now. You can cancel and get them back until an officer hands it over.",
		footer: /* @__PURE__ */ L(F, { children: [/* @__PURE__ */ I(r, {
			variant: "ghost",
			onClick: n,
			children: "Cancel"
		}), /* @__PURE__ */ L(r, {
			variant: "primary",
			loading: u.isPending,
			disabled: l > t || a < 1,
			onClick: () => u.mutate(),
			children: [
				"Buy for ",
				q(l),
				" points"
			]
		})] }),
		children: /* @__PURE__ */ L("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ I(d, {
				label: "How many",
				hint: `Up to ${s}`,
				children: /* @__PURE__ */ I(f, {
					type: "number",
					min: 1,
					max: s,
					value: a,
					onChange: (e) => o(Math.max(1, Math.min(s, Number(e.target.value) || 1))),
					className: "w-28"
				})
			}), /* @__PURE__ */ L("div", {
				className: "flex justify-between border-t border-border pt-3 text-sm",
				children: [/* @__PURE__ */ I("span", {
					className: "text-muted",
					children: "Left afterwards"
				}), /* @__PURE__ */ I(J, { value: t - l })]
			})]
		})
	});
}
function Te({ board: e }) {
	let [n, r] = P("month"), s = e[n];
	return /* @__PURE__ */ L(i, {
		className: "self-start",
		children: [/* @__PURE__ */ I(o, {
			title: /* @__PURE__ */ L("span", {
				className: "inline-flex items-center gap-2",
				children: [/* @__PURE__ */ I(re, { className: "size-4 text-accent-ink" }), " Points earned"]
			}),
			actions: /* @__PURE__ */ I(m, {
				size: "sm",
				value: n,
				onChange: r,
				"aria-label": "Period",
				options: [{
					value: "month",
					label: "This month"
				}, {
					value: "all_time",
					label: "All time"
				}]
			})
		}), s.length === 0 ? /* @__PURE__ */ I(a, { children: /* @__PURE__ */ L("p", {
			className: "text-sm text-muted",
			children: [
				"Nobody has earned points ",
				n === "month" ? "this month" : "",
				" yet."
			]
		}) }) : /* @__PURE__ */ I("ol", {
			className: "divide-y divide-border",
			children: s.map((e, n) => /* @__PURE__ */ L("li", {
				className: "flex items-center gap-3 px-card py-2.5 text-sm",
				children: [
					/* @__PURE__ */ I("span", {
						className: "w-5 text-right font-mono text-xs text-subtle",
						children: n < 3 ? /* @__PURE__ */ I(B, { className: "ml-auto size-3.5 text-accent-ink" }) : n + 1
					}),
					/* @__PURE__ */ I(t, {
						src: e.portrait,
						name: e.name,
						size: "xs"
					}),
					/* @__PURE__ */ I("span", {
						className: "min-w-0 flex-1 truncate",
						children: e.name
					}),
					/* @__PURE__ */ I(J, {
						value: e.points,
						className: "text-xs"
					})
				]
			}, e.id))
		})]
	});
}
//#endregion
//#region src/index.tsx
function Ee() {
	let { data: e, isLoading: t } = j({
		queryKey: ["store", "balance"],
		queryFn: () => E.get(`${K}/balance`),
		refetchInterval: 3e5
	});
	return t || !e ? /* @__PURE__ */ I(h, { className: "h-16" }) : /* @__PURE__ */ L(N, {
		to: "/p/store",
		className: "block",
		children: [
			/* @__PURE__ */ I("div", {
				className: "text-xs text-muted",
				children: "Your store points"
			}),
			/* @__PURE__ */ I("div", {
				className: "mt-1 text-3xl font-semibold",
				children: /* @__PURE__ */ I(J, { value: e.balance })
			}),
			/* @__PURE__ */ L("div", {
				className: "text-xs text-subtle",
				children: [
					"+",
					e.month.toLocaleString("en"),
					" in the last 30 days"
				]
			})
		]
	});
}
var De = te({
	routes: [
		{
			path: "",
			Component: xe
		},
		{
			path: "me",
			Component: _e
		},
		{
			path: "orders",
			Component: ve
		},
		{
			path: "manage",
			Component: le
		}
	],
	widgets: [{
		id: "balance",
		title: "Corp Store",
		Component: Ee,
		size: "sm",
		order: 40
	}]
});
//#endregion
export { De as default };

export const classes = ["!data","!n","!o","!soldOut","@conduit/sdk","@tanstack/react-query","a","absolute","act","actions","active","add","afterwards","align","all_time","alt","an","and","anything","are","aria-expanded","aria-label","aria-selected","as","audit","autoComplete","automatic","awards","back","balance","be","below","bg-hover","bg-surface-2","bg-surface-2/60","bg-surface-raised","block","blur","board","boolean","border","border-border","border-border-strong","border-t","bought","building","but","button","buy","by","byLimit","can","can_fulfil","can_manage","cancel","cancelLabel","cancelled","character","characters","checked","children","className","click","close","combobox","comes","confirmLabel","const","cost","count","counts","created_at","currentColor","cx","cy","danger","data","days","default","deliver","delivered","description","disabled","divide-border","divide-y","don","dq","draft","each","earn","earned","earning","else","empty","en","enabled","entries","every","export","extends","eyebrow","face","false","few","fill","fitted","fleet","fleet_points","fleets","flex","flex-1","flex-col","flex-wrap","fly","flying","font-medium","font-mono","font-normal","font-semibold","footer","for","from","fulfil","fulfilled","function","game","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-6","get","gets","ghost","give","given","giving","go","graduated","grid","grid-cols-[1fr_96px]","h-16","h-40","h-64","hand","handed","handled_at","handled_by","hands","has","here","hidden","hide","hint","history","hits","hover:text-text","hover:underline","how","however","i","icon","icons","id","if","import","in","industry","info","inline","inline-flex","input","inset-x-0","installed","interface","is","isLoading","it","italic","item","item_id","items","items-center","items-start","its","justify-between","justify-end","key","label","last","lazy","leaderboard","left","length","lg","limit","list","listClassName","listbox","ll","loading","m12","m16.71","m3.3","m6","m7.5","manage","manual","many","mark","max","max-h-56","max-w-full","maxLength","mb-4","md:grid-cols-2","me","member","members","mentee","mentor","mentor_points","mentoring","mentors","min","min-w-0","ml-auto","mono","month","more","most","mt-1","mt-auto","mutationFn","n","name","named","needs","neutral","new","next","no","nobody","none","not","note","null","number","of","off","officer","officers","on","onBlur","onBuy","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onFocus","onKeyDown","onMouseDown","onMouseEnter","onOpenChange","onSuccess","onValueChange","once","one","op","open","option","optional","options","or","order","ordered","orders","out","over","overflow-y-auto","own","p-0.5","p-1","p-card","part","past","patch","path","pending","per","per_member_limit","pick","pl-1","place-items-center","placeholder","plugin","points","pops","portrait","post","pr-1.5","price","primary","project","projects","projects_enabled","pt-1","pt-3","pt-4","put","px-2","px-card","py-1","py-1.5","py-2.5","py-3","qc","qty","quantity","queryFn","queryKey","reached","reachedLimit","react","react-router","reason","recruit","referral","referral_points","refetchInterval","refund","relative","required","rest","return","right","role","round","routes","rows","s","sale","save","saved","sees","self-start","set","setActing","setActive","setAmount","setBuying","setCancelling","setD","setDeleting","setDq","setEditing","setMember","setNote","setOpen","setQ","setQty","setQueryData","setReason","setS","setStatus","setWhen","sets","settings","shadow-e3","show","shrink-0","side","site","size","size-1/2","size-10","size-12","size-3.5","size-4","size-6","size-7","size-8","size-9","sm","sm:col-span-2","sm:grid-cols-2","so","soldOut","solidDanger","source","sources","space-y-1.5","space-y-4","space-y-6","spend","src","state","status","stay","stock","store","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","subtitle","success","switched","switches","t","tabular-nums","take","taken","takes","taking","text-2xl","text-3xl","text-[13px]","text-accent-ink","text-danger-fg","text-left","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-xs","that","the","their","them","then","they","this","time","title","to","told","tone","top-full","true","truncate","type","type_id","type_name","undefined","underline","unlimited","until","up","url","useQuery","useQueryClient","useState","used","user","user_id","value","variant","viewBox","viewer","void","w-28","w-32","w-5","w-full","waiting","warning","went","what","when","while","whitespace-pre-line","who","whole","widgets","will","with","would","xl:grid-cols-[1fr_340px]","xl:grid-cols-[1fr_420px]","xs","yet","you","your","z-10"];
