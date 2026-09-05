'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const M = require('../dist/model.js');
const close = (actual, expected, epsilon=1e-8) => assert.ok(Math.abs(actual-expected) < epsilon, `${actual} differs from ${expected}`);
function oneDevice(overrides={}) {
  const p=M.defaults();
  p.batteryWh=1000;p.charge=100;p.reserve=0;p.efficiency=100;p.idleW=0;
  p.devices=[{id:'test',name:'Test device',watts:100,hours:10,quantity:1,enabled:true,essential:true,category:'custom',icon:'plug'}];
  return Object.assign(p,overrides);
}

test('hand-calculated 1 kWh battery supplies a 1 kWh/day load for 24 hours',()=>{
  const c=M.calculate(oneDevice());
  close(c.loadWhDay,1000);close(c.runtimeHours,24);close(c.usableStoredWh,1000);
});
test('reserve is deducted from rated capacity, not from the remaining charge',()=>{
  const c=M.calculate(oneDevice({charge:60,reserve:10}));
  close(c.usableStoredWh,500);close(c.runtimeHours,12);
});
test('conversion losses and battery-side idle draw are accounted for separately',()=>{
  const p=oneDevice({efficiency:80,idleW:5});
  // 1,000 Wh output requires 1,250 Wh, plus 120 Wh/day idle.
  const c=M.calculate(p);close(c.batteryWhDay,1370);close(c.runtimeHours,24000/1370);
});
test('below-reserve, empty battery, and zero charge never imply runtime',()=>{
  for(const p of [oneDevice({charge:9,reserve:10}),oneDevice({batteryWh:0}),oneDevice({charge:0})]){
    const c=M.calculate(p);assert.equal(c.runtimeHours,0);assert.equal(c.coversPower,false);assert.equal(c.usableStoredWh,0);
  }
});
test('no active load produces no runtime claim or readiness success',()=>{
  for(const mode of ['empty','disabled','zero-watts','zero-hours']){
    const p=oneDevice({idleW:5});
    if(mode==='empty')p.devices=[];
    if(mode==='disabled')p.devices[0].enabled=false;
    if(mode==='zero-watts')p.devices[0].watts=0;
    if(mode==='zero-hours')p.devices[0].hours=0;
    const c=M.calculate(p);assert.equal(c.runtimeHours,null);assert.equal(c.coversPower,false);assert.equal(c.batteryWhDay,0);
  }
});
test('output limits can fail even when total battery energy is ample',()=>{
  const p=oneDevice({batteryWh:100000,maxOutputW:90});
  const c=M.calculate(p);assert.equal(c.outputExceeded,true);assert.equal(c.coversPower,false);assert.ok(c.runtimeHours>c.targetHours);
  p.maxOutputW=100;assert.equal(M.calculate(p).outputExceeded,false);
  p.maxOutputW=0;assert.equal(M.calculate(p).outputExceeded,false);
});
test('water calculation includes every day, every person, and explicit extras',()=>{
  const c=M.calculate(oneDevice({people:3,days:4,water:5,extraWater:.5}));
  close(c.waterTarget,14);close(c.waterGap,9);close(c.waterHours,240/7);assert.equal(c.coversWater,false);
});
test('exactly meeting the water baseline is covered without a fractional shortfall',()=>{
  const p=oneDevice({people:2,days:3,extraWater:.1,water:6.3});
  assert.equal(M.calculate(p).coversWater,true);
  assert.equal(M.calculate(p).waterGap,0);
});
test('the initial editable example has independently checked results',()=>{
  const p=M.defaults(), c=M.calculate(p), e=M.calculate(p,true);
  close(c.loadWhDay,405);close(c.usableStoredWh,900);close(c.runtimeHours,36.213017751479285);
  close(e.loadWhDay,70);close(e.runtimeHours,106.74418604651163);close(c.waterHours,48);close(c.waterGap,2);
});
test('essential comparison respects inclusion, quantity, and daily duration',()=>{
  const p=oneDevice();
  p.devices.push({...p.devices[0],id:'extra',watts:50,hours:5,quantity:2,essential:false});
  p.devices.push({...p.devices[0],id:'off',watts:1000,essential:true,enabled:false});
  close(M.calculate(p).loadWhDay,1500);close(M.calculate(p,true).loadWhDay,1000);close(M.calculate(p,true).runtimeHours,24);
});
test('remaining-energy curve starts at usable energy and stops at the reserve',()=>{
  const p=oneDevice({charge:80,reserve:10});
  close(M.remainingAt(p,0),700);close(M.remainingAt(p,12),200);close(M.remainingAt(p,24),0);close(M.remainingAt(p,10000),0);
});
test('supply increases and lower demand cannot reduce runtime across 500 scenarios',()=>{
  let seed=42;
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
  for(let i=0;i<500;i++){
    const p=oneDevice({batteryWh:50+random()*10000,charge:60+random()*40,reserve:random()*30,efficiency:50+random()*50,idleW:random()*15});
    p.devices[0].watts=1+random()*500;p.devices[0].hours=.1+random()*23.9;
    const c=M.calculate(p), more=structuredClone(p), less=structuredClone(p);
    more.batteryWh*=1.5;less.devices[0].watts*=.5;
    assert.ok(M.calculate(more).runtimeHours>=c.runtimeHours);
    assert.ok(M.calculate(less).runtimeHours>=c.runtimeHours);
    for(const t of [0,1,12,24,72,336]){
      const value=M.remainingAt(p,t);assert.ok(Number.isFinite(value));assert.ok(value>=0&&value<=c.usableStoredWh+1e-9);
    }
  }
});
test('a saved plan round-trips the meaningful user data',()=>{
  const p=M.defaults();p.notes='Meet at the library. <bring a light>';p.contact='Pat · 555-0100';p.meeting='North stairwell';
  p.needs.pets=true;p.checked.food=true;p.example=false;
  assert.deepEqual(M.sanitize(JSON.parse(JSON.stringify(p))),p);
});
test('import rejects unsupported formats and clamps extreme or invalid values',()=>{
  for(const raw of [null,[],{}, {version:999}])assert.throws(()=>M.sanitize(raw));
  const raw=M.defaults();raw.people=-200;raw.days=999;raw.batteryWh='Infinity';raw.water=-1;raw.efficiency=0;
  raw.devices[0].hours=100;raw.devices[0].watts=-1;raw.devices[0].quantity=1000;
  const p=M.sanitize(raw);assert.equal(p.people,1);assert.equal(p.days,14);assert.equal(p.batteryWh,1000);assert.equal(p.water,0);assert.equal(p.efficiency,50);
  assert.equal(p.devices[0].hours,24);assert.equal(p.devices[0].watts,0);assert.equal(p.devices[0].quantity,20);
  assert.ok(Number.isFinite(M.calculate(p).waterTarget));
});
test('duplicate and hostile device IDs are safe and unique after import',()=>{
  const raw=M.defaults();raw.devices=[...Array(10)].map((_,i)=>({...raw.devices[0],id:i<5?'same':i<8?'same-1':'<img onerror="evil">'}));
  const p=M.sanitize(raw);assert.equal(new Set(p.devices.map(d=>d.id)).size,p.devices.length);
  assert.ok(p.devices.every(d=>/^[a-zA-Z0-9_-]+$/.test(d.id)));
});
test('untrusted imported data cannot change object prototypes or exceed bounds',()=>{
  const raw=JSON.parse(JSON.stringify(M.defaults()));
  raw.checked=JSON.parse('{"__proto__":{"polluted":true},"food":true,"junk<script>":true}');raw.notes='a'.repeat(10000);
  raw.devices=Array.from({length:100},(_,i)=>({...raw.devices[0],id:String(i)}));
  const p=M.sanitize(raw);assert.equal({}.polluted,undefined);assert.equal(p.notes.length,3000);assert.equal(p.devices.length,40);
  assert.equal(p.checked.food,true);assert.equal(p.checked['junk<script>'],undefined);
});
test('selected household needs add concrete tasks and retain user progress',()=>{
  const p=M.defaults(), before=M.checklist(p);assert.equal(before.length,12);
  p.needs={pets:true,medical:true,medicine:true,mobility:true};p.checked.food=true;
  const items=M.checklist(p);assert.equal(items.length,16);
  for(const id of ['pets','medical','medicine','mobility'])assert.ok(items.some(i=>i.id===id));
  assert.equal(p.checked.food,true);p.home='house';assert.equal(M.checklist(p).length,15);
});
test('water checklist agrees with the calculator when extras are present',()=>{
  const p=oneDevice({people:2,days:3,extraWater:1});
  const detail=M.checklist(p).find(i=>i.id==='water').detail;
  assert.match(detail,/9 US gallons/);assert.equal(M.calculate(p).waterTarget,9);
});
