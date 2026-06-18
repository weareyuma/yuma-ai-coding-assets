#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const minimumNodeMajor = 18;
const statuses = [];
const installHints = [];

const nodeMajor = Number(process.versions.node.split(".")[0]);
record(
  "node",
  nodeMajor >= minimumNodeMajor,
  `Node ${process.versions.node}`,
  `Node ${minimumNodeMajor}+ is required. Ask the user for permission to install Node, then use the platform's normal Node installer. On macOS with Homebrew: brew install node`,
);

const npmAvailable = commandWorks("npm", ["--version"]);
record(
  "npm",
  npmAvailable,
  "npm is available",
  "npm is required to install Playwright. Ask the user for permission to install Node/npm first.",
);

const npxAvailable = commandWorks("npx", ["--version"]);
record(
  "npx",
  npxAvailable,
  "npx is available",
  "npx is required to install the Playwright-managed Chromium browser. Ask the user for permission to install Node/npm first.",
);

const playwright = loadPackage("playwright");
record(
  "playwright",
  Boolean(playwright),
  playwright ? "the playwright package is resolvable" : "the playwright package is not resolvable",
  playwrightInstallHint(),
);

if (playwright) {
  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    record(
      "chromium",
      true,
      "Playwright-managed Chromium launches successfully",
      "",
    );
  } catch (error) {
    record(
      "chromium",
      false,
      "Playwright-managed Chromium could not launch",
      "Ask the user for permission, then run: npx playwright install chromium",
    );
    statuses[statuses.length - 1].detail = error.message;
  } finally {
    await browser?.close();
  }
} else {
  record(
    "chromium",
    false,
    "Playwright-managed Chromium was not checked because Playwright is missing",
    "After installing Playwright, ask the user for permission, then run: npx playwright install chromium",
  );
}

printReport();

const missing = statuses.filter((status) => !status.ok);
process.exit(missing.length === 0 ? 0 : 1);

function record(name, ok, message, installHint) {
  statuses.push({ name, ok, message, installHint, detail: undefined });
  if (!ok && installHint) {
    installHints.push(installHint);
  }
}

function commandWorks(command, args) {
  const result = spawnSync(command, args, { stdio: "ignore" });
  return result.status === 0;
}

function loadPackage(packageName) {
  const requireFunctions = [
    createRequire(path.join(process.cwd(), "package.json")),
    createRequire(import.meta.url),
  ];

  for (const requireFunction of requireFunctions) {
    try {
      return requireFunction(packageName);
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") {
        throw error;
      }
    }
  }

  return undefined;
}

function playwrightInstallHint() {
  const packageJsonPath = findUp("package.json", process.cwd());
  if (packageJsonPath) {
    return `Ask the user for permission, then run: npm install --save-dev playwright # from ${path.dirname(packageJsonPath)}`;
  }

  return "Ask the user for permission, then either create a package.json and run npm install --save-dev playwright, or use a temporary install with npm install --no-save playwright.";
}

function findUp(fileName, startDirectory) {
  let currentDirectory = path.resolve(startDirectory);

  while (true) {
    const candidate = path.join(currentDirectory, fileName);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      return undefined;
    }

    currentDirectory = parentDirectory;
  }
}

function printReport() {
  console.log("Reveal.js verification dependency check");
  console.log(`Working directory: ${process.cwd()}`);
  console.log("");

  for (const status of statuses) {
    const prefix = status.ok ? "OK" : "MISSING";
    console.log(`${prefix}: ${status.name} - ${status.message}`);
    if (status.detail) {
      console.log(`  ${status.detail}`);
    }
  }

  const missing = statuses.filter((status) => !status.ok);
  if (missing.length === 0) {
    console.log("");
    console.log("All dependencies are ready. You can run verify.mjs or export-pdf.mjs.");
    return;
  }

  console.log("");
  console.log("Before installing anything, ask the user for permission. Suggested commands:");
  for (const hint of [...new Set(installHints)]) {
    console.log(`- ${hint}`);
  }
}