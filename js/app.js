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
      if(s.val() === false) Guard.push("Net", "即時資料庫離線，會自動重連", "");
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
  [startTimer, startGame, renderBadges, initCarousel, initTimeline].forEach(fn => {
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
  ["her_uniform.jpg","制服照"],
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
const figs = Array.from(document.querySelectorAll("#wall figure"));
const lb = document.getElementById("lb");
let lbI = 0;
function openLB(i){ lbI = i; showLB(); lb.classList.add("open"); }
function showLB(){
  const f = figs[lbI];
  document.getElementById("lbImg").src = f.querySelector("img").src;
  document.getElementById("lbCap").textContent = f.dataset.cap + "  (" + (lbI+1) + "/" + figs.length + ")";
}
figs.forEach((f,i) => f.onclick = () => openLB(i));
document.getElementById("lbC").onclick = () => lb.classList.remove("open");
document.getElementById("lbP").onclick = (e) => { e.stopPropagation(); lbI = (lbI-1+figs.length)%figs.length; showLB(); };
document.getElementById("lbN").onclick = (e) => { e.stopPropagation(); lbI = (lbI+1)%figs.length; showLB(); };
lb.onclick = (e) => { if(e.target === lb) lb.classList.remove("open"); };
document.addEventListener("keydown", e => {
  if(!lb.classList.contains("open")) return;
  if(e.key==="Escape") lb.classList.remove("open");
  if(e.key==="ArrowLeft"){ lbI=(lbI-1+figs.length)%figs.length; showLB(); }
  if(e.key==="ArrowRight"){ lbI=(lbI+1)%figs.length; showLB(); }
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
  const f = figs[Math.floor(Math.random()*figs.length)];
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
};

/* 成就 */
function renderBadges(){
  const badges = [
    {e:"💘", l:"解鎖密碼", u:true},
    {e:"📸", l:"看過14張照片", u:true},
    {e:"🎰", l:"抽過情話", u:localStorage.getItem("luvDrew")==="1"},
    {e:"🎁", l:"抽過盲盒", u:localStorage.getItem("boxDrew")==="1"},
    {e:"🧩", l:"完成翻牌", u:localStorage.getItem("memDone")==="1"},
    {e:"❤️", l:"收集10愛心", u:localStorage.getItem("heart10")==="1"},
    {e:"📝", l:"寫過便利貼", u:localStorage.getItem("noteWrote")==="1"},
    {e:"🎂", l:"100天", u:Math.floor((new Date()-start)/86400000)>=100},
  ];
  document.getElementById("badges").innerHTML = badges.map(b =>
    `<div class="badge ${b.u?"unlocked":"locked"}"><div class="emoji">${b.e}</div><div class="label">${b.l}</div></div>`
  ).join("");
}
// 標記成就
document.getElementById("loveBtn").addEventListener("click", () => { localStorage.setItem("luvDrew","1"); renderBadges(); });
document.getElementById("mystery").addEventListener("click", () => { localStorage.setItem("boxDrew","1"); renderBadges(); });

/* 願望清單 - 雲端同步 */
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
  list.innerHTML = "";
  if(uid){
    db.ref("wishes/state").off();
    db.ref("wishes/state").on("value", doc => {
      const raw = doc.exists() && doc.val() ? doc.val().done || [] : [];
      const done = raw.map(x => typeof x === "number" ? legacy[x] : x).filter(Boolean);
      const filters = document.getElementById("wishFilters");
      filters.innerHTML = "";
      const current = window._wishFilter || "全部";
      ["全部", ...Object.keys(groups)].forEach(name => {
        const b = document.createElement("button");
        b.textContent = name;
        b.style.cssText = "border:1px solid #ffb3c8;border-radius:999px;padding:6px 12px;background:"+(name===current?"#e91e63":"#fff")+";color:"+(name===current?"#fff":"#e91e63")+";font-family:inherit";
        b.onclick = () => { window._wishFilter = name; renderWishes(); };
        filters.appendChild(b);
      });
      list.innerHTML = "";
      const head = document.createElement("div");
      head.style.cssText = "text-align:center;color:#e91e63;font-size:.85rem;margin-bottom:8px";
      head.textContent = `完成 ${done.length} / ${wishes.length}`;
      list.appendChild(head);
      Object.entries(groups).forEach(([group, items]) => {
        if(current !== "全部" && current !== group) return;
        const title = document.createElement("div");
        title.style.cssText = "margin:12px 0 6px;font-size:.8rem;letter-spacing:2px;color:#c06";
        title.textContent = group;
        list.appendChild(title);
        items.forEach(w => {
          const isDone = done.includes(w);
          const d = document.createElement("div");
          d.className = "wish-item" + (isDone?" done":"");
          d.innerHTML = `<input type="checkbox" ${isDone?"checked":""}> <span>${w}</span>`;
          d.querySelector("input").onchange = function(){
            let s = done.filter(x => wishes.includes(x));
            if(this.checked) s.push(w); else s = s.filter(x => x !== w);
            db.ref("wishes/state").set({done:[...new Set(s)]});
          };
          list.appendChild(d);
        });
      });
    });
  }
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

/* 每日一問：同一天題目固定，兩邊回答即時同步 */
(function(){
  const qs = ["今天最開心的一件事？","我們第一次約會去哪？","妳覺得我哪裡最可愛？","想跟我去哪旅行？","今天有想我嗎？","喜歡我叫妳什麼？","下次見面想做什麼？","覺得我哪一點最吸引妳？","想一起完成什麼事？","最近一次想我是什麼時候？","我們哪個瞬間最浪漫？","妳覺得我們哪裡最像？","第一次牽手是什麼感覺？","最想收到我送什麼禮物？","哪句情話最打動妳？","我們最適合一起做什麼？","想跟我養什麼動物？","最喜歡我什麼習慣？","什麼時候覺得認定我了？","想一起住什麼樣的房子？","第一次見面覺得我是什麼樣的人？","現在最想我做什麼？","哪件事最讓妳感動？","想一起看什麼電影？","哪個季節最適合我們？","最想跟我去吃什麼？","哪個瞬間覺得我可愛？","想跟我挑戰什麼新事物？","最喜歡抱著我的時候？","什麼時候覺得我很帥？","想一起慶祝什麼節日？","哪件事只有我們懂？","覺得我哪裡需要改進？","想一起拍什麼風格的照片？","最想對我說什麼心裡話？","哪個地方最讓妳放鬆？","想一起學什麼技能？","哪段回憶最寶貴？","現在最想吃什麼？","想跟我在哪裡過生日？","哪句話最讓妳心動？","想一起看什麼夜景？","覺得我們的愛情像什麼？","最想收到什麼驚喜？","什麼時候最想抱抱我？","想一起做什麼瘋狂的事？","哪個習慣讓妳覺得窩心？","未來想跟我一起去哪？","現在的心情用一個詞形容","我愛妳用台語怎麼說"];
  const dayKey = new Date().toISOString().slice(0,10);
  document.getElementById("dailyQ").textContent = qs[Math.floor(Date.now()/86400000) % qs.length];
  function paint(val){
    const box = document.getElementById("dailyAnswers");
    if(!box) return;
    const names = {y:"Y", yun:"小昀"};
    const parts = ["y","yun"].map(k => {
      const a = val && val[k];
      return `<div style="padding:8px 0;border-top:1px solid #f3d5e2"><b style="color:#e91e63">${names[k]}</b>　${a ? a.text : "還沒回答"}</div>`;
    });
    box.innerHTML = parts.join("");
  }
  window._authReady.then(function(){
    const ref = db.ref("daily/"+dayKey);
    ref.on("value", s => paint(s.val()||{}));
    document.getElementById("dailySend").onclick = function(){
      const t = document.getElementById("dailyInput").value.trim();
      if(!t || !window.myRole) return;
      ref.child(window.myRole).set({text:t, time:Date.now()});
      document.getElementById("dailyInput").value = "";
    };
    document.getElementById("dailyInput").addEventListener("keydown", e => {
      if(e.key === "Enter") document.getElementById("dailySend").click();
    });
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

/* 我們的日常 — 從真實 LINE 記錄抽 */
(function(){
  const convos = [
    [{t:"下午03:43",who:"them",text:"你猜我們現在在幹嘛"},{t:"下午03:43",who:"me",text:"上課"},{t:"下午03:43",who:"them",text:"💩"},{t:"下午03:43",who:"them",text:"你猜錯了"},{t:"下午03:44",who:"me",text:"報告的怎麼樣"},{t:"下午03:44",who:"me",text:"我明天不想上課嗚嗚"}],
    [{t:"下午03:46",who:"them",text:"我們報告100分欸吧"},{t:"下午03:46",who:"me",text:"欸好厲害"},{t:"下午03:46",who:"me",text:"超級猛"},{t:"下午03:46",who:"me",text:"你們報告英文的欸"}],
    [{t:"下午03:44",who:"me",text:"幹我跟你講我買新桌子"},{t:"下午03:44",who:"me",text:"把舊的丟了想說他很快就來"},{t:"下午03:44",who:"me",text:"結果等了快一個月"},{t:"下午03:44",who:"me",text:"...."},{t:"下午03:45",who:"me",text:"這個小桌子超破"}],
    [{t:"下午11:26",who:"me",text:"我在想你"},{t:"下午11:27",who:"them",text:"白痴"},{t:"下午11:28",who:"me",text:"真的"},{t:"下午11:29",who:"them",text:"滾"}],
    [{t:"上午10:35",who:"them",text:"我上車車ㄌ"},{t:"上午10:36",who:"me",text:"好"},{t:"上午10:37",who:"me",text:"搭車小心"},{t:"上午10:38",who:"them",text:"嗯"}],
    [{t:"上午09:20",who:"them",text:"乖乖"},{t:"上午09:21",who:"me",text:"嗯"},{t:"上午09:22",who:"them",text:"吃早餐了嗎"},{t:"上午09:23",who:"me",text:"還沒"},{t:"上午09:24",who:"them",text:"趕快去吃"}],
    [{t:"下午11:41",who:"them",text:"你好寶寶"},{t:"下午11:42",who:"me",text:"？"},{t:"下午11:43",who:"them",text:"沒有"}],
    [{t:"下午06:52",who:"them",text:"不要洗屁股"},{t:"下午06:53",who:"me",text:"為什麼"},{t:"下午06:53",who:"them",text:"就不要"}],
    [{t:"下午08:36",who:"them",text:"幹你娘"},{t:"下午08:37",who:"me",text:"笑死"},{t:"下午08:37",who:"them",text:"真的"},{t:"下午08:38",who:"me",text:"哈哈哈"}],
    [{t:"上午02:28",who:"me",text:"你如果變成了我最不想靠近的那種人"},{t:"上午02:30",who:"them",text:"不會的"},{t:"上午02:31",who:"me",text:"最好是"}],
    [{t:"下午12:44",who:"them",text:"齁我要怎麼講"},{t:"下午12:45",who:"me",text:"就說"},{t:"下午12:45",who:"them",text:"我不知道啦"}],
    [{t:"下午09:35",who:"them",text:"我他媽真的傻眼"},{t:"下午09:36",who:"me",text:"怎麼了"},{t:"下午09:36",who:"them",text:"沒事"}],
    [{t:"上午08:52",who:"me",text:"知道妳懶"},{t:"上午08:53",who:"them",text:"滾"},{t:"上午08:53",who:"me",text:"哈哈"}],
    [{t:"下午05:05",who:"them",text:"要也不準備多一點"},{t:"下午05:06",who:"me",text:"好啦"},{t:"下午05:06",who:"them",text:"每次都這樣"}],
    [{t:"下午03:28",who:"them",text:"好"},{t:"下午03:29",who:"them",text:"哈哈哈"},{t:"下午03:30",who:"me",text:"笑屁"}],
    [{t:"上午08:03",who:"them",text:"嗯！"},{t:"上午08:04",who:"me",text:"早安"},{t:"上午08:05",who:"them",text:"早"}],
    [{t:"下午05:56",who:"them",text:"我去哪裡找你"},{t:"下午05:57",who:"me",text:"你在哪"},{t:"下午05:58",who:"them",text:"學校"},{t:"下午05:59",who:"me",text:"等我"}],
    [{t:"上午09:53",who:"me",text:"我也肚子痛"},{t:"上午09:54",who:"them",text:"怎麼了"},{t:"上午09:55",who:"me",text:"不知道"},{t:"上午09:56",who:"them",text:"喝熱水"}],
    [{t:"下午06:29",who:"them",text:"好貴"},{t:"下午06:30",who:"me",text:"什麼"},{t:"下午06:31",who:"them",text:"那個飲料"},{t:"下午06:32",who:"me",text:"那別買"}],
    [{t:"下午02:42",who:"them",text:"…好心態"},{t:"下午02:43",who:"me",text:"？"},{t:"下午02:44",who:"them",text:"沒事"}],
    [{t:"下午02:08",who:"me",text:"誰要大叫"},{t:"下午02:09",who:"them",text:"不知道"},{t:"下午02:10",who:"me",text:"神經"}],
    [{t:"下午12:24",who:"them",text:"（收回訊息）"},{t:"下午12:25",who:"me",text:"妳剛剛說什麼"},{t:"下午12:26",who:"them",text:"沒"}],
    [{t:"下午05:18",who:"them",text:"你整支手都蚊子"},{t:"下午05:19",who:"me",text:"笑死"},{t:"下午05:20",who:"them",text:"超癢"}],
    [{t:"下午11:37",who:"them",text:"沒"},{t:"下午11:38",who:"me",text:"沒什麼"},{t:"下午11:39",who:"them",text:"滾"}],
    [{t:"下午12:20",who:"them",text:"一直都是你"},{t:"下午12:23",who:"me",text:"just me?"},{t:"下午12:27",who:"them",text:"of course"},{t:"下午12:30",who:"them",text:"yes only you"}],
    [{t:"上午11:43",who:"them",text:"好～"},{t:"上午11:43",who:"them",text:"我愛你阿"},{t:"上午11:47",who:"me",text:"我也是"}],
    [{t:"下午06:22",who:"them",text:"❤️"},{t:"下午06:22",who:"me",text:"妳扁平足嗎"},{t:"下午06:22",who:"them",text:"我是要給你看愛心"},{t:"下午06:22",who:"them",text:"幹"}],
    [{t:"下午09:08",who:"me",text:"很難過"},{t:"下午09:08",who:"them",text:"我就會突然很需要你阿"},{t:"下午09:08",who:"them",text:"果然需要很多很多愛"}],
    [{t:"下午10:12",who:"me",text:"為什麼已經不常見面了還要一直吵架"},{t:"下午10:16",who:"them",text:"如果我剛剛態度不是那樣就能避免掉這些了"},{t:"下午10:16",who:"them",text:"讓你擔心了"}],
    [{t:"上午01:03",who:"me",text:"你去年許的願望"},{t:"上午01:05",who:"them",text:"希望身邊的人開開心心"},{t:"上午01:07",who:"me",text:"我去年許的願望有實現捏"}],
    [{t:"上午11:08",who:"me",text:"我經期來了"},{t:"上午11:10",who:"them",text:"肚子會痛嗎"},{t:"上午11:10",who:"them",text:"你有沒有帶衛生棉"}],
    [{t:"上午07:47",who:"me",text:"HI你的好友Y送你麥克雞塊"},{t:"上午07:48",who:"them",text:"撒浪嘿呦"},{t:"上午07:50",who:"me",text:"❤️"}],
    [{t:"上午01:25",who:"me",text:"你明天起得來嗎"},{t:"上午01:28",who:"them",text:"好剛好喔"},{t:"上午01:28",who:"them",text:"我在廁所"},{t:"上午01:28",who:"them",text:"幹超痛的"}],
    [{t:"上午06:05",who:"them",text:"你不覺得這個很可愛嗎"},{t:"上午06:10",who:"me",text:"她腳抽筋"}],
    [{t:"下午05:07",who:"me",text:"等等用完打給你"},{t:"下午05:07",who:"them",text:"好"}],
    [{t:"下午11:45",who:"me",text:"你不早說"},{t:"下午11:45",who:"me",text:"我在打遊戲你還是可以跟我聊天"},{t:"下午11:48",who:"them",text:"所以這樣是不行打的意思咪"}],
    [{t:"下午06:55",who:"me",text:"厲害吧"},{t:"下午06:56",who:"me",text:"我被電梯門夾了兩次"},{t:"下午06:56",who:"them",text:"小人國的主人"}],
    [{t:"上午01:42",who:"them",text:"未接來電"},{t:"上午01:47",who:"me",text:"。"},{t:"上午01:47",who:"them",text:"我覺得應該可以出去了"}],
    [{t:"下午03:40",who:"me",text:"酷啊"},{t:"下午03:40",who:"them",text:"我覺得他記得我很酷而已"}],
    [{t:"下午02:48",who:"me",text:"我嗎真的很笨"},{t:"下午02:48",who:"them",text:"好好笑我知道"}],
    [{t:"上午09:20",who:"them",text:"乖乖"},{t:"上午09:22",who:"them",text:"吃早餐了嗎"},{t:"上午09:23",who:"me",text:"還沒"},{t:"上午09:24",who:"them",text:"趕快去吃"}],
  ];
  // 用日期當種子，同一天固定抽 3 段
  const seed = Math.floor(Date.now()/86400000);
  const picks = [];
  const used = new Set();
  while(picks.length < 3 && used.size < convos.length){
    const i = (seed*7 + picks.length*13) % convos.length;
    if(!used.has(i)){ used.add(i); picks.push(convos[i]); }
  }
  const box = document.getElementById("chatToday");
  box.innerHTML = picks.map((conv, idx) => 
    `<div style="${idx>0?'margin-top:8px;padding-top:6px;border-top:1px dashed #f0d0dd':''}">` +
    conv.map(m => 
      `<div style="margin:3px 0; ${m.who==='me' ? 'text-align:right' : ''}">
        <span style="display:inline-block; padding:5px 11px; border-radius:14px; font-size:.85rem; line-height:1.35;
          background:${m.who==='me' ? 'var(--pink)' : '#fff'}; 
          color:${m.who==='me' ? '#fff' : '#555'}; 
          border:${m.who==='them' ? '1px solid var(--pink-soft)' : 'none'}">
          ${m.text}
        </span>
      </div>`
    ).join("") + `</div>`
  ).join("");
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
document.getElementById("fireworkBtn").onclick = firework;

/* 轉盤：指針固定在上方，結果跟扇形對齊 */
(function(){
  const tasks = ["抱抱她","說她可愛","問她吃了沒","親她一下","講情話","說想妳"];
  const wheel = document.getElementById("wheel");
  const result = document.getElementById("wheelResult");
  tasks.forEach((t,i)=>{
    const lab = document.createElement("div");
    lab.className = "wheel-label";
    lab.textContent = t;
    lab.style.transform = `rotate(${i*60+30}deg) translateY(-68px) rotate(-${i*60+30}deg)`;
    wheel.appendChild(lab);
  });
  let angle = 0, spinning = false;
  document.getElementById("spinBtn").onclick = function(){
    if(spinning) return;
    spinning = true;
    const idx = Math.floor(Math.random()*tasks.length);
    // 扇形從 0 度順時針，指針在 12 點。轉到該扇形中心對準指針。
    const targetMod = (360 - (idx*60 + 30)) % 360;
    const current = angle % 360;
    let delta = targetMod - current;
    if(delta < 0) delta += 360;
    angle += 360*5 + delta;
    wheel.style.transform = `rotate(${angle}deg)`;
    result.textContent = "轉動中...";
    setTimeout(() => {
      result.textContent = "今天的任務： " + tasks[idx];
      spinning = false;
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
    if(count > 25){ clearInterval(foodSpinTimer); foodSpinTimer=null; btn.textContent="幫我們決定！"; }
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
