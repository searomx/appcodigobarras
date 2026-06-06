import { create } from 'zustand';

type AppScreen = 'login' | 'splash' | 'scanner' | 'details';

type ScanState = {
  authenticatedUserName: string | null;
  productCode: string | null;
  screen: AppScreen;
  setAuthenticatedUser: (name: string) => void;
  openSplash: () => void;
  openScanner: () => void;
  showDetails: (productCode: string) => void;
};

export const useScanStore = create<ScanState>(set => ({
  authenticatedUserName: null,
  productCode: null,
  screen: 'login',
  setAuthenticatedUser: name => set({ authenticatedUserName: name }),
  openSplash: () => set({ productCode: null, screen: 'splash' }),
  openScanner: () => set({ productCode: null, screen: 'scanner' }),
  showDetails: productCode => set({ productCode, screen: 'details' }),
}));
