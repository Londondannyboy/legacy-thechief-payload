#!/usr/bin/env node

/**
 * Payload MCP Server - NPM Package
 * 
 * A standalone MCP server that connects to Payload CMS instances.
 * Can be installed globally via npm and used with Claude Desktop.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

class PayloadMCPServer {
  constructor() {
    this.baseUrl = process.env.PAYLOAD_URL || 'http://localhost:3000';
    this.apiKey = process.env.MCP_API_KEY || process.env.PAYLOAD_API_KEY || '';
    
    if (!this.apiKey) {
      console.error('[Payload MCP] Warning: No API key provided. Set PAYLOAD_API_KEY environment variable.');
    }

    this.server = new Server(
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

    this.tools = new Map();
  }

  async fetchMCPEndpoint(method = 'GET', body = null) {
    const url = `${this.baseUrl}/api/plugin/mcp`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Payload MCP] Fetch error:', error);
      throw error;
    }
  }

  async initialize() {
    console.error('[Payload MCP] Initializing server...');
    console.error(`[Payload MCP] Connecting to: ${this.baseUrl}`);

    try {
      // Fetch available tools
      const discovery = await this.fetchMCPEndpoint();
      const tools = discovery.tools || [];
      
      console.error(`[Payload MCP] Found ${tools.length} tools`);

      // Register each tool
      for (const tool of tools) {
        const toolName = tool.name;
        this.tools.set(toolName, tool);

        this.server.setRequestHandler(
          {
            method: 'tools/call',
            params: {
              name: toolName,
            },
          },
          async (request) => {
            const { name, arguments: args } = request.params;
            
            if (name !== toolName) {
              return null; // Let other handlers process it
            }

            try {
              const response = await this.fetchMCPEndpoint('POST', {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                  name,
                  arguments: args || {},
                },
              });

              if (response.error) {
                return {
                  error: {
                    code: response.error.code || -32000,
                    message: response.error.message || 'Tool execution failed',
                  },
                };
              }

              return { result: response.result };
            } catch (error) {
              return {
                error: {
                  code: -32000,
                  message: error.message,
                },
              };
            }
          }
        );
      }

      // Register tools/list handler
      this.server.setRequestHandler(
        {
          method: 'tools/list',
        },
        async () => {
          const toolsList = Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description || `${tool.operation} operation for ${tool.collection}`,
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          }));

          return {
            result: {
              tools: toolsList,
            },
          };
        }
      );

      // Register initialize handler
      this.server.setRequestHandler(
        {
          method: 'initialize',
        },
        async (request) => {
          return {
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: 'payload-mcp-server',
                version: '1.0.0',
              },
            },
          };
        }
      );

      console.error('[Payload MCP] Server initialized successfully');
      return true;
    } catch (error) {
      console.error('[Payload MCP] Initialization failed:', error);
      throw error;
    }
  }

  async run() {
    try {
      await this.initialize();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.error('[Payload MCP] Server running on stdio transport');
      console.error('[Payload MCP] Ready for connections');
    } catch (error) {
      console.error('[Payload MCP] Fatal error:', error);
      process.exit(1);
    }
  }
}

// Run the server
const server = new PayloadMCPServer();
server.run().catch(error => {
  console.error('[Payload MCP] Unhandled error:', error);
  process.exit(1);
});