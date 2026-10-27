import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardHeader as o, ConfirmDialog as s, DescriptionList as c, Dialog as l, DiscordPings as u, EmptyState as d, Field as f, Input as p, PageHeader as m, SearchInput as h, Segmented as g, Skeleton as _, StatCard as v, Switch as y, SwitchRow as b, THead as x, TabPanel as S, Table as C, TableToolbar as w, Tabs as ee, Td as T, Textarea as E, Th as D, Tr as te, api as O, dateTime as k, definePlugin as A, isk as j, num as ne, timeAgo as M, toast as N, useHasPerm as P } from "@conduit/sdk";
import { useMutation as F, useQuery as I, useQueryClient as L } from "@tanstack/react-query";
import { Link as R, useNavigate as z, useParams as re } from "react-router";
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
}), ie = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ H("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ H("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), ae = (e) => /* @__PURE__ */ U(W, {
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
}), oe = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M12 15V3" }),
		/* @__PURE__ */ H("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
		/* @__PURE__ */ H("path", { d: "m7 10 5 5 5-5" })
	]
}), se = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M5 12h14" }), /* @__PURE__ */ H("path", { d: "M12 5v14" })]
}), J = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [
		/* @__PURE__ */ H("path", { d: "M3 6h18" }),
		/* @__PURE__ */ H("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ H("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), ce = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ H("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })]
}), Y = (e) => /* @__PURE__ */ U(W, {
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
}), le = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M3 7v6h6" }), /* @__PURE__ */ H("path", { d: "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" })]
}), ue = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ H("circle", {
		cx: "12",
		cy: "7",
		r: "4"
	})]
}), de = (e) => /* @__PURE__ */ U(W, {
	...e,
	children: [/* @__PURE__ */ H("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ H("path", { d: "M19 12H5" })]
}), X = "/api/p/srp", fe = {
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
function pe({ status: e }) {
	return /* @__PURE__ */ H(n, {
		tone: fe[e].tone,
		children: fe[e].label
	});
}
function Z({ ship: e, sub: t }) {
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
function Q({ system: e }) {
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
function me({ loss: e, requireFleet: t, onClose: n }) {
	let i = L(), a = z(), [o, s] = B(""), [c, u] = B(""), [d, m] = B(""), [h, g] = B(""), _ = F({
		mutationFn: () => O.post(`${X}/requests`, {
			killmail_id: e?.killmail_id ?? null,
			link: e ? "" : o,
			fleet: c,
			fc: d,
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
		title: e ? `Claim ${e.character.name}'s ${e.ship.name}` : "Claim a loss from a link",
		description: e ? `Rules suggest ${j(e.suggested, { full: !0 })} for this loss.` : "For losses that haven't shown up on their own.",
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
					children: /* @__PURE__ */ H(Z, {
						ship: e.ship,
						sub: /* @__PURE__ */ H(Q, { system: e.system })
					})
				}) : /* @__PURE__ */ H(f, {
					label: "Kill link",
					hint: "A zKillboard link, or in game: open the killmail, right-click → \"Copy external kill link\".",
					required: !0,
					children: /* @__PURE__ */ H(p, {
						value: o,
						onChange: (e) => s(e.target.value),
						placeholder: "https://zkillboard.com/kill/123456789/",
						className: "font-mono text-xs",
						autoFocus: !0
					})
				}),
				/* @__PURE__ */ U("div", {
					className: "grid gap-4 sm:grid-cols-[1fr_200px]",
					children: [/* @__PURE__ */ H(f, {
						label: "Fleet",
						required: t,
						hint: "Op name or the fleet ping.",
						children: /* @__PURE__ */ H(p, {
							value: c,
							onChange: (e) => u(e.target.value),
							placeholder: "Sunday CTA, Stratop…",
							autoFocus: !!e
						})
					}), /* @__PURE__ */ H(f, {
						label: "FC",
						children: /* @__PURE__ */ H(p, {
							value: d,
							onChange: (e) => m(e.target.value)
						})
					})]
				}),
				/* @__PURE__ */ H(f, {
					label: "Anything the reviewers should know",
					children: /* @__PURE__ */ H(E, {
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
function he() {
	let e = P("srp.review_requests"), t = P("srp.pay_requests");
	return e || t;
}
function ge() {
	return I({
		queryKey: ["srp", "me"],
		queryFn: () => O.get(`${X}/me`)
	});
}
function _e() {
	let t = z(), n = he(), { data: a, isLoading: s } = ge(), [c, l] = B(null);
	return /* @__PURE__ */ U(V, { children: [
		/* @__PURE__ */ H(m, {
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
					children: [/* @__PURE__ */ H(ce, {}), " Claim from a link"]
				})]
			})
		}),
		s || !a ? /* @__PURE__ */ H("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ H(_, { className: "h-28" }, e))
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
						/* @__PURE__ */ H(v, {
							label: "Waiting for review",
							value: a.totals.pending,
							hint: a.totals.pending === 1 ? "request" : "requests",
							tone: a.totals.pending ? "info" : void 0
						}),
						/* @__PURE__ */ H(v, {
							label: "Approved, not paid yet",
							value: j(a.totals.approved),
							mono: !0,
							tone: a.totals.approved ? "accent" : void 0
						}),
						/* @__PURE__ */ H(v, {
							label: "Paid to you",
							value: j(a.totals.paid),
							mono: !0,
							tone: a.totals.paid ? "success" : void 0,
							hint: "all time"
						})
					]
				}),
				/* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, {
					title: "Losses you can claim",
					description: `From the last ${a.settings.max_age_days} days, found in your characters' killmails.`
				}), a.losses.length === 0 ? /* @__PURE__ */ H(d, {
					icon: /* @__PURE__ */ H(G, {}),
					title: "No unclaimed losses",
					description: "Losses show up here once your characters' killmails have synced (they need the killmail scope). Missing one? Claim it from its zKillboard link."
				}) : /* @__PURE__ */ U(C, { children: [/* @__PURE__ */ H(x, { children: /* @__PURE__ */ U("tr", { children: [
					/* @__PURE__ */ H(D, { children: "Ship" }),
					/* @__PURE__ */ H(D, { children: "Where" }),
					/* @__PURE__ */ H(D, { children: "When" }),
					/* @__PURE__ */ H(D, {
						align: "right",
						children: "Loss"
					}),
					/* @__PURE__ */ H(D, {
						align: "right",
						children: "Payout"
					}),
					/* @__PURE__ */ H(D, {})
				] }) }), /* @__PURE__ */ H("tbody", { children: a.losses.map((e) => /* @__PURE__ */ U(te, { children: [
					/* @__PURE__ */ H(T, { children: /* @__PURE__ */ H(Z, {
						ship: e.ship,
						sub: e.character.name
					}) }),
					/* @__PURE__ */ H(T, {
						className: "text-sm",
						children: /* @__PURE__ */ H(Q, { system: e.system })
					}),
					/* @__PURE__ */ H(T, {
						className: "whitespace-nowrap text-sm text-muted",
						children: M(e.time)
					}),
					/* @__PURE__ */ H(T, {
						numeric: !0,
						className: "text-muted",
						children: j(e.value)
					}),
					/* @__PURE__ */ H(T, {
						numeric: !0,
						children: e.suggested == null ? /* @__PURE__ */ H("span", {
							className: "text-subtle",
							children: "not covered"
						}) : j(e.suggested)
					}),
					/* @__PURE__ */ H(T, {
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
									children: /* @__PURE__ */ H(ie, {})
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
				/* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, { title: "My requests" }), a.requests.length === 0 ? /* @__PURE__ */ H(d, {
					icon: /* @__PURE__ */ H(G, {}),
					title: "You haven't asked for SRP yet"
				}) : /* @__PURE__ */ U(C, { children: [/* @__PURE__ */ H(x, { children: /* @__PURE__ */ U("tr", { children: [
					/* @__PURE__ */ H(D, { children: "Ship" }),
					/* @__PURE__ */ H(D, { children: "Fleet" }),
					/* @__PURE__ */ H(D, { children: "Sent" }),
					/* @__PURE__ */ H(D, {
						align: "right",
						children: "Payout"
					}),
					/* @__PURE__ */ H(D, {
						align: "right",
						children: "Status"
					})
				] }) }), /* @__PURE__ */ H("tbody", { children: a.requests.map((e) => /* @__PURE__ */ U(te, {
					interactive: !0,
					onClick: () => t(`/p/srp/requests/${e.id}`),
					children: [
						/* @__PURE__ */ H(T, { children: /* @__PURE__ */ H(Z, {
							ship: e.ship,
							sub: e.character.name
						}) }),
						/* @__PURE__ */ H(T, {
							className: "text-sm text-muted",
							children: e.fleet || "—"
						}),
						/* @__PURE__ */ H(T, {
							className: "whitespace-nowrap text-sm text-muted",
							children: M(e.created_at)
						}),
						/* @__PURE__ */ H(T, {
							numeric: !0,
							children: j(e.payout ?? e.suggested)
						}),
						/* @__PURE__ */ H(T, {
							align: "right",
							children: /* @__PURE__ */ H(pe, { status: e.status })
						})
					]
				}, e.id)) })] })] })
			]
		}),
		c && /* @__PURE__ */ H(me, {
			loss: c === "link" ? null : c,
			requireFleet: a?.settings.require_fleet ?? !0,
			onClose: () => l(null)
		})
	] });
}
//#endregion
//#region src/settings.tsx
var ve = ["srp", "settings"];
function ye({ onClose: e }) {
	let t = L(), { data: n } = I({
		queryKey: ve,
		queryFn: () => O.get(`${X}/settings`)
	}), [i, a] = B(null), o = i ?? n ?? null, s = F({
		mutationFn: (e) => O.put(`${X}/settings`, e),
		onSuccess: (n) => {
			t.setQueryData(ve, n), t.invalidateQueries({ queryKey: ["srp"] }), N.success("Saved"), e();
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
		children: o ? /* @__PURE__ */ U(ee, {
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
				/* @__PURE__ */ H(S, {
					value: "ships",
					children: /* @__PURE__ */ H(xe, {
						rules: n?.rules ?? [],
						defaultPercent: o.default_percent,
						coveredOnly: o.covered_only
					})
				}),
				/* @__PURE__ */ H(S, {
					value: "general",
					children: /* @__PURE__ */ U("div", {
						className: "space-y-5",
						children: [
							/* @__PURE__ */ H(f, {
								label: "Default payout (% of the loss's value)",
								hint: "For ships without a rule of their own or for their group.",
								children: /* @__PURE__ */ H("div", { children: /* @__PURE__ */ H(p, {
									type: "number",
									min: 0,
									max: 1e3,
									step: 5,
									value: o.default_percent,
									onChange: (e) => c({ default_percent: Number(e.target.value) }),
									className: "w-32 font-mono"
								}) })
							}),
							/* @__PURE__ */ H(f, {
								label: "Claims allowed for (days)",
								children: /* @__PURE__ */ H("div", { children: /* @__PURE__ */ H(p, {
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
								children: [/* @__PURE__ */ H(b, {
									label: "Only ships with a rule",
									description: "Ships without a rule (for themselves or their group) can't be claimed.",
									checked: o.covered_only,
									onCheckedChange: (e) => c({ covered_only: e })
								}), /* @__PURE__ */ H(b, {
									label: "Ask for the fleet",
									description: "Members must name the fleet or op they lost the ship on.",
									checked: o.require_fleet,
									onCheckedChange: (e) => c({ require_fleet: e })
								})]
							}),
							/* @__PURE__ */ H(f, {
								label: "Rules shown to members",
								hint: "Which fleets count, doctrine fits, when payouts go out…",
								children: /* @__PURE__ */ H(E, {
									rows: 4,
									value: o.rules_text,
									onChange: (e) => c({ rules_text: e.target.value }),
									placeholder: "Strategic and CTA fleets only. Doctrine fits get the full payout. Payouts go out every Sunday."
								})
							}),
							/* @__PURE__ */ H(u, { plugin: "srp" })
						]
					})
				}),
				/* @__PURE__ */ U(S, {
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
							] }), /* @__PURE__ */ H(y, {
								checked: o.corporations.includes(e.id),
								onCheckedChange: (t) => c({ corporations: t ? [...o.corporations, e.id] : o.corporations.filter((t) => t !== e.id) })
							})]
						}, e.id))
					})]
				})
			]
		}) : /* @__PURE__ */ H(_, { className: "h-64" })
	});
}
function be(e, t) {
	return e.covered ? e.payout == null ? /* @__PURE__ */ U("span", {
		className: "font-mono tabular-nums",
		children: [e.percent ?? t, "% of the loss"]
	}) : /* @__PURE__ */ H("span", {
		className: "font-mono tabular-nums",
		children: j(e.payout, { full: !0 })
	}) : /* @__PURE__ */ H(n, {
		tone: "danger",
		children: "not covered"
	});
}
function xe({ rules: e, defaultPercent: t, coveredOnly: n }) {
	let i = L(), [a, o] = B(""), [s, c] = B(null), [l, u] = B("fixed"), [f, m] = B(""), [_, v] = B(""), { data: y } = I({
		queryKey: [
			"srp",
			"ships",
			a
		],
		queryFn: () => O.get(`${X}/ships?q=${encodeURIComponent(a)}`),
		enabled: a.trim().length >= 2 && !s
	}), b = () => i.invalidateQueries({ queryKey: ve }), x = F({
		mutationFn: () => O.post(`${X}/rules`, {
			type_id: s?.kind === "ship" ? s.id : null,
			group_id: s?.kind === "group" ? s.id : null,
			covered: l !== "none",
			payout: l === "fixed" ? Number(f) : null,
			percent: l === "percent" ? Number(f) : null,
			note: _
		}),
		onSuccess: (e) => {
			N.success(`Rule added for ${e.name}`), c(null), o(""), m(""), v(""), b();
		},
		onError: (e) => N.error(e.message)
	}), S = F({
		mutationFn: (e) => O.delete(`${X}/rules/${e}`),
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
							/* @__PURE__ */ H(g, {
								value: l,
								onChange: u,
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
							l !== "none" && /* @__PURE__ */ H(p, {
								type: "number",
								min: 0,
								value: f,
								onChange: (e) => m(e.target.value),
								placeholder: l === "fixed" ? "60000000" : "100",
								className: "w-40 font-mono"
							}),
							/* @__PURE__ */ H(p, {
								value: _,
								onChange: (e) => v(e.target.value),
								placeholder: "Note (optional), e.g. doctrine fit only",
								className: "min-w-48 flex-1"
							}),
							/* @__PURE__ */ U(r, {
								variant: "primary",
								size: "sm",
								disabled: l !== "none" && !(Number(f) >= 0 && f !== ""),
								loading: x.isPending,
								onClick: () => x.mutate(),
								children: [/* @__PURE__ */ H(se, {}), " Add"]
							})
						]
					})]
				}) : /* @__PURE__ */ U("div", {
					className: "relative",
					children: [/* @__PURE__ */ H(h, {
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
			e.length === 0 ? /* @__PURE__ */ H(d, {
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
							children: be(e, t)
						}),
						/* @__PURE__ */ H(r, {
							variant: "ghost",
							size: "icon-xs",
							"aria-label": `Remove the rule for ${e.name}`,
							onClick: () => S.mutate(e.id),
							children: /* @__PURE__ */ H(J, {})
						})
					]
				}, e.id))
			})
		]
	});
}
//#endregion
//#region src/queue.tsx
function Se() {
	let e = L(), n = z(), a = P("srp.pay_requests"), o = P("srp.manage_srp"), c = P("srp.review_requests"), [l, u] = B(c ? "pending" : "approved"), [f, p] = B(""), [g, y] = B(/* @__PURE__ */ new Set()), [b, S] = B(!1), [E, k] = B(!1), { data: A, isLoading: ne } = I({
		queryKey: [
			"srp",
			"queue",
			l,
			f
		],
		queryFn: () => O.get(`${X}/queue?status=${l}&q=${encodeURIComponent(f)}`),
		placeholderData: (e) => e
	}), re = F({
		mutationFn: (e) => O.post(`${X}/paid`, { ids: e }),
		onSuccess: (t) => {
			y(/* @__PURE__ */ new Set()), e.invalidateQueries({ queryKey: ["srp"] }), N.success(`${t.paid} request${t.paid === 1 ? "" : "s"} marked paid`), t.skipped_own && N.warning(`${t.skipped_own} of them ${t.skipped_own === 1 ? "is" : "are"} your own; someone else has to pay ${t.skipped_own === 1 ? "it" : "them"}`);
		},
		onError: (e) => N.error(e.message)
	}), W = (A?.requests ?? []).filter((e) => e.status === "approved"), K = a && W.length > 0, q = W.filter((e) => g.has(e.id)).reduce((e, t) => e + (t.payout ?? 0), 0), ie = (e) => y((t) => {
		let n = new Set(t);
		return n.has(e) ? n.delete(e) : n.add(e), n;
	}), se = W.length > 0 && W.every((e) => g.has(e.id));
	return /* @__PURE__ */ U(V, { children: [
		/* @__PURE__ */ H(m, {
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
							children: [/* @__PURE__ */ H(ue, {}), " Mine"]
						})
					}),
					a && /* @__PURE__ */ H("a", {
						href: "/api/p/srp/queue.csv",
						download: !0,
						children: /* @__PURE__ */ U(r, {
							variant: "ghost",
							children: [/* @__PURE__ */ H(oe, {}), " Payouts CSV"]
						})
					}),
					o && /* @__PURE__ */ U(r, {
						onClick: () => S(!0),
						children: [/* @__PURE__ */ H(ae, {}), " Rules"]
					})
				]
			})
		}),
		!A && ne ? /* @__PURE__ */ H("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ H(_, { className: "h-28" }, e))
		}) : A ? /* @__PURE__ */ U("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ U("div", {
					className: "grid gap-4 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ H(v, {
							label: "Waiting for review",
							value: A.counts.pending,
							hint: `${j(A.totals.pending)} suggested`,
							tone: A.counts.pending ? "info" : void 0
						}),
						/* @__PURE__ */ H(v, {
							label: "Approved, to pay",
							value: j(A.totals.approved),
							mono: !0,
							hint: `${A.counts.approved} request${A.counts.approved === 1 ? "" : "s"}`,
							tone: A.counts.approved ? "accent" : void 0
						}),
						/* @__PURE__ */ H(v, {
							label: "Paid in the last 30 days",
							value: j(A.totals.paid_30d),
							mono: !0,
							tone: "success"
						})
					]
				}),
				/* @__PURE__ */ H(ee, {
					variant: "pills",
					value: l,
					onValueChange: (e) => {
						u(e), y(/* @__PURE__ */ new Set());
					},
					items: [
						{
							value: "pending",
							label: "Pending",
							count: A.counts.pending
						},
						{
							value: "approved",
							label: "Approved",
							count: A.counts.approved
						},
						{
							value: "rejected",
							label: "Rejected",
							count: A.counts.rejected
						},
						{
							value: "paid",
							label: "Paid",
							count: A.counts.paid
						},
						{
							value: "all",
							label: "All"
						}
					]
				}),
				/* @__PURE__ */ U(i, { children: [/* @__PURE__ */ U(w, { children: [/* @__PURE__ */ H(h, {
					value: f,
					onChange: (e) => p(e.target.value),
					placeholder: "Pilot, ship, fleet or FC",
					className: "w-72"
				}), K && g.size > 0 && /* @__PURE__ */ U(r, {
					variant: "primary",
					size: "sm",
					onClick: () => k(!0),
					children: [
						/* @__PURE__ */ H(Y, {}),
						" Mark ",
						g.size,
						" paid · ",
						j(q)
					]
				})] }), A.requests.length === 0 ? /* @__PURE__ */ H(d, {
					icon: /* @__PURE__ */ H(G, {}),
					title: l === "pending" ? "Nothing waiting for review" : "No requests here",
					description: f ? "Nothing matches the search." : void 0
				}) : /* @__PURE__ */ U(C, { children: [/* @__PURE__ */ H(x, { children: /* @__PURE__ */ U("tr", { children: [
					K && /* @__PURE__ */ H(D, {
						className: "w-10",
						children: /* @__PURE__ */ H("input", {
							type: "checkbox",
							className: "size-4 accent-accent",
							checked: se,
							onChange: () => y(se ? /* @__PURE__ */ new Set() : new Set(W.map((e) => e.id))),
							"aria-label": "Pick every approved request"
						})
					}),
					/* @__PURE__ */ H(D, { children: "Pilot" }),
					/* @__PURE__ */ H(D, { children: "Ship" }),
					/* @__PURE__ */ H(D, { children: "Where" }),
					/* @__PURE__ */ H(D, { children: "Fleet" }),
					/* @__PURE__ */ H(D, {
						align: "right",
						children: "Loss"
					}),
					/* @__PURE__ */ H(D, {
						align: "right",
						children: "Payout"
					}),
					/* @__PURE__ */ H(D, {
						align: "right",
						children: "Status"
					})
				] }) }), /* @__PURE__ */ H("tbody", { children: A.requests.map((e) => /* @__PURE__ */ U(te, {
					interactive: !0,
					onClick: () => n(`/p/srp/requests/${e.id}`),
					children: [
						K && /* @__PURE__ */ H(T, {
							onClick: (e) => e.stopPropagation(),
							children: e.status === "approved" && /* @__PURE__ */ H("input", {
								type: "checkbox",
								className: "size-4 accent-accent",
								checked: g.has(e.id),
								onChange: () => ie(e.id),
								"aria-label": `Pick request ${e.id}`
							})
						}),
						/* @__PURE__ */ H(T, { children: /* @__PURE__ */ U("div", {
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
						/* @__PURE__ */ H(T, { children: /* @__PURE__ */ H(Z, { ship: e.ship }) }),
						/* @__PURE__ */ H(T, {
							className: "text-sm",
							children: /* @__PURE__ */ H(Q, { system: e.system })
						}),
						/* @__PURE__ */ U(T, {
							className: "max-w-48 truncate text-sm text-muted",
							children: [e.fleet || "—", e.fc ? /* @__PURE__ */ U("span", {
								className: "text-subtle",
								children: [" · ", e.fc]
							}) : null]
						}),
						/* @__PURE__ */ H(T, {
							numeric: !0,
							className: "text-muted",
							children: j(e.value)
						}),
						/* @__PURE__ */ H(T, {
							numeric: !0,
							children: j(e.payout ?? e.suggested)
						}),
						/* @__PURE__ */ H(T, {
							align: "right",
							children: /* @__PURE__ */ H(pe, { status: e.status })
						})
					]
				}, e.id)) })] })] })
			]
		}) : null,
		b && /* @__PURE__ */ H(ye, { onClose: () => S(!1) }),
		/* @__PURE__ */ H(s, {
			open: E,
			onOpenChange: k,
			title: `Mark ${g.size} request${g.size === 1 ? "" : "s"} paid?`,
			description: `${j(q, { full: !0 })} in total. Each pilot is told their SRP has been paid, so send the ISK first.`,
			confirmLabel: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(Y, {}), " Mark paid"] }),
			onConfirm: () => re.mutateAsync([...g])
		})
	] });
}
//#endregion
//#region src/request.tsx
function Ce() {
	let { id: e } = re(), l = L(), u = z(), f = [
		"srp",
		"request",
		e
	], { data: p, isLoading: h, error: g } = I({
		queryKey: f,
		queryFn: () => O.get(`${X}/requests/${e}`),
		retry: !1
	}), [v, y] = B(null), b = (e, t) => {
		l.setQueryData(f, e), l.invalidateQueries({ queryKey: ["srp", "queue"] }), l.invalidateQueries({ queryKey: ["srp", "me"] }), N.success(t), y(null);
	}, x = F({
		mutationFn: (t) => O.post(`${X}/requests/${e}/decide`, t),
		onSuccess: (e) => b(e, e.status === "approved" ? "Approved; the pilot has been told" : e.status === "rejected" ? "Rejected; the pilot has been told" : "Back in the queue"),
		onError: (e) => N.error(e.message)
	}), S = F({
		mutationFn: () => O.post(`${X}/paid`, { ids: [Number(e)] }),
		onSuccess: async () => {
			await l.invalidateQueries({ queryKey: ["srp"] }), N.success("Marked paid; the pilot has been told"), y(null);
		},
		onError: (e) => N.error(e.message)
	}), C = F({
		mutationFn: () => O.delete(`${X}/requests/${e}`),
		onSuccess: () => {
			l.invalidateQueries({ queryKey: ["srp"] }), N.success("Request withdrawn"), u("/p/srp/me");
		},
		onError: (e) => N.error(e.message)
	});
	if (g) return /* @__PURE__ */ H(d, {
		icon: /* @__PURE__ */ H(G, {}),
		title: "This request doesn't exist",
		description: "It may have been withdrawn.",
		action: /* @__PURE__ */ H(R, {
			to: "/p/srp",
			children: /* @__PURE__ */ H(r, { children: "Back to SRP" })
		})
	});
	if (h || !p) return /* @__PURE__ */ H(_, { className: "h-96" });
	let w = p.can_review && !p.mine;
	return /* @__PURE__ */ U(V, { children: [
		/* @__PURE__ */ H(m, {
			eyebrow: /* @__PURE__ */ U(R, {
				to: p.mine && !p.can_review ? "/p/srp/me" : "/p/srp",
				className: "inline-flex items-center gap-1 hover:text-text",
				children: [/* @__PURE__ */ H(de, { className: "size-3" }), " Ship replacement"]
			}),
			title: /* @__PURE__ */ U("span", {
				className: "flex flex-wrap items-center gap-3",
				children: [
					p.character.name,
					"'s ",
					p.ship.name,
					" ",
					/* @__PURE__ */ H(pe, { status: p.status })
				]
			}),
			description: /* @__PURE__ */ U(V, { children: [
				"Lost ",
				k(p.time),
				" in ",
				/* @__PURE__ */ H(Q, { system: p.system })
			] }),
			actions: /* @__PURE__ */ U("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ H("a", {
						href: p.zkillboard,
						target: "_blank",
						rel: "noreferrer",
						children: /* @__PURE__ */ U(r, {
							variant: "ghost",
							children: [/* @__PURE__ */ H(ie, {}), " zKillboard"]
						})
					}),
					p.mine && p.status === "pending" && /* @__PURE__ */ U(r, {
						variant: "danger",
						onClick: () => y("withdraw"),
						children: [/* @__PURE__ */ H(J, {}), " Withdraw"]
					}),
					w && (p.status === "approved" || p.status === "rejected") && /* @__PURE__ */ U(r, {
						variant: "ghost",
						onClick: () => y("reopen"),
						children: [/* @__PURE__ */ H(le, {}), " Reopen"]
					}),
					w && p.status !== "paid" && p.status !== "rejected" && /* @__PURE__ */ U(r, {
						variant: "danger",
						onClick: () => y("reject"),
						children: [/* @__PURE__ */ H(q, {}), " Reject"]
					}),
					w && (p.status === "pending" || p.status === "rejected") && /* @__PURE__ */ U(r, {
						variant: "success",
						onClick: () => y("approve"),
						children: [/* @__PURE__ */ H(K, {}), " Approve"]
					}),
					p.can_pay && !p.mine && p.status === "approved" && /* @__PURE__ */ U(r, {
						variant: "primary",
						onClick: () => y("pay"),
						children: [/* @__PURE__ */ H(Y, {}), " Mark paid"]
					})
				]
			})
		}),
		/* @__PURE__ */ U("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_380px]",
			children: [/* @__PURE__ */ U("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ H(Te, { data: p }),
					/* @__PURE__ */ H(i, { children: /* @__PURE__ */ U("div", {
						className: "flex flex-col gap-5 p-card sm:flex-row sm:items-center",
						children: [/* @__PURE__ */ H("img", {
							src: p.ship.icon.replace("/icon?", "/render?").replace(/size=\d+/, "size=256"),
							alt: "",
							className: "size-28 shrink-0 border border-border bg-bg object-cover"
						}), /* @__PURE__ */ U("div", {
							className: "grid flex-1 gap-4 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ H($, {
									label: "Loss value",
									value: j(p.value, { full: !0 }),
									hint: "ship and modules, average prices"
								}),
								/* @__PURE__ */ H($, {
									label: "Rules suggest",
									value: j(p.suggested, { full: !0 }),
									hint: we(p)
								}),
								/* @__PURE__ */ H($, {
									label: "Payout",
									value: j(p.payout, { full: !0 }),
									hint: p.status === "paid" ? `paid ${M(p.paid_at)}` : p.payout ? "approved" : "not decided yet",
									strong: !0
								})
							]
						})]
					}) }),
					/* @__PURE__ */ H(Ee, { data: p })
				]
			}), /* @__PURE__ */ U("div", {
				className: "space-y-6",
				children: [/* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, { title: "Request" }), /* @__PURE__ */ U(a, { children: [
					/* @__PURE__ */ U("div", {
						className: "mb-4 flex items-center gap-3",
						children: [/* @__PURE__ */ H(t, {
							src: p.user.portrait,
							name: p.user.name
						}), /* @__PURE__ */ U("div", { children: [/* @__PURE__ */ H("div", {
							className: "font-medium",
							children: p.user.name
						}), /* @__PURE__ */ U("div", {
							className: "text-xs text-subtle",
							children: ["sent ", M(p.created_at)]
						})] })]
					}),
					/* @__PURE__ */ H(c, { items: [
						{
							label: "Pay to",
							value: p.character.name
						},
						{
							label: "Fleet",
							value: p.fleet || "—"
						},
						{
							label: "FC",
							value: p.fc || "—"
						},
						{
							label: "Corporation",
							value: p.victim_corporation ?? "—"
						},
						...p.victim_alliance ? [{
							label: "Alliance",
							value: p.victim_alliance
						}] : [],
						{
							label: "Final blow",
							value: p.final_blow ?? "NPC / structure"
						},
						{
							label: "Attackers",
							value: ne(p.attackers)
						}
					] }),
					p.notes && /* @__PURE__ */ H("div", {
						className: "mt-4 border-l-2 border-accent/50 bg-bg/40 px-3 py-2 text-sm whitespace-pre-line",
						children: p.notes
					})
				] })] }), p.can_review && /* @__PURE__ */ U(i, { children: [/* @__PURE__ */ H(o, {
					title: "Earlier requests",
					description: "This member's other SRP requests."
				}), /* @__PURE__ */ U(a, {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ U(n, {
							tone: "success",
							children: [p.history.paid, " paid"]
						}),
						/* @__PURE__ */ U(n, {
							tone: "accent",
							children: [p.history.approved, " approved"]
						}),
						/* @__PURE__ */ U(n, {
							tone: "danger",
							children: [p.history.rejected, " rejected"]
						}),
						/* @__PURE__ */ U(n, {
							tone: "info",
							children: [p.history.pending, " pending"]
						})
					]
				})] })]
			})]
		}),
		v === "approve" && /* @__PURE__ */ H(De, {
			data: p,
			pending: x.isPending,
			onClose: () => y(null),
			onApprove: (e, t) => x.mutate({
				decision: "approve",
				payout: e,
				note: t
			})
		}),
		v === "reject" && /* @__PURE__ */ H(Oe, {
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
			description: `Send ${j(p.payout, { full: !0 })} to ${p.character.name} first; they're told it has been paid.`,
			confirmLabel: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(Y, {}), " Mark paid"] }),
			onConfirm: () => S.mutateAsync()
		}),
		/* @__PURE__ */ H(s, {
			open: v === "withdraw",
			onOpenChange: (e) => !e && y(null),
			title: "Withdraw this request?",
			description: "The loss goes back to your list, so you can claim it again later.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(J, {}), " Withdraw"] }),
			onConfirm: () => C.mutateAsync()
		}),
		/* @__PURE__ */ H(s, {
			open: v === "reopen",
			onOpenChange: (e) => !e && y(null),
			title: "Put this request back in the queue?",
			description: "The decision and its note are cleared. The pilot isn't told.",
			confirmLabel: /* @__PURE__ */ U(V, { children: [/* @__PURE__ */ H(le, {}), " Reopen"] }),
			onConfirm: () => x.mutateAsync({ decision: "reopen" })
		})
	] });
}
function we(e) {
	let t = e.rule;
	return t ? t.payout == null ? t.percent == null ? `default rate (${t.name})` : `${t.percent}% for ${t.name}` : `fixed for ${t.name}` : "default rate";
}
function $({ label: e, value: t, hint: n, strong: r }) {
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
function Te({ data: t }) {
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
		title: `Approved by ${t.decided_by ?? "a reviewer"}: ${j(t.payout, { full: !0 })}`,
		children: t.decision_note ? /* @__PURE__ */ H("span", {
			className: "whitespace-pre-line",
			children: t.decision_note
		}) : "Waiting to be paid."
	}) : /* @__PURE__ */ U(e, {
		tone: "success",
		title: `Paid ${j(t.payout, { full: !0 })} to ${t.character.name}`,
		children: [t.paid_by ? `Marked paid by ${t.paid_by} on ${k(t.paid_at)}.` : `Paid ${k(t.paid_at)}.`, t.decision_note ? /* @__PURE__ */ H("span", {
			className: "mt-1 block whitespace-pre-line",
			children: t.decision_note
		}) : null]
	});
}
function Ee({ data: e }) {
	return e.fitting.length === 0 ? /* @__PURE__ */ H(i, { children: /* @__PURE__ */ H(d, {
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
								children: [ne(e.destroyed + e.dropped), "× "]
							}), e.name]
						}),
						/* @__PURE__ */ H("span", {
							className: `size-2 shrink-0 rounded-full ${e.dropped ? "bg-success" : "bg-danger"}`,
							title: e.dropped ? "Dropped" : "Destroyed"
						}),
						/* @__PURE__ */ H("span", {
							className: "w-20 shrink-0 text-right font-mono text-xs tabular-nums text-subtle",
							children: j(e.value)
						})
					]
				}, t))
			})]
		}, e.label))
	})] });
}
function De({ data: e, pending: t, onClose: n, onApprove: i }) {
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
				u > 0 ? j(u) : ""
			]
		})] }),
		children: /* @__PURE__ */ U("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ H(f, {
				label: "Payout (ISK)",
				hint: `Rules suggest ${j(e.suggested, { full: !0 })}; the loss was worth ${j(e.value, { full: !0 })}.`,
				children: /* @__PURE__ */ H(p, {
					type: "number",
					min: 0,
					step: 1e3,
					value: a,
					onChange: (e) => o(e.target.value),
					className: "w-60 font-mono",
					autoFocus: !0
				})
			}), /* @__PURE__ */ H(f, {
				label: "Note to the pilot",
				hint: "Optional.",
				children: /* @__PURE__ */ H(E, {
					rows: 2,
					value: s,
					onChange: (e) => c(e.target.value),
					placeholder: "Paid at the doctrine rate."
				})
			})]
		})
	});
}
function Oe({ pending: e, onClose: t, onReject: n }) {
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
		children: /* @__PURE__ */ H(f, {
			label: "Why",
			required: !0,
			children: /* @__PURE__ */ H(E, {
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
function ke() {
	return he() ? /* @__PURE__ */ H(Se, {}) : /* @__PURE__ */ H(_e, {});
}
function Ae() {
	let { data: e, isLoading: t } = ge();
	return t ? /* @__PURE__ */ H(_, { className: "h-16" }) : e ? /* @__PURE__ */ H(R, {
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
				children: [j(e.totals.approved), " coming"]
			}) : /* @__PURE__ */ H(n, {
				tone: "success",
				children: "All settled"
			})]
		})
	}) : null;
}
function je() {
	let { data: e, isLoading: t } = I({
		queryKey: [
			"srp",
			"queue",
			"pending",
			""
		],
		queryFn: () => O.get(`${X}/queue?status=pending`),
		refetchInterval: 12e4
	});
	return t || !e ? /* @__PURE__ */ H(_, { className: "h-16" }) : /* @__PURE__ */ H(R, {
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
					children: [j(e.totals.pending), " suggested"]
				})
			] }), e.counts.approved > 0 ? /* @__PURE__ */ U(n, {
				tone: "accent",
				children: [j(e.totals.approved), " to pay"]
			}) : /* @__PURE__ */ H(n, {
				tone: "success",
				children: "Nothing to pay"
			})]
		})
	});
}
var Me = A({
	routes: [
		{
			path: "",
			Component: ke
		},
		{
			path: "me",
			Component: _e
		},
		{
			path: "requests/:id",
			Component: Ce
		}
	],
	widgets: [{
		id: "mine",
		title: "Ship replacement",
		Component: Ae,
		size: "sm",
		order: 45
	}, {
		id: "review",
		title: "SRP queue",
		Component: je,
		size: "sm",
		order: 46,
		permission: "srp.review_requests"
	}]
});
//#endregion
export { Me as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","absolute","accent","accent-accent","action","actions","add","added","again","align","all","allPicked","allowed","alt","amount","an","and","apply","approve","approved","approves","are","aria-label","as","asked","async","at","attackers","autoFocus","available_corporations","average","await","back","be","been","bg-accent-soft","bg-bg","bg-bg/40","bg-border","bg-danger","bg-success","bg-surface","block","blow","body","boolean","border","border-accent/50","border-border","border-l-2","both","but","button","by","can","canManage","canPay","canReview","can_pay","can_review","cargo","category","character","characters","checkbox","checked","checks","children","claim","claimed","className","coming","confirmLabel","const","corporations","corps","count","counts","covered","coveredOnly","covered_only","created_at","csv","currentColor","cursor-pointer","cx","cy","danger","data","days","decidable","decide","decided","decided_at","decided_by","decision","decision_note","default","defaultPercent","defaultValue","default_percent","description","destroyed","disabled","divide-border","divide-y","do","doctrine","doesn","done","down","dropped","each","either","else","enabled","error","every","everyone","exist","export","extends","external","eyebrow","false","fc","few","fill","final_blow","fit","fits","fitted","fitting","fixed","fleet","fleets","flex","flex-1","flex-col","flex-wrap","font-medium","font-mono","font-normal","font-semibold","footer","for","form","found","from","full","function","game","gap-1","gap-2","gap-2.5","gap-3","gap-4","gap-5","gap-6","gap-px","general","get","ghost","go","goes","green","grid","group","group_id","h-16","h-28","h-64","h-96","has","have","haven","here","hint","history","hits","hold","hover:bg-hover","hover:text-text","href","icon","icon-sm","icon-xs","icons","id","ids","if","import","in","info","inline","inline-flex","inset-x-0","interactive","interface","is","isLoading","isn","it","items","items-center","items-end","its","justify-between","justify-end","key","kill","killmail","killmail_id","killmails","kind","know","label","land","last","lazy","length","link","list","lists","ll","loading","logi","loss","losses","lost","m12","m14.83","m16.71","m4.93","m6","m7","m9.17","manage_srp","mark","marked","matches","max","max-h-72","max-w-48","max_age_days","may","mb-2","mb-3","mb-4","me","means","member","members","min","min-w-0","min-w-48","mine","ml-2","mode","modules","mono","msg","mt-1","mt-4","must","mutationFn","n","name","navigate","need","new","no","none","noreferrer","not","note","notes","notification","null","number","numeric","object-cover","of","on","onApprove","onChange","onCheckedChange","onClick","onClose","onConfirm","onError","onOpenChange","onReject","onSuccess","onValueChange","once","one","only","op","open","options","or","order","other","out","over","overflow-auto","own","p-3","p-card","page","paid","paid_30d","paid_at","paid_by","pasted","patch","path","pay","pay_requests","payable","payers","payout","payouts","pays","pending","percent","permission","picked","pickedTotal","pills","pilot","place-items-center","placeholder","placeholderData","plugin","portrait","post","prices","primary","put","px-3","py-2","py-2.5","qc","queryFn","queryKey","queue","r","rate","re","react","react-router","ready","refetchInterval","refresh","region","reject","rejected","rel","relative","remove","reopen","replacement","request","requests","requireFleet","require_fleet","required","rest","retry","return","review","review_requests","reviewer","reviewers","right","right-click","round","rounded-full","routes","rows","rule","rules","rules_text","s","save","say","search","security","sees","selectable","send","sent","set","setAdding","setAmount","setClaim","setConfirmPay","setDialog","setFc","setFleet","setForm","setLink","setMode","setNote","setNotes","setPayout","setPicked","setQ","setSettingsOpen","setTab","settings","settled","shadow-e2","ship","ships","should","show","shown","shrink-0","site","size","size-2","size-28","size-3","size-3.5","size-4","size-6","size-7","size-9","skipped_own","sm","sm:flex-row","sm:grid-cols-2","sm:grid-cols-3","sm:grid-cols-[1fr_200px]","sm:items-center","so","solidDanger","someone","space-y-1.5","space-y-3","space-y-4","space-y-5","space-y-6","src","srp","status","step","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","strong","structure","style","sub","submit","subtitle","success","suggest","suggested","synced","system","t","tabular-nums","target","text-3xl","text-[11px]","text-accent-ink","text-danger-fg","text-left","text-lg","text-muted","text-right","text-sm","text-subtle","text-success-fg","text-warning-fg","text-xl","text-xs","that","the","their","them","themselves","then","they","this","ticked","ticker","time","title","to","toast","toggle","told","tone","top-full","totals","tracking-[0.12em]","true","truncate","type","type_id","unclaimed","until","up","uppercase","useMe","useNavigate","useParams","useQuery","useQueryClient","useState","used","user","v","value","variant","victim_alliance","victim_corporation","viewBox","void","w-10","w-20","w-32","w-40","w-60","w-72","w-full","waiting","was","went","what","when","while","whitespace-nowrap","whitespace-pre-line","who","why","widgets","wins","with","withdraw","withdrawn","without","work","works","worth","x","xl","xl:grid-cols-[1fr_380px]","xs","yet","you","your","z-10","zKillboard","zkillboard"];
