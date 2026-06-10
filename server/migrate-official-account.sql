-- ToyX Official Account + Example Listings
-- Run against staging database. Idempotent — safe to run multiple times.

BEGIN;

-- 1. Add account_type column (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(32) NOT NULL DEFAULT 'standard';

-- 2. Upsert ToyX Official account
INSERT INTO users (
  id, email, first_name, last_name, profile_image_url, bio, location,
  account_type, is_admin, access_status, has_password, created_at, updated_at
) VALUES (
  'official_toyx',
  'official@toyxchange.online',
  'ToyX Official',
  '',
  '/toyx-logo.png',
  'Official ToyX account.

Example listings, platform updates, safety guidance and community announcements.

This account is not available for exchanges or direct messaging.',
  'South Africa',
  'official',
  false,
  'live',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  account_type = 'official',
  access_status = 'live',
  updated_at = NOW();

-- 3. Create example listings (idempotent — skip if owner_id + name already exists)

INSERT INTO toys (
  owner_id, name, description, category, age_group, condition,
  location, image_urls, looking_for_categories, looking_for_details,
  is_available, created_at, updated_at
)
SELECT
  'official_toyx',
  'Space Explorer Action Figure Set',
  E'A set of 5 space-themed action figures with interchangeable accessories. Includes astronaut, alien, rocket ship, lunar rover, and mission control base.\n\nThese figures are in like-new condition — displayed on a shelf but never played with roughly. All accessories are included and accounted for.\n\n📸 Photography tip: Take clear photos showing all items together in natural lighting. Include a close-up of any accessories or special features.\n\n✍️ Description tip: Be specific about what''s included, the condition of each item, and why another family would love this toy.',
  'Action Figures',
  '3-5 years',
  'Like New',
  'Cape Town, Western Cape',
  ARRAY[]::text[],
  ARRAY['Action Figures', 'Building'],
  'Looking for similar action figure sets or building toys that encourage imaginative play. Open to other space-themed toys.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM toys WHERE owner_id = 'official_toyx' AND name = 'Space Explorer Action Figure Set'
);

INSERT INTO toys (
  owner_id, name, description, category, age_group, condition,
  location, image_urls, looking_for_categories, looking_for_details,
  is_available, created_at, updated_at
)
SELECT
  'official_toyx',
  'Montessori Wooden Number Puzzle',
  E'A beautiful wooden number puzzle designed to help children learn counting and number recognition. Made from sustainable rubberwood with non-toxic paints.\n\nEach number 0-9 fits into its own shaped slot. Includes counting dots under each piece for self-correction.\n\n📸 Photography tip: Capture the puzzle assembled and with a few pieces removed to show the slots. Include a photo of the back or any labels showing materials.\n\n✍️ Description tip: Explain the educational value, materials used, and what skills your child developed with this toy. Parents appreciate knowing why a toy is special.',
  'Educational',
  '2-4 years',
  'Excellent',
  'Johannesburg, Gauteng',
  ARRAY[]::text[],
  ARRAY['Educational', 'Board Games'],
  'Looking for other Montessori-style toys, early learning puzzles, or educational board games for ages 2-4.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM toys WHERE owner_id = 'official_toyx' AND name = 'Montessori Wooden Number Puzzle'
);

INSERT INTO toys (
  owner_id, name, description, category, age_group, condition,
  location, image_urls, looking_for_categories, looking_for_details,
  is_available, created_at, updated_at
)
SELECT
  'official_toyx',
  'Family Game Night Collection',
  E'A collection of 3 family-friendly board games perfect for ages 6 and up:\n\n1. Wildlife Adventure — a cooperative game where players work together to rescue animals\n2. Rainbow Road — a colourful strategy game about building paths\n3. Storytime Theatre — a creative storytelling game with picture cards\n\nAll games have been well cared for. Boxes are intact with all pieces present. Rules included.\n\n📸 Photography tip: Lay all games out together to show it''s a bundle. Open one box to show the components are complete and well organised.\n\n✍️ Description tip: Bundles create more value! Describe each item separately so families can see exactly what they''re getting. Mention that all pieces are accounted for.',
  'Board Games',
  '6-8 years',
  'Good',
  'Durban, KwaZulu-Natal',
  ARRAY[]::text[],
  ARRAY['Board Games', 'Educational', 'Outdoor'],
  'Looking for family board games suitable for ages 6-10. Also interested in outdoor games or educational activity sets.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM toys WHERE owner_id = 'official_toyx' AND name = 'Family Game Night Collection'
);

COMMIT;
