import { ArrowLeft, Compass } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center animate-fade-up">
      <div className="hex grid size-16 place-items-center bg-accent-soft text-accent-ink">
        <Compass className="size-7" />
      </div>
      <div className="mt-8 font-mono text-sm font-semibold tracking-widest text-subtle">404</div>
      <h1 className="hud-title mt-2 text-3xl">Lost in space</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        There's nothing at these coordinates. The page may have moved, or its plugin is switched off.
      </p>
      <div className="mt-8 flex gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft /> Go back
        </Button>
        <Link to="/">
          <Button variant="primary">Warp to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
