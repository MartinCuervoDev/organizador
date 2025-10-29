import express from "express";
import Database from "better-sqlite3";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new Database("organizador.db");

// ----------------------
// TABLAS
// ----------------------

// TAREAS
db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    createdAt INTEGER
  )
`).run();

// IDEAS
db.prepare(`
  CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    createdAt INTEGER
  )
`).run();

// NOTAS
db.prepare(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    createdAt INTEGER
  )
`).run();


// ----------------------
// ENDPOINTS: TAREAS
// ----------------------

// Obtener todas las tareas
app.get("/tasks", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, text, description, date, done, createdAt
      FROM tasks
      ORDER BY date DESC, id DESC
    `).all();

    const normalized = rows.map(r => ({
      ...r,
      done: r.done === 1
    }));

    res.json(normalized);
  } catch (err) {
    console.error("GET /tasks error:", err);
    res.status(500).json({ error: "DB_READ_ERROR" });
  }
});

// Agregar nueva tarea
app.post("/tasks", (req, res) => {
  try {
    const { text, description, date, done, createdAt } = req.body;

    if (!text || !date) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    const info = db.prepare(`
      INSERT INTO tasks (text, description, date, done, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      text,
      description || "",
      date,
      done ? 1 : 0,
      createdAt || Date.now()
    );

    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    console.error("POST /tasks error:", err);
    res.status(500).json({ error: "DB_INSERT_ERROR" });
  }
});

// Actualizar tarea
app.put("/tasks/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { text, description, date, done, createdAt } = req.body;

    db.prepare(`
      UPDATE tasks
      SET text=?, description=?, date=?, done=?, createdAt=?
      WHERE id=?
    `).run(
      text,
      description || "",
      date,
      done ? 1 : 0,
      createdAt || Date.now(),
      id
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /tasks error:", err);
    res.status(500).json({ error: "DB_UPDATE_ERROR" });
  }
});

// Borrar tarea
app.delete("/tasks/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare(`DELETE FROM tasks WHERE id=?`).run(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /tasks error:", err);
    res.status(500).json({ error: "DB_DELETE_ERROR" });
  }
});


// ----------------------
// ENDPOINTS: IDEAS
// ----------------------

// Obtener todas las ideas
app.get("/ideas", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, text, createdAt
      FROM ideas
      ORDER BY id DESC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error("GET /ideas error:", err);
    res.status(500).json({ error: "DB_READ_ERROR" });
  }
});

// Agregar idea
app.post("/ideas", (req, res) => {
  try {
    const { text, createdAt } = req.body;

    if (!text) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    const info = db.prepare(`
      INSERT INTO ideas (text, createdAt)
      VALUES (?, ?)
    `).run(
      text,
      createdAt || Date.now()
    );

    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    console.error("POST /ideas error:", err);
    res.status(500).json({ error: "DB_INSERT_ERROR" });
  }
});

// Actualizar idea
app.put("/ideas/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { text, createdAt } = req.body;

    db.prepare(`
      UPDATE ideas
      SET text=?, createdAt=?
      WHERE id=?
    `).run(
      text,
      createdAt || Date.now(),
      id
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /ideas error:", err);
    res.status(500).json({ error: "DB_UPDATE_ERROR" });
  }
});

// Borrar idea
app.delete("/ideas/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare(`DELETE FROM ideas WHERE id=?`).run(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /ideas error:", err);
    res.status(500).json({ error: "DB_DELETE_ERROR" });
  }
});


// ----------------------
// ENDPOINTS: NOTES
// ----------------------

// Obtener todas las notas
app.get("/notes", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, text, createdAt
      FROM notes
      ORDER BY id DESC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error("GET /notes error:", err);
    res.status(500).json({ error: "DB_READ_ERROR" });
  }
});

// Agregar nota
app.post("/notes", (req, res) => {
  try {
    const { text, createdAt } = req.body;

    if (!text) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    const info = db.prepare(`
      INSERT INTO notes (text, createdAt)
      VALUES (?, ?)
    `).run(
      text,
      createdAt || Date.now()
    );

    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    console.error("POST /notes error:", err);
    res.status(500).json({ error: "DB_INSERT_ERROR" });
  }
});

// Actualizar nota
app.put("/notes/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { text, createdAt } = req.body;

    db.prepare(`
      UPDATE notes
      SET text=?, createdAt=?
      WHERE id=?
    `).run(
      text,
      createdAt || Date.now(),
      id
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /notes error:", err);
    res.status(500).json({ error: "DB_UPDATE_ERROR" });
  }
});

// Borrar nota
app.delete("/notes/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare(`DELETE FROM notes WHERE id=?`).run(id);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /notes error:", err);
    res.status(500).json({ error: "DB_DELETE_ERROR" });
  }
});


// ----------------------
app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado en http://localhost:${PORT}`);
});
