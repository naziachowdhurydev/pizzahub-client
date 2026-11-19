"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("pizzahub-theme");
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    window.localStorage.setItem("pizzahub-theme", isDark ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Toggle color theme"
      className="grid h-10 w-10 place-items-center rounded-xl text-foreground transition hover:bg-accent hover:text-accent-foreground"
    >
      <Moon size={19} className="block dark:hidden" aria-hidden="true" />
      <Sun size={19} className="hidden dark:block" aria-hidden="true" />
    </button>
  );
}
