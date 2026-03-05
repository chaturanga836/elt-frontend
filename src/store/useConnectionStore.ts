import { create } from "zustand";
import { AuthType, HttpMethod, KeyValuePair, SettingType } from "@/types/restForm";
import { FormDataDefaults, GraphQLDefaults, RawBodyDefaults, RequestBodyDefaults } from "@/models/BodyDefaults";
import { BasicAuthDefaults, BearerTokenDefaults, JWTBearerDefaults, ApiKeyDefaults, OAuth2Defaults } from "@/models/AuthDefaults";
import {
    BodyType,
    IApiKey,
    IBasicAuth,
    IBearerToken,
    IFormData,
    IGraphQL,
    IJWTBearer,
    IOAuth2,
    IRawBody,
    IRequestBodyState,
} from "@/types/connection";

interface ConnectionState {
    connectionName: string | null;
    description: string | null;
    url: string;
    method: string;
    params: KeyValuePair[];
    headers: KeyValuePair[];
    body: RequestBodyDefaults;
    selectedAuth: null | (IBasicAuth | IBearerToken | IJWTBearer | IApiKey | IOAuth2);
    // Auth State
    authType: AuthType;
    variables: KeyValuePair[];
    basicAuth: IBasicAuth;
    bearerTokenAuth: IBearerToken;
    jwtBearerAuth: IJWTBearer;
    apiKeyAuth: IApiKey;
    oauth2Auth: IOAuth2;

    //settings
    settingType: null | (SettingType) 
    // Actions
    setSettingType: (type: SettingType) => void;
    setConnection: (name: string, description: string) => void;
    setUrl: (url: string) => void;
    setMethod: (method: HttpMethod) => void;
    updateTable: (field: "params" | "headers", updatedPairs: KeyValuePair[]) => void;
    setBodyType: (type: BodyType) => void;

    updateBodyContent: (data: Partial<IFormData & IRawBody & IGraphQL>) => void;

    // Auth Actions
    updateJWTAuth: (data: Partial<IJWTBearer>) => void;
    updateBasicAuth: (data: Partial<IBasicAuth>) => void;
    updateBareTokenAuth: (data: Partial<IBearerToken>) => void;
    updateApiKeyAuth: (data: Partial<IApiKey>) => void;
    updateOAuth2Auth: (data: Partial<IOAuth2>) => void;

    setAuthType: (type: AuthType) => void;
    //updateAuthConfig: <T extends Exclude<AuthType, "none">>(type: T, data: Partial<ConnectionState["authConfig"][T]>) => void;

    updateQueryParams: (data: KeyValuePair[]) => void;
    addQueryParams: () => void;
    removeQueryParams: (uiId: string) => void;

    updateVariables: (variables: KeyValuePair[]) => void;
    addVariable: () => void;
    removeVariable: (uiId: string) => void;

    reset: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
    // --- Initial State ---
    connectionName: null,
    description: null,
    url: "",
    method: "GET",
    params: [],
    headers: [],
    body: new RequestBodyDefaults(),
    variables: [{ uiId: crypto.randomUUID(), id: null, key: "", value: "", enabled: true }],
    authType: "none",
    basicAuth: new BasicAuthDefaults(),
    bearerTokenAuth: new BearerTokenDefaults(),
    jwtBearerAuth: new JWTBearerDefaults(),
    apiKeyAuth: new ApiKeyDefaults(),
    oauth2Auth: new OAuth2Defaults(),
    selectedAuth: null,

    //settings
    settingType: null,
    // --- Actions ---
    setConnection: (name, description) => set({ connectionName: name, description }),
    setUrl: (url) => set({ url }),
    setMethod: (method) => set({ method }),

    updateTable: (field, updatedPairs) =>
        set((state) => ({
            ...state,
            [field]: updatedPairs,
        })),

    setBodyType: (type: BodyType) =>
        set((state) => {
            let initialData: IRequestBodyState["bodyData"];

            switch (type) {
                case "form-data":
                    initialData = new FormDataDefaults(); // Assuming IFormData is KeyValuePair[]
                    break;
                case "graphQL":
                    initialData = new GraphQLDefaults();
                    break;
                case "json":
                    initialData = new RawBodyDefaults();
                    break;
                case "xml":
                    initialData = new RawBodyDefaults();
                    break;
                default:
                    initialData = null; // For json, xml, text
            }

            return {
                body: {
                    activeType: type,
                    bodyData: initialData,
                },
            };
        }),

    updateBodyContent: (data: Partial<IFormData & IRawBody & IGraphQL>) =>
        set((state): Partial<ConnectionState> => {
            const currentData = state.body.bodyData;

            // 1. If currentData is an object (like GraphQL), merge it.
            // 2. If it's an array (FormData) or primitive, replace it.
            // 3. We use Array.isArray because typeof [] is also "object"
            const isMergeable = typeof currentData === "object" && currentData !== null && !Array.isArray(currentData);

            const updatedData = isMergeable ? { ...currentData, ...data } : data;

            return {
                body: {
                    ...state.body,
                    bodyData: updatedData as IRequestBodyState["bodyData"],
                },
            };
        }),

    setAuthType: (type: AuthType) =>
        set((state) => {
            let initialData: ConnectionState["selectedAuth"];

            switch (type) {
                case "basic":
                    initialData = state.basicAuth; // Use current stored basic data
                    break;
                case "bearer":
                    initialData = state.bearerTokenAuth;
                    break; // Added missing break
                case "apikey":
                    initialData = state.apiKeyAuth;
                    break;
                case "oauth2":
                    initialData = state.oauth2Auth;
                    break;
                case "none":
                default:
                    initialData = null;
            }

            return {
                authType: type,
                selectedAuth: initialData,
            };
        }),

    updateOAuth2Auth: (data: Partial<IOAuth2>) =>
        set((state) => {
            const updated = { ...state.oauth2Auth, ...data };
            return {
                oauth2Auth: updated,
                selectedAuth: state.authType === "oauth2" ? updated : state.selectedAuth,
            };
        }),
    updateBasicAuth: (data: Partial<IBasicAuth>) =>
        set((state) => {
            const updated = { ...state.basicAuth, ...data };
            return {
                basicAuth: updated,
                // Keep selectedAuth in sync if it's currently active
                selectedAuth: state.authType === "basic" ? updated : state.selectedAuth,
            };
        }),
    updateBareTokenAuth: (data: Partial<IBearerToken>) =>
        set((state) => {
            const updated = { ...state.bearerTokenAuth, ...data };
            return {
                bearerTokenAuth: updated,
                selectedAuth: state.authType === "bearer" ? updated : state.selectedAuth,
            };
        }),

    updateJWTAuth: (data: Partial<IJWTBearer>) =>
        set((state) => {
            const updated = { ...state.jwtBearerAuth, ...data };
            return {
                jwtBearerAuth: updated,
                selectedAuth: state.authType === "jwt" ? updated : state.selectedAuth,
            };
        }),

    updateApiKeyAuth: (data: Partial<IApiKey>) =>
        set((state) => {
            const updated = { ...state.apiKeyAuth, ...data };
            return {
                apiKeyAuth: updated,
                selectedAuth: state.authType === "apikey" ? updated : state.selectedAuth,
            };
        }),
    updateQueryParams(data) {
        set((state) => ({
            ...state,
            params: data,
        }));
    },

    addQueryParams: () =>
        set((state) => ({
            params: [
                ...state.params,
                {
                    uiId: crypto.randomUUID(),
                    id: null, // <--- Add this!
                    key: "",
                    value: "",
                    enabled: true,
                },
            ] as KeyValuePair[], // Adding the cast 'as KeyValuePair[]' helps TS confirm the match
        })),

    removeQueryParams: (uiId: string) =>
        set((state) => ({
            params: state.params.filter((p) => p.uiId !== uiId),
        })),
    updateVariables: (variables) => set({ variables }),
    addVariable: () =>
        set((state) => ({
            variables: [...state.variables, { uiId: crypto.randomUUID(), id: null, key: "", value: "", enabled: true }],
        })),

    removeVariable: (uiId) =>
        set((state) => ({
            variables: state.variables.filter((v) => v.uiId !== uiId),
        })),
    reset: () =>
        set({
            connectionName: null,
            description: null,
            url: "",
            method: "GET",
            params: [],
            headers: [],
            body: new RequestBodyDefaults(),
            authType: "none",
            basicAuth: new BasicAuthDefaults(),
            bearerTokenAuth: new BearerTokenDefaults(),
            jwtBearerAuth: new JWTBearerDefaults(),
            apiKeyAuth: new ApiKeyDefaults(),
            oauth2Auth: new OAuth2Defaults(),
            selectedAuth: null,
        }),

        setSettingType: (type: SettingType) => set({ settingType: type }),
}));
