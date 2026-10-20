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

async function seed() {
  // Reset the schema so the script can be re-run safely for a fresh demo.
  await sequelize.sync({ force: true });

  const currentMonth = currentMonthInTashkent();
  const prevMonth = previousMonth(currentMonth);

  const students = await Student.bulkCreate([
    { name: "Aziz Karimov", phone: "+998901234567", group: "Math-101", monthlyFee: 500000 },
    { name: "Dilnoza Yusupova", phone: "+998912345678", group: "Math-101", monthlyFee: 500000 },
    { name: "Javlon Rashidov", phone: "+998933456789", group: "Math-101", monthlyFee: 550000 },
    { name: "Malika Tosheva", phone: "+998944567890", group: "English-A2", monthlyFee: 450000 },
    { name: "Sherzod Nazarov", phone: "+998955678901", group: "English-A2", monthlyFee: 450000 },
    { name: "Nilufar Ergasheva", phone: "+998966789012", group: "English-A2", monthlyFee: 480000 },
    { name: "Bekzod Alimov", phone: "+998977890123", group: "IT-Frontend", monthlyFee: 600000 },
    { name: "Ozoda Rustamova", phone: "+998988901234", group: "IT-Frontend", monthlyFee: 600000 },
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

  console.log(`Seeded ${students.length} students with payments for ${prevMonth} and ${currentMonth}.`);
  await sequelize.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
