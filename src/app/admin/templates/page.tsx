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
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [editedTemplates, setEditedTemplates] = useState<Record<string, Partial<Template>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
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
  }

  const hasChanges = (id: string): boolean => {
    return !!editedTemplates[id]
  }

  const handleSaveAll = async () => {
    if (!password) {
      alert('請輸入管理員密碼')
      return
    }

    const changedTemplates = Object.values(editedTemplates).filter(t => t.id)
    if (changedTemplates.length === 0) {
      alert('沒有修改的內容')
      return
    }

    setSaving(true)
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
        alert('保存失敗：' + (data.error || '未知錯誤'))
      }
    } catch (error) {
      alert('保存失敗，請重試')
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
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
        <div className="mb-4 text-sm text-slate-400">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          提示：點擊字段即可編輯，修改後點擊「保存修改」按鈴生效
        </div>

        <div className="space-y-4">
          {filteredTemplates.map((template) => {
            const edited = editedTemplates[template.id] || {}
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
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                      <CardTitle className="text-white text-lg">
                        {edited.name ?? template.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-slate-400">
                        {template.id}
                      </Badge>
                    </div>
                    {hasChanges(template.id) && (
                      <Badge className="bg-purple-600 text-white text-xs">
                        已修改
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 模板名稱 */}
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">模板名稱</label>
                    <Input
                      value={edited.name ?? template.name}
                      onChange={(e) => handleFieldChange(template.id, 'name', e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="輸入模板名稱"
                    />
                  </div>
                  
                  {/* 描述 */}
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">描述</label>
                    <Input
                      value={edited.description ?? template.description}
                      onChange={(e) => handleFieldChange(template.id, 'description', e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="輸入簡短描述"
                    />
                  </div>
                  
                  {/* 基礎情境 */}
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">基礎情境 (baseScenario)</label>
                    <Textarea
                      value={edited.baseScenario ?? template.baseScenario}
                      onChange={(e) => handleFieldChange(template.id, 'baseScenario', e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                      placeholder="輸入基礎情境設定"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 寫作風格 */}
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">寫作風格 (writingStyle)</label>
                      <Textarea
                        value={edited.writingStyle ?? template.writingStyle}
                        onChange={(e) => handleFieldChange(template.id, 'writingStyle', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white min-h-[60px]"
                        placeholder="輸入寫作風格"
                      />
                    </div>
                    
                    {/* 氛圍 */}
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">氛圍 (atmosphere)</label>
                      <Textarea
                        value={edited.atmosphere ?? template.atmosphere}
                        onChange={(e) => handleFieldChange(template.id, 'atmosphere', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white min-h-[60px]"
                        placeholder="輸入氛圍描述"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
