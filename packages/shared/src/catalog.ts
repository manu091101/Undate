// Curated catalogs for profile pickers. Keep these short and deliberate , 
// Hinge's interest list ran to ~500 tags and degraded quickly. We choose
// a smaller, more dignified set.

export const INTERESTS = [
  // Outdoors / movement
  'Running', 'Hiking', 'Yoga', 'Pilates', 'Climbing', 'Tennis', 'Cycling',
  'Surfing', 'Padel', 'Swimming', 'Dancing', 'Football',
  // Mind and culture
  'Reading', 'Writing', 'Poetry', 'Cinema', 'Theatre', 'Architecture',
  'Design', 'Photography', 'Painting', 'Museums', 'Philosophy',
  // Food and drink
  'Cooking', 'Baking', 'Wine', 'Coffee', 'Whiskey', 'Tea ceremony',
  'Specialty food', 'Hosting dinners',
  // Music
  'Jazz', 'Classical music', 'Indie music', 'Live music', 'Vinyl',
  // Travel and curiosity
  'Slow travel', 'Languages', 'Road trips', 'Camping', 'City walks',
  // Tech and craft
  'Tinkering', 'Founders & startups', 'Open source', 'Tabletop games',
  // Quieter
  'Meditation', 'Journaling', 'Long walks', 'Spa days', 'Cold plunges',
] as const;

export const LANGUAGES = [
  'English', 'Mandarin', 'Hindi', 'Tamil', 'Malay', 'Cantonese', 'Hokkien',
  'Bengali', 'Marathi', 'Gujarati', 'Telugu', 'Kannada', 'Punjabi',
  'Japanese', 'Korean', 'French', 'Spanish', 'German', 'Italian',
  'Portuguese', 'Arabic', 'Indonesian', 'Vietnamese', 'Thai',
] as const;

export const LIFESTYLE_OPTIONS = {
  drinking: ['NEVER', 'SOCIALLY', 'REGULARLY', 'PREFER_NOT_SAY'] as const,
  smoking: ['NEVER', 'SOCIALLY', 'REGULARLY', 'PREFER_NOT_SAY'] as const,
  exercise: ['NEVER', 'SOMETIMES', 'OFTEN', 'DAILY'] as const,
  diet: ['OMNIVORE', 'PESCATARIAN', 'VEGETARIAN', 'VEGAN', 'HALAL', 'KOSHER', 'OTHER'] as const,
} as const;

export type Interest = (typeof INTERESTS)[number];
export type Language = (typeof LANGUAGES)[number];

export const LIFESTYLE_LABELS = {
  drinking: { NEVER: 'Doesn\'t drink', SOCIALLY: 'Drinks socially', REGULARLY: 'Drinks often', PREFER_NOT_SAY: 'Prefer not to say' },
  smoking: { NEVER: 'Doesn\'t smoke', SOCIALLY: 'Socially', REGULARLY: 'Regularly', PREFER_NOT_SAY: 'Prefer not to say' },
  exercise: { NEVER: 'Rarely exercises', SOMETIMES: 'Sometimes', OFTEN: 'Often', DAILY: 'Daily' },
  diet: { OMNIVORE: 'Omnivore', PESCATARIAN: 'Pescatarian', VEGETARIAN: 'Vegetarian', VEGAN: 'Vegan', HALAL: 'Halal', KOSHER: 'Kosher', OTHER: 'Other' },
} as const;
