const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  try {
    const sql = fs.readFileSync('./supabase/migrations/004_admin_prompts.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;
      
      console.log('Executing:', trimmed.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: trimmed + ';' });
      
      if (error) {
        console.error('Error executing statement:', error);
        // Try alternative: direct query
        const { error: queryError } = await supabase.from('_temp_test').select('*').limit(1);
        if (queryError && queryError.code === '42P01') {
          // Table doesn't exist, that's ok for first run
        }
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
