import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Character {
  id: string
  name: string
  description: string
  traits: string[]
}

export interface Topic {
  category: string
  subcategory: string
  item: string
}

interface AppState {
  // Panel state
  isPanelCollapsed: boolean
  setPanelCollapsed: (collapsed: boolean) => void

  // Story input
  storyInput: string
  setStoryInput: (input: string) => void

  // Story output
  storyOutput: string
  setStoryOutput: (output: string) => void
  appendStoryOutput: (text: string) => void

  // Generation state
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void
  error: string | null
  setError: (error: string | null) => void

  // Selected topics
  selectedTopics: Topic[]
  setSelectedTopics: (topics: Topic[]) => void
  addTopic: (topic: Topic) => void
  removeTopic: (topic: Topic) => void

  // Characters
  characters: Character[]
  addCharacter: (character: Character) => void
  updateCharacter: (id: string, character: Partial<Character>) => void
  deleteCharacter: (id: string) => void
  
  // V2: 後台異步角色提取
  isExtractingCharacters: boolean
  extractCharacters: (storyText: string) => Promise<void>

  // 匿名用戶額度
  anonymousWordsLeft: number
  setAnonymousWordsLeft: (n: number) => void
  anonymousWordsLimit: number

  // 彈窗狀態：字數用完提示
  showSignupPrompt: boolean    // 匿名用戶字數耗盡 → 彈出註冊提醒
  setShowSignupPrompt: (v: boolean) => void
  showRechargePrompt: boolean  // 登入用戶字數耗盡 → 彈出充值提醒
  setShowRechargePrompt: (v: boolean) => void

  // 重新生成標記（用戶按「再寫一次」時觸發）
  shouldRegenerate: boolean
  setShouldRegenerate: (v: boolean) => void
}

export const FREE_WORD_LIMIT = 8000

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Panel
      isPanelCollapsed: false,
      setPanelCollapsed: (collapsed) => set({ isPanelCollapsed: collapsed }),

      // Story input
      storyInput: '',
      setStoryInput: (input) => set({ storyInput: input }),

      // Story output
      storyOutput: '',
      setStoryOutput: (output) => set({ storyOutput: output }),
      appendStoryOutput: (text) => set((state) => ({
        storyOutput: state.storyOutput + text
      })),

      // Generation state
      isGenerating: false,
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      error: null,
      setError: (error) => set({ error }),

      // Topics
      selectedTopics: [],
      setSelectedTopics: (topics) => set({ selectedTopics: topics }),
      addTopic: (topic) => set((state) => ({
        selectedTopics: [...state.selectedTopics, topic]
      })),
      removeTopic: (topic) => set((state) => ({
        selectedTopics: state.selectedTopics.filter(
          (t) => !(t.category === topic.category &&
            t.subcategory === topic.subcategory &&
            t.item === topic.item)
        )
      })),

      // Characters
      characters: [],
      addCharacter: (character) => set((state) => ({ 
        characters: [...state.characters, character] 
      })),
      updateCharacter: (id, updates) => set((state) => ({
        characters: state.characters.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        )
      })),
      deleteCharacter: (id) => set((state) => ({ 
        characters: state.characters.filter((c) => c.id !== id) 
      })),
      
      // V2: 後台異步角色提取
      isExtractingCharacters: false,
      extractCharacters: async (storyText: string) => {
        set({ isExtractingCharacters: true })
        try {
          const response = await fetch('/api/extract-characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storyText })
          })
          if (!response.ok) {
            console.warn('[extractCharacters] API error:', response.status)
            return // 失敗靜默處理
          }
          const data = await response.json()
          const newCharacters = data.characters || []
          if (newCharacters.length === 0) return
          
          // 合併新角色（按名字去重）
          set((state) => {
            const existingNames = new Set(state.characters.map(c => c.name))
            const uniqueNewChars: Character[] = newCharacters
              .filter((c: { name: string }) => !existingNames.has(c.name))
              .map((c: { name: string; description?: string; traits?: string[] }) => ({
                ...c,
                id: `extracted-${c.name}-${Date.now()}`,
                description: c.description || '故事中提取的角色',
                traits: Array.isArray(c.traits) ? c.traits : []
              }))
            if (uniqueNewChars.length === 0) return {}
            return {
              characters: [...state.characters, ...uniqueNewChars].slice(0, 10)
            }
          })
        } catch (err) {
          console.warn('[extractCharacters] Failed:', err)
          // 後台提取失敗不影響用戶體驗
        } finally {
          set({ isExtractingCharacters: false })
        }
      },

      // 匿名用戶
      anonymousWordsLeft: FREE_WORD_LIMIT,
      setAnonymousWordsLeft: (n) => set({ anonymousWordsLeft: n }),
      anonymousWordsLimit: FREE_WORD_LIMIT,

      // 彈窗狀態
      showSignupPrompt: false,
      setShowSignupPrompt: (v) => set({ showSignupPrompt: v }),
      showRechargePrompt: false,
      setShowRechargePrompt: (v) => set({ showRechargePrompt: v }),

      // 重新生成標記
      shouldRegenerate: false,
      setShouldRegenerate: (v) => set({ shouldRegenerate: v }),
    }),
    {
      name: 'nyx-ai-storage',
      // 不持久化彈窗狀態
      partialize: (state) => ({
        isPanelCollapsed: state.isPanelCollapsed,
        storyInput: state.storyInput,
        storyOutput: state.storyOutput,
        selectedTopics: state.selectedTopics,
        characters: state.characters,
      }),
    }
  )
)
