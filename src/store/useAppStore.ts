import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const FREE_WORD_LIMIT = 8000

export interface Character {
  id: string
  name: string
  description: string
  traits: string[]
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

  // Characters
  characters: Character[]
  setCharacters: (characters: Character[]) => void
  addCharacter: (character: Character) => void
  updateCharacter: (id: string, character: Partial<Character>) => void
  deleteCharacter: (id: string) => void
  
  // V2: 後台異步角色提取
  isExtractingCharacters: boolean
  
  // V5.2: 模板生成載入提示
  isGeneratingTemplate: boolean
  setIsGeneratingTemplate: (v: boolean) => void
  extractCharacters: (storyText: string) => Promise<void>

  // 匿名用戶額度
  anonymousWordsLeft: number
  setAnonymousWordsLeft: (n: number) => void
  anonymousWordsLimit: number

  // 彈窗狀態：字數用完提示
  showSignupPrompt: boolean
  setShowSignupPrompt: (v: boolean) => void
  showRechargePrompt: boolean
  setShowRechargePrompt: (v: boolean) => void

  // 重新生成標記
  shouldRegenerate: boolean
  setShouldRegenerate: (v: boolean) => void

  // V5: 簡化流式狀態
  currentSceneIndex: number
  totalScenes: number
  isStreaming: boolean
  setStreamingState: (state: {
    isStreaming?: boolean
    currentSceneIndex?: number
    totalScenes?: number
  }) => void
  resetStreaming: () => void

  // V2.9: Humanize 開關
  humanizeEnabled: boolean
  setHumanizeEnabled: (v: boolean) => void
  
  // V4.4: 人稱視角
  perspective: 'first-person' | 'third-person'
  setPerspective: (perspective: 'first-person' | 'third-person') => void
  
  // V4.5: 故事主題
  storyTheme: string
  setStoryTheme: (theme: string) => void
  
  // V5: Prompt Engine
  selectedTemplate: string | null
  setSelectedTemplate: (templateId: string | null) => void
  
  // V5.1: 生成的角色和大綱
  generatedCharacters: { name: string; age: string; role: string; personality: string; appearance: string; desireStyle: string; traits: string[] }[] | null
  generatedOutline: { beginning: string; development: string; climax: string; preview: string } | null
  setGeneratedCharacters: (characters: { name: string; age: string; role: string; personality: string; appearance: string; desireStyle: string; traits: string[] }[] | null) => void
  setGeneratedOutline: (outline: { beginning: string; development: string; climax: string; preview: string } | null) => void
}

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

      // Characters
      characters: [],
      setCharacters: (characters) => set({ characters }),
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
            return
          }
          const data = await response.json()
          const newCharacters = data.characters || []
          if (newCharacters.length === 0) return
          
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

      // V5: 簡化流式狀態
      currentSceneIndex: 0,
      totalScenes: 1,
      isStreaming: false,
      setStreamingState: (newState) => set((state) => ({
        currentSceneIndex: newState.currentSceneIndex ?? state.currentSceneIndex,
        totalScenes: newState.totalScenes ?? state.totalScenes,
        isStreaming: newState.isStreaming ?? state.isStreaming,
      })),
      resetStreaming: () => set({
        currentSceneIndex: 0,
        isStreaming: false,
      }),

      // V2.9: Humanize
      humanizeEnabled: true,
      setHumanizeEnabled: (v) => set({ humanizeEnabled: v }),

      // V4.4: 人稱視角
      perspective: 'first-person',
      setPerspective: (perspective) => set({ perspective }),
      
      // V4.5: 故事主題
      storyTheme: 'midnight-passion',
      setStoryTheme: (theme) => set({ storyTheme: theme }),
      
      // V5: Prompt Engine
      selectedTemplate: null,
      setSelectedTemplate: (templateId) => set({ selectedTemplate: templateId }),
      
      // V5.1: 生成的角色和大綱
      generatedCharacters: null,
      generatedOutline: null,
      setGeneratedCharacters: (characters) => set({ generatedCharacters: characters }),
      setGeneratedOutline: (outline) => set({ generatedOutline: outline }),
      
      // V5.2: 模板生成載入狀態
      isGeneratingTemplate: false,
      setIsGeneratingTemplate: (v) => set({ isGeneratingTemplate: v }),
    }),
    {
      name: 'nyx-ai-storage',
      partialize: (state) => ({
        isPanelCollapsed: state.isPanelCollapsed,
        storyInput: state.storyInput,
        storyOutput: state.storyOutput,
        characters: state.characters,
        perspective: state.perspective,
        storyTheme: state.storyTheme,
      }),
    }
  )
)
