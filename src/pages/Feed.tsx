import { Newspaper, Loader2 } from "lucide-react";
import { useFeed } from "@/hooks/use-feed";
import { TweetCard } from "@/components/feed/TweetCard";

export function Feed() {
  const { data, isLoading, error } = useFeed();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Engagement Feed</h1>
        <p className="text-muted-foreground">
          Engage with tweets to collect credits
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Failed to load feed. Please try again.
        </div>
      )}

      {data && data.requests.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Newspaper className="h-10 w-10 opacity-30" />
          <p className="mt-3 text-sm">
            No tweets available right now. Check back soon!
          </p>
        </div>
      )}

      {data && data.requests.length > 0 && (
        <div className="space-y-4">
          {data.requests.map((request) => (
            <TweetCard
              key={request.id}
              request={request}
              myEngagements={data.myEngagements.filter(
                (e) => e.tweet_request_id === request.id
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
