import 'dotenv/config';
import { pool } from './store.js';
import { events, sports, stories } from './demo.js';
if (!pool) throw new Error('Use DATA_MODE=postgres');
const client = await pool.connect();
try {
  await client.query('BEGIN');
  for (const [table, items] of [['sports', sports], ['events', events], ['athlete_stories', stories]] as const) {
    for (const item of items) {
      const keys = Object.keys(item);
      // Only replace the three original fictional profiles. Preserve edited or real profiles.
      const conflict = table === 'athlete_stories'
        ? `DO UPDATE SET ${keys.filter(k => k !== 'id').map(k => `${k}=EXCLUDED.${k}`).join(',')}
           WHERE athlete_stories.is_demo=true AND athlete_stories.name IN ('Clara Ferreira','Lia Santos','Marina Alves')`
        : 'DO NOTHING';
      await client.query(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map((_,i) => '$'+(i+1)).join(',')}) ON CONFLICT(id) ${conflict}`, Object.values(item));
    }
  }
  await client.query('COMMIT');
  console.log('Demo events and sourced athlete profiles ready');
} catch(error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
