import { useState, useEffect, useCallback } from "react";

export interface ColorScheme {
  id: string;
  name: string;
  nameEs: string;
  colors: {
    header: string;      // Primary header text
    section: string;     // Section backgrounds
    sectionAlt: string;  // Section backgrounds alt
    cta: string;         // CTA buttons
    ctaForeground: string;
    accent: string;      // Secondary accents/borders
    muted: string;       // Muted text/captions
  };
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: "myrja",
    name: "Myrja Gold",
    nameEs: "Myrja Dorado",
    colors: {
      header: "233 38% 17%",       // #1B1F3B - Dark Navy
      section: "0 0% 100%",        // #FFFFFF - White
      sectionAlt: "0 0% 96%",      // #F5F5F5 - Light Gray
      cta: "41 65% 55%",           // #D9A441 - Gold
      ctaForeground: "0 0% 100%",  // White
      accent: "16 51% 52%",        // #C36A46 - Terracotta
      muted: "0 0% 42%",           // #6B6B6B - Gray
    },
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    nameEs: "Océano Azul",
    colors: {
      header: "210 40% 20%",       // Dark Blue
      section: "0 0% 100%",        // White
      sectionAlt: "210 20% 97%",   // Light Blue
      cta: "199 89% 48%",          // Bright Blue
      ctaForeground: "0 0% 100%",  // White
      accent: "180 50% 45%",       // Teal
      muted: "210 10% 45%",        // Blue Gray
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    nameEs: "Bosque Verde",
    colors: {
      header: "150 30% 15%",       // Dark Green
      section: "0 0% 100%",        // White
      sectionAlt: "150 15% 96%",   // Light Green
      cta: "142 70% 45%",          // Emerald
      ctaForeground: "0 0% 100%",  // White
      accent: "80 50% 50%",        // Lime
      muted: "150 10% 40%",        // Green Gray
    },
  },
  {
    id: "sunset",
    name: "Sunset Coral",
    nameEs: "Atardecer Coral",
    colors: {
      header: "350 40% 20%",       // Dark Burgundy
      section: "0 0% 100%",        // White
      sectionAlt: "20 30% 97%",    // Light Peach
      cta: "15 80% 55%",           // Coral Orange
      ctaForeground: "0 0% 100%",  // White
      accent: "350 60% 55%",       // Rose
      muted: "350 10% 45%",        // Mauve Gray
    },
  },
  {
    id: "royal",
    name: "Royal Purple",
    nameEs: "Púrpura Real",
    colors: {
      header: "270 40% 18%",       // Dark Purple
      section: "0 0% 100%",        // White
      sectionAlt: "270 20% 97%",   // Light Lavender
      cta: "262 83% 58%",          // Vivid Purple
      ctaForeground: "0 0% 100%",  // White
      accent: "280 60% 55%",       // Magenta
      muted: "270 10% 45%",        // Purple Gray
    },
  },
  {
    id: "minimal",
    name: "Minimal Gray",
    nameEs: "Gris Minimalista",
    colors: {
      header: "0 0% 10%",          // Near Black
      section: "0 0% 100%",        // White
      sectionAlt: "0 0% 96%",      // Light Gray
      cta: "0 0% 15%",             // Dark Gray
      ctaForeground: "0 0% 100%",  // White
      accent: "0 0% 40%",          // Medium Gray
      muted: "0 0% 50%",           // Gray
    },
  },
];

const STORAGE_KEY = "consultant_color_scheme";

export function useConsultantTheme() {
  const [schemeId, setSchemeId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || "myrja";
    }
    return "myrja";
  });

  const currentScheme = COLOR_SCHEMES.find(s => s.id === schemeId) || COLOR_SCHEMES[0];

  const applyScheme = useCallback((scheme: ColorScheme) => {
    const root = document.documentElement;
    root.style.setProperty("--consultant-header", scheme.colors.header);
    root.style.setProperty("--consultant-section", scheme.colors.section);
    root.style.setProperty("--consultant-section-alt", scheme.colors.sectionAlt);
    root.style.setProperty("--consultant-cta", scheme.colors.cta);
    root.style.setProperty("--consultant-cta-foreground", scheme.colors.ctaForeground);
    root.style.setProperty("--consultant-accent", scheme.colors.accent);
    root.style.setProperty("--consultant-muted", scheme.colors.muted);
  }, []);

  const setScheme = useCallback((id: string) => {
    const scheme = COLOR_SCHEMES.find(s => s.id === id);
    if (scheme) {
      setSchemeId(id);
      localStorage.setItem(STORAGE_KEY, id);
      applyScheme(scheme);
    }
  }, [applyScheme]);

  // Apply scheme on mount and when it changes
  useEffect(() => {
    applyScheme(currentScheme);
  }, [currentScheme, applyScheme]);

  return {
    schemeId,
    currentScheme,
    schemes: COLOR_SCHEMES,
    setScheme,
  };
}
