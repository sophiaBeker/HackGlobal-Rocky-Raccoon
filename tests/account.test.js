"use strict";
// Run with: npm test   (or: node --test tests/)
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const registerAccount = require("../server/account");

function build({ passwordOk = true } = {}) {
  const calls = { verify: [], removed: [] };
  const user = { id: "u1", email: "kid@example.com" };
  const supabase = {
    auth: {
      getUser: async token =>
        token === "good"
          ? { data: { user }, error: null }
          : { data: { user: null }, error: { message: "bad" } }
    }
  };
  const app = express();
  app.use(express.json());
  registerAccount(app, {
    supabase,
    rateLimit: (_req, _res, next) => next(),
    verifyPassword: async (email, pw) => { calls.verify.push([email, pw]); return passwordOk; },
    deleteUser: async id => { calls.removed.push(id); }
  });
  return { app, calls };
}

async function post(app, body, token) {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/account/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {})
      },
      body: JSON.stringify(body)
    });
    return { status: res.status, body: await res.json() };
  } finally {
    server.close();
  }
}

test("rejects requests without a login token", async () => {
  const { app, calls } = build();
  const r = await post(app, { password: "pw12345678", confirm: "DELETE" });
  assert.equal(r.status, 401);
  assert.equal(calls.removed.length, 0);
});

test("rejects an invalid token", async () => {
  const { app, calls } = build();
  const r = await post(app, { password: "pw12345678", confirm: "DELETE" }, "bad");
  assert.equal(r.status, 401);
  assert.equal(calls.removed.length, 0);
});

test("requires the typed DELETE confirmation", async () => {
  const { app, calls } = build();
  const r = await post(app, { password: "pw12345678", confirm: "nope" }, "good");
  assert.equal(r.status, 400);
  assert.equal(calls.removed.length, 0);
});

test("wrong password does not delete", async () => {
  const { app, calls } = build({ passwordOk: false });
  const r = await post(app, { password: "wrong-pass", confirm: "DELETE" }, "good");
  assert.equal(r.status, 403);
  assert.equal(calls.removed.length, 0);
});

test("correct password deletes the signed-in user only", async () => {
  const { app, calls } = build();
  const r = await post(app, { password: "pw12345678", confirm: "DELETE" }, "good");
  assert.equal(r.status, 200);
  assert.deepEqual(calls.removed, ["u1"]);
  assert.deepEqual(calls.verify, [["kid@example.com", "pw12345678"]]);
});