"use strict";

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = (process.env.SMOKE_BASE_URL || "https://sur-realista.vercel.app").replace(/\/$/, "");
const password = process.env.SMOKE_PASSWORD;

if (!password) {
  console.error("SMOKE_PASSWORD is required");
  process.exit(2);
}

const target = {
  region: "Metropolitana",
  fileName: "Santa Rita.kmz",
  kmzId: "0ffdeeff-86fa-46ba-bd28-d0d2f2100b63",
  rol: "16302-19-28",
};

const evidenceDir = "test-results/cloud-browser";
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const errors = [];

function escapeRegex(value) {
  return value.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
}

async function login(context, viewport) {
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.goto(baseURL + "/campos", { waitUntil: "domcontentloaded", timeout: 30000 });
  const passwordInput = page.locator("#password");
  if (await passwordInput.isVisible().catch(() => false)) {
    await passwordInput.fill(password);
    await page.getByRole("button", { name: "Ingresar" }).click();
  }
  await page.getByText("Colección de campos").waitFor({ state: "visible", timeout: 30000 });
  return page;
}

async function measure(page) {
  return page.evaluate(() => {
    const shell = document.querySelector(".campos-desktop-shell");
    const panelCandidates = Array.from(document.querySelectorAll('[role="tabpanel"]'));
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const sidebar = document.querySelector("aside");
    const body = document.body;
    const html = document.documentElement;

    const box = (element) => element ? {
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      rect: (() => {
        const r = element.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      })(),
    } : null;

    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        bodyWidth: body.scrollWidth,
        bodyHeight: body.scrollHeight,
        htmlWidth: html.scrollWidth,
        htmlHeight: html.scrollHeight,
        horizontalOverflow: Math.max(body.scrollWidth, html.scrollWidth) > innerWidth,
      },
      shell: box(shell),
      sidebar: box(sidebar),
      tabs: tabs.map((el) => ({
        text: (el.textContent || "").trim(),
        active: el.getAttribute("data-state"),
        ...box(el),
      })),
      panels: panelCandidates.map((el) => ({
        hidden: el.hidden,
        text: (el.textContent || "").trim().slice(0, 700),
        ...box(el),
      })),
      buttons: document.querySelectorAll(".campos-desktop-shell button").length,
      visibleTextLength: (body.innerText || "").length,
    };
  });
}

async function clickTarget(page) {
  const aside = page.locator("aside").filter({ hasText: "Colección de campos" }).first();
  const regionButton = aside.getByRole("button", { name: new RegExp(target.region, "i") }).first();
  await regionButton.waitFor({ state: "visible", timeout: 30000 });
  const regionRow = regionButton.locator("xpath=..");
  const checkbox = regionRow.locator("button").first();
  const checked = await checkbox.getAttribute("data-state");
  if (checked !== "checked") await checkbox.click();

  const fileButton = aside.getByRole("button", { name: new RegExp(escapeRegex(target.fileName), "i") }).first();
  await fileButton.waitFor({ state: "visible", timeout: 30000 });
  await fileButton.click();
  await page.waitForTimeout(3000);
  await page.getByText(new RegExp(escapeRegex(target.rol))).first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

try {
  const page = await login(context, { width: 1440, height: 900 });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: evidenceDir + "/campos-density-overview-1440.png", fullPage: false });
  const overview = await measure(page);

  await clickTarget(page);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: evidenceDir + "/campos-density-detail-1440.png", fullPage: false });
  const selected1440 = await measure(page);

  const tabLabels = await page.locator('[role="tab"]').allTextContents();
  const tabShots = [];
  for (let index = 0; index < tabLabels.length; index += 1) {
    const tab = page.locator('[role="tab"]').nth(index);
    if (!(await tab.isVisible().catch(() => false))) continue;
    await tab.click();
    await page.waitForTimeout(700);
    const safe = (tabLabels[index] || ("tab-" + (index + 1))).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || ("tab-" + (index + 1));
    const path = evidenceDir + "/campos-density-tab-" + (index + 1) + "-" + safe + ".png";
    await page.screenshot({ path, fullPage: false });
    tabShots.push({ label: tabLabels[index], path });
  }

  await page.setViewportSize({ width: 1180, height: 820 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: evidenceDir + "/campos-density-detail-1180.png", fullPage: false });
  const selected1180 = await measure(page);

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: evidenceDir + "/campos-density-detail-1024.png", fullPage: false });
  const selected1024 = await measure(page);

  const report = {
    target,
    url: page.url(),
    pageErrors: errors,
    overview,
    selected1440,
    selected1180,
    selected1024,
    tabShots,
  };
  await writeFile(evidenceDir + "/campos-density-metrics.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}

if (errors.length) {
  console.error("Page errors:", errors);
  process.exit(1);
}
