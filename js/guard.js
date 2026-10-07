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
    if(e.target && e.target.tagName === "IMG"){
      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ffd6e7' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='40' text-anchor='middle' dy='.3em'%3E%E2%9D%A4%3C/text%3E%3C/svg%3E";
      e.target.onerror = null;
      push("IMG", "圖片載入失敗，已換成愛心占位", e.target.getAttribute("src")||"", true);
      return;
    }
    push("JS", e.message || "script error", (e.filename||"")+":"+(e.lineno||""));
  }, true);
  window.addEventListener("unhandledrejection", function(e){
    push("Promise", e.reason && e.reason.message ? e.reason.message : e.reason, "");
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
  window.$ = function(id){ return document.getElementById(id); };
  window.on = function(id, ev, fn){
    const el = document.getElementById(id);
    if(!el){ push("DOM", "找不到 #"+id+"，已略過綁定", ev); return; }
    el.addEventListener(ev, fn);
  };
})();
