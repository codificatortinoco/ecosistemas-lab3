const express = require("express")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cors())

// In-memory data store
let users = [
  { id: "u1", role: "consumer", name: "Alice", username: "alice", password: "123", address: "123 Main St" },
]

let userAccounts = [
  { id: "ua1", userId: "u1", username: "alice", password: "123" },
]

// Driver accounts (separate from users)
let drivers = [
  { id: "d1", name: "Bob", username: "bob", password: "123", phone: "555-0123", vehicle: "Honda Civic" },
]

let driverAccounts = [
  { id: "da1", driverId: "d1", username: "bob", password: "123" },
]

let stores = [
  { id: "s1", name: "Bodega Central", isOpen: true, description: "Mini market", address: "456 Oak Ave" },
  { id: "s2", name: "Pizza Nova", isOpen: true, description: "Italian pizzas", address: "789 Pine St" },
]

let storeAccounts = [
  { id: "sa1", storeId: "s1", username: "bodega", password: "123" },
  { id: "sa2", storeId: "s2", username: "pizza", password: "123" },
]

let products = [
  { id: "p1", storeId: "s1", name: "Water 500ml", price: 2.0, stock: 50 },
  { id: "p2", storeId: "s1", name: "Chips", price: 3.5, stock: 25 },
  { id: "p3", storeId: "s2", name: "Pepperoni Pizza", price: 12.0, stock: 10 },
]

let orders = [] // {id, consumerId, storeId, items:[{productId, qty, price}], status: created|accepted|picked_up|delivered, driverId?, address, payment}

// Simple in-memory sessions: token -> { accountId, storeId?, driverId? }
let sessions = []

function createSession(account) {
  const token = `t${Date.now()}_${Math.random().toString(36).slice(2)}`
  const session = { 
    token, 
    accountId: account.id, 
    storeId: account.storeId,
    driverId: account.driverId 
  }
  sessions.push(session)
  return session
}

function getSession(token) {
  return sessions.find(s => s.token === token)
}

function requireStoreAuth(req, res, next) {
  const token = req.header("x-auth-token")
  if (!token) return res.status(401).send({ message: "Missing auth token" })
  const session = getSession(token)
  if (!session) return res.status(401).send({ message: "Invalid auth token" })
  // If route has :id, ensure it matches the storeId of the session
  if (req.params && req.params.id && req.params.id !== session.storeId) {
    return res.status(403).send({ message: "Forbidden for this store" })
  }
  req.storeSession = session
  next()
}

function requireDriverAuth(req, res, next) {
  const token = req.header("x-auth-token")
  if (!token) return res.status(401).send({ message: "Missing auth token" })
  const session = getSession(token)
  if (!session) return res.status(401).send({ message: "Invalid auth token" })
  if (!session.driverId) return res.status(403).send({ message: "Driver authentication required" })
  req.driverSession = session
  next()
}

// Basic resources
app.get("/users", (req, res) => { res.status(200).send(users) })

// User authentication
app.post("/users/register", (req, res) => {
  const { name, address, username, password } = req.body
  if (!name || !username || !password) {
    return res.status(400).send({ message: "Missing required fields" })
  }
  
  // Check if username already exists
  if (userAccounts.find(ua => ua.username === username)) {
    return res.status(400).send({ message: "Username already exists" })
  }
  
  const userId = `u${users.length + 1}`
  const accountId = `ua${userAccounts.length + 1}`
  
  const newUser = { id: userId, role: "consumer", name, address: address || "", username }
  const newAccount = { id: accountId, userId, username, password }
  
  users.push(newUser)
  userAccounts.push(newAccount)
  
  res.status(201).send({ user: newUser, account: { username } })
})

app.post("/users/login", (req, res) => {
  const { username, password } = req.body
  const account = userAccounts.find(ua => ua.username === username && ua.password === password)
  
  if (!account) {
    return res.status(401).send({ message: "Invalid credentials" })
  }
  
  const user = users.find(u => u.id === account.userId)
  const session = createSession({ id: account.id, userId: account.userId })
  res.send({ user, account: { username }, token: session.token })
})

// Store authentication
app.post("/stores/register", (req, res) => {
  const { name, description, address, username, password } = req.body
  if (!name || !username || !password) {
    return res.status(400).send({ message: "Missing required fields" })
  }
  
  // Check if username already exists
  if (storeAccounts.find(sa => sa.username === username)) {
    return res.status(400).send({ message: "Username already exists" })
  }
  
  const storeId = `s${stores.length + 1}`
  const accountId = `sa${storeAccounts.length + 1}`
  
  const newStore = { id: storeId, name, description: description || "", address: address || "", isOpen: true }
  const newAccount = { id: accountId, storeId, username, password }
  
  stores.push(newStore)
  storeAccounts.push(newAccount)
  
  res.status(201).send({ store: newStore, account: { username } })
})

app.post("/stores/login", (req, res) => {
  const { username, password } = req.body
  const account = storeAccounts.find(sa => sa.username === username && sa.password === password)
  
  if (!account) {
    return res.status(401).send({ message: "Invalid credentials" })
  }
  
  const store = stores.find(s => s.id === account.storeId)
  const session = createSession(account)
  res.send({ store, account: { username }, token: session.token })
})

// Driver authentication
app.post("/drivers/register", (req, res) => {
  const { name, phone, vehicle, username, password } = req.body
  if (!name || !username || !password) {
    return res.status(400).send({ message: "Missing required fields" })
  }
  
  // Check if username already exists
  if (driverAccounts.find(da => da.username === username)) {
    return res.status(400).send({ message: "Username already exists" })
  }
  
  const driverId = `d${drivers.length + 1}`
  const accountId = `da${driverAccounts.length + 1}`
  
  const newDriver = { id: driverId, name, phone: phone || "", vehicle: vehicle || "", username }
  const newAccount = { id: accountId, driverId, username, password }
  
  drivers.push(newDriver)
  driverAccounts.push(newAccount)
  
  res.status(201).send({ driver: newDriver, account: { username } })
})

app.post("/drivers/login", (req, res) => {
  const { username, password } = req.body
  const account = driverAccounts.find(da => da.username === username && da.password === password)
  
  if (!account) {
    return res.status(401).send({ message: "Invalid credentials" })
  }
  
  const driver = drivers.find(d => d.id === account.driverId)
  const session = createSession(account)
  res.send({ driver, account: { username }, token: session.token })
})

// Stores
app.get("/stores", (req, res) => { res.send(stores) })
app.get("/stores/:id", (req, res) => {
  const store = stores.find(s => s.id === req.params.id)
  if (!store) return res.status(404).send({ message: "Store not found" })
  const storeProducts = products.filter(p => p.storeId === store.id)
  res.send({ ...store, products: storeProducts })
})
app.patch("/stores/:id/toggle", requireStoreAuth, (req, res) => {
  const store = stores.find(s => s.id === req.params.id)
  if (!store) return res.status(404).send({ message: "Store not found" })
  store.isOpen = !store.isOpen
  res.send(store)
})

// Products (store admin)
app.post("/stores/:id/products", requireStoreAuth, (req, res) => {
  const store = stores.find(s => s.id === req.params.id)
  if (!store) return res.status(404).send({ message: "Store not found" })
  const { name, price, stock } = req.body
  if (!name || !price || stock === undefined) {
    return res.status(400).send({ message: "Missing required fields: name, price, stock" })
  }
  const product = { id: `p${products.length + 1}`, storeId: store.id, name, price, stock: parseInt(stock) || 0 }
  products.push(product)
  res.status(201).send(product)
})

// Update product stock
app.patch("/stores/:id/products/:productId/stock", requireStoreAuth, (req, res) => {
  const store = stores.find(s => s.id === req.params.id)
  if (!store) return res.status(404).send({ message: "Store not found" })
  
  const product = products.find(p => p.id === req.params.productId && p.storeId === store.id)
  if (!product) return res.status(404).send({ message: "Product not found" })
  
  const { stock } = req.body
  if (stock === undefined) {
    return res.status(400).send({ message: "Stock value is required" })
  }
  
  product.stock = parseInt(stock) || 0
  res.send(product)
})

// Check product availability
app.get("/products/:id/availability", (req, res) => {
  const product = products.find(p => p.id === req.params.id)
  if (!product) return res.status(404).send({ message: "Product not found" })
  res.send({ productId: product.id, stock: product.stock, available: product.stock > 0 })
})

// Orders
app.get("/orders", (req, res) => { res.send(orders) })
app.get("/orders/available", (req, res) => {
  res.send(orders.filter(o => o.status === "created"))
})
app.post("/orders", (req, res) => {
  const { consumerId, storeId, items, address, payment } = req.body
  
  // Validate stock availability before creating order
  const orderItems = []
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)
    if (!product) {
      return res.status(400).send({ message: `Product ${item.productId} not found` })
    }
    if (product.stock < item.qty) {
      return res.status(400).send({ 
        message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.qty}` 
      })
    }
    orderItems.push({ productId: item.productId, qty: item.qty, price: product.price })
  }
  
  // Create order and reduce stock
  const order = {
    id: `o${orders.length + 1}`,
    consumerId,
    storeId,
    items: orderItems,
    address,
    payment,
    status: "created",
  }
  orders.push(order)
  
  // Reduce stock for each item
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)
    product.stock -= item.qty
  }
  
  res.status(201).send(order)
})

// Order management with driver authentication
app.post("/orders/:id/accept", requireDriverAuth, (req, res) => {
  const order = orders.find(o => o.id === req.params.id)
  if (!order) return res.status(404).send({ message: "Order not found" })
  if (order.status !== "created") return res.status(400).send({ message: "Order not available" })
  order.status = "accepted"
  order.driverId = req.driverSession.driverId
  res.send(order)
})

app.post("/orders/:id/pickup", requireDriverAuth, (req, res) => {
  const order = orders.find(o => o.id === req.params.id)
  if (!order) return res.status(404).send({ message: "Order not found" })
  if (order.status !== "accepted") return res.status(400).send({ message: "Order must be accepted first" })
  if (order.driverId !== req.driverSession.driverId) return res.status(403).send({ message: "Not your order" })
  order.status = "picked_up"
  res.send(order)
})

app.post("/orders/:id/deliver", requireDriverAuth, (req, res) => {
  const order = orders.find(o => o.id === req.params.id)
  if (!order) return res.status(404).send({ message: "Order not found" })
  if (order.status !== "picked_up") return res.status(400).send({ message: "Order must be picked up first" })
  if (order.driverId !== req.driverSession.driverId) return res.status(403).send({ message: "Not your order" })
  order.status = "delivered"
  res.send(order)
})

// Export the app for use in other files
module.exports = app
