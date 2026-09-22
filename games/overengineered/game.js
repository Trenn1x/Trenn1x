/* Overengineered — a deterministic mechanical relay toy. No network dependencies. */
(()=>{
'use strict';
const {W,H,TYPES,levels,key,trace,ARROWS}=Machine;
const $=id=>document.getElementById(id),board=$('board'),marble=$('marble');
let index=0,level=levels[0],placed=[],history=[],selected='ramp',running=false,runToken=0,sound=false,audio=null,solved={},experiments=0;
try{const saved=JSON.parse(localStorage.getItem('overengineered-v1')||'{}');if(saved&&typeof saved==='object')solved=saved;}catch{}
const icons={
 ramp:'<path d="M8 34L36 17L36 35Z" fill="currentColor" opacity=".25"/><path d="M7 32L36 15M9 36H36"/><circle cx="14" cy="20" r="4" fill="currentColor"/>',
 domino:'<rect x="7" y="15" width="7" height="24" rx="1" fill="currentColor"/><rect x="21" y="11" width="7" height="24" rx="1" fill="currentColor" transform="rotate(15 24 35)"/><rect x="32" y="6" width="7" height="24" rx="1" fill="currentColor" transform="rotate(32 35 30)"/>',
 spring:'<path d="M7 34H37M10 30L32 26L12 21L32 16L12 11L32 7M10 4H36"/><path d="M24 38V43"/>',
 fan:'<circle cx="24" cy="20" r="16"/><path d="M24 20C5 20 16 0 23 9ZM24 20C24 39 44 28 34 21ZM24 20C32 4 10 0 17 15Z" fill="currentColor" stroke="none"/><circle cx="24" cy="20" r="3" fill="#19342e"/><path d="M24 37V44M15 44H33"/>',
 start:'<circle cx="24" cy="16" r="9" fill="#ffcb62"/><path d="M9 31H39M35 26L40 31L35 36"/>',
 goal:'<path d="M11 30L15 24V16C15 3 33 3 33 16V24L37 30Z" fill="#ffcb62" stroke="#ffcb62"/><path d="M20 34Q24 41 28 34" stroke="#ffcb62"/><path d="M24 3V1"/>'
};
function icon(t,d=0){const turn=t==='ramp'?d:t==='spring'?(d+1)%4:0;return `<svg class="icon" viewBox="0 0 48 48" aria-hidden="true" style="color:${TYPES[t]?.color||'#ffcb62'};transform:rotate(${turn*90}deg)" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${icons[t]}</svg>`;}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const el=document.createElement('button');el.className='cell';el.dataset.x=x;el.dataset.y=y;el.id=`socket-${x}-${y}`;el.addEventListener('click',()=>edit(x,y));el.addEventListener('contextmenu',e=>{e.preventDefault();edit(x,y,true);});board.append(el);
}
for(const [i,l] of levels.entries()){const option=document.createElement('option');option.value=i;option.textContent=`${String(i+1).padStart(2,'0')} · ${l.name}`;$('levels').append(option);}
const option=document.createElement('option');option.value='sandbox';option.textContent='Free build';$('levels').append(option);
for(const [t,s] of Object.entries(TYPES)){const b=document.createElement('button');b.className='tool';b.id='tool-'+t;b.innerHTML=icon(t)+`<span><strong>${s.name}</strong><small>${s.step} ${s.step===1?'socket':'sockets'}</small></span><span class="count"></span>`;b.addEventListener('click',()=>{selected=t;renderTools();message(s.hint+' Tap an empty socket.');});$('tools').append(b);}
function left(t){return index==='sandbox'?Infinity:(level.inventory[t]||0)-placed.filter(p=>p.t===t).length;}
function message(text,type=''){$('status').textContent=text;$('status').className='status '+type;}
function saveUndo(){history.push(placed.map(p=>({...p})));if(history.length>100)history.shift();}
function edit(x,y,forceErase=false){
 if(running)return;const k=key(x,y);
 if(level.start[0]===x&&level.start[1]===y){message('The marble always starts by moving one socket right.');return;}
 if(level.goal[0]===x&&level.goal[1]===y){message('Bring the marble here after touching every brass checkpoint.');return;}
 if(level.blocks.some(p=>key(...p)===k)){message('No landing here. Springs and fans can skip over blocked sockets.');return;}
 if(level.fixed.some(p=>key(p.x,p.y)===k)){message('This part is bolted down. Build your machine around it.');return;}
 const old=placed.findIndex(p=>p.x===x&&p.y===y);
 if(selected==='erase'||forceErase){if(old>=0){saveUndo();placed.splice(old,1);}else{message('Tap a placed part to return it to your tray.');return;}}
 else if(old>=0){saveUndo();placed[old].d=(placed[old].d+1)%4;beep(260,.035);}
 else if(left(selected)>0){saveUndo();placed.push({x,y,t:selected,d:0});beep(390,.03);}
 else{message(`All your ${TYPES[selected].name.toLowerCase()} are in use. Pick another part, or erase one.`);return;}
 marble.style.display='none';$('sparks').innerHTML='';$('next').hidden=true;render();message(selected==='erase'?'Part returned to the tray.':old>=0?'Arrow rotated. It points to the next landing.':'Part placed. Tap it again to rotate the arrow.');
}
function renderTools(){
 for(const t of Object.keys(TYPES)){const b=$('tool-'+t),n=left(t);b.classList.toggle('selected',selected===t);b.setAttribute('aria-pressed',selected===t);b.setAttribute('aria-disabled',n===0);b.querySelector('.count').textContent=n===Infinity?'∞':n;b.setAttribute('aria-label',`${TYPES[t].name}, ${n===Infinity?'unlimited':n+' remaining'}`);b.disabled=running;}
 $('erase').setAttribute('aria-pressed',selected==='erase');$('erase').disabled=running;$('toolHint').textContent=selected==='erase'?'Tap a part to return it to your tray.':TYPES[selected].hint;
}
function render(){
 const all=[...level.fixed,...placed];
 for(const el of board.children){const x=+el.dataset.x,y=+el.dataset.y,k=key(x,y),p=all.find(p=>p.x===x&&p.y===y),fixed=level.fixed.some(p=>p.x===x&&p.y===y),isKey=level.keys.some(p=>key(...p)===k),block=level.blocks.some(p=>key(...p)===k),start=level.start[0]===x&&level.start[1]===y,goal=level.goal[0]===x&&level.goal[1]===y;
  el.className='cell';el.innerHTML='';delete el.dataset.part;el.style.removeProperty('--piece-color');el.disabled=running;
  if(isKey)el.classList.add('key');if(block)el.classList.add('block');
  let desc=block?'blocked':isKey?'empty checkpoint':'empty';
  if(p){el.dataset.part=p.t;el.style.setProperty('--piece-color',TYPES[p.t].color);el.innerHTML=icon(p.t,p.d)+`<span class="arrow" aria-hidden="true">${ARROWS[p.d]}</span>`;desc=`${fixed?'fixed ':''}${TYPES[p.t].name} facing ${['right','down','left','up'][p.d]}${isKey?', checkpoint':''}`;if(fixed){el.classList.add('fixed');el.innerHTML+='<span class="lock" aria-hidden="true">⊕</span>';}}
  if(start||goal){el.classList.add(start?'start':'goal');el.innerHTML=icon(start?'start':'goal')+`<span class="label">${start?'START':'BELL'}</span>`;desc=start?'marble start, moves right':'bell, finish here';}
  if(index===0&&!p&&level.solution.some(p=>p.x===x&&p.y===y))el.classList.add('ghost');
  if(x===0)el.innerHTML+=`<span class="row-number" aria-hidden="true">${y+1}</span>`;
  el.setAttribute('aria-label',`${String.fromCharCode(65+x)}${y+1}: ${desc}`);
 }
 $('partCount').textContent=`${placed.length} ${placed.length===1?'part':'parts'} placed`;$('checkpointCount').textContent=level.keys.length?`${level.keys.length} brass checkpoints`:'Just ring the bell';$('solvedCount').textContent=`${levels.filter((_,i)=>solved[i]).length} / 8 solved`;
 $('undo').disabled=running||!history.length;$('reset').disabled=running;$('hint').disabled=running;$('levels').disabled=running;renderTools();
}
function load(i){
 runToken++;running=false;marble.style.display='none';$('sparks').innerHTML='';index=i;placed=[];history=[];experiments=0;
 level=i==='sandbox'?{name:'Make a beautiful mess',brief:'Unlimited parts. Can you route the marble through every corner?',hint:'Try a fan, then a spring, then as many unnecessary turns as you can fit.',start:[0,2],goal:[7,3],fixed:[],keys:[],blocks:[],inventory:{}}:levels[i];
 selected=Object.keys(level.inventory)[0]||'ramp';$('stageLabel').textContent=i==='sandbox'?'OPEN WORKSHOP · FREE BUILD':`EXPERIMENT ${String(i+1).padStart(2,'0')} / 08`;$('levelTitle').textContent=level.name;$('brief').textContent=level.brief;$('levels').value=i;$('run').textContent='▶ Run machine';$('next').hidden=true;$('hint').textContent='Hint';render();message(i===0?'Choose a ramp, then tap the + sockets. Place dominoes at C3.':i==='sandbox'?'All parts are unlimited. The bell is at H4. Go the long way around.':'Place your parts, aim the arrows, and run the machine.');
}
function position(x,y){const a=board.getBoundingClientRect(),b=board.parentElement.getBoundingClientRect(),cell=board.children[0].getBoundingClientRect(),gx=(a.width-cell.width)/(W-1),gy=(a.height-cell.height)/(H-1);return{x:a.left-b.left+x*gx+cell.width/2-marble.offsetWidth/2,y:a.top-b.top+y*gy+cell.height/2-marble.offsetHeight/2};}
function beep(freq,duration=.07){if(!sound)return;try{audio ||= new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),g=audio.createGain();osc.connect(g);g.connect(audio.destination);osc.type='sine';osc.frequency.setValueAtTime(freq,audio.currentTime);g.gain.setValueAtTime(.065,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.start();osc.stop(audio.currentTime+duration);}catch{}}
function move(from,to,kind,token){return new Promise(resolve=>{let start=null;const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?70:kind==='spring'?550:kind==='fan'?630:420;function frame(now){if(token!==runToken){resolve(false);return;}if(start===null)start=now;const t=Math.min(1,(now-start)/duration),p=position(from.x,from.y),q=position(to.x,to.y),ease=kind==='spring'?t: t*t*(3-2*t),arc=kind==='spring'?Math.sin(t*Math.PI)*25:kind==='fan'?Math.sin(t*Math.PI)*12:0;marble.style.transform=`translate(${p.x+(q.x-p.x)*ease}px,${p.y+(q.y-p.y)*ease-arc}px)`;if(t<1)requestAnimationFrame(frame);else resolve(true);}requestAnimationFrame(frame);});}
function celebrate(){for(let i=0;i<35;i++){const p=document.createElement('i');p.className='confetti';p.style.left=(30+Math.random()*40)+'%';p.style.top='30%';p.style.setProperty('--dx',(Math.random()-.5)*400+'px');p.style.setProperty('--dy',(80+Math.random()*220)+'px');p.style.background=['#ffcb62','#b5a2ff','#67d9cb','#f082a5'][i%4];$('sparks').append(p);}beep(660,.16);setTimeout(()=>beep(990,.3),140);}
async function run(){
 if(running){runToken++;running=false;marble.style.display='none';render();$('run').textContent='▶ Run machine';message('Stopped. Adjust the parts and try again.');return;}
 running=true;experiments++;const token=++runToken,result=trace(level,placed);$('next').hidden=true;render();$('run').textContent='■ Stop';message('The machine is doing its very important work…');marble.style.display='block';
 for(let i=1;i<result.path.length;i++){
  if(!await move(result.path[i-1],result.path[i],result.path[i-1].t,token))return;
  const p=result.path[i],el=$(`socket-${p.x}-${p.y}`);if(el){el.classList.add('active','traveled');if(el.classList.contains('key'))el.classList.add('lit');}
  const f={ramp:300,domino:180,spring:600,fan:410};beep(f[p.t]||220,.065);
 }
 if(token!==runToken)return;running=false;$('run').textContent='▶ Run again';
 // Re-enable controls without clearing the visible trace.
 for(const el of board.children)el.disabled=false;$('undo').disabled=!history.length;$('reset').disabled=false;$('hint').disabled=false;$('levels').disabled=false;renderTools();
 const last=result.path.at(-1);if(result.ok){if(index!=='sandbox'){solved[index]=true;try{localStorage.setItem('overengineered-v1',JSON.stringify(solved));}catch{}}
  $('solvedCount').textContent=`${levels.filter((_,i)=>solved[i]).length} / 8 solved`;message(`${result.reason} ${result.path.length-2} handoffs · ${experiments} ${experiments===1?'attempt':'attempts'}.`,'win');celebrate();$('next').hidden=index==='sandbox';$('next').textContent=index===7?'Try free build →':'Next experiment →';
 }else{$(`socket-${last.x}-${last.y}`)?.classList.add('missed');message(result.reason,'fail');beep(120,.2);}
}
$('run').addEventListener('click',run);$('levels').addEventListener('change',e=>load(e.target.value==='sandbox'?'sandbox':+e.target.value));
$('erase').addEventListener('click',()=>{selected=selected==='erase'?(Object.keys(level.inventory)[0]||'ramp'):'erase';renderTools();message(selected==='erase'?'Tap a placed part to remove it.':'Select a socket to place your part.');});
$('undo').addEventListener('click',()=>{if(!running&&history.length){placed=history.pop();marble.style.display='none';$('next').hidden=true;render();message('Last edit undone.');}});
$('reset').addEventListener('click',()=>{if(running)return;saveUndo();placed=[];marble.style.display='none';$('next').hidden=true;render();message('Fresh workbench. Your last layout is one Undo away.');});
$('hint').addEventListener('click',()=>message(level.hint));$('next').addEventListener('click',()=>load(index===7?'sandbox':index+1));
$('sound').addEventListener('click',()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',sound);beep(440,.08);});
document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();run();}if(e.key.toLowerCase()==='z'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();$('undo').click();}if(e.key==='Escape'&&running)run();});
load(0);
})();
