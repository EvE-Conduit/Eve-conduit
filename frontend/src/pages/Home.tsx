import { useQuery } from "@tanstack/react-query";
import { PencilLine } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LandingView } from "@/features/landing/LandingView";
import { useHasPerm } from "@/lib/bootstrap";
import { landingQuery } from "@/lib/landing";

import { useSsoResultToasts } from "./Characters";

/** The landing page: the first thing members see after signing in (unless the start page says otherwise). */
export function Home() {
  useSsoResultToasts();
  const canEdit = useHasPerm("site.manage_site");
  const { data } = useQuery(landingQuery);

  if (!data)
    return (
      <div className="space-y-6">
        <Skeleton className="h-[420px]" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
      </div>
    );

  return (
    <div className="relative">
      {canEdit && (
        <Link to="/admin/settings/landing" className="mb-3 flex justify-end sm:absolute sm:right-3 sm:top-3 sm:z-10 sm:mb-0">
          <Button size="sm" variant="secondary" className="bg-surface/80 backdrop-blur">
            <PencilLine /> Edit page
          </Button>
        </Link>
      )}
      <LandingView content={data.content} />
    </div>
  );
}
