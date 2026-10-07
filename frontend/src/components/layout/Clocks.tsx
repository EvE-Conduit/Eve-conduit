import { useEffect, useState } from "react";

import { Tooltip } from "@/components/ui/tooltip";
import { clock } from "@/lib/format";
import { currentPreferences } from "@/lib/preferences";
import { useCurrentUser } from "@/lib/bootstrap";

/** EVE time (UTC) and, when it differs, the user's local time. Ticks every 15s. */
export function Clocks() {
  const user = useCurrentUser();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  const tz = user?.preferences.timezone || currentPreferences().timezone || "UTC";
  const local = tz !== "UTC" && tz !== "Etc/UTC";
  return (
    <div className="hidden items-center gap-3 font-mono text-[13px] tabular-nums md:flex">
      <Tooltip content="EVE time (UTC)">
        <span className="flex items-center gap-1.5">
          <span className="text-subtle">EVE</span>
          <span className="text-accent-ink">{clock(now, { timeZone: "UTC" })}</span>
        </span>
      </Tooltip>
      {local && (
        <>
          <span className="text-subtle">·</span>
          <Tooltip content={`Your time (${tz.replace(/_/g, " ")})`}>
            <span className="flex items-center gap-1.5">
              <span className="text-subtle">LOCAL</span>
              <span className="text-muted">{clock(now)}</span>
            </span>
          </Tooltip>
        </>
      )}
    </div>
  );
}
