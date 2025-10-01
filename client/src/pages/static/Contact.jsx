import { useMemo, useState } from "react";

export default function Contact() {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");

  // Build a mailto link so the form always “works” without a backend
  const mailtoHref = useMemo(() => {
    const to = "helperbee.co@gmail.com";
    const s = encodeURIComponent(subject || "Support request");
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${from}\n\n${msg}`.trim()
    );
    return `mailto:${to}?subject=${s}&body=${body}`;
  }, [name, from, subject, msg]);

  function submit(e) {
    e.preventDefault();
    window.location.href = mailtoHref;
  }

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-indigo-50 to-white" />
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
              Contact
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              We’re here to help
            </h1>
            <p className="mt-4 text-gray-600">
              Reach out for product questions, account assistance, or feedback. We typically respond
              within one business day.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-6xl mx-auto px-4 pb-12 sm:pb-16 grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={submit} className="lg:col-span-2 rounded-2xl border bg-white p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Full name"
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
                placeholder="you@example.com"
                type="email"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
                inputMode="email"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="How can we help?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              rows={6}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Add details so we can assist quickly…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-white hover:opacity-95"
            >
              Send message
            </button>
            <a
              href="mailto:helperbee.co@gmail.com"
              className="text-sm text-indigo-700 hover:underline"
            >
              Or email helperbee.co@gmail.com
            </a>
          </div>
        </form>

        {/* Sidebar */}
        <aside className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Other ways to reach us</h2>

          <div className="text-sm text-gray-700">
            <div className="font-medium">Press & partnerships</div>
            <a className="text-indigo-700 hover:underline" href="mailto:press@helperbee.app">
              press@helperbee.app
            </a>
          </div>

          <div className="text-sm text-gray-700">
            <div className="font-medium">Careers</div>
            <a className="text-indigo-700 hover:underline" href="mailto:careers@helperbee.app">
              careers@helperbee.app
            </a>
          </div>

          <div className="text-sm text-gray-700">
            <div className="font-medium">Legal</div>
            <a className="text-indigo-700 hover:underline" href="mailto:legal@helperbee.app">
              legal@helperbee.app
            </a>
          </div>
        </aside>
      </section>
    </div>
  );
}