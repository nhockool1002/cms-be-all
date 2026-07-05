'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Board, Page } from '@cms-be-all/shared';
import { apiFetch } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';
import { formatDateTime } from '../../lib/format-date';
import { Breadcrumb } from '../../components/breadcrumb';

function BoardsPanel() {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    apiFetch<Board[]>('/boards').then(setBoards).catch((err) => setError(err.message));
  }

  useEffect(refresh, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/boards', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ name, description: description || undefined }),
      });
      setName('');
      setDescription('');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>
      )}

      <form onSubmit={handleCreate} className="space-y-3 rounded border border-slate-300 bg-white p-4">
        <h2 className="font-semibold text-slate-800">New board</h2>
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create board'}
        </button>
      </form>

      <div className="overflow-hidden rounded border border-slate-300 bg-white">
        <div className="bg-slate-600 px-4 py-2 text-sm font-semibold text-white">
          Existing boards
        </div>
        <div className="divide-y divide-slate-200">
          {boards?.map((board) => (
            <div key={board.id} className="flex items-center justify-between px-4 py-2">
              <div>
                <span className="font-medium text-slate-800">{board.name}</span>
                <span className="ml-2 text-xs text-slate-400">/{board.slug}</span>
              </div>
              <span className="text-sm text-slate-500">
                {board.threadCount} threads · {board.postCount} posts
              </span>
            </div>
          ))}
          {boards?.length === 0 && <div className="px-4 py-3 text-slate-500">No boards yet.</div>}
        </div>
      </div>
    </div>
  );
}

function PagesPanel() {
  const [pages, setPages] = useState<Page[] | null>(null);
  const [title, setTitle] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    apiFetch<Page[]>('/admin/pages', { auth: true })
      .then(setPages)
      .catch((err) => setError(err.message));
  }

  useEffect(refresh, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/admin/pages', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ title, bodyMarkdown }),
      });
      setTitle('');
      setBodyMarkdown('');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish(pageId: string) {
    setError(null);
    try {
      await apiFetch(`/admin/pages/${pageId}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish page');
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>
      )}

      <form onSubmit={handleCreate} className="space-y-3 rounded border border-slate-300 bg-white p-4">
        <h2 className="font-semibold text-slate-800">New page (created as draft)</h2>
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Page content"
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
          {submitting ? 'Creating…' : 'Create page'}
        </button>
      </form>

      <div className="overflow-hidden rounded border border-slate-300 bg-white">
        <div className="bg-slate-600 px-4 py-2 text-sm font-semibold text-white">All pages</div>
        <div className="divide-y divide-slate-200">
          {pages?.map((page) => (
            <div key={page.id} className="flex items-center justify-between px-4 py-2">
              <div>
                <span className="font-medium text-slate-800">{page.title}</span>
                <span
                  className={`ml-2 rounded px-1.5 py-0.5 text-xs font-semibold ${
                    page.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {page.status}
                </span>
                {page.status === 'PUBLISHED' && (
                  <Link href={`/pages/${page.slug}`} className="ml-2 text-xs text-sky-700 hover:underline">
                    view
                  </Link>
                )}
              </div>
              {page.status !== 'PUBLISHED' && (
                <button
                  onClick={() => handlePublish(page.id)}
                  className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                >
                  Publish
                </button>
              )}
              {page.status === 'PUBLISHED' && (
                <span className="text-xs text-slate-400">
                  Published {page.publishedAt ? formatDateTime(page.publishedAt) : ''}
                </span>
              )}
            </div>
          ))}
          {pages?.length === 0 && <div className="px-4 py-3 text-slate-500">No pages yet.</div>}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<'boards' | 'pages'>('boards');

  if (loading) {
    return <p className="text-slate-500">Loading…</p>;
  }

  if (!user) {
    return (
      <p className="text-slate-600">
        You must be{' '}
        <Link href="/login" className="text-sky-700 hover:underline">
          logged in
        </Link>{' '}
        as an admin to view this page.
      </p>
    );
  }

  if (!user.roles.includes('admin')) {
    return <p className="text-red-700">You don&apos;t have permission to view this page.</p>;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Admin' }]} />
      <h1 className="mb-4 text-lg font-bold text-slate-800">Admin</h1>

      <div className="mb-4 flex gap-1 border-b border-slate-300">
        <button
          onClick={() => setTab('boards')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'boards'
              ? 'border-b-2 border-sky-600 text-sky-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Boards
        </button>
        <button
          onClick={() => setTab('pages')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'pages'
              ? 'border-b-2 border-sky-600 text-sky-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pages
        </button>
      </div>

      {tab === 'boards' ? <BoardsPanel /> : <PagesPanel />}
    </div>
  );
}
