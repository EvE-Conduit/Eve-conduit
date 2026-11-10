import { Alert as e, ApiError as t, Avatar as n, Badge as r, Button as i, Card as a, CardBody as o, CardFooter as s, CardHeader as c, ConfirmDialog as l, Dialog as u, DropdownContent as d, DropdownItem as f, DropdownMenu as p, DropdownSeparator as m, DropdownTrigger as h, EmptyState as g, Field as _, Input as v, PageHeader as y, SearchInput as b, Select as x, Skeleton as S, Spinner as C, StatCard as w, SwitchRow as T, THead as ee, TabPanel as E, Table as te, TableToolbar as ne, Tabs as re, Td as D, Th as O, Tr as ie, api as k, cn as A, definePlugin as ae, timeAgo as j, toast as M, useHasPerm as oe } from "@conduit/sdk";
import { Link as N, useNavigate as se, useParams as ce, useSearchParams as le } from "react-router";
import { useMutation as P, useQuery as F, useQueryClient as I } from "@tanstack/react-query";
import { useEffect as ue, useRef as de, useState as L } from "react";
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
var H = ({ className: e = "size-4" }) => /* @__PURE__ */ z("svg", {
	viewBox: "0 0 24 24",
	fill: "currentColor",
	className: e,
	"aria-hidden": !0,
	children: /* @__PURE__ */ z("path", { d: "M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14 14 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13 13 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03M8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418m7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418" })
}), fe = (e) => /* @__PURE__ */ B(V, {
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
	children: [
		/* @__PURE__ */ z("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ z("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ z("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ z("path", { d: "M8 16H3v5" })
	]
}), W = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" }),
		/* @__PURE__ */ z("path", { d: "m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" }),
		/* @__PURE__ */ z("path", { d: "M8 2v3" }),
		/* @__PURE__ */ z("path", { d: "M2 8h3" }),
		/* @__PURE__ */ z("path", { d: "M16 22v-3" }),
		/* @__PURE__ */ z("path", { d: "M22 16h-3" })
	]
}), G = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ z("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ z("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), K = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ z("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), q = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M5 12h14" }), /* @__PURE__ */ z("path", { d: "M12 5v14" })]
}), pe = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [
		/* @__PURE__ */ z("path", { d: "M3 6h18" }),
		/* @__PURE__ */ z("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ z("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), me = (e) => /* @__PURE__ */ z(V, {
	...e,
	children: /* @__PURE__ */ z("path", { d: "M20 6 9 17l-5-5" })
}), he = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ z("path", { d: "M19 12H5" })]
}), J = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ z("polyline", { points: "12 6 12 12 16 14" })]
}), ge = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ z("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })]
}), Y = (e) => /* @__PURE__ */ B(V, {
	...e,
	children: [/* @__PURE__ */ z("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ z("path", { d: "m4.9 4.9 14.2 14.2" })]
}), _e = (e) => /* @__PURE__ */ B(V, {
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
}), X = "/api/p/discord", Z = "/api/public/p/discord", Q = ["discord", "admin"];
function ve() {
	let { data: e, isLoading: t } = F({
		queryKey: Q,
		queryFn: () => k.get(`${X}/admin`)
	}), [n, r] = L(null), i = n ?? (e?.settings.configured ? "roles" : "setup");
	return /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(y, {
		eyebrow: /* @__PURE__ */ B(N, {
			to: "/p/discord",
			className: "inline-flex items-center gap-1 hover:text-text",
			children: [/* @__PURE__ */ z(he, { className: "size-3" }), " Discord"]
		}),
		title: "Server setup",
		icon: /* @__PURE__ */ z(H, {}),
		description: "Connect your Discord server, choose which groups and states get which roles, and keep an eye on linked members.",
		actions: e?.settings.configured ? /* @__PURE__ */ z(ye, {}) : void 0
	}), t || !e ? /* @__PURE__ */ z(S, { className: "h-96" }) : /* @__PURE__ */ B("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ B("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ z(w, {
					label: "Server",
					value: e.settings.guild_name || (e.settings.configured ? "Not checked yet" : "Not connected"),
					tone: e.settings.configured ? "success" : "warning"
				}),
				/* @__PURE__ */ z(w, {
					label: "Linked members",
					value: e.stats.linked,
					hint: e.settings.last_full_sync ? `full sync ${j(e.settings.last_full_sync)}` : "every 6 hours, and on every change"
				}),
				/* @__PURE__ */ z(w, {
					label: "Sync problems",
					value: e.stats.errors,
					tone: e.stats.errors ? "warning" : void 0,
					hint: "see Members"
				})
			]
		}), /* @__PURE__ */ B(re, {
			variant: "pills",
			value: i,
			onValueChange: r,
			className: "space-y-4",
			items: [
				{
					value: "setup",
					label: "Setup"
				},
				{
					value: "roles",
					label: "Roles",
					count: e.mappings.length,
					disabled: !e.settings.configured
				},
				{
					value: "members",
					label: "Members",
					count: e.stats.linked,
					disabled: !e.settings.configured
				},
				{
					value: "guests",
					label: "Temporary access",
					disabled: !e.settings.configured
				}
			],
			children: [
				/* @__PURE__ */ z(E, {
					value: "setup",
					children: /* @__PURE__ */ z(Se, { data: e })
				}),
				/* @__PURE__ */ z(E, {
					value: "roles",
					children: /* @__PURE__ */ z(Ce, { data: e })
				}),
				/* @__PURE__ */ z(E, {
					value: "members",
					children: /* @__PURE__ */ z(Te, {})
				}),
				/* @__PURE__ */ z(E, {
					value: "guests",
					children: /* @__PURE__ */ z(we, { data: e })
				})
			]
		})]
	})] });
}
function ye() {
	let e = I(), t = P({
		mutationFn: () => k.post(`${X}/admin/sync`),
		onSuccess: () => {
			M.success("Syncing everyone's roles; this takes a moment with many members"), setTimeout(() => e.invalidateQueries({ queryKey: ["discord"] }), 4e3);
		},
		onError: (e) => M.error(e.message)
	});
	return /* @__PURE__ */ B(i, {
		loading: t.isPending,
		onClick: () => t.mutate(),
		children: [/* @__PURE__ */ z(U, {}), " Sync everyone"]
	});
}
function be({ value: e }) {
	return /* @__PURE__ */ B("div", {
		className: "flex items-stretch",
		children: [/* @__PURE__ */ z(v, {
			readOnly: !0,
			value: e,
			className: "font-mono text-xs",
			onFocus: (e) => e.target.select()
		}), /* @__PURE__ */ z(i, {
			variant: "secondary",
			size: "icon",
			"aria-label": "Copy",
			onClick: () => navigator.clipboard.writeText(e).then(() => M.success("Copied"), () => M.error("Couldn't copy; select the text instead")),
			children: /* @__PURE__ */ z(K, {})
		})]
	});
}
function xe({ n: e, title: t, done: n, children: r }) {
	return /* @__PURE__ */ B("li", {
		className: "grid grid-cols-[32px_1fr] gap-4",
		children: [/* @__PURE__ */ z("span", {
			className: A("grid size-8 place-items-center border font-mono text-sm", n ? "border-success/40 bg-success-soft text-success-fg" : "border-border-strong text-muted"),
			children: n ? /* @__PURE__ */ z(me, {}) : e
		}), /* @__PURE__ */ B("div", {
			className: "min-w-0 space-y-3 pb-2",
			children: [/* @__PURE__ */ z("div", {
				className: "pt-1 font-medium",
				children: t
			}), r]
		})]
	});
}
function Se({ data: t }) {
	let n = I(), r = t.settings, [l, u] = L({
		client_id: r.client_id,
		guild_id: r.guild_id,
		nickname_format: r.nickname_format,
		kick_without_access: r.kick_without_access,
		require_for_compliance: r.require_for_compliance
	}), [d, f] = L(""), [p, m] = L(""), [h, g] = L(null), y = P({
		mutationFn: () => k.put(`${X}/admin/settings`, {
			...l,
			client_secret: d || null,
			bot_token: p || null
		}),
		onSuccess: (e) => {
			n.setQueryData(Q, e), n.invalidateQueries({ queryKey: ["discord", "me"] }), f(""), m(""), M.success("Saved");
		},
		onError: (e) => M.error(e.message)
	}), b = P({
		mutationFn: () => k.post(`${X}/admin/check`),
		onSuccess: (e) => {
			g(e), n.setQueryData(["discord", "check"], e), n.invalidateQueries({ queryKey: Q });
		},
		onError: (e) => {
			g(null), M.error(e.message);
		}
	}), x = (e) => u((t) => ({
		...t,
		...e
	}));
	return /* @__PURE__ */ B("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_380px]",
		children: [/* @__PURE__ */ B(a, { children: [/* @__PURE__ */ z(o, { children: /* @__PURE__ */ B("ol", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ B(xe, {
					n: 1,
					title: "Create a Discord application",
					done: !!r.client_id && r.client_secret_set,
					children: [
						/* @__PURE__ */ B("p", {
							className: "text-sm text-muted",
							children: [
								"Open the",
								" ",
								/* @__PURE__ */ z("a", {
									href: "https://discord.com/developers/applications",
									target: "_blank",
									rel: "noreferrer",
									className: "text-accent-ink underline-offset-4 hover:underline",
									children: "Discord developer portal"
								}),
								" ",
								"and press ",
								/* @__PURE__ */ z("b", { children: "New Application" }),
								". On its ",
								/* @__PURE__ */ z("b", { children: "OAuth2" }),
								" page, add this redirect and copy the client id and secret here."
							]
						}),
						/* @__PURE__ */ z(_, {
							label: "Redirect",
							children: /* @__PURE__ */ z(be, { value: t.redirect_uri })
						}),
						/* @__PURE__ */ B("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ z(_, {
								label: "Client id",
								children: /* @__PURE__ */ z(v, {
									value: l.client_id,
									onChange: (e) => x({ client_id: e.target.value }),
									placeholder: "1234567890123456789",
									className: "font-mono"
								})
							}), /* @__PURE__ */ z(_, {
								label: "Client secret",
								hint: r.client_secret_set ? "Saved. Type a new one to replace it." : void 0,
								children: /* @__PURE__ */ z(v, {
									type: "password",
									autoComplete: "off",
									value: d,
									onChange: (e) => f(e.target.value),
									placeholder: r.client_secret_set ? "••••••••••••" : "",
									className: "font-mono"
								})
							})]
						})
					]
				}),
				/* @__PURE__ */ B(xe, {
					n: 2,
					title: "Add the bot to your server",
					done: r.bot_token_set && !!r.guild_id,
					children: [
						/* @__PURE__ */ B("p", {
							className: "text-sm text-muted",
							children: [
								"On the application's ",
								/* @__PURE__ */ z("b", { children: "Bot" }),
								" page press ",
								/* @__PURE__ */ z("b", { children: "Reset Token" }),
								" and paste it here. For the server id, turn on Developer Mode in Discord (Settings → Advanced), then right-click the server → ",
								/* @__PURE__ */ z("b", { children: "Copy Server ID" }),
								"."
							]
						}),
						/* @__PURE__ */ B("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ z(_, {
								label: "Bot token",
								hint: r.bot_token_set ? "Saved. Paste a new one to replace it." : void 0,
								children: /* @__PURE__ */ z(v, {
									type: "password",
									autoComplete: "off",
									value: p,
									onChange: (e) => m(e.target.value),
									placeholder: r.bot_token_set ? "••••••••••••" : "",
									className: "font-mono"
								})
							}), /* @__PURE__ */ z(_, {
								label: "Server id",
								children: /* @__PURE__ */ z(v, {
									value: l.guild_id,
									onChange: (e) => x({ guild_id: e.target.value }),
									placeholder: "1234567890123456789",
									className: "font-mono"
								})
							})]
						}),
						t.invite_url ? /* @__PURE__ */ z("a", {
							href: t.invite_url,
							target: "_blank",
							rel: "noreferrer",
							children: /* @__PURE__ */ B(i, {
								variant: "outline",
								children: [/* @__PURE__ */ z(H, {}), " Invite the bot to the server"]
							})
						}) : /* @__PURE__ */ z("p", {
							className: "text-xs text-subtle",
							children: "Save the client id to get the link that invites the bot."
						}),
						/* @__PURE__ */ z("p", {
							className: "text-xs text-subtle",
							children: "It asks for Manage Roles, Manage Nicknames, Create Invite and Kick Members. Afterwards drag the bot's role above every role it should give (Server Settings → Roles)."
						})
					]
				}),
				/* @__PURE__ */ B(xe, {
					n: 3,
					title: "Choose how members appear",
					done: r.configured,
					children: [/* @__PURE__ */ z(_, {
						label: "Nickname",
						hint: /* @__PURE__ */ B(R, { children: [
							"Placeholders: ",
							"{character}",
							" ",
							"{corp_ticker}",
							" ",
							"{corp}",
							" ",
							"{alliance_ticker}",
							" ",
							"{alliance}",
							". Leave empty to let people pick their own."
						] }),
						children: /* @__PURE__ */ z(v, {
							value: l.nickname_format,
							onChange: (e) => x({ nickname_format: e.target.value }),
							placeholder: "[{corp_ticker}] {character}",
							className: "max-w-sm font-mono"
						})
					}), /* @__PURE__ */ B("div", {
						className: "border border-border px-3",
						children: [/* @__PURE__ */ z(T, {
							label: "Remove people who lose access from the server",
							description: "Off: they only lose the roles this site gave them. On: they're kicked and have to link again once they have access.",
							checked: l.kick_without_access,
							onCheckedChange: (e) => x({ kick_without_access: e })
						}), /* @__PURE__ */ z(T, {
							label: "Must be on the Discord server to be compliant",
							description: "Members who may link Discord count as not compliant until they've linked it and while they're not on the server (Administration → Compliance, and the Compliant group rule). Leaving is noticed at the next sync, at most 6 hours later.",
							checked: l.require_for_compliance,
							onCheckedChange: (e) => x({ require_for_compliance: e })
						})]
					})]
				})
			]
		}) }), /* @__PURE__ */ z(s, { children: /* @__PURE__ */ z(i, {
			variant: "primary",
			loading: y.isPending,
			onClick: () => y.mutate(),
			children: "Save"
		}) })] }), /* @__PURE__ */ B(a, {
			className: "h-fit",
			children: [/* @__PURE__ */ z(c, {
				title: "Connection",
				description: "Asks Discord whether everything is in place."
			}), /* @__PURE__ */ B(o, {
				className: "space-y-4",
				children: [h ? /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ B("div", {
					className: "flex items-center gap-3",
					children: [h.guild.icon ? /* @__PURE__ */ z("img", {
						src: h.guild.icon,
						alt: "",
						className: "size-12"
					}) : /* @__PURE__ */ z("span", {
						className: "grid size-12 place-items-center bg-accent-soft text-accent-ink",
						children: /* @__PURE__ */ z(H, { className: "size-6" })
					}), /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ z("div", {
						className: "font-medium",
						children: h.guild.name
					}), /* @__PURE__ */ B("div", {
						className: "text-xs text-subtle",
						children: [
							"bot: ",
							h.bot.name,
							" ",
							h.bot.on_server ? "· on the server" : "· not on the server"
						]
					})] })]
				}), h.problems.length === 0 ? /* @__PURE__ */ z(e, {
					tone: "success",
					title: "All good",
					children: "The bot can add members, give the mapped roles and set nicknames."
				}) : /* @__PURE__ */ z(e, {
					tone: "warning",
					title: `${h.problems.length} thing${h.problems.length === 1 ? "" : "s"} to fix`,
					children: /* @__PURE__ */ z("ul", {
						className: "list-disc space-y-1 pl-4",
						children: h.problems.map((e) => /* @__PURE__ */ z("li", { children: e }, e))
					})
				})] }) : /* @__PURE__ */ z("p", {
					className: "text-sm text-muted",
					children: r.bot_token_set && r.guild_id ? "Not checked yet." : "Save the bot token and server id first."
				}), /* @__PURE__ */ B(i, {
					className: "w-full",
					disabled: !r.bot_token_set || !r.guild_id,
					loading: b.isPending,
					onClick: () => b.mutate(),
					children: [/* @__PURE__ */ z(U, {}), " Check connection"]
				})]
			})]
		})]
	});
}
function Ce({ data: t }) {
	let n = I(), { data: l, isLoading: u, error: d } = F({
		queryKey: ["discord", "check"],
		queryFn: () => k.post(`${X}/admin/check`),
		staleTime: 6e4,
		retry: !1
	}), [f, p] = L(null), m = f ?? t.mappings, [h, v] = L(""), [y, b] = L(""), S = P({
		mutationFn: (e) => k.put(`${X}/admin/mappings`, { mappings: e }),
		onSuccess: (e) => {
			n.setQueryData(Q, e), p(null), M.success("Saved; everyone's roles are being updated");
		},
		onError: (e) => M.error(e.message)
	}), C = l?.roles ?? [], w = Object.fromEntries(C.map((e) => [e.id, e]));
	return /* @__PURE__ */ B("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_340px]",
		children: [/* @__PURE__ */ B(a, { children: [
			/* @__PURE__ */ z(c, {
				title: "Who gets which role",
				description: "Members of a group, or everyone in a state, get the role. A person can match several rows."
			}),
			d ? /* @__PURE__ */ z(o, { children: /* @__PURE__ */ z(e, {
				tone: "warning",
				title: "Couldn't load the server's roles",
				children: d.message
			}) }) : /* @__PURE__ */ z(o, {
				className: "border-b border-border",
				children: /* @__PURE__ */ B("div", {
					className: "flex flex-wrap items-end gap-3",
					children: [
						/* @__PURE__ */ z(_, {
							label: "Group or state",
							className: "min-w-56 flex-1",
							children: /* @__PURE__ */ B(x, {
								value: h,
								onChange: (e) => v(e.target.value),
								children: [
									/* @__PURE__ */ z("option", {
										value: "",
										children: "Choose…"
									}),
									/* @__PURE__ */ z("optgroup", {
										label: "States",
										children: t.states.map((e) => /* @__PURE__ */ z("option", {
											value: `state:${e.id}`,
											children: e.name
										}, `s${e.id}`))
									}),
									/* @__PURE__ */ z("optgroup", {
										label: "Groups",
										children: t.groups.map((e) => /* @__PURE__ */ z("option", {
											value: `group:${e.id}`,
											children: e.name
										}, `g${e.id}`))
									})
								]
							})
						}),
						/* @__PURE__ */ z(_, {
							label: "Discord role",
							className: "min-w-56 flex-1",
							children: /* @__PURE__ */ B(x, {
								value: y,
								onChange: (e) => b(e.target.value),
								disabled: u,
								children: [/* @__PURE__ */ z("option", {
									value: "",
									children: u ? "Loading roles…" : "Choose…"
								}), C.map((e) => /* @__PURE__ */ B("option", {
									value: e.id,
									disabled: !e.assignable,
									children: [
										"@",
										e.name,
										e.assignable ? "" : " (above the bot)"
									]
								}, e.id))]
							})
						}),
						/* @__PURE__ */ B(i, {
							disabled: !h || !y,
							onClick: () => {
								let [e, n] = h.split(":"), r = w[y];
								if (!e || !r) return;
								let i = e === "group" ? t.groups.find((e) => e.id === Number(n))?.name : t.states.find((e) => e.id === Number(n))?.name;
								p([...m, {
									kind: e,
									target_id: Number(n),
									target: i,
									role_id: r.id,
									role_name: r.name
								}]), b("");
							},
							children: [/* @__PURE__ */ z(q, {}), " Add"]
						})
					]
				})
			}),
			m.length === 0 ? /* @__PURE__ */ z(g, {
				icon: /* @__PURE__ */ z(H, {}),
				title: "No roles mapped yet",
				description: "Linked members join the server without any roles until you add some."
			}) : /* @__PURE__ */ z("ul", {
				className: "divide-y divide-border",
				children: m.map((e, t) => {
					let n = w[e.role_id];
					return /* @__PURE__ */ B("li", {
						className: "flex items-center gap-3 px-card py-3 text-sm",
						children: [
							/* @__PURE__ */ z(r, {
								tone: e.kind === "state" ? "info" : "neutral",
								children: e.kind
							}),
							/* @__PURE__ */ z("span", {
								className: "min-w-0 flex-1 truncate font-medium",
								children: e.target
							}),
							/* @__PURE__ */ z("span", {
								className: "text-subtle",
								children: "→"
							}),
							/* @__PURE__ */ B("span", {
								className: "flex min-w-0 flex-1 items-center gap-2",
								children: [
									/* @__PURE__ */ z("span", {
										className: "size-2.5 shrink-0 rounded-full border border-border",
										style: { background: n?.color ?? "transparent" }
									}),
									/* @__PURE__ */ B("span", {
										className: "truncate",
										children: ["@", n?.name ?? e.role_name ?? e.role_id]
									}),
									l && !n && /* @__PURE__ */ z(r, {
										tone: "danger",
										children: "deleted"
									}),
									n && !n.assignable && /* @__PURE__ */ z(r, {
										tone: "warning",
										children: "above the bot"
									})
								]
							}),
							/* @__PURE__ */ z(i, {
								variant: "ghost",
								size: "icon-xs",
								"aria-label": "Remove",
								onClick: () => p(m.filter((e, n) => n !== t)),
								children: /* @__PURE__ */ z(pe, {})
							})
						]
					}, `${e.kind}-${e.target_id}-${e.role_id}`);
				})
			}),
			f && /* @__PURE__ */ B(s, {
				className: "justify-between",
				children: [/* @__PURE__ */ z("span", {
					className: "text-xs text-muted",
					children: "Unsaved changes"
				}), /* @__PURE__ */ B("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ z(i, {
						variant: "ghost",
						onClick: () => p(null),
						children: "Discard"
					}), /* @__PURE__ */ z(i, {
						variant: "primary",
						loading: S.isPending,
						onClick: () => S.mutate(m),
						children: "Save and sync"
					})]
				})]
			})
		] }), /* @__PURE__ */ B(a, {
			className: "h-fit",
			children: [/* @__PURE__ */ z(c, { title: "How roles are kept" }), /* @__PURE__ */ B(o, {
				className: "space-y-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ z("p", { children: "Roles change as soon as someone joins or leaves a group, their state changes or they pick another main, and everyone is checked again every 6 hours." }),
					/* @__PURE__ */ z("p", { children: "Only mapped roles are touched. Roles you give by hand on Discord stay." }),
					/* @__PURE__ */ z("p", { children: "The bot can only give roles below its own; drag its role up in Server Settings → Roles if a role shows \"above the bot\"." })
				]
			})]
		})]
	});
}
function we({ data: t }) {
	let n = I(), r = t.settings, { data: l, isLoading: u, error: d } = F({
		queryKey: ["discord", "check"],
		queryFn: () => k.post(`${X}/admin/check`),
		staleTime: 6e4,
		retry: !1
	}), [f, p] = L({
		enabled: r.guest_enabled,
		role_id: r.guest_role_id,
		max_hours: String(r.guest_max_hours)
	}), m = l?.roles ?? [], h = P({
		mutationFn: () => k.put(`${X}/admin/guests`, {
			enabled: f.enabled,
			role_id: f.role_id,
			max_hours: Number(f.max_hours) || 0,
			role_name: m.find((e) => e.id === f.role_id)?.name ?? r.guest_role_name
		}),
		onSuccess: (e) => {
			n.setQueryData(Q, e), n.invalidateQueries({ queryKey: ["discord"] }), M.success(f.enabled ? "Saved" : "Saved; guests still on the server are being removed");
		},
		onError: (e) => M.error(e.message)
	}), g = (e) => p((t) => ({
		...t,
		...e
	}));
	return /* @__PURE__ */ B("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_340px]",
		children: [/* @__PURE__ */ B(a, { children: [
			/* @__PURE__ */ z(c, {
				title: "Temporary access links",
				description: "People with the permission hand out links. Whoever opens one signs in with Discord, joins the server with the guest role and is removed again when the link runs out."
			}),
			/* @__PURE__ */ B(o, {
				className: "space-y-5",
				children: [
					/* @__PURE__ */ z("div", {
						className: "border border-border px-3",
						children: /* @__PURE__ */ z(T, {
							label: "Temporary access links",
							description: "Off: nobody can make links, existing ones stop working and guests still on the server are removed.",
							checked: f.enabled,
							onCheckedChange: (e) => g({ enabled: e })
						})
					}),
					/* @__PURE__ */ z(_, {
						label: "Add this second redirect to the Discord application",
						hint: "Developer portal → your application → OAuth2 → Redirects. Without it Discord refuses guests with “Invalid OAuth2 redirect_uri”.",
						children: /* @__PURE__ */ z(be, { value: t.guest_redirect_uri })
					}),
					d && /* @__PURE__ */ z(e, {
						tone: "warning",
						title: "Couldn't load the server's roles",
						children: d.message
					}),
					/* @__PURE__ */ B("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ z(_, {
							label: "Role guests get",
							hint: "Make a role for guests on Discord and let it see only the channels guests should. It must be below the bot's role.",
							children: /* @__PURE__ */ B(x, {
								value: f.role_id,
								onChange: (e) => g({ role_id: e.target.value }),
								disabled: u,
								children: [
									/* @__PURE__ */ z("option", {
										value: "",
										children: u ? "Loading roles…" : "Choose…"
									}),
									f.role_id && !m.some((e) => e.id === f.role_id) && /* @__PURE__ */ B("option", {
										value: f.role_id,
										children: ["@", r.guest_role_name || f.role_id]
									}),
									m.map((e) => /* @__PURE__ */ B("option", {
										value: e.id,
										disabled: !e.assignable,
										children: [
											"@",
											e.name,
											e.assignable ? "" : " (above the bot)"
										]
									}, e.id))
								]
							})
						}), /* @__PURE__ */ z(_, {
							label: "Longest a link may last (hours)",
							hint: `Up to ${t.guest_hours_ceiling} hours (${t.guest_hours_ceiling / 24} days).`,
							children: /* @__PURE__ */ z(v, {
								type: "number",
								min: 1,
								max: t.guest_hours_ceiling,
								value: f.max_hours,
								onChange: (e) => g({ max_hours: e.target.value }),
								className: "max-w-32"
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ B(s, {
				className: "justify-between",
				children: [/* @__PURE__ */ z(N, {
					to: "/p/discord/guests",
					className: "text-sm text-accent-ink underline-offset-4 hover:underline",
					children: "See the links and their guests"
				}), /* @__PURE__ */ z(i, {
					variant: "primary",
					loading: h.isPending,
					onClick: () => h.mutate(),
					children: "Save"
				})]
			})
		] }), /* @__PURE__ */ B(a, {
			className: "h-fit",
			children: [/* @__PURE__ */ z(c, { title: "How guests are handled" }), /* @__PURE__ */ B(o, {
				className: "space-y-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ B("p", { children: [
						"Give ",
						/* @__PURE__ */ z("b", { children: "Can hand out temporary access to the Discord server" }),
						" to the people who may make links (Administration → Access), for example fleet commanders, diplomats and recruiters."
					] }),
					/* @__PURE__ */ z("p", { children: "Guests are removed within a couple of minutes of their link running out or being withdrawn, and when its maker loses that permission." }),
					/* @__PURE__ */ z("p", { children: "Someone who was already on the server can't come in as a guest, so nobody is ever removed who was there before." }),
					/* @__PURE__ */ z("p", { children: "A guest who links their Discord account as a member here keeps their place and only loses the guest role." })
				]
			})]
		})]
	});
}
function Te() {
	let e = I(), { data: o, isLoading: s } = F({
		queryKey: ["discord", "members"],
		queryFn: () => k.get(`${X}/admin/members`)
	}), [c, u] = L(""), [_, v] = L(null), y = () => e.invalidateQueries({ queryKey: ["discord"] }), x = P({
		mutationFn: (e) => k.post(`${X}/admin/members/${e}/sync`),
		onSuccess: (e) => {
			e.removed ? M.success("They no longer have access and were removed from the server") : e.error ? M.error(e.error) : M.success("Roles updated"), y();
		},
		onError: (e) => M.error(e.message)
	}), C = P({
		mutationFn: ({ id: e, kick: t, force: n = !1 }) => k.delete(`${X}/admin/members/${e}?kick=${t}${n ? "&force=true" : ""}`),
		onSuccess: () => {
			M.success("Unlinked"), y();
		},
		onError: (e, n) => {
			e instanceof t && e.status === 502 && !n.force ? M.error(e.message, {
				action: {
					label: "Forget anyway",
					onClick: () => C.mutate({
						...n,
						force: !0
					})
				},
				description: "Forgetting it leaves their roles on Discord; take them off there by hand."
			}) : M.error(e.message);
		}
	});
	if (s || !o) return /* @__PURE__ */ z(S, { className: "h-64" });
	let w = c.trim().toLowerCase(), T = w ? o.filter((e) => [
		e.user.name,
		e.username,
		e.nickname ?? "",
		...(e.characters ?? []).map((e) => e.name)
	].some((e) => e.toLowerCase().includes(w))) : o;
	return /* @__PURE__ */ B(a, { children: [
		/* @__PURE__ */ z(ne, { children: /* @__PURE__ */ z(b, {
			value: c,
			onChange: (e) => u(e.target.value),
			placeholder: "Member, character or Discord name",
			className: "w-80"
		}) }),
		T.length === 0 ? /* @__PURE__ */ z(g, {
			icon: /* @__PURE__ */ z(H, {}),
			title: o.length ? "Nobody matches" : "Nobody has linked Discord yet"
		}) : /* @__PURE__ */ B(te, { children: [/* @__PURE__ */ z(ee, { children: /* @__PURE__ */ B("tr", { children: [
			/* @__PURE__ */ z(O, { children: "Member" }),
			/* @__PURE__ */ z(O, { children: "Discord" }),
			/* @__PURE__ */ z(O, { children: "Roles" }),
			/* @__PURE__ */ z(O, { children: "Checked" }),
			/* @__PURE__ */ z(O, {})
		] }) }), /* @__PURE__ */ z("tbody", { children: T.map((e) => /* @__PURE__ */ B(ie, { children: [
			/* @__PURE__ */ z(D, { children: /* @__PURE__ */ B("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ z(n, {
					src: e.user.portrait,
					name: e.user.name,
					size: "sm"
				}), /* @__PURE__ */ B("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ z("div", {
							className: "truncate font-medium",
							children: e.user.name
						}),
						!e.has_access && /* @__PURE__ */ z(r, {
							tone: "warning",
							children: "no access"
						}),
						!e.on_server && /* @__PURE__ */ z(r, {
							tone: "danger",
							children: "not on the server"
						}),
						/* @__PURE__ */ z(Ee, {
							list: e.characters ?? [],
							needle: w
						})
					]
				})]
			}) }),
			/* @__PURE__ */ z(D, { children: /* @__PURE__ */ B("div", {
				className: "flex items-center gap-2.5",
				children: [/* @__PURE__ */ z(n, {
					src: e.avatar,
					name: e.username,
					size: "xs",
					rounded: "full"
				}), /* @__PURE__ */ B("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ z("div", {
						className: "truncate text-sm",
						children: e.username
					}), e.nickname && /* @__PURE__ */ z("div", {
						className: "truncate text-xs text-subtle",
						children: e.nickname
					})]
				})]
			}) }),
			/* @__PURE__ */ z(D, { children: /* @__PURE__ */ z("div", {
				className: "flex max-w-72 flex-wrap gap-1",
				children: e.role_names.length ? e.role_names.map((e) => /* @__PURE__ */ B(r, {
					tone: "accent",
					children: ["@", e]
				}, e)) : /* @__PURE__ */ z("span", {
					className: "text-xs text-subtle",
					children: "none"
				})
			}) }),
			/* @__PURE__ */ z(D, {
				className: "text-sm",
				children: e.error ? /* @__PURE__ */ z("span", {
					className: "text-warning-fg",
					title: e.error,
					children: e.error.length > 60 ? `${e.error.slice(0, 60)}…` : e.error
				}) : /* @__PURE__ */ z("span", {
					className: "text-muted",
					children: j(e.synced_at)
				})
			}),
			/* @__PURE__ */ z(D, {
				align: "right",
				children: /* @__PURE__ */ B(p, { children: [/* @__PURE__ */ z(h, {
					asChild: !0,
					children: /* @__PURE__ */ z(i, {
						variant: "ghost",
						size: "sm",
						children: "Actions"
					})
				}), /* @__PURE__ */ B(d, {
					align: "end",
					children: [
						/* @__PURE__ */ B(f, {
							onSelect: () => x.mutate(e.user.id),
							children: [/* @__PURE__ */ z(U, {}), " Sync now"]
						}),
						/* @__PURE__ */ B(f, {
							onSelect: () => window.open(`https://discord.com/users/${e.discord_id}`, "_blank", "noreferrer"),
							children: [/* @__PURE__ */ z(G, {}), " Discord profile"]
						}),
						/* @__PURE__ */ z(m, {}),
						/* @__PURE__ */ B(f, {
							onSelect: () => v({
								m: e,
								kick: !1
							}),
							children: [/* @__PURE__ */ z(W, {}), " Unlink"]
						}),
						/* @__PURE__ */ B(f, {
							danger: !0,
							onSelect: () => v({
								m: e,
								kick: !0
							}),
							children: [/* @__PURE__ */ z(pe, {}), " Unlink and kick"]
						})
					]
				})] })
			})
		] }, e.user.id)) })] }),
		/* @__PURE__ */ z(l, {
			open: !!_,
			onOpenChange: (e) => !e && v(null),
			title: _?.kick ? `Kick ${_?.m.user.name} from the server?` : `Unlink ${_?.m.user.name}'s Discord?`,
			description: _?.kick ? "They're removed from the server and the link is forgotten. They can link again while they have access." : "The roles this site gave them are taken away and the link is forgotten. They stay on the server.",
			danger: !0,
			confirmLabel: _?.kick ? "Kick" : "Unlink",
			onConfirm: () => _ && C.mutateAsync({
				id: _.m.user.id,
				kick: _.kick
			})
		})
	] });
}
function Ee({ list: e, needle: t }) {
	let [n, i] = L(!1), a = e.filter((e) => !e.main);
	if (!e.length) return null;
	let o = n ? e : e.filter((e, n) => n < 3 || t && e.name.toLowerCase().includes(t)), s = (e) => /* @__PURE__ */ B("span", {
		className: A("truncate", e.main ? "text-text" : "text-muted"),
		children: [e.name, e.corporation && /* @__PURE__ */ B("span", {
			className: "ml-1 text-subtle",
			children: [
				"[",
				e.corporation,
				"]"
			]
		})]
	});
	return /* @__PURE__ */ B("div", {
		className: "mt-1.5 space-y-1",
		children: [
			o.map((e) => /* @__PURE__ */ B("div", {
				className: "flex items-center gap-1.5 text-xs",
				children: [
					/* @__PURE__ */ z("img", {
						src: e.portrait,
						alt: "",
						className: "size-4 shrink-0"
					}),
					e.viewable ? /* @__PURE__ */ z(N, {
						to: `/characters/${e.id}`,
						className: "flex min-w-0 hover:text-accent-ink hover:underline",
						children: s(e)
					}) : s(e),
					e.main && /* @__PURE__ */ z(r, {
						size: "xs",
						children: "main"
					})
				]
			}, e.id)),
			e.length > o.length && /* @__PURE__ */ B("button", {
				type: "button",
				onClick: () => i(!0),
				className: "text-xs text-accent-ink hover:underline",
				children: [
					e.length - o.length,
					" more character",
					e.length - o.length === 1 ? "" : "s"
				]
			}),
			n && e.length > 3 && /* @__PURE__ */ z("button", {
				type: "button",
				onClick: () => i(!1),
				className: "text-xs text-subtle hover:underline",
				children: "Show fewer"
			}),
			a.length === 0 && /* @__PURE__ */ z("div", {
				className: "text-[11px] text-subtle",
				children: "No alts you can see"
			})
		]
	});
}
//#endregion
//#region src/guests.tsx
var $ = ["discord", "guests"], De = [
	1,
	2,
	4,
	8,
	12,
	24,
	48,
	72,
	168,
	336,
	720
];
function Oe(e) {
	let t = new Date(e).getTime() - Date.now();
	if (t <= 0) return "ended";
	let n = Math.round(t / 6e4);
	if (n < 60) return `${n} min left`;
	let r = Math.floor(n / 60);
	return r < 48 ? `${r} h ${n % 60 ? `${n % 60} min ` : ""}left` : `${Math.round(r / 24)} days left`;
}
function ke(e, t) {
	navigator.clipboard.writeText(e).then(() => M.success(t), () => M.error("Couldn't copy; select the text instead"));
}
var Ae = {
	active: {
		label: "active",
		tone: "success"
	},
	used_up: {
		label: "all used",
		tone: "neutral"
	},
	expired: {
		label: "ended",
		tone: "neutral"
	},
	revoked: {
		label: "withdrawn",
		tone: "danger"
	},
	creator_lost: {
		label: "maker lost access",
		tone: "warning"
	}
}, je = (e) => e.status === "active" || e.status === "used_up";
function Me() {
	let t = I(), { data: n, isLoading: r } = F({
		queryKey: $,
		queryFn: () => k.get(`${X}/guests`)
	}), [o, s] = L(!1), [c, u] = L(null), [d, f] = L(null), [p, m] = L(!1), h = P({
		mutationFn: (e) => k.delete(`${X}/guests/${e}`),
		onSuccess: (e) => {
			e.waiting ? M.warning(`Link withdrawn. ${e.waiting} guest${e.waiting === 1 ? "" : "s"} couldn't be removed yet; that is tried again every couple of minutes.`) : M.success("Link withdrawn and its guests removed from the server"), t.invalidateQueries({ queryKey: $ });
		},
		onError: (e) => M.error(e.message)
	}), _ = n?.links ?? [], b = _.filter(je), x = _.filter((e) => !je(e)), C = (e) => e.guests.filter((e) => !e.ended_at).length;
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ z(y, {
			eyebrow: /* @__PURE__ */ B(N, {
				to: "/p/discord",
				className: "inline-flex items-center gap-1 hover:text-text",
				children: [/* @__PURE__ */ z(he, { className: "size-3" }), " Discord"]
			}),
			title: "Temporary access",
			icon: /* @__PURE__ */ z(J, {}),
			description: "Hand a link to people without an account here: diplomats, guests on a fleet, a recruit. They sign in with Discord, join the server with the guest role, and are removed again when the link runs out.",
			actions: n?.enabled ? /* @__PURE__ */ B(i, {
				variant: "primary",
				onClick: () => s(!0),
				children: [/* @__PURE__ */ z(q, {}), " New link"]
			}) : void 0
		}),
		r || !n ? /* @__PURE__ */ z(S, { className: "h-64" }) : n.enabled ? /* @__PURE__ */ B("div", {
			className: "space-y-6",
			children: [
				c && /* @__PURE__ */ z(e, {
					tone: "success",
					title: "Link made. Send it to your guests.",
					action: /* @__PURE__ */ z(i, {
						size: "sm",
						variant: "ghost",
						onClick: () => u(null),
						children: "Done"
					}),
					children: /* @__PURE__ */ B("div", {
						className: "mt-2 flex items-stretch",
						children: [/* @__PURE__ */ z(v, {
							readOnly: !0,
							value: c.url,
							className: "font-mono text-xs",
							onFocus: (e) => e.target.select()
						}), /* @__PURE__ */ z(i, {
							variant: "secondary",
							size: "icon",
							"aria-label": "Copy link",
							onClick: () => ke(c.url, "Link copied"),
							children: /* @__PURE__ */ z(K, {})
						})]
					})
				}),
				b.length === 0 ? /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(g, {
					icon: /* @__PURE__ */ z(ge, {}),
					title: "No active links",
					description: `Make one and send it to whoever needs to be on ${n.server || "the server"} for a while.`,
					action: /* @__PURE__ */ B(i, {
						variant: "primary",
						onClick: () => s(!0),
						children: [/* @__PURE__ */ z(q, {}), " New link"]
					})
				}) }) : /* @__PURE__ */ z("div", {
					className: "grid gap-4 lg:grid-cols-2",
					children: b.map((e) => /* @__PURE__ */ z(Ne, {
						link: e,
						showOwner: n.can_manage,
						onRevoke: () => f(e)
					}, e.id))
				}),
				x.length > 0 && /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ B("button", {
					type: "button",
					className: "text-sm text-muted hover:text-text",
					onClick: () => m((e) => !e),
					children: [
						p ? "Hide" : "Show",
						" ",
						x.length,
						" past link",
						x.length === 1 ? "" : "s"
					]
				}), p && /* @__PURE__ */ z("div", {
					className: "mt-3 grid gap-4 lg:grid-cols-2",
					children: x.map((e) => /* @__PURE__ */ z(Ne, {
						link: e,
						showOwner: n.can_manage
					}, e.id))
				})] })
			]
		}) : /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(g, {
			icon: /* @__PURE__ */ z(J, {}),
			title: "Temporary access is switched off",
			description: "A Discord manager can switch it on and choose the guest role under Server setup."
		}) }),
		n && /* @__PURE__ */ z(Ie, {
			open: o,
			onOpenChange: s,
			overview: n,
			onMade: (e) => {
				u(e), s(!1), t.invalidateQueries({ queryKey: $ });
			}
		}),
		/* @__PURE__ */ z(l, {
			open: !!d,
			onOpenChange: (e) => !e && f(null),
			title: `Withdraw "${d?.label}"?`,
			description: d && C(d) ? `The link stops working and the ${C(d)} guest${C(d) === 1 ? "" : "s"} it let in ${C(d) === 1 ? "is" : "are"} removed from the server now.` : "The link stops working. Nobody is on the server through it.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(Y, {}), " Withdraw"] }),
			onConfirm: () => d && h.mutateAsync(d.id)
		})
	] });
}
function Ne({ link: e, showOwner: t, onRevoke: n }) {
	let s = I(), [l, u] = L(!1), d = P({
		mutationFn: (e) => k.delete(`${X}/guests/users/${e}`),
		onSuccess: () => {
			M.success("Guest removed from the server"), s.invalidateQueries({ queryKey: $ });
		},
		onError: (e) => M.error(e.message)
	}), f = je(e), p = Ae[e.status];
	return /* @__PURE__ */ B(a, {
		className: A(!f && "opacity-75"),
		children: [/* @__PURE__ */ z(c, {
			title: /* @__PURE__ */ B("span", {
				className: "flex items-center gap-2",
				children: [
					e.label,
					" ",
					/* @__PURE__ */ z(r, {
						tone: p.tone,
						children: p.label
					})
				]
			}),
			description: /* @__PURE__ */ B(R, { children: [
				f ? Oe(e.expires_at) : `ended ${j(e.ended_at)}`,
				" · ",
				e.uses,
				e.max_uses ? ` of ${e.max_uses}` : "",
				" used",
				t && e.created_by ? ` · by ${e.created_by.name}` : ""
			] }),
			actions: /* @__PURE__ */ B("div", {
				className: "flex gap-1",
				children: [e.status === "active" && /* @__PURE__ */ B(i, {
					variant: "ghost",
					size: "sm",
					onClick: () => ke(e.url, "Link copied"),
					children: [/* @__PURE__ */ z(K, {}), " Copy link"]
				}), f && n && /* @__PURE__ */ B(i, {
					variant: "ghost",
					size: "sm",
					onClick: n,
					children: [/* @__PURE__ */ z(Y, {}), " Withdraw"]
				})]
			})
		}), /* @__PURE__ */ B(o, {
			className: "space-y-3",
			children: [/* @__PURE__ */ B("div", {
				className: "flex flex-wrap items-center gap-1.5 text-xs text-muted",
				children: ["Guests get ", /* @__PURE__ */ B(r, {
					tone: "accent",
					children: ["@", e.role]
				})]
			}), e.guests.length === 0 ? /* @__PURE__ */ z("p", {
				className: "text-sm text-subtle",
				children: "Nobody has used it yet."
			}) : /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ B("button", {
				type: "button",
				className: "inline-flex items-center gap-1.5 text-sm text-accent-ink hover:underline",
				onClick: () => u((e) => !e),
				children: [
					/* @__PURE__ */ z(_e, { className: "size-3.5" }),
					" ",
					e.guests.length,
					" guest",
					e.guests.length === 1 ? "" : "s"
				]
			}), l && /* @__PURE__ */ z("ul", {
				className: "divide-y divide-border border border-border text-sm",
				children: e.guests.map((e) => /* @__PURE__ */ z(Fe, {
					guest: e,
					onRemove: e.ended_at ? void 0 : () => d.mutate(e.id)
				}, e.id))
			})] })]
		})]
	});
}
var Pe = {
	expired: "left when the link ran out",
	revoked: "removed with the link",
	removed: "removed",
	creator_lost: "removed: the link's maker lost access",
	member: "a member here now"
};
function Fe({ guest: e, onRemove: t }) {
	return /* @__PURE__ */ B("li", {
		className: "flex items-center gap-3 px-3 py-2",
		children: [
			/* @__PURE__ */ z(n, {
				src: e.avatar,
				name: e.username,
				size: "sm"
			}),
			/* @__PURE__ */ B("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ z("div", {
					className: "truncate font-medium",
					children: e.username
				}), /* @__PURE__ */ B("div", {
					className: "truncate text-xs text-subtle",
					children: [
						"joined ",
						j(e.joined_at),
						e.ended_at ? ` · ${Pe[e.ended_reason] ?? "left"}` : "",
						e.error ? ` · couldn't be removed yet: ${e.error}` : ""
					]
				})]
			}),
			e.ended_at ? /* @__PURE__ */ z(r, {
				tone: e.ended_reason === "member" ? "success" : "neutral",
				children: e.ended_reason === "member" ? "member" : "gone"
			}) : t ? /* @__PURE__ */ B(i, {
				variant: "ghost",
				size: "xs",
				onClick: t,
				children: [/* @__PURE__ */ z(Y, {}), " Remove"]
			}) : null
		]
	});
}
function Ie({ open: e, onOpenChange: t, overview: n, onMade: r }) {
	let [a, o] = L(""), [s, c] = L(String(Math.min(4, n.max_hours))), [l, d] = L(""), f = P({
		mutationFn: () => k.post(`${X}/guests`, {
			label: a.trim(),
			hours: Number(s),
			max_uses: Number(l) || 0
		}),
		onSuccess: (e) => {
			r(e), o(""), d("");
		},
		onError: (e) => M.error(e.message)
	}), p = De.filter((e) => e <= n.max_hours);
	return p.includes(n.max_hours) || p.push(n.max_hours), /* @__PURE__ */ z(u, {
		open: e,
		onOpenChange: t,
		title: "New temporary link",
		description: `Whoever opens it can join ${n.server || "the Discord server"} with the @${n.role} role for as long as the link lasts.`,
		footer: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(i, {
			variant: "ghost",
			onClick: () => t(!1),
			children: "Cancel"
		}), /* @__PURE__ */ B(i, {
			variant: "primary",
			loading: f.isPending,
			disabled: !a.trim(),
			onClick: () => f.mutate(),
			children: [/* @__PURE__ */ z(ge, {}), " Make link"]
		})] }),
		children: /* @__PURE__ */ B("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ z(_, {
				label: "What it's for",
				hint: "Shown to the guests, and to you in the list.",
				children: /* @__PURE__ */ z(v, {
					autoFocus: !0,
					value: a,
					onChange: (e) => o(e.target.value),
					maxLength: 100,
					placeholder: "Diplo meeting Saturday"
				})
			}), /* @__PURE__ */ B("div", {
				className: "grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ z(_, {
					label: "Lasts",
					hint: `At most ${n.max_hours} hours. Guests are removed when it ends.`,
					children: /* @__PURE__ */ z(x, {
						value: s,
						onChange: (e) => c(e.target.value),
						children: p.map((e) => /* @__PURE__ */ z("option", {
							value: e,
							children: e < 24 ? `${e} hour${e === 1 ? "" : "s"}` : `${e / 24} day${e === 24 ? "" : "s"}`
						}, e))
					})
				}), /* @__PURE__ */ z(_, {
					label: "Uses",
					hint: "How many people may use it; empty for no limit.",
					children: /* @__PURE__ */ z(v, {
						type: "number",
						min: 0,
						value: l,
						onChange: (e) => d(e.target.value),
						placeholder: "no limit"
					})
				})]
			})]
		})
	});
}
//#endregion
//#region src/member.tsx
function Le() {
	return F({
		queryKey: ["discord", "me"],
		queryFn: () => k.get(`${X}/me`)
	});
}
function Re() {
	return P({
		mutationFn: () => k.post(`${X}/link`),
		onSuccess: ({ url: e }) => window.location.assign(e),
		onError: (e) => M.error(e.message)
	});
}
function ze() {
	let t = I(), s = oe("discord.manage_discord"), { data: u, isLoading: d } = Le(), f = Re(), [p, m] = L(!1), h = P({
		mutationFn: () => k.post(`${X}/sync`),
		onSuccess: (e) => {
			t.setQueryData(["discord", "me"], e), M.success("Your roles are up to date");
		},
		onError: (e) => {
			t.invalidateQueries({ queryKey: ["discord", "me"] }), M.error(e.message);
		}
	}), _ = P({
		mutationFn: () => k.post(`${X}/unlink`),
		onSuccess: (e) => {
			t.setQueryData(["discord", "me"], e), M.success("Discord account unlinked");
		},
		onError: (e) => M.error(e.message)
	});
	return /* @__PURE__ */ B(R, { children: [
		/* @__PURE__ */ z(y, {
			eyebrow: "Communication",
			title: "Discord",
			icon: /* @__PURE__ */ z(H, {}),
			description: "Link your Discord account to join the server. Your roles and nickname follow your groups and main character.",
			actions: s || u?.can_invite_guests ? /* @__PURE__ */ B("div", {
				className: "flex gap-2",
				children: [u?.can_invite_guests && /* @__PURE__ */ z(N, {
					to: "/p/discord/guests",
					children: /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(J, {}), " Temporary access"] })
				}), s && /* @__PURE__ */ z(N, {
					to: "/p/discord/admin",
					children: /* @__PURE__ */ B(i, { children: [/* @__PURE__ */ z(fe, {}), " Server setup"] })
				})]
			}) : void 0
		}),
		d || !u ? /* @__PURE__ */ z(S, { className: "h-56" }) : u.configured ? u.account ? /* @__PURE__ */ B("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_360px]",
			children: [/* @__PURE__ */ B("div", {
				className: "space-y-6",
				children: [u.account.error ? /* @__PURE__ */ z(e, {
					tone: "warning",
					title: "Your Discord roles couldn't be updated",
					action: u.account.error.startsWith("Not on the server") ? /* @__PURE__ */ z(i, {
						size: "sm",
						variant: "primary",
						loading: f.isPending,
						onClick: () => f.mutate(),
						children: "Join the server"
					}) : void 0,
					children: u.account.error
				}) : null, /* @__PURE__ */ z(a, { children: /* @__PURE__ */ B("div", {
					className: "flex flex-col gap-5 p-card sm:flex-row sm:items-center",
					children: [
						/* @__PURE__ */ z(n, {
							src: u.account.avatar,
							name: u.account.username,
							size: "lg",
							rounded: "full"
						}),
						/* @__PURE__ */ B("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ B("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ z("span", {
										className: "text-lg font-semibold",
										children: u.account.username
									}), /* @__PURE__ */ B(r, {
										tone: "success",
										children: [/* @__PURE__ */ z(me, { className: "size-3" }), " Linked"]
									})]
								}),
								/* @__PURE__ */ B("div", {
									className: "text-sm text-muted",
									children: [
										"on ",
										u.server || "the server",
										u.account.nickname ? /* @__PURE__ */ B(R, { children: [" as ", /* @__PURE__ */ z("span", {
											className: "text-text",
											children: u.account.nickname
										})] }) : null
									]
								}),
								/* @__PURE__ */ B("div", {
									className: "mt-1 text-xs text-subtle",
									children: [
										"Linked ",
										j(u.account.linked_at),
										" · roles checked ",
										j(u.account.synced_at)
									]
								})
							]
						}),
						/* @__PURE__ */ B("div", {
							className: "flex flex-wrap gap-2",
							children: [
								u.server_url && /* @__PURE__ */ z("a", {
									href: u.server_url,
									target: "_blank",
									rel: "noreferrer",
									children: /* @__PURE__ */ B(i, {
										variant: "primary",
										children: [/* @__PURE__ */ z(G, {}), " Open Discord"]
									})
								}),
								/* @__PURE__ */ B(i, {
									variant: "ghost",
									loading: h.isPending,
									onClick: () => h.mutate(),
									children: [/* @__PURE__ */ z(U, {}), " Fix my roles"]
								}),
								/* @__PURE__ */ B(i, {
									variant: "danger",
									onClick: () => m(!0),
									children: [/* @__PURE__ */ z(W, {}), " Unlink"]
								})
							]
						})
					]
				}) })]
			}), /* @__PURE__ */ B(a, {
				className: "h-fit",
				children: [/* @__PURE__ */ z(c, {
					title: "Your roles",
					description: "Given by this site. Roles given by hand on Discord aren't touched."
				}), /* @__PURE__ */ z(o, { children: /* @__PURE__ */ z(Be, {
					roles: u.roles,
					empty: "None of your groups come with a Discord role."
				}) })]
			})]
		}) : /* @__PURE__ */ z(a, { children: /* @__PURE__ */ B("div", {
			className: "grid gap-8 p-card sm:p-8 lg:grid-cols-[1fr_320px] lg:items-center",
			children: [/* @__PURE__ */ B("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ B("div", {
					className: "flex items-center gap-3 text-accent-ink",
					children: [/* @__PURE__ */ z(H, { className: "size-8" }), /* @__PURE__ */ z("span", {
						className: "text-xl font-semibold text-text",
						children: u.server || "Our Discord server"
					})]
				}), u.can_link ? /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z("p", {
					className: "max-w-prose text-sm text-muted",
					children: "Sign in with Discord and you're put on the server straight away, with the roles that go with your groups. Nobody here sees your Discord password or messages; the site only learns your Discord name."
				}), /* @__PURE__ */ z("div", {
					className: "flex flex-wrap gap-2",
					children: /* @__PURE__ */ B(i, {
						variant: "primary",
						size: "lg",
						loading: f.isPending,
						onClick: () => f.mutate(),
						children: [/* @__PURE__ */ z(H, {}), " Link Discord and join"]
					})
				})] }) : /* @__PURE__ */ z(e, {
					tone: "warning",
					title: "You don't have access to the Discord server",
					children: "Access comes with your membership. Ask your corporation's leadership if you think you should have it."
				})]
			}), u.can_link && /* @__PURE__ */ B("div", {
				className: "border border-border bg-bg/40 p-4 text-sm",
				children: [
					/* @__PURE__ */ z("div", {
						className: "mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
						children: "You'll get"
					}),
					/* @__PURE__ */ z("div", {
						className: "mb-3 font-medium",
						children: u.nickname ?? "Your Discord name"
					}),
					/* @__PURE__ */ z(Be, {
						roles: u.roles_due,
						empty: "No roles yet; they come with your groups."
					})
				]
			})]
		}) }) : /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(g, {
			icon: /* @__PURE__ */ z(H, {}),
			title: "Discord isn't set up yet",
			description: s ? "Connect a Discord application and server under Server setup." : "Your leadership hasn't connected a Discord server to this site yet.",
			action: s ? /* @__PURE__ */ z(N, {
				to: "/p/discord/admin",
				children: /* @__PURE__ */ B(i, {
					variant: "primary",
					children: [/* @__PURE__ */ z(fe, {}), " Server setup"]
				})
			}) : void 0
		}) }),
		/* @__PURE__ */ z(l, {
			open: p,
			onOpenChange: m,
			title: "Unlink your Discord account?",
			description: "The roles this site gave you are taken away (you may be removed from the server). You can link again at any time.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ B(R, { children: [/* @__PURE__ */ z(W, {}), " Unlink"] }),
			onConfirm: () => _.mutateAsync()
		})
	] });
}
function Be({ roles: e, empty: t }) {
	return e.length === 0 ? /* @__PURE__ */ z("p", {
		className: "text-sm text-subtle",
		children: t
	}) : /* @__PURE__ */ z("div", {
		className: "flex flex-wrap gap-1.5",
		children: e.map((e) => /* @__PURE__ */ B(r, {
			tone: "accent",
			children: ["@", e]
		}, e))
	});
}
function Ve() {
	let [e] = le(), t = se(), n = I(), r = de(!1), [o, s] = L(e.get("error") ? "You cancelled the sign-in with Discord." : null), c = Re();
	return ue(() => {
		let i = e.get("code"), a = e.get("state");
		if (!(r.current || o)) {
			if (!i || !a) {
				s("Discord didn't send a sign-in code back.");
				return;
			}
			r.current = !0, k.post(`${X}/link/finish`, {
				code: i,
				state: a
			}).then((e) => {
				n.setQueryData(["discord", "me"], e), M.success(`Welcome to ${e.server || "the server"}, ${e.account?.username ?? ""}`), t("/p/discord", { replace: !0 });
			}).catch((e) => s(e.message));
		}
	}, [
		e,
		o,
		t,
		n
	]), o ? /* @__PURE__ */ z(a, {
		className: "mx-auto max-w-xl",
		children: /* @__PURE__ */ z(g, {
			icon: /* @__PURE__ */ z(H, {}),
			title: "Discord wasn't linked",
			description: o,
			action: /* @__PURE__ */ B("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ z(N, {
					to: "/p/discord",
					children: /* @__PURE__ */ z(i, {
						variant: "ghost",
						children: "Back"
					})
				}), /* @__PURE__ */ z(i, {
					variant: "primary",
					loading: c.isPending,
					onClick: () => c.mutate(),
					children: "Try again"
				})]
			})
		})
	}) : /* @__PURE__ */ z("div", {
		className: "grid min-h-[50vh] place-items-center",
		children: /* @__PURE__ */ B("div", {
			className: "flex flex-col items-center gap-3 text-sm text-muted",
			children: [/* @__PURE__ */ z(C, {}), "Linking your Discord account and adding you to the server…"]
		})
	});
}
//#endregion
//#region src/public.tsx
var He = {
	expired: "This link has expired. Ask whoever gave it to you for a new one.",
	revoked: "This link was withdrawn.",
	used_up: "This link has been used by as many people as it allows.",
	creator_lost: "Whoever gave you this link can't hand out access any more. Ask someone else for a new one."
};
function Ue() {
	let { token: e } = ce(), { data: t, isLoading: n, error: r } = F({
		queryKey: [
			"discord",
			"public",
			e
		],
		queryFn: () => k.get(`${Z}/guest/${e}`),
		retry: !1
	}), s = P({
		mutationFn: () => k.post(`${Z}/guest/${e}/start`),
		onSuccess: (e) => window.location.assign(e.url),
		onError: (e) => M.error(e.message)
	});
	return n ? /* @__PURE__ */ z(S, { className: "h-64" }) : r || !t ? /* @__PURE__ */ z(a, {
		className: "mx-auto max-w-xl",
		children: /* @__PURE__ */ z(g, {
			icon: /* @__PURE__ */ z(H, {}),
			title: "This link doesn't work",
			description: "It may have been withdrawn, or it was copied wrongly. Ask whoever gave it to you for a new one."
		})
	}) : /* @__PURE__ */ B("div", {
		className: "mx-auto max-w-2xl",
		children: [/* @__PURE__ */ z(y, {
			icon: /* @__PURE__ */ z(H, {}),
			eyebrow: "Temporary Discord access",
			title: t.server || "Discord server",
			description: /* @__PURE__ */ B(R, { children: [
				t.invited_by ? /* @__PURE__ */ B(R, { children: [t.invited_by, " invited you"] }) : "You're invited",
				" for ",
				/* @__PURE__ */ z("b", { children: t.label }),
				"."
			] })
		}), t.status === "active" ? /* @__PURE__ */ B(a, { children: [/* @__PURE__ */ z(c, {
			title: "Join with your Discord account",
			description: "Discord asks you to confirm, then you're added to the server as a guest."
		}), /* @__PURE__ */ B(o, {
			className: "space-y-4",
			children: [/* @__PURE__ */ B(i, {
				variant: "primary",
				size: "lg",
				loading: s.isPending || s.isSuccess,
				onClick: () => s.mutate(),
				children: [/* @__PURE__ */ z(H, {}), " Join with Discord"]
			}), /* @__PURE__ */ B("p", {
				className: "text-xs text-subtle",
				children: [
					/* @__PURE__ */ z(J, { className: "mr-1 inline size-3 align-[-2px]" }),
					"Your access ends ",
					new Date(t.expires_at).toLocaleString(),
					" (",
					Oe(t.expires_at),
					"); you are removed from the server then. This site learns your Discord name and nothing else."
				]
			})]
		})] }) : /* @__PURE__ */ z(a, { children: /* @__PURE__ */ z(g, {
			icon: /* @__PURE__ */ z(J, {}),
			title: "This link is closed",
			description: He[t.status]
		}) })]
	});
}
function We() {
	let [t] = le(), r = de(!1), [s, c] = L(null), [l, u] = L(t.get("error") ? "You cancelled the sign-in with Discord. Open your link again to retry." : null);
	return ue(() => {
		let e = t.get("code"), n = t.get("state");
		if (!(r.current || l)) {
			if (!e || !n) {
				u("Discord didn't send a sign-in code back. Open your link again.");
				return;
			}
			r.current = !0, k.post(`${Z}/guest-finish`, {
				code: e,
				state: n
			}).then(c).catch((e) => u(e.message));
		}
	}, [t, l]), l ? /* @__PURE__ */ z(a, {
		className: "mx-auto max-w-xl",
		children: /* @__PURE__ */ z(g, {
			icon: /* @__PURE__ */ z(H, {}),
			title: "You weren't added to the server",
			description: l
		})
	}) : s ? /* @__PURE__ */ B("div", {
		className: "mx-auto max-w-2xl",
		children: [/* @__PURE__ */ z(y, {
			icon: /* @__PURE__ */ z(H, {}),
			eyebrow: "Temporary Discord access",
			title: s.server || "Discord server",
			description: /* @__PURE__ */ B(R, { children: [
				"You're in for ",
				/* @__PURE__ */ z("b", { children: s.label }),
				"."
			] })
		}), /* @__PURE__ */ z(a, { children: /* @__PURE__ */ B(o, {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ B("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ z(n, {
						src: s.avatar,
						name: s.username,
						size: "lg"
					}), /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ B("div", {
						className: "font-medium",
						children: ["Welcome, ", s.username]
					}), /* @__PURE__ */ z("div", {
						className: "text-xs text-subtle",
						children: "The server is in your Discord server list now."
					})] })]
				}),
				/* @__PURE__ */ z("a", {
					href: s.server_url,
					target: "_blank",
					rel: "noreferrer",
					children: /* @__PURE__ */ B(i, {
						variant: "primary",
						children: [/* @__PURE__ */ z(G, {}), " Open Discord"]
					})
				}),
				/* @__PURE__ */ B(e, {
					tone: "info",
					title: `Access ends ${new Date(s.expires_at).toLocaleString()}`,
					icon: /* @__PURE__ */ z(J, {}),
					children: [Oe(s.expires_at), ". You are removed from the server then."]
				})
			]
		}) })]
	}) : /* @__PURE__ */ z("div", {
		className: "grid min-h-[50vh] place-items-center",
		children: /* @__PURE__ */ B("div", {
			className: "flex flex-col items-center gap-3 text-sm text-muted",
			children: [/* @__PURE__ */ z(C, {}), "Adding you to the server…"]
		})
	});
}
//#endregion
//#region src/index.tsx
function Ge() {
	let { data: e, isLoading: t } = Le(), n = Re();
	return t ? /* @__PURE__ */ z(S, { className: "h-16" }) : !e?.configured || !e.account && !e.can_link ? null : e.account ? /* @__PURE__ */ B(N, {
		to: "/p/discord",
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ B("div", {
			className: "flex min-w-0 items-center gap-3",
			children: [/* @__PURE__ */ z(H, { className: "size-7 shrink-0 text-accent-ink" }), /* @__PURE__ */ B("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ z("div", {
					className: "truncate font-medium",
					children: e.account.username
				}), /* @__PURE__ */ z("div", {
					className: "truncate text-xs text-muted",
					children: e.roles.length ? e.roles.map((e) => `@${e}`).join(" ") : "no roles"
				})]
			})]
		}), e.account.error ? /* @__PURE__ */ z(r, {
			tone: "warning",
			children: "Needs attention"
		}) : /* @__PURE__ */ z(r, {
			tone: "success",
			children: "Linked"
		})]
	}) : /* @__PURE__ */ B("div", {
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ B("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ z(H, { className: "size-7 text-accent-ink" }), /* @__PURE__ */ B("div", { children: [/* @__PURE__ */ B("div", {
				className: "font-medium",
				children: ["Join ", e.server || "our Discord"]
			}), /* @__PURE__ */ z("div", {
				className: "text-xs text-muted",
				children: "Link your account to get on the server with your roles."
			})] })]
		}), /* @__PURE__ */ z(i, {
			variant: "primary",
			size: "sm",
			loading: n.isPending,
			onClick: () => n.mutate(),
			children: "Link"
		})]
	});
}
var Ke = ae({
	routes: [
		{
			path: "",
			Component: ze
		},
		{
			path: "callback",
			Component: Ve
		},
		{
			path: "guests",
			Component: Me
		},
		{
			path: "admin",
			Component: ve
		}
	],
	publicRoutes: [{
		path: "guest/:token",
		Component: Ue
	}, {
		path: "guest",
		Component: We
	}],
	widgets: [{
		id: "link",
		title: "Discord",
		Component: Ge,
		size: "sm",
		order: 20
	}]
});
//#endregion
export { Ke as default };

export const classes = ["!data","!o","!r","---","----------------------------------------------------------------------------------------------------","-----------------------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------------------","@conduit/sdk","@tanstack/react-query","a","about","above","accent","access","account","action","actions","active","add","added","adding","admin","after","again","align","align-[-2px]","all","allowed","already","alt","alts","always","an","and","another","any","anyway","api","appear","application","are","aren","aria-label","as","asks","assignable","at","attention","autoComplete","autoFocus","avatar","away","back","background","be","been","before","behind","being","below","bg-accent-soft","bg-bg/40","bg-success-soft","boolean","border","border-b","border-border","border-border-strong","border-success/40","bot","bot_token","bot_token_set","brand","but","button","by","callback","came","can","canManage","can_invite_guests","can_link","can_manage","cancelled","change","changes","channels","character","characters","check","checked","children","choose","className","client","client_id","client_secret","client_secret_set","closed","code","color","come","comes","compliant","configured","confirmLabel","connected","connection","const","copied","copy","corporation","couldn","count","couple","create","created_at","created_by","creator_lost","current","currentColor","cx","cy","danger","dashboard","data","date","days","default","delete","deleted","description","developer","didn","diplomats","disabled","discord","discord_id","divide-border","divide-y","doesn","don","done","drag","effects","else","empty","enabled","end","ended","ended_at","ended_reason","ends","error","errors","ever","every","everyone","everything","example","existing","expired","expires_at","export","extends","eye","eyebrow","false","few","fewer","fill","fix","fleet","flex","flex-1","flex-col","flex-wrap","follow","font-medium","font-mono","font-semibold","footer","for","force","from","full","function","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-5","gap-6","gap-8","gave","get","gets","ghost","give","given","go","gone","good","grid","grid-cols-[32px_1fr]","group","groups","guest","guest_enabled","guest_hours_ceiling","guest_max_hours","guest_redirect_uri","guest_role_id","guest_role_name","guests","guild","guild_id","guild_name","h","h-16","h-56","h-64","h-96","h-fit","hand","handled","has","has_access","hasn","have","height","here","hint","hours","hover:text-accent-ink","hover:text-text","hover:underline","how","href","i","icon","icon-xs","icons","id","if","import","in","info","inline","inline-flex","instanceof","instead","interface","invite_url","invited","invited_by","invites","is","isLoading","isPending","isn","iso","it","items","items-center","items-end","items-stretch","its","j","join","joined","joined_at","joins","justify-between","keep","keeps","kept","key","kick","kick_without_access","kicked","kind","label","last","last_full_sync","leadership","learns","leaves","left","length","let","lg","lg:grid-cols-2","lg:grid-cols-[1fr_320px]","lg:items-center","limit","link","linked","linked_at","links","list","list-disc","lists","live","ll","load","loading","long","longer","lose","loses","lost","m","m12","m18.84","m4.9","m5.17","main","make","maker","manage_discord","manager","many","mapped","mappings","match","matches","matching","max","max-w-2xl","max-w-32","max-w-72","max-w-prose","max-w-sm","max-w-xl","maxLength","max_hours","max_uses","may","mb-2","mb-3","me","meeting","member","members","min","min-h-[50vh]","min-w-0","min-w-56","minutes","ml-1","moment","more","most","mr-1","ms","mt-1","mt-1.5","mt-2","mt-3","must","mutationFn","mx-auto","my","name","navigate","needle","needs","neutral","new","next","nickname","nickname_format","no","nobody","none","noreferrer","not","nothing","noticed","now","nudge","null","number","of","off","on","onChange","onCheckedChange","onClick","onConfirm","onError","onFocus","onMade","onOpenChange","onRemove","onRevoke","onSelect","onSuccess","onValueChange","on_server","once","one","ones","only","opacity-75","open","opens","or","order","our","out","outline","overview","own","p-4","p-card","page","password","past","paste","patch","path","pb-2","people","permission","person","pick","pills","pl-4","place","place-items-center","placeholder","points","portal","portrait","position","post","presets","press","primary","problems","profile","pt-1","public","publicRoutes","put","px-3","px-card","py-2","py-3","qc","queryFn","queryKey","r","ran","re","react","react-router","readOnly","redirect","redirect_uri","refresh","refuses","rel","remove","removed","replace","require_for_compliance","rest","retry","return","revoke","revoked","revoking","right","right-click","role","roleById","role_id","role_name","role_names","roles","roles_due","round","rounded","rounded-full","routes","rows","run","runCheck","running","runs","rx","ry","s","save","search","second","secondary","secret","see","sees","select","send","sends","sent","server","server_url","set","setCheck","setConfirmUnlink","setCreating","setError","setForm","setHours","setJoined","setLabel","setMade","setMaxUses","setOpen","setQ","setRemove","setRevoking","setRole","setRows","setSecret","setShowPast","setTab","setTarget","setToken","settings","setup","several","should","showOwner","shown","shows","shrink-0","sign","sign-in","signing","signs","site","size","size-12","size-2.5","size-3","size-3.5","size-4","size-6","size-7","size-8","sm","sm:flex-row","sm:grid-cols-2","sm:grid-cols-3","sm:items-center","sm:p-8","so","someone","soon","space-y-1","space-y-3","space-y-4","space-y-5","space-y-6","src","st","staleTime","stand","start","state","states","stats","status","stay","still","stop","stopped","stops","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","switch","switched","sync","synced_at","t","tab","take","taken","takes","target","target_id","temporary","text","text-[11px]","text-accent-ink","text-lg","text-muted","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xl","text-xs","that","the","their","them","then","there","they","think","this","through","title","to","toast","token","tone","tracking-[0.12em]","transparent","tried","true","truncate","turn","type","undefined","under","underline-offset-4","unlink","unlinked","until","untilText","up","updated","uppercase","url","use","useQuery","useQueryClient","useSearchParams","useStartLink","useState","used","used_up","user","username","uses","v","value","variant","ve","viewBox","viewable","void","w-80","w-full","waiting","warning","was","wasn","were","weren","when","where","whether","which","while","who","whoever","whose","widgets","width","will","with","withdraw","withdrawn","within","without","work","working","works","xl:grid-cols-[1fr_340px]","xl:grid-cols-[1fr_360px]","xl:grid-cols-[1fr_380px]","xs","yet","you","your"];
