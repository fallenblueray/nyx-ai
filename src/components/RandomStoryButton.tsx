"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dice5, Loader2, RefreshCw } from "lucide-react";
import { generateRandomPrompt, generateStorySetup, type ViralPrompt } from "@/lib/viral-prompts";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/SimpleToast";

export function RandomStoryButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<ViralPrompt | null>(null);
  const { setStoryInput, setGeneratedOutline } = useAppStore();

  // 隨機生成故事設定
  const handleRandom = useCallback(() => {
    const prompt = generateRandomPrompt();
    setCurrentPrompt(prompt);
  }, []);

  // 一鍵生成故事
  const handleGenerate = useCallback(async () => {
    if (!currentPrompt) {
      toast.error("請先選擇一個組合");
      return;
    }

    setIsGenerating(true);
    
    try {
      // 構建故事起點
      const storySetup = generateStorySetup(currentPrompt);
      
      // 設置到 store
      setStoryInput(storySetup);
      
      // 觸發故事生成（通過調用現有生成流程）
      const event = new CustomEvent("random-story-generate", {
        detail: {
          prompt: currentPrompt,
          setup: storySetup,
        }
      });
      window.dispatchEvent(event);
      
      toast.success("正在生成故事...");
    } catch (error) {
      console.error("Random story error:", error);
      toast.error("生成失敗");
    } finally {
      setIsGenerating(false);
    }
  }, [currentPrompt, setStoryInput, setGeneratedOutline]);

  // 重新隨機
  const handleRefresh = useCallback(() => {
    handleRandom();
  }, [handleRandom]);

  // 初始化
  useState(() => {
    handleRandom();
  });

  if (!currentPrompt) {
    return (
      <Button
        variant="outline"
        onClick={handleRandom}
        className="w-full h-12 border-dashed border-purple-500/50 hover:bg-purple-500/10"
      >
        <Dice5 className="w-5 h-5 mr-2" />
        隨機故事
      </Button>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-purple-300 flex items-center gap-2">
          <Dice5 className="w-4 h-4" />
          隨機組合
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isGenerating}
          className="h-8 px-2 text-purple-400 hover:text-purple-300"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* 組合展示 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">人物</span>
          <span className="text-sm font-medium">{currentPrompt.character}</span>
          {currentPrompt.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">場景</span>
          <span className="text-sm font-medium">{currentPrompt.scene}</span>
        </div>
        
        <div className="p-3 rounded-lg bg-black/20 text-sm italic text-gray-300">
          「{currentPrompt.opening}」
        </div>

        {/* 刺激度 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">刺激度</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-4 rounded-sm ${
                  i < currentPrompt.intensity 
                    ? "bg-gradient-to-t from-purple-500 to-pink-500" 
                    : "bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 生成按鈕 */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Dice5 className="w-4 h-4 mr-2" />
            用這個組合生成故事
          </>
        )}
      </Button>
    </div>
  );
}
