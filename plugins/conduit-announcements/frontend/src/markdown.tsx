// A small, safe Markdown renderer: it builds React elements and never injects HTML, so whatever is written
// can't run scripts. Supports paragraphs, line breaks, # headings, - and 1. lists, > quotes, **bold**,
// *italic*, `code` and [links](https://...). Links must be https:// or a page on this site.
import { Fragment, type ReactNode } from "react";

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function safeHref(href: string): string | null {
  if (href.startsWith("https://")) return href;
  // "//host" and "/\host" are other sites to a browser.
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\")) return href;
  return null;
}

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const token = m[0];
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const k = `${key}-${n++}`;
    if (token.startsWith("**")) out.push(<strong key={k} className="font-semibold text-text">{inline(token.slice(2, -2), k)}</strong>);
    else if (token.startsWith("`")) out.push(<code key={k} className="bg-hover px-1 py-0.5 font-mono text-[0.9em]">{token.slice(1, -1)}</code>);
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
    } else out.push(<em key={k}>{inline(token.slice(1, -1), k)}</em>);
    last = at + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function lines(text: string, key: string): ReactNode[] {
  return text.split("\n").map((l, i) => (
    <Fragment key={`${key}-l${i}`}>
      {i > 0 && <br />}
      {inline(l, `${key}-l${i}`)}
    </Fragment>
  ));
}

export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={`space-y-3 text-sm leading-relaxed text-muted ${className}`}>
      {blocks.map((block, i) => {
        const key = `b${i}`;
        const heading = block.match(/^(#{1,3})\s+(.+)$/);
        if (heading && !block.includes("\n")) {
          const size = heading[1]!.length === 1 ? "text-lg" : heading[1]!.length === 2 ? "text-base" : "text-sm uppercase tracking-[0.12em]";
          return <h3 key={key} className={`font-semibold text-text ${size}`}>{inline(heading[2]!, key)}</h3>;
        }
        const rows = block.split("\n");
        if (rows.every((r) => /^\s*[-*]\s+/.test(r))) {
          return (
            <ul key={key} className="list-disc space-y-1 pl-5">
              {rows.map((r, j) => <li key={j}>{inline(r.replace(/^\s*[-*]\s+/, ""), `${key}-${j}`)}</li>)}
            </ul>
          );
        }
        if (rows.every((r) => /^\s*\d+[.)]\s+/.test(r))) {
          return (
            <ol key={key} className="list-decimal space-y-1 pl-5">
              {rows.map((r, j) => <li key={j}>{inline(r.replace(/^\s*\d+[.)]\s+/, ""), `${key}-${j}`)}</li>)}
            </ol>
          );
        }
        if (rows.every((r) => r.startsWith(">"))) {
          return (
            <blockquote key={key} className="border-l-2 border-accent/50 pl-3 italic">
              {lines(rows.map((r) => r.replace(/^>\s?/, "")).join("\n"), key)}
            </blockquote>
          );
        }
        return <p key={key}>{lines(block, key)}</p>;
      })}
    </div>
  );
}
