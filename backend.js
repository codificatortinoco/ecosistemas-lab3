const express = require("express")
const cors = require("cors")
const FileSystemDatabase = require("./database/database")

const app = express()

app.use(express.json())
app.use(cors())

// Initialize file system database
const db = new FileSystemDatabase()

// Initialize database with default data on startup
db.initializeDefaultData().catch(console.error)

async function createSession(account) {
  return await db.createSession({
    accountId: account.id,
    storeId: account.storeId,
    driverId: account.driverId
  })
}

async function getSession(token) {
  return await db.getSession(token)
}

async function requireStoreAuth(req, res, next) {
  try {
    const token = req.header("x-auth-token")
    if (!token) return res.status(401).send({ message: "Missing auth token" })
    const session = await getSession(token)
    if (!session) return res.status(401).send({ message: "Invalid auth token" })
    // If route has :id, ensure it matches the storeId of the session
    if (req.params && req.params.id && req.params.id !== session.storeId) {
      return res.status(403).send({ message: "Forbidden for this store" })
    }
    req.storeSession = session
    next()
  } catch (error) {
    res.status(500).send({ message: "Authentication error" })
  }
}

async function requireDriverAuth(req, res, next) {
  try {
    const token = req.header("x-auth-token")
    if (!token) return res.status(401).send({ message: "Missing auth token" })
    const session = await getSession(token)
    if (!session) return res.status(401).send({ message: "Invalid auth token" })
    if (!session.driverId) return res.status(403).send({ message: "Driver authentication required" })
    req.driverSession = session
    next()
  } catch (error) {
    res.status(500).send({ message: "Authentication error" })
  }
}

// Basic resources
app.get("/users", async (req, res) => {
  try {
    const users = await db.getAll('users')
    res.status(200).send(users)
  } catch (error) {
    res.status(500).send({ message: "Error fetching users" })
  }
})

// User authentication
app.post("/users/register", async (req, res) => {
  try {
    const { name, address, username, password } = req.body
    if (!name || !username || !password) {
      return res.status(400).send({ message: "Missing required fields" })
    }
    
    // Check if username already exists
    if (await db.isUsernameTaken(username)) {
      return res.status(400).send({ message: "Username already exists" })
    }
    
    const userId = `u${Date.now()}_${Math.random().toString(36).slice(2)}`
    const accountId = `ua${Date.now()}_${Math.random().toString(36).slice(2)}`
    
    const newUser = { id: userId, role: "consumer", name, address: address || "", username }
    const newAccount = { id: accountId, userId, username, password }
    
    await db.create('users', newUser)
    await db.create('userAccounts', newAccount)
    
    res.status(201).send({ user: newUser, account: { username } })
  } catch (error) {
    res.status(500).send({ message: "Registration failed" })
  }
})

app.post("/users/login", async (req, res) => {
  try {
    const { username, password } = req.body
    const account = await db.findUserAccount(username, password)
    
    if (!account) {
      return res.status(401).send({ message: "Invalid credentials" })
    }
    
    const user = await db.findUserByAccountId(account.id)
    const session = await createSession({ id: account.id, userId: account.userId })
    res.send({ user, account: { username }, token: session.token })
  } catch (error) {
    res.status(500).send({ message: "Login failed" })
  }
})

// Store authentication
app.post("/stores/register", async (req, res) => {
  try {
    const { name, description, address, username, password } = req.body
    if (!name || !username || !password) {
      return res.status(400).send({ message: "Missing required fields" })
    }
    
    // Check if username already exists
    if (await db.isUsernameTaken(username)) {
      return res.status(400).send({ message: "Username already exists" })
    }
    
    const storeId = `s${Date.now()}_${Math.random().toString(36).slice(2)}`
    const accountId = `sa${Date.now()}_${Math.random().toString(36).slice(2)}`
    
    const newStore = { id: storeId, name, description: description || "", address: address || "", isOpen: true }
    const newAccount = { id: accountId, storeId, username, password }
    
    await db.create('stores', newStore)
    await db.create('storeAccounts', newAccount)
    
    res.status(201).send({ store: newStore, account: { username } })
  } catch (error) {
    res.status(500).send({ message: "Registration failed" })
  }
})

app.post("/stores/login", async (req, res) => {
  try {
    const { username, password } = req.body
    const account = await db.findStoreAccount(username, password)
    
    if (!account) {
      return res.status(401).send({ message: "Invalid credentials" })
    }
    
    const store = await db.findStoreByAccountId(account.id)
    const session = await createSession(account)
    res.send({ store, account: { username }, token: session.token })
  } catch (error) {
    res.status(500).send({ message: "Login failed" })
  }
})

// Driver authentication
app.post("/drivers/register", async (req, res) => {
  try {
    const { name, phone, vehicle, username, password } = req.body
    if (!name || !username || !password) {
      return res.status(400).send({ message: "Missing required fields" })
    }
    
    // Check if username already exists
    if (await db.isUsernameTaken(username)) {
      return res.status(400).send({ message: "Username already exists" })
    }
    
    const driverId = `d${Date.now()}_${Math.random().toString(36).slice(2)}`
    const accountId = `da${Date.now()}_${Math.random().toString(36).slice(2)}`
    
    const newDriver = { id: driverId, name, phone: phone || "", vehicle: vehicle || "", username }
    const newAccount = { id: accountId, driverId, username, password }
    
    await db.create('drivers', newDriver)
    await db.create('driverAccounts', newAccount)
    
    res.status(201).send({ driver: newDriver, account: { username } })
  } catch (error) {
    res.status(500).send({ message: "Registration failed" })
  }
})

app.post("/drivers/login", async (req, res) => {
  try {
    const { username, password } = req.body
    const account = await db.findDriverAccount(username, password)
    
    if (!account) {
      return res.status(401).send({ message: "Invalid credentials" })
    }
    
    const driver = await db.findDriverByAccountId(account.id)
    const session = await createSession(account)
    res.send({ driver, account: { username }, token: session.token })
  } catch (error) {
    res.status(500).send({ message: "Login failed" })
  }
})

// Stores
app.get("/stores", async (req, res) => {
  try {
    const stores = await db.getAll('stores')
    res.send(stores)
  } catch (error) {
    res.status(500).send({ message: "Error fetching stores" })
  }
})

app.get("/stores/:id", async (req, res) => {
  try {
    const store = await db.getStoreWithProducts(req.params.id)
    if (!store) return res.status(404).send({ message: "Store not found" })
    res.send(store)
  } catch (error) {
    res.status(500).send({ message: "Error fetching store" })
  }
})

app.patch("/stores/:id/toggle", requireStoreAuth, async (req, res) => {
  try {
    const store = await db.getById('stores', req.params.id)
    if (!store) return res.status(404).send({ message: "Store not found" })
    const updatedStore = await db.update('stores', req.params.id, { isOpen: !store.isOpen })
    res.send(updatedStore)
  } catch (error) {
    res.status(500).send({ message: "Error updating store" })
  }
})

// Products (store admin)
app.post("/stores/:id/products", requireStoreAuth, async (req, res) => {
  try {
    const store = await db.getById('stores', req.params.id)
    if (!store) return res.status(404).send({ message: "Store not found" })
    
    const { name, price, stock } = req.body
    if (!name || !price || stock === undefined) {
      return res.status(400).send({ message: "Missing required fields: name, price, stock" })
    }
    
    const product = { 
      id: `p${Date.now()}_${Math.random().toString(36).slice(2)}`, 
      storeId: store.id, 
      name, 
      price, 
      stock: parseInt(stock) || 0 
    }
    
    await db.create('products', product)
    res.status(201).send(product)
  } catch (error) {
    res.status(500).send({ message: "Error creating product" })
  }
})

// Update product stock
app.patch("/stores/:id/products/:productId/stock", requireStoreAuth, async (req, res) => {
  try {
    const store = await db.getById('stores', req.params.id)
    if (!store) return res.status(404).send({ message: "Store not found" })
    
    const product = await db.getById('products', req.params.productId)
    if (!product || product.storeId !== store.id) {
      return res.status(404).send({ message: "Product not found" })
    }
    
    const { stock } = req.body
    if (stock === undefined) {
      return res.status(400).send({ message: "Stock value is required" })
    }
    
    const updatedProduct = await db.updateProductStock(req.params.productId, parseInt(stock) || 0)
    res.send(updatedProduct)
  } catch (error) {
    res.status(500).send({ message: "Error updating product stock" })
  }
})

// Check product availability
app.get("/products/:id/availability", async (req, res) => {
  try {
    const product = await db.getById('products', req.params.id)
    if (!product) return res.status(404).send({ message: "Product not found" })
    res.send({ productId: product.id, stock: product.stock, available: product.stock > 0 })
  } catch (error) {
    res.status(500).send({ message: "Error checking product availability" })
  }
})

// Orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await db.getAll('orders')
    res.send(orders)
  } catch (error) {
    res.status(500).send({ message: "Error fetching orders" })
  }
})

app.get("/orders/available", async (req, res) => {
  try {
    const orders = await db.getAvailableOrders()
    res.send(orders)
  } catch (error) {
    res.status(500).send({ message: "Error fetching available orders" })
  }
})

app.post("/orders", async (req, res) => {
  try {
    const { consumerId, storeId, items, address, payment } = req.body
    
    const order = await db.createOrder({
      consumerId,
      storeId,
      items,
      address,
      payment
    })
    
    res.status(201).send(order)
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
      return res.status(400).send({ message: error.message })
    }
    res.status(500).send({ message: "Error creating order" })
  }
})

// Order management with driver authentication
app.post("/orders/:id/accept", requireDriverAuth, async (req, res) => {
  try {
    const order = await db.getById('orders', req.params.id)
    if (!order) return res.status(404).send({ message: "Order not found" })
    if (order.status !== "created") return res.status(400).send({ message: "Order not available" })
    
    const updatedOrder = await db.update('orders', req.params.id, {
      status: "accepted",
      driverId: req.driverSession.driverId
    })
    res.send(updatedOrder)
  } catch (error) {
    res.status(500).send({ message: "Error accepting order" })
  }
})

app.post("/orders/:id/pickup", requireDriverAuth, async (req, res) => {
  try {
    const order = await db.getById('orders', req.params.id)
    if (!order) return res.status(404).send({ message: "Order not found" })
    if (order.status !== "accepted") return res.status(400).send({ message: "Order must be accepted first" })
    if (order.driverId !== req.driverSession.driverId) return res.status(403).send({ message: "Not your order" })
    
    const updatedOrder = await db.update('orders', req.params.id, { status: "picked_up" })
    res.send(updatedOrder)
  } catch (error) {
    res.status(500).send({ message: "Error updating order pickup" })
  }
})

app.post("/orders/:id/deliver", requireDriverAuth, async (req, res) => {
  try {
    const order = await db.getById('orders', req.params.id)
    if (!order) return res.status(404).send({ message: "Order not found" })
    if (order.status !== "picked_up") return res.status(400).send({ message: "Order must be picked up first" })
    if (order.driverId !== req.driverSession.driverId) return res.status(403).send({ message: "Not your order" })
    
    const updatedOrder = await db.update('orders', req.params.id, { status: "delivered" })
    res.send(updatedOrder)
  } catch (error) {
    res.status(500).send({ message: "Error updating order delivery" })
  }
})

// Export the app for use in other files
module.exports = app
