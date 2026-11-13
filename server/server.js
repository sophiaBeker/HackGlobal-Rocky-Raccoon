require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");
const { createModerator } = require("./lib/moderation");
const { containsPersonalInfo } = require("./lib/privacy");
const { getUserFromRequest } = require("./lib/auth");
const { loadLessons } = require("./lib/lessons");

const ROOT = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// Rate limiting: one independent counter per route, expired entries are purged.
// In-memory is fine for one server instance; use a shared store (e.g. Redis) if you scale out.
// Limits are per IP, and a whole classroom may share one IP, so the defaults are generous.
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

// ---------------------------------------------------------------------------
// Rocky's chat prompt, topic guardrail and safe replies
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
const PRIVATE_INFO_REPLY = "Let's keep private things safe, Explorer! Please don't share things like your address, phone number, or email here. If you need to share something private, a trusted grown-up can help. What would you like to learn about safety?";
const NEEDS_GROWNUP_REPLY = "I can't help with that one, Explorer. It's something to talk about with a trusted grown-up, like a parent, a teacher, or a school helper. I'm here for safety questions whenever you're ready.";
const SELF_HARM_REPLY = "It sounds like something might be really hard right now, and I'm glad you said something. Please tell a trusted grown-up right away, like a parent, a teacher, or a school counselor. If you are in danger, tell an adult near you and ask them to call your local emergency number. You are important.";
const SAFE_OUTPUT_REPLY = "That's one to ask a trusted grown-up about, Explorer. I can help with safety topics like earthquakes, fires, floods, and being prepared.";
const TROUBLE_REPLY = "Rocky is having trouble connecting. Please try again.";

// ---------------------------------------------------------------------------
// App factory (exported so it can be tested with fake OpenAI / Supabase clients)
// ---------------------------------------------------------------------------
function createApp({ openai, supabase, lessons }) {
  const app = express();
  const moderate = createModerator(openai);

  // Behind a host's proxy (Render, Railway, Fly, ...) set TRUST_PROXY_HOPS=1 so req.ip is the
  // real visitor and not the proxy. Leave unset for local development.
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
  if (proxyHops > 0) app.set("trust proxy", proxyHops);

  // -------------------------------------------------------------------------
  // Security headers + Content Security Policy.
  // The frontend uses inline onclick="" handlers and injects small <style> tags, so the
  // policy has to allow inline event handlers and inline styles. Inline <script> blocks
  // and scripts from any host other than jsDelivr stay blocked. Removing the inline
  // handlers from the frontend later would let you drop 'unsafe-inline' from scriptSrcAttr.
  // CSP_REPORT_ONLY=true reports violations in the browser console without blocking.
  // -------------------------------------------------------------------------
  let supabaseOrigin = "https://*.supabase.co";
  try { supabaseOrigin = new URL(process.env.SUPABASE_URL).origin; } catch { /* keep wildcard */ }

  app.use(helmet({
    contentSecurityPolicy: {
      reportOnly: process.env.CSP_REPORT_ONLY === "true",
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", supabaseOrigin],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        // Only upgrade http->https in production; it breaks plain http://localhost in some browsers.
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null
      }
    }
  }));

  // 32kb leaves room for 10 history messages of 800 characters, even with emoji/accents.
  app.use(express.json({ limit: "32kb" }));

  // Static files: serve ONLY the browser-facing files, not the whole repo.
  // If you add an images/ or fonts/ folder, add a matching app.use line.
  app.use("/css", express.static(path.join(ROOT, "css")));
  app.use("/js", express.static(path.join(ROOT, "js")));
  app.get("/config.js", (_req, res) => res.sendFile(path.join(ROOT, "config.js")));
  app.get(["/", "/index.html"], (_req, res) => res.sendFile(path.join(ROOT, "index.html")));

  const chatLimiter = createRateLimiter({ max: Number(process.env.CHAT_RATE_LIMIT || 30) });
  const explainLimiter = createRateLimiter({ max: Number(process.env.EXPLAIN_RATE_LIMIT || 30) });
  const lessonLimiter = createRateLimiter({ max: Number(process.env.LESSON_RATE_LIMIT || 120) });

  // -------------------------------------------------------------------------
  // Rocky chat
  // Order: validate -> private-info check -> input moderation -> topic guardrail ->
  //        session check -> model -> output moderation.
  // Moderation runs BEFORE the topic guardrail so a child who says something worrying
  // gets a caring "tell a trusted grown-up" reply instead of a generic off-topic one.
  // -------------------------------------------------------------------------
  app.post("/api/chat", chatLimiter, async (req, res) => {
    try {
      if (!openai) return res.status(503).json({ error: "Rocky's AI service is not configured yet." });
      const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
      if (!message || message.length > 800) return res.status(400).json({ error: "Please enter a question up to 800 characters." });

      let history = (Array.isArray(req.body?.history) ? req.body.history.slice(-10) : [])
        .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string" && m.content.trim())
        .map(m => ({ role: m.role, content: m.content.slice(0, 800) }));

      // 1. Never send obvious personal information (email, phone, street address) to the AI provider.
      if (containsPersonalInfo(message)) return res.json({ reply: PRIVATE_INFO_REPLY });

      // 2. Moderate the new message and the history in one call. A flagged new message gets a
      //    kind redirect. Flagged history messages are dropped from what the model sees, so a
      //    child isn't stuck on the redirect for the rest of the conversation.
      const input = await moderate([message, ...history.map(m => m.content)]);
      if (input.failed) return res.status(502).json({ error: TROUBLE_REPLY });
      const [mine, ...past] = input.items;
      if (mine.flagged) {
        console.warn("Chat message withheld by moderation:", mine.categories.join(", "));
        return res.json({ reply: mine.selfHarm ? SELF_HARM_REPLY : NEEDS_GROWNUP_REPLY });
      }
      history = history.filter((_, i) => !past[i].flagged);

      // 3. Topic guardrail: off-topic questions get a safe response without calling the model.
      if (!isOnTopic(message) && !isFollowUp(message, history)) {
        return res.json({ reply: DEFLECTION });
      }

      // 4. If a token is supplied and Supabase is configured, verify it. Guests may ask questions.
      const { invalid } = await getUserFromRequest(supabase, req);
      if (invalid) return res.status(401).json({ error: "Your session has expired. Please log in again." });

      // 5. `store: false` asks OpenAI not to retain the response object.
      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: SYSTEM_PROMPT,
        input: [...history, { role: "user", content: message }],
        max_output_tokens: 350,
        store: false
      });
      const reply = (response.output_text || "").trim();
      if (!reply) return res.status(502).json({ error: "Rocky couldn't make a reply just now. Please try again." });

      // 6. Moderate Rocky's own reply before a child sees it.
      const output = await moderate(reply);
      if (output.failed) return res.status(502).json({ error: TROUBLE_REPLY });
      if (!output.ok) {
        console.warn("Rocky reply withheld by moderation:", output.items.flatMap(i => i.categories).join(", "));
        return res.json({ reply: SAFE_OUTPUT_REPLY });
      }

      res.json({ reply });
    } catch (err) {
      console.error("Rocky chat error:", err.message); // never log message content
      res.status(500).json({ error: TROUBLE_REPLY });
    }
  });

  // "Ask Rocky why" (grounded on the server-side lesson library, with its own rate limiter)
  require("./rocky-explain")(app, { openai, supabase, rateLimit: explainLimiter, lessons, moderate });

  // -------------------------------------------------------------------------
  // Lesson library. The list is public. Lessons other than the guest lesson need a valid login,
  // so guest-versus-account access can be enforced here once the frontend loads lessons from
  // this API instead of its bundled copy.
  // -------------------------------------------------------------------------
  app.get("/api/lessons", lessonLimiter, (_req, res) => {
    res.json({ lessons: lessons.list() });
  });

  app.get("/api/lessons/:id", lessonLimiter, async (req, res) => {
    try {
      const lesson = lessons.get(req.params.id);
      if (!lesson) return res.status(404).json({ error: "Lesson not found." });

      const { user, invalid } = await getUserFromRequest(supabase, req);
      if (invalid) return res.status(401).json({ error: "Your session has expired. Please log in again." });
      if (lessons.requiresAccount(req.params.id) && !user) {
        return res.status(401).json({ error: "Please log in to open this lesson." });
      }

      res.set("Cache-Control", "private, no-cache");
      res.json({ id: req.params.id, ...lesson });
    } catch (err) {
      console.error("Lesson error:", err.message);
      res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  });

  app.get("/api/health", (_req, res) => res.json({
    ok: true,
    aiConfigured: Boolean(openai),
    authConfigured: Boolean(supabase),
    lessons: lessons.ids().length
  }));

  // -------------------------------------------------------------------------
  // Error handling: always answer API problems with JSON the frontend can read.
  // -------------------------------------------------------------------------
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

  return app;
}

// ---------------------------------------------------------------------------
// Start the server (only when run directly, so tests can import createApp)
// ---------------------------------------------------------------------------
if (require.main === module) {
  const PORT = Number(process.env.PORT || 3000);

  const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

  const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    : null;

  const lessons = loadLessons(); // throws with a clear message if the lesson files can't be read

  createApp({ openai, supabase, lessons }).listen(PORT, () => {
    console.log(`Safety Quest running at http://localhost:${PORT} (${lessons.ids().length} lessons loaded)`);
    if (!openai) console.log("OPENAI_API_KEY is not set; frontend will use prepared demo answers.");
  });
}

module.exports = { createApp };