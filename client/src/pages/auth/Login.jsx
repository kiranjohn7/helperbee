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
import { Alert, Modal, message } from "antd";
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

  const [msgApi, msgCtx] = message.useMessage();

  if (
    googleProvider &&
    typeof googleProvider.setCustomParameters === "function"
  ) {
    googleProvider.setCustomParameters({ prompt: "select_account" });
  }

  function mapError(code, messageText) {
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
        return "Google sign-in was closed.";
      case "auth/cancelled-popup-request":
        return "Sign-in popup was cancelled.";
      case "auth/popup-blocked":
        return "Your browser blocked the sign-in popup.";
      case "auth/operation-not-allowed":
        return "This sign-in method is disabled in Firebase Console.";
      default:
        return messageText || "Something went wrong. Please try again.";
    }
  }

  async function afterAuthRedirect() {
    const { user } = await authedFetch("/api/auth/me");
    if (!user) return navigate("/auth/register?onboard=1");
    if (!user.isVerified) return navigate("/auth/register?verify=1");
    navigate(user.role === "worker" ? "/dashboard/worker" : "/dashboard/hirer");
  }

  // Email / Password
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
      await auth.currentUser?.getIdToken(true);
      await afterAuthRedirect();
    } catch (e) {
      const msg = mapError(e.code, e.message);
      setErr(msg);
      msgApi.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // Google Login with safe cancel behavior
  async function loginGoogle() {
    setErr("");
    setLoading(true);
    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithPopup(auth, googleProvider);
      await auth.currentUser?.getIdToken(true);
      await afterAuthRedirect();
    } catch (e) {
      const CANCEL_ERRORS = new Set([
        "auth/popup-closed-by-user",
        "auth/cancelled-popup-request",
        "auth/user-cancelled",
      ]);

      // If the user closed the popup, just stop—do NOT redirect.
      if (CANCEL_ERRORS.has(e.code)) {
        const msg = mapError(e.code, e.message);
        setErr(msg);
        msgApi.info("Google sign-in cancelled.");
        setLoading(false);
        return;
      }

      // If popup was blocked, politely offer full-page redirect.
      if (e.code === "auth/popup-blocked") {
        const confirmed = await new Promise((resolve) => {
          Modal.confirm({
            title: "Popup blocked",
            content:
              "Your browser blocked the Google sign-in popup. Would you like to continue with a full-page redirect instead?",
            okText: "Continue",
            cancelText: "Stay here",
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
        if (confirmed) {
          try {
            await signInWithRedirect(auth, googleProvider);
            return; // page will redirect
          } catch (e2) {
            const msg2 = mapError(e2.code, e2.message);
            setErr(msg2);
            msgApi.error(msg2);
          }
        }
        // user declined redirect
        setLoading(false);
        return;
      }

      // Other unexpected errors
      const msg = mapError(e.code, e.message);
      setErr(msg);
      msgApi.error(msg);
      setLoading(false);
    }
  }

  // Handle Google redirect results (only if we actually redirected)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getRedirectResult(auth);
        if (!active) return;
        if (res?.user) {
          setLoading(true);
          await auth.currentUser?.getIdToken(true);
          await afterAuthRedirect();
        }
      } catch (e) {
        const msg = mapError(e.code, e.message);
        setErr(msg);
        msgApi.error(msg);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Password reset with confirm dialog
  function resetPassword() {
    setErr("");
    if (!email.trim()) {
      const msg = "Enter your email above to receive a reset link.";
      setErr(msg);
      msgApi.info(msg);
      return;
    }

    Modal.confirm({
      title: "Send password reset link?",
      content: `We'll email a reset link to ${email}.`,
      okText: "Send",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await sendPasswordResetEmail(auth, email);
          msgApi.success("Password reset email sent. Check your inbox.");
        } catch (e) {
          const msg = mapError(e.code, e.message);
          setErr(msg);
          msgApi.error(msg);
          throw e;
        }
      },
    });
  }

  return (
    <div className="min-h-[calc(100vh-64px)] grid place-items-center bg-gradient-to-b from-white via-indigo-50 to-white">
      {msgCtx}

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
          <div className="mt-4">
            <Alert type="error" showIcon message={err} />
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
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              inputMode="email"
              autoComplete="email"
              disabled={loading}
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
                disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              Remember me
            </label>
            <button
              type="button"
              className="text-sm text-indigo-700 hover:underline"
              onClick={resetPassword}
              disabled={loading}
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
