/* KRTaker landing — AI chat widget (KR assistant).
   Knowledge-base bot: bilingual EN/BN, keyword matching.
   Phase 5: swap kbAnswer() for a DeepSeek API call. */
(function () {
  'use strict';

  // ── Knowledge base (EN + BN) ─────────────────────────────
  const KB = [
    {
      k: ['price', 'pricing', 'plan', 'cost', 'trial', 'fee', 'subscription', 'মূল্য', 'প্ল্যান', 'খরচ', 'ট্রায়াল', 'কত টাকা'],
      a: {
        en: 'KRTaker has 3 plans:\n• Starter — ৳5,000/mo: up to 10 units, leases, invoices, TDS & holding tax\n• Business — ৳15,000/mo: up to 50 units + maintenance, payments (bKash/Nagad), reports\n• Enterprise — ৳45,000/mo: unlimited units + AI caretaker, legal & compliance suite\nEvery plan starts with a free 14-day trial — no card required.',
        bn: 'কেআরটেকারের ৩টি প্ল্যান:\n• স্টার্টার — ৳৫,০০০/মাস: ১০টি ইউনিট, লিজ, ইনভয়েস, টিডিএস ও হোল্ডিং ট্যাক্স\n• বিজনেস — ৳১৫,০০০/মাস: ৫০টি ইউনিট + মেইনটেন্যান্স, পেমেন্ট (বিকাশ/নগদ), রিপোর্ট\n• এন্টারপ্রাইজ — ৳৪৫,০০০/মাস: আনলিমিটেড ইউনিট + এআই কেয়ারটেকার, আইনি ও কমপ্লায়েন্স স্যুট\nপ্রতিটি প্ল্যানে ১৪ দিনের ফ্রি ট্রায়াল — কোনো কার্ড লাগবে না।'
      }
    },
    {
      k: ['register', 'signup', 'sign up', 'create account', 'account', 'start', 'নিবন্ধন', 'রেজিস্টার', 'অ্যাকাউন্ট', 'শুরু'],
      a: {
        en: 'Registration takes ~2 minutes:\n1. Pick your plan\n2. Choose your role (Owner / Service Partner / Legal Firm / Tenant)\n3. Enter your email — we send a one-time OTP code\n4. Verify and you are in!\nYour 14-day free trial starts immediately. Click "Get started" in the top bar.',
        bn: 'রেজিস্ট্রেশন করতে প্রায় ২ মিনিট লাগে:\n১. প্ল্যান বাছাই করুন\n২. রোল নির্বাচন করুন (মালিক / সার্ভিস পার্টনার / লিগ্যাল ফার্ম / ভাড়াটিয়া)\n৩. ইমেইল দিন — আমরা ওটিপি কোড পাঠাব\n৪. ভেরিফাই করুন — সম্পন্ন!\nআপনার ১৪ দিনের ফ্রি ট্রায়াল সাথে সাথেই শুরু হয়। উপরের "শুরু করুন" বাটনে ক্লিক করুন।'
      }
    },
    {
      k: ['holding tax', 'property tax', 'nav', 'city corporation', 'assessment', 'হোল্ডিং ট্যাক্স', 'প্রপার্টি ট্যাক্স', 'সিটি কর্পোরেশন'],
      a: {
        en: 'Holding tax is calculated from Net Annual Value (NAV):\nGross Annual Rent → − 2-month maintenance allowance (≈16.67%) → − mortgage interest → NAV.\nCity corporations then apply their rate (e.g. 8% in Dhaka North).\nTry our calculator: /landing/tools.html — it walks you through each step. And check our blog post "Holding tax in 4 steps" for a worked example.',
        bn: 'হোল্ডিং ট্যাক্স নেট বার্ষিক মূল্য (NAV) থেকে হিসাব করা হয়:\nমোট বার্ষিক ভাড়া → − ২ মাসের রক্ষণাবেক্ষণ ভাতা (≈১৬.৬৭%) → − বন্ধকী সুদ → NAV।\nতারপর সিটি কর্পোরেশন তাদের হার প্রয়োগ করে (যেমন ঢাকা উত্তরে ৮%)।\nআমাদের ক্যালকুলেটর দেখুন: /landing/tools.html — প্রতিটি ধাপে গাইড করবে। কাজের উদাহরণের জন্য ব্লগ পোস্ট "হোল্ডিং ট্যাক্স ইন ৪ স্টেপস" দেখুন।'
      }
    },
    {
      k: ['tds', 'tax deducted', 'withholding', 'section 128', 'section 109', 'টিডিএস'],
      a: {
        en: 'TDS (Tax Deducted at Source) on rent under the Income Tax Act 2023:\n• Commercial rent — 4% deducted by the tenant (§128)\n• Residential rent — 10% when annual rent exceeds ৳36,00,000 (§109)\nThe tenant deposits it and gives the landlord a certificate. KRTaker generates the exact monthly figures per tenant automatically. Use the TDS calculator at /landing/tools.html.',
        bn: 'আয়কর আইন ২০২৩ অনুযায়ী ভাড়ার টিডিএস (উৎসে কর কর্তন):\n• বাণিজ্যিক ভাড়া — ভাড়াটিয়া ৪% কর্তন করে (§১২৮)\n• আবাসিক ভাড়া — বার্ষিক ভাড়া ৳৩৬,০০,০০০-এর বেশি হলে ১০% (§১০৯)\nভাড়াটিয়া জমা দেয় এবং মালিককে সার্টিফিকেট দেয়। কেআরটেকার প্রতি ভাড়াটিয়ার জন্য মাসিক সঠিক হিসাব অটো তৈরি করে। ক্যালকুলেটর: /landing/tools.html'
      }
    },
    {
      k: ['lease', 'agreement', 'registration act', 'tpa', '107', 'register lease', 'লিজ', 'চুক্তি', 'রেজিস্ট্রেশন'],
      a: {
        en: 'Under the Transfer of Property Act 1882 (§107) + Registration Act 1908 (§17(1)(d)), a lease for MORE than 12 months is invalid unless registered. That means your 2-year lease may be legally invisible!\nKRTaker flags registration requirements per lease and tracks renewals automatically. Read more: "Why your 2-year lease is legally invisible" on our blog.',
        bn: 'স্থাবর সম্পত্তি হস্তান্তর আইন ১৮৮২ (§১০৭) + রেজিস্ট্রেশন আইন ১৯০৮ (§১৭(১)(ঘ)) অনুযায়ী, ১২ মাসের বেশি সময়ের লিজ রেজিস্ট্রি না করলে অবৈধ। অর্থাৎ আপনার ২ বছরের লিজ আইনত অদৃশ্য হতে পারে!\nকেআরটেকার প্রতি লিজের রেজিস্ট্রেশন প্রয়োজনীয়তা চিহ্নিত করে এবং রিনিউয়াল ট্র্যাক করে। বিস্তারিত: আমাদের ব্লগে "হোয়াই ইউর ২-ইয়ার লিজ ইজ লিগ্যালি ইনভিজিবল"।'
      }
    },
    {
      k: ['eviction', 'prca', 'tenant evict', 'rent control', 'evict', 'উচ্ছেদ', 'ভাড়াটিয়া সরানো'],
      a: {
        en: 'Eviction in Bangladesh is governed by the Premises Rent Control Act 1991. Key points:\n• Grounds: 2+ months arrears, subletting without consent, material breach, bona fide owner requirement\n• A written 30-day notice must be served and COMPLETE before any suit\n• Only a Rent Controller\'s order authorizes eviction — self-help (changing locks, cutting utilities) is illegal\nTimeline: notice → petition → hearing → decree (~4–9 months). KRTaker flags arrears at the 2-month threshold and generates the demand notice. Full walkthrough: /landing/blog-eviction.html',
        bn: 'বাংলাদেশে উচ্ছেদ প্রিমাইসেস রেন্ট কন্ট্রোল অ্যাক্ট ১৯৯১ দ্বারা নিয়ন্ত্রিত। মূল বিষয়:\n• ভিত্তি: ২+ মাস বকেয়া, অনুমতি ছাড়া সাবলেট, চুক্তি ভঙ্গ, মালিকের প্রকৃত প্রয়োজন\n• লিখিত ৩০ দিনের নোটিশ দিতে হবে এবং মামলার আগে তা সম্পূর্ণ হতে হবে\n• শুধুমাত্র রেন্ট কন্ট্রোলারের আদেশে উচ্ছেদ বৈধ — নিজে উদ্যোগ (তালা বদল, ইউটিলিটি কাটা) বেআইনি\nসময়রেখা: নোটিশ → পিটিশন → শুনানি → ডিক্রি (~৪-৯ মাস)। কেআরটেকার ২ মাস বকেয়ার থ্রেশহোল্ডে ফ্ল্যাগ করে এবং ডিমান্ড নোটিশ তৈরি করে। বিস্তারিত: /landing/blog-eviction.html'
      }
    },
    {
      k: ['nrb', 'non-resident', 'nita', 'remittance', 'repatriat', 'abroad', 'dubai', 'এনআরবি', 'রেমিট্যান্স', 'বিদেশ', 'দুবাই'],
      a: {
        en: 'For NRB investors: rental income can be repatriated legally through a Non-Resident Investor\'s Taka Account (NITA). Key steps:\n• Route money through NITA (not friends/hundi) for a clean trail\n• File annual returns showing the income\n• Keep deeds, encumbrance certificates and NITA records per property\nKRTaker stores your compliance dossier per property and tracks rent against NITA credits — so remittances don\'t get stuck at the bank. See our NRB guide + case studies for real examples.',
        bn: 'এনআরবি বিনিয়োগকারীদের জন্য: নন-রেসিডেন্ট ইনভেস্টরস টাকা অ্যাকাউন্ট (নিটা)-এর মাধ্যমে ভাড়ার আয় বৈধভাবে বিদেশে পাঠানো যায়। মূল ধাপ:\n• টাকা নিটা দিয়ে পাঠান (বন্ধু/হুন্ডি নয়) — পরিষ্কার ট্রেইলের জন্য\n• আয় দেখিয়ে বার্ষিক রিটার্ন জমা দিন\n• প্রতি প্রপার্টির ডিড, এনকাম্বারেন্স সার্টিফিকেট ও নিটা রেকর্ড রাখুন\nকেআরটেকার আপনার কমপ্লায়েন্স ডসিয়ার প্রতি প্রপার্টিতে রাখে এবং নিটা ক্রেডিটের সাথে ভাড়া মেলায় — তাই রেমিট্যান্স ব্যাংকে আটকে যায় না। বিস্তারিত: এনআরবি গাইড + কেস স্টাডি।'
      }
    },
    {
      k: ['features', 'modules', 'what can', 'does kr', 'inventory', 'invoice', 'maintenance', 'বৈশিষ্ট্য', 'মডিউল', 'কী কী'],
      a: {
        en: 'KRTaker is 9 modules in one platform:\n🏠 Portfolio & units · 📄 Leases & registration gates · 🧾 Invoicing & TDS · 🏦 Holding tax engine · 💳 bKash/Nagad/SSLCommerz payments · 🔧 Maintenance & work orders · 👥 Owners/tenants/partners portals · ⚖️ Legal & compliance (TPA, PRCA, ITA 2023) · 📊 Reports & AI insights\nPlus KR — the AI caretaker that automates the paperwork. See the Features page for details.',
        bn: 'কেআরটেকার একটি প্ল্যাটফর্মে ৯টি মডিউল:\n🏠 পোর্টফোলিও ও ইউনিট · 📄 লিজ ও রেজিস্ট্রেশন গেট · 🧾 ইনভয়েসিং ও টিডিএস · 🏦 হোল্ডিং ট্যাক্স ইঞ্জিন · 💳 বিকাশ/নগদ/এসএসএলকমার্জ পেমেন্ট · 🔧 মেইনটেন্যান্স ও ওয়ার্ক অর্ডার · 👥 মালিক/ভাড়াটিয়া/পার্টনার পোর্টাল · ⚖️ আইনি ও কমপ্লায়েন্স (টিপিএ, পিআরসিএ, আয়কর ২০২৩) · 📊 রিপোর্ট ও এআই ইনসাইট\nসাথে কেআর — এআই কেয়ারটেকার, যিনি কাগজপত্র অটোমেট করেন। বিস্তারিত: ফিচারস পেজ।'
      }
    },
    {
      k: ['demo', 'prototype', 'try', 'see it', 'workspace', 'ডেমো', 'প্রোটোটাইপ', 'চেষ্টা'],
      a: {
        en: 'You can try the live prototype right now! Click "Open workspace" on the home page, or register first for a personalized trial. The demo workspace shows a sample portfolio: ৳74.55 Cr, 70% occupancy, leases, invoices, TDS and maintenance — all clickable.',
        bn: 'আপনি এখনই লাইভ প্রোটোটাইপ চেষ্টা করতে পারেন! হোম পেজে "ওয়ার্কস্পেস খুলুন" ক্লিক করুন, অথবা আগে রেজিস্টার করে পার্সোনালাইজড ট্রায়াল নিন। ডেমো ওয়ার্কস্পেসে নমুনা পোর্টফোলিও দেখা যায়: ৳৭৪.৫৫ কোটি, ৭০% অকুপেন্সি, লিজ, ইনভয়েস, টিডিএস ও মেইনটেন্যান্স — সব ক্লিকযোগ্য।'
      }
    },
    {
      k: ['contact', 'talk', 'human', 'support', 'phone', 'email', 'reach', 'যোগাযোগ', 'মানুষ', 'সাপোর্ট', 'ফোন', 'ইমেইল'],
      a: {
        en: 'We are happy to help!\n📧 hello@krtaker.com\n📞 +880 1712-000000 (WhatsApp)\n📍 Dhaka, Bangladesh\nOr use the Contact page form — we reply within 24 hours.',
        bn: 'আমরা সাহায্য করতে পেরে খুশি!\n📧 hello@krtaker.com\n📞 +৮৮০ ১৭১২-০০০০০০ (হোয়াটসঅ্যাপ)\n📍 ঢাকা, বাংলাদেশ\nঅথবা কন্টাক্ট পেজের ফর্ম ব্যবহার করুন — ২৪ ঘণ্টার মধ্যে উত্তর দেব।'
      }
    },
    {
      k: ['partner', 'service partner', 'vendor', 'work order', 'পার্টনার', 'সার্ভিস পার্টনার'],
      a: {
        en: 'Service partners get a steady pipeline of vetted property work orders — quotations, QC checks and payouts in one portal. Categories: electrical, plumbing, civil, security, elevator, cleaning, pest control, painting. Join via the Register page (choose "Service Partner") — free to join, you only pay a success fee on completed orders.',
        bn: 'সার্ভিস পার্টনাররা ভেরিফায়েড প্রপার্টি ওয়ার্ক অর্ডারের নিয়মিত পাইপলাইন পান — কোটেশন, কিউসি চেক ও পেমেন্ট এক পোর্টালে। ক্যাটাগরি: ইলেকট্রিক্যাল, প্লাম্বিং, সিভিল, সিকিউরিটি, এলিভেটর, ক্লিনিং, পেস্ট কন্ট্রোল, পেইন্টিং। রেজিস্টার পেজ থেকে জয়েন করুন ("সার্ভিস পার্টনার" বাছাই করুন) — জয়েন ফ্রি, শুধু সম্পন্ন অর্ডারে সাকসেস ফি।'
      }
    },
    {
      k: ['hello', 'hi', 'hey', 'assalamu', 'salam', 'হাই', 'হ্যালো', 'সালাম'],
      a: {
        en: 'Hello! 👋 I\'m KR, the KRTaker assistant. Ask me about pricing, registration, holding tax, TDS, leases, eviction, NRB topics — or try the calculators. What would you like to know?',
        bn: 'হ্যালো! 👋 আমি কেআর, কেআরটেকার সহকারী। মূল্য, রেজিস্ট্রেশন, হোল্ডিং ট্যাক্স, টিডিএস, লিজ, উচ্ছেদ, এনআরবি বিষয়ে প্রশ্ন করুন — অথবা ক্যালকুলেটর ব্যবহার করুন। কী জানতে চান?'
      }
    }
  ];

  const FALLBACK = {
    en: 'Sorry, I don\'t have an answer for that yet. 😅 Try asking about pricing, registration, holding tax, TDS or leases — or tap a suggestion below. You can also reach a human at /landing/contact.html',
    bn: 'দুঃখিত, এ বিষয়ে আমার এখনো উত্তর নেই। 😅 মূল্য, রেজিস্ট্রেশন, হোল্ডিং ট্যাক্স, টিডিএস বা লিজ নিয়ে জিজ্ঞেস করুন — অথবা নিচের সাজেশনগুলো চাপুন। মানুষজনকে /landing/contact.html-এও পাবেন।'
  };

  function lang() { return (window.KR_I18N && window.krLang) ? window.krLang() : 'en'; }
  function t(o) { return o[lang()] || o.en; }

  function answer(raw) {
    const q = raw.toLowerCase().trim();
    if (!q) return null;
    let best = null, bestScore = 0;
    for (const item of KB) {
      let score = 0;
      for (const kw of item.k) {
        if (q.includes(kw.toLowerCase())) score += kw.length;
      }
      if (score > bestScore) { bestScore = score; best = item; }
    }
    return bestScore >= 3 ? t(best.a) : null;
  }

  // ── Widget ───────────────────────────────────────────────
  const UI = {
    en: { title: 'KR — AI Caretaker', status: 'Online · answers instantly', ph: 'Ask about pricing, taxes…', send: '➤', quick: ['Pricing', 'Holding tax', 'TDS', 'Register', 'Eviction', 'NRB'], hello: 'Hi! 👋 I\'m KR. Ask me anything about KRTaker — or tap a topic below.' },
    bn: { title: 'কেআর — এআই কেয়ারটেকার', status: 'অনলাইন · তাৎক্ষণিক উত্তর', ph: 'মূল্য, ট্যাক্স নিয়ে প্রশ্ন করুন…', send: '➤', quick: ['মূল্য', 'হোল্ডিং ট্যাক্স', 'টিডিএস', 'রেজিস্টার', 'উচ্ছেদ', 'এনআরবি'], hello: 'হ্যালো! 👋 আমি কেআর। কেআরটেকার নিয়ে যেকোনো প্রশ্ন করুন — অথবা নিচের বিষয় চাপুন।' }
  };

  function build() {
    const d = document;
    const fab = d.createElement('button');
    fab.className = 'chat-fab'; fab.setAttribute('aria-label', 'Chat with KR');
    fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg><span class="chat-fab-badge">1</span>';

    const box = d.createElement('div');
    box.className = 'chat-box';
    box.innerHTML =
      '<div class="chat-head">' +
        '<div class="chat-avatar">🤖</div>' +
        '<div><h4>' + UI.en.title + '</h4><p>' + UI.en.status + '</p></div>' +
        '<button class="chat-close" aria-label="Close">✕</button>' +
      '</div>' +
      '<div class="chat-body"></div>' +
      '<div class="chat-quick"></div>' +
      '<div class="chat-input"><input type="text" autocomplete="off"><button class="chat-send" aria-label="Send">➤</button></div>';

    d.body.appendChild(fab);
    d.body.appendChild(box);

    const body = box.querySelector('.chat-body');
    const quick = box.querySelector('.chat-quick');
    const input = box.querySelector('input');
    const sendBtn = box.querySelector('.chat-send');
    const closeBtn = box.querySelector('.chat-close');
    const headTitle = box.querySelector('.chat-head h4');
    const headStatus = box.querySelector('.chat-head p');

    function applyI18n() {
      const u = UI[lang()] || UI.en;
      headTitle.textContent = u.title;
      headStatus.textContent = u.status;
      input.placeholder = u.ph;
      sendBtn.textContent = u.send;
      quick.innerHTML = '';
      u.quick.forEach(q => {
        const b = d.createElement('button');
        b.textContent = q; b.type = 'button';
        b.addEventListener('click', () => { input.value = q; ask(); });
        quick.appendChild(b);
      });
      // re-render first bot message in new language
      if (body.children.length === 1) {
        body.innerHTML = '';
        addMsg(t({ en: UI.en.hello, bn: UI.bn.hello }), 'bot');
      }
    }

    function addMsg(text, who) {
      const m = d.createElement('div');
      m.className = 'chat-msg ' + who;
      // allow links in bot messages
      m.innerHTML = who === 'bot' ? text.replace(/(https?:\/\/[^\s]+|\/landing\/[^\s]+)/g, m => {
        const href = m.startsWith('/') ? m : m;
        return '<a href="' + href + '" target="_blank" rel="noopener">' + m + '</a>';
      }) : escapeHtml(text);
      body.appendChild(m);
      body.scrollTop = body.scrollHeight;
      return m;
    }

    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function typing() {
      const t = d.createElement('div');
      t.className = 'chat-typing';
      t.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(t); body.scrollTop = body.scrollHeight;
      return t;
    }

    function ask() {
      const raw = input.value.trim();
      if (!raw) return;
      addMsg(raw, 'user');
      input.value = '';
      const typingEl = typing();
      const delay = 500 + Math.random() * 500;
      setTimeout(() => {
        typingEl.remove();
        const a = answer(raw) || t(FALLBACK);
        addMsg(a, 'bot');
      }, delay);
    }

    function open() {
      box.classList.add('open');
      fab.style.display = 'none';
      input.focus();
    }
    function close() {
      box.classList.remove('open');
      fab.style.display = 'flex';
    }

    fab.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    sendBtn.addEventListener('click', ask);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') ask(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('open')) close(); });

    // greeting
    addMsg(t({ en: UI.en.hello, bn: UI.bn.hello }), 'bot');
    // populate quick chips (i18n may have already fired before this widget built)
    applyI18n();

    // i18n hook — re-apply on language toggle
    document.addEventListener('kri18n', applyI18n);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
