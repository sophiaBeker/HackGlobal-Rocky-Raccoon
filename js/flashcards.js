// Independent study cards based on the six Safety Quest learning modules.
const safetyFlashcards = [
  {topic:'earthquake',label:'Earthquake Ready',front:'What should you do when an earthquake starts indoors?',back:'Drop, Cover, and Hold On. Protect your head and neck under sturdy cover if available.'},
  {topic:'earthquake',label:'Earthquake Ready',front:'Where should you stay away from during shaking?',back:'Stay away from windows and other glass that could break.'},
  {topic:'earthquake',label:'Earthquake Ready',front:'What should you do after the shaking stops at school?',back:'Listen to your teacher and follow the school emergency plan.'},
  {topic:'fire',label:'Fire Safety Basics',front:'What should you do if you see fire or smell smoke?',back:'Tell a trusted grown-up and follow your practiced escape plan.'},
  {topic:'fire',label:'Fire Safety Basics',front:'What is the rule after leaving a burning building?',back:'Get out and stay out. Never go back inside for belongings.'},
  {topic:'fire',label:'Fire Safety Basics',front:'What should you do if your clothes catch fire?',back:'Stop, Drop, and Roll. Cover your face and roll until flames are out.'},
  {topic:'drill',label:'Practice Makes Ready',front:'Why do schools practice emergency drills?',back:'Drills help you learn the safety steps before an emergency happens.'},
  {topic:'drill',label:'Practice Makes Ready',front:'What should you do when a school alarm sounds?',back:'Stop, listen carefully, and follow your teacher’s instructions.'},
  {topic:'drill',label:'Practice Makes Ready',front:'What should you do if you are unsure where to go?',back:'Stay with your class and ask your teacher for help.'},
  {topic:'shelter',label:'Shelter Together',front:'What does “shelter in place” mean?',back:'Stay inside a designated safe place when trusted adults or officials tell you to.'},
  {topic:'shelter',label:'Shelter Together',front:'Who should you listen to when sheltering in place?',back:'Your teacher, caregiver, or emergency officials.'},
  {topic:'shelter',label:'Shelter Together',front:'What can you do if you feel worried while sheltering?',back:'Tell your teacher or another trusted grown-up how you feel.'},
  {topic:'kit',label:'Emergency Kit Quest',front:'Name three useful emergency-kit supplies.',back:'Water, shelf-stable food, and a flashlight are useful examples.'},
  {topic:'kit',label:'Emergency Kit Quest',front:'Who should help prepare your family emergency kit?',back:'A trusted adult or caregiver should help choose and store supplies.'},
  {topic:'kit',label:'Emergency Kit Quest',front:'Why might a flashlight be useful in an emergency?',back:'It helps people see if the power goes out.'},
  {topic:'help',label:'How to Get Help',front:'Who are examples of trusted grown-ups?',back:'A caregiver, teacher, school staff member, or emergency responder.'},
  {topic:'help',label:'How to Get Help',front:'What should you do if someone online asks for your home address?',back:'Do not share it. Check with a trusted grown-up.'},
  {topic:'help',label:'How to Get Help',front:'Is the emergency phone number the same in every country?',back:'No. Emergency numbers differ around the world. Ask a trusted adult for the local number.'}
];
let flashcardDeck = [...safetyFlashcards];
let flashcardIndex = 0;
let flashcardFlipped = false;
const flashcardKnown = new Set(progress.flashcardsKnown||[]);
const flashcardReviewed = new Set(progress.flashcardsReview||[]);
function persistFlashcardProgress(){progress.flashcardsKnown=[...flashcardKnown];progress.flashcardsReview=[...flashcardReviewed];if(typeof persist==='function')persist();}
function applyFlashcardProgress(){flashcardKnown.clear();flashcardReviewed.clear();(progress.flashcardsKnown||[]).forEach(id=>flashcardKnown.add(id));(progress.flashcardsReview||[]).forEach(id=>flashcardReviewed.add(id));if(typeof renderFlashcard==='function')renderFlashcard();}
const flashcardEls = {
  card:document.getElementById('flashcard'),topic:document.getElementById('flashcardTopicLabel'),
  front:document.getElementById('flashcardPrompt'),hint:document.getElementById('flashcardHint'),
  back:document.getElementById('flashcardAnswer'),count:document.getElementById('flashcardCount'),
  known:document.getElementById('flashcardKnown'),fill:document.getElementById('flashcardProgressFill'),
  previous:document.getElementById('flashcardPrevious'),next:document.getElementById('flashcardNext')
};
function renderFlashcard(){
  if(!flashcardDeck.length){flashcardEls.topic.textContent='NO CARDS';flashcardEls.front.textContent='No cards in this topic.';flashcardEls.hint.textContent='Choose another topic.';flashcardEls.back.hidden=true;return;}
  const card=flashcardDeck[flashcardIndex];
  flashcardEls.topic.textContent=card.label.toUpperCase();
  flashcardEls.front.textContent=flashcardFlipped?'Answer':card.front;
  flashcardEls.back.textContent=card.back;
  flashcardEls.back.hidden=!flashcardFlipped;
  flashcardEls.hint.textContent=flashcardFlipped?'Tap to see the question':'Tap the card to reveal the answer';
  flashcardEls.card.classList.toggle('is-flipped',flashcardFlipped);
  flashcardEls.card.setAttribute('aria-pressed',String(flashcardFlipped));
  flashcardEls.count.textContent='Card '+(flashcardIndex+1)+' of '+flashcardDeck.length;
  const knownInDeck=flashcardDeck.filter(c=>flashcardKnown.has(c.front)).length;
  flashcardEls.known.textContent=knownInDeck+' of '+flashcardDeck.length+' known';
  flashcardEls.fill.style.width=(knownInDeck/flashcardDeck.length*100)+'%';
  flashcardEls.previous.disabled=flashcardIndex===0;
  flashcardEls.next.disabled=flashcardIndex===flashcardDeck.length-1;
  document.getElementById('flashcardKnownButton').textContent=flashcardKnown.has(card.front)?'✓ Known':'✓ I know this';
}
function flipFlashcard(){if(!flashcardDeck.length)return;flashcardFlipped=!flashcardFlipped;renderFlashcard();}
function moveFlashcard(direction){flashcardIndex=Math.max(0,Math.min(flashcardDeck.length-1,flashcardIndex+direction));flashcardFlipped=false;renderFlashcard();}
function setFlashcardTopic(topic){flashcardDeck=topic==='all'?[...safetyFlashcards]:safetyFlashcards.filter(c=>c.topic===topic);flashcardIndex=0;flashcardFlipped=false;renderFlashcard();}
flashcardEls.card.addEventListener('click',flipFlashcard);
flashcardEls.previous.addEventListener('click',()=>moveFlashcard(-1));
flashcardEls.next.addEventListener('click',()=>moveFlashcard(1));
document.getElementById('flashcardKnownButton').addEventListener('click',()=>{if(!flashcardDeck.length)return;const card=flashcardDeck[flashcardIndex];flashcardKnown.add(card.front);flashcardReviewed.delete(card.front);persistFlashcardProgress();moveFlashcard(flashcardIndex===flashcardDeck.length-1?0:1);});
document.getElementById('flashcardReview').addEventListener('click',()=>{if(!flashcardDeck.length)return;flashcardKnown.delete(flashcardDeck[flashcardIndex].front);flashcardReviewed.add(flashcardDeck[flashcardIndex].front);persistFlashcardProgress();moveFlashcard(flashcardIndex===flashcardDeck.length-1?0:1);});
document.getElementById('flashcardTopic').addEventListener('change',e=>setFlashcardTopic(e.target.value));
document.getElementById('shuffleFlashcards').addEventListener('click',()=>{for(let i=flashcardDeck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[flashcardDeck[i],flashcardDeck[j]]=[flashcardDeck[j],flashcardDeck[i]];}flashcardIndex=0;flashcardFlipped=false;renderFlashcard();});
renderFlashcard();
