import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

const BASE = "http://localhost:3001";

async function clearUserToys(agent: request.SuperAgentTest) {
  for (const uid of ["seed_user_1", "seed_user_2"]) {
    const existing = await agent.get(`/api/users/${uid}/toys`);
    for (const t of (existing.body || [])) {
      await agent.delete(`/api/toys/${t.id}`).catch(() => {});
    }
  }
}

describe("Exchange read tracking", () => {
  let agent: request.SuperAgentTest;
  let toyId: number;
  let exchangeId: number;

  beforeAll(async () => {
    agent = request.agent(BASE);
    // Create a toy for seed_user_1 to own
    await agent.get("/api/dev/login/seed_user_1");
    const t1 = await agent.get("/api/users/seed_user_1/toys");
    for (const t of (t1.body || [])) { await agent.delete(`/api/toys/${t.id}`).catch(() => {}); }
    const toyRes = await agent.post("/api/toys").send({
      name: "Trade Toy",
      category: "Blocks",
      ageGroup: "3-5",
      condition: "New",
      imageUrls: ["data:image/svg+xml,<svg></svg>"],
      description: "A toy for testing exchange read tracking.",
    });
    if (toyRes.status !== 201) {
      console.warn("Could not create test toy, skipping suite");
      return;
    }
    toyId = toyRes.body.id;
  });

  it("creates an exchange from requester to owner", async () => {
    await agent.get("/api/dev/login/seed_user_2");
    await clearUserToys(agent);
    const res = await agent.post("/api/exchanges").send({ toyId, requestMessage: "Can we swap?" });
    expect(res.status).toBe(201);
    exchangeId = res.body.id;
  });

  it("shows as unread for the owner (seed_user_1)", async () => {
    await agent.get("/api/dev/login/seed_user_1");
    const res = await agent.get("/api/exchanges");
    const ex = res.body.find((e: any) => e.id === exchangeId);
    expect(ex).toBeDefined();
    expect(ex.hasUnread).toBe(true);
  });

  it("marks as read when owner views the exchange", async () => {
    const readRes = await agent.post(`/api/exchanges/${exchangeId}/read`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.ok).toBe(true);
  });

  it("shows as read after marking", async () => {
    const res = await agent.get("/api/exchanges");
    const ex = res.body.find((e: any) => e.id === exchangeId);
    expect(ex).toBeDefined();
    console.log("DEBUG hasUnread:", ex.hasUnread, "ownerLastReadAt:", ex.ownerLastReadAt, "msgs:", ex.messages?.length);
    expect(ex.hasUnread).toBe(false);
  });
});
