import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import type {AddressInfo} from 'node:net';
process.env.DATA_MODE='demo';process.env.NODE_ENV='test';process.env.JWT_SECRET='test-secret-only-012345678901234567890';process.env.ADMIN_EMAIL='admin@example.com';process.env.ADMIN_PASSWORD_HASH=await bcrypt.hash('test-password-only',10);
const {app}=await import('./app.js');
const store=await import('./database/store.js');
const {eventAvailability}=await import('./database/event-status.js');
// The integration test uses future dates, independent of the editorial calendar's age.
for(const event of await store.list('events'))await store.update('events',event.id,{date:new Date(Date.now()+30*86400000).toISOString(),registration_checked_at:new Date().toISOString()});
test('registration freshness and expiry',()=>{
 const now=new Date('2026-10-03T12:00:00Z');
 const event={is_demo:false,date:'2026-11-01T12:00:00Z',registration_status:'open',registration_checked_at:'2026-10-02T12:00:00Z',registration_url:'https://example.com/register',source_url:'https://example.com/event'};
 assert.equal(eventAvailability(event,now),'open_checked');
 assert.equal(eventAvailability({...event,registration_checked_at:'2026-09-20T12:00:00Z'},now),'needs_review');
 assert.equal(eventAvailability({...event,date:'2026-10-01T12:00:00Z'},now),'closed');
 assert.equal(eventAvailability({...event,registration_deadline:'2026-10-02T12:00:00Z'},now),'closed');
 assert.equal(eventAvailability({...event,registration_url:''},now),'needs_review');
});
test('API demonstration, validation and administrative authorization',async()=>{const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;const request=(path:string,method='GET',body?:unknown,token?:string)=>fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});try{
const events=await (await request('/events')).json();assert.equal(events.length,4);assert.ok(events.every((e:any)=>!e.is_demo&&e.availability==='open_checked'&&e.registration_url.startsWith('https://')));const filtered=await(await request('/events?city=Mogi%20das%20Cruzes')).json();assert.equal(filtered.length,1);assert.equal((await request('/events/unknown')).status,404);
const cors=await fetch(base+'/events',{headers:{Origin:'http://localhost:5173'}});assert.equal(cors.headers.get('access-control-allow-origin'),'http://localhost:5173');
const preflight=await fetch(base+'/events',{method:'OPTIONS',headers:{Origin:'http://localhost:5173','Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'content-type'}});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'http://localhost:5173');assert.equal((await request('/sports')).status,200);assert.equal((await request('/stories')).status,200);const profiles=await(await request('/stories')).json();assert.deepEqual(profiles.map((s:any)=>s.name),['Rebeca Andrade','Marta','Rafaela Silva','Tifanny Abreu']);assert.ok(profiles.every((s:any)=>!s.is_demo&&s.source_url.startsWith('https://')&&s.source_name));
assert.equal((await request('/participation','POST',{name:'A'})).status,400);const input={name:'Teste fictício',email:'demo@example.com',type:'Escola',city:'São Paulo',message:'Mensagem fictícia de demonstração.'};const created=await request('/participation','POST',input);assert.equal(created.status,201);assert.equal((await created.json()).simulated,true);assert.equal((await request('/admin/participation')).status,401);assert.equal((await request('/events','POST',events[0])).status,401);assert.equal((await request('/admin/login','POST',{email:'admin@example.com',password:'wrong'})).status,401);
const login=await request('/admin/login','POST',{email:'admin@example.com',password:'test-password-only'});assert.equal(login.status,200);const {token}=await login.json();assert.equal((await request('/stories','POST',{name:'Atleta teste',sport:'Judô',title:'História teste',description:'Descrição para validar fonte.',is_demo:false},token)).status,400);assert.equal((await request('/admin/participation','GET',undefined,token)).status,200);const event={name:'Evento de teste fictício',sport:'Judô',description:'Descrição do teste fictício.',date:'2027-01-01T12:00:00Z',location:'Local fictício',city:'São Paulo',state:'SP',category:'Escolar',is_demo:true};const response=await request('/events','POST',event,token);assert.equal(response.status,201);const record=await response.json();assert.equal((await request('/events/'+record.id,'PUT',{...event,name:'Evento atualizado'},token)).status,200);assert.equal((await request('/events/'+record.id,'DELETE',undefined,token)).status,204);assert.equal((await request('/events/'+record.id)).status,404);
}finally{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}});
