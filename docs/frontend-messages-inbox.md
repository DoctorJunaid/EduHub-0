# Messages & Inbox Implementation

## Requested Work
Implement a functional frontend inbox at `/messages`, within the existing Campus Admin layout, using Redux Toolkit and browser persistence.

## Reference Screenshot
The supplied screenshot guides the two-column panels, rounded search, green selected row, initials, chat header, conversation log, bubbles, and bottom composer. Existing Sidebar, Header, breadcrumbs and theme controls are unchanged. Actual directory identities replace screenshot-only people. Empty histories are intentional: no existing messages or reliable historical timestamps were found.

## Feature Structure
Messages UI lives in `frontend/src/Admins/Campus Admin/Messages/`. Campus Admin navigation includes a Messages link after Fee Management; App resolves `/messages` to the inbox. Desktop panes scroll independently; smaller screens stack a bounded list and chat pane.

## Participant Data Integration
The memoized selector joins current `students.records` and `faculty.records` by ID. Available directory contacts have empty conversation views until a first local message is sent; no fabricated received chats are seeded. Directory additions and edits appear automatically. Deleted contacts disappear from the list while their saved history remains in storage. No separate participant database exists. The Header and Sidebar contain display-only admin text, with no authenticated account state, so outgoing messages use a documented local sender marker. Directory status is displayed as directory status, never simulated online presence.

## Conversation Data Model
Persisted records: `{ id, participantId, participantType, messages, updatedAt }`. Conversation IDs combine participant type and directory ID. Last-message text and participant profile are derived rather than duplicated. Records are created on first send. Most recently updated conversations sort first; empty contacts retain directory order without fabricated timestamps.

## Message Data Model
`{ id, conversationId, senderId, receiverId, body, createdAt }`. IDs use Redux Toolkit nanoid. Local sends receive actual ISO timestamps. Bubbles support either sender direction and render full local dates and times. No receipt, delivery or upload fields are invented.

## Redux Changes
Added `messagesSlice.js` to the existing store, containing the send reducer, joined selector, search helper and hydration validation. No additional store or Provider.

## Persistence
The existing persistence utility stores version 1 records under `eduhub_messages`. Refresh restores histories and derives previews from the restored messages. Invalid JSON, unsupported versions, malformed records, duplicate IDs, invalid timestamps and inconsistent sender/receiver pairs fall back to an empty valid slice. Storage failures retain usable in-memory Redux state under the existing helper's behavior; browser persistence requires available storage.

## Conversation Search
Case-insensitive, trimmed search across current participant name, email and last message text. A no-match message appears when filtering removes all rows.

## Selected Conversation
Local selected ID controls both the highlighted row and chat pane. The first available contact is selected on page mount. Selection is not persisted. Missing/deleted selection shows a blank-chat prompt. Filtering does not discard an open conversation.

## Message Composer
Shared Textarea and Buttons provide a multiline composer. Drafts are local and cleared when switching conversations. The composer remains outside the scrolling message history.

## Send Behavior
Click Send or press Enter to trim and append text, clear the draft, update ordering/preview, persist and scroll history to the newest message. Shift+Enter inserts a newline; IME composition is respected. Whitespace-only messages are blocked by both UI and reducer. Messaging is local to this browser and does not deliver to participants.

## Attachment Behavior
Disabled paperclip with accessible unavailable label; file uploads are pending. No local file contents or server uploads are stored.

## Conversation Menu
Disabled three-dot control with accessible unavailable label. No unapproved actions were introduced.

## Reusable Components Used
MainLayout, Sidebar, Header, Avatar, AvatarFallback, Input, Textarea and Button. No shared EmptyState, SearchInput or ScrollArea implementation was found; simple feature-specific empty content and native overflow are used.

## New Reusable Components
MessageBubble renders either message direction and timestamps. MessageComposer owns the draft, validation and keyboard behavior.

## Files Created
- `frontend/src/Admins/Campus Admin/Messages/Messages.jsx`
- `frontend/src/Admins/Campus Admin/Messages/Messages.css`
- `frontend/src/Admins/Campus Admin/Messages/MessageBubble.jsx`
- `frontend/src/Admins/Campus Admin/Messages/MessageComposer.jsx`
- `frontend/src/store/Slices/messagesSlice.js`
- `frontend/src/store/Slices/messagesSlice.test.js`
- `docs/frontend-messages-inbox.md`

## Files Modified
- `frontend/src/constants/navigation.jsx` (add the missing Campus Admin Messages link)
- `frontend/src/App.jsx`
- `frontend/src/store/store.js`
- `frontend/src/store/persistence.js`
- `frontend/src/store/persistence.test.js` (include messaging in the existing persistence test store)

## Verification
- State/regression tests: `node --test src/store/Slices/*.test.js src/store/persistence.test.js` — 55 passed, 0 failed. Includes messaging send, whitespace validation, separate histories, sorting, name/email/message search, directory edits/deletion, refresh reconstruction and corrupt storage.
- Lint: `npm.cmd run lint` — exit 0; pre-existing Fast Refresh warnings in `tabs.jsx`, `Badge.jsx`, and `Button.jsx`.
- Build: `npm.cmd run build` — PASS. Vite reports a bundle-size warning (main JavaScript chunk approximately 549 kB); no build errors.
- PowerShell blocks the npm.ps1 shim; npm.cmd runs the same package scripts without changing execution policy.
- Browser automation is unavailable in this environment. Screenshot fidelity, rendered responsive/dark layouts, click/keyboard behavior and scrolling require a browser smoke check; code review and state tests do not substitute for these checks.
- Backend and landing-ui were not modified; shared layout files were not modified.

## Deferred Backend Features
Realtime messaging, server delivery, online presence, file uploads, and read receipts. Authentication-backed sender identity awaits actual auth state/backend integration.
