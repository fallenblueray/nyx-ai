"use client"

import { useState, useCallback } from "react"
import { useAppStore } from "@/store/useAppStore"
import { useSession } from "next-auth/react"
import { getOrCreateAnonymousId } from "@/lib/anonymous"
import { getUserWordCount } from "@/app/actions/story"

interface UseStoryGenerationOptions {
  onError?: (error: string) => void
  onSuccess?: () => void
}

export function useStoryGeneration(options: UseStoryGenerationOptions = {}) {
  const { data: session } = useSession()
  const [currentSegment, setCurrentSegment] = useState(0)
  const [wordInfo, setWordInfo] = useState<{ wordCount: number; isFirstPurchase: boolean } | null>(null)
  const [rechargeOpen, setRechargeOpen] = useState(false)
  
  const {
    storyInput,
    selectedTopics,
    characters,
    targetSegments,
    setIsGenerating,
    setError,
    setStoryOutput,
    appendStoryOutput,
    setAnonymousWordsLeft,
    setShowSignupPrompt,
    setShowRechargePrompt,
    extractCharacters,
  } = useAppStore()

  const isLoggedIn = !!session?.user
  const canGenerate = storyInput.trim().length > 0 || selectedTopics.length > 0 || characters.length > 0

  // 處理 API 錯誤響應
  const handleApiError = useCallback(async (result: any) => {
    if (result.errorType === "free_quota_exceeded") {
      setShowSignupPrompt(true)
      return true
    }
    if (result.errorType === "insufficient_words") {
      const info = await getUserWordCount()
      setWordInfo(info)
      setShowRechargePrompt(true)
      return true
    }
    return false
  }, [setShowSignupPrompt, setShowRechargePrompt])

  // 開始生成前的準備
  const prepareGeneration = useCallback(() => {
    const { resetStreaming, setStreamingState } = useAppStore.getState()
    resetStreaming()
    setStreamingState({ 
      isStreaming: true, 
      currentSceneIndex: 0, 
      totalScenes: targetSegments 
    })
    setIsGenerating(true)
    setError(null)
    setStoryOutput("")
    setCurrentSegment(0)
  }, [targetSegments, setIsGenerating, setError, setStoryOutput])

  // 結束生成
  const finishGeneration = useCallback(() => {
    setIsGenerating(false)
    setCurrentSegment(0)
    const { setStreamingState } = useAppStore.getState()
    setStreamingState({ isStreaming: false })
    options.onSuccess?.()
  }, [setIsGenerating, options])

  // 處理 SSE 數據
  const handleSSEData = useCallback((data: any) => {
    // 分段事件
    if (data.segmentStart) {
      setCurrentSegment(data.segmentIndex)
      const { setStreamingState } = useAppStore.getState()
      setStreamingState({ currentSceneIndex: data.segmentIndex })
      return
    }
    
    if (data.segmentDone) {
      return
    }

    // 錯誤處理
    if (data.error) {
      handleApiError(data)
      setError(data.error)
      return
    }

    // 內容追加
    if (data.content) {
      appendStoryOutput(data.content)
    }

    // 完成處理
    if (data.done) {
      if (data.isAnonymous && data.remaining !== undefined) {
        setAnonymousWordsLeft(data.remaining)
      }
      const finalStory = useAppStore.getState().storyOutput
      if (finalStory.length > 100) {
        extractCharacters(finalStory)
      }
    }
  }, [appendStoryOutput, setAnonymousWordsLeft, extractCharacters, handleApiError, setError])

  return {
    currentSegment,
    wordInfo,
    rechargeOpen,
    setRechargeOpen,
    isLoggedIn,
    canGenerate,
    prepareGeneration,
    finishGeneration,
    handleSSEData,
    handleApiError,
  }
}

// 導出相關的輔助函數
export function getAnonymousId(isLoggedIn: boolean): string | undefined {
  if (isLoggedIn) return undefined
  return getOrCreateAnonymousId()
}
