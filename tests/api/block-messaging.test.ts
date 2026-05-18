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
