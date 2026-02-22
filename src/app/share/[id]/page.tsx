import { getSharedStory } from "@/app/actions/story"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let story = null
  let error = ''
  try {
    const result = await getSharedStory(id)
    story = result.story ?? null
    error = result.error ?? ''
  } catch (e) {
    console.error('SharePage error:', e)
    error = '載入故事時發生錯誤'
  }

  if (error || !story) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">找不到故事</h1>
          <p className="text-slate-400 mb-4">{error || "此故事可能不存在或未公開"}</p>
          <Link href="/">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-slate-400 hover:text-slate-200">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首頁
          </Button>
        </Link>
        
        <article className="prose prose-invert prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-white mb-8">
            {story.title || "無標題"}
          </h1>
          <ReactMarkdown>{story.content}</ReactMarkdown>
        </article>
        
        <footer className="mt-12 pt-6 border-t border-slate-800 text-center text-slate-500 text-sm">
          <p>由 NyxAI 驅動</p>
          <Link href="/app" className="text-blue-400 hover:underline">
            開始你的創作
          </Link>
        </footer>
      </div>
    </main>
  )
}
