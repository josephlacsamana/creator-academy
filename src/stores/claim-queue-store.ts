import { create } from "zustand";
import type { EngagementType } from "@/types/database";

export interface ClaimQueueItem {
  requestId: string;
  tweetId: string;
  engagementType: EngagementType;
  username: string; // creator's @username for display
  credits: number;
}

interface ClaimQueueState {
  /** Pending claims waiting to be submitted */
  items: ClaimQueueItem[];
  /** Whether a batch claim is in progress */
  isClaiming: boolean;
  /** Per-item error messages (keyed by requestId:type) */
  errors: Record<string, string>;
  /** Whether the bar is expanded */
  isExpanded: boolean;

  /** Add an item to the queue (toggle on) */
  addItem: (item: ClaimQueueItem) => void;
  /** Remove an item from the queue (toggle off or after claim) */
  removeItem: (requestId: string, type: EngagementType) => void;
  /** Check if an item is in the queue */
  hasItem: (requestId: string, type: EngagementType) => boolean;
  /** Set claiming state */
  setIsClaiming: (value: boolean) => void;
  /** Set error for a specific item */
  setError: (requestId: string, type: EngagementType, error: string) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Clear the entire queue */
  clearQueue: () => void;
  /** Toggle expanded state */
  toggleExpanded: () => void;
}

function itemKey(requestId: string, type: EngagementType): string {
  return `${requestId}:${type}`;
}

export const useClaimQueueStore = create<ClaimQueueState>((set, get) => ({
  items: [],
  isClaiming: false,
  errors: {},
  isExpanded: false,

  addItem: (item) => {
    const existing = get().items.find(
      (i) => i.requestId === item.requestId && i.engagementType === item.engagementType
    );
    if (existing) return;
    set((state) => ({ items: [...state.items, item] }));
  },

  removeItem: (requestId, type) => {
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.requestId === requestId && i.engagementType === type)
      ),
      errors: (() => {
        const next = { ...state.errors };
        delete next[itemKey(requestId, type)];
        return next;
      })(),
    }));
  },

  hasItem: (requestId, type) => {
    return get().items.some(
      (i) => i.requestId === requestId && i.engagementType === type
    );
  },

  setIsClaiming: (value) => set({ isClaiming: value }),

  setError: (requestId, type, error) => {
    set((state) => ({
      errors: { ...state.errors, [itemKey(requestId, type)]: error },
    }));
  },

  clearErrors: () => set({ errors: {} }),

  clearQueue: () => set({ items: [], errors: {}, isExpanded: false }),

  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
}));
