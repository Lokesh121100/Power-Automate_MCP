# Power Apps MCP Server — Complete Reference

## Overview

This MCP (Model Context Protocol) server enables AI assistants like Antigravity (Gemini Code Assist) to interact with Microsoft Power Platform directly. The AI can create SharePoint lists, manage Dataverse records, build Power Automate flows, and manage Canvas Apps — all through natural language commands.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        YOUR COMPUTER (Local)                        │
│                                                                      │
│  ┌─────────────┐    MCP Protocol     ┌────────────────────────────┐  │
│  │ Antigravity  │◄──────────────────►│  MCP Server (Node.js)      │  │
│  │ (AI in IDE)  │   JSON-RPC/stdio   │                            │  │
│  │              │                    │  ┌──────────────────────┐  │  │
│  │ You type:    │                    │  │ index.ts (entry)     │  │  │
│  │ "Create a    │                    │  │ ├─ auth.ts           │  │  │
│  │  SharePoint  │                    │  │ ├─ dataverse-client  │  │  │
│  │  list"       │                    │  │ ├─ graph-client      │  │  │
│  │              │                    │  │ └─ tools.ts (32+)    │  │  │
│  └─────────────┘                    │  └──────────────────────┘  │  │
│                                      └─────────┬──────────────────┘  │
└─────────────────────────────────────────────────┼────────────────────┘
                                                  │ HTTPS
                                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     MICROSOFT CLOUD (Azure)                          │
│                                                                      │
│  ┌──────────────┐    ┌──────────────────────────────────────────┐   │
│  │  Azure AD     │    │  Your Microsoft 365 Tenant               │   │
│  │  (OAuth2)     │    │                                          │   │
│  │              │    │  ┌─────────────┐  ┌──────────────────┐  │   │
│  │  Tenant ID   │    │  │ Dataverse   │  │ SharePoint       │  │   │
│  │  Client ID   │    │  │ Web API     │  │ (Graph API)      │  │   │
│  │  Client      │    │  │             │  │                  │  │   │
│  │  Secret      │    │  │ • Tables    │  │ • Sites          │  │   │
│  │              │    │  │ • Records   │  │ • Lists          │  │   │
│  │  ───────►    │    │  │ • Views     │  │ • Items          │  │   │
│  │  Token       │    │  │ • Solutions │  │ • Drives         │  │   │
│  │              │    │  │ • Flows     │  │                  │  │   │
│  │              │    │  │ • Apps      │  │                  │  │   │
│  └──────────────┘    │  └─────────────┘  └──────────────────┘  │   │
│                       └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. You type command ──► Antigravity sends to MCP Server
2. MCP Server ──► auth.ts gets OAuth2 token from Azure AD
3. MCP Server ──► Calls Microsoft API (Dataverse or Graph)
4. Microsoft API ──► Returns data
5. MCP Server ──► Formats response for Antigravity
6. Antigravity ──► Shows results to you
```

---

## Project Folder Structure

```
powerapps-mcp-server/
│
├── 📁 .agent/                          # Antigravity workflows
│   └── 📁 workflows/
│       └── 📄 setup-mcp-new-account.md # Slash command: /setup-mcp-new-account
│
├── 📁 src/                             # Source code (TypeScript)
│   ├── 📄 index.ts          (3 KB)    # Entry point — registers MCP tools
│   ├── 📄 auth.ts           (1 KB)    # Azure AD OAuth2 authentication
│   ├── 📄 dataverse-client.ts (25 KB) # Dataverse Web API wrapper
│   ├── 📄 graph-client.ts   (6 KB)    # Microsoft Graph API wrapper
│   └── 📄 tools.ts          (64 KB)   # All 32+ MCP tool definitions
│
├── 📁 dist/                            # Compiled JavaScript (auto-generated)
│   ├── 📄 index.js                     # Compiled entry point
│   ├── 📄 auth.js                      # Compiled auth
│   ├── 📄 dataverse-client.js          # Compiled Dataverse client
│   ├── 📄 graph-client.js              # Compiled Graph client
│   ├── 📄 tools.js                     # Compiled tools
│   └── 📄 *.d.ts, *.js.map            # Type definitions & source maps
│
├── 📄 .env                  (274 B)   # ⚠️ Credentials (NEVER commit!)
├── 📄 .env.example          (720 B)   # Template for .env
├── 📄 .gitignore             (352 B)  # Git ignore rules
├── 📄 mcp-config.json       (582 B)   # MCP server configuration
├── 📄 package.json           (550 B)  # Node.js dependencies
├── 📄 package-lock.json      (62 KB)  # Dependency lock file
├── 📄 tsconfig.json          (572 B)  # TypeScript compiler config
├── 📄 MCP_REFERENCE.md                # This file — complete reference
├── 📄 mcp_setup_guide.md              # Step-by-step setup for new accounts
└── 📄 README.md              (2 KB)   # Project readme
```

### File Responsibilities

| File | What It Does |
|------|-------------|
| **index.ts** | Starts MCP server, initializes auth + clients, registers all tools |
| **auth.ts** | Gets OAuth2 access tokens from Azure AD using client credentials |
| **dataverse-client.ts** | CRUD operations on Dataverse (tables, records, metadata, views, solutions, flows, apps) |
| **graph-client.ts** | SharePoint operations via Microsoft Graph API (sites, lists, items, drives) |
| **tools.ts** | Defines all 32+ tools with names, descriptions, input schemas (Zod), and handler logic |
| **mcp-config.json** | Tells Antigravity how to start the MCP server and what credentials to pass |
| **.env** | Stores secrets (Tenant ID, Client ID, Client Secret, Dataverse URL) |

---

## Authentication

### Method: Azure AD Client Credentials (Application Permissions)

```
App Registration (Azure Portal)
├── Tenant ID      → Identifies your M365 organization
├── Client ID      → Identifies this MCP application
└── Client Secret  → Password for the application

Permissions Required:
├── Microsoft Graph
│   ├── Sites.ReadWrite.All    (Application) → SharePoint read/write
│   └── Sites.FullControl.All  (Application) → SharePoint create/delete
└── Dynamics CRM
    └── user_impersonation     (Application) → Dataverse full access
```

> **CRITICAL:** After adding permissions, click "Grant admin consent" — without this, nothing works!

---

## Configuration

### .env file
```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
DATAVERSE_URL=https://your-org.crm.dynamics.com
```

### mcp-config.json
```json
{
  "mcpServers": {
    "powerapps": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "C:/Users/lokes/.gemini/antigravity/scratch/powerapps-mcp-server",
      "env": {
        "AZURE_TENANT_ID": "<tenant-id>",
        "AZURE_CLIENT_ID": "<client-id>",
        "AZURE_CLIENT_SECRET": "<client-secret>",
        "DATAVERSE_URL": "https://<org>.crm.dynamics.com"
      }
    }
  }
}
```

---

## All 32+ Tools

### Dataverse — Table Management (8 tools)
| Tool | Parameters | What It Does |
|------|-----------|-------------|
| `list_tables` | — | Lists all Dataverse tables |
| `create_entity` | schemaName, displayName, pluralName | Creates new custom table |
| `create_attribute` | entityName, schemaName, displayName, type | Adds column to table |
| `publish_customizations` | — | Publishes schema changes |
| `get_entity_metadata` | entityName | Gets full table definition |
| `get_entity_attributes` | entityName | Lists all columns with types |
| `get_entity_attribute` | entityName, attributeName | Gets single column details |
| `get_entity_relationships` | entityName | Gets all table relationships |

### Dataverse — Record Operations (5 tools)
| Tool | Parameters | What It Does |
|------|-----------|-------------|
| `get_records` | tableName, select?, filter?, top?, orderBy? | Queries records |
| `get_record` | tableName, recordId, select? | Gets single record |
| `create_record` | tableName, data (JSON) | Creates new record |
| `update_record` | tableName, recordId, data (JSON) | Updates existing record |
| `delete_record` | tableName, recordId | Deletes a record |

### Dataverse — Views & Solutions (4 tools)
| Tool | Parameters | What It Does |
|------|-----------|-------------|
| `list_views` | entityName | Lists saved views for a table |
| `create_view` | entityName, name, fetchXml, layoutXml | Creates new saved view |
| `list_solutions` | — | Lists all Power Platform solutions |
| `export_solution` | solutionName, managed? | Exports solution as ZIP |

### SharePoint (9 tools)
| Tool | Parameters | What It Does |
|------|-----------|-------------|
| `list_sites` | search? | Lists all SharePoint sites |
| `list_lists` | siteId | Lists all lists in a site |
| `create_list` | siteId, displayName, columns (JSON) | Creates list with columns |
| `get_list_items` | siteId, listId, top? | Gets all items from list |
| `create_list_item` | siteId, listId, fields (JSON) | Adds item to list |
| `update_list_item` | siteId, listId, itemId, fields (JSON) | Updates list item |
| `delete_list_item` | siteId, listId, itemId | Deletes list item |
| `list_drives` | siteId | Lists document libraries |
| `list_items` | driveId, itemId? | Lists files/folders in drive |

### Power Automate (2 tools)
| Tool | Parameters | What It Does |
|------|-----------|-------------|
| `list_flows` | — | Lists all cloud flows |
| `create_flow` | name, clientData (JSON), description? | Creates new cloud flow |

### Canvas Apps (3 tools)
| Tool | Parameters | What It Does |
|------|-----------|-------------|
| `list_canvas_apps` | — | Lists all canvas apps |
| `get_canvas_app` | appId | Gets app details |
| `delete_canvas_app` | appId | Deletes a canvas app |

### Plugins & Dependencies (3 tools)
| Tool | Parameters | What It Does |
|------|-----------|-------------|
| `get_plugin_assemblies` | — | Lists registered plugins |
| `get_plugin_trace_logs` | entityName?, messageName?, top? | Gets debug trace logs |
| `check_component_dependencies` | objectId, componentType | Checks before deletion |

---

## Switching to a New Account

1. Register new Azure AD App in the new tenant (portal.azure.com)
2. Add same permissions: Graph (Sites.*) + Dynamics CRM (user_impersonation)
3. Grant admin consent
4. Get new Dataverse URL (make.powerapps.com → Settings → Session Details)
5. Update `.env` / `mcp-config.json` with new credentials
6. Rebuild: `npm run build`
7. Restart VS Code / Antigravity
8. Test: "List all Dataverse tables"

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Wrong Client ID or Secret | Re-check Azure AD app |
| 403 Forbidden | Permissions not granted | Click "Grant admin consent" |
| 404 Not Found | Wrong Dataverse URL | Check Instance URL |
| AADSTS700016 | App not in this tenant | Verify Tenant ID |
| AADSTS7000215 | Invalid/expired secret | Create new secret |
| SharePoint 403 | Missing Sites.FullControl.All | Add permission + consent |
| New permissions not working | Propagation delay | Wait 5-15 minutes |

---

## Security

- **Never commit `.env` to Git** — it contains secrets
- Client secrets expire — renew before expiry
- Use separate App Registrations per tenant
- MCP server runs **locally** — no cloud hosting needed
- All API calls go directly from your machine to Microsoft
