// A safe Markdown renderer for wiki pages: it builds React elements and never injects HTML, so whatever is written
// can't run scripts. Supports headings (with anchors for the table of contents), paragraphs, - and 1. lists (nested
// by indenting), task lists, > quotes, ``` code blocks, | tables |, --- rules, **bold**, *italic*, ~~struck~~,
// `code`, [links](https://...), ![images](https://...) and [[Page Title]] or [[Page Title|label]] links to other pages.
import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";

// Every part is bounded and stays on one line, so a crafted page can't make matching slow in readers' browsers.
const INLINE =
  /(!\[[^\]\n]{0,200}\]\([^)\s]{1,2000}\)|\[\[[^\]\n]{1,300}\]\]|\*\*[^*\n]{1,500}\*\*|\*[^*\s][^*\n]{0,500}\*|_[^_\s][^_\n]{0,500}_|~~[^~\n]{1,500}~~|`[^`\n]{1,500}`|\[[^\]\n]{1,200}\]\([^)\s]{1,2000}\))/g;

/** The same slug Django's slugify makes, so [[Page Title]] finds the page saved under that title. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[^\x00-\x7f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[-\s]+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

export function safeHref(href: string): string | null {
  if (href.startsWith("https://")) return href;
  // "//host" and "/\host" are other sites to a browser.
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\")) return href;
  if (href.startsWith("#")) return href;
  return null;
}

export interface Heading {
  level: number;
  text: string;
  id: string;
}

/** Headings outside code blocks, for the "On this page" list. Ids match the rendered anchors. */
export function headings(md: string): Heading[] {
  const out: Heading[] = [];
  const seen = new Map<string, number>();
  let inCode = false;
  for (const line of md.replace(/\r\n/g, "\n").split("\n")) {
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const m = line.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = plainInline(m[2]!);
    let id = slugify(text) || "section";
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    if (n) id = `${id}-${n + 1}`;
    out.push({ level: m[1]!.length, text, id });
  }
  return out;
}

function plainInline(text: string): string {
  return text
    .replace(/!\[([^\]\n]{0,200})\]\([^)\s]{1,2000}\)/g, "$1")
    .replace(/\[\[([^\]|\n]{1,200})(?:\|([^\]\n]{1,200}))?\]\]/g, (_, t: string, l?: string) => l ?? t)
    .replace(/\[([^\]\n]{1,200})\]\([^)\s]{1,2000}\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .trim();
}

interface Ctx {
  /** Where [[wiki links]] go: "/p/wiki" or "/public/p/wiki". */
  linkBase: string;
  ids: Map<string, number>;
}

function inline(text: string, key: string, ctx: Ctx): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const token = m[0];
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const k = `${key}-${n++}`;
    if (token.startsWith("![")) {
      const [, alt, src] = token.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/) ?? [];
      const safe = src && src.startsWith("https://") ? src : null;
      out.push(safe ? <img key={k} src={safe} alt={alt ?? ""} loading="lazy" className="my-2 max-h-[480px] max-w-full border border-border" /> : alt);
    } else if (token.startsWith("[[")) {
      const [, target, label] = token.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/) ?? [];
      const slug = target ? slugify(target.trim()) : "";
      out.push(
        slug ? (
          <Link key={k} to={`${ctx.linkBase}/${slug}`} className="text-accent-ink underline underline-offset-4 decoration-accent/40 hover:no-underline">
            {(label ?? target ?? "").trim()}
          </Link>
        ) : (
          token
        ),
      );
    } else if (token.startsWith("**")) out.push(<strong key={k} className="font-semibold text-text">{inline(token.slice(2, -2), k, ctx)}</strong>);
    else if (token.startsWith("~~")) out.push(<s key={k} className="text-subtle">{inline(token.slice(2, -2), k, ctx)}</s>);
    else if (token.startsWith("`")) out.push(<code key={k} className="bg-hover px-1 py-0.5 font-mono text-[0.9em] text-text">{token.slice(1, -1)}</code>);
    else if (token.startsWith("[")) {
      const [, label, href] = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/) ?? [];
      const safe = href ? safeHref(href) : null;
      out.push(
        safe ? (
          <a key={k} href={safe} className="text-accent-ink underline underline-offset-4 hover:no-underline" {...(safe.startsWith("https://") ? { target: "_blank", rel: "noreferrer" } : {})}>
            {label}
          </a>
        ) : (
          label
        ),
      );
    } else out.push(<em key={k}>{inline(token.slice(1, -1), k, ctx)}</em>);
    last = at + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function lines(text: string, key: string, ctx: Ctx): ReactNode[] {
  return text.split("\n").map((l, i) => (
    <Fragment key={`${key}-l${i}`}>
      {i > 0 && <br />}
      {inline(l, `${key}-l${i}`, ctx)}
    </Fragment>
  ));
}

const LIST_ITEM = /^(\s*)([-*]|\d+[.)])\s+(.*)$/;
const TASK = /^\[([ xX])\]\s+(.*)$/;

interface Item {
  text: string;
  ordered: boolean;
  children: Item[];
}

/** Turn indented list lines into a tree (two spaces, or a tab, per level). */
function listTree(rows: string[]): Item[] {
  const root: Item = { text: "", ordered: false, children: [] };
  const stack: { indent: number; item: Item }[] = [{ indent: -1, item: root }];
  for (const row of rows) {
    const m = row.match(LIST_ITEM);
    if (!m) {
      // A continuation line joins the previous item.
      const last = stack[stack.length - 1]!.item;
      last.text += `\n${row.trim()}`;
      continue;
    }
    const indent = m[1]!.replace(/\t/g, "  ").length;
    const item: Item = { text: m[3]!, ordered: /\d/.test(m[2]!), children: [] };
    while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) stack.pop();
    stack[stack.length - 1]!.item.children.push(item);
    stack.push({ indent, item });
  }
  return root.children;
}

function renderList(items: Item[], key: string, ctx: Ctx): ReactNode {
  const ordered = items[0]?.ordered;
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag key={key} className={`${ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5`}>
      {items.map((it, j) => {
        const task = it.text.match(TASK);
        return (
          <li key={j} className={task ? "list-none -ml-5 flex items-start gap-2" : undefined}>
            {task ? (
              <>
                <input type="checkbox" checked={task[1] !== " "} readOnly tabIndex={-1} className="mt-1 size-3.5 shrink-0 accent-[var(--site-accent)]" aria-label={task[1] !== " " ? "Done" : "Not done"} />
                <span>{lines(task[2]!, `${key}-${j}`, ctx)}</span>
              </>
            ) : (
              lines(it.text, `${key}-${j}`, ctx)
            )}
            {it.children.length > 0 && <div className="mt-1">{renderList(it.children, `${key}-${j}-c`, ctx)}</div>}
          </li>
        );
      })}
    </Tag>
  );
}

function cells(row: string): string[] {
  return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

function renderTable(rows: string[], key: string, ctx: Ctx): ReactNode {
  const [head, , ...body] = rows;
  const aligns = cells(rows[1]!).map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "left"));
  const align = (i: number) => (aligns[i] === "center" ? "text-center" : aligns[i] === "right" ? "text-right" : "text-left");
  return (
    <div key={key} className="overflow-x-auto border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-2">
          <tr>
            {cells(head!).map((c, i) => (
              <th key={i} className={`px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted ${align(i)}`}>{inline(c, `${key}-h${i}`, ctx)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {body.map((r, ri) => (
            <tr key={ri}>
              {cells(r).map((c, i) => (
                <td key={i} className={`px-3 py-2 align-top ${align(i)}`}>{inline(c, `${key}-r${ri}c${i}`, ctx)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const HEADING_CLASS: Record<number, string> = {
  1: "text-2xl font-semibold",
  2: "text-xl font-semibold mt-8 first:mt-0",
  3: "text-base font-semibold mt-6 first:mt-0",
  4: "text-sm font-semibold uppercase tracking-[0.12em] mt-4 first:mt-0",
};

function Blocks({ text, ctx }: { text: string; ctx: Ctx }) {
  const rows = text.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let n = 0;
  const key = () => `b${n++}`;
  while (i < rows.length) {
    const row = rows[i]!;
    if (!row.trim()) {
      i++;
      continue;
    }
    // ``` code block
    const fence = row.match(/^\s*```\s*(\w*)\s*$/);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < rows.length && !/^\s*```\s*$/.test(rows[i]!)) code.push(rows[i++]!);
      i++;
      out.push(
        <pre key={key()} className="overflow-x-auto border border-border bg-surface-2 p-3 font-mono text-[13px] leading-relaxed text-text" data-lang={fence[1] || undefined}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    // Heading
    const heading = row.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1]!.length;
      const text = plainInline(heading[2]!);
      let id = slugify(text) || "section";
      const seen = ctx.ids.get(id) ?? 0;
      ctx.ids.set(id, seen + 1);
      if (seen) id = `${id}-${seen + 1}`;
      const Tag = `h${Math.min(level + 1, 6)}` as "h2" | "h3" | "h4" | "h5";
      out.push(
        <Tag key={key()} id={id} className={`group scroll-mt-24 text-text ${HEADING_CLASS[level]}`}>
          <a href={`#${id}`} className="no-underline">{inline(heading[2]!, `h${id}`, ctx)}</a>
        </Tag>,
      );
      i++;
      continue;
    }
    // Horizontal rule
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(row)) {
      out.push(<hr key={key()} className="border-border" />);
      i++;
      continue;
    }
    // Table: a header row, a |---| row, then body rows
    if (row.trim().startsWith("|") && i + 1 < rows.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(rows[i + 1]!)) {
      const table: string[] = [row, rows[i + 1]!];
      i += 2;
      while (i < rows.length && rows[i]!.trim().startsWith("|")) table.push(rows[i++]!);
      out.push(renderTable(table, key(), ctx));
      continue;
    }
    // Quote
    if (row.startsWith(">")) {
      const quote: string[] = [];
      while (i < rows.length && rows[i]!.startsWith(">")) quote.push(rows[i++]!.replace(/^>\s?/, ""));
      out.push(
        <blockquote key={key()} className="border-l-2 border-accent/50 pl-4 text-muted">
          <Blocks text={quote.join("\n")} ctx={ctx} />
        </blockquote>,
      );
      continue;
    }
    // List (lines until a blank line; indented lines belong to it)
    if (LIST_ITEM.test(row)) {
      const list: string[] = [];
      while (i < rows.length && rows[i]!.trim() && (LIST_ITEM.test(rows[i]!) || /^\s{2,}/.test(rows[i]!))) list.push(rows[i++]!);
      out.push(renderList(listTree(list), key(), ctx));
      continue;
    }
    // Paragraph: until a blank line or something that starts another block
    const para: string[] = [];
    while (i < rows.length && rows[i]!.trim() && !/^(#{1,4}\s|\s*```|>|\s*\|)/.test(rows[i]!) && !LIST_ITEM.test(rows[i]!)) para.push(rows[i++]!);
    if (para.length === 0) {
      para.push(row);
      i++;
    }
    out.push(<p key={key()}>{lines(para.join("\n"), key(), ctx)}</p>);
  }
  return <>{out}</>;
}

export function Markdown({ text, linkBase, className = "" }: { text: string; linkBase: string; className?: string }) {
  const ctx: Ctx = { linkBase, ids: new Map() };
  return (
    <div className={`space-y-4 text-[15px] leading-relaxed text-muted [&_p]:text-muted ${className}`}>
      <Blocks text={text} ctx={ctx} />
    </div>
  );
}
