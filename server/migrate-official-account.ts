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
      bio: "Official ToyX account.\n\nExample listings, platform updates, safety guidance and community announcements.\n\nThis account is not available for exchanges or direct messaging.",
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
      description: "A set of 5 space-themed action figures with interchangeable accessories. Includes astronaut, alien, rocket ship, lunar rover, and mission control base.\n\nThese figures are in like-new condition — displayed on a shelf but never played with roughly. All accessories are included and accounted for.\n\n📸 Photography tip: Take clear photos showing all items together in natural lighting. Include a close-up of any accessories or special features.\n\n✍️ Description tip: Be specific about what's included, the condition of each item, and why another family would love this toy.",
      category: "Action Figures",
      ageGroup: "3-5 years",
      condition: "Like New",
      location: "Cape Town, Western Cape",
      imageUrls: ["/assets/official/space-explorer-1.png", "/assets/official/space-explorer-2.png"],
      lookingForCategories: ["Action Figures", "Building"],
      lookingForDetails: "Looking for similar action figure sets or building toys that encourage imaginative play. Open to other space-themed toys.",
    },
    {
      name: "Montessori Wooden Number Puzzle",
      description: "A beautiful wooden number puzzle designed to help children learn counting and number recognition. Made from sustainable rubberwood with non-toxic paints.\n\nEach number 0-9 fits into its own shaped slot. Includes counting dots under each piece for self-correction.\n\n📸 Photography tip: Capture the puzzle assembled and with a few pieces removed to show the slots. Include a photo of the back or any labels showing materials.\n\n✍️ Description tip: Explain the educational value, materials used, and what skills your child developed with this toy. Parents appreciate knowing why a toy is special.",
      category: "Educational",
      ageGroup: "2-4 years",
      condition: "Excellent",
      location: "Johannesburg, Gauteng",
      imageUrls: ["/assets/official/montessori-puzzle-1.png"],
      lookingForCategories: ["Educational", "Board Games"],
      lookingForDetails: "Looking for other Montessori-style toys, early learning puzzles, or educational board games for ages 2-4.",
    },
    {
      name: "Family Game Night Collection",
      description: "A collection of 3 family-friendly board games perfect for ages 6 and up:\n\n1. Wildlife Adventure — a cooperative game where players work together to rescue animals\n2. Rainbow Road — a colourful strategy game about building paths\n3. Storytime Theatre — a creative storytelling game with picture cards\n\nAll games have been well cared for. Boxes are intact with all pieces present. Rules included.\n\n📸 Photography tip: Lay all games out together to show it's a bundle. Open one box to show the components are complete and well organised.\n\n✍️ Description tip: Bundles create more value! Describe each item separately so families can see exactly what they're getting. Mention that all pieces are accounted for.",
      category: "Board Games",
      ageGroup: "6-8 years",
      condition: "Good",
      location: "Durban, KwaZulu-Natal",
      imageUrls: ["/assets/official/family-games-1.png", "/assets/official/family-games-2.png"],
      lookingForCategories: ["Board Games", "Educational", "Outdoor"],
      lookingForDetails: "Looking for family board games suitable for ages 6-10. Also interested in outdoor games or educational activity sets.",
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
      // Backfill image URLs for existing rows that have empty images
      if (existingToy.length > 0 && ex.imageUrls && ex.imageUrls.length > 0) {
        const current = existingToy[0];
        const urls: any[] = (current.imageUrls || []) as any[];
        if (!urls.length || (urls.length === 1 && (!urls[0] || urls[0] === ''))) {
          await db.update(toys).set({ imageUrls: ex.imageUrls, updatedAt: new Date() })
            .where(eq(toys.id, current.id));
          console.log(`[migrate-official-account] Backfilled images for: "${ex.name}"`);
        }
      }
    }
  }

  console.log("[migrate-official-account] Done.");
}

main().catch(console.error);
