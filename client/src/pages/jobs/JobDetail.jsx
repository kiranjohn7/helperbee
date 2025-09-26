import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authedFetch, API_URL, formatINR } from "../../lib/utils";

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const r = await fetch(`${API_URL}/api/jobs/${id}`, {
          signal: ctrl.signal,
          cache: "no-store", // avoid 304 on details too
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        setJob(j.job || null);
      } catch (e) {
        if (e.name !== "AbortError") setErr("Couldn’t load job details.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [id]);

  async function apply() {
    try {
      await authedFetch("/api/applications", {
        method: "POST",
        body: JSON.stringify({ jobId: id, coverLetter }),
      });
      alert("Applied! ✨");
    } catch (e) {
      alert(e.message || "Couldn’t apply. Please try again.");
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!job) return <div className="p-6">Job not found.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white border rounded-xl p-6">
        <h1 className="text-2xl font-semibold mb-2">{job.title}</h1>
        <div className="text-gray-600 mb-2 whitespace-pre-wrap">{job.description}</div>
        <div className="text-gray-500">
          Budget: {formatINR(job.budgetMin || 0)} – {formatINR(job.budgetMax || 0)}
        </div>
        {job.location && <div className="text-gray-500 mt-1">Location: {job.location}</div>}
        {job.category && <div className="text-gray-500">Category: {job.category}</div>}
      </div>

      <div className="bg-white border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold">Apply to this job</h2>
        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder="Cover letter"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={5}
        />
        <button
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-60"
          onClick={apply}
          disabled={!coverLetter.trim()}
        >
          Send Request
        </button>
      </div>
    </div>
  );
}