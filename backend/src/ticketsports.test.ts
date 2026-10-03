import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesWomen,parseCatalog,validDetail,authorized} from './ticketsports.js';
const card=(name:string,status='aberto',id='123')=>`<div class="card-evento more-events-item"><div class="favorito-card-evento heart-check-box" id="${id}"></div><img class="thumb-event" alt="${name}"><div class="inscricoes-${status}"></div><time datetime="2030-10-11"></time><div class="local-card-evento"><div class="text-footer">S&#227;o Paulo, SP</div></div><input type="hidden" class="event-id" value="${id}" />`;
test('catalog selects women-focused mixed events, decodes names, checks opening, deduplicates',()=>{
 for(const name of ['Ladies Run','Corre Meninas','Outubro Rosa','Corrida da Mulher','Diva Run'])assert.ok(matchesWomen(name));
 assert.equal(matchesWomen('Corrida do Rosado'),false);
 const events=parseCatalog(card('Corrida Mulher')+card('Corrida Mulher')+card('Corrida Masculina','aberto','124')+card('Ladies Run','fechado','125'),new Date('2030-01-01'));
 assert.equal(events.length,1);assert.equal(events[0].city,'São Paulo');assert.equal(events[0].id,'ticketsports-123');assert.equal(events[0].start_time_confirmed,false);
 assert.equal(parseCatalog(card('Diva Run'),new Date('2031-01-01')).length,0);
 assert.equal(parseCatalog(card('Diva Run'),new Date('2030-10-11T03:01:00Z')).length,0);
});
test('registration requires event identity and active CTA, rejects preview and closed pages',()=>{
 const page='<h1 data-id-event="123">Ladies Run</h1><a id="bot_inscrever">Inscrever</a>';
 assert.ok(validDetail(page,'123'));assert.equal(validDetail(page,'124'),false);assert.equal(validDetail(page+' PREVIEW (TESTE)','123'),false);assert.equal(validDetail(page+' Inscrições encerradas','123'),false);
 process.env.EVENT_SYNC_TOKEN='x'.repeat(64);assert.ok(authorized('x'.repeat(64)));assert.equal(authorized('y'.repeat(64)),false);assert.equal(authorized(''),false);delete process.env.EVENT_SYNC_TOKEN;
});
