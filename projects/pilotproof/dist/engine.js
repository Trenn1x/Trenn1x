export const SCHEMA = 1;
export const uid = () => globalThis.crypto.randomUUID();
const num = (v, label, max = 1e7, min = 0) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error(`${label} must be between ${min} and ${max}.`); return v; };
const str = (v, label, max = 300, required = false) => { if (typeof v !== 'string' || v.length > max || (required && !v.trim())) throw new Error(`Check ${label} (${max} characters maximum).`); return v; };
const date = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
export function blank() { return {schema:SCHEMA, sample:false, brief:{name:'My next pilot',client:'',owner:'Tom Verdier',workflow:'',hypothesis:'',unit:'task',target:20,minPairs:5,start:'',end:'',notes:''},scenario:{monthlyUnits:100,hourlyValue:40,realization:50,monthlyCost:100,setupCost:500},observations:[]}; }
export function sample() {
 const s=blank();s.sample=true;
 s.brief={name:'Client reporting, with less rework',client:'Example Studio · fictional',owner:'Tom Verdier',workflow:'Prepare one client campaign report from the same input set.',hypothesis:'A structured reporting workflow will reduce total preparation time by at least 20%, with no decrease in the observed quality pass rate.',unit:'report',target:20,minPairs:5,start:'2026-09-01',end:'2026-09-14',notes:'Illustrative data only. Compare equivalent briefs and use the same reviewer checklist. Working minutes exclude breaks; rework is recorded separately.'};
 s.scenario={monthlyUnits:80,hourlyValue:45,realization:60,monthlyCost:120,setupCost:600};
 s.observations=[[42,8,26,4],[38,6,24,3],[46,10,29,5],[35,5,26,6],[44,6,28,4],[40,7,25,4]].map((a,i)=>({id:'sample-'+i,label:'Matched report '+(i+1),date:'2026-09-0'+(i+1),units:1,baseline:a[0],baselineRework:a[1],trial:a[2],trialRework:a[3],baselineQuality:i===3?'fail':'pass',trialQuality:'pass',included:true,exclusion:'',note:'Fictional demonstration measurement.'})); return s;
}
export function validate(s) {
 if (!s || s.schema !== SCHEMA || typeof s.sample !== 'boolean' || !s.brief || !s.scenario || !Array.isArray(s.observations) || s.observations.length>2000) throw new Error('This is not a supported PilotProof workspace (maximum 2,000 comparisons).');
 const b=s.brief;for(const k of ['name','client','owner','workflow','hypothesis','unit','notes'])str(b[k],k,k==='notes'||k==='hypothesis'||k==='workflow'?2000:150,k==='name'||k==='unit');
 num(b.target,'Time target',100);num(b.minPairs,'Minimum comparisons',2000,1);if(!Number.isInteger(b.minPairs))throw Error('Minimum comparisons must be a whole number.');
 for(const k of ['start','end'])if(b[k]!==''&&!date(b[k]))throw Error('Check pilot dates.');if(b.start&&b.end&&b.end<b.start)throw Error('Pilot end must be on or after its start.');
 const a=s.scenario;num(a.monthlyUnits,'Monthly volume');num(a.hourlyValue,'Hourly capacity value',10000);num(a.realization,'Usable capacity percentage',100);num(a.monthlyCost,'Monthly cost');num(a.setupCost,'Setup cost');
 const ids=new Set();for(const o of s.observations){str(o.id,'Comparison ID',150,true);if(ids.has(o.id))throw Error('Duplicate comparison IDs.');ids.add(o.id);str(o.label,'Comparison label',150,true);str(o.note,'Comparison note',2000);str(o.exclusion,'Exclusion reason',500);if(!date(o.date))throw Error('Each comparison needs a valid date.');num(o.units,'Matched units',1e6,1);if(!Number.isInteger(o.units))throw Error('Matched units must be a whole number.');for(const k of ['baseline','baselineRework','trial','trialRework'])num(o[k],k,1e6);if(o.baseline+o.baselineRework<=0)throw Error('Baseline total time must be greater than zero.');for(const k of ['baselineQuality','trialQuality'])if(!['pass','fail','unchecked'].includes(o[k]))throw Error('Quality must be pass, fail, or not checked.');if(typeof o.included!=='boolean'||(!o.included&&!o.exclusion.trim()))throw Error('Excluded comparisons need a reason.');}
 return s;
}
export function analyze(s) {
 validate(s);const rows=s.observations.filter(o=>o.included),n=rows.length,units=rows.reduce((a,o)=>a+o.units,0);
 const total=k=>rows.reduce((a,o)=>a+o[k],0),base=total('baseline')+total('baselineRework'),trial=total('trial')+total('trialRework');
 const basePer=units?base/units:null,trialPer=units?trial/units:null,delta=units?(base-trial)/units:null,reduction=base?100*(base-trial)/base:null;
 const qualityRows=rows.filter(o=>o.baselineQuality!=='unchecked'&&o.trialQuality!=='unchecked');
 const qualityCount=qualityRows.length,basePass=qualityRows.filter(o=>o.baselineQuality==='pass').length,trialPass=qualityRows.filter(o=>o.trialQuality==='pass').length;
 const qualityDelta=qualityCount?100*(trialPass-basePass)/qualityCount:null;
 const enough=n>=s.brief.minPairs,qualityComplete=n>0&&qualityCount===n,timeMet=reduction!==null&&reduction>=s.brief.target,qualityMet=qualityComplete&&qualityDelta>=0;
 const status=!n?'No observations':!enough?'Keep measuring':!qualityComplete?'Check quality':timeMet&&qualityMet?'Targets met in sample':'Targets not met';
 const a=s.scenario,hours=delta===null?null:delta*a.monthlyUnits/60,usableHours=hours===null?null:hours*a.realization/100,capacityValue=usableHours===null?null:usableHours*a.hourlyValue,net=capacityValue===null?null:capacityValue-a.monthlyCost,payback=net!==null&&net>0?a.setupCost/net:null;
 return {rows,n,excluded:s.observations.length-n,units,base,trial,basePer,trialPer,delta,reduction,baselineRework:total('baselineRework'),trialRework:total('trialRework'),qualityCount,basePass,trialPass,qualityDelta,enough,qualityComplete,timeMet,qualityMet,status,hours,usableHours,capacityValue,net,payback};
}
export function csvCell(value) { let t=String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"'; }
export function toCsv(s) { validate(s);const keys=['label','date','units','baseline','baselineRework','trial','trialRework','baselineQuality','trialQuality','included','exclusion','note'];return [keys.map(csvCell).join(','),...s.observations.map(o=>keys.map(k=>csvCell(o[k])).join(','))].join('\r\n'); }
export const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
