/* KRTaker landing — register wizard (multi-step + OTP via landing API) */
(function () {
  const API = '../api/';
  let state = { plan: 'Starter', bill: 'monthly', role: 'owner', email: '', timer: null, resendIn: 0 };

  const $ = (id) => document.getElementById(id);
  const steps = ['pane1', 'pane2', 'pane3', 'pane4', 'pane5'];
  const dict = () => (window.KR_I18N ? (KR_I18N[krLang()] || KR_I18N.en) : null);

  function go(n) {
    steps.forEach((p, i) => $(p).classList.toggle('active', i === n - 1));
    [1, 2, 3, 4, 5].forEach(i => {
      const seg = $('seg' + i), lab = $('lab' + i);
      seg.className = 'seg' + (i < n ? ' done' : i === n ? ' cur' : '');
      lab.classList.toggle('cur', i === n);
    });
    if (n === 1) $('rName').focus();
  }

  // Billing toggle → update prices
  const PRICES = { Starter: [5000, 48000], Business: [15000, 144000], Enterprise: [45000, 432000] };
  function renderPrices() {
    document.querySelectorAll('.plan-card').forEach(card => {
      const [mo, yr] = PRICES[card.dataset.plan];
      const v = state.bill === 'monthly' ? mo : Math.round(yr / 12);
      const per = state.bill === 'monthly' ? (dict() ? dict()['pricing.permo'] : '/mo') : (dict() ? dict()['pricing.peryr'] : '/yr');
      const el = card.querySelector('[data-price]');
      el.innerHTML = '৳' + v.toLocaleString('en-IN') + '<span>' + per + '</span>';
    });
  }
  $('billMonthly').addEventListener('click', () => { state.bill = 'monthly'; $('billMonthly').classList.add('on'); $('billAnnual').classList.remove('on'); renderPrices(); });
  $('billAnnual').addEventListener('click', () => { state.bill = 'annual'; $('billAnnual').classList.add('on'); $('billMonthly').classList.remove('on'); renderPrices(); });

  // Plan + role selection
  document.querySelectorAll('.plan-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.plan = card.dataset.plan;
    });
  });
  document.querySelectorAll('.role-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.role-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.role = opt.dataset.role;
    });
  });

  // Navigation
  $('goStep2').addEventListener('click', () => go(2));
  $('backTo1').addEventListener('click', () => go(1));
  $('goStep3').addEventListener('click', () => go(3));
  $('backTo2').addEventListener('click', () => go(2));
  $('backTo3').addEventListener('click', () => go(3));

  // Account submit → register API
  $('acctForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = dict() || {};
    const name = $('rName').value.trim(), email = $('rEmail').value.trim().toLowerCase(), pass = $('rPass').value;
    let ok = true;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $('errEmail').classList.add('show'); ok = false; } else $('errEmail').classList.remove('show');
    if (pass.length < 6) { $('errPass').classList.add('show'); ok = false; } else $('errPass').classList.remove('show');
    if (!ok) return;

    const btn = $('regSubmit');
    btn.disabled = true; btn.textContent = d['reg.working'] || 'Please wait…';
    try {
      const res = await fetch(API + 'register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, org: $('rOrg').value.trim(), email, phone: $('rPhone').value.trim(), role: state.role, plan: state.plan })
      });
      const data = await res.json();
      if (data.ok) {
        state.email = email;
        $('otpEmail').textContent = email;
        startTimer(60);
        go(4);
        $('otpRow').querySelector('input').focus();
      } else {
        krToast(data.error || (d['reg.err.server'] || 'Something went wrong.'));
      }
    } catch (err) {
      krToast(d['reg.err.server'] || 'Network error — please try again.');
    }
    btn.disabled = false; btn.textContent = d['reg.next'] || 'Continue';
  });

  // OTP inputs: auto-advance + paste
  const otpInputs = () => Array.from($('otpRow').querySelectorAll('input'));
  otpInputs().forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '');
      if (inp.value && i < 5) otpInputs()[i + 1].focus();
      $('errOtp').classList.remove('show');
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inp.value && i > 0) otpInputs()[i - 1].focus();
    });
    inp.addEventListener('paste', (e) => {
      const txt = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (txt) { otpInputs().forEach((o, j) => { o.value = txt[j] || ''; }); otpInputs()[Math.min(txt.length, 5)].focus(); e.preventDefault(); }
    });
  });

  function startTimer(secs) {
    state.resendIn = secs;
    clearInterval(state.timer);
    const render = () => {
      if (state.resendIn <= 0) {
        $('otpTimer').innerHTML = '<a id="otpResend" data-i18n="reg.otpResend">' + (dict() ? dict()['reg.otpResend'] : 'Resend code') + '</a>';
        const rl = $('otpResend');
        if (rl) rl.addEventListener('click', resendOtp);
        clearInterval(state.timer);
      } else {
        $('otpTimer').textContent = state.resendIn + 's · ';
        const a = document.createElement('a'); a.id = 'otpResend'; a.dataset.i18n = 'reg.otpResend';
        a.textContent = dict() ? dict()['reg.otpResend'] : 'Resend code';
        a.addEventListener('click', resendOtp);
        $('otpTimer').appendChild(a);
      }
    };
    render();
    state.timer = setInterval(() => { state.resendIn--; render(); }, 1000);
  }

  async function resendOtp() {
    try {
      const res = await fetch(API + 'resend-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: state.email }) });
      const data = await res.json();
      if (data.ok) { startTimer(60); krToast(dict() ? dict()['reg.otpSent'] : 'Code sent ✓'); }
      else krToast(data.error || 'Try again.');
    } catch (e) { krToast('Network error.'); }
  }

  $('otpVerify').addEventListener('click', async () => {
    const code = otpInputs().map(i => i.value).join('');
    if (code.length !== 6) { $('errOtp').classList.add('show'); return; }
    const btn = $('otpVerify');
    btn.disabled = true; btn.textContent = (dict() && dict()['reg.working']) || 'Please wait…';
    try {
      const res = await fetch(API + 'verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: state.email, otp: code }) });
      const data = await res.json();
      if (data.ok) {
        $('trialNote').textContent = (dict() ? dict()['reg.successSub'] : '') + ' ' + (data.trial_end || '');
        go(5);
      } else {
        $('errOtp').classList.add('show');
        otpInputs().forEach(i => { i.value = ''; });
        otpInputs()[0].focus();
      }
    } catch (e) { $('errOtp').classList.add('show'); }
    btn.disabled = false; btn.textContent = (dict() && dict()['reg.otpBtn']) || 'Verify & activate trial';
  });

  // Re-render dynamic bits on language switch
  document.addEventListener('kri18n', () => { renderPrices(); });
})();
