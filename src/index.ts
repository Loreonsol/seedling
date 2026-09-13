#!/usr/bin/env node
import { VERSION } from './version.js';

const help = `
seedling — self-evolving coding agent bootstrap

Usage:
  npm start              Show version + short status
  npm run evolve         One plan → edit → test cycle (FakePlanner by default)
  npm test               Run tests
  npm run build          Compile TypeScript to dist/

Steer growth via GitHub issues. See NORTH_STAR.md and CONTRIBUTING.md.
`.trim();

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
  console.log(help);
  process.exit(0);
}

console.log(`seedling v${VERSION}`);
console.log('North star: local coding agent that plans, edits, tests, commits, and grows.');
console.log('Run `npm run evolve` for one offline FakePlanner cycle.');
