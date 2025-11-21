// server.js
import express from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DB_PATH = "./comics.json";
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "{}");

const loadDB = () => JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
const saveDB = (db) => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

// multer: we set destination dynamically using req.comicId
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const id = req.comicId;
    const dir = path.join("uploads", id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Keep original name with timestamp to preserve order if user uploaded in order
    const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safe);
  }
});
const upload = multer({ storage });

app.get("/", (req, res) => {
  res.redirect("/index.html");
});

// Create comic: assign id then accept files
app.post("/api/create", (req, res) => {
  req.comicId = uuid();
  upload.array("pages")(req, res, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Upload error" });
    }

    const { title = "Без названия", author = "Аноним" } = req.body;
    const files = (req.files || []).map(f => f.filename);

    // maintain upload order as received
    const db = loadDB();
    db[req.comicId] = {
      id: req.comicId,
      title,
      author,
      pages: files
    };
    saveDB(db);

    res.json({ id: req.comicId });
  });
});

// Get comic metadata
app.get("/api/comic/:id", (req, res) => {
  const db = loadDB();
  const comic = db[req.params.id];
  if (!comic) return res.status(404).json({ error: "Not found" });
  res.json(comic);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
