import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("giapha.db");

  // Initialize Database
  db.exec(`
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
      FOREIGN KEY (father_id) REFERENCES members(id),
      FOREIGN KEY (mother_id) REFERENCES members(id),
      FOREIGN KEY (spouse_id) REFERENCES members(id)
    );
  `);

  // Ensure columns exist (simple migration)
  const columns = db.prepare("PRAGMA table_info(members)").all();
  const columnNames = columns.map((c: any) => c.name);
  if (!columnNames.includes("address")) db.exec("ALTER TABLE members ADD COLUMN address TEXT");
  if (!columnNames.includes("phone")) db.exec("ALTER TABLE members ADD COLUMN phone TEXT");
  if (!columnNames.includes("burial_place")) db.exec("ALTER TABLE members ADD COLUMN burial_place TEXT");
  if (!columnNames.includes("child_order")) db.exec("ALTER TABLE members ADD COLUMN child_order INTEGER");
  if (!columnNames.includes("spouse_order")) db.exec("ALTER TABLE members ADD COLUMN spouse_order INTEGER");

  db.exec(`
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
  const configColumns = db.prepare("PRAGMA table_info(config)").all();
  const configColumnNames = configColumns.map((c: any) => c.name);
  if (!configColumnNames.includes("overlay_url")) db.exec("ALTER TABLE config ADD COLUMN overlay_url TEXT");
  if (!configColumnNames.includes("overlay_x")) db.exec("ALTER TABLE config ADD COLUMN overlay_x INTEGER DEFAULT 0");
  if (!configColumnNames.includes("overlay_y")) db.exec("ALTER TABLE config ADD COLUMN overlay_y INTEGER DEFAULT 0");
  if (!configColumnNames.includes("overlay_scale")) db.exec("ALTER TABLE config ADD COLUMN overlay_scale REAL DEFAULT 1.0");
  if (!configColumnNames.includes("tree_x")) db.exec("ALTER TABLE config ADD COLUMN tree_x INTEGER DEFAULT 0");
  if (!configColumnNames.includes("tree_y")) db.exec("ALTER TABLE config ADD COLUMN tree_y INTEGER DEFAULT 0");
  if (!configColumnNames.includes("tree_scale")) db.exec("ALTER TABLE config ADD COLUMN tree_scale REAL DEFAULT 1.0");
  if (!configColumnNames.includes("title_lines")) db.exec("ALTER TABLE config ADD COLUMN title_lines TEXT");

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.get("/api/members", (req, res) => {
  try {
    const members = db.prepare("SELECT * FROM members").all();
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

app.get("/api/config", (req, res) => {
  try {
    const config = db.prepare("SELECT * FROM config WHERE id = 1").get();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch config" });
  }
});

app.post("/api/config", (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const fields = Object.keys(data).filter(k => k !== 'id');
    if (fields.length === 0) return res.json({ success: true });

    // Validate fields against allowed columns to prevent SQL injection or errors
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

    db.prepare(`UPDATE config SET ${setClause} WHERE id = 1`).run(...values);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Config Update Error:", error);
    res.status(500).json({ error: error.message || "Internal server error during config update" });
  }
});

app.post("/api/members", (req, res) => {
  const data = { ...req.body };
  for (const key in data) {
    if (data[key] === "") data[key] = null;
  }
  const { name, gender, birth_date, death_date, biography, photo_url, address, phone, burial_place, father_id, mother_id, spouse_id, generation, branch_name, child_order, spouse_order } = data;
  try {
    const info = db.prepare(`
      INSERT INTO members (name, gender, birth_date, death_date, biography, photo_url, address, phone, burial_place, father_id, mother_id, spouse_id, generation, branch_name, child_order, spouse_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, gender, birth_date, death_date, biography, photo_url, address, phone, burial_place, father_id, mother_id, spouse_id, generation, branch_name, child_order, spouse_order);
    
    const newId = info.lastInsertRowid;
    
    // Bidirectional spouse update
    if (spouse_id) {
      db.prepare("UPDATE members SET spouse_id = ? WHERE id = ?").run(newId, spouse_id);
    }
    
    res.json({ id: newId });
  } catch (error: any) {
    console.error("DB Error:", error);
    res.status(500).json({ error: error.message || "Failed to create member" });
  }
});

app.put("/api/members/:id", (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };
  for (const key in data) {
    if (data[key] === "") data[key] = null;
  }
  const { name, gender, birth_date, death_date, biography, photo_url, address, phone, burial_place, father_id, mother_id, spouse_id, generation, branch_name, child_order, spouse_order } = data;
  try {
    // Get old spouse to clear if changed
    const oldMember = db.prepare("SELECT spouse_id FROM members WHERE id = ?").get(id) as any;
    
    db.prepare(`
      UPDATE members 
      SET name = ?, gender = ?, birth_date = ?, death_date = ?, biography = ?, photo_url = ?, address = ?, phone = ?, burial_place = ?, father_id = ?, mother_id = ?, spouse_id = ?, generation = ?, branch_name = ?, child_order = ?, spouse_order = ?
      WHERE id = ?
    `).run(name, gender, birth_date, death_date, biography, photo_url, address, phone, burial_place, father_id, mother_id, spouse_id, generation, branch_name, child_order, spouse_order, id);
    
    // Update new spouse
    if (spouse_id) {
      db.prepare("UPDATE members SET spouse_id = ? WHERE id = ?").run(id, spouse_id);
    }
    
    // Clear old spouse if it was different
    if (oldMember && oldMember.spouse_id && oldMember.spouse_id !== spouse_id) {
      db.prepare("UPDATE members SET spouse_id = NULL WHERE id = ?").run(oldMember.spouse_id);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("DB Error:", error);
    res.status(500).json({ error: error.message || "Failed to update member" });
  }
});

app.delete("/api/members/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM members WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete member" });
  }
});

export { app };

async function startServer() {
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

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}
