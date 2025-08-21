# context-awesome : awesome references for your agents

A Model Context Protocol (MCP) server that provides access to all the curated awesome lists and their items. It can provide the best resources for your agent from sections of the 8500+ awesome lists on github and more then 3M+ awesome row items.

Perfect for : 
1. Knowledge worker agents to get the most relevant references for their work
2. The source for the best learning resources
3. Deep research can quickly gather a lot of high quality resources for any topic.
4. Search agents

## Architecture

This MCP server connects to backend API service that handles the heavy lifting of awesome list processing. The backend infrastructure manages:

- **Data Collection & Synchronization**: Automated discovery and synchronization of awesome lists from GitHub
- **Content Parsing & Extraction**: Intelligent parsing of diverse markdown formats to extract structured data
- **Storage & Indexing**: Optimized database storage with advanced indexing for fast retrieval
- **Ranking & Relevance**: Smart algorithms for ranking resources based on quality signals and relevance
- **API Service**: High-performance API endpoints for searching and retrieving awesome list content

The backend service will be open-sourced soon, enabling the community to contribute to and benefit from the complete context-awesome ecosystem. Actively working on improving the ranking, relevance, indexing to a minimum state on the backend. 


## Installation

```bash
git clone https://github.com/your-org/context-awesome.git
cd context-awesome
npm install
npm run build
```

## Configuration

### Running the Server

```bash
# Development mode (runs from source)
npm run dev -- [options]

# Production mode (runs compiled version)
npm run start -- [options]

Options:
  --transport <stdio|http|sse>  Transport mechanism (default: stdio)
  --port <number>               Port for HTTP transport (default: 3000)
  --api-host <url>             Backend API host (default: https://context-awesome.vercel.app)
  --debug                      Enable debug logging
  --help                       Show help
```

#### Examples

```bash
# Run with default settings (stdio transport)
npm run start

# Run with debug logging
npm run start -- --debug

# Run with HTTP transport on port 3001
npm run start -- --transport http --port 3001

# Run with custom API host and key
npm run start -- --api-host https://api.context-awesome.com
```

## MCP Client Configuration

### Claude Desktop

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

### Cursor/VS Code

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

### Custom Integration

For HTTP transport:

```bash
npm run start -- --transport http --port 3001 --api-host https://api.context-awesome.com
```

Then configure your client to connect to `http://localhost:3001/mcp`

## Available Tools

### 1. `find_awesome_section`

Discovers sections and categories across awesome lists matching your search query.

**Parameters:**
- `query` (required): Search terms for finding sections
- `confidence` (optional): Minimum confidence score (0-1, default: 0.3)
- `limit` (optional): Maximum sections to return (1-50, default: 10)

**Example Usage:**
```
"Show me the best machine learning resources"
"Find awesome list sections about React hooks"
"Search for database tools in Go awesome lists"
```

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

## Testing

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

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT

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
