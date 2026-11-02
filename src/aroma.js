import * as THREE from 'three'

function petalGeometry() {
  const vertices = [], indices = [], uv = []
  const steps = 18
  for (let row = 0; row <= steps; row++) {
    const t = row / steps
    for (let col = 0; col <= steps; col++) {
      const s = col / steps * 2 - 1
      const width = Math.pow(Math.sin(t * Math.PI), 0.8) * 0.28 + 0.006
      vertices.push(s * width, t * 0.8 - 0.4, 0.07 * s * s + Math.sin(t * Math.PI) * 0.08)
      uv.push(col / steps, t)
      if (row < steps && col < steps) {
        const a = row * (steps + 1) + col, b = a + steps + 1
        indices.push(a, b, a + 1, a + 1, b, b + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function createAroma(compact, reducedMotion) {
  const group = new THREE.Group()
  const petals = new THREE.InstancedMesh(petalGeometry(), new THREE.MeshPhysicalMaterial({
    color: '#bc8c80', roughness: 0.78, metalness: 0, side: THREE.DoubleSide, specularIntensity: 0.05,
    transparent: true, opacity: 0, depthWrite: false, sheen: 0.2, sheenColor: new THREE.Color('#dcb5aa'),
  }), compact ? 18 : 32)
  const pearls = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.055, 1), new THREE.MeshPhysicalMaterial({
    color: '#e3d8b9', roughness: 0.12, metalness: 0.45, transparent: true, opacity: 0, depthWrite: false,
  }), compact ? 22 : 42)
  const woods = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.045, 1.1, 6), new THREE.MeshStandardMaterial({
    color: '#8e6542', roughness: 0.85, transparent: true, opacity: 0, depthWrite: false,
  }), compact ? 10 : 18)
  group.add(pearls, petals, woods)
  const dummy = new THREE.Object3D()
  function update(time, weights) {
    const t = reducedMotion ? 0 : time
    const sets = [[pearls, weights.top], [petals, weights.heart], [woods, weights.base]]
    sets.forEach(([mesh, weight], layer) => {
      mesh.visible = weight > 0.002
      mesh.material.opacity = weight * (layer === 1 ? 0.55 : 0.85)
      if (!mesh.visible) return
      for (let i = 0; i < mesh.count; i++) {
        const angle = i * 2.39996 + t * (layer === 1 ? 0.035 : 0.018)
        const radius = layer === 0 ? 1.45 + (i % 4) * 0.12 : 1.35 + (i % 3) * 0.12
        dummy.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.7 + i) * 1.55 + 0.25, Math.sin(angle) * 1.1 - 0.25)
        dummy.rotation.set(angle * 0.7 + t * 0.025, angle + t * 0.045, angle * 0.4)
        dummy.scale.setScalar(layer === 1 ? 0.42 + (i % 5) * 0.08 : 0.65 + (i % 4) * 0.15)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    })
  }
  return { group, update }
}

export function createSpray(renderer, compact) {
  const count = compact ? 650 : 1500
  const seeds = new Float32Array(count * 3)
  let seed = 9121
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646
  for (let i = 0; i < count * 3; i++) seeds[i] = random()
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3))
  const material = new THREE.ShaderMaterial({
    uniforms: { uProgress: { value: 0 }, uOpacity: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute vec3 aSeed;
      uniform float uProgress;
      uniform float uPixelRatio;
      varying float vAlpha;
      varying float vMist;
      void main() {
        float age = max(0.0, uProgress - aSeed.x * 0.15);
        float angle = aSeed.y * 6.283185;
        float radius = sqrt(aSeed.z) * age * 1.5;
        vec3 p = vec3(age * (2.5 + aSeed.x * 2.5), cos(angle) * radius, sin(angle) * radius);
        p.y += sin(age * 6.0 + aSeed.y * 8.0) * age * 0.22 + age * 0.4;
        p.z += age * 0.25;
        vMist = step(0.7, aSeed.z);
        vAlpha = smoothstep(0.0, 0.04, age) * (1.0 - smoothstep(0.35, 1.0, age));
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * view;
        float size = mix(1.3 + aSeed.x * 2.0, 20.0 + age * 36.0, vMist);
        gl_PointSize = clamp(size * uPixelRatio * 9.0 / -view.z, 1.0, 45.0);
      }`,
    fragmentShader: `
      uniform float uOpacity;
      varying float vAlpha;
      varying float vMist;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float soft = exp(-r * r * 4.0) * (1.0 - smoothstep(0.65, 1.0, r));
        gl_FragColor = vec4(vec3(0.82, 0.84, 0.80), soft * vAlpha * uOpacity * mix(0.45, 0.025, vMist));
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return points
}
