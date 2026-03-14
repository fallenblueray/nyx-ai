"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Share2, Link2, MessageCircle, AtSign, Loader2 } from "lucide-react";
import { toast } from "@/components/SimpleToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { saveStory, shareStory } from "@/app/actions/story";

interface StoryShareCardProps {
  storyContent: string;
  storyTitle?: string;
  templateName?: string;
  shareUrl?: string;
  onShareUrlChange?: (url: string) => void;
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
  templateName = "神秘故事",
  shareUrl,
  onShareUrlChange,
}: StoryShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 提取情境標題（從模板名或故事內容）
  const extractContextTitle = useCallback(() => {
    if (templateName && templateName !== "神秘故事") {
      return templateName;
    }
    const lines = storyContent.split("\n").filter((l) => l.trim());
    const firstLine = lines[0]?.trim() || "";
    if (firstLine.length > 3 && firstLine.length < 20) {
      return firstLine.replace(/["'""']/g, "");
    }
    return "神秘故事";
  }, [storyContent, templateName]);

  // 提取故事標籤
  const extractTags = useCallback(() => {
    const context = extractContextTitle();
    const tags: string[] = [];
    for (const [keyword, tagList] of Object.entries(STORY_TAGS)) {
      if (context.includes(keyword)) {
        tags.push(...tagList);
      }
    }
    return [...new Set(tags)].slice(0, 2);
  }, [extractContextTitle]);

  // 提取故事片段（嚴格 3 行，製造懸念）
  const extractStorySnippet = useCallback(() => {
    const lines = storyContent
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 5 &&
          line.length < 30 &&
          !line.startsWith("#") &&
          !line.startsWith("第") &&
          !line.startsWith("【") &&
          !line.includes("AI") &&
          !line.includes("生成") &&
          !line.includes("故事")
      );
    const snippet = lines.slice(1, 4);
    if (snippet.length < 3 && lines.length > 0) {
      const firstLine = lines[0];
      if (firstLine.length > 10) {
        const parts = firstLine
          .split(/[，。！？]/)
          .filter((p) => p.trim().length > 5);
        while (snippet.length < 3 && parts.length > 0) {
          const part = parts.shift()?.trim();
          if (part && part.length > 5) {
            snippet.push(part.slice(0, 25));
          }
        }
      }
    }
    return snippet.slice(0, 3);
  }, [storyContent]);

  // 生成分享文字（適合微信/小紅書）
  const generateShareText = useCallback(() => {
    const hook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)];
    const title = extractContextTitle();
    const tags = extractTags();
    const snippet = extractStorySnippet();

    let text = `${hook}\n\n`;
    text += `【${title}】\n\n`;
    text += snippet.join("\n");
    text += "\n\n……\n\n";
    if (tags.length > 0) {
      text += `${tags.join(" ")}\n`;
    }
    if (shareUrl) {
      text += `🔗 查看完整故事：${shareUrl}`;
    } else {
      text += "🔗 nyx-ai.net";
    }

    return text;
  }, [extractContextTitle, extractTags, extractStorySnippet, shareUrl]);

  // 生成 Canvas 圖片 - 病毒級設計
  const generateCard = useCallback(
    async (includeUrl = true): Promise<HTMLCanvasElement | null> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        const width = 1080;
        const height = includeUrl ? 1450 : 1350;
        canvas.width = width;
        canvas.height = height;

        // 背景
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(0, 0, width, height);

        // 中心放射漸層
        const centerGradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          700
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

        const centerX = width / 2;
        let currentY = 180;

        // Hook
        const hook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)];
        ctx.font = "bold 36px sans-serif";
        ctx.fillStyle = "#fbbf24";
        ctx.textAlign = "center";
        ctx.fillText(hook, centerX, currentY);
        currentY += 80;

        // 標題
        const title = extractContextTitle();
        ctx.font = "bold 64px sans-serif";
        ctx.fillStyle = "#ffffff";
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
        lines = lines.slice(0, 2);
        lines.forEach((lineText) => {
          ctx.fillText(lineText, centerX, currentY);
          currentY += 90;
        });
        currentY += 60;

        // 標籤
        const tags = extractTags();
        if (tags.length > 0) {
          ctx.font = "24px sans-serif";
          ctx.fillStyle = "rgba(139, 92, 246, 0.8)";
          ctx.fillText(tags.join("  "), centerX, currentY);
          currentY += 60;
        }

        // 分隔線
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 200, currentY);
        ctx.lineTo(centerX + 200, currentY);
        ctx.stroke();
        currentY += 80;

        // 故事片段
        const snippet = extractStorySnippet();
        ctx.font = "100px serif";
        ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
        ctx.fillText("\u201C", centerX - 280, currentY + 20);
        ctx.font = "24px sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        snippet.forEach((line, i) => {
          ctx.fillText(line, centerX, currentY + i * 45);
        });
        currentY += snippet.length * 45 + 30;
        ctx.font = "100px serif";
        ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
        ctx.fillText("\u201D", centerX + 280, currentY);
        currentY += 100;

        // 省略號
        ctx.font = "48px sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillText("……", centerX, currentY);
        currentY += 100;

        // 如果有分享連結，顯示 QR 風格的連結區域
        if (includeUrl && shareUrl) {
          currentY += 40;
          ctx.font = "bold 28px sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.fillText("掃描或訪問查看完整故事", centerX, currentY);
          currentY += 60;

          // 連結背景框
          ctx.fillStyle = "rgba(139, 92, 246, 0.2)";
          ctx.fillRect(centerX - 350, currentY - 40, 700, 80);
          ctx.strokeStyle = "rgba(139, 92, 246, 0.8)";
          ctx.lineWidth = 2;
          ctx.strokeRect(centerX - 350, currentY - 40, 700, 80);

          ctx.font = "24px monospace";
          ctx.fillStyle = "#fbbf24";
          ctx.fillText(shareUrl, centerX, currentY + 10);
          currentY += 100;
        }

        // CTA 按鈕
        const ctaY = currentY;
        const ctaWidth = 400;
        const ctaHeight = 80;
        const ctaX = centerX - ctaWidth / 2;
        const ctaGlow = ctx.createLinearGradient(
          ctaX,
          ctaY,
          ctaX + ctaWidth,
          ctaY + ctaHeight
        );
        ctaGlow.addColorStop(0, "rgba(139, 92, 246, 0.5)");
        ctaGlow.addColorStop(1, "rgba(236, 72, 153, 0.5)");
        ctx.fillStyle = ctaGlow;
        ctx.fillRect(ctaX - 4, ctaY - 4, ctaWidth + 8, ctaHeight + 8);
        const ctaBg = ctx.createLinearGradient(
          ctaX,
          ctaY,
          ctaX + ctaWidth,
          ctaY + ctaHeight
        );
        ctaBg.addColorStop(0, "rgba(139, 92, 246, 0.3)");
        ctaBg.addColorStop(1, "rgba(236, 72, 153, 0.3)");
        ctx.fillStyle = ctaBg;
        ctx.fillRect(ctaX, ctaY, ctaWidth, ctaHeight);
        ctx.strokeStyle = "rgba(139, 92, 246, 0.8)";
        ctx.lineWidth = 2;
        ctx.strokeRect(ctaX, ctaY, ctaWidth, ctaHeight);
        ctx.font = "bold 28px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText("查看完整故事", centerX, ctaY + 50);

        // 底部品牌
        ctx.font = "24px sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText("nyx-ai.net", centerX, height - 80);

        resolve(canvas);
      });
    },
    [extractContextTitle, extractTags, extractStorySnippet, shareUrl]
  );

  // 下載圖片
  const handleDownload = useCallback(
    async (includeUrl = true) => {
      setIsGenerating(true);
      try {
        const canvas = await generateCard(includeUrl);
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
    },
    [generateCard]
  );

  // 複製圖片
  const handleCopyImage = useCallback(
    async (includeUrl = true) => {
      setIsGenerating(true);
      try {
        const canvas = await generateCard(includeUrl);
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
              new ClipboardItem({ "image/png": blob }),
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
    },
    [generateCard]
  );

  // 複製連結
  const handleCopyUrl = useCallback(async () => {
    if (!shareUrl) {
      toast.error("請先保存故事");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setUrlCopied(true);
      toast.success("連結已複製");
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      toast.error("複製失敗");
    }
  }, [shareUrl]);

  // 複製文字（適合微信/小紅書）
  const handleCopyText = useCallback(async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setTextCopied(true);
      toast.success("分享文字已複製");
      setTimeout(() => setTextCopied(false), 2000);
    } catch (err) {
      toast.error("複製失敗");
    }
  }, [generateShareText]);

  // 原生分享（Web Share API）
  const handleNativeShare = useCallback(async () => {
    // 如果沒有分享連結，直接打開分享對話框
    if (!shareUrl) {
      console.log("[StoryShareCard] No shareUrl, opening dialog");
      setShowShareDialog(true);
      return;
    }

    const title = extractContextTitle();
    const text = generateShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `【${title}】| NyxAI`,
          text: text,
          url: shareUrl,
        });
        toast.success("分享成功");
      } catch (err) {
        // 用戶取消分享不顯示錯誤
        if ((err as Error).name !== "AbortError") {
          console.error("Share error:", err);
        }
      }
    } else {
      // 不支援 Web Share API，打開分享對話框
      setShowShareDialog(true);
    }
  }, [shareUrl, extractContextTitle, generateShareText]);

  // 保存並獲取分享連結
  const handleSaveAndGetUrl = useCallback(async () => {
    if (!storyContent) {
      toast.error("沒有故事內容");
      return;
    }

    setIsSaving(true);
    console.log("[StoryShareCard] Starting save...");
    
    try {
      // 保存故事
      const saveResult = await saveStory({
        title: storyTitle || extractContextTitle(),
        content: storyContent,
        roles: [], // 角色信息需要從父組件傳入
        is_public: true,
      });

      console.log("[StoryShareCard] Save result:", saveResult);

      if (saveResult.error) {
        toast.error(saveResult.error);
        return;
      }

      if (!saveResult.story) {
        toast.error("保存失敗：沒有返回故事數據");
        return;
      }

      // 獲取分享連結
      console.log("[StoryShareCard] Getting share URL for story:", saveResult.story.id);
      const shareResult = await shareStory(saveResult.story.id);
      
      console.log("[StoryShareCard] Share result:", shareResult);

      if (shareResult.error) {
        toast.error(shareResult.error);
        return;
      }

      if (!shareResult.shareId) {
        toast.error("獲取分享連結失敗");
        return;
      }

      const url = `${window.location.origin}/share/${shareResult.shareId}`;
      console.log("[StoryShareCard] Generated URL:", url);
      
      onShareUrlChange?.(url);
      toast.success("故事已保存，可以分享了！");
    } catch (error) {
      console.error("[StoryShareCard] Save and share error:", error);
      toast.error("保存失敗，請重試");
    } finally {
      setIsSaving(false);
    }
  }, [storyContent, storyTitle, extractContextTitle, onShareUrlChange]);

  return (
    <>
      {/* 主分享按鈕 - 總是打開分享對話框 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          console.log("[StoryShareCard] Share button clicked, shareUrl:", shareUrl);
          setShowShareDialog(true);
        }}
        className="nyx-text-muted hover:nyx-text-primary h-7 px-2"
      >
        <Share2 className="w-3 h-3 mr-1" />
        分享
      </Button>

      {/* 分享選項對話框 */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="nyx-surface nyx-border max-w-md">
          <DialogHeader>
            <DialogTitle className="nyx-text-primary">分享故事</DialogTitle>
            <DialogDescription className="sr-only">
              選擇分享方式
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 保存獲取連結按鈕 */}
            {!shareUrl && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-center">
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  保存故事以獲取分享連結
                </p>
                <Button
                  onClick={handleSaveAndGetUrl}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      保存並獲取連結
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 連結區域 */}
            {shareUrl && (
              <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    分享連結
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 rounded bg-black/30 text-sm text-[var(--text-primary)] font-mono truncate">
                    {shareUrl}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyUrl}
                    className="border-purple-500/30"
                  >
                    {urlCopied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* 分享選項 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 複製文字（微信/小紅書） */}
              <Button
                variant="outline"
                onClick={handleCopyText}
                className="h-auto py-3 border-purple-500/30 hover:bg-purple-500/10 flex flex-col gap-1"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">複製文字</span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  微信/小紅書
                </span>
              </Button>

              {/* 下載圖片 */}
              <Button
                variant="outline"
                onClick={() => handleDownload(true)}
                disabled={isGenerating}
                className="h-auto py-3 border-purple-500/30 hover:bg-purple-500/10 flex flex-col gap-1"
              >
                <Download className="w-5 h-5" />
                <span className="text-xs">
                  {isGenerating ? "生成中..." : "下載圖片"}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  IG / Facebook
                </span>
              </Button>

              {/* 複製圖片 */}
              <Button
                variant="outline"
                onClick={() => handleCopyImage(true)}
                disabled={isGenerating}
                className="h-auto py-3 border-purple-500/30 hover:bg-purple-500/10 flex flex-col gap-1"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                <span className="text-xs">
                  {copied ? "已複製" : "複製圖片"}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  X / Threads
                </span>
              </Button>

              {/* Twitter/X Intent */}
              {shareUrl && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `${extractContextTitle()} | NyxAI`
                    );
                    const url = encodeURIComponent(shareUrl);
                    window.open(
                      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
                      "_blank"
                    );
                  }}
                  className="h-auto py-3 border-purple-500/30 hover:bg-purple-500/10 flex flex-col gap-1"
                >
                  <AtSign className="w-5 h-5" />
                  <span className="text-xs">分享到 X</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Twitter
                  </span>
                </Button>
              )}
            </div>

            {/* 提示 */}
            <div className="text-xs text-[var(--text-muted)] text-center">
              {shareUrl
                ? "選擇適合的方式分享到社交平台"
                : "請先保存故事以獲取分享連結"}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
