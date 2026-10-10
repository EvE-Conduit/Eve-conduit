import { Badge as e, Button as t, Card as n, ConfirmDialog as r, Dialog as i, DropdownContent as a, DropdownItem as o, DropdownMenu as s, DropdownSeparator as c, DropdownTrigger as l, EmptyState as u, Field as d, Input as f, PageHeader as p, Segmented as m, Select as h, Skeleton as g, StatCard as _, SwitchRow as v, TabPanel as y, Tabs as b, Textarea as x, Tooltip as S, api as C, cn as w, dateTime as T, definePlugin as E, eveAndLocal as D, localDateTime as O, timeAgo as k, toast as A } from "@conduit/sdk";
import { useMutation as j, useQuery as M, useQueryClient as N } from "@tanstack/react-query";
import { Link as P } from "react-router";
import { useEffect as F, useRef as I, useState as L } from "react";
import { Fragment as R, jsx as z, jsxs as B } from "react/jsx-runtime";
//#region src/types.ts
var V = "/api/p/timers", ee = [
	{
		value: "armor",
		label: "Armor"
	},
	{
		value: "hull",
		label: "Hull"
	},
	{
		value: "anchoring",
		label: "Anchoring"
	},
	{
		value: "unanchoring",
		label: "Unanchoring"
	},
	{
		value: "sov",
		label: "Sovereignty"
	},
	{
		value: "moon",
		label: "Moon extraction"
	},
	{
		value: "other",
		label: "Other"
	}
], te = Object.fromEntries(ee.map((e) => [e.value, e.label])), H = {
	friendly: {
		label: "Ours",
		badge: "success",
		stripe: "bg-success"
	},
	hostile: {
		label: "Hostile",
		badge: "danger",
		stripe: "bg-danger"
	},
	neutral: {
		label: "Neutral",
		badge: "neutral",
		stripe: "bg-border-strong"
	}
};
function U(e) {
	return e >= .5 ? "text-success-fg" : e > 0 ? "text-warning-fg" : "text-danger-fg";
}
//#endregion
//#region src/roles.tsx
function W(e = !0) {
	return M({
		queryKey: ["timers", "discord-roles"],
		queryFn: () => C.get(`${V}/discord-roles`),
		enabled: e,
		staleTime: 6e5
	});
}
function ne(e) {
	return e ? `#${e.toString(16).padStart(6, "0")}` : void 0;
}
function re({ roles: e, value: t, onChange: n }) {
	let r = new Set(e.map((e) => e.id)), i = [...e, ...t.filter((e) => !r.has(e)).map((e) => ({
		id: e,
		name: `Role ${e}`,
		color: 0
	}))], a = (e) => n(t.includes(e) ? t.filter((t) => t !== e) : [...t, e]);
	return i.length === 0 ? /* @__PURE__ */ z("p", {
		className: "text-xs text-muted",
		children: "The Discord server has no roles to pick."
	}) : /* @__PURE__ */ z("div", {
		className: "flex flex-wrap gap-1.5",
		children: i.map((e) => {
			let n = t.includes(e.id);
			return /* @__PURE__ */ B("button", {
				type: "button",
				"aria-pressed": n,
				onClick: () => a(e.id),
				className: w("flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors", n ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text"),
				children: [
					/* @__PURE__ */ z("span", {
						className: "size-2 rounded-full border border-border-strong",
						style: { background: ne(e.color) }
					}),
					"@",
					e.name
				]
			}, e.id);
		})
	});
}
//#endregion
//#region src/time.ts
var G = (e) => String(e).padStart(2, "0");
function ie(e, t) {
	let n = Math.round((new Date(e).getTime() - t) / 1e3);
	if (n <= 0) return "";
	let r = Math.floor(n / 86400);
	n -= r * 86400;
	let i = Math.floor(n / 3600);
	n -= i * 3600;
	let a = Math.floor(n / 60);
	return n -= a * 60, r ? `${r}d ${G(i)}h ${G(a)}m` : `${G(i)}:${G(a)}:${G(n)}`;
}
function ae(e, t) {
	let n = Math.max(0, Math.round((new Date(e).getTime() - t) / 1e3)), r = Math.floor(n / 86400);
	n -= r * 86400;
	let i = Math.floor(n / 3600), a = Math.floor((n - i * 3600) / 60);
	return r ? `${r}d ${i}h` : i ? `${i}h ${a}m` : `${a}m`;
}
function oe(e) {
	let t = e.trim().toLowerCase().replace(/\s+/g, " ");
	if (!t) return null;
	let n = 0, r = t, i = /^(\d+)\s*d(?:ays?)?\b\s*/.exec(r);
	i && (n += Number(i[1]) * 86400, r = r.slice(i[0].length));
	let a = /^(\d{1,3}):(\d{2})(?::(\d{2}))?$/.exec(r);
	if (a) return n + Number(a[1]) * 3600 + Number(a[2]) * 60 + Number(a[3] ?? 0);
	if (!r) return n || null;
	let o = !1, s = /(\d+(?:\.\d+)?)\s*(h(?:ours?|rs?)?|m(?:in(?:ute)?s?)?|s(?:ec(?:ond)?s?)?)(?![a-z])\s*/gy, c, l = 0;
	for (s.lastIndex = 0; (c = s.exec(r)) !== null;) {
		o = !0;
		let e = Number(c[1]), t = c[2][0];
		n += t === "h" ? e * 3600 : t === "m" ? e * 60 : e, l = s.lastIndex;
	}
	return !o || l !== r.length ? null : n;
}
function K(e) {
	if (!e) return "";
	let t = new Date(e);
	return `${t.getFullYear()}-${G(t.getMonth() + 1)}-${G(t.getDate())}T${G(t.getHours())}:${G(t.getMinutes())}`;
}
function se(e) {
	return e ? new Date(e).toISOString() : null;
}
function q(e, t) {
	let n = (e) => Math.floor(e / 864e5), r = n(new Date(e).getTime()) - n(t), i = new Date(e).toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "UTC"
	});
	return r === 0 ? `Today · ${i}` : r === 1 ? `Tomorrow · ${i}` : r === -1 ? `Yesterday · ${i}` : i;
}
//#endregion
//#region src/editor.tsx
function ce({ timer: e, onClose: n }) {
	let r = N(), { data: a } = M({
		queryKey: ["timers", "types"],
		queryFn: () => C.get(`${V}/types`),
		staleTime: 36e5
	}), { data: o } = M({
		queryKey: ["timers", "settings"],
		queryFn: () => C.get(`${V}/settings`),
		staleTime: 6e5
	}), s = W(), [c, l] = L({
		name: e?.name ?? "",
		structure_type: e?.structure_type ?? "",
		system: e ? {
			id: e.system.id,
			name: e.system.name,
			region: e.system.region,
			security: e.system.security
		} : null,
		kind: e?.kind ?? "armor",
		side: e?.side ?? "friendly",
		owner: e?.owner ?? "",
		notes: e?.notes ?? "",
		important: e?.important ?? !1,
		notify: !0,
		structure_id: e?.structure_id ?? null,
		ping: e?.ping ?? !1,
		ping_roles: e?.ping_roles ?? null
	}), u = c.ping_roles ?? o?.default_ping_roles ?? [], [p, g] = L(e ? "exact" : "left"), [_, y] = L(""), [b, S] = L(K(e?.ends_at)), [w, E] = L(Date.now()), D = (e) => l((t) => ({
		...t,
		...e
	})), O = (e) => {
		D({
			name: e.name,
			structure_type: e.structure_type,
			structure_id: e.structure_id,
			...e.system ? { system: e.system } : {},
			...e.owner ? { owner: e.owner } : {},
			...e.ours ? { side: "friendly" } : {},
			...e.kind ? { kind: e.kind } : {}
		}), e.ends_at && (g("exact"), S(K(e.ends_at)));
	}, k = p === "left" ? oe(_) : null, P = p === "left" ? k == null ? null : new Date(w + k * 1e3).toISOString() : se(b), F = !!c.name.trim() && !!c.system && !!P, I = j({
		mutationFn: () => {
			let t = {
				name: c.name,
				structure_type: c.structure_type,
				system: c.system.id,
				kind: c.kind,
				side: c.side,
				owner: c.owner,
				ends_at: P,
				notes: c.notes,
				important: c.important,
				notify: c.notify,
				structure_id: c.structure_id,
				ping: c.ping,
				ping_roles: c.ping ? u : []
			};
			return e ? C.put(`${V}/${e.id}`, t) : C.post(V, t);
		},
		onSuccess: (t) => {
			r.invalidateQueries({ queryKey: ["timers"] }), A.success(e ? "Timer updated" : `Timer added: ${t.name} comes out ${T(t.ends_at)}`), n();
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ z(i, {
		open: !0,
		onOpenChange: (e) => !e && n(),
		title: e ? "Edit timer" : "Add timer",
		size: "lg",
		footer: /* @__PURE__ */ B(R, { children: [
			/* @__PURE__ */ z("span", {
				className: "mr-auto self-center text-xs text-muted",
				children: P ? /* @__PURE__ */ B(R, { children: ["Comes out ", /* @__PURE__ */ z("span", {
					className: "text-text",
					children: T(P)
				})] }) : p === "left" ? "Type the time left as the game shows it." : "Pick the exact time."
			}),
			/* @__PURE__ */ z(t, {
				variant: "ghost",
				onClick: n,
				children: "Cancel"
			}),
			/* @__PURE__ */ z(t, {
				variant: "primary",
				disabled: !F,
				loading: I.isPending,
				onClick: () => I.mutate(),
				children: e ? "Save" : "Add timer"
			})
		] }),
		children: /* @__PURE__ */ B("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ B("div", {
					className: "grid gap-4 sm:grid-cols-[1fr_200px]",
					children: [/* @__PURE__ */ z(ue, {
						value: c.name,
						picked: c.structure_id,
						onChange: (e) => D({
							name: e,
							structure_id: null
						}),
						onPick: O
					}), /* @__PURE__ */ B(d, {
						label: "Type",
						children: [/* @__PURE__ */ z(f, {
							list: "timers-structure-types",
							value: c.structure_type,
							maxLength: 60,
							onChange: (e) => D({ structure_type: e.target.value }),
							placeholder: "Fortizar"
						}), /* @__PURE__ */ z("datalist", {
							id: "timers-structure-types",
							children: (a ?? []).map((e) => /* @__PURE__ */ z("option", { value: e.name }, e.name))
						})]
					})]
				}),
				/* @__PURE__ */ B("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ z(le, {
						value: c.system,
						onChange: (e) => D({ system: e })
					}), /* @__PURE__ */ z(d, {
						label: "Owner",
						hint: "Corporation or alliance.",
						children: /* @__PURE__ */ z(f, {
							value: c.owner,
							maxLength: 120,
							onChange: (e) => D({ owner: e.target.value }),
							placeholder: "Goonswarm Federation"
						})
					})]
				}),
				/* @__PURE__ */ B("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ z(d, {
						label: "Timer",
						children: /* @__PURE__ */ z(h, {
							value: c.kind,
							onChange: (e) => D({ kind: e.target.value }),
							options: ee.map((e) => ({
								value: e.value,
								label: e.label
							}))
						})
					}), /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("div", {
						className: "mb-1.5 text-[13px] font-medium",
						children: "Whose"
					}), /* @__PURE__ */ z(m, {
						value: c.side,
						onChange: (e) => D({ side: e }),
						size: "sm",
						className: "w-full",
						options: [
							{
								value: "friendly",
								label: "Ours"
							},
							{
								value: "hostile",
								label: "Hostile"
							},
							{
								value: "neutral",
								label: "Neutral"
							}
						]
					})] })]
				}),
				/* @__PURE__ */ B("div", { children: [/* @__PURE__ */ B("div", {
					className: "mb-1.5 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ B("span", {
						className: "text-[13px] font-medium",
						children: ["When it comes out ", /* @__PURE__ */ z("span", {
							className: "text-danger-fg",
							children: "*"
						})]
					}), /* @__PURE__ */ z(m, {
						value: p,
						onChange: g,
						size: "sm",
						options: [{
							value: "left",
							label: "Time left"
						}, {
							value: "exact",
							label: "Exact time"
						}]
					})]
				}), p === "left" ? /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(f, {
					value: _,
					onChange: (e) => {
						y(e.target.value), E(Date.now());
					},
					placeholder: "1d 4h 23m",
					className: "font-mono",
					"aria-invalid": !!_ && k == null
				}), /* @__PURE__ */ B("p", {
					className: "mt-1.5 text-xs text-muted",
					children: [
						"As the game shows it: ",
						/* @__PURE__ */ z("span", {
							className: "font-mono",
							children: "1d 4h 23m"
						}),
						", ",
						/* @__PURE__ */ z("span", {
							className: "font-mono",
							children: "4h 23m"
						}),
						", ",
						/* @__PURE__ */ z("span", {
							className: "font-mono",
							children: "45m"
						}),
						" or ",
						/* @__PURE__ */ z("span", {
							className: "font-mono",
							children: "4:23"
						}),
						". Counted from now."
					]
				})] }) : /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(f, {
					type: "datetime-local",
					value: b,
					onChange: (e) => S(e.target.value)
				}), /* @__PURE__ */ B("p", {
					className: "mt-1.5 text-xs text-muted",
					children: [
						"In your own time zone",
						P ? /* @__PURE__ */ B(R, { children: ["; that's ", T(P)] }) : null,
						"."
					]
				})] })] }),
				/* @__PURE__ */ z(d, {
					label: "Notes",
					hint: "Form-up, doctrine, comms, what to expect.",
					children: /* @__PURE__ */ z(x, {
						rows: 3,
						value: c.notes,
						maxLength: 5e3,
						onChange: (e) => D({ notes: e.target.value }),
						placeholder: "Form up 30 minutes before on Mumble. Doctrine: Ferox fleet."
					})
				}),
				/* @__PURE__ */ B("div", {
					className: "divide-y divide-border border border-border px-3",
					children: [
						/* @__PURE__ */ z(v, {
							label: "Everyone is expected",
							description: "Members are told now and reminded before it comes out, even if they muted timers.",
							checked: c.important,
							onCheckedChange: (t) => D({
								important: t,
								...t && !e ? { ping: !0 } : {}
							})
						}),
						/* @__PURE__ */ z(v, {
							label: "Ping Discord",
							description: s.data?.available ? "Discord webhooks that ping mention their own setting and the roles below when it's added, moved and reminded." : "Discord webhooks that ping (Administration → Integrations) mention their setting when it's added, moved and reminded.",
							checked: c.ping,
							onCheckedChange: (e) => D({ ping: e })
						}),
						c.ping && s.data?.available && /* @__PURE__ */ B("div", {
							className: "py-3",
							children: [/* @__PURE__ */ z("div", {
								className: "mb-1.5 text-[13px] font-medium",
								children: "Roles to ping"
							}), s.data.error ? /* @__PURE__ */ z("p", {
								className: "text-xs text-warning-fg",
								children: s.data.error
							}) : /* @__PURE__ */ z(re, {
								roles: s.data.roles,
								value: u,
								onChange: (e) => D({ ping_roles: e })
							})]
						}),
						!e && /* @__PURE__ */ z(v, {
							label: "Tell members it's been added",
							description: "Under the bell. Webhooks such as Discord hear about it either way.",
							checked: c.notify || c.important,
							disabled: c.important,
							onCheckedChange: (e) => D({ notify: e })
						})
					]
				})
			]
		})
	});
}
function le({ value: e, onChange: t }) {
	let [n, r] = L(e?.name ?? ""), [i, a] = L(!1), [o, s] = L(n), c = I(null);
	F(() => {
		e && e.name !== n && (r(e.name), a(!1));
	}, [e?.id]), F(() => {
		let e = setTimeout(() => s(n), 150);
		return () => clearTimeout(e);
	}, [n]);
	let { data: l } = M({
		queryKey: [
			"timers",
			"systems",
			o
		],
		queryFn: () => C.get(`${V}/systems?q=${encodeURIComponent(o)}`),
		enabled: i && o.trim().length >= 2 && o !== e?.name,
		staleTime: 6e5
	});
	F(() => {
		let e = (e) => {
			c.current && !c.current.contains(e.target) && a(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, []);
	let u = (e) => {
		t(e), r(e.name), a(!1);
	}, p = i && o !== e?.name ? l ?? [] : [];
	return /* @__PURE__ */ B("div", {
		ref: c,
		className: "relative",
		children: [/* @__PURE__ */ z(d, {
			label: "Solar system",
			required: !0,
			hint: e ? `${e.region} · ${e.security.toFixed(1)}` : "Start typing the name.",
			children: /* @__PURE__ */ z(f, {
				value: n,
				onChange: (n) => {
					r(n.target.value), a(!0), e && n.target.value !== e.name && t(null);
				},
				onFocus: () => a(!0),
				onKeyDown: (e) => {
					e.key === "Enter" && p[0] && (e.preventDefault(), u(p[0])), e.key === "Escape" && a(!1);
				},
				placeholder: "Jita",
				autoComplete: "off",
				"aria-autocomplete": "list",
				"aria-expanded": p.length > 0
			})
		}), p.length > 0 && /* @__PURE__ */ z("ul", {
			role: "listbox",
			className: "absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto border border-border bg-surface shadow-e2",
			children: p.map((t) => /* @__PURE__ */ z("li", {
				role: "option",
				"aria-selected": t.id === e?.id,
				children: /* @__PURE__ */ B("button", {
					type: "button",
					onMouseDown: (e) => e.preventDefault(),
					onClick: () => u(t),
					className: "flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-hover",
					children: [
						/* @__PURE__ */ z("span", {
							className: w("font-mono text-xs font-semibold tabular-nums", U(t.security)),
							children: t.security.toFixed(1)
						}),
						/* @__PURE__ */ z("span", {
							className: "font-medium",
							children: t.name
						}),
						/* @__PURE__ */ z("span", {
							className: "ml-auto truncate text-xs text-subtle",
							children: t.region
						})
					]
				})
			}, t.id))
		})]
	});
}
var J = {
	shield_vulnerable: "Shields up",
	armor_vulnerable: "Armor vulnerable",
	hull_vulnerable: "Hull vulnerable",
	armor_reinforce: "Armor reinforced",
	hull_reinforce: "Hull reinforced",
	anchoring: "Anchoring",
	anchor_vulnerable: "Anchoring",
	unanchored: "Unanchored",
	fitting_invulnerable: "Fitting",
	onlining_vulnerable: "Onlining",
	deploy_vulnerable: "Deploying",
	unknown: ""
};
function ue({ value: e, picked: t, onChange: n, onPick: r }) {
	let [i, a] = L(!1), [o, s] = L(e), c = I(null);
	F(() => {
		let t = setTimeout(() => s(e), 150);
		return () => clearTimeout(t);
	}, [e]);
	let { data: l } = M({
		queryKey: [
			"timers",
			"structures",
			o
		],
		queryFn: () => C.get(`${V}/structures?q=${encodeURIComponent(o)}`),
		enabled: i && t == null && o.trim().length >= 2,
		staleTime: 6e4
	});
	F(() => {
		let e = (e) => {
			c.current && !c.current.contains(e.target) && a(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, []);
	let u = (e) => {
		r(e), a(!1);
	}, p = i && t == null && o.trim().length >= 2 ? l ?? [] : [];
	return /* @__PURE__ */ B("div", {
		ref: c,
		className: "relative",
		children: [/* @__PURE__ */ z(d, {
			label: "Structure",
			required: !0,
			hint: t == null ? "Its name as shown in game. Type a name or system to pick a structure the site knows." : "Filled in from what the site knows about it; change anything.",
			children: /* @__PURE__ */ z(f, {
				value: e,
				maxLength: 200,
				onChange: (e) => {
					n(e.target.value), a(!0);
				},
				onFocus: () => a(!0),
				onKeyDown: (e) => {
					e.key === "Enter" && p[0] && (e.preventDefault(), u(p[0])), e.key === "Escape" && a(!1);
				},
				placeholder: "M-OEE8 Keepstar",
				autoComplete: "off",
				"aria-autocomplete": "list",
				"aria-expanded": p.length > 0,
				autoFocus: !0
			})
		}), p.length > 0 && /* @__PURE__ */ z("ul", {
			role: "listbox",
			className: "absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto border border-border bg-surface shadow-e2",
			children: p.map((e) => /* @__PURE__ */ z("li", {
				role: "option",
				"aria-selected": !1,
				children: /* @__PURE__ */ B("button", {
					type: "button",
					onMouseDown: (e) => e.preventDefault(),
					onClick: () => u(e),
					className: "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-hover",
					children: [
						e.icon ? /* @__PURE__ */ z("img", {
							src: e.icon,
							alt: "",
							className: "size-7 shrink-0 border border-border bg-bg",
							loading: "lazy"
						}) : /* @__PURE__ */ z("span", { className: "size-7 shrink-0 border border-border bg-bg" }),
						/* @__PURE__ */ B("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ B("span", {
								className: "block truncate font-medium",
								children: [e.name, e.ours && /* @__PURE__ */ z("span", {
									className: "ml-2 text-xs font-normal text-success-fg",
									children: "Ours"
								})]
							}), /* @__PURE__ */ B("span", {
								className: "block truncate text-xs text-subtle",
								children: [
									e.structure_type,
									e.structure_type && e.system ? " · " : "",
									e.system && /* @__PURE__ */ B(R, { children: [
										/* @__PURE__ */ z("span", {
											className: w("font-mono tabular-nums", U(e.system.security)),
											children: e.system.security.toFixed(1)
										}),
										" ",
										e.system.name,
										e.system.region ? ` · ${e.system.region}` : ""
									] }),
									e.owner && !e.ours ? ` · ${e.owner}` : ""
								]
							})]
						}),
						/* @__PURE__ */ z("span", {
							className: w("shrink-0 text-xs", e.ends_at ? "text-danger-fg" : "text-subtle"),
							children: e.ends_at ? `${J[e.state] ?? e.state} · ${T(e.ends_at)}` : J[e.state] ?? e.state
						})
					]
				})
			}, e.structure_id))
		})]
	});
}
//#endregion
//#region src/icons.tsx
function Y({ children: e, className: t = "size-4" }) {
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
var X = (e) => /* @__PURE__ */ B(Y, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M10 2h4" }),
		/* @__PURE__ */ z("path", { d: "M12 14v-4" }),
		/* @__PURE__ */ z("circle", {
			cx: "12",
			cy: "14",
			r: "8"
		})
	]
}), Z = (e) => /* @__PURE__ */ B(Y, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M5 12h14" }), /* @__PURE__ */ z("path", { d: "M12 5v14" })]
}), de = (e) => /* @__PURE__ */ z(Y, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" })
}), fe = (e) => /* @__PURE__ */ B(Y, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M3 6h18" }),
		/* @__PURE__ */ z("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ z("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), pe = (e) => /* @__PURE__ */ B(Y, {
	...e,
	children: [
		/* @__PURE__ */ z("circle", {
			cx: "12",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ z("circle", {
			cx: "19",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ z("circle", {
			cx: "5",
			cy: "12",
			r: "1"
		})
	]
}), me = (e) => /* @__PURE__ */ z(Y, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "M20 6 9 17l-5-5" })
}), he = (e) => /* @__PURE__ */ B(Y, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ z("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), ge = (e) => /* @__PURE__ */ B(Y, {
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
}), _e = (e) => /* @__PURE__ */ z(Y, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" })
}), ve = (e) => /* @__PURE__ */ B(Y, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "m14.5 17.5 3 3" }),
		/* @__PURE__ */ z("path", { d: "M14.5 6.5 3 18l3 3L17.5 9.5" }),
		/* @__PURE__ */ z("path", { d: "m21 3-6.5 6.5" }),
		/* @__PURE__ */ z("path", { d: "M21 3h-4" }),
		/* @__PURE__ */ z("path", { d: "M21 3v4" }),
		/* @__PURE__ */ z("path", { d: "m6.5 6.5 3-3" }),
		/* @__PURE__ */ z("path", { d: "M3 3h4" }),
		/* @__PURE__ */ z("path", { d: "M3 3v4" }),
		/* @__PURE__ */ z("path", { d: "m9.5 9.5 11 11" })
	]
}), ye = (e) => /* @__PURE__ */ B(Y, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
		/* @__PURE__ */ z("path", { d: "M3 3v5h5" }),
		/* @__PURE__ */ z("path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }),
		/* @__PURE__ */ z("path", { d: "M16 16h5v5" })
	]
}), be = (e) => /* @__PURE__ */ B(Y, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M13 7 9 3 5 7l4 4" }),
		/* @__PURE__ */ z("path", { d: "m17 11 4 4-4 4-4-4" }),
		/* @__PURE__ */ z("path", { d: "m8 12 4 4 6-6-4-4Z" }),
		/* @__PURE__ */ z("path", { d: "m16 8 3-3" }),
		/* @__PURE__ */ z("path", { d: "M9 21a6 6 0 0 0-6-6" })
	]
}), xe = [
	{
		minutes: 1440,
		label: "1 day"
	},
	{
		minutes: 720,
		label: "12 h"
	},
	{
		minutes: 360,
		label: "6 h"
	},
	{
		minutes: 120,
		label: "2 h"
	},
	{
		minutes: 60,
		label: "1 h"
	},
	{
		minutes: 30,
		label: "30 min"
	},
	{
		minutes: 15,
		label: "15 min"
	},
	{
		minutes: 5,
		label: "5 min"
	}
];
function Se({ onClose: e }) {
	let n = N(), { data: r } = M({
		queryKey: ["timers", "settings"],
		queryFn: () => C.get(`${V}/settings`)
	}), a = W(), [o, s] = L(null), c = o ?? r ?? null, l = (e) => c && s({
		...c,
		...e
	}), u = j({
		mutationFn: (e) => C.put(`${V}/settings`, e),
		onSuccess: (t) => {
			n.setQueryData(["timers", "settings"], t), n.invalidateQueries({ queryKey: ["timers"] }), A.success("Saved"), e();
		},
		onError: (e) => A.error(e.message)
	}), p = j({
		mutationFn: () => C.post(`${V}/import`, {}),
		onSuccess: (e) => {
			n.invalidateQueries({ queryKey: ["timers"] });
			let t = e.structures + e.notifications;
			A.success(t ? `${t} timer${t === 1 ? "" : "s"} added (${e.structures} from structures, ${e.notifications} from notifications)` : "Nothing new to add");
		},
		onError: (e) => A.error(e.message)
	}), m = (e) => c && l({ reminder_minutes: c.reminder_minutes.includes(e) ? c.reminder_minutes.filter((t) => t !== e) : [...c.reminder_minutes, e] });
	return /* @__PURE__ */ z(i, {
		open: !0,
		onOpenChange: (t) => !t && e(),
		title: "Timer settings",
		size: "md",
		footer: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(t, {
			variant: "ghost",
			onClick: e,
			children: "Cancel"
		}), /* @__PURE__ */ z(t, {
			variant: "primary",
			disabled: !c,
			loading: u.isPending,
			onClick: () => c && u.mutate(c),
			children: "Save"
		})] }),
		children: c ? /* @__PURE__ */ B("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ B("div", { children: [
					/* @__PURE__ */ z("div", {
						className: "mb-1.5 text-[13px] font-medium",
						children: "Reminders"
					}),
					/* @__PURE__ */ z("p", {
						className: "mb-2 text-xs text-muted",
						children: "How long before a timer comes out people who are going get a reminder. Timers marked \"everyone is expected\" remind every member."
					}),
					/* @__PURE__ */ z("div", {
						className: "flex flex-wrap gap-1.5",
						children: xe.map((e) => {
							let t = c.reminder_minutes.includes(e.minutes);
							return /* @__PURE__ */ z("button", {
								type: "button",
								"aria-pressed": t,
								onClick: () => m(e.minutes),
								className: w("border px-2 py-1 text-xs transition-colors", t ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text"),
								children: e.label
							}, e.minutes);
						})
					}),
					c.reminder_minutes.length === 0 && /* @__PURE__ */ z("p", {
						className: "mt-1.5 text-xs text-warning-fg",
						children: "No reminders will be sent."
					})
				] }),
				/* @__PURE__ */ B("div", {
					className: "divide-y divide-border border border-border px-3",
					children: [/* @__PURE__ */ z(v, {
						label: "From the corporation's structures",
						description: "Reinforced, anchoring and unanchoring structures on the corporation sheet get a timer.",
						checked: c.import_structures,
						onCheckedChange: (e) => l({ import_structures: e })
					}), /* @__PURE__ */ z(v, {
						label: "From in-game notifications",
						description: "Structures that lost shields or armor, sovereignty structures and customs offices, as members' characters are told.",
						checked: c.import_notifications,
						onCheckedChange: (e) => l({ import_notifications: e })
					})]
				}),
				/* @__PURE__ */ B("div", {
					className: "flex flex-wrap items-center justify-between gap-3 text-xs text-muted",
					children: [/* @__PURE__ */ B("span", { children: [
						"Both are checked every five minutes",
						c.notifications_seen_until ? /* @__PURE__ */ B(R, { children: ["; notifications last looked at ", k(c.notifications_seen_until)] }) : null,
						"."
					] }), /* @__PURE__ */ B(t, {
						variant: "secondary",
						size: "xs",
						loading: p.isPending,
						onClick: () => p.mutate(),
						children: [/* @__PURE__ */ z(ye, {}), " Check now"]
					})]
				}),
				/* @__PURE__ */ B("div", { children: [
					/* @__PURE__ */ z("div", {
						className: "mb-1.5 text-[13px] font-medium",
						children: "Discord roles to ping"
					}),
					/* @__PURE__ */ B("p", {
						className: "mb-2 text-xs text-muted",
						children: [
							"Picked for new timers with ",
							/* @__PURE__ */ z("em", { children: "Ping Discord" }),
							" on (each timer can change them). Pings go through Discord webhooks that ping, under Administration → Integrations."
						]
					}),
					a.data?.available ? a.data.error ? /* @__PURE__ */ z("p", {
						className: "text-xs text-warning-fg",
						children: a.data.error
					}) : /* @__PURE__ */ z(re, {
						roles: a.data.roles,
						value: c.default_ping_roles,
						onChange: (e) => l({ default_ping_roles: e })
					}) : /* @__PURE__ */ z("p", {
						className: "text-xs text-muted",
						children: "Link the Discord plugin to your server to pick roles; until then a ping mentions what the webhook is set to."
					})
				] }),
				/* @__PURE__ */ z(d, {
					label: "Keep timers that came out for",
					hint: "Days. Afterwards they drop off the board.",
					children: /* @__PURE__ */ z(f, {
						type: "number",
						min: 1,
						max: 90,
						value: c.keep_days,
						onChange: (e) => l({ keep_days: Math.max(1, Math.min(90, Number(e.target.value) || 1)) }),
						className: "w-28"
					})
				})
			]
		}) : /* @__PURE__ */ z(g, { className: "h-64" })
	});
}
//#endregion
//#region src/now.ts
function Ce(e = 1e3) {
	let [t, n] = L(() => Date.now());
	return F(() => {
		let t = setInterval(() => n(Date.now()), e);
		return () => clearInterval(t);
	}, [e]), t;
}
//#endregion
//#region src/board.tsx
function we() {
	return M({
		queryKey: ["timers", "board"],
		queryFn: () => C.get(V),
		refetchInterval: 6e4
	});
}
function Q({ t: e, now: t, className: n }) {
	let r = new Date(e.ends_at).getTime() - t;
	return r <= 0 ? -r < 36e5 ? /* @__PURE__ */ B("span", {
		className: w("inline-flex items-center gap-1.5 font-mono text-sm font-semibold uppercase tracking-wider text-danger-fg", n),
		children: [/* @__PURE__ */ z("span", {
			className: "size-1.5 animate-pulse rotate-45 bg-danger",
			"aria-hidden": !0
		}), " Out now"]
	}) : /* @__PURE__ */ z("span", {
		className: w("font-mono text-sm tabular-nums text-subtle", n),
		children: k(e.ends_at)
	}) : /* @__PURE__ */ z("span", {
		className: w("font-mono text-sm font-semibold tabular-nums", r < 9e5 ? "text-danger-fg" : r < 36e5 ? "text-warning-fg" : r < 864e5 ? "text-text" : "text-muted", n),
		children: ie(e.ends_at, t)
	});
}
function Te({ t }) {
	let n = t.kind === "hull" ? "danger" : t.kind === "armor" ? "warning" : t.kind === "sov" ? "info" : "neutral";
	return /* @__PURE__ */ z(e, {
		tone: n,
		size: "xs",
		children: te[t.kind]
	});
}
function Ee({ t }) {
	let n = H[t.side];
	return /* @__PURE__ */ z(e, {
		tone: n.badge,
		size: "xs",
		variant: "dot",
		children: n.label
	});
}
function De({ t: e }) {
	return /* @__PURE__ */ B("span", {
		className: "inline-flex min-w-0 items-baseline gap-1.5",
		children: [
			/* @__PURE__ */ z("span", {
				className: w("font-mono text-xs font-semibold tabular-nums", U(e.system.security)),
				children: e.system.security.toFixed(1)
			}),
			/* @__PURE__ */ z("span", {
				className: "font-medium",
				children: e.system.name
			}),
			e.system.region && /* @__PURE__ */ z("span", {
				className: "truncate text-xs text-subtle",
				children: e.system.region
			})
		]
	});
}
function Oe({ t }) {
	return /* @__PURE__ */ B("span", {
		className: "flex min-w-0 items-center gap-2.5",
		children: [t.icon ? /* @__PURE__ */ z("img", {
			src: t.icon,
			alt: "",
			className: "size-8 shrink-0 border border-border bg-bg",
			loading: "lazy"
		}) : /* @__PURE__ */ z("span", {
			className: "grid size-8 shrink-0 place-items-center border border-border text-subtle",
			children: /* @__PURE__ */ z(X, {})
		}), /* @__PURE__ */ B("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ B("span", {
				className: "flex items-center gap-1.5",
				children: [/* @__PURE__ */ z("span", {
					className: "truncate font-medium text-text",
					children: t.name
				}), t.important && /* @__PURE__ */ z(e, {
					tone: "accent",
					size: "xs",
					children: "Everyone"
				})]
			}), /* @__PURE__ */ B("span", {
				className: "block truncate text-xs text-subtle",
				children: [t.structure_type || "Structure", t.owner && /* @__PURE__ */ B(R, { children: [" · ", t.owner] })]
			})]
		})]
	});
}
function ke() {
	let e = N(), { data: i, isLoading: a } = we(), o = Ce(), [s, c] = L(null), [l, d] = L(null), [f, m] = L(!1), h = () => e.invalidateQueries({ queryKey: ["timers"] });
	F(() => {
		i && window.location.hash.startsWith("#t") && document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
	}, [i]);
	let v = j({
		mutationFn: (e) => C.post(`${V}/${e.id}/going`, { going: !e.going }),
		onSuccess: (e, t) => {
			h(), A.success(e.going ? `You're going: ${t.name}` : `You're no longer going to ${t.name}`);
		},
		onError: (e) => A.error(e.message)
	}), x = j({
		mutationFn: (e) => C.delete(`${V}/${e}`),
		onSuccess: () => {
			h(), A.success("Timer removed");
		},
		onError: (e) => A.error(e.message)
	}), S = i?.upcoming ?? [], w = S.find((e) => new Date(e.ends_at).getTime() > o), T = S.filter((e) => e.side === "friendly").length, E = S.filter((e) => e.side === "hostile").length, D = S.filter((e) => q(e.ends_at, o).startsWith("Today")).length, O = i?.going.length ?? 0, k = [];
	for (let e of S) {
		let t = q(e.ends_at, o), n = k[k.length - 1];
		n && n.label === t ? n.timers.push(e) : k.push({
			label: t,
			timers: [e]
		});
	}
	let M = (e) => /* @__PURE__ */ z(Ae, {
		t: e,
		now: o,
		canManage: !!i?.can_manage,
		onGoing: () => v.mutate(e),
		onEdit: () => c(e),
		onDelete: () => d(e)
	}, e.id);
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ z(p, {
			eyebrow: "Operations",
			title: "Timers",
			icon: /* @__PURE__ */ z(X, {}),
			description: "Structure and sovereignty timers with live countdowns. Say you're going and you'll be reminded before it comes out.",
			actions: i?.can_manage ? /* @__PURE__ */ B("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ B(t, {
					variant: "ghost",
					onClick: () => m(!0),
					children: [/* @__PURE__ */ z(he, {}), " Settings"]
				}), /* @__PURE__ */ B(t, {
					variant: "primary",
					onClick: () => c("new"),
					children: [/* @__PURE__ */ z(Z, {}), " Add timer"]
				})]
			}) : void 0
		}),
		a || !i ? /* @__PURE__ */ B("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ z("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					0,
					1,
					2,
					3
				].map((e) => /* @__PURE__ */ z(g, { className: "h-24" }, e))
			}), /* @__PURE__ */ z(g, { className: "h-64" })]
		}) : /* @__PURE__ */ B("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ B("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ z(_, {
						label: "Next timer",
						icon: /* @__PURE__ */ z(X, {}),
						tone: w ? new Date(w.ends_at).getTime() - o < 36e5 ? "danger" : "accent" : void 0,
						value: w ? /* @__PURE__ */ z(Q, {
							t: w,
							now: o,
							className: "text-2xl"
						}) : "—",
						hint: w ? `${w.name} · ${w.system.name}` : "Nothing on the board",
						mono: !1
					}),
					/* @__PURE__ */ z(_, {
						label: "Coming out today",
						icon: /* @__PURE__ */ z(be, {}),
						value: D,
						hint: D ? "by EVE time" : "a quiet day"
					}),
					/* @__PURE__ */ z(_, {
						label: "Upcoming",
						icon: /* @__PURE__ */ z(_e, {}),
						value: S.length,
						hint: `${T} ours · ${E} hostile`
					}),
					/* @__PURE__ */ z(_, {
						label: "I'm going to",
						icon: /* @__PURE__ */ z(ge, {}),
						value: O,
						tone: O ? "success" : void 0,
						hint: O ? "you'll be reminded" : "press Going on a timer"
					})
				]
			}), /* @__PURE__ */ B(b, {
				variant: "pills",
				defaultValue: "upcoming",
				className: "space-y-4",
				items: [{
					value: "upcoming",
					label: "Upcoming",
					count: S.length,
					icon: /* @__PURE__ */ z(ve, {})
				}, {
					value: "past",
					label: "Came out",
					count: i.past.length
				}],
				children: [/* @__PURE__ */ z(y, {
					value: "upcoming",
					children: S.length === 0 ? /* @__PURE__ */ z(n, { children: /* @__PURE__ */ z(u, {
						icon: /* @__PURE__ */ z(X, {}),
						title: "No timers on the board",
						description: i.can_manage ? "Add one from the in-game timer. Reinforced corporation structures and timers in members' notifications are added by themselves." : "Nothing is coming out of reinforcement. Timers from your corporation's structures show up here on their own.",
						action: i.can_manage ? /* @__PURE__ */ B(t, {
							variant: "primary",
							onClick: () => c("new"),
							children: [/* @__PURE__ */ z(Z, {}), " Add timer"]
						}) : void 0
					}) }) : /* @__PURE__ */ z("div", {
						className: "space-y-6",
						children: k.map((e) => /* @__PURE__ */ B("section", { children: [/* @__PURE__ */ B("h2", {
							className: "hud-label mb-2 flex items-center gap-3 text-text",
							children: [
								e.label,
								/* @__PURE__ */ z("span", {
									className: "h-px flex-1 bg-border",
									"aria-hidden": !0
								}),
								/* @__PURE__ */ B("span", {
									className: "text-xs font-normal normal-case tracking-normal text-subtle",
									children: [
										e.timers.length,
										" timer",
										e.timers.length === 1 ? "" : "s"
									]
								})
							]
						}), /* @__PURE__ */ z(n, {
							className: "overflow-hidden",
							children: /* @__PURE__ */ z("ul", {
								className: "divide-y divide-border",
								children: e.timers.map(M)
							})
						})] }, e.label))
					})
				}), /* @__PURE__ */ z(y, {
					value: "past",
					children: i.past.length === 0 ? /* @__PURE__ */ z(n, { children: /* @__PURE__ */ z(u, {
						icon: /* @__PURE__ */ z(X, {}),
						title: "Nothing came out recently",
						description: "Timers stay here for a while after they come out."
					}) }) : /* @__PURE__ */ z(n, {
						className: "overflow-hidden",
						children: /* @__PURE__ */ z("ul", {
							className: "divide-y divide-border opacity-80",
							children: i.past.map(M)
						})
					})
				})]
			})]
		}),
		s && /* @__PURE__ */ z(ce, {
			timer: s === "new" ? null : s,
			onClose: () => c(null)
		}),
		f && /* @__PURE__ */ z(Se, { onClose: () => m(!1) }),
		/* @__PURE__ */ z(r, {
			open: !!l,
			onOpenChange: (e) => !e && d(null),
			danger: !0,
			title: `Remove "${l?.name}"?`,
			description: "It disappears from the board for everyone. People who said they're going aren't told.",
			confirmLabel: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(fe, {}), " Remove"] }),
			onConfirm: () => l && x.mutateAsync(l.id)
		})
	] });
}
function Ae({ t: e, now: n, canManage: r, onGoing: i, onEdit: u, onDelete: d }) {
	let f = H[e.side], p = new Date(e.ends_at).getTime() <= n, [m, h] = L(!1);
	return /* @__PURE__ */ B("li", {
		id: `t${e.id}`,
		className: "relative scroll-mt-24",
		children: [
			/* @__PURE__ */ z("span", {
				className: w("absolute inset-y-0 left-0 w-1", f.stripe),
				"aria-hidden": !0
			}),
			/* @__PURE__ */ B("div", {
				className: "grid gap-x-4 gap-y-2 px-card py-3 pl-5 sm:grid-cols-[150px_minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center",
				children: [
					/* @__PURE__ */ B("div", {
						className: "flex items-center justify-between gap-2 sm:block",
						children: [/* @__PURE__ */ z(Q, {
							t: e,
							now: n
						}), /* @__PURE__ */ z(S, {
							content: D(e.ends_at),
							children: /* @__PURE__ */ B("span", {
								className: "block text-xs text-subtle",
								children: [new Date(e.ends_at).toLocaleTimeString("en-GB", {
									hour: "2-digit",
									minute: "2-digit",
									timeZone: "UTC"
								}), " ET"]
							})
						})]
					}),
					/* @__PURE__ */ z("button", {
						type: "button",
						className: "min-w-0 text-left",
						onClick: () => h((e) => !e),
						"aria-expanded": m,
						children: /* @__PURE__ */ z(Oe, { t: e })
					}),
					/* @__PURE__ */ B("div", {
						className: "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1",
						children: [/* @__PURE__ */ z(De, { t: e }), /* @__PURE__ */ B("span", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ z(Te, { t: e }), /* @__PURE__ */ z(Ee, { t: e })]
						})]
					}),
					/* @__PURE__ */ B("div", {
						className: "flex items-center justify-end gap-2",
						children: [
							/* @__PURE__ */ z(S, {
								content: e.going_names.length ? e.going_names.join(", ") : "Nobody has said they're going yet",
								children: /* @__PURE__ */ B("span", {
									className: "inline-flex items-center gap-1 text-xs text-muted",
									children: [
										/* @__PURE__ */ z(ge, { className: "size-3.5" }),
										" ",
										e.going_count
									]
								})
							}),
							!p && /* @__PURE__ */ z(t, {
								variant: e.going ? "success" : "secondary",
								size: "xs",
								onClick: i,
								"aria-pressed": e.going,
								children: e.going ? /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(me, {}), " Going"] }) : "Going?"
							}),
							r && /* @__PURE__ */ B(s, { children: [/* @__PURE__ */ z(l, {
								asChild: !0,
								children: /* @__PURE__ */ z(t, {
									variant: "ghost",
									size: "icon-xs",
									"aria-label": `Options for ${e.name}`,
									children: /* @__PURE__ */ z(pe, {})
								})
							}), /* @__PURE__ */ B(a, {
								align: "end",
								children: [
									/* @__PURE__ */ B(o, {
										onSelect: u,
										children: [/* @__PURE__ */ z(de, {}), " Edit"]
									}),
									/* @__PURE__ */ z(c, {}),
									/* @__PURE__ */ B(o, {
										danger: !0,
										onSelect: d,
										children: [/* @__PURE__ */ z(fe, {}), " Remove"]
									})
								]
							})] })
						]
					})
				]
			}),
			m && /* @__PURE__ */ B("div", {
				className: "border-t border-border bg-bg/40 px-card py-3 pl-5 text-sm",
				children: [
					/* @__PURE__ */ B($, {
						label: "Comes out",
						children: [
							D(e.ends_at),
							" ",
							!p && /* @__PURE__ */ B("span", {
								className: "text-subtle",
								children: [
									"(in ",
									ae(e.ends_at, n),
									")"
								]
							})
						]
					}),
					e.notes && /* @__PURE__ */ z($, {
						label: "Notes",
						children: /* @__PURE__ */ z("span", {
							className: "whitespace-pre-wrap",
							children: e.notes
						})
					}),
					e.going_names.length > 0 && /* @__PURE__ */ B($, {
						label: `Going (${e.going_count})`,
						children: [e.going_names.join(", "), e.going_count > e.going_names.length && " …"]
					}),
					/* @__PURE__ */ B($, {
						label: "From",
						children: [e.source === "structure" ? "the corporation's structures" : e.source === "notification" ? "an in-game notification" : e.created_by?.name ?? "someone", /* @__PURE__ */ B("span", {
							className: "text-subtle",
							children: [" · updated ", k(e.updated_at)]
						})]
					}),
					/* @__PURE__ */ B($, {
						label: "Exact",
						children: [
							T(e.ends_at),
							" · ",
							O(e.ends_at),
							" local"
						]
					})
				]
			})
		]
	});
}
function $({ label: e, children: t }) {
	return /* @__PURE__ */ B("div", {
		className: "flex gap-3 py-0.5",
		children: [/* @__PURE__ */ z("span", {
			className: "w-24 shrink-0 text-xs uppercase tracking-wider text-subtle",
			children: e
		}), /* @__PURE__ */ z("span", {
			className: "min-w-0 text-text",
			children: t
		})]
	});
}
//#endregion
//#region src/index.tsx
function je() {
	let { data: t, isLoading: n } = M({
		queryKey: ["timers", "widget"],
		queryFn: () => C.get(V),
		refetchInterval: 12e4
	}), r = Ce();
	if (n) return /* @__PURE__ */ z(g, { className: "h-24" });
	if (!t) return null;
	let i = t.upcoming.filter((e) => new Date(e.ends_at).getTime() > r - 36e5).slice(0, 4);
	return i.length === 0 ? /* @__PURE__ */ z("p", {
		className: "text-sm text-subtle",
		children: "No timers on the board."
	}) : /* @__PURE__ */ B("ul", {
		className: "divide-y divide-border",
		children: [i.map((t) => /* @__PURE__ */ z("li", { children: /* @__PURE__ */ B(P, {
			to: `/p/timers#t${t.id}`,
			className: "flex items-center gap-3 py-2 hover:text-text",
			children: [
				/* @__PURE__ */ z("span", {
					className: w("h-8 w-0.5 shrink-0", H[t.side].stripe),
					"aria-hidden": !0
				}),
				/* @__PURE__ */ B("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ z("span", {
						className: "block truncate text-sm font-medium",
						children: t.name
					}), /* @__PURE__ */ B("span", {
						className: "block truncate text-xs text-subtle",
						children: [
							t.system.name,
							" · ",
							t.structure_type || "Structure",
							t.going && /* @__PURE__ */ B(R, { children: [" · ", /* @__PURE__ */ z(e, {
								tone: "success",
								size: "xs",
								children: "Going"
							})] })
						]
					})]
				}),
				/* @__PURE__ */ z(Q, {
					t,
					now: r,
					className: "text-xs"
				})
			]
		}) }, t.id)), t.upcoming.length > i.length && /* @__PURE__ */ z("li", {
			className: "pt-2 text-xs text-subtle",
			children: /* @__PURE__ */ B(P, {
				to: "/p/timers",
				className: "hover:text-text",
				children: [t.upcoming.length - i.length, " more on the board"]
			})
		})]
	});
}
var Me = E({
	routes: [{
		path: "",
		Component: ke
	}],
	widgets: [{
		id: "next",
		title: "Timers",
		Component: je,
		size: "md",
		order: 8
	}]
});
//#endregion
export { Me as default };

export const classes = ["!data","!o","!t","@conduit/sdk","@tanstack/react-query","a","about","absolute","accent","access","action","actions","add","added","after","ago","align","all","alt","an","anchor_vulnerable","anchoring","and","animate-pulse","are","aren","aria-autocomplete","aria-expanded","aria-hidden","aria-invalid","aria-label","aria-pressed","aria-selected","armor","armor_reinforce","armor_vulnerable","as","at","autoComplete","autoFocus","available","background","badge","be","been","before","below","bg-accent-soft","bg-bg","bg-bg/40","bg-border","bg-border-strong","bg-danger","bg-success","bg-surface","block","board","body","border","border-accent/60","border-border","border-border-strong","border-t","box","browser","but","button","by","came","can","canManage","can_manage","center","change","characters","checked","children","chosen","className","clock","close","cn","color","colour","coloured","come","comes","coming","component","confirmLabel","const","content","corporation","count","counting","counts","created_by","current","currentColor","customs","cx","cy","d","danger","data","datetime-local","day","days","debounced","default","defaultValue","default_ping_roles","del","deleted","deleting","deploy_vulnerable","description","diff","disabled","disappears","discord","discord-roles","divide-border","divide-y","doesn","dot","drift","drop","editing","either","else","elsewhere","en-GB","enabled","end","endsAt","ends_at","entered","error","eslint-disable-line","even","every","everyone","everything","exact","expected","export","extraction","eyebrow","few","fill","fills","fitting_invulnerable","five","flex","flex-1","flex-wrap","font-medium","font-mono","font-normal","font-semibold","footer","for","form","found","friendly","from","fuel_expires","function","game","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-x-3","gap-x-4","gap-y-1","gap-y-2","get","ghost","go","going","going_count","going_names","grid","grouped","h","h-24","h-64","h-8","h-px","has","hear","here","hint","hits","hostile","hour","hover:bg-hover","hover:border-border-strong","hover:text-text","how","hud-label","hull","hull_reinforce","hull_vulnerable","icon","icon-xs","icons","id","ids","if","import","importNow","import_notifications","import_structures","important","in","in-game","info","inline","inline-flex","input","inset-y-0","interface","intervalMs","is","isLoading","iso","it","items","items-baseline","items-center","its","justify-between","justify-end","keep_days","key","kind","known","knows","label","last","lastIndex","lazy","left","left-0","length","let","lg","lg:grid-cols-4","link","linked","list","listbox","live","ll","loading","local","long","longer","looked","lost","m","m14.5","m16","m17","m21","m6.5","m8","m9.5","manual","marked","matched","matches","max","max-h-60","max-h-72","maxLength","mb-1.5","mb-2","md","members","mention","mentions","min","min-w-0","minute","minutes","ml-2","ml-auto","mode","mono","month","moon","more","mousedown","moved","mr-auto","ms","mt-1","mt-1.5","mutationFn","muted","myCount","n","name","neutral","new","next","no","none","normal-case","not","notes","nothing","notification","notifications","notifications_seen_until","notify","now","null","number","numeric","of","off","offer","offered","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onDelete","onDown","onEdit","onError","onFocus","onGoing","onKeyDown","onMouseDown","onOpenChange","onPick","onSelect","onSuccess","once","one","ones","onlining_vulnerable","only","opacity-80","open","option","options","or","order","other","our","ours","out","overflow-auto","overflow-hidden","own","owner","pad","past","patch","path","people","per","pick","pickStructure","picked","picking","pills","ping","pingRoles","ping_roles","pings","pl-5","place-items-center","placeholder","plugin","portrait","pos","post","press","primary","pt-2","put","px-2","px-3","px-card","py-0.5","py-1","py-2","py-3","qc","queryFn","queryKey","quiet","re","react","react-hooks/exhaustive-deps","react-router","read","reading","ready","recently","ref","refetchInterval","refresh","region","reinforced","relative","remind","reminded","reminder_minutes","reminders","removed","required","rest","results","return","right","right-0","role","roles","rotate-45","round","rounded-full","routes","row","rows","run","s","said","save","saved","scroll","scroll-mt-24","sec","secondary","seconds","security","self-center","server","set","setDebounced","setDeleting","setEditing","setExact","setForm","setLeft","setMode","setNow","setOpen","setQ","setSettingsOpen","setTypedAt","setting","settings","shadow-e2","sheet","shield_vulnerable","shields","short","show","shown","shows","shrink-0","side","simply","site","size","size-1.5","size-2","size-3.5","size-4","size-7","size-8","sm","sm:block","sm:grid-cols-2","sm:grid-cols-[150px_minmax(0,1.4fr)_minmax(0,1fr)_auto]","sm:grid-cols-[1fr_200px]","sm:items-center","so","solar","someone","source","sov","sovereignty","space-y-4","space-y-5","space-y-6","src","staleTime","state","status","stay","string","stripe","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structure","structure_id","structure_type","structures","style","success","such","system","systems","t","tabular-nums","taken","target","text","text-2xl","text-[13px]","text-danger-fg","text-left","text-muted","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xs","than","that","the","their","then","there","these","they","through","time","timeLeftText","timeZone","timer","timers","timers-structure-types","title","to","toLocalInput","toast","today","toggle","told","tone","top-full","total","tracking-normal","tracking-wider","transition-colors","true","truncate","type","type_id","types","typing","u","unanchored","unanchoring","undefined","under","unit","unknown","unless","until","up","upcoming","updated","updated_at","uppercase","use","useDiscordRoles","useNow","useQuery","useQueryClient","useRef","useState","used","using","v","value","variant","viewBox","void","vulnerable","w-0.5","w-1","w-24","w-28","w-full","warning","was","way","webhook","webhooks","weekday","were","what","when","where","which","while","whitespace-pre-wrap","who","whose","widget","widgets","will","with","without","written","x","xs","yet","you","your","z-20","zone"];
