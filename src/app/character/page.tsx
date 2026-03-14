import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "NyxAI 官方角色 | 夜景AI",
  description: "NyxAI 官方虛擬角色 - 夜景AI的故事創作夥伴",
  openGraph: {
    title: "NyxAI 官方角色",
    description: "NyxAI 官方虛擬角色 - 夜景AI的故事創作夥伴",
    images: ["/characters/nyxai-mascot.jpg"],
  },
};

export default function CharacterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-2">NyxAI 官方角色</h1>
        <p className="text-gray-400 mb-8">夜景AI的故事創作夥伴</p>
        
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <Image
            src="/characters/nyxai-mascot.jpg"
            alt="NyxAI Official Character"
            width={800}
            height={800}
            className="w-full h-auto"
            priority
          />
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>© 2025 架空領域 - NyxAI</p>
          <p className="mt-2">此圖片為 NyxAI 官方角色參考圖</p>
        </div>
      </div>
    </div>
  );
}
