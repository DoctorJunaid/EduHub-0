import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Robot,
  PaperPlaneTilt,
  Sparkle,
  Buildings,
  GraduationCap,
  ChartBar,
  CalendarCheck,
  UserCircle,
  ArrowRight,
  CircleNotch,
  Star,
  MapPin,
  Trophy,
  CurrencyCircleDollar,
} from "@phosphor-icons/react";
import "./aiChatDemo.css";

/* ─── Pre-scripted AI responses keyed by trigger ─── */
const SCRIPTED_RESPONSES = {
  "tell me about nust": {
    type: "institute",
    data: {
      name: "NUST",
      fullName: "National University of Sciences & Technology",
      rank: "#01 National · QS #334 Global",
      placement: "98.4%",
      students: "18,500+",
      fees: "PKR 185,000 – 215,000 / Semester",
      location: "Sector H-12, Islamabad",
      rating: 4.9,
    },
  },
  "compare lums and iba": {
    type: "comparison",
    data: {
      institutions: [
        {
          name: "LUMS",
          rank: "#03",
          placement: "96.1%",
          strength: "Business & CS",
          fees: "PKR 420,000/Sem",
          rating: 4.8,
        },
        {
          name: "IBA",
          rank: "#05",
          placement: "94.8%",
          strength: "Finance & MBA",
          fees: "PKR 310,000/Sem",
          rating: 4.7,
        },
      ],
    },
  },
  "who graduated from fast": {
    type: "alumni",
    data: {
      alumni: [
        {
          name: "Osman Butt",
          role: "VP of Engineering",
          company: "Careem / Uber",
          badge: "Platform Architecture",
        },
        {
          name: "Nimra Saeed",
          role: "Principal Security Architect",
          company: "Cloudflare",
          badge: "Cyber Security",
        },
        {
          name: "Bilal Ahmed",
          role: "Staff Systems Engineer",
          company: "Stripe",
          badge: "Distributed Ledgers",
        },
      ],
    },
  },
  "upcoming events": {
    type: "events",
    data: {
      events: [
        {
          title: "Pakistan Tech Innovation Summit",
          date: "Oct 15, 2026",
          venue: "NUST H-12",
          category: "Conference",
        },
        {
          title: "National Hackathon: Pakistan 2.0",
          date: "Dec 10, 2026",
          venue: "SEECS, NUST",
          category: "Hackathon",
        },
        {
          title: "LUMS Startup Village Pitch Day",
          date: "Nov 12, 2026",
          venue: "NIC Lahore",
          category: "Entrepreneurship",
        },
      ],
    },
  },
  "what can eduhub do": {
    type: "capabilities",
    data: {
      tiers: [
        {
          role: "Super Admin",
          desc: "Global tenant provisioning & audit trails",
        },
        {
          role: "Institute Admin",
          desc: "Multi-branch enrollment & fee analytics",
        },
        {
          role: "Campus Manager",
          desc: "Timetables, exams & local admissions",
        },
        { role: "Faculty", desc: "Gradebooks, diaries & assignment grading" },
        {
          role: "Students & Parents",
          desc: "Grades, attendance & fee vouchers",
        },
      ],
    },
  },
};

const SUGGESTED_PROMPTS = [
  { label: "Tell me about NUST", icon: Buildings },
  { label: "Compare LUMS and IBA", icon: ChartBar },
  { label: "Who graduated from FAST", icon: GraduationCap },
  { label: "Upcoming events", icon: CalendarCheck },
  { label: "What can EduHub do", icon: UserCircle },
];

/* ─── Response Card Renderers ─── */
function InstituteCard({ data }) {
  return (
    <div className="ai-response-card">
      <div className="ai-card-header">
        <div className="ai-card-logo">
          <Buildings size={20} weight="duotone" />
        </div>
        <div>
          <h4 className="ai-card-title">{data.name}</h4>
          <p className="ai-card-subtitle">{data.fullName}</p>
        </div>
      </div>
      <div className="ai-card-metrics">
        <div className="ai-metric">
          <Trophy size={14} className="text-amber-500" weight="fill" />
          <span>{data.rank}</span>
        </div>
        <div className="ai-metric">
          <ChartBar size={14} className="text-emerald-500" weight="fill" />
          <span>{data.placement} Placement</span>
        </div>
        <div className="ai-metric">
          <GraduationCap size={14} className="text-blue-500" weight="fill" />
          <span>{data.students} Students</span>
        </div>
        <div className="ai-metric">
          <CurrencyCircleDollar
            size={14}
            className="text-violet-500"
            weight="fill"
          />
          <span>{data.fees}</span>
        </div>
        <div className="ai-metric">
          <MapPin size={14} className="text-rose-500" weight="fill" />
          <span>{data.location}</span>
        </div>
        <div className="ai-metric">
          <Star size={14} className="text-amber-400" weight="fill" />
          <span>{data.rating} / 5.0</span>
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({ data }) {
  return (
    <div className="ai-comparison-grid">
      {data.institutions.map((inst) => (
        <div key={inst.name} className="ai-response-card ai-comparison-item">
          <h4 className="ai-card-title">{inst.name}</h4>
          <div className="ai-card-metrics">
            <div className="ai-metric">
              <Trophy size={13} className="text-amber-500" weight="fill" />
              <span>Rank {inst.rank}</span>
            </div>
            <div className="ai-metric">
              <ChartBar size={13} className="text-emerald-500" weight="fill" />
              <span>{inst.placement}</span>
            </div>
            <div className="ai-metric">
              <Sparkle size={13} className="text-blue-500" weight="fill" />
              <span>{inst.strength}</span>
            </div>
            <div className="ai-metric">
              <CurrencyCircleDollar
                size={13}
                className="text-violet-500"
                weight="fill"
              />
              <span>{inst.fees}</span>
            </div>
            <div className="ai-metric">
              <Star size={13} className="text-amber-400" weight="fill" />
              <span>{inst.rating} / 5.0</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlumniCard({ data }) {
  return (
    <div className="ai-alumni-list">
      {data.alumni.map((a) => (
        <div key={a.name} className="ai-alumni-item">
          <div className="ai-alumni-avatar">{a.name.charAt(0)}</div>
          <div className="ai-alumni-info">
            <span className="ai-alumni-name">{a.name}</span>
            <span className="ai-alumni-role">
              {a.role} @ {a.company}
            </span>
          </div>
          <span className="ai-alumni-badge">{a.badge}</span>
        </div>
      ))}
    </div>
  );
}

function EventsCard({ data }) {
  return (
    <div className="ai-events-list">
      {data.events.map((ev) => (
        <div key={ev.title} className="ai-event-item">
          <div className="ai-event-date">
            <CalendarCheck
              size={16}
              className="text-emerald-500"
              weight="duotone"
            />
            <span>{ev.date}</span>
          </div>
          <h5 className="ai-event-title">{ev.title}</h5>
          <p className="ai-event-venue">
            {ev.venue} · {ev.category}
          </p>
        </div>
      ))}
    </div>
  );
}

function CapabilitiesCard({ data }) {
  return (
    <div className="ai-capabilities-list">
      {data.tiers.map((t) => (
        <div key={t.role} className="ai-capability-item">
          <span className="ai-capability-role">{t.role}</span>
          <span className="ai-capability-desc">{t.desc}</span>
        </div>
      ))}
    </div>
  );
}

function ResponseRenderer({ response }) {
  if (!response) return null;
  switch (response.type) {
    case "institute":
      return <InstituteCard data={response.data} />;
    case "comparison":
      return <ComparisonCard data={response.data} />;
    case "alumni":
      return <AlumniCard data={response.data} />;
    case "events":
      return <EventsCard data={response.data} />;
    case "capabilities":
      return <CapabilitiesCard data={response.data} />;
    default:
      return null;
  }
}

const INTRO_TEXTS = {
  "tell me about nust":
    "Here's the verified intelligence profile for NUST — Pakistan's top-ranked STEM institution:",
  "compare lums and iba":
    "Here's a side-by-side comparison of LUMS and IBA based on verified institutional data:",
  "who graduated from fast":
    "Here are notable FAST-NUCES alumni now working at top global technology companies:",
  "upcoming events":
    "Here are the upcoming campus events across EduHub member institutions:",
  "what can eduhub do":
    "EduHub operates across 5 governance tiers with strict role-scoped access control:",
};

/* ─── Main Component ─── */
export default function AIChatDemo() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text) => {
    const query = (text || inputValue).trim();
    if (!query || isTyping) return;

    const normalizedQuery = query.toLowerCase();
    setInputValue("");
    setShowSuggestions(false);

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text: query }]);

    // Find matching response
    const matchKey = Object.keys(SCRIPTED_RESPONSES).find(
      (key) => normalizedQuery.includes(key) || key.includes(normalizedQuery),
    );

    // Simulate AI thinking
    setIsTyping(true);
    const thinkDelay = 800 + Math.random() * 700;

    setTimeout(() => {
      if (matchKey) {
        const introText = INTRO_TEXTS[matchKey] || "Here's what I found:";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: introText,
            response: SCRIPTED_RESPONSES[matchKey],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "I can help you explore institutions, compare universities, view alumni profiles, check upcoming events, and understand EduHub's governance tiers. Try one of the suggested prompts!",
            response: null,
          },
        ]);
        setShowSuggestions(true);
      }
      setIsTyping(false);
    }, thinkDelay);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="ai-chat-section" id="ai">
      {/* Section Header */}
      <motion.div
        className="ai-section-header"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="ai-badge">
          <Sparkle size={14} weight="fill" className="text-emerald-500" />
          <span>AI-Powered Intelligence</span>
        </div>
        <h2 className="ai-section-title">
          <span className="ai-title-light">Ask anything about</span>
          <br />
          <span className="ai-title-bold text-gradient-emerald">
            Pakistan's institutions.
          </span>
        </h2>
        <p className="ai-section-subtitle">
          EduHub AI aggregates verified institutional data — rankings, fees,
          alumni placement, and campus events — into a single conversational
          interface.
        </p>
      </motion.div>

      {/* Chat Window */}
      <motion.div
        className="ai-chat-window"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      >
        {/* Window Chrome */}
        <div className="ai-window-chrome">
          <div className="ai-window-dots">
            <span className="ai-dot ai-dot-red" />
            <span className="ai-dot ai-dot-yellow" />
            <span className="ai-dot ai-dot-green" />
          </div>
          <div className="ai-window-title">
            <Robot size={16} weight="duotone" className="text-emerald-500" />
            <span>EduHub AI Assistant</span>
            <span className="ai-status-dot" />
          </div>
          <div className="ai-window-badge">Gemini Flash</div>
        </div>

        {/* Messages Area */}
        <div className="ai-messages-area">
          {/* Welcome Message */}
          {messages.length === 0 && !isTyping && (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">
                <Robot size={36} weight="duotone" />
              </div>
              <h3>EduHub AI Assistant</h3>
              <p>
                Ask me about institutions, rankings, alumni, events, or platform
                capabilities.
              </p>
            </div>
          )}

          {/* Chat Messages */}
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                className={`ai-message ai-message-${msg.role}`}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {msg.role === "assistant" && (
                  <div className="ai-avatar">
                    <Robot size={18} weight="duotone" />
                  </div>
                )}
                <div className={`ai-bubble ai-bubble-${msg.role}`}>
                  <p className="ai-bubble-text">{msg.text}</p>
                  {msg.response && <ResponseRenderer response={msg.response} />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              className="ai-message ai-message-assistant"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="ai-avatar">
                <Robot size={18} weight="duotone" />
              </div>
              <div className="ai-bubble ai-bubble-assistant ai-typing-bubble">
                <div className="ai-typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompts */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              className="ai-suggestions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  className="ai-suggestion-chip"
                  onClick={() => handleSend(prompt.label)}
                  disabled={isTyping}
                >
                  <prompt.icon size={14} weight="duotone" />
                  <span>{prompt.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="ai-input-area">
          <input
            ref={inputRef}
            type="text"
            className="ai-input"
            placeholder="Ask EduHub AI anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          <button
            className="ai-send-btn"
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isTyping}
          >
            {isTyping ? (
              <CircleNotch size={18} weight="bold" className="ai-spinner" />
            ) : (
              <PaperPlaneTilt size={18} weight="fill" />
            )}
          </button>
        </div>
      </motion.div>
    </section>
  );
}
