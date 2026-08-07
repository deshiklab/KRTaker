/* ═══ KR Share v1: WhatsApp-first share menu (building · listings · blog) ═══
   Exposes window.KRShare = { open, wa, go, copy, inlineBar }
   Usage: KRShare.open({title, text, url})            → modal with WhatsApp hero + channels
          KRShare.wa(text, url)                       → one-tap WhatsApp
          KRShare.go('fb'|'x'|'li'|'tg'|'em', {...})  → direct channel
          <div data-kr-share data-kr-title=".." data-kr-text=".."> → auto inline bar
   Channels: wa (WhatsApp, primary) · fb · x · li · tg · em · cp (copy) · mo (native more) */
(function(){
  var BN={
    'Share':'শেয়ার','Share this page':'এই পেজ শেয়ার করুন','Share on WhatsApp':'হোয়াটসঅ্যাপে শেয়ার করুন',
    'WhatsApp':'হোয়াটসঅ্যাপ','Facebook':'ফেসবুক','X (Twitter)':'এক্স','LinkedIn':'লিংকডইন','Telegram':'টেলিগ্রাম',
    'Email':'ইমেইল','Copy link':'লিংক কপি','More options':'আরও অপশন','Link copied ✓':'লিংক কপি হয়েছে ✓',
    'Share via':'শেয়ার করুন'
  };
  function T(en,bn){return (window.__KR_LANG==='bn'&&BN[en])?BN[en]:(bn&&window.__KR_LANG==='bn'?bn:en);}
  var IC={
    wa:'<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.004 3C8.828 3 3 8.826 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.66-1.71A12.94 12.94 0 0 0 16 29c7.174 0 13-5.826 13-13S23.178 3 16.004 3zm0 23.8c-2.07 0-4.1-.56-5.87-1.62l-.42-.25-3.95 1.01 1.05-3.85-.27-.44A10.76 10.76 0 0 1 5.2 16c0-5.96 4.85-10.8 10.8-10.8S26.8 10.04 26.8 16 21.96 26.8 16 26.8zm5.93-8.1c-.32-.16-1.9-.94-2.2-1.05-.29-.11-.5-.16-.72.16-.2.32-.8 1.05-.99 1.26-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.14 3.09 1.3 3.3.16.21 2.25 3.44 5.45 4.82.76.33 1.36.53 1.82.68.77.24 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37z"/></svg>',
    fb:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.52l.48-3H13.5V8.6c0-.87.24-1.6 1.57-1.6h1.68V4.25c-.29-.04-1.28-.13-2.44-.13-2.41 0-4.06 1.47-4.06 4.18v2.2H7.5v3h2.75V21h3.25z"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.53 3h3.07l-6.7 7.66L21.6 21h-6.17l-4.84-6.32L5.02 21H1.94l7.17-8.2L1.9 3h6.33l4.37 5.78L17.53 3zm-1.08 16.2h1.7L7.06 4.7H5.24l11.21 14.5z"/></svg>',
    li:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5A2.49 2.49 0 0 0 2.5 6a2.49 2.49 0 0 0 2.48 2.5A2.49 2.49 0 0 0 7.47 6a2.49 2.49 0 0 0-2.49-2.5zM3 9h4v12H3V9zm7.5 0h3.8v1.72h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21h-4V9z"/></svg>',
    tg:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.4 18.9 19.3c-.23 1-.8 1.25-1.63.78l-4.5-3.32-2.17 2.09c-.24.24-.44.44-.9.44l.32-4.57L18.1 6.6c.36-.32-.08-.5-.56-.18L7.1 13.1l-4.4-1.38c-.96-.3-.98-.96.2-1.42L20.6 3.03c.8-.3 1.5.18 1.3 1.37z"/></svg>',
    em:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    cp:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
    mo:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>'
  };
  var CH=[
    {k:'fb',t:'Facebook'},{k:'x',t:'X (Twitter)'},{k:'li',t:'LinkedIn'},
    {k:'tg',t:'Telegram'},{k:'em',t:'Email'},{k:'cp',t:'Copy link'},{k:'mo',t:'More options'}
  ];
  var ov=null,cur=null,toastEl=null,toastTimer=null;

  function enc(s){return encodeURIComponent(String(s==null?'':s));}
  function links(o){
    var text=(o.text||o.title||'')+'\n'+(o.url||location.href);
    var u=o.url||location.href, t=o.text||'', title=o.title||document.title;
    return {
      wa:'https://wa.me/?text='+enc(text),
      fb:'https://www.facebook.com/sharer/sharer.php?u='+enc(u)+(t?'&quote='+enc(t):''),
      x:'https://twitter.com/intent/tweet?text='+enc(t||title)+(u?'&url='+enc(u):''),
      li:'https://www.linkedin.com/sharing/share-offsite/?url='+enc(u),
      tg:'https://t.me/share/url?url='+enc(u)+(t?'&text='+enc(t):''),
      em:'mailto:?subject='+enc(title)+'&body='+enc(text)
    };
  }
  function go(ch,o){
    var L=links(o);
    if(ch==='wa'){var a=document.createElement('a');a.href=L.wa;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();return;}
    if(ch==='cp'){copy(o.url||location.href);return;}
    if(ch==='mo'){if(navigator.share){navigator.share({title:o.title||document.title,text:o.text||'',url:o.url||location.href}).catch(function(){});}else{toast(T('Link copied ✓'));copy(o.url||location.href);}return;}
    var a=document.createElement('a');a.href=L[ch];a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
  }
  function copy(txt){
    function done(){toast(T('Link copied ✓','লিংক কপি হয়েছে ✓'));}
    function legacy(){
      var ta=document.createElement('textarea');
      ta.value=txt;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.top='-1000px';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,txt.length);
      var ok=false;
      try{ok=document.execCommand('copy');}catch(e){ok=false;}
      ta.remove();
      done();
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done).catch(legacy);}
    else legacy();
  }
  function toast(msg){
    if(window.toast){window.toast(msg);return;}
    if(!toastEl){toastEl=document.createElement('div');toastEl.className='kr-toast';document.body.appendChild(toastEl);}
    toastEl.textContent=msg;toastEl.style.display='block';
    clearTimeout(toastTimer);toastTimer=setTimeout(function(){toastEl.style.display='none';},2000);
  }
  function close(){if(ov){ov.classList.remove('open');}}
  function open(o){
    cur=o||{};
    if(!ov){
      ov=document.createElement('div');ov.className='kr-share-overlay';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
      var grid=CH.map(function(c){
        var cpBtn=c.k==='cp';
        return '<button class="kr-g" data-ch="'+c.k+'"'+(cpBtn?' data-cp="1"':'')+'><span class="i '+c.k+'">'+IC[c.k]+'</span><span class="t">'+T(c.t)+'</span></button>';
      }).join('');
      ov.innerHTML='<div class="kr-share"><div class="kr-share-head"><b>'+T('Share','শেয়ার')+'</b><button class="kr-share-x" aria-label="Close">✕</button></div>'
        +'<div class="kr-share-sub" id="krSub"></div>'
        +'<button class="kr-wa" data-ch="wa">'+IC.wa+' '+T('Share on WhatsApp','হোয়াটসঅ্যাপে শেয়ার করুন')+'</button>'
        +'<div class="kr-grid">'+grid+'</div></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click',function(e){
        if(e.target===ov)close();
        var x=e.target.closest('.kr-share-x');if(x){close();return;}
        var b=e.target.closest('[data-ch]');if(!b)return;
        if(b.getAttribute('data-cp')==='1'){copy(cur.url||location.href);return;}
        if(b.getAttribute('data-ch')==='wa'){go('wa',cur);return;}
        if(b.getAttribute('data-ch')==='mo'){go('mo',cur);return;}
        go(b.getAttribute('data-ch'),cur);
      });
    }
    var sub=ov.querySelector('#krSub');
    sub.textContent=(cur.text||cur.title||'')+'\n'+(cur.url||location.href);
    setTimeout(function(){ov.classList.add('open');},10);
  }
  function wa(text,url){open({title:document.title,text:text,url:url||location.href});}
  function inlineBar(host){
    if(!host)return;
    var title=host.getAttribute('data-kr-title')||document.title;
    var text=host.getAttribute('data-kr-text')||'';
    var url=host.getAttribute('data-kr-url')||location.href;
    var btns=CH.filter(function(c){return c.k!=='cp'&&c.k!=='mo';}).map(function(c){
      return '<button class="kr-bar-btn '+c.k+'" data-ch="'+c.k+'" aria-label="'+T(c.t)+'" title="'+T(c.t)+'">'+IC[c.k]+'</button>';
    }).join('');
    host.innerHTML='<div class="kr-bar"><span class="lbl">'+T('Share via','শেয়ার করুন')+':</span>'
      +'<button class="kr-bar-wa" data-ch="wa">'+IC.wa+' '+T('WhatsApp','হোয়াটসঅ্যাপ')+'</button>'
      +btns
      +'<button class="kr-bar-btn cp" data-ch="cp" aria-label="'+T('Copy link','লিংক কপি')+'" title="'+T('Copy link','লিংক কপি')+'">'+IC.cp+'</button></div>';
    var state={title:title,text:text,url:url};
    host.addEventListener('click',function(e){
      var b=e.target.closest('[data-ch]');if(!b)return;
      var ch=b.getAttribute('data-ch');
      if(ch==='cp'){copy(url);return;}
      go(ch,state);
    });
  }
  function init(){
    document.querySelectorAll('[data-kr-share]').forEach(function(el){inlineBar(el);});
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
  window.KRShare={open:open,wa:wa,go:go,copy:copy,inlineBar:inlineBar};
})();
