import { useNavigate } from "react-router-dom";
import {
  useMyRequests,
  useCancelRequest,
  useTogglePause,
} from "@/hooks/use-tweet-requests";
import { formatCredits } from "@/lib/utils";
import {
  ListChecks,
  ExternalLink,
  Pause,
  Play,
  XCircle,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Loader2,
  Plus,
} from "lucide-react";
import type { TweetRequest, TweetRequestStatus } from "@/types/database";

const STATUS_CONFIG: Record<
  TweetRequestStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-green-50 text-green-700",
  },
  paused: {
    label: "Paused",
    className: "bg-yellow-50 text-yellow-700",
  },
  cooldown: {
    label: "Cooldown",
    className: "bg-orange-50 text-orange-700",
  },
  completed: {
    label: "Completed",
    className: "bg-muted text-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700",
  },
};

function EngagementBadges({ request }: { request: TweetRequest }) {
  const types = [
    { show: request.want_likes, icon: Heart, label: "Likes" },
    { show: request.want_comments, icon: MessageCircle, label: "Comments" },
    { show: request.want_reposts, icon: Repeat2, label: "Reposts" },
    { show: request.want_bookmarks, icon: Bookmark, label: "Bookmarks" },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {types
        .filter((t) => t.show)
        .map((t) => (
          <span
            key={t.label}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </span>
        ))}
    </div>
  );
}

function RequestCard({ request }: { request: TweetRequest }) {
  const cancelRequest = useCancelRequest();
  const togglePause = useTogglePause();

  const status = STATUS_CONFIG[request.status];
  const canManage = request.status === "active" || request.status === "paused";
  const creditsUsed = request.credits_deposited - request.credits_remaining;
  const percentUsed =
    request.credits_deposited > 0
      ? (creditsUsed / request.credits_deposited) * 100
      : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
            >
              {status.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(request.created_at).toLocaleDateString()}
            </span>
          </div>

          <a
            href={request.tweet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-500 hover:underline"
          >
            View tweet <ExternalLink className="h-3 w-3" />
          </a>

          <div className="mt-2">
            <EngagementBadges request={request} />
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => togglePause.mutate(request.id)}
              disabled={togglePause.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-50"
              title={request.status === "active" ? "Pause" : "Resume"}
            >
              {togglePause.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : request.status === "active" ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => {
                if (window.confirm("Cancel this request? Remaining credits will be refunded.")) {
                  cancelRequest.mutate(request.id);
                }
              }}
              disabled={cancelRequest.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/5 disabled:opacity-50"
              title="Cancel & refund"
            >
              {cancelRequest.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Credit progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {formatCredits(creditsUsed)} / {formatCredits(request.credits_deposited)} credits used
          </span>
          <span>{formatCredits(request.credits_remaining)} remaining</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary-400 transition-all"
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function MyRequests() {
  const { data: requests, isLoading } = useMyRequests();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Requests</h1>
          <p className="text-muted-foreground">
            Track engagement on your submitted tweets
          </p>
        </div>
        <button
          onClick={() => navigate("/submit")}
          className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Tweet
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !requests?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <ListChecks className="h-10 w-10 opacity-30" />
          <p className="mt-3 text-sm">No requests yet.</p>
          <button
            onClick={() => navigate("/submit")}
            className="mt-4 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Submit your first tweet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
