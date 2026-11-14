/*
 * Account deletion endpoint for Safety Quest.
 *
 * Wired up in server.js:
 *   require("./account")(app, { supabase, rateLimit: accountLimiter });
 *
 * Why this runs on the server: the browser only has the public (anon) Supabase key, which
 * is not allowed to delete an auth user. Deleting a user needs the service-role key, which
 * must NEVER be placed in config.js or any browser file. Set SUPABASE_SERVICE_ROLE_KEY in
 * the server's .env only.
 *
 * What it does, in order:
 *  1. The caller must send a valid "Authorization: Bearer <token>" (verified with Supabase).
 *  2. The body must contain { password, confirm: "DELETE" }.
 *  3. The password is re-checked with a throwaway Supabase client (no stored session), so a
 *     stolen or left-open session alone cannot delete an account.
 *  4. The auth user is hard-deleted. supabase-schema.sql declares
 *     `references auth.users(id) on delete cascade` on learner_progress and conversations
 *     (and conversation_messages cascades from conversations), so all learner data is erased
 *     with it.
 */
"use strict";

const { createClient } = require("@supabase/supabase-js");
const { getUserFromRequest } = require("./lib/auth");

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

module.exports = function registerAccount(app, { supabase, rateLimit, verifyPassword, deleteUser } = {}) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // The two helpers can be replaced in tests.
  const verify = verifyPassword || (async (email, password) => {
    const client = createClient(url, anonKey, NO_SESSION);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (!error) return true;
    if (error.code === "invalid_credentials" || error.status === 400) return false;
    throw error; // network problem, Supabase rate limit, etc.
  });

  const remove = deleteUser || (async userId => {
    const admin = createClient(url, serviceKey, NO_SESSION);
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;
  });

  const configured = Boolean(supabase) &&
    (Boolean(verifyPassword && deleteUser) || Boolean(url && anonKey && serviceKey));

  app.post("/api/account/delete", rateLimit, async (req, res) => {
    try {
      if (!configured) {
        return res.status(503).json({ error: "Account deletion is not set up yet. Please ask a grown-up or the project owner for help." });
      }

      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!password || password.length > 200 || req.body?.confirm !== "DELETE") {
        return res.status(400).json({ error: "Enter your password and type DELETE to confirm." });
      }

      const { user, invalid } = await getUserFromRequest(supabase, req);
      if (invalid) return res.status(401).json({ error: "Your session has expired. Please log in again." });
      if (!user) return res.status(401).json({ error: "Please log in to delete your account." });
      if (!user.email) return res.status(400).json({ error: "This account cannot be deleted here." });

      if (!(await verify(user.email, password))) {
        return res.status(403).json({ error: "That password is not right. Your account was not deleted." });
      }

      await remove(user.id);
      console.log("Account deleted:", user.id);
      res.json({ ok: true });
    } catch (err) {
      // Never log the password or the request body.
      console.error("Account delete error:", {
        status: err.status || err.statusCode || null,
        code: err.code || null,
        name: err.name || null
      });
      res.status(500).json({ error: "Something went wrong and your account was not deleted. Please try again." });
    }
  });
};