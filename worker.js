/* StadionLK worker: статика + счётчик посетителей /hit + опрос /api/vote (KV binding COUNTER)
   Контуры доступа: посетитель (без пароля, страница visitor.html),
   команда (TEAM_KEY), админ (ADMIN_KEY). Пароли живут в секретах worker'а, не в коде.
   Токен доступа = sha256(role|secret|stadion-access-2026)[0..23], присылается в x-access.
   Голосование открыто всем (посетители голосуют без токена) и тайное:
   POST /api/vote не возвращает итоги; итоги GET /api/vote только для админа.
   Анти-повтор — куки vtr на устройство (180 дн), не по IP: у посетителей
   на площадке общий внешний IP, IP-дедуп схлопывал их голоса в один. */
const J = {'content-type':'application/json; charset=utf-8','cache-control':'no-store'};

async function hit(request, env, ctx) {
  if (!env.COUNTER) return new Response('kv not bound', {status:503, headers:J});
  let c = parseInt(await env.COUNTER.get('total') || '0', 10) || 0;
  if (request.method === 'POST') {
    c += 1;
    ctx.waitUntil(env.COUNTER.put('total', String(c)));
  }
  return new Response(JSON.stringify({v:c}), {headers:J});
}

/* ---------- доступ ---------- */
async function tokenFor(role, secret) {
  const dig = await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(role + '|' + secret + '|stadion-access-2026'));
  return [...new Uint8Array(dig)].slice(0,12).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function roleOf(request, env) {
  const t = request.headers.get('x-access') || '';
  if (!t || !/^[0-9a-f]{24}$/.test(t)) return null;
  if (env.ADMIN_KEY && t === await tokenFor('admin', env.ADMIN_KEY)) return 'admin';
  if (env.TEAM_KEY  && t === await tokenFor('team',  env.TEAM_KEY))  return 'team';
  return null;
}

async function authApi(request, env) {
  if (request.method === 'OPTIONS')
    return new Response(null, {status:204, headers:{...VJ,
      'access-control-allow-methods':'POST, OPTIONS',
      'access-control-allow-headers':'content-type'}});
  if (request.method !== 'POST')
    return new Response('{"error":"method"}', {status:405, headers:VJ});
  let body;
  try { body = await request.json(); } catch(e) {
    return new Response('{"error":"bad json"}', {status:400, headers:VJ});
  }
  const role = body && body.role, pw = (body && body.password) || '';
  if (role !== 'team' && role !== 'admin')
    return new Response('{"error":"bad role"}', {status:400, headers:VJ});
  const secret = role === 'admin' ? env.ADMIN_KEY : env.TEAM_KEY;
  if (!secret)
    return new Response('{"error":"not configured"}', {status:503, headers:VJ});
  if (pw !== secret)
    return new Response('{"error":"denied"}', {status:401, headers:VJ});
  const token = await tokenFor(role, secret);
  return new Response(JSON.stringify({ok:true, role, token}), {headers:VJ});
}

/* ---------- опрос «Каким быть стадиону?» (тайный) ---------- */
const VJ = {'content-type':'application/json; charset=utf-8','cache-control':'no-store',
            'access-control-allow-origin':'*'};
const VQ = [3,3,3,3]; /* число вариантов ответа в вопросах 1..4 */

async function voteResults(env) {
  const counts = VQ.map(n => Array(n).fill(0));
  let total = 0, cursor;
  for (let page = 0; page < 20; page++) {
    const r = await env.COUNTER.list({prefix:'vt:', cursor});
    for (const k of r.keys) {
      const v = await env.COUNTER.get(k.name, 'json').catch(() => null);
      if (v && Array.isArray(v.q)) {
        total++;
        v.q.forEach((a,i) => { if (counts[i] && Number.isInteger(a) && a>=0 && a<counts[i].length) counts[i][a]++; });
      }
    }
    if (r.list_complete) break;
    cursor = r.cursor;
  }
  return {total, counts};
}

async function voteApi(request, env, ctx) {
  if (!env.COUNTER) return new Response('kv not bound', {status:503, headers:VJ});
  if (request.method === 'OPTIONS')
    return new Response(null, {status:204, headers:{...VJ,
      'access-control-allow-methods':'GET, POST, OPTIONS',
      'access-control-allow-headers':'content-type, x-access'}});
  const role = await roleOf(request, env);
  if (request.method === 'GET') {
    /* итоги видит только администратор */
    if (role !== 'admin')
      return new Response('{"error":"admin only"}', {status:401, headers:VJ});
    return new Response(JSON.stringify(await voteResults(env)), {headers:VJ});
  }
  if (request.method !== 'POST')
    return new Response('{"error":"method"}', {status:405, headers:VJ});
  /* голосуют все: команда/админ по токену, посетители анонимно;
     анти-повтор по IP+UA действует для всех контуров */
  let body;
  try { body = await request.json(); } catch(e) {
    return new Response('{"error":"bad json"}', {status:400, headers:VJ});
  }
  const q = body && body.q;
  if (!Array.isArray(q) || q.length !== VQ.length ||
      q.some((a,i) => !Number.isInteger(a) || a < 0 || a >= VQ[i]))
    return new Response('{"error":"bad answers"}', {status:422, headers:VJ});
  /* анти-повтор: куки устройства vtr (180 дн). IP+UA НЕ используем:
     на форуме/площадке у посетителей общий внешний IP и одинаковые UA,
     такая связка схлопывала голоса всех посетителей сети в один (2026-10-27) */
  const ck = request.headers.get('cookie') || '';
  const cm = /(?:^|;\s*)vtr=([0-9a-f]{20})\s*(?:;|$)/.exec(ck);
  let vid = cm && cm[1];
  if (!vid)
    vid = [...crypto.getRandomValues(new Uint8Array(10))].map(b=>b.toString(16).padStart(2,'0')).join('');
  else if (await env.COUNTER.get('seen:' + vid))
    return new Response('{"error":"already"}', {status:409, headers:VJ});
  const key = 'vt:' + new Date().toISOString() + ':' + Math.random().toString(36).slice(2,8);
  ctx.waitUntil(env.COUNTER.put(key, JSON.stringify({q})));
  ctx.waitUntil(env.COUNTER.put('seen:' + vid, '1', {expirationTtl:15552000}));
  /* тайное голосование: итоги в ответе не возвращаем */
  return new Response('{"ok":true}', {headers:{...VJ,
    'set-cookie':'vtr=' + vid + '; Max-Age=15552000; Path=/; SameSite=Lax; Secure'}});
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/hit' && (request.method === 'GET' || request.method === 'POST')) {
      return hit(request, env, ctx);
    }
    if (url.pathname === '/api/auth') {
      return authApi(request, env);
    }
    if (url.pathname === '/api/vote') {
      return voteApi(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  }
};
