import { Avatar as e, Badge as t, Button as n, Callout as r, Card as i, CardBody as a, CardHeader as o, EmptyState as s, Field as c, Input as l, PageHeader as u, Progress as d, SearchInput as f, Segmented as p, Select as m, Skeleton as h, StatCard as g, SwitchRow as _, THead as v, TabPanel as y, Table as b, Tabs as x, Td as S, Th as C, Tooltip as w, Tr as T, api as E, dateTime as D, definePlugin as ee, duration as O, isk as k, num as A, timeAgo as te, toast as j, useHasPerm as M } from "@conduit/sdk";
import { useMutation as ne, useQuery as N, useQueryClient as re } from "@tanstack/react-query";
import { Link as P, useSearchParams as F } from "react-router";
import { useEffect as I, useMemo as ie, useState as L } from "react";
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
		/* @__PURE__ */ z("circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}),
		/* @__PURE__ */ z("path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }),
		/* @__PURE__ */ z("path", { d: "M2 12h20" })
	]
}), U = (e) => /* @__PURE__ */ B(V, {
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
}), ae = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" }),
		/* @__PURE__ */ z("path", { d: "M17 18h1" }),
		/* @__PURE__ */ z("path", { d: "M12 18h1" }),
		/* @__PURE__ */ z("path", { d: "M7 18h1" })
	]
}), W = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M10.27 21a2 2 0 0 0 3.46 0" }), /* @__PURE__ */ z("path", { d: "M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33" })]
}), G = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" })
});
//#endregion
//#region src/shared.tsx
function K(e = 3e4) {
	let [t, n] = L(() => Date.now());
	return I(() => {
		let t = setInterval(() => n(Date.now()), e);
		return () => clearInterval(t);
	}, [e]), t;
}
function q(e, t, n) {
	return !t || e === "stopped" ? e : new Date(t).getTime() <= n ? "expired" : e;
}
function J({ expiry: e, status: n, now: r }) {
	let i = q(n, e, r);
	if (i === "stopped" || !e) return /* @__PURE__ */ z(t, {
		tone: "danger",
		children: "Not running"
	});
	let a = new Date(e).getTime();
	return i === "expired" ? /* @__PURE__ */ z("span", {
		title: D(e),
		children: /* @__PURE__ */ B(t, {
			tone: "danger",
			children: [
				"Expired ",
				O(new Date(r).toISOString(), a),
				" ago"
			]
		})
	}) : /* @__PURE__ */ z("span", {
		title: D(e),
		children: /* @__PURE__ */ B(t, {
			tone: i === "soon" ? "warning" : "success",
			children: [O(e, r), " left"]
		})
	});
}
var oe = [
	"neutral",
	"info",
	"accent",
	"warning",
	"success"
];
function Y({ tier: e }) {
	return e == null ? null : /* @__PURE__ */ B(t, {
		tone: oe[e] ?? "neutral",
		children: ["P", e]
	});
}
function X({ type: e, size: t = "size-6" }) {
	return e ? /* @__PURE__ */ B("span", {
		className: "inline-flex min-w-0 items-center gap-2",
		children: [/* @__PURE__ */ z("img", {
			src: e.icon,
			alt: "",
			className: `${t} shrink-0`
		}), /* @__PURE__ */ z("span", {
			className: "truncate",
			children: e.name
		})]
	}) : /* @__PURE__ */ z("span", {
		className: "text-subtle",
		children: "—"
	});
}
function Z(e) {
	return `CC ${e}`;
}
//#endregion
//#region src/types.ts
var Q = "/api/p/pi", se = "/api/me/preferences/plugins/pi";
//#endregion
//#region src/corp.tsx
function ce() {
	let e = M("pi.view_corp_pi"), [t, n] = F(), a = t.get("tab") ?? "products", [o, c] = L("0"), [l, d] = L("3"), [f, p] = L(3);
	I(() => {
		let e = setTimeout(() => p(Math.max(0, Math.min(365, Number(l) || 0))), 400);
		return () => clearTimeout(e);
	}, [l]);
	let { data: _, isLoading: v, error: b } = N({
		queryKey: [
			"pi",
			"corp",
			o,
			f
		],
		queryFn: () => E.get(`${Q}/corp?idle_days=${f}&corporation=${o}`),
		enabled: e
	});
	return /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(u, {
		eyebrow: "Industry",
		title: "Corporation PI",
		icon: /* @__PURE__ */ z(U, {}),
		description: "What the members you can see make on their planets, who makes what, and colonies left idle. Covers the characters your character sheet access lets you see.",
		actions: _ && _.corporations.length > 1 ? /* @__PURE__ */ z(m, {
			value: o,
			onChange: (e) => c(e.target.value),
			"aria-label": "Corporation",
			className: "w-56",
			options: [{
				value: "0",
				label: "Every corporation"
			}, ..._.corporations.map((e) => ({
				value: String(e.id),
				label: e.name
			}))]
		}) : void 0
	}), !e || b ? /* @__PURE__ */ z(i, { children: /* @__PURE__ */ z(s, {
		icon: /* @__PURE__ */ z(U, {}),
		title: "Not for you",
		description: "This page needs the Corporation PI permission."
	}) }) : v || !_ ? /* @__PURE__ */ z(h, { className: "h-64" }) : /* @__PURE__ */ B("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ B("div", {
				className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ z(g, {
						label: "Members",
						value: _.totals.members,
						hint: `${_.totals.colonies} colonies`
					}),
					/* @__PURE__ */ z(g, {
						label: "Extractors running",
						value: A(_.totals.active),
						tone: "success",
						hint: `${A(_.totals.expired)} not running`
					}),
					/* @__PURE__ */ z(g, {
						label: "Idle colonies",
						value: _.totals.idle,
						tone: _.totals.idle ? "warning" : void 0,
						hint: `no extractor for over ${_.idle_days} days`
					}),
					/* @__PURE__ */ z(g, {
						label: "Output a day",
						value: k(_.totals.isk_per_day),
						mono: !0,
						hint: "estimate at average prices"
					})
				]
			}),
			_.totals.colonies === 0 && /* @__PURE__ */ z(r, {
				tone: "info",
				title: "No colonies to show",
				children: "Either nobody you can see runs PI yet, or your character sheet access doesn't reach their characters. Corporation or alliance character access is given under Administration → Groups."
			}),
			/* @__PURE__ */ B(x, {
				value: a,
				onValueChange: (e) => n(e === "products" ? {} : { tab: e }, { replace: !0 }),
				variant: "pills",
				className: "space-y-4",
				items: [
					{
						value: "products",
						label: "Products",
						count: _.products.length
					},
					{
						value: "members",
						label: "Members",
						count: _.members.length
					},
					{
						value: "idle",
						label: "Idle colonies",
						count: _.idle.length
					}
				],
				children: [
					/* @__PURE__ */ z(y, {
						value: "products",
						children: /* @__PURE__ */ z(le, { data: _ })
					}),
					/* @__PURE__ */ z(y, {
						value: "members",
						children: /* @__PURE__ */ z(ue, { data: _ })
					}),
					/* @__PURE__ */ z(y, {
						value: "idle",
						children: /* @__PURE__ */ z(de, {
							data: _,
							idle: l,
							onIdle: d
						})
					})
				]
			})
		]
	})] });
}
function le({ data: e }) {
	let [t, n] = L("all"), r = t === "all" ? e.products : e.products.filter((e) => String(e.type.tier) === t);
	return /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z("div", {
		className: "flex flex-wrap items-center gap-2 border-b border-border p-3",
		children: /* @__PURE__ */ z(p, {
			value: t,
			onChange: n,
			options: [{
				value: "all",
				label: "Every tier"
			}, ...[
				"0",
				"1",
				"2",
				"3",
				"4"
			].map((e) => ({
				value: e,
				label: `P${e}`
			}))]
		})
	}), r.length === 0 ? /* @__PURE__ */ z(s, {
		icon: /* @__PURE__ */ z(U, {}),
		title: "Nothing made at this tier"
	}) : /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(C, { children: "Product" }),
		/* @__PURE__ */ z(C, { children: "Tier" }),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: "A day"
		}),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: "ISK a day"
		}),
		/* @__PURE__ */ z(C, { children: "Made by" })
	] }) }), /* @__PURE__ */ z("tbody", { children: r.map((e) => /* @__PURE__ */ B(T, { children: [
		/* @__PURE__ */ z(S, { children: /* @__PURE__ */ z(X, { type: e.type }) }),
		/* @__PURE__ */ z(S, { children: /* @__PURE__ */ z(Y, { tier: e.type.tier }) }),
		/* @__PURE__ */ z(S, {
			align: "right",
			className: "font-mono",
			children: A(e.per_day)
		}),
		/* @__PURE__ */ z(S, {
			align: "right",
			className: "font-mono",
			children: k(e.isk_per_day)
		}),
		/* @__PURE__ */ z(S, { children: /* @__PURE__ */ z(w, {
			content: e.producers.map((e) => `${e.name}: ${A(e.per_day)}/day`).join(", "),
			children: /* @__PURE__ */ B("span", {
				className: "text-sm text-muted",
				children: [e.producers.slice(0, 3).map((e) => e.name).join(", "), e.producers.length > 3 && ` and ${e.producers.length - 3} more`]
			})
		}) })
	] }, e.type.id)) })] })] });
}
function ue({ data: n }) {
	let [r, a] = L(""), o = n.members.filter((e) => !r.trim() || e.name.toLowerCase().includes(r.trim().toLowerCase()) || e.products.some((e) => e.toLowerCase().includes(r.trim().toLowerCase())));
	return /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z("div", {
		className: "flex flex-wrap items-center gap-2 border-b border-border p-3",
		children: /* @__PURE__ */ z(f, {
			value: r,
			onChange: (e) => a(e.target.value),
			placeholder: "Find a member or product",
			className: "w-64",
			"aria-label": "Search members"
		})
	}), o.length === 0 ? /* @__PURE__ */ z(s, {
		icon: /* @__PURE__ */ z(U, {}),
		title: r ? "Nobody matches" : "Nobody runs PI yet"
	}) : /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(C, { children: "Member" }),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: "Colonies"
		}),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: "Extractors"
		}),
		/* @__PURE__ */ z(C, { children: "Makes" }),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: "ISK a day"
		})
	] }) }), /* @__PURE__ */ z("tbody", { children: o.map((n) => /* @__PURE__ */ B(T, { children: [
		/* @__PURE__ */ z(S, { children: /* @__PURE__ */ B("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ z(e, {
				src: n.portrait,
				name: n.name,
				size: "sm"
			}), /* @__PURE__ */ B("span", { children: [/* @__PURE__ */ z("span", {
				className: "block font-medium",
				children: n.name
			}), /* @__PURE__ */ B("span", {
				className: "block text-xs text-muted",
				children: [
					n.corporation ?? "No corporation",
					" · ",
					n.characters,
					" character",
					n.characters === 1 ? "" : "s"
				]
			})] })]
		}) }),
		/* @__PURE__ */ B(S, {
			align: "right",
			children: [/* @__PURE__ */ z("span", {
				className: "font-mono",
				children: n.colonies
			}), n.idle > 0 && /* @__PURE__ */ B(t, {
				tone: "warning",
				className: "ml-2",
				children: [n.idle, " idle"]
			})]
		}),
		/* @__PURE__ */ B(S, {
			align: "right",
			children: [/* @__PURE__ */ z("span", {
				className: "font-mono",
				children: n.active
			}), n.expired > 0 && /* @__PURE__ */ B("span", {
				className: "ml-1 text-xs text-danger-fg",
				children: [
					"+",
					n.expired,
					" stopped"
				]
			})]
		}),
		/* @__PURE__ */ z(S, {
			className: "text-sm text-muted",
			children: n.products.join(", ") || "—"
		}),
		/* @__PURE__ */ z(S, {
			align: "right",
			className: "font-mono",
			children: k(n.isk_per_day)
		})
	] }, n.id)) })] })] });
}
function de({ data: e, idle: n, onIdle: r }) {
	return /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, {
		title: "Idle colonies",
		description: "Colonies whose extractors have all been stopped for longer than this. A nudge for the member, or a planet to hand to someone else.",
		actions: /* @__PURE__ */ B("label", {
			className: "flex items-center gap-2 text-sm text-muted",
			children: [
				"Idle for over",
				/* @__PURE__ */ z(l, {
					type: "number",
					min: 0,
					max: 365,
					value: n,
					onChange: (e) => r(e.target.value),
					className: "w-20",
					"aria-label": "Days idle"
				}),
				"days"
			]
		})
	}), e.idle.length === 0 ? /* @__PURE__ */ z(s, {
		icon: /* @__PURE__ */ z(G, {}),
		title: "No idle colonies",
		description: "Every colony with extractors had one running recently."
	}) : /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(C, { children: "Planet" }),
		/* @__PURE__ */ z(C, { children: "Member" }),
		/* @__PURE__ */ z(C, { children: "Extracted" }),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: "Idle"
		})
	] }) }), /* @__PURE__ */ z("tbody", { children: e.idle.map((e) => /* @__PURE__ */ B(T, { children: [
		/* @__PURE__ */ z(S, { children: /* @__PURE__ */ B("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ z("img", {
				src: e.image,
				alt: "",
				className: "size-8"
			}), /* @__PURE__ */ B("span", { children: [/* @__PURE__ */ z("span", {
				className: "block font-medium",
				children: e.planet
			}), /* @__PURE__ */ B("span", {
				className: "block text-xs text-muted",
				children: [
					e.system,
					" · ",
					e.type,
					" · ",
					Z(e.upgrade_level)
				]
			})] })]
		}) }),
		/* @__PURE__ */ B(S, { children: [/* @__PURE__ */ z("span", {
			className: "block",
			children: e.member
		}), e.character !== e.member && /* @__PURE__ */ z("span", {
			className: "block text-xs text-muted",
			children: e.character
		})] }),
		/* @__PURE__ */ z(S, {
			className: "text-sm text-muted",
			children: e.products.join(", ") || "—"
		}),
		/* @__PURE__ */ z(S, {
			align: "right",
			children: /* @__PURE__ */ B(t, {
				tone: e.days >= 14 ? "danger" : "warning",
				children: [e.days, " days"]
			})
		})
	] }, e.colony)) })] })] });
}
//#endregion
//#region src/mine.tsx
var fe = ["pi", "me"];
function pe() {
	let [e, t] = F(), r = e.get("tab") ?? "colonies", { data: i, isLoading: a } = N({
		queryKey: fe,
		queryFn: () => E.get(`${Q}/me`),
		refetchInterval: 3e5
	});
	return /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(u, {
		eyebrow: "Industry",
		title: "Planetary Industry",
		icon: /* @__PURE__ */ z(H, {}),
		description: "Every colony across your characters: extractor countdowns, factories, storage and what it all makes a day. Colonies refresh from EVE about once an hour.",
		actions: i?.can_view_corp ? /* @__PURE__ */ z(P, {
			to: "/p/pi/corp",
			children: /* @__PURE__ */ B(n, {
				variant: "ghost",
				children: [/* @__PURE__ */ z(U, {}), " Corporation PI"]
			})
		}) : void 0
	}), a || !i ? /* @__PURE__ */ z(h, { className: "h-64" }) : /* @__PURE__ */ B(x, {
		value: r,
		onValueChange: (e) => t(e === "colonies" ? {} : { tab: e }, { replace: !0 }),
		variant: "pills",
		className: "space-y-4",
		items: [
			{
				value: "colonies",
				label: "Colonies",
				count: i.totals.colonies
			},
			{
				value: "output",
				label: "Output"
			},
			{
				value: "reminders",
				label: "Reminders"
			}
		],
		children: [
			/* @__PURE__ */ z(y, {
				value: "colonies",
				children: /* @__PURE__ */ z($, { data: i })
			}),
			/* @__PURE__ */ z(y, {
				value: "output",
				children: /* @__PURE__ */ z(ge, { data: i })
			}),
			/* @__PURE__ */ z(y, {
				value: "reminders",
				children: /* @__PURE__ */ z(_e, { initial: i.settings })
			})
		]
	})] });
}
function $({ data: e }) {
	let t = K(), [n, a] = L("all"), o = e.characters.filter((e) => !e.has_scope), c = n === "all" ? e.colonies : e.colonies.filter((e) => String(e.character.id) === n), l = e.colonies.reduce((e, n) => e + n.extractors.filter((e) => q(e.status, e.expiry, t) === "expired" || e.status === "stopped").length, 0);
	return /* @__PURE__ */ B("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ B("div", {
				className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ z(g, {
						label: "Colonies",
						value: e.totals.colonies,
						hint: `on ${e.characters.filter((e) => e.colonies).length} characters`
					}),
					/* @__PURE__ */ z(g, {
						label: "Extractors running",
						value: `${e.totals.active} / ${e.totals.extractors}`,
						tone: l ? "warning" : "success",
						hint: e.totals.soon ? `${e.totals.soon} expire within ${e.settings.lead_hours}h` : "none about to expire"
					}),
					/* @__PURE__ */ z(g, {
						label: "Not running",
						value: l,
						tone: l ? "danger" : void 0,
						hint: "extractors to restart"
					}),
					/* @__PURE__ */ z(g, {
						label: "Output a day",
						value: k(e.totals.isk_per_day),
						mono: !0,
						hint: "estimate at average prices"
					})
				]
			}),
			o.length > 0 && /* @__PURE__ */ B(r, {
				tone: "info",
				title: "Some characters don't share their planets",
				children: [
					o.map((e) => e.name).join(", "),
					" ",
					o.length === 1 ? "hasn't" : "haven't",
					" granted planet access. Log in with",
					" ",
					o.length === 1 ? "that character" : "them",
					" again from your characters page to add their colonies."
				]
			}),
			e.colonies.length === 0 ? /* @__PURE__ */ z(i, { children: /* @__PURE__ */ z(s, {
				icon: /* @__PURE__ */ z(H, {}),
				title: "No colonies yet",
				description: "Colonies show here after your characters' next sync, once they have any."
			}) }) : /* @__PURE__ */ B(R, { children: [e.characters.filter((e) => e.colonies).length > 1 && /* @__PURE__ */ z(p, {
				value: n,
				onChange: a,
				options: [{
					value: "all",
					label: "Everyone"
				}, ...e.characters.filter((e) => e.colonies).map((e) => ({
					value: String(e.id),
					label: `${e.name} (${e.colonies})`
				}))]
			}), /* @__PURE__ */ z("div", {
				className: "grid gap-4 xl:grid-cols-2",
				children: c.map((e) => /* @__PURE__ */ z(me, {
					c: e,
					now: t
				}, e.id))
			})] })
		]
	});
}
function me({ c: n, now: r }) {
	let o = n.extractors.some((e) => q(e.status, e.expiry, r) === "expired" || e.status === "stopped");
	return /* @__PURE__ */ B(i, {
		className: o ? "ring-1 ring-danger/50" : void 0,
		children: [/* @__PURE__ */ B("div", {
			className: "flex items-start gap-3 border-b border-border px-card py-3",
			children: [
				/* @__PURE__ */ z("img", {
					src: n.image,
					alt: "",
					className: "size-12 shrink-0"
				}),
				/* @__PURE__ */ B("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ B("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ z("span", {
								className: "font-semibold",
								children: n.name
							}),
							/* @__PURE__ */ z(t, { children: n.type }),
							/* @__PURE__ */ z(t, {
								tone: "info",
								children: Z(n.upgrade_level)
							})
						]
					}), /* @__PURE__ */ B("div", {
						className: "mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted",
						children: [
							/* @__PURE__ */ B("span", { children: [
								n.system.name,
								" (",
								n.system.security.toFixed(1),
								")"
							] }),
							/* @__PURE__ */ z("span", { children: "·" }),
							/* @__PURE__ */ B("span", {
								className: "inline-flex items-center gap-1",
								children: [
									/* @__PURE__ */ z(e, {
										src: n.character.portrait,
										name: n.character.name,
										size: "xs",
										rounded: "full"
									}),
									" ",
									n.character.name
								]
							}),
							/* @__PURE__ */ z("span", { children: "·" }),
							/* @__PURE__ */ B("span", { children: ["Changed in game ", te(n.last_update)] })
						]
					})]
				}),
				/* @__PURE__ */ B("div", {
					className: "text-right",
					children: [/* @__PURE__ */ z("div", {
						className: "font-mono text-sm tabular-nums",
						children: k(n.isk_per_day)
					}), /* @__PURE__ */ z("div", {
						className: "text-xs text-subtle",
						children: "a day"
					})]
				})
			]
		}), /* @__PURE__ */ B(a, {
			className: "space-y-4",
			children: [
				n.extractors.length > 0 && /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("div", {
					className: "mb-1.5 text-xs font-medium uppercase tracking-wide text-subtle",
					children: "Extractors"
				}), /* @__PURE__ */ z("ul", {
					className: "space-y-1.5",
					children: n.extractors.map((e) => {
						let t = q(e.status, e.expiry, r);
						return /* @__PURE__ */ B("li", {
							className: `flex items-center gap-3 rounded-control px-2 py-1 ${t === "expired" || t === "stopped" ? "bg-danger-soft" : ""}`,
							children: [
								/* @__PURE__ */ z("div", {
									className: "min-w-0 flex-1 text-sm",
									children: /* @__PURE__ */ z(X, { type: e.product })
								}),
								/* @__PURE__ */ z(w, {
									content: `${A(e.qty_per_cycle)} every ${Math.round(e.cycle_time / 60)} minutes, ${e.heads} heads`,
									children: /* @__PURE__ */ z("span", {
										className: "font-mono text-xs tabular-nums text-muted",
										children: e.per_day ? `${A(e.per_day)}/day` : "—"
									})
								}),
								/* @__PURE__ */ z(J, {
									expiry: e.expiry,
									status: e.status,
									now: r
								})
							]
						}, e.pin_id);
					})
				})] }),
				n.factories.length > 0 && /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("div", {
					className: "mb-1.5 text-xs font-medium uppercase tracking-wide text-subtle",
					children: "Factories"
				}), /* @__PURE__ */ z("div", {
					className: "flex flex-wrap gap-1.5",
					children: n.factories.map((e) => /* @__PURE__ */ z(w, {
						content: e.running < e.count ? `${e.count - e.running} with nothing routed in` : "All fed by a route",
						children: /* @__PURE__ */ B("span", {
							className: "inline-flex items-center gap-1.5 rounded-control border border-border px-2 py-1 text-sm",
							children: [
								e.product && /* @__PURE__ */ z("img", {
									src: e.product.icon,
									alt: "",
									className: "size-5"
								}),
								e.count,
								"× ",
								e.schematic,
								/* @__PURE__ */ z(Y, { tier: e.tier }),
								e.running < e.count && /* @__PURE__ */ B("span", {
									className: "text-xs text-warning-fg",
									children: [e.count - e.running, " idle"]
								})
							]
						})
					}, e.schematic))
				})] }),
				n.storage.length > 0 && /* @__PURE__ */ z("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: n.storage.map((e, t) => /* @__PURE__ */ z(w, {
						content: e.contents.length ? e.contents.map((e) => `${A(e.amount)} ${e.type.name}`).join(", ") : "Empty",
						children: /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ B("div", {
							className: "mb-1 flex items-baseline justify-between text-xs",
							children: [/* @__PURE__ */ z("span", {
								className: "text-muted",
								children: e.name
							}), /* @__PURE__ */ B("span", {
								className: "font-mono tabular-nums",
								children: [
									A(e.used),
									" / ",
									A(e.capacity),
									" m³"
								]
							})]
						}), /* @__PURE__ */ z(d, {
							value: e.pct,
							tone: e.pct >= 90 ? "danger" : e.pct >= 70 ? "warning" : "accent",
							size: "sm"
						})] })
					}, t))
				}),
				/* @__PURE__ */ z(he, {
					output: n.output,
					inputs: n.inputs
				})
			]
		})]
	});
}
function he({ output: e, inputs: t }) {
	return !e.length && !t.length ? /* @__PURE__ */ z("p", {
		className: "text-sm text-muted",
		children: "Nothing being made right now."
	}) : /* @__PURE__ */ B("div", {
		className: "flex flex-wrap gap-x-6 gap-y-1 text-sm",
		children: [e.map((e) => /* @__PURE__ */ B("span", {
			className: "inline-flex items-center gap-1.5",
			children: [
				/* @__PURE__ */ z(Y, { tier: e.type.tier }),
				" ",
				/* @__PURE__ */ z(X, {
					type: e.type,
					size: "size-5"
				}),
				/* @__PURE__ */ B("span", {
					className: "font-mono text-xs tabular-nums text-muted",
					children: [A(e.per_day), "/day"]
				})
			]
		}, e.type.id)), t.map((e) => /* @__PURE__ */ z(w, {
			content: "Used here but not made here: haul it in",
			children: /* @__PURE__ */ B("span", {
				className: "inline-flex items-center gap-1.5 text-muted",
				children: [
					/* @__PURE__ */ z("span", {
						className: "text-xs",
						children: "needs"
					}),
					" ",
					/* @__PURE__ */ z(X, {
						type: e.type,
						size: "size-5"
					}),
					/* @__PURE__ */ B("span", {
						className: "font-mono text-xs tabular-nums",
						children: [A(e.per_day), "/day"]
					})
				]
			})
		}, `in-${e.type.id}`))]
	});
}
function ge({ data: e }) {
	let t = e.totals.isk_per_day;
	return /* @__PURE__ */ B("div", {
		className: "grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
		children: [/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(o, {
			title: "What your colonies make",
			description: "Made minus what your factories use, over all your colonies, valued at CCP's average price.",
			actions: /* @__PURE__ */ B("span", {
				className: "font-mono text-sm",
				children: [k(t), " a day"]
			})
		}), e.totals.output.length === 0 ? /* @__PURE__ */ z(s, {
			icon: /* @__PURE__ */ z(ae, {}),
			title: "Nothing being made"
		}) : /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
			/* @__PURE__ */ z(C, { children: "Product" }),
			/* @__PURE__ */ z(C, { children: "Tier" }),
			/* @__PURE__ */ z(C, {
				align: "right",
				children: "A day"
			}),
			/* @__PURE__ */ z(C, {
				align: "right",
				children: "ISK a day"
			}),
			/* @__PURE__ */ z(C, {
				align: "right",
				children: "A week"
			})
		] }) }), /* @__PURE__ */ z("tbody", { children: e.totals.output.map((e) => /* @__PURE__ */ B(T, { children: [
			/* @__PURE__ */ z(S, { children: /* @__PURE__ */ z(X, { type: e.type }) }),
			/* @__PURE__ */ z(S, { children: /* @__PURE__ */ z(Y, { tier: e.type.tier }) }),
			/* @__PURE__ */ z(S, {
				align: "right",
				className: "font-mono",
				children: A(e.per_day)
			}),
			/* @__PURE__ */ z(S, {
				align: "right",
				className: "font-mono",
				children: k(e.isk_per_day)
			}),
			/* @__PURE__ */ z(S, {
				align: "right",
				className: "font-mono text-muted",
				children: k((e.isk_per_day ?? 0) * 7)
			})
		] }, e.type.id)) })] })] }), /* @__PURE__ */ B(i, { children: [
			/* @__PURE__ */ z(o, {
				title: "To haul in",
				description: "What your factories use that your colonies don't make."
			}),
			e.totals.inputs.length === 0 ? /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z("p", {
				className: "text-sm text-muted",
				children: "Nothing: your colonies feed themselves."
			}) }) : /* @__PURE__ */ z("ul", {
				className: "divide-y divide-border",
				children: e.totals.inputs.map((e) => /* @__PURE__ */ B("li", {
					className: "flex items-center justify-between gap-3 px-card py-2 text-sm",
					children: [/* @__PURE__ */ z(X, { type: e.type }), /* @__PURE__ */ B("span", {
						className: "font-mono text-xs tabular-nums text-muted",
						children: [A(e.per_day), "/day"]
					})]
				}, e.type.id))
			}),
			/* @__PURE__ */ z(a, {
				className: "border-t border-border text-xs text-subtle",
				children: "Estimates: extractors at their average rate until they expire, factories with a route into them running every cycle."
			})
		] })]
	});
}
function _e({ initial: e }) {
	let t = re(), [r, s] = L(e);
	I(() => s(e), [e]);
	let u = ie(() => JSON.stringify(r) !== JSON.stringify(e), [r, e]), d = ne({
		mutationFn: (e) => E.put(se, { value: e }),
		onSuccess: () => {
			t.invalidateQueries({ queryKey: ["pi"] }), j.success("Reminders saved");
		},
		onError: (e) => j.error(e.message)
	}), f = (e) => s({
		...r,
		...e
	});
	return /* @__PURE__ */ B(i, {
		className: "max-w-2xl",
		children: [/* @__PURE__ */ z(o, {
			title: "Reminders",
			icon: /* @__PURE__ */ z(W, {}),
			description: "Notifications under the bell, once per extractor program. Mute “Planetary Industry reminders” in your settings to stop them all."
		}), /* @__PURE__ */ B(a, {
			className: "space-y-3",
			children: [
				/* @__PURE__ */ B("div", {
					className: "divide-y divide-border",
					children: [
						/* @__PURE__ */ z(_, {
							label: "Before an extractor expires",
							description: "Not for programs you set shorter than the lead time.",
							checked: r.soon,
							onCheckedChange: (e) => f({ soon: e })
						}),
						/* @__PURE__ */ z(_, {
							label: "When an extractor has expired",
							checked: r.expired,
							onCheckedChange: (e) => f({ expired: e })
						}),
						/* @__PURE__ */ z(_, {
							label: "Daily digest",
							description: "One notification a day after downtime: what isn't running, what expires in the next 24 hours, and your ISK a day.",
							checked: r.digest,
							onCheckedChange: (e) => f({ digest: e })
						})
					]
				}),
				/* @__PURE__ */ z(c, {
					label: "Remind me this many hours before",
					hint: "1 to 72 hours",
					children: /* @__PURE__ */ z(l, {
						type: "number",
						min: 1,
						max: 72,
						value: r.lead_hours,
						disabled: !r.soon,
						onChange: (e) => f({ lead_hours: Number(e.target.value) }),
						className: "w-32"
					})
				}),
				/* @__PURE__ */ z(n, {
					variant: "primary",
					disabled: !u,
					loading: d.isPending,
					onClick: () => d.mutate({
						...r,
						lead_hours: Math.min(72, Math.max(1, Math.round(r.lead_hours) || 2))
					}),
					children: "Save reminders"
				})
			]
		})]
	});
}
//#endregion
//#region src/index.tsx
function ve() {
	let e = K(), { data: n, isLoading: r } = N({
		queryKey: ["pi", "upcoming"],
		queryFn: () => E.get(`${Q}/upcoming?limit=4`),
		refetchInterval: 6e5
	});
	return r || !n ? /* @__PURE__ */ z(h, { className: "h-24" }) : n.colonies === 0 ? /* @__PURE__ */ z("p", {
		className: "text-sm text-muted",
		children: "No colonies yet. They show up after your characters' next sync."
	}) : /* @__PURE__ */ B(P, {
		to: "/p/pi",
		className: "block space-y-2",
		children: [/* @__PURE__ */ B("div", {
			className: "flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ B("span", {
				className: "text-xs text-muted",
				children: [
					n.running,
					" extractor",
					n.running === 1 ? "" : "s",
					" running on ",
					n.colonies,
					" colonies"
				]
			}), n.expired > 0 ? /* @__PURE__ */ B(t, {
				tone: "danger",
				children: [n.expired, " not running"]
			}) : /* @__PURE__ */ z(t, {
				tone: "success",
				children: "All running"
			})]
		}), n.next.length > 0 && /* @__PURE__ */ z("ul", {
			className: "space-y-1.5",
			children: n.next.map((t, n) => /* @__PURE__ */ B("li", {
				className: "flex items-center gap-2 text-sm",
				children: [
					/* @__PURE__ */ z("img", {
						src: t.image,
						alt: "",
						className: "size-6 shrink-0"
					}),
					/* @__PURE__ */ B("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ z("div", {
							className: "truncate",
							children: t.planet
						}), /* @__PURE__ */ B("div", {
							className: "truncate text-xs text-muted",
							children: [
								t.character,
								" · ",
								/* @__PURE__ */ z(X, {
									type: t.product,
									size: "size-3.5"
								})
							]
						})]
					}),
					/* @__PURE__ */ z(J, {
						expiry: t.expiry,
						status: t.status,
						now: e
					})
				]
			}, n))
		})]
	});
}
var ye = ee({
	routes: [{
		path: "",
		Component: pe
	}, {
		path: "corp",
		Component: ce
	}],
	widgets: [{
		id: "expiring",
		title: "Extractors expiring next",
		Component: ve,
		size: "sm",
		order: 42
	}]
});
//#endregion
export { ye as default };

export const classes = ["!data","@conduit/sdk","@tanstack/react-query","a","about","accent","access","across","actions","active","add","after","again","ago","align","all","alliance","allowed","alt","amount","an","and","anyExpired","are","aria-label","as","at","average","been","before","being","bg-danger-soft","block","boolean","border","border-b","border-border","border-t","but","by","can","can_view_corp","capacity","category","character","character_id","characters","check","checked","children","className","clock","colonies","colony","component","const","content","contents","corp","corporation","corporations","count","countdowns","counting","current","currentColor","cx","cy","cycle_time","danger","data","day","days","default","description","digest","dirty","disabled","divide-border","divide-y","doesn","don","downtime","duration","enabled","error","estimate","every","expire","expired","expires","expiring","expiry","export","extractor","extractors","eyebrow","factories","fed","feed","few","fill","flex","flex-1","flex-wrap","font-medium","font-mono","font-semibold","for","from","full","function","game","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-6","gap-x-2","gap-x-6","gap-y-1","get","ghost","given","granted","grid","group","h","h-24","h-64","had","hand","has","has_scope","hasn","haul","have","haven","heads","here","hint","hours","icon","icons","id","idle","idleDays","idle_days","if","image","import","in","info","initial","inline","inline-flex","inputs","installed","interface","intervalMs","into","is","isLoading","isk_per_day","isn","it","items","items-baseline","items-center","items-start","justify-between","keeps","key","label","last_update","lead","lead_hours","left","length","lets","level","lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]","loading","longer","m21.73","made","make","makes","many","matches","max","max-w-2xl","mb-1","mb-1.5","me","member","members","min","min-w-0","minus","missing","ml-1","ml-2","mono","more","moved","mt-0.5","mutationFn","n","name","needs","neutral","new","next","next_expiry","no","nobody","none","not","nothing","notification","now","nudge","null","number","of","officers","on","onChange","onCheckedChange","onClick","onError","onIdle","onSuccess","onValueChange","once","one","open","options","or","order","other","output","over","p-3","page","pages","patch","path","pct","per","per-user","per_day","pi","pills","pin_id","pins","placeholder","planet","planet_id","planet_type","planets","portrait","prices","primary","producers","product","products","programs","px-2","px-card","py-1","py-2","py-3","qc","qty_per_cycle","queryFn","queryKey","rate","reach","react","react-router","reads","refetchInterval","refresh","reminder","reminders","replace","rest","restart","return","right","ring-1","ring-danger/50","round","rounded","rounded-control","route","routed","routes","rows","running","runs","s","save","saved","schematic","security","see","server","set","setCharacter","setCorporation","setForm","setIdleDays","setIdleInput","setNow","setParams","setQ","setTier","settings","share","sheet","shorter","show","shown","shrink-0","side","since","site","size","size-12","size-3.5","size-4","size-5","size-6","size-8","sm","sm:grid-cols-2","so","someone","soon","space-y-1.5","space-y-2","space-y-3","space-y-4","src","status","stop","stopped","storage","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","system","t","tab","tabular-nums","text-danger-fg","text-muted","text-right","text-sm","text-subtle","text-warning-fg","text-xs","than","that","the","their","them","they","this","ticking","tier","title","to","tone","total","totals","tracking-wide","true","truncate","type","undefined","under","until","up","upcoming","updated","upgrade_level","uppercase","use","useNow","useQuery","useQueryClient","useSearchParams","useState","used","using","v","value","valued","variant","viewBox","view_corp_pi","void","w-20","w-32","w-56","w-64","warning","week","what","while","who","whose","widgets","with","within","worked","xl:grid-cols-2","xl:grid-cols-4","xs","yet","you","your"];
