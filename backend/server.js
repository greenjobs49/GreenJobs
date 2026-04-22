require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");

const app = express();

// Trust reverse proxy (Crucial if your EC2/Server uses Nginx or a Load Balancer for HTTPS)
app.set("trust proxy", 1);

// ✅ 1. FIXED SECURITY HEADERS
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // <-- CRITICAL: Allows Vercel to read your API responses
  })
);

// ✅ 2. BULLETPROOF CORS CONFIGURATION
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://green-jobs-alpha.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean); // removes undefined values

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin: ${origin}`); // Will show in your server logs if a wrong URL tries to connect
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // <-- Explicitly allow these methods
  allowedHeaders: ["Content-Type", "Authorization"], // <-- Explicitly allow these headers
};

app.use(cors(corsOptions));
app.options("/{*path}", cors(corsOptions));

// Body parsers with payload limits (Prevents DoS)
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// DB connection
connectDB();

// Routes
app.use("/api/auth",         require("./routes/auth.routes"));
app.use("/api/profile",      require("./routes/profile.routes"));
app.use("/api/jobs",         require("./routes/job.routes"));
app.use("/api/admin",        require("./routes/admin.routes"));
app.use("/api/applications", require("./routes/application.routes"));
app.use("/api/ads",          require("./routes/ad.routes"));

app.get("/health", (req, res) => {
  res.json({ success: true, status: "OK", message: "Server is running" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err); 
  const isProd = process.env.NODE_ENV === "production";
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: isProd ? "Something went wrong processing your request" : err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));