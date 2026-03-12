"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "@/components/SimpleToast";

interface StoryShareCardProps {
  storyContent: string;
  storyTitle?: string;
  templateName?: string;
}

// 病毒級 Hook 文案池（更像社交媒體）
const VIRAL_HOOKS = [
  "我讓 AI 寫這個故事，結果完全失控了",
  "AI 寫的故事太離譜了",
  "這個劇情我沒想到",
  "讓 AI 寫了個故事，看完沉默了",
  "試了一下 AI 寫作，這個結局...",
];

// 故事標籤映射
const STORY_TAGS: Record<string, string[]> = {
  "女上司": ["#職場", "#禁忌"],
  "學妹": ["#校園", "#純愛"],
  "青梅竹馬": ["#重逢", "#情感"],
  "人妻": ["#禁忌", "#NTR"],
  "老師": ["#師生", "#禁忌"],
  "護士": ["#職場", "#制服"],
  "空姐": ["#職場", "#制服"],
  "模特": ["#職場", "#誘惑"],
  "鄰居": ["#日常", "#誘惑"],
  "同學": ["#校園", "#青春"],
  "前女友": ["#重逢", "#情感"],
  "繼母": ["#家庭", "#禁忌"],
  "姐姐": ["#家庭", "#禁忌"],
  "妹妹": ["#家庭", "#純愛"],
  "秘書": ["#職場", "#制服"],
  "家教": ["#師生", "#禁忌"],
};

export function StoryShareCard({ 
  storyContent, 
  storyTitle = "AI 生成故事",
  templateName = "神秘故事"
}: StoryShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // 提取情境標題（從模板名或故事內容）
  const extractContextTitle = useCallback(() => {
    // 優先使用模板名
    if (templateName && templateName !== "神秘故事") {
      return templateName;
    }
    
    // 從故事第一行提取
    const lines = storyContent.split("\n").filter(l => l.trim());
    const firstLine = lines[0]?.trim() || "";
    
    // 如果第一行夠短且有吸引力，用它
    if (firstLine.length > 3 && firstLine.length < 20) {
      return firstLine.replace(/["'""']/g, "");
    }
    
    return "神秘故事";
  }, [storyContent, templateName]);

  // 提取故事標籤
  const extractTags = useCallback(() => {
    const context = extractContextTitle();
    const tags: string[] = [];
    
    // 檢查關鍵詞
    for (const [keyword, tagList] of Object.entries(STORY_TAGS)) {
      if (context.includes(keyword)) {
        tags.push(...tagList);
      }
    }
    
    // 去重並限制數量
    return [...new Set(tags)].slice(0, 2);
  }, [extractContextTitle]);

  // 提取故事片段（嚴格 3 行，製造懸念）
  const extractStorySnippet = useCallback(() => {
    // 清理並過濾文本
    const lines = storyContent
      .split("\n")
      .map(line => line.trim())
      .filter(line => 
        line.length > 5 && 
        line.length < 30 && // 限制每行長度
        !line.startsWith("#") && 
        !line.startsWith("第") &&
        !line.startsWith("【") &&
        !line.includes("AI") &&
        !line.includes("生成") &&
        !line.includes("故事")
      );
    
    // 取第 2-4 行（跳過標題），嚴格限制 3 行
    const snippet = lines.slice(1, 4);
    
    // 如果不足 3 行，從第一行後面補充
    if (snippet.length < 3 && lines.length > 0) {
      const firstLine = lines[0];
      if (firstLine.length > 10) {
        // 分割第一行為短句
        const parts = firstLine.split(/[，。！？]/).filter(p => p.trim().length > 5);
        while (snippet.length < 3 && parts.length > 0) {
          const part = parts.shift()?.trim();
          if (part && part.length > 5) {
            snippet.push(part.slice(0, 25)); // 限制長度
          }
        }
      }
    }
    
    return snippet.slice(0, 3); // 嚴格限制 3 行
  }, [storyContent]);

  // 生成 Canvas 圖片 - 病毒級設計
  const generateCard = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      // 設置畫布尺寸 (1080x1350 - Instagram 推薦比例)
      const width = 1080;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;

      // ===== 背景層 =====
      // 深色基礎
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, width, height);

      // 中心放射漸層（營造氛圍）
      const centerGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, 700
      );
      centerGradient.addColorStop(0, "rgba(139, 92, 246, 0.2)");
      centerGradient.addColorStop(0.5, "rgba(59, 130, 246, 0.1)");
      centerGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = centerGradient;
      ctx.fillRect(0, 0, width, height);

      // 頂部微光
      const topGlow = ctx.createLinearGradient(0, 0, 0, 400);
      topGlow.addColorStop(0, "rgba(139, 92, 246, 0.15)");
      topGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, 400);

      // ===== 內容區域（中心對齊） =====
      const centerX = width / 2;
      let currentY = 180;

      // 1. Hook（36px，琥珀色，居中）
      const hook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)];
      ctx.font = "bold 36px sans-serif";
      ctx.fillStyle = "#fbbf24";
      ctx.textAlign = "center";
      ctx.fillText(hook, centerX, currentY);
      currentY += 80;

      // 2. 情境標題（64px，最大，居中）
      const title = extractContextTitle();
      ctx.font = "bold 64px sans-serif";
      ctx.fillStyle = "#ffffff";
      
      // 標題換行處理（最多2行，居中）
      const maxWidth = width - 200;
      const chars = title.split("");
      let line = "";
      let lines: string[] = [];
      
      for (const char of chars) {
        const testLine = line + char;
        if (ctx.measureText(testLine).width > maxWidth && line !== "") {
          lines.push(line);
          line = char;
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      lines = lines.slice(0, 2); // 限制2行
      
      lines.forEach((lineText) => {
        ctx.fillText(lineText, centerX, currentY);
        currentY += 90;
      });
      currentY += 60;

      // 3. 故事標籤（如果有）
      const tags = extractTags();
      if (tags.length > 0) {
        ctx.font = "24px sans-serif";
        ctx.fillStyle = "rgba(139, 92, 246, 0.8)";
        ctx.fillText(tags.join("  "), centerX, currentY);
        currentY += 60;
      }

      // 4. 分隔裝飾
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 200, currentY);
      ctx.lineTo(centerX + 200, currentY);
      ctx.stroke();
      currentY += 80;

      // 5. 故事片段（24px，居中，嚴格3行）
      const snippet = extractStorySnippet();
      
      // 左引號（大）
      ctx.font = "100px serif";
      ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
      ctx.fillText("\u201C", centerX - 280, currentY + 20);
      
      ctx.font = "24px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      
      snippet.forEach((line, i) => {
        ctx.fillText(line, centerX, currentY + i * 45);
      });
      
      currentY += snippet.length * 45 + 30;
      
      // 右引號（大）
      ctx.font = "100px serif";
      ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
      ctx.fillText("\u201D", centerX + 280, currentY);
      
      currentY += 100;

      // 6. 省略號懸念
      ctx.font = "48px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillText("……", centerX, currentY);
      currentY += 100;

      // 7. CTA 按鈕（28px，科技感）
      const ctaY = currentY;
      const ctaWidth = 400;
      const ctaHeight = 80;
      const ctaX = centerX - ctaWidth / 2;
      
      // 外發光
      const ctaGlow = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaWidth, ctaY + ctaHeight);
      ctaGlow.addColorStop(0, "rgba(139, 92, 246, 0.5)");
      ctaGlow.addColorStop(1, "rgba(236, 72, 153, 0.5)");
      ctx.fillStyle = ctaGlow;
      ctx.fillRect(ctaX - 4, ctaY - 4, ctaWidth + 8, ctaHeight + 8);
      
      // CTA 背景
      const ctaBg = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaWidth, ctaY + ctaHeight);
      ctaBg.addColorStop(0, "rgba(139, 92, 246, 0.3)");
      ctaBg.addColorStop(1, "rgba(236, 72, 153, 0.3)");
      ctx.fillStyle = ctaBg;
      ctx.fillRect(ctaX, ctaY, ctaWidth, ctaHeight);
      
      // CTA 邊框
      ctx.strokeStyle = "rgba(139, 92, 246, 0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(ctaX, ctaY, ctaWidth, ctaHeight);
      
      // CTA 文字
      ctx.font = "bold 28px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("查看完整故事", centerX, ctaY + 50);

      // 8. 底部品牌
      ctx.font = "24px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText("nyx-ai.net", centerX, height - 80);

      resolve(canvas);
    });
  }, [extractContextTitle, extractStorySnippet, extractTags]);

  // 下載圖片
  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCard();
      if (!canvas) {
        toast.error("生成失敗，請重試");
        return;
      }

      const link = document.createElement("a");
      link.download = `nyx-ai-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("分享卡已下載");
    } catch (error) {
      console.error("Generate card error:", error);
      toast.error("生成失敗");
    } finally {
      setIsGenerating(false);
    }
  }, [generateCard]);

  // 複製圖片
  const handleCopy = useCallback(async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCard();
      if (!canvas) {
        toast.error("生成失敗，請重試");
        return;
      }

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("複製失敗");
          return;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
          setCopied(true);
          toast.success("圖片已複製到剪貼板");
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          const link = document.createElement("a");
          link.download = `nyx-ai-${Date.now()}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          toast.success("瀏覽器不支援直接複製，已自動下載");
        }
      }, "image/png");
    } catch (error) {
      console.error("Copy card error:", error);
      toast.error("複製失敗");
    } finally {
      setIsGenerating(false);
    }
  }, [generateCard]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex-1 h-9 border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50"
        >
          {isGenerating ? (
            <span className="animate-pulse">生成中...</span>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              下載分享卡
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={isGenerating}
          className="flex-1 h-9 border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-400" />
              已複製
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              複製圖片
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
