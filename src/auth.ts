import { ClientSecretCredential } from "@azure/identity";

/**
 * Manages Azure AD authentication for Dataverse Web API access.
 * Uses OAuth2 client credentials flow with an Azure AD App Registration.
 */
export class DataverseAuth {
    private credential: ClientSecretCredential;
    private dataverseUrl: string;
    private scope: string;

    constructor(tenantId: string, clientId: string, clientSecret: string, dataverseUrl: string) {
        this.credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        this.dataverseUrl = dataverseUrl;
        // Dataverse API scope
        this.scope = `${dataverseUrl}/.default`;
    }

    /**
     * Gets a valid access token for Dataverse Web API calls.
     * The Azure Identity SDK handles token caching and refresh automatically.
     */
    async getAccessToken(): Promise<string> {
        const tokenResponse = await this.credential.getToken(this.scope);
        if (!tokenResponse?.token) {
            throw new Error("Failed to acquire access token for Dataverse. Check your Azure AD credentials.");
        }
        return tokenResponse.token;
    }
}
