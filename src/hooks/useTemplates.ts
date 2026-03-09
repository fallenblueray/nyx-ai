"use client"

import { useEffect, useState } from "react"
import type { Template } from "@/types/template"
import { officialTemplates as localTemplates } from "@/data/templates"

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>(localTemplates)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'local' | 'supabase'>('local')

  useEffect(() => {
    console.log('[useTemplates] Loading...')
    fetch('/api/templates')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          console.log(`[useTemplates] Loaded ${data.data.length} templates from ${data.source}`)
          setTemplates(data.data)
          setSource(data.source)
        }
      })
      .catch(err => console.error('[useTemplates] Error:', err))
      .finally(() => setLoading(false))
  }, [])

  return { templates, loading, source }
}
