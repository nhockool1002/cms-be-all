'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { PaginatedResult, Thread } from '@cms-be-all/shared';
import { apiFetch } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import { formatDateTime } from '../../../lib/format-date';
import { Breadcrumb } from '../../../components/breadcrumb';

function ThreadIcon({ isLocked }: { isLocked: boolean }) {
  if (isLocked) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="currentColor">
        <path d="M12 2a4 4 0 0 0-4 4v3H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v3h-4V6a2 2 0 0 1 2-2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-sky-500" fill="currentColor">
      <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export default function BoardPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [threads, setThreads] = useState<PaginatedResult<Thread> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function refresh() {
    apiFetch<PaginatedResult<Thread>>(`/boards/${slug}/threads`)
      .then(setThreads)
      .catch((err) => setError(err.message));
  }

  useEffect(refresh, [slug]);

  async function handleCreateThread(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const thread = await apiFetch<Thread>(`/boards/${slug}/threads`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ title, bodyMarkdown }),
      });
      router.push(`/threads/${thread.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thread');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: slug }]} />

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">{slug.replace(/-/g, ' ')}</h1>
        {user && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            + New Thread
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleCreateThread}
          className="mb-4 space-y-3 rounded border border-slate-300 bg-white p-4"
        >
          <h2 className="font-semibold text-slate-800">New thread</h2>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="What's on your mind?"
            rows={4}
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post thread'}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded border border-slate-300">
        <div className="flex items-center bg-slate-600 px-4 py-2 text-sm font-semibold text-white">
          <span className="flex-1">Thread</span>
          <span className="hidden w-20 text-center sm:block">Replies</span>
          <span className="hidden w-20 text-center sm:block">Views</span>
          <span className="hidden w-56 sm:block">Last Post</span>
        </div>

        <div className="divide-y divide-slate-200 bg-white">
          {threads?.items.map((thread) => (
            <div key={thread.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <ThreadIcon isLocked={thread.isLocked} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/threads/${thread.id}`}
                  className="font-medium text-sky-700 hover:underline"
                >
                  {thread.isPinned && (
                    <span className="mr-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                      Pinned
                    </span>
                  )}
                  {thread.title}
                </Link>
                <div className="text-xs text-slate-500">by {thread.authorUsername}</div>
              </div>
              <div className="hidden w-20 text-center text-sm text-slate-600 sm:block">
                {thread.replyCount}
              </div>
              <div className="hidden w-20 text-center text-sm text-slate-600 sm:block">
                {thread.viewCount}
              </div>
              <div className="hidden w-56 text-sm sm:block">
                {thread.lastPost ? (
                  <>
                    <div className="text-slate-500">
                      by{' '}
                      <span className="font-medium text-slate-700">
                        {thread.lastPost.authorUsername}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDateTime(thread.lastPost.createdAt)}
                    </div>
                  </>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>
          ))}
          {threads?.items.length === 0 && (
            <div className="p-4 text-slate-500">No threads yet — be the first to post.</div>
          )}
          {!threads && !error && <div className="p-4 text-slate-500">Loading…</div>}
        </div>
      </div>

      {!user && (
        <p className="mt-4 text-sm text-slate-500">
          <Link href="/login" className="text-sky-700 hover:underline">
            Log in
          </Link>{' '}
          to start a new thread.
        </p>
      )}
    </div>
  );
}
