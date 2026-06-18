const STORAGE_KEY = 'due_diligence_os_v2_opportunities';
const THEME_KEY = 'due_diligence_os_theme';

const tracks = {
  questions: { label:'Questions', signal:'Unknowns', icon:'?', color:'#dbeafe', prompts:['Market size question','Pricing question','Customer pain question','Competitor question','Legal/compliance question'] },
  market: { label:'Market', signal:'Size', icon:'◌', color:'#e0f2fe', prompts:['Market size','Customer count','Segment size','Geography','Growth signal'] },
  competition: { label:'Competition', signal:'Alternatives', icon:'◈', color:'#ede9fe', prompts:['Competitor','Pricing','Feature set','Customer complaint','Current workaround'] },
  customer: { label:'Customer', signal:'Voice', icon:'◉', color:'#ffedd5', prompts:['Interview note','User quote','Observed pain','Board member input','Attorney input'] },
  technology: { label:'Technology', signal:'Fit', icon:'✦', color:'#dcfce7', prompts:['Repetitive task','Rules-based task','Communication-heavy','Human judgment required','AI opportunity'] },
  advantage: { label:'Advantage', signal:'Proximity', icon:'◆', color:'#fce7f3', prompts:['Access','Experience','Relationship','Documents','Credibility'] },
  commercialization: { label:'Commercial', signal:'Money', icon:'$', color:'#fef3c7', prompts:['SaaS path','Service path','Licensing path','Buyer','Pricing model'] }
};

const recommendations = ['Kill','Monitor','Explore','Build','Accelerate'];

let opportunities = load();
let activeDate = todayKey();
let activeId = opportunities[0]?.id || null;

function todayKey(d=new Date()){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseKey(k){ return new Date(`${k}T12:00:00`); }
function shiftDate(k,delta){ const d=parseKey(k); d.setDate(d.getDate()+delta); return todayKey(d); }
function dateLabel(k){ if(k===todayKey()) return 'Today'; return parseKey(k).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'}); }
function fullDateLabel(k){ return parseKey(k).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric',year:'numeric'}); }
function timeText(iso){ return new Date(iso).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false}); }
function greetingText(){ const h=new Date().getHours(); if(h<12)return'Good morning, Rob.'; if(h<17)return'Good afternoon, Rob.'; return'Good evening, Rob.'; }
function load(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return[]} }
function persist(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(opportunities)); }
function uid(){ return crypto&&crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function esc(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
function makeOpportunity(name){ return {id:uid(),name,status:'Explore',createdAt:new Date().toISOString(),entries:[]}; }
function makeEntry(track,text){ return {id:uid(),track,text,date:activeDate,createdAt:new Date().toISOString()}; }
function activeOpp(){ return opportunities.find(o=>o.id===activeId) || opportunities[0] || null; }
function allEntries(track,opp=activeOpp()){ return (opp?.entries||[]).filter(e=>!track||e.track===track); }
function dayEntries(track,key=activeDate,opp=activeOpp()){ return (opp?.entries||[]).filter(e=>e.date===key&&(!track||e.track===track)); }

function init(){
  const saved=localStorage.getItem(THEME_KEY);
  if(saved==='dark') document.documentElement.classList.add('dark');
  document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  document.querySelectorAll('.quick-form').forEach(f=>f.addEventListener('submit',handleSubmit));
  document.querySelectorAll('.date-pill').forEach(p=>{const [prev,next]=p.querySelectorAll('button');prev?.addEventListener('click',()=>changeDate(-1));next?.addEventListener('click',()=>changeDate(1));});
  document.querySelectorAll('.type-option').forEach(b=>b.addEventListener('click',()=>selectCaptureType(b.dataset.type)));
  document.getElementById('themeBtn')?.addEventListener('click',toggleTheme);
  document.getElementById('newOppBtn')?.addEventListener('click',newOpportunity);
  document.getElementById('exportBtn')?.addEventListener('click',exportData);
  document.getElementById('importFile')?.addEventListener('change',importData);
  document.getElementById('clearBtn')?.addEventListener('click',clearAll);
  document.getElementById('briefBtn')?.addEventListener('click',exportBrief);
  document.getElementById('deleteOppBtn')?.addEventListener('click',deleteOpportunity);
  renderChips(); render();
}

function switchView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
function changeDate(delta){ activeDate=shiftDate(activeDate,delta); render(); }
function selectCaptureType(t){
  document.querySelectorAll('.type-option').forEach(b=>b.classList.toggle('active',b.dataset.type===t));
  const h=document.getElementById('captureType'); if(h) h.value=t;
}
function selectOpp(id){ activeId=id; render(); switchView('opportunity'); }
function newOpportunity(){
  const name=prompt('Opportunity name');
  if(!name||!name.trim())return;
  const opp=makeOpportunity(name.trim());
  opportunities.unshift(opp); activeId=opp.id; persist(); render(); switchView('opportunity');
}
function deleteOpportunity(){
  const opp=activeOpp(); if(!opp)return;
  if(!confirm(`Delete opportunity "${opp.name}"?`))return;
  opportunities=opportunities.filter(o=>o.id!==opp.id);
  activeId=opportunities[0]?.id||null;
  persist(); render(); switchView('dashboard');
}
function handleSubmit(e){
  e.preventDefault();
  const form=e.currentTarget;
  let opp=activeOpp();
  if(!opp){ alert('Create an opportunity first.'); return; }
  const track=form.dataset.track==='capture'?form.querySelector('input[name="track"]')?.value:form.dataset.track;
  const ta=form.querySelector('textarea');
  const text=ta?.value.trim();
  if(!track||!tracks[track])return;
  if(!text){ ta.focus(); return; }
  opp.entries.unshift(makeEntry(track,text));
  persist(); form.reset(); if(form.dataset.track==='capture') selectCaptureType(track); render();
}
function entryCount(track,opp=activeOpp()){ return allEntries(track,opp).length; }
function recommendationText(opp){ return opp?.status || 'Explore'; }
function setRecommendation(val){ const opp=activeOpp(); if(!opp)return; opp.status=val; persist(); render(); }

function render(){ renderDates(); renderDashboard(); renderOpportunity(); renderTrackViews(); renderMetrics(); }
function renderDates(){ setText('todayDate',fullDateLabel(activeDate)); document.querySelectorAll('.date-pill span').forEach(s=>s.textContent=dateLabel(activeDate)); }
function renderDashboard(){
  setText('greeting',greetingText());
  const wrap=document.getElementById('oppCards');
  if(wrap){
    wrap.innerHTML=opportunities.length?opportunities.map(o=>{
      const total=o.entries.length, q=entryCount('questions',o), cust=entryCount('customer',o);
      return `<article class="summary-row" onclick="selectOpp('${o.id}')"><div class="summary-icon" style="background:#dbeafe">⌁</div><div><div class="summary-title">${esc(o.name)}</div><div class="summary-meta">${recommendationText(o)} · ${total} entries · ${q} questions · ${cust} customer</div></div><div class="summary-score">${total}<div class="small muted">inputs</div></div><div class="chev">›</div></article>`;
    }).join(''):`<div class="empty-card muted">No opportunities yet. Create one to begin due diligence.</div>`;
  }
  const all=opportunities.flatMap(o=>(o.entries||[]).map(e=>({...e,oppName:o.name}))).filter(e=>e.date===activeDate);
  setText('entryCount',`${all.length} ${all.length===1?'entry':'entries'}`);
  const list=document.getElementById('todayEntries');
  if(list) list.innerHTML=all.length?all.map(e=>`<article class="entry"><div class="entry-top"><span>${esc(e.oppName)} · ${tracks[e.track].label}</span><span>${timeText(e.createdAt)}</span></div><div class="entry-main">${esc(e.text)}</div></article>`).join(''):'No due diligence entries yet.';
  renderWeekBars();
}
function renderWeekBars(){
  const wrap=document.getElementById('weekBars'); if(!wrap)return;
  const now=parseKey(activeDate); const days=[];
  for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(now.getDate()-i);const key=todayKey(d);const count=opportunities.flatMap(o=>o.entries||[]).filter(e=>e.date===key).length;days.push({key,count});}
  const max=Math.max(1,...days.map(d=>d.count));
  wrap.innerHTML=days.map(day=>`<div class="bar-wrap"><div class="bar" style="height:${Math.max(6,day.count/max*78)}px"></div><span>${dateLabel(day.key).split(' ')[0]}</span></div>`).join('');
  setText('trendLabel',days.at(-1).count>=3?'Research momentum':'Building signal');
}
function renderOpportunity(){
  const opp=activeOpp();
  setText('oppName',opp?.name||'No opportunity');
  setText('oppTotal',opp?.entries?.length||0);
  setText('oppRec',recommendationText(opp));
  const rec=document.getElementById('recSelect'); if(rec&&opp) rec.value=opp.status;
  const wrap=document.getElementById('trackCards');
  if(wrap){
    if(!opp){ wrap.innerHTML='<div class="empty-card muted">Create an opportunity first.</div>'; return; }
    wrap.innerHTML=Object.keys(tracks).map(k=>{
      const t=tracks[k], n=entryCount(k,opp);
      return `<article class="summary-row ${k==='questions'?'question-row':''}" onclick="switchView('${k}')"><div class="summary-icon" style="background:${t.color}">${t.icon}</div><div><div class="summary-title">${t.label}</div><div class="summary-meta">${n} entr${n===1?'y':'ies'} · ${t.signal}</div></div><div class="summary-score">${n}<div class="small muted">inputs</div></div><div class="chev">›</div></article>`;
    }).join('');
  }
}
function renderMetrics(){
  const opp=activeOpp();
  Object.keys(tracks).forEach(k=>{const n=entryCount(k,opp);setText(`${k}Metric`,`${n} entr${n===1?'y':'ies'}`);setText(`${k}Sub`,n?`${n} captured`:'Not logged');setText(`${k}Count`,n);});
}
function renderTrackViews(){
  const opp=activeOpp();
  document.querySelectorAll('.domain-view').forEach(v=>{
    const k=v.dataset.track, target=v.querySelector('.domain-entries'); if(!target)return;
    const items=allEntries(k,opp);
    target.innerHTML=items.length?items.map(entryHtml).join(''):`<div class="empty-card muted">No ${tracks[k].label.toLowerCase()} entries yet.</div>`;
  });
}
function entryHtml(e){
  return `<article class="entry"><div class="entry-top"><span>${tracks[e.track].label}</span><span>${e.date===todayKey()?timeText(e.createdAt):dateLabel(e.date)}</span></div><div class="entry-main">${esc(e.text)}</div><div class="entry-actions"><button class="delete" type="button" onclick="deleteEntry('${e.id}')">Delete</button></div></article>`;
}
function deleteEntry(id){ const opp=activeOpp(); if(!opp)return; opp.entries=opp.entries.filter(e=>e.id!==id); persist(); render(); }
function renderChips(){
  document.querySelectorAll('.chips').forEach(w=>{const k=w.dataset.target;w.innerHTML=tracks[k].prompts.map(p=>`<button type="button">${p}</button>`).join('');w.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>fillPrompt(k,b.textContent)));});
}
function fillPrompt(k,text){ const v=document.querySelector(`.domain-view[data-track="${k}"]`)||document.getElementById('capture'); const ta=v?.querySelector('textarea'); if(!ta)return; ta.value=ta.value?`${ta.value}\n${text}`:text; if(v.id==='capture')selectCaptureType(k); ta.focus(); }
function buildBrief(opp=activeOpp()){
  const collect=k=>allEntries(k,opp).map(e=>`- ${e.text}`).join('\n')||'- Not yet captured';
  return `DUE DILIGENCE BRIEF

Opportunity: ${opp?.name||'Untitled'}
Recommendation: ${recommendationText(opp)}
Generated: ${new Date().toLocaleString()}

RESEARCH QUESTIONS
${collect('questions')}

MARKET
${collect('market')}

COMPETITION
${collect('competition')}

CUSTOMER
${collect('customer')}

TECHNOLOGY / AI FIT
${collect('technology')}

FOUNDER ADVANTAGE
${collect('advantage')}

COMMERCIALIZATION
${collect('commercialization')}

RECOMMENDATION
${recommendationText(opp)}
`;
}
function exportBrief(){ const opp=activeOpp(); if(!opp)return; const blob=new Blob([buildBrief(opp)],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${opp.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-due-diligence-brief.txt`; a.click(); URL.revokeObjectURL(a.href); }
function exportData(){ const blob=new Blob([JSON.stringify({app:'Due Diligence OS',version:2,exportedAt:new Date().toISOString(),opportunities},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`due-diligence-os-export-${todayKey()}.json`; a.click(); URL.revokeObjectURL(a.href); }
function importData(ev){ const f=ev.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{const data=JSON.parse(r.result); if(Array.isArray(data.opportunities)){opportunities=[...data.opportunities,...opportunities];activeId=opportunities[0]?.id;persist();render();alert('Import complete.')}else alert('Import file did not contain opportunities.')}catch{alert('Could not import JSON.')}}; r.readAsText(f); ev.target.value=''; }
function clearAll(){ if(confirm('Clear all Due Diligence OS data on this device?')){opportunities=[];activeId=null;persist();render();switchView('dashboard');} }
function toggleTheme(){ document.documentElement.classList.toggle('dark'); localStorage.setItem(THEME_KEY,document.documentElement.classList.contains('dark')?'dark':'light'); }

window.selectOpp=selectOpp; window.switchView=switchView; window.deleteEntry=deleteEntry; window.setRecommendation=setRecommendation; init();
