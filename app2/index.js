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
const currentStoreSpan = document.getElementById("current-store")
const logoutBtn = document.getElementById("logout-btn")


const toggleOpenBtn = document.getElementById("toggle-open")
const productsUl = document.getElementById("products")
const ordersUl = document.getElementById("orders")
const createBtn = document.getElementById("create-product")
const prodName = document.getElementById("prod-name")
const prodPrice = document.getElementById("prod-price")

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
  
  if (!username || !password || !storeName) return alert("Enter all required fields")
  
  fetch(`${API}/stores/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, name: storeName, description: storeDesc })
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
      li.textContent = `${p.name} - $${p.price}`
      productsUl.appendChild(li)
    })
  })
  loadOrders()
}

function loadOrders() {
  if (!currentStore) return
  
  fetch(`${API}/orders`).then(r => r.json()).then(all => {
    ordersUl.innerHTML = ""
    all.filter(o => o.storeId === currentStore.id).forEach(o => {
      const li = document.createElement("li")
      li.textContent = `${o.id} - ${o.status} (${o.items.length} items)`
      ordersUl.appendChild(li)
    })
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

createBtn.onclick = () => {
  if (!currentStore) return
  const name = prodName.value.trim()
  const price = parseFloat(prodPrice.value)
  if (!name || isNaN(price)) return alert("Enter name and price")
  fetch(`${API}/stores/${currentStore.id}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auth-token": authToken },
    body: JSON.stringify({ name, price })
  }).then(() => { prodName.value = ""; prodPrice.value = ""; loadStoreData() })
}

// Initialize
showAuth()
