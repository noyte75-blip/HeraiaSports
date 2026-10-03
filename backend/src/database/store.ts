import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { events, sports, stories } from './demo.js';
export const useDatabase = process.env.DATA_MODE === 'postgres';
if (process.env.NODE_ENV === 'production' && !useDatabase) throw new Error('Production requires DATA_MODE=postgres');
if (useDatabase && !process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
export const pool = useDatabase ? new pg.Pool({connectionString:process.env.DATABASE_URL, ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:true}:undefined}) : null;
const memory:Record<string,any[]> = {events:structuredClone(events),sports:structuredClone(sports),athlete_stories:structuredClone(stories),participation_requests:[]};
const tables = new Set(Object.keys(memory));
function table(name:string) { if (!tables.has(name)) throw new Error('Invalid table'); return name; }
export async function list(name:string) { name=table(name); if(pool) return (await pool.query(`SELECT * FROM ${name}`)).rows; return memory[name]; }
export async function find(name:string,id:string) { name=table(name); if(pool) return (await pool.query(`SELECT * FROM ${name} WHERE id=$1`,[id])).rows[0]; return memory[name].find(x=>x.id===id); }
export async function create(name:string,data:Record<string,unknown>) { name=table(name); const item={...data,id:randomUUID(),created_at:new Date().toISOString()}; if(pool) { const keys=Object.keys(item); return (await pool.query(`INSERT INTO ${name} (${keys.join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING *`,Object.values(item))).rows[0]; } memory[name].push(item); return item; }
export async function update(name:string,id:string,data:Record<string,unknown>) { name=table(name); if(pool) {const keys=Object.keys(data);return (await pool.query(`UPDATE ${name} SET ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} WHERE id=$${keys.length+1} RETURNING *`,[...Object.values(data),id])).rows[0];} const item=await find(name,id); if(item)Object.assign(item,data);return item; }
export async function remove(name:string,id:string) {name=table(name);if(pool)return (await pool.query(`DELETE FROM ${name} WHERE id=$1`,[id])).rowCount!==0;const i=memory[name].findIndex(x=>x.id===id);if(i<0)return false;memory[name].splice(i,1);return true;}
// IDs supplied only by the trusted event importer, never by public requests.
export async function importEvent(item:Record<string,unknown>){if(pool){const keys=Object.keys(item);await pool.query(`INSERT INTO events (${keys.join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')}) ON CONFLICT (id) DO NOTHING`,Object.values(item));}else if(!memory.events.some(x=>x.id===item.id))memory.events.push({...item,created_at:new Date().toISOString()});}
