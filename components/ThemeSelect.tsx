import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "system" | "light" | "dark";
const valid = (value: string | null): Theme =>
  value === "light" || value === "dark" ? value : "system";
export default function ThemeSelect() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    function sync() {
      let choice: Theme = "system";
      try {
        choice = valid(localStorage.getItem("clientbrief-theme"));
      } catch {
        /* System preference still works when storage is unavailable. */
      }
      setTheme(choice);
      document.documentElement.dataset.theme =
        choice === "system" ? (media.matches ? "dark" : "light") : choice;
    }
    sync();
    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("clientbrief-theme-change", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("clientbrief-theme-change", sync);
    };
  }, []);
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <label className="theme-select" title="Choose appearance">
      <Icon size={15} aria-hidden="true" />
      <select
        aria-label="Appearance"
        value={theme}
        onChange={(event) => {
          const next = valid(event.target.value);
          setTheme(next);
          document.documentElement.dataset.theme =
            next === "system"
              ? matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
              : next;
          try {
            localStorage.setItem("clientbrief-theme", next);
            window.dispatchEvent(new Event("clientbrief-theme-change"));
          } catch {
            /* Keep the chosen appearance for this page. */
          }
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
