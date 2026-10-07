import { Card as e, CardBody as t, CardHeader as n, PageHeader as r, Skeleton as i, StatCard as a, api as o, definePlugin as s, timeAgo as c } from "@conduit/sdk";
import { useQuery as l } from "@tanstack/react-query";
import { Fragment as u, jsx as d, jsxs as f } from "react/jsx-runtime";
//#region src/index.tsx
function p() {
	return l({
		queryKey: ["example", "status"],
		queryFn: () => o.get("/api/p/example/status"),
		refetchInterval: 6e4
	});
}
function m() {
	let { data: e, isLoading: t, error: n } = p();
	return t ? /* @__PURE__ */ d(i, { className: "h-16" }) : n || !e ? /* @__PURE__ */ d("p", {
		className: "text-sm text-muted",
		children: "Tranquility isn't answering right now."
	}) : /* @__PURE__ */ f("div", {
		className: "flex items-end justify-between gap-6",
		children: [/* @__PURE__ */ f("div", { children: [
			/* @__PURE__ */ f("div", {
				className: "flex items-center gap-2 text-xs text-muted",
				children: [/* @__PURE__ */ f("span", {
					className: "relative flex size-2",
					children: [/* @__PURE__ */ d("span", { className: "absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" }), /* @__PURE__ */ d("span", { className: "relative inline-flex size-2 rounded-full bg-success" })]
				}), "Tranquility online"]
			}),
			/* @__PURE__ */ d("div", {
				className: "mt-2 font-mono text-3xl font-semibold tabular-nums",
				children: e.players.toLocaleString()
			}),
			/* @__PURE__ */ d("div", {
				className: "text-xs text-subtle",
				children: "capsuleers in space"
			})
		] }), /* @__PURE__ */ f("div", {
			className: "text-right text-xs text-muted",
			children: [/* @__PURE__ */ f("div", { children: ["Up since ", c(e.start_time)] }), /* @__PURE__ */ f("div", {
				className: "font-mono text-subtle",
				children: ["build ", e.server_version]
			})]
		})]
	});
}
function h() {
	let { data: i } = p();
	return /* @__PURE__ */ f(u, { children: [
		/* @__PURE__ */ d(r, {
			eyebrow: "Example plugin",
			title: "Server status",
			description: "A tiny page served by a plugin. Copy this plugin to start your own."
		}),
		/* @__PURE__ */ f("div", {
			className: "grid gap-4 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ d(a, {
					label: "Players online",
					value: i ? i.players.toLocaleString() : "…",
					mono: !0
				}),
				/* @__PURE__ */ d(a, {
					label: "Server version",
					value: i?.server_version ?? "…",
					mono: !0
				}),
				/* @__PURE__ */ d(a, {
					label: "Last restart",
					value: i ? c(i.start_time) : "…"
				})
			]
		}),
		/* @__PURE__ */ f(e, {
			className: "mt-6",
			children: [/* @__PURE__ */ d(n, {
				title: "How this page got here",
				description: "Everything below is ordinary React inside a plugin bundle."
			}), /* @__PURE__ */ f(t, {
				className: "space-y-2 text-sm text-muted",
				children: [/* @__PURE__ */ d("p", { children: "The Python side declares the plugin and an API router. The front end is built to a single ES module that the site loads at runtime." }), /* @__PURE__ */ f("p", { children: [
					"Components, data fetching and styles come from the host through ",
					/* @__PURE__ */ d("code", {
						className: "font-mono text-accent",
						children: "@conduit/sdk"
					}),
					", so plugins always match the site's look."
				] })]
			})]
		})
	] });
}
function g({ characterId: n }) {
	return /* @__PURE__ */ d(e, { children: /* @__PURE__ */ f(t, {
		className: "text-sm text-muted",
		children: [
			"Plugins can add tabs to the character sheet. This one received character ",
			/* @__PURE__ */ d("span", {
				className: "font-mono text-text",
				children: n
			}),
			"."
		]
	}) });
}
var _ = s({
	routes: [{
		path: "",
		Component: h
	}],
	widgets: [{
		id: "status",
		title: "Tranquility",
		Component: m,
		size: "sm",
		order: 10
	}],
	characterTabs: [{
		id: "example",
		label: "Example",
		Component: g,
		order: 900
	}]
});
//#endregion
export { _ as default };

export const classes = ["@conduit/sdk","@tanstack/react-query","a","absolute","add","always","an","and","animate-ping","answering","at","below","bg-success","build","built","by","can","capsuleers","character","characterId","characterTabs","className","come","const","data","declares","default","description","end","error","example","export","eyebrow","fetching","flex","font-mono","font-semibold","from","front","function","gap-2","gap-4","gap-6","get","got","grid","h-16","here","host","id","if","import","in","inline-flex","inside","interface","is","isn","items-center","items-end","justify-between","label","loads","match","module","mono","mt-2","mt-6","number","one","online","opacity-60","order","ordinary","page","path","players","plugin","plugins","queryFn","queryKey","received","refetchInterval","relative","restart","return","right","rounded-full","routes","s","served","server_version","side","since","single","site","size","size-2","size-full","sm","sm:grid-cols-3","so","space","space-y-2","start","start_time","status","styles","t","tabs","tabular-nums","text-3xl","text-accent","text-muted","text-right","text-sm","text-subtle","text-text","text-xs","that","the","this","through","timeAgo","tiny","title","to","useQuery","value","version","vip","widgets","your"];
