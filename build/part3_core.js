// === KRTaker core v2: state, groups/nav, table framework, dashboard, portfolio, tenancy ===
const SW_CACHE = 'krtaker-v2-2';
let DB = loadDB();
let currentView = 'dashboard';
let currentGroup = 'overview';

const GROUPS = [
  { id:'overview',  ico:'🏠', tip:'Overview',   mods:['dashboard'] },
  { id:'portfolio', ico:'🏢', tip:'Portfolio',  mods:['properties','units'] },
  { id:'tenancy',   ico:'👥', tip:'Tenancy',    mods:['tenants','leases'] },
  { id:'finance',   ico:'💰', tip:'Finance',    mods:['invoices','receipts','payments','taxes'] },
  { id:'ops',       ico:'🔧', tip:'Operations', mods:['maintenance','compliance'] },
  { id:'intel',     ico:'🤖', tip:'Intelligence', mods:['ai'] }
];
const MODS = {
  dashboard:{label:'Dashboard',   ico:'🏠', group:'overview'},
  properties:{label:'Properties', ico:'🏢', group:'portfolio'},
  units:{label:'Units',       ico:'🚪', group:'portfolio'},
  tenants:{label:'Tenants',    ico:'👤', group:'tenancy'},
  leases:{label:'Leases',      ico:'📄', group:'tenancy'},
  invoices:{label:'Invoices',   ico:'🧾', group:'finance'},
  receipts:{label:'Receipts',   ico:'📜', group:'finance'},
  payments:{label:'Payments',   ico:'💳', group:'finance'},
  taxes:{label:'Taxes',      ico:'🏦', group:'finance'},
  maintenance:{label:'Maintenance', ico:'🔧', group:'ops'},
  compliance:{label:'Compliance',  ico:'⚖️', group:'ops'},
  ai:{label:'AI Assistant', ico:'🤖', group:'intel'}
};
const QUICK_ACTIONS = [
  {ico:'🏢', label:'Add Property', fn:'openPropForm()'},
  {ico:'👤', label:'Add Tenant', fn:'openTenantForm()'},
  {ico:'📄', label:'Add Lease', fn:'openLeaseForm()'},
  {ico:'🧾', label:'Generate Invoice', fn:'openInvoiceForm()'},
  {ico:'🔧', label:'Report Maintenance', fn:'openTicketForm()'}
];

// ---------- role engine (v2.2 role explorer) ----------
const ROLES = [
  { id:'superadmin', label:'Super Admin',         ico:'👑', tag:'Platform Owner' },
  { id:'owner',      label:'Subscriber (Owner)',  ico:'🏠', tag:'Property Owner' },
  { id:'manager',    label:'Property Manager',    ico:'🗝️', tag:'Owner\'s sub-user' },
  { id:'tenant',     label:'Tenant',              ico:'👤', tag:'Occupant' },
  { id:'partner',    label:'Service Partner',     ico:'🛠️', tag:'B2B contractor' },
  { id:'svc_mgr',    label:'Service Manager',     ico:'📋', tag:'Platform QC' },
  { id:'legal',      label:'Legal Team',          ico:'⚖️', tag:'Compliance' },
  { id:'crm',        label:'CRM & Help Desk',     ico:'🎧', tag:'Platform support' },
  { id:'accountant', label:'Accountant',          ico:'💰', tag:'Platform finance' },
  { id:'hr',         label:'HR & Admin',          ico:'🗂️', tag:'Platform ops' }
];
const PERMS = {
  superadmin: { mods:['dashboard','properties','units','tenants','leases','invoices','receipts','payments','taxes','maintenance','compliance','ai'], scope:'all', label:'Platform' },
  owner:      { mods:['dashboard','properties','units','tenants','leases','invoices','receipts','payments','taxes','maintenance','compliance','ai'], scope:'owner', label:'My Portfolio' },
  manager:    { mods:['dashboard','properties','units','tenants','leases','invoices','receipts','payments','taxes','maintenance','compliance','ai'], scope:'assigned', label:'Assigned' },
  tenant:     { mods:['dashboard','invoices','receipts','payments','maintenance','ai'], scope:'tenant', label:'Tenant Portal' },
  partner:    { mods:['dashboard','maintenance','invoices','payments','ai'], scope:'partner', label:'Partner Works' },
  svc_mgr:    { mods:['dashboard','maintenance','compliance','ai'], scope:'all', label:'QC' },
  legal:      { mods:['dashboard','compliance','leases','ai'], scope:'all', label:'Legal' },
  crm:        { mods:['dashboard','maintenance','ai'], scope:'all', label:'Support' },
  accountant: { mods:['dashboard','invoices','receipts','payments','taxes','ai'], scope:'all', label:'Finance' },
  hr:         { mods:['dashboard','ai'], scope:'all', label:'HR' }
};
let currentUser = DB.users.find(u=>u.id==='USR-ADM') || {id:'USR-ADM', role:'superadmin', name:'Kabir', avatar:'KB', scope:{}};
function roleOf(){ return ROLES.find(r=>r.id===currentUser.role) || ROLES[0]; }
function can(mod){ return PERMS[currentUser.role].mods.includes(mod); }
function modLabel(mid){
  const m = MODS[mid];
  if(currentUser.role==='tenant'){
    if(mid==='invoices') return {label:'My Invoices', ico:'🧾'};
    if(mid==='maintenance') return {label:'Report Issue', ico:'🔧'};
    if(mid==='payments') return {label:'Pay Rent', ico:'💳'};
  }
  if(currentUser.role==='partner' && mid==='maintenance') return {label:'My Works', ico:'🛠️'};
  return m;
}
// data scoping
function visibleProperties(){
  const s = currentUser.scope || {};
  if(currentUser.role==='manager') return DB.properties.filter(p=>s.properties.includes(p.id));
  return DB.properties;
}
function visibleUnits(){
  const s = currentUser.scope || {};
  if(currentUser.role==='tenant') return DB.units.filter(u=>u.id===s.unit);
  if(currentUser.role==='manager') return DB.units.filter(u=>s.properties.includes(u.property));
  return DB.units;
}
function visibleLeases(){
  const s = currentUser.scope || {};
  if(currentUser.role==='tenant') return DB.leases.filter(l=>l.tenant===s.tenant);
  if(currentUser.role==='manager'){
    const us = visibleUnits(); return DB.leases.filter(l=>us.some(u=>u.id===l.unit));
  }
  return DB.leases;
}
function visibleInvoices(){
  const ls = visibleLeases();
  return DB.invoices.filter(v=>ls.some(l=>l.id===v.lease));
}
function visibleTickets(){
  const s = currentUser.scope || {};
  if(currentUser.role==='tenant') return DB.tickets.filter(t=>t.unit===s.unit);
  if(currentUser.role==='partner'){
    const p = DB.partners.find(x=>x.id===s.partner);
    return DB.tickets.filter(t=>p && t.contractor && t.contractor.includes(p.name.replace(' Works','').replace(' Builders','')));
  }
  if(currentUser.role==='manager'){ const us=visibleUnits(); return DB.tickets.filter(t=>us.some(u=>u.id===t.unit)); }
  return DB.tickets;
}
function visibleTenants(){
  const s = currentUser.scope || {};
  if(currentUser.role==='tenant') return DB.tenants.filter(t=>t.id===s.tenant);
  if(currentUser.role==='manager'){
    const ls = visibleLeases(); return DB.tenants.filter(t=>ls.some(l=>l.tenant===t.id));
  }
  return DB.tenants;
}
function visibleReceipts(){
  const vis = visibleInvoices().map(v=>v.id);
  return DB.receipts.filter(r=>vis.includes(r.invoice));
}
function visiblePayments(){
  const vis = visibleInvoices().map(v=>v.id);
  return DB.payments.filter(p=>vis.includes(p.invoice));
}
function switchRole(userId){
  const u = DB.users.find(x=>x.id===userId);
  if(!u) return;
  currentUser = u;
  const avatar = document.getElementById('userAvatar');
  if(avatar) avatar.textContent = u.avatar;
  const ua = document.getElementById('userAvatarTitle');
  if(ua) ua.textContent = u.name + ' — ' + roleOf().label;
  if(!can(currentView)) nav('dashboard'); else nav(currentView);
  toast('Switched to ' + u.name + ' · ' + roleOf().label, 'success');
  closeModal();
}
function openRoleSwitcher(){
  const items = ROLES.map((r,i)=>{
    const u = DB.users.find(x=>x.role===r.id);
    const active = currentUser.role===r.id;
    return `<div class="rs-item ${active?'rs-active':''}" onclick="switchRole('${u.id}')" style="display:flex;gap:10px;align-items:center;padding:9px 10px;border-radius:9px;cursor:pointer;border:1px solid ${active?'#cfe0ff':'#f0f2f5'};background:${active?'#f2f7ff':'#fff'};margin-bottom:5px">
      <span style="font-size:17px">${r.ico}</span>
      <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;color:#222">${r.label}${active?' <span style="color:#2F80ED;font-size:9px">· ACTIVE</span>':''}</div>
      <div style="font-size:10px;color:#8895a7">${esc(u.name)} · ${r.tag}</div></div>
      <span style="font-size:9px;color:#2F80ED;background:#eef6ff;padding:2px 8px;border-radius:10px">${r.id==='superadmin'?'all data':PERMS[r.id].label}</span></div>`;
  }).join('');
  openModal('🔀 Role Explorer — switch persona',
    `<div style="font-size:11px;color:#667;line-height:1.7;margin-bottom:10px">Explore KRTaker from each user's perspective. Nav, dashboard and data scope adapt to the role.</div>
     <div id="rsList" style="max-height:56vh;overflow-y:auto;padding-right:2px">${items}</div>`,
    `<button class="drawer-btn secondary" onclick="closeModal()">Close</button>
     <button class="drawer-btn primary" onclick="resetDB()">Reset demo data</button>`);
}

// ---------- persistence ----------
function loadDB(){
  try{
    const raw = localStorage.getItem('krtaker_db_v3');
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return JSON.parse(JSON.stringify(SEED));
}
function saveDB(){ try{ localStorage.setItem('krtaker_db_v3', JSON.stringify(DB)); }catch(e){} }
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
  return `<div class="tbl-toolbar" style="justify-content:space-between;align-items:center">
    <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap"><span style="font-size:13px;font-weight:700;color:#222">${title}</span><span style="font-size:10.5px;color:#8895a7">${subtitle||''}</span></div>
    <div style="display:flex;gap:6px">${actions||''}</div></div>`;
}
function emptyState(msg){ return `<div style="padding:30px;text-align:center;color:#9aa5b1;font-size:11.5px">${msg}</div>`; }
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

// ---------- nav / groups / top nav ----------
function groupMods(gid){ const g=GROUPS.find(x=>x.id===gid); return g.mods.filter(can); }
function renderSidebar(){
  const h = GROUPS.map(g=>{
    if(!groupMods(g.id).length) return '';
    const active = currentGroup===g.id;
    return `<div class="sidebar-item ${active?'active':''} has-children" data-tip="${g.tip}" onclick="switchGroup('${g.id}')" id="s_${g.id}">${g.ico}</div>`;
  }).filter(x=>x!=='').join('<div class="s-grp-sep"></div>');
  document.getElementById('sidebarNav').innerHTML = h;
}
function renderTopNav(){
  const g = GROUPS.find(x=>x.id===currentGroup);
  const mods = g.mods.filter(can);
  document.getElementById('topNav').innerHTML = mods.map(mid=>{
    const m = modLabel(mid);
    return `<div class="top-nav-item ${currentView===mid?'active':''}" onclick="nav('${mid}')">${m.ico} ${m.label}</div>`;
  }).join('');
}
function switchGroup(gid){
  currentGroup = gid;
  renderSidebar(); renderTopNav();
  const g = GROUPS.find(x=>x.id===gid);
  const mods = g.mods.filter(can);
  nav(mods[0] || 'dashboard');
}
function openMobileNav(){
  const p = document.getElementById('mobileNavPanel');
  const groupsHtml = GROUPS.map(g=>{
    if(!groupMods(g.id).length) return '';
    return `<div class="mnav-grp ${currentGroup===g.id?'active':''}" onclick="switchGroup('${g.id}'); renderMobileNavList();">${g.ico}</div>`;
  }).join('');
  p.innerHTML = `
    <div class="mnav-head"><span>KRTaker — Modules</span><span class="mnav-close" onclick="closeMobileNav()">✕</span></div>
    <div class="mnav-groups">${groupsHtml}</div>
    <div id="mnavListWrap"></div>`;
  renderMobileNavList();
  document.getElementById('mobileNavSheet').style.display = 'flex';
}
function renderMobileNavList(){
  const g = GROUPS.find(x=>x.id===currentGroup);
  const wrap = document.getElementById('mnavListWrap');
  if(!wrap) return;
  const mods = g.mods.filter(can).map(mid=>{
    const m = modLabel(mid);
    return `<div class="mnav-item ${currentView===mid?'active':''}" onclick="nav('${mid}'); closeMobileNav()">${m.ico} ${m.label}${currentView===mid?'<span class="mnav-check">✓</span>':''}</div>`;
  }).join('');
  wrap.innerHTML = `<div class="mnav-grp-label">${g.tip}</div><div class="mnav-list">${mods}</div>`;
}
function closeMobileNav(){ document.getElementById('mobileNavSheet').style.display = 'none'; }
function nav(id){
  if(!can(id)) id = 'dashboard';
  currentView = id;
  const m = MODS[id];
  if(m && m.group !== currentGroup){ currentGroup = m.group; }
  renderSidebar(); renderTopNav();
  document.getElementById('mobileNavBtnLabel').textContent = m ? modLabel(id).label : 'Dashboard';
  document.getElementById('footerGroup').textContent = m ? GROUPS.find(g=>g.id===m.group).tip : 'Overview';
  document.getElementById('footerModName').textContent = m ? modLabel(id).label : 'Dashboard';
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
window.addEventListener('hashchange', ()=>{ const h=location.hash.slice(1); if(h && MODS[h]) nav(h); });

// ---------- global search (v2: grouped, keyboard-nav, recent, highlighted) ----------
let _sdItems = [], _sdHL = -1, _sdRecent = [];
try{ _sdRecent = JSON.parse(localStorage.getItem('krtaker_recent')||'[]'); }catch(e){}
function _sdSaveRecent(q){
  _sdRecent = [q, ..._sdRecent.filter(x=>x!==q)].slice(0,5);
  try{ localStorage.setItem('krtaker_recent', JSON.stringify(_sdRecent)); }catch(e){}
}
function hl(text, q){
  const t = esc(text); if(!q) return t;
  const ql = q.toLowerCase();
  let out = '', i = 0;
  const lower = t.toLowerCase();
  while(i < t.length){
    const j = lower.indexOf(ql, i);
    if(j < 0){ out += t.slice(i); break; }
    out += t.slice(i, j) + '<mark>' + t.slice(j, j+q.length) + '</mark>';
    i = j + q.length;
  }
  return out;
}
function openSearchDropdown(){
  const dd = document.getElementById('searchDropdown');
  dd.style.display = 'flex';
  const sd = document.getElementById('sdInput');
  sd.focus();
  onSearchInput(sd.value);
}
function onSearchInput(v){
  document.getElementById('gsInput').value = v;
  document.getElementById('sdInput').value = v;
  document.getElementById('sdClear').style.display = v ? 'flex' : 'none';
  doSearch(v);
}
function clearSearch(){
  document.getElementById('gsInput').value = '';
  document.getElementById('sdInput').value = '';
  document.getElementById('sdClear').style.display = 'none';
  doSearch('');
  document.getElementById('sdInput').focus();
}
function closeSearchDropdown(){
  document.getElementById('searchDropdown').style.display = 'none';
  _sdHL = -1; _sdItems = [];
  const ae = document.activeElement;
  if(ae && (ae.id==='sdInput'||ae.id==='gsInput')) ae.blur();
}
function doSearch(raw){
  const q = (raw||'').trim();
  const box = document.getElementById('sdResults');
  const count = document.getElementById('sdResultCount');
  _sdItems = []; _sdHL = -1;
  if(!q){
    // recent + quick module links
    let h = '';
    if(_sdRecent.length){
      h += '<div class="sd-group-header">🕐 Recent searches</div>';
      h += _sdRecent.map(r=>`<div class="sd-recent-item" data-r="${esc(r).replace(/'/g,'&#39;')}" onclick="sdGoRecent(this.dataset.r)"><span class="sd-icon" style="background:#f5f5f5;font-size:12px">🕐</span><div class="sd-info"><div class="sd-title">${esc(r)}</div></div><span class="sd-mod" onclick="event.stopPropagation();sdRemoveRecent(this.parentNode.dataset.r)">✕</span></div>`).join('');
    }
    h += '<div class="sd-group-header">🧭 Modules</div><div class="sd-quick">';
    Object.entries(MODS).forEach(([mid,m])=>{
      _sdItems.push({fn:`nav('${mid}')`});
      h += `<div class="sq" data-idx="${_sdItems.length-1}" onclick="sdGo(${_sdItems.length-1})"><span>${m.ico}</span>${m.label}</div>`;
    });
    h += '</div>';
    box.innerHTML = h;
    count.textContent = _sdRecent.length ? `All ${Object.keys(MODS).length} modules · ${_sdRecent.length} recent` : `All ${Object.keys(MODS).length} modules`;
    return;
  }
  const ql = q.toLowerCase();
  const groups = [];
  const push = (g, ico, mod, t, s, fn)=>{
    if(!groups[g]) groups[g] = [];
    groups[g].push({ico, mod, t, s, fn});
  };
  DB.properties.forEach(p=>{ if((p.name+' '+p.holding+' '+p.jurisdiction+' '+p.id).toLowerCase().includes(ql)) push('Properties','🏢','Property', p.name, `${p.id} · ${p.jurisdiction} · ${esc(p.holding)}`, `nav('properties'); openPropDetail('${p.id}')`); });
  DB.tenants.forEach(t=>{ if((t.name+' '+t.nid+' '+t.phone+' '+t.email).toLowerCase().includes(ql)) push('Tenants','👤','Tenant', t.name, `${t.id} · ${t.kind}${t.nrb?' · NRB':''}`, `nav('tenants'); openTenantDetail('${t.id}')`); });
  DB.leases.forEach(l=>{ if((l.id+' '+unitLabel(unitById(l.unit))+' '+(tenantById(l.tenant)?.name||'')).toLowerCase().includes(ql)) push('Leases','📄','Lease', l.id, `${unitLabel(unitById(l.unit))} · ${fmt(l.rent)}/mo · ${l.status}`, `nav('leases'); openLeaseDetail('${l.id}')`); });
  DB.invoices.forEach(v=>{ if((v.id+' '+v.lease+' '+v.month+' '+(tenantById(leaseById(v.lease)?.tenant)?.name||'')).toLowerCase().includes(ql)) push('Invoices','🧾','Invoice', v.id, `${v.lease} · ${v.month} · ${fmt(v.net)} · ${v.status}`, `nav('invoices')`); });
  DB.tickets.forEach(t=>{ if((t.id+' '+t.desc+' '+unitLabel(unitById(t.unit))).toLowerCase().includes(ql)) push('Maintenance','🔧','Ticket', t.id, `${unitLabel(unitById(t.unit))} · ${t.status}`, `nav('maintenance'); openTicketDetail('${t.id}')`); });
  Object.entries(MODS).forEach(([mid,m])=>{ if(m.label.toLowerCase().includes(ql)) push('Modules', m.ico, 'Module', m.label, 'Go to module', `nav('${mid}')`); });

  const total = Object.values(groups).reduce((s,a)=>s+a.length,0);
  if(total){ _sdSaveRecent(q); }
  let h = '';
  if(!total){
    h = `<div class="sd-empty"><div class="sd-empty-icon">🔍</div>No matches for “${esc(q)}”.<br>Try a property, tenant, lease, invoice or module name.</div>`;
  } else {
    Object.entries(groups).forEach(([g, arr])=>{
      if(!arr.length) return;
      h += `<div class="sd-group-header">${g} · ${arr.length}</div>`;
      arr.forEach(r=>{
        _sdItems.push({fn:r.fn});
        h += `<div class="sd-item" data-idx="${_sdItems.length-1}" onmouseenter="sdHover(${_sdItems.length-1})" onclick="sdGo(${_sdItems.length-1})">
          <span class="sd-icon">${r.ico}</span>
          <div class="sd-info"><div class="sd-title">${hl(r.t, ql)}</div><div class="sd-sub">${hl(r.s, ql)}</div></div>
          <span class="sd-mod">${r.mod}</span></div>`;
      });
    });
  }
  box.innerHTML = h;
  count.textContent = total ? total + ' result(s)' : '';
}
function sdHover(i){ _sdHL = i; _sdMark(); }
function sdGo(i){ const it=_sdItems[i]; if(!it) return; closeSearchDropdown(); eval(it.fn); }
function sdGoRecent(r){ document.getElementById('sdInput').value = r; onSearchInput(r); document.getElementById('sdInput').focus(); }
function sdRemoveRecent(r){ _sdRecent = _sdRecent.filter(x=>x!==r); try{ localStorage.setItem('krtaker_recent', JSON.stringify(_sdRecent)); }catch(e){} doSearch(''); }
function _sdMark(){
  document.querySelectorAll('.sd-item,.sd-recent-item,.sq').forEach(el=>{
    el.classList.toggle('sd-hl', Number(el.dataset.idx)===_sdHL);
  });
  const el = document.querySelector('[data-idx="'+_sdHL+'"]');
  if(el && el.scrollIntoView) el.scrollIntoView({block:'nearest'});
}
function searchKeyNav(e){
  const open = document.getElementById('searchDropdown').style.display==='flex';
  if(!open) return;
  if(e.key==='ArrowDown'){ e.preventDefault(); if(_sdItems.length){ _sdHL = (_sdHL+1)%_sdItems.length; _sdMark(); } }
  else if(e.key==='ArrowUp'){ e.preventDefault(); if(_sdItems.length){ _sdHL = _sdHL<=0 ? _sdItems.length-1 : _sdHL-1; _sdMark(); } }
  else if(e.key==='Enter'){ e.preventDefault(); if(_sdHL>=0 && _sdItems[_sdHL]) sdGo(_sdHL); else if(_sdItems[0]) sdGo(0); }
  else if(e.key==='Escape'){ e.preventDefault(); closeSearchDropdown(); }
}
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){
    e.preventDefault();
    const kbd = document.getElementById('gsKbd');
    if(kbd) kbd.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl+K';
    openSearchDropdown();
  }
  if(e.key==='Escape'){ closeModal(); closeQuickAdd(); closeMobileNav(); if(document.getElementById('searchDropdown').style.display==='flex') closeSearchDropdown(); }
});
(function(){ const kbd = document.getElementById('gsKbd'); if(kbd && /Mac|iPhone|iPad/.test(navigator.platform)) kbd.textContent = '⌘K'; })();

// ---------- quick add ----------
function quickActionsFor(){
  const role = currentUser.role;
  if(role==='tenant') return QUICK_ACTIONS.filter(a=>/Report|Invoice/.test(a.label));
  if(role==='partner') return QUICK_ACTIONS.filter(a=>/Report/.test(a.label));
  return QUICK_ACTIONS;
}
function openQuickAdd(){
  const acts = quickActionsFor();
  if(!acts.length){ toast('No quick actions for this role','error'); return; }
  document.getElementById('qaList').innerHTML = acts.map(a=>
    `<div style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;border:1px solid #f0f2f5" onmouseover="this.style.background='#f2f6fc'" onmouseout="this.style.background=''" onclick="${a.fn}; closeQuickAdd()">
      <span style="font-size:15px">${a.ico}</span><span style="font-size:12px;font-weight:600">${a.label}</span></div>`).join('');
  document.getElementById('qaDropdown').style.display = 'flex';
}
function closeQuickAdd(){ document.getElementById('qaDropdown').style.display='none'; }

// ---------- footer controls ----------
let _zoom = 100, _fs = 13;
function fontStep(d){
  _fs = Math.min(17, Math.max(10, _fs + d));
  document.documentElement.style.fontSize = _fs + 'px';
  toast('Text size: ' + _fs + 'px');
}
function changeZoom(d){
  _zoom = Math.min(140, Math.max(70, _zoom + d));
  document.getElementById('zoomLabel').textContent = _zoom + '%';
  document.querySelector('.main-area').style.transform = `scale(${_zoom/100})`;
  document.querySelector('.main-area').style.transformOrigin = 'top left';
}
function resetZoom(){ _zoom = 100; document.getElementById('zoomLabel').textContent = '100%'; document.querySelector('.main-area').style.transform=''; }
function toggleFullScreen(){
  if(!document.fullscreenElement){ document.documentElement.requestFullscreen().catch(()=>{}); }
  else { document.exitFullscreen().catch(()=>{}); }
}

// ---------- smart table framework (REM-style) ----------
const T = {};
function tstate(mod){ if(!T[mod]) T[mod]={q:'',page:1,sort:null,dir:1,filt:'All',view:'list'}; return T[mod]; }
function tblSearch(mod, val){ const st=tstate(mod); st.q=val; st.page=1; nav(mod); }
function tblFilter(mod, f){ const st=tstate(mod); st.filt=f; st.page=1; nav(mod); }
function tblSort(mod, k){ const st=tstate(mod); if(st.sort===k) st.dir*=-1; else { st.sort=k; st.dir=1; } st.page=1; nav(mod); }
function tblPage(mod, p){ tstate(mod).page=p; nav(mod); }
function tblView(mod, v){ tstate(mod).view=v; nav(mod); }

function smartTable(mod, opts){
  const st = tstate(mod);
  let rows = opts.rows.filter(r => (st.filt==='All' || opts.filterMatch(r, st.filt)) && (!st.q || opts.search(r, st.q.toLowerCase())));
  if(st.sort){
    const c = opts.cols.find(x=>x.k===st.sort);
    if(c && c.sort){
      rows = [...rows].sort((a,b)=>{ const va=c.sort(a), vb=c.sort(b); return (va<vb?-1:va>vb?1:0)*st.dir; });
    }
  }
  const total = rows.length, ps = opts.pageSize||8, pages = Math.max(1, Math.ceil(total/ps));
  if(st.page > pages) st.page = pages;
  const slice = rows.slice((st.page-1)*ps, st.page*ps);

  // filter chips
  const chips = ['All', ...opts.filters].map(f=>{
    const cnt = f==='All' ? opts.rows.length : opts.rows.filter(r=>opts.filterMatch(r,f)).length;
    return `<span class="flt-chip ${st.filt===f?'on':''}" onclick="tblFilter('${mod}','${f}')">${f} <span style="opacity:.6">${cnt}</span></span>`;
  }).join('');

  // view toggle (list / grid)
  const viewChips = opts.grid ? `<div class="view-chips" style="margin:0"><span class="view-chip-title">View:</span>
    <span class="view-chip ${st.view==='list'?'on':''}" onclick="tblView('${mod}','list')">☰ List</span>
    <span class="view-chip ${st.view==='grid'?'on':''}" onclick="tblView('${mod}','grid')">▦ Grid</span></div>` : '';

  // toolbar
  const toolbar = `<div class="tbl-toolbar">
    <div class="search-box"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input placeholder="Search ${opts.title.toLowerCase()}..." value="${esc(st.q)}" oninput="tblSearch('${mod}',this.value)"></div>
    ${viewChips}
    <span class="spacer" style="flex:1"></span>
    <span class="flt-count">${total} record(s)</span>
    <button class="filter-btn ${st.filt!=='All'?'on':''}" onclick="document.getElementById('fltBar_${mod}').style.display = document.getElementById('fltBar_${mod}').style.display==='none'?'flex':'none'">⚙ Filters${st.filt!=='All'?' ('+st.filt+')':''}</button>
  </div>
  <div class="flt-bar" id="fltBar_${mod}" style="${st.filt!=='All'?'':'display:none'}">${chips}</div>`;

  // body: grid or table
  let body = '';
  if(opts.grid && st.view==='grid'){
    body = slice.length ? `<div class="grid-cards">${slice.map(opts.grid).join('')}</div>` : emptyState(opts.empty||'Nothing found');
  } else {
    const thead = opts.cols.map(c=>{
      const arrow = st.sort===c.k ? (st.dir===1?'▲':'▼') : '⇅';
      return `<th class="${c.sort?'sortable':''}" ${c.sort?`onclick="tblSort('${mod}','${c.k}')"`:''}>${c.label}${c.sort?`<span class="s-arrow" style="color:${st.sort===c.k?'#2F80ED':'#bbb'}">${arrow}</span>`:''}</th>`;
    }).join('');
    const trows = slice.map(r=>`<tr ${opts.rowClick?`onclick="${opts.rowClick(r)}" style="cursor:pointer"`:''}>${opts.cols.map(c=>`<td>${c.render(r)}</td>`).join('')}</tr>`).join('');
    body = `<div class="table-wrap"><table class="table-view"><thead><tr>${thead}</tr></thead><tbody>${trows||`<tr><td colspan="${opts.cols.length}">${emptyState(opts.empty||'Nothing found')}</td></tr>`}</tbody></table></div>`;
  }

  // pagination
  const pgBtns = [];
  const win = 3;
  for(let p=1; p<=pages; p++){
    if(pages>7 && p>1+win && p<pages-win){ if(pgBtns[pgBtns.length-1]!=='…') pgBtns.push('…'); continue; }
    pgBtns.push(p);
  }
  const pag = pages>1 ? `<div class="pagination">
    <span class="pg-info">Page ${st.page} of ${pages} · ${total} record(s)</span>
    <button class="pg-btn" ${st.page>1?`onclick="tblPage('${mod}',${st.page-1})"`:''} ${st.page===1?'disabled style="opacity:.4"':''}>‹</button>
    ${pgBtns.map(p=>p==='…'?`<span style="color:#999">…</span>`:`<button class="pg-btn ${p===st.page?'pg-active':''}" onclick="tblPage('${mod}',${p})">${p}</button>`).join('')}
    <button class="pg-btn" ${st.page<pages?`onclick="tblPage('${mod}',${st.page+1})"`:''} ${st.page===pages?'disabled style="opacity:.4"':''}>›</button>
  </div>` : '';

  return `<div class="card" style="margin-top:10px">
    ${toolbar}
    ${body}
    ${pag}
  </div>`;
}

// ---------- dashboard (role-aware) ----------
function renderDashboard(){
  const ds = { superadmin:renderDSuper, owner:renderDOwner, manager:renderDManager, tenant:renderDTenant, partner:renderDPartner, svc_mgr:renderDSvcMgr, legal:renderDLegal, crm:renderDCrm, accountant:renderDAcct, hr:renderDHr };
  (ds[currentUser.role]||renderDOwner)();
}
function dashShell(title, sub, actions, body){
  document.getElementById('content').innerHTML = pageHeader(title, sub, actions) + body;
}
function renderDSuper(){
  const pf = DB.platform;
  const openTickets = DB.supportTickets.filter(t=>t.status==='Open').length;
  const trials = pf.subscriptions.filter(s=>s.status==='Trial').length;
  const net = pf.finance.reduce((s,f)=>s+f.amount,0);
  let h = statCards([
    ['Subscribers', pf.subscribers, '#2F80ED', pf.subsTrend],
    ['MRR / ARR', fmt(pf.mrr)+' / '+fmt(pf.arr), '#27ae60', 'SaaS revenue'],
    ['Service Partners', pf.partners, '#9b59b6', 'B2B orgs'],
    ['Open Support Tickets', openTickets, openTickets?'#e74c3c':'#27ae60', 'SLA monitor'],
    ['Platform Net (Jun)', fmt(net), '#e67e22', 'after fees & payouts']
  ]);
  const ops = [
    {ico:'💳', t:'Subscriptions & Plans', d:pf.subscriptions.length+' active · '+trials+' trial', fn:"toast('Subscriptions — Phase 2 backend','success')"},
    {ico:'📦', t:'Packages', d:'Starter · Business · Enterprise', fn:"toast('Packages — Phase 2 backend','success')"},
    {ico:'🔌', t:'Integrations', d:'bKash · SSLCommerz · e-Porcha', fn:"toast('Integrations — gateway config','success')"},
    {ico:'🌐', t:'Web CMS', d:'Marketing site & landing pages', fn:"toast('Web CMS — Phase 2 backend','success')"},
    {ico:'🛠️', t:'Service Partners', d:pf.partners+' orgs · '+DB.partners.filter(p=>p.status==='Onboarding').length+' onboarding', fn:"nav('maintenance')"},
    {ico:'⚖️', t:'Legal Team', d:'Staff + B2B firms · cases docket', fn:"nav('compliance')"},
    {ico:'💰', t:'Accounts & Finance', d:'MRR · settlements · payouts', fn:"nav('invoices')"},
    {ico:'🗂️', t:'HR & Admin', d:pf.staff+' staff · onboarding', fn:"nav('ai')"}
  ];
  const opsHtml = ops.map(o=>`<div class="prop-card" onclick="${o.fn}"><div style="font-size:15px">${o.ico}</div><div class="pc-name" style="margin-top:6px;font-size:12px">${o.t}</div><div class="pc-sub" style="font-size:10px;color:#8895a7;margin-top:2px">${o.d}</div></div>`).join('');
  h += `<div class="dash-grid" style="margin-top:14px">
    <div class="card" style="grid-column:1/-1"><div class="card-header">🛠 Platform Operations</div><div class="card-body"><div class="grid-cards" style="padding:0">${opsHtml}</div></div></div>
    <div class="card"><div class="card-header">💳 Active Subscriptions</div><div class="card-body">${pf.subscriptions.map(s=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f4f6f9;font-size:11px"><span><b>${esc(s.org)}</b><div style="font-size:9.5px;color:#8895a7">${s.plan} · ${s.seats} seat(s)</div></span><span style="text-align:right">${fmt(s.mrr)}/mo<br><span style="font-size:9px;color:#8895a7">${s.status}</span></span></div>`).join('')}</div></div>
    <div class="card"><div class="card-header">🧾 Platform Finance (Jun 2026)</div><div class="card-body">${pf.finance.map(f=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f4f6f9;font-size:11px"><span>${esc(f.type)}</span><b style="color:${f.amount<0?'#e74c3c':'#27ae60'}">${f.amount<0?'−':'+'}${fmt(Math.abs(f.amount))}</b></div>`).join('')}<div style="display:flex;justify-content:space-between;padding-top:7px;font-weight:700;font-size:12px"><span>Net</span><span>${fmt(net)}</span></div></div></div>
  </div>`;
  dashShell('Platform Command Center', 'Super Admin — '+roleOf().tag+' · subscriptions, billing, partners, finance, HR', `<button class="action-btn ghost" onclick="openRoleSwitcher()">🔀 Switch role</button><button class="action-btn primary" onclick="openQuickAdd()">＋ Quick add</button>`, h);
}
function renderDOwner(){
  const activeLeases = visibleLeases().filter(l=>l.status==='Active');
  const pendingReg = visibleLeases().filter(l=>l.status==='Pending Registration');
  const occupied = visibleUnits().filter(u=>u.status==='Leased').length;
  const totalUnits = visibleUnits().length;
  const portValue = visibleProperties().reduce((s,p)=>s+p.value,0);
  const rentDue = visibleInvoices().filter(v=>v.status==='Unpaid'||v.status==='Overdue').reduce((s,v)=>s+v.gross,0);
  const openTickets = visibleTickets().filter(t=>t.status==='Open'||t.status==='In Progress').length;
  const due30 = visibleInvoices().filter(v=>v.status==='Overdue').reduce((s,v)=>s+v.gross,0);

  let h = statCards([
    ['Portfolio Value', fmt(portValue), '#2F80ED', '৳'+(portValue/1e7).toFixed(1)+' Cr'],
    ['Units', totalUnits+' ('+occupied+' leased)', '#27ae60', totalUnits?Math.round(occupied/totalUnits*100)+'% occupancy':'—'],
    ['Rent Due (Jun–Jul)', fmt(rentDue), '#e67e22', 'Overdue '+fmt(due30)],
    ['Leases Pending Registration', pendingReg.length, pendingReg.length?'#e74c3c':'#27ae60', 'Legal gate active'],
    ['Open Tickets', openTickets, '#9b59b6', visibleTickets().filter(t=>t.liability==='Landlord'&&t.status==='Open').length+' landlord-side']
  ]);

  const occBars = visibleProperties().map(p=>{
    const us = DB.units.filter(u=>u.property===p.id);
    const oc = us.filter(u=>u.status==='Leased').length;
    const pct = us.length ? Math.round(oc/us.length*100) : 0;
    return `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:10.5px;color:#667;margin-bottom:3px"><span>${esc(p.name)}</span><span>${oc}/${us.length} · ${pct}%</span></div>
      <div style="height:7px;background:#eef1f5;border-radius:4px"><div style="height:7px;width:${pct}%;background:${pct>80?'#27ae60':pct>40?'#2F80ED':'#e67e22'};border-radius:4px"></div></div></div>`;
  }).join('');

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
        <div>🏠 <b>${visibleLeases().filter(l=>l.residential && l.advance>l.rent).length}</b> residential lease(s) exceed 1-month advance cap (PRCA 1991 §10/§23)</div>
        <div>🧾 <b>${visibleInvoices().filter(v=>v.tds>0).length}</b> invoices with TDS split (Income Tax Act 2023)</div>
      </div></div></div>
    <div class="card"><div class="card-header">AI Caretaker</div><div class="card-body">
      <div style="font-size:11px;color:#667;line-height:1.7;margin-bottom:8px">Ask KR to generate invoices, check PRCA limits, resolve maintenance liability, or answer tax questions.</div>
      <button class="action-btn primary" style="width:100%" onclick="nav('ai')">🤖 Open AI Assistant</button>
    </div></div>
  </div>`;
  dashShell('My Portfolio', 'Subscriber (Owner) — '+roleOf().tag+' · '+visibleProperties().length+' properties', `<button class="action-btn ghost" onclick="openRoleSwitcher()">🔀 Switch role</button><button class="action-btn primary" onclick="nav('ai')">🤖 Ask KR</button>`, h);
}
function renderDManager(){
  const props = visibleProperties(); const units = visibleUnits(); const ls = visibleLeases();
  const invs = visibleInvoices();
  const rentDue = invs.filter(v=>v.status==='Unpaid'||v.status==='Overdue').reduce((s,v)=>s+v.gross,0);
  const openTix = visibleTickets().filter(t=>t.status!=='Closed').length;
  let h = statCards([
    ['Assigned Properties', props.length, '#2F80ED', props.map(p=>esc(p.name.split(' ')[0])).join(' · ')],
    ['Units Managed', units.length+' ('+units.filter(u=>u.status==='Leased').length+' leased)', '#27ae60', ''],
    ['Rent Due (scoped)', fmt(rentDue), '#e67e22', invs.filter(v=>v.status==='Overdue').length+' overdue'],
    ['Open Tasks / Tickets', openTix, '#9b59b6', '']
  ]);
  h += `<div class="dash-grid" style="margin-top:14px">
    <div class="card"><div class="card-header">🗝️ My Properties</div><div class="card-body">${props.map(p=>{
      const us=DB.units.filter(u=>u.property===p.id); const oc=us.filter(u=>u.status==='Leased').length;
      return `<div class="prop-card" style="margin-bottom:8px" onclick="nav('properties'); openPropDetail('${p.id}')"><div style="display:flex;justify-content:space-between"><div class="pc-name">${esc(p.name)}</div>${badge(p.status)}</div><div class="pc-sub">${us.length} units · ${oc} leased · ${esc(p.jurisdiction)}</div></div>`;
    }).join('')}</div></div>
    <div class="card"><div class="card-header">⚡ Today's focus</div><div class="card-body" style="font-size:11px;line-height:2">
      <div>📄 ${ls.filter(l=>l.status==='Pending Registration').length} lease(s) pending registration — upload sub-registry docs</div>
      <div>🧾 ${invs.filter(v=>v.status==='Unpaid'||v.status==='Overdue').length} unpaid invoice(s) — send reminders or trigger AI</div>
      <div>🔧 ${openTix} open ticket(s) — ${visibleTickets().filter(t=>t.liability==='Landlord'&&t.status!=='Closed').length} landlord-side</div>
      <div style="margin-top:6px"><button class="mini-btn" onclick="nav('leases')">Review leases</button> <button class="mini-btn" onclick="nav('maintenance')">Tickets</button></div>
    </div></div>
  </div>`;
  dashShell('My Workboard', 'Property Manager — '+roleOf().tag+' · scoped to assigned properties', `<button class="action-btn ghost" onclick="openRoleSwitcher()">🔀 Switch role</button>`, h);
}
function renderDTenant(){
  const s = currentUser.scope || {};
  const me = DB.tenants.find(t=>t.id===s.tenant);
  const unit = DB.units.find(u=>u.id===s.unit);
  const ls = visibleLeases();
  const invs = visibleInvoices();
  const due = invs.filter(v=>v.status==='Unpaid'||v.status==='Overdue');
  const myTix = visibleTickets();
  let h = statCards([
    ['My Unit', unit?esc(unit.name):'—', '#2F80ED', esc(propertyById(unit?.property)?.name||'')],
    ['Monthly Rent', ls.length?fmt(ls[0].rent):'—', '#27ae60', ls[0]?ls[0].status:''],
    ['Outstanding', fmt(due.reduce((s2,v)=>s2+v.net,0)), due.length?'#e74c3c':'#27ae60', due.length?due.length+' invoice(s)':'All clear'],
    ['My Tickets', myTix.length, '#9b59b6', myTix.filter(t=>t.status!=='Closed').length+' open']
  ]);
  h += `<div class="dash-grid" style="margin-top:14px">
    <div class="card"><div class="card-header">🏠 My Lease</div><div class="card-body" style="font-size:11.5px;line-height:1.9">
      ${ls.length?ls.map(l=>`<div><b>${l.id}</b> · ${l.start} → ${l.end}<br>Rent <b>${fmt(l.rent)}</b>/mo · Advance ${fmt(l.advance)} · ${badge(l.status)}</div>`).join(''):'No lease found'}
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        <button class="mini-btn" onclick="nav('invoices')">🧾 My invoices</button>
        <button class="mini-btn" onclick="nav('payments')">💳 Pay rent</button>
        <button class="mini-btn" onclick="nav('maintenance')">🔧 Report issue</button>
      </div></div></div>
    <div class="card"><div class="card-header">💬 AI Tenant Assistant</div><div class="card-body" style="font-size:11px;color:#667;line-height:1.7">
      Ask KR about your lease, PRCA rights (advance cap, eviction protection), or maintenance liability. Limited to tenant scope.
      <div style="margin-top:8px"><button class="action-btn primary" style="width:100%" onclick="nav('ai')">🤖 Ask KR</button></div></div></div>
  </div>`;
  dashShell('Tenant Portal', esc(me?.name||'')+' — '+roleOf().tag+' · you see only your own unit & lease', `<button class="action-btn ghost" onclick="openRoleSwitcher()">🔀 Switch role</button>`, h);
}
function renderDPartner(){
  const s = currentUser.scope || {};
  const p = DB.partners.find(x=>x.id===s.partner);
  const works = visibleTickets();
  const active = works.filter(t=>t.status!=='Closed');
  const myInvs = DB.invoices.filter(v=>v.lease && leaseById(v.lease)); // partner billing placeholder
  let h = statCards([
    ['My Rating', p?p.rating.toFixed(1)+' ★':'—', '#e67e22', p?p.jobs+' completed jobs':''],
    ['Active Works', active.length, '#2F80ED', works.filter(t=>t.status==='Open').length+' awaiting start'],
    ['Awaiting QC', works.filter(t=>t.status==='Awaiting Payment'||t.status==='In Progress').length, '#9b59b6', 'Service Manager review'],
    ['This Month Billing', fmt(works.filter(t=>t.cost>0).reduce((s2,t)=>s2+t.cost,0)), '#27ae60', 'net of platform fee']
  ]);
  h += `<div class="dash-grid" style="margin-top:14px">
    <div class="card"><div class="card-header">🛠️ My Works</div><div class="card-body">${works.length?works.map(t=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f4f6f9;font-size:11px">
      <span><b>${t.id}</b> · ${esc(t.desc.slice(0,42))}<div style="font-size:9.5px;color:#8895a7">${esc(unitLabel(unitById(t.unit)))} · ${t.contractor}</div></span>
      <span style="text-align:right">${badge(t.status)}<div style="font-size:9.5px">${t.cost?fmt(t.cost):'—'}</div></span></div>`).join(''):emptyState('No works assigned')}
      <div style="margin-top:8px"><button class="mini-btn" onclick="nav('maintenance')">Open all works →</button></div></div></div>
    <div class="card"><div class="card-header">📋 Partner Tools</div><div class="card-body" style="font-size:11px;line-height:2.2">
      <div>📦 <b>Services catalog</b> — Structural & Steel (${p?esc(p.trade):''})</div>
      <div>📝 <b>Quotations</b> — send quote on new work orders</div>
      <div>🧾 <b>Billing & payouts</b> — net of 10% platform fee, TDS applied</div>
      <div>👥 <b>My team</b> — 3 members · manage access</div>
      <div style="margin-top:6px"><button class="mini-btn" onclick="toast('Partner portal — Phase 4 backend','success')">Manage profile</button></div>
    </div></div>
  </div>`;
  dashShell('Partner Workspace', esc(p?.name||'')+' — '+roleOf().tag+' · B2B contractor', `<button class="action-btn ghost" onclick="openRoleSwitcher()">🔀 Switch role</button>`, h);
}
function renderDSvcMgr(){
  const all = DB.tickets;
  const qc = all.filter(t=>t.status==='In Progress'||t.status==='Awaiting Payment');
  const open = all.filter(t=>t.status==='Open');
  let h = statCards([
    ['Open Work Orders', open.length, '#e67e22', 'to route to partners'],
    ['In QC Queue', qc.length, '#2F80ED', 'inspection & sign-off'],
    ['Completed (all-time)', all.filter(t=>t.status==='Closed').length, '#27ae60', ''],
    ['Partners Active', DB.partners.filter(p=>p.status==='Active').length, '#9b59b6', DB.partners.length+' total']
  ]);
  h += `<div class="dash-grid" style="margin-top:14px">
    <div class="card"><div class="card-header">🔍 QC Inspection Queue</div><div class="card-body">${qc.length?qc.map(t=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f4f6f9;font-size:11px">
      <span><b>${t.id}</b> · ${esc(t.desc.slice(0,40))}<div style="font-size:9.5px;color:#8895a7">${esc(unitLabel(unitById(t.unit)))} · ${t.contractor||'unassigned'}</div></span>
      ${badge(t.status)}</div>`).join(''):emptyState('QC queue clear ✓')}
      <div style="margin-top:8px"><button class="mini-btn" onclick="nav('maintenance')">Open inspections →</button></div></div></div>
    <div class="card"><div class="card-header">📊 Partner Performance</div><div class="card-body">${DB.partners.map(p=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f4f6f9;font-size:11px"><span>${esc(p.name)} · <span style="color:#8895a7;font-size:10px">${esc(p.trade)}</span></span><b>${p.rating.toFixed(1)} ★ <span style="color:#8895a7;font-weight:400">${p.jobs} jobs</span></b></div>`).join('')}</div></div>
  </div>`;
  dashShell('QC Command', 'Service Manager — '+roleOf().tag+' · inspect & QC partner works platform-wide', `<button class="action-btn ghost" onclick="openRoleSwitcher()">🔀 Switch role</button>`, h);
}
function renderDLegal(){
  const pendingReg = DB.leases.filter(l=>l.status==='Pending Registration');
  const evict = DB.tenants.map(t=>({t, e:evictionEligible(t.id)})).filter(x=>x.e.eligible);
  let h = statCards([
    ['Leases Pending Registration', pendingReg.length, pendingReg.length?'#e74c3c':'#27ae60', 'TPA 1882 §107'],
    ['Active Eviction Grounds', evict.length, evict.length?'#e67e22':'#27ae60', 'PRCA §18'],
    ['Registered Instruments', DB.leases.filter(l=>l.regMeta).length, '#2F80ED', 'verified'],
    ['Statutory Deadlines', 3, '#9b59b6', 'this quarter']
  ]);
  h += `<div class="dash-grid" style="margin-top:14px">
    <div class="card"><div class="card-header">⚖️ Case Docket</div><div class="card-body">
      <div style="font-size:11px;line-height:1.9">
      ${pendingReg.map(l=>`<div>📄 <b>${l.id}</b> — ${esc(unitLabel(unitById(l.unit)))} · ${leaseMonths(l)} mo · <a href="javascript:nav('leases'); openLeaseDetail('${l.id}')" style="color:#2F80ED">review</a></div>`).join('')}
      ${evict.map(x=>`<div>⚡ <b>${esc(x.t.name)}</b> — ${x.e.months} mo unpaid · <a href="javascript:generateEvictionNotice('${x.t.id}')" style="color:#2F80ED">generate §114A notice</a></div>`).join('')}
      ${!pendingReg.length&&!evict.length?'No active cases ✓':''}
      </div></div></div>
    <div class="card"><div class="card-header">🗓 Statutory Calendar</div><div class="card-body" style="font-size:11px;line-height:2">
      <div>🗓 Holding tax return — <b>Jun 30</b></div><div>🗓 TDS PSR — <b>monthly by 7th</b></div>
      <div>🗓 Surcharge declaration — <b>Nov 30</b></div><div>🗓 Income tax — <b>Nov 30</b></div>
      <div style="margin-top:6px"><button class="mini-btn" onclick="nav('compliance')">Open compliance engine →</button></div>
    </div></div>
  </div>`;
  dashShell('Legal & Compliance', 'Legal Team — '+roleOf().tag+' · staff counsel or B2B firm', `<button class="action-btn ghost" onclick="openRoleSwitcher()">🔀 Switch role</button>`, h);
}
function renderDCrm(){
  const tickets = DB.supportTickets;
  const open = tickets.filter(t=>t.status==='Open');
  const prog = tickets.filter(t=>t.status==='In Progress');
  const resolved = tickets.filter(t=>t.status==='Resolved');
  let h = statCards([
    ['Open Tickets', open.length, open.length?'#e74c3c':'#27ae60', 'SLA: 4h response'],
    ['In Progress', prog.length, '#e67e22', 'assigned'],
    ['Resolved (7d)', resolved.length, '#27ae60', 'CSAT '+DB.platform.csat+'/5'],
    ['Subscribers', DB.platform.subscribers, '#2F80ED', 'care coverage']
  ]);
  h += `<div class="dash-grid" style="margin-top:14px">
    <div class="card"><div class="card-header">🎧 Support Queue</div><div class="card-body">${tickets.map(t=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f4f6f9;font-size:11px">
      <span style="min-width:0;flex:1"><b>${t.id}</b> · ${esc(t.subject.slice(0,46))}<div style="font-size:9.5px;color:#8895a7">${esc(t.from)} · ${t.age}${t.assignee?' · '+esc(t.assignee):''}</div></span>
      <span style="text-align:right">${badge(t.status)}<div style="font-size:9px;color:${t.prio==='High'?'#e74c3c':'#e67e22'};font-weight:600">${t.prio}</div></span></div>`).join('')}</div></div>
    <div class="card"><div class="card-header">🤝 CRM Notes</div><div class="card-body" style="font-size:11px;line-height:1.9">
      <div>✅ Onboarding call — <b>Orbit Textiles</b> (tenant) done</div>
      <div>✅ Follow-up — <b>Bengal Agro Foods</b> VAT invoice (SUP-006)</div>
      <div>⏳ Trial conversion — <b>Gulshan Lakeside Plot</b> ends Jun 28</div>
      <div style="margin-top:6px"><button class="mini-btn" onclick="toast('Ticket actions — Phase 2 backend','success')">Create ticket</button></div>
    </div></div>
  </div>`;
  dashShell('Help Desk & CRM', 'CRM & Help Desk — '+roleOf().tag+' · support ticketing platform-wide', `<button class="action-btn ghost" onclick="openRoleSwitcher()">🔀 Switch role</button>`, h);
}
function renderDAcct(){
  const pf = DB.platform;
  const net = pf.finance.reduce((s,f)=>s+f.amount,0);
  let h = statCards([
    ['Platform Revenue (Jun)', fmt(pf.mrr), '#27ae60', 'MRR '+fmt(pf.arr)+' ARR'],
    ['Net (Jun)', fmt(net), '#2F80ED', 'after fees & payouts'],
    ['Subscriptions', pf.subscriptions.length, '#9b59b6', pf.subscriptions.filter(s=>s.status==='Active').length+' active'],
    ['TDS Payable', fmt(152000), '#e67e22', 'NBR compliance']
  ]);
  h += `<div class="dash-grid" style="margin-top:14px">
    <div class="card"><div class="card-header">🧾 Platform Finance Ledger (Jun 2026)</div><div class="card-body">${pf.finance.map(f=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f4f6f9;font-size:11px"><span>${esc(f.type)} · <span style="color:#8895a7">${f.month}</span></span><b style="color:${f.amount<0?'#e74c3c':'#27ae60'}">${f.amount<0?'−':'+'}${fmt(Math.abs(f.amount))}</b></div>`).join('')}<div style="display:flex;justify-content:space-between;padding-top:7px;font-weight:700"><span>Net</span><span>${fmt(net)}</span></div></div></div>
    <div class="card"><div class="card-header">💳 Subscription Billing</div><div class="card-body">${pf.subscriptions.map(s=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f4f6f9;font-size:11px"><span>${esc(s.org)} · ${s.plan}</span><span>${fmt(s.mrr)}/mo · ${s.status}</span></div>`).join('')}<div style="margin-top:6px"><button class="mini-btn" onclick="nav('invoices')">Tenant invoices →</button></div></div></div>
  </div>`;
  dashShell('Platform Finance', 'Accountant — '+roleOf().tag+' · MRR, settlements, payouts, TDS', `<button class="action-btn ghost" onclick="openRoleSwitcher()">🔀 Switch role</button>`, h);
}
function renderDHr(){
  const staff = DB.staff;
  let h = statCards([
    ['Staff', staff.length, '#2F80ED', staff.filter(s=>s.status==='Active').length+' active'],
    ['Departments', [...new Set(staff.map(s=>s.dept))].length, '#9b59b6', 'Ops · Support · Finance · Admin · Legal'],
    ['Probation', staff.filter(s=>s.status==='Probation').length, '#e67e22', 'review pending'],
    ['Open Roles', 3, '#27ae60', 'Service Mgr · CRM · Legal']
  ]);
  h += `<div class="dash-grid" style="margin-top:14px">
    <div class="card"><div class="card-header">🗂️ Staff Directory</div><div class="card-body">${staff.map(s=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f4f6f9;font-size:11px"><span><b>${esc(s.name)}</b><div style="font-size:9.5px;color:#8895a7">${esc(s.role)} · ${esc(s.dept)}</div></span>${badge(s.status)}</div>`).join('')}<div style="margin-top:6px"><button class="mini-btn" onclick="toast('HR tools — Phase 2 backend','success')">＋ Onboard staff</button></div></div></div>
    <div class="card"><div class="card-header">⚙️ Admin Ops</div><div class="card-body" style="font-size:11px;line-height:2">
      <div>🖥 IT & access — 10 role accounts provisioned</div>
      <div>📁 Document vault — org policies, NDA, compliance files</div>
      <div>🏢 Office ops — payroll inputs for 8 staff</div>
      <div>🔐 Audit — role-based access reviewed monthly</div>
    </div></div>
  </div>`;
  dashShell('HR & Admin', 'HR & Admin — '+roleOf().tag+' · staff & platform operations', `<button class="action-btn ghost" onclick="openRoleSwitcher()">🔀 Switch role</button>`, h);
}

// ---------- properties ----------
function renderProperties(){
  const opts = {
    title:'properties',
    cols:[
      {k:'name', label:'Property', sortable:true, sort:r=>r.name, render:r=>`<b>${esc(r.name)}</b><span class="kr-badge">${r.type}</span><div class="mono" style="font-size:10px;color:#8895a7">${r.id} · ${esc(r.holding)}</div>`},
      {k:'jur', label:'Jurisdiction', sortable:true, sort:r=>r.jurisdiction, render:r=>r.jurisdiction},
      {k:'units', label:'Units', sortable:true, sort:r=>DB.units.filter(u=>u.property===r.id).length, render:r=>DB.units.filter(u=>u.property===r.id).length},
      {k:'rent', label:'Rent Roll', sortable:true, sort:r=>{const us=DB.units.filter(u=>u.property===r.id); return DB.leases.filter(l=>us.some(u=>u.id===l.unit)&&l.status==='Active').reduce((s,l)=>s+l.rent,0);}, render:r=>{const us=DB.units.filter(u=>u.property===r.id); return fmt(DB.leases.filter(l=>us.some(u=>u.id===l.unit)&&l.status==='Active').reduce((s,l)=>s+l.rent,0))+'<div style="font-size:9.5px;color:#8895a7">/mo</div>';}},
      {k:'value', label:'Value', sortable:true, sort:r=>r.value, render:r=>fmt(r.value)},
      {k:'status', label:'Status', sortable:true, sort:r=>r.status, render:r=>badge(r.status)}
    ],
    rows: visibleProperties(),
    filters:['Flat','Plot','Commercial','Industrial'],
    filterMatch:(r,f)=>r.type===f,
    search:(r,q)=>((r.name+' '+r.holding+' '+r.jurisdiction+' '+r.id).toLowerCase().includes(q)),
    rowClick:r=>`openPropDetail('${r.id}')`,
    grid:true,
    grid:r=>{const us=DB.units.filter(u=>u.property===r.id); const oc=us.filter(u=>u.status==='Leased').length;
      return `<div class="prop-card" onclick="openPropDetail('${r.id}')">
        <div style="display:flex;justify-content:space-between;align-items:start"><div class="pc-name">${esc(r.name)}</div>${badge(r.status)}</div>
        <div class="pc-sub">${r.type} · ${r.jurisdiction}<br>${esc(r.holding)}</div>
        <div class="pc-stats"><span>${us.length} units · ${oc} leased</span><span class="pc-val">${fmt(r.value)}</span></div>
      </div>`;},
    empty:'No properties match'
  };
  document.getElementById('content').innerHTML =
    pageHeader('Properties', 'Portfolio assets with jurisdiction & khatian records', `<button class="action-btn primary" onclick="openPropForm()">＋ Add Property</button>`)
    + smartTable('properties', opts);
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
  const opts = {
    title:'units',
    cols:[
      {k:'name', label:'Unit', sortable:true, sort:r=>r.name, render:r=>`<b>${esc(r.name)}</b><div style="font-size:10px;color:#8895a7">${esc(propertyById(r.property)?.name||'')}</div>`},
      {k:'floor', label:'Floor', sortable:true, sort:r=>r.floor, render:r=>r.floor},
      {k:'sqft', label:'Size', sortable:true, sort:r=>r.sqft, render:r=>r.sqft?r.sqft.toLocaleString()+' sqft':'—'},
      {k:'status', label:'Status', sortable:true, sort:r=>r.status, render:r=>badge(r.status)},
      {k:'lease', label:'Lease(s)', sortable:false, render:r=>leasesForUnit(r.id).map(l=>l.id).join(', ')||'—'}
    ],
    rows: visibleUnits(),
    filters:['Leased','Vacant','Maintenance'],
    filterMatch:(r,f)=>r.status===f,
    search:(r,q)=>((r.name+' '+r.id+' '+(propertyById(r.property)?.name||'')).toLowerCase().includes(q)),
    rowClick:r=>`openUnitDetail('${r.id}')`,
    empty:'No units match'
  };
  document.getElementById('content').innerHTML =
    pageHeader('Units', 'Individual lettable units across the portfolio', `<button class="action-btn primary" onclick="openUnitForm()">＋ Add Unit</button>`)
    + smartTable('units', opts);
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
      <div class="form-group"><div class="form-label">Property</div><select class="form-input" id="uf_prop">${visibleProperties().map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
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
  const opts = {
    title:'tenants',
    cols:[
      {k:'name', label:'Tenant', sortable:true, sort:r=>r.name, render:r=>`<b>${esc(r.name)}</b>${r.nrb?`<span class="kr-badge" style="background:#eef8ee;color:#27ae60;border-color:#c9ecc9">NRB</span>`:''}`},
      {k:'kind', label:'Kind', sortable:true, sort:r=>r.kind, render:r=>r.kind},
      {k:'nid', label:'NID / BIN', sortable:false, render:r=>`<span class="mono">${r.nid}</span>`},
      {k:'phone', label:'Phone', sortable:false, render:r=>r.phone},
      {k:'leases', label:'Leases', sortable:true, sort:r=>DB.leases.filter(l=>l.tenant===r.id&&(l.status==='Active'||l.status==='Pending Registration')).length, render:r=>DB.leases.filter(l=>l.tenant===r.id&&(l.status==='Active'||l.status==='Pending Registration')).map(l=>l.id).join(', ')||'—'},
      {k:'rent', label:'Rent Roll', sortable:true, sort:r=>DB.leases.filter(l=>l.tenant===r.id&&(l.status==='Active'||l.status==='Pending Registration')).reduce((s,l)=>s+l.rent,0), render:r=>{const m=DB.leases.filter(l=>l.tenant===r.id&&(l.status==='Active'||l.status==='Pending Registration')).reduce((s,l)=>s+l.rent,0); return m?fmt(m)+'/mo':'—';}}
    ],
    rows: visibleTenants(),
    filters:['Individual','Corporate'],
    filterMatch:(r,f)=>r.kind===f,
    search:(r,q)=>((r.name+' '+r.nid+' '+r.phone+' '+r.email).toLowerCase().includes(q)),
    rowClick:r=>`openTenantDetail('${r.id}')`,
    empty:'No tenants match'
  };
  document.getElementById('content').innerHTML =
    pageHeader('Tenants', 'Tenant directory with NID & NRB status', `<button class="action-btn primary" onclick="openTenantForm()">＋ Add Tenant</button>`)
    + smartTable('tenants', opts);
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
