"use strict";
/*
 * Light-weight check for personal information in a child's chat message.
 * Messages that match are NOT sent to OpenAI (data minimization): Rocky replies with a
 * gentle reminder instead. This is a safety net, not a guarantee. It cannot catch
 * everything (for example a first name or a school name), so the system prompt also
 * tells Rocky never to ask for or repeat private details.
 */

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
// 7+ digits, allowing spaces, dots, dashes, parentheses (phone numbers, ID numbers).
const PHONE = /(?:\+?\d[\s().-]*){7,}/;
// "123 Main Street", "45 Oak Ave", etc.
const ADDRESS = /\b\d{1,6}\s+(?:[A-Za-z0-9'.-]+\s+){1,3}(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|way|place|pl|circle|cir|terrace)\b\.?/i;

function containsPersonalInfo(text) {
  const s = String(text || "");
  return EMAIL.test(s) || PHONE.test(s) || ADDRESS.test(s);
}

module.exports = { containsPersonalInfo };