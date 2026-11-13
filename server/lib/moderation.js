"use strict";
/*
 * Content moderation using OpenAI's moderation endpoint.
 *
 * moderate(textOrArray) resolves to one of:
 *   { ok: true,  items: [...] }
 *   { ok: false, items: [...] }   at least one input was flagged
 *   { ok: false, failed: true }   the check could not run (callers should fail closed)
 *
 * `items` lines up one-to-one with the inputs:
 *   { flagged: boolean, selfHarm: boolean, categories: string[] }
 *
 * Only category names are ever logged, never message text.
 */

const MODEL = process.env.OPENAI_MODERATION_MODEL || "omni-moderation-latest";

function createModerator(openai) {
  return async function moderate(input) {
    const inputs = Array.isArray(input) ? input : [input];
    // The API rejects empty strings, so blank inputs are replaced and never flagged.
    const texts = inputs.map(t => String(t ?? "").trim() || ".");
    if (!openai) return { ok: false, failed: true };

    try {
      const res = await openai.moderations.create(
        { model: MODEL, input: texts },
        { timeout: 8000, maxRetries: 1 }
      );
      const results = res?.results;
      if (!Array.isArray(results) || results.length !== texts.length) return { ok: false, failed: true };

      const items = results.map(r => {
        const categories = Object.entries(r?.categories || {}).filter(([, hit]) => hit).map(([name]) => name);
        return {
          flagged: Boolean(r?.flagged),
          selfHarm: categories.some(c => c.startsWith("self-harm")),
          categories
        };
      });
      return { ok: !items.some(i => i.flagged), items };
    } catch (err) {
      console.error("Moderation check failed:", err.message);
      return { ok: false, failed: true };
    }
  };
}

module.exports = { createModerator };