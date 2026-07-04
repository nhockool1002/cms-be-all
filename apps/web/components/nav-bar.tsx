'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

export function NavBar() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          cms-be-all
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {loading ? null : user ? (
            <>
              <span className="text-gray-600">{user.username}</span>
              <button onClick={logout} className="text-blue-600 hover:underline">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-blue-600 hover:underline">
                Log in
              </Link>
              <Link href="/register" className="text-blue-600 hover:underline">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
