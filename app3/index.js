const API = "http://localhost:5050"
const driverId = "u3"

const availableUl = document.getElementById("available")
const myOrdersUl = document.getElementById("my-orders")
const refreshBtn = document.getElementById("refresh")

function loadAvailable() {
  fetch(`${API}/orders/available`).then(r => r.json()).then(list => {
    availableUl.innerHTML = ""
    list.forEach(o => {
      const li = document.createElement("li")
      const btn = document.createElement("button")
      btn.textContent = "Accept"
      btn.onclick = () => accept(o.id)
      li.textContent = `${o.id} from store ${o.storeId}`
      li.appendChild(btn)
      availableUl.appendChild(li)
    })
  })
}

function loadMyOrders() {
  fetch(`${API}/orders`).then(r => r.json()).then(all => {
    myOrdersUl.innerHTML = ""
    all.filter(o => o.driverId === driverId).forEach(o => {
      const li = document.createElement("li")
      const btn = document.createElement("button")
      btn.textContent = "Delivered"
      btn.onclick = () => deliver(o.id)
      li.textContent = `${o.id} - ${o.status}`
      li.appendChild(btn)
      myOrdersUl.appendChild(li)
    })
  })
}

function accept(id) {
  fetch(`${API}/orders/${id}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId })
  }).then(() => { loadAvailable(); loadMyOrders() })
}

function deliver(id) {
  fetch(`${API}/orders/${id}/deliver`, { method: "POST" })
    .then(() => loadMyOrders())
}

refreshBtn.onclick = () => loadAvailable()

loadAvailable()
loadMyOrders()