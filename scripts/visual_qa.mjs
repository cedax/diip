import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const baseUrl = "http://127.0.0.1:2560";
const output = new URL("../.qa/", import.meta.url);
await mkdir(output, { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});

async function review(name, viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.screenshot({ path: new URL(`login-${name}.png`, output).pathname.slice(1), fullPage: true });
  await page.getByRole("button", { name: "Entrar al sistema" }).click();
  await page.getByRole("heading", { name: /Buenos días/ }).waitFor();
  await page.screenshot({ path: new URL(`dashboard-${name}.png`, output).pathname.slice(1), fullPage: true });
  const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  if (viewport.width < 700) {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("button", { name: "Registros" }).click();
  } else {
    await page.getByRole("button", { name: "Registros" }).click();
  }
  await page.getByRole("heading", { name: "Registros de asistencia" }).waitFor();
  await page.screenshot({ path: new URL(`registros-${name}.png`, output).pathname.slice(1), fullPage: true });
  await context.close();
  return { name, overflow, errors };
}

const results = [];
results.push(await review("desktop", { width: 1440, height: 1000 }));
results.push(await review("mobile", { width: 390, height: 844 }));
const manifestResponse = await fetch(`${baseUrl}/manifest.webmanifest`);
const serviceWorkerResponse = await fetch(`${baseUrl}/sw.js`);
console.log(JSON.stringify({
  results,
  manifest: { ok: manifestResponse.ok, value: await manifestResponse.json() },
  serviceWorker: { ok: serviceWorkerResponse.ok, contentType: serviceWorkerResponse.headers.get("content-type") },
}, null, 2));
await browser.close();
