---
name: paper-helper
description: Project-local guidance for developing the paper_helper research paper writing website. Use when working inside this repository.
---

# Paper Helper

This is the project-local skill for `paper_helper`, a private research paper writing website. It lives inside the repository so the working conventions can migrate with the project.

## Scope

Use this skill when creating, editing, reviewing, or documenting code for this repository. Treat it as the shared project memory for product direction, engineering conventions, and migration notes.

The project goal is to build a website that helps researchers write academic papers. Early decisions should preserve room for:

- project-based paper drafts
- structured academic sections
- references and citation workflows
- AI-assisted writing and revision
- private research data and user authentication

## Repository Conventions

- Keep this skill package under `.codex/skills/paper-helper/`.
- Treat `docs/PRD.md` as the product requirements source of truth. Read it before changing product scope, priorities, user flows, or acceptance criteria, and update it when the user approves a product-level change.
- Keep project-facing collaboration rules in `AGENTS.md` when they should be visible to future Codex sessions.
- Prefer documenting stable product and engineering decisions here instead of scattering them across chat history.
- Do not store secrets, API keys, tokens, private datasets, or account credentials in this skill package.
- When the project technology stack is chosen, update this skill with the actual stack, common commands, and important architectural boundaries.

## Current Technical Direction

- Use Next.js, React, and TypeScript as the first full-stack application surface.
- Use Tailwind CSS for styling and keep the interface work-focused, closer to a document editor than a marketing site.
- Keep backend endpoints inside Next.js at first. Add a Python FastAPI worker later only when PDF parsing, AI orchestration, vector search, or other long-running document tasks need it.
- Use PostgreSQL and Prisma when persistent multi-user data is introduced.

## MVP Product Direction

The first version should be a research paper editor driven by fixed journal LaTeX templates. A user who has obtained a journal's LaTeX template should be able to select or import that template, write the paper content in the website, and export a submission-ready file without manually reformatting at the end.

Prioritize:

- a document-editor workspace inspired by Feishu Docs
- buttons for creating blocks and adding section headings with explicit levels
- support for paragraph, heading, image, table, and formula blocks
- a fixed academic paper structure that can later map cleanly to LaTeX
- export affordances for LaTeX, Word-compatible documents, and PDF
- common Word-like operations: bold, italic, underline, lists, alignment, undo/redo, block move, duplicate, and delete
- an outline-first workflow: the plus button beside an outline heading opens a compact choice for a same-level heading, a child heading, or body text; disable child-heading creation at the deepest supported level and keep heading levels mapped to LaTeX section levels
- collapsible writing structure: collapsing a heading hides its descendant blocks until the next heading at the same or a higher level; collapsing a body block hides only that block's content; collapsed state is interface state and must not remove content from exports
- a simple, restrained visual style with paper-like whitespace, muted panels, and no decorative marketing treatment

For the earliest implementation, browser-based export is acceptable: generate `.tex`, generate a Word-compatible `.doc` from HTML, and use print-to-PDF for PDF until a server-side export pipeline is added.

Use a project-owned rich-text engine rather than an external research-service plugin for the editor. TipTap is the preferred next editor dependency because its document schema and extensions can be mapped to the project's structured blocks and LaTeX exporter. Research plugins such as literature-search services may be integrated later as optional sources, but they do not replace the editor runtime.

## Working Style

- Before major implementation work, inspect the current repository state and follow existing patterns.
- Keep early project structure simple and migration-friendly.
- For frontend work, build the usable research-writing experience directly rather than a marketing landing page.
- For user-facing copy, prefer clear academic-workflow language over generic SaaS phrasing.
- Preserve the user's private-repository assumption unless they explicitly say otherwise.

## Migration Notes

When this repository is moved to a new machine or environment, keep the hidden `.codex/skills/paper-helper/` directory with the repo. A future Codex session should read this file before making project decisions.
