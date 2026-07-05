'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

function QuickLoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ username, password });
      router.refresh();
    } catch {
      setError('Invalid login');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 text-sm">
      {error && <span className="text-red-300">{error}</span>}
      <input
        className="w-28 rounded border border-slate-500 bg-slate-800 px-2 py-1 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400 sm:w-36"
        placeholder="User Name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        className="w-28 rounded border border-slate-500 bg-slate-800 px-2 py-1 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400 sm:w-36"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-sky-600 px-3 py-1 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
      >
        Log in
      </button>
      <Link href="/register" className="hidden text-sky-300 hover:underline sm:inline">
        Register
      </Link>
    </form>
  );
}

export function NavBar() {
  const { user, loading, logout } = useAuth();
  const isAdmin = Boolean(user?.roles.includes('admin'));

  return (
    <>
      <header className="bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            cms-be-all
          </Link>
          {!loading &&
            (user ? (
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <span>
                  Welcome, <span className="font-semibold text-white">{user.username}</span>
                </span>
                <button
                  onClick={logout}
                  className="rounded border border-slate-500 px-3 py-1 hover:bg-slate-800"
                >
                  Log out
                </button>
              </div>
            ) : (
              <QuickLoginForm />
            ))}
        </div>
      </header>
      <nav className="bg-slate-700">
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-4">
          <Link
            href="/"
            className="border-b-2 border-sky-400 px-4 py-2 text-sm font-medium text-white"
          >
            Home
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600"
          >
            Boards
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600"
            >
              Admin
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
