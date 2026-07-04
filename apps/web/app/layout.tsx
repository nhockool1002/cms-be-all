import type { Metadata } from 'next';
import { AuthProvider } from '../lib/auth-context';
import { NavBar } from '../components/nav-bar';
import './globals.css';

export const metadata: Metadata = {
  title: 'cms-be-all',
  description: 'An original forum + CMS platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <AuthProvider>
          <NavBar />
          <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
