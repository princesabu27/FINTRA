import { create } from "zustand";

type TxTab = "expense" | "income";

interface TransactionSheetStore {
  isOpen: boolean;
  defaultTab: TxTab;
  open: (tab?: TxTab) => void;
  close: () => void;
}

export const useTransactionSheet = create<TransactionSheetStore>((set) => ({
  isOpen: false,
  defaultTab: "expense",
  open: (tab = "expense") => set({ isOpen: true, defaultTab: tab }),
  close: () => set({ isOpen: false }),
}));
