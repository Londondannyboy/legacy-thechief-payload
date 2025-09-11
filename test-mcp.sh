#!/bin/bash

# MCP Test Script for The Chief Payload Project
# This script tests all MCP endpoints locally

API_KEY="thechief-mcp-secret-key-2024"
BASE_URL="http://localhost:3000/api/plugin/mcp"
HEADERS="-H \"Authorization: Bearer $API_KEY\" -H \"Content-Type: application/json\" -H \"Accept: application/json, text/event-stream\""

echo "🔍 Testing MCP Endpoints for The Chief"
echo "======================================="
echo ""

# Test 1: Discovery endpoint
echo "1. Testing Discovery Endpoint..."
curl -s -H "Authorization: Bearer $API_KEY" $BASE_URL | jq -r '.status' 2>/dev/null && echo "✅ Discovery endpoint working" || echo "❌ Discovery endpoint failed"
echo ""

# Test 2: List Posts
echo "2. Testing List Posts..."
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
  "jsonrpc":"2.0",
  "id":1,
  "method":"tools/call",
  "params":{
    "name":"posts_list",
    "arguments":{
      "limit":2,
      "fields":["id","title","slug","publishedOn"]
    }
  }
}' $BASE_URL | grep -q "event: message" && echo "✅ List posts working" || echo "❌ List posts failed"
echo ""

# Test 3: Create a Test Post
echo "3. Testing Create Post..."
TIMESTAMP=$(date +%s)
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{
  \"jsonrpc\":\"2.0\",
  \"id\":2,
  \"method\":\"tools/call\",
  \"params\":{
    \"name\":\"posts_create\",
    \"arguments\":{
      \"data\":{
        \"title\":\"MCP Test Post $TIMESTAMP\",
        \"slug\":\"mcp-test-post-$TIMESTAMP\",
        \"content\":\"This is a test post created via MCP API at timestamp $TIMESTAMP\",
        \"status\":\"draft\"
      }
    }
  }
}" $BASE_URL | grep -q "event: message" && echo "✅ Create post working" || echo "❌ Create post failed"
echo ""

# Test 4: List Categories
echo "4. Testing List Categories..."
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
  "jsonrpc":"2.0",
  "id":3,
  "method":"tools/call",
  "params":{
    "name":"category_list",
    "arguments":{
      "limit":5
    }
  }
}' $BASE_URL | grep -q "event: message" && echo "✅ List categories working" || echo "❌ List categories failed"
echo ""

# Test 5: Get a specific post (if ID 1 exists)
echo "5. Testing Get Single Post..."
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
  "jsonrpc":"2.0",
  "id":4,
  "method":"tools/call",
  "params":{
    "name":"posts_get",
    "arguments":{
      "id":"1",
      "fields":["id","title","slug","content"]
    }
  }
}' $BASE_URL | grep -q "event: message" && echo "✅ Get single post working" || echo "❌ Get single post failed"
echo ""

echo "======================================="
echo "✨ MCP Test Complete!"
echo ""
echo "Available Tools:"
echo "- pages_list, pages_get, pages_create, pages_update, pages_delete"
echo "- posts_list, posts_get, posts_create, posts_update, posts_delete"
echo "- category_list, category_get, category_create, category_update"
echo "- media_list, media_get, media_create"
echo "- header_get, header_update"
echo "- footer_get, footer_update"