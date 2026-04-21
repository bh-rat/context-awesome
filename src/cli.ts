#!/usr/bin/env node
import { Command, Option } from "commander";
import pc from "picocolors";
import { runSearch, runSections, runItems } from "./commands.js";

const ENV_API_HOST =
  process.env.AWESOME_CONTEXT_API_HOST ||
  process.env.CONTEXT_AWESOME_API_HOST ||
  "https://api.context-awesome.com";
const ENV_API_KEY = process.env.AWESOME_CONTEXT_API_KEY || process.env.CONTEXT_AWESOME_API_KEY;

const program = new Command();
program
  .name("context-awesome")
  .description("CLI for querying curated awesome-list context")
  .version("1.0.0")
  .addHelpText(
    "after",
    `
Examples:
  ${pc.dim("# Find sections in awesome lists by topic")}
  ${pc.green('context-awesome sections "graph databases"')}
  ${pc.green('context-awesome sections "machine learning" --limit 5')}

  ${pc.dim("# Search items across all lists")}
  ${pc.green('context-awesome search "postgres ORM"')}
  ${pc.green('context-awesome search "redis" --sort stars')}

  ${pc.dim("# Fetch items from a specific list (owner/repo or UUID listId)")}
  ${pc.green("context-awesome items sindresorhus/awesome")}
  ${pc.green("context-awesome items sindresorhus/awesome --section Testing")}

  ${pc.dim("# Output JSON for scripting")}
  ${pc.green('context-awesome search "redis" --json')}
`
  );

const apiHostOpt = () =>
  new Option("--api-host <url>", "Backend API host URL").default(ENV_API_HOST);
const apiKeyOpt = () =>
  new Option("--api-key <key>", "API key (or set CONTEXT_AWESOME_API_KEY)").default(ENV_API_KEY);
const jsonOpt = () => new Option("--json", "Output raw JSON instead of formatted text");

program
  .command("sections <query...>")
  .description("Find awesome-list sections matching the query")
  .option("-l, --limit <n>", "Max sections", "10")
  .option("-c, --confidence <n>", "Minimum confidence 0-1", "0.3")
  .addOption(apiHostOpt())
  .addOption(apiKeyOpt())
  .addOption(jsonOpt())
  .action(async (queryParts: string[], o) => {
    const code = await runSections({
      query: queryParts.join(" "),
      limit: Number(o.limit),
      confidence: Number(o.confidence),
      apiHost: o.apiHost,
      apiKey: o.apiKey,
      json: !!o.json,
    });
    process.exit(code);
  });

program
  .command("search <query...>")
  .description("Search awesome-list items")
  .option("-l, --limit <n>", "Max results", "20")
  .addOption(
    new Option("--sort <how>", "Sort order")
      .choices(["relevance", "stars", "recent"])
      .default("relevance")
  )
  .addOption(apiHostOpt())
  .addOption(apiKeyOpt())
  .addOption(jsonOpt())
  .action(async (queryParts: string[], o) => {
    const code = await runSearch({
      query: queryParts.join(" "),
      limit: Number(o.limit),
      sortBy: o.sort,
      apiHost: o.apiHost,
      apiKey: o.apiKey,
      json: !!o.json,
    });
    process.exit(code);
  });

program
  .command("items <target>")
  .description("Fetch items from a list by githubRepo (owner/repo) or UUID listId")
  .option("-s, --section <name>", "Filter to a section")
  .option("--subcategory <name>", "Filter to a subcategory")
  .option("-t, --tokens <n>", "Token budget (min 10000)")
  .addOption(apiHostOpt())
  .addOption(apiKeyOpt())
  .addOption(jsonOpt())
  .action(async (target: string, o) => {
    const code = await runItems({
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
  console.error("Fatal error:", err);
  process.exit(1);
});
