# context-awesome : awesome references for your agents

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


## Available Tools

### 1. `find_awesome_section`

Discovers sections and categories across awesome lists matching your search query.

**Parameters:**
- `query` (required): Search terms for finding sections
- `confidence` (optional): Minimum confidence score (0-1, default: 0.3)
- `limit` (optional): Maximum sections to return (1-50, default: 10)

**Example Usage:**
"Give me the best machine learning resources for learning ML related to python in couple of months."
"What are the best resources for authoring technical books ?"
"Find awesome list sections about React hooks"
"Search for database ORMs in Go awesome lists"

### 2. `get_awesome_items`

Retrieves items from a specific list or section with token limiting for optimal context usage.

**Parameters:**
- `listId` or `githubRepo` (one required): Identifier for the list
- `section` (optional): Category/section name to filter
- `subcategory` (optional): Subcategory to filter
- `tokens` (optional): Maximum tokens to return (min: 1000, default: 10000)
- `offset` (optional): Pagination offset (default: 0)

**Example Usage:**
```
"Show me the testing tools section from awesome-rust"
"Get the next 20 items from awesome-python (offset: 20)"
"Get items from bh-rat/awesome-mcp-enterprise"
```


## Installation

### Remote Server (Recommended)

Context Awesome is available as a hosted MCP server. No installation required!

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

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
<summary><b>Install in Windsurf</b></summary>

```json
{
  "mcpServers": {
    "context-awesome": {
      "serverUrl": "https://www.context-awesome.com/api/mcp"
    }
  }
}
```
</details>

<details>
<summary><b>Install in VS Code</b></summary>

```json
"mcp": {
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
<summary><b>Install in Claude Desktop</b></summary>

Navigate to Settings > Connectors > Add Custom Connector. Enter:
- Name: `Context Awesome`
- URL: `https://www.context-awesome.com/api/mcp`
</details>

See [Additional Installation Methods](#additional-installation-methods) for other MCP clients.

## Hosted deployment

A hosted deployment is available on [Fronteir AI](https://fronteir.ai/mcp/bh-rat-context-awesome).

## Local Setup

For development or self-hosting:

```bash
git clone https://github.com/bh-rat/context-awesome.git
cd context-awesome
npm install
npm run build
```

### Configuration

#### Running the Server

```bash
# Development mode (runs from source)
npm run dev -- [options]

# Production mode (runs compiled version)
npm run start -- [options]

Options:
  --transport <stdio|http|sse>  Transport mechanism (default: stdio)
  --port <number>               Port for HTTP transport (default: 3000)
  --api-host <url>             Backend API host (default: https://api.context-awesome.com)
  --debug                      Enable debug logging
  --help                       Show help
```

#### Examples

```bash
# Run with default settings (stdio transport)
npm run start

# Run with HTTP transport on port 3001
npm run start -- --transport http --port 3001

# Run with custom API host and key
npm run start -- --api-host https://api.context-awesome.com
```

### MCP Client Configuration

<details>
<summary><b>Claude Desktop</b></summary>

Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "context-awesome": {
      "command": "node",
      "args": ["/path/to/context-awesome/build/index.js"],
      "env": {
        "CONTEXT_AWESOME_API_HOST": "https://api.context-awesome.com"
      }
    }
  }
}
```
</details>

<details>
<summary><b>Cursor/VS Code</b></summary>

Add to your settings:

```json
{
  "mcpServers": {
    "context-awesome": {
      "command": "node",
      "args": ["/path/to/context-awesome/build/index.js"],
      "env": {
        "CONTEXT_AWESOME_API_HOST": "https://api.context-awesome.com"
      }
    }
  }
}
```
</details>

<details>
<summary><b>Custom Integration</b></summary>

For HTTP transport:

```bash
npm run start -- --transport http --port 3001 --api-host https://api.context-awesome.com
```

Then configure your client to connect to `http://localhost:3001/mcp`
</details>


### Testing

### With MCP Inspector
```bash
npm run inspector
```


### Debug Mode

Enable debug logging to see detailed information:

```bash
npm run start -- --debug

# Or in development mode
npm run dev -- --debug
```

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
      "tools": ["find_awesome_section", "get_awesome_items"]
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

## Backend service

This MCP server connects to backend API service that handles the heavy lifting of awesome list processing. 

The backend service will be open-sourced soon, enabling the community to contribute to and benefit from the complete context-awesome ecosystem.


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
- GitHub Issues: [https://github.com/your-org/context-awesome/issues](https://github.com/your-org/context-awesome/issues)
- Documentation: [https://docs.context-awesome.com](https://docs.context-awesome.com)

## Attribution

This project uses data from over 8,500 awesome lists on GitHub. See [ATTRIBUTION.md](./ATTRIBUTION.md) for a complete list of all repositories whose data is included.

## Credits

Built with:
- [Model Context Protocol SDK](https://github.com/anthropics/model-context-protocol)
- [Awesome Lists](https://github.com/sindresorhus/awesome)
- Inspired by [context7](https://github.com/upstash/context7) MCP server patterns
