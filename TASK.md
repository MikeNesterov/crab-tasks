# Task: Fullscreen Layout

Optimize the UI for large monitors (2560x1440). Use full screen width with column layout.

## Requirements

1. **Two-column layout**:
   - LEFT: Tasks (TODO, In Progress, Done or Project View)
   - RIGHT: Cron Jobs
2. **Full width**: Remove max-width constraints, use 100% of viewport
3. **Responsive**: On smaller screens (<1200px), stack vertically as before
4. **Header**: Keep header at top, spanning full width
5. **Stats bar**: Keep at top, below header
6. **Sections**: Use CSS Grid or Flexbox for the two-column layout
7. **Cards**: Can be slightly wider on large screens

## Target resolution
- Optimized for: 2560x1440
- Works on: 1920x1080 and larger
- Falls back to: vertical stack on <1200px

## Files to modify
- `css/style.css` - major layout changes, media queries
- `index.html` - wrap sections in layout containers

## When done
```
git add .
git commit -m "feat: fullscreen two-column layout"
git push -u origin feat/fullscreen-layout
```
