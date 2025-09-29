// client/src/pages/Home.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { authedFetch } from "../lib/utils";

export default function Home() {
  const [role, setRole] = useState(null); // "worker" | "hirer" | null
  const loggedIn = role === "worker" || role === "hirer";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return setRole(null);
      try {
        const { user } = await authedFetch("/api/auth/me");
        setRole(user?.role || null);
      } catch {
        setRole(null);
      }
    });
    return () => unsub();
  }, []);

  const browseHref = !loggedIn
    ? "/auth/register"
    : role === "worker"
    ? "/dashboard/worker"
    : "/dashboard/hirer";

  const postJobHref = role === "hirer" ? "/jobs/post" : "/auth/register";

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-indigo-50 to-white" />
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
              HelperBee · India-first talent & task network
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              Hire dependable help or find quality gigs—fast.
            </h1>
            <p className="mt-4 text-gray-600">
              Create clear postings, discover relevant talent, and coordinate work with built-in
              messaging. Budgets are listed in <span className="font-semibold">INR</span>.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/auth/register"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-white shadow-sm hover:opacity-95"
              >
                Create an account
              </Link>

              <Link
                to={postJobHref}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-gray-900 hover:bg-gray-50"
              >
                Post a job
              </Link>

              <Link
                to={browseHref}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-gray-900 hover:bg-gray-50"
              >
                Explore jobs
              </Link>
            </div>
            {/* Intentionally no “OTP verification enabled” line for a cleaner, more professional tone */}
          </div>

          {/* Trust strip */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Verified profiles" value="10k+" />
            <Stat label="Active categories" value="30+" />
            <Stat label="Median response time" value="< 24h" />
            <Stat label="Platform fee" value="₹0" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center">
          Why choose HelperBee
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            title="Transparent pricing"
            desc="No platform commissions or marked-up payouts. Agree terms directly with the other party."
          />
          <Feature
            title="Account security"
            desc="Modern authentication and safeguards keep your account protected."
          />
          <Feature
            title="Efficient matching"
            desc="Structured posts and role-specific dashboards help you reach the right people quickly."
          />
          <Feature
            title="In-app messaging"
            desc="Discuss scope, timelines, and deliverables in one place to keep work on track."
          />
        </div>
      </section>

      {/* Popular categories */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Browse popular categories
          </h2>
          <Link to={browseHref} className="text-sm text-indigo-700 hover:underline">
            Explore all →
          </Link>
        </div>
        <div className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            "House Cleaning",
            "Graphic Design",
            "Web Development",
            "Photography",
            "Event Support",
            "Tutoring",
          ].map((c) => (
            <CategoryPill key={c} label={c} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center">
          How it works
        </h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <HowCard
            role="For hirers"
            steps={[
              "Create an account and share a clear brief with budget and timeline.",
              "Review requests and shortlist relevant profiles.",
              "Accept a fit and coordinate details in chat.",
            ]}
            cta={{ label: "Post a job", to: postJobHref }}
          />
          <HowCard
            role="For workers"
            steps={[
              "Sign up and complete your profile and skills.",
              "Filter jobs by category, budget, and recency.",
              "Send a concise request; if accepted, finalize details in chat.",
            ]}
            cta={{ label: "Browse jobs", to: browseHref }}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center">
          What users say
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Testimonial
            quote="We filled a weekend task in hours. Clear briefs and direct messaging kept it seamless."
            name="Aarav — Mumbai"
          />
          <Testimonial
            quote="INR budgets and filters made it easy to line up the week’s work without back-and-forth."
            name="Sana — Bengaluru"
          />
          <Testimonial
            quote="The flow from posting to chat is straightforward. We’ve returned for multiple gigs."
            name="Rohit — Pune"
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-12 sm:py-16 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-bold">Start your next hire or gig</h3>
          <p className="mt-2 text-indigo-100">
            Join HelperBee to post your first job or discover quality opportunities across India.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-gray-900 shadow-sm hover:bg-indigo-50"
            >
              Create account
            </Link>
            <Link
              to={browseHref}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-white/40 px-5 py-3 text-white hover:bg-white/10"
            >
              Explore jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Small presentational subcomponents (mobile-first) ---------- */

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border bg-white p-4 text-center">
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function CategoryPill({ label }) {
  return (
    <div className="rounded-full border bg-white px-4 py-2 text-center text-sm text-gray-700 hover:bg-gray-50">
      {label}
    </div>
  );
}

function HowCard({ role, steps, cta }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-sm font-medium text-indigo-700">{role}</div>
      <ol className="mt-3 space-y-2 list-decimal list-inside text-sm text-gray-700">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <Link
        to={cta.to}
        className="mt-4 inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-95"
      >
        {cta.label}
      </Link>
    </div>
  );
}

function Testimonial({ quote, name }) {
  return (
    <figure className="rounded-2xl border bg-white p-5">
      <blockquote className="text-sm text-gray-700">“{quote}”</blockquote>
      <figcaption className="mt-3 text-xs text-gray-500">{name}</figcaption>
    </figure>
  );
}