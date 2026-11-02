// Run against a local Edge/Chrome instance started with --remote-debugging-port=9224.
// No browser automation package or application test hooks are required.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'

const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:5173/'
const port = process.env.DEBUG_PORT || 9224
const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
const socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
let nextId = 0
const pending = new Map()
const errors = []
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id) }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error' && /THREE|WebGL|GL_INVALID|shader/i.test(message.params.entry.text)) errors.push(message.params.entry.text)
})
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId
    const timer = setTimeout(() => reject(Error(`${method} timed out`)), 30000)
    pending.set(id, message => {
      clearTimeout(timer)
      if (message.error) reject(Error(JSON.stringify(message.error)))
      else resolve(message.result)
    })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function evaluate(expression) {
  const { result, exceptionDetails } = await call('Runtime.evaluate', { expression, returnByValue: true })
  assert(!exceptionDetails, JSON.stringify(exceptionDetails))
  return result.value
}
async function scroll(progress) {
  await evaluate(`scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ${progress})`)
  await wait(2000)
}
await fs.mkdir('.artifacts', { recursive: true })
async function screenshot(name) {
  const { data } = await call('Page.captureScreenshot', { format: 'png' })
  await fs.writeFile(`.artifacts/${name}.png`, Buffer.from(data, 'base64'))
}
try {
  await call('Runtime.enable')
  await call('Log.enable')
  await call('Page.enable')
  for (const [name, width, height, reduced] of [
    ['desktop', 1440, 1000, false],
    ['mobile', 390, 844, false],
    ['small', 360, 640, true],
  ]) {
    if (process.env.VERIFY_DEVICE && process.env.VERIFY_DEVICE !== name) continue
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 760 })
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] })
    await call('Page.navigate', { url: origin })
    await wait(3500)
    await scroll(0)
    assert.equal(await evaluate("document.querySelector('.render-fallback').hidden"), true)
    await screenshot(`${name}-hero`)
    if (name === 'desktop') {
      for (const [label, progress] of [['tip', 0.03], ['flight', 0.072], ['settle', 0.12]]) {
        await scroll(progress)
        await screenshot(label)
      }
    }
    await scroll(0.19)
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.history-copy')).visibility"), 'visible')
    assert(await evaluate("Number(getComputedStyle(document.querySelector('.history-copy')).opacity) > 0.98"), `${name}: history text remains faded`)
    assert(await evaluate("['.history-left', '.history-right'].every(selector => { const element=document.querySelector(selector);const r=element.getBoundingClientRect();return r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight&&getComputedStyle(element).visibility==='visible'})"), `${name}: history columns are missing or outside viewport`)
    await screenshot(`${name}-history`)
    for (const [label, progress, selector] of [
      ['macro', 0.35, '.macro-copy'],
      ['top-notes', 0.47, '[data-note="top"]'],
      ['heart-notes', 0.555, '[data-note="heart"]'],
      ['base-notes', 0.64, '[data-note="base"]'],
      ['spray', 0.735, '.spray-copy'],
    ]) {
      await scroll(progress)
      assert(await evaluate(`Number(getComputedStyle(document.querySelector('${selector}')).opacity) > 0.98`), `${name}: ${label} is hidden`)
      await screenshot(`${name}-${label}`)
    }
    assert(await evaluate('(document.documentElement.scrollHeight-innerHeight)*0.125 < innerHeight*0.8'), `${name}: initial fall requires too much scrolling`)
    await scroll(0.88)
    const positions = () => evaluate("[...document.querySelectorAll('.bottle-choice')].map(button => ({x: parseFloat(button.style.left), pressed: button.getAttribute('aria-pressed')}))")
    const before = await positions()
    await evaluate("document.querySelector('[data-edition=\"1\"]').click()")
    await wait(1750)
    const after = await positions()
    assert(Math.abs(after[1].x - before[0].x) < 1, `${name}: selected bottle did not take centre`)
    assert(Math.abs(after[0].x - before[1].x) < 2, `${name}: previous bottle did not take side position`)
    assert.equal(after[1].pressed, 'true')
    await screenshot(`${name}-collection`)
    await evaluate("document.querySelector('[data-edition=\"2\"]').click();document.querySelector('[data-edition=\"0\"]').click()")
    await wait(1750)
    const rapid = await positions()
    assert(Math.abs(rapid[0].x - before[0].x) < 1, `${name}: rapid selection failed`)
    assert(Math.abs(rapid[1].x - rapid[2].x) > 45, `${name}: rapid selections left overlapping bottles`)
    assert(await evaluate("[...document.querySelectorAll('.bottle-choice')].every(button => {const r=button.getBoundingClientRect();const f=document.querySelector('.collection-frame').getBoundingClientRect();return r.left>=f.left&&r.right<=f.right})"), `${name}: controls escaped frame`)
    await scroll(1)
    await screenshot(`${name}-contacts`)
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.contact-copy')).visibility"), 'visible')
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, `${name}: horizontal overflow`)
    assert.equal(await evaluate("[...document.querySelectorAll('a')].some(a => /chanel\.(com|ru)/i.test(a.href))"), false)
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.contact-copy')).backgroundColor"), 'rgb(222, 216, 206)', `${name}: contact backdrop is not the matte warm tone`)
    await scroll(0.19)
    assert(await evaluate("Number(getComputedStyle(document.querySelector('.history-copy')).opacity) > 0.98"), `${name}: history disappears on reverse scroll`)
    await scroll(0)
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-copy')).visibility"), 'visible')
    console.log(`${name}: scroll scenes, swaps, rapid selection, frame bounds, contacts and reverse scroll passed`)
  }
  assert.equal(errors.length, 0, JSON.stringify(errors))
  console.log('No JavaScript exceptions or WebGL shader errors.')
} finally { socket.close() }
