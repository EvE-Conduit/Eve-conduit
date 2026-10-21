// Plugins get React and @conduit/sdk from the site but not the icon set, so the few icons used here are inline
// (same 24px stroke style as the rest of the site).
import type { ReactNode } from "react";

type P = { className?: string };

function Icon({ children, className = "size-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}

export const CalendarIcon = (p: P) => (
  <Icon {...p}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </Icon>
);
export const ChevronLeft = (p: P) => (
  <Icon {...p}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);
export const ChevronRight = (p: P) => (
  <Icon {...p}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);
export const MapPin = (p: P) => (
  <Icon {...p}>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);
export const Mic = (p: P) => (
  <Icon {...p}>
    <path d="M12 19v3" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <rect x="9" y="2" width="6" height="13" rx="3" />
  </Icon>
);
export const Ban = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m4.9 4.9 14.2 14.2" />
  </Icon>
);
export const Plus = (p: P) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Icon>
);
export const Pencil = (p: P) => (
  <Icon {...p}>
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
  </Icon>
);
export const Trash = (p: P) => (
  <Icon {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Icon>
);
export const Dots = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </Icon>
);
export const Check = (p: P) => (
  <Icon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);
export const Users = (p: P) => (
  <Icon {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);
export const Settings = (p: P) => (
  <Icon {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
export const Swords = (p: P) => (
  <Icon {...p}>
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" x2="19" y1="19" y2="13" />
    <line x1="16" x2="20" y1="16" y2="20" />
    <line x1="19" x2="21" y1="21" y2="19" />
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
    <line x1="5" x2="9" y1="14" y2="18" />
    <line x1="7" x2="4" y1="17" y2="20" />
    <line x1="3" x2="5" y1="19" y2="21" />
  </Icon>
);
export const X = (p: P) => (
  <Icon {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);
export const List = (p: P) => (
  <Icon {...p}>
    <line x1="8" x2="21" y1="6" y2="6" />
    <line x1="8" x2="21" y1="12" y2="12" />
    <line x1="8" x2="21" y1="18" y2="18" />
    <line x1="3" x2="3.01" y1="6" y2="6" />
    <line x1="3" x2="3.01" y1="12" y2="12" />
    <line x1="3" x2="3.01" y1="18" y2="18" />
  </Icon>
);
export const Clock = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Icon>
);
export const Bell = (p: P) => (
  <Icon {...p}>
    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
  </Icon>
);
export const Shield = (p: P) => (
  <Icon {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </Icon>
);
export const Pickaxe = (p: P) => (
  <Icon {...p}>
    <path d="M14.531 12.469 6.619 20.38a1 1 0 1 1-3-3l7.912-7.912" />
    <path d="M15.686 4.314A12.5 12.5 0 0 0 5.461 2.958 1 1 0 0 0 5.58 4.71a22 22 0 0 1 6.318 3.393" />
    <path d="M17.7 3.7a1 1 0 0 0-1.4 0l-4.6 4.6a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4z" />
    <path d="M19.686 8.314a12.5 12.5 0 0 1 1.356 10.225 1 1 0 0 1-1.751-.119 22 22 0 0 0-3.393-6.319" />
  </Icon>
);
export const Rocket = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </Icon>
);
