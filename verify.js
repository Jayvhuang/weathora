// Weathora verification — Playwright end-to-end + compliance + math-correctness checks
const fs = require("fs");
const path = require("path");
const { chromium } = require("/Users/jayv/CCAI/网站/node_modules/playwright");

const SITE = "/Users/jayv/CCAI/网站/weathora";
const URL = (p) => "file://" + path.join(SITE, p);
const results = [];
const ok = (name, pass, info = "") => {
  results.push({ name, pass, info });
  console.log((pass ? "PASS " : "FAIL ") + name + (info ? " — " + info : ""));
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

  await page.goto(URL("index.html"), { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.Weathora === "object", { timeout: 15000 });

  /* ---- 1. Heat Index ---- */
  await page.click('button.tab[data-tool="heat"]');
  await page.waitForTimeout(120);
  await page.fill("#heat-t", "32"); await page.fill("#heat-rh", "60"); await page.selectOption("#heat-tu", "C");
  await page.waitForTimeout(100);
  const heat = await page.evaluate(() => ({
    out: document.getElementById("heat-out").textContent,
    cat: document.getElementById("heat-cat").textContent,
    diff: document.getElementById("heat-diff").textContent,
    fn: window.Weathora.heatIndex(89.6, 60), fnHi: window.Weathora.heatIndex(96, 75)
  }));
  ok("Heat: 32C/60% -> 37.1 °C", heat.out === "37.1 °C", heat.out);
  ok("Heat: risk Extreme caution", /Extreme caution/.test(heat.cat), heat.cat);
  ok("Heat: diff +5.1 °C", heat.diff === "+5.1 °C", heat.diff);
  ok("Heat: fn 96F/75% ~132F", near(heat.fnHi, 132.1, 0.5), String(heat.fnHi));
  ok("Heat: fn 89.6F/60% ~98.7F", near(heat.fn, 98.7, 0.3), String(heat.fn));

  /* ---- 2. Wind Chill ---- */
  await page.click('button.tab[data-tool="chill"]');
  await page.waitForTimeout(120);
  await page.fill("#chill-t", "0"); await page.fill("#chill-w", "15"); await page.selectOption("#chill-tu", "C"); await page.selectOption("#chill-wu", "kmh");
  await page.waitForTimeout(100);
  const chill = await page.evaluate(() => ({
    out: document.getElementById("chill-out").textContent,
    diff: document.getElementById("chill-diff").textContent,
    fn: window.Weathora.windChill(32, 15 / 1.609344)
  }));
  ok("Chill: 0C/15kmh -> -4.4 °C", chill.out === "-4.4 °C", chill.out);
  ok("Chill: diff -4.4 °C", chill.diff === "-4.4 °C", chill.diff);
  ok("Chill: fn 32F/9.32mph ~24.1F", near(chill.fn, 24.1, 0.3), String(chill.fn));

  /* ---- 3. Dew Point ---- */
  await page.click('button.tab[data-tool="dew"]');
  await page.waitForTimeout(120);
  await page.fill("#dew-t", "25"); await page.fill("#dew-rh", "60"); await page.selectOption("#dew-tu", "C");
  await page.waitForTimeout(100);
  const dew = await page.evaluate(() => ({
    out: document.getElementById("dew-out").textContent,
    cat: document.getElementById("dew-cat").textContent,
    fn: window.Weathora.dewPoint(25, 60)
  }));
  ok("Dew: 25C/60% -> 16.7 °C", dew.out === "16.7 °C", dew.out);
  ok("Dew: comfort Humid", /Humid/.test(dew.cat), dew.cat);
  ok("Dew: fn 25C/60% ~16.7C", near(dew.fn, 16.7, 0.2), String(dew.fn));

  /* ---- 4. Humidex ---- */
  await page.click('button.tab[data-tool="hum"]');
  await page.waitForTimeout(120);
  await page.fill("#hum-t", "30"); await page.fill("#hum-rh", "70"); await page.selectOption("#hum-tu", "C");
  await page.waitForTimeout(100);
  const hum = await page.evaluate(() => {
    const r = window.Weathora.humidex(30, 70);
    return { out: document.getElementById("hum-out").textContent, f: document.getElementById("hum-f").textContent, dp: document.getElementById("hum-dp").textContent, cat: document.getElementById("hum-cat").textContent, humC: r.humidexC, dpC: r.dpC };
  });
  ok("Humidex: 30C/70% -> 41.2 °C", hum.out === "41.2 °C", hum.out);
  ok("Humidex: °F equiv 106.2 °F", hum.f === "106.2 °F", hum.f);
  ok("Humidex: dew point 23.9 °C", hum.dp === "23.9 °C", hum.dp);
  ok("Humidex: discomfort Great discomfort", /Great discomfort/.test(hum.cat), hum.cat);
  ok("Humidex: fn ~41.2C", near(hum.humC, 41.2, 0.2), String(hum.humC));

  /* ---- 5. Temperature converter ---- */
  await page.click('button.tab[data-tool="temp"]');
  await page.waitForTimeout(120);
  await page.fill("#tmp-v", "25"); await page.selectOption("#tmp-from", "C");
  await page.waitForTimeout(100);
  const tmp = await page.evaluate(() => ({
    c: document.getElementById("tmp-c").textContent, f: document.getElementById("tmp-f").textContent, k: document.getElementById("tmp-k").textContent,
    fn: window.Weathora.tempConvert(25, "C")
  }));
  ok("Temp: 25C -> 25 °C", tmp.c === "25 °C", tmp.c);
  ok("Temp: -> 77 °F", tmp.f === "77 °F", tmp.f);
  ok("Temp: -> 298.15 K", tmp.k === "298.15 K", tmp.k);
  ok("Temp: fn correct", near(tmp.fn.f, 77, 1e-6) && near(tmp.fn.k, 298.15, 1e-6));

  /* ---- 6. Wind speed converter ---- */
  await page.click('button.tab[data-tool="wind"]');
  await page.waitForTimeout(120);
  await page.fill("#wnd-v", "10"); await page.selectOption("#wnd-from", "ms");
  await page.waitForTimeout(100);
  const wnd = await page.evaluate(() => ({
    ms: document.getElementById("wnd-ms").textContent, kmh: document.getElementById("wnd-kmh").textContent,
    mph: document.getElementById("wnd-mph").textContent, kt: document.getElementById("wnd-kt").textContent,
    fn: window.Weathora.windConvert(10, "ms")
  }));
  ok("Wind: 10 m/s -> 10 m/s", wnd.ms === "10 m/s", wnd.ms);
  ok("Wind: -> 36 km/h", wnd.kmh === "36 km/h", wnd.kmh);
  ok("Wind: -> 22.4 mph", wnd.mph === "22.4 mph", wnd.mph);
  ok("Wind: -> 19.4 knots", wnd.kt === "19.4 knots", wnd.kt);
  ok("Wind: fn correct", near(wnd.fn.kmh, 36, 0.05) && near(wnd.fn.mph, 22.369, 0.01));

  /* ---- 7. Feels-like ---- */
  await page.click('button.tab[data-tool="feels"]');
  await page.waitForTimeout(120);
  await page.fill("#feels-t", "30"); await page.fill("#feels-rh", "60"); await page.fill("#feels-w", "10");
  await page.selectOption("#feels-tu", "C"); await page.selectOption("#feels-wu", "ms");
  await page.waitForTimeout(100);
  const feels = await page.evaluate(() => ({
    out: document.getElementById("feels-out").textContent, model: document.getElementById("feels-model").textContent, diff: document.getElementById("feels-diff").textContent,
    fn: window.Weathora.feelsLike(30, 60, 10)
  }));
  ok("Feels: 30C/60%/10ms -> 32.8 °C", feels.out === "32.8 °C", feels.out);
  ok("Feels: model Heat Index", /Heat Index/.test(feels.model), feels.model);
  ok("Feels: diff +2.8 °C", feels.diff === "+2.8 °C", feels.diff);
  ok("Feels: fn Heat Index valC ~32.8", feels.fn.model === "Heat Index" && near(feels.fn.valC, 32.8, 0.3), JSON.stringify(feels.fn));

  /* ---- 8. Pressure / Altitude ---- */
  await page.click('button.tab[data-tool="press"]');
  await page.waitForTimeout(120);
  await page.selectOption("#press-mode", "toPress"); await page.waitForTimeout(80);
  await page.fill("#press-alt", "1000"); await page.fill("#press-tc", "15");
  await page.waitForTimeout(100);
  const press = await page.evaluate(() => ({
    pa: document.getElementById("press-paout").textContent, alt: document.getElementById("press-altout").textContent, eq: document.getElementById("press-eq").textContent,
    fnP: window.Weathora.pressureFromAlt(1000, 15), fnA: window.Weathora.altFromPressure(900, 15)
  }));
  ok("Press: 1000m -> 898.7 hPa", press.pa === "898.7 hPa", press.pa);
  ok("Press: alt echo 1000 m", press.alt === "1000 m", press.alt);
  ok("Press: eq 26.5 inHg", press.eq === "26.5 inHg", press.eq);
  ok("Press: fn pressure ~898.7", near(press.fnP.hPa, 898.7, 0.3), String(press.fnP.hPa));
  ok("Press: fn alt 900hPa ~988.5m", near(press.fnA.m, 988.5, 1.0), String(press.fnA.m));
  // altitude mode
  await page.selectOption("#press-mode", "toAlt"); await page.waitForTimeout(80);
  await page.fill("#press-pa", "900"); await page.fill("#press-tc", "15");
  await page.waitForTimeout(100);
  const pressA = await page.evaluate(() => document.getElementById("press-altout").textContent);
  ok("Press: toAlt 900hPa -> 988.5 m", pressA === "988.5 m" || pressA === "989 m", pressA);
  await page.selectOption("#press-mode", "toPress"); await page.waitForTimeout(80);

  /* ---- i18n toggle ---- */
  await page.click('button[data-lang-set="zh-CN"]');
  await page.waitForTimeout(160);
  const zh = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    tab: document.querySelector('#toolnav .tab').textContent.trim()
  }));
  ok("i18n: switches to zh-CN", zh.lang === "zh-CN" && zh.tab === "酷热指数", JSON.stringify(zh));
  await page.click('button[data-lang-set="en"]');
  await page.waitForTimeout(120);

  /* ---- theme toggle ---- */
  await page.click("#theme-toggle");
  await page.waitForTimeout(100);
  const th = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  ok("Theme: toggles to dark", th === "dark", "theme=" + th);

  /* ---- AdSense inert ---- */
  const headHtml = await page.evaluate(() => document.head.innerHTML);
  ok("AdSense placeholder present (commented)", headHtml.includes("ca-pub-XXXXXXXXXXXXXX") && headHtml.includes("adsbygoogle.js"));
  const activeAd = await page.evaluate(() => [...document.scripts].some((s) => s.src.includes("adsbygoogle") || (s.textContent || "").includes("adsbygoogle")));
  ok("AdSense: no active script", activeAd === false);
  const insCount = await page.evaluate(() => document.querySelectorAll("ins.adsbygoogle").length);
  ok("AdSense: no manual <ins> units", insCount === 0);

  /* ---- Amazon Associates ---- */
  const amz = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a")].find((x) => x.href.includes("weathora-20"));
    return a ? { href: a.href, rel: a.rel, text: a.textContent } : null;
  });
  ok("Amazon: affiliate link weathora-20", !!amz && amz.href.includes("weathora-20"), amz ? amz.href : "none");
  ok("Amazon: rel sponsored nofollow noopener", !!amz && amz.rel.includes("sponsored") && amz.rel.includes("nofollow") && amz.rel.includes("noopener"), amz ? amz.rel : "none");
  const disc = await page.evaluate(() => document.body.innerText.includes("Amazon Associate"));
  ok("Amazon: disclosure present", disc);

  /* ---- console errors ---- */
  ok("No console/page errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

  /* ---- privacy.html ---- */
  await page.goto(URL("privacy.html"), { waitUntil: "load" });
  const pv = await page.evaluate(() => ({
    html: document.body.innerHTML,
    scripts: [...document.scripts].map((s) => s.src + (s.textContent || "")).join("|"),
    en: !!document.querySelector('section[lang="en"]'),
    zh: !!document.querySelector('section[lang="zh-CN"]')
  }));
  ok("Privacy: bilingual sections", pv.en && pv.zh);
  ok("Privacy: web beacon (EN+ZH)", /web beacon/i.test(pv.html) && pv.html.includes("网络信标"));
  ok("Privacy: IP address (EN+ZH)", /ip address/i.test(pv.html) && pv.html.includes("IP 地址"));
  ok("Privacy: third-party cookie", /cookie/i.test(pv.html));
  ok("Privacy: Google Partners link", pv.html.includes("google.com/policies/privacy/partners"));
  ok("Privacy: NO script (no ad script)", pv.scripts.trim() === "");

  /* ---- landing pages ---- */
  const slugs = ["heat-index", "wind-chill", "dew-point", "humidex", "temperature-converter", "wind-speed", "feels-like", "pressure-altitude"];
  for (const slug of slugs) {
    await page.goto(URL("tools/" + slug + ".html"), { waitUntil: "load" });
    const r = await page.evaluate(() => {
      const s = [...document.querySelectorAll('script[type="application/ld+json"]')].map((x) => x.textContent).join(" ");
      return { webpage: /"@type":"WebPage"/.test(s), faq: /"@type":"FAQPage"/.test(s), activeAds: [...document.scripts].some((x) => x.src.includes("adsbygoogle")), lang: document.documentElement.lang };
    });
    ok("Landing " + slug + ": WebPage+FAQPage JSON-LD", r.webpage && r.faq);
    ok("Landing " + slug + ": no active ads", !r.activeAds);
  }

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log("\n==== SUMMARY: " + (results.length - failed.length) + "/" + results.length + " passed ====");
  if (failed.length) { console.log("FAILED: " + failed.map((f) => f.name).join("; ")); process.exit(1); }
  else console.log("ALL PASS");
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
