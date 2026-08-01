/* KRTaker landing — interactive calculators (holding tax, TDS, rent yield) */
(function () {
  const dict = () => (window.KR_I18N && KR_I18N[krLang()]) || {};
  const fmt = (n) => '৳' + Math.round(n).toLocaleString('en-IN');
  const fmtPct = (n) => (Math.round(n * 10) / 10).toFixed(1) + '%';

  function resultBox(rows, big) {
    const d = dict();
    const t = (k) => d[k] || k;
    return `<div class="res-head">${t('tools.res.title')}</div>` + rows.map((r, i) =>
      `<div class="res-row${big === i ? ' res-big' : ''}"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
  }

  // ---- Holding tax ----
  const ht = () => {
    const gar = parseFloat(document.getElementById('htGar').value) || 0;
    const mort = (parseFloat(document.getElementById('htMort').value) || 0) * 12;
    const rate = parseFloat(document.getElementById('htRate').value) || 8;
    if (gar <= 0) { document.getElementById('htResult').innerHTML = '<p class="res-empty">—</p>'; return; }
    const allow = gar * (2 / 12);            // 2-month repair/maintenance allowance ≈16.67%
    const nav = Math.max(0, gar - allow - mort);
    const tax = nav * rate / 100;
    const d = dict();
    document.getElementById('htResult').innerHTML = resultBox([
      [d['tools.res.gar'] || 'Gross Annual Rent', fmt(gar)],
      [d['tools.res.allow'] || '2-month allowance (16.67%)', '− ' + fmt(allow)],
      [d['tools.res.mort'] || 'Mortgage interest (annual)', '− ' + fmt(mort)],
      [d['tools.res.nav'] || 'Net Annual Value', fmt(nav)],
      [d['tools.res.rate'] || 'City corporation rate', rate + '%'],
      [d['tools.res.ht'] || 'Holding tax', fmt(tax), ],
    ], 5);
  };
  const htBtn = document.getElementById('htCalc');
  if (htBtn) htBtn.addEventListener('click', ht);

  // ---- TDS ----
  const tds = () => {
    const rent = parseFloat(document.getElementById('tdsRent').value) || 0;
    const rate = parseFloat(document.querySelector('input[name=tdsType]:checked').value) || 0.10;
    if (rent <= 0) { document.getElementById('tdsResult').innerHTML = '<p class="res-empty">—</p>'; return; }
    const tdsM = rent * rate, netM = rent - tdsM;
    const d = dict();
    document.getElementById('tdsResult').innerHTML = resultBox([
      [d['tools.res.rentM'] || 'Monthly rent', fmt(rent)],
      [d['tools.res.tdsM'] || 'TDS withheld/month', fmt(tdsM)],
      [d['tools.res.netM'] || 'Net payable to owner', fmt(netM)],
      [d['tools.res.tdsY'] || 'TDS withheld/year', fmt(tdsM * 12)],
      [d['tools.res.rate'] || 'Withholding rate', (rate * 100) + '%'],
    ], 1);
  };
  const tdsBtn = document.getElementById('tdsCalc');
  if (tdsBtn) tdsBtn.addEventListener('click', tds);
  document.querySelectorAll('input[name=tdsType]').forEach(r => r.addEventListener('change', tds));

  // ---- Rent yield ----
  const yl = () => {
    const val = parseFloat(document.getElementById('ylValue').value) || 0;
    const rent = parseFloat(document.getElementById('ylRent').value) || 0;
    const htM = parseFloat(document.getElementById('ylHt').value) || 0;
    const tdsM = parseFloat(document.getElementById('ylTds').value) || 0;
    if (val <= 0 || rent <= 0) { document.getElementById('ylResult').innerHTML = '<p class="res-empty">—</p>'; return; }
    const annual = rent * 12, gross = annual / val * 100;
    const netAnnual = annual - (htM + tdsM) * 12;
    const net = Math.max(0, netAnnual) / val * 100;
    const d = dict();
    document.getElementById('ylResult').innerHTML = resultBox([
      [d['tools.res.annualRent'] || 'Annual rent', fmt(annual)],
      [d['tools.res.grossY'] || 'Gross yield', fmtPct(gross)],
      [d['tools.res.costsY'] || 'Holding tax + TDS / year', '− ' + fmt((htM + tdsM) * 12)],
      [d['tools.res.netY'] || 'Net yield', fmtPct(net)],
      [d['tools.res.payback'] || 'Payback period', (val / Math.max(1, netAnnual)).toFixed(0) + ' yrs'],
    ], 3);
  };
  const ylBtn = document.getElementById('ylCalc');
  if (ylBtn) ylBtn.addEventListener('click', yl);

  // live recalc on Enter
  document.querySelectorAll('.calc-card input').forEach(inp => {
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const b = inp.closest('.calc-card').querySelector('.btn'); if (b) b.click(); } });
  });
})();
