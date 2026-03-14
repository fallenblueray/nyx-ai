"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shuffle, ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";
import { viralCharacters, viralScenes, viralOpenings, getRandomTags, calculateIntensity, ViralCombination } from "@/lib/viral-prompts";

interface RandomStoryButtonProps {
  onSelect?: (combination: ViralCombination) => void;
}

export function RandomStoryButton({ onSelect }: RandomStoryButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [combination, setCombination] = useState<ViralCombination | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCombination = useCallback(() => {
    setIsGenerating(true);
    
    const character = viralCharacters[Math.floor(Math.random() * viralCharacters.length)];
    const scene = viralScenes[Math.floor(Math.random() * viralScenes.length)];
    const opening = viralOpenings[Math.floor(Math.random() * viralOpenings.length)];
    const tags = getRandomTags(2, 4);
    const intensity = calculateIntensity(character.trope, scene.trope);

    const newCombination: ViralCombination = {
      character: character.name,
      scene: scene.name,
      opening,
      tags,
      intensity,
      characterTrope: character.trope,
      sceneTrope: scene.trope,
    };

    setCombination(newCombination);
    
    setTimeout(() => setIsGenerating(false), 300);
  }, []);

  // 首次展開時生成一個組合
  useEffect(() => {
    if (isExpanded && !combination && !isGenerating) {
      const timer = setTimeout(() => {
        generateCombination();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, combination, generateCombination, isGenerating]);

  const handleUseCombination = () => {
    if (combination && onSelect) {
      onSelect(combination);
    }
    setIsExpanded(false);
  };

  return (
    <div className="w-full">
      {/* 摺合式標題欄 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
            隨機組合
          </span>
          {combination && (
            <span className="text-xs text-purple-700 dark:text-purple-300">
              · {combination.character} + {combination.scene}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        )}
      </button>

      {/* 展開內容 */}
      {isExpanded && (
        <Card className="mt-2 bg-white/50 dark:bg-white/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                隨機題材組合
              </h4>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {combination && (
              <>
                {/* 組合詳情 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">人物</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {combination.character}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">場景</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {combination.scene}
                    </span>
                  </div>
                  
                  {/* 刺激度 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">刺激度</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-3 rounded-sm ${
                              i < combination.intensity
                                ? 'bg-red-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 w-6 text-right">
                        {combination.intensity}
                      </span>
                    </div>
                  </div>

                  {/* 標籤 */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {combination.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 開場白預覽 */}
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">開場白</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                    「{combination.opening.text}」
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    氛圍：{combination.opening.atmosphere}
                  </p>
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateCombination}
                    disabled={isGenerating}
                    className="flex-1 border-purple-500/30 text-gray-900 dark:text-white hover:bg-purple-100 dark:hover:bg-purple-500/20"
                  >
                    <Shuffle className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                    換一組
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUseCombination}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    使用此組合
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
