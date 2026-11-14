/*
 * "Ask Rocky why": explains wrong quiz answers.
 *
 * Works with js/lesson-experience.js, which exposes window.sqQuizState().
 * Load order: lesson-experience.js, then this file.
 *
 *  - Appears under the feedback box after a wrong answer is checked.
 *  - If AI is enabled and the question comes from a real lesson section, calls
 *    POST /api/explain with only { lessonId, sectionIndex, selectedIndex }.
 *  - Otherwise (AI off, extra question, or request failed) shows a prepared
 *    explanation built from the lesson text, so it never dead-ends.
 */
(() => {
  "use strict";

  if (typeof window.renderLesson !== "function" || typeof window.sqQuizState !== "function") {
    console.warn("rocky-why: load after lesson-experience.js (window.sqQuizState is missing).");
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .rw-box { margin: 12px 0; }
    .rw-reply { display: flex; gap: 10px; align-items: flex-start; margin-top: 10px; }
    .rw-reply .rocky-mini { width: 38px; height: 38px; font-size: 22px; border-radius: 12px; }
    .rw-reply .bubble { white-space: pre-wrap; }
    body.large-text .rw-reply .bubble { font-size: 16px; }
  `;
  document.head.appendChild(style);

  // Cache replies so re-renders don't lose them or re-spend API calls.
  const cache = new Map();

  function preparedExplanation(q) {
    const safest = q.answers[q.correct];
    // Strip leading emoji/symbols only, never real words.
    const point = String(q.callout || q.why || "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
    return (
      "Good thinking, Explorer. Let's look at it together. " +
      (point ? point + " " : "") +
      "That is why the safest choice is: " + safest + ". " +
      "Ask a trusted grown-up to practice this with you."
    );
  }

  async function fetchExplanation(state) {
    const q = state.question;
    const canAskServer = CONFIG.aiEnabled && Number.isInteger(q.sectionIndex);
    if (!canAskServer) return preparedExplanation(q);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(CONFIG.explainEndpoint || "/api/explain", {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: "Bearer " + session.access_token } : {})
        },
        // The server looks the lesson text up itself; nothing else is needed.
        body: JSON.stringify({
          lessonId: state.lessonId,
          sectionIndex: q.sectionIndex,
          selectedIndex: state.selectedIndex
        })
      });
      if (!res.ok) throw new Error("Explain service returned " + res.status);
      const data = await res.json();
      if (!data.reply) throw new Error("Empty reply");
      return data.reply;
    } catch (e) {
      console.warn("rocky-why:", e);
      return preparedExplanation(q);
    } finally {
      clearTimeout(timer);
    }
  }

  function showReply(box, text) {
    box.querySelector(".rw-reply")?.remove();
    const wrap = document.createElement("div");
    wrap.className = "rw-reply";

    const face = document.createElement("div");
    face.className = "rocky-mini";
    face.textContent = "🦝";
    face.setAttribute("aria-hidden", "true");

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text; // textContent: model output is never treated as HTML

    wrap.append(face, bubble);
    box.appendChild(wrap);
  }

  function addWhyControls() {
    const state = window.sqQuizState();
    if (!state || state.mode !== "quiz" || !state.checked) return;

    const q = state.question;
    if (!q || !Number.isInteger(state.selectedIndex)) return;
    if (state.selectedIndex === q.correct) return;       // only for wrong answers
    if (!q.answers[state.selectedIndex]) return;

    const content = document.getElementById("lessonContent");
    const feedback = content?.querySelector(".sq-feedback-wrong");
    if (!feedback || content.querySelector(".rw-box")) return;

    const key = `${state.lessonId}:${Number.isInteger(q.sectionIndex) ? q.sectionIndex : q.question}:${state.selectedIndex}`;

    const box = document.createElement("div");
    box.className = "rw-box";
    box.setAttribute("aria-live", "polite");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "secondary";
    btn.textContent = "Ask Rocky why 🦝";
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Rocky is thinking…";
      const text = await fetchExplanation(state);
      cache.set(key, text);
      btn.remove();
      showReply(box, text);
    });

    box.appendChild(btn);
    feedback.after(box);

    if (cache.has(key)) {
      btn.remove();
      showReply(box, cache.get(key));
    }
  }

  const prevRender = window.renderLesson;
  window.renderLesson = function renderLessonWithWhy() {
    prevRender();
    try { addWhyControls(); } catch (e) { console.warn("rocky-why:", e); }
  };
})();