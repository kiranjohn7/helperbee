// client/src/pages/chat/Chat.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spin, Result, Button } from "antd";
import ChatWindow from "../../components/ChatWindow";
import { authedFetch } from "../../lib/utils";

export default function Chat() {
  const { conversationId } = useParams();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await authedFetch("/api/auth/me");
        if (!alive) return;
        setMe(data.user || null);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr("Couldn't load your session. Please log in again.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto h-[60vh] grid place-items-center">
        <Spin size="large" tip="Loading chat..." />
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Result
          status="warning"
          title="Something went wrong"
          subTitle={err}
          extra={
            <Button href="/auth/login" type="primary">
              Go to Login
            </Button>
          }
        />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Result
          status="403"
          title="Please sign in"
          subTitle="You need to be logged in to view this chat."
          extra={
            <Button href="/auth/login" type="primary">
              Login
            </Button>
          }
        />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Result
          status="404"
          title="No conversation selected"
          subTitle="Please open a chat from your dashboard."
          extra={
            <Button href="/dashboard/hirer" type="primary">
              Go to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Chat</h1>
      <ChatWindow conversationId={conversationId} senderId={me._id} />
    </div>
  );
}