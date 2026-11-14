"use strict";
// Run with: node --test tests/
const test = require("node:test");
const assert = require("node:assert");
const { isOnTopic, isFollowUp } = require("../server/lib/topics");

test("on-topic questions pass", () => {
  [
    "What does Drop, Cover, and Hold On mean?",
    "What should I do in a wildfire?",
    "What is a tornado drill?",
    "Why do hurricanes happen and how do I stay safe?",
    "What is a tsunami?",
    "What is a lockdown drill at school?",
    "How do I stay safe in a heat wave?",
    "Is lightning dangerous?",
    "What do I do in a landslide?",
    "Why is floodwater dangerous?",
    "What goes in a go-bag?"
  ].forEach(q => assert.ok(isOnTopic(q), "should be on topic: " + q));
});

test("off-topic questions are still deflected", () => {
  [
    "What is the best video game?",
    "Help me with my math homework",
    "Tell me a joke about my brain",
    "Can you train my dog?",
    "What is your favorite color?"
  ].forEach(q => assert.ok(!isOnTopic(q), "should be off topic: " + q));
});

test("follow-ups need a recent on-topic user message", () => {
  const history = [{ role: "user", content: "What is a wildfire?" }, { role: "assistant", content: "..." }];
  assert.ok(isFollowUp("why?", history));
  assert.ok(!isFollowUp("why?", [{ role: "user", content: "what is your favorite game" }]));
  assert.ok(!isFollowUp("tell me a long story about dragons and wizards in a faraway land far away", history));
});