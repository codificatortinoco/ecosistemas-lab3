const API = "http://localhost:5050"

const storesList = document.getElementById("stores")
const productsList = document.getElementById("products")
const cartList = document.getElementById("cart")
const ordersList = document.getElementById("orders")
const placeOrderBtn = document.getElementById("place-order")

let selectedStoreId = null
let cart = [] 
const consumerId = "u1"


const storeIdToStore = {}
const productIdToProduct = {}

function formatCurrency(num) { return `$${num.toFixed(2)}` }

function loadStores() {
  fetch(`${API}/stores`)
    .then(r => r.json())
    .then(stores => {
      storesList.innerHTML = ""
      stores.forEach(store => {
        storeIdToStore[store.id] = store
        const li = document.createElement("li")
        li.textContent = `${store.name} ${store.isOpen ? "(open)" : "(closed)"}`
        li.style.cursor = "pointer"
        li.onclick = () => loadStore(store.id)
        storesList.appendChild(li)
      })
    })
}

function loadStore(storeId) {
  selectedStoreId = storeId
  fetch(`${API}/stores/${storeId}`)
    .then(r => r.json())
    .then(store => {
      productsList.innerHTML = ""
      store.products.forEach(p => {
        productIdToProduct[p.id] = p
        const li = document.createElement("li")
        const btn = document.createElement("button")
        btn.textContent = "+"
        btn.onclick = () => addToCart(p.id)
        li.textContent = `${p.name} - ${formatCurrency(p.price)} `
        li.appendChild(btn)
        productsList.appendChild(li)
      })
    })
}

function addToCart(productId) {
  const existing = cart.find(i => i.productId === productId)
  if (existing) existing.qty += 1
  else cart.push({ productId, qty: 1, storeId: selectedStoreId })
  renderCart()
}

function renderCart() {
  cartList.innerHTML = ""
  cart.forEach(item => {
    const li = document.createElement("li")
    const product = productIdToProduct[item.productId]
    const productName = product ? product.name : item.productId
    const store = storeIdToStore[item.storeId]
    const storeName = store ? store.name : (item.storeId || "")
    const minusBtn = document.createElement("button")
    minusBtn.textContent = "-"
    minusBtn.onclick = () => decreaseQty(item.productId)
    const plusBtn = document.createElement("button")
    plusBtn.textContent = "+"
    plusBtn.onclick = () => increaseQty(item.productId)
    const label = document.createElement("span")
    label.textContent = ` ${storeName}: ${productName} x ${item.qty} `
    li.appendChild(minusBtn)
    li.appendChild(label)
    li.appendChild(plusBtn)
    cartList.appendChild(li)
  })
}

function increaseQty(productId) {
  const existing = cart.find(i => i.productId === productId)
  if (!existing) return
  existing.qty += 1
  renderCart()
}

function decreaseQty(productId) {
  const existing = cart.find(i => i.productId === productId)
  if (!existing) return
  existing.qty -= 1
  if (existing.qty <= 0) {
    cart = cart.filter(i => i.productId !== productId)
  }
  renderCart()
}

function loadOrders() {
  fetch(`${API}/orders`)
    .then(r => r.json())
    .then(all => {
      ordersList.innerHTML = ""
      all.filter(o => o.consumerId === consumerId).forEach(o => {
        const li = document.createElement("li")
        li.textContent = `${o.id} - ${o.status} (${o.items.length} items)`
        ordersList.appendChild(li)
      })
    })
}

placeOrderBtn.addEventListener("click", () => {
  if (!selectedStoreId || cart.length === 0) return alert("Pick a store and add products")
  fetch(`${API}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      consumerId,
      storeId: selectedStoreId,
      items: cart,
      address: "Main St 123",
      payment: "cash",
    }),
  })
    .then(r => r.json())
    .then(() => { cart = []; renderCart(); loadOrders() })
})

loadStores()
loadOrders()
