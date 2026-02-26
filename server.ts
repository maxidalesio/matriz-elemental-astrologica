import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("astrology.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    utcOffset INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/people", (req, res) => {
    try {
      const people = db.prepare("SELECT * FROM people ORDER BY name ASC").all();
      res.json(people);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch people" });
    }
  });

  app.post("/api/people", (req, res) => {
    const { name, date, time, location, latitude, longitude, utcOffset } = req.body;
    if (!name || !date || !location) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const info = db.prepare(`
        INSERT INTO people (name, date, time, location, latitude, longitude, utcOffset)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, date, time, location, latitude, longitude, utcOffset);
      
      res.json({ id: info.lastInsertRowid, message: "Person saved successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save person" });
    }
  });

  app.delete("/api/people/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM people WHERE id = ?").run(id);
      res.json({ message: "Person deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete person" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
