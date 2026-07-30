#!/usr/bin/env node
// Generate 8 bilingual tool landing pages for Weathora.
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const TOOLS = [
  {
    slug: "heat-index", tool: "heat",
    enTitle: "Heat Index Calculator", zhTitle: "酷热指数计算器",
    enDesc: "Estimate how hot it feels with the NWS Rothfusz heat-index formula. 100% in your browser, bilingual, no upload.",
    zhDesc: "用 NWS Rothfusz 酷热指数公式估算体感热度。全程在浏览器中运行，双语，无需上传。",
    faqs: [
      { q: "Is the heat index calculator free?", en: "Yes. It is completely free, with no account and no limits.", zh: "是的，完全免费，无需注册，不限次数。" },
      { q: "Which formula does it use?", en: "It uses the official NWS Rothfusz regression, the same model used by the U.S. National Weather Service.", zh: "它采用官方 NWS Rothfusz 回归公式，与美国国家气象局使用的模型相同。" },
      { q: "Can I enter Celsius?", en: "Yes. Use the unit toggle next to the temperature field to switch between °C and °F.", zh: "可以。使用温度字段旁的单位开关，在 °C 与 °F 之间切换。" }
    ]
  },
  {
    slug: "wind-chill", tool: "chill",
    enTitle: "Wind Chill Calculator", zhTitle: "风寒指数计算器",
    enDesc: "Find the wind-chill temperature with the NWS formula. All calculations run locally in your browser.",
    zhDesc: "用 NWS 公式求风寒温度。所有计算都在你的浏览器本地完成。",
    faqs: [
      { q: "How is wind chill calculated?", en: "It uses the NWS wind-chill formula based on air temperature and wind speed.", zh: "它基于气温与风速，采用 NWS 风寒公式计算。" },
      { q: "Does it support km/h and mph?", en: "Yes. Switch the wind-speed unit between m/s, km/h, mph, and knots.", zh: "支持。可在 m/s、km/h、mph 与节之间切换风速单位。" },
      { q: "Is it free?", en: "Yes, with no sign-up.", zh: "是的，无需注册。" }
    ]
  },
  {
    slug: "dew-point", tool: "dew",
    enTitle: "Dew Point Calculator", zhTitle: "露点计算器",
    enDesc: "Compute the dew point from temperature and relative humidity using the Magnus formula. Runs 100% locally.",
    zhDesc: "用 Magnus 公式由温度与相对湿度计算露点。全程本地运行。",
    faqs: [
      { q: "What is the dew point?", en: "The dew point is the temperature at which air becomes saturated and moisture condenses.", zh: "露点是空气达到饱和、水汽开始凝结时的温度。" },
      { q: "Which formula is used?", en: "The Magnus formula, a standard and accurate approximation for dew point.", zh: "采用 Magnus 公式，这是计算露点的标准且精确的近似方法。" },
      { q: "Is it free?", en: "Yes, no account needed.", zh: "是的，无需注册。" }
    ]
  },
  {
    slug: "humidex", tool: "hum",
    enTitle: "Humidex Calculator", zhTitle: "湿度指数计算器",
    enDesc: "Estimate summer comfort with the Canadian humidex index from temperature and humidity. All calculations run locally.",
    zhDesc: "由温度与湿度估算加拿大湿度指数，衡量夏季舒适度。所有计算均本地完成。",
    faqs: [
      { q: "What is the humidex?", en: "The humidex is a Canadian index that describes how hot the air feels by combining temperature and humidity.", zh: "湿度指数是加拿大指标，通过温度与湿度描述空气的实际炎热程度。" },
      { q: "In which unit is it shown?", en: "Humidex is shown in °C (its conventional unit), with the °F equivalent also displayed.", zh: "湿度指数以 °C 显示（惯例单位），同时给出 °F 等效值。" },
      { q: "Is it free?", en: "Yes, no account needed.", zh: "是的，无需注册。" }
    ]
  },
  {
    slug: "temperature-converter", tool: "temp",
    enTitle: "Temperature Converter", zhTitle: "温度换算器",
    enDesc: "Convert between Celsius, Fahrenheit, and Kelvin instantly. 100% in your browser, bilingual.",
    zhDesc: "在摄氏度、华氏度与开尔文之间即时换算。全程浏览器运行，双语。",
    faqs: [
      { q: "Which units are supported?", en: "Celsius, Fahrenheit, and Kelvin — all three at once.", zh: "摄氏度、华氏度与开尔文——一次性全部换算。" },
      { q: "Is it accurate?", en: "Yes. It uses the standard linear conversion between the three scales.", zh: "准确。采用三种温标之间的标准线性换算。" },
      { q: "Is it free?", en: "Yes, with no sign-up.", zh: "是的，无需注册。" }
    ]
  },
  {
    slug: "wind-speed", tool: "wind",
    enTitle: "Wind Speed Converter", zhTitle: "风速换算器",
    enDesc: "Convert wind speed between m/s, km/h, mph, and knots. All calculations run locally.",
    zhDesc: "在 m/s、km/h、mph 与节之间换算风速。所有计算均本地完成。",
    faqs: [
      { q: "Which units are supported?", en: "Meters per second, kilometers per hour, miles per hour, and knots.", zh: "米每秒、公里每小时、英里每小时与节。" },
      { q: "How accurate is 1 m/s?", en: "1 m/s equals 3.6 km/h, about 2.237 mph, or 1.944 knots.", zh: "1 m/s 等于 3.6 km/h、约 2.237 mph 或 1.944 节。" },
      { q: "Is it free?", en: "Yes, no account needed.", zh: "是的，无需注册。" }
    ]
  },
  {
    slug: "feels-like", tool: "feels",
    enTitle: "Feels-Like Temperature", zhTitle: "体感温度计算器",
    enDesc: "Combine temperature, humidity, and wind into one feels-like value using heat-index and wind-chill models.",
    zhDesc: "结合温度、湿度与风速，用酷热指数与风寒模型得出单一体感温度。",
    faqs: [
      { q: "How does it choose the model?", en: "Hot conditions use the heat-index model; cold and windy use wind chill; otherwise it shows the air temperature.", zh: "炎热时采用酷热指数模型；寒冷且有风时采用风寒模型；否则显示气温。" },
      { q: "Does it need internet?", en: "No. Everything runs locally in your browser.", zh: "不需要。所有计算都在你的浏览器本地完成。" },
      { q: "Is it free?", en: "Yes, with no sign-up.", zh: "是的，无需注册。" }
    ]
  },
  {
    slug: "pressure-altitude", tool: "press",
    enTitle: "Pressure & Altitude Calculator", zhTitle: "气压与海拔计算器",
    enDesc: "Convert altitude to atmospheric pressure (or pressure to altitude) with the barometric formula. 100% local.",
    zhDesc: "用气压公式在海拔与大气压之间换算（或气压换算海拔）。全程本地。",
    faqs: [
      { q: "Which formula is used?", en: "The barometric formula with a temperature correction, matching the standard atmosphere model.", zh: "采用带温度修正的气压公式，符合标准大气模型。" },
      { q: "What is standard pressure at sea level?", en: "At 0 m and 15 °C the standard pressure is 1013.25 hPa.", zh: "在 0 米、15°C 时标准气压为 1013.25 hPa。" },
      { q: "Is it free?", en: "Yes, no account needed.", zh: "是的，无需注册。" }
    ]
  }
];

const i18nScript = `<script>
(function(){
  function applyLang(l){document.documentElement.lang=l;document.documentElement.setAttribute('data-lang',l);document.querySelectorAll('[data-en]').forEach(function(el){el.textContent=el.getAttribute(l==='zh-CN'?'data-zh':'data-en');});document.querySelectorAll('#lang-seg button').forEach(function(b){b.classList.toggle('active',b.dataset.langSet===l);});try{localStorage.setItem('weathora-lang',l);}catch(e){}}
  document.querySelectorAll('#lang-seg button').forEach(function(b){b.addEventListener('click',function(){applyLang(b.dataset.langSet);});});
  try{applyLang(localStorage.getItem('weathora-lang')||'en');}catch(e){applyLang('en');}
  var t=document.getElementById('theme-toggle');if(t){t.addEventListener('click',function(){var c=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',c);try{localStorage.setItem('weathora-theme',c);}catch(e){}});}
  try{document.documentElement.setAttribute('data-theme',localStorage.getItem('weathora-theme')||'light');}catch(e){}
})();
</script>`;

const relatedOf = (slug) => TOOLS.filter((t) => t.slug !== slug).map((t) =>
  `<a href="${t.slug}.html">${t.enTitle} · ${t.zhTitle}</a>`).join("");

TOOLS.forEach((t) => {
  const webpage = {
    "@context": "https://schema.org", "@type": "WebPage",
    "name": t.enTitle + " — Weathora",
    "url": "https://weathora.com/tools/" + t.slug + ".html",
    "description": t.enDesc,
    "inLanguage": ["en", "zh-CN"],
    "isPartOf": { "@type": "WebSite", "name": "Weathora", "url": "https://weathora.com/" }
  };
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": t.faqs.map((f) => ({
      "@type": "Question", "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.en }
    }))
  };
  const faqHtml = t.faqs.map((f) =>
    `<details><summary>${f.q}</summary><p data-en="${f.en.replace(/"/g, "&quot;")}" data-zh="${f.zh}">${f.en}</p></details>`).join("\n      ");

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light" data-lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t.enTitle} — Free Online Tool | Weathora</title>
<meta name="description" content="${t.enDesc}" />
<meta name="robots" content="index,follow" />
<link rel="canonical" href="https://weathora.com/tools/${t.slug}.html" />
<link rel="alternate" hreflang="en" href="https://weathora.com/tools/${t.slug}.html" />
<link rel="alternate" hreflang="zh-CN" href="https://weathora.com/tools/${t.slug}.html" />
<link rel="alternate" hreflang="x-default" href="https://weathora.com/tools/${t.slug}.html" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${t.enTitle} — Weathora" />
<meta property="og:description" content="${t.enDesc}" />
<meta property="og:url" content="https://weathora.com/tools/${t.slug}.html" />
<meta property="og:image" content="https://weathora.com/og-image.png" />
<link rel="icon" type="image/svg+xml" href="../favicon.svg" />
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">${JSON.stringify(webpage)}</script>
<script type="application/ld+json">${JSON.stringify(faq)}</script>
</head>
<body>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="../index.html"><span class="logo">W</span><span>Weathora</span></a>
    <div class="header-actions">
      <div class="seg" id="lang-seg" role="group" aria-label="Language">
        <button data-lang-set="en" class="active">EN</button>
        <button data-lang-set="zh-CN">中文</button>
      </div>
      <button class="toggle-btn" id="theme-toggle" aria-label="Toggle theme">🌓 <span data-en="Theme" data-zh="主题">Theme</span></button>
    </div>
  </div>
</header>
<main class="wrap">
  <section class="landing-hero">
    <a class="backlink" href="../index.html" data-en="← All Weathora tools" data-zh="← 返回 Weathora 全部工具">← All Weathora tools</a>
    <h1>${t.enTitle}</h1>
    <p data-en="${t.enDesc.replace(/"/g, "&quot;")}" data-zh="${t.zhDesc}">${t.enDesc}</p>
    <a class="btn" href="../index.html#tool-${t.tool}" data-en="Open ${t.enTitle} tool →" data-zh="打开${t.zhTitle}工具 →">Open ${t.enTitle} tool →</a>
  </section>
  <section>
    <h3 data-en="Related tools" data-zh="相关工具">Related tools</h3>
    <div class="related">${relatedOf(t.slug)}</div>
  </section>
  <section class="faq">
    <h3 data-en="Frequently asked questions" data-zh="常见问题">Frequently asked questions</h3>
      ${faqHtml}
  </section>
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <div class="brand" style="margin-bottom:10px"><span class="logo">W</span><span>Weathora</span></div>
        <p class="priv-safe" data-en="A free, bilingual weather & atmospheric toolkit. Everything runs in your browser — your numbers never leave your device." data-zh="免费、双语的天气与大气工具集。所有计算都在你的浏览器中完成——数值绝不离开你的设备。">A free, bilingual weather & atmospheric toolkit. Everything runs in your browser — your numbers never leave your device.</p>
      </div>
      <div>
        <h4 data-en="Weather tools" data-zh="天气工具">Weather tools</h4>
        <ul>
          <li><a href="../index.html#tool-heat" data-en="Heat Index" data-zh="酷热指数">Heat Index</a></li>
          <li><a href="../index.html#tool-chill" data-en="Wind Chill" data-zh="风寒指数">Wind Chill</a></li>
          <li><a href="../index.html#tool-dew" data-en="Dew Point" data-zh="露点">Dew Point</a></li>
          <li><a href="../index.html#tool-hum" data-en="Humidex" data-zh="湿度指数">Humidex</a></li>
        </ul>
      </div>
      <div>
        <h4 data-en="Legal" data-zh="法律">Legal</h4>
        <ul>
          <li><a href="../privacy.html" data-en="Privacy Policy" data-zh="隐私政策">Privacy Policy</a></li>
          <li><a href="../index.html" data-en="All tools" data-zh="全部工具">All tools</a></li>
          <li><a href="https://www.amazon.com/s?k=weather+station&tag=weathora-20" target="_blank" rel="sponsored nofollow noopener" data-en="Weather stations on Amazon" data-zh="Amazon 上的气象站">Weather stations on Amazon</a></li>
        </ul>
      </div>
    </div>
    <p class="disclosure" data-en="As an Amazon Associate, Weathora earns from qualifying purchases. Some links may be affiliate links. All calculations are done locally in your browser; no data is uploaded to our servers. Weathora is an independent tool and is not affiliated with any weather-service brand or manufacturer." data-zh="作为 Amazon Associates 会员，Weathora 可从符合条件的购买中获得收益。部分链接可能为联盟链接。所有计算均在你的浏览器本地完成，数据不会上传到我们的服务器。Weathora 是独立工具，与任何气象服务品牌或厂商无隶属关系。">As an Amazon Associate, Weathora earns from qualifying purchases. Some links may be affiliate links. All calculations are done locally in your browser; no data is uploaded to our servers. Weathora is an independent tool and is not affiliated with any weather-service brand or manufacturer.</p>
    <p class="copyright" data-en="© 2026 Weathora. Last updated: 2026-07-27." data-zh="© 2026 Weathora。最后更新：2026-07-27。">© 2026 Weathora. Last updated: 2026-07-27.</p>
  </div>
</footer>
${i18nScript}
</body>
</html>
`;
  fs.writeFileSync(path.join(DIR, "tools", t.slug + ".html"), html);
  console.log("wrote tools/" + t.slug + ".html");
});
console.log("DONE: " + TOOLS.length + " landing pages");
