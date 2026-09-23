import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MessageCircle, MoreVertical, Paperclip, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { filterConversations, LOCAL_SENDER_ID, messageSent, selectConversations } from "@/store/Slices/messagesSlice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import { selectTimetable } from "@/store/Slices/timetableSlice";
import { selectStudents } from "@/store/Slices/studentsSlice";
import "./TeacherMessages.css";

const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
const dateLabel = (stamp) => { const date = new Date(stamp); const today = new Date(); const yesterday = new Date(); yesterday.setDate(today.getDate() - 1); if (date.toDateString() === today.toDateString()) return "Today"; if (date.toDateString() === yesterday.toDateString()) return "Yesterday"; return date.toLocaleDateString([], { dateStyle: "medium" }); };

export default function TeacherMessages() {
  const dispatch = useDispatch();
  const conversations = useSelector(selectConversations);
  const user = useSelector(selectCurrentUser);
  const timetable = useSelector(selectTimetable);
  const students = useSelector(selectStudents);
  const [selectedId, setSelectedId] = useState(() => conversations[0]?.id || null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const history = useRef(null);
  const teacherId = user?.id || user?._id;
  const teacherName = user?.name || user?.fullName;
  const assignedClassIds = new Set(timetable.filter((row) => (teacherId || teacherName) && (row.teacherId === teacherId || row.instructorId === teacherId || row.instructor === teacherName || row.teacherName === teacherName)).map((row) => row.id || row._id));
  const assignedStudentIds = new Set(students.filter((student) => timetable.some((row) => assignedClassIds.has(row.id || row._id) && (student.section || "") === (row.section || row.className || ""))).map((student) => student.id || student._id));
  const authorizedConversations = conversations.filter((conversation) => conversation.participantType === "faculty" || assignedStudentIds.has(conversation.participantId));
  const selected = authorizedConversations.find((conversation) => conversation.id === selectedId);
  const visible = filterConversations(authorizedConversations, search);
  useEffect(() => { if (!selected && authorizedConversations[0]) setSelectedId(authorizedConversations[0].id); }, [selected, authorizedConversations]);
  useEffect(() => { if (history.current) history.current.scrollTop = history.current.scrollHeight; }, [selectedId, selected?.messages.length]);
  const send = () => { if (!selected || !draft.trim()) return; dispatch(messageSent({ participantId: selected.participantId, participantType: selected.participantType, body: draft })); setDraft(""); };
  return <main className="teacher-messages" aria-label="Teacher messages"><div className="teacher-messages-heading"><div><p className="page-eyebrow">Home / Messages</p><h1>Messages</h1></div></div><section className="teacher-messages-workspace"><aside className="teacher-conversation-panel" aria-label="Conversations"><label className="teacher-message-search"><Search size={17} /><span className="sr-only">Search messages</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages..." /></label><div className="teacher-conversation-list">{visible.map((conversation) => <button type="button" key={conversation.id} className={`teacher-conversation-item ${selectedId === conversation.id ? "selected" : ""}`} onClick={() => setSelectedId(conversation.id)}><Avatar><AvatarFallback>{conversation.participant.initials || initials(conversation.participant.name)}</AvatarFallback></Avatar><span><strong>{conversation.participant.name}</strong><small>{conversation.lastMessage || "No previous messages"}</small></span></button>)}{!visible.length && <p className="teacher-message-empty">{conversations.length ? "No matching conversations." : "No conversations available."}</p>}</div></aside><div className="teacher-chat-panel">{selected ? <><header className="teacher-chat-header"><Avatar><AvatarFallback>{selected.participant.initials || initials(selected.participant.name)}</AvatarFallback></Avatar><div><h2>{selected.participant.name}</h2><p>{selected.participantType === "faculty" ? selected.participant.designation || "Faculty" : "Student"} · Directory contact</p></div><Button variant="ghost" size="icon" disabled aria-label="Conversation menu unavailable"><MoreVertical size={19} /></Button></header><div className="teacher-message-history" ref={history} role="log" aria-live="polite">{selected.messages.length ? selected.messages.map((message) => <div key={message.id} className={`teacher-message-row ${message.senderId === LOCAL_SENDER_ID ? "outgoing" : ""}`}>{message.senderId !== LOCAL_SENDER_ID && <Avatar><AvatarFallback>{selected.participant.initials || initials(selected.participant.name)}</AvatarFallback></Avatar>}<div><p>{message.body}</p><time dateTime={message.createdAt}>{dateLabel(message.createdAt)} · {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></div></div>) : <div className="teacher-message-empty"><MessageCircle size={28} /><span>No messages in this conversation yet.</span></div>}</div><form className="teacher-message-composer" onSubmit={(event) => { event.preventDefault(); send(); }}><Button type="button" variant="ghost" size="icon" disabled aria-label="Attachments unavailable" title="File uploads are not supported"><Paperclip size={18} /></Button><textarea rows="1" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Type your message..." aria-label="Message" /><Button type="submit" size="icon" className="teacher-send" disabled={!draft.trim()} aria-label="Send message"><Send size={18} /></Button></form><p className="teacher-messages-demo">Frontend demo: messages are saved in this browser only.</p></> : <div className="teacher-message-empty teacher-no-selection"><MessageCircle size={32} /><strong>Select a conversation to start messaging.</strong></div>}</div></section></main>;
}
