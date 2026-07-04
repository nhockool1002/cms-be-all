import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className="mb-4 border-b border-slate-300 pb-2 text-sm text-slate-600">
      {items.map((item, i) => (
        <span key={i}>
          {item.href ? (
            <Link href={item.href} className="text-sky-700 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-800">{item.label}</span>
          )}
          {i < items.length - 1 && <span className="mx-2 text-slate-400">›</span>}
        </span>
      ))}
    </div>
  );
}
