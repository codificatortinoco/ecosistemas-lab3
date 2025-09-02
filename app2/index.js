const API = "http://localhost:5050"


const authSection = document.getElementById("auth-section")
const storeSection = document.getElementById("store-section")
const usernameInput = document.getElementById("username")
const passwordInput = document.getElementById("password")
const loginBtn = document.getElementById("login-btn")
const registerBtn = document.getElementById("register-btn")
const registerFields = document.getElementById("register-fields")
const storeNameInput = document.getElementById("store-name")
const storeDescInput = document.getElementById("store-description")
const storeAddressInput = document.getElementById("store-address")
const currentStoreSpan = document.getElementById("current-store")
const logoutBtn = document.getElementById("logout-btn")


const toggleOpenBtn = document.getElementById("toggle-open")
const productsUl = document.getElementById("products")
const ordersUl = document.getElementById("orders")
const createBtn = document.getElementById("create-product")
const prodName = document.getElementById("prod-name")
const prodPrice = document.getElementById("prod-price")
const prodStock = document.getElementById("prod-stock")

let currentStore = null
let authToken = null


function showAuth() {
  authSection.style.display = "block"
  storeSection.style.display = "none"
}

function showStore() {
  authSection.style.display = "none"
  storeSection.style.display = "block"
}

function login() {
  const username = usernameInput.value.trim()
  const password = passwordInput.value.trim()
  
  if (!username || !password) return alert("Enter username and password")
  
  fetch(`${API}/stores/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(r => r.json())
    .then(data => {
      if (data.message) {
        alert(data.message)
      } else {
        currentStore = data.store
        authToken = data.token
        currentStoreSpan.textContent = `${data.store.name} (${data.store.isOpen ? "open" : "closed"})`
        showStore()
        loadStoreData()
      }
    })
    .catch(err => alert("Login failed"))
}

function register() {
  const username = usernameInput.value.trim()
  const password = passwordInput.value.trim()
  const storeName = storeNameInput.value.trim()
  const storeDesc = storeDescInput.value.trim()
  const storeAddress = storeAddressInput.value.trim()
  
  if (!username || !password || !storeName) return alert("Enter all required fields")
  
  fetch(`${API}/stores/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, name: storeName, description: storeDesc, address: storeAddress })
  })
    .then(r => r.json())
    .then(data => {
      if (data.message) {
        alert(data.message)
      } else {
        alert("Store registered successfully! You can now login.")
        registerFields.style.display = "none"
        usernameInput.value = ""
        passwordInput.value = ""
        storeNameInput.value = ""
        storeDescInput.value = ""
        storeAddressInput.value = ""
      }
    })
    .catch(err => alert("Registration failed"))
}

function logout() {
  currentStore = null
  authToken = null
  showAuth()
  usernameInput.value = ""
  passwordInput.value = ""
}

// Store management functions
function loadStoreData() {
  if (!currentStore) return
  
  fetch(`${API}/stores/${currentStore.id}`).then(r => r.json()).then(store => {
    productsUl.innerHTML = ""
    store.products.forEach(p => {
      const li = document.createElement("li")
      li.innerHTML = `
        <div>
          <strong>${p.name}</strong> - $${p.price} 
          <span style="color: ${p.stock > 0 ? 'green' : 'red'}">(Stock: ${p.stock})</span>
        </div>
        <div>
          <input type="number" id="stock-${p.id}" placeholder="New stock" min="0" style="width: 100px; margin-right: 5px;" />
          <button onclick="updateStock('${p.id}')">Update Stock</button>
        </div>
      `
      productsUl.appendChild(li)
    })
  })
  loadOrders()
}

function loadOrders() {
  if (!currentStore) return
  
  // Fetch both orders and drivers data
  Promise.all([
    fetch(`${API}/orders`).then(r => r.json()),
    fetch(`${API}/drivers`).then(r => r.json())
  ]).then(([allOrders, allDrivers]) => {
    ordersUl.innerHTML = ""
    
    // Create a map of driver IDs to driver data
    const driverMap = {}
    allDrivers.forEach(driver => {
      driverMap[driver.id] = driver
    })
    
    allOrders.filter(o => o.storeId === currentStore.id).forEach(o => {
      const li = document.createElement("li")
      li.className = "order-item"
      
      const itemsList = o.items.map(item => {
        return `<div class="order-item-detail">• ${item.productId} x ${item.qty} - $${(item.price * item.qty).toFixed(2)}</div>`
      }).join("")
      
      const totalAmount = o.items.reduce((sum, item) => sum + (item.price * item.qty), 0)
      
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
          <div class="order-items">${itemsList}</div>
          <div class="order-total">💰 Total: $${totalAmount.toFixed(2)}</div>
          <div class="order-address">📍 Address: ${o.address || 'Not specified'}</div>
          ${driverInfo}
        </div>
      `
      ordersUl.appendChild(li)
    })
  }).catch(err => {
    console.error("Error loading orders:", err)
    ordersUl.innerHTML = `
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

toggleOpenBtn.onclick = () => {
  if (!currentStore) return
  fetch(`${API}/stores/${currentStore.id}/toggle`, { method: "PATCH", headers: { "x-auth-token": authToken } })
    .then(r => r.json()).then(store => {
      currentStore = store
      currentStoreSpan.textContent = `${store.name} (${store.isOpen ? "open" : "closed"})`
    })
}

function updateStock(productId) {
  if (!currentStore) return
  const stockInput = document.getElementById(`stock-${productId}`)
  const newStock = parseInt(stockInput.value)
  if (isNaN(newStock) || newStock < 0) return alert("Enter a valid stock quantity")
  
  fetch(`${API}/stores/${currentStore.id}/products/${productId}/stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-auth-token": authToken },
    body: JSON.stringify({ stock: newStock })
  })
    .then(r => r.json())
    .then(data => {
      if (data.message) {
        alert(data.message)
      } else {
        stockInput.value = ""
        loadStoreData()
      }
    })
    .catch(err => alert("Failed to update stock"))
}

createBtn.onclick = () => {
  if (!currentStore) return
  const name = prodName.value.trim()
  const price = parseFloat(prodPrice.value)
  const stock = parseInt(prodStock.value)
  if (!name || isNaN(price) || isNaN(stock)) return alert("Enter name, price, and stock")
  fetch(`${API}/stores/${currentStore.id}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auth-token": authToken },
    body: JSON.stringify({ name, price, stock })
  }).then(() => { 
    prodName.value = ""; 
    prodPrice.value = ""; 
    prodStock.value = ""; 
    loadStoreData() 
  })
}

// Refresh orders button
document.getElementById("refresh-orders").onclick = loadOrders

// Initialize
showAuth()
