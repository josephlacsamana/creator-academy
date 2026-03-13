import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { useSubmitTweetV2 } from "@/hooks/use-submit-tweet-v2";
import { useCurrentWindow } from "@/hooks/use-current-window";
import { formatCountdown } from "@/lib/window-engine";
import { extractTweetId, formatCredits } from "@/lib/utils";
import {
  Send,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
  Loader2,
  ExternalLink,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  Info,
} from "lucide-react";

/* ───────────────────────── constants ───────────────────────── */

const CREDIT_COSTS = {
  like: 1,
  comment: 1,
  repost: 2,
  bookmark: 2,
} as const;

const GOAL_OPTIONS = [
  {
    key: "likes" as const,
    label: "Likes",
    icon: Heart,
    cost: CREDIT_COSTS.like,
    question: "How many likes?",
  },
  {
    key: "comments" as const,
    label: "Comments",
    icon: MessageCircle,
    cost: CREDIT_COSTS.comment,
    question: "How many comments?",
  },
  {
    key: "reposts" as const,
    label: "Reposts",
    icon: Repeat2,
    cost: CREDIT_COSTS.repost,
    question: "How many reposts?",
  },
  {
    key: "bookmarks" as const,
    label: "Bookmarks",
    icon: Bookmark,
    cost: CREDIT_COSTS.bookmark,
    question: "How many bookmarks?",
  },
] as const;

const ENGAGEMENT_OPTIONS = [
  { key: "likes" as const, label: "Likes", icon: Heart, cost: CREDIT_COSTS.like },
  { key: "comments" as const, label: "Comments", icon: MessageCircle, cost: CREDIT_COSTS.comment },
  { key: "reposts" as const, label: "Reposts", icon: Repeat2, cost: CREDIT_COSTS.repost },
  { key: "bookmarks" as const, label: "Bookmarks", icon: Bookmark, cost: CREDIT_COSTS.bookmark },
];

const MIN_DEPOSIT = 50;

/* ───────────────── hold-to-repeat button ────────────────────── */

function HoldButton({
  onAction,
  disabled,
  children,
  className,
}: {
  onAction: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const fnRef = useRef(onAction);
  fnRef.current = onAction; // always latest

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (interval.current) { clearInterval(interval.current); interval.current = null; }
  }, []);

  const start = useCallback(() => {
    fnRef.current();
    timer.current = setTimeout(() => {
      interval.current = setInterval(() => fnRef.current(), 60);
    }, 300);
  }, []);

  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      onPointerDown={disabled ? undefined : start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

/* ───────────────────────── component ───────────────────────── */

export function Submit() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const submitTweet = useSubmitTweetV2();
  const { window: currentWindow, nextWindow } = useCurrentWindow();

  // Shared state
  const [tweetUrl, setTweetUrl] = useState("");
  const [mode, setMode] = useState<"goal" | "credit">("goal");

  // Goal mode state
  const [goals, setGoals] = useState({ likes: 0, comments: 0, reposts: 0, bookmarks: 0 });

  // Credit mode state
  const [engagements, setEngagements] = useState({
    likes: true,
    comments: false,
    reposts: false,
    bookmarks: false,
  });
  const [creditBudget, setCreditBudget] = useState(MIN_DEPOSIT);

  // Deposit for goal mode
  const [goalDeposit, setGoalDeposit] = useState(MIN_DEPOSIT);

  if (!user) return null;

  const tweetId = extractTweetId(tweetUrl);
  const isValidUrl = !!tweetId;

  /* ── window rules ── */
  const canSubmitWindow = currentWindow?.canSubmit ?? false;
  const isLateSubmit =
    currentWindow?.phase === "engage" && currentWindow.canSubmit;

  const lateMinutesRemaining = isLateSubmit
    ? Math.floor(
        (currentWindow!.phaseEndsAt.getTime() - Date.now()) / 60000
      )
    : 0;

  const windowBlockReason = useMemo(() => {
    if (canSubmitWindow) return null;
    if (!currentWindow) {
      // Between windows
      if (nextWindow) {
        return `Next window opens in ${formatCountdown(nextWindow.startsAt.getTime() - Date.now())} — come back then!`;
      }
      return "No active window right now. Check back soon!";
    }
    if (currentWindow.phase === "cooldown") {
      return `Window is in cooldown. Next window in ${formatCountdown(currentWindow.phaseEndsAt.getTime() - Date.now())}`;
    }
    if (currentWindow.phase === "engage") {
      // Late engage, past the late submit cutoff
      const nextStart = nextWindow
        ? formatCountdown(nextWindow.startsAt.getTime() - Date.now())
        : "soon";
      return `Too late to submit this window. Next window in ${nextStart}`;
    }
    return null;
  }, [canSubmitWindow, currentWindow, nextWindow]);

  /* ── goal mode calculations ── */
  const totalGoalCredits =
    goals.likes * CREDIT_COSTS.like +
    goals.comments * CREDIT_COSTS.comment +
    goals.reposts * CREDIT_COSTS.repost +
    goals.bookmarks * CREDIT_COSTS.bookmark;

  const hasAnyGoal = goals.likes + goals.comments + goals.reposts + goals.bookmarks > 0;

  // Auto-cap goalDeposit when totalGoalCredits or balance changes
  const effectiveGoalDeposit = Math.max(
    MIN_DEPOSIT,
    Math.min(goalDeposit, user.credits)
  );
  const creditGap =
    totalGoalCredits > effectiveGoalDeposit
      ? totalGoalCredits - effectiveGoalDeposit
      : 0;

  /* ── credit mode calculations ── */
  const hasEngagement = Object.values(engagements).some(Boolean);
  const costPerRound = ENGAGEMENT_OPTIONS.reduce(
    (sum, opt) => sum + (engagements[opt.key] ? opt.cost : 0),
    0
  );
  const estimatedEngagements =
    costPerRound > 0 ? Math.floor(creditBudget / costPerRound) : 0;

  /* ── shared submit validation ── */
  const deposit = mode === "goal" ? effectiveGoalDeposit : creditBudget;
  const hasTypes = mode === "goal" ? hasAnyGoal : hasEngagement;

  const canSubmitForm =
    isValidUrl &&
    hasTypes &&
    deposit >= MIN_DEPOSIT &&
    deposit <= user.credits &&
    canSubmitWindow &&
    !submitTweet.isPending;

  /* ── submit handler ── */
  const handleSubmit = async () => {
    if (!canSubmitForm || !tweetId) return;

    const windowId = currentWindow?.windowId ?? "";

    try {
      if (mode === "goal") {
        await submitTweet.mutateAsync({
          tweetUrl,
          tweetId,
          windowId,
          likesGoal: goals.likes,
          commentsGoal: goals.comments,
          repostsGoal: goals.reposts,
          bookmarksGoal: goals.bookmarks,
          creditsDeposited: effectiveGoalDeposit,
          submitMode: "goal",
        });
      } else {
        await submitTweet.mutateAsync({
          tweetUrl,
          tweetId,
          windowId,
          likesGoal: 0,
          commentsGoal: 0,
          repostsGoal: 0,
          bookmarksGoal: 0,
          creditsDeposited: creditBudget,
          submitMode: "credit",
        });
      }
      navigate("/feed");
    } catch {
      // Error handled by mutation state
    }
  };

  /* ── goal stepper helper ── */
  const updateGoal = (key: keyof typeof goals, delta: number) => {
    setGoals((prev) => {
      const next = prev[key] + delta;
      if (next < 0) return prev; // don't go below 0
      return { ...prev, [key]: next };
    });
  };

  /* ───────────────────────── RENDER ───────────────────────── */

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Submit Tweet</h1>
        <p className="text-muted-foreground">
          Post a tweet URL to get engagement from the community
        </p>
      </div>

      {/* Window block banner */}
      {windowBlockReason && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Clock className="h-5 w-5 shrink-0" />
          <p>{windowBlockReason}</p>
        </div>
      )}

      {/* Late submit warning */}
      {isLateSubmit && !windowBlockReason && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            Late submission — only {lateMinutesRemaining} minute
            {lateMinutesRemaining !== 1 ? "s" : ""} of engagement time remaining
          </p>
        </div>
      )}

      {/* Tweet URL input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tweet URL</label>
        <div className="relative">
          <input
            type="url"
            placeholder="https://x.com/you/status/123456789"
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-10 text-sm outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
          />
          {tweetUrl && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValidUrl ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
          )}
        </div>
        {tweetUrl && !isValidUrl && (
          <p className="text-xs text-destructive">
            Enter a valid X/Twitter post URL (e.g., https://x.com/user/status/123)
          </p>
        )}
        {isValidUrl && (
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary-500 hover:underline"
          >
            Open tweet <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* ═══════════ GOAL MODE ═══════════ */}
      {mode === "goal" && (
        <>
          {/* Per-type goal steppers */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Set your engagement goals
            </label>
            <div className="space-y-3">
              {GOAL_OPTIONS.map((opt) => (
                <div
                  key={opt.key}
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                    goals[opt.key] > 0
                      ? "border-primary-300 bg-primary-50/50"
                      : "border-border bg-card"
                  }`}
                >
                  <opt.icon
                    className={`h-5 w-5 shrink-0 ${
                      goals[opt.key] > 0
                        ? "text-primary-500"
                        : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{opt.question}</p>
                    <p className="text-xs text-muted-foreground">
                      {opt.cost} credit{opt.cost > 1 ? "s" : ""} each
                      {goals[opt.key] > 0 && (
                        <span className="ml-1 font-semibold text-primary-600">
                          · {formatCredits(goals[opt.key] * opt.cost)} credits
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <HoldButton
                      onAction={() => updateGoal(opt.key, -1)}
                      disabled={goals[opt.key] <= 0}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed select-none touch-none"
                    >
                      <Minus className="h-4 w-4" />
                    </HoldButton>
                    <input
                      type="number"
                      min={0}
                      value={goals[opt.key]}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setGoals((prev) => ({ ...prev, [opt.key]: val }));
                      }}
                      className="w-16 rounded-lg border border-border bg-card px-2 py-2 text-center text-base font-semibold outline-none focus:border-primary-400"
                    />
                    <HoldButton
                      onAction={() => updateGoal(opt.key, 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-muted select-none touch-none"
                    >
                      <Plus className="h-4 w-4" />
                    </HoldButton>
                  </div>
                </div>
              ))}
            </div>

            {!hasAnyGoal && (
              <p className="text-xs text-destructive">
                Set at least one engagement goal
              </p>
            )}
          </div>

          {/* Total + Deposit */}
          {hasAnyGoal && (
            <div className="space-y-3">
              {/* Total needed */}
              <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50/30 px-4 py-3">
                <p className="text-sm font-medium">Total credits needed</p>
                <p className="text-lg font-bold">
                  {formatCredits(totalGoalCredits)}
                </p>
              </div>

              {/* Initial deposit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Initial deposit
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Balance: {formatCredits(user.credits)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setGoalDeposit(Math.max(MIN_DEPOSIT, goalDeposit - 10))
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <div className="flex-1">
                    <input
                      type="range"
                      min={MIN_DEPOSIT}
                      max={Math.max(MIN_DEPOSIT, user.credits)}
                      value={effectiveGoalDeposit}
                      onChange={(e) => setGoalDeposit(Number(e.target.value))}
                      className="w-full accent-primary-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setGoalDeposit(Math.min(user.credits, goalDeposit + 10))
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCredits(effectiveGoalDeposit)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      credits to escrow
                    </p>
                  </div>
                </div>
              </div>

              {/* Helper / gap message */}
              <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                {creditGap > 0 ? (
                  <p>
                    You need{" "}
                    <span className="font-semibold">
                      {formatCredits(creditGap)} more credits
                    </span>{" "}
                    — engage during this window to fill the gap!
                  </p>
                ) : (
                  <p>
                    Credits you collect during this window will auto-add to your
                    request!
                  </p>
                )}
              </div>

              {effectiveGoalDeposit > user.credits && (
                <p className="text-xs text-destructive">
                  Not enough credits. You have {formatCredits(user.credits)}.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════ CREDIT MODE ═══════════ */}
      {mode === "credit" && (
        <>
          {/* Engagement type toggles */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              What engagement do you want?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ENGAGEMENT_OPTIONS.map((opt) => {
                const selected = engagements[opt.key];
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      setEngagements((prev) => ({
                        ...prev,
                        [opt.key]: !prev[opt.key],
                      }))
                    }
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-primary-300 bg-primary-50/50"
                        : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <opt.icon
                      className={`h-5 w-5 ${
                        selected ? "text-primary-500" : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {opt.cost} credit{opt.cost > 1 ? "s" : ""} each
                      </p>
                    </div>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                        selected
                          ? "border-primary-400 bg-primary-400"
                          : "border-border"
                      }`}
                    >
                      {selected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {!hasEngagement && (
              <p className="text-xs text-destructive">
                Select at least one engagement type
              </p>
            )}
          </div>

          {/* Budget slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Credit Budget</label>
              <span className="text-sm text-muted-foreground">
                Balance: {formatCredits(user.credits)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setCreditBudget(Math.max(MIN_DEPOSIT, creditBudget - 10))
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={MIN_DEPOSIT}
                  max={Math.max(MIN_DEPOSIT, user.credits)}
                  value={creditBudget}
                  onChange={(e) => setCreditBudget(Number(e.target.value))}
                  className="w-full accent-primary-400"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setCreditBudget(Math.min(user.credits, creditBudget + 10))
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3">
              <div>
                <p className="text-2xl font-bold">
                  {formatCredits(creditBudget)}
                </p>
                <p className="text-xs text-muted-foreground">
                  credits to escrow
                </p>
              </div>
              {costPerRound > 0 && (
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    ~{estimatedEngagements}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    estimated engagements
                  </p>
                </div>
              )}
            </div>

            {creditBudget > user.credits && (
              <p className="text-xs text-destructive">
                Not enough credits. You have {formatCredits(user.credits)}.
              </p>
            )}
          </div>
        </>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmitForm}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-base font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitTweet.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Submit Tweet — {formatCredits(deposit)} credits
          </>
        )}
      </button>

      {/* Error message */}
      {submitTweet.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {(submitTweet.error as Error)?.message ?? "Something went wrong"}
        </div>
      )}

      {/* Mode toggle */}
      <button
        type="button"
        onClick={() => setMode(mode === "goal" ? "credit" : "goal")}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowRightLeft className="h-4 w-4" />
        {mode === "goal" ? "Switch to Credit Mode" : "Switch to Goal Mode"}
      </button>

      {/* Info box */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">How it works</p>
        <ul className="mt-2 space-y-1">
          {mode === "goal" ? (
            <>
              <li>
                Set goals for each engagement type — you pick exactly what you
                want.
              </li>
              <li>
                Deposit credits upfront. Credits you collect during the window
                auto-fill your request.
              </li>
              <li>
                You can pause or cancel anytime — unused credits are refunded.
              </li>
            </>
          ) : (
            <>
              <li>
                Credits are escrowed from your balance when you submit.
              </li>
              <li>
                Other creators engage with your tweet and collect credits.
              </li>
              <li>
                You can pause or cancel anytime — unused credits are refunded.
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
