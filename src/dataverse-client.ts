import { DataverseAuth } from "./auth.js";

/**
 * Represents a single Dataverse record (key-value pairs).
 */
export interface DataverseRecord {
    [key: string]: unknown;
}

/**
 * Response from a Dataverse query containing multiple records.
 */
export interface DataverseQueryResponse {
    "@odata.context"?: string;
    "@odata.count"?: number;
    "@odata.nextLink"?: string;
    value: DataverseRecord[];
}

/**
 * HTTP client for the Dataverse Web API.
 * Handles all CRUD operations against Dataverse tables.
 */
export class DataverseClient {
    private auth: DataverseAuth;
    private baseUrl: string;
    private apiVersion: string;

    constructor(auth: DataverseAuth, dataverseUrl: string, apiVersion: string = "v9.2") {
        this.auth = auth;
        this.baseUrl = `${dataverseUrl}/api/data/${apiVersion}`;
        this.apiVersion = apiVersion;
    }

    /**
     * Makes an authenticated HTTP request to the Dataverse Web API.
     */
    private async request(
        method: string,
        path: string,
        body?: unknown,
        extraHeaders?: Record<string, string>
    ): Promise<Response> {
        const token = await this.auth.getAccessToken();
        const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;

        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            ...extraHeaders,
        };

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Dataverse API error ${response.status} ${response.statusText}: ${errorBody}`
            );
        }

        return response;
    }

    /**
     * Lists all available tables (Entity Definitions) in the Dataverse environment.
     * Returns table logical names and display names.
     */
    async listTables(): Promise<DataverseRecord[]> {
        const response = await this.request(
            "GET",
            "/EntityDefinitions?$select=LogicalName,DisplayName,LogicalCollectionName,Description,IsCustomEntity&$filter=IsPrivate eq false"
        );
        const data = (await response.json()) as DataverseQueryResponse;
        return data.value.map((table) => ({
            logicalName: table.LogicalName,
            displayName:
                (table.DisplayName as { UserLocalizedLabel?: { Label?: string } })
                    ?.UserLocalizedLabel?.Label || table.LogicalName,
            collectionName: table.LogicalCollectionName,
            description:
                (table.Description as { UserLocalizedLabel?: { Label?: string } })
                    ?.UserLocalizedLabel?.Label || "",
            isCustom: table.IsCustomEntity,
        }));
    }

    /**
     * Queries records from a Dataverse table.
     * @param tableName - The logical collection name of the table (plural, e.g., "accounts")
     * @param select - Comma-separated list of columns to retrieve
     * @param filter - OData filter expression
     * @param top - Maximum number of records to return
     * @param orderBy - OData orderby expression
     */
    async getRecords(
        tableName: string,
        options?: {
            select?: string;
            filter?: string;
            top?: number;
            orderBy?: string;
            expand?: string;
        }
    ): Promise<DataverseQueryResponse> {
        const queryParams: string[] = [];

        if (options?.select) queryParams.push(`$select=${options.select}`);
        if (options?.filter) queryParams.push(`$filter=${options.filter}`);
        if (options?.top) queryParams.push(`$top=${options.top}`);
        if (options?.orderBy) queryParams.push(`$orderby=${options.orderBy}`);
        if (options?.expand) queryParams.push(`$expand=${options.expand}`);

        const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
        const response = await this.request("GET", `/${tableName}${queryString}`);
        return (await response.json()) as DataverseQueryResponse;
    }

    /**
     * Gets a single record by its ID.
     * @param tableName - The logical collection name of the table (plural)
     * @param recordId - The GUID of the record
     * @param select - Comma-separated list of columns to retrieve
     */
    async getRecord(
        tableName: string,
        recordId: string,
        select?: string
    ): Promise<DataverseRecord> {
        const queryString = select ? `?$select=${select}` : "";
        const response = await this.request(
            "GET",
            `/${tableName}(${recordId})${queryString}`
        );
        return (await response.json()) as DataverseRecord;
    }

    /**
     * Creates a new record in a Dataverse table.
     * @param tableName - The logical collection name of the table (plural)
     * @param data - The record data as key-value pairs
     * @returns The ID of the newly created record
     */
    async createRecord(
        tableName: string,
        data: DataverseRecord
    ): Promise<string> {
        const response = await this.request("POST", `/${tableName}`, data, {
            Prefer: "return=representation",
        });

        // Extract the record ID from the OData-EntityId header
        const entityId = response.headers.get("OData-EntityId");
        if (entityId) {
            const match = entityId.match(/\(([0-9a-f-]+)\)/i);
            if (match) return match[1];
        }

        // Fallback: try to get ID from response body
        const result = (await response.json()) as DataverseRecord;
        const idKey = Object.keys(result).find((k) => k.endsWith("id"));
        return idKey ? String(result[idKey]) : "Record created (ID not returned)";
    }

    /**
     * Updates an existing record.
     * @param tableName - The logical collection name of the table (plural)
     * @param recordId - The GUID of the record to update
     * @param data - The fields to update as key-value pairs
     */
    async updateRecord(
        tableName: string,
        recordId: string,
        data: DataverseRecord
    ): Promise<void> {
        await this.request("PATCH", `/${tableName}(${recordId})`, data);
    }

    /**
     * Deletes a record by its ID.
     * @param tableName - The logical collection name of the table (plural)
     * @param recordId - The GUID of the record to delete
     */
    async deleteRecord(tableName: string, recordId: string): Promise<void> {
        await this.request("DELETE", `/${tableName}(${recordId})`);
    }

    // ─────────────────────────────────────────────
    // Metadata Operations
    // ─────────────────────────────────────────────

    /**
     * Gets the full metadata definition for a Dataverse entity.
     * @param logicalName - The logical name of the entity (e.g., "account")
     */
    async getEntityMetadata(logicalName: string): Promise<DataverseRecord> {
        const response = await this.request(
            "GET",
            `/EntityDefinitions(LogicalName='${logicalName}')`
        );
        return (await response.json()) as DataverseRecord;
    }

    /**
     * Gets all attributes (columns) for a Dataverse entity.
     * @param logicalName - The logical name of the entity (e.g., "account")
     */
    async getEntityAttributes(logicalName: string): Promise<DataverseRecord[]> {
        const response = await this.request(
            "GET",
            `/EntityDefinitions(LogicalName='${logicalName}')/Attributes?$select=LogicalName,DisplayName,AttributeType,RequiredLevel,IsCustomAttribute,Description`
        );
        const data = (await response.json()) as DataverseQueryResponse;
        return data.value;
    }

    /**
     * Gets a single attribute definition for a Dataverse entity.
     * @param entityLogicalName - The logical name of the entity
     * @param attributeLogicalName - The logical name of the attribute
     */
    async getEntityAttribute(
        entityLogicalName: string,
        attributeLogicalName: string
    ): Promise<DataverseRecord> {
        const response = await this.request(
            "GET",
            `/EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes(LogicalName='${attributeLogicalName}')`
        );
        return (await response.json()) as DataverseRecord;
    }

    /**
     * Gets all relationships (One-to-Many and Many-to-Many) for a Dataverse entity.
     * @param logicalName - The logical name of the entity
     */
    async getEntityRelationships(logicalName: string): Promise<DataverseRecord> {
        const response = await this.request(
            "GET",
            `/EntityDefinitions(LogicalName='${logicalName}')?$expand=OneToManyRelationships,ManyToOneRelationships,ManyToManyRelationships`
        );
        return (await response.json()) as DataverseRecord;
    }

    // ─────────────────────────────────────────────
    // Plugin Operations
    // ─────────────────────────────────────────────

    /**
     * Lists all plugin assemblies registered in the environment.
     */
    async getPluginAssemblies(): Promise<DataverseRecord[]> {
        const response = await this.request(
            "GET",
            `/pluginassemblies?$select=name,version,publickeytoken,culture,description,createdon,modifiedon,isolationmode&$filter=componentstate eq 0&$orderby=name asc`
        );
        const data = (await response.json()) as DataverseQueryResponse;
        return data.value;
    }

    /**
     * Gets plugin trace logs, optionally filtered.
     * @param options - Optional filter, top, and entity name filters
     */
    async getPluginTraceLogs(options?: {
        top?: number;
        entityName?: string;
        messageName?: string;
        correlationId?: string;
    }): Promise<DataverseRecord[]> {
        const queryParams: string[] = [
            "$select=typename,messagename,primaryentity,performanceexecutionstarttime,performanceexecutionduration,depth,exceptiondetails,messageblock,createdon,correlationid",
            "$orderby=createdon desc",
        ];

        const filters: string[] = [];
        if (options?.entityName) filters.push(`primaryentity eq '${options.entityName}'`);
        if (options?.messageName) filters.push(`messagename eq '${options.messageName}'`);
        if (options?.correlationId) filters.push(`correlationid eq '${options.correlationId}'`);
        if (filters.length > 0) queryParams.push(`$filter=${filters.join(" and ")}`);

        queryParams.push(`$top=${options?.top || 50}`);

        const response = await this.request("GET", `/plugintracelogs?${queryParams.join("&")}`);
        const data = (await response.json()) as DataverseQueryResponse;
        return data.value;
    }

    // ─────────────────────────────────────────────
    // Component Dependency Operations
    // ─────────────────────────────────────────────

    /**
     * Checks dependencies for a specific component.
     * @param objectId - The GUID of the component
     * @param componentType - The component type code (e.g., 1=Entity, 2=Attribute, 26=Plugin, 61=WebResource)
     */
    async checkComponentDependencies(
        objectId: string,
        componentType: number
    ): Promise<DataverseRecord[]> {
        const response = await this.request(
            "GET",
            `/RetrieveDependenciesForDelete(ObjectId=${objectId},ComponentType=${componentType})`
        );
        const data = (await response.json()) as DataverseQueryResponse;
        return data.value || [];
    }

    // ─────────────────────────────────────────────
    // Low-Code: Table (Entity) Creation
    // ─────────────────────────────────────────────

    /**
     * Creates a new custom entity (table) in Dataverse.
     * @param schemaName - The schema name with publisher prefix (e.g., "new_Project")
     * @param displayName - The display name (e.g., "Project")
     * @param pluralName - The plural display name (e.g., "Projects")
     * @param description - Optional description
     * @param primaryAttributeName - Schema name for primary column (e.g., "new_name")
     * @param primaryAttributeDisplayName - Display name for primary column (e.g., "Name")
     */
    async createEntity(
        schemaName: string,
        displayName: string,
        pluralName: string,
        description: string = "",
        primaryAttributeName: string = `${schemaName.split("_")[0]}_name`,
        primaryAttributeDisplayName: string = "Name"
    ): Promise<DataverseRecord> {
        const entityDef = {
            SchemaName: schemaName,
            DisplayName: {
                "@odata.type": "Microsoft.Dynamics.CRM.Label",
                LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: displayName, LanguageCode: 1033 }],
            },
            DisplayCollectionName: {
                "@odata.type": "Microsoft.Dynamics.CRM.Label",
                LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: pluralName, LanguageCode: 1033 }],
            },
            Description: {
                "@odata.type": "Microsoft.Dynamics.CRM.Label",
                LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: description, LanguageCode: 1033 }],
            },
            HasActivities: false,
            HasNotes: true,
            OwnershipType: "UserOwned",
            PrimaryNameAttribute: primaryAttributeName.toLowerCase(),
            Attributes: [
                {
                    AttributeType: "String",
                    AttributeTypeName: { Value: "StringType" },
                    SchemaName: primaryAttributeName,
                    MaxLength: 200,
                    FormatName: { Value: "Text" },
                    DisplayName: {
                        "@odata.type": "Microsoft.Dynamics.CRM.Label",
                        LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: primaryAttributeDisplayName, LanguageCode: 1033 }],
                    },
                    IsPrimaryName: true,
                    RequiredLevel: { Value: "ApplicationRequired" },
                    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
                },
            ],
            "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
        };

        const response = await this.request("POST", "/EntityDefinitions", entityDef);
        return (await response.json()) as DataverseRecord;
    }

    /**
     * Creates a new attribute (column) on an existing entity.
     * @param entityName - The logical name of the entity
     * @param attributeType - Type: "String", "Integer", "Boolean", "DateTime", "Decimal", "Money", "Memo", "Picklist"
     * @param schemaName - Schema name with prefix (e.g., "new_Budget")
     * @param displayName - Display name (e.g., "Budget")
     * @param options - Additional options based on type
     */
    async createAttribute(
        entityName: string,
        attributeType: string,
        schemaName: string,
        displayName: string,
        options?: {
            description?: string;
            requiredLevel?: string;
            maxLength?: number;
            minValue?: number;
            maxValue?: number;
            precision?: number;
        }
    ): Promise<DataverseRecord> {
        const typeMap: Record<string, { odataType: string; typeName: string; extra: Record<string, unknown> }> = {
            String: {
                odataType: "Microsoft.Dynamics.CRM.StringAttributeMetadata",
                typeName: "StringType",
                extra: { MaxLength: options?.maxLength || 200, FormatName: { Value: "Text" } },
            },
            Memo: {
                odataType: "Microsoft.Dynamics.CRM.MemoAttributeMetadata",
                typeName: "MemoType",
                extra: { MaxLength: options?.maxLength || 4000, Format: "TextArea" },
            },
            Integer: {
                odataType: "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
                typeName: "IntegerType",
                extra: { MinValue: options?.minValue ?? -2147483648, MaxValue: options?.maxValue ?? 2147483647, Format: "None" },
            },
            Boolean: {
                odataType: "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
                typeName: "BooleanType",
                extra: {
                    OptionSet: {
                        TrueOption: { Value: 1, Label: { "@odata.type": "Microsoft.Dynamics.CRM.Label", LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: "Yes", LanguageCode: 1033 }] } },
                        FalseOption: { Value: 0, Label: { "@odata.type": "Microsoft.Dynamics.CRM.Label", LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: "No", LanguageCode: 1033 }] } },
                        "@odata.type": "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata",
                    },
                },
            },
            DateTime: {
                odataType: "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata",
                typeName: "DateTimeType",
                extra: { Format: "DateOnly" },
            },
            Decimal: {
                odataType: "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
                typeName: "DecimalType",
                extra: { MinValue: options?.minValue ?? -100000000000, MaxValue: options?.maxValue ?? 100000000000, Precision: options?.precision ?? 2 },
            },
            Money: {
                odataType: "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
                typeName: "MoneyType",
                extra: { MinValue: options?.minValue ?? 0, MaxValue: options?.maxValue ?? 1000000000, Precision: options?.precision ?? 2 },
            },
        };

        const typeInfo = typeMap[attributeType];
        if (!typeInfo) {
            throw new Error(`Unsupported attribute type: ${attributeType}. Supported: ${Object.keys(typeMap).join(", ")}`);
        }

        const attrDef: Record<string, unknown> = {
            "@odata.type": typeInfo.odataType,
            SchemaName: schemaName,
            AttributeType: attributeType,
            AttributeTypeName: { Value: typeInfo.typeName },
            DisplayName: {
                "@odata.type": "Microsoft.Dynamics.CRM.Label",
                LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: displayName, LanguageCode: 1033 }],
            },
            Description: {
                "@odata.type": "Microsoft.Dynamics.CRM.Label",
                LocalizedLabels: [{ "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel", Label: options?.description || "", LanguageCode: 1033 }],
            },
            RequiredLevel: { Value: options?.requiredLevel || "None" },
            ...typeInfo.extra,
        };

        const response = await this.request(
            "POST",
            `/EntityDefinitions(LogicalName='${entityName}')/Attributes`,
            attrDef
        );
        return (await response.json()) as DataverseRecord;
    }

    // ─────────────────────────────────────────────
    // Low-Code: Views (Saved Queries)
    // ─────────────────────────────────────────────

    /**
     * Lists saved views for an entity.
     */
    async listViews(entityLogicalName: string): Promise<DataverseRecord[]> {
        const response = await this.request(
            "GET",
            `/savedqueries?$filter=returnedtypecode eq '${entityLogicalName}'&$select=name,savedqueryid,returnedtypecode,fetchxml,layoutxml,querytype,isdefault&$orderby=name`
        );
        const data = (await response.json()) as DataverseQueryResponse;
        return data.value;
    }

    /**
     * Creates a new saved view.
     */
    async createView(
        entityLogicalName: string,
        name: string,
        fetchXml: string,
        layoutXml: string,
        description: string = ""
    ): Promise<string> {
        const viewDef = {
            returnedtypecode: entityLogicalName,
            name: name,
            fetchxml: fetchXml,
            layoutxml: layoutXml,
            description: description,
            querytype: 0,
        };

        const response = await this.request("POST", "/savedqueries", viewDef, {
            Prefer: "return=representation",
        });
        const result = (await response.json()) as DataverseRecord;
        return String(result.savedqueryid || "View created");
    }

    // ─────────────────────────────────────────────
    // Low-Code: Solutions
    // ─────────────────────────────────────────────

    /**
     * Lists all solutions in the environment.
     */
    async listSolutions(): Promise<DataverseRecord[]> {
        const response = await this.request(
            "GET",
            `/solutions?$select=friendlyname,uniquename,version,ismanaged,description,createdon,modifiedon,publisherid&$filter=isvisible eq true&$orderby=friendlyname`
        );
        const data = (await response.json()) as DataverseQueryResponse;
        return data.value;
    }

    /**
     * Exports a solution as base64.
     */
    async exportSolution(solutionName: string, managed: boolean = false): Promise<string> {
        const response = await this.request("POST", "/ExportSolution", {
            SolutionName: solutionName,
            Managed: managed,
        });
        const result = (await response.json()) as DataverseRecord;
        return String(result.ExportSolutionFile || "");
    }

    /**
     * Imports a solution from base64 data.
     */
    async importSolution(base64Data: string, overwriteUnmanagedCustomizations: boolean = true): Promise<void> {
        await this.request("POST", "/ImportSolution", {
            CustomizationFile: base64Data,
            OverwriteUnmanagedCustomizations: overwriteUnmanagedCustomizations,
            PublishWorkflows: true,
        });
    }

    // ─────────────────────────────────────────────
    // Low-Code: Flows (Workflows)
    // ─────────────────────────────────────────────

    /**
     * Lists Power Automate cloud flows (category 5 = modern flow).
     */
    async listFlows(): Promise<DataverseRecord[]> {
        const response = await this.request(
            "GET",
            `/workflows?$select=name,category,statecode,statuscode,description,createdon,modifiedon,clientdata&$filter=category eq 5&$orderby=name`
        );
        const data = (await response.json()) as DataverseQueryResponse;
        return data.value;
    }

    /**
     * Creates a Power Automate flow.
     */
    async createFlow(
        name: string,
        description: string,
        clientData: string
    ): Promise<string> {
        const flowDef = {
            name: name,
            description: description,
            type: 1,
            category: 5,
            clientdata: clientData,
            statecode: 0,
            statuscode: 1,
            primaryentity: "none",
        };

        const response = await this.request("POST", "/workflows", flowDef, {
            Prefer: "return=representation",
        });
        const result = (await response.json()) as DataverseRecord;
        return String(result.workflowid || "Flow created");
    }

    /**
     * Publishes all customizations in the environment.
     * Required after creating entities, attributes, forms, or views.
     */
    async publishAllCustomizations(): Promise<void> {
        await this.request("POST", "/PublishAllXml", {});
    }
}
