const PINS_KEY = "wow-ach-pins";
const NOTES_KEY = "wow-ach-notes";

export function getPins(): Set<number> {
  try {
    const data = localStorage.getItem(PINS_KEY);
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch {
    return new Set();
  }
}

export function savePins(pins: Set<number>): void {
  localStorage.setItem(PINS_KEY, JSON.stringify([...pins]));
}

export function togglePin(id: number): Set<number> {
  const pins = getPins();
  if (pins.has(id)) pins.delete(id);
  else pins.add(id);
  savePins(pins);
  return pins;
}

export function getNotes(): Record<number, string> {
  try {
    const data = localStorage.getItem(NOTES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveNote(id: number, note: string): void {
  const notes = getNotes();
  if (note.trim()) notes[id] = note;
  else delete notes[id];
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function getNote(id: number): string {
  return getNotes()[id] || "";
}
