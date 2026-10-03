import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCatalog} from './ticketsports-parser.js';
test('browser reports require authorization; failed runs preserve prior events and success timestamp',async()=>{
 process.env.DATA_MODE='demo';process.env.EVENT_SYNC_TOKEN='r'.repeat(64);
 const {app}=await import('./app.js');const store=await import('./database/store.js');
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const address=server.address() as any;const base=`http://127.0.0.1:${address.port}/api/integrations/ticketsports`;
 const post=(body:any,token=process.env.EVENT_SYNC_TOKEN)=>fetch(base+'/report',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
 try{
 assert.equal((await post({status:'error'},'wrong')).status,401);
 const event=parseCatalog('<div class="card-evento more-events-item"><div class="favorito-card-evento heart-check-box" id="987654"></div><img class="thumb-event" alt="Corrida Mulher"><div class="inscricoes-aberto"></div><time datetime="2030-10-11"></time><div class="local-card-evento"><div class="text-footer">São Paulo, SP</div></div><input type="hidden" class="event-id" />')[0];
 assert.ok(event);const ok=await post({status:'ok',events:[event]});assert.equal(ok.status,200);const report=await ok.json();assert.equal(report.upserted,1);
 const saved=await store.find('events',event.id);const checked=saved.registration_checked_at;
 const failure=await post({status:'error',message:'Página pública bloqueou o robô'});assert.equal(failure.status,200);
 const status=await (await fetch(base+'/status')).json();assert.equal(status.message,'Dados não atualizados');assert.equal(status.last_success_at,report.last_success_at);assert.equal((await store.find('events',event.id)).registration_checked_at,checked);
 assert.equal((await post({status:'ok',events:[{...event,source_url:'https://example.com'}]})).status,400);assert.equal((await store.find('events',event.id)).registration_checked_at,checked);
 assert.equal((await post({status:'ok',events:[event]})).status,200);assert.equal((await store.list('events')).filter(x=>x.id===event.id).length,1);
 assert.equal((await (await fetch(base+'/status')).json()).status,'ok');
 }finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));delete process.env.EVENT_SYNC_TOKEN;}
});
