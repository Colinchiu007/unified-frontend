/**
 * Bundle size checker — parse `npm run build` output and verify
 * first-load JS stays within budget.
 *
 * Usage: node scripts/check-bundle-size.mjs [--baseline]
 *
 * --baseline: Update BASELINE values instead of comparing
 */

import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// ── Thresholds (in kB, gzipped) ──
const BASELINE = {
  shared: 110,   // First Load JS shared by all
  max: 130,      // Maximum any single page
  pages: {       // Per-page budgets
    "/generate": 120,
    "/settings": 120,
    "/": 120,
    "/login": 115,
    "/content": 120,
    "/publish": 120,
  },
};

const BASELINE_FILE = resolve("scripts/.bundle-baseline.json");

let checkBaseline = BASELINE;

// Load existing baseline if available
if (existsSync(BASELINE_FILE)) {
  checkBaseline = JSON.parse(readFileSync(BASELINE_FILE, "utf-8"));
}

const args = process.argv.slice(2);
const updateBaseline = args.includes("--baseline");

// ── Parse build output ──
const build = spawn("npm", ["run", "build"], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

let output = "";
build.stdout.on("data", (chunk) => (output += chunk.toString()));
build.stderr.on("data", (chunk) => (output += chunk.toString()));

build.on("close", (code) => {
  if (code !== 0) {
    console.error("BUILD FAILED");
    process.exit(1);
  }
  parseAndCheck(output);
});

function parseAndCheck(buildOutput) {
  // Parse "┌ ○ /path    size    First Load JS" lines
  const lines = buildOutput.split("\n");
  const pages = [];
  let shared = 0;

  const PAGE_RE = /○\s+(\/\S*)\s+([\d.]+) kB\s+([\d.]+) kB/;
  const SHARED_RE = /First Load JS shared by all\s+([\d.]+) kB/;

  let errors = [];

  for (const line of lines) {
    const sm = line.match(SHARED_RE);
    if (sm) {
      shared = parseFloat(sm[1]);
      continue;
    }
    const pm = line.match(PAGE_RE);
    if (pm) {
      pages.push({
        route: pm[1],
        pageSize: parseFloat(pm[2]),
        firstLoad: parseFloat(pm[3]),
      });
    }
  }

  // Check shared budget
  if (shared > checkBaseline.shared) {
    errors.push(`Shared JS ${shared} kB exceeds budget ${checkBaseline.shared} kB`);
  }

  // Check per-page budgets
  for (const page of pages) {
    const budget = checkBaseline.pages[page.route];
    if (budget && page.firstLoad > budget) {
      errors.push(`${page.route}: ${page.firstLoad} kB exceeds budget ${budget} kB`);
    }
  }

  // Check max
  for (const page of pages) {
    if (page.firstLoad > checkBaseline.max) {
      errors.push(`${page.route}: ${page.firstLoad} kB exceeds max ${checkBaseline.max} kB`);
    }
  }

  // Report
  console.log("=== Bundle Size Report ===");
  console.log(`Shared JS: ${shared} kB (budget: ${checkBaseline.shared} kB)`);
  for (const page of pages) {
    const budget = checkBaseline.pages[page.route];
    const ok = !budget || page.firstLoad <= budget;
    const marker = ok ? "✓" : "✗";
    console.log(`  ${marker} ${page.route}: ${page.firstLoad} kB (page: ${page.pageSize} kB) ${budget ? `/ budget: ${budget} kB` : ""}`);
  }

  if (updateBaseline) {
    const newBaseline = {
      shared,
      max: Math.max(...pages.map((p) => p.firstLoad)),
      pages: Object.fromEntries(pages.map((p) => [p.route, p.firstLoad])),
    };
    writeFileSync(BASELINE_FILE, JSON.stringify(newBaseline, null, 2));
    console.log(`\n✓ Baseline updated at ${BASELINE_FILE}`);
    process.exit(0);
  }

  if (errors.length > 0) {
    console.error("\n✗ Bundle size violations:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log("\n✓ All bundle sizes within budget");
}
