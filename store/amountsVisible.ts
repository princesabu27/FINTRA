import { create } from "zustand";

interface AmountsVisibleStore {
  visible: boolean;
  toggle: () => void;
}

export const useAmountsVisible = create<AmountsVisibleStore>((set) => ({
  visible: false,
  toggle: () => set((s) => ({ visible: !s.visible })),
}));
