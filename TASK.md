# Task: Project View (v2)

Current state: Two-column layout (tasks left, cron right), hidden cron toggle exists.

Replace the status-based task sections (TODO/In Progress/Done) with a project-based view.

## Requirements

1. **Replace left column content**: Instead of 3 sections (TODO/In Progress/Done), show one section per project
2. **Inside each project section**: Show all tasks (todo + in progress + done) sorted by priority (high → medium → low)
3. **Visual distinction**: 
   - In progress tasks: highlighted background, status icon
   - Done tasks: muted/strikethrough
   - Priority badge visible on each task
4. **Keep existing**: 
   - Two-column layout (don't change)
   - Cron section on right (don't change)
   - Project filter buttons (use them to filter which project sections show)
   - Stats bar
5. **Per-project stats**: Show counts in each project header

## Files to modify
- `js/app.js` - new renderProjectView() function, modify init
- `css/style.css` - project section styles, task row styles
- `index.html` - replace task sections with projects container (keep columns-layout)

## When done
```
git checkout -b feat/project-view-v2
git add .
git commit -m "feat: project-based task view"
git push -u origin feat/project-view-v2
```
