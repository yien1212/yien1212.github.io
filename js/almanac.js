/* 每日黃曆：國曆轉農曆、干支、沖煞、建除宜忌。雙方同一天看到同一份。 */
(function(){
  var box = document.getElementById("almanac");
  if(!box) return;
  var GAN = "甲乙丙丁戊己庚辛壬癸";
  var ZHI = "子丑寅卯辰巳午未申酉戌亥";
  var ANIMALS = "鼠牛虎兔龍蛇馬羊猴雞狗豬";
  var LUNAR_INFO = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
    0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63
  ];
  var TERM = [0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];
  var JIAN = ["建","除","滿","平","定","執","破","危","成","收","開","閉"];
  var YI = {
    "建":["祈福","出行","會友","上梁"],
    "除":["祭祀","治病","掃舍","求醫"],
    "滿":["祈福","結親","開市","納財"],
    "平":["修造","塗泥","平治道路"],
    "定":["納采","嫁娶","開市","訂盟"],
    "執":["祭祀","牧養","捕捉"],
    "破":["求醫","治病","拆卸"],
    "危":["安床","祭祀","納財"],
    "成":["嫁娶","開市","入學","交易","出行"],
    "收":["納財","收賬","捕捉"],
    "開":["開市","求財","出行","嫁娶"],
    "閉":["築堤","補垣","塞穴"]
  };
  var JI = {
    "建":["動土","開倉"],
    "除":["嫁娶","遠行"],
    "滿":["服藥","詞訟"],
    "平":["祈福","大事"],
    "定":["詞訟","出行爭辯"],
    "執":["開市","搬家"],
    "破":["嫁娶","簽約","開業"],
    "危":["登高","乘船"],
    "成":["訴訟"],
    "收":["開張","破土"],
    "開":["安葬"],
    "閉":["開市","出行","求財"]
  };
  var OURS_YI = ["一起吃甜點","給對方一個擁抱","拍一張合照","牽手走一段","早點說晚安","傳一句想你","一起吃頓好的","並排坐著發呆","幫對方倒杯水","出門前記得牽手","把今天的小事講給對方","一起挑一部片","買一份小點心","寫一張小字條","一起散步","早一點回家"];
  var OURS_JI = ["太晚才睡","忘記喝水","為了小事賭氣","訊息已讀不回","餓著肚子出門","一直刷手機不說話","把累積的火留到晚上","答應的事拖過今天","各看各的不對眼","講一句再收回去的話"];
  var LINES = [
    "兩個獅子坐在一起，脾氣可以大，手不要放開。",
    "狗狗先沉住氣，小豬再靠近一點就好。",
    "今天的火有點旺，想講重話之前先抱一下。",
    "中壢到鳳山那麼遠都走到了，今天這點小事不算遠。",
    "一個辰時出生，一個接近子時，一個管白天，一個陪夜。",
    "契合不是天天百分百，是生氣了還願意把肩膀留下來。",
    "今天宜把甜的分一半，忌把冷淡分一半。",
    "獅子跟獅子不要比誰更大聲，比誰先笑。",
    "戌和亥挨在一起，本來就是鄰座。",
    "運勢好的用法：早一點說想你，晚一點才生氣。",
    "今天的顏色是給兩個人看的，不是只挑給自己。",
    "宜並排，忌背對背。",
    "小豬若是悶，狗狗先問一句吃了沒。",
    "兩個火象今天容易熱，冷飲可以有，冷戰不要有。",
    "黃曆寫宜會友，朋友里優先的那個是對方。",
    "沖到了也不要衝對方，去散步把那個沖走。",
    "今日的數字可以當點餐數量，不可以當冷戰天數。",
    "一個夏天生，一個夏天生，熱的時候更要靠緊。",
    "今天適合把『等一下』改成『現在』。",
    "忌各自正確，宜一起吃飯。",
    "干支怎麼排，手還是要牽。",
    "鳳山的海風和中壢的晚風，今天吹成同一句晚安。",
    "建除不管寫什麼，抱抱都算宜。",
    "今天若只做一件事，就把對方的訊息回完。",
    "兩個獅子的好運，是有人先讓一步。",
    "宜把外套分一件，忌把情緒丟過去。",
    "農曆翻過今天，喜歡不用跟著翻篇。",
    "小豬的午夜和狗狗的早晨，中間那幾個小時留給想彼此。",
    "今天的方位不管指哪，人站在對方旁邊就對。",
    "忌比誰比較累，宜問要不要靠一下。",
    "黃曆的嫁娶我們先練習：今天也站在同一邊。",
    "火再旺，也可以是燈，不要是燒。",
    "今天宜分享食物，忌分享悶。",
    "狗年猪年挨著，連生肖都幫你們排好了。",
    "契合度不是考試，是今天還想見面。",
    "若黃曆忌遠行，那就近一點，近到肩膀。",
    "今日情話不用新的，舊的那句我喜歡你仍然算數。"
  ];
  var COLORS = {
    "木":[["薄荷綠","#7dcea0"],["森綠","#2e8b57"],["芽綠","#9ccc65"]],
    "火":[["櫻花粉","#ff6b9d"],["朱紅","#e74c3c"],["珊瑚橘","#ff8a65"]],
    "土":[["奶油黃","#ffe08a"],["香檳金","#e6c27a"],["杏仁米","#f3e5c2"]],
    "金":[["香檳金","#e6c27a"],["霧銀","#cfd8dc"],["珍珠白","#f7f4ef"]],
    "水":[["霧藍","#90caf9"],["薰衣草紫","#b39ddb"],["靛青","#5c6bc0"]]
  };

  function lYearDays(y){
    var i, sum = 348;
    for(i = 0x8000; i > 0x8; i >>= 1) sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
    return sum + leapDays(y);
  }
  function leapMonth(y){ return LUNAR_INFO[y - 1900] & 0xf; }
  function leapDays(y){ return leapMonth(y) ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0; }
  function monthDays(y, m){ return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29; }
  function solarTerm(year, n){
    var ms = 31556925974.7 * (year - 1900) + TERM[n] * 60000 + Date.UTC(1900, 0, 6, 2, 5);
    return new Date(ms + 8 * 3600000);
  }
  function toLunar(date){
    var y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
    var offset = Math.round((Date.UTC(y, m, d) - Date.UTC(1900, 0, 31)) / 86400000);
    var i, temp = 0;
    for(i = 1900; i < 2100 && offset > 0; i++){
      temp = lYearDays(i);
      offset -= temp;
    }
    if(offset < 0){ offset += temp; i--; }
    var ly = i;
    var leap = leapMonth(ly);
    var isLeap = false;
    for(i = 1; i < 13 && offset > 0; i++){
      if(leap > 0 && i === leap + 1 && !isLeap){
        --i; isLeap = true; temp = leapDays(ly);
      } else {
        temp = monthDays(ly, i);
      }
      if(isLeap && i === leap + 1) isLeap = false;
      offset -= temp;
    }
    if(offset === 0 && leap > 0 && i === leap + 1){
      if(isLeap) isLeap = false;
      else { isLeap = true; --i; }
    }
    if(offset < 0){ offset += temp; --i; }
    var lm = i;
    var n = offset + 1;
    var names = ["正","二","三","四","五","六","七","八","九","十","冬","臘"];
    var day = (n === 10 ? "初十" : n === 20 ? "二十" : n === 30 ? "三十" : (n < 10 ? "初" : n < 20 ? "十" : n < 30 ? "廿" : "三") + "〇一二三四五六七八九"[n % 10]);
    return { y: ly, m: lm, d: n, leap: isLeap, text: (isLeap ? "閏" : "") + names[lm - 1] + "月" + day };
  }
  function gz(n){ return GAN[n % 10] + ZHI[n % 12]; }
  function dayIndex(date){
    var y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
    return Math.round((Date.UTC(y, m, d) - Date.UTC(1900, 0, 31)) / 86400000) + 40;
  }
  function monthZhiIndex(date){
    var y = date.getFullYear();
    var t = date.getTime();
    var idx = -1;
    for(var i = 0; i < 12; i++){
      if(t >= solarTerm(y, i * 2).getTime()) idx = i;
    }
    if(idx < 0) return 0;
    return (1 + idx) % 12;
  }
  function yearGz(date){
    var y = date.getFullYear();
    var lichun = solarTerm(y, 2);
    var yy = date.getTime() < lichun.getTime() ? y - 1 : y;
    return gz(yy - 4);
  }
  function hourZhi(h){ return Math.floor(((h + 1) % 24) / 2); }
  function pillar(date, hour){
    var di = dayIndex(date);
    var mi = monthZhiIndex(date);
    var year = yearGz(date);
    var monthStem = ((GAN.indexOf(year[0]) % 5) * 2 + 2 + mi - 2 + 120) % 10;
    var month = GAN[monthStem] + ZHI[mi];
    var day = gz(di);
    var hz = hourZhi(hour);
    var hourStem = ((GAN.indexOf(day[0]) % 5) * 2 + hz) % 10;
    return { year: year, month: month, day: day, hour: GAN[hourStem] + ZHI[hz], dayIndex: di };
  }
  function element(stem){ return "木木火火土土金金水水"[GAN.indexOf(stem)]; }
  function take(rng, list, n){
    var pool = list.slice();
    var out = [];
    while(out.length < n && pool.length){
      out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
    return out;
  }
  function rngOf(n){
    var a = n >>> 0;
    return function(){
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  try{
    var now = new Date();
    var lunar = toLunar(now);
    var today = pillar(now, now.getHours());
    var me = pillar(new Date(2006, 7, 12), 8);
    var her = pillar(new Date(2007, 6, 26), 23);
    var zhi = ZHI.indexOf(today.day[1]);
    var chong = ZHI[(zhi + 6) % 12];
    var shaText = ["南","東","北","西","南","東","北","西","南","東","北","西"][zhi];
    var xi = ["東北","西北","西南","正南","正北","東北","西北","西南","正南","正北"][GAN.indexOf(today.day[0])];
    var jian = JIAN[(zhi - monthZhiIndex(now) + 12) % 12];
    var seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + 20060812 + 20070726 + 815 + 2300;
    var rng = rngOf(seed);
    var el = element(today.day[0]);
    var color = take(rng, COLORS[el], 1)[0];
    var n1 = (GAN.indexOf(today.day[0]) + zhi + now.getDate()) % 9 + 1;
    var n2 = (ZHI.indexOf(today.day[1]) + 3) % 9 + 1;
    var n3 = (n1 + n2 + 4) % 9 + 1;
    if(n3 === n1 || n3 === n2) n3 = n3 % 9 + 1;
    var score = 85 + Math.floor(rng() * 11);
    var meEl = element(me.day[0]);
    var herEl = element(her.day[0]);
    if(el === meEl || el === herEl) score = Math.min(100, score + 2);
    var yi = YI[jian].join("、");
    var ji = JI[jian].join("、");
    var ourYi = take(rng, OURS_YI, 2).join("、");
    var ourJi = take(rng, OURS_JI, 2).join("、");
    var line = take(rng, LINES, 1)[0];
    var week = "日一二三四五六"[now.getDay()];
    document.getElementById("almDate").textContent = now.getFullYear() + "." + (now.getMonth() + 1) + "." + now.getDate() + " 週" + week;
    document.getElementById("almGz").textContent = gz(lunar.y - 4) + "年　農曆" + lunar.text + "　日柱" + today.day + "　沖" + ANIMALS[ZHI.indexOf(chong)] + "煞" + shaText + "　喜神" + xi + "　建除「" + jian + "」\n黃曆宜 " + yi + "　忌 " + ji + "\n狗狗 " + me.year + " " + me.month + " " + me.day + " " + me.hour + "　小豬 " + her.year + " " + her.month + " " + her.day + " " + her.hour;
    document.getElementById("almScore").textContent = "今日契合 " + score + "%";
    document.getElementById("almBar").style.width = score + "%";
    document.getElementById("almColor").innerHTML = '<i class="alm-dot" style="background:' + color[1] + '"></i>' + color[0];
    document.getElementById("almNum").textContent = n1 + "、" + n2 + "、" + n3;
    document.getElementById("almYi").textContent = ourYi;
    document.getElementById("almJi").textContent = ourJi;
    document.getElementById("almLine").textContent = line;
  }catch(err){
    if(window.Guard) Guard.push("黃曆", err.message || err, "");
    box.textContent = "今日黃曆暫時算不出來，其他頁面還能用。";
  }
})();
