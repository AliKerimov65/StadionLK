/* ===== Модули проекта StadionLK: меню, горячие клавиши, idle-возврат в автодемо ===== */
(function(){
  const MODULES=[
    {n:1,href:'stand.html',        img:'future_aerial_roof',t:'Форум «Россия — спортивная держава»', short:'Форум · стенд', s:'Стендовый ролик форума · цикл 90 секунд · работает без оператора'},
    {n:2,href:'compare.html',      img:'now_aerial',        t:'Сейчас / Будет',      s:'Полноэкранное сравнение: объект 1967 года и образ после модернизации'},
    {n:3,href:'architecture.html', img:'arch_views',        t:'Архитектура · 3D виды', short:'3D виды', s:'Общие виды модели, фасады BIM, слайдеры «до / после», зонирование и концепция модернизации'},
    {n:4,href:'model.html',        img:'bim_model',         t:'Существующий стадион · BIM', short:'BIM существующего', s:'Цифровой двойник существующего стадиона · 8 слоёв по проекту П-01-16-1-АР + слой концепции пневмопокрытия с анимацией развёртывания · фильтры, поиск, сечение'},
    {n:5,href:'index.html#construct',img:'future_aerial2',  t:'Конструктив',         s:'Восемь опорных ног · буронабивные сваи · подвешенная крыша'},
    {n:6,href:'budget.html',       img:'budget_algo',       t:'Бюджет и сроки',      s:'5,0 млрд ₽ с НДС · 22 месяца · маршрут по ГрК РФ от ТЗ до ввода в эксплуатацию'},
    {n:7,href:'index.html#docs',   img:'dwg_plan_ar',       t:'Документация',        s:'Листы П-01-16-1-АР · реставрация 2016–2017 · чертежи и ТЗ'},
    {n:8,href:'index.html',        img:'now_bridge',        t:'Полная презентация',  s:'Лонгрид проекта: наследие, поворот поля, трибуны, крыша, сроки'},
    {n:9,href:'drawings.html',     img:'dwg_sheets',        t:'Планы · фасады · разрезы', short:'Чертежи АР', s:'Поэтажные планы, разрезы 1-1…4-4, четыре фасада и посадочные места · проект П-01-16-1-АР · сверены с BIM'},
    {n:10,href:'team.html',        img:'team',              t:'Команда проекта',   s:'Администрация Губернатора КК · Минспорт КК · АНО «АНИИГБ» им. М. В. Кима · собственник · ФК «Енисей»'}
  ];
  const IDLE_SEC=75;          // бездействие до возврата в автодемо
  const COUNTDOWN_SEC=15;     // за сколько секунд показать индикатор
  const page=(location.pathname.split('/').pop()||'index.html');
  const isStand=(page==='stand.html');
  const fullKey=page+location.hash;
  /* точное совпадение с якорем важнее совпадения только по файлу */
  const cur=MODULES.find(m=>m.href===fullKey)||MODULES.find(m=>m.href.split('#')[0]===page&&!m.href.includes('#'))
        ||MODULES.find(m=>m.href.split('#')[0]===page);

  /* ---------- разметка ---------- */
  const btn=document.createElement('button');
  btn.id='modNavBtn';btn.setAttribute('aria-haspopup','true');btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<span class="burger"><i></i><i></i><i></i></span><span>Модули проекта</span>';
  const menu=document.createElement('div');
  menu.id='modMenu';menu.setAttribute('role','menu');
  menu.innerHTML=
    '<div class="mmHead"><span class="mmTitle">Модули проекта</span>'+
    '<span class="mmForum">Форум «Россия — спортивная держава» · Красноярск<br>Стадион им. Ленинского комсомола · АНИИГБ им. М. В. Кима</span>'+
    '<button class="mmClose" title="Закрыть (Esc)">✕</button></div>'+
    '<div class="mmGrid">'+MODULES.map(m=>
      '<a class="mmCard'+(cur&&cur.n===m.n?' cur':'')+'" href="'+m.href+'" data-key="'+m.n+'">'+
      '<span class="mmKey">'+m.n+'</span>'+
      '<span class="mmThumb"><img data-img="'+m.img+'" alt=""></span>'+
      '<span class="mmBody"><b>'+m.t+'</b><span>'+m.s+'</span></span></a>').join('')+
    '</div>'+
    '<div class="mmFoot"><span><b>Управление:</b> клавиши 1–9, 0 — переход к модулю · Esc — меню/закрыть · Пробел — пауза демо</span>'+
    '<span><b>Жесты:</b> свайп ← → — разделы · свайп ↓ — обновить · свайп ↑ — меню · касание — меню</span></div>';
  const pill=document.createElement('div');
  pill.id='idlePill';
  document.body.appendChild(btn);document.body.appendChild(menu);document.body.appendChild(pill);

  /* изображения: прямой файл, иначе base64-часть */
  menu.querySelectorAll('img[data-img]').forEach(async img=>{
    const n=img.dataset.img,direct='assets/img/'+n+'.jpg';
    try{const h=await fetch(direct,{method:'HEAD'});if(h.ok){img.src=direct;return}}catch(e){}
    try{const t=await(await fetch(direct+'.b64')).text();
      img.src='data:image/jpeg;base64,'+t.replace(/\s+/g,'')}catch(e){}
  });

  /* ---------- открытие/закрытие ---------- */
  let open=false;
  function setOpen(v){
    open=v;menu.classList.toggle('open',v);
    btn.setAttribute('aria-expanded',String(v));
    document.dispatchEvent(new CustomEvent(v?'stand:menu-open':'stand:menu-close'));
    resetIdle();
  }
  btn.addEventListener('click',e=>{e.stopPropagation();setOpen(!open)});
  menu.querySelector('.mmClose').addEventListener('click',()=>setOpen(false));
  menu.addEventListener('click',e=>{if(e.target===menu)setOpen(false)});   // тап по фону закрывает
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){setOpen(!open);return}
    if(open&&/^[0-9]$/.test(e.key)){
      const k=e.key==='0'?10:+e.key;
      const m=MODULES.find(x=>x.n===k);if(m)location.href=m.href;
    }
  });

  /* ---------- idle-менеджер (на всех страницах, кроме автодемо) ---------- */
  let idleT=0,lastTick=0;
  function resetIdle(){idleT=0;lastTick=0;pill.style.display='none';document.body.classList.remove('kioskIdle')}
  if(!isStand){
    ['pointermove','pointerdown','keydown','wheel','touchstart'].forEach(ev=>
      document.addEventListener(ev,resetIdle,{passive:true}));
    setInterval(()=>{
      if(open)return;
      idleT++;
      if(idleT>=3)document.body.classList.add('kioskIdle');
      const left=IDLE_SEC-idleT;
      if(left<=COUNTDOWN_SEC&&left>0){
        pill.style.display='block';
        pill.innerHTML='Возврат к ролику форума через <b>'+left+'</b> с · коснитесь экрана, чтобы остаться';
        if(left!==lastTick){lastTick=left}
      }
      if(idleT>=IDLE_SEC)location.href='stand.html';
    },1000);
  }else{
    // на странице демо: скрываем курсор через 3 с бездействия, показываем при движении
    let cT=0;
    ['pointermove','pointerdown','keydown','touchstart'].forEach(ev=>
      document.addEventListener(ev,()=>{cT=0;document.body.classList.remove('kioskIdle')},{passive:true}));
    setInterval(()=>{cT++;if(cT>=3)document.body.classList.add('kioskIdle')},1000);
  }

  /* ================= ЖЕСТЫ: свайпы, pull-to-refresh, пейджер ================= */
  document.body.dataset.page=page;

  /* пейджер текущего модуля (тап — открыть меню) */
  if(cur){
    const pg=document.createElement('button');
    pg.id='gxPager';pg.setAttribute('aria-label','Меню модулей');
    pg.innerHTML='<b>'+cur.n+'</b><i>/ '+MODULES.length+'</i><span>'+(cur.short||cur.t)+'</span>';
    pg.addEventListener('click',e=>{e.stopPropagation();setOpen(true)});
    document.body.appendChild(pg);
  }

  /* индикатор «потяните для обновления» */
  const ptr=document.createElement('div');
  ptr.id='gxPtr';
  ptr.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg><span>Потяните для обновления</span>';
  document.body.appendChild(ptr);
  const ptrTxt=ptr.querySelector('span'),ptrIco=ptr.querySelector('svg');
  function ptrShow(dy){
    const p=Math.min(1,dy/PTR_ON);
    ptr.classList.add('show');
    ptr.style.transform='translate(-50%,'+(-70+Math.min(dy*.5,78))+'px)';
    ptrIco.style.transform='rotate('+(p*300)+'deg)';
    ptr.classList.toggle('rdy',dy>=PTR_ON);
    ptrTxt.textContent=dy>=PTR_ON?'Отпустите для обновления':'Потяните для обновления';
  }
  function ptrHide(){ptr.classList.remove('show','rdy');ptr.style.transform='';ptrIco.style.transform=''}

  /* входная анимация после свайп-перехода */
  const inDir=sessionStorage.getItem('gxDir');
  if(inDir){
    sessionStorage.removeItem('gxDir');
    document.documentElement.classList.add('gx-in-'+inDir);
    setTimeout(()=>document.documentElement.classList.remove('gx-in-'+inDir),460);
  }

  /* переход к соседнему модулю с выездом страницы */
  const curIdx=cur?MODULES.indexOf(cur):-1;
  let navLock=false;
  function goMod(dir){                    /* +1: свайп влево → следующий; -1: вправо → предыдущий */
    if(curIdx<0||navLock)return;
    navLock=true;
    sessionStorage.setItem('gxDir',dir>0?'l':'r');
    document.documentElement.classList.add(dir>0?'gx-out-l':'gx-out-r');
    setTimeout(()=>{location.href=MODULES[(curIdx+dir+MODULES.length)%MODULES.length].href},240);
  }

  /* зоны, где жесты не перехватываются:
     true — полная блокировка, 'h' — только горизонталь заблокирована */
  function lockAt(t){
    if(t.closest('#modMenu,#modNavBtn,#gxPager,#gxPtr,a,button,input,select,textarea,label'))return true;
    if(page==='model.html'&&t.closest('#view'))return true;   /* OrbitControls */
    if(page==='drawings.html'&&t.closest('#dwgView'))return true; /* пан/зум чертежа */
    if(page==='architecture.html'&&t.closest('#avView'))return true; /* пан/зум 3D вида */
    if(page==='compare.html'&&t.closest('#stage'))return 'h'; /* разделитель Сейчас/Будет */
    if(t.closest('.ba'))return 'h';                           /* слайдер в hero лонгрида */
    if(t.closest('iframe'))return true;
    return false;
  }

  const SW_X=72,SW_Y=72,PTR_ON=96,G_T=900;
  const isFull=getComputedStyle(document.body).overflow==='hidden';
  let g=null;

  document.addEventListener('touchstart',e=>{
    if(e.touches.length!==1){g=null;ptrHide();return}
    if(menu.classList.contains('open'))return;
    const t=e.touches[0],lk=lockAt(e.target);
    if(lk===true)return;
    g={x:t.clientX,y:t.clientY,t:performance.now(),lk:lk,mode:null};
  },{passive:true});

  document.addEventListener('touchmove',e=>{
    if(!g||e.touches.length!==1)return;
    const t=e.touches[0],dx=t.clientX-g.x,dy=t.clientY-g.y;
    if(!g.mode){
      if(Math.abs(dx)<12&&Math.abs(dy)<12)return;
      if(g.lk!=='h'&&Math.abs(dx)>Math.abs(dy)*1.35)g.mode='h';
      else if(dy>0&&Math.abs(dy)>Math.abs(dx)*1.2){
        const sc=document.scrollingElement?document.scrollingElement.scrollTop:0;
        g.mode=(sc<=0)?'ptr':'none';
      }
      else if(dy<0&&Math.abs(dy)>Math.abs(dx)*1.2)g.mode=isFull?'up':'none';
      else g.mode='none';
    }
    if(g.mode==='ptr'){e.preventDefault();ptrShow(dy)}
    else if(g.mode==='h')e.preventDefault();   /* гасим нативный overscroll-back */
  },{passive:false});

  document.addEventListener('touchend',e=>{
    if(!g)return;
    const dt=performance.now()-g.t;
    let dx=0,dy=0;
    if(e.changedTouches.length){dx=e.changedTouches[0].clientX-g.x;dy=e.changedTouches[0].clientY-g.y}
    const mode=g.mode;g=null;
    if(mode==='h'){                       /* горизонтальный свайп: без лимита времени */
      if(Math.abs(dx)>=SW_X)goMod(dx<0?+1:-1);
      return;
    }
    if(dt>G_T){ptrHide();return}
    if(mode==='ptr'){
      ptrHide();
      if(dy>=PTR_ON){ptrTxt.textContent='Обновление…';ptr.classList.add('show','rdy');
        ptr.style.transform='translate(-50%,6px)';setTimeout(()=>location.reload(),180);}
    }else if(mode==='up'&&dy<=-SW_Y){
      setOpen(true);
    }
  },{passive:true});
  document.addEventListener('touchcancel',()=>{g=null;ptrHide()},{passive:true});
})();
