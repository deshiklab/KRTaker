/* KRTaker landing — i18n engine: applies EN/বাংলা from KR_I18N, persists choice. */
(function () {
  const STORE = 'krtaker_lang';
  const DEFAULTS = { en: 'EN', bn: 'বাং' };
  let lang = 'en';
  try { lang = localStorage.getItem(STORE) || 'en'; } catch (e) {}
  if (!KR_I18N[lang]) lang = 'en';

  function apply() {
    const dict = KR_I18N[lang];
    if (!dict) return;
    document.documentElement.lang = (lang === 'bn') ? 'bn' : 'en';
    // text nodes
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    // placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
    });
    // title / aria-labels
    document.querySelectorAll('[data-i18n-t]').forEach(el => {
      const key = el.getAttribute('data-i18n-t');
      if (dict[key] !== undefined) el.setAttribute('title', dict[key]);
    });
    // lang toggle button label
    const btns = document.querySelectorAll('[data-lang-toggle]');
    btns.forEach(b => { b.textContent = DEFAULTS[lang] || 'EN'; });
    // aria-label on toggle
    document.querySelectorAll('[data-lang-toggle]').forEach(b => {
      b.setAttribute('aria-label', lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন');
    });
    document.dispatchEvent(new CustomEvent('kri18n', { detail: { lang } }));
  }

  function setLang(next) {
    lang = KR_I18N[next] ? next : 'en';
    try { localStorage.setItem(STORE, lang); } catch (e) {}
    apply();
  }

  window.krLang = () => lang;
  window.krSetLang = setLang;

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-lang-toggle]').forEach(b => {
      b.addEventListener('click', () => setLang(lang === 'bn' ? 'en' : 'bn'));
    });
    apply();
  });
})();
