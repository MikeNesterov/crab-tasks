# Contributing to crab-tasks

## Git Workflow

This project follows a strict PR-based workflow with AI code review.

### Rules

1. **No direct commits to `main`** — branch is protected
2. **All changes via Pull Request** — create feature branch → PR → review → merge
3. **Separate agents for writing and reviewing** — the agent who writes code cannot review their own PR

### Branch Naming

- `feat/description` — new features
- `fix/description` — bug fixes
- `refactor/description` — code improvements
- `docs/description` — documentation updates

### Workflow

```
1. Writer Agent creates feature branch
   git checkout -b feat/new-feature

2. Writer Agent makes changes and commits
   git add . && git commit -m "feat: add new feature"

3. Writer Agent pushes and creates PR
   git push -u origin feat/new-feature
   gh pr create --title "feat: add new feature" --body "Description..."

4. Reviewer Agent reviews the PR
   - Opens PR in browser or fetches diff
   - Checks code quality, bugs, best practices
   - Approves or requests changes

5. After approval → merge
   gh pr merge <number> --squash --delete-branch
```

### Review Checklist

- [ ] Code follows project style
- [ ] No obvious bugs or security issues
- [ ] Changes match PR description
- [ ] Tests pass (if applicable)
- [ ] Documentation updated (if needed)

### Agents

- **Writer**: Claude Code (creates features, fixes bugs)
- **Reviewer**: Separate Claude Code instance or Crab (reviews PRs)
- **Orchestrator**: Crab 🦀 (coordinates workflow, merges after approval)
