// store/useApiStore.ts
import { create } from "zustand";
import { useConnectionStore } from "./useConnectionStore";
import { connectionService } from "@/services/connection.service";

interface ApiState {
    isSaving: boolean;
    lastSaved: Date | null;
    error: string | null;

    // THE BRIDGE ACTION
    saveCurrentConnection: (tenantId: string) => Promise<void>;
    saveSourceProvider: (providerData: any) => Promise<void>;
}

export const useApiStore = create<ApiState>((set) => ({
    isSaving: false,
    lastSaved: null,
    error: null,

    saveCurrentConnection: async (tenantId: string) => {
        // 1. Grab the latest data from the OTHER store
        const connectionData = useConnectionStore.getState();

        set({ isSaving: true, error: null });
        console.log("Raw Store Data:", connectionData);
        try {
            // 2. Call the service
            const result = await connectionService.saveConnection(connectionData, tenantId, connectionData.id ?? undefined);

            // 3. Update the Connection Store with the new ID from Postgres
            if (!connectionData.id) {
                useConnectionStore.getState().setId(result.id);
            }

            set({ isSaving: false, lastSaved: new Date() });
        } catch (err: any) {
            set({ isSaving: false, error: err.message });
            throw err; // Let the UI handle the notification
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
