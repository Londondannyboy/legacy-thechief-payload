#!/usr/bin/env node

// Minimal MCP server that just echoes to prove connection
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

async function main() {
  const server = new Server(
    {
      name: 'test-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Simple test tool
  server.setRequestHandler({
    method: 'tools/test',
    handler: async () => {
      return {
        content: [
          {
            type: 'text',
            text: 'MCP Server is connected!'
          }
        ]
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Write to stderr (stdout is for protocol)
  console.error('Test MCP Server started');
}

main().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});