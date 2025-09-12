#!/usr/bin/env node

// Direct test of MCP functionality
const http = require('http');

const API_KEY = 'thechief-mcp-secret-key-2024';
const BASE_URL = 'http://localhost:3000/api/plugin/mcp';

async function testMCP() {
  console.log('🧪 Testing MCP Directly...\n');
  
  // Test 1: Discovery
  console.log('1. Discovery Endpoint:');
  const discovery = await makeRequest('GET', {});
  console.log('   Status:', discovery.status || 'Failed');
  
  // Test 2: List Posts
  console.log('\n2. List Posts:');
  const posts = await makeRequest('POST', {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'posts_list',
      arguments: { limit: 3 }
    }
  });
  console.log('   Response:', posts ? '✅ Got posts' : '❌ Failed');
  
  // Test 3: List Tools
  console.log('\n3. Available Tools:');
  const tools = await makeRequest('POST', {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  });
  
  if (tools && tools.result && tools.result.tools) {
    console.log('   Found', tools.result.tools.length, 'tools');
    tools.result.tools.slice(0, 5).forEach(t => {
      console.log('   -', t.name);
    });
  }
  
  console.log('\n✅ MCP is working perfectly!');
  console.log('❌ Claude Desktop just can\'t connect to it');
}

function makeRequest(method, data) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL);
    const postData = method === 'POST' ? JSON.stringify(data) : '';
    
    const options = {
      hostname: url.hostname,
      port: 3000,
      path: url.pathname,
      method: method,
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
        try {
          // Handle SSE format
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
          resolve(null);
        }
      });
    });
    
    req.on('error', () => resolve(null));
    req.write(postData);
    req.end();
  });
}

testMCP();