/* Weathora — weather & atmospheric toolkit. Pure math exposed on window.Weathora. */
(function () {
  "use strict";
  const W = {};
  const r1 = (n) => Math.round(n * 10) / 10;
  const r2 = (n) => Math.round(n * 100) / 100;

  /* ---------- pure formulas (verified) ---------- */

  // Heat Index (NWS Rothfusz). Tf in °F, RH in %.
  W.heatIndex = function (Tf, RH) {
    Tf = +Tf; RH = +RH;
    const simple = 0.5 * (Tf + 61 + (Tf - 68) * 1.2 + RH * 0.094);
    let hi = (simple + Tf) / 2;
    if (hi >= 80) {
      hi = -42.379 + 2.04901523 * Tf + 10.14333127 * RH - 0.22475541 * Tf * RH
        - 0.00683783 * Tf * Tf - 0.05481717 * RH * RH + 0.00122874 * Tf * Tf * RH
        + 0.00085282 * Tf * RH * RH - 0.00000199 * Tf * Tf * RH * RH;
      if (RH < 13 && Tf >= 80 && Tf <= 112) hi -= ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(Tf - 95)) / 17);
      if (RH > 85 && Tf >= 80 && Tf <= 87) hi += ((RH - 85) / 10) * ((87 - Tf) / 5);
    }
    return hi;
  };

  // Wind Chill (NWS). Tf in °F, Vmph in mph.
  W.windChill = function (Tf, Vmph) {
    Tf = +Tf; Vmph = +Vmph;
    return 35.74 + 0.6215 * Tf - 35.75 * Math.pow(Vmph, 0.16) + 0.4275 * Tf * Math.pow(Vmph, 0.16);
  };

  // Dew Point (Magnus). Tc in °C, RH in %.
  W.dewPoint = function (Tc, RH) {
    Tc = +Tc; RH = +RH;
    const a = 17.625, b = 243.04;
    const g = Math.log(RH / 100) + (a * Tc) / (b + Tc);
    return (b * g) / (a - g);
  };

  // Humidex. Tc in °C, RH in %. Returns { humidexC, dpC }.
  W.humidex = function (Tc, RH) {
    Tc = +Tc; RH = +RH;
    const dp = W.dewPoint(Tc, RH);
    const e = 6.11 * Math.exp(5417.753 * (1 / 273.16 - 1 / (dp + 273.15)));
    return { humidexC: Tc + (5 / 9) * (e - 10), dpC: dp };
  };

  // Temperature converter. Returns { c, f, k }.
  W.tempConvert = function (v, from) {
    v = +v; let c;
    if (from === "C") c = v; else if (from === "F") c = (v - 32) * 5 / 9; else c = v - 273.15;
    return { c, f: c * 9 / 5 + 32, k: c + 273.15 };
  };

  // Wind converter. Returns { ms, kmh, mph, kt }.
  W.windConvert = function (v, from) {
    v = +v; let ms;
    if (from === "ms") ms = v; else if (from === "kmh") ms = v / 3.6;
    else if (from === "mph") ms = v / 2.2369362921; else ms = v / 1.9438444925;
    return { ms, kmh: ms * 3.6, mph: ms * 2.2369362921, kt: ms * 1.9438444925 };
  };

  // Feels-like. Tc in °C, RH %, Vms in m/s. Returns { valC, valF, model }.
  W.feelsLike = function (Tc, RH, Vms) {
    Tc = +Tc; RH = +RH; Vms = +Vms;
    const Tf = Tc * 9 / 5 + 32, Vmph = Vms * 2.2369362921;
    const hi = W.heatIndex(Tf, RH), wc = W.windChill(Tf, Vmph);
    let model, valF;
    if (Tc >= 27) { model = "Heat Index"; valF = hi; }
    else if (Tc <= 10 && Vms >= 1.34112) { model = "Wind Chill"; valF = wc; }
    else { model = "Air temperature"; valF = Tf; }
    return { valF, valC: (valF - 32) * 5 / 9, model };
  };

  // Barometric pressure / altitude. P0=1013.25 hPa, L=0.0065, exp=5.25588.
  const P0 = 1013.25, L = 0.0065, EXP = 5.25588;
  W.pressureFromAlt = function (h, Tc) {
    Tc = +Tc; const baseK = 273.15 + Tc;
    const ratio = 1 - L * h / baseK;
    const P = P0 * Math.pow(ratio, EXP);
    return { hPa: P, inHg: P * 0.0295300, mmHg: P * 0.750062 };
  };
  W.altFromPressure = function (P, Tc) {
    Tc = +Tc; const baseK = 273.15 + Tc;
    const ratio = Math.pow(P / P0, 1 / EXP);
    const h = baseK / L * (1 - ratio);
    return { m: h, ft: h * 3.28084 };
  };

  /* ---------- UI wiring ---------- */
  const $ = (id) => document.getElementById(id);
  const num = (id) => parseFloat($(id).value);
  const fin = (x) => typeof x === "number" && isFinite(x);

  function fmtC(valC, unitId) {
    const u = $(unitId).value;
    return (u === "C" ? r1(valC) : r1(valC * 9 / 5 + 32)) + (u === "C" ? " °C" : " °F");
  }
  function fmtDiff(diffC, unitId) {
    const u = $(unitId).value;
    const d = u === "C" ? diffC : diffC * 9 / 5;
    return (d >= 0 ? "+" : "") + r1(d) + (u === "C" ? " °C" : " °F");
  }
  function windToMs(v, unit) {
    if (unit === "ms") return v;
    if (unit === "kmh") return v / 3.6;
    if (unit === "mph") return v / 2.2369362921;
    return v / 1.9438444925; // knots
  }
  function dash(id) { $(id).textContent = "—"; }
  function cat(el, en, zh) {
    el.textContent = document.documentElement.getAttribute("data-lang") === "zh-CN" ? zh : en;
  }
  function heatCat(hiF) {
    if (hiF < 80) return ["No added heat stress", "无明显额外热压力"];
    if (hiF < 91) return ["Caution", "注意"];
    if (hiF < 104) return ["Extreme caution", "极度注意"];
    if (hiF < 125) return ["Danger", "危险"];
    return ["Extreme danger", "极度危险"];
  }
  function dewCat(dpC) {
    if (dpC < 10) return ["Dry", "干燥"];
    if (dpC < 16) return ["Comfortable", "舒适"];
    if (dpC < 18) return ["Humid", "潮湿"];
    return ["Very humid", "非常潮湿"];
  }
  function humCat(humC) {
    if (humC < 30) return ["Little discomfort", "基本无不适"];
    if (humC < 40) return ["Some discomfort", "略有不适"];
    if (humC < 45) return ["Great discomfort", "明显不适"];
    return ["Dangerous", "危险"];
  }
  function modelCat(m) {
    if (m === "Heat Index") return ["Heat Index", "酷热指数"];
    if (m === "Wind Chill") return ["Wind Chill", "风寒指数"];
    return ["Air temperature", "气温"];
  }

  function computeHeat() {
    const t = num("heat-t"), rh = num("heat-rh"), u = $("heat-tu").value;
    const tC = u === "F" ? (t - 32) * 5 / 9 : t;
    if (!fin(t) || !fin(rh) || rh < 0 || rh > 100 || tC < -60 || tC > 70) { dash("heat-out"); dash("heat-cat"); dash("heat-diff"); return; }
    const Tf = u === "F" ? t : t * 9 / 5 + 32;
    const hiF = W.heatIndex(Tf, rh), hiC = (hiF - 32) * 5 / 9, airC = tC;
    $("heat-out").textContent = fmtC(hiC, "heat-tu");
    cat($("heat-cat"), ...heatCat(hiF));
    $("heat-diff").textContent = fmtDiff(hiC - airC, "heat-tu");
  }
  function computeChill() {
    const t = num("chill-t"), w = num("chill-w"), u = $("chill-tu").value, wu = $("chill-wu").value;
    const tC = u === "F" ? (t - 32) * 5 / 9 : t;
    if (!fin(t) || !fin(w) || tC < -60 || tC > 50) { dash("chill-out"); dash("chill-diff"); return; }
    const Tf = u === "F" ? t : t * 9 / 5 + 32;
    const wcF = W.windChill(Tf, windToMs(w, wu) * 2.2369362921), wcC = (wcF - 32) * 5 / 9;
    $("chill-out").textContent = fmtC(wcC, "chill-tu");
    $("chill-diff").textContent = fmtDiff(wcC - tC, "chill-tu");
  }
  function computeDew() {
    const t = num("dew-t"), rh = num("dew-rh"), u = $("dew-tu").value;
    const tC = u === "F" ? (t - 32) * 5 / 9 : t;
    if (!fin(t) || !fin(rh) || rh < 0 || rh > 100 || tC < -60 || tC > 70) { dash("dew-out"); dash("dew-cat"); return; }
    const dpC = W.dewPoint(tC, rh);
    $("dew-out").textContent = fmtC(dpC, "dew-tu");
    cat($("dew-cat"), ...dewCat(dpC));
  }
  function computeHum() {
    const t = num("hum-t"), rh = num("hum-rh"), u = $("hum-tu").value;
    const tC = u === "F" ? (t - 32) * 5 / 9 : t;
    if (!fin(t) || !fin(rh) || rh < 0 || rh > 100 || tC < -60 || tC > 70) { dash("hum-out"); dash("hum-f"); dash("hum-dp"); dash("hum-cat"); return; }
    const r = W.humidex(tC, rh);
    $("hum-out").textContent = r1(r.humidexC) + " °C";
    $("hum-f").textContent = r1(r.humidexC * 9 / 5 + 32) + " °F";
    $("hum-dp").textContent = r1(r.dpC) + " °C";
    cat($("hum-cat"), ...humCat(r.humidexC));
  }
  function computeTemp() {
    const v = num("tmp-v"), from = $("tmp-from").value;
    if (!fin(v)) { dash("tmp-c"); dash("tmp-f"); dash("tmp-k"); return; }
    const r = W.tempConvert(v, from);
    $("tmp-c").textContent = r1(r.c) + " °C";
    $("tmp-f").textContent = r1(r.f) + " °F";
    $("tmp-k").textContent = r2(r.k) + " K";
  }
  function computeWind() {
    const v = num("wnd-v"), from = $("wnd-from").value;
    if (!fin(v)) { dash("wnd-ms"); dash("wnd-kmh"); dash("wnd-mph"); dash("wnd-kt"); return; }
    const r = W.windConvert(v, from);
    $("wnd-ms").textContent = r1(r.ms) + " m/s";
    $("wnd-kmh").textContent = r1(r.kmh) + " km/h";
    $("wnd-mph").textContent = r1(r.mph) + " mph";
    $("wnd-kt").textContent = r1(r.kt) + " knots";
  }
  function computeFeels() {
    const t = num("feels-t"), rh = num("feels-rh"), w = num("feels-w"), u = $("feels-tu").value, wu = $("feels-wu").value;
    const tC = u === "F" ? (t - 32) * 5 / 9 : t;
    if (!fin(t) || !fin(rh) || !fin(w) || rh < 0 || rh > 100 || tC < -60 || tC > 70) { dash("feels-out"); dash("feels-model"); dash("feels-diff"); return; }
    const r = W.feelsLike(tC, rh, windToMs(w, wu));
    $("feels-out").textContent = fmtC(r.valC, "feels-tu");
    cat($("feels-model"), ...modelCat(r.model));
    $("feels-diff").textContent = fmtDiff(r.valC - tC, "feels-tu");
  }
  function computePress() {
    const tc = num("press-tc");
    if (!fin(tc)) { dash("press-paout"); dash("press-altout"); dash("press-eq"); return; }
    if ($("press-mode").value === "toPress") {
      const h = num("press-alt");
      if (!fin(h)) { dash("press-paout"); dash("press-altout"); dash("press-eq"); return; }
      const P = W.pressureFromAlt(h, tc);
      $("press-paout").textContent = r1(P.hPa) + " hPa";
      $("press-altout").textContent = r1(h) + " m";
      $("press-eq").textContent = r1(P.inHg) + " inHg";
    } else {
      const p = num("press-pa");
      if (!fin(p)) { dash("press-paout"); dash("press-altout"); dash("press-eq"); return; }
      const a = W.altFromPressure(p, tc);
      $("press-paout").textContent = r1(p) + " hPa";
      $("press-altout").textContent = r1(a.m) + " m";
      $("press-eq").textContent = r1(a.ft) + " ft";
    }
  }
  function computeAll() {
    computeHeat(); computeChill(); computeDew(); computeHum();
    computeTemp(); computeWind(); computeFeels(); computePress();
  }

  function bindAll(ids, fn) {
    ids.forEach((id) => { const el = $(id); if (el) { el.addEventListener("input", fn); el.addEventListener("change", fn); } });
  }
  bindAll(["heat-t", "heat-rh", "heat-tu"], computeHeat);
  bindAll(["chill-t", "chill-w", "chill-tu", "chill-wu"], computeChill);
  bindAll(["dew-t", "dew-rh", "dew-tu"], computeDew);
  bindAll(["hum-t", "hum-rh", "hum-tu"], computeHum);
  bindAll(["tmp-v", "tmp-from"], computeTemp);
  bindAll(["wnd-v", "wnd-from"], computeWind);
  bindAll(["feels-t", "feels-rh", "feels-w", "feels-tu", "feels-wu"], computeFeels);
  bindAll(["press-alt", "press-pa", "press-tc"], computePress);
  $("press-mode").addEventListener("change", () => {
    const toPress = $("press-mode").value === "toPress";
    $("press-alt-row").style.display = toPress ? "" : "none";
    $("press-press-row").style.display = toPress ? "none" : "";
    computePress();
  });

  /* ---------- i18n + theme ---------- */
  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-lang", lang);
    document.querySelectorAll("[data-en]").forEach((el) => { el.textContent = el.getAttribute(lang === "zh-CN" ? "data-zh" : "data-en"); });
    document.querySelectorAll("#lang-seg button").forEach((b) => b.classList.toggle("active", b.dataset.langSet === lang));
    try { localStorage.setItem("weathora-lang", lang); } catch (e) {}
  }
  document.querySelectorAll("#lang-seg button").forEach((b) => b.addEventListener("click", () => { applyLang(b.dataset.langSet); computeAll(); }));
  let savedLang = "en";
  try { savedLang = localStorage.getItem("weathora-lang") || "en"; } catch (e) {}
  applyLang(savedLang);

  const themeToggle = $("theme-toggle");
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("weathora-theme", t); } catch (e) {}
  }
  themeToggle.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(cur);
  });
  let savedTheme = "light";
  try { savedTheme = localStorage.getItem("weathora-theme") || "light"; } catch (e) {}
  applyTheme(savedTheme);

  document.querySelectorAll("#toolnav .tab").forEach((btn) => btn.addEventListener("click", () => {
    const t = btn.dataset.tool;
    document.querySelectorAll("#toolnav .tab").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".tool-panel").forEach((p) => p.classList.toggle("active", p.dataset.tool === t));
  }));

  computeAll();
  window.Weathora = W;
})();
