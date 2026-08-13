import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, done, created_at FROM tasks ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks:", err.message);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.post("/", async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, done, created_at",
      [title.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating task:", err.message);
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { done } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tasks SET done = $1 WHERE id = $2 RETURNING id, title, done, created_at",
      [Boolean(done), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating task:", err.message);
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting task:", err.message);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
