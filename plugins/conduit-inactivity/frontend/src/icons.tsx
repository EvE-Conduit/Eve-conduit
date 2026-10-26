// Plugins get React and @conduit/sdk from the site but not the icon set, so the few icons used here are inline
// (same 24px stroke style as the rest of the site).
import type { ReactNode } from "react";

function Icon({ children, className = "size-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}
type P = { className?: string };

export const Moon = (p: P) => (<Icon {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Icon>);
export const Calendar = (p: P) => (<Icon {...p}><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></Icon>);
export const Check = (p: P) => (<Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>);
export const X = (p: P) => (<Icon {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>);
export const Plus = (p: P) => (<Icon {...p}><path d="M5 12h14" /><path d="M12 5v14" /></Icon>);
export const Download = (p: P) => (<Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></Icon>);
export const Refresh = (p: P) => (<Icon {...p}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></Icon>);
export const Users = (p: P) => (<Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>);
