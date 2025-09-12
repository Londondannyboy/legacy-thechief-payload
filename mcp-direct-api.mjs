#!/usr/bin/env node

/**
 * Direct API Integration for Payload MCP
 * 
 * This module provides a direct JavaScript API to interact with the Payload MCP endpoint.
 * Can be used programmatically or as a CLI tool.
 */

export class PayloadMCPClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.PAYLOAD_URL || 'http://localhost:3000';
    this.apiKey = options.apiKey || process.env.MCP_API_KEY || 'thechief-mcp-secret-key-2024';
    this.verbose = options.verbose || false;
  }

  log(...args) {
    if (this.verbose) {
      console.log('[MCP Client]', ...args);
    }
  }

  async request(method, params = {}) {
    const url = `${this.baseUrl}/api/plugin/mcp`;
    
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    };

    this.log(`Request to ${url}:`, JSON.stringify(body, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Request failed');
      }

      this.log('Response:', JSON.stringify(data.result, null, 2));
      return data.result;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  // Discovery methods
  async listTools() {
    const response = await fetch(`${this.baseUrl}/api/plugin/mcp`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list tools: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tools || [];
  }

  async listCollections() {
    return this.request('tools/call', {
      name: 'list_collections',
      arguments: {},
    });
  }

  async describeCollection(slug) {
    return this.request('tools/call', {
      name: 'describe_collection',
      arguments: { slug },
    });
  }

  // Generic tool call
  async callTool(name, args = {}) {
    return this.request('tools/call', {
      name,
      arguments: args,
    });
  }

  // Convenience methods for common operations
  async listPosts(options = {}) {
    return this.callTool('posts_list', options);
  }

  async getPost(id) {
    return this.callTool('posts_get', { id });
  }

  async createPost(data) {
    return this.callTool('posts_create', { data });
  }

  async updatePost(id, data) {
    return this.callTool('posts_update', { id, data });
  }

  async deletePost(id) {
    return this.callTool('posts_delete', { id });
  }

  async listPages(options = {}) {
    return this.callTool('pages_list', options);
  }

  async getPage(id) {
    return this.callTool('pages_get', { id });
  }

  async createPage(data) {
    return this.callTool('pages_create', { data });
  }

  async updatePage(id, data) {
    return this.callTool('pages_update', { id, data });
  }

  async deletePage(id) {
    return this.callTool('pages_delete', { id });
  }

  async listCategories(options = {}) {
    return this.callTool('category_list', options);
  }

  async getCategory(id) {
    return this.callTool('category_get', { id });
  }

  async createCategory(data) {
    return this.callTool('category_create', { data });
  }

  async updateCategory(id, data) {
    return this.callTool('category_update', { id, data });
  }

  async listMedia(options = {}) {
    return this.callTool('media_list', options);
  }

  async getMedia(id) {
    return this.callTool('media_get', { id });
  }

  async uploadMedia(options) {
    return this.callTool('media_upload', options);
  }

  async checkMediaSize(fileSize) {
    return this.callTool('media_check_size', { fileSize });
  }

  // Global config methods
  async getHeader() {
    return this.callTool('header_get', {});
  }

  async updateHeader(data) {
    return this.callTool('header_update', { data });
  }

  async getFooter() {
    return this.callTool('footer_get', {});
  }

  async updateFooter(data) {
    return this.callTool('footer_update', { data });
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new PayloadMCPClient({ verbose: true });
  
  const command = process.argv[2];
  const args = process.argv.slice(3);

  async function main() {
    try {
      switch (command) {
        case 'list-tools':
          const tools = await client.listTools();
          console.log('Available tools:', tools.map(t => t.name).join(', '));
          break;

        case 'list-collections':
          const collections = await client.listCollections();
          console.log('Collections:', JSON.stringify(collections, null, 2));
          break;

        case 'list-posts':
          const posts = await client.listPosts({ limit: 5 });
          console.log('Posts:', JSON.stringify(posts, null, 2));
          break;

        case 'list-pages':
          const pages = await client.listPages({ limit: 5 });
          console.log('Pages:', JSON.stringify(pages, null, 2));
          break;

        case 'create-post':
          if (!args[0]) {
            console.error('Usage: mcp-direct-api.mjs create-post "<title>"');
            process.exit(1);
          }
          const newPost = await client.createPost({
            title: args[0],
            content: { root: { children: [{ text: 'Created via MCP Direct API' }] } },
            status: 'draft',
          });
          console.log('Created post:', JSON.stringify(newPost, null, 2));
          break;

        case 'call':
          if (args.length < 1) {
            console.error('Usage: mcp-direct-api.mjs call <tool-name> [json-args]');
            process.exit(1);
          }
          const toolName = args[0];
          const toolArgs = args[1] ? JSON.parse(args[1]) : {};
          const result = await client.callTool(toolName, toolArgs);
          console.log('Result:', JSON.stringify(result, null, 2));
          break;

        default:
          console.log(`
MCP Direct API Client

Usage:
  mcp-direct-api.mjs <command> [args]

Commands:
  list-tools                    List all available MCP tools
  list-collections              List all exposed collections
  list-posts                    List recent posts
  list-pages                    List recent pages
  create-post "<title>"         Create a new post
  call <tool> [json-args]       Call any MCP tool directly

Environment variables:
  PAYLOAD_URL                   Payload server URL (default: http://localhost:3000)
  MCP_API_KEY                   API key for authentication

Examples:
  mcp-direct-api.mjs list-tools
  mcp-direct-api.mjs list-posts
  mcp-direct-api.mjs create-post "My New Post"
  mcp-direct-api.mjs call posts_get '{"id":"123"}'
          `);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  main();
}

export default PayloadMCPClient;