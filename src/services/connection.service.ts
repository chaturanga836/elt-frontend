const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// Helper to ensure we always have the correct base path
const getBaseUrl = () => (API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`);

const METHOD_MAP: Record<string, number> = {
    GET: 1,
    POST: 2,
    PUT: 3,
    DELETE: 4,
    PATCH: 5,
};

const AUTH_MAP: Record<string, number> = {
    none: 0,
    basic: 1,
    bearer: 2,
    jwt: 3,
    apikey: 4,
    oauth2: 5,
};

const BODY_METHOD_MAP: Record<string, number> = {
    none: 1,
    "form-data": 2,
    json: 3,
    xml: 4,
    graphql: 5,
};

export const connectionService = {
    preparePayload: (store: any) => {
        const getAuthConfig = () => {
            switch (store.authType) {
                case "basic":
                    return store.basicAuth;
                case "bearer":
                    return { token: store.bearerTokenAuth?.token }; // Simplified for testable format
                case "apikey":
                    return store.apiKeyAuth;
                case "oauth2":
                    return store.oauth2Auth;
                case "jwt":
                    return store.jwtBearerAuth;
                default:
                    return {};
            }
        };

        return {
            name: store.connectionName || "Untitled Connection",
            url: store.url,
            method: METHOD_MAP[store.method?.toUpperCase()] || 1,
            auth_type: AUTH_MAP[store.authType?.toLowerCase()] || 0,
            body_method: BODY_METHOD_MAP[store.body?.activeType?.toLowerCase()] || 1,
            body: store.body?.bodyData || {},
            headers: store.headers.filter((h: any) => h.key),
            params: store.params.filter((p: any) => p.key),
            variables: store.variables.filter((v: any) => v.key),
            pagination: store.pagination || { strategy: "none", config: {} },
            auth_config: getAuthConfig(),
            fetch_settings: store.fetchSettings || { retries: 3, timeout: 30 },
        };
    },

    // --- NEW TEST CONNECTION ROUTE ---
    testConnection: async (storeData: any) => {
        const url = `${getBaseUrl()}/rest-api-connections/test-connection`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(connectionService.preparePayload(storeData)),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Test request failed");
        }

        return response.json();
    },

    saveConnection: async (storeData: any, tenantId: string, connectionId?: number) => {
        const isUpdate = !!connectionId;
        const base = getBaseUrl();
        const url = isUpdate
            ? `${base}/rest-api-connections/update_rest_api_connection/${connectionId}?tenant_id=${tenantId}`
            : `${base}/rest-api-connections/create_rest_api_connection?tenant_id=${tenantId}`;

        const response = await fetch(url, {
            method: isUpdate ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(connectionService.preparePayload(storeData)),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to save connection");
        }

        return response.json();
    },

    getConnections: async (tenantId: string) => {
        const url = `${getBaseUrl()}/rest-api-connections/list?tenant_id=${tenantId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch connections");
        return response.json();
    },

    // dev
    registerConnection: async (payload: any) => {
        const url = `${getBaseUrl()}/dev/register`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        
        if (!response.ok) throw new Error('Failed to fetch connections');
        return response.json();
    },

    getProviders: async () => {
        const url = `${getBaseUrl()}/dev/providers`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch connections");
        return response.json();
    },
};
