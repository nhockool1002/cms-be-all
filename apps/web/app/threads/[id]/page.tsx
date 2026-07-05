'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { PaginatedResult, Post, Thread } from '@cms-be-all/shared';
import { apiFetch } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import { formatDateTime } from '../../../lib/format-date';
import { Breadcrumb } from '../../../components/breadcrumb';
import { Avatar } from '../../../components/avatar';
import { RoleBadges } from '../../../components/role-badges';

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
    <div>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          ...(thread?.boardSlug
            ? [{ label: thread.boardName ?? thread.boardSlug, href: `/boards/${thread.boardSlug}` }]
            : []),
          { label: thread?.title ?? 'Loading…' },
        ]}
      />

      <h1 className="mb-4 text-lg font-bold text-slate-800">{thread?.title ?? 'Loading…'}</h1>

      {error && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>
      )}

      <div className="space-y-3">
        {posts?.items.map((post, index) => (
          <div key={post.id} className="overflow-hidden rounded border border-slate-300 bg-white">
            <div className="flex items-center justify-between bg-slate-100 px-4 py-1.5 text-xs text-slate-500">
              <span>{index === 0 ? 'Original Post' : `Reply #${index}`}</span>
              <span>
                {formatDateTime(post.createdAt)}
                {post.editedAt && ' (edited)'}
              </span>
            </div>
            <div className="flex gap-4 p-4">
              <div className="flex w-28 shrink-0 flex-col items-center gap-1 text-center">
                <Avatar username={post.author.username} />
                <Link
                  href={`/profile/${post.author.username}`}
                  className="font-semibold text-slate-800 hover:text-sky-700 hover:underline"
                >
                  {post.author.username}
                </Link>
                <RoleBadges roles={post.author.roles} />
                <span className="text-xs text-slate-500">{post.author.rankTitle}</span>
                <span className="text-xs text-slate-400">{post.author.postCount} posts</span>
                <span className="text-xs text-slate-400">
                  Joined {formatDateTime(post.author.joinedAt)}
                </span>
              </div>
              <div
                className="prose prose-sm max-w-none flex-1 border-l border-slate-200 pl-4"
                dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
              />
            </div>
          </div>
        ))}
        {!posts && !error && <div className="rounded border border-slate-300 bg-white p-4 text-slate-500">Loading…</div>}
      </div>

      {user ? (
        <form
          onSubmit={handleReply}
          className="mt-4 space-y-3 rounded border border-slate-300 bg-white p-4"
        >
          <h2 className="font-semibold text-slate-800">Post Reply</h2>
          <textarea
            className="w-full rounded border border-slate-300 px-3 py-2"
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Reply'}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Log in to reply.</p>
      )}
    </div>
  );
}
