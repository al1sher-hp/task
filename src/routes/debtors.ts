import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { monthQuerySchema } from "../utils/validation.js";
import { getDebtors } from "../services/debtorsService.js";

export const debtorsRouter = Router();

debtorsRouter.get(
  "/debtors",
  asyncHandler(async (req, res) => {
    const month = monthQuerySchema.parse(req.query.month);
    const debtors = await getDebtors(month);
    res.json(debtors);
  })
);
