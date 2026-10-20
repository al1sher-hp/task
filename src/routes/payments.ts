import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paymentCreateSchema } from "../utils/validation.js";
import { createPayment } from "../services/paymentsService.js";

export const paymentsRouter = Router();

paymentsRouter.post(
  "/payments",
  asyncHandler(async (req, res) => {
    const data = paymentCreateSchema.parse(req.body);
    const payment = await createPayment(data);
    res.status(201).json(payment);
  })
);
