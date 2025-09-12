#!/usr/bin/env node

/**
 * WORKING MCP STDIO Server for PayloadCMS
 * This connects to your working MCP API at localhost:3000
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const http = require('http');

const API_URL = 'http://localhost:3000/api/plugin/mcp';
const API_KEY = 'thechief-mcp-secret-key-2024';

// Helper to call the MCP API
async function callMCPAPI(method, params = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: method,
      params: params
    });

    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      port: 3000,
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
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          // Parse SSE format
          const lines = responseData.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const json = JSON.parse(line.substring(6));
              resolve(json);
              return;
            }
          }
          // Try regular JSON
          resolve(JSON.parse(responseData));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const server = new Server(
    {
      name: 'payload-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register individual tools using the tool() method
  server.tool(
    'posts_list',
    'List posts from PayloadCMS',
    {},
    async (args) => {
      console.error('[MCP] Calling posts_list');
      try {
        const response = await callMCPAPI('tools/call', {
          name: 'posts_list',
          arguments: args || { limit: 10 }
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.result || response, null, 2)
            }
          ]
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${e.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    'posts_create',
    'Create a new post',
    {
      data: {
        type: 'object',
        description: 'Post data',
        required: true
      }
    },
    async (args) => {
      console.error('[MCP] Calling posts_create');
      try {
        const response = await callMCPAPI('tools/call', {
          name: 'posts_create',
          arguments: args
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.result || response, null, 2)
            }
          ]
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${e.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    'pages_list',
    'List pages from PayloadCMS',
    {},
    async (args) => {
      console.error('[MCP] Calling pages_list');
      try {
        const response = await callMCPAPI('tools/call', {
          name: 'pages_list',
          arguments: args || { limit: 10 }
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.result || response, null, 2)
            }
          ]
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${e.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  server.tool(
    'category_list',
    'List categories from PayloadCMS',
    {},
    async (args) => {
      console.error('[MCP] Calling category_list');
      try {
        const response = await callMCPAPI('tools/call', {
          name: 'category_list',
          arguments: args || { limit: 10 }
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.result || response, null, 2)
            }
          ]
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${e.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP] PayloadCMS MCP Server started successfully');
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});