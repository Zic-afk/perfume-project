import fs from 'node:fs/promises'
const pages=await (await fetch('http://127.0.0.1:9224/json')).json()
const ws=new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl)
await new Promise(r=>ws.addEventListener('open',r,{once:true}))
let id=0;const pending=new Map();const errors=[]
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails)})
const call=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))})
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
await call('Runtime.enable');await call('Page.enable')
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
await call('Page.navigate',{url:'http://127.0.0.1:5173/'})
await sleep(8000)
for(const [name,progress] of [['hero',0],['history',0.45],['collection',0.8],['final',1]]){
 await call('Runtime.evaluate',{expression:`window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*${progress})`})
 await sleep(2400)
 const shot=await call('Page.captureScreenshot',{format:'png'})
 await fs.writeFile(`.preview-${name}.png`,Buffer.from(shot.result.data,'base64'))
}
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true})
for(const [name,progress] of [['mobile-hero',0],['mobile-history',0.45],['mobile-collection',0.8],['mobile-final',1]]){
 await call('Runtime.evaluate',{expression:`window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*${progress})`});await sleep(2000)
 const shot=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile(`.preview-${name}.png`,Buffer.from(shot.result.data,'base64'))
}
console.log(JSON.stringify({errors}));ws.close()


