// Study cards built from the lessons themselves, so they always match the module list.
// Load after scripted-lessons.js and lessons-v2.js (see index.html).
function buildSafetyFlashcards() {
  const cards = [];
  modules.forEach(m => {
    const lesson = lessonData[m.id];
    if (!lesson || !Array.isArray(lesson.sections)) return;
    lesson.sections.forEach(s => {
      if (!s.q || !Array.isArray(s.answers) || !Number.isInteger(s.correct) || !s.answers[s.correct]) return;
      // Drop short cheers such as "Correct!" or "That's right!" from the start of the explanation.
      const why = String(s.why || "").replace(/^[A-Z][\w’' ]{0,14}!\s+/, "").trim();
      const answer = String(s.answers[s.correct]).replace(/[.!?]$/, "") + ".";
      cards.push({ topic: m.id, label: m.title, front: s.q, back: why ? answer + " " + why : answer });
    });
  });
  return cards;
}

const safetyFlashcards = buildSafetyFlashcards();
let flashcardDeck = [...safetyFlashcards];
let flashcardIndex = 0;
let flashcardFlipped = false;
const flashcardKnown = new Set(progress.flashcardsKnown || []);
const flashcardReviewed = new Set(progress.flashcardsReview || []);

function persistFlashcardProgress() {
  progress.flashcardsKnown = [...flashcardKnown];
  progress.flashcardsReview = [...flashcardReviewed];
  if (typeof persist === 'function') persist();
}
function applyFlashcardProgress() {
  flashcardKnown.clear();
  flashcardReviewed.clear();
  (progress.flashcardsKnown || []).forEach(id => flashcardKnown.add(id));
  (progress.flashcardsReview || []).forEach(id => flashcardReviewed.add(id));
  if (typeof renderFlashcard === 'function') renderFlashcard();
}

const flashcardEls = {
  card: document.getElementById('flashcard'), topic: document.getElementById('flashcardTopicLabel'),
  front: document.getElementById('flashcardPrompt'), hint: document.getElementById('flashcardHint'),
  back: document.getElementById('flashcardAnswer'), count: document.getElementById('flashcardCount'),
  known: document.getElementById('flashcardKnown'), fill: document.getElementById('flashcardProgressFill'),
  previous: document.getElementById('flashcardPrevious'), next: document.getElementById('flashcardNext'),
  select: document.getElementById('flashcardTopic')
};

// Fill the topic dropdown from the real module list.
(function fillTopics() {
  const select = flashcardEls.select;
  if (!select) return;
  select.innerHTML = '';
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = 'All modules';
  select.appendChild(all);
  modules.forEach(m => {
    if (!safetyFlashcards.some(c => c.topic === m.id)) return;
    const option = document.createElement('option');
    option.value = m.id;
    option.textContent = m.title;
    select.appendChild(option);
  });
})();

function renderFlashcard() {
  if (!flashcardDeck.length) {
    flashcardEls.topic.textContent = 'NO CARDS';
    flashcardEls.front.textContent = 'No cards in this topic.';
    flashcardEls.hint.textContent = 'Choose another topic.';
    flashcardEls.back.hidden = true;
    flashcardEls.count.textContent = 'Card 0 of 0';
    flashcardEls.known.textContent = '0 known';
    flashcardEls.fill.style.width = '0%';
    return;
  }
  const card = flashcardDeck[flashcardIndex];
  flashcardEls.topic.textContent = card.label.toUpperCase();
  flashcardEls.front.textContent = flashcardFlipped ? 'Answer' : card.front;
  flashcardEls.back.textContent = card.back;
  flashcardEls.back.hidden = !flashcardFlipped;
  flashcardEls.hint.textContent = flashcardFlipped ? 'Tap to see the question' : 'Tap the card to reveal the answer';
  flashcardEls.card.classList.toggle('is-flipped', flashcardFlipped);
  flashcardEls.card.setAttribute('aria-pressed', String(flashcardFlipped));
  flashcardEls.count.textContent = 'Card ' + (flashcardIndex + 1) + ' of ' + flashcardDeck.length;
  const knownInDeck = flashcardDeck.filter(c => flashcardKnown.has(c.front)).length;
  flashcardEls.known.textContent = knownInDeck + ' of ' + flashcardDeck.length + ' known';
  flashcardEls.fill.style.width = (knownInDeck / flashcardDeck.length * 100) + '%';
  flashcardEls.previous.disabled = flashcardIndex === 0;
  flashcardEls.next.disabled = flashcardIndex === flashcardDeck.length - 1;
  document.getElementById('flashcardKnownButton').textContent = flashcardKnown.has(card.front) ? '✓ Known' : '✓ I know this';
}
function flipFlashcard() { if (!flashcardDeck.length) return; flashcardFlipped = !flashcardFlipped; renderFlashcard(); }
function moveFlashcard(direction) {
  flashcardIndex = Math.max(0, Math.min(flashcardDeck.length - 1, flashcardIndex + direction));
  flashcardFlipped = false;
  renderFlashcard();
}
function setFlashcardTopic(topic) {
  flashcardDeck = topic === 'all' ? [...safetyFlashcards] : safetyFlashcards.filter(c => c.topic === topic);
  flashcardIndex = 0;
  flashcardFlipped = false;
  renderFlashcard();
}

flashcardEls.card.addEventListener('click', flipFlashcard);
flashcardEls.previous.addEventListener('click', () => moveFlashcard(-1));
flashcardEls.next.addEventListener('click', () => moveFlashcard(1));
document.getElementById('flashcardKnownButton').addEventListener('click', () => {
  if (!flashcardDeck.length) return;
  const card = flashcardDeck[flashcardIndex];
  flashcardKnown.add(card.front);
  flashcardReviewed.delete(card.front);
  persistFlashcardProgress();
  moveFlashcard(flashcardIndex === flashcardDeck.length - 1 ? 0 : 1);
});
document.getElementById('flashcardReview').addEventListener('click', () => {
  if (!flashcardDeck.length) return;
  const card = flashcardDeck[flashcardIndex];
  flashcardKnown.delete(card.front);
  flashcardReviewed.add(card.front);
  persistFlashcardProgress();
  moveFlashcard(flashcardIndex === flashcardDeck.length - 1 ? 0 : 1);
});
flashcardEls.select.addEventListener('change', e => setFlashcardTopic(e.target.value));
document.getElementById('shuffleFlashcards').addEventListener('click', () => {
  for (let i = flashcardDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flashcardDeck[i], flashcardDeck[j]] = [flashcardDeck[j], flashcardDeck[i]];
  }
  flashcardIndex = 0;
  flashcardFlipped = false;
  renderFlashcard();
});
renderFlashcard();