// === KRTaker: leases (legal gates), invoices (TDS), receipts, maintenance ===

// ---------- legal engines ----------
function leaseMonths(l){ return Math.max(1, Math.round((new Date(l.end)-new Date(l.start))/2592000000)); }
function registrationGate(l){
  const months = leaseMonths(l);
  if(months > 12 && !l.regMeta) return {block:true, msg:`Duration ${months} months > 12 — TPA 1882 §107 + Registration Act §17(1)(d) require a registered instrument. Ledger stays inactive until sub-registry details are uploaded.`};
  if(months > 12 && l.regMeta) return {block:false, note:'Registered instrument verified.'};
  return {block:false, note:''};
}
function prcaAdvanceFlag(l){
  if(l.residential && l.advance > l.rent) return {flag:true, msg:`Advance ${fmt(l.advance)} exceeds 1 month rent (${fmt(l.rent)}) — PRCA 1991 §10/§23 requires rent-controller written consent. Manual override allowed for commercial.`};
  return {flag:false, msg:''};
}
function prcaRevisionFlag(l){
  const months = leaseMonths(l);
  if(months >= 24) return {flag:true, msg:`PRCA 1991 §15/§16 — rent can generally only be revised every 2 years. Future revision on this lease will be flagged.`};
  return {flag:false, msg:''};
}
function tdsFor(lease){
  const t = tenantById(lease.tenant);
  if(t && t.kind === 'Corporate'){
    const u = unitById(lease.unit);
    const p = propertyById(u?.property);
    const section = (p && p.type==='Commercial') ? '§128' : '§109';
    const rate = (p && p.type==='Commercial') ? 0.04 : 0.10;
    return {rate, section};
  }
  return {rate:0, section:''};
}
function holdingTaxCalc(p){
  const us = DB.units.filter(u=>u.property===p.id);
  const ls = DB.leases.filter(l=>us.some(u=>u.id===l.unit) && (l.status==='Active'||l.status==='Pending Registration'));
  const gar = ls.reduce((s,l)=>s+l.rent*12,0);
  const allowance = gar/6;                       // 2 months of rent ≈ 16.67%
  const interest = p.mortgage ? p.mortgage.interest : 0;
  const nav = Math.max(0, gar - allowance - interest);
  const rate = { 'Dhaka North':0.08, 'Dhaka South':0.075, 'Chattogram':0.07, 'Gazipur':0.07 }[p.jurisdiction] || 0.06;
  return {gar, allowance, interest, nav, rate, tax: Math.round(nav*rate)};
}
function evictionEligible(tenantId){
  const overdue = DB.invoices.filter(v=>{
    const l = leaseById(v.lease); return l && l.tenant===tenantId && v.status==='Overdue';
  });
  const months = overdue.length;
  return {eligible: months>=3, months, msg: months>=3 ? `Tenant has ${months} months of unpaid rent — eviction grounds under PRCA 1991 §18 met. Generate compliant notice (§114A procedure).` : `${months} month(s) unpaid — §18 eviction grounds require ≥ 3 months.`};
}

// ---------- leases ----------
function renderLeases(){
  const opts = {
    title:'leases',
    cols:[
      {k:'id', label:'Lease', sortable:true, sort:r=>r.id, render:r=>{const g=registrationGate(r); return `<b>${r.id}</b>${g.block?`<div style="font-size:9px;color:#e74c3c;font-weight:600">⚠ REGISTRATION REQUIRED</div>`:''}`;}},
      {k:'unit', label:'Unit', sortable:true, sort:r=>unitLabel(unitById(r.unit)), render:r=>esc(unitLabel(unitById(r.unit)))},
      {k:'tenant', label:'Tenant', sortable:true, sort:r=>tenantById(r.tenant)?.name||'', render:r=>{const t=tenantById(r.tenant); return `${esc(t?t.name:'')}${t&&t.kind==='Corporate'?`<span class="kr-badge">TDS</span>`:''}`;}},
      {k:'rent', label:'Rent', sortable:true, sort:r=>r.rent, render:r=>`${fmt(r.rent)}<div style="font-size:9.5px;color:#8895a7">adv ${fmt(r.advance)}</div>`},
      {k:'term', label:'Term', sortable:true, sort:r=>r.start, render:r=>`<span class="mono">${r.start} → ${r.end}</span>`},
      {k:'months', label:'Length', sortable:true, sort:r=>leaseMonths(r), render:r=>leaseMonths(r)+' mo'},
      {k:'status', label:'Status', sortable:true, sort:r=>r.status, render:r=>badge(r.status)}
    ],
    rows: DB.leases,
    filters:['Active','Pending Registration','Expired','Terminated'],
    filterMatch:(r,f)=>r.status===f,
    search:(r,q)=>((r.id+' '+unitLabel(unitById(r.unit))+' '+(tenantById(r.tenant)?.name||'')).toLowerCase().includes(q)),
    rowClick:r=>`openLeaseDetail('${r.id}')`,
    empty:'No leases match'
  };
  document.getElementById('content').innerHTML =
    pageHeader('Leases', 'TPA 1882 §107 registration gate & PRCA 1991 validations active', `<button class="action-btn primary" onclick="openLeaseForm()">＋ Add Lease</button>`)
    + smartTable('leases', opts);
}
function openLeaseDetail(id){
  const l = leaseById(id); if(!l) return;
  const u = unitById(l.unit); const t = tenantById(l.tenant);
  const g = registrationGate(l);
  const pa = prcaAdvanceFlag(l);
  const pr = prcaRevisionFlag(l);
  const td = tdsFor(l);
  const invs = DB.invoices.filter(v=>v.lease===id);
  const invRows = invs.map(v=>`<tr><td>${v.id}</td><td>${v.month}</td><td>${fmt(v.gross)}</td>${td.rate?`<td>${fmt(v.tds)}</td><td>${fmt(v.net)}</td>`:'<td>—</td><td>—</td>'}<td>${badge(v.status)}</td></tr>`).join('');
  const evict = evictionEligible(l.tenant);
  let h = `<div style="font-size:12px;line-height:1.8">
    <div class="form-grid">
      <div class="form-group"><div class="form-label">Unit</div><div>${esc(unitLabel(u))}</div></div>
      <div class="form-group"><div class="form-label">Tenant</div><div>${esc(t?t.name:'')}${t&&t.nrb?' <span class="kr-badge">NRB</span>':''}</div></div>
      <div class="form-group"><div class="form-label">Rent</div><div>${fmt(l.rent)} / month</div></div>
      <div class="form-group"><div class="form-label">Advance</div><div>${fmt(l.advance)}${l.residential?' (residential)':''}</div></div>
      <div class="form-group"><div class="form-label">Term</div><div class="mono">${l.start} → ${l.end} (${leaseMonths(l)} mo)</div></div>
      <div class="form-group"><div class="form-label">Status</div><div>${badge(l.status)}</div></div>
      ${td.rate?`<div class="form-group"><div class="form-label">TDS (Income Tax Act 2023 ${td.section})</div><div>${(td.rate*100).toFixed(0)}% withheld on invoices</div></div>`:''}
      <div class="form-group"><div class="form-label">Registration</div><div>${l.regMeta?`<span style="color:#27ae60">✓ ${esc(l.regMeta.office)} · ${esc(l.regMeta.deed)} (${l.regMeta.date})</span>`:'<span style="color:#e67e22">Not registered</span>'}</div></div>
    </div>`;
  if(g.block) h += `<div class="compliance-block">${g.msg}</div>`;
  if(pa.flag) h += `<div class="compliance-flag">${pa.msg}</div>`;
  if(pr.flag) h += `<div class="compliance-flag">${pr.msg}</div>`;
  if(evict.eligible) h += `<div class="compliance-block">${evict.msg}</div>`;
  h += `<div style="font-weight:700;margin:12px 0 6px">Invoices</div>`;
  h += invRows ? `<div class="table-wrap"><table class="table-view"><thead><tr><th>Invoice</th><th>Month</th><th>Gross</th>${td.rate?'<th>TDS</th><th>Net</th>':''}<th>Status</th></tr></thead><tbody>${invRows}</tbody></table></div>` : emptyState('No invoices generated');
  h += `</div>`;
  let footer = `<button class="drawer-btn secondary" onclick="closeModal(); openLeaseForm('${l.id}')">Edit</button>`;
  if(g.block) footer += `<button class="drawer-btn primary" onclick="closeModal(); openRegistrationForm('${l.id}')">Upload Registration</button>`;
  else footer += `<button class="drawer-btn primary" onclick="generateInvoiceForLease('${l.id}')">Generate Invoice</button>`;
  openModal('Lease '+l.id, h, footer);
}
function openLeaseForm(id, presetUnit){
  const l = id ? leaseById(id) : null;
  const v = l || {unit:presetUnit||'', tenant:'', start:today(), end:'', rent:'', advance:'', residential:true};
  openModal(l?'Edit Lease':'Add Lease',
    `<div class="form-grid">
      <div class="form-group"><div class="form-label">Unit</div><select class="form-input" id="lf_unit">${DB.units.map(u=>`<option value="${u.id}" ${v.unit===u.id?'selected':''}>${esc(unitLabel(u))}</option>`).join('')}</select></div>
      <div class="form-group"><div class="form-label">Tenant</div><select class="form-input" id="lf_tenant">${DB.tenants.map(t=>`<option value="${t.id}" ${v.tenant===t.id?'selected':''}>${esc(t.name)}${t.kind==='Corporate'?' (TDS)':''}</option>`).join('')}</select></div>
      <div class="form-group"><div class="form-label">Start date</div><input class="form-input" type="date" id="lf_start" value="${v.start}"></div>
      <div class="form-group"><div class="form-label">End date</div><input class="form-input" type="date" id="lf_end" value="${v.end||''}"></div>
      <div class="form-group"><div class="form-label">Monthly rent (৳)</div><input class="form-input" id="lf_rent" value="${v.rent}"></div>
      <div class="form-group"><div class="form-label">Advance (৳)</div><input class="form-input" id="lf_advance" value="${v.advance}"></div>
      <div class="form-group"><div class="form-label">Type</div><select class="form-input" id="lf_res">${[['true','Residential (PRCA 1991 applies)'],['false','Commercial']].map(o=>`<option value="${o[0]}" ${String(v.residential)===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
    </div>
    <div style="font-size:10.5px;color:#8895a7;margin-top:8px;line-height:1.6">⚖️ Terms > 12 months auto-flag <b>Pending Registration</b> (TPA 1882 §107). Residential advance &gt; 1 month rent flagged under PRCA §10/§23.</div>`,
    `<button class="drawer-btn secondary" onclick="closeModal()">Cancel</button><button class="drawer-btn primary" onclick="saveLease('${id||''}')">${l?'Save changes':'Add lease'}</button>`);
}
function saveLease(id){
  const g = x => document.getElementById(x).value;
  const unit = g('lf_unit'), tenant = g('lf_tenant');
  const start = g('lf_start'), end = g('lf_end');
  const rent = Number(g('lf_rent'))||0, advance = Number(g('lf_advance'))||0;
  const residential = g('lf_res')==='true';
  if(!unit||!tenant||!start||!end||!rent){ toast('Unit, tenant, dates and rent are required','error'); return; }
  if(new Date(end) <= new Date(start)){ toast('End date must be after start date','error'); return; }
  const months = Math.round((new Date(end)-new Date(start))/2592000000);
  const data = {unit, tenant, start, end, rent, advance, residential,
    regMeta: id? leaseById(id).regMeta : null,
    status: months>12 ? 'Pending Registration' : 'Active'};
  if(id){ Object.assign(leaseById(id), data); toast('Lease updated','success'); }
  else { DB.leases.push(Object.assign({id:uid('L')}, data)); }
  saveDB(); closeModal(); renderLeases();
  if(months>12){ toast('Lease >12 months — pending registration (TPA §107)','error'); }
  else toast('Lease saved','success');
}
function openRegistrationForm(id){
  const l = leaseById(id);
  openModal('Upload Registration — '+l.id,
    `<div style="font-size:12px;line-height:1.8">
      <div class="compliance-block">TPA 1882 §107 / Registration Act §17(1)(d): a lease &gt; 12 months is invalid unless executed by a registered instrument. Upload sub-registry metadata to activate the financial ledger.</div>
      <div class="form-grid" style="margin-top:10px">
        <div class="form-group"><div class="form-label">Sub-registry office</div><input class="form-input" id="rg_office" placeholder="Sub-Registry Mirpur"></div>
        <div class="form-group"><div class="form-label">Deed no.</div><input class="form-input" id="rg_deed" placeholder="DL-4521/2026"></div>
        <div class="form-group"><div class="form-label">Registration date</div><input class="form-input" type="date" id="rg_date" value="${today()}"></div>
      </div>
    </div>`,
    `<button class="drawer-btn secondary" onclick="closeModal()">Cancel</button><button class="drawer-btn primary" onclick="saveRegistration('${id}')">Verify & Activate</button>`);
}
function saveRegistration(id){
  const g = x => document.getElementById(x).value;
  const office = g('rg_office').trim(), deed = g('rg_deed').trim();
  if(!office||!deed){ toast('Office and deed no. required','error'); return; }
  leaseById(id).regMeta = {office, deed, date:g('rg_date')};
  leaseById(id).status = 'Active';
  saveDB(); closeModal(); renderLeases();
  toast('Registration verified — lease active, ledger enabled','success');
}

// ---------- invoices ----------
function renderInvoices(){
  const opts = {
    title:'invoices',
    cols:[
      {k:'id', label:'Invoice', sortable:true, sort:r=>r.id, render:r=>`<b>${r.id}</b>`},
      {k:'lease', label:'Lease', sortable:true, sort:r=>r.lease, render:r=>`${r.lease}<div style="font-size:9.5px;color:#8895a7">${esc(tenantById(leaseById(r.lease)?.tenant)?.name||'')}</div>`},
      {k:'month', label:'Month', sortable:true, sort:r=>r.month, render:r=>r.month},
      {k:'gross', label:'Gross', sortable:true, sort:r=>r.gross, render:r=>fmt(r.gross)},
      {k:'tds', label:'TDS', sortable:true, sort:r=>r.tds, render:r=>r.tdsRate?`<span class="mono">${fmt(r.tds)}<div style="font-size:9px;color:#8895a7">${(r.tdsRate*100).toFixed(0)}%</div></span>`:'—'},
      {k:'net', label:'Net', sortable:true, sort:r=>r.net, render:r=>`<b>${fmt(r.net)}</b>`},
      {k:'status', label:'Status', sortable:true, sort:r=>r.status, render:r=>badge(r.status)}
    ],
    rows: DB.invoices,
    filters:['Paid','Unpaid','Overdue'],
    filterMatch:(r,f)=>r.status===f,
    search:(r,q)=>((r.id+' '+r.lease+' '+r.month).toLowerCase().includes(q)),
    rowClick:r=>`openInvoiceDetail('${r.id}')`,
    empty:'No invoices match'
  };
  const due = DB.invoices.filter(v=>v.status==='Unpaid'||v.status==='Overdue').reduce((s,v)=>s+v.net,0);
  document.getElementById('content').innerHTML =
    pageHeader('Invoices', 'Rent invoicing with automatic TDS split for corporate tenancies', `<button class="action-btn primary" onclick="openInvoiceForm()">＋ Generate Invoice</button>`)
    + statCards([
        ['Outstanding (net)', fmt(due), '#e67e22', DB.invoices.filter(v=>v.status==='Overdue').length+' overdue'],
        ['Invoices', DB.invoices.length, '#2F80ED', ''],
        ['TDS withheld total', fmt(DB.invoices.reduce((s,v)=>s+v.tds,0)), '#9b59b6', '']
      ])
    + smartTable('invoices', opts);
}
function openInvoiceForm(){
  const ls = DB.leases.filter(l=>l.status==='Active'||l.status==='Pending Registration');
  openModal('Generate Invoice',
    `<div class="form-grid">
      <div class="form-group"><div class="form-label">Lease</div><select class="form-input" id="inv_lease">${ls.map(l=>`<option value="${l.id}">${l.id} · ${esc(tenantById(l.tenant)?.name||'')} · ${fmt(l.rent)}</option>`).join('')}</select></div>
      <div class="form-group"><div class="form-label">Billing month</div><input class="form-input" type="month" id="inv_month" value="${today().slice(0,7)}"></div>
    </div>
    <div id="invPreview" style="font-size:11px;color:#667;margin-top:8px"></div>`,
    `<button class="drawer-btn secondary" onclick="closeModal()">Cancel</button><button class="drawer-btn primary" onclick="generateInvoiceFromForm()">Generate</button>`);
  document.getElementById('inv_lease') && document.getElementById('inv_lease').addEventListener('change', updateInvPreview);
  updateInvPreview();
}
function updateInvPreview(){
  const l = leaseById(document.getElementById('inv_lease').value);
  if(!l) return;
  const td = tdsFor(l);
  const gross = l.rent, tds = Math.round(gross*td.rate), net = gross - tds;
  document.getElementById('invPreview').innerHTML = td.rate
    ? `TDS split preview: Gross <b>${fmt(gross)}</b> − TDS ${(td.rate*100).toFixed(0)}% (${fmt(tds)}, Income Tax Act 2023 ${td.section}) = Net <b>${fmt(net)}</b> payable to landlord.`
    : `Individual tenant — no TDS. Gross = Net = <b>${fmt(gross)}</b>.`;
}
function generateInvoiceFromForm(){
  const l = leaseById(document.getElementById('inv_lease').value);
  const month = document.getElementById('inv_month').value;
  if(!l||!month) return;
  if(DB.invoices.some(v=>v.lease===l.id && v.month===month)){ toast('Invoice already exists for this month','error'); return; }
  const td = tdsFor(l);
  const gross = l.rent, tds = Math.round(gross*td.rate), net = gross - tds;
  DB.invoices.push({id:'INV-2026-'+String(DB.invoices.length+1).padStart(3,'0'), lease:l.id, month, gross, tdsRate:td.rate, tds, net, status:'Unpaid'});
  saveDB(); closeModal(); renderInvoices(); toast('Invoice generated with TDS split','success');
}
function generateInvoiceForLease(leaseId){
  const l = leaseById(leaseId);
  const month = today().slice(0,7);
  if(DB.invoices.some(v=>v.lease===leaseId && v.month===month)){ toast('Invoice for this month already exists','error'); return; }
  const td = tdsFor(l);
  const gross = l.rent, tds = Math.round(gross*td.rate), net = gross - tds;
  DB.invoices.push({id:'INV-2026-'+String(DB.invoices.length+1).padStart(3,'0'), lease:leaseId, month, gross, tdsRate:td.rate, tds, net, status:'Unpaid'});
  saveDB(); renderInvoices(); toast('Invoice generated','success');
}
function openInvoiceDetail(id){
  const v = DB.invoices.find(x=>x.id===id); if(!v) return;
  const l = leaseById(v.lease);
  const td = tdsFor(l);
  openModal('Invoice '+v.id,
    `<div style="font-size:12px;line-height:1.8">
      <div class="form-grid">
        <div class="form-group"><div class="form-label">Lease</div><div>${l.id} · ${esc(unitLabel(unitById(l.unit)))}</div></div>
        <div class="form-group"><div class="form-label">Tenant</div><div>${esc(tenantById(l.tenant)?.name||'')}</div></div>
        <div class="form-group"><div class="form-label">Month</div><div>${v.month}</div></div>
        <div class="form-group"><div class="form-label">Status</div><div>${badge(v.status)}</div></div>
      </div>
      <div class="tax-step"><div class="ts-idx">1</div><div>Gross rent: <b>${fmt(v.gross)}</b></div></div>
      ${v.tdsRate?`<div class="tax-step"><div class="ts-idx">2</div><div>TDS withheld (${(v.tdsRate*100).toFixed(0)}% · Income Tax Act 2023 ${td.section}): <b>− ${fmt(v.tds)}</b> — remitted to NBR by tenant</div></div>
      <div class="tax-step"><div class="ts-idx">3</div><div>Net payable to landlord: <b>${fmt(v.net)}</b></div></div>`:''}
      <div style="margin-top:10px;font-size:10.5px;color:#8895a7">Payment clears → cryptographic rent receipt auto-generated (PRCA §13).</div>
    </div>`,
    v.status==='Paid'
      ? `<button class="drawer-btn primary" onclick="closeModal(); nav('receipts')">View Receipt</button>`
      : `<button class="drawer-btn secondary" onclick="closeModal()">Close</button><button class="drawer-btn primary" onclick="payInvoice('${v.id}')">💳 Pay (bKash sandbox)</button>`);
}
function payInvoice(id){
  const v = DB.invoices.find(x=>x.id===id); if(!v) return;
  openModal('Pay '+id+' — bKash Tokenized Checkout',
    `<div class="flow-4">
      <div class="flow-step ok"><div class="fs-n">1 · Grant</div>id_token issued</div>
      <div class="flow-step ok"><div class="fs-n">2 · Create</div>session created · ${v.id}</div>
      <div class="flow-step"><div class="fs-n">3 · Execute</div>waiting PIN/OTP…</div>
      <div class="flow-step"><div class="fs-n">4 · Query</div>fallback status</div>
    </div>
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:26px;font-weight:800;color:#e2136e">${fmt(v.net)}</div>
      <div style="font-size:10.5px;color:#8895a7;margin:2px 0 10px">bKash Sandbox · merchantInvoiceNumber: ${id}</div>
      <input class="form-input" id="pay_otp" placeholder="Demo: type any 6-digit OTP" style="max-width:220px;margin:0 auto;display:block;text-align:center">
    </div>
    <div class="compliance-flag">Sandbox mode — live requires BKASH_APP_KEY/SECRET + PAYMENT_MODE=live.</div>`,
    `<button class="drawer-btn secondary" onclick="closeModal()">Cancel</button><button class="drawer-btn primary" onclick="executePayment('${v.id}')">Execute Payment</button>`);
}
function executePayment(id){
  const v = DB.invoices.find(x=>x.id===id); if(!v) return;
  v.status = 'Paid';
  const receipt = {id:'RCP-'+String(DB.receipts.length+1).padStart(4,'0'), invoice:id, amount:v.net, date:today(), method:'bKash', sig:'SIG-'+Math.random().toString(16).slice(2,10)};
  DB.receipts.push(receipt);
  DB.payments.push({id:'PAY-'+String(DB.payments.length+1).padStart(3,'0'), invoice:id, amount:v.net, method:'bKash', ref:'BK-'+Math.random().toString(16).slice(2,6), date:today(), status:'Success'});
  saveDB(); closeModal(); renderInvoices();
  toast('Payment executed — signed receipt '+receipt.id+' issued (PRCA §13)','success');
}

// ---------- receipts ----------
function renderReceipts(){
  const opts = {
    title:'receipts',
    cols:[
      {k:'id', label:'Receipt', sortable:true, sort:r=>r.id, render:r=>`<b>${r.id}</b>`},
      {k:'inv', label:'Invoice', sortable:true, sort:r=>r.invoice, render:r=>r.invoice},
      {k:'tenant', label:'Tenant', sortable:true, sort:r=>tenantById(leaseById(DB.invoices.find(x=>x.id===r.invoice)?.lease)?.tenant)?.name||'', render:r=>esc(tenantById(leaseById(DB.invoices.find(x=>x.id===r.invoice)?.lease)?.tenant)?.name||'')},
      {k:'amt', label:'Amount', sortable:true, sort:r=>r.amount, render:r=>fmt(r.amount)},
      {k:'method', label:'Method', sortable:true, sort:r=>r.method, render:r=>r.method},
      {k:'date', label:'Date', sortable:true, sort:r=>r.date, render:r=>r.date},
      {k:'sig', label:'Signature', sortable:false, render:r=>`<span class="mono">${r.sig}</span>`},
      {k:'act', label:'', sortable:false, render:r=>`<button class="mini-btn" onclick="event.stopPropagation(); printReceipt('${r.id}')">🖨 Print</button>`}
    ],
    rows: DB.receipts,
    filters:[],
    filterMatch:(r,f)=>true,
    search:(r,q)=>((r.id+' '+r.invoice+' '+r.method+' '+r.sig).toLowerCase().includes(q)),
    empty:'No receipts yet — pay an invoice to auto-generate one (PRCA §13)'
  };
  document.getElementById('content').innerHTML =
    pageHeader('Receipts', 'Cryptographically signed digital rent receipts — PRCA 1991 §13', '')
    + smartTable('receipts', opts);
}
function printReceipt(id){
  const r = DB.receipts.find(x=>x.id===id); if(!r) return;
  const v = DB.invoices.find(x=>x.id===r.invoice); const l = leaseById(v?.lease);
  const t = tenantById(l?.tenant); const u = unitById(l?.unit);
  const win = window.open('','_blank');
  win.document.write(`<html><head><title>${r.id}</title><style>body{font-family:Arial,sans-serif;padding:30px;max-width:640px;margin:auto;color:#222}h1{font-size:22px;margin:0 0 2px}hr{border:none;border-top:2px solid #2F80ED;margin:14px 0}.row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}.sig{font-family:monospace;font-size:11px;color:#888;margin-top:18px}.stamp{border:2px solid #2F80ED;color:#2F80ED;display:inline-block;padding:4px 14px;border-radius:6px;font-weight:700;margin-top:14px}</style></head><body>
    <h1>KRTaker — Rent Receipt</h1>
    <div style="font-size:11px;color:#888">Key Responsibility Taker · digitally signed per PRCA 1991 §13</div><hr>
    <div class="row"><span>Receipt no.</span><b>${r.id}</b></div>
    <div class="row"><span>Invoice</span><b>${r.invoice}</b></div>
    <div class="row"><span>Tenant</span><b>${esc(t?.name||'')}</b></div>
    <div class="row"><span>Property / Unit</span><b>${esc(unitLabel(u))}</b></div>
    <div class="row"><span>Amount received</span><b>${fmt(r.amount)}</b></div>
    <div class="row"><span>Method</span><b>${r.method}</b></div>
    <div class="row"><span>Date</span><b>${r.date}</b></div>
    <div class="stamp">PAID · KRTaker</div>
    <div class="sig">Signature: ${r.sig}<br>Generated: ${new Date().toISOString()} · KRTaker v2.0</div>
  </body></html>`);
  win.document.close(); win.focus();
}

// ---------- maintenance ----------
function renderMaintenance(){
  const opts = {
    title:'tickets',
    cols:[
      {k:'id', label:'Ticket', sortable:true, sort:r=>r.id, render:r=>`<b>${r.id}</b>`},
      {k:'unit', label:'Unit', sortable:true, sort:r=>unitLabel(unitById(r.unit)), render:r=>esc(unitLabel(unitById(r.unit)))},
      {k:'desc', label:'Issue', sortable:false, render:r=>`<span style="max-width:220px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.desc)}</span>`},
      {k:'liab', label:'Liability', sortable:true, sort:r=>r.liability, render:r=>badge(r.liability)},
      {k:'status', label:'Status', sortable:true, sort:r=>r.status, render:r=>badge(r.status)},
      {k:'contractor', label:'Contractor', sortable:false, render:r=>r.contractor?esc(r.contractor):'—'},
      {k:'cost', label:'Cost', sortable:true, sort:r=>r.cost, render:r=>r.cost?fmt(r.cost):'—'},
      {k:'act', label:'', sortable:false, render:r=>`<button class="mini-btn" onclick="event.stopPropagation(); openTicketDetail('${r.id}')">View</button>`}
    ],
    rows: DB.tickets,
    filters:['Open','In Progress','Awaiting Payment','Closed'],
    filterMatch:(r,f)=>r.status===f,
    search:(r,q)=>((r.id+' '+r.desc+' '+r.contractor+' '+unitLabel(unitById(r.unit))).toLowerCase().includes(q)),
    empty:'No tickets match'
  };
  document.getElementById('content').innerHTML =
    pageHeader('Maintenance', 'Liability auto-resolved (landlord structural / tenant day-to-day)', `<button class="action-btn primary" onclick="openTicketForm()">＋ Report Issue</button>`)
    + smartTable('maintenance', opts);
}
function resolveLiability(unitId, desc){
  const u = unitById(unitId); const p = propertyById(u?.property);
  const d = (desc||'').toLowerCase();
  const structural = /roof|structure|crack|wall|foundation|pump|electrical|plumbing main|common line|sewage|drain/i;
  const daily = /leak|bulb|clean|door lock|faucet|switch|fixture/i;
  if(structural.test(d) || p?.type==='Industrial' && /flooring|shed/.test(d)) return 'Landlord';
  if(daily.test(d)) return 'Tenant';
  return 'Landlord';
}
function openTicketForm(){
  openModal('Report Maintenance Issue',
    `<div class="form-grid">
      <div class="form-group"><div class="form-label">Unit</div><select class="form-input" id="tk_unit">${DB.units.map(u=>`<option value="${u.id}">${esc(unitLabel(u))}</option>`).join('')}</select></div>
      <div class="form-group"><div class="form-label">Issue description</div><input class="form-input" id="tk_desc" placeholder="e.g. Roof structural crack"></div>
      <div class="form-group"><div class="form-label">Contractor (optional)</div><input class="form-input" id="tk_contractor"></div>
    </div>
    <div id="tkLiab" style="font-size:11px;color:#2F80ED;margin-top:8px"></div>`,
    `<button class="drawer-btn secondary" onclick="closeModal()">Cancel</button><button class="drawer-btn primary" onclick="saveTicket()">Create ticket</button>`);
  const upd = ()=>{ const u=document.getElementById('tk_unit').value, d=document.getElementById('tk_desc').value;
    if(u) document.getElementById('tkLiab').textContent = 'AI liability resolver → '+resolveLiability(u,d)+' responsibility (from lease/PRCA default)'; };
  document.getElementById('tk_unit').addEventListener('change', upd);
  document.getElementById('tk_desc').addEventListener('input', upd);
  upd();
}
function saveTicket(){
  const g = x => document.getElementById(x).value;
  const unit = g('tk_unit'), desc = g('tk_desc').trim();
  if(!desc){ toast('Describe the issue','error'); return; }
  DB.tickets.push({id:uid('MT'), unit, desc, reported:today(), liability:resolveLiability(unit,desc), status:'Open', contractor:g('tk_contractor').trim(), cost:0, note:''});
  saveDB(); closeModal(); renderMaintenance(); toast('Ticket created — liability: '+resolveLiability(unit,desc),'success');
}
function openTicketDetail(id){
  const t = DB.tickets.find(x=>x.id===id); if(!t) return;
  const u = unitById(t.unit);
  openModal(t.id+' · '+esc(t.desc),
    `<div style="font-size:12px;line-height:1.8">
      <div class="form-grid">
        <div class="form-group"><div class="form-label">Unit</div><div>${esc(unitLabel(u))}</div></div>
        <div class="form-group"><div class="form-label">Reported</div><div>${t.reported}</div></div>
        <div class="form-group"><div class="form-label">Liability</div><div>${badge(t.liability)}</div></div>
        <div class="form-group"><div class="form-label">Status</div><div>${badge(t.status)}</div></div>
        <div class="form-group"><div class="form-label">Contractor</div><div>${t.contractor||'—'}</div></div>
        <div class="form-group"><div class="form-label">Cost</div><div>${t.cost?fmt(t.cost):'—'}</div></div>
      </div>
      ${t.liability==='Landlord' && t.status==='Open' ? `<div class="compliance-flag">Tenant may deduct repair cost from rent if landlord neglects this structural ticket (PRCA 1991 — validated contractor invoices required).</div>`:''}
      ${t.liability==='Tenant' ? `<div class="compliance-flag">Day-to-day care is tenant responsibility (PRCA 1991). Cost recovery from tenant security deposit if unresolved.</div>`:''}
    </div>`,
    `<button class="drawer-btn secondary" onclick="closeModal()">Close</button>
     <button class="drawer-btn primary" onclick="closeModal(); markTicketDone('${t.id}')">Mark Resolved</button>`);
}
function markTicketDone(id){ const t=DB.tickets.find(x=>x.id===id); t.status='Closed'; t.note='Resolved'; saveDB(); renderMaintenance(); toast('Ticket closed','success'); }
