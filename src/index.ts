#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import { DataverseAuth } from "./auth.js";
export * from "./auth.js";
export * from "./dataverse-client.js";
export * from "./graph-client.js";
import { GraphClient } from "./graph-client.js";
import { DataverseClient } from "./dataverse-client.js";
import { registerTools } from "./tools.js";

// Load environment variables from .env file
config();

/**
 * Validates that all required environment variables are set.
 */
function validateConfig(): {
    dataverseUrl: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
} {
    const required = {
        DATAVERSE_URL: process.env.DATAVERSE_URL,
        AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
        AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
        AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
    };

    const missing = Object.entries(required)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        console.error(
            `❌ Missing required environment variables: ${missing.join(", ")}\n` +
            `   Copy .env.example to .env and fill in your values.\n` +
            `   See README.md for setup instructions.`
        );
        process.exit(1);
    }

    return {
        dataverseUrl: required.DATAVERSE_URL!.replace(/\/+$/, ""), // Remove trailing slash
        tenantId: required.AZURE_TENANT_ID!,
        clientId: required.AZURE_CLIENT_ID!,
        clientSecret: required.AZURE_CLIENT_SECRET!,
    };
}

/**
 * Main entry point — creates and starts the MCP server.
 */
async function main(): Promise<void> {
    // Validate configuration
    const { dataverseUrl, tenantId, clientId, clientSecret } = validateConfig();

    // Set up authentication and Dataverse client
    const auth = new DataverseAuth(tenantId, clientId, clientSecret, dataverseUrl);
    const dataverseClient = new DataverseClient(auth, dataverseUrl);
    const graphClient = new GraphClient(auth); // Initialize Graph Client

    // Create MCP server
    const server = new McpServer({
        name: "powerapps-dataverse",
        version: "1.0.0",
    });

    // Register all tools
    registerTools(server, dataverseClient, graphClient);

    // Connect via stdio transport (standard for MCP)
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("✅ Power Apps / Dataverse MCP Server is running!");
    console.error(`   Connected to: ${dataverseUrl}`);
    console.error("   Waiting for MCP client connections via stdio...");
}

// Start the server
main().catch((error) => {
    console.error("💥 Fatal error starting MCP server:", error);
    process.exit(1);
});
