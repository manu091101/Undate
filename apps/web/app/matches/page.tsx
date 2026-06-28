import AppNav from '../../components/AppNav';
import WeeklyMatch from './WeeklyMatch';

export const metadata = { title: 'Your match' };

export default function MatchesPage() {
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-gold-700">This week</p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-cream-50">
            One introduction. Considered.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-cream-50/65">
            No feed, no pile of profiles to sort. Your agent does the searching and brings you a single
            person worth your evening. Start the conversation when you&apos;re ready, then meet. The next
            introduction arrives Sunday.
          </p>
        </header>
        <WeeklyMatch />
      </main>
    </>
  );
}
