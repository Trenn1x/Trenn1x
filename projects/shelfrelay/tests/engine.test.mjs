import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleState,emptyState,createPlan,applyDispatch,undoLatest,validateState,packingCsv,today,dayOffset} from '../dist/engine.js';

test('sample allocation respects priority and shows partial fulfillment',()=>{
 const s=sampleState(),p=createPlan(s);assert.equal(p.lines.length,7);assert.equal(p.lines.filter(l=>!l.shortfall).length,4);
 assert.equal(p.lines.find(l=>l.requestId==='req-1').allocated,80);assert.equal(p.lines.find(l=>l.requestId==='req-7').allocated,40);
 assert.equal(p.lines.find(l=>l.requestId==='req-3').shortfall,7);assert.equal(p.lines.find(l=>l.requestId==='req-6').shortfall,10);
});
test('a lot is never allocated twice beyond its on-hand quantity',()=>{
 const s=sampleState(),p=createPlan(s);for(const lot of s.lots){const used=p.lines.flatMap(l=>l.allocations).filter(a=>a.lotId===lot.id).reduce((n,a)=>n+a.quantity,0);assert.ok(used<=lot.quantity);}
});
test('earliest eligible use-by goes first, today is eligible, expired is excluded',()=>{
 const s=emptyState();s.lots=[{id:'late',item:'soap',quantity:4,location:'L',source:'',useBy:dayOffset(1)},{id:'today',item:'soap',quantity:4,location:'T',source:'',useBy:today()},{id:'expired',item:'soap',quantity:100,location:'X',source:'',useBy:dayOffset(-1)}];s.requests=[{id:'r',organization:'Test',item:'soap',quantity:10,fulfilled:0,priority:'standard',due:today()}];
 const line=createPlan(s).lines[0];assert.deepEqual(line.allocations.map(a=>a.lotId),['today','late']);assert.equal(line.shortfall,2);
});
test('different catalog items and units are never substituted',()=>{
 const s=sampleState();s.lots=s.lots.filter(l=>l.item!=='diapers4');assert.equal(createPlan(s).lines.find(l=>l.item==='diapers4').allocated,0);
});
test('dispatch deducts stock, records fulfillment, and leaves only true shortages',()=>{
 const s=sampleState(),p=createPlan(s),next=applyDispatch(s,p,'dispatch-test');validateState(next);assert.equal(next.dispatches.length,1);assert.ok(next.lots.every(l=>l.quantity>=0));assert.equal(createPlan(next).total,0);assert.equal(createPlan(next).lines.length,3);assert.equal(s.dispatches.length,0);
});
test('stale and altered plans are rejected',()=>{
 const s=sampleState(),p=createPlan(s);const next=applyDispatch(s,p,'d');assert.throws(()=>applyDispatch(next,p,'d2'),/changed/);p.lines[0].allocations[0].quantity++;assert.throws(()=>applyDispatch(s,p,'d3'),/no longer/);
});
test('undo restores quantities while preserving later donations',()=>{
 const s=sampleState(),next=applyDispatch(s,createPlan(s),'d');next.lots.push({id:'new',item:'soap',quantity:10,location:'',source:'',useBy:''});next.revision++;const restored=undoLatest(next);assert.deepEqual(restored.requests,s.requests);assert.deepEqual(restored.lots.slice(0,-1),s.lots);assert.equal(restored.lots.at(-1).quantity,10);validateState(restored);
});
test('backup validation rejects corrupt totals, invalid dates, and duplicated IDs',()=>{
 const s=sampleState();assert.deepEqual(validateState(s),s);const d=applyDispatch(s,createPlan(s),'d');d.dispatches[0].lines[0].allocations[0].quantity++;assert.throws(()=>validateState(d),/totals/);
 const bad=sampleState();bad.lots[0].useBy='2026-02-31';assert.throws(()=>validateState(bad),/invalid fields/);const dupe=sampleState();dupe.requests[0].id=dupe.lots[0].id;assert.throws(()=>validateState(dupe),/repeated/);
});
test('CSV preserves commas and quotes and blocks formula prefixes',()=>{
 const s=sampleState();s.requests[0].organization='=1+1';s.lots[0].location='Shelf, "A"';const csv=packingCsv(createPlan(s).lines);assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"Shelf, ""A"""'));
});
test('100 varying stock levels conserve inventory and fulfillment',()=>{
 for(let n=0;n<100;n++){const s=sampleState();s.lots.forEach((l,i)=>l.quantity=(n*17+i*13)%81);const p=createPlan(s);if(!p.total)continue;const next=applyDispatch(s,p,'d'+n);validateState(next);for(const item of new Set(s.lots.map(l=>l.item))){const before=s.lots.filter(l=>l.item===item).reduce((t,l)=>t+l.quantity,0),after=next.lots.filter(l=>l.item===item).reduce((t,l)=>t+l.quantity,0),sent=next.requests.filter(r=>r.item===item).reduce((t,r)=>t+r.fulfilled,0);assert.equal(before,after+sent);}}
});
