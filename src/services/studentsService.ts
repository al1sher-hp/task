import { Student, Payment } from "../models/index.js";
import { NotFoundError } from "../utils/errors.js";

export async function createStudent(data: { name: string; phone: string; group: string; monthlyFee: number }) {
  return Student.create(data);
}

export async function listStudents(group?: string) {
  return Student.findAll({
    where: group ? { group } : {},
    order: [["id", "ASC"]],
  });
}

export async function getStudentOrThrow(id: number) {
  const student = await Student.findByPk(id);
  if (!student) throw new NotFoundError("student not found");
  return student;
}

export async function updateStudent(id: number, data: Partial<{ name: string; phone: string; group: string; monthlyFee: number }>) {
  const student = await getStudentOrThrow(id);
  await student.update(data);
  return student;
}

// Cascade-deletes the student's payments first, then the student record.
// This is a deliberate design decision (documented in the README): a deleted
// student's payment history is not kept for later audit.
export async function deleteStudent(id: number) {
  const student = await getStudentOrThrow(id);
  await Payment.destroy({ where: { studentId: id } });
  await student.destroy();
}
