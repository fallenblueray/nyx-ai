import { NextResponse } from 'next/server'
import { officialTemplates } from '@/data/templates'
import { createClient } from '@/lib/supabase'

// GET: Public endpoint for templates (used by TemplateSelector)
export async function GET() {
  try {
    // Try Supabase first
    try {
      const supabase = createClient()
      const { data: templates, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('id', { ascending: true })

      if (!error && templates && templates.length > 0) {
        // Transform to Template type format
        const formattedTemplates = templates.map((t: Record<string, unknown>) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          description: t.description,
          category: t.category,
          tags: t.tags || [],
          promptBuilder: {
            systemPrompt: t.system_prompt || '',
            baseScenario: t.base_scenario,
            writingStyle: t.writing_style,
            atmosphere: t.atmosphere,
            pace: t.pace || 'medium',
            intensity: t.intensity || 'moderate'
          },
          isPremium: t.is_premium,
          wordCostMultiplier: t.word_cost_multiplier || 1,
          isActive: t.is_active
        }))

        return NextResponse.json({
          success: true,
          data: formattedTemplates,
          count: formattedTemplates.length,
          source: 'supabase'
        })
      }
    } catch (supabaseError) {
      console.log('[Templates API] Supabase error:', supabaseError)
    }

    // Fallback to local templates
    console.log('[Templates API] Using local templates')
    return NextResponse.json({
      success: true,
      data: officialTemplates,
      count: officialTemplates.length,
      source: 'local'
    })

  } catch (error) {
    console.error('[Templates API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
