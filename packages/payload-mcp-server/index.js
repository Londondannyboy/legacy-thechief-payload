#!/usr/bin/env node

/**
 * Standalone MCP Server for PayloadCMS
 * This creates a proper stdio MCP server that Claude Desktop can communicate with
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const http = require('http');

// Configuration
const PAYLOAD_URL = process.env.PAYLOAD_URL || 'http://localhost:3000';
const API_KEY = process.env.PAYLOAD_API_KEY || 'thechief-mcp-secret-key-2024';

// Tool definitions with proper Zod schemas
const tools = [
  {
    name: 'posts_list',
    description: 'List all posts from PayloadCMS',
    inputSchema: z.object({
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1),
      fields: z.array(z.string()).optional()
    })
  },
  {
    name: 'posts_get',
    description: 'Get a specific post by ID',
    inputSchema: z.object({
      id: z.string(),
      fields: z.array(z.string()).optional()
    })
  },
  {
    name: 'posts_create',
    description: 'Create a new post',
    inputSchema: z.object({
      data: z.object({
        title: z.string(),
        slug: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(['draft', 'published']).optional()
      })
    })
  },
  {
    name: 'posts_update',
    description: 'Update an existing post',
    inputSchema: z.object({
      id: z.string(),
      data: z.object({
        title: z.string().optional(),
        slug: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(['draft', 'published']).optional()
      })
    })
  },
  {
    name: 'posts_delete',
    description: 'Delete a post',
    inputSchema: z.object({
      id: z.string()
    })
  },
  {
    name: 'pages_list',
    description: 'List all pages',
    inputSchema: z.object({
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1),
      fields: z.array(z.string()).optional()
    })
  },
  {
    name: 'pages_get',
    description: 'Get a specific page by ID',
    inputSchema: z.object({
      id: z.string(),
      fields: z.array(z.string()).optional()
    })
  },
  {
    name: 'pages_create',
    description: 'Create a new page',
    inputSchema: z.object({
      data: z.object({
        title: z.string(),
        slug: z.string().optional(),
        content: z.string().optional()
      })
    })
  },
  {
    name: 'pages_update',
    description: 'Update an existing page',
    inputSchema: z.object({
      id: z.string(),
      data: z.object({
        title: z.string().optional(),
        slug: z.string().optional(),
        content: z.string().optional()
      })
    })
  },
  {
    name: 'pages_delete',
    description: 'Delete a page',
    inputSchema: z.object({
      id: z.string()
    })
  },
  {
    name: 'category_list',
    description: 'List all categories',
    inputSchema: z.object({
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1)
    })
  },
  {
    name: 'category_get',
    description: 'Get a specific category',
    inputSchema: z.object({
      id: z.string()
    })
  },
  {
    name: 'category_create',
    description: 'Create a new category',
    inputSchema: z.object({
      data: z.object({
        title: z.string(),
        slug: z.string().optional()
      })
    })
  },
  {
    name: 'category_update',
    description: 'Update a category',
    inputSchema: z.object({
      id: z.string(),
      data: z.object({
        title: z.string().optional(),
        slug: z.string().optional()
      })
    })
  },
  {
    name: 'media_list',
    description: 'List media items',
    inputSchema: z.object({
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1)
    })
  },
  {
    name: 'media_get',
    description: 'Get a specific media item',
    inputSchema: z.object({
      id: z.string()
    })
  }
];

// Make HTTP request to Payload MCP endpoint
async function callPayloadMCP(toolName, args) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    });

    const url = new URL(`${PAYLOAD_URL}/api/plugin/mcp`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 3000),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          // Parse SSE response
          const lines = responseData.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const json = JSON.parse(line.substring(6));
              if (json.error) {
                reject(new Error(json.error.message || 'Unknown error'));
              } else {
                resolve(json.result || json);
              }
              return;
            }
          }
          // If no SSE format, try regular JSON
          const json = JSON.parse(responseData);
          resolve(json);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Create and run the MCP server
async function main() {
  const server = new Server(
    {
      name: 'payload-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register all tools
  tools.forEach((tool) => {
    server.setRequestHandler({
      method: `tools/${tool.name}`,
      handler: async (request) => {
        try {
          const args = tool.inputSchema.parse(request.params);
          const result = await callPayloadMCP(tool.name, args);
          
          return {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error.message}`
              }
            ],
            isError: true
          };
        }
      }
    });
  });

  // List tools handler
  server.setRequestHandler({
    method: 'tools/list',
    handler: async () => {
      return {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }))
      };
    }
  });

  // Create stdio transport
  const transport = new StdioServerTransport();
  
  // Connect the server to the transport
  await server.connect(transport);
  
  // Log to stderr (stdout is used for communication)
  console.error('Payload MCP Server started');
  console.error(`Connecting to: ${PAYLOAD_URL}/api/plugin/mcp`);
}

// Run the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});