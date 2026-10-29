import type { ExerciseDefinition, ExerciseMode, Routine } from './types';

type Seed = [id: string, name: string, mode: ExerciseMode, perSide: boolean];

// Stable ids: history and routines reference these.
const SEEDS: Seed[] = [
  ['incline-pushup', 'Flexiones inclinadas', 'reps', false],
  ['squat', 'Sentadillas', 'reps', false],
  ['glute-bridge', 'Puente de glúteos', 'reps', false],
  ['reverse-lunge', 'Zancadas hacia atrás', 'reps', true],
  ['plank', 'Plancha', 'seconds', false],
  ['calf-raise', 'Elevaciones de pantorrillas', 'reps', false],
  ['prone-yt', 'Elevaciones Y/T boca abajo', 'reps', false],
  ['pushup', 'Flexiones', 'reps', false],
  ['knee-pushup', 'Flexiones de rodillas', 'reps', false],
  ['pike-pushup', 'Flexiones pike', 'reps', false],
  ['chair-dip', 'Fondos en silla', 'reps', false],
  ['split-squat', 'Sentadilla búlgara', 'reps', true],
  ['step-up', 'Subidas al escalón', 'reps', true],
  ['wall-sit', 'Sentadilla isométrica en pared', 'seconds', false],
  ['single-leg-bridge', 'Puente a una pierna', 'reps', true],
  ['side-plank', 'Plancha lateral', 'seconds', true],
  ['hollow-hold', 'Hollow hold', 'seconds', false],
  ['dead-bug', 'Dead bug', 'reps', true],
  ['bird-dog', 'Bird dog', 'reps', true],
  ['superman', 'Superman', 'reps', false],
  ['mountain-climber', 'Escaladores', 'reps', true],
  ['burpee', 'Burpees', 'reps', false],
];

export function createCatalog(now: number): ExerciseDefinition[] {
  return SEEDS.map(([id, name, mode, perSide]) => ({ id, name, mode, perSide, custom: false, createdAt: now }));
}

export const DEFAULT_ROUTINE_ID = 'calisthenics-base';

export function createDefaultRoutine(now: number): Routine {
  const rx = (exerciseId: string, targetMin: number, targetMax: number, mode: ExerciseMode = 'reps', perSide = false) => ({
    id: `rx-${exerciseId}`,
    exerciseId,
    sets: 1,
    targetMin,
    targetMax,
    mode,
    perSide,
  });
  return {
    id: DEFAULT_ROUTINE_ID,
    name: 'Calisthenics — Base',
    createdAt: now,
    updatedAt: now,
    exercises: [
      rx('incline-pushup', 6, 12),
      rx('squat', 10, 15),
      rx('glute-bridge', 12, 20),
      rx('reverse-lunge', 6, 10, 'reps', true),
      rx('plank', 20, 40, 'seconds'),
      rx('calf-raise', 12, 20),
      rx('prone-yt', 8, 12),
    ],
  };
}
