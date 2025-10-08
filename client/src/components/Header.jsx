import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button, Modal, message } from "antd";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { authedFetch } from "../lib/utils";
import logo from "../assets/logo.png";

export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!user) {
          if (active) setRole(null);
          return;
        }
        const data = await authedFetch("/api/auth/me");
        if (active) setRole(data?.user?.role || null);
      } catch {
        if (active) setRole(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const logoutWithConfirm = () => {
    Modal.confirm({
      title: "Log out?",
      content: "You'll be signed out of HelperBee on this device.",
      okText: "Logout",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      centered: true,
      async onOk() {
        try {
          await signOut(auth);
          setRole(null);
          setUser(null);
          setMobileOpen(false);
          message.success("You’ve been logged out.");
          navigate("/");
        } catch (e) {
          message.error("Couldn’t log out. Please try again.");
          throw e; 
        }
      },
    });
  };

  const linkCls = useMemo(
    () => (to) =>
      pathname === to
        ? "text-gray-900 font-medium"
        : "text-gray-600 hover:text-gray-900",
    [pathname]
  );

  const dashHref = role === "worker" ? "/dashboard/worker" : "/dashboard/hirer";
  const profileHref = role === "worker" ? "/profile/worker" : "/profile/hirer";

  const RoleLinks = () =>
    user && role ? (
      <>
        <Link to={dashHref} className={linkCls(dashHref)}>
          Dashboard
        </Link>
        <Link to={profileHref} className={linkCls(profileHref)}>
          Profile
        </Link>
      </>
    ) : null;

  // Always-visible links
  const CommonLinks = () => (
    <>
      <Link to="/about" className={linkCls("/about")}>
        About
      </Link>
      <Link to="/contact" className={linkCls("/contact")}>
        Contact
      </Link>
    </>
  );

  // Auth area (desktop)
  const AuthArea = () =>
    ready && user ? (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-sm text-gray-600">
          {user?.displayName || user?.email}
        </span>
        <Button onClick={logoutWithConfirm}>Logout</Button>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <Link to="/auth/login" className="px-3 py-1.5 border rounded hover:bg-gray-50">
          Login
        </Link>
        <Link
          to="/auth/register"
          className="px-3 py-1.5 rounded bg-black text-white hover:opacity-95"
        >
          Register
        </Link>
      </div>
    );

  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="h-7 w-[160px] overflow-hidden">
            <img
              src={logo}
              alt="HelperBee logo"
              className="h-full w-full object-contain"
              loading="eager"
              decoding="async"
            />
          </div>
        </Link>

        {/* Right side (desktop): nav + auth */}
        <div className="hidden sm:flex items-center gap-5">
          <nav className="flex items-center gap-4">
            <RoleLinks />
            <CommonLinks />
          </nav>
          <AuthArea />
        </div>

        {/* Right side (mobile): hamburger only */}
        <div className="sm:hidden">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            className="inline-flex items-center justify-center rounded-md p-2 border hover:bg-gray-50"
          >
            {mobileOpen ? (
              // Close icon
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M6 6l12 12M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              // Hamburger icon
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu (slide-down panel) */}
      {mobileOpen && (
        <div className="sm:hidden border-t bg-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <nav className="grid gap-3 text-sm">
              {/* Role links (if logged in) */}
              {user && role && (
                <>
                  <Link to={dashHref} className="py-2">
                    Dashboard
                  </Link>
                  <Link to={profileHref} className="py-2">
                    Profile
                  </Link>
                </>
              )}
              {/* Common links */}
              <Link to="/about" className="py-2">
                About
              </Link>
              <Link to="/contact" className="py-2">
                Contact
              </Link>
              <div className="h-px bg-gray-200 my-2" />
              {/* Auth actions */}
              {ready && user ? (
                <button
                  onClick={logoutWithConfirm}
                  className="w-full text-left py-2 rounded-md border px-3 hover:bg-gray-50"
                >
                  Logout
                </button>
              ) : (
                <div className="grid gap-2">
                  <Link
                    to="/auth/login"
                    className="w-full text-center py-2 rounded-md border hover:bg-gray-50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth/register"
                    className="w-full text-center py-2 rounded-md bg-black text-white hover:opacity-95"
                  >
                    Register
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}