/* ===== Модули проекта StadionLK: меню, горячие клавиши, idle-возврат в автодемо ===== */
(function(){
  const MODULES=[
    {n:1,href:'stand.html',        img:'future_aerial_roof',t:'Автодемо',            s:'Циклический ролик для стенда · 90 секунд · работает без оператора'},
    {n:2,href:'compare.html',      img:'now_aerial',        t:'Сейчас / Будет',      s:'Полноэкранное сравнение: объект 1967 года и образ после модернизации'},
    {n:3,href:'model.html',        img:'bim_model',         t:'BIM-модель',          s:'Интерактивная 3D-модель обследования · 13 716 элементов · фильтры'},
    {n:4,href:'index.html#construct',img:'future_aerial2',  t:'Конструктив',         s:'Восемь опорных ног · буронабивные сваи · подвешенная крыша'},
    {n:5,href:'index.html#budget', img:'ar_section',        t:'Бюджет и сроки',      s:'5,0 млрд ₽ с НДС · структура СМР · 22 месяца реализации'},
    {n:6,href:'index.html#docs',   img:'dwg_plan_ar',       t:'Документация',        s:'Листы П-01-16-1-АР · реставрация 2016–2017 · чертежи и ТЗ'},
    {n:7,href:'index.html',        img:'now_bridge',        t:'Полная презентация',  s:'Лонгрид проекта: наследие, поворот поля, трибуны, крыша, сроки'}
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
    '<div class="mmFoot"><span><b>Управление:</b> клавиши 1–7 — переход к модулю · Esc — меню/закрыть · Пробел — пауза демо</span>'+
    '<span>Касание экрана в любой точке открывает это меню</span></div>';
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
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){setOpen(!open);return}
    if(open&&/^[1-7]$/.test(e.key)){
      const m=MODULES.find(x=>x.n===+e.key);if(m)location.href=m.href;
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
        pill.innerHTML='Возврат в автодемо через <b>'+left+'</b> с · коснитесь экрана, чтобы остаться';
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
})();
