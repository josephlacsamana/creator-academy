import { useNavigate } from "react-router-dom";
import {
  Zap,
  Lightbulb,
  Target,
  UserCheck,
  BarChart3,
  Layers,
  TrendingUp,
  BookOpen,
} from "lucide-react";

const tools = [
  {
    name: "Engagement Exchange",
    description: "A credit-based system where creators support each other with real likes, comments, reposts, and bookmarks.",
    icon: Zap,
    status: "active" as const,
    path: "/feed",
  },
  {
    name: "Hook Generator",
    description: "AI-powered hook writing assistant for viral tweet openers.",
    icon: Lightbulb,
    status: "coming_soon" as const,
  },
  {
    name: "Brand & Niche Positioning",
    description: "Define your unique creator brand and find your ideal niche.",
    icon: Target,
    status: "coming_soon" as const,
  },
  {
    name: "X Profile Audit",
    description: "Get AI feedback on your X profile, bio, banner, and pinned tweet.",
    icon: UserCheck,
    status: "coming_soon" as const,
  },
  {
    name: "Hook Analyzer",
    description: "Analyze the hooks of top-performing tweets in your niche.",
    icon: BarChart3,
    status: "coming_soon" as const,
  },
  {
    name: "Content Pillar Tracker",
    description: "Organize and track your content pillars to stay consistent.",
    icon: Layers,
    status: "coming_soon" as const,
  },
  {
    name: "Viral Tweet Pattern Library",
    description: "Browse proven viral tweet formats and templates.",
    icon: TrendingUp,
    status: "coming_soon" as const,
  },
  {
    name: "Story-to-Content Generator",
    description: "Turn your stories and experiences into engaging X content.",
    icon: BookOpen,
    status: "coming_soon" as const,
  },
];

export function Tools() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Creator Tools</h1>
        <p className="text-muted-foreground">
          Everything you need to grow on X
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => {
          const isActive = tool.status === "active";
          return (
            <button
              key={tool.name}
              onClick={() => isActive && tool.path && navigate(tool.path)}
              disabled={!isActive}
              className={`relative flex items-start gap-4 rounded-xl border p-5 text-left transition-colors ${
                isActive
                  ? "border-primary-200 bg-primary-50/30 hover:bg-primary-50/60 cursor-pointer"
                  : "border-border bg-card opacity-60 cursor-not-allowed"
              }`}
            >
              {!isActive && (
                <span className="absolute right-3 top-3 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Coming Soon
                </span>
              )}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  isActive ? "bg-primary-100" : "bg-muted"
                }`}
              >
                <tool.icon
                  className={`h-5 w-5 ${
                    isActive ? "text-primary-500" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div>
                <p className="font-semibold">{tool.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
