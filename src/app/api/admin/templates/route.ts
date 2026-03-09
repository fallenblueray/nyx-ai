import { NextResponse } from 'next/server'
import { officialTemplates } from '@/data/templates'
import { writeFileSync } from 'fs'
import { join } from 'path'

function verifyAdmin(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'nyx-admin-2024'
  return password === adminPassword
}

export async function GET() {
  try {
    console.log('[Admin Templates API] GET request')
    return NextResponse.json({
      success: true,
      data: officialTemplates,
      count: officialTemplates.length
    })
  } catch (error) {
    console.error('[Admin Templates API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { templates, password } = body

    if (!verifyAdmin(password)) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    if (!Array.isArray(templates) || templates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid templates data' },
        { status: 400 }
      )
    }

    const templatesPath = join(process.cwd(), 'src', 'data', 'templates.ts')
    const fs = await import('fs')
    let fileContent = fs.readFileSync(templatesPath, 'utf-8')
    let updatedCount = 0

    for (const template of templates) {
      const { id, ...updates } = template
      if (!id) continue

      // Escape special characters for regex
      const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const searchPattern = "id: '" + escapedId + "'"
      const index = fileContent.indexOf(searchPattern)

      if (index === -1) continue

      // Find end of this template
      let endIndex = fileContent.indexOf("id: '", index + searchPattern.length)
      if (endIndex === -1) {
        endIndex = fileContent.lastIndexOf(']') - 1
      }

      let templateBlock = fileContent.substring(index, endIndex)

      // Update fields using simple string replacement
      if (updates.baseScenario) {
        const oldValueMatch = templateBlock.match(/baseScenario: '([^']*)'/)
        if (oldValueMatch) {
          const escapedValue = updates.baseScenario.replace(/'/g, "\\'")
          templateBlock = templateBlock.replace(
            oldValueMatch[0],
            "baseScenario: '" + escapedValue + "'"
          )
        }
      }

      if (updates.writingStyle) {
        const oldValueMatch = templateBlock.match(/writingStyle: '([^']*)'/)
        if (oldValueMatch) {
          const escapedValue = updates.writingStyle.replace(/'/g, "\\'")
          templateBlock = templateBlock.replace(
            oldValueMatch[0],
            "writingStyle: '" + escapedValue + "'"
          )
        }
      }

      if (updates.atmosphere) {
        const oldValueMatch = templateBlock.match(/atmosphere: '([^']*)'/)
        if (oldValueMatch) {
          const escapedValue = updates.atmosphere.replace(/'/g, "\\'")
          templateBlock = templateBlock.replace(
            oldValueMatch[0],
            "atmosphere: '" + escapedValue + "'"
          )
        }
      }

      if (updates.name) {
        const oldValueMatch = templateBlock.match(/name: '([^']*)'/)
        if (oldValueMatch) {
          const escapedValue = updates.name.replace(/'/g, "\\'")
          templateBlock = templateBlock.replace(
            oldValueMatch[0],
            "name: '" + escapedValue + "'"
          )
        }
      }

      if (updates.description) {
        const oldValueMatch = templateBlock.match(/description: '([^']*)'/)
        if (oldValueMatch) {
          const escapedValue = updates.description.replace(/'/g, "\\'")
          templateBlock = templateBlock.replace(
            oldValueMatch[0],
            "description: '" + escapedValue + "'"
          )
        }
      }

      // Replace in original content
      fileContent = fileContent.substring(0, index) + templateBlock + fileContent.substring(endIndex)
      updatedCount++
    }

    fs.writeFileSync(templatesPath, fileContent, 'utf-8')
    console.log('[Admin Templates API] Updated', updatedCount, 'templates')

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      message: 'Updated ' + updatedCount + ' templates. Redeploy to apply changes.'
    })
  } catch (error) {
    console.error('[Admin Templates API] Update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update templates' },
      { status: 500 }
    )
  }
}
