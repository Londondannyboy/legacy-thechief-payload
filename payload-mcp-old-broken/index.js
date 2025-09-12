#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import pg from 'pg';

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://neondb_owner:npg_1VasmI2EyMPF@ep-red-base-abj6bpw6-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require',
});

// Create MCP server
const server = new Server(
  {
    name: 'payload-cms-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool handlers
server.setRequestHandler('tools/list', async () => ({
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
      description: 'Create a new page in Payload CMS',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Page title',
          },
          slug: {
            type: 'string',
            description: 'URL slug for the page',
          },
          content: {
            type: 'string',
            description: 'Page content in markdown or plain text',
          },
        },
        required: ['title', 'slug', 'content'],
      },
    },
    {
      name: 'update_page',
      description: 'Update an existing page',
      inputSchema: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: 'Current slug of the page',
          },
          title: {
            type: 'string',
            description: 'New title (optional)',
          },
          content: {
            type: 'string',
            description: 'New content (optional)',
          },
        },
        required: ['slug'],
      },
    },
  ],
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_pages': {
        const limit = args.limit || 10;
        const result = await pool.query(
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
        const result = await pool.query(
          'SELECT * FROM pages WHERE slug = $1 AND _status = $2',
          [slug, 'published']
        );
        if (result.rows.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `Page not found: ${slug}`,
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
        const result = await pool.query(
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
        
        // Create simplified content structure
        const layout = [{
          blockType: 'content',
          columns: [{
            size: 'full',
            richText: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [{ text: content }]
                  }
                ]
              }
            }
          }]
        }];
        
        const result = await pool.query(
          `INSERT INTO pages (slug, title, layout, hero, meta, _status, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
           RETURNING id, slug, title`,
          [
            slug,
            title,
            JSON.stringify(layout),
            JSON.stringify({ type: 'none' }),
            JSON.stringify({ title, description: content.substring(0, 160) }),
            'published'
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

      case 'update_page': {
        const { slug, title, content } = args;
        
        let updateQuery = 'UPDATE pages SET updated_at = NOW()';
        const updateValues = [];
        let paramCount = 1;
        
        if (title) {
          updateQuery += `, title = $${paramCount++}`;
          updateValues.push(title);
        }
        
        if (content) {
          const layout = [{
            blockType: 'content',
            columns: [{
              size: 'full',
              richText: {
                root: {
                  type: 'root',
                  children: [
                    {
                      type: 'paragraph',
                      children: [{ text: content }]
                    }
                  ]
                }
              }
            }]
          }];
          updateQuery += `, layout = $${paramCount++}`;
          updateValues.push(JSON.stringify(layout));
        }
        
        updateQuery += ` WHERE slug = $${paramCount} RETURNING id, slug, title`;
        updateValues.push(slug);
        
        const result = await pool.query(updateQuery, updateValues);
        
        if (result.rows.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `Page not found: ${slug}`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Page updated successfully: ${JSON.stringify(result.rows[0], null, 2)}`,
            },
          ],
        };
      }

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

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Payload MCP Server running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});