const express = require("express")
const path = require("path")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cors())
app.use("/app1", express.static(path.join(__dirname, "app1")))
app.use("/app2", express.static(path.join(__dirname, "app2")))
app.use("/app3", express.static(path.join(__dirname, "app3")))

// In-memory data store
let users = [
  { id: "u1", role: "consumer", name: "Alice" },
  { id: "u3", role: "driver", name: "Bob" },
]

let stores = [
  { id: "s1", name: "Bodega Central", isOpen: true, description: "Mini market" },
  { id: "s2", name: "Pizza Nova", isOpen: true, description: "Italian pizzas" },
]

let storeAccounts = [
  { id: "sa1", storeId: "s1", username: "bodega", password: "123" },
  { id: "sa2", storeId: "s2", username: "pizza", password: "123" },
]

let products = [
  { id: "p1", storeId: "s1", name: "Water 500ml", price: 2.0 },
  { id: "p2", storeId: "s1", name: "Chips", price: 3.5 },
  { id: "p3", storeId: "s2", name: "Pepperoni Pizza", price: 12.0 },
]

let orders = [] // {id, consumerId, storeId, items:[{productId, qty, price}], status: created|accepted|delivered, driverId?, address, payment}

// Simple in-memory sessions: token -> { accountId, storeId }
let sessions = []

function createSession(account) {
  const token = `t${Date.now()}_${Math.random().toString(36).slice(2)}`
  const session = { token, accountId: account.id, storeId: account.storeId }
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

// Basic resources
app.get("/users", (req, res) => { res.status(200).send(users) })

// Store authentication
app.post("/stores/register", (req, res) => {
  const { name, description, username, password } = req.body
  if (!name || !username || !password) {
    return res.status(400).send({ message: "Missing required fields" })
  }
  
  // Check if username already exists
  if (storeAccounts.find(sa => sa.username === username)) {
    return res.status(400).send({ message: "Username already exists" })
  }
  
  const storeId = `s${stores.length + 1}`
  const accountId = `sa${storeAccounts.length + 1}`
  
  const newStore = { id: storeId, name, description: description || "", isOpen: true }
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
  const { name, price } = req.body
  const product = { id: `p${products.length + 1}`, storeId: store.id, name, price }
  products.push(product)
  res.status(201).send(product)
})

// Orders
app.get("/orders", (req, res) => { res.send(orders) })
app.get("/orders/available", (req, res) => {
  res.send(orders.filter(o => o.status === "created"))
})
app.post("/orders", (req, res) => {
  const { consumerId, storeId, items, address, payment } = req.body
  const orderItems = items.map(it => {
    const product = products.find(p => p.id === it.productId)
    return { productId: it.productId, qty: it.qty, price: product ? product.price : 0 }
  })
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
  res.status(201).send(order)
})
app.post("/orders/:id/accept", (req, res) => {
  const { driverId } = req.body
  const order = orders.find(o => o.id === req.params.id)
  if (!order) return res.status(404).send({ message: "Order not found" })
  if (order.status !== "created") return res.status(400).send({ message: "Order not available" })
  order.status = "accepted"
  order.driverId = driverId
  res.send(order)
})
app.post("/orders/:id/deliver", (req, res) => {
  const order = orders.find(o => o.id === req.params.id)
  if (!order) return res.status(404).send({ message: "Order not found" })
  order.status = "delivered"
  res.send(order)
})

app.listen(5050)
