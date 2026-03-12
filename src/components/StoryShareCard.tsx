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

// 熱門 Hook 文案池
const HOOKS = [
  "🔥 AI 寫的故事太離譜了",
  "😱 這個劇情我沒想到",
  "🚨 深夜辦公室的秘密",
  "💀 這個結局太刺激了",
  "🔞 成年人的深夜故事",
];

export function StoryShareCard({ 
  storyContent, 
  storyTitle = "AI 生成故事",
  templateName = "神秘故事"
}: StoryShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // 提取情境標題（從故事第一行或模板名）
  const extractContextTitle = useCallback(() => {
    const firstLine = storyContent.split("\n")[0].trim();
    // 如果第一行夠短且有吸引力，用它
    if (firstLine && firstLine.length > 3 && firstLine.length < 20) {
      return firstLine.replace(/["'""']/g, "");
    }
    // 否則使用模板名或默認
    return templateName || "神秘故事";
  }, [storyContent, templateName]);

  // 提取故事片段（最多4行，製造懸念）
  const extractStorySnippet = useCallback(() => {
    // 清理文本
    const lines = storyContent
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith("#") && !line.startsWith("第"));
    
    // 取前4行，每行最多15字
    const snippet = lines.slice(0, 4).map(line => {
      if (line.length > 15) {
        return line.slice(0, 15) + "…";
      }
      return line;
    });
    
    return snippet;
  }, [storyContent]);

  // 隨機選擇 Hook
  const getRandomHook = useCallback(() => {
    return HOOKS[Math.floor(Math.random() * HOOKS.length)];
  }, []);

  // 生成 Canvas 圖片 - 病毒傳播優化版
  const generateCard = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      // 設置畫布尺寸 (1200x1200 正方形，更適合社交媒體)
      const width = 1200;
      const height = 1200;
      canvas.width = width;
      canvas.height = height;

      // ===== 背景層 =====
      // 深色漸層背景（藍紫調）
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f0c29");
      gradient.addColorStop(0.5, "#302b63");
      gradient.addColorStop(1, "#24243e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 微光效果 - 右上角
      const glow1 = ctx.createRadialGradient(
        width * 0.8, height * 0.15, 0,
        width * 0.8, height * 0.15, 500
      );
      glow1.addColorStop(0, "rgba(139, 92, 246, 0.4)");
      glow1.addColorStop(0.5, "rgba(139, 92, 246, 0.1)");
      glow1.addColorStop(1, "rgba(139, 92, 246, 0)");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      // 微光效果 - 左下角
      const glow2 = ctx.createRadialGradient(
        width * 0.2, height * 0.85, 0,
        width * 0.2, height * 0.85, 400
      );
      glow2.addColorStop(0, "rgba(236, 72, 153, 0.3)");
      glow2.addColorStop(1, "rgba(236, 72, 153, 0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);

      // 細微噪點紋理（模擬質感）
      ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2;
        ctx.fillRect(x, y, size, size);
      }

      // ===== 內容層 =====
      const padding = 80;
      let currentY = 180;

      // 1. Hook（36px）- 最吸睛
      ctx.font = "bold 36px 'PingFang SC', 'Microsoft YaHei', sans-serif";
      ctx.fillStyle = "#fbbf24"; // 琥珀色，醒目
      ctx.textAlign = "left";
      ctx.fillText(getRandomHook(), padding, currentY);
      currentY += 80;

      // 2. 情境標題（48px）- 核心賣點
      const contextTitle = extractContextTitle();
      ctx.font = "bold 48px 'PingFang SC', 'Microsoft YaHei', sans-serif";
      ctx.fillStyle = "#ffffff";
      
      // 標題換行處理（最多2行）
      const maxTitleWidth = width - padding * 2;
      const words = contextTitle.split("");
      let line = "";
      let lineCount = 0;
      
      for (let i = 0; i < words.length && lineCount < 2; i++) {
        const testLine = line + words[i];
        if (ctx.measureText(testLine).width > maxTitleWidth && line !== "") {
          ctx.fillText(line, padding, currentY);
          line = words[i];
          currentY += 70;
          lineCount++;
        } else {
          line = testLine;
        }
      }
      if (line && lineCount < 2) {
        ctx.fillText(line, padding, currentY);
        currentY += 100;
      } else {
        currentY += 60;
      }

      // 3. 分隔裝飾線
      ctx.beginPath();
      ctx.moveTo(padding, currentY - 30);
      ctx.lineTo(width - padding, currentY - 30);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. 故事片段（24px，最多4行）
      const snippet = extractStorySnippet();
      ctx.font = "24px 'PingFang SC', 'Microsoft YaHei', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      
      snippet.forEach((line, index) => {
        currentY += 50;
        // 引號裝飾
        if (index === 0) {
          ctx.fillStyle = "rgba(139, 92, 246, 0.6)";
          ctx.fillText("「", padding - 30, currentY);
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        }
        ctx.fillText(line, padding, currentY);
      });
      
      // 省略號懸念
      currentY += 50;
      ctx.fillStyle = "rgba(139, 92, 246, 0.6)";
      ctx.fillText("」", padding, currentY);
      currentY += 80;

      // 5. CTA 按鈕區域（28px）
      const ctaY = height - 200;
      
      // CTA 背景
      const ctaGradient = ctx.createLinearGradient(padding, ctaY - 20, padding + 400, ctaY + 60);
      ctaGradient.addColorStop(0, "rgba(139, 92, 246, 0.3)");
      ctaGradient.addColorStop(1, "rgba(236, 72, 153, 0.3)");
      ctx.fillStyle = ctaGradient;
      ctx.beginPath();
      ctx.roundRect(padding, ctaY - 20, 400, 80, 16);
      ctx.fill();
      
      // CTA 邊框
      ctx.strokeStyle = "rgba(139, 92, 246, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(padding, ctaY - 20, 400, 80, 16);
      ctx.stroke();
      
      // CTA 文字
      ctx.font = "bold 28px 'PingFang SC', 'Microsoft YaHei', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText("▶  查看完整故事", padding + 40, ctaY + 30);

      // 6. 品牌標識（底部）
      ctx.font = "20px 'PingFang SC', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.textAlign = "right";
      ctx.fillText("nyx-ai.net", width - padding, height - 60);
      
      // 品牌 Logo 區域
      ctx.fillStyle = "rgba(139, 92, 246, 0.2)";
      ctx.beginPath();
      ctx.arc(padding + 20, height - 70, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = "#a78bfa";
      ctx.textAlign = "center";
      ctx.fillText("N", padding + 20, height - 63);

      resolve(canvas);
    });
  }, [extractContextTitle, extractStorySnippet, getRandomHook]);

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

  // 複製圖片到剪貼板
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
          // 如果無法複製圖片，提供下載替代
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
