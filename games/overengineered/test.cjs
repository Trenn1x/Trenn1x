const assert=require('node:assert/strict');
const {levels,trace}=require('./engine.js');
for(const [i,l] of levels.entries()){
 const r=trace(l,l.solution);assert.ok(r.ok,`Level ${i+1}: ${r.reason}`);
 assert.equal(new Set([...l.fixed,...l.solution].map(p=>`${p.x},${p.y}`)).size,l.fixed.length+l.solution.length,'no overlapping parts');
 const missing=trace(l,[]);assert.equal(missing.ok,false,`Level ${i+1} must need player input`);
 for(const p of [...l.solution,...l.fixed])assert.ok(!l.blocks.some(([x,y])=>p.x===x&&p.y===y),'parts land on valid sockets');
 console.log(`PASS: experiment ${i+1}, ${r.path.length-2} handoffs, ${r.hit.length} checkpoints`);
}
const base={start:[0,1],goal:[3,1],fixed:[],keys:[],blocks:[]};
assert.match(trace(base,[{x:1,y:1,t:'ramp',d:2}]).reason,/Missing/);
assert.match(trace(base,[{x:1,y:1,t:'ramp',d:0},{x:2,y:1,t:'ramp',d:2}]).reason,/loop/);
assert.equal(trace({...base,keys:[[2,2]]},[{x:1,y:1,t:'spring',d:0}]).ok,false,'must visit checkpoints');
assert.equal(trace({...base,blocks:[[2,1]]},[{x:1,y:1,t:'spring',d:0}]).ok,true,'spring skips blocked intermediate socket');
assert.match(trace(base,[{x:1,y:1,t:'fan',d:3}]).reason,/Off/);
assert.match(trace({...base,blocks:[[2,1]]},[{x:1,y:1,t:'ramp',d:0}]).reason,/blocked/);
console.log('PASS: failures, loops, checkpoints, jumps and boundaries');
