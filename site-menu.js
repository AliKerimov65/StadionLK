/* StadionLK · навигация сайта (мобильная).
   СЛЕВА вверху (тёмная кнопка modules.js): «Модули проекта» — главное меню
   сайта, сетка карточек всех страниц. Показывается везде.
   СПРАВА вверху (золотая кнопка, этот файл): меню ТЕКУЩЕЙ страницы —
   её разделы-якоря; у админа добавляется «Итоги опроса».
   Кнопка выводится, только если у страницы есть разделы или вошёл админ.
   На главной в десктопе (≥901px) не показывается: там есть строка разделов. */
(function(){
  var css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'site-menu.css';
  document.head.appendChild(css);

  if (document.querySelector('nav .links')) document.body.classList.add('sm-has-inline');

  /* разделы страниц, у которых есть внутренняя навигация */
  var LOCAL = {
    'index.html': [
      ['Наследие', '#heritage'], ['Поворот поля', '#rotation'], ['Трибуны', '#stands'],
      ['Крыша', '#roof'], ['Конструктив', '#construct'], ['Сборка', '#assembly'],
      ['Сроки', '#schedule'], ['Бюджет', '#budget'], ['Документация', '#docs']
    ],
    'budget.html': [
      ['Финансовая модель', '#money'], ['График реализации', '#plan'], ['Алгоритм по ГрК РФ', '#grk']
    ],
    'team.html': [
      ['Участники проекта', '#team'], ['Объект проекта', '#object']
    ]
  };

  var cur = location.pathname.split('/').pop() || 'index.html';
  if (cur === '') cur = 'index.html';
  if (!/\.html?$/i.test(cur)) cur += '.html';   /* Cloudflare отдаёт чистые адреса: /budget → budget.html */
  var sections = LOCAL[cur] || [];
  var isAdmin = localStorage.getItem('sk_role') === 'admin';
  if (!sections.length && !isAdmin) return;   /* этой странице правое меню не нужно */

  var btn = document.createElement('button');
  btn.className = 'sm-btn'; btn.id = 'smBtn';
  btn.setAttribute('aria-label', 'Меню этой страницы');
  btn.innerHTML = '<span></span><span></span><span></span>';

  var veil = document.createElement('div');
  veil.className = 'sm-veil'; veil.id = 'smVeil'; veil.hidden = true;

  var panel = document.createElement('div');
  panel.className = 'sm-panel'; panel.id = 'smPanel'; panel.hidden = true;

  function buildHtml(){
    var html = '<div class="sm-head"><b>Эта страница</b><button class="sm-x" id="smX" aria-label="Закрыть">×</button></div>';
    if (sections.length){
      html += '<div class="sm-grp">Разделы</div>';
      sections.forEach(function(s){
        html += '<a class="sm-a" href="' + s[1] + '">' + s[0] + '</a>';
      });
    }
    if (localStorage.getItem('sk_role') === 'admin')
      html += '<div class="sm-grp">Администратор</div>' +
              '<a class="sm-a sm-adm" href="index.html#itogi">Итоги опроса</a>';
    return html;
  }

  function bindPanel(){
    panel.querySelector('#smX').onclick = close;
    panel.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ close(); });
    });
  }

  function open(){ panel.innerHTML = buildHtml(); bindPanel(); panel.hidden = false; veil.hidden = false; btn.classList.add('on'); }
  function close(){ panel.hidden = true; veil.hidden = true; btn.classList.remove('on'); }
  btn.onclick = function(){ panel.hidden ? open() : close(); };
  veil.onclick = close;
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });

  document.body.appendChild(btn);
  document.body.appendChild(veil);
  document.body.appendChild(panel);
})();
