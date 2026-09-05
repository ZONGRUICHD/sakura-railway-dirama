import { THREE, C, material, group, box, rounded, cylinder, beam } from './model.js';

export const LENGTH = 6.0;
export const BODY_LENGTH = 2.85;
export const BODY_GAP = 0.2;
export const BODY_WIDTH = 1.42;
export const RAIL_TOP_Y = 0.62;
export const WHEEL_RADIUS = 0.22;
export const WHEEL_CENTER_Y = RAIL_TOP_Y + WHEEL_RADIUS;
export const PANTOGRAPH_CONTACT_Y = 4.6;

const TRAIN_CLIP_MIN_X = -11.7;
const TRAIN_CLIP_MAX_X = 11.7;

function trainPlanes() {
  return [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -TRAIN_CLIP_MIN_X),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), TRAIN_CLIP_MAX_X),
  ];
}

function makeMaterials() {
  const planes = trainPlanes();
  const cache = new Map();
  const get = (color, options = {}) => {
    const key = color + JSON.stringify(options);
    if (!cache.has(key)) {
      const cloned = material(color, options).clone();
      cloned.clippingPlanes = planes;
      cloned.clipIntersection = false;
      cloned.needsUpdate = true;
      cache.set(key, cloned);
    }
    return cache.get(key);
  };
  return {
    planes,
    body: get(C.white),
    bodyShade: get(C.concrete),
    skirt: get(C.metal),
    steel: get(C.steel),
    pink: get(C.pink),
    teal: get(C.teal),
    glass: get(C.glassDark, { transparent: true, opacity: 0.94 }),
    glassHighlight: get(C.glass, { transparent: true, opacity: 0.72 }),
    interior: get('#ffe3b6', { emissive: '#ffe3b6', emissiveIntensity: 0.28 }),
    seat: get(C.pinkShade),
    dark: get(C.charcoal),
    black: get('#202b30'),
    cream: get('#fff0c7', { emissive: '#fff0c7', emissiveIntensity: 0.42 }),
    red: get(C.red, { emissive: C.red, emissiveIntensity: 0.3 }),
    yellow: get(C.yellow),
    hub: get('#d6ded8'),
  };
}

function addSideWindow(car, mats, x, z) {
  const face = z > 0 ? 1 : -1;
  const window = rounded(car, [0.47, 0.53, 0.035], [x, 2.02, z], mats.glass, 0.06, true);
  window.name = 'side window';
  box(car, [0.52, 0.045, 0.045], [x, 2.31, z - face * 0.018], mats.steel, true).name = 'window upper frame';
  box(car, [0.52, 0.045, 0.045], [x, 1.73, z - face * 0.018], mats.steel, true).name = 'window lower frame';
}

function addDoor(car, mats, x, z) {
  const face = z > 0 ? 1 : -1;
  rounded(car, [0.48, 1.08, 0.045], [x, 1.56, z], mats.bodyShade, 0.045, true).name = 'side door';
  rounded(car, [0.34, 0.43, 0.05], [x, 1.89, z + face * 0.018], mats.glassHighlight, 0.04, true).name = 'door window';
  box(car, [0.035, 0.95, 0.04], [x - 0.22, 1.56, z + face * 0.024], mats.steel, false).name = 'door frame';
  box(car, [0.035, 0.95, 0.04], [x + 0.22, 1.56, z + face * 0.024], mats.steel, false).name = 'door frame';
  box(car, [0.08, 0.025, 0.025], [x + 0.1, 1.43, z + face * 0.03], mats.dark, false).name = 'door handle';
}

function addInterior(car, mats) {
  box(car, [2.28, 0.08, 1.06], [0, 1.22, 0], mats.interior, false).name = 'lit interior floor';
  for (const x of [-0.78, 0, 0.78]) {
    for (const z of [-0.36, 0.36]) {
      rounded(car, [0.38, 0.16, 0.27], [x, 1.47, z], mats.seat, 0.05, true).name = 'passenger seat';
      box(car, [0.38, 0.34, 0.07], [x, 1.65, z + (z > 0 ? 0.12 : -0.12)], mats.seat, true).name = 'seat back';
    }
  }
  box(car, [2.2, 0.08, 0.07], [0, 2.42, 0], mats.interior, false).name = 'interior ceiling glow';
}

function addBogie(car, mats, x) {
  rounded(car, [0.8, 0.14, 1.02], [x, 0.82, 0], mats.dark, 0.05, true).name = 'bogie frame';
  box(car, [0.58, 0.16, 0.11], [x, 0.72, 0], mats.steel, true).name = 'bogie axle';
  for (const z of [-0.54, 0.54]) {
    const wheel = cylinder(car, WHEEL_RADIUS, 0.12, [x, WHEEL_CENTER_Y, z], mats.black, 16);
    wheel.rotation.x = Math.PI / 2;
    wheel.name = 'rail wheel';
    const hub = cylinder(car, 0.075, 0.135, [x, WHEEL_CENTER_Y, z + (z > 0 ? 0.012 : -0.012)], mats.hub, 12);
    hub.rotation.x = Math.PI / 2;
    hub.name = 'wheel hub';
  }
}

function addUnderbody(car, mats) {
  rounded(car, [2.45, 0.18, 1.15], [0, 0.95, 0], mats.dark, 0.06, true).name = 'underbody chassis';
  for (const x of [-0.62, 0.62]) {
    rounded(car, [0.42, 0.25, 0.5], [x, 0.76, 0], mats.steel, 0.05, true).name = 'underbody equipment';
  }
  beam(car, [-1.22, 0.72, -0.42], [1.22, 0.72, -0.42], 0.035, mats.steel, 7).name = 'brake pipe';
  for (const x of [-0.92, 0.92]) addBogie(car, mats, x);
}

function addRoof(car, mats) {
  rounded(car, [2.74, 0.16, 1.29], [0, 2.64, 0], mats.skirt, 0.07, true).name = 'rounded roof';
  for (const x of [-0.8, 0.56]) {
    rounded(car, [0.62, 0.2, 0.68], [x, 2.81, 0], mats.dark, 0.08, true).name = 'rooftop AC vent';
    rounded(car, [0.68, 0.06, 0.75], [x, 2.94, 0], mats.steel, 0.025, true).name = 'AC vent cap';
    for (const z of [-0.2, 0, 0.2]) box(car, [0.48, 0.025, 0.025], [x, 2.98, z], mats.dark, false).name = 'AC vent grille';
  }
  const pantograph = group(car, 'diamond pantograph', [0, 0, 0]);
  const baseX = 0.42;
  const contactX = 0.14;
  beam(pantograph, [-baseX, 2.76, 0], [contactX, 4.52, 0], 0.032, mats.steel, 7).name = 'pantograph arm';
  beam(pantograph, [baseX, 2.76, 0], [-contactX, 4.52, 0], 0.032, mats.steel, 7).name = 'pantograph arm';
  beam(pantograph, [-baseX, 2.76, 0], [-contactX, 4.52, 0], 0.022, mats.steel, 7).name = 'pantograph brace';
  beam(pantograph, [baseX, 2.76, 0], [contactX, 4.52, 0], 0.022, mats.steel, 7).name = 'pantograph brace';
  rounded(pantograph, [0.62, 0.06, 0.12], [0, PANTOGRAPH_CONTACT_Y - 0.03, 0], mats.dark, 0.025, true).name = 'pantograph contact shoe';
}

function addCab(car, mats, side) {
  // Keep outer cab details inside the six-unit nose-to-tail envelope.
  const x = side * 1.425;
  const faceX = x;
  const details = group(car, side > 0 ? 'front cab details' : 'trailing cab details');
  rounded(details, [0.05, 1.43, 1.3], [faceX, 1.84, 0], mats.bodyShade, 0.08, true).name = 'rounded cab face';
  rounded(details, [0.035, 0.5, 0.84], [faceX + side * 0.018, 2.2, 0], mats.black, 0.04, true).name = 'cab windshield';
  rounded(details, [0.04, 0.3, 0.92], [faceX + side * 0.023, 1.46, 0], mats.body, 0.035, true).name = 'white head panel';
  rounded(details, [0.04, 0.15, 0.64], [faceX + side * 0.028, 1.82, 0], mats.black, 0.025, true).name = 'destination black sign';
  for (const z of [-0.43, 0.43]) {
    rounded(details, [0.035, 0.17, 0.17], [faceX + side * 0.026, 1.22, z], mats.steel, 0.05, true).name = 'cab light bezel';
    rounded(details, [0.035, 0.105, 0.105], [faceX + side * 0.027, 1.22, z], side > 0 ? mats.cream : mats.red, 0.035, true).name = side > 0 ? 'cream headlight' : 'red marker light';
  }
  for (const z of [-0.25, 0.25]) {
    beam(details, [faceX + side * 0.026, 1.96, z - 0.15], [faceX + side * 0.026, 2.27, z + 0.1], 0.016, mats.dark, 6).name = 'windshield wiper';
  }
  rounded(details, [0.1, 0.28, 1.28], [x - side * 0.005, 1.06, 0], mats.skirt, 0.06, true).name = 'cab skirt';
  box(details, [0.08, 0.14, 0.2], [x + side * 0.01, 0.79, 0], mats.black, true).name = 'coupling head';
  box(details, [0.05, 0.22, 0.08], [x + side * 0.025, 0.91, -0.22], mats.black, false).name = 'coupling hose';
}

function buildRailcar(parent, mats, centerX, carIndex) {
  const car = group(parent, carIndex === 0 ? 'rear railcar' : 'front railcar', [centerX, 0, 0]);
  car.userData.carIndex = carIndex;
  rounded(car, [BODY_LENGTH, 1.55, BODY_WIDTH], [0, 1.86, 0], mats.body, 0.16, true).name = 'rounded railcar body';
  rounded(car, [BODY_LENGTH + 0.08, 0.24, BODY_WIDTH + 0.06], [0, 1.10, 0], mats.skirt, 0.07, true).name = 'lower body skirt';
  box(car, [BODY_LENGTH - 0.06, 0.16, BODY_WIDTH + 0.04], [0, 1.63, 0], mats.pink, true).name = 'pink body band';
  box(car, [BODY_LENGTH - 0.08, 0.075, BODY_WIDTH + 0.045], [0, 1.43, 0], mats.teal, true).name = 'narrow teal body band';
  addInterior(car, mats);
  for (const z of [-0.72, 0.72]) {
    for (const x of [-0.94, -0.31, 0.31, 0.94]) addSideWindow(car, mats, x, z);
    for (const x of [-1.05, 1.05]) addDoor(car, mats, x, z);
  }
  addUnderbody(car, mats);
  addRoof(car, mats);
  if (carIndex === 0) addCab(car, mats, -1);
  if (carIndex === 1) addCab(car, mats, 1);
  // The inner-facing ends share a recessed connector so the 0.2 unit gap reads clearly.
  box(car, [0.16, 0.34, 0.68], [carIndex === 0 ? 1.43 : -1.43, 1.3, 0], mats.black, true).name = 'inter-car coupling';
  return car;
}

function clipOutlineMaterials(root, planes) {
  root.traverse((object) => {
    if (!object.material || object.material.clippingPlanes === planes) return;
    const clipped = object.material.clone();
    clipped.clippingPlanes = planes;
    clipped.clipIntersection = false;
    clipped.needsUpdate = true;
    object.material = clipped;
  });
}

export function buildTrain(parent) {
  const mats = makeMaterials();
  const train = new THREE.Group();
  train.name = 'train';
  train.userData.length = LENGTH;
  train.userData.clipPlanes = mats.planes;
  parent.add(train);

  // Centers leave exactly the requested 0.2 unit gap between 2.85 unit bodies.
  buildRailcar(train, mats, -(BODY_LENGTH + BODY_GAP) / 2, 0);
  buildRailcar(train, mats, (BODY_LENGTH + BODY_GAP) / 2, 1);
  clipOutlineMaterials(train, mats.planes);

  const update = (state, time = 0) => {
    const motion = state || {};
    if (Number.isFinite(motion.trainX)) train.position.x = motion.trainX;
    if (typeof motion.trainVisible === 'boolean') train.visible = motion.trainVisible;
    else train.visible = true;
    train.userData.lastTime = Number.isFinite(time) ? time : 0;
    return train;
  };

  return { group: train, update };
}
