import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useClaimQueueStore, type ClaimQueueItem } from "@/stores/claim-queue-store";
import { useClaimEngagementV2 } from "@/hooks/use-claim-engagement-v2";
import { useAuthStore } from "@/stores/auth-store";
import { verifyEngagement } from "@/lib/twitter-verify";
import type { EngagementType } from "@/types/database";

const TYPE_ICON: Record<EngagementType, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  repost: Repeat2,
  bookmark: Bookmark,
};

const TYPE_CHIP_STYLE: Record<EngagementType, string> = {
  like: "bg-rose-100 text-rose-700 border-rose-200",
  comment: "bg-blue-100 text-blue-700 border-blue-200",
  repost: "bg-green-100 text-green-700 border-green-200",
  bookmark: "bg-amber-100 text-amber-700 border-amber-200",
};

export function FloatingClaimBar() {
  const {
    items,
    isClaiming,
    errors,
    isExpanded,
    removeItem,
    setIsClaiming,
    setError,
    clearErrors,
    clearQueue,
    toggleExpanded,
  } = useClaimQueueStore();

  const claimMutation = useClaimEngagementV2();
  const currentUser = useAuthStore((s) => s.user);
  const [claimResults, setClaimResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  if (items.length === 0) return null;

  const totalCredits = items.reduce((sum, item) => sum + item.credits, 0);

  /** Batch verify + claim all items */
  const handleClaimAll = async () => {
    if (isClaiming || !currentUser) return;
    setIsClaiming(true);
    clearErrors();
    setClaimResults({ success: 0, failed: 0 });

    let success = 0;
    let failed = 0;

    // Process all items — snapshot the current items array
    const currentItems = [...items];

    for (const item of currentItems) {
      try {
        // Step 1: Verify (comments + reposts use API, likes + bookmarks are instant)
        const result = await verifyEngagement(
          item.tweetId,
          currentUser.x_username,
          item.engagementType
        );

        if (!result.verified) {
          const reason =
            item.engagementType === "comment"
              ? "Comment not found on the tweet"
              : item.engagementType === "repost"
                ? "Repost not found on the tweet"
                : result.reason ?? "Verification failed";
          setError(item.requestId, item.engagementType, reason);
          failed++;
          continue;
        }

        // Step 2: Claim via RPC
        await claimMutation.mutateAsync({
          tweetRequestId: item.requestId,
          engagementType: item.engagementType,
        });

        // Remove from queue on success
        removeItem(item.requestId, item.engagementType);
        success++;
      } catch (err: any) {
        setError(
          item.requestId,
          item.engagementType,
          err.message || "Claim failed"
        );
        failed++;
      }
    }

    setClaimResults({ success, failed });
    setIsClaiming(false);
  };

  /** Claim a single item */
  const handleClaimOne = async (item: ClaimQueueItem) => {
    if (isClaiming || !currentUser) return;
    setIsClaiming(true);
    clearErrors();

    try {
      const result = await verifyEngagement(
        item.tweetId,
        currentUser.x_username,
        item.engagementType
      );

      if (!result.verified) {
        const reason =
          item.engagementType === "comment"
            ? "Comment not found on the tweet"
            : item.engagementType === "repost"
              ? "Repost not found on the tweet"
              : result.reason ?? "Verification failed";
        setError(item.requestId, item.engagementType, reason);
        setIsClaiming(false);
        return;
      }

      await claimMutation.mutateAsync({
        tweetRequestId: item.requestId,
        engagementType: item.engagementType,
      });

      removeItem(item.requestId, item.engagementType);
    } catch (err: any) {
      setError(
        item.requestId,
        item.engagementType,
        err.message || "Claim failed"
      );
    } finally {
      setIsClaiming(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 lg:left-64"
      >
        {/* Mobile: account for bottom nav */}
        <div className="mx-auto max-w-5xl px-4 pb-[calc(env(safe-area-inset-bottom)+4rem)] lg:pb-4">
          <div className="rounded-t-2xl border border-b-0 border-primary-300 bg-card shadow-2xl lg:rounded-2xl lg:border-b">
            {/* Collapsed bar */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Status dot */}
              <span className="relative flex h-3 w-3 shrink-0">
                {isClaiming && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                )}
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary-400" />
              </span>

              {/* Count + credits */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {isClaiming ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Claiming...
                    </span>
                  ) : (
                    <>
                      {items.length} ready to claim
                      <span className="ml-1.5 text-primary-500 font-bold">
                        +{totalCredits} credits
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Expand/collapse toggle */}
              <button
                onClick={toggleExpanded}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>

              {/* Claim All button */}
              <button
                onClick={handleClaimAll}
                disabled={isClaiming}
                className="rounded-xl bg-primary-400 px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isClaiming ? "Claiming..." : "Claim All"}
              </button>
            </div>

            {/* Expanded view: individual chips */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border px-4 py-3 space-y-2">
                    {/* Chips */}
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence mode="popLayout">
                        {items.map((item) => {
                          const Icon = TYPE_ICON[item.engagementType];
                          const chipStyle = TYPE_CHIP_STYLE[item.engagementType];
                          const key = `${item.requestId}:${item.engagementType}`;
                          const itemError = errors[key];

                          return (
                            <motion.div
                              key={key}
                              layout
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="flex flex-col gap-1"
                            >
                              <button
                                onClick={() => handleClaimOne(item)}
                                disabled={isClaiming}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${chipStyle}`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                <span>@{item.username}</span>
                                <span className="font-bold">+{item.credits}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isClaiming) removeItem(item.requestId, item.engagementType);
                                  }}
                                  className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </button>
                              {itemError && (
                                <span className="flex items-center gap-1 text-[10px] text-red-500">
                                  <AlertCircle className="h-3 w-3" />
                                  {itemError}
                                </span>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    {/* Result summary after claiming */}
                    {claimResults.success > 0 && !isClaiming && (
                      <p className="text-xs text-green-600">
                        {claimResults.success} claimed successfully
                        {claimResults.failed > 0 && (
                          <span className="text-red-500">
                            , {claimResults.failed} failed
                          </span>
                        )}
                      </p>
                    )}

                    {/* Clear all */}
                    {hasErrors && !isClaiming && (
                      <button
                        onClick={clearQueue}
                        className="text-xs text-muted-foreground underline hover:text-foreground"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
