// The only module that touches localStorage.
import { createCatalog, createDefaultRoutine, DEFAULT_ROUTINE_ID } from '../domain/catalog';
import type { AppState } from '../domain/types';

export const STORAGE_KEY = 'project-awakening:state';
export const CURRENT_VERSION = 1;

export function createDefaultState(now = Date.now()): AppState {
  return {
    version: 1,
    settings: { restDays: [1, 3] }, // Monday & Wednesday
    exercises: createCatalog(now),
    routines: [createDefaultRoutine(now)],
    activeRoutineId: DEFAULT_ROUTINE_ID,
    sessions: [],
    activeSession: null,
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isStr = (x: unknown): x is string => typeof x === 'string';

function validSet(x: unknown): boolean {
  return isObj(x) && isStr(x.id) && (x.value === null || isNum(x.value)) && typeof x.completed === 'boolean';
}

function validLog(x: unknown): boolean {
  return isObj(x) && isStr(x.id) && isStr(x.exerciseId) && isStr(x.name) && Array.isArray(x.sets) && x.sets.every(validSet);
}

function validSession(x: unknown): boolean {
  if (!isObj(x) || !isStr(x.id) || !isNum(x.startedAt) || !isNum(x.endedAt) || !isNum(x.durationSec)) return false;
  if (x.type === 'strength') return Array.isArray(x.exercises) && x.exercises.every(validLog);
  if (x.type === 'treadmill')
    return isObj(x.treadmill) && isNum(x.treadmill.durationSec) && (x.treadmill.distanceKm === null || isNum(x.treadmill.distanceKm));
  return false;
}

/** Structural validation; returns an error message or null. */
export function validateState(x: unknown): string | null {
  if (!isObj(x)) return 'No es un objeto JSON.';
  if (x.version !== CURRENT_VERSION) return `Versión no compatible: ${String(x.version)}.`;
  if (!isObj(x.settings) || !Array.isArray(x.settings.restDays)) return 'Faltan los ajustes.';
  if (!Array.isArray(x.exercises) || !x.exercises.every((e) => isObj(e) && isStr(e.id) && isStr(e.name))) return 'Lista de ejercicios inválida.';
  if (!Array.isArray(x.routines) || x.routines.length === 0) return 'Faltan las rutinas.';
  if (!x.routines.every((r) => isObj(r) && isStr(r.id) && isStr(r.name) && Array.isArray(r.exercises))) return 'Rutina inválida.';
  if (!isStr(x.activeRoutineId)) return 'Falta la rutina activa.';
  if (!Array.isArray(x.sessions) || !x.sessions.every(validSession)) return 'Historial de sesiones inválido.';
  if (x.activeSession !== null && !(isObj(x.activeSession) && isStr(x.activeSession.id) && isNum(x.activeSession.startedAt)))
    return 'Sesión en curso inválida.';
  return null;
}

/** Future schema changes go here, keyed by the stored version. */
function migrate(raw: unknown): unknown {
  return raw;
}

export function loadState(): AppState {
  let text: string | null = null;
  try {
    text = localStorage.getItem(STORAGE_KEY);
  } catch {
    return createDefaultState();
  }
  if (text === null) {
    const fresh = createDefaultState();
    saveState(fresh);
    return fresh;
  }
  try {
    const parsed = migrate(JSON.parse(text));
    const err = validateState(parsed);
    if (err === null) {
      const state = parsed as AppState;
      if (!state.routines.some((r) => r.id === state.activeRoutineId)) state.activeRoutineId = state.routines[0].id;
      return state;
    }
    console.warn('Stored state invalid:', err);
  } catch (e) {
    console.warn('Stored state unreadable', e);
  }
  // Never silently destroy data: keep the unreadable blob aside before starting fresh.
  try {
    localStorage.setItem(`${STORAGE_KEY}:corrupt:${Date.now()}`, text);
  } catch {
    /* ignore */
  }
  const fresh = createDefaultState();
  saveState(fresh);
  return fresh;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

export function exportBackup(state: AppState): string {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function parseBackup(text: string): { ok: true; state: AppState } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  parsed = migrate(parsed);
  const err = validateState(parsed);
  if (err) return { ok: false, error: err };
  const { exportedAt: _ignored, ...rest } = parsed as AppState & { exportedAt?: string };
  void _ignored;
  return { ok: true, state: rest as AppState };
}
