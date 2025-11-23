import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ---------------- CORS FIX ----------------
app.use(
  cors({
    origin: ["http://localhost:3000", "https://forgeerp.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------- MONGODB CONNECTION FIX -------------
if (!process.env.MONGODB_LIVE) {
  console.error("❌ ERROR: MONGODB_LIVE not found in .env");
} else {
  mongoose
    .connect(process.env.MONGODB_LIVE)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("❌ MongoDB Error:", err));
}

// ---------------- ROUTES ----------------
import authRoutes from "./routes/auth.routes.js";
import incomingStockRoutes from "./routes/incomingStock.routes.js";
import cuttingRoutes from "./routes/cutting.routes.js";
import forgingRoutes from "./routes/forging.routes.js";
import dispatchRoutes from './routes/dispatchRoutes.js';

app.use("/auth", authRoutes);
app.use("/incoming-stock", incomingStockRoutes);
app.use("/cutting", cuttingRoutes);
app.use("/forging", forgingRoutes);
app.use("/dispatch", dispatchRoutes);

// ---------------- DEFAULT ROUTE ----------------
app.get("/", (req, res) => {
  res.json({
    message: "Forge ERP API Working",
    version: "2.0.0",
  });
});

// ---------------- 404 Handler ----------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ---------------- SERVER START ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
