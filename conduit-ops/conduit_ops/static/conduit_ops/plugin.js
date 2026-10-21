import { Badge as e, Button as t, Card as n, ConfirmDialog as r, Dialog as i, DropdownContent as a, DropdownItem as o, DropdownMenu as s, DropdownSeparator as c, DropdownTrigger as l, EmptyState as u, Field as d, Input as f, PageHeader as p, Select as m, Skeleton as h, StatCard as g, SwitchRow as _, TabPanel as v, Tabs as y, Textarea as b, Tooltip as x, api as S, cn as C, dateTime as w, definePlugin as T, eveAndLocal as E, timeAgo as ee, toast as D, useCurrentUser as te } from "@conduit/sdk";
import { useMutation as O, useQuery as k, useQueryClient as A } from "@tanstack/react-query";
import { Link as j } from "react-router";
import { useEffect as M, useRef as N, useState as P } from "react";
import { Fragment as F, jsx as I, jsxs as L } from "react/jsx-runtime";
//#region src/types.ts
var R = "/api/p/ops", z = [
	{
		value: "cta",
		label: "CTA"
	},
	{
		value: "stratop",
		label: "Stratop"
	},
	{
		value: "roam",
		label: "Roam"
	},
	{
		value: "defense",
		label: "Home defense"
	},
	{
		value: "mining",
		label: "Mining"
	},
	{
		value: "training",
		label: "Training"
	},
	{
		value: "social",
		label: "Social"
	},
	{
		value: "other",
		label: "Other"
	}
], B = Object.fromEntries(z.map((e) => [e.value, e.label])), V = {
	cta: {
		badge: "danger",
		stripe: "bg-danger"
	},
	stratop: {
		badge: "warning",
		stripe: "bg-warning"
	},
	defense: {
		badge: "warning",
		stripe: "bg-warning"
	},
	roam: {
		badge: "accent",
		stripe: "bg-accent"
	},
	mining: {
		badge: "info",
		stripe: "bg-info"
	},
	training: {
		badge: "success",
		stripe: "bg-success"
	},
	social: {
		badge: "neutral",
		stripe: "bg-border-strong"
	},
	other: {
		badge: "neutral",
		stripe: "bg-border-strong"
	}
}, H = [
	{
		value: "going",
		label: "Going"
	},
	{
		value: "maybe",
		label: "Maybe"
	},
	{
		value: "declined",
		label: "Can't"
	}
];
function U(e) {
	return e.fc?.name ?? e.fc_name;
}
//#endregion
//#region src/roles.tsx
function W(e = !0) {
	return k({
		queryKey: ["ops", "discord-roles"],
		queryFn: () => S.get(`${R}/discord-roles`),
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
	return i.length === 0 ? /* @__PURE__ */ I("p", {
		className: "text-xs text-muted",
		children: "The Discord server has no roles to pick."
	}) : /* @__PURE__ */ I("div", {
		className: "flex flex-wrap gap-1.5",
		children: i.map((e) => {
			let n = t.includes(e.id);
			return /* @__PURE__ */ L("button", {
				type: "button",
				"aria-pressed": n,
				onClick: () => a(e.id),
				className: C("flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors", n ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text"),
				children: [
					/* @__PURE__ */ I("span", {
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
function K(e) {
	let t = Math.floor(e / 60), n = e % 60;
	return t ? `${t}h${n ? ` ${n}m` : ""}` : `${n}m`;
}
function q(e) {
	let t = new Date(e);
	return `${G(t.getUTCHours())}:${G(t.getUTCMinutes())}`;
}
function ae(e) {
	if (!e) return "";
	let t = new Date(e);
	return `${t.getUTCFullYear()}-${G(t.getUTCMonth() + 1)}-${G(t.getUTCDate())}T${G(t.getUTCHours())}:${G(t.getUTCMinutes())}`;
}
function oe(e) {
	return e ? (/* @__PURE__ */ new Date(`${e}:00Z`)).toISOString() : null;
}
function J(e) {
	let t = new Date(e);
	return `${t.getUTCFullYear()}-${G(t.getUTCMonth() + 1)}-${G(t.getUTCDate())}`;
}
function se(e, t) {
	let n = (e) => Math.floor(e / 864e5), r = n(new Date(e).getTime()) - n(t), i = new Date(e).toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "UTC"
	});
	return r === 0 ? `Today · ${i}` : r === 1 ? `Tomorrow · ${i}` : r === -1 ? `Yesterday · ${i}` : i;
}
function ce(e, t) {
	let n = new Date(Date.UTC(e, t, 1)), r = new Date(n);
	r.setUTCDate(1 - (n.getUTCDay() + 6) % 7);
	let i = [], a = new Date(r);
	do {
		let e = [];
		for (let t = 0; t < 7; t++) e.push(J(a.getTime())), a.setUTCDate(a.getUTCDate() + 1);
		i.push(e);
	} while (a.getUTCMonth() === t);
	return i;
}
//#endregion
//#region src/editor.tsx
var le = [
	30,
	60,
	90,
	120,
	180,
	240,
	360,
	480
];
function ue() {
	let e = /* @__PURE__ */ new Date();
	return e.setUTCHours(e.getUTCHours() + 1, 0, 0, 0), ae(e.toISOString());
}
function de({ op: e, onClose: n }) {
	let r = A(), a = te(), { data: o } = k({
		queryKey: ["ops", "options"],
		queryFn: () => S.get(`${R}/options`),
		staleTime: 6e5
	}), s = W(), [c, l] = P({
		title: e?.title ?? "",
		kind: e?.kind ?? "roam",
		starts: e ? ae(e.starts_at) : ue(),
		duration_minutes: e?.duration_minutes ?? 120,
		fc: e ? e.fc : a ? {
			id: a.id,
			name: a.name,
			portrait: null
		} : null,
		fc_name: e?.fc_name ?? "",
		formup: e?.formup ?? "",
		comms: e?.comms ?? "",
		doctrine_id: e?.doctrine?.id ?? null,
		doctrine_name: e?.doctrine?.name ?? "",
		description: e?.description ?? "",
		states: e?.states.map((e) => e.id) ?? [],
		groups: e?.groups.map((e) => e.id) ?? [],
		important: e?.important ?? !1,
		notify: !0,
		ping: e?.ping ?? !1,
		ping_roles: e?.ping_roles ?? null
	}), u = (e) => l((t) => ({
		...t,
		...e
	})), p = c.ping_roles ?? o?.default_ping_roles ?? [], h = oe(c.starts), g = !!c.title.trim() && !!h, v = o?.doctrines ?? [], y = (e, t) => u({ [e]: c[e].includes(t) ? c[e].filter((e) => e !== t) : [...c[e], t] }), x = O({
		mutationFn: () => {
			let t = {
				title: c.title,
				kind: c.kind,
				starts_at: h,
				duration_minutes: c.duration_minutes,
				fc: c.fc?.id ?? null,
				fc_name: c.fc ? "" : c.fc_name,
				formup: c.formup,
				comms: c.comms,
				doctrine_id: c.doctrine_id,
				doctrine_name: c.doctrine_id ? "" : c.doctrine_name,
				description: c.description,
				states: c.states,
				groups: c.groups,
				important: c.important,
				notify: c.notify,
				ping: c.ping,
				ping_roles: c.ping ? p : []
			};
			return e ? S.put(`${R}/${e.id}`, t) : S.post(R, t);
		},
		onSuccess: (t) => {
			r.invalidateQueries({ queryKey: ["ops"] }), D.success(e ? "Op updated" : `Op scheduled: ${t.title}, ${w(t.starts_at)}`), n();
		},
		onError: (e) => D.error(e.message)
	});
	return /* @__PURE__ */ I(i, {
		open: !0,
		onOpenChange: (e) => !e && n(),
		title: e ? "Edit op" : "Schedule op",
		size: "lg",
		footer: /* @__PURE__ */ L(F, { children: [
			/* @__PURE__ */ I("span", {
				className: "mr-auto self-center text-xs text-muted",
				children: h ? /* @__PURE__ */ L(F, { children: ["Forms up ", /* @__PURE__ */ I("span", {
					className: "text-text",
					children: w(h)
				})] }) : "Pick when it forms up."
			}),
			/* @__PURE__ */ I(t, {
				variant: "ghost",
				onClick: n,
				children: "Cancel"
			}),
			/* @__PURE__ */ I(t, {
				variant: "primary",
				disabled: !g,
				loading: x.isPending,
				onClick: () => x.mutate(),
				children: e ? "Save" : "Schedule"
			})
		] }),
		children: /* @__PURE__ */ L("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ L("div", {
					className: "grid gap-4 sm:grid-cols-[1fr_180px]",
					children: [/* @__PURE__ */ I(d, {
						label: "Title",
						required: !0,
						children: /* @__PURE__ */ I(f, {
							value: c.title,
							maxLength: 200,
							onChange: (e) => u({ title: e.target.value }),
							placeholder: "Sunday roam to Syndicate",
							autoFocus: !0
						})
					}), /* @__PURE__ */ I(d, {
						label: "Kind",
						children: /* @__PURE__ */ I(m, {
							value: c.kind,
							onChange: (e) => u({ kind: e.target.value }),
							options: z.map((e) => ({
								value: e.value,
								label: e.label
							}))
						})
					})]
				}),
				/* @__PURE__ */ L("div", {
					className: "grid gap-4 sm:grid-cols-[1fr_180px]",
					children: [/* @__PURE__ */ I(d, {
						label: "Form-up (EVE time)",
						required: !0,
						hint: "EVE time is UTC.",
						children: /* @__PURE__ */ I(f, {
							type: "datetime-local",
							value: c.starts,
							onChange: (e) => u({ starts: e.target.value })
						})
					}), /* @__PURE__ */ I(d, {
						label: "Runs for",
						children: /* @__PURE__ */ I(m, {
							value: String(c.duration_minutes),
							onChange: (e) => u({ duration_minutes: Number(e.target.value) }),
							options: [.../* @__PURE__ */ new Set([...le, c.duration_minutes])].sort((e, t) => e - t).map((e) => ({
								value: String(e),
								label: K(e)
							}))
						})
					})]
				}),
				/* @__PURE__ */ L("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ I(pe, {
						fc: c.fc,
						name: c.fc_name,
						onPick: (e) => u({
							fc: e,
							fc_name: ""
						}),
						onType: (e) => u({
							fc: null,
							fc_name: e
						})
					}), /* @__PURE__ */ I(d, {
						label: "Doctrine",
						hint: v.length ? "From the Doctrines plugin; members can open it from the op." : "Its name, as people know it.",
						children: v.length ? /* @__PURE__ */ I(m, {
							value: String(c.doctrine_id ?? ""),
							onChange: (e) => u({ doctrine_id: e.target.value ? Number(e.target.value) : null }),
							options: [{
								value: "",
								label: "None"
							}, ...v.map((e) => ({
								value: String(e.id),
								label: e.name
							}))]
						}) : /* @__PURE__ */ I(f, {
							value: c.doctrine_name,
							maxLength: 100,
							onChange: (e) => u({ doctrine_name: e.target.value }),
							placeholder: "Shield Ferox"
						})
					})]
				}),
				/* @__PURE__ */ L("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ I(d, {
						label: "Form-up location",
						children: /* @__PURE__ */ I(f, {
							value: c.formup,
							maxLength: 120,
							onChange: (e) => u({ formup: e.target.value }),
							placeholder: "Home staging, fleet hangar"
						})
					}), /* @__PURE__ */ I(d, {
						label: "Comms",
						children: /* @__PURE__ */ I(f, {
							value: c.comms,
							maxLength: 120,
							onChange: (e) => u({ comms: e.target.value }),
							placeholder: "Mumble: Ops 1"
						})
					})]
				}),
				/* @__PURE__ */ I(d, {
					label: "Details",
					hint: "What to bring, what to expect.",
					children: /* @__PURE__ */ I(b, {
						rows: 3,
						value: c.description,
						maxLength: 5e3,
						onChange: (e) => u({ description: e.target.value }),
						placeholder: "Bring a spare ship. Logi gets SRP priority."
					})
				}),
				o && (o.states.length > 0 || o.groups.length > 0) && /* @__PURE__ */ L("div", { children: [
					/* @__PURE__ */ I("div", {
						className: "mb-1.5 text-[13px] font-medium",
						children: "Who it's for"
					}),
					/* @__PURE__ */ I("p", {
						className: "mb-2 text-xs text-muted",
						children: "Nothing picked: every member. Otherwise only people in one of these states or groups see it and are told."
					}),
					/* @__PURE__ */ L("div", {
						className: "flex flex-wrap gap-1.5",
						children: [o.states.map((e) => /* @__PURE__ */ L(fe, {
							on: c.states.includes(e.id),
							onClick: () => y("states", e.id),
							children: [/* @__PURE__ */ I("span", {
								className: "size-2 rounded-full",
								style: { background: e.color }
							}), e.name]
						}, `s${e.id}`)), o.groups.map((e) => /* @__PURE__ */ I(fe, {
							on: c.groups.includes(e.id),
							onClick: () => y("groups", e.id),
							children: e.name
						}, `g${e.id}`))]
					})
				] }),
				/* @__PURE__ */ L("div", {
					className: "divide-y divide-border border border-border px-3",
					children: [
						/* @__PURE__ */ I(_, {
							label: "Everyone is expected",
							description: "Its audience is told now and reminded before form-up, even if they muted ops.",
							checked: c.important,
							onCheckedChange: (t) => u({
								important: t,
								...t && !e ? { ping: !0 } : {}
							})
						}),
						/* @__PURE__ */ I(_, {
							label: "Ping Discord",
							description: s.data?.available ? "Discord webhooks that ping mention their own setting and the roles below when it's posted, moved, reminded and cancelled." : "Discord webhooks that ping (Administration → Integrations) mention their setting when it's posted, moved, reminded and cancelled.",
							checked: c.ping,
							onCheckedChange: (e) => u({ ping: e })
						}),
						c.ping && s.data?.available && /* @__PURE__ */ L("div", {
							className: "py-3",
							children: [/* @__PURE__ */ I("div", {
								className: "mb-1.5 text-[13px] font-medium",
								children: "Roles to ping"
							}), s.data.error ? /* @__PURE__ */ I("p", {
								className: "text-xs text-warning-fg",
								children: s.data.error
							}) : /* @__PURE__ */ I(re, {
								roles: s.data.roles,
								value: p,
								onChange: (e) => u({ ping_roles: e })
							})]
						}),
						!e && /* @__PURE__ */ I(_, {
							label: "Tell members it's scheduled",
							description: "Under the bell. Webhooks such as Discord hear about it either way.",
							checked: c.notify || c.important,
							disabled: c.important,
							onCheckedChange: (e) => u({ notify: e })
						})
					]
				})
			]
		})
	});
}
function fe({ on: e, onClick: t, children: n }) {
	return /* @__PURE__ */ I("button", {
		type: "button",
		"aria-pressed": e,
		onClick: t,
		className: C("flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors", e ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text"),
		children: n
	});
}
function pe({ fc: e, name: t, onPick: n, onType: r }) {
	let [i, a] = P(!1), o = e ? e.name : t, [s, c] = P(o), l = N(null);
	M(() => {
		let e = setTimeout(() => c(o), 150);
		return () => clearTimeout(e);
	}, [o]);
	let { data: u } = k({
		queryKey: [
			"ops",
			"fcs",
			s
		],
		queryFn: () => S.get(`${R}/fcs?q=${encodeURIComponent(s)}`),
		enabled: i && !e && s.trim().length >= 2,
		staleTime: 6e4
	});
	M(() => {
		let e = (e) => {
			l.current && !l.current.contains(e.target) && a(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, []);
	let p = i && !e && s.trim().length >= 2 ? u ?? [] : [], m = (e) => {
		n(e), a(!1);
	};
	return /* @__PURE__ */ L("div", {
		ref: l,
		className: "relative",
		children: [/* @__PURE__ */ I(d, {
			label: "FC",
			hint: e ? "A member of the site; they can change this op." : "Type to pick a member, or leave a name for someone who isn't on the site.",
			children: /* @__PURE__ */ I(f, {
				value: o,
				maxLength: 100,
				onChange: (e) => {
					r(e.target.value), a(!0);
				},
				onFocus: () => a(!0),
				onKeyDown: (e) => {
					e.key === "Enter" && p[0] && (e.preventDefault(), m(p[0])), e.key === "Escape" && a(!1);
				},
				placeholder: "To be announced",
				autoComplete: "off",
				"aria-autocomplete": "list",
				"aria-expanded": p.length > 0
			})
		}), p.length > 0 && /* @__PURE__ */ I("ul", {
			role: "listbox",
			className: "absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto border border-border bg-surface shadow-e2",
			children: p.map((e) => /* @__PURE__ */ I("li", {
				role: "option",
				"aria-selected": !1,
				children: /* @__PURE__ */ L("button", {
					type: "button",
					onMouseDown: (e) => e.preventDefault(),
					onClick: () => m(e),
					className: "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-hover",
					children: [e.portrait ? /* @__PURE__ */ I("img", {
						src: e.portrait,
						alt: "",
						className: "size-6 shrink-0 border border-border",
						loading: "lazy"
					}) : /* @__PURE__ */ I("span", { className: "size-6 shrink-0 border border-border bg-bg" }), /* @__PURE__ */ I("span", {
						className: "truncate",
						children: e.name
					})]
				})
			}, e.id))
		})]
	});
}
//#endregion
//#region src/icons.tsx
function Y({ children: e, className: t = "size-4" }) {
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
var X = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [
		/* @__PURE__ */ I("path", { d: "M8 2v4" }),
		/* @__PURE__ */ I("path", { d: "M16 2v4" }),
		/* @__PURE__ */ I("rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "4",
			rx: "2"
		}),
		/* @__PURE__ */ I("path", { d: "M3 10h18" })
	]
}), me = (e) => /* @__PURE__ */ I(Y, {
	...e,
	children: /* @__PURE__ */ I("path", { d: "m15 18-6-6 6-6" })
}), he = (e) => /* @__PURE__ */ I(Y, {
	...e,
	children: /* @__PURE__ */ I("path", { d: "m9 18 6-6-6-6" })
}), ge = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [/* @__PURE__ */ I("path", { d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" }), /* @__PURE__ */ I("circle", {
		cx: "12",
		cy: "10",
		r: "3"
	})]
}), _e = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [
		/* @__PURE__ */ I("path", { d: "M12 19v3" }),
		/* @__PURE__ */ I("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }),
		/* @__PURE__ */ I("rect", {
			x: "9",
			y: "2",
			width: "6",
			height: "13",
			rx: "3"
		})
	]
}), ve = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [/* @__PURE__ */ I("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ I("path", { d: "m4.9 4.9 14.2 14.2" })]
}), ye = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [/* @__PURE__ */ I("path", { d: "M5 12h14" }), /* @__PURE__ */ I("path", { d: "M12 5v14" })]
}), be = (e) => /* @__PURE__ */ I(Y, {
	...e,
	children: /* @__PURE__ */ I("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" })
}), xe = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [
		/* @__PURE__ */ I("path", { d: "M3 6h18" }),
		/* @__PURE__ */ I("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ I("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), Se = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [
		/* @__PURE__ */ I("circle", {
			cx: "12",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ I("circle", {
			cx: "19",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ I("circle", {
			cx: "5",
			cy: "12",
			r: "1"
		})
	]
}), Z = (e) => /* @__PURE__ */ I(Y, {
	...e,
	children: /* @__PURE__ */ I("path", { d: "M20 6 9 17l-5-5" })
}), Ce = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [
		/* @__PURE__ */ I("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
		/* @__PURE__ */ I("circle", {
			cx: "9",
			cy: "7",
			r: "4"
		}),
		/* @__PURE__ */ I("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
		/* @__PURE__ */ I("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
	]
}), we = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [/* @__PURE__ */ I("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ I("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), Te = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [
		/* @__PURE__ */ I("polyline", { points: "14.5 17.5 3 6 3 3 6 3 17.5 14.5" }),
		/* @__PURE__ */ I("line", {
			x1: "13",
			x2: "19",
			y1: "19",
			y2: "13"
		}),
		/* @__PURE__ */ I("line", {
			x1: "16",
			x2: "20",
			y1: "16",
			y2: "20"
		}),
		/* @__PURE__ */ I("line", {
			x1: "19",
			x2: "21",
			y1: "21",
			y2: "19"
		}),
		/* @__PURE__ */ I("polyline", { points: "14.5 6.5 18 3 21 3 21 6 17.5 9.5" }),
		/* @__PURE__ */ I("line", {
			x1: "5",
			x2: "9",
			y1: "14",
			y2: "18"
		}),
		/* @__PURE__ */ I("line", {
			x1: "7",
			x2: "4",
			y1: "17",
			y2: "20"
		}),
		/* @__PURE__ */ I("line", {
			x1: "3",
			x2: "5",
			y1: "19",
			y2: "21"
		})
	]
}), Ee = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [
		/* @__PURE__ */ I("line", {
			x1: "8",
			x2: "21",
			y1: "6",
			y2: "6"
		}),
		/* @__PURE__ */ I("line", {
			x1: "8",
			x2: "21",
			y1: "12",
			y2: "12"
		}),
		/* @__PURE__ */ I("line", {
			x1: "8",
			x2: "21",
			y1: "18",
			y2: "18"
		}),
		/* @__PURE__ */ I("line", {
			x1: "3",
			x2: "3.01",
			y1: "6",
			y2: "6"
		}),
		/* @__PURE__ */ I("line", {
			x1: "3",
			x2: "3.01",
			y1: "12",
			y2: "12"
		}),
		/* @__PURE__ */ I("line", {
			x1: "3",
			x2: "3.01",
			y1: "18",
			y2: "18"
		})
	]
}), De = (e) => /* @__PURE__ */ L(Y, {
	...e,
	children: [/* @__PURE__ */ I("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ I("path", { d: "M12 6v6l4 2" })]
}), Oe = (e) => /* @__PURE__ */ I(Y, {
	...e,
	children: /* @__PURE__ */ I("path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" })
});
//#endregion
//#region src/now.ts
function ke(e = 1e3) {
	let [t, n] = P(() => Date.now());
	return M(() => {
		let t = setInterval(() => n(Date.now()), e);
		return () => clearInterval(t);
	}, [e]), t;
}
//#endregion
//#region src/settings.tsx
var Ae = [
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
function je({ onClose: e }) {
	let n = A(), { data: r } = k({
		queryKey: ["ops", "settings"],
		queryFn: () => S.get(`${R}/settings`)
	}), a = W(), [o, s] = P(null), c = o ?? r ?? null, l = (e) => c && s({
		...c,
		...e
	}), u = O({
		mutationFn: (e) => S.put(`${R}/settings`, e),
		onSuccess: (t) => {
			n.setQueryData(["ops", "settings"], t), n.invalidateQueries({ queryKey: ["ops"] }), D.success("Saved"), e();
		},
		onError: (e) => D.error(e.message)
	}), p = (e) => c && l({ reminder_minutes: c.reminder_minutes.includes(e) ? c.reminder_minutes.filter((t) => t !== e) : [...c.reminder_minutes, e] });
	return /* @__PURE__ */ I(i, {
		open: !0,
		onOpenChange: (t) => !t && e(),
		title: "Ops calendar settings",
		size: "md",
		footer: /* @__PURE__ */ L(F, { children: [/* @__PURE__ */ I(t, {
			variant: "ghost",
			onClick: e,
			children: "Cancel"
		}), /* @__PURE__ */ I(t, {
			variant: "primary",
			disabled: !c,
			loading: u.isPending,
			onClick: () => c && u.mutate(c),
			children: "Save"
		})] }),
		children: c ? /* @__PURE__ */ L("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ L("div", { children: [
					/* @__PURE__ */ I("div", {
						className: "mb-1.5 text-[13px] font-medium",
						children: "Reminders"
					}),
					/* @__PURE__ */ I("p", {
						className: "mb-2 text-xs text-muted",
						children: "How long before form-up people who said going or maybe get a reminder. Ops marked \"everyone is expected\" remind their whole audience."
					}),
					/* @__PURE__ */ I("div", {
						className: "flex flex-wrap gap-1.5",
						children: Ae.map((e) => {
							let t = c.reminder_minutes.includes(e.minutes);
							return /* @__PURE__ */ I("button", {
								type: "button",
								"aria-pressed": t,
								onClick: () => p(e.minutes),
								className: C("border px-2 py-1 text-xs transition-colors", t ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text"),
								children: e.label
							}, e.minutes);
						})
					}),
					c.reminder_minutes.length === 0 && /* @__PURE__ */ I("p", {
						className: "mt-1.5 text-xs text-warning-fg",
						children: "No reminders will be sent."
					})
				] }),
				/* @__PURE__ */ L("div", { children: [
					/* @__PURE__ */ I("div", {
						className: "mb-1.5 text-[13px] font-medium",
						children: "Discord roles to ping"
					}),
					/* @__PURE__ */ L("p", {
						className: "mb-2 text-xs text-muted",
						children: [
							"Picked for new ops with ",
							/* @__PURE__ */ I("em", { children: "Ping Discord" }),
							" on (each op can change them). Pings go through Discord webhooks that ping, under Administration → Integrations."
						]
					}),
					a.data?.available ? a.data.error ? /* @__PURE__ */ I("p", {
						className: "text-xs text-warning-fg",
						children: a.data.error
					}) : /* @__PURE__ */ I(re, {
						roles: a.data.roles,
						value: c.default_ping_roles,
						onChange: (e) => l({ default_ping_roles: e })
					}) : /* @__PURE__ */ I("p", {
						className: "text-xs text-muted",
						children: "Link the Discord plugin to your server to pick roles; until then a ping mentions what the webhook is set to."
					})
				] }),
				/* @__PURE__ */ I(d, {
					label: "Keep finished ops for",
					hint: "Days. Afterwards they drop off the Recent list (the calendar still shows them).",
					children: /* @__PURE__ */ I(f, {
						type: "number",
						min: 1,
						max: 90,
						value: c.keep_days,
						onChange: (e) => l({ keep_days: Math.max(1, Math.min(90, Number(e.target.value) || 1)) }),
						className: "w-28"
					})
				})
			]
		}) : /* @__PURE__ */ I(h, { className: "h-64" })
	});
}
//#endregion
//#region src/board.tsx
function Me() {
	return k({
		queryKey: ["ops", "board"],
		queryFn: () => S.get(R),
		refetchInterval: 6e4
	});
}
function Q({ op: e, now: t, className: n }) {
	if (e.status === "cancelled") return /* @__PURE__ */ I("span", {
		className: C("font-mono text-sm uppercase tracking-wider text-subtle line-through", n),
		children: "Cancelled"
	});
	let r = new Date(e.starts_at).getTime();
	if (r <= t) return new Date(e.ends_at).getTime() > t ? /* @__PURE__ */ L("span", {
		className: C("inline-flex items-center gap-1.5 font-mono text-sm font-semibold uppercase tracking-wider text-success-fg", n),
		children: [/* @__PURE__ */ I("span", {
			className: "size-1.5 animate-pulse rotate-45 bg-success",
			"aria-hidden": !0
		}), " Live"]
	}) : /* @__PURE__ */ I("span", {
		className: C("font-mono text-sm tabular-nums text-subtle", n),
		children: ee(e.starts_at)
	});
	let i = r - t;
	return /* @__PURE__ */ I("span", {
		className: C("font-mono text-sm font-semibold tabular-nums", i < 9e5 ? "text-danger-fg" : i < 36e5 ? "text-warning-fg" : i < 864e5 ? "text-text" : "text-muted", n),
		children: ie(e.starts_at, t)
	});
}
function Ne({ op: t }) {
	return /* @__PURE__ */ I(e, {
		tone: V[t.kind].badge,
		size: "xs",
		children: B[t.kind]
	});
}
function Pe({ answer: t }) {
	return t === "going" ? /* @__PURE__ */ I(e, {
		tone: "success",
		size: "xs",
		children: "Going"
	}) : t === "maybe" ? /* @__PURE__ */ I(e, {
		tone: "warning",
		size: "xs",
		children: "Maybe"
	}) : t === "declined" ? /* @__PURE__ */ I(e, {
		tone: "neutral",
		size: "xs",
		children: "Not going"
	}) : null;
}
function Fe({ op: e, board: n }) {
	let r = A(), [i, a] = P(e.my_note);
	M(() => a(e.my_note), [e.my_note]);
	let o = O({
		mutationFn: (t) => S.post(`${R}/${e.id}/rsvp`, {
			character_id: e.my_character,
			note: i,
			...t
		}),
		onSuccess: (t) => {
			r.invalidateQueries({ queryKey: ["ops"] }), t.my_answer !== e.my_answer && D.success(t.my_answer === "going" ? `You're going: ${e.title}` : t.my_answer ? "Answer saved" : "Answer taken back");
		},
		onError: (e) => D.error(e.message)
	});
	if (e.status === "cancelled" || e.status === "past") return null;
	let s = e.my_answer === "going" || e.my_answer === "maybe";
	return /* @__PURE__ */ L("div", {
		className: "flex flex-wrap items-center gap-2",
		children: [
			/* @__PURE__ */ I("div", {
				className: "inline-flex",
				role: "group",
				"aria-label": "Your answer",
				children: H.map((n) => {
					let r = e.my_answer === n.value;
					return /* @__PURE__ */ L(t, {
						size: "xs",
						variant: r ? n.value === "going" ? "success" : n.value === "maybe" ? "secondary" : "ghost" : "ghost",
						"aria-pressed": r,
						className: C("border border-border", r && "border-border-strong"),
						loading: o.isPending && o.variables?.answer === n.value,
						onClick: () => o.mutate({ answer: r ? null : n.value }),
						children: [
							r && /* @__PURE__ */ I(Z, {}),
							" ",
							n.label
						]
					}, n.value);
				})
			}),
			s && n.characters.length > 1 && /* @__PURE__ */ I(m, {
				"aria-label": "Character",
				className: "h-7 w-44 text-xs",
				value: String(e.my_character ?? n.main_character ?? ""),
				onChange: (t) => o.mutate({
					answer: e.my_answer,
					character_id: Number(t.target.value)
				}),
				options: n.characters.map((e) => ({
					value: String(e.id),
					label: e.name
				}))
			}),
			s && /* @__PURE__ */ I(f, {
				"aria-label": "Note for the FC",
				className: "h-7 w-48 text-xs",
				value: i,
				maxLength: 120,
				placeholder: "Note for the FC (optional)",
				onChange: (e) => a(e.target.value),
				onBlur: () => i !== e.my_note && o.mutate({
					answer: e.my_answer,
					note: i
				}),
				onKeyDown: (e) => e.key === "Enter" && e.target.blur()
			})
		]
	});
}
function Ie({ op: t, board: n, now: r }) {
	let i = t.rsvps.filter((e) => e.answer === "going"), a = t.rsvps.filter((e) => e.answer === "maybe"), o = t.rsvps.filter((e) => e.answer === "declined"), s = (e) => e.map((e) => (e.character && e.character !== e.user ? `${e.user} (${e.character})` : e.user) + (e.note ? ` — ${e.note}` : "")).join(", ");
	return /* @__PURE__ */ L("div", {
		className: "space-y-0.5 text-sm",
		children: [
			/* @__PURE__ */ L($, {
				label: "Forms up",
				children: [
					E(t.starts_at),
					t.status === "upcoming" && /* @__PURE__ */ L("span", {
						className: "text-subtle",
						children: [
							" (in ",
							ie(t.starts_at, r),
							")"
						]
					}),
					/* @__PURE__ */ L("span", {
						className: "text-subtle",
						children: [" · about ", K(t.duration_minutes)]
					})
				]
			}),
			U(t) && /* @__PURE__ */ I($, {
				label: "FC",
				children: U(t)
			}),
			t.formup && /* @__PURE__ */ I($, {
				label: "Form-up",
				children: t.formup
			}),
			t.comms && /* @__PURE__ */ I($, {
				label: "Comms",
				children: t.comms
			}),
			t.doctrine && /* @__PURE__ */ I($, {
				label: "Doctrine",
				children: t.doctrine.link ? /* @__PURE__ */ I(j, {
					to: t.doctrine.link,
					className: "text-accent hover:underline",
					children: t.doctrine.name
				}) : t.doctrine.name
			}),
			(t.states.length > 0 || t.groups.length > 0) && /* @__PURE__ */ I($, {
				label: "For",
				children: /* @__PURE__ */ L("span", {
					className: "flex flex-wrap gap-1",
					children: [t.states.map((t) => /* @__PURE__ */ I(e, {
						size: "xs",
						color: t.color,
						children: t.name
					}, `s${t.id}`)), t.groups.map((t) => /* @__PURE__ */ I(e, {
						size: "xs",
						tone: "neutral",
						children: t.name
					}, `g${t.id}`))]
				})
			}),
			t.description && /* @__PURE__ */ I($, {
				label: "Details",
				children: /* @__PURE__ */ I("span", {
					className: "whitespace-pre-wrap",
					children: t.description
				})
			}),
			i.length > 0 && /* @__PURE__ */ I($, {
				label: `Going (${i.length})`,
				children: s(i)
			}),
			a.length > 0 && /* @__PURE__ */ I($, {
				label: `Maybe (${a.length})`,
				children: s(a)
			}),
			o.length > 0 && /* @__PURE__ */ I($, {
				label: `Can't (${o.length})`,
				children: s(o)
			}),
			/* @__PURE__ */ L($, {
				label: "Posted by",
				children: [t.created_by?.name ?? "someone", /* @__PURE__ */ L("span", {
					className: "text-subtle",
					children: [" · updated ", ee(t.updated_at)]
				})]
			}),
			t.status !== "cancelled" && t.status !== "past" && /* @__PURE__ */ I("div", {
				className: "pt-2",
				children: /* @__PURE__ */ I(Fe, {
					op: t,
					board: n
				})
			})
		]
	});
}
function $({ label: e, children: t }) {
	return /* @__PURE__ */ L("div", {
		className: "flex gap-3 py-0.5",
		children: [/* @__PURE__ */ I("span", {
			className: "w-24 shrink-0 text-xs uppercase tracking-wider text-subtle",
			children: e
		}), /* @__PURE__ */ I("span", {
			className: "min-w-0 text-text",
			children: t
		})]
	});
}
function Le({ op: n, board: r, now: i, onEdit: u, onCancel: d, onDelete: f }) {
	let [p, m] = P(() => window.location.hash === `#o${n.id}`), h = n.status === "cancelled" || n.status === "past";
	return /* @__PURE__ */ L("li", {
		id: `o${n.id}`,
		className: C("relative scroll-mt-24", n.status === "cancelled" && "opacity-60"),
		children: [
			/* @__PURE__ */ I("span", {
				className: C("absolute inset-y-0 left-0 w-1", V[n.kind].stripe),
				"aria-hidden": !0
			}),
			/* @__PURE__ */ L("div", {
				className: "grid gap-x-4 gap-y-2 px-card py-3 pl-5 sm:grid-cols-[130px_minmax(0,1.6fr)_minmax(0,1fr)_auto] sm:items-center",
				children: [
					/* @__PURE__ */ L("div", {
						className: "flex items-center justify-between gap-2 sm:block",
						children: [/* @__PURE__ */ I(Q, {
							op: n,
							now: i
						}), /* @__PURE__ */ I(x, {
							content: E(n.starts_at),
							children: /* @__PURE__ */ L("span", {
								className: "block text-xs text-subtle",
								children: [
									q(n.starts_at),
									" ET · ",
									K(n.duration_minutes)
								]
							})
						})]
					}),
					/* @__PURE__ */ L("button", {
						type: "button",
						className: "min-w-0 text-left",
						onClick: () => m((e) => !e),
						"aria-expanded": p,
						children: [/* @__PURE__ */ L("span", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ I("span", {
								className: C("truncate font-medium text-text", n.status === "cancelled" && "line-through"),
								children: n.title
							}), n.important && /* @__PURE__ */ I(e, {
								tone: "accent",
								size: "xs",
								children: "Everyone"
							})]
						}), /* @__PURE__ */ L("span", {
							className: "block truncate text-xs text-subtle",
							children: [U(n) ? `FC ${U(n)}` : "FC to be announced", n.doctrine && /* @__PURE__ */ L(F, { children: [" · ", n.doctrine.name] })]
						})]
					}),
					/* @__PURE__ */ L("div", {
						className: "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted",
						children: [
							/* @__PURE__ */ I(Ne, { op: n }),
							n.formup && /* @__PURE__ */ L("span", {
								className: "inline-flex min-w-0 items-center gap-1",
								children: [/* @__PURE__ */ I(ge, { className: "size-3.5 shrink-0" }), /* @__PURE__ */ I("span", {
									className: "truncate",
									children: n.formup
								})]
							}),
							n.comms && /* @__PURE__ */ L("span", {
								className: "inline-flex min-w-0 items-center gap-1",
								children: [/* @__PURE__ */ I(_e, { className: "size-3.5 shrink-0" }), /* @__PURE__ */ I("span", {
									className: "truncate",
									children: n.comms
								})]
							})
						]
					}),
					/* @__PURE__ */ L("div", {
						className: "flex items-center justify-end gap-2",
						children: [
							/* @__PURE__ */ I(x, {
								content: `${n.counts.going} going · ${n.counts.maybe} maybe`,
								children: /* @__PURE__ */ L("span", {
									className: "inline-flex items-center gap-1 text-xs text-muted",
									children: [
										/* @__PURE__ */ I(Ce, { className: "size-3.5" }),
										" ",
										n.counts.going,
										n.counts.maybe ? `+${n.counts.maybe}` : ""
									]
								})
							}),
							h ? /* @__PURE__ */ I(Pe, { answer: n.my_answer }) : /* @__PURE__ */ I(t, {
								variant: n.my_answer === "going" ? "success" : "secondary",
								size: "xs",
								onClick: () => m(!0),
								"aria-label": `Answer ${n.title}`,
								children: n.my_answer === "going" ? /* @__PURE__ */ L(F, { children: [/* @__PURE__ */ I(Z, {}), " Going"] }) : n.my_answer === "maybe" ? "Maybe" : n.my_answer === "declined" ? "Not going" : "Going?"
							}),
							n.can_edit && n.status !== "cancelled" && /* @__PURE__ */ L(s, { children: [/* @__PURE__ */ I(l, {
								asChild: !0,
								children: /* @__PURE__ */ I(t, {
									variant: "ghost",
									size: "icon-xs",
									"aria-label": `Options for ${n.title}`,
									children: /* @__PURE__ */ I(Se, {})
								})
							}), /* @__PURE__ */ L(a, {
								align: "end",
								children: [
									/* @__PURE__ */ L(o, {
										onSelect: u,
										children: [/* @__PURE__ */ I(be, {}), " Edit"]
									}),
									!h && /* @__PURE__ */ L(o, {
										onSelect: d,
										children: [/* @__PURE__ */ I(ve, {}), " Cancel op"]
									}),
									/* @__PURE__ */ I(c, {}),
									/* @__PURE__ */ L(o, {
										danger: !0,
										onSelect: f,
										children: [/* @__PURE__ */ I(xe, {}), " Delete"]
									})
								]
							})] })
						]
					})
				]
			}),
			p && /* @__PURE__ */ I("div", {
				className: "border-t border-border bg-bg/40 px-card py-3 pl-5",
				children: /* @__PURE__ */ I(Ie, {
					op: n,
					board: r,
					now: i
				})
			})
		]
	});
}
function Re({ now: e, onOpen: r }) {
	let [i, a] = P(() => {
		let t = new Date(e);
		return {
			year: t.getUTCFullYear(),
			month: t.getUTCMonth()
		};
	}), o = `${i.year}-${String(i.month + 1).padStart(2, "0")}`, { data: s, isLoading: c } = k({
		queryKey: [
			"ops",
			"month",
			o
		],
		queryFn: () => S.get(`${R}/month?month=${o}`)
	}), l = /* @__PURE__ */ new Map();
	for (let e of s ?? []) {
		let t = J(e.starts_at);
		l.set(t, [...l.get(t) ?? [], e]);
	}
	let u = J(e), d = (e) => a((t) => {
		let n = t.month + e;
		return {
			year: t.year + Math.floor(n / 12),
			month: (n % 12 + 12) % 12
		};
	}), f = new Date(Date.UTC(i.year, i.month, 1)).toLocaleDateString("en-GB", {
		month: "long",
		year: "numeric",
		timeZone: "UTC"
	});
	return /* @__PURE__ */ L(n, {
		className: "overflow-hidden",
		children: [/* @__PURE__ */ L("div", {
			className: "flex items-center justify-between gap-3 border-b border-border px-card py-2",
			children: [
				/* @__PURE__ */ I(t, {
					variant: "ghost",
					size: "icon-xs",
					"aria-label": "Previous month",
					onClick: () => d(-1),
					children: /* @__PURE__ */ I(me, {})
				}),
				/* @__PURE__ */ L("span", {
					className: "font-medium",
					children: [
						f,
						" ",
						/* @__PURE__ */ I("span", {
							className: "text-xs text-subtle",
							children: "· EVE time"
						})
					]
				}),
				/* @__PURE__ */ I(t, {
					variant: "ghost",
					size: "icon-xs",
					"aria-label": "Next month",
					onClick: () => d(1),
					children: /* @__PURE__ */ I(he, {})
				})
			]
		}), c ? /* @__PURE__ */ I(h, { className: "h-96" }) : /* @__PURE__ */ I("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ L("div", {
				className: "grid min-w-[640px] grid-cols-7 text-xs",
				children: [[
					"Mon",
					"Tue",
					"Wed",
					"Thu",
					"Fri",
					"Sat",
					"Sun"
				].map((e) => /* @__PURE__ */ I("div", {
					className: "border-b border-border px-2 py-1 text-subtle uppercase tracking-wider",
					children: e
				}, e)), ce(i.year, i.month).flat().map((e) => {
					let t = Number(e.slice(5, 7)) === i.month + 1, n = l.get(e) ?? [];
					return /* @__PURE__ */ L("div", {
						className: C("min-h-24 border-b border-r border-border p-1", !t && "bg-bg/40 text-subtle"),
						children: [/* @__PURE__ */ I("div", {
							className: C("mb-1 text-right tabular-nums", e === u && "font-semibold text-accent"),
							children: Number(e.slice(8))
						}), /* @__PURE__ */ I("ul", {
							className: "space-y-0.5",
							children: n.map((e) => /* @__PURE__ */ I("li", { children: /* @__PURE__ */ L("button", {
								type: "button",
								onClick: () => r(e),
								className: C("flex w-full items-center gap-1 truncate bg-surface px-1 py-0.5 text-left hover:bg-hover", e.status === "cancelled" && "line-through opacity-60"),
								children: [
									/* @__PURE__ */ I("span", {
										className: C("size-1.5 shrink-0", V[e.kind].stripe),
										"aria-hidden": !0
									}),
									/* @__PURE__ */ I("span", {
										className: "tabular-nums text-subtle",
										children: q(e.starts_at)
									}),
									/* @__PURE__ */ I("span", {
										className: "truncate text-text",
										children: e.title
									}),
									e.my_answer === "going" && /* @__PURE__ */ I(Z, { className: "size-3 shrink-0 text-success-fg" })
								]
							}) }, e.id))
						})]
					}, e);
				})]
			})
		})]
	});
}
function ze() {
	let e = A(), { data: a, isLoading: o } = Me(), s = ke(), [c, l] = P(null), [d, f] = P(null), [m, _] = P(null), [b, x] = P(null), [C, T] = P(!1), E = () => e.invalidateQueries({ queryKey: ["ops"] });
	M(() => {
		a && window.location.hash.startsWith("#o") && document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
	}, [a]);
	let ee = O({
		mutationFn: (e) => S.post(`${R}/${e}/cancel`, {}),
		onSuccess: () => {
			E(), D.success("Op cancelled; everyone who answered was told");
		},
		onError: (e) => D.error(e.message)
	}), te = O({
		mutationFn: (e) => S.delete(`${R}/${e}`),
		onSuccess: () => {
			E(), D.success("Op deleted");
		},
		onError: (e) => D.error(e.message)
	}), k = a?.upcoming ?? [], j = k.find((e) => new Date(e.starts_at).getTime() > s), N = k.filter((e) => e.status === "live").length, z = k.filter((e) => new Date(e.starts_at).getTime() - s < 6048e5).length, B = k.filter((e) => e.my_answer === "going").length, V = k.filter((e) => !e.my_answer && e.status === "upcoming").length, H = b ? k.find((e) => e.id === b.id) ?? a?.past.find((e) => e.id === b.id) ?? b : null, U = [];
	for (let e of k) {
		let t = se(e.starts_at, s), n = U[U.length - 1];
		n && n.label === t ? n.ops.push(e) : U.push({
			label: t,
			ops: [e]
		});
	}
	let W = (e) => a && /* @__PURE__ */ I(Le, {
		op: e,
		board: a,
		now: s,
		onEdit: () => l(e),
		onCancel: () => f(e),
		onDelete: () => _(e)
	}, e.id);
	return /* @__PURE__ */ L(F, { children: [
		/* @__PURE__ */ I(p, {
			eyebrow: "Operations",
			title: "Ops calendar",
			icon: /* @__PURE__ */ I(X, {}),
			description: "CTAs, stratops, roams and everything else on one calendar, in EVE time. Say whether you're coming and you'll be reminded before form-up.",
			actions: a?.can_schedule ? /* @__PURE__ */ L("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [a.can_manage && /* @__PURE__ */ L(t, {
					variant: "ghost",
					onClick: () => T(!0),
					children: [/* @__PURE__ */ I(we, {}), " Settings"]
				}), /* @__PURE__ */ L(t, {
					variant: "primary",
					onClick: () => l("new"),
					children: [/* @__PURE__ */ I(ye, {}), " Schedule op"]
				})]
			}) : void 0
		}),
		o || !a ? /* @__PURE__ */ L("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ I("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					0,
					1,
					2,
					3
				].map((e) => /* @__PURE__ */ I(h, { className: "h-24" }, e))
			}), /* @__PURE__ */ I(h, { className: "h-64" })]
		}) : /* @__PURE__ */ L("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ L("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ I(g, {
						label: "Next op",
						icon: /* @__PURE__ */ I(De, {}),
						tone: j ? new Date(j.starts_at).getTime() - s < 36e5 ? "danger" : "accent" : void 0,
						value: j ? /* @__PURE__ */ I(Q, {
							op: j,
							now: s,
							className: "text-2xl"
						}) : "—",
						hint: j ? `${j.title} · ${q(j.starts_at)} ET` : "Nothing scheduled",
						mono: !1
					}),
					/* @__PURE__ */ I(g, {
						label: "Next 7 days",
						icon: /* @__PURE__ */ I(X, {}),
						value: z,
						hint: N ? `${N} running now` : "ops scheduled"
					}),
					/* @__PURE__ */ I(g, {
						label: "I'm going to",
						icon: /* @__PURE__ */ I(Ce, {}),
						value: B,
						tone: B ? "success" : void 0,
						hint: B ? "you'll be reminded" : "answer an op"
					}),
					/* @__PURE__ */ I(g, {
						label: "Not answered",
						icon: /* @__PURE__ */ I(Oe, {}),
						value: V,
						tone: V ? "warning" : void 0,
						hint: V ? "let your FC know" : "all answered"
					})
				]
			}), /* @__PURE__ */ L(y, {
				variant: "pills",
				defaultValue: "list",
				className: "space-y-4",
				items: [
					{
						value: "list",
						label: "Upcoming",
						count: k.length,
						icon: /* @__PURE__ */ I(Ee, {})
					},
					{
						value: "calendar",
						label: "Calendar",
						icon: /* @__PURE__ */ I(X, {})
					},
					{
						value: "past",
						label: "Recent",
						count: a.past.length
					}
				],
				children: [
					/* @__PURE__ */ I(v, {
						value: "list",
						children: k.length === 0 ? /* @__PURE__ */ I(n, { children: /* @__PURE__ */ I(u, {
							icon: /* @__PURE__ */ I(Te, {}),
							title: "No ops scheduled",
							description: a.can_schedule ? "Schedule one and its audience is told under the bell." : "When an FC schedules an op, it shows up here.",
							action: a.can_schedule ? /* @__PURE__ */ L(t, {
								variant: "primary",
								onClick: () => l("new"),
								children: [/* @__PURE__ */ I(ye, {}), " Schedule op"]
							}) : void 0
						}) }) : /* @__PURE__ */ I("div", {
							className: "space-y-6",
							children: U.map((e) => /* @__PURE__ */ L("section", { children: [/* @__PURE__ */ L("h2", {
								className: "hud-label mb-2 flex items-center gap-3 text-text",
								children: [
									e.label,
									/* @__PURE__ */ I("span", {
										className: "h-px flex-1 bg-border",
										"aria-hidden": !0
									}),
									/* @__PURE__ */ L("span", {
										className: "text-xs font-normal normal-case tracking-normal text-subtle",
										children: [
											e.ops.length,
											" op",
											e.ops.length === 1 ? "" : "s"
										]
									})
								]
							}), /* @__PURE__ */ I(n, {
								className: "overflow-hidden",
								children: /* @__PURE__ */ I("ul", {
									className: "divide-y divide-border",
									children: e.ops.map(W)
								})
							})] }, e.label))
						})
					}),
					/* @__PURE__ */ I(v, {
						value: "calendar",
						children: /* @__PURE__ */ I(Re, {
							now: s,
							onOpen: x
						})
					}),
					/* @__PURE__ */ I(v, {
						value: "past",
						children: a.past.length === 0 ? /* @__PURE__ */ I(n, { children: /* @__PURE__ */ I(u, {
							icon: /* @__PURE__ */ I(X, {}),
							title: "No recent ops",
							description: "Finished and cancelled ops stay here for a while."
						}) }) : /* @__PURE__ */ I(n, {
							className: "overflow-hidden",
							children: /* @__PURE__ */ I("ul", {
								className: "divide-y divide-border opacity-90",
								children: a.past.map(W)
							})
						})
					})
				]
			})]
		}),
		H && a && /* @__PURE__ */ L(i, {
			open: !0,
			onOpenChange: (e) => !e && x(null),
			title: H.title,
			size: "lg",
			footer: /* @__PURE__ */ L(F, { children: [H.can_edit && H.status !== "cancelled" && /* @__PURE__ */ L(t, {
				variant: "ghost",
				className: "mr-auto",
				onClick: () => {
					l(H), x(null);
				},
				children: [/* @__PURE__ */ I(be, {}), " Edit"]
			}), /* @__PURE__ */ I(t, {
				variant: "secondary",
				onClick: () => x(null),
				children: "Close"
			})] }),
			children: [/* @__PURE__ */ L("div", {
				className: "mb-3 flex items-center gap-2",
				children: [/* @__PURE__ */ I(Ne, { op: H }), /* @__PURE__ */ I(Q, {
					op: H,
					now: s
				})]
			}), /* @__PURE__ */ I(Ie, {
				op: H,
				board: a,
				now: s
			})]
		}),
		c && /* @__PURE__ */ I(de, {
			op: c === "new" ? null : c,
			onClose: () => l(null)
		}),
		C && /* @__PURE__ */ I(je, { onClose: () => T(!1) }),
		/* @__PURE__ */ I(r, {
			open: !!d,
			onOpenChange: (e) => !e && f(null),
			danger: !0,
			title: `Cancel "${d?.title}"?`,
			description: `Everyone who said they're going or maybe is told, and webhooks hear about it. It stays on the calendar, crossed out. Planned for ${d ? w(d.starts_at) : ""}.`,
			confirmLabel: /* @__PURE__ */ L(F, { children: [/* @__PURE__ */ I(ve, {}), " Cancel op"] }),
			onConfirm: () => d && ee.mutateAsync(d.id)
		}),
		/* @__PURE__ */ I(r, {
			open: !!m,
			onOpenChange: (e) => !e && _(null),
			danger: !0,
			title: `Delete "${m?.title}"?`,
			description: "It disappears for everyone without anyone being told. To call an op off, cancel it instead.",
			confirmLabel: /* @__PURE__ */ L(F, { children: [/* @__PURE__ */ I(xe, {}), " Delete"] }),
			onConfirm: () => m && te.mutateAsync(m.id)
		})
	] });
}
//#endregion
//#region src/index.tsx
function Be() {
	let { data: e, isLoading: t } = k({
		queryKey: ["ops", "widget"],
		queryFn: () => S.get(R),
		refetchInterval: 12e4
	}), n = ke();
	if (t) return /* @__PURE__ */ I(h, { className: "h-24" });
	if (!e) return null;
	let r = e.upcoming.slice(0, 4);
	return r.length === 0 ? /* @__PURE__ */ I("p", {
		className: "text-sm text-subtle",
		children: "No ops scheduled."
	}) : /* @__PURE__ */ L("ul", {
		className: "divide-y divide-border",
		children: [r.map((e) => /* @__PURE__ */ I("li", { children: /* @__PURE__ */ L(j, {
			to: `/p/ops#o${e.id}`,
			className: "flex items-center gap-3 py-2 hover:text-text",
			children: [
				/* @__PURE__ */ I("span", {
					className: C("h-8 w-0.5 shrink-0", V[e.kind].stripe),
					"aria-hidden": !0
				}),
				/* @__PURE__ */ L("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ I("span", {
						className: "block truncate text-sm font-medium",
						children: e.title
					}), /* @__PURE__ */ L("span", {
						className: "block truncate text-xs text-subtle",
						children: [
							B[e.kind],
							" · ",
							q(e.starts_at),
							" ET",
							e.my_answer && /* @__PURE__ */ L(F, { children: [" · ", /* @__PURE__ */ I(Pe, { answer: e.my_answer })] })
						]
					})]
				}),
				/* @__PURE__ */ I(Q, {
					op: e,
					now: n,
					className: "text-xs"
				})
			]
		}) }, e.id)), e.upcoming.length > r.length && /* @__PURE__ */ I("li", {
			className: "pt-2 text-xs text-subtle",
			children: /* @__PURE__ */ L(j, {
				to: "/p/ops",
				className: "hover:text-text",
				children: [e.upcoming.length - r.length, " more on the calendar"]
			})
		})]
	});
}
var Ve = T({
	routes: [{
		path: "",
		Component: ze
	}],
	widgets: [{
		id: "upcoming",
		title: "Upcoming ops",
		Component: Be,
		size: "md",
		order: 7
	}]
});
//#endregion
export { Ve as default };

export const classes = ["!data","!fc","!inMonth","!o","!op","@conduit/sdk","@tanstack/react-query","a","about","absolute","accent","action","actions","align","all","alt","an","and","animate-pulse","announced","answer","answered","answering","anyone","are","aria-autocomplete","aria-expanded","aria-hidden","aria-label","aria-pressed","aria-selected","as","attending","audience","autoComplete","autoFocus","available","back","background","badge","be","before","being","below","bg-accent","bg-accent-soft","bg-bg","bg-bg/40","bg-border","bg-border-strong","bg-danger","bg-info","bg-success","bg-surface","bg-warning","block","board","body","border","border-accent/60","border-b","border-border","border-border-strong","border-r","border-t","box","bring","but","button","by","byDay","calendar","call","can","can_edit","can_manage","can_schedule","cancel","cancelled","cancelling","center","change","character","character_id","characters","checked","children","chosen","className","close","cn","color","colour","coloured","come","coming","comms","component","confirmLabel","const","content","copy","count","countdown","countdowns","counting","counts","created_by","crossed","cta","current","currentColor","cx","cy","d","danger","data","datetime-local","day","days","debounced","declined","default","defaultValue","default_ping_roles","defense","del","deleted","deleting","description","diff","disabled","disappears","discord","discord-roles","divide-border","divide-y","do","doctrine","doctrine_id","doctrine_name","doctrines","done","down","drop","duration_minutes","editing","editors","either","else","en-GB","enabled","end","ends_at","entered","error","eveClock","even","every","everyone","everything","expected","export","eyebrow","fc","fc_name","fcs","few","fill","finished","first","fleet","flex","flex-1","flex-wrap","font-medium","font-mono","font-normal","font-semibold","footer","for","form","form-up","forms","formup","fresh","from","function","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-x-3","gap-x-4","gap-y-1","gap-y-2","get","gets","ghost","go","going","grid","grid-cols-7","group","grouping","groups","h","h-24","h-64","h-7","h-8","h-96","h-px","hangar","has","hash","hear","height","here","hint","hits","hover:bg-hover","hover:border-border-strong","hover:text-text","hover:underline","how","hud-label","i","icon","icon-xs","icons","id","ids","if","import","important","in","inMonth","included","info","inline","inline-flex","input","inset-y-0","instant","interface","intervalMs","into","is","isLoading","isPending","isn","iso","it","items","items-center","its","justify-between","justify-end","keep_days","key","kind","know","known","label","last","lazy","leads","leave","led","left","left-0","length","let","lg","lg:grid-cols-4","line-through","link","linked","list","listbox","live","ll","loading","location","long","m","m12","m15","m4.9","m6","m9","main_character","manage_ops","marked","max","max-h-60","maxLength","maybe","mb-1","mb-1.5","mb-2","mb-3","md","me","member","members","mention","mentions","min","min-h-24","min-w-0","min-w-[640px]","mine","mining","minutes","mono","month","monthGrid","more","mousedown","move","mr-auto","ms","mt-1","mt-1.5","mutationFn","muted","my_answer","my_character","my_note","name","names","neutral","new","next","no","none","normal-case","not","note","notifications","notify","now","null","number","numeric","of","off","on","onBlur","onCancel","onChange","onCheckedChange","onClick","onClose","onConfirm","onDelete","onDown","onEdit","onError","onFocus","onKeyDown","onMouseDown","onOpen","onOpenChange","onPick","onSelect","onSuccess","onType","once","one","only","op","opacity-60","opacity-90","open","opens","ops","option","options","or","order","other","outside","overflow-auto","overflow-hidden","overflow-x-auto","own","p-1","pad","past","patch","path","people","per","person","pick","picked","pills","ping","pingRoles","ping_roles","pl-5","placeholder","planned","plugin","points","portrait","post","primary","pt-2","put","px-1","px-2","px-3","px-card","py-0.5","py-1","py-2","py-3","qc","queryFn","queryKey","re","react","react-router","read","ready","recent","ref","refetchInterval","refresh","relative","remind","reminded","reminder_minutes","reminders","required","rest","results","return","right-0","roam","roams","role","roles","rotate-45","round","rounded-full","routes","row","rows","rsvps","run","running","rx","s","said","save","saved","schedule_ops","scheduled","schedules","scroll","scroll-mt-24","secondary","see","self-center","server","set","setCancelling","setCursor","setDebounced","setDeleting","setEditing","setForm","setNote","setNow","setOpen","setSettingsOpen","setViewing","setting","settings","shadow-e2","short","shown","shows","shrink-0","site","size","size-1.5","size-2","size-3","size-3.5","size-4","size-6","sm:block","sm:grid-cols-2","sm:grid-cols-[130px_minmax(0,1.6fr)_minmax(0,1fr)_auto]","sm:grid-cols-[1fr_180px]","sm:items-center","so","social","someone","space-y-0.5","space-y-4","space-y-5","space-y-6","spare","src","staleTime","start","starts","startsAt","starts_at","states","status","stay","stays","still","stratop","string","stripe","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","such","t","tabular-nums","taken","target","text","text-2xl","text-[13px]","text-accent","text-danger-fg","text-left","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xs","than","that","the","their","then","there","these","they","this","through","time","timeZone","title","to","toEveInput","toast","today","toggle","told","tone","top-full","tracking-normal","tracking-wider","training","transition-colors","true","truncate","type","typeof","unanswered","undefined","under","unknown","unless","until","up","upcoming","updated","updated_at","updates","uppercase","use","useCurrentUser","useDiscordRoles","useNow","useQuery","useQueryClient","useRef","useState","used","user","using","v","value","variant","viewBox","viewed","viewing","void","w-0.5","w-1","w-24","w-28","w-44","w-48","w-full","warning","was","webhook","webhooks","week","weekday","weeks","what","when","whether","which","while","whitespace-pre-wrap","who","whoever","whole","widget","widgets","width","will","with","without","x","x1","x2","xs","y1","y2","year","you","your","z-20"];
