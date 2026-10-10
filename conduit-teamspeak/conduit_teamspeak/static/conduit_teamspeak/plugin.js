import { Alert as e, Avatar as t, Badge as n, Button as r, Card as i, CardBody as a, CardFooter as o, CardHeader as s, ConfirmDialog as c, DropdownContent as l, DropdownItem as u, DropdownMenu as d, DropdownSeparator as f, DropdownTrigger as p, EmptyState as m, Field as h, Input as g, PageHeader as _, SearchInput as v, Select as y, Skeleton as b, StatCard as x, SwitchRow as S, THead as ee, TabPanel as C, Table as te, TableToolbar as ne, Tabs as w, Td as T, Th as E, Tr as re, api as D, cn as O, definePlugin as ie, timeAgo as k, toast as A, useHasPerm as ae } from "@conduit/sdk";
import { Link as j } from "react-router";
import { useMutation as M, useQuery as N, useQueryClient as P } from "@tanstack/react-query";
import { useEffect as oe, useRef as se, useState as F } from "react";
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
var B = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" })
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
		/* @__PURE__ */ L("path", { d: "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" }),
		/* @__PURE__ */ L("path", { d: "m21 2-9.6 9.6" }),
		/* @__PURE__ */ L("circle", {
			cx: "7.5",
			cy: "15.5",
			r: "5.5"
		})
	]
}), ce = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ L("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })]
}), U = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", { d: "M20 6 9 17l-5-5" })
}), le = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "M5 12h14" }), /* @__PURE__ */ L("path", { d: "M12 5v14" })]
}), ue = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M3 6h18" }),
		/* @__PURE__ */ L("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ L("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), W = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
		/* @__PURE__ */ L("path", { d: "M21 3v5h-5" }),
		/* @__PURE__ */ L("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
		/* @__PURE__ */ L("path", { d: "M8 16H3v5" })
	]
}), de = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ L("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ L("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	]
}), fe = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [/* @__PURE__ */ L("path", { d: "m12 19-7-7 7-7" }), /* @__PURE__ */ L("path", { d: "M19 12H5" })]
}), G = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" }),
		/* @__PURE__ */ L("path", { d: "m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" }),
		/* @__PURE__ */ L("line", {
			x1: "8",
			x2: "8",
			y1: "2",
			y2: "5"
		}),
		/* @__PURE__ */ L("line", {
			x1: "2",
			x2: "5",
			y1: "8",
			y2: "8"
		}),
		/* @__PURE__ */ L("line", {
			x1: "16",
			x2: "16",
			y1: "19",
			y2: "22"
		}),
		/* @__PURE__ */ L("line", {
			x1: "19",
			x2: "22",
			y1: "16",
			y2: "16"
		})
	]
}), pe = (e) => /* @__PURE__ */ R(z, {
	...e,
	children: [
		/* @__PURE__ */ L("path", { d: "M12 22v-5" }),
		/* @__PURE__ */ L("path", { d: "M9 8V2" }),
		/* @__PURE__ */ L("path", { d: "M15 8V2" }),
		/* @__PURE__ */ L("path", { d: "M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" })
	]
}), me = (e) => /* @__PURE__ */ L(z, {
	...e,
	children: /* @__PURE__ */ L("path", {
		d: "M21 12a9 9 0 1 1-6.219-8.56",
		className: "animate-spin origin-center"
	})
}), K = "/api/p/teamspeak", q = ["teamspeak", "admin"];
function he() {
	let { data: e, isLoading: t } = N({
		queryKey: q,
		queryFn: () => D.get(`${K}/admin`)
	}), [n, r] = F(null), i = n ?? (e?.settings.checked_at ? "groups" : "setup"), a = !!e?.settings.checked_at;
	return /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(_, {
		eyebrow: /* @__PURE__ */ R(j, {
			to: "/p/teamspeak",
			className: "inline-flex items-center gap-1 hover:text-text",
			children: [/* @__PURE__ */ L(fe, { className: "size-3" }), " TeamSpeak"]
		}),
		title: "Server setup",
		icon: /* @__PURE__ */ L(B, {}),
		description: "Connect your TeamSpeak server through ServerQuery, decide which groups and states get which server groups, and look after linked members."
	}), t || !e ? /* @__PURE__ */ L(b, { className: "h-96" }) : /* @__PURE__ */ R("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ R("div", {
			className: "grid gap-4 sm:grid-cols-4",
			children: [
				/* @__PURE__ */ L(x, {
					label: "Server",
					value: e.settings.virtual_server_name || e.settings.query_host || "Not set",
					tone: a ? "success" : "warning",
					hint: e.settings.checked_at ? `checked ${k(e.settings.checked_at)}${e.settings.server_version ? ` · ${e.settings.server_version}` : ""}` : "not checked yet"
				}),
				/* @__PURE__ */ L(x, {
					label: "Linked",
					value: e.stats.linked,
					hint: e.stats.pending ? `${e.stats.pending} still linking` : void 0
				}),
				/* @__PURE__ */ L(x, {
					label: "Sync problems",
					value: e.stats.errors,
					tone: e.stats.errors ? "danger" : "success"
				}),
				/* @__PURE__ */ L(x, {
					label: "Last full sync",
					value: e.settings.last_full_sync ? k(e.settings.last_full_sync) : "never",
					hint: "every 6 hours, and on changes"
				})
			]
		}), /* @__PURE__ */ R(w, {
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
					value: "groups",
					label: "Groups",
					count: e.mappings.length,
					disabled: !a
				},
				{
					value: "members",
					label: "Members",
					count: e.stats.linked + e.stats.pending,
					disabled: !a
				}
			],
			children: [
				/* @__PURE__ */ L(C, {
					value: "setup",
					children: /* @__PURE__ */ L(ge, { data: e })
				}),
				/* @__PURE__ */ L(C, {
					value: "groups",
					children: /* @__PURE__ */ L(_e, { data: e })
				}),
				/* @__PURE__ */ L(C, {
					value: "members",
					children: /* @__PURE__ */ L(ve, {})
				})
			]
		})]
	})] });
}
function J({ n: e, title: t, done: n, children: r }) {
	return /* @__PURE__ */ R("li", {
		className: "grid grid-cols-[32px_1fr] gap-4",
		children: [/* @__PURE__ */ L("span", {
			className: O("grid size-8 place-items-center border font-mono text-sm", n ? "border-success/40 bg-success-soft text-success-fg" : "border-border-strong text-muted"),
			children: n ? /* @__PURE__ */ L(U, {}) : e
		}), /* @__PURE__ */ R("div", {
			className: "min-w-0 space-y-3 pb-2",
			children: [/* @__PURE__ */ L("div", {
				className: "pt-1 font-medium",
				children: t
			}), r]
		})]
	});
}
function ge({ data: t }) {
	let n = P(), c = t.settings, [l, u] = F({
		query_host: c.query_host,
		query_port: String(c.query_port),
		query_user: c.query_user,
		query_password: "",
		server_id: String(c.server_id),
		public_host: c.public_host,
		public_port: String(c.public_port),
		server_name: c.server_name,
		nickname_format: c.nickname_format,
		registered_sgid: String(c.registered_sgid),
		kick_without_access: c.kick_without_access,
		require_for_compliance: c.require_for_compliance,
		allowlisted: c.allowlisted
	}), [d, f] = F(null), p = () => ({
		...l,
		query_port: Number(l.query_port),
		server_id: Number(l.server_id),
		public_port: Number(l.public_port),
		registered_sgid: Number(l.registered_sgid) || 0
	}), m = M({
		mutationFn: () => D.put(`${K}/admin/settings`, p()),
		onSuccess: (e) => {
			n.setQueryData(q, e), n.invalidateQueries({ queryKey: ["teamspeak", "me"] }), u((e) => ({
				...e,
				query_password: ""
			})), A.success("Saved");
		},
		onError: (e) => A.error(e.message)
	}), _ = M({
		mutationFn: async () => {
			let e = await D.put(`${K}/admin/settings`, p());
			return n.setQueryData(q, e), u((e) => ({
				...e,
				query_password: ""
			})), D.post(`${K}/admin/check`);
		},
		onSuccess: (e) => {
			n.setQueryData(q, e.admin), n.invalidateQueries({ queryKey: ["teamspeak", "me"] }), f(e.check), u((t) => ({
				...t,
				registered_sgid: String(e.admin.settings.registered_sgid)
			})), A.success(e.check.problems.length ? "Connected, with things to fix" : "Connected");
		},
		onError: (e) => {
			f(null), A.error(e.message);
		}
	}), v = (e) => u((t) => ({
		...t,
		...e
	}));
	return /* @__PURE__ */ R("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_400px]",
		children: [/* @__PURE__ */ R(i, { children: [/* @__PURE__ */ L(a, { children: /* @__PURE__ */ R("ol", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ R(J, {
					n: 1,
					title: "ServerQuery login",
					done: c.configured,
					children: [
						/* @__PURE__ */ R("p", {
							className: "text-xs text-subtle",
							children: [
								"Make a login for this site on the server (as serveradmin, in the client: Tools → ServerQuery Login, or ",
								/* @__PURE__ */ L("span", {
									className: "font-mono",
									children: "serverqueryadd"
								}),
								") and give it the Server Admin Query rights, or use ",
								/* @__PURE__ */ L("span", {
									className: "font-mono",
									children: "serveradmin"
								}),
								" itself."
							]
						}),
						/* @__PURE__ */ R("div", {
							className: "grid gap-4 sm:grid-cols-[1fr_120px_100px]",
							children: [
								/* @__PURE__ */ L(h, {
									label: "Query address",
									hint: "The server's host name; ServerQuery listens on 10011 by default.",
									children: /* @__PURE__ */ L(g, {
										value: l.query_host,
										onChange: (e) => v({ query_host: e.target.value }),
										placeholder: "ts.example.com",
										className: "font-mono"
									})
								}),
								/* @__PURE__ */ L(h, {
									label: "Query port",
									children: /* @__PURE__ */ L(g, {
										type: "number",
										value: l.query_port,
										onChange: (e) => v({ query_port: e.target.value }),
										className: "font-mono"
									})
								}),
								/* @__PURE__ */ L(h, {
									label: "Server id",
									hint: "1 unless the host runs several.",
									children: /* @__PURE__ */ L(g, {
										type: "number",
										min: 1,
										value: l.server_id,
										onChange: (e) => v({ server_id: e.target.value }),
										className: "font-mono"
									})
								})
							]
						}),
						/* @__PURE__ */ R("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ L(h, {
								label: "Query login",
								children: /* @__PURE__ */ L(g, {
									value: l.query_user,
									onChange: (e) => v({ query_user: e.target.value }),
									placeholder: "conduit",
									className: "font-mono",
									autoComplete: "off"
								})
							}), /* @__PURE__ */ L(h, {
								label: "Query password",
								hint: c.query_password_set ? "Set; leave empty to keep it." : "From the server.",
								children: /* @__PURE__ */ L(g, {
									type: "password",
									value: l.query_password,
									onChange: (e) => v({ query_password: e.target.value }),
									className: "font-mono",
									autoComplete: "new-password",
									placeholder: c.query_password_set ? "••••••••" : ""
								})
							})]
						}),
						/* @__PURE__ */ L("div", {
							className: "border border-border px-3",
							children: /* @__PURE__ */ L(S, {
								label: "This site is on the server's query allow list",
								description: "Add its address to query_ip_allowlist.txt next to the server, so the server doesn't limit how fast it may send commands. Otherwise commands are spaced out and syncing everyone takes longer.",
								checked: l.allowlisted,
								onCheckedChange: (e) => v({ allowlisted: e })
							})
						}),
						/* @__PURE__ */ R("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ R(r, {
								variant: "secondary",
								loading: _.isPending,
								onClick: () => _.mutate(),
								children: [/* @__PURE__ */ L(pe, {}), " Save and check the connection"]
							}), c.checked_at && !d && /* @__PURE__ */ R("span", {
								className: "text-xs text-subtle",
								children: [
									"Last checked ",
									k(c.checked_at),
									"."
								]
							})]
						}),
						d && /* @__PURE__ */ R(e, {
							tone: d.problems.length ? "warning" : "success",
							title: `Connected to ${d.name}`,
							children: [/* @__PURE__ */ R("div", {
								className: "text-xs",
								children: [
									d.version,
									" · ",
									d.online,
									" of ",
									d.max_clients,
									" online · voice port ",
									d.voice_port,
									" · ",
									d.groups.length,
									" server groups · linked members get ",
									/* @__PURE__ */ L("b", { children: d.registered_group })
								]
							}), d.problems.length > 0 && /* @__PURE__ */ L("ul", {
								className: "mt-2 list-disc space-y-1 pl-4 text-sm",
								children: d.problems.map((e) => /* @__PURE__ */ L("li", { children: e }, e))
							})]
						})
					]
				}),
				/* @__PURE__ */ R(J, {
					n: 2,
					title: "Where members connect",
					done: c.configured,
					children: [/* @__PURE__ */ R("div", {
						className: "grid gap-4 sm:grid-cols-[1fr_120px]",
						children: [/* @__PURE__ */ L(h, {
							label: "Address",
							hint: "Empty uses the query address.",
							children: /* @__PURE__ */ L(g, {
								value: l.public_host,
								onChange: (e) => v({ public_host: e.target.value }),
								placeholder: l.query_host || "ts.example.com",
								className: "font-mono"
							})
						}), /* @__PURE__ */ L(h, {
							label: "Voice port",
							children: /* @__PURE__ */ L(g, {
								type: "number",
								value: l.public_port,
								onChange: (e) => v({ public_port: e.target.value }),
								className: "font-mono"
							})
						})]
					}), /* @__PURE__ */ L(h, {
						label: "Shown as",
						hint: "A friendly name, e.g. Alliance comms. Empty shows the server's own name.",
						children: /* @__PURE__ */ L(g, {
							value: l.server_name,
							onChange: (e) => v({ server_name: e.target.value }),
							className: "max-w-sm"
						})
					})]
				}),
				/* @__PURE__ */ R(J, {
					n: 3,
					title: "How members appear",
					done: c.configured,
					children: [
						/* @__PURE__ */ R("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ L(h, {
								label: "Nickname and description",
								hint: "The connect link fills the nickname in; the description is set on the server so admins see who's who.",
								children: /* @__PURE__ */ L(g, {
									value: l.nickname_format,
									onChange: (e) => v({ nickname_format: e.target.value }),
									className: "font-mono"
								})
							}), /* @__PURE__ */ L(h, {
								label: "Linked members' group",
								hint: "Every linked member with access is in it. Made for you if none is picked.",
								children: /* @__PURE__ */ R(y, {
									value: l.registered_sgid,
									onChange: (e) => v({ registered_sgid: e.target.value }),
									children: [/* @__PURE__ */ L("option", {
										value: "0",
										children: "Make one called Registered"
									}), t.server_groups.map((e) => /* @__PURE__ */ L("option", {
										value: String(e.sgid),
										children: e.name
									}, e.sgid))]
								})
							})]
						}),
						/* @__PURE__ */ R("p", {
							className: "text-xs text-subtle",
							children: [
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
								"."
							]
						}),
						/* @__PURE__ */ R("div", {
							className: "divide-y divide-border border border-border px-3",
							children: [/* @__PURE__ */ L(S, {
								label: "Kick people who lose access",
								description: "Besides taking their groups away, kick them off the server if they're on it (at the next sync and when unlinked).",
								checked: l.kick_without_access,
								onCheckedChange: (e) => v({ kick_without_access: e })
							}), /* @__PURE__ */ L(S, {
								label: "Must be linked to be compliant",
								description: "Members who may use TeamSpeak count as non-compliant until they've linked (Administration → Compliance and the Compliant group rule).",
								checked: l.require_for_compliance,
								onCheckedChange: (e) => v({ require_for_compliance: e })
							})]
						})
					]
				})
			]
		}) }), /* @__PURE__ */ L(o, { children: /* @__PURE__ */ L(r, {
			variant: "primary",
			loading: m.isPending,
			onClick: () => m.mutate(),
			children: "Save"
		}) })] }), /* @__PURE__ */ R(i, {
			className: "h-fit",
			children: [/* @__PURE__ */ L(s, { title: "How it works" }), /* @__PURE__ */ R(a, {
				className: "space-y-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ R("p", { children: [
						"Members get a one-time ",
						/* @__PURE__ */ L("b", {
							className: "text-text",
							children: "privilege key"
						}),
						". Using it in their TeamSpeak client puts them in the linked members' group and marks their identity, so this site knows which identity is theirs without passwords or nickname matching."
					] }),
					/* @__PURE__ */ R("p", { children: [
						"From then on the site keeps their ",
						/* @__PURE__ */ L("b", {
							className: "text-text",
							children: "server groups"
						}),
						" in step with their groups and state here: at every change, every six hours, and when they press Fix my groups. Groups you give by hand on the server are left alone."
					] }),
					/* @__PURE__ */ L("p", { children: "The query login needs to manage server groups, privilege keys and client database entries (the Server Admin Query group has all of it). Works with TeamSpeak 3 and TeamSpeak 6 servers." })
				]
			})]
		})]
	});
}
function _e({ data: e }) {
	let t = P(), [c, l] = F(null), u = c ?? e.mappings, [d, f] = F(""), [p, g] = F(""), _ = new Map(e.server_groups.map((e) => [e.sgid, e.name])), v = M({
		mutationFn: (e) => D.put(`${K}/admin/mappings`, { mappings: e }),
		onSuccess: (e) => {
			t.setQueryData(q, e), l(null), t.invalidateQueries({ queryKey: ["teamspeak", "me"] }), A.success("Saved; everyone's groups are being updated");
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ R("div", {
		className: "grid gap-6 xl:grid-cols-[1fr_340px]",
		children: [/* @__PURE__ */ R(i, { children: [
			/* @__PURE__ */ L(s, {
				title: "Who is in which server group",
				description: "Members of a group, or everyone in a state, get the server group. A person can match several rows."
			}),
			/* @__PURE__ */ L(a, {
				className: "border-b border-border",
				children: /* @__PURE__ */ R("div", {
					className: "flex flex-wrap items-end gap-3",
					children: [
						/* @__PURE__ */ L(h, {
							label: "Group or state",
							className: "min-w-56 flex-1",
							children: /* @__PURE__ */ R(y, {
								value: d,
								onChange: (e) => f(e.target.value),
								children: [
									/* @__PURE__ */ L("option", {
										value: "",
										children: "Choose…"
									}),
									/* @__PURE__ */ L("optgroup", {
										label: "States",
										children: e.states.map((e) => /* @__PURE__ */ L("option", {
											value: `state:${e.id}`,
											children: e.name
										}, `s${e.id}`))
									}),
									/* @__PURE__ */ L("optgroup", {
										label: "Groups",
										children: e.groups.map((e) => /* @__PURE__ */ L("option", {
											value: `group:${e.id}`,
											children: e.name
										}, `g${e.id}`))
									})
								]
							})
						}),
						/* @__PURE__ */ L(h, {
							label: "Server group",
							className: "min-w-56 flex-1",
							hint: "As on the server; check the connection under Setup to refresh the list.",
							children: /* @__PURE__ */ R(y, {
								value: p,
								onChange: (e) => g(e.target.value),
								children: [/* @__PURE__ */ L("option", {
									value: "",
									children: "Choose…"
								}), e.server_groups.filter((t) => t.sgid !== e.settings.registered_sgid).map((e) => /* @__PURE__ */ L("option", {
									value: String(e.sgid),
									children: e.name
								}, e.sgid))]
							})
						}),
						/* @__PURE__ */ R(r, {
							disabled: !d || !p,
							onClick: () => {
								let [t, n] = d.split(":");
								if (!t || !p) return;
								let r = t === "group" ? e.groups.find((e) => e.id === Number(n))?.name : e.states.find((e) => e.id === Number(n))?.name;
								l([...u, {
									kind: t,
									target_id: Number(n),
									target: r,
									sgid: Number(p),
									sg_name: _.get(Number(p))
								}]), g("");
							},
							children: [/* @__PURE__ */ L(le, {}), " Add"]
						})
					]
				})
			}),
			u.length === 0 ? /* @__PURE__ */ L(m, {
				icon: /* @__PURE__ */ L(B, {}),
				title: "No groups mapped yet",
				description: `Linked members only get ${_.get(e.settings.registered_sgid) ?? "the linked members' group"} until you add some.`
			}) : /* @__PURE__ */ L("ul", {
				className: "divide-y divide-border",
				children: u.map((e, t) => /* @__PURE__ */ R("li", {
					className: "flex items-center gap-3 px-card py-3 text-sm",
					children: [
						/* @__PURE__ */ L(n, {
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
							className: O("min-w-0 flex-1 truncate", !_.has(e.sgid) && "text-danger-fg"),
							children: [e.sg_name || _.get(e.sgid) || `group ${e.sgid}`, !_.has(e.sgid) && " (not on the server)"]
						}),
						/* @__PURE__ */ L(r, {
							variant: "ghost",
							size: "icon-xs",
							"aria-label": "Remove",
							onClick: () => l(u.filter((e, n) => n !== t)),
							children: /* @__PURE__ */ L(ue, {})
						})
					]
				}, `${e.kind}-${e.target_id}-${e.sgid}`))
			}),
			c && /* @__PURE__ */ R(o, {
				className: "justify-between",
				children: [/* @__PURE__ */ L("span", {
					className: "text-xs text-muted",
					children: "Unsaved changes"
				}), /* @__PURE__ */ R("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ L(r, {
						variant: "ghost",
						onClick: () => l(null),
						children: "Discard"
					}), /* @__PURE__ */ L(r, {
						variant: "primary",
						loading: v.isPending,
						onClick: () => v.mutate(u),
						children: "Save"
					})]
				})]
			})
		] }), /* @__PURE__ */ R(i, {
			className: "h-fit",
			children: [/* @__PURE__ */ L(s, { title: "How groups work" }), /* @__PURE__ */ R(a, {
				className: "space-y-3 text-sm text-muted",
				children: [
					/* @__PURE__ */ L("p", { children: "Make server groups on the server (Permissions → Server Groups) and give them rights on channels. Then map your site groups and states to them here." }),
					/* @__PURE__ */ R("p", { children: [
						"Every linked member with access is also in ",
						/* @__PURE__ */ L("b", {
							className: "text-text",
							children: _.get(e.settings.registered_sgid) ?? "the linked members' group"
						}),
						"; use it for everything members may do."
					] }),
					/* @__PURE__ */ L("p", { children: "Saving starts a sync for everyone. A group taken out of the mapping is taken away from everyone it was given to." })
				]
			})]
		})]
	});
}
function ve() {
	let e = P(), { data: a, isLoading: o } = N({
		queryKey: ["teamspeak", "members"],
		queryFn: () => D.get(`${K}/admin/members`)
	}), [s, h] = F(""), [g, _] = F(null), y = () => e.invalidateQueries({ queryKey: ["teamspeak"] }), x = M({
		mutationFn: () => D.post(`${K}/admin/sync`),
		onSuccess: () => A.success("Syncing everyone in the background"),
		onError: (e) => A.error(e.message)
	}), S = M({
		mutationFn: (e) => D.post(`${K}/admin/members/${e}/sync`),
		onSuccess: () => {
			A.success("Groups updated"), y();
		},
		onError: (e) => {
			A.error(e.message), y();
		}
	}), C = M({
		mutationFn: ({ id: e, force: t }) => D.delete(`${K}/admin/members/${e}?force=${t}`),
		onSuccess: () => {
			A.success("Unlinked"), y();
		},
		onError: (e) => A.error(e.message)
	});
	if (o || !a) return /* @__PURE__ */ L(b, { className: "h-64" });
	let w = s.trim().toLowerCase(), O = w ? a.filter((e) => [
		e.user.name,
		e.status === "linked" ? e.nickname : "",
		e.status === "linked" ? e.uid : "",
		...(e.characters ?? []).map((e) => e.name)
	].some((e) => e.toLowerCase().includes(w))) : a;
	return /* @__PURE__ */ R(i, { children: [
		/* @__PURE__ */ R(ne, { children: [/* @__PURE__ */ L(v, {
			value: s,
			onChange: (e) => h(e.target.value),
			placeholder: "Member, character, nickname or identity",
			className: "w-80"
		}), /* @__PURE__ */ R(r, {
			variant: "secondary",
			loading: x.isPending,
			onClick: () => x.mutate(),
			children: [/* @__PURE__ */ L(W, {}), " Sync everyone"]
		})] }),
		O.length === 0 ? /* @__PURE__ */ L(m, {
			icon: /* @__PURE__ */ L(B, {}),
			title: a.length ? "Nobody matches" : "Nobody has linked TeamSpeak yet"
		}) : /* @__PURE__ */ R(te, { children: [/* @__PURE__ */ L(ee, { children: /* @__PURE__ */ R("tr", { children: [
			/* @__PURE__ */ L(E, { children: "Member" }),
			/* @__PURE__ */ L(E, { children: "TeamSpeak" }),
			/* @__PURE__ */ L(E, { children: "Groups" }),
			/* @__PURE__ */ L(E, { children: "Status" }),
			/* @__PURE__ */ L(E, {})
		] }) }), /* @__PURE__ */ L("tbody", { children: O.map((e) => /* @__PURE__ */ R(re, { children: [
			/* @__PURE__ */ L(T, { children: /* @__PURE__ */ R("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ L(t, {
					src: e.user.portrait,
					name: e.user.name,
					size: "sm"
				}), /* @__PURE__ */ R("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ L("div", {
							className: "truncate font-medium",
							children: e.user.name
						}),
						!e.has_access && /* @__PURE__ */ L(n, {
							tone: "warning",
							children: "no access"
						}),
						/* @__PURE__ */ L(ye, {
							list: e.characters ?? [],
							needle: w
						})
					]
				})]
			}) }),
			/* @__PURE__ */ L(T, { children: e.status === "linked" ? /* @__PURE__ */ R(I, { children: [
				/* @__PURE__ */ L("div", {
					className: "text-sm",
					children: e.nickname || "—"
				}),
				/* @__PURE__ */ L("div", {
					className: "max-w-48 truncate font-mono text-xs text-subtle",
					title: e.uid,
					children: e.uid
				}),
				e.last_connected_at && /* @__PURE__ */ R("div", {
					className: "text-xs text-subtle",
					children: ["last connected ", k(e.last_connected_at)]
				})
			] }) : /* @__PURE__ */ R("span", {
				className: "text-xs text-subtle",
				children: [
					"key made ",
					k(e.started_at),
					", not used yet"
				]
			}) }),
			/* @__PURE__ */ L(T, { children: /* @__PURE__ */ L("div", {
				className: "flex max-w-72 flex-wrap gap-1",
				children: e.groups_due.length ? e.groups_due.map((e) => /* @__PURE__ */ L(n, {
					tone: "accent",
					children: e
				}, e)) : /* @__PURE__ */ L("span", {
					className: "text-xs text-subtle",
					children: "none"
				})
			}) }),
			/* @__PURE__ */ L(T, { children: e.status === "pending" ? /* @__PURE__ */ L(n, {
				tone: "neutral",
				children: "Linking"
			}) : e.error ? /* @__PURE__ */ R("div", { children: [/* @__PURE__ */ L(n, {
				tone: "danger",
				children: "Problem"
			}), /* @__PURE__ */ L("div", {
				className: "mt-1 max-w-64 text-xs text-muted",
				children: e.error
			})] }) : /* @__PURE__ */ R("div", { children: [/* @__PURE__ */ L(n, {
				tone: "success",
				children: "Linked"
			}), e.synced_at && /* @__PURE__ */ R("div", {
				className: "mt-1 text-xs text-subtle",
				children: ["checked ", k(e.synced_at)]
			})] }) }),
			/* @__PURE__ */ L(T, {
				align: "right",
				children: /* @__PURE__ */ R(d, { children: [/* @__PURE__ */ L(p, {
					asChild: !0,
					children: /* @__PURE__ */ L(r, {
						variant: "ghost",
						size: "sm",
						children: "Actions"
					})
				}), /* @__PURE__ */ R(l, {
					align: "end",
					children: [
						e.status === "linked" && /* @__PURE__ */ R(u, {
							onSelect: () => S.mutate(e.user.id),
							children: [/* @__PURE__ */ L(W, {}), " Sync now"]
						}),
						e.status === "linked" && /* @__PURE__ */ L(f, {}),
						/* @__PURE__ */ R(u, {
							danger: !0,
							onSelect: () => _(e),
							children: [
								/* @__PURE__ */ L(G, {}),
								" ",
								e.status === "pending" ? "Cancel link" : "Unlink"
							]
						})
					]
				})] })
			})
		] }, e.user.id)) })] }),
		/* @__PURE__ */ L(c, {
			open: !!g,
			onOpenChange: (e) => !e && _(null),
			title: g?.status === "pending" ? `Cancel ${g?.user.name}'s link?` : `Unlink ${g?.user.name}'s TeamSpeak identity?`,
			description: g?.status === "pending" ? "Their key stops working; they can start again." : "Their server groups are taken away and they're told why. If the server can't be reached, the link is kept; unlink again with Forget anyway to drop it regardless.",
			danger: !0,
			confirmLabel: g?.status === "pending" ? "Cancel link" : "Unlink",
			onConfirm: async () => {
				if (g) try {
					await C.mutateAsync({
						id: g.user.id,
						force: !1
					});
				} catch {
					g.status === "linked" && window.confirm("The server couldn't be reached to take the groups away. Forget the link anyway?") && await C.mutateAsync({
						id: g.user.id,
						force: !0
					});
				}
			}
		})
	] });
}
function ye({ list: e, needle: t }) {
	let [r, i] = F(!1);
	if (!e.length) return null;
	let a = r ? e : e.filter((e, n) => n < 3 || t && e.name.toLowerCase().includes(t)), o = (e) => /* @__PURE__ */ R("span", {
		className: O("truncate", e.main ? "text-text" : "text-muted"),
		children: [e.name, e.corporation && /* @__PURE__ */ R("span", {
			className: "ml-1 text-subtle",
			children: [
				"[",
				e.corporation,
				"]"
			]
		})]
	});
	return /* @__PURE__ */ R("div", {
		className: "mt-1.5 space-y-1",
		children: [a.map((e) => /* @__PURE__ */ R("div", {
			className: "flex items-center gap-1.5 text-xs",
			children: [
				/* @__PURE__ */ L("img", {
					src: e.portrait,
					alt: "",
					className: "size-4 shrink-0"
				}),
				e.viewable ? /* @__PURE__ */ L(j, {
					to: `/characters/${e.id}`,
					className: "flex min-w-0 hover:text-accent-ink hover:underline",
					children: o(e)
				}) : o(e),
				e.main && /* @__PURE__ */ L(n, {
					size: "xs",
					children: "main"
				})
			]
		}, e.id)), e.length > a.length && /* @__PURE__ */ R("button", {
			type: "button",
			onClick: () => i(!0),
			className: "text-xs text-accent-ink hover:underline",
			children: [
				e.length - a.length,
				" more character",
				e.length - a.length === 1 ? "" : "s"
			]
		})]
	});
}
//#endregion
//#region src/shared.tsx
function be(e, t = "Copied") {
	navigator.clipboard.writeText(e).then(() => A.success(t), () => A.error("Couldn't copy; select the text instead"));
}
function Y({ value: e, label: t, mono: n = !0 }) {
	return /* @__PURE__ */ R("div", {
		className: "flex items-stretch",
		children: [/* @__PURE__ */ L(g, {
			readOnly: !0,
			value: e,
			"aria-label": t,
			className: O("text-xs", n && "font-mono"),
			onFocus: (e) => e.target.select()
		}), /* @__PURE__ */ L(r, {
			variant: "secondary",
			size: "icon",
			"aria-label": `Copy ${t ?? ""}`.trim(),
			onClick: () => be(e),
			children: /* @__PURE__ */ L(ce, {})
		})]
	});
}
function X({ groups: e, empty: t }) {
	return e.length === 0 ? /* @__PURE__ */ L("p", {
		className: "text-sm text-subtle",
		children: t
	}) : /* @__PURE__ */ L("div", {
		className: "flex flex-wrap gap-1.5",
		children: e.map((e) => /* @__PURE__ */ L(n, {
			tone: "accent",
			children: e
		}, e))
	});
}
function Z({ server: e, nickname: t, url: n, label: i = "Open in TeamSpeak" }) {
	return /* @__PURE__ */ R("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ R("dl", {
			className: "grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center",
			children: [
				/* @__PURE__ */ L("dt", {
					className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
					children: "Server"
				}),
				/* @__PURE__ */ L("dd", { children: /* @__PURE__ */ L(Y, {
					value: e.port === 9987 ? e.host : `${e.host}:${e.port}`,
					label: "server address"
				}) }),
				t && /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L("dt", {
					className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
					children: "Nickname"
				}), /* @__PURE__ */ L("dd", { children: /* @__PURE__ */ L(Y, {
					value: t,
					label: "nickname",
					mono: !1
				}) })] })
			]
		}), n && /* @__PURE__ */ L("a", {
			href: n,
			children: /* @__PURE__ */ R(r, {
				variant: "primary",
				children: [
					/* @__PURE__ */ L(de, {}),
					" ",
					i
				]
			})
		})]
	});
}
//#endregion
//#region src/member.tsx
var Q = ["teamspeak", "me"];
function $() {
	return N({
		queryKey: Q,
		queryFn: () => D.get(`${K}/me`)
	});
}
var xe = 18e4, Se = 5e3;
function Ce({ me: e, account: t }) {
	let n = P(), [a, o] = F(!0), s = se(Date.now()), c = M({
		mutationFn: () => D.post(`${K}/link/check`),
		onSuccess: (e) => {
			n.setQueryData(Q, e), e.found && A.success("Linked! Your groups are set.");
		},
		onError: (e) => {
			e.message.includes("wait") || A.error(e.message);
		}
	}), l = M({
		mutationFn: () => D.delete(`${K}/link`),
		onSuccess: (e) => n.setQueryData(Q, e),
		onError: (e) => A.error(e.message)
	}), u = M({
		mutationFn: () => D.post(`${K}/link`),
		onSuccess: (e) => {
			n.setQueryData(Q, e), s.current = Date.now(), o(!0), A.success("New key made");
		},
		onError: (e) => A.error(e.message)
	});
	return oe(() => {
		if (!a) return;
		let e = setInterval(() => {
			if (Date.now() - s.current > xe) {
				o(!1);
				return;
			}
			c.isPending || c.mutate();
		}, Se);
		return () => clearInterval(e);
	}, [a]), /* @__PURE__ */ L(i, { children: /* @__PURE__ */ R("div", {
		className: "grid gap-8 p-card sm:p-8 lg:grid-cols-[1fr_340px]",
		children: [/* @__PURE__ */ R("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ R("div", {
					className: "flex items-center gap-3 text-accent-ink",
					children: [/* @__PURE__ */ L(H, { className: "size-8" }), /* @__PURE__ */ L("span", {
						className: "text-xl font-semibold text-text",
						children: "Use your key in TeamSpeak"
					})]
				}),
				/* @__PURE__ */ R("ol", {
					className: "list-decimal space-y-3 pl-5 text-sm text-muted",
					children: [
						/* @__PURE__ */ R("li", { children: [
							"Press ",
							/* @__PURE__ */ L("b", {
								className: "text-text",
								children: "Connect and use key"
							}),
							": TeamSpeak opens, connects to ",
							e.server.name,
							" as ",
							/* @__PURE__ */ L("b", {
								className: "text-text",
								children: e.nickname
							}),
							" and uses the key for you."
						] }),
						/* @__PURE__ */ R("li", { children: [
							"Or, if you're already connected, paste the key under ",
							/* @__PURE__ */ L("span", {
								className: "text-text",
								children: "Permissions → Use Privilege Key"
							}),
							" in the TeamSpeak client."
						] }),
						/* @__PURE__ */ L("li", { children: "This page notices within a few seconds and gives you your groups." })
					]
				}),
				/* @__PURE__ */ L(Z, {
					server: e.server,
					nickname: e.nickname,
					url: t.connect_url,
					label: "Connect and use key"
				}),
				/* @__PURE__ */ R("div", { children: [
					/* @__PURE__ */ L("div", {
						className: "mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
						children: "Your privilege key"
					}),
					/* @__PURE__ */ L(Y, {
						value: t.privilege_key,
						label: "privilege key"
					}),
					/* @__PURE__ */ R("p", {
						className: "mt-1 text-xs text-subtle",
						children: [
							"Works once, for you only. Made ",
							k(t.started_at),
							"."
						]
					})
				] })
			]
		}), /* @__PURE__ */ R("div", {
			className: "flex flex-col justify-between gap-4 border border-border bg-bg/40 p-4 text-sm",
			children: [/* @__PURE__ */ R("div", {
				className: "flex items-center gap-2",
				children: [a ? /* @__PURE__ */ L(me, { className: "size-4 text-accent-ink" }) : /* @__PURE__ */ L(H, { className: "size-4 text-muted" }), /* @__PURE__ */ L("span", {
					className: "text-muted",
					children: a ? "Waiting for the key to be used…" : "Stopped watching; check when you're done."
				})]
			}), /* @__PURE__ */ R("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ R(r, {
						variant: "primary",
						className: "w-full",
						loading: c.isPending,
						onClick: () => {
							s.current = Date.now(), o(!0), c.mutate();
						},
						children: [/* @__PURE__ */ L(W, {}), " I've used the key"]
					}),
					/* @__PURE__ */ L(r, {
						variant: "secondary",
						className: "w-full",
						loading: u.isPending,
						onClick: () => u.mutate(),
						children: "New key"
					}),
					/* @__PURE__ */ L(r, {
						variant: "ghost",
						className: "w-full",
						loading: l.isPending,
						onClick: () => l.mutate(),
						children: "Give up for now"
					})
				]
			})]
		})]
	}) });
}
function we() {
	let t = P(), o = ae("teamspeak.manage_teamspeak"), { data: l, isLoading: u } = $(), [d, f] = F(!1), p = M({
		mutationFn: () => D.post(`${K}/link`),
		onSuccess: (e) => t.setQueryData(Q, e),
		onError: (e) => A.error(e.message)
	}), h = M({
		mutationFn: () => D.post(`${K}/sync`),
		onSuccess: (e) => {
			t.setQueryData(Q, e), A.success("Your groups are up to date");
		},
		onError: (e) => {
			A.error(e.message), t.invalidateQueries({ queryKey: Q });
		}
	}), g = M({
		mutationFn: () => D.delete(`${K}/link`),
		onSuccess: (e) => {
			t.setQueryData(Q, e), A.success("TeamSpeak unlinked");
		},
		onError: (e) => A.error(e.message)
	});
	return /* @__PURE__ */ R(I, { children: [
		/* @__PURE__ */ L(_, {
			eyebrow: "Communication",
			title: "TeamSpeak",
			icon: /* @__PURE__ */ L(B, {}),
			description: "Voice comms. Link your TeamSpeak identity once; your server groups then follow your groups and state.",
			actions: o ? /* @__PURE__ */ L(j, {
				to: "/p/teamspeak/admin",
				children: /* @__PURE__ */ R(r, { children: [/* @__PURE__ */ L(V, {}), " Server setup"] })
			}) : void 0
		}),
		u || !l ? /* @__PURE__ */ L(b, { className: "h-56" }) : l.configured ? l.account ? l.account.status === "pending" ? /* @__PURE__ */ L(Ce, {
			me: l,
			account: l.account
		}) : /* @__PURE__ */ R("div", {
			className: "grid gap-6 xl:grid-cols-[1fr_360px]",
			children: [/* @__PURE__ */ R("div", {
				className: "space-y-6",
				children: [
					l.account.error && /* @__PURE__ */ L(e, {
						tone: "danger",
						title: "Your groups couldn't be set",
						children: l.account.error
					}),
					/* @__PURE__ */ R(i, { children: [/* @__PURE__ */ R("div", {
						className: "flex flex-col gap-5 p-card sm:flex-row sm:items-start",
						children: [/* @__PURE__ */ L("span", {
							className: "grid size-14 shrink-0 place-items-center bg-accent-soft text-accent-ink",
							children: /* @__PURE__ */ L(B, { className: "size-7" })
						}), /* @__PURE__ */ R("div", {
							className: "min-w-0 flex-1 space-y-4",
							children: [/* @__PURE__ */ R("div", { children: [
								/* @__PURE__ */ R("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ L("span", {
										className: "text-lg font-semibold",
										children: l.account.nickname || "Your identity"
									}), /* @__PURE__ */ R(n, {
										tone: l.account.error ? "danger" : "success",
										children: [/* @__PURE__ */ L(U, { className: "size-3" }), " Linked"]
									})]
								}),
								/* @__PURE__ */ R("div", {
									className: "text-sm text-muted",
									children: ["on ", l.server.name]
								}),
								/* @__PURE__ */ R("div", {
									className: "mt-1 text-xs text-subtle",
									children: [
										"Linked ",
										k(l.account.linked_at),
										l.account.last_connected_at ? ` · last connected ${k(l.account.last_connected_at)}` : "",
										l.account.synced_at ? ` · groups checked ${k(l.account.synced_at)}` : ""
									]
								}),
								/* @__PURE__ */ R("div", {
									className: "mt-1 font-mono text-xs text-subtle",
									children: ["identity ", l.account.uid]
								})
							] }), /* @__PURE__ */ L(Z, {
								server: l.server,
								url: l.url
							})]
						})]
					}), /* @__PURE__ */ R("div", {
						className: "flex flex-wrap gap-2 border-t border-border px-card py-3",
						children: [/* @__PURE__ */ R(r, {
							variant: "secondary",
							loading: h.isPending,
							onClick: () => h.mutate(),
							children: [/* @__PURE__ */ L(W, {}), " Fix my groups"]
						}), /* @__PURE__ */ R(r, {
							variant: "danger",
							onClick: () => f(!0),
							children: [/* @__PURE__ */ L(G, {}), " Unlink"]
						})]
					})] }),
					/* @__PURE__ */ L("p", {
						className: "text-xs text-subtle",
						children: "Your identity is the one TeamSpeak made on the computer you linked from. On another computer, export it from TeamSpeak's identity settings and import it there, or unlink and link again."
					})
				]
			}), /* @__PURE__ */ R(i, {
				className: "h-fit",
				children: [/* @__PURE__ */ L(s, {
					title: "Your server groups",
					description: "For the server's channel permissions. They follow your groups and state on this site."
				}), /* @__PURE__ */ R(a, { children: [/* @__PURE__ */ L(X, {
					groups: [...l.registered_group ? [l.registered_group] : [], ...l.groups_due],
					empty: "None of your groups come with a server group."
				}), l.account.groups.join() !== l.groups_due.join() && /* @__PURE__ */ L("p", {
					className: "mt-3 text-xs text-subtle",
					children: "Changed since the last check; press Fix my groups."
				})] })]
			})]
		}) : /* @__PURE__ */ L(i, { children: /* @__PURE__ */ R("div", {
			className: "grid gap-8 p-card sm:p-8 lg:grid-cols-[1fr_320px] lg:items-center",
			children: [/* @__PURE__ */ R("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ R("div", {
					className: "flex items-center gap-3 text-accent-ink",
					children: [/* @__PURE__ */ L(B, { className: "size-8" }), /* @__PURE__ */ L("span", {
						className: "text-xl font-semibold text-text",
						children: l.server.name
					})]
				}), l.can_link ? /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L("p", {
					className: "max-w-prose text-sm text-muted",
					children: "You'll get a one-time privilege key. Use it in your TeamSpeak client (the connect link does it for you) and this site recognises your identity from then on: no passwords, and your server groups come from here."
				}), /* @__PURE__ */ R(r, {
					variant: "primary",
					size: "lg",
					loading: p.isPending,
					onClick: () => p.mutate(),
					children: [/* @__PURE__ */ L(H, {}), " Link my TeamSpeak"]
				})] }) : /* @__PURE__ */ L(e, {
					tone: "warning",
					title: "You don't have access to TeamSpeak",
					children: "Access comes with your membership. Ask your corporation's leadership if you think you should have it."
				})]
			}), l.can_link && /* @__PURE__ */ R("div", {
				className: "border border-border bg-bg/40 p-4 text-sm",
				children: [
					/* @__PURE__ */ L("div", {
						className: "mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
						children: "You'll be"
					}),
					/* @__PURE__ */ L("div", {
						className: "mb-3 font-medium",
						children: l.nickname
					}),
					/* @__PURE__ */ L(X, {
						groups: [...l.registered_group ? [l.registered_group] : [], ...l.groups_due],
						empty: "No server groups yet; they come with your groups."
					})
				]
			})]
		}) }) : /* @__PURE__ */ L(i, { children: /* @__PURE__ */ L(m, {
			icon: /* @__PURE__ */ L(B, {}),
			title: "TeamSpeak isn't set up yet",
			description: o ? "Enter the server's ServerQuery login under Server setup." : "Your leadership hasn't connected a TeamSpeak server to this site yet.",
			action: o ? /* @__PURE__ */ L(j, {
				to: "/p/teamspeak/admin",
				children: /* @__PURE__ */ R(r, {
					variant: "primary",
					children: [/* @__PURE__ */ L(V, {}), " Server setup"]
				})
			}) : void 0
		}) }),
		/* @__PURE__ */ L(c, {
			open: d,
			onOpenChange: f,
			title: "Unlink your TeamSpeak identity?",
			description: "Your server groups are taken away. You can link again at any time with a new key.",
			danger: !0,
			confirmLabel: /* @__PURE__ */ R(I, { children: [/* @__PURE__ */ L(G, {}), " Unlink"] }),
			onConfirm: () => g.mutateAsync()
		})
	] });
}
//#endregion
//#region src/index.tsx
function Te() {
	let { data: e, isLoading: t } = $();
	if (t) return /* @__PURE__ */ L(b, { className: "h-16" });
	if (!e?.configured || !e.account && !e.can_link) return null;
	if (!e.account || e.account.status === "pending") return /* @__PURE__ */ R("div", {
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ R("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ L(B, { className: "size-7 text-accent-ink" }), /* @__PURE__ */ R("div", { children: [/* @__PURE__ */ R("div", {
				className: "font-medium",
				children: ["Get on ", e.server.name]
			}), /* @__PURE__ */ L("div", {
				className: "text-xs text-muted",
				children: e.account ? "Finish linking your TeamSpeak identity." : "Link your TeamSpeak identity to join voice comms."
			})] })]
		}), /* @__PURE__ */ L(j, {
			to: "/p/teamspeak",
			children: /* @__PURE__ */ L(r, {
				variant: "primary",
				size: "sm",
				children: e.account ? "Finish" : "Link"
			})
		})]
	});
	let i = [...e.registered_group ? [e.registered_group] : [], ...e.groups_due];
	return /* @__PURE__ */ R(j, {
		to: "/p/teamspeak",
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ R("div", {
			className: "flex min-w-0 items-center gap-3",
			children: [/* @__PURE__ */ L(B, { className: "size-7 shrink-0 text-accent-ink" }), /* @__PURE__ */ R("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ L("div", {
					className: "truncate font-medium",
					children: e.account.nickname || e.nickname
				}), /* @__PURE__ */ L("div", {
					className: "truncate text-xs text-muted",
					children: i.length ? i.join(" · ") : "no groups"
				})]
			})]
		}), /* @__PURE__ */ L(n, {
			tone: e.account.error ? "danger" : "success",
			children: e.account.error ? "Problem" : "Linked"
		})]
	});
}
var Ee = ie({
	routes: [{
		path: "",
		Component: we
	}, {
		path: "admin",
		Component: he
	}],
	widgets: [{
		id: "account",
		title: "TeamSpeak",
		Component: Te,
		size: "sm",
		order: 22
	}]
});
//#endregion
export { Ee as default };

export const classes = ["!check","!data","!o","!ready","---","-----------------------------------------------------------------------------------------------------------","------------------------------------------------------------------------------------------------------------","-------------------------------------------------------------------------------------------------------------","@conduit/sdk","@tanstack/react-query","a","accent","access","account","action","actions","add","address","admin","admins","after","again","align","all","allow","allowlisted","already","also","alt","alts","always","and","animate-spin","another","any","anyway","appear","are","aria-label","as","asking","async","at","autoComplete","await","away","background","be","before","being","bg-accent-soft","bg-bg/40","bg-success-soft","body","boolean","border","border-b","border-border","border-border-strong","border-success/40","border-t","but","button","by","called","can","canManage","can_link","catch","changes","channel","character","characters","check","checked","checked_at","children","className","cldbid","client","color","com","come","comes","commands","compliant","computer","conduit","configured","confirmLabel","connect","connect_url","connected","connection","connects","const","corporation","couldn","count","current","currentColor","cx","cy","danger","dashboard","data","database","date","decide","default","delete","description","disabled","divide-border","divide-y","does","doesn","don","done","drop","empty","end","entries","error","errors","eslint-disable-next-line","every","everyone","everything","export","extends","eyebrow","false","fast","few","fill","filled","fills","fix","flex","flex-1","flex-col","flex-wrap","follow","font-medium","font-mono","font-semibold","for","force","found","friendly","from","full","function","gap-1","gap-1.5","gap-2","gap-3","gap-4","gap-5","gap-6","gap-8","get","ghost","give","giveUp","given","gives","grid","grid-cols-[32px_1fr]","group","groups","groups_due","h-16","h-56","h-64","h-96","h-fit","hand","has","has_access","hasn","have","height","here","hint","host","hover:text-accent-ink","hover:text-text","hover:underline","how","href","i","icon","icon-xs","icons","id","identity","if","import","in","info","inline","inline-flex","instead","interface","into","is","isLoading","isn","it","items","items-center","items-end","items-stretch","its","j","join","justify-between","keep","keeps","key","keys","kick","kick_without_access","kind","knows","label","last","last_connected_at","last_full_sync","leadership","leave","leaves","left","length","lg","lg:grid-cols-[1fr_320px]","lg:grid-cols-[1fr_340px]","lg:items-center","limit","link","linked","linked_at","linking","list","list-decimal","list-disc","listens","lists","ll","loading","login","long","look","lose","m","m12","m15.5","m18.84","m21","m5.17","made","main","manage","manage_teamspeak","map","mapped","mapping","mappings","marks","match","matches","matching","max-w-48","max-w-64","max-w-72","max-w-prose","max-w-sm","max_clients","may","mb-1","mb-2","mb-3","me","member","members","min","min-w-0","min-w-56","ml-1","mono","more","mt-1","mt-1.5","mt-2","mt-3","mutationFn","my","name","names","needle","needs","neutral","never","new","new-password","next","nickname","nickname_format","no","non-compliant","none","not","notices","now","nudge","number","of","off","on","onChange","onCheckedChange","onClick","onConfirm","onError","onFocus","onOpenChange","onSelect","onSuccess","onValueChange","once","one","one-time","online","only","open","or","order","origin-center","out","own","p-4","p-card","page","password","passwords","paste","patch","path","pb-2","pending","people","person","pills","pl-4","pl-5","place-items-center","placeholder","plus","port","portrait","post","press","primary","privilege","privilege_key","problems","pt-1","public_host","public_port","put","puts","px-3","px-card","py-3","qc","query","queryFn","queryKey","query_host","query_password","query_password_set","query_port","query_user","re","reached","react","react-hooks/exhaustive-deps","react-router","readOnly","ready","recognises","refresh","registered_group","registered_sgid","renew","require_for_compliance","rest","return","right","rights","round","routes","rows","runs","rx","ry","s","save","saved","search","secondary","seconds","see","select","send","server","server_groups","server_id","server_name","server_version","serveradmin","serverqueryadd","set","setCheck","setConfirmUnlink","setForm","setOpen","setPolling","setQ","setRemove","setRows","setSgid","setTab","setTarget","settings","setup","several","sg_name","sgid","shared","should","shown","shows","shrink-0","since","site","six","size","size-14","size-3","size-4","size-7","size-8","sm","sm:flex-row","sm:grid-cols-2","sm:grid-cols-4","sm:grid-cols-[1fr_120px]","sm:grid-cols-[1fr_120px_100px]","sm:grid-cols-[auto_1fr]","sm:items-center","sm:items-start","sm:p-8","so","space-y-1","space-y-2","space-y-3","space-y-4","space-y-5","space-y-6","spaced","src","stand","start","started","started_at","starts","state","states","stats","status","step","still","stops","string","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","sync","syncAll","syncOne","synced_at","syncing","t","tab","take","taken","takes","taking","target","target_id","teamspeak","test","text","text-[11px]","text-accent-ink","text-danger-fg","text-lg","text-muted","text-sm","text-subtle","text-success-fg","text-text","text-xl","text-xs","that","the","their","theirs","them","then","they","things","think","this","through","time","title","to","toast","told","tone","tracking-[0.12em]","true","truncate","try","txt","type","uid","under","unless","unlink","unlinked","until","up","updated","uppercase","url","use","useHasPerm","useMe","useQueryClient","useState","used","user","uses","v","value","variant","ve","version","viewBox","viewable","virtual_server_name","voice","voice_port","w-80","w-full","wait","warning","was","watching","what","when","where","whether","which","who","widgets","width","with","within","without","work","works","x1","x2","xl:grid-cols-[1fr_340px]","xl:grid-cols-[1fr_360px]","xl:grid-cols-[1fr_400px]","xs","y1","y2","yet","you","your"];
