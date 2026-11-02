import assert from 'node:assert/strict'
import * as THREE from 'three'
import { bottlePose } from '../src/motion.js'

const start = bottlePose(0, 1, false)
const end = bottlePose(1, 1, false)
assert.equal(start.rx, 0)
assert.equal(end.rx, Math.PI * 2)
assert(Math.abs(end.z) < 1e-10)
assert(Math.abs(end.y + 0.11) < 1e-10)
let previousAngle = 0
for (let i = 0; i <= 1000; i++) {
  const pose = bottlePose(i / 1000, 1, false)
  assert(Object.values(pose).every(Number.isFinite))
  assert(pose.rx >= previousAngle, 'Forward somersault must not reverse direction')
  previousAngle = pose.rx
  assert.equal(bottlePose(i / 1000, 1, true).rx, 0, 'Reduced motion must omit the somersault')
}
for (const [width, height] of [[1440, 1000], [1366, 768], [768, 1024], [390, 844], [360, 640]]) {
  const aspect = width / height
  const camera = new THREE.PerspectiveCamera(32, aspect, 0.1, 60)
  const distance = width < 760 ? Math.max(12, 6.5 / aspect) : Math.max(10.8, 6.3 / aspect)
  const scale = width < 760 ? 0.83 : 1
  let worst = 0
  for (let i = 0; i <= 200; i++) {
    const progress = i / 200
    const pose = bottlePose(progress, scale, false)
    const framing = Math.sin(progress * Math.PI)
    camera.position.set(0, 0.5 - framing * 0.55, distance + framing * 1.6)
    camera.lookAt(0, 0.25 - framing * 0.55, 0)
    camera.updateMatrixWorld()
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(pose.x, pose.y, pose.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(pose.rx, pose.ry, pose.rz)),
      new THREE.Vector3(scale, scale, scale),
    )
    // A conservative box containing the full bottle, including the glass stopper.
    for (const x of [-0.96, 0.96]) for (const y of [-1.5, 2.21]) for (const z of [-0.425, 0.425]) {
      const point = new THREE.Vector3(x, y, z).applyMatrix4(matrix).project(camera)
      worst = Math.max(worst, Math.abs(point.x), Math.abs(point.y))
    }
  }
  assert(worst < 0.98, `${width}×${height}: bottle leaves viewport (${worst.toFixed(3)})`)
  console.log(`${width}×${height}: whole bottle stays visible throughout somersault (${worst.toFixed(3)})`)
}
console.log('One forward turn, exact landing, finite poses, and reduced motion passed.')
