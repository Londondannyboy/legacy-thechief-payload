#!/usr/bin/env node

/**
 * AI Content Creator for The Chief
 * This lets Claude (or any AI) create content in your PayloadCMS
 * Run this script and paste the AI-generated content
 */

const http = require('http');
const readline = require('readline');

const API_KEY = 'thechief-mcp-secret-key-2024';
const BASE_URL = 'http://localhost:3000/api/plugin/mcp';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Function for Claude to call
async function createArticle(title, content, status = 'draft') {
  console.log('\n📝 Creating article...');
  try {
    const result = await callMCP('posts_create', {
      data: {
        title: title,
        content: content,
        status: status,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      }
    });
    console.log('✅ Article created successfully!');
    console.log(`   ID: ${result.doc?.id}`);
    console.log(`   Title: ${title}`);
    console.log(`   Status: ${status}`);
    return result;
  } catch (e) {
    console.error('❌ Error:', e.message);
    return null;
  }
}

// Direct API for Claude to use
global.createArticle = createArticle;

console.log(`
╔════════════════════════════════════════════════════════════╗
║           AI Content Creator for The Chief                  ║
╚════════════════════════════════════════════════════════════╝

This script allows AI to create content in your PayloadCMS.

📌 HOW TO USE WITH CLAUDE:

1. Ask Claude to write an article about any topic
2. Claude can create it directly by calling:
   
   createArticle("Title", "Content", "draft")

3. Or paste this command with AI-generated content:

EXAMPLE:
────────
createArticle(
  "The Future of AI in Business", 
  "Content here...",
  "draft"
)

Type 'help' for commands or 'exit' to quit.
`);

// Interactive prompt
async function prompt() {
  rl.question('> ', async (input) => {
    if (input === 'exit') {
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
    } else if (input === 'help') {
      console.log(`
Commands:
  createArticle("title", "content", "status") - Create an article
  list - List recent posts
  help - Show this help
  exit - Exit the program
      `);
    } else if (input === 'list') {
      try {
        const result = await callMCP('posts_list', { limit: 5 });
        console.log('\n📚 Recent Posts:');
        if (result.docs) {
          result.docs.forEach((post, i) => {
            console.log(`${i + 1}. ${post.title} (${post.status || 'draft'})`);
          });
        }
      } catch (e) {
        console.error('Error:', e.message);
      }
    } else if (input.startsWith('createArticle')) {
      try {
        // Execute the createArticle command
        eval(input);
      } catch (e) {
        console.error('Error:', e.message);
      }
    } else {
      console.log('Unknown command. Type "help" for available commands.');
    }
    prompt();
  });
}

prompt();