"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useProjects } from "@/components/dashboard/project-context";
import { API_URL } from "@/lib/api";
import { cachedFetch, invalidateCache } from "@/lib/fetch-cache";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export function ProjectMembersPanel() {
  const { activeProject, isOwner } = useProjects();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchMembers = useCallback(async () => {
    setMembers([]);
    setLoading(true);
    try {
      const res = await cachedFetch(`${API_URL}/api/projects/${activeProject.id}/members`, {
        credentials: "include",
        ttl: 120_000
      });
      const data = await res.json().catch(() => null);
      setMembers(res.ok ? (data?.members ?? []) : []);
    } finally {
      setLoading(false);
    }
  }, [activeProject.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    setAdding(true);

    try {
      const res = await fetch(`${API_URL}/api/projects/${activeProject.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error?.message ?? "Unable to add member.");
        return;
      }

      setEmail("");
      setNotice(`${data.member.name} has been added as an editor.`);
      setMembers((prev) => [...prev, data.member]);
      invalidateCache(`/api/projects/${activeProject.id}/members`);
    } catch {
      setError("Unable to reach the backend.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(memberId: string) {
    setError("");
    setNotice("");
    setRemovingId(memberId);

    try {
      const res = await fetch(`${API_URL}/api/projects/${activeProject.id}/members/${memberId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "Unable to remove member.");
        return;
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      invalidateCache(`/api/projects/${activeProject.id}/members`);
    } catch {
      setError("Unable to reach the backend.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-cloud bg-white shadow-sm">
      <div className="border-b border-cloud px-4 py-3">
        <h3 className="text-base font-semibold text-ink">Members</h3>
        <p className="mt-0.5 text-sm text-slate">People with access to {activeProject.name}.</p>
      </div>

      {loading ? (
        <p className="px-4 py-4 text-sm text-slate">Loading members...</p>
      ) : (
        <ul className="divide-y divide-cloud">
          {members.length === 0 ? (
            <li className="px-4 py-4 text-sm text-slate">No additional members yet.</li>
          ) : (
            members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{member.name}</p>
                  <p className="text-xs text-slate">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[rgba(91,141,239,0.12)] px-2 py-0.5 text-xs font-semibold text-[#2c5eb5]">
                    {member.role}
                  </span>
                  {isOwner ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-slate transition hover:text-red-600 disabled:opacity-50"
                      disabled={removingId === member.id}
                      onClick={() => handleRemove(member.id)}
                    >
                      {removingId === member.id ? "Removing..." : "Remove"}
                    </button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {isOwner ? (
        <div className="border-t border-cloud px-4 py-4">
          <p className="mb-3 text-sm font-medium text-ink">Add a member</p>
          <form className="flex gap-2" onSubmit={handleAdd}>
            <input
              className="h-9 flex-1 rounded-lg border border-cloud bg-white px-3 text-sm outline-none transition placeholder:text-slate/60 focus:border-sky focus:ring-4 focus:ring-[rgba(91,141,239,0.12)]"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="h-9 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-[#1b2029] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={adding}
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </form>
          <p className="mt-2 text-xs text-slate">Only registered users can be added.</p>
          {error ? (
            <p className="mt-2 rounded-lg bg-[rgba(255,107,90,0.12)] px-3 py-2 text-sm text-[#b83628]">{error}</p>
          ) : null}
          {notice ? (
            <p className="mt-2 rounded-lg bg-[rgba(35,184,169,0.12)] px-3 py-2 text-sm text-[#127b72]">{notice}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
