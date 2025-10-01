// client/src/pages/auth/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../../lib/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { API_URL } from "../../lib/utils";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("hirer");
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  function niceFirebaseError(code, message) {
    switch (code) {
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/operation-not-allowed":
        return "Enable this sign-in method in Firebase Console.";
      case "auth/email-already-in-use":
        return "This email is already registered. Try logging in.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was closed. Please try again.";
      default:
        return message || "Something went wrong. Please try again.";
    }
  }

  async function registerWithEmail(e) {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!name.trim()) return setErr("Please enter your full name.");
    if (!email.trim()) return setErr("Please enter your email.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: cred.user.uid, email, name, role }),
      });
      if (!res.ok) throw new Error("Failed to send OTP");
      setOtpSent(true);
      setInfo("OTP sent to your email. It expires in 10 minutes.");
    } catch (e) {
      setErr(niceFirebaseError(e.code, e.message));
    } finally {
      setLoading(false);
    }
  }

  async function registerWithGoogle() {
    setErr("");
    setInfo("");
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: cred.user.uid,
          email: cred.user.email,
          name: cred.user.displayName,
          role,
        }),
      });
      if (!res.ok) throw new Error("Failed to send OTP");
      setOtpSent(true);
      setInfo("OTP sent to your email. It expires in 10 minutes.");
    } catch (e) {
      setErr(niceFirebaseError(e.code, e.message));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setErr("");
    setInfo("");
    if (code.trim().length !== 6) return setErr("Enter the 6-digit code.");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: auth.currentUser?.uid, code }),
      });
      if (!res.ok) throw new Error("Invalid code");
      navigate(role === "hirer" ? "/dashboard/hirer" : "/dashboard/worker");
    } catch {
      setErr("Invalid code or server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setErr("");
    setInfo("");
    if (!auth.currentUser?.uid) return setErr("You must be signed in to resend the OTP.");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: auth.currentUser.uid,
          email,
          name,
          role,
        }),
      });
      if (!res.ok) throw new Error("Failed to resend OTP");
      setInfo("A new OTP was sent to your email.");
    } catch {
      setErr("Could not resend OTP. Please try again in a minute.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] grid place-items-center bg-gradient-to-b from-white via-indigo-50 to-white">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
            <span>🐝</span> HelperBee
          </div>
          <h1 className="mt-3 text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-gray-600">Sign up free. No hidden fees.</p>
        </div>

        {/* Stepper */}
        <div className="mt-5 grid grid-cols-2 text-xs">
          <div
            className={`flex items-center justify-center gap-2 py-2 rounded-l-lg border ${
              !otpSent ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700"
            }`}
          >
            <span className="h-5 w-5 grid place-items-center rounded-full border">
              {!otpSent ? "1" : "✓"}
            </span>
            <span>Account</span>
          </div>
          <div
            className={`flex items-center justify-center gap-2 py-2 rounded-r-lg border ${
              otpSent ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700"
            }`}
          >
            <span className="h-5 w-5 grid place-items-center rounded-full border">
              {otpSent ? "2" : " "}
            </span>
            <span>Verify</span>
          </div>
        </div>

        {/* Alerts */}
        {err ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}
        {info ? (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {info}
          </div>
        ) : null}

        {/* Forms */}
        {!otpSent ? (
          <form onSubmit={registerWithEmail} className="mt-6 space-y-4" autoComplete="on">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Enter your email"
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
                <label className="block text-sm font-medium text-gray-700">Password</label>
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
                placeholder="At least 6 characters"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {/* Professional Role Selector */}
            <fieldset className="mt-2">
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Choose your role
              </legend>

              <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RoleCard
                  id="role-hirer"
                  title="Hirer"
                  description="Post jobs and manage applicants."
                  selected={role === "hirer"}
                  onSelect={() => setRole("hirer")}
                  icon="🧑‍💼"
                />

                <RoleCard
                  id="role-worker"
                  title="Worker"
                  description="Discover gigs and send requests."
                  selected={role === "worker"}
                  onSelect={() => setRole("worker")}
                  icon="🛠️"
                />
              </div>
            </fieldset>

            <button
              type="submit"
              className="w-full rounded-lg bg-black px-4 py-2 text-white hover:opacity-95 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign up with Email"}
            </button>

            <div className="my-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-500">OR</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
              onClick={registerWithGoogle}
              disabled={loading}
            >
              Continue with Google
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-indigo-700 hover:underline">
                Login
              </Link>
            </p>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit OTP</label>
              <input
                className="w-full border rounded-lg px-3 py-2 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-200"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                pattern="\d{6}"
                autoComplete="one-time-code"
                placeholder="••••••"
              />
              <div className="mt-2 text-xs text-gray-600">
                Didn’t get it?{" "}
                <button
                  type="button"
                  className="text-indigo-700 hover:underline disabled:opacity-60"
                  onClick={resendOtp}
                  disabled={loading}
                >
                  Resend code
                </button>
              </div>
            </div>

            <button
              className="w-full rounded-lg bg-black px-4 py-2 text-white hover:opacity-95 disabled:opacity-60"
              onClick={verifyOtp}
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            <p className="text-center text-xs text-gray-500">
              By continuing you agree to our <span className="underline">Terms</span> and{" "}
              <span className="underline">Privacy Policy</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----- Small role-card component for a professional radio UI ----- */
function RoleCard({ id, title, description, selected, onSelect, icon }) {
  return (
    <label
      htmlFor={id}
      className={[
        "relative cursor-pointer rounded-xl border bg-white p-4 transition",
        selected
          ? "border-indigo-600 ring-2 ring-indigo-200"
          : "border-gray-200 hover:border-gray-300",
      ].join(" ")}
    >
      <input
        id={id}
        type="radio"
        name="role"
        value={title.toLowerCase()}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
        aria-checked={selected}
      />
      <div className="flex items-start gap-3">
        <div className="text-xl leading-none">{icon}</div>
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
      </div>

      {/* checkmark badge when selected */}
      {selected && (
        <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px]">
          ✓
        </span>
      )}
    </label>
  );
}