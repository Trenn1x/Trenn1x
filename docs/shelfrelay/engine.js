export const ITEMS = [
  {id:'soap',name:'Soap bars',unit:'bar',plural:'bars',category:'Hygiene'},
  {id:'toothpaste',name:'Toothpaste',unit:'tube',plural:'tubes',category:'Hygiene'},
  {id:'diapers4',name:'Diapers · size 4',unit:'pack of 24',plural:'packs of 24',category:'Family care'},
  {id:'period',name:'Period products',unit:'pack of 16 pads',plural:'packs of 16 pads',category:'Personal care'},
  {id:'blankets',name:'Blankets · adult',unit:'blanket',plural:'blankets',category:'Warmth'},
  {id:'socks',name:'Socks · adult',unit:'pair',plural:'pairs',category:'Clothing'}
];
export const itemById=id=>ITEMS.find(i=>i.id===id);
export function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function dayOffset(n,base=today()){const d=new Date(base+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function emptyState(){return {schema:1,mode:'own',revision:0,lots:[],requests:[],dispatches:[]};}
export function sampleState(){const s=emptyState();s.mode='sample';s.lots=[
  {id:'lot-soap-a',item:'soap',quantity:72,source:'Community essentials drive',location:'A · 01',useBy:dayOffset(21)},
  {id:'lot-soap-b',item:'soap',quantity:48,source:'Neighborhood collection',location:'A · 02',useBy:''},
  {id:'lot-toothpaste',item:'toothpaste',quantity:60,source:'Community essentials drive',location:'A · 03',useBy:dayOffset(180)},
  {id:'lot-diapers',item:'diapers4',quantity:18,source:'Family supply drive',location:'B · 01',useBy:''},
  {id:'lot-period',item:'period',quantity:32,source:'Neighborhood collection',location:'B · 02',useBy:''},
  {id:'lot-blankets',item:'blankets',quantity:24,source:'Warmth drive',location:'C · 01',useBy:''},
  {id:'lot-socks',item:'socks',quantity:40,source:'Warmth drive',location:'C · 02',useBy:''}
];s.requests=[
  {id:'req-1',organization:'Harbor Community Hub',item:'soap',quantity:80,fulfilled:0,priority:'urgent',due:today()},
  {id:'req-2',organization:'Harbor Community Hub',item:'toothpaste',quantity:40,fulfilled:0,priority:'urgent',due:today()},
  {id:'req-3',organization:'Bridge Family Center',item:'diapers4',quantity:25,fulfilled:0,priority:'urgent',due:dayOffset(1)},
  {id:'req-4',organization:'Bridge Family Center',item:'period',quantity:20,fulfilled:0,priority:'standard',due:dayOffset(2)},
  {id:'req-5',organization:'Oak Street Outreach',item:'blankets',quantity:16,fulfilled:0,priority:'standard',due:dayOffset(3)},
  {id:'req-6',organization:'Oak Street Outreach',item:'socks',quantity:50,fulfilled:0,priority:'standard',due:dayOffset(3)},
  {id:'req-7',organization:'Northside Resource Room',item:'soap',quantity:60,fulfilled:0,priority:'standard',due:dayOffset(4)}
];return s;}
export function createPlan(state,date=today()){
  const available=new Map(state.lots.map(l=>[l.id,l.useBy&&l.useBy<date?0:l.quantity]));
  const lots=[...state.lots].sort((a,b)=>(a.useBy||'9999').localeCompare(b.useBy||'9999')||a.id.localeCompare(b.id));
  const queue=state.requests.filter(r=>r.quantity>r.fulfilled).sort((a,b)=>(a.priority==='urgent'?0:1)-(b.priority==='urgent'?0:1)||a.due.localeCompare(b.due)||a.id.localeCompare(b.id));
  const lines=queue.map(r=>{let needed=r.quantity-r.fulfilled;const allocations=[];
    for(const lot of lots){if(lot.item!==r.item||needed===0)continue;const quantity=Math.min(needed,available.get(lot.id));if(quantity){allocations.push({lotId:lot.id,quantity,location:lot.location,useBy:lot.useBy});needed-=quantity;available.set(lot.id,available.get(lot.id)-quantity);}}
    return {requestId:r.id,organization:r.organization,item:r.item,priority:r.priority,due:r.due,needed:r.quantity-r.fulfilled,allocated:r.quantity-r.fulfilled-needed,shortfall:needed,allocations};
  });
  return {revision:state.revision,date,lines,total:lines.reduce((n,l)=>n+l.allocated,0)};
}
export function applyDispatch(state,plan,id,timestamp=new Date().toISOString()){
  if(plan.revision!==state.revision)throw new Error('The workspace changed. Review a fresh plan before confirming.');
  const fresh=createPlan(state,plan.date);
  if(JSON.stringify(fresh)!==JSON.stringify(plan)||plan.total===0)throw new Error('This plan is empty or no longer matches available stock.');
  if(state.dispatches.some(d=>d.id===id))throw new Error('This dispatch was already recorded.');
  const next=structuredClone(state);const lines=plan.lines.filter(l=>l.allocated>0);
  for(const line of lines){const r=next.requests.find(r=>r.id===line.requestId);r.fulfilled+=line.allocated;for(const a of line.allocations){next.lots.find(l=>l.id===a.lotId).quantity-=a.quantity;}}
  next.revision++;next.dispatches.unshift({id,timestamp,lines});return next;
}
export function undoLatest(state){
  if(!state.dispatches.length)throw new Error('There is no dispatch to undo.');
  const next=structuredClone(state);const d=next.dispatches.shift();
  for(const line of d.lines){const r=next.requests.find(r=>r.id===line.requestId);if(!r||r.fulfilled<line.allocated)throw new Error('Cannot safely undo this imported dispatch.');r.fulfilled-=line.allocated;for(const a of line.allocations){const lot=next.lots.find(l=>l.id===a.lotId);if(!lot||lot.quantity+a.quantity>1000000)throw new Error('Cannot safely restore this lot.');lot.quantity+=a.quantity;}}
  next.revision++;return next;
}
const text=(s,max=120)=>typeof s==='string'&&s.length<=max;
const quantity=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000;
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function validateState(s){
  if(!s||s.schema!==1||!['own','sample'].includes(s.mode)||!quantity(s.revision)||!Array.isArray(s.lots)||!Array.isArray(s.requests)||!Array.isArray(s.dispatches)||s.lots.length>2000||s.requests.length>2000||s.dispatches.length>500)throw new Error('This is not a supported ShelfRelay workspace.');
  const ids=new Set();const unique=id=>{if(!text(id,80)||!id||ids.has(id))throw new Error('Workspace contains invalid or repeated IDs.');ids.add(id);};
  for(const l of s.lots){unique(l.id);if(!itemById(l.item)||!quantity(l.quantity)||!text(l.source)||!text(l.location)||!(l.useBy===''||validDate(l.useBy)))throw new Error('A stock lot has invalid fields.');}
  for(const r of s.requests){unique(r.id);if(!itemById(r.item)||!text(r.organization)||!r.organization.trim()||!quantity(r.quantity)||r.quantity===0||!quantity(r.fulfilled)||r.fulfilled>r.quantity||!['urgent','standard'].includes(r.priority)||!validDate(r.due))throw new Error('A request has invalid fields.');}
  for(const d of s.dispatches){unique(d.id);if(!text(d.timestamp,40)||!Number.isFinite(Date.parse(d.timestamp))||!Array.isArray(d.lines)||d.lines.length>2000)throw new Error('A dispatch has invalid fields.');for(const l of d.lines){const req=s.requests.find(r=>r.id===l.requestId);if(!req||l.item!==req.item||!text(l.organization)||!quantity(l.allocated)||l.allocated===0||!Array.isArray(l.allocations)||l.allocations.length>2000)throw new Error('A dispatch line is invalid.');let total=0;for(const a of l.allocations){const lot=s.lots.find(x=>x.id===a.lotId);if(!lot||lot.item!==l.item||!quantity(a.quantity)||!a.quantity||!text(a.location)||!(a.useBy===''||validDate(a.useBy)))throw new Error('A dispatch allocation is invalid.');total+=a.quantity;}if(total!==l.allocated)throw new Error('Dispatch totals do not match.');}}
  for(const r of s.requests){const recorded=s.dispatches.flatMap(d=>d.lines).filter(l=>l.requestId===r.id).reduce((n,l)=>n+l.allocated,0);if(recorded!==r.fulfilled)throw new Error('Fulfilled quantities do not match dispatch history.');}
  return structuredClone(s);
}
export function csvCell(value){let s=String(value??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function packingCsv(lines){return [['Organization','Item','Unit','Quantity','Lot','Shelf','Use by'],...lines.flatMap(l=>l.allocations.map(a=>[l.organization,itemById(l.item).name,itemById(l.item).unit,a.quantity,a.lotId,a.location,a.useBy]))].map(row=>row.map(csvCell).join(',')).join('\r\n');}
