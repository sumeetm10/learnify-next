"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

// Subscribe to nothing — used only to detect client-side mount
const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Avoid hydration mismatch — false during SSR/hydration, true after mount
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted) {
    // Return a placeholder with same size to prevent layout shift
    return <div className="w-8 h-8 rounded-full" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={15} className="text-yellow-300" />
      ) : (
        <Moon size={15} className="text-white" />
      )}
    </button>
  );
}
