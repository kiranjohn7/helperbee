// client/src/pages/jobs/JobDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Modal, message, Tag } from "antd";
import { authedFetch, API_URL, formatINR } from "../../lib/utils";

const pretty = (s) => {
  if (!s) return "-";
  const t = String(s).replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(); // "one_time" -> "One time"
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Applications (hirer-only)
  const [appsLoading, setAppsLoading] = useState(false);
  const [applications, setApplications] = useState([]);

  // Worker compose
  const [coverLetter, setCoverLetter] = useState("");

  // Hirer edit
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

  // flags
  const [saving, setSaving] = useState(false);

  // Load job + me
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

    return () => { alive = false; ctrl.abort(); };
  }, [id]);

  // Ownership / assignment
  const isOwner = useMemo(
    () => !!job && !!me && String(job.hirerId) === String(me._id) && me.role === "hirer",
    [job, me]
  );
  const isAssignedWorker = useMemo(
    () => !!job && !!me && String(job.workerId) === String(me._id) && me.role === "worker",
    [job, me]
  );

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

  // Load applications when owner
  useEffect(() => {
    if (!isOwner) return;
    let alive = true;
    (async () => {
      setAppsLoading(true);
      try {
        const data = await authedFetch(`/api/applications?job=${id}`);
        if (!alive) return;
        setApplications(Array.isArray(data.applications) ? data.applications : []);
      } catch (e) {
        console.error("Load applications error:", e);
        if (!alive) return;
        setApplications([]);
      } finally {
        if (alive) setAppsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [isOwner, id]);

  // ——— Actions ———

  function apply() {
    if (!coverLetter.trim()) {
      message.warning("Please write a cover letter before applying.");
      return;
    }
    Modal.confirm({
      title: "Send application?",
      content: "We’ll share your note with the hirer.",
      okText: "Send",
      onOk: async () => {
        try {
          await authedFetch("/api/applications", {
            method: "POST",
            body: JSON.stringify({ jobId: id, coverLetter }),
          });
          setCoverLetter("");
          message.success("Application sent");
        } catch (e) {
          message.error(e.message || "Failed to apply");
          throw e;
        }
      },
    });
  }

  function accept(appId) {
    Modal.confirm({
      title: "Accept this request?",
      content: "This will assign the worker and start a chat.",
      okText: "Accept",
      onOk: async () => {
        try {
          const data = await authedFetch(`/api/applications/${appId}/accept`, { method: "PATCH" });
          setJob(data.job);
          message.success("Worker assigned");
          // Navigate straight to the conversation created/returned by server
          if (data.conversationId) navigate(`/chat/${data.conversationId}`);
          // Refresh requests
          const refreshed = await authedFetch(`/api/applications?job=${id}`);
          setApplications(refreshed.applications || []);
        } catch (e) {
          message.error(e.message || "Failed to accept");
          throw e;
        }
      },
    });
  }

  function decline(appId) {
    Modal.confirm({
      title: "Decline this request?",
      okText: "Decline",
      onOk: async () => {
        try {
          await authedFetch(`/api/applications/${appId}/decline`, { method: "PATCH" });
          // schema uses "rejected"
          setApplications((prev) => prev.map(a => a._id === appId ? { ...a, status: "rejected" } : a));
          message.success("Declined");
        } catch (e) {
          message.error(e.message || "Failed to decline");
          throw e;
        }
      },
    });
  }

  function markWorkerComplete() {
    Modal.confirm({
      title: "Mark work complete?",
      content: "The hirer will still need to confirm completion.",
      okText: "Mark complete",
      onOk: async () => {
        try {
          const data = await authedFetch(`/api/jobs/${id}/worker-complete`, { method: "PATCH" });
          setJob(data.job);
          message.success("Marked complete — waiting for hirer’s confirmation");
        } catch (e) {
          message.error(e.message || "Failed to mark");
          throw e;
        }
      },
    });
  }

  function markHirerComplete() {
    Modal.confirm({
      title: "Confirm job as completed?",
      okText: "Complete",
      onOk: async () => {
        try {
          const data = await authedFetch(`/api/jobs/${id}/complete`, { method: "PATCH" });
          setJob(data.job);
          message.success("Job marked completed");
        } catch (e) {
          message.error(e.message || "Failed to complete");
          throw e;
        }
      },
    });
  }

  // Resolve conversation for this job and navigate to chat
  async function openChatForThisJob() {
    try {
      const j = await authedFetch(`/api/conversations/by-job/${id}`);
      if (j?.conversation?._id) {
        navigate(`/chat/${j.conversation._id}`);
      } else {
        message.info("No conversation yet.");
      }
    } catch (e) {
      message.error(e.message || "Couldn't open chat");
    }
  }

  async function saveChanges() {
    Modal.confirm({
      title: "Save changes?",
      okText: "Save",
      onOk: async () => {
        try {
          setSaving(true);
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

  // ——— Render ———

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!job) return <div className="p-6">Not found</div>;

  const statusPretty = pretty(job.status);
  const typePretty = pretty(job.jobType);
  const expPretty = pretty(job.experienceLevel);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Summary */}
      <div className="bg-white border rounded-xl p-6 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold">{job.title}</h1>

          {/* Action strip (right) */}
          <div className="flex items-center gap-2">
            {job.status !== "completed" && isOwner && !edit && (
              <button className="px-3 py-1.5 rounded-lg border" onClick={() => setEdit(true)}>
                Edit
              </button>
            )}
            {job.status !== "open" && (isOwner || isAssignedWorker) && (
              <button
                className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                onClick={openChatForThisJob}
              >
                Open Chat
              </button>
            )}
            {isOwner && job.status !== "completed" && (
              <button
                className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={markHirerComplete}
              >
                Mark Completed
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Tag>{statusPretty}</Tag>
          <Tag>{typePretty}</Tag>
          <Tag>{expPretty}</Tag>
        </div>

        <div className="text-gray-600">{job.description}</div>

        <div className="text-sm text-gray-500 space-y-1">
          <div>Category: {job.category || "-"}</div>
          <div>Location: {job.location || "-"}</div>
          <div>
            Budget: {formatINR(job.budgetMin || 0)} – {formatINR(job.budgetMax || 0)}
          </div>
          {job.deadline && <div>Deadline: {new Date(job.deadline).toDateString()}</div>}
          {job.skills?.length ? <div>Skills: {job.skills.join(", ")}</div> : null}
          {job.workerCompletedAt && (
            <div className="text-emerald-700">
              Worker marked complete on {new Date(job.workerCompletedAt).toLocaleString()}
            </div>
          )}
          {job.completedAt && (
            <div className="text-emerald-700">
              Completed on {new Date(job.completedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Owner edit form */}
      {isOwner && edit && job.status !== "completed" && (
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

      {/* Applications panel (hirer only, when open) */}
      {isOwner && job.status === "open" && (
        <div className="bg-white border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold">Requests</h2>
          {appsLoading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : applications.length === 0 ? (
            <div className="text-sm text-gray-500">No requests yet.</div>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => (
                <div key={a._id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {a.workerId?.name || "Worker"}{" "}
                      <span className="text-xs text-gray-500">({a.workerId?.email})</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                      {a.coverLetter || "—"}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Status: {pretty(a.status)}</div>
                  </div>
                  <div className="flex gap-2">
                    {a.status === "pending" && (
                      <>
                        <button className="px-3 py-1.5 rounded-lg border" onClick={() => accept(a._id)}>
                          Accept
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700"
                          onClick={() => decline(a._id)}
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Worker apply box (only when NOT owner and job still open) */}
      {!isOwner && job.status === "open" && (
        <div className="bg-white border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold">Apply to this job</h2>
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Write a short note…"
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

      {/* Assigned worker controls */}
      {isAssignedWorker && job.status === "in_progress" && (
        <div className="bg-white border rounded-xl p-6 space-y-2">
          <h2 className="font-semibold">Your work</h2>
          <div className="text-sm text-gray-600">
            When you’ve finished, mark it complete. The hirer will confirm.
          </div>
          <button className="px-4 py-2 rounded border" onClick={markWorkerComplete}>
            Mark Complete
          </button>
        </div>
      )}
    </div>
  );
}