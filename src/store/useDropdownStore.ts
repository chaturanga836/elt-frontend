import { create } from 'zustand';
import { KeyValuePair } from '@/types/restForm';

export interface DropdownConfig {
  anchorRect: DOMRect;
  items: KeyValuePair[];
  filter: string;
  onSelect: (varKey: string) => void;
  onFilterChange?: (filter: string) => void;
}

interface DropdownState {
  open: boolean;
  config: DropdownConfig | null;
  selectedIndex: number;

  show: (config: DropdownConfig) => void;
  hide: () => void;
  updateFilter: (filter: string) => void;
  updateAnchor: (rect: DOMRect) => void;
  setSelectedIndex: (index: number) => void;
}

export const useDropdownStore = create<DropdownState>((set) => ({
  open: false,
  config: null,
  selectedIndex: 0,

  show: (config) => set({ open: true, config, selectedIndex: 0 }),
  hide: () => set({ open: false, config: null, selectedIndex: 0 }),
  updateFilter: (filter) =>
    set((state) => ({
      config: state.config ? { ...state.config, filter } : null,
      selectedIndex: 0,
    })),
  updateAnchor: (rect) =>
    set((state) => ({
      config: state.config ? { ...state.config, anchorRect: rect } : null,
    })),
  setSelectedIndex: (index) => set({ selectedIndex: index }),
}));
