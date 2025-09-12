#!/usr/bin/env node

/**
 * MCP Stdio Bridge Server for Claude Desktop
 * 
 * This server acts as a bridge between Claude Desktop (which expects stdio communication)
 * and the Payload MCP HTTP endpoint.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const PAYLOAD_URL = process.env.PAYLOAD_URL || 'http://localhost:3000';
const MCP_API_KEY = process.env.MCP_API_KEY || 'thechief-mcp-secret-key-2024';

class PayloadMCPBridge {
  constructor() {
    this.server = new Server(
      {
        name: 'payload-mcp-bridge',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.registeredTools = new Map();
    this.setupServer();
  }

  async fetchTools() {
    try {
      const response = await fetch(`${PAYLOAD_URL}/api/plugin/mcp`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MCP_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tools: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.error('Error fetching tools:', error);
      return [];
    }
  }

  async callTool(name, args) {
    try {
      const response = await fetch(`${PAYLOAD_URL}/api/plugin/mcp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MCP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name,
            arguments: args,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Tool call failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Tool execution failed');
      }

      return data.result;
    } catch (error) {
      console.error(`Error calling tool ${name}:`, error);
      throw error;
    }
  }

  async setupServer() {
    // Fetch available tools from Payload
    const tools = await this.fetchTools();
    
    // Register each tool with the MCP server
    for (const tool of tools) {
      this.server.setRequestHandler(
        {
          method: 'tools/call',
          params: {
            name: tool.name,
          },
        },
        async (request) => {
          const { name, arguments: args } = request.params;
          
          if (name !== tool.name) {
            return {
              error: {
                code: -32602,
                message: `Unknown tool: ${name}`,
              },
            };
          }

          try {
            const result = await this.callTool(name, args);
            return { result };
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

      this.registeredTools.set(tool.name, tool);
    }

    // Handle tools/list
    this.server.setRequestHandler(
      {
        method: 'tools/list',
      },
      async () => {
        const toolsList = Array.from(this.registeredTools.values()).map(tool => ({
          name: tool.name,
          description: tool.description || `${tool.operation} ${tool.collection}`,
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

    // Handle initialize
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
              name: 'payload-mcp-bridge',
              version: '1.0.0',
            },
          },
        };
      }
    );

    console.error('[MCP Bridge] Server setup complete with', this.registeredTools.size, 'tools');
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP Bridge] Connected to stdio transport');
  }
}

// Run the bridge
const bridge = new PayloadMCPBridge();
bridge.run().catch(console.error);