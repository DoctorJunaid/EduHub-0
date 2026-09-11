# Student Messages & Inbox

## Feature Location

`frontend/src/Users/Student/pages/Messages/StudentMessages.jsx`, route `/student/messages`, inside the existing Student layout.

## Conversation Data Source

The existing `messages.records` Redux collection supports participant-addressed threads alongside legacy anonymous Admin conversations. Student selectors exclude anonymous conversations and threads belonging to other students.

## Participant Data

Names and avatars resolve from existing shared faculty and student records. Missing participants retain readable history but cannot receive replies. Presence is not invented.

## Message Data Model

Threads use a `thread:` ID, two distinct `participantIds` (`student:id` or `faculty:id`), messages, and `updatedAt`. Messages contain ID, conversation ID, sender, receiver, body, and timestamp. Validation checks membership, unique IDs, and chronological timestamps.

## Search

Case-insensitive search matches participant name, role, and latest message. Selecting a conversation opens its own history.

## Send Message Flow

The existing-thread reply thunk resolves the authenticated student's identity from current state, verifies membership and recipient availability, trims text, and rejects blank input. Enter submits; Shift+Enter inserts a newline. No recipient creation is exposed.

## Persistence

The existing centralized localStorage persistence saves threads and replies. The composer explicitly identifies browser-local demo messaging. Central preview seeds are documented in [Student demo data](student-demo-data.md).

## Realtime Backend Status

Frontend only. Messages are not delivered remotely and no realtime connection or read receipts are simulated.

## Attachment Status

Attachment and new-conversation controls are disabled with explanatory labels until upload and recipient permissions are defined.

## Future Teacher Integration

The participant model supports faculty identities. A backend must enforce membership and delivery; frontend guards are not server authorization.

## Reusable Components

Existing Card, Button, Input, Textarea, Avatar, shared header and sidebar.

## Responsive Behavior

Desktop uses inbox and conversation columns. Mobile shows the list or selected chat, with a back action that restores list focus.

## Internal Scrolling

Conversation list and history scroll independently inside the available viewport. The composer remains visible; new messages scroll the history to its end.

## Files Created

Messages page/CSS, `store/participantConversations.js`, `store/selectors/studentMessages.js`, selector tests, and this documentation.

## Files Modified

Student route exports, application routes/navigation, shared messages reducer validation/reply support, and shared demo initialization. Admin and Teacher page implementations and backend code are unchanged.

## Verification

Selector tests cover personal isolation, legacy compatibility, blank input, sender validation, preview/search updates, and persistence. Browser checks cover desktop/mobile layout, dark mode, sending, scrolling, and back navigation. Production build and lint are included in final validation.

## Pending Backend Requirements

Authenticated membership enforcement, recipient permissions, message storage/delivery, attachment handling, and optional presence/read receipts.
