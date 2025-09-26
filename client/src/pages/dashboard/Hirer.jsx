import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RoleGate from "../../components/RoleGate";
import JobCard from "../../components/JobCard";
import { Empty } from "antd";
import { authedFetch } from "../../lib/utils";

export default function Hirer() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // UI filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000); // cancel fetch after 8s

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await authedFetch("/api/jobs?mine=1", {
          signal: ctrl.signal,
        });
        if (!alive) return;
        setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
      } catch (e) {
        if (!alive) return;
        if (e.name === "AbortError")
          setErr("Request timed out. Please refresh.");
        else setErr(e.message || "Couldn't load your jobs.");
      } finally {
        if (alive) setLoading(false);
        clearTimeout(timer);
      }
    })();

    return () => {
      alive = false;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []); // ← no 'loading' dep needed

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesStatus = status === "all" ? true : j.status === status;
      const matchesQ =
        !term ||
        j.title?.toLowerCase().includes(term) ||
        j.description?.toLowerCase().includes(term) ||
        j.category?.toLowerCase().includes(term) ||
        j.location?.toLowerCase().includes(term);
      return matchesStatus && matchesQ;
    });
  }, [jobs, q, status]);

  const stats = useMemo(() => {
    const open = jobs.filter((j) => j.status === "open").length;
    const inProgress = jobs.filter((j) => j.status === "in_progress").length;
    const done = jobs.filter((j) => j.status === "completed").length;
    return { total: jobs.length, open, inProgress, done };
  }, [jobs]);

  return (
    <RoleGate role="hirer">
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Your Dashboard</h1>
            <p className="text-sm text-gray-600">
              Manage postings, track progress, and hire faster.
            </p>
          </div>
          <Link
            to="/jobs/post"
            className="inline-flex justify-center px-4 py-2 rounded-lg bg-black text-white hover:opacity-95"
          >
            Post a Job
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Open" value={stats.open} />
          <StatCard label="In Progress" value={stats.inProgress} />
          <StatCard label="Completed" value={stats.done} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="w-full sm:flex-1 border rounded-lg px-3 py-2"
            placeholder="Search by title, category, location…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="w-full sm:w-48 border rounded-lg px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : err ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : jobs.length === 0 ? (
          <div className="grid place-items-center py-16">
            <Empty description="You haven't posted any jobs yet">
              <Link
                to="/jobs/post"
                className="mt-3 inline-flex justify-center px-4 py-2 rounded-lg bg-black text-white hover:opacity-95"
              >
                Post your first job
              </Link>
            </Empty>
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center py-16">
            <Empty description="No jobs match your filters" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((j) => (
              <JobCard key={j._id} job={j} />
            ))}
          </div>
        )}
      </section>
    </RoleGate>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
function SkeletonCard() {
  return (
    <div className="p-4 bg-white rounded-xl border shadow-sm animate-pulse">
      <div className="h-4 w-3/5 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-full bg-gray-200 rounded mb-2" />
      <div className="h-3 w-4/5 bg-gray-200 rounded mb-4" />
      <div className="h-3 w-2/5 bg-gray-200 rounded" />
    </div>
  );
}
