import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

async function init() {
  // Create scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  // Create camera
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10)
  camera.position.z = 1

  // Create triangle geometry
  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array([
    0.0,  0.5,  0.0,  // top
   -0.5, -0.5,  0.0,  // bottom left
    0.5, -0.5,  0.0   // bottom right
  ])
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

  // Create red material
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })

  // Create mesh and add to scene
  const triangle = new THREE.Mesh(geometry, material)
  scene.add(triangle)

  // Create WebGPU renderer
  const renderer = new WebGPURenderer()
  await renderer.init() // async init is required
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  // Initial render only (no animation)
  renderer.render(scene, camera)
}

init()