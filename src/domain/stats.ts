import { isSameLocalWeek, localDateKey } from './dates';
import { completedSetCount, isValidSession, strengthXp } from './progression';
import type { WorkoutSession } from './types';

export interface CharacterStats {
  /** STR = 1 + floor(total strength XP / 40). Rewards showing up for strength sessions. */
  str: number;
  /** END = 1 + floor(total treadmill minutes / 30). */
  end: number;
  /** VIT = 1 + floor(distinct local days with a valid session / 3). Regularity, never decreases. */
  vit: number;
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
  let strXp = 0;
  let minutes = 0;
  const days = new Set<string>();
  for (const s of sessions) {
    if (s.type === 'strength') strXp += strengthXp(s.exercises);
    else minutes += Math.floor(s.treadmill.durationSec / 60);
    if (isValidSession(s)) days.add(localDateKey(s.endedAt));
  }
  return {
    str: 1 + Math.floor(strXp / 40),
    end: 1 + Math.floor(minutes / 30),
    vit: 1 + Math.floor(days.size / 3),
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
