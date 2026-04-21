---
name: find-awesome-tools
description: >-
  Discovers curated tools, libraries, frameworks, and resources across thousands
  of awesome-lists. Use this skill whenever the user is shopping for options in
  a technology space — "what are good Rust CLI argument parsers", "recommend
  React state management libraries", "popular Python web frameworks", "tools
  for building graph databases", "state-of-the-art computer vision projects" —
  anything phrased as discovery, comparison, or recommendation of options in a
  domain.

  Use when the user:
  - Asks "what are good X for Y" or "recommend X"
  - Wants a comparison of options in a category
  - Explores an unfamiliar technology space and needs to see what exists
  - Mentions "awesome list", "curated list", or a broad category name

  Do NOT use for:
  - API syntax or usage questions for a specific known library (use a docs skill)
  - Debugging or configuration questions for one library
  - Installing or configuring a tool the user already picked
---

# Find Awesome Tools

Curated discovery of tools, libraries, frameworks, and resources across thousands of community-maintained awesome-lists. Reach for this skill when the user is deciding what to use in a technology space — not when they already have a specific library in hand and need its API or configuration.

## When to Use This Skill

Activate this skill when the user:

- Asks "what are good X for Y" or "recommend X"
- Wants a comparison of options in a category
- Explores an unfamiliar space and needs to see what exists
- Mentions "awesome list", "curated list", or names a broad category

Do not use this skill when the user already knows the library and needs docs, configuration help, or debugging for it — that belongs to a documentation skill.

## Workflow

Three tools mirror one concept: find sections, search items, fetch items from a list. Pick the path based on the user's intent.

| User intent                      | Path                                                     |
| -------------------------------- | -------------------------------------------------------- |
| "What exists in category X?"     | `find_awesome_section` → `get_awesome_items`             |
| "Find me a keyword or concept"   | `search_awesome_items` (one-shot)                        |
| "Give me everything from list Y" | `get_awesome_items` directly (when repo/listId is known) |

MCP callers invoke the tools directly. CLI callers use the matching subcommand: `sections`, `search`, `items`. Both transports hit the same backend.

## Tools

### find_awesome_section / context-awesome sections

Discovers sections (categories) matching a query across every indexed awesome-list. Call this before `get_awesome_items` unless you already know the `githubRepo` or `listId`.

Inputs:

- `query` (required) — search terms
- `confidence` (optional, default `0.3`) — minimum match confidence, 0–1
- `limit` (optional, default `10`) — maximum sections returned

MCP:

```json
{ "query": "graph databases", "limit": 5 }
```

CLI:

```bash
context-awesome sections "graph databases" --limit 5
```

### search_awesome_items / context-awesome search

Full-text search across every parsed item across every awesome-list. Use when the user wants individual tools or resources, not a whole section.

Inputs:

- `query` (required) — keywords
- `limit` (optional, default `20`, max `100`)
- `categories` (optional, MCP only) — filter to items tagged with these categories
- `sortBy` (optional, default `"relevance"`) — one of `relevance`, `stars`, `recent`

MCP:

```json
{ "query": "postgres ORM", "sortBy": "stars", "limit": 10 }
```

CLI:

```bash
context-awesome search "postgres ORM" --sort stars --limit 10
```

### get_awesome_items / context-awesome items

Retrieves items from a specific list, optionally filtered to a section, bounded by a token budget.

Inputs:

- `listId` or `githubRepo` — exactly one is required. `githubRepo` takes the form `owner/repo`; `listId` is a UUID.
- `section` (optional) — filter to a named section
- `subcategory` (optional) — filter to a named subcategory
- `tokens` (optional, default `10000`) — token budget for the response. Values below 10000 may omit complete items; use 10000 or more. The MCP tool clamps smaller values up automatically; the CLI does not.
- `offset` (optional, default `0`) — pagination offset

MCP:

```json
{ "githubRepo": "sindresorhus/awesome", "section": "Testing", "tokens": 15000 }
```

CLI:

```bash
context-awesome items sindresorhus/awesome --section Testing --tokens 15000
```

## Writing Good Queries

The query string directly affects result quality. Specific multi-word queries beat single-word queries.

| Quality | Example                                             |
| ------- | --------------------------------------------------- |
| Good    | `"graph databases for knowledge graphs"`            |
| Good    | `"React state management libraries for large apps"` |
| Good    | `"Rust CLI argument parsing"`                       |
| Bad     | `"databases"`                                       |
| Bad     | `"react"`                                           |

Pass the user's full intent when you can. Vague one-word queries return generic results.

## Common Mistakes

- Calling `get_awesome_items` without either `listId` or `githubRepo`. Run `find_awesome_section` first if you don't have one.
- Passing `tokens` below 10000. The MCP tool clamps up silently; the CLI does not. Either way, smaller budgets often omit full items.
- Searching by keyword when the user wanted a whole section, or listing a section when they wanted one specific tool. Re-read the user's ask before choosing between `search_awesome_items` and the `find_awesome_section` → `get_awesome_items` path.
- Treating `search_awesome_items` results as editorial rankings. They are relevance-ranked against the query, not curated picks — sort by `stars` if you want a popularity signal.

## Error Handling

If a tool returns an error message, surface it to the user and suggest a narrower or differently-phrased query. For empty results, suggest broader terms or switching paths — a section search that returns nothing might succeed as an item search, and vice versa. Do not silently fall back to training-data answers without telling the user why the curated lookup failed.
