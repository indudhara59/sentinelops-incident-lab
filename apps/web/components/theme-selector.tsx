"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <label className="theme-control">
      <span className="sr-only">Theme</span>
      <Moon aria-hidden="true" size={15} />
      <select
        aria-label="Select color theme"
        value={theme ?? "dark"}
        onChange={(event) => setTheme(event.target.value)}
      >
        {themes.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
