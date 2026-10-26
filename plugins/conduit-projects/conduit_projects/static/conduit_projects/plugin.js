import { Avatar as e, Badge as t, Button as n, Card as r, CardBody as i, CardHeader as a, ConfirmDialog as o, Dialog as s, EmptyState as c, Field as l, Input as u, PageHeader as d, Progress as f, Segmented as p, Skeleton as m, Spinner as h, StatCard as g, THead as _, Table as v, Td as y, Textarea as b, Th as x, Tr as S, api as C, cn as ee, date as w, dateTime as te, definePlugin as T, duration as E, isk as D, num as O, timeAgo as ne, toast as k, useCurrentUser as re } from "@conduit/sdk";
import { useMutation as A, useQuery as j, useQueryClient as M } from "@tanstack/react-query";
import { useEffect as ie, useState as N } from "react";
import { Link as P, useNavigate as F, useParams as ae } from "react-router";
import { Fragment as I, jsx as L, jsxs as R } from "react/jsx-runtime";
//#region src/icons.tsx
function z({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ L("svg", {
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
var B = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" }),
		/* @__PURE__ */ L("path", { d: "M17 18h1" }),
		/* @__PURE__ */ L("path", { d: "M12 18h1" }),
		/* @__PURE__ */ L("path", { d: "M7 18h1" })
	]
}), oe = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" }),
		/* @__PURE__ */ L("path", { d: "M12 22V12" }),
		/* @__PURE__ */ L("path", { d: "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" }),
		/* @__PURE__ */ L("path", { d: "m7.5 4.27 9 5.15" })
	]
}), se = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" }),
		/* @__PURE__ */ L("path", { d: "m7 16.5-4.74-2.85" }),
		/* @__PURE__ */ L("path", { d: "m7 16.5 5-3" }),
		/* @__PURE__ */ L("path", { d: "M7 16.5v5.17" }),
		/* @__PURE__ */ L("path", { d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" }),
		/* @__PURE__ */ L("path", { d: "m17 16.5-5-3" }),
		/* @__PURE__ */ L("path", { d: "m17 16.5 4.74-2.85" }),
		/* @__PURE__ */ L("path", { d: "M17 16.5v5.17" }),
		/* @__PURE__ */ L("path", { d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" }),
		/* @__PURE__ */ L("path", { d: "M12 8 7.26 5.15" }),
		/* @__PURE__ */ L("path", { d: "m12 8 4.74-2.85" }),
		/* @__PURE__ */ L("path", { d: "M12 13.5V8" })
	]
}), V = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M5 12h14" }), /* @__PURE__ */ L("path", { d: "M12 5v14" })]
}), H = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "M20 6 9 17l-5-5" })
}), ce = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M18 6 6 18" }), /* @__PURE__ */ L("path", { d: "m6 6 12 12" })]
}), U = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }), /* @__PURE__ */ L("path", { d: "m15 5 4 4" })]
}), le = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ L("path", { d: "M19 12H5" })]
}), ue = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M18 11V6a2 2 0 0 0-4 0v5" }),
		/* @__PURE__ */ L("path", { d: "M14 10V4a2 2 0 0 0-4 0v6" }),
		/* @__PURE__ */ L("path", { d: "M10 10.5V6a2 2 0 0 0-4 0v8" }),
		/* @__PURE__ */ L("path", { d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" })
	]
}), de = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }),
		/* @__PURE__ */ L("path", { d: "M15 18H9" }),
		/* @__PURE__ */ L("path", { d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" }),
		/* @__PURE__ */ L("circle", {
			cx: "17",
			cy: "18",
			r: "2"
		}),
		/* @__PURE__ */ L("circle", {
			cx: "7",
			cy: "18",
			r: "2"
		})
	]
}), fe = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("rect", {
		width: "8",
		height: "4",
		x: "8",
		y: "2",
		rx: "1",
		ry: "1"
	}), /* @__PURE__ */ L("path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" })]
}), pe = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("circle", {
		cx: "11",
		cy: "11",
		r: "8"
	}), /* @__PURE__ */ L("path", { d: "m21 21-4.3-4.3" })]
}), W = "/api/p/projects";
//#endregion
//#region src/editor.tsx
function G() {
	let e = M();
	return () => e.invalidateQueries({ queryKey: ["projects"] });
}
function K(e) {
	k.error(e.message);
}
function me(e) {
	return e ? e.slice(0, 16) : "";
}
function he(e) {
	return e ? `${e}:00Z` : null;
}
function q({ project: e, onClose: t, onSaved: r }) {
	let i = G(), { data: a } = j({
		queryKey: ["projects", "options"],
		queryFn: () => C.get(`${W}/options`),
		staleTime: 6e5
	}), [o, c] = N({
		name: e?.name ?? "",
		description: e?.description ?? "",
		location: e?.location ?? "",
		deadline: me(e?.deadline ?? null),
		states: e?.states.map((e) => e.id) ?? [],
		groups: e?.groups.map((e) => e.id) ?? []
	}), d = (e) => c((t) => ({
		...t,
		...e
	})), f = (e, t) => d({ [e]: o[e].includes(t) ? o[e].filter((e) => e !== t) : [...o[e], t] }), p = A({
		mutationFn: () => {
			let t = {
				...o,
				deadline: he(o.deadline),
				notify: !0
			};
			return e ? C.put(`${W}/projects/${e.id}`, t) : C.post(`${W}/projects`, t);
		},
		onSuccess: (n) => {
			k.success(e ? "Project saved" : "Project started. Now add what it needs."), i(), r?.(n), t();
		},
		onError: K
	});
	return /* @__PURE__ */ L(s, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: e ? "Edit project" : "New project",
		description: e ? void 0 : "Its audience is told about it. Add the items it needs on the next page.",
		footer: /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(n, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), /* @__PURE__ */ L(n, {
			variant: "primary",
			loading: p.isPending,
			disabled: !o.name.trim(),
			onClick: () => p.mutate(),
			children: e ? "Save" : "Start project"
		})] }),
		children: /* @__PURE__ */ R("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ L(l, {
					label: "Name",
					required: !0,
					children: /* @__PURE__ */ L(u, {
						value: o.name,
						maxLength: 120,
						onChange: (e) => d({ name: e.target.value }),
						placeholder: "20 Hurricanes for the deployment"
					})
				}),
				/* @__PURE__ */ R("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ L(l, {
						label: "Deliver to",
						hint: "Where members drop what they built.",
						children: /* @__PURE__ */ L(u, {
							value: o.location,
							maxLength: 200,
							onChange: (e) => d({ location: e.target.value }),
							placeholder: "Corp hangar, staging Keepstar"
						})
					}), /* @__PURE__ */ L(l, {
						label: "Deadline (EVE time)",
						hint: "Optional.",
						children: /* @__PURE__ */ L(u, {
							type: "datetime-local",
							value: o.deadline,
							onChange: (e) => d({ deadline: e.target.value })
						})
					})]
				}),
				/* @__PURE__ */ L(l, {
					label: "Details",
					children: /* @__PURE__ */ L(b, {
						rows: 3,
						value: o.description,
						maxLength: 1e4,
						onChange: (e) => d({ description: e.target.value }),
						placeholder: "Fit them to the doctrine and contract them to the corp."
					})
				}),
				a && (a.states.length > 0 || a.groups.length > 0) && /* @__PURE__ */ R("div", { children: [
					/* @__PURE__ */ L("div", {
						className: "mb-1.5 text-[13px] font-medium",
						children: "Who it's for"
					}),
					/* @__PURE__ */ L("p", {
						className: "mb-2 text-xs text-muted",
						children: "Nothing picked: every member. Otherwise only people in one of these states or groups see it and are told."
					}),
					/* @__PURE__ */ R("div", {
						className: "flex flex-wrap gap-1.5",
						children: [a.states.map((e) => /* @__PURE__ */ R(J, {
							on: o.states.includes(e.id),
							onClick: () => f("states", e.id),
							children: [/* @__PURE__ */ L("span", {
								className: "size-2 rounded-full",
								style: { background: e.color }
							}), e.name]
						}, `s${e.id}`)), a.groups.map((e) => /* @__PURE__ */ L(J, {
							on: o.groups.includes(e.id),
							onClick: () => f("groups", e.id),
							children: e.name
						}, `g${e.id}`))]
					})
				] })
			]
		})
	});
}
function J({ on: e, onClick: t, children: n }) {
	return /* @__PURE__ */ L("button", {
		type: "button",
		"aria-pressed": e,
		onClick: t,
		className: ee("flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors", e ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text"),
		children: n
	});
}
function ge({ project: e, onClose: t }) {
	let r = G(), [i, a] = N("one"), [o, c] = N(""), [d, f] = N(""), [m, g] = N(null), [_, v] = N("1"), [y, x] = N(""), [S, ee] = N("0"), [w, te] = N("0");
	ie(() => {
		let e = setTimeout(() => f(o.trim()), 250);
		return () => clearTimeout(e);
	}, [o]);
	let T = j({
		queryKey: [
			"projects",
			"types",
			d
		],
		queryFn: () => C.get(`${W}/types?q=${encodeURIComponent(d)}`),
		enabled: i === "one" && !m && d.length >= 2
	}), E = A({
		mutationFn: async () => {
			let t = {
				points_per_unit: Number(S) || 0,
				isk_per_unit: Number(w) || 0
			};
			return i === "paste" ? C.post(`${W}/projects/${e.id}/items/paste`, {
				text: y,
				...t
			}) : (await C.post(`${W}/projects/${e.id}/items`, {
				type_id: m.id,
				quantity: Number(_),
				...t
			}), {
				added: 1,
				unknown: []
			});
		},
		onSuccess: (e) => {
			e.unknown.length ? k.warning(`Added ${e.added}. Not recognised: ${e.unknown.slice(0, 5).join(", ")}${e.unknown.length > 5 ? "…" : ""}`) : k.success("Added"), r(), t();
		},
		onError: K
	}), D = i === "one" ? !!m && Number(_) >= 1 : !!y.trim();
	return /* @__PURE__ */ L(s, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: "Add what it needs",
		size: "lg",
		footer: /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(n, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), /* @__PURE__ */ L(n, {
			variant: "primary",
			loading: E.isPending,
			disabled: !D,
			onClick: () => E.mutate(),
			children: "Add"
		})] }),
		children: /* @__PURE__ */ R("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ L(p, {
					value: i,
					onChange: a,
					"aria-label": "How to add",
					options: [{
						value: "one",
						label: "One item",
						icon: /* @__PURE__ */ L(pe, {})
					}, {
						value: "paste",
						label: "Paste a list",
						icon: /* @__PURE__ */ L(fe, {})
					}]
				}),
				i === "one" ? /* @__PURE__ */ R("div", {
					className: "grid gap-4 sm:grid-cols-[1fr_140px]",
					children: [/* @__PURE__ */ L(l, {
						label: "Item",
						children: m ? /* @__PURE__ */ R("div", {
							className: "flex items-center gap-2 border border-border px-2 py-1.5 text-sm",
							children: [
								/* @__PURE__ */ L("img", {
									src: m.icon,
									alt: "",
									className: "size-6"
								}),
								/* @__PURE__ */ L("span", {
									className: "flex-1",
									children: m.name
								}),
								/* @__PURE__ */ L(n, {
									size: "xs",
									variant: "ghost",
									onClick: () => g(null),
									children: "Change"
								})
							]
						}) : /* @__PURE__ */ R("div", {
							className: "relative",
							children: [/* @__PURE__ */ L(u, {
								value: o,
								onChange: (e) => c(e.target.value),
								placeholder: "Hurricane",
								autoComplete: "off",
								autoFocus: !0
							}), d.length >= 2 && /* @__PURE__ */ L("div", {
								className: "absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto border border-border-strong bg-surface-raised p-1 shadow-e3",
								children: T.isLoading ? /* @__PURE__ */ L(h, { className: "px-2 py-1.5" }) : T.data?.length ? T.data.map((e) => /* @__PURE__ */ R("button", {
									type: "button",
									onClick: () => g(e),
									className: "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-hover",
									children: [/* @__PURE__ */ L("img", {
										src: e.icon,
										alt: "",
										className: "size-5"
									}), e.name]
								}, e.id)) : /* @__PURE__ */ L("div", {
									className: "px-2 py-1.5 text-xs text-subtle",
									children: "No item by that name."
								})
							})]
						})
					}), /* @__PURE__ */ L(l, {
						label: "How many",
						children: /* @__PURE__ */ L(u, {
							type: "number",
							min: 1,
							value: _,
							onChange: (e) => v(e.target.value)
						})
					})]
				}) : /* @__PURE__ */ L(l, {
					label: "Items",
					hint: "Paste the materials list from the in-game Industry window (the copy button under the inputs), an inventory, or lines like “Tritanium x 1000”. The same item twice adds up. Blueprints aren't in the static data, so work out the parts in game (with the ME you use) and paste them here.",
					children: /* @__PURE__ */ L(b, {
						rows: 8,
						value: y,
						onChange: (e) => x(e.target.value),
						className: "font-mono text-xs",
						placeholder: "Tritanium	1000000\nPyerite	250000"
					})
				}),
				/* @__PURE__ */ R("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ L(l, {
						label: "Points per unit",
						hint: e.store_enabled ? "Corp Store points for each unit delivered." : "Paid by the Corp Store plugin, which isn't switched on.",
						children: /* @__PURE__ */ L(u, {
							type: "number",
							min: 0,
							value: S,
							onChange: (e) => ee(e.target.value)
						})
					}), /* @__PURE__ */ L(l, {
						label: "ISK per unit",
						hint: "Only shown; paying it is up to you.",
						children: /* @__PURE__ */ L(u, {
							type: "number",
							min: 0,
							value: w,
							onChange: (e) => te(e.target.value)
						})
					})]
				})
			]
		})
	});
}
function _e({ item: e, project: t, onClose: r }) {
	let i = G(), [a, o] = N(String(e.quantity)), [c, d] = N(String(e.points_per_unit)), [f, p] = N(String(e.isk_per_unit)), m = A({
		mutationFn: () => C.put(`${W}/items/${e.id}`, {
			quantity: Number(a),
			points_per_unit: Number(c) || 0,
			isk_per_unit: Number(f) || 0
		}),
		onSuccess: () => {
			i(), r();
		},
		onError: K
	}), h = A({
		mutationFn: () => C.delete(`${W}/items/${e.id}`),
		onSuccess: () => {
			k.success(`${e.name} removed`), i(), r();
		},
		onError: K
	}), g = e.confirmed + e.claimed;
	return /* @__PURE__ */ L(s, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: e.name,
		footer: /* @__PURE__ */ R(I, { children: [
			/* @__PURE__ */ L(n, {
				variant: "danger",
				className: "mr-auto",
				loading: h.isPending,
				disabled: g > 0,
				onClick: () => h.mutate(),
				children: "Remove"
			}),
			/* @__PURE__ */ L(n, {
				variant: "ghost",
				onClick: r,
				children: "Cancel"
			}),
			/* @__PURE__ */ L(n, {
				variant: "primary",
				loading: m.isPending,
				disabled: Number(a) < Math.max(1, g),
				onClick: () => m.mutate(),
				children: "Save"
			})
		] }),
		children: /* @__PURE__ */ R("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ L(l, {
					label: "How many",
					hint: g ? `At least ${g.toLocaleString("en")}: claimed or delivered.` : void 0,
					children: /* @__PURE__ */ L(u, {
						type: "number",
						min: Math.max(1, g),
						value: a,
						onChange: (e) => o(e.target.value)
					})
				}),
				/* @__PURE__ */ L(l, {
					label: "Points per unit",
					hint: t.store_enabled ? void 0 : "Corp Store isn't on.",
					children: /* @__PURE__ */ L(u, {
						type: "number",
						min: 0,
						value: c,
						onChange: (e) => d(e.target.value)
					})
				}),
				/* @__PURE__ */ L(l, {
					label: "ISK per unit",
					children: /* @__PURE__ */ L(u, {
						type: "number",
						min: 0,
						value: f,
						onChange: (e) => p(e.target.value)
					})
				})
			]
		})
	});
}
function ve({ item: e, current: t, onClose: r }) {
	let i = G(), a = e.free + t, [o, c] = N(String(t || a)), d = Number(o), f = A({
		mutationFn: () => C.post(`${W}/items/${e.id}/claim`, { quantity: d }),
		onSuccess: () => {
			k.success(t ? "Claim changed" : `You're building ${d.toLocaleString("en")} × ${e.name}`), i(), r();
		},
		onError: K
	});
	return /* @__PURE__ */ R(s, {
		open: !0,
		onOpenChange: (e) => !e && r(),
		title: t ? `Change your claim: ${e.name}` : `Build ${e.name}`,
		description: `${a.toLocaleString("en")} free to claim. Mark it delivered once it's where the project says.`,
		footer: /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(n, {
			variant: "ghost",
			onClick: r,
			children: "Cancel"
		}), /* @__PURE__ */ L(n, {
			variant: "primary",
			loading: f.isPending,
			disabled: !(d >= 1 && d <= a),
			onClick: () => f.mutate(),
			children: t ? "Change claim" : "Claim"
		})] }),
		children: [/* @__PURE__ */ L(l, {
			label: "How many",
			children: /* @__PURE__ */ R("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ L(u, {
					type: "number",
					min: 1,
					max: a,
					value: o,
					onChange: (e) => c(e.target.value),
					autoFocus: !0
				}), /* @__PURE__ */ R(n, {
					variant: "secondary",
					onClick: () => c(String(a)),
					children: ["All ", a.toLocaleString("en")]
				})]
			})
		}), e.points_per_unit > 0 && d > 0 && /* @__PURE__ */ R("p", {
			className: "mt-3 text-sm text-muted",
			children: [
				"Earns ",
				(d * e.points_per_unit).toLocaleString("en"),
				" points once a manager confirms the delivery."
			]
		})]
	});
}
function Y({ title: e, description: t, label: r, placeholder: i, confirmLabel: a, onSubmit: o, onClose: c }) {
	let d = G(), [f, p] = N(""), m = A({
		mutationFn: () => o(f),
		onSuccess: () => {
			d(), c();
		},
		onError: K
	});
	return /* @__PURE__ */ L(s, {
		open: !0,
		onOpenChange: (e) => !e && c(),
		title: e,
		description: t,
		footer: /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(n, {
			variant: "ghost",
			onClick: c,
			children: "Cancel"
		}), /* @__PURE__ */ L(n, {
			variant: "primary",
			loading: m.isPending,
			onClick: () => m.mutate(),
			children: a
		})] }),
		children: /* @__PURE__ */ L(l, {
			label: r,
			children: /* @__PURE__ */ L(u, {
				value: f,
				maxLength: 500,
				onChange: (e) => p(e.target.value),
				placeholder: i,
				autoFocus: !0
			})
		})
	});
}
//#endregion
//#region src/shared.tsx
function ye({ to: e, children: t }) {
	return /* @__PURE__ */ R(P, {
		to: e,
		className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text",
		children: [
			/* @__PURE__ */ L(le, {}),
			" ",
			t
		]
	});
}
var X = {
	open: {
		label: "Open",
		tone: "accent"
	},
	done: {
		label: "Done",
		tone: "success"
	},
	cancelled: {
		label: "Cancelled",
		tone: "neutral"
	}
};
function be({ status: e }) {
	return /* @__PURE__ */ L(t, {
		tone: X[e].tone,
		children: X[e].label
	});
}
var xe = {
	claimed: {
		label: "Building",
		tone: "info"
	},
	delivered: {
		label: "Delivered",
		tone: "warning"
	},
	confirmed: {
		label: "Confirmed",
		tone: "success"
	}
};
function Z({ status: e }) {
	return /* @__PURE__ */ L(t, {
		tone: xe[e].tone,
		children: xe[e].label
	});
}
function Q({ progress: e }) {
	let t = Math.round(e.done * 100), n = Math.round(e.claimed * 100);
	return /* @__PURE__ */ R("div", { children: [/* @__PURE__ */ R("div", {
		className: "mb-1.5 flex items-baseline justify-between gap-3 text-xs",
		children: [/* @__PURE__ */ R("span", {
			className: "text-muted",
			children: [
				e.items_done,
				" of ",
				e.items,
				" item",
				e.items === 1 ? "" : "s",
				" done"
			]
		}), /* @__PURE__ */ R("span", {
			className: "font-mono tabular-nums",
			children: [
				t,
				"% ",
				/* @__PURE__ */ R("span", {
					className: "text-subtle",
					children: [
						"· ",
						n,
						"% claimed"
					]
				})
			]
		})]
	}), /* @__PURE__ */ L(f, {
		value: t,
		tone: "success",
		size: "sm"
	})] });
}
function $({ hint: e }) {
	if (!e) return null;
	let t = [];
	return e.runs_in_production && t.push(`${O(e.runs_in_production)} run${e.runs_in_production === 1 ? "" : "s"} in production${e.ends_at ? `, ends in ${E(e.ends_at)}` : ""}`), e.runs_ready && t.push(`${O(e.runs_ready)} ready to deliver`), e.runs_delivered && t.push(`${O(e.runs_delivered)} delivered from the job`), t.length || t.push(`${e.jobs} job${e.jobs === 1 ? "" : "s"} started`), /* @__PURE__ */ L("span", {
		className: "text-xs text-info-fg",
		title: "From industry jobs making this item since the claim. Only a hint: a manager still confirms the delivery.",
		children: t.join(" · ")
	});
}
function Se({ src: e, name: t }) {
	return /* @__PURE__ */ L("img", {
		src: e,
		alt: "",
		title: t,
		className: "size-6 shrink-0 bg-surface-2",
		loading: "lazy"
	});
}
//#endregion
//#region src/list.tsx
function Ce() {
	let e = F(), [i, a] = N("open"), [o, s] = N(!1), { data: l, isLoading: u } = j({
		queryKey: [
			"projects",
			"list",
			i
		],
		queryFn: () => C.get(`${W}/projects?show=${i}`)
	});
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(d, {
			eyebrow: "Industry",
			title: "Projects",
			icon: /* @__PURE__ */ L(B, {}),
			description: "What the corporation is building. Claim a part, build it, deliver it and mark it delivered.",
			actions: l?.can_manage ? /* @__PURE__ */ R(n, {
				variant: "primary",
				onClick: () => s(!0),
				children: [/* @__PURE__ */ L(V, {}), " New project"]
			}) : void 0
		}),
		/* @__PURE__ */ L(p, {
			className: "mb-4",
			value: i,
			onChange: a,
			"aria-label": "Which projects",
			options: [{
				value: "open",
				label: "Open"
			}, {
				value: "closed",
				label: "Finished"
			}]
		}),
		u || !l ? /* @__PURE__ */ L(m, { className: "h-48" }) : l.projects.length === 0 ? /* @__PURE__ */ L(r, { children: /* @__PURE__ */ L(c, {
			icon: /* @__PURE__ */ L(B, {}),
			title: i === "open" ? "Nothing to build right now" : "No finished projects yet",
			description: i === "open" ? l.can_manage ? "Start a project and add what it needs." : "New projects show up here." : void 0
		}) }) : /* @__PURE__ */ L("div", {
			className: "grid gap-4 lg:grid-cols-2",
			children: l.projects.map((e) => /* @__PURE__ */ L(r, {
				interactive: !0,
				children: /* @__PURE__ */ R(P, {
					to: `/p/projects/${e.id}`,
					className: "block space-y-3 p-card",
					children: [
						/* @__PURE__ */ R("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ R("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ L("div", {
									className: "truncate font-medium",
									children: e.name
								}), /* @__PURE__ */ L("div", {
									className: "truncate text-xs text-muted",
									children: [e.location, e.deadline ? `due ${w(e.deadline)}` : null].filter(Boolean).join(" · ") || "No deadline"
								})]
							}), /* @__PURE__ */ R("div", {
								className: "flex shrink-0 items-center gap-1.5",
								children: [e.my_open_claims && /* @__PURE__ */ L(t, {
									tone: "info",
									children: "You're building"
								}), /* @__PURE__ */ L(be, { status: e.status })]
							})]
						}),
						e.description && /* @__PURE__ */ L("p", {
							className: "line-clamp-2 text-sm text-muted",
							children: e.description
						}),
						/* @__PURE__ */ L(Q, { progress: e.progress })
					]
				})
			}, e.id))
		}),
		o && /* @__PURE__ */ L(q, {
			project: null,
			onClose: () => s(!1),
			onSaved: (t) => e(`/p/projects/${t.id}`)
		})
	] });
}
function we() {
	let { data: e, isLoading: t } = j({
		queryKey: [
			"projects",
			"list",
			"open"
		],
		queryFn: () => C.get(`${W}/projects?show=open`),
		refetchInterval: 3e5
	});
	return t || !e ? /* @__PURE__ */ L(m, { className: "h-24" }) : e.projects.length === 0 ? /* @__PURE__ */ L("p", {
		className: "text-sm text-muted",
		children: "Nothing to build right now."
	}) : /* @__PURE__ */ R("ul", {
		className: "space-y-3",
		children: [e.projects.slice(0, 4).map((e) => /* @__PURE__ */ L("li", { children: /* @__PURE__ */ R(P, {
			to: `/p/projects/${e.id}`,
			className: "block hover:text-accent-ink",
			children: [/* @__PURE__ */ L("div", {
				className: "mb-1 truncate text-sm font-medium",
				children: e.name
			}), /* @__PURE__ */ L(Q, { progress: e.progress })]
		}) }, e.id)), e.projects.length > 4 && /* @__PURE__ */ L("li", {
			className: "text-xs text-muted",
			children: /* @__PURE__ */ R(P, {
				to: "/p/projects",
				className: "hover:text-text",
				children: [
					"and ",
					e.projects.length - 4,
					" more"
				]
			})
		})]
	});
}
//#endregion
//#region src/me.tsx
function Te() {
	let { data: e, isLoading: t } = j({
		queryKey: ["projects", "me"],
		queryFn: () => C.get(`${W}/me`)
	});
	return /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(d, {
		eyebrow: "Industry",
		title: "My contributions",
		icon: /* @__PURE__ */ L(oe, {}),
		description: "What you claimed and delivered. Open a project to mark something delivered."
	}), t || !e ? /* @__PURE__ */ L(m, { className: "h-64" }) : /* @__PURE__ */ R("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ R("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ L(g, {
					label: "Being built",
					value: e.totals.open,
					hint: "claimed or waiting for a manager"
				}),
				/* @__PURE__ */ L(g, {
					label: "Delivered",
					value: e.totals.confirmed,
					tone: "success",
					hint: "confirmed deliveries"
				}),
				/* @__PURE__ */ L(g, {
					label: "Projects helped",
					value: e.totals.projects
				}),
				/* @__PURE__ */ L(g, {
					label: "Points earned",
					value: e.totals.points,
					hint: "paid by the Corp Store"
				})
			]
		}), /* @__PURE__ */ L(r, { children: e.contributions.length === 0 ? /* @__PURE__ */ L(c, {
			icon: /* @__PURE__ */ L(oe, {}),
			title: "Nothing yet",
			description: /* @__PURE__ */ R(I, { children: [
				"Claim something on the ",
				/* @__PURE__ */ L(P, {
					to: "/p/projects",
					className: "text-accent-ink hover:underline",
					children: "projects board"
				}),
				"."
			] })
		}) : /* @__PURE__ */ R(v, { children: [/* @__PURE__ */ L(_, { children: /* @__PURE__ */ R("tr", { children: [
			/* @__PURE__ */ L(x, { children: "Item" }),
			/* @__PURE__ */ L(x, { children: "Project" }),
			/* @__PURE__ */ L(x, {
				align: "right",
				children: "Quantity"
			}),
			/* @__PURE__ */ L(x, { children: "Status" }),
			/* @__PURE__ */ L(x, {
				align: "right",
				children: "Points"
			}),
			/* @__PURE__ */ L(x, {
				align: "right",
				children: "Claimed"
			})
		] }) }), /* @__PURE__ */ L("tbody", { children: e.contributions.map((e) => /* @__PURE__ */ R(S, { children: [
			/* @__PURE__ */ R(y, { children: [
				/* @__PURE__ */ L("div", {
					className: "font-medium",
					children: e.item
				}),
				/* @__PURE__ */ L($, { hint: e.industry }),
				e.review_note && e.status === "claimed" && /* @__PURE__ */ R("div", {
					className: "text-xs text-warning-fg",
					children: ["Sent back: ", e.review_note]
				})
			] }),
			/* @__PURE__ */ L(y, { children: /* @__PURE__ */ L(P, {
				to: `/p/projects/${e.project.id}`,
				className: "hover:text-accent-ink",
				children: e.project.name
			}) }),
			/* @__PURE__ */ L(y, {
				align: "right",
				className: "font-mono",
				children: O(e.quantity)
			}),
			/* @__PURE__ */ L(y, { children: /* @__PURE__ */ L(Z, { status: e.status }) }),
			/* @__PURE__ */ L(y, {
				align: "right",
				className: "font-mono",
				children: e.points ? O(e.points) : "—"
			}),
			/* @__PURE__ */ L(y, {
				align: "right",
				className: "text-xs text-muted",
				children: ne(e.created_at)
			})
		] }, e.id)) })] }) })]
	})] });
}
//#endregion
//#region src/project.tsx
function Ee() {
	let { id: s } = ae(), l = F(), u = M(), f = re(), [p, h] = N(null), { data: g, isLoading: _, error: v } = j({
		queryKey: [
			"projects",
			"project",
			s
		],
		queryFn: () => C.get(`${W}/projects/${s}`)
	}), y = () => u.invalidateQueries({ queryKey: ["projects"] }), b = (e, t) => e.then(() => {
		t && k.success(t), y();
	}).catch((e) => k.error(e.message));
	if (v) return /* @__PURE__ */ L(r, { children: /* @__PURE__ */ L(c, {
		icon: /* @__PURE__ */ L(B, {}),
		title: "No such project",
		description: "It may be for other states or groups, or it was deleted."
	}) });
	if (_ || !g) return /* @__PURE__ */ L(m, { className: "h-64" });
	let x = g.status === "open", S = () => h(null);
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(ye, {
			to: "/p/projects",
			children: "Projects"
		}),
		/* @__PURE__ */ L(d, {
			eyebrow: "Industry project",
			title: g.name,
			icon: /* @__PURE__ */ L(B, {}),
			description: g.description || void 0,
			actions: g.can_manage ? /* @__PURE__ */ R("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ R(n, {
					variant: "ghost",
					onClick: () => h({ kind: "edit" }),
					children: [/* @__PURE__ */ L(U, {}), " Edit"]
				}), x ? /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ R(n, {
					variant: "secondary",
					onClick: () => h({
						kind: "close",
						status: "done"
					}),
					children: [/* @__PURE__ */ L(H, {}), " Close as done"]
				}), /* @__PURE__ */ R(n, {
					variant: "ghost",
					onClick: () => h({
						kind: "close",
						status: "cancelled"
					}),
					children: [/* @__PURE__ */ L(ce, {}), " Cancel"]
				})] }) : /* @__PURE__ */ L(n, {
					variant: "secondary",
					onClick: () => b(C.post(`${W}/projects/${g.id}/reopen`), "Reopened"),
					children: "Reopen"
				})]
			}) : void 0
		}),
		/* @__PURE__ */ R("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_340px]",
			children: [/* @__PURE__ */ R("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ L(r, { children: /* @__PURE__ */ R(i, {
					className: "space-y-4",
					children: [/* @__PURE__ */ R("div", {
						className: "flex flex-wrap items-center gap-x-6 gap-y-2 text-sm",
						children: [
							/* @__PURE__ */ L(be, { status: g.status }),
							g.location && /* @__PURE__ */ R("span", { children: [/* @__PURE__ */ L("span", {
								className: "text-muted",
								children: "Deliver to "
							}), g.location] }),
							g.deadline && /* @__PURE__ */ R("span", { children: [/* @__PURE__ */ L("span", {
								className: "text-muted",
								children: "Due "
							}), te(g.deadline)] }),
							(g.states.length > 0 || g.groups.length > 0) && /* @__PURE__ */ R("span", {
								className: "flex flex-wrap items-center gap-1",
								children: [
									/* @__PURE__ */ L("span", {
										className: "text-muted",
										children: "For"
									}),
									g.states.map((e) => /* @__PURE__ */ L(t, {
										size: "xs",
										color: e.color,
										children: e.name
									}, `s${e.id}`)),
									g.groups.map((e) => /* @__PURE__ */ L(t, {
										size: "xs",
										tone: "neutral",
										children: e.name
									}, `g${e.id}`))
								]
							})
						]
					}), /* @__PURE__ */ L(Q, { progress: g.progress })]
				}) }), /* @__PURE__ */ R(r, { children: [/* @__PURE__ */ L(a, {
					title: "What it needs",
					description: "Claim what you'll build. When it's delivered, mark it; a manager confirms it.",
					actions: g.can_manage && x ? /* @__PURE__ */ R(n, {
						size: "sm",
						variant: "primary",
						onClick: () => h({ kind: "add" }),
						children: [/* @__PURE__ */ L(V, {}), " Add items"]
					}) : void 0
				}), g.items.length === 0 ? /* @__PURE__ */ L(c, {
					icon: /* @__PURE__ */ L(B, {}),
					title: "Nothing added yet",
					description: g.can_manage ? "Add the items, one by one or as a pasted list." : void 0
				}) : /* @__PURE__ */ L("ul", {
					className: "divide-y divide-border",
					children: g.items.map((e) => {
						let t = e.contributions.find((e) => e.user.id === f?.id && e.status !== "confirmed"), r = Math.min(100, Math.round(e.confirmed / e.quantity * 100));
						return /* @__PURE__ */ R("li", {
							className: "space-y-3 px-card py-4",
							children: [
								/* @__PURE__ */ R("div", {
									className: "flex flex-wrap items-center gap-3",
									children: [
										/* @__PURE__ */ L(Se, {
											src: e.icon,
											name: e.name
										}),
										/* @__PURE__ */ R("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ L("div", {
												className: "font-medium",
												children: e.name
											}), /* @__PURE__ */ R("div", {
												className: "text-xs text-muted",
												children: [
													O(e.confirmed),
													" of ",
													O(e.quantity),
													" delivered · ",
													O(e.claimed),
													" being built · ",
													O(e.free),
													" free",
													e.points_per_unit > 0 && /* @__PURE__ */ R(I, { children: [
														" · ",
														O(e.points_per_unit),
														" pts/unit"
													] }),
													e.isk_per_unit > 0 && /* @__PURE__ */ R(I, { children: [
														" · ",
														D(e.isk_per_unit),
														"/unit"
													] })
												]
											})]
										}),
										/* @__PURE__ */ R("div", {
											className: "flex items-center gap-2",
											children: [x && !t && e.free > 0 && /* @__PURE__ */ R(n, {
												size: "sm",
												variant: "primary",
												onClick: () => h({
													kind: "claim",
													item: e,
													current: 0
												}),
												children: [/* @__PURE__ */ L(ue, {}), " Claim"]
											}), g.can_manage && x && /* @__PURE__ */ L(n, {
												size: "icon-sm",
												variant: "ghost",
												"aria-label": `Edit ${e.name}`,
												onClick: () => h({
													kind: "item",
													item: e
												}),
												children: /* @__PURE__ */ L(U, {})
											})]
										})
									]
								}),
								/* @__PURE__ */ L("div", {
									className: "h-1.5 bg-surface-3",
									"aria-hidden": !0,
									children: /* @__PURE__ */ L("div", {
										className: "h-full bg-success",
										style: { width: `${r}%` }
									})
								}),
								e.contributions.length > 0 && /* @__PURE__ */ L("ul", {
									className: "space-y-1.5",
									children: e.contributions.map((t) => /* @__PURE__ */ L(De, {
										c: t,
										mine: t.user.id === f?.id,
										manager: g.can_manage,
										open: x,
										onChange: () => h({
											kind: "claim",
											item: e,
											current: t.quantity
										}),
										onRelease: () => b(C.post(`/api/p/projects/contributions/${t.id}/release`), "Claim released"),
										onDeliver: () => h({
											kind: "deliver",
											c: t,
											item: e
										}),
										onConfirm: () => b(C.post(`/api/p/projects/contributions/${t.id}/confirm`), "Delivery confirmed"),
										onReject: () => h({
											kind: "reject",
											c: t,
											item: e
										})
									}, t.id))
								})
							]
						}, e.id);
					})
				})] })]
			}), /* @__PURE__ */ R("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ R(r, { children: [/* @__PURE__ */ L(a, { title: "Contributors" }), g.contributors.length === 0 ? /* @__PURE__ */ L(i, { children: /* @__PURE__ */ L("p", {
						className: "text-sm text-muted",
						children: "Nobody yet. Be the first to claim something."
					}) }) : /* @__PURE__ */ L("ul", {
						className: "divide-y divide-border",
						children: g.contributors.map((t) => /* @__PURE__ */ R("li", {
							className: "flex items-center gap-3 px-card py-2.5 text-sm",
							children: [
								/* @__PURE__ */ L(e, {
									src: t.user.portrait,
									name: t.user.name,
									size: "sm"
								}),
								/* @__PURE__ */ L("span", {
									className: "min-w-0 flex-1 truncate",
									children: t.user.name
								}),
								/* @__PURE__ */ R("span", {
									className: "text-right text-xs text-muted",
									children: [
										O(t.confirmed_units),
										" delivered",
										t.open_units > 0 && /* @__PURE__ */ R("span", {
											className: "block",
											children: [O(t.open_units), " in progress"]
										}),
										t.points > 0 && /* @__PURE__ */ R("span", {
											className: "block text-success-fg",
											children: [O(t.points), " pts"]
										})
									]
								})
							]
						}, t.user.id))
					})] }),
					/* @__PURE__ */ R("p", {
						className: "px-1 text-xs text-subtle",
						children: [
							"Started ",
							w(g.created_at),
							g.created_by ? ` by ${g.created_by}` : "",
							".",
							g.items.some((e) => e.points_per_unit > 0) && !g.store_enabled && " Points are paid by the Corp Store plugin, which isn't switched on."
						]
					}),
					g.can_manage && g.contributors.length === 0 && /* @__PURE__ */ L(n, {
						variant: "ghost",
						className: "w-full text-danger-fg",
						onClick: () => h({ kind: "delete" }),
						children: "Delete project"
					})
				]
			})]
		}),
		p?.kind === "edit" && /* @__PURE__ */ L(q, {
			project: g,
			onClose: S
		}),
		p?.kind === "add" && /* @__PURE__ */ L(ge, {
			project: g,
			onClose: S
		}),
		p?.kind === "item" && /* @__PURE__ */ L(_e, {
			item: p.item,
			project: g,
			onClose: S
		}),
		p?.kind === "claim" && /* @__PURE__ */ L(ve, {
			item: p.item,
			current: p.current,
			onClose: S
		}),
		p?.kind === "deliver" && /* @__PURE__ */ L(Y, {
			title: `Delivered ${O(p.c.quantity)} × ${p.item.name}?`,
			description: g.location ? `It should be at: ${g.location}. A manager checks and confirms it.` : "A manager checks and confirms it.",
			label: "Where is it? (optional)",
			placeholder: "Corp hangar, 2nd division",
			confirmLabel: "Mark delivered",
			onSubmit: (e) => C.post(`/api/p/projects/contributions/${p.c.id}/deliver`, { note: e }),
			onClose: S
		}),
		p?.kind === "reject" && /* @__PURE__ */ L(Y, {
			title: `Send back ${p.c.user.name}'s delivery?`,
			description: "It becomes a claim again and they're told why.",
			label: "Why",
			placeholder: "Not in the corp hangar",
			confirmLabel: "Send back",
			onSubmit: (e) => C.post(`/api/p/projects/contributions/${p.c.id}/reject`, { note: e }),
			onClose: S
		}),
		/* @__PURE__ */ L(o, {
			open: p?.kind === "close",
			onOpenChange: (e) => !e && S(),
			title: p?.kind === "close" && p.status === "done" ? "Close the project as done?" : "Cancel the project?",
			description: p?.kind === "close" && p.status === "done" ? "Contributors are told. Claims that weren't delivered stay as they are." : "Nobody can claim anything more. You can reopen it later.",
			danger: p?.kind === "close" && p.status === "cancelled",
			confirmLabel: p?.kind === "close" && p.status === "done" ? "Close as done" : "Cancel project",
			onConfirm: () => p?.kind === "close" ? b(C.post(`${W}/projects/${g.id}/close`, { status: p.status })) : void 0
		}),
		/* @__PURE__ */ L(o, {
			open: p?.kind === "delete",
			onOpenChange: (e) => !e && S(),
			title: "Delete this project?",
			description: "Nobody has claimed anything, so nothing is lost but the project itself.",
			danger: !0,
			confirmLabel: "Delete",
			onConfirm: () => C.delete(`${W}/projects/${g.id}`).then(() => {
				y(), l("/p/projects");
			}).catch((e) => k.error(e.message))
		})
	] });
}
function De({ c: t, mine: r, manager: i, open: a, onChange: o, onRelease: s, onDeliver: c, onConfirm: l, onReject: u }) {
	return /* @__PURE__ */ R("li", {
		className: "flex flex-wrap items-center gap-x-3 gap-y-1 border border-border bg-surface-2/50 px-2.5 py-1.5 text-sm",
		children: [
			/* @__PURE__ */ L(e, {
				src: t.user.portrait,
				name: t.user.name,
				size: "xs"
			}),
			/* @__PURE__ */ L("span", {
				className: "font-medium",
				children: r ? "You" : t.user.name
			}),
			/* @__PURE__ */ L("span", {
				className: "font-mono text-xs tabular-nums",
				children: O(t.quantity)
			}),
			/* @__PURE__ */ L(Z, { status: t.status }),
			/* @__PURE__ */ L($, { hint: t.industry }),
			t.note && t.status === "delivered" && /* @__PURE__ */ R("span", {
				className: "text-xs italic text-muted",
				children: [
					"“",
					t.note,
					"”"
				]
			}),
			t.review_note && t.status === "claimed" && /* @__PURE__ */ R("span", {
				className: "text-xs text-warning-fg",
				children: ["Sent back: ", t.review_note]
			}),
			/* @__PURE__ */ R("span", {
				className: "ml-auto flex flex-wrap gap-1.5",
				children: [
					r && a && t.status === "claimed" && /* @__PURE__ */ R(I, { children: [
						/* @__PURE__ */ R(n, {
							size: "xs",
							variant: "primary",
							onClick: c,
							children: [/* @__PURE__ */ L(de, {}), " Delivered"]
						}),
						/* @__PURE__ */ L(n, {
							size: "xs",
							variant: "ghost",
							onClick: o,
							children: "Change"
						}),
						/* @__PURE__ */ L(n, {
							size: "xs",
							variant: "ghost",
							onClick: s,
							children: "Release"
						})
					] }),
					i && t.status !== "confirmed" && /* @__PURE__ */ R(n, {
						size: "xs",
						variant: "success",
						onClick: l,
						children: [/* @__PURE__ */ L(H, {}), " Confirm"]
					}),
					i && t.status === "delivered" && /* @__PURE__ */ L(n, {
						size: "xs",
						variant: "ghost",
						onClick: u,
						children: "Send back"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/queue.tsx
function Oe() {
	let t = M(), [i, a] = N("delivered"), [o, s] = N(null), { data: l, isLoading: u } = j({
		queryKey: [
			"projects",
			"queue",
			i
		],
		queryFn: () => C.get(`${W}/queue?status=${i}`),
		refetchInterval: 6e4
	}), f = (e) => C.post(`${W}/contributions/${e.id}/confirm`).then(() => {
		k.success(`Confirmed ${O(e.quantity)} × ${e.item} from ${e.user.name}`), t.invalidateQueries({ queryKey: ["projects"] });
	}).catch((e) => k.error(e.message));
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(ye, {
			to: "/p/projects",
			children: "Projects"
		}),
		/* @__PURE__ */ L(d, {
			eyebrow: "Industry",
			title: "Deliveries",
			icon: /* @__PURE__ */ L(se, {}),
			description: "Check each delivery is where the project says, then confirm it. Confirming pays its Corp Store points."
		}),
		/* @__PURE__ */ L(p, {
			className: "mb-4",
			value: i,
			onChange: a,
			"aria-label": "Which",
			options: [{
				value: "delivered",
				label: "Waiting for you"
			}, {
				value: "claimed",
				label: "Every open claim"
			}]
		}),
		/* @__PURE__ */ L(r, { children: u || !l ? /* @__PURE__ */ L("div", {
			className: "p-card",
			children: /* @__PURE__ */ L(m, { className: "h-40" })
		}) : l.length === 0 ? /* @__PURE__ */ L(c, {
			icon: /* @__PURE__ */ L(se, {}),
			title: i === "delivered" ? "Nothing to check" : "No open claims",
			description: i === "delivered" ? "Managers are told when someone marks a delivery." : void 0
		}) : /* @__PURE__ */ R(v, { children: [/* @__PURE__ */ L(_, { children: /* @__PURE__ */ R("tr", { children: [
			/* @__PURE__ */ L(x, { children: "Member" }),
			/* @__PURE__ */ L(x, { children: "Item" }),
			/* @__PURE__ */ L(x, { children: "Project" }),
			/* @__PURE__ */ L(x, { children: "Status" }),
			/* @__PURE__ */ L(x, {
				align: "right",
				children: "When"
			}),
			/* @__PURE__ */ L(x, { align: "right" })
		] }) }), /* @__PURE__ */ L("tbody", { children: l.map((t) => /* @__PURE__ */ R(S, { children: [
			/* @__PURE__ */ L(y, { children: /* @__PURE__ */ R("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ L(e, {
					src: t.user.portrait,
					name: t.user.name,
					size: "sm"
				}), /* @__PURE__ */ L("span", {
					className: "font-medium",
					children: t.user.name
				})]
			}) }),
			/* @__PURE__ */ R(y, { children: [
				/* @__PURE__ */ R("div", { children: [
					/* @__PURE__ */ L("span", {
						className: "font-mono",
						children: O(t.quantity)
					}),
					" × ",
					t.item
				] }),
				/* @__PURE__ */ L($, { hint: t.industry }),
				t.note && /* @__PURE__ */ R("div", {
					className: "text-xs italic text-muted",
					children: [
						"“",
						t.note,
						"”"
					]
				})
			] }),
			/* @__PURE__ */ R(y, { children: [/* @__PURE__ */ L(P, {
				to: `/p/projects/${t.project.id}`,
				className: "hover:text-accent-ink",
				children: t.project.name
			}), t.project.location && /* @__PURE__ */ L("div", {
				className: "text-xs text-muted",
				children: t.project.location
			})] }),
			/* @__PURE__ */ L(y, { children: /* @__PURE__ */ L(Z, { status: t.status }) }),
			/* @__PURE__ */ L(y, {
				align: "right",
				className: "text-xs text-muted",
				children: ne(t.delivered_at ?? t.created_at)
			}),
			/* @__PURE__ */ L(y, {
				align: "right",
				children: /* @__PURE__ */ R("div", {
					className: "flex justify-end gap-1.5",
					children: [/* @__PURE__ */ R(n, {
						size: "xs",
						variant: "success",
						onClick: () => f(t),
						children: [/* @__PURE__ */ L(H, {}), " Confirm"]
					}), t.status === "delivered" && /* @__PURE__ */ L(n, {
						size: "xs",
						variant: "ghost",
						onClick: () => s(t),
						children: "Send back"
					})]
				})
			})
		] }, t.id)) })] }) }),
		o && /* @__PURE__ */ L(Y, {
			title: `Send back ${o.user.name}'s delivery?`,
			description: "It becomes a claim again and they're told why.",
			label: "Why",
			placeholder: "Not in the corp hangar",
			confirmLabel: "Send back",
			onSubmit: (e) => C.post(`/api/p/projects/contributions/${o.id}/reject`, { note: e }),
			onClose: () => s(null)
		})
	] });
}
//#endregion
//#region src/index.tsx
var ke = T({
	routes: [
		{
			path: "",
			Component: Ce
		},
		{
			path: "me",
			Component: Te
		},
		{
			path: "queue",
			Component: Oe
		},
		{
			path: ":id",
			Component: Ee
		}
	],
	widgets: [{
		id: "open",
		title: "Industry projects",
		Component: we,
		size: "md",
		order: 40
	}]
});
//#endregion
export { ke as default };

export const classes = ["!data","!mine","!o","!type","@conduit/sdk","@tanstack/react-query","a","about","absolute","accent","across","act","actions","add","added","adding","adds","again","align","alt","an","and","anything","are","aren","aria-label","aria-pressed","as","async","at","audience","autoComplete","autoFocus","await","back","background","be","becomes","behind","being","belongs","bg-accent-soft","bg-success","bg-surface-2","bg-surface-2/50","bg-surface-3","bg-surface-raised","block","board","body","border","border-accent/60","border-border","border-border-strong","build","building","built","but","button","by","can","can_manage","cancelled","change","changed","changing","check","checks","children","claim","claimant","claimed","claims","className","close","closed","closed_at","color","confirm","confirmLabel","confirmed","confirmed_at","confirmed_units","confirming","confirms","const","contract","contribution","contributions","contributors","copy","corp","corporation","created_at","created_by","current","currentColor","cx","cy","danger","data","datetime-local","deadline","default","definePlugin","delete","deliver","delivered","delivered_at","deliveries","delivering","delivery","deployment","description","disabled","divide-border","divide-y","division","doctrine","done","dq","drop","due","each","earned","edit","editing","else","en","enabled","ends","ends_at","error","every","export","extends","eyebrow","few","fill","finished","first","flex","flex-1","flex-wrap","font-medium","font-mono","footer","for","free","from","function","game","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-6","gap-x-3","gap-x-6","gap-y-1","gap-y-2","get","ghost","grid","groups","h-1.5","h-24","h-40","h-48","h-64","h-full","hangar","has","height","helped","here","hint","hits","hover:bg-hover","hover:border-border-strong","hover:text-accent-ink","hover:text-text","hover:underline","icon","icon-sm","icons","id","if","import","in","in-game","industry","info","inline","inline-flex","inset-x-0","interface","invalidate","is","isLoading","isk_per_unit","isn","iso","it","italic","item","item_id","items","items-baseline","items-center","items-start","items_done","its","job","jobs","justify-between","justify-end","key","kind","label","lazy","least","length","lg","lg:grid-cols-2","like","line-clamp-2","lines","list","ll","loading","location","look","lost","m12","m15","m17","m21","m3.3","m6","m7","m7.5","making","manager","many","mark","marks","materials","max","max-h-60","maxLength","may","mb-1","mb-1.5","mb-2","mb-4","md","me","member","members","min","min-w-0","mine","ml-auto","mode","more","mr-auto","mt-1","mt-3","mutationFn","my_open_claims","n","name","navigate","needs","neutral","new","next","none","not","note","nothing","notify","now","null","number","of","off","oldest","on","onChange","onClick","onClose","onConfirm","onDeliver","onError","onOpenChange","onReject","onRelease","onSaved","onSubmit","onSuccess","once","one","ones","only","open","open_units","options","or","order","other","out","overflow-y-auto","own","p-1","p-card","paid","part","parts","paste","pasted","patch","path","paying","pays","people","per","picked","placeholder","points","points_per_unit","portrait","post","primary","progress","project","projects","promise","pts","pts/unit","put","px-1","px-2","px-2.5","px-card","py-1","py-1.5","py-2.5","py-4","qc","quantity","queryFn","queryKey","queue","re","react","react-router","ready","reason","recognised","refetchInterval","refresh","reject","relative","released","remove","removed","reopen","rest","return","review_note","rewards","right","round","rounded-full","routes","rows","run","runs","runs_delivered","runs_in_production","runs_ready","rx","ry","s","same","save","saved","secondary","see","send","sending","set","setCreating","setDialog","setDq","setForm","setIskPer","setMode","setNote","setPoints","setQ","setQuantity","setRejecting","setShow","setText","setType","several","shadow-e3","share","should","show","shrink-0","since","site","size","size-2","size-4","size-5","size-6","sm","sm:grid-cols-2","sm:grid-cols-3","sm:grid-cols-[1fr_140px]","so","someone","something","space-y-1.5","space-y-3","space-y-4","space-y-6","src","staging","staleTime","start","started","starting","states","static","status","stay","still","store_enabled","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","such","switched","t","tabular-nums","taken","text-[13px]","text-accent-ink","text-danger-fg","text-info-fg","text-left","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xs","that","the","their","them","then","these","they","this","title","to","toast","toggle","told","tone","top-full","totals","transition-colors","true","truncate","twice","type","type_id","types","undefined","under","unit","unknown","up","useNavigate","useParams","useQuery","useQueryClient","useState","used","user","value","variant","viewBox","void","w-full","waiting","warning","was","weren","what","when","where","which","who","whole","widgets","width","window","with","work","x","xl:grid-cols-4","xl:grid-cols-[1fr_340px]","xs","yet","you","your","z-10"];
