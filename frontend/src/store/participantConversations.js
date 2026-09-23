export const participantKey = (type, id) => `${type}:${id}`;
export const participantConversationId = (participantIds) =>
  `thread:${encodeURIComponent([...participantIds].sort().join("::"))}`;
export function validParticipantConversation(record) {
  if (
    !record ||
    typeof record.id !== "string" ||
    !record.id.startsWith("thread:") ||
    !Array.isArray(record.participantIds) ||
    record.participantIds.length !== 2 ||
    new Set(record.participantIds).size !== 2 ||
    !record.participantIds.every(
      (id) => typeof id === "string" && /^(student|faculty):.+/.test(id),
    ) ||
    !Array.isArray(record.messages) ||
    !Number.isFinite(Date.parse(record.updatedAt))
  )
    return false;
  let previous = -Infinity;
  const ids = new Set();
  return record.messages.every((message) => {
    if (
      !message ||
      typeof message.id !== "string" ||
      !message.id ||
      ids.has(message.id) ||
      message.conversationId !== record.id ||
      !record.participantIds.includes(message.senderId) ||
      !record.participantIds.includes(message.receiverId) ||
      message.senderId === message.receiverId ||
      typeof message.body !== "string" ||
      !message.body.trim() ||
      !Number.isFinite(Date.parse(message.createdAt))
    )
      return false;
    const time = Date.parse(message.createdAt);
    if (time < previous || time > Date.parse(record.updatedAt)) return false;
    previous = time;
    ids.add(message.id);
    return true;
  });
}
