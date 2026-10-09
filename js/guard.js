/* 全域錯誤回報與自動修復。頁面任何一段壞掉，不應拖垮整頁。 */
(function(){
  const log = [];
  const MAX = 30;
  function stamp(){ return new Date().toLocaleTimeString("zh-TW"); }
  function push(type, msg, detail, quiet){
    log.unshift({type, msg: String(msg).slice(0,180), detail: String(detail||"").slice(0,180), time: stamp()});
    if(log.length > MAX) log.pop();
    const badge = document.getElementById("errBadge");
    if(badge && !quiet){
      badge.hidden = false;
      badge.textContent = String(Math.min(log.length, 9));
    }
    console.warn("[guard]", type, msg);
  }
  window._errorLog = log;
  window.Guard = { log, push, report: push };

  window.addEventListener("error", function(e){
    const target = e.target;
    if(target && target !== window && target.tagName){
      if(target.tagName === "IMG"){
        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ffd6e7' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='40' text-anchor='middle' dy='.3em'%3E%E2%9D%A4%3C/text%3E%3C/svg%3E";
        target.onerror = null;
      }
      return;
    }
    const msg = String(e.message || "");
    healStorage(msg);
    if(!msg || msg === "Script error." || msg === "script error") return;
    push("JS", msg, (e.filename||"")+":"+(e.lineno||""));
  }, true);
  window.onerror = function(message){
    healStorage(message);
    return false;
  };
  window.addEventListener("unhandledrejection", function(e){
    const reason = e.reason;
    const msg = reason && reason.message ? String(reason.message) : String(reason || "");
    healStorage(msg);
    if(!msg || /offline|network|離線|permission_denied|PERMISSION_DENIED/i.test(msg)) return;
    push("Promise", msg, "");
  });

  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, attrs){
    try { return orig.call(this, type, attrs); }
    catch(err){ push("Canvas", "畫布不可用，已略過", err.message); return null; }
  };

  document.getElementById("errBadge").onclick = function(){
    const panel = document.getElementById("errPanel");
    const list = document.getElementById("errList");
    list.innerHTML = "";
    if(!log.length){
      list.textContent = "沒有錯誤";
    } else {
      log.forEach(function(e){
        const row = document.createElement("div");
        row.style.cssText = "margin:4px 0;padding:4px 6px;background:rgba(255,255,255,.08);border-radius:6px";
        row.textContent = e.type + " " + e.time + " " + e.msg;
        list.appendChild(row);
      });
    }
    panel.classList.toggle("open");
  };
  document.getElementById("errClose").onclick = function(){
    document.getElementById("errPanel").classList.remove("open");
  };

  function healStorage(reason){
    let n = 0;
    let keys = [];
    try{ for(let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)); }catch(e){ return; }
    keys.forEach(function(k){
      if(!k) return;
      let v = "";
      try{ v = localStorage.getItem(k) || ""; }catch(e){ return; }
      const t = v.trim();
      if(t.charAt(0) !== "{" && t.charAt(0) !== "[") return;
      try{ JSON.parse(v); }
      catch(err){
        try{ localStorage.removeItem(k); n++; }catch(e){}
      }
    });
    if(/quota/i.test(String(reason || ""))){
      ["talk-cache","chat-cache","wheel-log"].forEach(function(k){
        try{ if(localStorage.getItem(k) != null){ localStorage.removeItem(k); n++; } }catch(e){}
      });
    }
    if(n) push("修復", "清掉 " + n + " 筆壞資料，頁面繼續用", "", true);
  }
  window.readStore = function(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(raw == null || raw === "") return fallback;
      return JSON.parse(raw);
    }catch(e){
      try{ localStorage.removeItem(key); }catch(err){}
      push("修復", "清掉壞掉的 " + key, "", true);
      return fallback;
    }
  };
  try{ healStorage(""); }catch(e){}

  window.buzz = function(ms){
    try{ if(navigator.vibrate) navigator.vibrate(ms || 15); }catch(e){}
  };
  document.addEventListener("click", function(e){
    if(e.target.closest && e.target.closest("button, .mood, .gift-btn, .wish-item, .chip, .heart-game, summary, .tab-btn")) window.buzz(15);
  }, true);

  window.toast = function(text){
    const el = document.getElementById("toast");
    if(!el) return;
    el.textContent = text;
    el.hidden = false;
    clearTimeout(window._toastT);
    window._toastT = setTimeout(function(){ el.hidden = true; }, 1800);
  };
  window.askBox = function(text){
    return new Promise(function(resolve){
      const sheet = document.getElementById("sheet");
      const yes = document.getElementById("sheetYes");
      const no = document.getElementById("sheetNo");
      if(!sheet || !yes || !no){ resolve(false); return; }
      document.getElementById("sheetText").textContent = text;
      sheet.hidden = false;
      function done(v){
        sheet.hidden = true;
        yes.onclick = null;
        no.onclick = null;
        resolve(v);
      }
      yes.onclick = function(){ done(true); };
      no.onclick = function(){ done(false); };
    });
  };

  (function splash(){
    const el = document.getElementById("splash");
    const img = document.getElementById("splashPhoto");
    if(!el) return;
    const photos = ["mem/t/kiss.jpg","mem/t/close.jpg","mem/t/stick.jpg","mem/t/faces.jpg","mem/t/sand.jpg","mem/t/ray.jpg"];
    if(img) img.src = photos[Math.floor(Math.random() * photos.length)];
    setTimeout(function(){
      el.classList.add("out");
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 480);
    }, 1700);
  })();

  window.$ = function(id){ return document.getElementById(id); };
  window.on = function(id, ev, fn){
    const el = document.getElementById(id);
    if(!el){ push("DOM", "找不到 #"+id+"，已略過綁定", ev); return; }
    el.addEventListener(ev, fn);
  };
})();
