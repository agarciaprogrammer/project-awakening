import type { GameProgress, StrengthExerciseLog, WorkoutSession } from './types';

export const STRENGTH_BASE_XP = 15;
export const STRENGTH_XP_PER_EXERCISE = 5;
export const SESSION_XP_CAP = 50;

/** XP = min(50, 15 + 5 × distinct exercises with ≥1 completed set). 0 if nothing completed. */
export function strengthXp(exercises: StrengthExerciseLog[]): number {
  const done = new Set(exercises.filter((e) => e.sets.some((s) => s.completed)).map((e) => e.exerciseId));
  if (done.size === 0) return 0;
  return Math.min(SESSION_XP_CAP, STRENGTH_BASE_XP + STRENGTH_XP_PER_EXERCISE * done.size);
}

/** XP = min(50, full minutes). Distance never adds XP. */
export function treadmillXp(durationSec: number): number {
  return Math.min(SESSION_XP_CAP, Math.floor(Math.max(0, durationSec) / 60));
}

export function sessionXp(s: WorkoutSession): number {
  return s.type === 'strength' ? strengthXp(s.exercises) : treadmillXp(s.treadmill.durationSec);
}

/**
 * XP needed to go from `level` to `level + 1`: 40 + 12·√(level − 1), rounded.
 * Cheap early levels (LV 2 after the first session), then it slowly flattens out.
 * At ~5 sessions/week: LV 10 in ~3 weeks, LV 50 in ~6 months, LV 150 in ~2 years. No cap.
 */
export function xpForNextLevel(level: number): number {
  return Math.round(40 + 12 * Math.sqrt(Math.max(0, level - 1)));
}

export function progressFromXp(totalXp: number): GameProgress {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
  }
  return { totalXp: Math.max(0, Math.floor(totalXp)), level, xpInLevel: remaining, xpForNext: xpForNextLevel(level) };
}

/** Progress is always re-derived from the saved sessions so it can never drift. */
export function computeProgress(sessions: WorkoutSession[]): GameProgress {
  return progressFromXp(sessions.reduce((sum, s) => sum + sessionXp(s), 0));
}

export function completedSetCount(exercises: StrengthExerciseLog[]): number {
  return exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0);
}

export function completedExerciseCount(exercises: StrengthExerciseLog[]): number {
  return exercises.filter((e) => e.sets.some((s) => s.completed)).length;
}

/** A session that counts towards missions and VIT. */
export function isValidSession(s: WorkoutSession): boolean {
  return s.type === 'strength' ? completedSetCount(s.exercises) > 0 : s.treadmill.durationSec >= 60;
}
