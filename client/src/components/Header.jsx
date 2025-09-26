// client/src/components/Header.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "antd";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { authedFetch } from "../lib/utils";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);   // prevent flicker
  const [role, setRole] = useState(null);      // "hirer" | "worker" | null

  // 1) Watch Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setReady(true);
    });
    return () => unsub();
  }, []);

  // 2) Load app role after login (use authedFetch → already parsed JSON)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!user) { setRole(null); return; }
        const data = await authedFetch("/api/auth/me");
        if (active) setRole(data?.user?.role || null);
      } catch {
        if (active) setRole(null);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // --- Route awareness ---
  const path = location.pathname || "/";
  const onHome = path === "/";
  const inHirer =
    path.startsWith("/dashboard/hirer") ||
    path.startsWith("/profile/hirer") ||
    path.startsWith("/jobs/post"); // posting is a hirer area
  const inWorker =
    path.startsWith("/dashboard/worker") ||
    path.startsWith("/profile/worker");

  // Render helpers
  const AuthButtons = () => (
    <div className="flex items-center gap-2">
      <Link to="/auth/login" className="px-3 py-1.5 border rounded hover:bg-gray-50">
        Login
      </Link>
      <Link to="/auth/register" className="px-3 py-1.5 rounded bg-black text-white hover:opacity-95">
        Register
      </Link>
    </div>
  );

  const HirerNav = () => (
    <>
      <Link to="/dashboard/hirer">Dashboard</Link>
      <Link to="/profile/hirer">Profile</Link>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-sm text-gray-600">
          {user?.displayName || user?.email}
        </span>
        <Button onClick={logout}>Logout</Button>
      </div>
    </>
  );

  const WorkerNav = () => (
    <>
      <Link to="/dashboard/worker">Dashboard</Link>
      <Link to="/profile/worker">Profile</Link>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-sm text-gray-600">
          {user?.displayName || user?.email}
        </span>
        <Button onClick={logout}>Logout</Button>
      </div>
    </>
  );

  // Decide what to show in the right side of the header
  function renderNav() {
    // Home: ONLY Login + Register (even if logged in, per your requirement)
    if (onHome) return <AuthButtons />;

    // On a hirer page → show hirer dashboard/profile + logout (if logged in as hirer)
    if (inHirer) {
      if (ready && user && role === "hirer") return <HirerNav />;
      // not logged in or wrong role → show auth buttons
      return <AuthButtons />;
    }

    // On a worker page → show worker dashboard/profile + logout (if logged in as worker)
    if (inWorker) {
      if (ready && user && role === "worker") return <WorkerNav />;
      return <AuthButtons />;
    }

    // Other pages (fallback):
    // - if logged in + know role → show their dashboard/profile + logout
    // - else show auth buttons
    if (ready && user) {
      if (role === "hirer") return <HirerNav />;
      if (role === "worker") return <WorkerNav />;
    }
    return <AuthButtons />;
  }

  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <Link to="/" className="font-semibold">HelperBee</Link>
        <nav className="flex items-center gap-3">
          {renderNav()}
        </nav>
      </div>
    </header>
  );
}