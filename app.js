
const STORAGE_KEY='due_diligence_os_entries_v1_2';
const LEGACY_KEY='due_diligence_os_entries_v1_1';
const THEME_KEY='due_diligence_os_theme';
const OPP_KEY='due_diligence_os_active_opp';
const OPP_META_KEY='due_diligence_os_opp_meta_v1_2';

const domains={
 hypotheses:{label:'Hypotheses',signal:'Thesis',icon:'H',color:'#ede9fe',prompts:['Market gap hypothesis','Customer pain hypothesis','Solution hypothesis','Pricing hypothesis','Distribution hypothesis']},
 questions:{label:'Questions',signal:'Unknowns',icon:'?',color:'#dbeafe',prompts:['How many exist?','What do providers charge?','Who feels this pain?','Current workaround?','What must be true?']},
 research:{label:'Research',signal:'Findings',icon:'⌕',color:'#e0f2fe',prompts:['Market fact','Competitor fact','Pricing fact','Industry data','Regulatory finding']},
 customer:{label:'Customer',signal:'Voice',icon:'◉',color:'#ffedd5',prompts:['Interview note','User quote','Observed pain','Board member input','Attorney input']},
 solution:{label:'Solution',signal:'Approach',icon:'✦',color:'#dcfce7',prompts:['AI assistant','Workflow layer','Service model','Automation opportunity','Prototype idea']},
 commercial:{label:'Commercial',signal:'Revenue',icon:'$',color:'#fef3c7',prompts:['SaaS path','Service path','Licensing path','Buyer','Pricing model']},
 decisions:{label:'Decisions',signal:'Direction',icon:'✓',color:'#d1fae5',prompts:['Continue Research','Conduct Interviews','Build Prototype','Pilot Test','Pause Opportunity','Archive Opportunity']}
};
const domainOrder=['hypotheses','questions','research','customer','solution','commercial','decisions'];

let entries=loadEntries();
let oppMeta=loadOppMeta();
let activeDate=todayKey();
let activeOpportunity=localStorage.getItem(OPP_KEY)||'';

function todayKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function parseKey(k){return new Date(`${k}T12:00:00`)}
function shiftDate(k,delta){const d=parseKey(k);d.setDate(d.getDate()+delta);return todayKey(d)}
function timeText(iso){return new Date(iso||Date.now()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})}
function dateLabel(k){if(k===todayKey())return'Today';return parseKey(k).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}
function fullDateLabel(k){return parseKey(k).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric',year:'numeric'})}
function greetingText(){const h=new Date().getHours();if(h<12)return'Good morning, Rob.';if(h<17)return'Good afternoon, Rob.';return'Good evening, Rob.'}
function uid(){return crypto&&crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(16).slice(2)}`}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v}
function normalizeDomain(v){
 const d=(v||'').toLowerCase();
 if(d==='technology'||d==='tech')return'solution';
 if(d==='money'||d==='commercialization')return'commercial';
 if(d==='hypothesis')return'hypotheses';
 if(d==='decision')return'decisions';
 return d;
}
function normalizeEntry(e){
 const domain=normalizeDomain(e.domain||e.track||e.category||'');
 return {
   id:e.id||uid(),
   opportunity:e.opportunity||e.opp||e.opportunityName||activeOpportunity||'Unassigned Opportunity',
   domain:domains[domain]?domain:'research',
   text:e.text||e.content||e.note||e.title||'',
   meta:e.meta&&typeof e.meta==='object'?e.meta:{},
   date:e.date||todayKey(),
   createdAt:e.createdAt||new Date().toISOString()
 };
}
function loadEntries(){
 let arr=[];
 try{arr=JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{arr=[]}
 if(!arr.length){
   try{arr=JSON.parse(localStorage.getItem(LEGACY_KEY))||[]}catch{}
   if(arr.length){arr=arr.map(normalizeEntry);localStorage.setItem(STORAGE_KEY,JSON.stringify(arr))}
 }
 return arr.map(normalizeEntry).filter(e=>e.text);
}
function loadOppMeta(){try{return JSON.parse(localStorage.getItem(OPP_META_KEY))||{}}catch{return{}}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(entries))}
function persistOpp(){localStorage.setItem(OPP_KEY,activeOpportunity||'')}
function persistMeta(){localStorage.setItem(OPP_META_KEY,JSON.stringify(oppMeta))}
function currentOpp(){return activeOpportunity.trim()||'Unassigned Opportunity'}
function currentMeta(){const opp=currentOpp();oppMeta[opp]=oppMeta[opp]||{status:'Active',thesis:''};return oppMeta[opp]}
function getEntries(domain,key=null,opp=currentOpp()){
 return entries.filter(e=>(!key||e.date===key)&&(!domain||e.domain===domain)&&e.opportunity===opp)
}
function getAllEntries(domain=null,opp=currentOpp()){return getEntries(domain,null,opp)}
function getOpps(){
 const names=[...new Set([...entries.map(e=>e.opportunity).filter(Boolean),...Object.keys(oppMeta)])];
 if(activeOpportunity&&!names.includes(activeOpportunity))names.unshift(activeOpportunity);
 return names;
}

function init(){
 const saved=localStorage.getItem(THEME_KEY);if(saved==='dark')document.documentElement.classList.add('dark');
 document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
 document.querySelectorAll('.quick-form').forEach(f=>f.addEventListener('submit',handleSubmit));
 document.querySelectorAll('.date-pill').forEach(p=>{const [prev,next]=p.querySelectorAll('button');prev?.addEventListener('click',()=>changeDate(-1));next?.addEventListener('click',()=>changeDate(1));});
 document.getElementById('themeBtn')?.addEventListener('click',toggleTheme);
 document.getElementById('setOppBtn')?.addEventListener('click',setOpportunity);
 document.getElementById('saveOppMetaBtn')?.addEventListener('click',saveOppMeta);
 document.getElementById('briefBtn')?.addEventListener('click',exportBrief);
 document.getElementById('exportAllBtn')?.addEventListener('click',exportAll);
 document.getElementById('exportOppBtn')?.addEventListener('click',exportOpportunity);
 document.getElementById('importFile')?.addEventListener('change',importData);
 document.getElementById('clearOppBtn')?.addEventListener('click',clearOpportunity);
 document.getElementById('clearAllBtn')?.addEventListener('click',clearAll);
 renderChips();render();
}
function switchView(id){
 document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
 document.getElementById(id)?.classList.add('active');
 document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
 window.scrollTo({top:0,behavior:'smooth'})
}
function changeDate(delta){activeDate=shiftDate(activeDate,delta);render()}
function setOpportunity(){
 const i=document.getElementById('oppInput');const v=i.value.trim();if(!v){i.focus();return}
 activeOpportunity=v;persistOpp();currentMeta();persistMeta();render()
}
function chooseOpp(name){activeOpportunity=name;persistOpp();render()}
function saveOppMeta(){
 if(!activeOpportunity.trim()){alert('Name an opportunity first.');return}
 const meta=currentMeta();
 meta.status=document.getElementById('oppStatus')?.value||'Active';
 meta.thesis=document.getElementById('oppThesis')?.value.trim()||'';
 persistMeta();render();
}
function handleSubmit(e){
 e.preventDefault();const form=e.currentTarget;const domain=form.dataset.domain;const ta=form.querySelector('textarea');const text=ta.value.trim();let meta={};
 if(!domain||!domains[domain])return;
 if(!activeOpportunity.trim()){const opp=prompt('Name this opportunity first');if(!opp||!opp.trim())return;activeOpportunity=opp.trim();persistOpp();currentMeta();persistMeta()}
 if(!text){ta.focus();return}
 form.querySelectorAll('input,select').forEach(input=>{const val=input.value.trim();if(val)meta[input.name||'extra']=val});
 entries.unshift({id:uid(),opportunity:currentOpp(),domain,text,meta,date:activeDate,createdAt:new Date().toISOString()});
 persist();form.reset();render();
}
function render(){renderDates();renderOpportunity();renderDashboard();renderDomainEntries();renderMetrics()}
function renderDates(){setText('todayDate',fullDateLabel(activeDate));document.querySelectorAll('.date-pill span').forEach(s=>s.textContent=dateLabel(activeDate))}
function renderOpportunity(){
 const input=document.getElementById('oppInput');if(input)input.value=activeOpportunity;
 setText('activeOppName',currentOpp());
 const meta=currentMeta();
 const status=document.getElementById('oppStatus');if(status)status.value=meta.status||'Active';
 const thesis=document.getElementById('oppThesis');if(thesis)thesis.value=meta.thesis||'';
 setText('oppStatusBadge',meta.status||'Active');
 setText('oppThesisText',meta.thesis||'No thesis captured yet.');
 const list=document.getElementById('oppList');
 if(list){const opps=getOpps();list.innerHTML=opps.length?opps.map(n=>`<button type="button" onclick="chooseOpp('${esc(n).replaceAll("'","&#39;")}')">${esc(n)}</button>`).join(''):'<span class="muted small">No saved opportunities yet.</span>'}
}
function renderMetrics(){domainOrder.forEach(d=>{const n=getAllEntries(d).length;setText(`${d}Metric`,`${n} entr${n===1?'y':'ies'}`);setText(`${d}Sub`,n?`${n} total for this opportunity`:'Not logged');setText(`${d}Score`,n)})}
function renderDashboard(){
 setText('greeting',greetingText());
 const wrap=document.getElementById('domainCards');
 if(wrap)wrap.innerHTML=domainOrder.map(k=>{const d=domains[k],n=getAllEntries(k).length,t=getEntries(k,activeDate).length;return `<article class="summary-row" onclick="switchView('${k}')"><div class="summary-icon" style="background:${d.color}">${d.icon}</div><div><div class="summary-title">${d.label}</div><div class="summary-meta">${n?n+' total · '+t+' today':'Not logged'}</div></div><div class="summary-score">${n}<div class="small muted">inputs</div></div><div class="chev">›</div></article>`}).join('');
 const day=getEntries(null,activeDate);
 setText('entryCount',`${day.length} ${day.length===1?'entry':'entries'}`);
 const l=document.getElementById('todayEntries');
 if(l){l.classList.toggle('empty',!day.length);l.innerHTML=day.length?day.map(entryHtml).join(''):'No due diligence entries yet.'}
 renderWeekBars();
}
function renderWeekBars(){
 const wrap=document.getElementById('weekBars');if(!wrap)return;const now=parseKey(activeDate);const days=[];
 for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(now.getDate()-i);const key=todayKey(d);const count=entries.filter(e=>e.date===key&&e.opportunity===currentOpp()).length;days.push({key,count})}
 const max=Math.max(1,...days.map(d=>d.count));
 wrap.innerHTML=days.map(day=>`<div class="bar-wrap"><div class="bar" style="height:${Math.max(6,day.count/max*78)}px"></div><span>${dateLabel(day.key).split(' ')[0]}</span></div>`).join('');
 setText('trendLabel',days.at(-1).count>=3?'Research momentum':'Building signal')
}
function renderDomainEntries(){document.querySelectorAll('.domain-view').forEach(v=>{const d=v.dataset.domain,t=v.querySelector('.domain-entries');if(!t)return;const items=getAllEntries(d).slice(0,100);t.innerHTML=items.length?items.map(entryHtml).join(''):`<div class="empty-card muted">No ${domains[d].label.toLowerCase()} entries for this opportunity yet.</div>`})}
function entryHtml(e){const domain=domains[e.domain]||{label:e.domain||'Entry'};const extra=Object.entries(e.meta||{}).filter(([k,v])=>v).map(([k,v])=>`${k}: ${v}`).join(' · ');return `<article class="entry"><div class="entry-top"><span>${domain.label}</span><span>${e.date===todayKey()?timeText(e.createdAt):dateLabel(e.date)}</span></div><div class="entry-main">${esc(e.text)}</div>${extra?`<p class="muted small">${esc(extra)}</p>`:''}<div class="entry-actions"><button class="delete" type="button" onclick="deleteEntry('${e.id}')">Delete</button></div></article>`}
function deleteEntry(id){entries=entries.filter(e=>e.id!==id);persist();render()}
function renderChips(){document.querySelectorAll('.chips').forEach(w=>{const d=w.dataset.target;if(!domains[d])return;w.innerHTML=domains[d].prompts.map(p=>`<button type="button">${p}</button>`).join('');w.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>fillPrompt(d,b.textContent)))})}
function fillPrompt(d,text){const v=document.querySelector(`.domain-view[data-domain="${d}"]`);const ta=v?.querySelector('textarea');if(!ta)return;ta.value=ta.value?`${ta.value}\n${text}`:text;ta.focus()}
function buildBrief(){
 const collect=d=>getAllEntries(d).map(e=>`- ${e.text}${e.meta&&Object.keys(e.meta).length?' ['+Object.entries(e.meta).map(([k,v])=>`${k}: ${v}`).join('; ')+']':''}`).join('\n')||'- Not yet captured';
 const meta=currentMeta();
 return `DUE DILIGENCE BRIEF\n\nOpportunity: ${currentOpp()}\nStatus: ${meta.status||'Active'}\nThesis: ${meta.thesis||'Not captured'}\nGenerated: ${new Date().toLocaleString()}\n\nHYPOTHESES\n${collect('hypotheses')}\n\nQUESTIONS\n${collect('questions')}\n\nRESEARCH\n${collect('research')}\n\nCUSTOMER\n${collect('customer')}\n\nSOLUTION\n${collect('solution')}\n\nCOMMERCIAL\n${collect('commercial')}\n\nDECISIONS\n${collect('decisions')}\n`;
}
function exportBrief(){if(!activeOpportunity.trim()){alert('Name an opportunity first.');return}downloadText(buildBrief(),`${currentOpp().toLowerCase().replace(/[^a-z0-9]+/g,'-')}-due-diligence-brief.txt`,'text/plain')}
function downloadText(text,filename,type='application/json'){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href)}
function toggleTheme(){document.documentElement.classList.toggle('dark');localStorage.setItem(THEME_KEY,document.documentElement.classList.contains('dark')?'dark':'light')}
function exportAll(){downloadText(JSON.stringify({app:'Due Diligence OS',version:'1.2',exportedAt:new Date().toISOString(),activeOpportunity,opportunityMeta:oppMeta,entries},null,2),`due-diligence-os-all-${todayKey()}.json`)}
function exportOpportunity(){const opp=currentOpp();downloadText(JSON.stringify({app:'Due Diligence OS',version:'1.2',exportedAt:new Date().toISOString(),activeOpportunity:opp,opportunityMeta:{[opp]:currentMeta()},entries:entries.filter(e=>e.opportunity===opp)},null,2),`${opp.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-due-diligence-export.json`)}
function importData(ev){
 const f=ev.target.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{try{
   const data=JSON.parse(r.result);
   if(data.opportunityMeta&&typeof data.opportunityMeta==='object'){oppMeta={...oppMeta,...data.opportunityMeta};persistMeta()}
   if(Array.isArray(data.entries)){
     const imported=data.entries.map(normalizeEntry).filter(e=>e.text);
     entries=[...imported,...entries];if(data.activeOpportunity)activeOpportunity=data.activeOpportunity;persist();persistOpp();render();alert(`Import complete: ${imported.length} entries.`);
   }else alert('Import file did not contain entries.');
 }catch(err){alert('Could not import JSON.')}};r.readAsText(f);ev.target.value=''
}
function clearOpportunity(){const opp=currentOpp();if(confirm(`Clear all entries for ${opp}?`)){entries=entries.filter(e=>e.opportunity!==opp);delete oppMeta[opp];persist();persistMeta();render()}}
function clearAll(){if(confirm('Clear all Due Diligence OS entries on this device?')){entries=[];oppMeta={};activeOpportunity='';persist();persistMeta();persistOpp();render()}}
window.deleteEntry=deleteEntry;window.switchView=switchView;window.chooseOpp=chooseOpp;init();
