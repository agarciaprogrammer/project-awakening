import { newId } from '../domain/ids';
import type {
  ActiveStrengthSession,
  AppState,
  ExerciseDefinition,
  Routine,
  StrengthExerciseLog,
  StrengthSession,
  TreadmillSession,
  UserSettings,
  WorkoutSession,
} from '../domain/types';
import { createDefaultState } from '../storage/storage';

export type Action =
  | { type: 'START_SESSION'; kind: 'strength' | 'treadmill'; now: number }
  | { type: 'SET_VALUE'; logId: string; setId: string; value: number | null }
  | { type: 'TOGGLE_SET'; logId: string; setId: string }
  | { type: 'ADD_SET'; logId: string }
  | { type: 'REMOVE_SET'; logId: string; setId: string }
  | { type: 'FINISH_STRENGTH'; now: number }
  | { type: 'STOP_TREADMILL'; now: number }
  | { type: 'RESUME_TREADMILL' }
  | { type: 'SAVE_TREADMILL'; durationSec: number; distanceKm: number | null; note: string; now: number }
  | { type: 'CANCEL_SESSION' }
  | { type: 'DELETE_SESSION'; id: string }
  | { type: 'UPDATE_ROUTINE'; routine: Routine; now: number }
  | { type: 'ADD_EXERCISE_DEF'; def: ExerciseDefinition }
  | { type: 'UPDATE_SETTINGS'; settings: UserSettings }
  | { type: 'REPLACE_STATE'; state: AppState }
  | { type: 'RESET'; now: number };

function insertSession(sessions: WorkoutSession[], s: WorkoutSession): WorkoutSession[] {
  if (sessions.some((x) => x.id === s.id)) return sessions; // never reward twice
  return [s, ...sessions].sort((a, b) => b.endedAt - a.endedAt);
}

function buildStrengthSession(state: AppState, now: number): ActiveStrengthSession | null {
  const routine = state.routines.find((r) => r.id === state.activeRoutineId) ?? state.routines[0];
  if (!routine) return null;
  const exercises: StrengthExerciseLog[] = routine.exercises.map((rx) => {
    const def = state.exercises.find((d) => d.id === rx.exerciseId);
    return {
      id: newId(),
      exerciseId: rx.exerciseId,
      name: def?.name ?? rx.exerciseId,
      mode: rx.mode,
      perSide: rx.perSide,
      targetMin: rx.targetMin,
      targetMax: rx.targetMax,
      sets: Array.from({ length: Math.max(1, rx.sets) }, () => ({ id: newId(), value: null, completed: false })),
    };
  });
  return { id: newId(), type: 'strength', status: 'active', startedAt: now, createdAt: now, routineId: routine.id, routineName: routine.name, exercises };
}

function mapStrength(state: AppState, fn: (a: ActiveStrengthSession) => ActiveStrengthSession): AppState {
  const a = state.activeSession;
  if (!a || a.type !== 'strength') return state;
  return { ...state, activeSession: fn(a) };
}

function mapLog(a: ActiveStrengthSession, logId: string, fn: (l: StrengthExerciseLog) => StrengthExerciseLog): ActiveStrengthSession {
  return { ...a, exercises: a.exercises.map((l) => (l.id === logId ? fn(l) : l)) };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START_SESSION': {
      if (state.activeSession) return state; // one session at a time
      const s =
        action.kind === 'strength'
          ? buildStrengthSession(state, action.now)
          : { id: newId(), type: 'treadmill' as const, status: 'active' as const, startedAt: action.now, createdAt: action.now, stoppedAt: null };
      return s ? { ...state, activeSession: s } : state;
    }
    case 'SET_VALUE':
      return mapStrength(state, (a) =>
        mapLog(a, action.logId, (l) => ({
          ...l,
          sets: l.sets.map((s) =>
            s.id === action.setId ? { ...s, value: action.value, completed: action.value && action.value > 0 ? s.completed : false } : s,
          ),
        })),
      );
    case 'TOGGLE_SET':
      return mapStrength(state, (a) =>
        mapLog(a, action.logId, (l) => ({
          ...l,
          sets: l.sets.map((s) => {
            if (s.id !== action.setId) return s;
            if (!s.completed && !(s.value && s.value > 0)) return s; // must log a real value first
            return { ...s, completed: !s.completed };
          }),
        })),
      );
    case 'ADD_SET':
      return mapStrength(state, (a) =>
        mapLog(a, action.logId, (l) => ({ ...l, sets: [...l.sets, { id: newId(), value: null, completed: false }] })),
      );
    case 'REMOVE_SET':
      return mapStrength(state, (a) =>
        mapLog(a, action.logId, (l) => (l.sets.length <= 1 ? l : { ...l, sets: l.sets.filter((s) => s.id !== action.setId) })),
      );
    case 'FINISH_STRENGTH': {
      const a = state.activeSession;
      if (!a || a.type !== 'strength') return state;
      // Keep only what was actually done.
      const exercises = a.exercises
        .map((l) => ({ ...l, sets: l.sets.filter((s) => s.completed) }))
        .filter((l) => l.sets.length > 0);
      const session: StrengthSession = {
        id: a.id,
        type: 'strength',
        status: 'completed',
        startedAt: a.startedAt,
        endedAt: action.now,
        durationSec: Math.max(0, Math.round((action.now - a.startedAt) / 1000)),
        createdAt: action.now,
        routineId: a.routineId,
        routineName: a.routineName,
        exercises,
      };
      return { ...state, activeSession: null, sessions: insertSession(state.sessions, session) };
    }
    case 'STOP_TREADMILL': {
      const a = state.activeSession;
      if (!a || a.type !== 'treadmill' || a.stoppedAt !== null) return state;
      return { ...state, activeSession: { ...a, stoppedAt: action.now } };
    }
    case 'RESUME_TREADMILL': {
      const a = state.activeSession;
      if (!a || a.type !== 'treadmill') return state;
      return { ...state, activeSession: { ...a, stoppedAt: null } };
    }
    case 'SAVE_TREADMILL': {
      const a = state.activeSession;
      if (!a || a.type !== 'treadmill') return state;
      const durationSec = Math.max(0, Math.round(action.durationSec));
      const endedAt = a.stoppedAt ?? action.now;
      const session: TreadmillSession = {
        id: a.id,
        type: 'treadmill',
        status: 'completed',
        // The entered duration is authoritative (the timer may have been started late or not at all).
        startedAt: endedAt - durationSec * 1000,
        endedAt,
        durationSec,
        createdAt: action.now,
        treadmill: { durationSec, distanceKm: action.distanceKm, note: action.note.trim() },
      };
      return { ...state, activeSession: null, sessions: insertSession(state.sessions, session) };
    }
    case 'CANCEL_SESSION':
      return { ...state, activeSession: null };
    case 'DELETE_SESSION':
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };
    case 'UPDATE_ROUTINE':
      return { ...state, routines: state.routines.map((r) => (r.id === action.routine.id ? { ...action.routine, updatedAt: action.now } : r)) };
    case 'ADD_EXERCISE_DEF':
      return state.exercises.some((e) => e.id === action.def.id) ? state : { ...state, exercises: [...state.exercises, action.def] };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.settings };
    case 'REPLACE_STATE':
      return action.state;
    case 'RESET':
      return createDefaultState(action.now);
  }
}
