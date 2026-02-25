"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

type Lang = "zh-TW" | "zh-CN"

const LANG_LABELS: Record<Lang, string> = {
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
}

export function LanguageSwitcher() {
  const [lang, setLang] = useState<Lang>("zh-TW")

  useEffect(() => {
    const stored = localStorage.getItem("nyx-lang") as Lang | null
    if (stored && stored in LANG_LABELS) {
      setLang(stored)
    }
  }, [])

  function selectLang(l: Lang) {
    setLang(l)
    localStorage.setItem("nyx-lang", l)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-400">介面語言</h3>
      <div className="flex gap-3">
        {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
          <Button
            key={l}
            variant={lang === l ? "default" : "outline"}
            className={
              lang === l
                ? "bg-purple-600 hover:bg-purple-700 flex-1"
                : "border-slate-700 text-slate-300 hover:bg-slate-800 flex-1"
            }
            onClick={() => selectLang(l)}
          >
            {LANG_LABELS[l]}
          </Button>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        預設：繁體中文（zh-TW）。此設定影響故事生成語言。
      </p>
    </div>
  )
}
