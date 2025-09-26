import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-indigo-50 to-white" />
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
              <span>🐝</span> HelperBee · India-first, 100% free
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              Find trusted help or freelance gigs—fast.
            </h1>
            <p className="mt-4 text-gray-600">
              Post tasks, discover talent, and chat securely. No commissions. No hidden fees.
              Budgets shown in <span className="font-semibold">INR</span>.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/auth/register"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-white shadow-sm hover:opacity-95"
              >
                Get Started
              </Link>
              <Link
                to="/jobs/post"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-gray-900 hover:bg-gray-50"
              >
                Post a Job
              </Link>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Free forever · Email/Google sign-in · OTP verification
            </p>
          </div>

          {/* Trust strip */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Verified Users" value="10k+" />
            <Stat label="Active Categories" value="30+" />
            <Stat label="Avg. Hire Time" value="< 24h" />
            <Stat label="Platform Fee" value="₹0" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center">Why HelperBee?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            title="No Hidden Charges"
            desc="We keep it simple—₹0 platform fee. You deal directly with your hire."
            emoji="💸"
          />
          <Feature
            title="Secure Accounts"
            desc="Firebase Auth + OTP verification to keep your account safe."
            emoji="🔐"
          />
          <Feature
            title="Fast Matching"
            desc="Clear job posts and role-based dashboards help you connect quickly."
            emoji="⚡"
          />
          <Feature
            title="Built-in Chat"
            desc="Once matched, chat in-app to finalize scope and timing."
            emoji="💬"
          />
        </div>
      </section>

      {/* Popular categories */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Popular Categories</h2>
          <Link to="/dashboard/worker" className="text-sm text-indigo-700 hover:underline">
            Browse all &rarr;
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
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center">How it works</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <HowCard
            role="For Hirers"
            steps={[
              "Create your account (Email/Google) and verify via OTP.",
              "Post a job with budget in INR and clear requirements.",
              "Accept a request and start chatting to finalize details.",
            ]}
            cta={{ label: "Post a Job", to: "/jobs/post" }}
          />
          <HowCard
            role="For Workers"
            steps={[
              "Sign up and complete your profile & skills.",
              "Browse jobs and send requests with a short note.",
              "If accepted, chat with the hirer and get to work.",
            ]}
            cta={{ label: "Browse Jobs", to: "/dashboard/worker" }}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center">Loved by our community</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Testimonial
            quote="Found a designer in just a few hours. Smooth and zero fees."
            name="Aarav, Mumbai"
          />
          <Testimonial
            quote="Clear INR budgets helped me pick the right tasks for the week."
            name="Sana, Bengaluru"
          />
          <Testimonial
            quote="The chat made it easy to finalize scope before starting."
            name="Rohit, Pune"
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-12 sm:py-16 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-bold">Ready to get started?</h3>
          <p className="mt-2 text-indigo-100">
            Join HelperBee today—post your first job or browse gigs around India.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-gray-900 shadow-sm hover:bg-indigo-50"
            >
              Create Account
            </Link>
            <Link
              to="/dashboard/worker"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-white/40 px-5 py-3 text-white hover:bg-white/10"
            >
              Browse Jobs
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

function Feature({ title, desc, emoji }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-2 font-semibold text-gray-900">{title}</h3>
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
      <figcaption className="mt-3 text-xs text-gray-500">— {name}</figcaption>
    </figure>
  );
}