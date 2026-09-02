import { AttendanceSession } from "./qrTypes";
import { getSessionById } from "./qrStorage";

export const LIVE_SESSION_KEY = "zcoer_live_session_id";
export const LIVE_SESSION_EVENT = "zcoer-live-session-sync";

export function getLiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

export function setLiveSession(session: AttendanceSession | null): void {
  if (typeof window === "undefined") return;

  try {
    if (!session) {
      localStorage.removeItem(LIVE_SESSION_KEY);
      window.dispatchEvent(new CustomEvent(LIVE_SESSION_EVENT, { detail: null }));
      return;
    }

    localStorage.setItem(LIVE_SESSION_KEY, session.sessionId);
    window.dispatchEvent(new CustomEvent(LIVE_SESSION_EVENT, { detail: session.sessionId }));
  } catch {
    // Ignore storage issues in browsers without access.
  }
}

export function getLiveSession(): AttendanceSession | null {
  const sessionId = getLiveSessionId();
  if (!sessionId) return null;
  const session = getSessionById(sessionId);
  if (!session) {
    const sessionIdValue = sessionId;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(LIVE_SESSION_KEY);
      } catch {
        // Ignore.
      }
      window.dispatchEvent(new CustomEvent(LIVE_SESSION_EVENT, { detail: null }));
    }
    return null;
  }

  return session;
}

export function subscribeToLiveSession(callback: (session: AttendanceSession | null) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = () => {
    callback(getLiveSession());
  };

  window.addEventListener(LIVE_SESSION_EVENT, handler as EventListener);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(LIVE_SESSION_EVENT, handler as EventListener);
    window.removeEventListener("storage", handler);
  };
}
