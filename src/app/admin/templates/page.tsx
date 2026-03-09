'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, ArrowLeft, Lock, BookOpen, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Template {
  id: string
  name: string
  category: string
  description: string
  baseScenario: string
  writingStyle: string
  atmosphere: string
  pace: string
  intensity: string
}

const CATEGORIES = [
  { value: 'classic', label: '經典' },
  { value: 'campus', label: '校園' },
  { value: 'mature', label: '人妻' },
  { value: 'career', label: '職場' },
  { value: 'taboo', label: '禁忌' },
  { value: 'ntr', label: 'NTR' },
  { value: 'extreme', label: '高級' },
  { value: 'premium', label: 'Premium' }
]

const PACE_OPTIONS = [
  { value: 'slow', label: '慢節奏' },
  { value: 'medium', label: '中等節奏' },
  { value: 'fast', label: '快節奏' }
]

const INTENSITY_OPTIONS = [
  { value: 'mild', label: '溫和' },
  { value: 'moderate', label: '中等' },
  { value: 'intense', label: '激烈' }
]

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [editedTemplates, setEditedTemplates] = useState<Record<string, Partial<Template>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }
    loadTemplates()
  }, [router])

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates')
      const data = await res.json()
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (id: string, field: keyof Template, value: string) => {
    setEditedTemplates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        id,
        [field]: value
      }
    }))
    setSaveError(null)
  }

  const hasChanges = (id: string): boolean => {
    return !!editedTemplates[id]
  }

  const handleSaveAll = async () => {
    if (!password) {
      setSaveError('請輸入管理員密碼')
      return
    }

    const changedTemplates = Object.values(editedTemplates).filter(t => t.id)
    if (changedTemplates.length === 0) {
      setSaveError('沒有修改的內容')
      return
    }

    setSaving(true)
    setSaveError(null)
    
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templates: changedTemplates,
          password
        })
      })

      const data = await res.json()

      if (data.success) {
        setSaveSuccess(true)
        setEditedTemplates({})
        setTimeout(() => setSaveSuccess(false), 3000)
        loadTemplates()
      } else {
        setSaveError(data.error || '保存失敗')
      }
    } catch (error) {
      setSaveError('保存失敗，請重試')
    } finally {
      setSaving(false)
    }
  }

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  const categories = [...new Set(templates.map(t => t.category))]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <h1 className="text-xl font-bold text-white">NyxAI 模板管理</h1>
            <Badge variant="outline" className="text-slate-400">
              {templates.length} 個模板
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 text-white px-3 py-2 rounded border border-slate-700"
            >
              <option value="all">全部類別</option>
              {categories.map(cat => {
                const label = CATEGORIES.find(c => c.value === cat)?.label || cat
                return (
                  <option key={cat} value={cat}>{label} ({cat})</option>
                )
              })}
            </select>
            
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <Input
                type="password"
                placeholder="管理員密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-40 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            
            <Button
              onClick={handleSaveAll}
              disabled={saving || Object.keys(editedTemplates).length === 0}
              className={cn(
                "transition-all",
                saveSuccess ? "bg-green-600" : "bg-purple-600 hover:bg-purple-700"
              )}
            >
              {saving ? '保存中...' : saveSuccess ? <><Check className="w-4 h-4 mr-1" /> 已保存</> : <><Save className="w-4 h-4 mr-1" /> 保存修改</>}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {saveError && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            {saveError}
          </div>
        )}
        
        <div className="mb-4 text-sm text-slate-400">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          提示：點擊字段即可編輯，修改後點擊「保存修改」按鈴生效（數據存儲於 Supabase）
        </div>

        <div className="space-y-4">
          {filteredTemplates.map((template) => {
            const edited = editedTemplates[template.id] || {}
            const currentCategory = edited.category ?? template.category
            const currentPace = edited.pace ?? template.pace
            const currentIntensity = edited.intensity ?? template.intensity
            
            return (
              <Card 
                key={template.id} 
                className={cn(
                  "bg-slate-900 border-slate-800 transition-all",
                  hasChanges(template.id) && "border-purple-500/50"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="