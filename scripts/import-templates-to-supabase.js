/**
 * Import templates from templates.ts to Supabase
 * Run: node scripts/import-templates-to-supabase.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase credentials');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import templates from data file
async function importTemplates() {
    try {
        // Read templates from JSON file (CJS compatible)
        const fs = require('fs');
        const path = require('path');
        
        const templatesPath = path.join(__dirname, 'import-templates-manual.json');
        const templatesData = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));
        const officialTemplates = templatesData.templates;
        
        console.log(`[Import Templates] Found ${officialTemplates.length} templates`);

        // Transform templates to database format
        const dbTemplates = officialTemplates.map(t => ({
            id: t.id,
            slug: t.slug,
            name: t.name,
            category: t.category,
            description: t.description,
            base_scenario: t.promptBuilder.baseScenario,
            writing_style: t.promptBuilder.writingStyle,
            atmosphere: t.promptBuilder.atmosphere,
            pace: t.promptBuilder.pace,
            intensity: t.promptBuilder.intensity,
            is_premium: t.isPremium || false,
            is_active: t.isActive !== false,
            tags: t.tags || [],
            word_cost_multiplier: t.wordCostMultiplier || 1.0,
            created_at: t.createdAt || new Date().toISOString(),
            updated_at: t.updatedAt || new Date().toISOString()
        }));

        // Upsert to Supabase
        const { data, error } = await supabase
            .from('templates')
            .upsert(dbTemplates, { 
                onConflict: 'id',
                ignoreDuplicates: false 
            });

        if (error) {
            console.error('[Import Templates] Error:', error);
            process.exit(1);
        }

        console.log(`[Import Templates] Successfully imported ${dbTemplates.length} templates`);
        
        // Show summary
        const categories = {};
        dbTemplates.forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + 1;
        });
        console.log('[Import Templates] By category:', categories);
        
    } catch (error) {
        console.error('[Import Templates] Error:', error);
        process.exit(1);
    }
}

importTemplates();
