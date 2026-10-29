import { describe, expect, it } from 'vitest';
import { progressFromXp, strengthXp, treadmillXp, xpForNextLevel } from './progression';
import { startOfLocalWeek } from './dates';
import { reducer } from '../state/reducer';
import { createDefaultState } from '../storage/storage';
import type { StrengthExerciseLog } from './types';

const log = (exerciseId: string, completed: boolean[]): StrengthExerciseLog => ({
  id: exerciseId, exerciseId, name: exerciseId, mode: 'reps', perSide: false, targetMin: 1, targetMax: 2,
  sets: completed.map((c, i) => ({ id: `${exerciseId}-${i}`, value: 5, completed: c })),
});

describe('xp rules', () => {
  it('strength', () => {
    expect(strengthXp([log('a', [false])])).toBe(0);
    expect(strengthXp([log('a', [true, true, true])])).toBe(20);
    expect(strengthXp(['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => log(id, [true])))).toBe(50);
  });
  it('treadmill', () => {
    expect(treadmillXp(59)).toBe(0);
    expect(treadmillXp(30 * 60 + 59)).toBe(30);
    expect(treadmillXp(120 * 60)).toBe(50);
  });
  it('level curve', () => {
    expect([1, 2, 3, 4].map(xpForNextLevel)).toEqual([100, 120, 140, 160]);
    expect(progressFromXp(0)).toMatchObject({ level: 1, xpInLevel: 0, xpForNext: 100 });
    expect(progressFromXp(100)).toMatchObject({ level: 2, xpInLevel: 0 });
    expect(progressFromXp(230)).toMatchObject({ level: 3, xpInLevel: 10 });
    expect(progressFromXp(1_000_000).level).toBeGreaterThan(20);
  });
});

describe('dates', () => {
  it('week starts Monday local', () => {
    const sun = new Date(2026, 10, 1, 23, 30).getTime(); // Sunday
    expect(new Date(startOfLocalWeek(sun)).getDate()).toBe(26); // Monday Oct 26
    const mon = new Date(2026, 10, 2, 0, 5).getTime();
    expect(new Date(startOfLocalWeek(mon)).getDate()).toBe(2);
  });
});

describe('session lifecycle', () => {
  it('finishes once, keeps only completed work', () => {
    let s = reducer(createDefaultState(0), { type: 'START_SESSION', kind: 'strength', now: 1000 });
    const a = s.activeSession!;
    if (a.type !== 'strength') throw new Error();
    const ex = a.exercises[0];
    s = reducer(s, { type: 'TOGGLE_SET', logId: ex.id, setId: ex.sets[0].id }); // no value → ignored
    s = reducer(s, { type: 'SET_VALUE', logId: ex.id, setId: ex.sets[0].id, value: 8 });
    s = reducer(s, { type: 'TOGGLE_SET', logId: ex.id, setId: ex.sets[0].id });
    s = reducer(s, { type: 'FINISH_STRENGTH', now: 61_000 });
    s = reducer(s, { type: 'FINISH_STRENGTH', now: 62_000 });
    expect(s.sessions).toHaveLength(1);
    expect(s.activeSession).toBeNull();
    const done = s.sessions[0];
    expect(done.type === 'strength' && done.exercises.length).toBe(1);
    expect(done.durationSec).toBe(60);
  });
});
