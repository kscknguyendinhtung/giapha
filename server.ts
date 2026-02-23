import express from "express";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db: Database | null = null;

async function getDb() {
  if (!db) {
    try {
      const dbPath = process.env.VERCEL 
        ? path.join("/tmp", "giapha.db") 
        : path.join(__dirname, "giapha.db");
      
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      // Initialize Database
      await db.exec(`
        CREATE TABLE IF NOT EXISTS members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          gender TEXT CHECK(gender IN ('male', 'female', 'other')) NOT NULL,
          birth_date TEXT,
          death_date TEXT,
          biography TEXT,
          photo_url TEXT,
          address TEXT,
          phone TEXT,
          burial_place TEXT,
          father_id INTEGER,
          mother_id INTEGER,
          spouse_id INTEGER,
          generation INTEGER DEFAULT 1,
          branch_name TEXT,
          child_order INTEGER,
          spouse_order INTEGER,
          FOREIGN KEY (father_id) REFERENCES members(id),
          FOREIGN KEY (mother_id) REFERENCES members(id),
          FOREIGN KEY (spouse_id) REFERENCES members(id)
        );
      `);

      // Ensure columns exist (simple migration)
      const columns = await db.all("PRAGMA table_info(members)");
      const columnNames = columns.map((c: any) => c.name);
      if (!columnNames.includes("address")) await db.exec("ALTER TABLE members ADD COLUMN address TEXT");
      if (!columnNames.includes("phone")) await db.exec("ALTER TABLE members ADD COLUMN phone TEXT");
      if (!columnNames.includes("burial_place")) await db.exec("ALTER TABLE members ADD COLUMN burial_place TEXT");
      if (!columnNames.includes("child_order")) await db.exec("ALTER TABLE members ADD COLUMN child_order INTEGER");
      if (!columnNames.includes("spouse_order")) await db.exec("ALTER TABLE members ADD COLUMN spouse_order INTEGER");

      await db.exec(`
        CREATE TABLE IF NOT EXISTS config (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          title TEXT DEFAULT 'Gia Phả Gia Đình',
          background_url TEXT,
          overlay_url TEXT,
          overlay_x INTEGER DEFAULT 0,
          overlay_y INTEGER DEFAULT 0,
          overlay_scale REAL DEFAULT 1.0,
          tree_x INTEGER DEFAULT 0,
          tree_y INTEGER DEFAULT 0,
          tree_scale REAL DEFAULT 1.0,
          title_lines TEXT,
          title_x INTEGER DEFAULT 50,
          title_y INTEGER DEFAULT 50,
          title_font_size INTEGER DEFAULT 48,
          title_font_family TEXT DEFAULT 'Cormorant Garamond'
        );

        INSERT OR IGNORE INTO config (id, title) VALUES (1, 'Gia Phả Gia Đình');
      `);

      // Ensure config columns exist
      const configColumns = await db.all("PRAGMA table_info(config)");
      const configColumnNames = configColumns.map((c: any) => c.name);
      if (!configColumnNames.includes("overlay_url")) await db.exec("ALTER TABLE config ADD COLUMN overlay_url TEXT");
      if (!configColumnNames.includes("overlay_x")) await db.exec("ALTER TABLE config ADD COLUMN overlay_x INTEGER DEFAULT 0");
      if (!configColumnNames.includes("overlay_y")) await db.exec("ALTER TABLE config ADD COLUMN overlay_y INTEGER DEFAULT 0");
      if (!configColumnNames.includes("overlay_scale")) await db.exec("ALTER TABLE config ADD COLUMN overlay_scale REAL DEFAULT 1.0");
      if (!configColumnNames.includes("tree_x")) await db.exec("ALTER TABLE config ADD COLUMN tree_x INTEGER DEFAULT 0");
      if (!configColumnNames.includes("tree_y")) await db.exec("ALTER TABLE config ADD COLUMN tree_y INTEGER DEFAULT 0");
      if (!configColumnNames.includes("tree_scale")) await db.exec("ALTER TABLE config ADD COLUMN tree_scale REAL DEFAULT 1.0");
      if (!configColumnNames.includes("title_lines")) await db.exec("ALTER TABLE config ADD COLUMN title_lines TEXT");
    } catch (err) {
      console.error("Database initialization failed:", err);
      throw err;
    }
  }
  return db;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Global error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Health check for Vercel debugging
app.get("/api/health", async (req, res) => {
  try {
    const database = await getDb();
    await database.get("SELECT 1");
    res.json({ 
      status: "ok", 
      database: "connected",
      env: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      node_version: process.version
    });
  } catch (err: any) {
    console.error("Health check failed:", err);
    res.status(500).json({ 
      status: "error", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      vercel: !!process.env.VERCEL
    });
  }
});

// API Routes
app.get("/api/members", async (req, res) => {
  try {
    const database = await getDb();
    const members = await database.all("SELECT * FROM members");
    res.json(members);
  } catch (error) {
    console.error("Fetch members error:", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

app.get("/api/config", async (req, res) => {
  try {
    const database = await getDb();
    const config = await database.get("SELECT * FROM config WHERE id = 1");
    res.json(config);
  } catch (error) {
    console.error("Fetch config error:", error);
    res.status(500).json({ error: "Failed to fetch config" });
  }
});

app.post("/api/config", async (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const fields = Object.keys(data).filter(k => k !== 'id');
    if (fields.length === 0) return res.json({ success: true });

    const allowedFields = [
      'title', 'title_lines', 'background_url', 'overlay_url', 
      'overlay_x', 'overlay_y', 'overlay_scale', 
      'tree_x', 'tree_y', 'tree_scale', 
      'title_x', 'title_y', 'title_font_size', 'title_font_family'
    ];
    
    const validFields = fields.filter(f => allowedFields.includes(f));
    if (validFields.length === 0) return res.json({ success: true });

    const setClause = validFields.map(f => `${f} = ?`).join(', ');
    const values = validFields.map(f => data[f]);

    const database = await getDb();
    await database.run(`UPDATE config SET ${setClause} WHERE id = 1`, ...values);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Config Update Error:", error);
    res.status(500).json({ error: error.message || "Internal server error during config update" });
  }
});

app.post("/api/members", async (req, res) => {
  const data = { ...req.body };
  for (const key in data) {
    if (data[key] === "") data[key] = null;
  }
  const { name, gender, birth_date, death_date, biography, photo_url, address, phone, burial_place, father_id, mother_id, spouse_id, generation, branch_name, child_order, spouse_order } = data;
  try {
    const database = await getDb();
    const result = await database.run(`
      INSERT INTO members (name, gender, birth_date, death_date, biography, photo_url, address, phone, burial_place, father_id, mother_id, spouse_id, generation, branch_name, child_order, spouse_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, name, gender, birth_date, death_date, biography, photo_url, address, phone, burial_place, father_id, mother_id, spouse_id, generation, branch_name, child_order, spouse_order);
    
    const newId = result.lastID;
    
    // Bidirectional spouse update
    if (spouse_id) {
      await database.run("UPDATE members SET spouse_id = ? WHERE id = ?", newId, spouse_id);
    }
    
    res.json({ id: newId });
  } catch (error: any) {
    console.error("DB Error:", error);
    res.status(500).json({ error: error.message || "Failed to create member" });
  }
});

app.put("/api/members/:id", async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };
  for (const key in data) {
    if (data[key] === "") data[key] = null;
  }
  const { name, gender, birth_date, death_date, biography, photo_url, address, phone, burial_place, father_id, mother_id, spouse_id, generation, branch_name, child_order, spouse_order } = data;
  try {
    const database = await getDb();
    // Get old spouse to clear if changed
    const oldMember = await database.get("SELECT spouse_id FROM members WHERE id = ?", id);
    
    await database.run(`
      UPDATE members 
      SET name = ?, gender = ?, birth_date = ?, death_date = ?, biography = ?, photo_url = ?, address = ?, phone = ?, burial_place = ?, father_id = ?, mother_id = ?, spouse_id = ?, generation = ?, branch_name = ?, child_order = ?, spouse_order = ?
      WHERE id = ?
    `, name, gender, birth_date, death_date, biography, photo_url, address, phone, burial_place, father_id, mother_id, spouse_id, generation, branch_name, child_order, spouse_order, id);
    
    // Update new spouse
    if (spouse_id) {
      await database.run("UPDATE members SET spouse_id = ? WHERE id = ?", id, spouse_id);
    }
    
    // Clear old spouse if it was different
    if (oldMember && oldMember.spouse_id && oldMember.spouse_id !== spouse_id) {
      await database.run("UPDATE members SET spouse_id = NULL WHERE id = ?", oldMember.spouse_id);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("DB Error:", error);
    res.status(500).json({ error: error.message || "Failed to update member" });
  }
});

app.delete("/api/members/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const database = await getDb();
    await database.run("DELETE FROM members WHERE id = ?", id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete member error:", error);
    res.status(500).json({ error: "Failed to delete member" });
  }
});

export { app };

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}
