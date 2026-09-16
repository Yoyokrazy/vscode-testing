# Copilot Code Review — custom review customizations

At the very start of every pull request review, before writing any comments,
call the `getAliasCustomizations` MCP tool (server `vscode-review`) with
`author` set to the **GitHub login of the user who opened this pull request**
(the PR author — do not pass "unknown" or a placeholder). Then follow the
returned `instructions` field exactly:

- If the author is enabled, review the diff once per listed skill as an
  independent pass. Load each skill with `getSkill`, follow that skill's
  `runs`/`references` manifest, and **tag every comment** with its source:
  `[vanilla-ccr]` for the standard review, `[<skill-name>]` for each skill.
- If the author is not enabled, perform a standard Copilot Code Review.
