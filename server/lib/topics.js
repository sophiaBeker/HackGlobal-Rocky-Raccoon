"use strict";
/*
 * Topic guardrail for Rocky chat.
 *
 * - Whole-word matching, so "brain" or "train" no longer match "rain".
 * - Very loose words ("help", "power", "water", "match") are replaced by phrases.
 * - Follow-ups ("why?", "what if it's night?") only pass if the message LOOKS like a
 *   short follow-up AND a recent user message was on topic. The client's history can
 *   be forged, so this only unlocks short follow-up phrases, never arbitrary questions.
 *   The system prompt and moderation still apply to everything.
 */

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Spaces in a phrase also match hyphens ("go bag" matches "go-bag").
const phrase = s => esc(s).replace(/ /g, "[\\s-]+");

// Matched as whole words or phrases.
const WORDS = [
  // general safety
  "emergency", "emergencies", "safety", "safe", "family plan", "kit", "kits", "backpack",
  "go bag", "adult", "adults", "grown up", "grown ups", "teacher", "teachers", "caregiver",
  "get help", "need help", "call for help", "alarm", "alarms", "drill", "drills", "911", "999", "112",
  // earthquakes
  "drop", "cover", "hold on",
  // fire
  "fire", "fires", "smoke", "lighter", "lighters", "matches", "stop drop roll",
  // weather / floods
  "rain", "storm", "storms", "floodwater", "flood water", "drinking water",
  // power outages
  "power outage", "power cut", "power line", "power lines", "power goes out", "electric", "electricity",
  "radio", "candle", "candles",
  // first aid and getting help
  "first aid", "hurt", "police", "ambulance", "paramedic", "paramedics",
  // feelings
  "afraid", "scared", "worried", "nervous"
];

// Matched as word prefixes (shake -> shaking, evacuat -> evacuate/evacuation).
const STEMS = [
  "earthquake", "aftershock", "shak", "prepar", "evacuat", "shelter", "flood",
  "blackout", "outage", "flashlight", "batter", "injur", "firefight", "responder",
  "burn", "frighten", "worri"
];

const WORD_RE = new RegExp(`\\b(?:${WORDS.map(phrase).join("|")})\\b`, "i");
const STEM_RE = new RegExp(`\\b(?:${STEMS.map(esc).join("|")})\\w*`, "i");

const FOLLOW_UP_RE = new RegExp(
  "^\\s*(?:why|how come|what about|what if|really|tell me more|explain|can you explain|" +
  "what do you mean|i don'?t (?:get|understand)|ok(?:ay)?)\\b",
  "i"
);

const isOnTopic = text => {
  const s = String(text || "");
  return WORD_RE.test(s) || STEM_RE.test(s);
};

const isFollowUp = (message, history) =>
  String(message || "").length <= 60 &&
  FOLLOW_UP_RE.test(message) &&
  history.filter(m => m.role === "user").slice(-2).some(m => isOnTopic(m.content));

module.exports = { isOnTopic, isFollowUp };