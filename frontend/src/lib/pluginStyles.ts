/**
 * One stylesheet for the site plus every plugin.
 *
 * Tailwind depends on rule order (e.g. `lg:hidden` must come after `flex`).
 * Two separately built stylesheets can't guarantee that, so when plugins use
 * classes the site's own CSS lacks, we compile site + plugin classes together
 * with the Tailwind compiler and append the result. Being a correctly ordered
 * superset, it wins over the earlier copies. Cached per class set.
 */
import type { LoadedPlugin } from "./plugins";

const CACHE_PREFIX = "conduit:css:";

function hash(text: string) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function inject(css: string) {
  const style = document.createElement("style");
  style.dataset.conduit = "plugin-styles";
  style.textContent = css;
  document.head.appendChild(style);
}

export async function applyPluginStyles(plugins: LoadedPlugin[]) {
  const wanted = plugins.flatMap((m) => m.classes ?? []);
  if (!wanted.length) return;

  const { default: hostClasses } = await import("virtual:conduit-host-classes");
  const host = new Set<string>(hostClasses);
  if (wanted.every((c) => host.has(c))) return;

  const all = [...new Set([...hostClasses, ...wanted])].sort();
  const key = CACHE_PREFIX + hash(all.join(" "));
  try {
    const cached = localStorage.getItem(key);
    if (cached) return inject(cached);
  } catch {
    // Storage may be unavailable (private mode); just compile.
  }

  const css = await compileUtilities(all);
  inject(css);
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
    localStorage.setItem(key, css);
  } catch {
    // Ignore quota or storage errors; the styles are already applied.
  }
}

async function compileUtilities(candidates: string[]) {
  const [{ compile }, theme, utilities, siteTheme] = await Promise.all([
    import("tailwindcss"),
    import("tailwindcss/theme.css?raw"),
    import("tailwindcss/utilities.css?raw"),
    import("../theme.css?raw"),
  ]);
  const files: Record<string, string> = {
    "tailwindcss/theme.css": theme.default,
    "tailwindcss/utilities.css": utilities.default,
    "conduit/theme.css": siteTheme.default,
  };
  const compiler = await compile(
    `@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
@import "conduit/theme.css";`,
    {
      loadStylesheet: async (id) => {
        if (!(id in files)) throw new Error(`Unknown stylesheet ${id}`);
        return { path: id, base: "/", content: files[id]! };
      },
    },
  );
  return compiler.build(candidates);
}
