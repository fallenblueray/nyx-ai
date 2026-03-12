'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
  // V8.0: 角色原型配置
  characterArchetypes?: {
    female: string
    male: string
  }
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

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [edited, setEdited] = useState<Record<string, Partial<Template>>>({})
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/templates')
      .then(r => r.json())
      .then(d => { if (d.success) setTemplates(d.data) })
      .finally(() => setLoading(false))
  }, [])

  const change = (id: string, field: keyof Template, value: unknown) => {
    setEdited(prev => ({ ...prev, [id]: { ...prev[id], id, [field]: value } }))
  }

  const save = async () => {
    const list = Object.values(edited).filter((t: {id?: string}) => t.id)
    if (!list.length) return alert('無修改')
    const r = await fetch('/api/admin/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templates: list, password })
    })
    const d = await r.json()
    if (d.success) {
      alert('已保存！')
      setEdited({})
      location.reload()
    } else {
      alert('失敗: ' + d.error)
    }
  }

  if (loading) return <div className="p-10 text-white">載入中...</div>

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <h1 className="text-2xl font-bold text-white">模板管理 ({templates.length})</h1>
          <input type="password" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} className="bg-slate-800 border border-slate-700 px-3 py-1 rounded text-white" />
          <Button onClick={save} className="bg-purple-600">保存修改</Button>
        </div>
        
        {templates.map(t => {
          const e = edited[t.id] || {}
          return (
            <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-white font-bold">{e.name ?? t.name}</span>
                <span className="text-slate-500 text-sm">{t.id}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-slate-400 text-sm">分類</label>
                  <select value={e.category ?? t.category} onChange={ev => change(t.id, 'category', ev.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">節奏</label>
                  <select value={e.pace ?? t.pace} onChange={ev => change(t.id, 'pace', ev.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded">
                    <option value="slow">慢</option>
                    <option value="medium">中等</option>
                    <option value="fast">快</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">強度</label>
                  <select value={e.intensity ?? t.intensity} onChange={ev => change(t.id, 'intensity', ev.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded">
                    <option value="mild">溫和</option>
                    <option value="moderate">中等</option>
                    <option value="intense">激烈</option>
                  </select>
                </div>
              </div>
              
              <Input value={e.name ?? t.name} onChange={ev => change(t.id, 'name', ev.target.value)} className="bg-slate-800 border-slate-700 text-white mb-2" placeholder="名稱" />
              <Input value={e.description ?? t.description} onChange={ev => change(t.id, 'description', ev.target.value)} className="bg-slate-800 border-slate-700 text-white mb-2" placeholder="描述" />
              <Textarea value={e.baseScenario ?? t.baseScenario} onChange={ev => change(t.id, 'baseScenario', ev.target.value)} className="bg-slate-800 border-slate-700 text-white mb-2" placeholder="基礎情境" />
              <Textarea value={e.writingStyle ?? t.writingStyle} onChange={ev => change(t.id, 'writingStyle', ev.target.value)} className="bg-slate-800 border-slate-700 text-white mb-2" placeholder="寫作風格" />
              <Textarea value={e.atmosphere ?? t.atmosphere} onChange={ev => change(t.id, 'atmosphere', ev.target.value)} className="bg-slate-800 border-slate-700 text-white mb-2" placeholder="氛圍" />
              {/* V8.0: 角色原型配置 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-sm flex items-center gap-1 mb-1">
                    <span>女主角原型 (V8.0)</span>
                  </label>
                  <Textarea
                    value={e.characterArchetypes?.female ?? t.characterArchetypes?.female ?? ''}
                    onChange={ev => {
                      const currentArchetypes = e.characterArchetypes ?? t.characterArchetypes ?? { female: '', male: '' }
                      const updated = { ...currentArchetypes, female: ev.target.value }
                      change(t.id, 'characterArchetypes', updated as {female: string, male: string})
                    }}
                    className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                    placeholder="例如：25-30歲高冷女上司，職場權威，冰山外表..."
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-sm flex items-center gap-1 mb-1">
                    <span>男主角原型 (V8.0)</span>
                  </label>
                  <Textarea
                    value={e.characterArchetypes?.male ?? t.characterArchetypes?.male ?? ''}
                    onChange={ev => {
                      const currentArchetypes = e.characterArchetypes ?? t.characterArchetypes ?? { female: '', male: '' }
                      const updated = { ...currentArchetypes, male: ev.target.value }
                      change(t.id, 'characterArchetypes', updated as {female: string, male: string})
                    }}
                    className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                    placeholder="例如：25-30歲普通職員，能力不錯但缺乏自信..."
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
