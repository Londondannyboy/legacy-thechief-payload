#!/bin/bash

# MCP Client - Use PayloadCMS MCP tools directly
# Usage: ./mcp-client.sh [command] [args]

API_KEY="thechief-mcp-secret-key-2024"
BASE_URL="${MCP_URL:-http://localhost:3000/api/plugin/mcp}"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function mcp_call() {
    local method=$1
    local params=$2
    
    curl -s -X POST "$BASE_URL" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json, text/event-stream" \
        -d "{
            \"jsonrpc\":\"2.0\",
            \"id\":1,
            \"method\":\"tools/call\",
            \"params\":{
                \"name\":\"$method\",
                \"arguments\":$params
            }
        }" | sed -n 's/^data: //p' | jq '.'
}

function list_posts() {
    echo -e "${BLUE}Listing posts...${NC}"
    mcp_call "posts_list" '{"limit":5,"fields":["id","title","slug","publishedOn"]}'
}

function create_post() {
    local title="$1"
    local content="$2"
    echo -e "${BLUE}Creating post: $title${NC}"
    mcp_call "posts_create" "{\"data\":{\"title\":\"$title\",\"content\":\"$content\",\"status\":\"draft\"}}"
}

function get_post() {
    local id="$1"
    echo -e "${BLUE}Getting post $id...${NC}"
    mcp_call "posts_get" "{\"id\":\"$id\"}"
}

function list_pages() {
    echo -e "${BLUE}Listing pages...${NC}"
    mcp_call "pages_list" '{"limit":10}'
}

function create_page() {
    local title="$1"
    local content="$2"
    echo -e "${BLUE}Creating page: $title${NC}"
    mcp_call "pages_create" "{\"data\":{\"title\":\"$title\",\"content\":\"$content\"}}"
}

# Main command handler
case "$1" in
    list-posts)
        list_posts
        ;;
    create-post)
        create_post "$2" "$3"
        ;;
    get-post)
        get_post "$2"
        ;;
    list-pages)
        list_pages
        ;;
    create-page)
        create_page "$2" "$3"
        ;;
    *)
        echo "PayloadCMS MCP Client"
        echo "Usage: $0 {list-posts|create-post|get-post|list-pages|create-page} [args]"
        echo ""
        echo "Examples:"
        echo "  $0 list-posts"
        echo "  $0 create-post \"My Title\" \"Post content here\""
        echo "  $0 get-post 123"
        echo "  $0 list-pages"
        echo "  $0 create-page \"About Us\" \"Page content\""
        ;;
esac