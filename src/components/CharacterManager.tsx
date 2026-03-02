"use client"

import { useState } from "react"
import { useAppStore, type Character } from "@/store/useAppStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "@/components/TranslationContext"

export function CharacterManager() {
  const translations = useTranslation()
  const { characters, addCharacter, updateCharacter, deleteCharacter, isExtractingCharacters } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", description: "", traits: "" })
  
  const handleSubmit = () => {
    if (!form.name.trim()) return
    
    const traitList = form.traits.split(",").map(t => t.trim()).filter(Boolean)
    
    if (editingId) {
      updateCharacter(editingId, {
        name: form.name,
        description: form.description,
        traits: traitList
      })
    } else {
      const newCharacter: Character = {
        id: Date.now().toString(),
        name: form.name,
        description: form.description,
        traits: traitList
      }
      addCharacter(newCharacter)
    }
    
    setForm({ name: "", description: "", traits: "" })
    setEditingId(null)
    setIsOpen(false)
  }
  
  const handleEdit = (char: Character) => {
    setForm({
      name: char.name,
      description: char.description,
      traits: char.traits.join(", ")
    })
    setEditingId(char.id)
    setIsOpen(true)
  }
  
  const handleDelete = (id: string) => {
    if (confirm("確定要刪除這個角色嗎？")) {
      deleteCharacter(id)
    }
  }
  
  return (
    <div className="space-y-3">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full nyx-border nyx-text-secondary hover:nyx-surface-2">
            <Plus className="w-4 h-4 mr-2" />
            新增角色
          </Button>
        </DialogTrigger>
        <DialogContent className="nyx-surface nyx-border nyx-text-primary">
          <DialogHeader>
            <DialogTitle>{editingId ? "編輯角色" : "新增角色"}</DialogTitle>
            <DialogDescription className="nyx-text-muted">
              {editingId ? "修改角色的名稱、描述和特質" : "新增一個角色，包括名稱、描述和特質"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm nyx-text-muted">名稱</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="角色名稱"
                className="nyx-input"
              />
            </div>
            <div>
              <label className="text-sm nyx-text-muted">描述</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="角色簡述"
                className="nyx-input"
              />
            </div>
            <div>
              <label className="text-sm nyx-text-muted">特質 (逗號分隔)</label>
              <Input
                value={form.traits}
                onChange={(e) => setForm({ ...form, traits: e.target.value })}
                placeholder="例如: 傲嬌, 銀髮, 巨乳"
                className="nyx-input"
              />
            </div>
            <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
              {editingId ? "儲存" : "新增"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 提取中指示器 */}
      {isExtractingCharacters && (
        <div className="text-xs nyx-text-muted flex items-center gap-1 py-1">
          <span className="animate-pulse">🤖 AI 提取角色中...</span>
        </div>
      )}

      {/* 角色列表 */}
      <div className="space-y-2">
        {characters.map((char) => (
          <Card key={char.id} className="nyx-surface-2 nyx-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm nyx-text-primary">{char.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(char)}
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(char.id)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs nyx-text-muted">{char.description}</p>
              {char.traits.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {char.traits.map((trait, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 nyx-surface-3 rounded text-xs nyx-text-secondary">
                      {trait}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
