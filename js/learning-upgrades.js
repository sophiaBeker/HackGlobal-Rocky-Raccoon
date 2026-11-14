/*
 * Safety Quest — learning journey, daily practice, achievements, and display preferences.
 * Loaded after app.js and polish.js so it can use the existing progress and theme helpers.
 * Daily challenge completion is stored per browser; earned quest points use the existing
 * progress persistence path (guest local storage or the signed-in learner record).
 */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const challengeRoot = $("dailyChallenge");
  if (!challengeRoot || typeof progress === "undefined") return;

  const challenges = [
    {
      id: "earthquake-classroom",
      topic: "Earthquake safety",
      prompt: "You are inside a classroom when the ground starts shaking. What should you do?",
      answers: [
        "Run outside as quickly as possible",
        "Drop, Cover, and Hold On",
        "Stand beside the windows"
      ],
      correct: 1,
      why: "That's right! Drop, Cover, and Hold On helps protect your head and neck from falling objects. Follow your teacher's directions."
    },
    {
      id: "fire-outside",
      topic: "Fire safety",
      prompt: "You have safely left a building during a fire. What should you do next?",
      answers: [
        "Stay outside at the meeting place",
        "Go back for something you forgot",
        "Go inside to look for a grown-up"
      ],
      correct: 0,
      why: "Great choice! Stay outside and tell a trusted grown-up or emergency responder. Never go back into a building during a fire."
    },
    {
      id: "emergency-kit",
      topic: "Getting prepared",
      prompt: "Which item is useful to include in a family emergency kit?",
      answers: [
        "A flashlight with extra batteries",
        "A glass decoration",
        "A toy that needs to stay plugged in"
      ],
      correct: 0,
      why: "Yes! A flashlight and extra batteries can help your family see during a power outage. Ask a grown-up to help prepare the kit."
    },
    {
      id: "trusted-adult",
      topic: "Getting help",
      prompt: "You feel unsure about what to do during a school drill. What is a good choice?",
      answers: [
        "Leave the class to find a friend",
        "Guess what to do",
        "Ask your teacher and follow their instructions"
      ],
      correct: 2,
      why: "Exactly! Your teacher knows the school's plan and can help you understand what to do."
    },
    {
      id: "shelter",
      topic: "Shelter-in-place",
      prompt: "Your teacher says your class needs to shelter in place. What should you do?",
      answers: [
        "Stay with your class and follow your teacher",
        "Go outside to see what is happening",
        "Leave to find your backpack"
      ],
      correct: 0,
      why: "Correct! Stay with your class and follow trusted adults and local emergency instructions."
    },
    {
      id: "floodwater",
      topic: "Flood safety",
      prompt: "You see water covering a road or walkway. What should you do?",
      answers: [
        "Walk through it if it looks shallow",
        "Stay away and tell a trusted grown-up",
        "Play in it with a friend"
      ],
      correct: 1,
      why: "Good thinking! Floodwater can be dangerous even when it looks shallow. Stay away and tell a trusted grown-up."
    },
    {
      id: "blackout",
      topic: "Power outages",
      prompt: "The lights go out at home. What is a safe next step?",
      answers: [
        "Find matches and light a candle",
        "Touch the electrical panel",
        "Stay with a trusted grown-up and use a flashlight"
      ],
      correct: 2,
      why: "That's right! Stay with a trusted grown-up. A flashlight is a safer choice than candles or matches."
    }
  ];

  const dayKey = new Date().toLocaleDateString("en-CA");
  const dailyKey = "safetyQuestDailyChallenge";
  const preferenceKey = "safetyQuestDisplayPreferences";
  const challenge = challenges[Math.floor(Date.now() / 86400000) % challenges.length];
  let answered = false;

  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }

  function renderJourney() {
    const root = $("learningJourney");
    if (!root) return;
    const total = Array.isArray(modules) ? modules.length : 0;
    const completed = Array.isArray(progress.completed) ? progress.completed.length : 0;
    const percent = total ? Math.min(100, Math.round(completed / total * 100)) : 0;
    const next = modules.find(item => !progress.completed.includes(item.id));
    root.innerHTML = `
      <div class="journey-summary">
        <div><strong>${completed} of ${total}</strong><span>lessons completed</span></div>
        <div><strong>${percent}%</strong><span>journey progress</span></div>
      </div>
      <div class="journey-track" role="progressbar" aria-label="Lesson completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
        <span style="width:${percent}%"></span>
      </div>
      <p class="journey-next">${next ? "Next up: " + next.icon + " " + next.title : "Amazing work! You have explored every lesson."}</p>
    `;
  }

  function renderAchievements() {
    const root = $("achievementShelf");
    if (!root) return;
    const done = progress.completed || [];
    const known = progress.flashcardsKnown || [];
    const achievements = [
      { icon: "🌱", name: "First Steps", detail: "Complete your first lesson", earned: done.length >= 1 },
      { icon: "🧭", name: "Curious Explorer", detail: "Complete three lessons", earned: done.length >= 3 },
      { icon: "🏆", name: "Safety Champion", detail: "Complete all six lessons", earned: done.length >= modules.length },
      { icon: "🗂️", name: "Card Collector", detail: "Know ten flashcards", earned: known.length >= 10 },
      { icon: "⭐", name: "Bright Star", detail: "Earn 100 quest points", earned: progress.points >= 100 }
    ];
    root.innerHTML = `
      <div class="achievement-heading"><h3>Achievements</h3><span>${achievements.filter(a => a.earned).length} / ${achievements.length} earned</span></div>
      <div class="achievement-grid">
        ${achievements.map(a => `<article class="achievement ${a.earned ? "earned" : "locked"}" ${a.earned ? "" : 'aria-label="Locked achievement: ' + a.name + '"'}>
          <span aria-hidden="true">${a.earned ? a.icon : "🔒"}</span><strong>${a.name}</strong><small>${a.detail}</small>
        </article>`).join("")}
      </div>`;
  }

  function renderChallenge() {
    const saved = readJSON(dailyKey, {});
    const completedToday = saved.date === dayKey && saved.challengeId === challenge.id;
    challengeRoot.innerHTML = `
      <div class="daily-heading"><div><span class="eyebrow">✦ DAILY SAFETY QUEST</span><h3>${challenge.topic}</h3></div><span class="daily-reward">⭐ 5 points</span></div>
      <p class="daily-prompt">${challenge.prompt}</p>
      <div class="daily-options">
        ${challenge.answers.map((answer, index) => `<button type="button" class="daily-option" data-answer="${index}" ${completedToday ? "disabled" : ""}>${answer}</button>`).join("")}
      </div>
      <p class="daily-feedback" id="dailyFeedback" role="status" aria-live="polite">${completedToday ? "✓ Today's challenge is complete. Come back tomorrow for another one!" : "Choose the safest answer to complete today's challenge."}</p>`;
    if (completedToday) {
      challengeRoot.classList.add("is-complete");
      challengeRoot.querySelectorAll(".daily-option").forEach((button, index) => {
        button.classList.toggle("is-correct", index === challenge.correct);
      });
      return;
    }
    challengeRoot.classList.remove("is-complete");
    challengeRoot.querySelectorAll(".daily-option").forEach(button => {
      button.addEventListener("click", () => chooseAnswer(Number(button.dataset.answer)));
    });
  }

  function chooseAnswer(index) {
    if (answered) return;
    answered = true;
    const feedback = $("dailyFeedback");
    const buttons = [...challengeRoot.querySelectorAll(".daily-option")];
    buttons.forEach((button, i) => {
      button.disabled = true;
      if (i === challenge.correct) button.classList.add("is-correct");
      if (i === index && index !== challenge.correct) button.classList.add("is-wrong");
    });
    if (index !== challenge.correct) {
      feedback.textContent = "Good try! " + challenge.why;
      feedback.classList.add("is-try-again");
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "secondary daily-retry";
      retry.textContent = "Try once more";
      retry.addEventListener("click", () => {
        answered = false;
        feedback.classList.remove("is-try-again");
        renderChallenge();
        const firstEnabled = challengeRoot.querySelector(".daily-option");
        if (firstEnabled) firstEnabled.focus();
      });
      feedback.append(" ");
      feedback.append(retry);
      return;
    }

    const saved = { date: dayKey, challengeId: challenge.id };
    try { localStorage.setItem(dailyKey, JSON.stringify(saved)); } catch {}
    progress.points = Math.max(0, Number(progress.points) || 0) + 5;
    if (typeof persist === "function") persist();
    feedback.textContent = "🌟 " + challenge.why + " You earned 5 quest points!";
    challengeRoot.classList.add("is-complete");
    renderJourney();
    renderAchievements();
  }

  function applyPreferences() {
    const prefs = readJSON(preferenceKey, {});
    document.body.classList.toggle("large-text", !!prefs.largeText);
    document.body.classList.toggle("reduce-motion", !!prefs.reduceMotion);
    const large = $("largeTextToggle");
    const motion = $("reducedMotionToggle");
    if (large) {
      large.setAttribute("aria-pressed", String(!!prefs.largeText));
      large.classList.toggle("is-selected", !!prefs.largeText);
    }
    if (motion) {
      motion.setAttribute("aria-pressed", String(!!prefs.reduceMotion));
      motion.classList.toggle("is-selected", !!prefs.reduceMotion);
    }
  }

  function updatePreference(name) {
    const prefs = readJSON(preferenceKey, {});
    prefs[name] = !prefs[name];
    try { localStorage.setItem(preferenceKey, JSON.stringify(prefs)); } catch {}
    applyPreferences();
  }

  $("largeTextToggle")?.addEventListener("click", () => updatePreference("largeText"));
  $("reducedMotionToggle")?.addEventListener("click", () => updatePreference("reduceMotion"));

  const baseUpdateStats = window.updateStats;
  if (typeof baseUpdateStats === "function") {
    window.updateStats = function updateStatsWithLearningJourney() {
      const result = baseUpdateStats.apply(this, arguments);
      renderJourney();
      renderAchievements();
      return result;
    };
  }

  applyPreferences();
  renderJourney();
  renderAchievements();
  renderChallenge();
})();
