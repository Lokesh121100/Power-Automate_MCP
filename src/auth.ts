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
     * Gets a valid access token for Dataverse or other Azure resources.
     * @param scope - Optional scope override. Defaults to Dataverse scope.
     */
    async getAccessToken(scope?: string): Promise<string> {
        const tokenScope = scope || this.scope;
        const tokenResponse = await this.credential.getToken(tokenScope);
        if (!tokenResponse?.token) {
            throw new Error(`Failed to acquire access token for scope ${tokenScope}. Check your credentials.`);
        }
        return tokenResponse.token;
    }
}
