"use strict";
/*
 * Server-side lesson library.
 *
 * Today the lesson text lives in the browser files js/scripted-lessons.js and
 * js/lessons-v2.js. Rather than copy it (and let the copies drift apart), the server
 * runs those two files once at startup in an isolated sandbox with empty `lessonData`
 * and `modules`, then keeps the result. The load order matches index.html, so
 * lessons-v2 overrides the earthquake and fire lessons exactly as it does in the browser.
 *
 * Why it matters: Rocky's explanations are now grounded on this server-side copy, so a
 * tampered browser can no longer change what Rocky is told the lesson says.
 *
 * Later, if you move lessons into a JSON file or database, replace loadLessons() and keep
 * the same return shape.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const CLIENT_FILES = ["js/scripted-lessons.js", "js/lessons-v2.js"];

// Keep in sync with GUEST_LESSON_IDS in js/app.js: lessons that need no account.
const GUEST_LESSON_IDS = new Set(["earthquake"]);

function loadLessons(rootDir = path.join(__dirname, "..", "..")) {
  const sandbox = { console, lessonData: {}, modules: [] };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  for (const file of CLIENT_FILES) {
    const full = path.join(rootDir, file);
    vm.runInContext(fs.readFileSync(full, "utf8"), sandbox, { filename: file, timeout: 5000 });
  }

  // Plain copies, detached from the sandbox's objects.
  const data = JSON.parse(JSON.stringify(sandbox.lessonData));
  const modules = JSON.parse(JSON.stringify(sandbox.modules));

  // Only lessons that appear in the module list are reachable in the app.
  const lessons = new Map();
  for (const m of modules) {
    const lesson = data[m.id];
    if (lesson && Array.isArray(lesson.sections) && lesson.sections.length) lessons.set(m.id, lesson);
  }
  if (lessons.size === 0) throw new Error("No lessons were loaded from " + CLIENT_FILES.join(", "));

  const summaries = modules
    .filter(m => lessons.has(m.id))
    .map(m => ({
      id: m.id, title: m.title, icon: m.icon, tag: m.tag, desc: m.desc, time: m.time,
      guest: GUEST_LESSON_IDS.has(m.id)
    }));

  return {
    ids: () => [...lessons.keys()],
    list: () => summaries,
    get: id => lessons.get(String(id)) || null,
    section: (id, index) => lessons.get(String(id))?.sections?.[index] || null,
    requiresAccount: id => !GUEST_LESSON_IDS.has(String(id))
  };
}

module.exports = { loadLessons, GUEST_LESSON_IDS };