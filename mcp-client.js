#!/usr/bin/env node

const readline = require('readline');
const https = require('http');

const API_KEY = process.env.MCP_API_KEY || 'thechief-mcp-secret-key-2024';
const MCP_URL = process.env.MCP_URL || 'http://localhost:3000/api/plugin/mcp';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function makeRequest(data) {
  const url = new URL(MCP_URL);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        // Parse SSE format
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
        resolve({ error: 'No valid JSON response found' });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Process stdin for JSON-RPC requests
let buffer = '';
rl.on('line', async (line) => {
  buffer += line;
  try {
    const request = JSON.parse(buffer);
    buffer = '';
    
    const response = await makeRequest(JSON.stringify(request));
    console.log(JSON.stringify(response));
  } catch (e) {
    // Not yet complete JSON, keep buffering
  }
});

// Handle discovery
makeRequest(JSON.stringify({
  jsonrpc: '2.0',
  method: 'initialize',
  id: 0
})).then(response => {
  console.log(JSON.stringify(response));
}).catch(err => {
  console.error('Failed to initialize:', err);
});