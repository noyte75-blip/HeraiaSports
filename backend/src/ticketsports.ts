import {timingSafeEqual} from 'node:crypto';
export {keywords,parseCatalog,validDetail,matchesWomen} from './ticketsports-parser.js';
export function authorized(token:string){const expected=process.env.EVENT_SYNC_TOKEN||'';return expected.length>=32&&Buffer.byteLength(token)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(token),Buffer.from(expected));}
// Browser jobs run in GitHub Actions; Render only receives validated reports.
export function startEventSync(){}
