let bom = JSON.parse(localStorage.getItem("bom")) || {};

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
  const totalEl = document.getElementById("total");
  list.innerHTML = "";
  let total = 0;

  for (let sku in bom) {
    const item = bom[sku];
    const li = document.createElement("li");
    li.textContent = `${sku} x${item.qty} = £${item.qty * item.price}`;
    list.appendChild(li);
    total += item.qty * item.price;
  }

  totalEl.textContent = total.toFixed(2);
}

window.addEventListener("load", () => {
  renderBoM();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
});
