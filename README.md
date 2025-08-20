# Awesome Context MCP Server

An MCP (Model Context Protocol) server that provides access to curated awesome list documentation through intelligent search and retrieval tools.

## Features

- **Smart Section Discovery**: Find relevant sections across thousands of awesome lists using natural language queries
- **Token-Limited Retrieval**: Get items from specific lists with configurable token limits for optimal LLM context usage
- **Multiple Transport Options**: Support for stdio (default), HTTP, and SSE transports
- **Flexible Configuration**: Configure via environment variables, command-line arguments, or configuration files
- **Rich Metadata**: Returns comprehensive information including GitHub stars, descriptions, tags, and more

## Installation

### Global Installation
```bash
npm install -g @awesome-context/mcp-server
```

### Local Installation
```bash
npm install @awesome-context/mcp-server
```

### Development Setup
```bash
git clone https://github.com/your-org/awesome-context-mcp.git
cd awesome-context-mcp
npm install
npm run build
```

## Configuration

### Environment Variables
- `AWESOME_CONTEXT_API_HOST`: Backend API URL (default: `http://localhost:3000`)
- `AWESOME_CONTEXT_API_KEY`: Optional API key for backend authentication

### Command-Line Arguments
```bash
awesome-context-mcp [options]

Options:
  --transport <stdio|http|sse>  Transport mechanism (default: stdio)
  --port <number>               Port for HTTP transport (default: 3000)
  --api-host <url>             Backend API host
  --api-key <key>              Optional API key for backend
  --debug                      Enable debug logging
  --help                       Show help
```

## MCP Client Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "awesome-context": {
      "command": "npx",
      "args": ["-y", "@awesome-context/mcp-server"],
      "env": {
        "AWESOME_CONTEXT_API_HOST": "https://api.awesome-context.com"
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
    "awesome-context": {
      "command": "node",
      "args": ["/path/to/awesome-context-mcp/build/index.js"],
      "env": {
        "AWESOME_CONTEXT_API_HOST": "https://api.awesome-context.com"
      }
    }
  }
}
```

### Custom Integration

For HTTP transport:

```bash
awesome-context-mcp --transport http --port 3001 --api-host https://api.awesome-context.com
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
"Find awesome list sections about React hooks"
"Search for database tools in Go awesome lists"
"Show me machine learning resources"
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
"Get items from sindresorhus/awesome"
"Show me the testing tools section from awesome-rust"
"Get the next 20 items from awesome-python (offset: 20)"
```

## Usage Patterns

### Two-Step Discovery Pattern

The server follows a two-step pattern for optimal results:

1. **Discovery**: Use `find_awesome_section` to find relevant sections
2. **Retrieval**: Use `get_awesome_items` to get detailed items from those sections

### Example Workflow

```typescript
// Step 1: Find React-related sections
const sections = await findAwesomeSection({
  query: "react hooks",
  confidence: 0.5,
  limit: 5
});

// Step 2: Get items from the most relevant section
const items = await getAwesomeItems({
  githubRepo: sections[0].githubRepo,
  section: sections[0].category,
  tokens: 5000
});
```

## Testing

### With MCP Inspector
```bash
npm run inspector
```

### Unit Tests
```bash
npm test
```

### Manual Testing
```bash
# Build the project
npm run build

# Test with stdio transport (default)
node build/index.js --debug

# Test with HTTP transport
node build/index.js --transport http --port 3001 --debug
```

## API Backend

This MCP server requires the awesome-context backend API to be running. The backend provides:

- `/api/find-section`: Section discovery endpoint
- `/api/get-items`: Item retrieval endpoint

Default backend location: `http://localhost:3000`

## Error Handling

The server provides comprehensive error handling for:

- API connection failures
- Invalid parameters
- Rate limiting
- Token limits exceeded
- Malformed responses
- Network timeouts

All errors are returned with descriptive messages to help diagnose issues.

## Performance Considerations

- **Caching**: The server implements in-memory caching for frequently accessed sections
- **Token Counting**: Efficient token estimation algorithm for accurate limits
- **Streaming**: Large responses are streamed for better performance
- **Connection Pooling**: HTTP requests use connection pooling for efficiency

## Security

- All user inputs are validated before API calls
- API responses are sanitized before returning to clients
- Supports API key authentication for backend access
- No sensitive information is logged
- HTTPS recommended for production deployments

## Development

### Project Structure
```
awesome-context-mcp/
├── src/
│   ├── index.ts          # Main server implementation
│   ├── api-client.ts     # Backend API client
│   ├── config.ts         # Configuration management
│   └── types.ts          # TypeScript definitions
├── build/                # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

## Troubleshooting

### Common Issues

1. **"Cannot connect to API"**
   - Ensure the backend API is running
   - Check the API host configuration
   - Verify network connectivity

2. **"Invalid parameters"**
   - Either `listId` or `githubRepo` must be provided for `get_awesome_items`
   - Query is required for `find_awesome_section`

3. **"Token limit exceeded"**
   - Increase the `tokens` parameter
   - Use pagination with `offset` parameter
   - Filter by section to reduce results

### Debug Mode

Enable debug logging to see detailed information:

```bash
awesome-context-mcp --debug
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
- GitHub Issues: [https://github.com/your-org/awesome-context-mcp/issues](https://github.com/your-org/awesome-context-mcp/issues)
- Documentation: [https://docs.awesome-context.com](https://docs.awesome-context.com)

## Credits

Built with:
- [Model Context Protocol SDK](https://github.com/anthropics/model-context-protocol)
- [Awesome Lists](https://github.com/sindresorhus/awesome)
- Inspired by [context7](https://github.com/upstash/context7) MCP server patterns