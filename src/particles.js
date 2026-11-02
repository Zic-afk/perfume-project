import * as THREE from 'three'

// One GPU draw call; the particles drift without updating buffers on the CPU.
export function createParticles(renderer, compact, reducedMotion) {
  const count = compact ? 150 : 460
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  let seed = 421
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  for (let i = 0; i < count; i++) {
    positions.set([(random() - 0.5) * 15, random() * 10 - 4, random() * 7 - 5], i * 3)
    seeds[i] = random()
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uOpacity: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() }, uMotion: { value: reducedMotion ? 0 : 1 },
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uMotion;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * uMotion;
        p.y = mod(p.y + 4.0 + t * (0.025 + aSeed * 0.045), 10.0) - 4.0;
        p.x += sin(t * 0.13 + aSeed * 25.0) * 0.24;
        p.z += cos(t * 0.09 + aSeed * 18.0) * 0.15;
        float beamDistance = min(abs(p.x - 2.3), abs(p.x + 2.3));
        float illumination = exp(-beamDistance * beamDistance * 0.28);
        vAlpha = (0.10 + illumination * 0.5) * (0.35 + aSeed * 0.65);
        vAlpha *= 0.75 + 0.25 * sin(t * 0.5 + aSeed * 50.0);
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp((1.1 + aSeed * 2.0) * uPixelRatio * 9.0 / -view.z, 1.0, 5.0);
      }`,
    fragmentShader: `
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float radius = length(gl_PointCoord - 0.5) * 2.0;
        float alpha = exp(-radius * radius * 4.5) * (1.0 - smoothstep(0.6, 1.0, radius));
        gl_FragColor = vec4(vec3(0.88, 0.78, 0.58), alpha * vAlpha * uOpacity);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return points
}
