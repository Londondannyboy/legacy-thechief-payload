# Payload MCP Server

A Model Context Protocol (MCP) server for Payload CMS that enables AI assistants like Claude to interact with your Payload instance.

## Installation

### Global Installation (Recommended for Claude Desktop)

```bash
npm install -g @thechief/payload-mcp-server
```

### Local Installation

```bash
npm install @thechief/payload-mcp-server
```

## Configuration

### Claude Desktop Configuration

Add to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "payload": {
      "command": "payload-mcp-server",
      "env": {
        "PAYLOAD_URL": "http://localhost:3000",
        "PAYLOAD_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

For production deployment:

```json
{
  "mcpServers": {
    "payload-production": {
      "command": "payload-mcp-server",
      "env": {
        "PAYLOAD_URL": "https://your-payload-instance.com",
        "PAYLOAD_API_KEY": "your-production-api-key"
      }
    }
  }
}
```

### Environment Variables

- `PAYLOAD_URL`: URL of your Payload instance (default: `http://localhost:3000`)
- `PAYLOAD_API_KEY` or `MCP_API_KEY`: API key for authentication

## Usage

### Running Directly

```bash
PAYLOAD_URL=http://localhost:3000 \
PAYLOAD_API_KEY=your-api-key \
payload-mcp-server
```

### Available Tools

The server exposes all tools configured in your Payload MCP plugin:

- **Pages**: `pages_list`, `pages_get`, `pages_create`, `pages_update`, `pages_delete`
- **Posts**: `posts_list`, `posts_get`, `posts_create`, `posts_update`, `posts_delete`
- **Categories**: `category_list`, `category_get`, `category_create`, `category_update`
- **Media**: `media_list`, `media_get`, `media_upload`, `media_check_size`
- **Globals**: `header_get`, `header_update`, `footer_get`, `footer_update`
- **Discovery**: `list_collections`, `describe_collection`

## Testing

Test the connection:

```bash
# Check if server starts
payload-mcp-server

# In another terminal, test with curl
curl http://localhost:3000/api/plugin/mcp \
  -H "Authorization: Bearer your-api-key"
```

## Requirements

- Node.js >= 18.0.0
- Payload CMS instance with MCP plugin installed
- Valid API key configured in Payload

## Troubleshooting

### Claude Desktop doesn't recognize the server

1. Ensure the package is installed globally
2. Restart Claude Desktop completely
3. Check the logs in Claude Desktop's developer console

### Connection errors

1. Verify your Payload instance is running
2. Check the API key is correct
3. Ensure the MCP plugin is properly configured in Payload

## License

MIT