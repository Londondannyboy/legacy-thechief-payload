# MCP Testing Guide for The Chief Payload

## Overview
The Chief Payload project now has a fully functional MCP (Model Context Protocol) integration that allows AI assistants to interact with your PayloadCMS content.

## Available MCP Tools
The following tools are exposed via MCP:

### Pages Collection
- `pages_list` - List all pages
- `pages_get` - Get a specific page
- `pages_create` - Create a new page
- `pages_update` - Update an existing page
- `pages_delete` - Delete a page

### Posts Collection
- `posts_list` - List all posts
- `posts_get` - Get a specific post
- `posts_create` - Create a new post
- `posts_update` - Update an existing post
- `posts_delete` - Delete a post

### Categories Collection
- `category_list` - List all categories
- `category_get` - Get a specific category
- `category_create` - Create a new category
- `category_update` - Update an existing category
- *(delete disabled for categories)*

### Media Collection
- `media_list` - List all media items
- `media_get` - Get a specific media item
- `media_create` - Upload new media
- `media_check_size` - Check if a file size is allowed
- `media_upload` - Upload media with metadata
- *(update and delete disabled for media)*

### Global Settings
- `header_get` - Get header configuration
- `header_update` - Update header configuration
- `footer_get` - Get footer configuration
- `footer_update` - Update footer configuration

## Testing Locally

### 1. Start the Development Server
```bash
cd ~/thechief-payload
npm run dev
```

### 2. Use the Test Script
A test script is provided to validate all MCP endpoints:
```bash
./test-mcp.sh
```

### 3. Manual Testing with cURL
Example: List posts
```bash
curl -X POST http://localhost:3000/api/plugin/mcp \
  -H "Authorization: Bearer thechief-mcp-secret-key-2024" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"posts_list",
      "arguments":{
        "limit":5,
        "fields":["id","title","slug","publishedOn"]
      }
    }
  }'
```

## Testing in Production

### Production Endpoint
Once deployed to Vercel, your MCP endpoint will be available at:
```
https://your-vercel-domain.vercel.app/api/plugin/mcp
```

### Authentication
Production uses the same authentication mechanism with the API key from environment variables:
- Key: `MCP_API_KEY`
- Default: `thechief-mcp-secret-key-2024` (change in production!)

### Example Production Request
```bash
curl -X POST https://your-vercel-domain.vercel.app/api/plugin/mcp \
  -H "Authorization: Bearer your-production-api-key" \
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

## Claude Desktop Configuration

To use MCP with Claude Desktop, add this to your Claude Desktop config:

### For Local Development
```json
{
  "mcpServers": {
    "thechief-local": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-sse-client",
        "http://localhost:3000/api/plugin/mcp"
      ],
      "env": {
        "SSE_SERVER_AUTH": "Bearer thechief-mcp-secret-key-2024"
      }
    }
  }
}
```

### For Production
```json
{
  "mcpServers": {
    "thechief-production": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-sse-client",
        "https://your-vercel-domain.vercel.app/api/plugin/mcp"
      ],
      "env": {
        "SSE_SERVER_AUTH": "Bearer your-production-api-key"
      }
    }
  }
}
```

## Security Notes

1. **Change the API Key in Production**: The default key is for development only
2. **Environment Variables**: Set `MCP_API_KEY` in your Vercel environment
3. **CORS**: The MCP endpoint handles CORS automatically
4. **Rate Limiting**: Consider adding rate limiting for production use

## Troubleshooting

### Discovery Endpoint Works but Tools Fail
- Check the API key is correct
- Verify the Accept header includes `text/event-stream`
- Check server logs for authentication errors

### 401 Unauthorized Errors
- Ensure the Authorization header format is: `Bearer YOUR_API_KEY`
- Check the API key matches the server configuration

### Module Resolution Errors
- The MCP plugin is embedded in the project source
- Located at: `/src/lib/mcp-plugin/`
- No external dependencies needed

## Next Steps

1. Deploy to Vercel to get your production URL
2. Update the API key in production environment variables
3. Configure Claude Desktop with the production endpoint
4. Test the integration end-to-end

## Support

For issues or questions:
- Check server logs for detailed error messages
- Run the test script to validate endpoints
- Review the MCP plugin source in `/src/lib/mcp-plugin/`