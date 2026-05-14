import "dotenv/config";
import { db } from "./db";
import {
  users,
  toys,
  exchanges,
  messages,
  favorites,
  reviews,
} from "@shared/schema";
import { and, eq, inArray, gte, lt, sql, or } from "drizzle-orm";

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function picsum(seed: string) {
  // Public placeholder images
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/700`;
}

const ZA_LOCATIONS = [
  { label: "Cape Town, Western Cape", lat: -33.9249, lng: 18.4241 },
  { label: "Johannesburg, Gauteng", lat: -26.2041, lng: 28.0473 },
  { label: "Pretoria, Gauteng", lat: -25.7479, lng: 28.2293 },
  { label: "Durban, KwaZulu-Natal", lat: -29.8587, lng: 31.0218 },
  { label: "Gqeberha (Port Elizabeth), Eastern Cape", lat: -33.9608, lng: 25.6022 },
  { label: "Bloemfontein, Free State", lat: -29.0852, lng: 26.1596 },
];

const FIRST_NAMES = ["Thandi", "Sipho", "Ayesha", "Lerato", "Michael", "Fatima", "Johan", "Naledi"];
const LAST_NAMES = ["Naidoo", "Dlamini", "Van der Merwe", "Mokoena", "Smith", "Jacobs", "Pillay", "Khumalo"];

const CATEGORIES = ["Puzzles", "Dolls", "Cars", "Outdoor", "Books", "Building Blocks", "Board Games", "Plush"];
const AGE_GROUPS = ["0-2", "3-4", "5-7", "8-10", "11-12"];
const CONDITIONS = ["New", "Like New", "Good", "Fair"];

const TOY_NAMES = [
  "Wooden Building Blocks Set",
  "Remote Control Car",
  "Teddy Bear Plush",
  "100-piece Jungle Puzzle",
  "Princess Doll Set",
  "Kids Storybook Bundle",
  "Mini Soccer Ball",
  "Rainbow Stacking Rings",
  "Science Experiment Kit",
  "Classic Board Game",
];

async function clearSeedData() {
  // Only delete data created by this script (ids prefixed with seed_)
  // Order matters because of foreign keys.
  const seedUserIds = (await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.id} LIKE 'seed_%'`)).map(r => r.id);

  if (seedUserIds.length === 0) return;

  // Find toys owned by seed users
  const seedToyIds = (await db
    .select({ id: toys.id })
    .from(toys)
    .where(inArray(toys.ownerId, seedUserIds))).map(r => r.id);

  // Find exchanges involving seed users or seed toys
  const exchangeConditions = [];
  if (seedToyIds.length) {
    exchangeConditions.push(inArray(exchanges.toyId, seedToyIds));
  }
  exchangeConditions.push(inArray(exchanges.requesterId, seedUserIds));
  exchangeConditions.push(inArray(exchanges.ownerId, seedUserIds));
  const seedExchangeIds = (await db
    .select({ id: exchanges.id })
    .from(exchanges)
    .where(or(...exchangeConditions))
  ).map(r => r.id);

  if (seedExchangeIds.length) {
    await db.delete(messages).where(inArray(messages.exchangeId, seedExchangeIds));
    await db.delete(reviews).where(inArray(reviews.exchangeId, seedExchangeIds));
    await db.delete(exchanges).where(inArray(exchanges.id, seedExchangeIds));
  }

  if (seedToyIds.length) {
    await db.delete(favorites).where(inArray(favorites.toyId, seedToyIds));
    await db.delete(toys).where(inArray(toys.id, seedToyIds));
  }

  await db.delete(favorites).where(inArray(favorites.userId, seedUserIds));
  await db.delete(users).where(inArray(users.id, seedUserIds));
}

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed in production.");
  }

  console.log("Seeding ToyX sample data (ZA)…");

  // Optional: clear prior seeded data so you can re-run safely
  await clearSeedData();

  // Create 5 users
  const seedUsers = Array.from({ length: 5 }).map((_, i) => {
    const fn = pick(FIRST_NAMES);
    const ln = pick(LAST_NAMES);
    const loc = pick(ZA_LOCATIONS);
    return {
      id: `seed_user_${i + 1}`,
      email: `seed${i + 1}@toyx.test`,
      firstName: fn,
      lastName: ln,
      profileImageUrl: picsum(`user_${i + 1}`),
      bio: "Seed account for manual QA testing.",
      location: loc.label,
      phone: `+27 82 ${randInt(1000000, 9999999)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  await db.insert(users).values(seedUsers);

  // Create toys: 3–6 toys per user
  const toyRows: any[] = [];
  let toyCounter = 1;

  for (const u of seedUsers) {
    const loc = ZA_LOCATIONS.find(l => l.label === u.location) ?? pick(ZA_LOCATIONS);
    const count = randInt(3, 6);

    for (let t = 0; t < count; t++) {
      const name = pick(TOY_NAMES);
      const category = pick(CATEGORIES);
      const ageGroup = pick(AGE_GROUPS);
      const condition = pick(CONDITIONS);

      toyRows.push({
        name,
        description: `Gently used ${name.toLowerCase()}. Perfect for ages ${ageGroup}.`,
        category,
        ageGroup,
        condition,
        imageUrls: [
          picsum(`toy_${toyCounter}_a`),
          picsum(`toy_${toyCounter}_b`),
        ],
        ownerId: u.id,
        isAvailable: true,
        location: loc.label,
        latitude: loc.lat,
        longitude: loc.lng,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toyCounter++;
    }
  }

  const insertedToys = await db.insert(toys).values(toyRows).returning();

  // OPTIONAL: create a few exchanges + messages so chat screen has data
  // We'll create 3 exchanges between random users.
  const exchangesToCreate: any[] = [];
  for (let i = 0; i < 3; i++) {
    const toy = pick(insertedToys);
    const ownerId = toy.ownerId;

    const requester = pick(seedUsers.filter(u => u.id !== ownerId));
    const status = pick(["pending", "accepted", "completed"]);

    exchangesToCreate.push({
      requesterId: requester.id,
      ownerId,
      toyId: toy.id,
      status,
      requestMessage: "Hi! Would you be open to swapping this toy?",
      requesterConfirmed: status === "completed",
      ownerConfirmed: status === "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const insertedExchanges = await db.insert(exchanges).values(exchangesToCreate).returning();

  // Add a couple messages per exchange
  const messageRows: any[] = [];
  for (const ex of insertedExchanges) {
    messageRows.push({
      exchangeId: ex.id,
      senderId: ex.requesterId,
      content: "Hello! Interested in swapping. When are you available?",
      messageType: "text",
      createdAt: new Date(),
    });
    messageRows.push({
      exchangeId: ex.id,
      senderId: ex.ownerId,
      content: "Sure! Let's arrange a safe meetup in a public place.",
      messageType: "text",
      createdAt: new Date(),
    });
  }
  await db.insert(messages).values(messageRows);

  // OPTIONAL: favorites
  // Each user favorites 2 random toys not owned by them
  const favRows: any[] = [];
  for (const u of seedUsers) {
    const candidates = insertedToys.filter(t => t.ownerId !== u.id);
    const chosen = Array.from({ length: 2 }).map(() => pick(candidates));
    for (const toy of chosen) {
      favRows.push({
        userId: u.id,
        toyId: toy.id,
        createdAt: new Date(),
      });
    }
  }
  await db.insert(favorites).values(favRows);

  console.log(`Seed complete:
- Users: ${seedUsers.length}
- Toys: ${insertedToys.length}
- Exchanges: ${insertedExchanges.length}
- Messages: ${messageRows.length}
- Favorites: ${favRows.length}`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
