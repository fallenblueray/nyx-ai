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
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Panel
      isPanelCollapsed: false,
      setPanelCollapsed: (collapsed) => set({ isPanelCollapsed: collapsed }),
      
      // Story
      storyInput: '',
      setStoryInput: (input) => set({ storyInput: input }),
      
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
    }),
    {
      name: 'nyx-ai-storage',
    }
  )
)
