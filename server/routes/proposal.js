import { Router } from "express";
import { z } from "zod";
import { selectProductsForScenario } from "../logic/productSelection.js";

const router = Router();

const Schema = z.object({
  projectName: z.string().default("AV Proposal"),
  clientName: z.string().default("Client"),
  scenario: z.object({
    roomType: z.string(),
    useCase: z.string(),
    numDisplays: z.number().int().min(1),
    numSources: z.number().int().min(1),
    maxCableDistanceMeters: z.number().min(0),
    signalType: z.string().optional().default("HDMI")
  }),
  schematicSvg: z.string().optional()
});

router.post("/compose", async (req, res) => {
  const parse = Schema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { projectName, clientName, scenario, schematicSvg } = parse.data;
  const selection = selectProductsForScenario(scenario);

  const bomRows = selection.bom.map(item => `
    <tr>
      <td>${item.sku}</td>
      <td>${item.name}</td>
      <td style="text-align:right;">${item.qty}</td>
    </tr>
  `).join("\n");

  const notes = selection.notes.map(n => `<li>${n}</li>`).join("\n");
  const embeddedSvg = schematicSvg ? `data:image/svg+xml;base64,${Buffer.from(schematicSvg).toString("base64")}` : "";

  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${projectName} - Proposal</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
      h1 { color: #006837; }
      h2 { border-bottom: 2px solid #00683722; padding-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #ddd; padding: 8px; }
      th { background: #f5f5f5; }
      .header { display:flex; align-items:center; justify-content:space-between; }
      .brand { color:#006837; font-weight:bold; }
      .meta { color:#555; }
      .schematic { margin: 16px 0; border: 1px solid #eee; padding: 8px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>WyreStorm AV Proposal</h1>
      <div class="brand">${projectName}</div>
    </div>
    <p class="meta">Client: <strong>${clientName}</strong></p>

    <h2>Project Summary</h2>
    <p>Room Type: <strong>${scenario.roomType}</strong> | Use Case: <strong>${scenario.useCase}</strong> | Displays: <strong>${scenario.numDisplays}</strong> | Sources: <strong>${scenario.numSources}</strong></p>

    ${embeddedSvg ? `<div class="schematic"><img alt="Schematic" src="${embeddedSvg}" /></div>` : ""}

    <h2>Bill of Materials</h2>
    <table>
      <thead>
        <tr><th>SKU</th><th>Description</th><th style="text-align:right;">Qty</th></tr>
      </thead>
      <tbody>
        ${bomRows}
      </tbody>
    </table>

    ${notes ? `<h2>Technical Notes</h2><ul>${notes}</ul>` : ""}
  </body>
  </html>`;

  res.json({ html, bom: selection.bom, notes: selection.notes });
});

export default router;