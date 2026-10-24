/* Счётчик посетителей: POST — засчитать визит и вернуть итог, GET — только показать.
   Хранение: Workers KV, биндинг COUNTER (привязывается в дашборде Pages). */
const J = {'content-type':'application/json; charset=utf-8','cache-control':'no-store'};

export async function onRequestGet({env}) {
  if(!env.COUNTER) return new Response('kv not bound', {status:503, headers:J});
  const c = parseInt(await env.COUNTER.get('total') || '0', 10) || 0;
  return new Response(JSON.stringify({v:c}), {headers:J});
}

export async function onRequestPost({env, waitUntil}) {
  if(!env.COUNTER) return new Response('kv not bound', {status:503, headers:J});
  const c = (parseInt(await env.COUNTER.get('total') || '0', 10) || 0) + 1;
  waitUntil(env.COUNTER.put('total', String(c)));
  return new Response(JSON.stringify({v:c}), {headers:J});
}
