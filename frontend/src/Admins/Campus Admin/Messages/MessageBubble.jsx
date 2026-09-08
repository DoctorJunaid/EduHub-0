import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function MessageBubble({ message, outgoing, initials }) {
  return (
    <div className={`message-row${outgoing ? " message-row-outgoing" : ""}`}>
      {!outgoing && (
        <Avatar className="messages-avatar">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
      <div className="message-content">
        <div className="message-bubble">{message.body}</div>
        <time dateTime={message.createdAt}>
          {new Date(message.createdAt).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </time>
      </div>
    </div>
  );
}
