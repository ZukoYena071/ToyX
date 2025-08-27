import { useState, useEffect } from "react";

export type DistanceUnit = "miles" | "kilometers";

interface UserSettings {
  distanceUnit: DistanceUnit;
}

const DEFAULT_SETTINGS: UserSettings = {
  distanceUnit: "miles",
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("toyxSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error("Failed to parse saved settings:", error);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem("toyxSettings", JSON.stringify(updatedSettings));
  };

  return {
    settings,
    updateSettings,
  };
}