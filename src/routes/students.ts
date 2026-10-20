import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { studentCreateSchema, studentUpdateSchema } from "../utils/validation.js";
import { NotFoundError } from "../utils/errors.js";
import {
  createStudent,
  listStudents,
  getStudentOrThrow,
  updateStudent,
  deleteStudent,
} from "../services/studentsService.js";
import { listPaymentsForStudent } from "../services/paymentsService.js";

export const studentsRouter = Router();

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id)) throw new NotFoundError("student not found");
  return id;
}

studentsRouter.post(
  "/students",
  asyncHandler(async (req, res) => {
    const data = studentCreateSchema.parse(req.body);
    const student = await createStudent(data);
    res.status(201).json(student);
  })
);

studentsRouter.get(
  "/students",
  asyncHandler(async (req, res) => {
    const group = typeof req.query.group === "string" ? req.query.group : undefined;
    const students = await listStudents(group);
    res.json(students);
  })
);

studentsRouter.get(
  "/students/:id",
  asyncHandler(async (req, res) => {
    const student = await getStudentOrThrow(parseId(req.params.id));
    res.json(student);
  })
);

studentsRouter.put(
  "/students/:id",
  asyncHandler(async (req, res) => {
    const data = studentUpdateSchema.parse(req.body);
    const student = await updateStudent(parseId(req.params.id), data);
    res.json(student);
  })
);

studentsRouter.patch(
  "/students/:id",
  asyncHandler(async (req, res) => {
    const data = studentUpdateSchema.parse(req.body);
    const student = await updateStudent(parseId(req.params.id), data);
    res.json(student);
  })
);

studentsRouter.delete(
  "/students/:id",
  asyncHandler(async (req, res) => {
    await deleteStudent(parseId(req.params.id));
    res.status(204).send();
  })
);

studentsRouter.get(
  "/students/:id/payments",
  asyncHandler(async (req, res) => {
    const payments = await listPaymentsForStudent(parseId(req.params.id));
    res.json(payments);
  })
);
