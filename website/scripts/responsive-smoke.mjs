// Browser smoke tests for NEVER's production build.
// Run from website/: node scripts/responsive-smoke.mjs
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const viewports = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];
let failures = 0;
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    for (const route of ["/", "/explore"]) {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const response = await page.goto(`http://127.0.0.1:3000${route}`, { waitUntil: "networkidle" });
      const report = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        heading: !!document.querySelector("h1"),
        mainTarget: !!document.querySelector("#main-content"),
      }));
      const valid = response?.status() === 200 && report.heading && report.mainTarget &&
        report.scrollWidth <= report.clientWidth + 1 && errors.length === 0;
      console.log(`${valid ? "PASS" : "FAIL"} ${viewport.width}x${viewport.height} ${route}: ${JSON.stringify({ status: response?.status(), ...report, errors })}`);
      if (!valid) failures++;
      if (route === "/explore") {
        const choice = page.getByRole("button", { name: /Monolith/ });
        await choice.click();
        await page.waitForTimeout(550);
        const selected = await choice.getAttribute("aria-pressed");
        console.log(`${selected === "true" ? "PASS" : "FAIL"} material world selection at ${viewport.width}px`);
        if (selected !== "true") failures++;
      }
    }
    if (viewport.width <= 430) {
      await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });
      const toggle = page.getByRole("button", { name: "Open navigation" });
      await toggle.click();
      const menuOpened = await page.getByRole("button", { name: "Close navigation" }).getAttribute("aria-expanded") === "true"
        && await page.getByRole("navigation", { name: "Mobile navigation" }).isVisible();
      await page.keyboard.press("Escape");
      const menuClosed = await page.getByRole("button", { name: "Open navigation" }).getAttribute("aria-expanded") === "false";
      console.log(`${menuOpened && menuClosed ? "PASS" : "FAIL"} mobile navigation and Escape at ${viewport.width}px`);
      if (!menuOpened || !menuClosed) failures++;
    }
    if (viewport.width === 390 || viewport.width === 1440) {
      const motionPage = await browser.newPage({ viewport, reducedMotion: "no-preference" });
      const motionErrors = [];
      motionPage.on("pageerror", (error) => motionErrors.push(error.message));
      await motionPage.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded", timeout: 15000 });
      await motionPage.locator("#experience[data-enhanced=\"true\"]").waitFor({ state: "attached", timeout: 15000 });
      const story = motionPage.locator("#experience");
      await story.scrollIntoViewIfNeeded();
      await motionPage.waitForTimeout(450);
      const enhanced = await story.getAttribute("data-enhanced") === "true";
      const chapters = await story.getByRole("button").count();
      const normalMotionWorks = enhanced && chapters === 4 && motionErrors.length === 0;
      console.log(`${normalMotionWorks ? "PASS" : "FAIL"} animated ScrollStory initialization at ${viewport.width}px: ${JSON.stringify({ enhanced, chapters, motionErrors })}`);
      if (!normalMotionWorks) failures++;
      await motionPage.close();
    }
    await page.close();
  }
} finally {
  await browser.close();
}
if (failures) {
  console.error(`FAILED: ${failures} responsive smoke assertions`);
  process.exitCode = 1;
} else {
  console.log("All responsive smoke assertions passed.");
}
