// client/src/pages/jobs/JobDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Modal, message } from "antd";
import { authedFetch, API_URL, formatINR } from "../../lib/utils";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // worker application
  const [coverLetter, setCoverLetter] = useState("");

  // hirer edit
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    budgetMin: "",
    budgetMax: "",
    jobType: "one_time",
    experienceLevel: "entry",
    deadline: "",
    status: "open",
    skills: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load job (public) + my profile (optional)
  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${API_URL}/api/jobs/${id}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!alive) return;
        setJob(j.job);

        try {
          const data = await authedFetch("/api/auth/me");
          if (!alive) return;
          setMe(data?.user || null);
        } catch {
          if (!alive) return;
          setMe(null);
        }
      } catch (e) {
        console.error("Load job error:", e);
        if (!alive) return;
        setErr("Couldn't load job.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [id]);

  // Owner check
  const isOwner = useMemo(() => {
    if (!job || !me) return false;
    return String(job.hirerId) === String(me._id) && me.role === "hirer";
  }, [job, me]);

  // Seed edit form
  useEffect(() => {
    if (job && isOwner && edit) {
      setForm({
        title: job.title || "",
        description: job.description || "",
        category: job.category || "",
        location: job.location || "",
        budgetMin: job.budgetMin ?? "",
        budgetMax: job.budgetMax ?? "",
        jobType: job.jobType || "one_time",
        experienceLevel: job.experienceLevel || "entry",
        deadline: job.deadline ? job.deadline.slice(0, 10) : "",
        status: job.status || "open",
        skills: (job.skills || []).join(", "),
      });
    }
  }, [job, isOwner, edit]);

  // ——— Actions (now with AntD dialogs) ———

  function apply() {
    if (!coverLetter.trim()) {
      message.warning("Please write a cover letter before applying.");
      return;
    }
    Modal.confirm({
      title: "Send application?",
      content: "We’ll share your cover letter with the hirer.",
      okText: "Send",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await authedFetch("/api/applications", {
            method: "POST",
            body: JSON.stringify({ jobId: id, coverLetter }),
          });
          setCoverLetter("");
          message.success("Application sent ✨");
        } catch (e) {
          message.error(e.message || "Failed to apply");
          // rethrow so Modal shows loading state correctly
          throw e;
        }
      },
    });
  }

  async function saveChanges() {
    Modal.confirm({
      title: "Save changes?",
      okText: "Save",
      cancelText: "Cancel",
      onOk: async () => {
        setSaving(true);
        try {
          const payload = {
            ...form,
            budgetMin: form.budgetMin === "" ? undefined : Number(form.budgetMin),
            budgetMax: form.budgetMax === "" ? undefined : Number(form.budgetMax),
            skills: form.skills ? form.skills.split(/,\s*/).filter(Boolean) : [],
          };
          const data = await authedFetch(`/api/jobs/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
          setJob(data.job);
          setEdit(false);
          message.success("Job updated");
        } catch (e) {
          message.error(e.message || "Failed to save");
          throw e;
        } finally {
          setSaving(false);
        }
      },
    });
  }

  function deleteJob() {
    Modal.confirm({
      title: "Delete this job?",
      content: "This action cannot be undone.",
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeleting(true);
        try {
          await authedFetch(`/api/jobs/${id}`, { method: "DELETE" });
          message.success("Job deleted");
          navigate("/dashboard/hirer");
        } catch (e) {
          message.error(e.message || "Failed to delete");
          throw e;
        } finally {
          setDeleting(false);
        }
      },
    });
  }

  // ——— Render ———

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!job) return <div className="p-6">Not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* top card */}
      <div className="bg-white border rounded-xl p-6 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold">{job.title}</h1>

          {isOwner && !edit && (
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                onClick={() => setEdit(true)}
              >
                Edit
              </button>
              <button
                className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60"
                onClick={deleteJob}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          )}
        </div>

        <div className="text-gray-600">{job.description}</div>

        <div className="text-sm text-gray-500 space-y-1">
          <div>Category: {job.category || "-"}</div>
          <div>Location: {job.location || "-"}</div>
          <div>
            Budget: {formatINR(job.budgetMin || 0)} – {formatINR(job.budgetMax || 0)}
          </div>
          <div>Type: {job.jobType}</div>
          <div>Experience: {job.experienceLevel}</div>
          <div>Status: {job.status}</div>
          {job.deadline && <div>Deadline: {new Date(job.deadline).toDateString()}</div>}
          {job.skills?.length ? <div>Skills: {job.skills.join(", ")}</div> : null}
        </div>
      </div>

      {/* Owner edit form */}
      {isOwner && edit && (
        <div className="bg-white border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold">Edit job</h2>

          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Description"
            rows={5}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Budget Min (₹)"
              inputMode="numeric"
              value={form.budgetMin}
              onChange={(e) =>
                setForm((f) => ({ ...f, budgetMin: e.target.value.replace(/\D/g, "") }))
              }
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Budget Max (₹)"
              inputMode="numeric"
              value={form.budgetMax}
              onChange={(e) =>
                setForm((f) => ({ ...f, budgetMax: e.target.value.replace(/\D/g, "") }))
              }
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <select
              className="w-full border rounded px-3 py-2"
              value={form.jobType}
              onChange={(e) => setForm((f) => ({ ...f, jobType: e.target.value }))}
            >
              <option value="one_time">One-time</option>
              <option value="ongoing">Ongoing</option>
            </select>

            <select
              className="w-full border rounded px-3 py-2"
              value={form.experienceLevel}
              onChange={(e) => setForm((f) => ({ ...f, experienceLevel: e.target.value }))}
            >
              <option value="entry">Entry</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>

            <input
              className="w-full border rounded px-3 py-2"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <select
              className="w-full border rounded px-3 py-2"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>

            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Skills (comma separated)"
              value={form.skills}
              onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
              onClick={saveChanges}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              className="px-4 py-2 rounded border"
              onClick={() => setEdit(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Worker apply box (only when NOT owner) */}
      {!isOwner && (
        <div className="bg-white border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold">Apply to this job</h2>
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Cover letter"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />
          <button
            className="bg-black text-white rounded px-4 py-2 disabled:opacity-60"
            onClick={apply}
            disabled={!coverLetter.trim()}
          >
            Send Request
          </button>
        </div>
      )}
    </div>
  );
}