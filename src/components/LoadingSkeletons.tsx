'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function StoryOutputSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Title skeleton */}
      <Skeleton className="h-8 w-1/3" />
      
      {/* Content skeleton - multiple paragraphs */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export function TopicSelectorSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-5 w-20" />
      <div className="grid grid-cols-2 gap-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

export function CharacterCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-5 w-24" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}

export function HistoryItemSkeleton() {
  return (
    <div className="p-3 border-b border-slate-800">
      <Skeleton className="h-5 w-1/2 mb-2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

export function GenerateButtonSkeleton() {
  return (
    <Skeleton className="h-12 w-full" />
  )
}
