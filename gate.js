/* StadionLK: приветственное окно с паролем.
   Пароль в файле не хранится, только его SHA-256.
   После верного ввода ставится флаг в sessionStorage: в рамках вкладки окно не появляется повторно. */
(function(){
  var PASS_SHA256='5d6a8f4867c896c899ac8bf1b597c34a88ace17e3a812e20b0bf478edc4aa9b5';
  var KEY='slk_gate_ok';
  try{ if(sessionStorage.getItem(KEY)==='1') return; }catch(e){}
  var root=document.documentElement;
  root.classList.add('slk-locked');

  var css=
    'html.slk-locked body{visibility:hidden}'+
    '.slk-gate{visibility:visible;position:fixed;inset:0;z-index:2147483000;'+
      'display:flex;align-items:center;justify-content:center;padding:24px;'+
      'background:radial-gradient(1200px 700px at 50% 18%,#16203a 0%,#0d1424 62%);'+
      'color:#e8e6df;font-family:Inter,system-ui,sans-serif;transition:opacity .45s ease}'+
    '.slk-gate.slk-off{opacity:0;pointer-events:none}'+
    '.slk-card{width:100%;max-width:430px;background:#131b30;border:1px solid rgba(201,162,39,.35);'+
      'border-radius:10px;padding:34px 30px 28px;box-shadow:0 24px 70px rgba(0,0,0,.55);text-align:center}'+
    '.slk-kick{font-size:11px;letter-spacing:.28em;color:#c9a227;text-transform:uppercase;margin-bottom:12px}'+
    '.slk-title{font-family:"Playfair Display","PT Serif",Georgia,serif;font-size:24px;line-height:1.3;'+
      'font-weight:700;color:#f0ead6;margin:0 0 8px}'+
    '.slk-sub{font-size:13.5px;line-height:1.55;color:#b9c0d4;margin:0 0 22px}'+
    '.slk-row{display:flex;gap:10px}'+
    '.slk-in{flex:1;min-width:0;height:48px;padding:0 14px;font-size:16px;color:#e8e6df;'+
      'background:#0d1424;border:1px solid #2c3a5e;border-radius:6px;outline:none}'+
    '.slk-in:focus{border-color:#c9a227}'+
    '.slk-in.slk-bad{border-color:#c0392b}'+
    '.slk-btn{height:48px;padding:0 22px;font-size:15px;font-weight:600;letter-spacing:.04em;cursor:pointer;'+
      'color:#0d1424;background:#c9a227;border:0;border-radius:6px}'+
    '.slk-btn:hover{background:#e0bc45}'+
    '.slk-err{min-height:20px;margin:10px 0 0;font-size:13px;color:#e07a6a}'+
    '.slk-note{margin:18px 0 0;font-size:12px;color:#7d86a0}';

  function hex(buf){
    return Array.prototype.map.call(new Uint8Array(buf),
      function(b){return ('0'+b.toString(16)).slice(-2);}).join('');
  }

  function build(){
    var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    var g=document.createElement('div'); g.className='slk-gate';
    g.innerHTML=
      '<div class="slk-card">'+
        '<div class="slk-kick">Красноярск · закрытый показ</div>'+
        '<p class="slk-title">Стадион имени Ленинского комсомола</p>'+
        '<p class="slk-sub">Концепция реконструкции. Материалы сайта предназначены для участников проекта.</p>'+
        '<form class="slk-row" novalidate>'+
          '<input class="slk-in" type="password" placeholder="Пароль" autocomplete="off" aria-label="Пароль">'+
          '<button class="slk-btn" type="submit">Войти</button>'+
        '</form>'+
        '<p class="slk-err"></p>'+
        '<p class="slk-note">Доступ выдаёт администратор проекта</p>'+
      '</div>';
    (document.body||root).appendChild(g);
    var form=g.querySelector('form'), inp=g.querySelector('.slk-in'), err=g.querySelector('.slk-err');
    setTimeout(function(){ try{inp.focus();}catch(e){} },60);
    form.addEventListener('submit',function(ev){
      ev.preventDefault();
      var v=inp.value||'';
      if(!v){ err.textContent='Введите пароль'; return; }
      if(!window.crypto||!crypto.subtle){ err.textContent='Браузер не поддерживает проверку'; return; }
      crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)).then(function(d){
        if(hex(d)===PASS_SHA256){
          try{ sessionStorage.setItem(KEY,'1'); }catch(e){}
          g.classList.add('slk-off');
          root.classList.remove('slk-locked');
          setTimeout(function(){ g.remove(); },480);
        }else{
          inp.classList.add('slk-bad');
          err.textContent='Неверный пароль';
          inp.select();
        }
      });
    });
    inp.addEventListener('input',function(){ inp.classList.remove('slk-bad'); err.textContent=''; });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',build);
  }else{ build(); }
})();
