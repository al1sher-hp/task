import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Student, Payment } from "../src/models/index.js";
import { currentMonthInTashkent } from "../src/utils/date.js";
import { resetDb } from "./setupDb.js";

// Using "now" (the current month) keeps every student's default createdAt
// inside the tested month, so the "created after the month" exclusion rule
// doesn't accidentally swallow unrelated tests.
const MONTH = currentMonthInTashkent();
const [year, monthNum] = MONTH.split("-").map(Number);
const PREV_MONTH = monthNum === 1 ? `${year - 1}-12` : `${year}-${String(monthNum - 1).padStart(2, "0")}`;
// A month after MONTH: students created "now" already exist by then, so this
// month is safe to use for "different month" checks without also triggering
// the "student created after the month" exclusion rule.
const NEXT_MONTH = monthNum === 12 ? `${year + 1}-01` : `${year}-${String(monthNum + 1).padStart(2, "0")}`;

function dateInMonth(day: number): string {
  return `${MONTH}-${String(day).padStart(2, "0")}`;
}

describe("GET /debtors", () => {
  resetDb();

  it("treats a student with zero payments as a debtor for the full fee", async () => {
    await Student.create({ name: "No Payer", phone: "+998901111111", group: "A", monthlyFee: 500000 });

    const res = await request(app).get(`/debtors?month=${MONTH}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ paid: 0, debt: 500000, monthlyFee: 500000 });
  });

  it("computes a partial debt when payments are less than the fee", async () => {
    const student = await Student.create({ name: "Partial Payer", phone: "+998901111112", group: "A", monthlyFee: 500000 });
    await Payment.create({ studentId: student.id, amount: 200000, date: dateInMonth(10) });

    const res = await request(app).get(`/debtors?month=${MONTH}`);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ paid: 200000, debt: 300000 });
  });

  it("excludes a student who paid exactly the monthly fee", async () => {
    const student = await Student.create({ name: "Exact Payer", phone: "+998901111113", group: "A", monthlyFee: 500000 });
    await Payment.create({ studentId: student.id, amount: 500000, date: dateInMonth(10) });

    const res = await request(app).get(`/debtors?month=${MONTH}`);

    expect(res.body).toHaveLength(0);
  });

  it("excludes a student who overpaid, and does not carry the overpayment into another month", async () => {
    const student = await Student.create({ name: "Overpayer", phone: "+998901111114", group: "A", monthlyFee: 500000 });
    await Payment.create({ studentId: student.id, amount: 700000, date: dateInMonth(10) });

    const thisMonthRes = await request(app).get(`/debtors?month=${MONTH}`);
    expect(thisMonthRes.body).toHaveLength(0);

    // No payment in the next month: this month's overpayment must not reduce it.
    const nextMonthRes = await request(app).get(`/debtors?month=${NEXT_MONTH}`);
    const entry = nextMonthRes.body.find((d: { name: string }) => d.name === "Overpayer");
    expect(entry).toMatchObject({ paid: 0, debt: 500000 });
  });

  it("ignores payments made in a different month", async () => {
    const student = await Student.create({ name: "Other Month", phone: "+998901111115", group: "A", monthlyFee: 500000 });
    await Payment.create({ studentId: student.id, amount: 500000, date: dateInMonth(10) });

    const res = await request(app).get(`/debtors?month=${NEXT_MONTH}`);

    const entry = res.body.find((d: { name: string }) => d.name === "Other Month");
    expect(entry).toMatchObject({ paid: 0, debt: 500000 });
  });

  it("excludes students created after the end of the requested month", async () => {
    // Default createdAt is "now", which falls inside MONTH, not PREV_MONTH.
    await Student.create({ name: "Future Student", phone: "+998901111116", group: "A", monthlyFee: 500000 });

    const res = await request(app).get(`/debtors?month=${PREV_MONTH}`);

    expect(res.body.find((d: { name: string }) => d.name === "Future Student")).toBeUndefined();
  });

  it("sorts debtors by debt descending", async () => {
    const small = await Student.create({ name: "Small Debt", phone: "+998901111117", group: "A", monthlyFee: 500000 });
    await Payment.create({ studentId: small.id, amount: 400000, date: dateInMonth(10) });
    await Student.create({ name: "Big Debt", phone: "+998901111118", group: "A", monthlyFee: 600000 });

    const res = await request(app).get(`/debtors?month=${MONTH}`);

    expect(res.body.map((d: { name: string }) => d.name)).toEqual(["Big Debt", "Small Debt"]);
  });

  it("returns 400 for an invalid month format", async () => {
    const res = await request(app).get("/debtors?month=2026-13");
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTypeOf("string");
  });

  it("returns 400 when the month query parameter is missing", async () => {
    const res = await request(app).get("/debtors");
    expect(res.status).toBe(400);
  });
});
