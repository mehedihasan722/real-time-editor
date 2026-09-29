"use client";

import { useEffect, useState } from "react";
import { Check, Contrast, Grid3X3, Laptop, Moon, RotateCcw, Sun, Waves } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useWorkspacePreferences } from "@/providers/workspace-preferences-provider";

const themes = [
  { value: "light", label: "Light", description: "Bright workspace surfaces", icon: Sun },
  { value: "dark", label: "Dark", description: "Low-light collaboration", icon: Moon },
  { value: "system", label: "System", description: "Follow this device", icon: Laptop },
] as const;

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreference, resetPreferences } = useWorkspacePreferences();
  useEffect(() => setMounted(true), []);

  const preferenceOptions = [
    { key: "showGrid" as const, label: "Canvas grid", description: "Show the alignment grid behind board content.", icon: Grid3X3 },
    { key: "highContrastCanvas" as const, label: "High-contrast canvas", description: "Increase grid and workspace separation.", icon: Contrast },
    { key: "reducedMotion" as const, label: "Reduce motion", description: "Limit loaders, panels, and transition animation.", icon: Waves },
  ];

  return (
    <div className="settings-page px-6 pb-12 max-w-[1080px]">
      <p className="text-xs uppercase tracking-[.2em] font-bold text-indigo-500">Workspace preferences</p>
      <h1 className="mt-1 text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Personalize Flowboard on this browser. Preferences are validated and stored locally.</p>

      <section className="settings-panel mt-8">
        <div><h2>Appearance</h2><p>Choose how Flowboard looks across dashboards and boards.</p></div>
        <div className="settings-theme-grid">
          {themes.map(({ value, label, description, icon: Icon }) => (
            <button key={value} onClick={() => setTheme(value)} className={mounted && theme === value ? "is-active" : ""}>
              <span><Icon className="size-5" /></span><strong>{label}</strong><small>{description}</small>{mounted && theme === value && <Check className="settings-check size-4" />}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-panel mt-5">
        <div><h2>Canvas</h2><p>Control board visibility and motion preferences.</p></div>
        <div className="settings-options">
          {preferenceOptions.map(({ key, label, description, icon: Icon }) => (
            <button key={key} onClick={() => updatePreference(key, !preferences[key])} aria-pressed={preferences[key]}>
              <span><Icon className="size-5" /></span><span><strong>{label}</strong><small>{description}</small></span><i className={preferences[key] ? "is-on" : ""}><b /></i>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-5 flex justify-end"><Button variant="outline" onClick={resetPreferences}><RotateCcw className="mr-2 size-4" />Reset canvas preferences</Button></div>
    </div>
  );
}
