// Leonida Trophy Guide — the entry program for gta6-trophy-guide-01.
//
// The guide itself is app/: plain static files (index.html, style.css, app.js and
// data/trophies.json with all 55 trophies plus data/roadmap.json), no build step,
// no network at run time. This program just hands it in: it copies app/ and
// screenshots/ from beside this file into the output directory and writes
// dossier.json there with the vendored make.fun library (vendor/makefun-frontend.ts,
// left untouched: the scorer rebuilds the dossier with its own copy and compares
// the two byte for byte).
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader MAKEFUN_OUTPUT_DIR is unset and /output is used.
// Serve the guide to try it with: node serve.ts, then http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the directory this file sits in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  if (!existsSync(source)) return;
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

// The caps mirror the scorer's own: at most 4 screenshots of 256 KiB each,
// at most 993 files and directories in app/ totalling 48 MiB, and the dossier
// text capped at 160 KiB. Only text_max_bytes changes the dossier's bytes;
// the other caps refuse an entry the scorer would refuse.
const dossierOptions = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, dossierOptions));
