#!/usr/bin/env node

/**
 * WORKING MCP CLIENT - Use this to interact with your PayloadCMS
 * Run: node use-mcp-now.js
 */

const http = require('http');
const readline = require('readline');

const API_KEY = 'thechief-mcp-secret-key-2024';
const BASE_URL = 'http://localhost:3000/api/plugin/mcp';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function callMCP(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    });

    const url = new URL(BASE_URL);
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
          const lines = responseData.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const json = JSON.parse(line.substring(6));
              if (json.error) {
                reject(new Error(json.error.message));
              } else {
                resolve(json.result);
              }
              return;
            }
          }
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

async function listPosts() {
  console.log(`\n${colors.cyan}Fetching posts...${colors.reset}`);
  try {
    const result = await callMCP('posts_list', { 
      limit: 5, 
      fields: ['id', 'title', 'slug', 'publishedOn', 'status'] 
    });
    
    if (result && result.docs) {
      console.log(`\n${colors.green}Found ${result.docs.length} posts:${colors.reset}`);
      result.docs.forEach((post, i) => {
        console.log(`\n${colors.bright}${i + 1}. ${post.title}${colors.reset}`);
        console.log(`   ID: ${post.id}`);
        console.log(`   Slug: ${post.slug}`);
        console.log(`   Status: ${post.status || 'draft'}`);
      });
    }
  } catch (e) {
    console.error(`${colors.yellow}Error: ${e.message}${colors.reset}`);
  }
}

async function createPost() {
  const title = await question('Post title: ');
  const content = await question('Post content: ');
  
  console.log(`\n${colors.cyan}Creating post...${colors.reset}`);
  try {
    const result = await callMCP('posts_create', {
      data: {
        title,
        content,
        status: 'draft'
      }
    });
    console.log(`${colors.green}✓ Post created successfully!${colors.reset}`);
    console.log(`ID: ${result.doc?.id}`);
  } catch (e) {
    console.error(`${colors.yellow}Error: ${e.message}${colors.reset}`);
  }
}

async function listPages() {
  console.log(`\n${colors.cyan}Fetching pages...${colors.reset}`);
  try {
    const result = await callMCP('pages_list', { 
      limit: 10,
      fields: ['id', 'title', 'slug'] 
    });
    
    if (result && result.docs) {
      console.log(`\n${colors.green}Found ${result.docs.length} pages:${colors.reset}`);
      result.docs.forEach((page, i) => {
        console.log(`${i + 1}. ${page.title} (${page.slug})`);
      });
    }
  } catch (e) {
    console.error(`${colors.yellow}Error: ${e.message}${colors.reset}`);
  }
}

async function listCategories() {
  console.log(`\n${colors.cyan}Fetching categories...${colors.reset}`);
  try {
    const result = await callMCP('category_list', { limit: 20 });
    
    if (result && result.docs) {
      console.log(`\n${colors.green}Found ${result.docs.length} categories:${colors.reset}`);
      result.docs.forEach((cat, i) => {
        console.log(`${i + 1}. ${cat.title || cat.name || cat.id}`);
      });
    }
  } catch (e) {
    console.error(`${colors.yellow}Error: ${e.message}${colors.reset}`);
  }
}

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function showMenu() {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════`);
  console.log(`     PayloadCMS MCP Control Panel`);
  console.log(`═══════════════════════════════════════${colors.reset}`);
  console.log('\n1. List Posts');
  console.log('2. Create Post');
  console.log('3. List Pages');
  console.log('4. List Categories');
  console.log('5. Exit\n');
  
  const choice = await question('Choose an option (1-5): ');
  
  switch(choice) {
    case '1':
      await listPosts();
      break;
    case '2':
      await createPost();
      break;
    case '3':
      await listPages();
      break;
    case '4':
      await listCategories();
      break;
    case '5':
      console.log(`\n${colors.green}Goodbye!${colors.reset}`);
      rl.close();
      process.exit(0);
    default:
      console.log(`${colors.yellow}Invalid option${colors.reset}`);
  }
  
  await showMenu();
}

// Start the app
console.log(`${colors.green}✓ Connected to MCP at ${BASE_URL}${colors.reset}`);
showMenu();