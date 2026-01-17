import { useEffect } from "react";

export function useBarbershopTheme() {
  useEffect(() => {
    // Add barbershop theme class to body
    document.body.classList.add("barbershop-theme");
    
    return () => {
      document.body.classList.remove("barbershop-theme");
    };
  }, []);
}
