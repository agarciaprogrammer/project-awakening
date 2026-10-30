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
        title: 'Descansá y recuperate',
        description: doneToday > 0 ? 'Día de descanso, y entrenaste igual.' : 'Día de descanso. Recuperarse también es parte del camino.',
        progress: doneToday > 0 ? 1 : 0,
        target: 1,
        completed: doneToday > 0,
        resting: true,
      }
    : {
        id: 'daily',
        title: 'Entrenamiento diario',
        description: 'Completá hoy una sesión de fuerza o de resistencia.',
        progress: Math.min(1, doneToday),
        target: 1,
        completed: doneToday > 0,
      };

  const weekly: Mission = {
    id: 'weekly',
    title: 'Prueba semanal',
    description: `Completá ${WEEKLY_TARGET} sesiones esta semana (lun–dom).`,
    progress: Math.min(WEEKLY_TARGET, thisWeek),
    target: WEEKLY_TARGET,
    completed: thisWeek >= WEEKLY_TARGET,
  };

  return { daily, weekly, restDay };
}
