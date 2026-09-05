import { THREE, C, material, mesh, group, box, rounded, cylinder, beam, tube, random } from './model.js';

const TRACK_END = 11.7;
const ROAD_X = 7.2;
const ROAD_WIDTH = 3.1;
const ROAD_END = 11.65;
const OPEN_ANGLE = 1.476;
const POLE_X = [-9.8, -4.7, 0.4, 5.5, 10.4];
const UP = new THREE.Vector3(0, 1, 0);
const P = {
  ballast: '#91958b',
  ballastLight: '#b2b6aa',
  ballastDark: '#7c877e',
  sleeper: '#b7baad',
  railWeb: '#71817e',
  railHead: '#c0ceca',
  rubber: '#515854',
  wire: '#505b5b',
  ceramic: '#ececdb',
  pole: '#c4c9c0',
  black: '#293334',
  redOff: '#712f35',
};

function instances(parent, name, geometry, color, transforms) {
  const result = new THREE.InstancedMesh(geometry, material(color), transforms.length);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < transforms.length; i++) {
    const { position, scale = [1, 1, 1], rotation = [0, 0, 0] } = transforms[i];
    dummy.position.set(...position);
    dummy.scale.set(...scale);
    dummy.rotation.set(...rotation);
    dummy.updateMatrix();
    result.setMatrixAt(i, dummy.matrix);
  }
  result.instanceMatrix.needsUpdate = true;
  result.name = name;
  result.castShadow = true;
  result.receiveShadow = true;
  result.computeBoundingBox();
  result.computeBoundingSphere();
  parent.add(result);
  return result;
}

function yzPrism(parent, name, length, section, color, x = 0) {
  const shape = new THREE.Shape();
  section.forEach(([z, y], index) => index ? shape.lineTo(z, y) : shape.moveTo(z, y));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, steps: 1 });
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(x + length / 2, 0, 0);
  const result = mesh(parent, geometry, color);
  result.name = name;
  return result;
}

function buildTrack(parent) {
  const track = group(parent, 'Railway track');
  yzPrism(track, 'Tapered ballast bed', TRACK_END * 2,
    [[-0.95, 0.25], [0.95, 0.25], [0.79, 0.40], [-0.79, 0.40]], P.ballast);

  const sleepers = [], plates = [], clips = [], bolts = [];
  for (let i = 0; i <= 60; i++) {
    const x = -11.4 + i * 0.38;
    sleepers.push({ position: [x, 0.435, 0] });
    for (const z of [-0.52, 0.52]) {
      plates.push({ position: [x, 0.483, z] });
      for (const side of [-1, 1]) {
        clips.push({ position: [x, 0.513, z + side * 0.088] });
        bolts.push({ position: [x, 0.535, z + side * 0.088] });
      }
    }
  }
  instances(track, 'Concrete sleepers at 0.38 spacing', new THREE.BoxGeometry(0.17, 0.085, 1.85), P.sleeper, sleepers);
  instances(track, 'Rail seating plates', new THREE.BoxGeometry(0.21, 0.013, 0.225), P.railWeb, plates);
  instances(track, 'Spring rail fasteners', new THREE.BoxGeometry(0.06, 0.038, 0.043), P.black, clips);
  instances(track, 'Fastener bolts', new THREE.CylinderGeometry(0.016, 0.016, 0.012, 6), C.metal, bolts);

  for (const z of [-0.52, 0.52]) {
    const rail = group(track, `Steel rail ${z}`, [0, 0, z]);
    rail.userData = { kind: 'rail', top: 0.62, z };
    box(rail, [23.4, 0.025, 0.145], [0, 0.5, 0], P.railWeb, true).name = 'Rail flange';
    box(rail, [23.4, 0.08, 0.035], [0, 0.55, 0], P.railWeb).name = 'Rail web';
    box(rail, [23.4, 0.05, 0.078], [0, 0.595, 0], P.railHead, true).name = 'Rail running head';
    for (const x of [-6.08, 0, 6.08]) {
      box(rail, [0.24, 0.045, 0.048], [x, 0.545, 0], C.steel);
    }
  }

  const rand = random(4427);
  const stones = [[], [], []];
  for (let i = 0; i < 1700; i++) {
    const x = (rand() * 2 - 1) * 11.59;
    const z = (rand() * 2 - 1) * 0.91;
    if (x > 5.54 && x < 8.86) continue;
    const surface = 0.40 - Math.max(0, Math.abs(z) - 0.77) * 0.9;
    stones[i % 3].push({
      position: [x, surface + 0.003, z],
      scale: [0.028 + rand() * 0.041, 0.014 + rand() * 0.025, 0.024 + rand() * 0.029],
      rotation: [rand() * 0.5, rand() * Math.PI, rand() * 0.5],
    });
  }
  const stoneGeometry = new THREE.IcosahedronGeometry(1, 0);
  [P.ballastLight, P.ballastDark, P.ballast].forEach((color, i) =>
    instances(track, `Ballast gravel ${i + 1}`, stoneGeometry, color, stones[i]));
}

function roadY(z) {
  return Math.abs(z) >= 2.5 ? 0.28 : Math.abs(z) <= 1.08 ? 0.57 :
    THREE.MathUtils.lerp(0.57, 0.28, (Math.abs(z) - 1.08) / 1.42);
}

function roadStripe(parent, x, width, z1, z2, name) {
  const y1 = roadY(z1) + 0.006;
  const y2 = roadY(z2) + 0.006;
  const stripe = box(parent, [width, 0.009, Math.hypot(z2 - z1, y2 - y1)],
    [x, (y1 + y2) / 2, (z1 + z2) / 2], C.white);
  stripe.rotation.x = -Math.atan2(y2 - y1, z2 - z1);
  stripe.name = name;
  return stripe;
}

function buildGuardRail(parent, x, start, end) {
  const guards = group(parent, 'Low tubular road guard');
  for (const y of [0.47, 0.76]) beam(guards, [x, y, start], [x, y, end], 0.028, C.white);
  const count = Math.ceil((end - start) / 1.25);
  for (let i = 0; i <= count; i++) {
    const z = THREE.MathUtils.lerp(start, end, i / count);
    cylinder(guards, 0.034, 0.53, [x, 0.525, z], C.white, 8);
    box(guards, [0.12, 0.05, 0.12], [x, 0.285, z], C.concrete, true);
    if (i === 0 || i === count) {
      box(guards, [0.075, 0.075, 0.035], [x, 0.76, z], C.yellow);
    }
  }
}

function buildGrate(parent, x, z) {
  const grate = group(parent, 'Road drainage grate', [x, 0.323, z]);
  box(grate, [0.18, 0.018, 0.58], [0, 0, 0], P.black, true);
  for (const side of [-1, 1]) box(grate, [0.02, 0.013, 0.58], [side * 0.085, 0.012, 0], C.steel);
  for (let i = 0; i < 8; i++) box(grate, [0.15, 0.015, 0.022], [0, 0.012, -0.252 + i * 0.072], C.metal);
}

function buildSpeedSign(parent) {
  const post = group(parent, '30 speed limit sign', [9.35, 0, 5.1]);
  cylinder(post, 0.037, 2.0, [0, 1.26, 0], C.metal, 8);
  cylinder(post, 0.095, 0.13, [0, 0.315, 0], C.concrete, 8);
  const face = group(post, 'Speed sign face', [0, 2.15, 0]);
  face.rotation.y = -0.22;
  const disc = cylinder(face, 0.31, 0.045, [0, 0, 0], C.white, 32);
  disc.rotation.x = Math.PI / 2;
  mesh(face, new THREE.TorusGeometry(0.278, 0.026, 6, 36), C.red, [0, 0, 0.026]);
  const three = [[-0.17, 0.13], [-0.08, 0.145], [-0.045, 0.10], [-0.055, 0.045],
    [-0.11, 0.01], [-0.06, -0.015], [-0.035, -0.08], [-0.075, -0.14], [-0.17, -0.13]];
  tube(face, three.map(([x, y]) => [x, y, 0.039]), 0.016, P.black, 30);
  const zero = [];
  for (let i = 0; i <= 24; i++) {
    const angle = i * Math.PI * 2 / 24;
    zero.push([0.115 + Math.cos(angle) * 0.061, Math.sin(angle) * 0.137, 0.039]);
  }
  tube(face, zero, 0.016, P.black, 36);
}

function buildMirror(parent) {
  const mirror = group(parent, 'Roadside convex safety mirror', [5.08, 0, -2.95]);
  const orange = '#d98749';
  cylinder(mirror, 0.046, 2.37, [0, 1.435, 0], orange, 10);
  cylinder(mirror, 0.105, 0.15, [0, 0.325, 0], C.concrete, 8);
  beam(mirror, [0, 2.52, 0], [0.20, 2.62, 0.06], 0.037, orange);
  const face = group(mirror, 'Convex mirror head', [0.20, 2.68, 0.08]);
  face.rotation.y = 0.40;
  face.rotation.x = -0.10;
  const back = cylinder(face, 0.35, 0.05, [0, 0, 0], orange, 32);
  back.rotation.x = Math.PI / 2;
  const silver = new THREE.MeshStandardMaterial({ color: '#cfe1df', metalness: 0.68, roughness: 0.22 });
  const dome = mesh(face, new THREE.SphereGeometry(0.321, 24, 16), silver, [0, 0, 0.026]);
  dome.scale.z = 0.18;
  mesh(face, new THREE.TorusGeometry(0.332, 0.021, 6, 36), orange, [0, 0, 0.028]);
  tube(face, [[-0.22, 0.12, 0.059], [-0.17, 0.20, 0.063], [-0.08, 0.25, 0.06]],
    0.008, C.white, 14);
  box(mirror, [0.09, 0.34, 0.025], [0, 1.60, 0.052], C.white);
}

function buildCabinet(parent, position, width = 0.46) {
  const cabinet = group(parent, 'Crossing control cabinet', position);
  box(cabinet, [width + 0.15, 0.10, 0.56], [0, 0.05, 0], C.concrete, true);
  box(cabinet, [width, 0.86, 0.4], [0, 0.53, 0], '#d8ddd4', true);
  box(cabinet, [width + 0.06, 0.055, 0.46], [0, 0.982, 0], C.metal, true);
  box(cabinet, [width - 0.06, 0.74, 0.012], [0, 0.53, 0.207], '#c9d2c8', true);
  box(cabinet, [0.027, 0.115, 0.023], [width * 0.29, 0.55, 0.231], C.steel);
  for (let i = 0; i < 5; i++) box(cabinet, [width * 0.57, 0.014, 0.013], [0, 0.29 + i * 0.039, 0.219], P.railWeb);
  box(cabinet, [0.12, 0.072, 0.009], [0, 0.76, 0.219], C.yellow);
  box(cabinet, [0.018, 0.042, 0.006], [0, 0.765, 0.227], P.black).rotation.z = -0.35;
  beam(cabinet, [-width * 0.25, 0.16, -0.15], [-width * 0.25, 0.02, -0.15], 0.023, P.wire);
}

function buildRoad(parent) {
  const road = group(parent, 'Two lane road and crossing deck');
  box(road, [ROAD_WIDTH, 0.03, ROAD_END * 2], [ROAD_X, 0.265, 0], C.road).name = 'Asphalt road';
  for (const side of [-1, 1]) {
    const section = side > 0 ? [[1.08, 0.28], [2.5, 0.28], [1.08, 0.57]] :
      [[-2.5, 0.28], [-1.08, 0.28], [-1.08, 0.57]];
    yzPrism(road, 'Asphalt crossing approach ramp', ROAD_WIDTH, section, C.road, ROAD_X);
  }

  const panels = [[-1.08, -0.60], [-0.44, 0.44], [0.60, 1.08]];
  for (const [z1, z2] of panels) {
    const panel = box(road, [ROAD_WIDTH, 0.11, z2 - z1], [ROAD_X, 0.515, (z1 + z2) / 2], P.rubber, true);
    panel.name = 'Crossing deck with open rail channel';
    panel.userData = { kind: 'crossing-deck', zMin: z1, zMax: z2, top: 0.57 };
    for (let x = 5.85; x < 8.7; x += 0.43) {
      box(road, [0.015, 0.006, z2 - z1 - 0.08], [x, 0.574, (z1 + z2) / 2], P.railWeb);
    }
    for (const z of [z1 + 0.028, z2 - 0.028]) {
      box(road, [ROAD_WIDTH, 0.016, 0.025], [ROAD_X, 0.562, z], C.steel);
    }
  }

  for (const x of [5.77, 8.63]) {
    for (const [z1, z2] of [[-11.6, -2.5], [-2.5, -1.08], ...panels, [1.08, 2.5], [2.5, 11.6]]) {
      roadStripe(road, x, 0.054, z1, z2, 'Solid white road edge line');
    }
  }
  for (const side of [-1, 1]) {
    for (let z = 3.18; z <= 10.6; z += 1.42) {
      const a = side * z, b = side * (z + 0.69);
      roadStripe(road, ROAD_X, 0.048, Math.min(a, b), Math.max(a, b), 'Dashed road center line');
    }
    roadStripe(road, ROAD_X - side * 0.765, 1.39, side * 1.7 - 0.065, side * 1.7 + 0.065, 'Approach stop bar');
    for (const x of [5.51, 8.89]) {
      box(road, [0.16, 0.06, 9.05], [x, 0.28, side * 7.125], '#a8b3ab', true);
      for (const z of [4.25, 8.9]) buildGrate(road, x, side * z);
    }
    for (const x of [5.37, 9.03]) {
      buildGuardRail(road, x, side > 0 ? 3.12 : -10.95, side > 0 ? 10.95 : -3.12);
    }
  }
  buildSpeedSign(road);
  buildMirror(road);
  buildCabinet(road, [4.67, 0.25, 1.74]);
  const rearCabinet = group(road, 'Rear crossing equipment', [9.8, 0.25, -2.24]);
  rearCabinet.rotation.y = Math.PI;
  buildCabinet(rearCabinet, [0, 0, 0], 0.36);
}

function lampMaterial(color) {
  // The shared helper caches materials; each animated lens needs its own copy.
  const result = material(color).clone();
  result.emissive = new THREE.Color(color);
  result.emissiveIntensity = 0;
  return result;
}

function hoodedLens(parent, x, y, radius, lensMaterial, name) {
  const head = group(parent, name, [x, y, 0]);
  const plate = cylinder(head, radius * 1.48, 0.03, [0, 0, 0.025], P.black, 20);
  plate.rotation.x = Math.PI / 2;
  const ring = cylinder(head, radius * 1.12, 0.036, [0, 0, 0.06], C.steel, 20);
  ring.rotation.x = Math.PI / 2;
  const lens = cylinder(head, radius, 0.045, [0, 0, 0.087], lensMaterial, 24);
  lens.rotation.x = Math.PI / 2;
  lens.name = `${name} lens`;
  const hood = mesh(head,
    new THREE.CylinderGeometry(radius * 1.43, radius * 1.43, radius * 1.8, 16, 1, true, Math.PI / 2, Math.PI),
    material(P.black, { side: THREE.DoubleSide }), [0, 0, 0.09 + radius * 0.42]);
  hood.rotation.x = Math.PI / 2;
  return lens;
}

function buildCrossing(parent, x, z, side) {
  const crossing = group(parent, side > 0 ? 'Front crossing post' : 'Rear crossing post', [x, 0, z]);
  crossing.userData = { kind: 'crossing-post', side };
  box(crossing, [0.31, 0.16, 0.31], [0, 0.33, 0], C.concrete, true);
  cylinder(crossing, 0.075, 2.86, [0, 1.84, 0], C.yellow, 10);
  for (let i = 0; i < 9; i++) {
    cylinder(crossing, 0.078, 0.16, [0, 0.56 + i * 0.30, 0], P.black, 10);
  }
  cylinder(crossing, 0.09, 0.04, [0, 3.29, 0], P.black, 10);
  const face = group(crossing, 'Road-facing crossing head');
  face.rotation.y = side > 0 ? 0 : Math.PI;
  box(face, [0.93, 0.09, 0.10], [0, 2.39, 0.028], P.black, true);
  const redLenses = [-0.29, 0.29].map((at, index) => {
    const lens = hoodedLens(face, at, 2.39, 0.113, lampMaterial(C.red), index ? 'Right crossing red' : 'Left crossing red');
    lens.userData = { kind: 'crossing-lens', index };
    return lens;
  });
  const buck = group(face, 'Yellow X crossbuck', [0, 3.02, 0.09]);
  for (const angle of [-0.70, 0.70]) {
    const blade = group(buck, 'Crossbuck blade');
    blade.rotation.z = angle;
    box(blade, [1.03, 0.13, 0.05], [0, 0, 0], C.yellow, true);
    for (const end of [-1, 1]) {
      box(blade, [0.13, 0.132, 0.015], [end * 0.33, 0, 0.032], P.black);
    }
  }
  const hub = cylinder(buck, 0.033, 0.021, [0, 0, 0.065], C.metal, 8);
  hub.rotation.x = Math.PI / 2;
  box(face, [0.20, 0.22, 0.16], [0, 2.0, -0.04], P.black, true);
  for (let i = 0; i < 3; i++) box(face, [0.12, 0.013, 0.008], [0, 1.96 + i * 0.036, 0.047], C.steel);

  box(crossing, [0.30, 0.40, 0.32], [-side * 0.075, 1.13, 0], C.yellow, true);
  box(crossing, [0.20, 0.24, 0.015], [-side * 0.075, 1.14, side * 0.17], P.black, true);
  const pivot = group(crossing, 'Gate hinge pivot', [0, 1.25, 0]);
  pivot.userData = { kind: 'gate-pivot', side, armLength: 3.5 };
  for (let i = 0; i < 10; i++) {
    const segment = box(pivot, [0.35, 0.09, 0.075], [side * (i + 0.5) * 0.35, 0, 0], i % 2 ? C.red : C.white, true);
    segment.name = 'Red-white gate arm segment';
    segment.userData.kind = 'gate-segment';
    if (i === 3 || i === 7) {
      box(pivot, [0.095, 0.022, 0.007], [side * (i + 0.5) * 0.35, 0, side * 0.043], C.yellow);
    }
  }
  box(pivot, [0.29, 0.16, 0.19], [-side * 0.17, -0.012, 0], P.black, true).name = 'Gate counterweight';
  box(pivot, [0.036, 0.12, 0.095], [side * 3.48, 0, 0], C.red, true);
  const axle = cylinder(crossing, 0.095, 0.40, [0, 1.25, 0], C.steel, 16);
  axle.rotation.x = Math.PI / 2;
  const cap = cylinder(crossing, 0.044, 0.022, [0, 1.25, side * 0.211], C.metal, 8);
  cap.rotation.x = Math.PI / 2;
  return { pivot, side, redLenses };
}

function buildTrackSignal(parent, x, facing) {
  const signal = group(parent, 'Three aspect railway signal', [x, 0, 1.25]);
  signal.userData.kind = 'track-signal';
  box(signal, [0.22, 0.17, 0.25], [0, 0.335, 0], C.concrete, true);
  cylinder(signal, 0.045, 2.18, [0, 1.51, 0], C.steel, 10);
  for (const y of [0.78, 1.7]) cylinder(signal, 0.052, 0.052, [0, y, 0], P.black, 10);
  const face = group(signal, 'Rail-facing signal head');
  face.rotation.y = facing * Math.PI / 2;
  rounded(face, [0.34, 0.88, 0.135], [0, 2.53, 0], P.black, 0.055, true);
  const colors = { red: '#ea555b', yellow: '#ffcf4b', green: '#72d695' };
  const lenses = {};
  ['red', 'yellow', 'green'].forEach((name, index) => {
    lenses[name] = hoodedLens(face, 0, 2.80 - index * 0.265, 0.078, lampMaterial(colors[name]), `${name} signal`);
    lenses[name].userData = { kind: 'signal-lens', aspect: name, onColor: colors[name] };
  });
  for (const localX of [-0.105, 0.105]) beam(face, [localX, 0.48, -0.15], [localX, 2.91, -0.15], 0.013, C.steel, 6);
  for (let y = 0.59; y < 2.9; y += 0.24) beam(face, [-0.105, y, -0.15], [0.105, y, -0.15], 0.012, C.steel, 6);
  box(face, [0.16, 0.17, 0.025], [0, 1.92, 0.042], C.white, true);
  for (let i = 0; i < 2; i++) box(face, [0.058, 0.014, 0.01], [0, 1.895 + i * 0.045, 0.06], C.charcoal);
  return { lenses };
}

function saggingWire(parent, name, start, end, sag, radius) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  // A quadratic with a control point 2*sag lower puts its midpoint exactly sag lower.
  const control = a.clone().add(b).multiplyScalar(0.5);
  control.y -= 2 * sag;
  const curve = new THREE.QuadraticBezierCurve3(a, control, b);
  const wire = mesh(parent, new THREE.TubeGeometry(curve, 28, radius, 5, false), P.wire);
  wire.name = name;
  wire.castShadow = false;
  wire.userData = { kind: name === 'Overhead utility wire' ? 'overhead-wire' : 'messenger-wire', start, end, sag, radius };
  return curve;
}

function buildInsulator(parent, x, y, z) {
  const insulator = group(parent, 'Ceramic wire insulator', [x, y, z]);
  insulator.userData = { kind: 'wire-insulator', anchor: [x, y + 0.31, z] };
  cylinder(insulator, 0.018, 0.31, [0, 0.155, 0], C.steel, 7);
  for (const h of [0.10, 0.16, 0.22]) cylinder(insulator, 0.065, 0.035, [0, h, 0], P.ceramic, 10, 0.045);
  cylinder(insulator, 0.028, 0.045, [0, 0.265, 0], P.ceramic, 10);
}

function buildOverhead(parent) {
  const overhead = group(parent, 'Utility poles and overhead catenary');
  const levels = [5.26, 5.96];
  const offsets = [-0.7, 0, 0.7];
  for (const x of POLE_X) {
    const pole = group(overhead, 'Slim concrete utility pole', [x, 0, 2.35]);
    pole.userData = { kind: 'utility-pole', height: 5.9 };
    cylinder(pole, 0.08, 5.9, [0, 3.2, 0], P.pole, 10, 0.061);
    cylinder(pole, 0.125, 0.12, [0, 0.31, 0], C.concrete, 10);
    for (const y of [1.17, 3.38, 4.78, 5.26, 5.96]) cylinder(pole, 0.084, 0.075, [0, y, 0], P.railWeb, 10);
    box(pole, [0.021, 0.34, 0.072], [0.079, 1.78, 0], C.white);
    for (const y of levels) {
      box(pole, [0.085, 0.075, 1.74], [0, y, 0], C.steel, true);
      for (const side of [-1, 1]) beam(pole, [0, y - 0.37, 0], [0, y - 0.025, side * 0.66], 0.019, P.railWeb, 6);
      for (const offset of offsets) buildInsulator(overhead, x, y, 2.35 + offset);
    }
    for (const y of [2.45, 2.86, 3.27, 3.68, 4.09]) {
      beam(pole, [-0.07, y, 0], [-0.19, y, 0], 0.014, P.railWeb, 6);
    }
    beam(pole, [0, 4.95, 0], [0, 4.95, -2.44], 0.025, C.steel);
    beam(pole, [0, 5.46, 0], [0, 4.95, -2.19], 0.022, C.steel);
    for (let i = 0; i < 3; i++) {
      const disc = cylinder(pole, 0.052, 0.03, [0, 4.95, -0.30 - i * 0.055], P.ceramic, 10);
      disc.quaternion.setFromUnitVectors(UP, new THREE.Vector3(0, 0, 1));
    }
    beam(overhead, [x, 4.95, 0], [x, 4.60, 0], 0.012, P.wire, 5);
  }

  for (let span = 0; span < POLE_X.length - 1; span++) {
    for (let tier = 0; tier < levels.length; tier++) {
      for (let wire = 0; wire < offsets.length; wire++) {
        const z = 2.35 + offsets[wire], y = levels[tier] + 0.31;
        saggingWire(overhead, 'Overhead utility wire', [POLE_X[span], y, z], [POLE_X[span + 1], y, z],
          (POLE_X[span + 1] - POLE_X[span]) * (tier ? 0.051 : 0.043), tier ? 0.014 : 0.012);
      }
    }
  }

  const contact = beam(overhead, [-TRACK_END, 4.6, 0], [TRACK_END, 4.6, 0], 0.016, P.wire, 6);
  contact.name = 'Continuous contact wire';
  contact.castShadow = false;
  contact.userData = { kind: 'contact-wire', y: 4.6, z: 0 };
  const supports = [-TRACK_END, ...POLE_X, TRACK_END];
  for (let i = 0; i < supports.length - 1; i++) {
    const start = supports[i], end = supports[i + 1];
    const curve = saggingWire(overhead, 'Catenary messenger wire', [start, 4.95, 0], [end, 4.95, 0],
      Math.min(0.13, (end - start) * 0.028), 0.014);
    const drops = Math.ceil((end - start) / 0.84);
    for (let j = 1; j < drops; j++) {
      const point = curve.getPoint(j / drops);
      const dropper = beam(overhead, point.toArray(), [point.x, 4.60, 0], 0.008, P.wire, 5);
      dropper.name = 'Catenary dropper';
      dropper.castShadow = false;
      dropper.userData = { kind: 'catenary-dropper', top: point.toArray(), bottom: [point.x, 4.6, 0] };
    }
  }
}

export function buildInfrastructure(parent) {
  const infrastructure = group(parent, 'Railway and roadside infrastructure');
  buildTrack(infrastructure);
  buildRoad(infrastructure);
  const crossings = [buildCrossing(infrastructure, 5.3, 1.6, 1), buildCrossing(infrastructure, 9.1, -1.6, -1)];
  // The right signal is just outside the road shoulder, facing approaching trains.
  const signals = [buildTrackSignal(infrastructure, -8.8, -1), buildTrackSignal(infrastructure, 8.95, 1)];
  buildOverhead(infrastructure);

  function update(state = {}, time = 0) {
    const angle = THREE.MathUtils.clamp(Number.isFinite(state.gateAngle) ? state.gateAngle : OPEN_ANGLE, 0, OPEN_ANGLE);
    const warning = state.warning ?? state.crossingActive ?? angle < 1.45;
    const phase = Math.floor((Number.isFinite(time) ? time : 0) * 2.5) % 2;
    for (const crossing of crossings) {
      crossing.pivot.rotation.z = crossing.side * angle;
      crossing.redLenses.forEach((lens, index) => {
        const on = warning && index === phase;
        lens.material.color.set(on ? '#ff6464' : P.redOff);
        lens.material.emissiveIntensity = on ? 1.45 : 0;
      });
    }
    const aspect = ['red', 'yellow', 'green'].includes(state.signal) ? state.signal : 'green';
    for (const signal of signals) {
      for (const [name, lens] of Object.entries(signal.lenses)) {
        const on = name === aspect;
        lens.material.color.set(on ? lens.userData.onColor : P.black);
        lens.material.emissiveIntensity = on ? 1.2 : 0;
      }
    }
  }

  update();
  return { group: infrastructure, update };
}
