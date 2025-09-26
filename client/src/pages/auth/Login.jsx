import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { authedFetch } from "../../lib/utils";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function mapError(code, message) {
    switch (code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password. Try again.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was closed. Please try again.";
      case "auth/operation-not-allowed":
        return "This sign-in method is disabled in Firebase Console.";
      default:
        return message || "Something went wrong. Please try again.";
    }
  }

  // keep this clean: no recursion, no token logic here
  async function afterAuthRedirect() {
    const { user } = await authedFetch("/api/auth/me"); // authedFetch returns parsed JSON

    if (!user) {
      return navigate("/auth/register?onboard=1");
    }
    if (!user.isVerified) {
      return navigate("/auth/register?verify=1");
    }
    navigate(user.role === "worker" ? "/dashboard/worker" : "/dashboard/hirer");
  }

  // Email/password
  async function loginEmail(e) {
    e.preventDefault();
    setErr("");
    if (!email.trim() || !password.trim()) {
      setErr("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email, password);

      // ✅ force fresh token BEFORE we call /me
      await auth.currentUser?.getIdToken(true);

      await afterAuthRedirect();
    } catch (e) {
      setErr(mapError(e.code, e.message));
    } finally {
      setLoading(false);
    }
  }

  // Google
  async function loginGoogle() {
    setErr("");
    setLoading(true);
    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithPopup(auth, googleProvider);

      // ✅ force fresh token BEFORE /me
      await auth.currentUser?.getIdToken(true);

      await afterAuthRedirect();
    } catch (e) {
      // Fallback to redirect if popup fails
      setErr(mapError(e.code, e.message));
      try {
        await signInWithRedirect(auth, googleProvider);
        // getRedirectResult() effect will handle navigation after return
      } catch (e2) {
        setErr(mapError(e2.code, e2.message));
        setLoading(false);
      }
    }
  }

  // Handle Google redirect results
  useEffect(() => {
    (async () => {
      try {
        const res = await getRedirectResult(auth);
        if (res?.user) {
          await auth.currentUser?.getIdToken(true); // ✅ fresh token
          await afterAuthRedirect();
        }
      } catch (e) {
        console.error("Google redirect error", e);
        setErr(mapError(e.code, e.message));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resetPassword() {
    setErr("");
    if (!email) {
      setErr("Enter your email above to receive a reset link.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent. Check your inbox.");
    } catch (e) {
      setErr(mapError(e.code, e.message));
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] grid place-items-center bg-gradient-to-b from-white via-indigo-50 to-white">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
            <span>🐝</span> HelperBee
          </div>
        </div>

        <h1 className="mt-3 text-2xl font-semibold text-center">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-gray-600 text-center">
          Sign in to continue. No hidden fees—ever.
        </p>

        {err ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <form
          onSubmit={loginEmail}
          className="mt-6 space-y-4"
          autoComplete="on"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              inputMode="email"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <button
                type="button"
                className="text-xs text-indigo-700 hover:underline"
                onClick={() => setShowPw((s) => !s)}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Your password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <button
              type="button"
              className="text-sm text-indigo-700 hover:underline"
              onClick={resetPassword}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-2 text-white hover:opacity-95 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-500">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={loginGoogle}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
          disabled={loading}
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          New to HelperBee?{" "}
          <Link to="/auth/register" className="text-indigo-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
