import { NextResponse } from 'next/server'
import { officialTemplates } from '@/data/templates'
import { createAdminClient } from '@/lib/supabase-admin'

function verifyAdmin(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'nyx-admin-2024'
  return password === adminPassword
}

// GET: Fetch templates from Supabase (fallback to local file)
export async function GET() {
  try {
    console.log('[Admin Templates API] GET request')
    
    // Try Supabase first
    try {
      const supabase = createAdminClient()
      const { data: templates, error } = await supabase
        .from('templates')
        .select('*')
        .order('category', { ascending: true })
        .order('id', { ascending: true })

      if (!error && templates && templates.length > 0) {
        // Transform to frontend format
        const formattedTemplates = templates.map((t: any) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          category: t.category,
          description: t.description,
          baseScenario: t.base_scenario,
          writingStyle: t.writing_style,
          atmosphere: t.atmosphere,
          pace: t.pace || 'medium',
          intensity: t.intensity || 'moderate',
          isPremium: t.is_premium,
          isActive: t.is_active,
          tags: t.tags || []
        }))

        return NextResponse.json({
          success: true,
          data: formattedTemplates,
          count: formattedTemplates.length,
          source: 'supabase'
        })
      }
    } catch (supabaseError) {
      console.log('[Admin Templates API] Supabase unavailable, using local:', supabaseError)
    }

    // Fallback to local templates
    console.log('[Admin Templates API] Using local templates')
    return NextResponse.json({
      success: true,
      data: officialTemplates.map(t => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        category: t.category,
        description: t.description,
        baseScenario: t.promptBuilder?.baseScenario || '',
        writingStyle: t.promptBuilder?.writingStyle || '',
        atmosphere: t.promptBuilder?.atmosphere || '',
        pace: t.promptBuilder?.pace || 'medium',
        intensity: t.promptBuilder?.intensity || 'moderate',
        isPremium: t.isPremium,
        isActive: t.isActive,
        tags: t.tags || []
      })),
      count: officialTemplates.length,
      source: 'local'
    })

  } catch (error) {
    console.error('[Admin Templates API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST: Update templates in Supabase
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

    const supabase = createAdminClient()
    let updatedCount = 0
    let errorDetails: string[] = []

    for (const template of templates) {
      const { id, ...updates } = template
      if (!id) continue

      // Transform camelCase to snake_case
      const dbUpdates: any = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.category !== undefined) dbUpdates.category = updates.category
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.baseScenario !== undefined) dbUpdates.base_scenario = updates.baseScenario
      if (updates.writingStyle !== undefined) dbUpdates.writing_style = updates.writingStyle
      if (updates.atmosphere !== undefined) dbUpdates.atmosphere = updates.atmosphere
      if (updates.pace !== undefined) dbUpdates.pace = updates.pace
      if (updates.intensity !== undefined) dbUpdates.intensity = updates.intensity
      if (updates.isPremium !== undefined) dbUpdates.is_premium = updates.isPremium
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

      if (Object.keys(dbUpdates).length === 0) continue

      const { error } = await supabase
        .from('templates')
        .update(dbUpdates)
        .eq('id', id)

      if (error) {
        console.error(`[Admin Templates API] Failed to update ${id}:`, error)
        errorDetails.push(`${id}: ${error.message}`)
      } else {
        updatedCount++
        console.log(`[Admin Templates API] Updated: ${id}`)
      }
    }

    console.log('[Admin Templates API] Updated', updatedCount, 'templates')

    return NextResponse.json({
      success: errorDetails.length === 0,
      updated: updatedCount,
      errors: errorDetails.length > 0 ? errorDetails : undefined,
      message: errorDetails.length === 0 
        ? `Successfully updated ${updatedCount} templates`
        : `Updated ${updatedCount} templates with errors`
    })

  } catch (error) {
    console.error('[Admin Templates API] Update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update templates: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
