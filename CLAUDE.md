# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

An e-commerce data utilities project providing typed query functions over a SQLite database. TypeScript with strict mode, ES2022 modules.

## Development Commands

```bash
# Install dependencies and generate .claude/settings.local.json from template
npm run setup

# Run a TypeScript file directly
npx tsx src/main.ts

# Run the SDK script
npm run sdk
```

There is no test runner configured (`npm test` exits with an error).

## Architecture

`src/main.ts` opens a SQLite connection via the `sqlite` wrapper (async, not the raw `sqlite3` callback API) and calls `createSchema()` to initialize all tables.

All query functions live in `src/queries/` and receive a `Database` instance as their first argument. Because the project uses the `sqlite` package (not `sqlite3` directly), `db.get()` and `db.all()` already return Promises — use `async/await`, not callbacks:

```typescript
export async function getProductBySku(db: Database, sku: string): Promise<any> {
  return db.get(`SELECT * FROM products WHERE sku = ?`, [sku]);
}
```

Use `db.get()` for single-row lookups and `db.all()` for multi-row results.

## Hooks (auto-configured by `npm run setup`)

Three hooks run automatically on every file write/edit within this session:

- **PreToolUse (`query_hook.js`)** — Before any `Write|Edit|MultiEdit`, an AI agent scans `src/queries/` and blocks the change if the new function duplicates existing query logic. It exits 2 with feedback if duplication is detected.
- **PostToolUse (prettier)** — Auto-formats the written file with prettier.
- **PostToolUse (`tsc.js`)** — Type-checks the whole project via `tsconfig.json` after every TypeScript file change. Exits 2 with diagnostics if there are type errors.

Hook logs are written to `pre-log.json` and `post-log.json` in the project root.

## Database Schema Key Points

- `categories` is self-referential (`parent_category_id`).
- `inventory` has a composite unique key `(product_id, warehouse_id)` — stock is per-warehouse.
- `reviews` has a composite unique key `(product_id, customer_id, order_id)` — one review per purchase.
- `promotions.discount_type` is one of `'percentage'`, `'fixed'`, `'free_shipping'`.
- `orders.status` lifecycle: `pending → processing → shipped → delivered` (or `cancelled`/`refunded`).

## Critical Guidance

- All database queries must be written in `src/queries/`. The `query_hook.js` enforces this and will block writes that duplicate existing query functionality.
