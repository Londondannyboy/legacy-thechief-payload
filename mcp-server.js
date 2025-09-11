#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

class PayloadMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'payload-cms',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'list_pages',
          description: 'List all pages in Payload CMS',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of pages to return',
                default: 10,
              },
            },
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
                description: 'The page slug',
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
            properties: {
              limit: {
                type: 'number',
                description: 'Number of posts to return',
                default: 10,
              },
            },
          },
        },
        {
          name: 'create_page',
          description: 'Create a new page',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Page title',
              },
              slug: {
                type: 'string',
                description: 'Page slug (URL path)',
              },
              content: {
                type: 'string',
                description: 'Page content in markdown',
              },
            },
            required: ['title', 'slug', 'content'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'list_pages': {
          const limit = args.limit || 10;
          const result = await this.pool.query(
            'SELECT id, slug, title, created_at, updated_at FROM pages WHERE _status = $1 ORDER BY created_at DESC LIMIT $2',
            ['published', limit]
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.rows, null, 2),
              },
            ],
          };
        }

        case 'get_page': {
          const { slug } = args;
          const result = await this.pool.query(
            'SELECT * FROM pages WHERE slug = $1 AND _status = $2',
            [slug, 'published']
          );
          if (result.rows.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Page with slug "${slug}" not found`,
                },
              ],
            };
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.rows[0], null, 2),
              },
            ],
          };
        }

        case 'list_posts': {
          const limit = args.limit || 10;
          const result = await this.pool.query(
            'SELECT id, slug, title, created_at, updated_at FROM posts WHERE _status = $1 ORDER BY created_at DESC LIMIT $2',
            ['published', limit]
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.rows, null, 2),
              },
            ],
          };
        }

        case 'create_page': {
          const { title, slug, content } = args;
          const now = new Date().toISOString();
          
          // Simple content structure for Payload
          const pageData = {
            title,
            slug,
            _status: 'draft',
            hero: { type: 'none' },
            layout: [
              {
                blockType: 'content',
                columns: [
                  {
                    size: 'full',
                    richText: {
                      root: {
                        type: 'root',
                        children: [
                          {
                            type: 'paragraph',
                            children: [{ text: content }],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            ],
            created_at: now,
            updated_at: now,
          };

          const result = await this.pool.query(
            'INSERT INTO pages (title, slug, _status, hero, layout, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, slug, title',
            [
              pageData.title,
              pageData.slug,
              pageData._status,
              JSON.stringify(pageData.hero),
              JSON.stringify(pageData.layout),
              pageData.created_at,
              pageData.updated_at,
            ]
          );

          return {
            content: [
              {
                type: 'text',
                text: `Page created successfully: ${JSON.stringify(result.rows[0], null, 2)}`,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Payload MCP Server running...');
  }
}

const server = new PayloadMCPServer();
server.run().catch(console.error);