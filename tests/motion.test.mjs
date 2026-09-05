import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CYCLE,
  DWELL_END,
  DEPARTURE_END,
  OPEN_GATE_ANGLE,
  ROAD_CROSSING,
  TRAIN_LENGTH,
  sampleMotion,
} from '../src/motion.js';

const nearly = (actual, expected, tolerance = 1e-8) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);
};

function occupied(state) {
  const front = state.trainX + TRAIN_LENGTH / 2;
  const rear = state.trainX - TRAIN_LENGTH / 2;
  return front >= ROAD_CROSSING.min && rear <= ROAD_CROSSING.max;
}

test('approach arrives at the exact station stop and dwell lasts 10 seconds', () => {
  const atArrival = sampleMotion(16);
  const atDwellEnd = sampleMotion(DWELL_END);
  nearly(atArrival.trainX, -2);
  nearly(atArrival.velocity, 0);
  assert.equal(atArrival.phase, 'dwell');
  nearly(atDwellEnd.trainX, -2);
  nearly(atDwellEnd.velocity, 0);
  assert.equal(atDwellEnd.phase, 'departure');
  assert.equal(sampleMotion(20).phase, 'dwell');
  assert.equal(sampleMotion(20).trainX, -2);
});

test('motion has smooth zero-velocity boundaries', () => {
  for (const boundary of [0, 16, 26, 49]) {
    nearly(sampleMotion(boundary).velocity, 0);
  }
  assert.ok(sampleMotion(15.999).velocity < 0.01);
  assert.ok(sampleMotion(26.001).velocity < 0.01);
  assert.equal(sampleMotion(16).trainX, -2);
  assert.equal(sampleMotion(26).trainX, -2);
  assert.equal(sampleMotion(16.01).trainX, -2);
  assert.ok(sampleMotion(26.01).trainX > -2);
});

test('gates are fully closed whenever the train occupies the road crossing', () => {
  let sawOccupied = false;
  let sawWarningAndOccupied = false;
  for (let seconds = 0; seconds < CYCLE; seconds += 0.05) {
    const state = sampleMotion(seconds);
    if (occupied(state)) {
      sawOccupied = true;
      assert.equal(state.gateAngle, 0, `gate open at ${seconds.toFixed(2)} seconds`);
      assert.equal(state.warning, true);
      sawWarningAndOccupied = true;
    }
    if (state.gateAngle === 0) assert.equal(state.warning, true);
  }
  assert.equal(sawOccupied, true);
  assert.equal(sawWarningAndOccupied, true);
  nearly(sampleMotion(26).gateAngle, OPEN_GATE_ANGLE);
  nearly(sampleMotion(31).gateAngle, 0);
  nearly(sampleMotion(46).gateAngle, 0);
  nearly(sampleMotion(50).gateAngle, OPEN_GATE_ANGLE);
});

test('warning begins before closing and the train is hidden after departure', () => {
  assert.equal(sampleMotion(26).warning, true);
  assert.equal(sampleMotion(26).trainVisible, true);
  assert.equal(sampleMotion(27).warning, true);
  assert.equal(sampleMotion(DEPARTURE_END).trainVisible, false);
  assert.equal(sampleMotion(55.99).trainVisible, false);
  assert.equal(sampleMotion(CYCLE + 0.01).trainVisible, true);
  assert.equal(sampleMotion(CYCLE + 0.01).phase, 'approach');
});

test('stationary dwell does not drift across repeated samples', () => {
  const first = sampleMotion(18);
  for (let seconds = 18; seconds <= 25.99; seconds += 0.37) {
    const state = sampleMotion(seconds);
    assert.equal(state.trainX, first.trainX);
    assert.equal(state.velocity, 0);
  }
});
