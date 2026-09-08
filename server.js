require('dotenv').config();
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const PORT = Number(process.env.PORT || 3000);
const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TZEB67quDQ3rCC';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const ROOT = path.join(__dirname, '..');

function send(res, status, data, type='application/json') {
  res.writeHead(status, {'Content-Type': type, 'Access-Control-Allow-Origin': '*'});
  res.end(type === 'application/json' ? JSON.stringify(data) : data);
}
function readBody(req) { return new Promise((resolve,reject)=>{ let b=''; req.on('data',c=>b+=c); req.on('end',()=>{ try{resolve(b?JSON.parse(b):{})}catch(e){reject(e)} }); req.on('error',reject); }); }
function razorRequest(method, apiPath, body) {
  return new Promise((resolve,reject)=>{
    if (!KEY_SECRET) return reject(new Error('RAZORPAY_KEY_SECRET is not configured'));
    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
    const payload = JSON.stringify(body);
    const req = https.request({hostname:'api.razorpay.com',path:apiPath,method,headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}}, r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{const x=JSON.parse(d); if(r.statusCode>=200&&r.statusCode<300) resolve(x); else reject(new Error(x.error?.description||`Razorpay HTTP ${r.statusCode}`));}catch(e){reject(e)}})});
    req.on('error',reject); req.write(payload); req.end();
  });
}
function safePath(urlPath){ const clean=decodeURIComponent(urlPath.split('?')[0]); const p=clean==='/'?'/index.html':clean; const full=path.normalize(path.join(ROOT,p)); return full.startsWith(ROOT) ? full : null; }

const server=http.createServer(async (req,res)=>{
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
  try {
        const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/healthz') {
      return send(res, 200, { status: 'ok' });
    }
    if(req.url==='/api/config' && req.method==='GET') return send(res,200,{keyId:KEY_ID});
    if(req.url==='/api/create-order' && req.method==='POST'){
      const b=await readBody(req); const amount=Math.round(Number(b.amount)*100);
      if(!Number.isFinite(amount)||amount<=0||amount>100000000) return send(res,400,{error:'Invalid amount'});
      const receipt='B&B_'+Date.now();
      const order=await razorRequest('POST','/v1/orders',{amount,currency:'INR',receipt,notes:{customer_name:String(b.customer?.name||'').slice(0,100),email:String(b.customer?.email||'').slice(0,100)}});
      return send(res,200,{id:order.id,amount:order.amount,currency:order.currency,keyId:KEY_ID});
    }
    if(req.url==='/api/verify-payment' && req.method==='POST'){
      const b=await readBody(req); const {orderId,paymentId,signature}=b;
      if(!orderId||!paymentId||!signature||!KEY_SECRET) return send(res,400,{verified:false,error:'Missing verification data'});
      const expected=crypto.createHmac('sha256',KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
      const verified=crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(signature));
      return send(res,verified?200:400,{verified});
    }
    const file=safePath(req.url); if(!file) return send(res,403,{error:'Forbidden'});
    if(!fs.existsSync(file)||fs.statSync(file).isDirectory()) return send(res,404,{error:'Not found'});
    const ext=path.extname(file).toLowerCase(); const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.txt':'text/plain; charset=utf-8'};
    res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'}); fs.createReadStream(file).pipe(res);
  } catch(e) { console.error(e); send(res,500,{error:e.message}); }
});
server.listen(PORT,()=>console.log(`Blush & Bow running at http://localhost:${PORT}`));
