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
}
