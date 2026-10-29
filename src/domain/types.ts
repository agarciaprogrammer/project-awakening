// Core domain model. All timestamps are epoch milliseconds; local-day logic lives in dates.ts.

export type ExerciseMode = 'reps' | 'seconds';
export type ActivityType = 'strength' | 'treadmill';

export interface ExerciseDefinition {
  id: string;
  name: string;
  mode: ExerciseMode;
  perSide: boolean;
  custom: boolean;
  createdAt: number;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  sets: number;
  targetMin: number;
  targetMax: number;
  mode: ExerciseMode;
  perSide: boolean;
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  createdAt: number;
  updatedAt: number;
}

export interface ExerciseSet {
  id: string;
  /** Reps or seconds actually performed, as entered by the user. */
  value: number | null;
  completed: boolean;
}

/** Snapshot of an exercise as it was performed. Name/mode are copied so later routine edits don't rewrite history. */
export interface StrengthExerciseLog {
  id: string;
  exerciseId: string;
  name: string;
  mode: ExerciseMode;
  perSide: boolean;
  targetMin: number;
  targetMax: number;
  sets: ExerciseSet[];
}

export interface TreadmillLog {
  durationSec: number;
  distanceKm: number | null;
  note: string;
}

interface BaseSession {
  id: string;
  status: 'completed';
  startedAt: number;
  endedAt: number;
  durationSec: number;
  createdAt: number;
}

export interface StrengthSession extends BaseSession {
  type: 'strength';
  routineId: string;
  routineName: string;
  exercises: StrengthExerciseLog[];
}

export interface TreadmillSession extends BaseSession {
  type: 'treadmill';
  treadmill: TreadmillLog;
}

export type WorkoutSession = StrengthSession | TreadmillSession;

export interface ActiveStrengthSession {
  id: string;
  type: 'strength';
  status: 'active';
  startedAt: number;
  createdAt: number;
  routineId: string;
  routineName: string;
  exercises: StrengthExerciseLog[];
}

export interface ActiveTreadmillSession {
  id: string;
  type: 'treadmill';
  status: 'active';
  startedAt: number;
  createdAt: number;
  /** Set when the user taps Finish; the timer freezes while they fill in the form. */
  stoppedAt: number | null;
}

export type ActiveSession = ActiveStrengthSession | ActiveTreadmillSession;

/** Always derived from completed sessions, never stored. */
export interface GameProgress {
  totalXp: number;
  level: number;
  xpInLevel: number;
  xpForNext: number;
}

export interface Mission {
  id: 'daily' | 'weekly';
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  /** Daily mission on a rest day: nothing is required. */
  resting?: boolean;
}

export interface UserSettings {
  /** JS weekday numbers (0 = Sunday … 6 = Saturday). */
  restDays: number[];
}

export interface AppState {
  version: 1;
  settings: UserSettings;
  exercises: ExerciseDefinition[];
  routines: Routine[];
  activeRoutineId: string;
  sessions: WorkoutSession[];
  activeSession: ActiveSession | null;
}
