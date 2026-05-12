import { BottomNav } from "@/components/ui/BottomNav";
import { InstallPrompt } from "@/components/ui/InstallPrompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen max-w-2xl mx-auto bg-navy relative">
      <main className="pb-28">
        {children}
      </main>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
