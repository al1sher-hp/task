import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { resetDb } from "./setupDb.js";

describe("POST /payments", () => {
  resetDb();

  async function createStudent() {
    const res = await request(app).post("/students").send({
      name: "Payer",
      phone: "+998901234567",
      group: "A",
      monthlyFee: 500000,
    });
    return res.body.id as number;
  }

  it("creates a payment and defaults the date to today", async () => {
    const studentId = await createStudent();

    const res = await request(app).post("/payments").send({ studentId, amount: 100000 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ studentId, amount: 100000 });
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("accepts an explicit date", async () => {
    const studentId = await createStudent();

    const res = await request(app).post("/payments").send({ studentId, amount: 100000, date: "2026-03-15" });

    expect(res.status).toBe(201);
    expect(res.body.date).toBe("2026-03-15");
  });

  it("lists a student's payments sorted by date descending", async () => {
    const studentId = await createStudent();
    await request(app).post("/payments").send({ studentId, amount: 100000, date: "2026-01-01" });
    await request(app).post("/payments").send({ studentId, amount: 200000, date: "2026-03-01" });
    await request(app).post("/payments").send({ studentId, amount: 300000, date: "2026-02-01" });

    const res = await request(app).get(`/students/${studentId}/payments`);

    expect(res.status).toBe(200);
    expect(res.body.map((p: { date: string }) => p.date)).toEqual(["2026-03-01", "2026-02-01", "2026-01-01"]);
  });

  it("returns 404 for a payment on a non-existent student", async () => {
    const res = await request(app).post("/payments").send({ studentId: 999999, amount: 100000 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBeTypeOf("string");
  });

  it("returns 400 for a non-positive amount", async () => {
    const studentId = await createStudent();
    const res = await request(app).post("/payments").send({ studentId, amount: -100 });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid date", async () => {
    const studentId = await createStudent();
    const res = await request(app).post("/payments").send({ studentId, amount: 100000, date: "2026-02-30" });
    expect(res.status).toBe(400);
  });
});
