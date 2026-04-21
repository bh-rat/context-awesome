import { AwesomeContextAPIClient } from "./api-client.js";

// ---- search ----

export interface SearchCliOptions {
  query: string;
  apiHost: string;
  apiKey?: string;
  limit?: number;
  sortBy?: "relevance" | "stars" | "recent";
  json?: boolean;
}

export async function runSearch(opts: SearchCliOptions): Promise<number> {
  const client = new AwesomeContextAPIClient(opts.apiHost, opts.apiKey);
  const response = await client.searchItems({
    query: opts.query,
    limit: opts.limit ?? 20,
    sortBy: opts.sortBy,
  });
  if (opts.json) {
    process.stdout.write(JSON.stringify(response, null, 2) + "\n");
    return 0;
  }
  if (!response.results.length) {
    process.stdout.write(`No results for "${opts.query}".\n`);
    return 0;
  }
  for (const [i, r] of response.results.entries()) {
    const stars = typeof r.stars === "number" ? `  ★${r.stars}` : "";
    process.stdout.write(
      `${i + 1}. ${r.name}${stars}\n   ${r.url}\n   source: ${r.githubRepo}${r.category ? `  [${r.category}]` : ""}\n`
    );
    if (r.description) process.stdout.write(`   ${r.description}\n`);
    process.stdout.write("\n");
  }
  process.stdout.write(`${response.total} total • ${response.took}ms\n`);
  return 0;
}

// ---- sections ----

export interface SectionsCliOptions {
  query: string;
  apiHost: string;
  apiKey?: string;
  limit?: number;
  confidence?: number;
  json?: boolean;
}

export async function runSections(opts: SectionsCliOptions): Promise<number> {
  const client = new AwesomeContextAPIClient(opts.apiHost, opts.apiKey);
  const response = await client.findSections({
    query: opts.query,
    limit: opts.limit ?? 10,
    confidence: opts.confidence ?? 0.3,
  });
  if (opts.json) {
    process.stdout.write(JSON.stringify(response, null, 2) + "\n");
    return 0;
  }
  if (!response.sections.length) {
    process.stdout.write(`No sections matching "${opts.query}".\n`);
    return 0;
  }
  for (const [i, s] of response.sections.entries()) {
    process.stdout.write(
      `${i + 1}. ${s.listName} — ${s.category}${s.subcategory ? ` › ${s.subcategory}` : ""}\n`
    );
    process.stdout.write(
      `   repo: ${s.githubRepo}  items: ${s.itemCount}  confidence: ${(s.confidence * 100).toFixed(0)}%\n`
    );
    process.stdout.write(`   listId: ${s.listId}\n\n`);
  }
  return 0;
}

// ---- items ----

export interface ItemsCliOptions {
  target: string;
  apiHost: string;
  apiKey?: string;
  section?: string;
  subcategory?: string;
  tokens?: number;
  json?: boolean;
}

export async function runItems(opts: ItemsCliOptions): Promise<number> {
  const client = new AwesomeContextAPIClient(opts.apiHost, opts.apiKey);
  const useListId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    opts.target
  );
  const response = await client.getItems({
    listId: useListId ? opts.target : undefined,
    githubRepo: useListId ? undefined : opts.target,
    section: opts.section,
    subcategory: opts.subcategory,
    tokens: opts.tokens,
  });
  if (opts.json) {
    process.stdout.write(JSON.stringify(response, null, 2) + "\n");
    return 0;
  }
  process.stdout.write(`# ${response.metadata.list.name}\n\n`);
  for (const [i, item] of response.items.entries()) {
    process.stdout.write(`${i + 1}. ${item.name}\n   ${item.url}\n`);
    if (item.description) process.stdout.write(`   ${item.description}\n`);
    process.stdout.write("\n");
  }
  process.stdout.write(
    `tokens: ${response.tokenUsage.used}/${response.tokenUsage.limit}${response.tokenUsage.truncated ? " (truncated)" : ""}\n`
  );
  return 0;
}
