import { ReactNode, forwardRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

interface PublicLayoutProps {
  children: ReactNode;
  showNavForLoggedIn?: boolean;
}

/**
 * Layout for public pages that conditionally shows navigation for logged-in users.
 * This ensures authenticated users always have access to the app navigation.
 */
export const PublicLayout = forwardRef<HTMLDivElement, PublicLayoutProps>(
  function PublicLayout({ children, showNavForLoggedIn = true }, ref) {
    const { user, loading } = useAuth();

    // If user is logged in and we want to show nav, wrap with app-like layout
    if (showNavForLoggedIn && user && !loading) {
      return (
        <div ref={ref} className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col h-screen md:h-auto w-full overflow-hidden">
            {/* Scrollable content area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
              {children}
            </main>
            
            {/* Fixed bottom nav for mobile */}
            <MobileNav />
          </div>
        </div>
      );
    }

    // Otherwise, render children without nav (public view)
    return <div ref={ref}>{children}</div>;
  }
);
