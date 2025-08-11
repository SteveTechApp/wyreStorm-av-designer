let bom = JSON.parse(localStorage.getItem("bom")) || {};
let lastSchematicSvg = "";
let currency = "GBP";

function addToBoM(sku, price) {
  if (!bom[sku]) {
    bom[sku] = { qty: 1, price: price };
  } else {
    bom[sku].qty++;
  }
  localStorage.setItem("bom", JSON.stringify(bom));
  renderBoM();
}

function renderBoM() {
  const list = document.getElementById("bomList");
  const totalItemsEl = document.getElementById("totalItems");
  const totalCostEl = document.getElementById("totalCost");
  const currencyEl = document.getElementById("currency");
  list.innerHTML = "";
  let totalItems = 0;
  let totalCost = 0;

  for (let sku in bom) {
    const item = bom[sku];
    const li = document.createElement("li");
    const unitPrice = item.price || 0;
    const lineTotal = unitPrice * item.qty;
    const priceFragment = unitPrice ? ` @ ${currency} ${unitPrice.toFixed(2)} = ${currency} ${lineTotal.toFixed(2)}` : "";
    const nameFragment = item.name ? ` - ${item.name}` : "";
    li.textContent = `${sku}${nameFragment} x${item.qty}${priceFragment}`;
    list.appendChild(li);
    totalItems += item.qty;
    totalCost += lineTotal;
  }

  totalItemsEl.textContent = totalItems.toString();
  totalCostEl.textContent = totalCost.toFixed(2);
  currencyEl.textContent = currency;
}

function getScenarioPayload() {
  return {
    roomType: document.getElementById("roomType").value,
    useCase: document.getElementById("useCase").value,
    numDisplays: parseInt(document.getElementById("numDisplays").value, 10),
    numSources: parseInt(document.getElementById("numSources").value, 10),
    maxCableDistanceMeters: parseFloat(document.getElementById("maxCableDistance").value),
    signalType: document.getElementById("signalType").value,
    priceTier: document.getElementById("priceTier").value
  };
}

async function recommendProducts() {
  const payload = getScenarioPayload();
  const res = await fetch("/api/scenario/select", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    alert("Failed to get recommendations");
    return;
  }
  const data = await res.json();
  currency = data.currency || currency;
  // Merge into local BOM with pricing
  data.bom.forEach(item => {
    if (!bom[item.sku]) bom[item.sku] = { qty: 0, price: item.unitPrice, name: item.name };
    bom[item.sku].qty += item.qty;
    bom[item.sku].price = item.unitPrice; // update price by tier
    bom[item.sku].name = item.name;
  });
  localStorage.setItem("bom", JSON.stringify(bom));
  renderBoM();
}

async function generateSchematic() {
  const payload = getScenarioPayload();
  const res = await fetch("/api/schematic/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numDisplays: payload.numDisplays, numSources: payload.numSources })
  });
  if (!res.ok) {
    alert("Failed to generate schematic");
    return;
  }
  const svg = await res.text();
  lastSchematicSvg = svg;
  const container = document.getElementById("schematicContainer");
  container.innerHTML = svg;
}

async function downloadProposal() {
  const payload = getScenarioPayload();
  const res = await fetch("/api/proposal/compose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectName: "Auto Proposal",
      clientName: "ACME",
      priceTier: payload.priceTier,
      scenario: payload,
      schematicSvg: lastSchematicSvg || undefined
    })
  });
  if (!res.ok) {
    alert("Failed to compose proposal");
    return;
  }
  const { html } = await res.json();
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "proposal.html";
  a.click();
  URL.revokeObjectURL(url);
}

async function uploadPricelist() {
  const fileInput = document.getElementById("priceFile");
  const file = fileInput.files && fileInput.files[0];
  if (!file) {
    alert("Please choose a JSON file");
    return;
  }
  const text = await file.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    alert("Invalid JSON file");
    return;
  }
  const res = await fetch("/api/catalog/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json)
  });
  if (!res.ok) {
    alert("Upload failed");
    return;
  }
  alert("Pricelist uploaded. Re-run recommendations to refresh prices.");
}

window.addEventListener("load", () => {
  renderBoM();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
  document.getElementById("btnRecommend").addEventListener("click", recommendProducts);
  document.getElementById("btnSchematic").addEventListener("click", generateSchematic);
  document.getElementById("btnProposal").addEventListener("click", downloadProposal);
  document.getElementById("btnUploadPrices").addEventListener("click", uploadPricelist);
});
