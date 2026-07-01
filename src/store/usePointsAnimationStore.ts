import { create } from 'zustand';

export type PointsAddedEvent = {
  id: string;
  amount: number;
  targetTotal?: number;
};

type PointsAnimationState = {
  pointsAddedEvent: PointsAddedEvent | null;
  triggerPointsAdded: (amount: number, targetTotal?: number) => void;
  clearPointsAddedEvent: (id: string) => void;
};

export const usePointsAnimationStore = create<PointsAnimationState>((set) => ({
  pointsAddedEvent: null,
  triggerPointsAdded: (amount, targetTotal) => {
    const id = Math.random().toString(36).substring(2, 9);
    set({ pointsAddedEvent: { id, amount, targetTotal } });
  },
  clearPointsAddedEvent: (id) => {
    set((state) => (state.pointsAddedEvent?.id === id ? { pointsAddedEvent: null } : state));
  }
}));
