// store/useApiStore.ts
import { create } from "zustand";
import { useConnectionStore } from "./useConnectionStore";
import { connectionService } from "@/services/connection.service";
import { getApiErrorMessage } from "@/lib/formatApiError";

interface ApiState {
    isSaving: boolean;
    lastSaved: Date | null;
    error: string | null;

    // THE BRIDGE ACTION
    saveCurrentConnection: (workspaceId: number) => Promise<void>;
    saveSourceProvider: (providerData: any) => Promise<void>;
}

export const useApiStore = create<ApiState>((set) => ({
    isSaving: false,
    lastSaved: null,
    error: null,

    saveCurrentConnection: async (workspaceId: number) => {
        // 1. Grab the latest data from the OTHER store
        const connectionData = useConnectionStore.getState();

        set({ isSaving: true, error: null });
        console.log("Raw Store Data:", connectionData);
        try {
            // 2. Call the service
            const result = await connectionService.saveConnection(connectionData, workspaceId, connectionData.id ?? undefined);

            // 3. Update the Connection Store with the new ID from Postgres
            if (!connectionData.id) {
                useConnectionStore.getState().setId(result.id);
            }

            set({ isSaving: false, lastSaved: new Date() });
        } catch (err: unknown) {
            const msg = getApiErrorMessage(err, 'Failed to save connection');
            set({ isSaving: false, error: msg });
            throw new Error(msg);
        }
    },

    saveSourceProvider: async (providerData: any) => {
        set({ isSaving: true, error: null }); 
        try {
            await connectionService.registerConnection(providerData);
            set({ isSaving: false });
        } catch (err: any) {
            set({ isSaving: false, error: err.message });
            throw err;
        }
    },
}));
