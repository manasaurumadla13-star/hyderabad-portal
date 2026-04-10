/* ====================================================
   HYD STARTUP PORTAL — server.js
   Zero-dependency Node.js backend (no npm install!)
   Uses only built-in Node.js modules:
     http, fs, path, crypto, url
   ====================================================
   HOW TO RUN:
     node server.js
   Server: http://localhost:3000
   ==================================================== */

"use strict";

const http    = require("http");
const fs      = require("fs");
const path    = require("path");
const crypto  = require("crypto");
const { URL } = require("url");

const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "hyd_portal_secret_2025";
const DB_PATH    = path.join(__dirname, "db.json");
const FRONTEND   = path.join(__dirname, "../frontend");

// ============================================================
// JSON "DATABASE" — reads/writes a local db.json file
// ============================================================

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = {
      startups: [
        { id:1, name:"TechScale AI",  category:"Tech",     icon:"🤖", description:"Enterprise-grade AI automation reducing operational costs by 40% for 200+ companies across India.", founder:"Ananya Reddy",   website:"https://techscale.in" },
        { id:2, name:"CoinBridge",    category:"FinTech",  icon:"💳", description:"UPI-powered cross-border payments at near-zero fees for MSMEs and gig workers.", founder:"Ravi Kumar",     website:"https://coinbridge.io" },
        { id:3, name:"MediChain",     category:"Health",   icon:"🏥", description:"Blockchain EHR system connecting 5,000+ hospitals. Patients own their health data.", founder:"Dr. Priya Nair",  website:"https://medichain.care" },
        { id:4, name:"SkillVault",    category:"EdTech",   icon:"🎓", description:"Micro-credential platform for blue-collar workers. 1M+ learners certified in 80+ vocational skills.", founder:"Arjun Mehta",    website:"https://skillvault.co" },
        { id:5, name:"FarmLogic",     category:"AgriTech", icon:"🌾", description:"IoT + ML insights giving farmers 30% yield increase across 10,000 acres in Telangana.", founder:"Suresh Yadav",   website:"https://farmlogic.in" },
        { id:6, name:"CloudHive",     category:"SaaS",     icon:"☁️", description:"All-in-one workspace SaaS: chat, docs, tasks, and analytics in one tab for distributed teams.", founder:"Meera Iyer",     website:"https://cloudhive.app" },
        { id:7, name:"NovaPay",       category:"FinTech",  icon:"💰", description:"Buy-Now-Pay-Later infrastructure for Tier-2 and Tier-3 India. Integrated with 500+ regional e-commerce platforms.", founder:"Kiran Sharma",   website:"https://novapay.in" },
        { id:8, name:"DiagnoAI",      category:"Health",   icon:"🔬", description:"AI-powered pathology reports in 2 minutes. Partnered with Apollo & Yashoda hospital networks.", founder:"Nandini Rao",    website:"https://diagnoai.health" },
        { id:9, name:"StudyCircle",   category:"EdTech",   icon:"📚", description:"Peer-to-peer tutoring marketplace connecting 50,000 students with verified mentors from IITs & NITs.", founder:"Vikram Patel",   website:"https://studycircle.in" },
      ],
      users:    [],
      contacts: []
    };
    writeDB(seed);
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    console.error("⚠️  db.json corrupted. Resetting...");
    fs.unlinkSync(DB_PATH);
    return readDB();
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ============================================================
// AUTH HELPERS — HMAC-SHA256 tokens (no jsonwebtoken needed)
// ============================================================

function hashPassword(pw) {
  return crypto.createHmac("sha256", JWT_SECRET).update(pw).digest("hex");
}

function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg:"HS256", typ:"JWT" })).toString("base64url");
  const body   = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  const sig    = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  try {
    const [header, body, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
  } catch { return null; }
}

function getUserFromReq(req) {
  const auth = req.headers["authorization"] || "";
  if (!auth.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

// ============================================================
// HTTP HELPERS
// ============================================================

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; if (raw.length > 1e6) req.destroy(); });
    req.on("end",  () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    "Content-Type":  "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendCORS(res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const mimeMap = {
    ".html": "text/html; charset=utf-8",
    ".css":  "text/css",
    ".js":   "application/javascript",
    ".json": "application/json",
    ".png":  "image/png",
    ".ico":  "image/x-icon",
  };
  const mime = mimeMap[ext] || "text/plain";
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  });
}

// ============================================================
// ROUTE HANDLERS
// ============================================================

const routes = {

  // GET /api/health
  "GET /api/health": async (req, res) => {
    sendJSON(res, 200, {
      status:    "ok",
      message:   "🚀 HYD Startup Portal API is running!",
      timestamp: new Date().toISOString(),
      totalStartups: readDB().startups.length,
      totalUsers:    readDB().users.length,
    });
  },

  // GET /api/startups — supports ?category=Tech&search=AI
  "GET /api/startups": async (req, res, parsedUrl) => {
    const db       = readDB();
    let startups   = db.startups;
    const category = parsedUrl.searchParams.get("category");
    const search   = parsedUrl.searchParams.get("search");

    if (category && category !== "All") {
      startups = startups.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      startups = startups.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }
    sendJSON(res, 200, startups);
  },

  // POST /api/startups — auth required
  "POST /api/startups": async (req, res) => {
    const user = getUserFromReq(req);
    if (!user) return sendJSON(res, 401, { message: "Authentication required. Please log in first." });

    let body;
    try { body = await readBody(req); }
    catch { return sendJSON(res, 400, { message: "Invalid JSON body" }); }

    const { name, category, description, founder, website, icon } = body;
    if (!name || !category || !description) {
      return sendJSON(res, 400, { message: "name, category, and description are required" });
    }

    const validCategories = ["Tech","FinTech","Health","EdTech","AgriTech","SaaS"];
    if (!validCategories.includes(category)) {
      return sendJSON(res, 400, { message: `category must be one of: ${validCategories.join(", ")}` });
    }

    const db = readDB();
    const newStartup = {
      id:          Date.now(),
      name:        name.trim(),
      category,
      description: description.trim(),
      founder:     (founder || "Anonymous").trim(),
      website:     (website || "").trim(),
      icon:        icon || "🏢",
      addedBy:     user.email,
      createdAt:   new Date().toISOString()
    };

    db.startups.unshift(newStartup);
    writeDB(db);
    console.log(`  ✅ Startup added: "${newStartup.name}" by ${user.email}`);
    sendJSON(res, 201, { message: "Startup listed successfully!", startup: newStartup });
  },

  // POST /api/auth/register
  "POST /api/auth/register": async (req, res) => {
    let body;
    try { body = await readBody(req); }
    catch { return sendJSON(res, 400, { message: "Invalid JSON body" }); }

    const { name, email, password } = body;
    if (!name || !email || !password) {
      return sendJSON(res, 400, { message: "name, email, and password are required" });
    }
    if (password.length < 6) {
      return sendJSON(res, 400, { message: "Password must be at least 6 characters" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJSON(res, 400, { message: "Invalid email format" });
    }

    const db = readDB();
    if (db.users.find(u => u.email === email.toLowerCase())) {
      return sendJSON(res, 409, { message: "Email is already registered" });
    }

    const newUser = {
      id:        Date.now(),
      name:      name.trim(),
      email:     email.toLowerCase().trim(),
      password:  hashPassword(password),
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    writeDB(db);

    const userSafe = { id: newUser.id, name: newUser.name, email: newUser.email };
    const token    = createToken(userSafe);
    console.log(`  ✅ Registered: ${newUser.email}`);
    sendJSON(res, 201, { message: "Account created successfully!", token, user: userSafe });
  },

  // POST /api/auth/login
  "POST /api/auth/login": async (req, res) => {
    let body;
    try { body = await readBody(req); }
    catch { return sendJSON(res, 400, { message: "Invalid JSON body" }); }

    const { email, password } = body;
    if (!email || !password) {
      return sendJSON(res, 400, { message: "email and password are required" });
    }

    const db   = readDB();
    const user = db.users.find(u =>
      u.email === email.toLowerCase() && u.password === hashPassword(password)
    );
    if (!user) return sendJSON(res, 401, { message: "Invalid email or password" });

    const userSafe = { id: user.id, name: user.name, email: user.email };
    const token    = createToken(userSafe);
    console.log(`  🔑 Login: ${user.email}`);
    sendJSON(res, 200, { message: "Login successful!", token, user: userSafe });
  },

  // GET /api/auth/me
  "GET /api/auth/me": async (req, res) => {
    const user = getUserFromReq(req);
    if (!user) return sendJSON(res, 401, { message: "Authentication required" });
    sendJSON(res, 200, { user: { id: user.id, name: user.name, email: user.email } });
  },

  // POST /api/contact
  "POST /api/contact": async (req, res) => {
    let body;
    try { body = await readBody(req); }
    catch { return sendJSON(res, 400, { message: "Invalid JSON body" }); }

    const { name, email, message } = body;
    if (!name || !email || !message) {
      return sendJSON(res, 400, { message: "name, email, and message are required" });
    }

    const db = readDB();
    db.contacts.push({ id: Date.now(), name, email, message, receivedAt: new Date().toISOString() });
    writeDB(db);
    console.log(`  📧 Contact from: ${email}`);
    sendJSON(res, 200, { message: "Message received! We'll get back to you within 24 hrs." });
  },
};

// ============================================================
// MAIN REQUEST DISPATCHER
// ============================================================
const server = http.createServer(async (req, res) => {
  sendCORS(res);

  // CORS preflight
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const base      = `http://localhost:${PORT}`;
  const parsedUrl = new URL(req.url, base);
  const pathname  = parsedUrl.pathname;
  const method    = req.method;

  console.log(`  ${method.padEnd(6)} ${pathname}`);

  if (pathname.startsWith("/api/")) {

    // GET /api/startups/:id
    if (method === "GET" && /^\/api\/startups\/\d+$/.test(pathname)) {
      const id = parseInt(pathname.split("/").pop());
      const db = readDB();
      const s  = db.startups.find(s => s.id === id);
      return s ? sendJSON(res, 200, s) : sendJSON(res, 404, { message: "Startup not found" });
    }

    // DELETE /api/startups/:id
    if (method === "DELETE" && /^\/api\/startups\/\d+$/.test(pathname)) {
      const user = getUserFromReq(req);
      if (!user) return sendJSON(res, 401, { message: "Authentication required" });
      const id  = parseInt(pathname.split("/").pop());
      const db  = readDB();
      const idx = db.startups.findIndex(s => s.id === id);
      if (idx === -1) return sendJSON(res, 404, { message: "Startup not found" });
      const removed = db.startups.splice(idx, 1)[0];
      writeDB(db);
      console.log(`  🗑️  Deleted: "${removed.name}"`);
      return sendJSON(res, 200, { message: "Startup removed successfully" });
    }

    // Static routes
    const key = `${method} ${pathname}`;
    if (routes[key]) {
      try { await routes[key](req, res, parsedUrl); }
      catch (err) {
        console.error("  ❌ Error:", err.message);
        sendJSON(res, 500, { message: "Internal server error" });
      }
      return;
    }

    return sendJSON(res, 404, { message: `Route ${method} ${pathname} not found` });
  }

  // Static files
  let filePath = path.join(FRONTEND, pathname === "/" ? "index.html" : pathname);
  if (!filePath.startsWith(FRONTEND)) { res.writeHead(403); res.end("Forbidden"); return; }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  serveStatic(res, filePath);
});

// ============================================================
// START SERVER
// ============================================================
server.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   ⬡  HYD Startup Portal — Backend Server    ║");
  console.log(`║   🌐 http://localhost:${PORT}                    ║`);
  console.log("╚══════════════════════════════════════════════╝\n");
  console.log("📂 Frontend:", FRONTEND);
  console.log("💾 Database:", DB_PATH);
  console.log("\n📡 API Endpoints:");
  console.log("   GET    /api/health");
  console.log("   GET    /api/startups        ?category=Tech&search=AI");
  console.log("   GET    /api/startups/:id");
  console.log("   POST   /api/startups        ← requires auth token");
  console.log("   DELETE /api/startups/:id    ← requires auth token");
  console.log("   POST   /api/auth/register");
  console.log("   POST   /api/auth/login");
  console.log("   GET    /api/auth/me         ← requires auth token");
  console.log("   POST   /api/contact");
  console.log("\n⏳ Waiting for requests...\n");
  readDB(); // init db.json
  console.log("✅ db.json ready.\n");
});

process.on("SIGINT",  () => { console.log("\n👋 Server stopped."); process.exit(0); });
process.on("SIGTERM", () => { console.log("\n👋 Server stopped."); process.exit(0); });
