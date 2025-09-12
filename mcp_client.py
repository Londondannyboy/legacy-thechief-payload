#!/usr/bin/env python3
"""
PayloadCMS MCP Client
Use this to interact with your CMS content programmatically
"""

import json
import requests
import sys
from typing import Dict, Any, Optional

class PayloadMCPClient:
    def __init__(self, base_url: str = "http://localhost:3000", api_key: str = "thechief-mcp-secret-key-2024"):
        self.base_url = f"{base_url}/api/plugin/mcp"
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        }
    
    def _call_tool(self, tool_name: str, arguments: Dict[str, Any] = {}) -> Dict:
        """Call an MCP tool and return the result"""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        
        response = requests.post(self.base_url, json=payload, headers=self.headers)
        
        # Parse SSE response
        for line in response.text.split('\n'):
            if line.startswith('data: '):
                return json.loads(line[6:])
        
        return {"error": "No valid response"}
    
    # Posts operations
    def list_posts(self, limit: int = 10, page: int = 1):
        """List all posts"""
        return self._call_tool("posts_list", {"limit": limit, "page": page})
    
    def get_post(self, post_id: str):
        """Get a specific post"""
        return self._call_tool("posts_get", {"id": post_id})
    
    def create_post(self, title: str, content: str, status: str = "draft"):
        """Create a new post"""
        return self._call_tool("posts_create", {
            "data": {
                "title": title,
                "content": content,
                "status": status
            }
        })
    
    def update_post(self, post_id: str, **kwargs):
        """Update an existing post"""
        return self._call_tool("posts_update", {
            "id": post_id,
            "data": kwargs
        })
    
    def delete_post(self, post_id: str):
        """Delete a post"""
        return self._call_tool("posts_delete", {"id": post_id})
    
    # Pages operations
    def list_pages(self, limit: int = 10):
        """List all pages"""
        return self._call_tool("pages_list", {"limit": limit})
    
    def create_page(self, title: str, content: str):
        """Create a new page"""
        return self._call_tool("pages_create", {
            "data": {
                "title": title,
                "content": content
            }
        })
    
    # Categories operations
    def list_categories(self, limit: int = 20):
        """List all categories"""
        return self._call_tool("category_list", {"limit": limit})
    
    def create_category(self, title: str, slug: Optional[str] = None):
        """Create a new category"""
        data = {"title": title}
        if slug:
            data["slug"] = slug
        return self._call_tool("category_create", {"data": data})

# CLI Interface
if __name__ == "__main__":
    client = PayloadMCPClient()
    
    if len(sys.argv) < 2:
        print("PayloadCMS MCP Client")
        print("\nUsage:")
        print("  python mcp_client.py list-posts")
        print("  python mcp_client.py create-post 'Title' 'Content'")
        print("  python mcp_client.py list-pages")
        print("  python mcp_client.py list-categories")
        print("\nOr import and use in your Python scripts:")
        print("  from mcp_client import PayloadMCPClient")
        print("  client = PayloadMCPClient()")
        print("  posts = client.list_posts()")
        sys.exit(0)
    
    command = sys.argv[1]
    
    try:
        if command == "list-posts":
            result = client.list_posts()
            print(json.dumps(result, indent=2))
        
        elif command == "create-post" and len(sys.argv) >= 4:
            result = client.create_post(sys.argv[2], sys.argv[3])
            print(json.dumps(result, indent=2))
        
        elif command == "list-pages":
            result = client.list_pages()
            print(json.dumps(result, indent=2))
        
        elif command == "list-categories":
            result = client.list_categories()
            print(json.dumps(result, indent=2))
        
        else:
            print(f"Unknown command: {command}")
    
    except Exception as e:
        print(f"Error: {e}")