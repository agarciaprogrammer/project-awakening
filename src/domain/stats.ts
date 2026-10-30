import { isSameLocalWeek, localDateKey } from './dates';
import { completedSetCount, isValidSession } from './progression';
import type { WorkoutSession } from './types';

/**
 * Game attributes. Each one has its own level with a growing cost, so they keep
 * progressing for months instead of capping out:
 *   cost of level n → n+1 = step × n   (total to reach level n = step × n(n−1)/2)
 * - Fuerza:      points = completed strength sets,   step = 10 sets
 * - Resistencia: points = endurance minutes,          step = 30 min
 * - Constancia:  points = distinct days with a valid session, step = 3 days
 */
export interface Attribute {
  level: number;
  points: number;
  inLevel: number;
  needed: number;
}

export interface CharacterStats {
  fuerza: Attribute;
  resistencia: Attribute;
  constancia: Attribute;
}

export function attributeFromPoints(points: number, step: number): Attribute {
  let level = 1;
  let rest = Math.max(0, Math.floor(points));
  while (rest >= step * level) {
    rest -= step * level;
    level++;
  }
  return { level, points: Math.floor(points), inLevel: rest, needed: step * level };
}

export interface RealMetrics {
  strengthSessions: number;
  treadmillSessions: number;
  totalSets: number;
  treadmillMinutes: number;
  treadmillKm: number;
  sessionsThisWeek: number;
  lastActivityAt: number | null;
}

export function computeStats(sessions: WorkoutSession[]): CharacterStats {
  let sets = 0;
  let minutes = 0;
  const days = new Set<string>();
  for (const s of sessions) {
    if (s.type === 'strength') sets += completedSetCount(s.exercises);
    else minutes += Math.floor(s.treadmill.durationSec / 60);
    if (isValidSession(s)) days.add(localDateKey(s.endedAt));
  }
  return {
    fuerza: attributeFromPoints(sets, 10),
    resistencia: attributeFromPoints(minutes, 30),
    constancia: attributeFromPoints(days.size, 3),
  };
}

export function computeMetrics(sessions: WorkoutSession[], now: number): RealMetrics {
  const m: RealMetrics = {
    strengthSessions: 0,
    treadmillSessions: 0,
    totalSets: 0,
    treadmillMinutes: 0,
    treadmillKm: 0,
    sessionsThisWeek: 0,
    lastActivityAt: null,
  };
  for (const s of sessions) {
    if (s.type === 'strength') {
      m.strengthSessions++;
      m.totalSets += completedSetCount(s.exercises);
    } else {
      m.treadmillSessions++;
      m.treadmillMinutes += s.treadmill.durationSec / 60;
      m.treadmillKm += s.treadmill.distanceKm ?? 0;
    }
    if (isValidSession(s) && isSameLocalWeek(s.endedAt, now)) m.sessionsThisWeek++;
    if (m.lastActivityAt === null || s.endedAt > m.lastActivityAt) m.lastActivityAt = s.endedAt;
  }
  return m;
}
