import { DataverseAuth } from "./auth.js";

/**
 * Client for Microsoft Graph API to access SharePoint and other Microsoft 365 resources.
 */
export class GraphClient {
    private auth: DataverseAuth;
    private baseUrl: string = "https://graph.microsoft.com/v1.0";

    constructor(auth: DataverseAuth) {
        this.auth = auth;
    }

    /**
     * Makes an authenticated HTTP request to the Microsoft Graph API.
     */
    private async request(method: string, path: string, body?: unknown): Promise<Response> {
        // Request token for Graph API
        const token = await this.auth.getAccessToken("https://graph.microsoft.com/.default");
        const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;

        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        };

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Graph API error ${response.status} ${response.statusText}: ${errorBody}`);
        }

        return response;
    }

    /**
     * Lists SharePoint sites.
     * @param search - Optional search query to filter sites.
     */
    async listSites(search?: string): Promise<any> {
        const query = search ? `?search=${encodeURIComponent(search)}` : "";
        const response = await this.request("GET", `/sites${query}`);
        return await response.json();
    }

    /**
     * Lists document libraries (Drives) for a specific site.
     * @param siteId - The ID of the SharePoint site.
     */
    async listDrives(siteId: string): Promise<any> {
        const response = await this.request("GET", `/sites/${siteId}/drives`);
        return await response.json();
    }

    /**
     * Lists items (files/folders) in a specific drive (document library).
     * @param driveId - The ID of the drive.
     * @param itemId - Optional ID of a folder to list children of. If omitted, lists root.
     */
    async listDriveItems(driveId: string, itemId?: string): Promise<any> {
        const path = itemId
            ? `/drives/${driveId}/items/${itemId}/children`
            : `/drives/${driveId}/root/children`;

        const response = await this.request("GET", path);
        return await response.json();
    }

    // ═════════════════════════════════════════════
    // SHAREPOINT LIST MANAGEMENT
    // ═════════════════════════════════════════════

    /**
     * Lists all SharePoint lists in a site.
     */
    async listLists(siteId: string): Promise<any> {
        const response = await this.request("GET", `/sites/${siteId}/lists`);
        return await response.json();
    }

    /**
     * Creates a new SharePoint list with columns.
     */
    async createList(siteId: string, displayName: string, columns: Array<{ name: string; type: string; description?: string }>): Promise<any> {
        const columnDefs = columns.map((col) => {
            const base: Record<string, unknown> = {
                name: col.name,
                description: col.description || "",
                enforceUniqueValues: false,
            };
            switch (col.type.toLowerCase()) {
                case "text":
                    base.text = { allowMultipleLines: false, maxLength: 255 };
                    break;
                case "multiline":
                    base.text = { allowMultipleLines: true, maxLength: 5000 };
                    break;
                case "number":
                    base.number = {};
                    break;
                case "datetime":
                    base.dateTime = { format: "dateOnly" };
                    break;
                case "boolean":
                    base.boolean = {};
                    break;
                case "choice":
                    base.choice = { choices: ["Option 1", "Option 2", "Option 3"] };
                    break;
                default:
                    base.text = { allowMultipleLines: false, maxLength: 255 };
            }
            return base;
        });

        const body = {
            displayName,
            list: { template: "genericList" },
            columns: columnDefs,
        };

        const response = await this.request("POST", `/sites/${siteId}/lists`, body);
        return await response.json();
    }

    /**
     * Gets items from a SharePoint list.
     */
    async getListItems(siteId: string, listId: string, top?: number): Promise<any> {
        const query = top ? `?$top=${top}&$expand=fields` : "?$expand=fields";
        const response = await this.request("GET", `/sites/${siteId}/lists/${listId}/items${query}`);
        return await response.json();
    }

    /**
     * Creates a new item in a SharePoint list.
     */
    async createListItem(siteId: string, listId: string, fields: Record<string, unknown>): Promise<any> {
        const body = { fields };
        const response = await this.request("POST", `/sites/${siteId}/lists/${listId}/items`, body);
        return await response.json();
    }

    /**
     * Updates an item in a SharePoint list.
     */
    async updateListItem(siteId: string, listId: string, itemId: string, fields: Record<string, unknown>): Promise<any> {
        const response = await this.request("PATCH", `/sites/${siteId}/lists/${listId}/items/${itemId}/fields`, fields);
        return await response.json();
    }

    /**
     * Deletes an item from a SharePoint list.
     */
    async deleteListItem(siteId: string, listId: string, itemId: string): Promise<void> {
        await this.request("DELETE", `/sites/${siteId}/lists/${listId}/items/${itemId}`);
    }
}
