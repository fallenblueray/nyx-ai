"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

function applyTheme(t: "dark" | "light") {
  if (t === "light") {
    document.documentElement.classList.remove("dark")
    document.documentElement.classList.add("light")
  } else {
    document.documentElement.classList.remove("light")
    document.documentElement.classList.add("dark")
  }
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const stored = localStorage.getItem("nyx-theme") as "dark" | "light" | null
    if (stored) {
      setTheme(stored)
      applyTheme(stored)
    }
  }, [])

  function toggleTheme(t: "dark" | "light") {
    setTheme(t)
    localStorage.setItem("nyx-theme", t)
    applyTheme(t)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-400">選擇主題</h3>
      <div className="flex gap-3">
        <Button
          variant={theme === "dark" ? "default" : "outline"}
          className={
            theme === "dark"
              ? "bg-purple-600 hover:bg-purple-700 flex-1"
              : "border-slate-700 text-slate-300 hover:bg-slate-800 flex-1"
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
              : "border-slate-700 text-slate-300 hover:bg-slate-800 flex-1"
          }
          onClick={() => toggleTheme("light")}
        >
          <Sun className="w-4 h-4 mr-2" />
          淺色模式
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        目前：{theme === "dark" ? "深色" : "淺色"} 模式（記憶於本機）
      </p>
    </div>
  )
}
