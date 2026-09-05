import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildLandscape } from './landscape.js';
import { buildStation, buildVillage } from './station.js';
import { buildInfrastructure } from './infrastructure.js';
import { buildTrain } from './train.js';
import { sampleMotion } from './motion.js';
import './style.css';

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
const sky = document.createElement('canvas'); sky.width = 2; sky.height = 256;
const context = sky.getContext('2d');
const gradient = context.createLinearGradient(0, 0, 0, 256);
gradient.addColorStop(0, '#d9edf5'); gradient.addColorStop(.53, '#eef5f4'); gradient.addColorStop(1, '#faf3e9');
context.fillStyle = gradient; context.fillRect(0, 0, 2, 256);
const skyTexture = new THREE.CanvasTexture(sky); skyTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTexture;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.info.autoReset = false;

const outlineEffect = new OutlineEffect(renderer, {
  defaultThickness: 0.0025,
  defaultColor: new THREE.Color('#30343b').toArray(),
});
outlineEffect.autoClear = true;

const camera = new THREE.OrthographicCamera(-20, 20, 16, -16, .1, 150);
const target = new THREE.Vector3(0, 1.2, 0);
camera.position.set(22, 34, 34); camera.lookAt(target);
const controls = new OrbitControls(camera, canvas);
controls.target.copy(target);
controls.enableDamping = true; controls.dampingFactor = .065;
controls.enablePan = false;
controls.rotateSpeed = .65; controls.zoomSpeed = .8;
controls.minZoom = .7; controls.maxZoom = 3.4;
controls.minPolarAngle = THREE.MathUtils.degToRad(20);
controls.maxPolarAngle = THREE.MathUtils.degToRad(78);
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
canvas.addEventListener('contextmenu', e => e.preventDefault());

const world = new THREE.Group(); world.name = 'Sakuramachi miniature'; scene.add(world);
const landscape = buildLandscape(world);
const station = buildStation(world);
const village = buildVillage(world);
const infrastructure = buildInfrastructure(world);
const train = buildTrain(world);

// Outline closed surfaces; preserve glass, open surfaces and fine instanced details.
// Clone opt-out materials so shared opaque meshes keep their outlines after batching.
const unoutlinedMaterials = new Map();
world.traverse(object => {
  if (!object.isMesh) return;
  const configure = original => {
    if (!object.isInstancedMesh && !original.transparent && original.side !== THREE.DoubleSide) return original;
    if (!unoutlinedMaterials.has(original)) {
      const cloned = original.clone();
      cloned.onBeforeCompile = original.onBeforeCompile;
      cloned.userData.outlineParameters = { ...original.userData.outlineParameters, visible: false };
      unoutlinedMaterials.set(original, cloned);
    }
    return unoutlinedMaterials.get(original);
  };
  object.material = Array.isArray(object.material) ? object.material.map(configure) : configure(object.material);
});

const inventory = {};
world.traverse(object => { if (object.name) inventory[object.name] = (inventory[object.name] || 0) + 1; });

// Animation pivots stay in the hierarchy while static parts share draw calls.
function batchStatic(container, excludedNames = []) {
  if (!container?.isObject3D) return;
  container.updateWorldMatrix(true, true);
  const inverse = container.matrixWorld.clone().invert();
  const buckets = new Map();
  function collect(o) {
    if (o !== container && excludedNames.includes(o.name)) return;
    if ((o.isMesh || o.isLineSegments) && !o.isInstancedMesh && !Array.isArray(o.material)) {
      const geometry = o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));
      const expanded = geometry.index ? geometry.toNonIndexed() : geometry;
      if (expanded !== geometry) geometry.dispose();
      const attributes = Object.keys(expanded.attributes).sort().join('-');
      const key = `${o.isLineSegments ? 'line' : 'mesh'}-${o.material.uuid}-${o.castShadow}-${o.receiveShadow}-${attributes}`;
      if (!buckets.has(key)) buckets.set(key, { geometries: [], originals: [], material: o.material, lines: o.isLineSegments, cast: o.castShadow, receive: o.receiveShadow });
      const bucket = buckets.get(key);
      bucket.geometries.push(expanded); bucket.originals.push(o);
    }
    for (const child of o.children) collect(child);
  }
  collect(container);
  for (const bucket of buckets.values()) {
    const merged = mergeGeometries(bucket.geometries, false);
    if (!merged) continue;
    const combined = bucket.lines ? new THREE.LineSegments(merged, bucket.material) : new THREE.Mesh(merged, bucket.material);
    combined.castShadow = bucket.cast; combined.receiveShadow = bucket.receive;
    container.add(combined);
    bucket.geometries.forEach(g => g.dispose());
    bucket.originals.forEach(o => o.removeFromParent());
  }
}
batchStatic(station?.group || station);
batchStatic(village?.group || village);
batchStatic(infrastructure.group, ['Gate hinge pivot']);
const crowns = [];
landscape.group.traverse(o => { if (o.name === 'Breezy blossom crown') crowns.push(o); });
crowns.forEach(crown => batchStatic(crown));
batchStatic(landscape.group, ['Breezy blossom crown', 'Fine grass tufts']);
batchStatic(train.group);

scene.add(new THREE.HemisphereLight('#fff8f5', '#a2b6a0', 1.6));
const sun = new THREE.DirectionalLight('#fff1d9', 2.2);
sun.position.set(-14, 25, 14); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -19; sun.shadow.camera.right = 19;
sun.shadow.camera.top = 19; sun.shadow.camera.bottom = -19;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 70;
sun.shadow.bias = -.00035; sun.shadow.normalBias = .045;
sun.shadow.radius = 3;
scene.add(sun);
const fill = new THREE.DirectionalLight('#d1e8ff', .55); fill.position.set(16, 9, -12); scene.add(fill);

const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 256;
const shadowContext = shadowCanvas.getContext('2d');
const halo = shadowContext.createRadialGradient(128, 128, 24, 128, 128, 125);
halo.addColorStop(0, 'rgba(59,81,74,.23)'); halo.addColorStop(.65, 'rgba(59,81,74,.12)'); halo.addColorStop(1, 'rgba(59,81,74,0)');
shadowContext.fillStyle = halo; shadowContext.fillRect(0, 0, 256, 256);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(35, 35), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
shadow.material.userData.outlineParameters = { visible: false };
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.48; scene.add(shadow);

const clock = new THREE.Clock();
let simulationTime = 19;
let inspectionTime = null;
let lastState = sampleMotion(simulationTime);
let frames = 0;
function renderFrame() {
  const delta = Math.min(clock.getDelta(), .1);
  if (inspectionTime === null && !document.hidden) simulationTime += delta;
  const time = inspectionTime ?? simulationTime;
  lastState = sampleMotion(time);
  landscape.update(time);
  train.update(lastState, time);
  infrastructure.update(lastState, time);
  controls.update();
  renderer.info.reset();
  outlineEffect.render(scene, camera);
  frames++;
}
renderer.setAnimationLoop(renderFrame);
function resize() {
  const width = window.innerWidth, height = window.innerHeight;
  const aspect = width / height;
  const halfHeight = Math.max(16, 18.15 / aspect);
  camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
  camera.top = halfHeight; camera.bottom = -halfHeight;
  camera.updateProjectionMatrix(); outlineEffect.setSize(width, height);
}
window.addEventListener('resize', resize); resize();

if (import.meta.env.DEV) {
  window.__diorama = {
    scene, world, camera, controls, renderer, outlineEffect, inventory,
    get state() { return { ...lastState, frames, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles }; },
    seek(time) { inspectionTime = time; renderFrame(); return this.state; },
    resume() { simulationTime = inspectionTime ?? simulationTime; inspectionTime = null; },
    resetView() { controls.reset(); camera.position.set(22, 34, 34); controls.target.copy(target); camera.zoom = 1; camera.updateProjectionMatrix(); controls.update(); },
    setView(azimuth, elevation = 39, zoom = 1) {
      const radius = 48, a = THREE.MathUtils.degToRad(azimuth), e = THREE.MathUtils.degToRad(elevation);
      camera.position.set(radius * Math.sin(a) * Math.cos(e), 1.2 + radius * Math.sin(e), radius * Math.cos(a) * Math.cos(e));
      controls.target.copy(target); camera.zoom = zoom; camera.updateProjectionMatrix(); controls.update(); renderFrame();
    },
    pixelStats() {
      const c = document.createElement('canvas'); c.width = 160; c.height = 100;
      const ctx = c.getContext('2d'); ctx.drawImage(canvas, 0, 0, 160, 100);
      const pixels = ctx.getImageData(0, 0, 160, 100).data;
      let greens = 0, pinks = 0, dark = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const [r, g, b] = pixels.slice(i, i + 3);
        if (g > r * 1.08 && g > b * 1.08) greens++;
        if (r > g * 1.08 && b > g * 1.03) pinks++;
        if (r + g + b < 350) dark++;
      }
      return { greens, pinks, dark, total: pixels.length / 4 };
    },
  };
}
