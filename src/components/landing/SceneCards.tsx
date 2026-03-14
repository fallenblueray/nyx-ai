"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

// 7個預設場景 - 點擊直接生成
const SCENES = [
  {
    id: "teacher",
    title: "女老師的補習課",
    desc: "今天補習只有你一個人。她把門鎖上了。",
    color: "from-purple-500/20 to-pink-500/20",
    prompt: "今天補習只有你一個人。女老師把門鎖上了，說要給我特別輔導...",
  },
  {
    id: "boss",
    title: "冷艷女上司",
    desc: "深夜加班，女上司突然鎖上了辦公室的門。",
    color: "from-amber-500/20 to-orange-500/20",
    prompt: "深夜加班時，女上司忽然鎖上了辦公室的門。她慢慢走向我，高跟鞋的聲音在寂靜中迴響...",
  },
  {
    id: "neighbor",
    title: "寂寞鄰居",
    desc: "隔壁的少婦邀請我進去喝杯咖啡。",
    color: "from-green-500/20 to-emerald-500/20",
    prompt: "隔壁的少婦說她家裡的燈壞了，邀請我進去幫忙。進門後她說丈夫出差了...",
  },
  {
    id: "childhood",
    title: "青梅竹馬",
    desc: "多年不見的青梅竹馬，再見面時已經變了一個人。",
    color: "from-blue-500/20 to-cyan-500/20",
    prompt: "多年不見的青梅竹馬突然出現在我面前。她變得成熟美麗，說一直喜歡我...",
  },
  {
    id: "senior",
    title: "校花學姐",
    desc: "學姐約我放學後去社團教室，說有話想對我說。",
    color: "from-rose-500/20 to-red-500/20",
    prompt: "校花學姐約我放學後去社團教室。到了之後發現只有她一個人，她說喜歡我很久了...",
  },
  {
    id: "firstlove",
    title: "初戀重逢",
    desc: "偶然在酒吧遇到初戀，她喝得有點多。",
    color: "from-violet-500/20 to-fuchsia-500/20",
    prompt: "在酒吧偶然遇到初戀。她喝得有點多，靠在我肩上說這些年一直忘不了我...",
  },
  {
    id: "friend",
    title: "朋友變情人",
    desc: "多年的好朋友，今晚她說不想只做朋友了。",
    color: "from-orange-500/20 to-amber-500/20",
    prompt: "多年的異性好友今晚約我出來。她說這些年來一直喜歡我，不想只做朋友了...",
  },
];

export function SceneCards() {
  return (
    <section className="py-12 px-4">
      <div className="mx-auto max-w-5xl">
        {/* 標題 */}
        <div className="mb-8 text-center">
          <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-white md:text-3xl">
            <Sparkles className="h-6 w-6 text-orange-400" />
            選一個故事場景
          </h2>
          <p className="mt-2 text-white/50">點擊即可直接生成，無需填寫提示詞</p>
        </div>

        {/* 場景卡片網格 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {SCENES.map((scene) => (
            <Link
              key={scene.id}
              href={`/app?prompt=${encodeURIComponent(scene.prompt)}`}
              className="group"
            >
              <div
                className={`flex h-full flex-col rounded-xl border border-white/10 bg-gradient-to-br ${scene.color} p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:scale-[1.03] hover:shadow-lg hover:shadow-purple-500/10`}
              >
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 md:text-base">
                  {scene.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/60">
                  「{scene.desc}」
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
