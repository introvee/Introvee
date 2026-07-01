import { create } from 'zustand';

export type PointAnimation = {
  id: string;
  amount: number;
  startX: number;
  startY: number;
};

type PointsAnimationState = {
  animations: PointAnimation[];
  triggerAnimation: (amount: number, startX: number, startY: number) => void;
  removeAnimation: (id: string) => void;
  badgePopTrigger: number;
  triggerBadgePop: () => void;
};

export const usePointsAnimationStore = create<PointsAnimationState>((set) => ({
  animations: [],
  triggerAnimation: (amount, startX, startY) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      animations: [...state.animations, { id, amount, startX, startY }]
    }));
  },
  removeAnimation: (id) =>
    set((state) => ({
      animations: state.animations.filter((a) => a.id !== id)
    })),
  badgePopTrigger: 0,
  triggerBadgePop: () => set((state) => ({ badgePopTrigger: state.badgePopTrigger + 1 }))
}));
