"use client"

import { SessionProvider } from "next-auth/react"
import { useEffect, useState } from "react"

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 初始化主題
    const saved = localStorage.getItem("theme") as "light" | "dark" | null
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    const initial = saved || systemPreference

    const html = document.documentElement
    if (initial === "dark") {
      html.classList.add("dark")
    } else {
      html.classList.remove("dark")
    }

    setMounted(true)
  }, [])

  // 避免 hydration mismatch
  if (!mounted) return null

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeInitializer>{children}</ThemeInitializer>
    </SessionProvider>
  )
}
