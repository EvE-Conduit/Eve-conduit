import { Badge as e, Button as t, Card as n, ConfirmDialog as r, Dialog as i, DropdownContent as a, DropdownItem as o, DropdownMenu as s, DropdownSeparator as c, DropdownTrigger as l, EmptyState as u, Field as d, Input as f, PageHeader as p, Segmented as m, Select as h, Skeleton as g, StatCard as _, SwitchRow as v, TabPanel as y, Tabs as b, Textarea as x, Tooltip as S, api as C, cn as w, dateTime as T, definePlugin as E, eveAndLocal as D, localDateTime as O, timeAgo as k, toast as A } from "@conduit/sdk";
import { useMutation as j, useQuery as M, useQueryClient as N } from "@tanstack/react-query";
import { Link as P } from "react-router";
import { useEffect as F, useRef as ee, useState as I } from "react";
import { Fragment as L, jsx as R, jsxs as z } from "react/jsx-runtime";
//#region src/time.ts
var B = (e) => String(e).padStart(2, "0");
function te(e, t) {
	let n = Math.round((new Date(e).getTime() - t) / 1e3);
	if (n <= 0) return "";
	let r = Math.floor(n / 86400);
	n -= r * 86400;
	let i = Math.floor(n / 3600);
	n -= i * 3600;
	let a = Math.floor(n / 60);
	return n -= a * 60, r ? `${r}d ${B(i)}h ${B(a)}m` : `${B(i)}:${B(a)}:${B(n)}`;
}
function ne(e, t) {
	let n = Math.max(0, Math.round((new Date(e).getTime() - t) / 1e3)), r = Math.floor(n / 86400);
	n -= r * 86400;
	let i = Math.floor(n / 3600), a = Math.floor((n - i * 3600) / 60);
	return r ? `${r}d ${i}h` : i ? `${i}h ${a}m` : `${a}m`;
}
function re(e) {
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
function ie(e) {
	if (!e) return "";
	let t = new Date(e);
	return `${t.getFullYear()}-${B(t.getMonth() + 1)}-${B(t.getDate())}T${B(t.getHours())}:${B(t.getMinutes())}`;
}
function ae(e) {
	return e ? new Date(e).toISOString() : null;
}
function V(e, t) {
	let n = (e) => Math.floor(e / 864e5), r = n(new Date(e).getTime()) - n(t), i = new Date(e).toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "UTC"
	});
	return r === 0 ? `Today · ${i}` : r === 1 ? `Tomorrow · ${i}` : r === -1 ? `Yesterday · ${i}` : i;
}
//#endregion
//#region src/types.ts
var H = "/api/p/timers", U = [
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
], oe = Object.fromEntries(U.map((e) => [e.value, e.label])), W = {
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
function G(e) {
	return e >= .5 ? "text-success-fg" : e > 0 ? "text-warning-fg" : "text-danger-fg";
}
//#endregion
//#region src/editor.tsx
function se({ timer: e, onClose: n }) {
	let r = N(), { data: a } = M({
		queryKey: ["timers", "types"],
		queryFn: () => C.get(`${H}/types`),
		staleTime: 36e5
	}), [o, s] = I({
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
		notify: !0
	}), [c, l] = I(e ? "exact" : "left"), [u, p] = I(""), [g, _] = I(ie(e?.ends_at)), [y, b] = I(Date.now()), S = (e) => s((t) => ({
		...t,
		...e
	})), w = c === "left" ? re(u) : null, E = c === "left" ? w == null ? null : new Date(y + w * 1e3).toISOString() : ae(g), D = !!o.name.trim() && !!o.system && !!E, O = j({
		mutationFn: () => {
			let t = {
				name: o.name,
				structure_type: o.structure_type,
				system: o.system.id,
				kind: o.kind,
				side: o.side,
				owner: o.owner,
				ends_at: E,
				notes: o.notes,
				important: o.important,
				notify: o.notify
			};
			return e ? C.put(`${H}/${e.id}`, t) : C.post(H, t);
		},
		onSuccess: (t) => {
			r.invalidateQueries({ queryKey: ["timers"] }), A.success(e ? "Timer updated" : `Timer added: ${t.name} comes out ${T(t.ends_at)}`), n();
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ R(i, {
		open: !0,
		onOpenChange: (e) => !e && n(),
		title: e ? "Edit timer" : "Add timer",
		size: "lg",
		footer: /* @__PURE__ */ z(L, { children: [
			/* @__PURE__ */ R("span", {
				className: "mr-auto self-center text-xs text-muted",
				children: E ? /* @__PURE__ */ z(L, { children: ["Comes out ", /* @__PURE__ */ R("span", {
					className: "text-text",
					children: T(E)
				})] }) : c === "left" ? "Type the time left as the game shows it." : "Pick the exact time."
			}),
			/* @__PURE__ */ R(t, {
				variant: "ghost",
				onClick: n,
				children: "Cancel"
			}),
			/* @__PURE__ */ R(t, {
				variant: "primary",
				disabled: !D,
				loading: O.isPending,
				onClick: () => O.mutate(),
				children: e ? "Save" : "Add timer"
			})
		] }),
		children: /* @__PURE__ */ z("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ z("div", {
					className: "grid gap-4 sm:grid-cols-[1fr_200px]",
					children: [/* @__PURE__ */ R(d, {
						label: "Structure",
						required: !0,
						hint: "Its name as shown in game.",
						children: /* @__PURE__ */ R(f, {
							value: o.name,
							maxLength: 200,
							onChange: (e) => S({ name: e.target.value }),
							placeholder: "M-OEE8 Keepstar",
							autoFocus: !0
						})
					}), /* @__PURE__ */ z(d, {
						label: "Type",
						children: [/* @__PURE__ */ R(f, {
							list: "timers-structure-types",
							value: o.structure_type,
							maxLength: 60,
							onChange: (e) => S({ structure_type: e.target.value }),
							placeholder: "Fortizar"
						}), /* @__PURE__ */ R("datalist", {
							id: "timers-structure-types",
							children: (a ?? []).map((e) => /* @__PURE__ */ R("option", { value: e.name }, e.name))
						})]
					})]
				}),
				/* @__PURE__ */ z("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ R(ce, {
						value: o.system,
						onChange: (e) => S({ system: e })
					}), /* @__PURE__ */ R(d, {
						label: "Owner",
						hint: "Corporation or alliance.",
						children: /* @__PURE__ */ R(f, {
							value: o.owner,
							maxLength: 120,
							onChange: (e) => S({ owner: e.target.value }),
							placeholder: "Goonswarm Federation"
						})
					})]
				}),
				/* @__PURE__ */ z("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ R(d, {
						label: "Timer",
						children: /* @__PURE__ */ R(h, {
							value: o.kind,
							onChange: (e) => S({ kind: e.target.value }),
							options: U.map((e) => ({
								value: e.value,
								label: e.label
							}))
						})
					}), /* @__PURE__ */ z("div", { children: [/* @__PURE__ */ R("div", {
						className: "mb-1.5 text-[13px] font-medium",
						children: "Whose"
					}), /* @__PURE__ */ R(m, {
						value: o.side,
						onChange: (e) => S({ side: e }),
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
				/* @__PURE__ */ z("div", { children: [/* @__PURE__ */ z("div", {
					className: "mb-1.5 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ z("span", {
						className: "text-[13px] font-medium",
						children: ["When it comes out ", /* @__PURE__ */ R("span", {
							className: "text-danger-fg",
							children: "*"
						})]
					}), /* @__PURE__ */ R(m, {
						value: c,
						onChange: l,
						size: "sm",
						options: [{
							value: "left",
							label: "Time left"
						}, {
							value: "exact",
							label: "Exact time"
						}]
					})]
				}), c === "left" ? /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(f, {
					value: u,
					onChange: (e) => {
						p(e.target.value), b(Date.now());
					},
					placeholder: "1d 4h 23m",
					className: "font-mono",
					"aria-invalid": !!u && w == null
				}), /* @__PURE__ */ z("p", {
					className: "mt-1.5 text-xs text-muted",
					children: [
						"As the game shows it: ",
						/* @__PURE__ */ R("span", {
							className: "font-mono",
							children: "1d 4h 23m"
						}),
						", ",
						/* @__PURE__ */ R("span", {
							className: "font-mono",
							children: "4h 23m"
						}),
						", ",
						/* @__PURE__ */ R("span", {
							className: "font-mono",
							children: "45m"
						}),
						" or ",
						/* @__PURE__ */ R("span", {
							className: "font-mono",
							children: "4:23"
						}),
						". Counted from now."
					]
				})] }) : /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(f, {
					type: "datetime-local",
					value: g,
					onChange: (e) => _(e.target.value)
				}), /* @__PURE__ */ z("p", {
					className: "mt-1.5 text-xs text-muted",
					children: [
						"In your own time zone",
						E ? /* @__PURE__ */ z(L, { children: ["; that's ", T(E)] }) : null,
						"."
					]
				})] })] }),
				/* @__PURE__ */ R(d, {
					label: "Notes",
					hint: "Form-up, doctrine, comms, what to expect.",
					children: /* @__PURE__ */ R(x, {
						rows: 3,
						value: o.notes,
						maxLength: 5e3,
						onChange: (e) => S({ notes: e.target.value }),
						placeholder: "Form up 30 minutes before on Mumble. Doctrine: Ferox fleet."
					})
				}),
				/* @__PURE__ */ z("div", {
					className: "divide-y divide-border border border-border px-3",
					children: [/* @__PURE__ */ R(v, {
						label: "Everyone is expected",
						description: "Members are told now and reminded before it comes out, even if they muted timers.",
						checked: o.important,
						onCheckedChange: (e) => S({ important: e })
					}), !e && /* @__PURE__ */ R(v, {
						label: "Tell members it's been added",
						description: "Under the bell. Webhooks such as Discord hear about it either way.",
						checked: o.notify || o.important,
						disabled: o.important,
						onCheckedChange: (e) => S({ notify: e })
					})]
				})
			]
		})
	});
}
function ce({ value: e, onChange: t }) {
	let [n, r] = I(e?.name ?? ""), [i, a] = I(!1), [o, s] = I(n), c = ee(null);
	F(() => {
		let e = setTimeout(() => s(n), 150);
		return () => clearTimeout(e);
	}, [n]);
	let { data: l } = M({
		queryKey: [
			"timers",
			"systems",
			o
		],
		queryFn: () => C.get(`${H}/systems?q=${encodeURIComponent(o)}`),
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
	return /* @__PURE__ */ z("div", {
		ref: c,
		className: "relative",
		children: [/* @__PURE__ */ R(d, {
			label: "Solar system",
			required: !0,
			hint: e ? `${e.region} · ${e.security.toFixed(1)}` : "Start typing the name.",
			children: /* @__PURE__ */ R(f, {
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
		}), p.length > 0 && /* @__PURE__ */ R("ul", {
			role: "listbox",
			className: "absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto border border-border bg-surface shadow-e2",
			children: p.map((t) => /* @__PURE__ */ R("li", {
				role: "option",
				"aria-selected": t.id === e?.id,
				children: /* @__PURE__ */ z("button", {
					type: "button",
					onMouseDown: (e) => e.preventDefault(),
					onClick: () => u(t),
					className: "flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-hover",
					children: [
						/* @__PURE__ */ R("span", {
							className: w("font-mono text-xs font-semibold tabular-nums", G(t.security)),
							children: t.security.toFixed(1)
						}),
						/* @__PURE__ */ R("span", {
							className: "font-medium",
							children: t.name
						}),
						/* @__PURE__ */ R("span", {
							className: "ml-auto truncate text-xs text-subtle",
							children: t.region
						})
					]
				})
			}, t.id))
		})]
	});
}
//#endregion
//#region src/icons.tsx
function K({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ R("svg", {
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
var q = (e) => /* @__PURE__ */ z(K, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M10 2h4" }),
		/* @__PURE__ */ R("path", { d: "M12 14v-4" }),
		/* @__PURE__ */ R("circle", {
			cx: "12",
			cy: "14",
			r: "8"
		})
	]
}), J = (e) => /* @__PURE__ */ z(K, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M5 12h14" }), /* @__PURE__ */ R("path", { d: "M12 5v14" })]
}), le = (e) => /* @__PURE__ */ R(K, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" })
}), Y = (e) => /* @__PURE__ */ z(K, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M3 6h18" }),
		/* @__PURE__ */ R("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ R("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), ue = (e) => /* @__PURE__ */ z(K, {
	...e,
	children: [
		/* @__PURE__ */ R("circle", {
			cx: "12",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ R("circle", {
			cx: "19",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ R("circle", {
			cx: "5",
			cy: "12",
			r: "1"
		})
	]
}), de = (e) => /* @__PURE__ */ R(K, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "M20 6 9 17l-5-5" })
}), fe = (e) => /* @__PURE__ */ z(K, {
	...e,
	children: [/* @__PURE__ */ R("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ R("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), X = (e) => /* @__PURE__ */ z(K, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
		/* @__PURE__ */ R("circle", {
			cx: "9",
			cy: "7",
			r: "4"
		}),
		/* @__PURE__ */ R("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
		/* @__PURE__ */ R("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
	]
}), pe = (e) => /* @__PURE__ */ R(K, {
	...e,
	children: /* @__PURE__ */ R("path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" })
}), me = (e) => /* @__PURE__ */ z(K, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "m14.5 17.5 3 3" }),
		/* @__PURE__ */ R("path", { d: "M14.5 6.5 3 18l3 3L17.5 9.5" }),
		/* @__PURE__ */ R("path", { d: "m21 3-6.5 6.5" }),
		/* @__PURE__ */ R("path", { d: "M21 3h-4" }),
		/* @__PURE__ */ R("path", { d: "M21 3v4" }),
		/* @__PURE__ */ R("path", { d: "m6.5 6.5 3-3" }),
		/* @__PURE__ */ R("path", { d: "M3 3h4" }),
		/* @__PURE__ */ R("path", { d: "M3 3v4" }),
		/* @__PURE__ */ R("path", { d: "m9.5 9.5 11 11" })
	]
}), he = (e) => /* @__PURE__ */ z(K, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
		/* @__PURE__ */ R("path", { d: "M3 3v5h5" }),
		/* @__PURE__ */ R("path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }),
		/* @__PURE__ */ R("path", { d: "M16 16h5v5" })
	]
}), ge = (e) => /* @__PURE__ */ z(K, {
	...e,
	children: [
		/* @__PURE__ */ R("path", { d: "M13 7 9 3 5 7l4 4" }),
		/* @__PURE__ */ R("path", { d: "m17 11 4 4-4 4-4-4" }),
		/* @__PURE__ */ R("path", { d: "m8 12 4 4 6-6-4-4Z" }),
		/* @__PURE__ */ R("path", { d: "m16 8 3-3" }),
		/* @__PURE__ */ R("path", { d: "M9 21a6 6 0 0 0-6-6" })
	]
}), _e = [
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
function ve({ onClose: e }) {
	let n = N(), { data: r } = M({
		queryKey: ["timers", "settings"],
		queryFn: () => C.get(`${H}/settings`)
	}), [a, o] = I(null), s = a ?? r ?? null, c = (e) => s && o({
		...s,
		...e
	}), l = j({
		mutationFn: (e) => C.put(`${H}/settings`, e),
		onSuccess: (t) => {
			n.setQueryData(["timers", "settings"], t), n.invalidateQueries({ queryKey: ["timers"] }), A.success("Saved"), e();
		},
		onError: (e) => A.error(e.message)
	}), u = j({
		mutationFn: () => C.post(`${H}/import`, {}),
		onSuccess: (e) => {
			n.invalidateQueries({ queryKey: ["timers"] });
			let t = e.structures + e.notifications;
			A.success(t ? `${t} timer${t === 1 ? "" : "s"} added (${e.structures} from structures, ${e.notifications} from notifications)` : "Nothing new to add");
		},
		onError: (e) => A.error(e.message)
	}), p = (e) => s && c({ reminder_minutes: s.reminder_minutes.includes(e) ? s.reminder_minutes.filter((t) => t !== e) : [...s.reminder_minutes, e] });
	return /* @__PURE__ */ R(i, {
		open: !0,
		onOpenChange: (t) => !t && e(),
		title: "Timer settings",
		size: "md",
		footer: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(t, {
			variant: "ghost",
			onClick: e,
			children: "Cancel"
		}), /* @__PURE__ */ R(t, {
			variant: "primary",
			disabled: !s,
			loading: l.isPending,
			onClick: () => s && l.mutate(s),
			children: "Save"
		})] }),
		children: s ? /* @__PURE__ */ z("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ z("div", { children: [
					/* @__PURE__ */ R("div", {
						className: "mb-1.5 text-[13px] font-medium",
						children: "Reminders"
					}),
					/* @__PURE__ */ R("p", {
						className: "mb-2 text-xs text-muted",
						children: "How long before a timer comes out people who are going get a reminder. Timers marked \"everyone is expected\" remind every member."
					}),
					/* @__PURE__ */ R("div", {
						className: "flex flex-wrap gap-1.5",
						children: _e.map((e) => {
							let t = s.reminder_minutes.includes(e.minutes);
							return /* @__PURE__ */ R("button", {
								type: "button",
								"aria-pressed": t,
								onClick: () => p(e.minutes),
								className: w("border px-2 py-1 text-xs transition-colors", t ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text"),
								children: e.label
							}, e.minutes);
						})
					}),
					s.reminder_minutes.length === 0 && /* @__PURE__ */ R("p", {
						className: "mt-1.5 text-xs text-warning-fg",
						children: "No reminders will be sent."
					})
				] }),
				/* @__PURE__ */ z("div", {
					className: "divide-y divide-border border border-border px-3",
					children: [/* @__PURE__ */ R(v, {
						label: "From the corporation's structures",
						description: "Reinforced, anchoring and unanchoring structures on the corporation sheet get a timer.",
						checked: s.import_structures,
						onCheckedChange: (e) => c({ import_structures: e })
					}), /* @__PURE__ */ R(v, {
						label: "From in-game notifications",
						description: "Structures that lost shields or armor, sovereignty structures and customs offices, as members' characters are told.",
						checked: s.import_notifications,
						onCheckedChange: (e) => c({ import_notifications: e })
					})]
				}),
				/* @__PURE__ */ z("div", {
					className: "flex flex-wrap items-center justify-between gap-3 text-xs text-muted",
					children: [/* @__PURE__ */ z("span", { children: [
						"Both are checked every five minutes",
						s.notifications_seen_until ? /* @__PURE__ */ z(L, { children: ["; notifications last looked at ", k(s.notifications_seen_until)] }) : null,
						"."
					] }), /* @__PURE__ */ z(t, {
						variant: "secondary",
						size: "xs",
						loading: u.isPending,
						onClick: () => u.mutate(),
						children: [/* @__PURE__ */ R(he, {}), " Check now"]
					})]
				}),
				/* @__PURE__ */ R(d, {
					label: "Keep timers that came out for",
					hint: "Days. Afterwards they drop off the board.",
					children: /* @__PURE__ */ R(f, {
						type: "number",
						min: 1,
						max: 90,
						value: s.keep_days,
						onChange: (e) => c({ keep_days: Math.max(1, Math.min(90, Number(e.target.value) || 1)) }),
						className: "w-28"
					})
				})
			]
		}) : /* @__PURE__ */ R(g, { className: "h-64" })
	});
}
//#endregion
//#region src/now.ts
function Z(e = 1e3) {
	let [t, n] = I(() => Date.now());
	return F(() => {
		let t = setInterval(() => n(Date.now()), e);
		return () => clearInterval(t);
	}, [e]), t;
}
//#endregion
//#region src/board.tsx
function ye() {
	return M({
		queryKey: ["timers", "board"],
		queryFn: () => C.get(H),
		refetchInterval: 6e4
	});
}
function Q({ t: e, now: t, className: n }) {
	let r = new Date(e.ends_at).getTime() - t;
	return r <= 0 ? -r < 36e5 ? /* @__PURE__ */ z("span", {
		className: w("inline-flex items-center gap-1.5 font-mono text-sm font-semibold uppercase tracking-wider text-danger-fg", n),
		children: [/* @__PURE__ */ R("span", {
			className: "size-1.5 animate-pulse rotate-45 bg-danger",
			"aria-hidden": !0
		}), " Out now"]
	}) : /* @__PURE__ */ R("span", {
		className: w("font-mono text-sm tabular-nums text-subtle", n),
		children: k(e.ends_at)
	}) : /* @__PURE__ */ R("span", {
		className: w("font-mono text-sm font-semibold tabular-nums", r < 9e5 ? "text-danger-fg" : r < 36e5 ? "text-warning-fg" : r < 864e5 ? "text-text" : "text-muted", n),
		children: te(e.ends_at, t)
	});
}
function be({ t }) {
	let n = t.kind === "hull" ? "danger" : t.kind === "armor" ? "warning" : t.kind === "sov" ? "info" : "neutral";
	return /* @__PURE__ */ R(e, {
		tone: n,
		size: "xs",
		children: oe[t.kind]
	});
}
function xe({ t }) {
	let n = W[t.side];
	return /* @__PURE__ */ R(e, {
		tone: n.badge,
		size: "xs",
		variant: "dot",
		children: n.label
	});
}
function Se({ t: e }) {
	return /* @__PURE__ */ z("span", {
		className: "inline-flex min-w-0 items-baseline gap-1.5",
		children: [
			/* @__PURE__ */ R("span", {
				className: w("font-mono text-xs font-semibold tabular-nums", G(e.system.security)),
				children: e.system.security.toFixed(1)
			}),
			/* @__PURE__ */ R("span", {
				className: "font-medium",
				children: e.system.name
			}),
			e.system.region && /* @__PURE__ */ R("span", {
				className: "truncate text-xs text-subtle",
				children: e.system.region
			})
		]
	});
}
function Ce({ t }) {
	return /* @__PURE__ */ z("span", {
		className: "flex min-w-0 items-center gap-2.5",
		children: [t.icon ? /* @__PURE__ */ R("img", {
			src: t.icon,
			alt: "",
			className: "size-8 shrink-0 border border-border bg-bg",
			loading: "lazy"
		}) : /* @__PURE__ */ R("span", {
			className: "grid size-8 shrink-0 place-items-center border border-border text-subtle",
			children: /* @__PURE__ */ R(q, {})
		}), /* @__PURE__ */ z("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ z("span", {
				className: "flex items-center gap-1.5",
				children: [/* @__PURE__ */ R("span", {
					className: "truncate font-medium text-text",
					children: t.name
				}), t.important && /* @__PURE__ */ R(e, {
					tone: "accent",
					size: "xs",
					children: "Everyone"
				})]
			}), /* @__PURE__ */ z("span", {
				className: "block truncate text-xs text-subtle",
				children: [t.structure_type || "Structure", t.owner && /* @__PURE__ */ z(L, { children: [" · ", t.owner] })]
			})]
		})]
	});
}
function we() {
	let e = N(), { data: i, isLoading: a } = ye(), o = Z(), [s, c] = I(null), [l, d] = I(null), [f, m] = I(!1), h = () => e.invalidateQueries({ queryKey: ["timers"] });
	F(() => {
		i && window.location.hash.startsWith("#t") && document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
	}, [i]);
	let v = j({
		mutationFn: (e) => C.post(`${H}/${e.id}/going`, { going: !e.going }),
		onSuccess: (e, t) => {
			h(), A.success(e.going ? `You're going: ${t.name}` : `You're no longer going to ${t.name}`);
		},
		onError: (e) => A.error(e.message)
	}), x = j({
		mutationFn: (e) => C.delete(`${H}/${e}`),
		onSuccess: () => {
			h(), A.success("Timer removed");
		},
		onError: (e) => A.error(e.message)
	}), S = i?.upcoming ?? [], w = S.find((e) => new Date(e.ends_at).getTime() > o), T = S.filter((e) => e.side === "friendly").length, E = S.filter((e) => e.side === "hostile").length, D = S.filter((e) => V(e.ends_at, o).startsWith("Today")).length, O = i?.going.length ?? 0, k = [];
	for (let e of S) {
		let t = V(e.ends_at, o), n = k[k.length - 1];
		n && n.label === t ? n.timers.push(e) : k.push({
			label: t,
			timers: [e]
		});
	}
	let M = (e) => /* @__PURE__ */ R(Te, {
		t: e,
		now: o,
		canManage: !!i?.can_manage,
		onGoing: () => v.mutate(e),
		onEdit: () => c(e),
		onDelete: () => d(e)
	}, e.id);
	return /* @__PURE__ */ z(L, { children: [
		/* @__PURE__ */ R(p, {
			eyebrow: "Operations",
			title: "Timers",
			icon: /* @__PURE__ */ R(q, {}),
			description: "Structure and sovereignty timers with live countdowns. Say you're going and you'll be reminded before it comes out.",
			actions: i?.can_manage ? /* @__PURE__ */ z("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ z(t, {
					variant: "ghost",
					onClick: () => m(!0),
					children: [/* @__PURE__ */ R(fe, {}), " Settings"]
				}), /* @__PURE__ */ z(t, {
					variant: "primary",
					onClick: () => c("new"),
					children: [/* @__PURE__ */ R(J, {}), " Add timer"]
				})]
			}) : void 0
		}),
		a || !i ? /* @__PURE__ */ z("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ R("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					0,
					1,
					2,
					3
				].map((e) => /* @__PURE__ */ R(g, { className: "h-24" }, e))
			}), /* @__PURE__ */ R(g, { className: "h-64" })]
		}) : /* @__PURE__ */ z("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ z("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ R(_, {
						label: "Next timer",
						icon: /* @__PURE__ */ R(q, {}),
						tone: w ? new Date(w.ends_at).getTime() - o < 36e5 ? "danger" : "accent" : void 0,
						value: w ? /* @__PURE__ */ R(Q, {
							t: w,
							now: o,
							className: "text-2xl"
						}) : "—",
						hint: w ? `${w.name} · ${w.system.name}` : "Nothing on the board",
						mono: !1
					}),
					/* @__PURE__ */ R(_, {
						label: "Coming out today",
						icon: /* @__PURE__ */ R(ge, {}),
						value: D,
						hint: D ? "by EVE time" : "a quiet day"
					}),
					/* @__PURE__ */ R(_, {
						label: "Upcoming",
						icon: /* @__PURE__ */ R(pe, {}),
						value: S.length,
						hint: `${T} ours · ${E} hostile`
					}),
					/* @__PURE__ */ R(_, {
						label: "I'm going to",
						icon: /* @__PURE__ */ R(X, {}),
						value: O,
						tone: O ? "success" : void 0,
						hint: O ? "you'll be reminded" : "press Going on a timer"
					})
				]
			}), /* @__PURE__ */ z(b, {
				variant: "pills",
				defaultValue: "upcoming",
				className: "space-y-4",
				items: [{
					value: "upcoming",
					label: "Upcoming",
					count: S.length,
					icon: /* @__PURE__ */ R(me, {})
				}, {
					value: "past",
					label: "Came out",
					count: i.past.length
				}],
				children: [/* @__PURE__ */ R(y, {
					value: "upcoming",
					children: S.length === 0 ? /* @__PURE__ */ R(n, { children: /* @__PURE__ */ R(u, {
						icon: /* @__PURE__ */ R(q, {}),
						title: "No timers on the board",
						description: i.can_manage ? "Add one from the in-game timer. Reinforced corporation structures and timers in members' notifications are added by themselves." : "Nothing is coming out of reinforcement. Timers from your corporation's structures show up here on their own.",
						action: i.can_manage ? /* @__PURE__ */ z(t, {
							variant: "primary",
							onClick: () => c("new"),
							children: [/* @__PURE__ */ R(J, {}), " Add timer"]
						}) : void 0
					}) }) : /* @__PURE__ */ R("div", {
						className: "space-y-6",
						children: k.map((e) => /* @__PURE__ */ z("section", { children: [/* @__PURE__ */ z("h2", {
							className: "hud-label mb-2 flex items-center gap-3 text-text",
							children: [
								e.label,
								/* @__PURE__ */ R("span", {
									className: "h-px flex-1 bg-border",
									"aria-hidden": !0
								}),
								/* @__PURE__ */ z("span", {
									className: "text-xs font-normal normal-case tracking-normal text-subtle",
									children: [
										e.timers.length,
										" timer",
										e.timers.length === 1 ? "" : "s"
									]
								})
							]
						}), /* @__PURE__ */ R(n, {
							className: "overflow-hidden",
							children: /* @__PURE__ */ R("ul", {
								className: "divide-y divide-border",
								children: e.timers.map(M)
							})
						})] }, e.label))
					})
				}), /* @__PURE__ */ R(y, {
					value: "past",
					children: i.past.length === 0 ? /* @__PURE__ */ R(n, { children: /* @__PURE__ */ R(u, {
						icon: /* @__PURE__ */ R(q, {}),
						title: "Nothing came out recently",
						description: "Timers stay here for a while after they come out."
					}) }) : /* @__PURE__ */ R(n, {
						className: "overflow-hidden",
						children: /* @__PURE__ */ R("ul", {
							className: "divide-y divide-border opacity-80",
							children: i.past.map(M)
						})
					})
				})]
			})]
		}),
		s && /* @__PURE__ */ R(se, {
			timer: s === "new" ? null : s,
			onClose: () => c(null)
		}),
		f && /* @__PURE__ */ R(ve, { onClose: () => m(!1) }),
		/* @__PURE__ */ R(r, {
			open: !!l,
			onOpenChange: (e) => !e && d(null),
			danger: !0,
			title: `Remove "${l?.name}"?`,
			description: "It disappears from the board for everyone. People who said they're going aren't told.",
			confirmLabel: /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(Y, {}), " Remove"] }),
			onConfirm: () => l && x.mutateAsync(l.id)
		})
	] });
}
function Te({ t: e, now: n, canManage: r, onGoing: i, onEdit: u, onDelete: d }) {
	let f = W[e.side], p = new Date(e.ends_at).getTime() <= n, [m, h] = I(!1);
	return /* @__PURE__ */ z("li", {
		id: `t${e.id}`,
		className: "relative scroll-mt-24",
		children: [
			/* @__PURE__ */ R("span", {
				className: w("absolute inset-y-0 left-0 w-1", f.stripe),
				"aria-hidden": !0
			}),
			/* @__PURE__ */ z("div", {
				className: "grid gap-x-4 gap-y-2 px-card py-3 pl-5 sm:grid-cols-[150px_minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center",
				children: [
					/* @__PURE__ */ z("div", {
						className: "flex items-center justify-between gap-2 sm:block",
						children: [/* @__PURE__ */ R(Q, {
							t: e,
							now: n
						}), /* @__PURE__ */ R(S, {
							content: D(e.ends_at),
							children: /* @__PURE__ */ z("span", {
								className: "block text-xs text-subtle",
								children: [new Date(e.ends_at).toLocaleTimeString("en-GB", {
									hour: "2-digit",
									minute: "2-digit",
									timeZone: "UTC"
								}), " ET"]
							})
						})]
					}),
					/* @__PURE__ */ R("button", {
						type: "button",
						className: "min-w-0 text-left",
						onClick: () => h((e) => !e),
						"aria-expanded": m,
						children: /* @__PURE__ */ R(Ce, { t: e })
					}),
					/* @__PURE__ */ z("div", {
						className: "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1",
						children: [/* @__PURE__ */ R(Se, { t: e }), /* @__PURE__ */ z("span", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ R(be, { t: e }), /* @__PURE__ */ R(xe, { t: e })]
						})]
					}),
					/* @__PURE__ */ z("div", {
						className: "flex items-center justify-end gap-2",
						children: [
							/* @__PURE__ */ R(S, {
								content: e.going_names.length ? e.going_names.join(", ") : "Nobody has said they're going yet",
								children: /* @__PURE__ */ z("span", {
									className: "inline-flex items-center gap-1 text-xs text-muted",
									children: [
										/* @__PURE__ */ R(X, { className: "size-3.5" }),
										" ",
										e.going_count
									]
								})
							}),
							!p && /* @__PURE__ */ R(t, {
								variant: e.going ? "success" : "secondary",
								size: "xs",
								onClick: i,
								"aria-pressed": e.going,
								children: e.going ? /* @__PURE__ */ z(L, { children: [/* @__PURE__ */ R(de, {}), " Going"] }) : "Going?"
							}),
							r && /* @__PURE__ */ z(s, { children: [/* @__PURE__ */ R(l, {
								asChild: !0,
								children: /* @__PURE__ */ R(t, {
									variant: "ghost",
									size: "icon-xs",
									"aria-label": `Options for ${e.name}`,
									children: /* @__PURE__ */ R(ue, {})
								})
							}), /* @__PURE__ */ z(a, {
								align: "end",
								children: [
									/* @__PURE__ */ z(o, {
										onSelect: u,
										children: [/* @__PURE__ */ R(le, {}), " Edit"]
									}),
									/* @__PURE__ */ R(c, {}),
									/* @__PURE__ */ z(o, {
										danger: !0,
										onSelect: d,
										children: [/* @__PURE__ */ R(Y, {}), " Remove"]
									})
								]
							})] })
						]
					})
				]
			}),
			m && /* @__PURE__ */ z("div", {
				className: "border-t border-border bg-bg/40 px-card py-3 pl-5 text-sm",
				children: [
					/* @__PURE__ */ z($, {
						label: "Comes out",
						children: [
							D(e.ends_at),
							" ",
							!p && /* @__PURE__ */ z("span", {
								className: "text-subtle",
								children: [
									"(in ",
									ne(e.ends_at, n),
									")"
								]
							})
						]
					}),
					e.notes && /* @__PURE__ */ R($, {
						label: "Notes",
						children: /* @__PURE__ */ R("span", {
							className: "whitespace-pre-wrap",
							children: e.notes
						})
					}),
					e.going_names.length > 0 && /* @__PURE__ */ z($, {
						label: `Going (${e.going_count})`,
						children: [e.going_names.join(", "), e.going_count > e.going_names.length && " …"]
					}),
					/* @__PURE__ */ z($, {
						label: "From",
						children: [e.source === "structure" ? "the corporation's structures" : e.source === "notification" ? "an in-game notification" : e.created_by?.name ?? "someone", /* @__PURE__ */ z("span", {
							className: "text-subtle",
							children: [" · updated ", k(e.updated_at)]
						})]
					}),
					/* @__PURE__ */ z($, {
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
	return /* @__PURE__ */ z("div", {
		className: "flex gap-3 py-0.5",
		children: [/* @__PURE__ */ R("span", {
			className: "w-24 shrink-0 text-xs uppercase tracking-wider text-subtle",
			children: e
		}), /* @__PURE__ */ R("span", {
			className: "min-w-0 text-text",
			children: t
		})]
	});
}
//#endregion
//#region src/index.tsx
function Ee() {
	let { data: t, isLoading: n } = M({
		queryKey: ["timers", "widget"],
		queryFn: () => C.get(H),
		refetchInterval: 12e4
	}), r = Z();
	if (n) return /* @__PURE__ */ R(g, { className: "h-24" });
	if (!t) return null;
	let i = t.upcoming.filter((e) => new Date(e.ends_at).getTime() > r - 36e5).slice(0, 4);
	return i.length === 0 ? /* @__PURE__ */ R("p", {
		className: "text-sm text-subtle",
		children: "No timers on the board."
	}) : /* @__PURE__ */ z("ul", {
		className: "divide-y divide-border",
		children: [i.map((t) => /* @__PURE__ */ R("li", { children: /* @__PURE__ */ z(P, {
			to: `/p/timers#t${t.id}`,
			className: "flex items-center gap-3 py-2 hover:text-text",
			children: [
				/* @__PURE__ */ R("span", {
					className: w("h-8 w-0.5 shrink-0", W[t.side].stripe),
					"aria-hidden": !0
				}),
				/* @__PURE__ */ z("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ R("span", {
						className: "block truncate text-sm font-medium",
						children: t.name
					}), /* @__PURE__ */ z("span", {
						className: "block truncate text-xs text-subtle",
						children: [
							t.system.name,
							" · ",
							t.structure_type || "Structure",
							t.going && /* @__PURE__ */ z(L, { children: [" · ", /* @__PURE__ */ R(e, {
								tone: "success",
								size: "xs",
								children: "Going"
							})] })
						]
					})]
				}),
				/* @__PURE__ */ R(Q, {
					t,
					now: r,
					className: "text-xs"
				})
			]
		}) }, t.id)), t.upcoming.length > i.length && /* @__PURE__ */ R("li", {
			className: "pt-2 text-xs text-subtle",
			children: /* @__PURE__ */ z(P, {
				to: "/p/timers",
				className: "hover:text-text",
				children: [t.upcoming.length - i.length, " more on the board"]
			})
		})]
	});
}
var De = E({
	routes: [{
		path: "",
		Component: we
	}],
	widgets: [{
		id: "next",
		title: "Timers",
		Component: Ee,
		size: "md",
		order: 8
	}]
});
//#endregion
export { De as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","about","absolute","accent","action","actions","add","added","after","ago","align","alt","an","anchoring","and","animate-pulse","are","aren","aria-autocomplete","aria-expanded","aria-hidden","aria-invalid","aria-label","aria-pressed","aria-selected","armor","as","at","autoComplete","autoFocus","badge","be","been","before","bg-accent-soft","bg-bg","bg-bg/40","bg-border","bg-border-strong","bg-danger","bg-success","bg-surface","block","board","body","border","border-accent/60","border-border","border-t","box","browser","but","button","by","came","can","canManage","can_manage","center","characters","checked","children","className","clock","close","colour","coloured","come","comes","coming","component","confirmLabel","const","content","corporation","count","counting","counts","created_by","current","currentColor","customs","cx","cy","d","danger","data","datetime-local","day","days","debounced","default","defaultValue","del","deleting","description","diff","disabled","disappears","divide-border","divide-y","doesn","dot","drift","drop","editing","either","else","en-GB","enabled","end","endsAt","ends_at","entered","even","every","everyone","exact","expected","export","extraction","eyebrow","few","fill","five","flex","flex-1","flex-wrap","font-medium","font-mono","font-normal","font-semibold","footer","for","form","found","friendly","from","function","game","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-x-3","gap-x-4","gap-y-1","gap-y-2","get","ghost","going","going_count","going_names","grid","grouped","h","h-24","h-64","h-8","h-px","has","hear","here","hint","hits","hostile","hour","hover:bg-hover","hover:border-border-strong","hover:text-text","how","hud-label","hull","icon","icon-xs","icons","id","if","import","importNow","import_notifications","import_structures","important","in","in-game","info","inline","inline-flex","input","inset-y-0","interface","intervalMs","is","isLoading","iso","it","items","items-baseline","items-center","its","justify-between","justify-end","keep_days","key","kind","label","last","lastIndex","lazy","left","left-0","length","let","lg","lg:grid-cols-4","link","list","listbox","live","ll","loading","local","long","longer","looked","lost","m","m14.5","m16","m17","m21","m6.5","m8","m9.5","manual","marked","matched","max","max-h-60","maxLength","mb-1.5","mb-2","md","members","min","min-w-0","minute","minutes","ml-auto","mode","mono","month","moon","more","mousedown","mr-auto","ms","mt-1","mt-1.5","mutationFn","muted","myCount","n","name","neutral","new","next","no","none","normal-case","not","notes","notification","notifications","notifications_seen_until","notify","now","null","number","numeric","of","off","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onDelete","onDown","onEdit","onError","onFocus","onGoing","onKeyDown","onMouseDown","onOpenChange","onSelect","onSuccess","once","one","ones","opacity-80","open","option","options","or","order","other","ours","out","overflow-auto","overflow-hidden","own","owner","pad","past","patch","path","people","pick","pills","pl-5","place-items-center","placeholder","portrait","pos","post","press","primary","pt-2","put","px-2","px-3","px-card","py-0.5","py-1","py-2","py-3","qc","queryFn","queryKey","quiet","re","react","react-router","read","reading","ready","recently","ref","refetchInterval","refresh","region","relative","remind","reminded","reminder_minutes","reminders","removed","required","rest","results","return","right-0","role","rotate-45","round","routes","row","rows","run","s","said","save","saved","scroll","scroll-mt-24","sec","secondary","seconds","security","self-center","set","setDebounced","setDeleting","setEditing","setExact","setForm","setLeft","setMode","setNow","setOpen","setQ","setSettingsOpen","setTypedAt","settings","shadow-e2","sheet","shields","short","show","shown","shows","shrink-0","side","site","size","size-1.5","size-3.5","size-4","size-8","sm","sm:block","sm:grid-cols-2","sm:grid-cols-[150px_minmax(0,1.4fr)_minmax(0,1fr)_auto]","sm:grid-cols-[1fr_200px]","sm:items-center","so","solar","someone","source","sov","sovereignty","space-y-4","space-y-5","space-y-6","src","staleTime","status","stay","string","stripe","stroke","strokeLinecap","strokeLinejoin","strokeWidth","structure","structure_type","structures","style","success","such","system","systems","t","tabular-nums","target","text","text-2xl","text-[13px]","text-danger-fg","text-left","text-muted","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xs","than","that","the","their","there","they","time","timeLeftText","timeZone","timer","timers","timers-structure-types","title","to","toLocalInput","toast","today","toggle","told","tone","top-full","total","tracking-normal","tracking-wider","transition-colors","truncate","type","type_id","types","typing","u","unanchoring","undefined","unit","up","upcoming","updated","updated_at","uppercase","useNow","useQuery","useQueryClient","useRef","useState","used","using","v","value","variant","viewBox","void","w-0.5","w-1","w-24","w-28","w-full","warning","was","way","weekday","what","when","where","while","whitespace-pre-wrap","who","widget","widgets","will","with","written","x","xs","yet","you","your","z-20","zone"];
