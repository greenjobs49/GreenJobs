require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// ✅ 1. CORS — dynamic so env vars are always loaded
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      console.log("Request origin:", origin);
      console.log("Allowed origins:", allowedOrigins);

      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("CORS BLOCKED:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ 2. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 3. DB connection
connectDB();

// ✅ 4. Routes
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

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ success: false, message: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));