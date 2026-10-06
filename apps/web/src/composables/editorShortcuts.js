const FIELD = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function editorCommand(event) {
  const key = event.key.toLowerCase();
  if (event.metaKey || event.ctrlKey) {
    if (key === 'z') return event.shiftKey ? 'redo' : 'undo';
    if (key === 'y') return 'redo';
    return null;
  }
  if (FIELD.has(event.target?.tagName) || event.target?.isContentEditable) return null;
  if (event.altKey) return null;
  if (key === 'v') return 'tool-select';
  if (key === 'h') return 'tool-pan';
  if (key === 'm') return 'tool-measure';
  if (key === 'q') return 'tool-stretch';
  if (key === 'b') return 'tool-bend';
  if (key === 'delete' || key === 'backspace') return 'delete-bend';
  if (key === 'f') return 'fit';
  if (key === '+' || key === '=') return 'zoom-in';
  if (key === '-' || key === '_') return 'zoom-out';
  if (key === 'escape') return 'clear';
  return null;
}
