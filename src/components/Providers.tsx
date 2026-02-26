"use client"

import { SessionProvider } from "next-auth/react"
import { useEffect, useState } from "react"

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  // inline script 已在 layout 級別處理主題初始化
  // 此處只需要確保 React 水合正常即可
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeInitializer>{children}</ThemeInitializer>
    </SessionProvider>
  )
}
