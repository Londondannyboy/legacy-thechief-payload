# Quest Platform Setup Guide
## Microservices Architecture Implementation

**Version**: 2.0.0  
**Date**: January 2025  
**Approach**: Loosely-Coupled Services

---

## CLEANUP FIRST - LEGACY PROJECT ORGANIZATION

### Step 0: Organize Legacy Projects
```bash
# 1. RENAME old projects to avoid confusion:
mv /Users/dankeegan/thechief-payload /Users/dankeegan/LEGACY-thechief-payload
mv /Users/dankeegan/thechief-clean /Users/dankeegan/LEGACY-thechief-clean
mv /Users/dankeegan/thechief-visual /Users/dankeegan/LEGACY-thechief-visual
mv /Users/dankeegan/thechief-quest /Users/dankeegan/LEGACY-thechief-quest
mv /Users/dankeegan/quest-core /Users/dankeegan/LEGACY-quest-core

# 2. Keep quest-core-v2 as reference (contains valuable code to extract)

# 3. Create new Quest platform structure:
mkdir -p /Users/dankeegan/quest-platform
cd /Users/dankeegan/quest-platform
```

## CRITICAL LEARNINGS FROM FAILURES

### ❌ What Caused All The Problems:
1. **SHARED DATABASE** - Multiple projects using same Neon database = conflicts
2. **MCP Plugin bundled with project** - Caused config context errors in admin panel
3. **Wrong NEXT_PUBLIC_SERVER_URL** - Must match actual deployment URL, not custom domain
4. **Mixed package managers** - pnpm vs npm conflicts on Vercel
5. **Missing STATUS field** - Database schema didn't match code expectations

## ✅ NEW MICROSERVICES SETUP PROCESS

### Phase 1: Quest Core Service (START HERE)

#### Step 1: Create Minimal Core Service
```bash
cd /Users/dankeegan/quest-platform
mkdir quest-core && cd quest-core

# Create Next.js app with minimal setup
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --use-npm

# Add essential dependencies only
npm install better-auth @prisma/client prisma
```

#### Step 2: Database Setup (One Database per Service)
```
# Each service gets its own Neon database
1. Go to Neon.tech dashboard
2. Create database: "quest_core_db"
3. Get connection string
4. Add to .env:
   DATABASE_URL=postgresql://...
```

#### Step 3: Basic Features Only
```typescript
// Just implement:
- Landing page
- User registration (BetterAuth)
- User login
- Basic dashboard
- Deploy to Vercel immediately
```

### Phase 2: Quest MCP Service (ISOLATED)

#### Step 1: Create Standalone MCP Service
```bash
cd /Users/dankeegan/quest-platform
mkdir quest-mcp && cd quest-mcp
npm init -y

# MCP dependencies
npm install @modelcontextprotocol/sdk zod
```

#### Step 2: Mock Implementation First
```typescript
// quest-mcp/server.ts
export const mcpServer = {
  tools: {
    createContent: async (params) => {
      console.log('Mock: Would create', params)
      return { success: true, id: 'mock-123' }
    }
  }
}
```

#### Step 3: Test with Claude Desktop
```json
// Claude Desktop config
{
  "quest-mcp": {
    "command": "node",
    "args": ["quest-mcp/server.js"]
  }
}
```

### Phase 1: TheChief Content Site (SIMPLIFIED START)

#### Step 1: Create Simple Content Site
```bash
cd /Users/dankeegan/quest-platform
mkdir sites && cd sites
npx create-next-app@latest thechief --typescript --tailwind --app --use-npm

# NO AUTH - Just content pages
# Focus on SEO and speed
```

#### Step 2: Add Initial Content
```typescript
// app/page.tsx - Simple landing page
// app/articles/[slug]/page.tsx - Article pages
// Focus on:
- Fast loading (static generation)
- SEO metadata
- Clean design
- No user features
```

#### Step 3: Deploy Immediately
```bash
# Push to GitHub
# Deploy to Vercel
# Get site live TODAY
```

### Phase 2: Payload CMS Service

#### Step 1: Create CMS Service
```bash
cd /Users/dankeegan/quest-platform/services
npx create-payload-app@latest cms --template blank --db postgres

# Simple content management
# No user auth needed
```

#### Step 2: Connect Site to CMS
```typescript
// Fetch content from CMS API
const articles = await fetch(`${CMS_URL}/api/articles`)
```

### Phase 3: MCP Integration

#### Step 1: Build MCP Server
```bash
cd /Users/dankeegan/quest-platform/services
mkdir mcp && cd mcp
npm init -y
npm install @modelcontextprotocol/sdk
```

#### Step 2: Create Content Tools
```typescript
// MCP tools for content creation
- createArticle
- generateSEO
- suggestTopics
```

#### Step 3: Connect MCP to Payload
```typescript
// MCP creates content in Payload
const article = await payload.create({
  collection: 'articles',
  data: generatedContent
})
```

### Step 3: Environment Variables (.env)
```env
# Database - USE NEW DATABASE URL
DATABASE_URL=postgresql://[NEW_NEON_CONNECTION_STRING]
POSTGRES_URL=postgresql://[NEW_NEON_CONNECTION_STRING]

# Payload
PAYLOAD_SECRET=thechief-final-secret-minimum-32-characters

# Next.js - MUST match Vercel URL exactly
NEXT_PUBLIC_SERVER_URL=http://localhost:3000  # For local
# Change to https://thechief-final.vercel.app for production

# Optional - Add these later if needed
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx  # If using Vercel Blob
MCP_API_KEY=thechief-mcp-secret-2024  # Only if adding MCP later
```

### Step 4: Visual Page Builder Setup

Create these files in order:

#### `/src/blocks/Content/config.ts`
```typescript
import type { Block } from 'payload'

export const Content: Block = {
  slug: 'content',
  labels: {
    singular: 'Content Block',
    plural: 'Content Blocks',
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'alignment',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
      defaultValue: 'left',
    },
  ],
}
```

#### `/src/blocks/CallToAction/config.ts`
```typescript
import type { Block } from 'payload'

export const CallToAction: Block = {
  slug: 'cta',
  labels: {
    singular: 'Call to Action',
    plural: 'Call to Actions',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'text',
      type: 'textarea',
    },
    {
      name: 'buttonText',
      type: 'text',
      required: true,
    },
    {
      name: 'buttonLink',
      type: 'text',
      required: true,
    },
  ],
}
```

#### `/src/collections/Pages.ts`
```typescript
import type { CollectionConfig } from 'payload'
import { Content } from '../blocks/Content/config'
import { CallToAction } from '../blocks/CallToAction/config'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [Content, CallToAction],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'meta',
              type: 'group',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
```

### Step 5: Update payload.config.ts
```typescript
import { Pages } from './src/collections/Pages'

// In collections array:
collections: [
  Pages,
  Users,
  // Other collections...
],

// DO NOT add MCP plugin initially - add only after admin works
```

### Step 6: Vercel Deployment

#### vercel.json (IMPORTANT!)
```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "framework": "nextjs"
}
```

#### Deploy to Vercel:
1. Push to GitHub
2. Import in Vercel
3. Add ALL environment variables:
   - DATABASE_URL (new database)
   - POSTGRES_URL (same as above)
   - PAYLOAD_SECRET
   - NEXT_PUBLIC_SERVER_URL (MUST be https://thechief-final.vercel.app or whatever Vercel assigns)

### Step 7: Fix Database Schema & Create Admin User

#### Fix STATUS field (CRITICAL!)
```sql
-- Run in Neon SQL editor IMMEDIATELY after first deployment
-- This fixes the status field issue we encountered

-- For posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'draft';

-- For pages table  
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'draft';

-- Verify columns exist
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE column_name = 'status' 
AND table_name IN ('posts', 'pages');
```

#### Create Admin User
```sql
-- Then create admin user
INSERT INTO users (email, name, created_at, updated_at)
VALUES ('keegan.dan@gmail.com', 'Dan Keegan', NOW(), NOW());
```

Then use password reset or create via API.

### Step 8: Test Admin Panel FIRST
1. Go to https://[your-vercel-url]/admin
2. Verify it loads without errors
3. Login and test visual editor
4. Create a test page

### Step 9: MCP Integration (EXACT WORKING METHOD from thechief-clean)

#### What ACTUALLY WORKED for MCP:
```bash
# MCP was working perfectly in thechief-clean via Claude Desktop!
# Here's EXACTLY how we got it working:

# 1. Install these dependencies (CRITICAL):
npm install mcp-handler@^1.0.2 zod@^3.23.8

# 2. MCP plugin was NOT from npm - we had to include it locally
# BUT this caused admin panel issues
# So for final setup, choose ONE:
```

#### Option A: MCP Working (but admin might break)
```typescript
// In payload.config.ts
import { PayloadPluginMcp } from 'payload-plugin-mcp'  // Try npm first

plugins: [
  PayloadPluginMcp({
    collections: 'all',  // This worked in clean
    defaultOperations: {
      list: true,
      get: true,
      create: true,
      update: true,
      delete: false,
    },
    apiKey: process.env.MCP_API_KEY || 'thechief-mcp-secret-key-2024',
  }),
],

// Environment variables that worked:
// MCP_API_KEY=thechief-mcp-secret-key-2024
```

#### Option B: Skip MCP Plugin, Use API Directly
```bash
# Admin panel will definitely work
# Claude can still access via REST API
# Just no MCP-specific endpoints
```

**PROVEN WORKING**: MCP worked perfectly for content creation in thechief-clean!
The issue was it conflicted with admin panel when bundled.

## MCP WORKING SPECIFICATION (FROM THECHIEF-CLEAN)

### Exact Requirements for Working MCP:
```
Dependencies Required:
- mcp-handler@^1.0.2
- zod@^3.23.8  
- payload-plugin-mcp (bundled locally in clean, caused admin issues)

Environment Variables:
- MCP_API_KEY=thechief-mcp-secret-key-2024
- Database must have STATUS columns for posts/pages

Payload Config:
- collections: 'all'
- defaultOperations: list, get, create, update (delete: false)
- apiKey from env.MCP_API_KEY

Claude Desktop Config:
- command: npx
- args: ["-y", "mcp-remote", "[URL]/api/plugin/mcp", "--header", "Authorization: Bearer ${MCP_API_KEY}"]
- env: { "MCP_API_KEY": "thechief-mcp-secret-key-2024" }
```

### What Claude Could Do with Working MCP:
- ✅ Create posts with title, content, status fields
- ✅ List and read existing posts
- ✅ Update post content and status
- ✅ Handle rich text/markdown content
- ✅ Set draft/published status
- ✅ Error: "column status does not exist" = needs SQL fix

### Test MCP Connection:
```bash
# This command verifies MCP is working
MCP_API_KEY="thechief-mcp-secret-key-2024" \
npx -y mcp-remote https://[your-deployment]/api/plugin/mcp \
--header "Authorization: Bearer $MCP_API_KEY" --test
```

### Step 10: Claude Desktop Config
```json
{
  "mcpServers": {
    "thechief-final": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://thechief-final.vercel.app/api/plugin/mcp",
        "--header",
        "Authorization: Bearer ${MCP_API_KEY}"
      ],
      "env": {
        "MCP_API_KEY": "thechief-mcp-secret-2024"
      }
    }
  }
}
```

## CRITICAL SUCCESS FACTORS

### ✅ DO:
- Use completely NEW database
- Test admin panel BEFORE adding MCP
- Use npm (not pnpm) for Vercel
- Set NEXT_PUBLIC_SERVER_URL to exact Vercel URL
- Add visual blocks one at a time and test
- Generate import maps: `npx payload generate:importmap`

### ❌ DON'T:
- Share database between projects
- Bundle MCP plugin source code in project
- Use custom domain for NEXT_PUBLIC_SERVER_URL initially
- Add too many features at once
- Mix package managers

## TESTING CHECKLIST
- [ ] Admin panel loads at /admin
- [ ] Can login successfully
- [ ] Visual editor shows blocks
- [ ] Can create/save pages
- [ ] API works at /api/pages
- [ ] Only then: Add MCP integration
- [ ] Claude Desktop can connect

## PRIORITY ORDER (CRITICAL!)

1. **Admin Panel MUST work first** - This is non-negotiable
2. **Visual Page Builder second** - For content management
3. **MCP Integration last** - Only if everything else works
4. **If MCP breaks admin** - Remove it immediately

## If Admin Panel Fails:
1. Check browser console for exact error
2. Verify NEXT_PUBLIC_SERVER_URL matches deployment  
3. Check database connection
4. Run: `npx payload generate:importmap`
5. Ensure no MCP plugin interfering (REMOVE IT if present)
6. Check Vercel build logs
7. Verify STATUS columns exist in database

## Database Note
- Payload runs on **Neon Cloud PostgreSQL** (not local database)
- Projects connect to Neon via connection string
- Each project should use different tables or database

---

## AUTHENTICATION UPDATE: Migrating to BetterAuth

### Why BetterAuth Instead of Clerk
1. **Cost Efficiency** - Open source, no per-user fees
2. **Multi-Tenant Ready** - Built-in organizations/teams support
3. **Data Ownership** - User data stays in your Neon database
4. **Next.js Native** - Built specifically for Next.js
5. **Type Safety** - Full TypeScript support throughout

### BetterAuth Installation
```bash
# Install BetterAuth
npm install better-auth

# Install plugins for multi-tenant
npm install better-auth/plugins
```

### BetterAuth Configuration
```typescript
// /src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization, twoFactor } from 'better-auth/plugins'

export const auth = betterAuth({
  database: prismaAdapter(prisma),
  
  plugins: [
    organization({      // Multi-tenant support
      allowUserToCreateOrganization: true,
      requireOrganization: false,
    }),
    twoFactor(),       // Optional MFA
  ],
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set true for production
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // Update daily
  },
})
```

### Database Schema for BetterAuth
```prisma
// Add to schema.prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  emailVerified Boolean  @default(false)
  name          String?
  password      String?  // Hashed password
  image         String?
  
  sessions      Session[]
  organizations OrganizationMember[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  
  members     OrganizationMember[]
  invitations OrganizationInvitation[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## SECURITY STACK SETUP

### Essential Security Tools from Quest Core

#### 1. Semgrep - Security Scanning
```yaml
# .github/workflows/semgrep.yml
name: Semgrep Security Scan

on:
  pull_request: {}
  push:
    branches: [main]

jobs:
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
```

#### 2. Husky - Pre-commit Hooks
```bash
# Install Husky and lint-staged
npm install -D husky lint-staged

# Initialize Husky
npx husky init

# Add pre-commit hook
echo 'npx lint-staged' > .husky/pre-commit
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

#### 3. HyperDX - Monitoring
```typescript
// /src/lib/monitoring.ts
import { HyperDX } from '@hyperdx/browser'

export const hdx = new HyperDX({
  apiKey: process.env.NEXT_PUBLIC_HYPERDX_API_KEY,
  service: 'thechief-platform',
  tracePropagationTargets: [/api/],
  consoleCapture: true,
  advancedNetworkCapture: true,
})
```

---

## MCP SERVER CONFIGURATIONS

### Essential MCP Servers to Install

#### 1. Context7 - Up-to-date Documentation
```json
// Add to Claude Desktop config
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"],
    "env": {
      "CONTEXT7_API_KEY": "your-api-key"
    }
  }
}
```

#### 2. Zen MCP - Multi-LLM Orchestration
```json
{
  "zen": {
    "command": "npx",
    "args": ["-y", "zen-mcp-server"],
    "env": {
      "OPENROUTER_API_KEY": "your-api-key"
    }
  }
}
```

---

## MULTI-SITE CONSIDERATIONS

### For Future Multi-Site Platform
1. **Use table prefixes**: `thechief_posts`, `tractor_policies`
2. **Shared user table**: Single user can access multiple sites
3. **Site detection**: Based on domain or subdomain
4. **Dynamic configs**: Store per-site settings in database
5. **Monorepo structure**: Use Turborepo for managing multiple apps

### Environment Variables for Multi-Site
```env
# Site-specific (per app)
SITE_ID=thechief
SITE_DOMAIN=thechief.quest

# Shared across all sites
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
ZEP_API_KEY=...
OPENROUTER_API_KEY=...
```

---

## RECOMMENDED TECH STACK ADDITIONS

### From Quest Core V2
- **ZEP** - Conversation memory (essential for context)
- **Neo4j** - Graph database for relationships
- **Prisma** - Type-safe ORM
- **OpenRouter** - Multi-model AI routing
- **Svix** - Webhook security

### New Additions
- **BetterAuth** - Replacing Clerk
- **Context7 MCP** - Always up-to-date docs
- **Semgrep** - Security scanning
- **HyperDX** - Monitoring

---

This setup WILL work because:
1. Clean database/tables = no conflicts
2. No MCP initially = no context errors  
3. Correct env vars = proper routing
4. STATUS field fix = no schema errors
5. Visual blocks = working page builder
6. Step-by-step = catch issues early
7. Cloud database = consistent across environments
8. **BetterAuth** = cost-effective multi-tenant auth
9. **Security stack** = enterprise-grade protection
10. **MCP servers** = enhanced development capabilities