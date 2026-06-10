import { create } from 'zustand';

type AppScreen = 'login' | 'splash' | 'scanner' | 'details';

type ScanState = {
  authenticatedUserName: string | null;
  lastLogoutAt: number | null;
  lastLogoutReason: string | null;
  lastLogoutUserName: string | null;
  productCode: string | null;
  screen: AppScreen;
  setAuthenticatedUser: (name: string) => void;
  logout: (reason?: string) => void;
  openSplash: () => void;
  openScanner: () => void;
  showDetails: (productCode: string) => void;
};

export const useScanStore = create<ScanState>(set => ({
  authenticatedUserName: null,
  lastLogoutAt: null,
  lastLogoutReason: null,
  lastLogoutUserName: null,
  productCode: null,
  screen: 'login',
  setAuthenticatedUser: name =>
    set({
      authenticatedUserName: name,
      lastLogoutAt: null,
      lastLogoutReason: null,
      lastLogoutUserName: null,
    }),
  logout: (reason = 'manual') =>
    set(state => ({
      authenticatedUserName: null,
      productCode: null,
      screen: 'login',
      lastLogoutAt: Date.now(),
      lastLogoutReason: reason,
      lastLogoutUserName: state.authenticatedUserName,
    })),
  openSplash: () => set({ productCode: null, screen: 'splash' }),
  openScanner: () => set({ productCode: null, screen: 'scanner' }),
  showDetails: productCode => set({ productCode, screen: 'details' }),
}));
