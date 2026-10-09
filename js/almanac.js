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
  var OURS_YI = ["一起吃甜點","給對方一個擁抱","拍一張合照","牽手走一段","早點說晚安","傳一句想你","一起吃頓好的","並排坐著發呆","幫對方倒杯水","出門前記得牽手","把今天的小事講給對方","一起挑一部片","買一份小點心","寫一張小字條","一起散步","早一點回家","一起吃牛肉麵","麥當勞早餐留給對方","星巴克坐同一側","滷味不要太辣","提拉米蘇留一塊","騎車慢一點","到家說一聲","幫對方吹頭髮","冬天一起躲被窩","夏天一起吃冰","雨天把手伸過去","電梯門開之前先抱一下","把好吃的留一口","睡前鬧一下再睡","醒來第一句找對方","週末整天陪著","把外套分一件","一起看畢業那張照片","宜蘭的路再走一次","水族館裡只看對方","演唱會把螢光棒靠在一起","動物園並排站好","小豬先夾菜","狗狗負責點餐","把委屈當天說完","給對方捏一下肩膀","一起收杯子","把喜歡說出聲","今天也站在同一邊"];
  var OURS_JI = ["太晚才睡","忘記喝水","為了小事賭氣","訊息已讀不回","餓著肚子出門","一直刷手機不說話","把累積的火留到晚上","答應的事拖過今天","各看各的不對眼","講一句再收回去的話","各自滑手機到睡著","餓著還說不餓","冷戰超過一小時","把隨便當真的","忘記說到家了","雨天不牽手","比誰比較忙","把委屈吞下去","答應的擁抱拖到明天","吃飯只看螢幕","生氣先關門","把小豬的份吃掉","狗狗裝沒聽到","太晚才回訊息","一人一副耳機整晚","把今天的好心情留到明天才講","餓著還硬撐","把『等一下』說成一整天","轉身就忘了對方說的話","用比較大聲蓋過對方"];
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
    "今日情話不用新的，舊的那句我喜歡你仍然算數。",
    "癸水負責把話放輕，辛金負責把人護住。",
    "早上的辰時和夜裡的子時，中間都是想彼此的空檔。",
    "中壢的晚風先到，鳳山的人還是在。",
    "兩個獅子今天不要爭王座，爭誰先說想你。",
    "狗狗的水要拿來澆，不要拿來冷。",
    "小豬的金要拿來抱，不要拿來頂。",
    "生辰寫在這裡，人就坐在旁邊。",
    "八月的月亮換過，你們的位置沒換。",
    "今天的三個數字，一個用來點餐，一個用來牽手，一個用來早點睡。",
    "幸運色塗在同一件衣服上就好，不必分開穿。",
    "宜忌寫再多，第一條還是：看到對方就笑一下。",
    "動物園並排過，演唱會靠過，今天在家也算並排。",
    "宜蘭那趟之後，出遠門的定義變成有你在。",
    "魚很多的那天，眼睛還是只停在你身上。",
    "畢業緞帶會舊，叫你的那聲不會。",
    "吃吃吃的那些日子，現在還能再約一頓。",
    "電梯門會開，手可以晚一點放開。",
    "雨天的傘只要一把，兩個人就夠。",
    "今天若契合度不是滿分，扣的那些分用來練習讓步。",
    "小豬先吃，狗狗看著也算一份甜。",
    "鳳山到中壢不是距離，是你們已經走完的路。",
    "辰時的人先醒，就把晚安補成早安。",
    "子時的人還沒睡，就把燈留一盞。",
    "兩個人都是獅子座，脾氣熱，心也熱。",
    "今天適合把『我沒事』改成『我想你』。",
    "黃曆沖到誰，都不要沖到這張桌子對面。",
    "喜神的方向如果太遠，就轉向對方。",
    "生肖一個狗一個豬，本來就會擠在同一張沙發。",
    "今天的情話可以很短：在。",
    "把八字收好，把人抱好。",
    "甜點分一半，話也分一半，悶不要分。",
    "若今天只記得一句，記得你們是一起的。"
  ];
  var COLORS = {
    "木":[["薄荷綠","#7dcea0"],["森綠","#2e8b57"],["芽綠","#9ccc65"],["青蘋果","#8bc34a"],["湖水綠","#4db6ac"],["橄欖","#827717"],["新葉","#aed581"],["松綠","#2e7d32"]],
    "火":[["櫻花粉","#ff6b9d"],["朱紅","#e74c3c"],["珊瑚橘","#ff8a65"],["胭脂","#c2185b"],["蜜桃","#ffab91"],["夕陽橘","#ff7043"],["玫紅","#e91e63"],["燈籠紅","#d32f2f"]],
    "土":[["奶油黃","#ffe08a"],["香檳金","#e6c27a"],["杏仁米","#f3e5c2"],["麥芽","#d7ccc8"],["蜂蜜","#ffb300"],["燕麥","#efebe9"],["杏桃","#ffcc80"],["暖沙","#d4a574"]],
    "金":[["香檳金","#e6c27a"],["霧銀","#cfd8dc"],["珍珠白","#f7f4ef"],["月光銀","#eceff1"],["香檳米","#f8e8d8"],["淺金","#ffe082"],["雲白","#fafafa"],["米金","#f3e5ab"]],
    "水":[["霧藍","#90caf9"],["薰衣草紫","#b39ddb"],["靛青","#5c6bc0"],["海鹽藍","#81d4fa"],["薄霧紫","#ce93d8"],["夜藍","#3949ab"],["晴空","#64b5f6"],["丁香","#9575cd"]]
  };
  var NUM_SAY = ["","一起吃一份","牽一次手","傳一句話","早一點睡","喝一杯水","並排坐一下","拍一張照","說一句喜歡","把外套分一件"];

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
    var colors = take(rng, COLORS[el], 3);
    var n1 = (GAN.indexOf(today.day[0]) + zhi + now.getDate()) % 9 + 1;
    var n2 = (ZHI.indexOf(today.day[1]) + 3) % 9 + 1;
    var n3 = (n1 + n2 + 4) % 9 + 1;
    if(n3 === n1 || n3 === n2) n3 = n3 % 9 + 1;
    var score = 85 + Math.floor(rng() * 16);
    var talk = 85 + Math.floor(rng() * 16);
    var food = 85 + Math.floor(rng() * 16);
    var hug = 85 + Math.floor(rng() * 16);
    var meEl = element(me.day[0]);
    var herEl = element(her.day[0]);
    if(el === meEl || el === herEl) score = Math.min(100, score + 2);
    var yi = YI[jian].join("、");
    var ji = JI[jian].join("、");
    var ourYi = take(rng, OURS_YI, 4).join("、");
    var ourJi = take(rng, OURS_JI, 3).join("、");
    var lines = take(rng, LINES, 2);
    var week = "日一二三四五六"[now.getDay()];
    var WORD = {
      "祈福":"求個心安","出行":"出門","會友":"見人","上梁":"辦新的大事","祭祀":"紀念想念",
      "治病":"把身體顧好","掃舍":"打掃","求醫":"去看醫生","結親":"談感情","開市":"開始做一件新的",
      "納財":"進帳","修造":"修一修","塗泥":"補一補","平治道路":"把事情理順","納采":"送禮約定",
      "嫁娶":"辦婚事","訂盟":"把約定定下來","牧養":"照顧小動物","捕捉":"去追、去抓","拆卸":"清掉舊的",
      "安床":"整理床鋪","入學":"學習","交易":"買賣","收賬":"把錢收回來","求財":"求財運",
      "築堤":"把缺口補上","補垣":"把界線補好","塞穴":"把漏洞補上","動土":"大興土木","開倉":"一次把存的拿出來",
      "遠行":"出遠門","服藥":"吃藥","詞訟":"爭執","大事":"辦大事","出行爭辯":"出門跟人吵",
      "搬家":"搬家","簽約":"簽約","開業":"新開張","登高":"爬高","乘船":"坐船","訴訟":"打官司",
      "開張":"新開張","破土":"動土開工","安葬":"辦喪事"
    };
    var JIAN_SAY = {
      "建":"適合出門見人，大工程先不要動",
      "除":"適合打掃、看病，遠行和辦喜事先緩一緩",
      "滿":"適合求心安、進帳，把感情放在一起",
      "平":"平常的一天，修修補補就好",
      "定":"適合把約定定下來",
      "執":"適合守著現在的，先別搬家、先別開張",
      "破":"適合看病、清掉舊的，先別簽約、先別辦大事",
      "危":"宜安穩待著，少去冒險",
      "成":"適合把事情做成，出門、見面都可以",
      "收":"適合把東西收回來，先別新開張",
      "開":"適合出門、求財",
      "閉":"適合收心，先別出門求財"
    };
    var EL_SAY = { "木":"木，會長也會讓", "火":"火，熱、來得快", "土":"土，穩、想把人顧好", "金":"金，直、有自己的標準", "水":"水，細、會想" };
    var HOUR_SAY = { "子":"晚上11點到1點", "丑":"凌晨1點到3點", "寅":"凌晨3點到5點", "卯":"清晨5點到7點", "辰":"早上7點到9點", "巳":"上午9點到11點", "午":"中午11點到1點", "未":"下午1點到3點", "申":"下午3點到5點", "酉":"傍晚5點到7點", "戌":"晚上7點到9點", "亥":"晚上9點到11點" };
    function sayList(text){
      return text.split("、").map(function(w){ return WORD[w] || w; }).join("、");
    }
    function birthLine(label, when, where, p){
      var animal = ANIMALS[ZHI.indexOf(p.year[1])];
      return label + "的生辰：" + when + "，" + where + "。八字是" + p.year + "年、" + p.month + "月、" + p.day + "日、" + p.hour + "時。" + animal + "年，獅子座，日主" + p.day[0] + EL_SAY[element(p.day[0])] + "。時辰在" + HOUR_SAY[p.hour[1]] + "。";
    }
    var yearAnimal = ANIMALS[ZHI.indexOf(gz(lunar.y - 4)[1])];
    var chongAnimal = ANIMALS[ZHI.indexOf(chong)];
    var chongWho = chongAnimal === "狗" ? "狗狗" : chongAnimal === "豬" ? "小豬" : "屬" + chongAnimal + "的人";
    var plain = [
      "今天是" + yearAnimal + "年，農曆" + lunar.text + "。",
      "這個日子叫「" + today.day + "」，五行是" + el + "。",
      "今天跟" + chongWho + "比較容易頂到，少硬碰硬。" + shaText + "邊少起爭執。",
      "想要順一點，就往" + xi + "走。",
      "黃曆把今天叫「" + jian + "」：" + JIAN_SAY[jian] + "。",
      "老黃曆寫適合" + sayList(yi) + "。先別做：" + sayList(ji) + "。",
      birthLine("狗狗", "2006年8月12日上午08:15", "桃園中壢", me),
      birthLine("小豬", "2007年7月26日晚上23:00", "高雄鳳山", her)
    ].join("\n");
    var raw = "原文 " + gz(lunar.y - 4) + "年 " + lunar.text + " 日柱" + today.day + " 沖" + chongAnimal + "煞" + shaText + " 喜神" + xi + " 建除" + jian
      + "\n狗狗 " + me.year + " " + me.month + " " + me.day + " " + me.hour
      + "　小豬 " + her.year + " " + her.month + " " + her.day + " " + her.hour;
    document.getElementById("almDate").textContent = now.getFullYear() + "." + (now.getMonth() + 1) + "." + now.getDate() + " 週" + week;
    var gzBox = document.getElementById("almGz");
    gzBox.textContent = "";
    var plainEl = document.createElement("span");
    plainEl.className = "alm-plain";
    plainEl.textContent = plain;
    var rawEl = document.createElement("span");
    rawEl.className = "alm-raw";
    rawEl.textContent = raw;
    gzBox.appendChild(plainEl);
    gzBox.appendChild(rawEl);
    document.getElementById("almScore").textContent = "今日契合 " + score + "%　說話 " + talk + "　吃飯 " + food + "　抱抱 " + hug;
    document.getElementById("almBar").style.width = score + "%";
    document.getElementById("almColor").innerHTML = colors.map(function(c){
      return '<i class="alm-dot" style="background:' + c[1] + '"></i>' + c[0];
    }).join("<br>");
    document.getElementById("almNum").textContent = [n1, n2, n3].map(function(n){ return n + " " + NUM_SAY[n]; }).join("、");
    document.getElementById("almYi").textContent = ourYi;
    document.getElementById("almJi").textContent = ourJi;
    document.getElementById("almLine").textContent = lines.join("\n");
  }catch(err){
    if(window.Guard) Guard.push("黃曆", err.message || err, "");
    box.textContent = "今日黃曆暫時算不出來，其他頁面還能用。";
  }
})();
