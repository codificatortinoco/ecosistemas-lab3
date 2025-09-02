const express = require("express")
const path = require("path")
const backend = require("./backend")

const app = express()

// Serve static files for the frontend apps
app.use("/app1", express.static(path.join(__dirname, "app1")))
app.use("/app2", express.static(path.join(__dirname, "app2")))
app.use("/app3", express.static(path.join(__dirname, "app3")))

// Use the backend API routes
app.use(backend)

app.listen(5050, () => {
  console.log("Server running on http://localhost:5050")
  console.log("Consumer App: http://localhost:5050/app1/")
  console.log("Store Admin: http://localhost:5050/app2/")
  console.log("Driver App: http://localhost:5050/app3/")
})
