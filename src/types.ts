export interface FindSectionParams {
  query: string;
  confidence?: number;
  limit?: number;
}

export interface Section {
  id: string;
  listId: string;
  listName: string;
  githubRepo: string;
  category: string;
  subcategory?: string;
  itemCount: number;
  confidence: number;
  description?: string;
}

export interface FindSectionResponse {
  sections: Section[];
  total: number;
}

export interface GetItemsParams {
  listId?: string;
  githubRepo?: string;
  section?: string;
  subcategory?: string;
  tokens?: number;
  offset?: number;
}

export interface AwesomeItem {
  id: string;
  name: string;
  description: string;
  url: string;
  githubStars?: number;
  githubRepo?: string;
  tags?: string[];
  lastUpdated?: string;
}

export interface ListMetadata {
  id: string;
  name: string;
  githubRepo: string;
  description?: string;
  totalItems: number;
}

export interface GetItemsResponse {
  items: AwesomeItem[];
  metadata: {
    list: ListMetadata;
    section?: string;
    subcategory?: string;
    totalItems: number;
    offset: number;
    hasMore: boolean;
  };
  tokenUsage: {
    used: number;
    limit: number;
    truncated: boolean;
  };
}

export interface ServerConfig {
  transport: "stdio" | "http" | "sse";
  port: number;
  apiHost: string;
  apiKey?: string;
  debug: boolean;
}

export interface APIError {
  code: string;
  message: string;
  statusCode?: number;
}

export interface SearchItemsParams {
  query: string;
  limit?: number;
  offset?: number;
  categories?: string[];
  sortBy?: "relevance" | "stars" | "recent";
}

export interface SearchItemResult {
  id: string;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  githubRepo: string;
  stars?: number;
  score?: number;
}

export interface SearchItemsResponse {
  results: SearchItemResult[];
  total: number;
  took: number;
  query: string;
}
