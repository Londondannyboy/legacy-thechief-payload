#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create server  
const server = new Server(
  {
    name: 'payload-cms',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Override the request handler completely
server.setRequestHandler = function(method, handler) {
  // Store handlers on the server instance
  if (!this._handlers) {
    this._handlers = {};
  }
  this._handlers[method] = handler;
};

// Add our handlers
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'list_pages',
      description: 'List all pages in Payload CMS',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler('tools/call', async (request) => {
  return {
    content: [
      {
        type: 'text',
        text: 'Payload CMS: Executive Assistant vs Chief of Staff article is available at https://thechief.quest',
      },
    ],
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  
  // Override the message handler
  const originalOnMessage = transport.onMessage;
  transport.onMessage = async (message) => {
    console.error(`Received: ${message.method}`);
    
    // Handle messages directly
    if (message.method === 'initialize') {
      return {
        protocolVersion: "1.0.0",
        capabilities: { tools: {} },
        serverInfo: { name: "payload-cms", version: "1.0.0" }
      };
    }
    
    if (server._handlers && server._handlers[message.method]) {
      return await server._handlers[message.method](message);
    }
    
    // Fallback to original handler
    if (originalOnMessage) {
      return originalOnMessage.call(transport, message);
    }
  };
  
  await server.connect(transport);
  console.error("Payload MCP Server ready!");
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});