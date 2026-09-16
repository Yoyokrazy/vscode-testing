---
name: code-review
description: Applies review customizations from the vscode-review MCP server. Use this whenever performing a code review of a pull request.
---

# Custom code review

At the very start of the review, before writing any comments, call the
`getAliasCustomizations` MCP tool on the `vscode-review` server — set `author` to
the **GitHub login of the user who opened this pull request** (the PR author —
never "unknown" or a placeholder).

Then follow the `instructions` it returns **exactly**. They tell you which
reviewers to run, whether the standard review also runs, how to fetch each
reviewer (`getReviewer`) and its references (`getReviewerReference`), and — for
every comment — how to tag it with the reviewer, repository custom instruction
(`.github/instructions/**`), or skill that raised it.

Do not guess tool names or invent steps — the server response is the source of
truth for how to run this review.

