import fs from 'node:fs/promises'
const pages=await(await fetch('http://127.0.0.1:9224/json')).json()
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl)
await new Promise(r=>ws.addEventListener('open',r,{once:true}))
let id=0;const pending=new Map(),errors=[]
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails)})
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const t=setTimeout(()=>reject(Error(method+' timed out')),20000);pending.set(n,m=>{clearTimeout(t);resolve(m)});ws.send(JSON.stringify({id:n,method,params}))})
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true})).result.result.value
await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await call('Page.navigate',{url:'http://127.0.0.1:5173/'});await sleep(4000)
await evaluate('scrollTo(0,0)');await sleep(1800)
async function shot(name){const r=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile(`.preview-${name}.png`,Buffer.from(r.result.data,'base64'))}
await shot('hero')
await evaluate('scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*0.8)');await sleep(2200);await shot('collection')
const before=await evaluate("[...document.querySelectorAll('.bottle-choice')].map(b=>parseFloat(b.style.left))")
await evaluate("document.querySelector('[data-edition=\"1\"]').click()");await sleep(1600)
const after=await evaluate("[...document.querySelectorAll('.bottle-choice')].map(b=>({left:parseFloat(b.style.left),pressed:b.getAttribute('aria-pressed')}))")
if(!(before[1]<before[0]&&Math.abs(after[1].left-50)<3&&after[0].left<after[1].left&&after[1].pressed==='true'))throw Error('Swap failed: '+JSON.stringify({before,after}))
await shot('selected')
await evaluate("document.querySelector('[data-edition=\"2\"]').click();document.querySelector('[data-edition=\"0\"]').click()");await sleep(1600)
const rapid=await evaluate("[...document.querySelectorAll('.bottle-choice')].map(b=>parseFloat(b.style.left))")
if(Math.min(...rapid.map((x,i)=>Math.min(...rapid.filter((_,j)=>i!==j).map(y=>Math.abs(x-y)))))<15)throw Error('Rapid swap overlapped')
console.log(JSON.stringify({errors,before,after,rapid,overflow:await evaluate('document.documentElement.scrollWidth>innerWidth')}));ws.close()
