#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const options = parseArgs(process.argv.slice(2));

if (options.help || !options.input) {
  printUsage();
  process.exit(options.help ? 0 : 1);
}

const inputPath = path.resolve(options.input);
if (!existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const viewport = parseViewport(options.viewport);
const outputDirectory = path.resolve(
  options.out ?? `${path.basename(inputPath, path.extname(inputPath))}-qa`,
);

const playwright = loadPlaywright();

await mkdir(outputDirectory, { recursive: true });

const consoleErrors = [];
const pageErrors = [];
const requestFailures = [];
const screenshots = [];
const overflowWarnings = [];
let browser;

try {
  try {
    browser = await playwright.chromium.launch();
  } catch (error) {
    console.error("Playwright is installed, but Chromium could not be launched.");
    console.error("Run the dependency preflight and ask the user for permission to install anything it reports missing:");
    console.error("  node scripts/check-deps.mjs");
    console.error(error.message);
    process.exit(2);
  }
  const page = await browser.newPage({ viewport });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("requestfailed", (request) => {
    const url = request.url();
    if (!url.startsWith("data:")) {
      requestFailures.push({
        url,
        errorText: request.failure()?.errorText ?? "unknown request failure",
      });
    }
  });

  await page.goto(pathToFileURL(inputPath).href, {
    waitUntil: "networkidle",
    timeout: options.timeout,
  });

  await page.waitForFunction(
    () => window.Reveal && typeof window.Reveal.getSlides === "function",
    null,
    { timeout: options.timeout },
  );

  await page
    .waitForFunction(() => !window.Reveal.isReady || window.Reveal.isReady(), null, {
      timeout: options.timeout,
    })
    .catch(() => undefined);

  await page.addStyleTag({
    content: `
      .reveal .slides,
      .reveal .slides section {
        transition: none !important;
      }
    `,
  });
  await page.evaluate(() => {
    window.Reveal.configure({ transition: "none", backgroundTransition: "none" });
  });

  const slideStates = await page.evaluate(() => {
    const seen = new Set();
    return Array.from(window.Reveal.getSlides())
      .map((slide) => window.Reveal.getIndices(slide))
      .map((indices) => ({
        horizontal: indices.h ?? 0,
        vertical: indices.v ?? 0,
      }))
      .filter((state) => {
        const key = `${state.horizontal}:${state.vertical}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  });

  if (slideStates.length === 0) {
    throw new Error("No reveal.js slides were found.");
  }

  const placeholderMatches = await page.evaluate(() => {
    const pattern = /\b(lorem ipsum|lorem|ipsum|placeholder|todo|tbd|xxxx|firstname lastname|month 1st, 2023|presentation title)\b/i;
    return Array.from(window.Reveal.getSlides())
      .map((slide, slideIndex) => {
        const text = slide.innerText ?? "";
        const match = text.match(pattern);
        return match
          ? {
              slide: slideIndex + 1,
              match: match[0],
              text: text.replace(/\s+/g, " ").trim().slice(0, 180),
            }
          : null;
      })
      .filter(Boolean);
  });

  for (let slideIndex = 0; slideIndex < slideStates.length; slideIndex += 1) {
    const slideState = slideStates[slideIndex];
    await page.evaluate(
      (state) => window.Reveal.slide(state.horizontal, state.vertical),
      slideState,
    );
    await page.waitForFunction(
      (state) => {
        const indices = window.Reveal.getIndices();
        return indices.h === state.horizontal && (indices.v ?? 0) === state.vertical;
      },
      slideState,
      { timeout: options.timeout },
    );
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );

    const screenshotName = `slide-${String(slideIndex + 1).padStart(3, "0")}-h${slideState.horizontal}-v${slideState.vertical}.png`;
    const screenshotPath = path.join(outputDirectory, screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    screenshots.push({ ...slideState, file: screenshotName });

    const slideWarnings = await page.evaluate(() => {
      const currentSlide = window.Reveal.getCurrentSlide();
      const slideRect = currentSlide.getBoundingClientRect();
      const elements = Array.from(
        currentSlide.querySelectorAll("h1,h2,h3,h4,p,li,img,svg,canvas,table,figure,video"),
      );
      return elements
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const hasSize = rect.width > 0 && rect.height > 0;
          const outside =
            rect.left < slideRect.left - 2 ||
            rect.right > slideRect.right + 2 ||
            rect.top < slideRect.top - 2 ||
            rect.bottom > slideRect.bottom + 2;
          return hasSize && outside
            ? {
                tag: element.tagName.toLowerCase(),
                text: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120),
              }
            : null;
        })
        .filter(Boolean);
    });

    for (const warning of slideWarnings) {
      overflowWarnings.push({ slide: slideIndex + 1, ...warning });
    }
  }

  const report = {
    input: inputPath,
    generatedAt: new Date().toISOString(),
    viewport,
    slideCount: slideStates.length,
    screenshots,
    placeholderMatches,
    consoleErrors,
    pageErrors,
    requestFailures,
    overflowWarnings,
  };

  await writeFile(path.join(outputDirectory, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(outputDirectory, "index.html"), buildContactSheet(report));

  console.log(`Captured ${screenshots.length} slide screenshot(s) in ${outputDirectory}`);
  console.log(`Open ${path.join(outputDirectory, "index.html")} to inspect the contact sheet.`);

  if (overflowWarnings.length > 0) {
    console.warn(`Found ${overflowWarnings.length} possible overflow warning(s). Review report.json.`);
  }

  const failureCount =
    placeholderMatches.length + consoleErrors.length + pageErrors.length + requestFailures.length;
  if (failureCount > 0) {
    console.error(`Verification found ${failureCount} blocking issue(s). Review report.json.`);
    process.exit(1);
  }
} finally {
  await browser?.close();
}

function parseArgs(args) {
  const parsed = {
    help: false,
    input: undefined,
    out: undefined,
    timeout: 60000,
    viewport: "1600x900",
  };
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--out") {
      parsed.out = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--out=")) {
      parsed.out = arg.slice("--out=".length);
    } else if (arg === "--viewport") {
      parsed.viewport = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--viewport=")) {
      parsed.viewport = arg.slice("--viewport=".length);
    } else if (arg === "--timeout") {
      parsed.timeout = Number(args[index + 1]);
      index += 1;
    } else if (arg.startsWith("--timeout=")) {
      parsed.timeout = Number(arg.slice("--timeout=".length));
    } else {
      positional.push(arg);
    }
  }

  parsed.input = positional[0];
  return parsed;
}

function loadPlaywright() {
  const requireFunctions = [
    createRequire(path.join(process.cwd(), "package.json")),
    createRequire(import.meta.url),
  ];

  for (const requireFunction of requireFunctions) {
    try {
      return requireFunction("playwright");
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") {
        throw error;
      }
    }
  }

  console.error("Playwright is not available in this environment.");
  console.error("Run the dependency preflight and ask the user for permission to install anything it reports missing:");
  console.error("  node scripts/check-deps.mjs");
  process.exit(2);
}

function parseViewport(value) {
  const match = /^(\d+)x(\d+)$/.exec(value);
  if (!match) {
    throw new Error(`Invalid viewport: ${value}. Use WIDTHxHEIGHT, such as 1600x900.`);
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}

function buildContactSheet(report) {
  const cards = report.screenshots
    .map(
      (screenshot, index) => `<figure>
        <img src="${escapeHtml(screenshot.file)}" alt="Slide ${index + 1}">
        <figcaption>Slide ${index + 1} - h${screenshot.horizontal} v${screenshot.vertical}</figcaption>
      </figure>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reveal.js QA Contact Sheet</title>
    <style>
      body { margin: 24px; font: 14px/1.45 sans-serif; color: #111; background: #f5f5f5; }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 0 0 20px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
      figure { margin: 0; padding: 10px; background: white; border: 1px solid #ddd; }
      img { display: block; width: 100%; height: auto; }
      figcaption { margin-top: 8px; color: #555; }
    </style>
  </head>
  <body>
    <h1>Reveal.js QA Contact Sheet</h1>
    <p>${escapeHtml(report.slideCount)} slide(s), generated ${escapeHtml(report.generatedAt)}. See report.json for console errors, placeholder matches, request failures, and overflow warnings.</p>
    <div class="grid">
      ${cards}
    </div>
  </body>
</html>
`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function printUsage() {
  console.log(`Usage: node scripts/verify.mjs <presentation.html> [--out qa-dir] [--viewport 1600x900] [--timeout 60000]

Captures one screenshot per reveal.js slide, writes report.json, and writes an index.html contact sheet.
Requires Playwright and Playwright-managed Chromium. Run node scripts/check-deps.mjs first if unsure.`);
}