// client/src/components/ChatWindow.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { authedFetch } from "../lib/utils";

const fmtTime = (d) =>
  new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(d);

function dateLabel(d) {
  const now = new Date();
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dd - today) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export default function ChatWindow({ conversationId, senderId, title = "Chat" }) {
  const listRef = useRef(null);
  const taRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  const load = useCallback(async (signal) => {
    if (!conversationId) return;
    try {
      const j = await authedFetch(`/api/messages?conversationId=${conversationId}`, { signal });
      setMessages(Array.isArray(j.messages) ? j.messages : []);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e); // ✅ use Vite’s flag
    } finally {
      setInitialLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    setInitialLoading(true);
    const ctrl = new AbortController();
    load(ctrl.signal);
    const id = setInterval(() => load(ctrl.signal), 3000);
    return () => {
      ctrl.abort();
      clearInterval(id);
    };
  }, [load]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (atBottom) el.scrollTop = el.scrollHeight;
  }, [messages, atBottom]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
      setAtBottom(nearBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = 120;
    ta.style.height = Math.min(ta.scrollHeight, max) + "px";
  }, [text]);

  const groups = useMemo(() => {
    const g = [];
    let currentLabel = null;
    let bucket = [];
    for (const m of messages) {
      const created = new Date(m.createdAt || Date.now());
      const lbl = dateLabel(created);
      if (lbl !== currentLabel) {
        if (bucket.length) g.push({ label: currentLabel, items: bucket });
        currentLabel = lbl;
        bucket = [];
      }
      bucket.push(m);
    }
    if (bucket.length) g.push({ label: currentLabel, items: bucket });
    return g;
  }, [messages]);

  async function send() {
    const body = { conversationId, senderId, text: text.trim() };
    if (!body.text || sending) return;

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      conversationId,
      senderId,
      text: body.text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    setSending(true);

    try {
      await authedFetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
      await load();
    } catch (e) {
      setMessages((m) => m.filter((x) => x._id !== tempId));
      if (import.meta.env.DEV) console.error(e); // ✅ use Vite’s flag
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border bg-white shadow-sm overflow-hidden h-[600px]">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-600 text-white grid place-items-center text-sm font-semibold">HB</div>
          <div>
            <div className="font-semibold text-gray-900">{title}</div>
            <div className="text-xs text-gray-500">Secure conversation</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Live
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {initialLoading ? (
          <div className="space-y-2">
            <div className="w-2/3 h-6 bg-white/80 rounded-lg animate-pulse" />
            <div className="w-1/2 h-6 bg-white/80 rounded-lg animate-pulse ml-auto" />
            <div className="w-5/6 h-6 bg-white/80 rounded-lg animate-pulse" />
          </div>
        ) : groups.length === 0 ? (
          <div className="h-full grid place-items-center text-sm text-gray-500">
            Say hello and discuss the task details here.
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="space-y-3">
              <div className="sticky top-0 z-10 flex justify-center">
                <span className="px-3 py-1 text-xs text-gray-600 bg-white/80 backdrop-blur rounded-full border">
                  {g.label}
                </span>
              </div>

              {g.items.map((m) => {
                const mine = String(m.senderId) === String(senderId);
                const created = new Date(m.createdAt || Date.now());
                return (
                  <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={[
                        "max-w-[75%] rounded-2xl px-3 py-2 shadow-sm",
                        mine
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-white text-gray-900 border rounded-bl-sm",
                      ].join(" ")}
                    >
                      <div className="whitespace-pre-wrap break-words">{m.text}</div>
                      <div className={`mt-1 text-[10px] ${mine ? "text-indigo-100/90" : "text-gray-500"}`}>
                        {fmtTime(created)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {!atBottom && (
        <button
          onClick={() => {
            const el = listRef.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }}
          className="absolute bottom-24 right-6 px-2 py-1 text-xs rounded-full border bg-white shadow hover:bg-gray-50"
        >
          Jump to latest ↓
        </button>
      )}

      <div className="border-t bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={taRef}
            className="flex-1 border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message…"
            rows={1}
            maxLength={2000}
          />
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white hover:opacity-95 disabled:opacity-60"
            onClick={send}
            disabled={!text.trim() || sending}
            aria-label="Send message"
          >
            {sending ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor" />
              </svg>
            )}
            <span className="hidden sm:inline">{sending ? "Sending" : "Send"}</span>
          </button>
        </div>
        <div className="mt-1 text-[11px] text-gray-500">Press Enter to send • Shift+Enter for a new line</div>
      </div>
    </div>
  );
}

ChatWindow.propTypes = {
  conversationId: PropTypes.string.isRequired,
  senderId: PropTypes.string.isRequired,
  title: PropTypes.string,
};