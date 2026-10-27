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

export const Globe = (p: P) => (<Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></Icon>);
export const Users = (p: P) => (<Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>);
export const Clock = (p: P) => (<Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Icon>);
export const Factory = (p: P) => (<Icon {...p}><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M17 18h1" /><path d="M12 18h1" /><path d="M7 18h1" /></Icon>);
export const Bell = (p: P) => (<Icon {...p}><path d="M10.27 21a2 2 0 0 0 3.46 0" /><path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33" /></Icon>);
export const Moon = (p: P) => (<Icon {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Icon>);
export const Alert = (p: P) => (<Icon {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></Icon>);
