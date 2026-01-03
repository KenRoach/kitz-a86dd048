import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:min-h-0 w-full overflow-x-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
          <div className="w-full max-w-5xl mx-auto px-3 py-4 md:px-6 md:py-8">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}