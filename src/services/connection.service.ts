import { ConnectionCategory } from "@/types/connection";
import { extractRelativePath, stripQuery } from "@/lib/urlSync";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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

const DEFAULT_TENANT = "trial_user_001";

export const connectionService = {
    preparePayload: (store: any) => {
        const getAuthConfig = () => {
            switch (store.authType) {
                case "basic":
                    return store.basicAuth;
                case "bearer":
                    return { token: store.bearerTokenAuth?.token };
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

        const urlBase = stripQuery(store.url || "");
        const endpointPath = store.groupId ? extractRelativePath(urlBase, store.groupBaseUrl) : "";

        const payload: Record<string, unknown> = {
            name: store.connectionName || "Untitled Connection",
            url: urlBase,
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

        if (store.groupId) {
            payload.group_id = store.groupId;
            payload.path = endpointPath;
        }

        return payload;
    },

    testConnection: async (storeData: any, tenantId: string = DEFAULT_TENANT) => {
        const url = `${getBaseUrl()}/rest-api-connections/test-connection?tenant_id=${tenantId}`;
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

    getRestConnection: async (connectionId: number, tenantId: string = DEFAULT_TENANT) => {
        const url = `${getBaseUrl()}/rest-api-connections/connection/${connectionId}?tenant_id=${tenantId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load connection");
        return response.json();
    },

    getUnifiedConnections: async (tenantId: string = DEFAULT_TENANT) => {
        const url = `${getBaseUrl()}/connections/unified/list?tenant_id=${tenantId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch connections");
        return response.json();
    },

    getCategories: async (): Promise<{ data: ConnectionCategory[] }> => {
        const url = `${getBaseUrl()}/connection-types/categories`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        return {
            data: data.map((c: any) => ({
                id: String(c.id),
                name: c.name,
                description: c.description,
                icon: c.icon,
            })),
        };
    },

    getPrototypes: async (categoryId: number) => {
        const url = `${getBaseUrl()}/connection-types/categories/${categoryId}/prototypes`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch prototypes");
        return response.json();
    },

    getPrototypeSchema: async (categoryId: number, prototypeId: string) => {
        const url = `${getBaseUrl()}/connection-types/categories/${categoryId}/prototypes/${prototypeId}/schema`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch schema");
        return response.json();
    },

    createGenericConnection: async (payload: any, tenantId: string = DEFAULT_TENANT) => {
        const url = `${getBaseUrl()}/connections/create?tenant_id=${tenantId}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to create connection");
        }
        return response.json();
    },

    updateGenericConnection: async (
        connectionId: number,
        payload: any,
        tenantId: string = DEFAULT_TENANT,
    ) => {
        const url = `${getBaseUrl()}/connections/update/${connectionId}?tenant_id=${tenantId}`;
        const response = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to update connection");
        }
        return response.json();
    },

    getGenericConnection: async (connectionId: number, tenantId: string = DEFAULT_TENANT) => {
        const url = `${getBaseUrl()}/connections/${connectionId}?tenant_id=${tenantId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load connection");
        return response.json();
    },

    deleteGenericConnection: async (connectionId: number, tenantId: string = DEFAULT_TENANT) => {
        const url = `${getBaseUrl()}/connections/${connectionId}?tenant_id=${tenantId}`;
        const response = await fetch(url, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete connection");
        return response.json();
    },

    testGenericConnection: async (payload: any) => {
        const url = `${getBaseUrl()}/connections/test`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Test failed");
        }
        return response.json();
    },

    registerConnection: async (payload: any) => {
        const url = `${getBaseUrl()}/dev/register`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to register provider");
        return response.json();
    },

    getProviders: async () => {
        const url = `${getBaseUrl()}/dev/providers`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch providers");
        return response.json();
    },

    getIntegrationProviders: async () => {
        const url = `${getBaseUrl()}/rest-api-connections/integration-catalog/providers`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load integration catalog");
        return response.json();
    },

    getIntegrationTemplates: async (providerKey: string) => {
        const url = `${getBaseUrl()}/rest-api-connections/integration-catalog/providers/${providerKey}/templates`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load templates");
        return response.json();
    },

    listRestGroups: async (tenantId: string = DEFAULT_TENANT) => {
        const url = `${getBaseUrl()}/rest-api-connections/groups?tenant_id=${tenantId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to list groups");
        return response.json();
    },

    getRestGroup: async (groupId: number, tenantId: string = DEFAULT_TENANT) => {
        const url = `${getBaseUrl()}/rest-api-connections/groups/${groupId}?tenant_id=${tenantId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load group");
        return response.json();
    },

    createRestGroup: async (payload: Record<string, unknown>, tenantId: string = DEFAULT_TENANT) => {
        const url = `${getBaseUrl()}/rest-api-connections/groups?tenant_id=${tenantId}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to create group");
        }
        return response.json();
    },

    updateRestGroup: async (groupId: number, payload: Record<string, unknown>, tenantId: string = DEFAULT_TENANT) => {
        const url = `${getBaseUrl()}/rest-api-connections/groups/${groupId}?tenant_id=${tenantId}`;
        const response = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to update group");
        }
        return response.json();
    },

    deleteRestGroup: async (groupId: number, tenantId: string = DEFAULT_TENANT) => {
        const url = `${getBaseUrl()}/rest-api-connections/groups/${groupId}?tenant_id=${tenantId}`;
        const response = await fetch(url, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete group");
        return response.json();
    },
};
