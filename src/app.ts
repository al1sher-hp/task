import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { studentsRouter } from "./routes/students.js";
import { paymentsRouter } from "./routes/payments.js";
import { debtorsRouter } from "./routes/debtors.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(studentsRouter);
app.use(paymentsRouter);
app.use(debtorsRouter);

app.use(errorHandler);
