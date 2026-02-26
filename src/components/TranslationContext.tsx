"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import zhTW from '@/locales/zh-TW.json'
import zhCN from '@/locales/zh-CN.json'

type Translations = {
  [key: string]: any
}

type Language = 'zh-TW' | 'zh-CN'

const translationsMap: Record<Language, Translations> = {
  'zh-TW': zhTW as Translations,
  'zh-CN': zhCN as Translations,
}

const defaultTranslations: Translations = (zhTW as Translations).app ? (zhTW as Translations) : {
  app: {
    tagline: "無審查 · 自由創作",
    history: "歷史",
    save: "儲存",
    share: "分享",
    new: "新建",
    settings: "設定",
    untitled: "無標題",
    storyStart: "劇情起點",
    inputPlaceholder: "輸入你的劇情起點或靈感...",
    saveDraft: "儲存草稿",
    draftSaved: "草稿已儲存！",
    saving: "儲存中...",
    copied: "已複製!"
  }
}

const TranslationContext = createContext<Translations>(defaultTranslations)

export function useTranslation() {
  return useContext(TranslationContext)
}

export function TranslationProvider({ 
  children, 
  translations 
}: { 
  children: React.ReactNode
  translations?: Translations 
}) {
  const [t, setT] = useState<Translations>(defaultTranslations)

  // 從 localStorage 讀取語言設置
  const loadLanguage = useCallback(() => {
    try {
      const saved = localStorage.getItem('language') as Language | null
      if (saved && translationsMap[saved]) {
        return translationsMap[saved]
      }
    } catch (e) {
      console.error('[Translation] Error reading localStorage:', e)
    }
    return translations || defaultTranslations
  }, [translations])

  useEffect(() => {
    // 初始加載
    setT(loadLanguage())

    // 監聽 localStorage 變化
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'language' && e.newValue) {
        const newLang = e.newValue as Language
        if (translationsMap[newLang]) {
          console.log('[Translation] Language changed to:', newLang)
          setT(translationsMap[newLang])
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [loadLanguage])

  return (
    <TranslationContext.Provider value={t}>
      {children}
    </TranslationContext.Provider>
  )
}
