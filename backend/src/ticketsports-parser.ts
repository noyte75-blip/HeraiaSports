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
export function validDetail(html:string,id:string){return html.includes(`data-id-event="${id}"`) && /id="bot_inscrever"/.test(html) && !/\bPREVIEW\s*\(TESTE\)|inscri[çc][õo]es encerradas|evento cancelado/i.test(decode(html));}
