# Power Platform MCP Server

An AI-powered **Model Context Protocol (MCP)** server that connects LLMs securely to your Microsoft Power Platform environment. This server enables AI agents to query Dataverse, manage solutions, and create Power Automate flows programmatically.

## 🚀 Features

*   **Data Management**: Query, Create, Update, and Delete Dataverse records.
*   **Schema Management**: Create Tables, Columns, and Views on the fly.
*   **Automation**: Create complex Power Automate (Cloud Flows) via JSON definitions.
*   **Discovery**: List available Solutions, Tables, and Plugin Logs.

## 🛠️ Setup

1.  **Clone the Repository**
    ```bash
    git clone <your-repo-url>
    cd powerapps-mcp-server
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file based on `.env.example`:
    ```env
    DATAVERSE_URL=https://your-org.crm.dynamics.com
    AZURE_TENANT_ID=your-tenant-id
    AZURE_CLIENT_ID=your-client-id
    AZURE_CLIENT_SECRET=your-client-secret
    ```

4.  **Build**
    ```bash
    npm run build
    ```

## 🏃 Usage with MCP Client (e.g., Claude Desktop, Cursor)

Add the server to your MCP configuration (`mcp-config.json`):

```json
{
  "mcpServers": {
    "powerapps": {
      "command": "node",
      "args": ["/path/to/powerapps-mcp-server/dist/index.js"],
      "env": {
        "DATAVERSE_URL": "https://your-org.crm.dynamics.com",
        "AZURE_TENANT_ID": "...",
        "AZURE_CLIENT_ID": "...",
        "AZURE_CLIENT_SECRET": "..."
      }
    }
  }
}
```

## 📚 Documentation

*   [MCP Protocol Specification](https://modelcontextprotocol.io/)
*   [Dataverse Web API Reference](https://learn.microsoft.com/power-apps/developer/data-platform/webapi/overview)

## License
MIT
