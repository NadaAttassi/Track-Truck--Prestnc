const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

// Driver login endpoint
router.post("/login", async (req, res) => {
  try {
    const { matricule, password } = req.body;

    // Validate input
    if (!matricule || !password) {
      return res.status(400).json({ error: "Matricule and password are required" });
    }

    // Find truck/driver
    const result = await db.query(
      "SELECT * FROM trucks WHERE license_plate = $1",
      [matricule]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid matricule or password" });
    }

    const truck = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, truck.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid matricule or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        truckId: truck.license_plate
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Set cookie (optional)
    res.cookie("driverToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    res.json({
      success: true,
      token,
      truck: {
        license_plate: truck.license_plate,
        make: truck.make,
        model: truck.model,
        cargo_type: truck.cargo_type
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Driver logout endpoint
router.post("/logout", (req, res) => {
  res.clearCookie("driverToken");
  res.json({ success: true, message: "Logged out successfully" });
});

// Driver profile endpoint
router.get("/profile", async (req, res) => {
  try {
    const token = req.cookies.driverToken || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query(
      "SELECT license_plate, make, model FROM trucks WHERE license_plate = $1",
      [decoded.truckId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Truck not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
