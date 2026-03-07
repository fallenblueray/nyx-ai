'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Save, ArrowLeft, Lock, FileText, Users, BookOpen, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Prompt {
  id: string
  key: string
  name: string
  description: string
  content: string
  version: number
  updated_at: string
}

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({})
  const [password, setPassword] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const router = useRouter()

  // 檢查登入狀態
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }
    loadPrompts()
  }, [router])

  const loadPrompts = async () => {
    try {
      const res = await fetch('/api/admin/prompts')
      const data = await res.json()
      if (data.success) {
        setPrompts(data.data)
        // 初始化編輯內容
        const initialContent: Record<string, string> = {}
        data.data.forEach((p: Prompt) => {
          initialContent[p.key] = p.content
        })
        setEditedContent(initialContent)
      }
    } catch (error) {
      console.error('Failed to load prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string) => {
    if (!password) {
      setPendingKey(key)
      setShowPasswordModal(true)
      return
    }

    setSaving(prev => ({ ...prev, [key]: true }))

    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          content: editedContent[key],
          password
        })
      })

      const data = await res.json()

      if (data.success) {
        setSaveSuccess(prev => ({ ...prev, [key]: true }))
        setTimeout(() => {
          setSaveSuccess(prev => ({ ...prev, [key]: false }))
        }, 3000)
        // 刷新數據
        loadPrompts()
      } else {
        alert('保存失敗：' + data.error)
      }
    } catch (error) {
      alert('保存失敗，請重試')
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }))
    }
  }

  const handlePasswordSubmit = () => {
    setShowPasswordModal(false)
    if (pendingKey) {
      handleSave(pendingKey)
      setPendingKey(null)
    }
  }

  const getPromptIcon = (key: string) => {
    switch (key) {
      case 'character': return <Users className="w-5 h-5" />
      case 'outline': return <FileText className="w-5 h-5" />
      case 'story': return <BookOpen className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

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
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
            <h1 className="text-xl font-bold text-white">NyxAI 提示詞管理</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Lock className="w-4 h-4" />
            <span>管理員模式</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="character" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            {prompts.map(prompt => (
              <TabsTrigger
                key={prompt.key}
                value={prompt.key}
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <span className="flex items-center gap-2">
                  {getPromptIcon(prompt.key)}
                  {prompt.name}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {prompts.map(prompt => (
            <TabsContent key={prompt.key} value={prompt.key}>
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        {getPromptIcon(prompt.key)}
                        {prompt.name}
                      </CardTitle>
                      <CardDescription className="text-slate-400 mt-1">
                        {prompt.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-700 text-slate-400">
                        v{prompt.version}
                      </Badge>
                      {saveSuccess[prompt.key] && (
                        <Badge className="bg-green-600 text-white">
                          已保存
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 提示詞編輯區 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">提示詞內容</span>
                      <span className="text-slate-500">
                        上次更新：{new Date(prompt.updated_at).toLocaleString('zh-TW')}
                      </span>
                    </div>
                    <Textarea
                      value={editedContent[prompt.key] || ''}
                      onChange={(e) => setEditedContent(prev => ({
                        ...prev,
                        [prompt.key]: e.target.value
                      }))}
                      className="min-h-[400px] font-mono text-sm bg-slate-950 border-slate-800 text-slate-200"
                      placeholder="輸入提示詞..."
                    />
                  </div>

                  {/* 變數說明 */}
                  <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                    <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      可用變數
                    </h4>
                    <div className="text-sm text-slate-500 space-y-1">
                      {prompt.key === 'character' && (
                        <>
                          <code className="text-purple-400">{'{{templateWorld}}'}</code> - 模板世界設定
                          <br />
                          <code className="text-purple-400">{'{{tensionType}}'}</code> - 角色張力類型
                          <br />
                          <code className="text-purple-400">{'{{examples}}'}</code> - 張力類型例子
                        </>
                      )}
                      {prompt.key === 'outline' && (
                        <>
                          <code className="text-purple-400">{'{{templateWorld}}'}</code> - 模板世界設定
                          <br />
                          <code className="text-purple-400">{'{{character1.name}}'}</code> - 角色1名稱
                          <br />
                          <code className="text-purple-400">{'{{character1.age}}'}</code> - 角色1年齡
                          <br />
                          <code className="text-purple-400">{'{{character1.role}}'}</code> - 角色1身份
                          <br />
                          <code className="text-purple-400">{'{{character1.personality}}'}</code> - 角色1性格
                          <br />
                          <code className="text-purple-400">{'{{character2.*}}'}</code> - 角色2屬性（同上）
                        </>
                      )}
                      {prompt.key === 'story' && (
                        <>
                          <code className="text-purple-400">{'{{templateWorld}}'}</code> - 模板世界設定
                          <br />
                          <code className="text-purple-400">{'{{userInput}}'}</code> - 用戶自定義輸入
                          <br />
                          <code className="text-purple-400">{'{{character1.*}}'}</code> - 角色1所有屬性
                          <br />
                          <code className="text-purple-400">{'{{character2.*}}'}</code> - 角色2所有屬性
                          <br />
                          <code className="text-purple-400">{'{{outlineBeginning}}'}</code> - 開端大綱
                          <br />
                          <code className="text-purple-400">{'{{outlineDevelopment}}'}</code> - 發展大綱
                          <br />
                          <code className="text-purple-400">{'{{outlineClimax}}'}</code> - 高潮大綱
                        </>
                      )}
                    </div>
                  </div>

                  {/* 保存按鈕 */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSave(prompt.key)}
                      disabled={saving[prompt.key] || editedContent[prompt.key] === prompt.content}
                      className={cn(
                        "bg-purple-600 hover:bg-purple-700",
                        editedContent[prompt.key] !== prompt.content && "animate-pulse"
                      )}
                    >
                      {saving[prompt.key] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          保存更改
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* 密碼輸入彈窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">輸入管理員密碼</CardTitle>
              <CardDescription className="text-slate-400">
                保存提示詞需要驗證身份
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="管理員密碼"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  取消
                </Button>
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={!password}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  確認
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}