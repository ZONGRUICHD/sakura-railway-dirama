export const CYCLE = 56;
export const APPROACH_START = 0;
export const ARRIVAL_TIME = 16;
export const DWELL_END = 26;
export const DEPARTURE_END = 49;
export const HIDDEN_END = CYCLE;
export const TRAIN_LENGTH = 6;
export const TRAIN_HALF_LENGTH = TRAIN_LENGTH / 2;
export const ROAD_CROSSING = Object.freeze({ min: 5.65, max: 8.75 });
export const ROAD_EDGE = 8.85;
export const APPROACH_START_X = -16;
export const STATION_X = -2;
export const DEPARTURE_END_X = 16;
export const OPEN_GATE_ANGLE = Math.PI * 0.47;

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function smoothstepDerivative(t, duration, distance) {
  return distance * 6 * t * (1 - t) / duration;
}

function interpolate(start, end, t) {
  return start + (end - start) * smoothstep(t);
}

function gateAngleAt(time) {
  if (time < 27) return OPEN_GATE_ANGLE;
  if (time < 31) return OPEN_GATE_ANGLE * (1 - smoothstep((time - 27) / 4));
  if (time < 46) return 0;
  if (time < 50) return OPEN_GATE_ANGLE * smoothstep((time - 46) / 4);
  return OPEN_GATE_ANGLE;
}

/**
 * Sample the complete, drift-free 56 second miniature railway sequence.
 * The returned position is absolute, so callers never integrate velocity.
 */
export function sampleMotion(seconds = 0) {
  const numericSeconds = Number.isFinite(seconds) ? seconds : 0;
  const cycleTime = mod(numericSeconds, CYCLE);
  let trainX;
  let velocity;
  let phase;
  let trainVisible = true;

  if (cycleTime < ARRIVAL_TIME) {
    const t = cycleTime / ARRIVAL_TIME;
    trainX = interpolate(APPROACH_START_X, STATION_X, t);
    velocity = smoothstepDerivative(t, ARRIVAL_TIME, STATION_X - APPROACH_START_X);
    phase = 'approach';
  } else if (cycleTime < DWELL_END) {
    trainX = STATION_X;
    velocity = 0;
    phase = 'dwell';
  } else if (cycleTime < DEPARTURE_END) {
    const t = (cycleTime - DWELL_END) / (DEPARTURE_END - DWELL_END);
    trainX = interpolate(STATION_X, DEPARTURE_END_X, t);
    velocity = smoothstepDerivative(t, DEPARTURE_END - DWELL_END, DEPARTURE_END_X - STATION_X);
    phase = 'departure';
  } else {
    trainX = DEPARTURE_END_X;
    velocity = 0;
    phase = 'hidden';
    trainVisible = false;
  }

  let signal;
  if (phase === 'dwell' && cycleTime >= DWELL_END - 2) signal = 'yellow';
  else if (phase === 'departure' && trainX + TRAIN_HALF_LENGTH < 8.95) signal = 'green';
  else if (phase === 'hidden') signal = 'green';
  else signal = 'red';

  return {
    cycleTime,
    trainX,
    velocity,
    phase,
    gateAngle: gateAngleAt(cycleTime),
    warning: cycleTime >= DWELL_END && cycleTime < 50,
    signal,
    trainVisible,
  };
}

export const motionConstants = Object.freeze({
  CYCLE,
  ARRIVAL_TIME,
  DWELL_END,
  DEPARTURE_END,
  TRAIN_LENGTH,
  ROAD_CROSSING,
  ROAD_EDGE,
  OPEN_GATE_ANGLE,
});
