require("dotenv").config();
console.log('Env check:', {
  JWT_SECRET: process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing',
  DB_URL: process.env.DATABASE_URL ? '✅ Loaded' : '❌ Missing'
});
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();

// Enhanced CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origin === 'http://localhost:3000') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
  })
);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-strong-secret-here",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Body parsing middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

// Import routes
const zonesRouter = require("./trouverzone");
const analyzeRiskRouter = require("./analyzeRisk");
const suggestionsRouter = require("./routes/suggestions");
const routesRouter = require("./routes/routes");
const driversRouter = require("./routes/drivers");

// Apply routes
app.use("/api/drivers", driversRouter);
app.use("/api/zones", zonesRouter);
app.use("/api/risk", analyzeRiskRouter);
app.use("/api/suggestions", suggestionsRouter);
app.use("/api/route", routesRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database: ${process.env.DATABASE_URL || "Not configured"}`);
});

module.exports = app;
