import { Avatar as e, Badge as t, Button as n, Card as r, ConfirmDialog as i, Dialog as a, DropdownContent as o, DropdownItem as s, DropdownMenu as c, DropdownSeparator as l, DropdownTrigger as u, EmptyState as d, Field as f, Input as p, PageHeader as m, Segmented as h, Skeleton as g, SwitchRow as _, Textarea as v, api as y, cn as b, dateTime as x, definePlugin as S, timeAgo as C, toast as w } from "@conduit/sdk";
import { useMutation as T, useQuery as E, useQueryClient as D } from "@tanstack/react-query";
import { Link as O } from "react-router";
import { Fragment as k, useEffect as A, useState as j } from "react";
import { Fragment as M, jsx as N, jsxs as P } from "react/jsx-runtime";
//#region src/icons.tsx
function F({ children: e, className: t = "size-4" }) {
	return /* @__PURE__ */ N("svg", {
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
var I = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "m3 11 18-5v12L3 14v-3z" }), /* @__PURE__ */ N("path", { d: "M11.6 16.8a3 3 0 1 1-5.8-1.6" })]
}), L = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "M12 17v5" }), /* @__PURE__ */ N("path", { d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" })]
}), R = (e) => /* @__PURE__ */ N(F, {
	...e,
	children: /* @__PURE__ */ N("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" })
}), z = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [
		/* @__PURE__ */ N("path", { d: "M3 6h18" }),
		/* @__PURE__ */ N("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
		/* @__PURE__ */ N("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
	]
}), B = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "M5 12h14" }), /* @__PURE__ */ N("path", { d: "M12 5v14" })]
}), V = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}), /* @__PURE__ */ N("path", { d: "M12 6v6l4 2" })]
}), H = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [/* @__PURE__ */ N("path", { d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }), /* @__PURE__ */ N("circle", {
		cx: "12",
		cy: "12",
		r: "3"
	})]
}), ee = (e) => /* @__PURE__ */ P(F, {
	...e,
	children: [
		/* @__PURE__ */ N("circle", {
			cx: "12",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ N("circle", {
			cx: "19",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ N("circle", {
			cx: "5",
			cy: "12",
			r: "1"
		})
	]
}), te = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
function ne(e) {
	return e.startsWith("https://") || e.startsWith("/") && !e.startsWith("//") ? e : null;
}
function U(e, t) {
	let n = [], r = 0, i = 0;
	for (let a of e.matchAll(te)) {
		let o = a[0], s = a.index ?? 0;
		s > r && n.push(e.slice(r, s));
		let c = `${t}-${i++}`;
		if (o.startsWith("**")) n.push(/* @__PURE__ */ N("strong", {
			className: "font-semibold text-text",
			children: U(o.slice(2, -2), c)
		}, c));
		else if (o.startsWith("`")) n.push(/* @__PURE__ */ N("code", {
			className: "bg-hover px-1 py-0.5 font-mono text-[0.9em]",
			children: o.slice(1, -1)
		}, c));
		else if (o.startsWith("[")) {
			let [, e, t] = o.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/) ?? [], r = t ? ne(t) : null;
			n.push(r ? /* @__PURE__ */ N("a", {
				href: r,
				className: "text-accent-ink underline underline-offset-4 hover:no-underline",
				...r.startsWith("https://") ? {
					target: "_blank",
					rel: "noreferrer"
				} : {},
				children: e
			}, c) : e);
		} else n.push(/* @__PURE__ */ N("em", { children: U(o.slice(1, -1), c) }, c));
		r = s + o.length;
	}
	return r < e.length && n.push(e.slice(r)), n;
}
function W(e, t) {
	return e.split("\n").map((e, n) => /* @__PURE__ */ P(k, { children: [n > 0 && /* @__PURE__ */ N("br", {}), U(e, `${t}-l${n}`)] }, `${t}-l${n}`));
}
function G({ text: e, className: t = "" }) {
	let n = e.replace(/\r\n/g, "\n").split(/\n{2,}/).map((e) => e.trim()).filter(Boolean);
	return /* @__PURE__ */ N("div", {
		className: `space-y-3 text-sm leading-relaxed text-muted ${t}`,
		children: n.map((e, t) => {
			let n = `b${t}`, r = e.match(/^(#{1,3})\s+(.+)$/);
			if (r && !e.includes("\n")) {
				let e = r[1].length === 1 ? "text-lg" : r[1].length === 2 ? "text-base" : "text-sm uppercase tracking-[0.12em]";
				return /* @__PURE__ */ N("h3", {
					className: `font-semibold text-text ${e}`,
					children: U(r[2], n)
				}, n);
			}
			let i = e.split("\n");
			return i.every((e) => /^\s*[-*]\s+/.test(e)) ? /* @__PURE__ */ N("ul", {
				className: "list-disc space-y-1 pl-5",
				children: i.map((e, t) => /* @__PURE__ */ N("li", { children: U(e.replace(/^\s*[-*]\s+/, ""), `${n}-${t}`) }, t))
			}, n) : i.every((e) => /^\s*\d+[.)]\s+/.test(e)) ? /* @__PURE__ */ N("ol", {
				className: "list-decimal space-y-1 pl-5",
				children: i.map((e, t) => /* @__PURE__ */ N("li", { children: U(e.replace(/^\s*\d+[.)]\s+/, ""), `${n}-${t}`) }, t))
			}, n) : i.every((e) => e.startsWith(">")) ? /* @__PURE__ */ N("blockquote", {
				className: "border-l-2 border-accent/50 pl-3 italic",
				children: W(i.map((e) => e.replace(/^>\s?/, "")).join("\n"), n)
			}, n) : /* @__PURE__ */ N("p", { children: W(e, n) }, n);
		})
	});
}
//#endregion
//#region src/types.ts
var K = "/api/p/announcements";
//#endregion
//#region src/editor.tsx
function q(e) {
	if (!e) return "";
	let t = new Date(e), n = (e) => String(e).padStart(2, "0");
	return `${t.getFullYear()}-${n(t.getMonth() + 1)}-${n(t.getDate())}T${n(t.getHours())}:${n(t.getMinutes())}`;
}
function J(e) {
	return e ? new Date(e).toISOString() : null;
}
function re({ announcement: e, onClose: t }) {
	let r = D(), { data: i } = E({
		queryKey: ["announcements", "audience"],
		queryFn: () => y.get(`${K}/audience`)
	}), [o, s] = j({
		title: e?.title ?? "",
		body: e?.body ?? "",
		tone: e?.tone ?? "info",
		pinned: e?.pinned ?? !1,
		on_landing: e?.on_landing ?? !0,
		notify: e?.notify ?? !0,
		states: e?.states?.map((e) => e.id) ?? [],
		groups: e?.groups?.map((e) => e.id) ?? [],
		publish_at: e && e.status === "scheduled" ? q(e.publish_at) : "",
		expires_at: q(e?.expires_at)
	}), [c, l] = j("write"), u = (e) => s((t) => ({
		...t,
		...e
	})), d = (e, t) => u({ [e]: o[e].includes(t) ? o[e].filter((e) => e !== t) : [...o[e], t] }), m = T({
		mutationFn: () => {
			let t = {
				...o,
				publish_at: J(o.publish_at),
				expires_at: J(o.expires_at)
			};
			return e ? y.put(`${K}/${e.id}`, t) : y.post(K, t);
		},
		onSuccess: (n) => {
			r.invalidateQueries({ queryKey: ["announcements"] }), w.success(n.status === "scheduled" ? "Scheduled" : e ? "Announcement updated" : "Announcement posted"), t();
		},
		onError: (e) => w.error(e.message)
	}), g = !!o.publish_at && new Date(o.publish_at) > /* @__PURE__ */ new Date(), b = !!e?.announced_at, x = o.states.length === 0 && o.groups.length === 0;
	return /* @__PURE__ */ N(a, {
		open: !0,
		onOpenChange: (e) => !e && t(),
		title: e ? "Edit announcement" : "New announcement",
		size: "xl",
		footer: /* @__PURE__ */ P(M, { children: [
			/* @__PURE__ */ P("span", {
				className: "mr-auto self-center text-xs text-muted",
				children: [
					x ? "Everyone" : "Only the chosen states and groups",
					" will see it",
					g ? ` from ${new Date(o.publish_at).toLocaleString()}` : "",
					"."
				]
			}),
			/* @__PURE__ */ N(n, {
				variant: "ghost",
				onClick: t,
				children: "Cancel"
			}),
			/* @__PURE__ */ N(n, {
				variant: "primary",
				disabled: !o.title.trim(),
				loading: m.isPending,
				onClick: () => m.mutate(),
				children: e ? "Save" : g ? "Schedule" : "Post"
			})
		] }),
		children: /* @__PURE__ */ P("div", {
			className: "grid gap-6 lg:grid-cols-[1fr_280px]",
			children: [/* @__PURE__ */ P("div", {
				className: "min-w-0 space-y-4",
				children: [/* @__PURE__ */ N(f, {
					label: "Title",
					required: !0,
					children: /* @__PURE__ */ N(p, {
						value: o.title,
						maxLength: 200,
						onChange: (e) => u({ title: e.target.value }),
						placeholder: "Stratop Saturday 18:00 ET",
						autoFocus: !0
					})
				}), /* @__PURE__ */ P("div", { children: [/* @__PURE__ */ P("div", {
					className: "mb-1.5 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ N("span", {
						className: "text-[13px] font-medium",
						children: "Message"
					}), /* @__PURE__ */ N(h, {
						value: c,
						onChange: l,
						size: "sm",
						options: [{
							value: "write",
							label: "Write",
							icon: /* @__PURE__ */ N(R, {})
						}, {
							value: "preview",
							label: "Preview",
							icon: /* @__PURE__ */ N(H, {})
						}]
					})]
				}), c === "write" ? /* @__PURE__ */ P(M, { children: [/* @__PURE__ */ N(v, {
					rows: 12,
					value: o.body,
					onChange: (e) => u({ body: e.target.value }),
					placeholder: "Form up in Jita at 17:45.\n\n- Doctrine: **Ferox fleet**\n- Comms: [Mumble](https://example.com)\n\nSRP covers doctrine fits.",
					className: "font-mono text-[13px]"
				}), /* @__PURE__ */ N("p", {
					className: "mt-1.5 text-xs text-subtle",
					children: "**bold**, *italic*, `code`, [link](https://…), - lists, 1. lists, # headings, > quotes. A blank line starts a new paragraph."
				})] }) : /* @__PURE__ */ N("div", {
					className: "min-h-[280px] border border-border bg-bg/40 p-4",
					children: o.body.trim() ? /* @__PURE__ */ N(G, { text: o.body }) : /* @__PURE__ */ N("p", {
						className: "text-sm text-subtle",
						children: "Nothing to preview yet."
					})
				})] })]
			}), /* @__PURE__ */ P("div", {
				className: "space-y-5",
				children: [
					/* @__PURE__ */ P("div", { children: [
						/* @__PURE__ */ N("div", {
							className: "mb-1.5 text-[13px] font-medium",
							children: "Kind"
						}),
						/* @__PURE__ */ N(h, {
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
						o.tone === "urgent" && /* @__PURE__ */ N("p", {
							className: "mt-1.5 text-xs text-warning-fg",
							children: "Urgent ones notify people even if they muted announcements."
						})
					] }),
					/* @__PURE__ */ P("div", { children: [
						/* @__PURE__ */ N("div", {
							className: "mb-1.5 text-[13px] font-medium",
							children: "Who sees it"
						}),
						/* @__PURE__ */ N("p", {
							className: "mb-2 text-xs text-muted",
							children: "Nothing picked means everyone."
						}),
						/* @__PURE__ */ N("div", {
							className: "flex flex-wrap gap-1.5",
							children: (i?.states ?? []).map((e) => /* @__PURE__ */ N(Y, {
								on: o.states.includes(e.id),
								onClick: () => d("states", e.id),
								color: e.color,
								children: e.name
							}, `s${e.id}`))
						}),
						(i?.groups.length ?? 0) > 0 && /* @__PURE__ */ N("div", {
							className: "mt-2 flex flex-wrap gap-1.5",
							children: i.groups.map((e) => /* @__PURE__ */ N(Y, {
								on: o.groups.includes(e.id),
								onClick: () => d("groups", e.id),
								children: e.name
							}, `g${e.id}`))
						})
					] }),
					/* @__PURE__ */ P("div", {
						className: "divide-y divide-border border border-border px-3",
						children: [
							/* @__PURE__ */ N(_, {
								label: "Pin to the top",
								checked: o.pinned,
								onCheckedChange: (e) => u({ pinned: e })
							}),
							/* @__PURE__ */ N(_, {
								label: "Post to the landing page",
								description: "In the Bulletin on the home page, for the people it's meant for.",
								checked: o.on_landing,
								onCheckedChange: (e) => u({ on_landing: e })
							}),
							/* @__PURE__ */ N(_, {
								label: "Notify people",
								description: b ? "Already sent; editing doesn't send it again." : "Under the bell, and through webhooks such as Discord.",
								checked: o.notify,
								disabled: b,
								onCheckedChange: (e) => u({ notify: e })
							})
						]
					}),
					/* @__PURE__ */ N(f, {
						label: "Publish at",
						hint: b ? "Already published." : "Empty: straight away.",
						children: /* @__PURE__ */ N(p, {
							type: "datetime-local",
							value: o.publish_at,
							disabled: b,
							onChange: (e) => u({ publish_at: e.target.value })
						})
					}),
					/* @__PURE__ */ N(f, {
						label: "Take down at",
						hint: "Optional. It disappears for members afterwards.",
						children: /* @__PURE__ */ N(p, {
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
function Y({ on: e, onClick: t, color: n, children: r }) {
	return /* @__PURE__ */ P("button", {
		type: "button",
		"aria-pressed": e,
		onClick: t,
		className: b("inline-flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors", e ? "border-accent/60 bg-accent-soft text-text" : "border-border text-muted hover:border-border-strong hover:text-text"),
		children: [n && /* @__PURE__ */ N("span", {
			className: "size-1.5 rotate-45",
			style: { background: n }
		}), r]
	});
}
//#endregion
//#region src/feed.tsx
var X = {
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
function ie(e = !1) {
	return E({
		queryKey: [
			"announcements",
			"feed",
			e
		],
		queryFn: () => y.get(`${K}${e ? "?all=true" : ""}`)
	});
}
function ae() {
	let e = D(), [t, a] = j("live"), { data: o, isLoading: s } = ie(t === "all"), [c, l] = j(null), [u, f] = j(null), p = () => e.invalidateQueries({ queryKey: ["announcements"] }), _ = o?.unread ?? 0;
	A(() => {
		if (!_) return;
		let t = setTimeout(() => {
			y.post(`${K}/read`, {}).then(() => e.invalidateQueries({ queryKey: ["announcements", "widget"] }), () => void 0);
		}, 1500);
		return () => clearTimeout(t);
	}, [_, e]), A(() => {
		o && window.location.hash.startsWith("#a") && document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
	}, [o]);
	let v = T({
		mutationFn: (e) => y.post(`${K}/${e.id}/pin`, { pinned: !e.pinned }),
		onSuccess: p,
		onError: (e) => w.error(e.message)
	}), b = T({
		mutationFn: (e) => y.delete(`${K}/${e}`),
		onSuccess: () => {
			p(), w.success("Announcement deleted");
		},
		onError: (e) => w.error(e.message)
	}), x = o?.announcements ?? [], S = x.filter((e) => e.pinned && e.status === "live"), C = x.filter((e) => !S.includes(e));
	return /* @__PURE__ */ P(M, { children: [
		/* @__PURE__ */ N(m, {
			eyebrow: "Corporation",
			title: "Announcements",
			icon: /* @__PURE__ */ N(I, {}),
			description: "News and orders from leadership. Pinned announcements stay on top.",
			actions: o?.can_post ? /* @__PURE__ */ P("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ N(h, {
					value: t,
					onChange: a,
					size: "sm",
					options: [{
						value: "live",
						label: "What members see"
					}, {
						value: "all",
						label: "Everything"
					}]
				}), /* @__PURE__ */ P(n, {
					variant: "primary",
					onClick: () => l("new"),
					children: [/* @__PURE__ */ N(B, {}), " New announcement"]
				})]
			}) : void 0
		}),
		s || !o ? /* @__PURE__ */ N("div", {
			className: "space-y-4",
			children: [
				0,
				1,
				2
			].map((e) => /* @__PURE__ */ N(g, { className: "h-40" }, e))
		}) : x.length === 0 ? /* @__PURE__ */ N(r, { children: /* @__PURE__ */ N(d, {
			icon: /* @__PURE__ */ N(I, {}),
			title: "No announcements yet",
			description: o.can_post ? "Post the first one: fleet schedules, rules, moon tax changes, anything members should know." : "Leadership hasn't posted anything yet. Check back later.",
			action: o.can_post ? /* @__PURE__ */ P(n, {
				variant: "primary",
				onClick: () => l("new"),
				children: [/* @__PURE__ */ N(B, {}), " New announcement"]
			}) : void 0
		}) }) : /* @__PURE__ */ P("div", {
			className: "mx-auto max-w-4xl space-y-4",
			children: [
				S.map((e) => /* @__PURE__ */ N(Z, {
					a: e,
					canPost: o.can_post,
					onEdit: () => l(e),
					onPin: () => v.mutate(e),
					onDelete: () => f(e)
				}, e.id)),
				S.length > 0 && C.length > 0 && /* @__PURE__ */ N("div", {
					className: "h-px bg-border",
					"aria-hidden": !0
				}),
				C.map((e) => /* @__PURE__ */ N(Z, {
					a: e,
					canPost: o.can_post,
					onEdit: () => l(e),
					onPin: () => v.mutate(e),
					onDelete: () => f(e)
				}, e.id))
			]
		}),
		c && /* @__PURE__ */ N(re, {
			announcement: c === "new" ? null : c,
			onClose: () => l(null)
		}),
		/* @__PURE__ */ N(i, {
			open: !!u,
			onOpenChange: (e) => !e && f(null),
			danger: !0,
			title: `Delete "${u?.title}"?`,
			description: "It disappears for everyone. Notifications already sent stay in people's lists.",
			confirmLabel: /* @__PURE__ */ P(M, { children: [/* @__PURE__ */ N(z, {}), " Delete"] }),
			onConfirm: () => u && b.mutateAsync(u.id)
		})
	] });
}
function Z({ a: i, canPost: a, onEdit: d, onPin: f, onDelete: p }) {
	let m = X[i.tone], h = [...(i.states ?? []).map((e) => e.name), ...(i.groups ?? []).map((e) => e.name)];
	return /* @__PURE__ */ P(r, {
		id: `a${i.id}`,
		className: b("relative overflow-hidden scroll-mt-24", i.status !== "live" && "opacity-70"),
		children: [/* @__PURE__ */ N("span", {
			className: b("absolute inset-y-0 left-0 w-1", m.stripe),
			"aria-hidden": !0
		}), /* @__PURE__ */ P("article", {
			className: "p-card pl-6 sm:p-6 sm:pl-8",
			children: [/* @__PURE__ */ P("header", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ P("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ P("div", {
							className: "mb-1.5 flex flex-wrap items-center gap-1.5",
							children: [
								i.pinned && /* @__PURE__ */ P(t, {
									tone: "accent",
									children: [/* @__PURE__ */ N(L, { className: "size-3" }), " Pinned"]
								}),
								i.tone !== "info" && /* @__PURE__ */ N(t, {
									tone: m.badge,
									children: m.label
								}),
								i.unread && i.status === "live" && /* @__PURE__ */ N(t, {
									tone: "success",
									children: "New"
								}),
								i.status === "scheduled" && /* @__PURE__ */ P(t, {
									tone: "info",
									children: [
										/* @__PURE__ */ N(V, { className: "size-3" }),
										" Goes out ",
										x(i.publish_at)
									]
								}),
								i.status === "expired" && /* @__PURE__ */ P(t, { children: ["Ended ", C(i.expires_at)] })
							]
						}),
						/* @__PURE__ */ N("h2", {
							className: "text-lg font-semibold leading-snug text-text sm:text-xl",
							children: i.title
						}),
						/* @__PURE__ */ P("div", {
							className: "mt-2 flex flex-wrap items-center gap-2 text-xs text-subtle",
							children: [
								i.author && /* @__PURE__ */ N(e, {
									src: i.author.portrait ?? void 0,
									name: i.author.name,
									size: "xs"
								}),
								/* @__PURE__ */ N("span", {
									className: "text-muted",
									children: i.author?.name ?? "Leadership"
								}),
								/* @__PURE__ */ N("span", { children: "·" }),
								/* @__PURE__ */ N("time", {
									dateTime: i.publish_at,
									title: x(i.publish_at),
									children: C(i.publish_at)
								}),
								i.edited && /* @__PURE__ */ N("span", {
									title: `Edited ${x(i.updated_at)}`,
									children: "· edited"
								}),
								a && /* @__PURE__ */ P("span", { children: ["· ", h.length ? `for ${h.join(", ")}` : "for everyone"] }),
								a && i.expires_at && i.status !== "expired" && /* @__PURE__ */ P("span", { children: ["· until ", x(i.expires_at)] })
							]
						})
					]
				}), a && /* @__PURE__ */ P(c, { children: [/* @__PURE__ */ N(u, {
					asChild: !0,
					children: /* @__PURE__ */ N(n, {
						variant: "ghost",
						size: "icon-sm",
						"aria-label": `Options for ${i.title}`,
						children: /* @__PURE__ */ N(ee, {})
					})
				}), /* @__PURE__ */ P(o, {
					align: "end",
					children: [
						/* @__PURE__ */ P(s, {
							onSelect: d,
							children: [/* @__PURE__ */ N(R, {}), " Edit"]
						}),
						/* @__PURE__ */ P(s, {
							onSelect: f,
							children: [
								/* @__PURE__ */ N(L, {}),
								" ",
								i.pinned ? "Unpin" : "Pin to the top"
							]
						}),
						/* @__PURE__ */ N(l, {}),
						/* @__PURE__ */ P(s, {
							danger: !0,
							onSelect: p,
							children: [/* @__PURE__ */ N(z, {}), " Delete"]
						})
					]
				})] })]
			}), i.body && /* @__PURE__ */ N(G, {
				text: i.body,
				className: "mt-4"
			})]
		})]
	});
}
//#endregion
//#region src/bulletin.tsx
var Q = "/p/announcements";
function oe(e, t = 180) {
	let n = e.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/^\s*(#{1,3}|[-*]|\d+\.|>)\s+/gm, "").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
	return n.length > t ? `${n.slice(0, t).trimEnd()}…` : n;
}
function se({ a: t }) {
	return /* @__PURE__ */ P("div", {
		className: "flex items-center gap-2 text-xs text-subtle",
		children: [
			t.author && /* @__PURE__ */ N(e, {
				src: t.author.portrait ?? void 0,
				name: t.author.name,
				size: "xs"
			}),
			/* @__PURE__ */ N("span", { children: t.author?.name ?? "Leadership" }),
			/* @__PURE__ */ N("span", {
				"aria-hidden": !0,
				children: "·"
			}),
			/* @__PURE__ */ N("time", {
				dateTime: t.publish_at,
				title: x(t.publish_at),
				children: C(t.publish_at)
			})
		]
	});
}
function ce({ a: e }) {
	return /* @__PURE__ */ P("div", {
		className: "flex flex-wrap items-center gap-1.5",
		children: [
			/* @__PURE__ */ N(t, {
				tone: X[e.tone].badge,
				children: X[e.tone].label
			}),
			e.pinned && /* @__PURE__ */ P(t, { children: [/* @__PURE__ */ N(L, { className: "size-3" }), " Pinned"] }),
			e.unread && /* @__PURE__ */ N(t, {
				tone: "success",
				children: "New"
			})
		]
	});
}
function le({ a: e, preview: t }) {
	let n = e.body.length > 700 || e.body.split("\n").length > 12;
	return /* @__PURE__ */ P("article", {
		className: "panel relative flex flex-col overflow-hidden p-6 animate-fade-up sm:p-8",
		children: [
			/* @__PURE__ */ N("span", {
				className: b("absolute inset-y-0 left-0 w-1", X[e.tone].stripe),
				"aria-hidden": !0
			}),
			/* @__PURE__ */ N(ce, { a: e }),
			/* @__PURE__ */ N("h3", {
				className: "mt-4 text-2xl font-semibold leading-tight text-text sm:text-[1.7rem]",
				children: e.title
			}),
			/* @__PURE__ */ N("div", {
				className: "mt-3",
				children: /* @__PURE__ */ N(se, { a: e })
			}),
			e.body && /* @__PURE__ */ P("div", {
				className: b("relative mt-5", n && "max-h-64 overflow-hidden"),
				children: [/* @__PURE__ */ N(G, {
					text: e.body,
					className: "text-[15px]"
				}), n && /* @__PURE__ */ N("div", {
					className: "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-surface to-transparent",
					"aria-hidden": !0
				})]
			}),
			/* @__PURE__ */ N($, {
				id: e.id,
				preview: t,
				className: "mt-5 self-start text-sm font-medium text-accent-ink hover:underline",
				children: "Read the full announcement →"
			})
		]
	});
}
function ue({ a: e, preview: t, index: n }) {
	return /* @__PURE__ */ P($, {
		id: e.id,
		preview: t,
		className: "group panel panel-quiet relative block overflow-hidden p-4 pl-5 transition-colors animate-fade-up hover:border-accent",
		style: { animationDelay: `${80 + n * 60}ms` },
		children: [
			/* @__PURE__ */ N("span", {
				className: b("absolute inset-y-0 left-0 w-0.5", X[e.tone].stripe),
				"aria-hidden": !0
			}),
			/* @__PURE__ */ P("div", {
				className: "flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-subtle",
				children: [
					/* @__PURE__ */ N("span", { children: X[e.tone].label }),
					/* @__PURE__ */ N("span", {
						"aria-hidden": !0,
						children: "·"
					}),
					/* @__PURE__ */ N("time", {
						dateTime: e.publish_at,
						children: C(e.publish_at)
					}),
					e.unread && /* @__PURE__ */ N("span", {
						className: "ml-auto size-1.5 rotate-45 bg-success",
						"aria-label": "New"
					})
				]
			}),
			/* @__PURE__ */ N("div", {
				className: "mt-1.5 font-medium text-text group-hover:text-accent-ink",
				children: e.title
			}),
			e.body && /* @__PURE__ */ N("p", {
				className: "mt-1 line-clamp-2 text-sm text-muted",
				children: oe(e.body)
			})
		]
	});
}
function $({ id: e, preview: t, className: n, style: r, children: i }) {
	return t ? /* @__PURE__ */ N("div", {
		className: n,
		style: r,
		children: i
	}) : /* @__PURE__ */ N(O, {
		to: `${Q}#a${e}`,
		className: n,
		style: r,
		children: i
	});
}
function de({ preview: e }) {
	let { data: t, isLoading: n } = E({
		queryKey: ["announcements", "bulletin"],
		queryFn: () => y.get(`${K}/bulletin?limit=4`),
		refetchInterval: 3e5
	}), r = t?.announcements ?? [];
	if (n) return /* @__PURE__ */ N(g, { className: "h-64" });
	if (!t || r.length === 0 && !e) return null;
	let [i, ...a] = r;
	return /* @__PURE__ */ P("section", { children: [/* @__PURE__ */ P("div", {
		className: "mb-4 flex items-center gap-4",
		children: [
			/* @__PURE__ */ N("span", {
				className: "size-2 rotate-45 bg-accent",
				"aria-hidden": !0
			}),
			/* @__PURE__ */ N("h2", {
				className: "hud-label text-text",
				children: "Bulletin"
			}),
			/* @__PURE__ */ N("span", {
				className: "h-px flex-1 bg-border",
				"aria-hidden": !0
			}),
			e ? /* @__PURE__ */ N("span", {
				className: "text-xs text-subtle",
				children: "All announcements →"
			}) : /* @__PURE__ */ N(O, {
				to: Q,
				className: "text-xs text-subtle hover:text-accent-ink",
				children: t.more > 0 ? `${t.more} more announcement${t.more === 1 ? "" : "s"} →` : "All announcements →"
			})
		]
	}), i ? /* @__PURE__ */ P("div", {
		className: b("grid grid-cols-1 gap-4", a.length > 0 && "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"),
		children: [/* @__PURE__ */ N(le, {
			a: i,
			preview: e
		}), a.length > 0 && /* @__PURE__ */ N("div", {
			className: "flex flex-col gap-3",
			children: a.map((t, n) => /* @__PURE__ */ N(ue, {
				a: t,
				preview: e,
				index: n
			}, t.id))
		})]
	}) : /* @__PURE__ */ P("div", {
		className: "flex items-center gap-3 border border-dashed border-border-strong p-6 text-sm text-muted",
		children: [/* @__PURE__ */ N(I, { className: "size-5 shrink-0 text-subtle" }), "Announcements posted to the landing page show here, the newest (or pinned) one as the lead story."]
	})] });
}
//#endregion
//#region src/index.tsx
function fe() {
	let { data: e, isLoading: n } = E({
		queryKey: ["announcements", "widget"],
		queryFn: () => y.get(K),
		refetchInterval: 3e5
	});
	if (n) return /* @__PURE__ */ N(g, { className: "h-24" });
	if (!e) return null;
	let r = e.announcements.slice(0, 3);
	return r.length === 0 ? /* @__PURE__ */ N("p", {
		className: "text-sm text-subtle",
		children: "No announcements yet."
	}) : /* @__PURE__ */ P("div", {
		className: "space-y-1",
		children: [e.unread > 0 && /* @__PURE__ */ N("div", {
			className: "mb-2",
			children: /* @__PURE__ */ P(t, {
				tone: "success",
				children: [e.unread, " new"]
			})
		}), /* @__PURE__ */ N("ul", {
			className: "divide-y divide-border",
			children: r.map((e) => /* @__PURE__ */ N("li", { children: /* @__PURE__ */ P(O, {
				to: `/p/announcements#a${e.id}`,
				className: "flex items-center gap-3 py-2 hover:text-text",
				children: [
					/* @__PURE__ */ N("span", {
						className: `h-8 w-0.5 shrink-0 ${X[e.tone].stripe}`,
						"aria-hidden": !0
					}),
					/* @__PURE__ */ P("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ N("span", {
							className: "block truncate text-sm font-medium",
							children: e.title
						}), /* @__PURE__ */ P("span", {
							className: "block truncate text-xs text-subtle",
							children: [
								e.author?.name ?? "Leadership",
								" · ",
								C(e.publish_at)
							]
						})]
					}),
					e.unread && /* @__PURE__ */ N("span", {
						className: "size-1.5 shrink-0 rotate-45 bg-success",
						"aria-label": "New"
					})
				]
			}) }, e.id))
		})]
	});
}
var pe = S({
	routes: [{
		path: "",
		Component: ae
	}],
	widgets: [{
		id: "latest",
		title: "Announcements",
		Component: fe,
		size: "md",
		order: 5
	}],
	landingSections: [{
		id: "bulletin",
		title: "Bulletin (latest announcements)",
		Component: de,
		placement: "top",
		order: 10
	}]
});
//#endregion
export { pe as default };

export const classes = ["!data","!o","@conduit/sdk","@tanstack/react-query","a","absolute","accent","action","actions","align","all","already","alreadyOut","an","and","animate-fade-up","animationDelay","announcement","announcements","anything","are","aria-hidden","aria-label","aria-pressed","as","at","audience","author","autoFocus","back","background","badge","be","beside","bg-accent","bg-accent-soft","bg-bg/40","bg-border","bg-danger","bg-hover","bg-linear-to-t","bg-success","bg-warning","blank","block","blocks","body","boolean","border","border-accent/50","border-accent/60","border-border","border-border-strong","border-dashed","border-l-2","bottom-0","browser","builds","bulletin","but","button","can","canPost","can_post","center","checked","children","chosen","className","click","code","color","confirmLabel","const","counts","covers","currentColor","cut","cx","cy","d","danger","data","dateTime","datetime-local","default","del","deleted","deleting","description","disabled","disappears","divide-border","divide-y","doctrine","doesn","don","down","edited","editing","editor","elements","else","end","ended","even","everyone","expired","expires_at","export","eyebrow","faded","feed","few","fill","first","fleet","flex","flex-1","flex-col","flex-wrap","font-medium","font-mono","font-semibold","footer","for","from","from-surface","full","function","gap-1.5","gap-2","gap-3","gap-4","gap-6","get","ghost","go","grid","grid-cols-1","group","group-hover:text-accent-ink","groups","h-16","h-24","h-40","h-64","h-8","h-px","hasn","heading","here","hint","home","hover:border-accent","hover:border-border-strong","hover:no-underline","hover:text-accent-ink","hover:text-text","hover:underline","how","href","hud-label","icon","icon-sm","icons","id","if","ignore","import","important","in","index","info","injects","inline","inline-flex","input","inset-x-0","inset-y-0","interface","is","isLoading","iso","it","italic","items","items-center","items-start","its","justify-between","k","key","label","laid","landing","landingSections","last","latest","lead","leading-relaxed","leading-snug","leading-tight","left-0","length","let","lg:grid-cols-[1fr_280px]","lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]","like","line","line-clamp-2","link","list","list-decimal","list-disc","live","loading","long","m","m3","many","marks","max-h-64","max-w-4xl","maxLength","mb-1.5","mb-2","mb-4","md","means","meant","members","message","messages","min-h-[280px]","min-w-0","ml-auto","moon","more","mr-auto","ms","mt-1","mt-1.5","mt-2","mt-3","mt-4","mt-5","must","mutationFn","muted","mx-auto","n","name","never","new","newest","news","next","none","noreferrer","not","notify","null","number","of","off","older","on","onChange","onCheckedChange","onClick","onClose","onConfirm","onDelete","onEdit","onError","onOpenChange","onPin","onSelect","onSuccess","on_landing","once","one","ones","opacity-70","open","options","or","order","orders","out","overflow-hidden","p-4","p-6","p-card","pad","page","panel","panel-quiet","patch","path","people","picked","pin","pinned","pl-3","pl-5","pl-6","placeholder","placement","plain","pointer-events-none","portrait","post","posted","preview","primary","publish_at","put","px-1","px-2","px-3","py-0.5","py-1","py-2","qc","queryFn","queryKey","react","react-router","reading","refetchInterval","refresh","rel","relative","renderer","rest","results","return","rotate-45","round","routes","rows","run","s","safe","save","scheduled","scroll","scroll-mt-24","see","sees","self-center","self-start","send","sent","set","setDeleting","setEditing","setForm","setTab","setView","should","show","shrink-0","site","size","size-1.5","size-2","size-3","size-4","size-5","sm","sm:p-6","sm:p-8","sm:pl-8","sm:text-[1.7rem]","sm:text-xl","smaller","so","space-y-1","space-y-3","space-y-4","space-y-5","src","starts","states","status","stay","stories","story","straight","string","stripe","stroke","strokeLinecap","strokeLinejoin","strokeWidth","style","success","such","t","target","tax","text","text-2xl","text-[0.9em]","text-[11px]","text-[13px]","text-[15px]","text-accent-ink","text-base","text-lg","text-muted","text-sm","text-subtle","text-text","text-warning-fg","text-xs","the","then","there","they","this","through","time","timeAgo","title","to","to-transparent","toast","toggle","token","tone","top","tracking-[0.12em]","tracking-[0.14em]","transition-colors","truncate","type","undefined","underline","underline-offset-4","unread","until","up","updated","updated_at","uppercase","urgent","useQuery","useQueryClient","useState","used","v","value","variant","versions","viewBox","void","w-0.5","w-1","w-full","warning","webhooks","what","whatever","who","whole","widget","widgets","will","with","write","written","x","xl","xs","yet"];
