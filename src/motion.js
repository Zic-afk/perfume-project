import * as THREE from 'three'

const smooth = (a, b, value) => THREE.MathUtils.smootherstep(value, a, b)
const turn = Math.PI * 2

// A forward tip about the lower front edge, followed by one continuous tumble.
// Both position and angular velocity settle to zero at the final front-facing pose.
export function bottlePose(progress, scale, reducedMotion) {
  if (reducedMotion) return { x: 0, y: THREE.MathUtils.lerp(-0.5, -0.11, progress), z: 0, rx: 0, ry: 0, rz: 0 }
  const tip = smooth(0, 0.22, progress)
  const flight = smooth(0.22, 1, progress)
  const rx = progress < 0.22 ? tip * 0.52 : 0.52 + flight * (turn - 0.52)
  const pivot = new THREE.Vector3(0, -1.5 * scale, 0.425 * scale)
  pivot.applyAxisAngle(new THREE.Vector3(1, 0, 0), tip * 0.52)
  const tipY = -0.5 - 1.5 * scale - pivot.y
  const tipZ = 0.425 * scale + tip * 0.85 - pivot.z
  const arc = Math.sin(flight * Math.PI)
  return {
    x: Math.sin(flight * Math.PI * 2) * 0.055,
    y: THREE.MathUtils.lerp(tipY, -0.11, flight) - arc * 0.5,
    z: THREE.MathUtils.lerp(tipZ, 0, flight) + arc * 0.26,
    rx,
    ry: -0.1 * (1 - tip) + Math.sin(flight * Math.PI) * 0.15,
    rz: Math.sin(flight * Math.PI * 2) * 0.055,
  }
}
