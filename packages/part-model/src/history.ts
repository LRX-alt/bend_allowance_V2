import { validatePart } from './validate';
import { deserialize, serialize } from './serialize';
import { DEFAULT_HISTORY, type EditorState, type HistoryConfig, type Part } from './types';

export function createEditorState(part: Part): EditorState {
  const validation = validatePart(part);
  return {
    current: part,
    past: [],
    future: [],
    pastLabels: [],
    futureLabels: [],
    validation,
    findings: validation.findings,
  };
}

export function commit(state: EditorState, next: Part, label: string, config: HistoryConfig = DEFAULT_HISTORY): EditorState {
  const past = [...state.past, serialize(state.current)];
  const pastLabels = [...state.pastLabels, label];
  while (past.length > config.maxStates) {
    past.shift();
    pastLabels.shift();
  }
  const validation = validatePart(next);
  return { current: next, past, pastLabels, future: [], futureLabels: [], validation, findings: validation.findings };
}

export function undo(state: EditorState): EditorState {
  const snapshot = state.past[state.past.length - 1];
  const label = state.pastLabels[state.pastLabels.length - 1];
  if (snapshot === undefined) return state;
  const current = deserialize(snapshot);
  const validation = validatePart(current);
  return {
    current,
    past: state.past.slice(0, -1),
    pastLabels: state.pastLabels.slice(0, -1),
    future: [serialize(state.current), ...state.future],
    futureLabels: [label ?? 'Modifica', ...state.futureLabels],
    validation,
    findings: validation.findings,
  };
}

export function redo(state: EditorState): EditorState {
  const snapshot = state.future[0];
  const label = state.futureLabels[0];
  if (snapshot === undefined) return state;
  const current = deserialize(snapshot);
  const validation = validatePart(current);
  return {
    current,
    past: [...state.past, serialize(state.current)],
    pastLabels: [...state.pastLabels, label ?? 'Modifica'],
    future: state.future.slice(1),
    futureLabels: state.futureLabels.slice(1),
    validation,
    findings: validation.findings,
  };
}
