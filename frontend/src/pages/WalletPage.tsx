import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/page";
import { WalletView } from "@/features/wallet/WalletView";

export function WalletPage() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Wallet" icon={<Wallet />} description="ISK across all your characters, with the last 30 days of activity." />
      <WalletView base="/api/me" multiCharacter />
    </>
  );
}
