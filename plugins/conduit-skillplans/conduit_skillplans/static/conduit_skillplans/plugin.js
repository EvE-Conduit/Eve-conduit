import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardHeader as a, ConfirmDialog as o, Dialog as s, EmptyState as c, Field as l, Input as u, PageHeader as d, Progress as f, SearchInput as p, Segmented as m, Skeleton as h, Spinner as g, StatCard as _, SwitchRow as v, THead as y, TabPanel as b, Table as x, TableToolbar as S, Tabs as C, Td as w, Textarea as T, Th as E, Tr as D, api as O, definePlugin as ee, sp as k, toast as A } from "@conduit/sdk";
import { useMutation as j, useQuery as M, useQueryClient as N } from "@tanstack/react-query";
import { Link as P, useNavigate as F, useParams as I } from "react-router";
import { useEffect as te, useState as L } from "react";
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
		/* @__PURE__ */ z("path", { d: "M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z" }),
		/* @__PURE__ */ z("path", { d: "M22 10v6" }),
		/* @__PURE__ */ z("path", { d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5" })
	]
}), U = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M5 12h14" }), /* @__PURE__ */ z("path", { d: "M12 5v14" })]
}), W = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ z("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), G = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "M20 6 9 17l-5-5" })
}), ne = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ z("path", { d: "M12 6v6l4 2" })]
}), re = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" })
}), ie = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M3 6h18" }),
		/* @__PURE__ */ z("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ z("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
	]
}), K = (e) => /* @__PURE__ */ B(V, {
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
}), ae = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "m18 15-6-6-6 6" })
}), oe = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "m6 9 6 6 6-6" })
}), se = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M18 6 6 18" }), /* @__PURE__ */ z("path", { d: "m6 6 12 12" })]
}), ce = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ z("path", { d: "m7 10 5 5 5-5" }),
		/* @__PURE__ */ z("path", { d: "M12 15V3" })
	]
}), le = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("rect", {
		width: "8",
		height: "4",
		x: "8",
		y: "2",
		rx: "1",
		ry: "1"
	}), /* @__PURE__ */ z("path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" })]
}), ue = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "M12 2 4 20l8-4 8 4z" })
}), q = "/api/p/skillplans", J = [
	"",
	"I",
	"II",
	"III",
	"IV",
	"V"
];
function Y(e) {
	if (e <= 0) return "—";
	let t = Math.floor(e / 86400), n = Math.floor(e % 86400 / 3600), r = Math.max(1, Math.floor(e % 3600 / 60));
	return t ? `${t}d ${n}h` : n ? `${n}h ${r}m` : `${r}m`;
}
async function de(e) {
	try {
		return await navigator.clipboard.writeText(e), !0;
	} catch {
		return !1;
	}
}
//#endregion
//#region src/home.tsx
function X() {
	return M({
		queryKey: ["skillplans", "overview"],
		queryFn: () => O.get(q)
	});
}
function fe() {
	let e = F(), [t, n] = L(""), { data: i, isLoading: a } = X(), o = (e) => !t.trim() || `${e.name} ${e.category}`.toLowerCase().includes(t.trim().toLowerCase()), s = (i?.plans ?? []).filter((e) => e.shared && o(e)), c = (i?.plans ?? []).filter((e) => !e.shared && o(e));
	return /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(d, {
		eyebrow: "Character",
		title: "Skill Plans",
		icon: /* @__PURE__ */ z(H, {}),
		description: "What to train, in order, with how far each of your characters is and how long the rest takes. Copy a plan into the game's Skill Plans or skill queue.",
		actions: /* @__PURE__ */ B(r, {
			variant: "primary",
			onClick: () => e("/p/skillplans/new"),
			children: [/* @__PURE__ */ z(U, {}), " New plan"]
		})
	}), a || !i ? /* @__PURE__ */ z(h, { className: "h-64" }) : /* @__PURE__ */ B(C, {
		variant: "pills",
		defaultValue: "shared",
		className: "space-y-4",
		items: [{
			value: "shared",
			label: "Shared plans",
			count: s.length
		}, {
			value: "mine",
			label: "My plans",
			count: c.length
		}],
		children: [/* @__PURE__ */ z(b, {
			value: "shared",
			children: /* @__PURE__ */ z(Z, {
				plans: s,
				q: t,
				setQ: n,
				empty: i.can_manage ? "Make one with New plan and tick Shared." : "Leadership hasn't shared any plans yet."
			})
		}), /* @__PURE__ */ z(b, {
			value: "mine",
			children: /* @__PURE__ */ z(Z, {
				plans: c,
				q: t,
				setQ: n,
				empty: "Make your own with New plan, or copy a shared one."
			})
		})]
	})] });
}
function Z({ plans: e, q: t, setQ: r, empty: a }) {
	let o = F();
	return /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(S, { children: /* @__PURE__ */ z(p, {
		value: t,
		onChange: (e) => r(e.target.value),
		placeholder: "Plan or category",
		className: "w-64"
	}) }), e.length === 0 ? /* @__PURE__ */ z(c, {
		icon: /* @__PURE__ */ z(H, {}),
		title: t ? "No plan matches" : "No plans here yet",
		description: t ? void 0 : a
	}) : /* @__PURE__ */ B(x, { children: [/* @__PURE__ */ z(y, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(E, { children: "Plan" }),
		/* @__PURE__ */ z(E, {
			align: "right",
			children: "Skills"
		}),
		/* @__PURE__ */ z(E, { children: "My best character" }),
		/* @__PURE__ */ z(E, {
			align: "right",
			children: "Time left"
		})
	] }) }), /* @__PURE__ */ z("tbody", { children: e.map((e) => /* @__PURE__ */ B(D, {
		interactive: !0,
		onClick: () => o(`/p/skillplans/${e.id}`),
		children: [
			/* @__PURE__ */ B(w, { children: [/* @__PURE__ */ B("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ z("span", {
					className: "font-medium",
					children: e.name
				}), e.category && /* @__PURE__ */ z(n, {
					size: "xs",
					children: e.category
				})]
			}), e.description && /* @__PURE__ */ z("div", {
				className: "line-clamp-1 max-w-md text-xs text-subtle",
				children: e.description
			})] }),
			/* @__PURE__ */ z(w, {
				numeric: !0,
				children: e.skills
			}),
			/* @__PURE__ */ z(w, {
				className: "min-w-48",
				children: e.me ? /* @__PURE__ */ B("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ B("div", {
						className: "flex items-center justify-between gap-2 text-xs",
						children: [/* @__PURE__ */ z("span", {
							className: "truncate text-muted",
							children: e.me.character
						}), e.me.complete ? /* @__PURE__ */ B(n, {
							tone: "success",
							size: "xs",
							children: [/* @__PURE__ */ z(G, { className: "size-3" }), " Done"]
						}) : /* @__PURE__ */ B("span", {
							className: "font-mono tabular-nums",
							children: [e.me.percent, "%"]
						})]
					}), /* @__PURE__ */ z(f, {
						value: e.me.percent,
						size: "xs",
						tone: e.me.complete ? "success" : "accent"
					})]
				}) : /* @__PURE__ */ z("span", {
					className: "text-xs text-subtle",
					children: "No characters"
				})
			}),
			/* @__PURE__ */ z(w, {
				numeric: !0,
				className: "whitespace-nowrap",
				children: e.me && !e.me.complete ? Y(e.me.seconds_left) : "—"
			})
		]
	}, e.id)) })] })] });
}
//#endregion
//#region src/plan.tsx
function Q(e) {
	return M({
		queryKey: [
			"skillplans",
			"plan",
			e
		],
		queryFn: () => O.get(`${q}/plans/${e}`),
		enabled: !!e
	});
}
var $ = {
	done: {
		label: "Trained",
		tone: "success"
	},
	queued: {
		label: "In queue",
		tone: "info"
	},
	missing: {
		label: "To train",
		tone: "neutral"
	}
};
function pe() {
	let { id: t } = I(), s = F(), l = N(), { data: u, isLoading: f, error: p } = Q(t), [m, g] = L(null), [v, b] = L(!1), S = j({
		mutationFn: () => O.post(`${q}/plans/${t}/copy`),
		onSuccess: (e) => {
			l.invalidateQueries({ queryKey: ["skillplans"] }), A.success("Copied to My plans"), s(`/p/skillplans/${e.id}/edit`);
		},
		onError: (e) => A.error(e.message)
	});
	if (p) return /* @__PURE__ */ z(c, {
		icon: /* @__PURE__ */ z(H, {}),
		title: "No such skill plan",
		description: "It was deleted, or it's someone else's personal plan."
	});
	if (f || !u) return /* @__PURE__ */ z(h, { className: "h-96" });
	let C = u.characters.find((e) => e.id === m) ?? u.characters[0], T = async (e, t) => {
		if (!e) return A.info("Nothing left to train");
		await de(e) ? A.success(`${t} copied. In EVE, open Skill Plans (or the skill queue) and import from the clipboard.`) : A.error("Your browser didn't allow copying");
	};
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ z(d, {
			eyebrow: /* @__PURE__ */ z(P, {
				to: "/p/skillplans",
				className: "hover:text-text",
				children: "Skill Plans"
			}),
			title: u.name,
			icon: /* @__PURE__ */ z(H, {}),
			description: u.description || void 0,
			actions: /* @__PURE__ */ B("div", {
				className: "flex flex-wrap gap-2",
				children: [
					u.can_view_progress && /* @__PURE__ */ z(P, {
						to: `/p/skillplans/${u.id}/members`,
						children: /* @__PURE__ */ B(r, {
							variant: "ghost",
							children: [/* @__PURE__ */ z(K, {}), " Members"]
						})
					}),
					/* @__PURE__ */ B(r, {
						variant: "ghost",
						loading: S.isPending,
						onClick: () => S.mutate(),
						children: [/* @__PURE__ */ z(W, {}), " Copy to my plans"]
					}),
					u.can_edit && /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ B(r, {
						variant: "ghost",
						onClick: () => b(!0),
						children: [/* @__PURE__ */ z(ie, {}), " Delete"]
					}), /* @__PURE__ */ z(P, {
						to: `/p/skillplans/${u.id}/edit`,
						children: /* @__PURE__ */ B(r, { children: [/* @__PURE__ */ z(re, {}), " Edit"] })
					})] }),
					/* @__PURE__ */ B(r, {
						variant: "primary",
						onClick: () => T(u.text, "The whole plan"),
						children: [/* @__PURE__ */ z(W, {}), " Copy for EVE"]
					})
				]
			})
		}),
		/* @__PURE__ */ B("div", {
			className: "mb-4 flex flex-wrap items-center gap-2 text-xs text-muted",
			children: [
				/* @__PURE__ */ z(n, {
					tone: u.shared ? "accent" : "neutral",
					size: "xs",
					children: u.shared ? "Shared plan" : "My plan"
				}),
				u.category && /* @__PURE__ */ z(n, {
					size: "xs",
					children: u.category
				}),
				/* @__PURE__ */ B("span", { children: [
					u.skills,
					" skills · ",
					u.steps,
					" levels · ",
					k(u.total_sp)
				] }),
				u.created_by && /* @__PURE__ */ B("span", { children: ["· by ", u.created_by] })
			]
		}),
		u.characters.length === 0 ? /* @__PURE__ */ z(e, {
			tone: "info",
			className: "mb-4",
			children: "Add a character to see your progress on this plan."
		}) : /* @__PURE__ */ z("div", {
			className: "mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
			children: u.characters.map((e) => /* @__PURE__ */ z(me, {
				c: e,
				active: e.id === C?.id,
				onClick: () => g(e.id)
			}, e.id))
		}),
		C && /* @__PURE__ */ B("div", {
			className: "mb-4 grid gap-4 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ z(_, {
					label: `${C.name} · done`,
					value: `${C.percent}%`,
					tone: C.complete ? "success" : "accent",
					hint: `${C.done} of ${C.total} levels`
				}),
				/* @__PURE__ */ z(_, {
					label: "Time left",
					value: C.complete ? "—" : Y(C.seconds_left),
					icon: /* @__PURE__ */ z(ne, {}),
					hint: C.seconds_left > C.seconds_missing ? `${Y(C.seconds_left - C.seconds_missing)} of it already queued` : "with current attributes and implants"
				}),
				/* @__PURE__ */ z(_, {
					label: "Skill points left",
					value: k(C.sp_left)
				})
			]
		}),
		/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(a, {
			title: "Skills",
			description: "In training order: prerequisites come first. Copying pastes into EVE's Skill Plans window (Import from clipboard) or the skill queue.",
			actions: C && !C.complete && /* @__PURE__ */ B(r, {
				size: "sm",
				onClick: () => T(C.missing_text, `What ${C.name} still needs`),
				children: [
					/* @__PURE__ */ z(W, {}),
					" Copy what ",
					C.name,
					" needs"
				]
			})
		}), /* @__PURE__ */ B(x, { children: [/* @__PURE__ */ z(y, { children: /* @__PURE__ */ B("tr", { children: [
			/* @__PURE__ */ z(E, {
				className: "w-10",
				children: "#"
			}),
			/* @__PURE__ */ z(E, { children: "Skill" }),
			/* @__PURE__ */ z(E, {
				align: "right",
				children: "SP"
			}),
			C && /* @__PURE__ */ z(E, { children: C.name }),
			C && /* @__PURE__ */ z(E, {
				align: "right",
				children: "Time"
			})
		] }) }), /* @__PURE__ */ z("tbody", { children: u.steps_detail.map((e, t) => {
			let r = C?.steps[t];
			return /* @__PURE__ */ B(D, { children: [
				/* @__PURE__ */ z(w, {
					className: "font-mono text-xs text-subtle",
					children: t + 1
				}),
				/* @__PURE__ */ z(w, { children: /* @__PURE__ */ B("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ z("img", {
							src: e.icon,
							alt: "",
							className: "size-6",
							loading: "lazy"
						}),
						/* @__PURE__ */ B("span", {
							className: r?.status === "done" ? "text-muted" : "font-medium",
							children: [
								e.name,
								" ",
								J[e.level]
							]
						}),
						/* @__PURE__ */ B("span", {
							className: "hidden text-xs text-subtle sm:inline",
							children: [
								e.group,
								" · rank ",
								e.rank
							]
						})
					]
				}) }),
				/* @__PURE__ */ z(w, {
					numeric: !0,
					className: "text-xs text-muted",
					children: k(e.sp)
				}),
				r && /* @__PURE__ */ z(w, { children: /* @__PURE__ */ B(n, {
					tone: $[r.status].tone,
					size: "xs",
					children: [r.status === "done" && /* @__PURE__ */ z(G, { className: "size-3" }), $[r.status].label]
				}) }),
				r && /* @__PURE__ */ z(w, {
					numeric: !0,
					className: "whitespace-nowrap text-xs",
					children: r.status === "done" ? "" : Y(r.seconds)
				})
			] }, `${e.skill_id}-${e.level}`);
		}) })] })] }),
		/* @__PURE__ */ z(o, {
			open: v,
			onOpenChange: b,
			title: `Delete ${u.name}?`,
			description: u.shared ? "Everyone loses this shared plan, and group rules that use it stop passing." : "This can't be undone.",
			confirmLabel: "Delete",
			danger: !0,
			onConfirm: async () => {
				await O.delete(`${q}/plans/${u.id}`), l.invalidateQueries({ queryKey: ["skillplans"] }), s("/p/skillplans");
			}
		})
	] });
}
function me({ c: e, active: r, onClick: a }) {
	return /* @__PURE__ */ z("button", {
		type: "button",
		onClick: a,
		className: "text-left",
		children: /* @__PURE__ */ z(i, {
			interactive: !0,
			className: r ? "border-accent" : void 0,
			children: /* @__PURE__ */ B("div", {
				className: "flex items-center gap-3 p-3",
				children: [/* @__PURE__ */ z(t, {
					src: e.portrait,
					name: e.name,
					size: "sm"
				}), /* @__PURE__ */ B("div", {
					className: "min-w-0 flex-1 space-y-1",
					children: [
						/* @__PURE__ */ B("div", {
							className: "flex items-center justify-between gap-2 text-sm",
							children: [/* @__PURE__ */ z("span", {
								className: "truncate font-medium",
								children: e.name
							}), e.complete ? /* @__PURE__ */ B(n, {
								tone: "success",
								size: "xs",
								children: [/* @__PURE__ */ z(G, { className: "size-3" }), " Done"]
							}) : /* @__PURE__ */ B("span", {
								className: "font-mono text-xs tabular-nums",
								children: [e.percent, "%"]
							})]
						}),
						/* @__PURE__ */ z(f, {
							value: e.percent,
							size: "xs",
							tone: e.complete ? "success" : "accent"
						}),
						/* @__PURE__ */ z("div", {
							className: "text-xs text-subtle",
							children: e.synced ? e.complete ? "Every skill trained" : `${Y(e.seconds_left)} to go` : "Skills not synced yet"
						})
					]
				})]
			})
		})
	});
}
//#endregion
//#region src/editor.tsx
function he(e, t = 300) {
	let [n, r] = L(e);
	return te(() => {
		let n = setTimeout(() => r(e), t);
		return () => clearTimeout(n);
	}, [e, t]), n;
}
function ge() {
	let { id: e } = I(), { data: t, isLoading: n } = Q(e);
	return e && (n || !t) ? /* @__PURE__ */ z(h, { className: "h-96" }) : /* @__PURE__ */ z(_e, { plan: t }, t?.id ?? "new");
}
function _e({ plan: e }) {
	let t = F(), n = N(), { data: o } = X(), [s, f] = L({
		name: e?.name ?? "",
		description: e?.description ?? "",
		category: e?.category ?? "",
		shared: e?.shared ?? !1
	}), [p, m] = L(e?.steps_detail ?? []), [h, _] = L(e?.total_sp ?? 0), [y, b] = L(!1), x = j({
		mutationFn: (e) => O.post(`${q}/normalise`, { skills: e }),
		onSuccess: (e) => {
			m(e.steps), _(e.total_sp);
		},
		onError: (e) => A.error(e.message)
	}), S = (e = p) => e.map((e) => [e.skill_id, e.level]), C = (e) => x.mutate([...S(), ...e]), w = (e) => {
		let { skill_id: t, level: n } = p[e];
		x.mutate(S(p.filter((e) => !(e.skill_id === t && e.level >= n))));
	}, E = (e, t) => {
		let n = e + t;
		if (n < 0 || n >= p.length) return;
		let r = [...p];
		[r[e], r[n]] = [r[n], r[e]], x.mutate(S(r));
	}, D = j({
		mutationFn: () => {
			let t = {
				...s,
				skills: S()
			};
			return e ? O.put(`${q}/plans/${e.id}`, t) : O.post(`${q}/plans`, t);
		},
		onSuccess: (e) => {
			n.invalidateQueries({ queryKey: ["skillplans"] }), A.success(`${e.name} saved`), t(`/p/skillplans/${e.id}`);
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ z(d, {
			eyebrow: /* @__PURE__ */ z(P, {
				to: "/p/skillplans",
				className: "hover:text-text",
				children: "Skill Plans"
			}),
			title: e ? `Edit ${e.name}` : "New skill plan",
			icon: /* @__PURE__ */ z(H, {}),
			actions: /* @__PURE__ */ B("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ z(r, {
					variant: "ghost",
					onClick: () => t(e ? `/p/skillplans/${e.id}` : "/p/skillplans"),
					children: "Cancel"
				}), /* @__PURE__ */ z(r, {
					variant: "primary",
					disabled: !s.name.trim(),
					loading: D.isPending,
					onClick: () => D.mutate(),
					children: "Save plan"
				})]
			})
		}),
		/* @__PURE__ */ B("div", {
			className: "grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]",
			children: [/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(a, {
				title: `Skills · ${p.length} levels · ${k(h)}`,
				description: "Prerequisites are added and kept ahead of the skills that need them. Removing a level also removes the levels above it.",
				actions: x.isPending && /* @__PURE__ */ z(g, {})
			}), p.length === 0 ? /* @__PURE__ */ z(c, {
				icon: /* @__PURE__ */ z(H, {}),
				title: "No skills yet",
				description: "Paste a list from the game, or add skills and ships on the right."
			}) : /* @__PURE__ */ z("ol", {
				className: "divide-y divide-border",
				children: p.map((e, t) => /* @__PURE__ */ B("li", {
					className: "flex items-center gap-2 px-card py-1.5",
					children: [
						/* @__PURE__ */ z("span", {
							className: "w-8 font-mono text-xs text-subtle",
							children: t + 1
						}),
						/* @__PURE__ */ z("img", {
							src: e.icon,
							alt: "",
							className: "size-6",
							loading: "lazy"
						}),
						/* @__PURE__ */ B("span", {
							className: "min-w-0 flex-1 truncate text-sm",
							children: [
								e.name,
								" ",
								J[e.level]
							]
						}),
						/* @__PURE__ */ z("span", {
							className: "hidden text-xs text-subtle sm:inline",
							children: e.group
						}),
						/* @__PURE__ */ z(r, {
							size: "icon-xs",
							variant: "ghost",
							"aria-label": "Move up",
							disabled: t === 0,
							onClick: () => E(t, -1),
							children: /* @__PURE__ */ z(ae, {})
						}),
						/* @__PURE__ */ z(r, {
							size: "icon-xs",
							variant: "ghost",
							"aria-label": "Move down",
							disabled: t === p.length - 1,
							onClick: () => E(t, 1),
							children: /* @__PURE__ */ z(oe, {})
						}),
						/* @__PURE__ */ z(r, {
							size: "icon-xs",
							variant: "ghost",
							"aria-label": "Remove",
							onClick: () => w(t),
							children: /* @__PURE__ */ z(se, {})
						})
					]
				}, `${e.skill_id}-${e.level}`))
			})] }), /* @__PURE__ */ B("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ B(i, {
					className: "space-y-4 p-card",
					children: [
						/* @__PURE__ */ z(l, {
							label: "Name",
							required: !0,
							children: /* @__PURE__ */ z(u, {
								value: s.name,
								onChange: (e) => f({
									...s,
									name: e.target.value
								}),
								placeholder: "Ferox fleet ready",
								autoFocus: !e
							})
						}),
						/* @__PURE__ */ z(l, {
							label: "Category",
							hint: "Optional, e.g. Doctrines, Industry, New players.",
							children: /* @__PURE__ */ z(u, {
								value: s.category,
								onChange: (e) => f({
									...s,
									category: e.target.value
								})
							})
						}),
						/* @__PURE__ */ z(l, {
							label: "Description",
							children: /* @__PURE__ */ z(T, {
								rows: 3,
								value: s.description,
								onChange: (e) => f({
									...s,
									description: e.target.value
								})
							})
						}),
						o?.can_manage && /* @__PURE__ */ z(v, {
							label: "Shared",
							description: "Everyone sees shared plans, and group rules can require them.",
							checked: s.shared,
							onCheckedChange: (e) => f({
								...s,
								shared: e
							})
						})
					]
				}), /* @__PURE__ */ B(i, {
					className: "space-y-3 p-card",
					children: [
						/* @__PURE__ */ B(r, {
							className: "w-full",
							onClick: () => b(!0),
							children: [/* @__PURE__ */ z(le, {}), " Paste from EVE"]
						}),
						/* @__PURE__ */ z(be, { onAdd: (e, t) => C([[e, t]]) }),
						/* @__PURE__ */ z(xe, { onAdd: C })
					]
				})]
			})]
		}),
		y && /* @__PURE__ */ z(Se, {
			onClose: () => b(!1),
			onAdd: (e) => {
				C(e), b(!1);
			}
		})
	] });
}
function ve(e, t) {
	let n = he(t.trim());
	return M({
		queryKey: [
			"skillplans",
			e,
			n
		],
		queryFn: () => O.get(`${q}/${e}?q=${encodeURIComponent(n)}`),
		enabled: n.length >= (e === "types" ? 2 : 1)
	});
}
function ye({ items: e, onPick: t }) {
	return e?.length ? /* @__PURE__ */ z("ul", {
		className: "max-h-60 overflow-y-auto border border-border",
		children: e.map((e) => /* @__PURE__ */ z("li", { children: /* @__PURE__ */ B("button", {
			type: "button",
			onClick: () => t(e),
			className: "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-hover",
			children: [
				/* @__PURE__ */ z("img", {
					src: e.icon,
					alt: "",
					className: "size-5",
					loading: "lazy"
				}),
				/* @__PURE__ */ z("span", {
					className: "flex-1 truncate",
					children: e.name
				}),
				/* @__PURE__ */ z("span", {
					className: "text-xs text-subtle",
					children: e.group
				})
			]
		}) }, e.id))
	}) : null;
}
function be({ onAdd: e }) {
	let [t, n] = L(""), [r, i] = L("4"), { data: a } = ve("skills", t);
	return /* @__PURE__ */ B("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ z("div", {
				className: "text-xs font-medium text-muted",
				children: "Add a skill"
			}),
			/* @__PURE__ */ z(m, {
				size: "sm",
				value: r,
				onChange: i,
				"aria-label": "Level",
				options: [
					1,
					2,
					3,
					4,
					5
				].map((e) => ({
					value: String(e),
					label: J[e]
				}))
			}),
			/* @__PURE__ */ z(p, {
				value: t,
				onChange: (e) => n(e.target.value),
				placeholder: "Skill name"
			}),
			/* @__PURE__ */ z(ye, {
				items: a,
				onPick: (t) => {
					e(t.id, Number(r)), n(""), A.success(`${t.name} ${J[Number(r)]} added`);
				}
			})
		]
	});
}
function xe({ onAdd: e }) {
	let [t, n] = L(""), { data: r } = ve("types", t);
	return /* @__PURE__ */ B("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ B("div", {
				className: "flex items-center gap-1.5 text-xs font-medium text-muted",
				children: [/* @__PURE__ */ z(ue, { className: "size-3.5" }), " Add everything a ship or module needs"]
			}),
			/* @__PURE__ */ z(p, {
				value: t,
				onChange: (e) => n(e.target.value),
				placeholder: "Ship, module, drone..."
			}),
			/* @__PURE__ */ z(ye, {
				items: r,
				onPick: async (t) => {
					let r = await O.get(`${q}/types/${t.id}/requirements`);
					e(r.skills), n(""), A.success(`Added what ${r.name} needs`);
				}
			})
		]
	});
}
function Se({ onClose: t, onAdd: n }) {
	let [i, a] = L(""), [o, c] = L([]), l = j({
		mutationFn: () => O.post(`${q}/parse`, { text: i }),
		onSuccess: (e) => {
			e.problems.length && c(e.problems), e.skills.length && !e.problems.length ? n(e.skills) : e.skills.length || A.error("No skills found in that text");
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ z(s, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: "Paste from EVE",
		description: "In the game, copy a skill plan or your skill queue (or any list with one skill and level per line, like “Gunnery 4” or “Gunnery IV”) and paste it here.",
		size: "lg",
		footer: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(r, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), o.length > 0 && l.data?.skills.length ? /* @__PURE__ */ B(r, {
			variant: "primary",
			onClick: () => n(l.data.skills),
			children: [
				/* @__PURE__ */ z(U, {}),
				" Add the ",
				l.data.skills.length,
				" skills found"
			]
		}) : /* @__PURE__ */ B(r, {
			variant: "primary",
			disabled: !i.trim(),
			loading: l.isPending,
			onClick: () => l.mutate(),
			children: [/* @__PURE__ */ z(U, {}), " Add skills"]
		})] }),
		children: /* @__PURE__ */ B("div", {
			className: "space-y-3",
			children: [/* @__PURE__ */ z(T, {
				rows: 12,
				value: i,
				onChange: (e) => {
					a(e.target.value), c([]);
				},
				className: "font-mono text-xs",
				placeholder: "Spaceship Command 3\nCaldari Cruiser 4\nMedium Hybrid Turret 4",
				autoFocus: !0
			}), o.length > 0 && /* @__PURE__ */ z(e, {
				tone: "warning",
				title: `${o.length} line${o.length === 1 ? "" : "s"} couldn't be read`,
				children: /* @__PURE__ */ z("ul", {
					className: "mt-1 list-inside list-disc font-mono text-xs",
					children: o.map((e) => /* @__PURE__ */ z("li", { children: e }, e))
				})
			})]
		})
	});
}
//#endregion
//#region src/members.tsx
function Ce() {
	let { id: e } = I(), [a, o] = L(""), [s, l] = L("all"), { data: u, isLoading: g, error: v } = M({
		queryKey: [
			"skillplans",
			"members",
			e
		],
		queryFn: () => O.get(`${q}/plans/${e}/members`)
	});
	if (v) return /* @__PURE__ */ z(c, {
		icon: /* @__PURE__ */ z(K, {}),
		title: "Not available",
		description: v.message
	});
	if (g || !u) return /* @__PURE__ */ z(h, { className: "h-96" });
	let b = u.members.filter((e) => e.complete).length, C = u.members.filter((e) => s === "all" || s === "done" === e.complete).filter((e) => !a.trim() || `${e.name} ${e.character}`.toLowerCase().includes(a.trim().toLowerCase()));
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ z(d, {
			eyebrow: /* @__PURE__ */ z(P, {
				to: `/p/skillplans/${u.plan.id}`,
				className: "hover:text-text",
				children: u.plan.name
			}),
			title: "Members' progress",
			icon: /* @__PURE__ */ z(K, {}),
			description: "Each member's character closest to finishing the plan.",
			actions: /* @__PURE__ */ z("a", {
				href: `${q}/plans/${u.plan.id}/members.csv`,
				children: /* @__PURE__ */ B(r, {
					variant: "ghost",
					children: [/* @__PURE__ */ z(ce, {}), " CSV"]
				})
			})
		}),
		/* @__PURE__ */ B("div", {
			className: "mb-4 grid gap-4 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ z(_, {
					label: "Finished",
					value: b,
					tone: "success",
					hint: `of ${u.members.length} members`
				}),
				/* @__PURE__ */ z(_, {
					label: "Still training",
					value: u.members.length - b
				}),
				/* @__PURE__ */ z(_, {
					label: "Finished share",
					value: u.members.length ? `${Math.round(b / u.members.length * 100)}%` : "—"
				})
			]
		}),
		/* @__PURE__ */ B(i, { children: [/* @__PURE__ */ B(S, { children: [/* @__PURE__ */ z(p, {
			value: a,
			onChange: (e) => o(e.target.value),
			placeholder: "Member or character",
			className: "w-64"
		}), /* @__PURE__ */ z(m, {
			size: "sm",
			value: s,
			onChange: l,
			"aria-label": "Show",
			options: [
				{
					value: "all",
					label: "All"
				},
				{
					value: "done",
					label: "Finished"
				},
				{
					value: "open",
					label: "Training"
				}
			]
		})] }), C.length === 0 ? /* @__PURE__ */ z(c, {
			icon: /* @__PURE__ */ z(K, {}),
			title: "Nobody here"
		}) : /* @__PURE__ */ B(x, { children: [/* @__PURE__ */ z(y, { children: /* @__PURE__ */ B("tr", { children: [
			/* @__PURE__ */ z(E, { children: "Member" }),
			/* @__PURE__ */ z(E, { children: "Best character" }),
			/* @__PURE__ */ z(E, {
				className: "w-56",
				children: "Progress"
			}),
			/* @__PURE__ */ z(E, {
				align: "right",
				children: "Time left"
			})
		] }) }), /* @__PURE__ */ z("tbody", { children: C.map((e) => /* @__PURE__ */ B(D, { children: [
			/* @__PURE__ */ z(w, { children: /* @__PURE__ */ B("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ z(t, {
					src: e.portrait,
					name: e.name,
					size: "xs"
				}), /* @__PURE__ */ z("span", {
					className: "font-medium",
					children: e.name
				})]
			}) }),
			/* @__PURE__ */ B(w, {
				className: "text-sm text-muted",
				children: [e.character, !e.synced && /* @__PURE__ */ z("span", {
					className: "text-xs text-subtle",
					children: " (not synced)"
				})]
			}),
			/* @__PURE__ */ z(w, { children: e.complete ? /* @__PURE__ */ B(n, {
				tone: "success",
				size: "xs",
				children: [/* @__PURE__ */ z(G, { className: "size-3" }), " Finished"]
			}) : /* @__PURE__ */ B("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ z(f, {
					value: e.percent,
					size: "xs",
					className: "flex-1"
				}), /* @__PURE__ */ B("span", {
					className: "w-12 text-right font-mono text-xs tabular-nums",
					children: [e.percent, "%"]
				})]
			}) }),
			/* @__PURE__ */ z(w, {
				numeric: !0,
				className: "whitespace-nowrap",
				children: e.complete ? "—" : Y(e.seconds_left)
			})
		] }, e.user_id)) })] })] })
	] });
}
//#endregion
//#region src/index.tsx
function we() {
	let { data: e, isLoading: t } = M({
		queryKey: ["skillplans", "me"],
		queryFn: () => O.get(`${q}/me`)
	});
	if (t) return /* @__PURE__ */ z(h, { className: "h-16" });
	if (!e) return null;
	let r = e.next;
	return /* @__PURE__ */ B(P, {
		to: r ? `/p/skillplans/${r.id}` : "/p/skillplans",
		className: "block space-y-2",
		children: [/* @__PURE__ */ B("div", {
			className: "flex items-start justify-between gap-4",
			children: [/* @__PURE__ */ B("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ z("div", {
						className: "text-xs text-muted",
						children: r ? "Closest to done" : "Shared skill plans"
					}),
					/* @__PURE__ */ z("div", {
						className: "truncate font-medium",
						children: r ? r.name : e.plans ? "All finished" : "None shared yet"
					}),
					r?.me && /* @__PURE__ */ B("div", {
						className: "truncate text-xs text-subtle",
						children: [
							r.me.character,
							" · ",
							Y(r.me.seconds_left),
							" left"
						]
					})
				]
			}), /* @__PURE__ */ B(n, {
				tone: "accent",
				children: [
					e.complete,
					"/",
					e.plans,
					" done"
				]
			})]
		}), r?.me && /* @__PURE__ */ z(f, {
			value: r.me.percent,
			size: "xs"
		})]
	});
}
var Te = ee({
	routes: [
		{
			path: "",
			Component: fe
		},
		{
			path: "new",
			Component: ge
		},
		{
			path: ":id",
			Component: pe
		},
		{
			path: ":id/edit",
			Component: ge
		},
		{
			path: ":id/members",
			Component: Ce
		}
	],
	widgets: [{
		id: "next-plan",
		title: "Skill plans",
		Component: we,
		size: "sm",
		order: 40
	}]
});
//#endregion
export { Te as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","above","accent","actions","active","add","added","adds","ahead","align","all","allow","already","also","alt","and","any","are","aria-label","as","async","attributes","autoFocus","available","await","be","best","block","body","border","border-accent","border-border","browser","but","button","by","can","can_edit","can_manage","can_view_progress","catch","category","change","char","character","characters","checked","children","className","closest","come","complete","confirmLabel","const","copy","copyForEve","copying","couldn","count","created_by","csv","current","currentColor","cx","cy","d","danger","data","default","defaultValue","description","didn","disabled","divide-border","divide-y","done","down","dq","each","editing","else","empty","enabled","error","every","everything","export","extends","eyebrow","far","few","fill","finished","finishing","first","fleet","flex","flex-1","flex-wrap","font-medium","font-mono","footer","for","found","from","function","game","gap-1.5","gap-2","gap-3","gap-4","gap-6","get","ghost","go","goes","grid","group","h","h-16","h-64","h-96","hasn","height","here","hidden","hint","hover:bg-hover","hover:text-text","how","href","i","icon","icon-xs","icons","id","if","implants","import","in","info","inline","interactive","interface","into","is","isLoading","isPending","it","items","items-center","items-start","its","j","justify-between","kept","key","kind","label","lazy","left","length","level","levels","lg","lg:grid-cols-[minmax(0,1fr)_380px]","like","line-clamp-1","list","list-disc","list-inside","loading","long","loses","lvl","m","m18","m6","m7","match","matches","max-h-60","max-w-md","mb-4","mb-6","me","member","members","min-w-0","min-w-48","mine","missing","missing_text","module","more","move","ms","mt-1","mutationFn","my","name","navigate","need","needs","neutral","new","next","next-plan","none","normalise","not","null","number","numeric","of","on","onAdd","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpenChange","onPick","onSuccess","one","open","options","or","order","overflow-y-auto","overview","own","owner","p-3","p-card","pairs","parse","paste","pastes","path","per","percent","personal","pick","pills","placeholder","plan","plans","points","portrait","post","prerequisites","primary","problems","progress","put","puts","px-2","px-card","py-1.5","qc","queryFn","queryKey","queue","queued","r","rank","react","react-router","read","ready","remove","removes","reorder","require","rest","return","right","round","routes","rows","rules","rx","ry","s","same","save","saved","seconds","seconds_left","seconds_missing","see","sees","setDeleting","setForm","setLevel","setPasting","setPicked","setProblems","setQ","setShow","setSteps","setText","setTotalSp","setV","share","shared","ship","ships","show","site","size","size-3","size-3.5","size-4","size-5","size-6","skill","skillId","skill_id","skillplans","skills","sm","sm:grid-cols-2","sm:grid-cols-3","sm:inline","so","someone","sp","sp_left","space-y-1","space-y-2","space-y-3","space-y-4","src","st","status","steps","steps_detail","still","stop","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","such","synced","t","tabular-nums","text","text-left","text-muted","text-right","text-sm","text-subtle","text-xs","that","the","this","through","tick","time","title","to","tone","total","total_sp","train","trainTime","trained","training","truncate","try","type","types","undefined","up","updated_at","use","useDebounced","useNavigate","useOverview","useParams","usePlan","useQuery","useQueryClient","useState","used","user_id","v","value","variant","viewBox","void","w-10","w-12","w-56","w-64","w-8","w-full","warning","was","what","which","whitespace-nowrap","whole","widgets","width","window","with","xl:grid-cols-3","xs","yet","your"];
