import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";
import { PageTransition } from "./PageTransition";
import { BusinessAdvisor } from "@/components/advisor/BusinessAdvisor";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen md:h-auto w-full overflow-hidden">
        {/* Fixed header - part of flex layout, doesn't scroll */}
        <div className="shrink-0">
          <MobileHeader />
        </div>
        
        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="w-full max-w-5xl mx-auto px-4 py-5 md:px-6 md:py-8 pb-24 md:pb-8">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
        
        {/* Fixed bottom nav */}
        <MobileNav />
      </div>
      
      {/* AI Business Advisor floating button */}
      <BusinessAdvisor />
    </div>
  );
}