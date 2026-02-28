"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function applyTheme(t: "dark" | "light") {
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

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    // 讀取 localStorage（key 統一為 "theme"）
    const stored = localStorage.getItem("theme") as "dark" | "light" | null
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const resolved = stored ?? (systemDark ? "dark" : "light")
    setTheme(resolved)
    applyTheme(resolved)
  }, [])

  function toggleTheme(t: "dark" | "light") {
    setTheme(t)
    localStorage.setItem("theme", t)
    applyTheme(t)
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
