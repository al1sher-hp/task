import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { resetDb } from "./setupDb.js";

const validStudent = {
  name: "Test Student",
  phone: "+998901234567",
  group: "Math-101",
  monthlyFee: 500000,
};

describe("Student CRUD", () => {
  resetDb();

  it("creates, reads, updates and deletes a student (happy path)", async () => {
    const createRes = await request(app).post("/students").send(validStudent);
    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject(validStudent);
    const id = createRes.body.id;

    const listRes = await request(app).get("/students");
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    const getRes = await request(app).get(`/students/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe(validStudent.name);

    const patchRes = await request(app).patch(`/students/${id}`).send({ monthlyFee: 600000 });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.monthlyFee).toBe(600000);
    expect(patchRes.body.name).toBe(validStudent.name);

    const putRes = await request(app).put(`/students/${id}`).send({ name: "Renamed Student" });
    expect(putRes.status).toBe(200);
    expect(putRes.body.name).toBe("Renamed Student");

    const deleteRes = await request(app).delete(`/students/${id}`);
    expect(deleteRes.status).toBe(204);

    const afterDeleteRes = await request(app).get(`/students/${id}`);
    expect(afterDeleteRes.status).toBe(404);
  });

  it("cascade-deletes a student's payments", async () => {
    const createRes = await request(app).post("/students").send(validStudent);
    const id = createRes.body.id;
    await request(app).post("/payments").send({ studentId: id, amount: 100000 });

    await request(app).delete(`/students/${id}`);

    const res = await request(app).post("/payments").send({ studentId: id, amount: 100000 });
    expect(res.status).toBe(404);
  });

  it("returns 404 for a missing student", async () => {
    const res = await request(app).get("/students/999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeTypeOf("string");
  });

  it("returns 404 when updating a missing student", async () => {
    const res = await request(app).patch("/students/999999").send({ name: "X" });
    expect(res.status).toBe(404);
  });

  it("returns 404 when deleting a missing student", async () => {
    const res = await request(app).delete("/students/999999");
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid student data", async () => {
    const res = await request(app).post("/students").send({
      name: "",
      phone: "12345",
      group: "A",
      monthlyFee: -10,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTypeOf("string");
  });

  it("returns 400 for a missing required field", async () => {
    const res = await request(app).post("/students").send({
      phone: "+998901234567",
      group: "A",
      monthlyFee: 500000,
    });
    expect(res.status).toBe(400);
  });
});
