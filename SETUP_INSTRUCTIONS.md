# MCP Integration Setup Instructions

## Three Solutions for Claude Desktop Integration

### Solution 1: Stdio Bridge Server (Recommended)
This creates a bridge between Claude Desktop's stdio protocol and your HTTP endpoint.

**Setup:**
1. The bridge server is already created at `mcp-stdio-bridge.mjs`
2. Update your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "payload": {
      "command": "node",
      "args": ["/Users/dankeegan/thechief-payload/mcp-stdio-bridge.mjs"],
      "env": {
        "PAYLOAD_URL": "http://localhost:3000",
        "MCP_API_KEY": "thechief-mcp-secret-key-2024"
      }
    }
  }
}
```

3. Restart Claude Desktop completely

### Solution 2: Direct API Integration (Most Reliable)
Use the direct API client to interact with Payload programmatically.

**Usage:**
```bash
# List all tools
node mcp-direct-api.mjs list-tools

# List posts
node mcp-direct-api.mjs list-posts

# Create a post
node mcp-direct-api.mjs create-post "My New Post Title"

# Call any tool
node mcp-direct-api.mjs call posts_get '{"id":"123"}'
```

**Programmatic usage:**
```javascript
import PayloadMCPClient from './mcp-direct-api.mjs';

const client = new PayloadMCPClient({
  baseUrl: 'http://localhost:3000',
  apiKey: 'thechief-mcp-secret-key-2024'
});

// List posts
const posts = await client.listPosts({ limit: 5 });

// Create a post
const newPost = await client.createPost({
  title: 'New Post',
  content: { root: { children: [{ text: 'Content here' }] } }
});
```

### Solution 3: NPM Package (For Distribution)
This packages your MCP server for npm distribution.

**Local Testing:**
```json
{
  "mcpServers": {
    "payload": {
      "command": "node",
      "args": ["/Users/dankeegan/thechief-payload/payload-mcp-server/index.js"],
      "env": {
        "PAYLOAD_URL": "http://localhost:3000",
        "PAYLOAD_API_KEY": "thechief-mcp-secret-key-2024"
      }
    }
  }
}
```

**Publishing to NPM:**
```bash
cd payload-mcp-server
npm publish --access public
```

**After Publishing:**
```bash
# Install globally
npm install -g @thechief/payload-mcp-server

# Update Claude config to use global command
{
  "mcpServers": {
    "payload": {
      "command": "payload-mcp-server",
      "env": {
        "PAYLOAD_URL": "http://localhost:3000",
        "PAYLOAD_API_KEY": "thechief-mcp-secret-key-2024"
      }
    }
  }
}
```

## Testing

Run the test suite to verify all solutions:
```bash
node test-mcp-solutions.mjs
```

## Production Configuration

For production deployment on Vercel:

```json
{
  "mcpServers": {
    "payload-production": {
      "command": "node",
      "args": ["/Users/dankeegan/thechief-payload/mcp-stdio-bridge.mjs"],
      "env": {
        "PAYLOAD_URL": "https://thechief-payload-git-main-londondannyboys-projects.vercel.app",
        "MCP_API_KEY": "thechief-mcp-secret-key-2024"
      }
    }
  }
}
```

## Troubleshooting

1. **Claude Desktop doesn't see the server:**
   - Completely quit and restart Claude Desktop
   - Check the config file syntax is valid JSON
   - Ensure file paths are absolute, not relative

2. **Connection errors:**
   - Verify Payload is running: `npm run dev`
   - Check the API key matches your Payload config
   - Test the endpoint: `curl http://localhost:3000/api/plugin/mcp -H "Authorization: Bearer thechief-mcp-secret-key-2024"`

3. **Tools not appearing:**
   - The MCP plugin must be configured in `payload.config.ts`
   - Collections must be exposed in the plugin config
   - Check server logs for initialization errors

## Files Created

- `mcp-stdio-bridge.mjs` - Stdio bridge server for Claude Desktop
- `mcp-direct-api.mjs` - Direct API client (CLI and library)
- `payload-mcp-server/` - NPM package directory
  - `index.js` - Server implementation
  - `package.json` - Package configuration
  - `README.md` - Package documentation
- `test-mcp-solutions.mjs` - Test suite for all solutions
- `claude-desktop-configs.json` - Example configurations
- `SETUP_INSTRUCTIONS.md` - This file