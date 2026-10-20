import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { seedDatabase } from "../src/db/seed.js";
import { resetDb } from "./setupDb.js";

describe("seed script", () => {
  resetDb();

  it("produces a non-empty debtors list for the previous month, matching the seeded partial/unpaid students", async () => {
    const { prevMonth, currentMonth } = await seedDatabase();

    const prevRes = await request(app).get(`/debtors?month=${prevMonth}`);
    expect(prevRes.status).toBe(200);
    expect(prevRes.body.length).toBeGreaterThan(0);

    const byName = Object.fromEntries(prevRes.body.map((d: { name: string; paid: number; debt: number }) => [d.name, d]));

    // Sherzod and Bekzod didn't pay anything in prevMonth; Nilufar paid only part of her fee.
    expect(byName["Sherzod Nazarov"]).toMatchObject({ paid: 0, debt: 450000 });
    expect(byName["Bekzod Alimov"]).toMatchObject({ paid: 0, debt: 600000 });
    expect(byName["Nilufar Ergasheva"]).toMatchObject({ paid: 200000, debt: 280000 });

    // Students who paid their full fee in prevMonth must not show up as debtors.
    expect(byName["Aziz Karimov"]).toBeUndefined();
    expect(byName["Ozoda Rustamova"]).toBeUndefined();

    // Sanity check the current month still works too (the bug this test guards
    // against was specific to prevMonth, caused by createdAt defaulting to "now").
    const currentRes = await request(app).get(`/debtors?month=${currentMonth}`);
    expect(currentRes.status).toBe(200);
    expect(currentRes.body.length).toBeGreaterThan(0);
  });
});
