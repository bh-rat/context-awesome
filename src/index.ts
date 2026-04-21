#!/usr/bin/env node
import { createServer, IncomingMessage } from "http";
import { Command } from "commander";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServerInstance } from "./mcp-server.js";

const SERVER_VERSION = "1.0.0";
const DEFAULT_PORT = 3000;
const DEFAULT_API_HOST =
  process.env.AWESOME_CONTEXT_API_HOST ||
  process.env.CONTEXT_AWESOME_API_HOST ||
  "https://api.context-awesome.com";

const program = new Command()
  .name("context-awesome-mcp")
  .description("Context Awesome MCP server")
  .version(SERVER_VERSION, "-v, --version", "output the current version")
  .option("--transport <stdio|http>", "transport type", "stdio")
  .option("--port <number>", "port for HTTP transport", String(DEFAULT_PORT))
  .option("--api-host <url>", "Backend API host URL", DEFAULT_API_HOST)
  .option("--api-key <key>", "API key for authentication (stdio only)")
  .option("--debug", "Enable debug logging")
  .allowUnknownOption() // MCP Inspector and other wrappers may inject extra flags at spawn time.
  .parse(process.argv);

const cliOptions = program.opts<{
  transport: string;
  port: string;
  apiHost: string;
  apiKey?: string;
  debug?: boolean;
}>();

const allowedTransports = ["stdio", "http"];
if (!allowedTransports.includes(cliOptions.transport)) {
  console.error(
    `Invalid --transport value: '${cliOptions.transport}'. Must be one of: stdio, http.`
  );
  process.exit(1);
}

const TRANSPORT_TYPE = cliOptions.transport as "stdio" | "http";

// Disallow incompatible flags based on transport (same brittle argv check as before)
const passedPortFlag = process.argv.includes("--port");
const passedApiKeyFlag = process.argv.includes("--api-key");

if (TRANSPORT_TYPE === "http" && passedApiKeyFlag) {
  console.error(
    "The --api-key flag is not allowed when using --transport http. Use header-based auth at the HTTP layer instead."
  );
  process.exit(1);
}

if (TRANSPORT_TYPE === "stdio" && passedPortFlag) {
  console.error("The --port flag is not allowed when using --transport stdio.");
  process.exit(1);
}

const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10);
  return isNaN(parsed) ? DEFAULT_PORT : parsed;
})();

const sseTransports: Record<string, SSEServerTransport> = {};

function extractApiKey(req: IncomingMessage): string | undefined {
  const pick = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  const auth = pick(req.headers.authorization);
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return (
    auth ??
    pick(req.headers["x-api-key"]) ??
    pick(req.headers["awesome-context-api-key"]) ??
    pick(req.headers["context-awesome-api-key"])
  );
}

function listenWithFallback(
  server: ReturnType<typeof createServer>,
  port: number,
  attemptsLeft: number
): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
        console.warn(`Port ${port} in use, trying ${port + 1}...`);
        resolve(listenWithFallback(server, port + 1, attemptsLeft - 1));
      } else {
        reject(err);
      }
    });
    server.listen(port, () => resolve(port));
  });
}

async function main() {
  if (TRANSPORT_TYPE === "stdio") {
    const server = createServerInstance({
      apiHost: cliOptions.apiHost,
      apiKey: cliOptions.apiKey,
      debug: !!cliOptions.debug,
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Context Awesome MCP Server running on stdio");
    return;
  }

  const httpServer = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, MCP-Session-Id, MCP-Protocol-Version, X-Awesome-Context-API-Key, Awesome-Context-API-Key, X-API-Key, Authorization"
    );
    res.setHeader("Access-Control-Expose-Headers", "MCP-Session-Id");
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const apiKey = extractApiKey(req);
    const pathname = new URL(req.url ?? "", `http://${req.headers.host}`).pathname;

    try {
      const requestServer = createServerInstance({
        apiHost: cliOptions.apiHost,
        apiKey,
        debug: !!cliOptions.debug,
      });

      if (pathname === "/mcp") {
        const t = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        await requestServer.connect(t);
        await t.handleRequest(req, res);
      } else if (pathname === "/sse" && req.method === "GET") {
        const sse = new SSEServerTransport("/messages", res);
        sseTransports[sse.sessionId] = sse;
        res.on("close", () => {
          delete sseTransports[sse.sessionId];
        });
        await requestServer.connect(sse);
      } else if (pathname === "/messages" && req.method === "POST") {
        const sid =
          new URL(req.url ?? "", `http://${req.headers.host}`).searchParams.get("sessionId") ?? "";
        const sse = sseTransports[sid];
        if (!sse) {
          res.writeHead(400);
          res.end(`No transport for sessionId: ${sid}`);
          return;
        }
        await sse.handlePostMessage(req, res);
      } else if (pathname === "/ping") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("pong");
      } else if (pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "healthy",
            name: "context-awesome",
            version: SERVER_VERSION,
            transport: "http",
          })
        );
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    } catch (error) {
      console.error("request error", error);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Internal Server Error");
      }
    }
  });

  const actualPort = await listenWithFallback(httpServer, CLI_PORT, 10);
  console.error(
    `Context Awesome MCP Server running on HTTP at http://localhost:${actualPort}/mcp (SSE at /sse)`
  );
}

main().catch((err) => {
  console.error("Fatal error in main():", err);
  process.exit(1);
});
