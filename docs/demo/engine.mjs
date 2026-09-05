export const services = {
  website: {label:'Website launch', deliverable:'A launch brief, content and access checklist, and a review plan', specialist:'Web lead', tasks:[['Map pages and conversion goals','Web lead',2,'brief'],['Collect brand files and website access','Client contact',2,'assets'],['Prepare the first page direction','Web lead',4,'delivery'],['Review the first page direction','Client contact',5,'review']]},
  media: {label:'Paid media kickoff', deliverable:'A campaign brief, access checklist, and a tracking review plan', specialist:'Media lead', tasks:[['Confirm audience and campaign objective','Media lead',2,'brief'],['Request advertising and analytics access','Client contact',2,'assets'],['Review conversion tracking','Media lead',3,'delivery'],['Review the campaign launch plan','Client contact',5,'review']]},
  brand: {label:'Brand refresh', deliverable:'A creative brief, asset checklist, and a direction review plan', specialist:'Design lead', tasks:[['Confirm audience and creative direction','Design lead',2,'brief'],['Collect existing brand files and examples','Client contact',2,'assets'],['Prepare the first visual direction','Design lead',4,'delivery'],['Review the first visual direction','Client contact',5,'review']]}
};
export function businessDate(value,offset=0){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Choose a valid kickoff date.');
  const date=new Date(value+'T12:00:00Z');
  if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==value)throw new Error('Choose a valid kickoff date.');
  while([0,6].includes(date.getUTCDay()))date.setUTCDate(date.getUTCDate()+1);
  for(let i=0;i<offset;i++){date.setUTCDate(date.getUTCDate()+1);while([0,6].includes(date.getUTCDay()))date.setUTCDate(date.getUTCDate()+1);}
  return date.toISOString().slice(0,10);
}
export function formatDate(v){return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(v+'T12:00:00Z'));}
export function sampleInput(){const local=new Date();const y=local.getFullYear(),m=String(local.getMonth()+1).padStart(2,'0'),d=String(local.getDate()).padStart(2,'0');return {company:'Harbor & Pine',contact:'Morgan',email:'morgan@example.com',service:'website',goal:'Turn more website visits into qualified consultation requests.',kickoff:businessDate(`${y}-${m}-${d}`,1),notes:'Keep the existing logo. The client will supply photography. Confirm who approves the final direction.'};}
export function validate(input){
  const issues=[];
  if(!input.company?.trim())issues.push('Add a client or company name.');
  if(!input.contact?.trim())issues.push('Add a contact name.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email||''))issues.push('Add a valid contact email.');
  if(!services[input.service])issues.push('Choose a service.');
  if((input.goal||'').trim().length<12)issues.push('Describe the client goal in at least 12 characters.');
  try{businessDate(input.kickoff);}catch(e){issues.push(e.message);}
  return issues;
}
export function buildProject(input){
  const issues=validate(input);if(issues.length)throw new Error(issues.join(' '));
  const source=Object.fromEntries(Object.entries(input).map(([k,v])=>[k,String(v).trim()]));
  const service=services[source.service];const kickoff=businessDate(source.kickoff);
  const raw=[['Confirm scope and approval owner','Account lead',0,'scope'],['Schedule the kickoff and share the brief','Project manager',1,'kickoff'],...service.tasks,['Confirm next steps and hand over the plan','Project manager',6,'handover']];
  const dependencies={scope:[],kickoff:['scope'],brief:['kickoff'],assets:['kickoff'],delivery:['brief','assets'],review:['delivery'],handover:['review']};
  const tasks=raw.map(([title,owner,day,id])=>({id,title,owner,due:businessDate(kickoff,day),done:false,dependencies:dependencies[id]}));
  return {input:source,service:service.label,deliverable:service.deliverable,kickoff,tasks,approved:false,welcome:{subject:`Your ${service.label.toLowerCase()} with the team`,body:`Hi ${source.contact},\n\nWe're looking forward to working with ${source.company}.\n\nOur starting goal: ${source.goal}\n\nWe've prepared your ${service.label.toLowerCase()} onboarding plan. The proposed kickoff is ${formatDate(kickoff)}. Please confirm that date and who will approve the work.\n\nNext, we'll confirm the scope, collect the required access and materials, and agree on the first review.\n\n${source.notes?'Notes from your intake: '+source.notes+'\n\n':''}Please reply with any changes or questions before we begin.\n\nThanks,\nYour project team`}};
}
export function taskState(task,project){if(task.done)return 'Done';if(!project.approved)return 'Awaiting approval';return task.dependencies.some(id=>!project.tasks.find(x=>x.id===id)?.done)?'Waiting':'Ready';}
export function toggleTask(project,id,done){const task=project.tasks.find(t=>t.id===id);if(!task)throw new Error('Task not found.');if(done&&taskState(task,project)!=='Ready')throw new Error('Approve the brief and complete the prerequisites first.');task.done=done;let changed=true;while(changed){changed=false;for(const item of project.tasks){if(item.done&&item.dependencies.some(dep=>!project.tasks.find(t=>t.id===dep)?.done)){item.done=false;changed=true;}}}return project;}
export function toMarkdown(p){return `# ${p.input.company} | ${p.service}\n\nInteractive XLR8 sample. No connected accounts or messages sent.\nStatus: ${p.approved?'Brief approved in demo':'Draft for review'}\n\n## Project brief\nContact: ${p.input.contact} <${p.input.email}>\nProposed kickoff: ${formatDate(p.kickoff)}\nGoal: ${p.input.goal}\nDeliverable: ${p.deliverable}\nNotes: ${p.input.notes||'No additional notes supplied.'}\n\n## Confirm before starting\n- Final scope and budget\n- Approval owner\n- Access and asset availability\n\n## Task plan\n${p.tasks.map(t=>`- [${t.done?'x':' '}] ${t.title} | ${t.owner} | ${t.due} | ${taskState(t,p)}`).join('\n')}\n\n## Welcome email draft (not sent)\nSubject: ${p.welcome.subject}\n\n${p.welcome.body}\n`;}
function csvCell(v){const s=String(v);return '"'+(/^[=+@\-\t\r]/.test(s)?"'":'')+s.replaceAll('"','""')+'"';}
export function toCSV(p){return [['Task','Owner','Due date','Status','Depends on'],...p.tasks.map(t=>[t.title,t.owner,t.due,taskState(t,p),t.dependencies.join('; ')])].map(r=>r.map(csvCell).join(',')).join('\r\n');}
