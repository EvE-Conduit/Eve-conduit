import { Avatar as e, Badge as t, Button as n, Card as r, ConfirmDialog as i, Dialog as a, DiscordPings as o, DropdownContent as s, DropdownItem as c, DropdownMenu as l, DropdownSeparator as u, DropdownTrigger as d, EmptyState as f, Field as p, Input as m, PageHeader as h, Segmented as g, Skeleton as _, SwitchRow as v, Textarea as y, api as b, cn as x, dateTime as S, definePlugin as C, timeAgo as w, toast as T } from "@conduit/sdk";
import { useMutation as E, useQuery as D, useQueryClient as O } from "@tanstack/react-query";
import { Link as k } from "react-router";
import { Fragment as A, useEffect as j, useState as M } from "react";
import { Fragment as N, jsx as P, jsxs as F } from "react/jsx-runtime";
//#region src/icons.tsx
function I({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ P("svg", {
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
var L = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "m3 11 18-5v12L3 14v-3z" }), /* @__PURE__ */ P("path", { d: "M11.6 16.8a3 3 0 1 1-5.8-1.6" })]
}), ee = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }), /* @__PURE__ */ P("path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" })]
}), R = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "M12 17v5" }), /* @__PURE__ */ P("path", { d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" })]
}), z = (e) => /* @__PURE__ */ P(I, {
	...e,
	children: /* @__PURE__ */ P("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" })
}), B = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [
		/* @__PURE__ */ P("path", { d: "M3 6h18" }),
		/* @__PURE__ */ P("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ P("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), V = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "M5 12h14" }), /* @__PURE__ */ P("path", { d: "M12 5v14" })]
}), te = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ P("path", { d: "M12 6v6l4 2" })]
}), ne = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [/* @__PURE__ */ P("path", { d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }), /* @__PURE__ */ P("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), re = (e) => /* @__PURE__ */ F(I, {
	...e,
	children: [
		/* @__PURE__ */ P("circle", {
			cx: "12",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ P("circle", {
			cx: "19",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ P("circle", {
			cx: "5",
			cy: "12",
			r: "1"
		})
	]
}), ie = /(\*\*[^*\n]{1,500}\*\*|\*[^*\s][^*\n]{0,500}\*|_[^_\s][^_\n]{0,500}_|`[^`\n]{1,500}`|\[[^\]\n]{1,200}\]\([^)\s]{1,2000}\))/g;
function ae(e) {
	return e.startsWith("https://") || e.startsWith("/") && !e.startsWith("//") && !e.includes("\\") ? e : null;
}
function H(e, t) {
	let n = [], r = 0, i = 0;
	for (let a of e.matchAll(ie)) {
		let o = a[0], s = a.index ?? 0;
		s > r && n.push(e.slice(r, s));
		let c = `${t}-${i++}`;
		if (o.startsWith("**")) n.push(/* @__PURE__ */ P("strong", {
			className: "font-semibold text-text",
			children: H(o.slice(2, -2), c)
		}, c));
		else if (o.startsWith("`")) n.push(/* @__PURE__ */ P("code", {
			className: "bg-hover px-1 py-0.5 font-mono text-[0.9em]",
			children: o.slice(1, -1)
		}, c));
		else if (o.startsWith("[")) {
			let [, e, t] = o.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/) ?? [], r = t ? ae(t) : null;
			n.push(r ? /* @__PURE__ */ P("a", {
				href: r,
				className: "text-accent-ink underline underline-offset-4 hover:no-underline",
				...r.startsWith("https://") ? {
					target: "_blank",
					rel: "noreferrer"
				} : {},
				children: e
			}, c) : e);
		} else n.push(/* @__PURE__ */ P("em", { children: H(o.slice(1, -1), c) }, c));
		r = s + o.length;
	}
	return r < e.length && n.push(e.slice(r)), n;
}
function U(e, t) {
	return e.split("\n").map((e, n) => /* @__PURE__ */ F(A, { children: [n > 0 && /* @__PURE__ */ P("br", {}), H(e, `${t}-l${n}`)] }, `${t}-l${n}`));
}
function W({ text: e, className: t = "" }) {
	let n = e.replace(/\r\n/g, "\n").split(/\n{2,}/).map((e) => e.trim()).filter(Boolean);
	return /* @__PURE__ */ P("div", {
		className: `space-y-3 text-sm leading-relaxed text-muted ${t}`,
		children: n.map((e, t) => {
			let n = `b${t}`, r = e.match(/^(#{1,3})\s+(.+)$/);
			if (r && !e.includes("\n")) {
				let e = r[1].length === 1 ? "text-lg" : r[1].length === 2 ? "text-base" : "text-sm uppercase tracking-[0.12em]";
				return /* @__PURE__ */ P("h3", {
					className: `font-semibold text-text ${e}`,
					children: H(r[2], n)
				}, n);
			}
			let i = e.split("\n");
			return i.every((e) => /^\s*[-*]\s+/.test(e)) ? /* @__PURE__ */ P("ul", {
				className: "list-disc space-y-1 pl-5",
				children: i.map((e, t) => /* @__PURE__ */ P("li", { children: H(e.replace(/^\s*[-*]\s+/, ""), `${n}-${t}`) }, t))
			}, n) : i.every((e) => /^\s*\d+[.)]\s+/.test(e)) ? /* @__PURE__ */ P("ol", {
				className: "list-decimal space-y-1 pl-5",
				children: i.map((e, t) => /* @__PURE__ */ P("li", { children: H(e.replace(/^\s*\d+[.)]\s+/, ""), `${n}-${t}`) }, t))
			}, n) : i.every((e) => e.startsWith(">")) ? /* @__PURE__ */ P("blockquote", {
				className: "border-l-2 border-accent/50 pl-3 italic",
				children: U(i.map((e) => e.replace(/^>\s?/, "")).join("\n"), n)
			}, n) : /* @__PURE__ */ P("p", { children: U(e, n) }, n);
		})
	});
}
//#endregion
//#region src/types.ts
var G = "/api/p/announcements";
//#endregion
//#region src/editor.tsx
function K(e) {
	if (!e) return "";
	let t = new Date(e), n = (e) => String(e).padStart(2, "0");
	return `${t.getFullYear()}-${n(t.getMonth() + 1)}-${n(t.getDate())}T${n(t.getHours())}:${n(t.getMinutes())}`;
}
function q(e) {
	return e ? new Date(e).toISOString() : null;
}
function oe({ announcement: e, onClose: t }) {
	let r = O(), { data: i } = D({
		queryKey: ["announcements", "audience"],
		queryFn: () => b.get(`${G}/audience`)
	}), [o, s] = M({
		title: e?.title ?? "",
		body: e?.body ?? "",
		tone: e?.tone ?? "info",
		pinned: e?.pinned ?? !1,
		on_landing: e?.on_landing ?? !0,
		notify: e?.notify ?? !0,
		states: e?.states?.map((e) => e.id) ?? [],
		groups: e?.groups?.map((e) => e.id) ?? [],
		publish_at: e && e.status === "scheduled" ? K(e.publish_at) : "",
		expires_at: K(e?.expires_at)
	}), [c, l] = M("write"), u = (e) => s((t) => ({
		...t,
		...e
	})), d = (e, t) => u({ [e]: o[e].includes(t) ? o[e].filter((e) => e !== t) : [...o[e], t] }), f = E({
		mutationFn: () => {
			let t = {
				...o,
				publish_at: q(o.publish_at),
				expires_at: q(o.expires_at)
			};
			return e ? b.put(`${G}/${e.id}`, t) : b.post(G, t);
		},
		onSuccess: (n) => {
			r.invalidateQueries({ queryKey: ["announcements"] }), T.success(n.status === "scheduled" ? "Scheduled" : e ? "Announcement updated" : "Announcement posted"), t();
		},
		onError: (e) => T.error(e.message)
	}), h = !!o.publish_at && new Date(o.publish_at) > /* @__PURE__ */ new Date(), _ = !!e?.announced_at, x = o.states.length === 0 && o.groups.length === 0;
	return /* @__PURE__ */ P(a, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: e ? "Edit announcement" : "New announcement",
		size: "xl",
		footer: /* @__PURE__ */ F(N, { children: [
			/* @__PURE__ */ F("span", {
				className: "mr-auto self-center text-xs text-muted",
				children: [
					x ? "Everyone" : "Only the chosen states and groups",
					" will see it",
					h ? ` from ${new Date(o.publish_at).toLocaleString()}` : "",
					"."
				]
			}),
			/* @__PURE__ */ P(n, {
				variant: "ghost",
				onClick: t,
				children: "Cancel"
			}),
			/* @__PURE__ */ P(n, {
				variant: "primary",
				disabled: !o.title.trim(),
				loading: f.isPending,
				onClick: () => f.mutate(),
				children: e ? "Save" : h ? "Schedule" : "Post"
			})
		] }),
		children: /* @__PURE__ */ F("div", {
			className: "grid gap-6 lg:grid-cols-[1fr_280px]",
			children: [/* @__PURE__ */ F("div", {
				className: "min-w-0 space-y-4",
				children: [/* @__PURE__ */ P(p, {
					label: "Title",
					required: !0,
					children: /* @__PURE__ */ P(m, {
						value: o.title,
						maxLength: 200,
						onChange: (e) => u({ title: e.target.value }),
						placeholder: "Stratop Saturday 18:00 ET",
						autoFocus: !0
					})
				}), /* @__PURE__ */ F("div", { children: [/* @__PURE__ */ F("div", {
					className: "mb-1.5 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ P("span", {
						className: "text-[13px] font-medium",
						children: "Message"
					}), /* @__PURE__ */ P(g, {
						value: c,
						onChange: l,
						size: "sm",
						options: [{
							value: "write",
							label: "Write",
							icon: /* @__PURE__ */ P(z, {})
						}, {
							value: "preview",
							label: "Preview",
							icon: /* @__PURE__ */ P(ne, {})
						}]
					})]
				}), c === "write" ? /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ P(y, {
					rows: 12,
					value: o.body,
					onChange: (e) => u({ body: e.target.value }),
					placeholder: "Form up in Jita at 17:45.\n\n- Doctrine: **Ferox fleet**\n- Comms: [Mumble](https://example.com)\n\nSRP covers doctrine fits.",
					className: "font-mono text-[13px]"
				}), /* @__PURE__ */ P("p", {
					className: "mt-1.5 text-xs text-subtle",
					children: "**bold**, *italic*, `code`, [link](https://…), - lists, 1. lists, # headings, > quotes. A blank line starts a new paragraph."
				})] }) : /* @__PURE__ */ P("div", {
					className: "min-h-[280px] border border-border bg-bg/40 p-4",
					children: o.body.trim() ? /* @__PURE__ */ P(W, { text: o.body }) : /* @__PURE__ */ P("p", {
						className: "text-sm text-subtle",
						children: "Nothing to preview yet."
					})
				})] })]
			}), /* @__PURE__ */ F("div", {
				className: "space-y-5",
				children: [
					/* @__PURE__ */ F("div", { children: [
						/* @__PURE__ */ P("div", {
							className: "mb-1.5 text-[13px] font-medium",
							children: "Kind"
						}),
						/* @__PURE__ */ P(g, {
							value: o.tone,
							onChange: (e) => u({ tone: e }),
							size: "sm",
							className: "w-full",
							options: [
								{
									value: "info",
									label: "News"
								},
								{
									value: "important",
									label: "Important"
								},
								{
									value: "urgent",
									label: "Urgent"
								}
							]
						}),
						o.tone === "urgent" && /* @__PURE__ */ P("p", {
							className: "mt-1.5 text-xs text-warning-fg",
							children: "Urgent ones notify people even if they muted announcements."
						})
					] }),
					/* @__PURE__ */ F("div", { children: [
						/* @__PURE__ */ P("div", {
							className: "mb-1.5 text-[13px] font-medium",
							children: "Who sees it"
						}),
						/* @__PURE__ */ P("p", {
							className: "mb-2 text-xs text-muted",
							children: "Nothing picked means everyone."
						}),
						/* @__PURE__ */ P("div", {
							className: "flex flex-wrap gap-1.5",
							children: (i?.states ?? []).map((e) => /* @__PURE__ */ P(J, {
								on: o.states.includes(e.id),
								onClick: () => d("states", e.id),
								color: e.color,
								children: e.name
							}, `s${e.id}`))
						}),
						(i?.groups.length ?? 0) > 0 && /* @__PURE__ */ P("div", {
							className: "mt-2 flex flex-wrap gap-1.5",
							children: i.groups.map((e) => /* @__PURE__ */ P(J, {
								on: o.groups.includes(e.id),
								onClick: () => d("groups", e.id),
								children: e.name
							}, `g${e.id}`))
						})
					] }),
					/* @__PURE__ */ F("div", {
						className: "divide-y divide-border border border-border px-3",
						children: [
							/* @__PURE__ */ P(v, {
								label: "Pin to the top",
								checked: o.pinned,
								onCheckedChange: (e) => u({ pinned: e })
							}),
							/* @__PURE__ */ P(v, {
								label: "Post to the landing page",
								description: "In the Bulletin on the home page, for the people it's meant for.",
								checked: o.on_landing,
								onCheckedChange: (e) => u({ on_landing: e })
							}),
							/* @__PURE__ */ P(v, {
								label: "Notify people",
								description: _ ? "Already sent; editing doesn't send it again." : "Under the bell, and through webhooks such as Discord.",
								checked: o.notify,
								disabled: _,
								onCheckedChange: (e) => u({ notify: e })
							})
						]
					}),
					/* @__PURE__ */ P(p, {
						label: "Publish at",
						hint: _ ? "Already published." : "Empty: straight away.",
						children: /* @__PURE__ */ P(m, {
							type: "datetime-local",
							value: o.publish_at,
							disabled: _,
							onChange: (e) => u({ publish_at: e.target.value })
						})
					}),
					/* @__PURE__ */ P(p, {
						label: "Take down at",
						hint: "Optional. It disappears for members afterwards.",
						children: /* @__PURE__ */ P(m, {
							type: "datetime-local",
							value: o.expires_at,
							onChange: (e) => u({ expires_at: e.target.value })
						})
					})
				]
			})]
		})
	});
}
function J({ on: e, onClick: t, color: n, children: r }) {
	return /* @__PURE__ */ F("button", {
		type: "button",
		"aria-pressed": e,
		onClick: t,
		className: x("inline-flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors", e ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text"),
		children: [n && /* @__PURE__ */ P("span", {
			className: "size-1.5 rotate-45",
			style: { background: n }
		}), r]
	});
}
//#endregion
//#region src/feed.tsx
var Y = {
	info: {
		label: "News",
		badge: "info",
		stripe: "bg-accent"
	},
	important: {
		label: "Important",
		badge: "warning",
		stripe: "bg-warning"
	},
	urgent: {
		label: "Urgent",
		badge: "danger",
		stripe: "bg-danger"
	}
};
function se(e = !1) {
	return D({
		queryKey: [
			"announcements",
			"feed",
			e
		],
		queryFn: () => b.get(`${G}${e ? "?all=true" : ""}`)
	});
}
function ce(e) {
	let { data: t } = D({
		queryKey: ["pings", "announcements"],
		queryFn: () => b.get("/api/pings?plugin=announcements"),
		staleTime: 6e4,
		enabled: e
	});
	return !!t?.configured && t.events.length > 0;
}
function le() {
	let e = O(), [t, s] = M("live"), { data: c, isLoading: l } = se(t === "all"), [u, d] = M(null), [p, m] = M(null), [v, y] = M(!1), x = ce(!!c?.can_post), S = () => e.invalidateQueries({ queryKey: ["announcements"] }), C = c?.unread ?? 0;
	j(() => {
		if (!C) return;
		let t = setTimeout(() => {
			b.post(`${G}/read`, {}).then(() => e.invalidateQueries({ queryKey: ["announcements", "widget"] }), () => void 0);
		}, 1500);
		return () => clearTimeout(t);
	}, [C, e]), j(() => {
		c && window.location.hash.startsWith("#a") && document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
	}, [c]);
	let w = E({
		mutationFn: (e) => b.post(`${G}/${e.id}/pin`, { pinned: !e.pinned }),
		onSuccess: S,
		onError: (e) => T.error(e.message)
	}), D = E({
		mutationFn: (e) => b.delete(`${G}/${e}`),
		onSuccess: () => {
			S(), T.success("Announcement deleted");
		},
		onError: (e) => T.error(e.message)
	}), k = c?.announcements ?? [], A = k.filter((e) => e.pinned && e.status === "live"), I = k.filter((e) => !A.includes(e));
	return /* @__PURE__ */ F(N, { children: [
		/* @__PURE__ */ P(h, {
			eyebrow: "Corporation",
			title: "Announcements",
			icon: /* @__PURE__ */ P(L, {}),
			description: "News and orders from leadership. Pinned announcements stay on top.",
			actions: c?.can_post ? /* @__PURE__ */ F("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ P(g, {
						value: t,
						onChange: s,
						size: "sm",
						options: [{
							value: "live",
							label: "What members see"
						}, {
							value: "all",
							label: "Everything"
						}]
					}),
					x && /* @__PURE__ */ F(n, {
						onClick: () => y(!0),
						children: [/* @__PURE__ */ P(ee, {}), " Discord pings"]
					}),
					/* @__PURE__ */ F(n, {
						variant: "primary",
						onClick: () => d("new"),
						children: [/* @__PURE__ */ P(V, {}), " New announcement"]
					})
				]
			}) : void 0
		}),
		l || !c ? /* @__PURE__ */ P("div", {
			className: "space-y-4",
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ P(_, { className: "h-40" }, e))
		}) : k.length === 0 ? /* @__PURE__ */ P(r, { children: /* @__PURE__ */ P(f, {
			icon: /* @__PURE__ */ P(L, {}),
			title: "No announcements yet",
			description: c.can_post ? "Post the first one: fleet schedules, rules, moon tax changes, anything members should know." : "Leadership hasn't posted anything yet. Check back later.",
			action: c.can_post ? /* @__PURE__ */ F(n, {
				variant: "primary",
				onClick: () => d("new"),
				children: [/* @__PURE__ */ P(V, {}), " New announcement"]
			}) : void 0
		}) }) : /* @__PURE__ */ F("div", {
			className: "mx-auto max-w-4xl space-y-4",
			children: [
				A.map((e) => /* @__PURE__ */ P(X, {
					a: e,
					canPost: c.can_post,
					onEdit: () => d(e),
					onPin: () => w.mutate(e),
					onDelete: () => m(e)
				}, e.id)),
				A.length > 0 && I.length > 0 && /* @__PURE__ */ P("div", {
					className: "h-px bg-border",
					"aria-hidden": !0
				}),
				I.map((e) => /* @__PURE__ */ P(X, {
					a: e,
					canPost: c.can_post,
					onEdit: () => d(e),
					onPin: () => w.mutate(e),
					onDelete: () => m(e)
				}, e.id))
			]
		}),
		u && /* @__PURE__ */ P(oe, {
			announcement: u === "new" ? null : u,
			onClose: () => d(null)
		}),
		/* @__PURE__ */ P(a, {
			open: v,
			onOpenChange: y,
			title: "Announcement alerts",
			description: "Changes are saved straight away.",
			children: /* @__PURE__ */ P(o, { plugin: "announcements" })
		}),
		/* @__PURE__ */ P(i, {
			open: !!p,
			onOpenChange: (e) => !e && m(null),
			danger: !0,
			title: `Delete "${p?.title}"?`,
			description: "It disappears for everyone. Notifications already sent stay in people's lists.",
			confirmLabel: /* @__PURE__ */ F(N, { children: [/* @__PURE__ */ P(B, {}), " Delete"] }),
			onConfirm: () => p && D.mutateAsync(p.id)
		})
	] });
}
function X({ a: i, canPost: a, onEdit: o, onPin: f, onDelete: p }) {
	let m = Y[i.tone], h = [...(i.states ?? []).map((e) => e.name), ...(i.groups ?? []).map((e) => e.name)];
	return /* @__PURE__ */ F(r, {
		id: `a${i.id}`,
		className: x("relative overflow-hidden scroll-mt-24", i.status !== "live" && "opacity-70"),
		children: [/* @__PURE__ */ P("span", {
			className: x("absolute inset-y-0 left-0 w-1", m.stripe),
			"aria-hidden": !0
		}), /* @__PURE__ */ F("article", {
			className: "p-card pl-6 sm:p-6 sm:pl-8",
			children: [/* @__PURE__ */ F("header", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ F("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ F("div", {
							className: "mb-1.5 flex flex-wrap items-center gap-1.5",
							children: [
								i.pinned && /* @__PURE__ */ F(t, {
									tone: "accent",
									children: [/* @__PURE__ */ P(R, { className: "size-3" }), " Pinned"]
								}),
								i.tone !== "info" && /* @__PURE__ */ P(t, {
									tone: m.badge,
									children: m.label
								}),
								i.unread && i.status === "live" && /* @__PURE__ */ P(t, {
									tone: "success",
									children: "New"
								}),
								i.status === "scheduled" && /* @__PURE__ */ F(t, {
									tone: "info",
									children: [
										/* @__PURE__ */ P(te, { className: "size-3" }),
										" Goes out ",
										S(i.publish_at)
									]
								}),
								i.status === "expired" && /* @__PURE__ */ F(t, { children: ["Ended ", w(i.expires_at)] })
							]
						}),
						/* @__PURE__ */ P("h2", {
							className: "text-lg font-semibold leading-snug text-text sm:text-xl",
							children: i.title
						}),
						/* @__PURE__ */ F("div", {
							className: "mt-2 flex flex-wrap items-center gap-2 text-xs text-subtle",
							children: [
								i.author && /* @__PURE__ */ P(e, {
									src: i.author.portrait ?? void 0,
									name: i.author.name,
									size: "xs"
								}),
								/* @__PURE__ */ P("span", {
									className: "text-muted",
									children: i.author?.name ?? "Leadership"
								}),
								/* @__PURE__ */ P("span", { children: "·" }),
								/* @__PURE__ */ P("time", {
									dateTime: i.publish_at,
									title: S(i.publish_at),
									children: w(i.publish_at)
								}),
								i.edited && /* @__PURE__ */ P("span", {
									title: `Edited ${S(i.updated_at)}`,
									children: "· edited"
								}),
								a && /* @__PURE__ */ F("span", { children: ["· ", h.length ? `for ${h.join(", ")}` : "for everyone"] }),
								a && i.expires_at && i.status !== "expired" && /* @__PURE__ */ F("span", { children: ["· until ", S(i.expires_at)] })
							]
						})
					]
				}), a && /* @__PURE__ */ F(l, { children: [/* @__PURE__ */ P(d, {
					asChild: !0,
					children: /* @__PURE__ */ P(n, {
						variant: "ghost",
						size: "icon-sm",
						"aria-label": `Options for ${i.title}`,
						children: /* @__PURE__ */ P(re, {})
					})
				}), /* @__PURE__ */ F(s, {
					align: "end",
					children: [
						/* @__PURE__ */ F(c, {
							onSelect: o,
							children: [/* @__PURE__ */ P(z, {}), " Edit"]
						}),
						/* @__PURE__ */ F(c, {
							onSelect: f,
							children: [
								/* @__PURE__ */ P(R, {}),
								" ",
								i.pinned ? "Unpin" : "Pin to the top"
							]
						}),
						/* @__PURE__ */ P(u, {}),
						/* @__PURE__ */ F(c, {
							danger: !0,
							onSelect: p,
							children: [/* @__PURE__ */ P(B, {}), " Delete"]
						})
					]
				})] })]
			}), i.body && /* @__PURE__ */ P(W, {
				text: i.body,
				className: "mt-4"
			})]
		})]
	});
}
//#endregion
//#region src/bulletin.tsx
var Z = "/p/announcements";
function ue(e, t = 180) {
	let n = e.replace(/\[([^\]\n]{0,200})\]\([^)\s]{0,2000}\)/g, "$1").replace(/^\s*(#{1,3}|[-*]|\d+\.|>)\s+/gm, "").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
	return n.length > t ? `${n.slice(0, t).trimEnd()}…` : n;
}
function de({ a: t }) {
	return /* @__PURE__ */ F("div", {
		className: "flex items-center gap-2 text-xs text-subtle",
		children: [
			t.author && /* @__PURE__ */ P(e, {
				src: t.author.portrait ?? void 0,
				name: t.author.name,
				size: "xs"
			}),
			/* @__PURE__ */ P("span", { children: t.author?.name ?? "Leadership" }),
			/* @__PURE__ */ P("span", {
				"aria-hidden": !0,
				children: "·"
			}),
			/* @__PURE__ */ P("time", {
				dateTime: t.publish_at,
				title: S(t.publish_at),
				children: w(t.publish_at)
			})
		]
	});
}
function fe({ a: e }) {
	return /* @__PURE__ */ F("div", {
		className: "flex flex-wrap items-center gap-1.5",
		children: [
			/* @__PURE__ */ P(t, {
				tone: Y[e.tone].badge,
				children: Y[e.tone].label
			}),
			e.pinned && /* @__PURE__ */ F(t, { children: [/* @__PURE__ */ P(R, { className: "size-3" }), " Pinned"] }),
			e.unread && /* @__PURE__ */ P(t, {
				tone: "success",
				children: "New"
			})
		]
	});
}
function Q({ a: e, preview: t }) {
	let n = e.body.length > 700 || e.body.split("\n").length > 12;
	return /* @__PURE__ */ F("article", {
		className: "panel relative flex flex-col overflow-hidden p-6 animate-fade-up sm:p-8",
		children: [
			/* @__PURE__ */ P("span", {
				className: x("absolute inset-y-0 left-0 w-1", Y[e.tone].stripe),
				"aria-hidden": !0
			}),
			/* @__PURE__ */ P(fe, { a: e }),
			/* @__PURE__ */ P("h3", {
				className: "mt-4 text-2xl font-semibold leading-tight text-text sm:text-[1.7rem]",
				children: e.title
			}),
			/* @__PURE__ */ P("div", {
				className: "mt-3",
				children: /* @__PURE__ */ P(de, { a: e })
			}),
			e.body && /* @__PURE__ */ F("div", {
				className: x("relative mt-5", n && "max-h-64 overflow-hidden"),
				children: [/* @__PURE__ */ P(W, {
					text: e.body,
					className: "text-[15px]"
				}), n && /* @__PURE__ */ P("div", {
					className: "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-surface to-transparent",
					"aria-hidden": !0
				})]
			}),
			/* @__PURE__ */ P($, {
				id: e.id,
				preview: t,
				className: "mt-5 self-start text-sm font-medium text-accent-ink hover:underline",
				children: "Read the full announcement →"
			})
		]
	});
}
function pe({ a: e, preview: t, index: n }) {
	return /* @__PURE__ */ F($, {
		id: e.id,
		preview: t,
		className: "group panel panel-quiet relative block overflow-hidden p-4 pl-5 transition-colors animate-fade-up hover:border-accent",
		style: { animationDelay: `${80 + n * 60}ms` },
		children: [
			/* @__PURE__ */ P("span", {
				className: x("absolute inset-y-0 left-0 w-0.5", Y[e.tone].stripe),
				"aria-hidden": !0
			}),
			/* @__PURE__ */ F("div", {
				className: "flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-subtle",
				children: [
					/* @__PURE__ */ P("span", { children: Y[e.tone].label }),
					/* @__PURE__ */ P("span", {
						"aria-hidden": !0,
						children: "·"
					}),
					/* @__PURE__ */ P("time", {
						dateTime: e.publish_at,
						children: w(e.publish_at)
					}),
					e.unread && /* @__PURE__ */ P("span", {
						className: "ml-auto size-1.5 rotate-45 bg-success",
						"aria-label": "New"
					})
				]
			}),
			/* @__PURE__ */ P("div", {
				className: "mt-1.5 font-medium text-text group-hover:text-accent-ink",
				children: e.title
			}),
			e.body && /* @__PURE__ */ P("p", {
				className: "mt-1 line-clamp-2 text-sm text-muted",
				children: ue(e.body)
			})
		]
	});
}
function $({ id: e, preview: t, className: n, style: r, children: i }) {
	return t ? /* @__PURE__ */ P("div", {
		className: n,
		style: r,
		children: i
	}) : /* @__PURE__ */ P(k, {
		to: `${Z}#a${e}`,
		className: n,
		style: r,
		children: i
	});
}
function me({ preview: e }) {
	let { data: t, isLoading: n } = D({
		queryKey: ["announcements", "bulletin"],
		queryFn: () => b.get(`${G}/bulletin?limit=4`),
		refetchInterval: 3e5
	}), r = t?.announcements ?? [];
	if (n) return /* @__PURE__ */ P(_, { className: "h-64" });
	if (!t || r.length === 0 && !e) return null;
	let [i, ...a] = r;
	return /* @__PURE__ */ F("section", { children: [/* @__PURE__ */ F("div", {
		className: "mb-4 flex items-center gap-4",
		children: [
			/* @__PURE__ */ P("span", {
				className: "size-2 rotate-45 bg-accent",
				"aria-hidden": !0
			}),
			/* @__PURE__ */ P("h2", {
				className: "hud-label text-text",
				children: "Bulletin"
			}),
			/* @__PURE__ */ P("span", {
				className: "h-px flex-1 bg-border",
				"aria-hidden": !0
			}),
			e ? /* @__PURE__ */ P("span", {
				className: "text-xs text-subtle",
				children: "All announcements →"
			}) : /* @__PURE__ */ P(k, {
				to: Z,
				className: "text-xs text-subtle hover:text-accent-ink",
				children: t.more > 0 ? `${t.more} more announcement${t.more === 1 ? "" : "s"} →` : "All announcements →"
			})
		]
	}), i ? /* @__PURE__ */ F("div", {
		className: x("grid grid-cols-1 gap-4", a.length > 0 && "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"),
		children: [/* @__PURE__ */ P(Q, {
			a: i,
			preview: e
		}), a.length > 0 && /* @__PURE__ */ P("div", {
			className: "flex flex-col gap-3",
			children: a.map((t, n) => /* @__PURE__ */ P(pe, {
				a: t,
				preview: e,
				index: n
			}, t.id))
		})]
	}) : /* @__PURE__ */ F("div", {
		className: "flex items-center gap-3 border border-dashed border-border-strong p-6 text-sm text-muted",
		children: [/* @__PURE__ */ P(L, { className: "size-5 shrink-0 text-subtle" }), "Announcements posted to the landing page show here, the newest (or pinned) one as the lead story."]
	})] });
}
//#endregion
//#region src/index.tsx
function he() {
	let { data: e, isLoading: n } = D({
		queryKey: ["announcements", "widget"],
		queryFn: () => b.get(G),
		refetchInterval: 3e5
	});
	if (n) return /* @__PURE__ */ P(_, { className: "h-24" });
	if (!e) return null;
	let r = e.announcements.slice(0, 3);
	return r.length === 0 ? /* @__PURE__ */ P("p", {
		className: "text-sm text-subtle",
		children: "No announcements yet."
	}) : /* @__PURE__ */ F("div", {
		className: "space-y-1",
		children: [e.unread > 0 && /* @__PURE__ */ P("div", {
			className: "mb-2",
			children: /* @__PURE__ */ F(t, {
				tone: "success",
				children: [e.unread, " new"]
			})
		}), /* @__PURE__ */ P("ul", {
			className: "divide-y divide-border",
			children: r.map((e) => /* @__PURE__ */ P("li", { children: /* @__PURE__ */ F(k, {
				to: `/p/announcements#a${e.id}`,
				className: "flex items-center gap-3 py-2 hover:text-text",
				children: [
					/* @__PURE__ */ P("span", {
						className: `h-8 w-0.5 shrink-0 ${Y[e.tone].stripe}`,
						"aria-hidden": !0
					}),
					/* @__PURE__ */ F("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ P("span", {
							className: "block truncate text-sm font-medium",
							children: e.title
						}), /* @__PURE__ */ F("span", {
							className: "block truncate text-xs text-subtle",
							children: [
								e.author?.name ?? "Leadership",
								" · ",
								w(e.publish_at)
							]
						})]
					}),
					e.unread && /* @__PURE__ */ P("span", {
						className: "size-1.5 shrink-0 rotate-45 bg-success",
						"aria-label": "New"
					})
				]
			}) }, e.id))
		})]
	});
}
var ge = C({
	routes: [{
		path: "",
		Component: le
	}],
	widgets: [{
		id: "latest",
		title: "Announcements",
		Component: he,
		size: "md",
		order: 5
	}],
	landingSections: [{
		id: "bulletin",
		title: "Bulletin (latest announcements)",
		Component: me,
		placement: "top",
		order: 10
	}]
});
//#endregion
export { ge as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","absolute","accent","action","actions","alerts","align","all","already","alreadyOut","an","and","animate-fade-up","animationDelay","announcement","announcements","anything","are","aria-hidden","aria-label","aria-pressed","as","at","audience","author","autoFocus","back","background","badge","be","beside","bg-accent","bg-accent-soft","bg-bg/40","bg-border","bg-danger","bg-hover","bg-linear-to-t","bg-success","bg-warning","blank","block","blocks","body","boolean","border","border-accent/50","border-accent/60","border-border","border-border-strong","border-dashed","border-l-2","bottom-0","bounded","browser","builds","bulletin","but","button","can","canPost","can_post","center","checked","children","chosen","className","click","code","color","component","configured","confirmLabel","const","counts","covers","crafted","currentColor","cut","cx","cy","d","danger","data","dateTime","datetime-local","default","del","deleted","deleting","description","dialog","disabled","disappears","divide-border","divide-y","doctrine","doesn","don","down","edited","editing","editor","elements","else","enabled","end","ended","even","events","everyone","exists","expired","expires_at","export","eyebrow","faded","feed","few","fill","first","fleet","flex","flex-1","flex-col","flex-wrap","font-medium","font-mono","font-semibold","footer","for","from","from-surface","full","function","gap-1.5","gap-2","gap-3","gap-4","gap-6","get","ghost","go","grid","grid-cols-1","group","group-hover:text-accent-ink","groups","h-16","h-24","h-40","h-64","h-8","h-px","has","hasPings","hasn","heading","here","hint","home","hover:border-accent","hover:border-border-strong","hover:no-underline","hover:text-accent-ink","hover:text-text","hover:underline","how","href","hud-label","icon","icon-sm","icons","id","if","ignore","import","important","in","index","info","injects","inline","inline-flex","input","inset-x-0","inset-y-0","interface","is","isLoading","iso","it","italic","items","items-center","items-start","its","justify-between","k","key","label","laid","landing","landingSections","last","latest","lead","leading-relaxed","leading-snug","leading-tight","left-0","length","let","lg:grid-cols-[1fr_280px]","lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]","like","line","line-clamp-2","link","list","list-decimal","list-disc","live","loading","long","m","m3","make","many","marks","matching","max-h-64","max-w-4xl","maxLength","may","mb-1.5","mb-2","mb-4","md","means","meant","members","message","messages","min-h-[280px]","min-w-0","ml-auto","moon","more","mr-auto","ms","mt-1","mt-1.5","mt-2","mt-3","mt-4","mt-5","must","mutationFn","muted","mx-auto","n","name","never","new","newest","news","next","none","noreferrer","not","notify","null","number","of","off","older","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onDelete","onEdit","onError","onOpenChange","onPin","onSelect","onSuccess","on_landing","once","one","ones","only","opacity-70","open","options","or","order","orders","other","out","overflow-hidden","p-4","p-6","p-card","pad","page","panel","panel-quiet","part","patch","path","people","picked","pin","pings","pinned","pl-3","pl-5","pl-6","placeholder","placement","plain","plugin","pointer-events-none","portrait","post","posted","preview","primary","publish_at","put","px-1","px-2","px-3","py-0.5","py-1","py-2","qc","queryFn","queryKey","react","react-router","readers","reading","refetchInterval","refresh","rel","relative","renderer","rest","results","return","rotate-45","round","routes","rows","run","s","safe","save","saved","scheduled","scroll","scroll-mt-24","see","sees","self-center","self-start","send","sent","set","setDeleting","setEditing","setForm","setPings","setTab","setView","shares","should","show","shows","shrink-0","site","sites","size","size-1.5","size-2","size-3","size-4","size-5","slow","sm","sm:p-6","sm:p-8","sm:pl-8","sm:text-[1.7rem]","sm:text-xl","smaller","so","space-y-1","space-y-3","space-y-4","space-y-5","src","staleTime","starts","states","status","stay","stays","stories","story","straight","string","stripe","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","such","t","target","tax","text","text-2xl","text-[0.9em]","text-[11px]","text-[13px]","text-[15px]","text-accent-ink","text-base","text-lg","text-muted","text-sm","text-subtle","text-text","text-warning-fg","text-xs","the","then","there","they","this","through","time","timeAgo","title","to","to-transparent","toast","toggle","token","tone","top","tracking-[0.12em]","tracking-[0.14em]","transition-colors","truncate","type","undefined","underline","underline-offset-4","unread","until","up","updated","updated_at","uppercase","urgent","useQuery","useQueryClient","useState","used","user","v","value","variant","versions","viewBox","void","w-0.5","w-1","w-full","warning","webhook","webhooks","what","whatever","when","who","whole","widget","widgets","will","with","wouldn","write","written","x","xl","xs","yet"];
