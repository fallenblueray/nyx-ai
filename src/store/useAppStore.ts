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
