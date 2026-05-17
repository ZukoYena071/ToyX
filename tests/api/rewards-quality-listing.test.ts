import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

const BASE = "http://localhost:3001";
const IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%25' height='100%25' fill='%23ddd'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='24'>ToyX</text></svg>";

async function devLogin(agent: request.SuperAgentTest, userId: string) {
  const res = await agent.get(`/api/dev/login/${userId}`);
  expect(res.status).toBe(200);
}

async function clearUserToys(agent: request.SuperAgentTest) {
  const res = await agent.get("/api/users/seed_user_1/toys");
  for (const t of (res.body || [])) {
    await agent.delete(`/api/toys/${t.id}`);
  }
}

describe("Quality listing reward", () => {
  let agent: request.SuperAgentTest;

  beforeAll(() => {
    agent = request.agent(BASE);
  });

  it("does not award points for 1 image + short desc", async () => {
    await devLogin(agent, "seed_user_1");
    await clearUserToys(agent);
    const res = await agent.post("/api/toys").send({
      name: "Test Toy Single Image",
      category: "Building Blocks",
      ageGroup: "3-5",
      condition: "New",
      imageUrls: [IMG],
      description: "Short",
    });
    expect(res.status).toBe(201);
    expect(res.body.reward).toBeDefined();
    expect(res.body.reward.awarded).toBe(false);
    expect(res.body.reward.points).toBe(0);
  });

  it("awards +5 points for 2 images + 30+ char description", async () => {
    await devLogin(agent, "seed_user_1");
    await clearUserToys(agent);
    const res = await agent.post("/api/toys").send({
      name: "Test Toy Quality",
      category: "Building Blocks",
      ageGroup: "3-5",
      condition: "New",
      imageUrls: [IMG, IMG],
      description: "This is a quality test toy listing with sufficient description length for the reward.",
    });
    expect(res.status).toBe(201);
    expect(res.body.reward).toBeDefined();
    expect(res.body.reward.awarded).toBe(true);
    expect(res.body.reward.points).toBe(5);
    expect(res.body.reward.criteria.minImagesForReward).toBe(2);
    expect(res.body.reward.criteria.minDescriptionChars).toBe(30);
  });
});
