"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

export function UserMenu() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return (
      <div className="text-sm text-slate-400">載入中...</div>
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{session.user.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4" />
          <span className="ml-1 hidden sm:inline">登出</span>
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push("/auth/signin")}
      className="border-slate-700 text-slate-300 hover:bg-slate-800"
    >
      <LogIn className="w-4 h-4" />
      <span className="ml-1">登入</span>
    </Button>
  )
}
