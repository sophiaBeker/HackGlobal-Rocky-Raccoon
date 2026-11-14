/*
 * Safety Quest — Profile page
 *
 * Load AFTER flashcards.js and BEFORE polish.js (see index.html).
 *
 *  - Shows the signed-in learner's profile, stats and Rocky look
 *  - Account settings: change nickname, change password, clear Rocky chats
 *  - Permanently delete the account (password + typed confirmation, checked again
 *    on the server by POST /api/account/delete)
 *  - Guests see a friendly "log in to get a profile" view
 */
(() => {
  "use strict";

  const root = document.getElementById("profileContent");
  if (!root || typeof showPage !== "function" || typeof progress === "undefined") {
    console.warn("profile: page markup or main app scripts not found.");
    return;
  }

  const $ = id => document.getElementById(id);
  const NICKNAME_RE = /^[A-Za-z0-9 _-]{3,20}$/; // same rule as sign-up in app.js
  const DELETE_ENDPOINT = (typeof CONFIG !== "undefined" && CONFIG.deleteAccountEndpoint) || "/api/account/delete";

  let pendingNotice = null; // shown once on the next render, e.g. after deletion
  let deleting = false;

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return "Unknown";
    }
  }

  function setMessage(id, text, kind) {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    el.className = "profile-msg" + (kind ? " " + kind : "");
  }

  function lookSummary() {
    const avatarKey = progress.activeAvatar || "classic";
    const accessoryKey = progress.activeAccessory || "none";
    const themeKey = progress.activeTheme || "default";
    return {
      avatarKey,
      accessoryKey,
      avatarName: avatarCatalog[avatarKey]?.name || "Classic Rocky",
      accessoryName: accessoryKey === "none" ? "No accessory" : (accessoryCatalog[accessoryKey]?.name || "No accessory"),
      themeName: themeKey === "default" ? "Safety Quest Classic" : (themeCatalog[themeKey]?.name || "Safety Quest Classic")
    };
  }

  function statHtml(icon, label, value) {
    return `<div class="stat"><div class="stat-icon" aria-hidden="true">${icon}</div><div><small>${label}</small><strong>${value}</strong></div></div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Views                                                               */
  /* ------------------------------------------------------------------ */
  function guestHtml() {
    const look = lookSummary();
    return `
      <section class="panel profile-header">
        <div class="profile-avatar" aria-hidden="true">${raccoonMarkup(look.avatarKey, look.accessoryKey, "large")}</div>
        <div class="profile-id">
          <h2>Guest Explorer</h2>
          <p class="desc">You are exploring as a guest. Your progress is saved only in this browser.</p>
          <dl class="profile-facts">
            <div><dt>Quest points</dt><dd>${progress.points || 0}</dd></div>
            <div><dt>Lessons finished</dt><dd>${(progress.completed || []).length} / ${modules.length}</dd></div>
          </dl>
          <button class="btn" type="button" data-action="go-account">Log in or create an account</button>
        </div>
      </section>
      <section class="panel profile-section">
        <h3>What you get with a free account</h3>
        <ul class="delete-list">
          <li>Progress saved to your account, on any device</li>
          <li>All six lessons unlocked</li>
          <li>Rocky chats saved so you can read them later</li>
          <li>A profile page where you manage your settings, or delete your account at any time</li>
        </ul>
      </section>`;
  }

  function signedInHtml() {
    const name = user.user_metadata?.display_name || "Explorer";
    const look = lookSummary();
    const done = progress.completed || [];
    const themesTotal = Object.keys(themeCatalog).length;

    const lessonChips = modules.map(m => {
      const finished = done.includes(m.id);
      return `<li class="lesson-chip ${finished ? "done" : ""}">
        <span aria-hidden="true">${escapeHtml(m.icon)}</span>
        <span class="lesson-chip-title">${escapeHtml(m.title)}</span>
        <span class="lesson-chip-state">${finished ? "✓ Done" : "Not yet"}</span>
      </li>`;
    }).join("");

    return `
      <section class="panel profile-header" aria-labelledby="profileNickname">
        <div class="profile-avatar" aria-hidden="true">${raccoonMarkup(look.avatarKey, look.accessoryKey, "large")}</div>
        <div class="profile-id">
          <h2 id="profileNickname">${escapeHtml(name)}</h2>
          <dl class="profile-facts">
            <div><dt>Email</dt><dd>${escapeHtml(user.email || "Not available")}</dd></div>
            <div><dt>Member since</dt><dd>${escapeHtml(formatDate(user.created_at))}</dd></div>
            <div><dt>Rocky’s look</dt><dd>${escapeHtml(look.avatarName)}, ${escapeHtml(look.accessoryName.toLowerCase())}</dd></div>
            <div><dt>Theme</dt><dd>${escapeHtml(look.themeName)}</dd></div>
          </dl>
          <button class="secondary" type="button" data-action="customize">🎨 Customize Rocky</button>
        </div>
      </section>

      <div class="stats profile-stats" aria-label="Your progress">
        ${statHtml("⭐", "Quest points", progress.points || 0)}
        ${statHtml("📚", "Lessons finished", done.length + " / " + modules.length)}
        ${statHtml("🎯", "Quiz attempts", progress.quizzes || 0)}
        ${statHtml("🗂️", "Flashcards known", (progress.flashcardsKnown || []).length)}
        ${statHtml("🎨", "Themes unlocked", (progress.unlockedThemes || []).length + " / " + themesTotal)}
        ${statHtml("💬", "Saved Rocky chats", '<span id="profileChatCount">…</span>')}
      </div>

      <section class="panel profile-section" aria-labelledby="lessonsTitle">
        <h3 id="lessonsTitle">Your lessons</h3>
        <ul class="lesson-chips">${lessonChips}</ul>
      </section>

      <section class="panel profile-section" aria-labelledby="settingsTitle">
        <h3 id="settingsTitle">Account settings</h3>
        <p class="desc">Change how you appear in Safety Quest and keep your account safe.</p>

        <form class="settings-form" data-form="nickname" novalidate>
          <div class="field">
            <label for="setNickname">Nickname</label>
            <input id="setNickname" name="nickname" maxlength="20" autocomplete="nickname" value="${escapeHtml(name)}">
            <p class="chat-tip">3 to 20 letters, numbers, spaces, hyphens, or underscores. Use a fun nickname, not your real name.</p>
          </div>
          <button class="btn" type="submit">Save nickname</button>
          <p class="profile-msg" id="nickMsg" role="status" aria-live="polite"></p>
        </form>

        <hr class="profile-divider">

        <form class="settings-form" data-form="password" novalidate>
          <div class="field">
            <label for="setNewPassword">New password</label>
            <input id="setNewPassword" name="newPassword" type="password" minlength="8" autocomplete="new-password" placeholder="At least 8 characters">
          </div>
          <div class="field">
            <label for="setConfirmPassword">Type the new password again</label>
            <input id="setConfirmPassword" name="confirmPassword" type="password" minlength="8" autocomplete="new-password">
          </div>
          <button class="btn" type="submit">Change password</button>
          <p class="profile-msg" id="passwordMsg" role="status" aria-live="polite"></p>
        </form>

        <hr class="profile-divider">

        <div class="settings-row">
          <div>
            <strong>Rocky chat history</strong>
            <p class="chat-tip">Erase every saved conversation with Rocky. Your lessons and points stay.</p>
            <p class="profile-msg" id="chatsMsg" role="status" aria-live="polite"></p>
          </div>
          <button class="secondary" type="button" data-action="clear-chats">Clear my chats</button>
        </div>
      </section>

      <section class="panel danger-zone profile-section" aria-labelledby="dangerTitle">
        <h3 id="dangerTitle">Delete my account</h3>
        <p class="desc">This permanently erases your account and everything saved with it. It cannot be undone.</p>
        <button class="secondary danger-outline" type="button" data-action="show-delete"
                aria-expanded="false" aria-controls="deleteConfirm">Delete my account…</button>

        <form id="deleteConfirm" class="delete-form" data-form="delete" hidden novalidate>
          <div class="notice"><strong>Please ask a grown-up first.</strong> Deleting an account is a big decision, so talk it over with a parent or caregiver.</div>
          <p>If you continue, we will permanently erase:</p>
          <ul class="delete-list">
            <li>Your login, email, and nickname</li>
            <li>Your quest points, finished lessons, and quiz progress</li>
            <li>Your flashcard progress</li>
            <li>Your Rocky avatars, accessories, and themes</li>
            <li>Every saved chat with Rocky</li>
          </ul>
          <p>You can still try the guest lesson afterward, and you can make a new account at any time. It will start from zero.</p>

          <label class="check-row"><input type="checkbox" name="understand"> I understand this cannot be undone.</label>
          <div class="field">
            <label for="delPassword">Enter your password</label>
            <input id="delPassword" name="password" type="password" autocomplete="current-password">
          </div>
          <div class="field">
            <label for="delTyped">Type <strong>DELETE</strong> to confirm</label>
            <input id="delTyped" name="typed" autocomplete="off" autocapitalize="characters" spellcheck="false">
          </div>
          <div class="delete-actions">
            <button class="secondary" type="button" data-action="cancel-delete" id="deleteCancel">Keep my account</button>
            <button class="btn btn-danger" type="submit" id="deleteSubmit" disabled>Permanently delete my account</button>
          </div>
          <p class="profile-msg" id="deleteMsg" role="alert"></p>
        </form>
      </section>`;
  }

  function renderProfile() {
    const notice = pendingNotice;
    pendingNotice = null;
    const noticeHtml = notice
      ? `<div class="notice ${notice.kind === "ok" ? "success" : ""}" role="status">${escapeHtml(notice.text)}</div>`
      : "";
    root.innerHTML = noticeHtml + (user ? signedInHtml() : guestHtml());
    if (user) loadChatCount();
  }

  async function loadChatCount() {
    const el = $("profileChatCount");
    if (!el || !user || !supabaseClient) return;
    try {
      const { count, error } = await supabaseClient
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      const target = $("profileChatCount"); // the page may have re-rendered meanwhile
      if (target) target.textContent = error ? "–" : String(count ?? 0);
    } catch {
      const target = $("profileChatCount");
      if (target) target.textContent = "–";
    }
  }

  /* ------------------------------------------------------------------ */
  /* Settings actions                                                    */
  /* ------------------------------------------------------------------ */
  async function saveNickname(form) {
    const name = form.elements.nickname.value.trim();
    if (!NICKNAME_RE.test(name)) {
      setMessage("nickMsg", "Choose 3 to 20 letters, numbers, spaces, hyphens, or underscores. Please don’t use your real name.", "error");
      return;
    }
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    setMessage("nickMsg", "Saving…");
    try {
      const { data, error } = await supabaseClient.auth.updateUser({ data: { display_name: name } });
      if (error) throw error;
      if (data?.user) user = data.user;
      updateStats();
      const heading = $("profileNickname");
      if (heading) heading.textContent = name;
      setMessage("nickMsg", "Nickname saved!", "ok");
    } catch (e) {
      setMessage("nickMsg", e.message || "Could not save your nickname. Please try again.", "error");
    } finally {
      button.disabled = false;
    }
  }

  async function changePassword(form) {
    const next = form.elements.newPassword.value;
    const again = form.elements.confirmPassword.value;
    if (next.length < 8) return setMessage("passwordMsg", "Use at least 8 characters.", "error");
    if (next !== again) return setMessage("passwordMsg", "The two passwords don’t match. Type them again.", "error");

    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    setMessage("passwordMsg", "Saving…");
    try {
      const { error } = await supabaseClient.auth.updateUser({ password: next });
      if (error) throw error;
      form.reset();
      setMessage("passwordMsg", "Password changed!", "ok");
    } catch (e) {
      setMessage("passwordMsg", e.message || "Could not change your password. Please try again.", "error");
    } finally {
      button.disabled = false;
    }
  }

  async function clearChats(button) {
    if (!window.confirm("Erase all of your saved chats with Rocky? This cannot be undone.")) return;
    button.disabled = true;
    setMessage("chatsMsg", "Clearing…");
    try {
      // Row Level Security lets learners delete only their own conversations;
      // messages are removed automatically (on delete cascade).
      const { error } = await supabaseClient.from("conversations").delete().eq("user_id", user.id);
      if (error) throw error;
      if (typeof resetConversationHistory === "function") resetConversationHistory();
      const count = $("profileChatCount");
      if (count) count.textContent = "0";
      setMessage("chatsMsg", "Your saved chats were cleared.", "ok");
    } catch (e) {
      setMessage("chatsMsg", "Could not clear your chats. Please try again.", "error");
    } finally {
      button.disabled = false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Delete account                                                      */
  /* ------------------------------------------------------------------ */
  function deleteFormReady(form) {
    return form.elements.understand.checked &&
      form.elements.password.value.length > 0 &&
      form.elements.typed.value.trim() === "DELETE";
  }

  function updateDeleteButton(form) {
    const submit = $("deleteSubmit");
    if (submit) submit.disabled = deleting || !deleteFormReady(form);
  }

  function setDeleteBusy(form, busy) {
    deleting = busy;
    const submit = $("deleteSubmit");
    const cancel = $("deleteCancel");
    if (cancel) cancel.disabled = busy;
    if (submit) {
      submit.textContent = busy ? "Deleting…" : "Permanently delete my account";
      submit.disabled = busy || !deleteFormReady(form);
    }
  }

  async function deleteAccount(form) {
    if (deleting || !user || !deleteFormReady(form)) return;
    setMessage("deleteMsg", "");
    setDeleteBusy(form, true);

    try {
      // Use a fresh token; the server verifies it and re-checks the password.
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const token = sessionData?.session?.access_token || session?.access_token;
      if (!token) throw new Error("Your session has expired. Please log in again.");

      const res = await fetch(DELETE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ password: form.elements.password.value, confirm: "DELETE" })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong. Your account was not deleted.");

      // The account is gone. Clear the local session and return to guest mode.
      pendingNotice = {
        kind: "ok",
        text: "Your account and everything saved with it have been permanently deleted. Goodbye, Explorer!"
      };
      try { await supabaseClient.auth.signOut({ scope: "local" }); } catch { /* session is already invalid */ }
      deleting = false;
      await logout();       // resets progress, theme, chat state and shows Home
      showPage("profile");  // shows the guest view with the confirmation notice
    } catch (e) {
      const offline = e instanceof TypeError; // fetch network failure
      setMessage("deleteMsg", offline ? "Could not reach Safety Quest. Check your connection. Your account was not deleted." : e.message, "error");
      setDeleteBusy(form, false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Events (one delegated listener per type)                            */
  /* ------------------------------------------------------------------ */
  root.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button || !root.contains(button)) return;

    switch (button.dataset.action) {
      case "go-account":
        showPage("account");
        break;
      case "customize":
        showPage("customize");
        break;
      case "clear-chats":
        clearChats(button);
        break;
      case "show-delete": {
        const form = $("deleteConfirm");
        if (!form) break;
        form.hidden = false;
        button.setAttribute("aria-expanded", "true");
        form.scrollIntoView({ behavior: "smooth", block: "nearest" });
        form.elements.understand.focus({ preventScroll: true });
        break;
      }
      case "cancel-delete": {
        const form = $("deleteConfirm");
        if (!form || deleting) break;
        form.reset();
        setMessage("deleteMsg", "");
        updateDeleteButton(form);
        form.hidden = true;
        const opener = root.querySelector('[data-action="show-delete"]');
        if (opener) { opener.setAttribute("aria-expanded", "false"); opener.focus(); }
        break;
      }
    }
  });

  root.addEventListener("submit", event => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    if (!user || !supabaseClient) return;

    if (form.dataset.form === "nickname") saveNickname(form);
    else if (form.dataset.form === "password") changePassword(form);
    else if (form.dataset.form === "delete") deleteAccount(form);
  });

  ["input", "change"].forEach(type => {
    root.addEventListener(type, event => {
      const form = event.target.closest('form[data-form="delete"]');
      if (form) updateDeleteButton(form);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Wire into the existing app                                          */
  /* ------------------------------------------------------------------ */
  const baseShowPage = window.showPage;
  window.showPage = function showPageWithProfile(name) {
    const result = baseShowPage.apply(this, arguments);
    if (name === "profile") {
      const crumb = $("crumbPage");
      if (crumb) crumb.textContent = "Profile";
      renderProfile();
    }
    return result;
  };

  // Re-render when the signed-in account changes (log in, log out, session restored).
  // Also adds a "View my profile" button to the Account page for signed-in learners.
  const baseRenderAccount = window.renderAccount;
  window.renderAccount = function renderAccountWithProfile() {
    const result = baseRenderAccount.apply(this, arguments);

    if (user) {
      const panel = document.querySelector("#accountContent .panel");
      const logoutButton = panel && panel.querySelector("button.secondary");
      if (panel && logoutButton && !panel.querySelector("[data-profile-link]")) {
        const link = document.createElement("button");
        link.type = "button";
        link.className = "btn";
        link.dataset.profileLink = "true";
        link.style.marginRight = "8px";
        link.textContent = "View my profile";
        link.addEventListener("click", () => showPage("profile"));
        panel.insertBefore(link, logoutButton);
      }
    }

    const pageIsOpen = $("page-profile")?.classList.contains("active");
    if (pageIsOpen && !deleting) renderProfile();
    return result;
  };

  // Make the sidebar profile card a shortcut to this page.
  const sideProfile = document.querySelector("aside .profile");
  if (sideProfile) {
    sideProfile.tabIndex = 0;
    sideProfile.setAttribute("role", "button");
    sideProfile.setAttribute("aria-label", "Open my profile");
    sideProfile.addEventListener("click", () => showPage("profile"));
    sideProfile.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showPage("profile");
      }
    });
  }
})();