/* StadionLK worker: статика + счётчик посетителей /hit (KV binding COUNTER) */
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/hit' && (request.method === 'GET' || request.method === 'POST')) {
      return hit(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  }
};
