import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, DescriptionList as c, Dialog as l, EmptyState as u, Field as d, Input as f, PageHeader as p, SearchInput as m, Segmented as h, Skeleton as g, StatCard as _, Switch as v, SwitchRow as y, THead as b, TabPanel as x, Table as S, TableToolbar as ee, Tabs as C, Td as w, Textarea as T, Th as E, Tr as D, api as O, dateTime as k, definePlugin as te, isk as A, num as j, timeAgo as M, toast as N, useHasPerm as P } from "@conduit/sdk";
import { useMutation as F, useQuery as I, useQueryClient as L } from "@tanstack/react-query";
import { Link as R, useNavigate as z, useParams as ne } from "react-router";
import { useState as B } from "react";
import { Fragment as V, jsx as H, jsxs as U } from "react/jsx-runtime";
//#region src/icons.tsx
function W({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ H("svg", {
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
var G = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}),
		/* @__PURE__ */ H("path", { d: "m4.93 4.93 4.24 4.24" }),
		/* @__PURE__ */ H("path", { d: "m14.83 9.17 4.24-4.24" }),
		/* @__PURE__ */ H("path", { d: "m14.83 14.83 4.24 4.24" }),
		/* @__PURE__ */ H("path", { d: "m9.17 14.83-4.24 4.24" }),
		/* @__PURE__ */ H("circle", {
			cx: "12",
			cy: "12",
			r: "4"
		})
	]
}), K = (e) => /* @__PURE__ */ H(W, {
	...e,
	children: /* @__PURE__ */ H("path", { d: "M20 6 9 17l-5-5" })
}), q = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M18 6 6 18" }), /* @__PURE__ */ H("path", { d: "m6 6 12 12" })]
}), J = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ H("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ H("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), re = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M20 7h-9" }),
		/* @__PURE__ */ H("path", { d: "M14 17H5" }),
		/* @__PURE__ */ H("circle", {
			cx: "17",
			cy: "17",
			r: "3"
		}),
		/* @__PURE__ */ H("circle", {
			cx: "7",
			cy: "7",
			r: "3"
		})
	]
}), ie = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M12 15V3" }),
		/* @__PURE__ */ H("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ H("path", { d: "m7 10 5 5 5-5" })
	]
}), ae = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M5 12h14" }), /* @__PURE__ */ H("path", { d: "M12 5v14" })]
}), Y = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M3 6h18" }),
		/* @__PURE__ */ H("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ H("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), oe = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ H("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })]
}), X = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("circle", {
			cx: "8",
			cy: "8",
			r: "6"
		}),
		/* @__PURE__ */ H("path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18" }),
		/* @__PURE__ */ H("path", { d: "M7 6h1v4" }),
		/* @__PURE__ */ H("path", { d: "m16.71 13.88.7.71-2.82 2.82" })
	]
}), se = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M3 7v6h6" }), /* @__PURE__ */ H("path", { d: "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" })]
}), ce = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ H("circle", {
		cx: "12",
		cy: "7",
		r: "4"
	})]
}), le = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ H("path", { d: "M19 12H5" })]
}), Z = "/api/p/srp", ue = {
	pending: {
		label: "Pending",
		tone: "info"
	},
	approved: {
		label: "Approved",
		tone: "accent"
	},
	rejected: {
		label: "Rejected",
		tone: "danger"
	},
	paid: {
		label: "Paid",
		tone: "success"
	}
};
//#endregion
//#region src/shared.tsx
function de({ status: e }) {
	return /* @__PURE__ */ H(n, {
		tone: ue[e].tone,
		children: ue[e].label
	});
}
function Q({ ship: e, sub: t }) {
	return /* @__PURE__ */ U("div", {
		className: "flex min-w-0 items-center gap-3",
		children: [/* @__PURE__ */ H("img", {
			src: e.icon,
			alt: "",
			className: "size-9 shrink-0 border border-border bg-bg",
			loading: "lazy"
		}), /* @__PURE__ */ U("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ H("div", {
				className: "truncate font-medium",
				children: e.name
			}), /* @__PURE__ */ H("div", {
				className: "truncate text-xs text-subtle",
				children: t ?? e.group
			})]
		})]
	});
}
function $({ system: e }) {
	if (!e) return /* @__PURE__ */ H("span", {
		className: "text-subtle",
		children: "Unknown system"
	});
	let t = e.security >= .5 ? "text-success-fg" : e.security > 0 ? "text-warning-fg" : "text-danger-fg";
	return /* @__PURE__ */ U("span", { children: [
		e.name,
		" ",
		/* @__PURE__ */ H("span", {
			className: `font-mono text-xs ${t}`,
			children: e.security.toFixed(1)
		}),
		/* @__PURE__ */ U("span", {
			className: "text-subtle",
			children: [" · ", e.region]
		})
	] });
}
function fe({ loss: e, requireFleet: t, onClose: n }) {
	let i = L(), a = z(), [o, s] = B(""), [c, u] = B(""), [p, m] = B(""), [h, g] = B(""), _ = F({
		mutationFn: () => O.post(`${Z}/requests`, {
			killmail_id: e?.killmail_id ?? null,
			link: e ? "" : o,
			fleet: c,
			fc: p,
			notes: h
		}),
		onSuccess: (e) => {
			i.invalidateQueries({ queryKey: ["srp"] }), N.success("Request sent; you'll be told when it's decided"), n(), a(`/p/srp/requests/${e.id}`);
		},
		onError: (e) => N.error(e.message)
	}), v = (e || o.trim()) && (!t || c.trim());
	return /* @__PURE__ */ H(l, {
		open: !0,
		onOpenChange: (e) => !e && n(),
		title: e ? `Claim ${e.character.name}'s ${e.ship.name}` : "Claim a loss from a kill link",
		description: e ? `Rules suggest ${A(e.suggested, { full: !0 })} for this loss.` : "For losses that haven't shown up on their own.",
		footer: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(r, {
			variant: "ghost",
			onClick: n,
			children: "Cancel"
		}), /* @__PURE__ */ H(r, {
			variant: "primary",
			disabled: !v,
			loading: _.isPending,
			onClick: () => _.mutate(),
			children: "Send request"
		})] }),
		children: /* @__PURE__ */ U("div", {
			className: "space-y-4",
			children: [
				e ? /* @__PURE__ */ H("div", {
					className: "border border-border bg-bg/40 p-3",
					children: /* @__PURE__ */ H(Q, {
						ship: e.ship,
						sub: /* @__PURE__ */ H($, { system: e.system })
					})
				}) : /* @__PURE__ */ H(d, {
					label: "Kill link",
					hint: "In game, open the killmail, then right-click → \"Copy external kill link\". It starts with https://esi.evetech.net/.",
					required: !0,
					children: /* @__PURE__ */ H(f, {
						value: o,
						onChange: (e) => s(e.target.value),
						placeholder: "https://esi.evetech.net/latest/killmails/…/…/",
						className: "font-mono text-xs",
						autoFocus: !0
					})
				}),
				/* @__PURE__ */ U("div", {
					className: "grid gap-4 sm:grid-cols-[1fr_200px]",
					children: [/* @__PURE__ */ H(d, {
						label: "Fleet",
						required: t,
						hint: "Op name or the fleet ping.",
						children: /* @__PURE__ */ H(f, {
							value: c,
							onChange: (e) => u(e.target.value),
							placeholder: "Sunday CTA, Stratop…",
							autoFocus: !!e
						})
					}), /* @__PURE__ */ H(d, {
						label: "FC",
						children: /* @__PURE__ */ H(f, {
							value: p,
							onChange: (e) => m(e.target.value)
						})
					})]
				}),
				/* @__PURE__ */ H(d, {
					label: "Anything the reviewers should know",
					children: /* @__PURE__ */ H(T, {
						rows: 3,
						value: h,
						onChange: (e) => g(e.target.value),
						placeholder: "Ordered to hold the gate, logi went down first…"
					})
				})
			]
		})
	});
}
//#endregion
//#region src/my.tsx
function pe() {
	let e = P("srp.review_requests"), t = P("srp.pay_requests");
	return e || t;
}
function me() {
	return I({
		queryKey: ["srp", "me"],
		queryFn: () => O.get(`${Z}/me`)
	});
}
function he() {
	let t = z(), n = pe(), { data: a, isLoading: s } = me(), [c, l] = B(null);
	return /* @__PURE__ */ U(V, { children: [
		/* @__PURE__ */ H(p, {
			eyebrow: "Ship replacement",
			title: "My SRP",
			icon: /* @__PURE__ */ H(G, {}),
			description: "Claim ships you lost on fleet. A reviewer checks the loss, approves a payout and the ISK is sent to the character.",
			actions: /* @__PURE__ */ U("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [n && /* @__PURE__ */ H(R, {
					to: "/p/srp",
					children: /* @__PURE__ */ H(r, {
						variant: "ghost",
						children: "Review queue"
					})
				}), /* @__PURE__ */ U(r, {
					onClick: () => l("link"),
					children: [/* @__PURE__ */ H(oe, {}), " Claim from kill link"]
				})]
			})
		}),
		s || !a ? /* @__PURE__ */ H("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ H(g, { className: "h-28" }, e))
		}) : /* @__PURE__ */ U("div", {
			className: "space-y-6",
			children: [
				a.settings.rules_text && /* @__PURE__ */ H(e, {
					tone: "info",
					title: "How SRP works here",
					children: /* @__PURE__ */ H("span", {
						className: "whitespace-pre-line",
						children: a.settings.rules_text
					})
				}),
				/* @__PURE__ */ U("div", {
					className: "grid gap-4 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ H(_, {
							label: "Waiting for review",
							value: a.totals.pending,
							hint: a.totals.pending === 1 ? "request" : "requests",
							tone: a.totals.pending ? "info" : void 0
						}),
						/* @__PURE__ */ H(_, {
							label: "Approved, not paid yet",
							value: A(a.totals.approved),
							mono: !0,
							tone: a.totals.approved ? "accent" : void 0
						}),
						/* @__PURE__ */ H(_, {
							label: "Paid to you",
							value: A(a.totals.paid),
							mono: !0,
							tone: a.totals.paid ? "success" : void 0,
							hint: "all time"
						})
					]
				}),
				/* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, {
					title: "Losses you can claim",
					description: `From the last ${a.settings.max_age_days} days, found in your characters' killmails.`
				}), a.losses.length === 0 ? /* @__PURE__ */ H(u, {
					icon: /* @__PURE__ */ H(G, {}),
					title: "No unclaimed losses",
					description: "Losses show up here once your characters' killmails have synced (they need the killmail scope). Missing one? Claim it from its kill link."
				}) : /* @__PURE__ */ U(S, { children: [/* @__PURE__ */ H(b, { children: /* @__PURE__ */ U("tr", { children: [
					/* @__PURE__ */ H(E, { children: "Ship" }),
					/* @__PURE__ */ H(E, { children: "Where" }),
					/* @__PURE__ */ H(E, { children: "When" }),
					/* @__PURE__ */ H(E, {
						align: "right",
						children: "Loss"
					}),
					/* @__PURE__ */ H(E, {
						align: "right",
						children: "Payout"
					}),
					/* @__PURE__ */ H(E, {})
				] }) }), /* @__PURE__ */ H("tbody", { children: a.losses.map((e) => /* @__PURE__ */ U(D, { children: [
					/* @__PURE__ */ H(w, { children: /* @__PURE__ */ H(Q, {
						ship: e.ship,
						sub: e.character.name
					}) }),
					/* @__PURE__ */ H(w, {
						className: "text-sm",
						children: /* @__PURE__ */ H($, { system: e.system })
					}),
					/* @__PURE__ */ H(w, {
						className: "whitespace-nowrap text-sm text-muted",
						children: M(e.time)
					}),
					/* @__PURE__ */ H(w, {
						numeric: !0,
						className: "text-muted",
						children: A(e.value)
					}),
					/* @__PURE__ */ H(w, {
						numeric: !0,
						children: e.suggested == null ? /* @__PURE__ */ H("span", {
							className: "text-subtle",
							children: "not covered"
						}) : A(e.suggested)
					}),
					/* @__PURE__ */ H(w, {
						align: "right",
						children: /* @__PURE__ */ U("div", {
							className: "flex items-center justify-end gap-1",
							children: [/* @__PURE__ */ H("a", {
								href: e.zkillboard,
								target: "_blank",
								rel: "noreferrer",
								title: "Open on zKillboard",
								children: /* @__PURE__ */ H(r, {
									variant: "ghost",
									size: "icon-sm",
									"aria-label": "Open on zKillboard",
									children: /* @__PURE__ */ H(J, {})
								})
							}), /* @__PURE__ */ H(r, {
								size: "sm",
								variant: "primary",
								disabled: e.suggested == null,
								onClick: () => l(e),
								children: "Claim"
							})]
						})
					})
				] }, e.killmail_id)) })] })] }),
				/* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, { title: "My requests" }), a.requests.length === 0 ? /* @__PURE__ */ H(u, {
					icon: /* @__PURE__ */ H(G, {}),
					title: "You haven't asked for SRP yet"
				}) : /* @__PURE__ */ U(S, { children: [/* @__PURE__ */ H(b, { children: /* @__PURE__ */ U("tr", { children: [
					/* @__PURE__ */ H(E, { children: "Ship" }),
					/* @__PURE__ */ H(E, { children: "Fleet" }),
					/* @__PURE__ */ H(E, { children: "Sent" }),
					/* @__PURE__ */ H(E, {
						align: "right",
						children: "Payout"
					}),
					/* @__PURE__ */ H(E, {
						align: "right",
						children: "Status"
					})
				] }) }), /* @__PURE__ */ H("tbody", { children: a.requests.map((e) => /* @__PURE__ */ U(D, {
					interactive: !0,
					onClick: () => t(`/p/srp/requests/${e.id}`),
					children: [
						/* @__PURE__ */ H(w, { children: /* @__PURE__ */ H(Q, {
							ship: e.ship,
							sub: e.character.name
						}) }),
						/* @__PURE__ */ H(w, {
							className: "text-sm text-muted",
							children: e.fleet || "—"
						}),
						/* @__PURE__ */ H(w, {
							className: "whitespace-nowrap text-sm text-muted",
							children: M(e.created_at)
						}),
						/* @__PURE__ */ H(w, {
							numeric: !0,
							children: A(e.payout ?? e.suggested)
						}),
						/* @__PURE__ */ H(w, {
							align: "right",
							children: /* @__PURE__ */ H(de, { status: e.status })
						})
					]
				}, e.id)) })] })] })
			]
		}),
		c && /* @__PURE__ */ H(fe, {
			loss: c === "link" ? null : c,
			requireFleet: a?.settings.require_fleet ?? !0,
			onClose: () => l(null)
		})
	] });
}
//#endregion
//#region src/settings.tsx
var ge = ["srp", "settings"];
function _e({ onClose: e }) {
	let t = L(), { data: n } = I({
		queryKey: ge,
		queryFn: () => O.get(`${Z}/settings`)
	}), [i, a] = B(null), o = i ?? n ?? null, s = F({
		mutationFn: (e) => O.put(`${Z}/settings`, e),
		onSuccess: (n) => {
			t.setQueryData(ge, n), t.invalidateQueries({ queryKey: ["srp"] }), N.success("Saved"), e();
		},
		onError: (e) => N.error(e.message)
	}), c = (e) => o && a({
		...o,
		...e
	});
	return /* @__PURE__ */ H(l, {
		open: !0,
		onOpenChange: (t) => !t && e(),
		title: "SRP rules",
		description: "What each ship pays out, and who can claim what. Changes apply to new requests.",
		size: "xl",
		footer: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(r, {
			variant: "ghost",
			onClick: e,
			children: "Close"
		}), /* @__PURE__ */ H(r, {
			variant: "primary",
			disabled: !i,
			loading: s.isPending,
			onClick: () => i && s.mutate(i),
			children: "Save settings"
		})] }),
		children: o ? /* @__PURE__ */ U(C, {
			className: "space-y-4",
			items: [
				{
					value: "ships",
					label: "Ships",
					count: o.rules.length
				},
				{
					value: "general",
					label: "General"
				},
				{
					value: "corps",
					label: "Corporations"
				}
			],
			defaultValue: "ships",
			children: [
				/* @__PURE__ */ H(x, {
					value: "ships",
					children: /* @__PURE__ */ H(ye, {
						rules: n?.rules ?? [],
						defaultPercent: o.default_percent,
						coveredOnly: o.covered_only
					})
				}),
				/* @__PURE__ */ H(x, {
					value: "general",
					children: /* @__PURE__ */ U("div", {
						className: "space-y-5",
						children: [
							/* @__PURE__ */ H(d, {
								label: "Default payout (% of the loss's value)",
								hint: "For ships without a rule of their own or for their group.",
								children: /* @__PURE__ */ H("div", { children: /* @__PURE__ */ H(f, {
									type: "number",
									min: 0,
									max: 1e3,
									step: 5,
									value: o.default_percent,
									onChange: (e) => c({ default_percent: Number(e.target.value) }),
									className: "w-32 font-mono"
								}) })
							}),
							/* @__PURE__ */ H(d, {
								label: "Claims allowed for (days)",
								children: /* @__PURE__ */ H("div", { children: /* @__PURE__ */ H(f, {
									type: "number",
									min: 1,
									max: 365,
									value: o.max_age_days,
									onChange: (e) => c({ max_age_days: Number(e.target.value) }),
									className: "w-32 font-mono"
								}) })
							}),
							/* @__PURE__ */ U("div", {
								className: "divide-y divide-border border border-border px-3",
								children: [/* @__PURE__ */ H(y, {
									label: "Only ships with a rule",
									description: "Ships without a rule (for themselves or their group) can't be claimed.",
									checked: o.covered_only,
									onCheckedChange: (e) => c({ covered_only: e })
								}), /* @__PURE__ */ H(y, {
									label: "Ask for the fleet",
									description: "Members must name the fleet or op they lost the ship on.",
									checked: o.require_fleet,
									onCheckedChange: (e) => c({ require_fleet: e })
								})]
							}),
							/* @__PURE__ */ H(d, {
								label: "Rules shown to members",
								hint: "Which fleets count, doctrine fits, when payouts go out…",
								children: /* @__PURE__ */ H(T, {
									rows: 4,
									value: o.rules_text,
									onChange: (e) => c({ rules_text: e.target.value }),
									placeholder: "Strategic and CTA fleets only. Doctrine fits get the full payout. Payouts go out every Sunday."
								})
							})
						]
					})
				}),
				/* @__PURE__ */ U(x, {
					value: "corps",
					children: [/* @__PURE__ */ H("p", {
						className: "mb-3 text-xs text-muted",
						children: "Whose losses can be claimed. None ticked means every corporation."
					}), o.available_corporations.length === 0 ? /* @__PURE__ */ H("p", {
						className: "text-sm text-subtle",
						children: "No members yet."
					}) : /* @__PURE__ */ H("div", {
						className: "divide-y divide-border border border-border",
						children: o.available_corporations.map((e) => /* @__PURE__ */ U("label", {
							className: "flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm",
							children: [/* @__PURE__ */ U("span", { children: [
								e.name,
								" ",
								/* @__PURE__ */ U("span", {
									className: "text-subtle",
									children: [
										"[",
										e.ticker,
										"]"
									]
								})
							] }), /* @__PURE__ */ H(v, {
								checked: o.corporations.includes(e.id),
								onCheckedChange: (t) => c({ corporations: t ? [...o.corporations, e.id] : o.corporations.filter((t) => t !== e.id) })
							})]
						}, e.id))
					})]
				})
			]
		}) : /* @__PURE__ */ H(g, { className: "h-64" })
	});
}
function ve(e, t) {
	return e.covered ? e.payout == null ? /* @__PURE__ */ U("span", {
		className: "font-mono tabular-nums",
		children: [e.percent ?? t, "% of the loss"]
	}) : /* @__PURE__ */ H("span", {
		className: "font-mono tabular-nums",
		children: A(e.payout, { full: !0 })
	}) : /* @__PURE__ */ H(n, {
		tone: "danger",
		children: "not covered"
	});
}
function ye({ rules: e, defaultPercent: t, coveredOnly: n }) {
	let i = L(), [a, o] = B(""), [s, c] = B(null), [l, d] = B("fixed"), [p, g] = B(""), [_, v] = B(""), { data: y } = I({
		queryKey: [
			"srp",
			"ships",
			a
		],
		queryFn: () => O.get(`${Z}/ships?q=${encodeURIComponent(a)}`),
		enabled: a.trim().length >= 2 && !s
	}), b = () => i.invalidateQueries({ queryKey: ge }), x = F({
		mutationFn: () => O.post(`${Z}/rules`, {
			type_id: s?.kind === "ship" ? s.id : null,
			group_id: s?.kind === "group" ? s.id : null,
			covered: l !== "none",
			payout: l === "fixed" ? Number(p) : null,
			percent: l === "percent" ? Number(p) : null,
			note: _
		}),
		onSuccess: (e) => {
			N.success(`Rule added for ${e.name}`), c(null), o(""), g(""), v(""), b();
		},
		onError: (e) => N.error(e.message)
	}), S = F({
		mutationFn: (e) => O.delete(`${Z}/rules/${e}`),
		onSuccess: b,
		onError: (e) => N.error(e.message)
	});
	return /* @__PURE__ */ U("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ U("p", {
				className: "text-xs text-muted",
				children: [
					"A ship's own rule wins over its group's. Anything else ",
					n ? "can't be claimed" : `pays ${t}% of the loss`,
					"."
				]
			}),
			/* @__PURE__ */ H("div", {
				className: "border border-border p-3",
				children: s ? /* @__PURE__ */ U("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ U("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ U("div", {
							className: "text-sm font-medium",
							children: [
								s.name,
								" ",
								/* @__PURE__ */ H("span", {
									className: "text-subtle",
									children: s.kind === "group" ? "(every ship in the group)" : ""
								})
							]
						}), /* @__PURE__ */ H(r, {
							variant: "ghost",
							size: "xs",
							onClick: () => c(null),
							children: "Change"
						})]
					}), /* @__PURE__ */ U("div", {
						className: "flex flex-wrap items-end gap-3",
						children: [
							/* @__PURE__ */ H(h, {
								value: l,
								onChange: d,
								options: [
									{
										value: "fixed",
										label: "Fixed ISK"
									},
									{
										value: "percent",
										label: "% of loss"
									},
									{
										value: "none",
										label: "Not covered"
									}
								],
								size: "sm"
							}),
							l !== "none" && /* @__PURE__ */ H(f, {
								type: "number",
								min: 0,
								value: p,
								onChange: (e) => g(e.target.value),
								placeholder: l === "fixed" ? "60000000" : "100",
								className: "w-40 font-mono"
							}),
							/* @__PURE__ */ H(f, {
								value: _,
								onChange: (e) => v(e.target.value),
								placeholder: "Note (optional), e.g. doctrine fit only",
								className: "min-w-48 flex-1"
							}),
							/* @__PURE__ */ U(r, {
								variant: "primary",
								size: "sm",
								disabled: l !== "none" && !(Number(p) >= 0 && p !== ""),
								loading: x.isPending,
								onClick: () => x.mutate(),
								children: [/* @__PURE__ */ H(ae, {}), " Add"]
							})
						]
					})]
				}) : /* @__PURE__ */ U("div", {
					className: "relative",
					children: [/* @__PURE__ */ H(m, {
						value: a,
						onChange: (e) => o(e.target.value),
						placeholder: "Add a rule: search a ship or ship group (Scythe, Logistics…)"
					}), y && y.length > 0 && /* @__PURE__ */ H("ul", {
						className: "absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-auto border border-border bg-surface shadow-e2",
						children: y.map((e) => /* @__PURE__ */ H("li", { children: /* @__PURE__ */ U("button", {
							type: "button",
							className: "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-hover",
							onClick: () => c(e),
							children: [
								e.icon ? /* @__PURE__ */ H("img", {
									src: e.icon,
									alt: "",
									className: "size-6"
								}) : /* @__PURE__ */ H("span", {
									className: "grid size-6 place-items-center bg-accent-soft text-accent-ink",
									children: /* @__PURE__ */ H(G, { className: "size-3.5" })
								}),
								/* @__PURE__ */ H("span", {
									className: "flex-1",
									children: e.name
								}),
								/* @__PURE__ */ H("span", {
									className: "text-xs text-subtle",
									children: e.subtitle
								})
							]
						}) }, `${e.kind}-${e.id}`))
					})]
				})
			}),
			e.length === 0 ? /* @__PURE__ */ H(u, {
				icon: /* @__PURE__ */ H(G, {}),
				title: "No rules yet",
				description: "Every ship pays the default rate until you add some."
			}) : /* @__PURE__ */ H("ul", {
				className: "divide-y divide-border border border-border",
				children: e.map((e) => /* @__PURE__ */ U("li", {
					className: "flex items-center gap-3 px-3 py-2.5 text-sm",
					children: [
						e.icon ? /* @__PURE__ */ H("img", {
							src: e.icon,
							alt: "",
							className: "size-7"
						}) : /* @__PURE__ */ H("span", {
							className: "grid size-7 place-items-center bg-accent-soft text-accent-ink",
							children: /* @__PURE__ */ H(G, { className: "size-4" })
						}),
						/* @__PURE__ */ U("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ U("div", {
								className: "truncate font-medium",
								children: [e.name, e.kind === "group" && /* @__PURE__ */ H("span", {
									className: "ml-2 text-xs font-normal text-subtle",
									children: "group"
								})]
							}), e.note && /* @__PURE__ */ H("div", {
								className: "truncate text-xs text-subtle",
								children: e.note
							})]
						}),
						/* @__PURE__ */ H("div", {
							className: "text-right",
							children: ve(e, t)
						}),
						/* @__PURE__ */ H(r, {
							variant: "ghost",
							size: "icon-xs",
							"aria-label": `Remove the rule for ${e.name}`,
							onClick: () => S.mutate(e.id),
							children: /* @__PURE__ */ H(Y, {})
						})
					]
				}, e.id))
			})
		]
	});
}
//#endregion
//#region src/queue.tsx
function be() {
	let e = L(), n = z(), a = P("srp.pay_requests"), o = P("srp.manage_srp"), c = P("srp.review_requests"), [l, d] = B(c ? "pending" : "approved"), [f, h] = B(""), [v, y] = B(/* @__PURE__ */ new Set()), [x, T] = B(!1), [k, te] = B(!1), { data: j, isLoading: ne } = I({
		queryKey: [
			"srp",
			"queue",
			l,
			f
		],
		queryFn: () => O.get(`${Z}/queue?status=${l}&q=${encodeURIComponent(f)}`),
		placeholderData: (e) => e
	}), W = F({
		mutationFn: (e) => O.post(`${Z}/paid`, { ids: e }),
		onSuccess: (t) => {
			y(/* @__PURE__ */ new Set()), e.invalidateQueries({ queryKey: ["srp"] }), N.success(`${t.paid} request${t.paid === 1 ? "" : "s"} marked paid`);
		},
		onError: (e) => N.error(e.message)
	}), K = (j?.requests ?? []).filter((e) => e.status === "approved"), q = a && K.length > 0, J = K.filter((e) => v.has(e.id)).reduce((e, t) => e + (t.payout ?? 0), 0), ae = (e) => y((t) => {
		let n = new Set(t);
		return n.has(e) ? n.delete(e) : n.add(e), n;
	}), Y = K.length > 0 && K.every((e) => v.has(e.id));
	return /* @__PURE__ */ U(V, { children: [
		/* @__PURE__ */ H(p, {
			eyebrow: "Ship replacement",
			title: "SRP queue",
			icon: /* @__PURE__ */ H(G, {}),
			description: "Check each loss, approve a payout or say why not, then mark it paid once the ISK is sent.",
			actions: /* @__PURE__ */ U("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ H(R, {
						to: "/p/srp/me",
						children: /* @__PURE__ */ U(r, {
							variant: "ghost",
							children: [/* @__PURE__ */ H(ce, {}), " Mine"]
						})
					}),
					a && /* @__PURE__ */ H("a", {
						href: "/api/p/srp/queue.csv",
						download: !0,
						children: /* @__PURE__ */ U(r, {
							variant: "ghost",
							children: [/* @__PURE__ */ H(ie, {}), " Payouts CSV"]
						})
					}),
					o && /* @__PURE__ */ U(r, {
						onClick: () => T(!0),
						children: [/* @__PURE__ */ H(re, {}), " Rules"]
					})
				]
			})
		}),
		!j && ne ? /* @__PURE__ */ H("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ H(g, { className: "h-28" }, e))
		}) : j ? /* @__PURE__ */ U("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ U("div", {
					className: "grid gap-4 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ H(_, {
							label: "Waiting for review",
							value: j.counts.pending,
							hint: `${A(j.totals.pending)} suggested`,
							tone: j.counts.pending ? "info" : void 0
						}),
						/* @__PURE__ */ H(_, {
							label: "Approved, to pay",
							value: A(j.totals.approved),
							mono: !0,
							hint: `${j.counts.approved} request${j.counts.approved === 1 ? "" : "s"}`,
							tone: j.counts.approved ? "accent" : void 0
						}),
						/* @__PURE__ */ H(_, {
							label: "Paid in the last 30 days",
							value: A(j.totals.paid_30d),
							mono: !0,
							tone: "success"
						})
					]
				}),
				/* @__PURE__ */ H(C, {
					variant: "pills",
					value: l,
					onValueChange: (e) => {
						d(e), y(/* @__PURE__ */ new Set());
					},
					items: [
						{
							value: "pending",
							label: "Pending",
							count: j.counts.pending
						},
						{
							value: "approved",
							label: "Approved",
							count: j.counts.approved
						},
						{
							value: "rejected",
							label: "Rejected",
							count: j.counts.rejected
						},
						{
							value: "paid",
							label: "Paid",
							count: j.counts.paid
						},
						{
							value: "all",
							label: "All"
						}
					]
				}),
				/* @__PURE__ */ U(i, { children: [/* @__PURE__ */ U(ee, { children: [/* @__PURE__ */ H(m, {
					value: f,
					onChange: (e) => h(e.target.value),
					placeholder: "Pilot, ship, fleet or FC",
					className: "w-72"
				}), q && v.size > 0 && /* @__PURE__ */ U(r, {
					variant: "primary",
					size: "sm",
					onClick: () => te(!0),
					children: [
						/* @__PURE__ */ H(X, {}),
						" Mark ",
						v.size,
						" paid · ",
						A(J)
					]
				})] }), j.requests.length === 0 ? /* @__PURE__ */ H(u, {
					icon: /* @__PURE__ */ H(G, {}),
					title: l === "pending" ? "Nothing waiting for review" : "No requests here",
					description: f ? "Nothing matches the search." : void 0
				}) : /* @__PURE__ */ U(S, { children: [/* @__PURE__ */ H(b, { children: /* @__PURE__ */ U("tr", { children: [
					q && /* @__PURE__ */ H(E, {
						className: "w-10",
						children: /* @__PURE__ */ H("input", {
							type: "checkbox",
							className: "size-4 accent-accent",
							checked: Y,
							onChange: () => y(Y ? /* @__PURE__ */ new Set() : new Set(K.map((e) => e.id))),
							"aria-label": "Pick every approved request"
						})
					}),
					/* @__PURE__ */ H(E, { children: "Pilot" }),
					/* @__PURE__ */ H(E, { children: "Ship" }),
					/* @__PURE__ */ H(E, { children: "Where" }),
					/* @__PURE__ */ H(E, { children: "Fleet" }),
					/* @__PURE__ */ H(E, {
						align: "right",
						children: "Loss"
					}),
					/* @__PURE__ */ H(E, {
						align: "right",
						children: "Payout"
					}),
					/* @__PURE__ */ H(E, {
						align: "right",
						children: "Status"
					})
				] }) }), /* @__PURE__ */ H("tbody", { children: j.requests.map((e) => /* @__PURE__ */ U(D, {
					interactive: !0,
					onClick: () => n(`/p/srp/requests/${e.id}`),
					children: [
						q && /* @__PURE__ */ H(w, {
							onClick: (e) => e.stopPropagation(),
							children: e.status === "approved" && /* @__PURE__ */ H("input", {
								type: "checkbox",
								className: "size-4 accent-accent",
								checked: v.has(e.id),
								onChange: () => ae(e.id),
								"aria-label": `Pick request ${e.id}`
							})
						}),
						/* @__PURE__ */ H(w, { children: /* @__PURE__ */ U("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ H(t, {
								src: e.user.portrait,
								name: e.user.name,
								size: "sm"
							}), /* @__PURE__ */ U("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ H("div", {
									className: "truncate font-medium",
									children: e.user.name
								}), /* @__PURE__ */ U("div", {
									className: "truncate text-xs text-subtle",
									children: [e.character.name === e.user.name ? "" : `on ${e.character.name} · `, M(e.created_at)]
								})]
							})]
						}) }),
						/* @__PURE__ */ H(w, { children: /* @__PURE__ */ H(Q, { ship: e.ship }) }),
						/* @__PURE__ */ H(w, {
							className: "text-sm",
							children: /* @__PURE__ */ H($, { system: e.system })
						}),
						/* @__PURE__ */ U(w, {
							className: "max-w-48 truncate text-sm text-muted",
							children: [e.fleet || "—", e.fc ? /* @__PURE__ */ U("span", {
								className: "text-subtle",
								children: [" · ", e.fc]
							}) : null]
						}),
						/* @__PURE__ */ H(w, {
							numeric: !0,
							className: "text-muted",
							children: A(e.value)
						}),
						/* @__PURE__ */ H(w, {
							numeric: !0,
							children: A(e.payout ?? e.suggested)
						}),
						/* @__PURE__ */ H(w, {
							align: "right",
							children: /* @__PURE__ */ H(de, { status: e.status })
						})
					]
				}, e.id)) })] })] })
			]
		}) : null,
		x && /* @__PURE__ */ H(_e, { onClose: () => T(!1) }),
		/* @__PURE__ */ H(s, {
			open: k,
			onOpenChange: te,
			title: `Mark ${v.size} request${v.size === 1 ? "" : "s"} paid?`,
			description: `${A(J, { full: !0 })} in total. Each pilot is told their SRP has been paid, so send the ISK first.`,
			confirmLabel: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(X, {}), " Mark paid"] }),
			onConfirm: () => W.mutateAsync([...v])
		})
	] });
}
//#endregion
//#region src/request.tsx
function xe() {
	let { id: e } = ne(), l = L(), d = z(), f = [
		"srp",
		"request",
		e
	], { data: m, isLoading: h, error: _ } = I({
		queryKey: f,
		queryFn: () => O.get(`${Z}/requests/${e}`),
		retry: !1
	}), [v, y] = B(null), b = (e, t) => {
		l.setQueryData(f, e), l.invalidateQueries({ queryKey: ["srp", "queue"] }), l.invalidateQueries({ queryKey: ["srp", "me"] }), N.success(t), y(null);
	}, x = F({
		mutationFn: (t) => O.post(`${Z}/requests/${e}/decide`, t),
		onSuccess: (e) => b(e, e.status === "approved" ? "Approved; the pilot has been told" : e.status === "rejected" ? "Rejected; the pilot has been told" : "Back in the queue"),
		onError: (e) => N.error(e.message)
	}), S = F({
		mutationFn: () => O.post(`${Z}/paid`, { ids: [Number(e)] }),
		onSuccess: async () => {
			await l.invalidateQueries({ queryKey: ["srp"] }), N.success("Marked paid; the pilot has been told"), y(null);
		},
		onError: (e) => N.error(e.message)
	}), ee = F({
		mutationFn: () => O.delete(`${Z}/requests/${e}`),
		onSuccess: () => {
			l.invalidateQueries({ queryKey: ["srp"] }), N.success("Request withdrawn"), d("/p/srp/me");
		},
		onError: (e) => N.error(e.message)
	});
	if (_) return /* @__PURE__ */ H(u, {
		icon: /* @__PURE__ */ H(G, {}),
		title: "This request doesn't exist",
		description: "It may have been withdrawn.",
		action: /* @__PURE__ */ H(R, {
			to: "/p/srp",
			children: /* @__PURE__ */ H(r, { children: "Back to SRP" })
		})
	});
	if (h || !m) return /* @__PURE__ */ H(g, { className: "h-96" });
	let C = m.can_review && !m.mine;
	return /* @__PURE__ */ U(V, { children: [
		/* @__PURE__ */ H(p, {
			eyebrow: /* @__PURE__ */ U(R, {
				to: m.mine && !m.can_review ? "/p/srp/me" : "/p/srp",
				className: "inline-flex items-center gap-1 hover:text-text",
				children: [/* @__PURE__ */ H(le, { className: "size-3" }), " Ship replacement"]
			}),
			title: /* @__PURE__ */ U("span", {
				className: "flex flex-wrap items-center gap-3",
				children: [
					m.character.name,
					"'s ",
					m.ship.name,
					" ",
					/* @__PURE__ */ H(de, { status: m.status })
				]
			}),
			description: /* @__PURE__ */ U(V, { children: [
				"Lost ",
				k(m.time),
				" in ",
				/* @__PURE__ */ H($, { system: m.system })
			] }),
			actions: /* @__PURE__ */ U("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ H("a", {
						href: m.zkillboard,
						target: "_blank",
						rel: "noreferrer",
						children: /* @__PURE__ */ U(r, {
							variant: "ghost",
							children: [/* @__PURE__ */ H(J, {}), " zKillboard"]
						})
					}),
					m.mine && m.status === "pending" && /* @__PURE__ */ U(r, {
						variant: "danger",
						onClick: () => y("withdraw"),
						children: [/* @__PURE__ */ H(Y, {}), " Withdraw"]
					}),
					C && (m.status === "approved" || m.status === "rejected") && /* @__PURE__ */ U(r, {
						variant: "ghost",
						onClick: () => y("reopen"),
						children: [/* @__PURE__ */ H(se, {}), " Reopen"]
					}),
					C && m.status !== "paid" && m.status !== "rejected" && /* @__PURE__ */ U(r, {
						variant: "danger",
						onClick: () => y("reject"),
						children: [/* @__PURE__ */ H(q, {}), " Reject"]
					}),
					C && (m.status === "pending" || m.status === "rejected") && /* @__PURE__ */ U(r, {
						variant: "success",
						onClick: () => y("approve"),
						children: [/* @__PURE__ */ H(K, {}), " Approve"]
					}),
					m.can_pay && m.status === "approved" && /* @__PURE__ */ U(r, {
						variant: "primary",
						onClick: () => y("pay"),
						children: [/* @__PURE__ */ H(X, {}), " Mark paid"]
					})
				]
			})
		}),
		/* @__PURE__ */ U("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_380px]",
			children: [/* @__PURE__ */ U("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ H(we, { data: m }),
					/* @__PURE__ */ H(i, { children: /* @__PURE__ */ U("div", {
						className: "flex flex-col gap-5 p-card sm:flex-row sm:items-center",
						children: [/* @__PURE__ */ H("img", {
							src: m.ship.icon.replace("/icon?", "/render?").replace(/size=\d+/, "size=256"),
							alt: "",
							className: "size-28 shrink-0 border border-border bg-bg object-cover"
						}), /* @__PURE__ */ U("div", {
							className: "grid flex-1 gap-4 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ H(Ce, {
									label: "Loss value",
									value: A(m.value, { full: !0 }),
									hint: "ship and modules, average prices"
								}),
								/* @__PURE__ */ H(Ce, {
									label: "Rules suggest",
									value: A(m.suggested, { full: !0 }),
									hint: Se(m)
								}),
								/* @__PURE__ */ H(Ce, {
									label: "Payout",
									value: A(m.payout, { full: !0 }),
									hint: m.status === "paid" ? `paid ${M(m.paid_at)}` : m.payout ? "approved" : "not decided yet",
									strong: !0
								})
							]
						})]
					}) }),
					/* @__PURE__ */ H(Te, { data: m })
				]
			}), /* @__PURE__ */ U("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, { title: "Request" }), /* @__PURE__ */ U(a, { children: [
					/* @__PURE__ */ U("div", {
						className: "mb-4 flex items-center gap-3",
						children: [/* @__PURE__ */ H(t, {
							src: m.user.portrait,
							name: m.user.name
						}), /* @__PURE__ */ U("div", { children: [/* @__PURE__ */ H("div", {
							className: "font-medium",
							children: m.user.name
						}), /* @__PURE__ */ U("div", {
							className: "text-xs text-subtle",
							children: ["sent ", M(m.created_at)]
						})] })]
					}),
					/* @__PURE__ */ H(c, { items: [
						{
							label: "Pay to",
							value: m.character.name
						},
						{
							label: "Fleet",
							value: m.fleet || "—"
						},
						{
							label: "FC",
							value: m.fc || "—"
						},
						{
							label: "Corporation",
							value: m.victim_corporation ?? "—"
						},
						...m.victim_alliance ? [{
							label: "Alliance",
							value: m.victim_alliance
						}] : [],
						{
							label: "Final blow",
							value: m.final_blow ?? "NPC / structure"
						},
						{
							label: "Attackers",
							value: j(m.attackers)
						}
					] }),
					m.notes && /* @__PURE__ */ H("div", {
						className: "mt-4 border-l-2 border-accent/50 bg-bg/40 px-3 py-2 text-sm whitespace-pre-line",
						children: m.notes
					})
				] })] }), m.can_review && /* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, {
					title: "Earlier requests",
					description: "This member's other SRP requests."
				}), /* @__PURE__ */ U(a, {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ U(n, {
							tone: "success",
							children: [m.history.paid, " paid"]
						}),
						/* @__PURE__ */ U(n, {
							tone: "accent",
							children: [m.history.approved, " approved"]
						}),
						/* @__PURE__ */ U(n, {
							tone: "danger",
							children: [m.history.rejected, " rejected"]
						}),
						/* @__PURE__ */ U(n, {
							tone: "info",
							children: [m.history.pending, " pending"]
						})
					]
				})] })]
			})]
		}),
		v === "approve" && /* @__PURE__ */ H(Ee, {
			data: m,
			pending: x.isPending,
			onClose: () => y(null),
			onApprove: (e, t) => x.mutate({
				decision: "approve",
				payout: e,
				note: t
			})
		}),
		v === "reject" && /* @__PURE__ */ H(De, {
			pending: x.isPending,
			onClose: () => y(null),
			onReject: (e) => x.mutate({
				decision: "reject",
				note: e
			})
		}),
		/* @__PURE__ */ H(s, {
			open: v === "pay",
			onOpenChange: (e) => !e && y(null),
			title: "Mark this request paid?",
			description: `Send ${A(m.payout, { full: !0 })} to ${m.character.name} first; they're told it has been paid.`,
			confirmLabel: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(X, {}), " Mark paid"] }),
			onConfirm: () => S.mutateAsync()
		}),
		/* @__PURE__ */ H(s, {
			open: v === "withdraw",
			onOpenChange: (e) => !e && y(null),
			title: "Withdraw this request?",
			description: "The loss goes back to your list, so you can claim it again later.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(Y, {}), " Withdraw"] }),
			onConfirm: () => ee.mutateAsync()
		}),
		/* @__PURE__ */ H(s, {
			open: v === "reopen",
			onOpenChange: (e) => !e && y(null),
			title: "Put this request back in the queue?",
			description: "The decision and its note are cleared. The pilot isn't told.",
			confirmLabel: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(se, {}), " Reopen"] }),
			onConfirm: () => x.mutateAsync({ decision: "reopen" })
		})
	] });
}
function Se(e) {
	let t = e.rule;
	return t ? t.payout == null ? t.percent == null ? `default rate (${t.name})` : `${t.percent}% for ${t.name}` : `fixed for ${t.name}` : "default rate";
}
function Ce({ label: e, value: t, hint: n, strong: r }) {
	return /* @__PURE__ */ U("div", { children: [
		/* @__PURE__ */ H("div", {
			className: "text-xs text-muted",
			children: e
		}),
		/* @__PURE__ */ H("div", {
			className: `mt-1 font-mono tabular-nums ${r ? "text-xl font-semibold text-accent-ink" : "text-lg"}`,
			children: t
		}),
		n && /* @__PURE__ */ H("div", {
			className: "text-xs text-subtle",
			children: n
		})
	] });
}
function we({ data: t }) {
	return t.status === "pending" ? /* @__PURE__ */ H(e, {
		tone: "info",
		title: "Waiting for a reviewer",
		children: t.mine ? "You'll get a notification once it's decided." : "Check the fit and the fleet, then approve or reject."
	}) : t.status === "rejected" ? /* @__PURE__ */ H(e, {
		tone: "danger",
		title: `Rejected by ${t.decided_by ?? "a reviewer"} ${M(t.decided_at)}`,
		children: /* @__PURE__ */ H("span", {
			className: "whitespace-pre-line",
			children: t.decision_note
		})
	}) : t.status === "approved" ? /* @__PURE__ */ H(e, {
		tone: "accent",
		title: `Approved by ${t.decided_by ?? "a reviewer"}: ${A(t.payout, { full: !0 })}`,
		children: t.decision_note ? /* @__PURE__ */ H("span", {
			className: "whitespace-pre-line",
			children: t.decision_note
		}) : "Waiting to be paid."
	}) : /* @__PURE__ */ U(e, {
		tone: "success",
		title: `Paid ${A(t.payout, { full: !0 })} to ${t.character.name}`,
		children: [t.paid_by ? `Marked paid by ${t.paid_by} on ${k(t.paid_at)}.` : `Paid ${k(t.paid_at)}.`, t.decision_note ? /* @__PURE__ */ H("span", {
			className: "mt-1 block whitespace-pre-line",
			children: t.decision_note
		}) : null]
	});
}
function Te({ data: e }) {
	return e.fitting.length === 0 ? /* @__PURE__ */ H(i, { children: /* @__PURE__ */ H(u, {
		icon: /* @__PURE__ */ H(G, {}),
		title: "Nothing fitted",
		description: "The killmail lists no modules or cargo."
	}) }) : /* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, {
		title: "Fitting and cargo",
		description: "Red was destroyed, green dropped."
	}), /* @__PURE__ */ H("div", {
		className: "grid gap-px bg-border sm:grid-cols-2",
		children: e.fitting.map((e) => /* @__PURE__ */ U("div", {
			className: "bg-surface p-card",
			children: [/* @__PURE__ */ H("div", {
				className: "mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
				children: e.label
			}), /* @__PURE__ */ H("ul", {
				className: "space-y-1.5",
				children: e.items.map((e, t) => /* @__PURE__ */ U("li", {
					className: "flex items-center gap-2.5 text-sm",
					children: [
						/* @__PURE__ */ H("img", {
							src: e.icon,
							alt: "",
							className: "size-6 shrink-0",
							loading: "lazy"
						}),
						/* @__PURE__ */ U("span", {
							className: "min-w-0 flex-1 truncate",
							title: e.name,
							children: [e.destroyed + e.dropped > 1 && /* @__PURE__ */ U("span", {
								className: "font-mono text-xs text-muted",
								children: [j(e.destroyed + e.dropped), "× "]
							}), e.name]
						}),
						/* @__PURE__ */ H("span", {
							className: `size-2 shrink-0 rounded-full ${e.dropped ? "bg-success" : "bg-danger"}`,
							title: e.dropped ? "Dropped" : "Destroyed"
						}),
						/* @__PURE__ */ H("span", {
							className: "w-20 shrink-0 text-right font-mono text-xs tabular-nums text-subtle",
							children: A(e.value)
						})
					]
				}, t))
			})]
		}, e.label))
	})] });
}
function Ee({ data: e, pending: t, onClose: n, onApprove: i }) {
	let [a, o] = B(String(Math.round(e.suggested ?? e.value))), [s, c] = B(""), u = Number(a);
	return /* @__PURE__ */ H(l, {
		open: !0,
		onOpenChange: (e) => !e && n(),
		title: "Approve SRP",
		description: `For ${e.character.name}'s ${e.ship.name}. The pilot is told the amount.`,
		footer: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(r, {
			variant: "ghost",
			onClick: n,
			children: "Cancel"
		}), /* @__PURE__ */ U(r, {
			variant: "success",
			disabled: !(u > 0),
			loading: t,
			onClick: () => i(u, s),
			children: [
				/* @__PURE__ */ H(K, {}),
				" Approve ",
				u > 0 ? A(u) : ""
			]
		})] }),
		children: /* @__PURE__ */ U("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ H(d, {
				label: "Payout (ISK)",
				hint: `Rules suggest ${A(e.suggested, { full: !0 })}; the loss was worth ${A(e.value, { full: !0 })}.`,
				children: /* @__PURE__ */ H(f, {
					type: "number",
					min: 0,
					step: 1e3,
					value: a,
					onChange: (e) => o(e.target.value),
					className: "w-60 font-mono",
					autoFocus: !0
				})
			}), /* @__PURE__ */ H(d, {
				label: "Note to the pilot",
				hint: "Optional.",
				children: /* @__PURE__ */ H(T, {
					rows: 2,
					value: s,
					onChange: (e) => c(e.target.value),
					placeholder: "Paid at the doctrine rate."
				})
			})]
		})
	});
}
function De({ pending: e, onClose: t, onReject: n }) {
	let [i, a] = B("");
	return /* @__PURE__ */ H(l, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: "Reject SRP",
		description: "The pilot sees the reason.",
		footer: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(r, {
			variant: "ghost",
			onClick: t,
			children: "Cancel"
		}), /* @__PURE__ */ U(r, {
			variant: "solidDanger",
			disabled: !i.trim(),
			loading: e,
			onClick: () => n(i),
			children: [/* @__PURE__ */ H(q, {}), " Reject"]
		})] }),
		children: /* @__PURE__ */ H(d, {
			label: "Why",
			required: !0,
			children: /* @__PURE__ */ H(T, {
				rows: 3,
				value: i,
				onChange: (e) => a(e.target.value),
				placeholder: "Not a doctrine fit / not on a fleet / lost while ratting…",
				autoFocus: !0
			})
		})
	});
}
//#endregion
//#region src/index.tsx
function Oe() {
	return pe() ? /* @__PURE__ */ H(be, {}) : /* @__PURE__ */ H(he, {});
}
function ke() {
	let { data: e, isLoading: t } = me();
	return t ? /* @__PURE__ */ H(g, { className: "h-16" }) : e ? /* @__PURE__ */ H(R, {
		to: "/p/srp/me",
		className: "block",
		children: /* @__PURE__ */ U("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ U("div", { children: [
				/* @__PURE__ */ H("div", {
					className: "text-xs text-muted",
					children: "Losses you can claim"
				}),
				/* @__PURE__ */ H("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: e.losses.length
				}),
				/* @__PURE__ */ U("div", {
					className: "text-xs text-subtle",
					children: [e.totals.pending, " waiting for review"]
				})
			] }), e.totals.approved > 0 ? /* @__PURE__ */ U(n, {
				tone: "accent",
				children: [A(e.totals.approved), " coming"]
			}) : /* @__PURE__ */ H(n, {
				tone: "success",
				children: "All settled"
			})]
		})
	}) : null;
}
function Ae() {
	let { data: e, isLoading: t } = I({
		queryKey: [
			"srp",
			"queue",
			"pending",
			""
		],
		queryFn: () => O.get(`${Z}/queue?status=pending`),
		refetchInterval: 12e4
	});
	return t || !e ? /* @__PURE__ */ H(g, { className: "h-16" }) : /* @__PURE__ */ H(R, {
		to: "/p/srp",
		className: "block",
		children: /* @__PURE__ */ U("div", {
			className: "flex items-end justify-between gap-6",
			children: [/* @__PURE__ */ U("div", { children: [
				/* @__PURE__ */ H("div", {
					className: "text-xs text-muted",
					children: "SRP waiting for review"
				}),
				/* @__PURE__ */ H("div", {
					className: "mt-1 font-mono text-3xl font-semibold tabular-nums",
					children: e.counts.pending
				}),
				/* @__PURE__ */ U("div", {
					className: "text-xs text-subtle",
					children: [A(e.totals.pending), " suggested"]
				})
			] }), e.counts.approved > 0 ? /* @__PURE__ */ U(n, {
				tone: "accent",
				children: [A(e.totals.approved), " to pay"]
			}) : /* @__PURE__ */ H(n, {
				tone: "success",
				children: "Nothing to pay"
			})]
		})
	});
}
var je = te({
	routes: [
		{
			path: "",
			Component: Oe
		},
		{
			path: "me",
			Component: he
		},
		{
			path: "requests/:id",
			Component: xe
		}
	],
	widgets: [{
		id: "mine",
		title: "Ship replacement",
		Component: ke,
		size: "sm",
		order: 45
	}, {
		id: "review",
		title: "SRP queue",
		Component: Ae,
		size: "sm",
		order: 46,
		permission: "srp.review_requests"
	}]
});
//#endregion
export { je as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","absolute","accent","accent-accent","action","actions","add","added","again","align","all","allPicked","allowed","alt","amount","an","and","apply","approve","approved","approves","are","aria-label","as","asked","async","at","attackers","autoFocus","available_corporations","average","await","back","be","been","bg-accent-soft","bg-bg","bg-bg/40","bg-border","bg-danger","bg-success","bg-surface","block","blow","body","boolean","border","border-accent/50","border-border","border-l-2","both","but","button","by","can","canManage","canPay","canReview","can_pay","can_review","cargo","category","character","characters","checkbox","checked","checks","children","claim","claimed","className","coming","confirmLabel","const","corporations","corps","count","counts","covered","coveredOnly","covered_only","created_at","csv","currentColor","cursor-pointer","cx","cy","danger","data","days","decidable","decide","decided","decided_at","decided_by","decision","decision_note","default","defaultPercent","defaultValue","default_percent","description","destroyed","disabled","divide-border","divide-y","do","doctrine","doesn","done","down","dropped","each","either","else","enabled","error","every","everyone","exist","export","extends","external","eyebrow","false","fc","few","fill","final_blow","fit","fits","fitted","fitting","fixed","fleet","fleets","flex","flex-1","flex-col","flex-wrap","font-medium","font-mono","font-normal","font-semibold","footer","for","form","found","from","full","function","gap-1","gap-2","gap-2.5","gap-3","gap-4","gap-5","gap-6","gap-px","general","get","ghost","go","goes","green","grid","group","group_id","h-16","h-28","h-64","h-96","has","have","haven","here","hint","history","hits","hold","hover:bg-hover","hover:text-text","href","icon","icon-sm","icon-xs","icons","id","ids","if","import","in","info","inline","inline-flex","inset-x-0","interactive","interface","is","isLoading","isn","it","items","items-center","items-end","its","justify-between","justify-end","key","kill","killmail","killmail_id","killmails","kind","know","label","land","last","lazy","length","link","list","lists","ll","loading","logi","loss","losses","lost","m12","m14.83","m16.71","m4.93","m6","m7","m9.17","manage_srp","mark","marked","matches","max","max-h-72","max-w-48","max_age_days","may","mb-2","mb-3","mb-4","me","means","member","members","min","min-w-0","min-w-48","mine","ml-2","mode","modules","mono","msg","mt-1","mt-4","must","mutationFn","n","name","navigate","need","new","no","none","noreferrer","not","note","notes","notification","null","number","numeric","object-cover","of","on","onApprove","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpenChange","onReject","onSuccess","onValueChange","once","one","only","op","open","options","or","order","other","out","over","overflow-auto","own","p-3","p-card","page","paid","paid_30d","paid_at","paid_by","pasted","patch","path","pay","pay_requests","payable","payers","payout","payouts","pays","pending","percent","permission","picked","pickedTotal","pills","pilot","place-items-center","placeholder","placeholderData","portrait","post","prices","primary","put","px-3","py-2","py-2.5","qc","queryFn","queryKey","queue","r","rate","re","react","react-router","ready","refetchInterval","refresh","region","reject","rejected","rel","relative","remove","reopen","replacement","request","requests","requireFleet","require_fleet","required","rest","retry","return","review","review_requests","reviewer","reviewers","right","right-click","round","rounded-full","routes","rows","rule","rules","rules_text","s","save","say","search","security","sees","selectable","send","sent","set","setAdding","setAmount","setClaim","setConfirmPay","setDialog","setFc","setFleet","setForm","setLink","setMode","setNote","setNotes","setPayout","setPicked","setQ","setSettingsOpen","setTab","settings","settled","shadow-e2","ship","ships","should","show","shown","shrink-0","site","size","size-2","size-28","size-3","size-3.5","size-4","size-6","size-7","size-9","sm","sm:flex-row","sm:grid-cols-2","sm:grid-cols-3","sm:grid-cols-[1fr_200px]","sm:items-center","so","solidDanger","space-y-1.5","space-y-3","space-y-4","space-y-5","space-y-6","src","srp","starts","status","step","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","strong","structure","style","sub","submit","subtitle","success","suggest","suggested","synced","system","t","tabular-nums","target","text-3xl","text-[11px]","text-accent-ink","text-danger-fg","text-left","text-lg","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-warning-fg","text-xl","text-xs","that","the","their","themselves","then","they","this","ticked","ticker","time","title","to","toast","toggle","told","tone","top-full","totals","tracking-[0.12em]","true","truncate","type","type_id","unclaimed","until","up","uppercase","useMe","useNavigate","useParams","useQuery","useQueryClient","useState","used","user","v","value","variant","victim_alliance","victim_corporation","viewBox","void","w-10","w-20","w-32","w-40","w-60","w-72","w-full","waiting","was","went","what","when","while","whitespace-nowrap","whitespace-pre-line","who","why","widgets","wins","with","withdraw","withdrawn","without","work","works","worth","x","xl","xl:grid-cols-[1fr_380px]","xs","yet","you","your","z-10","zKillboard","zkillboard"];
