import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemePref = "system" | "light" | "dark";
export type ActiveTheme = "light" | "dark";

interface ThemeContextType {
  theme: ThemePref;
  activeTheme: ActiveTheme;
  setTheme: (t: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  activeTheme: "light",
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePref>(() => {
    try {
      const saved = localStorage.getItem("sa_theme");
      if (saved === "light" || saved === "dark" || saved === "system") return saved;
    } catch {}
    return "system";
  });

  const [systemDark, setSystemDark] = useState(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const activeTheme: ActiveTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    if (activeTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [activeTheme]);

  const setTheme = (newTheme: ThemePref) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("sa_theme", newTheme);
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, activeTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
