import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createBottle } from './bottle.js'
import { createParticles } from './particles.js'
import { bottlePose } from './motion.js'
import { createAroma, createSpray } from './aroma.js'

gsap.registerPlugin(ScrollTrigger)

export function createExperience(editions, reducedMotion) {
  const compactDevice = matchMedia('(max-width: 759px)').matches
  const canvas = document.querySelector('.stage canvas')
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  } catch {
    document.querySelector('.render-fallback').hidden = false
    document.body.classList.add('without-webgl')
    return
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, compactDevice ? 1.35 : 1.65))
  renderer.transmissionResolutionScale = compactDevice ? 0.75 : 1
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.95
  renderer.shadowMap.enabled = !compactDevice
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene()
  const dark = new THREE.Color('#07090a')
  const cream = new THREE.Color('#eee8db')
  const white = new THREE.Color('#ded8ce')
  scene.background = dark.clone()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60)
  const environment = new RoomEnvironment()
  const softboxMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.1, 2.8) })
  for (const x of [-3, 3]) {
    const box = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 6), softboxMaterial)
    box.position.set(x, 1, 2)
    box.lookAt(0, 0, 0)
    environment.add(box)
  }
  const pmrem = new THREE.PMREMGenerator(renderer)
  const environmentTarget = pmrem.fromScene(environment, 0.035)
  scene.environment = environmentTarget.texture
  environment.dispose()
  pmrem.dispose()
  scene.add(new THREE.AmbientLight(0xffffff, 0.22))
  const key = new THREE.SpotLight(0xfff3df, 35, 30, Math.PI / 5, 0.95, 1.5)
  key.position.set(-3, 5, 5)
  key.castShadow = !compactDevice
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.bias = -0.001
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xdce7f0, 1.7)
  rim.position.set(4, 2, -2)
  scene.add(rim)
  const warm = new THREE.DirectionalLight(0xffdfad, 1.4)
  warm.position.set(-4, 1, -3)
  scene.add(warm)

  const beams = new THREE.Group()
  for (const x of [-2.3, 2.3]) {
    const material = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 }, uTime: { value: 0 }, uSide: { value: Math.sign(x) } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        uniform float uTime;
        uniform float uSide;
        void main() {
          float h = (vUv.y - 0.1) / 0.9;
          float rise = max(h, 0.0);
          float width = 0.02 + rise * 0.34;
          float x = vUv.x - 0.5 + sin(rise * 3.0 + uTime * 0.1 + uSide) * 0.008 * rise;
          float core = exp(-pow(x / width, 2.0) * 1.5);
          float haze = exp(-pow(x / (width * 2.8), 2.0));
          float fade = smoothstep(0.0, 0.07, h) * (1.0 - smoothstep(0.65, 1.0, h)) * exp(-rise * 2.6);
          gl_FragColor = vec4(vec3(0.74, 0.68, 0.55), (core * 0.28 + haze * 0.09) * fade * uOpacity);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(10, 11), material)
    beam.position.set(x, 2.5, -4)
    beam.rotation.z = -Math.sign(x) * 0.1
    beams.add(beam)
    const uplight = new THREE.SpotLight(0xf1ddba, 9, 14, Math.PI / 5, 1, 2)
    uplight.position.set(x, -1.85, -2)
    uplight.target.position.set(Math.sign(x) * 0.6, 4, 0)
    scene.add(uplight, uplight.target)
    beam.userData.uplight = uplight
  }
  scene.add(beams)
  const dust = createParticles(renderer, compactDevice, reducedMotion)
  scene.add(dust)
  const aroma = createAroma(compactDevice, reducedMotion)
  const spray = createSpray(renderer, compactDevice)
  scene.add(aroma.group, spray)

  const platform = new THREE.Group()
  const platformThickness = 0.36
  // A very matte, almost black slab with a fine reflective front edge.
  const stone = new THREE.MeshPhysicalMaterial({ color: '#111416', roughness: 0.9, metalness: 0, specularIntensity: 0.1, envMapIntensity: 0.03 })
  const slab = new THREE.Mesh(new RoundedBoxGeometry(10, platformThickness, 3.6, 4, 0.045), stone)
  slab.receiveShadow = true
  platform.add(slab)
  const edge = new THREE.Mesh(new THREE.BoxGeometry(9.85, 0.008, 0.008), new THREE.MeshBasicMaterial({ color: '#4c4f48' }))
  edge.position.set(0, platformThickness / 2 - 0.04, 1.802)
  platform.add(edge)
  scene.add(platform)
  const bottles = editions.map(edition => createBottle(renderer, edition))
  bottles.forEach(bottle => scene.add(bottle))
  const slots = [0, -1, 1].map(x => ({ x, destination: x, z: 0, progress: 1, hover: 0 }))
  const state = {
    fall: 0, cream: 0, final: 0, contact: 0, reveal: reducedMotion ? 1 : 0,
    heroOpacity: 1, historyOpacity: 0, collectionOpacity: 0, contactOpacity: 0,
    macro: 0, macroTravel: 0, macroOpacity: 0, notesOpacity: 0,
    top: 0, heart: 0, base: 0, sprayOpacity: 0, sprayProgress: 0, capLift: 0,
  }
  const hero = document.querySelector('.hero-copy')
  const history = document.querySelector('.history-copy')
  const fragrance = document.querySelector('.fragrance-copy')
  const contact = document.querySelector('.contact-copy')
  const macro = document.querySelector('.macro-copy')
  const notes = document.querySelector('.aroma-copy')
  const sprayPanel = document.querySelector('.spray-copy')
  const notePanels = [...document.querySelectorAll('.aroma-panel')]
  const noteSteps = [...document.querySelectorAll('[data-note-step]')]
  const frameElement = document.querySelector('.collection-frame')
  const buttons = [...document.querySelectorAll('.bottle-choice')]
  const caption = document.querySelector('.selection-caption')
  const chapterTrack = document.querySelector('.chapter-track i')
  const chapterCurrent = document.querySelector('.chapter-current')
  let selected = 0
  let sprayPlayed = false

  function travel(index, destination, front) {
    const slot = slots[index]
    gsap.killTweensOf(slot)
    slot.destination = destination
    const startZ = slot.z
    slot.progress = 0
    gsap.to(slot, {
      x: destination, progress: 1, duration: reducedMotion ? 0 : 1.3, ease: 'power2.inOut',
      onUpdate: () => {
        slot.z = reducedMotion ? 0 : THREE.MathUtils.lerp(startZ, 0, slot.progress) + Math.sin(slot.progress * Math.PI) * (front ? 0.65 : -0.85)
      },
      onComplete: () => { slot.z = 0 },
    })
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      if (index === selected || state.final < 0.98 || state.contact > 0.02) return
      const destination = slots[index].destination
      travel(selected, destination, false)
      travel(index, 0, true)
      selected = index
      buttons.forEach((item, i) => item.setAttribute('aria-pressed', String(i === selected)))
      gsap.killTweensOf(caption)
      gsap.to(caption, { opacity: 0, y: 5, duration: reducedMotion ? 0 : 0.16, onComplete: () => {
        document.querySelector('.selected-name').textContent = editions[selected].name
        document.querySelector('.selected-note').textContent = editions[selected].note
        gsap.to(caption, { opacity: 1, y: 0, duration: reducedMotion ? 0 : 0.4 })
      } })
    })
    for (const [event, value] of [['pointerenter', 1], ['pointerleave', 0], ['focus', 1], ['blur', 0]]) {
      button.addEventListener(event, () => gsap.to(slots[index], { hover: value, duration: reducedMotion ? 0 : 0.4, overwrite: 'auto' }))
    }
  })

  gsap.set([history, macro, notes, sprayPanel, fragrance, contact], { autoAlpha: 0 })
  const timeline = gsap.timeline({ scrollTrigger: {
    trigger: '.experience', start: 'top top', end: 'bottom bottom', scrub: reducedMotion ? true : 0.35,
    onUpdate: ({ progress }) => {
      chapterTrack.style.transform = `scaleY(${progress})`
      chapterCurrent.textContent = progress < 0.13 ? '01' : progress < 0.28 ? '02' : progress < 0.43 ? '03' : progress < 0.69 ? '04' : progress < 0.80 ? '05' : progress < 0.96 ? '06' : '07'
    },
  } })
  // Each panel has one visibility value. No competing fromTo/autoAlpha writes
  // can leave the history hidden when seeking or reversing the scroll timeline.
  timeline.to(state, { heroOpacity: 0, duration: 0.045, ease: 'sine.inOut' }, 0.005)
    .to(state, { fall: 1, duration: 0.1125, ease: 'none' }, 0.0125)
    .to(state, { cream: 1, duration: 0.085, ease: 'sine.inOut' }, 0.04)
    .to(state, { historyOpacity: 1, duration: 0.025 }, 0.13)
    .to(state, { historyOpacity: 0, duration: 0.03 }, 0.25)
    .to(state, { cream: 0, duration: 0.04, ease: 'sine.inOut' }, 0.27)
    .to(state, { macro: 1, duration: 0.05, ease: 'sine.inOut' }, 0.27)
    .to(state, { macroOpacity: 1, duration: 0.025 }, 0.30)
    .to(state, { macroTravel: 1, duration: 0.065, ease: 'none' }, 0.325)
    .to(state, { macroOpacity: 0, duration: 0.025 }, 0.395)
    .to(state, { macro: 0, duration: 0.04, ease: 'sine.inOut' }, 0.39)
    .to(state, { notesOpacity: 1, top: 1, duration: 0.025 }, 0.43)
    .to(state, { top: 0, duration: 0.025 }, 0.505)
    .to(state, { heart: 1, duration: 0.025 }, 0.515)
    .to(state, { heart: 0, duration: 0.025 }, 0.585)
    .to(state, { base: 1, duration: 0.025 }, 0.595)
    .to(state, { base: 0, notesOpacity: 0, duration: 0.02 }, 0.655)
    .to(state, { capLift: 1, duration: 0.012, ease: 'power2.inOut' }, 0.663)
    .to(state, { sprayOpacity: 1, duration: 0.008 }, 0.675)
    .to(state, { sprayOpacity: 0, duration: 0.025 }, 0.765)
    .to(state, { capLift: 0, duration: 0.025, ease: 'sine.inOut' }, 0.77)
    .to(state, { final: 1, duration: 0.065, ease: 'sine.inOut' }, 0.79)
    .to(state, { collectionOpacity: 1, duration: 0.03 }, 0.815)
    .to(state, { collectionOpacity: 0, duration: 0.025 }, 0.925)
    .to(state, { contact: 1, duration: 0.045, ease: 'sine.inOut' }, 0.945)
    .to(state, { contactOpacity: 1, duration: 0.035 }, 0.965)

  if (!reducedMotion) {
    gsap.to(state, { reveal: 1, duration: 1.8, ease: 'power2.out' })
    gsap.from(canvas, { opacity: 0, duration: 1.4, ease: 'sine.out' })
    gsap.from('.hero-title-letter', { yPercent: 105, opacity: 0, duration: 1.4, stagger: 0.06, ease: 'power3.out', delay: 0.1 })
    gsap.from('.hero-caption, .hero-eyebrow, .side-caption, .edition', { opacity: 0, y: 12, duration: 1.2, stagger: 0.09, delay: 0.55, ease: 'power2.out' })
  }
  const lenis = reducedMotion ? null : new Lenis({ lerp: 0.16, wheelMultiplier: 1.15, smoothWheel: true, anchors: true })
  lenis?.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(time => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  let mobile, baseDistance, frame
  function resize() {
    mobile = innerWidth < 760
    camera.aspect = innerWidth / innerHeight
    baseDistance = mobile ? Math.max(12, 6.5 / camera.aspect) : Math.max(10.8, 6.3 / camera.aspect)
    camera.position.set(0, 0.5, baseDistance)
    camera.lookAt(0, 0.25, 0)
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
    frame = frameElement.getBoundingClientRect()
  }
  addEventListener('resize', resize)
  const frameObserver = new ResizeObserver(() => { frame = frameElement.getBoundingClientRect() })
  frameObserver.observe(frameElement)
  resize()
  const ink = new THREE.Color('#f6f2e9'), darkInk = new THREE.Color('#26241f'), currentInk = new THREE.Color()
  const pointer = new THREE.Vector2(), smoothPointer = new THREE.Vector2()
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches
  addEventListener('pointermove', event => {
    if (!canHover) return
    pointer.set(event.clientX / innerWidth - 0.5, event.clientY / innerHeight - 0.5)
  })
  document.documentElement.addEventListener('pointerleave', () => pointer.set(0, 0))
  const projected = new THREE.Vector3()
  const detailPoint = new THREE.Vector3()
  const macroCamera = new THREE.Vector3(), macroTarget = new THREE.Vector3()
  const normalTarget = new THREE.Vector3()
  const nozzlePoint = new THREE.Vector3()
  const detailPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.75, -0.25, 0.35),
    new THREE.Vector3(0.35, 0.6, 0.3),
    new THREE.Vector3(0, 1.4, 0),
    new THREE.Vector3(0, 0.1, 0.44),
  ])
  let elapsed = 0, previousTime = 0, previousInk = ''

  function render(milliseconds) {
    const dt = previousTime ? Math.min((milliseconds - previousTime) / 1000, 0.05) : 1 / 60
    previousTime = milliseconds
    elapsed += dt
    const { fall, final, cream: light, contact: outro, reveal } = state
    // Enter once, then play the whole burst in real time even if scrolling stops.
    if (!sprayPlayed && state.sprayOpacity > 0.15 && state.capLift > 0.9) {
      sprayPlayed = true
      gsap.to(state, { sprayProgress: 1, duration: reducedMotion ? 0 : 1.15, ease: 'power1.out', overwrite: 'auto' })
    } else if (sprayPlayed && state.sprayOpacity < 0.002 && state.capLift < 0.01) {
      gsap.killTweensOf(state, 'sprayProgress')
      state.sprayProgress = 0
      sprayPlayed = false
    }
    for (const [panel, opacity] of [
      [hero, state.heroOpacity], [history, state.historyOpacity],
      [fragrance, state.collectionOpacity], [contact, state.contactOpacity],
      [macro, state.macroOpacity], [notes, state.notesOpacity], [sprayPanel, state.sprayOpacity],
    ]) {
      panel.style.opacity = opacity
      panel.style.visibility = opacity > 0.001 ? 'visible' : 'hidden'
    }
    notePanels.forEach(panel => {
      const opacity = state[panel.dataset.note]
      panel.style.opacity = opacity
      panel.style.visibility = opacity > 0.001 ? 'visible' : 'hidden'
    })
    noteSteps.forEach(step => step.classList.toggle('is-active', state[step.dataset.noteStep] > 0.5))
    scene.background.copy(dark).lerp(cream, light).lerp(white, outro)
    currentInk.copy(ink).lerp(darkInk, Math.max(light, outro))
    const inkHex = currentInk.getHexString()
    if (inkHex !== previousInk) {
      document.documentElement.style.setProperty('--ink', `#${inkHex}`)
      previousInk = inkHex
    }
    const atmosphere = (1 - light) * (1 - outro) * reveal * (1 - state.macro * 0.65)
    beams.children.forEach(beam => {
      beam.material.uniforms.uOpacity.value = atmosphere
      beam.material.uniforms.uTime.value = reducedMotion ? 0 : elapsed
      beam.userData.uplight.intensity = 9 * atmosphere
    })
    dust.material.uniforms.uTime.value = elapsed
    dust.material.uniforms.uOpacity.value = atmosphere * 0.8
    dust.visible = atmosphere > 0.005
    key.intensity = 35 + light * 15
    smoothPointer.lerp(pointer, 1 - Math.exp(-dt * 3.5))
    const flightFraming = reducedMotion ? 0 : Math.sin(fall * Math.PI)
    const cameraFollow = -flightFraming * 0.55
    camera.position.set(reducedMotion ? 0 : smoothPointer.x * 0.11, 0.5 + cameraFollow + (reducedMotion ? 0 : smoothPointer.y * 0.06), baseDistance + flightFraming * 1.6)
    normalTarget.set(0, 0.25 + cameraFollow, 0)
    detailPath.getPoint(state.macroTravel, detailPoint)
    macroTarget.copy(detailPoint)
    macroTarget.x -= mobile ? 0 : 0.85
    macroTarget.y -= mobile ? 0.6 : 0
    macroCamera.copy(macroTarget).add(new THREE.Vector3(mobile ? 0.3 : 0.55, 0.15, mobile ? 5.5 : 3.8))
    camera.position.lerp(macroCamera, reducedMotion ? state.macro * 0.5 : state.macro)
    normalTarget.lerp(macroTarget, reducedMotion ? state.macro * 0.5 : state.macro)
    camera.lookAt(normalTarget)
    camera.updateMatrixWorld()
    key.position.x = -3 + state.macro * (1 + state.macroTravel * 2.5)

    const scale = mobile ? 0.83 - light * (innerHeight < 700 ? 0.23 : 0.13) : 1 - light * 0.04
    const pose = bottlePose(fall, scale, reducedMotion)
    const leave = THREE.MathUtils.smoothstep(fall, 0.23, 0.8)
    platform.position.set(0, -0.5 - 1.5 * scale - platformThickness / 2 - leave * 3, -0.5 - leave * 1.3)
    platform.visible = fall < 0.8 && outro < 0.01
    const unitsPerPixel = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / innerHeight
    const collectionScale = Math.min(frame.height * unitsPerPixel / 5.3, frame.width * unitsPerPixel / (mobile ? 8.4 : 9.5))
    const spacing = frame.width * unitsPerPixel * 0.285
    const collectionY = 0.25 + (innerHeight / 2 - (frame.top + frame.height / 2)) * unitsPerPixel - collectionScale * 0.2
    const emerged = THREE.MathUtils.smootherstep(final, 0.06, 1)
    const idle = reducedMotion ? 0 : Math.sin(elapsed * 0.7) * 0.018 * light
    const notesAmount = state.notesOpacity
    aroma.group.position.set(mobile ? 0 : -1.1, mobile ? 0.85 : 0, 0)
    aroma.group.scale.setScalar(mobile ? 0.55 : 0.95)
    aroma.update(elapsed, { top: state.top * notesAmount, heart: state.heart * notesAmount, base: state.base * notesAmount })
    bottles.forEach((item, index) => {
      const slot = slots[index]
      const side = Math.min(1, Math.abs(slot.x))
      const entry = index === 0 ? final : emerged
      item.visible = outro < 0.995 && (index === 0 || final > 0.005)
      // Side bottles start full size behind the centre and fan out as the background darkens.
      const initialScale = index === 0 ? scale : scale * 0.91
      const targetScale = collectionScale * (1.04 - side * 0.14 + slot.hover * 0.015)
      item.scale.setScalar(THREE.MathUtils.lerp(initialScale, targetScale, final) * (1 - outro * 0.9))
      item.position.set(
        THREE.MathUtils.lerp(pose.x, slot.x * spacing, entry),
        THREE.MathUtils.lerp(pose.y + idle, collectionY + slot.hover * 0.025, final) - outro * 2.2,
        THREE.MathUtils.lerp(index === 0 ? pose.z : -0.8, -side * 0.16 + slot.z, final),
      )
      item.rotation.set(
        THREE.MathUtils.lerp(pose.rx, Math.PI * 2, final),
        THREE.MathUtils.lerp(pose.ry, -slot.x * 0.075, final),
        pose.rz * (1 - final),
      )
      if (index === 0) {
        item.position.x = THREE.MathUtils.lerp(item.position.x, mobile ? 0 : -1.1, notesAmount)
        item.position.y = THREE.MathUtils.lerp(item.position.y, mobile ? 0.85 : 0, notesAmount)
        item.scale.setScalar(THREE.MathUtils.lerp(item.scale.x, mobile ? 0.57 : 0.86, notesAmount))
        const sprayAmount = Math.max(state.sprayOpacity, state.capLift)
        item.position.x = THREE.MathUtils.lerp(item.position.x, mobile ? 0 : -0.45, sprayAmount)
        item.position.y = THREE.MathUtils.lerp(item.position.y, mobile ? 0.85 : -0.3, sprayAmount)
        item.scale.setScalar(THREE.MathUtils.lerp(item.scale.x, mobile ? 0.65 : 0.9, sprayAmount))
        item.rotation.y += sprayAmount * 0.65
        item.userData.stopper.position.y = 1.88 + state.capLift * 1.4
        item.userData.stopperStem.position.y = 1.65 + state.capLift * 1.4
        item.userData.stopper.rotation.z = reducedMotion ? 0 : state.capLift * -0.12
        item.userData.atomizer.position.y = 1.59 - Math.sin(state.sprayProgress * Math.PI) * 0.025
      }
      if (index > 0 && final < 0.005) item.visible = false
      item.userData.surface.rotation.z = reducedMotion ? 0 : Math.sin(pose.rx) * 0.035 * (1 - final)
      projected.copy(item.position).project(camera)
      buttons[index].style.left = `${((projected.x + 1) * innerWidth / 2 - frame.left) / frame.width * 100}%`
    })
    spray.visible = state.sprayOpacity > 0.002
    bottles[0].updateMatrixWorld()
    bottles[0].userData.nozzle.getWorldPosition(nozzlePoint)
    spray.position.copy(nozzlePoint)
    spray.rotation.y = -0.65
    spray.scale.setScalar(bottles[0].scale.x)
    spray.material.uniforms.uOpacity.value = state.sprayOpacity
    spray.material.uniforms.uProgress.value = reducedMotion ? 0.45 : state.sprayProgress
    renderer.render(scene, camera)
  }
  renderer.setAnimationLoop(render)
  document.addEventListener('visibilitychange', () => {
    previousTime = 0
    if (document.hidden) { lenis?.stop(); renderer.setAnimationLoop(null) }
    else { lenis?.start(); renderer.setAnimationLoop(render) }
  })
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault()
    renderer.setAnimationLoop(null)
    document.querySelector('.render-fallback').hidden = false
  })
  canvas.addEventListener('webglcontextrestored', () => {
    document.querySelector('.render-fallback').hidden = true
    previousTime = 0
    renderer.setAnimationLoop(render)
  })
  ScrollTrigger.refresh()
}
