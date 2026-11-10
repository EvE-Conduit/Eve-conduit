import { Alert as e, Avatar as t, Badge as n, BarChart as r, Button as i, Card as a, CardBody as o, CardHeader as s, ConfirmDialog as c, Dialog as l, EmptyState as u, Field as d, Input as f, PageHeader as p, Select as m, Skeleton as h, StatCard as g, Switch as _, THead as v, TabPanel as y, Table as b, Tabs as ee, Td as x, Textarea as S, Th as C, Tr as w, api as T, date as E, definePlugin as D, isk as O, num as k, toast as A, useHasPerm as j } from "@conduit/sdk";
import { useMutation as M, useQuery as N, useQueryClient as P } from "@tanstack/react-query";
import { Fragment as F, useState as I } from "react";
import { Link as L } from "react-router";
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
		/* @__PURE__ */ z("path", { d: "M14.531 12.469 6.619 20.38a1 1 0 1 1-3-3l7.912-7.912" }),
		/* @__PURE__ */ z("path", { d: "M15.686 4.314A12.5 12.5 0 0 0 5.461 2.958 1 1 0 0 0 5.58 4.71a22 22 0 0 1 6.318 3.393" }),
		/* @__PURE__ */ z("path", { d: "M17.7 3.7a1 1 0 0 0-1.4 0l-4.6 4.6a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4z" }),
		/* @__PURE__ */ z("path", { d: "M19.686 8.314a12.5 12.5 0 0 1 1.356 10.225 1 1 0 0 1-1.751-.119 22 22 0 0 0-3.393-6.319" })
	]
}), te = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M12 15V3" }),
		/* @__PURE__ */ z("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ z("path", { d: "m7 10 5 5 5-5" })
	]
}), ne = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M20 7h-9" }),
		/* @__PURE__ */ z("path", { d: "M14 17H5" }),
		/* @__PURE__ */ z("circle", {
			cx: "17",
			cy: "17",
			r: "3"
		}),
		/* @__PURE__ */ z("circle", {
			cx: "7",
			cy: "7",
			r: "3"
		})
	]
}), U = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("rect", {
		width: "18",
		height: "11",
		x: "3",
		y: "11",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ z("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })]
}), W = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("rect", {
		width: "18",
		height: "11",
		x: "3",
		y: "11",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ z("path", { d: "M7 11V7a5 5 0 0 1 9.9-1" })]
}), G = ({ open: e, className: t = "size-4" }) => /* @__PURE__ */ z(V, {
	className: `${t} transition-transform ${e ? "rotate-90" : ""}`,
	children: /* @__PURE__ */ z("path", { d: "m9 18 6-6-6-6" })
}), K = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("circle", {
			cx: "8",
			cy: "8",
			r: "6"
		}),
		/* @__PURE__ */ z("path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18" }),
		/* @__PURE__ */ z("path", { d: "M7 6h1v4" }),
		/* @__PURE__ */ z("path", { d: "m16.71 13.88.7.71-2.82 2.82" })
	]
}), re = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ z("circle", {
		cx: "12",
		cy: "7",
		r: "4"
	})]
}), q = "/api/p/moons";
function J() {
	return N({
		queryKey: ["moons", "months"],
		queryFn: () => T.get(`${q}/months`)
	});
}
function Y({ value: e, onChange: t }) {
	let { data: n } = J(), r = (n?.months ?? [{
		month: e,
		label: e,
		closed: !1
	}]).map((e) => ({
		value: e.month,
		label: `${e.label}${e.closed ? " · closed" : e.month === n?.current ? " · so far" : ""}`
	}));
	return /* @__PURE__ */ z(m, {
		value: e,
		onChange: (e) => t(e.target.value),
		options: r,
		"aria-label": "Month",
		className: "w-56"
	});
}
function X() {
	let { data: e } = J(), [t, n] = I(null);
	return [t ?? e?.current ?? "", n];
}
function Z() {
	let t = P(), n = j("moons.manage_ledger"), [l, d] = X(), [f, m] = I(!1), [_, S] = I(null), D = [
		"moons",
		"ledger",
		l
	], { data: F, isLoading: V } = N({
		queryKey: D,
		queryFn: () => T.get(`${q}/ledger?month=${l}`),
		enabled: !!l
	}), G = (e) => {
		t.setQueryData(D, e), t.invalidateQueries({ queryKey: ["moons", "months"] });
	}, K = M({
		mutationFn: () => T.post(`${q}/months/${l}/close`),
		onSuccess: (e) => {
			G(e), A.success(`${e.label} closed; members have been told what they owe`);
		},
		onError: (e) => A.error(e.message)
	}), J = M({
		mutationFn: () => T.post(`${q}/months/${l}/reopen`),
		onSuccess: (e) => {
			G(e), A.success(`${e.label} reopened`);
		},
		onError: (e) => A.error(e.message)
	}), Z = M({
		mutationFn: ({ id: e, paid: t }) => T.post(`${q}/invoices/${e}`, { paid: t }),
		onSuccess: () => t.invalidateQueries({ queryKey: D }),
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ z(p, {
			eyebrow: "Moon mining",
			title: "Ledger",
			icon: /* @__PURE__ */ z(H, {}),
			description: "Who mined what from your moons, what it's worth and the moon tax each member owes.",
			actions: /* @__PURE__ */ B("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ z(Y, {
						value: l,
						onChange: d
					}),
					/* @__PURE__ */ z(L, {
						to: "/p/moons/me",
						children: /* @__PURE__ */ B(i, {
							variant: "ghost",
							children: [/* @__PURE__ */ z(re, {}), " Mine"]
						})
					}),
					/* @__PURE__ */ z("a", {
						href: `${q}/ledger.csv?month=${l}`,
						download: !0,
						children: /* @__PURE__ */ B(i, {
							variant: "ghost",
							children: [/* @__PURE__ */ z(te, {}), " CSV"]
						})
					}),
					n && /* @__PURE__ */ B(i, {
						onClick: () => m(!0),
						children: [/* @__PURE__ */ z(ne, {}), " Settings"]
					})
				]
			})
		}),
		V || !F ? /* @__PURE__ */ z("div", {
			className: "grid gap-4 sm:grid-cols-4",
			children: [
				0,
				1,
				2,
				3
			].map((e) => /* @__PURE__ */ z(h, { className: "h-28" }, e))
		}) : /* @__PURE__ */ B("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ z(ie, {
					data: F,
					canManage: n,
					onClose: () => S("close"),
					onReopen: () => S("reopen")
				}),
				/* @__PURE__ */ B("div", {
					className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
					children: [
						/* @__PURE__ */ z(g, {
							label: "Mined",
							value: O(F.totals.value),
							mono: !0,
							hint: `${k(F.totals.quantity)} units of ore`
						}),
						/* @__PURE__ */ z(g, {
							label: `Moon tax · ${F.tax_rate}%`,
							value: O(F.totals.tax),
							mono: !0,
							hint: `${F.totals.members} member${F.totals.members === 1 ? "" : "s"}`
						}),
						/* @__PURE__ */ z(g, {
							label: "Paid",
							value: F.closed ? O(F.totals.paid) : "—",
							mono: !0,
							tone: F.closed && F.totals.paid >= F.totals.tax ? "success" : void 0,
							hint: F.closed ? `${Math.round(F.totals.paid / Math.max(F.totals.tax, 1) * 100)}% of the tax` : "once the month is closed"
						}),
						/* @__PURE__ */ z(g, {
							label: "Unregistered miners",
							value: O(F.totals.unregistered_value),
							mono: !0,
							tone: F.totals.unregistered_value > 0 ? "warning" : void 0,
							hint: "by characters nobody registered"
						})
					]
				}),
				!!F.removed_characters?.length && /* @__PURE__ */ B(e, {
					tone: "warning",
					title: "Characters that mined were taken off their accounts",
					children: [
						"Their tax is on nobody's bill",
						F.closed ? "" : " when this month is closed",
						". Settle it with whoever had them:",
						/* @__PURE__ */ z("ul", {
							className: "mt-1 list-disc pl-5",
							children: F.removed_characters.map((e) => /* @__PURE__ */ B("li", { children: [
								/* @__PURE__ */ z("span", {
									className: "font-medium",
									children: e.name
								}),
								": mined ",
								O(e.value),
								"; ",
								e.sold ? "sold and removed" : "removed",
								" ",
								E(e.removed_at),
								e.previous_owner ? /* @__PURE__ */ B(R, { children: [
									" from ",
									/* @__PURE__ */ z("span", {
										className: "font-medium",
										children: e.previous_owner.name
									}),
									"'s account"
								] }) : null
							] }, e.character_id))
						})
					]
				}),
				/* @__PURE__ */ B(a, { children: [/* @__PURE__ */ z(s, {
					title: "Mined per day",
					description: `Value of the ore mined each day in ${F.label}`
				}), /* @__PURE__ */ z(o, { children: F.series.some((e) => e.value > 0) ? /* @__PURE__ */ z(r, {
					data: F.series,
					format: (e) => O(e),
					label: "Mined"
				}) : /* @__PURE__ */ z("p", {
					className: "text-sm text-muted",
					children: "Nothing mined yet this month."
				}) })] }),
				/* @__PURE__ */ B(ee, {
					variant: "pills",
					className: "space-y-4",
					items: [
						{
							value: "members",
							label: "Members",
							count: F.members.length
						},
						{
							value: "moons",
							label: "Moons",
							count: F.moons.length
						},
						{
							value: "ores",
							label: "Ores",
							count: F.ores.length
						}
					],
					children: [
						/* @__PURE__ */ z(y, {
							value: "members",
							children: /* @__PURE__ */ z(ae, {
								data: F,
								canManage: n,
								onPaid: (e, t) => Z.mutate({
									id: e,
									paid: t
								})
							})
						}),
						/* @__PURE__ */ z(y, {
							value: "moons",
							children: /* @__PURE__ */ z(a, { children: F.moons.length === 0 ? /* @__PURE__ */ z(u, {
								icon: /* @__PURE__ */ z(H, {}),
								title: "No moon drills mined this month"
							}) : /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
								/* @__PURE__ */ z(C, { children: "Refinery" }),
								/* @__PURE__ */ z(C, { children: "Moon" }),
								/* @__PURE__ */ z(C, {
									align: "right",
									children: "Miners"
								}),
								/* @__PURE__ */ z(C, {
									align: "right",
									children: "Units"
								}),
								/* @__PURE__ */ z(C, {
									align: "right",
									children: "Value"
								})
							] }) }), /* @__PURE__ */ z("tbody", { children: F.moons.map((e) => /* @__PURE__ */ B(w, { children: [
								/* @__PURE__ */ z(x, { children: e.name }),
								/* @__PURE__ */ z(x, {
									className: "text-muted",
									children: e.moon || "—"
								}),
								/* @__PURE__ */ z(x, {
									numeric: !0,
									children: e.miners
								}),
								/* @__PURE__ */ z(x, {
									numeric: !0,
									children: k(e.quantity)
								}),
								/* @__PURE__ */ z(x, {
									numeric: !0,
									children: O(e.value)
								})
							] }, e.observer_id)) })] }) })
						}),
						/* @__PURE__ */ z(y, {
							value: "ores",
							children: /* @__PURE__ */ z(oe, {
								ores: F.ores,
								closed: F.closed
							})
						})
					]
				})
			]
		}),
		f && /* @__PURE__ */ z(se, { onClose: () => m(!1) }),
		/* @__PURE__ */ z(c, {
			open: _ === "close",
			onOpenChange: (e) => !e && S(null),
			title: `Close ${F?.label ?? "this month"}?`,
			description: `Ore prices and the ${F?.tax_rate ?? ""}% tax rate are fixed as they are now, and each member is told what they owe. You can reopen it while nobody has paid.`,
			confirmLabel: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(U, {}), " Close month"] }),
			onConfirm: () => K.mutateAsync()
		}),
		/* @__PURE__ */ z(c, {
			open: _ === "reopen",
			onOpenChange: (e) => !e && S(null),
			title: `Reopen ${F?.label ?? "this month"}?`,
			description: "What members owe for the month is deleted, and values go back to today's prices until you close it again.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(W, {}), " Reopen"] }),
			onConfirm: () => J.mutateAsync()
		})
	] });
}
function ie({ data: t, canManage: n, onClose: r, onReopen: a }) {
	return t.closed ? /* @__PURE__ */ B(e, {
		tone: "success",
		title: `${t.label} is closed`,
		action: n ? /* @__PURE__ */ B(i, {
			size: "sm",
			variant: "ghost",
			onClick: a,
			children: [/* @__PURE__ */ z(W, {}), " Reopen"]
		}) : void 0,
		children: [
			"Closed ",
			t.closed_at ? E(t.closed_at) : "",
			". Values use the ore prices of that day and won't change."
		]
	}) : t.can_close ? /* @__PURE__ */ z(e, {
		tone: "warning",
		title: `${t.label} is over and still open`,
		action: n ? /* @__PURE__ */ B(i, {
			size: "sm",
			variant: "primary",
			onClick: r,
			children: [/* @__PURE__ */ z(U, {}), " Close month"]
		}) : void 0,
		children: "Values use today's ore prices until the month is closed. Closing fixes them and tells members what they owe."
	}) : /* @__PURE__ */ z(e, {
		tone: "info",
		title: `${t.label} so far`,
		children: "Values use today's ore prices. Once the month is over it can be closed and members are told what they owe."
	});
}
function ae({ data: e, canManage: r, onPaid: i }) {
	let [o, s] = I(/* @__PURE__ */ new Set()), c = (e) => s((t) => {
		let n = new Set(t);
		return n.has(e) ? n.delete(e) : n.add(e), n;
	});
	return e.members.length === 0 ? /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(u, {
		icon: /* @__PURE__ */ z(H, {}),
		title: `Nobody mined from your moons in ${e.label}`,
		description: "Mining shows up once a director or accountant's login has synced the corporation's moon drills."
	}) }) : /* @__PURE__ */ z(a, { children: /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(C, { children: "Member" }),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: "Units"
		}),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: "Value"
		}),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: "Tax"
		}),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: e.closed ? "Paid" : ""
		})
	] }) }), /* @__PURE__ */ z("tbody", { children: e.members.map((e) => /* @__PURE__ */ B(F, { children: [/* @__PURE__ */ B(w, {
		interactive: !0,
		onClick: () => c(e.key),
		children: [
			/* @__PURE__ */ z(x, { children: /* @__PURE__ */ B("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ z(G, {
						open: o.has(e.key),
						className: "size-4 text-subtle"
					}),
					/* @__PURE__ */ z(t, {
						src: e.portrait,
						name: e.name,
						size: "sm"
					}),
					/* @__PURE__ */ B("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ B("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ z("span", {
									className: "truncate font-medium",
									children: e.name
								}),
								!e.registered && /* @__PURE__ */ z(n, {
									tone: "warning",
									children: "not registered"
								}),
								e.partial && /* @__PURE__ */ z("span", {
									title: "Also mined in corporations whose mining you can't see; the bill covers those too, so it isn't shown",
									children: /* @__PURE__ */ z(n, {
										tone: "info",
										children: "part only"
									})
								})
							]
						}), /* @__PURE__ */ B("div", {
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
			/* @__PURE__ */ z(x, {
				numeric: !0,
				children: k(e.quantity)
			}),
			/* @__PURE__ */ z(x, {
				numeric: !0,
				children: O(e.value)
			}),
			/* @__PURE__ */ z(x, {
				numeric: !0,
				className: e.registered ? "" : "text-subtle",
				children: e.registered ? O(e.tax) : "—"
			}),
			/* @__PURE__ */ z(x, {
				align: "right",
				onClick: (e) => e.stopPropagation(),
				children: e.invoice ? r ? /* @__PURE__ */ B("label", {
					className: "inline-flex items-center gap-2 text-xs text-muted",
					children: [e.invoice.paid ? "Paid" : "Unpaid", /* @__PURE__ */ z(_, {
						checked: e.invoice.paid,
						onCheckedChange: (t) => i(e.invoice.id, t),
						"aria-label": `${e.name} has paid`
					})]
				}) : /* @__PURE__ */ z(n, {
					tone: e.invoice.paid ? "success" : "warning",
					children: e.invoice.paid ? "Paid" : "Unpaid"
				}) : null
			})
		]
	}), o.has(e.key) && e.characters.map((t) => /* @__PURE__ */ B(w, {
		className: "bg-bg/40",
		children: [
			/* @__PURE__ */ z(x, {
				className: "pl-16 text-muted",
				children: t.name
			}),
			/* @__PURE__ */ z(x, {
				numeric: !0,
				className: "text-muted",
				children: k(t.quantity)
			}),
			/* @__PURE__ */ z(x, {
				numeric: !0,
				className: "text-muted",
				children: O(t.value)
			}),
			/* @__PURE__ */ z(x, {}),
			/* @__PURE__ */ z(x, {})
		]
	}, `${e.key}-${t.id}`))] }, e.key)) })] }) });
}
function oe({ ores: e, closed: t }) {
	return e.length === 0 ? /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(u, {
		icon: /* @__PURE__ */ z(H, {}),
		title: "No ore mined this month"
	}) }) : /* @__PURE__ */ z(a, { children: /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(C, { children: "Ore" }),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: t ? "Price at closing" : "Price now"
		}),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: "Units"
		}),
		/* @__PURE__ */ z(C, {
			align: "right",
			children: "Value"
		})
	] }) }), /* @__PURE__ */ z("tbody", { children: e.map((e) => /* @__PURE__ */ B(w, { children: [
		/* @__PURE__ */ z(x, { children: /* @__PURE__ */ B("div", {
			className: "flex items-center gap-2.5",
			children: [/* @__PURE__ */ z("img", {
				src: e.icon,
				alt: "",
				className: "size-6 rounded",
				loading: "lazy"
			}), e.name]
		}) }),
		/* @__PURE__ */ z(x, {
			numeric: !0,
			className: "text-muted",
			children: O(e.price, { full: !0 })
		}),
		/* @__PURE__ */ z(x, {
			numeric: !0,
			children: k(e.quantity)
		}),
		/* @__PURE__ */ z(x, {
			numeric: !0,
			children: O(e.value)
		})
	] }, e.type_id)) })] }) });
}
function se({ onClose: e }) {
	let t = P(), { data: n } = N({
		queryKey: ["moons", "settings"],
		queryFn: () => T.get(`${q}/settings`)
	}), [r, a] = I(null), o = r ?? n ?? null, s = M({
		mutationFn: (e) => T.put(`${q}/settings`, e),
		onSuccess: (n) => {
			t.setQueryData(["moons", "settings"], n), t.invalidateQueries({ queryKey: ["moons"] }), A.success("Saved"), e();
		},
		onError: (e) => A.error(e.message)
	}), c = (e) => o && a({
		...o,
		...e
	});
	return /* @__PURE__ */ z(l, {
		open: !0,
		onOpenChange: (t) => !t && e(),
		title: "Moon tax settings",
		description: "Apply to open months. Closed months keep the rate they were closed with.",
		size: "lg",
		footer: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(i, {
			variant: "ghost",
			onClick: e,
			children: "Cancel"
		}), /* @__PURE__ */ z(i, {
			variant: "primary",
			disabled: !o,
			loading: s.isPending,
			onClick: () => o && s.mutate(o),
			children: "Save"
		})] }),
		children: o ? /* @__PURE__ */ B("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ z(d, {
					label: "Moon tax (% of the ore's value)",
					hint: "0 keeps the ledger without charging anything.",
					children: /* @__PURE__ */ z("div", { children: /* @__PURE__ */ z(f, {
						type: "number",
						min: 0,
						max: 100,
						step: .5,
						value: o.tax_rate,
						onChange: (e) => c({ tax_rate: Number(e.target.value) }),
						className: "w-32 font-mono"
					}) })
				}),
				/* @__PURE__ */ z(d, {
					label: "How to pay",
					hint: "Shown to members with what they owe, and sent with the monthly notification.",
					children: /* @__PURE__ */ z(S, {
						rows: 3,
						value: o.payment_instructions,
						placeholder: "Give the ISK to Moon Holdings Corp with the reason MOON.",
						onChange: (e) => c({ payment_instructions: e.target.value })
					})
				}),
				/* @__PURE__ */ B("div", { children: [
					/* @__PURE__ */ z("div", {
						className: "mb-1 text-[13px] font-medium",
						children: "Corporations"
					}),
					/* @__PURE__ */ z("p", {
						className: "mb-3 text-xs text-muted",
						children: "Whose moon drills count. None ticked means all of them."
					}),
					o.available_corporations.length === 0 ? /* @__PURE__ */ z("p", {
						className: "text-sm text-subtle",
						children: "No corporation has synced moon mining yet."
					}) : /* @__PURE__ */ z("div", {
						className: "divide-y divide-border rounded-lg border border-border",
						children: o.available_corporations.map((e) => /* @__PURE__ */ B("label", {
							className: "flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm",
							children: [/* @__PURE__ */ B("span", { children: [
								e.name,
								" ",
								/* @__PURE__ */ B("span", {
									className: "text-subtle",
									children: [
										"[",
										e.ticker,
										"]"
									]
								})
							] }), /* @__PURE__ */ z(_, {
								checked: o.corporations.includes(e.id),
								onCheckedChange: (t) => c({ corporations: t ? [...o.corporations, e.id] : o.corporations.filter((t) => t !== e.id) })
							})]
						}, e.id))
					})
				] })
			]
		}) : /* @__PURE__ */ z(h, { className: "h-40" })
	});
}
function Q(e) {
	return N({
		queryKey: [
			"moons",
			"me",
			e
		],
		queryFn: () => T.get(`${q}/me?month=${e}`),
		enabled: e !== void 0
	});
}
function $() {
	let t = j("moons.view_ledger"), [r, c] = X(), { data: l, isLoading: d } = Q(r), f = l?.ledger.members[0];
	return /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(p, {
		eyebrow: "Moon mining",
		title: "My moon mining",
		icon: /* @__PURE__ */ z(H, {}),
		description: "What your characters mined from the corporation's moons, and the moon tax for it.",
		actions: /* @__PURE__ */ B("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ z(Y, {
				value: r,
				onChange: c
			}), t && /* @__PURE__ */ z(L, {
				to: "/p/moons",
				children: /* @__PURE__ */ z(i, {
					variant: "ghost",
					children: "Full ledger"
				})
			})]
		})
	}), d || !l ? /* @__PURE__ */ z(h, { className: "h-48" }) : /* @__PURE__ */ B("div", {
		className: "space-y-6",
		children: [
			l.outstanding > 0 && /* @__PURE__ */ z(e, {
				tone: "warning",
				icon: /* @__PURE__ */ z(K, {}),
				title: `You owe ${O(l.outstanding, { full: !0 })} in moon tax`,
				children: l.payment_instructions || "Ask your corporation's leadership how to pay."
			}),
			/* @__PURE__ */ B("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ z(g, {
						label: `Mined in ${l.ledger.label}`,
						value: O(f?.value ?? 0),
						mono: !0,
						hint: `${k(f?.quantity ?? 0)} units of ore`
					}),
					/* @__PURE__ */ z(g, {
						label: `Moon tax · ${l.ledger.tax_rate}%`,
						value: O(f?.tax ?? 0),
						mono: !0,
						hint: l.ledger.closed ? f?.invoice?.paid ? "paid" : f?.invoice ? "not paid yet" : "nothing owed" : "estimate until the month is closed",
						tone: f?.invoice && !f.invoice.paid ? "warning" : void 0
					}),
					/* @__PURE__ */ z(g, {
						label: "Characters",
						value: f?.characters.length ?? 0,
						hint: "that mined this month"
					})
				]
			}),
			/* @__PURE__ */ B("div", {
				className: "grid gap-6 xl:grid-cols-[1fr_380px]",
				children: [/* @__PURE__ */ B(a, { children: [/* @__PURE__ */ z(s, { title: "By character" }), f ? /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
					/* @__PURE__ */ z(C, { children: "Character" }),
					/* @__PURE__ */ z(C, {
						align: "right",
						children: "Units"
					}),
					/* @__PURE__ */ z(C, {
						align: "right",
						children: "Value"
					})
				] }) }), /* @__PURE__ */ z("tbody", { children: f.characters.map((e) => /* @__PURE__ */ B(w, { children: [
					/* @__PURE__ */ z(x, { children: e.name }),
					/* @__PURE__ */ z(x, {
						numeric: !0,
						children: k(e.quantity)
					}),
					/* @__PURE__ */ z(x, {
						numeric: !0,
						children: O(e.value)
					})
				] }, e.id)) })] }) : /* @__PURE__ */ z(u, {
					icon: /* @__PURE__ */ z(H, {}),
					title: `You didn't mine from the moons in ${l.ledger.label}`
				})] }), /* @__PURE__ */ B(a, {
					className: "h-fit",
					children: [/* @__PURE__ */ z(s, { title: "Moon tax history" }), l.invoices.length === 0 ? /* @__PURE__ */ z(o, {
						className: "text-sm text-muted",
						children: "Nothing billed yet."
					}) : /* @__PURE__ */ z("ul", {
						className: "divide-y divide-border",
						children: l.invoices.map((e) => /* @__PURE__ */ B("li", {
							className: "flex items-center justify-between gap-3 px-card py-3 text-sm",
							children: [/* @__PURE__ */ z("span", { children: e.label }), /* @__PURE__ */ B("span", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ z("span", {
									className: "font-mono tabular-nums",
									children: O(e.amount)
								}), /* @__PURE__ */ z(n, {
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
	return j("moons.view_ledger") ? /* @__PURE__ */ z(Z, {}) : /* @__PURE__ */ z($, {});
}
function le() {
	let { data: e, isLoading: t } = Q("");
	if (t) return /* @__PURE__ */ z(h, { className: "h-16" });
	if (!e) return null;
	let r = e.ledger.members[0];
	return /* @__PURE__ */ z(L, {
		to: "/p/moons/me",
		className: "block",
		children: /* @__PURE__ */ B("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ B("div", { children: [
				/* @__PURE__ */ B("div", {
					className: "text-xs text-muted",
					children: ["Mined in ", e.ledger.label]
				}),
				/* @__PURE__ */ z("div", {
					className: "mt-1 font-mono text-2xl font-semibold tabular-nums",
					children: O(r?.value ?? 0)
				}),
				/* @__PURE__ */ B("div", {
					className: "text-xs text-subtle",
					children: [
						"≈ ",
						O(r?.tax ?? 0),
						" moon tax at ",
						e.ledger.tax_rate,
						"%"
					]
				})
			] }), e.outstanding > 0 ? /* @__PURE__ */ B(n, {
				tone: "warning",
				children: [O(e.outstanding), " owed"]
			}) : /* @__PURE__ */ z(n, {
				tone: "success",
				children: "All paid"
			})]
		})
	});
}
var ue = D({
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

export const classes = ["!data","!o","---","--------------------------------------------------------------------------","--------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------","@conduit/sdk","@tanstack/react-query","a","account","accountant","accounts","action","actions","align","all","alt","amount","and","are","aria-label","as","at","available_corporations","back","be","been","bg-bg/40","bill","billed","block","boolean","border","border-border","but","by","can","canManage","canView","can_close","character","character_id","characters","charging","checked","children","className","close","closed","closed_at","closing","confirmLabel","const","corporation","corporations","count","covers","current","currentColor","cursor-pointer","cx","cy","danger","dashboard","data","date","day","default","description","didn","director","disabled","divide-border","divide-y","drills","each","else","enabled","estimate","export","eyebrow","false","far","few","figures","fill","fixed","fixes","flex","flex-wrap","font-medium","font-mono","font-semibold","footer","for","form","format","from","full","function","gap-2","gap-2.5","gap-3","gap-4","gap-6","get","ghost","go","grid","h-16","h-28","h-40","h-48","h-fit","had","has","have","height","here","hint","history","how","href","icon","icons","id","if","import","in","info","inline","inline-flex","interactive","interface","invoice","invoices","is","isLoading","isn","it","items","items-center","items-end","justify-between","keep","keeps","key","label","lazy","leadership","ledger","length","lg","list-disc","loading","login","m16.71","m7","m9","manage_ledger","max","mb-1","mb-3","me","means","member","members","min","min-w-0","mine","mined","miners","mining","mono","month","monthly","months","moon","moons","mt-1","mutationFn","my-mining","n","name","new","nobody","none","not","nothing","now","number","numeric","observer_id","of","off","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpenChange","onPaid","onReopen","onSuccess","once","ones","only","open","options","or","order","ore","ores","outstanding","over","owe","owed","own","p","paid","paid_at","part","partial","patch","path","pay","payment_instructions","per","pills","pl-16","pl-5","placeholder","portrait","post","previous_owner","price","prices","primary","put","px-3","px-card","py-2.5","py-3","qc","quantity","queryFn","queryKey","rate","react","react-router","reason","refresh","registered","removed","removed_at","reopen","reopened","rest","return","right","rotate-90","round","rounded","rounded-lg","routes","rows","rx","ry","s","save","see","sent","series","set","setConfirm","setForm","setMonth","setOpen","setSettingsOpen","settings","shown","shows","since","site","size","size-4","size-6","sm","sm:grid-cols-2","sm:grid-cols-3","sm:grid-cols-4","so","sold","space-y-4","space-y-5","space-y-6","src","step","still","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","synced","t","tabular-nums","taken","tax","tax_rate","tells","text-2xl","text-[13px]","text-muted","text-sm","text-subtle","text-xs","that","the","their","them","they","this","those","ticked","ticker","title","to","today","toggle","told","tone","totals","transition-transform","true","truncate","type","type_id","undefined","units","unregistered_value","until","up","use","useQueryClient","useState","used","user_id","value","values","variant","viewBox","view_ledger","viewer","void","w-32","w-56","warning","was","were","what","when","while","whoever","whose","widget","widgets","width","with","without","won","worth","x","xl:grid-cols-4","xl:grid-cols-[1fr_380px]","yet","you","your"];
