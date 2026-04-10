import { create } from "zustand";
import { checkPreviouslyAllowed, connectFreighter } from "@/lib/freighter";
import { loadBalances } from "@/lib/stellar";

type WalletState = {
  // State
  address: string | null;
  xlmBalance: string | null;
  usdcBalance: string | null;
  hasUsdcTrustline: boolean;
  isConnecting: boolean;
  isLoadingBalances: boolean;
  error: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
  autoReconnect: () => Promise<void>;
  clearError: () => void;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  xlmBalance: null,
  usdcBalance: null,
  hasUsdcTrustline: false,
  isConnecting: false,
  isLoadingBalances: false,
  error: null,

  connect: async () => {
    set({ isConnecting: true, error: null });
    const result = await connectFreighter();
    if (!result.ok) {
      set({ isConnecting: false, error: result.error, address: null });
      return;
    }
    set({ address: result.value, isConnecting: false });
    // Load balances in background
    get().refreshBalances();
  },

  disconnect: () => {
    set({
      address: null,
      xlmBalance: null,
      usdcBalance: null,
      hasUsdcTrustline: false,
      error: null,
    });
  },

  refreshBalances: async () => {
    const { address } = get();
    if (!address) return;
    set({ isLoadingBalances: true });
    try {
      const balances = await loadBalances(address);
      set({
        xlmBalance: balances.xlm,
        usdcBalance: balances.usdc,
        hasUsdcTrustline: balances.hasUsdcTrustline,
        isLoadingBalances: false,
      });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoadingBalances: false,
      });
    }
  },

  autoReconnect: async () => {
    const result = await checkPreviouslyAllowed();
    if (!result.ok || !result.value) return;
    set({ address: result.value });
    get().refreshBalances();
  },

  clearError: () => set({ error: null }),
}));
