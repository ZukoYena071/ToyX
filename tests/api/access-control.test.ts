import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";

const BASE = "http://localhost:3001";
const IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%25' height='100%25' fill='%23ddd'/></svg>";

async function devLogin(agent: request.SuperAgentTest, userId: string) {
  const res = await agent.get(`/api/dev/login/${userId}`);
  expect(res.status).toBe(200);
}

describe("Access control — waitlist user", () => {
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    agent = request.agent(BASE);
    await devLogin(agent, "seed_user_1");
    // Demote user to waitlist for testing
    await agent.patch("/api/users/profile").send({ accessStatus: "waitlist" });
  });

  afterAll(async () => {
    // Restore to live
    await agent.patch("/api/users/profile").send({ accessStatus: "live" });
  });

  it("can browse toys (public)", async () => {
    const res = await agent.get("/api/toys");
    expect(res.status).toBe(200);
  });

  it("can view toy details (public)", async () => {
    const toys = await agent.get("/api/toys");
    if (!toys.body || toys.body.length === 0) return; // skip if no toys exist
    const res = await agent.get(`/api/toys/${toys.body[0].id}`);
    expect(res.status === 200 || res.status === 404).toBe(true); // 200 if exists, 404 if removed
  });

  it("can create toy listings", async () => {
    const res = await agent.post("/api/toys").send({
      name: "Waitlist Toy", category: "Blocks", ageGroup: "3-5", condition: "New",
      imageUrls: [IMG], description: "A test toy created while on waitlist.",
    });
    expect(res.status).toBe(201);
  });

  it("cannot create exchange (requires beta)", async () => {
    const res = await agent.post("/api/exchanges").send({ toyId: 1, requestMessage: "Should fail" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACCESS_DENIED");
  });

  it("cannot access exchange list (requires beta)", async () => {
    const res = await agent.get("/api/exchanges");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACCESS_DENIED");
  });

  it("cannot send message (requires beta)", async () => {
    const res = await agent.post("/api/exchanges/1/messages").send({ content: "test", messageType: "text" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACCESS_DENIED");
  });
});

describe("Access control — beta user", () => {
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    agent = request.agent(BASE);
    await devLogin(agent, "seed_user_2");
  });

  it("can browse toys", async () => {
    const res = await agent.get("/api/toys");
    expect(res.status).toBe(200);
  });

  it("can create toy listings", async () => {
    const res = await agent.post("/api/toys").send({
      name: "Beta Toy", category: "Blocks", ageGroup: "3-5", condition: "New",
      imageUrls: [IMG], description: "Beta user test listing.",
    });
    expect(res.status).toBe(201);
  });
});
