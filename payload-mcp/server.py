#!/usr/bin/env python3

import asyncio
import json
import sys
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Any, Dict

# MCP server for Payload CMS content management
class PayloadMCPServer:
    def __init__(self):
        # Database connection string
        self.db_url = os.environ.get('POSTGRES_URL', 
            'postgresql://neondb_owner:npg_1VasmI2EyMPF@ep-red-base-abj6bpw6-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require')
        
    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming JSON-RPC requests"""
        method = request.get('method', '')
        request_id = request.get('id')
        
        if method == 'initialize':
            return {
                'jsonrpc': '2.0',
                'id': request_id,
                'result': {
                    'protocolVersion': '1.0.0',
                    'capabilities': {
                        'tools': {}
                    },
                    'serverInfo': {
                        'name': 'payload-content-manager',
                        'version': '1.0.0'
                    }
                }
            }
        
        elif method == 'tools/list':
            return {
                'jsonrpc': '2.0',
                'id': request_id,
                'result': {
                    'tools': [
                        {
                            'name': 'list_pages',
                            'description': 'List all pages in Payload CMS',
                            'inputSchema': {
                                'type': 'object',
                                'properties': {
                                    'limit': {
                                        'type': 'number',
                                        'description': 'Number of pages to return',
                                        'default': 10
                                    }
                                }
                            }
                        },
                        {
                            'name': 'create_page',
                            'description': 'Create a new page with content',
                            'inputSchema': {
                                'type': 'object',
                                'properties': {
                                    'title': {
                                        'type': 'string',
                                        'description': 'Page title'
                                    },
                                    'slug': {
                                        'type': 'string',
                                        'description': 'URL slug'
                                    },
                                    'content': {
                                        'type': 'string',
                                        'description': 'Page content'
                                    }
                                },
                                'required': ['title', 'slug', 'content']
                            }
                        },
                        {
                            'name': 'list_posts',
                            'description': 'List all blog posts',
                            'inputSchema': {
                                'type': 'object',
                                'properties': {
                                    'limit': {
                                        'type': 'number',
                                        'description': 'Number of posts to return',
                                        'default': 10
                                    }
                                }
                            }
                        },
                        {
                            'name': 'create_post',
                            'description': 'Create a new blog post',
                            'inputSchema': {
                                'type': 'object',
                                'properties': {
                                    'title': {
                                        'type': 'string',
                                        'description': 'Post title'
                                    },
                                    'slug': {
                                        'type': 'string',
                                        'description': 'URL slug'  
                                    },
                                    'content': {
                                        'type': 'string',
                                        'description': 'Post content'
                                    }
                                },
                                'required': ['title', 'slug', 'content']
                            }
                        }
                    ]
                }
            }
        
        elif method == 'tools/call':
            tool_name = request['params']['name']
            args = request['params'].get('arguments', {})
            
            try:
                result = await self.execute_tool(tool_name, args)
                return {
                    'jsonrpc': '2.0',
                    'id': request_id,
                    'result': result
                }
            except Exception as e:
                return {
                    'jsonrpc': '2.0',
                    'id': request_id,
                    'error': {
                        'code': -32603,
                        'message': str(e)
                    }
                }
        
        return {
            'jsonrpc': '2.0',
            'id': request_id,
            'error': {
                'code': -32601,
                'message': f'Method not found: {method}'
            }
        }
    
    async def execute_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tool and return results"""
        
        if tool_name == 'list_pages':
            conn = psycopg2.connect(self.db_url)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            limit = args.get('limit', 10)
            
            cur.execute("""
                SELECT id, slug, title, created_at, updated_at 
                FROM pages 
                WHERE _status = 'published' 
                ORDER BY created_at DESC 
                LIMIT %s
            """, (limit,))
            
            pages = cur.fetchall()
            cur.close()
            conn.close()
            
            content = "Pages in Payload CMS:\n\n"
            for page in pages:
                content += f"- {page['title']}\n"
                content += f"  Slug: {page['slug']}\n"
                content += f"  URL: https://thechief.quest/{page['slug']}\n\n"
            
            return {
                'content': [
                    {
                        'type': 'text',
                        'text': content
                    }
                ]
            }
        
        elif tool_name == 'create_page':
            title = args['title']
            slug = args['slug']
            content_text = args['content']
            
            # Create Payload-compatible rich text structure
            layout = json.dumps([{
                'blockType': 'content',
                'columns': [{
                    'size': 'full',
                    'richText': {
                        'root': {
                            'type': 'root',
                            'children': [
                                {
                                    'type': 'heading',
                                    'tag': 'h1',
                                    'children': [{'text': title}]
                                },
                                {
                                    'type': 'paragraph',
                                    'children': [{'text': content_text}]
                                }
                            ]
                        }
                    }
                }]
            }])
            
            hero = json.dumps({'type': 'none'})
            meta = json.dumps({
                'title': title,
                'description': content_text[:160]
            })
            
            conn = psycopg2.connect(self.db_url)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO pages (slug, title, layout, hero, meta, _status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, 'published', NOW(), NOW())
                RETURNING id, slug, title
            """, (slug, title, layout, hero, meta))
            
            result = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'content': [
                    {
                        'type': 'text',
                        'text': f"Page created successfully!\nTitle: {title}\nSlug: {slug}\nURL: https://thechief.quest/{slug}"
                    }
                ]
            }
        
        elif tool_name == 'list_posts':
            conn = psycopg2.connect(self.db_url)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            limit = args.get('limit', 10)
            
            cur.execute("""
                SELECT id, slug, title, created_at, updated_at 
                FROM posts 
                WHERE _status = 'published' 
                ORDER BY created_at DESC 
                LIMIT %s
            """, (limit,))
            
            posts = cur.fetchall()
            cur.close()
            conn.close()
            
            content = "Blog Posts in Payload CMS:\n\n"
            for post in posts:
                content += f"- {post['title']}\n"
                content += f"  Slug: {post['slug']}\n\n"
            
            return {
                'content': [
                    {
                        'type': 'text',
                        'text': content
                    }
                ]
            }
        
        elif tool_name == 'create_post':
            title = args['title']
            slug = args['slug']
            content_text = args['content']
            
            # Create rich text content
            rich_content = json.dumps({
                'root': {
                    'type': 'root',
                    'children': [
                        {
                            'type': 'paragraph',
                            'children': [{'text': content_text}]
                        }
                    ]
                }
            })
            
            meta = json.dumps({
                'title': title,
                'description': content_text[:160]
            })
            
            conn = psycopg2.connect(self.db_url)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO posts (slug, title, content, meta, _status, published_at, created_at, updated_at)
                VALUES (%s, %s, %s, %s, 'published', NOW(), NOW(), NOW())
                RETURNING id, slug, title
            """, (slug, title, rich_content, meta))
            
            result = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'content': [
                    {
                        'type': 'text',
                        'text': f"Post created successfully!\nTitle: {title}\nSlug: {slug}"
                    }
                ]
            }
        
        else:
            return {
                'content': [
                    {
                        'type': 'text',
                        'text': f"Unknown tool: {tool_name}"
                    }
                ]
            }
    
    async def run(self):
        """Main server loop"""
        print("Payload Content MCP Server starting...", file=sys.stderr)
        
        while True:
            try:
                line = await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)
                if not line:
                    break
                
                request = json.loads(line)
                response = await self.handle_request(request)
                
                print(json.dumps(response))
                sys.stdout.flush()
                
            except Exception as e:
                print(f"Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    server = PayloadMCPServer()
    asyncio.run(server.run())