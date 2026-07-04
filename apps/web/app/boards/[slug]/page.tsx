'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { PaginatedResult, Thread } from '@cms-be-all/shared';
import { apiFetch } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';

export default function BoardPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [threads, setThreads] = useState<PaginatedResult<Thread> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{slug}</h1>
      {error && <p className="text-red-600">{error}</p>}

      <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
        {threads?.items.map((thread) => (
          <li key={thread.id} className="p-4 hover:bg-gray-50">
            <Link href={`/threads/${thread.id}`} className="font-medium text-blue-600">
              {thread.title}
            </Link>
          </li>
        ))}
        {threads?.items.length === 0 && <li className="p-4 text-gray-500">No threads yet.</li>}
      </ul>

      {user ? (
        <form onSubmit={handleCreateThread} className="space-y-3 rounded border border-gray-200 bg-white p-4">
          <h2 className="font-medium">New thread</h2>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="What's on your mind?"
            rows={4}
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post thread'}
          </button>
        </form>
      ) : (
        <p className="text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>{' '}
          to start a new thread.
        </p>
      )}
    </div>
  );
}
