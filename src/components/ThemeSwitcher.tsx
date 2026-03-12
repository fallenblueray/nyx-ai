/* eslint-disable */
"use client"

import { useSyncExternalStore, useCallback } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

type Theme = "dark" | "light"

function applyTheme(t: Theme) {
  if (t === "dark") {
    document.documentElement.classList.add("dark")
    document.documentElement.classList.remove("light")
    document.documentElement.style.colorScheme = "dark"
  } else {
    document.documentElement.classList.remove("dark")
    document.documentElement.classList.add("light")
    document.documentElement.style.colorScheme = "light"
  }
}

function getSnapshot(): Theme {
  if (typeof window === "undefined") return "dark"
  const stored = localStorage.getItem("theme") as Theme | null
  return stored ?? "dark"
}

function getServerSnapshot(): Theme {
  return "dark"
}

function subscribe(callback: () => void) {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === "theme") callback()
  }
  window.addEventListener("storage", handleStorage)
  return () => window.removeEventListener("storage", handleStorage)
}

export function ThemeSwitcher() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Apply theme on mount and when it changes
  const toggleTheme = useCallback((t: Theme) => {
    localStorage.setItem("theme", t)
    applyTheme(t)
    // Force re-render by dispatching storage event
    window.dispatchEvent(new StorageEvent("storage", { key: "theme" }))
  }, [])

  // Apply initial theme
  if (typeof window !== "undefined") {
    applyTheme(theme)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium nyx-text-secondary">選擇主題</h3>
      <div className="flex gap-3">
        <Button
          variant={theme === "dark" ? "default" : "outline"}
          className={
            theme === "dark"
              ? "bg-purple-600 hover:bg-purple-700 flex-1"
              : "flex-1"
          }
          onClick={() => toggleTheme("dark")}
        >
          <Moon className="w-4 h-4 mr-2" />
          深色模式
        </Button>
        <Button
          variant={theme === "light" ? "default" : "outline"}
          className={
            theme === "light"
              ? "bg-purple-600 hover:bg-purple-700 flex-1"
              : "flex-1"
          }
          onClick={() => toggleTheme("light")}
        >
          <Sun className="w-4 h-4 mr-2" />
          淺色模式
        </Button>
      </div>
      <p className="text-xs nyx-text-muted">
        目前：{theme === "dark" ? "深色" : "淺色"} 模式（記憶於本機）
      </p>
    </div>
  )
}
