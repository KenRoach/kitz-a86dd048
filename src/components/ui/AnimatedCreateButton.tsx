import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedCreateButtonProps {
  onClick: () => void;
  label: string;
  className?: string;
}

export function AnimatedCreateButton({ onClick, label, className }: AnimatedCreateButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={cn("relative", className)}>
      {/* Glow rings - subtle version */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="absolute w-full h-full rounded-lg bg-primary/20 animate-ping opacity-0 group-hover:opacity-100" 
          style={{ animationDuration: '2s' }} 
        />
      </div>

      {/* Main button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative group h-9 px-4 rounded-lg overflow-hidden",
          "bg-gradient-to-r from-primary to-primary/90",
          "shadow-md hover:shadow-lg",
          "transition-all duration-300 ease-out",
          "hover:scale-105 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
          "flex items-center gap-2"
        )}
        style={{
          boxShadow: isHovered 
            ? '0 0 20px hsl(var(--primary) / 0.4), 0 4px 20px hsl(var(--primary) / 0.2)'
            : '0 2px 10px hsl(var(--primary) / 0.2)'
        }}
      >
        {/* Animated background gradient */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-primary via-violet-400 to-fuchsia-500",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          )}
        />

        {/* Shine effect */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent",
            "translate-x-[-100%] group-hover:translate-x-[100%]",
            "transition-transform duration-700 ease-in-out"
          )}
        />

        {/* Icon with animation */}
        <div className="relative z-10 flex items-center justify-center">
          <Plus 
            className={cn(
              "w-4 h-4 text-primary-foreground transition-transform duration-300",
              isHovered ? "rotate-90 scale-110" : "rotate-0 scale-100"
            )}
          />
        </div>

        {/* Label */}
        <span className="relative z-10 text-sm font-medium text-primary-foreground">
          {label}
        </span>

        {/* Orbiting dot - single subtle one */}
        <div 
          className={cn(
            "absolute pointer-events-none transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div 
            className="absolute w-1.5 h-1.5 bg-white/60 rounded-full"
            style={{
              animation: 'orbit-small 2s linear infinite',
              top: '50%',
              left: '50%',
              transformOrigin: '-8px center',
            }}
          />
        </div>
      </button>

      {/* Status dot */}
      <div className="absolute -top-1 -right-1 w-3 h-3 pointer-events-none">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
      </div>

      <style>{`
        @keyframes orbit-small {
          from {
            transform: rotate(0deg) translateX(16px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(16px) rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
}
