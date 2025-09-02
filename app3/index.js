const API = "http://localhost:5050"

// Auth elements
const authSection = document.getElementById("auth-section")
const driverSection = document.getElementById("driver-section")
const usernameInput = document.getElementById("username")
const passwordInput = document.getElementById("password")
const loginBtn = document.getElementById("login-btn")
const registerBtn = document.getElementById("register-btn")
const registerFields = document.getElementById("register-fields")
const driverNameInput = document.getElementById("driver-name")
const driverPhoneInput = document.getElementById("driver-phone")
const driverVehicleInput = document.getElementById("driver-vehicle")
const currentDriverSpan = document.getElementById("current-driver")
const logoutBtn = document.getElementById("logout-btn")

// Driver elements
const availableUl = document.getElementById("available")
const myOrdersUl = document.getElementById("my-orders")
const refreshBtn = document.getElementById("refresh")

let currentDriver = null
let authToken = null

// Caches for order details
const storeIdToStore = {}
const productIdToProduct = {}

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

// Auth functions
function showAuth() {
  authSection.style.display = "block"
  driverSection.style.display = "none"
}

function showDriver() {
  authSection.style.display = "none"
  driverSection.style.display = "block"
}

function login() {
  const username = usernameInput.value.trim()
  const password = passwordInput.value.trim()
  
  if (!username || !password) return alert("Enter username and password")
  
  fetch(`${API}/drivers/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(r => r.json())
    .then(data => {
      if (data.message) {
        alert(data.message)
      } else {
        currentDriver = data.driver
        authToken = data.token
        currentDriverSpan.textContent = `Welcome, ${data.driver.name}`
        showDriver()
        loadAvailable()
        loadMyOrders()
      }
    })
    .catch(err => alert("Login failed"))
}

function register() {
  const username = usernameInput.value.trim()
  const password = passwordInput.value.trim()
  const name = driverNameInput.value.trim()
  const phone = driverPhoneInput.value.trim()
  const vehicle = driverVehicleInput.value.trim()
  
  if (!username || !password || !name) return alert("Enter all required fields")
  
  fetch(`${API}/drivers/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, name, phone, vehicle })
  })
    .then(r => r.json())
    .then(data => {
      if (data.message) {
        alert(data.message)
      } else {
        alert("Driver registered successfully! You can now login.")
        registerFields.style.display = "none"
        usernameInput.value = ""
        passwordInput.value = ""
        driverNameInput.value = ""
        driverPhoneInput.value = ""
        driverVehicleInput.value = ""
      }
    })
    .catch(err => alert("Registration failed"))
}

function logout() {
  currentDriver = null
  authToken = null
  showAuth()
  usernameInput.value = ""
  passwordInput.value = ""
}

function loadAvailable() {
  if (!currentDriver) return
  
  // Load stores and products first for detailed display
  Promise.all([
    fetch(`${API}/stores`).then(r => r.json()),
    fetch(`${API}/orders/available`).then(r => r.json())
  ]).then(([stores, orders]) => {
    // Cache store data
    stores.forEach(store => {
      storeIdToStore[store.id] = store
    })
    
    availableUl.innerHTML = ""
    orders.forEach(o => {
      const li = document.createElement("li")
      li.className = "available-order"
      
      const btn = document.createElement("button")
      btn.textContent = "Accept Order"
      btn.className = "accept-btn"
      btn.onclick = () => accept(o.id)
      
      const store = storeIdToStore[o.storeId]
      const storeName = store ? store.name : o.storeId
      const storeAddress = store ? store.address : ""
      
      const itemsList = o.items.map(item => {
        return `<div class="order-item-detail">• ${item.productId} x ${item.qty} - $${(item.price * item.qty).toFixed(2)}</div>`
      }).join("")
      
      const totalAmount = o.items.reduce((sum, item) => sum + (item.price * item.qty), 0)
      const paymentText = getPaymentMethodName(o.payment)
      
      li.innerHTML = `
        <div class="order-header">
          <div class="order-id">Order #${o.id}</div>
          <div class="order-status created">AVAILABLE</div>
        </div>
        <div class="order-details">
          <div class="order-store">🏪 Store: ${storeName}${storeAddress ? ` (${storeAddress})` : ""}</div>
          <div class="order-items">${itemsList}</div>
          <div class="order-total">💰 Total: $${totalAmount.toFixed(2)}</div>
          <div class="order-address">📍 Delivery to: ${o.address}</div>
          <div class="order-payment">💳 Payment: ${paymentText}</div>
        </div>
      `
      li.appendChild(btn)
      availableUl.appendChild(li)
    })
  })
}

function loadMyOrders() {
  if (!currentDriver) return
  
  fetch(`${API}/orders`).then(r => r.json()).then(all => {
    myOrdersUl.innerHTML = ""
    all.filter(o => o.driverId === currentDriver.id).forEach(o => {
      const li = document.createElement("li")
      li.className = "my-order"
      
      const store = storeIdToStore[o.storeId]
      const storeName = store ? store.name : o.storeId
      const storeAddress = store ? store.address : ""
      
      const itemsList = o.items.map(item => {
        return `<div class="order-item-detail">• ${item.productId} x ${item.qty} - $${(item.price * item.qty).toFixed(2)}</div>`
      }).join("")
      
      const totalAmount = o.items.reduce((sum, item) => sum + (item.price * item.qty), 0)
      const paymentText = getPaymentMethodName(o.payment)
      
      li.innerHTML = `
        <div class="order-header">
          <div class="order-id">Order #${o.id}</div>
          <div class="order-status ${o.status}">${o.status.toUpperCase()}</div>
        </div>
        <div class="order-details">
          <div class="order-store">🏪 Store: ${storeName}${storeAddress ? ` (${storeAddress})` : ""}</div>
          <div class="order-items">${itemsList}</div>
          <div class="order-total">💰 Total: $${totalAmount.toFixed(2)}</div>
          <div class="order-address">📍 Delivery to: ${o.address}</div>
          <div class="order-payment">💳 Payment: ${paymentText}</div>
        </div>
      `
      
      // Add appropriate action button based on status
      const actionBtn = document.createElement("button")
      if (o.status === "accepted") {
        actionBtn.textContent = "Pick Up Order"
        actionBtn.onclick = () => pickup(o.id)
      } else if (o.status === "picked_up") {
        actionBtn.textContent = "Mark as Delivered"
        actionBtn.onclick = () => deliver(o.id)
      } else {
        actionBtn.textContent = "Completed"
        actionBtn.disabled = true
      }
      
      li.appendChild(actionBtn)
      myOrdersUl.appendChild(li)
    })
  })
}

function accept(id) {
  if (!authToken) return alert("Please login first")
  
  fetch(`${API}/orders/${id}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auth-token": authToken }
  })
    .then(r => r.json())
    .then(data => {
      if (data.message) {
        alert(data.message)
      } else {
        loadAvailable()
        loadMyOrders()
      }
    })
    .catch(err => alert("Failed to accept order"))
}

function pickup(id) {
  if (!authToken) return alert("Please login first")
  
  fetch(`${API}/orders/${id}/pickup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auth-token": authToken }
  })
    .then(r => r.json())
    .then(data => {
      if (data.message) {
        alert(data.message)
      } else {
        loadMyOrders()
      }
    })
    .catch(err => alert("Failed to mark as picked up"))
}

function deliver(id) {
  if (!authToken) return alert("Please login first")
  
  fetch(`${API}/orders/${id}/deliver`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auth-token": authToken }
  })
    .then(r => r.json())
    .then(data => {
      if (data.message) {
        alert(data.message)
      } else {
        loadMyOrders()
      }
    })
    .catch(err => alert("Failed to mark as delivered"))
}

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
refreshBtn.onclick = loadAvailable

// Initialize
showAuth()