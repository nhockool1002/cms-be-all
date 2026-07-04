'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Board } from '@cms-be-all/shared';
import { apiFetch } from '../lib/api-client';
import { formatDateTime } from '../lib/format-date';
import { Breadcrumb } from '../components/breadcrumb';

function BoardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-sky-600" fill="currentColor">
      <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export default function HomePage() {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Board[]>('/boards')
      .then(setBoards)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home' }]} />

      <div className="mb-6 rounded border border-slate-300 bg-white p-4">
        <h1 className="text-xl font-bold text-slate-800">cms-be-all Community</h1>
        <p className="text-sm text-slate-600">Welcome to the community forum.</p>
      </div>

      {error && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>
      )}

      <div className="overflow-hidden rounded border border-slate-300">
        <div className="flex items-center justify-between bg-slate-600 px-4 py-2 text-sm font-semibold text-white">
          <span>Forums</span>
          <span className="hidden sm:block">Last Post</span>
        </div>

        {!boards && !error && <p className="p-4 text-slate-500">Loading…</p>}

        <div className="divide-y divide-slate-200 bg-white">
          {boards?.map((board) => (
            <div key={board.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50">
              <BoardIcon />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/boards/${board.slug}`}
                  className="font-semibold text-sky-700 hover:underline"
                >
                  {board.name}
                </Link>
                {board.description && (
                  <p className="truncate text-sm text-slate-500">{board.description}</p>
                )}
              </div>
              <div className="hidden w-32 shrink-0 text-center text-sm text-slate-600 sm:block">
                <div>
                  Threads: <span className="font-medium text-slate-800">{board.threadCount}</span>
                </div>
                <div>
                  Posts: <span className="font-medium text-slate-800">{board.postCount}</span>
                </div>
              </div>
              <div className="hidden w-56 shrink-0 text-sm sm:block">
                {board.lastPost ? (
                  <>
                    <Link
                      href={`/threads/${board.lastPost.threadId}`}
                      className="block truncate text-sky-700 hover:underline"
                    >
                      {board.lastPost.threadTitle}
                    </Link>
                    <div className="text-slate-500">
                      by{' '}
                      <span className="font-medium text-slate-700">
                        {board.lastPost.authorUsername}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDateTime(board.lastPost.createdAt)}
                    </div>
                  </>
                ) : (
                  <span className="text-slate-400">No posts yet</span>
                )}
              </div>
            </div>
          ))}
          {boards?.length === 0 && <div className="p-4 text-slate-500">No boards yet.</div>}
        </div>
      </div>
    </div>
  );
}
