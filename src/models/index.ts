import { Student } from "./Student.js";
import { Payment } from "./Payment.js";

// Cascade delete of payments is done explicitly in studentsService.remove()
// rather than relying on SQLite's FK pragma (off by default) or Sequelize hooks.
Student.hasMany(Payment, { foreignKey: "studentId" });
Payment.belongsTo(Student, { foreignKey: "studentId" });

export { Student, Payment };
