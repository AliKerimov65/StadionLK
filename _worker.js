// Парольный доступ StadionLK (HTTP Basic на edge, Cloudflare Pages advanced mode).
// В репозитории хранится только SHA-256 пароля: репозиторий публичный, пароль из хеша не восстановить.
// Смена пароля: secret SLK_PASS в настройках Pages (Environment variables, Production)
// или замена хеша константы ниже.
const REALM='StadionLK';
const PASS_SHA256='5d6a8f4867c896c899ac8bf1b597c34a88ace17e3a812e20b0bf478edc4aa9b5';

function unauthorized(){
  const body='<!doctype html><html lang="ru"><head><meta charset="utf-8">'
    +'<meta name="viewport" content="width=device-width,initial-scale=1">'
    +'<title>StadionLK — доступ по паролю</title></head>'
    +'<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d1420;color:#dfe6f2;font:16px/1.6 system-ui,sans-serif">'
    +'<div style="text-align:center;padding:24px">'
    +'<div style="font-size:20px;font-weight:600;margin-bottom:6px">Закрытый раздел</div>'
    +'<div style="opacity:.65">Стадион имени Ленинского комсомола · доступ по паролю</div>'
    +'</div></body></html>';
  return new Response(body,{status:401,headers:{
    'WWW-Authenticate':'Basic realm="'+REALM+'", charset="UTF-8"',
    'Content-Type':'text/html; charset=utf-8',
    'Cache-Control':'no-store'}});
}
function hexEq(a,b){                       // сравнение без раннего выхода
  let d=a.length^b.length;
  const n=Math.max(a.length,b.length);
  for(let i=0;i<n;i++) d|=a.charCodeAt(i%a.length)^b.charCodeAt(i%b.length);
  return d===0;
}
async function sha256hex(s){
  const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export default {
  async fetch(request,env){
    const h=request.headers.get('Authorization')||'';
    if(h.startsWith('Basic ')){
      let cred='';
      try{ cred=atob(h.slice(6)); }catch(e){ return unauthorized(); }
      const i=cred.indexOf(':');
      const pw=i>=0?cred.slice(i+1):'';    // логин любой, проверяется только пароль
      if(pw){
        const exp=(env&&env.SLK_PASS)?await sha256hex(env.SLK_PASS):PASS_SHA256;
        if(hexEq(await sha256hex(pw),exp)) return env.ASSETS.fetch(request);
      }
    }
    return unauthorized();
  }
}
