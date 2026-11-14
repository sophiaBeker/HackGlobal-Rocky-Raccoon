#!/usr/bin/env node
/*
 * One-off edits to existing Safety Quest backend files. Run from the repo root:
 *   node tools/apply-backend-fixes.js
 * Then run `npm install` (adds the "compression" package) and `npm test`.
 * Safe to run twice: every edit checks whether it was already applied.
 *
 *  1. package.json   : adds the "compression" dependency and an `npm test` script
 *  2. server.js      : gzip/brotli compression, cache headers for /css and /js,
 *                      and Rocky's system prompt now lists the new topics
 *  3. rocky-explain.js: one shared cache_salt instead of a new random one per request
 *
 * (server/lib/topics.js and tests/topics.test.js are plain replacement files.)
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const results = [];

function edit(file, label, fn) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) { results.push(`SKIPPED  ${label}: ${file} not found`); return; }
  const before = fs.readFileSync(full, "utf8");
  const after = fn(before);
  if (after === before) { results.push(`NO-OP    ${label} (already applied, or anchor text not found)`); return; }
  fs.writeFileSync(full, after);
  results.push(`APPLIED  ${label}`);
}

// 1. package.json
edit("package.json", "compression dependency + test script", src => {
  const pkg = JSON.parse(src);
  pkg.dependencies = pkg.dependencies || {};
  pkg.scripts = pkg.scripts || {};
  let changed = false;
  if (!pkg.dependencies.compression) {
    pkg.dependencies.compression = "^1.8.0";
    pkg.dependencies = Object.fromEntries(Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)));
    changed = true;
  }
  if (!pkg.scripts.test) { pkg.scripts.test = "node --test"; changed = true; }
  return changed ? JSON.stringify(pkg, null, 2) + "\n" : src;
});

// 2. server.js
const SERVER = "server/server.js";

edit(SERVER, "require compression", src =>
  src.includes('require("compression")')
    ? src
    : src.replace('const helmet = require("helmet");', 'const helmet = require("helmet");\nconst compression = require("compression");')
);

edit(SERVER, "use compression middleware", src =>
  src.includes("app.use(compression())")
    ? src
    : src.replace(
        "  // 32kb leaves room",
        "  // Compress text responses (HTML, CSS, JS, JSON). Much smaller downloads on school Wi-Fi.\n  app.use(compression());\n\n  // 32kb leaves room"
      )
);

edit(SERVER, "cache headers for /css and /js", src => {
  if (src.includes("STATIC_OPTIONS")) return src;
  let out = src.replace(
    "  // Static files: serve ONLY",
    "  // Cache CSS/JS for an hour in production (ETags still let browsers revalidate cheaply).\n" +
    "  // Shorten or remove this while you are changing files a lot.\n" +
    '  const STATIC_OPTIONS = { maxAge: process.env.NODE_ENV === "production" ? "1h" : 0 };\n\n' +
    "  // Static files: serve ONLY"
  );
  out = out.replace('express.static(path.join(ROOT, "css"))', 'express.static(path.join(ROOT, "css"), STATIC_OPTIONS)');
  out = out.replace('express.static(path.join(ROOT, "js"))', 'express.static(path.join(ROOT, "js"), STATIC_OPTIONS)');
  return out;
});

edit(SERVER, "Rocky system prompt: new topics", src =>
  src.replace(
    "flood safety, power outages (blackouts), school drills,",
    "flood safety, wildfire and smoke safety, severe weather (tornadoes, hurricanes, tsunamis, thunderstorms, extreme heat), " +
    "power outages (blackouts), school drills (if asked about a lockdown drill, say calmly that it is a practice for staying safe, " +
    "that the child should follow their teacher, and never describe attackers, weapons, or violence),"
  )
);

// 3. rocky-explain.js
const EXPLAIN = "server/rocky-explain.js";

edit(EXPLAIN, "shared cache salt (definition)", src =>
  src.includes("const CACHE_SALT")
    ? src
    : src.replace(
        'const { getUserFromRequest } = require("./lib/auth");',
        'const { getUserFromRequest } = require("./lib/auth");\n\n' +
        "// One salt per server start (or NRP_CACHE_SALT). A new random value per request would defeat prompt caching.\n" +
        'const CACHE_SALT = process.env.NRP_CACHE_SALT || require("crypto").randomBytes(32).toString("base64");'
      )
);

edit(EXPLAIN, "shared cache salt (use)", src =>
  src.replace(
    'cache_salt: process.env.NRP_CACHE_SALT || require("crypto").randomBytes(32).toString("base64")',
    "cache_salt: CACHE_SALT"
  )
);

console.log(results.join("\n"));