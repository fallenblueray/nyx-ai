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

export function StoryShareCard({ 
  storyContent, 
  storyTitle = "AI 生成故事"
}: StoryShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // 提取故事標題（第一行或前 20 字）
  const extractTitle = useCallback(() => {
    const firstLine = storyContent.split("\n")[0].trim();
    if (firstLine && firstLine.length > 5 && firstLine.length < 50) {
      return firstLine.replace(/["'""']/g, "");
    }
    return storyTitle;
  }, [storyContent, storyTitle]);

  // 提取預覽文本（80-100 字，製造懸念）
  const extractPreview = useCallback(() => {
    const cleanText = storyContent
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    // 取前 90 字，在句號或逗號處截斷
    const preview = cleanText.slice(0, 90);
    const lastPeriod = preview.lastIndexOf("。");
    const lastComma = preview.lastIndexOf("，");
    const cutPoint = lastPeriod > 40 ? lastPeriod : lastComma > 40 ? lastComma : 80;
    
    return preview.slice(0, cutPoint) + "……";
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

      // 設置畫布尺寸 (1200x630 適合社交媒體分享)
      const width = 1200;
      const height = 630;
      canvas.width = width;
      canvas.height = height;

      // 深色漸層背景
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(0.5, "#16213e");
      gradient.addColorStop(1, "#0f3460");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 添加裝飾性光暈
      const glowGradient = ctx.createRadialGradient(
        width * 0.8, height * 0.2, 0,
        width * 0.8, height * 0.2, 400
      );
      glowGradient.addColorStop(0, "rgba(147, 51, 234, 0.3)");
      glowGradient.addColorStop(1, "rgba(147, 51, 234, 0)");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);

      // 頂部標籤
      ctx.fillStyle = "rgba(147, 51, 234, 0.2)";
      ctx.fillRect(40, 40, 200, 40);
      ctx.strokeStyle = "rgba(147, 51, 234, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 40, 200, 40);
      
      ctx.font = "bold 18px 'Microsoft YaHei', 'PingFang SC', sans-serif";
      ctx.fillStyle = "#a855f7";
      ctx.textAlign = "center";
      ctx.fillText("AI 生成故事", 140, 67);

      // 主標題
      const title = extractTitle();
      ctx.font = "bold 48px 'Microsoft YaHei', 'PingFang SC', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      
      // 標題換行處理
      const maxTitleWidth = width - 160;
      let titleY = 160;
      if (ctx.measureText(title).width > maxTitleWidth) {
        const words = title.split("");
        let line = "";
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i];
          if (ctx.measureText(testLine).width > maxTitleWidth && line !== "") {
            ctx.fillText(line, 80, titleY);
            line = words[i];
            titleY += 60;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 80, titleY);
      } else {
        ctx.fillText(title, 80, titleY);
      }

      // 分隔線
      ctx.beginPath();
      ctx.moveTo(80, titleY + 40);
      ctx.lineTo(width - 80, titleY + 40);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 故事預覽內容
      const preview = extractPreview();
      ctx.font = "28px 'Microsoft YaHei', 'PingFang SC', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      
      const lineHeight = 48;
      const maxWidth = width - 160;
      const words = preview.split("");
      let line = "";
      let y = titleY + 120;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        if (ctx.measureText(testLine).width > maxWidth && line !== "") {
          ctx.fillText(line, 80, y);
          line = words[i];
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 80, y);

      // 底部品牌區域
      const bottomY = height - 100;
      
      // 漸層遮罩（底部）
      const bottomGradient = ctx.createLinearGradient(0, bottomY - 50, 0, height);
      bottomGradient.addColorStop(0, "rgba(26, 26, 46, 0)");
      bottomGradient.addColorStop(1, "rgba(26, 26, 46, 0.8)");
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, bottomY - 50, width, 150);

      // CTA 按鈕樣式文字
      ctx.fillStyle = "rgba(147, 51, 234, 0.3)";
      ctx.fillRect(80, bottomY, 280, 56);
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.strokeRect(80, bottomY, 280, 56);
      
      ctx.font = "bold 24px 'Microsoft YaHei', 'PingFang SC', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("繼續閱讀 →", 220, bottomY + 38);

      // 網址
      ctx.font = "20px 'Microsoft YaHei', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.textAlign = "right";
      ctx.fillText("nyx-ai.net", width - 80, bottomY + 38);

      resolve(canvas);
    });
  }, [extractTitle, extractPreview]);

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