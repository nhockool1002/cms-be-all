'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { PaginatedResult, Post, Thread } from '@cms-be-all/shared';
import { apiFetch } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<PaginatedResult<Post> | null>(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    apiFetch<Thread>(`/threads/${id}`).then(setThread).catch((err) => setError(err.message));
    apiFetch<PaginatedResult<Post>>(`/threads/${id}/posts`)
      .then(setPosts)
      .catch((err) => setError(err.message));
  }

  useEffect(refresh, [id]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/threads/${id}/posts`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ bodyMarkdown: reply }),
      });
      setReply('');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{thread?.title ?? 'Loading…'}</h1>
      {error && <p className="text-red-600">{error}</p>}

      <ul className="space-y-3">
        {posts?.items.map((post) => (
          <li key={post.id} className="rounded border border-gray-200 bg-white p-4">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
            />
          </li>
        ))}
      </ul>

      {user ? (
        <form onSubmit={handleReply} className="space-y-3 rounded border border-gray-200 bg-white p-4">
          <h2 className="font-medium">Reply</h2>
          <textarea
            className="w-full rounded border border-gray-300 px-3 py-2"
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Reply'}
          </button>
        </form>
      ) : (
        <p className="text-gray-500">Log in to reply.</p>
      )}
    </div>
  );
}
