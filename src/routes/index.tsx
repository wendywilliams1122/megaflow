import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Thread = {
  id: string;
  title: string;
  author: string;
  body: string;
  createdAt: number;
  replies: { id: string; author: string; body: string; createdAt: number }[];
};

const STORAGE_KEY = "simple-forum-threads-v1";

function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: "welcome",
      title: "Welcome to the forum!",
      author: "Admin",
      body: "Introduce yourself and start a discussion.",
      createdAt: Date.now(),
      replies: [],
    },
  ];
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Simple Forum — Discuss anything" },
      { name: "description", content: "A minimal community forum to start threads and reply." },
      { property: "og:title", content: "Simple Forum" },
      { property: "og:description", content: "Start threads, join conversations." },
    ],
  }),
  component: ForumPage,
});

function ForumPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    setThreads(loadThreads());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads, hydrated]);

  const createThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !body.trim()) return;
    const t: Thread = {
      id: crypto.randomUUID(),
      title: title.trim().slice(0, 120),
      author: author.trim().slice(0, 40),
      body: body.trim().slice(0, 2000),
      createdAt: Date.now(),
      replies: [],
    };
    setThreads([t, ...threads]);
    setTitle("");
    setBody("");
  };

  const addReply = (threadId: string) => {
    if (!replyAuthor.trim() || !replyBody.trim()) return;
    setThreads(
      threads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              replies: [
                ...t.replies,
                {
                  id: crypto.randomUUID(),
                  author: replyAuthor.trim().slice(0, 40),
                  body: replyBody.trim().slice(0, 2000),
                  createdAt: Date.now(),
                },
              ],
            }
          : t,
      ),
    );
    setReplyBody("");
  };

  const open = threads.find((t) => t.id === openId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-6 flex items-center justify-between">
          <button
            onClick={() => setOpenId(null)}
            className="text-xl font-semibold tracking-tight"
          >
            Simple Forum
          </button>
          <span className="text-xs text-muted-foreground">{threads.length} threads</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {!open ? (
          <>
            <section className="rounded-lg border border-border bg-card p-5 mb-8">
              <h2 className="text-sm font-semibold mb-3">Start a new thread</h2>
              <form onSubmit={createThread} className="space-y-3">
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Thread title"
                  maxLength={120}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What's on your mind?"
                  maxLength={2000}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Post thread
                </button>
              </form>
            </section>

            <ul className="space-y-2">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setOpenId(t.id)}
                    className="w-full text-left rounded-lg border border-border bg-card p-4 hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{t.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      by {t.author} · {new Date(t.createdAt).toLocaleString()} · {t.replies.length} replies
                    </div>
                  </button>
                </li>
              ))}
              {threads.length === 0 && (
                <li className="text-sm text-muted-foreground text-center py-8">No threads yet.</li>
              )}
            </ul>
          </>
        ) : (
          <article>
            <button
              onClick={() => setOpenId(null)}
              className="text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              ← Back to threads
            </button>
            <div className="rounded-lg border border-border bg-card p-5">
              <h1 className="text-xl font-semibold">{open.title}</h1>
              <div className="mt-1 text-xs text-muted-foreground">
                by {open.author} · {new Date(open.createdAt).toLocaleString()}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm">{open.body}</p>
            </div>

            <h2 className="mt-8 mb-3 text-sm font-semibold">Replies ({open.replies.length})</h2>
            <ul className="space-y-2">
              {open.replies.map((r) => (
                <li key={r.id} className="rounded-md border border-border bg-card p-4">
                  <div className="text-xs text-muted-foreground">
                    {r.author} · {new Date(r.createdAt).toLocaleString()}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{r.body}</p>
                </li>
              ))}
              {open.replies.length === 0 && (
                <li className="text-sm text-muted-foreground">Be the first to reply.</li>
              )}
            </ul>

            <section className="mt-6 rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">Add a reply</h3>
              <div className="space-y-3">
                <input
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write your reply..."
                  maxLength={2000}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={() => addReply(open.id)}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Post reply
                </button>
              </div>
            </section>
          </article>
        )}
      </main>
    </div>
  );
}

// keep Link referenced to avoid unused import in some builds
void Link;
