#!/usr/bin/env node
/**
 * sync-cron.js — Syncs tasks.json cronJobs with real OpenClaw cron jobs.
 *
 * Reads: OpenClaw jobs.json (real cron jobs)
 * Updates: tasks.json cronJobs array
 * Preserves: hidden, project (UI-only fields) from existing entries
 *
 * Usage: node scripts/sync-cron.js [--openclaw-jobs PATH]
 */

const fs = require('fs');
const path = require('path');

// Paths
const TASKS_JSON = path.join(__dirname, '..', 'data', 'tasks.json');
const DEFAULT_OPENCLAW_JOBS = 'C:\\OpenClaw\\misha\\cron\\jobs.json';

// Project assignment config — maps job name patterns to projects
const PROJECT_MAP = [
  { pattern: /task worker/i, project: 'crab-tasks' },
  { pattern: /feature ideas/i, project: 'crab-tasks' },
  { pattern: /weekly summary/i, project: 'crab-tasks' },
  { pattern: /price update|finance/i, project: 'crab-tasks' },
  { pattern: /digest/i, project: 'openclaw' },
  { pattern: /update check/i, project: 'openclaw' },
  { pattern: /backup/i, project: 'openclaw' },
  { pattern: /learning/i, project: 'personal' },
  { pattern: /финплан|финансов/i, project: 'personal' },
  { pattern: /o-?1|виза/i, project: 'personal' },
];

// Jobs to auto-hide (e.g. internal/infrastructure)
const AUTO_HIDE = [/backup/i];

function guessProject(name) {
  for (const { pattern, project } of PROJECT_MAP) {
    if (pattern.test(name)) return project;
  }
  return 'openclaw'; // default
}

function shouldAutoHide(name) {
  return AUTO_HIDE.some(p => p.test(name));
}

function main() {
  // Parse args
  const args = process.argv.slice(2);
  let openclawJobsPath = DEFAULT_OPENCLAW_JOBS;
  const idx = args.indexOf('--openclaw-jobs');
  if (idx !== -1 && args[idx + 1]) {
    openclawJobsPath = args[idx + 1];
  }

  // Read real jobs
  if (!fs.existsSync(openclawJobsPath)) {
    console.error(`OpenClaw jobs not found: ${openclawJobsPath}`);
    process.exit(1);
  }
  const realJobs = JSON.parse(fs.readFileSync(openclawJobsPath, 'utf8'));

  // Read tasks.json
  if (!fs.existsSync(TASKS_JSON)) {
    console.error(`tasks.json not found: ${TASKS_JSON}`);
    process.exit(1);
  }
  const tasks = JSON.parse(fs.readFileSync(TASKS_JSON, 'utf8'));

  // Build lookup of existing cron entries by name (for preserving UI fields)
  const existingByName = {};
  for (const job of (tasks.cronJobs || [])) {
    existingByName[job.name] = job;
  }

  // Filter: only enabled cron/every jobs (skip one-shot "at" jobs that already fired)
  const activeJobs = (realJobs.jobs || []).filter(j => {
    if (!j.enabled) return false;
    if (j.schedule?.kind === 'at') return false; // one-shot, skip
    return true;
  });

  // Map to tasks.json format
  const newCronJobs = activeJobs.map(job => {
    const existing = existingByName[job.name];
    const cronExpr = job.schedule?.expr || '';
    const tz = job.schedule?.tz || 'UTC';

    return {
      id: job.id,
      name: job.name,
      schedule: cronExpr,
      tz: tz,
      enabled: job.enabled,
      hidden: existing ? existing.hidden : shouldAutoHide(job.name),
      project: existing ? existing.project : guessProject(job.name),
    };
  });

  // Sort by name
  newCronJobs.sort((a, b) => a.name.localeCompare(b.name));

  // Update
  const oldCount = (tasks.cronJobs || []).length;
  tasks.cronJobs = newCronJobs;

  fs.writeFileSync(TASKS_JSON, JSON.stringify(tasks, null, 2) + '\n', 'utf8');

  // Report
  const added = newCronJobs.filter(j => !existingByName[j.name]).map(j => j.name);
  const removed = Object.keys(existingByName).filter(
    name => !newCronJobs.find(j => j.name === name)
  );

  console.log(`✅ Synced: ${newCronJobs.length} cron jobs (was ${oldCount})`);
  if (added.length) console.log(`  + Added: ${added.join(', ')}`);
  if (removed.length) console.log(`  - Removed: ${removed.join(', ')}`);
  if (!added.length && !removed.length) console.log('  No changes in job list.');
}

main();
