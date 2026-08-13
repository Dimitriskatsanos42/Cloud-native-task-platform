import pg from "pg";

const { Pool } = pg;

// All connection settings come from environment variables.
// In Kubernetes these are injected via ConfigMap (non-secret) + Secret (password).
// Never hardcode credentials here.
export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "taskdb",
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
