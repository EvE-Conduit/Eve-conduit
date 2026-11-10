import { Alert as e, Avatar as t, Badge as n, BarChart as r, Button as i, Card as a, CardBody as o, CardHeader as s, ConfirmDialog as c, Dialog as l, EmptyState as u, Field as d, Input as f, PageHeader as p, Select as m, Skeleton as h, StatCard as g, Switch as _, THead as v, TabPanel as y, Table as b, Tabs as x, Td as S, Textarea as C, Th as w, Tr as T, api as E, date as D, definePlugin as O, isk as k, toast as A, useHasPerm as j } from "@conduit/sdk";
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
		/* @__PURE__ */ z("path", { d: "M10 18v-7" }),
		/* @__PURE__ */ z("path", { d: "M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" }),
		/* @__PURE__ */ z("path", { d: "M14 18v-7" }),
		/* @__PURE__ */ z("path", { d: "M18 18v-7" }),
		/* @__PURE__ */ z("path", { d: "M3 22h18" }),
		/* @__PURE__ */ z("path", { d: "M6 18v-7" })
	]
}), ee = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M12 15V3" }),
		/* @__PURE__ */ z("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ z("path", { d: "m7 10 5 5 5-5" })
	]
}), te = (e) => /* @__PURE__ */ B(V, {
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
}), ne = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ z("circle", {
		cx: "12",
		cy: "7",
		r: "4"
	})]
}), re = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ z("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ z("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ z("path", { d: "M8 16H3v5" })
	]
}), q = "/api/p/tax";
function J() {
	return N({
		queryKey: ["tax", "months"],
		queryFn: () => E.get(`${q}/months`)
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
	let t = P(), n = j("tax.manage_ledger"), [l, d] = X(), [f, m] = I(!1), [_, C] = I(null), O = [
		"tax",
		"ledger",
		l
	], { data: F, isLoading: V } = N({
		queryKey: O,
		queryFn: () => E.get(`${q}/ledger?month=${l}`),
		enabled: !!l
	}), G = (e) => {
		t.setQueryData(O, e), t.invalidateQueries({ queryKey: ["tax", "months"] });
	}, K = M({
		mutationFn: () => E.post(`${q}/months/${l}/close`),
		onSuccess: (e) => {
			G(e), A.success(`${e.label} closed; members have been told what they owe`);
		},
		onError: (e) => A.error(e.message)
	}), J = M({
		mutationFn: () => E.post(`${q}/months/${l}/reopen`),
		onSuccess: (e) => {
			G(e), A.success(`${e.label} reopened`);
		},
		onError: (e) => A.error(e.message)
	}), Z = M({
		mutationFn: ({ id: e, paid: t }) => E.post(`${q}/invoices/${e}`, { paid: t }),
		onSuccess: () => t.invalidateQueries({ queryKey: O }),
		onError: (e) => A.error(e.message)
	}), Q = M({
		mutationFn: () => E.post(`${q}/payments/match`),
		onSuccess: (e) => {
			t.invalidateQueries({ queryKey: ["tax"] }), A.success(e.found ? `Found payments from ${e.found} member${e.found === 1 ? "" : "s"}` : "No new payments");
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ z(p, {
			eyebrow: "Corp tax",
			title: "Ledger",
			icon: /* @__PURE__ */ z(H, {}),
			description: "The tax your corporations took from each member's bounties, ESS payouts and missions, and what they owe on top.",
			actions: /* @__PURE__ */ B("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ z(Y, {
						value: l,
						onChange: d
					}),
					/* @__PURE__ */ z(L, {
						to: "/p/tax/me",
						children: /* @__PURE__ */ B(i, {
							variant: "ghost",
							children: [/* @__PURE__ */ z(ne, {}), " Mine"]
						})
					}),
					/* @__PURE__ */ z("a", {
						href: `${q}/ledger.csv?month=${l}`,
						download: !0,
						children: /* @__PURE__ */ B(i, {
							variant: "ghost",
							children: [/* @__PURE__ */ z(ee, {}), " CSV"]
						})
					}),
					n && /* @__PURE__ */ B(i, {
						variant: "ghost",
						loading: Q.isPending,
						onClick: () => Q.mutate(),
						children: [/* @__PURE__ */ z(re, {}), " Check payments"]
					}),
					n && /* @__PURE__ */ B(i, {
						onClick: () => m(!0),
						children: [/* @__PURE__ */ z(te, {}), " Settings"]
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
					onClose: () => C("close"),
					onReopen: () => C("reopen")
				}),
				/* @__PURE__ */ B("div", {
					className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
					children: [
						/* @__PURE__ */ z(g, {
							label: "Corporation took",
							value: k(F.totals.collected),
							mono: !0,
							hint: F.totals.earned > 0 ? `of ≈ ${k(F.totals.earned)} earned` : "in-game tax"
						}),
						/* @__PURE__ */ z(g, {
							label: `Owed · ${F.rate}%`,
							value: k(F.totals.tax),
							mono: !0,
							hint: `${F.totals.members} member${F.totals.members === 1 ? "" : "s"}`
						}),
						/* @__PURE__ */ z(g, {
							label: "Paid",
							value: F.closed ? k(F.totals.paid) : "—",
							mono: !0,
							tone: F.closed && F.totals.paid >= F.totals.tax ? "success" : void 0,
							hint: F.closed ? `${Math.round(F.totals.paid / Math.max(F.totals.tax, 1) * 100)}% of what's owed` : "once the month is closed"
						}),
						/* @__PURE__ */ z(g, {
							label: "Unregistered characters",
							value: k(F.totals.unregistered_collected),
							mono: !0,
							tone: F.totals.unregistered_collected > 0 ? "warning" : void 0,
							hint: "taxed from characters nobody registered"
						})
					]
				}),
				!!F.removed_characters?.length && /* @__PURE__ */ B(e, {
					tone: "warning",
					title: "Taxed characters were taken off their accounts",
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
								": ",
								k(e.collected),
								" taken by the corporation; ",
								e.sold ? "sold and removed" : "removed",
								" ",
								D(e.removed_at),
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
					title: "Tax per day",
					description: `What the corporations took each day in ${F.label}`
				}), /* @__PURE__ */ z(o, { children: F.series.some((e) => e.value > 0) ? /* @__PURE__ */ z(r, {
					data: F.series,
					format: (e) => k(e),
					label: "Tax"
				}) : /* @__PURE__ */ z("p", {
					className: "text-sm text-muted",
					children: "No tax yet this month."
				}) })] }),
				/* @__PURE__ */ B(x, {
					variant: "pills",
					className: "space-y-4",
					items: [{
						value: "members",
						label: "Members",
						count: F.members.length
					}, {
						value: "kinds",
						label: "By kind",
						count: F.kinds.length
					}],
					children: [/* @__PURE__ */ z(y, {
						value: "members",
						children: /* @__PURE__ */ z(ae, {
							data: F,
							canManage: n,
							onPaid: (e, t) => Z.mutate({
								id: e,
								paid: t
							})
						})
					}), /* @__PURE__ */ z(y, {
						value: "kinds",
						children: /* @__PURE__ */ z(a, { children: F.kinds.length === 0 ? /* @__PURE__ */ z(u, {
							icon: /* @__PURE__ */ z(H, {}),
							title: "No tax this month"
						}) : /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [/* @__PURE__ */ z(w, { children: "Kind" }), /* @__PURE__ */ z(w, {
							align: "right",
							children: "Corporation took"
						})] }) }), /* @__PURE__ */ z("tbody", { children: F.kinds.map((e) => /* @__PURE__ */ B(T, { children: [/* @__PURE__ */ z(S, { children: e.label }), /* @__PURE__ */ z(S, {
							numeric: !0,
							children: k(e.collected)
						})] }, e.ref_type)) })] }) })
					})]
				})
			]
		}),
		f && /* @__PURE__ */ z(oe, { onClose: () => m(!1) }),
		/* @__PURE__ */ z(c, {
			open: _ === "close",
			onOpenChange: (e) => !e && C(null),
			title: `Close ${F?.label ?? "this month"}?`,
			description: `The ${F?.rate ?? ""}% rate is fixed as it is now, and each member is told what they owe. You can reopen it while nobody has paid.`,
			confirmLabel: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(U, {}), " Close month"] }),
			onConfirm: () => K.mutateAsync()
		}),
		/* @__PURE__ */ z(c, {
			open: _ === "reopen",
			onOpenChange: (e) => !e && C(null),
			title: `Reopen ${F?.label ?? "this month"}?`,
			description: "What members owe for the month is deleted until you close it again.",
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
			t.closed_at ? D(t.closed_at) : "",
			" at ",
			t.rate,
			"%."
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
		children: "Closing it fixes the rate and tells members what they owe."
	}) : /* @__PURE__ */ z(e, {
		tone: "info",
		title: `${t.label} so far`,
		children: "Once the month is over it can be closed and members are told what they owe."
	});
}
function ae({ data: e, canManage: r, onPaid: i }) {
	let [o, s] = I(/* @__PURE__ */ new Set()), c = (e) => s((t) => {
		let n = new Set(t);
		return n.has(e) ? n.delete(e) : n.add(e), n;
	});
	return e.members.length === 0 ? /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(u, {
		icon: /* @__PURE__ */ z(H, {}),
		title: `No tax in ${e.label}`,
		description: "Tax shows up once a director or accountant's login has synced the corporation's wallets."
	}) }) : /* @__PURE__ */ z(a, { children: /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
		/* @__PURE__ */ z(w, { children: "Member" }),
		/* @__PURE__ */ z(w, {
			align: "right",
			children: "Earned (est.)"
		}),
		/* @__PURE__ */ z(w, {
			align: "right",
			children: "Corporation took"
		}),
		/* @__PURE__ */ z(w, {
			align: "right",
			children: "Owed"
		}),
		/* @__PURE__ */ z(w, {
			align: "right",
			children: e.closed ? "Paid" : ""
		})
	] }) }), /* @__PURE__ */ z("tbody", { children: e.members.map((e) => /* @__PURE__ */ B(F, { children: [/* @__PURE__ */ B(T, {
		interactive: !0,
		onClick: () => c(e.key),
		children: [
			/* @__PURE__ */ z(S, { children: /* @__PURE__ */ B("div", {
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
									title: "Also taxed in corporations whose wallets you can't see; the bill covers those too, so it isn't shown",
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
			/* @__PURE__ */ z(S, {
				numeric: !0,
				className: "text-muted",
				children: e.earned > 0 ? k(e.earned) : "—"
			}),
			/* @__PURE__ */ z(S, {
				numeric: !0,
				children: k(e.collected)
			}),
			/* @__PURE__ */ z(S, {
				numeric: !0,
				className: e.registered ? "" : "text-subtle",
				children: e.registered ? k(e.tax) : "—"
			}),
			/* @__PURE__ */ z(S, {
				align: "right",
				onClick: (e) => e.stopPropagation(),
				children: e.invoice ? r ? /* @__PURE__ */ B("label", {
					className: "inline-flex items-center gap-2 text-xs text-muted",
					children: [e.invoice.paid ? e.invoice.paid_from_wallet ? "Paid (wallet)" : "Paid" : "Unpaid", /* @__PURE__ */ z(_, {
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
	}), o.has(e.key) && e.characters.map((t) => /* @__PURE__ */ B(T, {
		className: "bg-bg/40",
		children: [
			/* @__PURE__ */ z(S, {
				className: "pl-16 text-muted",
				children: t.name
			}),
			/* @__PURE__ */ z(S, {
				numeric: !0,
				className: "text-muted",
				children: t.earned > 0 ? k(t.earned) : "—"
			}),
			/* @__PURE__ */ z(S, {
				numeric: !0,
				className: "text-muted",
				children: k(t.collected)
			}),
			/* @__PURE__ */ z(S, {}),
			/* @__PURE__ */ z(S, {})
		]
	}, `${e.key}-${t.id}`))] }, e.key)) })] }) });
}
function oe({ onClose: e }) {
	let t = P(), { data: n } = N({
		queryKey: ["tax", "settings"],
		queryFn: () => E.get(`${q}/settings`)
	}), [r, a] = I(null), o = r ?? n ?? null, s = M({
		mutationFn: (e) => E.put(`${q}/settings`, e),
		onSuccess: (n) => {
			t.setQueryData(["tax", "settings"], n), t.invalidateQueries({ queryKey: ["tax"] }), A.success("Saved"), e();
		},
		onError: (e) => A.error(e.message)
	}), c = (e) => o && a({
		...o,
		...e
	});
	return /* @__PURE__ */ z(l, {
		open: !0,
		onOpenChange: (t) => !t && e(),
		title: "Corp tax settings",
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
				/* @__PURE__ */ B("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ z(d, {
						label: "Extra tax (% of what the corporation took)",
						hint: "100 means members pay the same again. 0 keeps the ledger without billing.",
						children: /* @__PURE__ */ z("div", { children: /* @__PURE__ */ z(f, {
							type: "number",
							min: 0,
							max: 1e3,
							step: 5,
							value: o.rate,
							onChange: (e) => c({ rate: Number(e.target.value) }),
							className: "w-32 font-mono"
						}) })
					}), /* @__PURE__ */ z(d, {
						label: "Smallest bill (ISK)",
						hint: "Smaller amounts aren't billed.",
						children: /* @__PURE__ */ z("div", { children: /* @__PURE__ */ z(f, {
							type: "number",
							min: 0,
							step: 1e6,
							value: o.minimum,
							onChange: (e) => c({ minimum: Number(e.target.value) }),
							className: "w-44 font-mono"
						}) })
					})]
				}),
				/* @__PURE__ */ z(d, {
					label: "How to pay",
					hint: "Shown to members with what they owe, and sent with the monthly notification.",
					children: /* @__PURE__ */ z(C, {
						rows: 3,
						value: o.payment_instructions,
						placeholder: "Give the ISK to Holding Corp with the reason on your bill.",
						onChange: (e) => c({ payment_instructions: e.target.value })
					})
				}),
				/* @__PURE__ */ B("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ z(d, {
						label: "Payment word",
						hint: "Donations to a tax corporation whose reason contains this settle bills by themselves. Empty switches it off.",
						children: /* @__PURE__ */ z("div", { children: /* @__PURE__ */ z(f, {
							value: o.payment_reason,
							maxLength: 40,
							onChange: (e) => c({ payment_reason: e.target.value }),
							className: "w-40 font-mono"
						}) })
					}), /* @__PURE__ */ z(d, {
						label: "Remind every (days)",
						hint: "Members with unpaid bills are reminded this often. 0 never.",
						children: /* @__PURE__ */ z("div", { children: /* @__PURE__ */ z(f, {
							type: "number",
							min: 0,
							max: 365,
							value: o.reminder_days,
							onChange: (e) => c({ reminder_days: Number(e.target.value) }),
							className: "w-32 font-mono"
						}) })
					})]
				}),
				/* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("div", {
					className: "mb-1 text-[13px] font-medium",
					children: "What counts"
				}), /* @__PURE__ */ z("div", {
					className: "divide-y divide-border rounded-lg border border-border",
					children: o.available_ref_types.map((e) => /* @__PURE__ */ B("label", {
						className: "flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm",
						children: [/* @__PURE__ */ z("span", { children: e.label }), /* @__PURE__ */ z(_, {
							checked: o.ref_types.includes(e.value),
							onCheckedChange: (t) => c({ ref_types: t ? [...o.ref_types, e.value] : o.ref_types.filter((t) => t !== e.value) })
						})]
					}, e.value))
				})] }),
				/* @__PURE__ */ B("div", { children: [
					/* @__PURE__ */ z("div", {
						className: "mb-1 text-[13px] font-medium",
						children: "Corporations"
					}),
					/* @__PURE__ */ z("p", {
						className: "mb-3 text-xs text-muted",
						children: "Whose wallets count. None ticked means all of them."
					}),
					o.available_corporations.length === 0 ? /* @__PURE__ */ z("p", {
						className: "text-sm text-subtle",
						children: "No corporation has synced its wallets yet."
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
			"tax",
			"me",
			e
		],
		queryFn: () => E.get(`${q}/me?month=${e}`),
		enabled: e !== void 0
	});
}
function $() {
	let t = j("tax.view_ledger"), [r, c] = X(), { data: l, isLoading: d } = Q(r), f = l?.ledger.members[0], m = l?.invoices.filter((e) => !e.paid) ?? [];
	return /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(p, {
		eyebrow: "Corp tax",
		title: "My tax",
		icon: /* @__PURE__ */ z(H, {}),
		description: "The tax your corporation took from your characters' bounties, ESS payouts and missions, and what you owe on top.",
		actions: /* @__PURE__ */ B("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ z(Y, {
				value: r,
				onChange: c
			}), t && /* @__PURE__ */ z(L, {
				to: "/p/tax",
				children: /* @__PURE__ */ z(i, {
					variant: "ghost",
					children: "Full ledger"
				})
			})]
		})
	}), d || !l ? /* @__PURE__ */ z(h, { className: "h-48" }) : /* @__PURE__ */ B("div", {
		className: "space-y-6",
		children: [
			l.outstanding > 0 && /* @__PURE__ */ B(e, {
				tone: "warning",
				icon: /* @__PURE__ */ z(K, {}),
				title: `You owe ${k(l.outstanding, { full: !0 })} in corp tax`,
				children: [l.payment_instructions || "Ask your corporation's leadership how to pay.", l.payment_reason && m.length > 0 && /* @__PURE__ */ B(R, { children: [
					" Put ",
					/* @__PURE__ */ z("span", {
						className: "font-mono",
						children: m.map((e) => e.reference).join(", ")
					}),
					" in the reason and it's marked paid by itself within a day."
				] })]
			}),
			/* @__PURE__ */ B("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ z(g, {
						label: `Corporation took in ${l.ledger.label}`,
						value: k(f?.collected ?? 0),
						mono: !0,
						hint: f && f.earned > 0 ? `of ≈ ${k(f.earned)} earned` : "in-game tax"
					}),
					/* @__PURE__ */ z(g, {
						label: `Owed · ${l.ledger.rate}%`,
						value: k(f?.tax ?? 0),
						mono: !0,
						hint: l.ledger.closed ? f?.invoice?.paid ? "paid" : f?.invoice ? "not paid yet" : "nothing owed" : "estimate until the month is closed",
						tone: f?.invoice && !f.invoice.paid ? "warning" : void 0
					}),
					/* @__PURE__ */ z(g, {
						label: "Characters",
						value: f?.characters.length ?? 0,
						hint: "taxed this month"
					})
				]
			}),
			/* @__PURE__ */ B("div", {
				className: "grid gap-6 xl:grid-cols-[1fr_380px]",
				children: [/* @__PURE__ */ B(a, { children: [/* @__PURE__ */ z(s, { title: "By character" }), f ? /* @__PURE__ */ B(b, { children: [/* @__PURE__ */ z(v, { children: /* @__PURE__ */ B("tr", { children: [
					/* @__PURE__ */ z(w, { children: "Character" }),
					/* @__PURE__ */ z(w, {
						align: "right",
						children: "Earned (est.)"
					}),
					/* @__PURE__ */ z(w, {
						align: "right",
						children: "Corporation took"
					})
				] }) }), /* @__PURE__ */ z("tbody", { children: f.characters.map((e) => /* @__PURE__ */ B(T, { children: [
					/* @__PURE__ */ z(S, { children: e.name }),
					/* @__PURE__ */ z(S, {
						numeric: !0,
						className: "text-muted",
						children: e.earned > 0 ? k(e.earned) : "—"
					}),
					/* @__PURE__ */ z(S, {
						numeric: !0,
						children: k(e.collected)
					})
				] }, e.id)) })] }) : /* @__PURE__ */ z(u, {
					icon: /* @__PURE__ */ z(H, {}),
					title: `No tax in ${l.ledger.label}`
				})] }), /* @__PURE__ */ B(a, {
					className: "h-fit",
					children: [/* @__PURE__ */ z(s, { title: "Bills" }), l.invoices.length === 0 ? /* @__PURE__ */ z(o, {
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
									children: k(e.amount)
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
function se() {
	return j("tax.view_ledger") ? /* @__PURE__ */ z(Z, {}) : /* @__PURE__ */ z($, {});
}
function ce() {
	let { data: e, isLoading: t } = Q("");
	if (t) return /* @__PURE__ */ z(h, { className: "h-16" });
	if (!e) return null;
	let r = e.ledger.members[0];
	return /* @__PURE__ */ z(L, {
		to: "/p/tax/me",
		className: "block",
		children: /* @__PURE__ */ B("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ B("div", { children: [
				/* @__PURE__ */ B("div", {
					className: "text-xs text-muted",
					children: ["Corp tax in ", e.ledger.label]
				}),
				/* @__PURE__ */ z("div", {
					className: "mt-1 font-mono text-2xl font-semibold tabular-nums",
					children: k(r?.collected ?? 0)
				}),
				/* @__PURE__ */ B("div", {
					className: "text-xs text-subtle",
					children: [
						"≈ ",
						k(r?.tax ?? 0),
						" owed at ",
						e.ledger.rate,
						"%"
					]
				})
			] }), e.outstanding > 0 ? /* @__PURE__ */ B(n, {
				tone: "warning",
				children: [k(e.outstanding), " owed"]
			}) : /* @__PURE__ */ z(n, {
				tone: "success",
				children: "All paid"
			})]
		})
	});
}
var le = O({
	routes: [{
		path: "",
		Component: se
	}, {
		path: "me",
		Component: $
	}],
	widgets: [{
		id: "my-tax",
		title: "Corp tax",
		Component: ce,
		size: "sm",
		order: 45
	}]
});
//#endregion
export { le as default };

export const classes = ["!data","!o","---","----------------------------------------------------------------------------","-----------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------","@conduit/sdk","@tanstack/react-query","a","account","accountant","accounts","action","actions","align","all","amount","amounts","and","are","aren","aria-label","as","at","available_corporations","available_ref_types","be","been","bg-bg/40","bill","billed","bills","block","boolean","border","border-border","but","by","can","canManage","canView","can_close","character","character_id","characters","checked","children","className","close","closed","closed_at","collected","confirmLabel","const","contains","corp","corporation","corporations","count","counts","covers","current","currentColor","cursor-pointer","cx","cy","danger","dashboard","data","date","day","default","deleted","description","director","disabled","divide-border","divide-y","each","earned","else","enabled","estimate","every","export","eyebrow","false","far","few","figures","fill","fixed","fixes","flex","flex-wrap","font-medium","font-mono","font-semibold","footer","for","form","format","found","from","full","function","gap-2","gap-3","gap-4","gap-6","get","ghost","grid","h-16","h-28","h-40","h-48","h-fit","had","has","have","height","here","hint","how","href","icon","icons","id","if","import","in","in-game","info","inline","inline-flex","interactive","interface","invoice","invoices","is","isLoading","isn","it","items","items-center","items-end","its","itself","justify-between","keep","keeps","key","kind","kinds","label","leadership","ledger","length","lg","list-disc","loading","login","m16.71","m7","m9","manage_ledger","marked","match","max","maxLength","mb-1","mb-3","me","means","member","members","min","min-w-0","minimum","mono","month","monthly","months","mt-1","mutationFn","my-tax","n","name","new","nobody","none","not","nothing","number","numeric","of","off","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpenChange","onPaid","onReopen","onSuccess","once","ones","only","open","options","or","order","outstanding","over","owe","owed","own","p","paid","paid_at","paid_from_wallet","part","partial","patch","path","pay","payment_instructions","payment_reason","payments","payouts","per","pills","pl-16","pl-5","placeholder","portrait","post","previous_owner","primary","put","px-3","px-card","py-2.5","py-3","qc","queryFn","queryKey","rate","react","react-router","reason","ref_type","ref_types","reference","refresh","registered","reminded","reminder_days","removed","removed_at","reopen","reopened","rest","return","right","rotate-90","round","rounded-lg","routes","rows","rx","ry","s","same","save","see","sent","series","set","setConfirm","setForm","setMonth","setOpen","setSettingsOpen","settings","settle","shown","shows","since","site","size","size-4","sm","sm:grid-cols-2","sm:grid-cols-3","sm:grid-cols-4","so","sold","space-y-4","space-y-5","space-y-6","src","step","still","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","switches","synced","t","tabular-nums","taken","tax","taxed","tells","text-2xl","text-[13px]","text-muted","text-sm","text-subtle","text-xs","that","the","their","them","they","this","those","ticked","ticker","title","to","toggle","told","tone","took","totals","transition-transform","true","truncate","type","undefined","unpaid","unregistered_collected","until","up","useQueryClient","useState","used","user_id","value","variant","viewBox","view_ledger","viewer","void","w-32","w-40","w-44","w-56","wallets","warning","was","were","what","when","while","whoever","whose","widget","widgets","width","with","within","without","word","x","xl:grid-cols-4","xl:grid-cols-[1fr_380px]","yet","you","your"];
