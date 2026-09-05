import { THREE, C, material, mesh, group, box, rounded, cylinder, ico, beam, fence, random } from './model.js';

const GROUND = 0.25;
const rng = random(410);
const foliage = [C.pink, C.blush, C.blossom, '#efb4d1', '#e69cc2'];
const trees = [
  [-9.6, -7.8, 1.06], [-5.7, -8.8, 0.9], [-0.1, -8.6, 1.27], [3.85, -7.6, 1.06],
  [9.65, -7.1, 1.02], [-9.3, 4.25, 1.2], [-6.1, 4.5, 1.00], [3.35, 4.4, 1.00],
  [9.75, 4.95, 0.96], [-10.0, 9.0, 0.84], [-0.5, 10.45, 0.62], [4.5, 9.7, 0.7],
];

export function buildLandscape(parent) {
  const landscape = group(parent, 'Landscape');
  const base = group(landscape, 'Square model base');
  rounded(base, [24, 1.05, 24], [0, -0.80, 0], '#775346', 0.22, true);
  rounded(base, [24.06, 0.13, 24.06], [0, -1.32, 0], '#62473e', 0.09, true);
  rounded(base, [24.08, 0.12, 24.08], [0, -0.35, 0], '#c29772', 0.08, true);
  rounded(base, [23.96, 0.35, 23.96], [0, -0.12, 0], '#a47857', 0.16, true);
  rounded(base, [24, 0.18, 24], [0, 0.16, 0], C.grass, 0.13, true);
  rounded(base, [23.92, 0.06, 23.92], [0, 0.04, 0], '#77ab53', 0.07);
  for (const z of [-12.005, 12.005]) {
    box(base, [23.65, 0.025, 0.012], [0, -0.54, z], '#916951');
  }
  for (const x of [-12.005, 12.005]) {
    box(base, [0.012, 0.025, 23.65], [x, -0.54, 0], '#916951');
  }

  const tunnels = group(landscape, 'Twin tunnel hills');
  for (const side of [-1, 1]) buildTunnel(tunnels, side);
  const crowns = trees.map(([x, z, scale], i) => cherry(landscape, x, z, scale, i));
  buildGarden(landscape);
  const grass = buildGrass(landscape);
  buildScatter(landscape);
  fence(landscape, [-8.8, 1.45], [4.7, 1.45], 0.7, C.metal, 0.8);
  fence(landscape, [-10.95, -10.75], [4.8, -10.75], 0.64, '#b5b3a0', 1.1);
  const particles = createPetals(parent);
  return {
    group: landscape,
    update(time) {
      crowns.forEach((c, i) => {
        c.rotation.z = Math.sin(time * 0.57 + i * 1.7) * 0.012;
        c.rotation.x = Math.cos(time * 0.41 + i) * 0.009;
      });
      grass.time.value = time;
      particles.update(time);
    },
    petals: particles.mesh,
  };
}

function archPoints(radius, spring, bottom) {
  const result = [[-radius, bottom], [-radius, spring]];
  for (let j = 0; j <= 24; j++) {
    const a = Math.PI - j * Math.PI / 24;
    result.push([Math.cos(a) * radius, spring + Math.sin(a) * radius]);
  }
  result.push([radius, bottom]);
  return result;
}
function archShape(radius, spring, bottom) {
  const points = archPoints(radius, spring, bottom);
  const s = new THREE.Shape(); s.moveTo(...points[0]);
  points.slice(1).forEach(p => s.lineTo(...p)); s.closePath(); return s;
}
function buildTunnel(parent, side) {
  const tunnel = group(parent, side < 0 ? 'West tunnel' : 'East tunnel');
  const entrance = side * 9.65;
  const back = side * 11.77;
  const innerR = 1.53, spring = 3.28;
  const ring = new THREE.Shape();
  const perimeter = [...archPoints(1.83, spring, .28), ...archPoints(innerR, spring, .28).reverse()];
  ring.moveTo(...perimeter[0]); perimeter.slice(1).forEach(p => ring.lineTo(...p)); ring.closePath();
  const geo = new THREE.ExtrudeGeometry(ring, { depth: 0.27, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.025, bevelSegments: 1, curveSegments: 24 });
  const portal = mesh(tunnel, geo, '#c1c4b7', [entrance, 0, 0], true);
  portal.rotation.y = side * Math.PI / 2;
  for (const z of [-1.7, 1.7]) {
    for (let y = 0.54; y < spring; y += 0.38) box(tunnel, [0.02, 0.02, 0.29], [entrance - side * 0.045, y, z], '#858e87');
  }
  for (let i = 0; i <= 13; i++) {
    const a = i / 13 * Math.PI;
    const z = Math.cos(a) * 1.69, y = spring + Math.sin(a) * 1.69;
    const seam = box(tunnel, [0.024, 0.33, 0.023], [entrance - side * 0.05, y, z], '#8f968e');
    seam.rotation.x = Math.PI / 2 - a;
  }
  const keystone = box(tunnel, [0.34, 0.42, 0.33], [entrance, 5.0, 0], '#d7d6c9', true);
  keystone.rotation.x = 0;

  const arch = archPoints(innerR, spring, 0.3);
  const vertices = [], indices = [];
  for (const x of [entrance, back]) for (const [z, y] of arch) vertices.push(x, y, z);
  for (let i = 0; i < arch.length - 1; i++) {
    const n = arch.length; indices.push(i, i + 1, i + n, i + 1, i + n + 1, i + n);
  }
  const innerGeo = new THREE.BufferGeometry();
  innerGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); innerGeo.setIndex(indices); innerGeo.computeVertexNormals();
  mesh(tunnel, innerGeo, material('#424c49', { side: THREE.DoubleSide }));
  const cap = mesh(tunnel, new THREE.ShapeGeometry(archShape(innerR + 0.03, spring, 0.27)), material('#222b31', { side: THREE.DoubleSide }), [back - side * .04, 0, 0]);
  cap.rotation.y = Math.PI / 2;

  const hillPoints = [
    [-5.0, .26], [-4.65, .85], [-4.18, 1.65], [-3.73, 2.8], [-3.18, 4.25],
    [-2.42, 5.13], [-1.43, 5.48], [0, 5.56], [1.43, 5.45], [2.37, 5.05],
    [3.1, 4.15], [3.69, 2.75], [4.23, 1.48], [4.72, .72], [5.0, .26],
  ];
  const skinVertices = [], skinIndices = [];
  const xs = [entrance + side * .19, entrance + side * .77, back];
  xs.forEach((x, layer) => hillPoints.forEach(([z, y]) => skinVertices.push(x, y - (layer === 0 ? .12 : 0), z)));
  for (let layer = 0; layer < 2; layer++) for (let i = 0; i < hillPoints.length - 1; i++) {
    const a = layer * hillPoints.length + i, b = a + hillPoints.length;
    skinIndices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const skinGeo = new THREE.BufferGeometry(); skinGeo.setAttribute('position', new THREE.Float32BufferAttribute(skinVertices, 3)); skinGeo.setIndex(skinIndices); skinGeo.computeVertexNormals();
  mesh(tunnel, skinGeo, material('#95d267', { side: THREE.DoubleSide }));
  for (const x of [entrance + side * .21, back]) {
    const shape = new THREE.Shape();
    const outline = x === back ? hillPoints : [...hillPoints, ...archPoints(1.66, spring, .26).reverse()];
    shape.moveTo(...outline[0]); outline.slice(1).forEach(p => shape.lineTo(...p)); shape.closePath();
    const sideWall = mesh(tunnel, new THREE.ShapeGeometry(shape), material(x === back ? '#77b157' : '#8dc965', { side: THREE.DoubleSide }), [x, 0, 0]);
    sideWall.rotation.y = Math.PI / 2;
  }
  for (const [z, y] of [[-3.7, 2.92], [-2.8, 4.84], [-1.6, 5.47], [0.5, 5.55], [2.55, 4.83], [3.8, 2.6], [4.5, 1.0]]) {
    ico(tunnel, .32 + rng() * .18, [side * (10.45 + rng() * .7), y + .09, z], rng() > .5 ? C.grassDark : '#75b153', [1, .57, .85]);
  }
  for (const z of [-4.8, 4.7]) ico(tunnel, .26, [side * 10.4, .37, z], '#b3b8a8', [1.1, .62, .7]);
}

function cherry(parent, x, z, scale, index) {
  const tree = group(parent, 'Sakura tree ' + index, [x, GROUND, z]);
  tree.scale.setScalar(scale);
  cylinder(tree, .23, .19, [0, .08, 0], '#675044', 7, .3);
  beam(tree, [0, .07, 0], [.09, 2.5, -.08], .15, '#725443', 8);
  for (const [bx, by, bz] of [[-.9, 2.9, .05], [.78, 3.15, -.05], [-.27, 3.5, -.6], [.24, 3.1, .78]]) {
    beam(tree, [.05, 1.45, -.03], [bx, by, bz], .083, '#725443', 7);
    beam(tree, [bx * .6, by - .6, bz * .6], [bx * 1.32, by + .15, bz + .2], .037, '#886250', 6);
  }
  const crown = group(tree, 'Breezy blossom crown', [0, 2.65, 0]);
  const lobes = [
    [-.9, .12, .05, .85], [-.38, .69, -.42, .93], [.5, .75, -.4, .9],
    [.99, .15, .04, .78], [.42, .04, .68, .93], [-.48, .12, .74, .9],
    [0, 1.04, .14, .94], [.11, .41, -.8, .74], [-.83, .62, -.23, .73],
  ];
  lobes.forEach(([cx, cy, cz, r], i) => {
    const col = foliage[(i + index) % foliage.length];
    const lobe = ico(crown, r, [cx, cy, cz], col, [1.0, .88 + rng() * .17, .98]);
    lobe.rotation.set(rng() * .5, rng() * 2, rng() * .4);
  });
  for (let i = 0; i < 17; i++) {
    const a = rng() * Math.PI * 2, elev = rng() * 1.65 - .2, radius = 1.0 + rng() * .27;
    const pos = [Math.cos(a) * radius, elev, Math.sin(a) * radius * .8];
    ico(crown, .28 + rng() * .29, pos, foliage[(i + 1) % foliage.length], [1.06, .87, 1]);
  }
  for (let i = 0; i < 20; i++) {
    const a = rng() * Math.PI * 2, r = .5 + rng();
    ico(tree, .037 + rng() * .016, [Math.cos(a) * r, .035, Math.sin(a) * r], '#f0b2cb', [1.7, .15, 1]);
  }
  return crown;
}

function buildGarden(parent) {
  const farm = group(parent, 'Kitchen vegetable garden');
  rounded(farm, [2.35, .12, 3.25], [10.25, .31, 8.9], '#856047', .05, true);
  for (let row = 0; row < 5; row++) {
    const z = 7.65 + row * .6;
    rounded(farm, [2.04, .13, .22], [10.25, .41, z], '#a77a53', .06);
    for (let col = 0; col < 6; col++) {
      const x = 9.38 + col * .35;
      for (const dir of [-1, 1]) {
        const leaf = ico(farm, .1, [x + dir * .055, .58, z], row % 2 ? '#91c969' : '#5eaa62', [.68, 1.0, .45]);
        leaf.rotation.z = dir * .55;
      }
      cylinder(farm, .012, .15, [x, .48, z], '#559457', 5);
    }
  }
  for (const x of [8.99, 11.51]) {
    for (const z of [7.15, 8.9, 10.65]) cylinder(farm, .035, .69, [x, .58, z], C.wood, 5);
    for (const y of [.53, .83]) beam(farm, [x, y, 7.15], [x, y, 10.65], .012, '#9f946d', 4);
  }
  const bed = group(parent, 'Station flower bed', [-2.6, .27, -7.35]);
  box(bed, [4.4, .14, .62], [0, .04, 0], C.wood, true);
  box(bed, [4.25, .07, .48], [0, .14, 0], '#826450');
  const flowerColors = ['#f4cf54', '#f6a3bb', '#eeeadd', '#ae93c9'];
  for (let i = 0; i < 29; i++) {
    const x = -2.03 + i * .143, z = rng() * .25 - .13, h = .15 + rng() * .17;
    cylinder(bed, .012, h, [x, .19 + h / 2, z], C.grassDark, 5);
    ico(bed, .07, [x, .19 + h, z], flowerColors[i % 4], [1, .57, 1]);
  }
}
function clearGround(x, z) {
  if (Math.abs(x) > 9.55 && Math.abs(z) < 5.15) return false;
  if (Math.abs(z) < 1.52) return false;
  if (x > 5.1 && x < 9.15) return false;
  if (x > -8.1 && x < 4.6 && z < -1 && z > -7.4) return false;
  if (z > 5.5 && z < 9.9 && x > -8.7 && x < 3.9) return false;
  if (x > 8.8 && z > 7.05 && z < 10.8) return false;
  return true;
}
function buildGrass(parent) {
  const positions = [], colors = [];
  const grassColors = ['#b9df88', '#b4d97f', '#74b75c', '#a2d773'];
  for (let i = 0; i < 5800; i++) {
    const x = rng() * 23.3 - 11.65, z = rng() * 23.3 - 11.65;
    if (!clearGround(x, z)) continue;
    const h = .1 + rng() * .24, w = .012 + rng() * .025, a = rng() * Math.PI;
    const dx = Math.cos(a) * w, dz = Math.sin(a) * w;
    positions.push(x - dx, .26, z - dz, x + dx, .26, z + dz, x + .045, .26 + h, z);
    const c = new THREE.Color(grassColors[i % 4]);
    for (let v = 0; v < 3; v++) colors.push(c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals();
  const m = material('#ffffff', { vertexColors: true, side: THREE.DoubleSide });
  const time = { value: 0 };
  m.onBeforeCompile = shader => {
    shader.uniforms.breezeTime = time;
    shader.vertexShader = 'uniform float breezeTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.x += sin(breezeTime * 0.85 + position.x * 1.1 + position.z * .7) * max(position.y - .26, 0.0) * .1;');
  };
  const grass = mesh(parent, geo, m); grass.name = 'Fine grass tufts'; grass.castShadow = false;
  return { mesh: grass, time };
}
function buildScatter(parent) {
  for (let i = 0; i < 65; i++) {
    const x = rng() * 22.6 - 11.3, z = rng() * 22.6 - 11.3;
    if (!clearGround(x, z)) continue;
    const r = .13 + rng() * .21;
    ico(parent, r, [x, .26 + r * .43, z], i % 5 === 0 ? '#b9b9a6' : i % 2 ? '#63a753' : '#7eb956', [1.3, .8, 1]);
  }
  const petalGeo = new THREE.CircleGeometry(.035, 5);
  const instances = new THREE.InstancedMesh(petalGeo, material('#f4bfd7', { side: THREE.DoubleSide }), 350);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 350; i++) {
    const x = rng() * 18 - 9, z = rng() * 20 - 10;
    const platform = x > -7.4 && x < 4.4 && z < -1 && z > -4.3;
    dummy.position.set(x, platform ? 1.002 : Math.abs(z) < 1 ? .47 : .269, z);
    dummy.rotation.set(-Math.PI / 2, 0, rng() * 6.28); dummy.scale.set(1, .6, 1); dummy.updateMatrix();
    instances.setMatrixAt(i, dummy.matrix);
  }
  instances.name = 'Scattered fallen petals'; parent.add(instances);
}
function createPetals(parent) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -.065); shape.bezierCurveTo(-.065, -.01, -.056, .065, -.012, .064);
  shape.lineTo(0, .047); shape.lineTo(.016, .068); shape.bezierCurveTo(.065, .04, .05, -.025, 0, -.065);
  const geom = new THREE.ShapeGeometry(shape, 3);
  const count = 150;
  const petalMesh = new THREE.InstancedMesh(geom, material('#f4bbd8', { side: THREE.DoubleSide }), count);
  petalMesh.name = 'Drifting cherry petals'; petalMesh.castShadow = false;
  petalMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); petalMesh.frustumCulled = false; parent.add(petalMesh);
  const data = Array.from({ length: count }, () => ({ x: rng() * 21.7 - 10.85, z: rng() * 21.7 - 10.85, y: rng() * 10, speed: .19 + rng() * .17, p: rng() * Math.PI * 2, scale: .5 + rng() * .7 }));
  const d = new THREE.Object3D();
  return { mesh: petalMesh, update(time) {
    data.forEach((p, i) => {
      const y = ((p.y - time * p.speed) % 9.5 + 9.5) % 9.5 + .35;
      d.position.set(p.x + Math.sin(time * .23 + p.p) * .7, y, p.z + Math.cos(time * .2 + p.p) * .5);
      d.rotation.set(p.p + time * .38, p.p + time * .3, Math.sin(time * .75 + p.p));
      d.scale.setScalar(p.scale); d.updateMatrix(); petalMesh.setMatrixAt(i, d.matrix);
    });
    petalMesh.instanceMatrix.needsUpdate = true;
  } };
}
