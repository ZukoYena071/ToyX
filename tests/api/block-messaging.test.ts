import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

const BASE = "http://localhost:3001";

async function devLogin(agent: request.SuperAgentTest, userId: string) {
  const res = await agent.get(`/api/dev/login/${userId}`);
  expect(res.status).toBe(200);
}

describe("Block/unblock messaging enforcement", () => {
  let agent: request.SuperAgentTest;

  beforeAll(() => {
    agent = request.agent(BASE);
  });

  it("blocks and unblocks a user via API", async () => {
    await devLogin(agent, "seed_user_1");
    const targetId = "seed_user_2";

    let status = await agent.get(`/api/block/status/${targetId}`);
    expect(status.body.blockedByMe).toBe(false);

    let block = await agent.post(`/api/users/${targetId}/block`);
    expect(block.status).toBe(200);

    status = await agent.get(`/api/block/status/${targetId}`);
    expect(status.body.blockedByMe).toBe(true);

    let unblock = await agent.post(`/api/users/${targetId}/unblock`);
    expect(unblock.status).toBe(200);

    status = await agent.get(`/api/block/status/${targetId}`);
    expect(status.body.blockedByMe).toBe(false);
  });
});

describe("Points boost redeem", () => {
  let agent: request.SuperAgentTest;
  let toyId: number;

  beforeAll(async () => {
    agent = request.agent(BASE);
    await devLogin(agent, "seed_user_1");
    const toyRes = await agent.post("/api/toys").send({
      name: "Boost Test Toy", category: "Blocks", ageGroup: "3-5", condition: "New",
      imageUrls: ["data:image/svg+xml,<svg></svg>"], description: "Test toy for boost testing purposes.",
    });
    if (toyRes.status === 201) toyId = toyRes.body.id;
    // Award enough points for boost tests
    const awardRes = await agent.post("/api/rewards/award-test-points").send({ userId: "seed_user_1", points: 500 });
  });

  it("redeems points boost and sets boostedUntil", async () => {
    if (!toyId) return;
    const res = await agent.post(`/api/toys/${toyId}/boost/redeem`).send({ hours: 48, costPoints: 300 });
    expect(res.status).toBe(200);
    const toy = await agent.get(`/api/toys/${toyId}`);
    expect(toy.status).toBe(200);
    expect(toy.body.boostedUntil).toBeDefined();
  });

  it("enforces max 2 boosted listings", async () => {
    if (!toyId) return;
    const toyRes2 = await agent.post("/api/toys").send({
      name: "Boost Test Toy 2", category: "Blocks", ageGroup: "3-5", condition: "New",
      imageUrls: ["data:image/svg+xml,<svg></svg>"], description: "Second test toy.",
    });
    if (toyRes2.status !== 201) return;
    await agent.post(`/api/toys/${toyRes2.body.id}/boost/redeem`).send({ hours: 48, costPoints: 300 });
    const toyRes3 = await agent.post("/api/toys").send({
      name: "Boost Test Toy 3", category: "Blocks", ageGroup: "3-5", condition: "New",
      imageUrls: ["data:image/svg+xml,<svg></svg>"], description: "Third test toy.",
    });
    if (toyRes3.status !== 201) return;
    const res3 = await agent.post(`/api/toys/${toyRes3.body.id}/boost/redeem`).send({ hours: 48, costPoints: 300 });
    expect(res3.status).toBe(400);
  });
});

describe("User rating endpoint", () => {
  let agent: request.SuperAgentTest;

  beforeAll(() => {
    agent = request.agent(BASE);
  });

  it("returns averageRating for a user", async () => {
    await devLogin(agent, "seed_user_1");
    const res = await agent.get("/api/users/seed_user_1/rating");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("averageRating");
    expect(typeof res.body.averageRating).toBe("number");
  });
});

describe("Archive / unlist / safe delete", () => {
  let agent: request.SuperAgentTest;
  let toyId: number;

  beforeAll(async () => {
    agent = request.agent(BASE);
    await devLogin(agent, "seed_user_1");
    const r = await agent.post("/api/toys").send({ name: "Archive Test", category: "Blocks", ageGroup: "3-5", condition: "New", imageUrls: ["data:image/svg+xml,<svg></svg>"], description: "test" });
    if (r.status === 201) toyId = r.body.id;
  });

  it("unlists an available toy", async () => {
    if (!toyId) return;
    const r = await agent.post(`/api/toys/${toyId}/unlist`);
    expect(r.status).toBe(200);
  });

  it("archives a toy", async () => {
    if (!toyId) return;
    const r = await agent.post(`/api/toys/${toyId}/archive`);
    expect(r.status).toBe(200);
    const browse = await agent.get("/api/toys");
    expect(browse.body.find((t: any) => t.id === toyId)).toBeUndefined();
  });
});

describe("Relist / CanDeletePermanently", () => {
  let agent: request.SuperAgentTest;
  let toyId: number;

  beforeAll(async () => {
    agent = request.agent(BASE);
    await devLogin(agent, "seed_user_1");
    const r = await agent.post("/api/toys").send({ name: "Relist Test", category: "Blocks", ageGroup: "3-5", condition: "New", imageUrls: ["data:image/svg+xml,<svg></svg>"], description: "test" });
    if (r.status === 201) toyId = r.body.id;
  });

  it("relist flips available to true", async () => {
    if (!toyId) return;
    await agent.post(`/api/toys/${toyId}/unlist`);
    let t = await agent.get(`/api/toys/${toyId}`);
    expect(t.body.isAvailable).toBe(false);
    const r = await agent.post(`/api/toys/${toyId}/relist`);
    expect(r.status).toBe(200);
    t = await agent.get(`/api/toys/${toyId}`);
    expect(t.body.isAvailable).toBe(true);
  });

  it("canDeletePermanently is true for toy without exchanges", async () => {
    if (!toyId) return;
    const toys = await agent.get("/api/users/seed_user_1/toys");
    const toy = toys.body.find((t: any) => t.id === toyId);
    expect(toy).toBeDefined();
    expect(toy.canDeletePermanently).toBe(true);
  });
});

describe("Browse ordering — boosted first", () => {
  let agent: request.SuperAgentTest;
  const toyIds: number[] = [];

  beforeAll(async () => {
    agent = request.agent(BASE);
    await devLogin(agent, "seed_user_1");
    await agent.post("/api/rewards/award-test-points").send({ userId: "seed_user_1", points: 600 });
    for (let i = 0; i < 3; i++) {
      const r = await agent.post("/api/toys").send({
        name: `Browse Order ${i}`, category: "Blocks", ageGroup: "3-5", condition: "New",
        imageUrls: ["data:image/svg+xml,<svg></svg>"], description: "Order test toy.",
      });
      if (r.status === 201) toyIds.push(r.body.id);
    }
  });

  it("returns boosted toys before non-boosted, boostedUntil DESC within boosted", async () => {
    if (toyIds.length < 3) return;
    // Boost toyIds[0] with 48h, toyIds[1] with 24h
    await agent.post(`/api/toys/${toyIds[0]}/boost/redeem`).send({ hours: 48, costPoints: 300 });
    await agent.post(`/api/toys/${toyIds[1]}/boost/redeem`).send({ hours: 24, costPoints: 300 });
    const browse = await agent.get("/api/toys");
    const order = browse.body.filter((t: any) => toyIds.includes(t.id)).map((t: any) => t.id);
    // toyIds[0] (boosted 48h) should come before toyIds[1] (boosted 24h), which should come before toyIds[2] (not boosted)
    expect(order.indexOf(toyIds[0])).toBeLessThan(order.indexOf(toyIds[1]));
    expect(order.indexOf(toyIds[1])).toBeLessThan(order.indexOf(toyIds[2]));
  });
});

describe("Wishlist / matches", () => {
  let userA: request.SuperAgentTest;
  let userB: request.SuperAgentTest;

  beforeAll(() => {
    userA = request.agent(BASE);
    userB = request.agent(BASE);
  });

  it("creates toy with lookingFor and returns wishlist", async () => {
    await devLogin(userA, "seed_user_1");
    await userA.post("/api/dev/set-plan").send({ userId: "seed_user_1", plan: "premium_monthly" });
    await devLogin(userB, "seed_user_2");
    await userB.post("/api/dev/set-plan").send({ userId: "seed_user_2", plan: "premium_monthly" });
    const r = await userA.post("/api/toys").send({
      name: "Wishlist A", category: "Blocks", ageGroup: "3-5", condition: "New",
      imageUrls: ["data:image/svg+xml,<svg></svg>"], description: "test",
      lookingForCategories: ["Action Figures"],
      lookingForDetails: "Looking for Marvel figures",
    });
    expect(r.status).toBe(201);
    const wl = await userA.get("/api/me/wishlist");
    expect(wl.body.categories).toContain("Action Figures");
  });

  it("returns match for matched category", async () => {
    // user B creates a toy with category matching user A's wishlist
    await devLogin(userB, "seed_user_2");
    await userB.post("/api/dev/set-plan").send({ userId: "seed_user_2", plan: "premium_monthly" });
    // Clear existing toys for seed_user_2
    const existing = await userB.get("/api/users/seed_user_2/toys");
    for (const t of (existing.body || [])) {
      await userB.delete(`/api/toys/${t.id}`).catch(() => {});
    }
    const r2 = await userB.post("/api/toys").send({
      name: "Toy for A", category: "Action Figures", ageGroup: "3-5", condition: "New",
      imageUrls: ["data:image/svg+xml,<svg></svg>"], description: "A great action figure",
    });
    if (r2.status !== 201) return;
    // user A checks matches
    await devLogin(userA, "seed_user_1");
    const matches = await userA.get("/api/me/matches");
    const matchesList = Array.isArray(matches.body) ? matches.body : [];
    const found = matchesList.find((t: any) => t.id === r2.body.id);
    expect(found).toBeDefined();
    expect(found.category).toBe("Action Figures");
  });
});
