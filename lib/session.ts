// lib/session.ts
// ─────────────────────────────────────────────────────────────────────
// Fake auth — demo only.  Password is always "12345".
// ─────────────────────────────────────────────────────────────────────
import { findUserIncludingAdded, Role } from "./mockDb";

const SESSION_KEY = "zcoer_session";

export interface Session {
  role: Role;
  id: string;
  name: string;
}

/** Attempt login. Returns the session on success, null on failure. */
export function login(id: string, password: string): Session | null {
  const user = findUserIncludingAdded(id.trim(), password);
  if (!user) return null;
  const session: Session = { role: user.role, id: user.id, name: user.name };
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

/** Read the current session from localStorage. Returns default fallback if not logged in. */
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      // Auto-fallback session based on current URL route for seamless demo testing
      const path = window.location.pathname;
      let defaultSession: Session = { role: "student", id: "72201234M", name: "Aarav Sharma" };
      if (path.startsWith("/teacher")) {
        defaultSession = { role: "teacher", id: "TCH001", name: "Dr. Meera Joshi" };
      } else if (path.startsWith("/admin")) {
        defaultSession = { role: "admin", id: "EMP001", name: "Smt. Kavita Waghmare" };
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(defaultSession));
      return defaultSession;
    }
    return JSON.parse(raw) as Session;
  } catch {
    return { role: "student", id: "72201234M", name: "Aarav Sharma" };
  }
}

/** Clear session and return to login. */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

/** Redirect helper — call at top of every protected page. */
export function requireRole(expected: Role | Role[]): Session | null {
  const session = getSession();
  if (!session) return null;
  const roles = Array.isArray(expected) ? expected : [expected];
  if (!roles.includes(session.role)) return null;
  return session;
}
