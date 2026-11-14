"use strict";

/*
 * Local, conservative safety screening for Rocky.
 * NRP's documented OpenAI-compatible API exposes chat completions, not the
 * OpenAI Moderation endpoint. This is a lightweight first-pass guardrail,
 * not a substitute for dedicated moderation or human safety review.
 */
const RULES = [
  {
    category: "self-harm",
    selfHarm: true,
    patterns: [
      /\b(?:suicid(?:e|al)|kill myself|end my life|want to die|wish i was dead)\b/i,
      /\b(?:hurt|harm|cut|burn) myself\b/i,
      /\bself[ -]?harm(?:ing)?\b/i
    ]
  },
  {
    category: "sexual",
    patterns: [
      /\b(?:porn(?:ography)?|nudes?|send(?:ing)? nudes|sexually explicit)\b/i,
      /\b(?:sexually abuse|sexual assault|rape[sd]?)\b/i
    ]
  },
  {
    category: "violence",
    patterns: [
      /\b(?:how to|ways to|help me)\s+(?:kill|murder|shoot|stab|poison|hurt)\s+(?:someone|a person|people|him|her|them)\b/i,
      /\b(?:make|build)\s+(?:a|an)\s+(?:bomb|explosive)\b/i,
      /\b(?:threaten|attack|murder)\s+(?:someone|a person|people|him|her|them)\b/i
    ]
  }
];

function inspect(text) {
  const value = String(text ?? "");
  const categories = [];
  let selfHarm = false;
  for (const rule of RULES) {
    if (rule.patterns.some(pattern => pattern.test(value))) {
      categories.push(rule.category);
      if (rule.selfHarm) selfHarm = true;
    }
  }
  return { flagged: categories.length > 0, selfHarm, categories };
}

function createModerator() {
  return async function moderate(input) {
    const inputs = Array.isArray(input) ? input : [input];
    const items = inputs.map(inspect);
    return { ok: !items.some(item => item.flagged), items, failed: false };
  };
}

module.exports = { createModerator, inspect };
