import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, MessageCircle, Paperclip, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { selectFaculty } from "@/store/Slices/facultySlice";
import { participantMessageSent } from "@/store/Slices/messagesSlice";
import {
  selectAssignedTeacherClasses,
  selectTeacherIdentity,
  selectStudentsForAssignedClasses,
  studentIdentityKey,
  teacherIdentityKey,
  teacherMayContactFaculty,
} from "./teacherScope";
import { participantConversationId } from "@/store/participantConversations";
import "./TeacherMessages.css";

const initials = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
const dateLabel = (stamp) => {
  const date = new Date(stamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { dateStyle: "medium" });
};

export default function TeacherMessages() {
  const dispatch = useDispatch();
  const teacher = useSelector(selectTeacherIdentity);
  const classes = useSelector(selectAssignedTeacherClasses);
  const assignedStudents = useSelector(selectStudentsForAssignedClasses);
  const faculty = useSelector(selectFaculty);
  const records = useSelector((state) => state.messages.records);
  const history = useRef(null);
  const [selectedId, setSelectedId] = useState("");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const self = teacherIdentityKey(teacher);
  const contacts = useMemo(() => {
    const studentContacts = assignedStudents.map((person) => ({
      participant: person,
      participantId: studentIdentityKey(person.id || person._id),
      participantType: "student",
    }));
    const coworkerContacts = faculty
      .filter((person) => teacherMayContactFaculty(teacher, classes, person.id || person._id))
      .map((person) => ({
        participant: person,
        participantId: `faculty:${person.id || person._id}`,
        participantType: "faculty",
      }));
    const allowed = [...studentContacts, ...coworkerContacts];
    return allowed.map((contact) => {
      const conversation = records.find(
        (record) => record.participantIds?.includes(self) && record.participantIds?.includes(contact.participantId),
      );
      const id = conversation?.id || participantConversationId([self, contact.participantId]);
      const messages = conversation?.messages || [];
      return { ...contact, id, messages, lastMessage: messages.at(-1)?.body || "No previous messages", updatedAt: conversation?.updatedAt || null };
    }).sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
  }, [assignedStudents, faculty, teacher, classes, records, self]);
  const visible = contacts.filter((contact) =>
    `${contact.participant.name} ${contact.participant.email || ""} ${contact.messages.map((message) => message.body).join(" ")}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const selected = contacts.find((contact) => contact.id === selectedId) || contacts[0];
  const activeConversationId = selected?.id || "";
  useEffect(() => {
    if (history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [selectedId, selected?.messages.length]);
  const send = () => {
    if (!selected || !draft.trim() || !self) return;
    dispatch(participantMessageSent({
      conversationId: selected.id,
      senderId: self,
      receiverId: selected.participantId,
      body: draft,
    }));
    setDraft("");
  };

  return (
    <main className="teacher-messages" aria-labelledby="teacher-messages-title">
      <h1 id="teacher-messages-title" className="sr-only">Messages</h1>
      <section className={`teacher-messages-workspace ${mobileDetailOpen ? "mobile-detail-open" : ""}`}>
        <aside className="teacher-conversation-panel" aria-label="Conversations">
          <label className="teacher-message-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search messages</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages..." />
          </label>
          <div className="teacher-conversation-list">
            {visible.map((conversation) => (
              <button type="button" key={conversation.id} className={`teacher-conversation-item ${activeConversationId === conversation.id ? "selected" : ""}`} onClick={() => { setSelectedId(conversation.id); setMobileDetailOpen(true); }}>
                <Avatar><AvatarFallback>{conversation.participant.initials || initials(conversation.participant.name)}</AvatarFallback></Avatar>
                <span><strong>{conversation.participant.name}</strong><small>{conversation.lastMessage}</small></span>
              </button>
            ))}
            {!visible.length && <p className="teacher-message-empty">{contacts.length ? "No matching conversations." : "No student or colleague contacts are available for your assigned classes."}</p>}
          </div>
        </aside>
        <div className="teacher-chat-panel">
          {selected ? <>
            <header className="teacher-chat-header">
              <Button type="button" className="teacher-message-back" variant="ghost" size="icon" onClick={() => setMobileDetailOpen(false)} aria-label="Back to conversations"><ArrowLeft size={18} /></Button>
              <Avatar><AvatarFallback>{selected.participant.initials || initials(selected.participant.name)}</AvatarFallback></Avatar>
              <div><h2>{selected.participant.name}</h2><p>{selected.participantType === "faculty" ? selected.participant.designation || "Faculty colleague" : "Student"}</p></div>
            </header>
            <div className="teacher-message-history" ref={history} role="log" aria-live="polite">
              {selected.messages.length ? selected.messages.map((message) => (
                <div key={message.id} className={`teacher-message-row ${message.senderId === self ? "outgoing" : ""}`}>
                  {message.senderId !== self && <Avatar><AvatarFallback>{selected.participant.initials || initials(selected.participant.name)}</AvatarFallback></Avatar>}
                  <div><p>{message.body}</p><time dateTime={message.createdAt}>{dateLabel(message.createdAt)} - {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></div>
                </div>
              )) : <div className="teacher-message-empty"><MessageCircle size={28} /><span>No messages in this conversation yet.</span></div>}
            </div>
            <form className="teacher-message-composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
              <Button type="button" variant="ghost" size="icon" disabled aria-label="Attachments unavailable" title="File uploads are not supported"><Paperclip size={18} /></Button>
              <textarea rows="1" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} placeholder="Type your message..." aria-label="Message" />
              <Button type="submit" size="icon" className="teacher-send" disabled={!draft.trim()} aria-label="Send message"><Send size={18} /></Button>
            </form>
            <p className="teacher-messages-demo">Frontend demo: messages are saved in this browser, not delivered remotely.</p>
          </> : <div className="teacher-message-empty teacher-no-selection"><MessageCircle size={32} /><strong>Select a conversation to start messaging.</strong></div>}
        </div>
      </section>
    </main>
  );
}