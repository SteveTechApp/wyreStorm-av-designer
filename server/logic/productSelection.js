import fs from "fs";
import path from "path";

function loadCatalog() {
  const catalogPath = path.resolve(process.cwd(), "data", "catalog.json");
  const raw = fs.readFileSync(catalogPath, "utf-8");
  return JSON.parse(raw);
}

export function selectProductsForScenario(scenario) {
  const catalog = loadCatalog();
  const bom = [];

  const {
    useCase,
    numDisplays = 1,
    numSources = 1,
    maxCableDistanceMeters = 5,
    signalType = "HDMI"
  } = scenario;

  // Core logic
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
      const count = numDisplays;
      bom.push({ sku: tx.sku, name: tx.name, qty: numSources });
      bom.push({ sku: rx.sku, name: rx.name, qty: count });
    }
  }

  if (useCase && useCase.toLowerCase().includes("conferencing")) {
    const usbSwitcher = catalog.products.find(p => p.tags.includes("uc-switch"));
    if (usbSwitcher) bom.push({ sku: usbSwitcher.sku, name: usbSwitcher.name, qty: 1 });
  }

  // Displays and sources cabling (HDMI cables)
  const hdmiCable = catalog.products.find(p => p.tags.includes("hdmi-cable"));
  if (hdmiCable) {
    bom.push({ sku: hdmiCable.sku, name: hdmiCable.name, qty: numSources + numDisplays });
  }

  // De-duplicate SKUs and sum qty
  const merged = Object.values(
    bom.reduce((acc, item) => {
      const key = item.sku;
      if (!acc[key]) acc[key] = { ...item };
      else acc[key].qty += item.qty;
      return acc;
    }, {})
  );

  return {
    bom: merged,
    notes: [
      longRun ? "Long cable runs detected; HDBaseT extenders recommended." : "",
      needsMatrix ? "Multiple sources/displays; matrix selected." : "",
    ].filter(Boolean)
  };
}