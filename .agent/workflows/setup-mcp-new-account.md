---
description: How to set up and use the Power Apps MCP Server on a new Microsoft 365 account
---

# Power Apps MCP Server — Setup & Usage Workflow

## What is this MCP Server?

This is a **Model Context Protocol (MCP) server** that connects Antigravity (Gemini Code Assist) to **Microsoft Power Platform** services. It allows the AI to directly interact with:

- **Dataverse** (tables, records, views, solutions)
- **SharePoint** (sites, lists, items, document libraries)
- **Power Automate** (cloud flows)
- **Canvas Apps** (list, view, delete)

## Architecture

```
Antigravity (AI) → MCP Server (Node.js) → Azure AD Auth → Microsoft APIs
                                                          ├── Dataverse Web API
                                                          ├── Microsoft Graph API (SharePoint)
                                                          └── Dataverse (Canvas Apps, Flows)
```

## Authentication Method

The MCP server uses **Azure AD Application (Client Credentials)** authentication:
- No user login required
- Uses Client ID + Client Secret + Tenant ID
- Application permissions (not delegated)

---

## Setup Steps for a New Account

### Step 1: Register Azure AD App

1. Go to https://portal.azure.com → "App registrations" → "+ New registration"
2. Name: `PowerApps MCP Server`
3. Supported account types: `Single tenant`
4. Click Register
5. **Copy these 3 values:**
   - Application (client) ID
   - Directory (tenant) ID
   - Click "Certificates & secrets" → "+ New client secret" → Copy the Value

### Step 2: Add API Permissions

Go to "API permissions" → "+ Add a permission":

**Microsoft Graph (Application permissions):**
- `Sites.ReadWrite.All`
- `Sites.FullControl.All`

**Dynamics CRM (Application permissions):**
- `user_impersonation`

Then click **"Grant admin consent"** button.

### Step 3: Get Dataverse URL

1. Go to https://make.powerapps.com
2. Click gear icon → Session details
3. Copy "Instance url" (e.g., `https://org1234abc.crm.dynamics.com`)

### Step 4: Configure the MCP Server

// turbo
Update the `mcp-config.json` file in the project root with the new credentials:

```json
{
  "mcpServers": {
    "powerapps": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "FULL_PATH_TO_PROJECT_FOLDER",
      "env": {
        "AZURE_TENANT_ID": "your-new-tenant-id",
        "AZURE_CLIENT_ID": "your-new-client-id",
        "AZURE_CLIENT_SECRET": "your-new-client-secret",
        "DATAVERSE_URL": "https://your-new-org.crm.dynamics.com"
      }
    }
  }
}
```

### Step 5: Build and Test

// turbo
```bash
npm install
npm run build
```

### Step 6: Restart Antigravity

Close and reopen VS Code to reload the MCP server config.

### Step 7: Test with these commands in chat:
- "List all Dataverse tables"
- "List all SharePoint sites"
- "List all canvas apps"

---

## Available Tools (32+)

### Dataverse (14 tools)
- `list_tables` - List all tables
- `get_records` - Query records with OData filters
- `get_record` - Get single record by ID
- `create_record` - Create new record
- `update_record` - Update existing record
- `delete_record` - Delete a record
- `get_entity_metadata` - Get table schema
- `get_entity_attributes` - List all columns
- `get_entity_attribute` - Get column details
- `get_entity_relationships` - Get relationships
- `create_entity` - Create custom table
- `create_attribute` - Add column to table
- `create_view` - Create saved view
- `publish_customizations` - Publish changes

### SharePoint (9 tools)
- `list_sites` - List SharePoint sites
- `list_lists` - List all lists in a site
- `create_list` - Create list with columns
- `get_list_items` - Get items from list
- `create_list_item` - Add item to list
- `update_list_item` - Update list item
- `delete_list_item` - Delete list item
- `list_drives` - List document libraries
- `list_items` - List files/folders

### Power Automate (2 tools)
- `list_flows` - List cloud flows
- `create_flow` - Create new flow

### Solutions (2 tools)
- `list_solutions` - List all solutions
- `export_solution` - Export as zip

### Canvas Apps (3 tools)
- `list_canvas_apps` - List all apps
- `get_canvas_app` - Get app details
- `delete_canvas_app` - Delete app

### Plugins (3 tools)
- `get_plugin_assemblies` - List plugins
- `get_plugin_trace_logs` - Debug logs
- `check_component_dependencies` - Check dependencies

---

## Common Use Cases

### Build a New App
1. "Create a SharePoint list called 'Projects' with columns: Name (text), Budget (number), Status (choice), DueDate (datetime)"
2. "Add 10 sample project records"
3. "Create a flow that sends email when status changes to Complete"

### Manage Data
1. "Show all records from the accounts table where city equals Mumbai"
2. "Update the status of leave request ID 3 to Approved"
3. "Delete all test records from the Products list"

### Analyze Schema
1. "Show me all columns on the contact table"
2. "What relationships does the account table have?"
3. "List all custom tables in this environment"

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| 401 Unauthorized | Check CLIENT_ID and CLIENT_SECRET |
| 403 Forbidden | Grant admin consent in Azure AD |
| 404 Not Found | Check DATAVERSE_URL |
| AADSTS700016 | Check TENANT_ID matches |
| AADSTS7000215 | Create new client secret |
| Permissions not working | Wait 5-15 min after granting |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | MCP server entry point |
| `src/auth.ts` | Azure AD authentication |
| `src/dataverse-client.ts` | Dataverse API calls |
| `src/graph-client.ts` | SharePoint (Graph API) calls |
| `src/tools.ts` | All 32+ tool definitions |
| `mcp-config.json` | Server configuration |
| `.env` | Environment variables (secrets) |
