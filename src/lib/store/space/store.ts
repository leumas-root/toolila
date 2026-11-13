import { create } from 'zustand';

type SpaceState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useSpaceStore = create<SpaceState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
