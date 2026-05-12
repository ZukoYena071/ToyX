const STORAGE_KEY = "toyx_chat_read";

function getReadTimestamps(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function markExchangeRead(exchangeId: number) {
  const stamps = getReadTimestamps();
  stamps[String(exchangeId)] = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stamps));
}

export function getUnreadExchanges(exchanges: any[], currentUserId: string): number {
  if (!exchanges) return 0;
  const stamps = getReadTimestamps();
  return exchanges.filter((ex: any) => {
    const lastMsg = ex.messages?.[ex.messages.length - 1];
    if (!lastMsg) return false;
    if (lastMsg.senderId === currentUserId) return false;
    const lastRead = stamps[String(ex.id)];
    return !lastRead || new Date(lastMsg.createdAt) > new Date(lastRead);
  }).length;
}

export function isExchangeUnread(exchange: any, currentUserId: string): boolean {
  const stamps = getReadTimestamps();
  const lastMsg = exchange.messages?.[exchange.messages.length - 1];
  if (!lastMsg || lastMsg.senderId === currentUserId) return false;
  const lastRead = stamps[String(exchange.id)];
  return !lastRead || new Date(lastMsg.createdAt) > new Date(lastRead);
}
