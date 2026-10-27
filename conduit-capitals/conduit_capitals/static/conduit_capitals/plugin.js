import { Avatar as e, Badge as t, Button as n, Callout as r, Card as i, CardBody as a, CardHeader as o, Dialog as s, EmptyState as c, Field as l, PageHeader as u, Segmented as ee, Select as d, Skeleton as f, THead as p, TabPanel as m, Table as h, Tabs as g, Td as _, Textarea as v, Th as y, Tooltip as b, Tr as x, api as S, definePlugin as te, duration as C, num as w, timeAgo as T, toast as E } from "@conduit/sdk";
import { useMutation as ne, useQuery as D, useQueryClient as re } from "@tanstack/react-query";
import { Link as O, useParams as k, useSearchParams as A } from "react-router";
import { useEffect as ie, useState as j } from "react";
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
		/* @__PURE__ */ N("path", { d: "M12 22V8" }),
		/* @__PURE__ */ N("path", { d: "M5 12H2a10 10 0 0 0 20 0h-3" }),
		/* @__PURE__ */ N("circle", {
			cx: "12",
			cy: "5",
			r: "3"
		})
	]
}), ae = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [
		/* @__PURE__ */ N("path", { d: "M19.07 4.93A10 10 0 0 0 6.99 3.34" }),
		/* @__PURE__ */ N("path", { d: "M4 6h.01" }),
		/* @__PURE__ */ N("path", { d: "M2.29 9.62A10 10 0 1 0 21.31 8.35" }),
		/* @__PURE__ */ N("path", { d: "M16.24 7.76A6 6 0 1 0 8.23 16.67" }),
		/* @__PURE__ */ N("path", { d: "M12 18h.01" }),
		/* @__PURE__ */ N("path", { d: "M17.99 11.66A6 6 0 0 1 15.77 16.67" }),
		/* @__PURE__ */ N("circle", {
			cx: "12",
			cy: "12",
			r: "2"
		}),
		/* @__PURE__ */ N("path", { d: "m13.41 10.59 5.66-5.66" })
	]
}), L = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" }), /* @__PURE__ */ N("circle", {
		cx: "12",
		cy: "10",
		r: "3"
	})]
}), oe = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [
		/* @__PURE__ */ N("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
		/* @__PURE__ */ N("circle", {
			cx: "9",
			cy: "7",
			r: "4"
		}),
		/* @__PURE__ */ N("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
		/* @__PURE__ */ N("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
	]
}), se = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [
		/* @__PURE__ */ N("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }),
		/* @__PURE__ */ N("path", { d: "M12 9v4" }),
		/* @__PURE__ */ N("path", { d: "M12 17h.01" })
	]
}), ce = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ N("path", { d: "M19 12H5" })]
}), le = (e) => /* @__PURE__ */ N(F, {
	...e,
	children: /* @__PURE__ */ N("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" })
}), R = "/api/p/capitals";
//#endregion
//#region src/shared.tsx
function z({ to: e, children: t }) {
	return /* @__PURE__ */ P(O, {
		to: e,
		className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
		children: [
			/* @__PURE__ */ N(ce, {}),
			" ",
			t
		]
	});
}
function B({ hull: e, size: t = "size-6" }) {
	return e ? /* @__PURE__ */ N("img", {
		src: e.icon,
		alt: "",
		title: e.name,
		className: `${t} shrink-0 bg-surface-2`,
		loading: "lazy"
	}) : null;
}
function V(e) {
	return /* @__PURE__ */ N("span", {
		className: `font-mono tabular-nums ${e >= .45 ? "text-success-fg" : e > 0 ? "text-warning-fg" : "text-danger-fg"}`,
		children: e.toFixed(1)
	});
}
function H({ place: e, short: t = !1 }) {
	if (!e) return /* @__PURE__ */ N("span", {
		className: "text-subtle",
		children: "Unknown location"
	});
	let n = e.system, r = e.kind !== "solar_system" && e.kind !== "unknown";
	return /* @__PURE__ */ P("span", {
		className: "inline-flex flex-wrap items-baseline gap-x-1.5",
		children: [
			r && /* @__PURE__ */ N("span", {
				className: "font-medium",
				children: e.name
			}),
			r && !t && /* @__PURE__ */ N("span", {
				className: "text-xs text-subtle",
				children: e.kind === "structure" ? "structure" : "station"
			}),
			n && /* @__PURE__ */ P("span", {
				className: "text-muted",
				children: [
					r && "· ",
					n.name,
					" ",
					V(n.security),
					n.region && !t ? ` · ${n.region}` : ""
				]
			}),
			!r && !n && /* @__PURE__ */ N("span", {
				className: "text-muted",
				children: e.name
			})
		]
	});
}
var U = {
	ok: "Up to date",
	stale: "Not synced for two days",
	missing_scopes: "Login doesn't allow it",
	token_invalid: "Login stopped working",
	error: "Syncing fails",
	never: "Not synced yet"
}, W = {
	skills: "Skills",
	assets: "Assets",
	clones: "Clones"
};
function G({ c: e }) {
	return e.problem ? /* @__PURE__ */ N("span", {
		className: "inline-flex flex-wrap gap-1",
		children: Object.keys(W).filter((t) => e.data[t].status !== "ok").map((n) => /* @__PURE__ */ N(b, {
			content: `${U[e.data[n].status]}${e.data[n].at ? `; last synced ${T(e.data[n].at)}` : ""}`,
			children: /* @__PURE__ */ N("span", { children: /* @__PURE__ */ P(t, {
				tone: e.data[n].status === "stale" ? "warning" : "danger",
				children: [
					/* @__PURE__ */ N(se, { className: "size-3" }),
					" ",
					W[n]
				]
			}) })
		}, n))
	}) : null;
}
function K({ av: e }) {
	return e ? /* @__PURE__ */ N(b, {
		content: `${e.note ? `“${e.note}” · ` : ""}said ${T(e.updated_at)}`,
		children: /* @__PURE__ */ N("span", { children: /* @__PURE__ */ N(t, {
			tone: e.available ? "success" : "neutral",
			children: e.available ? "Available for ops" : "Not available"
		}) })
	}) : null;
}
function q({ c: t, link: n = !1 }) {
	return /* @__PURE__ */ P("div", {
		className: "flex min-w-0 items-center gap-3",
		children: [/* @__PURE__ */ N(e, {
			src: t.portrait,
			name: t.name,
			size: "sm"
		}), /* @__PURE__ */ P("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ N("span", {
				className: "block truncate font-medium",
				children: t.name
			}), /* @__PURE__ */ P("span", {
				className: "block truncate text-xs text-muted",
				children: [t.corporation ? `[${t.corporation.ticker}] ` : "", n && t.owner ? /* @__PURE__ */ N(O, {
					to: `/p/capitals/registry/member/${t.owner_id}`,
					className: "hover:text-text",
					children: t.owner
				}) : t.corporation?.name ?? "No corporation"]
			})]
		})]
	});
}
function J({ a: e, hull: r, editable: i, onEdit: a, children: o }) {
	return /* @__PURE__ */ P("div", {
		className: "flex flex-wrap items-center gap-3 py-2",
		children: [
			/* @__PURE__ */ N(B, {
				hull: r,
				size: "size-8"
			}),
			/* @__PURE__ */ P("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ P("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ N("span", {
								className: "font-medium",
								children: r?.name ?? `Type ${e.type_id}`
							}),
							e.name && /* @__PURE__ */ P("span", {
								className: "text-sm text-muted",
								children: [
									"“",
									e.name,
									"”"
								]
							}),
							e.packaged && /* @__PURE__ */ P(t, {
								tone: "neutral",
								children: ["Packaged", e.quantity > 1 ? ` × ${e.quantity}` : ""]
							}),
							/* @__PURE__ */ N(K, { av: e.availability })
						]
					}),
					/* @__PURE__ */ P("div", {
						className: "mt-0.5 flex flex-wrap items-center gap-x-2 text-sm",
						children: [
							/* @__PURE__ */ N(L, { className: "size-3.5 text-subtle" }),
							/* @__PURE__ */ N(H, { place: e.place }),
							/* @__PURE__ */ N("span", {
								className: `text-xs ${e.where === "asset_safety" || e.where === "deliveries" ? "text-warning-fg" : "text-subtle"}`,
								children: e.where_label
							})
						]
					}),
					o
				]
			}),
			i && /* @__PURE__ */ P(n, {
				size: "sm",
				variant: "ghost",
				onClick: a,
				children: [/* @__PURE__ */ N(le, {}), " Availability"]
			})
		]
	});
}
function Y({ c: e, hulls: t, classes: n, editable: r = !1 }) {
	let [o, s] = j(null), c = n.filter((t) => e.fly[t.key].length > 0), l = new Set(e.owned.map((e) => e.type_id)), u = e.jump;
	return /* @__PURE__ */ P(i, { children: [
		/* @__PURE__ */ P("div", {
			className: "flex flex-wrap items-center justify-between gap-3 border-b border-border px-card py-3",
			children: [/* @__PURE__ */ N(q, { c: e }), /* @__PURE__ */ N(G, { c: e })]
		}),
		/* @__PURE__ */ P(a, {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ P("section", { children: [/* @__PURE__ */ N("div", {
					className: "mb-1 text-xs font-medium uppercase tracking-wide text-subtle",
					children: "Owned capitals"
				}), e.owned.length === 0 ? /* @__PURE__ */ N("p", {
					className: "text-sm text-muted",
					children: e.data.assets.status === "ok" ? "None in the synced assets." : "Assets not synced, so we can't tell."
				}) : /* @__PURE__ */ N("div", {
					className: "divide-y divide-border",
					children: e.owned.map((n) => /* @__PURE__ */ N(J, {
						a: n,
						hull: t[n.type_id],
						editable: r,
						onEdit: () => s({
							character: e,
							hull: t[n.type_id],
							current: n.availability
						}),
						children: !e.fly[n.class].includes(n.type_id) && e.data.skills.status === "ok" && /* @__PURE__ */ N("span", {
							className: "text-xs text-warning-fg",
							children: "Can't fly it yet"
						})
					}, n.item_id))
				})] }),
				/* @__PURE__ */ P("section", { children: [/* @__PURE__ */ N("div", {
					className: "mb-2 text-xs font-medium uppercase tracking-wide text-subtle",
					children: "Can fly"
				}), c.length === 0 ? /* @__PURE__ */ N("p", {
					className: "text-sm text-muted",
					children: e.data.skills.status === "ok" ? "No capital hull yet." : "Skills not synced, so we can't tell."
				}) : /* @__PURE__ */ N("div", {
					className: "space-y-2",
					children: c.map((n) => /* @__PURE__ */ P("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ N("span", {
							className: "w-36 shrink-0 text-sm text-muted",
							children: n.label
						}), e.fly[n.key].map((n) => {
							let i = e.availability[String(n)], a = /* @__PURE__ */ P("span", {
								className: `inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-sm ${i?.available ? "border-success" : "border-border"}`,
								children: [
									/* @__PURE__ */ N(B, {
										hull: t[n],
										size: "size-5"
									}),
									" ",
									t[n]?.name
								]
							});
							return r && !l.has(n) ? /* @__PURE__ */ N("button", {
								type: "button",
								title: "Say whether you'd fly one for ops",
								className: "hover:opacity-80",
								onClick: () => s({
									character: e,
									hull: t[n],
									current: i ?? null
								}),
								children: a
							}, n) : /* @__PURE__ */ N("span", { children: a }, n);
						})]
					}, n.key))
				})] }),
				/* @__PURE__ */ P("section", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ P("div", { children: [
						/* @__PURE__ */ N("div", {
							className: "mb-2 text-xs font-medium uppercase tracking-wide text-subtle",
							children: "Jump skills"
						}),
						u.skills ? /* @__PURE__ */ P("dl", {
							className: "grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm",
							children: [
								/* @__PURE__ */ N("dt", {
									className: "text-muted",
									children: "Jump Drive Operation"
								}),
								/* @__PURE__ */ N("dd", {
									className: "font-mono tabular-nums",
									children: u.skills.jdo
								}),
								/* @__PURE__ */ N("dt", {
									className: "text-muted",
									children: "Jump Drive Calibration"
								}),
								/* @__PURE__ */ N("dd", {
									className: "font-mono tabular-nums",
									children: u.skills.jdc
								}),
								/* @__PURE__ */ N("dt", {
									className: "text-muted",
									children: "Jump Fuel Conservation"
								}),
								/* @__PURE__ */ N("dd", {
									className: "font-mono tabular-nums",
									children: u.skills.jfc
								}),
								/* @__PURE__ */ N("dt", {
									className: "text-muted",
									children: "Infomorph Synchronizing"
								}),
								/* @__PURE__ */ N("dd", {
									className: "font-mono tabular-nums",
									children: u.skills.infomorph
								})
							]
						}) : /* @__PURE__ */ N("p", {
							className: "text-sm text-muted",
							children: "Skills not synced."
						}),
						/* @__PURE__ */ P("div", {
							className: "mt-2 space-y-1 text-sm",
							children: [
								u.location && /* @__PURE__ */ P("div", { children: [
									/* @__PURE__ */ N("span", {
										className: "text-muted",
										children: "Now: "
									}),
									/* @__PURE__ */ N(H, {
										place: u.location,
										short: !0
									}),
									u.flying && /* @__PURE__ */ P("span", {
										className: "text-muted",
										children: [" in a ", t[u.flying]?.name]
									})
								] }),
								u.fatigue_until && /* @__PURE__ */ P("div", {
									className: "text-warning-fg",
									children: ["Jump fatigue for ", C(u.fatigue_until)]
								}),
								u.clone_jump_ready_at ? /* @__PURE__ */ P("div", {
									className: "text-muted",
									children: ["Next clone jump in ", C(u.clone_jump_ready_at)]
								}) : e.data.clones.status === "ok" && /* @__PURE__ */ N("div", {
									className: "text-muted",
									children: "Clone jump ready"
								})
							]
						})
					] }), /* @__PURE__ */ P("div", { children: [/* @__PURE__ */ N("div", {
						className: "mb-2 text-xs font-medium uppercase tracking-wide text-subtle",
						children: "Clones"
					}), e.data.clones.status !== "ok" && !u.home && u.clones.length === 0 ? /* @__PURE__ */ N("p", {
						className: "text-sm text-muted",
						children: "Clones not synced."
					}) : /* @__PURE__ */ P("ul", {
						className: "space-y-1 text-sm",
						children: [
							u.home && /* @__PURE__ */ P("li", { children: [/* @__PURE__ */ N("span", {
								className: "text-muted",
								children: "Home: "
							}), /* @__PURE__ */ N(H, {
								place: u.home,
								short: !0
							})] }),
							u.clones.map((e) => /* @__PURE__ */ P("li", { children: [/* @__PURE__ */ N(H, {
								place: e.place,
								short: !0
							}), /* @__PURE__ */ P("span", {
								className: "text-xs text-subtle",
								children: [
									" ",
									e.name ? `“${e.name}” · ` : "",
									e.implants,
									" implant",
									e.implants === 1 ? "" : "s"
								]
							})] }, e.id)),
							u.clones.length === 0 && /* @__PURE__ */ N("li", {
								className: "text-muted",
								children: "No jump clones."
							})
						]
					})] })]
				})
			]
		}),
		r && /* @__PURE__ */ N(ue, {
			editing: o,
			onClose: () => s(null)
		})
	] });
}
function ue({ editing: e, onClose: t }) {
	let r = re(), [i, a] = j("none"), [o, c] = j("");
	ie(() => {
		e && (a(e.current ? e.current.available ? "available" : "unavailable" : "none"), c(e.current?.note ?? ""));
	}, [e]);
	let u = ne({
		mutationFn: () => S.put(`${R}/availability`, {
			character_id: e.character.id,
			type_id: e.hull.id,
			available: i === "none" ? null : i === "available",
			note: o
		}),
		onSuccess: () => {
			r.invalidateQueries({ queryKey: ["capitals"] }), E.success("Saved"), t();
		},
		onError: (e) => E.error(e.message)
	});
	return /* @__PURE__ */ N(s, {
		open: !!e,
		onOpenChange: (e) => !e && t(),
		title: e ? `${e.hull.name} on ${e.character.name}` : "",
		description: "Fleet commanders looking at the registry see this, with your note.",
		footer: /* @__PURE__ */ P(M, { children: [/* @__PURE__ */ N(n, {
			variant: "ghost",
			onClick: t,
			children: "Back"
		}), /* @__PURE__ */ N(n, {
			variant: "primary",
			loading: u.isPending,
			onClick: () => u.mutate(),
			children: "Save"
		})] }),
		children: /* @__PURE__ */ P("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ N(ee, {
				value: i,
				onChange: a,
				options: [
					{
						value: "available",
						label: "Available for ops"
					},
					{
						value: "unavailable",
						label: "Not available"
					},
					{
						value: "none",
						label: "Not said"
					}
				]
			}), i !== "none" && /* @__PURE__ */ N(l, {
				label: "Note (optional)",
				children: /* @__PURE__ */ N(v, {
					rows: 3,
					maxLength: 300,
					value: o,
					onChange: (e) => c(e.target.value),
					placeholder: "e.g. weekends only, needs a refit, on loan"
				})
			})]
		})
	});
}
function X(e, t = {}) {
	let n = new URLSearchParams();
	for (let [r, i] of Object.entries({
		...e,
		...t
	})) i && n.set(r, i);
	let r = n.toString();
	return r ? `?${r}` : "";
}
function de({ options: e, value: t, onChange: n, children: r }) {
	let i = (e) => n({
		...t,
		...e
	});
	return /* @__PURE__ */ P("div", {
		className: "flex flex-wrap items-center gap-2",
		children: [
			/* @__PURE__ */ N(d, {
				"aria-label": "Corporation",
				className: "w-56",
				value: t.corporation,
				onChange: (e) => i({ corporation: e.target.value }),
				options: [{
					value: "",
					label: "Every corporation"
				}, ...(e?.corporations ?? []).map((e) => ({
					value: String(e.id),
					label: `[${e.ticker}] ${e.name}`
				}))]
			}),
			/* @__PURE__ */ N(d, {
				"aria-label": "State",
				className: "w-44",
				value: t.state,
				onChange: (e) => i({ state: e.target.value }),
				options: [{
					value: "",
					label: "Every state"
				}, ...(e?.states ?? []).map((e) => ({
					value: String(e.id),
					label: e.name
				}))]
			}),
			/* @__PURE__ */ N(d, {
				"aria-label": "Group",
				className: "w-48",
				value: t.group,
				onChange: (e) => i({ group: e.target.value }),
				options: [{
					value: "",
					label: "Every group"
				}, ...(e?.groups ?? []).map((e) => ({
					value: String(e.id),
					label: e.name
				}))]
			}),
			r
		]
	});
}
//#endregion
//#region src/member.tsx
function fe() {
	let { id: t } = k(), { data: n, isLoading: r, error: i } = D({
		queryKey: [
			"capitals",
			"member",
			t
		],
		queryFn: () => S.get(`${R}/registry/members/${t}`)
	});
	return /* @__PURE__ */ P(M, { children: [/* @__PURE__ */ N(z, {
		to: "/p/capitals/registry?tab=members",
		children: "Registry"
	}), i ? /* @__PURE__ */ N("p", {
		className: "text-sm text-muted",
		children: i.message
	}) : r || !n ? /* @__PURE__ */ N(f, { className: "h-64" }) : /* @__PURE__ */ P(M, { children: [/* @__PURE__ */ N(u, {
		eyebrow: "Capital Registry",
		title: n.member.name,
		icon: /* @__PURE__ */ N(e, {
			src: n.member.portrait,
			name: n.member.name,
			size: "sm"
		}),
		description: `${n.characters.length} character${n.characters.length === 1 ? "" : "s"} you may view.`
	}), /* @__PURE__ */ N("div", {
		className: "grid gap-6 xl:grid-cols-2",
		children: n.characters.map((e) => /* @__PURE__ */ N(Y, {
			c: e,
			hulls: n.hulls,
			classes: n.classes
		}, e.id))
	})] })] });
}
//#endregion
//#region src/mine.tsx
function Z() {
	let { data: e, isLoading: t } = D({
		queryKey: ["capitals", "me"],
		queryFn: () => S.get(`${R}/me`)
	});
	return /* @__PURE__ */ P(M, { children: [/* @__PURE__ */ N(u, {
		eyebrow: "Capital Registry",
		title: "My capitals",
		icon: /* @__PURE__ */ N(I, {}),
		description: "The capitals your characters can fly and own, from their synced skills and assets, with jump skills and clones. Mark a hull available for ops so fleet commanders know whom to ask."
	}), t || !e ? /* @__PURE__ */ N(f, { className: "h-64" }) : e.characters.length === 0 ? /* @__PURE__ */ N(c, {
		icon: /* @__PURE__ */ N(I, {}),
		title: "No characters"
	}) : /* @__PURE__ */ N("div", {
		className: "grid gap-6 xl:grid-cols-2",
		children: e.characters.map((t) => /* @__PURE__ */ N(Y, {
			c: t,
			hulls: e.hulls,
			classes: e.classes,
			editable: !0
		}, t.id))
	})] });
}
//#endregion
//#region src/registry.tsx
function Q() {
	let [e, t] = A();
	return [
		{
			corporation: e.get("corporation") ?? "",
			state: e.get("state") ?? "",
			group: e.get("group") ?? ""
		},
		(n) => {
			let r = new URLSearchParams(e);
			for (let [e, t] of Object.entries(n)) t ? r.set(e, t) : r.delete(e);
			t(r, { replace: !0 });
		},
		e,
		(e) => t(e, { replace: !0 })
	];
}
function pe() {
	return D({
		queryKey: ["capitals", "options"],
		queryFn: () => S.get(`${R}/registry/options`)
	});
}
function me() {
	let [e, t, n, r] = Q(), i = n.get("tab") ?? "classes", { data: a } = pe();
	return /* @__PURE__ */ P(M, { children: [
		/* @__PURE__ */ N(u, {
			eyebrow: "Capital Registry",
			title: "Registry",
			icon: /* @__PURE__ */ N(ae, {}),
			description: `Who can fly and who owns each capital class, from synced skills and assets${a ? `, over the ${w(a.characters)} characters you may view` : ""}. Seeing where someone's hulls are goes in the snooper log.`
		}),
		/* @__PURE__ */ N("div", {
			className: "mb-4",
			children: /* @__PURE__ */ N(de, {
				options: a,
				value: e,
				onChange: t
			})
		}),
		/* @__PURE__ */ P(g, {
			value: i,
			onValueChange: (e) => {
				let t = new URLSearchParams(n);
				e === "classes" ? t.delete("tab") : t.set("tab", e), r(t);
			},
			variant: "pills",
			className: "space-y-4",
			items: [
				{
					value: "classes",
					label: "By class"
				},
				{
					value: "locations",
					label: "By location"
				},
				{
					value: "members",
					label: "By member"
				}
			],
			children: [
				/* @__PURE__ */ N(m, {
					value: "classes",
					children: /* @__PURE__ */ N(he, { filters: e })
				}),
				/* @__PURE__ */ N(m, {
					value: "locations",
					children: /* @__PURE__ */ N(_e, {
						filters: e,
						options: a
					})
				}),
				/* @__PURE__ */ N(m, {
					value: "members",
					children: /* @__PURE__ */ N(ve, {
						filters: e,
						options: a
					})
				})
			]
		})
	] });
}
function he({ filters: e }) {
	let t = X(e), { data: n, isLoading: s } = D({
		queryKey: [
			"capitals",
			"summary",
			t
		],
		queryFn: () => S.get(`${R}/registry/summary${t}`)
	});
	if (s || !n) return /* @__PURE__ */ N(f, { className: "h-64" });
	let c = Math.max(n.problems.skills, n.problems.assets);
	return /* @__PURE__ */ P("div", {
		className: "space-y-4",
		children: [
			n.hulls_known === 0 && /* @__PURE__ */ N(r, {
				tone: "warning",
				title: "No capital hulls in the static data",
				children: "The static data (SDE) hasn't been imported yet, so there's nothing to compare skills and assets against."
			}),
			c > 0 && /* @__PURE__ */ P(r, {
				tone: "warning",
				title: "Some characters can't be judged",
				children: [
					n.problems.skills,
					" of ",
					n.characters,
					" characters have skills and ",
					n.problems.assets,
					" have assets that are missing or older than two days (no login, scope missing or sync failing). They're flagged in the lists and may fly or own more than shown."
				]
			}),
			/* @__PURE__ */ N("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: n.classes.map((e) => /* @__PURE__ */ P(i, { children: [/* @__PURE__ */ N(o, {
					title: /* @__PURE__ */ N(O, {
						to: `/p/capitals/registry/class/${e.key}${t}`,
						className: "hover:underline",
						children: e.label
					}),
					description: `${e.hulls.length} hull${e.hulls.length === 1 ? "" : "s"}`
				}), /* @__PURE__ */ P(a, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ P("div", {
							className: "grid grid-cols-3 gap-2 text-center",
							children: [
								/* @__PURE__ */ N($, {
									label: "Pilots",
									value: e.pilots,
									hint: `${e.members} member${e.members === 1 ? "" : "s"}`
								}),
								/* @__PURE__ */ N($, {
									label: "Owned",
									value: e.owned,
									hint: `${e.owner_members} member${e.owner_members === 1 ? "" : "s"}`
								}),
								/* @__PURE__ */ N($, {
									label: "Available",
									value: e.available,
									hint: e.unavailable ? `${e.unavailable} not` : "for ops"
								})
							]
						}),
						e.hulls.length > 0 && /* @__PURE__ */ N("ul", {
							className: "divide-y divide-border text-sm",
							children: e.hulls.map((e) => /* @__PURE__ */ P("li", {
								className: "flex items-center gap-2 py-1.5",
								children: [
									/* @__PURE__ */ N("img", {
										src: e.icon,
										alt: "",
										className: "size-5 bg-surface-2",
										loading: "lazy"
									}),
									/* @__PURE__ */ N("span", {
										className: "flex-1 truncate",
										children: e.name
									}),
									/* @__PURE__ */ P("span", {
										className: "font-mono text-xs tabular-nums text-muted",
										title: "Can fly · owned",
										children: [
											e.pilots,
											" · ",
											e.owned
										]
									})
								]
							}, e.id))
						}),
						/* @__PURE__ */ N(O, {
							to: `/p/capitals/registry/class/${e.key}${t}`,
							className: "block text-sm text-accent-ink hover:underline",
							children: "Pilots →"
						})
					]
				})] }, e.key))
			})
		]
	});
}
function $({ label: e, value: t, hint: n }) {
	return /* @__PURE__ */ P("div", { children: [
		/* @__PURE__ */ N("div", {
			className: "text-xs text-muted",
			children: e
		}),
		/* @__PURE__ */ N("div", {
			className: "font-mono text-2xl font-semibold tabular-nums",
			children: w(t)
		}),
		/* @__PURE__ */ N("div", {
			className: "text-xs text-subtle",
			children: n
		})
	] });
}
function ge({ options: e, value: t, onChange: n }) {
	return /* @__PURE__ */ N(d, {
		"aria-label": "Class",
		className: "w-52",
		value: t,
		onChange: (e) => n(e.target.value),
		options: [{
			value: "",
			label: "Every class"
		}, ...(e?.classes ?? []).map((e) => ({
			value: e.key,
			label: e.label
		}))]
	});
}
function _e({ filters: e, options: n }) {
	let [r, a] = A(), o = r.get("cls") ?? "", s = X(e, { cls: o }), { data: l, isLoading: u } = D({
		queryKey: [
			"capitals",
			"locations",
			s
		],
		queryFn: () => S.get(`${R}/registry/locations${s}`)
	});
	return /* @__PURE__ */ P("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ N(ge, {
			options: n,
			value: o,
			onChange: (e) => {
				let t = new URLSearchParams(r);
				e ? t.set("cls", e) : t.delete("cls"), a(t, { replace: !0 });
			}
		}), u || !l ? /* @__PURE__ */ N(f, { className: "h-64" }) : l.locations.length === 0 ? /* @__PURE__ */ N(i, { children: /* @__PURE__ */ N(c, {
			icon: /* @__PURE__ */ N(L, {}),
			title: "No capitals found",
			description: "None in the synced assets of the characters you may view."
		}) }) : l.locations.map((e) => /* @__PURE__ */ P(i, { children: [/* @__PURE__ */ P("div", {
			className: "flex flex-wrap items-center justify-between gap-2 border-b border-border px-card py-3",
			children: [/* @__PURE__ */ P("span", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ N(L, { className: "size-4 text-subtle" }),
					" ",
					/* @__PURE__ */ N(H, { place: e.place })
				]
			}), /* @__PURE__ */ P(t, {
				tone: "accent",
				children: [
					e.count,
					" hull",
					e.count === 1 ? "" : "s"
				]
			})]
		}), /* @__PURE__ */ P(h, { children: [/* @__PURE__ */ N(p, { children: /* @__PURE__ */ P("tr", { children: [
			/* @__PURE__ */ N(y, { children: "Hull" }),
			/* @__PURE__ */ N(y, { children: "Pilot" }),
			/* @__PURE__ */ N(y, { children: "Where" }),
			/* @__PURE__ */ N(y, { children: "For ops" })
		] }) }), /* @__PURE__ */ N("tbody", { children: e.ships.map((e) => /* @__PURE__ */ P(x, { children: [
			/* @__PURE__ */ N(_, { children: /* @__PURE__ */ P("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ N(B, { hull: l.hulls[e.type_id] }), /* @__PURE__ */ P("span", { children: [/* @__PURE__ */ N("span", {
					className: "block font-medium",
					children: l.hulls[e.type_id]?.name
				}), (e.name || e.packaged) && /* @__PURE__ */ N("span", {
					className: "block text-xs text-muted",
					children: e.packaged ? `Packaged${e.quantity > 1 ? ` × ${e.quantity}` : ""}` : `“${e.name}”`
				})] })]
			}) }),
			/* @__PURE__ */ N(_, { children: /* @__PURE__ */ P("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ N(q, {
					c: e.character,
					link: !0
				}), /* @__PURE__ */ N(G, { c: e.character })]
			}) }),
			/* @__PURE__ */ N(_, {
				className: "text-sm text-muted",
				children: e.where_label
			}),
			/* @__PURE__ */ N(_, { children: /* @__PURE__ */ N(K, { av: e.availability }) })
		] }, e.item_id)) })] })] }, e.place?.id ?? 0))]
	});
}
function ve({ filters: n, options: r }) {
	let a = X(n), { data: o, isLoading: s } = D({
		queryKey: [
			"capitals",
			"members",
			a
		],
		queryFn: () => S.get(`${R}/registry/members${a}`)
	}), l = r?.classes ?? [];
	return s || !o ? /* @__PURE__ */ N(f, { className: "h-64" }) : o.members.length === 0 ? /* @__PURE__ */ N(i, { children: /* @__PURE__ */ N(c, {
		icon: /* @__PURE__ */ N(oe, {}),
		title: "Nobody here"
	}) }) : /* @__PURE__ */ P(i, { children: [/* @__PURE__ */ P(h, { children: [/* @__PURE__ */ N(p, { children: /* @__PURE__ */ P("tr", { children: [
		/* @__PURE__ */ N(y, { children: "Member" }),
		l.map((e) => /* @__PURE__ */ N(y, {
			className: "text-center",
			title: "Characters who can fly it · hulls owned",
			children: e.label
		}, e.key)),
		/* @__PURE__ */ N(y, { children: "Data" })
	] }) }), /* @__PURE__ */ N("tbody", { children: o.members.map((n) => /* @__PURE__ */ P(x, { children: [
		/* @__PURE__ */ N(_, { children: /* @__PURE__ */ P(O, {
			to: `/p/capitals/registry/member/${n.id}`,
			className: "flex items-center gap-3 hover:underline",
			children: [/* @__PURE__ */ N(e, {
				src: n.portrait,
				name: n.name,
				size: "sm"
			}), /* @__PURE__ */ P("span", { children: [/* @__PURE__ */ N("span", {
				className: "block font-medium",
				children: n.name
			}), /* @__PURE__ */ P("span", {
				className: "block text-xs text-muted",
				children: [
					n.characters,
					" character",
					n.characters === 1 ? "" : "s"
				]
			})] })]
		}) }),
		l.map((e) => {
			let t = n.classes[e.key];
			return /* @__PURE__ */ N(_, {
				className: "text-center font-mono text-sm tabular-nums",
				children: t.fly || t.own ? /* @__PURE__ */ P("span", { children: [
					/* @__PURE__ */ N("span", {
						className: t.fly ? "" : "text-subtle",
						children: t.fly
					}),
					/* @__PURE__ */ N("span", {
						className: "text-subtle",
						children: " · "
					}),
					/* @__PURE__ */ N("span", {
						className: t.own ? "text-accent-ink" : "text-subtle",
						children: t.own
					})
				] }) : /* @__PURE__ */ N("span", {
					className: "text-subtle",
					children: "—"
				})
			}, e.key);
		}),
		/* @__PURE__ */ N(_, { children: n.problems > 0 ? /* @__PURE__ */ P(t, {
			tone: "warning",
			children: [n.problems, " not synced"]
		}) : /* @__PURE__ */ N(t, {
			tone: "success",
			children: "OK"
		}) })
	] }, n.id)) })] }), /* @__PURE__ */ N("div", {
		className: "border-t border-border px-card py-2 text-xs text-subtle",
		children: "Each class: characters who can fly it · hulls owned."
	})] });
}
function ye() {
	let { key: e } = k(), [t] = Q(), n = X(t), { data: a, isLoading: o, error: s } = D({
		queryKey: [
			"capitals",
			"class",
			e,
			n
		],
		queryFn: () => S.get(`${R}/registry/classes/${e}${n}`)
	});
	return /* @__PURE__ */ P(M, { children: [/* @__PURE__ */ N(z, {
		to: `/p/capitals/registry${n}`,
		children: "Registry"
	}), s ? /* @__PURE__ */ N("p", {
		className: "text-sm text-muted",
		children: s.message
	}) : o || !a ? /* @__PURE__ */ N(f, { className: "h-64" }) : /* @__PURE__ */ P(M, { children: [
		/* @__PURE__ */ N(u, {
			eyebrow: "Capital Registry",
			title: a.class.label,
			icon: /* @__PURE__ */ N(I, {}),
			description: `${a.pilots.length} character${a.pilots.length === 1 ? "" : "s"} who can fly or own one, owners first.`
		}),
		a.unknown_count > 0 && /* @__PURE__ */ P(r, {
			tone: "warning",
			title: `${a.unknown_count} character${a.unknown_count === 1 ? "" : "s"} without synced skills`,
			className: "mb-4",
			children: [
				a.unknown.slice(0, 30).map((e) => e.name).join(", "),
				a.unknown_count > 30 ? " and more" : "",
				". They may fly it too."
			]
		}),
		a.pilots.length === 0 ? /* @__PURE__ */ N(i, { children: /* @__PURE__ */ N(c, {
			icon: /* @__PURE__ */ N(I, {}),
			title: "Nobody yet"
		}) }) : /* @__PURE__ */ N(i, { children: /* @__PURE__ */ P(h, { children: [/* @__PURE__ */ N(p, { children: /* @__PURE__ */ P("tr", { children: [
			/* @__PURE__ */ N(y, { children: "Pilot" }),
			/* @__PURE__ */ N(y, { children: "Can fly" }),
			/* @__PURE__ */ N(y, { children: "Owns" })
		] }) }), /* @__PURE__ */ N("tbody", { children: a.pilots.map((e) => /* @__PURE__ */ P(x, { children: [
			/* @__PURE__ */ N(_, {
				className: "align-top",
				children: /* @__PURE__ */ P("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ N(q, {
						c: e,
						link: !0
					}), /* @__PURE__ */ N(G, { c: e })]
				})
			}),
			/* @__PURE__ */ N(_, {
				className: "align-top",
				children: /* @__PURE__ */ P("div", {
					className: "flex flex-wrap gap-1",
					children: [e.fly.map((e) => /* @__PURE__ */ N(B, {
						hull: a.hulls[e],
						size: "size-7"
					}, e)), e.fly.length === 0 && /* @__PURE__ */ N("span", {
						className: "text-sm text-subtle",
						children: "—"
					})]
				})
			}),
			/* @__PURE__ */ N(_, {
				className: "align-top",
				children: e.owned.length === 0 ? /* @__PURE__ */ N("span", {
					className: "text-sm text-subtle",
					children: "—"
				}) : /* @__PURE__ */ N("div", {
					className: "divide-y divide-border",
					children: e.owned.map((e) => /* @__PURE__ */ N(J, {
						a: e,
						hull: a.hulls[e.type_id]
					}, e.item_id))
				})
			})
		] }, e.id)) })] }) })
	] })] });
}
//#endregion
//#region src/index.tsx
function be() {
	let { data: e, isLoading: t } = D({
		queryKey: [
			"capitals",
			"summary",
			""
		],
		queryFn: () => S.get(`${R}/registry/summary`),
		refetchInterval: 6e5
	});
	return t || !e ? /* @__PURE__ */ N(f, { className: "h-24" }) : /* @__PURE__ */ N(O, {
		to: "/p/capitals/registry",
		className: "block",
		children: /* @__PURE__ */ P("ul", {
			className: "space-y-1 text-sm",
			children: [e.classes.filter((e) => e.pilots || e.owned).map((e) => /* @__PURE__ */ P("li", {
				className: "flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ N("span", {
					className: "text-muted",
					children: e.label
				}), /* @__PURE__ */ P("span", {
					className: "font-mono tabular-nums",
					children: [
						w(e.pilots),
						" ",
						/* @__PURE__ */ N("span", {
							className: "text-subtle",
							children: "pilots ·"
						}),
						" ",
						w(e.owned),
						" ",
						/* @__PURE__ */ N("span", {
							className: "text-subtle",
							children: "owned"
						})
					]
				})]
			}, e.key)), !e.classes.some((e) => e.pilots || e.owned) && /* @__PURE__ */ N("li", {
				className: "text-muted",
				children: "No capital pilots found yet."
			})]
		})
	});
}
var xe = te({
	routes: [
		{
			path: "",
			Component: Z
		},
		{
			path: "registry",
			Component: me
		},
		{
			path: "registry/class/:key",
			Component: ye
		},
		{
			path: "registry/member/:id",
			Component: fe
		}
	],
	widgets: [{
		id: "registry",
		title: "Capitals",
		Component: be,
		size: "sm",
		order: 50,
		permission: "capitals.view_registry"
	}]
});
//#endregion
export { xe as default };

export const classes = ["!data","!o","!short","!sys","@conduit/sdk","@tanstack/react-query","a","accent","align-top","allow","alt","and","are","aria-label","as","asset_safety","assets","at","av","availability","available","be","been","bg-surface-2","block","boolean","border","border-b","border-border","border-success","border-t","but","button","by","c","can","can_view_registry","capital","capitals","carrier","character","character_id","characters","children","chip","choice","class","className","classes","clone","clone_jump_ready_at","clones","cls","commanders","compare","const","container","content","corporation","corporations","count","counted","current","currentColor","cx","cy","d","danger","data","date","days","default","deliveries","description","divide-border","divide-y","docked","doesn","dreadnought","each","editable","editing","else","error","export","extends","extra","eyebrow","fails","false","fatigue","fatigue_until","fax","few","fill","filters","flagged","fleet","flex","flex-1","flex-wrap","flies","fly","flyable","flying","font-medium","font-mono","font-semibold","footer","for","found","from","function","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-6","gap-x-1.5","gap-x-2","gap-x-4","gap-y-1","get","ghost","goes","grid","grid-cols-3","grid-cols-[1fr_auto]","group","groups","h-24","h-64","hangar","hasn","have","here","hint","home","hover:opacity-80","hover:text-text","hover:underline","hull","hulls","hulls_known","icon","icons","id","if","implant","implants","import","imported","in","industrial","infomorph","inline","inline-flex","interface","is","isLoading","isn","it","item_id","items","items-baseline","items-center","j","jdc","jdo","jfc","judged","jump","jump_freighter","justify-between","keeps","key","kind","know","label","lancer","last","lazy","length","link","lists","live","loading","loan","location","locations","looking","m12","m13.41","m21.73","maxLength","may","mb-1","mb-2","mb-4","md:grid-cols-2","me","member","members","min-w-0","missing","missing_scopes","more","mt-0.5","mt-2","mutationFn","name","needs","neutral","never","new","next","none","not","note","nothing","null","number","of","ok","older","on","onChange","onClick","onClose","onEdit","onError","onOpenChange","onSuccess","onValueChange","one","open","ops","options","or","order","other","over","own","owned","ownedTypes","owner","owner_id","owner_members","owners","owns","p","packaged","pages","patch","path","permission","pills","pilot","pilots","place","placeholder","portrait","primary","problem","problems","px-1.5","px-card","py-0.5","py-1.5","py-2","py-3","q","qc","quantity","queryFn","queryKey","re","react","react-router","ready","refetchInterval","region","registry","replace","rest","return","round","routes","rows","s","said","save","saying","scope","sec","sections","security","see","set","setChoice","setCls","setEditing","setNote","setParams","several","ship_bay","ships","short","shrink-0","silently","site","size","size-3","size-3.5","size-4","size-5","size-6","size-7","size-8","skills","sm","sm:grid-cols-2","snooper","so","solar_system","someone","space","space-y-1","space-y-2","space-y-3","space-y-4","space-y-5","src","stale","state","states","static","station","status","stopped","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structure","style","success","summary","supercarrier","sync","synced","sys","system","t","tab","tabular-nums","text-2xl","text-accent-ink","text-center","text-danger-fg","text-muted","text-sm","text-subtle","text-success-fg","text-warning-fg","text-xs","than","that","the","their","there","ticker","titan","title","to","token_invalid","tone","tracking-wide","true","truncate","two","type","type_id","typeof","unavailable","undefined","unknown","unknown_count","updated_at","uppercase","useParams","useQuery","useQueryClient","useSearchParams","useState","used","v","value","variant","view","viewBox","view_registry","viewer","void","w-36","w-44","w-48","w-52","w-56","warning","warnings","we","weekends","where","where_label","whether","which","who","whom","whose","widgets","with","without","working","xl:grid-cols-2","xl:grid-cols-3","yet","you","your"];
