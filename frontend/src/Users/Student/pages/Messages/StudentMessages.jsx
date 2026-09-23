import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  SquarePen,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  selectStudentConversations,
  searchStudentConversations,
  replyToStudentConversation,
} from "@/store/selectors/studentMessages";
import "./StudentMessages.css";

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
function ConversationPanel({ conversation, onBack }) {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const history = useRef(null);
  useEffect(() => {
    if (history.current)
      history.current.scrollTop = history.current.scrollHeight;
  }, [conversation.messages.length]);
  const send = () => {
    if (!draft.trim()) return;
    Promise.resolve(
      dispatch(
        replyToStudentConversation({
          conversationId: conversation.id,
          body: draft,
        }),
      ),
    ).then((problem) => {
      if (problem) setError(problem);
      else {
        setDraft("");
        setError("");
      }
    });
  };
  return (
    <>
      <header className="sm-chat-header">
        <Button
          className="sm-back"
          variant="ghost"
          size="icon"
          aria-label="Back to inbox"
          onClick={onBack}
        >
          <ArrowLeft />
        </Button>
        <Avatar>
          <AvatarFallback>
            {conversation.participant?.initials || initials(conversation.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2>{conversation.name}</h2>
          <p>{conversation.role}</p>
        </div>
      </header>
      <div
        className="sm-history"
        ref={history}
        role="log"
        aria-label={`Conversation with ${conversation.name}`}
        aria-live="polite"
      >
        <p className="sm-log-label">Conversation Log</p>
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`sm-message${message.senderId === conversation.self ? " sm-outgoing" : ""}`}
          >
            {message.senderId !== conversation.self && (
              <Avatar>
                <AvatarFallback>
                  {conversation.participant?.initials ||
                    initials(conversation.name)}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="sm-bubble">{message.body}</p>
              <time dateTime={message.createdAt}>
                {new Date(message.createdAt).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            </div>
          </div>
        ))}
        {!conversation.messages.length && (
          <p className="sm-empty">No messages in this conversation yet.</p>
        )}
      </div>
      <form
        className="sm-composer"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <p className="sm-demo">Messages are sent through your school portal.</p>
        {error && (
          <p role="alert" className="sm-error">
            {error}
          </p>
        )}
        <div className="sm-composer-field">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled
            aria-label="Attachments unavailable"
            title="File uploads are not supported"
          >
            <Paperclip />
          </Button>
          <Textarea
            aria-label="Message"
            rows={1}
            placeholder="Type your message..."
            value={draft}
            disabled={!conversation.participant}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                send();
              }
            }}
          />
          <Button
            type="submit"
            className="sm-send"
            size="icon"
            aria-label="Send message"
            disabled={!draft.trim() || !conversation.participant}
          >
            <Send />
          </Button>
        </div>
      </form>
    </>
  );
}
export default function StudentMessages() {
  const conversations = useSelector(selectStudentConversations);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const rowButtons = useRef(new Map());
  const conversation = conversations.find((row) => row.id === selected);
  const visible = searchStudentConversations(conversations, search);
  const back = () => {
    const previousId = selected;
    setSelected(null);
    requestAnimationFrame(() => rowButtons.current.get(previousId)?.focus());
  };
  return (
    <section
      className={`student-messages-page${conversation ? " sm-chat-selected" : ""}`}
      aria-label="Student messages"
    >
      <Card className="sm-inbox">
        <header className="sm-inbox-header">
          <div>
            <h1>Messages &amp; Inbox</h1>
            <Button
              variant="ghost"
              size="icon"
              disabled
              aria-label="New message unavailable"
              title="Recipient permissions are not configured"
            >
              <SquarePen />
            </Button>
          </div>
          <label className="sm-search">
            <Search aria-hidden="true" />
            <Input
              aria-label="Search conversations"
              placeholder="Search conversations..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </header>
        <div className="sm-conversations">
          {visible.map((row) => (
            <button
              key={row.id}
              ref={(node) => {
                if (node) rowButtons.current.set(row.id, node);
                else rowButtons.current.delete(row.id);
              }}
              className={`sm-conversation${row.id === selected ? " is-selected" : ""}`}
              aria-pressed={row.id === selected}
              onClick={() => setSelected(row.id)}
            >
              <Avatar>
                <AvatarFallback>
                  {row.participant?.initials || initials(row.name)}
                </AvatarFallback>
              </Avatar>
              <span>
                <strong>{row.name}</strong>
                <small>{row.lastMessage}</small>
              </span>
            </button>
          ))}
          {!visible.length && (
            <p className="sm-empty">
              {search.trim()
                ? "No matching conversations."
                : "No conversations yet."}
            </p>
          )}
        </div>
      </Card>
      <Card className="sm-chat">
        {conversation ? (
          <ConversationPanel
            key={conversation.id}
            conversation={conversation}
            onBack={back}
          />
        ) : (
          <div className="sm-no-selection">
            <MessageCircle aria-hidden="true" />
            <h2>Select a conversation to start messaging.</h2>
            <p>Your existing conversations will appear in the inbox.</p>
          </div>
        )}
      </Card>
    </section>
  );
}
