import { ConnectionCategory } from "@/types/connection";
import { extractRelativePath, stripQuery } from "@/lib/urlSync";
import { generateId } from "@/lib/generateId";
import api from "./api";

type KvRow = { uiId?: string; id?: number | null; key?: string; value?: string; enabled?: boolean };

function trimKvRow(r: KvRow): KvRow {
    return {
        ...r,
        key: typeof r.key === "string" ? r.key.trim() : r.key,
        value: typeof r.value === "string" ? r.value.trim() : r.value,
        uiId: r.uiId || generateId(),
        enabled: r.enabled ?? true,
    };
}

function withUiIds(rows: KvRow[]): KvRow[] {
    return rows.map(trimKvRow).filter((r) => r.key);
}

/** Prefer JSON editor `content`; fall back to flat template fields (legacy scraper body). */
function normalizeJsonBody(bodyData: Record<string, unknown>): Record<string, unknown> {
    if (!bodyData || typeof bodyData !== "object") return {};
    const { content, ...rest } = bodyData;
    if (typeof content === "string" && content.trim()) {
        try {
            return JSON.parse(content) as Record<string, unknown>;
        } catch {
            return { content };
        }
    }
    if (rest.url != null || rest.extract != null) {
        return rest;
    }
    return bodyData;
}

function wsParams(workspaceId: number) {
    return { params: { workspace_id: workspaceId } };
}

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

        const bodyMethod = BODY_METHOD_MAP[store.body?.activeType?.toLowerCase()] || 1;
        const rawBody = (store.body?.bodyData || {}) as Record<string, unknown>;
        const body =
            bodyMethod === 3 ? normalizeJsonBody(rawBody) : rawBody;

        const payload: Record<string, unknown> = {
            name: store.connectionName || "Untitled Connection",
            url: urlBase,
            method: METHOD_MAP[store.method?.toUpperCase()] || 1,
            auth_type: AUTH_MAP[store.authType?.toLowerCase()] || 0,
            body_method: bodyMethod,
            body,
            headers: withUiIds(store.headers.filter((h: KvRow) => String(h.key ?? "").trim())),
            params: withUiIds(store.params.filter((p: KvRow) => String(p.key ?? "").trim())),
            variables: withUiIds(store.variables.filter((v: KvRow) => String(v.key ?? "").trim())),
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

    testConnection: async (storeData: any, workspaceId: number) => {
        const response = await api.post(
            "/rest-api-connections/test-connection",
            connectionService.preparePayload(storeData),
            wsParams(workspaceId),
        );
        return response.data;
    },

    saveConnection: async (storeData: any, workspaceId: number, connectionId?: number) => {
        const payload = connectionService.preparePayload(storeData);
        const config = wsParams(workspaceId);
        if (connectionId) {
            const response = await api.put(
                `/rest-api-connections/update_rest_api_connection/${connectionId}`,
                payload,
                config,
            );
            return response.data;
        }
        const response = await api.post(
            "/rest-api-connections/create_rest_api_connection",
            payload,
            config,
        );
        return response.data;
    },

    getConnections: async (workspaceId: number) => {
        const response = await api.get("/rest-api-connections/list", wsParams(workspaceId));
        return response.data;
    },

    getRestConnection: async (connectionId: number, workspaceId: number) => {
        const response = await api.get(
            `/rest-api-connections/connection/${connectionId}`,
            wsParams(workspaceId),
        );
        return response.data;
    },

    getUnifiedConnections: async (workspaceId: number) => {
        const response = await api.get("/connections/unified/list", wsParams(workspaceId));
        return response.data;
    },

    getCategories: async (): Promise<{ data: ConnectionCategory[] }> => {
        const response = await api.get("/connection-types/categories");
        const data = response.data;
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
        const response = await api.get(`/connection-types/categories/${categoryId}/prototypes`);
        return response.data;
    },

    getPrototypeSchema: async (categoryId: number, prototypeId: string) => {
        const response = await api.get(
            `/connection-types/categories/${categoryId}/prototypes/${prototypeId}/schema`,
        );
        return response.data;
    },

    createGenericConnection: async (payload: any, workspaceId: number) => {
        const response = await api.post("/connections/create", payload, wsParams(workspaceId));
        return response.data;
    },

    updateGenericConnection: async (
        connectionId: number,
        payload: any,
        workspaceId: number,
    ) => {
        const response = await api.put(
            `/connections/update/${connectionId}`,
            payload,
            wsParams(workspaceId),
        );
        return response.data;
    },

    getGenericConnection: async (connectionId: number, workspaceId: number) => {
        const response = await api.get(
            `/connections/${connectionId}`,
            wsParams(workspaceId),
        );
        return response.data;
    },

    deleteGenericConnection: async (connectionId: number, workspaceId: number) => {
        const response = await api.delete(
            `/connections/${connectionId}`,
            wsParams(workspaceId),
        );
        return response.data;
    },

    testGenericConnection: async (payload: any, workspaceId: number) => {
        const response = await api.post("/connections/test", payload, wsParams(workspaceId));
        return response.data;
    },

    registerConnection: async (payload: any) => {
        const response = await api.post("/dev/register", payload);
        return response.data;
    },

    getProviders: async () => {
        const response = await api.get("/dev/providers");
        return response.data;
    },

    getIntegrationProviders: async (workspaceId: number) => {
        const response = await api.get(
            "/rest-api-connections/integration-catalog/providers",
            wsParams(workspaceId),
        );
        return response.data;
    },

    getIntegrationTemplates: async (providerKey: string, workspaceId: number) => {
        const response = await api.get(
            `/rest-api-connections/integration-catalog/providers/${providerKey}/templates`,
            wsParams(workspaceId),
        );
        return response.data;
    },

    listRestGroups: async (workspaceId: number) => {
        const response = await api.get("/rest-api-connections/groups", wsParams(workspaceId));
        return response.data;
    },

    getRestGroup: async (groupId: number, workspaceId: number) => {
        const response = await api.get(
            `/rest-api-connections/groups/${groupId}`,
            wsParams(workspaceId),
        );
        return response.data;
    },

    createRestGroup: async (payload: Record<string, unknown>, workspaceId: number) => {
        const response = await api.post(
            "/rest-api-connections/groups",
            payload,
            wsParams(workspaceId),
        );
        return response.data;
    },

    updateRestGroup: async (
        groupId: number,
        payload: Record<string, unknown>,
        workspaceId: number,
    ) => {
        const response = await api.put(
            `/rest-api-connections/groups/${groupId}`,
            payload,
            wsParams(workspaceId),
        );
        return response.data;
    },

    deleteRestGroup: async (groupId: number, workspaceId: number) => {
        const response = await api.delete(
            `/rest-api-connections/groups/${groupId}`,
            wsParams(workspaceId),
        );
        return response.data;
    },

    getAuthCapabilities: async () => {
        const response = await api.get("/rest-api-connections/auth-capabilities");
        return response.data;
    },

    getConnectionRuntime: async (connectionId: number, workspaceId: number) => {
        const response = await api.get(
            `/rest-api-connections/connection/${connectionId}/runtime`,
            wsParams(workspaceId),
        );
        return response.data;
    },
};
