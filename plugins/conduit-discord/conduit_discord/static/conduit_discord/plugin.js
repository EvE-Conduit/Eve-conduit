import { Alert as e, ApiError as t, Avatar as n, Badge as r, Button as i, Card as a, CardBody as o, CardFooter as s, CardHeader as c, ConfirmDialog as l, DropdownContent as u, DropdownItem as d, DropdownMenu as f, DropdownSeparator as p, DropdownTrigger as m, EmptyState as h, Field as g, Input as _, PageHeader as v, SearchInput as y, Select as b, Skeleton as x, Spinner as S, StatCard as C, SwitchRow as w, THead as ee, TabPanel as T, Table as te, TableToolbar as ne, Tabs as re, Td as E, Th as D, Tr as ie, api as O, cn as ae, definePlugin as oe, timeAgo as k, toast as A, useHasPerm as se } from "@conduit/sdk";
import { Link as j, useNavigate as ce, useSearchParams as le } from "react-router";
import { useMutation as M, useQuery as N, useQueryClient as P } from "@tanstack/react-query";
import { useEffect as ue, useRef as de, useState as F } from "react";
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
var B = ({ className: e = "size-4" }) => /* @__PURE__ */ L("svg", {
	viewBox: "0 0 24 24",
	fill: "currentColor",
	className: e,
	"aria-hidden": !0,
	children: /* @__PURE__ */ L("path", { d: "M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14 14 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13 13 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03M8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418m7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418" })
}), V = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M20 7h-9" }),
		/* @__PURE__ */ L("path", { d: "M14 17H5" }),
		/* @__PURE__ */ L("circle", {
			cx: "17",
			cy: "17",
			r: "3"
		}),
		/* @__PURE__ */ L("circle", {
			cx: "7",
			cy: "7",
			r: "3"
		})
	]
}), H = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ L("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ L("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ L("path", { d: "M8 16H3v5" })
	]
}), U = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" }),
		/* @__PURE__ */ L("path", { d: "m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" }),
		/* @__PURE__ */ L("path", { d: "M8 2v3" }),
		/* @__PURE__ */ L("path", { d: "M2 8h3" }),
		/* @__PURE__ */ L("path", { d: "M16 22v-3" }),
		/* @__PURE__ */ L("path", { d: "M22 16h-3" })
	]
}), W = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ L("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ L("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), fe = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ L("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), pe = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M5 12h14" }), /* @__PURE__ */ L("path", { d: "M12 5v14" })]
}), G = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M3 6h18" }),
		/* @__PURE__ */ L("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ L("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), K = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "M20 6 9 17l-5-5" })
}), me = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ L("path", { d: "M19 12H5" })]
}), q = "/api/p/discord", J = ["discord", "admin"];
function he() {
	let { data: e, isLoading: t } = N({
		queryKey: J,
		queryFn: () => O.get(`${q}/admin`)
	}), [n, r] = F(null), i = n ?? (e?.settings.configured ? "roles" : "setup");
	return /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(v, {
		eyebrow: /* @__PURE__ */ R(j, {
			to: "/p/discord",
			className: "inline-flex items-center gap-1 hover:text-text",
			children: [/* @__PURE__ */ L(me, { className: "size-3" }), " Discord"]
		}),
		title: "Server setup",
		icon: /* @__PURE__ */ L(B, {}),
		description: "Connect your Discord server, choose which groups and states get which roles, and keep an eye on linked members.",
		actions: e?.settings.configured ? /* @__PURE__ */ L(ge, {}) : void 0
	}), t || !e ? /* @__PURE__ */ L(x, { className: "h-96" }) : /* @__PURE__ */ R("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ R("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ L(C, {
					label: "Server",
					value: e.settings.guild_name || (e.settings.configured ? "Not checked yet" : "Not connected"),
					tone: e.settings.configured ? "success" : "warning"
				}),
				/* @__PURE__ */ L(C, {
					label: "Linked members",
					value: e.stats.linked,
					hint: e.settings.last_full_sync ? `full sync ${k(e.settings.last_full_sync)}` : "every 6 hours, and on every change"
				}),
				/* @__PURE__ */ L(C, {
					label: "Sync problems",
					value: e.stats.errors,
					tone: e.stats.errors ? "warning" : void 0,
					hint: "see Members"
				})
			]
		}), /* @__PURE__ */ R(re, {
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
				}
			],
			children: [
				/* @__PURE__ */ L(T, {
					value: "setup",
					children: /* @__PURE__ */ L(X, { data: e })
				}),
				/* @__PURE__ */ L(T, {
					value: "roles",
					children: /* @__PURE__ */ L(ve, { data: e })
				}),
				/* @__PURE__ */ L(T, {
					value: "members",
					children: /* @__PURE__ */ L(ye, {})
				})
			]
		})]
	})] });
}
function ge() {
	let e = P(), t = M({
		mutationFn: () => O.post(`${q}/admin/sync`),
		onSuccess: () => {
			A.success("Syncing everyone's roles; this takes a moment with many members"), setTimeout(() => e.invalidateQueries({ queryKey: ["discord"] }), 4e3);
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ R(i, {
		loading: t.isPending,
		onClick: () => t.mutate(),
		children: [/* @__PURE__ */ L(H, {}), " Sync everyone"]
	});
}
function _e({ value: e }) {
	return /* @__PURE__ */ R("div", {
		className: "flex items-stretch",
		children: [/* @__PURE__ */ L(_, {
			readOnly: !0,
			value: e,
			className: "font-mono text-xs",
			onFocus: (e) => e.target.select()
		}), /* @__PURE__ */ L(i, {
			variant: "secondary",
			size: "icon",
			"aria-label": "Copy",
			onClick: () => navigator.clipboard.writeText(e).then(() => A.success("Copied"), () => A.error("Couldn't copy; select the text instead")),
			children: /* @__PURE__ */ L(fe, {})
		})]
	});
}
function Y({ n: e, title: t, done: n, children: r }) {
	return /* @__PURE__ */ R("li", {
		className: "grid grid-cols-[32px_1fr] gap-4",
		children: [/* @__PURE__ */ L("span", {
			className: ae("grid size-8 place-items-center border font-mono text-sm", n ? "border-success/40 bg-success-soft text-success-fg" : "border-border-strong text-muted"),
			children: n ? /* @__PURE__ */ L(K, {}) : e
		}), /* @__PURE__ */ R("div", {
			className: "min-w-0 space-y-3 pb-2",
			children: [/* @__PURE__ */ L("div", {
				className: "pt-1 font-medium",
				children: t
			}), r]
		})]
	});
}
function X({ data: t }) {
	let n = P(), r = t.settings, [l, u] = F({
		client_id: r.client_id,
		guild_id: r.guild_id,
		nickname_format: r.nickname_format,
		kick_without_access: r.kick_without_access
	}), [d, f] = F(""), [p, m] = F(""), [h, v] = F(null), y = M({
		mutationFn: () => O.put(`${q}/admin/settings`, {
			...l,
			client_secret: d || null,
			bot_token: p || null
		}),
		onSuccess: (e) => {
			n.setQueryData(J, e), n.invalidateQueries({ queryKey: ["discord", "me"] }), f(""), m(""), A.success("Saved");
		},
		onError: (e) => A.error(e.message)
	}), b = M({
		mutationFn: () => O.post(`${q}/admin/check`),
		onSuccess: (e) => {
			v(e), n.setQueryData(["discord", "check"], e), n.invalidateQueries({ queryKey: J });
		},
		onError: (e) => {
			v(null), A.error(e.message);
		}
	}), x = (e) => u((t) => ({
		...t,
		...e
	}));
	return /* @__PURE__ */ R("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_380px]",
		children: [/* @__PURE__ */ R(a, { children: [/* @__PURE__ */ L(o, { children: /* @__PURE__ */ R("ol", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ R(Y, {
					n: 1,
					title: "Create a Discord application",
					done: !!r.client_id && r.client_secret_set,
					children: [
						/* @__PURE__ */ R("p", {
							className: "text-sm text-muted",
							children: [
								"Open the",
								" ",
								/* @__PURE__ */ L("a", {
									href: "https://discord.com/developers/applications",
									target: "_blank",
									rel: "noreferrer",
									className: "text-accent-ink underline-offset-4 hover:underline",
									children: "Discord developer portal"
								}),
								" ",
								"and press ",
								/* @__PURE__ */ L("b", { children: "New Application" }),
								". On its ",
								/* @__PURE__ */ L("b", { children: "OAuth2" }),
								" page, add this redirect and copy the client id and secret here."
							]
						}),
						/* @__PURE__ */ L(g, {
							label: "Redirect",
							children: /* @__PURE__ */ L(_e, { value: t.redirect_uri })
						}),
						/* @__PURE__ */ R("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ L(g, {
								label: "Client id",
								children: /* @__PURE__ */ L(_, {
									value: l.client_id,
									onChange: (e) => x({ client_id: e.target.value }),
									placeholder: "1234567890123456789",
									className: "font-mono"
								})
							}), /* @__PURE__ */ L(g, {
								label: "Client secret",
								hint: r.client_secret_set ? "Saved. Type a new one to replace it." : void 0,
								children: /* @__PURE__ */ L(_, {
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
				/* @__PURE__ */ R(Y, {
					n: 2,
					title: "Add the bot to your server",
					done: r.bot_token_set && !!r.guild_id,
					children: [
						/* @__PURE__ */ R("p", {
							className: "text-sm text-muted",
							children: [
								"On the application's ",
								/* @__PURE__ */ L("b", { children: "Bot" }),
								" page press ",
								/* @__PURE__ */ L("b", { children: "Reset Token" }),
								" and paste it here. For the server id, turn on Developer Mode in Discord (Settings → Advanced), then right-click the server → ",
								/* @__PURE__ */ L("b", { children: "Copy Server ID" }),
								"."
							]
						}),
						/* @__PURE__ */ R("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ L(g, {
								label: "Bot token",
								hint: r.bot_token_set ? "Saved. Paste a new one to replace it." : void 0,
								children: /* @__PURE__ */ L(_, {
									type: "password",
									autoComplete: "off",
									value: p,
									onChange: (e) => m(e.target.value),
									placeholder: r.bot_token_set ? "••••••••••••" : "",
									className: "font-mono"
								})
							}), /* @__PURE__ */ L(g, {
								label: "Server id",
								children: /* @__PURE__ */ L(_, {
									value: l.guild_id,
									onChange: (e) => x({ guild_id: e.target.value }),
									placeholder: "1234567890123456789",
									className: "font-mono"
								})
							})]
						}),
						t.invite_url ? /* @__PURE__ */ L("a", {
							href: t.invite_url,
							target: "_blank",
							rel: "noreferrer",
							children: /* @__PURE__ */ R(i, {
								variant: "outline",
								children: [/* @__PURE__ */ L(B, {}), " Invite the bot to the server"]
							})
						}) : /* @__PURE__ */ L("p", {
							className: "text-xs text-subtle",
							children: "Save the client id to get the link that invites the bot."
						}),
						/* @__PURE__ */ L("p", {
							className: "text-xs text-subtle",
							children: "It asks for Manage Roles, Manage Nicknames, Create Invite and Kick Members. Afterwards drag the bot's role above every role it should give (Server Settings → Roles)."
						})
					]
				}),
				/* @__PURE__ */ R(Y, {
					n: 3,
					title: "Choose how members appear",
					done: r.configured,
					children: [/* @__PURE__ */ L(g, {
						label: "Nickname",
						hint: /* @__PURE__ */ R(I, { children: [
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
						children: /* @__PURE__ */ L(_, {
							value: l.nickname_format,
							onChange: (e) => x({ nickname_format: e.target.value }),
							placeholder: "[{corp_ticker}] {character}",
							className: "max-w-sm font-mono"
						})
					}), /* @__PURE__ */ L("div", {
						className: "border border-border px-3",
						children: /* @__PURE__ */ L(w, {
							label: "Remove people who lose access from the server",
							description: "Off: they only lose the roles this site gave them. On: they're kicked and have to link again once they have access.",
							checked: l.kick_without_access,
							onCheckedChange: (e) => x({ kick_without_access: e })
						})
					})]
				})
			]
		}) }), /* @__PURE__ */ L(s, { children: /* @__PURE__ */ L(i, {
			variant: "primary",
			loading: y.isPending,
			onClick: () => y.mutate(),
			children: "Save"
		}) })] }), /* @__PURE__ */ R(a, {
			className: "h-fit",
			children: [/* @__PURE__ */ L(c, {
				title: "Connection",
				description: "Asks Discord whether everything is in place."
			}), /* @__PURE__ */ R(o, {
				className: "space-y-4",
				children: [h ? /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ R("div", {
					className: "flex items-center gap-3",
					children: [h.guild.icon ? /* @__PURE__ */ L("img", {
						src: h.guild.icon,
						alt: "",
						className: "size-12"
					}) : /* @__PURE__ */ L("span", {
						className: "grid size-12 place-items-center bg-accent-soft text-accent-ink",
						children: /* @__PURE__ */ L(B, { className: "size-6" })
					}), /* @__PURE__ */ R("div", { children: [/* @__PURE__ */ L("div", {
						className: "font-medium",
						children: h.guild.name
					}), /* @__PURE__ */ R("div", {
						className: "text-xs text-subtle",
						children: [
							"bot: ",
							h.bot.name,
							" ",
							h.bot.on_server ? "· on the server" : "· not on the server"
						]
					})] })]
				}), h.problems.length === 0 ? /* @__PURE__ */ L(e, {
					tone: "success",
					title: "All good",
					children: "The bot can add members, give the mapped roles and set nicknames."
				}) : /* @__PURE__ */ L(e, {
					tone: "warning",
					title: `${h.problems.length} thing${h.problems.length === 1 ? "" : "s"} to fix`,
					children: /* @__PURE__ */ L("ul", {
						className: "list-disc space-y-1 pl-4",
						children: h.problems.map((e) => /* @__PURE__ */ L("li", { children: e }, e))
					})
				})] }) : /* @__PURE__ */ L("p", {
					className: "text-sm text-muted",
					children: r.bot_token_set && r.guild_id ? "Not checked yet." : "Save the bot token and server id first."
				}), /* @__PURE__ */ R(i, {
					className: "w-full",
					disabled: !r.bot_token_set || !r.guild_id,
					loading: b.isPending,
					onClick: () => b.mutate(),
					children: [/* @__PURE__ */ L(H, {}), " Check connection"]
				})]
			})]
		})]
	});
}
function ve({ data: t }) {
	let n = P(), { data: l, isLoading: u, error: d } = N({
		queryKey: ["discord", "check"],
		queryFn: () => O.post(`${q}/admin/check`),
		staleTime: 6e4,
		retry: !1
	}), [f, p] = F(null), m = f ?? t.mappings, [_, v] = F(""), [y, x] = F(""), S = M({
		mutationFn: (e) => O.put(`${q}/admin/mappings`, { mappings: e }),
		onSuccess: (e) => {
			n.setQueryData(J, e), p(null), A.success("Saved; everyone's roles are being updated");
		},
		onError: (e) => A.error(e.message)
	}), C = l?.roles ?? [], w = Object.fromEntries(C.map((e) => [e.id, e]));
	return /* @__PURE__ */ R("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_340px]",
		children: [/* @__PURE__ */ R(a, { children: [
			/* @__PURE__ */ L(c, {
				title: "Who gets which role",
				description: "Members of a group, or everyone in a state, get the role. A person can match several rows."
			}),
			d ? /* @__PURE__ */ L(o, { children: /* @__PURE__ */ L(e, {
				tone: "warning",
				title: "Couldn't load the server's roles",
				children: d.message
			}) }) : /* @__PURE__ */ L(o, {
				className: "border-b border-border",
				children: /* @__PURE__ */ R("div", {
					className: "flex flex-wrap items-end gap-3",
					children: [
						/* @__PURE__ */ L(g, {
							label: "Group or state",
							className: "min-w-56 flex-1",
							children: /* @__PURE__ */ R(b, {
								value: _,
								onChange: (e) => v(e.target.value),
								children: [
									/* @__PURE__ */ L("option", {
										value: "",
										children: "Choose…"
									}),
									/* @__PURE__ */ L("optgroup", {
										label: "States",
										children: t.states.map((e) => /* @__PURE__ */ L("option", {
											value: `state:${e.id}`,
											children: e.name
										}, `s${e.id}`))
									}),
									/* @__PURE__ */ L("optgroup", {
										label: "Groups",
										children: t.groups.map((e) => /* @__PURE__ */ L("option", {
											value: `group:${e.id}`,
											children: e.name
										}, `g${e.id}`))
									})
								]
							})
						}),
						/* @__PURE__ */ L(g, {
							label: "Discord role",
							className: "min-w-56 flex-1",
							children: /* @__PURE__ */ R(b, {
								value: y,
								onChange: (e) => x(e.target.value),
								disabled: u,
								children: [/* @__PURE__ */ L("option", {
									value: "",
									children: u ? "Loading roles…" : "Choose…"
								}), C.map((e) => /* @__PURE__ */ R("option", {
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
						/* @__PURE__ */ R(i, {
							disabled: !_ || !y,
							onClick: () => {
								let [e, n] = _.split(":"), r = w[y];
								if (!e || !r) return;
								let i = e === "group" ? t.groups.find((e) => e.id === Number(n))?.name : t.states.find((e) => e.id === Number(n))?.name;
								p([...m, {
									kind: e,
									target_id: Number(n),
									target: i,
									role_id: r.id,
									role_name: r.name
								}]), x("");
							},
							children: [/* @__PURE__ */ L(pe, {}), " Add"]
						})
					]
				})
			}),
			m.length === 0 ? /* @__PURE__ */ L(h, {
				icon: /* @__PURE__ */ L(B, {}),
				title: "No roles mapped yet",
				description: "Linked members join the server without any roles until you add some."
			}) : /* @__PURE__ */ L("ul", {
				className: "divide-y divide-border",
				children: m.map((e, t) => {
					let n = w[e.role_id];
					return /* @__PURE__ */ R("li", {
						className: "flex items-center gap-3 px-card py-3 text-sm",
						children: [
							/* @__PURE__ */ L(r, {
								tone: e.kind === "state" ? "info" : "neutral",
								children: e.kind
							}),
							/* @__PURE__ */ L("span", {
								className: "min-w-0 flex-1 truncate font-medium",
								children: e.target
							}),
							/* @__PURE__ */ L("span", {
								className: "text-subtle",
								children: "→"
							}),
							/* @__PURE__ */ R("span", {
								className: "flex min-w-0 flex-1 items-center gap-2",
								children: [
									/* @__PURE__ */ L("span", {
										className: "size-2.5 shrink-0 rounded-full border border-border",
										style: { background: n?.color ?? "transparent" }
									}),
									/* @__PURE__ */ R("span", {
										className: "truncate",
										children: ["@", n?.name ?? e.role_name ?? e.role_id]
									}),
									l && !n && /* @__PURE__ */ L(r, {
										tone: "danger",
										children: "deleted"
									}),
									n && !n.assignable && /* @__PURE__ */ L(r, {
										tone: "warning",
										children: "above the bot"
									})
								]
							}),
							/* @__PURE__ */ L(i, {
								variant: "ghost",
								size: "icon-xs",
								"aria-label": "Remove",
								onClick: () => p(m.filter((e, n) => n !== t)),
								children: /* @__PURE__ */ L(G, {})
							})
						]
					}, `${e.kind}-${e.target_id}-${e.role_id}`);
				})
			}),
			f && /* @__PURE__ */ R(s, {
				className: "justify-between",
				children: [/* @__PURE__ */ L("span", {
					className: "text-xs text-muted",
					children: "Unsaved changes"
				}), /* @__PURE__ */ R("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ L(i, {
						variant: "ghost",
						onClick: () => p(null),
						children: "Discard"
					}), /* @__PURE__ */ L(i, {
						variant: "primary",
						loading: S.isPending,
						onClick: () => S.mutate(m),
						children: "Save and sync"
					})]
				})]
			})
		] }), /* @__PURE__ */ R(a, {
			className: "h-fit",
			children: [/* @__PURE__ */ L(c, { title: "How roles are kept" }), /* @__PURE__ */ R(o, {
				className: "space-y-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ L("p", { children: "Roles change as soon as someone joins or leaves a group, their state changes or they pick another main, and everyone is checked again every 6 hours." }),
					/* @__PURE__ */ L("p", { children: "Only mapped roles are touched. Roles you give by hand on Discord stay." }),
					/* @__PURE__ */ L("p", { children: "The bot can only give roles below its own; drag its role up in Server Settings → Roles if a role shows \"above the bot\"." })
				]
			})]
		})]
	});
}
function ye() {
	let e = P(), { data: o, isLoading: s } = N({
		queryKey: ["discord", "members"],
		queryFn: () => O.get(`${q}/admin/members`)
	}), [c, g] = F(""), [_, v] = F(null), b = () => e.invalidateQueries({ queryKey: ["discord"] }), S = M({
		mutationFn: (e) => O.post(`${q}/admin/members/${e}/sync`),
		onSuccess: (e) => {
			e.removed ? A.success("They no longer have access and were removed from the server") : e.error ? A.error(e.error) : A.success("Roles updated"), b();
		},
		onError: (e) => A.error(e.message)
	}), C = M({
		mutationFn: ({ id: e, kick: t, force: n = !1 }) => O.delete(`${q}/admin/members/${e}?kick=${t}${n ? "&force=true" : ""}`),
		onSuccess: () => {
			A.success("Unlinked"), b();
		},
		onError: (e, n) => {
			e instanceof t && e.status === 502 && !n.force ? A.error(e.message, {
				action: {
					label: "Forget anyway",
					onClick: () => C.mutate({
						...n,
						force: !0
					})
				},
				description: "Forgetting it leaves their roles on Discord; take them off there by hand."
			}) : A.error(e.message);
		}
	});
	if (s || !o) return /* @__PURE__ */ L(x, { className: "h-64" });
	let w = c.trim().toLowerCase(), T = w ? o.filter((e) => e.user.name.toLowerCase().includes(w) || e.username.toLowerCase().includes(w)) : o;
	return /* @__PURE__ */ R(a, { children: [
		/* @__PURE__ */ L(ne, { children: /* @__PURE__ */ L(y, {
			value: c,
			onChange: (e) => g(e.target.value),
			placeholder: "Member or Discord name",
			className: "w-72"
		}) }),
		T.length === 0 ? /* @__PURE__ */ L(h, {
			icon: /* @__PURE__ */ L(B, {}),
			title: o.length ? "Nobody matches" : "Nobody has linked Discord yet"
		}) : /* @__PURE__ */ R(te, { children: [/* @__PURE__ */ L(ee, { children: /* @__PURE__ */ R("tr", { children: [
			/* @__PURE__ */ L(D, { children: "Member" }),
			/* @__PURE__ */ L(D, { children: "Discord" }),
			/* @__PURE__ */ L(D, { children: "Roles" }),
			/* @__PURE__ */ L(D, { children: "Checked" }),
			/* @__PURE__ */ L(D, {})
		] }) }), /* @__PURE__ */ L("tbody", { children: T.map((e) => /* @__PURE__ */ R(ie, { children: [
			/* @__PURE__ */ L(E, { children: /* @__PURE__ */ R("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ L(n, {
					src: e.user.portrait,
					name: e.user.name,
					size: "sm"
				}), /* @__PURE__ */ R("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ L("div", {
						className: "truncate font-medium",
						children: e.user.name
					}), !e.has_access && /* @__PURE__ */ L(r, {
						tone: "warning",
						children: "no access"
					})]
				})]
			}) }),
			/* @__PURE__ */ L(E, { children: /* @__PURE__ */ R("div", {
				className: "flex items-center gap-2.5",
				children: [/* @__PURE__ */ L(n, {
					src: e.avatar,
					name: e.username,
					size: "xs",
					rounded: "full"
				}), /* @__PURE__ */ R("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ L("div", {
						className: "truncate text-sm",
						children: e.username
					}), e.nickname && /* @__PURE__ */ L("div", {
						className: "truncate text-xs text-subtle",
						children: e.nickname
					})]
				})]
			}) }),
			/* @__PURE__ */ L(E, { children: /* @__PURE__ */ L("div", {
				className: "flex max-w-72 flex-wrap gap-1",
				children: e.role_names.length ? e.role_names.map((e) => /* @__PURE__ */ R(r, {
					tone: "accent",
					children: ["@", e]
				}, e)) : /* @__PURE__ */ L("span", {
					className: "text-xs text-subtle",
					children: "none"
				})
			}) }),
			/* @__PURE__ */ L(E, {
				className: "text-sm",
				children: e.error ? /* @__PURE__ */ L("span", {
					className: "text-warning-fg",
					title: e.error,
					children: e.error.length > 60 ? `${e.error.slice(0, 60)}…` : e.error
				}) : /* @__PURE__ */ L("span", {
					className: "text-muted",
					children: k(e.synced_at)
				})
			}),
			/* @__PURE__ */ L(E, {
				align: "right",
				children: /* @__PURE__ */ R(f, { children: [/* @__PURE__ */ L(m, {
					asChild: !0,
					children: /* @__PURE__ */ L(i, {
						variant: "ghost",
						size: "sm",
						children: "Actions"
					})
				}), /* @__PURE__ */ R(u, {
					align: "end",
					children: [
						/* @__PURE__ */ R(d, {
							onSelect: () => S.mutate(e.user.id),
							children: [/* @__PURE__ */ L(H, {}), " Sync now"]
						}),
						/* @__PURE__ */ R(d, {
							onSelect: () => window.open(`https://discord.com/users/${e.discord_id}`, "_blank", "noreferrer"),
							children: [/* @__PURE__ */ L(W, {}), " Discord profile"]
						}),
						/* @__PURE__ */ L(p, {}),
						/* @__PURE__ */ R(d, {
							onSelect: () => v({
								m: e,
								kick: !1
							}),
							children: [/* @__PURE__ */ L(U, {}), " Unlink"]
						}),
						/* @__PURE__ */ R(d, {
							danger: !0,
							onSelect: () => v({
								m: e,
								kick: !0
							}),
							children: [/* @__PURE__ */ L(G, {}), " Unlink and kick"]
						})
					]
				})] })
			})
		] }, e.user.id)) })] }),
		/* @__PURE__ */ L(l, {
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
//#endregion
//#region src/member.tsx
function Z() {
	return N({
		queryKey: ["discord", "me"],
		queryFn: () => O.get(`${q}/me`)
	});
}
function Q() {
	return M({
		mutationFn: () => O.post(`${q}/link`),
		onSuccess: ({ url: e }) => window.location.assign(e),
		onError: (e) => A.error(e.message)
	});
}
function be() {
	let t = P(), s = se("discord.manage_discord"), { data: u, isLoading: d } = Z(), f = Q(), [p, m] = F(!1), g = M({
		mutationFn: () => O.post(`${q}/sync`),
		onSuccess: (e) => {
			t.setQueryData(["discord", "me"], e), A.success("Your roles are up to date");
		},
		onError: (e) => {
			t.invalidateQueries({ queryKey: ["discord", "me"] }), A.error(e.message);
		}
	}), _ = M({
		mutationFn: () => O.post(`${q}/unlink`),
		onSuccess: (e) => {
			t.setQueryData(["discord", "me"], e), A.success("Discord account unlinked");
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(v, {
			eyebrow: "Communication",
			title: "Discord",
			icon: /* @__PURE__ */ L(B, {}),
			description: "Link your Discord account to join the server. Your roles and nickname follow your groups and main character.",
			actions: s ? /* @__PURE__ */ L(j, {
				to: "/p/discord/admin",
				children: /* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(V, {}), " Server setup"] })
			}) : void 0
		}),
		d || !u ? /* @__PURE__ */ L(x, { className: "h-56" }) : u.configured ? u.account ? /* @__PURE__ */ R("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_360px]",
			children: [/* @__PURE__ */ R("div", {
				className: "space-y-6",
				children: [u.account.error ? /* @__PURE__ */ L(e, {
					tone: "warning",
					title: "Your Discord roles couldn't be updated",
					action: u.account.error.startsWith("Not on the server") ? /* @__PURE__ */ L(i, {
						size: "sm",
						variant: "primary",
						loading: f.isPending,
						onClick: () => f.mutate(),
						children: "Join the server"
					}) : void 0,
					children: u.account.error
				}) : null, /* @__PURE__ */ L(a, { children: /* @__PURE__ */ R("div", {
					className: "flex flex-col gap-5 p-card sm:flex-row sm:items-center",
					children: [
						/* @__PURE__ */ L(n, {
							src: u.account.avatar,
							name: u.account.username,
							size: "lg",
							rounded: "full"
						}),
						/* @__PURE__ */ R("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ R("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ L("span", {
										className: "text-lg font-semibold",
										children: u.account.username
									}), /* @__PURE__ */ R(r, {
										tone: "success",
										children: [/* @__PURE__ */ L(K, { className: "size-3" }), " Linked"]
									})]
								}),
								/* @__PURE__ */ R("div", {
									className: "text-sm text-muted",
									children: [
										"on ",
										u.server || "the server",
										u.account.nickname ? /* @__PURE__ */ R(I, { children: [" as ", /* @__PURE__ */ L("span", {
											className: "text-text",
											children: u.account.nickname
										})] }) : null
									]
								}),
								/* @__PURE__ */ R("div", {
									className: "mt-1 text-xs text-subtle",
									children: [
										"Linked ",
										k(u.account.linked_at),
										" · roles checked ",
										k(u.account.synced_at)
									]
								})
							]
						}),
						/* @__PURE__ */ R("div", {
							className: "flex flex-wrap gap-2",
							children: [
								u.server_url && /* @__PURE__ */ L("a", {
									href: u.server_url,
									target: "_blank",
									rel: "noreferrer",
									children: /* @__PURE__ */ R(i, {
										variant: "primary",
										children: [/* @__PURE__ */ L(W, {}), " Open Discord"]
									})
								}),
								/* @__PURE__ */ R(i, {
									variant: "ghost",
									loading: g.isPending,
									onClick: () => g.mutate(),
									children: [/* @__PURE__ */ L(H, {}), " Fix my roles"]
								}),
								/* @__PURE__ */ R(i, {
									variant: "danger",
									onClick: () => m(!0),
									children: [/* @__PURE__ */ L(U, {}), " Unlink"]
								})
							]
						})
					]
				}) })]
			}), /* @__PURE__ */ R(a, {
				className: "h-fit",
				children: [/* @__PURE__ */ L(c, {
					title: "Your roles",
					description: "Given by this site. Roles given by hand on Discord aren't touched."
				}), /* @__PURE__ */ L(o, { children: /* @__PURE__ */ L($, {
					roles: u.roles,
					empty: "None of your groups come with a Discord role."
				}) })]
			})]
		}) : /* @__PURE__ */ L(a, { children: /* @__PURE__ */ R("div", {
			className: "grid gap-8 p-card sm:p-8 lg:grid-cols-[1fr_320px] lg:items-center",
			children: [/* @__PURE__ */ R("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ R("div", {
					className: "flex items-center gap-3 text-accent-ink",
					children: [/* @__PURE__ */ L(B, { className: "size-8" }), /* @__PURE__ */ L("span", {
						className: "text-xl font-semibold text-text",
						children: u.server || "Our Discord server"
					})]
				}), u.can_link ? /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L("p", {
					className: "max-w-prose text-sm text-muted",
					children: "Sign in with Discord and you're put on the server straight away, with the roles that go with your groups. Nobody here sees your Discord password or messages; the site only learns your Discord name."
				}), /* @__PURE__ */ L("div", {
					className: "flex flex-wrap gap-2",
					children: /* @__PURE__ */ R(i, {
						variant: "primary",
						size: "lg",
						loading: f.isPending,
						onClick: () => f.mutate(),
						children: [/* @__PURE__ */ L(B, {}), " Link Discord and join"]
					})
				})] }) : /* @__PURE__ */ L(e, {
					tone: "warning",
					title: "You don't have access to the Discord server",
					children: "Access comes with your membership. Ask your corporation's leadership if you think you should have it."
				})]
			}), u.can_link && /* @__PURE__ */ R("div", {
				className: "border border-border bg-bg/40 p-4 text-sm",
				children: [
					/* @__PURE__ */ L("div", {
						className: "mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
						children: "You'll get"
					}),
					/* @__PURE__ */ L("div", {
						className: "mb-3 font-medium",
						children: u.nickname ?? "Your Discord name"
					}),
					/* @__PURE__ */ L($, {
						roles: u.roles_due,
						empty: "No roles yet; they come with your groups."
					})
				]
			})]
		}) }) : /* @__PURE__ */ L(a, { children: /* @__PURE__ */ L(h, {
			icon: /* @__PURE__ */ L(B, {}),
			title: "Discord isn't set up yet",
			description: s ? "Connect a Discord application and server under Server setup." : "Your leadership hasn't connected a Discord server to this site yet.",
			action: s ? /* @__PURE__ */ L(j, {
				to: "/p/discord/admin",
				children: /* @__PURE__ */ R(i, {
					variant: "primary",
					children: [/* @__PURE__ */ L(V, {}), " Server setup"]
				})
			}) : void 0
		}) }),
		/* @__PURE__ */ L(l, {
			open: p,
			onOpenChange: m,
			title: "Unlink your Discord account?",
			description: "The roles this site gave you are taken away (you may be removed from the server). You can link again at any time.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(U, {}), " Unlink"] }),
			onConfirm: () => _.mutateAsync()
		})
	] });
}
function $({ roles: e, empty: t }) {
	return e.length === 0 ? /* @__PURE__ */ L("p", {
		className: "text-sm text-subtle",
		children: t
	}) : /* @__PURE__ */ L("div", {
		className: "flex flex-wrap gap-1.5",
		children: e.map((e) => /* @__PURE__ */ R(r, {
			tone: "accent",
			children: ["@", e]
		}, e))
	});
}
function xe() {
	let [e] = le(), t = ce(), n = P(), r = de(!1), [o, s] = F(e.get("error") ? "You cancelled the sign-in with Discord." : null), c = Q();
	return ue(() => {
		let i = e.get("code"), a = e.get("state");
		if (!(r.current || o)) {
			if (!i || !a) {
				s("Discord didn't send a sign-in code back.");
				return;
			}
			r.current = !0, O.post(`${q}/link/finish`, {
				code: i,
				state: a
			}).then((e) => {
				n.setQueryData(["discord", "me"], e), A.success(`Welcome to ${e.server || "the server"}, ${e.account?.username ?? ""}`), t("/p/discord", { replace: !0 });
			}).catch((e) => s(e.message));
		}
	}, [
		e,
		o,
		t,
		n
	]), o ? /* @__PURE__ */ L(a, {
		className: "mx-auto max-w-xl",
		children: /* @__PURE__ */ L(h, {
			icon: /* @__PURE__ */ L(B, {}),
			title: "Discord wasn't linked",
			description: o,
			action: /* @__PURE__ */ R("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ L(j, {
					to: "/p/discord",
					children: /* @__PURE__ */ L(i, {
						variant: "ghost",
						children: "Back"
					})
				}), /* @__PURE__ */ L(i, {
					variant: "primary",
					loading: c.isPending,
					onClick: () => c.mutate(),
					children: "Try again"
				})]
			})
		})
	}) : /* @__PURE__ */ L("div", {
		className: "grid min-h-[50vh] place-items-center",
		children: /* @__PURE__ */ R("div", {
			className: "flex flex-col items-center gap-3 text-sm text-muted",
			children: [/* @__PURE__ */ L(S, {}), "Linking your Discord account and adding you to the server…"]
		})
	});
}
//#endregion
//#region src/index.tsx
function Se() {
	let { data: e, isLoading: t } = Z(), n = Q();
	return t ? /* @__PURE__ */ L(x, { className: "h-16" }) : !e?.configured || !e.account && !e.can_link ? null : e.account ? /* @__PURE__ */ R(j, {
		to: "/p/discord",
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ R("div", {
			className: "flex min-w-0 items-center gap-3",
			children: [/* @__PURE__ */ L(B, { className: "size-7 shrink-0 text-accent-ink" }), /* @__PURE__ */ R("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ L("div", {
					className: "truncate font-medium",
					children: e.account.username
				}), /* @__PURE__ */ L("div", {
					className: "truncate text-xs text-muted",
					children: e.roles.length ? e.roles.map((e) => `@${e}`).join(" ") : "no roles"
				})]
			})]
		}), e.account.error ? /* @__PURE__ */ L(r, {
			tone: "warning",
			children: "Needs attention"
		}) : /* @__PURE__ */ L(r, {
			tone: "success",
			children: "Linked"
		})]
	}) : /* @__PURE__ */ R("div", {
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ R("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ L(B, { className: "size-7 text-accent-ink" }), /* @__PURE__ */ R("div", { children: [/* @__PURE__ */ R("div", {
				className: "font-medium",
				children: ["Join ", e.server || "our Discord"]
			}), /* @__PURE__ */ L("div", {
				className: "text-xs text-muted",
				children: "Link your account to get on the server with your roles."
			})] })]
		}), /* @__PURE__ */ L(i, {
			variant: "primary",
			size: "sm",
			loading: n.isPending,
			onClick: () => n.mutate(),
			children: "Link"
		})]
	});
}
var Ce = oe({
	routes: [
		{
			path: "",
			Component: be
		},
		{
			path: "callback",
			Component: xe
		},
		{
			path: "admin",
			Component: he
		}
	],
	widgets: [{
		id: "link",
		title: "Discord",
		Component: Se,
		size: "sm",
		order: 20
	}]
});
//#endregion
export { Ce as default };

export const classes = ["!data","!o","!r","---","-----------------------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------------------","@conduit/sdk","@tanstack/react-query","a","above","accent","access","account","action","actions","add","adding","admin","after","again","align","alt","an","and","another","any","anyway","api","appear","application","are","aren","aria-label","as","asks","assignable","at","attention","autoComplete","avatar","away","back","background","be","being","below","bg-accent-soft","bg-bg/40","bg-success-soft","boolean","border","border-b","border-border","border-border-strong","border-success/40","bot","bot_token","bot_token_set","brand","but","by","callback","can","canManage","can_link","cancelled","change","changes","check","checked","children","choose","className","client","client_id","client_secret","client_secret_set","code","color","come","comes","configured","confirmLabel","connected","connection","const","copy","corporation","couldn","count","current","currentColor","cx","cy","danger","dashboard","data","date","default","deleted","description","developer","didn","disabled","discord","discord_id","divide-border","divide-y","don","done","drag","effects","else","empty","end","error","errors","every","everyone","everything","export","extends","eye","eyebrow","false","few","fill","fix","flex","flex-1","flex-col","flex-wrap","follow","font-medium","font-mono","font-semibold","for","force","from","full","function","gap-1","gap-1.5","gap-2","gap-2.5","gap-3","gap-4","gap-5","gap-6","gap-8","gave","get","gets","ghost","give","given","go","good","grid","grid-cols-[32px_1fr]","group","groups","guild","guild_id","guild_name","h-16","h-56","h-64","h-96","h-fit","hand","has","has_access","hasn","have","height","here","hint","hover:text-text","hover:underline","how","href","icon","icon-xs","icons","id","if","import","in","info","inline","inline-flex","instanceof","instead","interface","invite_url","invites","is","isLoading","isn","it","items","items-center","items-end","items-stretch","its","j","join","joins","justify-between","keep","kept","key","kick","kick_without_access","kicked","kind","label","last_full_sync","leadership","learns","leaves","length","let","lg","lg:grid-cols-[1fr_320px]","lg:items-center","link","linked","linked_at","list-disc","ll","load","loading","longer","lose","m","m12","m18.84","m5.17","main","manage_discord","many","mapped","mappings","match","matches","max-w-72","max-w-prose","max-w-sm","max-w-xl","may","mb-2","mb-3","me","member","members","min-h-[50vh]","min-w-0","min-w-56","moment","mt-1","mutationFn","mx-auto","my","name","navigate","needle","neutral","new","nickname","nickname_format","no","none","noreferrer","not","now","nudge","null","number","of","off","on","onChange","onCheckedChange","onClick","onConfirm","onError","onFocus","onOpenChange","onSelect","onSuccess","onValueChange","on_server","once","one","only","open","or","order","our","outline","own","p-4","p-card","page","password","paste","patch","path","pb-2","people","person","pick","pills","pl-4","place-items-center","placeholder","portal","portrait","position","post","press","primary","problems","profile","pt-1","put","px-3","px-card","py-3","qc","queryFn","queryKey","r","re","react","react-router","readOnly","redirect","redirect_uri","refresh","rel","remove","removed","replace","rest","retry","return","right","right-click","role","roleById","role_id","role_name","role_names","roles","roles_due","round","rounded","rounded-full","routes","rows","run","runCheck","rx","ry","s","save","secondary","secret","see","sees","select","send","sends","sent","server","server_url","set","setCheck","setConfirmUnlink","setError","setForm","setQ","setRemove","setRole","setRows","setSecret","setTab","setTarget","setToken","settings","setup","several","should","shows","shrink-0","sign-in","signing","site","size","size-12","size-2.5","size-3","size-4","size-6","size-7","size-8","sm","sm:flex-row","sm:grid-cols-2","sm:grid-cols-3","sm:items-center","sm:p-8","so","someone","soon","space-y-1","space-y-3","space-y-4","space-y-6","src","staleTime","stand","start","state","states","stats","status","stay","straight","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","sync","synced_at","t","tab","take","taken","takes","target","target_id","text","text-[11px]","text-accent-ink","text-lg","text-muted","text-sm","text-subtle","text-success-fg","text-text","text-warning-fg","text-xl","text-xs","that","the","their","them","then","there","they","think","this","title","to","token","tone","tracking-[0.12em]","transparent","true","truncate","turn","type","under","underline-offset-4","unlink","unlinked","until","up","updated","uppercase","url","useQueryClient","useSearchParams","useStartLink","useState","used","user","username","v","value","variant","viewBox","w-72","w-full","warning","was","wasn","were","when","where","whether","which","while","who","widgets","width","with","without","works","xl:grid-cols-[1fr_340px]","xl:grid-cols-[1fr_360px]","xl:grid-cols-[1fr_380px]","xs","yet","you","your"];
