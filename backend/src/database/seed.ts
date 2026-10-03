import 'dotenv/config';
import { pool } from './store.js';
import { events, sports, stories } from './demo.js';
if (!pool) throw new Error('Use DATA_MODE=postgres');
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Remove only the six original, explicitly fictional demo events.
  await client.query(`DELETE FROM events WHERE is_demo=true AND id IN ('1','2','3','4','5','6')
    AND name=ANY($1::text[])`, [['Festival Primeiro Passe','Clínica de Vôlei em Movimento','Encontro Universitário de Basquete','Pista Aberta','Rodas & Novos Caminhos','Circuito Esporte para Todas']]);
  for (const [table, items] of [['sports', sports], ['events', events], ['athlete_stories', stories]] as const) {
    for (const item of items) {
      const keys = Object.keys(item);
      // Only replace the three original fictional profiles. Preserve edited or real profiles.
      const conflict = table === 'athlete_stories'
        ? `DO UPDATE SET ${keys.filter(k => k !== 'id').map(k => `${k}=EXCLUDED.${k}`).join(',')}
           WHERE athlete_stories.is_demo=true AND athlete_stories.name IN ('Clara Ferreira','Lia Santos','Marina Alves')`
        : table === 'events'
          ? `DO UPDATE SET ${keys.filter(k => k !== 'id').map(k => `${k}=EXCLUDED.${k}`).join(',')}
             WHERE events.registration_checked_at IS NULL OR events.registration_checked_at < EXCLUDED.registration_checked_at`
          : 'DO NOTHING';
      await client.query(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map((_,i) => '$'+(i+1)).join(',')}) ON CONFLICT(id) ${conflict}`, Object.values(item));
    }
  }
  await client.query('COMMIT');
  console.log('Sourced events and athlete profiles ready');
} catch(error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
