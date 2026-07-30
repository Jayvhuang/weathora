// Capture review screenshots for Weathora
const fs = require("fs");
const path = require("path");
const { chromium } = require("/Users/jayv/CCAI/网站/node_modules/playwright");

const SITE = "/Users/jayv/CCAI/网站/weathora";
const URL = (p) => "file://" + path.join(SITE, p);
const OUT = path.join(SITE, "screenshots");
fs.mkdirSync(OUT, { recursive: true });

const tools = [
  ["heat", "01-heat-index"],
  ["chill", "02-wind-chill"],
  ["dew", "03-dew-point"],
  ["hum", "04-humidex"],
  ["temp", "05-temperature"],
  ["wind", "06-wind-speed"],
  ["feels", "07-feels-like"],
  ["press", "08-pressure-altitude"]
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(URL("index.html"), { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.Weathora === "object");
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, "00-home.png"), fullPage: true });

  for (const [tool, name] of tools) {
    await page.click(`button.tab[data-tool="${tool}"]`);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, name + ".png"), fullPage: true });
  }

  await page.goto(URL("tools/heat-index.html"), { waitUntil: "load" });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, "09-landing-heat-index.png"), fullPage: true });

  await page.goto(URL("privacy.html"), { waitUntil: "load" });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, "10-privacy.png"), fullPage: true });

  await browser.close();
  console.log("screenshots written to", OUT);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
