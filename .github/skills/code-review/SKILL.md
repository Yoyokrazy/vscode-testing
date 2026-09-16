---
name: code-review
description: Applies per-author review customizations from the vscode-review MCP server. Use this whenever performing a code review of a pull request.
---

# Custom code review

At the very start of the review, before writing any comments, call the
`getAliasCustomizations` MCP tool (server `vscode-review`) with `author` set to
the **GitHub login of the user who opened this pull request** (the PR author —
never "unknown" or a placeholder).

Then follow the returned `instructions` field exactly:

- If the author is enabled, review the diff once per listed skill as an
  independent pass. Load each skill with `getSkill`, follow that skill's
  `runs` / `references` manifest (fetch reference docs with `getSkillReference`),
  and **tag every comment** with its source: `[vanilla-ccr]` for the standard
  review, `[<skill-name>]` for each skill.
- If the author is not enabled, perform a standard Copilot Code Review.
