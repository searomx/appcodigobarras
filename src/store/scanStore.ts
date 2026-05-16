import { create } from 'zustand';

type AppScreen = 'splash' | 'scanner' | 'details';

type ScanState = {
  productCode: string | null;
  screen: AppScreen;
  openSplash: () => void;
  openScanner: () => void;
  showDetails: (productCode: string) => void;
};

export const useScanStore = create<ScanState>(set => ({
  productCode: null,
  screen: 'splash',
  openSplash: () => set({ productCode: null, screen: 'splash' }),
  openScanner: () => set({ productCode: null, screen: 'scanner' }),
  showDetails: productCode => set({ productCode, screen: 'details' }),
}));
