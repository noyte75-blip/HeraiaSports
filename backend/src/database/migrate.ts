import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from './store.js';
if(!pool)throw new Error('Use DATA_MODE=postgres');
await pool.query(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
await pool.end();
console.log('Schema ready');
