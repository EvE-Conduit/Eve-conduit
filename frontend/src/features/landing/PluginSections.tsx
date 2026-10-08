import { Component, type ReactNode } from "react";

import { useLoadedPlugins } from "@/lib/pluginContext";
import type { LandingSection } from "@/lib/plugins";

export interface PluginLandingSection extends LandingSection {
  /** "<plugin id>:<section id>", the key the landing page stores to hide it. */
  key: string;
  pluginName: string;
}

/** Every landing page section the enabled plugins offer, in order. */
export function usePluginLandingSections(): PluginLandingSection[] {
  const plugins = useLoadedPlugins();
  return plugins
    .flatMap((p) => (p.frontend.landingSections ?? []).map((s) => ({ ...s, key: `${p.info.id}:${s.id}`, pluginName: p.info.name })))
    .sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
}

/** A plugin's mistake shouldn't take the whole landing page down with it. */
class SectionBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("A plugin's landing page section failed", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function PluginSections({
  sections,
  hidden,
  placement,
  preview,
}: {
  sections: PluginLandingSection[];
  hidden: string[];
  placement: "top" | "bottom";
  preview: boolean;
}) {
  const shown = sections.filter((s) => (s.placement ?? "top") === placement && !hidden.includes(s.key));
  return (
    <>
      {shown.map((s) => (
        <SectionBoundary key={s.key}>
          <s.Component preview={preview} />
        </SectionBoundary>
      ))}
    </>
  );
}
