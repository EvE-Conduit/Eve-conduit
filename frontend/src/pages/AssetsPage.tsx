import { Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page";
import { AssetsView } from "@/features/assets/AssetsView";

export function AssetsPage() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Assets" icon={<Package />} description="Everything your characters own, by location. Search to find where you left something." />
      <AssetsView base="/api/me" multiCharacter />
    </>
  );
}
