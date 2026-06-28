'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button, Card, CardContent, Sparkle, cn } from '@lumin/ui';

interface Initial {
  displayName: string;
  pronouns: string;
  city: string;
  occupation: string;
  company: string;
  education: string;
  heightCm: number | null;
  bioShort: string;
  bioLong: string;
  relationshipGoal: string;
  ageMin: number;
  ageMax: number;
  distanceKm: number;
  acceptedGenders: string[];
}

interface Photo {
  id: string;
  url: string;
  isPrimary: boolean;
  orderIdx: number;
}

const GENDERS = [
  { value: 'WOMAN', label: 'Women' },
  { value: 'MAN', label: 'Men' },
  { value: 'NONBINARY', label: 'Non-binary' },
];

const GOALS = [
  { value: 'SERIOUS_DATING', label: 'Serious dating' },
  { value: 'LIFE_PARTNER', label: 'Life partner' },
  { value: 'MARRIAGE', label: 'Marriage' },
  { value: 'EXPLORING', label: 'Exploring' },
];

export default function EditForm({
  initial,
  initialPhotos,
}: {
  initial: Initial;
  initialPhotos: Photo[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<Initial>(initial);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleGender(g: string) {
    setForm((f) => ({
      ...f,
      acceptedGenders: f.acceptedGenders.includes(g)
        ? f.acceptedGenders.filter((x) => x !== g)
        : [...f.acceptedGenders, g],
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.ageMin >= form.ageMax) {
      setToast({ kind: 'err', msg: 'Minimum age must be below the maximum.' });
      return;
    }
    if (form.acceptedGenders.length === 0) {
      setToast({ kind: 'err', msg: 'Choose at least one gender you would like to meet.' });
      return;
    }
    setSaving(true);
    setToast(null);
    const payload = {
      displayName: form.displayName,
      pronouns: form.pronouns || null,
      city: form.city,
      occupation: form.occupation || null,
      company: form.company || null,
      education: form.education || null,
      heightCm: form.heightCm ?? null,
      bioShort: form.bioShort || null,
      bioLong: form.bioLong || null,
      relationshipGoal: form.relationshipGoal,
      preferences: {
        ageMin: form.ageMin,
        ageMax: form.ageMax,
        distanceKm: form.distanceKm,
        acceptedGenders: form.acceptedGenders,
      },
    };
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setToast({ kind: 'ok', msg: 'Saved.' });
      router.refresh();
    } else {
      setToast({ kind: 'err', msg: 'Could not save. Try again.' });
    }
  }

  async function onUpload(file: File) {
    setUploading(true);
    setToast(null);
    const fd = new FormData();
    fd.append('photo', file);
    const res = await fetch('/api/photos/upload', { method: 'POST', body: fd });
    setUploading(false);
    if (res.status === 201) {
      const { photo } = (await res.json()) as { photo: { id: string; s3Key: string; isPrimary: boolean } };
      setPhotos((p) => [
        ...p,
        { id: photo.id, url: photo.s3Key, isPrimary: photo.isPrimary, orderIdx: p.length },
      ]);
      setToast({ kind: 'ok', msg: 'Photo added.' });
      if (fileInput.current) fileInput.current.value = '';
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      const msgs: Record<string, string> = {
        too_large: 'That file is larger than 8MB.',
        unsupported_type: 'Only JPEG, PNG, or WebP files are accepted.',
        photo_limit: 'You can have up to six photos.',
        image_decode_failed: 'That image could not be processed.',
      };
      setToast({ kind: 'err', msg: msgs[err.error ?? ''] ?? 'Upload failed. Try again.' });
    }
  }

  async function deletePhoto(id: string) {
    const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPhotos((p) => {
        const next = p.filter((x) => x.id !== id);
        // If we deleted the primary, the API promotes the next one. Reflect that.
        if (next.length > 0 && !next.some((x) => x.isPrimary)) {
          next[0]!.isPrimary = true;
        }
        return next;
      });
    }
  }

  async function makePrimary(id: string) {
    const res = await fetch(`/api/photos/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ makePrimary: true }),
    });
    if (res.ok) {
      setPhotos((p) => p.map((x) => ({ ...x, isPrimary: x.id === id })));
    }
  }

  return (
    <form onSubmit={save} className="mt-10 space-y-8">
      <Card>
        <CardContent className="p-6">
          <SectionHeading>Photos</SectionHeading>
          <p className="mt-1 text-xs text-cream-50/55">
            Up to six. First photo is your primary — it&apos;s what other members see in their drop.
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="group relative aspect-[4/5] overflow-hidden rounded-md bg-ink-700">
                <img src={p.url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                {p.isPrimary ? (
                  <div className="absolute left-2 top-2 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-ink-900">
                    Primary
                  </div>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {!p.isPrimary ? (
                    <button
                      type="button"
                      onClick={() => makePrimary(p.id)}
                      className="rounded-md bg-ink-900/80 px-2 py-1 text-[11px] text-cream-50 backdrop-blur hover:bg-ink-900"
                    >
                      Set primary
                    </button>
                  ) : <span />}
                  <button
                    type="button"
                    onClick={() => deletePhoto(p.id)}
                    className="rounded-md bg-ink-900/80 px-2 py-1 text-[11px] text-blush-500 backdrop-blur hover:bg-ink-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {photos.length < 6 ? (
              <label
                className={cn(
                  'flex aspect-[4/5] cursor-pointer items-center justify-center rounded-md border border-dashed border-cream-50/20 text-center text-sm text-cream-50/55 hover:border-gold-500/60 hover:text-gold-300 transition-colors',
                  uploading && 'opacity-60 pointer-events-none',
                )}
              >
                {uploading ? 'Uploading…' : <span>+ Add a photo<br/><span className="text-xs text-cream-50/35">JPG, PNG or WebP · up to 8MB</span></span>}
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                  }}
                />
              </label>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-5">
          <SectionHeading>About you</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Display name">
              <input value={form.displayName} onChange={(e) => set('displayName', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Pronouns (optional)">
              <input value={form.pronouns} onChange={(e) => set('pronouns', e.target.value)} className={inputCls} placeholder="she/her, they/them, …" />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Height (cm, optional)">
              <input
                type="number"
                value={form.heightCm ?? ''}
                onChange={(e) => set('heightCm', e.target.value === '' ? null : Number(e.target.value))}
                className={inputCls}
                min={120}
                max={230}
              />
            </Field>
            <Field label="Occupation (optional)">
              <input value={form.occupation} onChange={(e) => set('occupation', e.target.value)} className={inputCls} placeholder="Architect" />
            </Field>
            <Field label="Company (optional)">
              <input value={form.company} onChange={(e) => set('company', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Education (optional)" className="sm:col-span-2">
              <input value={form.education} onChange={(e) => set('education', e.target.value)} className={inputCls} placeholder="MArch, NUS" />
            </Field>
          </div>

          <Field label={`Bio (${form.bioShort.length}/280)`}>
            <textarea
              maxLength={280}
              rows={2}
              value={form.bioShort}
              onChange={(e) => set('bioShort', e.target.value)}
              className={inputCls}
              placeholder="One line. Your voice, not a CV."
            />
          </Field>

          <Field label="Longer bio (optional)">
            <textarea
              maxLength={2000}
              rows={4}
              value={form.bioLong}
              onChange={(e) => set('bioLong', e.target.value)}
              className={inputCls}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-5">
          <SectionHeading>Intent</SectionHeading>
          <Field label="What are you looking for?">
            <select value={form.relationshipGoal} onChange={(e) => set('relationshipGoal', e.target.value)} className={inputCls}>
              {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-5">
          <SectionHeading>Who you&apos;d like to meet</SectionHeading>
          <Field label="Genders">
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => {
                const active = form.acceptedGenders.includes(g.value);
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => toggleGender(g.value)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm transition-all',
                      active ? 'border-gold-500 bg-gold-500/10' : 'border-cream-50/20 text-cream-50/70 hover:border-cream-50/40',
                    )}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min age">
              <input
                type="number"
                min={21}
                max={95}
                value={form.ageMin}
                onChange={(e) => set('ageMin', Number(e.target.value))}
                className={inputCls}
              />
            </Field>
            <Field label="Max age">
              <input
                type="number"
                min={21}
                max={95}
                value={form.ageMax}
                onChange={(e) => set('ageMax', Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Distance (km)">
            <input
              type="range"
              min={1}
              max={250}
              value={form.distanceKm}
              onChange={(e) => set('distanceKm', Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-cream-50/50 font-mono">{form.distanceKm} km</span>
          </Field>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-lg border border-cream-50/15 bg-ink-700/95 px-5 py-3 backdrop-blur">
        <div className="text-xs">
          {toast ? (
            <span className={toast.kind === 'ok' ? 'text-sage-500 inline-flex items-center gap-1.5' : 'text-blush-500'}>
              {toast.kind === 'ok' ? <Sparkle size={12} /> : null}
              {toast.msg}
            </span>
          ) : (
            <span className="text-cream-50/40">Changes save when you press the button.</span>
          )}
        </div>
        <Button type="submit" variant="gold" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl tracking-tight">{children}</h2>;
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-2 text-sm', className)}>
      <span className="text-cream-50/65">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'rounded-md border border-cream-50/15 bg-ink-700 px-4 py-2.5 text-cream-50 outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/40';
