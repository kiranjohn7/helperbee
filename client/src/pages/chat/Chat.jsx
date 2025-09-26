import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ChatWindow from "../../components/ChatWindow";
import { authedFetch } from "../../lib/utils";

export default function Chat() {
  const { conversationId } = useParams();
  const [me, setMe] = useState(null);

  useEffect(() => { (async () => {
    const res = await authedFetch("/api/auth/me");
    const json = await res.json();
    setMe(json.user || null);
  })(); }, []);

  if (!me) return <div>Loading...</div>;
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Chat</h1>
      <ChatWindow conversationId={conversationId} senderId={me._id} />
    </div>
  );
}