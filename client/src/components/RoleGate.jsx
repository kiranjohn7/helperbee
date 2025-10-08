import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { authedFetch } from "../lib/utils";

/**
 * RoleGate: waits for Firebase auth, then fetches /api/auth/me.
 * Redirects only after both steps complete.
 *
 * Props:
 * - role: "hirer" | "worker" (required page role)
 * - redirectIfLoggedOut: where to send logged-out users (default "/")
 */
export default function RoleGate({ role, children, redirectIfLoggedOut = "/" }) {
  // 1) Wait for Firebase auth to fire once (no timeout/race)
  const [authInit, setAuthInit] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setFirebaseUser(u);
      setAuthInit(true);
    });
    return () => unsub();
  }, []);

  // 2) If logged in, fetch /api/auth/me to get role + verification
  const [meLoading, setMeLoading] = useState(true);
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!authInit) return;               // wait until we know auth state
    if (!firebaseUser) {                 // definitely logged out
      setMe(null);
      setMeLoading(false);
      return;
    }

    let alive = true;
    setMeLoading(true);
    (async () => {
      try {
        const data = await authedFetch("/api/auth/me"); // returns parsed JSON
        if (!alive) return;
        setMe(data?.user || null);
      } catch {
        if (!alive) return;
        setMe(null);
      } finally {
        if (alive) setMeLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [authInit, firebaseUser]);

  // 3) Decide
  if (!authInit || meLoading) return <div className="p-6">Loading…</div>;

  // Logged out → custom redirect (usually "/" or "/auth/login")
  if (!firebaseUser || !me) return <Navigate to={redirectIfLoggedOut} replace />;

  // Needs OTP verification
  if (!me.isVerified) return <Navigate to="/auth/register?verify=1" replace />;

  // Wrong dashboard → send to the correct one
  if (role && me.role !== role) {
    const target = me.role === "worker" ? "/dashboard/worker" : "/dashboard/hirer";
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}