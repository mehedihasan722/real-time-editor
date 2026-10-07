"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { z } from "zod";

const preferencesSchema = z.object({
  showGrid: z.boolean(),
  reducedMotion: z.boolean(),
  highContrastCanvas: z.boolean(),
});

export type WorkspacePreferences = z.infer<typeof preferencesSchema>;
const defaults: WorkspacePreferences = { showGrid: true, reducedMotion: false, highContrastCanvas: false };
const storageKey = "flowboard-workspace-preferences";

interface PreferencesContextValue {
  preferences: WorkspacePreferences;
  updatePreference: <Key extends keyof WorkspacePreferences>(key: Key, value: WorkspacePreferences[Key]) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export const WorkspacePreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = preferencesSchema.safeParse(JSON.parse(saved));
        if (parsed.success) setPreferences(parsed.data);
      }
    } catch {
      // Browser storage can be unavailable; preferences still work in memory.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("hide-board-grid", !preferences.showGrid);
    root.classList.toggle("reduce-motion", preferences.reducedMotion);
    root.classList.toggle("high-contrast-canvas", preferences.highContrastCanvas);
    if (hydrated) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(preferences));
      } catch {
        // Keep the current session usable when persistence is denied.
      }
    }
  }, [preferences, hydrated]);

  const updatePreference: PreferencesContextValue["updatePreference"] = (key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const resetPreferences = () => setPreferences(defaults);

  return <PreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences }}>{children}</PreferencesContext.Provider>;
};

export const useWorkspacePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("useWorkspacePreferences must be used within WorkspacePreferencesProvider");
  return context;
};
