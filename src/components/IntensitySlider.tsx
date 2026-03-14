"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { getIntensityDescription, validateIntensity } from "@/lib/intensity-config";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntensitySliderProps {
  value: number;
  onChange: (value: number) => void;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function IntensitySlider({ 
  value, 
  onChange, 
  showLabel = true,
  size = "md" 
}: IntensitySliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const validatedValue = validateIntensity(value);
  const description = getIntensityDescription(validatedValue);
  
  const handleChange = (values: number[]) => {
    onChange(values[0]);
  };

  // 計算漸變色位置
  const gradientPosition = (validatedValue - 1) / 9 * 100;

  return (
    <div className={cn(
      "w-full",
      size === "sm" && "space-y-2",
      size === "md" && "space-y-3",
      size === "lg" && "space-y-4"
    )}>
      {/* 標題與數值顯示 */}
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={cn(
              "transition-colors duration-300",
              size === "sm" && "w-3.5 h-3.5",
              size === "md" && "w-4 h-4", 
              size === "lg" && "w-5 h-5",
              validatedValue <= 3 && "text-pink-400",
              validatedValue > 3 && validatedValue <= 6 && "text-purple-400",
              validatedValue > 6 && validatedValue <= 8 && "text-teal-400",
              validatedValue > 8 && "text-orange-400"
            )} />
            <span className={cn(
              "font-medium text-[var(--text-primary)]",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-base"
            )}>
              刺激度
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-bold bg-gradient-to-r bg-clip-text text-transparent",
              description.color,
              size === "sm" && "text-sm",
              size === "md" && "text-base",
              size === "lg" && "text-lg"
            )}>
              {validatedValue}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r text-white",
              description.color
            )}>
              {description.label}
            </span>
          </div>
        </div>
      )}

      {/* 滑條 */}
      <div className="relative">
        <Slider
          value={[validatedValue]}
          onValueChange={handleChange}
          min={1}
          max={10}
          step={1}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          className={cn(
            "w-full cursor-pointer",
            isDragging && "cursor-grabbing"
          )}
        />
        
        {/* 刻度標記 */}
        <div className="flex justify-between mt-1 px-1">
          {[1, 5, 10].map((mark) => (
            <span 
              key={mark}
              className={cn(
                "text-[10px] transition-colors",
                validatedValue === mark 
                  ? "text-[var(--accent)] font-medium" 
                  : "text-[var(--text-muted)]"
              )}
            >
              {mark}
            </span>
          ))}
        </div>
      </div>

      {/* 描述文字 */}
      {showLabel && (
        <p className={cn(
          "text-[var(--text-secondary)] transition-all duration-300",
          size === "sm" && "text-[10px]",
          size === "md" && "text-xs",
          size === "lg" && "text-sm"
        )}>
          {description.shortDesc}
        </p>
      )}
    </div>
  );
}

// 簡化版顯示（僅顯示標籤）
export function IntensityBadge({ level }: { level: number }) {
  const validatedLevel = validateIntensity(level);
  const description = getIntensityDescription(validatedLevel);
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r text-white",
      description.color
    )}>
      <Flame className="w-3 h-3" />
      {description.label}
    </span>
  );
}

// 靜態顯示條（用於展示，不可調節）
export function IntensityBar({ level }: { level: number }) {
  const validatedLevel = validateIntensity(level);
  const description = getIntensityDescription(validatedLevel);
  
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          刺激度
        </span>
        <IntensityBadge level={validatedLevel} />
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            description.color
          )}
          style={{ width: `${validatedLevel * 10}%` }}
        />
      </div>
    </div>
  );
}
