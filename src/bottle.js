import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export function createBottle(renderer, edition) {
  const bottle = new THREE.Group()
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: 0.025, transmission: 1, thickness: 0.32,
    ior: 1.52, clearcoat: 1, clearcoatRoughness: 0.035,
    attenuationColor: new THREE.Color('#f4f3e9'), attenuationDistance: 8, envMapIntensity: 1.05,
  })
  function mesh(geometry, material, x = 0, y = 0, z = 0) {
    const item = new THREE.Mesh(geometry, material)
    item.position.set(x, y, z)
    bottle.add(item)
    return item
  }
  const body = mesh(new RoundedBoxGeometry(1.92, 2.7, 0.85, 8, 0.09), glass, 0, -0.15)
  body.castShadow = true
  mesh(new RoundedBoxGeometry(1.78, 0.19, 0.72, 5, 0.065), glass, 0, -1.36)

  // The opaque absorption core is visible in the outer glass's refraction pass.
  // A depth gradient prevents the liquid looking like a uniformly painted block.
  const liquidMaterial = new THREE.MeshPhysicalMaterial({
    color: edition.color, roughness: 0.17, metalness: 0,
    clearcoat: 0.1, clearcoatRoughness: 0.12, envMapIntensity: 0.16,
  })
  liquidMaterial.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLiquidPosition;')
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLiquidPosition = position;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLiquidPosition;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float edge = smoothstep(0.45, 0.85, abs(vLiquidPosition.x));
      float depth = smoothstep(-1.05, 1.05, vLiquidPosition.y);
      diffuseColor.rgb *= mix(0.48, 0.85, depth) * (1.0 - edge * 0.25);
    `)
  }
  mesh(new RoundedBoxGeometry(1.67, 2.03, 0.61, 6, 0.065), liquidMaterial, 0, -0.30)
  const surface = mesh(new RoundedBoxGeometry(1.58, 0.025, 0.54, 3, 0.012), liquidMaterial, 0, 0.72)
  const gold = new THREE.MeshStandardMaterial({ color: '#baa16c', metalness: 0.95, roughness: 0.25 })
  mesh(new THREE.CylinderGeometry(0.22, 0.29, 0.35, 48), glass, 0, 1.3)
  mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.12, 48), gold, 0, 1.45)
  mesh(new THREE.TorusGeometry(0.243, 0.012, 8, 48), gold, 0, 1.49).rotation.x = Math.PI / 2
  const tubeMaterial = new THREE.MeshStandardMaterial({ color: '#f0dda7', transparent: true, opacity: 0.18, roughness: 0.6, depthWrite: false })
  mesh(new THREE.CylinderGeometry(0.023, 0.023, 2.3, 12), tubeMaterial, 0.04, -0.08, 0.17)

  const outline = new THREE.Shape()
  const corners = [[-0.4,-0.26],[0.4,-0.26],[0.53,-0.13],[0.53,0.13],[0.4,0.26],[-0.4,0.26],[-0.53,0.13],[-0.53,-0.13]]
  corners.forEach(([x,y], i) => i ? outline.lineTo(x,y) : outline.moveTo(x,y))
  outline.closePath()
  const capGeometry = new THREE.ExtrudeGeometry(outline, { depth: 0.46, bevelEnabled: true, bevelThickness: 0.065, bevelSize: 0.065, bevelSegments: 1, steps: 1 })
  capGeometry.center()
  const capMaterial = glass.clone()
  capMaterial.thickness = 0.85
  capMaterial.roughness = 0.018
  const stopper = mesh(capGeometry, capMaterial, 0, 1.88)
  const stopperStem = mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.25, 32), glass, 0, 1.65)
  const atomizer = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 32), gold, 0, 1.59)
  const nozzle = mesh(new THREE.CircleGeometry(0.024, 16), new THREE.MeshBasicMaterial({ color: '#28241c' }), 0, 1.61, 0.122)

  const canvas = document.createElement('canvas')
  canvas.width = 768; canvas.height = 840
  const context = canvas.getContext('2d')
  context.fillStyle = '#f6f2e7'; context.fillRect(0,0,768,840)
  // A restrained paper grain survives close inspection without external images.
  context.fillStyle = 'rgba(90, 74, 48, 0.035)'
  for (let i = 0; i < 2800; i++) {
    const x = (i * 337.19) % 768, y = (i * 173.71) % 840
    context.fillRect(x, y, 0.7, 1.4)
  }
  context.strokeStyle = '#6b6454'; context.lineWidth = 1.5; context.strokeRect(20,20,728,800)
  context.fillStyle = '#191914'; context.textAlign = 'center'
  context.font = '82px Arial'; context.fillText('N°5',384,215)
  context.font = '500 80px Arial'; context.fillText('CHANEL',384,350)
  context.font = '28px Arial'; context.fillText('PARIS',384,417)
  context.font = '24px Arial'; context.fillText('EAU DE PARFUM',384,665)
  context.font = '19px Arial'; context.fillText('50 ml',384,723)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
  mesh(new THREE.PlaneGeometry(1.12,1.22), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), 0,-0.04,0.44)
  bottle.userData.surface = surface
  bottle.userData.liquid = liquidMaterial
  bottle.userData.stopper = stopper
  bottle.userData.stopperStem = stopperStem
  bottle.userData.atomizer = atomizer
  bottle.userData.nozzle = nozzle
  return bottle
}
