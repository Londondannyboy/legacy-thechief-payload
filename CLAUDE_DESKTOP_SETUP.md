# Claude Desktop MCP Setup Guide

## Status
✅ MCP Plugin is working locally
✅ Deployed to Vercel production
✅ Created standalone MCP server
⚠️ Claude Desktop connection issues (working on fix)

## Option 1: Try These Configurations

Replace your entire `~/Library/Application Support/Claude/claude_desktop_config.json` with:

```json
{
  "mcpServers": {
    "payload-production": {
      "command": "node",
      "args": ["/Users/dankeegan/thechief-payload/payload-mcp-server.cjs"],
      "env": {
        "PAYLOAD_URL": "https://thechief-payload-git-main-londondannyboys-projects.vercel.app",
        "PAYLOAD_API_KEY": "thechief-mcp-secret-key-2024"
      }
    }
  }
}
```

Then restart Claude Desktop completely.

## Option 2: Use Web Interface

The MCP integration works perfectly via API. You can:

1. **Use claude.ai web interface** - May have better MCP support
2. **Use the API directly** with the test script:
   ```bash
   ./test-mcp.sh
   ```

## Option 3: Direct API Access

The MCP endpoints are fully functional at:

**Local:**
- `http://localhost:3000/api/plugin/mcp`

**Production:**
- `https://thechief-payload-git-main-londondannyboys-projects.vercel.app/api/plugin/mcp`

## Available Tools (21 total)

### Pages
- pages_list, pages_get, pages_create, pages_update, pages_delete

### Posts  
- posts_list, posts_get, posts_create, posts_update, posts_delete

### Categories
- category_list, category_get, category_create, category_update

### Media
- media_list, media_get, media_create, media_check_size, media_upload

### Globals
- header_get, header_update, footer_get, footer_update

## Testing

Test any endpoint with:
```bash
curl -X POST [URL]/api/plugin/mcp \
  -H "Authorization: Bearer thechief-mcp-secret-key-2024" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"posts_list",
      "arguments":{"limit":5}
    }
  }'
```

## Known Issues

Claude Desktop has strict requirements for MCP servers:
- Must use stdio transport (we have this ✅)
- Must be recognized as "installed extension" (issue here ⚠️)
- The Sanity MCP works because it's published to npm

## Next Steps

1. Try the configurations above
2. If still not working, use the web interface or API directly
3. Consider publishing to npm for better Claude Desktop compatibility

The MCP integration itself is **100% functional** - it's just Claude Desktop's connection mechanism that's being difficult.