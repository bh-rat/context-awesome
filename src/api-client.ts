import type {
  FindSectionParams,
  FindSectionResponse,
  GetItemsParams,
  GetItemsResponse,
  SearchItemsParams,
  SearchItemsResponse,
  APIError,
} from "./types.js";

type FetchInit = {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
};

export class AwesomeContextAPIClient {
  private baseUrl: string;
  private apiKey?: string;
  private debug: boolean;

  constructor(baseUrl: string, apiKey?: string, debug = false) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.debug = debug;
  }

  private log(...args: unknown[]) {
    if (this.debug) console.error("[API Client]", ...args);
  }

  private buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Source": "context-awesome",
      ...extra,
    };
    if (this.apiKey) h["Authorization"] = `Bearer ${this.apiKey}`;
    return h;
  }

  private async request<T>(
    endpoint: string,
    opts: { params?: Record<string, unknown>; method?: "GET" | "POST"; body?: unknown } = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (opts.params) {
      for (const [k, v] of Object.entries(opts.params)) {
        if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
      }
    }

    const init: FetchInit = {
      method: opts.method ?? "GET",
      headers: this.buildHeaders(),
    };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);

    this.log(`${init.method} ${url.toString()}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url.toString(), { ...init, signal: controller.signal });
      clearTimeout(timeout);
      const data = (await response.json()) as any;

      if (!response.ok) {
        const mapped: APIError = mapErrorResponse(response.status, data);
        throw mapped;
      }
      this.log("response", data);
      return data as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err && typeof err === "object" && "code" in err) throw err;
      if (err?.name === "AbortError") {
        const e: APIError = { code: "TIMEOUT", message: "Request timeout after 30 seconds" };
        throw e;
      }
      const e: APIError = {
        code: "NETWORK_ERROR",
        message: `Failed to connect to API: ${err?.message ?? String(err)}`,
      };
      throw e;
    }
  }

  async findSections(params: FindSectionParams): Promise<FindSectionResponse> {
    const response = await this.request<any>("/api/find-section", {
      params: { query: params.query, confidence: params.confidence, limit: params.limit },
    });
    const sections = response.results || response.sections || [];
    return {
      sections: sections.map((s: any) => ({
        id: s.id ?? s._id ?? "",
        listId: s.listId ?? "",
        listName: s.listName ?? s.list_name ?? "",
        githubRepo: s.githubRepo ?? s.github_repo ?? "",
        category: s.category ?? s.section ?? "",
        subcategory: s.subcategory ?? s.sub_category ?? "",
        itemCount: s.itemCount ?? s.item_count ?? 0,
        confidence: s.confidence ?? s.score ?? 0,
        description: s.description ?? "",
      })),
      total: response.total ?? sections.length,
    };
  }

  async getItems(params: GetItemsParams): Promise<GetItemsResponse> {
    if (!params.listId && !params.githubRepo) {
      const e: APIError = {
        code: "INVALID_PARAMS",
        message: "Either listId or githubRepo must be provided",
      };
      throw e;
    }
    const response = await this.request<any>("/api/get-items", {
      params: {
        listId: params.listId,
        githubRepo: params.githubRepo,
        section: params.section,
        subcategory: params.subcategory,
        limit: params.tokens ? Math.floor(params.tokens / 50) : undefined,
        offset: params.offset,
      },
    });
    const items = response.items || response.data || [];
    const metadata = response.metadata || response.meta || {};
    return {
      items: items.map((i: any) => ({
        id: i.id ?? i._id ?? "",
        name: i.name ?? i.title ?? "",
        description: i.description ?? "",
        url: i.url ?? i.link ?? "",
        githubStars: i.stars ?? i.githubStars ?? i.github_stars,
        githubRepo: i.repo ?? i.githubRepo ?? i.github_repo,
        tags: i.tags ?? [],
        lastUpdated: i.lastUpdated ?? i.updated_at ?? i.last_updated,
      })),
      metadata: {
        list: {
          id: metadata.list?.id ?? metadata.listId ?? params.listId ?? "",
          name: metadata.list?.name ?? metadata.listName ?? "",
          githubRepo: metadata.list?.githubRepo ?? metadata.githubRepo ?? params.githubRepo ?? "",
          description: metadata.list?.description ?? metadata.description ?? "",
          totalItems: metadata.pagination?.total ?? metadata.totalItems ?? items.length,
        },
        section: metadata.section ?? params.section,
        subcategory: metadata.subcategory ?? params.subcategory,
        totalItems: metadata.pagination?.total ?? metadata.totalItems ?? items.length,
        offset: metadata.pagination?.offset ?? metadata.offset ?? params.offset ?? 0,
        hasMore: metadata.pagination?.hasMore ?? false,
      },
      tokenUsage: {
        used: metadata.tokenUsage?.used ?? 0,
        limit: metadata.tokenUsage?.limit ?? params.tokens ?? 10000,
        truncated: metadata.tokenUsage?.truncated ?? false,
      },
    };
  }

  async searchItems(params: SearchItemsParams): Promise<SearchItemsResponse> {
    const response = await this.request<any>("/api/search", {
      params: {
        query: params.query,
        limit: params.limit,
        offset: params.offset,
        categories: params.categories?.join(","),
        sortBy: params.sortBy,
      },
    });
    return {
      results: response.results ?? [],
      total: response.total ?? response.results?.length ?? 0,
      took: response.took ?? 0,
      query: response.query ?? params.query,
    };
  }
}

function mapErrorResponse(status: number, data: any): APIError {
  const baseMessage = data?.message ?? data?.error ?? `HTTP ${status}`;
  if (status === 401)
    return {
      code: "UNAUTHORIZED",
      message: "Unauthorized. Please check your API key.",
      statusCode: 401,
    };
  if (status === 404)
    return { code: "NOT_FOUND", message: "The requested resource was not found.", statusCode: 404 };
  if (status === 429)
    return {
      code: "RATE_LIMIT",
      message: "Rate limited. Please try again later.",
      statusCode: 429,
    };
  return { code: "API_ERROR", message: baseMessage, statusCode: status };
}
