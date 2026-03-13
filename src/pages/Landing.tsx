import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  ArrowRight,
  Users,
  Zap,
  Shield,
  Lightbulb,
  Target,
  UserCheck,
  BarChart3,
  Layers,
  TrendingUp,
  BookOpen,
  ChevronRight,
  Sparkles,
  Lock,
} from "lucide-react";

const tools = [
  {
    name: "Engagement Exchange",
    description:
      "A credit-based system where creators support each other with real likes, comments, reposts, and bookmarks.",
    icon: Zap,
    live: true,
  },
  {
    name: "Hook Generator",
    description:
      "AI-powered hook writing that stops the scroll. Generate viral openers in seconds.",
    icon: Lightbulb,
    live: false,
  },
  {
    name: "Brand & Niche Positioning",
    description:
      "Find your unique angle and own your niche so your content stands out.",
    icon: Target,
    live: false,
  },
  {
    name: "X Profile Audit",
    description:
      "Get instant AI feedback on your bio, banner, and pinned tweet — optimize for follows.",
    icon: UserCheck,
    live: false,
  },
  {
    name: "Hook Analyzer",
    description:
      "Reverse-engineer the hooks behind top-performing tweets in any niche.",
    icon: BarChart3,
    live: false,
  },
  {
    name: "Content Pillar Tracker",
    description:
      "Map your content pillars and stay consistent without burning out.",
    icon: Layers,
    live: false,
  },
  {
    name: "Viral Tweet Pattern Library",
    description:
      "Browse proven viral formats and templates — just plug in your ideas.",
    icon: TrendingUp,
    live: false,
  },
  {
    name: "Story-to-Content Generator",
    description:
      "Turn your real stories and experiences into scroll-stopping X content.",
    icon: BookOpen,
    live: false,
  },
];

export function Landing() {
  const { user, loading, signInWithTwitter, initialize } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.jpg" alt="Creator Academy" className="h-8 w-8" />
            <span className="text-lg font-semibold">Creator Academy</span>
          </div>
          <button
            onClick={signInWithTwitter}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Connect with 𝕏
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-600">
            <Sparkles className="h-4 w-4" />
            8 Growth Tools for X Creators — 100% FREE
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your content is fire.{" "}
            <span className="text-primary-400">Your reach is sh*t.</span>
            <br />
            <span className="text-3xl sm:text-4xl lg:text-5xl">Let's fix that!</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            8 tools. 600+ creators. No bots. No BS.
            Just creators who got each other's backs.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={signInWithTwitter}
              className="flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-base font-medium text-background transition-opacity hover:opacity-90"
            >
              Join for{" "}
              <span className="rounded bg-primary-400 px-1.5 py-0.5 text-primary-foreground">FREE</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="text-sm text-muted-foreground">
              No credit card. No catch. 500 credits on signup.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Flagship Tool — Engagement Exchange */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              LIVE NOW
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Engagement Exchange
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              You support other creators. They support you back. That's it.
              No bots. No fake accounts. Just real people who actually give a sh*t about growing together.
            </p>
          </motion.div>

          {/* How it works steps */}
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Users,
                title: "1. Connect your X",
                desc: "Sign in, get 500 free credits. Takes 10 seconds.",
              },
              {
                icon: Heart,
                title: "2. Engage on posts",
                desc: "Like, comment, repost other creators' content. You get credits for every action.",
              },
              {
                icon: Zap,
                title: "3. Get engagement back",
                desc: "Drop your tweet, set a budget, and watch real creators engage with your sh*t.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                  <feature.icon className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Credit pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            {[
              { icon: Heart, label: "Like", credits: "1 credit" },
              { icon: MessageCircle, label: "Comment", credits: "1 credit" },
              { icon: Repeat2, label: "Repost", credits: "2 credits" },
              { icon: Bookmark, label: "Bookmark", credits: "2 credits" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 shadow-sm"
              >
                <item.icon className="h-4 w-4 text-primary-400" />
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">
                  {item.credits}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Full Toolkit */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold sm:text-3xl">
              8 tools to help you{" "}
              <span className="text-primary-400">blow up on X.</span>
              {" "}All{" "}
              <span className="rounded-md bg-primary-400 px-2 py-0.5 text-primary-foreground">FREE.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              We're building every tool you'll ever need to grow on X.
              Engagement Exchange is live now. The rest? Coming soon and just as crazy.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`relative rounded-xl border p-5 transition-colors ${
                  tool.live
                    ? "border-primary-200 bg-primary-50/30"
                    : "border-border bg-card"
                }`}
              >
                {tool.live ? (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Live
                  </span>
                ) : (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Soon
                  </span>
                )}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    tool.live ? "bg-primary-100" : "bg-muted"
                  }`}
                >
                  <tool.icon
                    className={`h-5 w-5 ${
                      tool.live ? "text-primary-500" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <h3 className="mt-3 font-semibold">{tool.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Creators Join */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold sm:text-3xl">
              This ain't another engagement pod.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              We've seen the DM groups. The "like-for-like" threads. That stuff doesn't work. This does.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Zero bots. Zero BS.",
                desc: "Every like, comment, and repost comes from a real human creator. We verify everything.",
              },
              {
                icon: Users,
                title: "600+ creators and counting",
                desc: "The Bricktopians community. Creators who actually show up, engage, and help each other win.",
              },
              {
                icon: Zap,
                title: "Credits, not cash",
                desc: "Nobody's getting paid here. You give engagement, you get engagement. Simple as that.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                  <item.icon className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
              Stop sleeping on your growth.{" "}
              <span className="text-primary-400">Get in here.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              600+ creators are already in here. It's free. It works.
              Seriously, what are you waiting for?
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={signInWithTwitter}
                className="flex items-center gap-2 rounded-xl bg-foreground px-8 py-3.5 text-base font-medium text-background transition-opacity hover:opacity-90"
              >
                Join for Free — Let's Go
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          Creator Academy &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
