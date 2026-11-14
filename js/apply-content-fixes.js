#!/usr/bin/env node
/*
 * One-off edits to existing Safety Quest files. Run from the repo root:
 *   node tools/apply-content-fixes.js
 * Safe to run twice: every edit checks whether it was already applied.
 *
 *  1. scripted-lessons.js: the kit lesson no longer says "Call 911" (numbers differ by country)
 *  2. scripted-lessons.js: adds a `sources` list to the flood, kit and blackout lessons
 *  3. lesson-experience.js: quiz points are awarded only on a lesson's first completion
 *
 * Please open the source links once to confirm they still work before public use.
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
  if (after === before) { results.push(`NO-OP    ${label} (already applied, or text not found)`); return; }
  fs.writeFileSync(full, after);
  results.push(`APPLIED  ${label}`);
}

// 1. 911 wording
edit("js/scripted-lessons.js", "kit lesson: local emergency number", src =>
  src.replace(
    "Call 911 if there is a serious emergency and an adult is not already getting help.",
    "Call your local emergency number if there is a serious emergency and an adult is not already getting help."
  )
);

// 2. sources for lessons that have none
const SOURCES = {
  flood: [
    ["Ready.gov: Floods", "https://www.ready.gov/floods"],
    ["National Weather Service: Turn Around Don't Drown", "https://www.weather.gov/safety/flood-turn-around-dont-drown"]
  ],
  kit: [
    ["Ready.gov: Build a Kit", "https://www.ready.gov/kit"],
    ["Ready.gov: Kids", "https://www.ready.gov/kids"]
  ],
  blackout: [
    ["Ready.gov: Power Outages", "https://www.ready.gov/power-outages"]
  ]
};

function addSources(src, id) {
  const start = src.indexOf(`\n      ${id}: {`);
  if (start < 0) return src;
  const nextLesson = src.indexOf("\n      }", start); // end of this lesson object
  const block = src.slice(start, nextLesson < 0 ? undefined : nextLesson);
  if (block.includes("sources:")) return src;
  const g = src.indexOf("grownUps:", start);
  if (g < 0 || (nextLesson >= 0 && g > nextLesson)) return src;
  const eol = src.indexOf("\n", g);
  const line = src.slice(g, eol).replace(/,\s*$/, "");
  const list = SOURCES[id]
    .map(([name, url]) => `          { name: ${JSON.stringify(name)}, url: ${JSON.stringify(url)} }`)
    .join(",\n");
  return src.slice(0, g) + line + ",\n        sources: [\n" + list + "\n        ]" + src.slice(eol);
}

edit("js/scripted-lessons.js", "sources for flood, kit and blackout", src =>
  Object.keys(SOURCES).reduce(addSources, src)
);

// 3. no point farming on quiz retries
edit("js/lesson-experience.js", "quiz points only on first completion", src =>
  /if \(!progress\.completed\.includes\(activeLesson\)\) \{\s*progress\.points = /.test(src) ? src : src.replace(
    /progress\.points = \(progress\.points \|\| 0\) \+ 5;\s*pointsEarnedThisRun \+= 5;/,
    "if (!progress.completed.includes(activeLesson)) {\n                progress.points = (progress.points || 0) + 5;\n                pointsEarnedThisRun += 5;\n              }"
  )
);

console.log(results.join("\n"));