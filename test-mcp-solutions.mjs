#!/usr/bin/env node

/**
 * Test script for all MCP solutions
 */

import { spawn } from 'child_process';
import { PayloadMCPClient } from './mcp-direct-api.mjs';

const PAYLOAD_URL = process.env.PAYLOAD_URL || 'http://localhost:3000';
const MCP_API_KEY = process.env.MCP_API_KEY || 'thechief-mcp-secret-key-2024';

console.log('='.repeat(60));
console.log('MCP Solutions Test Suite');
console.log('='.repeat(60));

// Test 1: Direct API
async function testDirectAPI() {
  console.log('\n📡 Testing Direct API Integration...');
  
  try {
    const client = new PayloadMCPClient({
      baseUrl: PAYLOAD_URL,
      apiKey: MCP_API_KEY,
      verbose: false
    });

    // Test listing tools
    console.log('  ✓ Fetching available tools...');
    const tools = await client.listTools();
    console.log(`  ✓ Found ${tools.length} tools`);

    // Test listing posts
    console.log('  ✓ Fetching posts...');
    const posts = await client.listPosts({ limit: 3 });
    console.log(`  ✓ Retrieved posts successfully`);

    // Test collections discovery
    console.log('  ✓ Discovering collections...');
    const collections = await client.listCollections();
    console.log(`  ✓ Collections discovered`);

    console.log('✅ Direct API Integration: WORKING');
    return true;
  } catch (error) {
    console.error('❌ Direct API Integration: FAILED');
    console.error('  Error:', error.message);
    return false;
  }
}

// Test 2: Test HTTP endpoint directly
async function testHTTPEndpoint() {
  console.log('\n🌐 Testing HTTP Endpoint...');
  
  try {
    // Test GET (discovery)
    console.log('  ✓ Testing GET endpoint...');
    const getResponse = await fetch(`${PAYLOAD_URL}/api/plugin/mcp`, {
      headers: {
        'Authorization': `Bearer ${MCP_API_KEY}`,
      },
    });

    if (!getResponse.ok) {
      throw new Error(`GET failed: ${getResponse.status}`);
    }

    const discovery = await getResponse.json();
    console.log(`  ✓ Discovery endpoint working (${discovery.tools?.length || 0} tools)`);

    // Test POST (tool call)
    console.log('  ✓ Testing POST endpoint...');
    const postResponse = await fetch(`${PAYLOAD_URL}/api/plugin/mcp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MCP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'list_collections',
          arguments: {},
        },
      }),
    });

    if (!postResponse.ok) {
      throw new Error(`POST failed: ${postResponse.status}`);
    }

    const result = await postResponse.json();
    if (result.error) {
      throw new Error(result.error.message);
    }

    console.log('  ✓ Tool execution working');
    console.log('✅ HTTP Endpoint: WORKING');
    return true;
  } catch (error) {
    console.error('❌ HTTP Endpoint: FAILED');
    console.error('  Error:', error.message);
    return false;
  }
}

// Test 3: Stdio Bridge Server
async function testStdioBridge() {
  console.log('\n🌉 Testing Stdio Bridge Server...');
  
  return new Promise((resolve) => {
    const bridge = spawn('node', ['mcp-stdio-bridge.mjs'], {
      env: {
        ...process.env,
        PAYLOAD_URL,
        MCP_API_KEY,
      },
      cwd: process.cwd(),
    });

    let output = '';
    let errorOutput = '';
    const timeout = setTimeout(() => {
      bridge.kill();
      if (errorOutput.includes('Server setup complete')) {
        console.log('  ✓ Bridge server initialized');
        console.log('  ✓ Connected to stdio transport');
        console.log('✅ Stdio Bridge Server: WORKING');
        resolve(true);
      } else {
        console.error('❌ Stdio Bridge Server: FAILED');
        console.error('  Error: Timeout or initialization failed');
        resolve(false);
      }
    }, 3000);

    bridge.stdout.on('data', (data) => {
      output += data.toString();
    });

    bridge.stderr.on('data', (data) => {
      errorOutput += data.toString();
      if (errorOutput.includes('Server setup complete')) {
        clearTimeout(timeout);
        bridge.kill();
        console.log('  ✓ Bridge server initialized');
        console.log('  ✓ Connected to stdio transport');
        console.log('✅ Stdio Bridge Server: WORKING');
        resolve(true);
      }
    });

    bridge.on('error', (error) => {
      clearTimeout(timeout);
      console.error('❌ Stdio Bridge Server: FAILED');
      console.error('  Error:', error.message);
      resolve(false);
    });
  });
}

// Test 4: NPM Package Server
async function testNPMPackage() {
  console.log('\n📦 Testing NPM Package Server...');
  
  return new Promise((resolve) => {
    const server = spawn('node', ['payload-mcp-server/index.js'], {
      env: {
        ...process.env,
        PAYLOAD_URL,
        PAYLOAD_API_KEY: MCP_API_KEY,
      },
      cwd: process.cwd(),
    });

    let errorOutput = '';
    const timeout = setTimeout(() => {
      server.kill();
      if (errorOutput.includes('Ready for connections')) {
        console.log('  ✓ NPM package server initialized');
        console.log('  ✓ Ready for Claude Desktop');
        console.log('✅ NPM Package Server: WORKING');
        resolve(true);
      } else {
        console.error('❌ NPM Package Server: FAILED');
        console.error('  Error: Timeout or initialization failed');
        resolve(false);
      }
    }, 3000);

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
      if (errorOutput.includes('Ready for connections')) {
        clearTimeout(timeout);
        server.kill();
        console.log('  ✓ NPM package server initialized');
        console.log('  ✓ Ready for Claude Desktop');
        console.log('✅ NPM Package Server: WORKING');
        resolve(true);
      }
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      console.error('❌ NPM Package Server: FAILED');
      console.error('  Error:', error.message);
      resolve(false);
    });
  });
}

// Run all tests
async function runTests() {
  const results = {
    directAPI: await testDirectAPI(),
    httpEndpoint: await testHTTPEndpoint(),
    stdioBridge: await testStdioBridge(),
    npmPackage: await testNPMPackage(),
  };

  console.log('\n' + '='.repeat(60));
  console.log('Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Direct API:      ${results.directAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`HTTP Endpoint:   ${results.httpEndpoint ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Stdio Bridge:    ${results.stdioBridge ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`NPM Package:     ${results.npmPackage ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r);
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed'));
  
  process.exit(allPassed ? 0 : 1);
}

// Check if Payload is running first
console.log(`\n🔍 Checking Payload instance at ${PAYLOAD_URL}...`);
fetch(`${PAYLOAD_URL}/api/plugin/mcp`, {
  headers: { 'Authorization': `Bearer ${MCP_API_KEY}` }
})
  .then(response => {
    if (response.ok) {
      console.log('✅ Payload instance is accessible\n');
      runTests();
    } else {
      console.error(`❌ Payload returned status ${response.status}`);
      console.error('Please ensure Payload is running and the API key is correct');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Cannot connect to Payload instance');
    console.error(`   URL: ${PAYLOAD_URL}`);
    console.error(`   Error: ${error.message}`);
    console.error('\nPlease ensure:');
    console.error('1. Payload is running (npm run dev)');
    console.error('2. The URL is correct');
    console.error('3. The API key is configured');
    process.exit(1);
  });