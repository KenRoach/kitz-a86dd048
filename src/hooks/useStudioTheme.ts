import { useEffect } from "react";

export function useStudioTheme() {
  useEffect(() => {
    // Apply studio CEO theme CSS variables
    const root = document.documentElement;
    root.style.setProperty("--studio-header", "240 20% 12%");       // Deep navy/black
    root.style.setProperty("--studio-section", "0 0% 100%");        // White
    root.style.setProperty("--studio-section-alt", "240 10% 97%");  // Light slate
    root.style.setProperty("--studio-cta", "262 83% 58%");          // Creative purple
    root.style.setProperty("--studio-cta-foreground", "0 0% 100%"); // White
    root.style.setProperty("--studio-accent", "172 66% 50%");       // Cyan/teal
    root.style.setProperty("--studio-muted", "240 5% 46%");         // Slate gray
    
    document.body.classList.add("studio-theme");
    
    return () => {
      document.body.classList.remove("studio-theme");
    };
  }, []);
}
