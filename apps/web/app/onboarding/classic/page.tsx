'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@lumin/ui';

const VALUE_CARDS = [
  'Family', 'Career', 'Creativity', 'Adventure', 'Stability', 'Faith',
  'Health', 'Curiosity', 'Honesty', 'Independence', 'Service', 'Humor',
];

const GOAL_OPTIONS: { value: string; label: string }[] = [
  { value: 'SERIOUS_DATING', label: 'A serious relationship' },
  { value: 'LIFE_PARTNER', label: 'A life partner' },
  { value: 'MARRIAGE', label: 'Marriage in the foreseeable future' },
  { value: 'EXPLORING', label: 'Open and exploring' },
];

const ATTACHMENT_OPTIONS = [
  { value: 'SECURE', label: 'I want to talk it through quickly' },
  { value: 'AVOIDANT', label: 'I need space to think before talking' },
  { value: 'ANXIOUS', label: 'I try to fix it without making a fuss' },
  { value: 'DISORGANIZED', label: 'It depends, I notice it changes' },
];

const KIDS_OPTIONS = [
  { value: 'YES', label: 'I want children' },
  { value: 'OPEN', label: 'Open to it' },
  { value: 'NO', label: 'I do not want children' },
  { value: 'HAVE_WANT_MORE', label: 'I have children and want more' },
  { value: 'HAVE_DONE', label: 'I have children, no more' },
];

const GENDER_OPTIONS = [
  { value: 'WOMAN', label: 'Women' },
  { value: 'MAN', label: 'Men' },
  { value: 'NONBINARY', label: 'Non-binary' },
];

export default function OnboardingClassicPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  // No pre-selected answers, the member must actively choose.
  const [goal, setGoal] = useState('');
  const [attachment, setAttachment] = useState('');
  const [kids, setKids] = useState('');
  const [pace, setPace] = useState(4);
  const [bio, setBio] = useState('');
  const [accepted, setAccepted] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState(28);
  const [ageMax, setAgeMax] = useState(40);
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function togglePick(card: string) {
    setPicks((cur) => {
      if (cur.includes(card)) return cur.filter((x) => x !== card);
      if (cur.length >= 5) return cur;
      return [...cur, card];
    });
  }

  function toggleAccepted(gender: string) {
    setAccepted((cur) => (cur.includes(gender) ? cur.filter((x) => x !== gender) : [...cur, gender]));
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch('/api/photos/upload', { method: 'POST', body: fd });
      const j = (await res.json()) as { ok?: boolean; photo?: { id: string; s3Key: string }; error?: string };
      if (j.ok && j.photo) setPhotos((p) => [...p, { id: j.photo!.id, url: j.photo!.s3Key }]);
      else setError(j.error === 'too_large' ? 'That image is over 8MB.' : 'Could not upload that photo. Try another.');
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setError(null);
    if (picks.length < 3) {
      setError('Pick at least three values.');
      return;
    }
    if (!goal || !attachment || !kids) {
      setError('Please answer every question before finishing.');
      return;
    }
    if (bio.trim().length < 10) {
      setError('Your one-line bio is too short. A sentence is enough.');
      return;
    }
    if (accepted.length === 0) {
      setError('Choose at least one gender you would like to meet.');
      return;
    }
    if (ageMin >= ageMax) {
      setError('Your minimum age must be below the maximum.');
      return;
    }
    if (photos.length === 0) {
      setError('Add at least one photo so your matches can see you.');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        topValues: picks,
        relationshipGoal: goal,
        wantsKids: kids,
        attachmentSignal: attachment,
        lifestylePace: pace,
        bioShort: bio.trim(),
        acceptedGenders: accepted,
        ageMin,
        ageMax,
      }),
    });
    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setSubmitting(false);
      setError('Something went wrong. Please try again.');
    }
  }

  const steps = [
    {
      title: 'Pick five values that matter most.',
      help: `${picks.length} of 5 chosen. Tap to add or remove.`,
      body: (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {VALUE_CARDS.map((c) => {
            const active = picks.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => togglePick(c)}
                className={`rounded-lg border px-4 py-4 text-sm transition-all duration-base ease-standard ${
                  active
                    ? 'border-gold-500 bg-gold-500/10 text-cream-50'
                    : 'border-cream-50/15 text-cream-50/80 hover:border-cream-50/30 hover:bg-ink-700'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      ),
      canAdvance: picks.length >= 3,
    },
    {
      title: 'What are you looking for?',
      body: <RadioGroup name="goal" value={goal} onChange={setGoal} options={GOAL_OPTIONS} />,
      canAdvance: goal !== '',
    },
    {
      title: 'When something is wrong between you and a partner, you usually...',
      body: <RadioGroup name="attachment" value={attachment} onChange={setAttachment} options={ATTACHMENT_OPTIONS} />,
      canAdvance: attachment !== '',
    },
    {
      title: 'Children?',
      body: <RadioGroup name="kids" value={kids} onChange={setKids} options={KIDS_OPTIONS} />,
      canAdvance: kids !== '',
    },
    {
      title: 'Most weeknights you prefer, ',
      help: `${pace <= 2 ? 'Quiet at home' : pace >= 6 ? 'Out with people' : 'A bit of both'}`,
      body: (
        <div className="flex flex-col gap-3">
          <input
            type="range"
            min={1}
            max={7}
            step={1}
            value={pace}
            onChange={(e) => setPace(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cream-50/50">
            <span>Quiet at home</span>
            <span>Out with people</span>
          </div>
        </div>
      ),
      canAdvance: true,
    },
    {
      title: 'In one line, who are you?',
      help: `${bio.length}/280`,
      body: (
        <textarea
          maxLength={280}
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Architect, slow reader, runs at sunrise."
          className="w-full rounded-md border border-cream-50/15 bg-ink-700 px-4 py-3 text-cream-50 outline-none focus:border-gold-500/60"
        />
      ),
      canAdvance: bio.trim().length >= 10,
    },
    {
      title: 'Who would you like to meet?',
      body: (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((g) => {
              const active = accepted.includes(g.value);
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => toggleAccepted(g.value)}
                  className={`rounded-full border px-4 py-2 text-sm transition-all duration-base ${
                    active ? 'border-gold-500 bg-gold-500/10' : 'border-cream-50/20 text-cream-50/70 hover:border-cream-50/40'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-cream-50/70">Min age</span>
              <input type="number" min={21} max={95} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} className={numCls} />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-cream-50/70">Max age</span>
              <input type="number" min={21} max={95} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} className={numCls} />
            </label>
          </div>
        </div>
      ),
      canAdvance: accepted.length > 0 && ageMin < ageMax,
    },
    {
      title: 'Add your photos.',
      help: 'Real, recent photos of you. At least one, your matches only ever see these.',
      body: (
        <div className="flex flex-wrap gap-3">
          {photos.map((p) => (
            <img key={p.id} src={p.url} alt="Your photo" className="h-24 w-24 rounded-lg object-cover ring-1 ring-cream-50/10" />
          ))}
          {photos.length < 6 ? (
            <label className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-cream-50/25 text-cream-50/50 hover:border-gold-500/60 ${uploading ? 'opacity-50' : ''}`}>
              <span className="text-2xl leading-none">＋</span>
              <span className="mt-1 text-[10px]">{uploading ? 'Uploading…' : 'Add'}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadPhoto(f); e.target.value = ''; }} />
            </label>
          ) : null}
        </div>
      ),
      canAdvance: photos.length > 0,
    },
  ];

  const current = steps[step]!;
  const last = step === steps.length - 1;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/onboarding" className="text-sm text-cream-50/60 hover:text-cream-50">
        ← Back to the conversation
      </Link>
      <div className="mt-6 mb-10 flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-base ${i <= step ? 'bg-gold-500' : 'bg-cream-50/15'}`}
          />
        ))}
      </div>
      <h1 className="font-display text-3xl tracking-tight">{current.title}</h1>
      {current.help ? <p className="mt-2 text-sm text-cream-50/60">{current.help}</p> : null}
      <div className="mt-10">{current.body}</div>
      {error ? <p className="mt-6 text-sm text-blush-500" role="alert">{error}</p> : null}
      <div className="mt-12 flex items-center justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          ← Back
        </Button>
        {last ? (
          <Button variant="gold" size="lg" disabled={!current.canAdvance || submitting} onClick={submit}>
            {submitting ? 'Saving…' : 'See my matches'}
          </Button>
        ) : (
          <Button variant="gold" disabled={!current.canAdvance} onClick={() => setStep((s) => s + 1)}>
            Continue →
          </Button>
        )}
      </div>
    </main>
  );
}

function RadioGroup({
  name, value, onChange, options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-lg border px-5 py-4 text-left text-sm transition-all ${
              active ? 'border-gold-500 bg-gold-500/10' : 'border-cream-50/15 text-cream-50/80 hover:border-cream-50/30'
            }`}
            aria-checked={active}
            role="radio"
          >
            {o.label}
          </button>
        );
      })}
      <input type="hidden" name={name} value={value} readOnly />
    </div>
  );
}

const numCls = 'rounded-md border border-cream-50/15 bg-ink-700 px-4 py-3 text-cream-50 outline-none focus:border-gold-500/60';
