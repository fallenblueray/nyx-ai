/**
 * Word 導出功能
 * 使用 docx-js 生成 .docx 文件
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

export interface ExportMetadata {
  title: string
  author?: string
  createdAt: Date
  theme?: string
  wordCount: number
}

export async function exportStoryToWord(
  content: string,
  metadata: ExportMetadata
): Promise<Blob> {
  // 將內容分割成段落
  const paragraphs = content.split('\n\n').filter(p => p.trim())

  // 創建文檔內容
  const docChildren = [
    // 標題
    new Paragraph({
      text: metadata.title || '無標題故事',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // 元信息
    new Paragraph({
      children: [
        new TextRun({
          text: `創建時間：${metadata.createdAt.toLocaleDateString('zh-TW')}`,
          size: 20,
          color: '666666'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    metadata.theme && new Paragraph({
      children: [
        new TextRun({
          text: `風格主題：${metadata.theme}`,
          size: 20,
          color: '666666'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // 分隔線（使用空段落代替）
    new Paragraph({
      text: '─────────────────',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
      children: [
        new TextRun({
          text: '─────────────────',
          color: 'cccccc',
          size: 20
        })
      ]
    }),

    // 正文段落
    ...paragraphs.map(text =>
      new Paragraph({
        children: [
          new TextRun({
            text: text.trim(),
            size: 24, // 12pt
            font: 'Noto Serif TC'
          })
        ],
        spacing: { after: 200, line: 360 },
        alignment: AlignmentType.JUSTIFIED
      })
    ),

    // 尾註
    new Paragraph({
      text: '',
      spacing: { before: 600 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `—— 由 NyxAI 生成 | 總字數：${metadata.wordCount.toLocaleString()} 字 ——`,
          size: 18,
          color: '999999',
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER
    })
  ].filter(Boolean) as Paragraph[]

  // 創建文檔
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children: docChildren
    }]
  })

  // 生成 Blob
  const blob = await Packer.toBlob(doc)
  return blob
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
