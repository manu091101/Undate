import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '../../lib/auth';
import { Logo } from '../../components/Logo';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/admin');
  if (!session.isAdmin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-ink-900">
      <header className="border-b border-cream-50/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo height={24} />
            <span className="text-xs uppercase tracking-[0.2em] text-cream-50/50">Curation desk</span>
          </div>
          <Link href="/dashboard" className="text-sm text-cream-50/60 hover:text-cream-50">
            Exit to app →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
