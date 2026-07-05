'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Page } from '@cms-be-all/shared';
import { apiFetch } from '../../../lib/api-client';
import { Breadcrumb } from '../../../components/breadcrumb';

export default function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Page>(`/pages/${slug}`)
      .then(setPage)
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) {
    return (
      <p className="rounded border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>
    );
  }

  if (!page) {
    return <p className="text-slate-500">Loading…</p>;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: page.title }]} />
      <div className="rounded border border-slate-300 bg-white p-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-800">{page.title}</h1>
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
        />
      </div>
    </div>
  );
}
