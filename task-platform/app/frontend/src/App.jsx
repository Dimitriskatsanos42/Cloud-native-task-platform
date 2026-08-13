import { useEffect, useState } from "react";
import { getTasks, createTask, toggleTask, deleteTask } from "./api.js";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState(null);

  async function load() {
    try {
      setTasks(await getTasks());
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask(title.trim());
    setTitle("");
    load();
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Task Platform</h1>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Add</button>
      </form>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((t) => (
          <li key={t.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: 4 }}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggleTask(t.id, !t.done).then(load)}
            />
            <span style={{ flex: 1, textDecoration: t.done ? "line-through" : "none" }}>
              {t.title}
            </span>
            <button onClick={() => deleteTask(t.id).then(load)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
