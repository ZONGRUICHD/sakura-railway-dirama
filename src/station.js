import { THREE, C, material, mesh, group, box, rounded, cylinder, ico, beam, sign, textSign, fence, pitchedRoof } from './model.js';

const ivory = material(C.ivory);
const wall = material('#f5f1df');
const wallShade = material('#dedcc9');
const wood = material(C.wood);
const woodDark = material(C.woodDark);
const benchWood = material(C.bench);
const roofTeal = material(C.roof);
const roofLight = material(C.roofLight);
const steel = material(C.steel);
const metal = material(C.metal);
const glass = material(C.glass, { transparent: true, opacity: 0.78 });
const glassDark = material(C.glassDark);
const charcoal = material(C.charcoal);
const black = material('#293337');
const concrete = material(C.concrete);
const yellow = material(C.yellow);
const green = material(C.grassDark);
const greenLight = material(C.grassLight);
const red = material(C.red);
const aqua = material(C.teal);
const pink = material(C.pink);
const flowerWhite = material(C.blossom);
const brass = material('#d4a849');
const terracotta = material('#b86f54');
const roofRose = material('#8a6970');
const roofBlue = material('#668b91');
const paper = material('#fffdf1');
const scheduleInk = material('#536d68');

function addText(parent, text, size, position, rotation = 0, background = C.ivory, foreground = C.charcoal) {
  // Canvas-backed text is optional so model construction also works in non-DOM tests.
  if (typeof document === 'undefined') return null;
  return textSign(parent, text, size, position, rotation, background, foreground);
}

function addPanelText(parent, width, height, position, draw, rotation = 0) {
  if (typeof document === 'undefined') return null;
  return sign(parent, width, height, position, draw, rotation);
}

function frame(parent, width, height, depth, position, frameColor = woodDark) {
  const [x, y, z] = position;
  box(parent, [width, height, depth], [x, y, z], glass);
  box(parent, [width + 0.12, 0.09, depth + 0.025], [x, y + height / 2 + 0.04, z], frameColor, true);
  box(parent, [width + 0.12, 0.09, depth + 0.025], [x, y - height / 2 - 0.04, z], frameColor, true);
  box(parent, [0.09, height, depth + 0.025], [x - width / 2 - 0.04, y, z], frameColor, true);
  box(parent, [0.09, height, depth + 0.025], [x + width / 2 + 0.04, y, z], frameColor, true);
  box(parent, [0.055, height - 0.1, depth + 0.04], [x, y, z], frameColor);
  box(parent, [width - 0.1, 0.055, depth + 0.04], [x, y, z], frameColor);
}

function sideFrame(parent, depth, height, width, position, frameColor = woodDark) {
  const [x, y, z] = position;
  box(parent, [width, height, depth], [x, y, z], glass);
  box(parent, [width + 0.025, height + 0.12, 0.09], [x, y, z - depth / 2 - 0.04], frameColor, true);
  box(parent, [width + 0.025, height + 0.12, 0.09], [x, y, z + depth / 2 + 0.04], frameColor, true);
  box(parent, [width + 0.025, 0.09, 0.09], [x, y + height / 2 + 0.04, z], frameColor, true);
  box(parent, [width + 0.025, 0.09, 0.09], [x, y - height / 2 - 0.04, z], frameColor, true);
  box(parent, [0.055, height - 0.1, depth + 0.04], [x, y, z], frameColor);
}

function door(parent, position, width = 0.62, height = 1.36, color = woodDark, front = true) {
  const [x, y, z] = position;
  if (front) {
    box(parent, [width, height, 0.075], [x, y, z], color, true);
    box(parent, [width - 0.14, height - 0.55, 0.025], [x, y + 0.27, z + 0.045], glassDark);
    box(parent, [0.045, height - 0.08, 0.035], [x, y, z + 0.055], brass);
    cylinder(parent, 0.045, 0.04, [x + width * 0.29, y + 0.02, z + 0.075], brass, 8).rotation.x = Math.PI / 2;
  } else {
    box(parent, [0.075, height, width], [x, y, z], color, true);
    box(parent, [0.025, height - 0.55, width - 0.14], [x + 0.045, y + 0.27, z], glassDark);
    box(parent, [0.035, height - 0.08, 0.045], [x + 0.055, y, z], brass);
  }
}

function flowerPot(parent, position, flowerColor = pink, scale = 1) {
  const [x, y, z] = position;
  cylinder(parent, 0.17 * scale, 0.22 * scale, [x, y + 0.11 * scale, z], terracotta, 9, 0.13 * scale);
  for (const [dx, dz, s] of [[-0.08, 0, 0.09], [0.04, 0.03, 0.11], [0.09, -0.04, 0.08]]) {
    ico(parent, s * scale, [x + dx * scale, y + 0.31 * scale, z + dz * scale], flowerColor, [1.05, 0.8, 0.9], 1);
  }
  cylinder(parent, 0.025 * scale, 0.17 * scale, [x, y + 0.22 * scale, z], green, 6);
}

function shrub(parent, position, scale = 1, color = green) {
  ico(parent, 0.23 * scale, position, color, [1.25, 0.8, 0.95], 1);
  ico(parent, 0.16 * scale, [position[0] + 0.18 * scale, position[1] + 0.05 * scale, position[2] + 0.02 * scale], greenLight, [1, 0.8, 0.9], 1);
}

function buildMasonryWall(parent) {
  box(parent, [11.8, 0.52, 3.3], [-1.5, 0.72, -2.65], ivory, true);
  box(parent, [11.86, 0.075, 3.24], [-1.5, 0.985, -2.65], wallShade, true);
  const lineMat = material('#b8b9ac', { transparent: true, opacity: 0.72 });
  for (const y of [0.57, 0.74, 0.91]) box(parent, [11.68, 0.025, 0.018], [-1.5, y, -1.005], lineMat);
  for (const y of [0.65, 0.83]) {
    for (let x = -7.0 + ((Math.round(y * 10) % 2) * 0.58); x < 4.35; x += 1.18) {
      box(parent, [0.018, 0.16, 0.025], [x, y, -1.004], lineMat);
    }
  }
  // A few cap stones break up the long retaining wall silhouette.
  for (let x = -7.05; x <= 4.05; x += 1.12) box(parent, [0.98, 0.06, 0.18], [x, 1.015, -1.02], concrete, true);
}

function buildStairs(parent) {
  for (let i = 0; i < 4; i++) {
    const top = 0.98 - i * 0.2;
    box(parent, [0.98, 0.13, 0.48], [3.3, top - 0.065, -4.48 - i * 0.43], concrete, true);
    box(parent, [1.02, 0.035, 0.045], [3.3, top + 0.018, -4.25 - i * 0.43], ivory);
  }
  for (const x of [2.78, 3.82]) {
    beam(parent, [x, 1.34, -4.24], [x, 0.44, -5.96], 0.035, steel, 6);
    for (const [z, y] of [[-4.45, 1.08], [-4.88, 0.88], [-5.31, 0.68], [-5.74, 0.48]]) {
      beam(parent, [x, y, z], [x, y + 0.2, z], 0.028, steel, 6);
    }
  }
}

function buildBench(parent, x, z) {
  box(parent, [1.42, 0.14, 0.34], [x, 1.25, z], benchWood, true);
  box(parent, [1.42, 0.58, 0.105], [x, 1.56, z - 0.17], benchWood, true);
  for (const dx of [-0.52, 0.52]) {
    beam(parent, [x + dx, 1.19, z - 0.1], [x + dx, 0.98, z - 0.1], 0.038, woodDark, 6);
    beam(parent, [x + dx, 0.98, z - 0.1], [x + dx, 0.98, z + 0.1], 0.038, woodDark, 6);
  }
  box(parent, [1.62, 0.055, 0.07], [x, 1.87, z - 0.2], woodDark);
}

function buildShelter(parent) {
  const shelter = group(parent, 'Platform corrugated shelter');
  const roof = box(shelter, [7.8, 0.13, 2.68], [0.1, 3.65, -2.48], material('#eef1e7'), true);
  roof.rotation.x = -0.025;
  for (let z = -3.72; z <= -1.22; z += 0.22) {
    beam(shelter, [-3.78, 3.73, z], [3.98, 3.73, z], 0.018, material('#c3d0c8'), 5);
  }
  for (const x of [-3.72, -1.1, 1.45, 3.9]) {
    for (const z of [-3.62, -1.34]) cylinder(shelter, 0.045, 2.75, [x, 2.32, z], steel, 8);
  }
  for (const x of [-3.55, 1.35, 3.7]) {
    beam(shelter, [x, 1.08, -3.62], [x + 0.25, 3.58, -3.62], 0.028, steel, 6);
    beam(shelter, [x, 1.08, -1.34], [x - 0.25, 3.58, -1.34], 0.028, steel, 6);
  }
  beam(shelter, [-3.75, 3.51, -3.74], [3.95, 3.51, -3.74], 0.055, steel, 7);
  beam(shelter, [-3.75, 3.51, -1.22], [3.95, 3.51, -1.22], 0.055, steel, 7);

  box(shelter, [2.08, 0.68, 0.065], [0.1, 2.9, -1.19], ivory, true);
  addPanelText(shelter, 1.96, 0.56, [0.1, 2.91, -1.232], (ctx, w, h) => {
    ctx.fillStyle = '#fffdf3'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4d8270'; ctx.fillRect(0, h * 0.78, w, h * 0.22);
    ctx.fillStyle = '#263c42'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${h * 0.32}px "Yu Gothic", sans-serif`; ctx.fillText('さくらまち', w / 2, h * 0.34);
    ctx.font = `500 ${h * 0.14}px Arial, sans-serif`; ctx.fillText('Sakuramachi', w / 2, h * 0.61);
  });
  addPanelText(shelter, 0.72, 0.54, [3.28, 2.86, -1.235], (ctx, w, h) => {
    ctx.fillStyle = '#4f8a73'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fffdf1'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${h * 0.68}px Arial, sans-serif`; ctx.fillText('2', w / 2, h / 2);
  });
  beam(shelter, [3.28, 3.55, -1.24], [3.28, 2.7, -1.24], 0.025, brass, 6);

  // The clock is built in the vertical X/Y plane and faces the default +Z camera.
  cylinder(shelter, 0.38, 0.055, [2.25, 2.98, -1.27], charcoal, 20).rotation.x = Math.PI / 2;
  cylinder(shelter, 0.33, 0.065, [2.25, 2.98, -1.31], paper, 20).rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    box(shelter, [0.025, 0.09, 0.018], [2.25 + Math.sin(a) * 0.25, 2.98 + Math.cos(a) * 0.25, -1.355], charcoal);
  }
  beam(shelter, [2.25, 2.98, -1.37], [2.25, 3.17, -1.37], 0.025, charcoal, 6);
  beam(shelter, [2.25, 2.98, -1.375], [2.39, 2.91, -1.375], 0.025, charcoal, 6);

  box(shelter, [1.22, 0.94, 0.065], [-2.92, 1.9, -1.18], woodDark, true);
  box(shelter, [1.06, 0.78, 0.035], [-2.92, 1.9, -1.22], paper);
  for (let y = 1.64; y <= 2.16; y += 0.16) box(shelter, [0.85, 0.022, 0.02], [-2.92, y, -1.245], scheduleInk);
  for (const x of [-3.3, -2.92, -2.54]) box(shelter, [0.055, 0.09, 0.022], [x, 2.29, -1.245], yellow);
  addText(shelter, '時刻表', [0.52, 0.22], [-2.92, 2.38, -1.25], 0, C.ivory, C.charcoal);
}

function buildBinsAndMachines(parent) {
  for (const [x, color, label] of [[-0.35, aqua, 'PET'], [3.45, green, '燃える']]) {
    rounded(parent, [0.42, 0.74, 0.42], [x, 1.35, -1.62], color, 0.08, true);
    rounded(parent, [0.47, 0.08, 0.47], [x, 1.75, -1.62], charcoal, 0.05);
    box(parent, [0.18, 0.035, 0.018], [x, 1.78, -1.86], paper);
    addText(parent, label, [0.29, 0.13], [x, 1.61, -1.86], 0, color, C.ivory);
  }

  const vending = group(parent, 'Red beverage vending machine', [1.76, 0, 0]);
  rounded(vending, [0.86, 1.48, 0.48], [0, 1.72, -1.63], red, 0.07, true);
  box(vending, [0.72, 0.13, 0.025], [0, 2.33, -1.89], ivory);
  addText(vending, 'SAKURA', [0.58, 0.11], [0, 2.33, -1.91], 0, C.ivory, C.red);
  box(vending, [0.68, 0.62, 0.025], [0, 1.92, -1.895], glassDark, true);
  const productColors = [yellow, aqua, paper, pink, material('#f49b51'), greenLight];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
    cylinder(vending, 0.065, 0.035, [-0.22 + col * 0.22, 1.78 + row * 0.25, -1.93], productColors[row * 3 + col], 10).rotation.x = Math.PI / 2;
  }
  box(vending, [0.64, 0.055, 0.025], [0, 1.52, -1.9], ivory);
  for (let x = -0.21; x <= 0.21; x += 0.21) box(vending, [0.12, 0.055, 0.025], [x, 1.52, -1.93], yellow);
  box(vending, [0.24, 0.12, 0.035], [0.23, 1.27, -1.9], charcoal);

  const ticket = group(parent, 'Ticket machine', [3.0, 0, 0]);
  rounded(ticket, [0.72, 1.3, 0.48], [0, 1.59, -1.66], metal, 0.06, true);
  box(ticket, [0.5, 0.28, 0.025], [0, 2.02, -1.91], glassDark, true);
  box(ticket, [0.42, 0.06, 0.02], [0, 1.68, -1.92], paper);
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
    rounded(ticket, [0.1, 0.1, 0.03], [-0.19 + col * 0.19, 1.43 + row * 0.16, -1.92], row === 0 ? yellow : aqua, 0.025);
  }
  box(ticket, [0.32, 0.12, 0.03], [0, 1.1, -1.91], charcoal);
  addText(ticket, 'きっぷ', [0.36, 0.13], [0, 2.14, -1.93], 0, C.ivory, C.charcoal);
}

function buildStationHouse(parent) {
  const house = group(parent, 'Unmanned station building', [-5.75, 0, -5.6]);
  const width = 3.4; const depth = 2.7; const bodyHeight = 1.9;
  box(house, [width, bodyHeight, depth], [0, 1.2, 0], wall, true);
  box(house, [width + 0.08, 0.12, 0.14], [0, 2.12, depth / 2 + 0.03], woodDark, true);
  box(house, [width + 0.08, 0.12, 0.14], [0, 2.12, -depth / 2 - 0.03], woodDark, true);
  pitchedRoof(house, 0, 2.08, 0, width + 0.28, depth + 0.25, 0.82, roofTeal);
  box(house, [width + 0.18, 0.11, 0.13], [0, 2.1, depth / 2 + 0.12], roofLight, true);
  box(house, [width + 0.18, 0.11, 0.13], [0, 2.1, -depth / 2 - 0.12], roofLight, true);

  // Front (+Z) has the strongest visual read from the default camera.
  frame(house, 0.72, 0.72, 0.055, [-1.06, 1.28, depth / 2 + 0.035]);
  frame(house, 0.72, 0.72, 0.055, [1.0, 1.28, depth / 2 + 0.035]);
  door(house, [0, 1.02, depth / 2 + 0.05], 0.62, 1.5, woodDark, true);
  box(house, [0.86, 0.1, 0.3], [0, 1.86, depth / 2 + 0.11], roofLight, true);
  addPanelText(house, 1.55, 0.43, [0, 2.35, depth / 2 + 0.12], (ctx, w, h) => {
    ctx.fillStyle = '#fffdf1'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#294d53'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${h * 0.55}px "Yu Gothic", sans-serif`; ctx.fillText('桜町駅', w / 2, h / 2);
  });
  box(house, [0.16, 0.16, 0.025], [0.71, 1.12, depth / 2 + 0.12], brass);

  // Back and both side elevations receive windows and timber articulation.
  frame(house, 0.82, 0.65, 0.055, [0, 1.3, -depth / 2 - 0.035]);
  frame(house, 0.72, 0.67, 0.055, [-width / 2 - 0.035, 1.35, -0.37]);
  frame(house, 0.6, 0.67, 0.055, [width / 2 + 0.035, 1.35, 0.37]);
  for (const z of [-depth / 2 - 0.08, depth / 2 + 0.08]) box(house, [width - 0.16, 0.075, 0.075], [0, 0.62, z], wood);
  for (const x of [-width / 2 - 0.08, width / 2 + 0.08]) box(house, [0.075, 0.075, depth - 0.2], [x, 0.62, 0], wood);
  box(house, [0.1, 1.5, 0.1], [-width / 2 + 0.24, 1.3, depth / 2 + 0.075], woodDark);
  box(house, [0.1, 1.5, 0.1], [width / 2 - 0.24, 1.3, depth / 2 + 0.075], woodDark);
  box(house, [0.1, 1.5, 0.1], [-width / 2 + 0.24, 1.3, -depth / 2 - 0.075], woodDark);
  box(house, [0.1, 1.5, 0.1], [width / 2 - 0.24, 1.3, -depth / 2 - 0.075], woodDark);
  flowerPot(house, [-1.06, 0.37, depth / 2 + 0.19], pink, 0.7);
  flowerPot(house, [1.0, 0.37, depth / 2 + 0.19], flowerWhite, 0.7);
  box(house, [0.28, 0.5, 0.26], [-1.58, 1.03, -depth / 2 - 0.2], red, true);
  box(house, [0.38, 0.05, 0.32], [-1.58, 1.31, -depth / 2 - 0.2], red);
  return house;
}

function buildBikeShelter(parent) {
  const shelter = group(parent, 'Bicycle shelter', [0, 0, 0]);
  box(shelter, [4.18, 0.11, 1.52], [2.0, 2.34, -5.9], material('#edf0e8'), true);
  for (let z = -6.58; z <= -5.24; z += 0.22) beam(shelter, [-0.1, 2.42, z], [4.1, 2.42, z], 0.017, material('#c3cec5'), 5);
  for (const x of [0.02, 1.98, 3.98]) for (const z of [-6.52, -5.28]) cylinder(shelter, 0.04, 2.05, [x, 1.28, z], steel, 7);
  beam(shelter, [-0.1, 2.17, -6.67], [4.1, 2.17, -6.67], 0.045, steel, 7);
  beam(shelter, [-0.1, 2.17, -5.13], [4.1, 2.17, -5.13], 0.045, steel, 7);
  for (let x = 0.35; x < 3.9; x += 0.38) beam(shelter, [x, 0.36, -5.16], [x, 0.9, -5.16], 0.025, steel, 5);
  for (const x of [0.65, 2.0, 3.35]) buildBicycle(shelter, x, -5.62, x % 0.5 < 0.2 ? aqua : (x > 3 ? pink : brass));
}

function buildBicycle(parent, x, z, color) {
  const wheelRadius = 0.22;
  for (const wx of [x - 0.4, x + 0.4]) {
    const wheel = cylinder(parent, wheelRadius, 0.045, [wx, 0.53, z], black, 16);
    wheel.rotation.x = Math.PI / 2;
    const hub = cylinder(parent, 0.035, 0.06, [wx, 0.53, z], metal, 8);
    hub.rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      beam(parent, [wx, 0.53, z], [wx + Math.cos(a) * wheelRadius, 0.53 + Math.sin(a) * wheelRadius, z - 0.03], 0.008, metal, 4);
    }
  }
  beam(parent, [x - 0.4, 0.53, z], [x - 0.08, 0.98, z], 0.028, color, 6);
  beam(parent, [x - 0.08, 0.98, z], [x + 0.4, 0.53, z], 0.028, color, 6);
  beam(parent, [x - 0.4, 0.53, z], [x + 0.4, 0.53, z], 0.028, color, 6);
  beam(parent, [x - 0.08, 0.98, z], [x + 0.12, 0.58, z], 0.028, color, 6);
  cylinder(parent, 0.035, 0.24, [x - 0.08, 1.08, z], color, 7).rotation.z = 0.12;
  box(parent, [0.24, 0.045, 0.08], [x - 0.17, 1.2, z], black, true);
  beam(parent, [x + 0.4, 0.53, z], [x + 0.32, 0.93, z], 0.028, color, 6);
  beam(parent, [x + 0.32, 0.93, z], [x + 0.49, 1.02, z], 0.026, black, 6);
  beam(parent, [x + 0.49, 1.02, z], [x + 0.42, 1.1, z], 0.026, black, 6);
  cylinder(parent, 0.07, 0.035, [x - 0.08, 0.6, z - 0.05], black, 8).rotation.x = Math.PI / 2;
  beam(parent, [x - 0.08, 0.6, z - 0.06], [x + 0.08, 0.6, z - 0.06], 0.012, black, 5);
}

function buildPlatform(parent) {
  const station = group(parent, 'Sakuramachi platform');
  buildMasonryWall(station);
  box(station, [11.74, 0.08, 3.18], [-1.5, 0.94, -2.65], paper, true);
  box(station, [11.72, 0.025, 0.13], [-1.5, 0.9675, -1.12], yellow, true);
  for (let x = -7.0; x <= 4.0; x += 0.43) box(station, [0.22, 0.012, 0.035], [x, 0.986, -1.12], material('#fff09b'));
  buildShelter(station);
  for (const [x, z] of [[-5.45, -2.62], [-1.65, -2.62], [2.05, -2.62]]) buildBench(station, x, z);
  buildBinsAndMachines(station);
  fence(station, [-7.1, -4.22], [2.78, -4.22], 0.72, steel, 0.82);
  fence(station, [3.82, -4.22], [4.22, -4.22], 0.72, steel, 0.82);
  buildStairs(station);
  for (const [x, flower] of [[-6.82, pink], [-5.9, flowerWhite], [-4.25, pink], [0.95, flowerWhite], [2.15, pink]]) {
    box(station, [0.32, 0.16, 0.28], [x, 1.12, -4.04], terracotta, true);
    flowerPot(station, [x, 1.2, -4.04], flower, 0.55);
  }
  addText(station, '桜町駅', [1.3, 0.34], [-1.6, 1.18, -1.19], 0, C.ivory, C.roof);
  return station;
}

function addGable(parent, width, rise, z, color) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0); shape.lineTo(width / 2, 0); shape.lineTo(0, rise); shape.closePath();
  const gable = mesh(parent, new THREE.ShapeGeometry(shape), color, [0, 0, z]);
  gable.castShadow = true; gable.receiveShadow = true;
  return gable;
}

function buildMailbox(parent, x, z) {
  cylinder(parent, 0.035, 0.55, [x, 0.56, z], woodDark, 6);
  rounded(parent, [0.3, 0.22, 0.22], [x, 0.92, z], red, 0.05, true);
  box(parent, [0.18, 0.025, 0.02], [x, 0.96, z + 0.12], ivory);
}

function buildHouse(parent, x, z, width, depth, roofColor, trimColor, variant) {
  const home = group(parent, `Village house ${variant}`, [x, 0, z]);
  const bodyHeight = 1.58;
  box(home, [width, bodyHeight, depth], [0, 1.04, 0], wall, true);
  // This roof uses shared pitched geometry plus explicit end gables to close the profile.
  pitchedRoof(home, 0, 1.78, 0, width + 0.3, depth + 0.28, 0.68, roofColor);
  addGable(home, width + 0.08, 0.62, depth / 2 + 0.015, wall);
  addGable(home, width + 0.08, 0.62, -depth / 2 - 0.015, wall);
  for (const side of [-1, 1]) {
    const zFace = side * (depth / 2 + 0.04);
    box(home, [width - 0.12, 0.075, 0.08], [0, 0.39, zFace], trimColor, true);
    box(home, [width - 0.12, 0.075, 0.08], [0, 1.72, zFace], trimColor, true);
  }
  for (const side of [-1, 1]) {
    const xFace = side * (width / 2 + 0.04);
    box(home, [0.08, 0.075, depth - 0.12], [xFace, 0.39, 0], trimColor, true);
  }

  // Front and rear openings, with a separate side opening on each elevation.
  const frontZ = depth / 2 + 0.055;
  const rearZ = -depth / 2 - 0.055;
  door(home, [0, 0.91, frontZ], Math.min(0.53, width * 0.2), 1.28, trimColor, true);
  frame(home, Math.min(0.62, width * 0.24), 0.55, 0.05, [-width * 0.29, 1.14, frontZ]);
  frame(home, Math.min(0.62, width * 0.24), 0.55, 0.05, [width * 0.29, 1.14, frontZ]);
  frame(home, Math.min(0.7, width * 0.27), 0.52, 0.05, [0, 1.14, rearZ]);
  door(home, [width * 0.22, 0.88, rearZ], Math.min(0.46, width * 0.18), 1.18, trimColor, true);
  sideFrame(home, 0.05, 0.54, Math.min(0.68, depth * 0.28), [-width / 2 - 0.055, 1.13, -depth * 0.24], trimColor);
  sideFrame(home, 0.05, 0.54, Math.min(0.68, depth * 0.28), [width / 2 + 0.055, 1.13, depth * 0.24], trimColor);
  for (const [dx, dz] of [[-width * 0.29, frontZ + 0.13], [width * 0.29, frontZ + 0.13]]) {
    box(home, [0.1, 0.1, 0.22], [dx, 0.45, dz], terracotta);
    for (const flower of [pink, flowerWhite]) flowerPot(home, [dx, 0.55, dz], flower, 0.48);
  }
  box(home, [0.85, 0.13, 0.56], [0, 0.34, frontZ + 0.25], concrete, true);
  box(home, [0.85, 0.13, 0.56], [width * 0.22, 0.34, rearZ - 0.25], concrete, true);

  const chimneyX = variant === 2 ? -width * 0.23 : width * 0.22;
  box(home, [0.28, 0.62, 0.28], [chimneyX, 2.35, 0], terracotta, true);
  box(home, [0.36, 0.07, 0.36], [chimneyX, 2.67, 0], concrete, true);
  box(home, [0.24, 0.32, 0.12], [width / 2 + 0.12, 0.79, -depth * 0.22], concrete, true);
  for (let i = 0; i < 3; i++) box(home, [0.15, 0.035, 0.07], [width / 2 + 0.2, 0.72 + i * 0.1, -depth * 0.22], steel);
  box(home, [0.18, 0.2, 0.04], [-width / 2 - 0.07, 1.08, frontZ + 0.04], metal, true);
  box(home, [0.07, 0.11, 0.025], [-width / 2 - 0.11, 1.08, frontZ + 0.08], brass);
  buildMailbox(home, width * 0.52, frontZ + 0.36);
  return home;
}

function buildVillage(parent) {
  const village = group(parent, 'Sakuramachi village');
  buildHouse(village, -6.8, 7.6, 3.1, 2.6, roofBlue, woodDark, 1);
  buildHouse(village, -2.7, 8.1, 2.45, 2.4, roofTeal, wood, 2);
  buildHouse(village, 2.2, 7.7, 2.7, 2.8, roofRose, woodDark, 3);

  // Narrow paths, low hedges, and garden details keep the village miniature-scaled.
  box(village, [0.58, 0.045, 1.88], [-6.8, 0.31, 9.61], concrete, true);
  box(village, [0.5, 0.045, 1.7], [-2.7, 0.31, 9.42], concrete, true);
  box(village, [0.58, 0.045, 1.96], [2.2, 0.31, 9.62], concrete, true);
  fence(village, [-8.55, 6.18], [-5.15, 6.18], 0.42, green, 0.4);
  fence(village, [-4.02, 6.62], [-1.38, 6.62], 0.42, green, 0.4);
  fence(village, [0.62, 6.15], [3.78, 6.15], 0.42, green, 0.4);
  for (const [x, z, s] of [[-8.75, 8.95, 0.8], [-5.0, 9.0, 0.7], [-4.1, 9.42, 0.55], [0.55, 9.12, 0.65], [3.9, 9.18, 0.7]]) shrub(village, [x, 0.62, z], s);
  flowerPot(village, [-7.65, 0.35, 9.0], pink, 0.75);
  flowerPot(village, [-2.0, 0.35, 9.55], flowerWhite, 0.7);
  flowerPot(village, [2.95, 0.35, 9.38], pink, 0.65);
  for (const [x, z] of [[-8.3, 9.54], [-7.9, 9.54], [-2.95, 9.32], [1.7, 9.42], [2.1, 9.42]]) {
    cylinder(village, 0.035, 0.24, [x, 0.43, z], green, 6);
    ico(village, 0.105, [x, 0.61, z], flowerWhite, [1.1, 0.65, 1], 1);
  }
  return village;
}

export function buildStation(parent) {
  const station = group(parent, 'Sakuramachi unmanned station');
  buildPlatform(station);
  buildStationHouse(station);
  buildBikeShelter(station);
  return station;
}

export { buildVillage };
