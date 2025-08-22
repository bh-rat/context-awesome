import fetch from 'node-fetch';
import {
  FindSectionParams,
  FindSectionResponse,
  GetItemsParams,
  GetItemsResponse,
  APIError,
} from './types.js';

export class AwesomeContextAPIClient {
  private baseUrl: string;
  private apiKey?: string;
  private debug: boolean;

  constructor(baseUrl: string, apiKey?: string, debug = false) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.debug = debug;
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.error('[API Client]', ...args);
    }
  }

  private async request<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Source': 'context-awesome',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    this.log(`Request: ${url.toString()}`);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json() as any;

      if (!response.ok) {
        let errorMessage = data.message || `HTTP ${response.status}: ${response.statusText}`;
        let errorCode = data.error || 'API_ERROR';
        
        // Provide better error messages for specific status codes
        if (response.status === 429) {
          errorMessage = 'Rate limited due to too many requests. Please try again later.';
          errorCode = 'RATE_LIMIT';
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized. Please check your API key.';
          errorCode = 'UNAUTHORIZED';
        } else if (response.status === 404) {
          errorMessage = 'The requested resource was not found.';
          errorCode = 'NOT_FOUND';
        }
        
        const error: APIError = {
          code: errorCode,
          message: errorMessage,
          statusCode: response.status,
        };
        throw error;
      }

      this.log(`Response:`, data);
      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.code) {
        throw error;
      }
      
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        const apiError: APIError = {
          code: 'TIMEOUT',
          message: 'Request timeout after 30 seconds',
        };
        throw apiError;
      }
      
      const apiError: APIError = {
        code: 'NETWORK_ERROR',
        message: `Failed to connect to API: ${error.message}`,
      };
      throw apiError;
    }
  }

  async findSections(params: FindSectionParams): Promise<FindSectionResponse> {
    this.log('Finding sections with params:', params);
    
    const response = await this.request<any>('/api/find-section', {
      query: params.query,  // Changed from 'q' to 'query'
      confidence: params.confidence,
      limit: params.limit,
    });

    // Handle both 'results' and 'sections' response formats
    const sections = response.results || response.sections || [];
    
    return {
      sections: sections.map((section: any) => ({
        id: section.id || section._id || '',
        listId: section.listId || '',
        listName: section.listName || section.list_name || '',
        githubRepo: section.githubRepo || section.github_repo || '',
        category: section.category || section.section || '',
        subcategory: section.subcategory || section.sub_category || '',
        itemCount: section.itemCount || section.item_count || 0,
        confidence: section.confidence || section.score || 0,
        description: section.description || '',
      })),
      total: response.total || sections.length,
    };
  }

  async getItems(params: GetItemsParams): Promise<GetItemsResponse> {
    this.log('Getting items with params:', params);
    
    if (!params.listId && !params.githubRepo) {
      const error: APIError = {
        code: 'INVALID_PARAMS',
        message: 'Either listId or githubRepo must be provided',
      };
      throw error;
    }

    const response = await this.request<any>('/api/get-items', {
      listId: params.listId,
      githubRepo: params.githubRepo,
      section: params.section,
      subcategory: params.subcategory,
      limit: params.tokens ? Math.floor(params.tokens / 50) : undefined,
      offset: params.offset,
    });

    const items = response.items || response.data || [];
    const metadata = response.metadata || response.meta || {};
    
    const tokenCount = this.estimateTokens(items);
    const tokenLimit = params.tokens || 10000;
    const truncated = tokenCount > tokenLimit;
    
    const truncatedItems = truncated 
      ? this.truncateToTokenLimit(items, tokenLimit)
      : items;

    return {
      items: truncatedItems.map((item: any) => ({
        id: item.id || item._id || '',
        name: item.name || item.title || '',
        description: item.description || '',
        url: item.url || item.link || '',
        githubStars: item.stars || item.githubStars || item.github_stars,
        githubRepo: item.repo || item.githubRepo || item.github_repo,
        tags: item.tags || [],
        lastUpdated: item.lastUpdated || item.updated_at || item.last_updated,
      })),
      metadata: {
        list: {
          id: metadata.listId || metadata.list_id || params.listId || '',
          name: metadata.listName || metadata.list_name || '',
          githubRepo: metadata.githubRepo || metadata.github_repo || params.githubRepo || '',
          description: metadata.description || '',
          totalItems: metadata.totalItems || metadata.total_items || items.length,
        },
        section: metadata.section || params.section,
        subcategory: metadata.subcategory || params.subcategory,
        totalItems: metadata.totalItems || metadata.total_items || items.length,
        offset: metadata.offset || params.offset || 0,
        hasMore: metadata.hasMore || metadata.has_more || false,
      },
      tokenUsage: {
        used: this.estimateTokens(truncatedItems),
        limit: tokenLimit,
        truncated,
      },
    };
  }

  private estimateTokens(items: any[]): number {
    const text = JSON.stringify(items);
    return Math.ceil(text.length / 4);
  }

  private truncateToTokenLimit(items: any[], limit: number): any[] {
    const result: any[] = [];
    let currentTokens = 0;

    for (const item of items) {
      const itemTokens = this.estimateTokens([item]);
      if (currentTokens + itemTokens > limit) {
        break;
      }
      result.push(item);
      currentTokens += itemTokens;
    }

    return result;
  }
}