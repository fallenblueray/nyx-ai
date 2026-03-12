"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "@/components/SimpleToast";

interface StoryShareCardProps {
  storyContent: string;
  storyTitle?: string;
  templateName?: string;
}

// 熱門 Hook 文案池
const HOOKS = [
  "AI 寫的故事太離譜了",
  "這個劇情我沒想到",
  "深夜辦公室的秘密",
  "這個結局太刺激了",
  "成年人的深夜故事",
];

// 加載字體
function loadFonts(): Promise<void> {
  return new Promise((resolve) => {
    // 使用系統字體，不需要額外加載
    resolve();
  });
}

export function StoryShareCard({ 
  storyContent, 
  storyTitle = "AI 生成故事",
  templateName = "神秘故事"
}: StoryShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadFonts().then(() => setFontsLoaded(true));
  }, []);

  // 提取情境標題
  const extractContextTitle = useCallback(() => {
    const lines = storyContent.split("\n").filter(l => l.trim());
    const firstLine = lines[0]?.trim() || "";
    
    // 如果第一行夠短，用它
    if (firstLine.length > 2 && firstLine.length < 15) {
      return firstLine.replace(/["'""']/g, "");
    }
    // 否則使用模板名
    return templateName || "神秘故事";
  }, [storyContent, templateName]);

  // 提取故事片段（2-3行，製造懸念）
  const extractStorySnippet = useCallback(() => {
    const lines = storyContent
      .split("\n")
      .map(line => line.trim())
      .filter(line => 
        line.length > 5 && 
        !line.startsWith("#") && 
        !line.startsWith("第") &&
        !line.includes("【") &&
        !line.includes("AI")
      );
    
    // 取第2-4行（跳過標題）
    const snippet = lines.slice(1, 4);
    return snippet;
  }, [storyContent]);

  // 生成 Canvas 圖片
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

      // ===== 背景 =====
      // 深色基礎
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, width, height);

      // AI 科技感網格背景
      ctx.strokeStyle = "rgba(139, 92, 246, 0.1)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 紫藍漸層光暈 - 中央
      const centerGlow = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, 600
      );
      centerGlow.addColorStop(0, "rgba(139, 92, 246, 0.15)");
      centerGlow.addColorStop(0.5, "rgba(59, 130, 246, 0.08)");
      centerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      // ===== AI 裝飾元素 =====
      // 頂部 AI 標識
      ctx.fillStyle = "rgba(139, 92, 246, 0.2)";
      ctx.beginPath();
      ctx.roundRect(width / 2 - 80, 40, 160, 50, 25);
      ctx.fill();
      
      ctx.font = "bold 24px sans-serif";
      ctx.fillStyle = "#a78bfa";
      ctx.textAlign = "center";
      ctx.fillText("✦ AI GENERATED", width / 2, 73);

      // 左側裝飾線
      ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 150);
      ctx.lineTo(60, 250);
      ctx.stroke();
      
      // 小方塊裝飾
      ctx.fillStyle = "rgba(139, 92, 246, 0.5)";
      ctx.fillRect(55, 260, 10, 10);

      // ===== 內容區域 =====
      const contentX = 100;
      let currentY = 200;

      // 1. Hook 標籤（帶背景）
      const hook = HOOKS[Math.floor(Math.random() * HOOKS.length)];
      ctx.fillStyle = "rgba(251, 191, 36, 0.15)";
      ctx.beginPath();
      ctx.roundRect(contentX, currentY, 400, 60, 8);
      ctx.fill();
      
      ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(contentX, currentY, 400, 60, 8);
      ctx.stroke();
      
      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = "#fbbf24";
      ctx.textAlign = "left";
      ctx.fillText("🔥 " + hook, contentX + 20, currentY + 40);
      currentY += 120;

      // 2. 情境標題（大字）
      const title = extractContextTitle();
      ctx.font = "bold 72px sans-serif";
      ctx.fillStyle = "#ffffff";
      
      // 標題換行（最多2行）
      const maxWidth = width - 200;
      const chars = title.split("");
      let line = "";
      let lines = [];
      
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
      
      // 限制2行
      lines = lines.slice(0, 2);
      lines.forEach((lineText, i) => {
        ctx.fillText(lineText, contentX, currentY + i * 90);
      });
      currentY += lines.length * 90 + 60;

      // 3. 分隔線
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(contentX, currentY);
      ctx.lineTo(width - contentX, currentY);
      ctx.stroke();
      currentY += 80;

      // 4. 故事片段（帶引號）
      const snippet = extractStorySnippet();
      
      // 左引號（大）
      ctx.font = "120px serif";
      ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
      ctx.fillText("\u201C", contentX - 10, currentY + 20);
      
      ctx.font = "32px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      
      snippet.forEach((line, i) => {
        // 限制每行長度
        let displayLine = line;
        if (line.length > 22) {
          displayLine = line.slice(0, 22) + "…";
        }
        ctx.fillText(displayLine, contentX + 30, currentY + i * 55);
      });
      
      currentY += snippet.length * 55 + 30;
      
      // 右引號（大）
      ctx.font = "120px serif";
      ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
      ctx.textAlign = "right";
      ctx.fillText("\u201D", width - contentX + 20, currentY);
      ctx.textAlign = "left";

      currentY += 100;

      // 5. CTA 區域（科技感）
      const ctaY = height - 220;
      
      // 外發光
      const ctaGlow = ctx.createLinearGradient(contentX, ctaY, contentX + 480, ctaY + 100);
      ctaGlow.addColorStop(0, "rgba(139, 92, 246, 0.4)");
      ctaGlow.addColorStop(1, "rgba(236, 72, 153, 0.4)");
      ctx.fillStyle = ctaGlow;
      ctx.beginPath();
      ctx.roundRect(contentX - 4, ctaY - 4, 488, 108, 16);
      ctx.fill();
      
      // CTA 背景
      const ctaBg = ctx.createLinearGradient(contentX, ctaY, contentX + 480, ctaY + 100);
      ctaBg.addColorStop(0, "rgba(139, 92, 246, 0.2)");
      ctaBg.addColorStop(1, "rgba(236, 72, 153, 0.2)");
      ctx.fillStyle = ctaBg;
      ctx.beginPath();
      ctx.roundRect(contentX, ctaY, 480, 100, 12);
      ctx.fill();
      
      // CTA 邊框
      ctx.strokeStyle = "rgba(139, 92, 246, 0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(contentX, ctaY, 480, 100, 12);
      ctx.stroke();
      
      // CTA 文字
      ctx.font = "bold 36px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("▶  查看完整故事", contentX + 240, ctaY + 62);

      // 6. 底部品牌
      ctx.font = "28px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.textAlign = "center";
      ctx.fillText("nyx-ai.net", width / 2, height - 60);

      resolve(canvas);
    });
  }, [extractContextTitle, extractStorySnippet]);

  // 下載圖片
  const handleDownload = useCallback(async () => {
    if (!fontsLoaded) {
      toast.error("字體加載中，請稍候");
      return;
    }
    
    setIsGenerating(true);
    try {
      const canvas = await generateCard();
      if (!canvas) {
        toast.error("生成失敗，請重試");
        return;
      }

      const link = document.createElement("a");
      link.download = `nyx-ai-story-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("分享卡已下載");
    } catch (error) {
      console.error("Generate card error:", error);
      toast.error("生成失敗");
    } finally {
      setIsGenerating(false);
    }
  }, [generateCard, fontsLoaded]);

  // 複製圖片
  const handleCopy = useCallback(async () => {
    if (!fontsLoaded) {
      toast.error("字體加載中，請稍候");
      return;
    }
    
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
          link.download = `nyx-ai-story-${Date.now()}.png`;
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
  }, [generateCard, fontsLoaded]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isGenerating || !fontsLoaded}
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
          disabled={isGenerating || !fontsLoaded}
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
