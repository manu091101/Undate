// Lumin's curated prompt library. Hinge-style: each member picks 3 prompts
// and writes their answer (≤280 chars). Surfaced on profile + match card +
// usable as the anchor for an opener message ("comment on a prompt").
//
// Tone guidance: literate, considered, slightly dry. We deliberately avoid
// the over-cute Bumble vibe and the lazy "two truths and a lie" cliche.

export interface Prompt {
  key: string;
  text: string;
  /** UI category used to group the picker. */
  category: 'story' | 'value' | 'vision' | 'sense_of_humor' | 'preference';
}

export const PROMPTS: Prompt[] = [
  // — Stories and tells —
  { key: 'recent_obsession',  text: 'A recent obsession of mine is…',                       category: 'story' },
  { key: 'best_travel',       text: 'The trip I won\'t shut up about…',                    category: 'story' },
  { key: 'small_pleasure',    text: 'A small pleasure I refuse to give up…',               category: 'story' },
  { key: 'unusual_skill',     text: 'I have an unreasonable skill at…',                    category: 'story' },
  { key: 'changed_my_mind',   text: 'Something I changed my mind about this year…',        category: 'story' },
  { key: 'most_proud',        text: 'What I\'m most proud of right now…',                  category: 'story' },

  // — Values and how I show up —
  { key: 'fight_about',       text: 'The thing I will gently fight you about…',            category: 'value' },
  { key: 'kindness_means',    text: 'In a relationship, kindness looks like…',             category: 'value' },
  { key: 'apologize_with',    text: 'My way of apologising is…',                           category: 'value' },
  { key: 'rest_looks_like',   text: 'Rest, for me, looks like…',                           category: 'value' },
  { key: 'family_to_me',      text: 'Family, to me, is…',                                   category: 'value' },

  // — Vision and what I'm building toward —
  { key: 'five_years',        text: 'Five years from now, ideally…',                       category: 'vision' },
  { key: 'date_with_me',      text: 'A perfect first date is…',                            category: 'vision' },
  { key: 'sunday_morning',    text: 'A Sunday morning with me looks like…',                category: 'vision' },
  { key: 'looking_for',       text: 'I\'m looking for someone who…',                       category: 'vision' },
  { key: 'unromantic_thing',  text: 'The unromantic thing I find romantic…',               category: 'vision' },

  // — Humor —
  { key: 'green_flag',        text: 'A green flag for me is…',                             category: 'sense_of_humor' },
  { key: 'mock_yourself',     text: 'You should know that I am completely useless at…',    category: 'sense_of_humor' },
  { key: 'unsolicited_take',  text: 'My unsolicited dinner-party take is…',                category: 'sense_of_humor' },
  { key: 'this_or_that',      text: 'This or that I refuse to settle on…',                 category: 'sense_of_humor' },

  // — Preferences (light) —
  { key: 'comfort_meal',      text: 'My comfort meal is…',                                 category: 'preference' },
  { key: 'reread',            text: 'The book I keep re-reading is…',                      category: 'preference' },
  { key: 'song_for_the_room', text: 'A song that fills the room is…',                      category: 'preference' },
  { key: 'place_in_city',     text: 'My favourite place in my city is…',                   category: 'preference' },
];

export function getPrompt(key: string): Prompt | undefined {
  return PROMPTS.find((p) => p.key === key);
}
