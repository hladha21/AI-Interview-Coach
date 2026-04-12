require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/sessions");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use("/auth", authRoutes);
app.use("/sessions", sessionRoutes);
app.use("/users", userRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () =>
  console.log(`✅ Node backend running on http://localhost:${PORT}`)
);