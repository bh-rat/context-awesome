#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { createServer } from "http";
import { Command } from "commander";
import { IncomingMessage } from "http";
import { AwesomeContextAPIClient } from "./api-client.js";
import { APIError } from "./types.js";

const DEFAULT_MINIMUM_TOKENS = 10000;

// Parse CLI arguments using commander
const program = new Command()
  .option("--transport <stdio|http>", "transport type", "stdio")
  .option("--port <number>", "port for HTTP transport", "3000")
  .option("--api-host <url>", "Backend API host URL", process.env.AWESOME_CONTEXT_API_HOST || "http://localhost:3000")
  .option("--api-key <key>", "API key for authentication")
  .option("--debug", "Enable debug logging")
  .allowUnknownOption() // let MCP Inspector / other wrappers pass through extra flags
  .parse(process.argv);

const cliOptions = program.opts<{
  transport: string;
  port: string;
  apiHost: string;
  apiKey?: string;
  debug?: boolean;
}>();

// Validate transport option
const allowedTransports = ["stdio", "http"];
if (!allowedTransports.includes(cliOptions.transport)) {
  console.error(
    `Invalid --transport value: '${cliOptions.transport}'. Must be one of: stdio, http.`
  );
  process.exit(1);
}

// Transport configuration
const TRANSPORT_TYPE = (cliOptions.transport || "stdio") as "stdio" | "http";

// Disallow incompatible flags based on transport
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

// HTTP port configuration
const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10);
  return isNaN(parsed) ? undefined : parsed;
})();

// Store SSE transports by session ID
const sseTransports: Record<string, SSEServerTransport> = {};

function getClientIp(req: IncomingMessage): string | undefined {
  // Check both possible header casings
  const forwardedFor = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];

  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const ipList = ips.split(",").map((ip) => ip.trim());

    // Find the first public IP address
    for (const ip of ipList) {
      const plainIp = ip.replace(/^::ffff:/, "");
      if (
        !plainIp.startsWith("10.") &&
        !plainIp.startsWith("192.168.") &&
        !/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(plainIp)
      ) {
        return plainIp;
      }
    }
    // If all are private, use the first one
    return ipList[0].replace(/^::ffff:/, "");
  }

  // Fallback: use remote address, strip IPv6-mapped IPv4
  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress.replace(/^::ffff:/, "");
  }
  return undefined;
}

// Function to create a new server instance with all tools registered
function createServerInstance(_clientIp?: string, apiKey?: string) {
  const apiClient = new AwesomeContextAPIClient(
    cliOptions.apiHost,
    apiKey,
    cliOptions.debug
  );

  const server = new McpServer(
    {
      name: "awesome-context",
      version: "1.0.0",
    },
    {
      instructions:
        "Use this server to search and retrieve documentation from curated awesome lists. Always use find_awesome_section first to discover relevant sections, then use get_awesome_items to retrieve specific items.",
    }
  );

  // Register find_awesome_section tool
  server.registerTool(
    "find_awesome_section",
    {
      title: "Find Awesome List Section",
      description: `Discovers sections/categories across awesome lists matching a search query.

You MUST call this function before 'get_awesome_items' to discover available sections UNLESS the user explicitly provides a githubRepo or listId.

Selection Process:
1. Analyze the query to understand what type of resources the user is looking for
2. Return the most relevant matches based on:
   - Name similarity to the query
   - Category/section relevance
   - Number of items in the section
   - Confidence score

Response Format:
- Returns matching sections with metadata
- Includes repository information, item counts, and confidence scores
- Use the githubRepo or listId from results for get_awesome_items

For ambiguous queries, multiple relevant sections will be returned for the user to choose from.`,
      inputSchema: {
        query: z
          .string()
          .describe("Search terms for finding sections across awesome lists"),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .default(0.3)
          .describe("Minimum confidence score (0-1)"),
        limit: z
          .number()
          .min(1)
          .max(50)
          .optional()
          .default(10)
          .describe("Maximum sections to return"),
      },
    },
    async ({ query, confidence = 0.3, limit = 10 }) => {
      try {
        const response = await apiClient.findSections({ query, confidence, limit });
        
        if (!response.sections || response.sections.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No sections found matching "${query}". Try different search terms or browse available lists.`,
              },
            ],
          };
        }

        const formattedSections = response.sections
          .map(
            (section) => {
              const githubUrl = `https://github.com/${section.githubRepo}`;
              const sectionPath = section.category.toLowerCase().replace(/\s+/g, '-');
              const sectionUrl = `${githubUrl}#${sectionPath}`;
              
              return `### ${section.listName} - ${section.category}${
                section.subcategory ? ` > ${section.subcategory}` : ''
              }

- **Repository**: \`${section.githubRepo}\`
- **GitHub URL**: ${githubUrl}
- **Section URL**: ${sectionUrl}
- **Items**: ${section.itemCount}
- **Confidence**: ${(section.confidence * 100).toFixed(1)}%
- **Description**: ${
                section.description || 
                `A curated collection of ${section.itemCount} ${section.category.toLowerCase()} resources from ${section.listName}`
              }`;
            }
          )
          .join('\n\n');

        return {
          content: [
            {
              type: "text",
              text: `# Search Results for "${query}"

Found ${response.sections.length} relevant sections across awesome lists.

${formattedSections}

---

## How to retrieve items

To get detailed items from any section above, use the \`get_awesome_items\` tool with:
- **githubRepo**: The repository path (e.g., \`"${response.sections[0]?.githubRepo || 'repo/name'}"\`)
- **section** (optional): The category name to filter results (e.g., \`"${response.sections[0]?.category || 'Section Name'}"\`)
- **tokens** (optional): Maximum tokens to return (default: 10000)
- **offset** (optional): For pagination (default: 0)

Higher confidence scores indicate better matches for your search query.`,
            },
          ],
        };
      } catch (error: any) {
        const apiError = error as APIError;
        return {
          content: [
            {
              type: "text",
              text: apiError.message || "Failed to search for sections. Please try again.",
            },
          ],
        };
      }
    }
  );

  // Register get_awesome_items tool
  server.registerTool(
    "get_awesome_items",
    {
      title: "Get Awesome List Items",
      description:
        "Retrieves items from a specific awesome list or section with token limiting. You must call 'find_awesome_section' first to discover available sections, UNLESS the user explicitly provides a githubRepo or listId.",
      inputSchema: {
        listId: z
          .string()
          .optional()
          .describe("UUID of the list (from find_awesome_section results)"),
        githubRepo: z
          .string()
          .optional()
          .describe("GitHub repo path (e.g., 'sindresorhus/awesome') from find_awesome_section results"),
        section: z
          .string()
          .optional()
          .describe("Category/section name to filter"),
        subcategory: z
          .string()
          .optional()
          .describe("Subcategory to filter"),
        tokens: z
          .preprocess((val) => (typeof val === "string" ? Number(val) : val), z.number())
          .transform((val) => (val < DEFAULT_MINIMUM_TOKENS ? DEFAULT_MINIMUM_TOKENS : val))
          .optional()
          .describe(
            `Maximum number of tokens to return (default: ${DEFAULT_MINIMUM_TOKENS}). Higher values provide more items but consume more tokens.`
          ),
        offset: z
          .number()
          .min(0)
          .optional()
          .default(0)
          .describe("Pagination offset for retrieving more items"),
      },
    },
    async ({ listId, githubRepo, section, subcategory, tokens = DEFAULT_MINIMUM_TOKENS, offset = 0 }) => {
      if (!listId && !githubRepo) {
        return {
          content: [
            {
              type: "text",
              text: "Either listId or githubRepo must be provided. Use 'find_awesome_section' first to discover available lists and sections.",
            },
          ],
        };
      }

      try {
        const response = await apiClient.getItems({
          listId,
          githubRepo,
          section,
          subcategory,
          tokens,
          offset,
        });
        
        if (!response.items || response.items.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No items found for the specified criteria. Try adjusting your filters or use find_awesome_section to discover available sections.",
              },
            ],
          };
        }

        const { metadata, items, tokenUsage } = response;
        
        const header =
          `# ${metadata.list.name}` +
          (metadata.section ? ` - ${metadata.section}` : '') +
          (metadata.subcategory ? ` > ${metadata.subcategory}` : '') +
          '\n\n';

        const listDescription = metadata.list.description
          ? `> ${metadata.list.description}\n\n`
          : '';

        const formattedItems = items
          .map((item, index) => {
            let itemText = `## ${index + 1}. ${item.name}\n\n`;
            
            if (item.description) {
              itemText += `${item.description}\n\n`;
            }
            
            itemText += `**URL**: ${item.url}\n`;
            
            if (item.githubRepo) {
              itemText += `**GitHub**: https://github.com/${item.githubRepo}\n`;
            }
            
            if (item.githubStars) {
              itemText += `**Stars**: ${item.githubStars.toLocaleString()}\n`;
            }
            
            if (item.tags && item.tags.length > 0) {
              itemText += `**Tags**: ${item.tags.join(', ')}\n`;
            }
            
            return itemText;
          })
          .join('\n---\n\n');

        const footer =
          `\n---\n\n` +
          `## Metadata\n\n` +
          `- **Token usage**: ${tokenUsage.used.toLocaleString()}/${tokenUsage.limit.toLocaleString()}` +
          (tokenUsage.truncated ? ' (truncated)' : '') +
          '\n' +
          `- **Items displayed**: ${items.length} of ${metadata.totalItems}\n` +
          (metadata.hasMore
            ? `- **Next page**: Use \`offset: ${metadata.offset + items.length}\` to get more items\n`
            : '');

        return {
          content: [
            {
              type: "text",
              text: header + listDescription + formattedItems + footer,
            },
          ],
        };
      } catch (error: any) {
        const apiError = error as APIError;
        return {
          content: [
            {
              type: "text",
              text: apiError.message || "Failed to retrieve items. Please check your parameters and try again.",
            },
          ],
        };
      }
    }
  );

  return server;
}

async function main() {
  const transportType = TRANSPORT_TYPE;

  if (transportType === "http") {
    // Get initial port from environment or use default
    const initialPort = CLI_PORT ?? 3000;
    // Keep track of which port we end up using
    let actualPort = initialPort;
    const httpServer = createServer(async (req, res) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`).pathname;

      // Set CORS headers for all responses
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, MCP-Session-Id, MCP-Protocol-Version, X-Awesome-Context-API-Key, Awesome-Context-API-Key, X-API-Key, Authorization"
      );
      res.setHeader("Access-Control-Expose-Headers", "MCP-Session-Id");

      // Handle preflight OPTIONS requests
      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // Function to extract header value safely, handling both string and string[] cases
      const extractHeaderValue = (value: string | string[] | undefined): string | undefined => {
        if (!value) return undefined;
        return typeof value === "string" ? value : value[0];
      };

      // Extract Authorization header and remove Bearer prefix if present
      const extractBearerToken = (
        authHeader: string | string[] | undefined
      ): string | undefined => {
        const header = extractHeaderValue(authHeader);
        if (!header) return undefined;

        // If it starts with 'Bearer ', remove that prefix
        if (header.startsWith("Bearer ")) {
          return header.substring(7).trim();
        }

        // Otherwise return the raw value
        return header;
      };

      // Check headers in order of preference
      const apiKey =
        extractBearerToken(req.headers.authorization) ||
        extractHeaderValue(req.headers["Awesome-Context-API-Key"]) ||
        extractHeaderValue(req.headers["X-API-Key"]) ||
        extractHeaderValue(req.headers["awesome-context-api-key"]) ||
        extractHeaderValue(req.headers["x-api-key"]) ||
        extractHeaderValue(req.headers["Awesome_Context_API_Key"]) ||
        extractHeaderValue(req.headers["X_API_Key"]) ||
        extractHeaderValue(req.headers["awesome_context_api_key"]) ||
        extractHeaderValue(req.headers["x_api_key"]);

      try {
        // Extract client IP address using socket remote address (most reliable)
        const clientIp = getClientIp(req);

        // Create new server instance for each request
        const requestServer = createServerInstance(clientIp, apiKey);

        if (url === "/mcp") {
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
          });
          await requestServer.connect(transport);
          await transport.handleRequest(req, res);
        } else if (url === "/sse" && req.method === "GET") {
          // Create new SSE transport for GET request
          const sseTransport = new SSEServerTransport("/messages", res);
          // Store the transport by session ID
          sseTransports[sseTransport.sessionId] = sseTransport;
          // Clean up transport when connection closes
          res.on("close", () => {
            delete sseTransports[sseTransport.sessionId];
          });
          await requestServer.connect(sseTransport);
        } else if (url === "/messages" && req.method === "POST") {
          // Get session ID from query parameters
          const sessionId =
            new URL(req.url || "", `http://${req.headers.host}`).searchParams.get("sessionId") ??
            "";

          if (!sessionId) {
            res.writeHead(400);
            res.end("Missing sessionId parameter");
            return;
          }

          // Get existing transport for this session
          const sseTransport = sseTransports[sessionId];
          if (!sseTransport) {
            res.writeHead(400);
            res.end(`No transport found for sessionId: ${sessionId}`);
            return;
          }

          // Handle the POST message with the existing transport
          await sseTransport.handlePostMessage(req, res);
        } else if (url === "/ping") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("pong");
        } else if (url === "/health") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            status: "healthy",
            name: "awesome-context-mcp",
            version: "1.0.0",
            transport: transportType,
          }));
        } else {
          res.writeHead(404);
          res.end("Not found");
        }
      } catch (error) {
        console.error("Error handling request:", error);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end("Internal Server Error");
        }
      }
    });

    // Function to attempt server listen with port fallback
    const startServer = (port: number, maxAttempts = 10) => {
      httpServer.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && port < initialPort + maxAttempts) {
          console.warn(`Port ${port} is in use, trying port ${port + 1}...`);
          startServer(port + 1, maxAttempts);
        } else {
          console.error(`Failed to start server: ${err.message}`);
          process.exit(1);
        }
      });

      httpServer.listen(port, () => {
        actualPort = port;
        console.error(
          `Awesome Context MCP Server running on ${transportType.toUpperCase()} at http://localhost:${actualPort}/mcp with SSE endpoint at /sse`
        );
      });
    };

    // Start the server with initial port
    startServer(initialPort);
  } else {
    // Stdio transport - this is already stateless by nature
    const server = createServerInstance(undefined, cliOptions.apiKey);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Awesome Context MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});