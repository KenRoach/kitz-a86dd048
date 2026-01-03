import { ReactNode, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    // Only animate on route changes
    if (prevPathRef.current !== location.pathname) {
      setIsVisible(false);
      setIsLoading(true);
      
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsLoading(false), 100);
      }, 150);

      prevPathRef.current = location.pathname;
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

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
      />

      {/* Page content */}
      <div
        className={cn(
          "transition-all duration-200 ease-out",
          isVisible 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-2"
        )}
      >
        {children}
      </div>
    </div>
  );
}
