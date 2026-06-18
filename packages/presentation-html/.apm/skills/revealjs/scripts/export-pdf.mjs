#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
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

const outputPath = path.resolve(
  options.output ?? `${path.basename(inputPath, path.extname(inputPath))}.pdf`,
);
await mkdir(path.dirname(outputPath), { recursive: true });

const printUrl = withPrintPdf(pathToFileURL(inputPath).href);

await exportWithPlaywright(printUrl, outputPath, options.timeout);
console.log(`Wrote ${outputPath} using Playwright.`);

async function exportWithPlaywright(printUrl, outputPath, timeout) {
  let browser;
  try {
    const playwright = loadPlaywright();
    try {
      browser = await playwright.chromium.launch();
    } catch (error) {
      console.error("Playwright is installed, but Chromium could not be launched.");
      console.error("Run the dependency preflight and ask the user for permission to install anything it reports missing:");
      console.error("  node scripts/check-deps.mjs");
      throw error;
    }
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.goto(printUrl, { waitUntil: "networkidle", timeout });
    await page
      .waitForFunction(() => !window.Reveal || !window.Reveal.isReady || window.Reveal.isReady(), null, {
        timeout,
      })
      .catch(() => undefined);
    await page.pdf({
      path: outputPath,
      width: "16in",
      height: "9in",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  } finally {
    await browser?.close();
  }
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

  throw new Error(
    "Playwright is not available. Run node scripts/check-deps.mjs and ask the user for permission to install anything it reports missing.",
  );
}

function parseArgs(args) {
  const parsed = { help: false, input: undefined, output: undefined, timeout: 60000 };
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
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
  parsed.output = positional[1];
  return parsed;
}

function withPrintPdf(url) {
  return `${url}${url.includes("?") ? "&" : "?"}print-pdf`;
}

function printUsage() {
  console.log(`Usage: node scripts/export-pdf.mjs <presentation.html> [output.pdf] [--timeout 60000]

Exports reveal.js print mode to PDF using Playwright-managed Chromium. Run node scripts/check-deps.mjs first if unsure.`);
}