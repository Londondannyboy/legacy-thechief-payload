#!/usr/bin/env node

const readline = require('readline');
const http = require('http');

const MCP_URL = 'http://localhost:3000/api/plugin/mcp';
const API_KEY = 'thechief-mcp-secret-key-2024';

// Create readline interface for stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Buffer for incoming data
let buffer = '';

// Handle incoming JSON-RPC requests
rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    
    // Handle different methods
    if (request.method === 'initialize') {
      // Send capabilities
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '0.1.0',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'payload-thechief',
            version: '1.0.0'
          }
        }
      };
      console.log(JSON.stringify(response));
    } else if (request.method === 'tools/list') {
      // Get tools list from the MCP server
      const tools = await getTools();
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: tools
        }
      };
      console.log(JSON.stringify(response));
    } else if (request.method === 'tools/call') {
      // Forward tool call to MCP server
      const result = await callTool(request.params);
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: result
      };
      console.log(JSON.stringify(response));
    } else {
      // Unknown method
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
      console.log(JSON.stringify(response));
    }
  } catch (e) {
    // Parse error or other error
    if (e.message.includes('JSON')) {
      // Not a complete JSON line yet, ignore
    } else {
      const response = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: e.message
        }
      };
      console.log(JSON.stringify(response));
    }
  }
});

// Get tools from MCP server
async function getTools() {
  try {
    const response = await makeRequest({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    });
    
    if (response.result && response.result.tools) {
      return response.result.tools;
    }
    
    // Fallback to hardcoded tools list
    return [
      { name: 'posts_list', description: 'List posts', inputSchema: { type: 'object', properties: {} } },
      { name: 'posts_get', description: 'Get a post', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
      { name: 'posts_create', description: 'Create a post', inputSchema: { type: 'object', properties: { data: { type: 'object' } } } },
      { name: 'posts_update', description: 'Update a post', inputSchema: { type: 'object', properties: { id: { type: 'string' }, data: { type: 'object' } } } },
      { name: 'posts_delete', description: 'Delete a post', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
      { name: 'pages_list', description: 'List pages', inputSchema: { type: 'object', properties: {} } },
      { name: 'pages_get', description: 'Get a page', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
      { name: 'pages_create', description: 'Create a page', inputSchema: { type: 'object', properties: { data: { type: 'object' } } } },
      { name: 'pages_update', description: 'Update a page', inputSchema: { type: 'object', properties: { id: { type: 'string' }, data: { type: 'object' } } } },
      { name: 'pages_delete', description: 'Delete a page', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
      { name: 'category_list', description: 'List categories', inputSchema: { type: 'object', properties: {} } },
      { name: 'category_get', description: 'Get a category', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
      { name: 'category_create', description: 'Create a category', inputSchema: { type: 'object', properties: { data: { type: 'object' } } } },
      { name: 'category_update', description: 'Update a category', inputSchema: { type: 'object', properties: { id: { type: 'string' }, data: { type: 'object' } } } },
      { name: 'media_list', description: 'List media', inputSchema: { type: 'object', properties: {} } },
      { name: 'media_get', description: 'Get media', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
      { name: 'media_create', description: 'Create media', inputSchema: { type: 'object', properties: { data: { type: 'object' } } } }
    ];
  } catch (e) {
    // Return hardcoded list on error
    return [];
  }
}

// Call a tool via MCP server
async function callTool(params) {
  const response = await makeRequest({
    jsonrpc: '2.0',
    method: 'tools/call',
    id: 1,
    params: params
  });
  
  return response.result || response;
}

// Make HTTP request to MCP server
function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/plugin/mcp',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        // Parse SSE response
        const lines = responseData.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.substring(6));
              resolve(json);
              return;
            } catch (e) {
              // Continue to next line
            }
          }
        }
        // If no SSE data found, try to parse as regular JSON
        try {
          const json = JSON.parse(responseData);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid response from MCP server'));
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.write(postData);
    req.end();
  });
}

// Handle process termination
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});