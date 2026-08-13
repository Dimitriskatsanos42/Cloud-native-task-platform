import express from "express";
import cors from "cors";
import { initDb, pool } from "./db.js";
import tasksRouter from "./routes/tasks.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Liveness probe target: does the process itself respond?
// Does NOT check the database - a DB outage should not kill the pod.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Readiness probe target: can this pod actually serve traffic?
// Checks DB connection - if DB is down, Kubernetes stops routing
// traffic here without restarting the pod.
app.get("/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ready" });
  } catch (err) {
    res.status(503).json({ status: "not ready", error: err.message });
  }
});

app.use("/api/tasks", tasksRouter);

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
