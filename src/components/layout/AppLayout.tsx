import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";
import { PageTransition } from "./PageTransition";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen md:h-auto w-full overflow-hidden">
        {/* Fixed header */}
        <MobileHeader />
        
        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
          <div className="w-full max-w-5xl mx-auto px-3 py-4 md:px-6 md:py-8">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
        
        {/* Fixed bottom nav */}
        <MobileNav />
      </div>
    </div>
  );
}