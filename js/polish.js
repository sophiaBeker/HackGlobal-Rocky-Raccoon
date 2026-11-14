/*
 * Safety Quest — frontend polish layer. Load LAST (after flashcards.js).
 *
 *  - SVG Rocky (respects the equipped avatar/accessory) instead of the emoji
 *  - Per-module colours, 🔒 badges and a friendly inline message for locked lessons
 *  - Themes for the Flood and Blackout modules; removes themes for modules that no longer exist
 *  - Mobile bottom tab bar with a "More" sheet
 *  - Ask Rocky suggestion chips
 *  - "Read aloud" button in lessons and quizzes
 *  - Daily practice streak (stored in this browser only)
 *  - Focus management for keyboard and screen-reader users
 */
(() => {
  "use strict";

  if (typeof lessonData === "undefined" || typeof modules === "undefined" || typeof showPage !== "function") {
    console.warn("polish: load this file after the main app scripts.");
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /* ------------------------------------------------------------------ */
  /* Themes: match the real module list                                  */
  /* ------------------------------------------------------------------ */
  delete themeCatalog.drill;
  delete themeCatalog.shelter;
  themeCatalog.flood = {
    name: "Flood Smart", emoji: "🌊",
    vars: { "--ink": "#1f4257", "--muted": "#4a6a7c", "--green": "#2f7191", "--green2": "#d9ecf5", "--lime": "#bfe3f2", "--cream": "#eff7fa", "--card": "#ffffff", "--orange": "#e8a865", "--line": "#d5e6ee" }
  };
  themeCatalog.blackout = {
    name: "Lights Out", emoji: "🔦",
    vars: { "--ink": "#2f3050", "--muted": "#5a5b7a", "--green": "#5a5ea8", "--green2": "#e3e4f6", "--lime": "#f3e3a1", "--cream": "#f5f5fb", "--card": "#fffffe", "--orange": "#e3b04b", "--line": "#e0e1f0" }
  };

  window.renderThemes = function renderThemesPolished() {
    const el = $("#themeCollection");
    if (!el) return;
    const unlocked = progress.unlockedThemes || [];
    const title = id => (modules.find(m => m.id === id) || {}).title || id;
    const choices = [
      { key: "default", name: "Safety Quest Classic", emoji: "🌿" },
      ...Object.entries(themeCatalog).map(([key, t]) => ({ key, name: t.name, emoji: t.emoji }))
    ];
    el.innerHTML = choices.map(t => {
      const open = t.key === "default" || unlocked.includes(t.key);
      const active = (progress.activeTheme || "default") === t.key;
      const hint = active ? "Currently applied"
        : open ? "Unlocked · tap to apply"
        : "🔒 Get every answer right in “" + title(t.key) + "”";
      return '<button type="button" class="theme-choice ' + (active ? "selected" : "") + '" ' + (!open ? "disabled" : "") +
        " onclick=\"chooseTheme('" + t.key + "')\"><span class=\"theme-emoji\">" + t.emoji +
        '</span><span class="theme-copy"><strong>' + t.name + "</strong><small>" + hint +
        '</small></span><span class="theme-status">' + (active ? "✓" : open ? "Apply" : "🔒") + "</span></button>";
    }).join("");
    const count = $("#themeUnlockCount");
    if (count) {
      const got = Object.keys(themeCatalog).filter(k => unlocked.includes(k)).length;
      count.textContent = got + " / " + Object.keys(themeCatalog).length + " unlocked";
    }
  };

  /* ------------------------------------------------------------------ */
  /* Rocky as SVG                                                        */
  /* ------------------------------------------------------------------ */
  function paintRocky(root = document) {
    if (typeof raccoonMarkup !== "function") return;
    const avatar = progress.activeAvatar || "classic";
    const accessory = progress.activeAccessory || "none";
    $$(".logo, .hero-art, .rocky-mini", root).forEach(el => {
      const size = el.classList.contains("hero-art") ? "large" : "small";
      const key = avatar + "|" + accessory + "|" + size;
      if (el.dataset.rockyKey === key) return;
      el.dataset.rockyKey = key;
      el.innerHTML = raccoonMarkup(avatar, accessory, size);
    });
  }
  const baseUpdateAvatar = window.updateAvatarDisplay;
  window.updateAvatarDisplay = function updateAvatarDisplayPolished() {
    if (baseUpdateAvatar) baseUpdateAvatar.apply(this, arguments);
    paintRocky();
  };

  /* ------------------------------------------------------------------ */
  /* Toast                                                               */
  /* ------------------------------------------------------------------ */
  const toast = $("#sqToast");
  let toastTimer = null;
  function showToast(message, actionLabel, action) {
    if (!toast) return;
    toast.innerHTML = "";
    const text = document.createElement("span");
    text.textContent = message;
    toast.appendChild(text);
    if (actionLabel && action) {
      const go = document.createElement("button");
      go.type = "button";
      go.className = "btn";
      go.textContent = actionLabel;
      go.addEventListener("click", () => { hideToast(); action(); });
      toast.appendChild(go);
    }
    const close = document.createElement("button");
    close.type = "button";
    close.className = "toast-close";
    close.setAttribute("aria-label", "Dismiss message");
    close.textContent = "×";
    close.addEventListener("click", hideToast);
    toast.appendChild(close);
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 9000);
  }
  function hideToast() { if (toast) toast.hidden = true; }

  /* ------------------------------------------------------------------ */
  /* Module cards: colours, lock badges                                  */
  /* ------------------------------------------------------------------ */
  const isLocked = id => !user && !GUEST_LESSON_IDS.has(id);

  function decorateModules() {
    $$("#homeModules .module-card, #allModules .module-card").forEach(card => {
      const match = /openLesson\('([^']+)'\)/.exec(card.getAttribute("onclick") || "");
      if (!match) return;
      const id = match[1];
      const locked = isLocked(id);
      card.dataset.module = id;
      card.classList.toggle("locked", locked);
      const art = $(".module-art", card);
      let badge = $(".lock-badge", card);
      if (locked && !badge && art) {
        badge = document.createElement("span");
        badge.className = "lock-badge";
        badge.textContent = "🔒 Free account";
        art.appendChild(badge);
      } else if (!locked && badge) {
        badge.remove();
      }
      const heading = $("h3", card);
      if (heading) card.setAttribute("aria-label", heading.textContent + (locked ? " — needs a free account" : ""));
    });
  }
  ["homeModules", "allModules"].forEach(id => {
    const el = document.getElementById(id);
    if (el) new MutationObserver(decorateModules).observe(el, { childList: true });
  });

  const baseOpenLesson = window.openLesson;
  window.openLesson = function openLessonPolished(id) {
    if (lessonData[id] && isLocked(id)) {
      showToast("🔒 Make a free account to unlock this quest. Your progress will be saved too!", "Open account", () => showPage("account"));
      return;
    }
    return baseOpenLesson.apply(this, arguments);
  };

  /* ------------------------------------------------------------------ */
  /* Daily practice streak                                               */
  /* ------------------------------------------------------------------ */
  const STREAK_KEY = "safetyQuestStreakV1";
  const dayKey = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };
  function readStreak() {
    try { return JSON.parse(localStorage.getItem(STREAK_KEY)) || { last: null, count: 0 }; }
    catch { return { last: null, count: 0 }; }
  }
  function currentStreak() {
    const s = readStreak();
    return s.last === dayKey(new Date()) || s.last === yesterdayKey() ? s.count : 0;
  }
  function recordPractice() {
    const s = readStreak();
    const today = dayKey(new Date());
    if (s.last === today) return;
    s.count = s.last === yesterdayKey() ? s.count + 1 : 1;
    s.last = today;
    try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch { /* storage may be blocked */ }
    renderStreak();
  }

  const streakPill = document.createElement("span");
  streakPill.className = "pill streak-pill";
  streakPill.id = "streakPill";
  function renderStreak() {
    const n = currentStreak();
    streakPill.textContent = n > 0 ? "🔥 " + n + "-day streak" : "🔥 Start a streak";
    streakPill.title = "Finish a quiz or a flashcard on different days to grow your streak (saved in this browser).";
  }
  const firstPill = $(".top-actions .pill");
  if (firstPill) firstPill.after(streakPill);
  renderStreak();

  const practiceScore = () => (progress.points || 0) + (progress.quizzes || 0) + (progress.flashcardsKnown || []).length;
  let baseline = practiceScore();

  const basePersist = window.persist;
  window.persist = function persistPolished() {
    if (practiceScore() > baseline) recordPractice();
    return basePersist.apply(this, arguments);
  };
  const baseUpdateStats = window.updateStats;
  window.updateStats = function updateStatsPolished() {
    const result = baseUpdateStats.apply(this, arguments);
    baseline = practiceScore();
    decorateModules();
    return result;
  };

  /* ------------------------------------------------------------------ */
  /* Read aloud                                                          */
  /* ------------------------------------------------------------------ */
  const canSpeak = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  function resetReadButtons() {
    $$(".read-aloud").forEach(b => { b.textContent = "🔊 Read aloud"; b.setAttribute("aria-pressed", "false"); });
  }
  function stopSpeech() {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    resetReadButtons();
  }
  function panelText(panel) {
    return $$("h3, p, li, .callout, .quiz-option", panel)
      .filter(el => !el.closest(".sq-sources, .sq-reading-footer, .sq-emergency-directory, .rw-box, .lesson-actions, .read-aloud"))
      .map(el => el.textContent.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(". ");
  }
  function addReadAloud(content) {
    if (!canSpeak) return;
    const panel = $(".sq-reading, .sq-quiz, .sq-summary", content);
    if (!panel || $(".read-aloud", panel)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary read-aloud";
    button.textContent = "🔊 Read aloud";
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      if (window.speechSynthesis.speaking) { stopSpeech(); return; }
      const utterance = new SpeechSynthesisUtterance(panelText(panel));
      utterance.rate = 0.9;
      utterance.lang = "en-US";
      utterance.onend = utterance.onerror = resetReadButtons;
      window.speechSynthesis.speak(utterance);
      button.textContent = "⏹ Stop reading";
      button.setAttribute("aria-pressed", "true");
    });
    const kicker = $(".sq-reading-kicker", panel);
    if (kicker) kicker.after(button); else panel.prepend(button);
  }

  /* ------------------------------------------------------------------ */
  /* Lesson area: colours, Rocky, read aloud, focus                      */
  /* ------------------------------------------------------------------ */
  const lessonContent = $("#lessonContent");
  let lastSignature = "";
  let lastHadFeedback = false;
  let scheduled = false;

  function onLessonChange() {
    scheduled = false;
    const heading = $(".lesson-panel h3, .lesson-panel h2", lessonContent);
    if (!heading) return;
    paintRocky(lessonContent);
    const hero = $(".lesson-hero", lessonContent);
    if (hero) hero.dataset.module = activeLesson;
    addReadAloud(lessonContent);

    const kicker = ($(".sq-reading-kicker", lessonContent) || {}).textContent || "";
    const signature = activeLesson + "|" + kicker + "|" + heading.textContent;
    const hasFeedback = !!$(".sq-quiz-feedback", lessonContent);
    if (signature !== lastSignature) {
      lastSignature = signature;
      lastHadFeedback = false;
      stopSpeech();
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    } else if (hasFeedback && !lastHadFeedback) {
      const action = $("#sqQuizAction", lessonContent);
      if (action) action.focus({ preventScroll: true });
    }
    lastHadFeedback = hasFeedback;
  }
  if (lessonContent) {
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(onLessonChange);
    }).observe(lessonContent, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ */
  /* Navigation: focus, speech, mobile "More" sheet                      */
  /* ------------------------------------------------------------------ */
  const moreButton = $("#tabMore");
  const moreSheet = $("#moreSheet");
  function closeMore() {
    if (!moreSheet || !moreButton) return;
    moreSheet.hidden = true;
    moreButton.setAttribute("aria-expanded", "false");
  }
  if (moreButton && moreSheet) {
    moreButton.addEventListener("click", () => {
      const opening = moreSheet.hidden;
      moreSheet.hidden = !opening;
      moreButton.setAttribute("aria-expanded", String(opening));
    });
    document.addEventListener("click", e => {
      if (!moreSheet.hidden && !moreSheet.contains(e.target) && !moreButton.contains(e.target)) closeMore();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeMore(); });
  }

  const baseShowPage = window.showPage;
  window.showPage = function showPagePolished(name) {
    const result = baseShowPage.apply(this, arguments);
    stopSpeech();
    closeMore();
    if (moreButton) moreButton.classList.toggle("active", ["customize", "shop", "account"].includes(name));
    if (name !== "lesson") {
      const heading = $("#page-" + name + " h1");
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }
    return result;
  };

  /* ------------------------------------------------------------------ */
  /* Ask Rocky suggestion chips                                          */
  /* ------------------------------------------------------------------ */
  $$(".chat-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const input = $("#chatInput");
      const form = $("#chatForm");
      if (!input || !form || input.disabled) return;
      input.value = chip.dataset.q;
      form.requestSubmit();
    });
  });

  /* ------------------------------------------------------------------ */
  /* First paint                                                         */
  /* ------------------------------------------------------------------ */
  paintRocky();
  decorateModules();
  window.renderThemes();
})();