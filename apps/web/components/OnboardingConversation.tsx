'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@lumin/ui';
import { Logo } from './Logo';

type Msg = { role: 'assistant' | 'user'; content: string };
type Phase = 'loading' | 'chatting' | 'prefs' | 'finalizing' | 'error';

const GENDER_OPTIONS = [
  { value: 'WOMAN', label: 'Women' },
  { value: 'MAN', label: 'Men' },
  { value: 'NONBINARY', label: 'Non-binary' },
];

const TOTAL = 7;

// Minimal typing for the Web Speech API (not in lib.dom defaults).
interface RecognitionResultAlt { transcript: string }
interface RecognitionResult { isFinal: boolean; 0: RecognitionResultAlt; length: number }
interface RecognitionEvent { results: { length: number; [i: number]: RecognitionResult } }
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface VoiceOption { label: string; gender: 'female' | 'male'; name: string }

const FEMALE_NAMES = ['samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'allison', 'ava', 'susan', 'zoe', 'nicky', 'kathy', 'google us english', 'female', 'aria', 'jenny', 'sonia'];
const MALE_NAMES = ['daniel', 'alex', 'fred', 'aaron', 'rishi', 'tom', 'oliver', 'gordon', 'google uk english male', 'male', 'guy', 'ryan'];

export function OnboardingConversation({ mode }: { mode: 'text' | 'voice' }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('loading');
  const [thinking, setThinking] = useState(false);
  const [awaitingFinal, setAwaitingFinal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // voice
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');

  // prefs + photos
  const [accepted, setAccepted] = useState<string[]>(['MAN']);
  const [ageMin, setAgeMin] = useState(28);
  const [ageMax, setAgeMax] = useState(40);
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // ── TTS voices ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'voice' || typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
      const pick = (names: string[]): SpeechSynthesisVoice | undefined =>
        names.map((n) => all.find((v) => v.name.toLowerCase().includes(n))).find(Boolean) ??
        all.find((v) => names.some((n) => v.name.toLowerCase().includes(n)));
      const opts: VoiceOption[] = [];
      const f = pick(FEMALE_NAMES) ?? all[0];
      const m = pick(MALE_NAMES) ?? all.find((v) => v !== f) ?? all[0];
      if (f) opts.push({ label: `Female · ${f.name.replace(/\(.*\)/, '').trim()}`, gender: 'female', name: f.name });
      if (m && m.name !== f?.name) opts.push({ label: `Male · ${m.name.replace(/\(.*\)/, '').trim()}`, gender: 'male', name: m.name });
      setVoices(opts);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [mode]);

  const speak = useCallback(
    (text: string) => {
      if (mode !== 'voice' || typeof window === 'undefined' || !window.speechSynthesis) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const chosen = voices.find((v) => v.gender === voiceGender);
        if (chosen) {
          const sv = window.speechSynthesis.getVoices().find((v) => v.name === chosen.name);
          if (sv) u.voice = sv;
        }
        u.rate = 0.98;
        u.pitch = voiceGender === 'male' ? 0.95 : 1.05;
        window.speechSynthesis.speak(u);
      } catch {
        /* ignore */
      }
    },
    [mode, voices, voiceGender],
  );

  const nextTurn = useCallback(
    async (history: Msg[]) => {
      setThinking(true);
      try {
        const res = await fetch('/api/onboarding/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ history }),
        });
        if (!res.ok) throw new Error('chat');
        const j = (await res.json()) as { message: string; done: boolean };
        setMessages((m) => [...m, { role: 'assistant', content: j.message }]);
        setAwaitingFinal(j.done);
        setPhase('chatting');
        speak(j.message);
      } catch {
        setError('We lost the thread for a moment. Please try again.');
        setPhase('error');
      } finally {
        setThinking(false);
      }
    },
    [speak],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (mode === 'voice' && typeof window !== 'undefined') {
      const Ctor =
        (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
      if (!Ctor) setVoiceSupported(false);
    }
    void nextTurn([]);
  }, [mode, nextTurn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const submitAnswer = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      const history = [...messages, { role: 'user' as const, content: trimmed }];
      setMessages(history);
      setInput('');
      if (awaitingFinal) {
        setPhase('prefs');
        return;
      }
      await nextTurn(history);
    },
    [messages, thinking, awaitingFinal, nextTurn],
  );

  // ── STT ─────────────────────────────────────────────────────────────────
  function startListening() {
    setMicError(null);
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceSupported(false);
      setMicError('Voice input isn’t supported in this browser — please type your answer, or use Chrome.');
      return;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    try {
      const rec = new Ctor();
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.continuous = true;
      rec.onresult = (e: RecognitionEvent) => {
        // Rebuild the full text from scratch each event (results list is cumulative).
        let out = '';
        for (let i = 0; i < e.results.length; i++) {
          const seg = e.results[i];
          if (seg && seg[0]) out += seg[0].transcript;
        }
        setInput(out.trim());
      };
      rec.onerror = (ev: { error?: string }) => {
        setListening(false);
        if (ev?.error === 'not-allowed' || ev?.error === 'service-not-allowed') {
          setMicError('Microphone access is blocked. Allow it in your browser’s address bar, then tap the mic again.');
        } else if (ev?.error === 'no-speech') {
          setMicError('I didn’t catch that — tap the mic and try again.');
        } else if (ev?.error !== 'aborted') {
          setMicError('Voice input hit a snag — you can type your answer instead.');
        }
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      setMicError('Couldn’t start the microphone — type your answer instead.');
    }
  }

  function stopListening() {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  }

  // ── photos ──────────────────────────────────────────────────────────────
  async function uploadPhoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch('/api/photos/upload', { method: 'POST', body: fd });
      const j = (await res.json()) as { ok?: boolean; photo?: { id: string; s3Key: string }; error?: string };
      if (j.ok && j.photo) {
        setPhotos((p) => [...p, { id: j.photo!.id, url: j.photo!.s3Key }]);
      } else {
        setError(j.error === 'too_large' ? 'That image is over 8MB.' : 'Could not upload that photo. Try another.');
      }
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  async function finalize() {
    if (accepted.length === 0 || ageMin >= ageMax) {
      setError('Choose who you want to meet and a valid age range.');
      return;
    }
    if (photos.length === 0) {
      setError('Add at least one photo so your matches can see you.');
      return;
    }
    setPhase('finalizing');
    setError(null);
    try {
      const res = await fetch('/api/onboarding/finalize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transcript: messages, acceptedGenders: accepted, ageMin, ageMax }),
      });
      if (!res.ok) throw new Error('finalize');
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong saving your profile. Please try again.');
      setPhase('prefs');
    }
  }

  const questionsAsked = messages.filter((m) => m.role === 'assistant').length;
  const progress = Math.min(questionsAsked, TOTAL);
  function toggleAccepted(g: string) {
    setAccepted((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo height={26} />
          <span className="text-xs uppercase tracking-[0.18em] text-cream-50/50">
            {mode === 'voice' ? 'Voice interview' : 'Meet your matchmaker'}
          </span>
        </div>
        <Link href="/onboarding" className="text-xs text-cream-50/50 hover:text-cream-50">← Change how</Link>
      </header>

      <div className="mt-6 flex items-center gap-1.5">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-base ${i < progress ? 'bg-gold-500' : 'bg-cream-50/15'}`} />
        ))}
      </div>

      {/* Voice controls */}
      {mode === 'voice' && phase !== 'prefs' && phase !== 'finalizing' ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-cream-50/10 bg-ink-700/40 px-3 py-2 text-xs">
          <span className="text-cream-50/55">Matchmaker voice:</span>
          {voices.length > 0 ? (
            voices.map((v) => (
              <button
                key={v.name}
                type="button"
                onClick={() => setVoiceGender(v.gender)}
                className={`rounded-full px-3 py-1 transition-colors ${voiceGender === v.gender ? 'bg-gold-500 text-white' : 'bg-cream-50/[0.06] text-cream-50/70 hover:bg-cream-50/10'}`}
              >
                {v.label}
              </button>
            ))
          ) : (
            <span className="text-cream-50/40">loading system voices…</span>
          )}
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={() => speak(messages[messages.length - 1]!.content)}
              className="ml-auto rounded-full bg-cream-50/[0.06] px-3 py-1 text-cream-50/70 hover:bg-cream-50/10"
            >
              ▸ Replay question
            </button>
          ) : null}
        </div>
      ) : null}

      {mode === 'voice' && !voiceSupported ? (
        <p className="mt-3 rounded-lg border border-blush-500/40 bg-blush-500/5 p-3 text-xs text-cream-50/70">
          Your browser doesn’t support voice input — you can still type every answer below, or open
          this in Chrome for the full spoken experience.
        </p>
      ) : null}

      <div ref={scrollRef} className="mt-6 flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'assistant' ? 'flex justify-start' : 'flex justify-end'}>
            <div className={m.role === 'assistant'
              ? 'max-w-[85%] rounded-2xl rounded-tl-sm bg-ink-700 px-4 py-3 text-sm leading-relaxed text-cream-50'
              : 'max-w-[85%] rounded-2xl rounded-tr-sm bg-gold-500 px-4 py-3 text-sm leading-relaxed text-white'}>
              {m.content}
            </div>
          </div>
        ))}
        {thinking ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-ink-700 px-4 py-3 text-sm text-cream-50/50">
              <span className="inline-flex gap-1"><Dot /> <Dot delay="150ms" /> <Dot delay="300ms" /></span>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="mb-3 text-sm text-blush-500" role="alert">{error}</p> : null}
      {mode === 'voice' && micError ? <p className="mb-3 text-xs text-blush-500" role="alert">{micError}</p> : null}

      {phase === 'prefs' ? (
        <section className="space-y-5 rounded-2xl border border-cream-50/10 bg-ink-700/60 p-5">
          <div>
            <p className="font-display text-lg text-cream-50">Who would you like to meet?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => {
                const active = accepted.includes(g.value);
                return (
                  <button key={g.value} type="button" onClick={() => toggleAccepted(g.value)}
                    className={`rounded-full border px-4 py-2 text-sm transition-all ${active ? 'border-gold-500 bg-gold-500/10 text-cream-50' : 'border-cream-50/20 text-cream-50/70 hover:border-cream-50/40'}`}>
                    {g.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
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

          {/* Photos — required for new members */}
          <div className="border-t border-cream-50/10 pt-5">
            <p className="font-display text-lg text-cream-50">Add your photos</p>
            <p className="mt-1 text-xs text-cream-50/55">Real, recent photos of you. At least one — your matches only ever see these.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {photos.map((p) => (
                <img key={p.id} src={p.url} alt="Your photo" className="h-20 w-20 rounded-lg object-cover ring-1 ring-cream-50/10" />
              ))}
              {photos.length < 6 ? (
                <label className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-cream-50/25 text-cream-50/50 hover:border-gold-500/60 ${uploading ? 'opacity-50' : ''}`}>
                  <span className="text-2xl leading-none">＋</span>
                  <span className="mt-1 text-[10px]">{uploading ? 'Uploading…' : 'Add'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadPhoto(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              ) : null}
            </div>
          </div>

          <Button variant="gold" size="lg" className="w-full" onClick={finalize} disabled={photos.length === 0}>
            Finish &amp; meet my matches
          </Button>
        </section>
      ) : phase === 'finalizing' ? (
        <p className="py-4 text-center text-sm text-cream-50/60">Reading between the lines…</p>
      ) : mode === 'voice' && voiceSupported ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              placeholder={listening ? 'Listening… speak now' : 'Tap the mic and speak, or type…'}
              disabled={thinking || phase === 'loading'}
              className="min-h-[48px] flex-1 resize-none rounded-xl border border-cream-50/15 bg-ink-700 px-4 py-3 text-sm text-cream-50 outline-none focus:border-gold-500/60 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={thinking}
              aria-label={listening ? 'Stop' : 'Speak'}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors ${listening ? 'border-gold-500 bg-gold-500 text-white animate-pulse' : 'border-cream-50/20 text-cream-50/70 hover:border-gold-500/60'}`}
            >
              <MicIcon />
            </button>
          </div>
          <Button variant="gold" size="lg" onClick={() => void submitAnswer(input)} disabled={thinking || !input.trim()}>
            {awaitingFinal ? 'Send & wrap up' : 'Send'}
          </Button>
        </div>
      ) : (
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitAnswer(input); } }}
            rows={1}
            placeholder={awaitingFinal ? 'Your answer, then we wrap up…' : 'Type your reply…'}
            disabled={thinking || phase === 'loading'}
            className="min-h-[48px] flex-1 resize-none rounded-xl border border-cream-50/15 bg-ink-700 px-4 py-3 text-sm text-cream-50 outline-none focus:border-gold-500/60 disabled:opacity-50"
          />
          <Button variant="gold" size="lg" onClick={() => void submitAnswer(input)} disabled={thinking || !input.trim()}>Send</Button>
        </div>
      )}
    </main>
  );
}

function Dot({ delay = '0ms' }: { delay?: string }) {
  return <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-cream-50/40" style={{ animationDelay: delay }} />;
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

const numCls = 'rounded-md border border-cream-50/15 bg-ink-700 px-4 py-3 text-cream-50 outline-none focus:border-gold-500/60';
