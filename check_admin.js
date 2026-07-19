import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mrejoaglvkfkxjpqpeag.supabase.co';
const supabaseAnonKey = 'sb_publishable_tMqmZ1zn-6O503BeLjh0Nw_TpdkhEJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdmin() {
  try {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, name, email, role, code, created_at');
    
    if (error) {
      console.error('Erreur:', error.message);
      console.error('Détail:', JSON.stringify(error, null, 2));
      return;
    }
    
    if (!agents || agents.length === 0) {
      console.log('❌ Aucun agent trouvé. Les tables semblent vides ou le schema SQL n\'a pas encore été exécuté.');
      return;
    }
    
    console.log(`✅ ${agents.length} agent(s) trouvé(s) dans la base de données:`);
    agents.forEach(a => {
      console.log(`  - [${a.role.toUpperCase()}] ${a.name} | ${a.email} | code: ${a.code}`);
    });
  } catch (err) {
    console.error('Erreur inattendue:', err.message);
  }
}

checkAdmin();
