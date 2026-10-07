import { Fragment, type ReactNode } from "react";

/**
 * A small, safe Markdown renderer for release notes: headings, bullet and numbered lists, paragraphs,
 * **bold**, `code` and [links](https://...). It builds React elements (never raw HTML), and links only
 * open https:// addresses, in a new tab.
 */
export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{inline(para.join(" "))}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it)}</li>);
    blocks.push(list.ordered ? <ol key={blocks.length} className="list-decimal pl-5">{items}</ol> : <ul key={blocks.length} className="list-disc pl-5 marker:text-accent">{items}</ul>);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      const level = heading[1]!.length;
      const cls = level <= 2 ? "hud-label mt-5 text-text first:mt-0" : "mt-4 text-sm font-semibold text-text first:mt-0";
      blocks.push(<h4 key={blocks.length} className={cls}>{inline(heading[2]!)}</h4>);
    } else if (bullet || numbered) {
      flushPara();
      const ordered = !bullet;
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]!);
    } else if (list && /^\s{2,}\S/.test(raw)) {
      list.items[list.items.length - 1] += " " + line.trim(); // continuation of a list item
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return <div className={className ?? "space-y-2.5 text-sm leading-relaxed text-muted [&_li]:mt-1"}>{blocks}</div>;
}

function inline(text: string): ReactNode {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https:\/\/[^\s)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2]) out.push(<strong key={m.index} className="font-semibold text-text">{m[2]}</strong>);
    else if (m[3]) out.push(<code key={m.index} className="bg-surface-3 px-1 py-0.5 font-mono text-[12.5px] text-text">{m[3]}</code>);
    else out.push(<a key={m.index} href={m[5]} target="_blank" rel="noopener noreferrer" className="text-accent-ink underline underline-offset-2">{m[4]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}
