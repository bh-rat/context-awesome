import { AwesomeContextAPIClient } from "../api-client.js";

function mockFetch(response: any, status = 200) {
  const ok = status >= 200 && status < 300;
  return jest.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "ERROR",
    json: async () => response,
  });
}

describe("AwesomeContextAPIClient.searchItems", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GETs /api/search with the query + limit", async () => {
    const fetchMock = mockFetch({
      success: true,
      results: [
        {
          id: "1",
          name: "foo",
          url: "https://x",
          description: null,
          category: null,
          subcategory: null,
          githubRepo: "o/r",
        },
      ],
      total: 1,
      took: 10,
      query: "foo",
    });
    (globalThis as any).fetch = fetchMock;
    const client = new AwesomeContextAPIClient("http://api.test", undefined, false);
    const r = await client.searchItems({ query: "foo", limit: 5 });
    expect(r.total).toBe(1);
    expect(r.results[0].githubRepo).toBe("o/r");
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/search?");
    expect(calledUrl).toContain("query=foo");
    expect(calledUrl).toContain("limit=5");
  });

  it("propagates the Authorization header when an apiKey is set", async () => {
    const fetchMock = mockFetch({ success: true, results: [], total: 0, took: 1, query: "x" });
    (globalThis as any).fetch = fetchMock;
    const client = new AwesomeContextAPIClient("http://api.test", "key-1", false);
    await client.searchItems({ query: "x" });
    const init = fetchMock.mock.calls[0][1] as any;
    expect(init.headers.Authorization).toBe("Bearer key-1");
  });
});
