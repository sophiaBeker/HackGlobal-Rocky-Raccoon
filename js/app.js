/* Configure these public Supabase project values in config.js. Never put a service-role key here. */
const CONFIG = window.SAFETY_QUEST_CONFIG || {};
const supabaseReady = !!(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase);
// Explicitly persist auth sessions in this browser so refreshes do not sign users out.
const supabaseClient = supabaseReady ? window.supabase.createClient(
  CONFIG.supabaseUrl,
  CONFIG.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
) : null;
const modules=[
{id:'earthquake',title:'Earthquake Ready',icon:'🌎',tag:'GUEST QUEST',desc:'Learn how to protect yourself when the ground shakes.',time:'3 min'},
{id:'fire',title:'Fire Safety Basics',icon:'🔥',tag:'ESSENTIAL',desc:'Learn safe choices around fire and what to do if there is one.',time:'4 min'},
{id:'drill',title:'Practice Makes Ready',icon:'🚨',tag:'SCHOOL SMARTS',desc:'Understand alarms, drills, and listening to your teacher.',time:'3 min'},
{id:'shelter',title:'Shelter Together',icon:'🏠',tag:'STAY INFORMED',desc:'Learn what shelter-in-place means and who can guide you.',time:'3 min'},
{id:'kit',title:'Emergency Kit Quest',icon:'🎒',tag:'BE PREPARED',desc:'Discover helpful supplies families may keep ready.',time:'4 min'},
{id:'help',title:'How to Get Help',icon:'🤝',tag:'ASK FOR HELP',desc:'Practice finding a trusted grown-up and sharing important info.',time:'3 min'}];
const lessonData={
earthquake:{title:'Earthquake Ready',icon:'🌎',intro:'Sometimes the ground can shake. Knowing what to do ahead of time can help you protect yourself.',sections:[
{title:'Meet your safety move',body:'If an earthquake starts while you are inside, remember: Drop, Cover, and Hold On.',callout:'🛡️ Drop to your hands and knees. Cover your head and neck and get under a sturdy desk or table if one is nearby. Hold On until the shaking stops.',q:'If the ground starts shaking and you are inside, what should you do?',answers:['Run to the nearest window','Drop, Cover, and Hold On','Use the elevator to leave'],correct:1,why:'That’s right! Drop, Cover, and Hold On helps protect you from falling objects. Stay away from windows.'},
{title:'Practice your plan',body:'When the shaking stops, listen to your teacher or trusted grown-up. They will help you know what to do next.',callout:'🌱 Practice with a grown-up before an emergency. They can show you safe places to take cover.',q:'After the shaking stops at school, what is a good next step?',answers:['Listen to your teacher’s instructions','Push past everyone to get outside','Go look for your belongings alone'],correct:0,why:'Great thinking! Listen to your teacher and follow the school’s emergency plan.'}]},
fire:{title:'Fire Safety Basics',icon:'🔥',intro:'Fire safety means making safe choices and getting help from a grown-up.',sections:[
{title:'Fire means get help',body:'If you see fire or smell smoke, tell a trusted grown-up immediately. Follow the safe route you practiced; do not stop to collect belongings.',callout:'🔥 If your clothes catch fire: Stop, Drop, and Roll. Cover your face and roll until flames are out, then get help.',q:'You notice smoke in your home. What should you do?',answers:['Hide in a closet','Tell a grown-up and follow your family’s escape plan','Look around to find the smoke first'],correct:1,why:'Correct! Get away from danger and follow your practiced escape plan with a trusted grown-up.'},
{title:'Get out and stay out',body:'Families should practice how to get outside and choose a meeting place. Never go back into a burning building.',callout:'🚒 Let grown-ups and emergency professionals handle the emergency.',q:'After you get safely outside during a fire, what should you do?',answers:['Go back for your favorite toy','Stay outside at your family’s meeting place','Go back in if you forgot something'],correct:1,why:'Exactly! Stay outside at the meeting place and let emergency professionals help.'}]},
drill:{title:'Practice Makes Ready',icon:'🚨',intro:'A drill is practice. It helps you learn what to do so the steps feel more familiar.',sections:[
{title:'Listen for the signal',body:'When an alarm or your teacher’s signal begins, stop and listen carefully. Your school has a plan for different situations.',callout:'🏫 Walk, stay with your class, and follow teacher instructions.',q:'During a school drill, what is the safest choice?',answers:['Listen and follow the teacher’s instructions','Race friends to the door','Leave the class to find your backpack'],correct:0,why:'Well done! Your teacher helps your class follow the school’s safety plan.'},
{title:'Keep practicing',body:'Practice helps you remember where to go and how to stay together.',callout:'💬 Ask a trusted grown-up questions about your school’s safety plan.',q:'You are unsure where your class should go during a drill. What can you do?',answers:['Guess and go alone','Ask your teacher for help','Follow a different class'],correct:1,why:'Right! Your teacher can explain the plan.'}]},
shelter:{title:'Shelter Together',icon:'🏠',intro:'Sometimes adults may ask everyone to stay inside a safe building. This can be called sheltering in place.',sections:[
{title:'Stay with trusted adults',body:'If your teacher or caregiver tells you to shelter in place, stay with them and follow their instructions.',callout:'📻 Different situations need different actions. Listen to trusted adults and emergency officials.',q:'Your teacher says your class needs to shelter in place. What should you do?',answers:['Follow your teacher’s directions and stay with the class','Go outside to see what is happening','Call a friend and leave'],correct:0,why:'That’s it! Stay with your class and follow trusted adults.'},
{title:'Ask if you are worried',body:'It is normal to feel unsure during an unusual event. Tell a trusted grown-up how you feel.',callout:'💚 You do not have to figure everything out by yourself.',q:'You feel worried while sheltering in place. What is helpful?',answers:['Keep it to yourself','Tell your teacher or another trusted grown-up','Leave to look for someone'],correct:1,why:'Yes. A trusted grown-up can support you.'}]},
kit:{title:'Emergency Kit Quest',icon:'🎒',intro:'An emergency kit is a collection of useful supplies a family may prepare ahead of time.',sections:[
{title:'What might go in a kit?',body:'Families may keep water, shelf-stable food, a flashlight, batteries, first-aid supplies, and needed medicines managed by adults.',callout:'🎒 Ask a caregiver to show you where your family keeps supplies.',q:'Which item could be useful in an emergency kit?',answers:['A flashlight','A glass decoration','A video game console'],correct:0,why:'Correct! A flashlight can help adults see if the power goes out.'},
{title:'Make a family plan',body:'Children can help by learning where supplies are kept with a grown-up’s guidance.',callout:'👨‍👩‍👧 Make your plan with a trusted adult.',q:'Who should help prepare your family’s emergency kit?',answers:['A trusted adult or caregiver','A stranger online','Nobody; do it alone'],correct:0,why:'Exactly! A trusted adult can help choose and store supplies.'}]},
help:{title:'How to Get Help',icon:'🤝',intro:'You never need to handle an emergency alone. Learn who you can go to when you need help.',sections:[
{title:'Find a trusted grown-up',body:'A trusted grown-up might be your teacher, caregiver, school staff member, or emergency responder.',callout:'📣 If there is immediate danger, get to a safer place if you can and follow emergency instructions. Use the emergency number for the country you are in; numbers differ around the world.',q:'You are scared during an emergency. What is a good choice?',answers:['Find or tell a trusted grown-up','Keep it secret','Follow an unknown person'],correct:0,why:'Right! Trusted grown-ups and emergency responders can help.'},
{title:'Practice what to share',body:'With a caregiver, practice knowing your full name and how to reach a trusted adult.',callout:'🔐 Never post your home address or private details in a game or chat.',q:'Someone online asks for your home address. What should you do?',answers:['Send it right away','Do not share it; check with a trusted grown-up','Share a photo of your house'],correct:1,why:'Well done! Keep private information safe.'}]}
};
const guestKey='safetyQuestGuestProgressV2';

const themeCatalog={
  earthquake:{name:'Earth & Stone',emoji:'🌎',vars:{'--ink':'#493729','--muted':'#75614e','--green':'#8a6243','--green2':'#eadbc9','--lime':'#d7bd9d','--cream':'#f7f0e7','--card':'#fffdf9','--orange':'#bd8651','--line':'#e7d9c8'}},
  fire:{name:'Ember & Flame',emoji:'🔥',vars:{'--ink':'#642f29','--muted':'#87534a','--green':'#b44835','--green2':'#f4d8cf','--lime':'#f2b8a5','--cream':'#fff1eb','--card':'#fffdfa','--orange':'#e17a45','--line':'#efd5cb'}},
  flood:{name:'Tidal Blue',emoji:'🌊',vars:{'--ink':'#173f61','--muted':'#52748b','--green':'#287da2','--green2':'#d7edf5','--lime':'#b9e1ed','--cream':'#eff8fb','--card':'#ffffff','--orange':'#e6b86c','--line':'#d2e6ee'}},
  kit:{name:'Ready & Rooted',emoji:'🎒',vars:{'--ink':'#43513a','--muted':'#68765a','--green':'#758b4c','--green2':'#e5ebd6','--lime':'#d6e0b8','--cream':'#f5f7ed','--card':'#fffefa','--orange':'#c99a58','--line':'#e0e7d4'}},
  help:{name:'First Responder',emoji:'🚑',vars:{'--ink':'#3e3b5c','--muted':'#686582','--green':'#596f9d','--green2':'#e2e8f4','--lime':'#cbd7ee','--cream':'#f5f6fb','--card':'#ffffff','--orange':'#d9a45d','--line':'#e0e4ef'}},
  blackout:{name:'Midnight & Silver',emoji:'🔦',vars:{'--ink':'#343b46','--muted':'#626d7b','--green':'#657487','--green2':'#e1e5ea','--lime':'#cbd2da','--cream':'#f2f4f6','--card':'#ffffff','--orange':'#e1b65f','--line':'#dce1e7'}}
};
const avatarCatalog={
  classic:{name:'Classic Rocky',color:'#92999b',price:0,description:'Rocky’s familiar gray fur.'},
  red:{name:'Berry Rocky',color:'#c96f72',price:25,description:'A cheerful berry-red coat.'},
  blue:{name:'Sky Rocky',color:'#6da6ce',price:30,description:'A bright sky-blue coat.'},
  purple:{name:'Plum Rocky',color:'#9a80bd',price:50,description:'A playful plum-purple coat.'},
  gold:{name:'Sunny Rocky',color:'#e2b64e',price:50,description:'A warm golden coat.'},
  mint:{name:'Mint Rocky',color:'#72b99a',price:65,description:'A fresh mint-green coat.'}
};
const accessoryCatalog={
  none:{name:'No accessory',emoji:'',price:0,description:'Rocky’s classic look.'},
  bow:{name:'Bright bow',emoji:'🎀',price:20,description:'A colorful bow for Rocky.'},
  crown:{name:'Little crown',emoji:'👑',price:45,description:'A tiny crown fit for a quest hero.'},
  glasses:{name:'Cool glasses',emoji:'🕶️',price:35,description:'Rocky’s coolest look.'},
  explorer:{name:'Explorer hat',emoji:'🧢',price:40,description:'Ready for the next adventure.'},
  star:{name:'Shiny star',emoji:'⭐',price:30,description:'A little sparkle for Rocky.'},
  scarf:{name:'Cozy scarf',emoji:'🧣',price:35,description:'A cozy finishing touch.'}
};
function raccoonMarkup(avatarKey,accessoryKey,size='large'){
  const fur=avatarCatalog[avatarKey]?.color||avatarCatalog.classic.color;
  const accessory=accessoryCatalog[accessoryKey]?.emoji||'';
  return '<span class="raccoon-art '+size+' '+(accessoryKey&&accessoryKey!=='none'?'has-accessory accessory-'+accessoryKey:'')+'" style="--fur:'+fur+'" aria-hidden="true"><svg viewBox="0 0 100 100" role="img"><path class="raccoon-ears" d="M22 37 14 10 39 25M78 37 86 10 61 25"/><path class="raccoon-head" d="M16 49C16 25 31 16 50 16s34 9 34 33c0 25-14 39-34 39S16 74 16 49Z"/><path class="raccoon-mask" d="M17 48c10-12 23-12 33-4 10-8 23-8 33 4-5 15-16 20-33 11-17 9-28 4-33-11Z"/><ellipse cx="37" cy="48" rx="4" ry="5" fill="#fff"/><ellipse cx="63" cy="48" rx="4" ry="5" fill="#fff"/><circle cx="38" cy="49" r="2" fill="#26312e"/><circle cx="62" cy="49" r="2" fill="#26312e"/><ellipse cx="50" cy="65" rx="7" ry="5" fill="#303633"/><path d="M43 72q7 6 14 0" fill="none" stroke="#303633" stroke-width="2.5" stroke-linecap="round"/></svg>'+(accessory?'<span class="raccoon-accessory">'+accessory+'</span>':'')+'</span>';
}
function updateAvatarDisplay(){
  const avatar=progress.activeAvatar||'classic',accessory=progress.activeAccessory||'none';
  const profile=document.querySelector('.profile .avatar');
  if(profile)profile.innerHTML=raccoonMarkup(avatar,accessory,'small');
  const preview=document.getElementById('shopAvatarPreview');
  if(preview)preview.innerHTML=raccoonMarkup(avatar,accessory,'large');
  const customPreview=document.getElementById('customizeAvatarPreview');
  if(customPreview)customPreview.innerHTML=raccoonMarkup(avatar,accessory,'large');
}
function renderShop(){
  const ownedAvatars=progress.ownedAvatars||['classic'],ownedAccessories=progress.ownedAccessories||['none'];
  const avatarEl=document.getElementById('avatarShop'),accessoryEl=document.getElementById('accessoryShop');
  const pointsEl=document.getElementById('shopPoints');if(pointsEl)pointsEl.textContent=progress.points||0;
  if(avatarEl)avatarEl.innerHTML=Object.entries(avatarCatalog).map(([key,item])=>{
    const owned=ownedAvatars.includes(key);
    return '<article class="shop-item"><div class="shop-item-art">'+raccoonMarkup(key,'none','large')+'</div><strong>'+item.name+'</strong><p>'+item.description+'</p><small>'+(owned?'Already owned':'⭐ '+item.price+' points')+'</small><button class="secondary" type="button" onclick="showShopDetails(\'avatar\',\''+key+'\')">View details</button><button class="'+(owned?'secondary':'btn')+'" type="button" '+(owned?'disabled':'')+' onclick="buyAvatar(\''+key+'\')">'+(owned?'Owned':'Buy · '+item.price)+'</button></article>';
  }).join('');
  if(accessoryEl)accessoryEl.innerHTML=Object.entries(accessoryCatalog).filter(([key])=>key!=='none').map(([key,item])=>{
    const owned=ownedAccessories.includes(key);
    return '<article class="shop-item"><div class="shop-item-art accessory-art">'+item.emoji+'</div><strong>'+item.name+'</strong><p>'+item.description+'</p><small>'+(owned?'Already owned':'⭐ '+item.price+' points')+'</small><button class="secondary" type="button" onclick="showShopDetails(\'accessory\',\''+key+'\')">View details</button><button class="'+(owned?'secondary':'btn')+'" type="button" '+(owned?'disabled':'')+' onclick="buyAccessory(\''+key+'\')">'+(owned?'Owned':'Buy · '+item.price)+'</button></article>';
  }).join('');
  updateAvatarDisplay();
}
function showShopDetails(type,key){
  const item=(type==='avatar'?avatarCatalog:accessoryCatalog)[key];
  const panel=document.getElementById('shopDetails');
  if(!item||!panel)return;
  const owned=(type==='avatar'?(progress.ownedAvatars||[]):(progress.ownedAccessories||[])).includes(key);
  const preview=type==='avatar'?raccoonMarkup(key,'none','large'):'<span class="shop-detail-emoji">'+item.emoji+'</span>';
  panel.innerHTML='<div class="shop-detail-preview">'+preview+'</div><div class="shop-detail-copy"><h3>'+item.name+'</h3><p>'+item.description+'</p><p><strong>'+(owned?'Already in your collection':'Price: ⭐ '+item.price+' quest points')+'</strong></p><button class="btn" type="button" '+(owned||progress.points<item.price?'disabled':'')+' onclick="'+(type==='avatar'?'buyAvatar':'buyAccessory')+'(\''+key+'\')">'+(owned?'Owned':progress.points<item.price?'Not enough points':'Buy · '+item.price+' points')+'</button></div><button class="shop-detail-close secondary" type="button" onclick="document.getElementById(\'shopDetails\').hidden=true" aria-label="Close item details">Close</button>';
  panel.hidden=false;
  panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderCustomization(){
  const avatarEl=document.getElementById('ownedAvatarChoices'),accessoryEl=document.getElementById('ownedAccessoryChoices');
  const ownedAvatars=progress.ownedAvatars||['classic'],ownedAccessories=progress.ownedAccessories||['none'];
  if(avatarEl)avatarEl.innerHTML=ownedAvatars.map(key=>{const item=avatarCatalog[key];if(!item)return '';const active=(progress.activeAvatar||'classic')===key;return '<article class="shop-item '+(active?'shop-item-active':'')+'"><div class="shop-item-art">'+raccoonMarkup(key,'none','large')+'</div><strong>'+item.name+'</strong><small>'+(active?'Currently selected':'Owned')+'</small><button class="'+(active?'secondary':'btn')+'" type="button" '+(active?'disabled':'')+' onclick="equipAvatar(\''+key+'\')">'+(active?'Selected':'Wear avatar')+'</button></article>'}).join('');
  if(accessoryEl)accessoryEl.innerHTML=ownedAccessories.map(key=>{const item=accessoryCatalog[key];if(!item)return '';const active=(progress.activeAccessory||'none')===key;return '<article class="shop-item '+(active?'shop-item-active':'')+'"><div class="shop-item-art accessory-art">'+(item.emoji||'🦝')+'</div><strong>'+item.name+'</strong><small>'+(active?'Currently equipped':'Owned')+'</small><button class="'+(active?'secondary':'btn')+'" type="button" '+(active?'disabled':'')+' onclick="equipAccessory(\''+key+'\')">'+(active?'Equipped':'Wear accessory')+'</button></article>'}).join('');
  updateAvatarDisplay();renderThemes();
}
function equipAvatar(key){if(!(progress.ownedAvatars||[]).includes(key))return;progress.activeAvatar=key;persist();renderCustomization();shopNotice('Rocky is now wearing '+avatarCatalog[key].name+'!');}
function equipAccessory(key){if(!(progress.ownedAccessories||[]).includes(key))return;progress.activeAccessory=key;persist();renderCustomization();shopNotice('Rocky’s accessory has been updated!');}
function shopNotice(message){const el=document.getElementById('shopMessage');if(el)el.textContent=message;}
function buyAvatar(key){
  const item=avatarCatalog[key];if(!item)return;
  progress.ownedAvatars=progress.ownedAvatars||['classic'];
  if(progress.ownedAvatars.includes(key)){progress.activeAvatar=key;shopNotice(item.name+' is now your avatar!');}
  else if(progress.points<item.price){shopNotice('You need '+(item.price-progress.points)+' more quest points to buy '+item.name+'.');return;}
  else{progress.points-=item.price;progress.ownedAvatars.push(key);progress.activeAvatar=key;shopNotice('You bought '+item.name+'! Nice choice, Explorer.');}
  persist();renderShop();updateStats();
}
function buyAccessory(key){
  const item=accessoryCatalog[key];if(!item)return;
  progress.ownedAccessories=progress.ownedAccessories||['none'];
  if(progress.ownedAccessories.includes(key)){progress.activeAccessory=key;shopNotice(item.name+' is now part of Rocky’s outfit!');}
  else if(progress.points<item.price){shopNotice('You need '+(item.price-progress.points)+' more quest points to buy '+item.name+'.');return;}
  else{progress.points-=item.price;progress.ownedAccessories.push(key);progress.activeAccessory=key;shopNotice('You bought '+item.name+'! Rocky looks great.');}
  persist();renderShop();updateStats();
}
function applySiteTheme(){const key=progress.activeTheme||'default';document.documentElement.dataset.theme=key;if(key==='default'){document.documentElement.removeAttribute('style');return;}const vars=themeCatalog[key]?.vars;if(!vars)return;Object.entries(vars).forEach(([name,value])=>document.documentElement.style.setProperty(name,value));}
function chooseTheme(key){if(key!=='default'&&!(progress.unlockedThemes||[]).includes(key))return;progress.activeTheme=key;applySiteTheme();persist();renderThemes();updateAvatarDisplay();}
function renderThemes(){const el=document.getElementById('themeCollection');if(!el)return;const unlocked=progress.unlockedThemes||[];const choices=[{key:'default',name:'Safety Quest Classic',emoji:'🌿',desc:'Your original Safety Quest colors.'},...Object.entries(themeCatalog).map(([key,t])=>({key,name:t.name,emoji:t.emoji,desc:'Earned by a perfect '+t.name.replace(/^[^ ]+ /,'')+' module quiz.'}))];el.innerHTML=choices.map(t=>{const open=t.key==='default'||unlocked.includes(t.key);const active=(progress.activeTheme||'default')===t.key;return '<button type="button" class="theme-choice '+(active?'selected':'')+'" '+(!open?'disabled':'')+' onclick="chooseTheme(\''+t.key+'\')"><span class="theme-emoji">'+t.emoji+'</span><span class="theme-copy"><strong>'+t.name+'</strong><small>'+(active?'Currently applied':open?'Unlocked · tap to apply':'🔒 Complete the module quiz perfectly')+'</small></span><span class="theme-status">'+(active?'✓':open?'Apply':'🔒')+'</span></button>'}).join('');const count=document.getElementById('themeUnlockCount');if(count)count.textContent=unlocked.length+' / 6 unlocked';}

const emptyProgress=()=>({completed:[],points:0,quizzes:0,unlockedThemes:[],activeTheme:'default',flashcardsKnown:[],flashcardsReview:[],ownedAvatars:['classic'],activeAvatar:'classic',ownedAccessories:['none'],activeAccessory:'none'});
let user=null,session=null,progress=emptyProgress(),activeLesson='',sectionIndex=0,selectedAnswer=null,answered=false,lessonCorrectAnswers=0,chatHistory=[];
function normalizeProgress(value){const p={...emptyProgress(),...(value&&typeof value==='object'?value:{})};for(const key of ['completed','unlockedThemes','flashcardsKnown','flashcardsReview','ownedAvatars','ownedAccessories'])p[key]=Array.isArray(p[key])?p[key]:emptyProgress()[key];p.points=Math.max(0,Number(p.points)||0);p.quizzes=Math.max(0,Number(p.quizzes)||0);return p}
function readGuestProgress(){try{const raw=localStorage.getItem(guestKey);return raw?normalizeProgress(JSON.parse(raw)):null}catch(e){console.warn('Could not read guest progress from this browser.',e);return null}}
function readGuest(){const saved=readGuestProgress();progress=saved||emptyProgress();return !!saved}
function saveGuestProgress(){try{localStorage.setItem(guestKey,JSON.stringify(normalizeProgress(progress)));return true}catch(e){console.warn('Could not save guest progress. Browser storage may be unavailable or full.',e);shopNotice('Progress could not be saved in this browser. Check your browser storage settings.');return false}}
function persist(){progress=normalizeProgress(progress);if(user&&supabaseReady){saveRemoteProgress()}else{saveGuestProgress()}updateStats()}
function mergeGuestProgress(account,guest){const merged=normalizeProgress(account),local=normalizeProgress(guest);for(const key of ['completed','unlockedThemes','flashcardsKnown','flashcardsReview','ownedAvatars','ownedAccessories'])merged[key]=[...new Set([...merged[key],...local[key]])];merged.points+=local.points;merged.quizzes+=local.quizzes;if(local.activeTheme==='default'||merged.unlockedThemes.includes(local.activeTheme))merged.activeTheme=local.activeTheme;if(merged.ownedAvatars.includes(local.activeAvatar))merged.activeAvatar=local.activeAvatar;if(merged.ownedAccessories.includes(local.activeAccessory))merged.activeAccessory=local.activeAccessory;return merged}
function progressPayload(){return {user_id:user.id,completed:progress.completed,points:progress.points,quizzes:progress.quizzes,unlocked_themes:progress.unlockedThemes,active_theme:progress.activeTheme,flashcards_known:progress.flashcardsKnown,flashcards_review:progress.flashcardsReview,owned_avatars:progress.ownedAvatars,active_avatar:progress.activeAvatar,owned_accessories:progress.ownedAccessories,active_accessory:progress.activeAccessory,updated_at:new Date().toISOString()}}
async function saveRemoteProgress(){if(!user||!supabaseReady)return false;try{const {error}=await supabaseClient.from('learner_progress').upsert(progressPayload(),{onConflict:'user_id'});if(error)throw error;shopNotice('Progress saved to your account.');return true}catch(e){console.warn('Could not save learner progress. Check that the latest Supabase schema migration has been run.',e);shopNotice('Save failed. Your guest progress is still stored in this browser; try again later.');return false}}
async function loadRemoteProgress(){if(!user||!supabaseReady)return;try{const {data,error}=await supabaseClient.from('learner_progress').select('*').eq('user_id',user.id).maybeSingle();if(error)throw error;const account=data?normalizeProgress({completed:data.completed,points:data.points,quizzes:data.quizzes,unlockedThemes:data.unlocked_themes,activeTheme:data.active_theme,flashcardsKnown:data.flashcards_known,flashcardsReview:data.flashcards_review,ownedAvatars:data.owned_avatars,activeAvatar:data.active_avatar,ownedAccessories:data.owned_accessories,activeAccessory:data.active_accessory}):emptyProgress();const guest=readGuestProgress();progress=guest?mergeGuestProgress(account,guest):account;if(guest){const saved=await saveRemoteProgress();if(saved){try{localStorage.removeItem(guestKey);shopNotice('Your guest progress has been added to your account!')}catch(e){console.warn('Guest progress was saved, but the local copy could not be cleared.',e)}}} }catch(e){console.warn('Could not load account progress. Keeping locally saved guest progress available.',e);if(!readGuestProgress())progress=emptyProgress()}applySiteTheme();if(typeof applyFlashcardProgress==='function')applyFlashcardProgress();updateStats();renderModules();renderThemes();renderShop()}
function updateStats(){document.getElementById('pointsTop').textContent=progress.points;document.getElementById('pointsStat').textContent=progress.points;document.getElementById('sidePoints').textContent=progress.points+' quest points';document.getElementById('lessonsDone').textContent =progress.completed.length + ' / ' + modules.length;document.getElementById('quizzesDone').textContent=progress.quizzes;document.getElementById('profileName').textContent=user?(user.user_metadata?.display_name||'Explorer'):'Guest Explorer';document.getElementById('profileMode').textContent=user?'Signed in · progress saved':'Guest mode · this browser';document.getElementById('topAuth').textContent=user?'Log out':'Log in';renderThemes();updateAvatarDisplay();}
function moduleCard(m){let done=progress.completed.includes(m.id);return `<article class="module-card" tabindex="0" role="button" onclick="openLesson('${m.id}')" onkeydown="if(event.key==='Enter')openLesson('${m.id}')"><div class="module-art"><span class="tag">${done?'✓ COMPLETED':m.tag}</span>${m.icon}</div><h3>${m.title}</h3><p>${m.desc}</p><div class="module-foot"><span>◷ ${m.time} · Beginner</span><span>${done?'↻':'→'}</span></div><div class="progress"><span style="width:${done?'100%':'0%'}"></span></div></article>`}
function renderModules(){document.getElementById('homeModules').innerHTML=modules.slice(0,3).map(moduleCard).join('');filterModules()}
function filterModules(){let q=(document.getElementById('moduleSearch')?.value||'').toLowerCase();let arr=modules.filter(m=>(m.title+' '+m.desc+' '+m.id+' '+m.tag).toLowerCase().includes(q));document.getElementById('allModules').innerHTML=arr.map(moduleCard).join('');document.getElementById('noResults').style.display=arr.length?'none':'block'}
function showPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById('page-'+name)?.classList.add('active');document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===name));document.getElementById('crumbPage').textContent=({home:'Home',explore:'Explore lessons',flashcards:'Flashcards',shop:'Rocky’s Shop',customize:'Customize',rocky:'Ask Rocky',account:'Account',lesson:'Your lesson'})[name]||'Home';window.scrollTo({top:0,behavior:'smooth'});if(name==='explore')filterModules();if(name==='shop')renderShop();if(name==='customize')renderCustomization();if(name==='account')renderAccount();if(name==='rocky' && typeof renderConversationHistory === 'function'){renderConversationHistory();}}
const GUEST_LESSON_IDS = new Set(["earthquake"]);
function openLesson(id) {if (!lessonData[id]) {console.warn("Unknown lesson:", id);return;}if (!user && !GUEST_LESSON_IDS.has(id)) {const proceed = confirm("Guest mode is available for the Earthquake Ready lesson. " + "Create an account to unlock the full lesson library. " + "Open account options?");if (proceed) showPage("account");return;}activeLesson = id;sectionIndex = 0;selectedAnswer = null;answered = false;lessonCorrectAnswers=0;renderLesson();showPage("lesson");}
function renderLesson(){let d=lessonData[activeLesson];if(!d)return;if(sectionIndex>=d.sections.length){let done=progress.completed.includes(activeLesson);const perfectRun=lessonCorrectAnswers===d.sections.length;const newlyUnlocked=perfectRun&&!(progress.unlockedThemes||[]).includes(activeLesson);if(perfectRun){progress.unlockedThemes=Array.from(new Set([...(progress.unlockedThemes||[]),activeLesson]));if(newlyUnlocked)persist();}document.getElementById('lessonContent').innerHTML=`<div class="lesson-panel finish"><div class="big">🏆</div><h2>Quest complete!</h2><p>${done?'Great review, Explorer!':'You practiced an important safety skill. Review your family or school plan with a trusted grown-up.'}</p><div style="font:900 15px Nunito;color:var(--green);margin:15px 0">${perfectRun?(newlyUnlocked?'🌟 Perfect score! You unlocked the '+themeCatalog[activeLesson].name+' theme!':'🌟 Perfect score! You earned this module’s theme.'):'Keep practicing to earn this module’s theme.'}</div><button class="btn" onclick="showPage('explore')">Choose another quest →</button> <button class="secondary" onclick="showPage('home')">Home</button></div>`;if(!done){progress.completed.push(activeLesson);progress.points+=20;persist();renderModules()}return}
let s=d.sections[sectionIndex];document.getElementById('lessonContent').innerHTML=`<div class="lesson-hero"><div class="lesson-emoji">${d.icon}</div><div><span class="eyebrow" style="background:white;color:var(--green);border-color:#dbe6d5">SAFETY QUEST · ${sectionIndex+1} OF ${d.sections.length}</span><h2>${d.title}</h2><p>${d.intro}</p></div></div><div class="step-indicator">${d.sections.map((_,i)=>`<span class="step-dot ${i<=sectionIndex?'done':''}"></span>`).join('')}</div><div class="lesson-panel"><h3>${s.title}</h3><p>${s.body}</p><div class="callout">${s.callout}</div><h3 style="font-size:18px;margin-top:22px">Rocky’s quick check 🦝</h3><p>${s.q}</p><div class="quiz-options">${s.answers.map((a,i)=>`<button class="quiz-option ${answered&&i===s.correct?'correct':''} ${answered&&selectedAnswer===i&&i!==s.correct?'wrong':''}" ${answered?'disabled':''} onclick="chooseAnswer(${i})">${String.fromCharCode(65+i)}. ${a}</button>`).join('')}</div><div class="feedback">${answered? selectedAnswer === s.correct? '✅ Correct! ' + s.why: '💡 Not quite. You chose: ' +s.answers[selectedAnswer] +'. The safest answer is: ' +s.answers[s.correct] +'. ' +s.why: ''}</div><div class="lesson-actions"><button class="secondary" onclick="showPage('explore')">Exit lesson</button><button class="btn" ${!answered?'disabled':''} onclick="nextSection()">${sectionIndex===d.sections.length-1?'Finish quest':'Next step →'}</button></div></div>`}
function chooseAnswer(i){if(answered)return;selectedAnswer=i;answered=true;progress.quizzes++;if(i===lessonData[activeLesson].sections[sectionIndex].correct){progress.points+=5;lessonCorrectAnswers++;}persist();renderLesson()}
function nextSection(){if(!answered)return;sectionIndex++;selectedAnswer=null;answered=false;renderLesson()}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));document.getElementById('moduleSearch').addEventListener('input',filterModules);
function renderAccount(){const el=document.getElementById('accountContent');if(user){el.innerHTML=`<div class="panel"><h3>Welcome back, Explorer!</h3><p class="desc">Your account is signed in.</p><div class="account-row"><span>Email</span><strong>${escapeHtml(user.email||'')}</strong></div><div class="account-row"><span>Lessons completed</span><strong>${progress.completed.length} / ${modules.length}</strong></div><div class="account-row"><span>Quest points</span><strong>${progress.points}</strong></div><p class="chat-tip">Your progress is saved to the configured Supabase project.</p><button class="secondary" onclick="logout()">Log out</button></div>`;return}
let setupNote=supabaseReady?'Create an account to save your progress and unlock all six lessons.':'Guest mode is ready. For real account creation, the project owner must configure Supabase using the setup guide. No password is stored by this demo.';el.innerHTML=`<div class="panel"><h3>Join the adventure</h3><p class="desc">Create an account or log in to save your progress.</p><div id="authNotice" class="notice">${setupNote}</div><div class="form-grid"><div class="field"><label for="displayName">Choose a nickname</label><input id="displayName" autocomplete="nickname" maxlength="20" placeholder="e.g. StarryFox or BraveBadger"><p class="chat-tip">Use a fun nickname instead of your real name. Avoid your full name, birthday, school, or other personal details.</p></div><div class="field"><label for="authEmail">Email</label><input id="authEmail" type="email" autocomplete="email" placeholder="you@example.com" required></div><div class="field"><label for="authPassword">Password</label><input id="authPassword" type="password" autocomplete="current-password" minlength="8" placeholder="At least 8 characters" required></div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="authAction('signup')">Create account</button><button class="secondary" onclick="authAction('login')">Log in</button></div><p class="form-switch">You can keep using <button class="link-btn" onclick="showPage('home')">guest mode</button> without signing up.</p></div>`}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function authAction(mode){const notice=document.getElementById('authNotice'),email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value,name=document.getElementById('displayName').value.trim();if(!supabaseReady){notice.textContent='Supabase is not configured yet. Follow README.md to enable real sign-up/login. Guest mode and lessons still work.';return}if(!email||password.length<8){notice.textContent='Enter a valid email and a password with at least 8 characters.';return}if(mode==='signup'&&!/^[A-Za-z0-9 _-]{3,20}$/.test(name)){notice.textContent='Choose a nickname with 3–20 letters, numbers, spaces, hyphens, or underscores. Do not use your real name.';return}notice.textContent='Working…';let result;if(mode==='signup')result=await supabaseClient.auth.signUp({email,password,options:{data:{display_name:name||'Explorer'}}});else result=await supabaseClient.auth.signInWithPassword({email,password});if(result.error){notice.textContent=result.error.message;return}if(mode==='signup'&&!result.data.session){notice.textContent='Account created! Check your email for the confirmation link, then log in.';return}session=result.data.session;user=result.data.user;await loadRemoteProgress();updateStats();renderAccount();notice.textContent=mode==='signup'?'Account created! Your guest progress has been carried over. Welcome to Safety Quest.':'You are logged in!';}
async function logout(){resetConversationHistory();if(supabaseReady)await supabaseClient.auth.signOut();user=null;session=null;progress={completed:[],points:0,quizzes:0,unlockedThemes:[],activeTheme:'default',flashcardsKnown:[],flashcardsReview:[],ownedAvatars:['classic'],activeAvatar:'classic',ownedAccessories:['none'],activeAccessory:'none'};readGuest();applySiteTheme();if(typeof applyFlashcardProgress==='function')applyFlashcardProgress();updateStats();renderAccount();showPage('home')}
async function initAuth(){if(supabaseReady){const {data}=await supabaseClient.auth.getSession();session=data.session;user=session?.user||null;supabaseClient.auth.onAuthStateChange((_event,newSession)=>{
    if ((user?.id || null) !== (newSession?.user?.id || null)) {
        resetConversationHistory();}session=newSession;user=newSession?.user||null;if(user)loadRemoteProgress();else{readGuest();applySiteTheme();if(typeof applyFlashcardProgress==='function')applyFlashcardProgress();updateStats()}renderAccount()});if(user)await loadRemoteProgress();else readGuest()}else readGuest();applySiteTheme();if(typeof applyFlashcardProgress==='function')applyFlashcardProgress();updateStats();renderModules();renderThemes();renderShop();renderAccount()}
const prepared=[
{keys:['earthquake','shake','drop','cover','hold on'],answer:'For an earthquake indoors, remember Drop, Cover, and Hold On. Drop to your hands and knees, protect your head and neck under sturdy cover if available, and hold on until the shaking stops. Follow your teacher or caregiver’s instructions afterward.'},
{keys:['fire','smoke','match','lighter','burn'],answer:'Stay away from matches and lighters. If you see fire or smell smoke, alert a trusted grown-up and follow your practiced escape plan. Get outside and stay outside during a building fire. Never go back in for belongings.'},
{keys:['drill','alarm','school'],answer:'During a school drill, stop and listen carefully to your teacher. Follow your school’s plan, walk calmly, stay with your class, and ask questions when it is safe.'},
{keys:['shelter','inside','stay in'],answer:'Shelter in place means staying inside a designated safe place when trusted adults or officials tell you to. Stay with your teacher or caregiver and follow their directions.'},
{keys:['kit','flashlight','water','supply'],answer:'A family emergency kit may include water, shelf-stable food, a flashlight, batteries, first-aid supplies, and medicines managed by adults. Ask your caregiver to prepare a kit that fits your family.'},
{keys:['help','grown-up','grown up','adult','emergency number','scared','worried'],answer:'You do not have to handle an emergency alone. Tell a trusted grown-up, such as your teacher, caregiver, school staff member, or emergency responder. Use the emergency number for the country you are in. Ask a trusted adult to help you find the correct local number.'}
];
function preparedAnswer(q){const t=q.toLowerCase();for(const x of prepared)if(x.keys.some(k=>t.includes(k)))return x.answer;return 'That is a good question, Explorer! I can help with earthquake safety, fire safety, school drills, sheltering in place, emergency kits, and getting help. Try asking about one of those topics, and remember to talk with a trusted grown-up about your own family or school plan.'}
async function askRocky(q){if(!CONFIG.aiEnabled)return preparedAnswer(q);try{const res=await fetch(CONFIG.chatEndpoint||'/api/chat',{method:'POST',headers:{'Content-Type':'application/json',...(session?.access_token?{Authorization:'Bearer '+session.access_token}:{})},body:JSON.stringify({message:q,history:chatHistory.slice(-10)})});if(!res.ok)throw new Error('Chat service returned '+res.status);const data=await res.json();if(!data.reply)throw new Error('Empty reply');return data.reply}catch(e){console.error(e);return 'I am having trouble connecting right now. Here is a prepared safety tip: stay with a trusted grown-up and follow your school or family emergency plan. You can try your question again in a moment.'}}

function renderRockyMessage(element, text){
  // Render only the small Markdown subset Rocky needs. Build DOM nodes rather
  // than using innerHTML so model output can never inject HTML or scripts.
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g);
  element.replaceChildren();
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      element.appendChild(strong);
    } else {
      element.appendChild(document.createTextNode(part));
    }
  }
}

document.getElementById('chatForm').addEventListener('submit', async e => {
    e.preventDefault();

    const input = document.getElementById('chatInput');
    const q = input.value.trim();

    if (!q || input.disabled) return;

    const thread = document.getElementById('chatThread');
    const send = document.getElementById('chatSubmit');

    // Track the chat and account that started this request.
    const generation = conversationGeneration;
    const requestUserId = user?.id || null;

    // Display the student's message.
    const u = document.createElement('div');
    u.className = 'chat-msg user';
    u.textContent = q;
    thread.appendChild(u);

    input.value = '';
    input.disabled = true;
    send.disabled = true;

    // Display Rocky's thinking message.
    const pending = document.createElement('div');
    pending.className = 'chat-msg';
    pending.textContent = 'Rocky is thinking…';
    thread.appendChild(pending);
    thread.scrollTop = thread.scrollHeight;

    try {
        // Saves the student's question before asking Rocky.
        if (requestUserId && supabaseClient) {
            if (!activeConversationId) {
                const id = await createConversation(q.slice(0, 60));
                if (!id) return;
            }

        // Stop if the conversation or account changed.
        if (
            generation !== conversationGeneration ||
            requestUserId !== (user?.id || null)
        ) {
            return;
        }

        const conversationId = activeConversationId;

        const { error } = await supabaseClient
            .from('conversation_messages')
            .insert({
                conversation_id: conversationId,
                role: 'user',
                content: q
            });

        if (error) {
            console.error('Could not save user message:', error);
        }

        if (
            generation !== conversationGeneration ||
            requestUserId !== (user?.id || null)
        ) {
            return;
        }

        await renderConversationHistory();
    }

    const reply = await askRocky(q);

    if (
        generation !== conversationGeneration ||
        requestUserId !== (user?.id || null)
    ) {
        return;
    }

        renderRockyMessage(pending, reply);

        chatHistory.push(
            { role: 'user', content: q },
            { role: 'assistant', content: reply }
        );

        chatHistory = chatHistory.slice(-12);
        thread.scrollTop = thread.scrollHeight;


        // Save only Rocky's reply.
        if (requestUserId && supabaseClient && activeConversationId) {
            const { error } = await supabaseClient
                .from('conversation_messages')
                .insert({
                    conversation_id: activeConversationId,
                    role: 'assistant',
                    content: reply
                });

            if (error) {
                console.error('Could not save Rocky reply:', error);
            }
        }

    } catch (error) {
        console.error('Rocky chat error:', error);
        if (
            generation === conversationGeneration &&
            requestUserId === (user?.id || null)
        ) {
            pending.textContent = 'Something went wrong. Please try again.';
        }
    } finally {
        // Don't interfere with a newer conversation's request.
        if (
            generation === conversationGeneration &&
            requestUserId === (user?.id || null)
        ) {
            input.disabled = false;
            send.disabled = false;
            input.focus();
        }
    }
});

