const SESSION_KEY = "apf_session_id";
const VIEW_PREFIX = "apf_view_";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `${Date.now()}`;
  }
}

/** Returns true if we should record a new view (dedupe within 24h per browser session). */
export function shouldRecordPropertyView(propertyId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const key = `${VIEW_PREFIX}${propertyId}`;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      window.sessionStorage.setItem(key, String(Date.now()));
      return true;
    }
    const last = Number.parseInt(raw, 10);
    if (Number.isNaN(last)) {
      window.sessionStorage.setItem(key, String(Date.now()));
      return true;
    }
    const day = 24 * 60 * 60 * 1000;
    if (Date.now() - last > day) {
      window.sessionStorage.setItem(key, String(Date.now()));
      return true;
    }
    return false;
  } catch {
    return true;
  }
}
