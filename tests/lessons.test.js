"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadLessons, GUEST_LESSON_IDS } = require("../server/lib/lessons");

const lessons = loadLessons();

test("the published lesson library contains six usable modules", () => {
  const modules = lessons.list();
  assert.equal(modules.length, 6);
  assert.equal(new Set(modules.map(item => item.id)).size, modules.length);
  for (const module of modules) {
    const lesson = lessons.get(module.id);
    assert.ok(lesson, `missing lesson data for ${module.id}`);
    assert.ok(Array.isArray(lesson.sections) && lesson.sections.length > 0);
  }
});

test("every lesson quiz has a valid correct answer index", () => {
  for (const module of lessons.list()) {
    const lesson = lessons.get(module.id);
    for (const [index, section] of lesson.sections.entries()) {
      if (!Array.isArray(section.answers)) continue;
      assert.ok(section.answers.length >= 2, `${module.id} section ${index} needs at least two answers`);
      assert.ok(
        Number.isInteger(section.correct) && section.correct >= 0 && section.correct < section.answers.length,
        `${module.id} section ${index} has an invalid correct answer index`
      );
      assert.ok(section.answers.every(answer => typeof answer === "string" && answer.trim()));
    }
  }
});

test("only the earthquake lesson is available to guest learners", () => {
  assert.deepEqual([...GUEST_LESSON_IDS], ["earthquake"]);
  for (const module of lessons.list()) {
    assert.equal(lessons.requiresAccount(module.id), module.id !== "earthquake");
  }
});
