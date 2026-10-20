import { QueryTypes } from "sequelize";
import { sequelize } from "../db/sequelize.js";
import { monthRange } from "../utils/date.js";

export interface Debtor {
  studentId: number;
  name: string;
  phone: string;
  group: string;
  monthlyFee: number;
  paid: number;
  debt: number;
}

interface DebtorRow {
  studentId: number;
  name: string;
  phone: string;
  group: string;
  monthlyFee: number;
  paid: number;
}

/**
 * Students who owe money for the given YYYY-MM month.
 *
 * Assumptions (also documented in the README):
 * - paid = SUM of payments whose date falls within the calendar month.
 * - debt = monthlyFee - paid; a student is a debtor only if debt > 0.
 * - A student with no payments that month is still a debtor (LEFT JOIN + COALESCE).
 * - Overpayment in one month does not carry over and reduce debt in another month.
 * - Students created after the end of the requested month are excluded (they
 *   didn't exist yet), compared by the date part of createdAt.
 *
 * The SUM is computed in SQL (not by loading payments into memory); only the
 * final monthlyFee - paid subtraction happens in JS, over already-aggregated rows.
 */
export async function getDebtors(month: string): Promise<Debtor[]> {
  const { start, end } = monthRange(month);

  const rows = await sequelize.query<DebtorRow>(
    `
    SELECT
      s.id AS studentId,
      s.name AS name,
      s.phone AS phone,
      s."group" AS "group",
      s.monthlyFee AS monthlyFee,
      COALESCE(SUM(p.amount), 0) AS paid
    FROM students s
    LEFT JOIN payments p
      ON p.studentId = s.id
      AND p.date BETWEEN :start AND :end
    WHERE substr(s.createdAt, 1, 10) <= :end
    GROUP BY s.id
    `,
    {
      replacements: { start, end },
      type: QueryTypes.SELECT,
    }
  );

  return rows
    .map((row) => ({
      studentId: row.studentId,
      name: row.name,
      phone: row.phone,
      group: row.group,
      monthlyFee: Number(row.monthlyFee),
      paid: Number(row.paid),
      debt: Number(row.monthlyFee) - Number(row.paid),
    }))
    .filter((row) => row.debt > 0)
    .sort((a, b) => b.debt - a.debt);
}
