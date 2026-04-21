import { createServer, IncomingMessage } from 'http';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { AwesomeContextAPIClient } from './api-client.js';
import { createServerInstance, ServerConfig } from './mcp-server.js';

// ---- serve ----

interface ServeOptions extends ServerConfig {
  transport: 'stdio' | 'http';
  port?: number;
}

const sseTransports: Record<string, SSEServerTransport> = {};

export async function runServe(opts: ServeOptions): Promise<void> {
  if (opts.transport === 'stdio') {
    const server = createServerInstance(opts);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Context Awesome MCP Server running on stdio');
    return;
  }
  await runHttp(opts);
}

async function runHttp(opts: ServeOptions): Promise<void> {
  const initialPort = opts.port ?? 3000;
  const httpServer = createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, MCP-Session-Id, MCP-Protocol-Version, X-Awesome-Context-API-Key, Awesome-Context-API-Key, X-API-Key, Authorization',
    );
    res.setHeader('Access-Control-Expose-Headers', 'MCP-Session-Id');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    const apiKey = extractApiKey(req);
    const pathname = new URL(req.url ?? '', `http://${req.headers.host}`).pathname;

    try {
      const requestServer = createServerInstance({ apiHost: opts.apiHost, apiKey, debug: opts.debug });

      if (pathname === '/mcp') {
        const t = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        await requestServer.connect(t);
        await t.handleRequest(req, res);
      } else if (pathname === '/sse' && req.method === 'GET') {
        const sse = new SSEServerTransport('/messages', res);
        sseTransports[sse.sessionId] = sse;
        res.on('close', () => { delete sseTransports[sse.sessionId]; });
        await requestServer.connect(sse);
      } else if (pathname === '/messages' && req.method === 'POST') {
        const sid = new URL(req.url ?? '', `http://${req.headers.host}`).searchParams.get('sessionId') ?? '';
        const sse = sseTransports[sid];
        if (!sse) { res.writeHead(400); res.end(`No transport for sessionId: ${sid}`); return; }
        await sse.handlePostMessage(req, res);
      } else if (pathname === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('pong');
      } else if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', name: 'context-awesome', version: '1.0.0', transport: 'http' }));
      } else {
        res.writeHead(404); res.end('Not found');
      }
    } catch (error) {
      console.error('request error', error);
      if (!res.headersSent) { res.writeHead(500); res.end('Internal Server Error'); }
    }
  });

  await listenWithFallback(httpServer, initialPort, 10);
  console.error(`Context Awesome MCP Server running on HTTP at http://localhost:${initialPort}/mcp (SSE at /sse)`);
}

function extractApiKey(req: IncomingMessage): string | undefined {
  const pick = (v: string | string[] | undefined) =>
    typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
  const auth = pick(req.headers.authorization);
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  return (
    auth ??
    pick(req.headers['x-api-key']) ??
    pick(req.headers['awesome-context-api-key']) ??
    pick(req.headers['context-awesome-api-key'])
  );
}

function listenWithFallback(server: ReturnType<typeof createServer>, port: number, attemptsLeft: number): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
        console.warn(`Port ${port} in use, trying ${port + 1}...`);
        resolve(listenWithFallback(server, port + 1, attemptsLeft - 1));
      } else {
        reject(err);
      }
    });
    server.listen(port, () => resolve());
  });
}

// ---- search ----

export interface SearchCliOptions {
  query: string;
  apiHost: string;
  apiKey?: string;
  limit?: number;
  sortBy?: 'relevance' | 'stars' | 'recent';
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
    process.stdout.write(JSON.stringify(response, null, 2) + '\n');
    return 0;
  }
  if (!response.results.length) {
    process.stdout.write(`No results for "${opts.query}".\n`);
    return 0;
  }
  for (const [i, r] of response.results.entries()) {
    const stars = typeof r.stars === 'number' ? `  ★${r.stars}` : '';
    process.stdout.write(`${i + 1}. ${r.name}${stars}\n   ${r.url}\n   source: ${r.githubRepo}${r.category ? `  [${r.category}]` : ''}\n`);
    if (r.description) process.stdout.write(`   ${r.description}\n`);
    process.stdout.write('\n');
  }
  process.stdout.write(`${response.total} total • ${response.took}ms\n`);
  return 0;
}

// ---- lookup ----

export interface LookupCliOptions {
  query: string;
  apiHost: string;
  apiKey?: string;
  limit?: number;
  confidence?: number;
  json?: boolean;
}

export async function runLookup(opts: LookupCliOptions): Promise<number> {
  const client = new AwesomeContextAPIClient(opts.apiHost, opts.apiKey);
  const response = await client.findSections({
    query: opts.query,
    limit: opts.limit ?? 10,
    confidence: opts.confidence ?? 0.3,
  });
  if (opts.json) {
    process.stdout.write(JSON.stringify(response, null, 2) + '\n');
    return 0;
  }
  if (!response.sections.length) {
    process.stdout.write(`No sections matching "${opts.query}".\n`);
    return 0;
  }
  for (const [i, s] of response.sections.entries()) {
    process.stdout.write(`${i + 1}. ${s.listName} — ${s.category}${s.subcategory ? ` › ${s.subcategory}` : ''}\n`);
    process.stdout.write(`   repo: ${s.githubRepo}  items: ${s.itemCount}  confidence: ${(s.confidence * 100).toFixed(0)}%\n`);
    process.stdout.write(`   listId: ${s.listId}\n\n`);
  }
  return 0;
}

// ---- docs ----

export interface DocsCliOptions {
  target: string;
  apiHost: string;
  apiKey?: string;
  section?: string;
  subcategory?: string;
  tokens?: number;
  json?: boolean;
}

export async function runDocs(opts: DocsCliOptions): Promise<number> {
  const client = new AwesomeContextAPIClient(opts.apiHost, opts.apiKey);
  const useListId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(opts.target);
  const response = await client.getItems({
    listId: useListId ? opts.target : undefined,
    githubRepo: useListId ? undefined : opts.target,
    section: opts.section,
    subcategory: opts.subcategory,
    tokens: opts.tokens,
  });
  if (opts.json) {
    process.stdout.write(JSON.stringify(response, null, 2) + '\n');
    return 0;
  }
  process.stdout.write(`# ${response.metadata.list.name}\n\n`);
  for (const [i, item] of response.items.entries()) {
    process.stdout.write(`${i + 1}. ${item.name}\n   ${item.url}\n`);
    if (item.description) process.stdout.write(`   ${item.description}\n`);
    process.stdout.write('\n');
  }
  process.stdout.write(`tokens: ${response.tokenUsage.used}/${response.tokenUsage.limit}${response.tokenUsage.truncated ? ' (truncated)' : ''}\n`);
  return 0;
}
