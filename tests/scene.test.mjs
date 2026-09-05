import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildLandscape } from '../src/landscape.js';
import { buildStation, buildVillage } from '../src/station.js';
import { buildInfrastructure } from '../src/infrastructure.js';
import { buildTrain } from '../src/train.js';
import { sampleMotion } from '../src/motion.js';

function geometryReport(root) {
  root.updateMatrixWorld(true);
  let meshCount = 0;
  const box = new THREE.Box3();
  root.traverse(object => {
    if (!object.isMesh && !object.isLineSegments) return;
    meshCount++;
    const attribute = object.geometry.attributes.position;
    assert.ok(Array.from(attribute.array).every(Number.isFinite), `Finite vertices: ${object.name}`);
    object.geometry.computeBoundingBox();
    const bounds = object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
    box.union(bounds);
  });
  return { meshCount, box };
}

test('landscape has a square layered base, bounded terrain and twelve animated crowns', () => {
  const root = new THREE.Group();
  const landscape = buildLandscape(root); landscape.update(20);
  const result = geometryReport(landscape.group);
  assert.ok(result.meshCount > 500);
  const size = new THREE.Box3().setFromObject(root.getObjectByName('Square model base')).getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.x - size.z) < .01, 'Base is square');
  assert.ok(size.y > 1.5, 'Base has substantial thickness');
  assert.ok(result.box.min.x >= -12.1 && result.box.max.x <= 12.1, `X bounded: ${result.box.min.x}..${result.box.max.x}`);
  assert.ok(result.box.min.z >= -12.1 && result.box.max.z <= 12.1, `Z bounded: ${result.box.min.z}..${result.box.max.z}`);
  const crowns = []; root.traverse(o => { if (o.name === 'Breezy blossom crown') crowns.push(o); });
  assert.equal(crowns.length, 12);
  const angle = crowns[0].rotation.z; landscape.update(21);
  assert.notEqual(crowns[0].rotation.z, angle);
});

test('station, village and infrastructure consist of finite contained geometry', () => {
  for (const build of [buildStation, buildVillage, buildInfrastructure]) {
    const root = new THREE.Group(); build(root);
    const { box, meshCount } = geometryReport(root);
    assert.ok(meshCount > 100);
    assert.ok(box.min.x > -12 && box.max.x < 12, `${build.name} X bounds: ${box.min.x}..${box.max.x}`);
    assert.ok(box.min.z > -12 && box.max.z < 12, `${build.name} Z bounds: ${box.min.z}..${box.max.z}`);
  }
});

test('departure signal prepares yellow, clears green and returns red after the train passes', () => {
  assert.equal(sampleMotion(20).signal, 'red');
  assert.equal(sampleMotion(25).signal, 'yellow');
  assert.equal(sampleMotion(28).signal, 'green');
  assert.equal(sampleMotion(38).signal, 'red');
  assert.equal(sampleMotion(52).signal, 'green');
});

test('crossing lamps warn before the arms start to close and alternate independently', () => {
  const root = new THREE.Group(); const infrastructure = buildInfrastructure(root);
  const lamps = []; root.traverse(o => { if (o.userData.kind === 'crossing-lens') lamps.push(o); });
  infrastructure.update(sampleMotion(26.1), 26.1);
  assert.equal(lamps.filter(o => o.material.emissiveIntensity > 0).length, 2);
  const phase = lamps.map(o => o.material.emissiveIntensity);
  infrastructure.update(sampleMotion(26.5), 26.5);
  assert.notDeepEqual(lamps.map(o => o.material.emissiveIntensity), phase);
  infrastructure.update(sampleMotion(20), 20);
  assert.ok(lamps.every(o => o.material.emissiveIntensity === 0));
});

test('train details follow the railcars and exterior is clipped at the model edge', () => {
  const root = new THREE.Group(); const train = buildTrain(root);
  train.update(sampleMotion(20), 20);
  const before = new THREE.Box3().setFromObject(train.group).getCenter(new THREE.Vector3());
  train.update(sampleMotion(36), 36);
  const after = new THREE.Box3().setFromObject(train.group).getCenter(new THREE.Vector3());
  assert.ok(Math.abs(after.x - before.x - (sampleMotion(36).trainX - sampleMotion(20).trainX)) < .001);
  train.group.traverse(o => {
    if (o.isMesh || o.isLineSegments) assert.equal(o.material.clippingPlanes.length, 2, `World-space clipping: ${o.name}`);
  });
  train.update(sampleMotion(52), 52); assert.equal(train.group.visible, false);
});
