import { Link } from "react-router-dom";
import { formatINR } from "../lib/utils";

export default function JobCard({ job = {} }) {
  const {
    _id,
    title = "Untitled job",
    description = "",
    budgetMin,
    budgetMax,
    location = "Remote (India)",
    category,
    status = "open",
    createdAt,
  } = job;

  const budgetLabel =
    budgetMin || budgetMax
      ? `${formatINR(budgetMin || budgetMax)}${
          budgetMax ? ` – ${formatINR(budgetMax)}` : ""
        }`
      : "Negotiable";

  const dateLabel = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })
    : "";

  const statusStyle =
    {
      open: "bg-emerald-100 text-emerald-700",
      in_progress: "bg-amber-100 text-amber-700",
      completed: "bg-gray-200 text-gray-700",
    }[status] || "bg-gray-100 text-gray-700";

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/jobs/${_id}`}
            className="block font-semibold text-lg hover:underline truncate"
            title={title}
          >
            {title}
          </Link>
          {(category || dateLabel) && (
            <div className="mt-1 text-xs text-gray-500">
              {category}
              {category && dateLabel ? <span className="mx-1">•</span> : null}
              {dateLabel}
            </div>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}
        >
          {String(status).replace("_", " ")}
        </span>
      </div>

      {description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-md bg-indigo-50 px-2 py-1 text-indigo-700 ring-1 ring-indigo-100">
          {budgetLabel}
        </span>
        {location && (
          <span className="rounded-md bg-gray-50 px-2 py-1 text-gray-700 ring-1 ring-gray-100">
            {location}
          </span>
        )}
      </div>

      <div className="mt-4">
        <Link
          to={`/jobs/${_id}`}
          className="inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          View details
        </Link>
      </div>
    </div>
  );
}