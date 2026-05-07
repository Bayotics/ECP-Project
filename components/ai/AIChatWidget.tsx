"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
type Role = "user" | "assistant";
type MessageStatus = "ok" | "error";

interface Message {
  id: string;
  role: Role;
  content: string;
  status: MessageStatus;
  ts: number;
}

/* ─── Mock knowledge base ────────────────────────────── */
const MOCK_RESPONSES: { pattern: RegExp; reply: string }[] = [
  {
    pattern: /\b(hi|hello|hey|good\s*(morning|afternoon|evening))\b/i,
    reply: "Hello! 👋 I'm the ECP assistant. I can help you with membership, events, news, the store, and more. What would you like to know?",
  },
  {
    pattern: /\b(membership|apply|join|application)\b/i,
    reply: "To apply for ECP membership, head to the **Membership** page and fill in the application form. Once submitted, our team reviews it — you can track your status under **Membership → Status**. Approval typically takes 3–5 working days.",
  },
  {
    pattern: /\b(event|events|upcoming|schedule)\b/i,
    reply: "You can browse all upcoming events on the **Events** page. Registered members can RSVP directly from the event detail page. We host town halls, workshops, volunteer drives, and more across Lagos.",
  },
  {
    pattern: /\b(news|article|announcement|post)\b/i,
    reply: "The **News** section features the latest announcements, reports, and opinion pieces from ECP. You can filter by category — news, blog, press releases, and more.",
  },
  {
    pattern: /\b(store|shop|product|merch|buy|purchase|cart)\b/i,
    reply: "Visit our **Store** to browse ECP merchandise including apparel, publications, and accessories. Add items to your cart and checkout — some items are exclusive to members. 🛍️",
  },
  {
    pattern: /\b(donat|donate|donation|fund|support)\b/i,
    reply: "We appreciate your support! Visit the **Donate** page to make a one-time or custom donation. Every contribution helps us support our cultural and community programmes. 🙏",
  },
  {
    pattern: /\b(login|sign\s*in|password|forgot|reset)\b/i,
    reply: "You can log in from the **Login** page. Forgot your password? Use the **Forgot Password** link on the login page and we'll send a reset link to your email.",
  },
  {
    pattern: /\b(register|sign\s*up|account|create)\b/i,
    reply: "Create your ECP account on the **Register** page. Once registered, you can apply for full membership to unlock exclusive features like the member directory, documents, and member-only store items.",
  },
  {
    pattern: /\b(dues|payment|fee|subscription)\b/i,
    reply: "Annual membership dues can be paid from your **Member Dashboard → Dues** page. Keeping dues up to date ensures you retain access to all member benefits.",
  },
  {
    pattern: /\b(contact|email|phone|reach|support|help)\b/i,
    reply: "For direct support, reach out to us at **info@ekoclubphiladelphia.org** or via the contact form on our website. Our team responds within 24 hours on business days.",
  },
  {
    pattern: /\b(gallery|photo|image|picture)\b/i,
    reply: "Check out our **Gallery** for photos from past events, community activities, and ECP milestones. New images are added after every major event.",
  },
  {
    pattern: /\b(lga|local\s*gov|district|area)\b/i,
    reply: "ECP is active across all 20 Local Government Areas of Lagos State. When filling your membership application, select your LGA — it helps us connect you with local chapter activities.",
  },
  {
    pattern: /\b(thank|thanks|great|awesome|perfect)\b/i,
    reply: "You're welcome! 😊 Is there anything else I can help you with?",
  },
  {
    pattern: /\b(bye|goodbye|see\s*you|later)\b/i,
    reply: "Goodbye! Feel free to come back if you have any questions. Have a great day! 👋",
  },
];

const FALLBACK_RESPONSES = [
  "I'm not sure about that specific topic, but I'd be happy to help with membership, events, news, the store, or donations. What would you like to know?",
  "That's a great question! For the most accurate answer, please reach out to our team at info@ekoclubphiladelphia.org. In the meantime, I can help with general questions about Eko Club Philadelphia.",
  "I don't have a specific answer for that right now. Try exploring our website — most information can be found in the relevant section. Can I help you find something else?",
];

function getMockReply(input: string): string {
  const trimmed = input.trim();
  for (const { pattern, reply } of MOCK_RESPONSES) {
    if (pattern.test(trimmed)) return reply;
  }
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

/* ─── Typing Indicator ───────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-(--color-green-400) animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  );
}

/* ─── Message Bubble ─────────────────────────────────── */
function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const isError = msg.status === "error";

  // Simple markdown: **text** → bold
  const formatted = msg.content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  return (
    <div className={cn("flex gap-2 items-end", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-(--color-green-600) flex items-center justify-center text-white text-xs font-bold shadow">
          AI
        </div>
      )}
      <div
        className={cn(
          "max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-(--color-green-600) text-white rounded-br-sm"
            : isError
            ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-sm"
            : "bg-white text-(--color-neutral-800) border border-(--color-neutral-200) rounded-bl-sm"
        )}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    </div>
  );
}

/* ─── Suggested prompts ──────────────────────────────── */
const SUGGESTIONS = [
  "How do I apply for membership?",
  "What events are coming up?",
  "How can I donate?",
  "Tell me about the store",
];

/* ─── Main Widget ────────────────────────────────────── */
export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi there! 👋 I'm the **ECP AI Assistant**. Ask me anything about membership, events, news, or the store!",
      status: "ok",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Scroll to latest message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* Focus input when modal opens */
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setInput("");
    setHasError(false);

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content, status: "ok", ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    /* Simulate network delay: 800ms – 1800ms */
    const delay = 800 + Math.random() * 1000;

    try {
      /* Simulate occasional errors (~10% chance) */
      if (Math.random() < 0.1) throw new Error("Network error");

      await new Promise(r => setTimeout(r, delay));

      const reply = getMockReply(content);
      const aiMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: reply, status: "ok", ts: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setHasError(true);
      const errMsg: Message = {
        id: `e-${Date.now()}`,
        role: "assistant",
        content: "⚠️ Something went wrong. Please try again.",
        status: "error",
        ts: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  function clearChat() {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hi there! 👋 I'm the **ECP AI Assistant**. Ask me anything about membership, events, news, or the store!",
      status: "ok",
      ts: Date.now(),
    }]);
    setHasError(false);
    setInput("");
  }

  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300",
          "bg-(--color-green-600) hover:bg-(--color-green-700) text-white",
          open && "rotate-90 scale-95"
        )}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.268 2 11.5c0 2.57 1.09 4.9 2.87 6.6L4 22l4.26-1.42A10.86 10.86 0 0 0 12 21c5.523 0 10-4.268 10-9.5S17.523 2 12 2Z" />
          </svg>
        )}
        {/* Unread badge */}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow">
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat modal ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-1.5rem)] flex flex-col rounded-2xl shadow-2xl border border-(--color-neutral-200) bg-white overflow-hidden"
          style={{ height: "min(520px, calc(100dvh - 7rem))" }}
          role="dialog"
          aria-label="ECP AI Assistant"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-(--color-green-600) text-white shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">AI</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight">ECP Assistant</p>
              <p className="text-xs text-white/75 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" />
                Online — powered by ECP
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-white/70 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-colors font-medium"
                title="Clear chat"
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-(--color-neutral-50)/60 scroll-smooth">
            {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
            {loading && (
              <div className="flex gap-2 items-end">
                <div className="shrink-0 w-7 h-7 rounded-full bg-(--color-green-600) flex items-center justify-center text-white text-xs font-bold shadow">
                  AI
                </div>
                <div className="bg-white border border-(--color-neutral-200) rounded-2xl rounded-bl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            {/* Error retry */}
            {hasError && !loading && (
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setHasError(false);
                    const last = messages.filter(m => m.role === "user").at(-1);
                    if (last) sendMessage(last.content);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  Retry last message
                </button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {showSuggestions && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0 bg-white border-t border-(--color-neutral-100)">
              <p className="w-full text-[10px] font-bold text-(--color-neutral-400) uppercase tracking-wide pt-2 pb-1">Suggested</p>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-(--color-green-50) text-(--color-green-700) font-medium px-2.5 py-1 rounded-full hover:bg-(--color-green-100) transition-colors border border-(--color-green-200)"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="px-3 py-3 flex items-center gap-2 bg-white border-t border-(--color-neutral-200) shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything…"
              disabled={loading}
              maxLength={500}
              className="flex-1 text-gray-500 px-3.5 py-2 text-sm border border-(--color-neutral-300) rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400) bg-(--color-neutral-50) disabled:opacity-50 transition-shadow"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="shrink-0 w-9 h-9 rounded-xl bg-(--color-green-600) hover:bg-(--color-green-700) text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[10px] text-(--color-neutral-400) py-1.5 bg-white border-t border-(--color-neutral-100) shrink-0">
            AI responses are simulated · Not real advice
          </p>
        </div>
      )}
    </>
  );
}
