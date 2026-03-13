import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow, getNextWindow } from "@/lib/window-engine";
import type { WindowInfo } from "@/types/database";

/**
 * React hook that provides real-time window state.
 * Re-computes every second for countdown timers.
 */
export function useCurrentWindow(): {
  window: WindowInfo | null;
  nextWindow: { windowNumber: number; startsAt: Date } | null;
  isLoading: boolean;
} {
  const compute = useCallback(() => {
    const now = new Date();
    return {
      window: getCurrentWindow(now),
      nextWindow: getNextWindow(now),
    };
  }, []);

  const [state, setState] = useState(compute);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial computation
    setState(compute());
    setIsLoading(false);

    // Update every second for countdown accuracy
    const interval = setInterval(() => {
      setState(compute());
    }, 1000);

    return () => clearInterval(interval);
  }, [compute]);

  return {
    window: state.window,
    nextWindow: state.nextWindow,
    isLoading,
  };
}
