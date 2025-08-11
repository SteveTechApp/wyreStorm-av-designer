import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

const catalogPath = path.resolve(process.cwd(), "data", "catalog.json");

router.post("/upload", (req, res) => {
  // Expect JSON body: { items: [{ sku, dealer2?, dealer?, msrp? }], currency? }
  const body = req.body;
  if (!body || !Array.isArray(body.items)) {
    return res.status(400).json({ error: "Expected body { items: [{sku, dealer2?, dealer?, msrp?}], currency? }" });
  }
  const { items, currency } = body;
  const raw = fs.readFileSync(catalogPath, "utf-8");
  const catalog = JSON.parse(raw);
  const updated = { ...catalog };
  if (currency) updated.currency = currency;

  const skuToPrice = new Map(items.map(it => [String(it.sku), it]));

  updated.products = catalog.products.map(p => {
    const match = skuToPrice.get(p.sku);
    if (!match) return p;
    const prices = { ...(p.prices || {}) };
    if (match.dealer2 != null) prices.dealer2 = Number(match.dealer2);
    if (match.dealer != null) prices.dealer = Number(match.dealer);
    if (match.msrp != null) prices.msrp = Number(match.msrp);
    return { ...p, prices };
  });

  fs.writeFileSync(catalogPath, JSON.stringify(updated, null, 2));
  return res.json({ ok: true, updatedCount: items.filter(it => catalog.products.some(p => p.sku === it.sku)).length });
});

export default router;