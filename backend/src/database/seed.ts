import 'dotenv/config';
import {pool} from './store.js';
import {events,sports,stories} from './demo.js';
if(!pool)throw new Error('Use DATA_MODE=postgres');
for(const [table,items] of [['sports',sports],['events',events],['athlete_stories',stories]] as const){for(const item of items){const keys=Object.keys(item);await pool.query(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')}) ON CONFLICT(id) DO NOTHING`,Object.values(item));}}
await pool.end();
console.log('Fictional demo data ready');
