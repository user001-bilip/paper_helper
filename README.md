# Paper Helper

Private research paper writing website.

Product requirements: [`docs/PRD.md`](docs/PRD.md)

## Current MVP

- Fixed LaTeX-style academic paper template
- Journal template selector for LaTeX-driven submission formatting
- Feishu Docs inspired editor workspace
- Insert heading, paragraph, image, table, and formula blocks
- Adjust heading levels from the inspector
- Common editor actions: bold, italic, underline, lists, alignment, move, duplicate, and delete
- Use outline plus menus to add a same-level heading, child heading, or body paragraph
- Collapse an entire heading section or collapse one body block independently
- Export LaTeX `.tex`
- Export Word-compatible `.doc`
- Export PDF through browser print
- Backend export endpoint at `/api/export`

## Visual Preview

Open the static preview directly if Node.js is not installed yet:

```text
preview/index.html
```

## Local Development

Install Node.js first, then run:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Notes

The first version keeps data in browser state only. Persistent drafts, login, PostgreSQL, Prisma, and a Python/FastAPI document worker can be added after the writing workflow is stable.
