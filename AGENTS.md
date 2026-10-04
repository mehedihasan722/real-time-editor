# Repository workflow

- For every completed change, update GitHub with a gitmoji-prefixed commit and PR title. Push the working branch after the relevant checks pass; do not merge or deploy unless the user requests it.
- Maintain the relevant GitHub issue with the problem, result, validation, and remaining work. Link issues and PRs without closing unresolved launch requirements.
- Update CHANGELOG.md and affected docs/wiki pages when behavior or operations change, and publish maintained Wiki pages when authenticated access is available.
- Keep AGENTS.md instructions current when development procedures change. Preserve the generated Next.js rules in apps/web/AGENTS.md.
- Check the Actions results for the pushed revision. Fix failures caused by the change and report queued or external failures accurately.
- Add relevant issues and PRs to the configured GitHub Project when access permits. Use the existing project-sync workflow; report missing PROJECT_URL or Projects permission instead of inventing a project.
- Never print credentials or commit local environment files. If any GitHub surface cannot be updated, finish the accessible updates and report the exact limitation.
