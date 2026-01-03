import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Start exit animation and show loading
    setIsVisible(false);
    setIsLoading(true);
    
    // After exit animation, update children and start enter animation
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
      
      // Hide loading after content is visible
      setTimeout(() => setIsLoading(false), 100);
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    // Initial mount
    setIsVisible(true);
  }, []);

  return (
    <div className="relative">
      {/* Loading indicator bar */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 h-0.5 bg-primary z-[60] transition-all duration-300",
          isLoading 
            ? "opacity-100 animate-pulse" 
            : "opacity-0"
        )}
      >
        <div 
          className={cn(
            "h-full bg-primary/50 transition-all duration-500",
            isLoading ? "w-full" : "w-0"
          )}
        />
      </div>

      {/* Page content */}
      <div
        className={cn(
          "transition-all duration-200 ease-out",
          isVisible 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-2"
        )}
      >
        {displayChildren}
      </div>
    </div>
  );
}
