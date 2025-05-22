require("dotenv").config()
const express = require("express")
const cors = require("cors")
const session = require("express-session")
const rateLimit = require("express-rate-limit")
const https = require("https")
const fs = require("fs")

// Import des routeurs
const zonesRouter = require("./trouverzone")
const analyzeRiskRouter = require("./analyzeRisk")
const suggestionsRouter = require("./routes/suggestions")
const routesRouter = require("./routes/routes")

const app = express()

// Configuration CORS correcte pour withCredentials
app.use(
  cors({
    origin: "http://localhost:3000", // Spécifiez l'origine exacte au lieu de "*"
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret-key-for-development",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
  }),
)

// Middleware pour le parsing JSON
app.use(express.json({ limit: "50mb" }))

// Rate limiter for geocoder requests (1 request per second)
const geocoderLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 1, // 1 request per second
  message: "Too many requests to the geocoder, please wait a moment.",
})

// Monter les routeurs
app.use("/api/zones", zonesRouter)
app.use("/api/risk", analyzeRiskRouter)
app.use("/api/suggestions", geocoderLimiter, suggestionsRouter)
app.use("/api/route", routesRouter)

// Route de test
app.get("/", (req, res) => {
  res.send("Serveur backend en cours d'exécution !")
})

// Démarrer le serveur en HTTP
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})

module.exports = app
