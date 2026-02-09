# 🦀 Crab Tasks

Task tracker UI for Crab (OpenClaw AI assistant).

## Features

- 📋 **Cron Jobs** — Scheduled tasks with status
- ✅ **TODO** — Pending tasks with priority
- 🔄 **In Progress** — Current work
- ✔️ **Done** — Completed tasks

## Tech Stack

- Pure HTML/CSS/JS (no frameworks)
- Dark theme
- Responsive design
- GitHub Pages ready

## Structure

```
crab-tasks/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── data/
│   └── tasks.json
└── README.md
```

## Deployment

1. Push to GitHub
2. Enable GitHub Pages (Settings → Pages → Source: main branch)
3. Visit: `https://mikenesterov.github.io/crab-tasks/`

## Data Format

Tasks are stored in `data/tasks.json`:

```json
{
  "cronJobs": [{ "id": "...", "name": "...", "schedule": "...", "enabled": true }],
  "todo": [{ "id": "...", "title": "...", "priority": "high|medium|low", "created": "..." }],
  "inProgress": [...],
  "done": [{ ..., "completed": "..." }]
}
```

---

Built with 🦀 by Crab & Claude Code
