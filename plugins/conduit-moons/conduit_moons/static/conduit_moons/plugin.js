import { Alert as e, Avatar as t, Badge as n, BarChart as r, Button as i, Card as a, CardBody as o, CardHeader as s, ConfirmDialog as c, Dialog as l, EmptyState as u, Field as d, Input as f, PageHeader as p, Select as m, Skeleton as h, StatCard as g, Switch as _, THead as v, TabPanel as y, Table as b, Tabs as x, Td as S, Textarea as C, Th as w, Tr as T, api as E, date as D, definePlugin as O, isk as k, num as A, toast as j, useHasPerm as M } from "@conduit/sdk";
import { useMutation as N, useQuery as P, useQueryClient as F } from "@tanstack/react-query";
import { Fragment as I, useState as L } from "react";
import { Link as R } from "react-router";
import { Fragment as z, jsx as B, jsxs as V } from "react/jsx-runtime";
//#region src/icons.tsx
function H({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ B("svg", {
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
var U = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M14.531 12.469 6.619 20.38a1 1 0 1 1-3-3l7.912-7.912" }),
		/* @__PURE__ */ B("path", { d: "M15.686 4.314A12.5 12.5 0 0 0 5.461 2.958 1 1 0 0 0 5.58 4.71a22 22 0 0 1 6.318 3.393" }),
		/* @__PURE__ */ B("path", { d: "M17.7 3.7a1 1 0 0 0-1.4 0l-4.6 4.6a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4z" }),
		/* @__PURE__ */ B("path", { d: "M19.686 8.314a12.5 12.5 0 0 1 1.356 10.225 1 1 0 0 1-1.751-.119 22 22 0 0 0-3.393-6.319" })
	]
}), ee = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M12 15V3" }),
		/* @__PURE__ */ B("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ B("path", { d: "m7 10 5 5 5-5" })
	]
}), te = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("path", { d: "M20 7h-9" }),
		/* @__PURE__ */ B("path", { d: "M14 17H5" }),
		/* @__PURE__ */ B("circle", {
			cx: "17",
			cy: "17",
			r: "3"
		}),
		/* @__PURE__ */ B("circle", {
			cx: "7",
			cy: "7",
			r: "3"
		})
	]
}), W = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("rect", {
		width: "18",
		height: "11",
		x: "3",
		y: "11",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ B("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })]
}), G = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("rect", {
		width: "18",
		height: "11",
		x: "3",
		y: "11",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ B("path", { d: "M7 11V7a5 5 0 0 1 9.9-1" })]
}), K = ({ open: e, className: t = "size-4" }) => /* @__PURE__ */ B(H, {
	className: `${t} transition-transform ${e ? "rotate-90" : ""}`,
	children: /* @__PURE__ */ B("path", { d: "m9 18 6-6-6-6" })
}), q = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [
		/* @__PURE__ */ B("circle", {
			cx: "8",
			cy: "8",
			r: "6"
		}),
		/* @__PURE__ */ B("path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18" }),
		/* @__PURE__ */ B("path", { d: "M7 6h1v4" }),
		/* @__PURE__ */ B("path", { d: "m16.71 13.88.7.71-2.82 2.82" })
	]
}), ne = (e) => /* @__PURE__ */ V(H, {
	...e,
	children: [/* @__PURE__ */ B("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ B("circle", {
		cx: "12",
		cy: "7",
		r: "4"
	})]
}), J = "/api/p/moons";
function Y() {
	return P({
		queryKey: ["moons", "months"],
		queryFn: () => E.get(`${J}/months`)
	});
}
function X({ value: e, onChange: t }) {
	let { data: n } = Y(), r = (n?.months ?? [{
		month: e,
		label: e,
		closed: !1
	}]).map((e) => ({
		value: e.month,
		label: `${e.label}${e.closed ? " · closed" : e.month === n?.current ? " · so far" : ""}`
	}));
	return /* @__PURE__ */ B(m, {
		value: e,
		onChange: (e) => t(e.target.value),
		options: r,
		"aria-label": "Month",
		className: "w-56"
	});
}
function Z() {
	let { data: e } = Y(), [t, n] = L(null);
	return [t ?? e?.current ?? "", n];
}
function re() {
	let e = F(), t = M("moons.manage_ledger"), [n, l] = Z(), [d, f] = L(!1), [m, _] = L(null), C = [
		"moons",
		"ledger",
		n
	], { data: D, isLoading: O } = P({
		queryKey: C,
		queryFn: () => E.get(`${J}/ledger?month=${n}`),
		enabled: !!n
	}), I = (t) => {
		e.setQueryData(C, t), e.invalidateQueries({ queryKey: ["moons", "months"] });
	}, H = N({
		mutationFn: () => E.post(`${J}/months/${n}/close`),
		onSuccess: (e) => {
			I(e), j.success(`${e.label} closed; members have been told what they owe`);
		},
		onError: (e) => j.error(e.message)
	}), K = N({
		mutationFn: () => E.post(`${J}/months/${n}/reopen`),
		onSuccess: (e) => {
			I(e), j.success(`${e.label} reopened`);
		},
		onError: (e) => j.error(e.message)
	}), q = N({
		mutationFn: ({ id: e, paid: t }) => E.post(`${J}/invoices/${e}`, { paid: t }),
		onSuccess: () => e.invalidateQueries({ queryKey: C }),
		onError: (e) => j.error(e.message)
	});
	return /* @__PURE__ */ V(z, { children: [
		/* @__PURE__ */ B(p, {
			eyebrow: "Moon mining",
			title: "Ledger",
			icon: /* @__PURE__ */ B(U, {}),
			description: "Who mined what from your moons, what it's worth and the moon tax each member owes.",
			actions: /* @__PURE__ */ V("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ B(X, {
						value: n,
						onChange: l
					}),
					/* @__PURE__ */ B(R, {
						to: "/p/moons/me",
						children: /* @__PURE__ */ V(i, {
							variant: "ghost",
							children: [/* @__PURE__ */ B(ne, {}), " Mine"]
						})
					}),
					/* @__PURE__ */ B("a", {
						href: `${J}/ledger.csv?month=${n}`,
						download: !0,
						children: /* @__PURE__ */ V(i, {
							variant: "ghost",
							children: [/* @__PURE__ */ B(ee, {}), " CSV"]
						})
					}),
					t && /* @__PURE__ */ V(i, {
						onClick: () => f(!0),
						children: [/* @__PURE__ */ B(te, {}), " Settings"]
					})
				]
			})
		}),
		O || !D ? /* @__PURE__ */ B("div", {
			className: "grid gap-4 sm:grid-cols-4",
			children: [
				0,
				1,
				2,
				3
			].map((e) => /* @__PURE__ */ B(h, { className: "h-28" }, e))
		}) : /* @__PURE__ */ V("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ B(ie, {
					data: D,
					canManage: t,
					onClose: () => _("close"),
					onReopen: () => _("reopen")
				}),
				/* @__PURE__ */ V("div", {
					className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
					children: [
						/* @__PURE__ */ B(g, {
							label: "Mined",
							value: k(D.totals.value),
							mono: !0,
							hint: `${A(D.totals.quantity)} units of ore`
						}),
						/* @__PURE__ */ B(g, {
							label: `Moon tax · ${D.tax_rate}%`,
							value: k(D.totals.tax),
							mono: !0,
							hint: `${D.totals.members} member${D.totals.members === 1 ? "" : "s"}`
						}),
						/* @__PURE__ */ B(g, {
							label: "Paid",
							value: D.closed ? k(D.totals.paid) : "—",
							mono: !0,
							tone: D.closed && D.totals.paid >= D.totals.tax ? "success" : void 0,
							hint: D.closed ? `${Math.round(D.totals.paid / Math.max(D.totals.tax, 1) * 100)}% of the tax` : "once the month is closed"
						}),
						/* @__PURE__ */ B(g, {
							label: "Unregistered miners",
							value: k(D.totals.unregistered_value),
							mono: !0,
							tone: D.totals.unregistered_value > 0 ? "warning" : void 0,
							hint: "by characters nobody registered"
						})
					]
				}),
				/* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(s, {
					title: "Mined per day",
					description: `Value of the ore mined each day in ${D.label}`
				}), /* @__PURE__ */ B(o, { children: D.series.some((e) => e.value > 0) ? /* @__PURE__ */ B(r, {
					data: D.series,
					format: (e) => k(e),
					label: "Mined"
				}) : /* @__PURE__ */ B("p", {
					className: "text-sm text-muted",
					children: "Nothing mined yet this month."
				}) })] }),
				/* @__PURE__ */ V(x, {
					variant: "pills",
					className: "space-y-4",
					items: [
						{
							value: "members",
							label: "Members",
							count: D.members.length
						},
						{
							value: "moons",
							label: "Moons",
							count: D.moons.length
						},
						{
							value: "ores",
							label: "Ores",
							count: D.ores.length
						}
					],
					children: [
						/* @__PURE__ */ B(y, {
							value: "members",
							children: /* @__PURE__ */ B(ae, {
								data: D,
								canManage: t,
								onPaid: (e, t) => q.mutate({
									id: e,
									paid: t
								})
							})
						}),
						/* @__PURE__ */ B(y, {
							value: "moons",
							children: /* @__PURE__ */ B(a, { children: D.moons.length === 0 ? /* @__PURE__ */ B(u, {
								icon: /* @__PURE__ */ B(U, {}),
								title: "No moon drills mined this month"
							}) : /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [
								/* @__PURE__ */ B(w, { children: "Refinery" }),
								/* @__PURE__ */ B(w, { children: "Moon" }),
								/* @__PURE__ */ B(w, {
									align: "right",
									children: "Miners"
								}),
								/* @__PURE__ */ B(w, {
									align: "right",
									children: "Units"
								}),
								/* @__PURE__ */ B(w, {
									align: "right",
									children: "Value"
								})
							] }) }), /* @__PURE__ */ B("tbody", { children: D.moons.map((e) => /* @__PURE__ */ V(T, { children: [
								/* @__PURE__ */ B(S, { children: e.name }),
								/* @__PURE__ */ B(S, {
									className: "text-muted",
									children: e.moon || "—"
								}),
								/* @__PURE__ */ B(S, {
									numeric: !0,
									children: e.miners
								}),
								/* @__PURE__ */ B(S, {
									numeric: !0,
									children: A(e.quantity)
								}),
								/* @__PURE__ */ B(S, {
									numeric: !0,
									children: k(e.value)
								})
							] }, e.observer_id)) })] }) })
						}),
						/* @__PURE__ */ B(y, {
							value: "ores",
							children: /* @__PURE__ */ B(oe, {
								ores: D.ores,
								closed: D.closed
							})
						})
					]
				})
			]
		}),
		d && /* @__PURE__ */ B(se, { onClose: () => f(!1) }),
		/* @__PURE__ */ B(c, {
			open: m === "close",
			onOpenChange: (e) => !e && _(null),
			title: `Close ${D?.label ?? "this month"}?`,
			description: `Ore prices and the ${D?.tax_rate ?? ""}% tax rate are fixed as they are now, and each member is told what they owe. You can reopen it while nobody has paid.`,
			confirmLabel: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(W, {}), " Close month"] }),
			onConfirm: () => H.mutateAsync()
		}),
		/* @__PURE__ */ B(c, {
			open: m === "reopen",
			onOpenChange: (e) => !e && _(null),
			title: `Reopen ${D?.label ?? "this month"}?`,
			description: "What members owe for the month is deleted, and values go back to today's prices until you close it again.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(G, {}), " Reopen"] }),
			onConfirm: () => K.mutateAsync()
		})
	] });
}
function ie({ data: t, canManage: n, onClose: r, onReopen: a }) {
	return t.closed ? /* @__PURE__ */ V(e, {
		tone: "success",
		title: `${t.label} is closed`,
		action: n ? /* @__PURE__ */ V(i, {
			size: "sm",
			variant: "ghost",
			onClick: a,
			children: [/* @__PURE__ */ B(G, {}), " Reopen"]
		}) : void 0,
		children: [
			"Closed ",
			t.closed_at ? D(t.closed_at) : "",
			". Values use the ore prices of that day and won't change."
		]
	}) : t.can_close ? /* @__PURE__ */ B(e, {
		tone: "warning",
		title: `${t.label} is over and still open`,
		action: n ? /* @__PURE__ */ V(i, {
			size: "sm",
			variant: "primary",
			onClick: r,
			children: [/* @__PURE__ */ B(W, {}), " Close month"]
		}) : void 0,
		children: "Values use today's ore prices until the month is closed. Closing fixes them and tells members what they owe."
	}) : /* @__PURE__ */ B(e, {
		tone: "info",
		title: `${t.label} so far`,
		children: "Values use today's ore prices. Once the month is over it can be closed and members are told what they owe."
	});
}
function ae({ data: e, canManage: r, onPaid: i }) {
	let [o, s] = L(/* @__PURE__ */ new Set()), c = (e) => s((t) => {
		let n = new Set(t);
		return n.has(e) ? n.delete(e) : n.add(e), n;
	});
	return e.members.length === 0 ? /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(U, {}),
		title: `Nobody mined from your moons in ${e.label}`,
		description: "Mining shows up once a director or accountant's login has synced the corporation's moon drills."
	}) }) : /* @__PURE__ */ B(a, { children: /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [
		/* @__PURE__ */ B(w, { children: "Member" }),
		/* @__PURE__ */ B(w, {
			align: "right",
			children: "Units"
		}),
		/* @__PURE__ */ B(w, {
			align: "right",
			children: "Value"
		}),
		/* @__PURE__ */ B(w, {
			align: "right",
			children: "Tax"
		}),
		/* @__PURE__ */ B(w, {
			align: "right",
			children: e.closed ? "Paid" : ""
		})
	] }) }), /* @__PURE__ */ B("tbody", { children: e.members.map((e) => /* @__PURE__ */ V(I, { children: [/* @__PURE__ */ V(T, {
		interactive: !0,
		onClick: () => c(e.key),
		children: [
			/* @__PURE__ */ B(S, { children: /* @__PURE__ */ V("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ B(K, {
						open: o.has(e.key),
						className: "size-4 text-subtle"
					}),
					/* @__PURE__ */ B(t, {
						src: e.portrait,
						name: e.name,
						size: "sm"
					}),
					/* @__PURE__ */ V("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ V("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ B("span", {
								className: "truncate font-medium",
								children: e.name
							}), !e.registered && /* @__PURE__ */ B(n, {
								tone: "warning",
								children: "not registered"
							})]
						}), /* @__PURE__ */ V("div", {
							className: "text-xs text-subtle",
							children: [
								e.characters.length,
								" character",
								e.characters.length === 1 ? "" : "s"
							]
						})]
					})
				]
			}) }),
			/* @__PURE__ */ B(S, {
				numeric: !0,
				children: A(e.quantity)
			}),
			/* @__PURE__ */ B(S, {
				numeric: !0,
				children: k(e.value)
			}),
			/* @__PURE__ */ B(S, {
				numeric: !0,
				className: e.registered ? "" : "text-subtle",
				children: e.registered ? k(e.tax) : "—"
			}),
			/* @__PURE__ */ B(S, {
				align: "right",
				onClick: (e) => e.stopPropagation(),
				children: e.invoice ? r ? /* @__PURE__ */ V("label", {
					className: "inline-flex items-center gap-2 text-xs text-muted",
					children: [e.invoice.paid ? "Paid" : "Unpaid", /* @__PURE__ */ B(_, {
						checked: e.invoice.paid,
						onCheckedChange: (t) => i(e.invoice.id, t),
						"aria-label": `${e.name} has paid`
					})]
				}) : /* @__PURE__ */ B(n, {
					tone: e.invoice.paid ? "success" : "warning",
					children: e.invoice.paid ? "Paid" : "Unpaid"
				}) : null
			})
		]
	}), o.has(e.key) && e.characters.map((t) => /* @__PURE__ */ V(T, {
		className: "bg-bg/40",
		children: [
			/* @__PURE__ */ B(S, {
				className: "pl-16 text-muted",
				children: t.name
			}),
			/* @__PURE__ */ B(S, {
				numeric: !0,
				className: "text-muted",
				children: A(t.quantity)
			}),
			/* @__PURE__ */ B(S, {
				numeric: !0,
				className: "text-muted",
				children: k(t.value)
			}),
			/* @__PURE__ */ B(S, {}),
			/* @__PURE__ */ B(S, {})
		]
	}, `${e.key}-${t.id}`))] }, e.key)) })] }) });
}
function oe({ ores: e, closed: t }) {
	return e.length === 0 ? /* @__PURE__ */ B(a, { children: /* @__PURE__ */ B(u, {
		icon: /* @__PURE__ */ B(U, {}),
		title: "No ore mined this month"
	}) }) : /* @__PURE__ */ B(a, { children: /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [
		/* @__PURE__ */ B(w, { children: "Ore" }),
		/* @__PURE__ */ B(w, {
			align: "right",
			children: t ? "Price at closing" : "Price now"
		}),
		/* @__PURE__ */ B(w, {
			align: "right",
			children: "Units"
		}),
		/* @__PURE__ */ B(w, {
			align: "right",
			children: "Value"
		})
	] }) }), /* @__PURE__ */ B("tbody", { children: e.map((e) => /* @__PURE__ */ V(T, { children: [
		/* @__PURE__ */ B(S, { children: /* @__PURE__ */ V("div", {
			className: "flex items-center gap-2.5",
			children: [/* @__PURE__ */ B("img", {
				src: e.icon,
				alt: "",
				className: "size-6 rounded",
				loading: "lazy"
			}), e.name]
		}) }),
		/* @__PURE__ */ B(S, {
			numeric: !0,
			className: "text-muted",
			children: k(e.price, { full: !0 })
		}),
		/* @__PURE__ */ B(S, {
			numeric: !0,
			children: A(e.quantity)
		}),
		/* @__PURE__ */ B(S, {
			numeric: !0,
			children: k(e.value)
		})
	] }, e.type_id)) })] }) });
}
function se({ onClose: e }) {
	let t = F(), { data: n } = P({
		queryKey: ["moons", "settings"],
		queryFn: () => E.get(`${J}/settings`)
	}), [r, a] = L(null), o = r ?? n ?? null, s = N({
		mutationFn: (e) => E.put(`${J}/settings`, e),
		onSuccess: (n) => {
			t.setQueryData(["moons", "settings"], n), t.invalidateQueries({ queryKey: ["moons"] }), j.success("Saved"), e();
		},
		onError: (e) => j.error(e.message)
	}), c = (e) => o && a({
		...o,
		...e
	});
	return /* @__PURE__ */ B(l, {
		open: !0,
		onOpenChange: (t) => !t && e(),
		title: "Moon tax settings",
		description: "Apply to open months. Closed months keep the rate they were closed with.",
		size: "lg",
		footer: /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(i, {
			variant: "ghost",
			onClick: e,
			children: "Cancel"
		}), /* @__PURE__ */ B(i, {
			variant: "primary",
			disabled: !o,
			loading: s.isPending,
			onClick: () => o && s.mutate(o),
			children: "Save"
		})] }),
		children: o ? /* @__PURE__ */ V("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ B(d, {
					label: "Moon tax (% of the ore's value)",
					hint: "0 keeps the ledger without charging anything.",
					children: /* @__PURE__ */ B("div", { children: /* @__PURE__ */ B(f, {
						type: "number",
						min: 0,
						max: 100,
						step: .5,
						value: o.tax_rate,
						onChange: (e) => c({ tax_rate: Number(e.target.value) }),
						className: "w-32 font-mono"
					}) })
				}),
				/* @__PURE__ */ B(d, {
					label: "How to pay",
					hint: "Shown to members with what they owe, and sent with the monthly notification.",
					children: /* @__PURE__ */ B(C, {
						rows: 3,
						value: o.payment_instructions,
						placeholder: "Give the ISK to Moon Holdings Corp with the reason MOON.",
						onChange: (e) => c({ payment_instructions: e.target.value })
					})
				}),
				/* @__PURE__ */ V("div", { children: [
					/* @__PURE__ */ B("div", {
						className: "mb-1 text-[13px] font-medium",
						children: "Corporations"
					}),
					/* @__PURE__ */ B("p", {
						className: "mb-3 text-xs text-muted",
						children: "Whose moon drills count. None ticked means all of them."
					}),
					o.available_corporations.length === 0 ? /* @__PURE__ */ B("p", {
						className: "text-sm text-subtle",
						children: "No corporation has synced moon mining yet."
					}) : /* @__PURE__ */ B("div", {
						className: "divide-y divide-border rounded-lg border border-border",
						children: o.available_corporations.map((e) => /* @__PURE__ */ V("label", {
							className: "flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm",
							children: [/* @__PURE__ */ V("span", { children: [
								e.name,
								" ",
								/* @__PURE__ */ V("span", {
									className: "text-subtle",
									children: [
										"[",
										e.ticker,
										"]"
									]
								})
							] }), /* @__PURE__ */ B(_, {
								checked: o.corporations.includes(e.id),
								onCheckedChange: (t) => c({ corporations: t ? [...o.corporations, e.id] : o.corporations.filter((t) => t !== e.id) })
							})]
						}, e.id))
					})
				] })
			]
		}) : /* @__PURE__ */ B(h, { className: "h-40" })
	});
}
function Q(e) {
	return P({
		queryKey: [
			"moons",
			"me",
			e
		],
		queryFn: () => E.get(`${J}/me?month=${e}`),
		enabled: e !== void 0
	});
}
function $() {
	let t = M("moons.view_ledger"), [r, c] = Z(), { data: l, isLoading: d } = Q(r), f = l?.ledger.members[0];
	return /* @__PURE__ */ V(z, { children: [/* @__PURE__ */ B(p, {
		eyebrow: "Moon mining",
		title: "My moon mining",
		icon: /* @__PURE__ */ B(U, {}),
		description: "What your characters mined from the corporation's moons, and the moon tax for it.",
		actions: /* @__PURE__ */ V("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ B(X, {
				value: r,
				onChange: c
			}), t && /* @__PURE__ */ B(R, {
				to: "/p/moons",
				children: /* @__PURE__ */ B(i, {
					variant: "ghost",
					children: "Full ledger"
				})
			})]
		})
	}), d || !l ? /* @__PURE__ */ B(h, { className: "h-48" }) : /* @__PURE__ */ V("div", {
		className: "space-y-6",
		children: [
			l.outstanding > 0 && /* @__PURE__ */ B(e, {
				tone: "warning",
				icon: /* @__PURE__ */ B(q, {}),
				title: `You owe ${k(l.outstanding, { full: !0 })} in moon tax`,
				children: l.payment_instructions || "Ask your corporation's leadership how to pay."
			}),
			/* @__PURE__ */ V("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ B(g, {
						label: `Mined in ${l.ledger.label}`,
						value: k(f?.value ?? 0),
						mono: !0,
						hint: `${A(f?.quantity ?? 0)} units of ore`
					}),
					/* @__PURE__ */ B(g, {
						label: `Moon tax · ${l.ledger.tax_rate}%`,
						value: k(f?.tax ?? 0),
						mono: !0,
						hint: l.ledger.closed ? f?.invoice?.paid ? "paid" : f?.invoice ? "not paid yet" : "nothing owed" : "estimate until the month is closed",
						tone: f?.invoice && !f.invoice.paid ? "warning" : void 0
					}),
					/* @__PURE__ */ B(g, {
						label: "Characters",
						value: f?.characters.length ?? 0,
						hint: "that mined this month"
					})
				]
			}),
			/* @__PURE__ */ V("div", {
				className: "grid gap-6 xl:grid-cols-[1fr_380px]",
				children: [/* @__PURE__ */ V(a, { children: [/* @__PURE__ */ B(s, { title: "By character" }), f ? /* @__PURE__ */ V(b, { children: [/* @__PURE__ */ B(v, { children: /* @__PURE__ */ V("tr", { children: [
					/* @__PURE__ */ B(w, { children: "Character" }),
					/* @__PURE__ */ B(w, {
						align: "right",
						children: "Units"
					}),
					/* @__PURE__ */ B(w, {
						align: "right",
						children: "Value"
					})
				] }) }), /* @__PURE__ */ B("tbody", { children: f.characters.map((e) => /* @__PURE__ */ V(T, { children: [
					/* @__PURE__ */ B(S, { children: e.name }),
					/* @__PURE__ */ B(S, {
						numeric: !0,
						children: A(e.quantity)
					}),
					/* @__PURE__ */ B(S, {
						numeric: !0,
						children: k(e.value)
					})
				] }, e.id)) })] }) : /* @__PURE__ */ B(u, {
					icon: /* @__PURE__ */ B(U, {}),
					title: `You didn't mine from the moons in ${l.ledger.label}`
				})] }), /* @__PURE__ */ V(a, {
					className: "h-fit",
					children: [/* @__PURE__ */ B(s, { title: "Moon tax history" }), l.invoices.length === 0 ? /* @__PURE__ */ B(o, {
						className: "text-sm text-muted",
						children: "Nothing billed yet."
					}) : /* @__PURE__ */ B("ul", {
						className: "divide-y divide-border",
						children: l.invoices.map((e) => /* @__PURE__ */ V("li", {
							className: "flex items-center justify-between gap-3 px-card py-3 text-sm",
							children: [/* @__PURE__ */ B("span", { children: e.label }), /* @__PURE__ */ V("span", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ B("span", {
									className: "font-mono tabular-nums",
									children: k(e.amount)
								}), /* @__PURE__ */ B(n, {
									tone: e.paid ? "success" : "warning",
									children: e.paid ? "Paid" : "Unpaid"
								})]
							})]
						}, e.id))
					})]
				})]
			})
		]
	})] });
}
function ce() {
	return M("moons.view_ledger") ? /* @__PURE__ */ B(re, {}) : /* @__PURE__ */ B($, {});
}
function le() {
	let { data: e, isLoading: t } = Q("");
	if (t) return /* @__PURE__ */ B(h, { className: "h-16" });
	if (!e) return null;
	let r = e.ledger.members[0];
	return /* @__PURE__ */ B(R, {
		to: "/p/moons/me",
		className: "block",
		children: /* @__PURE__ */ V("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ V("div", { children: [
				/* @__PURE__ */ V("div", {
					className: "text-xs text-muted",
					children: ["Mined in ", e.ledger.label]
				}),
				/* @__PURE__ */ B("div", {
					className: "mt-1 font-mono text-2xl font-semibold tabular-nums",
					children: k(r?.value ?? 0)
				}),
				/* @__PURE__ */ V("div", {
					className: "text-xs text-subtle",
					children: [
						"≈ ",
						k(r?.tax ?? 0),
						" moon tax at ",
						e.ledger.tax_rate,
						"%"
					]
				})
			] }), e.outstanding > 0 ? /* @__PURE__ */ V(n, {
				tone: "warning",
				children: [k(e.outstanding), " owed"]
			}) : /* @__PURE__ */ B(n, {
				tone: "success",
				children: "All paid"
			})]
		})
	});
}
var ue = O({
	routes: [{
		path: "",
		Component: ce
	}, {
		path: "me",
		Component: $
	}],
	widgets: [{
		id: "my-mining",
		title: "Moon mining",
		Component: le,
		size: "sm",
		order: 40
	}]
});
//#endregion
export { ue as default };

export const classes = ["!data","!o","---","--------------------------------------------------------------------------","--------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------","@conduit/sdk","@tanstack/react-query","a","accountant","action","actions","align","all","alt","amount","and","are","aria-label","as","at","available_corporations","back","be","been","bg-bg/40","billed","block","boolean","border","border-border","but","by","can","canManage","canView","can_close","character","characters","charging","checked","children","className","close","closed","closed_at","closing","confirmLabel","const","corporation","corporations","count","current","currentColor","cursor-pointer","cx","cy","danger","dashboard","data","date","day","default","description","didn","director","disabled","divide-border","divide-y","drills","each","else","enabled","estimate","export","eyebrow","false","far","few","fill","fixed","fixes","flex","flex-wrap","font-medium","font-mono","font-semibold","footer","for","form","format","from","full","function","gap-2","gap-2.5","gap-3","gap-4","gap-6","get","ghost","go","grid","h-16","h-28","h-40","h-48","h-fit","has","have","height","here","hint","history","how","href","icon","icons","id","if","import","in","info","inline","inline-flex","interactive","interface","invoice","invoices","is","isLoading","it","items","items-center","items-end","justify-between","keep","keeps","key","label","lazy","leadership","ledger","length","lg","loading","login","m16.71","m7","m9","manage_ledger","max","mb-1","mb-3","me","means","member","members","min","min-w-0","mine","mined","miners","mining","mono","month","monthly","months","moon","moons","mt-1","mutationFn","my-mining","n","name","new","nobody","none","not","nothing","now","number","numeric","observer_id","of","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpenChange","onPaid","onReopen","onSuccess","once","open","options","or","order","ore","ores","outstanding","over","owe","owed","own","p","paid","paid_at","patch","path","pay","payment_instructions","per","pills","pl-16","placeholder","portrait","post","price","prices","primary","put","px-3","px-card","py-2.5","py-3","qc","quantity","queryFn","queryKey","rate","react","react-router","reason","refresh","registered","reopen","reopened","rest","return","right","rotate-90","round","rounded","rounded-lg","routes","rows","rx","ry","s","save","sent","series","set","setConfirm","setForm","setMonth","setOpen","setSettingsOpen","settings","shows","site","size","size-4","size-6","sm","sm:grid-cols-2","sm:grid-cols-3","sm:grid-cols-4","so","space-y-4","space-y-5","space-y-6","src","step","still","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","synced","t","tabular-nums","tax","tax_rate","tells","text-2xl","text-[13px]","text-muted","text-sm","text-subtle","text-xs","that","the","them","they","this","ticked","ticker","title","to","today","toggle","told","tone","totals","transition-transform","true","truncate","type","type_id","undefined","units","unregistered_value","until","up","use","useQueryClient","useState","used","user_id","value","values","variant","viewBox","view_ledger","void","w-32","w-56","warning","were","what","while","widget","widgets","width","with","without","won","worth","x","xl:grid-cols-4","xl:grid-cols-[1fr_380px]","yet","you","your"];
