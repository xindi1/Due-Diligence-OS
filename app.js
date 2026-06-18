
const STORAGE_KEY='due_diligence_os_entries_v1';
const THEME_KEY='due_diligence_os_theme';
const OPP_KEY='due_diligence_os_active_opp';

const domains={
 questions:{label:'Questions',signal:'Unknowns',prompts:['How many exist?','What do providers charge?','Who feels this pain?','Current workaround?','What must be true?']},
 market:{label:'Market',signal:'Size',prompts:['Market count','Segment size','Geography','Growth signal','Spend estimate']},
 customer:{label:'Customer',signal:'Voice',prompts:['Interview note','User quote','Observed pain','Board member input','Attorney input']},
 technology:{label:'Technology',signal:'Fit',prompts:['Repetitive task','Rules-based task','Communication-heavy','Human judgment required','AI opportunity']},
 commercial:{label:'Commercial',signal:'Revenue',prompts:['SaaS path','Service path','Licensing path','Buyer','Pricing model']}
};

let entries=loadEntries();
let activeDate=todayKey();
let activeOpportunity=localStorage.getItem(OPP_KEY)||'';

function todayKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function parseKey(k){return new Date(`${k}T12:00:00`)}
function shiftDate(k,delta){const d=parseKey(k);d.setDate(d.getDate()+delta);return todayKey(d)}
function timeText(iso){return new Date(iso).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})}
function dateLabel(k){if(k===todayKey())return'Today';return parseKey(k).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}
function fullDateLabel(k){return parseKey(k).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric',year:'numeric'})}
function greetingText(){const h=new Date().getHours();if(h<12)return'Good morning, Rob.';if(h<17)return'Good afternoon, Rob.';return'Good evening, Rob.'}
function loadEntries(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return[]}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(entries))}
function persistOpp(){localStorage.setItem(OPP_KEY,activeOpportunity||'')}
function currentOpp(){return activeOpportunity.trim()||'Unassigned Opportunity'}
function getEntries(domain,key=activeDate){return entries.filter(e=>e.date===key&&(!domain||e.domain===domain)&&e.opportunity===currentOpp())}
function getAllEntries(domain){return entries.filter(e=>(!domain||e.domain===domain)&&e.opportunity===currentOpp())}
function getOpps(){const names=[...new Set(entries.map(e=>e.opportunity).filter(Boolean))];if(activeOpportunity&&!names.includes(activeOpportunity))names.unshift(activeOpportunity);return names}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v}
function uid(){return crypto&&crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(16).slice(2)}`}

function init(){
 const saved=localStorage.getItem(THEME_KEY);if(saved==='dark')document.documentElement.classList.add('dark');
 document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
 document.querySelectorAll('.quick-form').forEach(f=>f.addEventListener('submit',handleSubmit));
 document.querySelectorAll('.date-pill').forEach(p=>{const [prev,next]=p.querySelectorAll('button');prev?.addEventListener('click',()=>changeDate(-1));next?.addEventListener('click',()=>changeDate(1));});
 document.getElementById('themeBtn')?.addEventListener('click',toggleTheme);
 document.getElementById('setOppBtn')?.addEventListener('click',setOpportunity);
 document.getElementById('briefBtn')?.addEventListener('click',exportBrief);
 document.getElementById('exportBtn')?.addEventListener('click',exportData);
 document.getElementById('importFile')?.addEventListener('change',importData);
 document.getElementById('clearBtn')?.addEventListener('click',clearAll);
 renderChips();render();
}
function switchView(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id)?.classList.add('active');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));window.scrollTo({top:0,behavior:'smooth'})}
function changeDate(delta){activeDate=shiftDate(activeDate,delta);render()}
function setOpportunity(){const i=document.getElementById('oppInput');const v=i.value.trim();if(!v){i.focus();return}activeOpportunity=v;persistOpp();render()}
function chooseOpp(name){activeOpportunity=name;persistOpp();render()}
function handleSubmit(e){
 e.preventDefault();const form=e.currentTarget;const domain=form.dataset.domain;const ta=form.querySelector('textarea');const text=ta.value.trim();let meta={};
 if(!domain||!domains[domain])return;
 if(!activeOpportunity.trim()){const opp=prompt('Name this opportunity first');if(!opp||!opp.trim())return;activeOpportunity=opp.trim();persistOpp()}
 if(!text){ta.focus();return}
 form.querySelectorAll('input').forEach(input=>{const val=input.value.trim();if(val)meta[input.name||'extra']=val});
 entries.unshift({id:uid(),opportunity:currentOpp(),domain,text,meta,date:activeDate,createdAt:new Date().toISOString()});
 persist();form.reset();render();
}
function render(){renderDates();renderOpportunity();renderDashboard();renderDomainEntries();renderMetrics()}
function renderDates(){setText('todayDate',fullDateLabel(activeDate));document.querySelectorAll('.date-pill span').forEach(s=>s.textContent=dateLabel(activeDate))}
function renderOpportunity(){
 const input=document.getElementById('oppInput');if(input)input.value=activeOpportunity;
 setText('activeOppName',currentOpp());
 const list=document.getElementById('oppList');if(list){const opps=getOpps();list.innerHTML=opps.length?opps.map(n=>`<button type="button" onclick="chooseOpp('${esc(n).replaceAll("'","&#39;")}')">${esc(n)}</button>`).join(''):'<span class="muted small">No saved opportunities yet.</span>'}
}
function renderMetrics(){Object.keys(domains).forEach(d=>{const n=getAllEntries(d).length;setText(`${d}Metric`,`${n} entr${n===1?'y':'ies'}`);setText(`${d}Sub`,n?`${n} total for this opportunity`:'Not logged');setText(`${d}Score`,n)})}
function renderDashboard(){
 setText('greeting',greetingText());
 const icons={questions:'?',market:'◌',customer:'◉',technology:'✦',commercial:'$'};
 const colors={questions:'#dbeafe',market:'#e0f2fe',customer:'#ffedd5',technology:'#dcfce7',commercial:'#fef3c7'};
 const wrap=document.getElementById('domainCards');
 if(wrap)wrap.innerHTML=['questions','market','customer','technology','commercial'].map(k=>{const d=domains[k],n=getAllEntries(k).length,t=getEntries(k).length;return `<article class="summary-row" onclick="switchView('${k}')"><div class="summary-icon" style="background:${colors[k]}">${icons[k]}</div><div><div class="summary-title">${d.label}</div><div class="summary-meta">${n?n+' total · '+t+' today':'Not logged'}</div></div><div class="summary-score">${n}<div class="small muted">inputs</div></div><div class="chev">›</div></article>`}).join('');
 const day=getEntries();setText('entryCount',`${day.length} ${day.length===1?'entry':'entries'}`);
 const l=document.getElementById('todayEntries');if(l){l.classList.toggle('empty',!day.length);l.innerHTML=day.length?day.map(entryHtml).join(''):'No due diligence entries yet.'}
 renderWeekBars();
}
function renderWeekBars(){const wrap=document.getElementById('weekBars');if(!wrap)return;const now=parseKey(activeDate);const days=[];for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(now.getDate()-i);const key=todayKey(d);const completed=Object.keys(domains).filter(x=>entries.some(e=>e.date===key&&e.domain===x&&e.opportunity===currentOpp())).length;days.push({key,completed})}wrap.innerHTML=days.map(day=>`<div class="bar-wrap"><div class="bar" style="height:${Math.max(6,day.completed/5*78)}px"></div><span>${dateLabel(day.key).split(' ')[0]}</span></div>`).join('');setText('trendLabel',days.at(-1).completed>=3?'Research momentum':'Building signal')}
function renderDomainEntries(){document.querySelectorAll('.domain-view').forEach(v=>{const d=v.dataset.domain,t=v.querySelector('.domain-entries');if(!t)return;const items=getAllEntries(d).slice(0,50);t.innerHTML=items.length?items.map(entryHtml).join(''):`<div class="empty-card muted">No ${domains[d].label.toLowerCase()} entries for this opportunity yet.</div>`})}
function entryHtml(e){const extra=Object.entries(e.meta||{}).filter(([k,v])=>v).map(([k,v])=>`${k}: ${v}`).join(' · ');return `<article class="entry"><div class="entry-top"><span>${domains[e.domain].label}</span><span>${e.date===todayKey()?timeText(e.createdAt):dateLabel(e.date)}</span></div><div class="entry-main">${esc(e.text)}</div>${extra?`<p class="muted small">${esc(extra)}</p>`:''}<div class="entry-actions"><button class="delete" type="button" onclick="deleteEntry('${e.id}')">Delete</button></div></article>`}
function deleteEntry(id){entries=entries.filter(e=>e.id!==id);persist();render()}
function renderChips(){document.querySelectorAll('.chips').forEach(w=>{const d=w.dataset.target;w.innerHTML=domains[d].prompts.map(p=>`<button type="button">${p}</button>`).join('');w.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>fillPrompt(d,b.textContent)))})}
function fillPrompt(d,text){const v=document.querySelector(`.domain-view[data-domain="${d}"]`);const ta=v?.querySelector('textarea');if(!ta)return;ta.value=ta.value?`${ta.value}\n${text}`:text;ta.focus()}
function buildBrief(){const collect=d=>getAllEntries(d).map(e=>`- ${e.text}`).join('\n')||'- Not yet captured';return `DUE DILIGENCE BRIEF\n\nOpportunity: ${currentOpp()}\nGenerated: ${new Date().toLocaleString()}\n\nRESEARCH QUESTIONS\n${collect('questions')}\n\nMARKET\n${collect('market')}\n\nCUSTOMER\n${collect('customer')}\n\nTECHNOLOGY FIT\n${collect('technology')}\n\nCOMMERCIALIZATION\n${collect('commercial')}\n\nPRELIMINARY RECOMMENDATION\nChoose one: Kill / Monitor / Explore / Build / Accelerate\n`}
function exportBrief(){if(!activeOpportunity.trim()){alert('Name an opportunity first.');return}const blob=new Blob([buildBrief()],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${currentOpp().toLowerCase().replace(/[^a-z0-9]+/g,'-')}-due-diligence-brief.txt`;a.click();URL.revokeObjectURL(a.href)}
function toggleTheme(){document.documentElement.classList.toggle('dark');localStorage.setItem(THEME_KEY,document.documentElement.classList.contains('dark')?'dark':'light')}
function exportData(){const blob=new Blob([JSON.stringify({app:'Due Diligence OS',version:1,exportedAt:new Date().toISOString(),activeOpportunity,entries},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`due-diligence-os-export-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href)}
function importData(ev){const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(Array.isArray(data.entries)){entries=[...data.entries,...entries];if(data.activeOpportunity)activeOpportunity=data.activeOpportunity;persist();persistOpp();render();alert('Import complete.')}else alert('Import file did not contain entries.')}catch{alert('Could not import JSON.')}};r.readAsText(f);ev.target.value=''}
function clearAll(){if(confirm('Clear all Due Diligence OS entries on this device?')){entries=[];activeOpportunity='';persist();persistOpp();render()}}
window.deleteEntry=deleteEntry;window.switchView=switchView;window.chooseOpp=chooseOpp;init();
