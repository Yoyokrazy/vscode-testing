---
name: code-review
description: Applies review customizations from the vscode-review MCP server. Use this whenever performing a code review of a pull request.
---

# Custom code review

At the very start of the review, before writing any comments, call BOTH of these
MCP tools on the `vscode-review` server:

1. `getAliasCustomizations` — set `author` to the **GitHub login of the user who
   opened this pull request** (the PR author — never "unknown" or a placeholder).
2. `getAreaInstructions` — set `files` to the **list of files changed in this
   pull request** (their repo-relative paths).

Then:

- Follow the `instructions` returned by `getAliasCustomizations` **exactly** — it
  tells you which reviewers to run, whether the standard review also runs, how to
  fetch each reviewer (`getReviewer`) and its references (`getReviewerReference`),
  and how to tag every comment with its source.
- Apply any guidance in the `areas` returned by `getAreaInstructions` to the whole
  review.

Do not guess tool names or invent steps — the server response is the source of
truth for how to run this review.
