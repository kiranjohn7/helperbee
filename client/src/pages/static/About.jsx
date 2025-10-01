import { Link } from "react-router-dom";

export default function About() {
  const updated = new Date().toLocaleDateString();

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-indigo-50 to-white" />
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
              About HelperBee
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              A simpler way to hire help and find work
            </h1>
            <p className="mt-4 text-gray-600">
              HelperBee is an India-first talent & task network. We help people get reliable help for
              everyday tasks and short-term projects, and we help independent workers discover quality
              gigs—fast.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-6xl mx-auto px-4 pb-12 sm:pb-16 space-y-10">
        {/* Overview */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">What we do</h2>
            <p className="mt-2 text-sm text-gray-700">
              We provide clear postings, budget transparency in INR, and focused dashboards for hirers
              and workers. Once a request is accepted, you can coordinate the scope and timeline with
              built-in messaging.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">How we think</h2>
            <p className="mt-2 text-sm text-gray-700">
              Keep transactions simple and direct between the two parties. Our job is to reduce friction,
              not add it. That means clarity, speed, and tools that stay out of your way.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">Trust & Safety</h2>
            <p className="mt-2 text-sm text-gray-700">
              Accounts are authenticated and verified. We encourage precise briefs and profiles, and we
              provide reporting tools so the community can flag misuse.
            </p>
          </div>
        </div>

        {/* Quick nav to legal section */}
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">On this page</h2>
          <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
            <li><a className="text-indigo-700 hover:underline" href="#terms">Terms of Use</a></li>
            <li><a className="text-indigo-700 hover:underline" href="#privacy">Privacy Policy</a></li>
            <li><a className="text-indigo-700 hover:underline" href="#cookies">Cookie Policy</a></li>
            <li><a className="text-indigo-700 hover:underline" href="#licenses">Licenses</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div className="space-y-8">
          <article id="terms" className="rounded-2xl border bg-white p-5">
            <h2 className="text-xl font-semibold text-gray-900">Terms of Use</h2>
            <p className="mt-2 text-sm text-gray-700">
              By using HelperBee you agree to follow our community standards and applicable laws. We
              provide a platform to connect hirers and workers; agreements, payments and deliverables
              are between the parties involved. Do not post illegal content, spam, or misleading offers.
            </p>
            <p className="mt-2 text-sm text-gray-700">
              We may update the Terms periodically to reflect product changes or legal requirements.
              Material changes will be highlighted on this page.
            </p>
            <div className="mt-3 text-xs text-gray-500">Last updated: {updated}</div>
          </article>

          <article id="privacy" className="rounded-2xl border bg-white p-5">
            <h2 className="text-xl font-semibold text-gray-900">Privacy Policy</h2>
            <p className="mt-2 text-sm text-gray-700">
              We collect the data necessary to operate HelperBee (e.g., account details, job posts,
              messages) and use it to provide and improve the service. We do not sell your personal
              information. Limited third-party services (e.g., authentication, infrastructure) help us run
              the platform and are bound by their own policies and contractual safeguards.
            </p>
            <p className="mt-2 text-sm text-gray-700">
              You can request access or deletion of your account data by contacting support.
            </p>
            <div className="mt-3 text-xs text-gray-500">Last updated: {updated}</div>
          </article>

          <article id="cookies" className="rounded-2xl border bg-white p-5">
            <h2 className="text-xl font-semibold text-gray-900">Cookie Policy</h2>
            <p className="mt-2 text-sm text-gray-700">
              We use essential cookies for secure sign-in and core functionality. Optional analytics may
              help us understand product usage in aggregate. You can control non-essential cookies in
              your browser settings.
            </p>
            <div className="mt-3 text-xs text-gray-500">Last updated: {updated}</div>
          </article>

          <article id="licenses" className="rounded-2xl border bg-white p-5">
            <h2 className="text-xl font-semibold text-gray-900">Licenses</h2>
            <p className="mt-2 text-sm text-gray-700">
              HelperBee may include open-source components and third-party libraries. We respect their
              respective licenses and provide attribution as required. For full attributions, please see
              our Licenses notice in the repository or request a copy via support.
            </p>
            <div className="mt-3 text-xs text-gray-500">Last updated: {updated}</div>
          </article>
        </div>

        {/* Final CTA */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Have questions?</h3>
              <p className="text-sm text-gray-700">We’re happy to help with product or policy queries.</p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-95"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}