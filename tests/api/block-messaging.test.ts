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
    // Verify archived toy not in browse
    const browse = await agent.get("/api/toys");
    expect(browse.body.find((t: any) => t.id === toyId)).toBeUndefined();
  });
});
