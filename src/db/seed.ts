import { fileURLToPath } from "node:url";
import { sequelize } from "./sequelize.js";
import { Student, Payment } from "../models/index.js";
import { currentMonthInTashkent } from "../utils/date.js";

function monthDate(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, "0")}`;
}

function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  return `${prev.y}-${String(prev.m).padStart(2, "0")}`;
}

// Exported separately from the CLI entry point below so tests can run the
// same seeding logic against their own in-memory DB without going through
// `sequelize.close()` / `process.exit()`.
export async function seedDatabase() {
  // Reset the schema so the script can be re-run safely for a fresh demo.
  await sequelize.sync({ force: true });

  const currentMonth = currentMonthInTashkent();
  const prevMonth = previousMonth(currentMonth);

  // Students must have been "enrolled" (createdAt) before the start of prevMonth,
  // otherwise the debtors service's "excludes students created after the end of
  // the requested month" rule would exclude them from prevMonth's debtor list.
  const enrolledAt = new Date(`${previousMonth(prevMonth)}-01T00:00:00.000Z`);

  const students = await Student.bulkCreate([
    { name: "Aziz Karimov", phone: "+998901234567", group: "Math-101", monthlyFee: 500000, createdAt: enrolledAt },
    { name: "Dilnoza Yusupova", phone: "+998912345678", group: "Math-101", monthlyFee: 500000, createdAt: enrolledAt },
    { name: "Javlon Rashidov", phone: "+998933456789", group: "Math-101", monthlyFee: 550000, createdAt: enrolledAt },
    { name: "Malika Tosheva", phone: "+998944567890", group: "English-A2", monthlyFee: 450000, createdAt: enrolledAt },
    { name: "Sherzod Nazarov", phone: "+998955678901", group: "English-A2", monthlyFee: 450000, createdAt: enrolledAt },
    { name: "Nilufar Ergasheva", phone: "+998966789012", group: "English-A2", monthlyFee: 480000, createdAt: enrolledAt },
    { name: "Bekzod Alimov", phone: "+998977890123", group: "IT-Frontend", monthlyFee: 600000, createdAt: enrolledAt },
    { name: "Ozoda Rustamova", phone: "+998988901234", group: "IT-Frontend", monthlyFee: 600000, createdAt: enrolledAt },
  ]);

  const [aziz, dilnoza, javlon, malika, sherzod, nilufar, bekzod, ozoda] = students;

  await Payment.bulkCreate([
    // Aziz: full payer both months.
    { studentId: aziz.id, amount: 500000, date: monthDate(prevMonth, 5) },
    { studentId: aziz.id, amount: 500000, date: monthDate(currentMonth, 3) },

    // Dilnoza: partial payment this month, full last month.
    { studentId: dilnoza.id, amount: 500000, date: monthDate(prevMonth, 10) },
    { studentId: dilnoza.id, amount: 200000, date: monthDate(currentMonth, 7) },

    // Javlon: unpaid this month, full last month.
    { studentId: javlon.id, amount: 550000, date: monthDate(prevMonth, 12) },

    // Malika: overpaid this month (overpayment does not carry over to other months).
    { studentId: malika.id, amount: 450000, date: monthDate(prevMonth, 15) },
    { studentId: malika.id, amount: 600000, date: monthDate(currentMonth, 2) },

    // Sherzod: full this month, unpaid last month.
    { studentId: sherzod.id, amount: 450000, date: monthDate(currentMonth, 9) },

    // Nilufar: partial both months.
    { studentId: nilufar.id, amount: 200000, date: monthDate(prevMonth, 8) },
    { studentId: nilufar.id, amount: 250000, date: monthDate(currentMonth, 11) },

    // Bekzod: unpaid both months (no payment rows at all).

    // Ozoda: full this month, full last month.
    { studentId: ozoda.id, amount: 600000, date: monthDate(prevMonth, 20) },
    { studentId: ozoda.id, amount: 600000, date: monthDate(currentMonth, 1) },
  ]);

  return { students, prevMonth, currentMonth };
}

async function main() {
  const { students, prevMonth, currentMonth } = await seedDatabase();
  console.log(`Seeded ${students.length} students with payments for ${prevMonth} and ${currentMonth}.`);
  await sequelize.close();
}

// Only run as the CLI entry point (`npm run seed`), not when seedDatabase is imported by tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
