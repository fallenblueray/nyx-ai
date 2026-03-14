"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Share2, Link2, Twitter, MessageCircle, Loader2 } from "lucide-react";
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
}

// 病毒級 Hook 文案池
const VIRAL_HOOKS = [
  "我讓 AI 寫這個故事，結果完全失控了",
  "AI 寫的故事太離譜了",
  "這個劇情我沒想到",
  "讓 AI 寫了個故事，看完沉默了",
  "試了一下 AI 寫作，這個結局...",
];

export function StoryShareCard({
  storyContent,
  storyTitle = "AI 生成故事",
  templateName = "神秘故事",
}: StoryShareCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // 提取情境標題
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

  // 生成分享文字
  const generateShareText = useCallback(() => {
    const hook = VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)];
    const title = extractContextTitle();
    return `${hook}\n\n【${title}】\n\n讓 AI 為你寫故事 👇`;
  }, [extractContextTitle]);

  // 生成故事卡圖片
  const generateCard = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      const width = 1080;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;

      // 背景
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, width, height);

      // 中心放射漸層
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

      // 分隔線
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 200, currentY);
      ctx.lineTo(centerX + 200, currentY);
      ctx.stroke();
      currentY += 80;

      // 故事片段
      const snippet = storyContent
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 5 && l.length < 30 && !l.includes("AI") && !l.includes("生成"))
        .slice(0, 3);

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

      // CTA 按鈥
      const ctaY = currentY;
      const ctaWidth = 400;
      const ctaHeight = 80;
      const ctaX = centerX - ctaWidth / 2;
      const ctaGlow = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaWidth, ctaY + ctaHeight);
      ctaGlow.addColorStop(0, "rgba(139, 92, 246, 0.5)");
      ctaGlow.addColorStop(1, "rgba(236, 72, 153, 0.5)");
      ctx.fillStyle = ctaGlow;
      ctx.fillRect(ctaX - 4, ctaY - 4, ctaWidth + 8, ctaHeight + 8);
      const ctaBg = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaWidth, ctaY + ctaHeight);
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
  }, [extractContextTitle, storyContent]);

  // 打開對話框時生成預覽
  useEffect(() => {
    if (showDialog && !cardPreview) {
      generateCard().then((canvas) => {
        if (canvas) {
          setCardPreview(canvas.toDataURL("image/png"));
        }
      });
    }
  }, [showDialog, cardPreview, generateCard]);

  // 保存并獲取分享連結
  const handleSaveAndGetUrl = useCallback(async () => {
    if (!storyContent) {
      toast.error("沒有故事內容");
      return;
    }

    setIsSaving(true);
    try {
      const saveResult = await saveStory({
        title: storyTitle || extractContextTitle(),
        content: storyContent,
        roles: [],
        is_public: true,
      });

      if (saveResult.error || !saveResult.story) {
        toast.error(saveResult.error || "保存失敗");
        return;
      }

      const shareResult = await shareStory(saveResult.story.id);

      if (shareResult.error || !shareResult.shareId) {
        toast.error(shareResult.error || "獲取分享連結失敗");
        return;
      }

      const url = `${window.location.origin}/share/${shareResult.shareId}`;
      setShareUrl(url);
      toast.success("故事已保存！");
    } catch (error) {
      console.error("Save and share error:", error);
      toast.error("保存失敗，請重試");
    } finally {
      setIsSaving(false);
    }
  }, [storyContent, storyTitle, extractContextTitle]);

  // 複製連結
  const handleCopyUrl = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setUrlCopied(true);
      toast.success("連結已複製");
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      toast.error("複製失敗");
    }
  }, [shareUrl]);

  // 分享到 X
  const shareToX = useCallback(() => {
    if (!shareUrl) {
      toast.error("請先保存故事");
      return;
    }
    const text = encodeURIComponent(generateShareText());
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "width=600,height=400"
    );
  }, [shareUrl, generateShareText]);

  // 分享到 WhatsApp
  const shareToWhatsApp = useCallback(() => {
    if (!shareUrl) {
      toast.error("請先保存故事");
      return;
    }
    const text = encodeURIComponent(generateShareText() + "\n\n" + shareUrl);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [generateShareText, shareUrl]);

  // 分享到微信（複製文字）
  const shareToWeChat = useCallback(() => {
    const text = generateShareText() + "\n\n" + (shareUrl || "");
    navigator.clipboard.writeText(text);
    toast.success("分享文字已複製，請打開微信粘貼");
  }, [generateShareText, shareUrl]);

  // 下載圖片
  const handleDownload = useCallback(() => {
    if (!cardPreview) return;
    const link = document.createElement("a");
    link.download = `nyx-ai-${Date.now()}.png`;
    link.href = cardPreview;
    link.click();
    toast.success("分享卡已下載");
  }, [cardPreview]);

  return (
    <>
      {/* 觸發按鈕 */}
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-1 px-2 py-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        type="button"
      >
        <Share2 className="w-3 h-3" />
        <span>分享</span>
      </button>

      {/* 分享對話框 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="nyx-surface nyx-border max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="nyx-text-primary">分享故事</DialogTitle>
            <DialogDescription className="sr-only">
              分享你的 AI 生成故事到社交媒體
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 故事卡預覽 */}
            {cardPreview && (
              <div className="rounded-lg overflow-hidden border border-[var(--border)]">
                <img 
                  src={cardPreview} 
                  alt="分享卡預覽" 
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* 未保存時顯示保存按鈕 */}
            {!shareUrl ? (
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
                      保存并獲取連結
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                {/* 分享連結 */}
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

                {/* 一鍵分享按鈕 */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={shareToX}
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    X
                  </Button>
                  <Button
                    onClick={shareToWhatsApp}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </Button>
                  <Button
                    onClick={shareToWeChat}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    微信
                  </Button>
                </div>
                
                {/* 提示文字 */}
                <p className="text-xs text-[var(--text-muted)] text-center">
                  點擊按鈕直接分享，或下載上方圖片手動分享
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
