import './style.css'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const editions = [
 { name: 'L’ORIGINEL', color: '#a46316', absorption: '#bf771a', note: 'Тёплый янтарь · цветочная абстракция' },
 { name: 'ÉMERAUDE', color: '#075239', absorption: '#074e35', note: 'Глубокий изумруд · благородная свежесть' },
 { name: 'GRENAT', color: '#63162d', absorption: '#5b1027', note: 'Гранатовый бархат · вечерний характер' },
]
 document.querySelector('#app').innerHTML = `
<div class="stage" aria-hidden="true"><canvas></canvas><div class="grain"></div></div>
<header class="navigation"><a class="nav-brand" href="#home">CHANEL</a><a href="#history">История аромата <span>↗</span></a></header>
<main class="experience" id="home">
<section class="scene-copy hero-copy" aria-labelledby="hero-title"><p class="eyebrow hero-eyebrow">PARIS · DEPUIS 1921</p><h1 id="hero-title">CHANEL</h1><div class="hero-caption"><span>N°5</span><p>Есть ароматы.<br>Есть легенды.</p></div><p class="side-caption">L’ESSENCE DE L’ÉTERNITÉ</p><a class="scroll-cue" href="#history"><span>ПРОКРУТИТЕ, ЧТОБЫ ПОЧУВСТВОВАТЬ</span><i></i></a><span class="edition">EAU DE PARFUM<br>50 ML · MADE IN FRANCE</span></section>
<div class="anchor" id="history"></div>
<section class="scene-copy history-copy" aria-labelledby="history-title"><div class="history-left"><p class="eyebrow">01 / РОЖДЕНИЕ ЛЕГЕНДЫ</p><h2 id="history-title">Номер пять.<br><em>Вне времени.</em></h2><div class="fine-line"></div><p class="body-copy">Аромат как воплощение женщины. Смелой. Свободной. Непохожей на других. История N°5 — это история нового взгляда на красоту.</p></div><div class="history-right"><span class="year">1921</span><p class="eyebrow">ПАРИЖ. НАЧАЛО НОВОЙ ЭПОХИ.</p><p class="body-copy">Габриэль Шанель и парфюмер Эрнест Бо. Встреча, подарившая миру цветочную абстракцию. Пятый образец. Простое имя. Начало легенды.</p><p class="history-signature">Простота формы.<br>Бесконечность содержания.</p></div><span class="section-foot">CHANEL N°5 — ИСКУССТВО БЫТЬ СОБОЙ</span></section>
<div class="anchor final-anchor" id="fragrance"></div>
<section class="scene-copy fragrance-copy" aria-label="Коллекция ароматов"></section>
</main><div class="chapter-index" aria-hidden="true"><span class="chapter-current">01</span><span class="chapter-track"><i></i></span><span>03</span></div><div class="render-fallback" hidden>Для просмотра объёмного флакона включите WebGL в браузере.</div>`
document.querySelector('.fragrance-copy').innerHTML = `
 <p class="eyebrow collection-heading">02 / LA COLLECTION PRIVÉE</p>
 <h2 class="collection-title">Три грани <em>одной легенды.</em></h2>
 <aside class="collection-aside aside-left"><span class="ornament">✧</span><p>PARIS<br>1921</p><i></i><span>НАСЛЕДИЕ<br>В КАЖДОЙ ДЕТАЛИ</span></aside>
 <div class="collection-frame"><span class="frame-top">LES ÉDITIONS · N°5</span><span class="frame-corner">I — III</span><div class="bottle-controls" role="group" aria-label="Выберите флакон">${editions.map((edition, index) => `<button type="button" class="bottle-choice" data-edition="${index}" aria-label="${edition.name} — переместить в центр" aria-pressed="${index === 0}"><span>${edition.name}</span></button>`).join('')}</div><span class="frame-bottom">EXTRAORDINARY BY NATURE</span><span class="frame-volume">50 ML</span></div>
 <aside class="collection-aside aside-right"><span>СОЗДАНО,<br>ЧТОБЫ ОСТАТЬСЯ</span><i></i><p>EAU<br>DE PARFUM</p><span class="ornament">✧</span></aside>
 <div class="selection-caption" aria-live="polite"><span class="selected-name">L’ORIGINEL</span><p class="selected-note">${editions[0].note}</p><small>ВЫБЕРИТЕ ФЛАКОН — ПУСТЬ ОН СТАНЕТ ГЛАВНЫМ</small></div>`
document.querySelector('.experience').insertAdjacentHTML('beforeend', `
 <div class="anchor contact-anchor" id="contacts"></div>
 <section class="scene-copy contact-copy" aria-labelledby="contact-title">
  <p class="eyebrow">03 / ОСТАНЕМСЯ НА СВЯЗИ</p>
  <h2 id="contact-title">Продолжим<br><em>знакомство.</em></h2>
  <div class="contact-list">
   <div><span>ЭЛЕКТРОННАЯ ПОЧТА</span><p>bonjour@parfum.example</p><small>Заказы и сотрудничество</small></div>
   <div><span>ТЕЛЕФОН</span><p>+7 (000) 000-00-00</p><small>Ежедневно · 10:00–19:00</small></div>
   <div><span>СОЦИАЛЬНЫЕ СЕТИ</span><p>Telegram · VK · Instagram</p><small>Ссылки на ваши страницы — скоро</small></div>
   <div><span>АДРЕС ШОУРУМА</span><p>По предварительной записи</p><small>Город и адрес будут добавлены</small></div>
  </div>
  <p class="contact-demo-note">Демонстрационные контакты · будут заменены на ваши</p>
  <footer><span>CHANEL</span><p>Независимый дизайн-концепт · 2026</p><a href="#home">К началу ↑</a></footer>
 </section>`)
document.querySelector('.chapter-index > span:last-child').textContent = '04'
let renderer
try { renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('canvas'), antialias: true, powerPreference: 'high-performance' }) }
catch { document.querySelector('.render-fallback').hidden = false }
if (renderer) initScene()
function initScene() {
 renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
 renderer.toneMapping = THREE.ACESFilmicToneMapping
 renderer.toneMappingExposure = 1.2
 renderer.shadowMap.enabled = true
 renderer.shadowMap.type = THREE.PCFSoftShadowMap
 const scene = new THREE.Scene()
 scene.background = new THREE.Color('#080909')
 const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60)
 camera.position.set(0, 0.5, 10.8)
 camera.lookAt(0, 0.25, 0)
 // Local studio softboxes provide reflections without external HDR downloads.
 const environment = new RoomEnvironment()
 const softboxMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 6.5, 5.5) })
 for (const x of [-3, 3]) {
  const box = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 6), softboxMaterial)
  box.position.set(x, 1, 2); box.lookAt(0, 0, 0); environment.add(box)
 }
 const pmrem = new THREE.PMREMGenerator(renderer)
 const environmentTarget = pmrem.fromScene(environment, 0.04)
 scene.environment = environmentTarget.texture
 environment.dispose(); pmrem.dispose()
 scene.add(new THREE.AmbientLight(0xffffff, 0.3))
 const key = new THREE.SpotLight(0xfff3dc, 65, 30, Math.PI / 5, 0.9, 1.4)
 key.position.set(-3, 5, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.001; scene.add(key)
 const rim = new THREE.DirectionalLight(0xe2eaff, 2.5); rim.position.set(4, 2, -2); scene.add(rim)
 const warm = new THREE.DirectionalLight(0xffdfad, 2); warm.position.set(-4, 1, -3); scene.add(warm)
 // Two uplights: narrow near the floor, widening into a soft atmospheric wash.
 // Gaussian edges and a gradual vertical falloff avoid visible oval boundaries.
 const glows = new THREE.Group()
 for (const x of [-2.3, 2.3]) {
  const beamMaterial = new THREE.ShaderMaterial({
   uniforms: { uOpacity: { value: 1 }, uTint: { value: new THREE.Color('#d8cbb1') } },
   vertexShader: `
    varying vec2 vUv;
    void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
   fragmentShader: `
    varying vec2 vUv;
    uniform float uOpacity;
    uniform vec3 uTint;
    void main() {
     float height = (vUv.y - 0.1) / 0.9;
     float rise = max(height, 0.0);
     float width = 0.018 + rise * 0.34;
     float across = vUv.x - 0.5;
     float core = exp(-pow(across / width, 2.0) * 1.5);
     float haze = exp(-pow(across / (width * 2.8), 2.0));
     float base = smoothstep(0.0, 0.065, height);
     float top = 1.0 - smoothstep(0.65, 1.0, height);
     float falloff = exp(-rise * 2.7);
     float intensity = (core * 0.34 + haze * 0.10) * base * top * falloff;
     gl_FragColor = vec4(uTint, intensity * uOpacity);
    }`,
   transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(10, 11), beamMaterial)
  glow.position.set(x, 2.5, -4)
  glow.rotation.z = -Math.sign(x) * 0.1
  glows.add(glow)

  const uplight = new THREE.SpotLight(0xf1ddba, 14, 14, Math.PI / 5, 1, 2)
  uplight.position.set(x, -1.85, -2)
  uplight.target.position.set(Math.sign(x) * 0.6, 4, 0)
  scene.add(uplight, uplight.target)
  glow.userData.uplight = uplight
 }
 scene.add(glows)
 const platform = new THREE.Group()
 const stone = new THREE.MeshStandardMaterial({ color:0x010101, roughness:0.95, metalness:0, envMapIntensity:0 })
 const platformThickness = 0.36
 const slab = new THREE.Mesh(new RoundedBoxGeometry(10,platformThickness,3.6,3,0.045),stone); slab.receiveShadow=true; platform.add(slab)
 platform.position.set(0,-1.72,-0.5)
 const edge = new THREE.Mesh(new THREE.BoxGeometry(9.85,0.008,0.008),new THREE.MeshBasicMaterial({color:0x686963})); edge.position.set(0,platformThickness / 2 - 0.04,1.802); platform.add(edge); scene.add(platform)
 const bottle = new THREE.Group(); scene.add(bottle)
 const glass = new THREE.MeshPhysicalMaterial({ color:0xffffff, metalness:0, roughness:0.035, transmission:1, thickness:0.38, ior:1.52, clearcoat:1, clearcoatRoughness:0.025, attenuationColor:new THREE.Color('#e9eddf'), attenuationDistance:6, envMapIntensity:1.7 })
 const body = new THREE.Mesh(new RoundedBoxGeometry(1.92,2.7,0.85,6,0.105),glass); body.position.y=-0.15; body.castShadow=true; bottle.add(body)
 const base = new THREE.Mesh(new RoundedBoxGeometry(1.79,0.15,0.73,4,0.055),glass); base.position.y=-1.39; bottle.add(base)
 // Opaque absorption core is captured by the outer glass transmission pass.
 // Nested transmissive meshes otherwise disappear from Three.js refraction buffers.
 const liquidMaterial = new THREE.MeshPhysicalMaterial({color:editions[0].color,roughness:0.08,transmission:0,thickness:0.65,ior:1.33,attenuationColor:new THREE.Color('#bf771a'),attenuationDistance:2.8,envMapIntensity:0.2,clearcoat:0.12,metalness:0.08})
 const liquid = new THREE.Mesh(new RoundedBoxGeometry(1.69,2.06,0.64,5,0.07),liquidMaterial); liquid.position.y=-0.3; bottle.add(liquid)
 const meniscus = new THREE.Mesh(new THREE.BoxGeometry(1.57,0.015,0.54),liquidMaterial); meniscus.position.y=0.735; bottle.add(meniscus)
 const gold = new THREE.MeshStandardMaterial({color:0xd5b66f,metalness:0.95,roughness:0.2})
 const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.29,0.35,48),glass); neck.position.y=1.3; bottle.add(neck)
 const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.245,0.245,0.12,48),gold); collar.position.y=1.45; bottle.add(collar)
 const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,2.4,12),new THREE.MeshPhysicalMaterial({color:0xfff6dc,transparent:true,opacity:0.22,roughness:0.2})); stem.position.set(0,-0.05,-0.07); bottle.add(stem)
 const outline = new THREE.Shape()
 const points = [[-0.4,-0.26],[0.4,-0.26],[0.53,-0.13],[0.53,0.13],[0.4,0.26],[-0.4,0.26],[-0.53,0.13],[-0.53,-0.13]]
 points.forEach(([x,y],i)=>i?outline.lineTo(x,y):outline.moveTo(x,y)); outline.closePath()
 const capGeometry = new THREE.ExtrudeGeometry(outline,{depth:0.46,bevelEnabled:true,bevelThickness:0.07,bevelSize:0.07,bevelSegments:1,steps:1}); capGeometry.center()
 const cap = new THREE.Mesh(capGeometry,glass.clone()); cap.material.thickness=0.65; cap.position.y=1.88; bottle.add(cap)
 const core = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.17,0.25,32),glass); core.position.y=1.65; bottle.add(core)
 const labelCanvas = document.createElement('canvas'); labelCanvas.width=1024; labelCanvas.height=1100
 const ctx=labelCanvas.getContext('2d'); ctx.fillStyle='#faf8ef'; ctx.fillRect(0,0,1024,1100); ctx.strokeStyle='#27261f'; ctx.lineWidth=3; ctx.strokeRect(28,28,968,1044); ctx.fillStyle='#151512'; ctx.textAlign='center'
 ctx.font='110px Arial'; ctx.fillText('N°5',512,280); ctx.font='500 108px Arial'; ctx.fillText('CHANEL',512,455); ctx.font='44px Arial'; ctx.fillText('PARIS',512,550); ctx.font='35px Arial'; ctx.fillText('EAU DE PARFUM',512,885); ctx.font='27px Arial'; ctx.fillText('50 ml',512,962)
 const labelTexture=new THREE.CanvasTexture(labelCanvas); labelTexture.colorSpace=THREE.SRGBColorSpace; labelTexture.anisotropy=renderer.capabilities.getMaxAnisotropy()
 const label=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.23),new THREE.MeshBasicMaterial({map:labelTexture,toneMapped:false})); label.position.set(0,-0.04,0.44); bottle.add(label)
 const sideBottles = [1, 2].map(index => {
  const copy = bottle.clone(true)
  copy.children.forEach(child => {
   if (child.material === liquidMaterial) {
    child.material = liquidMaterial.clone()
    child.material.color.set(editions[index].color)
    child.material.attenuationColor.set(editions[index].absorption)
   }
  })
  scene.add(copy)
  return copy
 })
 const bottles = [bottle, ...sideBottles]
 const slots = [{ x: 0, destination: 0 }, { x: -1, destination: -1 }, { x: 1, destination: 1 }]
 let selected = 0
 const state={fall:0,cream:0,final:0,contact:0}
 const hero=document.querySelector('.hero-copy'), history=document.querySelector('.history-copy'), fragrance=document.querySelector('.fragrance-copy'), contact=document.querySelector('.contact-copy')
 const buttons = [...document.querySelectorAll('.bottle-choice')]
 buttons.forEach((button, index) => button.addEventListener('click', () => {
  if (index === selected || state.final < 0.95 || state.contact > 0.05) return
  const oldSlot = slots[index].destination
  slots[selected].destination = oldSlot
  slots[index].destination = 0
  gsap.to(slots[selected], { x: oldSlot, duration: reducedMotion ? 0 : 1.15, ease: 'power3.inOut', overwrite: true })
  gsap.to(slots[index], { x: 0, duration: reducedMotion ? 0 : 1.15, ease: 'power3.inOut', overwrite: true })
  selected = index
  buttons.forEach((item, i) => item.setAttribute('aria-pressed', String(i === selected)))
  document.querySelector('.selected-name').textContent = editions[index].name
  document.querySelector('.selected-note').textContent = editions[index].note
 }))
 gsap.set([history,fragrance,contact],{autoAlpha:0})
 const timeline=gsap.timeline({scrollTrigger:{trigger:'.experience',start:'top top',end:'bottom bottom',scrub:reducedMotion?true:1.15,onUpdate:({progress})=>{
  document.querySelector('.chapter-track i').style.transform=`scaleY(${progress})`
  document.querySelector('.chapter-current').textContent=progress<0.3?'01':progress<0.56?'02':progress<0.9?'03':'04'
 }}})
 timeline.to(hero,{autoAlpha:0,y:-35,duration:0.13},0.04)
 .to(state,{fall:1,duration:0.24,ease:'power2.inOut'},0.1)
 .to(state,{cream:1,duration:0.2,ease:'sine.inOut'},0.14)
 .fromTo(history,{autoAlpha:0,y:30},{autoAlpha:1,y:0,duration:0.07},0.34)
 .to(history,{autoAlpha:0,y:-25,duration:0.06},0.52)
 .to(state,{cream:0,final:1,duration:0.16,ease:'sine.inOut'},0.56)
 .fromTo(fragrance,{autoAlpha:0},{autoAlpha:1,duration:0.1},0.59)
 .to(fragrance,{autoAlpha:0,duration:0.07},0.87)
 .to(state,{contact:1,duration:0.1,ease:'sine.inOut'},0.88)
 .fromTo(contact,{autoAlpha:0,y:25},{autoAlpha:1,y:0,duration:0.07},0.93)
 .to({},{duration:0.01},0.99)
 const lenis=reducedMotion?null:new Lenis({lerp:0.085,smoothWheel:true,anchors:true})
 lenis?.on('scroll',ScrollTrigger.update)
 gsap.ticker.add(time=>lenis?.raf(time*1000)); gsap.ticker.lagSmoothing(0)
 let mobile=false
 function resize(){mobile=innerWidth<760;camera.aspect=innerWidth/innerHeight;camera.position.z=mobile?Math.max(12,6.5/camera.aspect):Math.max(10.8,6.3/camera.aspect);camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
 addEventListener('resize',resize);resize()
 const dark=new THREE.Color('#080909'), cream=new THREE.Color('#eee8db'), white=new THREE.Color('#faf9f6'), ink=new THREE.Color('#f6f2e9'), darkInk=new THREE.Color('#26241f'), currentInk=new THREE.Color()
 const projected = new THREE.Vector3()
 const pointer={x:0,y:0};let pointerX=0,pointerY=0
 addEventListener('pointermove',e=>{pointer.x=e.clientX/innerWidth-0.5;pointer.y=e.clientY/innerHeight-0.5})
 renderer.setAnimationLoop(()=>{
  const {fall,final,cream:light,contact:outro}=state
  scene.background.copy(dark).lerp(cream,light).lerp(white,outro);currentInk.copy(ink).lerp(darkInk,Math.max(light,outro));document.documentElement.style.setProperty('--ink',`#${currentInk.getHexString()}`)
  const arc=Math.sin(fall*Math.PI)
  // One forward somersault, returning exactly to the front-facing pose.
  bottle.rotation.x=reducedMotion?0:fall*Math.PI*2
  bottle.rotation.y=-0.13*(1-fall)
  bottle.rotation.z=reducedMotion?0:Math.sin(fall*Math.PI*2)*0.1
  bottle.position.set(0,-0.11-arc*0.85,arc*1.3)
  const scale=mobile?0.83-light*0.13:1-light*0.04
  bottle.scale.setScalar(scale)
  platform.position.y=-0.5+fall*0.39-1.5*scale-platformThickness/2-fall*3.3;platform.position.z=-0.5-fall*2;platform.visible=fall<0.98
  glows.children.forEach(glow=>{
   const strength = (1-light) * (1-outro)
   glow.material.uniforms.uOpacity.value = strength
   glow.userData.uplight.intensity = 14 * strength
  });key.intensity=65+light*20
  pointerX+=(pointer.x-pointerX)*0.035;pointerY+=(pointer.y-pointerY)*0.035
  camera.position.x=reducedMotion?0:pointerX*0.12;camera.position.y=0.5+(reducedMotion?0:pointerY*0.07);camera.lookAt(0,0.25,0)
  // Size the collection from the actual frame, so all three bottles stay inside it.
  const frame = document.querySelector('.collection-frame').getBoundingClientRect()
  const worldHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
  const unitsPerPixel = worldHeight / innerHeight
  const collectionScale = Math.min(frame.height * unitsPerPixel / 4.8, frame.width * unitsPerPixel / 8.8)
  const spacing = frame.width * unitsPerPixel * 0.29
  const collectionY = 0.25 + (innerHeight / 2 - (frame.top + frame.height / 2)) * unitsPerPixel - collectionScale * 0.2
  bottles.forEach((item, index) => {
   item.visible = outro < 0.98 && (index === 0 || final > 0.001)
   item.position.x = slots[index].x * spacing * final
   item.position.y = THREE.MathUtils.lerp(-0.5 + fall * 0.39 - arc * 0.85, collectionY, final) - outro * 3
   item.position.z = index === 0 ? arc * 1.3 : -0.08
   item.scale.setScalar(THREE.MathUtils.lerp(index === 0 ? scale : 0.01, collectionScale * (1 - Math.abs(slots[index].x) * 0.08), final) * (1 - outro))
   if (index > 0) item.rotation.set(Math.PI * 2, -slots[index].x * 0.08, 0)
   projected.copy(item.position).project(camera)
   buttons[index].style.left = `${((projected.x + 1) * innerWidth / 2 - frame.left) / frame.width * 100}%`
  })
  renderer.render(scene,camera)
 })
 document.addEventListener('visibilitychange',()=>{if(document.hidden)lenis?.stop();else lenis?.start()})
 ScrollTrigger.refresh()
}

