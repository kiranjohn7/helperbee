import { useMemo, useState } from "react";
import { authedFetch, formatINR } from "../../lib/utils";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  "Household", "Delivery", "Moving", "Cleaning", "Repairs",
  "Tutoring", "Design", "Development", "Content", "Other",
];

export default function PostJob() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    jobType: "one_time",          // one_time | ongoing
    experienceLevel: "entry",     // entry | intermediate | expert
    isRemote: true,               // remote vs on-site
    location: "",                 // required if isRemote === false
    budgetMin: "",
    budgetMax: "",
    deadline: "",                 // yyyy-mm-dd
    skillsCSV: "",
    attachmentsCSV: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  // --- JS-safe field setter ---
  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const skills = useMemo(
    () => form.skillsCSV.split(",").map(s => s.trim()).filter(Boolean),
    [form.skillsCSV]
  );
  const attachments = useMemo(
    () => form.attachmentsCSV.split(",").map(s => s.trim()).filter(Boolean),
    [form.attachmentsCSV]
  );

  const bMin = Number(form.budgetMin || 0);
  const bMax = Number(form.budgetMax || 0);
  const budgetValid =
    (!form.budgetMin && !form.budgetMax) || (bMin >= 0 && bMax >= 0 && (!bMax || bMin <= bMax));

  const canSubmit =
    form.title.trim().length >= 6 &&
    form.description.trim().length >= 20 &&
    !!form.category &&
    (form.isRemote || (!!form.location && form.location.trim().length >= 2)) &&
    budgetValid;

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk(false);
    if (!canSubmit) {
      setErr("Please fill required fields and fix validation errors.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category || "Other",
      status: "open",
      location: form.isRemote ? "Remote (India)" : form.location.trim(),
      budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
      jobType: form.jobType,
      experienceLevel: form.experienceLevel,
      deadline: form.deadline || undefined,
      skills,
      attachments,
    };

    setLoading(true);
    try {
      const data = await authedFetch("/api/jobs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!data?.job?._id) throw new Error("Unexpected server response.");
      setOk(true);
      setTimeout(() => nav("/dashboard/hirer"), 400);
    } catch (e) {
      setErr(e.message || "Could not publish the job. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={submit} className="bg-white border rounded-2xl p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Post a Job</h1>
          <p className="text-sm text-gray-600">Describe the work and your budget. HelperBee is always free—no hidden fees.</p>
        </div>

        {err && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        {ok && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Job published successfully!</div>}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Need a React developer for landing page"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            minLength={6}
            required
          />
          <p className="mt-1 text-xs text-gray-500">At least 6 characters.</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 min-h-[120px]"
            placeholder="Describe the task, deliverables, tools, and expectations…"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            minLength={20}
            required
          />
          <p className="mt-1 text-xs text-gray-500">At least 20 characters.</p>
        </div>

        {/* Category & Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience level</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.experienceLevel}
              onChange={(e) => setField("experienceLevel", e.target.value)}
            >
              <option value="entry">Entry</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        {/* Job type & Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job type</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.jobType}
              onChange={(e) => setField("jobType", e.target.value)}
            >
              <option value="one_time">One-time</option>
              <option value="ongoing">Ongoing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              value={form.deadline}
              onChange={(e) => setField("deadline", e.target.value)}
            />
          </div>
        </div>

        {/* Remote vs On-site */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Work mode</label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={form.isRemote} onChange={() => setField("isRemote", true)} />
              Remote
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={!form.isRemote} onChange={() => setField("isRemote", false)} />
              On-site
            </label>
          </div>

          {!form.isRemote && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="City, State (India)"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                required={!form.isRemote}
              />
            </div>
          )}
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget (INR)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="w-full border rounded-lg px-3 py-2"
              inputMode="numeric"
              placeholder="Min ₹"
              value={form.budgetMin}
              onChange={(e) => setField("budgetMin", e.target.value.replace(/\D/g, ""))}
            />
            <input
              className="w-full border rounded-lg px-3 py-2"
              inputMode="numeric"
              placeholder="Max ₹"
              value={form.budgetMax}
              onChange={(e) => setField("budgetMax", e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {bMin ? formatINR(bMin) : "—"} {bMax ? `to ${formatINR(bMax)}` : ""}
            {!budgetValid && <span className="ml-2 text-red-600">Min should not exceed Max.</span>}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. React, Tailwind, MongoDB"
            value={form.skillsCSV}
            onChange={(e) => setField("skillsCSV", e.target.value)}
          />
          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="px-2 py-1 text-xs rounded-full bg-gray-100 border">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachment URLs (optional, comma separated)</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. https://drive.google.com/..., https://..."
            value={form.attachmentsCSV}
            onChange={(e) => setField("attachmentsCSV", e.target.value)}
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            onClick={() => setForm({
              title: "", description: "", category: "", jobType: "one_time",
              experienceLevel: "entry", isRemote: true, location: "",
              budgetMin: "", budgetMax: "", deadline: "", skillsCSV: "", attachmentsCSV: "",
            })}
          >
            Clear
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
            disabled={!canSubmit || loading}
          >
            {loading ? "Publishing…" : "Publish"}
          </button>
        </div>
      </form>

      <p className="mt-3 text-xs text-gray-500">
        Note: If you want to persist <em>jobType</em>, <em>experienceLevel</em>, <em>deadline</em>, <em>skills</em>, or <em>attachments</em>,
        add these fields to your server Job schema.
      </p>
    </div>
  );
}