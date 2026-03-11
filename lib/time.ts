export function timeAgo(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return dateStr;

  const diff = Date.now() - time;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatTimestamp(dateStr, { includeSeconds: false, includeTimeZone: false });
}

export function formatTimestamp(
  input?: string,
  options?: { includeSeconds?: boolean; includeTimeZone?: boolean }
): string {
  if (!input) {
    return "Unknown";
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: options?.includeSeconds === false ? undefined : "2-digit",
    timeZoneName: options?.includeTimeZone === false ? undefined : "short",
  });
}
