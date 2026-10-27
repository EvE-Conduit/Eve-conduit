import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page";
import { useHasPerm } from "@/lib/bootstrap";

/**
 * Shows the page only to people with the permission, so someone typing an /admin address sees why it's empty
 * instead of a page full of failed calls. The server checks every call anyway; this is only the friendly face.
 */
export function RequirePerm({ perm, children }: { perm: string | undefined; children: ReactNode }) {
  if (useHasPerm(perm)) return <>{children}</>;
  return (
    <EmptyState
      icon={<ShieldAlert />}
      title="You don't have access to this page"
      description="Ask an administrator for the right permission."
      action={
        <Link to="/">
          <Button>Back to the dashboard</Button>
        </Link>
      }
    />
  );
}
