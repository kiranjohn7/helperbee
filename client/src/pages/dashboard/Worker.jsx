import { useEffect, useMemo, useState } from "react";
import RoleGate from "../../components/RoleGate";
import JobCard from "../../components/JobCard";
import { Empty } from "antd";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Worker() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // UI state
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sort, setSort] = useState("newest"); // newest | budget_desc | budget_asc

  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        // If your /api/jobs is PUBLIC, keep fetch.
        // If you later secure it, swap to: const data = await authedFetch("/api/jobs");
        const r = await fetch(`${API_URL}/api/jobs`, {
          signal: ctrl.signal,
          // Bust caches to avoid 304 loops
          cache: "no-store",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!alive) return;
        setJobs(Array.isArray(j.jobs) ? j.jobs : []);
      } catch (e) {
        if (e.name === "AbortError") return;
        if (!alive) return;
        setErr("Couldn't load jobs. Please try again.");
        console.error("Worker load error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => { if (j.category) set.add(j.category); });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const min = Number(minBudget);
    const max = Number(maxBudget);

    let list = jobs.filter((j) => {
      const matchesQ =
        !term ||
        j.title?.toLowerCase().includes(term) ||
        j.description?.toLowerCase().includes(term) ||
        j.location?.toLowerCase().includes(term) ||
        j.category?.toLowerCase().includes(term);

      const matchesCat = category === "all" ? true : j.category === category;

      const bMin = typeof j.budgetMin === "number" ? j.budgetMin : 0;
      const bMax = typeof j.budgetMax === "number" ? j.budgetMax : bMin;

      const matchesMin = !minBudget || bMax >= min; // job’s max should be >= wanted min
      const matchesMax = !maxBudget || bMin <= max; // job’s min should be <= wanted max

      return matchesQ && matchesCat && matchesMin && matchesMax;
    });

    switch (sort) {
      case "budget_desc":
        list = list.slice().sort((a, b) => (b.budgetMax || 0) - (a.budgetMax || 0));
        break;
      case "budget_asc":
        list = list.slice().sort((a, b) => (a.budgetMin || 0) - (b.budgetMin || 0));
        break;
      default: // newest
        list = list
          .slice()
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
        break;
    }
    return list;
  }, [jobs, q, category, minBudget, maxBudget, sort]);

  function clearFilters() {
    setQ("");
    setCategory("all");
    setMinBudget("");
    setMaxBudget("");
    setSort("newest");
  }

  return (
    <RoleGate role="worker">
      <section className="space-y-4">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Browse Jobs</h1>
          <p className="text-sm text-gray-600">
            Find gigs that match your skills. All listings are free to apply.
          </p>
        </div>

        {/* Filters (mobile-first stack) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Search title, location, keywords…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="w-full border rounded-lg px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>

          <div className="flex gap-3">
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Min ₹"
              inputMode="numeric"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value.replace(/\D/g, ""))}
            />
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Max ₹"
              inputMode="numeric"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <select
            className="w-full border rounded-lg px-3 py-2"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="budget_desc">Budget: High to Low</option>
            <option value="budget_asc">Budget: Low to High</option>
          </select>
        </div>

        {/* Results */}
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
            <Empty description="No jobs are available yet" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center py-16 gap-3">
            <Empty description="No jobs match your filters" />
            <button
              className="inline-flex justify-center px-4 py-2 rounded-lg border hover:bg-gray-50"
              onClick={clearFilters}
            >
              Clear filters
            </button>
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