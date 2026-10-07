/* 主程式。初始化與各功能分開，單一功能失敗只記錯誤、不中斷其他功能。 */
(function boot(){
  if(!window.firebase){ Guard.push("Boot", "Firebase 沒載入", ""); return; }
  firebase.initializeApp(window.APP_CONFIG.firebase);
  window.db = firebase.database();
  window.uid = null;
  window._authResolve = null;
  window._authReady = new Promise(res => { window._authResolve = res; });
  firebase.auth().onAuthStateChanged(u => { if(u && u.uid) window.uid = u.uid; });
  try{
    firebase.database().ref(".info/connected").on("value", s => {
      if(s.val() === false) Guard.push("Net", "即時資料庫離線，會自動重連", "", true);
    });
  }catch(e){ Guard.push("Net", "連線監聽失敗", e.message); }
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
  window.uid = window.uid || ("local-"+pendingRole);
  if(window._authResolve){ window._authResolve(window.uid); window._authResolve = null; }
  enterApp();
  firebase.auth().signInWithEmailAndPassword(ROLES[pendingRole].email, window.APP_CONFIG.dbPass)
    .then(u => { window.uid = u.user.uid; })
    .catch(e => { if(window.Guard) Guard.push("Auth", "雲端登入失敗，頁面仍可使用", e.code||e.message); });
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
  ["couple_helmet.jpg","兩個安全帽"],
  ["date_dessert.jpg","兩碗甜點"],
  ["trip_hotel.jpg","礁溪老爺"],
  ["couple_crown.jpg","公主與魔杖"],
  ["cinnamoroll.jpg","玉桂狗聯名"],
  ["giant_icecream.jpg","她變成冰淇淋"],
  ["icecream_selfie.jpg","張大嘴吃冰"],
  ["her_selfie1.jpg","她的自拍"],
  ["her_selfie2.jpg","再一張"],
  ["her_selfie3.jpg","看鏡頭"],
  ["her_selfie4.jpg","今天的她"],
  ["red_umbrella.jpg","星巴克前面"],
  ["IMG_5576.jpg","笑到肚子痛"],
  ["IMG_6957.jpg","最可愛的一張"]
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
function wallFigs(){ return Array.from(document.querySelectorAll("#wall figure")); }
const lb = document.getElementById("lb");
let lbI = 0;
function openLB(i){ lbI = i; showLB(); lb.classList.add("open"); }
function showLB(){
  const figs = wallFigs();
  const f = figs[lbI];
  if(!f) return;
  document.getElementById("lbImg").src = f.querySelector("img").src;
  document.getElementById("lbCap").textContent = (f.dataset.cap || "") + "  (" + (lbI+1) + "/" + figs.length + ")";
}
function bindWall(){
  wallFigs().forEach((f,i) => { f.onclick = () => openLB(i); });
}
bindWall();
window.bindWall = bindWall;
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
  const f = pool[Math.floor(Math.random()*pool.length)];
  document.getElementById("mystImg").src = f.querySelector("img").src;
  document.getElementById("mystQ").textContent = f.dataset.cap + " — " + lines[Math.floor(Math.random()*lines.length)];
  this.classList.add("flipped");
  setTimeout(() => this.classList.remove("flipped"), 4000);
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
  const msgs = ["今天也很喜歡妳","抱抱","想牽手","吃飽了沒","妳最好看","愛妳","不要生氣","快睡覺","想妳了","可愛","么么","心動","寶貝","滾進來睡","不要走","我在","餓不餓","冷不冷","想見妳","妳好漂亮","抱緊一點","不要不理我","晚安","早安","今天也要愛妳","別熬夜","乖乖吃飯","我只想陪妳","妳是我的","愛妳愛妳","喝水了沒","今天辛苦妳了","好想蹭妳","手給我","別亂花錢","外套穿了沒","到家跟我說","想聞妳頭髮","妳在干嘛","想捏妳臉","別刷手機了睡覺","今晚夢裡見","愛妳到月亮","不要減肥","妳瘦了嗎","想從背後抱妳","今天也超愛","隨便啦我養妳","不要跟別人太好","我這輩子認真的","餓了說一聲","委屈就跟我說","妳講什麼都好聽","想帶妳去海邊","週末陪我","別哭喔","看到好吃的都想到妳","妳打呼我也愛","早安寶貝","晚安小愛人","今天的風很好想妳","手機快沒電也要想妳","妳說好就好","我都聽妳的","不許跟我說再見","想把妳藏起來","妳開心我就開心","有妳真好","今天想抱妳很久","妳是我的小太陽","不要一個人扛","我永遠站妳這邊","愛妳不是三分鐘熱度","想吃妳做的飯","想幫妳吹頭髮","冬天一起躲被窩","夏天一起吃冰","未來每天都要有妳","妳講的笑話最好笑","妳生氣也可愛","想牽妳去散步","睡前要鬧一下","醒來第一個想妳","別把我吃太快","我是妳的專屬靠墊","想跟妳窩一整天","不管怎樣我都在","喜歡妳的壞習慣","愛妳的全部"];
  document.getElementById("scratchMsg").textContent = msgs[Math.floor(Math.random()*msgs.length)];
}
window.addEventListener("load", () => setTimeout(initScratch, 300));

/* 翻牌 */
(function(){
  const ps = ["couple_helmet.jpg","date_dessert.jpg","trip_hotel.jpg","couple_crown.jpg","cinnamoroll.jpg","giant_icecream.jpg"];
  const deck = [...ps, ...ps].sort(() => Math.random()-0.5);
  const g = document.getElementById("memGrid");
  let first = null, lock = false, mat = 0;
  deck.forEach(src => {
    const card = document.createElement("div");
    card.className = "mem-card";
    card.innerHTML = `<div class="mem-inner"><div class="mem-front">?</div><div class="mem-back"><img loading="lazy" src="${src}"></div></div>`;
    card.onclick = () => {
      if(lock || card.classList.contains("flipped") || card.classList.contains("matched")) return;
      card.classList.add("flipped");
      if(!first){ first = card; return; }
      lock = true;
      const ok = first.querySelector("img").src === card.querySelector("img").src;
      setTimeout(() => {
        if(ok){
          first.classList.add("matched"); card.classList.add("matched");
          mat++;
          if(mat === ps.length) document.getElementById("memStat").textContent = "全部配對成功！妳好聰明 ❤️";
        } else {
          first.classList.remove("flipped"); card.classList.remove("flipped");
        }
        first = null; lock = false;
      }, 600);
    };
    g.appendChild(card);
  });
})();

/* 愛情指數 */
document.getElementById("meterBtn").onclick = () => {
  const n = 95 + Math.floor(Math.random()*6);
  document.getElementById("meterNum").textContent = n + "%";
  document.getElementById("meterFill").style.width = n + "%";
  document.getElementById("meterMsg").textContent = n >= 98 ? "滿分！妳們註定在一起 ❤️" : "很高！繼續下去就滿分了";
  localStorage.setItem("meterDone","1");
  renderBadges();
};

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
    "旅行": ["一起看海","一起去日本","一起去迪士尼","一起騎車環島","一起泡溫泉","一起去海邊看日出","一起去海邊游泳","一起賞楓","一起賞櫻花","一起去冰山","一起露營","一起住小木屋"],
    "吃": ["一起吃壽司","一起做蛋糕","一起做飯","一起逛夜市"],
    "玩": ["一起看煙火","一起看演唱會","一起看一輝的演唱會","一起去遊樂園","一起玩雲霄飛車","一起看流星雨","一起去逛街","一起去貓咪咖啡廳","一起拍大頭貼","一起拍情侶照","一起買情侶裝"],
    "日常": ["一起跨年","一起養一隻貓","一起養隻狗","一起種植物","一起組電腦","一起打電動","一起看恐怖片","一起過生日","一起交換禮物","一起養老"]
  };
  const legacy = ["一起看海","一起跨年","一起去日本","一起養一隻貓","一起做飯","一起露營","一起拍情侶照","一起看煙火","一起養老","一起去迪士尼","一起泡溫泉","一起騎車環島","一起看演唱會","一起種植物","一起組電腦","一起去海邊看日出","一起做蛋糕","一起養隻狗","一起去冰山","一起住小木屋","一起玩雲霄飛車","一起看流星雨","一起逛夜市","一起買情侶裝","一起去貓咪咖啡廳","一起去海邊游泳","一起賞楓","一起拍大頭貼","一起去遊樂園","一起看一輝的演唱會","一起吃壽司","一起去逛街","一起打電動","一起看恐怖片","一起過生日","一起交換禮物","一起賞櫻花"];
  const wishes = Object.values(groups).flat();
  const list = document.getElementById("wishList");
  const filters = document.getElementById("wishFilters");
  if(!list || !filters) return;
  function paint(done){
    const current = window._wishFilter || "全部";
    filters.innerHTML = "";
    ["全部", ...Object.keys(groups)].forEach(name => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = name;
      b.style.cssText = "border:1px solid #ffb3c8;border-radius:999px;padding:6px 12px;background:"+(name===current?"#e91e63":"#fff")+";color:"+(name===current?"#fff":"#e91e63")+";font-family:inherit";
      b.onclick = function(){ window._wishFilter = name; paint(done); };
      filters.appendChild(b);
    });
    list.innerHTML = "";
    const head = document.createElement("div");
    head.style.cssText = "text-align:center;color:#e91e63;font-size:.85rem;margin-bottom:8px";
    head.textContent = "完成 " + done.length + " / " + wishes.length;
    list.appendChild(head);
    Object.entries(groups).forEach(function(entry){
      const group = entry[0], items = entry[1];
      if(current !== "全部" && current !== group) return;
      const title = document.createElement("div");
      title.style.cssText = "margin:12px 0 6px;font-size:.8rem;letter-spacing:2px;color:#c06";
      title.textContent = group;
      list.appendChild(title);
      items.forEach(function(w){
        const isDone = done.indexOf(w) >= 0;
        const d = document.createElement("div");
        d.className = "wish-item" + (isDone?" done":"");
        d.innerHTML = '<input type="checkbox"'+(isDone?" checked":"")+'> <span></span>';
        d.querySelector("span").textContent = w;
        d.querySelector("input").onchange = function(){
          let s = done.filter(function(x){ return wishes.indexOf(x) >= 0; });
          if(this.checked) s.push(w); else s = s.filter(function(x){ return x !== w; });
          s = Array.from(new Set(s));
          try{ localStorage.setItem("wishes-done", JSON.stringify(s)); }catch(e){}
          if(window.db) window.db.ref("wishes/state").set({done:s}).catch(function(){});
          paint(s);
        };
        list.appendChild(d);
      });
    });
  }
  let local = [];
  try{ local = JSON.parse(localStorage.getItem("wishes-done") || "[]"); }catch(e){ local = []; }
  if(!Array.isArray(local)) local = [];
  paint(local);
  if(window._wishBound || !window._authReady) return;
  window._wishBound = true;
  window._authReady.then(function(){
    if(!window.db) return;
    window.db.ref("wishes/state").on("value", function(doc){
      const raw = doc.exists() && doc.val() ? doc.val().done || [] : [];
      const done = raw.map(function(x){ return typeof x === "number" ? legacy[x] : x; }).filter(Boolean);
      try{ localStorage.setItem("wishes-done", JSON.stringify(done)); }catch(e){}
      paint(done);
    });
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

/* 每日戀愛默契：台北時間凌晨換題，兩邊都答完才揭曉 */
(function(){
  const qs = [
    "對方最吸引你的地方？","如果今天只能傳一句話給我，你會說什麼？","我做過最讓你心動的小事？",
    "你覺得我生氣的時候，該怎麼哄？","我們的關係用一種食物形容？","這週最想一起做的事？",
    "你最常想起我的哪個瞬間？","如果現在傳送到對方身邊，第一句話是？","我哪個稱呼你最喜歡？",
    "吵架之後，你其實最需要什麼？","你心裡的完美約會是哪一種？","現在最想吃的那一口是什麼？",
    "如果我只能改一個地方，你希望是？","你什麼時候確定喜歡我的？","我們以後的家裡一定要有什麼？",
    "你覺得我還不了解你的哪一面？","今天最想被我怎麼對待？","我哪次沒有即時回你，你其實在想什麼？",
    "如果只能留一件我們的回憶？","你想被我記住的一個小習慣？","第一次見面，你覺得我是什麼樣的人？",
    "什麼時候最想被我抱一下？","你覺得我們最像的地方？","下次見面，第一件想做的事？",
    "我說過哪句話讓你記到現在？","如果給今天的我們打分，為什麼？","你悶悶的時候，希望我做什麼？",
    "我們最適合一起浪費的一個下午？","你最喜歡我看著你的哪一種時候？","如果明天放假，想跟我去吃什麼？",
    "你覺得我偷偷在意你的哪件事？","哪一個季節最像我們？","你想跟我一起學會的事？",
    "我讓你覺得被照顧到的一次？","你不想讓別人知道、只想跟我說的話？","如果可以重來一天，你想重過哪一天？",
    "你覺得我笑起來的時候像什麼？","我們之間只有我們懂的一個笑話？","你希望我以後一直叫你什麼？",
    "現在的心情，用一種甜點形容？","如果我晚回家，你希望我先傳什麼？","你最想跟我去的一個地方？",
    "我哪裡讓你覺得可以靠過來？","今天有沒有一個瞬間突然想我？","你想一起完成、但還沒做的事？",
    "如果只能選一個，抱抱還是親親？","你覺得我最不像話、但你還是喜歡的點？","我們認識之前，你以為戀愛是什麼？",
    "現在最想聽到我說的一句話？","如果把我放進你的一天，你會把我安在哪裡？"
  ];
  function taipeiParts(){
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Taipei", year:"numeric", month:"2-digit", day:"2-digit",
      hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23"
    }).formatToParts(new Date());
  }
  function part(list, type){ return Number(list.find(function(p){ return p.type === type; }).value); }
  function dayKey(){
    const list = taipeiParts();
    const y = part(list, "year"), m = part(list, "month"), d = part(list, "day");
    return y + "-" + String(m).padStart(2,"0") + "-" + String(d).padStart(2,"0");
  }
  function dayIndex(){
    const list = taipeiParts();
    return Math.floor(Date.UTC(part(list,"year"), part(list,"month")-1, part(list,"day")) / 86400000);
  }
  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){ return "&#" + c.charCodeAt(0) + ";"; });
  }
  let audioCtx = null;
  function arm(){
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    if(!audioCtx) audioCtx = new AC();
    if(audioCtx.state === "suspended") audioCtx.resume();
  }
  function ding(){
    if(!audioCtx) return;
    const t0 = audioCtx.currentTime;
    [880, 1320].forEach(function(freq, i){
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      const start = t0 + i * 0.12;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(start); o.stop(start + 0.3);
    });
  }
  document.addEventListener("pointerdown", arm, { once: true });

  const qEl = document.getElementById("dailyQ");
  const box = document.getElementById("dailyAnswers");
  const lock = document.getElementById("dailyLock");
  const card = document.getElementById("dailyCard");
  let currentKey = dayKey();
  qEl.textContent = qs[dayIndex() % qs.length];
  let ref = null;
  let firstPaint = true;
  let wasBoth = false;

  function paint(val){
    if(!box) return;
    const mine = window.myRole;
    const y = val && val.y && val.y.text;
    const u = val && val.yun && val.yun.text;
    const both = !!(y && u);
    function row(k, text){
      const names = { y: "Y", yun: "小昀" };
      let body = "還沒回答";
      if(text){
        if(both || mine === k) body = esc(text);
        else body = "寫好了，先保密";
      }
      return '<div class="daily-row"><b>' + names[k] + '</b><span>' + body + '</span></div>';
    }
    box.innerHTML = row("y", y) + row("yun", u);
    if(lock) lock.textContent = both ? "叮。兩邊都答了。" : "還差一個人，答完才看得到對方。";
    if(card) card.classList.toggle("revealed", both);
    if(both && !wasBoth && !firstPaint) ding();
    wasBoth = both;
    firstPaint = false;
  }

  function listen(){
    if(!window.db) return;
    if(ref) ref.off();
    firstPaint = true;
    wasBoth = false;
    currentKey = dayKey();
    qEl.textContent = qs[dayIndex() % qs.length];
    ref = db.ref("daily/" + currentKey);
    ref.on("value", function(s){ paint(s.val() || {}); });
    const send = document.getElementById("dailySend");
    const input = document.getElementById("dailyInput");
    send.onclick = function(){
      arm();
      const text = input.value.trim();
      if(!text || !window.myRole) return;
      ref.child(window.myRole).set({ text: text, time: Date.now() });
      input.value = "";
    };
  }

  window._authReady.then(listen);
  const parts = taipeiParts();
  const left = 86400 - (part(parts,"hour")*3600 + part(parts,"minute")*60 + part(parts,"second"));
  setTimeout(function(){ listen(); }, left * 1000 + 800);

  document.getElementById("dailyInput").addEventListener("keydown", function(e){
    if(e.key === "Enter") document.getElementById("dailySend").click();
  });
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
    {date:"2025/07/19", lines:[["yun","你在就好了"],["yun","我好想你"],["Y","除非裡面有布丁"]]}
  ];
  const topics0 = [["寶寶",1894],["愛你",711],["好吃",663],["想你",544],["我愛你",437],["回家",393],["想吃",359],["睡覺",350],["對不起",271],["北鼻",244],["討厭",233],["生氣",212],["抱抱",181],["寶貝",178],["吃飯",156],["乖乖",146],["老婆",140],["上課",132],["早安",116],["吵架",91],["晚安",80],["和好",43]];
  const box = document.getElementById("chatToday");
  const meta = document.getElementById("chatMeta");
  let pool = convos;
  let n = Math.floor(Date.now()/86400000) % pool.length;
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
  document.getElementById("chatNext").onclick = function(){
    n = (n + 1 + Math.floor(Math.random()*3)) % pool.length;
    show();
  };
  show();

  const bars = document.getElementById("talkBars");
  function drawBars(list){
    const max = list[0] ? list[0][1] : 1;
    bars.innerHTML = list.map(function(row){
      const w = Math.max(6, Math.round(row[1]/max*100));
      return '<div class="talk-row"><b>'+esc(row[0])+'</b><div class="talk-bar"><i style="width:'+w+'%"></i></div><span>'+row[1]+'</span></div>';
    }).join("");
  }
  drawBars(topics0);
  const story = document.getElementById("talkStory");
  if(story){
    story.textContent = "114,248 則訊息。小昀講得比較多，62,337 則，Y 是 51,911 則。照片 12,126 張、貼圖 4,199 個、語音 687 則，最常在晚上 10 點。\n聊最多的是叫對方寶寶、說愛、好不好吃、想你、回家有沒有到。也會吵：對不起 271 次、討厭 233、生氣 212、吵架 91，然後和好 43 次。旁邊還有上課、考試、貓狗、麥當勞。";
  }

  const keys = ["寶寶","愛你","好吃","想你","我愛你","回家","想吃","睡覺","對不起","北鼻","討厭","生氣","抱抱","寶貝","吃飯","乖乖","老婆","上課","早安","吵架","晚安","和好","麥當勞","星巴克"];
  document.getElementById("talkFile").addEventListener("change", function(){
    const file = this.files && this.files[0];
    const status = document.getElementById("talkStatus");
    if(!file) return;
    status.textContent = "在這台手機上算…";
    const reader = new FileReader();
    reader.onload = function(){
      const raw = String(reader.result || "");
      const lines = raw.split(/\r?\n/);
      let y = 0, yun = 0, photos = 0, date = "", days = {};
      const hit = {};
      keys.forEach(function(k){ hit[k] = 0; });
      const hours = new Array(24).fill(0);
      const fresh = [];
      let buf = [];
      function flush(){
        if(buf.length < 2) { buf = []; return; }
        const who = {};
        buf.forEach(function(m){ who[m[0]] = 1; });
        if(who.Y && who.yun) fresh.push({date: buf[0][2], lines: buf.map(function(m){ return [m[0], m[1]]; })});
        buf = [];
      }
      lines.forEach(function(line){
        const d = line.match(/^(\d{4}\/\d{2}\/\d{2})/);
        if(d && line.indexOf("（") >= 0){ date = d[1]; days[date] = 1; flush(); return; }
        const m = line.match(/^(上午|下午)(\d{2}:\d{2})\t(.+?)\t(.*)$/);
        if(!m) return;
        const who = m[3] === "Y" ? "Y" : "yun";
        const body = (m[4] || "").trim();
        if(who === "Y") y++; else yun++;
        if(body.indexOf("[照片]") === 0) photos++;
        let hh = parseInt(m[2], 10);
        if(m[1] === "下午" && hh < 12) hh += 12;
        if(m[1] === "上午" && hh === 12) hh = 0;
        hours[hh]++;
        if(!body || body.charAt(0) === "[" || body.indexOf("http") === 0 || body.charAt(0) === "☎") return;
        if(/密碼|鍵位|邀請碼|去死|分手/.test(body)) return;
        keys.forEach(function(k){ if(body.indexOf(k) >= 0) hit[k]++; });
        if(body.length >= 2 && body.length <= 36 && !/http|密碼|鍵位|去死|分手|操|逼/.test(body)){
          buf.push([who, body, date]);
          if(buf.length >= 4) flush();
        } else flush();
      });
      flush();
      const list = keys.map(function(k){ return [k, hit[k]||0]; }).filter(function(r){ return r[1] > 0; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,16);
      if(list.length) drawBars(list);
      let peak = 0;
      hours.forEach(function(v,i){ if(v > hours[peak]) peak = i; });
      document.getElementById("talkWhen").textContent = "這份最常在 " + peak + " 點傳訊息。";
      document.getElementById("talkCounts").innerHTML =
        "<span>Y "+y.toLocaleString()+" 則</span><span>小昀 "+yun.toLocaleString()+" 則</span><span>照片 "+photos.toLocaleString()+" 張</span><span>"+Object.keys(days).length+" 天</span>";
      if(fresh.length){
        pool = fresh.slice(0, 80);
        n = 0;
        show();
      }
      status.textContent = "算完了，只留在這台手機。";
    };
    reader.readAsText(file);
  });
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

  document.getElementById("meetBtn").onclick = function(){
    const d = document.getElementById("meetDate").value;
    if(d) db.ref("settings/meetDate").set({date: d});
  };
  document.getElementById("meetDel").onclick = function(){
    db.ref("settings/meetDate").remove();
  };
  db.ref("settings/meetDate").on("value", doc => {
    const el = document.getElementById("countdown");
    if(!doc.exists() || !doc.val() || !doc.val().date){ el.textContent = "還沒設定"; return; }
    const t = new Date(doc.val().date);
    const days = Math.ceil((t - new Date())/86400000);
    el.textContent = days <= 0 ? "就是今天！🎉" : "再 " + days + " 天";
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
      html += `<div style="background:rgba(255,255,255,.65);backdrop-filter:blur(20px);border-radius:16px;padding:12px;margin:8px 0;display:flex;justify-content:space-between;align-items:center">
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

/* 誰先睡 */
window._authReady.then(function(uid){
  document.getElementById("sleepBtn").onclick = function(){
    db.ref("sleep/"+new Date().toDateString()+"/"+uid).set(new Date().toLocaleTimeString("zh-TW"));
  };
  db.ref("sleep/"+new Date().toDateString()).on("value", doc => {
    const el = document.getElementById("sleepStatus");
    if(!doc.exists()){ el.textContent = "還沒人睡"; return; }
    const d = doc.val() || {};
    const me = d[uid], her = d[Object.keys(d).find(k => k !== uid)];
    if(me && her){
      el.textContent = me < her ? "你先睡了 🌙" : ((window.themName||"她") + "先睡了 😴");
    } else if(me){ el.textContent = "你說了晚安，等她..."; }
    else if(her){ el.textContent = (window.themName||"她") + "先說晚安了！"; }
    else { el.textContent = "還沒人睡"; }
  });
});

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
    const t = e.touches ? e.touches[0] : e;
    return {x: (t.clientX-r.left)*canvas.width/r.width, y: (t.clientY-r.top)*canvas.height/r.height};
  }
  function stroke(ctx, from, to, color){
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.stroke();
  }

  // 我的画板
  myCanvas.onmousedown = e => {
    myDrawing = true;
    lastPt = pos(myCanvas, e);
    db.ref("draw/"+uid).push({t:'start', x:lastPt.x, y:lastPt.y});
  };
  myCanvas.onmousemove = e => {
    if(!myDrawing) return;
    const p = pos(myCanvas, e);
    stroke(myCtx, lastPt, p, "#e91e63");
    db.ref("draw/"+uid).push({t:'move', x:p.x, y:p.y});
    lastPt = p;
  };
  myCanvas.onmouseup = () => {
    myDrawing = false;
    db.ref("draw/"+uid).push({t:'end'});
  };
  myCanvas.ontouchstart = e => {
    myDrawing = true;
    const p = pos(myCanvas, e);
    lastPt = p;
    db.ref("draw/"+uid).push({t:'start', x:p.x, y:p.y});
  };
  myCanvas.ontouchmove = e => {
    if(!myDrawing) return;
    e.preventDefault();
    const p = pos(myCanvas, e);
    stroke(myCtx, lastPt, p, "#e91e63");
    db.ref("draw/"+uid).push({t:'move', x:p.x, y:p.y});
    lastPt = p;
  };
  myCanvas.ontouchend = () => {
    myDrawing = false;
    db.ref("draw/"+uid).push({t:'end'});
  };

  document.getElementById("clearMyDraw").onclick = () => {
    myCtx.clearRect(0,0,myCanvas.width,myCanvas.height);
    db.ref("draw/"+uid).push({t:'clear'});
  };

  // 对方画板：监听对方 uid 的笔迹流
  const themRef = db.ref("draw").orderByKey().limitToLast(1);
  // 找对方 uid：监听所有 draw 下的 key
  db.ref("draw").on("child_added", snap => {
    const otherUid = snap.key;
    if(otherUid === uid) return;
    document.getElementById("herDrawLabel").textContent = (window.themName||"她") + "的畫板";
    herCtx.clearRect(0,0,herCanvas.width,herCanvas.height);
    // 回放对方已有笔迹
    snap.ref.on("child_added", s => {
      const ev = s.val();
      if(ev.t === 'start'){
        herCtx.beginPath();
        herCtx.moveTo(ev.x, ev.y);
        herDrawing = true;
        lastHer = ev;
      } else if(ev.t === 'move' && herDrawing){
        stroke(herCtx, lastHer, ev, "#673ab7");
        lastHer = ev;
      } else if(ev.t === 'end'){
        herDrawing = false;
      } else if(ev.t === 'clear'){
        herCtx.clearRect(0,0,herCanvas.width,herCanvas.height);
      }
    });
  });
  let lastHer = null;
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

/* 彈幕手動發送 */
document.getElementById("dmSend").onclick = function(){
  const v = document.getElementById("dmInput").value.trim();
  if(!v) return;
  const layer = document.getElementById("dmLayer");
  const el = document.createElement("div");
  el.className = "danmaku";
  el.textContent = v;
  el.style.top = (10 + Math.random()*80) + "%";
  el.style.animationDuration = "6s";
  el.style.fontSize = "1.2rem";
  el.style.color = "#e91e63";
  layer.appendChild(el);
  setTimeout(() => el.remove(), 8000);
  document.getElementById("dmInput").value = "";
};
document.getElementById("dmInput").addEventListener("keydown", e => {
  if(e.key === "Enter") document.getElementById("dmSend").click();
});

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

/* 彈幕 */
(function(){
  const layer = document.getElementById("dmLayer");
  const msgs = [
    "我愛妳 ❤️", "想妳了", "笨蛋", "抱抱", "可愛死了",
    "今天也喜歡妳", "不要走", "妳最可愛", "么么", "心動",
    "寶貝", "想牽妳", "別餓肚子", "晚安", "早安",
    "妳是我的", "滾進來睡", "愛妳愛妳愛妳", "想見妳", "妳好漂亮"
  ];
  let i = 0;
  function shoot(){
    const el = document.createElement("div");
    el.className = "danmaku";
    el.textContent = msgs[i % msgs.length];
    el.style.top = (10 + Math.random()*80) + "%";
    el.style.animationDuration = (8 + Math.random()*6) + "s";
    el.style.fontSize = (0.9 + Math.random()*0.6) + "rem";
    layer.appendChild(el);
    setTimeout(() => el.remove(), 15000);
    i++;
  }
  setTimeout(() => setInterval(shoot, 2500), 3000);
})();

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
  const tasks = ["抱抱她","問她吃了沒","叫她乖乖","買她愛吃的","講一句想妳","到家報備","親她一下","騎車慢一點"];
  const slice = 360 / tasks.length;
  const wheel = document.getElementById("wheel");
  const result = document.getElementById("wheelResult");
  const colors = ["#ff6b9d","#ffd6e7","#ff8fb3","#ffe4ec"];
  wheel.style.background = "conic-gradient(" + tasks.map(function(_, i){
    return colors[i % colors.length] + " " + (i*slice) + "deg " + ((i+1)*slice) + "deg";
  }).join(",") + ")";
  tasks.forEach((t,i)=>{
    const lab = document.createElement("div");
    lab.className = "wheel-label";
    lab.textContent = t;
    const deg = i*slice + slice/2;
    lab.style.transform = "rotate("+deg+"deg) translateY(-62px) rotate(-"+deg+"deg)";
    lab.style.fontSize = ".62rem";
    lab.style.width = "64px";
    lab.style.marginLeft = "-32px";
    wheel.appendChild(lab);
  });
  let angle = 0, spinning = false;
  document.getElementById("spinBtn").onclick = function(){
    if(spinning) return;
    spinning = true;
    const idx = Math.floor(Math.random()*tasks.length);
    const targetMod = (360 - (idx*slice + slice/2)) % 360;
    const current = angle % 360;
    let delta = targetMod - current;
    if(delta < 0) delta += 360;
    angle += 360*5 + delta;
    wheel.style.transform = "rotate("+angle+"deg)";
    result.textContent = "轉動中...";
    setTimeout(() => {
      result.textContent = "今天的任務： " + tasks[idx];
      spinning = false;
      localStorage.setItem("spinDone","1");
      if(typeof renderBadges === "function") renderBadges();
    }, 3300);
  };
})();

/* 3D 照片傾斜 */
document.querySelectorAll(".photo figure, .card").forEach(el => {
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

/* 音樂 */
document.getElementById("playBtn").onclick = () => bgm.play();
document.getElementById("pauseBtn").onclick = () => bgm.pause();

/* 🍜 今天吃什麼 */
const foods = ["海底撈 🍲","日式拉麵 🍜","義大利麵 🍝","韓式炸雞 🍗","夜市小吃 🍢","精緻甜點 🍰","麥當勞 🍔","小火鍋 🍲","壽司 🍣","燒烤 🍖","水餃 🥟","滷肉飯 🍚","牛肉麵 🍜","鹹酥雞 🍗","鬆餅 🥞","珍珠奶茶 🧋","雞肉飯 🍗","肉圓 🥟","蚵仔煎 🦪","臭豆腐 🍢","滷味 🍢","鍋燒意麵 🍜","陽春麵 🍜","乾麵加蛋 🍜","排骨便當 🍱","雞腿便當 🍱","壽喜燒 🍲","串燒 🍢","居酒屋 🍶","泰式打拋豬 🍛","越南河粉 🍜","海南雞飯 🍚","麻辣鍋 🌶️","石頭火鍋 🍲","薑母鴨 🍲","羊肉爐 🍲","炒飯 🍳","蛋包飯 🍳","披薩 🍕","漢堡 🍔","炸雞排 🍗","雞蛋糕 🍰","車輪餅 🥞","豆花 🍮","芋圓 🍠","刨冰 🍧","霜淇淋 🍦","可麗餅 🥞","早午餐 🥐","早餐店蛋餅 🥙","蘿蔔糕 🥟","燒餅油條 🥖","粥 🥣","廣東粥 🥣","小籠包 🥟","蒸餃 🥟","鍋貼 🥟","酸菜白肉鍋 🍲","韓式豆腐鍋 🍲","部隊鍋 🍲","石鍋拌飯 🍛","咖哩飯 🍛","豬排飯 🍱","鰻魚飯 🍱","丼飯 🍱","關東煮 🍢","鹽酥雞 🍗","地瓜球 🍠","雞湯 🥣","番茄牛肉麵 🍜","擔仔麵 🍜","炒碼麵 🍜","肉燥飯 🍚","控肉飯 🍚","鵝肉 🍗","薑汁番茄 🍅","熱炒 🥘","快炒店 🥘","自助餐 🍱","全家微波 🏪","自己煮飯 🍳"];
let foodSpinTimer = null;
document.getElementById("foodBtn").onclick = function(){
  const res = document.getElementById("foodResult");
  const btn = document.getElementById("foodBtn");
  if(foodSpinTimer){ clearInterval(foodSpinTimer); foodSpinTimer=null; btn.textContent="幫我們決定！"; return; }
  btn.textContent = "停止！";
  let count = 0;
  foodSpinTimer = setInterval(()=>{
    res.textContent = foods[Math.floor(Math.random()*foods.length)];
    count++;
    if(count > 25){ clearInterval(foodSpinTimer); foodSpinTimer=null; btn.textContent="幫我們決定！"; localStorage.setItem("foodPick","1"); if(typeof renderBadges==="function") renderBadges(); }
  }, 80);
};

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
    const wall = document.getElementById("wall");
    if(!wall) return;
    const fig = document.createElement("figure");
    fig.dataset.cap = cap;
    const img = document.createElement("img");
    img.alt = cap;
    img.src = src;
    img.loading = "lazy";
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
        const max = 960;
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
        res(canvas.toDataURL("image/jpeg", 0.72));
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
      const files = Array.from(memInput.files || []).filter(function(f){ return f.type.indexOf("image/") === 0; }).slice(0, 12);
      const status = document.getElementById("baiduStatus");
      if(!files.length){ return; }
      if(status) status.textContent = "正在加進回憶…";
      memDb().then(async function(db){
        for(let i = 0; i < files.length; i++){
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
      if(window.botpress && typeof window.botpress.open === "function"){
        window.botpress.open();
        if(status) status.textContent = "";
      } else if(status){
        status.textContent = "背後靈還在載入，等一下或看右下角藍色按鈕";
      }
    };
  }

  const pairs = [["我也很想你啊 真的", "抱抱寶寶"], ["我到家囉", "我愛你寶寶"], ["我愛你小寶寶", "我好想你"], ["我愛你寶寶", "我也愛你"], ["好吃嗎！！", "好吃！"], ["對不起寶寶", "忘記群發到我了"], ["對不起起起", "我剛到家"], ["豆腐還是百頁好吃", "都好吃"], ["可以用來打遊戲的寶寶", "沒有妳自由也沒有意義了寶寶"], ["好想妳耶小寶寶", "我不是小寶寶"], ["真的感覺很好吃嗚嗚", "當然啊寶寶"], ["超級帥", "寶寶我想你"], ["我想你了", "寶寶你想玩是嗎"], ["好滴", "我想你寶寶"], ["嗯嗯！", "寶寶你到家了嗎"], ["沒4", "謝謝寶寶今天請我吃飯"], ["寶寶 我潑了喔", "好哇寶寶"], ["累累寶寶", "愛妳寶寶"], ["我最愛你了", "我也是哇寶寶"], ["我愛你", "最愛你了"], ["嗨嗨寶寶", "寶寶你在做什麼"], ["你看嘿嘿", "寶寶我愛你"], ["寶寶我幾點可以找你", "寶寶我今天不一定"], ["想抱抱", "寶寶這個願望不算"], ["對不起不小心把你手機磨摔壞了", "為什麼會這樣"], ["沒關係", "寶寶我還是很愛你"], ["等等打給寶寶", "寶寶你還好嗎"], ["你好快到家", "寶寶"], ["我想抱抱", "怎麼啦寶寶"], ["我也愛你哇", "我在想你會不會遇到我媽"], ["我們阿鼻要乖乖的喔", "我想你北鼻"], ["知道寶寶", "你會餓嗎寶寶"], ["我愛你", "開心一點寶寶"], ["感覺不好吃", "看起來不好吃"], ["真的", "我愛你 很愛你寶寶"], ["我相信我有一天會好好表達滴", "欸我真的很愛你欸寶寶"], ["好棒寶寶", "看完了先 回家 等等我小寶寶"], ["所以寶寶我愛你", "那個"], ["不小心睡著沒有跟你說到晚安", "我不想"], ["想你", "我愛你小寶"], ["我愛你", "我愛你"], ["可愛寶寶", "小心走"], ["他就是玻璃心", "就例如說你不好好吃飯"], ["想你", "我也想你"], ["怎麼了", "愛你呀 老婆"], ["抱抱嗚嗚 我好怕你痛", "沒關係呀寶寶"], ["會滴寶寶", "幫然是想你啊"], ["好想你", "我也好想你"], ["我很愛你", "我愛你啊"], ["我是真想你了", "我也想你啊"], ["你應該已經平安回到家了吧", "剛到家"], ["寶寶 騎車小心🫶🏻", "突然想到"], ["我愛你欸", "這個好吃嗎"], ["那確實", "我愛你老婆"], ["兩個嗎", "對愛你老婆"], ["愛你寶寶❤️", "我看"], ["愛你寶寶", "認真"], ["我也想你老婆", "剛剛大家突然沈默10秒"], ["想抱抱", "想你啊"], ["我也愛你寶寶", "加油"], ["我沒吃過別的～你覺得哪版本最好吃", "最貴的最好吃"], ["我也愛你寶寶😋❤️", "小朋友吃飽飽"], ["愛你", "愛你"], ["有啊他就說他在學校暈船這樣", "明天我可以先跟你說早安"], ["ㄛ好啊我都不知道要吃什麼", "回到家洗完澡就清醒了"], ["我剛剛本來要衝去買它欸但太冷了", "欸這個感覺很好吃"], ["晚安", "不會煩啊"], ["早知道不睡覺的", "那個冰火菠蘿感覺很好吃欸"], ["你小心一點ㄛ", "好～"], ["那你回家小心好ㄌ", "下課了了了了"], ["漂亮咪", "好吃嗎"], ["想你", "想我可以打給我"], ["回家小心", "等我回家"], ["認真想你好了", "慢慢想"], ["早點用完早點休息", "晚安"], ["你不喜歡哦", "那個好吃"], ["你看", "欸這個感覺好好吃"], ["好想你", "騙人"], ["我想你", "媽的今天"], ["理我一下下", "感覺好好吃"], ["沒有穿給別人看", "我到吃飯的地方了"], ["哪有不行為什麼不行", "小心一點"], ["棒棒", "感覺不好吃"], ["我剛到家", "我會很愧疚"], ["要小心喔", "知道"], ["回家小心騎", "你還喜歡我嗎"], ["你到家再跟我說", "有吃"], ["為什麼他這麼好吃", "我沒有吃過"], ["我不行接受他", "好吃"], ["明明就超好吃", "他不會跟你搶食物"], ["我也到家嚕", "我也覺得"], ["哈哈哈哈", "會想你"], ["所以你不開心", "卡士達滿好吃的啊"], ["我也想你", "我吃了6個了"], ["真的不會有人跟你搶", "我說很好吃"], ["根本不好吃", "讓我吃到飽"], ["我要暈車了", "我想你"], ["我到家嚕", "知道了"], ["為什麼哈哈哈", "好啊寶寶"], ["我怕你不喜歡我啊", "要去吃飯"]];
  const log = document.getElementById("botLog");
  const input = document.getElementById("botInput");
  const send = document.getElementById("botSend");
  if(!log || !input || !send) return;
  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){ return "&#"+c.charCodeAt(0)+";"; });
  }
  function bubble(me, text){
    const div = document.createElement("div");
    div.className = "chat-line"+(me?" me":"");
    div.innerHTML = '<span class="bubble"><span class="who">'+(me?"小昀":"Y")+'</span>'+esc(text)+'</span>';
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
  function grams(s){
    const g = [];
    for(let i=0;i<s.length-1;i++) g.push(s.slice(i,i+2));
    return g;
  }
  function reply(q){
    const s = q.trim();
    if(!s) return "";
    const gs = grams(s);
    let best = "", score = 0;
    pairs.forEach(function(p){
      let sc = 0;
      gs.forEach(function(g){ if(p[0].indexOf(g) >= 0) sc++; });
      if(p[0] === s) sc += 12;
      if(sc > score){ score = sc; best = p[1]; }
    });
    if(score >= 2 && best) return best;
    if(/吃|餓|飯|奶茶/.test(s)) return "吃了沒寶寶，想吃什麼跟我說";
    if(/想你|愛你|想妳|愛妳/.test(s)) return "我也想你，我愛你寶寶";
    if(/到家|回來|回了/.test(s)) return "到家就好。我愛你";
    if(/早安|起床/.test(s)) return "早安安，吃早餐了嗎";
    if(/晚安|睡覺|想睡/.test(s)) return "晚安寶寶，抱抱";
    if(/對不起|生氣|吵架/.test(s)) return "對不起寶寶。我在";
    if(/上班|工作|下課|上課/.test(s)) return "加油，我在";
    if(/不舒服|痛|累/.test(s)) return "先休息。我在，抱抱";
    const soft = ["嗯我在","怎麼了寶寶","我愛你","到家跟我說"];
    return soft[s.length % soft.length];
  }
  function ask(){
    const q = input.value.trim();
    if(!q) return;
    input.value = "";
    bubble(true, q);
    setTimeout(function(){ bubble(false, reply(q)); }, 280);
  }
  send.onclick = ask;
  input.addEventListener("keydown", function(e){ if(e.key === "Enter") ask(); });
  bubble(false, "我在。想說什麼跟我說，寶寶");
})();

/* 此刻、抱抱、窗台、今天三件小事 */
(function(){
  const line = document.getElementById("nowLine");
  const moon = document.getElementById("moonLine");
  if(line){
    const h = new Date().getHours();
    const say = h < 5 ? "還沒睡嗎。我在。"
      : h < 10 ? "早安安。吃早餐了嗎。"
      : h < 14 ? "中午了。吃飯了沒，寶寶。"
      : h < 18 ? "下午也要想我一下。"
      : h < 22 ? "晚上了。到家跟我說一聲。"
      : "該睡了。先抱抱。";
    line.textContent = say;
  }
  if(moon){
    const lp = 2551443;
    const now = Date.now() / 1000;
    const born = Date.UTC(2024, 0, 11, 11, 57) / 1000;
    const phase = ((now - born) % lp + lp) % lp / lp;
    const names = ["新月","娥眉月","上弦月","盈凸月","滿月","虧凸月","下弦月","殘月"];
    moon.textContent = "今晚是" + names[Math.floor(phase * 8) % 8];
  }

  const hugBtn = document.getElementById("hugBtn");
  const hugFill = document.getElementById("hugFill");
  const hugCount = document.getElementById("hugCount");
  let hold = null, start = 0, hugged = false;
  function setFill(p){ if(hugFill) hugFill.style.width = Math.max(0, Math.min(100, p)) + "%"; }
  function paintHugs(n){
    if(!hugCount) return;
    hugCount.textContent = n ? ("今天抱了 " + n + " 下") : "今天還沒抱";
  }
  function finishHug(){
    if(hugged) return;
    hugged = true;
    hugBtn.classList.add("done");
    setFill(100);
    const day = new Date().toISOString().slice(0, 10);
    if(window.db){
      window.db.ref("ritual/hugs/"+day).transaction(function(c){ return (c || 0) + 1; });
    } else paintHugs(1);
    setTimeout(function(){ hugged = false; hugBtn.classList.remove("done"); setFill(0); }, 700);
  }
  function tick(){
    const p = (Date.now() - start) / 1400 * 100;
    setFill(p);
    if(p >= 100){ stop(); finishHug(); }
  }
  function stop(){
    if(hold){ clearInterval(hold); hold = null; }
    if(!hugged) setFill(0);
  }
  if(hugBtn){
    hugBtn.addEventListener("pointerdown", function(e){
      e.preventDefault();
      if(hold) return;
      start = Date.now();
      hold = setInterval(tick, 40);
    });
    hugBtn.addEventListener("pointerup", stop);
    hugBtn.addEventListener("pointerleave", stop);
    hugBtn.addEventListener("pointercancel", stop);
    hugBtn.addEventListener("contextmenu", function(e){ e.preventDefault(); });
  }

  const garden = document.getElementById("garden");
  const flowerBtn = document.getElementById("flowerBtn");
  function paintFlowers(n){
    if(!garden) return;
    n = n || 0;
    if(!n){ garden.textContent = "窗台還空著"; return; }
    const show = Math.min(n, 16);
    garden.textContent = new Array(show).fill("🌸").join("") + (n > 16 ? "  +" + (n - 16) : "");
  }
  if(flowerBtn){
    flowerBtn.onclick = function(){
      if(window.db) window.db.ref("ritual/flowers").transaction(function(c){ return (c || 0) + 1; });
      else paintFlowers(1);
    };
  }

  const pact = document.getElementById("pact");
  const jobs = [["eat","吃飽了"],["home","到家了"],["miss","說想你"]];
  function paintPact(val){
    if(!pact) return;
    pact.innerHTML = "";
    const role = window.myRole || "";
    jobs.forEach(function(job){
      const who = (val && val[job[0]]) || {};
      const names = [];
      if(who.y) names.push("Y");
      if(who.yun) names.push("小昀");
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = job[1] + (names.length ? " · " + names.join(" ") : "");
      if(role && who[role]) b.className = "on";
      b.onclick = function(){
        if(!window.db || !window.myRole) return;
        const day = new Date().toISOString().slice(0, 10);
        const on = b.className === "on";
        window.db.ref("ritual/pact/"+day+"/"+job[0]+"/"+window.myRole).set(on ? null : true);
      };
      pact.appendChild(b);
    });
  }
  paintPact(null);
  paintHugs(0);
  paintFlowers(0);

  if(window._authReady){
    window._authReady.then(function(){
      if(!window.db) return;
      window.db.ref("album/baidu").remove().catch(function(){});
      const day = new Date().toISOString().slice(0, 10);
      window.db.ref("ritual/hugs/"+day).on("value", function(s){ paintHugs(s.val() || 0); });
      window.db.ref("ritual/flowers").on("value", function(s){ paintFlowers(s.val() || 0); });
      window.db.ref("ritual/pact/"+day).on("value", function(s){ paintPact(s.val() || {}); });
    });
  }
})();
