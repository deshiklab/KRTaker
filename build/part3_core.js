// === KRTaker core: state, utils, shell, dashboard, portfolio, tenancy ===
const SW_CACHE = 'krtaker-v1-0';
const MODULE_TITLE = 'KRTaker';
let DB = loadDB();
let currentView = 'dashboard';
const NAV = [
  { g:'Overview' },
  { id:'dashboard', ico:'🏠', label:'Dashboard' },
  { g:'Portfolio' },
  { id:'properties', ico:'🏢', label:'Properties' },
  { id:'units', ico:'🚪', label:'Units' },
  { g:'Tenancy' },
  { id:'tenants', ico:'👤', label:'Tenants' },
  { id:'leases', ico:'📄', label:'Leases' },
  { g:'Finance' },
  { id:'invoices', ico:'🧾', label:'Invoices' },
  { id:'receipts', ico:'📜', label:'Receipts' },
  { id:'payments', ico:'💳', label:'Payments' },
  { id:'taxes', ico:'🏦', label:'Taxes' },
  { g:'Operations' },
  { id:'maintenance', ico:'🔧', label:'Maintenance' },
  { id:'compliance', ico:'⚖️', label:'Compliance' },
  { g:'Intelligence' },
  { id:'ai', ico:'🤖', label:'AI Assistant' }
];
const MOB_NAV = ['dashboard','properties','leases','invoices','ai'];

// ---------- persistence ----------
function loadDB(){
  try{
    const raw = localStorage.getItem('krtaker_db_v1');
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return JSON.parse(JSON.stringify(SEED));
}
function saveDB(){ try{ localStorage.setItem('krtaker_db_v1', JSON.stringify(DB)); }catch(e){} }
function resetDB(){ DB = JSON.parse(JSON.stringify(SEED)); saveDB(); toast('Demo data reset','success'); nav(currentView); }

// ---------- utils ----------
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmt(n){ return '\u09F3' + Number(n||0).toLocaleString('en-IN'); }
function today(){ return new Date().toISOString().slice(0,10); }
function uid(p){ return p + '-' + String(Date.now()).slice(-6); }
function toast(msg, type){
  const c = document.getElementById('toastContainer');
  const d = document.createElement('div');
  d.className = 'toast ' + (type||'');
  d.textContent = msg;
  c.appendChild(d);
  setTimeout(()=>{ d.style.opacity='0'; setTimeout(()=>d.remove(), 300); }, 2600);
}
function badge(status){
  const map = {'Active':'badge-active','Paid':'badge-active','Success':'badge-active','Leased':'badge-active','Open':'badge-new','Vacant':'badge-closed','Pending Registration':'badge-pending','Unpaid':'badge-pending','In Progress':'badge-pending','Overdue':'badge-sold','Expired':'badge-closed','Terminated':'badge-closed','Maintenance':'badge-reserved','Awaiting Payment':'badge-reserved','Landlord':'badge-sold','Tenant':'badge-closed'};
  return `<span class="badge-status ${map[status]||'badge-pending'}">${esc(status)}</span>`;
}
function statCards(list){
  return `<div class="stats-row">` + list.map(s=>
    `<div class="stat-card"><div class="label">${s[0]}</div><div class="value"${s[2]?` style="color:${s[2]}"`:''}>${s[1]}</div>${s[3]?`<div class="trend">${s[3]}</div>`:''}</div>`
  ).join('') + `</div>`;
}
function pageHeader(title, subtitle, actions){
  return `<div class="tbl-toolbar" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
    <div><div class="page-subtitle" style="font-size:12px;color:#8895a7;margin:0">${subtitle||''}</div></div>
    <div style="display:flex;gap:6px">${actions||''}</div></div>`;
}
function emptyState(msg){ return `<div style="padding:40px;text-align:center;color:#9aa5b1;font-size:12px">${msg}</div>`; }
function propertyById(id){ return DB.properties.find(p=>p.id===id); }
function unitById(id){ return DB.units.find(u=>u.id===id); }
function tenantById(id){ return DB.tenants.find(t=>t.id===id); }
function leaseById(id){ return DB.leases.find(l=>l.id===id); }
function leasesForUnit(uid){ return DB.leases.filter(l=>l.unit===uid && (l.status==='Active'||l.status==='Pending Registration')); }
function unitLabel(u){ return (propertyById(u.property)?.name||'?') + ' / ' + u.name; }

// ---------- modal ----------
function openModal(title, body, footer){
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalFooter').innerHTML = footer||'';
  document.getElementById('modalOverlay').style.display = 'flex';
}
function closeModal(){ document.getElementById('modalOverlay').style.display = 'none'; }
function closeModalOnBackdrop(e){ if(e.target.id==='modalOverlay') closeModal(); }

// ---------- global search ----------
function openGlobalSearch(q){
  const dd = document.getElementById('gsDropdown');
  if(!q || q.trim().length < 2){ dd.style.display='none'; return; }
  const ql = q.trim().toLowerCase();
  const res = [];
  DB.properties.forEach(p=>{ if((p.name+' '+p.holding).toLowerCase().includes(ql)) res.push({ico:'🏢', t:p.name, s:p.id+' · '+p.jurisdiction, fn:`nav('properties'); openPropDetail('${p.id}')`}); });
  DB.tenants.forEach(t=>{ if(t.name.toLowerCase().includes(ql)) res.push({ico:'👤', t:t.name, s:t.id+' · '+t.nid, fn:`nav('tenants'); openTenantDetail('${t.id}')`}); });
  DB.leases.forEach(l=>{ if(l.id.toLowerCase().includes(ql)) res.push({ico:'📄', t:l.id, s:unitLabel(unitById(l.unit))+' · '+fmt(l.rent)+'/mo', fn:`nav('leases'); openLeaseDetail('${l.id}')`}); });
  DB.invoices.forEach(v=>{ if(v.id.toLowerCase().includes(ql)) res.push({ico:'🧾', t:v.id, s:leaseById(v.lease)?.id+' · '+v.month, fn:`nav('invoices')`}); });
  NAV.forEach(n=>{ if(n.id && n.label.toLowerCase().includes(ql)) res.push({ico:n.ico, t:n.label+' module', s:'Go to module', fn:`nav('${n.id}')`}); });
  const box = document.getElementById('gsResults');
  box.innerHTML = res.slice(0,10).map(r=>`<div style="display:flex;gap:8px;align-items:center;padding:7px 8px;border-radius:7px;cursor:pointer" onmouseover="this.style.background='#f2f6fc'" onmouseout="this.style.background=''" onclick="${r.fn}; closeGlobalSearch()">
    <span style="font-size:14px">${r.ico}</span><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600">${esc(r.t)}</div><div style="font-size:10px;color:#8895a7">${esc(r.s)}</div></div></div>`).join('');
  document.getElementById('gsEmpty').style.display = res.length ? 'none' : 'block';
  dd.style.display = 'flex';
}
function closeGlobalSearch(){ document.getElementById('gsDropdown').style.display='none'; }
function jumpFirstResult(){ const r=document.querySelector('#gsResults [onclick]'); if(r) r.click(); }
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); const i=document.getElementById('gsInput'); i.focus(); i.select(); }
  if(e.key==='Escape'){ closeModal(); closeGlobalSearch(); closeQuickAdd(); }
});

// ---------- quick add ----------
const QUICK_ACTIONS = [
  {ico:'🏢', label:'Add Property', fn:'openPropForm()'},
  {ico:'👤', label:'Add Tenant', fn:'openTenantForm()'},
  {ico:'📄', label:'Add Lease', fn:'openLeaseForm()'},
  {ico:'🧾', label:'Generate Invoice', fn:'openInvoiceForm()'},
  {ico:'🔧', label:'Report Maintenance', fn:'openTicketForm()'}
];
function openQuickAdd(){
  document.getElementById('qaList').innerHTML = QUICK_ACTIONS.map(a=>
    `<div style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;border:1px solid #f0f2f5" onmouseover="this.style.background='#f2f6fc'" onmouseout="this.style.background=''" onclick="${a.fn}; closeQuickAdd()">
      <span style="font-size:15px">${a.ico}</span><span style="font-size:12px;font-weight:600">${a.label}</span></div>`).join('');
  document.getElementById('qaDropdown').style.display = 'flex';
}
function closeQuickAdd(){ document.getElementById('qaDropdown').style.display='none'; }

// ---------- sidebar / nav ----------
function renderSidebar(){
  let h = '';
  NAV.forEach(n=>{
    if(n.g) h += `<div class="sidebar-item has-children"><div class="grp-label">${n.g}</div></div>`;
    else h += `<div class="sidebar-item ${currentView===n.id?'active':''}" data-nav="${n.id}" onclick="nav('${n.id}')"><span class="nav-ico">${n.ico}</span>${n.label}</div>`;
  });
  document.getElementById('sidebarMenu').innerHTML = h;
  document.getElementById('mobBottomNav').innerHTML = MOB_NAV.map(id=>{
    const n = NAV.find(x=>x.id===id);
    return `<div class="mb-item ${currentView===id?'active':''}" onclick="nav('${id}')"><span class="mi">${n.ico}</span><span>${n.label.split(' ')[0]}</span></div>`;
  }).join('');
}
function toggleMobSidebar(){
  const sb = document.getElementById('sidebar');
  sb.style.display = sb.style.display==='none' ? 'flex' : 'none';
}
function nav(id){
  currentView = id;
  const n = NAV.find(x=>x.id===id);
  document.getElementById('pageTitle').textContent = n ? n.label : 'KRTaker';
  document.getElementById('breadcrumb').textContent = 'Home / ' + (n?n.label:'');
  document.getElementById('sidebarMenu').innerHTML = '';
  renderSidebar();
  window.scrollTo(0,0);
  const renderers = {
    dashboard: renderDashboard, properties: renderProperties, units: renderUnits,
    tenants: renderTenants, leases: renderLeases, invoices: renderInvoices,
    receipts: renderReceipts, payments: renderPayments, taxes: renderTaxes,
    maintenance: renderMaintenance, compliance: renderCompliance, ai: renderAI
  };
  (renderers[id]||renderDashboard)();
  if(window.location.hash !== '#'+id) history.replaceState(null,'','#'+id);
}
window.addEventListener('hashchange', ()=>{ const h=location.hash.slice(1); if(h && NAV.find(n=>n.id===h)) nav(h); });

// ---------- dashboard ----------
function renderDashboard(){
  const activeLeases = DB.leases.filter(l=>l.status==='Active');
  const pendingReg = DB.leases.filter(l=>l.status==='Pending Registration');
  const occupied = DB.units.filter(u=>u.status==='Leased').length;
  const totalUnits = DB.units.length;
  const portValue = DB.properties.reduce((s,p)=>s+p.value,0);
  const rentDue = DB.invoices.filter(v=>v.status==='Unpaid'||v.status==='Overdue').reduce((s,v)=>s+v.gross,0);
  const openTickets = DB.tickets.filter(t=>t.status==='Open'||t.status==='In Progress').length;
  const due30 = DB.invoices.filter(v=>v.status==='Overdue').reduce((s,v)=>s+v.gross,0);

  let h = statCards([
    ['Portfolio Value', fmt(portValue), '#2F80ED', portValue>1e9?'₹'+(portValue/1e7).toFixed(1)+' Cr':''],
    ['Units', totalUnits+' ('+occupied+' leased)', '#27ae60', Math.round(occupied/totalUnits*100)+'% occupancy'],
    ['Rent Due (Jun–Jul)', fmt(rentDue), '#e67e22', 'Overdue '+fmt(due30)],
    ['Leases Pending Registration', pendingReg.length, pendingReg.length?'#e74c3c':'#27ae60', 'Legal gate active'],
    ['Open Tickets', openTickets, '#9b59b6', DB.tickets.filter(t=>t.liability==='Landlord'&&t.status==='Open').length+' landlord-side']
  ]);

  // occupancy bars by property
  const occBars = DB.properties.map(p=>{
    const us = DB.units.filter(u=>u.property===p.id);
    const oc = us.filter(u=>u.status==='Leased').length;
    const pct = us.length ? Math.round(oc/us.length*100) : 0;
    return `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:10.5px;color:#667;margin-bottom:3px"><span>${esc(p.name)}</span><span>${oc}/${us.length} · ${pct}%</span></div>
      <div style="height:7px;background:#eef1f5;border-radius:4px"><div style="height:7px;width:${pct}%;background:${pct>80?'#27ae60':pct>40?'#2F80ED':'#e67e22'};border-radius:4px"></div></div></div>`;
  }).join('');

  // recent activity
  const acts = [
    {t:'Payment received', d:'RCP-0004 · ৳40,000 via Nagad', when:'Jun 12'},
    {t:'Payment received', d:'RCP-0003 · ৳405,000 via bKash (TDS ৳45,000 split)', when:'Jun 10'},
    {t:'Lease flagged', d:'L-004 (>12mo) → Pending Registration — Sub-registry doc required', when:'Jun 08'},
    {t:'Maintenance ticket', d:'MT-004 · flooring damage liability → Tenant', when:'Jun 27'},
    {t:'AI action', d:'Generated rent reminder for INV-2026-006 (L-006)', when:'Jun 20'}
  ];
  const actList = acts.map(a=>`<div class="activity-item" style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid #f4f6f9">
    <div style="width:26px;height:26px;border-radius:7px;background:#eef6ff;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">${a.t.startsWith('Payment')?'💳':a.t.startsWith('Lease')?'⚖️':a.t.startsWith('AI')?'🤖':'🔧'}</div>
    <div style="flex:1;min-width:0"><div style="font-size:11.5px;font-weight:600">${a.t}</div><div style="font-size:10.5px;color:#667">${a.d}</div></div>
    <div style="font-size:9.5px;color:#9aa5b1">${a.when}</div></div>`).join('');

  h += `<div class="dash-grid" style="margin-top:14px">
    <div class="card"><div class="card-header">Occupancy by Property</div><div class="card-body">${occBars}</div></div>
    <div class="card"><div class="card-header">Recent Activity</div><div class="card-body" style="padding:4px 14px">${actList}</div></div>
    <div class="card"><div class="card-header">Compliance Snapshot</div><div class="card-body">
      <div style="font-size:11px;line-height:1.9">
        <div>⚖️ <b>${pendingReg.length}</b> lease${pendingReg.length>1?'s':''} pending registration (TPA 1882 §107)${pendingReg.length?` — <a href="javascript:nav('compliance')" style="color:#2F80ED">review</a>`:''}</div>
        <div>🏠 <b>${DB.leases.filter(l=>l.residential && l.advance>l.rent).length}</b> residential lease(s) exceed 1-month advance cap (PRCA 1991 §10/§23)</div>
        <div>📅 <b>${DB.leases.filter(l=>l.status==='Active'&&l.end<today()).length}</b> lease(s) expired or ending soon</div>
        <div>🧾 <b>${DB.invoices.filter(v=>v.tds>0).length}</b> invoices with TDS split (Income Tax Act 2023)</div>
      </div></div></div>
    <div class="card"><div class="card-header">AI Caretaker</div><div class="card-body">
      <div style="font-size:11px;color:#667;line-height:1.7;margin-bottom:8px">Ask KR to generate invoices, check PRCA limits, resolve maintenance liability, or answer tax questions.</div>
      <button class="drawer-btn primary" style="width:100%" onclick="nav('ai')">🤖 Open AI Assistant</button>
    </div></div>
  </div>`;
  document.getElementById('content').innerHTML = h;
}

// ---------- properties ----------
function renderProperties(){
  const rows = DB.properties.map(p=>{
    const us = DB.units.filter(u=>u.property===p.id);
    const ls = DB.leases.filter(l=>us.some(u=>u.id===l.unit) && l.status==='Active');
    const monthly = ls.reduce((s,l)=>s+l.rent,0);
    return `<tr onclick="openPropDetail('${p.id}')" style="cursor:pointer">
      <td><b>${esc(p.name)}</b><span class="kr-badge">${p.type}</span><div class="mono" style="font-size:10px;color:#8895a7">${p.id} · ${esc(p.holding)}</div></td>
      <td>${p.jurisdiction}</td>
      <td class="mono">CS ${esc(p.khatian.cs)} / SA ${esc(p.khatian.sa)}</td>
      <td>${us.length} units</td>
      <td>${fmt(monthly)}<div style="font-size:9.5px;color:#8895a7">/mo</div></td>
      <td>${fmt(p.value)}</td>
      <td>${badge(p.status)}</td>
    </tr>`;
  }).join('');
  document.getElementById('content').innerHTML =
    pageHeader('Properties', 'Portfolio assets with jurisdiction & khatian records (e-Porcha cross-reference)', `<button class="drawer-btn primary" onclick="openPropForm()">＋ Add Property</button>`)
    + `<div class="table-wrap"><table class="table-view"><thead><tr><th>Property</th><th>Jurisdiction</th><th>Khatian (CS/SA)</th><th>Units</th><th>Rent Roll</th><th>Value</th><th>Status</th></tr></thead><tbody>${rows||`<tr><td colspan="7">${emptyState('No properties yet')}</td></tr>`}</tbody></table></div>`;
}
function openPropDetail(id){
  const p = propertyById(id); if(!p) return;
  const us = DB.units.filter(u=>u.property===id);
  const unitsRows = us.map(u=>`<tr><td>${esc(u.name)}</td><td>${u.floor}</td><td>${u.sqft?u.sqft.toLocaleString()+' sqft':'—'}</td><td>${badge(u.status)}</td></tr>`).join('');
  const tdsTxt = p.mortgage ? `Mortgage: ${p.mortgage.bank} · annual interest ${fmt(p.mortgage.interest)}` : 'No mortgage';
  openModal(p.name,
    `<div style="font-size:12px;line-height:1.8">
      <div class="form-grid">
        <div class="form-group"><div class="form-label">Type</div><div>${p.type} · ${p.jurisdiction}</div></div>
        <div class="form-group"><div class="form-label">Holding No.</div><div>${esc(p.holding)}</div></div>
        <div class="form-group"><div class="form-label">Khatian</div><div class="mono">CS ${esc(p.khatian.cs)} · SA ${esc(p.khatian.sa)} · RS ${esc(p.khatian.rs)} · BS ${esc(p.khatian.bs)}</div></div>
        <div class="form-group"><div class="form-label">Mortgage</div><div>${tdsTxt}</div></div>
        <div class="form-group"><div class="form-label">Value</div><div>${fmt(p.value)}</div></div>
        <div class="form-group"><div class="form-label">Est. Holding Tax</div><div><a href="javascript:nav('taxes'); openHoldingTax('${p.id}')" style="color:#2F80ED">calculate →</a></div></div>
      </div>
      <div style="font-weight:700;margin:12px 0 6px">Units (${us.length})</div>
      <div class="table-wrap"><table class="table-view"><thead><tr><th>Unit</th><th>Floor</th><th>Size</th><th>Status</th></tr></thead><tbody>${unitsRows}</tbody></table></div>
    </div>`,
    `<button class="drawer-btn secondary" onclick="closeModal(); openPropForm('${p.id}')">Edit</button>
     <button class="drawer-btn primary" onclick="nav('units')">View Units</button>`);
}
function openPropForm(id){
  const p = id ? propertyById(id) : null;
  const v = p || {name:'',type:'Flat',jurisdiction:'Dhaka North',holding:'',cs:'',sa:'',rs:'',bs:'',bank:'',interest:'',value:'',status:'Active'};
  openModal(p?'Edit Property':'Add Property',
    `<div class="form-grid">
      <div class="form-group"><div class="form-label">Property name</div><input class="form-input" id="pf_name" value="${esc(v.name)}"></div>
      <div class="form-group"><div class="form-label">Type</div><select class="form-input" id="pf_type">${['Flat','Plot','Commercial','Industrial','Warehouse','Mall'].map(t=>`<option ${v.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="form-group"><div class="form-label">Jurisdiction (City Corp)</div><select class="form-input" id="pf_jur">${['Dhaka North','Dhaka South','Chattogram','Gazipur','Other'].map(j=>`<option ${v.jurisdiction===j?'selected':''}>${j}</option>`).join('')}</select></div>
      <div class="form-group"><div class="form-label">Holding no.</div><input class="form-input" id="pf_holding" value="${esc(v.holding)}" placeholder="12/5, Mirpur-10"></div>
      <div class="form-group"><div class="form-label">CS Khatian</div><input class="form-input" id="pf_cs" value="${esc(v.khatian&&v.khatian.cs||'')}" placeholder="CS 452"></div>
      <div class="form-group"><div class="form-label">SA Khatian</div><input class="form-input" id="pf_sa" value="${esc(v.khatian&&v.khatian.sa||'')}" placeholder="SA 1180"></div>
      <div class="form-group"><div class="form-label">RS Khatian</div><input class="form-input" id="pf_rs" value="${esc(v.khatian&&v.khatian.rs||'')}" placeholder="RS 2277"></div>
      <div class="form-group"><div class="form-label">BS Khatian</div><input class="form-input" id="pf_bs" value="${esc(v.khatian&&v.khatian.bs||'')}" placeholder="BS 3301"></div>
      <div class="form-group"><div class="form-label">Mortgage bank (blank = none)</div><input class="form-input" id="pf_bank" value="${esc(v.mortgage&&v.mortgage.bank||'')}"></div>
      <div class="form-group"><div class="form-label">Annual mortgage interest (৳)</div><input class="form-input" id="pf_interest" value="${v.mortgage&&v.mortgage.interest||''}"></div>
      <div class="form-group"><div class="form-label">Market value (৳)</div><input class="form-input" id="pf_value" value="${v.value||''}"></div>
    </div>`,
    `<button class="drawer-btn secondary" onclick="closeModal()">Cancel</button>
     <button class="drawer-btn primary" onclick="saveProp('${p?p.id:''}')">${p?'Save changes':'Add property'}</button>`);
}
function saveProp(id){
  const g = x => document.getElementById(x).value;
  const data = {
    name:g('pf_name').trim(), type:g('pf_type'), jurisdiction:g('pf_jur'), holding:g('pf_holding').trim(),
    khatian:{cs:g('pf_cs').trim(),sa:g('pf_sa').trim(),rs:g('pf_rs').trim(),bs:g('pf_bs').trim()},
    mortgage:(g('pf_bank').trim()||g('pf_interest'))?{bank:g('pf_bank').trim(),interest:Number(g('pf_interest'))||0}:null,
    value:Number(g('pf_value'))||0, status:'Active'
  };
  if(!data.name){ toast('Property name required','error'); return; }
  if(id){ Object.assign(propertyById(id), data); toast('Property updated','success'); }
  else { DB.properties.push(Object.assign({id:uid('P')}, data)); toast('Property added','success'); }
  saveDB(); closeModal(); renderProperties();
}

// ---------- units ----------
function renderUnits(){
  const rows = DB.units.map(u=>{
    const p = propertyById(u.property);
    return `<tr onclick="openUnitDetail('${u.id}')" style="cursor:pointer">
      <td><b>${esc(u.name)}</b><div style="font-size:10px;color:#8895a7">${esc(p?p.name:'')}</div></td>
      <td>${u.floor}</td><td>${u.sqft?u.sqft.toLocaleString()+' sqft':'—'}</td>
      <td>${badge(u.status)}</td>
      <td>${leasesForUnit(u.id).map(l=>l.id).join(', ')||'—'}</td>
    </tr>`;
  }).join('');
  document.getElementById('content').innerHTML =
    pageHeader('Units', 'Individual lettable units across the portfolio', `<button class="drawer-btn primary" onclick="openUnitForm()">＋ Add Unit</button>`)
    + `<div class="table-wrap"><table class="table-view"><thead><tr><th>Unit</th><th>Floor</th><th>Size</th><th>Status</th><th>Lease(s)</th></tr></thead><tbody>${rows||`<tr><td colspan="5">${emptyState('No units')}</td></tr>`}</tbody></table></div>`;
}
function openUnitDetail(id){
  const u = unitById(id); const p = propertyById(u.property);
  const ls = leasesForUnit(u.id);
  const lsRows = ls.map(l=>`<tr><td>${l.id}</td><td>${esc(tenantById(l.tenant)?.name||'')}</td><td>${fmt(l.rent)}/mo</td><td>${badge(l.status)}</td></tr>`).join('');
  openModal(u.name,
    `<div style="font-size:12px;line-height:1.8">
      <div class="form-grid">
        <div class="form-group"><div class="form-label">Property</div><div>${esc(p?.name||'')}</div></div>
        <div class="form-group"><div class="form-label">Floor</div><div>${u.floor}</div></div>
        <div class="form-group"><div class="form-label">Size</div><div>${u.sqft?u.sqft.toLocaleString()+' sqft':'—'}</div></div>
        <div class="form-group"><div class="form-label">Status</div><div>${badge(u.status)}</div></div>
      </div>
      <div style="font-weight:700;margin:12px 0 6px">Leases</div>
      ${lsRows?`<div class="table-wrap"><table class="table-view"><thead><tr><th>Lease</th><th>Tenant</th><th>Rent</th><th>Status</th></tr></thead><tbody>${lsRows}</tbody></table></div>`:emptyState('No lease on this unit')}
    </div>`,
    `<button class="drawer-btn primary" onclick="closeModal(); openLeaseForm(null,'${u.id}')">＋ New Lease</button>`);
}
function openUnitForm(){
  openModal('Add Unit',
    `<div class="form-grid">
      <div class="form-group"><div class="form-label">Property</div><select class="form-input" id="uf_prop">${DB.properties.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
      <div class="form-group"><div class="form-label">Unit name</div><input class="form-input" id="uf_name" placeholder="Flat 6A"></div>
      <div class="form-group"><div class="form-label">Floor</div><input class="form-input" id="uf_floor" placeholder="6th"></div>
      <div class="form-group"><div class="form-label">Sqft</div><input class="form-input" id="uf_sqft" placeholder="1450"></div>
      <div class="form-group"><div class="form-label">Status</div><select class="form-input" id="uf_status">${['Vacant','Leased','Maintenance'].map(s=>`<option>${s}</option>`).join('')}</select></div>
    </div>`,
    `<button class="drawer-btn secondary" onclick="closeModal()">Cancel</button><button class="drawer-btn primary" onclick="saveUnit()">Add unit</button>`);
}
function saveUnit(){
  const g = x => document.getElementById(x).value;
  const prop = g('uf_prop');
  const name = g('uf_name').trim();
  if(!name){ toast('Unit name required','error'); return; }
  DB.units.push({id:uid('U'), property:prop, name, floor:g('uf_floor'), sqft:Number(g('uf_sqft'))||0, status:g('uf_status')});
  saveDB(); closeModal(); renderUnits(); toast('Unit added','success');
}

// ---------- tenants ----------
function renderTenants(){
  const rows = DB.tenants.map(t=>{
    const ls = DB.leases.filter(l=>l.tenant===t.id && (l.status==='Active'||l.status==='Pending Registration'));
    const monthly = ls.reduce((s,l)=>s+l.rent,0);
    return `<tr onclick="openTenantDetail('${t.id}')" style="cursor:pointer">
      <td><b>${esc(t.name)}</b>${t.nrb?`<span class="kr-badge" style="background:#eef8ee;color:#27ae60;border-color:#c9ecc9">NRB</span>`:''}</td>
      <td>${t.kind}</td><td class="mono">${t.nid}</td><td>${t.phone}</td>
      <td>${ls.map(l=>l.id).join(', ')||'—'}</td><td>${ls.length?fmt(monthly)+'/mo':'—'}</td>
    </tr>`;
  }).join('');
  document.getElementById('content').innerHTML =
    pageHeader('Tenants', 'Tenant directory with NID & NRB status', `<button class="drawer-btn primary" onclick="openTenantForm()">＋ Add Tenant</button>`)
    + `<div class="table-wrap"><table class="table-view"><thead><tr><th>Tenant</th><th>Kind</th><th>NID / BIN</th><th>Phone</th><th>Leases</th><th>Rent Roll</th></tr></thead><tbody>${rows||`<tr><td colspan="6">${emptyState('No tenants')}</td></tr>`}</tbody></table></div>`;
}
function openTenantDetail(id){
  const t = tenantById(id); if(!t) return;
  const ls = DB.leases.filter(l=>l.tenant===id);
  const lsRows = ls.map(l=>`<tr><td>${l.id}</td><td>${esc(unitLabel(unitById(l.unit)))}</td><td>${fmt(l.rent)}/mo</td><td>${badge(l.status)}</td></tr>`).join('');
  openModal(t.name+(t.nrb?' (NRB)':''),
    `<div style="font-size:12px;line-height:1.8">
      <div class="form-grid">
        <div class="form-group"><div class="form-label">Kind</div><div>${t.kind}</div></div>
        <div class="form-group"><div class="form-label">NID / BIN</div><div class="mono">${t.nid}</div></div>
        <div class="form-group"><div class="form-label">Phone</div><div>${t.phone}</div></div>
        <div class="form-group"><div class="form-label">Email</div><div>${esc(t.email)}</div></div>
        <div class="form-group"><div class="form-label">NRB</div><div>${t.nrb?'Yes — NRTA/NITA eligible':'No'}</div></div>
      </div>
      <div style="font-weight:700;margin:12px 0 6px">Leases</div>
      ${lsRows?`<div class="table-wrap"><table class="table-view"><thead><tr><th>Lease</th><th>Unit</th><th>Rent</th><th>Status</th></tr></thead><tbody>${lsRows}</tbody></table></div>`:emptyState('No leases')}
    </div>`,
    `<button class="drawer-btn secondary" onclick="closeModal(); openTenantForm('${t.id}')">Edit</button>`);
}
function openTenantForm(id){
  const t = id ? tenantById(id) : null;
  const v = t || {name:'',kind:'Individual',nid:'',phone:'',email:'',nrb:false};
  openModal(t?'Edit Tenant':'Add Tenant',
    `<div class="form-grid">
      <div class="form-group"><div class="form-label">Full name / Company</div><input class="form-input" id="tf_name" value="${esc(v.name)}"></div>
      <div class="form-group"><div class="form-label">Kind</div><select class="form-input" id="tf_kind">${['Individual','Corporate'].map(k=>`<option ${v.kind===k?'selected':''}>${k}</option>`).join('')}</select></div>
      <div class="form-group"><div class="form-label">NID / BIN</div><input class="form-input" id="tf_nid" value="${esc(v.nid)}"></div>
      <div class="form-group"><div class="form-label">Phone</div><input class="form-input" id="tf_phone" value="${esc(v.phone)}"></div>
      <div class="form-group"><div class="form-label">Email</div><input class="form-input" id="tf_email" value="${esc(v.email)}"></div>
      <div class="form-group"><div class="form-label">NRB status</div><select class="form-input" id="tf_nrb">${[['false','No'],['true','Yes — Non-Resident Bangladeshi']].map(o=>`<option value="${o[0]}" ${String(v.nrb)===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
    </div>`,
    `<button class="drawer-btn secondary" onclick="closeModal()">Cancel</button><button class="drawer-btn primary" onclick="saveTenant('${id||''}')">${t?'Save changes':'Add tenant'}</button>`);
}
function saveTenant(id){
  const g = x => document.getElementById(x).value;
  const data = {name:g('tf_name').trim(), kind:g('tf_kind'), nid:g('tf_nid').trim(), phone:g('tf_phone').trim(), email:g('tf_email').trim(), nrb:g('tf_nrb')==='true'};
  if(!data.name){ toast('Name required','error'); return; }
  if(id) Object.assign(tenantById(id), data);
  else DB.tenants.push(Object.assign({id:uid('T')}, data));
  saveDB(); closeModal(); renderTenants(); toast('Tenant saved','success');
}
