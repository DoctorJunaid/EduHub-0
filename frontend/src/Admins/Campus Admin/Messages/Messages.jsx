import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MessageSquare, MoreVertical, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  filterConversations,
  LOCAL_SENDER_ID,
  messageSent,
  selectConversations,
} from "@/store/Slices/messagesSlice.js";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import "./Messages.css";

export default function Messages() {
  const dispatch = useDispatch();
  const conversations = useSelector(selectConversations);
  const [selectedId, setSelectedId] = useState(
    () => conversations[0]?.id ?? null,
  );
  const [search, setSearch] = useState("");
  const selected = conversations.find(
    (conversation) => conversation.id === selectedId,
  );
  const visible = filterConversations(conversations, search);
  const history = useRef(null);
  useEffect(() => {
    if (history.current)
      history.current.scrollTop = history.current.scrollHeight;
  }, [selectedId, selected?.messages.length]);

  return (
    <section className="messages-page" aria-label="Messages">
      <div className="messages-workspace">
        <aside className="conversation-panel" aria-label="Conversations">
          <div className="conversation-search">
            <Search size={19} aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search conversations"
              placeholder="Search conversations..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="conversation-list">
            {visible.map((conversation) => (
              <button
                type="button"
                className={`conversation-item${selectedId === conversation.id ? " is-selected" : ""}`}
                aria-pressed={selectedId === conversation.id}
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
              >
                <Avatar className="messages-avatar">
                  <AvatarFallback>
                    {conversation.participant.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="conversation-summary">
                  <span className="conversation-name">
                    <strong>{conversation.participant.name}</strong>
                    <small title="Directory status; not live presence">
                      {conversation.participant.status}
                    </small>
                  </span>
                  <span className="conversation-preview">
                    {conversation.lastMessage || "No previous messages"}
                  </span>
                </span>
              </button>
            ))}
            {!visible.length && (
              <p className="messages-empty">
                {conversations.length
                  ? "No conversations match your search."
                  : "No student or faculty contacts available."}
              </p>
            )}
          </div>
        </aside>
        <div className="chat-panel">
          {selected ? (
            <>
              <header className="chat-header">
                <Avatar className="messages-avatar">
                  <AvatarFallback>
                    {selected.participant.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2>{selected.participant.name}</h2>
                  <p title="Status from the directory; not live presence">
                    {selected.participantType === "faculty"
                      ? selected.participant.designation || "Faculty"
                      : "Student"}
                    {selected.participant.status &&
                      ` · ${selected.participant.status}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled
                  aria-label="Conversation menu unavailable"
                  title="Conversation actions pending"
                >
                  <MoreVertical size={20} />
                </Button>
              </header>
              <div
                className="message-history"
                ref={history}
                role="log"
                aria-label={`Messages with ${selected.participant.name}`}
                aria-live="polite"
              >
                <div className="conversation-log">Conversation Log</div>
                {selected.messages.length ? (
                  selected.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      outgoing={message.senderId === LOCAL_SENDER_ID}
                      initials={selected.participant.initials}
                    />
                  ))
                ) : (
                  <div className="messages-empty">
                    <MessageSquare size={26} aria-hidden="true" />
                    <p>No messages yet</p>
                    <small>Messages are saved in this browser only.</small>
                  </div>
                )}
              </div>
              <MessageComposer
                key={selected.id}
                onSend={(body) =>
                  dispatch(
                    messageSent({
                      participantId: selected.participantId,
                      participantType: selected.participantType,
                      body,
                    }),
                  )
                }
              />
            </>
          ) : (
            <div className="messages-empty chat-empty">
              <MessageSquare size={30} aria-hidden="true" />
              <p>Select a conversation to view messages.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
