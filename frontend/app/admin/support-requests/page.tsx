"use client";

import { useEffect, useState } from "react";
import { fetchAdminSupportRequests, updateSupportRequestStatus } from "@/lib/api";
import { SupportRequest } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminSupportRequestsPage() {
  const [adminToken] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : ""
  );
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(Boolean(adminToken));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = async (token: string) => {
    const data = await fetchAdminSupportRequests(token);
    setRequests(data);
  };

  useEffect(() => {
    if (!adminToken) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRequests(adminToken)
      .catch(() => setError("Could not load support requests."))
      .finally(() => setLoading(false));
  }, [adminToken]);

  const onUpdateStatus = async (requestId: string, status: SupportRequest["status"]) => {
    if (!adminToken) return;
    setMessage("");
    setError("");
    try {
      await updateSupportRequestStatus(adminToken, requestId, status);
      setMessage("Status updated.");
      await loadRequests(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-[rgba(73,153,173,0.22)] bg-white shadow-[0_24px_60px_-38px_rgba(73,153,173,0.7)]">
        <div className="bg-[linear-gradient(140deg,rgba(73,153,173,0.16),rgba(73,153,173,0.05))] px-5 py-5">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Support Requests</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Requests submitted from Help Center and Get in touch form.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        {message ? <p className="mb-3 text-sm text-lime-700">{message}</p> : null}
        {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}
        {loading ? <p className="text-sm text-zinc-500">Loading requests...</p> : null}
        {!loading && requests.length === 0 ? <p className="text-sm text-zinc-500">No support requests yet.</p> : null}

        {!loading && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((request) => (
              <article key={request.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-zinc-900">{request.name}</p>
                    <p className="text-sm text-zinc-600">
                      {request.email}
                      {request.phone ? ` • ${request.phone}` : ""}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(request.createdAt)} • {request.locale.toUpperCase()} • {request.source}
                    </p>
                  </div>
                  <select
                    value={request.status}
                    onChange={(event) =>
                      onUpdateStatus(request.id, event.target.value as SupportRequest["status"])
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {request.subject ? (
                  <p className="mt-3 text-sm text-zinc-700">
                    <span className="font-semibold">Subject:</span> {request.subject}
                  </p>
                ) : null}
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">{request.message}</p>
                {request.pageUrl ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    <span className="font-semibold">Page:</span> {request.pageUrl}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
