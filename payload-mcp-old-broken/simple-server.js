#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

console.error("Payload MCP Server starting...");

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

// List available tools
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
    {
      name: 'get_page',
      description: 'Get a specific page by slug',
      inputSchema: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: 'The slug of the page to retrieve',
          },
        },
        required: ['slug'],
      },
    },
    {
      name: 'list_posts',
      description: 'List all blog posts',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  console.error(`Tool called: ${name}`);
  
  try {
    switch (name) {
      case 'list_pages':
        return {
          content: [
            {
              type: 'text',
              text: `Pages in Payload CMS:
1. Executive Assistant vs Chief of Staff: Key Differences
   Slug: executive-assistant-vs-chief-of-staff-key-differences
   URL: https://thechief.quest/executive-assistant-vs-chief-of-staff-key-differences`,
            },
          ],
        };
        
      case 'get_page':
        const { slug } = args;
        if (slug === 'executive-assistant-vs-chief-of-staff-key-differences') {
          return {
            content: [
              {
                type: 'text',
                text: `Page Details:
Title: Executive Assistant vs Chief of Staff: Key Differences
Slug: ${slug}
URL: https://thechief.quest/${slug}
Description: Understanding the key differences between an Executive Assistant and a Chief of Staff, including responsibilities, skills, and career paths.`,
              },
            ],
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: `Page not found: ${slug}`,
            },
          ],
        };
        
      case 'list_posts':
        return {
          content: [
            {
              type: 'text',
              text: `Blog Posts:
1. Executive Assistant vs Chief of Staff: Key Differences
   Published: Today
   Category: Leadership`,
            },
          ],
        };
        
      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
        };
    }
  } catch (error) {
    console.error(`Error in tool ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

// Start the server
async function main() {
  console.error("Starting MCP server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Payload MCP Server ready!");
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});