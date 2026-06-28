// Curated onboarding questions. Order in this list = order in the flow.
// Versioned via `questionVersion` in DB; bump version when wording changes.

export type OnboardingQuestion =
  | { key: string; version: number; kind: 'short_text'; prompt: string; maxLen: number }
  | { key: string; version: number; kind: 'long_text'; prompt: string; maxLen: number }
  | { key: string; version: number; kind: 'single_choice'; prompt: string; options: string[] }
  | { key: string; version: number; kind: 'multi_choice'; prompt: string; options: string[]; max: number }
  | { key: string; version: number; kind: 'value_sort'; prompt: string; cards: string[]; pickTop: number }
  | { key: string; version: number; kind: 'slider'; prompt: string; min: number; max: number; step: number; minLabel: string; maxLabel: string }
  | { key: string; version: number; kind: 'voice'; prompt: string; minSec: number; maxSec: number };

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    key: 'looking_for',
    version: 1,
    kind: 'single_choice',
    prompt: 'What brought you to Lumin?',
    options: [
      'A serious relationship',
      'A life partner',
      'I want to date with intention but stay open',
      'Curious — not sure yet',
    ],
  },
  {
    key: 'values_top5',
    version: 1,
    kind: 'value_sort',
    prompt: 'Choose the five that matter most.',
    cards: [
      'Family', 'Career', 'Creativity', 'Adventure', 'Stability', 'Faith',
      'Health', 'Curiosity', 'Honesty', 'Independence', 'Service', 'Humor',
    ],
    pickTop: 5,
  },
  {
    key: 'attachment_signal',
    version: 1,
    kind: 'single_choice',
    prompt: 'When something is wrong, you usually—',
    options: [
      'Want to talk it through quickly',
      'Need space to think before talking',
      'Try to fix it without making a fuss',
      'It depends — I notice it changes',
    ],
  },
  {
    key: 'lifestyle_pace',
    version: 1,
    kind: 'slider',
    prompt: 'Most weeknights you prefer—',
    min: 1,
    max: 7,
    step: 1,
    minLabel: 'Quiet at home',
    maxLabel: 'Out with people',
  },
  {
    key: 'kids',
    version: 1,
    kind: 'single_choice',
    prompt: 'Children?',
    options: ['Already have, want more', 'Already have, no more', 'Want', 'Open', 'No'],
  },
  {
    key: 'voice_intro',
    version: 1,
    kind: 'voice',
    prompt: 'In one minute or less — what are you actually looking for?',
    minSec: 10,
    maxSec: 60,
  },
];
