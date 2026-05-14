import "dotenv/config";
import { db } from "./db";
import {
  users,
  toys,
  exchanges,
  messages,
  favorites,
  reviews,
  toyInteractions,
} from "@shared/schema";
import { and, eq, inArray, gte, lt, sql, or } from "drizzle-orm";

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function picsum(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/700`;
}

const FALLBACK_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%25' height='100%25' fill='%23ddd'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='24'>ToyX</text></svg>";

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

const TOYS = [
  { name: "LEGO Classic Creative Bricks 11005", category: "Building Blocks", ageGroup: "4-7", condition: "Good", desc: "Complete set with 900+ pieces including special wheel bricks and windows. Some minor wear on the box but all pieces are present. My son has moved on to more advanced sets. Includes the original instruction booklet." },
  { name: "VTech Touch & Learn Activity Desk", category: "Educational", ageGroup: "2-5", condition: "Like New", desc: "Interactive desk with 5 activity pages and lots of buttons. Only used for a few months. Comes with the stool and all original accessories. Requires 3 AA batteries (not included but easy to find)." },
  { name: "Barbie Dreamhouse 2024 Edition", category: "Dolls", ageGroup: "3-8", condition: "Fair", desc: "Three-storey dollhouse with working elevator, pool, and 8 rooms. A few stickers have peeled off but everything else works perfectly. Missing 2 small accessory pieces. My daughter played with this for 2 years and it still provides hours of fun." },
  { name: "Ravensburger 100pc Safari Puzzle", category: "Puzzles", ageGroup: "5-7", condition: "Like New", desc: "Beautifully illustrated animal puzzle. All 100 pieces are present and accounted for. Completed twice and then carefully put back in the box. Great for a rainy afternoon." },
  { name: "Hot Wheels 20-Car Pack", category: "Cars & Vehicles", ageGroup: "3-10", condition: "Good", desc: "Collection of 20 die-cast cars including a few rare finds. Some have minor paint scuffs from play but all roll perfectly. Includes a mix of sports cars, trucks, and emergency vehicles." },
  { name: "Fisher-Price Kick & Play Piano Gym", category: "Baby Toys", ageGroup: "0-2", condition: "Excellent", desc: "Gentle used play gym with musical kick piano. The mat has been wiped clean and the piano still plays every note. Great for tummy time and sensory development. Easy to wipe down." },
  { name: "Monopoly Junior Board Game", category: "Board Games", ageGroup: "5-8", condition: "Good", desc: "SA edition with local properties like Table Mountain and the V&A Waterfront. All money, cards, and pieces included. Box has some shelf wear but game components are in great shape." },
  { name: "Crayola Inspiration Art Case", category: "Arts & Crafts", ageGroup: "4-10", condition: "Like New", desc: "Art set with 140 pieces including crayons, markers, colouring pencils, and paper. Only used a handful of times. Everything is neatly organised in the carrying case. Perfect for creative kids." },
  { name: "Giant Teddy Bear 1.2m Plush", category: "Plush Toys", ageGroup: "0-12", condition: "Excellent", desc: "Extra-large soft teddy bear, 1.2m tall. Has been gently loved but still in beautiful condition. Washed and ready for a new home. Makes a wonderful reading buddy or bedroom decoration." },
  { name: "Nerf Elite 2.0 Eaglepoint RD-8", category: "Outdoor & Active", ageGroup: "8-14", condition: "Good", desc: "Motorised blaster with 8-dart rotating drum, includes 12 official Nerf darts. Slight scuff on the barrel from play. Works perfectly and provides hours of active fun." },
  { name: "Wooden Train Set 60-Piece", category: "Building Blocks", ageGroup: "2-5", condition: "Good", desc: "Classic wooden train set with tracks, bridge, train engine, and cargo cars. All pieces are in good condition with no chipping. Compatible with other major wooden train brands." },
  { name: "Soccer Ball Size 4 (Replica)", category: "Outdoor & Active", ageGroup: "6-12", condition: "Like New", desc: "High-quality replica soccer ball, size 4 (junior). Barely used — only kicked around a few times at the park. Still has excellent grip and inflation. Great for little football fans." },
  { name: "My First Science Kit 30+ Experiments", category: "Educational", ageGroup: "6-10", condition: "Fair", desc: "Science kit with 30 experiments including volcano, crystal growing, and slime. Some chemical packets have been used but most are still sealed. All equipment (test tubes, goggles, etc.) is present." },
  { name: "Baby Einstein Take-Along Tunes", category: "Baby Toys", ageGroup: "0-2", condition: "Excellent", desc: "Musical toy with 7 classical melodies and a light-up screen. Perfect for nappy changes and car rides. Volume is adjustable. Batteries included and working. Easy to clip onto a pram or bag." },
  { name: "Headu Montessori Touch ABC", category: "Educational", ageGroup: "3-6", condition: "Like New", desc: "Montessori-style letter recognition game with tactile cards. Cards are in perfect condition, no tears or creases. A proven way to introduce letters through sensory play." },
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
    await db.delete(toyInteractions).where(inArray(toyInteractions.toyId, seedToyIds));
    await db.delete(favorites).where(inArray(favorites.toyId, seedToyIds));
    await db.delete(toys).where(inArray(toys.id, seedToyIds));
  }

  await db.delete(favorites).where(inArray(favorites.userId, seedUserIds));
  await db.delete(toyInteractions).where(inArray(toyInteractions.userId, seedUserIds));
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

  // Create 15 curated, realistic toys distributed across users
  const toyRows: any[] = [];
  let toyCounter = 0;
  const IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%25' height='100%25' fill='%23ddd'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='24'>ToyX</text></svg>";

  for (const u of seedUsers) {
    const loc = ZA_LOCATIONS.find(l => l.label === u.location) ?? pick(ZA_LOCATIONS);
    const userToys = TOYS.slice(toyCounter, toyCounter + 3);

    for (const t of userToys) {
      toyCounter++;
      toyRows.push({
        name: t.name,
        description: t.desc,
        category: t.category,
        ageGroup: t.ageGroup,
        condition: t.condition,
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
