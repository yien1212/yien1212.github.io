/* 主程式。初始化與各功能分開，單一功能失敗只記錯誤、不中斷其他功能。 */
(function boot(){
  if(!window.firebase){ Guard.push("Boot", "Firebase 沒載入", ""); return; }
  firebase.initializeApp(window.APP_CONFIG.firebase);
  window.db = firebase.database();
  window.uid = null;
  window._authResolve = null;
  window._authReady = new Promise(res => { window._authResolve = res; });
  firebase.auth().onAuthStateChanged(u => {
    if(!u || !u.uid) return;
    const roles = window.APP_CONFIG && window.APP_CONFIG.roles;
    const want = window.myRole && roles && roles[window.myRole] && roles[window.myRole].email;
    if(want && u.email && u.email.toLowerCase() !== String(want).toLowerCase()){
      firebase.auth().signOut().catch(function(){});
      return;
    }
    window.uid = u.uid;
  });
})();

const ROLES = window.APP_CONFIG.roles;
let pendingRole = null;
function pickRole(role){
  pendingRole = role;
  document.getElementById("pwdBox").classList.remove("hidden");
  document.getElementById("roleMsg").textContent = ROLES[role].name + " 的密碼";
  document.getElementById("rolePw").value = "";
  document.getElementById("rolePw").focus();
}
document.getElementById("roleY").onclick = () => pickRole("y");
document.getElementById("roleYun").onclick = () => pickRole("yun");

function enterApp(){
  document.getElementById("login").classList.add("hidden");
  const a = document.getElementById("app");
  a.classList.remove("hidden");
  const title = document.getElementById("heroTitle");
  if(title) title.textContent = window.myRole === "yun" ? "你是小昀恩耶" : "我們的故事";
  [startTimer, startGame, renderBadges, renderWishes, initCarousel, initTimeline].forEach(fn => {
    try{ fn(); }catch(e){ if(window.Guard) Guard.push(fn.name, e.message, ""); }
  });
  const bgm = document.getElementById("bgm");
  if(bgm) bgm.play().catch(()=>{});
}
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.onclick = function(){
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const page = document.getElementById("page-" + btn.dataset.page);
    if(page) page.classList.add("active");
    window.scrollTo(0,0);
    if(btn.dataset.page === "games" && typeof initScratch === "function") setTimeout(initScratch, 100);
    if(btn.dataset.page === "games" && window._resizeTalk) setTimeout(window._resizeTalk, 60);
  };
});

function tryLogin(){
  const msg = document.getElementById("roleMsg");
  const pw = document.getElementById("rolePw").value.trim();
  if(!pendingRole){ msg.textContent = "請先選你是誰"; return; }
  if(pw !== ROLES[pendingRole].pw){
    msg.textContent = "密碼不對喔";
    document.getElementById("rolePw").value = "";
    return;
  }
  window.myRole = pendingRole;
  window.themName = pendingRole === "y" ? "小昀" : "Y";
  const email = ROLES[pendingRole].email;
  const goBtn = document.getElementById("roleGo");
  if(goBtn) goBtn.disabled = true;
  msg.textContent = "進來了…";
  let entered = false;
  function finish(uid){
    if(entered) return;
    entered = true;
    window.uid = uid || ("local-" + pendingRole);
    if(window._authResolve){ window._authResolve(window.uid); window._authResolve = null; }
    if(goBtn) goBtn.disabled = false;
    enterApp();
  }
  function startSignIn(){
    firebase.auth().signInWithEmailAndPassword(email, window.APP_CONFIG.dbPass)
      .then(function(u){ finish(u.user && u.user.uid); })
      .catch(function(e){
        if(window.Guard) Guard.push("Auth", "雲端登入失敗，頁面仍可使用", e && (e.code || e.message) || "");
        finish("local-" + pendingRole);
      });
  }
  const cur = firebase.auth().currentUser;
  if(cur && cur.email && cur.email.toLowerCase() !== String(email).toLowerCase()){
    firebase.auth().signOut().then(startSignIn).catch(startSignIn);
  } else {
    startSignIn();
  }
  setTimeout(function(){ finish("local-" + pendingRole); }, 8000);
}
document.getElementById("roleGo").onclick = tryLogin;
document.getElementById("rolePw").addEventListener("keydown", e => { if(e.key==="Enter") tryLogin(); });

/* 在一起的起點：2024/12/13 */
const start = new Date(2024, 11, 13);
const phrases = ["今天也辛苦了，我愛妳","離下次見面又近了一天","妳笑起來最好看了","別餓肚子喔","想牽妳的手","今天也要想我喔","妳是我最重要的人"];
let carI = 0, carT;

/* 計時 */
function togetherDays(){
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const from = Date.UTC(2024, 11, 13);
  return Math.max(0, Math.floor((today - from) / 86400000));
}
function startTimer(){
  if(window._timerOn) return;
  window._timerOn = true;
  function up(){
    const now = new Date();
    const days = togetherDays();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const cd = document.getElementById("cd");
    if(cd) cd.textContent = `2024/12/13 起，${days}天 ${h}時 ${m}分 ${s}秒`;
    const phrase = document.getElementById("phrase");
    if(phrase) phrase.textContent = "— " + phrases[days%phrases.length] + " —";
    const numDays = document.getElementById("numDays");
    if(numDays) numDays.textContent = days;
    const numHours = document.getElementById("numHours");
    if(numHours) numHours.textContent = days * 24 + h;
    const hero = document.getElementById("heroDays");
    if(hero) hero.textContent = days.toLocaleString();
    const n100 = Math.ceil((days+1)/100)*100;
    const next = document.getElementById("nextBox");
    if(next) next.innerHTML = `從 2024/12/13 算起，距離第 <b>${n100}</b> 天還有 <b>${n100-days}</b> 天`;
  }
  up(); setInterval(up, 1000);
}

/* 時間軸 */
function initTimeline(){
  const obs = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) e.target.classList.add("vis") }), {threshold:.2});
  document.querySelectorAll(".tl-item").forEach(i => obs.observe(i));
}

/* 輪播 */
const carP = [
  ["mem/kiss.jpg","親了一臉"],
  ["mem/close.jpg","靠很近"],
  ["mem/elevator.jpg","電梯裡"],
  ["mem/bridge.jpg","晚上的橋"],
  ["mem/heart.jpg","比了一個心"],
  ["mem/shoes.jpg","蹲下來弄鞋子"],
  ["mem/meal.jpg","吃到一半"],
  ["mem/lift.jpg","電梯裡靠一下"],
  ["mem/hands.jpg","手上的心"],
  ["mem/lean.jpg","頭髮掉下來"],
  ["mem/berry.jpg","草莓跟一千"],
  ["mem/soup.jpg","兩碗湯"],
  ["mem/grill.jpg","烤東西"],
  ["mem/snacks.jpg","零食抱滿"],
  ["mem/cake.jpg","蛋糕跟禮物"],
  ["mem/bags.jpg","袋子跟耳機"],
  ["mem/hood.jpg","電梯前面"],
  ["mem/hug.jpg","電梯裡抱一下"],
  ["mem/ring.jpg","戒指跟手鍊"],
  ["mem/ride.jpg","紅安全帽"],
  ["mem/ticket.jpg","兩張門票"],
  ["mem/meerkat.jpg","狐獴站好"],
  ["mem/zoo.jpg","靠在一起"],
  ["mem/glass.jpg","玻璃上比心"],
  ["mem/peace.jpg","比耶"],
  ["mem/scoot.jpg","一起騎車"],
  ["mem/bus.jpg","坐夜車"],
  ["mem/mirrors.jpg","電梯鏡子"],
  ["mem/movie.jpg","去看電影"],
  ["mem/dinner.jpg","吃飯比耶"],
  ["mem/market.jpg","夜市"],
  ["mem/sand.jpg","沙灘"],
  ["mem/yarn.jpg","毛線花"],
  ["mem/pads.jpg","手把"],
  ["mem/bunny.jpg","打電動"],
  ["mem/rain.jpg","下雨比心"],
  ["mem/peck.jpg","鏡子裡親一下"],
  ["mem/mask2.jpg","口罩自拍"],
  ["mem/cheek.jpg","靠在一起"],
  ["mem/nap.jpg","窩在一起"],
  ["mem/note.jpg","寫給你"],
  ["mem/flowers.jpg","白花"],
  ["mem/pups.jpg","兩隻小狗"],
  ["mem/okbus.jpg","車上"],
  ["mem/toys.jpg","一堆娃娃"],
  ["mem/nightgame.jpg","晚上打電動"]
];
function initCarousel(){
  function show(i){
    carI = (i + carP.length) % carP.length;
    document.getElementById("carImg").src = carP[carI][0];
    document.getElementById("carCap").textContent = carP[carI][1];
  }
  document.getElementById("cNext").onclick = () => { show(carI+1); reset(); };
  document.getElementById("cPrev").onclick = () => { show(carI-1); reset(); };
  function reset(){ clearInterval(carT); carT = setInterval(() => show(carI+1), 4000); }
  reset();
}

/* 燈箱 */
function wallFigs(){ return Array.from(document.querySelectorAll(".mem-row .tl-item, #wall figure, #wallMine figure")); }
const lb = document.getElementById("lb");
let lbI = 0;
function openLB(i){ lbI = i; showLB(); lb.classList.add("open"); }
function showLB(){
  const figs = wallFigs();
  const f = figs[lbI];
  if(!f) return;
  const img = f.querySelector("img");
  let full = f.dataset.full || (img && img.dataset.full) || "";
  if(!full && img){
    const raw = img.getAttribute("src") || "";
    full = raw.indexOf("mem/t/") === 0 ? ("mem/" + raw.slice(6)) : (img.src || "");
  }
  document.getElementById("lbImg").src = full;
  document.getElementById("lbCap").textContent = (lbI + 1) + " / " + figs.length;
}
function bindWall(){
  wallFigs().forEach((f,i) => { f.onclick = () => openLB(i); });
  document.querySelectorAll(".mem-row").forEach(row => {
    if(row.dataset.swipe) return;
    row.dataset.swipe = "1";
    let x0 = 0, moved = false;
    row.addEventListener("pointerdown", e => { x0 = e.clientX; moved = false; });
    row.addEventListener("pointermove", e => { if(Math.abs(e.clientX - x0) > 10) moved = true; });
    row.addEventListener("click", e => { if(moved){ e.stopPropagation(); e.preventDefault(); } }, true);
  });
}
bindWall();
window.bindWall = bindWall;

const WALL_PAGE = 24;
let wallAll = null;
let wallAuto = 0;
const localItems = [];
let localShown = 0;
function makeWallFig(it){
  const fig = document.createElement("figure");
  fig.dataset.cap = it.c || "";
  fig.dataset.full = it.f || it.t || "";
  const img = document.createElement("img");
  img.alt = it.c || "";
  img.decoding = "async";
  img.loading = "lazy";
  if(it.w && it.h){ img.width = it.w; img.height = it.h; }
  img.src = it.t || it.f;
  const fc = document.createElement("figcaption");
  fc.textContent = it.c || "";
  fig.appendChild(img);
  fig.appendChild(fc);
  return fig;
}
function updateWallMore(){
  const btn = document.getElementById("wallMore");
  const hint = document.getElementById("wallHint");
  const wall = document.getElementById("wall");
  if(!btn || !wall) return;
  const shown = parseInt(wall.dataset.shown || "0", 10) || 0;
  const siteLeft = wallAll ? Math.max(0, wallAll.length - shown) : 0;
  const localLeft = Math.max(0, localItems.length - localShown);
  const left = siteLeft + localLeft;
  btn.hidden = left <= 0;
  btn.textContent = left > 0 ? "再看一些（還有 " + left + " 張）" : "再看一些";
  if(hint){
    const total = (wallAll ? wallAll.length : shown) + localItems.length;
    hint.textContent = total > WALL_PAGE
      ? "先顯示一部分，共 " + total + " 張。點開才載大圖。"
      : "牆上先放小圖，點開才載清楚的。一次只載一段，很多張也不會卡住。";
  }
}
function paintMore(n){
  const wall = document.getElementById("wall");
  if(!wall || !wallAll) return;
  const shown = parseInt(wall.dataset.shown || "0", 10) || 0;
  const next = Math.min(wallAll.length, shown + n);
  if(next <= shown){ updateWallMore(); return; }
  const frag = document.createDocumentFragment();
  for(let i = shown; i < next; i++) frag.appendChild(makeWallFig(wallAll[i]));
  wall.appendChild(frag);
  wall.dataset.shown = String(next);
  bindWall();
  updateWallMore();
}
function paintLocal(n){
  const mine = document.getElementById("wallMine");
  if(!mine) return;
  const next = Math.min(localItems.length, localShown + n);
  if(next <= localShown){ updateWallMore(); return; }
  const frag = document.createDocumentFragment();
  for(let i = localShown; i < next; i++) frag.appendChild(makeWallFig(localItems[i]));
  mine.appendChild(frag);
  mine.hidden = false;
  localShown = next;
  bindWall();
  updateWallMore();
}
function resetWall(){
  const wall = document.getElementById("wall");
  if(!wall) return;
  wall.innerHTML = "";
  wall.dataset.shown = "0";
  paintMore(WALL_PAGE);
}
window.noteLocalPhoto = function(src, cap){
  localItems.push({t: src, f: src, c: cap || "我們的"});
  if(localShown < WALL_PAGE) paintLocal(1);
  else updateWallMore();
};
function moreWall(){
  if(localShown < localItems.length){ paintLocal(WALL_PAGE); return; }
  paintMore(WALL_PAGE);
}
const wallMoreBtn = document.getElementById("wallMore");
if(wallMoreBtn) wallMoreBtn.onclick = function(){ moreWall(); };
if(wallMoreBtn && "IntersectionObserver" in window){
  new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting || wallMoreBtn.hidden || wallAuto >= 2) return;
      wallAuto++;
      moreWall();
    });
  }, {rootMargin:"240px"}).observe(wallMoreBtn);
}
fetch("mem/photos.json").then(function(r){ return r.json(); }).then(function(list){
  if(!Array.isArray(list) || !list.length) return;
  wallAll = list;
  const wall = document.getElementById("wall");
  const rowCount = document.querySelectorAll(".mem-row .tl-item").length;
  if(rowCount >= list.length){
    if(wall){ wall.innerHTML = ""; wall.dataset.shown = String(list.length); }
    updateWallMore();
    bindWall();
    return;
  }
  const have = wall ? wall.querySelectorAll("figure").length : 0;
  if(!wall) return;
  if(list.length > WALL_PAGE || list.length !== have) resetWall();
  else {
    wall.dataset.shown = String(have);
    updateWallMore();
  }
}).catch(function(){});
document.getElementById("lbC").onclick = () => lb.classList.remove("open");
document.getElementById("lbP").onclick = (e) => { e.stopPropagation(); const n = wallFigs().length; lbI = (lbI-1+n)%n; showLB(); };
document.getElementById("lbN").onclick = (e) => { e.stopPropagation(); const n = wallFigs().length; lbI = (lbI+1)%n; showLB(); };
lb.onclick = (e) => { if(e.target === lb) lb.classList.remove("open"); };
document.addEventListener("keydown", e => {
  if(!lb.classList.contains("open")) return;
  const n = wallFigs().length;
  if(e.key==="Escape") lb.classList.remove("open");
  if(e.key==="ArrowLeft"){ lbI=(lbI-1+n)%n; showLB(); }
  if(e.key==="ArrowRight"){ lbI=(lbI+1)%n; showLB(); }
});

/* 情話 */
const lines = [
  "就算重來一次，我還是會在同一個地方遇見妳。",
  "我不是因為孤單才找妳，是因為是妳，我才不想再一個人。",
  "別人都說我變了，只有我知道我只是終於敢面對自己喜歡誰。",
  "以後吵架可以，但不准不接我電話。",
  "妳不用一直當大人，在我這邊可以當小朋友。",
  "我數過了，今天也比昨天更喜歡妳一點。",
  "左邊肩膀永遠留給妳，隨時可以靠過來。",
  "我之前不信永遠，現在信了，因為妳。",
  "笨笨的也沒關係，我本來就喜歡原來的妳。",
  "下次見面第一件事，是抱抱。",
  "謝謝妳那時候沒有真的走掉。",
  "未來的每一天，我都想跟妳一起浪費。",
  "妳生氣的時候也可愛，但別常常生氣。",
  "我手機裡全是妳，滑不滑都一樣。",
  "下雨天想牽妳，出太陽也想牽妳。",
  "想跟妳一起老，老到一起抱怨膝蓋痛。"
];
let lastL = -1;
document.getElementById("loveBtn").onclick = () => {
  let i; do { i = Math.floor(Math.random()*lines.length); } while(i === lastL);
  lastL = i;
  const el = document.getElementById("loveText");
  el.classList.remove("show");
  setTimeout(() => { el.textContent = lines[i]; el.classList.add("show"); }, 200);
};

/* 盲盒 */
document.getElementById("mystery").onclick = function(){
  const pool = wallFigs();
  if(!pool.length) return;
  const f = pool[Math.floor(Math.random() * pool.length)];
  const img = f.querySelector("img");
  document.getElementById("mystImg").src = (f.dataset.full || (img && img.src) || "");
  const cap = f.dataset.cap || "";
  const line = (function(c){
    const rows = [
      [/雨/, "雨天也想牽你的手"],
      [/親|吻/, "這一親，我記到現在"],
      [/鏡/, "鏡子裡也想再靠近一點"],
      [/口罩/, "口罩底下也是在笑"],
      [/窩|睡/, "就這樣靠著，不用起來"],
      [/寫/, "字可以亂，人不要走"],
      [/花/, "花給你，人我留著"],
      [/狗/, "狗可以兩隻，人我只要你"],
      [/娃娃/, "娃娃一堆，人只要你"],
      [/電動|遊戲/, "你打，我在旁邊"],
      [/吃|飯|湯|烤|零食|蛋糕|草莓/, "看你吃，我就開心"],
      [/電梯|抱/, "門開之前，先抱一下"],
      [/門票|動物園|玻璃|狐獴/, "走到哪都想跟你並排"],
      [/電影/, "燈黑掉的時候，手是你的"],
      [/沙/, "沙會被海帶走，你不要"],
      [/夜市/, "人很多，我只看你"],
      [/鞋/, "鞋帶我幫你弄"],
      [/橋/, "這座橋是我們一起走的"],
      [/心/, "比給你的，不是比給別人"],
      [/車|騎/, "坐你旁邊就好"],
      [/毛線/, "慢慢織，我等你"]
    ];
    for(let i = 0; i < rows.length; i++){
      if(rows[i][0].test(c)) return rows[i][1];
    }
    return "這張我看到就想你";
  })(cap);
  const q = document.getElementById("mystQ");
  if(q) q.textContent = line;
  this.classList.add("flipped");
};

/* 刮刮樂 */
function initScratch(){
  const c = document.querySelector(".scratchCvs");
  if(!c) return;
  const x = c.getContext("2d");
  const parent = c.parentElement;
  function sizeCanvas(){
    const w = parent.clientWidth, h = parent.clientHeight;
    if(w < 10 || h < 10) return false;
    c.width = w; c.height = h;
    x.globalCompositeOperation = "source-over";
    x.fillStyle = "#c0c0c0"; x.fillRect(0,0,w,h);
    x.fillStyle = "#fff"; x.font = "16px sans-serif"; x.textAlign = "center";
    x.fillText("刮開我", w/2, h/2);
    return true;
  }
  if(c.dataset.inited) { if(sizeCanvas()){} return; }
  if(!sizeCanvas()) return;  // 隱藏時尺寸0，不標記，等切過來再初始化
  c.dataset.inited = "1";
  setTimeout(sizeCanvas, 200);
  let s = false;
  function sc(px,py){
    x.globalCompositeOperation = "destination-out";
    x.beginPath(); x.arc(px,py,25,0,Math.PI*2); x.fill();
  }
  c.addEventListener("mousedown", e => { s = true; const r = c.getBoundingClientRect(); sc((e.clientX-r.left)*c.width/r.width, (e.clientY-r.top)*c.height/r.height); });
  c.addEventListener("mouseup", () => s = false);
  c.addEventListener("mouseleave", () => s = false);
  c.addEventListener("mousemove", e => {
    if(!s) return;
    const r = c.getBoundingClientRect();
    sc((e.clientX-r.left)*c.width/r.width, (e.clientY-r.top)*c.height/r.height);
  });
  c.addEventListener("touchstart", e => { s = true; const r = c.getBoundingClientRect(); const t = e.touches[0]; sc((t.clientX-r.left)*c.width/r.width, (t.clientY-r.top)*c.height/r.height); }, {passive:true});
  c.addEventListener("touchend", () => s = false);
  c.addEventListener("touchmove", e => {
    if(!s) return;
    e.preventDefault();
    const r = c.getBoundingClientRect();
    const t = e.touches[0];
    sc((t.clientX-r.left)*c.width/r.width, (t.clientY-r.top)*c.height/r.height);
  }, {passive:false});
  const msgs = ["今天也很喜歡妳","抱抱","想牽手","吃飽了沒","妳最好看","愛妳","不要生氣","快睡覺","想妳了","可愛","么么","心動","寶貝","滾進來睡","不要走","我在","餓不餓","冷不冷","想見妳","妳好漂亮","抱緊一點","不要不理我","晚安","早安","今天也要愛妳","別熬夜","乖乖吃飯","我只想陪妳","妳是我的","愛妳愛妳","喝水了沒","今天辛苦妳了","好想蹭妳","手給我","別亂花錢","外套穿了沒","到家跟我說","想聞妳頭髮","妳在干嘛","想捏妳臉","別刷手機了睡覺","今晚夢裡見","愛妳到月亮","不要減肥","妳瘦了嗎","想從背後抱妳","今天也超愛","隨便啦我養妳","不要跟別人太好","我這輩子認真的","餓了說一聲","委屈就跟我說","妳講什麼都好聽","想帶妳去海邊","週末陪我","別哭喔","看到好吃的都想到妳","妳打呼我也愛","早安寶貝","晚安小愛人","今天的風很好想妳","手機快沒電也要想妳","妳說好就好","我都聽妳的","不許跟我說再見","想把妳藏起來","妳開心我就開心","有妳真好","今天想抱妳很久","妳是我的小太陽","不要一個人扛","我永遠站妳這邊","愛妳不是三分鐘熱度","想吃妳做的飯","想幫妳吹頭髮","冬天一起躲被窩","夏天一起吃冰","未來每天都要有妳","妳講的笑話最好笑","妳生氣也可愛","想牽妳去散步","睡前要鬧一下","醒來第一個想妳","別把我吃太快","我是妳的專屬靠墊","想跟妳窩一整天","不管怎樣我都在","喜歡妳的壞習慣","愛妳的全部","到家說一聲","吃早餐了嗎","騎車慢一點","不吃椒麻我記得","麥當勞早餐","想被叫乖乖","抱抱再講話","星巴克見","牛肉麵我請","提拉米蘇留一塊","蘋果洗好了","滷味不要太辣","鬆餅加冰淇淋","布丁給你","壽司你先夾","蛋你要幾顆","泡麵我煮","漢堡分你一半","鮭魚今天烤","排骨酥好喝","乖乖過來","小寶寶","老婆看這裡","寶貝吃飯","北鼻慢一點","我在樓下","想你了快回","今晚早點睡","外套穿上","雨天不要淋","考試加油","下課打給我","照片傳一張","語音我聽","晚安先說","早安安"];
  document.getElementById("scratchMsg").textContent = msgs[Math.floor(Math.random()*msgs.length)];
}
window.addEventListener("load", () => setTimeout(initScratch, 300));

/* 翻牌：每次從全部照片裡抽 8 組 */
(function(){
  const FALLBACK = ["mem/t/kiss.jpg","mem/t/close.jpg","mem/t/elevator.jpg","mem/t/bridge.jpg","mem/t/heart.jpg","mem/t/shoes.jpg","mem/t/meal.jpg","mem/t/lift.jpg","mem/t/hands.jpg","mem/t/ticket.jpg","mem/t/meerkat.jpg","mem/t/sand.jpg"];
  const g = document.getElementById("memGrid");
  const stat = document.getElementById("memStat");
  let first = null, lock = false, mat = 0, pairs = 0;
  function shuffle(a){
    const b = a.slice();
    for(let i = b.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      const t = b[i]; b[i] = b[j]; b[j] = t;
    }
    return b;
  }
  function build(list){
    const pool = (list || []).filter(Boolean);
    const n = Math.min(8, pool.length);
    const picks = shuffle(pool).slice(0, n);
    const deck = shuffle(picks.concat(picks));
    g.innerHTML = "";
    first = null; lock = false; mat = 0; pairs = n;
    if(stat) stat.textContent = "這次 " + n + " 組。配對相同的照片";
    deck.forEach(function(src){
      const card = document.createElement("div");
      card.className = "mem-card";
      card.innerHTML = '<div class="mem-inner"><div class="mem-front">?</div><div class="mem-back"><img loading="lazy" alt="" src="'+src+'"></div></div>';
      card.onclick = function(){
        if(lock || card.classList.contains("flipped") || card.classList.contains("matched")) return;
        card.classList.add("flipped");
        if(!first){ first = card; return; }
        lock = true;
        const ok = first.querySelector("img").src === card.querySelector("img").src;
        setTimeout(function(){
          if(ok){
            first.classList.add("matched"); card.classList.add("matched");
            mat++;
            if(mat === pairs){
              if(stat) stat.textContent = "全部配對成功";
              try{ localStorage.setItem("memDone","1"); }catch(e){}
              if(typeof renderBadges === "function") renderBadges();
            }
          } else {
            first.classList.remove("flipped"); card.classList.remove("flipped");
          }
          first = null; lock = false;
        }, 600);
      };
      g.appendChild(card);
    });
  }
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-pink";
  btn.textContent = "換一組";
  btn.style.display = "block";
  btn.style.margin = "14px auto 0";
  btn.onclick = function(){ build(window._memPool || FALLBACK); };
  if(stat) stat.insertAdjacentElement("afterend", btn);
  fetch("mem/photos.json").then(function(r){ return r.json(); }).then(function(data){
    const list = (data || []).map(function(p){ return p.t; }).filter(Boolean);
    window._memPool = list.length ? list : FALLBACK;
    build(window._memPool);
  }).catch(function(){
    window._memPool = FALLBACK;
    build(FALLBACK);
  });
})();

/* 成就 */
function renderBadges(){
  const days = Math.floor((new Date()-start)/86400000);
  const badges = [
    {e:"💘", l:"解鎖密碼", u:true},
    {e:"📸", l:"看過照片", u:true},
    {e:"🎰", l:"抽過情話", u:localStorage.getItem("luvDrew")==="1"},
    {e:"🎁", l:"抽過盲盒", u:localStorage.getItem("boxDrew")==="1"},
    {e:"🧩", l:"完成翻牌", u:localStorage.getItem("memDone")==="1"},
    {e:"❤️", l:"收集10愛心", u:localStorage.getItem("heart10")==="1"},
    {e:"📝", l:"寫過便利貼", u:localStorage.getItem("noteWrote")==="1"},
    {e:"🎯", l:"轉過任務", u:localStorage.getItem("spinDone")==="1"},
    {e:"🎙️", l:"錄過音", u:localStorage.getItem("recDone")==="1"},
    {e:"💬", l:"傳過話", u:localStorage.getItem("chatSent")==="1"},
    {e:"💗", l:"測過契合", u:localStorage.getItem("meterDone")==="1"},
    {e:"🍜", l:"決定吃什麼", u:localStorage.getItem("foodPick")==="1"},
    {e:"🎆", l:"放過煙花", u:localStorage.getItem("fwDone")==="1"},
    {e:"🧸", l:"送過禮物", u:localStorage.getItem("giftDone")==="1"},
    {e:"🎂", l:"100天", u:days>=100},
    {e:"💍", l:"一周年", u:days>=365},
    {e:"🌟", l:"500天", u:days>=500},
  ];
  document.getElementById("badges").innerHTML = badges.map(b =>
    `<div class="badge ${b.u?"unlocked":"locked"}"><div class="emoji">${b.e}</div><div class="label">${b.l}</div></div>`
  ).join("");
}
// 標記成就
document.getElementById("loveBtn").addEventListener("click", () => { localStorage.setItem("luvDrew","1"); renderBadges(); });
document.getElementById("mystery").addEventListener("click", () => { localStorage.setItem("boxDrew","1"); renderBadges(); });

/* 願望清單 - 先畫出來，登入後再跟雲端同步 */
function renderWishes(){
  const groups = {
    "旅行": ["一起看海","一起去日本","一起去韓國","一起去泰國","一起去法國","一起去京都","一起去首爾","一起去沖繩","一起去北海道","一起去清邁","一起去迪士尼","一起騎車環島","一起泡溫泉","一起去海邊看日出","一起去海邊游泳","一起賞楓","一起賞櫻花","一起去冰山","一起去海邊的島","一起去下雪的地方","一起露營","一起住小木屋","住一間兩個人的旅館"],
    "吃": ["一起吃早餐","一起吃壽司","一起吃牛肉麵","一起吃麥當勞早餐","一起去星巴克","一起吃火鍋","一起吃甜點","一起吃滷味","一起吃鬆餅","一起吃泡麵","一起吃提拉米蘇","一起吃漢堡","一起吃蘋果","一起吃布丁","一起吃冰淇淋","一起吃拉麵","一起吃水餃","一起吃炸雞","一起吃蛋餅","一起吃粥","一起吃燒烤","一起吃小籠包","一起吃排骨酥","一起吃鮭魚","一起吃便當","一起做蛋糕","一起做飯","一起逛夜市"],
    "玩": ["一起看煙火","一起看演唱會","一起看一輝的演唱會","一起去遊樂園","一起玩雲霄飛車","一起看流星雨","一起去逛街","一起去貓咪咖啡廳","一起拍大頭貼","一起拍情侶照","一起買情侶裝","一起騎車兜風","一起看電影","一起唱歌","一起追劇","一起逛超商","一起散步","一起逛書局","一起去水族館","一起坐著發呆"],
    "日常": ["一起跨年","一起養一隻貓","一起養隻狗","一起種植物","一起組電腦","一起打電動","一起看恐怖片","一起過生日","一起交換禮物","一起養老","到家說一聲","傳一段語音","說晚安","抱抱","問吃了沒","傳一張照片","講一句想你","叫一聲乖乖","早點睡","牽手走一段","說早安","提醒穿外套","忙完找對方","雨天一起待在家"]
  };
  const ideaMap = {
    "ideaEat:麥當勞早餐":"一起吃麥當勞早餐","ideaEat:牛肉麵":"一起吃牛肉麵","ideaEat:壽司":"一起吃壽司","ideaEat:星巴克":"一起去星巴克","ideaEat:滷味":"一起吃滷味","ideaEat:鬆餅":"一起吃鬆餅","ideaEat:泡麵":"一起吃泡麵","ideaEat:提拉米蘇":"一起吃提拉米蘇","ideaEat:漢堡":"一起吃漢堡","ideaEat:蘋果":"一起吃蘋果","ideaEat:布丁":"一起吃布丁","ideaEat:冰淇淋":"一起吃冰淇淋","ideaEat:火鍋":"一起吃火鍋","ideaEat:夜市":"一起逛夜市","ideaEat:拉麵":"一起吃拉麵","ideaEat:水餃":"一起吃水餃","ideaEat:炸雞":"一起吃炸雞","ideaEat:蛋餅":"一起吃蛋餅","ideaEat:粥":"一起吃粥","ideaEat:燒烤":"一起吃燒烤","ideaEat:小籠包":"一起吃小籠包","ideaEat:排骨酥":"一起吃排骨酥","ideaEat:鮭魚":"一起吃鮭魚","ideaEat:便當":"一起吃便當","ideaEat:甜點":"一起吃甜點",
    "ideaPlay:騎車兜風":"一起騎車兜風","ideaPlay:看電影":"一起看電影","ideaPlay:逛街":"一起去逛街","ideaPlay:打遊戲":"一起打電動","ideaPlay:逛夜市":"一起逛夜市","ideaPlay:看海":"一起看海","ideaPlay:唱歌":"一起唱歌","ideaPlay:拍一組照片":"一起拍情侶照","ideaPlay:一起追劇":"一起追劇","ideaPlay:逛超商":"一起逛超商","ideaPlay:散步":"一起散步","ideaPlay:逛書局":"一起逛書局","ideaPlay:水族館":"一起去水族館","ideaPlay:坐著發呆":"一起坐著發呆","ideaPlay:看煙火":"一起看煙火","ideaPlay:雨天不出門":"雨天一起待在家",
    "ideaDay:一起吃早餐":"一起吃早餐","ideaDay:到家說一聲":"到家說一聲","ideaDay:傳一段語音":"傳一段語音","ideaDay:說晚安":"說晚安","ideaDay:抱抱":"抱抱","ideaDay:問吃了沒":"問吃了沒","ideaDay:傳一張照片":"傳一張照片","ideaDay:講一句想你":"講一句想你","ideaDay:叫一聲乖乖":"叫一聲乖乖","ideaDay:早點睡":"早點睡","ideaDay:牽手走一段":"牽手走一段","ideaDay:說早安":"說早安","ideaDay:提醒穿外套":"提醒穿外套","ideaDay:忙完找對方":"忙完找對方",
    "ideaTrip:日本":"一起去日本","ideaTrip:韓國":"一起去韓國","ideaTrip:泰國":"一起去泰國","ideaTrip:法國":"一起去法國","ideaTrip:海邊的島":"一起去海邊的島","ideaTrip:下雪的地方":"一起去下雪的地方","ideaTrip:京都":"一起去京都","ideaTrip:首爾":"一起去首爾","ideaTrip:沖繩":"一起去沖繩","ideaTrip:北海道":"一起去北海道","ideaTrip:清邁":"一起去清邁","ideaTrip:兩個人的旅館":"住一間兩個人的旅館","ideaTrip:有夜市的城市":"一起逛夜市"
  };
  const legacy = ["一起看海","一起跨年","一起去日本","一起養一隻貓","一起做飯","一起露營","一起拍情侶照","一起看煙火","一起養老","一起去迪士尼","一起泡溫泉","一起騎車環島","一起看演唱會","一起種植物","一起組電腦","一起去海邊看日出","一起做蛋糕","一起養隻狗","一起去冰山","一起住小木屋","一起玩雲霄飛車","一起看流星雨","一起逛夜市","一起買情侶裝","一起去貓咪咖啡廳","一起去海邊游泳","一起賞楓","一起拍大頭貼","一起去遊樂園","一起看一輝的演唱會","一起吃壽司","一起去逛街","一起打電動","一起看恐怖片","一起過生日","一起交換禮物","一起賞櫻花"];
  const wishes = Object.values(groups).flat();
  const tabs = ["還沒做","做完了","旅行","吃","玩","日常"];
  const list = document.getElementById("wishList");
  const filters = document.getElementById("wishFilters");
  if(!list || !filters) return;
  if(!window._wishFilter) window._wishFilter = "還沒做";
  function paint(done){
    const current = window._wishFilter || "還沒做";
    filters.innerHTML = "";
    tabs.forEach(function(name){
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = name;
      b.className = name === current ? "on" : "";
      b.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        window._wishFilter = name;
        paint(done);
      };
      filters.appendChild(b);
    });
    list.innerHTML = "";
    const shown = [];
    Object.keys(groups).forEach(function(group){
      groups[group].forEach(function(w){
        const isDone = done.indexOf(w) >= 0;
        if(current === "還沒做" && isDone) return;
        if(current === "做完了" && !isDone) return;
        if(current !== "還沒做" && current !== "做完了" && current !== group) return;
        shown.push({group: group, w: w, isDone: isDone});
      });
    });
    const head = document.createElement("div");
    head.style.cssText = "text-align:center;color:#e91e63;font-size:.85rem;margin-bottom:8px";
    const finished = done.filter(function(x){ return wishes.indexOf(x) >= 0; }).length;
    head.textContent = current === "做完了" ? ("做完 " + shown.length + " 件") : ("還沒做的會留在這一頁　完成 " + finished + " / " + wishes.length);
    list.appendChild(head);
    if(!shown.length){
      const empty = document.createElement("div");
      empty.className = "talk-note";
      empty.textContent = current === "做完了" ? "還沒有打勾的。" : "這一頁都做完了。";
      list.appendChild(empty);
      return;
    }
    let lastGroup = "";
    shown.forEach(function(item){
      if(current !== "還沒做" && current !== "做完了" && item.group !== lastGroup){
        lastGroup = item.group;
      }
      const d = document.createElement("div");
      d.className = "wish-item" + (item.isDone ? " done" : "");
      d.innerHTML = '<input type="checkbox"' + (item.isDone ? " checked" : "") + '> <span></span>';
      d.querySelector("span").textContent = item.w;
      d.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        let next = done.filter(function(x){ return wishes.indexOf(x) >= 0; });
        if(item.isDone) next = next.filter(function(x){ return x !== item.w; });
        else next.push(item.w);
        next = Array.from(new Set(next));
        try{ localStorage.setItem("wishes-done", JSON.stringify(next)); }catch(e){}
        if(window.db) window.db.ref("wishes/state").set({done: next}).catch(function(){});
        paint(next);
      };
      list.appendChild(d);
    });
  }
  let ideaDone = {};
  try{ ideaDone = JSON.parse(localStorage.getItem("idea-done") || "{}"); }catch(e){}
  function withIdeas(done){
    const next = done.slice();
    Object.keys(ideaDone).forEach(function(k){
      const name = ideaMap[k];
      if(ideaDone[k] && name && wishes.indexOf(name) >= 0 && next.indexOf(name) < 0) next.push(name);
    });
    return next;
  }
  let local = [];
  try{ local = JSON.parse(localStorage.getItem("wishes-done") || "[]"); }catch(e){ local = []; }
  if(!Array.isArray(local)) local = [];
  local = withIdeas(local);
  try{ localStorage.setItem("wishes-done", JSON.stringify(local)); }catch(e){}
  paint(local);
  if(window._wishBound || !window._authReady) return;
  window._wishBound = true;
  window._authReady.then(function(){
    if(!window.db) return;
    window.db.ref("wishes/state").on("value", function(doc){
      const raw = doc.exists() && doc.val() ? doc.val().done || [] : [];
      const done = withIdeas(raw.map(function(x){ return typeof x === "number" ? legacy[x] : x; }).filter(Boolean));
      try{ localStorage.setItem("wishes-done", JSON.stringify(done)); }catch(e){}
      paint(done);
    });
    window.db.ref("ideas/done").once("value").then(function(s){
      const v = s.val();
      if(!v || typeof v !== "object") return;
      ideaDone = Object.assign({}, ideaDone, v);
      try{ localStorage.setItem("idea-done", JSON.stringify(ideaDone)); }catch(e){}
      window.db.ref("wishes/state").once("value").then(function(doc){
        const raw = doc.exists() && doc.val() ? doc.val().done || [] : [];
        const done = withIdeas(raw.map(function(x){ return typeof x === "number" ? legacy[x] : x; }).filter(Boolean));
        window.db.ref("wishes/state").set({done: done}).catch(function(){});
      });
    }).catch(function(){});
  });
}

/* 共同記帳：誰付的、日期、可刪、分開合計 */
window._authReady.then(function(uid){
  const names = {y:"Y", yun:"小昀"};
  document.getElementById("expAdd").onclick = function(){
    const a = parseFloat(document.getElementById("expAmount").value);
    const n = document.getElementById("expNote").value.trim();
    if(!a || a <= 0) return;
    db.ref("expenses").push({amount:a, note:n, uid:uid, role:window.myRole||"", time:Date.now()});
    document.getElementById("expAmount").value = "";
    document.getElementById("expNote").value = "";
  };
  db.ref("expenses").on("value", snap => {
    const list = document.getElementById("expList");
    let total = 0, by = {y:0, yun:0};
    const items = [];
    snap.forEach(d => { items.push({id:d.key, ...d.val()}); });
    items.sort((a,b)=>(b.time||0)-(a.time||0));
    list.innerHTML = "";
    if(!items.length){
      list.innerHTML = "<div style='color:#999;font-size:.85rem'>還沒有記帳</div>";
    }
    items.forEach(e => {
      total += Number(e.amount)||0;
      if(by[e.role] != null) by[e.role] += Number(e.amount)||0;
      const when = e.time ? new Date(e.time).toLocaleDateString("zh-TW",{month:"numeric",day:"numeric"}) : "";
      const row = document.createElement("div");
      row.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:.9rem";
      row.innerHTML = `<span>${when} ${names[e.role]||""} ${e.note||"消費"}</span><span style="white-space:nowrap">$${e.amount} <button data-id="${e.id}" style="border:none;background:none;color:#e91e63;cursor:pointer">刪</button></span>`;
      row.querySelector("button").onclick = function(){ db.ref("expenses/"+this.dataset.id).remove(); };
      list.appendChild(row);
    });
    document.getElementById("expTotal").textContent = `總計 ${total} 元　Y ${by.y}　小昀 ${by.yun}`;
  });
});

/* 戀愛默契：每天兩題，一題選擇、一題問答。題庫 300。 */
(function(){
  const picks = [
["今天早餐想怎麼吃？", ["自己先吃", "等你叫我", "一起吃"]],
["現在肚子怎麼樣？", ["餓了", "還可以", "等你決定"]],
["午餐想吃哪一種？", ["麵", "飯", "你挑"]],
["晚餐誰來決定？", ["你", "我", "看附近"]],
["宵夜可以吃嗎？", ["可以", "少一點", "今天不要"]],
["甜的要不要？", ["要", "不要", "看你"]],
["飲料想喝什麼？", ["奶茶", "咖啡", "白開水"]],
["冰量想怎麼點？", ["正常冰", "少冰", "熱的"]],
["辣度今天？", ["不辣", "小辣", "你問我"]],
["今天想吃麥當勞嗎？", ["想", "換別的", "你決定"]],
["牛肉麵還是拉麵？", ["牛肉麵", "拉麵", "都想"]],
["壽司誰先夾？", ["你先", "我先", "一起夾"]],
["火鍋誰先下？", ["你", "我", "一起"]],
["滷味要辣嗎？", ["不要辣", "小辣", "你夾給我"]],
["炸雞想配什麼？", ["汽水", "你", "就這樣"]],
["水餃想吃幾顆？", ["你決定", "我少一點", "一樣多"]],
["蛋餅要加什麼？", ["加蛋", "原味", "你幫我點"]],
["泡麵誰煮？", ["你煮", "我煮", "一起煮"]],
["便當今天想吃？", ["雞腿", "排骨", "你挑"]],
["蘋果誰洗？", ["你洗給我", "我自己洗", "現在就吃"]],
["布丁怎麼分？", ["給你", "我先", "一起挖"]],
["鬆餅想加什麼？", ["冰淇淋", "水果", "原味"]],
["提拉米蘇怎麼吃？", ["留一塊給你", "當場吃完", "下次再買"]],
["漢堡要不要分一口？", ["分一口", "各吃各的", "你吃"]],
["今天的餐誰付？", ["我", "你", "輪流"]],
["看到好吃的會？", ["拍給你", "先吃掉", "等你一起"]],
["早餐沒吃你會？", ["唸我", "帶給我", "下次一起"]],
["麥當勞早餐想幾點去？", ["早一點", "快遲到再衝", "你叫我"]],
["星巴克想怎麼喝？", ["坐著聊", "外帶", "你請"]],
["夜市比較想吃？", ["滷味", "小吃", "甜的"]],
["粥適合什麼時候？", ["早上", "不舒服", "都可以"]],
["小籠包誰先吃？", ["你先", "一起", "湯汁小心"]],
["拉麵湯喝嗎？", ["喝", "不喝", "分你一半"]],
["排骨酥想怎麼吃？", ["喝湯", "配飯", "分你"]],
["鮭魚今天想怎麼吃？", ["烤", "生魚片", "你煮"]],
["冰淇淋要分嗎？", ["分一口", "自己一球", "看你"]],
["超商要逛一圈嗎？", ["可以", "只買零食", "只買水"]],
["太晚吃東西？", ["可以", "少一點", "你決定"]],
["今天想吃甜點嗎？", ["想", "正餐就好", "你吃我看"]],
["吃飯時想聊天嗎？", ["想", "先吃", "看你"]],
["誰先傳早安？", ["我", "你", "誰醒誰傳"]],
["早安想收到哪一句？", ["吃早餐了嗎", "想你", "語音"]],
["午安需要嗎？", ["不用", "問吃了沒", "隨便一句"]],
["晚安想收到哪一句？", ["晚安", "今天辛苦了", "明天見"]],
["訊息想怎麼回？", ["馬上回", "忙完回", "傳語音"]],
["已讀之後你會？", ["馬上回", "忙完回", "回一個表情"]],
["想我的時候會？", ["直接說", "傳語音", "打給你"]],
["分開一整天先傳？", ["想你", "今天怎樣", "照片"]],
["照片想看哪一種？", ["吃飯", "自拍", "隨便一張"]],
["語音還是文字？", ["語音", "文字", "看當時"]],
["電話現在可以嗎？", ["可以", "簡短就好", "晚點"]],
["忙的時候希望我？", ["等你", "傳一句就好", "你忙完找我"]],
["你不理我時我會？", ["再傳一次", "等你", "說我想你"]],
["突然想見你？", ["就說", "約時間", "先傳照片"]],
["到家要說一聲嗎？", ["要", "你也要", "重要的時候要"]],
["出門要先說嗎？", ["要", "你記得問", "不用"]],
["到家第一句想聽？", ["我到家了", "想你", "吃了嗎"]],
["騎車的時候要我？", ["叫我慢一點", "到了再聊", "傳一個愛心"]],
["你騎車我應該？", ["提醒我慢", "到了說", "不要講電話"]],
["下雨還要出門嗎？", ["不去", "去找你", "看你"]],
["下雨天比較想？", ["待在家", "出去找你", "傳語音"]],
["冷的時候要什麼？", ["外套", "抱抱", "熱飲"]],
["熱的時候想？", ["冰的", "吹冷氣", "少走一點"]],
["外套這件事？", ["你提醒我", "我自己會", "互相看"]],
["傘要被提醒嗎？", ["要", "我會自己拿", "你記得就好"]],
["喝水要被提醒嗎？", ["要", "不要", "看你心情"]],
["今天想出門嗎？", ["想", "不想", "看你"]],
["不想出門的話？", ["你陪我躺", "傳語音", "早點說"]],
["等一下見面先做？", ["吃飯", "走路", "坐著"]],
["一起走路要？", ["牽手", "並排", "你慢一點等我"]],
["逛街誰走得慢？", ["我", "你", "一起慢"]],
["下一次出門想？", ["吃飯", "短途走走", "你定"]],
["今天心情比較像？", ["想撒嬌", "想安靜", "想聊天"]],
["今天的語氣想？", ["溫柔", "鬧一下", "正常就好"]],
["開心的時候第一個？", ["告訴你", "傳照片", "叫你名字"]],
["累的時候要我？", ["抱抱", "少說話", "早點回家"]],
["委屈的時候？", ["跟你說", "先自己待著", "要你問"]],
["生氣的時候要我？", ["先抱", "先聽", "帶我去吃"]],
["吵架之後先？", ["道歉", "抱抱", "等一下再講"]],
["我鬧你的時候？", ["順著我", "回我", "抱一下"]],
["我無理取鬧時？", ["先哄", "講道理", "帶我去吃"]],
["吃醋的時候要我？", ["解釋", "抱一下", "嚴肅一點"]],
["我吃醋的時候？", ["哄我", "笑我", "帶我去吃"]],
["和好的時候用？", ["想你", "吃東西", "抱抱"]],
["壞的一天你希望我？", ["聽你說", "帶你吃", "先抱一下"]],
["最有效的哄法？", ["說想你", "吃的", "抱緊"]],
["想被誇的時候？", ["直接說", "用語音", "抱一下就好"]],
["想撒嬌時叫你？", ["寶寶", "名字", "乖乖"]],
["現在最想被叫？", ["寶寶", "乖乖", "老婆", "寶貝"]],
["想被照顧的一天？", ["餵我", "陪我", "讓我賴著"]],
["想照顧你的一天？", ["問你吃了沒", "聽你說話", "什麼都不問"]],
["晚上誰先睡？", ["我先", "你先", "一起賴"]],
["睡前十分鐘想？", ["講電話", "傳訊息", "安靜陪著"]],
["我先睡的話你？", ["跟我說晚安", "你再忙", "留一句話"]],
["你先睡的話我？", ["說晚安", "你先去", "抱一下再睡"]],
["熬夜的時候你會？", ["罵我", "陪我", "叫我去睡"]],
["睡不著會？", ["找你", "自己滑", "傳語音"]],
["週末上午想？", ["補眠", "出門吃", "待在家"]],
["週末晚上想？", ["看電影", "追劇", "早點睡"]],
["假日中午想去？", ["吃飯", "逛街", "待在家"]],
["平日晚上想？", ["吃飯", "通話", "忙完再找"]],
["你放假我要？", ["約吃飯", "讓你睡", "一起浪費"]],
["這週想完成的小事？", ["吃一頓", "散個步", "早睡一天"]],
["無聊的時候？", ["找你", "自己滑手機", "一起滑"]],
["追劇要一起嗎？", ["等我", "你先看", "一起"]],
["一起挑片誰選？", ["你選", "我選", "輪流"]],
["看電影還是在家？", ["看電影", "在家看", "看你"]],
["唱歌的話？", ["你唱", "我聽", "一起亂唱"]],
["書局要去嗎？", ["要", "下次", "你先看"]],
["水族館想去嗎？", ["想", "排進清單", "你陪我就好"]],
["看海現在想嗎？", ["想", "有風也去", "你陪我就好"]],
["燒烤想哪天去？", ["這週", "下次", "看你有沒有空"]],
["今天只做一件的話？", ["好好吃飯", "傳一句想你", "早點睡"]],
["忙完要不要找我？", ["要", "你先忙完", "看時間"]],
["小錢要記下來嗎？", ["記", "不用", "大筆再記"]],
["禮物比較想收？", ["吃的", "用的", "你人來就好"]],
["別人誇你要跟我說嗎？", ["跟我說", "不用報", "我想聽"]],
["別人找你？", ["你知道就好", "跟我講", "看情況"]],
["我們訊息的節奏？", ["一直聊", "想到再傳", "你帶我就好"]],
["撒嬌現在可以嗎？", ["可以", "看時機", "你先開始"]],
["今天想靠近一點？", ["想", "還好", "晚上再說"]],
["暫時見不到想？", ["多傳訊息", "語音", "晚上好好講"]],
["考試或很忙的時候我？", ["少鬧你", "陪你", "問你吃了沒"]],
["好的一天用什麼收尾？", ["說想你", "吃一點", "早點睡"]],
["今天想被我怎麼對？", ["抱抱", "陪我說話", "讓我安靜"]],
["現在最想我做的？", ["回訊息", "問我吃了沒", "什麼都不用"]],
["回家的路上想？", ["跟你講", "先專心", "到了再傳"]],
["今天的照片要傳嗎？", ["要", "晚點", "你先傳"]],
["誰先開口聊天？", ["我", "你", "誰想到誰傳"]],
["想聽我講今天嗎？", ["想", "簡短就好", "晚上再講"]],
["現在適合撒嬌嗎？", ["適合", "等一下", "你先"]],
["今天有沒有想我？", ["有", "剛想到", "一直都有"]],
["一句話現在想聽？", ["想你", "吃了嗎", "我在"]],
["晚上想怎麼結束？", ["說晚安", "再聊一下", "打給你"]],
["明天早上記得？", ["叫我吃早餐", "傳想你", "讓我自己醒"]],
["今天的小事想分享嗎？", ["想", "等見面", "傳一張就好"]],
["點餐時你會？", ["先問我", "幫我決定", "各點各的"]],
["不想辣的時候？", ["跟你說", "你記得", "我自己跟店家說"]],
["吃飯前要先說嗎？", ["要", "吃完再講", "拍給你"]],
["現在的我比較需要？", ["回覆", "抱抱", "安靜"]],
["如果只能傳一句？", ["想你", "吃了嗎", "到家說一聲"]],
["今天想被誇哪裡？", ["努力", "好看", "什麼都好"]],
["遇見好吃的第一個？", ["拍給你", "叫你來", "自己吃掉"]],
["走去哪裡都想？", ["牽手", "你帶路", "慢慢走"]],
["今晚想早點睡嗎？", ["想", "再聊一下", "看你"]],
["今天想牽手嗎？", ["想", "人多就算了", "你先伸"]],
["訊息太短的時候？", ["再補一句", "這樣就好", "改傳語音"]],
["吃飯拍給我嗎？", ["拍", "吃完再講", "好看才拍"]],
["現在想被抱嗎？", ["想", "晚一點", "先說話"]],
["到家了會先做？", ["跟你說", "先洗澡", "先躺一下"]],
  ];
  const texts = [
"今天過得怎樣，用三個字。",
"我說過哪句話你還記得？",
"你答這題時，最希望我怎麼回你？",
"現在最想聽到我說的一句話？",
"你希望我吃醋的時候怎麼表現？",
"你想對以前的我們說什麼？",
"你希望我們的聊天，最後總是停在什麼樣的句子？",
"如果把今天做成一句情話，你會寫什麼？",
"早上一睜眼，你希望手機上有什麼？",
"哪一次你覺得被我照顧到？",
"如果我只能改一個壞習慣，你選哪個？",
"你想跟我一起養成的下一個習慣是什麼？",
"你覺得哪一餐最像我們？",
"你最後一次笑出來，跟我有沒有關係？",
"今天的我們，你想怎麼形容？",
"你現在最想我做的一個很小的動作？",
"看到好吃的，你第一個想分享給誰、為什麼是我？",
"我做過哪件小事讓你心動？",
"一件你做得很好、希望我說出口的事？",
"如果明天放假，想跟我去吃什麼？",
"你吃醋的時候，最想聽我解釋到什麼程度？",
"你最近一次想我，是在做什麼的時候？",
"今天先到家的人，你希望留下什麼給另一個？",
"有哪一句叮嚀，你聽完會比較安心？",
"最適合一起浪費的一個下午，會怎麼過？",
"用一種食物形容現在的我們。",
"你覺得我哪一句最短、但你最愛聽？",
"一件你已經做得夠多、希望我別再催的事？",
"你最想分享給我的一種味道？",
"你覺得我記得你的口味時，你是什麼感覺？",
"你騎車時最希望我不要做什麼？",
"你悶的時候，希望我做什麼、或不做什麼？",
"今天最想讓我記住的一件小事？",
"什麼時候最想被我抱一下？",
"你覺得我還不了解你的哪一面？",
"你什麼時候會認真說想我？",
"如果明年也在一起，你想先去哪個地方？",
"兩個人住一晚，你希望晚上怎麼過？",
"和好之後，你想做的第一件小事？",
"有句話只想跟我說，是什麼？",
"你委屈時，要我先抱你還是先聽你說？",
"寫一句你希望明天的我一醒來就看到的話。",
"我哪次回得晚，你當時在想什麼？",
"星巴克如果要坐著，你想聊什麼？",
"如果只傳一句，你會打什麼？",
"若今天的題目由你出，你會問我什麼？",
"快睡著時你會想起我們的哪一段？",
"如果行程全空，你會把第一個小時給我什麼？",
"你想被我接住的樣子，是什麼樣？",
"一起走路時，你心裡通常在想什麼？",
"今天的天空如果要傳給我，你會配什麼字？",
"你說沒事的時候，我應該再問一次嗎？",
"睡前最後一眼，你希望是什麼？",
"我忘記做的小事裡，哪一件你希望我補上？",
"你不想被問、但希望我懂的事是什麼？",
"去韓國，最想跟我做的一件事？",
"去日本的第一餐，你想吃什麼？",
"照片你想多拍我，還是多拍風景？",
"你想對以後的我們約好什麼？",
"你最常想起我的哪個畫面？",
"你最想被我投餵的一樣東西？",
"你覺得我生氣時，怎樣哄比較有用？",
"夜市你會想拉我去哪一攤？",
"如果只能留一段我們的回憶？",
"你希望我依賴你多一點，還是你依賴我？",
"你不想吃的東西，希望我怎麼問就好？",
"用一句話，讓我知道你今天還在。",
"你希望我在你忙完抬頭時，剛好說了什麼？",
"如果今天很開心，你想怎麼告訴我？",
"去泰國，你想把行程排松還是排滿，為什麼？",
"你覺得你什麼時候最需要我，說具體一點。",
"吵架之後，你其實最需要什麼？",
"你心裡的家，有沒有一個屬於我們的角落？",
"現在的心情，用一種甜點形容。",
"如果現在就在旁邊，你會先做哪個小動作？",
"今天有沒有一個瞬間突然想我？",
"以後的日常裡，一定要留什麼習慣？",
"哪種提醒你不會煩：吃飯、外套、還是慢一點？",
"你什麼時候最想叫我笨蛋？",
"下雨天你會想傳給我什麼？",
"第一次見面，你覺得我是什麼樣子？",
"若把想我的程度說成一種距離，是多近？",
"你騎車或走路時，會不會突然想到我，想到什麼？",
"今天想被我怎麼對待，用你自己的話講。",
"語音裡你希望我先講什麼？",
"如果只能再點一次餐，你會為我點什麼？",
"這週最想一起做的一件事？",
"在車上你最希望我提醒你什麼？",
"你覺得我什麼時候最像我？",
"外食的話，你今天想走進哪一種店？",
"出國時你想負責吃，還是負責帶路？",
"有沒有一件小事，希望我今天做到？",
"你覺得我們還少一個什麼樣的儀式？",
"你覺得我什麼時候最可愛，說具體一點。",
"我們吵架時，你最不希望我說出口的話？",
"到家說一聲，對你來說重要在哪？",
"忙的日子裡，你還想保留跟我的哪十分鐘？",
"聽到我聲音時，你會有什麼反應？",
"一起老了以後，你想抱怨我什麼？",
"騎車慢一點這句，你聽了是什麼感覺？",
"見到面時，你想先做的第一件事？",
"你理想中的早餐，是跟我一起還是我叫你吃？",
"現在就想預約的一個週末，要做什麼？",
"你想接住我的時候，通常會說什麼？",
"你想被誇的點，今天是哪一個？",
"吃飽的時候你最想跟我說什麼？",
"你覺得我們最像的地方？",
"你到家後，最想跟我說的通常不是平安，那是什麼？",
"你什麼時候確定喜歡我？",
"你覺得我偷偷在意你的哪件事？",
"若把我們的一天畫成三格，你會放哪三格？",
"你生氣但還想被抱的時候，要我怎麼判斷？",
"還想一起完成、但還沒做的事？",
"你說過最心軟的一句是什麼？",
"有個地方你想帶我去，是哪裡，為什麼？",
"如果今天很累，你想收到我怎樣的訊息？",
"你希望我擔心你的方式，是問還是等你說？",
"如果是你煮，你會做哪一道給我？",
"不吃椒麻這件事，你希望我怎麼記得？",
"海邊的話，你想留下什麼樣的照片？",
"你旅遊時最需要我配合的是什麼？",
"如果我煮一頓，你想吃什麼？",
"有沒有一件事你裝不在意，但其實很在意？",
"今天吃飯前後，你希望我出現在哪個時刻？",
"甜的還是鹹的，今天的你站哪一邊，為什麼？",
"你想在那個地方對我說的一句話？",
"你希望我無聊時來找你，還是讓你先忙完？",
"今天的你，想被叫寶寶、乖乖，還是別的，為什麼？",
"你想跟我約的下一頓是什麼時候、吃什麼？",
"你想跟我練習的一句話是什麼？",
"空的日子裡，你想怎麼浪費在我身上？",
"有沒有一個稱呼，是你只想讓我叫的？",
"你想被我看很久的時候，是什麼時候？",
"你希望我以後固定叫你什麼？",
"你想留住我的哪個習慣？",
"考試或忙完，你希望我先問什麼？",
"你希望我永遠不要改的一點是什麼？",
"我晚回的時候，你其實希望我補哪一句？",
"看到我名字時，你心裡的第一句是什麼？",
"最後，今天的你想跟我說晚安，還是再說一點？",
"你旅遊時最容易開心的點是什麼？",
"如果去下雪的地方，你想先做什麼？",
"想帶回來的伴手禮是什麼？",
"如果只能留下我的一個聲音，你留哪一句？",
"你願意為我改掉的一個小動作是什麼？",
"一起挑晚餐時，你其實在意什麼？",
"你覺得我們的好吃，是食物還是在一起？",
"旅途中迷路了，你會先跟我說什麼？",
"分開一整天後，你最想先知道我的什麼？",
"你想跟我收集的，是票根、食物還是對話？"
  ];
  function taipeiDay(){
    return new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Taipei", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());
  }
  function dayNum(){
    const parts = taipeiDay().split("-").map(Number);
    return Math.floor(Date.UTC(parts[0], parts[1]-1, parts[2]) / 86400000);
  }
  const day = taipeiDay();
  const num = dayNum();
  const pick = picks[num % picks.length];
  const ask = texts[num % texts.length];
  const names = { y:"Y", yun:"小昀" };
  let data = {};
  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){ return "&#"+c.charCodeAt(0)+";"; });
  }
  function val(part, role){
    const row = data[part];
    return row && row[role] && row[role].text ? String(row[role].text) : "";
  }
  function row(part, role){
    const text = val(part, role);
    const mine = window.myRole || "";
    const both = !!(val(part,"y") && val(part,"yun"));
    let body = "還沒回答";
    if(text) body = (both || mine === role) ? esc(text) : "寫好了，先保密";
    return '<div class="daily-row"><b>'+names[role]+'</b><span>'+body+'</span></div>';
  }
  function paint(){
    const dayEl = document.getElementById("dailyDay");
    if(dayEl) dayEl.textContent = Number(day.slice(5,7)) + "月" + Number(day.slice(8,10)) + "日";
    const qPick = document.getElementById("qPick");
    const qText = document.getElementById("qText");
    if(qPick) qPick.textContent = pick[0];
    if(qText) qText.textContent = ask;
    const y = val("pick","y"), u = val("pick","yun");
    const bothP = !!(y && u);
    const mine = window.myRole || "";
    const mineP = mine === "y" ? y : (mine === "yun" ? u : "");
    const choices = document.getElementById("syncChoices");
    if(!choices) return;
    choices.innerHTML = "";
    function choosePick(opt){
      const role = window.myRole;
      if(!role || mineP) return;
      data.pick = data.pick || {};
      data.pick[role] = {text: opt, time: Date.now()};
      paint();
      const push = function(){
        if(!window.db) return;
        window.db.ref("daily2/"+day+"/pick/"+role).set({text:opt, time:Date.now()}).catch(function(){});
      };
      if(window._authReady) window._authReady.then(push);
      else push();
    }
    pick[1].forEach(function(opt){
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = opt;
      if(bothP && y === u && opt === y) b.className = "match";
      else if(opt === mineP) b.className = "mine";
      else if(bothP && (opt === y || opt === u)) b.className = "theirs";
      b.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        choosePick(opt);
      };
      choices.appendChild(b);
    });
    document.getElementById("pickAnswers").innerHTML = row("pick","y") + row("pick","yun");
    const pLock = document.getElementById("pickLock");
    if(pLock) pLock.textContent = bothP ? (y === u ? "一樣" : "不一樣") : "";
    const yt = val("text","y"), ut = val("text","yun");
    const bothT = !!(yt && ut);
    document.getElementById("textAnswers").innerHTML = row("text","y") + row("text","yun");
    const tLock = document.getElementById("textLock");
    if(tLock) tLock.textContent = bothT ? "都說了" : "";
    const mineT = mine === "y" ? yt : (mine === "yun" ? ut : "");
    const input = document.getElementById("dailyInput");
    const send = document.getElementById("dailySend");
    if(input) input.disabled = !!mineT;
    if(send) send.disabled = !!mineT;
  }
  document.getElementById("dailySend").onclick = function(){
    const input = document.getElementById("dailyInput");
    const text = input.value.trim();
    const mine = window.myRole || "";
    const mineT = mine === "y" ? val("text","y") : (mine === "yun" ? val("text","yun") : "");
    const role = window.myRole;
    if(!text || mineT || !role) return;
    data.text = data.text || {};
    data.text[role] = {text: text, time: Date.now()};
    input.value = "";
    paint();
    const push = function(){
      if(!window.db) return;
      window.db.ref("daily2/"+day+"/text/"+role).set({text:text, time:Date.now()}).catch(function(){});
    };
    if(window._authReady) window._authReady.then(push);
    else push();
  };
  document.getElementById("dailyInput").addEventListener("keydown", function(e){
    if(e.key === "Enter") document.getElementById("dailySend").click();
  });
  paint();
  if(window._authReady){
    window._authReady.then(function(){
      if(!window.db) return;
      window.db.ref("daily2/"+day).on("value", function(s){
        data = s.val() || {};
        paint();
      });
    });
  }
})();

/* 一起按愛心 */
window._authReady.then(function(uid){
  db.ref("counters/hearts").on("value", doc => {
    const n = doc.exists() ? (doc.val() ? doc.val().count : 0) : 0;
    document.getElementById("heartCount2").textContent = n;
  });
  document.getElementById("heartBtn").onclick = function(){
    db.ref("counters/hearts").transaction(c => (c||0)+1); if(window.addPoints) window.addPoints(1, "愛心");
    for(let i = 0; i < 3; i++){
      setTimeout(() => {
        const el = document.createElement("div");
        el.textContent = "❤️";
        el.style.cssText = "position:fixed;left:"+(40+Math.random()*20)+"%;bottom:0;font-size:1.5rem;z-index:9999;pointer-events:none;transition:all 2s ease-out;";
        document.body.appendChild(el);
        requestAnimationFrame(() => { el.style.bottom = "60vh"; el.style.opacity = "0"; });
        setTimeout(() => el.remove(), 2000);
      }, i*100);
    }
  };
});

/* 愛心遊戲 */
function startGame(){
  const sp = document.getElementById("gameSpace");
  let c = 0;
  setInterval(() => {
    if(document.querySelectorAll(".heart-game").length > 5) return;
    const h = document.createElement("div");
    h.innerHTML = "❤️";
    h.className = "heart-game";
    h.style.left = Math.random()*90 + "%";
    h.style.top = Math.random()*80 + "%";
    h.onclick = function(e){
      c++;
      document.getElementById("heartCount").textContent = "已收集 " + c + " 個 ❤️";
      burst(e.clientX, e.clientY);
      this.remove();
      if(c === 10){ localStorage.setItem("heart10","1"); renderBadges(); }
      if(c % 10 === 0) alert("收集到 " + c + " 個愛心！");
    };
    sp.appendChild(h);
    setTimeout(() => { if(h.parentElement) h.remove(); }, 5000);
  }, 3000);
}

function burst(x,y){
  const em = ["❤️","💖","💕","✨","💗"];
  for(let i=0;i<6;i++){
    const el = document.createElement("div");
    el.className = "burst-heart";
    el.innerText = em[Math.floor(Math.random()*em.length)];
    el.style.left = x+"px"; el.style.top = y+"px";
    const a = Math.random()*Math.PI*2;
    const d = 40 + Math.random()*50;
    el.style.setProperty("--dx", Math.cos(a)*d+"px");
    el.style.setProperty("--dy", Math.sin(a)*d+"px");
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
}
document.addEventListener("click", e => {
  if(e.target.closest("button") || e.target.closest("input") || e.target.closest("textarea")) return;
  burst(e.clientX, e.clientY);
});

/* 我們的日常 — 從真實 LINE 記錄抽出的片段 */
(function(){
  const convos = [
    {date:"2026/03/22", lines:[["Y","老婆上班加油，掰掰"],["yun","愛你"],["Y","小寶貝"],["Y","我到家裡樓下了"]]},
    {date:"2025/02/20", lines:[["Y","再猜你應該到家了"],["yun","到家了"],["Y","我愛你寶寶"]]},
    {date:"2025/07/03", lines:[["yun","要吃牛肉麵嗎"],["Y","寶貝呀我愛你"],["yun","我也愛你⋯我害羞"],["Y","我愛女朋友"]]},
    {date:"2025/10/04", lines:[["yun","慢慢騎車"],["yun","北鼻 你到家了嗎？"],["yun","你應該已經平安回到家了吧"],["Y","剛到家"]]},
    {date:"2024/11/26", lines:[["Y","早安安安安安"],["Y","你一定還沒起床"],["yun","早安安！"]]},
    {date:"2024/11/27", lines:[["yun","我到家跟你說"],["yun","你晚點回家要小心"]]},
    {date:"2024/12/07", lines:[["yun","害我剛剛很想你的說"],["Y","你吃早餐了嗎"],["Y","我晚點想去星巴克"]]},
    {date:"2024/12/09", lines:[["yun","在外面要小心"],["yun","晚安安先說"],["Y","我回家打給你嗎"]]},
    {date:"2024/12/14", lines:[["Y","想你"],["yun","我也好想你"]]},
    {date:"2024/12/20", lines:[["Y","好的寶寶 想你想你"],["yun","好好笑"]]},
    {date:"2024/12/22", lines:[["Y","嗚嗚 想你"],["yun","寶寶我來哩！"],["Y","好想好想好想你"]]},
    {date:"2025/01/25", lines:[["yun","寶寶我剛剛睡著了"],["yun","我好想你我好想你"]]},
    {date:"2025/01/31", lines:[["yun","早安！我起床了"],["yun","哇嗚他感覺超好吃"],["yun","那個漢堡感覺很呀米"]]},
    {date:"2025/02/02", lines:[["Y","寶寶到家跟我說"],["Y","你睡著了嗎"],["yun","我到家了喔"]]},
    {date:"2025/02/16", lines:[["yun","來我懷裡抱抱"]]},
    {date:"2025/02/25", lines:[["Y","睡不著啦寶寶"],["Y","寶寶我愛你"],["yun","寶寶我到家了哦"]]},
    {date:"2025/03/18", lines:[["yun","我愛你小寶"],["yun","謝謝你請我吃100天飯飯"],["Y","我愛你寶寶"]]},
    {date:"2025/04/06", lines:[["yun","想吃甚麼"],["Y","好想吃泡麵哦寶寶"]]},
    {date:"2025/04/13", lines:[["yun","我到家會跟你說"],["Y","先休息吧"],["Y","晚安"]]},
    {date:"2025/04/26", lines:[["yun","我愛你小寶寶"],["Y","我好想你"]]},
    {date:"2025/04/28", lines:[["Y","我愛你"],["Y","你最棒了"],["yun","我也愛你"]]},
    {date:"2025/05/05", lines:[["Y","到家的打給你"],["yun","注意安全喵"],["Y","小寶我剛到家"]]},
    {date:"2025/06/07", lines:[["yun","不哭哭 我抱抱"],["yun","有別的想吃的嗎"],["yun","不然明天吃"]]},
    {date:"2025/07/02", lines:[["yun","也會買飼料給你吃"],["Y","我愛你欸"],["yun","我也愛你欸"]]},
    {date:"2025/07/04", lines:[["yun","欸感覺很好吃欸"],["yun","我在咬早上剩下的蘋果"],["Y","好吃"]]},
    {date:"2024/11/21", lines:[["yun","好吃嗎！！"],["Y","好吃！"]]},
    {date:"2024/12/12", lines:[["Y","感覺好好吃"],["yun","我到家了"],["yun","我還得趕著上課"]]},
    {kind:"想你", date:"2025/07/19", lines:[["yun","你在就好了"],["yun","我好想你"],["Y","除非裡面有布丁"]]},
    {kind:"好笑", date:"2025/01/01", lines:[["Y","剛起床就喝超怪"],["yun","對啊為什麼會剛起床就喝哈哈哈哈哈哈"],["yun","超好笑"]]},
    {kind:"好笑", date:"2025/01/28", lines:[["Y","現在要出門"],["yun","討厭我真的起床了啦！"],["yun","我跟妳說完沒多久就睡回去哈哈哈哈哈"]]},
    {kind:"好笑", date:"2025/02/23", lines:[["Y","好不好"],["yun","豪不然我短袖裡面再穿一件哈哈哈哈哈"],["Y","好"],["yun","好我換好ㄌ"]]},
    {kind:"好笑", date:"2025/05/27", lines:[["Y","你幹嘛哭哭"],["Y","你講話爆麥"],["yun","蛤啊"],["yun","我哪有哭哭"]]},
    {kind:"好笑", date:"2024/12/31", lines:[["Y","我需要一點心理準備"],["Y","衝三小啦"],["yun","什麼鬼啊"]]},
    {kind:"拌嘴", date:"2025/06/04", lines:[["Y","我討厭妳"],["Y","我只是想聽你講話"],["yun","我好像真的都不知道在幹嘛"]]},
    {kind:"拌嘴", date:"2025/08/09", lines:[["yun","為什麼不理我啊"],["Y","我剛睡著"]]},
    {kind:"拌嘴", date:"2026/05/03", lines:[["Y","因為你都不理我"],["yun","北鼻哈嘍！"],["yun","我下班了"]]},
    {kind:"拌嘴", date:"2025/07/19", lines:[["Y","我討厭妳遮"],["Y","因為你很可愛"]]}
  ];
  const topics0 = [["寶寶",1894],["愛你",711],["好吃",663],["想你",544],["我愛你",437],["回家",393],["想吃",359],["睡覺",350],["對不起",271],["北鼻",244],["討厭",233],["生氣",212],["抱抱",181],["寶貝",178],["吃飯",156],["乖乖",146],["老婆",140],["上課",132],["早安",116],["吵架",91],["晚安",80],["和好",43]];
  const box = document.getElementById("chatToday");
  const meta = document.getElementById("chatMeta");
  convos.forEach(function(c){ if(!c.kind) c.kind = "想你"; });
  let kind = "全部";
  let pool = convos.slice();
  let n = 0;
  function applyPool(){
    pool = kind === "全部" ? convos.slice() : convos.filter(function(c){ return c.kind === kind; });
    if(!pool.length) pool = convos.slice();
    n = n % pool.length;
  }
  function paintChatFilters(){
    const row = document.getElementById("chatFilters");
    if(!row) return;
    row.innerHTML = "";
    ["全部","想你","好笑","拌嘴"].forEach(function(name){
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (name === kind ? " on" : "");
      b.textContent = name;
      b.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        kind = name;
        n = 0;
        applyPool();
        show();
        paintChatFilters();
      };
      row.appendChild(b);
    });
  }
  applyPool();
  n = Math.floor(Date.now()/86400000) % pool.length;
  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return "&#" + c.charCodeAt(0) + ";";
    });
  }
  function show(){
    const c = pool[n % pool.length];
    meta.textContent = c.date;
    box.innerHTML = c.lines.map(function(m){
      const me = m[0] === "Y";
      return '<div class="chat-line'+(me?" me":"")+'"><span class="bubble"><span class="who">'+(me?"Y":"小昀")+'</span>'+esc(m[1])+'</span></div>';
    }).join("");
  }
  document.getElementById("chatNext").onclick = function(ev){
    ev.preventDefault();
    ev.stopPropagation();
    n = (n + 1) % pool.length;
    show();
  };
  paintChatFilters();
  show();

  const bars = document.getElementById("talkBars");
  function drawBars(list){
    const max = list[0] ? list[0][1] : 1;
    bars.innerHTML = list.map(function(row){
      const w = Math.max(6, Math.round(row[1]/max*100));
      return '<div class="talk-row"><b>'+esc(row[0])+'</b><div class="talk-bar"><i style="width:'+w+'%"></i></div><span>'+row[1]+'</span></div>';
    }).join("");
  }


  const pinks = ["#e91e63","#ff8fb3","#ffd0e0","#c45c26"];
  const charts = {};
  function chartOk(){ return window.Chart && document.getElementById("whoChart"); }
  function makeChart(id, cfg){
    if(!chartOk()) return;
    const el = document.getElementById(id);
    if(!el) return;
    if(charts[id]) charts[id].destroy();
    charts[id] = new Chart(el, cfg);
  }
  function baseOpts(legend){
    return { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:legend, labels:{ boxWidth:10 } } } };
  }
  function paintWho(y, yun){
    makeChart("whoChart", {
      type:"doughnut",
      data:{ labels:["Y","小昀"], datasets:[{ data:[y,yun], backgroundColor:["#e91e63","#ffb3c8"], borderWidth:0 }] },
      options:baseOpts(true)
    });
  }
  function paintType(text, sticker, photo, other){
    makeChart("typeChart", {
      type:"doughnut",
      data:{ labels:["文字","貼圖","照片","其他"], datasets:[{ data:[text,sticker,photo,other], backgroundColor:pinks, borderWidth:0 }] },
      options:baseOpts(true)
    });
  }
  function paintHours(arr){
    makeChart("hourChart", {
      type:"bar",
      data:{ labels:arr.map(function(_,i){ return i; }), datasets:[{ label:"幾點在傳", data:arr, backgroundColor:"#ff8fb3", borderRadius:4 }] },
      options:Object.assign(baseOpts(false), { scales:{ x:{ ticks:{ maxTicksLimit:8 } }, y:{ ticks:{ display:false } } } })
    });
  }
  function paintMonths(labels, vals){
    makeChart("monthChart", {
      type:"line",
      data:{ labels:labels, datasets:[{ label:"每個月幾則", data:vals, borderColor:"#e91e63", backgroundColor:"rgba(233,30,99,.15)", fill:true, tension:.35, pointRadius:2 }] },
      options:Object.assign(baseOpts(false), { scales:{ x:{ ticks:{ maxTicksLimit:6 } }, y:{ ticks:{ display:false } } } })
    });
  }
  window._talkCharts = { paintWho:paintWho, paintHours:paintHours, paintMonths:paintMonths, paintType:paintType };

  let radarYears = {};
  let radarNotes = {};
  let radar;
  function showRadar(year){
    const note = document.getElementById("radarNote");
    if(note) note.textContent = radarNotes[year] || "";
    document.querySelectorAll("#radarYears .chip").forEach(function(b){
      b.classList.toggle("on", b.dataset.year === year);
    });
    if(!window.Chart || !document.getElementById("radarChart")) return;
    const data = radarYears[year];
    if(!data || !data.length) return;
    if(radar){
      radar.data.datasets[0].data = data;
      radar.update();
      return;
    }
    radar = new Chart(document.getElementById("radarChart"), {
      type:"radar",
      data:{
        labels:["默契","愛吃醋","搞笑","黏人","大方"],
        datasets:[{
          label:year,
          data:data,
          backgroundColor:"rgba(233,30,99,.28)",
          borderColor:"#e91e63",
          pointBackgroundColor:"#e91e63",
          borderWidth:2
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        scales:{ r:{ suggestedMin:0, suggestedMax:100, ticks:{ display:false }, pointLabels:{ font:{ size:12 } }, grid:{ color:"rgba(233,30,99,.15)" }, angleLines:{ color:"rgba(233,30,99,.2)" } } },
        plugins:{ legend:{ display:false } }
      }
    });
  }
  window._resizeTalk = function(){
    Object.keys(charts).forEach(function(id){ if(charts[id]) charts[id].resize(); });
    if(radar) radar.resize();
  };

  const keys = ["寶寶","愛你","好吃","想你","我愛你","回家","想吃","睡覺","對不起","北鼻","討厭","生氣","抱抱","寶貝","吃飯","乖乖","老婆","上課","早安","吵架","晚安","和好","麥當勞","星巴克"];
  const SAVE_KEY = "ynn-line-report-v1";

  function hourName(h){
    const part = h < 5 ? "凌晨" : h < 12 ? "早上" : h < 18 ? "下午" : "晚上";
    return part + " " + (h % 12 || 12) + " 點";
  }
  function clamp(n){ return Math.max(0, Math.min(100, Math.round(n))); }

  function asArr(v){
    if(Array.isArray(v)) return v;
    if(!v || typeof v !== "object") return [];
    return Object.keys(v).sort(function(a,b){ return Number(a)-Number(b); }).map(function(k){ return v[k]; });
  }
  function renderReport(r){
    const report = document.getElementById("talkReport");
    const wrap = document.getElementById("radarWrap");
    const empty = document.getElementById("talkEmpty");
    if(report) report.hidden = false;
    if(wrap) wrap.hidden = false;
    if(empty) empty.hidden = true;
    document.getElementById("talkLead").textContent = r.lead || "這份記錄算出來的";
    const days = r.days || 0;
    document.getElementById("talkCounts").innerHTML =
      "<span>Y "+Number(r.y||0).toLocaleString()+" 則</span>"+
      "<span>小昀 "+Number(r.yun||0).toLocaleString()+" 則</span>"+
      "<span>照片 "+Number(r.photos||0).toLocaleString()+" 張</span>"+
      "<span>貼圖 "+Number(r.stickers||0).toLocaleString()+" 個</span>"+
      "<span>"+days+" 天</span>";
    drawBars(asArr(r.bars || []).map(function(row){ return asArr(row); }));
    document.getElementById("talkWhen").textContent = r.when || "";
    document.getElementById("talkStory").textContent = r.story || "";
    paintWho(r.y||0, r.yun||0);
    paintType(r.text||0, r.stickers||0, r.photos||0, r.other||0);
    paintHours(asArr(r.hours || []));
    paintMonths(asArr(r.monthLabels || []), asArr(r.monthVals || []));
    radarYears = r.radar || {};
    Object.keys(radarYears).forEach(function(year){
      radarYears[year] = asArr(radarYears[year]).map(Number);
    });
    radarNotes = r.notes || {};
    const box = document.getElementById("radarYears");
    const years = Object.keys(radarYears);
    if(box){
      box.innerHTML = "";
      years.forEach(function(year){
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.dataset.year = year;
        b.textContent = year;
        b.onclick = function(){ showRadar(year); };
        box.appendChild(b);
      });
    }
    if(radar){ radar.destroy(); radar = null; }
    if(years.length) showRadar(years[years.length - 1]);
    setTimeout(function(){ if(window._resizeTalk) window._resizeTalk(); }, 80);
  }

  try{
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if(saved && (saved.y || saved.yun)) renderReport(saved);
  }catch(e){}

  document.getElementById("talkFile").addEventListener("change", function(){
    const file = this.files && this.files[0];
    const status = document.getElementById("talkStatus");
    if(!file) return;
    status.textContent = "在這台手機上算…";
    const reader = new FileReader();
    reader.onload = function(){
      const raw = String(reader.result || "");
      const lines = raw.split(/\r?\n/);
      let y = 0, yun = 0, photos = 0, stickers = 0, textN = 0, other = 0, date = "";
      const days = {};
      const hit = {};
      keys.forEach(function(k){ hit[k] = 0; });
      const hours = new Array(24).fill(0);
      const months = {};
      const yearStat = {};
      const fresh = [];
      let buf = [];
      let prev = null;
      function yearBag(year){
        if(!yearStat[year]) yearStat[year] = {msg:0, sour:0, laugh:0, cling:0, give:0, quick:0, turns:0};
        return yearStat[year];
      }
      function flush(){
        if(buf.length < 2) { buf = []; return; }
        const who = {};
        buf.forEach(function(m){ who[m[0]] = 1; });
        if(who.Y && who.yun) fresh.push({date: buf[0][2], lines: buf.map(function(m){ return [m[0], m[1]]; })});
        buf = [];
      }
      lines.forEach(function(line){
        const d = line.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
        if(d && line.indexOf("（") >= 0){ date = d[1]+"/"+d[2]+"/"+d[3]; days[date] = 1; flush(); return; }
        const m = line.match(/^(上午|下午)(\d{2}:\d{2})\t(.+?)\t(.*)$/);
        if(!m || !date) return;
        const who = m[3] === "Y" ? "Y" : "yun";
        const body = (m[4] || "").trim();
        const year = date.slice(0, 4);
        const bag = yearBag(year);
        if(who === "Y") y++; else yun++;
        bag.msg++;
        const monthKey = date.slice(0, 7);
        months[monthKey] = (months[monthKey] || 0) + 1;
        let hh = parseInt(m[2], 10);
        const mm = parseInt(m[2].slice(3), 10) || 0;
        if(m[1] === "下午" && hh < 12) hh += 12;
        if(m[1] === "上午" && hh === 12) hh = 0;
        hours[hh]++;
        const mins = hh * 60 + mm;
        if(prev && prev.date === date && prev.who !== who){
          bag.turns++;
          const diff = mins - prev.mins;
          if(diff >= 0 && diff <= 5) bag.quick++;
        }
        prev = {date:date, who:who, mins:mins};
        if(body.indexOf("[照片]") === 0){ photos++; return; }
        if(body.indexOf("[貼圖]") === 0){ stickers++; return; }
        if(!body || body.charAt(0) === "[" || body.indexOf("http") === 0 || body.charAt(0) === "☎"){ other++; return; }
        textN++;
        if(/密碼|鍵位|邀請碼|去死|分手/.test(body)) return;
        if(/吃醋|生氣|討厭|不爽|不理/.test(body)) bag.sour++;
        if(/哈哈|笑死|好好笑|XD|笑/.test(body)) bag.laugh++;
        if(/想你|想妳|寶寶|愛你|愛妳|抱抱|北鼻/.test(body)) bag.cling++;
        if(/請你|我請|請客|買給/.test(body)) bag.give++;
        keys.forEach(function(k){ if(body.indexOf(k) >= 0) hit[k]++; });
        if(body.length >= 2 && body.length <= 36 && !/http|密碼|鍵位|去死|分手|操|逼/.test(body)){
          buf.push([who, body, date]);
          if(buf.length >= 4) flush();
        } else flush();
      });
      flush();
      if(!y && !yun){
        status.textContent = "這份不像 LINE 匯出的文字檔。";
        return;
      }
      const dayList = Object.keys(days).sort();
      let peak = 0;
      hours.forEach(function(v,i){ if(v > hours[peak]) peak = i; });
      const monthKeys = Object.keys(months).sort();
      const bars = keys.map(function(k){ return [k, hit[k]||0]; }).filter(function(row){ return row[1] > 0; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,16);
      const radar = {};
      const notes = {};
      Object.keys(yearStat).sort().forEach(function(year){
        const s = yearStat[year];
        const n = Math.max(1, s.msg);
        const sync = s.turns ? Math.round(s.quick / s.turns * 100) : 0;
        radar[year] = [
          sync,
          clamp(s.sour / n * 10000),
          clamp(s.laugh / n * 2000),
          clamp(s.cling / n * 2200),
          clamp(s.give / n * 80000)
        ];
        notes[year] = "這一年 " + s.msg.toLocaleString() + " 則。五分鐘內會回的比例 " + sync + "%。分數是比例，不是總量。";
      });
      const top = bars.slice(0, 5).map(function(row){ return row[0]; }).join("、");
      const report = {
        y:y, yun:yun, photos:photos, stickers:stickers, text:textN, other:other,
        days: dayList.length,
        hours: hours,
        monthLabels: monthKeys.map(function(k){ return k.slice(2).replace("-","/").replace("/","/"); }),
        monthVals: monthKeys.map(function(k){ return months[k]; }),
        bars: bars,
        radar: radar,
        notes: notes,
        lead: (dayList[0] || "") + " 到 " + (dayList[dayList.length-1] || "") + "，" + dayList.length + " 天。這是剛剛選的那份，只留在這台手機。",
        when: "這份最常在" + hourName(peak) + "傳訊息。",
        story: (y+yun).toLocaleString() + " 則訊息。Y " + y.toLocaleString() + " 則，小昀 " + yun.toLocaleString() + " 則。照片 " + photos.toLocaleString() + " 張、貼圖 " + stickers.toLocaleString() + " 個。\n聊最多的是" + (top || "這些日常") + "。"
      };
      report.monthLabels = monthKeys.map(function(k){
        const p = k.split("/");
        return p[0].slice(2) + "/" + p[1];
      });
      try{ localStorage.setItem(SAVE_KEY, JSON.stringify(report)); }catch(e){}
      if(window.db){
        window.db.ref("lineReport").set(Object.assign({at: Date.now()}, report)).catch(function(){});
      }
      renderReport(report);
      if(fresh.length){
        pool = fresh.slice(0, 80);
        n = 0;
        show();
      }
      status.textContent = "算完了。這台手機會留著，另一台登入後也看得到。再選新檔就換成新的。";
    };
    reader.readAsText(file);
    this.value = "";
  });
  if(window._authReady){
    window._authReady.then(function(){
      if(!window.db) return;
      window.db.ref("lineReport").on("value", function(s){
        const v = s.val();
        if(!v || !(v.y || v.yun)) return;
        try{ localStorage.setItem(SAVE_KEY, JSON.stringify(v)); }catch(e){}
        renderReport(v);
      });
    });
  }
})();

/* 即時聊天 */
window._authReady.then(function(uid){
  const chatList = document.getElementById("chatList");
  db.ref("chat").on("value", snap => {
    chatList.innerHTML = "";
    const msgs = [];
    snap.forEach(d => { msgs.push(d.val()); });
    msgs.sort((a,b)=>(a.time||0)-(b.time||0));
    msgs.slice(-100).forEach(m => {
      const mine = m.uid === uid;
      chatList.innerHTML += `<div style="margin:8px 0;${mine?'text-align:right':''}">
        <span style="display:inline-block;padding:8px 14px;border-radius:16px;
          background:${mine?'var(--pink)':'#fff'};color:${mine?'#fff':'#555'};
          border:${mine?'none':'1px solid var(--pink-soft)'}">${m.text}</span></div>`;
    });
    chatList.scrollTop = chatList.scrollHeight;
  });
  document.getElementById("chatSend").onclick = function(){
    const v = document.getElementById("chatInput").value.trim();
    if(!v) return;
    db.ref("chat").push({text:v, uid:uid, time:{".sv":"timestamp"}}); if(window.addPoints) window.addPoints(1, "聊天");
    localStorage.setItem("chatSent","1");
    if(typeof renderBadges === "function") renderBadges();
    document.getElementById("chatInput").value = "";
  };
  document.getElementById("chatInput").addEventListener("keydown", e => {
    if(e.key === "Enter") document.getElementById("chatSend").click();
  });
  // 正在輸入
  let typingTimeout;
  document.getElementById("chatInput").addEventListener("input", () => {
    db.ref("typing/"+uid).set({isTyping:true});
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => db.ref("typing/"+uid).set({isTyping:false}), 2000);
  });
  db.ref("typing").on("value", snap => {
    let typing = false;
    snap.forEach(d => { if(d.key !== uid && d.val().isTyping) typing = true; });
    document.getElementById("typing").style.display = typing ? "block" : "none";
  });
});

/* 定位+電量 */
window._authReady.then(function(uid){
  // 上傳電量（iOS Safari 不支援 getBattery，會標記 unsupported）
  if(navigator.getBattery){
    navigator.getBattery().then(b => {
      function upd(){
        db.ref("locations/"+uid+"/battery").set(Math.round(b.level*100));
        db.ref("locations/"+uid+"/charging").set(b.charging);
        db.ref("locations/"+uid+"/battTime").set(new Date().toLocaleString("zh-TW"));
      }
      upd();
      b.addEventListener("levelchange", upd);
      b.addEventListener("chargingchange", upd);
    }).catch(()=>{
      db.ref("locations/"+uid+"/battery").set("unsupported");
    });
  } else {
    db.ref("locations/"+uid+"/battery").set("unsupported");
  }
  // 顯示所有人位置 + 距離
  const locs = {};
  db.ref("locations").on("value", snap => {
    snap.forEach(d => {
      const l = d.val();
      const isMe = d.key === uid;
      const locEl = document.getElementById(isMe ? "myLoc" : "herLoc");
      const batEl = document.getElementById(isMe ? "myBattery" : "herBattery");
      if(l.lat){
        locs[d.key] = {lat: l.lat, lng: l.lng};
        locEl.innerHTML = `<a href="https://www.google.com/maps?q=${l.lat},${l.lng}" target="_blank" style="color:var(--pink)">看地圖</a>`;
      } else {
        locEl.textContent = "還沒上傳";
      }
      if(l.battery === "unsupported") batEl.textContent = "📱 此裝置不支援電量";
      else if(l.battery) batEl.textContent = "🔋 " + l.battery + "%" + (l.charging ? " ⚡" : "");
      else batEl.textContent = "未更新";
    });
    // 算距離
    const keys = Object.keys(locs);
    if(keys.length >= 2){
      const me = locs[uid], her = locs[keys.find(k => k !== uid)];
      if(me && her){
        const R = 6371;
        const dLat = (her.lat-me.lat)*Math.PI/180;
        const dLng = (her.lng-me.lng)*Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(me.lat*Math.PI/180)*Math.cos(her.lat*Math.PI/180)*Math.sin(dLng/2)**2;
        const dist = Math.round(R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
        document.getElementById("distance").textContent = dist < 1 ? Math.round(dist*1000) + " 公尺" : dist + " 公里";
        // 天氣（雙方）
        const codes = {0:"☀️ 晴",1:"🌤 多雲",2:"⛅ 多雲",3:"☁️ 陰",45:"🌫 霧",48:"🌫 霧",51:"🌦 毛毛雨",53:"🌦 毛毛雨",55:"🌧 雨",61:"🌧 小雨",63:"🌧 雨",65:"🌧 大雨",71:"🌨 雪",73:"🌨 雪",75:"❄️ 大雪",80:"🌦 陣雨",81:"🌧 陣雨",82:"⛈ 大雨",95:"⛈ 雷雨"};
        function dressFor(temp){
          if(temp >= 30) return "🩳 短袖短褲就出門";
          if(temp >= 25) return "👕 薄長袖剛好";
          if(temp >= 20) return "🧥 加件外套";
          if(temp >= 15) return "🧣 有點涼別凍著";
          return "🥶 穿厚一點！";
        }
        function fetchWeather(lat, lng, label, el){
          return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code&daily=sunrise,sunset&timezone=auto`)
          .then(r => r.json()).then(d => {
            const cur = d.current;
            const w = codes[cur.weather_code] || "🌡";
            const dress = dressFor(cur.temperature_2m);
            const rain = cur.precipitation_probability ? " 降雨" + cur.precipitation_probability + "%" : "";
            const feel = Math.abs(cur.apparent_temperature - cur.temperature_2m) > 2 ? "（體感" + Math.round(cur.apparent_temperature) + "°C）" : "";
            el.innerHTML = `${label} ${w} ${Math.round(cur.temperature_2m)}°C${feel}<br>
              <span style="font-size:.8rem;color:#888">💧濕度${Math.round(cur.relative_humidity_2m)}% · 💨${Math.round(cur.wind_speed_10m)}km/h${rain}</span><br>
              <span style="font-size:.8rem;color:var(--pink)">👕 ${dress}</span>`;
          }).catch(()=>{ el.textContent = ""; });
        }
        const myW = document.getElementById("myWeather");
        const herW = document.getElementById("weatherTip");
        fetchWeather(me.lat, me.lng, "我這裡", myW);
        fetchWeather(her.lat, her.lng, (window.themName||"她") + "那裡", herW);
      }
    }
  });
  // 上傳位置
  document.getElementById("locBtn").onclick = function(){
    navigator.geolocation.getCurrentPosition(pos => {
      db.ref("locations/"+uid+"/lat").set(pos.coords.latitude);
      db.ref("locations/"+uid+"/lng").set(pos.coords.longitude);
      db.ref("locations/"+uid+"/locTime").set(new Date().toLocaleString("zh-TW"));
      document.getElementById("myLoc").innerHTML = `<a href="https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}" target="_blank" style="color:var(--pink)">看地圖</a>`;
    });
  };
});

/* 在線狀態 */
window._authReady.then(function(uid){
  // 上傳在線狀態
  db.ref("online/"+uid).set({online: true, lastSeen: Date.now()});
  window.addEventListener("beforeunload", () => {
    db.ref("online/"+uid).set({online: false, lastSeen: Date.now()});
  });
  setInterval(() => db.ref("online/"+uid).set({online: true, lastSeen: Date.now()}), 30000);
  // 看對方
  db.ref("online").on("value", snap => {
    snap.forEach(d => {
      if(d.key === uid) return;
      const o = d.val();
      const el = document.getElementById("onlineStatus");
      if(o.online){
        el.textContent = "🟢 " + (window.themName||"她") + "現在在線";
      } else if(o.lastSeen){
        const ls = typeof o.lastSeen === 'number' ? o.lastSeen : (o.lastSeen.timestamp || Date.now());
        const diff = Math.max(0, Math.floor((Date.now() - ls)/60000));
        el.textContent = diff < 60 ? "⚪ " + diff + " 分鐘前上線" : "⚪ 剛才上線過";
      }
    });
  });

  /* 紀念日 */
  db.ref("anniversaries").on("value", snap => {
    const list = document.getElementById("anniList");
    let html = "";
    snap.forEach(d => {
      const a = d.val();
      const target = new Date(a.date);
      const now = new Date();
      let days = Math.ceil((target - now)/86400000);
      // 每年重複
      if(days < 0){
        target.setFullYear(now.getFullYear() + 1);
        days = Math.ceil((target - now)/86400000);
      }
      html += `<div style="background:#fff;border-radius:16px;padding:12px;margin:8px 0;display:flex;justify-content:space-between;align-items:center">
        <span style="font-family:'Noto Serif TC',serif;color:var(--pink-deep)">${a.name}</span>
        <span style="display:flex;align-items:center;gap:10px">
          <span style="color:var(--pink);font-weight:600">${days === 0 ? "今天！🎉" : days + " 天"}</span>
          <button onclick="db.ref('anniversaries/${d.key}').remove()" style="border:none;background:none;cursor:pointer;font-size:1rem;opacity:.5">🗑️</button>
        </span>
      </div>`;
    });
    list.innerHTML = html || "<div style='color:#999;font-size:.85rem'>還沒有紀念日，加一個吧～</div>";
  });
  document.getElementById("anniAdd").onclick = function(){
    const n = document.getElementById("anniName").value.trim();
    const d = document.getElementById("anniDate").value;
    if(n && d){
      db.ref("anniversaries").push({name:n, date:d});
      document.getElementById("anniName").value = "";
    }
  };
});

/* 誰先睡：先改畫面，再寫上去，按了一定有反應 */
(function(){
  const btn = document.getElementById("sleepBtn");
  const el = document.getElementById("sleepStatus");
  if(!btn || !el) return;
  function dayKey(){ return new Date().toISOString().slice(0, 10); }
  function paint(d, uid){
    d = d || {};
    const me = d[uid];
    let her = null, herKey = "";
    Object.keys(d).forEach(function(k){ if(k !== uid){ her = d[k]; herKey = k; } });
    if(me && her){
      el.textContent = Number(me) <= Number(her) ? "你先睡了" : ((window.themName || "她") + "先睡了");
    } else if(me){ el.textContent = "你說了晚安，等她"; }
    else if(her){ el.textContent = (window.themName || "她") + "先說晚安了"; }
    else { el.textContent = "還沒人睡"; }
  }
  btn.type = "button";
  btn.onclick = function(){
    el.textContent = "你說了晚安，等她";
    const uid = window.uid;
    if(!window.db || !uid) return;
    window.db.ref("sleep/" + dayKey() + "/" + uid).set(Date.now()).catch(function(){});
  };
  if(window._authReady){
    window._authReady.then(function(uid){
      if(!window.db) return;
      window.db.ref("sleep/" + dayKey()).on("value", function(doc){
        paint(doc.exists() ? (doc.val() || {}) : {}, uid);
      });
    });
  }
})();

/* 愛情分數 */
window._authReady.then(function(uid){
  const sb = document.getElementById("scoreBtns");
  const btns = [];
  for(let i=1;i<=10;i++){
    const b = document.createElement("button");
    b.textContent = i;
    b.style.cssText = "width:35px;height:35px;border-radius:50%;border:2px solid var(--pink-soft);background:#fff;cursor:pointer;font-family:inherit";
    b.onclick = () => {
      db.ref("scores/"+new Date().toDateString()).update({[uid]: i, updatedAt: Date.now()}).catch(e=>console.warn("score",e));
      btns.forEach(x => x.style.background="#fff");
      b.style.background = "var(--pink)"; b.style.color="#fff";
    };
    btns.push(b);
    sb.appendChild(b);
  }
  db.ref("scores/"+new Date().toDateString()).on("value", doc => {
    const d = doc.exists() ? (doc.val() || {}) : {};
    const my = d[uid];
    // 對方 uid（不等於我）
    let herVal = null;
    Object.keys(d).forEach(k => { if(k!==uid && k!=='updatedAt' && typeof d[k]==='number') herVal = d[k]; });
    const vals = [my, herVal].filter(v => typeof v === 'number');
    let line = "";
    if(vals.length) line += (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) + " 分";
    line += "<div style='font-size:.85rem;color:#999;margin-top:6px'>我：" + (my||"未打") + "　" + (window.themName||"她") + "：" + (herVal||"未打") + "</div>";
    document.getElementById("loveScore").innerHTML = line || "--";
    // 高亮我已打的分
    btns.forEach(x => { x.style.background = (my == x.textContent) ? "var(--pink)" : "#fff"; x.style.color = (my == x.textContent) ? "#fff" : "inherit"; });
  });
});

/* 聲音訊息：先在本機錄，再上傳。不依賴登入才綁按鈕。 */
(function(){
  let mediaRecorder = null, chunks = [], stream = null, recording = false, timer = null, tick = null, startedAt = 0;
  const btn = document.getElementById("recBtn");
  const st = document.getElementById("recStatus");
  const preview = document.getElementById("recPreview");
  if(!btn) return;

  function pickMime(){
    if(typeof MediaRecorder === "undefined") return "";
    const types = ["audio/mp4", "audio/aac", "audio/webm;codecs=opus", "audio/webm"];
    for(const t of types){
      try{ if(MediaRecorder.isTypeSupported(t)) return t; }catch(e){}
    }
    return "";
  }
  function stopStream(){
    if(stream){ stream.getTracks().forEach(t => t.stop()); stream = null; }
  }
  function showLocal(blob){
    preview.src = URL.createObjectURL(blob);
    preview.style.display = "block";
  }
  async function upload(blob){
    showLocal(blob);
    if(!window.db || !window.uid){
      st.textContent = "已錄好，可先播放。登入後再按一次停止就會上傳";
      window._pendingVoice = blob;
      return;
    }
    if(blob.size > 1500000){ st.textContent = "檔案太大，請錄短一點"; return; }
    st.textContent = "上傳中...";
    const data = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = () => rej(reader.error);
      reader.readAsDataURL(blob);
    });
    await db.ref("voices").push({audio: data, uid: window.uid, role: window.myRole||"", mime: blob.type||"audio/mp4", time: Date.now()});
    if(window.addPoints) window.addPoints(1, "語音");
    localStorage.setItem("recDone","1");
    if(typeof renderBadges === "function") renderBadges();
    st.textContent = "已送出";
    window._pendingVoice = null;
  }
  async function start(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      st.textContent = "這個瀏覽器不能錄音，請用 Safari 或 Chrome 開網址";
      return;
    }
    st.textContent = "正在開麥克風...";
    btn.disabled = true;
    try{
      stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}});
      const mime = pickMime();
      chunks = [];
      mediaRecorder = mime ? new MediaRecorder(stream, {mimeType: mime}) : new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => { if(e.data && e.data.size) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        clearInterval(tick);
        const blob = new Blob(chunks, {type: mediaRecorder.mimeType || mime || "audio/mp4"});
        stopStream();
        recording = false;
        btn.disabled = false;
        btn.textContent = "開始錄音";
        try{ await upload(blob); }
        catch(e){ st.textContent = "上傳失敗，本機還聽得到：" + (e.message||e.code||""); }
      };
      mediaRecorder.start();
      recording = true;
      startedAt = Date.now();
      btn.disabled = false;
      btn.textContent = "停止並送出";
      clearInterval(tick);
      tick = setInterval(() => {
        const sec = Math.floor((Date.now() - startedAt) / 1000);
        st.textContent = "錄音中 " + sec + " 秒，再按一次送出";
      }, 250);
      clearTimeout(timer);
      timer = setTimeout(() => { if(recording && mediaRecorder) mediaRecorder.stop(); }, 20000);
    }catch(e){
      clearInterval(tick);
      stopStream();
      btn.disabled = false;
      btn.textContent = "開始錄音";
      if(e.name === "NotAllowedError") st.textContent = "麥克風被拒絕。iPhone：設定 → Safari → 麥克風 → 允許";
      else st.textContent = "無法開麥：" + (e.name||e.message||e);
      if(window.Guard) Guard.push("Mic", st.textContent, "");
    }
  }
  btn.onclick = function(){
    if(recording && mediaRecorder && mediaRecorder.state === "recording"){
      mediaRecorder.stop();
      return;
    }
    start();
  };
  window._authReady.then(function(){
    if(window._pendingVoice) upload(window._pendingVoice).catch(()=>{});
    db.ref("voices").limitToLast(8).on("value", snap => {
      const el = document.getElementById("voiceList");
      if(!el) return;
      const items = [];
      snap.forEach(d => items.push(d.val()));
      items.sort((a,b)=>(b.time||0)-(a.time||0));
      el.innerHTML = items.map(v => {
        if(!v.audio) return "";
        const who = v.role === "yun" ? "小昀" : v.role === "y" ? "Y" : "";
        return `<div style="font-size:.75rem;color:#c06;margin-top:8px">${who}</div><audio controls src="${v.audio}" style="width:100%"></audio>`;
      }).join("");
    });
  });
})();

/* 線上數據 */
window._authReady.then(function(uid){
  const today = new Date().toDateString();
  db.ref("stats/"+today).on("value", doc => {
    if(!doc.exists()) return;
    const s = doc.val() || {};
    document.getElementById("statChat").textContent = s.chat || 0;
    document.getElementById("statHearts").textContent = s.hearts || 0;
    document.getElementById("statKiss").textContent = s.kisses || 0;
  });
});

/* 今日心情 */
window._authReady.then(function(uid){
  document.querySelectorAll(".mood").forEach(m => {
    m.onclick = () => { db.ref("status/"+uid+"/mood").set(m.dataset.mood); db.ref("status/"+uid+"/time").set(Date.now()); addPoints(1, "心情"); }
  });
  db.ref("status").on("value", snap => {
    let mine = null, hers = null;
    snap.forEach(d => {
      const s = d.val();
      if(d.key === uid) mine = s.mood; else hers = s.mood;
    });
    document.getElementById("moodShow").innerHTML =
      "我：" + (mine||"尚未更新") + " &nbsp;&nbsp; " + (window.themName||"她") + "：" + (hers||"尚未更新");
  });
});

/* 現在在幹嘛 */
window._authReady.then(function(uid){
  document.querySelectorAll(".status-btn").forEach(b => {
    b.onclick = () => { db.ref("status/"+uid+"/what").set(b.textContent); db.ref("status/"+uid+"/time").set(Date.now()); }
  });
  db.ref("status").on("value", snap => {
    let mine = null, hers = null;
    snap.forEach(d => {
      const s = d.val();
      if(d.key === uid) mine = s.what; else hers = s.what;
    });
    document.getElementById("statusShow").innerHTML =
      "我：" + (mine||"尚未更新") + "<br>" + (window.themName||"她") + "：" + (hers||"尚未更新");
  });
});

/* 今日打卡 */
window._authReady.then(function(uid){
  document.getElementById("checkinBtn").onclick = () => document.getElementById("checkinInput").click();
  document.getElementById("checkinInput").onchange = function(){
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(){
        // 压縮圖片
        const img = new Image();
        img.onload = function(){
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, 400/img.width);
          canvas.width = img.width*scale;
          canvas.height = img.height*scale;
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          db.ref("checkins").push({img: canvas.toDataURL("image/jpeg", 0.6), uid: uid, time: Date.now()}); if(window.addPoints) window.addPoints(1, "打卡");
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };
  db.ref("checkins").on("value", snap => {
    const grid = document.getElementById("checkinGrid");
    grid.innerHTML = "";
    const items = [];
    snap.forEach(d => items.push(d.val()));
    items.sort((a,b)=>(b.time||0)-(a.time||0));
    items.slice(0,20).forEach(v => {
      const img = document.createElement("img");
      img.src = v.img;
      img.style.cssText = "width:100%;border-radius:12px;object-fit:cover;aspect-ratio:1";
      grid.appendChild(img);
    });
  });
});

/* 即時塗鴉（雙畫板） */
window._authReady.then(function(uid){
  const myCanvas = document.getElementById("myDraw");
  const myCtx = myCanvas.getContext("2d");
  const herCanvas = document.getElementById("herDraw");
  const herCtx = herCanvas.getContext("2d");
  let myDrawing = false, herDrawing = false;
  let lastPt = null;

  function pos(canvas, e){
    const r = canvas.getBoundingClientRect();
    if(r.width < 8 || r.height < 8) return null;
    return {x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height};
  }
  function stroke(ctx, from, to, color){
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.stroke();
  }

  function okPt(p){
    return p && isFinite(p.x) && isFinite(p.y) && p.x >= 0 && p.y >= 0 && p.x <= 360 && p.y <= 270;
  }
  function far(a, b){
    if(!okPt(a) || !okPt(b)) return true;
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx*dx + dy*dy > 70*70;
  }

  myCanvas.style.touchAction = "none";
  myCanvas.onpointerdown = function(e){
    myCanvas.setPointerCapture(e.pointerId);
    myDrawing = true;
    lastPt = pos(myCanvas, e);
    if(!okPt(lastPt)) return;
    db.ref("draw/"+uid).push({t:"start", x:lastPt.x, y:lastPt.y, at:Date.now()});
  };
  myCanvas.onpointermove = function(e){
    if(!myDrawing) return;
    const p = pos(myCanvas, e);
    if(!okPt(p) || far(lastPt, p)){ lastPt = p; return; }
    stroke(myCtx, lastPt, p, "#e91e63");
    db.ref("draw/"+uid).push({t:"move", x:p.x, y:p.y, at:Date.now()});
    lastPt = p;
  };
  function stopDraw(){ myDrawing = false; lastPt = null; }
  myCanvas.onpointerup = stopDraw;
  myCanvas.onpointercancel = stopDraw;

  document.getElementById("clearMyDraw").onclick = () => {
    myCtx.clearRect(0,0,myCanvas.width,myCanvas.height);
    db.ref("draw/"+uid).push({t:"clear", at:Date.now()});
  };

  const heard = {};
  db.ref("draw").on("child_added", snap => {
    const otherUid = snap.key;
    if(otherUid === uid || heard[otherUid]) return;
    heard[otherUid] = 1;
    document.getElementById("herDrawLabel").textContent = (window.themName||"她") + "的畫板";
    let lastHer = null;
    let drawing = false;
    snap.ref.limitToLast(400).on("child_added", s => {
      const ev = s.val() || {};
      if(typeof ev.at !== "number") return;
      if(ev.t === "clear"){
        herCtx.clearRect(0,0,herCanvas.width,herCanvas.height);
        lastHer = null;
        drawing = false;
        return;
      }
      if(ev.t === "end"){ drawing = false; lastHer = null; return; }
      if(!okPt(ev)) return;
      if(ev.t === "start" || !drawing || far(lastHer, ev)){
        lastHer = ev;
        drawing = true;
        return;
      }
      stroke(herCtx, lastHer, ev, "#673ab7");
      lastHer = ev;
    });
  });
});

/* 集點卡 */
window.addPoints = function(n, reason){
  const uid = window.uid;
  if(!uid) return;
  db.ref("points/"+uid).transaction(cur => (cur||0)+n);
};
window.taskDone = function(name, n){
  if(window.addPoints) window.addPoints(n, name);
  const rs = document.getElementById("rewardShow");
  rs.textContent = "✅ 完成「" + name + "」+" + n + " 點";
};
window.redeem = function(type){
  const costs = {hug:5, kiss:10, choose:15, day:30};
  const names = {hug:"🤗 抱抱券", kiss:"😘 親親券", choose:"🍜 今天她選餐廳", day:"🌈 約會地點她選"};
  const uid = window.uid;
  db.ref("points/"+uid).once("value").then(snap => {
    const p = snap.val() || 0;
    if(p < costs[type]){
      document.getElementById("rewardShow").textContent = "點數不夠啦，再玩一下～";
      return;
    }
    if(!confirm("確定兌換「"+names[type]+"」？")) return;
    db.ref("points/"+uid).set(p - costs[type]);
    db.ref("rewards").push({who: uid, type: type, name: names[type], time: Date.now()});
    document.getElementById("rewardShow").textContent = "🎉 已兌換 " + names[type] + "！";
  });
};
window._authReady.then(function(uid){
  db.ref("points/"+uid).on("value", snap => {
    document.getElementById("myPoints").textContent = snap.val() || 0;
  });
  db.ref("points").on("value", snap => {
    let herP = 0;
    snap.forEach(d => { if(d.key !== uid) herP = d.val() || 0; });
    document.getElementById("herPoints").textContent = herP;
  });
});

/* 彈幕：按了就飛，對方也看得到 */
function shootDm(text){
  const layer = document.getElementById("dmLayer");
  const clean = String(text || "").trim().slice(0, 24);
  if(!layer || !clean) return;
  const el = document.createElement("div");
  el.className = "danmaku";
  el.textContent = clean;
  const ink = ["#e91e63","#c2185b","#ad1457","#d81b60","#ff6b9d"];
  el.style.color = ink[clean.length % ink.length];
  el.style.top = (8 + Math.random()*28) + "%";
  el.style.animationDuration = (7 + Math.random()*4) + "s";
  el.style.fontSize = (clean.length > 10 ? 1 : 1.2) + "rem";
  layer.appendChild(el);
  setTimeout(function(){ el.remove(); }, 12000);
}
const dmEcho = [];
function sendDm(raw){
  const v = String(raw || "").trim().slice(0, 24);
  if(!v) return;
  const input = document.getElementById("dmInput");
  if(input) input.value = "";
  const at = Date.now();
  dmEcho.push({text: v, at: at});
  shootDm(v);
  const status = document.getElementById("dmStatus");
  if(status) status.textContent = "飛出去了";
  if(window.db){
    window.db.ref("danmaku").push({text: v, at: at, role: window.myRole || ""}).catch(function(){
      if(status) status.textContent = "這台看得到。對方若沒連上，等一下會再到。";
    });
  }
}
document.getElementById("dmSend").onclick = function(ev){
  ev.preventDefault();
  ev.stopPropagation();
  sendDm(document.getElementById("dmInput").value);
};
document.getElementById("dmInput").addEventListener("keydown", function(e){
  if(e.key === "Enter"){
    e.preventDefault();
    sendDm(document.getElementById("dmInput").value);
  }
});
["想你","吃了嗎","到家了嗎","抱抱","在嗎","看我","笨蛋","晚安","傳語音","乖乖","我在","快回我"].forEach(function(word){
  const row = document.getElementById("dmPresets");
  if(!row) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.textContent = word;
  b.onclick = function(ev){
    ev.preventDefault();
    ev.stopPropagation();
    sendDm(word);
  };
  row.appendChild(b);
});
if(window._authReady){
  window._authReady.then(function(){
    if(!window.db) return;
    let skip = true;
    window.db.ref("danmaku").limitToLast(1).on("child_added", function(s){
      if(skip){ skip = false; return; }
      const v = s.val() || {};
      const text = v.text || "";
      const at = v.at || 0;
      const i = dmEcho.findIndex(function(x){ return x.text === text && Math.abs(x.at - at) < 8000; });
      if(i >= 0){ dmEcho.splice(i, 1); return; }
      shootDm(text);
    });
  });
}

/* 送禮物 */
window.sendGift = function(emoji){
  localStorage.setItem("giftDone","1");
  if(typeof renderBadges === "function") renderBadges();
  for(let i = 0; i < 5; i++){
    setTimeout(() => {
      const el = document.createElement("div");
      el.textContent = emoji;
      el.style.cssText = "position:fixed; left:50%; bottom:-50px; font-size:2rem; z-index:100; pointer-events:none; transition:all 4s ease-out;";
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.bottom = "80vh";
        el.style.left = (30 + Math.random()*40) + "%";
        el.style.transform = "rotate(" + (Math.random()*360) + "deg)";
        el.style.opacity = "0";
      });
      setTimeout(() => el.remove(), 4000);
    }, i * 200);
  }
};

/* 彈幕自動飛過的舊版已關掉，改成有人發才出現 */

/* 滾動進度條 + 回到頂部 */
window.addEventListener("scroll", () => {
  const h = document.documentElement;
  const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  document.getElementById("progressBar").style.width = pct + "%";
  document.getElementById("backTop").classList.toggle("show", h.scrollTop > 500);
});
document.getElementById("backTop").onclick = () => scrollTo({top:0, behavior:"smooth"});

/* 數字滾動動畫 */
function animateNumber(el, target, suffix){
  const dur = 1500;
  const start = performance.now();
  function tick(now){
    const p = Math.min((now-start)/dur, 1);
    const eased = 1 - Math.pow(1-p, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* 滾動淡入 */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting){
      e.target.style.opacity = 1;
      e.target.style.transform = "translateY(0)";
      // 如果是數字元素，觸發滾動
      if(e.target.dataset.animateNum){
        const [t, s] = e.target.dataset.animateNum.split("|");
        animateNumber(e.target, parseInt(t), s || "");
        delete e.target.dataset.animateNum;
      }
    }
  });
}, {threshold:.1});

/* 滾動時更新計時器（平滑） */
setInterval(() => {
  const now = new Date();
  const diff = now - start;
  const days = Math.floor(diff / 86400000);
  document.querySelectorAll("#days").forEach(el => el.textContent = days);
}, 1000);

/* Canvas 粒子愛心背景 */
(function(){
  const cv = document.getElementById("particles");
  const ctx = cv.getContext("2d");
  let W, H;
  function resize(){ W = cv.width = innerWidth; H = cv.height = innerHeight; }
  resize();
  addEventListener("resize", resize);
  const hearts = [];
  for(let i = 0; i < 40; i++){
    hearts.push({
      x: Math.random()*W, y: Math.random()*H,
      r: 3 + Math.random()*6,
      dx: (Math.random()-.5)*.5,
      dy: -.5 - Math.random(),
      alpha: .2 + Math.random()*.5
    });
  }
  function drawHeart(x,y,r,a){
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(r/10, r/10);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ff6b9d";
    ctx.beginPath();
    ctx.moveTo(0,3);
    ctx.bezierCurveTo(-6,-3,-3,-9,0,-5);
    ctx.bezierCurveTo(3,-9,6,-3,0,3);
    ctx.fill();
    ctx.restore();
  }
  function loop(){
    ctx.clearRect(0,0,W,H);
    hearts.forEach(h => {
      h.x += h.dx; h.y += h.dy;
      if(h.y < -20){ h.y = H+20; h.x = Math.random()*W; }
      drawHeart(h.x, h.y, h.r, h.alpha);
    });
    requestAnimationFrame(loop);
  }
  loop();
})();

/* 鼠標軌跡愛心 */
let lastTrail = 0;
document.addEventListener("mousemove", e => {
  const now = Date.now();
  if(now - lastTrail < 60) return;
  lastTrail = now;
  const el = document.createElement("div");
  el.textContent = "♥";
  el.style.cssText = `
    position:fixed; left:${e.clientX}px; top:${e.clientY}px;
    font-size:${8+Math.random()*8}px; color:var(--pink);
    pointer-events:none; z-index:9998;
    transition:all 1s ease-out; opacity:1;
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = "translateY(-30px) scale(0)";
    el.style.opacity = "0";
  });
  setTimeout(() => el.remove(), 1000);
});

/* 打字機情書 */
(function(){
  const lines = document.querySelectorAll("#typewriter .line");
  lines.forEach((line, i) => {
    setTimeout(() => line.classList.add("show"), 800 + i*1200);
  });
})();

/* 煙花 */
window.firework = function(){
  const colors = ["#ff6b9d","#ffd700","#ff9a9e","#c084fc","#7dd3fc","#fda4af"];
  for(let burst = 0; burst < 6; burst++){
    setTimeout(() => {
      const cx = innerWidth/2 + (Math.random()-.5)*innerWidth*.6;
      const cy = innerHeight/3 + (Math.random()-.5)*innerHeight*.3;
      for(let i = 0; i < 20; i++){
        const p = document.createElement("div");
        p.style.cssText = `
          position:fixed; left:${cx}px; top:${cy}px;
          width:8px; height:8px; border-radius:50%;
          background:${colors[Math.floor(Math.random()*colors.length)]};
          pointer-events:none; z-index:9999;
          transition:all 1.2s ease-out;
        `;
        document.body.appendChild(p);
        const ang = (i/20)*Math.PI*2;
        const dist = 80 + Math.random()*100;
        requestAnimationFrame(() => {
          p.style.transform = `translate(${Math.cos(ang)*dist}px, ${Math.sin(ang)*dist + 60}px) scale(0)`;
          p.style.opacity = "0";
        });
        setTimeout(() => p.remove(), 1200);
      }
    }, burst*250);
  }
};
document.getElementById("fireworkBtn").onclick = function(){
  localStorage.setItem("fwDone","1");
  if(typeof renderBadges === "function") renderBadges();
  firework();
};

/* 轉盤：指針固定在上方，結果跟扇形對齊 */
(function(){
  const tasks = [
    {w:"抱抱", t:"給她一個抱抱"},
    {w:"請吃", t:"請她吃一頓"},
    {w:"乖乖", t:"叫她一聲乖乖"},
    {w:"買吃", t:"買一份她愛吃的給她"},
    {w:"想你", t:"跟她說一句想你"},
    {w:"傳話", t:"傳一句只給她的話"},
    {w:"語音", t:"傳一段語音給她"},
    {w:"陪聊", t:"陪她講十分鐘"},
    {w:"晚餐", t:"把今天的晚餐定下來"},
    {w:"晚安", t:"跟她說晚安"},
    {w:"誇她", t:"誇她一句"},
    {w:"照片", t:"傳一張照片給她"},
    {w:"驚喜", t:"給她一個小驚喜"},
    {w:"小事", t:"幫她做一件小事"},
    {w:"請喝", t:"請她喝一杯"},
    {w:"點餐", t:"幫她點好一餐"}
  ];
  const slice = 360 / tasks.length;
  const wheel = document.getElementById("wheel");
  const result = document.getElementById("wheelResult");
  const doneBtn = document.getElementById("wheelDone");
  const logEl = document.getElementById("wheelLog");
  const colors = ["#ff6b9d","#ffd6e7","#ff8fb3","#ffe4ec"];
  let log = [];
  try{ log = JSON.parse(localStorage.getItem("wheel-log") || "[]"); }catch(e){}
  if(!Array.isArray(log)) log = [];
  let pending = "";
  let writing = false;
  function saveLocal(){
    try{ localStorage.setItem("wheel-log", JSON.stringify(log)); }catch(e){}
  }
  function paintLog(){
    if(!logEl) return;
    const recent = log.slice(-6).map(function(x){ return x.t; });
    logEl.textContent = recent.length ? ("做完的：" + recent.join("、")) : "轉到一件，做完再按完成。下次打開還在。";
  }
  function remember(item){
    if(!item || !item.t || !item.at) return;
    if(log.some(function(x){ return x.at === item.at && x.t === item.t; })) return;
    log.push(item);
    log.sort(function(a,b){ return a.at - b.at; });
    if(log.length > 30) log = log.slice(-30);
  }
  paintLog();
  wheel.style.background = "conic-gradient(" + tasks.map(function(_, i){
    return colors[i % colors.length] + " " + (i*slice) + "deg " + ((i+1)*slice) + "deg";
  }).join(",") + ")";
  tasks.forEach((t,i)=>{
    const lab = document.createElement("div");
    lab.className = "wheel-label";
    lab.textContent = t.w;
    const deg = i*slice + slice/2;
    lab.style.transform = "rotate("+deg+"deg) translateY(-68px) rotate(-"+deg+"deg)";
    lab.style.fontSize = ".68rem";
    lab.style.width = "28px";
    lab.style.marginLeft = "-14px";
    lab.style.lineHeight = "1.1";
    wheel.appendChild(lab);
  });
  let angle = 0, spinning = false;
  document.getElementById("spinBtn").onclick = function(){
    if(spinning) return;
    spinning = true;
    pending = "";
    if(doneBtn) doneBtn.hidden = true;
    const idx = Math.floor(Math.random()*tasks.length);
    const targetMod = (360 - (idx*slice + slice/2)) % 360;
    const current = angle % 360;
    let delta = targetMod - current;
    if(delta < 0) delta += 360;
    angle += 360*5 + delta;
    wheel.style.transform = "rotate("+angle+"deg)";
    result.textContent = "轉動中...";
    setTimeout(() => {
      pending = tasks[idx].t;
      result.textContent = "要做的一件事： " + pending;
      if(doneBtn) doneBtn.hidden = false;
      spinning = false;
      localStorage.setItem("spinDone","1");
      if(typeof renderBadges === "function") renderBadges();
    }, 3300);
  };
  if(doneBtn) doneBtn.onclick = function(){
    if(!pending) return;
    const item = {t: pending, at: Date.now()};
    remember(item);
    saveLocal();
    writing = true;
    if(window.db) window.db.ref("wheelLog").set(log);
    writing = false;
    pending = "";
    doneBtn.hidden = true;
    result.textContent = "這件做完了";
    paintLog();
  };
  if(window._authReady){
    window._authReady.then(function(){
      if(!window.db) return;
      window.db.ref("wheelLog").on("value", function(s){
        if(writing) return;
        const v = s.val();
        const arr = Array.isArray(v) ? v : (v && typeof v === "object" ? Object.keys(v).map(function(k){ return v[k]; }) : null);
        if(!arr) return;
        const before = log.length;
        arr.forEach(remember);
        if(log.length !== before){
          saveLocal();
          paintLog();
        }
      });
    });
  }
})();

/* 3D 照片傾斜 */
document.querySelectorAll(".photo figure").forEach(el => {
  el.addEventListener("mousemove", e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left)/r.width - .5;
    const y = (e.clientY - r.top)/r.height - .5;
    el.style.transform = `perspective(600px) rotateY(${x*8}deg) rotateX(${-y*8}deg)`;
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
  });
});

/* 音樂：固定在分頁上方，播放和暫停都按得到 */
(function(){
  const bgm = document.getElementById("bgm");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  function mark(playing){
    if(playBtn) playBtn.classList.toggle("on", !playing);
    if(pauseBtn) pauseBtn.classList.toggle("on", playing);
  }
  if(playBtn) playBtn.onclick = function(e){
    e.preventDefault();
    e.stopPropagation();
    if(!bgm) return;
    const p = bgm.play();
    if(p && p.catch) p.catch(function(){});
    mark(true);
  };
  if(pauseBtn) pauseBtn.onclick = function(e){
    e.preventDefault();
    e.stopPropagation();
    if(!bgm) return;
    bgm.pause();
    mark(false);
  };
  if(bgm){
    bgm.addEventListener("play", function(){ mark(true); });
    bgm.addEventListener("pause", function(){ mark(false); });
  }
  mark(false);
})();

/* 🍜 今天吃什麼 */
const foods = ["海底撈 🍲","日式拉麵 🍜","義大利麵 🍝","韓式炸雞 🍗","夜市小吃 🍢","精緻甜點 🍰","麥當勞 🍔","小火鍋 🍲","壽司 🍣","燒烤 🍖","水餃 🥟","滷肉飯 🍚","牛肉麵 🍜","鹹酥雞 🍗","鬆餅 🥞","珍珠奶茶 🧋","雞肉飯 🍗","肉圓 🥟","蚵仔煎 🦪","臭豆腐 🍢","滷味 🍢","鍋燒意麵 🍜","陽春麵 🍜","乾麵加蛋 🍜","排骨便當 🍱","雞腿便當 🍱","壽喜燒 🍲","串燒 🍢","居酒屋 🍶","泰式打拋豬 🍛","越南河粉 🍜","海南雞飯 🍚","麻辣鍋 🌶️","石頭火鍋 🍲","薑母鴨 🍲","羊肉爐 🍲","炒飯 🍳","蛋包飯 🍳","披薩 🍕","漢堡 🍔","炸雞排 🍗","雞蛋糕 🍰","車輪餅 🥞","豆花 🍮","芋圓 🍠","刨冰 🍧","霜淇淋 🍦","可麗餅 🥞","早午餐 🥐","早餐店蛋餅 🥙","蘿蔔糕 🥟","燒餅油條 🥖","粥 🥣","廣東粥 🥣","小籠包 🥟","蒸餃 🥟","鍋貼 🥟","酸菜白肉鍋 🍲","韓式豆腐鍋 🍲","部隊鍋 🍲","石鍋拌飯 🍛","咖哩飯 🍛","豬排飯 🍱","鰻魚飯 🍱","丼飯 🍱","關東煮 🍢","鹽酥雞 🍗","地瓜球 🍠","雞湯 🥣","番茄牛肉麵 🍜","擔仔麵 🍜","炒碼麵 🍜","肉燥飯 🍚","控肉飯 🍚","鵝肉 🍗","薑汁番茄 🍅","熱炒 🥘","快炒店 🥘","自助餐 🍱","全家微波 🏪","自己煮飯 🍳"];
let foodSpinTimer = null;
document.getElementById("foodBtn").onclick = function(){
  const res = document.getElementById("foodResult");
  const btn = document.getElementById("foodBtn");
  if(foodSpinTimer){ clearInterval(foodSpinTimer); foodSpinTimer=null; btn.textContent="隨機抽"; return; }
  btn.textContent = "停止";
  let count = 0;
  foodSpinTimer = setInterval(()=>{
    res.textContent = foods[Math.floor(Math.random()*foods.length)];
    count++;
    if(count > 25){
      clearInterval(foodSpinTimer); foodSpinTimer=null; btn.textContent="隨機抽";
      localStorage.setItem("foodPick","1");
      const map = document.getElementById("foodMap");
      const plain = String(res.textContent || "").replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, "");
      if(map) map.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((plain || "餐廳") + " 附近");
      if(typeof renderBadges==="function") renderBadges();
    }
  }, 80);
};


document.getElementById("foodMap").addEventListener("click", function(e){
  e.preventDefault();
  const fallback = this.href;
  function openAt(lat, lng){
    const url = (lat != null) ? ("https://www.google.com/maps/search/" + encodeURIComponent("餐廳") + "/@" + lat + "," + lng + ",15z") : fallback;
    window.open(url, "_blank", "noopener");
  }
  if(!navigator.geolocation){ openAt(); return; }
  navigator.geolocation.getCurrentPosition(function(p){
    openAt(p.coords.latitude.toFixed(5), p.coords.longitude.toFixed(5));
  }, function(){ openAt(); }, {timeout:4000, maximumAge:120000});
});



/* 🔒 防偷窺：切換分頁時模糊 */
document.addEventListener("visibilitychange", function(){
  if(document.hidden){
    document.body.classList.add("privacy-blur");
  } else {
    document.body.classList.remove("privacy-blur");
  }
});


/* 小昀的口味、百度相簿、Y 的分身 */
(function(){
  const herFoods = ["麥當勞早餐","麥香雞","牛肉麵","排骨酥","鮭魚","提拉米蘇","泡麵","蘋果","星巴克","漢堡","壽司","滷味","鬆餅","布丁","蛋"];
  const usualFoods = ["麥當勞","泡麵","牛肉麵","星巴克","蘋果","漢堡","壽司","蛋","冰淇淋","早餐","甜點","滷味"];
  const cares = ["吃早餐了嗎","騎車慢一點，到家跟我說","今天想吃什麼","早安安，乖乖","先抱抱再講話"];
  const careEl = document.getElementById("herCare");
  if(careEl) careEl.textContent = cares[Math.floor(Date.now()/86400000) % cares.length];
  function fillFoods(id, list){
    const row = document.getElementById(id);
    if(!row) return;
    list.forEach(function(name){
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = name;
      b.onclick = function(){
        const res = document.getElementById("foodResult");
        if(res) res.textContent = name;
        localStorage.setItem("foodPick","1");
        if(typeof renderBadges === "function") renderBadges();
      };
      row.appendChild(b);
    });
  }
  fillFoods("herFoods", herFoods);
  fillFoods("likeFoods", herFoods);
  fillFoods("usualFoods", usualFoods);
  const foodUsual = document.getElementById("foodUsual");
  if(foodUsual){
    foodUsual.onclick = function(){
      document.getElementById("foodResult").textContent = usualFoods[Math.floor(Math.random()*usualFoods.length)];
      localStorage.setItem("foodPick","1");
      if(typeof renderBadges === "function") renderBadges();
    };
  }
  const foodHer = document.getElementById("foodHer");
  if(foodHer){
    foodHer.onclick = function(){
      document.getElementById("foodResult").textContent = herFoods[Math.floor(Math.random()*herFoods.length)];
      localStorage.setItem("foodPick","1");
      if(typeof renderBadges === "function") renderBadges();
    };
  }

  function memDb(){
    return new Promise(function(res, rej){
      const req = indexedDB.open("ynn-mem", 1);
      req.onupgradeneeded = function(){ req.result.createObjectStore("photos", {keyPath:"id"}); };
      req.onsuccess = function(){ res(req.result); };
      req.onerror = function(){ rej(req.error); };
    });
  }
  function addMemFigure(src, cap){
    if(window.noteLocalPhoto){ window.noteLocalPhoto(src, cap); return; }
    const wall = document.getElementById("wall");
    if(!wall) return;
    const fig = document.createElement("figure");
    fig.dataset.cap = cap;
    fig.dataset.full = src;
    const img = document.createElement("img");
    img.alt = cap;
    img.src = src;
    img.loading = "lazy";
    img.decoding = "async";
    const fc = document.createElement("figcaption");
    fc.textContent = cap;
    fig.appendChild(img);
    fig.appendChild(fc);
    wall.appendChild(fig);
  }
  function squeeze(file){
    return new Promise(function(res, rej){
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = function(){
        const max = 900;
        let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        const scale = Math.min(1, max / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const g = canvas.getContext("2d");
        if(!g){ URL.revokeObjectURL(url); rej(new Error("canvas")); return; }
        g.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        res(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = function(){ URL.revokeObjectURL(url); rej(new Error("image")); };
      img.src = url;
    });
  }
  memDb().then(function(db){
    const tx = db.transaction("photos", "readonly");
    const req = tx.objectStore("photos").getAll();
    req.onsuccess = function(){
      (req.result || []).forEach(function(item){ addMemFigure(item.src, item.cap || "我們的"); });
      if(window.bindWall) window.bindWall();
    };
  }).catch(function(){});
  const memInput = document.getElementById("memPhotos");
  if(memInput){
    memInput.addEventListener("change", function(){
      const all = Array.from(memInput.files || []).filter(function(f){ return f.type.indexOf("image/") === 0; });
      const files = all.slice(0, 80);
      const status = document.getElementById("baiduStatus");
      if(!files.length){ return; }
      if(status) status.textContent = all.length > files.length ? "一次先壓前 80 張，其餘再選一次" : "正在壓小…";
      memDb().then(async function(db){
        for(let i = 0; i < files.length; i++){
          if(status) status.textContent = "正在壓小 " + (i+1) + "/" + files.length;
          const src = await squeeze(files[i]);
          const item = {id: Date.now() + "-" + i, src: src, cap: "我們的"};
          await new Promise(function(res, rej){
            const tx = db.transaction("photos", "readwrite");
            tx.objectStore("photos").put(item);
            tx.oncomplete = function(){ res(); };
            tx.onerror = function(){ rej(tx.error); };
          });
          addMemFigure(src, "我們的");
        }
        if(window.bindWall) window.bindWall();
        if(status) status.textContent = "加好了，在上面的照片牆。只存在這台手機。";
        memInput.value = "";
      }).catch(function(){
        if(status) status.textContent = "這張沒加上，換小一點的照片再試";
      });
    });
  }

  function showPane(which){
    const clone = document.getElementById("clonePane");
    const bp = document.getElementById("bpPane");
    const a = document.getElementById("pickClone");
    const b = document.getElementById("pickBp");
    if(!clone || !bp) return;
    clone.hidden = which !== "clone";
    bp.hidden = which !== "bp";
    if(a) a.style.background = which==="clone" ? "#e91e63" : "";
    if(a) a.style.color = which==="clone" ? "#fff" : "";
    if(b) b.style.background = which==="bp" ? "#e91e63" : "";
    if(b) b.style.color = which==="bp" ? "#fff" : "";
    try{ localStorage.setItem("whoTalk", which); }catch(e){}
  }
  const pickClone = document.getElementById("pickClone");
  const pickBp = document.getElementById("pickBp");
  if(pickClone) pickClone.onclick = function(){ showPane("clone"); };
  if(pickBp) pickBp.onclick = function(){ showPane("bp"); };
  let saved = "clone";
  try{ saved = localStorage.getItem("whoTalk") || "clone"; }catch(e){}
  showPane(saved === "bp" ? "bp" : "clone");

  const openBp = document.getElementById("openBp");
  if(openBp){
    openBp.onclick = function(){
      const status = document.getElementById("bpStatus");
      tameBp();
      if(window.botpress && typeof window.botpress.open === "function"){
        window.botpress.open();
        if(status) status.textContent = "";
      } else if(status){
        status.textContent = "背後靈還在載入，等一下或看左邊藍色按鈕";
      }
    };
  }

  function tameBp(){
    const kids = document.body ? document.body.children : [];
    for(let i = 0; i < kids.length; i++){
      const el = kids[i];
      const mark = String(el.id || "") + " " + String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className || "");
      if(!/bp|botpress/i.test(mark)) continue;
      const r = el.getBoundingClientRect();
      if(r.width > window.innerWidth * 0.7 && r.height > window.innerHeight * 0.7){
        el.style.pointerEvents = "none";
      }
    }
    document.querySelectorAll(".bpFabWrapper, .bpWebchat, .bpMessagePreview, .bpFABMessagePreview").forEach(function(el){
      el.style.pointerEvents = "auto";
    });
  }
  tameBp();
  let bpTick = 0;
  new MutationObserver(function(){
    if(bpTick) return;
    bpTick = requestAnimationFrame(function(){ bpTick = 0; tameBp(); });
  }).observe(document.documentElement, {childList:true, subtree:true});

  function reply(q){
    const s = q.trim();
    if(!s) return "";
    const rules = [
      [/椒麻/, "椒麻不要。換別的"],
      [/吃了沒|吃飯了沒|吃飽|吃了嗎|餓|早餐|午餐|晚餐|宵夜|麥當勞|奶茶|壽司|火鍋|拉麵|便當/, "吃了嗎寶寶。想吃什麼跟我說"],
      [/想你|想妳|想我/, "我也想你"],
      [/愛你|愛妳|喜歡你|喜歡妳/, "我也愛你寶寶"],
      [/到家|回來了|我到了|平安|下樓|出門了/, "到家就好。我愛你"],
      [/早安|早啊|起床/, "早安安。早餐吃了沒"],
      [/晚安|睡了|想睡|好睏|睏了/, "晚安寶寶。抱抱"],
      [/對不起|抱歉|我錯了/, "沒關係。我在"],
      [/生氣|吵架|不爽|不理我/, "先不要氣。我在"],
      [/好累|好痛|不舒服|生病|累死/, "先休息。我在"],
      [/在幹嘛|在干嘛|在嗎|在嘛|做什麼|在不在/, "在。想你"],
      [/哈哈|笑死|好好笑|XD|xd|呵呵/, "哈哈哈哈哈"],
      [/騎車|開車|機車|慢一點|小心/, "慢一點。到家說一聲"],
      [/上課|上班|考試|功課|學校|下班|開會/, "加油寶寶。我等你"],
      [/好看|好可愛|漂亮|好帥/, "本來就好看"],
      [/笨蛋|傻瓜/, "才不是。我喜歡你"],
      [/乖乖|寶寶|老婆|寶貝/, "嗯。我在"],
      [/嗯+|好哦|好喔|好呀|好啊|知道了|收到|OK|ok|好滴/, "嗯。我愛你寶寶"],
      [/忙|等一下|等等|待會/, "好。忙完找我"],
      [/冷|好熱|下雨|風大/, "外套穿了沒"],
      [/照片|自拍|拍給/, "傳給我看"],
      [/多少錢|好貴|想買/, "想要就跟我說"],
      [/誰|別人/, "我只看你"],
      [/[？?]$|嗎$/, "你說。我在聽"]
    ];
    for(let i = 0; i < rules.length; i++){
      if(rules[i][0].test(s)) return rules[i][1];
    }
    if(s.length <= 2) return "嗯。然後呢";
    if(s.length <= 8) return "我看到了";
    return "我在。你繼續說";
  }

  function ask(){
    const q = input.value.trim();
    if(!q) return;
    input.value = "";
    bubble(true, q);
    setTimeout(function(){ bubble(false, reply(q)); }, 280);
  }
  const input = document.getElementById("botInput");
  const send = document.getElementById("botSend");
  const log = document.getElementById("botLog");
  function bubble(mine, text){
    if(!log) return;
    const row = document.createElement("div");
    row.className = "bot-line " + (mine ? "me" : "them");
    row.textContent = text;
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }
  if(send && input){
    send.onclick = ask;
    input.addEventListener("keydown", function(e){ if(e.key === "Enter") ask(); });
    bubble(false, "在。想說什麼");
  }
})();
