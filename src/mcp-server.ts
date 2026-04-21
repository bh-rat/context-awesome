import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AwesomeContextAPIClient } from './api-client.js';
import { renderFindSections, renderGetItems } from './formatters.js';
import { registerSearchItemsTool } from './tools/search-items.js';
import type { APIError } from './types.js';

const DEFAULT_MINIMUM_TOKENS = 10000;

export interface ServerConfig {
  apiHost: string;
  apiKey?: string;
  debug?: boolean;
}

export function createServerInstance(config: ServerConfig): McpServer {
  const apiClient = new AwesomeContextAPIClient(config.apiHost, config.apiKey, !!config.debug);

  const server = new McpServer(
    { name: 'context-awesome', version: '1.0.0' },
    {
      instructions:
        'Use this server to search and retrieve curated awesome lists. Prefer `find_awesome_section` when you want a whole section, `search_awesome_items` for individual tools/resources, and `get_awesome_items` to fetch items from a known list/section.',
    },
  );

  server.registerTool(
    'find_awesome_section',
    {
      title: 'Find Awesome List Section',
      description:
        'Discovers sections/categories across awesome lists matching a query. Call this before `get_awesome_items` unless you already know the githubRepo or listId.',
      inputSchema: {
        query: z.string().describe('Search terms for finding sections across awesome lists'),
        confidence: z.number().min(0).max(1).optional().default(0.3),
        limit: z.number().min(1).max(50).optional().default(10),
      },
    },
    async ({ query, confidence = 0.3, limit = 10 }) => {
      try {
        const response = await apiClient.findSections({ query, confidence, limit });
        return { content: [{ type: 'text', text: renderFindSections(query, response) }] };
      } catch (err) {
        const e = err as APIError;
        return { content: [{ type: 'text', text: e.message || 'Failed to search for sections.' }] };
      }
    },
  );

  server.registerTool(
    'get_awesome_items',
    {
      title: 'Get Awesome List Items',
      description:
        'Retrieves items from a specific awesome list or section with token limiting.',
      inputSchema: {
        listId: z.string().optional(),
        githubRepo: z.string().optional(),
        section: z.string().optional(),
        subcategory: z.string().optional(),
        tokens: z
          .preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number())
          .transform((v) => (v < DEFAULT_MINIMUM_TOKENS ? DEFAULT_MINIMUM_TOKENS : v))
          .optional(),
        offset: z.number().min(0).optional().default(0),
      },
    },
    async ({ listId, githubRepo, section, subcategory, tokens = DEFAULT_MINIMUM_TOKENS, offset = 0 }) => {
      if (!listId && !githubRepo) {
        return {
          content: [{ type: 'text', text: 'Either listId or githubRepo must be provided. Use `find_awesome_section` first.' }],
        };
      }
      try {
        const response = await apiClient.getItems({ listId, githubRepo, section, subcategory, tokens, offset });
        return { content: [{ type: 'text', text: renderGetItems(response) }] };
      } catch (err) {
        const e = err as APIError;
        return { content: [{ type: 'text', text: e.message || 'Failed to retrieve items.' }] };
      }
    },
  );

  registerSearchItemsTool(server, apiClient);

  return server;
}
