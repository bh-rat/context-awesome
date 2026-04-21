import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AwesomeContextAPIClient } from '../api-client.js';
import { renderSearchItems } from '../formatters.js';
import type { APIError } from '../types.js';

export function registerSearchItemsTool(server: McpServer, client: AwesomeContextAPIClient) {
  server.registerTool(
    'search_awesome_items',
    {
      title: 'Search Awesome Items',
      description:
        'Full-text search across every parsed item in every awesome list. Use this when the user wants individual tools/resources (not whole sections). Returns the best-matching items with descriptions, source list, and star counts.',
      inputSchema: {
        query: z.string().describe('Search keywords (e.g., "postgres ORM", "react state management")'),
        limit: z.number().min(1).max(100).optional().default(20).describe('Max results (default 20)'),
        categories: z.array(z.string()).optional().describe('Filter to items tagged with these categories'),
        sortBy: z.enum(['relevance', 'stars', 'recent']).optional().default('relevance'),
      },
    },
    async ({ query, limit, categories, sortBy }) => {
      try {
        const response = await client.searchItems({ query, limit, categories, sortBy });
        return { content: [{ type: 'text', text: renderSearchItems(query, response) }] };
      } catch (err) {
        const e = err as APIError;
        return { content: [{ type: 'text', text: e.message || 'Failed to search items.' }] };
      }
    },
  );
}
