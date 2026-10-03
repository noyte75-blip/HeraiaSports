import {timingSafeEqual} from 'node:crypto';
import * as store from './database/store.js';
const catalog='https://produto.ticketsports.com.br/Calendario/';
export const keywords=['Ladies','Meninas','Rosa','Mulher','Diva','Feminina','Women','Pink'];
function decode(s:string){return s.replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
export function matchesWomen(name:string){const text=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return /\b(ladies|meninas?|rosa|mulher(?:es)?|divas?|feminin[ao]s?|women|pink)\b/.test(text);}
export function parseCatalog(html:string,now=new Date()){
 const blocks=html.split(/<div class="card-evento /).slice(1); const items=new Map<string,any>();
 for(const block of blocks){const card=block.split('<input type="hidden" class="event-id"')[0];
 const id=card.match(/class="favorito-card-evento[^>]*id="(\d+)"/)?.[1];const name=decode(card.match(/class="thumb-event"[^>]*alt="([^"]+)"/)?.[1]||'');const day=card.match(/datetime="(\d{4}-\d{2}-\d{2})"/)?.[1];const place=decode(card.match(/class="local-card-evento">[\s\S]*?class="text-footer">([^<]+)/)?.[1]||'');const state=place.match(/,\s*([A-Z]{2})$/)?.[1];
 if(!id||!day||!state||!matchesWomen(name)||!card.includes('inscricoes-aberto')||new Date(day+'T23:59:59-03:00')<=now)continue;
 const url=`https://www.ticketsports.com.br/Evento/${id}/Cadastro`;
 items.set(id,{id:`ticketsports-${id}`,name,sport:/pedalada/i.test(name)?'Ciclismo':/corrida|run|caminhada/i.test(name)?'Atletismo':'Esportes',description:'Evento encontrado no catálogo público da Ticket Sports por palavra-chave relacionada a mulheres. Pode aceitar todos os gêneros. Confira público, valores, vagas e regulamento no site da organização.',date:day+'T00:00:00-03:00',location:'Consulte o local de largada no site de inscrição',city:place.replace(/,\s*[A-Z]{2}$/,''),state,category:/pedalada/i.test(name)?'Pedalada e caminhada':'Evento esportivo',organizer:'Organização informada na Ticket Sports',source_name:'Ticket Sports — catálogo público',source_url:url,registration_url:url,participation_note:'Seleção automática por palavras-chave; pode ser um evento misto. Inscrição diretamente na Ticket Sports.',start_time_confirmed:false,image_url:'',is_demo:false,registration_status:'open',registration_checked_at:now.toISOString(),registration_deadline:null});
 }return [...items.values()];
}
async function page(url:string){const response=await fetch(url,{headers:{'User-Agent':'HeraiaEventCatalog/1.0 (+https://heraia.netlify.app)'},signal:AbortSignal.timeout(20000),redirect:'error'});if(!response.ok)throw new Error(`Ticket Sports respondeu ${response.status}`);const html=await response.text();if(html.length>2_000_000||/cf-chl-|Just a moment|captcha/i.test(html))throw new Error('Catálogo indisponível para leitura pública');return html;}
export function validDetail(html:string,id:string){return html.includes(`data-id-event="${id}"`) && /id="bot_inscrever"/.test(html) && !/\bPREVIEW\s*\(TESTE\)|inscri[çc][õo]es encerradas|evento cancelado/i.test(decode(html));}
let running:Promise<any>|undefined;let last:any={status:'never',checked_at:null};
export function syncStatus(){return {...last,running:!!running};}
export function authorized(token:string){const expected=process.env.EVENT_SYNC_TOKEN||'';return expected.length>=32&&Buffer.byteLength(token)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(token),Buffer.from(expected));}
export async function syncTicketSports(){if(running)return running;running=(async()=>{
 const candidates=new Map<string,any>();let checked=0,upserted=0;
 try{for(const keyword of keywords){const html=await page(catalog+'?termo='+encodeURIComponent(keyword));if(!html.includes('card-evento'))throw new Error('Formato do catálogo alterado; atualização interrompida');for(const event of parseCatalog(html))candidates.set(event.id,event);}
 const existing=await store.list('events');
 for(const event of [...candidates.values()].slice(0,20)){const id=event.id.replace('ticketsports-','');const html=await page(event.source_url);checked++;
 if(!validDetail(html,id)){const old=existing.find(x=>x.id===event.id);if(old)await store.update('events',event.id,{registration_status:'unverified',registration_checked_at:new Date().toISOString()});continue;}
 const fields={...event};delete fields.id;
 if(existing.some(x=>x.id===event.id))await store.update('events',event.id,fields);else await store.importEvent(event);upserted++;
 }
 // Missing events are left to expire naturally: search results are paginated, absence is not proof of closure.
 last={status:'ok',checked_at:new Date().toISOString(),found:candidates.size,checked,upserted};return last;
 }catch(error){last={status:'error',checked_at:new Date().toISOString(),checked,upserted,message:error instanceof Error?error.message:'Falha de sincronização'};throw error;}
 })();try{return await running;}finally{running=undefined;}}
export function startEventSync(){if(process.env.TICKETSPORTS_SYNC_ENABLED!=='true')return;const run=()=>syncTicketSports().catch(e=>console.error('Ticket Sports sync:',e.message));void run();setInterval(run,24*60*60*1000).unref();}
