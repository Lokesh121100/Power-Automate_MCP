import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DataverseClient, DataverseRecord } from "./dataverse-client.js";

/**
 * Registers all Power Apps / Dataverse MCP tools on the server.
 */
export function registerTools(server: McpServer, client: DataverseClient): void {

    // ─────────────────────────────────────────────
    // Tool 1: list_tables
    // ─────────────────────────────────────────────
    server.tool(
        "list_tables",
        "List all available Dataverse tables in the Power Apps environment. Returns table names, display names, and whether they are custom tables.",
        {},
        async () => {
            try {
                const tables = await client.listTables();
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(tables, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error listing tables: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 2: get_records
    // ─────────────────────────────────────────────
    server.tool(
        "get_records",
        "Query records from a Dataverse table. Supports OData filtering, column selection, sorting, and pagination. Use the plural logical collection name for the table (e.g., 'accounts', 'contacts').",
        {
            tableName: z.string().describe("The plural logical collection name of the table (e.g., 'accounts', 'contacts')"),
            select: z.string().optional().describe("Comma-separated column names to retrieve (e.g., 'name,emailaddress1,telephone1')"),
            filter: z.string().optional().describe("OData filter expression (e.g., \"statecode eq 0\" or \"name eq 'Contoso'\")"),
            top: z.number().optional().describe("Maximum number of records to return (default: 50)"),
            orderBy: z.string().optional().describe("OData orderby expression (e.g., 'createdon desc')"),
        },
        async ({ tableName, select, filter, top, orderBy }) => {
            try {
                const result = await client.getRecords(tableName, {
                    select,
                    filter,
                    top: top || 50,
                    orderBy,
                });
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                {
                                    count: result.value.length,
                                    records: result.value,
                                    hasMore: !!result["@odata.nextLink"],
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error querying records: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 3: get_record
    // ─────────────────────────────────────────────
    server.tool(
        "get_record",
        "Get a single Dataverse record by its unique ID (GUID). Returns all columns or selected columns.",
        {
            tableName: z.string().describe("The plural logical collection name of the table (e.g., 'accounts')"),
            recordId: z.string().describe("The GUID of the record (e.g., '00000000-0000-0000-0000-000000000001')"),
            select: z.string().optional().describe("Comma-separated column names to retrieve"),
        },
        async ({ tableName, recordId, select }) => {
            try {
                const record = await client.getRecord(tableName, recordId, select);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(record, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error getting record: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 4: create_record
    // ─────────────────────────────────────────────
    server.tool(
        "create_record",
        "Create a new record in a Dataverse table. Provide the table name and record data as a JSON object with column names as keys.",
        {
            tableName: z.string().describe("The plural logical collection name of the table (e.g., 'accounts')"),
            data: z.string().describe("JSON string of the record data. Keys are column logical names, values are the data. Example: '{\"name\": \"Contoso\", \"emailaddress1\": \"info@contoso.com\"}'"),
        },
        async ({ tableName, data }) => {
            try {
                const recordData = JSON.parse(data);
                const recordId = await client.createRecord(tableName, recordData);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    message: "Record created successfully",
                                    recordId: recordId,
                                    table: tableName,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error creating record: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 5: update_record
    // ─────────────────────────────────────────────
    server.tool(
        "update_record",
        "Update an existing Dataverse record. Provide the record ID and the fields to update as a JSON object.",
        {
            tableName: z.string().describe("The plural logical collection name of the table (e.g., 'accounts')"),
            recordId: z.string().describe("The GUID of the record to update"),
            data: z.string().describe("JSON string of the fields to update. Example: '{\"name\": \"Updated Name\", \"telephone1\": \"+1-555-0123\"}'"),
        },
        async ({ tableName, recordId, data }) => {
            try {
                const updateData = JSON.parse(data);
                await client.updateRecord(tableName, recordId, updateData);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    message: "Record updated successfully",
                                    recordId: recordId,
                                    table: tableName,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error updating record: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 6: delete_record
    // ─────────────────────────────────────────────
    server.tool(
        "delete_record",
        "Delete a Dataverse record by its unique ID. This action is permanent and cannot be undone.",
        {
            tableName: z.string().describe("The plural logical collection name of the table (e.g., 'accounts')"),
            recordId: z.string().describe("The GUID of the record to delete"),
        },
        async ({ tableName, recordId }) => {
            try {
                await client.deleteRecord(tableName, recordId);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    message: "Record deleted successfully",
                                    recordId: recordId,
                                    table: tableName,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error deleting record: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 7: get_entity_metadata
    // ─────────────────────────────────────────────
    server.tool(
        "get_entity_metadata",
        "Get the full metadata definition for a Dataverse entity, including display name, ownership type, primary key/name attributes, and customization capabilities.",
        {
            entityName: z.string().describe("The logical name of the entity (e.g., 'account', 'contact')"),
        },
        async ({ entityName }) => {
            try {
                const metadata = await client.getEntityMetadata(entityName);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(metadata, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error getting entity metadata: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 8: get_entity_attributes
    // ─────────────────────────────────────────────
    server.tool(
        "get_entity_attributes",
        "Get all attributes (columns) for a Dataverse entity. Returns logical names, display names, data types, and whether they are custom.",
        {
            entityName: z.string().describe("The logical name of the entity (e.g., 'account', 'contact')"),
        },
        async ({ entityName }) => {
            try {
                const attributes = await client.getEntityAttributes(entityName);
                const simplified = attributes.map((attr) => ({
                    logicalName: attr.LogicalName,
                    displayName:
                        (attr.DisplayName as { UserLocalizedLabel?: { Label?: string } })
                            ?.UserLocalizedLabel?.Label || attr.LogicalName,
                    type: attr.AttributeType,
                    isCustom: attr.IsCustomAttribute,
                    requiredLevel:
                        (attr.RequiredLevel as { Value?: string })?.Value || "None",
                    description:
                        (attr.Description as { UserLocalizedLabel?: { Label?: string } })
                            ?.UserLocalizedLabel?.Label || "",
                }));
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                { count: simplified.length, attributes: simplified },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error getting entity attributes: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 9: get_entity_attribute
    // ─────────────────────────────────────────────
    server.tool(
        "get_entity_attribute",
        "Get the full definition of a single attribute (column) on a Dataverse entity, including type, constraints, and metadata.",
        {
            entityName: z.string().describe("The logical name of the entity (e.g., 'account')"),
            attributeName: z.string().describe("The logical name of the attribute (e.g., 'name', 'emailaddress1')"),
        },
        async ({ entityName, attributeName }) => {
            try {
                const attribute = await client.getEntityAttribute(entityName, attributeName);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(attribute, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error getting attribute: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 10: get_entity_relationships
    // ─────────────────────────────────────────────
    server.tool(
        "get_entity_relationships",
        "Get all relationships for a Dataverse entity, including One-to-Many, Many-to-One, and Many-to-Many relationships.",
        {
            entityName: z.string().describe("The logical name of the entity (e.g., 'account', 'contact')"),
        },
        async ({ entityName }) => {
            try {
                const data = await client.getEntityRelationships(entityName);
                const result = {
                    entityName,
                    oneToMany: (data.OneToManyRelationships as DataverseRecord[] || []).map((r) => ({
                        schemaName: r.SchemaName,
                        referencedEntity: r.ReferencedEntity,
                        referencingEntity: r.ReferencingEntity,
                        referencingAttribute: r.ReferencingAttribute,
                    })),
                    manyToOne: (data.ManyToOneRelationships as DataverseRecord[] || []).map((r) => ({
                        schemaName: r.SchemaName,
                        referencedEntity: r.ReferencedEntity,
                        referencingEntity: r.ReferencingEntity,
                        referencingAttribute: r.ReferencingAttribute,
                    })),
                    manyToMany: (data.ManyToManyRelationships as DataverseRecord[] || []).map((r) => ({
                        schemaName: r.SchemaName,
                        entity1LogicalName: r.Entity1LogicalName,
                        entity2LogicalName: r.Entity2LogicalName,
                        intersectEntityName: r.IntersectEntityName,
                    })),
                };
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error getting relationships: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 11: get_plugin_assemblies
    // ─────────────────────────────────────────────
    server.tool(
        "get_plugin_assemblies",
        "List all registered plugin assemblies in the Power Platform environment. Returns names, versions, and creation dates.",
        {},
        async () => {
            try {
                const assemblies = await client.getPluginAssemblies();
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                { count: assemblies.length, assemblies },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error getting plugin assemblies: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 12: get_plugin_trace_logs
    // ─────────────────────────────────────────────
    server.tool(
        "get_plugin_trace_logs",
        "Retrieve plugin trace logs from the Power Platform environment. Filter by entity, message, or correlation ID to debug plugin execution.",
        {
            entityName: z.string().optional().describe("Filter logs by primary entity name (e.g., 'account')"),
            messageName: z.string().optional().describe("Filter logs by message name (e.g., 'Create', 'Update', 'Delete')"),
            correlationId: z.string().optional().describe("Filter logs by correlation ID (GUID)"),
            top: z.number().optional().describe("Maximum number of logs to return (default: 50)"),
        },
        async ({ entityName, messageName, correlationId, top }) => {
            try {
                const logs = await client.getPluginTraceLogs({
                    entityName,
                    messageName,
                    correlationId,
                    top,
                });
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                { count: logs.length, logs },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error getting plugin trace logs: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 13: check_component_dependencies
    // ─────────────────────────────────────────────
    server.tool(
        "check_component_dependencies",
        "Check dependencies for a Power Platform component before deletion. Returns a list of dependent components. Common component types: 1=Entity, 2=Attribute, 26=SavedQuery, 59=SavedQueryVisualization, 60=SystemForm, 61=WebResource, 91=PluginAssembly.",
        {
            objectId: z.string().describe("The GUID of the component to check"),
            componentType: z.number().describe("The component type code (e.g., 1=Entity, 2=Attribute, 61=WebResource, 91=PluginAssembly)"),
        },
        async ({ objectId, componentType }) => {
            try {
                const dependencies = await client.checkComponentDependencies(objectId, componentType);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                {
                                    componentId: objectId,
                                    componentType,
                                    dependencyCount: dependencies.length,
                                    canDelete: dependencies.length === 0,
                                    dependencies,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Error checking dependencies: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ═════════════════════════════════════════════
    // LOW-CODE TOOLS
    // ═════════════════════════════════════════════

    // ─────────────────────────────────────────────
    // Tool 14: create_entity
    // ─────────────────────────────────────────────
    server.tool(
        "create_entity",
        "Create a new custom table (entity) in Dataverse. The schema name must include a publisher prefix (e.g., 'new_Project'). A primary Name column is created automatically.",
        {
            schemaName: z.string().describe("Schema name with publisher prefix (e.g., 'new_Project', 'cr123_Task')"),
            displayName: z.string().describe("Display name for the table (e.g., 'Project')"),
            pluralName: z.string().describe("Plural display name (e.g., 'Projects')"),
            description: z.string().optional().describe("Description of the table"),
            primaryAttributeDisplayName: z.string().optional().describe("Display name for the primary Name column (default: 'Name')"),
        },
        async ({ schemaName, displayName, pluralName, description, primaryAttributeDisplayName }) => {
            try {
                const result = await client.createEntity(
                    schemaName,
                    displayName,
                    pluralName,
                    description || "",
                    undefined,
                    primaryAttributeDisplayName || "Name"
                );
                // Publish after creating
                await client.publishAllCustomizations();
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    message: `Table '${displayName}' created and published successfully`,
                                    schemaName,
                                    metadata: result,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error creating table: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 15: create_attribute
    // ─────────────────────────────────────────────
    server.tool(
        "create_attribute",
        "Add a new column (attribute) to an existing Dataverse table. Supported types: String, Memo, Integer, Boolean, DateTime, Decimal, Money.",
        {
            entityName: z.string().describe("Logical name of the entity (e.g., 'new_project')"),
            attributeType: z.string().describe("Column type: 'String', 'Memo', 'Integer', 'Boolean', 'DateTime', 'Decimal', or 'Money'"),
            schemaName: z.string().describe("Schema name with prefix (e.g., 'new_Budget')"),
            displayName: z.string().describe("Display name (e.g., 'Budget')"),
            description: z.string().optional().describe("Description of the column"),
            requiredLevel: z.string().optional().describe("'None', 'Recommended', or 'ApplicationRequired'"),
            maxLength: z.number().optional().describe("Max length for String/Memo types"),
        },
        async ({ entityName, attributeType, schemaName, displayName, description, requiredLevel, maxLength }) => {
            try {
                const result = await client.createAttribute(entityName, attributeType, schemaName, displayName, {
                    description,
                    requiredLevel,
                    maxLength,
                });
                await client.publishAllCustomizations();
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    message: `Column '${displayName}' (${attributeType}) added to '${entityName}' and published`,
                                    schemaName,
                                    metadata: result,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error creating column: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 16: list_views
    // ─────────────────────────────────────────────
    server.tool(
        "list_views",
        "List all saved views for a Dataverse entity. Returns view names, IDs, and FetchXML definitions.",
        {
            entityName: z.string().describe("Logical name of the entity (e.g., 'account', 'contact')"),
        },
        async ({ entityName }) => {
            try {
                const views = await client.listViews(entityName);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({ count: views.length, views }, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error listing views: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 17: create_view
    // ─────────────────────────────────────────────
    server.tool(
        "create_view",
        "Create a new saved view for a Dataverse entity. Requires FetchXML for the query and LayoutXML for column display.",
        {
            entityName: z.string().describe("Logical name of the entity"),
            name: z.string().describe("Display name for the view"),
            fetchXml: z.string().describe("FetchXML query for the view"),
            layoutXml: z.string().describe("LayoutXML defining displayed columns"),
            description: z.string().optional().describe("Description of the view"),
        },
        async ({ entityName, name, fetchXml, layoutXml, description }) => {
            try {
                const viewId = await client.createView(entityName, name, fetchXml, layoutXml, description);
                await client.publishAllCustomizations();
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                { success: true, message: `View '${name}' created and published`, viewId },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error creating view: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 18: list_solutions
    // ─────────────────────────────────────────────
    server.tool(
        "list_solutions",
        "List all solutions in the Power Platform environment. Shows solution names, versions, and whether they are managed.",
        {},
        async () => {
            try {
                const solutions = await client.listSolutions();
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({ count: solutions.length, solutions }, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error listing solutions: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 19: export_solution
    // ─────────────────────────────────────────────
    server.tool(
        "export_solution",
        "Export a Power Platform solution as a base64-encoded zip file. Can export as managed or unmanaged.",
        {
            solutionName: z.string().describe("Unique name of the solution to export"),
            managed: z.boolean().optional().describe("Export as managed (true) or unmanaged (false, default)"),
        },
        async ({ solutionName, managed }) => {
            try {
                const fileData = await client.exportSolution(solutionName, managed || false);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    message: `Solution '${solutionName}' exported successfully`,
                                    solutionName,
                                    managed: managed || false,
                                    fileSize: `${(fileData.length * 0.75 / 1024).toFixed(0)} KB (approx)`,
                                    base64Data: fileData.substring(0, 200) + "... (truncated)",
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error exporting solution: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 20: list_flows
    // ─────────────────────────────────────────────
    server.tool(
        "list_flows",
        "List all Power Automate cloud flows in the environment. Returns flow names, status, and descriptions.",
        {},
        async () => {
            try {
                const flows = await client.listFlows();
                const simplified = flows.map((f) => ({
                    name: f.name,
                    workflowid: f.workflowid,
                    status: f.statecode === 0 ? "Draft" : f.statecode === 1 ? "Activated" : String(f.statecode),
                    description: f.description || "",
                    createdon: f.createdon,
                    modifiedon: f.modifiedon,
                }));
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify({ count: simplified.length, flows: simplified }, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error listing flows: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 21: create_flow
    // ─────────────────────────────────────────────
    server.tool(
        "create_flow",
        "Create a new Power Automate cloud flow. Provide the flow definition as a JSON string containing triggers and actions.",
        {
            name: z.string().describe("Name of the flow"),
            description: z.string().optional().describe("Description of the flow"),
            clientData: z.string().describe("JSON string of the flow definition (triggers and actions)"),
        },
        async ({ name, description, clientData }) => {
            try {
                const flowId = await client.createFlow(name, description || "", clientData);
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                { success: true, message: `Flow '${name}' created successfully`, flowId },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error creating flow: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    // ─────────────────────────────────────────────
    // Tool 22: publish_customizations
    // ─────────────────────────────────────────────
    server.tool(
        "publish_customizations",
        "Publish all pending customizations in the Power Platform environment. Run this after making schema changes (creating tables, columns, forms, views).",
        {},
        async () => {
            try {
                await client.publishAllCustomizations();
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(
                                { success: true, message: "All customizations published successfully" },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error publishing: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );
}
