const KEY = 'farewellFormState';
export const EDIT_WINDOW_MS = 60 * 60 * 1000;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadState() {
  try {
    const obj = JSON.parse(localStorage.getItem(KEY));
    return obj?.date === today() ? obj : null;
  } catch {
    return null;
  }
}

export function saveState(updates) {
  try {
    const base = loadState() ?? {
      id: null,
      date: today(),
      status: 'editing',
      submittedAt: null,
      data: {},
    };
    const merged = { ...base, ...updates, date: today() };
    if (!merged.id) merged.id = crypto.randomUUID();
    localStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return null;
  }
}

export function getPhase(state) {
  if (!state) return 'NEW';
  if (state.status === 'editing') return 'EDITING';
  return (Date.now() - state.submittedAt) < EDIT_WINDOW_MS
    ? 'SUBMITTED_EDITABLE'
    : 'SUBMITTED_LOCKED';
}

export function msRemaining(state) {
  return Math.max(0, EDIT_WINDOW_MS - (Date.now() - (state?.submittedAt ?? 0)));
}
