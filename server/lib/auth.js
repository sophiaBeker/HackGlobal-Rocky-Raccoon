"use strict";

/*
 * Reads the optional "Authorization: Bearer <token>" header.
 *   { user }                  token verified with Supabase
 *   { user: null }            no token (guest), or Supabase is not configured
 *   { user: null, invalid }   a token was sent but Supabase rejected it
 * A token that cannot be verified never counts as a signed-in user.
 */
async function getUserFromRequest(supabase, req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ") || !supabase) return { user: null };
  try {
    const { data, error } = await supabase.auth.getUser(header.slice(7));
    if (error || !data?.user) return { user: null, invalid: true };
    return { user: data.user };
  } catch {
    return { user: null, invalid: true };
  }
}

module.exports = { getUserFromRequest };