import { Router } from "express";
import { z } from "zod";
import { selectProductsForScenario } from "../logic/productSelection.js";

const router = Router();

const ScenarioSchema = z.object({
  roomType: z.string().min(1),
  useCase: z.string().min(1),
  numDisplays: z.number().int().min(1),
  numSources: z.number().int().min(1),
  maxCableDistanceMeters: z.number().min(0),
  signalType: z.string().optional().default("HDMI")
});

router.post("/select", (req, res) => {
  const parse = ScenarioSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid scenario", details: parse.error.flatten() });
  }
  const result = selectProductsForScenario(parse.data);
  res.json({ scenario: parse.data, ...result });
});

export default router;