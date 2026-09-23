import { useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function MessageComposer({ onSend }) {
  const [draft, setDraft] = useState("");
  const send = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft("");
  };
  return (
    <form
      className="message-composer"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <div className="message-composer-field">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled
          aria-label="Attachments unavailable"
          title="File uploads pending"
        >
          <Paperclip size={19} />
        </Button>
        <Textarea
          rows={1}
          aria-label="Message"
          placeholder="Type your message..."
          value={draft}
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
          size="icon"
          className="message-send"
          disabled={!draft.trim()}
          aria-label="Send message"
        >
          <Send size={19} />
        </Button>
      </div>
      <span className="sr-only">
        Messages are saved in this browser only. Shift plus Enter adds a new
        line.
      </span>
    </form>
  );
}
