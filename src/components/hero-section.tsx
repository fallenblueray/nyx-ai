import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <main className="overflow-x-hidden">
      <section>
        <div className="py-28 md:pb-32 lg:pb-36 lg:pt-44">
          <div className="relative mx-auto flex max-w-4xl flex-col px-6 lg:px-12">
            <div className="mx-auto max-w-3xl text-center">
              {/* Pill badge tagline */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-foreground/[0.08] bg-secondary/40 px-5 py-2 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium tracking-wider text-foreground/75">
                  {"夜色AI \u00B7 \u7121\u9650\u5236 AI \u5287\u60C5\u751F\u6210"}
                </span>
              </div>

              {/* Main headline - solid white, high contrast, drop shadow */}
              <h1
                className="mt-8 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-[4.25rem]"
                style={{
                  color: "#FFFFFF",
                  textShadow: "0 2px 20px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)",
                }}
              >
                {"\u4E00\u53E5\u8A71\uFF0C\u7ACB\u523B\u751F\u6210\u4F60\u7684\u5C08\u5C6C\u6545\u4E8B\u3002"}
              </h1>

              {/* Subheadline */}
              <div className="mx-auto mt-6 max-w-lg space-y-1">
                <p className="text-pretty text-base leading-relaxed text-foreground/65 md:text-lg">
                  {"\u5C08\u70BA\u6210\u4EBA\u6253\u9020\u7684 AI \u5287\u60C5\u751F\u6210\u5E73\u53F0\u3002"}
                </p>
                <p className="text-pretty text-base leading-relaxed text-foreground/65 md:text-lg">
                  {"\u8F38\u5165\u4E00\u53E5\u9748\u611F\uFF0C\u5373\u523B\u5C55\u958B\u5B8C\u6574\u5287\u60C5\u3002"}
                </p>
                <p className="text-pretty text-base leading-relaxed text-foreground/65 md:text-lg">
                  {"\u7121\u9700\u767B\u5165\uFF0C\u7ACB\u5373\u7372\u5F97 8000 \u5B57\u514D\u8CBB\u9AD4\u9A57\u3002"}
                </p>
              </div>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="animate-pulse-glow h-14 rounded-full px-10 text-base font-semibold transition-all duration-300 hover:scale-[1.04]"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.55 0.2 270), oklch(0.5 0.22 290))",
                    color: "#FFFFFF",
                  }}
                >
                  <Link href="#start">
                    <span className="text-nowrap">
                      {"\u7ACB\u5373\u514D\u8CBB\u751F\u6210"}
                    </span>
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="h-14 rounded-full border border-foreground/[0.1] bg-secondary/30 px-10 text-base font-medium text-foreground/70 backdrop-blur-lg transition-all duration-300 hover:border-foreground/20 hover:bg-secondary/50 hover:text-foreground/90"
                >
                  <Link href="#demo">
                    <span className="text-nowrap">
                      {"\u76F4\u63A5\u9AD4\u9A57 8000 \u5B57"}
                    </span>
                  </Link>
                </Button>
              </div>

              {/* Urgency text */}
              <p className="mt-5 text-sm font-medium text-foreground/55">
                {"\u73FE\u5728\u958B\u59CB\uFF0C\u7ACB\u5373\u5275\u4F5C\u3002"}
              </p>

              {/* Social proof */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="flex -space-x-1">
                  {[0.6, 0.5, 0.45, 0.55].map((opacity, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded-full border border-background"
                      style={{
                        background: `oklch(${opacity} 0.18 ${260 + i * 15})`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-foreground/50">
                  {"\u5DF2\u751F\u6210\u6578\u842C\u7BC7\u6C89\u6D78\u5F0F\u6545\u4E8B"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
