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
        li.textContent = `${store.name} ${store.isOpen ? "(open)" : "(closed)"}${store.address ? ` - ${store.address}` : ""}`
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
        
        if (p.stock > 0) {
          btn.textContent = "+"
          btn.onclick = () => addToCart(p.id)
          btn.style.backgroundColor = "#4CAF50"
        } else {
          btn.textContent = "Out of Stock"
          btn.disabled = true
          btn.style.backgroundColor = "#f44336"
        }
        
        li.innerHTML = `
          <span>${p.name} - ${formatCurrency(p.price)} 
            <span style="color: ${p.stock > 0 ? 'green' : 'red'}; font-size: 0.9em;">
              (${p.stock} available)
            </span>
          </span>
        `
        li.appendChild(btn)
        productsList.appendChild(li)
      })
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
  
  fetch(`${API}/orders`, {
    headers: { "x-auth-token": authToken }
  })
    .then(r => r.json())
    .then(all => {
      ordersList.innerHTML = ""
      all.filter(o => o.consumerId === currentUser.id).forEach(o => {
        const li = document.createElement("li")
        const store = storeIdToStore[o.storeId]
        const storeName = store ? store.name : o.storeId
        const itemsText = o.items.map(item => {
          const product = productIdToProduct[item.productId]
          return `${product ? product.name : item.productId} x ${item.qty}`
        }).join(", ")
        const paymentText = getPaymentMethodName(o.payment)
        li.textContent = `${o.id} - ${o.status} from ${storeName}: ${itemsText} (Payment: ${paymentText})`
        ordersList.appendChild(li)
      })
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

// Initialize
showAuth()