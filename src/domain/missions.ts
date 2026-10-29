import { isSameLocalWeek, localDateKey } from './dates';
import { isValidSession } from './progression';
import type { Mission, UserSettings, WorkoutSession } from './types';

export const WEEKLY_TARGET = 3;

export function isRestDay(settings: UserSettings, now: number): boolean {
  return settings.restDays.includes(new Date(now).getDay());
}

export function computeMissions(sessions: WorkoutSession[], settings: UserSettings, now: number): { daily: Mission; weekly: Mission; restDay: boolean } {
  const valid = sessions.filter(isValidSession);
  const today = localDateKey(now);
  const doneToday = valid.filter((s) => localDateKey(s.endedAt) === today).length;
  const thisWeek = valid.filter((s) => isSameLocalWeek(s.endedAt, now)).length;
  const restDay = isRestDay(settings, now);

  const daily: Mission = restDay
    ? {
        id: 'daily',
        title: 'Rest & recover',
        description: doneToday > 0 ? 'Rest day — and you trained anyway.' : 'Rest day. Recovery is part of the path.',
        progress: doneToday > 0 ? 1 : 0,
        target: 1,
        completed: doneToday > 0,
        resting: true,
      }
    : {
        id: 'daily',
        title: 'Daily training',
        description: 'Complete one strength or endurance session today.',
        progress: Math.min(1, doneToday),
        target: 1,
        completed: doneToday > 0,
      };

  const weekly: Mission = {
    id: 'weekly',
    title: 'Weekly trial',
    description: `Complete ${WEEKLY_TARGET} sessions this week (Mon–Sun).`,
    progress: Math.min(WEEKLY_TARGET, thisWeek),
    target: WEEKLY_TARGET,
    completed: thisWeek >= WEEKLY_TARGET,
  };

  return { daily, weekly, restDay };
}
