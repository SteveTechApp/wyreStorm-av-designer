import { Router } from "express";
import { z } from "zod";

const router = Router();

const Schema = z.object({
  numDisplays: z.number().int().min(1),
  numSources: z.number().int().min(1),
});

router.post("/generate", (req, res) => {
  const parse = Schema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { numDisplays, numSources } = parse.data;

  const width = 800;
  const height = 300 + Math.max(numDisplays, numSources) * 40;

  const sourceNodes = Array.from({ length: numSources }).map((_, i) => `
    <rect x="20" y="${60 + i * 60}" width="120" height="40" rx="6" fill="#e3f2fd" stroke="#1e88e5" />
    <text x="80" y="${85 + i * 60}" font-size="12" text-anchor="middle" fill="#1e88e5">Source ${i + 1}</text>
    <line x1="140" y1="${80 + i * 60}" x2="380" y2="${height / 2}" stroke="#546e7a" stroke-width="2" />
  `).join("\n");

  const displayNodes = Array.from({ length: numDisplays }).map((_, i) => `
    <line x1="420" y1="${height / 2}" x2="660" y2="${80 + i * 60}" stroke="#546e7a" stroke-width="2" />
    <rect x="660" y="${60 + i * 60}" width="120" height="40" rx="6" fill="#e8f5e9" stroke="#2e7d32" />
    <text x="720" y="${85 + i * 60}" font-size="12" text-anchor="middle" fill="#2e7d32">Display ${i + 1}</text>
  `).join("\n");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <text x="400" y="24" text-anchor="middle" font-size="18" fill="#006837">Connectivity Diagram</text>
    ${sourceNodes}
    <rect x="360" y="${height / 2 - 25}" width="120" height="50" rx="8" fill="#fff3e0" stroke="#fb8c00" />
    <text x="420" y="${height / 2 + 5}" font-size="12" text-anchor="middle" fill="#e65100">Switch/Matrix</text>
    ${displayNodes}
  </svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.send(svg);
});

export default router;