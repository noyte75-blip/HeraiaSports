import {chromium} from 'playwright';
import {keywords,parseCatalog,validDetail} from '../backend/src/ticketsports-parser.ts';
import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export function blockedText(text){return /just a moment|verifique que você é humano|verificando seu navegador|verify you are human|access denied|acesso negado|captcha/i.test(text);}
async function load(page,url,selector){
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 if(response&&[401,403,429].includes(response.status()))throw new Error('Página pública bloqueou o robô');
 if(blockedText(await page.locator('body').innerText()))throw new Error('Página pública exige verificação humana');
 await page.locator(selector).first().waitFor({state:'attached',timeout:20000});
 if(blockedText(await page.locator('body').innerText()))throw new Error('Página pública exige verificação humana');
 return page.content();
}
export async function collect(){let browser;
 try{browser=await chromium.launch();const page=await browser.newPage({locale:'pt-BR'});const candidates=new Map();
 for(const keyword of keywords){const html=await load(page,'https://produto.ticketsports.com.br/Calendario/?termo='+encodeURIComponent(keyword),'.card-evento');for(const event of parseCatalog(html))candidates.set(event.id,event);}
 const events=[];
 for(const event of [...candidates.values()].slice(0,20)){const id=event.id.replace('ticketsports-','');const html=await load(page,event.source_url,'h1[data-id-event]');if(validDetail(html,id))events.push(event);}
 return {status:'ok',events,message:''};
 }catch(error){return {status:'error',events:[],message:error instanceof Error?error.message.slice(0,300):'Falha no robô'};}finally{await browser?.close();}
}
export async function report(payload){const token=process.env.EVENT_SYNC_TOKEN||'';if(token.length<32)throw new Error('Configure EVENT_SYNC_TOKEN nos secrets do GitHub');const url=(process.env.HERAIA_API_URL||'https://heraiasports.onrender.com/api')+'/integrations/ticketsports/report';
 for(let attempt=0;attempt<3;attempt++){try{const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(payload),signal:AbortSignal.timeout(90000)});if(!response.ok)throw new Error(`Backend respondeu HTTP ${response.status}`);return await response.json();}catch(error){if(attempt===2)throw error;}}
}
async function main(){const dry=process.argv.includes('--dry-run');let payload;if(process.argv.includes('--report-install-failure'))payload={status:'error',events:[],message:'Não foi possível instalar ou iniciar o navegador do robô'};else payload=await collect();
 await mkdir('robot-result',{recursive:true});await writeFile('robot-result/status.json',JSON.stringify(payload,null,2));
 if(!dry)console.log(JSON.stringify(await report(payload)));else console.log(JSON.stringify({status:payload.status,count:payload.events.length,message:payload.message}));
 if(payload.status==='error')process.exitCode=1;
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
