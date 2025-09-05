const API = "http://localhost:5050"

// Auth elements
const authSection = document.getElementById("auth-section")
const shoppingSection = document.getElementById("shopping-section")
const usernameInput = document.getElementById("username")
const passwordInput = document.getElementById("password")
const loginBtn = document.getElementById("login-btn")
const registerBtn = document.getElementById("register-btn")
const registerFields = document.getElementById("register-fields")
const userNameInput = document.getElementById("user-name")
const userAddressInput = document.getElementById("user-address")
const currentUserSpan = document.getElementById("current-user")
const logoutBtn = document.getElementById("logout-btn")

// Shopping elements
const storesList = document.getElementById("stores")
const productsList = document.getElementById("products")
const cartList = document.getElementById("cart")
const ordersList = document.getElementById("orders")
const placeOrderBtn = document.getElementById("place-order")
const paymentMethodSelect = document.getElementById("payment-method")

let selectedStoreId = null
let cart = [] 
let currentUser = null
let authToken = null

const storeIdToStore = {}
const productIdToProduct = {}

// Auth functions
function showAuth() {
  authSection.style.display = "block"
  shoppingSection.style.display = "none"
}

function showShopping() {
  authSection.style.display = "none"
  shoppingSection.style.display = "block"
}

function login() {
  const username = usernameInput.value.trim()
  const password = passwordInput.value.trim()
  
  if (!username || !password) return alert("Enter username and password")
  
  fetch(`${API}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(r => r.json())
    .then(data => {
      if (data.message) {
        alert(data.message)
      } else {
        currentUser = data.user
        authToken = data.token
        currentUserSpan.textContent = `Welcome, ${data.user.name}`
        showShopping()
        loadStores()
        loadOrders()
      }
    })
    .catch(err => alert("Login failed"))
}

function register() {
  const username = usernameInput.value.trim()
  const password = passwordInput.value.trim()
  const name = userNameInput.value.trim()
  const address = userAddressInput.value.trim()
  
  if (!username || !password || !name) return alert("Enter all required fields")
  
  fetch(`${API}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, name, address })
  })
    .then(r => r.json())
    .then(data => {
      if (data.message) {
        alert(data.message)
      } else {
        alert("User registered successfully! You can now login.")
        registerFields.style.display = "none"
        usernameInput.value = ""
        passwordInput.value = ""
        userNameInput.value = ""
        userAddressInput.value = ""
      }
    })
    .catch(err => alert("Registration failed"))
}

function logout() {
  currentUser = null
  authToken = null
  cart = []
  showAuth()
  usernameInput.value = ""
  passwordInput.value = ""
}

function formatCurrency(num) { return `$${num.toFixed(2)}` }

function getPaymentMethodName(paymentMethod) {
  const paymentNames = {
    'cash': 'Cash on Delivery',
    'card': 'Credit/Debit Card',
    'paypal': 'PayPal',
    'apple_pay': 'Apple Pay',
    'google_pay': 'Google Pay'
  }
  return paymentNames[paymentMethod] || paymentMethod
}

function loadStores() {
  fetch(`${API}/stores`)
    .then(r => r.json())
    .then(stores => {
      storesList.innerHTML = ""
      stores.forEach(store => {
        storeIdToStore[store.id] = store
        const li = document.createElement("li")
        const imageHtml = store.imageUrl ? `<img src="${store.imageUrl}" alt="${store.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;" onerror="this.style.display='none'">` : ''
        li.innerHTML = `
          <div style="display: flex; align-items: center; padding: 15px; border: 1px solid #e0e0e0; border-radius: 12px; margin-bottom: 15px; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s;">
            ${imageHtml}
            <div style="display: flex; flex-direction: column; flex: 1;">
              <span style="font-weight: bold; font-size: 1.2em; margin-bottom: 5px;">${store.name}</span>
              <span style="font-size: 0.9em; color: ${store.isOpen ? '#4CAF50' : '#f44336'}; margin-bottom: 3px;">${store.isOpen ? "🟢 Open" : "🔴 Closed"}</span>
              <span style="font-size: 0.85em; color: #666;">${store.address || "No address provided"}</span>
            </div>
          </div>
        `
        li.style.cursor = "pointer"
        li.style.listStyle = "none"
        li.onclick = () => loadStore(store.id)
        li.onmouseover = () => {
          li.querySelector('div').style.transform = "translateY(-2px)"
          li.querySelector('div').style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)"
        }
        li.onmouseout = () => {
          li.querySelector('div').style.transform = "translateY(0)"
          li.querySelector('div').style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"
        }
        storesList.appendChild(li)
      })
    })
    .catch(err => {
      console.error("Error loading stores:", err)
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
        
        if (p.stock > 0) {
          btn.textContent = "+"
          btn.onclick = () => addToCart(p.id)
          btn.style.backgroundColor = "#4CAF50"
        } else {
          btn.textContent = "Out of Stock"
          btn.disabled = true
          btn.style.backgroundColor = "#f44336"
        }
        
        const imageHtml = p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 12px;" onerror="this.style.display='none'">` : ''
        li.innerHTML = `
          <div style="display: flex; align-items: center; padding: 12px; border: 1px solid #e0e0e0; border-radius: 10px; margin-bottom: 10px; background-color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            ${imageHtml}
            <div style="display: flex; flex-direction: column; flex: 1;">
              <span style="font-weight: bold; font-size: 1.1em; margin-bottom: 3px;">${p.name}</span>
              <span style="font-size: 1em; color: #2E7D32; font-weight: 600; margin-bottom: 2px;">${formatCurrency(p.price)}</span>
              <span style="font-size: 0.85em; color: ${p.stock > 0 ? '#4CAF50' : '#f44336'};">
                ${p.stock > 0 ? `📦 ${p.stock} available` : '❌ Out of stock'}
              </span>
            </div>
          </div>
        `
        li.style.listStyle = "none"
        li.appendChild(btn)
        productsList.appendChild(li)
      })
    })
    .catch(err => {
      console.error("Error loading store:", err)
    })
}

function addToCart(productId) {
  const product = productIdToProduct[productId]
  if (!product) return alert("Product not found")
  
  const existing = cart.find(i => i.productId === productId)
  const currentQty = existing ? existing.qty : 0
  const newQty = currentQty + 1
  
  if (newQty > product.stock) {
    return alert(`Cannot add more items. Only ${product.stock} available in stock.`)
  }
  
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
  
  const product = productIdToProduct[productId]
  if (!product) return alert("Product not found")
  
  if (existing.qty + 1 > product.stock) {
    return alert(`Cannot add more items. Only ${product.stock} available in stock.`)
  }
  
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
  if (!currentUser) return
  
  // Fetch orders, stores, and drivers data
  Promise.all([
    fetch(`${API}/orders`).then(r => r.json()),
    fetch(`${API}/stores`).then(r => r.json()),
    fetch(`${API}/drivers`).then(r => r.json())
  ]).then(([allOrders, allStores, allDrivers]) => {
    ordersList.innerHTML = ""
    
    // Create maps for quick lookup
    const storeMap = {}
    allStores.forEach(store => {
      storeMap[store.id] = store
    })
    
    const driverMap = {}
    allDrivers.forEach(driver => {
      driverMap[driver.id] = driver
    })
    
    allOrders.filter(o => o.consumerId === currentUser.id).forEach(o => {
      const li = document.createElement("li")
      li.className = "order-item"
      
      const store = storeMap[o.storeId]
      const storeName = store ? store.name : o.storeId
      
      const itemsList = o.items.map(item => {
        const product = productIdToProduct[item.productId]
        const productName = product ? product.name : item.productId
        return `<div class="order-item-detail">• ${productName} x ${item.qty} - $${(item.price * item.qty).toFixed(2)}</div>`
      }).join("")
      
      const totalAmount = o.items.reduce((sum, item) => sum + (item.price * item.qty), 0)
      const paymentText = getPaymentMethodName(o.payment)
      
      // Get driver information if driver is assigned
      let driverInfo = ""
      if (o.driverId && driverMap[o.driverId]) {
        const driver = driverMap[o.driverId]
        driverInfo = `
          <div class="order-driver">
            🚗 Driver: ${driver.name}
            <div class="driver-details">
              📞 Phone: ${driver.phone || 'Not provided'}
              🚙 Vehicle: ${driver.vehicle || 'Not specified'}
            </div>
          </div>
        `
      } else if (o.driverId) {
        driverInfo = `<div class="order-driver">🚗 Driver ID: ${o.driverId}</div>`
      }
      
      li.innerHTML = `
        <div class="order-header">
          <div class="order-id">Order #${o.id}</div>
          <div class="order-status ${o.status}">${o.status.toUpperCase()}</div>
        </div>
        <div class="order-details">
          <div class="order-store">🏪 Store: ${storeName}</div>
          <div class="order-items">${itemsList}</div>
          <div class="order-total">💰 Total: $${totalAmount.toFixed(2)}</div>
          <div class="order-payment">💳 Payment: ${paymentText}</div>
          <div class="order-address">📍 Address: ${o.address || 'Not specified'}</div>
          ${driverInfo}
        </div>
      `
      ordersList.appendChild(li)
    })
  }).catch(err => {
    console.error("Error loading orders:", err)
    ordersList.innerHTML = `
      <li class="error-message">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <div class="error-text">
            <strong>Error loading orders</strong>
            <div class="error-details">Please check your connection and try refreshing</div>
          </div>
        </div>
      </li>
    `
  })
}

placeOrderBtn.addEventListener("click", () => {
  if (!selectedStoreId || cart.length === 0) return alert("Pick a store and add products")
  if (!currentUser) return alert("Please login first")
  
  const selectedPayment = paymentMethodSelect.value
  if (!selectedPayment) return alert("Please select a payment method")
  
  fetch(`${API}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auth-token": authToken },
    body: JSON.stringify({
      consumerId: currentUser.id,
      storeId: selectedStoreId,
      items: cart,
      address: currentUser.address || "No address provided",
      payment: selectedPayment,
    }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.message) {
        alert(data.message)
      } else {
        cart = []
        renderCart()
        loadOrders()
        alert(`Order placed successfully! Payment method: ${getPaymentMethodName(selectedPayment)}`)
      }
    })
    .catch(err => alert("Failed to place order"))
})

// Event listeners
loginBtn.onclick = login
registerBtn.onclick = () => {
  if (registerFields.style.display === "none") {
    registerFields.style.display = "block"
  } else {
    register()
  }
}
logoutBtn.onclick = logout

// Refresh orders button
document.getElementById("refresh-orders").onclick = loadOrders

// Initialize
showAuth()