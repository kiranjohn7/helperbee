// client/src/components/Footer.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import logoBG from "../assets/logo-bg.png";
import { auth } from "../lib/firebase";
import { authedFetch } from "../lib/utils";

export default function Footer() {
  const year = new Date().getFullYear();

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // "hirer" | "worker" | null

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      if (!u) {
        setRole(null);
        setReady(true);
        return;
      }
      try {
        const data = await authedFetch("/api/auth/me");
        setRole(data?.user?.role || null);
      } catch {
        setRole(null);
      } finally {
        setReady(true);
      }
    });
    return () => unsub();
  }, []);

  const hirerDashHref  = ready && user && role === "hirer" ? "/dashboard/hirer" : "/auth/login";
  const workerDashHref = ready && user && role === "worker" ? "/dashboard/worker" : "/auth/login";
  const postJobHref    = ready && user && role === "hirer" ? "/jobs/post"     : "/auth/register?role=hirer";

  return (
    <footer className="border-t bg-white text-gray-700 dark:bg-gray-950 dark:text-gray-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top brand + brief */}
        <div className="py-8 sm:py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg border bg-white overflow-hidden dark:bg-gray-900">
              <img
                src={logoBG}
                alt="HelperBee logo"
                className="h-full w-full object-contain"
                loading="eager"
                decoding="async"
              />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              HelperBee
            </span>
          </Link>

          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
            India-first talent & task network. Hire dependable help or find quality gigs—fast.
          </p>
        </div>

        {/* Middle: link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-8">
          <NavCol title="Product">
            <FooterLink to="/dashboard/worker">Browse Jobs</FooterLink>
            <FooterLink to={postJobHref}>Post a Job</FooterLink>
            <FooterLink to="/auth/register">Create Account</FooterLink>
            <FooterLink to="/auth/login">Login</FooterLink>
          </NavCol>

          <NavCol title="Company">
            <FooterLink to={hirerDashHref}>For Hirers</FooterLink>
            <FooterLink to={workerDashHref}>For Workers</FooterLink>
            <FooterLink to="/about">About</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
          </NavCol>

          <NavCol title="Resources">
            <FooterLink to="/auth/register">Getting Started</FooterLink>
            <FooterLink to="/contact">Help Center</FooterLink>
            <FooterLink to="/about">Community & Safety</FooterLink>
            <FooterExt href="https://statuspage.io" target>System Status</FooterExt>
          </NavCol>

          <NavCol title="Legal">
            <FooterLink to="/about#terms">Terms</FooterLink>
            <FooterLink to="/about#privacy">Privacy</FooterLink>
            <FooterLink to="/about#cookies">Cookie Policy</FooterLink>
            <FooterLink to="/about#licenses">Licenses</FooterLink>
          </NavCol>
        </div>

        {/* Bottom social + meta */}
        <div className="py-6 border-t flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {year} HelperBee. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <SocialIcon
              href="https://twitter.com/"
              label="X (Twitter)"
              path="M18.244 2H21.5l-7.5 8.57L23 22h-7.2l-5.63-6.76L3.5 22H.243l8.167-9.33L0 2h7.3l5.1 6.19L18.244 2z"
            />
            <SocialIcon
              href="https://www.linkedin.com/"
              label="LinkedIn"
              path="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v13H0zM9 8h4.8v1.8h.07c.67-1.2 2.3-2.47 4.73-2.47C22.6 7.33 24 9.2 24 12.4V21H19v-7.4c0-1.77-.03-4.05-2.47-4.05-2.47 0-2.85 1.93-2.85 3.92V21H9z"
              viewBox="0 0 24 24"
            />
            <SocialIcon
              href="https://github.com/"
              label="GitHub"
              path="M12 .5C5.73.5.9 5.33.9 11.6c0 4.86 3.15 8.98 7.52 10.44.55.1.75-.24.75-.54 0-.27-.01-1.16-.02-2.1-3.06.67-3.7-1.31-3.7-1.31-.5-1.26-1.22-1.6-1.22-1.6-.99-.68.08-.67.08-.67 1.1.08 1.67 1.13 1.67 1.13.97 1.66 2.55 1.18 3.17.9.1-.7.38-1.18.68-1.45-2.45-.28-5.02-1.22-5.02-5.45 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.42.11-2.96 0 0 .93-.3 3.05 1.13.88-.25 1.82-.38 2.76-.38.94 0 1.88.13 2.76.38 2.12-1.43 3.05-1.13 3.05-1.13.6 1.54.22 2.68.11 2.96.7.77 1.13 1.75 1.13 2.95 0 4.24-2.58 5.17-5.04 5.44.39.34.73 1 .73 2.02 0 1.46-.01 2.63-.01 2.99 0 .3.2.65.76.54 4.36-1.46 7.51-5.58 7.51-10.44C23.1 5.33 18.27.5 12 .5z"
              viewBox="0 0 24 24"
            />
            <SocialIcon
              href="https://www.instagram.com/"
              label="Instagram"
              path="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.3 2.3.6.5.2.9.6 1.3 1.1.4.4.8.8 1.1 1.3.3.4.5 1.1.6 2.3.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.9-.6 2.3-.2.5-.6.9-1.1 1.3-.4.4-.8.8-1.3 1.1-.4.3-1.1.5-2.3.6-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.3-2.3-.6-.5-.2-.9-.6-1.3-1.1-.4-.4-.8-.8-1.1-1.3-.3-.4-.5-1.1-.6-2.3C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.9.6-2.3.2-.5.6-.9 1.1-1.3.4-.4.8-.8 1.3-1.1.4-.3 1.1-.5 2.3-.6C8.4 2.2 8.8 2.2 12 2.2m0 2.1c-3.1 0-3.5 0-4.7.1-1 .1-1.6.2-2 .4-.5.2-.8.4-1.1.8-.3.3-.6.6-.8 1.1-.2.4-.3 1-.4 2-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1 .2 1.6.4 2 .2.5.4.8.8 1.1.3.3.6.6 1.1.8.4.2 1 .3 2 .4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1-.1 1.6-.2 2-.4.5-.2.8-.4 1.1-.8.3-.3.6-.6.8-1.1.2-.4.3-1 .4-2 .1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1-.2-1.6-.4-2-.2-.5-.4-.8-.8-1.1-.3-.3-.6-.6-1.1-.8-.4-.2-1-.3-2-.4-1.2-.1-1.6-.1-4.7-.1m0 2.7a5.5 5.5 0 1 1 0 11.1 5.5 5.5 0 0 1 0-11.1m0 2.1a3.4 3.4 0 1 0 .01 6.9 3.4 3.4 0 0 0-.01-6.9m5.8-2a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0"
              viewBox="0 0 24 24"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

function NavCol({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link
        to={to}
        className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        {children}
      </Link>
    </li>
  );
}

function FooterExt({ href, children, target = false }) {
  return (
    <li>
      <a
        href={href}
        target={target ? "_blank" : undefined}
        rel={target ? "noreferrer" : undefined}
        className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        {children}
      </a>
    </li>
  );
}

function SocialIcon({ href, label, path, viewBox = "0 0 24 24" }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <svg aria-hidden="true" viewBox={viewBox} className="h-4 w-4 fill-gray-600 dark:fill-gray-300">
        <path d={path} />
      </svg>
    </a>
  );
}