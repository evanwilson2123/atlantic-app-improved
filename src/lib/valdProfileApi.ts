
interface CreateAthleteProps {
    dateOfBirth: Date;
    email: string;
    givenName: string;
    familyName: string;
    sex: string;
    syncId: string;
    externalId: string;
}

interface Profile {
    profileId: string;
    syncId: string;
    givenName: string;
    familyName: string;
    dateOfBirth: Date;
    externalId: string;
}

interface GetAthleteResponse {
    profiles: Profile[];
}

export class ValdProfileApi {
    private baseUrl: string;
    private clientId: string;
    private clientSecret: string;
    private tenantId: string;
    private accessToken: string | null = null;
    private tokenExpiry: number | null = null;

    constructor() {
        this.baseUrl = process.env.VALD_PROFILE_API_URL || '';
        this.clientId = process.env.VALD_CLIENT_ID || '';
        this.clientSecret = process.env.VALD_CLIENT_SECRET || '';
        this.tenantId = process.env.VALD_TENANT_ID || '';
    }

    async authenticate() {
        try {
            console.log('🔐 Authenticating with VALD Profile API...');
            if (!this.clientId || !this.clientSecret) {
                throw new Error('VALD_CLIENT_ID and VALD_CLIENT_SECRET environment variables are required');
            }

            const authUrl = 'https://security.valdperformance.com/connect/token';

            const response = await fetch(authUrl, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    scope: 'api.dynamo api.external'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const tokenData = await response.json();
            this.accessToken = tokenData.access_token;
            this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

            console.log('✅ VALD Profile API authenticated');
            return true;
        } catch (error) {
            console.error('❌ VALD Profile API Authentication error:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    async ensureAuthenticated() {
        if (!this.accessToken || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
            await this.authenticate();
        }
    }
    

    private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T, statusCode: number, message: string }> {
        await this.ensureAuthenticated();
        if (!this.baseUrl) {
            throw new Error('VALD_PROFILE_API_URL is not set. Please set it in your environment (e.g., https://prd-use-api-extprofiles.valdperformance.com)');
        }

        const url = new URL(endpoint, this.baseUrl).toString();
        
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'VALD-Profile-API-Client/1.0',
            'Authorization': `Bearer ${this.accessToken}`,
            ...options.headers,
        }

        try {
            console.log(`🌐 Making request to: ${url}`);

            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (response.status === 204) {
                return { data: null as T, statusCode: response.status, message: 'No content' };
            }

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`HTTP ${response.status} ${response.statusText} - ${text}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log(`✅ VALD Profile API Success: ${url}`);
                return { data, statusCode: response.status, message: 'Success' };
            }

            return { data: await response.text() as T, statusCode: response.status, message: 'Success' };
        } catch (error) {
            console.error(`❌ Request failed for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    async createAthlete({ dateOfBirth, email, givenName, familyName, sex, syncId, externalId }: CreateAthleteProps) {
        try {
            console.log("Creating athlete in VALD profile API...");
            const endpoint = `/profiles/import`;
            const body = {
                dateOfBirth: dateOfBirth.toISOString(),
                email,
                givenName,
                familyName,
                tenantId: this.tenantId,
                syncId,
                sex,
                externalId,
                isCreatedByUserOver18YearsOld: true,
                isGuardianConsentGiven: true,
                isPhotoConsentGiven: true,
            }
            const response = await this.makeRequest(endpoint, {
                method: "POST",
                body: JSON.stringify(body),
            });
            // Accept any 2xx response as success
            if (response.statusCode < 200 || response.statusCode >= 300) {
                throw new Error(`Failed to create athlete: ${response.message}`);
            }
            return response.data;
        } catch (error) {
            console.error('❌ Error creating athlete:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    async getAthlete(syncId: string) {
        try {
            console.log("Getting athlete in VALD profile API...");
            const endpoint = `/profiles?TenantId=${this.tenantId}&SyncId=${syncId}`;
            const response = await this.makeRequest(endpoint, {
                method: "GET",
            });
            if (response.statusCode < 200 || response.statusCode >= 300) {
                throw new Error(`Failed to get athlete: ${response.message}`);
            }
            const profileId = (response.data as GetAthleteResponse).profiles[0].profileId;
            return profileId;
        } catch (error) {
            console.error('❌ Error getting athlete:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
}