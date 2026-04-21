import { runSearch } from '../commands.js';

describe('runSearch', () => {
  beforeEach(() => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });
  afterEach(() => { jest.restoreAllMocks(); });

  it('prints the results table', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200, statusText: 'OK',
      json: async () => ({
        success: true,
        results: [{ id: '1', name: 'pg', url: 'https://pg', githubRepo: 'o/r', stars: 5, description: 'postgres client' }],
        total: 1, took: 5, query: 'pg',
      }),
    });
    const code = await runSearch({ query: 'pg', apiHost: 'http://api' });
    expect(code).toBe(0);
    const writes = (process.stdout.write as jest.Mock).mock.calls.map((c) => c[0]).join('');
    expect(writes).toMatch(/1\. pg/);
    expect(writes).toMatch(/★5/);
    expect(writes).toMatch(/1 total/);
  });

  it('emits JSON with --json', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200, statusText: 'OK',
      json: async () => ({ success: true, results: [], total: 0, took: 1, query: 'x' }),
    });
    const code = await runSearch({ query: 'x', apiHost: 'http://api', json: true });
    expect(code).toBe(0);
    const writes = (process.stdout.write as jest.Mock).mock.calls.map((c) => c[0]).join('');
    expect(() => JSON.parse(writes)).not.toThrow();
  });

  it('prints a friendly message on empty results', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200, statusText: 'OK',
      json: async () => ({ success: true, results: [], total: 0, took: 1, query: 'nothing' }),
    });
    const code = await runSearch({ query: 'nothing', apiHost: 'http://api' });
    expect(code).toBe(0);
    const writes = (process.stdout.write as jest.Mock).mock.calls.map((c) => c[0]).join('');
    expect(writes).toMatch(/No results/);
  });
});
