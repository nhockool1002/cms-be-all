'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Board } from '@cms-be-all/shared';
import { apiFetch } from '../lib/api-client';

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
      <h1 className="mb-4 text-2xl font-semibold">Boards</h1>
      {error && <p className="text-red-600">{error}</p>}
      {!boards && !error && <p className="text-gray-500">Loading…</p>}
      <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
        {boards?.map((board) => (
          <li key={board.id} className="p-4 hover:bg-gray-50">
            <Link href={`/boards/${board.slug}`} className="font-medium text-blue-600">
              {board.name}
            </Link>
            {board.description && <p className="text-sm text-gray-600">{board.description}</p>}
          </li>
        ))}
        {boards?.length === 0 && <li className="p-4 text-gray-500">No boards yet.</li>}
      </ul>
    </div>
  );
}
