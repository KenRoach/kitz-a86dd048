import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function WorryDiagram() {
  const [isVisible, setIsVisible] = useState(false);
  const [showCrescent, setShowCrescent] = useState(false);

  useEffect(() => {
    // Staggered entrance animations
    const visibleTimer = setTimeout(() => setIsVisible(true), 100);
    const crescentTimer = setTimeout(() => setShowCrescent(true), 600);
    
    return () => {
      clearTimeout(visibleTimer);
      clearTimeout(crescentTimer);
    };
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/3] select-none">
      {/* Left label */}
      <div
        className={cn(
          "absolute left-4 top-6 text-xs font-medium tracking-wider text-muted-foreground uppercase transition-all duration-700 ease-out",
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
        )}
      >
        Things that happen
      </div>

      {/* Right label */}
      <div
        className={cn(
          "absolute right-4 top-6 text-xs font-medium tracking-wider text-muted-foreground uppercase transition-all duration-700 ease-out",
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"
        )}
      >
        Things that don't
      </div>

      {/* Dotted vertical divider */}
      <div
        className={cn(
          "absolute left-1/2 top-12 bottom-8 w-px -translate-x-1/2 transition-opacity duration-1000 ease-out",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        style={{
          backgroundImage: "linear-gradient(to bottom, hsl(var(--border)) 50%, transparent 50%)",
          backgroundSize: "1px 8px",
        }}
      />

      {/* Main circle - positioned mostly on right, overlapping divider */}
      <svg
        viewBox="0 0 200 150"
        className={cn(
          "absolute inset-0 w-full h-full transition-all duration-700 ease-out",
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"
        )}
        style={{ transitionDelay: "200ms" }}
      >
        {/* Circle outline */}
        <circle
          cx="120"
          cy="85"
          r="45"
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
          className={cn(
            "transition-all duration-1000 ease-out",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          style={{
            strokeDasharray: isVisible ? "none" : "283",
            strokeDashoffset: isVisible ? "0" : "283",
          }}
        />

        {/* Crescent accent at intersection */}
        <path
          d={`
            M 100 55
            A 45 45 0 0 1 100 115
            A 35 35 0 0 0 100 55
          `}
          fill="hsl(var(--primary))"
          className={cn(
            "transition-all duration-500 ease-out",
            showCrescent ? "opacity-20" : "opacity-0"
          )}
        />

        {/* Text inside circle */}
        <text
          x="120"
          y="82"
          textAnchor="middle"
          className={cn(
            "fill-foreground text-[7px] font-medium tracking-wide uppercase transition-opacity duration-700 ease-out",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          style={{ transitionDelay: "400ms" }}
        >
          What we
        </text>
        <text
          x="120"
          y="92"
          textAnchor="middle"
          className={cn(
            "fill-foreground text-[7px] font-medium tracking-wide uppercase transition-opacity duration-700 ease-out",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          style={{ transitionDelay: "450ms" }}
        >
          worry about
        </text>
      </svg>

      {/* Subtle pulse animation on crescent */}
      <style>{`
        @keyframes gentle-pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        .crescent-pulse {
          animation: gentle-pulse 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
