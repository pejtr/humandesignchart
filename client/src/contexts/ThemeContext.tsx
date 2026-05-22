import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemePreference = "light" | "dark" | "system";

interface ThemeContextType {
  /** The resolved theme (always "light" or "dark") */
  theme: Theme;
  /** The user's preference (can be "system") */
  preference: ThemePreference;
  /** Cycle through: light → dark → system → light */
  toggleTheme?: () => void;
  /** Set a specific preference */
  setPreference?: (pref: ThemePreference) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(preference: ThemePreference): Theme {
  if (preference === "system") return getSystemTheme();
  return preference;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme-preference");
      if (stored === "light" || stored === "dark" || stored === "system") return stored;
      // Migrate from old "theme" key
      const oldStored = localStorage.getItem("theme");
      if (oldStored === "light" || oldStored === "dark") return oldStored;
    }
    return defaultTheme;
  });

  const [theme, setTheme] = useState<Theme>(() => resolveTheme(preference));

  // Listen for OS theme changes when preference is "system"
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  // Update resolved theme when preference changes
  useEffect(() => {
    setTheme(resolveTheme(preference));
  }, [preference]);

  // Apply dark class to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Persist preference
  useEffect(() => {
    if (switchable) {
      localStorage.setItem("theme-preference", preference);
      // Clean up old key
      localStorage.removeItem("theme");
    }
  }, [preference, switchable]);

  const setPreference = switchable
    ? (pref: ThemePreference) => setPreferenceState(pref)
    : undefined;

  const toggleTheme = switchable
    ? () => {
        setPreferenceState(prev => {
          if (prev === "light") return "dark";
          if (prev === "dark") return "system";
          return "light"; // system → light
        });
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, preference, toggleTheme, setPreference, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
