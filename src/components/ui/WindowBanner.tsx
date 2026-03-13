import { motion, AnimatePresence } from "framer-motion";
import { useCurrentWindow } from "@/hooks/use-current-window";
import { formatCountdown } from "@/lib/window-engine";
import { Clock, Flame, Timer, Moon } from "lucide-react";

/**
 * Compact banner showing current window state.
 * Displays at the top of the main content area inside Shell.
 */
export function WindowBanner() {
  const { window: win, nextWindow, isLoading } = useCurrentWindow();

  if (isLoading) return null;

  // Determine banner content based on current state
  const getBannerContent = () => {
    if (win) {
      switch (win.phase) {
        case "submit":
          return {
            icon: <Clock className="h-4 w-4 shrink-0" />,
            label: `Window ${win.windowNumber}`,
            phase: "Submit + Preview",
            countdown: `Engage starts in ${formatCountdown(win.timeRemainingMs)}`,
            variant: "submit" as const,
          };
        case "engage":
          return {
            icon: <Flame className="h-4 w-4 shrink-0" />,
            label: `Window ${win.windowNumber}`,
            phase: "Engage Phase",
            countdown: `${formatCountdown(win.timeRemainingMs)} remaining`,
            variant: "engage" as const,
          };
        case "cooldown": {
          // Time until next window (not just until cooldown ends)
          const nextMs = win.nextWindowStartsAt
            ? win.nextWindowStartsAt.getTime() - Date.now()
            : win.timeRemainingMs;
          return {
            icon: <Timer className="h-4 w-4 shrink-0" />,
            label: `Window ${win.windowNumber}`,
            phase: "Cooldown",
            countdown: `Next window in ${formatCountdown(Math.max(0, nextMs))}`,
            variant: "cooldown" as const,
          };
        }
        default:
          return null;
      }
    }

    // Between windows
    if (nextWindow) {
      const nextMs = nextWindow.startsAt.getTime() - Date.now();
      return {
        icon: <Moon className="h-4 w-4 shrink-0" />,
        label: `Next window (W${nextWindow.windowNumber})`,
        phase: "",
        countdown: `opens in ${formatCountdown(Math.max(0, nextMs))}`,
        variant: "between" as const,
      };
    }

    return null;
  };

  const content = getBannerContent();
  if (!content) return null;

  // Style variants
  const variantStyles = {
    submit: "bg-primary/10 border-primary/30 text-primary-foreground",
    engage: "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-200",
    cooldown: "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900/30 dark:border-slate-700 dark:text-slate-300",
    between: "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900/30 dark:border-slate-700 dark:text-slate-400",
  };

  const dotStyles = {
    submit: "bg-[#F5B526]",
    engage: "bg-orange-500",
    cooldown: "bg-slate-400",
    between: "bg-slate-300",
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={content.variant + (win?.windowNumber ?? "between")}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className={`mb-4 flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium ${variantStyles[content.variant]}`}
      >
        {/* Pulsing status dot */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {content.variant === "engage" && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotStyles[content.variant]}`}
            />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotStyles[content.variant]}`}
          />
        </span>

        {content.icon}

        <span className="font-semibold">{content.label}</span>

        {content.phase && (
          <>
            <span className="text-muted-foreground">—</span>
            <span>{content.phase}</span>
          </>
        )}

        <span className="ml-auto tabular-nums">{content.countdown}</span>
      </motion.div>
    </AnimatePresence>
  );
}
