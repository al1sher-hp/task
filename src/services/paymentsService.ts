import { Payment, Student } from "../models/index.js";
import { NotFoundError } from "../utils/errors.js";
import { todayInTashkent } from "../utils/date.js";

export async function createPayment(data: { studentId: number; amount: number; date?: string }) {
  const student = await Student.findByPk(data.studentId);
  if (!student) throw new NotFoundError("student not found");

  return Payment.create({
    studentId: data.studentId,
    amount: data.amount,
    date: data.date ?? todayInTashkent(),
  });
}

export async function listPaymentsForStudent(studentId: number) {
  const student = await Student.findByPk(studentId);
  if (!student) throw new NotFoundError("student not found");

  return Payment.findAll({
    where: { studentId },
    order: [["date", "DESC"]],
  });
}
