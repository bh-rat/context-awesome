# context-awesome : awesome references for your agents [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

[![MCP Server](https://img.shields.io/badge/MCP-Server-blue)](https://modelcontextprotocol.io)

A Model Context Protocol (MCP) server that provides access to all the curated awesome lists and their items. It can provide the best resources for your agent from sections of the 8500+ awesome lists on github and more then 1mn+ (growing) awesome row items.

**What are Awesome Lists?**
Awesome lists are community-curated collections of the best tools, libraries, and resources on any topic - from machine learning frameworks to design tools. By adding this MCP server, your AI agents get instant access to these high-quality, vetted resources instead of relying on random web searches.

Perfect for :

1. Knowledge worker agents to get the most relevant references for their work
2. The source for the best learning resources
3. Deep research can quickly gather a lot of high quality resources for any topic.
4. Search agents

https://github.com/user-attachments/assets/babab991-e4ff-4433-bdb7-eb7032e9cd11

## Two Ways to Use Context Awesome

| Mode           | Install                                                           | Good for                                                                   |
| -------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **MCP Server** | point your agent at the hosted URL or spawn `context-awesome-mcp` | Claude Desktop, Cursor, Windsurf, VS Code — agents that natively speak MCP |
| **CLI**        | `npm install -g context-awesome`                                  | Scripts, shell workflows, editors without MCP support, CI jobs             |

Both modes ship from the same npm package (`context-awesome`) and hit the same hosted backend.

## MCP Tools

Every MCP tool has a 1:1 CLI subcommand — the server and the CLI expose the same operations.

| Tool                   | CLI equivalent                        | What it does                                                         |
| ---------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `find_awesome_section` | `context-awesome sections <query...>` | Discover sections/categories across awesome lists matching a query   |
| `search_awesome_items` | `context-awesome search <query...>`   | Full-text search across individual items (tools/libraries/resources) |
| `get_awesome_items`    | `context-awesome items <target>`      | Fetch items from a known list + section, token-budgeted              |

## CLI Commands

The CLI (`context-awesome`) talks directly to the hosted backend. For the MCP server, use the separate `context-awesome-mcp` binary (see **Installation — MCP Clients** below).

```
context-awesome <command> [options]

Commands:
  sections <query...>        Find sections matching a query
  search <query...>          Search items (e.g., context-awesome search "postgres orm")
  items <target>             Fetch items from a list (by owner/repo or listId)

Globals:
  --api-host <url>           Backend API host (env: CONTEXT_AWESOME_API_HOST)
  --api-key <key>            API key (env: CONTEXT_AWESOME_API_KEY)
  --json                     Emit raw JSON (for scripts)
```

### Install the CLI

```bash
npm install -g context-awesome
context-awesome --help
context-awesome search "rate limiter"
context-awesome sections "graph databases"
```

### Use the CLI without installing

```bash
npx context-awesome search "vector database"
```

## Installation — MCP Clients

### Remote Server (Recommended)

Context Awesome is available as a hosted MCP server. No installation required.

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` → `Cursor Settings` → `MCP` → `Add new global MCP server`

```json
{
  "mcpServers": {
    "context-awesome": {
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

```sh
claude mcp add --transport http context-awesome https://www.context-awesome.com/api/mcp
```

</details>

<details>
<summary><b>Install in Claude Desktop</b></summary>

Settings → Connectors → Add Custom Connector.

- Name: `Context Awesome`
- URL: `https://www.context-awesome.com/api/mcp`
</details>

<details>
<summary><b>Install in Windsurf / VS Code / Zed / JetBrains / LM Studio / ...</b></summary>

Use the same URL (`https://www.context-awesome.com/api/mcp`) with each client's "add remote MCP" UI. See the dedicated sections below for exact snippets.

</details>

### Local stdio (Claude Desktop, offline-capable)

```json
{
  "mcpServers": {
    "context-awesome": {
      "command": "npx",
      "args": ["-y", "context-awesome-mcp", "serve", "--transport", "stdio"],
      "env": {
        "CONTEXT_AWESOME_API_HOST": "https://api.context-awesome.com"
      }
    }
  }
}
```

### Local HTTP transport (for custom integrations)

```bash
npx context-awesome-mcp serve --transport http --port 3001
# then point your client at http://localhost:3001/mcp
```

## Local Development

```bash
git clone https://github.com/bh-rat/context-awesome.git
cd context-awesome
npm install
npm run build

# CLI
./build/cli.js search "graph databases"

# MCP server (stdio)
./build/index.js --transport stdio

# MCP Inspector
npm run inspector
```

## Backend Service

This package is a client; the heavy lifting (fetching, parsing, indexing ~9000 awesome repos) runs in the companion service at [context-awesome-backend](./context-awesome-backend). The backend is open-sourced alongside this repo.

## Additional Installation Methods

<details>
<summary><b>Install in Cline</b></summary>

```json
{
  "mcpServers": {
    "context-awesome": {
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zed</b></summary>

```json
{
  "context_servers": {
    "context-awesome": {
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Augment Code</b></summary>

1. Click the hamburger menu
2. Select **Settings**
3. Navigate to **Tools**
4. Click **+ Add MCP**
5. Enter URL: `https://www.context-awesome.com/api/mcp`
6. Name: **Context Awesome**
</details>

<details>
<summary><b>Install in Roo Code</b></summary>

```json
{
  "mcpServers": {
    "context-awesome": {
      "type": "streamable-http",
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Gemini CLI</b></summary>

```json
{
  "mcpServers": {
    "context-awesome": {
      "httpUrl": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Opencode</b></summary>

```json
"mcp": {
  "context-awesome": {
    "type": "remote",
    "url": "https://www.context-awesome.com/api/mcp",
    "enabled": true
  }
}
```

</details>

<details>
<summary><b>Install in JetBrains AI Assistant</b></summary>

1. Go to `Settings` -> `Tools` -> `AI Assistant` -> `Model Context Protocol (MCP)`
2. Click `+ Add`
3. Configure URL: `https://www.context-awesome.com/api/mcp`
4. Click `OK` and `Apply`
</details>

<details>
<summary><b>Install in Kiro</b></summary>

1. Navigate `Kiro` > `MCP Servers`
2. Click `+ Add`
3. Configure URL: `https://www.context-awesome.com/api/mcp`
4. Click `Save`
</details>

<details>
<summary><b>Install in Trae</b></summary>

```json
{
  "mcpServers": {
    "context-awesome": {
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Amazon Q Developer CLI</b></summary>

```json
{
  "mcpServers": {
    "context-awesome": {
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Warp</b></summary>

1. Navigate `Settings` > `AI` > `Manage MCP servers`
2. Click `+ Add`
3. Configure URL: `https://www.context-awesome.com/api/mcp`
4. Click `Save`
</details>

<details>
<summary><b>Install in Copilot Coding Agent</b></summary>

```json
{
  "mcpServers": {
    "context-awesome": {
      "type": "http",
      "url": "https://www.context-awesome.com/api/mcp",
      "tools": ["find_awesome_section", "search_awesome_items", "get_awesome_items"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in LM Studio</b></summary>

1. Navigate to `Program` > `Install` > `Edit mcp.json`
2. Add:

```json
{
  "mcpServers": {
    "context-awesome": {
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in BoltAI</b></summary>

```json
{
  "mcpServers": {
    "context-awesome": {
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Perplexity Desktop</b></summary>

1. Navigate `Perplexity` > `Settings`
2. Select `Connectors`
3. Click `Add Connector`
4. Select `Advanced`
5. Enter Name: `Context Awesome`
6. Enter URL: `https://www.context-awesome.com/api/mcp`
</details>

<details>
<summary><b>Install in Visual Studio 2022</b></summary>

```json
{
  "inputs": [],
  "servers": {
    "context-awesome": {
      "type": "http",
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Crush</b></summary>

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "context-awesome": {
      "type": "http",
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Rovo Dev CLI</b></summary>

```bash
acli rovodev mcp
```

Then add:

```json
{
  "mcpServers": {
    "context-awesome": {
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zencoder</b></summary>

1. Go to Zencoder menu (...)
2. Select Agent tools
3. Click Add custom MCP
4. Name: `Context Awesome`
5. URL: `https://www.context-awesome.com/api/mcp`
</details>

<details>
<summary><b>Install in Qodo Gen</b></summary>

1. Open Qodo Gen chat panel
2. Click Connect more tools
3. Click + Add new MCP
4. Add:

```json
{
  "mcpServers": {
    "context-awesome": {
      "url": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```

</details>

## License

MIT

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Support

For issues and questions:

- GitHub Issues: [https://github.com/bh-rat/context-awesome/issues](https://github.com/bh-rat/context-awesome/issues)

## Attribution

This project uses data from over 8,500 awesome lists on GitHub. See [ATTRIBUTION.md](./ATTRIBUTION.md) for a complete list of all repositories whose data is included.

## Credits

Built with:

- [Model Context Protocol SDK](https://github.com/anthropics/model-context-protocol)
- [Awesome Lists](https://github.com/sindresorhus/awesome)
- Inspired by [context7](https://github.com/upstash/context7) MCP server patterns
