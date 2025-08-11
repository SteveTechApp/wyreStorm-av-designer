import fs from "fs";
import path from "path";

function loadCatalog() {
  const catalogPath = path.resolve(process.cwd(), "data", "catalog.json");
  const raw = fs.readFileSync(catalogPath, "utf-8");
  return JSON.parse(raw);
}

function getUnitPrice(product, priceTier) {
  const prices = product.prices || {};
  const byTier = prices[priceTier];
  if (typeof byTier === "number") return byTier;
  if (typeof prices.dealer === "number") return prices.dealer;
  if (typeof prices.msrp === "number") return prices.msrp;
  return 0;
}

export function selectProductsForScenario(scenario, options = {}) {
  const { priceTier = "dealer" } = options;
  const catalog = loadCatalog();
  const { currency = "GBP" } = catalog;
  const bom = [];

  const {
    useCase,
    numDisplays = 1,
    numSources = 1,
    maxCableDistanceMeters = 5,
    signalType = "HDMI"
  } = scenario;

  const needsMatrix = numSources > 1 && numDisplays > 1;
  const longRun = maxCableDistanceMeters > 40;

  if (needsMatrix) {
    const matrix = catalog.products.find(p => p.tags.includes("matrix"));
    if (matrix) bom.push({ sku: matrix.sku, name: matrix.name, qty: 1 });
  } else {
    const switcher = catalog.products.find(p => p.tags.includes("switcher"));
    if (switcher) bom.push({ sku: switcher.sku, name: switcher.name, qty: 1 });
  }

  if (longRun || signalType === "HDBaseT") {
    const tx = catalog.products.find(p => p.tags.includes("hdbaset-tx"));
    const rx = catalog.products.find(p => p.tags.includes("hdbaset-rx"));
    if (tx && rx) {
      bom.push({ sku: tx.sku, name: tx.name, qty: numSources });
      bom.push({ sku: rx.sku, name: rx.name, qty: numDisplays });
    }
  }

  if (useCase && useCase.toLowerCase().includes("conferencing")) {
    const usbSwitcher = catalog.products.find(p => p.tags.includes("uc-switch"));
    if (usbSwitcher) bom.push({ sku: usbSwitcher.sku, name: usbSwitcher.name, qty: 1 });
  }

  const hdmiCable = catalog.products.find(p => p.tags.includes("hdmi-cable"));
  if (hdmiCable) {
    bom.push({ sku: hdmiCable.sku, name: hdmiCable.name, qty: numSources + numDisplays });
  }

  const merged = Object.values(
    bom.reduce((acc, item) => {
      const key = item.sku;
      if (!acc[key]) acc[key] = { ...item };
      else acc[key].qty += item.qty;
      return acc;
    }, {})
  );

  // Attach pricing
  const priced = merged.map(item => {
    const product = catalog.products.find(p => p.sku === item.sku) || {};
    const unitPrice = getUnitPrice(product, priceTier);
    const lineTotal = unitPrice * item.qty;
    return { ...item, unitPrice, lineTotal };
  });

  const grandTotal = priced.reduce((sum, i) => sum + i.lineTotal, 0);

  return {
    currency,
    priceTier,
    bom: priced,
    grandTotal,
    notes: [
      longRun ? "Long cable runs detected; HDBaseT extenders recommended." : "",
      needsMatrix ? "Multiple sources/displays; matrix selected." : "",
    ].filter(Boolean)
  };
}