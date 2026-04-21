#!/usr/bin/env node
import { Command, Option } from 'commander';
import { runServe, runSearch, runLookup, runDocs } from './cli.js';

const ENV_API_HOST = process.env.AWESOME_CONTEXT_API_HOST || process.env.CONTEXT_AWESOME_API_HOST || 'https://api.context-awesome.com';
const ENV_API_KEY = process.env.AWESOME_CONTEXT_API_KEY || process.env.CONTEXT_AWESOME_API_KEY;

const program = new Command();
program
  .name('context-awesome')
  .description('CLI + MCP server for curated awesome-list context')
  .version('1.0.0')
  .allowUnknownOption(); // MCP Inspector and other wrappers may inject extra flags at spawn time.

const apiHostOpt = new Option('--api-host <url>', 'Backend API host URL').default(ENV_API_HOST);
const apiKeyOpt = new Option('--api-key <key>', 'API key (or set CONTEXT_AWESOME_API_KEY)').default(ENV_API_KEY);
const debugOpt = new Option('--debug', 'Enable debug logging');
const jsonOpt = new Option('--json', 'Output raw JSON instead of formatted text');

program
  .command('serve', { isDefault: true })
  .description('Run the MCP server (default command)')
  .addOption(new Option('--transport <type>', 'Transport type').choices(['stdio', 'http']).default('stdio'))
  .option('--port <number>', 'Port for HTTP transport', '3000')
  .addOption(apiHostOpt)
  .addOption(apiKeyOpt)
  .addOption(debugOpt)
  .allowUnknownOption() // same reason — inspector flags pass through to the serve subcommand
  .action(async (o) => {
    if (o.transport === 'http' && process.argv.includes('--api-key')) {
      console.error('The --api-key flag is not allowed with --transport http. Use header auth instead.');
      process.exit(1);
    }
    if (o.transport === 'stdio' && process.argv.includes('--port')) {
      console.error('The --port flag is not allowed with --transport stdio.');
      process.exit(1);
    }
    await runServe({
      transport: o.transport,
      port: Number(o.port),
      apiHost: o.apiHost,
      apiKey: o.transport === 'stdio' ? o.apiKey : undefined,
      debug: !!o.debug,
    });
  });

program
  .command('search <query...>')
  .description('Search awesome-list items')
  .option('-l, --limit <n>', 'Max results', '20')
  .addOption(new Option('--sort <how>', 'Sort order').choices(['relevance', 'stars', 'recent']).default('relevance'))
  .addOption(apiHostOpt)
  .addOption(apiKeyOpt)
  .addOption(jsonOpt)
  .action(async (queryParts: string[], o) => {
    const code = await runSearch({
      query: queryParts.join(' '),
      limit: Number(o.limit),
      sortBy: o.sort,
      apiHost: o.apiHost,
      apiKey: o.apiKey,
      json: !!o.json,
    });
    process.exit(code);
  });

program
  .command('lookup <query...>')
  .description('Find awesome-list sections matching the query')
  .option('-l, --limit <n>', 'Max sections', '10')
  .option('-c, --confidence <n>', 'Minimum confidence 0-1', '0.3')
  .addOption(apiHostOpt)
  .addOption(apiKeyOpt)
  .addOption(jsonOpt)
  .action(async (queryParts: string[], o) => {
    const code = await runLookup({
      query: queryParts.join(' '),
      limit: Number(o.limit),
      confidence: Number(o.confidence),
      apiHost: o.apiHost,
      apiKey: o.apiKey,
      json: !!o.json,
    });
    process.exit(code);
  });

program
  .command('docs <target>')
  .description('Fetch items from a list by githubRepo (owner/repo) or UUID listId')
  .option('-s, --section <name>', 'Filter to a section')
  .option('--subcategory <name>', 'Filter to a subcategory')
  .option('-t, --tokens <n>', 'Token budget (min 10000)')
  .addOption(apiHostOpt)
  .addOption(apiKeyOpt)
  .addOption(jsonOpt)
  .action(async (target: string, o) => {
    const code = await runDocs({
      target,
      section: o.section,
      subcategory: o.subcategory,
      tokens: o.tokens ? Number(o.tokens) : undefined,
      apiHost: o.apiHost,
      apiKey: o.apiKey,
      json: !!o.json,
    });
    process.exit(code);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
