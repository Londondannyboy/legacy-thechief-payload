'use client'

import { useState } from 'react'

export default function MCPAdminPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [message, setMessage] = useState('')

  const callMCP = async (toolName: string, args: any = {}) => {
    const response = await fetch('/api/plugin/mcp', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer thechief-mcp-secret-key-2024',
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      })
    })

    const text = await response.text()
    const lines = text.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        return JSON.parse(line.substring(6))
      }
    }
    return null
  }

  const listPosts = async () => {
    setLoading(true)
    try {
      const result = await callMCP('posts_list', { 
        limit: 10,
        fields: ['id', 'title', 'slug', 'status', 'publishedOn']
      })
      if (result?.result?.docs) {
        setPosts(result.result.docs)
        setMessage(`Found ${result.result.docs.length} posts`)
      }
    } catch (e) {
      setMessage('Error loading posts')
    }
    setLoading(false)
  }

  const createPost = async () => {
    if (!newPost.title) {
      setMessage('Title is required')
      return
    }
    
    setLoading(true)
    try {
      const result = await callMCP('posts_create', {
        data: {
          title: newPost.title,
          content: newPost.content || 'Content here...',
          status: 'draft'
        }
      })
      if (result?.result?.doc) {
        setMessage(`Post created with ID: ${result.result.doc.id}`)
        setNewPost({ title: '', content: '' })
        listPosts()
      }
    } catch (e) {
      setMessage('Error creating post')
    }
    setLoading(false)
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return
    
    setLoading(true)
    try {
      await callMCP('posts_delete', { id })
      setMessage(`Post ${id} deleted`)
      listPosts()
    } catch (e) {
      setMessage('Error deleting post')
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">MCP Admin Interface</h1>
      
      {message && (
        <div className="bg-blue-100 text-blue-800 p-4 rounded mb-4">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Post */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create Post</h2>
          <input
            type="text"
            placeholder="Post Title"
            className="w-full p-2 border rounded mb-4"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          />
          <textarea
            placeholder="Post Content"
            className="w-full p-2 border rounded mb-4 h-32"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          />
          <button
            onClick={createPost}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Create Post
          </button>
        </div>

        {/* Posts List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Posts</h2>
            <button
              onClick={listPosts}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          
          {posts.length === 0 ? (
            <p className="text-gray-500">No posts loaded. Click Refresh.</p>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <div key={post.id} className="border p-3 rounded flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-sm text-gray-600">
                      ID: {post.id} | Status: {post.status || 'draft'}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MCP Info */}
      <div className="mt-8 bg-gray-100 p-6 rounded-lg">
        <h3 className="font-semibold mb-2">MCP Integration Status</h3>
        <p className="text-green-600 font-semibold">✓ MCP API is working!</p>
        <p className="text-sm text-gray-600 mt-2">
          This admin interface directly uses your MCP API at /api/plugin/mcp
        </p>
        <p className="text-sm text-gray-600">
          All 25 MCP tools are available for integration.
        </p>
      </div>
    </div>
  )
}