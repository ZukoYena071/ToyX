import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const OFFICIAL_USER_ID = "official_toyx";

async function main() {
  const { db } = await import("./db");
  const { users, toys } = await import("@shared/schema");
  const { sql, eq } = await import("drizzle-orm");

  // 1. Add account_type column if not exists (idempotent)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(32) NOT NULL DEFAULT 'standard';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);
  console.log("[migrate-official-account] account_type column ensured.");

  // 2. Upsert ToyX Official account
  const existing = await db.select().from(users).where(eq(users.id, OFFICIAL_USER_ID)).limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({
      id: OFFICIAL_USER_ID,
      email: "official@toyxchange.online",
      firstName: "ToyX Official",
      lastName: "",
      profileImageUrl: "/toyx-logo.png",
      bio: "Official ToyX account. Example listings, platform updates, safety guidance and community announcements. This account is not available for exchanges or direct messaging.",
      location: "South Africa",
      accountType: "official",
      isAdmin: false,
      accessStatus: "live",
      hasPassword: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("[migrate-official-account] Official account created.");
  } else {
    await db.update(users).set({ accountType: "official", accessStatus: "live" }).where(eq(users.id, OFFICIAL_USER_ID));
    console.log("[migrate-official-account] Official account updated.");
  }

  // 3. Create 3 example listings (idempotent — check by ownerId + name)
  const examples = [
    {
      name: "Space Explorer Action Figure Set",
      description: "A set of 5 space-themed action figures with interchangeable accessories. Includes astronaut, alien, rocket ship, lunar rover, and mission control base.\n\nThese figures are in like-new condition — displayed on a shelf but never played with roughly. All accessories are included and accounted for.\n\n**Why this is a great listing:**\n- Clear, descriptive title with item type and quantity\n- Detailed description covering condition, contents, and what's included\n- High-quality photo showing all items together",
      category: "Action Figures",
      ageGroup: "3-5 years",
      condition: "Like New",
      location: "Cape Town, Western Cape",
      imageUrls: [],
    },
    {
      name: "Montessori Wooden Number Puzzle",
      description: "A beautiful wooden number puzzle designed to help children learn counting and number recognition. Made from sustainable rubberwood with non-toxic paints.\n\nEach number 0-9 fits into its own shaped slot. Includes counting dots under each piece for self-correction.\n\n**Why this is a great listing:**\n- Educational value clearly explained\n- Materials and safety information provided\n- Age-appropriate and skill-focused description\n- Condition accurately described",
      category: "Educational",
      ageGroup: "2-4 years",
      condition: "Excellent",
      location: "Johannesburg, Gauteng",
      imageUrls: [],
    },
    {
      name: "Family Game Night Collection",
      description: "A collection of 3 family-friendly board games perfect for ages 6 and up:\n\n1. Wildlife Adventure — a cooperative game where players work together to rescue animals\n2. Rainbow Road — a colourful strategy game about building paths\n3. Storytime Theatre — a creative storytelling game with picture cards\n\nAll games have been well cared for. Boxes are intact with all pieces present. Rules included.\n\n**Why this is a great listing:**\n- Bundle creates more value for the receiving family\n- Each game's play style described to help parents decide\n- Condition of boxes and pieces honestly stated\n- Age range clearly communicated",
      category: "Board Games",
      ageGroup: "6-8 years",
      condition: "Good",
      location: "Durban, KwaZulu-Natal",
      imageUrls: [],
    },
  ];

  for (const ex of examples) {
    const existingToy = await db.select().from(toys)
      .where(sql`${toys.ownerId} = ${OFFICIAL_USER_ID} AND ${toys.name} = ${ex.name}`)
      .limit(1);
    if (existingToy.length === 0) {
      await db.insert(toys).values({
        ...ex,
        ownerId: OFFICIAL_USER_ID,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`[migrate-official-account] Created example: "${ex.name}"`);
    } else {
      console.log(`[migrate-official-account] Example already exists: "${ex.name}"`);
    }
  }

  console.log("[migrate-official-account] Done.");
}

main().catch(console.error);
