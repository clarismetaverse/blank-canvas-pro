import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import type { Channel as StreamChannel, StreamChat } from "stream-chat";
import {
  Channel as ChannelComponent,
  Chat,
  MessageComposer,
  MessageList,
  Thread,
  Window,
  useChatContext,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { useAuth } from "@/hooks/useAuth";
import { getVicChannelTitle, getVicChatClient } from "@/services/vicChat";

const FALLBACK_AVATAR = "https://i.pravatar.cc/100?img=65";

type ChannelRow = {
  id: string;
  title: string;
  avatarUrl: string;
  preview: string;
  lastAt: Date | null;
  unread: number;
};

function formatWhen(date: Date | null) {
  if (!date) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function toRow(channel: StreamChannel, selfId: string): ChannelRow {
  const data = channel.data as Record<string, unknown> | undefined;
  const other = Object.values(channel.state.members).find((member) => member.user_id !== selfId)?.user;
  const lastMessage = channel.state.messages[channel.state.messages.length - 1];
  const lastAt = channel.state.last_message_at ?? (lastMessage?.created_at ? new Date(lastMessage.created_at) : null);
  return {
    id: channel.id ?? "",
    title: getVicChannelTitle(data),
    avatarUrl: (typeof other?.image === "string" && other.image) || FALLBACK_AVATAR,
    preview: lastMessage?.text?.trim() || "Say hello 👋",
    lastAt: lastAt ? new Date(lastAt) : null,
    unread: channel.countUnread(),
  };
}

function ChatState({ children, loading = false }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-neutral-500">
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-neutral-400" /> : null}
      {children}
    </div>
  );
}

function ChannelListView({ client, selfId }: { client: StreamChat; selfId: string }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ChannelRow[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const channels = await client.queryChannels(
        { type: "messaging", members: { $in: [selfId] } },
        [{ last_message_at: -1 }, { created_at: -1 }],
        { limit: 30, message_limit: 1, state: true, watch: true },
      );
      setRows(channels.map((channel) => toRow(channel, selfId)));
    } catch (err) {
      console.error("[VicChat] channel list failed", err);
      setError("Could not load your conversations.");
    }
  }, [client, selfId]);

  useEffect(() => {
    void load();
    const subscription = client.on((event) => {
      if (event.type === "message.new" || event.type === "notification.message_new" || event.type === "notification.added_to_channel" || event.type === "notification.mark_read") {
        void load();
      }
    });
    return () => subscription.unsubscribe();
  }, [client, load]);

  return (
    <div className="px-4 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Chat</h1>
          <p className="text-xs text-neutral-500">Models who answered your invitations</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-neutral-200 bg-white p-2 text-neutral-600"
          aria-label="Refresh conversations"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </header>

      {error ? (
        <ChatState>
          <p>{error}</p>
          <button type="button" onClick={() => void load()} className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white">
            Try again
          </button>
        </ChatState>
      ) : rows === null ? (
        <ChatState loading>Loading conversations…</ChatState>
      ) : rows.length === 0 ? (
        <ChatState>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
            <MessageCircle className="h-5 w-5" />
          </div>
          <p className="font-medium text-neutral-900">No conversations yet</p>
          <p className="max-w-xs">A chat opens when a model answers one of your invitations or you approve them.</p>
        </ChatState>
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => navigate(`/chat/${encodeURIComponent(row.id)}`)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-neutral-50"
              >
                <img src={row.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-neutral-900">{row.title}</p>
                    <span className="shrink-0 text-[11px] text-neutral-400">{formatWhen(row.lastAt)}</span>
                  </div>
                  <p className="truncate text-xs text-neutral-500">{row.preview}</p>
                </div>
                {row.unread > 0 ? (
                  <span className="ml-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {row.unread > 99 ? "99+" : row.unread}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActiveChannel({ channel }: { channel: StreamChannel }) {
  const { setActiveChannel } = useChatContext();
  useEffect(() => {
    setActiveChannel(channel);
  }, [channel, setActiveChannel]);
  return null;
}

function ConversationView({ client, selfId, channelId }: { client: StreamChat; selfId: string; channelId: string }) {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "error" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setChannel(null);
    // Membership is part of the filter: knowing a channel ID is not enough to open it.
    client
      .queryChannels({ cid: `messaging:${channelId}`, members: { $in: [selfId] } }, {}, { limit: 1, state: true, watch: true })
      .then((channels) => {
        if (cancelled) return;
        if (!channels.length) {
          setState("missing");
          return;
        }
        setChannel(channels[0]);
        setState("ready");
        void channels[0].markRead().catch(() => undefined);
      })
      .catch((err) => {
        console.error("[VicChat] channel open failed", err);
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [client, channelId, selfId]);

  const title = useMemo(() => getVicChannelTitle(channel?.data as Record<string, unknown> | undefined), [channel]);
  const other = channel ? Object.values(channel.state.members).find((member) => member.user_id !== selfId)?.user : undefined;

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/chat", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[60] flex h-[100dvh] w-screen flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-3 pb-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button type="button" onClick={goBack} className="rounded-full p-2 text-neutral-700 active:bg-neutral-100" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </button>
        {other?.image ? <img src={String(other.image)} alt="" className="h-9 w-9 rounded-full object-cover" /> : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">{other?.name || "Conversation"}</p>
          <p className="truncate text-[11px] text-neutral-500">{title}</p>
        </div>
      </header>

      <div className="vic-stream-chat min-h-0 flex-1">
        {state === "ready" && channel ? (
          <>
            <ActiveChannel channel={channel} />
            <ChannelComponent>
              <Window>
                <MessageList />
                <MessageComposer />
              </Window>
              <Thread />
            </ChannelComponent>
          </>
        ) : state === "loading" ? (
          <ChatState loading>Opening conversation…</ChatState>
        ) : state === "missing" ? (
          <ChatState>
            <p>This conversation is not available.</p>
            <button type="button" onClick={() => navigate("/chat", { replace: true })} className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white">
              All conversations
            </button>
          </ChatState>
        ) : (
          <ChatState>
            <p>Could not open this conversation.</p>
          </ChatState>
        )}
      </div>
    </div>
  );
}

export default function VicChat() {
  const { user } = useAuth();
  const { channelId } = useParams();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setError("");
    getVicChatClient({ id: user.id, Name: user.Name, Picture: user.Picture })
      .then((next) => {
        if (!cancelled) setClient(next);
      })
      .catch((err) => {
        console.error("[VicChat] connect failed", err);
        if (!cancelled) setError("Chat could not connect. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.Name, user?.Picture, attempt]);

  if (error) {
    return (
      <ChatState>
        <p>{error}</p>
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white">
          Retry
        </button>
      </ChatState>
    );
  }

  if (!client?.userID) return <ChatState loading>Connecting…</ChatState>;

  return (
    <Chat client={client} theme="str-chat__theme-light">
      {channelId ? (
        <ConversationView client={client} selfId={client.userID} channelId={decodeURIComponent(channelId)} />
      ) : (
        <ChannelListView client={client} selfId={client.userID} />
      )}
    </Chat>
  );
}
