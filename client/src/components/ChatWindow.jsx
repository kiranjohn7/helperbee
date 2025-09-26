import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { authedFetch } from "../lib/utils";

/** @param {{ conversationId: string; senderId: string }} props */
export default function ChatWindow({ conversationId, senderId }) {
  /** @type {import("react").MutableRefObject<HTMLDivElement|null>} */
  const listRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // load is stable and listed as a dep
  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages?conversationId=${conversationId}`
      );
      if (!res.ok) return;
      const json = await res.json();
      setMessages(Array.isArray(json.messages) ? json.messages : []);
    } catch {
      // noop (optional: console.error)
    }
  }, [conversationId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const body = { conversationId, senderId, text: text.trim() };
    if (!body.text) return;
    try {
      await authedFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setText("");
      load();
    } catch {
      // noop
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="border rounded-xl bg-white p-3 flex flex-col h-[500px]">
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-2">
        {messages.map((m) => (
          <div key={m._id} className="p-2 rounded bg-gray-100">
            {m.text}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message"
        />
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={send}
          disabled={!text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

ChatWindow.propTypes = {
  conversationId: PropTypes.string.isRequired,
  senderId: PropTypes.string.isRequired,
};