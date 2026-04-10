/* ====================================================
   HYD STARTUP PORTAL — script.js
   All frontend logic: data fetching, filtering,
   auth simulation, modals, animations, search
   ==================================================== */

"use strict";

// ---- CONFIG ----
// When running with the Node.js backend, change to 'http://localhost:3000'
// For standalone (no backend), we use LOCAL_MODE = true with mock data
const API_BASE = "http://localhost:3000";
const LOCAL_MODE = false; // Backend is running! // Set to false when backend is running

// ============================================================
// MOCK DATA (used when LOCAL_MODE = true or API fails)
// ============================================================
const MOCK_STARTUPS = [
  { id:1, name:"TechScale AI", category:"Tech",    icon:"🤖", description:"Building enterprise-grade AI automation tools that reduce operational costs by 40%. Serving 200+ companies across India.", founder:"Ananya Reddy",  website:"https://techscale.in" },
  { id:2, name:"CoinBridge",   category:"FinTech", icon:"💳", description:"UPI-powered cross-border payments platform enabling real-time remittances at near-zero fees for MSMEs.", founder:"Ravi Kumar",    website:"https://coinbridge.io" },
  { id:3, name:"MediChain",    category:"Health",  icon:"🏥", description:"Blockchain-secured EHR system connecting 5000+ hospitals. Patients own their data; doctors access it in seconds.", founder:"Dr. Priya Nair", website:"https://medichain.care" },
  { id:4, name:"SkillVault",   category:"EdTech",  icon:"🎓", description:"Micro-credential platform for blue-collar workers. 1M+ learners certified in 80+ vocational skills.", founder:"Arjun Mehta",   website:"https://skillvault.co" },
  { id:5, name:"FarmLogic",    category:"AgriTech",icon:"🌾", description:"IoT + ML platform giving farmers real-time soil health insights. 30% yield increase reported across 10,000 acres.", founder:"Suresh Yadav",  website:"https://farmlogic.in" },
  { id:6, name:"CloudHive",    category:"SaaS",    icon:"☁️", description:"All-in-one workspace SaaS for distributed teams — chat, docs, tasks, and analytics in one tab.", founder:"Meera Iyer",    website:"https://cloudhive.app" },
  { id:7, name:"NovaPay",      category:"FinTech", icon:"💰", description:"Buy-Now-Pay-Later infrastructure for Tier-2 and Tier-3 India. Integrated with 500+ regional e-commerce platforms.", founder:"Kiran Sharma",  website:"https://novapay.in" },
  { id:8, name:"DiagnoAI",     category:"Health",  icon:"🔬", description:"AI-powered pathology reports in 2 minutes. Partnered with Apollo & Yashoda hospital networks.", founder:"Nandini Rao",   website:"https://diagnoai.health" },
  { id:9, name:"StudyCircle",  category:"EdTech",  icon:"📚", description:"Peer-to-peer tutoring marketplace connecting 50,000 students with verified mentors from IITs & NITs.", founder:"Vikram Patel",  website:"https://studycircle.in" },
];

const MOCK_INVESTORS = [
  { name:"Nandan Sharma",  firm:"Deccan Ventures",   initials:"NS", focus:"Invests in Deep Tech and SaaS startups at Series A. Backed 40+ companies with 3 unicorns.", tags:["SaaS","AI","DeepTech"] },
  { name:"Lakshmi Gupta",  firm:"Pearl Capital",      initials:"LG", focus:"Seed-stage investor focused on FinTech and financial inclusion across Tier-2 India.", tags:["FinTech","Seed","BharatFocused"] },
  { name:"Rohit Reddy",    firm:"Hyderabad Angels",   initials:"RR", focus:"Angel network of 80+ operators. Writes ₹25L–₹2Cr cheques for pre-seed B2B startups.", tags:["B2B","PreSeed","Angel"] },
  { name:"Preethi Nair",   firm:"BioHealth Fund",     initials:"PN", focus:"Healthcare-only fund. Partners with founders from IIT, IIM, or AIIMS backgrounds.", tags:["HealthTech","MedTech","BioTech"] },
  { name:"Arjun Tiwari",   firm:"GreenSeed Capital",  initials:"AT", focus:"Climate tech and AgriTech specialist. LP in 3 global climate funds, $200M AUM.", tags:["AgriTech","ClimateTech"] },
  { name:"Divya Krishnan", firm:"Nexus HYD",          initials:"DK", focus:"Growth-stage fund targeting ₹10Cr–₹50Cr rounds. Expertise in international GTM.", tags:["Growth","B2C","EdTech"] },
];

const MOCK_EVENTS = [
  { day:"14", month:"Feb", name:"Founder Friday — Valentine Edition", venue:"T-Hub, HITEC City", time:"6:00 PM", type:"In-Person" },
  { day:"22", month:"Feb", name:"HYD FinTech Demo Day 2025",          venue:"WE Hub, Madhapur",  time:"10:00 AM", type:"In-Person" },
  { day:"01", month:"Mar", name:"AI for Good Hackathon",              venue:"Online + IIIT Hyderabad", time:"9:00 AM", type:"Virtual" },
  { day:"08", month:"Mar", name:"Women in Startups Summit",           venue:"Novotel HICC",       time:"8:30 AM", type:"In-Person" },
  { day:"15", month:"Mar", name:"SaaSBoomi Hyderabad Chapter Meet",   venue:"Google HYD Office",  time:"5:30 PM", type:"In-Person" },
  { day:"28", month:"Mar", name:"Investor Pitching Workshop",         venue:"Zoom (100 seats)",   time:"3:00 PM", type:"Virtual" },
];

// In-memory user store (clears on refresh — real auth uses the backend)
const LOCAL_USERS = JSON.parse(localStorage.getItem("hyd_users") || "[]");
let currentUser = JSON.parse(localStorage.getItem("hyd_current_user") || "null");

// ============================================================
// UTILITY HELPERS
// ============================================================

/** Show a brief toast notification */
function showToast(msg, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.borderLeftColor = isError ? "#f87171" : "var(--amber)";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

/** Open a modal by its ID */
function openModal(id) {
  document.getElementById(id).classList.add("open");
  document.body.style.overflow = "hidden";
}

/** Close a modal by its ID */
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
  document.body.style.overflow = "";
}

/** Smooth scroll to a section */
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/** Get a badge class based on category */
function badgeClass(cat) {
  const map = { Tech:"badge-tech", FinTech:"badge-fintech", Health:"badge-health", EdTech:"badge-edtech", AgriTech:"badge-agritech", SaaS:"badge-saas" };
  return map[cat] || "badge-saas";
}

/** Capitalize first letter */
function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

// ============================================================
// NAV BAR: scroll effect + hamburger + active link
// ============================================================
function initNavbar() {
  const navbar    = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const navLinks  = document.querySelectorAll(".nav-link");

  // Scroll shadow
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
    updateActiveNav();
  });

  // Hamburger toggle
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    mobileMenu.classList.toggle("open");
  });

  // Close mobile menu on link click
  document.querySelectorAll(".mob-link").forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("open");
      mobileMenu.classList.remove("open");
    });
  });

  // Highlight active nav on scroll
  function updateActiveNav() {
    const sections = ["home","startups","investors","events","contact"];
    let current = "home";
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY + 120 >= el.offsetTop) current = id;
    });
    navLinks.forEach(link => {
      link.classList.toggle("active", link.dataset.section === current);
    });
  }
}

// ============================================================
// COUNTER ANIMATION (hero stats)
// ============================================================
function animateCounters() {
  const counters = document.querySelectorAll(".stat-num");
  counters.forEach(counter => {
    const target = +counter.dataset.target;
    const step   = Math.ceil(target / 60);
    let current  = 0;
    const tick   = setInterval(() => {
      current = Math.min(current + step, target);
      counter.textContent = current;
      if (current >= target) clearInterval(tick);
    }, 25);
  });
}

// Run counters when hero is visible
function initCounters() {
  const hero = document.getElementById("home");
  const obs  = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { animateCounters(); obs.disconnect(); }
  }, { threshold: 0.3 });
  obs.observe(hero);
}

// ============================================================
// FETCH STARTUPS (API or mock)
// ============================================================
let allStartups = []; // global cache

async function loadStartups() {
  const grid = document.getElementById("startupsGrid");

  if (!LOCAL_MODE) {
    try {
      const res  = await fetch(`${API_BASE}/api/startups`);
      const data = await res.json();
      allStartups = data;
      renderStartups(allStartups);
      return;
    } catch (err) {
      console.warn("Backend unavailable — using mock data:", err.message);
    }
  }

  // Simulate network delay
  await new Promise(r => setTimeout(r, 600));
  allStartups = MOCK_STARTUPS;
  renderStartups(allStartups);
}

/** Render an array of startup objects into the grid */
function renderStartups(startups) {
  const grid = document.getElementById("startupsGrid");
  document.getElementById("startupsLoader")?.remove();

  if (!startups.length) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-icon">🔍</div>
        <p>No startups found. Try a different search or filter.</p>
      </div>`;
    return;
  }

  // Clear previous cards (keep loader if exists)
  grid.innerHTML = "";

  startups.forEach((s, i) => {
    const card = document.createElement("div");
    card.className = "startup-card";
    card.style.animationDelay = `${i * 60}ms`;
    card.innerHTML = `
      <div class="card-top">
        <div class="card-icon">${s.icon || "🏢"}</div>
        <span class="card-badge ${badgeClass(s.category)}">${s.category}</span>
      </div>
      <h3 class="card-name">${s.name}</h3>
      <p class="card-desc">${s.description}</p>
      <div class="card-footer">
        <span class="card-founder">👤 ${s.founder || "—"}</span>
        ${s.website ? `<a class="card-link" href="${s.website}" target="_blank" rel="noopener">Visit →</a>` : ""}
      </div>`;
    grid.appendChild(card);
  });
}

// ============================================================
// SEARCH + FILTER LOGIC
// ============================================================
function initFilters() {
  const searchInput   = document.getElementById("searchInput");
  const searchClear   = document.getElementById("searchClear");
  const filterBtns    = document.querySelectorAll(".filter-btn");
  let activeCategory  = "All";

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    let filtered = allStartups;

    // Category filter
    if (activeCategory !== "All") {
      filtered = filtered.filter(s => s.category === activeCategory);
    }
    // Search filter
    if (query) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
      );
    }
    renderStartups(filtered);
    searchClear.style.display = query ? "block" : "none";
  }

  searchInput.addEventListener("input", applyFilters);

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    applyFilters();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.cat;
      applyFilters();
    });
  });
}

// ============================================================
// INVESTORS
// ============================================================
async function loadInvestors() {
  const grid = document.getElementById("investorsGrid");

  // Simulate load
  await new Promise(r => setTimeout(r, 400));
  document.getElementById("investorsLoader")?.remove();

  MOCK_INVESTORS.forEach((inv, i) => {
    const card = document.createElement("div");
    card.className = "investor-card";
    card.style.animationDelay = `${i * 60}ms`;
    card.innerHTML = `
      <div class="investor-avatar">${inv.initials}</div>
      <div class="investor-info">
        <p class="investor-name">${inv.name}</p>
        <p class="investor-firm">${inv.firm}</p>
        <p class="investor-focus">${inv.focus}</p>
        <div class="investor-tags">
          ${inv.tags.map(t => `<span class="investor-tag">${t}</span>`).join("")}
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

// ============================================================
// EVENTS
// ============================================================
function loadEvents() {
  const list = document.getElementById("eventsList");
  MOCK_EVENTS.forEach((ev, i) => {
    const isVirtual = ev.type === "Virtual";
    const card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <div class="event-date">
        <div class="event-day">${ev.day}</div>
        <div class="event-month">${ev.month}</div>
      </div>
      <div class="event-divider"></div>
      <div class="event-body">
        <p class="event-name">${ev.name}</p>
        <div class="event-meta">
          <span>📍 ${ev.venue}</span>
          <span>🕐 ${ev.time}</span>
        </div>
      </div>
      <span class="event-badge ${isVirtual ? "virtual" : ""}">${ev.type}</span>`;
    list.appendChild(card);
  });
}

// ============================================================
// CONTACT FORM
// ============================================================
function initContactForm() {
  const form     = document.getElementById("contactForm");
  const success  = document.getElementById("formSuccess");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name  = document.getElementById("cName").value.trim();
    const email = document.getElementById("cEmail").value.trim();
    const msg   = document.getElementById("cMsg").value.trim();

    // Clear errors
    ["nameError","emailError","msgError"].forEach(id => document.getElementById(id).textContent = "");
    let valid = true;

    if (!name)  { document.getElementById("nameError").textContent  = "Name is required"; valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById("emailError").textContent = "Valid email is required"; valid = false;
    }
    if (!msg)   { document.getElementById("msgError").textContent   = "Message is required"; valid = false; }

    if (!valid) return;

    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    form.reset();
    success.style.display = "block";
    showToast("✅ Message sent successfully!");
    setTimeout(() => success.style.display = "none", 5000);
  });
}

// ============================================================
// ADD STARTUP FORM (calls backend or simulates)
// ============================================================
function initAddStartup() {
  document.getElementById("addStartupBtn").addEventListener("click", () => {
    if (!currentUser) {
      showToast("Please log in to list a startup", true);
      openModal("loginModal");
      return;
    }
    openModal("addStartupModal");
  });

  document.getElementById("addStartupSubmit").addEventListener("click", async () => {
    const name     = document.getElementById("asName").value.trim();
    const category = document.getElementById("asCat").value;
    const desc     = document.getElementById("asDesc").value.trim();
    const founder  = document.getElementById("asFounder").value.trim();
    const website  = document.getElementById("asUrl").value.trim();
    const msgEl    = document.getElementById("addStartupMsg");

    if (!name || !category || !desc) {
      msgEl.textContent = "Please fill in all required fields.";
      msgEl.classList.add("error");
      return;
    }

    const newStartup = { id: Date.now(), name, category, description: desc, founder, website, icon: "🏢" };

    if (!LOCAL_MODE) {
      // Real API call
      try {
        const res = await fetch(`${API_BASE}/api/startups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newStartup)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed");
      } catch (err) {
        msgEl.textContent = "Error submitting. Check backend is running.";
        msgEl.classList.add("error");
        return;
      }
    }

    // Add to local cache & re-render
    allStartups.unshift(newStartup);
    renderStartups(allStartups);

    closeModal("addStartupModal");
    showToast(`🚀 "${name}" listed successfully!`);

    // Reset form
    ["asName","asCat","asDesc","asFounder","asUrl"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    msgEl.textContent = "";
  });
}

// ============================================================
// AUTH: Login & Signup (client-side simulation)
// Real auth uses /api/auth/register and /api/auth/login on backend
// ============================================================
function updateAuthUI() {
  const loginBtns  = document.querySelectorAll("#loginBtn, #loginBtnMob");
  const signupBtns = document.querySelectorAll("#signupBtn, #signupBtnMob");

  if (currentUser) {
    loginBtns.forEach(btn => { btn.textContent = "Logout"; btn.onclick = logout; });
    signupBtns.forEach(btn => { btn.textContent = `Hi, ${currentUser.name.split(" ")[0]} 👋`; btn.style.pointerEvents = "none"; });
  } else {
    loginBtns.forEach(btn => { btn.textContent = "Login"; btn.onclick = () => openModal("loginModal"); });
    signupBtns.forEach(btn => { btn.textContent = "Sign Up"; btn.style.pointerEvents = ""; btn.onclick = () => openModal("signupModal"); });
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("hyd_current_user");
  showToast("Logged out. See you soon!");
  updateAuthUI();
}

function initAuth() {
  // ---- LOGIN ----
  document.getElementById("loginSubmit").addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value.trim();
    const pass  = document.getElementById("loginPass").value;
    const msgEl = document.getElementById("loginMsg");

    if (!email || !pass) { msgEl.textContent = "Please fill in all fields."; msgEl.classList.add("error"); return; }

    if (!LOCAL_MODE) {
      // Real API login
      fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      }).then(r => r.json()).then(data => {
        if (data.token) {
          currentUser = data.user;
          localStorage.setItem("hyd_current_user", JSON.stringify(currentUser));
          localStorage.setItem("hyd_token", data.token);
          closeModal("loginModal");
          updateAuthUI();
          showToast(`Welcome back, ${currentUser.name}!`);
        } else {
          msgEl.textContent = data.message || "Invalid credentials";
          msgEl.classList.add("error");
        }
      }).catch(() => { msgEl.textContent = "Server error."; msgEl.classList.add("error"); });
      return;
    }

    // Local mode: check mock user store
    const users = JSON.parse(localStorage.getItem("hyd_users") || "[]");
    const user  = users.find(u => u.email === email && u.password === pass);
    if (!user) { msgEl.textContent = "Invalid email or password."; msgEl.classList.add("error"); return; }
    currentUser = { name: user.name, email: user.email };
    localStorage.setItem("hyd_current_user", JSON.stringify(currentUser));
    closeModal("loginModal");
    updateAuthUI();
    showToast(`Welcome back, ${currentUser.name}! 🎉`);
    msgEl.textContent = "";
  });

  // ---- SIGN UP ----
  document.getElementById("signupSubmit").addEventListener("click", () => {
    const name  = document.getElementById("suName").value.trim();
    const email = document.getElementById("suEmail").value.trim();
    const pass  = document.getElementById("suPass").value;
    const msgEl = document.getElementById("signupMsg");

    if (!name || !email || !pass) { msgEl.textContent = "All fields required."; msgEl.classList.add("error"); return; }
    if (pass.length < 6)           { msgEl.textContent = "Password must be ≥ 6 chars."; msgEl.classList.add("error"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msgEl.textContent = "Invalid email."; msgEl.classList.add("error"); return; }

    if (!LOCAL_MODE) {
      fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pass })
      }).then(r => r.json()).then(data => {
        if (data.token) {
          currentUser = data.user;
          localStorage.setItem("hyd_current_user", JSON.stringify(currentUser));
          localStorage.setItem("hyd_token", data.token);
          closeModal("signupModal");
          updateAuthUI();
          showToast(`Account created! Welcome, ${currentUser.name}! 🚀`);
        } else {
          msgEl.textContent = data.message || "Signup failed";
          msgEl.classList.add("error");
        }
      }).catch(() => { msgEl.textContent = "Server error."; msgEl.classList.add("error"); });
      return;
    }

    // Local mode
    const users = JSON.parse(localStorage.getItem("hyd_users") || "[]");
    if (users.find(u => u.email === email)) { msgEl.textContent = "Email already registered."; msgEl.classList.add("error"); return; }
    users.push({ name, email, password: pass });
    localStorage.setItem("hyd_users", JSON.stringify(users));
    currentUser = { name, email };
    localStorage.setItem("hyd_current_user", JSON.stringify(currentUser));
    closeModal("signupModal");
    updateAuthUI();
    showToast(`Welcome to the portal, ${name}! 🚀`);
    msgEl.textContent = "";
  });

  // ---- Modal switchers ----
  document.getElementById("switchToSignup").addEventListener("click", (e) => { e.preventDefault(); closeModal("loginModal");  openModal("signupModal"); });
  document.getElementById("switchToLogin").addEventListener("click",  (e) => { e.preventDefault(); closeModal("signupModal"); openModal("loginModal");  });
}

// ============================================================
// MODAL CLOSE BUTTONS
// ============================================================
function initModals() {
  // Close on X button
  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.modal));
  });

  // Close on overlay click
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.open").forEach(m => closeModal(m.id));
    }
  });
}

// ============================================================
// INTERSECTION OBSERVER — fade-in on scroll
// ============================================================
function initScrollReveal() {
  const style = document.createElement("style");
  style.textContent = `
    .reveal { opacity:0; transform:translateY(24px); transition:opacity 0.6s ease, transform 0.6s ease; }
    .reveal.visible { opacity:1; transform:none; }
  `;
  document.head.appendChild(style);

  const targets = document.querySelectorAll(".startup-card, .investor-card, .event-card, .section-header, .contact-wrap > *");
  targets.forEach(el => el.classList.add("reveal"));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });

  targets.forEach(el => obs.observe(el));
}

// Re-observe newly added cards after render
function reObserve() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });

  document.querySelectorAll(".startup-card:not(.visible), .investor-card:not(.visible)").forEach(el => {
    el.classList.add("reveal");
    obs.observe(el);
  });
}

// ============================================================
// MAIN INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  initNavbar();
  initCounters();
  initModals();
  initAuth();
  updateAuthUI();

  // Load async data
  await loadStartups();
  loadEvents();
  loadInvestors();

  // Init filters after startups loaded
  initFilters();
  initAddStartup();
  initContactForm();
  initScrollReveal();

  // Re-observe after dynamic cards are added
  setTimeout(reObserve, 1200);
});
