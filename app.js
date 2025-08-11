let bom = JSON.parse(localStorage.getItem("bom")) || {};
let lastSchematicSvg = "";

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
  list.innerHTML = "";
  let totalItems = 0;

  for (let sku in bom) {
    const item = bom[sku];
    const li = document.createElement("li");
    const priceFragment = item.price ? ` = £${(item.qty * item.price).toFixed(2)}` : "";
    li.textContent = `${sku} x${item.qty}${priceFragment}`;
    list.appendChild(li);
    totalItems += item.qty;
  }

  totalItemsEl.textContent = totalItems.toString();
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
  // Merge into local BOM
  data.bom.forEach(item => {
    if (!bom[item.sku]) bom[item.sku] = { qty: 0 };
    bom[item.sku].qty += item.qty;
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

function getScenarioPayload() {
  return {
    roomType: document.getElementById("roomType").value,
    useCase: document.getElementById("useCase").value,
    numDisplays: parseInt(document.getElementById("numDisplays").value, 10),
    numSources: parseInt(document.getElementById("numSources").value, 10),
    maxCableDistanceMeters: parseFloat(document.getElementById("maxCableDistance").value),
    signalType: document.getElementById("signalType").value
  };
}

window.addEventListener("load", () => {
  renderBoM();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
  document.getElementById("btnRecommend").addEventListener("click", recommendProducts);
  document.getElementById("btnSchematic").addEventListener("click", generateSchematic);
  document.getElementById("btnProposal").addEventListener("click", downloadProposal);
});
