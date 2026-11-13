require("dotenv").config();
const express = require("express");
const path = require("path");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = path.join(__dirname, "..");

// Behind a host's proxy (Render, Railway, Fly, ...) set TRUST_PROXY_HOPS=1 so req.ip is the
// real visitor and not the proxy. Leave unset for local development.
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (proxyHops > 0) app.set("trust proxy", proxyHops);

// 32kb leaves room for 10 history messages of 800 characters, even with emoji/accents.
app.use(express.json({ limit: "32kb" }));

// ---------------------------------------------------------------------------
// Static files: serve ONLY the browser-facing files, not the whole repo.
// (server/, package.json, supabase-schema.sql, .env, planning docs stay private.)
// If you add an images/ or fonts/ folder, add a matching app.use line.
// ---------------------------------------------------------------------------
app.use("/css", express.static(path.join(ROOT, "css")));
app.use("/js", express.static(path.join(ROOT, "js")));
app.get("/config.js", (_req, res) => res.sendFile(path.join(ROOT, "config.js")));
app.get(["/", "/index.html"], (_req, res) => res.sendFile(path.join(ROOT, "index.html")));

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

// ---------------------------------------------------------------------------
// Rate limiting: one independent counter per route, expired entries are purged.
// In-memory is fine for one server instance; use a shared store (e.g. Redis) if you scale out.
// Limits are per IP, and a whole classroom may share one IP, so the defaults are generous.
// Tune with CHAT_RATE_LIMIT / EXPLAIN_RATE_LIMIT (requests per minute).
// ---------------------------------------------------------------------------
function createRateLimiter({ max, windowMs = 60_000 }) {
  const hits = new Map(); // ip -> array of request timestamps

  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of hits) {
      const recent = times.filter(t => t > cutoff);
      if (recent.length) hits.set(key, recent);
      else hits.delete(key);
    }
  }, windowMs).unref();

  return function rateLimit(req, res, next) {
    const key = req.ip || "unknown";
    const now = Date.now();
    const recent = (hits.get(key) || []).filter(t => now - t < windowMs);
    if (recent.length >= max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000))));
      return res.status(429).json({ error: "Please wait a little before asking Rocky more questions." });
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

const chatLimiter = createRateLimiter({ max: Number(process.env.CHAT_RATE_LIMIT || 30) });
const explainLimiter = createRateLimiter({ max: Number(process.env.EXPLAIN_RATE_LIMIT || 30) });

// ---------------------------------------------------------------------------
// Rocky's chat prompt and topic guardrail
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are Rocky Raccoon, a friendly, calm educational helper for children in kindergarten through grade 5.
Use short, clear, age-appropriate language. Be kind, reassuring, and never shame a learner.
You teach general emergency-preparedness concepts: earthquake safety, fire safety, flood safety, power outages (blackouts), school drills, shelter-in-place, emergency kits and go-bags, basic first-aid awareness, calling first responders, and asking trusted adults for help.
Prioritize these rules:
- In a real emergency, tell the child to follow their teacher, caregiver, local emergency officials, and established school/family plans.
- Never encourage a child to approach danger, investigate smoke/fire, re-enter a dangerous building, go near or play in floodwater, touch fallen power lines or electrical equipment, or ignore adult directions.
- Never suggest that a child use candles, matches, or lighters. For power outages, suggest flashlights with a trusted adult's help.
- For a possible immediate emergency, say to get to safety if possible and alert a trusted adult or emergency responder. Emergency numbers differ by country and sometimes by service; never assume 911 or another number applies everywhere. If the country is unknown, ask which country the child is in and encourage them to confirm the number with a trusted adult or official local source. Never invent a number.
- Do not request or encourage sharing names, home addresses, school names, phone numbers, passwords, photos, or other private information. If a child shares private information, do not repeat it.
- Do not diagnose injuries or provide detailed medical instructions. For someone who is hurt, encourage telling a trusted adult or emergency professional.
- If asked something outside reviewed safety topics, say you are not sure and encourage asking a trusted adult.
- Never claim you have contacted emergency services or a caregiver.
Keep answers concise (usually 2–5 sentences).`;

const ALLOWED_TOPICS = [
  // general safety
  "emergency", "safety", "safe", "prepared", "preparedness", "family plan", "kit", "backpack", "go-bag", "go bag",
  "help", "adult", "grown-up", "grown up", "teacher", "caregiver", "evacuat", "shelter", "drill", "alarm",
  // earthquakes
  "earthquake", "shake", "aftershock", "drop", "cover", "hold on",
  // fire
  "fire", "smoke", "burn", "lighter", "stop drop roll",
  // floods
  "flood", "rain", "storm", "water",
  // blackouts
  "blackout", "power", "outage", "electric", "flashlight", "battery", "batteries", "radio", "candle",
  // first aid and calling for help
  "first aid", "first-aid", "hurt", "injur", "ambulance", "paramedic", "police", "firefighter", "responder",
  "911", "999", "112",
  // feelings
  "afraid", "scared", "worried", "nervous", "frighten"
];

const isOnTopic = text => {
  const lower = String(text || "").toLowerCase();
  return ALLOWED_TOPICS.some(topic => lower.includes(topic));
};

// Short follow-ups like "why?" or "what about at night?" have no keywords of their own.
// Allow them if one of the learner's last two messages was on topic. Only the learner's
// messages count: Rocky's own deflection reply mentions topics and would let anything through.
const isFollowUp = (message, history) =>
  message.length <= 80 &&
  history.filter(m => m.role === "user").slice(-2).some(m => isOnTopic(m.content));

const DEFLECTION = "That's a good question to bring to a trusted grown-up, Explorer. I can help with earthquake safety, fire safety, floods, power outages, emergency kits, getting help, and more. What would you like to learn about?";

app.post("/api/chat", chatLimiter, async (req, res) => {
  try {
    if (!openai) return res.status(503).json({ error: "Rocky's AI service is not configured yet." });
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message || message.length > 800) return res.status(400).json({ error: "Please enter a question up to 800 characters." });

    const history = (Array.isArray(req.body?.history) ? req.body.history.slice(-10) : [])
      .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .map(m => ({ role: m.role, content: m.content.slice(0, 800) }));

    // Topic guardrail: off-topic questions get a safe response without calling the model.
    if (!isOnTopic(message) && !isFollowUp(message, history)) {
      return res.json({ reply: DEFLECTION });
    }

    // If a token is supplied and Supabase is configured, verify it. Guests are allowed to ask questions.
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ") && supabase) {
      const token = auth.slice(7);
      const { error } = await supabase.auth.getUser(token);
      if (error) return res.status(401).json({ error: "Your session has expired. Please log in again." });
    }

    const messages = [...history, { role: "user", content: message }];

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: SYSTEM_PROMPT,
      input: messages,
      max_output_tokens: 350
    });
    const reply = (response.output_text || "").trim();
    if (!reply) return res.status(502).json({ error: "Rocky couldn't make a reply just now. Please try again." });
    res.json({ reply });
  } catch (err) {
    console.error("Rocky chat error:", err.message);
    res.status(500).json({ error: "Rocky is having trouble connecting. Please try again." });
  }
});

// The explain route gets its own rate limiter so quiz help and chat don't share a counter.
require("./rocky-explain")(app, { openai, supabase, rateLimit: explainLimiter });

app.get("/api/health", (_req, res) => res.json({
  ok: true,
  aiConfigured: Boolean(openai),
  authConfigured: Boolean(supabase)
}));

// ---------------------------------------------------------------------------
// Error handling: always answer API problems with JSON the frontend can read.
// ---------------------------------------------------------------------------
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "That message was too long. Please try a shorter question." });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "That request could not be read." });
  }
  console.error("Unhandled server error:", err?.message);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(PORT, () => {
  console.log(`Safety Quest running at http://localhost:${PORT}`);
  if (!openai) console.log("OPENAI_API_KEY is not set; frontend will use prepared demo answers.");
});