-- Demo seed for Undate CF (password for all: undate-demo-2026)
-- password_hash is PBKDF2-SHA256 base64: salt(16b)+iter(4b BE)+hash(32b) encoded as undate$v1$...
-- Generated at deploy time by seed script; placeholders replaced if empty.

INSERT OR IGNORE INTO users (
  id, email, password_hash, display_name, status, is_admin, region, city, age, gender,
  relationship_goal, attachment, wants_kids, communication_style, mbti,
  openness, conscientiousness, extraversion, agreeableness, neuroticism, bio, photo_url
) VALUES
(
  'u_admin_founder',
  'founder@undate.local',
  'undate$v1$V7ufA5qQr07XCyS5LItpSQABhqD9aI4vyLEjtbIwUUdsqEEkeao_GifwzC6JbRu73p9ZNg',
  'Aanya',
  'ACTIVE',
  1,
  'SG',
  'Singapore',
  29,
  'WOMAN',
  'LIFE_PARTNER',
  'SECURE',
  'OPEN',
  'REFLECTIVE',
  'INFJ',
  0.78, 0.72, 0.45, 0.82, 0.28,
  'Founder-curator. Calm nights, long walks, deliberate people.',
  'https://i.pravatar.cc/600?u=founder-undate'
),
(
  'u_member_priya',
  'priya@undate.local',
  'undate$v1$V7ufA5qQr07XCyS5LItpSQABhqD9aI4vyLEjtbIwUUdsqEEkeao_GifwzC6JbRu73p9ZNg',
  'Priya',
  'ACTIVE',
  0,
  'SG',
  'Singapore',
  28,
  'WOMAN',
  'SERIOUS_DATING',
  'SECURE',
  'YES',
  'GENTLE',
  'ENFJ',
  0.7, 0.68, 0.62, 0.8, 0.35,
  'Product designer. Soft humour, strong opinions on noodles.',
  'https://i.pravatar.cc/600?u=priya-undate'
),
(
  'u_member_james',
  'james@undate.local',
  'undate$v1$V7ufA5qQr07XCyS5LItpSQABhqD9aI4vyLEjtbIwUUdsqEEkeao_GifwzC6JbRu73p9ZNg',
  'James',
  'ACTIVE',
  0,
  'SG',
  'Singapore',
  31,
  'MAN',
  'SERIOUS_DATING',
  'SECURE',
  'OPEN',
  'PLAYFUL',
  'ENTP',
  0.75, 0.55, 0.7, 0.65, 0.3,
  'Engineer who cooks too much on weekends.',
  'https://i.pravatar.cc/600?u=james-undate'
),
(
  'u_member_mei',
  'mei@undate.local',
  'undate$v1$V7ufA5qQr07XCyS5LItpSQABhqD9aI4vyLEjtbIwUUdsqEEkeao_GifwzC6JbRu73p9ZNg',
  'Mei',
  'ACTIVE',
  0,
  'SG',
  'Singapore',
  27,
  'WOMAN',
  'LIFE_PARTNER',
  'ANXIOUS',
  'YES',
  'REFLECTIVE',
  'INFP',
  0.85, 0.6, 0.4, 0.78, 0.55,
  'Writer. Slow mornings and bookshop afternoons.',
  'https://i.pravatar.cc/600?u=mei-undate'
),
(
  'u_member_arjun',
  'arjun@undate.local',
  'undate$v1$V7ufA5qQr07XCyS5LItpSQABhqD9aI4vyLEjtbIwUUdsqEEkeao_GifwzC6JbRu73p9ZNg',
  'Arjun',
  'ACTIVE',
  0,
  'IN',
  'Mumbai',
  30,
  'MAN',
  'MARRIAGE',
  'SECURE',
  'YES',
  'DIRECT',
  'ISTJ',
  0.55, 0.8, 0.5, 0.7, 0.25,
  'Lawyer. Family dinners, cricket, and early flights.',
  'https://i.pravatar.cc/600?u=arjun-undate'
);

INSERT OR IGNORE INTO waitlist (id, email, city, region, referral_code, status)
VALUES
  ('w_beta_1', 'beta@undate.local', 'Mumbai', 'IN', 'UNDATE-BETA', 'WAITING'),
  ('w_beta_2', 'hello@example.com', 'Singapore', 'SG', NULL, 'WAITING');
