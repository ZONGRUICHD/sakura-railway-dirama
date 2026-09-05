import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE };
export const C = {
  grass: '#91cb65', grassLight: '#b4df78', grassDark: '#54974e', grassShade: '#73b65c',
  wood: '#976b4e', woodDark: '#614639', bench: '#c49155', ivory: '#f3f0de', concrete: '#c9ccc3',
  metal: '#aebbbb', steel: '#667977', roof: '#396c73', roofLight: '#56868a',
  pink: '#f2aacd', blush: '#ffd4e7', pinkShade: '#dd83b2', blossom: '#fff0f7',
  road: '#59636a', white: '#fffaf0', yellow: '#f7ce48', charcoal: '#303b43',
  glass: '#9cc6cf', glassDark: '#46656e', red: '#db535c', teal: '#4fb9a4',
};
const ramp = new THREE.DataTexture(new Uint8Array([115, 175, 221, 255]), 4, 1, THREE.RedFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
ramp.needsUpdate = true;
const materialCache = new Map();
export function material(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...opts }));
  return materialCache.get(key);
}
const edgeMaterial = new THREE.LineBasicMaterial({ color: '#414a4b', transparent: true, opacity: 0.19 });
export function mesh(parent, geometry, color, position = [0, 0, 0], outline = false) {
  const m = new THREE.Mesh(geometry, color?.isMaterial ? color : material(color));
  m.position.set(...position);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  if (outline) {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 35), edgeMaterial);
    m.add(edges);
  }
  return m;
}
export function group(parent, name, position = [0, 0, 0]) {
  const g = new THREE.Group(); g.name = name; g.position.set(...position); parent.add(g); return g;
}
export function box(parent, size, position, color, outline = false) {
  return mesh(parent, new THREE.BoxGeometry(...size), color, position, outline);
}
export function rounded(parent, size, position, color, radius = 0.08, outline = false) {
  return mesh(parent, new RoundedBoxGeometry(...size, 2, radius), color, position, outline);
}
export function cylinder(parent, radius, height, position, color, sides = 10, radiusTop = radius) {
  return mesh(parent, new THREE.CylinderGeometry(radiusTop, radius, height, sides), color, position);
}
export function ico(parent, radius, position, color, scale = [1, 1, 1], detail = 1) {
  const m = mesh(parent, new THREE.IcosahedronGeometry(radius, detail), color, position);
  m.scale.set(...scale); return m;
}
export function beam(parent, a, b, radius, color, sides = 7) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const m = cylinder(parent, radius, start.distanceTo(end), start.clone().add(end).multiplyScalar(0.5).toArray(), color, sides);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  return m;
}
export function tube(parent, points, radius, color, segments = 24) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(parent, new THREE.TubeGeometry(curve, segments, radius, 5, false), color);
}
export function sign(parent, width, height, position, draw, rotation = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = Math.max(128, Math.round(1024 * height / width));
  const ctx = canvas.getContext('2d'); draw(ctx, canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = mesh(parent, new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }), position);
  m.rotation.y = rotation; m.castShadow = false; return m;
}
export function textSign(parent, text, size, position, rotation = 0, background = C.ivory, foreground = C.charcoal) {
  return sign(parent, ...size, position, (ctx, w, h) => {
    ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = foreground; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `500 ${h * 0.56}px "Yu Gothic", "Noto Sans JP", sans-serif`;
    ctx.fillText(text, w / 2, h / 2, w * 0.93);
  }, rotation);
}
export function random(seed = 1) {
  let a = seed;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function fence(parent, a, b, height = 0.8, color = C.metal, spacing = 0.9) {
  const distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const count = Math.ceil(distance / spacing);
  for (let i = 0; i <= count; i++) {
    const f = i / count, x = THREE.MathUtils.lerp(a[0], b[0], f), z = THREE.MathUtils.lerp(a[1], b[1], f);
    cylinder(parent, 0.038, height, [x, 0.27 + height / 2, z], color, 6);
  }
  for (const y of [0.27 + height * 0.48, 0.27 + height * 0.92]) beam(parent, [a[0], y, a[1]], [b[0], y, b[1]], 0.029, color, 6);
}
export function pitchedRoof(parent, x, y, z, width, depth, rise, color = C.roof) {
  const g = group(parent, 'Pitched tiled roof', [x, y, z]);
  const half = depth / 2, length = Math.hypot(half, rise), angle = Math.atan2(rise, half);
  for (const side of [-1, 1]) {
    const panel = box(g, [width, 0.12, length], [0, rise / 2, side * half / 2], color, true);
    panel.rotation.x = side * angle;
    for (let at = -width / 2 + 0.05; at <= width / 2; at += 0.23) {
      beam(g, [at, rise + 0.06, 0], [at, 0.06, side * half], 0.027, C.roofLight, 5);
    }
    beam(g, [-width / 2, 0, side * half], [width / 2, 0, side * half], 0.06, color, 6);
  }
  beam(g, [-width / 2 - 0.05, rise + 0.1, 0], [width / 2 + 0.05, rise + 0.1, 0], 0.09, color, 8);
  return g;
}
